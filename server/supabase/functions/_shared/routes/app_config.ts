// /v1/app/config 앱 설정 값. 기술설계_4 3.3
// 넣지 않는 값: 사용자 수 같은 서비스 숫자, 심사용 번호와 심사 코드
// 고치는 표: 없음

import type { Ctx, Route } from "../app.ts";
import { type AppConfigResponse, ENDPOINTS } from "../defs/index.ts";

async function handler(ctx: Ctx): Promise<AppConfigResponse> {
  const { config } = ctx;
  return await Promise.resolve({
    min_version: config.minVersion,
    maintenance: config.maintenance,
    // 약관 문서와 통지 문자 문구는 그 창구를 만들 때 채운다.
    docs: [],
    product: config.product,
    sms_preview: null,
    limits: config.limits,
    // 요청 머리의 앱 판이 심사 중인 판과 같을 때만 참이다.
    review_entry: config.reviewVersion !== null && ctx.appVersion === config.reviewVersion,
  });
}

export const appConfigRoute: Route = { def: ENDPOINTS.appConfig, handler };
