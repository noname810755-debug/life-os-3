import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { Header, Screen } from "@/src/components/ui";
import { spacing, useTheme } from "@/src/theme";

const SUPPORT_EMAIL = "jarvisai9077@gmail.com";

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Screen>
      <Header title="Privacy Policy" back subtitle="Your data stays on your device" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 48 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: spacing.lg }}>Last updated: September 2026</Text>
        <Text style={{ color: colors.onSurface, fontSize: 15, lineHeight: 23, marginBottom: spacing.lg }}>Life OS is designed as an offline-first personal organizer. This policy explains what the app stores and how it is used.</Text>
        <PolicySection title="Information stored on your device" body="The people, tasks, finances, goals, habits, trips, study records, fitness records, settings, and backups you create are stored locally on your Android device. Life OS does not require an account, server, database, or cloud sync." />
        <PolicySection title="Notifications" body="If you enable reminders, Android stores and delivers scheduled local notifications on your device. Life OS does not send your notification data to a remote service." />
        <PolicySection title="Sharing and analytics" body="Life OS does not sell your personal information and does not include third-party advertising or analytics. No personal data is transmitted by the app as part of its offline features." />
        <PolicySection title="Your choices" body="You can edit or delete records at any time. Use Export backup to keep a copy, or Delete all data to remove the information stored by Life OS from this device." />
        <PolicySection title="Contact" body="For privacy questions or support, contact us at jarvisai9077@gmail.com." />
        <Pressable onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: spacing.md }}>
          <Icon name="inbox" size={18} color={colors.brandPrimary} />
          <Text style={{ color: colors.brandPrimary, fontWeight: "800" }}>{SUPPORT_EMAIL}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function PolicySection({ title, body }: { title: string; body: string }) {
  const { colors } = useTheme();
  return <View style={{ marginBottom: spacing.lg }}><Text style={{ color: colors.onSurface, fontSize: 18, fontWeight: "800", marginBottom: spacing.xs }}>{title}</Text><Text style={{ color: colors.onSurfaceSecondary, fontSize: 15, lineHeight: 23 }}>{body}</Text></View>;
}
