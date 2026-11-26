import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import { SPRING } from "../theme/tokens";
import { IconClose } from "./icons";
import { Txt } from "./Txt";

/**
 * 토스트. 명세 §5.7, 함수 showToast.
 * 3.5초 뒤 저절로 닫히고, 오른쪽 X로 닫을 수 있다. 시트가 열리면 바로 닫힌다(T-330).
 * 두 줄은 글자 안의 줄바꿈('\n')으로 쓴다.
 */

/** 토스트 아래 끝이 놓일 자리. 화면이 정한다 */
export type ToastPlace = "bar" | "plain" | "room";

interface ToastApi {
  show: (message: string) => void;
  hide: () => void;
  /** 화면이 자기 자리를 알린다. Screen 부품이 부른다 */
  setPlace: (p: ToastPlace) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const DURATION = 3500;
const ease = Easing.bezier(...SPRING);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState<string | null>(null);
  const [place, setPlace] = useState<ToastPlace>("bar");
  const a = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    Animated.timing(a, { toValue: 0, duration: 300, easing: ease, useNativeDriver: true }).start();
  }, [a]);

  const show = useCallback(
    (m: string) => {
      setMsg(m);
      if (timer.current) clearTimeout(timer.current);
      Animated.timing(a, { toValue: 1, duration: 300, easing: ease, useNativeDriver: true }).start();
      timer.current = setTimeout(hide, DURATION);
    },
    [a, hide],
  );

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  const api = useMemo(() => ({ show, hide, setPlace }), [show, hide]);

  // 프로토타입 값(홈 표시줄 22 기준)을 기기의 홈 표시줄 자리로 옮긴다.
  const home = Math.max(insets.bottom - 12, 8);
  const bottom = place === "bar" ? 62 + home + 19 : place === "room" ? home + 89 : home + 86;

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Animated.View
        pointerEvents="box-none"
        style={[
          s.toast,
          { bottom, backgroundColor: c.toastBg },
          { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }, { scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }] },
        ]}
      >
        <View style={[s.dot, { backgroundColor: c.toastInk }]} />
        <Txt v="toast" style={[s.tx, { color: c.toastInk }]}>
          {msg}
        </Txt>
        <Pressable onPress={hide} accessibilityLabel="토스트 닫기" hitSlop={10} style={({ pressed }) => [s.x, pressed && { opacity: 0.6 }]}>
          <IconClose size={14} color={c.toastInk} />
        </Pressable>
      </Animated.View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const v = useContext(ToastContext);
  if (!v) throw new Error("ToastProvider 밖에서 useToast를 불렀습니다.");
  return v;
}

const s = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 18,
    right: 18,
    zIndex: 70,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 14,
    paddingRight: 11,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  dot: { width: 6, height: 6, borderRadius: 99, marginTop: 5 },
  tx: { flex: 1 },
  x: { width: 14, height: 14, marginTop: 1.5 },
});
