/**
 * Deals route — serves stored deals from the DB. Populated by the daily scraper
 * job (jobs/dealsJob) / `npm run refresh`. No auth.
 */
import { Router } from 'express';

import { prisma } from '../db.mjs';

const router = Router();

// GET /deals — all stored deals, each joined with its restaurant (name, logo).
// Optional ?restaurantId= filter. Ordered by restaurant name.
router.get('/deals', async (req, res, next) => {
  try {
    const { restaurantId } = req.query;
    const deals = await prisma.deal.findMany({
      where: restaurantId ? { restaurantId: String(restaurantId) } : undefined,
      include: { restaurant: { select: { id: true, name: true, logoUrl: true } } },
      orderBy: { restaurant: { name: 'asc' } },
    });
    res.json(deals);
  } catch (err) {
    next(err);
  }
});

export default router;
