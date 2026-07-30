/** Small date helpers for the calendar. No external date library. */

export const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const WEEKDAY_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * 14 dates covering the current week + next week, starting at the Sunday of
 * the week that contains `from`. No previous days are included.
 */
export function buildTwoWeekGrid(from: Date): Date[] {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate() - from.getDay());
  const days: Date[] = [];
  for (let i = 0; i < 14; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  return days;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Serialize a date as "YYYY-MM-DD" for use as a route param. */
export function toDateKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Parse a "YYYY-MM-DD" route param back into a local Date. */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** "Monday, July 28" style label for the day-detail header. */
export function formatLongDate(date: Date): string {
  return `${WEEKDAY_FULL[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

/** Convert "HH:MM" (24h) to a friendly "10:00 PM". */
export function formatClock(time: string): string {
  const [hStr, mStr] = time.split(':');
  let h = Number(hStr);
  const m = mStr ?? '00';
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${suffix}`;
}
