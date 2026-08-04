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

// Replace the user's selected restaurants. body: { restaurantIds: string[] }
router.put('/users/:id/restaurants', auth, async (req, res, next) => {
  try {
    const userId = req.params.id;
    const requested = Array.isArray(req.body?.restaurantIds) ? req.body.restaurantIds : [];

    // Keep only ids that are real restaurants.
    const valid = await prisma.restaurant.findMany({
      where: { id: { in: requested } },
      select: { id: true },
    });
    const ids = valid.map((r) => r.id);

    // Replace this user's selection atomically.
    await prisma.$transaction([
      prisma.userRestaurant.deleteMany({ where: { userId } }),
      ...(ids.length
        ? [prisma.userRestaurant.createMany({ data: ids.map((restaurantId) => ({ userId, restaurantId })) })]
        : []),
    ]);

    res.json({ restaurantIds: ids });
  } catch (err) {
    next(err);
  }
});

export default router;
