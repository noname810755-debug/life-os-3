import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { storage } from "@/src/utils/storage";
import { uid } from "@/src/lib/id";
import { ymd } from "@/src/lib/date";
import {
  Budget, DraftAction, EventItem, Goal, Habit, ID, InboxItem, Person, Settings,
  Subject, Task, Trip, Txn, Workout,
} from "./types";

const zstorage = {
  getItem: async (name: string) => {
    const v = await storage.getItem(name, "");
    return v ? (v as string) : null;
  },
  setItem: async (name: string, value: string) => {
    await storage.setItem(name, value);
  },
  removeItem: async (name: string) => {
    await storage.removeItem(name);
  },
};

interface State {
  hydrated: boolean;
  people: Person[];
  tasks: Task[];
  transactions: Txn[];
  events: EventItem[];
  goals: Goal[];
  habits: Habit[];
  trips: Trip[];
  budgets: Budget[];
  subjects: Subject[];
  workouts: Workout[];
  inbox: InboxItem[];
  settings: Settings;

  // People
  addPerson: (p: Partial<Person> & { name: string }) => Person;
  updatePerson: (id: ID, patch: Partial<Person>) => void;
  removePerson: (id: ID) => void;
  findOrCreatePerson: (name: string) => Person;

  // Tasks
  addTask: (t: Partial<Task> & { title: string }) => Task;
  toggleTask: (id: ID) => void;
  updateTask: (id: ID, patch: Partial<Task>) => void;
  removeTask: (id: ID) => void;

  // Transactions
  addTxn: (t: Partial<Txn> & { type: Txn["type"]; amount: number }) => Txn;
  updateTxn: (id: ID, patch: Partial<Txn>) => void;
  settleTxn: (id: ID) => void;
  removeTxn: (id: ID) => void;

  // Events
  addEvent: (e: Partial<EventItem> & { title: string; start: string }) => EventItem;
  removeEvent: (id: ID) => void;

  // Goals
  addGoal: (g: Partial<Goal> & { title: string }) => Goal;
  updateGoal: (id: ID, patch: Partial<Goal>) => void;
  addToGoal: (id: ID, amount: number) => void;
  toggleMilestone: (goalId: ID, mId: ID) => void;
  removeGoal: (id: ID) => void;

  // Habits
  addHabit: (h: Partial<Habit> & { title: string }) => Habit;
  toggleHabitToday: (id: ID) => void;
  removeHabit: (id: ID) => void;

  // Trips
  addTrip: (t: Partial<Trip> & { destination: string }) => Trip;
  updateTrip: (id: ID, patch: Partial<Trip>) => void;
  togglePacking: (tripId: ID, itemId: ID) => void;
  addPacking: (tripId: ID, label: string) => void;
  removeTrip: (id: ID) => void;

  // Budgets
  setBudget: (category: string, limit: number) => void;
  removeBudget: (id: ID) => void;

  // Study
  addSubject: (s: Partial<Subject> & { name: string }) => Subject;
  toggleChapter: (subjectId: ID, chapterId: ID) => void;
  toggleWeak: (subjectId: ID, chapterId: ID) => void;
  addChapter: (subjectId: ID, title: string) => void;
  removeSubject: (id: ID) => void;

  // Fitness
  addWorkout: (w: Partial<Workout> & { title: string }) => Workout;
  removeWorkout: (id: ID) => void;
  addWater: (n: number) => void;

  // Inbox
  addInbox: (text: string, suggestedType?: string) => void;
  removeInbox: (id: ID) => void;

  // NLP apply
  applyActions: (actions: DraftAction[]) => void;

  setSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
  importAll: (data: any) => boolean;
}

const defaultSettings: Settings = {
  name: "You",
  theme: "system",
  pinEnabled: false,
  pin: null,
  waterGoal: 8,
  waterToday: { date: ymd(), count: 0 },
  notificationsEnabled: false,
};

