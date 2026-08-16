/**
 * Deals route — serves stored deals from the DB. Deals are crowdsourced (user
 * submissions); there is no scraper. No auth on reads.
 */
import { Router } from 'express';

import { prisma } from '../db.mjs';
import { auth } from '../middleware/auth.mjs';

const router = Router();

const CATEGORIES = new Set(['DAY', 'TIME', 'LIMITED_TIME', 'BIRTHDAY']);
const WINDOWS = new Set(['DAY', 'WEEK', 'MONTH']);

/** "MM/DD" → a Date in the current year; null if empty/invalid. */
function parseMMDD(value) {
  if (typeof value !== 'string') return null;
  const m = value.trim().match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;
  const d = new Date(new Date().getFullYear(), Number(m[1]) - 1, Number(m[2]));
  return Number.isNaN(d.getTime()) ? null : d;
}
const orNull = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);

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
      include: {
        // `address` distinguishes a specific local place (has one) from an
        // admin-seeded chain (none) — drives the "Near me" filter client-side.
        restaurant: { select: { id: true, name: true, logoUrl: true, address: true } },
        foodVendor: { select: { id: true, name: true, logoUrl: true, address: true } },
      },
      // A food-vendor deal has no restaurant, so ordering by the restaurant
      // relation breaks — order by recency instead.
      orderBy: { createdAt: 'desc' },
    });
    res.json(deals);
  } catch (err) {
    next(err);
  }
});

// POST /deals — crowdsourced deal submission (any logged-in user). Stamps the
// creator (foundByUserId + foundBy). The deal belongs to the chosen restaurant.
router.post('/deals', auth, async (req, res, next) => {
  try {
    const b = req.body ?? {};
    if (typeof b.title !== 'string' || !b.title.trim())
      return res.status(400).json({ error: 'A deal name is required.' });
    if (typeof b.description !== 'string' || !b.description.trim())
      return res.status(400).json({ error: 'A description is required.' });
    if (typeof b.restaurantId !== 'string' || !b.restaurantId.trim())
      return res.status(400).json({ error: 'Pick the restaurant this deal is for.' });

    const restaurant = await prisma.restaurant.findUnique({ where: { id: b.restaurantId } });
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });

    // Rate limit: at most 5 deals per user per rolling 24 hours.
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const todays = await prisma.deal.count({
      where: { foundByUserId: req.user.id, createdAt: { gte: since } },
    });
    if (todays >= 5)
      return res.status(429).json({ error: 'Daily limit reached — you can add up to 5 deals per day.' });

    const category = CATEGORIES.has(b.category) ? b.category : 'DAY';
    const daysOfWeek = Array.isArray(b.daysOfWeek)
      ? b.daysOfWeek.filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
      : [];
    const birthdayWindow =
      category === 'BIRTHDAY' && WINDOWS.has(b.birthdayWindow) ? b.birthdayWindow : null;

    const deal = await prisma.deal.create({
      data: {
        restaurantId: restaurant.id,
        foodVendorId: null,
        foundByUserId: req.user.id,
        foundBy: req.user.displayName,
        title: b.title.trim(),
        description: b.description.trim(),
        category,
        daysOfWeek,
        startTime: orNull(b.startTime),
        endTime: orNull(b.endTime),
        validFrom: parseMMDD(b.validFrom),
        validThrough: parseMMDD(b.validThrough),
        birthdayWindow,
        requiresRewards: Boolean(b.requiresRewards),
        onlineOrderOnly: Boolean(b.onlineOrderOnly),
        sourceUrl: orNull(b.sourceUrl),
      },
      include: { restaurant: { select: { id: true, name: true, logoUrl: true } } },
    });
    res.status(201).json(deal);
  } catch (err) {
    if (err && (err.code === 'P2003' || err.code === 'P2025'))
      return res.status(400).json({ error: 'Invalid restaurant.' });
    next(err);
  }
});

// POST /deals/:id/like and /deals/:id/dislike — increment the counter and
// return the new totals. Simple button-driven counters, no per-user dedupe.
// TODO: per-user like tracking (a join table) is a future improvement.
router.post('/deals/:id/like', async (req, res, next) => {
  try {
    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: { likes: { increment: 1 } },
      select: { likes: true, dislikes: true },
    });
    res.json(deal);
  } catch (err) {
    if (err && err.code === 'P2025') return res.status(404).json({ error: 'Deal not found' });
    next(err);
  }
});

router.post('/deals/:id/dislike', async (req, res, next) => {
  try {
    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: { dislikes: { increment: 1 } },
      select: { likes: true, dislikes: true },
    });
    res.json(deal);
  } catch (err) {
    if (err && err.code === 'P2025') return res.status(404).json({ error: 'Deal not found' });
    next(err);
  }
});

export default router;
