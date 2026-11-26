import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lineWidth } from "../theme/ink";
import { useTheme } from "../theme/ThemeProvider";
import { SPRING } from "../theme/tokens";
import { IconClose } from "./icons";
import { Portal } from "./Portal";
import { useToast } from "./Toast";
import { Txt } from "./Txt";

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  /** 시트 제목. 16 / 700 */
  title?: string;
  /** 제목 아래 설명. 11 흐린 글자 */
  desc?: string;
  /** 오른쪽 위 닫기 X. 기본 있음 */
  closeButton?: boolean;
  /** 딤을 누르면 닫는지. 기본 닫음 */
  dismissOnDim?: boolean;
  children?: ReactNode;
}

const DUR = 450;
const ease = Easing.bezier(...SPRING);

/**
 * 바텀 시트와 딤. 명세 §5.7.
 * 화면 아래에서 0.45초 동안 올라온다. 테두리 1, 위 모서리 16, 안 여백 20 · 11 · 아래 48.
 * 아래 48은 프로토타입의 홈 표시줄 22를 포함한 값이라, 기기의 홈 표시줄 자리에 26을 더해 쓴다.
 * 시트가 열리면 토스트는 바로 닫힌다(T-330).
 */
export function BottomSheet({ visible, onClose, title, desc, closeButton = true, dismissOnDim = true, children }: BottomSheetProps) {
  const { c } = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const [h, setH] = useState(800);
  const a = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      toast.hide();
      Animated.timing(a, { toValue: 1, duration: DUR, easing: ease, useNativeDriver: true }).start();
    } else {
      Animated.timing(a, { toValue: 0, duration: DUR, easing: ease, useNativeDriver: true }).start(({ finished }) => finished && setMounted(false));
    }
  }, [visible, a, toast]);

  if (!mounted) return null;
  const home = Math.max(insets.bottom - 12, 8);
  // 어두운 테두리는 0.5 굵게, 안 내용 자리는 그대로
  const bw = lineWidth(1, c.line);
  const inset = bw - 1;

  return (
    <Portal z={31}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: c.dim, opacity: a }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismissOnDim ? onClose : undefined} accessibilityLabel="시트 닫기" />
      </Animated.View>
      <Animated.View
        onLayout={(e: LayoutChangeEvent) => setH(e.nativeEvent.layout.height)}
        accessibilityViewIsModal
        style={[
          s.sheet,
          { backgroundColor: c.bgBase, borderColor: c.line, borderWidth: bw, borderBottomWidth: 0, paddingTop: 20 - inset, paddingHorizontal: 11 - inset, paddingBottom: 26 + home },
          { transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [h * 1.03, 0] }) }] },
        ]}
      >
        {closeButton && (
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="닫기" style={({ pressed }) => [s.x, pressed && { opacity: 0.6 }]}>
            <IconClose size={18} color={c.textSecondary} />
          </Pressable>
        )}
        {title != null && (
          <Txt v="sheetTitle" accessibilityRole="header" style={s.title}>
            {title}
          </Txt>
        )}
        {desc != null && (
          <Txt v="sheetDesc" c="tertiary" style={s.desc}>
            {desc}
          </Txt>
        )}
        {children}
      </Animated.View>
    </Portal>
  );
}

/** 시트 아래 버튼 묶음. 위 16, 사이 8 */
export function SheetActions({ children }: { children: ReactNode }) {
  return <View style={s.acts}>{children}</View>;
}

const s = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 20,
    paddingHorizontal: 11,
  },
  x: { position: "absolute", top: 10, right: -4, width: 40, height: 40, alignItems: "center", justifyContent: "center", zIndex: 2 },
  title: { paddingRight: 34 },
  desc: { marginTop: 6 },
  acts: { marginTop: 16, gap: 8 },
});
