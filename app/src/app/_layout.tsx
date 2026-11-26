import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PortalHost } from "../components/Portal";
import { ToastProvider } from "../components/Toast";
import { FONT_ASSETS } from "../theme/fonts";
import { ThemeProvider, useTheme } from "../theme/ThemeProvider";

SplashScreen.preventAutoHideAsync();

function Root() {
  const { c } = useTheme();
  return (
    <ToastProvider>
      <PortalHost>
        <StatusBar style={c.statusBar} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bgBase }, animation: "slide_from_right" }}>
          {/* 탭 화면 사이는 밀기 없이 바꾼다. 명세 §10.8 좌우 밀기는 화면 이동 작업에서 더한다 */}
          <Stack.Screen name="anon" options={{ animation: "none" }} />
          <Stack.Screen name="chats" options={{ animation: "none" }} />
          <Stack.Screen name="profile" options={{ animation: "none" }} />
          <Stack.Screen name="settings" options={{ animation: "none" }} />
        </Stack>
      </PortalHost>
    </ToastProvider>
  );
}

export default function RootLayout() {
  // 글꼴은 앱 안의 파일에서만 읽는다. 외부에서 불러오지 않는다.
  const [loaded, error] = useFonts(FONT_ASSETS);

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Root />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
