import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { Card, Header, Input, PrimaryButton, Screen, Sheet, StatCard } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { money, relative } from "@/src/lib/date";
import { useLifeStore } from "@/src/store/useLifeStore";
import { makeStyles, spacing, useTheme } from "@/src/theme";

const useS = makeStyles((c) => ({
  head: { alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 34, fontWeight: "800", color: c.onBrandPrimary },
  name: { fontSize: 24, fontWeight: "800", color: c.onSurface },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 11 },
  itemTitle: { fontSize: 15, fontWeight: "700", color: c.onSurface },
  itemSub: { fontSize: 13, color: c.muted },
}));

export default function PersonScreen() {
  const s = useS();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const st = useLifeStore();
  const person = st.people.find((p) => p.id === id);
  const [taskSheet, setTaskSheet] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");

  const data = useMemo(() => {
    if (!person) return null;
    const tasks = st.tasks.filter((t) => t.personId === person.id);
    const txns = st.transactions.filter((t) => t.personId === person.id);
    const events = st.events.filter((e) => e.personId === person.id);
    const trips = st.trips.filter((t) => t.peopleIds?.includes(person.id));
    const owed = txns.filter((t) => t.type === "debt_in" && !t.settled).reduce((a, b) => a + b.amount, 0);
    const owe = txns.filter((t) => t.type === "debt_out" && !t.settled).reduce((a, b) => a + b.amount, 0);
    return { tasks, txns, events, trips, owed, owe };
  }, [person, st.tasks, st.transactions, st.events, st.trips]);

  if (!person || !data) return <Screen><Header title="Person" back /><View style={{ padding: spacing.xl }}><Text style={{ color: colors.muted }}>Person not found.</Text></View></Screen>;

  const addTask = () => {
    if (!taskTitle.trim()) return;
    st.addTask({ title: taskTitle, personId: person.id, dueDate: dayjs().add(1, "day").toISOString() });
    setTaskTitle(""); setTaskSheet(false); toast("Task added");
  };

  return (
    <Screen>
      <Header title="Contact" back right={<Pressable testID="person-del" onPress={() => { st.removePerson(person.id); toast("Removed"); router.back(); }}><Icon name="trash" size={20} color={colors.muted} /></Pressable>} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 120 }}>
        <View style={s.head}>
          <View style={s.avatar}><Text style={s.avatarText}>{person.name.charAt(0).toUpperCase()}</Text></View>
          <Text style={s.name}>{person.name}</Text>
          {person.notes ? <Text style={s.itemSub}>{person.notes}</Text> : null}
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md }}>
          <StatCard icon="trending-up" label="Owes you" value={money(data.owed)} color={colors.success} />
          <StatCard icon="trending-down" label="You owe" value={money(data.owe)} color={colors.error} />
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg }}>
          <View style={{ flex: 1 }}><PrimaryButton label="Add task" icon="plus" onPress={() => setTaskSheet(true)} testID="person-add-task" /></View>
          <Pressable testID="person-add-money" onPress={() => router.push("/finance")} style={{ flex: 1, backgroundColor: colors.surfaceTertiary, borderRadius: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}>
            <Icon name="wallet" size={18} color={colors.onSurface} /><Text style={{ fontWeight: "800", color: colors.onSurface }}>Add money</Text>
          </Pressable>
        </View>

        {[
          { title: "Tasks", icon: "check", items: data.tasks.map((t) => ({ id: t.id, title: t.title, sub: t.done ? "Done" : t.dueDate ? relative(t.dueDate) : "Task" })) },
          { title: "Money", icon: "wallet", items: data.txns.map((t) => ({ id: t.id, title: `${t.type === "debt_in" ? "Owes you" : t.type === "debt_out" ? "You owe" : t.category} ${money(t.amount)}`, sub: t.settled ? "Settled" : (t.note || t.type) })) },
          { title: "Events", icon: "calendar", items: data.events.map((e) => ({ id: e.id, title: e.title, sub: dayjs(e.start).format("DD MMM, h:mm A") })) },
          { title: "Trips", icon: "plane", items: data.trips.map((t) => ({ id: t.id, title: t.destination, sub: t.budget ? money(t.budget) : "Trip" })) },
        ].filter((sec) => sec.items.length > 0).map((sec) => (
          <View key={sec.title} style={{ marginBottom: spacing.md }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.onSurface, marginBottom: spacing.sm }}>{sec.title}</Text>
            <Card>
              {sec.items.map((it, i) => (
                <View key={it.id} style={[s.row, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center" }}><Icon name={sec.icon as any} size={18} color={colors.brandPrimary} /></View>
                  <View style={{ flex: 1 }}><Text style={s.itemTitle}>{it.title}</Text><Text style={s.itemSub}>{it.sub}</Text></View>
                </View>
              ))}
            </Card>
          </View>
        ))}

        {data.tasks.length + data.txns.length + data.events.length + data.trips.length === 0 && (
          <Card><Text style={{ color: colors.muted, textAlign: "center", paddingVertical: spacing.md }}>Nothing linked yet. Use Command like “{person.name} se ₹500 lene hain”.</Text></Card>
        )}
      </ScrollView>

      <Sheet visible={taskSheet} onClose={() => setTaskSheet(false)} title={`Task for ${person.name}`} testID="person-task-sheet">
        <Input label="Task" value={taskTitle} onChangeText={setTaskTitle} placeholder="e.g. Call about trip" autoFocus />
        <PrimaryButton label="Add task" icon="plus" onPress={addTask} testID="person-task-submit" />
      </Sheet>
    </Screen>
  );
}
