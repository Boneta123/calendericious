/**
 * Calendericious API gateway (Express).
 *
 * Structure only — every endpoint is an empty placeholder returning 501 until
 * the database + real logic land. No fake data, no DB, no auth yet.
 *
 * Run:  node --env-file=.env backend/server.mjs
 * Env:  PORT (default 4000), OPENAI_API_KEY (used by the daily deals job)
 */

import { networkInterfaces } from 'node:os';

import cors from 'cors';
import express from 'express';

import adminRouter from './admin.mjs';
import dealsRouter from './routes/deals.mjs';
import profilePhotoRouter from './routes/profilePhoto.mjs';
import restaurantsRouter from './routes/restaurants.mjs';
import usersRouter from './routes/users.mjs';
import zipRouter from './routes/zip.mjs';
import { startDealsCron } from './jobs/dealsJob.mjs';

const app = express();
const PORT = process.env.PORT || 4000;

// --- Core middleware -------------------------------------------------------
// TODO: lock CORS to the app's real origin(s) once known.
app.use(cors());
app.use(express.json());

// Tiny request logger.
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.originalUrl}`);
  next();
});

// --- Health ----------------------------------------------------------------
app.get('/health', (_req, res) => res.json({ ok: true }));

// --- Routes (all under /api) ----------------------------------------------
app.use('/api', usersRouter);
app.use('/api', profilePhotoRouter);
app.use('/api', zipRouter);
app.use('/api', dealsRouter);
app.use('/api', restaurantsRouter);

// --- Admin dashboard (registered users + last-login), outside /api ---------
app.use('/admin', adminRouter);

// --- 404 + error handlers --------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// --- Start -----------------------------------------------------------------
// First non-internal IPv4 — the address a phone on the same Wi-Fi uses.
function lanAddress() {
  for (const addrs of Object.values(networkInterfaces())) {
    for (const a of addrs ?? []) {
      if (a.family === 'IPv4' && !a.internal) return a.address;
    }
  }
  return null;
}

// Bind all interfaces (0.0.0.0) so physical devices / Expo Go can reach it.
app.listen(PORT, '0.0.0.0', () => {
  const lan = lanAddress();
  console.log(`[server] Calendericious API listening on http://localhost:${PORT}`);
  if (lan) console.log(`[server]   on your LAN (for phones/Expo Go): http://${lan}:${PORT}`);
  startDealsCron();
});

// Re-export so the daily refresh can be triggered manually later.
export { runDealsRefresh } from './jobs/dealsJob.mjs';
