import { StyleSheet, View } from "react-native";
import { FoldRow } from "../components/FoldRow";
import { Placeholder } from "../components/Placeholder";
import { Screen } from "../components/Screen";
import { Txt } from "../components/Txt";
import { OSS } from "../legal/licenses";

/**
 * 08 설정. T-353 빈 화면.
 * 오픈소스 라이선스 고지는 출시에 꼭 있어야 해서 이 단계에 미리 넣었다(T-012).
 * 행 꼴은 접이식 행이고, 펼친 설명의 꼴은 08 화면 작업에서 프로토타입에 맞춘다.
 */
export default function Screen08() {
  return (
    <Screen tab="settings">
      <Placeholder
        no="08"
        title="설정"
        links={[
          { label: "07c 받은 제재 · 이의제기", href: "/sanctions" },
          { label: "07d 토큰", href: "/tokens" },
          { label: "14 신고 · 차단 보관함", href: "/box" },
          { label: "15 계정", href: "/account" },
          { label: "08b 공지사항", href: "/notices" },
          { label: "08c 문의 · 요청", href: "/inquiry" },
          { label: "19 오엠 소개", href: "/about" },
          { label: "20 약관 · 개인정보 처리방침", href: "/terms" },
        ]}
      />
      <View style={s.gap} />
      <FoldRow title="오픈소스 라이선스" divider={false}>
        <View style={s.oss}>
          {OSS.map(o => (
            <View key={o.name} style={s.item}>
              <Txt v="rowTitle">{`${o.name}  ${o.kind}`}</Txt>
              <Txt v="caption" c="secondary">
                {o.license}
              </Txt>
              <Txt v="caption" c="tertiary" style={s.text}>
                {o.text}
              </Txt>
            </View>
          ))}
        </View>
      </FoldRow>
    </Screen>
  );
}

const s = StyleSheet.create({
  gap: { height: 20 },
  oss: { gap: 12 },
  item: { gap: 4 },
  text: { marginTop: 6, fontSize: 10, lineHeight: 15 },
});
