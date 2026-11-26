import { Placeholder } from "../components/Placeholder";
import { Screen } from "../components/Screen";

/** 07 내 프로필. T-353 빈 화면 */
export default function Screen07() {
  return (
    <Screen tab="profile">
      <Placeholder no="07" title="내 프로필" links={[]} />
    </Screen>
  );
}
