/**
 * Backend API client (deals). Replaces the old local mock data — the calendar
 * and day-detail screens now read live deals from the Express/Prisma backend.
 *
 * NOTE: the base URL differs by run target:
 *   - iOS simulator .......... http://localhost:4000
 *   - Android emulator ....... http://10.0.2.2:4000
 *   - Physical phone (Expo Go) http://<your-Mac-LAN-IP>:4000
 * Change API_BASE for your target. Deals are empty until the backend has been
 * refreshed (`npm run server` + `npm run refresh`).
 */
export const API_BASE = 'http://localhost:4000';

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
