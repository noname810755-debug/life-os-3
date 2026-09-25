import dayjs from "dayjs";
import { uid } from "@/src/lib/id";
import { money } from "@/src/lib/date";
import { DraftAction } from "@/src/store/types";

const WEEKDAYS: Record<string, number> = {
  sunday: 0, sun: 0, ravivar: 0, monday: 1, mon: 1, somvar: 1, tuesday: 2, tue: 2, mangalwar: 2,
  wednesday: 3, wed: 3, budhwar: 3, thursday: 4, thu: 4, guruwar: 4, friday: 5, fri: 5, shukrawar: 5,
  saturday: 6, sat: 6, shanivar: 6,
};

function parseAmount(text: string): number | undefined {
  // ₹2,000 | 2000 | 2k | 6 hazaar | 2 lakh
  const lakh = text.match(/(\d[\d,.]*)\s*(lakh|lac)/i);
  if (lakh) return Math.round(parseFloat(lakh[1].replace(/,/g, "")) * 100000);
  const k = text.match(/₹?\s*(\d[\d,.]*)\s*(k|hazaar|hazar|thousand)\b/i);
  if (k) return Math.round(parseFloat(k[1].replace(/,/g, "")) * 1000);
  const rupee = text.match(/₹\s*(\d[\d,]*)/);
  if (rupee) return parseInt(rupee[1].replace(/,/g, ""), 10);
  const rs = text.match(/(?:rs\.?|inr)\s*(\d[\d,]*)/i);
  if (rs) return parseInt(rs[1].replace(/,/g, ""), 10);
  const plain = text.match(/\b(\d{2,7})\b/);
  if (plain) return parseInt(plain[1], 10);
  return undefined;
}

function parseWhen(text: string): { date: dayjs.Dayjs; hasTime: boolean } | undefined {
  const t = text.toLowerCase();
  let base = dayjs().startOf("day");
  let matched = false;

  if (/\baaj\b|\btoday\b/.test(t)) { matched = true; }
  else if (/\bkal\b|\btomorrow\b/.test(t)) { base = base.add(1, "day"); matched = true; }
  else if (/\bparso\b|\bparson\b/.test(t)) { base = base.add(2, "day"); matched = true; }
  else if (/next week|agle hafte/.test(t)) { base = base.add(7, "day"); matched = true; }
  else {
    for (const [w, dow] of Object.entries(WEEKDAYS)) {
      if (new RegExp(`\\b${w}\\b`).test(t)) {
        let d = dayjs().startOf("day");
        while (d.day() !== dow || d.isSame(dayjs().startOf("day"))) d = d.add(1, "day");
        base = d; matched = true; break;
      }
    }
  }

  // time: "7 baje", "7pm", "7:30", "subah 8", "shaam 7"
  let hasTime = false;
  const timeM = t.match(/(\d{1,2})(?::(\d{2}))?\s*(baje|bje|am|pm)?/);
  if (timeM && (timeM[3] || /baje|bje|subah|shaam|raat|morning|evening|night|dopahar/.test(t))) {
    let hr = parseInt(timeM[1], 10);
    const min = timeM[2] ? parseInt(timeM[2], 10) : 0;
    const pm = /pm|shaam|raat|evening|night/.test(t);
    const am = /am|subah|morning/.test(t);
    if (pm && hr < 12) hr += 12;
    if (am && hr === 12) hr = 0;
    if (hr >= 0 && hr <= 23) { base = base.hour(hr).minute(min); hasTime = true; matched = true; }
  }
  if (!matched) return undefined;
  return { date: base, hasTime };
}

