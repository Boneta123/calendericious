/**
 * Birthday helpers. We store a birthday as month + day only (no year), as the
 * string "MM-DD" (e.g. "07-04"). The user enters it as "MM/DD"; deals keyed to a
 * birthday only ever need the month and day.
 */

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// Days per month (Feb allows 29 so leap-year birthdays are valid).
export const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Strip to digits and auto-insert a slash → "MM/DD" (max 5 chars). Sanitizer. */
export function sanitizeBirthdayInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/** Pull [month, day] out of "MM/DD" or "MM-DD"; null if not two numbers. */
function parts(value: string): [number, number] | null {
  const m = value.trim().match(/^(\d{1,2})[/-](\d{1,2})$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2])];
}

/** True when `value` ("MM/DD" or "MM-DD") is a real calendar month + day. */
export function isValidBirthday(value: string): boolean {
  const p = parts(value);
  if (!p) return false;
  const [month, day] = p;
  if (month < 1 || month > 12) return false;
  return day >= 1 && day <= DAYS_IN_MONTH[month - 1];
}

/** "MM/DD" (or "MM-DD") → stored "MM-DD" with zero-padding; "" if invalid. */
export function toStoredBirthday(value: string): string {
  const p = parts(value);
  if (!p) return '';
  const [month, day] = p;
  return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Stored "MM-DD" → "Mon D" (e.g. "Jul 4"); "" for null/invalid. */
export function formatBirthday(stored: string | null | undefined): string {
  if (!stored) return '';
  const p = parts(stored);
  if (!p) return '';
  const [month, day] = p;
  if (month < 1 || month > 12) return '';
  return `${MONTHS[month - 1]} ${day}`;
}
