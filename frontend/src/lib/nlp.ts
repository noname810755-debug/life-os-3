import dayjs from "dayjs";
import { uid } from "@/src/lib/id";
import { money } from "@/src/lib/date";
import { DraftAction } from "@/src/store/types";

const WEEKDAYS: Record<string, number> = {
  sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2,
  wednesday: 3, wed: 3, thursday: 4, thu: 4, friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

function parseAmount(text: string): number | undefined {
  const lakh = text.match(/(\d[\d,.]*)\s*(lakh|lac)/i);
  if (lakh) return Math.round(parseFloat(lakh[1].replace(/,/g, "")) * 100000);
  const compact = text.match(/[₹$]?\s*(\d[\d,.]*)\s*(k|thousand)\b/i);
  if (compact) return Math.round(parseFloat(compact[1].replace(/,/g, "")) * 1000);
  const currency = text.match(/[₹$]\s*(\d[\d,]*)/);
  if (currency) return parseInt(currency[1].replace(/,/g, ""), 10);
  const plain = text.match(/\b(\d{2,7})\b/);
  return plain ? parseInt(plain[1], 10) : undefined;
}

function parseWhen(text: string): { date: dayjs.Dayjs; hasTime: boolean } | undefined {
  const value = text.toLowerCase();
  let base = dayjs().startOf("day");
  let matched = false;
  if (/\btoday\b/.test(value)) matched = true;
  else if (/\btomorrow\b/.test(value)) { base = base.add(1, "day"); matched = true; }
  else if (/\bday after tomorrow\b/.test(value)) { base = base.add(2, "day"); matched = true; }
  else if (/\bnext week\b/.test(value)) { base = base.add(7, "day"); matched = true; }
  else {
    for (const [weekday, day] of Object.entries(WEEKDAYS)) {
      if (new RegExp(`\\b${weekday}\\b`).test(value)) {
        let next = dayjs().startOf("day").add(1, "day");
        while (next.day() !== day) next = next.add(1, "day");
        base = next;
        matched = true;
        break;
      }
    }
  }

  const timeMatch = value.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  let hasTime = false;
  if (timeMatch && (timeMatch[3] || /\bat\b|morning|afternoon|evening|night/.test(value))) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    if (timeMatch[3] === "pm" && hour < 12) hour += 12;
    if (timeMatch[3] === "am" && hour === 12) hour = 0;
    if (hour <= 23 && minute <= 59) { base = base.hour(hour).minute(minute); hasTime = true; matched = true; }
  }
  return matched ? { date: base, hasTime } : undefined;
}

