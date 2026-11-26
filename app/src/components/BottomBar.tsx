import { router, type Href } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import { LAYOUT } from "../theme/tokens";
import { IconBubble, IconGear } from "./icons";
import { Txt } from "./Txt";

export type TabKey = "anon" | "chats" | "profile" | "settings";

/** 탭 차례. 69 · 익명 메시지, 익명 대화, 내 프로필, 설정. 명세 §4.4 */
export const TABS: { key: TabKey; href: Href; label: string }[] = [
  { key: "anon", href: "/anon", label: "69 · 익명 메시지" },
  { key: "chats", href: "/chats", label: "익명 대화" },
  { key: "profile", href: "/profile", label: "내 프로필" },
  { key: "settings", href: "/settings", label: "설정" },
];

let last: TabKey = "anon";
/** 마지막으로 켜진 탭. 19 오엠 소개처럼 연 화면의 탭을 이어 켤 때 쓴다(명세 §4.4 omTab) */
export const lastTab = (): TabKey => last;

export interface BottomBarProps {
  /** 켜진 탭. 하위 화면은 들어온 탭 */
  active: TabKey;
  /** 새 소식 빨간 점이 켜진 탭 */
  news?: Partial<Record<TabKey, boolean>>;
  /** 내 프로필 탭의 작은 사진. 없으면 빈 원 */
  avatar?: React.ReactNode;
}

/**
 * 하단 탭 바. 명세 §4.4.
 * 윗선 2 + 탭 줄 60 + 홈 표시줄 자리. 홈 표시줄 자리는 기기의 아래 안전 영역에서 12를 뺀 값이다.
 * iPhone은 34 − 12 = 22로 프로토타입과 같다.
 */
export function BottomBar({ active, news, avatar }: BottomBarProps) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const home = Math.max(insets.bottom - 12, 8);
  last = active;

  const press = (key: TabKey, href: Href) => {
    if (key === active) router.dismissTo(href);
    else router.navigate(href);
  };

  return (
    <View style={[s.bar, { borderTopColor: c.line, backgroundColor: c.bgBase, paddingBottom: home }]}>
      <View style={s.tabs}>
        {TABS.map((t, i) => {
          const on = t.key === active;
          const ink = on ? c.textPrimary : c.textTertiary;
          return (
            <Pressable
              key={t.key}
              onPress={() => press(t.key, t.href)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={t.label}
              style={({ pressed }) => [s.tab, pressed && s.tabDown]}
            >
              {i === 0 && (
                <View style={s.c69}>
                  <Txt v="tab69" style={{ color: ink, transform: [{ translateY: 0.25 }] }}>
                    69
                  </Txt>
                </View>
              )}
              {i === 1 && (
                <View style={{ marginVertical: -0.87 }}>
                  <IconBubble size={26.74} color={ink} />
                </View>
              )}
              {i === 2 && <View style={[s.mini, { borderColor: c.phLine }]}>{avatar}</View>}
              {i === 3 && (
                <View style={{ marginVertical: 0.25 }}>
                  <IconGear size={24.5} color={ink} />
                </View>
              )}
              <View style={s.tdot}>{on && <View style={[s.underline, { backgroundColor: c.textPrimary }]} />}</View>
              {news?.[t.key] && <View style={[s.tnew, NEW_DOT[i], { backgroundColor: c.danger }]} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const NEW_DOT = [{ left: "50%", marginLeft: 13.5, top: 2.5 }, { left: "50%", marginLeft: 10, top: 2.5 }, { left: "50%", marginLeft: 10.5, top: 2 }, { left: "50%", marginLeft: 10.5, top: 2 }] as const;

const s = StyleSheet.create({
  bar: { borderTopWidth: LAYOUT.bottomBarLine },
  tabs: { flexDirection: "row", alignItems: "center", paddingTop: 6.5, paddingBottom: 8.5, paddingHorizontal: LAYOUT.tabsPadX },
  tab: { flex: 1, alignItems: "center", paddingTop: 5, paddingBottom: 4, gap: 3, transform: [{ translateY: 0.6 }] },
  tabDown: { transform: [{ translateY: 0.6 }, { scale: 0.9 }] },
  c69: { height: 25, justifyContent: "center", alignItems: "center" },
  mini: { width: 25, height: 25, marginVertical: 0.5, borderRadius: 999, overflow: "hidden", borderWidth: 1 },
  tdot: { width: 20, height: 7 },
  underline: { position: "absolute", left: 0, right: 0, top: 2.5, height: 2, borderRadius: 1 },
  tnew: { position: "absolute", width: 6, height: 6, borderRadius: 99 },
});
