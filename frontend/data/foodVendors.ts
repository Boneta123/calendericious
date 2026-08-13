/**
 * Food-vendor catalog — CROWDSOURCED, served from the DB (no static JSON).
 * Fetched from `GET /api/food-vendors`. Empty until users submit vendors.
 */

import { API_BASE } from './api';

export interface FoodVendor {
  id: string;
  name: string;
  url: string;
  host: string;
  logoUrl: string;
}

/** The food-vendor catalog from the DB. Throws on a non-2xx response. */
export async function fetchFoodVendors(): Promise<FoodVendor[]> {
  const res = await fetch(`${API_BASE}/api/food-vendors`);
  if (!res.ok) throw new Error(`fetchFoodVendors failed: ${res.status} ${res.statusText}`);
  return (await res.json()) as FoodVendor[];
}
