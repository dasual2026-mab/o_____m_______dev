// /v1/session/state 기기 상태. 기술설계_4 3.8
// 넣지 않는 값: 번호, 번호가 충돌한 상대의 정보
// 고치는 표: 계정의 마지막 접속일과 재인증 표시, 기기 연결의 마지막으로 쓴 날

import type { Ctx, Route } from "../app.ts";
import { ENDPOINTS, type SessionStateRequest, type SessionStateResponse } from "../defs/index.ts";
import { ApiError } from "../respond.ts";

const SIGNALS = ["sim_changed", "number_changed"];

async function handler(ctx: Ctx<Partial<SessionStateRequest>>): Promise<SessionStateResponse> {
  const session = ctx.session!;
  const signals = ctx.body.signals ?? [];
  if (!Array.isArray(signals) || signals.some((s) => !SIGNALS.includes(s))) throw new ApiError("OM-0400");

  // 기기가 보낸 신호는 재인증 표시를 켜는 데에만 쓰고 적지 않는다.
  let reauth = session.reauth;
  if (signals.length > 0 && reauth === null) {
    await ctx.sql`update core.accounts set reauth_required = true where id = ${session.accountId}`;
    reauth = "device_signal";
  }

  if (reauth !== null) {
    // 통과할 때까지 마지막 접속일을 고치지 않는다.
    const rows = await ctx.sql<{ real_name: string }[]>`
      select real_name from core.accounts where id = ${session.accountId}
    `;
    return { state: "reauth_required", reauth_reason: reauth, owner_name: rows[0]?.real_name ?? null };
  }

  await ctx.sql`
    update core.accounts set last_active_on = core.kst_today()
     where id = ${session.accountId} and last_active_on <> core.kst_today()
  `;
  await ctx.sql`
    update core.device_links set last_seen_on = core.kst_today()
     where id = ${session.linkId} and last_seen_on <> core.kst_today()
  `;
  return { state: "linked", reauth_reason: null, owner_name: null };
}

export const sessionStateRoute: Route = { def: ENDPOINTS.sessionState, handler };
