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
  /** Street address for a user-added local spot; null for an admin-added chain.
   *  Only chains (no address) are selectable; local spots appear via "Near me". */
  address?: string | null;
}

/** The food-vendor catalog from the DB. Throws on a non-2xx response. */
export async function fetchFoodVendors(): Promise<FoodVendor[]> {
  const res = await fetch(`${API_BASE}/api/food-vendors`);
  if (!res.ok) throw new Error(`fetchFoodVendors failed: ${res.status} ${res.statusText}`);
  return (await res.json()) as FoodVendor[];
}
