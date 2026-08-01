# Restaurant deal scraper

Two-stage pipeline that finds **day/time-specific** restaurant deals.

1. `scrapeSites(urls)` — Playwright (headless Chromium) pulls only deal-bearing
   text from each site as compact JSON (no markup, no nav/script/footer).
2. `scanForDeals(scraped)` — OpenAI reads that JSON one site at a time and
   prints structured deals to the console.

## Setup

```bash
npm install                       # installs deps (already added: playwright, openai)
npx playwright install chromium   # one-time browser download
```

Create `scraper/.env` yourself and add your key (this code never reads the file
directly — Node's `--env-file` loads it):

```
OPENAI_API_KEY=sk-...
```

## Run

1. Open `scraper/dealScraper.mjs` and paste restaurant URLs into the `SITES` array.
2. Run:

```bash
node --env-file=.env scraper/dealScraper.mjs
```

Deals print to the console per site. Change `OPENAI_MODEL` at the top of the
file to swap models.
