/**
 * Shared domain types.
 *
 * Deal/restaurant shapes now live with the API client (`data/api.ts`), which
 * mirrors the backend (Prisma) response. This file keeps only the small
 * calendar primitive still used across components.
 */

/** 0 = Sunday ... 6 = Saturday, matching JS Date.getDay(). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
