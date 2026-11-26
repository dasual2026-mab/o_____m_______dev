import { router, type Href } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { GX } from "../theme/tokens";
import { Hero } from "./Hero";
import { Txt } from "./Txt";

export interface PlaceholderLink {
  label: string;
  href: Href;
}

/**
 * T-353의 빈 화면 내용. 화면 번호와 타이틀, 이 화면에서 갈 수 있는 화면 목록만 있다.
 * 화면 작업에서 이 부품을 지우고 실제 내용을 넣는다.
 */
export function Placeholder({ no, title, links = [] }: { no: string; title: string; links?: PlaceholderLink[] }) {
  const { c } = useTheme();
  return (
    <View>
      <Hero title={title} />
      <Txt v="caption" c="tertiary" style={s.note}>
        {`${no} 빈 화면입니다.`}
      </Txt>
      <View style={[s.list, { borderTopColor: c.line }]}>
        {links.map(l => (
          <Pressable key={String(l.href)} onPress={() => router.push(l.href)} style={({ pressed }) => [s.row, pressed && { backgroundColor: c.bgSunken }]}>
            <Txt v="rowTitle">{l.label}</Txt>
            <View style={[s.line, { backgroundColor: c.lineSoft }]} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  note: { paddingHorizontal: GX, paddingBottom: 14 },
  list: { borderTopWidth: 1, marginHorizontal: GX },
  row: { minHeight: 44, justifyContent: "center", paddingLeft: 15 },
  line: { position: "absolute", left: 0, right: 4, bottom: 0, height: 1 },
});
