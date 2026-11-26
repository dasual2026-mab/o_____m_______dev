// 서버 API의 공통 틀. 모든 창구는 이 관문을 지난다. 기술설계_4 2장
//
// 관문의 차례 (2.8)
//   1 앱 판          OM-1005
//   2 점검           OM-1006
//   3 요청 제한      OM-1429
//   4 접속 인증값    OM-1001
//   5 기기 연결      OM-1002
//   6 계정 잠금      OM-1004
//   7 재인증         OM-1003
//   8 이용 제한      OM-2001

import { compareVersion, type Config } from "./config.ts";
import { pseudonym, verifyAccessToken } from "./crypto.ts";
import type { Sql } from "./db.ts";
import {
  API_METHOD,
  type EndpointDef,
  HEADERS,
  INACTIVE_REAUTH_DAYS,
  PLATFORMS,
  RATE_LIMITS,
  type RateLimitName,
  type ReauthReason,
  type Restriction,
  type UnlinkReason,
} from "./defs/index.ts";
import { errorFields, type Logger } from "./log.ts";
import { hitRateLimit } from "./ratelimit.ts";
import { ApiError, fail, ok } from "./respond.ts";

/** 요청 본문의 상한. 사진을 올리는 창구는 따로 받는다. */
const MAX_JSON_BYTES = 256 * 1024;

export interface Session {
  linkId: string;
  accountId: string;
  /** 재인증이 필요하면 그 까닭. 아니면 null */
  reauth: ReauthReason | null;
}

export interface Ctx<B = Record<string, unknown>> {
  /** 중복 요청을 확인하는 창구에서는 한 묶음(트랜잭션)이다 */
  sql: Sql;
  config: Config;
  body: B;
  now: Date;
  requestId: string;
  appVersion: string;
  session: Session | null;
}

export interface Route {
  def: EndpointDef;
  /** 요청 제한의 이름. 13.1 */
  rate?: RateLimitName;
  /** 이용 제한으로 막는 요청인지. suspended는 정지부터, permanent는 영구 정지에서만 막는다. 2.8 */
  blockedWhen?: "suspended" | "permanent";
  // deno-lint-ignore no-explicit-any
  handler: (ctx: Ctx<any>) => Promise<unknown>;
}

export interface AppDeps {
  sql: Sql;
  config: Config;
  log: Logger;
  routes: Route[];
  /** 검사에서 시각을 바꿀 때 쓴다 */
  now?: () => Date;
}

interface LinkRow {
  link_state: "linked" | "revoked";
  revoke_reason: UnlinkReason | null;
  account_id: string;
  account_state: "active" | "locked";
  lock_reason: "reassigned" | "number_conflict" | null;
  reauth_required: boolean;
  inactive: boolean;
  restriction: Restriction;
  restriction_live: boolean;
  restriction_until: Date | null;
}

function clientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : null;
}

/** 주소에서 창구 이름을 고른다. Supabase는 앞에 함수 이름을 붙여 준다. 예: /api/v1/app/config */
function routePath(url: string): string | null {
  const { pathname, search } = new URL(url);
  // 식별자와 검색어는 주소에 넣지 않는다. 물음표 뒤 값이 있으면 받지 않는다. 2.1
  if (search) return null;
  const m = pathname.match(/\/(v1|public|hooks)\/[a-z0-9/_-]+$/);
  return m ? m[0] : null;
}

