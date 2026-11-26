import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { BODY_WEIGHT, PALETTES, type Palette, type ThemeName } from "./tokens";

interface ThemeValue {
  name: ThemeName;
  c: Palette;
  bodyWeight: number;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

/**
 * 베이지와 블랙 두 배경. 08 설정의 색상 고르기가 setTheme을 부른다.
 * 고른 값을 기기에 남기는 일은 08 설정 화면 작업에서 더한다.
 */
export function ThemeProvider({ children, initial = "beige" }: { children: ReactNode; initial?: ThemeName }) {
  const [name, setTheme] = useState<ThemeName>(initial);
  const value = useMemo<ThemeValue>(
    () => ({ name, c: PALETTES[name], bodyWeight: BODY_WEIGHT[name], setTheme }),
    [name],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const v = useContext(ThemeContext);
  if (!v) throw new Error("ThemeProvider 밖에서 useTheme을 불렀습니다.");
  return v;
}
