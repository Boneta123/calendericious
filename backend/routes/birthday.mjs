/**
 * Birthday route. The user's birthday is stored as "MM-DD" (month+day, no year).
 * Self-only — a user can update only their own birthday (the value is also
 * returned in the auth-user object, so there's no separate GET).
 */
import { Router } from 'express';
import { prisma } from '../db.mjs';
import { auth, requireSelf } from '../middleware/auth.mjs';

const router = Router();

// "MM-DD" month+day (no year).
const BIRTHDAY_RE = /^\d{2}-\d{2}$/;

// Update the user's birthday. body: { birthday: "MM-DD" }
router.put('/users/:id/birthday', auth, requireSelf, async (req, res, next) => {
  try {
    const birthday = typeof req.body?.birthday === 'string' ? req.body.birthday.trim() : '';
    if (!BIRTHDAY_RE.test(birthday))
      return res.status(400).json({ error: 'A valid birthday (MM-DD) is required.' });
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { birthday },
      select: { birthday: true },
    });
    res.json({ birthday: user.birthday });
  } catch (err) {
    next(err);
  }
});

export default router;
