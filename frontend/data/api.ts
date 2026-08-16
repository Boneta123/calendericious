/**
 * Backend API client (deals). Replaces the old local mock data — the calendar
 * and day-detail screens now read live deals from the Express/Prisma backend.
 *
 * The base URL is resolved automatically so it works everywhere WITHOUT edits:
 *   - Physical phone (Expo Go) / Android emulator / iOS simulator → uses the
 *     same host the Expo dev server is served from (your Mac's LAN IP), so the
 *     phone reaches your machine on the LAN.
 *   - Set EXPO_PUBLIC_API_URL to override (e.g. a deployed backend).
 *
 * The backend must be reachable on port API_PORT from the device (same Wi-Fi;
 * allow incoming connections if macOS firewall prompts). Deals are empty until
 * the backend is refreshed (`npm run server` + `npm run refresh`).
 */
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// --- Session token (kept in the device keychain via SecureStore) ------------
const TOKEN_KEY = 'sessionToken';
let authToken: string | null = null;

async function persistToken(token: string) {
  authToken = token;
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    /* keychain unavailable — token still works for this session */
  }
}
async function clearToken() {
  authToken = null;
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

const API_PORT = 4000;

/** Derive the dev machine's host (LAN IP) from whatever Expo exposes. */
function devHost(): string | null {
  const c = Constants as unknown as {
    expoConfig?: { hostUri?: string };
    expoGoConfig?: { debuggerHost?: string };
    manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
    manifest?: { debuggerHost?: string; hostUri?: string };
  };
  const hostUri =
    c.expoConfig?.hostUri ||
    c.expoGoConfig?.debuggerHost ||
    c.manifest2?.extra?.expoGo?.debuggerHost ||
    c.manifest?.debuggerHost ||
    c.manifest?.hostUri ||
    '';
  // hostUri looks like "192.168.1.23:8081" — keep just the host.
  const host = hostUri.split('://').pop()?.split(':')[0] ?? '';
  return host && host !== 'localhost' ? host : null;
}

function resolveApiBase(): string {
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override) return override.replace(/\/+$/, '');
  const host = devHost();
  return `http://${host ?? 'localhost'}:${API_PORT}`;
}

export const API_BASE = resolveApiBase();

/** The restaurant shape joined into each deal by GET /api/deals. */
export interface ApiDealRestaurant {
  id: string;
  name: string;
  logoUrl: string;
  /** Street address for a specific local place; null for an admin-seeded chain.
   *  Drives the "Near me" filter (chains have none and always show). Optional
   *  because some payloads (e.g. createDeal) omit it. */
  address?: string | null;
}

/** One deal row as returned by GET /api/deals. A deal belongs to a restaurant
 *  OR a food vendor (exactly one is non-null). */
export interface ApiDeal {
  id: string;
  restaurantId: string | null;
  foodVendorId: string | null;
  title: string;
  description: string;
  category: 'DAY' | 'TIME' | 'LIMITED_TIME' | 'BIRTHDAY';
  /** Weekdays this deal recurs on, 0=Sun..6=Sat. Empty = applies any day. */
  daysOfWeek: number[];
  startTime: string | null; // "HH:MM"
  endTime: string | null; // "HH:MM"
  validFrom: string | null; // ISO date — start of a dated/limited promo
  validThrough: string | null; // ISO date — end of a dated/limited promo
  requiresRewards: boolean;
  onlineOrderOnly: boolean; // redeemable only via online/app/promo-code order
  /** BIRTHDAY deals only: how wide around the user's birthday it shows. */
  birthdayWindow: 'DAY' | 'WEEK' | 'MONTH' | null;
  foundBy: string | null; // display name of who found it; null for scraped
  foundByUserId: string | null; // the creator's user id (tap → their public profile); null for scraped
  likes: number;
  dislikes: number;
  sourceUrl: string | null;
  createdAt: string;
  updatedAt: string;
  restaurant: ApiDealRestaurant | null;
  foodVendor: ApiDealRestaurant | null;
}

/** The owner (restaurant or food vendor) of a deal, for logo + name rendering. */
export function dealVendor(deal: ApiDeal): ApiDealRestaurant {
  return deal.restaurant ?? deal.foodVendor ?? { id: '', name: 'Unknown', logoUrl: '' };
}

/** Fetch stored deals. With a userId, only that user's chosen restaurants'
 *  deals are returned. Throws on a non-2xx response. */
