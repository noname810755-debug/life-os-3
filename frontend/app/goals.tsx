import dayjs from "dayjs";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { Badge, Card, Chip, Header, IconButton, Input, PrimaryButton, ProgressBar, Screen, Sheet } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { money, relative } from "@/src/lib/date";
import { useLifeStore } from "@/src/store/useLifeStore";
import { makeStyles, spacing, useTheme } from "@/src/theme";

const useS = makeStyles((c) => ({
  title: { fontSize: 16, fontWeight: "800", color: c.onSurface },
  ms: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 8 },
}));

export default function GoalsScreen() {
  const s = useS();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const st = useLifeStore();
  const [add, setAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"save" | "general">("save");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState<string | null>(dayjs().add(1, "month").toISOString());
  const [contribId, setContribId] = useState<string | null>(null);
  const [contribAmt, setContribAmt] = useState("");

  const submit = () => {
    if (!title.trim()) { toast("Enter a goal", "error"); return; }
    st.addGoal({ title, type, targetAmount: type === "save" ? parseFloat(target) || undefined : undefined, deadline: deadline || undefined });
    setTitle(""); setTarget(""); setAdd(false); toast("Goal created");
  };

  const contribute = () => {
    const amt = parseFloat(contribAmt);
    if (contribId && amt > 0) { st.addToGoal(contribId, amt); toast(`Added ${money(amt)}`); }
    setContribId(null); setContribAmt("");
  };

  const dl = [
    { label: "1 month", v: dayjs().add(1, "month").toISOString() }, { label: "3 months", v: dayjs().add(3, "month").toISOString() },
    { label: "6 months", v: dayjs().add(6, "month").toISOString() }, { label: "No date", v: null },
  ];

  return (
    <Screen>
      <Header title="Goals" back right={<IconButton name="plus" testID="goals-add" bg={colors.brandPrimary} color={colors.onBrandPrimary} onPress={() => setAdd(true)} />} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 100, gap: spacing.md }}>
        {st.goals.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: spacing.xxl, gap: spacing.md }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }}><Icon name="target" size={32} color={colors.brandPrimary} /></View>
            <Text style={{ fontSize: 17, fontWeight: "800", color: colors.onSurface }}>No goals yet</Text>
            <PrimaryButton label="Set a goal" icon="plus" onPress={() => setAdd(true)} testID="goals-empty-add" />
          </View>
        ) : st.goals.map((g) => {
          const prog = g.type === "save" ? (g.savedAmount || 0) / (g.targetAmount || 1) : g.milestones.length ? g.milestones.filter((m) => m.done).length / g.milestones.length : 0;
          const late = g.deadline && dayjs(g.deadline).isBefore(dayjs()) && prog < 1;
          return (
            <Card key={g.id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.sm }}>
                <Text style={[s.title, { flex: 1 }]}>{g.title}</Text>
                <Pressable testID={`goal-del-${g.id}`} onPress={() => { st.removeGoal(g.id); toast("Deleted"); }} hitSlop={6}><Icon name="trash" size={18} color={colors.muted} /></Pressable>
              </View>
              <ProgressBar value={prog} color={late ? colors.error : colors.brandPrimary} />
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm, alignItems: "center" }}>
                {g.type === "save" ? <Text style={{ color: colors.muted, fontWeight: "700" }}>{money(g.savedAmount)} / {money(g.targetAmount)}</Text> : <Text style={{ color: colors.muted, fontWeight: "700" }}>{Math.round(prog * 100)}%</Text>}
                {g.deadline && <Badge label={late ? "Behind" : relative(g.deadline)} tone={late ? "error" : "brand"} />}
              </View>
              {g.type === "save" && (
                <Pressable testID={`goal-add-${g.id}`} onPress={() => setContribId(g.id)} style={{ marginTop: spacing.md, backgroundColor: colors.brandTertiary, borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Icon name="plus" size={16} color={colors.onBrandTertiary} /><Text style={{ color: colors.onBrandTertiary, fontWeight: "800" }}>Add savings</Text>
                </Pressable>
              )}
              {g.milestones.map((m) => (
                <Pressable key={m.id} onPress={() => st.toggleMilestone(g.id, m.id)} style={s.ms}>
                  <Icon name={m.done ? "check-circle" : "circle"} size={20} color={m.done ? colors.brandPrimary : colors.muted} />
                  <Text style={{ color: m.done ? colors.muted : colors.onSurface, textDecorationLine: m.done ? "line-through" : "none" }}>{m.title}</Text>
                </Pressable>
              ))}
            </Card>
          );
        })}
      </ScrollView>

      <Sheet visible={add} onClose={() => setAdd(false)} title="New goal" testID="add-goal-sheet">
        <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md }}>
          <Chip label="Savings goal" active={type === "save"} onPress={() => setType("save")} testID="goal-type-save" />
          <Chip label="General goal" active={type === "general"} onPress={() => setType("general")} testID="goal-type-general" />
        </View>
        <Input label="Goal" value={title} onChangeText={setTitle} placeholder={type === "save" ? "e.g. Save for phone" : "e.g. Read 5 books"} autoFocus />
        {type === "save" && <Input label="Target amount (₹)" value={target} onChangeText={setTarget} placeholder="50000" keyboardType="numeric" />}
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.onSurfaceTertiary, marginBottom: spacing.xs }}>Deadline</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md }}>{dl.map((d) => <Chip key={d.label} label={d.label} active={deadline === d.v} onPress={() => setDeadline(d.v)} />)}</View>
        <PrimaryButton label="Create goal" icon="target" onPress={submit} testID="submit-goal" />
      </Sheet>

      <Sheet visible={!!contribId} onClose={() => setContribId(null)} title="Add savings" testID="contrib-sheet">
        <Input label="Amount (₹)" value={contribAmt} onChangeText={setContribAmt} placeholder="0" keyboardType="numeric" autoFocus />
        <PrimaryButton label="Add" icon="plus" onPress={contribute} testID="contrib-submit" />
      </Sheet>
    </Screen>
  );
}
