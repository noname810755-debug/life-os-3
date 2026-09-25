export type ID = string;

export interface Person {
  id: ID;
  name: string;
  phone?: string;
  notes?: string;
  importantDates?: { id: ID; label: string; date: string }[];
  giftIdeas?: string[];
  createdAt: number;
}

export type TaskPriority = "low" | "med" | "high";
export interface Task {
  id: ID;
  title: string;
  done: boolean;
  dueDate?: string; // ISO
  priority: TaskPriority;
  personId?: ID;
  tripId?: ID;
  goalId?: ID;
  recurring?: "daily" | "weekly" | "monthly" | null;
  source?: string;
  createdAt: number;
}

// debt_in = someone owes me (asset). debt_out = I owe (liability).
export type TxnType = "income" | "expense" | "debt_in" | "debt_out";
export interface Txn {
  id: ID;
  type: TxnType;
  amount: number;
  category: string;
  note?: string;
  date: string; // ISO
  personId?: ID;
  tripId?: ID;
  settled?: boolean;
  createdAt: number;
}

export type EventKind = "meeting" | "workout" | "study" | "bill" | "general";
export interface EventItem {
  id: ID;
  title: string;
  start: string; // ISO
  kind: EventKind;
  personId?: ID;
  tripId?: ID;
  location?: string;
  createdAt: number;
}

export interface Milestone { id: ID; title: string; done: boolean; }
export interface Goal {
  id: ID;
  title: string;
  type: "save" | "general";
  targetAmount?: number;
  savedAmount?: number;
  deadline?: string;
  milestones: Milestone[];
  createdAt: number;
}

export interface Habit {
  id: ID;
  title: string;
  schedule: "daily" | "weekdays" | "weekly";
  history: string[]; // YYYY-MM-DD done
  createdAt: number;
}

export interface PackItem { id: ID; label: string; packed: boolean; }
export interface ItineraryItem { id: ID; day: string; title: string; }
export interface Trip {
  id: ID;
  destination: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  packing: PackItem[];
  itinerary: ItineraryItem[];
  peopleIds: ID[];
  createdAt: number;
}

export interface Budget { id: ID; category: string; limit: number; }

export interface Chapter { id: ID; title: string; done: boolean; weak: boolean; }
export interface Subject {
  id: ID;
  name: string;
  examDate?: string;
  chapters: Chapter[];
  createdAt: number;
}

export interface Workout {
  id: ID;
  title: string;
  date: string;
  minutes?: number;
  type?: string;
  createdAt: number;
}

export interface InboxItem {
  id: ID;
  text: string;
  suggestedType?: string;
  processed: boolean;
  createdAt: number;
}

export interface Settings {
  name: string;
  theme: "system" | "light" | "dark";
  pinEnabled: boolean;
  pin: string | null;
  waterGoal: number;
  waterToday: { date: string; count: number };
}

export interface DraftAction {
  id: string;
  type: "task" | "event" | "txn" | "trip" | "goal" | "habit";
  title: string;
  detail: string;
  icon: string;
  sensitive: boolean;
  include: boolean;
  payload: any;
}
