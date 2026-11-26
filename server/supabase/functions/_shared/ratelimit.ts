// 요청 제한. 기술설계_4 13.1, 기술설계_3 3.1 rate_limits
// 대상 값은 해시로만 적는다. IP 주소도 같다. 줄은 24시간 안에 예약 작업이 지운다.

import { pseudonym } from "./crypto.ts";
import type { Sql } from "./db.ts";
import type { RateRule } from "./defs/index.ts";

export interface RateResult {
  limited: boolean;
  /** 다시 요청할 수 있을 때까지의 초 */
  retryAfter: number;
}

/**
 * 규칙마다 구간의 횟수를 하나 올리고 넘었는지 본다.
 * subject는 재는 단위의 값이다. 계정 번호, 연결 번호, IP 주소 가운데 하나다.
 */
export async function hitRateLimit(
  sql: Sql,
  key: Uint8Array,
  name: string,
  rules: readonly RateRule[],
  subjects: Partial<Record<RateRule["unit"], string>>,
  nowMs = Date.now(),
): Promise<RateResult> {
  let retryAfter = 0;
  for (const rule of rules) {
    const subject = subjects[rule.unit];
    if (!subject) continue;
    const windowMs = rule.windowSec * 1000;
    const start = Math.floor(nowMs / windowMs) * windowMs;
    const hash = await pseudonym(key, "rate_limits", name, rule.unit, String(rule.windowSec), subject);
    const rows = await sql<{ count: number }[]>`
      insert into core.rate_limits (key_hash, window_start, count)
      values (${hash}, ${new Date(start)}, 1)
      on conflict (key_hash, window_start) do update set count = core.rate_limits.count + 1
      returning count
    `;
    if (rows[0].count > rule.max) {
      retryAfter = Math.max(retryAfter, Math.ceil((start + windowMs - nowMs) / 1000));
    }
  }
  return { limited: retryAfter > 0, retryAfter };
}
