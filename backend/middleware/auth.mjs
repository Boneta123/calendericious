/**
 * Placeholder auth middleware. Currently a pass-through — it lets every
 * request continue. This is the seam where real token/session verification
 * will live so that :id routes can only be touched by their owner.
 *
 * // TODO: verify a bearer token, attach req.user, 401 on failure.
 */
export function auth(_req, _res, next) {
  next();
}
