/**
 * Transform a raw scraper deal (from scanForDeals) into a Prisma `Deal` create
 * input for a given restaurantId. Pure + defensive: never throws, returns null
 * for deals we can't safely map (invalid category).
 *
 * Raw shape (backend/scraper/dealScraper.mjs):
 *   { restaurant, dealName, description, category:"day"|"time"|"limited-time",
 *     daysOfWeek:["Mon","Tue"], startTime, endTime, validThrough:"8/2"|null,
 *     requiresRewards, sourceUrl }
 */

/** "day"|"time"|"limited-time" -> DealCategory enum value, or null if invalid. */
const CATEGORY = {
  day: 'DAY',
  time: 'TIME',
  'limited-time': 'LIMITED_TIME',
};

/** Weekday token (first 3 letters) -> JS getDay() index (Sun=0..Sat=6). */
const WEEKDAY = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

/** ["Mon","Tuesday","daily"] -> Int[] (0..6), deduped; unknown tokens dropped. */
function mapDays(daysOfWeek) {
  if (!Array.isArray(daysOfWeek)) return [];
  const out = new Set();
  for (const raw of daysOfWeek) {
    if (typeof raw !== 'string') continue;
    const key = raw.trim().toLowerCase();
    if (key === 'daily' || key === 'everyday' || key === 'every day') {
      for (let d = 0; d <= 6; d++) out.add(d);
      continue;
    }
    const idx = WEEKDAY[key.slice(0, 3)];
    if (idx !== undefined) out.add(idx);
  }
  return [...out].sort((a, b) => a - b);
}

/** "8/2" or "8/2/2026" -> Date (current year if year omitted); null if unparseable.
 *  Used for both validFrom (start) and validThrough (end). */
function parseDate(value) {
  if (!value || typeof value !== 'string') return null;
  const m = value.trim().match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  let year = m[3] ? Number(m[3]) : new Date().getFullYear();
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** null for a non-empty trimmed string, else the trimmed string. */
function orNull(value) {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  return t.length ? t : null;
}

/**
 * Normalize a time to 24-hour "HH:MM" so the app renders it correctly.
 * Accepts "15:00", "3pm", "3 PM", "3:30pm", "11am". Null if unparseable —
 * defensive so a stray value never breaks the window display.
 */
function toHHMM(value) {
  if (typeof value !== 'string') return null;
  const s = value.trim().toLowerCase();
  if (!s) return null;

  // Already 24-hour "H:MM" / "HH:MM".
  let m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m) {
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h > 23 || min > 59) return null;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  // 12-hour with am/pm: "3pm", "3 pm", "3:30pm", "11am".
  m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])m?\.?$/);
  if (m) {
    let h = Number(m[1]);
    const min = m[2] ? Number(m[2]) : 0;
    const pm = m[3] === 'p';
    if (h < 1 || h > 12 || min > 59) return null;
    if (pm && h !== 12) h += 12;
    if (!pm && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  return null; // bare hour or free text — ambiguous, leave unset
}

/**
 * @returns Prisma Deal create input, or null if the deal can't be mapped.
 */
export function mapDeal(raw, restaurantId) {
  if (!raw || typeof raw !== 'object') return null;
  const category = CATEGORY[String(raw.category || '').toLowerCase()];
  if (!category) return null; // invalid/absent category -> skip

  return {
    restaurantId,
    title: orNull(raw.dealName) || '(untitled deal)',
    description: orNull(raw.description) || '',
    category,
    daysOfWeek: mapDays(raw.daysOfWeek),
    startTime: toHHMM(raw.startTime),
    endTime: toHHMM(raw.endTime),
    validFrom: parseDate(raw.validFrom),
    validThrough: parseDate(raw.validThrough),
    requiresRewards: Boolean(raw.requiresRewards),
    onlineOrderOnly: Boolean(raw.onlineOrderOnly),
    sourceUrl: orNull(raw.sourceUrl),
  };
}
