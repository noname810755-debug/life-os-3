import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import dayjs from "dayjs";

import { Icon } from "@/src/components/Icon";
import { Card, Chip, Header, Input, PrimaryButton, Screen } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { money } from "@/src/lib/date";
import { useLifeStore } from "@/src/store/useLifeStore";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useS = makeStyles((c) => ({
  flow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
  step: { flex: 1 },
  stepLabel: { fontSize: 12, fontWeight: "800", color: c.muted, letterSpacing: 0.4 },
  stepValue: { fontSize: 16, fontWeight: "800", color: c.onSurface, marginTop: 4 },
}));

export default function WhatIfScreen() {
  const s = useS();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const st = useLifeStore();
  const [amount, setAmount] = useState("");
  const [goalId, setGoalId] = useState<string | null>(st.goals.find((g) => g.type === "save")?.id || null);

  const capacity = useMemo(() => {
    const month = st.transactions.filter((t) => dayjs(t.date).isSame(dayjs(), "month"));
    const inc = month.filter((t) => t.type === "income").reduce((a, b) => a + b.amount, 0);
    const exp = month.filter((t) => t.type === "expense").reduce((a, b) => a + b.amount, 0);
    return Math.max(1000, inc - exp);
  }, [st.transactions]);

  const goal = st.goals.find((g) => g.id === goalId);
  const amt = parseFloat(amount) || 0;
  const saveGoals = st.goals.filter((g) => g.type === "save");

  const sim = useMemo(() => {
    if (!goal || !goal.targetAmount) return null;
    const remaining = Math.max(0, goal.targetAmount - (goal.savedAmount || 0));
    const monthsNow = Math.ceil(remaining / capacity);
    const delay = Math.ceil(amt / capacity);
    const monthsAfter = monthsNow + delay;
    return { monthsNow, monthsAfter, delay, remaining };
  }, [goal, capacity, amt]);

  const apply = () => {
    if (amt <= 0) { toast("Enter an amount first", "error"); return; }
    st.addTxn({ type: "expense", amount: amt, category: "Shopping", note: "Planned purchase (what-if)" });
    toast(`Applied: ${money(amt)} expense added`);
    setAmount("");
  };

  return (
    <Screen>
      <Header title="What-if" back subtitle="Simulate without touching real data" />
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 100, gap: spacing.md }}>
        <Card>
          <Text style={{ fontSize: 16, fontWeight: "800", color: colors.onSurface, marginBottom: spacing.sm }}>What if I spend…</Text>
          <Input value={amount} onChangeText={setAmount} placeholder="e.g. 28000" keyboardType="numeric" label="Amount (₹)" />
          {saveGoals.length > 0 && (
            <>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.onSurfaceTertiary, marginBottom: spacing.xs }}>Impact on goal</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>{saveGoals.map((g) => <Chip key={g.id} label={g.title} active={goalId === g.id} onPress={() => setGoalId(g.id)} />)}</View>
            </>
          )}
        </Card>

        {amt > 0 && (
          <Card>
            <View style={s.flow}>
              <View style={s.step}><Text style={s.stepLabel}>CURRENT</Text><Text style={s.stepValue}>{money(capacity)}/mo saving</Text></View>
              <Icon name="arrow-right" size={20} color={colors.muted} />
              <View style={s.step}><Text style={s.stepLabel}>SCENARIO</Text><Text style={s.stepValue}>-{money(amt)} now</Text></View>
            </View>
            <View style={{ height: 1, backgroundColor: colors.divider }} />
            {sim ? (
              <>
                <View style={{ paddingVertical: spacing.md, gap: 8 }}>
                  <Text style={{ color: colors.onSurfaceSecondary, fontSize: 15 }}>📌 Reach <Text style={{ fontWeight: "800" }}>{goal!.title}</Text> in ~{sim.monthsNow} months now.</Text>
                  <Text style={{ color: colors.error, fontSize: 15, fontWeight: "700" }}>⚠️ This purchase delays it by ~{sim.delay} months → ~{sim.monthsAfter} months total.</Text>
                  <Text style={{ color: colors.success, fontSize: 15, fontWeight: "700" }}>💡 Alternative: save for {sim.delay} months first, then buy without delaying your goal.</Text>
                </View>
              </>
            ) : (
              <View style={{ paddingVertical: spacing.md }}>
                <Text style={{ color: colors.onSurfaceSecondary, fontSize: 15 }}>This would use ~{Math.ceil((amt / capacity) * 10) / 10} months of your saving capacity.</Text>
                <Text style={{ color: colors.muted, marginTop: 6 }}>Tip: create a savings goal to see the exact impact on your timeline.</Text>
              </View>
            )}
            <View style={{ height: 1, backgroundColor: colors.divider, marginBottom: spacing.md }} />
            <PrimaryButton label="Apply this decision" icon="check" onPress={apply} testID="whatif-apply" />
            <Text style={{ textAlign: "center", color: colors.muted, fontSize: 12, marginTop: spacing.sm }}>Nothing changes until you tap Apply.</Text>
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}
