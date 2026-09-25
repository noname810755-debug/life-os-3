import dayjs from "dayjs";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { Card, Header, IconButton, Input, PrimaryButton, Screen, Sheet } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { useLifeStore } from "@/src/store/useLifeStore";
import { makeStyles, spacing, useTheme } from "@/src/theme";

const useS = makeStyles((c) => ({
  name: { fontSize: 16, fontWeight: "800", color: c.onSurface },
  streak: { fontSize: 13, color: c.muted, marginTop: 1 },
  dayCol: { alignItems: "center", gap: 4 },
  dayLabel: { fontSize: 10, color: c.muted, fontWeight: "700" },
  dayDot: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
}));

function computeStreak(history: string[]): number {
  let streak = 0;
  let d = dayjs();
  const set = new Set(history);
  if (!set.has(d.format("YYYY-MM-DD"))) d = d.subtract(1, "day");
  while (set.has(d.format("YYYY-MM-DD"))) { streak++; d = d.subtract(1, "day"); }
  return streak;
}

export default function HabitsScreen() {
  const s = useS();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const st = useLifeStore();
  const [add, setAdd] = useState(false);
  const [title, setTitle] = useState("");

  const submit = () => {
    if (!title.trim()) { toast("Enter a habit", "error"); return; }
    st.addHabit({ title, schedule: "daily" });
    setTitle(""); setAdd(false); toast("Habit added");
  };

  const last7 = Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, "day"));

  return (
    <Screen>
      <Header title="Habits" back right={<IconButton name="plus" testID="habits-add" bg={colors.brandPrimary} color={colors.onBrandPrimary} onPress={() => setAdd(true)} />} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 100, gap: spacing.md }}>
        {st.habits.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: spacing.xxl, gap: spacing.md }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }}><Icon name="repeat" size={32} color={colors.brandPrimary} /></View>
            <Text style={{ fontSize: 17, fontWeight: "800", color: colors.onSurface }}>No habits yet</Text>
            <PrimaryButton label="Add habit" icon="plus" onPress={() => setAdd(true)} testID="habits-empty-add" />
          </View>
        ) : st.habits.map((h) => {
          const doneToday = h.history.includes(dayjs().format("YYYY-MM-DD"));
          const streak = computeStreak(h.history);
          return (
            <Card key={h.id}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                <Pressable testID={`habit-toggle-${h.id}`} onPress={() => st.toggleHabitToday(h.id)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: doneToday ? colors.brandPrimary : colors.surfaceTertiary, alignItems: "center", justifyContent: "center" }}>
                  <Icon name={doneToday ? "check" : "flame"} size={22} color={doneToday ? colors.onBrandPrimary : colors.muted} />
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{h.title}</Text>
                  <Text style={s.streak}>🔥 {streak} day streak</Text>
                </View>
                <Pressable testID={`habit-del-${h.id}`} onPress={() => { st.removeHabit(h.id); toast("Deleted"); }} hitSlop={6}><Icon name="trash" size={18} color={colors.muted} /></Pressable>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md }}>
                {last7.map((d) => {
                  const done = h.history.includes(d.format("YYYY-MM-DD"));
                  return (
                    <View key={d.toString()} style={s.dayCol}>
                      <Text style={s.dayLabel}>{d.format("dd")[0]}</Text>
                      <View style={[s.dayDot, { backgroundColor: done ? colors.brandPrimary : colors.surfaceTertiary }]}>{done && <Icon name="check" size={14} color={colors.onBrandPrimary} />}</View>
                    </View>
                  );
                })}
              </View>
            </Card>
          );
        })}
      </ScrollView>

      <Sheet visible={add} onClose={() => setAdd(false)} title="New habit" testID="add-habit-sheet">
        <Input label="Habit" value={title} onChangeText={setTitle} placeholder="e.g. Drink 8 glasses water" autoFocus />
        <PrimaryButton label="Add habit" icon="plus" onPress={submit} testID="submit-habit" />
      </Sheet>
    </Screen>
  );
}
