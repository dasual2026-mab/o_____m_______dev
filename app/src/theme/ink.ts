// 어두운 잉크 굵게(명세 §3, D-475).
// 굵게 그리는 기준은 배경 모드가 아니라 잉크(글자, 선, 아이콘)의 색이다.
// 어두운 잉크는 밝은 잉크보다 얇아 보여서 한 단계 굵게 그린다.
// - 베이지 배경의 먹색 글자와 선: 굵게
// - 베이지 배경이라도 어두운 면(채운 버튼, 검은 유리 시트) 위 밝은 글자와 선: 원래 굵기
// - 블랙 배경의 밝은 글자와 선: 원래 굵기
// - 블랙 배경이라도 밝은 면(토스트, 채운 버튼, 켠 체크 상자) 위 검은 글자와 선: 굵게

/** 어두운 잉크 글자에 더하는 굵기. 프로토타입의 글자 테두리 .008em과 같은 굵기 차다 */
export const DARK_INK_WEIGHT_BOOST = 40;
/** 어두운 잉크 아이콘 선의 배율 */
export const DARK_INK_STROKE_SCALE = 1.12;

/**
 * 상대 휘도가 이 값보다 낮으면 어두운 잉크다.
 * 베이지 배경의 잉크(먹색 0.007, 보조 0.058, 흐린 0.109, 경고 0.118)는 아래이고,
 * 블랙 배경의 잉크(꺼진 탭 0.187, 흐린 0.22, 보조 0.46)와 밝은 글자는 위다.
 */
const DARK_LUMINANCE = 0.15;

const cache = new Map<string, boolean>();

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function parse(color: string): [number, number, number] | null {
  const c = color.trim().toLowerCase();
  const hex = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})([0-9a-f]{2})?$/);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split("").map(x => x + x).join("") : hex[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const rgb = c.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return null;
}

/** 이 색이 어두운 잉크인지. 알 수 없는 색은 굵게 하지 않는다 */
export function isDarkInk(color: unknown): boolean {
  if (typeof color !== "string") return false;
  const hit = cache.get(color);
  if (hit !== undefined) return hit;
  const p = parse(color);
  const dark = p ? 0.2126 * channel(p[0]) + 0.7152 * channel(p[1]) + 0.0722 * channel(p[2]) < DARK_LUMINANCE : false;
  cache.set(color, dark);
  return dark;
}

/** 어두운 선에 더하는 두께(px). 명세 §3 '선 = +0.5px' */
export const DARK_INK_LINE_ADD = 0.5;

/** 선 두께. 어두운 선이면 0.5를 더한다. 1px 선 → 1.5, 2px 선 → 2.5 */
export function lineWidth(base: number, color: unknown): number {
  return isDarkInk(color) ? base + DARK_INK_LINE_ADD : base;
}
