import { Placeholder } from "../components/Placeholder";
import { Screen } from "../components/Screen";

/** 02 오엠 시작. T-353 빈 화면 */
export default function Screen02() {
  return (
    <Screen top="none">
      <Placeholder no="02" title="오엠 시작" links={[{ label: "02b 본인확인 · 재인증", href: "/verify" }, { label: "20 약관 · 개인정보 처리방침", href: "/terms" }, { label: "04 69 · 익명 메시지", href: "/anon" }]} />
    </Screen>
  );
}
