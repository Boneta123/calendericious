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

/** "8/2" or "8/2/2026" -> Date (current year if year omitted); null if unparseable. */
function mapValidThrough(validThrough) {
  if (!validThrough || typeof validThrough !== 'string') return null;
  const m = validThrough.trim().match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
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
    startTime: orNull(raw.startTime),
    endTime: orNull(raw.endTime),
    validThrough: mapValidThrough(raw.validThrough),
    requiresRewards: Boolean(raw.requiresRewards),
    sourceUrl: orNull(raw.sourceUrl),
  };
}
