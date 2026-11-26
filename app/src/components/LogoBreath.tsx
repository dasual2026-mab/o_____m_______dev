import { useEffect, useRef } from "react";
import { Animated, Easing, type ImageStyle, type StyleProp } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

const LOGO = require("../../assets/images/logo.png");
/** 로고 그림 비율. 4929 × 807 */
export const LOGO_RATIO = 4929 / 807;

/** 숨쉬기 한 바퀴 2.5초. 0 ~ 1.5초 쉬는 색, 1.5 ~ 2초 끝 색으로, 2 ~ 2.5초 돌아옴. 명세 §4.1, §6 */
const CYCLE = 2500;

function phaseAt(ms: number): number {
  const p = ms % CYCLE;
  if (p < 1500) return 0;
  const k = p < 2000 ? (p - 1500) / 500 : 1 - (p - 2000) / 500;
  return Easing.inOut(Easing.sin)(k);
}

/**
 * 상단 바 로고. 그림의 투명도는 그대로 두고 색만 입힌다(tintColor).
 * 박자는 시계 기준이라 화면을 넘어가도 이어진다.
 */
export function LogoBreath({ height = 20, breathe = true, style }: { height?: number; breathe?: boolean; style?: StyleProp<ImageStyle> }) {
  const { c } = useTheme();
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!breathe) return;
    let raf = 0;
    const tick = () => {
      v.setValue(phaseAt(Date.now()));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [breathe, v]);

  const tint = v.interpolate({ inputRange: [0, 1], outputRange: [c.logoRest, c.logoPeak] });
  return (
    <Animated.Image
      source={LOGO}
      accessibilityLabel="O_____M_______"
      resizeMode="contain"
      style={[{ height, width: height * LOGO_RATIO, tintColor: breathe ? tint : c.logoRest } as Animated.WithAnimatedValue<ImageStyle>, style as object]}
    />
  );
}
