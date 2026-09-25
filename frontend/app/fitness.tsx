import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BarChart } from "@/src/components/Charts";
import { Icon } from "@/src/components/Icon";
import { Card, Header, IconButton, Input, PrimaryButton, Screen, Sheet, StatCard } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { relative } from "@/src/lib/date";
import { ymd } from "@/src/lib/date";
import { useLifeStore } from "@/src/store/useLifeStore";
import { makeStyles, spacing, useTheme } from "@/src/theme";

const useS = makeStyles((c) => ({
  drop: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", margin: 3 },
}));

export default function FitnessScreen() {
  const s = useS();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const st = useLifeStore();
  const [add, setAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState("");
  const [type, setType] = useState("Strength");

  const waterCount = st.settings.waterToday.date === ymd() ? st.settings.waterToday.count : 0;

  const week = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, "day"));
    return days.map((d) => ({ label: d.format("dd")[0], value: st.workouts.filter((w) => dayjs(w.date).isSame(d, "day")).reduce((a, b) => a + (b.minutes || 30), 0) }));
  }, [st.workouts]);
  const weekCount = st.workouts.filter((w) => dayjs(w.date).isAfter(dayjs().subtract(7, "day"))).length;

  const submit = () => {
    if (!title.trim()) { toast("Enter workout", "error"); return; }
    st.addWorkout({ title, minutes: parseFloat(minutes) || undefined, type });
    setTitle(""); setMinutes(""); setAdd(false); toast("Workout logged");
  };

  return (
    <Screen>
      <Header title="Fitness" back right={<IconButton name="plus" testID="fitness-add" bg={colors.brandPrimary} color={colors.onBrandPrimary} onPress={() => setAdd(true)} />} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 100, gap: spacing.md }}>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <StatCard icon="activity" label="Workouts / 7d" value={String(weekCount)} />
          <StatCard icon="water" label="Water today" value={`${waterCount}/${st.settings.waterGoal}`} color={colors.info} />
        </View>

        <Card>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.onSurface }}>Water tracker</Text>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Pressable testID="water-minus" onPress={() => st.addWater(-1)} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center" }}><Icon name="minus" size={18} color={colors.onSurface} /></Pressable>
              <Pressable testID="water-plus" onPress={() => st.addWater(1)} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" }}><Icon name="plus" size={18} color={colors.onBrandPrimary} /></Pressable>
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {Array.from({ length: st.settings.waterGoal }, (_, i) => (
              <View key={i} style={[s.drop, { backgroundColor: i < waterCount ? colors.info + "33" : colors.surfaceTertiary }]}><Icon name="water" size={18} color={i < waterCount ? colors.info : colors.muted} /></View>
            ))}
          </View>
        </Card>

        <Card>
          <Text style={{ fontSize: 16, fontWeight: "800", color: colors.onSurface, marginBottom: spacing.md }}>This week (minutes)</Text>
          <BarChart data={week} height={100} />
        </Card>

        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.onSurface }}>History</Text>
        {st.workouts.length === 0 ? (
          <Card><Text style={{ color: colors.muted, paddingVertical: spacing.md }}>No workouts logged yet. Tap + to log one.</Text></Card>
        ) : (
          <Card>
            {st.workouts.map((w, i) => (
              <View key={w.id} style={[{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 12 }, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center" }}><Icon name="activity" size={20} color={colors.success} /></View>
                <View style={{ flex: 1 }}><Text style={{ fontSize: 15, fontWeight: "700", color: colors.onSurface }}>{w.title}</Text><Text style={{ fontSize: 13, color: colors.muted }}>{w.type} · {w.minutes || 0} min · {relative(w.date)}</Text></View>
                <Pressable testID={`wk-del-${w.id}`} onPress={() => { st.removeWorkout(w.id); toast("Deleted"); }} hitSlop={6}><Icon name="trash" size={16} color={colors.muted} /></Pressable>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      <Sheet visible={add} onClose={() => setAdd(false)} title="Log workout" testID="add-workout-sheet">
        <Input label="Workout" value={title} onChangeText={setTitle} placeholder="e.g. Chest & Triceps" autoFocus />
        <Input label="Minutes" value={minutes} onChangeText={setMinutes} placeholder="45" keyboardType="numeric" />
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.onSurfaceTertiary, marginBottom: spacing.xs }}>Type</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md }}>{["Strength", "Cardio", "Yoga", "Sports", "Other"].map((t) => <Pressable key={t} onPress={() => setType(t)} style={{ paddingHorizontal: 16, height: 36, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: type === t ? colors.brandPrimary : colors.surfaceTertiary }}><Text style={{ fontWeight: "700", color: type === t ? colors.onBrandPrimary : colors.onSurfaceTertiary }}>{t}</Text></Pressable>)}</View>
        <PrimaryButton label="Log workout" icon="activity" onPress={submit} testID="submit-workout" />
      </Sheet>
    </Screen>
  );
}
