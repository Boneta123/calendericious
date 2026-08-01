/**
 * Restaurant selection route. Wiring only — placeholder (501).
 */
import { Router } from 'express';
import { auth } from '../middleware/auth.mjs';

const router = Router();

// Replace the user's selected restaurants. body: { restaurantIds: [] }
router.put('/users/:id/restaurants', auth, (_req, res) => {
  // TODO: implement — persist the user's selected restaurant ids (DB not built yet).
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
