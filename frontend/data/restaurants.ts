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
}

/** The restaurant catalog from the DB. Throws on a non-2xx response. */
export async function fetchRestaurants(): Promise<Restaurant[]> {
  const res = await fetch(`${API_BASE}/api/restaurants`);
  if (!res.ok) throw new Error(`fetchRestaurants failed: ${res.status} ${res.statusText}`);
  return (await res.json()) as Restaurant[];
}
