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
function safeUser(user, restaurantIds) {
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    zip: user.zip,
    profilePhoto: user.profilePhoto ?? null,
    restaurantIds,
  };
}

// Create a new account. body: { displayName, email, password, zip }
router.post('/users', signupLimiter, async (req, res, next) => {
  try {
    const { displayName, email, password, zip } = req.body ?? {};
    const name = typeof displayName === 'string' ? displayName.trim() : '';
    if (!name) return res.status(400).json({ error: 'Display name is required.' });
    if (typeof email !== 'string' || !EMAIL_RE.test(email))
      return res.status(400).json({ error: 'A valid email is required.' });
    if (typeof password !== 'string' || password.length <= 7 || !/[^A-Za-z0-9]/.test(password))
      return res
        .status(400)
        .json({ error: 'Password must be more than 7 characters and include a special character.' });
    if (typeof zip !== 'string' || !zip.trim())
      return res.status(400).json({ error: 'ZIP is required.' });

    const user = await prisma.user.create({
      data: {
        displayName: name,
        email: email.trim().toLowerCase(),
        passwordHash: hashPassword(password),
        zip: zip.trim(),
      },
    });
    res.json(safeUser(user, []));
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
      include: { restaurants: { select: { restaurantId: true } } },
    });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    // Record the login for the admin dashboard (fire-and-forget is fine).
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const restaurantIds = user.restaurants.map((r) => r.restaurantId);
    res.json(safeUser(user, restaurantIds));
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

export default router;
