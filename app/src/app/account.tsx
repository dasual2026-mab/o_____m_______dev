import { Placeholder } from "../components/Placeholder";
import { Screen } from "../components/Screen";

/** 15 계정. T-353 빈 화면 */
export default function Screen15() {
  return (
    <Screen tab="settings">
      <Placeholder no="15" title="계정" links={[{ label: "02b 본인확인 · 재인증", href: "/verify" }]} />
    </Screen>
  );
}
