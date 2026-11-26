// 글꼴. Pretendard 1.3.9 가변 폰트 원본 파일을 앱에 넣어 쓴다(T-012).
// 파일은 자르거나 바꾸지 않았다. 외부 서버에서 불러오지 않는다.
// 원본: npm pretendard@1.3.9 dist/public/variable/PretendardVariable.ttf
// sha256 3090ccde0442bb347aa7685d9ba8b17436a60682df6e8f92a9a670de14056e22

import { Platform, type TextStyle } from "react-native";

export const FONT_FAMILY = "PretendardVariable";

export const FONT_ASSETS = {
  [FONT_FAMILY]: require("../../assets/fonts/PretendardVariable.ttf"),
};

/**
 * 가변 폰트 굵기를 정확한 값(480, 450 등)으로 고른다.
 * iOS와 Android는 굵기 축(wght)을 바로 주고, fontWeight는 주지 않는다.
 * fontWeight를 함께 주면 Android가 가짜 굵게를 덧그릴 수 있어서다.
 * 웹은 fontWeight 숫자를 그대로 받는다.
 */
export function weightStyle(weight: number): TextStyle {
  if (Platform.OS === "web") {
    return { fontFamily: FONT_FAMILY, fontWeight: String(weight) as TextStyle["fontWeight"] };
  }
  return { fontFamily: FONT_FAMILY, fontVariationSettings: { wght: weight } } as TextStyle;
}
