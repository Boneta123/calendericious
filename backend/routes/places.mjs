/**
 * Address → businesses lookup — powered by GOOGLE PLACES API (New).
 * The user types an ADDRESS (as separate fields); we return the list of REAL,
 * CURRENT businesses at that address so the user picks the right one (an address
 * often has several — e.g. 20 Hawley St hosts Pho Nomenal, Fit Kitchen, a bar).
 * There is NO category gate — any business/place at the address can be picked.
 * Google is used (over OSM) because its commercial POI data reflects the CURRENT
 * tenant, which OSM lags badly.
 *
 * The Google key never ships in the app bundle — read ONLY from
 * process.env.GOOGLE_MAPS_API_KEY (server-side; add it to .env). Auth-gated.
 *
 * POST /places/geocode-verify  { street, town, state, zip }
 *   -> 200 { candidates: [ {placeId, primary, secondary, lat, lng} ], formattedAddress }
 *   -> 422 { error }   when the address can't be found
 *   -> 502 { error }   when the lookup service errors
 *
 * Two Google calls per lookup: (1) Text Search geocodes the typed address →
 * coords + formatted address; (2) Nearby Search at those coords (ranked by
 * distance) lists the businesses there. `primary` = business name; `secondary`
 * = its formatted address. If no businesses are found, a single candidate = the
 * plain street address is returned so the user can still submit it.
 */
import { Router } from 'express';
import { auth } from '../middleware/auth.mjs';
import { rateLimit } from '../middleware/rateLimit.mjs';

const router = Router();

const key = () => process.env.GOOGLE_MAPS_API_KEY;
const NEARBY_RADIUS_M = 60; // how far around the geocoded point to gather businesses
const MAX_CANDIDATES = 8;

const verifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: 'Too many address checks — slow down a moment.',
});

/** POST a Google Places (New) request; returns parsed JSON or throws. */
async function googlePost(endpoint, fieldMask, body) {
  const r = await fetch(`https://places.googleapis.com/v1/places:${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key(),
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const text = await r.text();
    const err = new Error(`Google ${endpoint} HTTP ${r.status}`);
    err.status = r.status;
    err.detail = text.slice(0, 200);
    throw err;
  }
  return r.json();
}

/** Map one Google place → { placeId, primary, secondary, lat, lng }. */
function toCandidate(p) {
  return {
    placeId: String(p.id || ''),
    primary: p.displayName?.text || p.formattedAddress || '',
    secondary: p.formattedAddress || '',
    lat: Number(p.location?.latitude),
    lng: Number(p.location?.longitude),
  };
}

// POST /places/geocode-verify — geocode the address, then list businesses there.
router.post('/places/geocode-verify', auth, verifyLimiter, async (req, res, next) => {
  try {
    if (!key()) return res.status(503).json({ error: 'Places not configured' });
    const street = String(req.body?.street || '').trim();
    const town = String(req.body?.town || '').trim();
    const state = String(req.body?.state || '').trim();
    const zip = String(req.body?.zip || '').trim();

    if (!street || (!town && !zip && !state)) {
      return res.status(422).json({ error: 'Enter at least the street and town.' });
    }

    const textQuery = [street, town, [state, zip].filter(Boolean).join(' ')]
      .filter(Boolean)
      .join(', ');

    let geo;
    try {
      // 1) Geocode the typed address → coords + a clean formatted address.
      geo = await googlePost(
        'searchText',
        'places.location,places.formattedAddress',
        { textQuery, regionCode: 'US', maxResultCount: 1 },
      );
    } catch (e) {
      console.error('[places] geocode error:', e.message, e.detail || '');
      return res.status(502).json({ error: 'Address lookup failed. Try again in a moment.' });
    }

    const anchor = Array.isArray(geo?.places) ? geo.places[0] : null;
    const lat = Number(anchor?.location?.latitude);
    const lng = Number(anchor?.location?.longitude);
    const formattedAddress = anchor?.formattedAddress || textQuery;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(422).json({
        error: "We couldn't find that address. Check for typos in the street, town, state, or ZIP.",
      });
    }

    let near;
    try {
      // 2) List the businesses at that point, closest first.
      near = await googlePost(
        'searchNearby',
        'places.id,places.displayName,places.formattedAddress,places.location,places.types',
        {
          locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: NEARBY_RADIUS_M } },
          rankPreference: 'DISTANCE',
          maxResultCount: 15,
          regionCode: 'US',
        },
      );
    } catch (e) {
      console.error('[places] nearby error:', e.message, e.detail || '');
      return res.status(502).json({ error: 'Address lookup failed. Try again in a moment.' });
    }

    const seen = new Set();
    const candidates = (Array.isArray(near?.places) ? near.places : [])
      .map(toCandidate)
      .filter((c) => {
        if (!c.primary || !Number.isFinite(c.lat) || !Number.isFinite(c.lng)) return false;
        if (seen.has(c.placeId)) return false;
        seen.add(c.placeId);
        return true;
      })
      .slice(0, MAX_CANDIDATES);

    // No businesses tagged at the point → let the user submit the plain address.
    if (candidates.length === 0) {
      candidates.push({ placeId: '', primary: formattedAddress, secondary: formattedAddress, lat, lng });
    }

    return res.json({ candidates, formattedAddress });
  } catch (err) {
    next(err);
  }
});

export default router;
