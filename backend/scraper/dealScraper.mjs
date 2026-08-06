/**
 * dealScraper.mjs
 * ---------------------------------------------------------------------------
 * A two-stage pipeline for finding DAY- or TIME-SPECIFIC restaurant deals
 * (happy hours, weekday specials, "Taco Tuesday", limited-time offers).
 *
 *   Stage 1  scrapeSites(urls)      -> Playwright pulls the *raw deal signal*
 *                                      off each site as a compact JSON array,
 *                                      sending the FEWEST possible tokens
 *                                      downstream (no markup, no nav/script).
 *   Stage 2  scanForDeals(scraped)  -> OpenAI reads that compact JSON, one
 *                                      site at a time, and extracts structured
 *                                      deals, which we print to the console.
 *
 * WHY two stages? Scraping is deterministic and cheap; LLM reading is the
 * expensive part. By stripping the page down to only deal-bearing text before
 * the model ever sees it, we cut token cost dramatically and keep the model
 * focused on signal instead of boilerplate.
 *
 * RUN (you provide the key — this file never reads .env itself):
 *   node --env-file=.env scraper/dealScraper.mjs
 *
 * SECURITY: The OpenAI key is read ONLY from process.env.OPENAI_API_KEY.
 * This file never opens, reads, or prints .env or any secret. Node's built-in
 * --env-file flag loads it into process.env for us — no dotenv dependency.
 * ---------------------------------------------------------------------------
 */

// playwright-extra wraps Playwright so we can attach plugins. The stealth
// plugin masks the many headless-Chromium fingerprints (navigator.webdriver,
// missing plugins, permissions quirks, etc.) that bot filters key on — this
// is what gets us past the hardened big-chain CDNs that block plain headless.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import OpenAI from 'openai';

// Apply stealth once at module load; every browser we launch inherits it.
chromium.use(stealth());

// ===========================================================================
// CONFIG
// ===========================================================================

// The OpenAI model used for the deal-extraction pass. Change this freely.
// A small, cheap model is plenty — the input is already pre-filtered signal.
const MODEL = "gpt-5.4-nano";

// A real desktop user-agent. Many sites serve stripped/blocked pages to
// obvious bots; presenting a normal browser UA gets us the real content.
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Politeness: wait this long between page loads so we don't hammer a host.
const RATE_LIMIT_MS = 1500;

// Hard cap on how long we wait for a single page before giving up.
const PAGE_TIMEOUT_MS = 30000;

// Single source of truth: the restaurant list lives in shared/restaurants.json
// (repo root) and is ALSO read by the frontend (frontend/data/restaurants.ts).
// Edit that JSON to change the scraper targets and the app options at once.
const RESTAURANTS = JSON.parse(
  readFileSync(new URL('../../shared/restaurants.json', import.meta.url), 'utf8'),
);
const SITES = RESTAURANTS.map((r) => r.url);

// ===========================================================================
// DEAL-SIGNAL PRE-FILTER
// ===========================================================================

// A node is worth keeping only if its own text — or its nearest heading
// ancestor — smells like a deal. This is the single biggest token saver:
// a menu page has hundreds of nodes but only a handful mention deals.
//
// Matches: happy hour, special(s), deal, daily, weekly, today, tonight,
// BOGO, discount, promo, "% off", a "$<digit>" price, any weekday
// abbreviation, and a clock time like "5pm" or "10:30 am".
// Broadened for MAXIMUM recall — we want every kind of deal, not just
// day/time-specific ones: free/BOGO, kids-eat-free, limited-time offers,
// national food days, holiday/seasonal specials, combos/value, coupons,
// and app/rewards-exclusive offers, plus the original day/time/price signals.
const DEAL_SIGNAL =
  /happy hour|special|free|bogo|buy one|buy 1|kids eat free|deal|daily|weekly|weekday|weekend|today|tonight|limited[- ]?time|for a limited|new |combo|bundle|value|meal deal|coupon|promo|promo code|offer|discount|save|%\s?off|\$\s?\d|\d+\s?(cents|¢)|national|holiday|celebrate|anniversary|seasonal|reward|points|member|membership|loyalty|sign[- ]?up|exclusive|redeem|gift[- ]?card|app[- ]?only|app exclusive|in[- ]the[- ]?app|mobile order|order online|online[- ]?only|digital|\b(mon|tue|wed|thu|fri|sat|sun)\b|\b\d{1,2}(:\d{2})?\s?(am|pm)\b/i;

