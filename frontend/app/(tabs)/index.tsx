import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Icon, IconName } from "@/src/components/Icon";
import { Badge, Card, IconButton, ProgressBar, SectionHeader } from "@/src/components/ui";
import { Screen } from "@/src/components/ui";
import { fmtTime, isToday, money, relative } from "@/src/lib/date";
import { useLifeStore } from "@/src/store/useLifeStore";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const useS = makeStyles((c) => ({
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  hi: { fontSize: 15, color: c.muted, fontWeight: "600" },
  name: { fontSize: 28, fontWeight: "800", color: c.onSurface, letterSpacing: -0.6 },
  topActions: { flexDirection: "row", gap: spacing.sm },
  briefing: { backgroundColor: c.brandPrimary, borderRadius: radius.lg, padding: spacing.lg, marginHorizontal: spacing.lg, gap: spacing.sm },
  briefingLabel: { flexDirection: "row", alignItems: "center", gap: 6 },
  briefingLabelText: { color: c.onBrandPrimary, opacity: 0.9, fontSize: 13, fontWeight: "800", letterSpacing: 0.4 },
  briefingText: { color: c.onBrandPrimary, fontSize: 17, fontWeight: "700", lineHeight: 24 },
  quickRow: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg },
  quick: { flex: 1, backgroundColor: c.surfaceSecondary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: "center", gap: 6, borderWidth: 1, borderColor: c.border },
  quickText: { fontSize: 11, fontWeight: "700", color: c.onSurfaceTertiary },
  rowItem: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 10 },
  dot: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  itemTitle: { fontSize: 15, fontWeight: "700", color: c.onSurface },
  itemSub: { fontSize: 13, color: c.muted, marginTop: 1 },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  statRow: { flexDirection: "row", gap: spacing.sm },
  alertRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 10 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: c.surfaceSecondary, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: 12, marginHorizontal: spacing.lg, borderWidth: 1, borderColor: c.border },
  searchText: { color: c.muted, fontSize: 15, fontWeight: "600" },
}));

