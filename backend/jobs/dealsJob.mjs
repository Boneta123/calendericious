/**
 * Daily deals refresh. Sources the restaurant URL list from the DB, runs the
 * scraper, maps the raw deals, and persists them — replacing each restaurant's
 * deals idempotently so a re-run never duplicates.
 */
import cron from 'node-cron';

import { prisma } from '../db.mjs';
import { scrapeSites, scanForDeals } from '../scraper/dealScraper.mjs';
import { mapDeal } from './mapDeal.mjs';

/** Hostname without protocol (matches the seed's hostOf). */
function hostOf(url) {
  return String(url || '')
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
}

/**
 * Run one deals refresh. Safe to call manually. Guards on a missing API key so
 * it can never crash the server. Persists inside a per-restaurant transaction.
 */
export async function runDealsRefresh() {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[dealsJob] OPENAI_API_KEY not set — skipping refresh.');
    return;
  }

  // Source the URL list from the seeded Restaurant catalog.
  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, url: true, host: true },
  });
  if (restaurants.length === 0) {
    console.warn('[dealsJob] no restaurants seeded — run backend/prisma/seed.mjs first.');
    return;
  }

  // Resolve a scraped site back to a restaurantId by exact url, then by host.
  const byUrl = new Map(restaurants.map((r) => [r.url, r.id]));
  const byHost = new Map(restaurants.map((r) => [r.host, r.id]));
  const resolveId = (siteUrl) =>
    byUrl.get(siteUrl) ?? byHost.get(hostOf(siteUrl)) ?? null;

  try {
    const urls = restaurants.map((r) => r.url);
    const scraped = await scrapeSites(urls);
    const results = await scanForDeals(scraped);

    let totalDeals = 0;
    for (const site of results) {
      const restaurantId = resolveId(site.url);
      if (!restaurantId) {
        console.warn(`[dealsJob] no restaurant match for ${site.url} — skipping.`);
        continue;
      }
      const mapped = (site.deals || [])
        .map((d) => mapDeal(d, restaurantId))
        .filter(Boolean);

      // Replace this restaurant's deals atomically (idempotent refresh).
      await prisma.$transaction([
        prisma.deal.deleteMany({ where: { restaurantId } }),
        ...(mapped.length ? [prisma.deal.createMany({ data: mapped })] : []),
      ]);
      totalDeals += mapped.length;
    }

    const dbTotal = await prisma.deal.count();
    console.log(
      `[dealsJob] refresh complete — ${results.length} site(s) scanned, ${totalDeals} deal(s) stored this run.`,
    );
    console.log(`[dealsJob] TOTAL deals in DB: ${dbTotal}`);
  } catch (err) {
    console.error('[dealsJob] refresh failed:', err);
  }
}

/**
 * Schedule the refresh every 2 days at 06:00 (cron step of 2 on the
 * day-of-month field). ~48h apart; resets at month end (e.g. 30 -> 2).
 * node-cron uses the server's local timezone unless configured.
 */
export function startDealsCron() {
  cron.schedule('0 6 */2 * *', runDealsRefresh);
  console.log('[dealsJob] scheduled refresh every 2 days at 06:00 (server local time).');
}
