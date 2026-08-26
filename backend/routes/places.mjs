/**
 * Address/place autocomplete proxy — powered by LocationIQ (OpenStreetMap data),
 * chosen for its cheap/free tier. The mobile app calls THIS endpoint so the key
 * never ships in the app bundle — read ONLY from process.env.LOCATIONIQ_API_KEY
 * (server-side; add it to .env). Auth-gated.
 *
 * Queries BOTH LocationIQ endpoints and merges them: /autocomplete (prefix
 * typeahead — surfaces partial names as you type) + /search (finds the exact
 * local business by name). Each covers the other's gaps, so the widest set of
 * real nearby stores shows as you type. Non-store features (towns/streets/
 * boundaries) are dropped, results are hard-limited to 50mi of the device,
 * deduped, and sorted closest-first. Response shape is { placeId, primary,
 * secondary, lat, lng }; `secondary` is the address the app stores on select.
 *
 * For a HARD spend cap, set daily quotas + budget alerts in your LocationIQ
 * dashboard; the per-IP limiter below is just an abuse guard.
 */
import { Router } from 'express';
import { auth } from '../middleware/auth.mjs';
import { rateLimit } from '../middleware/rateLimit.mjs';

const router = Router();

const key = () => process.env.LOCATIONIQ_API_KEY;
const RADIUS_MI = 50; // only return places within this many miles of the user

// /search geocodes ANY OSM feature. We want actual places/stores, so drop pure
// geographic + administrative results (towns, streets, county/state boundaries,
// rivers, land parcels). Everything else — amenity/shop/office/leisure/tourism/
// craft/building/etc. — is kept (no food-only restriction, just "not a road/town").
const EXCLUDE_CLASSES = new Set([
  'place', 'boundary', 'highway', 'railway', 'waterway', 'natural', 'landuse', 'route', 'aeroway',
]);

/** Great-circle distance in miles. */
function haversineMi(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
const placesLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  message: 'Too many searches — slow down a moment.',
});

// GET /places/autocomplete?input=&lat=&lng=&type= — name→place suggestions.
// LOOSE / crowdsourced: we do NOT filter by OSM category (tagging is too
// inconsistent — real places get dropped). We return ALL name matches, biased
// toward the device location, and let the user pick the right one. Results are
// RANKED (not hard-filtered): named POIs before bare address rows, then closest
// first. The `type` param is accepted for compatibility but no longer filters.
router.get('/places/autocomplete', auth, placesLimiter, async (req, res, next) => {
  try {
    if (!key()) return res.status(503).json({ error: 'Places not configured' });
    const input = String(req.query.input || '').trim();
    if (input.length < 3) return res.json([]); // wait for 3+ chars to limit API calls

    // A device location is REQUIRED: results are limited to 50mi around it, so
    // without lat/lng we return nothing (no API call) instead of every match.
    const lat = req.query.lat ? Number(req.query.lat) : null;
    const lng = req.query.lng ? Number(req.query.lng) : null;
    const hasLoc = Number.isFinite(lat) && Number.isFinite(lng);
    if (!hasLoc) return res.json([]);

    // ~50mi box around the device (exact circle enforced below).
    const dLat = RADIUS_MI / 69.0;
    const dLng = RADIUS_MI / (69.0 * Math.max(0.01, Math.cos((lat * Math.PI) / 180)));
    const viewbox = `${lng - dLng},${lat + dLat},${lng + dLng},${lat - dLat}`;
    const base = {
      key: key(),
      q: input,
      limit: '25',
      dedupe: '1',
      addressdetails: '1',
      normalizecity: '1',
      namedetails: '1', // clean business name
      viewbox,
      bounded: '1',
    };

    // Query BOTH endpoints and merge — they cover different gaps: /autocomplete
    // is a prefix TYPEAHEAD (surfaces partial names as you type) but misses some
    // small POIs; /search finds the exact local business but needs a fuller name.
    // Together they give the widest as-you-type coverage. 404/429/error → [].
    async function hit(endpoint) {
      try {
        const p = new URLSearchParams(base);
        if (endpoint === 'search') p.set('format', 'json'); // /search defaults to XML
        const host = endpoint === 'search' ? 'us1' : 'api';
        const r = await fetch(`https://${host}.locationiq.com/v1/${endpoint}?${p.toString()}`);
        if (!r.ok) return [];
        const d = await r.json();
        return Array.isArray(d) ? d : [];
      } catch {
        return [];
      }
    }
    // Sequential, not parallel: two simultaneous calls trip LocationIQ's
    // per-second rate limit (one would 429 and its results would be lost).
    const auto = await hit('autocomplete');
    const search = await hit('search');

    const seen = new Set();
    const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
    const out = [...auto, ...search]
      .map((r) => {
        const rlat = Number(r.lat);
        const rlon = Number(r.lon);
        const dist =
          Number.isFinite(rlat) && Number.isFinite(rlon) ? haversineMi(lat, lng, rlat, rlon) : Infinity;
        return { r, rlat, rlon, dist };
      })
      // Real places/stores only (drop towns, streets, boundaries, rivers, …).
      .filter((s) => !EXCLUDE_CLASSES.has(s.r.class))
      // HARD 50-mile limit (true circle).
      .filter((s) => s.dist <= RADIUS_MI)
      // Closest first — a local match always outranks a far one.
      .sort((a, b) => a.dist - b.dist)
      .map(({ r, rlat, rlon }) => {
        const parts = String(r.display_name || '').split(',').map((p) => p.trim());
        const primary = r.namedetails?.name || r.display_place || r.address?.name || parts[0] || '';
        const secondary =
          r.display_address || (parts.length > 1 ? parts.slice(1).join(', ') : r.display_name || '');
        return { placeId: String(r.place_id ?? r.osm_id ?? ''), primary, secondary, lat: rlat, lng: rlon };
      })
      .filter((x) => {
        if (!x.primary || !x.secondary || !Number.isFinite(x.lat) || !Number.isFinite(x.lng)) return false;
        // Dedupe the two sources by name + rounded location.
        const k = `${norm(x.primary)}|${x.lat.toFixed(3)}|${x.lng.toFixed(3)}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, 8);
    res.json(out);
  } catch (err) {
    next(err);
  }
});

export default router;