export async function fetchDeals(userId?: string): Promise<ApiDeal[]> {
  const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const res = await fetch(`${API_BASE}/api/deals${qs}`);
  if (!res.ok) {
    throw new Error(`fetchDeals failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as ApiDeal[];
}

/** A user's public profile — safe fields only + the deals they created. */
export interface PublicProfile {
  id: string;
  displayName: string;
  profilePhoto: string | null;
  dealCount: number;
  deals: ApiDeal[];
}

/** Fetch another user's public profile (photo, name, deal count, their deals). */
export function fetchUserProfile(id: string): Promise<PublicProfile> {
  return sendJson<PublicProfile>(`/api/users/${id}/public`, 'GET');
}

// --- Place autocomplete (via the backend proxy → LocationIQ) ---------------

/** One suggestion: `primary` = place/name, `secondary` = full formatted address. */
export interface PlaceSuggestion {
  placeId: string;
  primary: string;
  secondary: string;
}

/** Food-POI suggestions of `kind` ('restaurant' | 'food'), biased to `coords`
 *  when given. Each result already carries the full address in `secondary`. */
export function placesAutocomplete(
  input: string,
  coords?: { lat: number; lng: number },
  kind: 'restaurant' | 'food' = 'restaurant',
): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({ input, type: kind });
  if (coords) {
    params.set('lat', String(coords.lat));
    params.set('lng', String(coords.lng));
  }
  return sendJson<PlaceSuggestion[]>(`/api/places/autocomplete?${params.toString()}`, 'GET');
}

// --- Crowdsourcing submissions (persist to the DB) -------------------------

/** Create/submit a restaurant (any logged-in user). Returns the saved row. */
export function createRestaurant(input: {
  name: string;
  url: string;
  address: string;
  logoUrl: string;
}): Promise<ApiDealRestaurant> {
  return sendJson<ApiDealRestaurant>('/api/restaurants', 'POST', input);
}

/** Create/submit a food vendor (any logged-in user). Returns the saved row. */
export function createFoodVendor(input: {
  name: string;
  url: string;
  address: string;
  logoUrl: string;
}): Promise<ApiDealRestaurant> {
  return sendJson<ApiDealRestaurant>('/api/food-vendors', 'POST', input);
}

/** Create/submit a deal (any logged-in user). The server stamps the creator. */
export function createDeal(input: {
  restaurantId: string;
  title: string;
  description: string;
  category: 'DAY' | 'TIME' | 'LIMITED_TIME' | 'BIRTHDAY';
  daysOfWeek: number[];
  startTime: string | null;
  endTime: string | null;
  validFrom: string | null;
  validThrough: string | null;
  birthdayWindow: 'DAY' | 'WEEK' | 'MONTH' | null;
  requiresRewards: boolean;
  onlineOrderOnly: boolean;
  sourceUrl: string | null;
}): Promise<ApiDeal> {
  return sendJson<ApiDeal>('/api/deals', 'POST', input);
}

/** Like a deal — increments the counter; returns the new totals. */
export function likeDeal(id: string): Promise<{ likes: number; dislikes: number }> {
  return sendJson<{ likes: number; dislikes: number }>(`/api/deals/${id}/like`, 'POST', {});
}
/** Dislike a deal — increments the counter; returns the new totals. */
export function dislikeDeal(id: string): Promise<{ likes: number; dislikes: number }> {
  return sendJson<{ likes: number; dislikes: number }>(`/api/deals/${id}/dislike`, 'POST', {});
}

// --- Auth ------------------------------------------------------------------

/** The logged-in user as returned by the API (never includes the password). */
export interface AuthUser {
  id: string;
  displayName: string;
  email: string;
  birthday: string | null; // "MM-DD" month+day of the user's birthday
  profilePhoto: string | null;
  restaurantIds: string[];
}

/** POST/PUT JSON helper — throws an Error carrying the server's `error` on non-2xx. */
async function sendJson<T>(path: string, method: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const init: RequestInit = { method, headers };
  if (method !== 'GET' && body !== undefined) init.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data && (data as { error?: string }).error) || `Request failed (${res.status})`);
  }
  return data as T;
}

/** Create an account. Email is the login identity; displayName is shown. */
type AuthResponse = AuthUser & { token: string };

export async function createAccount(input: {
  displayName: string;
  email: string;
  password: string;
  birthday: string;
}): Promise<AuthUser> {
  const data = await sendJson<AuthResponse>('/api/users', 'POST', input);
  await persistToken(data.token);
  return data;
}

/** Log in with email + password; stores the session token. */
export async function login(input: { email: string; password: string }): Promise<AuthUser> {
  const data = await sendJson<AuthResponse>('/api/auth/login', 'POST', input);
  await persistToken(data.token);
  return data;
}

/** Log out — revoke the session server-side and clear the local token. */
export async function logout(): Promise<void> {
  try {
    await sendJson('/api/auth/logout', 'POST', {});
  } catch {
    /* revoke best-effort; still clear locally */
  }
  await clearToken();
}

/** Restore a saved session on app launch (token → current user), or null. */
export async function restoreSession(): Promise<AuthUser | null> {
  let token: string | null = null;
  try {
    token = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    token = null;
  }
  if (!token) return null;
  authToken = token;
  try {
    return await sendJson<AuthUser>('/api/auth/me', 'GET');
  } catch {
    await clearToken(); // token invalid/expired
    return null;
  }
}

/** Request a password-reset code by email. Always resolves (generic response). */
export function forgotPassword(email: string): Promise<{ ok: boolean }> {
  return sendJson<{ ok: boolean }>('/api/auth/forgot-password', 'POST', { email });
}

/** Reset the password using the emailed code. Throws on invalid/expired code. */
export function resetPassword(input: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<{ ok: boolean }> {
  return sendJson<{ ok: boolean }>('/api/auth/reset-password', 'POST', input);
}

/** Save the user's profile photo (a compressed base64 data URI). */
export function saveProfilePhoto(
  userId: string,
  photo: string,
): Promise<{ profilePhoto: string | null }> {
  return sendJson<{ profilePhoto: string | null }>(
    `/api/users/${userId}/photo`,
    'POST',
    { photo },
  );
}

/** Persist the user's birthday ("MM-DD"); returns the saved value. */
export function saveBirthday(userId: string, birthday: string): Promise<{ birthday: string }> {
  return sendJson<{ birthday: string }>(`/api/users/${userId}/birthday`, 'PUT', { birthday });
}

/** Persist the user's chosen restaurants; returns the saved ids. */
export function saveRestaurants(
  userId: string,
  restaurantIds: string[],
): Promise<{ restaurantIds: string[] }> {
  return sendJson<{ restaurantIds: string[] }>(
    `/api/users/${userId}/restaurants`,
    'PUT',
    { restaurantIds },
  );
}

/** Strip a Date/ISO string to local midnight (calendar-day comparison, no TZ drift). */
function dayOnly(value: Date | string): Date {
  const d = typeof value === 'string' ? new Date(value) : value;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Whether a deal should appear on a given calendar date — the SINGLE source of
 * truth for both the calendar dots and the day-detail list. Compares by
 * calendar day only. Rules:
 *   - never in the past (today/future only)
 *   - never before validFrom, never after validThrough (a 9/16–9/20 run shows
 *     ONLY 9/16–9/20 — no days before it starts)
 *   - if daysOfWeek is set, the date's weekday must match (within any window)
 *   - empty daysOfWeek → the deal is ongoing and shows every day (within any
 *     validFrom/validThrough window). This surfaces member/app/online and other
 *     evergreen deals that have no specific day/time.
 *   - BIRTHDAY deals show ONLY within their window around the user's birthday
 *     ("MM-DD"): DAY = the birthday itself, WEEK = ±3 days, MONTH = the whole
 *     birthday month. Nothing shows if the user has no birthday set.
 */
export function dealShowsOnDate(deal: ApiDeal, date: Date, birthday?: string | null): boolean {
  const d = dayOnly(date);
  const today = dayOnly(new Date());
  if (d < today) return false;

  if (deal.category === 'BIRTHDAY') {
    if (!birthday) return false; // no birthday on file → never
    const [mm, dd] = birthday.split('-').map(Number);
    if (!mm || !dd) return false;
    const window = deal.birthdayWindow ?? 'DAY';
    if (window === 'MONTH') return d.getMonth() === mm - 1;
    const bday = new Date(d.getFullYear(), mm - 1, dd);
    if (window === 'WEEK') {
      const diffDays = Math.abs(d.getTime() - dayOnly(bday).getTime()) / 86400000;
      return diffDays <= 3; // ±3 days = the birthday week
    }
    return d.getTime() === dayOnly(bday).getTime(); // DAY
  }

  if (deal.validFrom && d < dayOnly(deal.validFrom)) return false;
  if (deal.validThrough && d > dayOnly(deal.validThrough)) return false;

  if (deal.daysOfWeek.length > 0) return deal.daysOfWeek.includes(d.getDay());
  return true; // no weekday specified → ongoing, shows every day (window-gated above)
}
