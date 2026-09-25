import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { LockGate } from "@/src/components/LockGate";
import { ToastProvider } from "@/src/components/Toast";
import { queryClient } from "@/src/query-client";
import { setColorScheme, useTheme } from "@/src/theme";
import { useLifeStore } from "@/src/store/useLifeStore";

LogBox.ignoreAllLogs(true);

function ThemedStatusBar() {
  const { scheme } = useTheme();
  return <StatusBar style={scheme === "dark" ? "light" : "dark"} />;
}

export default function RootLayout() {
  const themePref = useLifeStore((s) => s.settings.theme);
  useEffect(() => {
    setColorScheme(themePref === "system" ? null : themePref);
  }, [themePref]);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <KeyboardProvider>
              <ToastProvider>
                <ThemedStatusBar />
                <LockGate>
                  <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
                    <Stack.Screen name="(tabs)" />
                  </Stack>
                </LockGate>
              </ToastProvider>
            </KeyboardProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
