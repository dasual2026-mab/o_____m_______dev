// 디자인 명세 §2 색 토큰과 §3 글자 단계를 앱 값으로 옮긴 것이다.
// 값은 프로토타입 화면에서 브라우저가 실제로 그린 값(계산값)으로 맞췄다. 2026-11-26 T-353.
// 화면 코드는 색을 직접 적지 않고 이 파일의 이름으로만 쓴다.

export type ThemeName = "beige" | "black";

export interface Palette {
  /** 화면 바탕, 시트, 바 */
  bgBase: string;
  /** 입력창, 카드 */
  bgRaised: string;
  /** 눌림 배경 */
  bgSunken: string;
  textPrimary: string;
  textSecondary: string;
  /** 흐린 글자. 플레이스홀더, 꺼진 탭, 시트 설명, 흐린 아이콘 */
  textTertiary: string;
  /** 텍스트 탭과 카테고리 버튼의 꺼진 글자 */
  tabMuted: string;
  /** 2px 바 경계, 목록 위 선 */
  line: string;
  /** 행 구분선, 목록 끝 선 */
  lineSoft: string;
  /** 시트 안 행 구분 */
  lineFaint: string;
  danger: string;
  fillStrong: string;
  reverseHeart: string;
  /** 상대 말풍선 */
  bubble: string;
  /** 내 말풍선 */
  bubbleMe: string;
  /** 입력칸 바탕 */
  input: string;
  /** 채운 버튼 바탕 */
  btnFill: string;
  /** 채운 버튼 글자 */
  btnInk: string;
  /** 블랙 배경에서 검은 글자가 올라가는 밝은 면 */
  invFace: string;
  /** 원형 프로필 사진 테두리 */
  phLine: string;
  /** 시트 뒤 딤 */
  dim: string;
  toastBg: string;
  toastInk: string;
  /** 카테고리 버튼 켬 */
  catOnBg: string;
  catOnInk: string;
  /** 검색어 형광펜 */
  hl: string;
  hlInk: string;
  /** 로고 숨쉬기 쉬는 색과 끝 색. 보이는 값 */
  logoRest: string;
  logoPeak: string;
  /** 상태바 글자 */
  statusBar: "dark" | "light";
}

export const PALETTES: Record<ThemeName, Palette> = {
  beige: {
    bgBase: "#E7DBC1",
    bgRaised: "#F5EEE0",
    bgSunken: "rgba(26,23,20,0.05)",
    textPrimary: "#151310",
    textSecondary: "#4A443B",
    textTertiary: "#635C4E",
    tabMuted: "#655F52",
    line: "#1A1714",
    lineSoft: "rgba(26,23,20,0.28)",
    lineFaint: "rgba(26,23,20,0.16)",
    danger: "#B32E1B",
    fillStrong: "#8C7458",
    reverseHeart: "#141110",
    bubble: "#EFE6D4",
    bubbleMe: "#D2C19D",
    input: "#F5EEE0",
    btnFill: "#151310",
    btnInk: "#E7DBC1",
    invFace: "#151310",
    phLine: "#B6A990",
    dim: "rgba(64,46,26,0.55)",
    toastBg: "#151310",
    toastInk: "#E7DBC1",
    catOnBg: "#FFFDF8",
    catOnInk: "#151310",
    hl: "#EAFF85",
    hlInk: "#151310",
    logoRest: "#000000",
    logoPeak: "#A2937A",
    statusBar: "dark",
  },
  black: {
    bgBase: "#000000",
    bgRaised: "#1C1C1C",
    bgSunken: "rgba(255,255,255,0.06)",
    textPrimary: "#F4F2ED",
    textSecondary: "#C6B495",
    textTertiary: "#8C8272",
    tabMuted: "#7D776E",
    line: "#F4F2ED",
    lineSoft: "rgba(244,242,237,0.20)",
    lineFaint: "rgba(244,242,237,0.09)",
    danger: "#FF6F5B",
    fillStrong: "#A89473",
    reverseHeart: "#F4F2ED",
    bubble: "#322B23",
    bubbleMe: "#6B5A43",
    input: "#2B251D",
    btnFill: "#F4F2ED",
    btnInk: "#000000",
    invFace: "#F4F2ED",
    phLine: "#343434",
    dim: "rgba(0,0,0,0.75)",
    toastBg: "#FFFFFF",
    toastInk: "#000000",
    catOnBg: "#4A4033",
    catOnInk: "#F4F2ED",
    hl: "#EAFF85",
    hlInk: "#151310",
    logoRest: "#F2F2F2",
    logoPeak: "#4C4437",
    statusBar: "light",
  },
};

/** 본문 굵기. 베이지 480, 블랙 450. 명세 §3, D-029 */
export const BODY_WEIGHT: Record<ThemeName, number> = { beige: 480, black: 450 };

// 어두운 잉크 굵게(글자 +40, 아이콘 선 ×1.12)는 theme/ink.ts에 있다. 배경 모드가 아니라 잉크 색으로 정한다(D-475).

/** 본문 양옆 여백. 명세 §4.7 */
export const GX = 12;

/** 움직임 곡선. 명세 --spring cubic-bezier(.32,.72,0,1) */
export const SPRING = [0.32, 0.72, 0, 1] as const;

/** 고정 높이. 명세 §1, §4.1, §4.4 */
export const LAYOUT = {
  topBar: 38,
  topBarLine: 2,
  bottomBar: 84,
  bottomBarLine: 2,
  /** 하단 탭 칸 폭과 좌우 여백 */
  tabWidth: 64,
  tabsPadX: 59.5,
  /** 탭 화면 토스트의 아래 끝. 바 윗선 위 19 */
  toastBottomWithBar: 103,
} as const;
