/**
 * Deals route — serves stored deals from the DB. Deals are crowdsourced (user
 * submissions); there is no scraper. No auth on reads.
 */
import { Router } from 'express';

import { prisma } from '../db.mjs';
import { auth } from '../middleware/auth.mjs';
import { userIdForToken } from '../lib/session.mjs';

const router = Router();

/** Resolve the caller's user id from a bearer token if present (no 401 on miss). */
async function optionalViewerId(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7).trim() : null;
  return token ? await userIdForToken(token) : null;
}

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
    // Optional auth: if a token is present, include THIS viewer's reaction per deal.
    const viewerId = await optionalViewerId(req);

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
        // `address` marks a local place vs an admin chain; lat/lng power the
        // "Near me" distance filter (client-side haversine to the device).
        restaurant: { select: { id: true, name: true, logoUrl: true, address: true, lat: true, lng: true } },
        foodVendor: { select: { id: true, name: true, logoUrl: true, address: true, lat: true, lng: true } },
        // Only THIS viewer's reaction (if signed in) → drives the selected state.
        ...(viewerId ? { reactions: { where: { userId: viewerId }, select: { type: true } } } : {}),
      },
      // A food-vendor deal has no restaurant, so ordering by the restaurant
      // relation breaks — order by recency instead.
      orderBy: { createdAt: 'desc' },
    });
    // Flatten each deal's single reaction into `myReaction` ('LIKE'|'DISLIKE'|null).
    const out = deals.map((d) => {
      const { reactions, ...rest } = d;
      return { ...rest, myReaction: reactions && reactions.length ? reactions[0].type : null };
    });
    res.json(out);
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

// DELETE /deals/:id — the CREATOR removes a deal they posted (auth). Ownership
// is enforced HERE (server-side), not by hiding the button: only the user whose
// id matches `foundByUserId` may delete. Reactions cascade away via the schema.
router.delete('/deals/:id', auth, async (req, res, next) => {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: req.params.id },
      select: { foundByUserId: true },
    });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });
    if (deal.foundByUserId !== req.user.id)
      return res.status(403).json({ error: 'You can only delete deals you posted.' });
    await prisma.deal.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    if (err && err.code === 'P2025') return res.status(404).json({ error: 'Deal not found' });
    next(err);
  }
});

// POST /deals/:id/like and /deals/:id/dislike — set THIS user's reaction (auth).
// One reaction per user per deal (unique constraint). Toggle-exclusive:
//   - no reaction  → add `target`
//   - same as tap  → remove it (un-react)
//   - opposite     → switch sides (so a dislike removes a like, and vice-versa)
// Deal.likes/dislikes are kept in sync inside the same transaction. Returns the
// fresh totals + the user's current reaction.
async function react(req, res, next, target) {
  try {
    const dealId = req.params.id;
    const userId = req.user.id;
    const result = await prisma.$transaction(async (tx) => {
      const deal = await tx.deal.findUnique({ where: { id: dealId }, select: { id: true } });
      if (!deal) return null;

      const existing = await tx.dealReaction.findUnique({
        where: { userId_dealId: { userId, dealId } },
      });
      const inc = (field) => ({ [field]: { increment: 1 } });
      const dec = (field) => ({ [field]: { decrement: 1 } });
      const counterField = (t) => (t === 'LIKE' ? 'likes' : 'dislikes');

      let myReaction;
      if (!existing) {
        await tx.dealReaction.create({ data: { userId, dealId, type: target } });
        await tx.deal.update({ where: { id: dealId }, data: inc(counterField(target)) });
        myReaction = target;
      } else if (existing.type === target) {
        await tx.dealReaction.delete({ where: { userId_dealId: { userId, dealId } } });
        await tx.deal.update({ where: { id: dealId }, data: dec(counterField(target)) });
        myReaction = null;
      } else {
        await tx.dealReaction.update({
          where: { userId_dealId: { userId, dealId } },
          data: { type: target },
        });
        await tx.deal.update({
          where: { id: dealId },
          data: { ...inc(counterField(target)), ...dec(counterField(existing.type)) },
        });
        myReaction = target;
      }

      const fresh = await tx.deal.findUnique({
        where: { id: dealId },
        select: { likes: true, dislikes: true },
      });
      return { likes: Math.max(0, fresh.likes), dislikes: Math.max(0, fresh.dislikes), myReaction };
    });
    if (!result) return res.status(404).json({ error: 'Deal not found' });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

router.post('/deals/:id/like', auth, (req, res, next) => react(req, res, next, 'LIKE'));
router.post('/deals/:id/dislike', auth, (req, res, next) => react(req, res, next, 'DISLIKE'));

export default router;
