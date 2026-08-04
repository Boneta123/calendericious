/**
 * Admin dashboard — registered users + last-login activity.
 *
 * There are NO server-side sessions, so this shows REGISTERED accounts plus a
 * `lastLoginAt` timestamp (set on each login) as a proxy for "who's logged in".
 * Mounted at /admin by server.mjs.
 *
 * Styling mirrors the app's design tokens (frontend/theme/theme.ts) — the
 * "cream menu-paper" look — and uses the food-character art from
 * frontend/assets/foodCharacters, served statically at /admin/assets.
 *
 * Protection: if process.env.ADMIN_KEY is set, both DATA routes require
 * ?key=<it> (403 otherwise). If unset, the dashboard is OPEN — a warning is
 * logged. (We read process.env only — never the .env file.) Images are public.
 */
import { fileURLToPath } from 'node:url';

import express, { Router } from 'express';

import { prisma } from './db.mjs';

const router = Router();

// Serve the food-character art (public — not sensitive, so outside the gate).
const charactersDir = fileURLToPath(
  new URL('../frontend/assets/foodCharacters', import.meta.url),
);
router.use('/assets', express.static(charactersDir));

let warned = false;
function gate(req, res, next) {
  const key = process.env.ADMIN_KEY;
  if (!key) {
    if (!warned) {
      console.warn('[admin] ADMIN_KEY not set — /admin dashboard is UNPROTECTED.');
      warned = true;
    }
    return next();
  }
  if (req.query.key === key) return next();
  return res.status(403).json({ error: 'Forbidden' });
}