// ===========================================================================
// STAGE 1 — THE SCRAPER
// ===========================================================================

/**
 * scrapeOne — the single reusable unit of scraping.
 * Input:  a URL string.
 * Output: { url, nodes: [{tag, text, href?, alt?}] }  (compact deal signal)
 *
 * All DOM work happens inside page.evaluate(), which runs in the browser
 * context. We return plain data (never DOM nodes / never outerHTML) so only
 * lightweight, token-cheap fields cross back into Node.
 */
async function scrapeOne(browser, url) {
  // Present as a realistic browser: full UA, a normal viewport, locale, and
  // the headers a real Chrome sends. This clears naive bot filters (it will
  // NOT beat hardened CDNs like Akamai that fingerprint headless deeply).
  const page = await browser.newPage({
    userAgent: USER_AGENT,
    locale: 'en-US',
    viewport: { width: 1280, height: 800 },
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Upgrade-Insecure-Requests': '1',
    },
  });
  try {
    // Load the DOM first. We do NOT wait on 'networkidle' as the primary
    // signal — analytics/chat/long-poll connections keep many restaurant sites
    // "busy" forever, which would time the whole scrape out. Instead:
    //   1) wait for DOM content,
    //   2) *try* for network idle but cap it short and IGNORE a timeout,
    //   3) give JS a brief settle window to render menus/specials.
    // Navigate with one retry — transient protocol/network hiccups are common
    // on big CDNs, and a second attempt often succeeds.
    //
    // waitUntil:'commit' resolves the moment the server's response is received,
    // WITHOUT waiting for DOMContentLoaded. Bot-challenge/heavy sites often
    // never fire DOMContentLoaded within the timeout; 'commit' lets us get in
    // and then wait softly for content below.
    let lastErr;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await page.goto(url, { waitUntil: 'commit', timeout: PAGE_TIMEOUT_MS });
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        if (attempt < 2) await page.waitForTimeout(1000);
      }
    }
    if (lastErr) throw lastErr;

    // Soft, best-effort waits for the DOM and network to settle. Each is
    // capped and its timeout ignored, so a stubborn site never blocks the run.
    await page.waitForLoadState('domcontentloaded', { timeout: 8000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {});
    // Give JS-heavy sites (deal carousels/menus render client-side) time to
    // paint before we read — improves recall on app/rewards-driven sites.
    await page.waitForTimeout(3500);

    // Pass the regex source into the browser (functions can't cross the
    // boundary, but strings can) and rebuild it there.
    const dealSignalSource = DEAL_SIGNAL.source;
    const dealSignalFlags = DEAL_SIGNAL.flags;

    const nodes = await page.evaluate(
      ({ signalSource, signalFlags }) => {
        const signal = new RegExp(signalSource, signalFlags);

        // ---- EXTRACTION CONTRACT (authoritative) ----------------------------

        // GRAB — text content of these elements (they hold ~all deal signal).
        // h1-h4 = section titles ("Happy Hour"), p = deal sentences,
        // li = bulleted specials/schedules, td/th = happy-hour grids,
        // span/strong/b/em/mark = inline prices/times/days emphasis isolates,
        // time = semantic datetime, button/a = CTA text + link to specials/PDF.
        const GRAB_TEXT = [
          'h1', 'h2', 'h3', 'h4',
          'p',
          'li',
          'td', 'th',
          'span', 'strong', 'b', 'em', 'mark',
          'time',
          'button', 'a',
          // Broadened: captions/labels/definition lists often hold deal copy.
          'label', 'small', 'figcaption', 'dd', 'dt',
        ];

        // STRIP — never send downstream (pure token waste / noise). We refuse
        // to read anything living inside these containers.
        const STRIP = [
          'script', 'style', 'noscript', 'svg', 'path', 'iframe', 'link',
          'meta', 'head',
          'nav', 'header', 'footer',
        ];

        // Rough heuristics for cookie/consent, newsletter, and app-install
        // modals — matched against id/class/aria so we can drop their subtrees.
        const NOISE_HINT =
          /cookie|consent|newsletter|subscribe|app-?install|modal|popup|banner/i;

        // Is `el` inside something we must strip? Walk ancestors once.
        function isInStripped(el) {
          for (let n = el; n; n = n.parentElement) {
            const tag = n.tagName ? n.tagName.toLowerCase() : '';
            if (STRIP.includes(tag)) return true;
            const bucket = `${n.id || ''} ${n.className || ''} ${n.getAttribute?.('aria-label') || ''}`;
            if (NOISE_HINT.test(bucket)) return true;
          }
          return false;
        }

        // Is `el` inside a container whose id/class/aria marks it a deal area?
        // Deal blocks often list plain lines ("2 for $5") under a "Deals" /
        // "Offers" / "Rewards" section — we keep those even without keywords.
        const DEAL_SECTION =
          /deal|offer|promo|special|reward|coupon|value|limited|feature|menu-?deal/i;
        function inDealSection(el) {
          for (let n = el.parentElement; n; n = n.parentElement) {
            const bucket = `${n.id || ''} ${n.className || ''} ${n.getAttribute?.('aria-label') || ''}`;
            if (DEAL_SECTION.test(bucket)) return true;
          }
          return false;
        }

        // The nearest heading ancestor/sibling text, so a bare price line
        // under a "Happy Hour" heading still counts as deal signal.
        function nearestHeadingText(el) {
          // Look upward for a heading, and also check preceding headings.
          let prev = el.previousElementSibling;
          while (prev) {
            if (/^h[1-4]$/i.test(prev.tagName)) return prev.textContent || '';
            prev = prev.previousElementSibling;
          }
          for (let n = el.parentElement; n; n = n.parentElement) {
            const h = n.querySelector?.('h1,h2,h3,h4');
            if (h) return h.textContent || '';
          }
          return '';
        }

        const WHITELIST_ATTR_TAGS = new Set(GRAB_TEXT);
        const out = [];
        const seen = new Set(); // for de-duplicating identical text nodes

        // Walk the whole document in source order (contract rule 5).
        const all = document.querySelectorAll('*');
        for (const el of all) {
          const tag = el.tagName.toLowerCase();

          // Only consider whitelisted tags, and never anything stripped.
          if (!WHITELIST_ATTR_TAGS.has(tag)) continue;
          if (isInStripped(el)) continue;

          // Collapse whitespace (contract rule 3).
          const text = (el.textContent || '').replace(/\s+/g, ' ').trim();

          // GRAB — attributes only. Deals are often inside images / aria.
          const href = tag === 'a' || tag === 'button' ? el.getAttribute('href') : null;
          const alt = tag === 'img' ? el.getAttribute('alt') : null;
          const aria = el.getAttribute('aria-label');
          const title = el.getAttribute('title');
          const datetime = el.getAttribute('datetime');

          // Drop empty nodes: no text AND no href/alt/datetime (contract STRIP).
          if (!text && !href && !alt && !datetime && !aria && !title) continue;

          // Relevance pre-filter (contract rule 4): keep only nodes whose text,
          // attributes, or nearest heading match a deal signal.
          const haystack = `${text} ${aria || ''} ${title || ''} ${alt || ''} ${datetime || ''}`;
          const keep =
            signal.test(haystack) ||
            signal.test(nearestHeadingText(el)) ||
            // Broadened: keep anything sitting inside a deals/offers/rewards
            // section, even if the individual line has no keyword.
            (text && inDealSection(el)) ||
            // Always keep links/buttons whose text hints at specials/menus so
            // Stage 1's one-hop follower can find deal subpages/PDFs.
            ((tag === 'a' || tag === 'button') &&
              /special|deal|menu|happy|offer|reward|promo|coupon/i.test(`${text} ${href || ''}`));
          if (!keep) continue;

          // One field per node (contract rule 2): {tag, text, href?, alt?}.
          const node = { tag, text };
          if (href) node.href = href;
          if (alt) node.alt = alt;
          if (aria) node.ariaLabel = aria;
          if (title) node.title = title;
          if (datetime) node.datetime = datetime;

          // De-duplicate identical text nodes (contract rule 3).
          const key = `${tag}|${text}|${href || ''}`;
          if (seen.has(key)) continue;
          seen.add(key);

          out.push(node);
        }
        return out;
      },
      { signalSource: dealSignalSource, signalFlags: dealSignalFlags },
    );

    // Attribution: tag every node with the exact page it came from and make its
    // href absolute. This is what lets Stage 2 set an ACCURATE sourceUrl (the
    // real deal page, e.g. /deals) instead of collapsing everything to the
    // homepage — and it survives the follow-merge below (each page's nodes keep
    // their own pageUrl).
    for (const n of nodes) {
      n.pageUrl = url;
      if (n.href) {
        try {
          n.href = new URL(n.href, url).toString();
        } catch {
          /* leave a malformed href as-is */
        }
      }
    }

    // -------- One-hop follow (contract rule 6) -----------------------------
    // Deal/coupon pages are the WHOLE POINT of the app — but big chains often
    // DON'T link them with obvious homepage text (Domino's "50% off" lives at
    // /deals and is never linked from the hero). So we do two things:
    //   1) ALWAYS try a few common deal paths on the same domain, and
    //   2) follow deal-labeled links BEFORE generic menu links.
    // This is the single biggest recall win for the deals the app exists for.
    const origin = new URL(url).origin;
    const stripHash = (u) => u.split('#')[0];

    // (1) Best-effort common deal pages. 404s/redirects fail gracefully.
    const DEAL_PATHS = [
      '/deals', '/coupons', '/offers', '/specials', '/menu/deals', '/deals-and-coupons',
      '/rewards', '/app', '/promotions', '/promos', '/promo', '/menu', '/gift-cards', '/gift-card',
    ];
    const guessedDealPages = DEAL_PATHS.map((p) => origin + p);

    // (2) Links the page exposed, split by how deal-relevant they are so real
    // deal/coupon links win over menu links when we hit the follow cap.
    const dealLinks = [];
    const menuLinks = [];
    for (const n of nodes) {
      if (!n.href) continue;
      let abs;
      try {
        abs = new URL(n.href, url).toString();
      } catch {
        continue;
      }
      if (!abs.startsWith(origin) || stripHash(abs) === url) continue;
      const hay = `${abs} ${n.text || ''}`;
      if (/deal|coupon|offer|special|happy|promo|%\s?off|save/i.test(hay) || abs.toLowerCase().endsWith('.pdf')) {
        dealLinks.push(abs);
      } else if (/menu/i.test(abs)) {
        menuLinks.push(abs);
      }
    }

    // Priority: real deal links → guessed deal pages → a couple menu links.
    const ordered = [...dealLinks, ...guessedDealPages, ...menuLinks]
      .map(stripHash)
      .filter((u) => u !== url);
    const uniqueTargets = [...new Set(ordered)].slice(0, 14);

    return { url, nodes, followTargets: uniqueTargets };
  } catch (err) {
    // Graceful failure (contract): record the error and let the caller move on.
    return { url, nodes: [], error: String(err && err.message ? err.message : err) };
  } finally {
    await page.close();
  }
}

