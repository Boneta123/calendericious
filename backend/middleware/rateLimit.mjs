/**
 * Tiny in-memory rate limiter (no dependency). Sliding window per key (IP by
 * default). Good enough for a single-server app — state is per-process and
 * resets on restart. For multiple instances, swap in a Redis-backed limiter.
 */
export function rateLimit({
  windowMs,
  max,
  message = 'Too many requests. Please try again later.',
  keyFn,
} = {}) {
  const hits = new Map(); // key -> number[] (request timestamps within the window)

  return function rateLimiter(req, res, next) {
    const now = Date.now();
    const key = keyFn ? keyFn(req) : req.ip || req.socket?.remoteAddress || 'unknown';

    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      const retryMs = windowMs - (now - recent[0]);
      res.set('Retry-After', String(Math.ceil(retryMs / 1000)));
      return res.status(429).json({ error: message });
    }
    recent.push(now);
    hits.set(key, recent);

    // Opportunistic cleanup so the map can't grow unbounded.
    if (hits.size > 5000) {
      for (const [k, v] of hits) {
        const kept = v.filter((t) => now - t < windowMs);
        if (kept.length === 0) hits.delete(k);
        else hits.set(k, kept);
      }
    }
    next();
  };
}
