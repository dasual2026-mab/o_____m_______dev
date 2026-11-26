import { Placeholder } from "../components/Placeholder";
import { Screen } from "../components/Screen";

/** 04 69 · 익명 메시지. T-353 빈 화면 */
export default function Screen04() {
  return (
    <Screen tab="anon">
      <Placeholder no="04" title="69 · 익명 메시지" links={[{ label: "10b 대화방(보낸)", href: "/sent-room" }]} />
    </Screen>
  );
}