/**
 * scrapeSites — scrape a LIST of URLs, one by one.
 * Input:  array of restaurant URLs.
 * Output: array of { url, nodes: [...] }  (plus {error} on failed sites).
 *
 * Sequential on purpose: it's polite (rate-limited), easier to debug, and
 * avoids getting the shared IP blocked by hammering hosts in parallel.
 */
export async function scrapeSites(urls) {
  if (!urls || urls.length === 0) {
    console.log('[scrapeSites] No URLs provided — add some to SITES.');
    return [];
  }

  // Headless Chromium. `--disable-http2` forces HTTP/1.1: several big-chain
  // CDNs (Akamai etc.) fail HTTP/2 negotiation with headless Chromium and
  // throw net::ERR_HTTP2_PROTOCOL_ERROR — HTTP/1.1 avoids that entirely.
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-http2'],
  });
  const results = [];

  try {
    for (const url of urls) {
      console.log(`[scrapeSites] Scraping: ${url}`);

      // Respect robots.txt: skip paths the site disallows for our UA.
      const allowed = await isAllowedByRobots(browser, url);
      if (!allowed) {
        console.log(`[scrapeSites] robots.txt disallows: ${url} — skipping.`);
        results.push({ url, nodes: [], error: 'blocked by robots.txt' });
        continue;
      }

      const primary = await scrapeOne(browser, url);

      // One-hop follow: scrape the specials/menu/PDF subpages we found and
      // merge their nodes into the same site record (traceability preserved
      // because each node keeps its own href and we keep the parent url).
      for (const target of primary.followTargets || []) {
        await sleep(RATE_LIMIT_MS);
        const allowedChild = await isAllowedByRobots(browser, target);
        if (!allowedChild) continue;
        console.log(`[scrapeSites]   ↳ following: ${target}`);
        const child = await scrapeOne(browser, target);
        primary.nodes.push(...(child.nodes || []));
      }

      // Drop the internal followTargets field before handing data downstream.
      delete primary.followTargets;
      results.push(primary);

      await sleep(RATE_LIMIT_MS); // politeness between sites
    }
  } finally {
    await browser.close();
  }

  return results;
}

