// 요청과 응답의 공통 규칙. 기술설계_4_API명세 2장.

/** 판 번호. 응답의 모양을 깨뜨리는 변경이 있을 때만 올린다. 2.1 */
export const API_VERSION = "v1";

/** 모든 요청은 POST다. 읽는 요청도 같다. 2.1 */
export const API_METHOD = "POST";

/** 요청에 붙이는 머리. 2.4 */
export const HEADERS = {
  authorization: "Authorization",
  appVersion: "X-OM-App-Version",
  platform: "X-OM-Platform",
  idempotencyKey: "Idempotency-Key",
  attest: "X-OM-Attest",
  /** 응답 머리. 2.11 */
  requestId: "X-OM-Request-Id",
} as const;

export const PLATFORMS = ["ios", "android"] as const;
export type Platform = (typeof PLATFORMS)[number];

/** 접속 인증값의 수명(초). 2.3 */
export const ACCESS_TOKEN_TTL_SEC = 15 * 60;
/** 바로 앞의 갱신값을 다시 받아 주는 시간(초). 2.3 */
export const PREV_REFRESH_GRACE_SEC = 60;

/** 메시지 수명 종류. 2.6 */
export const TTL_KINDS = ["69m", "69h", "69d"] as const;
export type TtlKind = (typeof TTL_KINDS)[number];

export const TTL_SECONDS: Record<TtlKind, number> = {
  "69m": 69 * 60,
  "69h": 69 * 60 * 60,
  "69d": 69 * 24 * 60 * 60,
};

/** 삭제 임박은 남은 시간이 수명의 10% 이하인 때다. 2.6 */
export const EXPIRING_RATIO = 0.1;

/** /v1/session/state의 값. 3.8 */
export const SESSION_STATES = ["linked", "reauth_required"] as const;
export type SessionState = (typeof SESSION_STATES)[number];

export const REAUTH_REASONS = ["inactive_69d", "number_conflict", "device_signal"] as const;
export type ReauthReason = (typeof REAUTH_REASONS)[number];

/** 마지막 접속일에서 이 날 수가 지나면 재인증이다. 3.8 */
export const INACTIVE_REAUTH_DAYS = 69;

/** /v1/verify/start의 purpose. 3.5 */
export const VERIFY_PURPOSES = ["start", "reauth", "change_number", "change_name"] as const;
export type VerifyPurpose = (typeof VERIFY_PURPOSES)[number];

/** /v1/verify/complete의 result. 3.6 */
export const VERIFY_RESULTS = {
  start: ["new_account", "restarted", "returned", "underage", "failed"],
  reauth: ["passed", "number_updated", "reassigned", "owner_mismatch", "failed"],
  change_number: ["no_change", "number_updated", "owner_mismatch", "failed"],
  change_name: ["no_change", "name_updated", "owner_mismatch", "failed"],
} as const;

/** /v1/session/unlink의 from. 3.9 */
export const UNLINK_FROM = ["account", "reauth"] as const;

/** 보관함 행의 status. 7.4 */
export const BOX_STATUSES = ["reviewing", "reviewed", "block_confirmed"] as const;

/** 접수 번호의 앞 글자. 기술설계_3 2.2와 3장. 꼴은 R-261103-0412다. */
export const RECEIPT_PREFIXES = {
  report: "R",
  appeal: "P",
  detection: "A",
  purchase: "C",
  adjustment: "G",
  inquiry: "Q",
  approval: "S",
  policyChange: "V",
  legal: "L",
  evidence: "B",
} as const;

export const RECEIPT_NO_PATTERN = /^[RPACGQSVLB]-\d{6}-\d{4,5}$/;
