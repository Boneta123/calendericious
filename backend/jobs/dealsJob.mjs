/**
 * Daily deals refresh. Runs the scraper every morning and (eventually) writes
 * the results to the database. For now there's nowhere to persist and no URL
 * source, so this is wired but a no-op beyond invoking the scraper safely.
 */
import cron from 'node-cron';
import { scrapeSites, scanForDeals } from '../scraper/dealScraper.mjs';

/**
 * Run one deals refresh. Safe to call manually. Guards on a missing API key so
 * it can never crash the server.
 */
export async function runDealsRefresh() {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[dealsJob] OPENAI_API_KEY not set — skipping refresh.');
    return;
  }
  try {
    // TODO: source the restaurant URL list from the DB. Empty for now.
    const urls = [];
    const scraped = await scrapeSites(urls);
    const deals = await scanForDeals(scraped);
    // TODO: persist `deals` when the DB exists.
    console.log(`[dealsJob] refresh complete — ${deals.length} site(s) scanned.`);
  } catch (err) {
    console.error('[dealsJob] refresh failed:', err);
  }
}

/**
 * Schedule the daily refresh. '0 6 * * *' = 06:00 every day.
 * NOTE: node-cron uses the server's local timezone unless configured.
 */
export function startDealsCron() {
  cron.schedule('0 6 * * *', runDealsRefresh);
  console.log('[dealsJob] scheduled daily refresh at 06:00 (server local time).');
}
