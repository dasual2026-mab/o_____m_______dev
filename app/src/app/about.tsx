import { lastTab } from "../components/BottomBar";
import { Placeholder } from "../components/Placeholder";
import { Screen } from "../components/Screen";

/** 19 오엠 소개. T-353 빈 화면 */
export default function Screen19() {
  return (
    <Screen tab={lastTab()}>
      <Placeholder no="19" title="오엠 소개" links={[]} />
    </Screen>
  );
}
