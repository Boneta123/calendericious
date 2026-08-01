/**
 * User + auth routes. Wiring only — handlers are placeholders (501) until the
 * database and real auth exist. No hashing, no tokens, no fake data yet.
 */
import { Router } from 'express';

const router = Router();

// Create a new account. body: { email, password, displayName, zip }
router.post('/users', (_req, res) => {
  // TODO: implement — persist user (DB not built yet).
  res.status(501).json({ error: 'Not implemented' });
});

// Log in. body: { email, password }
router.post('/auth/login', (_req, res) => {
  // TODO: implement — verify credentials, issue a token (auth not built yet).
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
