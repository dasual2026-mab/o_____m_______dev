// 창구별 함수. 화면은 call()을 직접 부르지 않고 이 파일의 함수를 쓴다.
// 창구를 더할 때는 개발2가 shared/src/types.ts에 모양을 먼저 적은 것을 가져다 쓴다.

import { call } from "./client";
import type { AppConfigResponse, SessionStateRequest, SessionStateResponse } from "./shared";

export { ApiError } from "./client";
export { serverNow, secondsUntil } from "./serverTime";

/** 3.3 앱 설정. 인증 없음 */
export const getAppConfig = () => call<AppConfigResponse>("appConfig");

/** 3.8 기기 연결 상태. 접속 인증값 */
export const getSessionState = (req: SessionStateRequest) => call<SessionStateResponse, SessionStateRequest>("sessionState", req);
