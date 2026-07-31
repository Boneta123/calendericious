/**
 * App-side restaurant catalog — the selectable options for the picker.
 *
 * This MIRRORS the scraper's SITES list (scraper/dealScraper.mjs). The app
 * can't import from the scraper (separate batch module), so keep these in sync
 * by hand when SITES changes. // TODO: backend — serve this list from the API.
 *
 * Logos are pulled from Google's favicon service by domain (no backend, no
 * key): https://www.google.com/s2/favicons?domain=<host>&sz=128
 */

export interface Restaurant {
  id: string;
  name: string;
  url: string;
  host: string;
  logoUrl: string;
}

/** [displayName, url] pairs, mirroring scraper SITES order. */
const RAW: [string, string][] = [
  ["Wendy's", 'https://www.wendys.com'],
  ['Chipotle', 'https://www.chipotle.com'],
  ["Papa John's", 'https://www.papajohns.com'],
  ['Subway', 'https://www.subway.com'],
  ["Jersey Mike's", 'https://www.jerseymikes.com'],
  ['Chick-fil-A', 'https://www.chick-fil-a.com'],
  ['Buffalo Wild Wings', 'https://www.buffalowildwings.com'],
  ["Arby's", 'https://www.arbys.com'],
  ['Sonic', 'https://www.sonicdrivein.com'],
  ["Carl's Jr.", 'https://www.carlsjr.com'],
  ["Hardee's", 'https://www.hardees.com'],
  ['Del Taco', 'https://www.deltaco.com'],
  ['Qdoba', 'https://www.qdoba.com'],
  ['Panda Express', 'https://www.pandaexpress.com'],
  ["Dunkin'", 'https://www.dunkindonuts.com'],
  ['Starbucks', 'https://www.starbucks.com'],
  ['Five Guys', 'https://www.fiveguys.com'],
  ["Chili's", 'https://www.chilis.com'],
  ["Applebee's", 'https://www.applebees.com'],
  ['Olive Garden', 'https://www.olivegarden.com'],
  ["Denny's", 'https://www.dennys.com'],
  ['IHOP', 'https://www.ihop.com'],
  ['Outback Steakhouse', 'https://www.outback.com'],
  ['Pizza Hut', 'https://www.pizzahut.com'],
  ['Burger King', 'https://www.bk.com'],
  ["Domino's", 'https://www.dominos.com'],
  ['Little Caesars', 'https://littlecaesars.com'],
  ["Jimmy John's", 'https://www.jimmyjohns.com'],
  ['Firehouse Subs', 'https://www.firehousesubs.com'],
  ['KFC', 'https://www.kfc.com'],
  ["Zaxby's", 'https://www.zaxbys.com'],
  ['Wingstop', 'https://www.wingstop.com'],
  ['Jack in the Box', 'https://www.jackinthebox.com'],
  ["Moe's Southwest Grill", 'https://www.moes.com'],
  ['Panera Bread', 'https://www.panerabread.com'],
  ['Dairy Queen', 'https://www.dairyqueen.com'],
  ["Culver's", 'https://www.culvers.com'],
  ["Raising Cane's", 'https://www.raisingcanes.com'],
  ['Shake Shack', 'https://www.shakeshack.com'],
  ['Krispy Kreme', 'https://www.krispykreme.com'],
  ['Texas Roadhouse', 'https://www.texasroadhouse.com'],
  ['LongHorn Steakhouse', 'https://www.longhornsteakhouse.com'],
  ['Cracker Barrel', 'https://www.crackerbarrel.com'],
  ['Red Robin', 'https://www.redrobin.com'],
  ['El Pollo Loco', 'https://www.elpolloloco.com'],
  ['Bojangles', 'https://www.bojangles.com'],
  ["Steak 'n Shake", 'https://www.steaknshake.com'],
  ['Noodles & Company', 'https://www.noodles.com'],
  ['Whataburger', 'https://whataburger.com'],
  ["McDonald's", 'https://www.mcdonalds.com'],
  ['Taco Bell', 'https://www.tacobell.com'],
];

/** Hostname without protocol, e.g. "www.wendys.com". */
function hostOf(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
}

/** Stable id slug from the name. */
function slugOf(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const RESTAURANTS: Restaurant[] = RAW.map(([name, url]) => {
  const host = hostOf(url);
  return {
    id: slugOf(name),
    name,
    url,
    host,
    // Google favicon service — the brand's logo by domain, 128px.
    logoUrl: `https://www.google.com/s2/favicons?domain=${host}&sz=128`,
  };
});

const BY_ID = new Map(RESTAURANTS.map((r) => [r.id, r]));
export function getRestaurant(id: string): Restaurant | undefined {
  return BY_ID.get(id);
}

/** n random distinct restaurants (for the login recommendations). */
export function pickRandom(n: number): Restaurant[] {
  const pool = [...RESTAURANTS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(n, pool.length));
}