// ===========================================================================
// STAGE 2 — THE AI DEAL EXTRACTOR
// ===========================================================================

// The exact JSON contract we ask the model to fill. Kept here as documentation
// AND injected into the prompt so the model can't drift from our shape.
//
// Each deal MUST carry:
//   restaurant       -> the restaurant/brand name
//   dealName         -> the deal's MAIN name, e.g. "3 for Me", "Taco Tuesday"
//   description       -> short human description of the offer
//   daysOfWeek       -> which days it runs, e.g. ["Mon","Tue"] or ["Daily"]
//   startTime        -> time of day it starts (e.g. "15:00" or "3pm"), or null
//   endTime          -> time of day it ends, or null
//   requiresRewards  -> true if a loyalty/rewards membership is required
//   location         -> address/branch/city if stated, else null
//   sourceUrl        -> the page URL the deal came from (traceability)
const DEAL_SHAPE_DOC = `{
  "restaurant": string,
  "dealName": string,          // main deal name, e.g. "3 for Me"
  "description": string,
  "category": string,          // one of: day | time | limited-time
  "daysOfWeek": string[],      // e.g. ["Mon","Tue"]; [] if not day-of-week based
  "startTime": string | null,  // time-of-day start, e.g. "15:00" or "3pm"; null if none
  "endTime": string | null,    // time-of-day end; null if none
  "validFrom": string | null,  // START date of a dated/limited promo (e.g. "9/16" of a 9/16–9/20 run); null otherwise
  "validThrough": string | null, // END date for limited-time promos, e.g. "8/2" or "9/20"; null otherwise
  "requiresRewards": boolean,  // loyalty/rewards/app membership required?
  "onlineOrderOnly": boolean,  // redeemable ONLY via online/app/promo-code order (not in-store)?
  "sourceUrl": string
}`;

