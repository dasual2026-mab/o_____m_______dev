// 서버 기록. 기술설계_4 2.11, 기술설계_1 4.5
// 남기지 않는 것: 메시지 본문, 휴대폰 번호, 연계정보, 검색어, 요청 본문, 인증값.
// 계정 번호와 방 번호를 한 줄에 함께 남기지 않는다.
//
// 그래서 정해진 이름의 값만 받는다. 이름이 목록에 없으면 버린다.
// 목록에 이름을 더할 때는 위 규칙에 걸리지 않는지 먼저 본다.

const ALLOWED = new Set([
  "rid", // 요청 번호
  "path", // 주소. 식별자는 주소에 넣지 않으므로 남겨도 된다
  "status", // HTTP 상태
  "code", // 오류 번호
  "ms", // 걸린 시간
  "event", // 일의 이름
  "job", // 예약 작업의 이름
  "count", // 줄 수
  "err", // 오류의 종류. 글은 남기지 않는다
  "pg", // PostgreSQL 오류 번호
]);

const MAX_LEN = 120;

export type LogFields = Record<string, string | number | boolean | null | undefined>;
export type LogSink = (line: string) => void;

export function scrub(fields: LogFields): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (!ALLOWED.has(k) || v === undefined) continue;
    out[k] = typeof v === "string" && v.length > MAX_LEN ? v.slice(0, MAX_LEN) : v;
  }
  return out;
}

export function makeLogger(sink: LogSink = console.log) {
  return (fields: LogFields) => sink(JSON.stringify(scrub(fields)));
}

export type Logger = ReturnType<typeof makeLogger>;

/** 오류에서 기록에 남겨도 되는 것만 고른다. 오류의 글에는 값이 섞일 수 있어 남기지 않는다. */
export function errorFields(e: unknown): LogFields {
  const err = e as { name?: unknown; code?: unknown };
  return {
    err: typeof err?.name === "string" ? err.name : "unknown",
    pg: typeof err?.code === "string" && /^[0-9A-Z]{5}$/.test(err.code) ? err.code : undefined,
  };
}
