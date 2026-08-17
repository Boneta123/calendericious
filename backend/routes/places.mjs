/**
 * Address/place autocomplete proxy — powered by LocationIQ (OpenStreetMap data),
 * chosen for its cheap/free tier. The mobile app calls THIS endpoint so the key
 * never ships in the app bundle — read ONLY from process.env.LOCATIONIQ_API_KEY
 * (server-side; add it to .env). Auth-gated.
 *
 * LocationIQ's autocomplete already returns the full address per result, so
 * there is NO separate details call (one request per search = cheaper). Response
 * shape is kept generic: { placeId, primary, secondary } where `secondary` is
 * the full formatted address the app stores on select.
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

// Only these OSM POI `type`s are kept per form, so plain addresses / non-food
// places never appear. Delis count as restaurants (most are seated); food
// vendors include gas stations (fuel) since many sell prepared/packaged food.
const RESTAURANT_TYPES = new Set([
  'restaurant', 'fast_food', 'cafe', 'bar', 'pub', 'food_court', 'ice_cream',
  'biergarten', 'bakery', 'deli', 'confectionery', 'pastry',
]);
const FOOD_TYPES = new Set([
  'convenience', 'supermarket', 'grocery', 'greengrocer', 'general', 'deli',
  'bakery', 'department_store', 'wholesale', 'marketplace', 'fuel',
]);
// LocationIQ tag hint (best-effort; the whitelist above is the guarantee).
const TAG_HINT = {
  restaurant: 'amenity:restaurant,amenity:fast_food,amenity:cafe,shop:deli',
  food: 'shop:convenience,shop:supermarket,shop:grocery,amenity:fuel',
};

// GET /places/autocomplete?input=&lat=&lng= — name→address suggestions, biased
// to the device location (a viewbox around lat/lng) when provided.
router.get('/places/autocomplete', auth, placesLimiter, async (req, res, next) => {
  try {
    if (!key()) return res.status(503).json({ error: 'Places not configured' });
    const input = String(req.query.input || '').trim();
    if (input.length < 2) return res.json([]);

    const kind = req.query.type === 'food' ? 'food' : 'restaurant';
    const allowed = kind === 'food' ? FOOD_TYPES : RESTAURANT_TYPES;

    const params = new URLSearchParams({
      key: key(),
      q: input,
      limit: '15', // fetch a few extra, then filter down to food POIs
      dedupe: '1',
      tag: TAG_HINT[kind],
    });
    const lat = req.query.lat ? Number(req.query.lat) : null;
    const lng = req.query.lng ? Number(req.query.lng) : null;
    const hasLoc = Number.isFinite(lat) && Number.isFinite(lng);
    if (hasLoc) {
      // Restrict the query to a ~50mi box (exact radius enforced below).
      const dLat = RADIUS_MI / 69.0;
      const dLng = RADIUS_MI / (69.0 * Math.max(0.01, Math.cos((lat * Math.PI) / 180)));
      params.set('viewbox', `${lng - dLng},${lat + dLat},${lng + dLng},${lat - dLat}`);
      params.set('bounded', '1'); // hard-restrict to the box
    }

    const resp = await fetch(`https://api.locationiq.com/v1/autocomplete?${params.toString()}`);
    // LocationIQ returns 404 with {error} when nothing matches → empty list.
    if (resp.status === 404) return res.json([]);
    if (!resp.ok) return res.status(502).json({ error: 'Places request failed' });

    const data = await resp.json();
    const out = (Array.isArray(data) ? data : [])
      // Keep ONLY food POIs of the requested kind (no plain addresses).
      .filter((r) => allowed.has(r.type))
      // …and only those within RADIUS_MI of the user (true circle, not a box).
      .filter((r) => {
        if (!hasLoc) return true;
        const rlat = Number(r.lat);
        const rlon = Number(r.lon);
        if (!Number.isFinite(rlat) || !Number.isFinite(rlon)) return false;
        return haversineMi(lat, lng, rlat, rlon) <= RADIUS_MI;
      })
      .map((r) => {
        const primary =
          r.display_place || r.address?.name || String(r.display_name || '').split(',')[0].trim();
        const secondary = r.display_address || r.display_name || '';
        // Carry the picked place's coordinates so submissions can store them
        // (powers the "Near me" distance filter).
        return {
          placeId: String(r.place_id ?? r.osm_id ?? ''),
          primary,
          secondary,
          lat: Number(r.lat),
          lng: Number(r.lon),
        };
      })
      .filter((x) => x.primary && x.secondary && Number.isFinite(x.lat) && Number.isFinite(x.lng))
      .slice(0, 8);
    res.json(out);
  } catch (err) {
    next(err);
  }
});

export default router;
