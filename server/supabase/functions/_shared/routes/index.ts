// 앱 서버가 여는 창구. 창구를 만들 때마다 여기에 더한다.
// 창구의 주소와 인증은 공통 정의(defs/endpoints.ts)에서 가져온다.

import type { Route } from "../app.ts";
import { appConfigRoute } from "./app_config.ts";
import { sessionStateRoute } from "./session_state.ts";

export const routes: Route[] = [appConfigRoute, sessionStateRoute];
