import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { Card, Header, Input, PrimaryButton, ProgressBar, Screen, Sheet } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { money, relative } from "@/src/lib/date";
import { useLifeStore } from "@/src/store/useLifeStore";
import { makeStyles, spacing, useTheme } from "@/src/theme";

const useS = makeStyles((c) => ({
  pack: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 10 },
  cb: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
}));

export default function TripDetailScreen() {
  const s = useS();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const st = useLifeStore();
  const trip = st.trips.find((t) => t.id === id);
  const [packSheet, setPackSheet] = useState(false);
  const [packLabel, setPackLabel] = useState("");
  const [expSheet, setExpSheet] = useState(false);
  const [expAmt, setExpAmt] = useState("");
  const [expNote, setExpNote] = useState("");

  const expenses = useMemo(() => st.transactions.filter((t) => t.tripId === id), [st.transactions, id]);
  const spent = expenses.filter((t) => t.type === "expense").reduce((a, b) => a + b.amount, 0);

  if (!trip) return <Screen><Header title="Trip" back /><View style={{ padding: spacing.xl }}><Text style={{ color: colors.muted }}>Trip not found.</Text></View></Screen>;

  const addPack = () => { if (packLabel.trim()) { st.addPacking(trip.id, packLabel.trim()); setPackLabel(""); } };
  const addExp = () => {
    const amt = parseFloat(expAmt);
    if (!amt) { toast("Enter amount", "error"); return; }
    st.addTxn({ type: "expense", amount: amt, category: "Travel", note: expNote || trip.destination, tripId: trip.id });
    setExpAmt(""); setExpNote(""); setExpSheet(false); toast("Expense added");
  };

  const people = st.people.filter((p) => trip.peopleIds?.includes(p.id));

  return (
    <Screen>
      <Header title={trip.destination} back right={<Pressable testID="trip-del" onPress={() => { st.removeTrip(trip.id); toast("Trip deleted"); router.back(); }}><Icon name="trash" size={20} color={colors.muted} /></Pressable>} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 120, gap: spacing.md }}>
        <Card>
          <Text style={{ fontSize: 13, color: colors.muted, fontWeight: "700" }}>{trip.startDate ? relative(trip.startDate) : "No date set"}</Text>
          <Text style={{ fontSize: 26, fontWeight: "800", color: colors.onSurface, marginVertical: 6 }}>{money(spent)} <Text style={{ fontSize: 16, color: colors.muted }}>/ {money(trip.budget)}</Text></Text>
          {trip.budget ? <ProgressBar value={spent / trip.budget} color={spent > trip.budget ? colors.error : colors.brandPrimary} /> : null}
          {people.length > 0 && <Text style={{ marginTop: spacing.md, color: colors.muted, fontWeight: "600" }}>With: {people.map((p) => p.name).join(", ")}</Text>}
        </Card>

        <Card>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.onSurface }}>Packing list</Text>
            <Pressable testID="trip-add-pack" onPress={() => setPackSheet(true)}><Icon name="plus" size={20} color={colors.brandPrimary} /></Pressable>
          </View>
          {trip.packing.length === 0 ? <Text style={{ color: colors.muted, paddingVertical: 8 }}>Nothing added yet.</Text> : trip.packing.map((p) => (
            <Pressable key={p.id} testID={`pack-${p.id}`} onPress={() => st.togglePacking(trip.id, p.id)} style={s.pack}>
              <View style={[s.cb, { borderColor: p.packed ? colors.brandPrimary : colors.borderStrong, backgroundColor: p.packed ? colors.brandPrimary : "transparent" }]}>{p.packed && <Icon name="check" size={15} color={colors.onBrandPrimary} />}</View>
              <Text style={{ color: p.packed ? colors.muted : colors.onSurface, textDecorationLine: p.packed ? "line-through" : "none", fontWeight: "600" }}>{p.label}</Text>
            </Pressable>
          ))}
        </Card>

        <Card>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.onSurface }}>Expenses</Text>
            <Pressable testID="trip-add-exp" onPress={() => setExpSheet(true)}><Icon name="plus" size={20} color={colors.brandPrimary} /></Pressable>
          </View>
          {expenses.length === 0 ? <Text style={{ color: colors.muted, paddingVertical: 8 }}>No trip expenses yet.</Text> : expenses.map((t, i) => (
            <View key={t.id} style={[s.pack, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider }]}>
              <Icon name="wallet" size={18} color={colors.error} />
              <Text style={{ flex: 1, color: colors.onSurface, fontWeight: "600" }}>{t.note}</Text>
              <Text style={{ fontWeight: "800", color: colors.error }}>-{money(t.amount)}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>

      <Sheet visible={packSheet} onClose={() => setPackSheet(false)} title="Add packing items" testID="pack-sheet">
        <Input value={packLabel} onChangeText={setPackLabel} placeholder="e.g. Charger" autoFocus onSubmitEditing={addPack} returnKeyType="done" />
        <PrimaryButton label="Add item" icon="plus" onPress={addPack} testID="pack-submit" />
      </Sheet>

      <Sheet visible={expSheet} onClose={() => setExpSheet(false)} title="Add trip expense" testID="trip-exp-sheet">
        <Input label="Amount (₹)" value={expAmt} onChangeText={setExpAmt} placeholder="0" keyboardType="numeric" autoFocus />
        <Input label="Note" value={expNote} onChangeText={setExpNote} placeholder="e.g. Hotel" />
        <PrimaryButton label="Add expense" icon="check" onPress={addExp} testID="trip-exp-submit" />
      </Sheet>
    </Screen>
  );
}
