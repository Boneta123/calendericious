/**
 * Restaurant catalog — now CROWDSOURCED and served from the DB (no static JSON,
 * no scraper). Fetched from `GET /api/restaurants`. Empty until users submit
 * restaurants.
 */

import { API_BASE } from './api';

export interface Restaurant {
  id: string;
  name: string;
  url: string;
  host: string;
  logoUrl: string;
  /** Street address for a user-added local spot; null for an admin-added chain.
   *  Only chains (no address) are selectable; local spots appear via "Near me". */
  address?: string | null;
}

/** The restaurant catalog from the DB. Throws on a non-2xx response. */
export async function fetchRestaurants(): Promise<Restaurant[]> {
  const res = await fetch(`${API_BASE}/api/restaurants`);
  if (!res.ok) throw new Error(`fetchRestaurants failed: ${res.status} ${res.statusText}`);
  return (await res.json()) as Restaurant[];
}
