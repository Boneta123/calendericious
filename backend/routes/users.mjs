/**
 * User + auth routes. Email is the login identity; displayName is the shown
 * name. Passwords are hashed (backend/lib/password.mjs). No tokens/MFA yet —
 * simple create-account + login. Never returns passwordHash.
 */
import { randomInt } from 'node:crypto';

import { Router } from 'express';

import { prisma } from '../db.mjs';
import { sendPasswordResetEmail } from '../lib/email.mjs';
import { hashPassword, verifyPassword } from '../lib/password.mjs';
import { createSession, destroySession } from '../lib/session.mjs';
import { auth, requireSelf } from '../middleware/auth.mjs';
import { rateLimit } from '../middleware/rateLimit.mjs';

const router = Router();

// Basic per-IP rate limits on the auth endpoints (in-memory, single-server).
const MIN = 60 * 1000;
const signupLimiter = rateLimit({ windowMs: 15 * MIN, max: 10, message: 'Too many sign-ups from this device. Try again later.' });
const loginLimiter = rateLimit({ windowMs: 5 * MIN, max: 10, message: 'Too many login attempts. Try again in a few minutes.' });
const forgotLimiter = rateLimit({ windowMs: 15 * MIN, max: 4, message: 'Too many reset requests. Try again later.' });
const resetLimiter = rateLimit({ windowMs: 15 * MIN, max: 10, message: 'Too many attempts. Try again later.' });

const EMAIL_RE = /^\S+@\S+\.\S+$/;
// Password policy shared with signup: > 7 chars AND at least one special char.
const PASSWORD_OK = (pw) => typeof pw === 'string' && pw.length > 7 && /[^A-Za-z0-9]/.test(pw);
const PASSWORD_MSG = 'Password must be more than 7 characters and include a special character.';

/** Shape the client is allowed to see — never the passwordHash. */
function safeUser(user, restaurantIds, foodVendorIds = []) {
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    birthday: user.birthday ?? null,
    profilePhoto: user.profilePhoto ?? null,
    nearMeRadius: user.nearMeRadius ?? 25,
    restaurantIds,
    foodVendorIds,
  };
}

// Allowed "Near me" radii (miles) — must match the frontend options.
const NEAR_ME_RADII = new Set([10, 25, 50]);

// "MM-DD" month+day (no year). Validated at the app layer; stored as a String.
const BIRTHDAY_RE = /^\d{2}-\d{2}$/;

// Create a new account. body: { displayName, email, password, birthday }
router.post('/users', signupLimiter, async (req, res, next) => {
  try {
    const { displayName, email, password, birthday } = req.body ?? {};
    const name = typeof displayName === 'string' ? displayName.trim() : '';
    if (!name) return res.status(400).json({ error: 'Display name is required.' });
    if (typeof email !== 'string' || !EMAIL_RE.test(email))
      return res.status(400).json({ error: 'A valid email is required.' });
    if (typeof password !== 'string' || password.length <= 7 || !/[^A-Za-z0-9]/.test(password))
      return res
        .status(400)
        .json({ error: 'Password must be more than 7 characters and include a special character.' });
    if (typeof birthday !== 'string' || !BIRTHDAY_RE.test(birthday.trim()))
      return res.status(400).json({ error: 'A valid birthday is required.' });

    const user = await prisma.user.create({
      data: {
        displayName: name,
        email: email.trim().toLowerCase(),
        passwordHash: hashPassword(password),
        birthday: birthday.trim(),
      },
    });
    const token = await createSession(user.id);
    res.json({ ...safeUser(user, []), token });
  } catch (err) {
    // Prisma unique-constraint violation on email.
    if (err && err.code === 'P2002') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    next(err);
  }
});

