/**
 * App-side restaurant catalog — the selectable options for the picker.
 *
 * SINGLE SOURCE OF TRUTH: the raw list lives in `shared/restaurants.json` at
 * the repo root and is read by BOTH this file and the backend scraper. Edit
 * that JSON to change the options here and the scraper's targets at once.
 * // TODO: backend — serve this list from the API.
 *
 * Logos are pulled from Google's favicon service by domain (no backend, no
 * key): https://www.google.com/s2/favicons?domain=<host>&sz=128
 */

import RAW from '../../shared/restaurants.json';

export interface Restaurant {
  id: string;
  name: string;
  url: string;
  host: string;
  logoUrl: string;
}

/** Hostname without protocol, e.g. "www.wendys.com". */
function hostOf(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
}

/** Stable id slug from the name. */
function slugOf(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const RESTAURANTS: Restaurant[] = (RAW as { name: string; url: string }[]).map(
  ({ name, url }) => {
    const host = hostOf(url);
    return {
      id: slugOf(name),
      name,
      url,
      host,
      // Google favicon service — the brand's logo by domain, 128px.
      logoUrl: `https://www.google.com/s2/favicons?domain=${host}&sz=128`,
    };
  },
);

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
