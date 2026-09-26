import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { LockGate } from "@/src/components/LockGate";
import { ToastProvider } from "@/src/components/Toast";
import { configureNotifications, notificationRoute } from "@/src/lib/notifications";
import { setColorScheme, useTheme } from "@/src/theme";
import { useLifeStore } from "@/src/store/useLifeStore";

function ThemedStatusBar() {
  const { scheme } = useTheme();
  return <StatusBar style={scheme === "dark" ? "light" : "dark" } />;
}

function useNotificationObserver() {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    let mounted = true;
    const openFromResponse = (response: Notifications.NotificationResponse | null) => {
      const route = notificationRoute(response);
      if (mounted && route) router.push(route as never);
    };

    openFromResponse(Notifications.getLastNotificationResponse());
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(openFromResponse);
    const receivedSubscription = Notifications.addNotificationReceivedListener(() => undefined);
    configureNotifications().catch(() => undefined);

    return () => {
      mounted = false;
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, []);
}

export default function RootLayout() {
  const themePref = useLifeStore((s) => s.settings.theme);
  useNotificationObserver();
  useEffect(() => {
    setColorScheme(themePref === "system" ? null : themePref);
  }, [themePref]);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <KeyboardProvider>
            <ToastProvider>
              <ThemedStatusBar />
              <LockGate>
                <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false, animation: "none" }}>
                  <Stack.Screen name="(tabs)" />
                </Stack>
              </LockGate>
            </ToastProvider>
          </KeyboardProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
