/**
 * Restaurant routes.
 *  - GET /restaurants           — the seeded catalog (no auth). Serves the app.
 *  - PUT /users/:id/restaurants — user selection (auth). Still a 501 stub;
 *    left untouched (no user/auth work in this pass).
 */
import { Router } from 'express';

import { prisma } from '../db.mjs';
import { auth, requireSelf } from '../middleware/auth.mjs';

const router = Router();

// --- Crowdsourcing helpers -------------------------------------------------
const slugOf = (name) =>
  String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const hostOf = (url) => String(url).replace(/^https?:\/\//, '').replace(/\/.*$/, '');
const faviconFor = (host) => `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
const URL_RE = /^https?:\/\/\S+\.\S+/;

/** Shared create/upsert for a restaurant or food vendor (same columns). */
async function createVendor(model, req, res, next) {
  try {
    const { name, url, address, logoUrl } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim())
      return res.status(400).json({ error: 'A name is required.' });
    if (typeof url !== 'string' || !URL_RE.test(url.trim()))
      return res.status(400).json({ error: 'A valid website URL is required.' });

    const id = slugOf(name);
    if (!id) return res.status(400).json({ error: 'That name is not usable.' });
    const host = hostOf(url.trim());
    const logo = typeof logoUrl === 'string' && logoUrl.trim() ? logoUrl.trim() : faviconFor(host);
    const addr = typeof address === 'string' && address.trim() ? address.trim() : null;

    const data = { name: name.trim(), url: url.trim(), host, logoUrl: logo, address: addr };
    const row = await model.upsert({ where: { id }, create: { id, ...data }, update: data });
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
}

// GET /restaurants — the full restaurant catalog (crowdsourced), by name.
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

// GET /food-vendors — the full food-vendor catalog (crowdsourced), by name.
router.get('/food-vendors', async (_req, res, next) => {
  try {
    const vendors = await prisma.foodVendor.findMany({ orderBy: { name: 'asc' } });
    res.json(vendors);
  } catch (err) {
    next(err);
  }
});

// POST /restaurants — crowdsourced restaurant submission (any logged-in user).
router.post('/restaurants', auth, (req, res, next) => createVendor(prisma.restaurant, req, res, next));

// POST /food-vendors — crowdsourced food-vendor submission (any logged-in user).
router.post('/food-vendors', auth, (req, res, next) => createVendor(prisma.foodVendor, req, res, next));

// Replace the user's selected restaurants. body: { restaurantIds: string[] }
router.put('/users/:id/restaurants', auth, requireSelf, async (req, res, next) => {
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