function parsePerson(text: string): string | undefined {
  // name before se/ko/ke, or a capitalized token
  const m = text.match(/([A-Z][a-z]+|[A-Z]{2,})\s+(?:se|ko|ke|ka|ki)\b/);
  if (m) return m[1];
  const cap = text.match(/\b([A-Z][a-z]{2,})\b/);
  const skip = new Set(["Kal", "Aaj", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Jaipur"]);
  if (cap && !skip.has(cap[1])) return cap[1];
  return undefined;
}

const CITY = /\b(jaipur|goa|manali|delhi|mumbai|pune|shimla|udaipur|kerala|agra|bangalore|hyderabad|kolkata|chennai|ladakh|kashmir|rishikesh)\b/i;

function classify(clause: string): DraftAction | null {
  const t = clause.trim();
  if (!t) return null;
  const low = t.toLowerCase();
  const amount = parseAmount(t);
  const when = parseWhen(t);
  const person = parsePerson(t);

  // TRIP
  if (/\btrip\b|ghumne|jaana|jaunga|jayenge|visit/.test(low) || (CITY.test(low) && /plan|trip/.test(low))) {
    const city = t.match(CITY);
    const destination = city ? city[0].charAt(0).toUpperCase() + city[0].slice(1) : (person || "Trip");
    return {
      id: uid("d"), type: "trip", icon: "plane", sensitive: false, include: true,
      title: `Plan trip to ${destination}`,
      detail: [when ? when.date.format("DD MMM") : null, amount ? `Budget ${money(amount)}` : null].filter(Boolean).join(" · ") || "New trip",
      payload: { destination, startDate: when?.date.toISOString(), budget: amount },
    };
  }

  // DEBT
  if (/\ble(ne|na|ni)\b|\bde(ne|na|ni)\b|udhaar|udhar|owe|wapas|return krna|lene hain|dene hain/.test(low) && (amount || person)) {
    const income = /le(ne|na|ni)|lene hain|milne|wapas/.test(low);
    return {
      id: uid("d"), type: "txn", icon: "wallet", sensitive: true, include: true,
      title: income ? `${person || "Someone"} owes you ${money(amount || 0)}` : `You owe ${person || "someone"} ${money(amount || 0)}`,
      detail: "Debt · tap to confirm",
      payload: { txnType: income ? "debt_in" : "debt_out", amount: amount || 0, category: "Debt", personName: person, note: t },
    };
  }

  // INCOME
  if (/salary|income|mile|mila|kamaye|earned|received|received hua|aaye/.test(low) && amount) {
    return {
      id: uid("d"), type: "txn", icon: "trending-up", sensitive: true, include: true,
      title: `Income ${money(amount)}`, detail: "Money in",
      payload: { txnType: "income", amount, category: "Income", note: t, personName: person },
    };
  }

  // WORKOUT / GYM
  if (/gym|workout|exercise|run|running|yoga|cardio|jogging/.test(low)) {
    return {
      id: uid("d"), type: "event", icon: "activity", sensitive: false, include: true,
      title: /gym/.test(low) ? "Gym session" : "Workout",
      detail: when ? when.date.format("DD MMM, h:mm A") : "Fitness",
      payload: { title: /gym/.test(low) ? "Gym" : "Workout", start: (when?.date || dayjs().add(1, "day").hour(7)).toISOString(), kind: "workout" },
    };
  }

  // GOAL (save)
  if (/save karna|bachana|bachani|savings|goal|target/.test(low) && amount) {
    return {
      id: uid("d"), type: "goal", icon: "target", sensitive: false, include: true,
      title: `Save ${money(amount)}`,
      detail: when ? `by ${when.date.format("DD MMM")}` : "Savings goal",
      payload: { title: `Save ${money(amount)}`, amount, deadline: when?.date.toISOString() },
    };
  }

  // MEETING / EVENT
  if (/meeting|milna|milne|call|appointment|class|movie|lunch|dinner|party/.test(low)) {
    return {
      id: uid("d"), type: "event", icon: "calendar", sensitive: false, include: true,
      title: person ? `Meet ${person}` : (t.length > 40 ? t.slice(0, 40) : t),
      detail: when ? when.date.format("DD MMM, h:mm A") : "Event",
      payload: { title: person ? `Meet ${person}` : t, start: (when?.date || dayjs().add(1, "day").hour(10)).toISOString(), kind: "meeting", personName: person },
    };
  }

  // EXPENSE
  if (/kharch|kharcha|spent|spend|kharide|bought|paid|diye|bill|de diye/.test(low) && amount) {
    let category = "General";
    if (/khana|food|restaurant|swiggy|zomato|lunch|dinner/.test(low)) category = "Food";
    else if (/petrol|fuel|uber|ola|cab|taxi|travel/.test(low)) category = "Transport";
    else if (/shopping|kapde|clothes|amazon|flipkart/.test(low)) category = "Shopping";
    else if (/bill|recharge|electricity|rent/.test(low)) category = "Bills";
    return {
      id: uid("d"), type: "txn", icon: "wallet", sensitive: true, include: true,
      title: `Expense ${money(amount)}`, detail: category,
      payload: { txnType: "expense", amount, category, note: t, personName: person },
    };
  }

  // Standalone amount => expense (best guess)
  if (amount && !when) {
    return {
      id: uid("d"), type: "txn", icon: "wallet", sensitive: true, include: true,
      title: `Expense ${money(amount)}`, detail: "General",
      payload: { txnType: "expense", amount, category: "General", note: t, personName: person },
    };
  }

  // TASK / REMINDER (default)
  const cleanTitle = t.replace(/\b(yaad dila|remind me to|reminder|karna hai|task)\b/gi, "").trim() || t;
  return {
    id: uid("d"), type: "task", icon: "check", sensitive: false, include: true,
    title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
    detail: when ? `Due ${when.date.format("DD MMM")}${when.hasTime ? ", " + when.date.format("h:mm A") : ""}` : "Task",
    payload: { title: cleanTitle, dueDate: when?.date.toISOString(), priority: /urgent|important|zaroori/.test(low) ? "high" : "med", personName: person },
  };
}

export function parseCommand(text: string): DraftAction[] {
  if (!text.trim()) return [];
  // split on separators but keep clauses meaningful
  const clauses = text
    .split(/\s+aur\s+|\s+and\s+|\s+phir\s+|[,;]|(?:\.\s+)/i)
    .map((c) => c.trim())
    .filter(Boolean);
  const list = clauses.length ? clauses : [text];
  const actions: DraftAction[] = [];
  for (const c of list) {
    const a = classify(c);
    if (a) actions.push(a);
  }
  return actions;
}

export const SAMPLE_COMMANDS = [
  "Kal 7 baje gym",
  "Rahul se ₹2,000 lene hain",
  "Sunday Jaipur trip ₹6,000 mein plan kar",
  "Aaj grocery ₹500 kharch kiye",
  "3 months mein ₹50,000 save karna hai",
  "Kal 5 baje Priya se meeting",
];
