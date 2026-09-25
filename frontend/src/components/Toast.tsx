import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { Icon, IconName } from "./Icon";

type Tone = "success" | "error" | "info";
interface ToastState { id: number; msg: string; tone: Tone; icon: IconName; }

const ToastCtx = createContext<(msg: string, tone?: Tone, icon?: IconName) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

const useS = makeStyles((c) => ({
  wrap: { position: "absolute", left: spacing.lg, right: spacing.lg, alignItems: "center", zIndex: 9999 },
  toast: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 12, paddingHorizontal: spacing.lg, borderRadius: radius.md, backgroundColor: c.surfaceInverse, maxWidth: 420, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  text: { color: c.onSurfaceInverse, fontSize: 14, fontWeight: "700", flexShrink: 1 },
}));

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const s = useS();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string, tone: Tone = "success", icon?: IconName) => {
    const ic: IconName = icon || (tone === "success" ? "check-circle" : tone === "error" ? "alert" : "sparkles");
    Haptics.notificationAsync(tone === "error" ? Haptics.NotificationFeedbackType.Error : Haptics.NotificationFeedbackType.Success).catch(() => {});
    setToast({ id: Date.now(), msg, tone, icon: ic });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const toneColor = toast ? (toast.tone === "error" ? colors.error : toast.tone === "info" ? colors.info : colors.success) : colors.success;

  return (
    <ToastCtx.Provider value={show}>
      {children}
      {toast && (
        <View style={[s.wrap, { top: insets.top + spacing.sm }]} pointerEvents="none">
          <Animated.View entering={FadeInUp.springify().damping(18)} exiting={FadeOutUp} style={s.toast} key={toast.id}>
            <Icon name={toast.icon} size={20} color={toneColor} />
            <Text style={s.text} numberOfLines={2}>{toast.msg}</Text>
          </Animated.View>
        </View>
      )}
    </ToastCtx.Provider>
  );
}
