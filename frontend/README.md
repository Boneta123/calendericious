# Calendericious — Frontend

React Native (Expo) app: a calendar of **day/time-specific restaurant deals**
filtered to chains near the user's ZIP. USA-only. This is the frontend only —
it currently runs on mock data; the backend (`../backend/`) is scaffolded but
not yet wired in.

## Run

```bash
# from the repo ROOT (app.json + package.json live there; routes live in frontend/app)
npx expo start        # press i (iOS sim) / a (Android) / scan QR (Expo Go)
```

> The Expo project root stays at the repo root. `app.json` points Expo Router at
> `frontend/app` via the `expo-router` plugin `root` option, and a single shared
> `package.json` / `node_modules` serves both frontend and backend.

## Tech

Expo SDK 57 · React Native · TypeScript · Expo Router (file-based) · React Context.
No backend calls yet — auth and data are in-memory / local.

## Design language ("the deal almanac")

- **Palette** (`theme/theme.ts`): cream `#FFF6EC`, tomato `#FF5A36`, mustard
  `#FFC24B`, basil `#3DA35D`, grape `#6C4AB6`, plum ink `#2B1B2E`.
- **Fonts:** Baloo 2 (display) · Nunito (body) · Space Mono (times/ZIP).
- **Signature:** deal **coupons** with a perforated tear-edge + receipt-style
  mono times.
- **Brand:** logo art says "Calendericious"; some code ids still say "DealDay".

## Routes (`app/`)

| File | Purpose |
|---|---|
| `_layout.tsx` | Root: fonts, providers (Auth + RestaurantSelection), Stack |
| `index.tsx` | Auth gate → `/(app)` or `/(auth)/login` |
| `(auth)/login.tsx` | Landing — email + password, logo + food-friends hero |
| `(auth)/signup.tsx` | displayName + email + password + US ZIP; after submit → required restaurant onboarding popup |
| `(app)/_layout.tsx` | Protected stack (redirects to login if no user) |
| `(app)/index.tsx` | Calendar home — current-month grid (fills page), ZIP chip, food-character scatter |
| `(app)/day/[date].tsx` | Day detail — that day's deals as time-ordered coupons |
| `(app)/profile.tsx` | Photo picker, change ZIP, "Choose your restaurants", log out |

## Components (`components/`)

Buttons/inputs: `PrimaryButton`, `TextField`, `Badge`.
Deals: `Coupon` (signature), `TimeWindowBar`, `CalendarGrid`.
Modals: `ZipModal`, `RestaurantPickerModal` (edit + onboarding modes).
Brand/decor: `BrandLogo`, `FoodScatter`, `RestaurantLogo` (Google-favicon logo + letter fallback).

## State (`context/`)

- `AuthContext` — in-memory `user {email, displayName, zip}`; no real auth.
- `RestaurantSelectionContext` — in-memory set of chosen restaurant ids (shared
  by signup onboarding + profile). Calendar filtering by it is not wired yet.

## Data (`data/`)

- `types.ts` — `Chain`, `Deal`, `Branch`, `ResolvedDeal`, `Weekday`.
- `mockData.ts` — sample deals + `resolveDealsForDate()`. Delete when backend lands.
- `restaurants.ts` — builds `RESTAURANTS` (name, host, favicon `logoUrl`,
  `pickRandom`) from **`../../shared/restaurants.json`** — the single source of
  truth shared with the backend scraper. Edit that JSON, not this file.

## Utils (`utils/`)

- `zip.ts` — `isValidUsZip()` (5-digit US range), `sanitizeZipInput()`.
- `date.ts` — `buildMonthGrid()`, `toDateKey/fromDateKey`, `formatClock`, etc.

## Assets (`assets/foodCharacters/`)

2D cartoon food mascots + Calendericious logo. `index.ts` is a static-`require`
registry (Metro needs static paths).

## Status / TODO

Mock data only. Next: point the data layer at the backend API (`GET /api/deals`,
etc.) instead of `mockData.ts`; apply the restaurant selection to filter the
calendar; real auth + persistence.
