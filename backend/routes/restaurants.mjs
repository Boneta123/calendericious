/**
 * Restaurant routes.
 *  - GET /restaurants           — the seeded catalog (no auth). Serves the app.
 *  - PUT /users/:id/restaurants — user selection (auth). Still a 501 stub;
 *    left untouched (no user/auth work in this pass).
 */
import { Router } from 'express';

import { prisma } from '../db.mjs';
import { auth } from '../middleware/auth.mjs';

const router = Router();

// GET /restaurants — the full catalog, ordered by name.
router.get('/restaurants', async (_req, res, next) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(restaurants);
  } catch (err) {
    next(err);
  }
});

// Replace the user's selected restaurants. body: { restaurantIds: [] }
router.put('/users/:id/restaurants', auth, (_req, res) => {
  // TODO: implement — persist the user's selected restaurant ids (DB not built yet).
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
