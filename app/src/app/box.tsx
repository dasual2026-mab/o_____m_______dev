import { Placeholder } from "../components/Placeholder";
import { Screen } from "../components/Screen";

/** 14 신고 · 차단 보관함. T-353 빈 화면 */
export default function Screen14() {
  return (
    <Screen tab="settings">
      <Placeholder no="14" title="신고 · 차단 보관함" links={[]} />
    </Screen>
  );
}
