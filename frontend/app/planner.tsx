import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { Card, Chip, ChipRow, Header, IconButton, Input, PrimaryButton, Screen, Sheet } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { fmtDateTime, relative } from "@/src/lib/date";
import { Task, TaskPriority } from "@/src/store/types";
import { useLifeStore } from "@/src/store/useLifeStore";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const FILTERS = ["Today", "Upcoming", "Overdue", "All", "Done"] as const;
type Filter = (typeof FILTERS)[number];

const useS = makeStyles((c) => ({
  task: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 12 },
  checkbox: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "700", color: c.onSurface },
  sub: { fontSize: 13, color: c.muted, marginTop: 1 },
  focusCard: { backgroundColor: c.surfaceInverse, borderRadius: radius.lg, padding: spacing.lg, alignItems: "center", gap: spacing.md },
  timer: { fontSize: 56, fontWeight: "800", color: c.onSurfaceInverse, fontVariant: ["tabular-nums"] },
  dateChipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
}));

export default function PlannerScreen() {
  const s = useS();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const st = useLifeStore();
  const [filter, setFilter] = useState<Filter>("Today");
  const [add, setAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState<string | null>(dayjs().toISOString());
  const [priority, setPriority] = useState<TaskPriority>("med");
  const [recurring, setRecurring] = useState<Task["recurring"]>(null);

  const [focus, setFocus] = useState<Task | null>(null);
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    } else if (timerRef.current) clearInterval(timerRef.current);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  useEffect(() => { if (seconds === 0) { setRunning(false); if (focus) toast("Focus session complete! 🎉"); } }, [seconds]);

  const tasks = useMemo(() => {
    const list = [...st.tasks].sort((a, b) => (a.dueDate ? +dayjs(a.dueDate) : Infinity) - (b.dueDate ? +dayjs(b.dueDate) : Infinity));
    const startDay = dayjs().startOf("day");
    switch (filter) {
      case "Today": return list.filter((t) => !t.done && t.dueDate && dayjs(t.dueDate).isSame(startDay, "day"));
      case "Upcoming": return list.filter((t) => !t.done && t.dueDate && dayjs(t.dueDate).isAfter(startDay));
      case "Overdue": return list.filter((t) => !t.done && t.dueDate && dayjs(t.dueDate).isBefore(startDay));
      case "Done": return list.filter((t) => t.done);
      default: return list.filter((t) => !t.done);
    }
  }, [st.tasks, filter]);

  const events = useMemo(() => st.events.filter((e) => dayjs(e.start).isSame(dayjs(), "day")).sort((a, b) => +dayjs(a.start) - +dayjs(b.start)), [st.events]);

  const submit = () => {
    if (!title.trim()) { toast("Enter a task title", "error"); return; }
    st.addTask({ title, dueDate: due || undefined, priority, recurring });
    setTitle(""); setDue(dayjs().toISOString()); setPriority("med"); setRecurring(null); setAdd(false);
    toast("Task added");
  };

  const dateOptions = [
    { label: "Today", v: dayjs().toISOString() }, { label: "Tomorrow", v: dayjs().add(1, "day").toISOString() },
    { label: "In 3 days", v: dayjs().add(3, "day").toISOString() }, { label: "Next week", v: dayjs().add(7, "day").toISOString() },
    { label: "No date", v: null },
  ];
  const prioColor = (p: TaskPriority) => (p === "high" ? colors.error : p === "med" ? colors.warning : colors.muted);
  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <Screen>
      <Header title="Planner" back right={<IconButton name="plus" testID="planner-add" bg={colors.brandPrimary} color={colors.onBrandPrimary} onPress={() => setAdd(true)} />} />
      <ChipRow>{FILTERS.map((f) => <Chip key={f} testID={`filter-${f}`} label={f} active={filter === f} onPress={() => setFilter(f)} />)}</ChipRow>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 100 }}>
        {filter === "Today" && events.length > 0 && (
          <Card style={{ marginBottom: spacing.md }}>
            <Text style={{ fontSize: 13, fontWeight: "800", color: colors.muted, marginBottom: spacing.sm }}>{"TODAY'S EVENTS"}</Text>
            {events.map((e, i) => (
              <View key={e.id} style={[s.task, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }}><Icon name={e.kind === "workout" ? "activity" : "calendar"} size={16} color={colors.brandPrimary} /></View>
                <View style={{ flex: 1 }}><Text style={s.title}>{e.title}</Text><Text style={s.sub}>{dayjs(e.start).format("h:mm A")}</Text></View>
              </View>
            ))}
          </Card>
        )}
        {tasks.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: spacing.xxl }}>
            <Icon name="check-circle" size={44} color={colors.muted} />
            <Text style={{ color: colors.muted, marginTop: spacing.md, fontWeight: "600" }}>No {filter.toLowerCase()} tasks</Text>
          </View>
        ) : (
          <Card>
            {tasks.map((t, i) => (
              <View key={t.id} style={[s.task, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                <Pressable testID={`task-check-${t.id}`} onPress={() => st.toggleTask(t.id)} style={[s.checkbox, { borderColor: t.done ? colors.brandPrimary : colors.borderStrong, backgroundColor: t.done ? colors.brandPrimary : "transparent" }]}>
                  {t.done && <Icon name="check" size={16} color={colors.onBrandPrimary} />}
                </Pressable>
                <Pressable style={{ flex: 1 }} onPress={() => { setFocus(t); setSeconds(25 * 60); setRunning(false); }}>
                  <Text style={[s.title, t.done && { textDecorationLine: "line-through", color: colors.muted }]}>{t.title}</Text>
                  <Text style={s.sub}>{t.dueDate ? relative(t.dueDate) : "No date"}{t.recurring ? ` · ${t.recurring}` : ""}{t.personId ? ` · ${st.people.find((p) => p.id === t.personId)?.name || ""}` : ""}</Text>
                </Pressable>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: prioColor(t.priority) }} />
                <Pressable testID={`task-del-${t.id}`} onPress={() => { st.removeTask(t.id); toast("Task deleted"); }} hitSlop={8}><Icon name="trash" size={18} color={colors.muted} /></Pressable>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      <Sheet visible={add} onClose={() => setAdd(false)} title="New task" testID="add-task-sheet">
        <Input label="Task" value={title} onChangeText={setTitle} placeholder="e.g. Pay electricity bill" autoFocus />
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.onSurfaceTertiary, marginBottom: spacing.xs }}>Due</Text>
        <View style={s.dateChipRow}>{dateOptions.map((o) => <Chip key={o.label} label={o.label} active={due === o.v} onPress={() => setDue(o.v)} />)}</View>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.onSurfaceTertiary, marginBottom: spacing.xs }}>Priority</Text>
        <View style={s.dateChipRow}>{(["low", "med", "high"] as TaskPriority[]).map((p) => <Chip key={p} label={p} active={priority === p} onPress={() => setPriority(p)} />)}</View>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.onSurfaceTertiary, marginBottom: spacing.xs }}>Repeat</Text>
        <View style={s.dateChipRow}>{[null, "daily", "weekly", "monthly"].map((r) => <Chip key={String(r)} label={r || "None"} active={recurring === r} onPress={() => setRecurring(r as any)} />)}</View>
        <PrimaryButton label="Add task" icon="plus" onPress={submit} testID="submit-task" />
      </Sheet>

      <Sheet visible={!!focus} onClose={() => { setFocus(null); setRunning(false); }} title="Focus mode" testID="focus-sheet">
        {focus && (
          <View style={{ gap: spacing.md }}>
            <View style={s.focusCard}>
              <Text style={{ color: colors.onSurfaceInverse, opacity: 0.8, fontWeight: "700" }}>{focus.title}</Text>
              <Text style={s.timer}>{mmss}</Text>
              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <Pressable testID="focus-toggle" onPress={() => setRunning((r) => !r)} style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" }}>
                  <Icon name={running ? "pause" : "play"} size={28} color={colors.onBrandPrimary} />
                </Pressable>
                <Pressable testID="focus-reset" onPress={() => { setRunning(false); setSeconds(25 * 60); }} style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center" }}>
                  <Icon name="repeat" size={26} color={colors.onSurfaceTertiary} />
                </Pressable>
              </View>
            </View>
            {!focus.done && <PrimaryButton label="Mark task done" icon="check" onPress={() => { st.toggleTask(focus.id); setFocus(null); setRunning(false); toast("Nice work! Task done ✅"); }} testID="focus-done" />}
          </View>
        )}
      </Sheet>
    </Screen>
  );
}
