import { Placeholder } from "../components/Placeholder";
import { Screen } from "../components/Screen";

/** 08b 공지사항. T-353 빈 화면 */
export default function Screen08b() {
  return (
    <Screen tab="settings">
      <Placeholder no="08b" title="공지사항" links={[]} />
    </Screen>
  );
}
