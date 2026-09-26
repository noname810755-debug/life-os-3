import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { Header, Screen } from "@/src/components/ui";
import { spacing, useTheme } from "@/src/theme";

const SUPPORT_EMAIL = "jarvisai9077@gmail.com";

export default function TermsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Screen>
      <Header title="Terms of Use" back subtitle="Simple, transparent, offline-first" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 48 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: spacing.lg }}>Last updated: September 2026</Text>
        <TermsSection title="Acceptance" body="By using Life OS, you agree to these terms. If you do not agree, do not use the app." />
        <TermsSection title="Personal organization only" body="Life OS provides tools for organizing personal information, planning, budgeting, habits, study, fitness, and travel. It is not financial, medical, legal, or professional advice." />
        <TermsSection title="Your content and responsibility" body="You control the information you enter and are responsible for keeping backups of anything important. Review entries before relying on them, especially financial amounts and dates." />
        <TermsSection title="Offline operation" body="Life OS is designed to work without an account, backend, database, or cloud sync. Local notifications depend on Android permission and device settings, including battery optimization and notification channels." />
        <TermsSection title="Availability" body="We aim to keep Life OS reliable, but no software can guarantee uninterrupted operation on every device. Keep your Android system and the app build up to date." />
        <TermsSection title="Contact" body="Questions or support requests can be sent to jarvisai9077@gmail.com." />
        <Pressable onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: spacing.md }}>
          <Icon name="inbox" size={18} color={colors.brandPrimary} />
          <Text style={{ color: colors.brandPrimary, fontWeight: "800" }}>{SUPPORT_EMAIL}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function TermsSection({ title, body }: { title: string; body: string }) {
  const { colors } = useTheme();
  return <View style={{ marginBottom: spacing.lg }}><Text style={{ color: colors.onSurface, fontSize: 18, fontWeight: "800", marginBottom: spacing.xs }}>{title}</Text><Text style={{ color: colors.onSurfaceSecondary, fontSize: 15, lineHeight: 23 }}>{body}</Text></View>;
}
