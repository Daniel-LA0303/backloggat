export const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const pad = (n: number) => String(n).padStart(2, "0");

export function toISO(d: Date) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "2027-01-31" -> local Date (no UTC shift)
export function parseISO(s: string) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
}

export const todayISO = () => toISO(new Date());

// month is 0-11
export function monthRange(year: number, month: number) {
    return {
        startDate: toISO(new Date(year, month, 1)),
        endDate: toISO(new Date(year, month + 1, 0)), // last day of the month
    };
}

// Monday = 0 ... Sunday = 6. For Sunday-first use: parseISO(s).getDay()
export function weekOffset(s: string) {
    return (parseISO(s).getDay() + 6) % 7;
}

export function formatShort(s: string) {
    return parseISO(s).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function formatRange(start: string, end: string) {
    const y = parseISO(end).getFullYear();
    return `${formatShort(start)} – ${formatShort(end)}, ${y}`;
}

export function formatLong(s: string) {
    return parseISO(s).toLocaleDateString(undefined, {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
}

// SQLite datetime('now') is UTC without a zone
export function parseSQL(s: string) {
  return new Date(s.replace(" ", "T") + "Z");
}

export function timeAgo(s: string) {
  const min = Math.floor(Math.max(0, Date.now() - parseSQL(s).getTime()) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d ago`;
  return parseSQL(s).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}