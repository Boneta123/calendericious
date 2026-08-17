/**
 * One-off import: seed the old scraped restaurant list as admin-added brands.
 *
 * The list was deleted from the working tree but lives in git history at
 * `shared/restaurants.json` (array of { name, url }). This recovers it and
 * inserts each as a restaurant brand with name + website and NO address —
 * exactly as if I had added it from the admin panel. Idempotent: the unique
 * website means re-running just skips everything already present.
 *
 * Run:  node --env-file=.env backend/scripts/importScrapedRestaurants.mjs
 * Secrets come from process.env (never .env directly).
 */
import { execSync } from 'node:child_process';

import { prisma } from '../db.mjs';
import { createBrand } from '../routes/restaurants.mjs';

function loadFromGit() {
  // 581ea65 is a commit that still had the file (it was deleted in e4abcd8).
  const raw = execSync('git show 581ea65:shared/restaurants.json', { encoding: 'utf8' });
  const list = JSON.parse(raw);
  if (!Array.isArray(list) || list.length === 0) throw new Error('recovered list is empty');
  return list;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Missing DATABASE_URL — aborting.');
    process.exit(1);
  }

  let list;
  try {
    list = loadFromGit();
  } catch (e) {
    console.error('Could not recover shared/restaurants.json from git:', e.message);
    process.exit(1);
  }

  let added = 0;
  let skipped = 0;
  const errored = [];
  for (const { name, url } of list) {
    try {
      await createBrand(prisma.restaurant, { name, url }); // no address = admin chain
      added += 1;
    } catch (err) {
      if (err && err.status === 409) {
        skipped += 1; // already on the app (unique website) — idempotent
      } else {
        errored.push(`${name}: ${err?.message || err}`);
      }
    }
  }

  console.log(`Done. ${list.length} in file, ${added} added, ${skipped} skipped (already existed).`);
  if (errored.length) {
    console.log(`Errored (${errored.length}):`);
    for (const e of errored) console.log('  -', e);
  }
}

main()
  .catch((err) => {
    console.error('Import failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
