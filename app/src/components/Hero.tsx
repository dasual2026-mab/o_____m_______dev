import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { GX, SPRING } from "../theme/tokens";
import { IconChevronDown } from "./icons";
import { Txt } from "./Txt";

export interface HeroProps {
  title: string;
  /** 접이식 설명. 없으면 화살표 없음 */
  desc?: string;
  /** 처음 펼침. 탭 화면은 그 화면을 접은 적이 없으면 펼침(명세 §4.5) */
  initialOpen?: boolean;
  /** 제목 줄 오른쪽 끝 아이콘(돋보기 등) */
  right?: ReactNode;
}

const ease = Easing.bezier(...SPRING);

/**
 * 화면 머리. 제목 18 / 700과 14px 접이 화살표, 접이식 설명 11px. 명세 §4.5.
 * 접은 화면을 기억하는 일(omHxFold)과 화살표 숨쉬기는 탭 화면 작업에서 더한다.
 */
export function Hero({ title, desc, initialOpen = false, right }: HeroProps) {
  const { c } = useTheme();
  const [open, setOpen] = useState(initialOpen);
  const [h, setH] = useState(0);
  const a = useRef(new Animated.Value(initialOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(a, { toValue: open ? 1 : 0, duration: 450, easing: ease, useNativeDriver: false }).start();
  }, [open, a]);

  return (
    <View style={s.hero}>
      <View style={s.row}>
        <Pressable disabled={!desc} onPress={() => setOpen(o => !o)} style={s.titleBtn} accessibilityRole="button" accessibilityState={desc ? { expanded: open } : undefined}>
          <Txt v="heroTitle" accessibilityRole="header">
            {title}
          </Txt>
          {desc ? (
            <Animated.View style={{ transform: [{ rotate: a.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) }] }}>
              <IconChevronDown size={14} color={c.textPrimary} />
            </Animated.View>
          ) : null}
        </Pressable>
        <View style={s.right}>{right}</View>
      </View>
      {desc ? (
        <Animated.View style={{ height: a.interpolate({ inputRange: [0, 1], outputRange: [0, h + 8] }), opacity: a, overflow: "hidden" }}>
          <View style={s.measure} onLayout={e => setH(e.nativeEvent.layout.height)}>
            <Txt v="heroDesc" c="secondary">
              {desc}
            </Txt>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  hero: { paddingTop: 11, paddingHorizontal: GX, paddingBottom: 8 },
  row: { flexDirection: "row", alignItems: "center" },
  titleBtn: { flexDirection: "row", alignItems: "center", gap: 8 },
  right: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 14 },
  measure: { position: "absolute", left: 0, right: 0, top: 8 },
});
