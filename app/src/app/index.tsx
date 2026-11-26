import { Placeholder } from "../components/Placeholder";
import { Screen } from "../components/Screen";

/** 01 스플래시. T-353 빈 화면 */
export default function Screen01() {
  return (
    <Screen top="none">
      <Placeholder no="01" title="스플래시" links={[{ label: "02 오엠 시작", href: "/start" }, { label: "04 69 · 익명 메시지", href: "/anon" }, ...(__DEV__ ? [{ label: "부품 견본(개발용)", href: "/dev" as const }] : [])]} />
    </Screen>
  );
}
