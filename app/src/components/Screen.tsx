import { useFocusEffect } from "expo-router";
import { useCallback, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import { BottomBar, type TabKey } from "./BottomBar";
import { useToast, type ToastPlace } from "./Toast";
import { TopBar, type TopBarProps } from "./TopBar";

export interface ScreenProps {
  /** 상단 바. 'bar' = 뒤로 · 로고 · 토큰 필, 'none' = 없음(01 · 02 · 19 등은 화면이 직접 그린다) */
  top?: "bar" | "none";
  topBar?: TopBarProps;
  /** 하단 탭 바의 켜진 탭. 없으면 바 없음(홈 표시줄만) */
  tab?: TabKey;
  /** 내용을 스크롤하는지. 대화방처럼 화면이 직접 스크롤을 쥐면 false */
  scroll?: boolean;
  /** 토스트 자리. 기본은 바가 있으면 'bar', 없으면 'plain' */
  toastPlace?: ToastPlace;
  children?: ReactNode;
}

/**
 * 화면 틀. 상태바 자리 → 상단 바 → 내용 → 하단 탭 바(또는 홈 표시줄 자리). 명세 §1, §4.
 * 상단 바와 하단 바 뒤로 내용이 흐르는 유리 효과(스크롤 때 반투명 · 흐림 7)는 아직 없다.
 * 지금은 멈춘 상태의 불투명 바와 같다. 차이는 Claude outputs/T353_기록.md 3장.
 */
export function Screen({ top = "bar", topBar, tab, scroll = true, toastPlace, children }: ScreenProps) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const place: ToastPlace = toastPlace ?? (tab ? "bar" : "plain");

  useFocusEffect(
    useCallback(() => {
      toast.setPlace(place);
    }, [toast, place]),
  );

  const home = Math.max(insets.bottom - 12, 8);
  const body = scroll ? (
    <ScrollView style={s.flex} contentContainerStyle={{ paddingBottom: 22 }} showsVerticalScrollIndicator={false} overScrollMode="never">
      {children}
    </ScrollView>
  ) : (
    <View style={s.flex}>{children}</View>
  );

  return (
    <View style={[s.flex, { backgroundColor: c.bgBase, paddingTop: insets.top }]}>
      {top === "bar" && <TopBar {...topBar} />}
      {body}
      {tab ? <BottomBar active={tab} /> : <View style={{ height: home }} />}
    </View>
  );
}

const s = StyleSheet.create({ flex: { flex: 1 } });
