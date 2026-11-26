// 사본이다. 고치지 않는다. 원본은 shared/src이고 server/scripts/sync-shared.mjs가 옮긴다.
// 창구마다의 요청과 응답 모양. 창구를 만들 때마다 여기에 더한다.
// 없는 값은 null로 보내고 이름을 빼지 않는다. 기술설계_4_API명세 2.2

import type { Limits } from "./limits.ts";
import type { ReauthReason, SessionState } from "./protocol.ts";

/** /v1/app/config 3.3 */
export interface AppConfigResponse {
  min_version: string;
  maintenance: string | null;
  docs: { doc_id: string; version: string }[];
  product: { product_id: string; tokens: number; price: number };
  sms_preview: { sender: string; body: string } | null;
  limits: Limits;
  review_entry: boolean;
}

/** /v1/session/state 3.8 */
export interface SessionStateRequest {
  /** 기기가 감지한 신호. 없으면 빈 배열 */
  signals: ("sim_changed" | "number_changed")[];
}

export interface SessionStateResponse {
  state: SessionState;
  reauth_reason: ReauthReason | null;
  /** 재인증이 필요할 때만 주는 계정 명의자의 실명 */
  owner_name: string | null;
}
