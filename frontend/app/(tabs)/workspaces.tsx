import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, IconName } from "@/src/components/Icon";
import { Card, Header, Screen } from "@/src/components/ui";
import { useLifeStore } from "@/src/store/useLifeStore";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useS = makeStyles((c) => ({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, paddingHorizontal: spacing.lg },
  tile: { width: "47%", padding: spacing.lg, gap: spacing.md },
  iconWrap: { width: 46, height: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "800", color: c.onSurface },
  count: { fontSize: 13, color: c.muted, fontWeight: "600", marginTop: 1 },
}));

export default function WorkspacesScreen() {
  const s = useS();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const st = useLifeStore();

  const items: { label: string; icon: IconName; route: string; count: string; color: string }[] = [
    { label: "Planner", icon: "check", route: "/planner", count: `${st.tasks.filter((t) => !t.done).length} open`, color: colors.brandPrimary },
    { label: "Finance", icon: "wallet", route: "/finance", count: `${st.transactions.length} entries`, color: "#1E9E5A" },
    { label: "People", icon: "users", route: "/people", count: `${st.people.length} people`, color: "#2B6BE4" },
    { label: "Goals", icon: "target", route: "/goals", count: `${st.goals.length} goals`, color: "#FF5E00" },
    { label: "Habits", icon: "repeat", route: "/habits", count: `${st.habits.length} habits`, color: "#0EA5A5" },
    { label: "Travel", icon: "plane", route: "/trips", count: `${st.trips.length} trips`, color: "#E23B7B" },
    { label: "Study", icon: "book", route: "/study", count: `${st.subjects.length} subjects`, color: "#6366F1" },
    { label: "Fitness", icon: "activity", route: "/fitness", count: `${st.workouts.length} workouts`, color: "#16A34A" },
    { label: "What-if", icon: "sparkles", route: "/whatif", count: "Simulate", color: "#8B5CF6" },
    { label: "Inbox", icon: "inbox", route: "/inbox", count: `${st.inbox.filter((i) => !i.processed).length} to sort`, color: "#E08A00" },
  ];

  return (
    <Screen>
      <Header title="Workspaces" subtitle="Your life, organised" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: spacing.sm }}>
        <View style={s.grid}>
          {items.map((it) => (
            <Card key={it.label} testID={`ws-${it.label}`} onPress={() => router.push(it.route as any)} style={s.tile}>
              <View style={[s.iconWrap, { backgroundColor: it.color + "22" }]}><Icon name={it.icon} size={24} color={it.color} /></View>
              <View>
                <Text style={s.title}>{it.label}</Text>
                <Text style={s.count}>{it.count}</Text>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