export const useLifeStore = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      people: [],
      tasks: [],
      transactions: [],
      events: [],
      goals: [],
      habits: [],
      trips: [],
      budgets: [],
      subjects: [],
      workouts: [],
      inbox: [],
      settings: defaultSettings,

      addPerson: (p) => {
        const person: Person = {
          id: uid("per"), name: p.name.trim(), phone: p.phone, notes: p.notes,
          importantDates: p.importantDates || [], giftIdeas: p.giftIdeas || [], createdAt: Date.now(),
        };
        set((s) => ({ people: [person, ...s.people] }));
        return person;
      },
      updatePerson: (id, patch) =>
        set((s) => ({ people: s.people.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removePerson: (id) =>
        set((s) => ({
          people: s.people.filter((x) => x.id !== id),
          tasks: s.tasks.map((t) => (t.personId === id ? { ...t, personId: undefined } : t)),
          transactions: s.transactions.map((t) => (t.personId === id ? { ...t, personId: undefined } : t)),
          events: s.events.map((e) => (e.personId === id ? { ...e, personId: undefined } : e)),
        })),
      findOrCreatePerson: (name) => {
        const existing = get().people.find(
          (p) => p.name.toLowerCase() === name.trim().toLowerCase(),
        );
        if (existing) return existing;
        return get().addPerson({ name });
      },

      addTask: (t) => {
        const task: Task = {
          id: uid("tsk"), title: t.title.trim(), done: false, dueDate: t.dueDate,
          priority: t.priority || "med", personId: t.personId, tripId: t.tripId,
          goalId: t.goalId, recurring: t.recurring ?? null, source: t.source, createdAt: Date.now(),
        };
        set((s) => ({ tasks: [task, ...s.tasks] }));
        return task;
      },
      toggleTask: (id) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
      updateTask: (id, patch) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      addTxn: (t) => {
        const txn: Txn = {
          id: uid("txn"), type: t.type, amount: Math.abs(t.amount), category: t.category || "General",
          note: t.note, date: t.date || new Date().toISOString(), personId: t.personId,
          tripId: t.tripId, settled: t.settled || false, createdAt: Date.now(),
        };
        set((s) => ({ transactions: [txn, ...s.transactions] }));
        return txn;
      },
      updateTxn: (id, patch) =>
        set((s) => ({ transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      settleTxn: (id) =>
        set((s) => ({ transactions: s.transactions.map((t) => (t.id === id ? { ...t, settled: true } : t)) })),
      removeTxn: (id) => set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),

      addEvent: (e) => {
        const ev: EventItem = {
          id: uid("evt"), title: e.title.trim(), start: e.start, kind: e.kind || "general",
          personId: e.personId, tripId: e.tripId, location: e.location, createdAt: Date.now(),
        };
        set((s) => ({ events: [ev, ...s.events] }));
        return ev;
      },
      removeEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

      addGoal: (g) => {
        const goal: Goal = {
          id: uid("goal"), title: g.title.trim(), type: g.type || "general",
          targetAmount: g.targetAmount, savedAmount: g.savedAmount || 0, deadline: g.deadline,
          milestones: g.milestones || [], createdAt: Date.now(),
        };
        set((s) => ({ goals: [goal, ...s.goals] }));
        return goal;
      },
      updateGoal: (id, patch) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
      addToGoal: (id, amount) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === id ? { ...g, savedAmount: (g.savedAmount || 0) + amount } : g,
          ),
        })),
      toggleMilestone: (goalId, mId) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? { ...g, milestones: g.milestones.map((m) => (m.id === mId ? { ...m, done: !m.done } : m)) }
              : g,
          ),
        })),
      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      addHabit: (h) => {
        const habit: Habit = {
          id: uid("hab"), title: h.title.trim(), schedule: h.schedule || "daily",
          history: h.history || [], createdAt: Date.now(),
        };
        set((s) => ({ habits: [habit, ...s.habits] }));
        return habit;
      },
      toggleHabitToday: (id) =>
        set((s) => ({
          habits: s.habits.map((h) => {
            if (h.id !== id) return h;
            const today = ymd();
            const has = h.history.includes(today);
            return { ...h, history: has ? h.history.filter((d) => d !== today) : [...h.history, today] };
          }),
        })),
      removeHabit: (id) => set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),

      addTrip: (t) => {
        const trip: Trip = {
          id: uid("trip"), destination: t.destination.trim(), startDate: t.startDate,
          endDate: t.endDate, budget: t.budget, packing: t.packing || [], itinerary: t.itinerary || [],
          peopleIds: t.peopleIds || [], createdAt: Date.now(),
        };
        set((s) => ({ trips: [trip, ...s.trips] }));
        return trip;
      },
      updateTrip: (id, patch) =>
        set((s) => ({ trips: s.trips.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      togglePacking: (tripId, itemId) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === tripId
              ? { ...t, packing: t.packing.map((p) => (p.id === itemId ? { ...p, packed: !p.packed } : p)) }
              : t,
          ),
        })),
      addPacking: (tripId, label) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === tripId
              ? { ...t, packing: [...t.packing, { id: uid("pk"), label, packed: false }] }
              : t,
          ),
        })),
      removeTrip: (id) => set((s) => ({ trips: s.trips.filter((t) => t.id !== id) })),

      setBudget: (category, limit) =>
        set((s) => {
          const existing = s.budgets.find((b) => b.category.toLowerCase() === category.toLowerCase());
          if (existing)
            return { budgets: s.budgets.map((b) => (b.id === existing.id ? { ...b, limit } : b)) };
          return { budgets: [...s.budgets, { id: uid("bud"), category, limit }] };
        }),
      removeBudget: (id) => set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) })),

      addSubject: (sub) => {
        const subject: Subject = {
          id: uid("sub"), name: sub.name.trim(), examDate: sub.examDate,
          chapters: sub.chapters || [], createdAt: Date.now(),
        };
        set((s) => ({ subjects: [subject, ...s.subjects] }));
        return subject;
      },
      toggleChapter: (subjectId, chapterId) =>
        set((s) => ({
          subjects: s.subjects.map((sub) =>
            sub.id === subjectId
              ? { ...sub, chapters: sub.chapters.map((c) => (c.id === chapterId ? { ...c, done: !c.done } : c)) }
              : sub,
          ),
        })),
      toggleWeak: (subjectId, chapterId) =>
        set((s) => ({
          subjects: s.subjects.map((sub) =>
            sub.id === subjectId
              ? { ...sub, chapters: sub.chapters.map((c) => (c.id === chapterId ? { ...c, weak: !c.weak } : c)) }
              : sub,
          ),
        })),
      addChapter: (subjectId, title) =>
        set((s) => ({
          subjects: s.subjects.map((sub) =>
            sub.id === subjectId
              ? { ...sub, chapters: [...sub.chapters, { id: uid("ch"), title, done: false, weak: false }] }
              : sub,
          ),
        })),
      removeSubject: (id) => set((s) => ({ subjects: s.subjects.filter((x) => x.id !== id) })),

      addWorkout: (w) => {
        const workout: Workout = {
          id: uid("wk"), title: w.title.trim(), date: w.date || new Date().toISOString(),
          minutes: w.minutes, type: w.type, createdAt: Date.now(),
        };
        set((s) => ({ workouts: [workout, ...s.workouts] }));
        return workout;
      },
      removeWorkout: (id) => set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) })),
      addWater: (n) =>
        set((s) => {
          const today = ymd();
          const cur = s.settings.waterToday.date === today ? s.settings.waterToday.count : 0;
          return { settings: { ...s.settings, waterToday: { date: today, count: Math.min(s.settings.waterGoal, Math.max(0, cur + n)) } } };
        }),

      addInbox: (text, suggestedType) =>
        set((s) => ({
          inbox: [{ id: uid("in"), text: text.trim(), suggestedType, processed: false, createdAt: Date.now() }, ...s.inbox],
        })),
      removeInbox: (id) => set((s) => ({ inbox: s.inbox.filter((i) => i.id !== id) })),

      applyActions: (actions) => {
        actions
          .filter((a) => a.include)
          .forEach((a) => {
            const p = a.payload;
            let personId: ID | undefined;
            if (p.personName) personId = get().findOrCreatePerson(p.personName).id;
            if (a.type === "task") get().addTask({ title: p.title, dueDate: p.dueDate, priority: p.priority, personId, source: "command" });
            else if (a.type === "event") get().addEvent({ title: p.title, start: p.start, kind: p.kind, personId });
            else if (a.type === "txn") get().addTxn({ type: p.txnType, amount: p.amount, category: p.category, note: p.note, personId, settled: false });
            else if (a.type === "trip") {
              const trip = get().addTrip({ destination: p.destination, startDate: p.startDate, budget: p.budget, peopleIds: personId ? [personId] : [] });
              if (p.budget) get().addEvent({ title: `Trip to ${p.destination}`, start: p.startDate || new Date().toISOString(), kind: "general", tripId: trip.id });
            } else if (a.type === "goal") get().addGoal({ title: p.title, type: p.amount ? "save" : "general", targetAmount: p.amount, deadline: p.deadline });
            else if (a.type === "habit") get().addHabit({ title: p.title, schedule: "daily" });
          });
      },

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      importAll: (data) => {
        if (!data || typeof data !== "object") return false;
        const keys = ["people", "tasks", "transactions", "events", "goals", "habits", "trips", "budgets", "subjects", "workouts", "inbox"];
        const patch: any = {};
        keys.forEach((k) => { if (Array.isArray(data[k])) patch[k] = data[k]; });
        if (data.settings && typeof data.settings === "object") patch.settings = { ...defaultSettings, ...data.settings };
        if (Object.keys(patch).length === 0) return false;
        set(patch);
        return true;
      },
      resetAll: () =>
        set({
          people: [], tasks: [], transactions: [], events: [], goals: [], habits: [],
          trips: [], budgets: [], subjects: [], workouts: [], inbox: [], settings: defaultSettings,
        }),
    }),
    {
      name: "life-os-v1",
      storage: createJSONStorage(() => zstorage),
      partialize: (s) => {
        const { hydrated, ...rest } = s as any;
        return rest;
      },
      onRehydrateStorage: () => (state) => {
        useLifeStore.setState({ hydrated: true });
      },
    },
  ),
);
