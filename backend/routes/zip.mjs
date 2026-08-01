/**
 * ZIP code routes. Wiring only — placeholders (501).
 */
import { Router } from 'express';
import { auth } from '../middleware/auth.mjs';

const router = Router();

// Get the user's ZIP.
router.get('/users/:id/zip', auth, (_req, res) => {
  // TODO: implement — read zip for :id (DB not built yet).
  res.status(501).json({ error: 'Not implemented' });
});

// Update the user's ZIP. body: { zip }
router.put('/users/:id/zip', auth, (_req, res) => {
  // TODO: implement — validate US zip, persist (DB not built yet).
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
