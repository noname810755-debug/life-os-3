import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { LifeGraph } from "@/src/components/LifeGraph";
import { Card, Chip, ChipRow, Header, PrimaryButton, Screen, Sheet } from "@/src/components/ui";
import { askLife, ASK_SUGGESTIONS, AskResult } from "@/src/lib/ask";
import { fmtDateTime, money, relative } from "@/src/lib/date";
import { buildGraph, GraphNode, NodeKind } from "@/src/lib/graph";
import { useLifeStore } from "@/src/store/useLifeStore";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

type Tab = "graph" | "ask" | "timeline";
const CATS: { key: string; label: string; kind?: NodeKind }[] = [
  { key: "all", label: "All" }, { key: "person", label: "People", kind: "person" },
  { key: "money", label: "Money", kind: "money" }, { key: "task", label: "Tasks", kind: "task" },
  { key: "event", label: "Events", kind: "event" }, { key: "goal", label: "Goals", kind: "goal" },
  { key: "habit", label: "Habits", kind: "habit" }, { key: "trip", label: "Trips", kind: "trip" },
  { key: "study", label: "Study", kind: "study" },
];

const useS = makeStyles((c) => ({
  segment: { flexDirection: "row", backgroundColor: c.surfaceTertiary, borderRadius: radius.md, padding: 4, marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: radius.sm, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 },
  segText: { fontSize: 14, fontWeight: "800" },
  graphWrap: { flex: 1, marginHorizontal: spacing.lg, marginTop: spacing.sm, borderRadius: radius.lg, overflow: "hidden", backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  timeRow: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  askInput: { backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, paddingHorizontal: spacing.lg, paddingVertical: 14, fontSize: 16, color: c.onSurface, marginHorizontal: spacing.lg },
  stat: { flex: 1, backgroundColor: c.surfaceTertiary, borderRadius: radius.md, padding: spacing.md, minWidth: 100 },
  statV: { fontSize: 18, fontWeight: "800", color: c.onSurface },
  statL: { fontSize: 12, color: c.muted, fontWeight: "600", marginTop: 2 },
  bullet: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", paddingVertical: 6 },
  tItem: { flexDirection: "row", gap: spacing.md, paddingVertical: spacing.md, alignItems: "center" },
  tDot: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
}));

export default function LifeScreen() {
  const s = useS();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const store = useLifeStore();
  const [tab, setTab] = useState<Tab>("graph");
  const [cat, setCat] = useState("all");
  const [timeDays, setTimeDays] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<GraphNode | null>(null);

  const [ask, setAsk] = useState("");
  const [result, setResult] = useState<AskResult | null>(null);

  const kinds = useMemo(() => {
    if (cat === "all") return new Set<NodeKind>(["person", "money", "task", "event", "goal", "habit", "trip", "study", "fitness"]);
    return new Set<NodeKind>(["person", "trip", cat as NodeKind]);
  }, [cat]);

  const graph = useMemo(
    () => buildGraph(
      { people: store.people, tasks: store.tasks, transactions: store.transactions, events: store.events, goals: store.goals, habits: store.habits, trips: store.trips, subjects: store.subjects },
      { kinds, timeDays, expanded, search: "" },
    ),
    [store.people, store.tasks, store.transactions, store.events, store.goals, store.habits, store.trips, store.subjects, kinds, timeDays, expanded],
  );

  const onNodeTap = (node: GraphNode) => {
    if (node.hasChildren) {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(node.id)) next.delete(node.id); else next.add(node.id);
        return next;
      });
    }
    if (node.kind !== "you" && node.kind !== "hub") setSelected(node);
  };

  const openRecord = (node: GraphNode) => {
    setSelected(null);
    const routes: Record<string, string> = {
      person: `/person/${node.refId}`, txn: "/finance", task: "/planner", event: "/planner",
      goal: "/goals", habit: "/habits", trip: `/trip/${node.refId}`, subject: "/study",
    };
    const r = routes[node.refType || ""];
    if (r) router.push(r as any);
  };

  const runAsk = (q?: string) => {
    const query = (q ?? ask).trim();
    if (!query) return;
    setAsk(query);
    setResult(askLife(query, store));
  };

  const timeline = useMemo(() => {
    const items: { id: string; icon: any; color: string; title: string; sub: string; date: string }[] = [];
    store.events.forEach((e) => items.push({ id: e.id, icon: e.kind === "workout" ? "activity" : "calendar", color: "#8B5CF6", title: e.title, sub: "Event", date: e.start }));
    store.tasks.forEach((t) => items.push({ id: t.id, icon: "check", color: colors.brandPrimary, title: t.title, sub: t.done ? "Task · done" : "Task", date: t.dueDate || new Date(t.createdAt).toISOString() }));
    store.transactions.forEach((t) => items.push({ id: t.id, icon: "wallet", color: t.type === "expense" || t.type === "debt_out" ? colors.error : colors.success, title: `${t.category} ${money(t.amount)}`, sub: t.type, date: t.date }));
    store.trips.forEach((t) => items.push({ id: t.id, icon: "plane", color: "#E23B7B", title: t.destination, sub: "Trip", date: t.startDate || new Date(t.createdAt).toISOString() }));
    if (cat !== "all") {
      const map: Record<string, string[]> = { money: ["income", "expense", "debt_in", "debt_out"], task: ["Task", "Task · done"], event: ["Event"], trip: ["Trip"] };
      const allowed = map[cat];
      if (allowed) return items.filter((i) => allowed.includes(i.sub)).sort((a, b) => +dayjs(b.date) - +dayjs(a.date));
    }
    return items.sort((a, b) => +dayjs(b.date) - +dayjs(a.date));
  }, [store.events, store.tasks, store.transactions, store.trips, cat, colors]);

  const segs: { key: Tab; label: string; icon: any }[] = [
    { key: "graph", label: "Graph", icon: "graph" }, { key: "ask", label: "Ask", icon: "sparkles" }, { key: "timeline", label: "Timeline", icon: "clock" },
  ];

  return (
    <Screen>
      <Header title="Life" subtitle="Everything, connected" />
      <View style={s.segment}>
        {segs.map((seg) => (
          <Pressable key={seg.key} testID={`life-tab-${seg.key}`} onPress={() => setTab(seg.key)} style={[s.segBtn, tab === seg.key && { backgroundColor: colors.surfaceSecondary }]}>
            <Icon name={seg.icon} size={16} color={tab === seg.key ? colors.brandPrimary : colors.muted} />
            <Text style={[s.segText, { color: tab === seg.key ? colors.onSurface : colors.muted }]}>{seg.label}</Text>
          </Pressable>
        ))}
      </View>

      {tab !== "ask" && (
        <ChipRow>
          {CATS.map((c) => <Chip key={c.key} testID={`cat-${c.key}`} label={c.label} active={cat === c.key} onPress={() => setCat(c.key)} />)}
        </ChipRow>
      )}

      {tab === "graph" && (
        <>
          <View style={s.timeRow}>
            {[{ l: "All time", v: null }, { l: "7 days", v: 7 }, { l: "30 days", v: 30 }].map((t) => (
              <Chip key={t.l} testID={`time-${t.l}`} label={t.l} active={timeDays === t.v} onPress={() => setTimeDays(t.v)} />
            ))}
          </View>
          {graph.nodes.length <= 1 ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", marginBottom: spacing.md }}>
                <Icon name="graph" size={32} color={colors.brandPrimary} />
              </View>
              <Text style={{ fontSize: 17, fontWeight: "800", color: colors.onSurface, textAlign: "center" }}>Your Life Graph is empty</Text>
              <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 6, maxWidth: 280 }}>{"Add people, money, tasks and trips — they'll connect here automatically. Try the Command bar."}</Text>
              <View style={{ marginTop: spacing.lg }}><PrimaryButton label="Open Command" icon="command" onPress={() => router.push("/command")} testID="graph-empty-command" /></View>
            </View>
          ) : (
            <View style={[s.graphWrap, { marginBottom: spacing.sm }]}>
              <LifeGraph nodes={graph.nodes} edges={graph.edges} onNodeTap={onNodeTap} highlightId={selected?.id} />
              <View style={{ position: "absolute", left: 12, top: 12, backgroundColor: colors.surfaceTertiary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.onSurfaceTertiary }}>{graph.nodes.length} nodes · tap to expand</Text>
              </View>
            </View>
          )}
        </>
      )}

      {tab === "ask" && (
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
          <TextInput testID="ask-input" value={ask} onChangeText={setAsk} placeholder="Ask anything about your life…" placeholderTextColor={colors.muted} style={s.askInput} onSubmitEditing={() => runAsk()} returnKeyType="search" />
          <View style={{ padding: spacing.lg, paddingTop: spacing.md }}>
            <PrimaryButton testID="ask-run" label="Ask my life" icon="sparkles" onPress={() => runAsk()} />
          </View>
          {!result ? (
            <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
              <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 2 }}>Try asking</Text>
              {ASK_SUGGESTIONS.map((q) => (
                <Pressable key={q} testID={`ask-sug-${q.slice(0, 6)}`} onPress={() => runAsk(q)}>
                  <Card style={{ padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    <Icon name="search" size={16} color={colors.brandPrimary} />
                    <Text style={{ flex: 1, color: colors.onSurface, fontWeight: "600" }}>{q}</Text>
                  </Card>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={{ paddingHorizontal: spacing.lg }}>
              <Card>
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.onSurface, marginBottom: spacing.md }}>{result.title}</Text>
                {result.stats && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md }}>
                    {result.stats.map((st, i) => <View key={i} style={s.stat}><Text style={s.statV}>{st.value}</Text><Text style={s.statL}>{st.label}</Text></View>)}
                  </View>
                )}
                {result.bullets?.map((b, i) => (
                  <View key={i} style={s.bullet}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.brandPrimary, marginTop: 7 }} /><Text style={{ flex: 1, color: colors.onSurfaceSecondary, fontSize: 14, lineHeight: 20 }}>{b}</Text></View>
                ))}
                {result.navPath && (
                  <View style={{ marginTop: spacing.md }}><PrimaryButton testID="ask-nav" label={result.navLabel || "Open"} icon="arrow-right" onPress={() => router.push(result.navPath as any)} /></View>
                )}
              </Card>
            </View>
          )}
        </ScrollView>
      )}

      {tab === "timeline" && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + 100 }}>
          {timeline.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: spacing.xxl }}>
              <Icon name="clock" size={40} color={colors.muted} />
              <Text style={{ color: colors.muted, marginTop: spacing.md, fontWeight: "600" }}>No activity yet</Text>
            </View>
          ) : (
            <Card style={{ padding: spacing.md }}>
              {timeline.map((t, i) => (
                <View key={t.id + i} style={[s.tItem, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                  <View style={[s.tDot, { backgroundColor: colors.surfaceTertiary }]}><Icon name={t.icon} size={20} color={t.color} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: colors.onSurface }} numberOfLines={1}>{t.title}</Text>
                    <Text style={{ fontSize: 13, color: colors.muted }}>{t.sub} · {relative(t.date)}</Text>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </ScrollView>
      )}

      <Sheet visible={!!selected} onClose={() => setSelected(null)} title={selected?.label} testID="node-sheet">
        {selected && (
          <View style={{ gap: spacing.md }}>
            <Text style={{ color: colors.muted, fontSize: 14, textTransform: "capitalize" }}>{selected.kind}{selected.sub ? ` · ${selected.sub}` : ""}</Text>
            {selected.hasChildren && <Text style={{ color: colors.onSurfaceSecondary, fontSize: 14 }}>Tap the node again on the graph to expand its connections.</Text>}
            {selected.refType && <PrimaryButton testID="node-open" label="Open record" icon="arrow-right" onPress={() => openRecord(selected)} />}
          </View>
        )}
      </Sheet>
    </Screen>
  );
}