export default function HomeScreen() {
  const s = useS();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const store = useLifeStore();

  const today = useMemo(() => {
    const events = store.events.filter((e) => isToday(e.start)).sort((a, b) => +dayjs(a.start) - +dayjs(b.start));
    const tasksToday = store.tasks.filter((t) => !t.done && t.dueDate && isToday(t.dueDate));
    const overdue = store.tasks.filter((t) => !t.done && t.dueDate && dayjs(t.dueDate).isBefore(dayjs().startOf("day")));
    const monthExpense = store.transactions.filter((t) => t.type === "expense" && dayjs(t.date).isSame(dayjs(), "month")).reduce((a, b) => a + b.amount, 0);
    const owed = store.transactions.filter((t) => t.type === "debt_in" && !t.settled).reduce((a, b) => a + b.amount, 0);
    const upcomingBills = store.events.filter((e) => e.kind === "bill" && dayjs(e.start).isAfter(dayjs()) && dayjs(e.start).isBefore(dayjs().add(7, "day")));
    const topGoal = store.goals[0];
    const habitsToday = store.habits;
    return { events, tasksToday, overdue, monthExpense, owed, upcomingBills, topGoal, habitsToday };
  }, [store.events, store.tasks, store.transactions, store.goals, store.habits]);

  const briefing = useMemo(() => {
    const parts: string[] = [];
    const hr = dayjs().hour();
    const greet = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
    const n = today.tasksToday.length + today.events.length;
    if (n === 0 && today.overdue.length === 0) return `${greet}! Aaj ka schedule clear hai. Kuch plan karna hai? Bas Command pe bolo.`;
    if (today.events.length) parts.push(`${today.events.length} event${today.events.length > 1 ? "s" : ""}`);
    if (today.tasksToday.length) parts.push(`${today.tasksToday.length} task${today.tasksToday.length > 1 ? "s" : ""}`);
    if (today.overdue.length) parts.push(`${today.overdue.length} overdue`);
    let msg = `${greet}! Aaj ${parts.join(", ")} hain.`;
    if (today.monthExpense) msg += ` Is month ab tak ${money(today.monthExpense)} kharch hue.`;
    return msg;
  }, [today]);

  const isEmpty = store.tasks.length + store.events.length + store.transactions.length + store.people.length + store.goals.length === 0;

  const quickActions: { icon: IconName; label: string; route: string }[] = [
    { icon: "command", label: "Command", route: "/command" },
    { icon: "wallet", label: "Money", route: "/finance" },
    { icon: "check", label: "Planner", route: "/planner" },
    { icon: "graph", label: "Life", route: "/life" },
  ];

  const alerts = useMemo(() => {
    const list: { icon: IconName; text: string; tone: any; route: string }[] = [];
    today.overdue.forEach((t) => list.push({ icon: "alert", text: `Overdue: ${t.title}`, tone: "error", route: "/planner" }));
    today.upcomingBills.forEach((b) => list.push({ icon: "clock", text: `Bill due ${relative(b.start)}: ${b.title}`, tone: "warning", route: "/finance" }));
    store.goals.filter((g) => g.deadline && dayjs(g.deadline).isBefore(dayjs())).forEach((g) => list.push({ icon: "target", text: `Goal behind: ${g.title}`, tone: "warning", route: "/goals" }));
    return list.slice(0, 4);
  }, [today, store.goals]);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl, gap: spacing.md }}>
        <View style={s.topRow}>
          <View>
            <Text style={s.hi}>{dayjs().format("dddd, DD MMM")}</Text>
            <Text style={s.name}>Hi, {store.settings.name} 👋</Text>
          </View>
          <View style={s.topActions}>
            <IconButton name="inbox" testID="home-inbox" onPress={() => router.push("/inbox")} />
            <IconButton name="bell" testID="home-alerts" onPress={() => router.push("/planner")} />
          </View>
        </View>

        <Pressable style={s.searchBar} testID="home-search" onPress={() => router.push("/search")}>
          <Icon name="search" size={20} color={colors.muted} />
          <Text style={s.searchText}>Search your whole life…</Text>
        </Pressable>

        <Pressable style={s.briefing} testID="home-briefing" onPress={() => router.push("/command")}>
          <View style={s.briefingLabel}>
            <Icon name="sparkles" size={16} color={colors.onBrandPrimary} />
            <Text style={s.briefingLabelText}>AI DAILY BRIEFING</Text>
          </View>
          <Text style={s.briefingText}>{briefing}</Text>
        </Pressable>

        <View style={s.quickRow}>
          {quickActions.map((q) => (
            <Pressable key={q.label} style={s.quick} testID={`quick-${q.label}`} onPress={() => router.push(q.route as any)}>
              <Icon name={q.icon} size={22} color={colors.brandPrimary} />
              <Text style={s.quickText}>{q.label}</Text>
            </Pressable>
          ))}
        </View>

        {isEmpty && (
          <View style={s.section}>
            <Card>
              <Text style={{ fontSize: 17, fontWeight: "800", color: colors.onSurface, marginBottom: 6 }}>{"Your Life OS is empty — let's fill it"}</Text>
              <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 20, marginBottom: spacing.md }}>
                Tap the orange Command button and just type naturally — Hindi, English ya Hinglish. Example: “Kal 7 baje gym aur Rahul se ₹2,000 lene hain”.
              </Text>
              <Pressable testID="home-try-command" onPress={() => router.push("/command")} style={{ backgroundColor: colors.brandTertiary, borderRadius: radius.md, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Icon name="command" size={20} color={colors.onBrandTertiary} />
                <Text style={{ color: colors.onBrandTertiary, fontWeight: "800", fontSize: 15 }}>Open Command</Text>
              </Pressable>
            </Card>
          </View>
        )}

        {alerts.length > 0 && (
          <View style={s.section}>
            <SectionHeader title="Alerts" />
            <Card>
              {alerts.map((a, i) => (
                <Pressable key={i} testID={`alert-${i}`} onPress={() => router.push(a.route as any)} style={[s.alertRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                  <View style={[s.dot, { backgroundColor: colors.surfaceTertiary }]}><Icon name={a.icon} size={20} color={a.tone === "error" ? colors.error : colors.warning} /></View>
                  <Text style={[s.itemTitle, { flex: 1 }]} numberOfLines={1}>{a.text}</Text>
                  <Icon name="chevron-right" size={18} color={colors.muted} />
                </Pressable>
              ))}
            </Card>
          </View>
        )}

        <View style={s.section}>
          <SectionHeader title="Today's schedule" actionLabel="Planner" onAction={() => router.push("/planner")} />
          <Card>
            {today.events.length === 0 && today.tasksToday.length === 0 ? (
              <Text style={{ color: colors.muted, fontSize: 14, paddingVertical: spacing.sm }}>Nothing scheduled today. A clear day! ✨</Text>
            ) : (
              <>
                {today.events.map((e, i) => (
                  <View key={e.id} style={[s.rowItem, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                    <View style={[s.dot, { backgroundColor: colors.brandTertiary }]}><Icon name={e.kind === "workout" ? "activity" : "calendar"} size={20} color={colors.brandPrimary} /></View>
                    <View style={{ flex: 1 }}><Text style={s.itemTitle}>{e.title}</Text><Text style={s.itemSub}>{fmtTime(e.start)}</Text></View>
                  </View>
                ))}
                {today.tasksToday.map((t, i) => (
                  <Pressable key={t.id} testID={`home-task-${t.id}`} onPress={() => store.toggleTask(t.id)} style={[s.rowItem, (i > 0 || today.events.length) && { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                    <View style={[s.dot, { backgroundColor: colors.surfaceTertiary }]}><Icon name="circle" size={20} color={colors.muted} /></View>
                    <View style={{ flex: 1 }}><Text style={s.itemTitle}>{t.title}</Text><Text style={s.itemSub}>Task due today</Text></View>
                  </Pressable>
                ))}
              </>
            )}
          </Card>
        </View>

        <View style={s.section}>
          <SectionHeader title="Money this month" actionLabel="Finance" onAction={() => router.push("/finance")} />
          <View style={s.statRow}>
            <Card style={{ flex: 1 }}>
              <Icon name="trending-down" size={20} color={colors.error} />
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.onSurface, marginTop: 6 }}>{money(today.monthExpense)}</Text>
              <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "600" }}>Spent</Text>
            </Card>
            <Card style={{ flex: 1 }}>
              <Icon name="trending-up" size={20} color={colors.success} />
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.onSurface, marginTop: 6 }}>{money(today.owed)}</Text>
              <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "600" }}>To receive</Text>
            </Card>
          </View>
        </View>

        {today.topGoal && (
          <View style={s.section}>
            <SectionHeader title="Top goal" actionLabel="All goals" onAction={() => router.push("/goals")} />
            <Card onPress={() => router.push("/goals")} testID="home-top-goal">
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm }}>
                <Text style={s.itemTitle}>{today.topGoal.title}</Text>
                {today.topGoal.type === "save" && <Badge label={`${money(today.topGoal.savedAmount)} / ${money(today.topGoal.targetAmount)}`} />}
              </View>
              <ProgressBar value={today.topGoal.type === "save" ? (today.topGoal.savedAmount || 0) / (today.topGoal.targetAmount || 1) : today.topGoal.milestones.length ? today.topGoal.milestones.filter((m) => m.done).length / today.topGoal.milestones.length : 0} />
            </Card>
          </View>
        )}

        {today.habitsToday.length > 0 && (
          <View style={s.section}>
            <SectionHeader title="Habits today" actionLabel="All" onAction={() => router.push("/habits")} />
            <Card>
              {today.habitsToday.slice(0, 4).map((h, i) => {
                const done = h.history.includes(dayjs().format("YYYY-MM-DD"));
                return (
                  <Pressable key={h.id} testID={`home-habit-${h.id}`} onPress={() => store.toggleHabitToday(h.id)} style={[s.rowItem, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                    <View style={[s.dot, { backgroundColor: done ? colors.brandPrimary : colors.surfaceTertiary }]}>
                      <Icon name={done ? "check" : "circle"} size={20} color={done ? colors.onBrandPrimary : colors.muted} />
                    </View>
                    <Text style={[s.itemTitle, { flex: 1 }]}>{h.title}</Text>
                    <Icon name="flame" size={18} color={done ? colors.brandPrimary : colors.muted} />
                  </Pressable>
                );
              })}
            </Card>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
