/**
 * Auth middleware — verifies the `Authorization: Bearer <token>` session token
 * and attaches `req.user = { id }`. Replaces the old pass-through.
 *
 * `requireSelf` is the ownership check for `/users/:id/*` routes: the logged-in
 * user must be the :id in the path (fixes the IDOR). Use as `auth, requireSelf`.
 */
import { userIdForToken } from '../lib/session.mjs';

/** Extract the bearer token from the Authorization header. */
function bearer(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : null;
}

export async function auth(req, res, next) {
  try {
    const userId = await userIdForToken(bearer(req));
    if (!userId) return res.status(401).json({ error: 'Not authenticated.' });
    req.user = { id: userId };
    next();
  } catch (err) {
    next(err);
  }
}

/** Require the authed user to own the :id in the route. Run AFTER `auth`. */
export function requireSelf(req, res, next) {
  if (!req.user || req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden.' });
  }
  next();
}
