// svc_app이 공유 풀러로 개발용 DB에 접속되는지 본다. 대표가 직접 돌린다.
// 접속 주소는 setup-dev-secrets.ps1이 남긴 사본에서 읽고 화면에 내지 않는다.
//
//   node scripts/check-dev-db.mjs

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import postgres from "postgres";

const file = join(homedir(), "om-dev-secrets.env");
const line = readFileSync(file, "utf8").split(/\r?\n/).find((l) => l.startsWith("OM_DB_URL_APP="));
if (!line) throw new Error("사본에 OM_DB_URL_APP가 없습니다.");
const sql = postgres(line.slice("OM_DB_URL_APP=".length), { max: 1, prepare: false, ssl: "require", onnotice: () => {} });

try {
  const [me] = await sql`select current_user as role`;
  console.log("접속한 역할:", me.role);
  const [n] = await sql`select count(*)::int as n from core.accounts`;
  console.log("core.accounts 읽기: 됨, 줄 수", n.n);
  try {
    await sql`select 1 from audit.audit_logs limit 1`;
    console.log("audit.audit_logs 읽기: 됨 (막혀야 하는데 열려 있습니다)");
  } catch (e) {
    console.log("audit.audit_logs 읽기: 막힘", e.code === "42501" ? "(맞음)" : `(${e.code})`);
  }
} catch (e) {
  console.log("접속하지 못했습니다:", e.code ?? e.name);
} finally {
  await sql.end({ timeout: 2 });
}
