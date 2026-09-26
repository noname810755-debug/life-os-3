import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, IconName } from "@/src/components/Icon";
import { AppLogo } from "@/src/components/AppLogo";
import { Card, Header, Input, PrimaryButton, Screen, Sheet } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { seedDemo } from "@/src/lib/demo";
import { useLifeStore } from "@/src/store/useLifeStore";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useS = makeStyles((c) => ({
  profileCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginHorizontal: spacing.lg },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 26, fontWeight: "800", color: c.onBrandPrimary },
  name: { fontSize: 20, fontWeight: "800", color: c.onSurface },
  sub: { fontSize: 13, color: c.muted },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: c.muted, letterSpacing: 0.4, marginHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 14 },
  rowLabel: { fontSize: 15, fontWeight: "700", color: c.onSurface, flex: 1 },
  seg: { flexDirection: "row", backgroundColor: c.surfaceTertiary, borderRadius: radius.md, padding: 4, flex: 1 },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: radius.sm, alignItems: "center" },
  segText: { fontSize: 13, fontWeight: "800" },
}));

export default function ProfileScreen() {
  const s = useS();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const st = useLifeStore();
  const [nameSheet, setNameSheet] = useState(false);
  const [name, setName] = useState(st.settings.name);
  const [pinSheet, setPinSheet] = useState(false);
  const [pin, setPin] = useState("");
  const [dataSheet, setDataSheet] = useState<"export" | "import" | null>(null);
  const [importText, setImportText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const exportJson = JSON.stringify({
    people: st.people, tasks: st.tasks, transactions: st.transactions, events: st.events,
    goals: st.goals, habits: st.habits, trips: st.trips, budgets: st.budgets,
    subjects: st.subjects, workouts: st.workouts, inbox: st.inbox, settings: st.settings,
  });

  const themes: { key: "system" | "light" | "dark"; label: string }[] = [
    { key: "system", label: "System" }, { key: "light", label: "Light" }, { key: "dark", label: "Dark" },
  ];

  const togglePin = (v: boolean) => {
    if (v) setPinSheet(true);
    else { st.setSettings({ pinEnabled: false, pin: null }); toast("App lock disabled"); }
  };

  const savePin = () => {
    if (pin.length !== 4) { toast("PIN must be 4 digits", "error"); return; }
    st.setSettings({ pinEnabled: true, pin });
    setPin(""); setPinSheet(false); toast("App lock enabled");
  };

  const doImport = () => {
    try {
      const obj = JSON.parse(importText);
      if (st.importAll(obj)) { toast("Backup restored"); setDataSheet(null); setImportText(""); }
      else toast("Nothing to restore in this backup", "error");
    } catch { toast("Invalid backup format", "error"); }
  };

  const Row = ({ icon, label, right, onPress, testID, danger }: { icon: IconName; label: string; right?: React.ReactNode; onPress?: () => void; testID?: string; danger?: boolean }) => (
    <Pressable testID={testID} onPress={onPress} style={s.row} disabled={!onPress}>
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: danger ? colors.error + "22" : colors.surfaceTertiary, alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={20} color={danger ? colors.error : colors.brandPrimary} />
      </View>
      <Text style={[s.rowLabel, danger && { color: colors.error }]}>{label}</Text>
      {right ?? (onPress && <Icon name="chevron-right" size={18} color={colors.muted} />)}
    </Pressable>
  );

  return (
    <Screen>
      <Header title="Profile" subtitle="You & your data" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <Pressable style={s.profileCard} testID="profile-name" onPress={() => { setName(st.settings.name); setNameSheet(true); }}>
          <AppLogo size={60} />
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{st.settings.name}</Text>
            <Text style={s.sub}>{st.people.length} people · {st.tasks.length} tasks · {st.transactions.length} entries</Text>
          </View>
          <Icon name="edit" size={20} color={colors.muted} />
        </Pressable>

        <Text style={s.sectionTitle}>APPEARANCE</Text>
        <Card style={{ marginHorizontal: spacing.lg }}>
          <View style={s.row}>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center" }}><Icon name="sun" size={20} color={colors.brandPrimary} /></View>
            <View style={s.seg}>
              {themes.map((t) => (
                <Pressable key={t.key} testID={`theme-${t.key}`} onPress={() => st.setSettings({ theme: t.key })} style={[s.segBtn, st.settings.theme === t.key && { backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={[s.segText, { color: st.settings.theme === t.key ? colors.brandPrimary : colors.muted }]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Card>

        <Text style={s.sectionTitle}>PRIVACY & SECURITY</Text>
        <Card style={{ marginHorizontal: spacing.lg }}>
          <Row icon="lock" label="App Lock (PIN)" right={<Switch testID="pin-switch" value={st.settings.pinEnabled} onValueChange={togglePin} trackColor={{ true: colors.brandPrimary, false: colors.borderStrong }} thumbColor={colors.surfaceSecondary} />} />
          <View style={{ height: 1, backgroundColor: colors.divider }} />
          <View style={s.row}>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center" }}><Icon name="shield" size={20} color={colors.brandPrimary} /></View>
            <Text style={[s.rowLabel, { fontWeight: "600", fontSize: 13, color: colors.muted }]}>All data stays on this device. Nothing leaves your phone — 100% offline.</Text>
          </View>
        </Card>

        <Text style={s.sectionTitle}>NOTIFICATIONS</Text>
        <Card style={{ marginHorizontal: spacing.lg }}>
          <Row icon="bell" label="Notification settings" testID="notification-settings" onPress={() => router.push("/notifications")} />
        </Card>

        <Text style={s.sectionTitle}>DATA</Text>
        <Card style={{ marginHorizontal: spacing.lg }}>
          <Row icon="sparkles" label="Load example data" testID="load-demo" onPress={() => { seedDemo(); toast("Example data loaded — explore the graph!"); }} />
          <View style={{ height: 1, backgroundColor: colors.divider }} />
          <Row icon="download" label="Export backup" testID="export-data" onPress={() => setDataSheet("export")} />
          <View style={{ height: 1, backgroundColor: colors.divider }} />
          <Row icon="inbox" label="Restore backup" testID="import-data" onPress={() => setDataSheet("import")} />
          <View style={{ height: 1, backgroundColor: colors.divider }} />
          <Row icon="trash" label="Delete all data" testID="delete-data" danger onPress={() => setConfirmDelete(true)} />
        </Card>

        <Text style={s.sectionTitle}>LEGAL & SUPPORT</Text>
        <Card style={{ marginHorizontal: spacing.lg }}>
          <Row icon="shield" label="Privacy Policy" testID="privacy-policy" onPress={() => router.push("/privacy")} />
          <View style={{ height: 1, backgroundColor: colors.divider }} />
          <Row icon="list" label="Terms of Use" testID="terms-of-use" onPress={() => router.push("/terms")} />
          <View style={{ height: 1, backgroundColor: colors.divider }} />
          <Row icon="inbox" label="Email support" testID="email-support" onPress={() => Linking.openURL("mailto:jarvisai9077@gmail.com")} />
        </Card>

        <Text style={{ textAlign: "center", color: colors.muted, fontSize: 12, marginTop: spacing.xl }}>Life OS · offline-first · v1.0</Text>
      </ScrollView>

      <Sheet visible={nameSheet} onClose={() => setNameSheet(false)} title="Your name" testID="name-sheet">
        <Input value={name} onChangeText={setName} placeholder="Your name" autoFocus />
        <PrimaryButton label="Save" onPress={() => { st.setSettings({ name: name.trim() || "You" }); setNameSheet(false); toast("Saved"); }} testID="name-save" />
      </Sheet>

      <Sheet visible={pinSheet} onClose={() => setPinSheet(false)} title="Set 4-digit PIN" testID="pin-sheet">
        <Input value={pin} onChangeText={(v) => setPin(v.replace(/\D/g, "").slice(0, 4))} placeholder="••••" keyboardType="number-pad" secureTextEntry autoFocus />
        <PrimaryButton label="Enable lock" onPress={savePin} testID="pin-save" />
      </Sheet>

      <Sheet visible={dataSheet === "export"} onClose={() => setDataSheet(null)} title="Backup data" testID="export-sheet">
        <Text style={{ color: colors.muted, marginBottom: spacing.md }}>Long-press to select & copy this backup. Keep it safe — paste it into Restore to bring everything back.</Text>
        <TextInput value={exportJson} multiline editable={false} style={{ backgroundColor: colors.surfaceTertiary, borderRadius: radius.md, padding: spacing.md, color: colors.onSurface, minHeight: 160, fontSize: 12 }} />
      </Sheet>

      <Sheet visible={dataSheet === "import"} onClose={() => setDataSheet(null)} title="Restore backup" testID="import-sheet">
        <Text style={{ color: colors.muted, marginBottom: spacing.md }}>Paste a backup below to restore. This replaces your current data.</Text>
        <TextInput value={importText} onChangeText={setImportText} multiline placeholder="Paste backup JSON…" placeholderTextColor={colors.muted} style={{ backgroundColor: colors.surfaceTertiary, borderRadius: radius.md, padding: spacing.md, color: colors.onSurface, minHeight: 140, fontSize: 12, marginBottom: spacing.md }} />
        <PrimaryButton label="Restore" onPress={doImport} testID="import-run" />
      </Sheet>

      <Sheet visible={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete all data?" testID="delete-sheet">
        <Text style={{ color: colors.muted, marginBottom: spacing.lg }}>This permanently clears everything from this device. This cannot be undone.</Text>
        <PrimaryButton label="Delete everything" icon="trash" onPress={() => { st.resetAll(); setConfirmDelete(false); toast("All data deleted"); }} testID="delete-confirm" />
        <View style={{ height: spacing.sm }} />
        <Pressable onPress={() => setConfirmDelete(false)} style={{ alignItems: "center", padding: spacing.md }}><Text style={{ color: colors.muted, fontWeight: "700" }}>Cancel</Text></Pressable>
      </Sheet>
    </Screen>
  );
}
