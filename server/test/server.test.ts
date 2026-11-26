// T-352의 검증 조건을 그대로 검사한다.
//   1. 빈 DB에 변경 파일을 처음부터 적용하면 기술설계_3의 표 수와 같다.
//   2. 앱의 공개 키로는 어느 표도 읽거나 쓸 수 없다.
//   3. 서버의 접속 역할은 7장에 적힌 일만 할 수 있다.
//   4. 공통 틀의 관문이 기술설계_4 2.8의 차례대로 돈다.

import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { createApp, type Route } from "../supabase/functions/_shared/app.ts";
import type { Config } from "../supabase/functions/_shared/config.ts";
import { signAccessToken } from "../supabase/functions/_shared/crypto.ts";
import type { Sql } from "../supabase/functions/_shared/db.ts";
import { ENDPOINTS, LIMITS } from "../supabase/functions/_shared/defs/index.ts";
import { makeLogger } from "../supabase/functions/_shared/log.ts";
import { routes } from "../supabase/functions/_shared/routes/index.ts";
import { EXPECTED_TABLES, startTestDb, type TestDb } from "./harness.ts";

let db: TestDb;
before(async () => {
  db = await startTestDb();
});
after(async () => {
  await db?.stop();
});

const ALL = Object.values(EXPECTED_TABLES).flat().sort();

async function denied(run: () => Promise<unknown>): Promise<void> {
  await assert.rejects(run, (e: { code?: string }) => e.code === "42501", "권한 오류가 나야 한다");
}

describe("변경 파일", () => {
  test("표는 모두 55개이고 이름이 설계 문서와 같다", async () => {
    const rows = await db.admin<{ name: string }[]>`
      select schemaname || '.' || tablename as name from pg_tables
       where schemaname in ('core', 'audit') order by 1
    `;
    assert.equal(ALL.length, 55);
    assert.deepEqual(rows.map((r) => r.name), ALL);
  });

  test("묶음마다의 표 수가 기술설계_3 1.2와 같다", () => {
    const counts = Object.fromEntries(Object.entries(EXPECTED_TABLES).map(([k, v]) => [k, v.length]));
    assert.deepEqual(counts, {
      "계정과 기기": 9, "미사용자": 4, "대화방과 메시지": 5, "질문과 설문": 3, "6 · 9 사인": 3,
      "신고와 차단과 제재": 8, "토큰과 결제": 6, "문의와 안내": 5, "운영": 10, "익명 얼굴": 2,
    });
  });

  test("서비스 표가 public 스키마에 하나도 없다", async () => {
    const rows = await db.admin`select 1 from pg_tables where schemaname = 'public'`;
    assert.equal(rows.length, 0);
  });

  test("모든 표에 행 단위 보안이 켜져 있고 허용 규칙이 없다", async () => {
    const off = await db.admin`
      select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname in ('core', 'audit') and c.relkind = 'r' and not c.relrowsecurity
    `;
    assert.equal(off.length, 0);
    const policies = await db.admin`select 1 from pg_policies where schemaname in ('core', 'audit')`;
    assert.equal(policies.length, 0);
  });
});

describe("앱의 공개 키", () => {
  for (const role of ["anon", "authenticated", "service_role"]) {
    test(`${role}은 어느 표에도 권한이 없다`, async () => {
      const rows = await db.admin<{ name: string }[]>`
        select n.nspname || '.' || c.relname as name
          from pg_class c join pg_namespace n on n.oid = c.relnamespace
         where n.nspname in ('core', 'audit') and c.relkind = 'r'
           and (has_table_privilege(${role}, c.oid, 'select')
             or has_table_privilege(${role}, c.oid, 'insert')
             or has_table_privilege(${role}, c.oid, 'update')
             or has_table_privilege(${role}, c.oid, 'delete')
             or has_any_column_privilege(${role}, c.oid, 'select')
             or has_any_column_privilege(${role}, c.oid, 'update'))
      `;
      assert.deepEqual(rows.map((r) => r.name), []);
      const schemas = await db.admin<{ ok: boolean }[]>`
        select has_schema_privilege(${role}, 'core', 'usage')
            or has_schema_privilege(${role}, 'audit', 'usage') as ok
      `;
      assert.equal(schemas[0].ok, false);
    });

    test(`${role}로 접속해 읽고 쓰면 모든 표에서 막힌다`, async () => {
      const sql = db.as(role);
      for (const t of ALL) {
        await denied(() => sql.unsafe(`select 1 from ${t} limit 1`));
        await denied(() => sql.unsafe(`delete from ${t}`));
      }
    });
  }
});

