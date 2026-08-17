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
export const slugOf = (name) =>
  String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const hostOf = (url) => String(url).replace(/^https?:\/\//, '').replace(/\/.*$/, '');
export const faviconFor = (host) => `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
export const URL_RE = /^https?:\/\/\S+\.\S+/;

/**
 * Create ONE brand row (restaurant or food vendor). The website `url` is the
 * unique brand key: a place can't be added twice (by a user, or after I add it
 * in the admin). `address` is OPTIONAL — a user submission carries a specific
 * address (a local place); an admin-seeded chain has none. Throws a tagged
 * error `{ status, message }` on validation/duplicate so callers map it to HTTP.
 */
export async function createBrand(model, { name, url, address, logoUrl, lat, lng } = {}) {
  if (typeof name !== 'string' || !name.trim())
    throw { status: 400, message: 'A name is required.' };
  if (typeof url !== 'string' || !URL_RE.test(url.trim()))
    throw { status: 400, message: 'A valid website URL is required.' };

  const id = slugOf(name);
  if (!id) throw { status: 400, message: 'That name is not usable.' };
  const host = hostOf(url.trim());
  const logo = typeof logoUrl === 'string' && logoUrl.trim() ? logoUrl.trim() : faviconFor(host);
  const addr = typeof address === 'string' && address.trim() ? address.trim() : null;
  // Coordinates only make sense for a local spot (an address). Store them when
  // both are finite; a chain (no address) stays null → excluded from "Near me".
  const latN = addr && Number.isFinite(Number(lat)) ? Number(lat) : null;
  const lngN = addr && Number.isFinite(Number(lng)) ? Number(lng) : null;

  // Reject a website that already exists (dedupe by brand key) before insert.
  const existing = await model.findUnique({ where: { url: url.trim() } });
  if (existing) throw { status: 409, message: 'This place is already on the app.' };

  try {
    return await model.create({
      data: { id, name: name.trim(), url: url.trim(), host, logoUrl: logo, address: addr, lat: latN, lng: lngN },
    });
  } catch (err) {
    // P2002 = unique violation (same website, or same slug id from the name).
    if (err && err.code === 'P2002') throw { status: 409, message: 'This place is already on the app.' };
    throw err;
  }
}

/** Route wrapper: create a brand from the request body, mapping tagged errors. */
async function createVendor(model, req, res, next) {
  try {
    const row = await createBrand(model, req.body ?? {});
    res.status(201).json(row);
  } catch (err) {
    if (err && err.status) return res.status(err.status).json({ error: err.message });
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
