// 검사용 로컬 데이터베이스. 빈 PostgreSQL을 띄워 변경 파일을 처음부터 적용한다.
// 실제 사용자 데이터를 쓰지 않는다. 검사가 끝나면 통째로 지운다.

import EmbeddedPostgres from "embedded-postgres";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const here = dirname(fileURLToPath(import.meta.url));
export const migrationsDir = join(here, "..", "supabase", "migrations");

const DB = "om_test";
const ROLE_PASSWORD = "local-test-only";

// 서버는 pg_ctl로 띄운다. 관리자 권한의 창에서는 postgres를 바로 띄울 수 없고,
// pg_ctl은 권한을 스스로 낮춰 띄운다.
function pgCtl(): string {
  const os = process.platform === "win32" ? "windows" : process.platform;
  const pkg = join(here, "..", "node_modules", "@embedded-postgres", `${os}-${process.arch}`);
  const exe = join(pkg, "native", "bin", process.platform === "win32" ? "pg_ctl.exe" : "pg_ctl");
  if (!existsSync(exe)) throw new Error("pg_ctl을 찾지 못했습니다: " + exe);
  return exe;
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address() as { port: number };
      srv.close(() => resolve(port));
    });
  });
}

export interface TestDb {
  port: number;
  /** 표의 주인으로 접속한다. 검사 준비에만 쓴다. */
  admin: postgres.Sql;
  /** 접속 역할로 접속한다. svc_app, svc_admin, svc_jobs, anon 등 */
  as(role: string): postgres.Sql;
  stop(): Promise<void>;
}

export async function startTestDb(): Promise<TestDb> {
  const dir = mkdtempSync(join(tmpdir(), "om-pg-"));
  const port = await freePort();
  const pg = new EmbeddedPostgres({
    databaseDir: dir,
    user: "postgres",
    password: ROLE_PASSWORD,
    port,
    persistent: false,
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
    onLog: () => {},
    onError: () => {},
  });
  await pg.initialise();
  const ctl = pgCtl();
  execFileSync(ctl, ["-D", dir, "-o", `-p ${port} -c listen_addresses=127.0.0.1`, "-l", join(dir, "server.log"), "-w", "start"], {
    stdio: "ignore",
  });
  const boot = postgres(`postgres://postgres:${ROLE_PASSWORD}@127.0.0.1:${port}/postgres`, { max: 1, onnotice: () => {} });
  await boot.unsafe(`create database ${DB}`);
  await boot.end();

  const url = (user: string) => `postgres://${user}:${ROLE_PASSWORD}@127.0.0.1:${port}/${DB}`;
  const open = (user: string) => postgres(url(user), { max: 1, prepare: false, onnotice: () => {} });
  const admin = open("postgres");

  // Supabase가 미리 만들어 두는 역할을 흉내 낸다. 앱의 공개 키는 anon과 authenticated로 접속한다.
  for (const r of ["anon", "authenticated", "service_role"]) {
    await admin.unsafe(`create role ${r} login password '${ROLE_PASSWORD}'`);
  }

  for (const f of readdirSync(migrationsDir).filter((n) => n.endsWith(".sql")).sort()) {
    await admin.unsafe(readFileSync(join(migrationsDir, f), "utf8"));
  }

  // 서버 역할의 로그인은 변경 파일 밖에서 건다. 여기서는 검사용 비밀번호를 쓴다.
  for (const r of ["svc_app", "svc_admin", "svc_jobs"]) {
    await admin.unsafe(`alter role ${r} login password '${ROLE_PASSWORD}'`);
  }

  const opened: postgres.Sql[] = [admin];
  const byRole = new Map<string, postgres.Sql>();
  return {
    port,
    admin,
    as(role) {
      let sql = byRole.get(role);
      if (!sql) {
        sql = open(role);
        byRole.set(role, sql);
        opened.push(sql);
      }
      return sql;
    },
    async stop() {
      await Promise.all(opened.map((s) => s.end({ timeout: 2 })));
      execFileSync(ctl, ["-D", dir, "-m", "immediate", "-w", "stop"], { stdio: "ignore" });
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

/** 기술설계_3 1.2의 표 55개 */
export const EXPECTED_TABLES: Record<string, string[]> = {
  "계정과 기기": [
    "core.identity_keys", "core.accounts", "core.device_links", "core.consents",
    "core.verification_sessions", "core.access_logs", "core.abuse_counters", "core.rate_limits",
    "core.idempotency_keys",
  ],
  "미사용자": ["core.nonuser_numbers", "core.sms_notices", "core.sms_optouts", "core.optout_checks"],
  "대화방과 메시지": ["core.rooms", "core.room_senders", "core.sent_rooms", "core.messages", "core.send_logs"],
  "질문과 설문": ["core.questions", "core.survey_options", "core.survey_votes"],
  "6 · 9 사인": ["core.sign_sends", "core.sign_counts", "core.sign_batches"],
  "신고와 차단과 제재": [
    "core.reports", "core.archives", "core.archive_items", "core.blocks", "core.sanctions",
    "core.appeals", "core.carried_sanctions", "core.detections",
  ],
  "토큰과 결제": [
    "core.wallets", "core.token_lots", "core.token_events", "core.purchases",
    "core.token_adjustments", "core.refund_claims",
  ],
  "문의와 안내": [
    "core.inquiries", "core.inquiry_files", "core.inquiry_replies", "core.official_notices",
    "core.announcements",
  ],
  "운영": [
    "audit.audit_logs", "audit.operator_grants", "core.stats_daily", "core.operators",
    "core.operator_devices", "core.approval_requests", "core.policy_values",
    "core.policy_value_changes", "core.legal_requests", "core.evidence_bundles",
  ],
  "익명 얼굴": ["core.faces", "core.face_jobs"],
};
