import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CategoryBars } from "@/src/components/Charts";
import { Icon } from "@/src/components/Icon";
import { Badge, Card, Chip, Header, IconButton, Input, PrimaryButton, Screen, Sheet } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { money, relative } from "@/src/lib/date";
import { TxnType } from "@/src/store/types";
import { useLifeStore } from "@/src/store/useLifeStore";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const CATS = ["Food", "Transport", "Shopping", "Bills", "Health", "Entertainment", "Income", "Debt", "General"];
const TYPES: { key: TxnType; label: string }[] = [
  { key: "expense", label: "Expense" }, { key: "income", label: "Income" },
  { key: "debt_in", label: "To receive" }, { key: "debt_out", label: "I owe" },
];

const useS = makeStyles((c) => ({
  hero: { backgroundColor: c.surfaceInverse, borderRadius: radius.lg, padding: spacing.lg, marginHorizontal: spacing.lg },
  heroLabel: { color: c.onSurfaceInverse, opacity: 0.7, fontSize: 13, fontWeight: "700" },
  heroValue: { color: c.onSurfaceInverse, fontSize: 34, fontWeight: "800", marginTop: 4 },
  heroRow: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.lg },
  txn: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 12 },
  dot: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
}));

export default function FinanceScreen() {
  const s = useS();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const st = useLifeStore();
  const [add, setAdd] = useState(false);
  const [type, setType] = useState<TxnType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [personId, setPersonId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const month = st.transactions.filter((t) => dayjs(t.date).isSame(dayjs(), "month"));
    const income = month.filter((t) => t.type === "income").reduce((a, b) => a + b.amount, 0);
    const expense = month.filter((t) => t.type === "expense").reduce((a, b) => a + b.amount, 0);
    const byCat: Record<string, number> = {};
    month.filter((t) => t.type === "expense").forEach((t) => (byCat[t.category] = (byCat[t.category] || 0) + t.amount));
    const cats = Object.entries(byCat).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6);
    const debtsIn = st.transactions.filter((t) => t.type === "debt_in" && !t.settled);
    const debtsOut = st.transactions.filter((t) => t.type === "debt_out" && !t.settled);
    return { income, expense, net: income - expense, cats, debtsIn, debtsOut };
  }, [st.transactions]);

  const recent = useMemo(() => [...st.transactions].sort((a, b) => +dayjs(b.date) - +dayjs(a.date)).slice(0, 15), [st.transactions]);
  const nameOf = (id?: string) => st.people.find((p) => p.id === id)?.name;

  const submit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast("Enter a valid amount", "error"); return; }
    st.addTxn({ type, amount: amt, category: type === "income" ? "Income" : type.startsWith("debt") ? "Debt" : category, note, personId: personId || undefined });
    setAmount(""); setNote(""); setPersonId(null); setAdd(false);
    toast("Saved");
  };

  const txnMeta = (t: any) => {
    const inflow = t.type === "income" || t.type === "debt_in";
    return { color: inflow ? colors.success : colors.error, sign: inflow ? "+" : "-", icon: t.type.startsWith("debt") ? "user" : inflow ? "trending-up" : "wallet" };
  };

  return (
    <Screen>
      <Header title="Finance" back right={<IconButton name="plus" testID="finance-add" bg={colors.brandPrimary} color={colors.onBrandPrimary} onPress={() => setAdd(true)} />} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100, gap: spacing.md }}>
        <View style={s.hero}>
          <Text style={s.heroLabel}>This month · Net</Text>
          <Text style={[s.heroValue, { color: stats.net >= 0 ? "#37C07A" : "#FF7A7A" }]}>{money(stats.net)}</Text>
          <View style={s.heroRow}>
            <View><Text style={s.heroLabel}>Income</Text><Text style={{ color: colors.onSurfaceInverse, fontSize: 18, fontWeight: "800", marginTop: 2 }}>{money(stats.income)}</Text></View>
            <View><Text style={s.heroLabel}>Spent</Text><Text style={{ color: colors.onSurfaceInverse, fontSize: 18, fontWeight: "800", marginTop: 2 }}>{money(stats.expense)}</Text></View>
            <Pressable testID="finance-whatif" onPress={() => router.push("/whatif")} style={{ backgroundColor: colors.brandPrimary, borderRadius: radius.md, paddingHorizontal: spacing.md, justifyContent: "center" }}>
              <Text style={{ color: colors.onBrandPrimary, fontWeight: "800" }}>What-if</Text>
            </Pressable>
          </View>
        </View>

        {stats.cats.length > 0 && (
          <View style={{ paddingHorizontal: spacing.lg }}>
            <Card><Text style={{ fontSize: 16, fontWeight: "800", color: colors.onSurface, marginBottom: spacing.md }}>Spending by category</Text><CategoryBars data={stats.cats} /></Card>
          </View>
        )}

        {(stats.debtsIn.length > 0 || stats.debtsOut.length > 0) && (
          <View style={{ paddingHorizontal: spacing.lg }}>
            <Card>
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.onSurface, marginBottom: spacing.sm }}>Debts & dues</Text>
              {[...stats.debtsIn, ...stats.debtsOut].map((t, i) => (
                <View key={t.id} style={[s.txn, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                  <View style={[s.dot, { backgroundColor: colors.surfaceTertiary }]}><Icon name="user" size={20} color={t.type === "debt_in" ? colors.success : colors.error} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: colors.onSurface }}>{t.type === "debt_in" ? `${nameOf(t.personId) || "Someone"} owes you` : `You owe ${nameOf(t.personId) || "someone"}`}</Text>
                    <Text style={{ fontSize: 13, color: colors.muted }}>{t.note || "Debt"}</Text>
                  </View>
                  <Text style={{ fontWeight: "800", color: t.type === "debt_in" ? colors.success : colors.error }}>{money(t.amount)}</Text>
                  <Pressable testID={`settle-${t.id}`} onPress={() => { st.settleTxn(t.id); toast("Marked settled"); }} style={{ marginLeft: 8 }}><Icon name="check-circle" size={22} color={colors.muted} /></Pressable>
                </View>
              ))}
            </Card>
          </View>
        )}

        <View style={{ paddingHorizontal: spacing.lg }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.onSurface, marginBottom: spacing.sm }}>Recent</Text>
          {recent.length === 0 ? (
            <Card><Text style={{ color: colors.muted, paddingVertical: spacing.md }}>No transactions yet. Tap + to add income or an expense.</Text></Card>
          ) : (
            <Card>
              {recent.map((t, i) => {
                const m = txnMeta(t);
                return (
                  <View key={t.id} style={[s.txn, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                    <View style={[s.dot, { backgroundColor: colors.surfaceTertiary }]}><Icon name={m.icon as any} size={20} color={m.color} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: colors.onSurface }}>{t.note || t.category}</Text>
                      <Text style={{ fontSize: 13, color: colors.muted }}>{t.category} · {relative(t.date)}{nameOf(t.personId) ? ` · ${nameOf(t.personId)}` : ""}</Text>
                    </View>
                    <Text style={{ fontWeight: "800", color: m.color }}>{m.sign}{money(t.amount)}</Text>
                    <Pressable testID={`txn-del-${t.id}`} onPress={() => { st.removeTxn(t.id); toast("Deleted"); }} hitSlop={6} style={{ marginLeft: 8 }}><Icon name="trash" size={16} color={colors.muted} /></Pressable>
                  </View>
                );
              })}
            </Card>
          )}
        </View>
      </ScrollView>

      <Sheet visible={add} onClose={() => setAdd(false)} title="Add transaction" testID="add-txn-sheet">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md }}>
          {TYPES.map((t) => <Chip key={t.key} testID={`ttype-${t.key}`} label={t.label} active={type === t.key} onPress={() => setType(t.key)} />)}
        </View>
        <Input label="Amount (₹)" value={amount} onChangeText={setAmount} placeholder="0" keyboardType="numeric" autoFocus />
        {type === "expense" && (
          <>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.onSurfaceTertiary, marginBottom: spacing.xs }}>Category</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md }}>{CATS.filter((c) => c !== "Income" && c !== "Debt").map((c) => <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />)}</View>
          </>
        )}
        {type.startsWith("debt") && st.people.length > 0 && (
          <>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.onSurfaceTertiary, marginBottom: spacing.xs }}>Person</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md }}>{st.people.map((p) => <Chip key={p.id} label={p.name} active={personId === p.id} onPress={() => setPersonId(p.id)} />)}</View>
          </>
        )}
        <Input label="Note (optional)" value={note} onChangeText={setNote} placeholder="What was it for?" />
        <PrimaryButton label="Save" icon="check" onPress={submit} testID="submit-txn" />
      </Sheet>
    </Screen>
  );
}
