/**
 * Seed the Restaurant catalog from the single source of truth
 * (`shared/restaurants.json`). Idempotent: upserts by id.
 *
 * id / host / logoUrl are derived EXACTLY like the frontend
 * (`frontend/data/restaurants.ts`) so app and backend agree on ids.
 *
 * Run:  node --env-file=.env backend/prisma/seed.mjs
 */
import { readFileSync } from 'node:fs';
import { prisma } from '../db.mjs';

const RAW = JSON.parse(
  readFileSync(new URL('../../shared/restaurants.json', import.meta.url), 'utf8'),
);

/** Hostname without protocol, e.g. "www.wendys.com" (matches frontend hostOf). */
function hostOf(url) {
  return url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
}

/** Stable id slug from the name (matches frontend slugOf). */
function slugOf(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  let count = 0;
  for (const { name, url } of RAW) {
    const id = slugOf(name);
    const host = hostOf(url);
    const logoUrl = `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
    await prisma.restaurant.upsert({
      where: { id },
      create: { id, name, url, host, logoUrl },
      update: { name, url, host, logoUrl },
    });
    count += 1;
  }
  console.log(`[seed] upserted ${count} restaurants.`);
}

main()
  .catch((err) => {
    console.error('[seed] failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
