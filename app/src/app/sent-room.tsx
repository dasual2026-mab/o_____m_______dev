import { Placeholder } from "../components/Placeholder";
import { Screen } from "../components/Screen";

/** 10b 대화방(보낸). T-353 빈 화면 */
export default function Screen10b() {
  return (
    <Screen toastPlace="room">
      <Placeholder no="10b" title="대화방(보낸)" links={[]} />
    </Screen>
  );
}