// Log in. body: { email, password }
router.post('/auth/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string')
      return res.status(400).json({ error: 'Email and password are required.' });

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: {
        restaurants: { select: { restaurantId: true } },
        foodVendors: { select: { foodVendorId: true } },
      },
    });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    // Record the login for the admin dashboard (fire-and-forget is fine).
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const restaurantIds = user.restaurants.map((r) => r.restaurantId);
    const foodVendorIds = user.foodVendors.map((v) => v.foodVendorId);
    const token = await createSession(user.id);
    res.json({ ...safeUser(user, restaurantIds, foodVendorIds), token });
  } catch (err) {
    next(err);
  }
});

// Current session's user (used to restore the session on app launch).
router.get('/auth/me', auth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        restaurants: { select: { restaurantId: true } },
        foodVendors: { select: { foodVendorId: true } },
      },
    });
    if (!user) return res.status(401).json({ error: 'Not authenticated.' });
    res.json(safeUser(
      user,
      user.restaurants.map((r) => r.restaurantId),
      user.foodVendors.map((v) => v.foodVendorId),
    ));
  } catch (err) {
    next(err);
  }
});

// Save the user's "Near me" radius (miles) so it restores with their session.
// body: { radiusMi } — must be one of the allowed options.
router.put('/users/:id/near-me-radius', auth, requireSelf, async (req, res, next) => {
  try {
    const radiusMi = Number(req.body?.radiusMi);
    if (!NEAR_ME_RADII.has(radiusMi))
      return res.status(400).json({ error: 'Radius must be 10, 25, or 50 miles.' });
    await prisma.user.update({ where: { id: req.params.id }, data: { nearMeRadius: radiusMi } });
    res.json({ nearMeRadius: radiusMi });
  } catch (err) {
    next(err);
  }
});

// Log out — delete this session's token.
router.post('/auth/logout', auth, async (req, res, next) => {
  try {
    const h = req.headers.authorization || '';
    await destroySession(h.startsWith('Bearer ') ? h.slice(7).trim() : null);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Forgot password — email a 6-digit reset code. body: { email }
// ALWAYS returns a generic 200 (no account enumeration).
router.post('/auth/forgot-password', forgotLimiter, async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const generic = { ok: true };
    if (!EMAIL_RE.test(email)) return res.json(generic); // don't reveal validity

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      const code = String(randomInt(100000, 1000000)); // 6 digits
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetCodeHash: hashPassword(code),
          resetCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
      await sendPasswordResetEmail(email, code);
    }
    res.json(generic);
  } catch (err) {
    next(err);
  }
});

// Reset password with the emailed code. body: { email, code, newPassword }
router.post('/auth/reset-password', resetLimiter, async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
    const newPassword = req.body?.newPassword;
    if (!email || !code) return res.status(400).json({ error: 'Email and code are required.' });
    if (!PASSWORD_OK(newPassword)) return res.status(400).json({ error: PASSWORD_MSG });

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true, resetCodeHash: true, resetCodeExpiresAt: true },
    });
    const expired = !user?.resetCodeExpiresAt || user.resetCodeExpiresAt.getTime() < Date.now();
    if (!user || !user.resetCodeHash || expired || !verifyPassword(code, user.resetCodeHash)) {
      return res.status(400).json({ error: 'Invalid or expired code.' });
    }

    // The new password must differ from the current one.
    if (verifyPassword(newPassword, user.passwordHash)) {
      return res
        .status(400)
        .json({ error: 'New password must be different from your current password.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(newPassword),
        resetCodeHash: null, // single-use
        resetCodeExpiresAt: null,
      },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Public profile of ANY user (logged-in viewers only). PUBLIC-safe fields only —
// never email/birthday/passwordHash. Includes the user's created deals + counts.
router.get('/users/:id/public', auth, async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        displayName: true,
        profilePhoto: true,
        _count: { select: { foundDeals: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const deals = await prisma.deal.findMany({
      where: { foundByUserId: id },
      include: {
        restaurant: { select: { id: true, name: true, logoUrl: true } },
        foodVendor: { select: { id: true, name: true, logoUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      id: user.id,
      displayName: user.displayName,
      profilePhoto: user.profilePhoto ?? null,
      dealCount: user._count.foundDeals,
      deals,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
