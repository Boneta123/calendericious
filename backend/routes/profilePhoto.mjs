/**
 * Profile photo routes. Wiring only — placeholders (501). No file storage yet
 * (photos will live in object storage; the DB keeps only the URL).
 */
import { Router } from 'express';
import { auth } from '../middleware/auth.mjs';

const router = Router();

// Get the user's profile photo URL.
router.get('/users/:id/photo', auth, (_req, res) => {
  // TODO: implement — read photo URL for :id (DB not built yet).
  res.status(501).json({ error: 'Not implemented' });
});

// Set the user's profile photo.
router.post('/users/:id/photo', auth, (_req, res) => {
  // TODO: implement — accept upload, store in object storage, save URL.
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
