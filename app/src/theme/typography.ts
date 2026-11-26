// 글자 단계. 디자인 명세 §3의 단계표와 역할표를 옮겼다.
// 크기는 여섯 단계만 쓴다: 10, 11, 13, 14, 16, 18. 굵기는 셋: 본문, 600, 700.
// 단계 밖(명세 '제외')은 따로 이름을 붙였다.
// px 줄 높이는 프로토타입 계산값이고, null은 CSS 'normal'(폰트 기본 줄 높이)이다.

export type WeightKey = "body" | 600 | 700;

export interface TypeRole {
  size: number;
  weight: WeightKey;
  /** 자간(em). 앱에서는 size를 곱해 px로 쓴다 */
  tracking?: number;
  /** 줄 높이(px). 없으면 폰트 기본 */
  lineHeight?: number;
  /** 숫자 폭 고정 */
  tabular?: boolean;
}

export const TYPE = {
  // 단계표
  tag: { size: 10, weight: 700 },
  caption: { size: 11, weight: "body" },
  body: { size: 13, weight: "body" },
  emphasis: { size: 14, weight: "body" },
  title: { size: 16, weight: 700 },
  display: { size: 18, weight: 700 },

  // 역할표
  /** 화면 제목 .hero h1 */
  heroTitle: { size: 18, weight: 700, tracking: -0.02, lineHeight: 24.3 },
  /** 투뎁스 머리 제목 */
  heroTitle2: { size: 16, weight: 700, tracking: -0.01 },
  /** 머리 설명 .hero p, 빈 상태 둘째 줄 */
  heroDesc: { size: 11, weight: "body", tracking: -0.02, lineHeight: 15.95 },
  /** 시트 제목 */
  sheetTitle: { size: 16, weight: 700, tracking: -0.01 },
  /** 시트 설명(흐린 글자) */
  sheetDesc: { size: 11, weight: "body", tracking: -0.02, lineHeight: 15.95 },
  /** 행 제목 */
  rowTitle: { size: 13, weight: 600 },
  /** 행 서브. 08 설정과 §4.8 설명은 rowSubTight */
  rowSub: { size: 11, weight: "body", lineHeight: 16.5 },
  rowSubTight: { size: 11, weight: "body", tracking: -0.02, lineHeight: 14.85 },
  /** 행 메타 */
  rowMeta: { size: 11, weight: "body", lineHeight: 16.5, tabular: true },
  /** 묶음 제목 .sec-h */
  sectionHead: { size: 11, weight: 600, lineHeight: 11 },
  /** 접이식 행 펼친 설명 */
  foldBody: { size: 11, weight: "body", tracking: -0.01, lineHeight: 16.5 },
  /** 본문 글, 말풍선 */
  text: { size: 13, weight: "body", lineHeight: 21.06 },
  /** 빈 상태 제목 */
  emptyTitle: { size: 14, weight: 600 },
  /** 긴 버튼 */
  cta: { size: 14, weight: "body", tracking: -0.01 },
  ghost: { size: 14, weight: 700 },
  /** 토스트 */
  toast: { size: 11, weight: "body", lineHeight: 17.05 },
  /** 카테고리 버튼 */
  category: { size: 10, weight: 600, lineHeight: 10 },
  /** 상단 바 토큰 수 */
  tokenNum: { size: 14, weight: 600, tabular: true },
  /** 내비바 제목 */
  navTitle: { size: 16, weight: 600 },

  // 단계 밖(명세 §3 '제외')
  /** 하단 탭 69 */
  tab69: { size: 22, weight: 700, tracking: -0.04, lineHeight: 25, tabular: true },
  /** 메시지 타이머, 행 오른쪽 날짜 */
  timer: { size: 10, weight: 600, tabular: true },
  /** 15 큰 69 */
  bigNum: { size: 112, weight: 700, tracking: -0.05, lineHeight: 112 },
} satisfies Record<string, TypeRole>;

export type TypeName = keyof typeof TYPE;