describe("서버의 접속 역할", () => {
  test("관리자 서버는 대화방, 메시지, 보낸 사람 연결, 사인 접수, 설문 투표를 읽지 못한다", async () => {
    const sql = db.as("svc_admin");
    for (const t of ["rooms", "room_senders", "sent_rooms", "messages", "sign_sends", "survey_votes"]) {
      await denied(() => sql.unsafe(`select 1 from core.${t} limit 1`));
    }
  });

  test("관리자 서버는 계정의 이용 제한 칸만 고칠 수 있다", async () => {
    const sql = db.as("svc_admin");
    await sql`update core.accounts set restriction = 'none' where false`;
    await denied(() => sql`update core.accounts set real_name = 'x' where false`);
  });

  test("예약 작업은 메시지의 본문을 읽지 못하고 지울 수만 있다", async () => {
    const sql = db.as("svc_jobs");
    await denied(() => sql`select body_enc from core.messages limit 1`);
    await denied(() => sql`update core.messages set read_at = now() where false`);
    await sql`delete from core.messages where expires_at < now()`;
  });

  test("앱 서버는 운영 기록과 운영 표를 읽지 못한다", async () => {
    const sql = db.as("svc_app");
    await denied(() => sql`select 1 from audit.audit_logs limit 1`);
    await denied(() => sql`select 1 from core.operators limit 1`);
    await denied(() => sql`select 1 from core.policy_values limit 1`);
  });

  test("운영자 처리 기록은 넣기만 되고 고칠 수 없다", async () => {
    const sql = db.as("svc_admin");
    const zero = Buffer.alloc(32);
    await sql`
      insert into audit.audit_logs (operator_id, device, network, action, prev_hash, row_hash)
      values (gen_random_uuid(), 'pc', 'office', 'test', ${zero}, ${zero})
    `;
    await denied(() => sql`update audit.audit_logs set action = 'x'`);
    await denied(() => sql`delete from audit.audit_logs`);
    // 표의 주인이 고치려 해도 막힌다.
    await assert.rejects(() => db.admin`update audit.audit_logs set action = 'x'`);
  });

  test("접수 번호의 꼴은 앞 글자, 여섯 자리, 네 자리다", async () => {
    const rows = await db.as("svc_app")<{ no: string }[]>`select core.new_receipt_no('R') as no`;
    assert.match(rows[0].no, /^R-\d{6}-\d{4}$/);
  });
});

// 공통 틀 ---------------------------------------------------------------------

const config: Config = {
  env: "test",
  minVersion: "1.2.0",
  maintenance: null,
  reviewVersion: "1.9.0",
  signing: { current: 1, keys: new Map([[1, crypto.getRandomValues(new Uint8Array(32))]]) },
  pseudonymKey: crypto.getRandomValues(new Uint8Array(32)),
  limits: { ...LIMITS },
  product: { product_id: "token_100", tokens: 100, price: 6900 },
};

// 검사에만 쓰는 창구. 요청 제한, 이용 제한, 중복 요청 확인을 본다.
const testRoutes: Route[] = [
  ...routes,
  { def: ENDPOINTS.signsSend, rate: "questionWrite", handler: () => Promise.resolve({ done: true }) },
  { def: ENDPOINTS.meQuestionsCreate, blockedWhen: "suspended", handler: () => Promise.resolve({ done: true }) },
  { def: ENDPOINTS.meQuestionsUpdate, blockedWhen: "permanent", handler: () => Promise.resolve({ done: true }) },
  { def: ENDPOINTS.messagesSend, handler: () => Promise.resolve({ done: true }) },
  { def: ENDPOINTS.reviewEnter, rate: "reviewEnter", handler: () => Promise.resolve({ done: true }) },
];

interface Seed {
  accountId: string;
  linkId: string;
  token: string;
}

