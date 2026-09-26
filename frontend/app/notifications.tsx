import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { Card, Header, PrimaryButton, Screen } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { configureNotifications, getNotificationStatus, scheduleDailyBriefing, scheduleTestNotification, cancelDailyBriefing } from "@/src/lib/notifications";
import { useLifeStore } from "@/src/store/useLifeStore";
import { spacing, useTheme } from "@/src/theme";

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const enabled = useLifeStore((state) => state.settings.notificationsEnabled);
  const setSettings = useLifeStore((state) => state.setSettings);
  const [granted, setGranted] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const status = await getNotificationStatus();
    setGranted(status.granted);
  }, []);

  useEffect(() => { refresh().catch(() => undefined); }, [refresh]);

  const toggleBriefing = async (value: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      if (value) {
        const permission = await configureNotifications();
        if (!permission.granted) {
          toast("Allow notifications in Android settings to continue", "error");
          setGranted(false);
          return;
        }
        await scheduleDailyBriefing();
        setSettings({ notificationsEnabled: true });
        setGranted(true);
        toast("Daily briefing scheduled for 9:00 AM");
      } else {
        await cancelDailyBriefing();
        setSettings({ notificationsEnabled: false });
        toast("Daily briefing disabled");
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not update notifications", "error");
    } finally {
      setBusy(false);
    }
  };

  const testNotification = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await scheduleTestNotification();
      setGranted(true);
      toast("Test reminder scheduled for 10 seconds");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not schedule reminder", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title="Notifications" back subtitle="Private reminders on this device" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 48, gap: spacing.md }} showsVerticalScrollIndicator={false}>
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }}><Icon name="bell" size={24} color={colors.brandPrimary} /></View>
            <View style={{ flex: 1 }}><Text style={{ color: colors.onSurface, fontSize: 17, fontWeight: "800" }}>Android notifications</Text><Text style={{ color: granted ? colors.success : colors.muted, fontSize: 13, marginTop: 3 }}>{granted ? "Permission enabled" : "Permission not enabled"}</Text></View>
          </View>
          <Text style={{ color: colors.onSurfaceSecondary, fontSize: 14, lineHeight: 21, marginTop: spacing.md }}>Notifications are scheduled locally by Android. They work without an account, backend, database, or internet connection.</Text>
        </Card>
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <View style={{ flex: 1 }}><Text style={{ color: colors.onSurface, fontSize: 16, fontWeight: "800" }}>Daily briefing</Text><Text style={{ color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 3 }}>A gentle reminder at 9:00 AM to review your day.</Text></View>
            <Switch value={enabled} onValueChange={toggleBriefing} disabled={busy} trackColor={{ true: colors.brandPrimary, false: colors.borderStrong }} thumbColor={colors.surfaceSecondary} />
          </View>
        </Card>
        <PrimaryButton label="Send a test reminder" icon="bell" onPress={testNotification} loading={busy} testID="notifications-test" />
        <Pressable onPress={refresh} style={{ alignItems: "center", padding: spacing.md }}><Text style={{ color: colors.brandPrimary, fontWeight: "800" }}>Refresh permission status</Text></Pressable>
      </ScrollView>
    </Screen>
  );
}
