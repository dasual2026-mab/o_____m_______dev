import { Platform, StyleSheet, Text, type TextProps, type TextStyle } from "react-native";
import { weightStyle } from "../theme/fonts";
import { useTheme } from "../theme/ThemeProvider";
import { DARK_INK_WEIGHT_BOOST, isDarkInk } from "../theme/ink";
import type { Palette } from "../theme/tokens";
import { TYPE, type TypeName, type WeightKey } from "../theme/typography";

type ColorKey = "primary" | "secondary" | "tertiary" | "danger" | "muted";

const COLOR: Record<ColorKey, keyof Palette> = {
  primary: "textPrimary",
  secondary: "textSecondary",
  tertiary: "textTertiary",
  danger: "danger",
  muted: "tabMuted",
};

export interface TxtProps extends TextProps {
  /** 글자 단계. typography.ts의 이름 */
  v?: TypeName;
  /** 굵기를 단계와 다르게 쓸 때 */
  w?: WeightKey;
  /** 글자색 이름. 직접 색을 줄 때는 style.color */
  c?: ColorKey;
  /**
   * 어두운 잉크 굵게를 직접 정할 때만 쓴다. 보통은 비워 둔다.
   * 비우면 최종 글자색이 어두운지 보고 정한다(theme/ink.ts).
   */
  darkInk?: boolean;
}

/**
 * 앱의 모든 글자는 이 부품으로 그린다.
 * 글꼴, 테마별 본문 굵기, 어두운 잉크 굵게, 자간(em을 px로), 숫자 폭 고정, 한글 낱말 줄바꿈을 한곳에서 맞춘다.
 * 앱 화면의 글자는 고를 수 없다(기획서 4.6 복사 막기). 입력칸은 이 부품을 쓰지 않는다.
 */
export function Txt({ v = "body", w, c = "primary", darkInk, style, ...rest }: TxtProps) {
  const t = useTheme();
  const role = TYPE[v] as (typeof TYPE)[TypeName] & { tracking?: number; lineHeight?: number; tabular?: boolean };
  const wk = w ?? role.weight;
  const base = wk === "body" ? t.bodyWeight : wk;
  // 굵게는 배경 모드가 아니라 최종 글자색으로 정한다. style.color가 있으면 그 색이 기준이다.
  const ink = StyleSheet.flatten(style)?.color ?? t.c[COLOR[c]];
  const weight = (darkInk ?? isDarkInk(ink)) ? base + DARK_INK_WEIGHT_BOOST : base;

  const s: TextStyle = {
    ...weightStyle(weight),
    fontSize: role.size,
    color: t.c[COLOR[c]],
    ...(role.tracking ? { letterSpacing: role.tracking * role.size } : null),
    ...(role.lineHeight ? { lineHeight: role.lineHeight } : null),
    ...(role.tabular ? { fontVariant: ["tabular-nums"] as TextStyle["fontVariant"] } : null),
  };

  return (
    <Text
      selectable={false}
      lineBreakStrategyIOS="hangul-word"
      allowFontScaling={false}
      style={[s, Platform.OS === "web" ? WEB_KEEP_ALL : null, style]}
      {...rest}
    />
  );
}

// 웹 미리보기에서도 프로토타입처럼 낱말 단위로 줄을 바꾼다.
const WEB_KEEP_ALL = { wordBreak: "keep-all", overflowWrap: "break-word" } as unknown as TextStyle;
