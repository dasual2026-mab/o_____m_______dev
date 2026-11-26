import { Placeholder } from "../components/Placeholder";
import { Screen } from "../components/Screen";

/** 10c 오엠 공지사항. T-353 빈 화면 */
export default function Screen10c() {
  return (
    <Screen toastPlace="room">
      <Placeholder no="10c" title="오엠 공지사항" links={[]} />
    </Screen>
  );
}
