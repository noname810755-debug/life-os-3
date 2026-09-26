import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { Badge, Card, Header, IconButton, Input, PrimaryButton, Screen, Sheet } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { money, relative } from "@/src/lib/date";
import { useLifeStore } from "@/src/store/useLifeStore";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useS = makeStyles((c) => ({
  card: { padding: 0, overflow: "hidden" },
  banner: { height: 90, backgroundColor: c.brandPrimary, padding: spacing.lg, justifyContent: "flex-end" },
  dest: { fontSize: 22, fontWeight: "800", color: c.onBrandPrimary },
  body: { padding: spacing.lg, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
}));

export default function TripsScreen() {
  const s = useS();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const st = useLifeStore();
  const [add, setAdd] = useState(false);
  const [dest, setDest] = useState("");
  const [budget, setBudget] = useState("");
  const [when, setWhen] = useState<string | null>(dayjs().add(7, "day").toISOString());

  const submit = () => {
    const parsedBudget = budget.trim() ? parseFloat(budget) : undefined;
    if (!dest.trim()) { toast("Enter destination", "error"); return; }
    if (parsedBudget !== undefined && (!Number.isFinite(parsedBudget) || parsedBudget < 0)) { toast("Enter a valid budget", "error"); return; }
    st.addTrip({ destination: dest, budget: parsedBudget, startDate: when || undefined });
    setDest(""); setBudget(""); setAdd(false); toast("Trip created");
  };

  const spent = (tripId: string) => st.transactions.filter((t) => t.tripId === tripId && t.type === "expense").reduce((a, b) => a + b.amount, 0);
  const when7 = [
    { label: "This week", v: dayjs().add(3, "day").toISOString() }, { label: "Next week", v: dayjs().add(7, "day").toISOString() },
    { label: "Next month", v: dayjs().add(1, "month").toISOString() }, { label: "No date", v: null },
  ];

  return (
    <Screen>
      <Header title="Travel" back right={<IconButton name="plus" testID="trips-add" bg={colors.brandPrimary} color={colors.onBrandPrimary} onPress={() => setAdd(true)} />} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 100, gap: spacing.md }}>
        {st.trips.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: spacing.xxl, gap: spacing.md }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }}><Icon name="plane" size={32} color={colors.brandPrimary} /></View>
            <Text style={{ fontSize: 17, fontWeight: "800", color: colors.onSurface }}>No trips planned</Text>
            <PrimaryButton label="Plan a trip" icon="plane" onPress={() => setAdd(true)} testID="trips-empty-add" />
          </View>
        ) : st.trips.map((t) => (
          <Card key={t.id} testID={`trip-${t.id}`} onPress={() => router.push(`/trip/${t.id}` as any)} style={s.card}>
            <View style={s.banner}><Text style={s.dest}>{t.destination}</Text></View>
            <View style={s.body}>
              <View>
                <Text style={{ color: colors.muted, fontWeight: "700" }}>{t.startDate ? relative(t.startDate) : "No date"}</Text>
                <Text style={{ color: colors.onSurface, fontWeight: "800", marginTop: 2 }}>{money(spent(t.id))} / {money(t.budget)}</Text>
              </View>
              <Badge label={`${t.packing.filter((p) => p.packed).length}/${t.packing.length} packed`} />
            </View>
          </Card>
        ))}
      </ScrollView>

      <Sheet visible={add} onClose={() => setAdd(false)} title="New trip" testID="add-trip-sheet">
        <Input label="Destination" value={dest} onChangeText={setDest} placeholder="e.g. Jaipur" autoFocus />
        <Input label="Budget (₹)" value={budget} onChangeText={setBudget} placeholder="6000" keyboardType="numeric" />
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.onSurfaceTertiary, marginBottom: spacing.xs }}>When</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md }}>{when7.map((w) => <Pressable key={w.label} onPress={() => setWhen(w.v)} style={{ paddingHorizontal: 16, height: 36, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: when === w.v ? colors.brandPrimary : colors.surfaceTertiary }}><Text style={{ fontWeight: "700", color: when === w.v ? colors.onBrandPrimary : colors.onSurfaceTertiary }}>{w.label}</Text></Pressable>)}</View>
        <PrimaryButton label="Create trip" icon="plane" onPress={submit} testID="submit-trip" />
      </Sheet>
    </Screen>
  );
}
