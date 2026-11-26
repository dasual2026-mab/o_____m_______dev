import { Placeholder } from "../components/Placeholder";
import { Screen } from "../components/Screen";

/** 02b 본인확인 · 재인증. T-353 빈 화면 */
export default function Screen02b() {
  return (
    <Screen>
      <Placeholder no="02b" title="본인확인 · 재인증" links={[{ label: "04 69 · 익명 메시지", href: "/anon" }]} />
    </Screen>
  );
}
