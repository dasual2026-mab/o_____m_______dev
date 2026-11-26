import { Placeholder } from "../components/Placeholder";
import { Screen } from "../components/Screen";

/** 10 익명의 지인과의 대화. T-353 빈 화면 */
export default function Screen10() {
  return (
    <Screen toastPlace="room">
      <Placeholder no="10" title="익명의 지인과의 대화" links={[]} />
    </Screen>
  );
}
