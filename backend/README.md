# Calendericious backend (API gateway)

Express server for the Calendericious app. **Scaffold stage** — endpoints are
wired but return `501 Not Implemented`. No database, no auth, no fake data yet.
The scraper lives here (`backend/scraper/`).

## Run

```bash
# from the repo root
node --env-file=.env backend/server.mjs
# → http://localhost:4000/health  => { "ok": true }
```

Env: `PORT` (default 4000), `OPENAI_API_KEY` (used by the daily deals job).

## Endpoints (all 501 placeholders except /health)

| Method | Path | Purpose |
|---|---|---|
| GET  | `/health` | Liveness — returns `{ ok: true }` |
| POST | `/api/users` | Create account |
| POST | `/api/auth/login` | Log in |
| GET  | `/api/users/:id/photo` | Get profile photo |
| POST | `/api/users/:id/photo` | Set profile photo |
| GET  | `/api/users/:id/zip` | Get ZIP |
| PUT  | `/api/users/:id/zip` | Update ZIP |
| GET  | `/api/deals` | Get deals (`?zip`) |
| PUT  | `/api/users/:id/restaurants` | Set selected restaurants |

## Structure

```
backend/
  server.mjs            express app, /health, routes, 404/error, cron start
  routes/               one file per resource (thin 501 stubs)
  jobs/dealsJob.mjs     node-cron daily deals refresh (runs the scraper)
  middleware/auth.mjs   pass-through auth placeholder
  scraper/              Playwright + OpenAI deal scraper (batch)
```

## Scraper (batch, run manually)

```bash
node --env-file=.env backend/scraper/dealScraper.mjs
```

## Next (not built yet)

Database, real auth (hash + token), photo object storage, deal persistence +
URL sourcing for the cron, and locking CORS to the app's origin.
