import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { lineWidth } from "../theme/ink";
import { useTheme } from "../theme/ThemeProvider";
import { GX, SPRING } from "../theme/tokens";
import { IconChevronDown } from "./icons";
import { Txt } from "./Txt";

export interface FoldRowProps {
  title: string;
  /** 펼친 설명. 글자면 11 보조 글자로 그린다 */
  children: ReactNode;
  /** 처음 펼침 */
  initialOpen?: boolean;
  /** 밖에서 펼침을 쥘 때 */
  open?: boolean;
  onToggle?: (open: boolean) => void;
  /** 행 아랫선. 목록 마지막 행은 false */
  divider?: boolean;
  /** 제목 왼쪽에 붙는 것. 02 동의 체크 상자 등 */
  left?: ReactNode;
}

const DUR = 450;
const ease = Easing.bezier(...SPRING);

/**
 * 접이식 행. 제목 한 줄과 오른쪽 접이 화살표. 행을 누르면 설명을 펼치고 접는다.
 * 15 오엠 탈퇴와 02 오엠 시작 사용 동의가 같은 꼴이다(용어집 '접이식 행', D-333).
 * 값: 행 높이 44, 안 여백 위아래 14 · 왼쪽 27 · 오른쪽 16, 제목 13 / 600,
 * 화살표 14(칸 44, 흐린 글자색) 펼치면 180도, 설명 위 10 · 11px 줄 1.5.
 */
export function FoldRow({ title, children, initialOpen = false, open, onToggle, divider = true, left }: FoldRowProps) {
  const { c } = useTheme();
  const [inner, setInner] = useState(initialOpen);
  const isOpen = open ?? inner;
  const [bodyH, setBodyH] = useState(0);
  const a = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(a, { toValue: isOpen ? 1 : 0, duration: DUR, easing: ease, useNativeDriver: false }).start();
  }, [isOpen, a]);

  const toggle = () => {
    const next = !isOpen;
    setInner(next);
    onToggle?.(next);
  };

  const onBody = (e: LayoutChangeEvent) => setBodyH(e.nativeEvent.layout.height);

  return (
    <Pressable onPress={toggle} accessibilityRole="button" accessibilityState={{ expanded: isOpen }} style={({ pressed }) => [s.row, pressed && { backgroundColor: c.bgSunken }]}>
      <View style={s.main}>
        <View style={s.titleRow}>
          {left}
          <Txt v="rowTitle" numberOfLines={1} style={s.title}>
            {title}
          </Txt>
        </View>
        <Animated.View style={{ height: a.interpolate({ inputRange: [0, 1], outputRange: [0, bodyH] }), opacity: a, overflow: "hidden" }}>
          <View onLayout={onBody} style={s.bodyMeasure}>
            {typeof children === "string" ? (
              <Txt v="foldBody" c="secondary">
                {children}
              </Txt>
            ) : (
              children
            )}
          </View>
        </Animated.View>
      </View>
      <View style={s.chev} pointerEvents="none">
        <Animated.View style={{ transform: [{ rotate: a.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) }] }}>
          <IconChevronDown size={14} color={c.textTertiary} />
        </Animated.View>
      </View>
      {divider && <View style={[s.line, { backgroundColor: c.lineSoft, height: lineWidth(1, c.lineSoft) }]} />}
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { minHeight: 44, paddingVertical: 14, paddingLeft: GX + 15, paddingRight: GX + 4, flexDirection: "row" },
  main: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingRight: 27 },
  title: { flexShrink: 1, lineHeight: 16 },
  bodyMeasure: { position: "absolute", left: 0, right: 0, top: 0, paddingTop: 10 },
  chev: { position: "absolute", top: 0, right: 1, width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  line: { position: "absolute", left: GX, right: GX + 4, bottom: 0, height: 1 },
});
