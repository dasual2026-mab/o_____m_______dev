import { Placeholder } from "../components/Placeholder";
import { Screen } from "../components/Screen";

/** 08c 문의 · 요청. T-353 빈 화면 */
export default function Screen08c() {
  return (
    <Screen tab="settings">
      <Placeholder no="08c" title="문의 · 요청" links={[]} />
    </Screen>
  );
}
