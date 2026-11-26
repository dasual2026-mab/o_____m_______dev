// 데이터베이스 접속. 서버 API는 접속 역할로 직접 접속한다. 기술설계_3 2.1
// Edge Functions에서는 공유 풀러의 트랜잭션 방식으로 잇는다.
// 그래서 연결은 하나만 두고 준비된 문장을 끈다.

import postgres from "postgres";

export type Sql = postgres.Sql;
export type Tx = postgres.TransactionSql;

export function connect(url: string, opts: { ssl?: boolean } = {}): Sql {
  return postgres(url, {
    max: 1,
    prepare: false,
    ssl: opts.ssl === false ? false : "require",
    idle_timeout: 20,
    connect_timeout: 10,
    // 알림 글에는 값이 섞일 수 있어 기록에 남기지 않는다.
    onnotice: () => {},
  });
}
