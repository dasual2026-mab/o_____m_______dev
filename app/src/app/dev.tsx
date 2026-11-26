import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { BottomSheet, SheetActions } from "../components/BottomSheet";
import { ApiError, getAppConfig, serverNow } from "../api";
import { Button } from "../components/Button";
import { CategoryBar } from "../components/CategoryBar";
import { FoldRow } from "../components/FoldRow";
import { Hero } from "../components/Hero";
import { Screen } from "../components/Screen";
import { useToast } from "../components/Toast";
import { Txt } from "../components/Txt";
import { useTheme } from "../theme/ThemeProvider";
import { GX } from "../theme/tokens";

/**
 * 부품 견본(개발용). 공통 부품을 한 화면에 모아 프로토타입과 나란히 견준다.
 * 출시 빌드에서는 01에서 들어오는 길이 없다(__DEV__).
 */
export default function DevParts() {
  const t = useTheme();
  const toast = useToast();
  const [cats, setCats] = useState<string[]>(["all"]);
  const [sheet, setSheet] = useState(false);
  const [server, setServer] = useState("서버 확인 중");

  // 요청 틀 확인. 공통 정의의 창구 이름으로 /v1/app/config를 부르고 서버 시각 차를 잰다.
  useEffect(() => {
    getAppConfig()
      .then(cfg => setServer(`서버 연결됨. 최소 판 ${cfg.min_version}, 서버 시각 차 ${Math.round((serverNow() - Date.now()) / 1000)}초`))
      .catch((e: unknown) => setServer(`서버 오류 ${e instanceof ApiError ? e.code : "알 수 없음"}`));
  }, []);

  return (
    <Screen tab="settings" topBar={{ tokens: 169, onTokens: () => toast.show("토큰 필을 눌렀습니다.") }}>
      <Hero title="부품 견본" desc="공통 부품을 모아 둔 개발용 화면입니다. 베이지와 블랙 두 배경에서 프로토타입과 견줍니다." initialOpen />
      <CategoryBar
        items={[{ key: "rep", label: "신고" }, { key: "blk", label: "차단" }, { key: "soon", label: "삭제 임박", dot: true }]}
        selected={cats}
        onChange={setCats}
        exclusive={[["rep", "blk"]]}
      />
      <View style={[s.top, { backgroundColor: t.c.line }]} />
      <FoldRow title="받은 6 · 9 사인">다시 시작하면 0부터 쌓입니다.</FoldRow>
      <FoldRow title="내 대화방과 보관함">익명 메시지와 답장, 신고 · 차단 보관함이 모두 삭제됩니다.</FoldRow>
      <FoldRow title="보유 토큰" initialOpen divider={false}>
        충전 토큰 169개는 환불받을 수 있으며(결제한 날부터 7일이 지나면 수수료 10%), 무료 토큰은 사라집니다.
      </FoldRow>
      <View style={[s.end, { backgroundColor: t.c.lineSoft }]} />

      <View style={s.btns}>
        <Button label={t.name === "beige" ? "블랙 배경으로 보기" : "베이지 배경으로 보기"} onPress={() => t.setTheme(t.name === "beige" ? "black" : "beige")} />
        <Button kind="ghost" label="토스트 보기" onPress={() => toast.show("○○○님에게 6 사인을 보냈습니다.\n내일 오전 06:09에 반영되며, 언제든 바꿔 보낼 수 있습니다.")} />
        <Button kind="ghost" label="바텀 시트 보기" onPress={() => setSheet(true)} />
        <Txt v="caption" c="secondary">{server}</Txt>
        <Txt v="caption" c="tertiary">{`글자 단계: 10 · 11 · 13 · 14 · 16 · 18 / 본문 굵기 ${t.bodyWeight}`}</Txt>
      </View>

      <BottomSheet visible={sheet} onClose={() => setSheet(false)} title="질문 차단" desc="차단을 해제하면 이 질문을 다시 받을 수 있습니다.">
        <SheetActions>
          <Button kind="ghost" label="차단 해제" onPress={() => setSheet(false)} />
        </SheetActions>
      </BottomSheet>
    </Screen>
  );
}

const s = StyleSheet.create({
  top: { height: 1, marginHorizontal: GX },
  end: { height: 1, marginLeft: GX, marginRight: GX + 4 },
  btns: { padding: GX, gap: 8, marginTop: 20 },
});
