import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { Txt } from "./Txt";

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  /** cta = 채운 긴 버튼, ghost = 테두리 긴 버튼 */
  kind?: "cta" | "ghost";
  /** 꺼진 버튼. 눌러도 onPress 대신 onDisabledPress(안내 토스트 등)를 부른다 */
  disabled?: boolean;
  onDisabledPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * 긴 버튼. 명세 §5.1. 높이 44, 알약 모서리, 14px.
 * 채운 버튼 글자는 본문 굵기이고 어두운 면 위라 베이지 '굵게'를 빼고 그린다(명세 §3).
 */
export function Button({ label, onPress, kind = "cta", disabled, onDisabledPress, style }: ButtonProps) {
  const { c } = useTheme();
  const cta = kind === "cta";
  return (
    <Pressable
      onPress={disabled ? onDisabledPress : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        s.btn,
        cta ? { backgroundColor: c.btnFill } : { borderWidth: 1, borderColor: c.line },
        disabled && { opacity: 0.4 },
        pressed && !disabled && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      <Txt v={cta ? "cta" : "ghost"} noBoost={cta} style={{ color: cta ? c.btnInk : c.textPrimary }}>
        {label}
      </Txt>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: { height: 44, borderRadius: 999, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
});
