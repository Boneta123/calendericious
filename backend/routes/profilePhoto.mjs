/**
 * Profile photo routes. Stores a COMPRESSED base64 image data URI directly in
 * `User.profilePhoto` (the client resizes to ~256px JPEG before upload, so rows
 * stay small). Never selected in bulk/list queries — only returned in the
 * auth-user object (login/session restore). If this ever grows, swap to object
 * storage + a URL (same column).
 */
import { Router } from 'express';

import { prisma } from '../db.mjs';
import { auth, requireSelf } from '../middleware/auth.mjs';
import { rateLimit } from '../middleware/rateLimit.mjs';

const router = Router();

// Safety cap: compressed photos are tens of KB; reject anything suspiciously big.
const MAX_PHOTO_CHARS = 1_500_000; // ~1.1MB of image after base64 overhead

// Per-IP rate limit on the photo endpoints (prevents spamming photo writes/reads).
const photoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many photo requests. Please try again later.',
});

// Set the user's profile photo. body: { photo: "data:image/jpeg;base64,..." }
router.post('/users/:id/photo', photoLimiter, auth, requireSelf, async (req, res, next) => {
  try {
    const photo = req.body?.photo;
    if (typeof photo !== 'string' || !/^data:image\/[a-z0-9.+-]+;base64,/i.test(photo)) {
      return res.status(400).json({ error: 'photo must be a base64 image data URI.' });
    }
    if (photo.length > MAX_PHOTO_CHARS) {
      return res.status(413).json({ error: 'Photo too large — compress it before uploading.' });
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { profilePhoto: photo },
      select: { profilePhoto: true },
    });
    res.json({ profilePhoto: user.profilePhoto });
  } catch (err) {
    if (err && err.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    next(err);
  }
});

export default router;
