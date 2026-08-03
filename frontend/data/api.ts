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
}

/** One deal row as returned by GET /api/deals. */
export interface ApiDeal {
  id: string;
  restaurantId: string;
  title: string;
  description: string;
  category: 'DAY' | 'TIME' | 'LIMITED_TIME';
  /** Weekdays this deal recurs on, 0=Sun..6=Sat. Empty = applies any day. */
  daysOfWeek: number[];
  startTime: string | null; // "HH:MM"
  endTime: string | null; // "HH:MM"
  validThrough: string | null; // ISO date
  requiresRewards: boolean;
  sourceUrl: string | null;
  createdAt: string;
  updatedAt: string;
  restaurant: ApiDealRestaurant;
}

/** Fetch all stored deals. Throws on a non-2xx response. */
export async function fetchDeals(): Promise<ApiDeal[]> {
  const res = await fetch(`${API_BASE}/api/deals`);
  if (!res.ok) {
    throw new Error(`fetchDeals failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as ApiDeal[];
}