// JSON: registered users, most-recently-active first. Never includes passwordHash.
router.get('/api/users', gate, async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        displayName: true,
        email: true,
        zip: true,
        createdAt: true,
        lastLoginAt: true,
        _count: { select: { restaurants: true } },
      },
    });
    const rows = users
      .map((u) => ({
        id: u.id,
        displayName: u.displayName,
        email: u.email,
        zip: u.zip,
        restaurantCount: u._count.restaurants,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      }))
      // most recent login first; users who never logged in (null) last
      .sort((a, b) => {
        const ta = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : -Infinity;
        const tb = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : -Infinity;
        return tb - ta;
      });
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// HTML dashboard — self-contained (inline CSS + JS). Styled to match the app.
router.get('/', gate, (req, res) => {
  const key = process.env.ADMIN_KEY ? encodeURIComponent(String(req.query.key ?? '')) : '';
  const usersUrl = key ? `/admin/api/users?key=${key}` : '/admin/api/users';
  res.type('html').send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Calendericious · Admin</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
<style>
  /* Design tokens mirrored from frontend/theme/theme.ts ("deal almanac") */
  :root {
    --paper: #FFF6EC; --paper-deep: #F6E9D6; --card: #FFFFFF;
    --ink: #2B1B2E; --ink-soft: #7A6A70; --ink-faint: #B7A9AE;
    --tomato: #FF5A36; --mustard: #FFC24B; --basil: #3DA35D; --grape: #6C4AB6;
    --line: #EBDCC7;
    --shadow-card: 0 8px 16px rgba(43,27,46,.10);
    --shadow-soft: 0 3px 8px rgba(43,27,46,.06);
    --display: 'Baloo 2', system-ui, sans-serif;
    --body: 'Nunito', system-ui, sans-serif;
    --mono: 'Space Mono', ui-monospace, monospace;
  }
  * { box-sizing: border-box; }
  html, body { overflow-x: hidden; }
  body {
    margin: 0; min-height: 100dvh; position: relative;
    background: var(--paper); color: var(--ink);
    font-family: var(--body); -webkit-font-smoothing: antialiased;
  }

  /* Subtle food-mascot scatter — decorative, behind content, never blocks it. */
  .scatter { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
  .scatter img { position: absolute; width: 150px; opacity: .14; filter: saturate(1.05); }
  .scatter .m1 { top: -20px; right: -24px; transform: rotate(12deg); }
  .scatter .m2 { bottom: -30px; left: -28px; transform: rotate(-10deg); width: 180px; }
  .scatter .m3 { top: 40%; right: -40px; transform: rotate(-8deg); width: 130px; }
  .scatter .m4 { bottom: 8%; right: 6%; transform: rotate(9deg); width: 110px; opacity: .10; }

  .page { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; padding: 28px 24px 56px; }

  header.masthead { display: flex; align-items: center; gap: 16px; margin-bottom: 4px; }
  header.masthead img { height: 56px; width: auto; }
  .title { font-family: var(--display); font-weight: 800; font-size: 26px; line-height: 1.1; margin: 0; }
  .subtitle { font-family: var(--body); font-weight: 600; color: var(--ink-soft); font-size: 14px; margin: 4px 0 0; max-width: 60ch; }

  .tiles { display: flex; flex-wrap: wrap; gap: 16px; margin: 24px 0; }
  .tile { background: var(--card); border-radius: 16px; box-shadow: var(--shadow-soft);
          padding: 18px 22px; min-width: 170px; border: 1px solid var(--line); }
  .tile .n { font-family: var(--mono); font-weight: 700; font-size: 34px; color: var(--tomato);
             font-variant-numeric: tabular-nums; line-height: 1; }
  .tile .n.grape { color: var(--grape); }
  .tile .l { font-family: var(--body); font-weight: 800; text-transform: uppercase; letter-spacing: .6px;
             font-size: 11px; color: var(--ink-soft); margin-top: 8px; }

  .card { background: var(--card); border-radius: 22px; box-shadow: var(--shadow-card);
          border: 1px solid var(--line); overflow: hidden; }
  .scroll { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; min-width: 720px; }
  thead th { background: var(--mustard); color: var(--ink); text-align: left;
             font-family: var(--body); font-weight: 800; text-transform: uppercase;
             letter-spacing: .5px; font-size: 11.5px; padding: 14px 16px; white-space: nowrap; }
  tbody td { padding: 13px 16px; font-size: 14px; border-top: 1px solid var(--line); vertical-align: middle; }
  tbody tr:first-child td { border-top: none; }
  tbody tr:nth-child(even) td { background: rgba(246,233,214,.35); }
  .name { font-family: var(--display); font-weight: 700; }
  .mono { font-family: var(--mono); font-size: 13px; font-variant-numeric: tabular-nums; }
  .count { font-family: var(--mono); font-weight: 700; color: var(--grape); }
  .never { color: var(--ink-faint); font-style: italic; }
  .loading, .empty { padding: 28px 16px; color: var(--ink-soft); text-align: center; font-weight: 600; }

  @media (max-width: 560px) {
    .page { padding: 20px 16px 48px; }
    header.masthead img { height: 44px; }
    .title { font-size: 22px; }
    .scatter img { width: 110px; }
  }
</style>
</head>
<body>
  <div class="scatter" aria-hidden="true">
    <img class="m1" src="/admin/assets/boba.png" alt="" />
    <img class="m2" src="/admin/assets/taco.png" alt="" />
    <img class="m3" src="/admin/assets/pizza.png" alt="" />
    <img class="m4" src="/admin/assets/burger.png" alt="" />
  </div>

  <div class="page">
    <header class="masthead">
      <img src="/admin/assets/calendericiousLogo.png" alt="Calendericious" />
      <div>
        <h1 class="title">Users</h1>
        <p class="subtitle">Registered accounts and last-login activity. No live sessions — <em>last login</em> is the closest signal of who's active.</p>
      </div>
    </header>

    <section class="tiles">
      <div class="tile"><div class="n" id="total">–</div><div class="l">Total users</div></div>
      <div class="tile"><div class="n grape" id="active24">–</div><div class="l">Logged in · last 24h</div></div>
    </section>

    <section class="card">
      <div class="scroll">
        <table>
          <thead><tr>
            <th>Display name</th><th>Email</th><th>ZIP</th><th># Restaurants</th><th>Joined</th><th>Last login</th>
          </tr></thead>
          <tbody id="rows"><tr><td colspan="6" class="loading">Loading…</td></tr></tbody>
        </table>
      </div>
    </section>
  </div>

<script>
  const esc = (s) => String(s).replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));
  const fmt = (v) => v ? new Date(v).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '';
  fetch(${JSON.stringify(usersUrl)})
    .then(r => r.json())
    .then(users => {
      document.getElementById('total').textContent = users.length;
      const dayAgo = Date.now() - 24*60*60*1000;
      document.getElementById('active24').textContent =
        users.filter(u => u.lastLoginAt && new Date(u.lastLoginAt).getTime() >= dayAgo).length;
      const tbody = document.getElementById('rows');
      if (!users.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty">No users yet — create an account in the app.</td></tr>'; return; }
      tbody.innerHTML = users.map(u => (
        '<tr>' +
          '<td class="name">' + esc(u.displayName) + '</td>' +
          '<td class="mono">' + esc(u.email) + '</td>' +
          '<td class="mono">' + esc(u.zip) + '</td>' +
          '<td class="count">' + esc(u.restaurantCount) + '</td>' +
          '<td class="mono">' + esc(fmt(u.createdAt)) + '</td>' +
          '<td class="mono">' + (u.lastLoginAt ? esc(fmt(u.lastLoginAt)) : '<span class="never">never</span>') + '</td>' +
        '</tr>'
      )).join('');
    })
    .catch(() => { document.getElementById('rows').innerHTML = '<tr><td colspan="6" class="empty">Failed to load users.</td></tr>'; });
</script>
</body>
</html>`);
});

export default router;
