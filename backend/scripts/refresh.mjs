/**
 * Manual one-shot deals refresh — runs the scraper + persists to the DB, then
 * exits. This is the paid path (needs OPENAI_API_KEY in the process env).
 *
 * Run:  npm run refresh
 *   (which is: node --env-file=.env backend/scripts/refresh.mjs)
 */
import { prisma } from '../db.mjs';
import { runDealsRefresh } from '../jobs/dealsJob.mjs';

await runDealsRefresh();
await prisma.$disconnect();
