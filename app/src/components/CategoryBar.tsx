import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { GX } from "../theme/tokens";
import { Txt } from "./Txt";

export interface Category {
  key: string;
  label: string;
  /** 이 카테고리에 확인하지 않은 빨간 점 줄이 있으면 이름 뒤 업데이트 점 */
  dot?: boolean;
}

export const ALL = "all";

/**
 * 카테고리 고르기 규칙(용어집 '카테고리 버튼', D-381 · D-388 · D-389 · D-413).
 * - 처음은 (전체)다. 다른 버튼을 켜면 (전체)가 꺼진다.
 * - 여럿을 켤 수 있고, 모두 맞는 행만 보인다.
 * - 한 행이 함께 들 수 없는 쌍(exclusive)은 누른 쪽으로 넘어간다.
 * - 모두 끄면 (전체)로 돌아간다. (전체)를 누르면 (전체)만 남는다.
 * - fullSet에 든 것이 모두 켜지면 (전체)와 같다(04의 사용자 + 미사용자).
 */
export function nextSelection(cur: string[], key: string, exclusive: [string, string][] = [], fullSet?: string[]): string[] {
  if (key === ALL) return [ALL];
  let sel = cur.filter(k => k !== ALL);
  if (sel.includes(key)) {
    sel = sel.filter(k => k !== key);
  } else {
    for (const [x, y] of exclusive) {
      if (key === x) sel = sel.filter(k => k !== y);
      if (key === y) sel = sel.filter(k => k !== x);
    }
    sel = [...sel, key];
  }
  if (fullSet && fullSet.every(k => sel.includes(k)) && sel.length === fullSet.length) return [ALL];
  return sel.length ? sel : [ALL];
}

export interface CategoryBarProps {
  items: Category[];
  selected: string[];
  onChange: (next: string[]) => void;
  exclusive?: [string, string][];
  fullSet?: string[];
}

/**
 * 카테고리 버튼 줄. 목록 위 태그 꼴 버튼. 명세 §5.4.
 * 꼴: 높이 17, 모서리 3, 좌우 6, 10 / 600. 켬은 밝은 면(블랙은 #4A4033), 꺼짐은 글자만.
 * 버튼 사이 6, 줄 위아래 8. 넘치면 옆으로 민다.
 * 첫 버튼은 (전체)이고, items에 넣지 않아도 붙는다.
 */
export function CategoryBar({ items, selected, onChange, exclusive, fullSet }: CategoryBarProps) {
  const { c } = useTheme();
  const all: Category[] = [{ key: ALL, label: "전체" }, ...items];
  return (
    <View style={s.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.bar} overScrollMode="never">
        {all.map(it => {
          const on = selected.includes(it.key);
          return (
            <Pressable
              key={it.key}
              onPress={() => onChange(nextSelection(selected, it.key, exclusive, fullSet))}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              hitSlop={{ top: 12.5, bottom: 12.5, left: 3, right: 3 }}
              style={({ pressed }) => [s.cat, on && { backgroundColor: c.catOnBg }, pressed && { transform: [{ scale: 0.96 }] }]}
            >
              <Txt v="category" style={{ color: on ? c.catOnInk : c.tabMuted }}>
                {it.label}
              </Txt>
              {it.dot && <View style={[s.dot, { backgroundColor: c.danger }]} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingVertical: 8 },
  bar: { height: 26, alignItems: "center", gap: 6, paddingLeft: GX, paddingRight: GX + 3 },
  cat: { height: 17, paddingHorizontal: 6, borderRadius: 3, flexDirection: "row", alignItems: "center" },
  dot: { width: 5, height: 5, borderRadius: 999, alignSelf: "flex-start", marginTop: 3, marginLeft: 3 },
});
