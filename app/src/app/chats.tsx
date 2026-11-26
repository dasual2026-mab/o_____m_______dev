import { Placeholder } from "../components/Placeholder";
import { Screen } from "../components/Screen";

/** 05 익명 대화. T-353 빈 화면 */
export default function Screen05() {
  return (
    <Screen tab="chats">
      <Placeholder no="05" title="익명 대화" links={[{ label: "10 대화방(받은)", href: "/room" }, { label: "10b 대화방(보낸)", href: "/sent-room" }, { label: "10c 오엠 공지사항", href: "/official" }]} />
    </Screen>
  );
}
