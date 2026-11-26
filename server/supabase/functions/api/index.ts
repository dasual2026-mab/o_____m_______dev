// 앱 서버. 접속 역할은 svc_app이다. 기술설계_4 12.1
// 앱이 부르는 창구(/v1), 공개 웹 창구(/public), 바깥에서 오는 알림(/hooks)을 이 함수 하나가 받는다.
// Supabase 관문의 기본 인증 검사는 끄고(config.toml) 공통 틀이 직접 검사한다.

import { createApp } from "../_shared/app.ts";
import { loadConfig } from "../_shared/config.ts";
import { connect } from "../_shared/db.ts";
import { makeLogger } from "../_shared/log.ts";
import { routes } from "../_shared/routes/index.ts";

const get = (name: string) => Deno.env.get(name);
const dbUrl = get("OM_DB_URL_APP");
if (!dbUrl) throw new Error("서버 설정이 없습니다: OM_DB_URL_APP");

const handle = createApp({
  sql: connect(dbUrl),
  config: loadConfig(get),
  log: makeLogger(),
  routes,
});

Deno.serve(handle);