/**
 * scanForDeals — read each scraped site with OpenAI and print its deals.
 * Input:  the array returned by scrapeSites.
 * Output: array of { url, deals: [...] } (also printed to the console).
 *
 * The model is told to extract ONLY day/time-specific deals and to stay
 * strictly grounded in the provided text — empty list if none, never invented.
 */
export async function scanForDeals(scrapedResults) {
  if (!scrapedResults || scrapedResults.length === 0) {
    console.log('[scanForDeals] Nothing to scan.');
    return [];
  }

  // Reads process.env.OPENAI_API_KEY. We never touch the key ourselves.
  if (!process.env.OPENAI_API_KEY) {
    console.error(
      '[scanForDeals] OPENAI_API_KEY is not set. Create scraper/.env with ' +
        'OPENAI_API_KEY=... and run with:  node --env-file=.env scraper/dealScraper.mjs',
    );
    return [];
  }
  const openai = new OpenAI();

  const allDeals = [];

  // One site at a time (matches the "one by one" requirement).
  for (const site of scrapedResults) {
    if (site.error) {
      console.log(`\n=== ${site.url} ===\n  (skipped — scrape error: ${site.error})`);
      continue;
    }
    if (!site.nodes || site.nodes.length === 0) {
      console.log(`\n=== ${site.url} ===\n  No deal-candidate content found.`);
      continue;
    }

    // TIME-ANCHORED only: keep deals of the day, time-of-day deals, holiday/
    // national-day sales, dated/limited promos, and reward BONUS promos tied to a
    // time period (earn 2x points this weekend). EXCLUDE point redemptions/purchases
    // (spend/have N points) and evergreen perks with no day/time/date anchor.
    const system =
      'You extract restaurant DEALS for a "deal of the day" app. A deal QUALIFIES only ' +
      'if it has (a) a CONCRETE value/benefit — a specific % off, a specific price or ' +
      '$ off, buy-one-get-one, a free item, or an EARNED bonus/reward — AND (b) a TIME ' +
      'ANCHOR: specific weekday(s) or "today/this day", a time-of-day window, or a ' +
      'date/date-range (holiday, seasonal, or limited-time). If a candidate has NO day, ' +
      'time, or date anchor, OMIT it. ' +
      'INCLUDE: item/deal of the day and weekday deals ("Taco Tuesday $1 tacos", "today ' +
      'only 20% off"); time-of-day/happy-hour deals; HOLIDAY or NATIONAL-DAY sales with a ' +
      'real offer ("National Pizza Day: $5 large", "July 4th: free dessert with $20"); ' +
      'currently-running dated/limited promos; and reward/BONUS promos that GIVE something ' +
      'tied to a time period ("double/2x/bonus points this weekend or on Tuesdays", "spend ' +
      '$X during [period], get a $Y reward/free item"). ' +
      'EXCLUDE: POINT REDEMPTIONS / POINT PURCHASES — anything requiring you to SPEND or ' +
      'HAVE a number of points ("50% off for 600 points", "redeem 400 points for a free ' +
      'drink", "use your points"); evergreen member/app perks with NO day/time/holiday/date ' +
      'anchor ("10% off for members", "app-only $5 meal", "sign up and get a free drink"); ' +
      'regular full-price menu; and pure marketing / "new item" hype with no offer. ' +
      'PIVOTAL RULE: EARNING bonus points/rewards during a specific day or period is ' +
      'INCLUDED; SPENDING or REDEEMING points for a discount is EXCLUDED. A free rewards ' +
      'MEMBERSHIP being required is fine (requiresRewards=true) — only a required POINT ' +
      'BALANCE/redemption disqualifies. Use ONLY the provided nodes. Never invent names, ' +
      'days, times, prices, dates, or URLs. Return strict JSON only.';

    const user =
      `Restaurant homepage: ${site.url}\n` +
      `Each scraped node below carries a "pageUrl" (the exact page it was found on) and, for links, an absolute "href".\n\n` +
      `Return JSON of the form { "deals": Deal[] } where each Deal is:\n${DEAL_SHAPE_DOC}\n\n` +
      `Rules:\n` +
      `- Include a deal ONLY if it has a CONCRETE value/benefit (% off, $ off/price, BOGO, free item, or an EARNED bonus/reward) AND a TIME ANCHOR: specific weekday(s) or "today/this day", a time-of-day window, OR a date/date-range (holiday/seasonal/limited). If it has NO day, time, or date anchor, OMIT it.\n` +
      `- INCLUDE: deal-of-the-day / weekday deals, time-of-day/happy-hour deals, holiday or national-day sales with a real offer, dated/limited promos running now, and reward/BONUS promos that GIVE something during a time period ("2x/double/bonus points this weekend or on Tuesdays", "spend $X during [period], get $Y reward/free item").\n` +
      `- EXCLUDE point redemptions / point purchases — anything requiring you to SPEND or HAVE a number of points (e.g. "50% off for 600 points", "redeem 400 points for a free drink", "use your points"). Also EXCLUDE evergreen member/app perks with no day/time/holiday/date anchor ("10% off for members", "app-only $5 meal"). EARNING bonus points during a time window is INCLUDED; SPENDING/redeeming points is EXCLUDED.\n` +
      `- category MUST be exactly one of: "day" (weekday(s) or a specific day), "time" (time-of-day window), "limited-time" (dated/holiday/seasonal/limited promo OR a dated bonus-points period). Holiday/national-day and dated bonus periods → "limited-time" with validFrom/validThrough (or "day" if it recurs weekly). Every kept deal MUST have a non-empty daysOfWeek, a time window, OR a validFrom/validThrough date.\n` +
      `- The description MUST include the concrete value (e.g. "50% off", "2x points") and the time anchor (days/times/holiday/date) as stated.\n` +
      `- daysOfWeek = the weekday(s) if stated, else [].\n` +
      `- Dated promos: if a promo runs a DATE RANGE (e.g. "9/16–9/20" or "now through 9/20"), set validFrom to the START ("9/16") and validThrough to the END ("9/20"). If only an end date is stated, set validThrough and leave validFrom null. Never invent a date not in the text.\n` +
      `- startTime/endTime: if a time-of-day window is stated, output BOTH ends in 24-HOUR "HH:MM" (convert "3pm"->"15:00", "11 AM"->"11:00", "3:30pm"->"15:30"). Output null ONLY when no time-of-day is stated. NEVER output am/pm text or a bare hour.\n` +
      `- sourceUrl MUST be the exact page where THIS deal appears: use that deal's node "pageUrl", or a deal-specific absolute "href" that points to the deal's own page. NEVER default to the homepage unless the deal genuinely appears on the homepage.\n` +
      `- requiresRewards = true if a free loyalty/rewards MEMBERSHIP or the app is required (that's fine, still included) — but NEVER include a deal that requires spending/having a POINT BALANCE.\n` +
      `- onlineOrderOnly = true if the deal is redeemable ONLY via online ordering, the app, or a promo/coupon code (not in-store); else false.\n` +
      `- Never guess a value, day, time, date, or URL not present in the nodes. Empty list if nothing qualifies.\n\n` +
      `Scraped nodes (JSON):\n${JSON.stringify(site.nodes)}`;

    let deals = [];
    try {
      const completion = await openai.chat.completions.create({
        model: MODEL,
        temperature: 0, // deterministic extraction, no creative drift
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      });
      const raw = completion.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(raw);
      deals = Array.isArray(parsed.deals) ? parsed.deals : [];
    } catch (err) {
      console.log(`\n=== ${site.url} ===\n  AI scan failed: ${String(err && err.message ? err.message : err)}`);
      continue;
    }

    // Print deals to the console for testing (console output only).
    console.log(`\n=== ${site.url} ===`);
    if (deals.length === 0) {
      console.log('  No day/time-specific deals found.');
    } else {
      for (const d of deals) {
        const days = Array.isArray(d.daysOfWeek) && d.daysOfWeek.length ? d.daysOfWeek.join(', ') : '—';
        const time =
          d.startTime || d.endTime ? `${d.startTime || '?'}–${d.endTime || '?'}` : '—';
        console.log(
          `  • [${d.category || '?'}] ${d.dealName || '(unnamed)'} @ ${d.restaurant || '(restaurant?)'}\n` +
            `      days: ${days} | time: ${time} | thru: ${d.validThrough || '—'}\n` +
            `      rewards required: ${d.requiresRewards ? 'YES' : 'no'}\n` +
            `      ${d.description || ''}`,
        );
      }
    }

    allDeals.push({ url: site.url, deals });
  }

  return allDeals;
}

