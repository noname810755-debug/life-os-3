import dayjs from "dayjs";
import { EventItem, Goal, Habit, ID, Person, Subject, Task, Trip, Txn } from "@/src/store/types";

export type NodeKind =
  | "you" | "person" | "money" | "task" | "event" | "goal" | "habit" | "trip" | "study" | "fitness" | "hub";

export interface GraphNode {
  id: string;
  kind: NodeKind;
  label: string;
  sub?: string;
  refType?: string;
  refId?: ID;
  parentId?: string;
  depth: number;
  x: number;
  y: number;
  r: number;
  hasChildren: boolean;
}
export interface GraphEdge { from: string; to: string; }

export interface GraphData {
  people: Person[];
  tasks: Task[];
  transactions: Txn[];
  events: EventItem[];
  goals: Goal[];
  habits: Habit[];
  trips: Trip[];
  subjects: Subject[];
}

export interface GraphOpts {
  kinds: Set<NodeKind>; // allowed kinds
  timeDays: number | null; // null = all
  expanded: Set<string>;
  search: string;
}

const C = 500;
const R1 = 250;
const R2 = 150;
const R3 = 100;

interface Raw {
  id: string; kind: NodeKind; label: string; sub?: string;
  refType?: string; refId?: string; parentId?: string; depth: number;
  date?: number;
}

