import dayjs from "dayjs";

export const now = () => dayjs();
export const ymd = (d: dayjs.ConfigType = new Date()) => dayjs(d).format("YYYY-MM-DD");
export const iso = (d: dayjs.ConfigType) => dayjs(d).toISOString();
export const fmtDate = (d: dayjs.ConfigType) => dayjs(d).format("DD MMM");
export const fmtDateFull = (d: dayjs.ConfigType) => dayjs(d).format("DD MMM YYYY");
export const fmtDateTime = (d: dayjs.ConfigType) => dayjs(d).format("DD MMM, h:mm A");
export const fmtTime = (d: dayjs.ConfigType) => dayjs(d).format("h:mm A");
export const fmtDay = (d: dayjs.ConfigType) => dayjs(d).format("ddd");

export const isSameDay = (a: dayjs.ConfigType, b: dayjs.ConfigType) =>
  dayjs(a).isSame(dayjs(b), "day");
export const isToday = (d: dayjs.ConfigType) => isSameDay(d, new Date());
export const daysUntil = (d: dayjs.ConfigType) => dayjs(d).startOf("day").diff(dayjs().startOf("day"), "day");
export const startOfMonth = () => dayjs().startOf("month");
export const inThisMonth = (d: dayjs.ConfigType) => dayjs(d).isSame(dayjs(), "month");
export const relative = (d: dayjs.ConfigType) => {
  const diff = daysUntil(d);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff <= 7) return `In ${diff} days`;
  if (diff < -1 && diff >= -7) return `${-diff} days ago`;
  return fmtDate(d);
};

// Indian number grouping without Intl dependency.
export function money(n: number | undefined | null): string {
  const v = Math.round(Number(n || 0));
  const neg = v < 0;
  let s = Math.abs(v).toString();
  let last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  if (rest) last3 = "," + last3;
  rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return (neg ? "-₹" : "₹") + rest + last3;
}
