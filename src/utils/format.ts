const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const d = (iso: string | Date) => (iso instanceof Date ? iso : new Date(iso));

/** "Sat, 14 Nov" */
export function formatDate(iso: string | Date): string {
  const x = d(iso);
  return `${DAYS[x.getDay()]}, ${x.getDate()} ${MONTHS[x.getMonth()]}`;
}

/** "6:00 PM" */
export function formatTime(iso: string | Date): string {
  const x = d(iso);
  const h = x.getHours();
  const m = x.getMinutes();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** "Sat, 14 Nov · 6:00 PM to 11:00 PM" */
export function formatRange(startIso: string, endIso: string): string {
  return `${formatDate(startIso)} · ${formatTime(startIso)} to ${formatTime(endIso)}`;
}

/** Indian digit grouping: 1,50,000 */
export function rupees(n: number): string {
  const s = Math.round(n).toString();
  if (s.length <= 3) return `₹${s}`;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `₹${rest},${last3}`;
}

export function hoursBetween(startIso: string, endIso: string): number {
  return Math.max(0, (new Date(endIso).getTime() - new Date(startIso).getTime()) / 3600000);
}

export function formatHours(h: number): string {
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  return mins ? `${whole}h ${mins}m` : `${whole}h`;
}

/** "3h 20m", "45m", "Starting now" */
export function countdown(msLeft: number): string {
  if (msLeft <= 0) return 'Started';
  const totalMin = Math.floor(msLeft / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${Math.max(mins, 1)}m`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0]![0]! + (parts.length > 1 ? parts[parts.length - 1]![0]! : '')).toUpperCase();
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const x = new Date(date);
  x.setDate(x.getDate() + days);
  return x;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** 0 to 100. Falls with late cancellations and no-shows. */
export function reliabilityScore(lateCancellations: number, noShows: number): number {
  return Math.max(0, 100 - lateCancellations * 5 - noShows * 15);
}