async function seed(extra: { name?: string } = {}): Promise<Seed> {
  const sql = db.as("svc_app");
  const rnd = () => crypto.getRandomValues(new Uint8Array(32));
  const [identity] = await sql<{ id: string }[]>`
    insert into core.identity_keys (ci_hash, consent_version, consented_at)
    values (${rnd()}, 'v1', now()) returning id
  `;
  const code = "M-" + crypto.randomUUID().slice(0, 6).toUpperCase();
  const [account] = await sql<{ id: string }[]>`
    insert into core.accounts (identity_id, admin_code, real_name)
    values (${identity.id}, ${code}, ${extra.name ?? "검사용"}) returning id
  `;
  const [link] = await sql<{ id: string }[]>`
    insert into core.device_links
      (account_id, token_hash, platform, os_version, device_model, app_version, notify_prefs, last_seen_on)
    values (${account.id}, ${rnd()}, 'ios', '26.0', 'test', '1.2.0', '{}'::jsonb, core.kst_today())
    returning id
  `;
  return { accountId: account.id, linkId: link.id, token: await signAccessToken(config.signing, link.id, 900) };
}

describe("공통 틀", () => {
  const lines: string[] = [];
  let handle: (req: Request) => Promise<Response>;
  let sql: Sql;

  const call = async (
    path: string,
    opts: { token?: string; body?: unknown; headers?: Record<string, string>; method?: string; cfg?: Config } = {},
  ) => {
    const h = opts.cfg
      ? createApp({ sql, config: opts.cfg, log: makeLogger((l) => lines.push(l)), routes: testRoutes })
      : handle;
    const res = await h(
      new Request(`https://example.invalid/api${path}`, {
        method: opts.method ?? "POST",
        headers: {
          "X-OM-App-Version": "1.2.0",
          "X-OM-Platform": "ios",
          "x-forwarded-for": "203.0.113.7",
          ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
          ...opts.headers,
        },
        body: opts.method === "GET" ? undefined : JSON.stringify(opts.body ?? {}),
      }),
    );
    // deno-lint-ignore no-explicit-any
    return { status: res.status, json: (await res.json()) as any, headers: res.headers };
  };

  before(() => {
    sql = db.as("svc_app") as unknown as Sql;
    handle = createApp({ sql, config, log: makeLogger((l) => lines.push(l)), routes: testRoutes });
  });

  test("/v1/app/config는 인증 없이 설정 값을 준다", async () => {
    const r = await call("/v1/app/config");
    assert.equal(r.status, 200);
    assert.equal(r.json.data.min_version, "1.2.0");
    assert.equal(r.json.data.limits.message_chars, 2000);
    assert.equal(r.json.data.review_entry, false);
    assert.match(r.json.meta.server_time, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    assert.ok(r.headers.get("X-OM-Request-Id"));
  });

  test("심사 중인 앱 판에서만 심사용 길을 보인다", async () => {
    const r = await call("/v1/app/config", { headers: { "X-OM-App-Version": "1.9.0" } });
    assert.equal(r.json.data.review_entry, true);
  });

  test("없는 창구, 주소에 붙인 값, POST가 아닌 요청은 받지 않는다", async () => {
    assert.equal((await call("/v1/nope")).json.error.code, "OM-0404");
    assert.equal((await call("/v1/app/config?id=1")).json.error.code, "OM-0404");
    assert.equal((await call("/v1/app/config", { method: "GET" })).json.error.code, "OM-0400");
  });

  test("1 앱 판이 낮으면 OM-1005, 2 점검 중이면 OM-1006", async () => {
    const low = await call("/v1/app/config", { headers: { "X-OM-App-Version": "1.1.9" } });
    assert.equal(low.status, 426);
    assert.equal(low.json.error.code, "OM-1005");
    const down = await call("/v1/app/config", { cfg: { ...config, maintenance: "점검 중입니다." } });
    assert.equal(down.status, 503);
    assert.equal(down.json.error.code, "OM-1006");
  });

  test("4 접속 인증값이 없거나 틀리거나 끝났으면 OM-1001", async () => {
    const s = await seed();
    assert.equal((await call("/v1/session/state")).json.error.code, "OM-1001");
    assert.equal((await call("/v1/session/state", { token: s.token + "x" })).json.error.code, "OM-1001");
    const expired = await signAccessToken(config.signing, s.linkId, -1);
    assert.equal((await call("/v1/session/state", { token: expired })).json.error.code, "OM-1001");
    const forged = await signAccessToken(
      { current: 1, keys: new Map([[1, crypto.getRandomValues(new Uint8Array(32))]]) },
      s.linkId,
      900,
    );
    assert.equal((await call("/v1/session/state", { token: forged })).json.error.code, "OM-1001");
  });

  test("/v1/session/state는 연결된 기기에 linked를 주고 마지막 접속일을 적는다", async () => {
    const s = await seed();
    await db.admin`update core.accounts set last_active_on = core.kst_today() - 3 where id = ${s.accountId}`;
    const r = await call("/v1/session/state", { token: s.token, body: { signals: [] } });
    assert.deepEqual(r.json.data, { state: "linked", reauth_reason: null, owner_name: null });
    const [a] = await db.admin`select last_active_on = core.kst_today() as today from core.accounts where id = ${s.accountId}`;
    assert.equal(a.today, true);
  });

  test("5 풀린 연결은 OM-1002와 까닭을 주고 해제 응답 칸을 켠다", async () => {
    const s = await seed();
    await db.admin`
      update core.device_links
         set state = 'revoked', token_hash = null, notify_prefs = null, revoked_at = now(),
             revoke_reason = 'other_device'
       where id = ${s.linkId}
    `;
    const r = await call("/v1/session/state", { token: s.token });
    assert.equal(r.status, 401);
    assert.deepEqual([r.json.error.code, r.json.error.reason], ["OM-1002", "other_device"]);
    const [l] = await db.admin`select revoke_seen from core.device_links where id = ${s.linkId}`;
    assert.equal(l.revoke_seen, true);
  });

  test("6 재배정으로 잠긴 계정은 OM-1004", async () => {
    const s = await seed();
    await db.admin`
      update core.accounts set state = 'locked', lock_reason = 'reassigned', locked_at = now()
       where id = ${s.accountId}
    `;
    assert.equal((await call("/v1/session/state", { token: s.token })).json.error.code, "OM-1004");
  });

  test("7 재인증이 필요하면 열린 창구만 답하고 나머지는 OM-1003", async () => {
    const s = await seed({ name: "홍길동" });
    await db.admin`update core.accounts set last_active_on = core.kst_today() - 70 where id = ${s.accountId}`;
    const state = await call("/v1/session/state", { token: s.token });
    assert.deepEqual(state.json.data, {
      state: "reauth_required", reauth_reason: "inactive_69d", owner_name: "홍길동",
    });
    const [a] = await db.admin`select last_active_on < core.kst_today() as old from core.accounts where id = ${s.accountId}`;
    assert.equal(a.old, true, "통과할 때까지 마지막 접속일을 고치지 않는다");
    const other = await call("/v1/messages/send", { token: s.token });
    assert.equal(other.status, 403);
    assert.equal(other.json.error.code, "OM-1003");
  });

  test("69일째에는 재인증이 아니다", async () => {
    const s = await seed();
    await db.admin`update core.accounts set last_active_on = core.kst_today() - 69 where id = ${s.accountId}`;
    assert.equal((await call("/v1/session/state", { token: s.token })).json.data.state, "linked");
  });

  test("기기가 보낸 신호는 재인증 표시만 켠다", async () => {
    const s = await seed();
    const r = await call("/v1/session/state", { token: s.token, body: { signals: ["sim_changed"] } });
    assert.equal(r.json.data.reauth_reason, "device_signal");
    const again = await call("/v1/session/state", { token: s.token });
    assert.equal(again.json.data.state, "reauth_required");
    const bad = await call("/v1/session/state", { token: s.token, body: { signals: ["x"] } });
    assert.equal(bad.json.error.code, "OM-0400");
  });

  test("번호 충돌로 잠긴 계정은 재인증으로 보낸다", async () => {
    const s = await seed();
    await db.admin`
      update core.accounts set state = 'locked', lock_reason = 'number_conflict', locked_at = now()
       where id = ${s.accountId}
    `;
    const r = await call("/v1/session/state", { token: s.token });
    assert.equal(r.json.data.reauth_reason, "number_conflict");
  });

  test("8 이용 제한은 정해진 요청만 막는다", async () => {
    const s = await seed();
    await db.admin`
      update core.accounts set restriction = 'h69', restriction_until = now() + interval '69 hours'
       where id = ${s.accountId}
    `;
    const blocked = await call("/v1/me/questions/create", { token: s.token });
    assert.equal(blocked.status, 403);
    assert.deepEqual([blocked.json.error.code, blocked.json.error.restriction], ["OM-2001", "h69"]);
    assert.ok(blocked.json.error.until);
    assert.equal((await call("/v1/me/questions/update", { token: s.token })).status, 200);
    assert.equal((await call("/v1/session/state", { token: s.token })).status, 200);

    await db.admin`update core.accounts set restriction = 'permanent', restriction_until = null where id = ${s.accountId}`;
    assert.equal((await call("/v1/me/questions/update", { token: s.token })).json.error.code, "OM-2001");

    await db.admin`
      update core.accounts set restriction = 'h69', restriction_until = now() - interval '1 minute'
       where id = ${s.accountId}
    `;
    assert.equal((await call("/v1/me/questions/create", { token: s.token })).status, 200, "끝난 정지는 막지 않는다");
  });

  test("3 요청 제한을 넘으면 OM-1429와 다시 요청할 때를 준다", async () => {
    const s = await seed();
    const other = await seed();
    for (let i = 0; i < 10; i++) {
      assert.equal((await call("/v1/signs/send", { token: s.token })).status, 200);
    }
    const r = await call("/v1/signs/send", { token: s.token });
    assert.equal(r.status, 429);
    assert.equal(r.json.error.code, "OM-1429");
    assert.ok(r.json.error.retry_after >= 1 && r.json.error.retry_after <= 60);
    assert.equal(r.headers.get("Retry-After"), String(r.json.error.retry_after));
    assert.equal((await call("/v1/signs/send", { token: other.token })).status, 200, "다른 계정은 따로 센다");
  });

  test("인증이 없는 창구는 주소로 재고, 주소는 해시로만 적는다", async () => {
    for (let i = 0; i < 5; i++) assert.equal((await call("/v1/review/enter")).status, 200);
    assert.equal((await call("/v1/review/enter")).json.error.code, "OM-1429");
    const rows = await db.admin<{ key_hash: Buffer }[]>`select key_hash from core.rate_limits`;
    assert.ok(rows.length > 0);
    for (const row of rows) {
      assert.equal(row.key_hash.length, 32);
      assert.ok(!row.key_hash.toString("latin1").includes("203.0.113.7"));
    }
  });

  test("같은 요청이 두 번 오면 OM-0409", async () => {
    const s = await seed();
    const key = crypto.randomUUID();
    const first = await call("/v1/messages/send", { token: s.token, headers: { "Idempotency-Key": key } });
    assert.equal(first.status, 200);
    const second = await call("/v1/messages/send", { token: s.token, headers: { "Idempotency-Key": key } });
    assert.equal(second.status, 409);
    assert.equal(second.json.error.code, "OM-0409");
    assert.equal((await call("/v1/messages/send", { token: s.token })).json.error.code, "OM-0400");
  });

  test("본문이 JSON이 아니면 OM-0400", async () => {
    const res = await handle(
      new Request("https://example.invalid/api/v1/app/config", {
        method: "POST",
        headers: { "X-OM-App-Version": "1.2.0", "X-OM-Platform": "ios" },
        body: "not json",
      }),
    );
    assert.equal(res.status, 400);
  });

  test("서버 기록에는 계정 번호, 연결 번호, 이름, 인증값, 주소가 남지 않는다", async () => {
    const s = await seed({ name: "기록검사" });
    lines.length = 0;
    await call("/v1/session/state", { token: s.token, body: { signals: [] } });
    await call("/v1/session/state", { token: "bad" });
    assert.ok(lines.length >= 2);
    const all = lines.join("\n");
    for (const secret of [s.accountId, s.linkId, s.token, "기록검사", "203.0.113.7", "signals"]) {
      assert.ok(!all.includes(secret), `기록에 남으면 안 되는 값: ${secret.slice(0, 12)}`);
    }
    const line = JSON.parse(lines[0]);
    assert.deepEqual(Object.keys(line).sort(), ["event", "ms", "path", "rid", "status"]);
  });

  test("기록은 정해진 이름의 값만 받는다", () => {
    const got: string[] = [];
    makeLogger((l) => got.push(l))({ rid: "r", account_id: "a", room_id: "b", body: "c", phone: "010" } as never);
    assert.equal(got[0], '{"rid":"r"}');
  });
});
