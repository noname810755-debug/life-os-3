import dayjs from "dayjs";
import { money } from "@/src/lib/date";
import { EventItem, Goal, Habit, Person, Subject, Task, Trip, Txn, Workout } from "@/src/store/types";

export interface AskData {
  people: Person[]; tasks: Task[]; transactions: Txn[]; events: EventItem[];
  goals: Goal[]; habits: Habit[]; trips: Trip[]; subjects: Subject[]; workouts: Workout[];
}

export interface AskResult {
  title: string;
  stats?: { label: string; value: string }[];
  bullets?: string[];
  navLabel?: string;
  navPath?: string;
}

export const ASK_SUGGESTIONS = [
  "Is month sabse zyada paise kahan gaye?",
  "Next 7 din mein kya important hai?",
  "Kaunse goals late chal rahe hain?",
  "Kitna udhaar baaki hai?",
  "Meri study aur workout ka balance kaisa hai?",
];

export function askLife(qRaw: string, d: AskData): AskResult {
  const q = qRaw.toLowerCase().trim();

  // Person-related
  const person = d.people.find((p) => q.includes(p.name.toLowerCase()));
  if (person && (q.includes("related") || q.includes("sab") || q.includes("dikha") || q.includes("about") || q.includes(person.name.toLowerCase()))) {
    const tasks = d.tasks.filter((t) => t.personId === person.id);
    const txns = d.transactions.filter((t) => t.personId === person.id);
    const events = d.events.filter((e) => e.personId === person.id);
    const trips = d.trips.filter((t) => t.peopleIds?.includes(person.id));
    const owed = txns.filter((t) => t.type === "debt_in" && !t.settled).reduce((s, t) => s + t.amount, 0);
    const owe = txns.filter((t) => t.type === "debt_out" && !t.settled).reduce((s, t) => s + t.amount, 0);
    return {
      title: `Everything about ${person.name}`,
      stats: [
        { label: "They owe you", value: money(owed) },
        { label: "You owe", value: money(owe) },
        { label: "Open tasks", value: String(tasks.filter((t) => !t.done).length) },
        { label: "Events", value: String(events.length) },
      ],
      bullets: [
        ...tasks.slice(0, 4).map((t) => `Task: ${t.title}${t.done ? " (done)" : ""}`),
        ...trips.map((t) => `Trip: ${t.destination}`),
        ...events.slice(0, 3).map((e) => `Event: ${e.title}`),
      ],
      navLabel: `Open ${person.name}`,
      navPath: `/person/${person.id}`,
    };
  }

  // Spending / where money went
  if (/(sabse zyada|most|kahan|where).*(paise|money|spend|kharch|gaye|gaya)|spending|kharch/.test(q)) {
    const monthTxns = d.transactions.filter((t) => t.type === "expense" && dayjs(t.date).isSame(dayjs(), "month"));
    const byCat: Record<string, number> = {};
    monthTxns.forEach((t) => (byCat[t.category] = (byCat[t.category] || 0) + t.amount));
    const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const total = monthTxns.reduce((s, t) => s + t.amount, 0);
    return {
      title: "This month's spending",
      stats: [
        { label: "Total spent", value: money(total) },
        { label: "Top category", value: sorted[0] ? sorted[0][0] : "—" },
      ],
      bullets: sorted.length ? sorted.slice(0, 5).map(([c, v]) => `${c}: ${money(v)}`) : ["No expenses recorded this month yet."],
      navLabel: "Open Finance",
      navPath: "/finance",
    };
  }

  // Debts
  if (/(udhaar|udhar|debt|owe|lene|dene|baaki)/.test(q)) {
    const owed = d.transactions.filter((t) => t.type === "debt_in" && !t.settled);
    const owe = d.transactions.filter((t) => t.type === "debt_out" && !t.settled);
    const owedTotal = owed.reduce((s, t) => s + t.amount, 0);
    const oweTotal = owe.reduce((s, t) => s + t.amount, 0);
    const nameOf = (id?: string) => d.people.find((p) => p.id === id)?.name || "Someone";
    return {
      title: "Debts & dues",
      stats: [
        { label: "You'll receive", value: money(owedTotal) },
        { label: "You owe", value: money(oweTotal) },
      ],
      bullets: [
        ...owed.map((t) => `${nameOf(t.personId)} owes you ${money(t.amount)}`),
        ...owe.map((t) => `You owe ${nameOf(t.personId)} ${money(t.amount)}`),
      ].slice(0, 8),
      navLabel: "Open Finance",
      navPath: "/finance",
    };
  }

  // Upcoming / important next N days
  if (/(next|agle|upcoming|important|zaroori|kya hai).*(din|day|7|week|hafte)|important|upcoming|next 7/.test(q)) {
    const cutoff = dayjs().add(7, "day");
    const evs = d.events.filter((e) => dayjs(e.start).isAfter(dayjs().startOf("day")) && dayjs(e.start).isBefore(cutoff));
    const tks = d.tasks.filter((t) => !t.done && t.dueDate && dayjs(t.dueDate).isBefore(cutoff));
    const items = [
      ...evs.map((e) => ({ d: e.start, s: `📅 ${e.title} — ${dayjs(e.start).format("DD MMM, h:mm A")}` })),
      ...tks.map((t) => ({ d: t.dueDate!, s: `✓ ${t.title} — ${dayjs(t.dueDate).format("DD MMM")}` })),
    ].sort((a, b) => +dayjs(a.d) - +dayjs(b.d));
    return {
      title: "Next 7 days",
      stats: [{ label: "Events", value: String(evs.length) }, { label: "Tasks due", value: String(tks.length) }],
      bullets: items.length ? items.map((i) => i.s) : ["Nothing scheduled in the next 7 days. Enjoy!"],
      navLabel: "Open Planner",
      navPath: "/planner",
    };
  }

  // Goals late / behind
  if (/(goal).*(late|behind|peeche)|late chal|behind|goals?/.test(q)) {
    const late = d.goals.filter((g) => g.deadline && dayjs(g.deadline).isBefore(dayjs()) && (g.type !== "save" || (g.savedAmount || 0) < (g.targetAmount || 0)));
    const active = d.goals.filter((g) => !late.includes(g));
    return {
      title: "Goals status",
      stats: [{ label: "On track", value: String(active.length) }, { label: "Behind", value: String(late.length) }],
      bullets: [
        ...late.map((g) => `⚠️ ${g.title} — deadline passed`),
        ...active.slice(0, 4).map((g) => `${g.title}${g.type === "save" ? ` — ${money(g.savedAmount)}/${money(g.targetAmount)}` : ""}`),
      ].slice(0, 8).length ? [
        ...late.map((g) => `⚠️ ${g.title} — deadline passed`),
        ...active.slice(0, 4).map((g) => `${g.title}${g.type === "save" ? ` — ${money(g.savedAmount)}/${money(g.targetAmount)}` : ""}`),
      ] : ["No goals yet. Set one in Goals."],
      navLabel: "Open Goals",
      navPath: "/goals",
    };
  }

  // Trip spend
  const trip = d.trips.find((t) => q.includes(t.destination.toLowerCase()));
  if (trip) {
    const spent = d.transactions.filter((t) => t.tripId === trip.id && t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return {
      title: `${trip.destination} trip`,
      stats: [{ label: "Budget", value: money(trip.budget) }, { label: "Spent", value: money(spent) }, { label: "Left", value: money((trip.budget || 0) - spent) }],
      bullets: [`Packing: ${trip.packing.filter((p) => p.packed).length}/${trip.packing.length} packed`],
      navLabel: "Open Trip",
      navPath: `/trip/${trip.id}`,
    };
  }

  // Study vs workout balance
  if (/(study|padhai).*(workout|fitness|gym|balance)|balance/.test(q)) {
    const weekWorkouts = d.workouts.filter((w) => dayjs(w.date).isAfter(dayjs().subtract(7, "day"))).length;
    const studyEvents = d.events.filter((e) => e.kind === "study" && dayjs(e.start).isAfter(dayjs().subtract(7, "day"))).length;
    const chapters = d.subjects.reduce((s, sub) => s + sub.chapters.filter((c) => c.done).length, 0);
    return {
      title: "Study vs Fitness (7 days)",
      stats: [{ label: "Workouts", value: String(weekWorkouts) }, { label: "Study sessions", value: String(studyEvents) }, { label: "Chapters done", value: String(chapters) }],
      bullets: [weekWorkouts >= studyEvents ? "Fitness is ahead — great consistency." : "Study is ahead — schedule a workout to balance."],
      navLabel: "Open Fitness",
      navPath: "/fitness",
    };
  }

  // Fallback universal search
  const hits: string[] = [];
  d.tasks.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 3).forEach((t) => hits.push(`Task: ${t.title}`));
  d.people.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 3).forEach((p) => hits.push(`Person: ${p.name}`));
  d.trips.filter((t) => t.destination.toLowerCase().includes(q)).slice(0, 3).forEach((t) => hits.push(`Trip: ${t.destination}`));
  return {
    title: hits.length ? `Results for "${qRaw}"` : "Ask your life",
    bullets: hits.length ? hits : ["Try: “Is month sabse zyada paise kahan gaye?” or ask about a person, goal, or trip."],
  };
}
