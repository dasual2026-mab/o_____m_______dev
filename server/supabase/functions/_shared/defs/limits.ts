// 사본이다. 고치지 않는다. 원본은 shared/src이고 server/scripts/sync-shared.mjs가 옮긴다.
// 요청 제한과 상한. 기술설계_4_API명세 13장. 대표 확정 2026-11-26.
// 서버 설정이라 앱을 다시 올리지 않고 바꿀 수 있다. 앱은 /v1/app/config의 limits를 따른다.
// 이 파일의 값은 서버의 기본값이다.

export type RateUnit = "device" | "ip" | "link" | "account" | "phone";

export interface RateRule {
  /** 재는 구간(초) */
  windowSec: number;
  /** 구간 안에 받는 횟수 */
  max: number;
  unit: RateUnit;
}

const MIN = 60;
const DAY = 24 * 60 * 60;

/** 13.1 횟수 */
export const RATE_LIMITS = {
  verifyStart: [
    { windowSec: 10 * MIN, max: 3, unit: "device" },
    { windowSec: DAY, max: 10, unit: "device" },
    { windowSec: DAY, max: 30, unit: "ip" },
  ],
  reviewEnter: [{ windowSec: 10 * MIN, max: 5, unit: "ip" }],
  sessionRefresh: [{ windowSec: MIN, max: 10, unit: "link" }],
  contactsMatch: [{ windowSec: MIN, max: 6, unit: "account" }],
  messagesSend: [
    { windowSec: MIN, max: 60, unit: "account" },
    { windowSec: DAY, max: 3000, unit: "account" },
  ],
  signsSend: [{ windowSec: MIN, max: 60, unit: "account" }],
  roomsRead: [{ windowSec: MIN, max: 120, unit: "account" }],
  search: [{ windowSec: MIN, max: 60, unit: "account" }],
  reportBlock: [
    { windowSec: MIN, max: 20, unit: "account" },
    { windowSec: DAY, max: 200, unit: "account" },
  ],
  questionWrite: [{ windowSec: MIN, max: 10, unit: "account" }],
  surveyVote: [{ windowSec: MIN, max: 30, unit: "account" }],
  photoUpload: [{ windowSec: DAY, max: 20, unit: "account" }],
  inquiryCreate: [{ windowSec: DAY, max: 10, unit: "account" }],
  purchaseVerify: [{ windowSec: MIN, max: 10, unit: "account" }],
  optoutSms: [
    { windowSec: DAY, max: 3, unit: "phone" },
    { windowSec: DAY, max: 10, unit: "ip" },
  ],
} as const satisfies Record<string, readonly RateRule[]>;

export type RateLimitName = keyof typeof RATE_LIMITS;

/** 주소록 대조: 한 번에 번호 1,000개, 하루에 번호 합계 20,000개 */
export const CONTACTS_MATCH_MAX_PER_REQUEST = 1000;
export const CONTACTS_MATCH_MAX_PER_DAY = 20000;
/** 수신 거부 인증 번호를 5번 틀리면 그 인증을 버린다 */
export const OPTOUT_MAX_WRONG = 5;

/** 13.2 글자 수와 파일 크기 */
export const LIMITS = {
  message_chars: 2000,
  question_chars: 1000,
  survey_options_min: 2,
  survey_options_max: 10,
  survey_option_chars: 100,
  inquiry_chars: 3000,
  opinion_chars: 2000,
  profile_photo_bytes: 10 * 1024 * 1024,
  inquiry_photo_count: 3,
  inquiry_photo_bytes: 10 * 1024 * 1024,
} as const;

export type Limits = { [K in keyof typeof LIMITS]: number };
