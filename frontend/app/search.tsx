import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, IconName } from "@/src/components/Icon";
import { Card, Header, Screen } from "@/src/components/ui";
import { money, relative } from "@/src/lib/date";
import { useLifeStore } from "@/src/store/useLifeStore";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

interface Hit { id: string; title: string; sub: string; icon: IconName; route: string; }

const useS = makeStyles((c) => ({
  bar: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: c.surfaceSecondary, borderRadius: radius.pill, paddingHorizontal: spacing.lg, marginHorizontal: spacing.lg, borderWidth: 1, borderColor: c.border },
  input: { flex: 1, paddingVertical: 13, fontSize: 16, color: c.onSurface },
  group: { fontSize: 13, fontWeight: "800", color: c.muted, letterSpacing: 0.4, marginTop: spacing.lg, marginBottom: spacing.sm, marginHorizontal: spacing.lg },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 11 },
}));

export default function SearchScreen() {
  const s = useS();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const st = useLifeStore();
  const [q, setQ] = useState("");

  const groups = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const num = query.replace(/[₹,\s]/g, "");
    const match = (t: string) => t.toLowerCase().includes(query);
    const g: { title: string; hits: Hit[] }[] = [];

    const people = st.people.filter((p) => match(p.name)).map<Hit>((p) => ({ id: p.id, title: p.name, sub: "Person", icon: "user", route: `/person/${p.id}` }));
    if (people.length) g.push({ title: "PEOPLE", hits: people });

    const tasks = st.tasks.filter((t) => match(t.title) || (query === "pending" && !t.done)).map<Hit>((t) => ({ id: t.id, title: t.title, sub: t.done ? "Task · done" : "Task", icon: "check", route: "/planner" }));
    if (tasks.length) g.push({ title: "TASKS", hits: tasks });

    const txns = st.transactions.filter((t) => match(t.category) || match(t.note || "") || (num && String(t.amount).includes(num))).map<Hit>((t) => ({ id: t.id, title: `${t.category} ${money(t.amount)}`, sub: `${t.type} · ${relative(t.date)}`, icon: "wallet", route: "/finance" }));
    if (txns.length) g.push({ title: "MONEY", hits: txns });

    const trips = st.trips.filter((t) => match(t.destination)).map<Hit>((t) => ({ id: t.id, title: t.destination, sub: "Trip", icon: "plane", route: `/trip/${t.id}` }));
    if (trips.length) g.push({ title: "TRIPS", hits: trips });

    const goals = st.goals.filter((gg) => match(gg.title)).map<Hit>((gg) => ({ id: gg.id, title: gg.title, sub: "Goal", icon: "target", route: "/goals" }));
    if (goals.length) g.push({ title: "GOALS", hits: goals });

    const events = st.events.filter((e) => match(e.title)).map<Hit>((e) => ({ id: e.id, title: e.title, sub: `Event · ${relative(e.start)}`, icon: "calendar", route: "/planner" }));
    if (events.length) g.push({ title: "EVENTS", hits: events });

    const subs = st.subjects.filter((x) => match(x.name) || x.chapters.some((c) => match(c.title))).map<Hit>((x) => ({ id: x.id, title: x.name, sub: "Subject", icon: "book", route: "/study" }));
    if (subs.length) g.push({ title: "STUDY", hits: subs });

    return g;
  }, [q, st]);

  return (
    <Screen>
      <Header title="Search" back />
      <View style={s.bar}>
        <Icon name="search" size={20} color={colors.muted} />
        <TextInput testID="search-input" value={q} onChangeText={setQ} placeholder="Rahul, Jaipur, ₹500, exam, pending…" placeholderTextColor={colors.muted} style={s.input} autoFocus />
        {q.length > 0 && <Pressable onPress={() => setQ("")}><Icon name="close" size={20} color={colors.muted} /></Pressable>}
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {q.trim() && groups.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: spacing.xxl }}><Icon name="search" size={40} color={colors.muted} /><Text style={{ color: colors.muted, marginTop: spacing.md, fontWeight: "600" }}>No results for “{q}”</Text></View>
        )}
        {groups.map((grp) => (
          <View key={grp.title}>
            <Text style={s.group}>{grp.title}</Text>
            <View style={{ paddingHorizontal: spacing.lg }}>
              <Card>
                {grp.hits.map((h, i) => (
                  <Pressable key={h.id} testID={`search-hit-${h.id}`} onPress={() => router.push(h.route as any)} style={[s.row, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                    <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center" }}><Icon name={h.icon} size={18} color={colors.brandPrimary} /></View>
                    <View style={{ flex: 1 }}><Text style={{ fontSize: 15, fontWeight: "700", color: colors.onSurface }} numberOfLines={1}>{h.title}</Text><Text style={{ fontSize: 13, color: colors.muted }}>{h.sub}</Text></View>
                    <Icon name="chevron-right" size={18} color={colors.muted} />
                  </Pressable>
                ))}
              </Card>
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
