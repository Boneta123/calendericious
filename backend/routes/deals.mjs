/**
 * Deals route — serves stored deals from the DB. Populated by the daily scraper
 * job (jobs/dealsJob) / `npm run refresh`. No auth.
 */
import { Router } from 'express';

import { prisma } from '../db.mjs';

const router = Router();

// GET /deals — stored deals, each joined with its restaurant (name, logo).
// Filters: ?restaurantId= (single) and/or ?userId= (only the user's chosen
// restaurants). With both, restaurantId must also be within the user's set.
// No userId → all deals. Ordered by restaurant name.
router.get('/deals', async (req, res, next) => {
  try {
    const restaurantId = req.query.restaurantId ? String(req.query.restaurantId) : null;
    const userId = req.query.userId ? String(req.query.userId) : null;

    let where;
    if (userId) {
      // Restrict to the restaurants this user follows.
      const links = await prisma.userRestaurant.findMany({
        where: { userId },
        select: { restaurantId: true },
      });
      let ids = links.map((l) => l.restaurantId);
      if (restaurantId) ids = ids.filter((id) => id === restaurantId); // intersect
      if (ids.length === 0) return res.json([]); // user follows nothing (or no overlap)
      where = { restaurantId: { in: ids } };
    } else if (restaurantId) {
      where = { restaurantId };
    }

    const deals = await prisma.deal.findMany({
      where,
      include: { restaurant: { select: { id: true, name: true, logoUrl: true } } },
      orderBy: { restaurant: { name: 'asc' } },
    });
    res.json(deals);
  } catch (err) {
    next(err);
  }
});

export default router;
