# Calendericious

A mobile app that puts **restaurant deals on a calendar**: happy hours, "Taco Tuesday", BOGO offers, limited-time promos and birthday freebies, filtered to the chains you actually care about and that are near you.

Built as a full-stack TypeScript/JavaScript project: an Expo (React Native) app talking to an Express + Prisma + PostgreSQL API.

## Features

- **Deal calendar**: a month view with a per-day detail screen. Deals recur by weekday and time window, or run between dates for limited-time promos.
- **Pick your restaurants**: choose the chains and food vendors you follow, and see only their deals.
- **Near me**: filter by distance (10 / 25 / 50 miles) using device location and a haversine distance calculation.
- **Birthday deals**: store a month and day, and see freebies in a day, week or month window around it.
- **Crowdsourced deals**: signed-in users submit deals they've found, and like or dislike others'. Submitters can delete their own.
- **Address to business lookup**: when adding a new vendor, a Google Places (New) search turns a typed address into the real businesses at that address.
- **Accounts**: email and password sign-up, session login, password reset by email, profile photo, and rate-limited auth endpoints.
- **Admin dashboard**: a key-protected `/admin` page to review users and add restaurants or food vendors.

## Tech stack

| Layer | Tools |
|---|---|
| App | Expo SDK 57, React Native, TypeScript, Expo Router (file-based routing), React Context, Expo SecureStore |
| API | Node.js, Express 5, CORS allowlist, custom in-memory rate limiter |
| Data | PostgreSQL, Prisma 7 (`@prisma/adapter-pg`) |
| Services | Google Places API (New), Resend (email) |
| Tests | Node's built-in test runner (`node:test`), no extra dependencies |

## Project layout

```
backend/    Express API: routes/, middleware/, lib/, Prisma schema + migrations, import scripts
frontend/   Expo app source: app/ (screens), components/, context/, utils/, data/api.ts
tests/      Unit tests for backend libs/middleware and frontend utils
```

One `package.json` at the repo root serves both the app and the API. `app.json` points Expo Router at `frontend/app`.

## Security notes

- Passwords are hashed with **scrypt** (per-user random salt, constant-time compare). Plaintext is never stored.
- Sessions use a random 256-bit opaque token. Only its **SHA-256 hash** is stored server-side, and the token lives in the device keychain (SecureStore).
- `/users/:id/*` routes check that the logged-in user owns `:id`, which prevents IDOR.
- Auth endpoints are rate limited. Cross-origin browser access is denied unless explicitly allowed via `CORS_ORIGINS`.
- Third-party API keys stay on the server and are never shipped in the app bundle.

## Getting started

**Prerequisites:** Node 22.18+ (Node 24 recommended), a PostgreSQL database, and the Expo Go app or an iOS/Android simulator.

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env        # then fill in DATABASE_URL and the other values

# 3. Set up the database
npx prisma generate
npx prisma migrate deploy

# 4. Start the API (http://localhost:4000/health -> { "ok": true })
npm run server

# 5. In a second terminal, start the app
npm start                   # press i (iOS sim), a (Android), or scan the QR in Expo Go
```

The app finds the API automatically from the Expo dev server's host, so a phone on the same Wi-Fi works with no edits. Set `EXPO_PUBLIC_API_URL` to point at a deployed backend instead.

### Environment variables

See [`.env.example`](.env.example). `DATABASE_URL` is required. `ADMIN_KEY` is needed for `/admin`, `GOOGLE_MAPS_API_KEY` for address lookup, and `RESEND_API_KEY` / `RESEND_FROM` for password-reset email.

## Tests

```bash
npm test
```

Covers password hashing, the rate limiter, the ownership-check middleware, session token hashing, and the birthday, date and distance helpers.

## API overview

| Area | Endpoints |
|---|---|
| Auth | `POST /api/users`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` |
| Deals | `GET /api/deals`, `POST /api/deals`, `DELETE /api/deals/:id`, `POST /api/deals/:id/like`, `POST /api/deals/:id/dislike` |
| Vendors | `GET /api/restaurants`, `GET /api/food-vendors`, `POST` to either, `PUT /api/users/:id/restaurants`, `PUT /api/users/:id/food-vendors` |
| Profile | `PUT /api/users/:id/birthday`, `PUT /api/users/:id/near-me-radius`, `POST /api/users/:id/photo` |
| Places | `POST /api/places/geocode-verify` |

## License

See [LICENSE](LICENSE).
