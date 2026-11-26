// 아이콘. 명세 §8 아이콘 카탈로그와 프로토타입의 인라인 SVG 그대로다.
// 선 아이콘은 뷰박스 24, 선 1.7, 끝 square, 꺾임 miter.
// 어두운 잉크의 아이콘은 선 굵기를 1.12배로 그린다(명세 §3, D-475).
// 기준은 배경 모드가 아니라 아이콘 색이다. 어두운 면 위 밝은 아이콘은 원래 굵기다.

import Svg, { Circle, Path } from "react-native-svg";
import { DARK_INK_STROKE_SCALE, isDarkInk } from "../theme/ink";

interface IconProps {
  size: number;
  color: string;
  /** 기본 1.7 */
  stroke?: number;
}

function Line({ size, color, stroke = 1.7, children }: IconProps & { children: React.ReactNode }) {
  const sw = isDarkInk(color) ? stroke * DARK_INK_STROKE_SCALE : stroke;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="square" strokeLinejoin="miter">
      {children}
    </Svg>
  );
}

/** 익명 대화 탭 말풍선 */
export const IconBubble = (p: IconProps) => (
  <Line {...p}>
    <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </Line>
);

/** 설정 탭 톱니 */
export const IconGear = (p: IconProps) => (
  <Line {...p}>
    <Circle cx="12" cy="12" r="3" />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Line>
);

/** 접이 화살표 ▾. 펼치면 180도 돌린다 */
export const IconChevronDown = (p: IconProps) => (
  <Line {...p}>
    <Path d="M6 9l6 6 6-6" />
  </Line>
);

/** 닫기 X. 시트와 토스트 */
export const IconClose = (p: IconProps) => (
  <Line {...p}>
    <Path d="M5.5 5.5l13 13M18.5 5.5l-13 13" />
  </Line>
);

/** 돋보기 */
export const IconSearch = (p: IconProps) => (
  <Line {...p}>
    <Circle cx="11" cy="11" r="7" />
    <Path d="M21 21l-4.3-4.3" />
  </Line>
);

/**
 * 뒤로 '<'. Asimovian less 글리프 윤곽(명세 §4.1). 상자 13 × 21.
 * 어두운 잉크면 같은 색 덧선 8.9(뷰박스 619)을 더한다.
 */
export function IconBack({ color }: { color: string }) {
  const dark = isDarkInk(color);
  return (
    <Svg width={13} height={21} viewBox="0 -850 619.048 1000">
      <Path
        transform="scale(1 -1)"
        d="M545 59 55 269V352L545 562V477L178 311L545 144Z"
        fill={color}
        stroke={dark ? color : "none"}
        strokeWidth={dark ? 8.9 : 0}
      />
    </Svg>
  );
}

/**
 * 토큰 '+'. Asimovian plus 윤곽의 팔을 늘린 꼴(명세 §4.1). 상자 15 × 25.
 * 바탕색 선으로 깎는다. 어두운 잉크면 6.52(굵게), 밝은 잉크면 14.
 */
export function IconTokenPlus({ color, bg }: { color: string; bg: string }) {
  const dark = isDarkInk(color);
  return (
    <Svg width={15} height={25} viewBox="0 -850 600 1000" style={{ overflow: "visible" }}>
      <Path
        transform="scale(1 -1)"
        d="M6 211V313H244V555H354V313H592V211H354V-31H244V211Z"
        fill={color}
        stroke={bg}
        strokeWidth={dark ? 6.52 : 14}
      />
    </Svg>
  );
}
