/**
 * Admin dashboard — registered users + last-login activity.
 *
 * There are NO server-side sessions, so this shows REGISTERED accounts plus a
 * `lastLoginAt` timestamp (set on each login) as a proxy for "who's logged in".
 * Mounted at /admin by server.mjs.
 *
 * Protection: if process.env.ADMIN_KEY is set, both routes require ?key=<it>
 * (403 otherwise). If it is unset, the dashboard is OPEN — a warning is logged.
 * (We read process.env only — never the .env file.)
 */
import { Router } from 'express';

import { prisma } from './db.mjs';

const router = Router();

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

// HTML dashboard — self-contained (inline CSS + JS, no external libraries).
router.get('/', gate, (req, res) => {
  const key = process.env.ADMIN_KEY ? encodeURIComponent(String(req.query.key ?? '')) : '';
  const usersUrl = key ? `/admin/api/users?key=${key}` : '/admin/api/users';
  res.type('html').send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Calendericious · Admin</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, system-ui, Segoe UI, Roboto, sans-serif;
         background: #FFF6EC; color: #2B1B2E; }
  header { padding: 24px 28px 8px; }
  h1 { margin: 0; font-size: 22px; }
  .sub { color: #6b5b66; font-size: 14px; margin-top: 4px; }
  .tiles { display: flex; gap: 16px; padding: 16px 28px; flex-wrap: wrap; }
  .tile { background: #fff; border-radius: 14px; padding: 16px 20px; min-width: 150px;
          box-shadow: 0 2px 8px rgba(0,0,0,.06); }
  .tile .n { font-size: 30px; font-weight: 800; color: #FF5A36; }
  .tile .l { font-size: 12px; text-transform: uppercase; letter-spacing: .5px; color: #6b5b66; }
  .wrap { padding: 8px 28px 40px; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 14px;
          overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
  th, td { text-align: left; padding: 12px 14px; font-size: 14px; border-bottom: 1px solid #f0e6da; }
  th { background: #FFC24B; color: #2B1B2E; font-size: 12px; text-transform: uppercase; letter-spacing: .5px; }
  tr:last-child td { border-bottom: none; }
  .muted { color: #a08e9a; }
  @media (prefers-color-scheme: dark) {
    body { background: #201320; color: #f3e9ef; }
    .tile, table { background: #2c1c2c; box-shadow: none; }
    th { background: #6C4AB6; color: #fff; }
    th, td { border-color: #3a2a3a; }
  }
</style>
</head>
<body>
  <header>
    <h1>🍴 Calendericious — Users</h1>
    <div class="sub">Registered accounts and last-login activity. (No live sessions — <em>last login</em> is the closest signal.)</div>
  </header>
  <div class="tiles">
    <div class="tile"><div class="n" id="total">–</div><div class="l">Total users</div></div>
    <div class="tile"><div class="n" id="active24">–</div><div class="l">Logged in · last 24h</div></div>
  </div>
  <div class="wrap">
    <table>
      <thead><tr><th>Display name</th><th>Email</th><th>ZIP</th><th># Restaurants</th><th>Joined</th><th>Last login</th></tr></thead>
      <tbody id="rows"><tr><td colspan="6" class="muted">Loading…</td></tr></tbody>
    </table>
  </div>
<script>
  const fmt = (v) => v ? new Date(v).toLocaleString() : '—';
  fetch(${JSON.stringify(usersUrl)})
    .then(r => r.json())
    .then(users => {
      document.getElementById('total').textContent = users.length;
      const dayAgo = Date.now() - 24*60*60*1000;
      document.getElementById('active24').textContent =
        users.filter(u => u.lastLoginAt && new Date(u.lastLoginAt).getTime() >= dayAgo).length;
      const tbody = document.getElementById('rows');
      if (!users.length) { tbody.innerHTML = '<tr><td colspan="6" class="muted">No users yet.</td></tr>'; return; }
      tbody.innerHTML = users.map(u => {
        const cells = [u.displayName, u.email, u.zip, u.restaurantCount, fmt(u.createdAt), u.lastLoginAt ? fmt(u.lastLoginAt) : '<span class="muted">never</span>'];
        return '<tr>' + cells.map((c,i) => '<td>' + (i===5 ? c : String(c).replace(/[<>&]/g, s=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[s]))) + '</td>').join('') + '</tr>';
      }).join('');
    })
    .catch(() => { document.getElementById('rows').innerHTML = '<tr><td colspan="6" class="muted">Failed to load users.</td></tr>'; });
</script>
</body>
</html>`);
});

export default router;
