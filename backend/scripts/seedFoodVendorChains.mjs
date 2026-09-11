/**
 * Seed additional GLOBAL (admin, non-crowdsourced) food-vendor chains — national
 * or large-regional US brands with 50+ locations. These are "chains": name + url
 * only, NO address / lat / lng (so they show regardless of the "Near me" filter)
 * and NO submittedByUserId (not counted against any user's daily cap).
 *
 * Idempotent: `createMany({ skipDuplicates:true })` skips any brand whose slug id
 * OR website url already exists, so re-running is safe.
 *
 * Run:  node --env-file=.env backend/scripts/seedFoodVendorChains.mjs
 */
import { prisma } from '../db.mjs';
import { slugOf, hostOf, faviconFor } from '../routes/restaurants.mjs';

// [name, website] — every entry is a US chain with 50+ locations, mostly
// supermarket/grocery banners missing from the existing catalog, plus a few
// large regional convenience chains.
const CHAINS = [
  // Supermarkets / grocery
  ['Wegmans', 'https://www.wegmans.com'],
  ['ShopRite', 'https://www.shoprite.com'],
  ['Hy-Vee', 'https://www.hy-vee.com'],
  ['WinCo Foods', 'https://www.wincofoods.com'],
  ['Harris Teeter', 'https://www.harristeeter.com'],
  ['Hannaford', 'https://www.hannaford.com'],
  ['Weis Markets', 'https://www.weismarkets.com'],
  ['Tops Friendly Markets', 'https://www.topsmarkets.com'],
  ['Price Chopper', 'https://www.pricechopper.com'],
  ['Stater Bros', 'https://www.staterbros.com'],
  ['Save Mart', 'https://www.savemart.com'],
  ["Raley's", 'https://www.raleys.com'],
  ['Ingles Markets', 'https://www.ingles-markets.com'],
  ['Schnucks', 'https://www.schnucks.com'],
  ['Giant Food', 'https://giantfood.com'],
  ['Acme Markets', 'https://www.acmemarkets.com'],
  ["Shaw's", 'https://www.shaws.com'],
  ['Jewel-Osco', 'https://www.jewelosco.com'],
  ['Fred Meyer', 'https://www.fredmeyer.com'],
  ['Ralphs', 'https://www.ralphs.com'],
  ['King Soopers', 'https://www.kingsoopers.com'],
  ["Smith's Food and Drug", 'https://www.smithsfoodanddrug.com'],
  ["Fry's Food Stores", 'https://www.frysfood.com'],
  ['Food City', 'https://www.foodcity.com'],
  ['Market Basket', 'https://www.shopmarketbasket.com'],
  ['The Fresh Market', 'https://www.thefreshmarket.com'],
  ['Natural Grocers', 'https://www.naturalgrocers.com'],
  ['Fresh Thyme Market', 'https://www.freshthyme.com'],
  ["Brookshire's", 'https://www.brookshires.com'],
  ['Cub Foods', 'https://www.cub.com'],
  ["Lowe's Foods", 'https://www.lowesfoods.com'],
  ['H Mart', 'https://www.hmart.com'],
  ['99 Ranch Market', 'https://www.99ranch.com'],
  // Large regional convenience
  ['Royal Farms', 'https://www.royalfarms.com'],
  ["Stewart's Shops", 'https://www.stewartsshops.com'],
  ['Turkey Hill', 'https://www.turkeyhill.com'],
  ['GetGo', 'https://www.getgocafe.com'],
  ['QuickChek', 'https://www.quickchek.com'],
  ["Rutter's", 'https://www.rutters.com'],
  ["Allsup's", 'https://www.allsups.com'],
];

const rows = CHAINS.map(([name, url]) => {
  const host = hostOf(url);
  return { id: slugOf(name), name, url, host, logoUrl: faviconFor(host) };
});

const result = await prisma.foodVendor.createMany({ data: rows, skipDuplicates: true });
console.log(`Attempted ${rows.length} chains → inserted ${result.count}, skipped ${rows.length - result.count} (already existed).`);
await prisma.$disconnect();
