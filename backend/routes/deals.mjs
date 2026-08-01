/**
 * Deals route. Wiring only — placeholder (501). The daily job (jobs/dealsJob)
 * will refresh deals via the scraper; this endpoint will serve them once the
 * DB exists.
 */
import { Router } from 'express';

const router = Router();

// Get deals (optionally filtered by ?zip). Populated by the daily scraper job.
router.get('/deals', (_req, res) => {
  // TODO: implement — return stored deals near ?zip (DB not built yet).
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