// ===========================================================================
// HELPERS
// ===========================================================================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Minimal robots.txt check: fetch /robots.txt and see whether the target path
 * is Disallowed for '*' (or our UA). Best-effort — on any failure we allow,
 * matching typical scraper behavior, but we DO honor explicit Disallow rules.
 */
async function isAllowedByRobots(browser, targetUrl) {
  try {
    const { origin, pathname } = new URL(targetUrl);
    const page = await browser.newPage({ userAgent: USER_AGENT });
    let body = '';
    try {
      const resp = await page.goto(`${origin}/robots.txt`, {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      });
      body = resp && resp.ok() ? await resp.text() : '';
    } finally {
      await page.close();
    }
    if (!body) return true; // no robots.txt -> allowed

    // Parse the '*' user-agent group's Disallow lines (simple, common case).
    const lines = body.split('\n').map((l) => l.trim());
    let inStar = false;
    const disallows = [];
    for (const line of lines) {
      if (/^user-agent:/i.test(line)) {
        inStar = /:\s*\*/.test(line);
      } else if (inStar && /^disallow:/i.test(line)) {
        const path = line.split(':')[1]?.trim();
        if (path) disallows.push(path);
      }
    }
    return !disallows.some((rule) => rule !== '' && pathname.startsWith(rule));
  } catch {
    return true; // on any error, don't block the run
  }
}

// ===========================================================================
// DIRECT-RUN ENTRY
// ===========================================================================
// Only runs when you execute this file directly (not when it's imported).
// Wires the two stages together: scrape the SITES list, then AI-scan them.
if (import.meta.url === `file://${process.argv[1]}`) {
  scanForDeals(await scrapeSites(SITES)).then(() => {
    console.log('\n[done]');
  });
}
