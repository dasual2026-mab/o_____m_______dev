// 사본이다. 고치지 않는다. 원본은 shared/src이고 server/scripts/sync-shared.mjs가 옮긴다.
// 창구 목록. 기술설계_4_API명세 3장부터 11장까지의 창구 목록 그대로다.
// 앱은 이 파일의 주소로만 서버를 부른다.

export type EndpointAuth =
  /** 인증 없음 */
  | "none"
  /** 접속 인증값 */
  | "access"
  /** 연결 값과 갱신값 */
  | "link"
  /** 목적에 따라 다름. /v1/verify */
  | "by_purpose";

export interface EndpointDef {
  path: string;
  auth: EndpointAuth;
  /** 재인증이 필요한 동안에도 열리는지. 3.2 */
  openDuringReauth?: boolean;
  /** Idempotency-Key를 붙이는지. 2.7 */
  idempotent?: boolean;
}

const e = (path: string, auth: EndpointAuth, extra: Partial<EndpointDef> = {}): EndpointDef => ({
  path,
  auth,
  ...extra,
});

/** 앱이 부르는 창구 56개 */
export const ENDPOINTS = {
  // 3. 시작과 접속 (12)
  appConfig: e("/v1/app/config", "none", { openDuringReauth: true }),
  docsList: e("/v1/docs/list", "none", { openDuringReauth: true }),
  docsGet: e("/v1/docs/get", "none", { openDuringReauth: true }),
  verifyStart: e("/v1/verify/start", "by_purpose", { openDuringReauth: true }),
  verifyComplete: e("/v1/verify/complete", "by_purpose", { openDuringReauth: true }),
  reviewEnter: e("/v1/review/enter", "none"),
  sessionRefresh: e("/v1/session/refresh", "link", { openDuringReauth: true }),
  sessionState: e("/v1/session/state", "access", { openDuringReauth: true }),
  sessionUnlink: e("/v1/session/unlink", "access", { openDuringReauth: true }),
  sessionDevice: e("/v1/session/device", "access"),
  startPledge: e("/v1/start/pledge", "access"),
  consentsContacts: e("/v1/consents/contacts", "access"),

  // 4. 지인과 6 · 9 사인 (5)
  contactsMatch: e("/v1/contacts/match", "access"),
  peopleGet: e("/v1/people/get", "access"),
  signsSend: e("/v1/signs/send", "access"),
  questionsVote: e("/v1/questions/vote", "access"),
  questionsUnvote: e("/v1/questions/unvote", "access"),

  // 5. 대화방과 메시지 (8)
  roomsList: e("/v1/rooms/list", "access"),
  roomsSearch: e("/v1/rooms/search", "access"),
  roomsPrepare: e("/v1/rooms/prepare", "access"),
  roomsOpen: e("/v1/rooms/open", "access"),
  messagesSend: e("/v1/messages/send", "access", { idempotent: true }),
  officialOpen: e("/v1/official/open", "access"),
  officialLeave: e("/v1/official/leave", "access"),
  noticesResolve: e("/v1/notices/resolve", "access"),

  // 6. 내 프로필과 질문 (8)
  meProfile: e("/v1/me/profile", "access"),
  meQuestionsList: e("/v1/me/questions/list", "access"),
  meQuestionsCreate: e("/v1/me/questions/create", "access"),
  meQuestionsUpdate: e("/v1/me/questions/update", "access"),
  meQuestionsHide: e("/v1/me/questions/hide", "access"),
  meQuestionsDelete: e("/v1/me/questions/delete", "access"),
  mePhotoSet: e("/v1/me/photo/set", "access"),
  mePhotoReset: e("/v1/me/photo/reset", "access"),

  // 7. 신고, 차단, 받은 제재 (10)
  reportsCreate: e("/v1/reports/create", "access", { idempotent: true }),
  blocksCreate: e("/v1/blocks/create", "access", { idempotent: true }),
  boxList: e("/v1/box/list", "access"),
  boxGet: e("/v1/box/get", "access"),
  reportsRelease: e("/v1/reports/release", "access"),
  blocksRelease: e("/v1/blocks/release", "access"),
  sanctionsList: e("/v1/sanctions/list", "access"),
  sanctionsGet: e("/v1/sanctions/get", "access"),
  sanctionsOpinion: e("/v1/sanctions/opinion", "access"),
  appealsCreate: e("/v1/appeals/create", "access"),

  // 8. 토큰과 결제 (4)
  tokensBalance: e("/v1/tokens/balance", "access"),
  tokensHistory: e("/v1/tokens/history", "access"),
  purchasesBegin: e("/v1/purchases/begin", "access"),
  purchasesVerify: e("/v1/purchases/verify", "access", { idempotent: true }),

  // 9. 설정, 공지, 문의, 계정 (9)
  meSummary: e("/v1/me/summary", "access"),
  settingsNotifyGet: e("/v1/settings/notify/get", "access"),
  settingsNotifySet: e("/v1/settings/notify/set", "access"),
  announcementsList: e("/v1/announcements/list", "access"),
  inquiriesList: e("/v1/inquiries/list", "access"),
  inquiriesCreate: e("/v1/inquiries/create", "access", { idempotent: true }),
  meAccount: e("/v1/me/account", "access"),
  meWithdrawPreview: e("/v1/me/withdraw/preview", "access"),
  meWithdraw: e("/v1/me/withdraw", "access"),
} as const satisfies Record<string, EndpointDef>;

export type EndpointName = keyof typeof ENDPOINTS;

/** 공개 웹의 수신 거부 창구 4개. 11.2 */
export const PUBLIC_ENDPOINTS = {
  optoutOpen: "/public/optout/open",
  optoutConfirm: "/public/optout/confirm",
  optoutRequest: "/public/optout/request",
  optoutVerify: "/public/optout/verify",
} as const;

/** 바깥 서비스가 서버로 보내는 알림 3개. 11.3 */
export const HOOK_ENDPOINTS = {
  apple: "/hooks/apple",
  google: "/hooks/google",
  sms: "/hooks/sms",
} as const;
