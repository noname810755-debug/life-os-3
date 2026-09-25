import dayjs from "dayjs";
import { useLifeStore } from "@/src/store/useLifeStore";

// Explicitly user-initiated example data (loaded only when the user taps
// "Load example data"). Not auto-seeded — the app starts empty by default.
export function seedDemo() {
  const st = useLifeStore.getState();
  const rahul = st.addPerson({ name: "Rahul", notes: "College friend" });
  const priya = st.addPerson({ name: "Priya", notes: "Sister" });

  st.addTxn({ type: "debt_in", amount: 2000, category: "Debt", personId: rahul.id, note: "Movie tickets" });
  st.addTxn({ type: "debt_out", amount: 800, category: "Debt", personId: priya.id, note: "Lunch" });
  st.addTxn({ type: "expense", amount: 500, category: "Food", note: "Groceries", date: dayjs().toISOString() });
  st.addTxn({ type: "expense", amount: 1200, category: "Transport", note: "Fuel", date: dayjs().subtract(2, "day").toISOString() });
  st.addTxn({ type: "expense", amount: 2500, category: "Shopping", note: "Clothes", date: dayjs().subtract(4, "day").toISOString() });
  st.addTxn({ type: "income", amount: 45000, category: "Income", note: "Salary", date: dayjs().startOf("month").toISOString() });

  st.addTask({ title: "Pay electricity bill", dueDate: dayjs().add(1, "day").toISOString(), priority: "high" });
  st.addTask({ title: "Call Rahul about trip", dueDate: dayjs().toISOString(), personId: rahul.id, priority: "med" });
  st.addTask({ title: "Submit assignment", dueDate: dayjs().add(3, "day").toISOString(), priority: "med" });

  st.addEvent({ title: "Gym", start: dayjs().add(1, "day").hour(7).minute(0).toISOString(), kind: "workout" });
  st.addEvent({ title: "Meet Priya", start: dayjs().add(1, "day").hour(17).toISOString(), kind: "meeting", personId: priya.id });

  const goal = st.addGoal({ title: "Save ₹50,000", type: "save", targetAmount: 50000, savedAmount: 12000, deadline: dayjs().add(3, "month").toISOString() });
  st.addGoal({ title: "Read 5 books", type: "general", milestones: [] });

  st.addHabit({ title: "Drink water", schedule: "daily", history: [dayjs().subtract(1, "day").format("YYYY-MM-DD")] });
  st.addHabit({ title: "Morning walk", schedule: "daily", history: [] });

  const trip = st.addTrip({ destination: "Jaipur", startDate: dayjs().add(6, "day").toISOString(), budget: 6000, peopleIds: [rahul.id] });
  st.addPacking(trip.id, "Clothes");
  st.addPacking(trip.id, "Charger");
  st.addTxn({ type: "expense", amount: 1500, category: "Travel", note: "Train tickets", tripId: trip.id });

  const sub = st.addSubject({ name: "Physics", examDate: dayjs().add(10, "day").toISOString() });
  st.addChapter(sub.id, "Optics");
  st.addChapter(sub.id, "Thermodynamics");

  st.addWorkout({ title: "Chest & Triceps", minutes: 45, type: "Strength", date: dayjs().subtract(1, "day").toISOString() });
}