export function buildGraph(data: GraphData, opts: GraphOpts): { nodes: GraphNode[]; edges: GraphEdge[]; total: number } {
  const raws: Raw[] = [];
  const push = (r: Raw) => raws.push(r);

  push({ id: "you", kind: "you", label: "You", depth: 0 });

  // People (depth 1)
  data.people.forEach((p) => push({ id: `person:${p.id}`, kind: "person", label: p.name, refType: "person", refId: p.id, parentId: "you", depth: 1 }));

  // Hubs (depth 1) — only if they will hold orphans
  const hubKinds: { kind: NodeKind; label: string }[] = [
    { kind: "money", label: "Money" }, { kind: "task", label: "Tasks" },
    { kind: "event", label: "Events" }, { kind: "goal", label: "Goals" },
    { kind: "habit", label: "Habits" }, { kind: "trip", label: "Trips" },
    { kind: "study", label: "Study" },
  ];
  const hubUsed = new Set<NodeKind>();

  const personId = (pid?: string) => (pid && data.people.some((p) => p.id === pid) ? `person:${pid}` : undefined);

  // Trips first (may be children of person or trips hub)
  data.trips.forEach((t) => {
    const owner = t.peopleIds && t.peopleIds[0] ? personId(t.peopleIds[0]) : undefined;
    const parent = owner || "hub:trip";
    if (parent === "hub:trip") hubUsed.add("trip");
    push({ id: `trip:${t.id}`, kind: "trip", label: t.destination, sub: t.budget ? `₹${t.budget}` : undefined, refType: "trip", refId: t.id, parentId: parent, depth: owner ? 2 : 2, date: t.createdAt });
  });

  data.tasks.forEach((t) => {
    const parent = personId(t.personId) || (t.tripId ? `trip:${t.tripId}` : undefined) || "hub:task";
    if (parent === "hub:task") hubUsed.add("task");
    push({ id: `task:${t.id}`, kind: "task", label: t.title, sub: t.done ? "done" : undefined, refType: "task", refId: t.id, parentId: parent, depth: 2, date: t.dueDate ? +dayjs(t.dueDate) : t.createdAt });
  });

  data.transactions.forEach((t) => {
    const parent = personId(t.personId) || (t.tripId ? `trip:${t.tripId}` : undefined) || "hub:money";
    if (parent === "hub:money") hubUsed.add("money");
    const label = t.type === "debt_in" ? `+₹${t.amount}` : t.type === "debt_out" ? `-₹${t.amount}` : t.type === "income" ? `+₹${t.amount}` : `₹${t.amount}`;
    push({ id: `money:${t.id}`, kind: "money", label, sub: t.category, refType: "txn", refId: t.id, parentId: parent, depth: 2, date: +dayjs(t.date) });
  });

  data.events.forEach((e) => {
    const parent = personId(e.personId) || (e.tripId ? `trip:${e.tripId}` : undefined) || "hub:event";
    if (parent === "hub:event") hubUsed.add("event");
    push({ id: `event:${e.id}`, kind: "event", label: e.title, refType: "event", refId: e.id, parentId: parent, depth: 2, date: +dayjs(e.start) });
  });

  data.goals.forEach((g) => { hubUsed.add("goal"); push({ id: `goal:${g.id}`, kind: "goal", label: g.title, refType: "goal", refId: g.id, parentId: "hub:goal", depth: 2, date: g.createdAt }); });
  data.habits.forEach((h) => { hubUsed.add("habit"); push({ id: `habit:${h.id}`, kind: "habit", label: h.title, refType: "habit", refId: h.id, parentId: "hub:habit", depth: 2, date: h.createdAt }); });
  data.subjects.forEach((s) => { hubUsed.add("study"); push({ id: `study:${s.id}`, kind: "study", label: s.name, refType: "subject", refId: s.id, parentId: "hub:study", depth: 2, date: s.createdAt }); });

  hubKinds.forEach((h) => { if (hubUsed.has(h.kind)) push({ id: `hub:${h.kind}`, kind: "hub", label: h.label, parentId: "you", depth: 1 }); });

  // ---- Filters ----
  const now = Date.now();
  const timeCut = opts.timeDays ? now - opts.timeDays * 86400000 : null;
  const timeCutFwd = opts.timeDays ? now + opts.timeDays * 86400000 : null;

  const kindAllowed = (r: Raw): boolean => {
    if (r.kind === "you") return true;
    if (r.kind === "hub") return opts.kinds.has(hubToKind(r.id));
    return opts.kinds.has(r.kind);
  };
  const timeAllowed = (r: Raw): boolean => {
    if (!timeCut || r.date == null) return true;
    if (!["task", "event", "money"].includes(r.kind)) return true;
    return r.date >= timeCut && (timeCutFwd ? r.date <= timeCutFwd : true);
  };

  let visible = raws.filter((r) => kindAllowed(r) && timeAllowed(r));

  // Prune children whose parent is filtered out
  const idset = new Set(visible.map((r) => r.id));
  visible = visible.filter((r) => r.depth === 0 || (r.parentId && idset.has(r.parentId)) || r.parentId === "you");
  const idset2 = new Set(visible.map((r) => r.id));

  // hasChildren
  const childCount: Record<string, number> = {};
  visible.forEach((r) => { if (r.parentId) childCount[r.parentId] = (childCount[r.parentId] || 0) + 1; });

  // Expansion: node visible only if all ancestors (except you) are expanded
  const byId: Record<string, Raw> = {};
  visible.forEach((r) => (byId[r.id] = r));
  const isShown = (r: Raw): boolean => {
    if (r.depth <= 1) return true;
    let p = r.parentId;
    while (p && p !== "you") {
      if (!opts.expanded.has(p)) return false;
      p = byId[p]?.parentId;
    }
    return true;
  };
  const shown = visible.filter(isShown);

  // ---- Layout ----
  const level1 = shown.filter((r) => r.depth === 1);
  const posOf: Record<string, { x: number; y: number }> = { you: { x: C, y: C } };

  level1.forEach((r, i) => {
    const ang = (i / Math.max(1, level1.length)) * Math.PI * 2 - Math.PI / 2;
    posOf[r.id] = { x: C + R1 * Math.cos(ang), y: C + R1 * Math.sin(ang) };
  });

  const placeChildren = (parentId: string, radius: number) => {
    const kids = shown.filter((r) => r.parentId === parentId);
    if (!kids.length) return;
    const pp = posOf[parentId];
    const base = Math.atan2(pp.y - C, pp.x - C); // outward
    const spread = Math.min(Math.PI * 1.4, 0.5 + kids.length * 0.35);
    kids.forEach((k, i) => {
      const a = kids.length === 1 ? base : base - spread / 2 + (spread * i) / (kids.length - 1);
      posOf[k.id] = { x: pp.x + radius * Math.cos(a), y: pp.y + radius * Math.sin(a) };
    });
  };
  level1.forEach((r) => placeChildren(r.id, R2));
  // depth 3 (trip children etc.)
  shown.filter((r) => r.depth === 2).forEach((r) => placeChildren(r.id, R3));

  const rOf = (r: Raw) => (r.depth === 0 ? 34 : r.depth === 1 ? r.kind === "hub" ? 24 : 26 : r.depth === 2 ? 19 : 15);

  const nodes: GraphNode[] = shown
    .filter((r) => posOf[r.id])
    .map((r) => ({
      id: r.id, kind: r.kind, label: r.label, sub: r.sub, refType: r.refType, refId: r.refId,
      parentId: r.parentId, depth: r.depth, x: posOf[r.id].x, y: posOf[r.id].y, r: rOf(r),
      hasChildren: (childCount[r.id] || 0) > 0,
    }));

  const shownIds = new Set(nodes.map((n) => n.id));
  const edges: GraphEdge[] = nodes
    .filter((n) => n.parentId && shownIds.has(n.parentId))
    .map((n) => ({ from: n.parentId!, to: n.id }));

  return { nodes, edges, total: visible.length };
}

function hubToKind(hubId: string): NodeKind {
  return hubId.replace("hub:", "") as NodeKind;
}