export function createApp(deps: AppDeps): (req: Request) => Promise<Response> {
  const { sql, config, log } = deps;
  const table = new Map(deps.routes.map((r) => [r.def.path, r]));

  async function gate(req: Request, route: Route, now: Date): Promise<Session | null> {
    const appVersion = req.headers.get(HEADERS.appVersion) ?? "";
    const platform = req.headers.get(HEADERS.platform) ?? "";
    if (!appVersion || !PLATFORMS.includes(platform as (typeof PLATFORMS)[number])) {
      throw new ApiError("OM-0400");
    }

    // 1, 2
    if (compareVersion(appVersion, config.minVersion) < 0) throw new ApiError("OM-1005");
    if (config.maintenance) throw new ApiError("OM-1006");

    // 접속 인증값의 서명은 데이터베이스 없이 확인한다. 요청 제한을 재는 단위를 알기 위해서다.
    let linkId: string | null = null;
    let row: LinkRow | undefined;
    if (route.def.auth === "access") {
      const header = req.headers.get(HEADERS.authorization) ?? "";
      const token = header.startsWith("Bearer ") ? header.slice(7) : "";
      linkId = token ? await verifyAccessToken(config.signing, token, now.getTime()) : null;
      if (linkId) {
        const rows = await sql<LinkRow[]>`
          select l.state as link_state, l.revoke_reason, l.account_id,
                 a.state as account_state, a.lock_reason, a.reauth_required,
                 (a.last_active_on + ${INACTIVE_REAUTH_DAYS}::int < core.kst_today()) as inactive,
                 a.restriction, a.restriction_until,
                 (a.restriction <> 'none'
                   and (a.restriction_until is null or a.restriction_until > now())) as restriction_live
            from core.device_links l
            join core.accounts a on a.id = l.account_id
           where l.id = ${linkId}
        `;
        row = rows[0];
      }
    }

    // 3
    if (route.rate) {
      const result = await hitRateLimit(
        sql,
        config.pseudonymKey,
        route.rate,
        RATE_LIMITS[route.rate],
        {
          ip: route.def.auth === "none" ? clientIp(req) ?? undefined : undefined,
          link: linkId ?? undefined,
          account: row?.account_id,
        },
        now.getTime(),
      );
      if (result.limited) throw new ApiError("OM-1429", { retry_after: result.retryAfter });
    }

    if (route.def.auth !== "access") return null;

    // 4
    if (!linkId) throw new ApiError("OM-1001");

    // 5. 줄이 없으면 탈퇴로 계정과 함께 지워진 연결이다.
    if (!row) throw new ApiError("OM-1002", { reason: "self" });
    if (row.link_state === "revoked") {
      await sql`update core.device_links set revoke_seen = true where id = ${linkId} and not revoke_seen`;
      throw new ApiError("OM-1002", { reason: row.revoke_reason ?? "self" });
    }

    // 6. 번호 충돌로 잠긴 계정은 69일 안에 본인확인하면 이어 쓴다. 그래서 재인증으로 보낸다.
    if (row.account_state === "locked" && row.lock_reason !== "number_conflict") {
      throw new ApiError("OM-1004");
    }

    // 7
    const reauth: ReauthReason | null = row.lock_reason === "number_conflict"
      ? "number_conflict"
      : row.reauth_required
      ? "device_signal"
      : row.inactive
      ? "inactive_69d"
      : null;
    if (reauth && !route.def.openDuringReauth) throw new ApiError("OM-1003");

    // 8
    if (route.blockedWhen && row.restriction_live) {
      const blocked = route.blockedWhen === "suspended" || row.restriction === "permanent";
      if (blocked) {
        throw new ApiError("OM-2001", {
          restriction: row.restriction,
          until: row.restriction_until ? row.restriction_until.toISOString() : null,
        });
      }
    }

    return { linkId, accountId: row.account_id, reauth };
  }

  async function readBody(req: Request): Promise<Record<string, unknown>> {
    const length = Number(req.headers.get("content-length") ?? "0");
    if (length > MAX_JSON_BYTES) throw new ApiError("OM-0413");
    const text = await req.text();
    if (text.length > MAX_JSON_BYTES) throw new ApiError("OM-0413");
    if (!text.trim()) return {};
    try {
      const parsed = JSON.parse(text);
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      return parsed;
    } catch {
      throw new ApiError("OM-0400");
    }
  }

  return async function handle(req: Request): Promise<Response> {
    const requestId = crypto.randomUUID();
    const started = Date.now();
    const now = deps.now ? deps.now() : new Date();
    const path = routePath(req.url);
    let response: Response;
    let code: string | undefined;

    try {
      const route = path ? table.get(path) : undefined;
      if (!route) throw new ApiError("OM-0404");
      if (req.method !== API_METHOD) throw new ApiError("OM-0400");

      const session = await gate(req, route, now);
      const body = await readBody(req);
      const base = {
        config,
        body,
        now,
        requestId,
        appVersion: req.headers.get(HEADERS.appVersion) ?? "",
        session,
      };

      let data: unknown;
      if (route.def.idempotent) {
        // 같은 요청이 두 번 오면 처리하지 않는다. 값의 해시와 만든 때만 적는다. 2.7
        const key = req.headers.get(HEADERS.idempotencyKey);
        if (!key || key.length < 16 || key.length > 200) throw new ApiError("OM-0400");
        const hash = await pseudonym(config.pseudonymKey, "idempotency_keys", key);
        data = await sql.begin(async (tx) => {
          const claimed = await tx`
            insert into core.idempotency_keys (key_hash) values (${hash})
            on conflict (key_hash) do nothing returning 1
          `;
          if (claimed.length === 0) throw new ApiError("OM-0409");
          return await route.handler({ ...base, sql: tx as unknown as Sql });
        });
      } else {
        data = await route.handler({ ...base, sql });
      }
      response = ok(data, requestId, now);
    } catch (e) {
      if (e instanceof ApiError) {
        code = e.code;
        response = fail(e.code, requestId, e.extra);
      } else {
        log({ rid: requestId, event: "error", path: path ?? "-", ...errorFields(e) });
        code = "OM-9000";
        response = fail("OM-9000", requestId);
      }
    }

    // 기록에는 요청 번호, 주소, 결과만 남긴다. 계정 번호와 본문은 남기지 않는다.
    log({ rid: requestId, event: "request", path: path ?? "-", status: response.status, code, ms: Date.now() - started });
    return response;
  };
}
