/**
 * Domain types for DealDay.
 *
 * These mirror the eventual real-world data plan so nothing has to be
 * reshaped when the backend arrives:
 *   user's ZIP -> nearby Branches -> their Chains -> the Chain's Deals
 *
 * Phase 1 (frontend only): everything is populated from a single local
 * mock file. There is intentionally NO service/API layer yet.
 */

/** 0 = Sunday ... 6 = Saturday, matching JS Date.getDay(). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** "HH:MM" in 24-hour time, e.g. "22:00". */
export type ClockTime = string;

export interface Chain {
  id: string;
  name: string;
  /** Emoji used as the brand mark in the vibrant, food-forward UI. */
  emoji: string;
  /** Brand accent (hex) used to tint that chain's coupons. */
  accent: string;
}

export interface Deal {
  id: string;
  chainId: string;
  title: string;
  description: string;
  /** Weekdays this deal recurs on. A single weekday models "Moe Monday". */
  daysOfWeek: Weekday[];
  /**
   * Time window. `null` startTime means all-day / day-specific.
   * When both are set, only that window should be highlighted on the card.
   */
  startTime: ClockTime | null;
  endTime: ClockTime | null;
  /** True when a loyalty/rewards membership is required to redeem. */
  requiresRewards: boolean;
}

export interface Branch {
  id: string;
  chainId: string;
  /** Human-readable branch label, e.g. "Applebee's — Midtown". */
  name: string;
  /** ZIP this branch sits in (stands in for a Places API result). */
  zip: string;
  /** Rough distance in miles from the user's ZIP (mock value). */
  distanceMiles: number;
}

/** A deal resolved for display: the deal joined to its chain + a branch. */
export interface ResolvedDeal {
  deal: Deal;
  chain: Chain;
  branch: Branch;
}
