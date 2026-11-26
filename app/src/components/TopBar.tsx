import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { LAYOUT } from "../theme/tokens";
import { IconBack, IconTokenPlus } from "./icons";
import { LogoBreath } from "./LogoBreath";
import { Txt } from "./Txt";

export interface TopBarProps {
  /** 토큰 잔액. 없으면 토큰 필을 그리지 않는다 */
  tokens?: number | null;
  onTokens?: () => void;
  /** 로고를 누르면. 기본은 19 오엠 소개 */
  onLogo?: () => void;
  /** 뒤로. 기본은 바로 전 화면. 앞 화면이 없으면 움직이지 않는다(명세 §4.1) */
  onBack?: () => void;
}

/**
 * 상단 바. 뒤로 '<', 가운데 로고, 오른쪽 토큰 필. 명세 §4.1.
 * 높이 38(아랫선 2 포함). 세 부품 모두 2 위로 올린다.
 */
export function TopBar({ tokens, onTokens, onLogo, onBack }: TopBarProps) {
  const { c } = useTheme();
  const back = onBack ?? (() => router.canGoBack() && router.back());

  return (
    <View style={[s.bar, { borderBottomColor: c.line }]}>
      <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="뒤로" hitSlop={0} style={({ pressed }) => [s.back, pressed && s.backDown]}>
        <View style={{ transform: [{ translateY: -1.35 }] }}>
          <IconBack color={c.textPrimary} />
        </View>
      </Pressable>

      <View style={s.logo} pointerEvents="box-none">
        <Pressable onPress={onLogo ?? (() => router.push("/about"))} accessibilityRole="button" accessibilityLabel="오엠 소개">
          <LogoBreath />
        </Pressable>
      </View>

      {tokens != null ? (
        <Pressable onPress={onTokens} accessibilityRole="button" accessibilityLabel="토큰 충전" style={({ pressed }) => [s.pill, pressed && s.pillDown]}>
          <Txt v="tokenNum" style={{ transform: [{ translateY: -0.95 }] }}>
            {tokens}
          </Txt>
          <View style={{ marginLeft: 1.75, transform: [{ translateY: -3.65 }] }}>
            <IconTokenPlus color={c.textPrimary} bg={c.bgBase} />
          </View>
        </Pressable>
      ) : (
        <View style={s.pillGap} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    height: LAYOUT.topBar,
    borderBottomWidth: LAYOUT.topBarLine,
    paddingLeft: 4,
    paddingRight: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center", transform: [{ translateY: -2 }] },
  backDown: { opacity: 0.6, transform: [{ translateY: -2 }, { scale: 0.9 }] },
  logo: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -2.1 }],
  },
  pill: { height: 44, paddingHorizontal: 2, flexDirection: "row", alignItems: "center", transform: [{ translateY: -2 }] },
  pillDown: { transform: [{ translateY: -2 }, { scale: 0.94 }] },
  pillGap: { width: 44 },
});
