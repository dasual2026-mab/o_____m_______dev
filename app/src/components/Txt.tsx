import { Platform, Text, type TextProps, type TextStyle } from "react-native";
import { weightStyle } from "../theme/fonts";
import { useTheme } from "../theme/ThemeProvider";
import { BEIGE_WEIGHT_BOOST, type Palette } from "../theme/tokens";
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
   * 어두운 면 위 밝은 글자처럼 베이지 '한 단계 굵게'를 빼는 곳(명세 §3).
   * 채운 버튼, 토스트가 그렇다.
   */
  noBoost?: boolean;
}

/**
 * 앱의 모든 글자는 이 부품으로 그린다.
 * 글꼴, 테마별 본문 굵기, 자간(em을 px로), 숫자 폭 고정, 한글 낱말 줄바꿈을 한곳에서 맞춘다.
 * 앱 화면의 글자는 고를 수 없다(기획서 4.6 복사 막기). 입력칸은 이 부품을 쓰지 않는다.
 */
export function Txt({ v = "body", w, c = "primary", noBoost, style, ...rest }: TxtProps) {
  const t = useTheme();
  const role = TYPE[v] as (typeof TYPE)[TypeName] & { tracking?: number; lineHeight?: number; tabular?: boolean };
  const wk = w ?? role.weight;
  const base = wk === "body" ? t.bodyWeight : wk;
  const weight = t.name === "beige" && !noBoost ? base + BEIGE_WEIGHT_BOOST : base;

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