function parsePerson(text: string): string | undefined {
  const named = text.match(/(?:with|to|from|call|for)\s+([A-Z][a-z]{2,})\b/);
  if (named) return named[1];
  const candidate = text.match(/\b([A-Z][a-z]{2,})\b/);
  const ignored = new Set(["Today", "Tomorrow", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Jaipur"]);
  return candidate && !ignored.has(candidate[1]) ? candidate[1] : undefined;
}

const CITY = /\b(jaipur|goa|manali|delhi|mumbai|pune|shimla|udaipur|kerala|agra|bangalore|hyderabad|kolkata|chennai|ladakh|kashmir|rishikesh)\b/i;

function classify(clause: string): DraftAction | null {
  const text = clause.trim();
  if (!text) return null;
  const lower = text.toLowerCase();
  const amount = parseAmount(text);
  const when = parseWhen(text);
  const person = parsePerson(text);

  if (/\btrip\b|\btravel\b|\bvisit\b/.test(lower) || (CITY.test(lower) && /plan|book/.test(lower))) {
    const city = text.match(CITY);
    const destination = city ? city[0].charAt(0).toUpperCase() + city[0].slice(1) : person || "Trip";
    return { id: uid("d"), type: "trip", icon: "plane", sensitive: false, include: true, title: `Plan trip to ${destination}`, detail: [when ? when.date.format("DD MMM") : null, amount ? `Budget ${money(amount)}` : null].filter(Boolean).join(" · ") || "New trip", payload: { destination, startDate: when?.date.toISOString(), budget: amount } };
  }

  if (/\b(owe|owes|lend|borrow|repay|loan)\b/.test(lower) && (amount || person)) {
    const incoming = /owe|lend|repay/.test(lower);
    return { id: uid("d"), type: "txn", icon: "wallet", sensitive: true, include: true, title: incoming ? `${person || "Someone"} owes you ${money(amount || 0)}` : `You owe ${person || "someone"} ${money(amount || 0)}`, detail: "Debt · tap to confirm", payload: { txnType: incoming ? "debt_in" : "debt_out", amount: amount || 0, category: "Debt", personName: person, note: text } };
  }

  if (/\b(salary|income|earned|received|paycheck)\b/.test(lower) && amount) {
    return { id: uid("d"), type: "txn", icon: "trending-up", sensitive: true, include: true, title: `Income ${money(amount)}`, detail: "Money in", payload: { txnType: "income", amount, category: "Income", note: text, personName: person } };
  }

  if (/\b(gym|workout|exercise|run|running|yoga|cardio|jogging)\b/.test(lower)) {
    const title = /\bgym\b/.test(lower) ? "Gym session" : "Workout";
    return { id: uid("d"), type: "event", icon: "activity", sensitive: false, include: true, title, detail: when ? when.date.format("DD MMM, h:mm A") : "Fitness", payload: { title, start: (when?.date || dayjs().add(1, "day").hour(7)).toISOString(), kind: "workout" } };
  }

  if (/\b(save|saving|goal|target)\b/.test(lower) && amount) {
    return { id: uid("d"), type: "goal", icon: "target", sensitive: false, include: true, title: `Save ${money(amount)}`, detail: when ? `By ${when.date.format("DD MMM")}` : "Savings goal", payload: { title: `Save ${money(amount)}`, amount, deadline: when?.date.toISOString() } };
  }

  if (/\b(meeting|call|appointment|class|movie|lunch|dinner|party)\b/.test(lower)) {
    const title = person ? `Meet ${person}` : text.length > 40 ? text.slice(0, 40) : text;
    return { id: uid("d"), type: "event", icon: "calendar", sensitive: false, include: true, title, detail: when ? when.date.format("DD MMM, h:mm A") : "Event", payload: { title: person ? `Meet ${person}` : text, start: (when?.date || dayjs().add(1, "day").hour(10)).toISOString(), kind: "meeting", personName: person } };
  }

  if (/\b(spend|spent|bought|paid|bill|purchase|expense)\b/.test(lower) && amount) {
    let category = "General";
    if (/food|restaurant|groceries|lunch|dinner/.test(lower)) category = "Food";
    else if (/fuel|uber|taxi|travel|transport/.test(lower)) category = "Transport";
    else if (/shopping|clothes|amazon|store/.test(lower)) category = "Shopping";
    else if (/bill|recharge|electricity|rent/.test(lower)) category = "Bills";
    return { id: uid("d"), type: "txn", icon: "wallet", sensitive: true, include: true, title: `Expense ${money(amount)}`, detail: category, payload: { txnType: "expense", amount, category, note: text, personName: person } };
  }

  if (amount && !when) return { id: uid("d"), type: "txn", icon: "wallet", sensitive: true, include: true, title: `Expense ${money(amount)}`, detail: "General", payload: { txnType: "expense", amount, category: "General", note: text, personName: person } };

  const cleanTitle = text.replace(/\b(remind me to|reminder|task|add|create)\b/gi, "").trim() || text;
  return { id: uid("d"), type: "task", icon: "check", sensitive: false, include: true, title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1), detail: when ? `Due ${when.date.format("DD MMM")}${when.hasTime ? `, ${when.date.format("h:mm A")}` : ""}` : "Task", payload: { title: cleanTitle, dueDate: when?.date.toISOString(), priority: /urgent|important|priority/.test(lower) ? "high" : "med", personName: person } };
}

export function parseCommand(text: string): DraftAction[] {
  if (!text.trim()) return [];
  const clauses = text.split(/\s+and\s+|[,;]|(?:\.\s+)/i).map((item) => item.trim()).filter(Boolean);
  return (clauses.length ? clauses : [text]).map(classify).filter((item): item is DraftAction => !!item);
}

export const SAMPLE_COMMANDS = [
  "Schedule the gym tomorrow at 7 AM",
  "Rahul owes me ₹2,000",
  "Plan a Sunday trip to Jaipur for ₹6,000",
  "I spent ₹500 on groceries today",
  "Save ₹50,000 in 3 months",
  "Schedule a meeting with Priya tomorrow at 5 PM",
];
