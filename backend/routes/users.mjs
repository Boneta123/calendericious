/**
 * User + auth routes. Email is the login identity; displayName is the shown
 * name. Passwords are hashed (backend/lib/password.mjs). No tokens/MFA yet —
 * simple create-account + login. Never returns passwordHash.
 */
import { Router } from 'express';

import { prisma } from '../db.mjs';
import { hashPassword, verifyPassword } from '../lib/password.mjs';

const router = Router();

const EMAIL_RE = /^\S+@\S+\.\S+$/;

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
router.post('/users', async (req, res, next) => {
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
router.post('/auth/login', async (req, res, next) => {
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

export default router;
