// 오류 번호. 기술설계_4_API명세 2.10 그대로다.
// message는 개발할 때 읽는 글이다. 화면 문장은 앱이 오류 번호를 보고 고른다.

export const ERRORS = {
  "OM-0400": { http: 400, message: "요청의 형식이 맞지 않습니다." },
  "OM-0404": { http: 404, message: "대상이 없습니다." },
  "OM-0409": { http: 409, message: "이미 처리한 요청입니다." },
  "OM-0413": { http: 413, message: "글자 수나 파일 크기가 상한을 넘었습니다." },
  "OM-1001": { http: 401, message: "접속 인증값이 끝났습니다." },
  "OM-1002": { http: 401, message: "이 기기의 연결이 풀렸습니다." },
  "OM-1003": { http: 403, message: "재인증이 필요합니다." },
  "OM-1004": { http: 403, message: "계정이 잠겼습니다." },
  "OM-1005": { http: 426, message: "앱을 새 판으로 올려야 합니다." },
  "OM-1006": { http: 503, message: "점검 중입니다." },
  "OM-1101": { http: 503, message: "지금은 본인확인을 할 수 없습니다." },
  "OM-1102": { http: 400, message: "본인확인 진행이 끝났거나 없습니다." },
  "OM-1429": { http: 429, message: "요청 제한을 넘었습니다." },
  "OM-2001": { http: 403, message: "이용 제한으로 막힌 요청입니다." },
  "OM-3001": { http: 402, message: "토큰이 없습니다." },
  "OM-3002": { http: 402, message: "웰컴 토큰으로 남길 수 있는 미사용자 수를 다 썼습니다." },
  "OM-4001": { http: 409, message: "지인 확인값이 끝났거나 지인의 상태가 바뀌었습니다." },
  "OM-4002": { http: 409, message: "질문이 바뀌었거나 없습니다." },
  "OM-4003": { http: 409, message: "보낼 수 없는 방입니다." },
  "OM-5001": { http: 409, message: "이미 신고했거나 차단한 대상입니다." },
  "OM-6001": { http: 402, message: "앱마켓에서 결제가 확인되지 않았습니다." },
  "OM-6002": { http: 409, message: "다른 계정의 결제입니다." },
  "OM-6003": { http: 409, message: "환불된 결제입니다." },
  "OM-9000": { http: 500, message: "서버 오류입니다." },
} as const;

export type ErrorCode = keyof typeof ERRORS;

/** 실패한 응답의 본문. 2.2 */
export interface ErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    /** OM-1429: 다시 요청할 수 있을 때까지의 초 */
    retry_after?: number;
    /** OM-1002: 풀린 까닭 */
    reason?: UnlinkReason;
    /** OM-2001: 지금의 이용 제한과 끝나는 때 */
    restriction?: Restriction;
    until?: string | null;
  };
}

/** 성공한 응답의 본문. 2.2 */
export interface SuccessBody<T> {
  data: T;
  meta: { server_time: string };
}

/** OM-1002의 reason. 2.10 */
export const UNLINK_REASONS = ["other_device", "self", "reauth", "reassigned"] as const;
export type UnlinkReason = (typeof UNLINK_REASONS)[number];

/** 계정의 이용 제한. 기술설계_3 accounts.restriction */
export const RESTRICTIONS = ["none", "interim", "h69", "d69", "permanent"] as const;
export type Restriction = (typeof RESTRICTIONS)[number];
