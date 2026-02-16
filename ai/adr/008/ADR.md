# ADR-008: Multi-Location Expansion via AI-Powered Mosque Scraping

**Status:** Proposed
**Date:** 2026-02-16
**Decision Makers:** muji

---

## Context

### Current State of the Application

Athan.uk is a React Native (Expo) mobile app that provides Muslim prayer times exclusively for London, UK. It queries a single API (`londonprayertimes.com`) and displays daily prayer times with real-time countdowns, offline caching, and customizable notifications.

The app's architecture is deliberately simple:

```
London Prayer Times API → MMKV Cache → Jotai Atoms → UI (countdown, notifications, display)
```

London is hardcoded throughout the codebase — in **20+ places across 9 files**:

| Component            | Hardcoding                                     | File(s)                                                                                                                                          |
| -------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| API endpoint         | `https://www.londonprayertimes.com/api/times`  | `api/config.ts`                                                                                                                                  |
| Timezone             | `'Europe/London'` in `createLondonDate()`      | `shared/time.ts` (lines 15-19, 36-41)                                                                                                            |
| All date operations  | Every date function calls `createLondonDate()` | `shared/time.ts` (20+ functions), `stores/schedule.ts`, `stores/sync.ts`, `stores/countdown.ts`, `stores/notifications.ts`, `stores/database.ts` |
| Islamic day boundary | `getLondonHours()` hardcodes London TZ         | `shared/prayer.ts` (lines 124-127)                                                                                                               |
| Database keys        | `prayer_YYYY-MM-DD` assumes single location    | `stores/database.ts` (lines 125-144)                                                                                                             |
| API year detection   | Uses London date for year                      | `api/client.ts` (line 13)                                                                                                                        |
| Year boundary sync   | January 1st detection in London TZ             | `stores/sync.ts` (lines 49-62)                                                                                                                   |
| Mock data            | `city: 'london'`                               | `mocks/simple.ts`, `mocks/full.ts`                                                                                                               |

**Key dependencies and constraints:**

- React Native 0.81.5, Expo 54, TypeScript strict mode
- Jotai for state, MMKV for storage, date-fns-tz for timezone handling
- All dates use `createLondonDate()` which wraps `formatInTimeZone(date, 'Europe/London', ...)`
- Prayer data keyed as `prayer_YYYY-MM-DD` in MMKV (no location dimension)
- Notification scheduling uses London timezone for all trigger calculations

### The Problem

The app is limited to London. Users who travel or live outside London cannot use it. Expanding to other locations requires:

1. A new data source (the London API only serves London)
2. Removing all hardcoded London assumptions
3. A way to discover prayer times for arbitrary locations

### Origin of This ADR

This ADR captures the ideation and architectural discussion that began with `future.txt` (committed to the repo root), which outlined the initial vision for multi-location expansion. The vision was then refined through discussion, prompt engineering for the AI extraction system, and review of alternative approaches.

Both source documents have been moved into `ai/adr/008/` alongside this ADR and are also preserved verbatim as appendices below. This ADR is the single source of truth for this vision.

---

## Decision

### High-Level Architecture

Expand the app to serve prayer times for any UK mosque by combining:

1. **User-triggered mosque discovery** — users search or the app detects their location
2. **Google Maps Places API** — finds the nearest mosque(s) by lat/long
3. **AI-powered website scraping** — an LLM extracts prayer times from the mosque's website
4. **Demand-driven caching** — scraping only happens when a user requests data, cached results served to subsequent users until expiry
5. **Public data repository** — scraped prayer times stored in a public repo, growing organically

The mosque's website is the **single source of truth**. No calculation-based fallback. If scraping fails for a mosque, the system tries the next closest mosque. This is a deliberate product decision: the value proposition is mosque-specific times, not calculated approximations.

### Scope

**Phase 1: UK only.** English-language mosque websites. The alias matching, prompt engineering, and testing are scoped to UK mosques (~1,800 total, ~900 estimated with usable websites).

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          MOBILE APP (React Native)                       │
│                                                                          │
│  1. Detect location / user searches for area                             │
│  2. Check jsDelivr CDN for cached mosque data (no backend hit)           │
│  3. If data exists and is fresh → display it (zero cost)                 │
│  4. If no data or stale → hit backend to trigger scrape                  │
│  5. Cache in MMKV, display with existing UI                              │
│  6. Schedule notifications using local timezone                          │
└──────────────┬──────────────────────────────────┬───────────────────────┘
               │ (cache miss only)                │ (reads)
               ▼                                  ▼
┌──────────────────────────────────┐  ┌───────────────────────────────────┐
│   BACKEND (Cloud Functions)       │  │  jsDelivr CDN                     │
│                                   │  │  cdn.jsdelivr.net/gh/             │
│   Only hit on cache miss:         │  │    {user}/{repo}@main/...         │
│   1. Find nearest mosque          │  │                                   │
│   2. Scrape & validate            │  │  Global edge caching,             │
│   3. Commit to GitHub repo        │  │  no rate limits, free             │
│   4. Return data to app           │  │                                   │
│                                   │  │  Mirrors the public GitHub repo   │
│   ┌───────────────────────────┐   │  └───────────────┬───────────────────┘
│   │    SCRAPING PIPELINE      │   │                  │ (mirrors)
│   │                           │   │                  ▼
│   │  1. Google Maps Places    │   │  ┌───────────────────────────────────┐
│   │  2. Homepage Fetch        │   │  │  DATA STORE (Public GitHub Repo)  │
│   │     (Crawl4AI/Playwright) │   │  │                                   │
│   │  3. Site Navigation       │   │  │  JSON files per mosque,           │
│   │     (Navigation LLM +    │   │  │  organized by region.             │
│   │      Crawl4AI browser)   │   │──│                                   │
│   │  4. Date Verification     │   │  │  This IS the primary data store.  │
│   │  5. Pre-processing        │   │  │                                   │
│   │     (Markdown conversion) │   │  │  Backend writes here; app reads   │
│   │  6. LLM Extraction        │   │  │  via jsDelivr CDN.                │
│   │     (Opus 4.6)            │   │  │                                   │
│   │  7. Post-processing       │   │
│   │     & Validation          │   │
│   └───────────────────────────┘   │
│                                   │
└───────────────────────────────────┘
```

### Data Collection Strategy: Demand-Driven Caching

All scraping is triggered by user requests. There is no scheduled background scraping. This ensures costs are proportional to actual demand — a mosque that nobody requests costs nothing to maintain.

Mosque websites fall into two categories, which determine cache TTL:

| Timetable Type     | What the mosque shows              | Cache TTL               | Data yield per scrape |
| ------------------ | ---------------------------------- | ----------------------- | --------------------- |
| **Monthly/Yearly** | Full timetable (HTML table or PDF) | Until end of data range | 30-365 days of data   |
| **Daily only**     | Just today's times                 | Until end of day        | 1 day of data         |

The LLM extraction prompt classifies each mosque's timetable type on first scrape. This metadata drives the cache expiry:

```json
{
  "timetable_type": "daily" | "monthly" | "yearly",
  "data_range": { "from": "2026-02-01", "to": "2026-02-28" }
}
```

**Request flow:**

1. User opens app outside London (or searches for an area)
2. App checks jsDelivr CDN for nearby mosque data (no backend hit)
3. If data exists and is fresh → display it (zero cost, near-zero latency)
4. If no data or stale → app hits backend → backend scrapes → commits to repo → returns data
5. Subsequent reads for the same mosque are served from jsDelivr CDN until data expires

**Why not scheduled scraping?** A mosque discovered once by a travelling user and never requested again would be scraped indefinitely, burning LLM credits for data nobody reads. Demand-driven caching means zero cost for zero-demand mosques. The trade-off is that the first user after a cache expiry pays the latency cost (~5-15 seconds), but all subsequent users that day get instant results.

### LLM Extraction Prompt

A dedicated extraction prompt has been engineered and is preserved in Appendix B. Key design decisions in the prompt:

1. **Both start and jamaat times extracted** — Many UK mosques show "begins" (adhan/start) and "jamaat" (congregation) times. Both are captured. If only one is shown, it goes in `start`.

2. **Jummah (Friday prayer) as a separate object** — Friday prayers have khutbah (sermon) and prayer times that are distinct from regular Dhuhr.

3. **Three-value status field** — `found | no_times | not_relevant` gives the backend a clear signal before checking times.

4. **date_on_page field** — Captures the actual date shown on the website for stale detection. If `date_on_page != today`, confidence is automatically "low".

5. **Confidence scoring** — high/medium/low. The backend discards "low" confidence results and tries the next closest mosque.

6. **timetable_type classification** — The LLM identifies whether the mosque shows daily, monthly, or yearly data, enabling intelligent cache TTL per mosque.

7. **English aliases only** — Scoped to UK mosques. Aliases cover common UK transliterations: Fajr/Subh, Dhuhr/Zuhr, Asr/Asar, Maghrib/Magrib, Isha/Esha, Sunrise/Shuruq.

8. **No madhab preference logic** — The mosque's website is the single source of truth. Whatever times they post is what gets extracted. The system does not choose between Hanafi and Shafi'i — the mosque has already made that decision.

### Site Navigation (Pre-Extraction)

Real-world testing revealed a critical gap in the scraping pipeline: the URL from Google Maps is typically the mosque's **homepage**, not the prayer times page. The extraction prompt handles parsing content into JSON perfectly, but there's no step ensuring the **right content** is fetched first.

This is a two-pass approach inserted between Homepage Fetch and Pre-processing:

#### Pass 1: Prayer Page Discovery (from homepage)

- Fetch the homepage URL from Google Maps
- Scan HTML for links containing prayer-related keywords (`prayer`, `salah`, `namaz`, `timetable`, `times`, `prayertime`)
- Also check for download links (PDF/CSV) that may contain timetables
- If a dedicated prayer times page is found → fetch that page
- If no prayer-related links found → use homepage content as-is

#### Pass 2: Content Verification (from prayer page)

- Check if the fetched prayer page already contains the current month/date — **many sites default to the current month on first load without any URL parameters**
- If the content already has today's data → proceed to pre-processing (no further navigation needed)
- If the content shows a different month/date:
  - Inspect HTML for navigation patterns: dropdowns, tab links, URL parameters (`?month=`, `?m=`), date pickers
  - Note: some sites only add URL parameters when the user interacts with a dropdown — the default load may have no query string at all
  - Try the discovered parameter with the correct month value and re-fetch
- If still wrong → flag as stale, proceed with available content (the extraction prompt handles stale detection via `date_on_page` + low confidence)

**Implementation: Crawl4AI with Playwright + Navigation LLM (two-LLM architecture)**

Real-world testing against ICCUK (iccuk.org) demonstrated that LLM-based navigation on raw HTML is fundamentally inadequate. An LLM reading raw HTML can parse links and guess URLs, but it cannot render JavaScript, click elements, observe results, or interact with dropdowns. This amounts to link scraping, not navigation — and breaks on any site with dynamic content, SPAs, or JS-driven UI.

Navigation requires a **real browser** combined with an **LLM for decision-making**. Every mosque website is structured differently, so the LLM analyses each rendered page to decide where to navigate — there is no heuristics-first approach. The implementation uses **Crawl4AI** (open-source Playwright wrapper) with a navigation LLM to:

1. Render the homepage in a real browser (handles JS, CSR, SPAs)
2. Pass the rendered page content to a **navigation LLM** that identifies which link leads to the prayer timetable
3. Click the identified link, wait for page load, verify rendered content has current month/date
4. If wrong date — interact with dropdowns, select elements, or date pickers to navigate to the correct month
5. Extract rendered HTML/Markdown and pass to the Opus 4.6 extraction prompt

This is a two-LLM architecture: a **navigation LLM** (configured inside Crawl4AI, model TBD — best for web navigation) finds the right page, then the **extraction LLM** (Opus 4.6) parses the prayer times into structured JSON. See `navigation-prompt.md` for the full navigation strategy and prompt.

### Web Crawling Technology

The navigation and rendering layer requires a real browser to handle the diversity of mosque websites (static HTML, server-side rendered, client-side rendered SPAs, JS-driven dropdowns). Five options were evaluated:

| Option                | Type                      | Navigation                    | Extraction Control                       | Cost                |
| --------------------- | ------------------------- | ----------------------------- | ---------------------------------------- | ------------------- |
| **Crawl4AI**          | Open-source, self-hosted  | Playwright browser automation | Full — custom Opus prompt                | Free (compute only) |
| Vercel Agent Browser  | Open-source CLI (TS/Rust) | LLM-driven snapshot+refs      | None — navigation only, no extraction    | Free (compute only) |
| Firecrawl (FIRE-1)    | SaaS agent                | Autonomous (Gemini-based)     | Limited — uses Gemini, not custom prompt | $0.03-0.15/page     |
| Browserbase           | Cloud browser API         | Manual scripting              | Full                                     | Usage-based         |
| Self-hosted Puppeteer | Library                   | Manual scripting              | Full                                     | Free (compute only) |

**Decision: Crawl4AI.**

Key reasons:

- **Open-source, self-hosted** — no vendor lock-in, no per-page fees, full control over the pipeline
- **Playwright-based** — real Chromium browser that handles all site types (static, SSR, CSR, SPAs)
- **Built-in Markdown conversion** — reduces pre-processing work before LLM extraction
- **Async crawling** — efficient for batch operations when multiple mosques need refreshing
- **Custom extraction prompt** — preserves the Opus 4.6 extraction prompt as the single LLM layer (unlike Firecrawl's FIRE-1 which forces Gemini for navigation)
- **LLM extraction patterns** — has built-in support for passing rendered content to an LLM, aligning with the existing pipeline design

Firecrawl's FIRE-1 agent was the closest alternative — it provides autonomous multi-step navigation (clicking links, filling forms, scrolling). However, it uses Gemini internally for navigation decisions, which conflicts with the goal of using a single custom Opus prompt for all extraction. It also adds per-page costs ($0.03-0.15) that scale with usage.

Vercel's Agent Browser (`vercel-labs/agent-browser`, 12k GitHub stars, Apache 2.0) was also evaluated. It introduces a novel snapshot+refs system purpose-built for LLM-driven navigation: the browser takes an accessibility-tree snapshot with deterministic element references (`@e1`, `@e2`), the LLM picks which ref to click/fill, and the CLI executes the action — reducing token usage by ~82% compared to sending full page content (5.5K chars vs 31K per navigation cycle). This is an elegant navigation pattern. However, Agent Browser is a navigation tool, not a scraper — it has no built-in Markdown conversion, no content extraction pipeline, and no async batch crawling. Using it would require bolting on a separate extraction layer to achieve what Crawl4AI provides end-to-end. It is also TypeScript/Rust rather than Python, adding a language boundary to the backend pipeline.

**Cost:** Crawl4AI itself is free (open-source). The navigation LLM adds a small cost per scrape (~$0.001-0.01) for the structural analysis call that decides where to click. The navigation model (TBD — best for web navigation) is separate from the Opus 4.6 extraction model. Total navigation cost is significantly less than extraction.

### Validation Pipeline (Post-LLM)

Every extraction passes through server-side validation before storage:

1. **Format check**: All times are valid `HH:MM` in 24-hour format
2. **Ordering check**: `Fajr < Sunrise < Dhuhr < Asr < Maghrib < Isha`
3. **Plausibility check**: Times must be reasonable for the mosque's latitude and season (e.g., Fajr at 02:00 in winter UK is wrong)
4. **Confidence gate**: Only `high` and `medium` confidence results are stored
5. **On failure**: Try the next closest mosque from Google Maps results. If all fail → "no mosques found" for this location

### Public Data Repository

Scraped prayer times are persisted in a public GitHub repository. This serves multiple purposes:

- **Transparency**: Anyone can verify the data
- **Open data**: Other developers can use the dataset
- **Version history**: Git tracks changes over time
- **Free hosting**: GitHub serves as storage; the mobile app reads via **jsDelivr CDN** (`cdn.jsdelivr.net/gh/{user}/{repo}@main/uk/london/east-london-mosque.json`), which mirrors the repo with global edge caching and no rate limits
- **Primary data store**: The repo IS the primary store — the backend writes to it, the app reads from it via CDN. No separate database. This keeps the architecture as simple as possible
- **Cache busting**: jsDelivr cache can be purged via their API when the backend commits new data, or the app can use commit-hash-pinned URLs for deterministic reads

**Important: Only the backend writes to the repo.** The mobile app never pushes directly. This prevents:

- Auth tokens on user devices
- Malicious data injection
- Unvalidated writes

Repository structure (proposed):

```
prayer-times-data/
├── uk/
│   ├── london/
│   │   ├── east-london-mosque.json
│   │   ├── london-central-mosque.json
│   │   └── ...
│   ├── birmingham/
│   │   ├── birmingham-central-mosque.json
│   │   └── ...
│   └── ...
└── metadata/
    └── mosques.json          # Index of all known mosques with timetable type + cache expiry
```

Each mosque JSON file:

```json
{
  "mosque_id": "east-london-mosque",
  "mosque_name": "East London Mosque",
  "google_place_id": "ChIJ...",
  "website": "https://www.eastlondonmosque.org.uk",
  "latitude": 51.5178,
  "longitude": -0.0652,
  "timetable_type": "monthly",
  "last_scraped": "2026-02-01T00:00:00Z",
  "data_range": { "from": "2026-02-01", "to": "2026-02-28" },
  "times": {
    "2026-02-01": {
      "fajr": { "start": "06:10", "jamaat": "06:45" },
      "sunrise": { "start": "07:32" },
      "dhuhr": { "start": "12:15", "jamaat": "12:30" },
      "asr": { "start": "14:30", "jamaat": "15:00" },
      "maghrib": { "start": "17:05", "jamaat": "17:10" },
      "isha": { "start": "18:30", "jamaat": "19:15" }
    },
    "2026-02-02": { "...": "..." }
  }
}
```

### Request Pipeline & Security Model

#### End-to-End Pipeline

```
User Device (untrusted)          Backend (trusted)              GitHub (public repo)
─────────────────────────        ─────────────────────          ────────────────────
1. User opens app, device
   obtains lat/long

2. Check MMKV cache + GitHub
   repo for known mosque data
   ─── fresh data? ──▶ skip to step 10

── Cache miss: backend needed ──

3. Obtain attestation token
   from OS (App Attest /
   Play Integrity)

4. Send lat/long + attestation
   token to backend
                    ──────────▶
                                 5. Verify attestation with
                                    Apple/Google (→ 403 if invalid)
                                 6. Validate coordinates
                                    (UK bounds) + rate limit
                                 7. Query Google Maps Places
                                    for nearest mosque(s)
                                 8. Check data repo for fresh
                                    data → if yes, return it
                                 9. Crawl4AI renders homepage →
                                    navigates to prayer page →
                                    LLM extract → validate →
                                    commit to repo
◀── JSON + mosque metadata ────
10. Cache in MMKV, display
    times, schedule notifications
```

On subsequent visits for the same mosque (while data is fresh), only steps 1-2 and 10 occur — the app reads from MMKV or the GitHub repo directly. The backend is only involved on genuine cache misses, and only after the device proves it is running a legitimate copy of the app.

#### Trust Boundaries

| Boundary                     | Trust Level                   | Access                                                                                                                                       |
| ---------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **User device**              | Untrusted                     | Reads only. Sends lat/long + attestation token to backend. Reads JSON from public GitHub repo. No write credentials.                         |
| **Backend (cloud function)** | Trusted                       | Holds GitHub PAT (server-side only, never sent to clients). Holds Google Maps and LLM API keys. Only component that writes to the data repo. |
| **Data repo (GitHub)**       | Public read, restricted write | Branch protection on `main`. Only the backend's GitHub PAT can push. App reads raw JSON via `raw.githubusercontent.com`.                     |

#### Security Invariants

1. **No secrets on user devices, no user accounts.** The app is anonymous — no login, no registration. It sends only lat/long and an attestation token to the backend and reads public JSON from GitHub. The attestation token proves the device is running a genuine copy of the app, not the user's identity.
2. **Single write path.** All data enters the repo through: backend → GitHub API with a fine-grained PAT scoped to the data repo only.
3. **All data validated before write.** The backend fetches mosque websites itself, runs LLM extraction, and applies the full validation pipeline before committing. No user-supplied content reaches the repo.
4. **Layered request authentication.** The backend enforces four layers of defense: cache-first architecture, per-IP rate limiting, app attestation, and a cost ceiling. See "Backend Request Authentication" below.
5. **Coordinate validation.** The backend rejects coordinates outside UK bounds (Phase 1 scope), preventing misuse as a general-purpose scraper.
6. **Branch protection.** `main` branch: no force pushes, no deletion, no direct pushes except from the backend's service account.

#### Backend Request Authentication

The backend endpoint converts HTTP requests into LLM API spend and repo commits. Without client authentication, anyone who discovers the URL could trigger expensive scrapes by sending valid UK coordinates. IP-based rate limiting alone is insufficient — rotating proxies bypass it trivially. No user accounts or login are used; the app is fully anonymous.

The defense is layered. Each layer catches a different class of abuse:

| Layer                  | Mechanism                                                                                                                                                                                                                                                   | Stops                                                                                                                                                                                      | Limitation                                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **1. Cache-first**     | App checks MMKV cache + GitHub repo before hitting backend. Only genuine cache misses reach the endpoint.                                                                                                                                                   | ~99% of traffic never touches the backend. An attacker must target ~900 unique mosque coordinates to trigger all possible scrapes — and the resulting data is valid and serves real users. | Does not stop an attacker willing to enumerate coordinates.                                                                |
| **2. Rate limiting**   | Per-IP request throttling at the backend.                                                                                                                                                                                                                   | Casual abuse, accidental loops, misconfigured clients.                                                                                                                                     | Bypassed with rotating proxies.                                                                                            |
| **3. App attestation** | Apple App Attest (iOS) + Google Play Integrity (Android). The app obtains a platform-signed token proving it is a genuine, unmodified binary on a real device. The backend verifies this token server-side with Apple/Google **before** any expensive work. | Scripts, emulators, modified binaries, and any non-genuine client. This is the primary defense.                                                                                            | Requires device jailbreak/root to forge. Does not limit request frequency from legitimate installs (layer 2 handles that). |
| **4. Cost ceiling**    | Daily/monthly cap on LLM API spend. When hit, the backend stops new scrapes and returns cached data only. Monitoring alerts fire.                                                                                                                           | Runaway costs from any source — abuse, bugs, or unexpected growth.                                                                                                                         | Degrades service for all users when triggered. Acts as a circuit breaker, not an auth mechanism.                           |

**App attestation detail:**

App Attest (iOS 14+, 2020) uses the Secure Enclave to generate a hardware-backed key pair tied to the app's identity. Play Integrity (Android, successor to SafetyNet) provides equivalent device and app integrity verdicts. Both are industry-standard — used by banking apps, ride-sharing, and anti-cheat systems.

What attestation cryptographically proves:

- The request originates from a genuine, unmodified copy of the app (binary hash matches App Store / Play Store build)
- Running on a real device, not an emulator or automated script
- The app has not been repackaged or tampered with

What it does **not** prove:

- The user's identity (there are no user accounts — this is anonymous)
- That the request is reasonable (layer 2 handles frequency)

**Implementation note:** Firebase App Check wraps both App Attest and Play Integrity into a unified API with built-in token refresh. Since the ADR already targets cloud functions, this is the natural integration path. Platform decision deferred to implementation (same as Open Question #1).

**Future optimization:** When request volume grows, a CDN layer (e.g., jsDelivr) can be placed in front of the GitHub repo to eliminate rate limits and improve global read latency. This requires zero architectural changes — the app simply reads from a different URL.

### Mobile App Changes Required

Regardless of backend architecture, the mobile app needs these changes to support any location beyond London:

| Component                               | Current                           | Required Change                                                                   |
| --------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------- |
| `shared/time.ts` — `createLondonDate()` | Hardcoded `'Europe/London'`       | Parameterize as `createLocalDate(timezone)` with 20+ downstream callers updated   |
| `shared/prayer.ts` — `getLondonHours()` | Hardcoded London TZ               | Parameterize timezone                                                             |
| `api/config.ts`                         | Hardcoded `londonprayertimes.com` | Configurable endpoint: London API for London, backend API for elsewhere           |
| `api/client.ts`                         | Fetches from London API           | Add new client for backend API                                                    |
| `stores/database.ts`                    | Keys: `prayer_YYYY-MM-DD`         | Location-aware keys: `prayer_{mosque_id}_{date}` or separate storage per location |
| `stores/schedule.ts`                    | ~6 `createLondonDate()` calls     | All parameterized with user's location timezone                                   |
| `stores/sync.ts`                        | London TZ for year boundary       | Parameterized timezone                                                            |
| `stores/countdown.ts`                   | London TZ for countdown           | Parameterized timezone                                                            |
| `stores/notifications.ts`               | London TZ for scheduling          | User's local timezone                                                             |
| `stores/ui.ts`                          | No location state                 | Add location atom (selected mosque, lat/long, timezone)                           |
| UI                                      | No location selector              | Location picker screen + mosque selector                                          |
| `app.json`                              | No location permissions           | Add location permission strings                                                   |

### Backend Technology (Cloud Functions)

The backend runs as serverless cloud functions. No cron jobs needed — all scraping is request-driven. Specific platform TBD, but candidates:

- Cloudflare Workers (low latency, global edge)
- AWS Lambda (mature ecosystem)
- Vercel Functions (easy deployment, good DX)

Requirements:

- HTTP endpoint for prayer times (`GET /times`)
- **Crawl4AI** — open-source Playwright wrapper for browser-based navigation, rendering, and Markdown conversion (see "Web Crawling Technology" section)
- Headless browser capability (Playwright via Crawl4AI for JS-rendered sites, navigation, dropdown interaction)
- LLM API access (Claude Opus 4.6 for extraction)
- GitHub API access (for writing to the data repo)

### Cost Projections

**Per scrape (discovery or cache refresh):**
| Service | Cost |
|---------|------|
| Google Maps Places API | ~$0.032 per nearby search (skipped on cache refresh) |
| Crawl4AI rendering (homepage → prayer page) | Free (open-source, self-hosted — compute cost only) |
| Navigation LLM (prayer page discovery) | ~$0.001-0.01 per navigation (model TBD — best for web navigation) |
| Extraction LLM (prayer times parsing) | ~$0.03-0.10 per extraction (Opus 4.6) |
| **Total per scrape** | **~$0.03-0.14** |

**Ongoing costs are purely demand-driven.** A mosque that no user requests costs nothing. Monthly spend depends entirely on how many unique mosque-days users request. Example projections:

| Usage scenario             | Active mosques | Scrapes/month | Est. cost/month |
| -------------------------- | -------------- | ------------- | --------------- |
| Early adoption (few users) | ~20            | ~200          | ~$2-16          |
| Moderate UK coverage       | ~100           | ~1,500        | ~$15-120        |
| High UK coverage           | ~500           | ~5,000        | ~$50-400        |

Costs scale linearly with actual user demand, not with the number of discovered mosques.

### LLM Model Selection for Extraction

All extractions use **Opus 4.6 only** — accuracy over cost. The extraction prompt (see Appendix B) requires Opus for reliable structured data extraction across the full range of mosque website layouts, including complex tables, PDFs, and images.

| Model    | Use case                               | Cost | Accuracy |
| -------- | -------------------------------------- | ---- | -------- |
| Opus 4.6 | All extraction — HTML, PDF, image, OCR | High | Highest  |

**Rationale:** While Haiku/Sonnet could handle simple HTML tables, the decision is to use a single model for all source types to maximise accuracy and avoid the complexity of a tiered fallback system. Cost is monitored but not capped (see Open Question #8).

---

## Consequences

### Positive

- **Mosque-specific accuracy**: Users get the exact times their local mosque uses, including local adjustments that calculation methods cannot replicate
- **Zero user effort**: After initial location detection, times appear automatically
- **Growing dataset**: The public repo becomes a valuable open-data resource for the Muslim community
- **Cost efficiency**: Demand-driven scraping means costs are proportional to actual user requests — zero users = zero cost
- **UK-first scope**: Manageable scale (~900 mosques) to validate the approach before expanding

### Negative

- **Fragile data source**: Mosque websites can change, go down, or have no timetable — there is no fallback to calculated times
- **First-user latency**: The first person to request a mosque after cache expiry waits for the full pipeline (5-15 seconds)
- **Backend infrastructure**: The app goes from zero backend to requiring cloud functions and GitHub API integration
- **Maintenance burden**: Mosque websites change — broken scrapes need monitoring and the prompt may need iteration
- **Headless browser complexity**: JS-rendered mosque websites require Puppeteer/Playwright in the cloud function, which adds cold start latency and cost

### Neutral

- **London remains the primary use case**: The existing London Prayer Times API continues as the data source for London users. The new system only activates for non-London locations
- **The public repo is the primary data store**: The backend commits scraped data to GitHub; the app reads it via jsDelivr CDN. No separate database. If GitHub/jsDelivr is down, the app shows an error — it does not silently display stale data (same-day MMKV cache is acceptable, anything older is not)
- **10x architecture complexity**: The app goes from a single API call to a multi-service pipeline. This is inherent to the problem, not over-engineering

---

## Alternatives Considered

### Alternative 1: Calculation-Based Prayer Times (e.g., Aladhan API)

**Description:** Use established astronomical calculation methods (ISNA, MWL, Egyptian, Umm al-Qura) via a free API like Aladhan that accepts lat/long coordinates. Users would select their preferred calculation method in settings.

**Pros:**

- Free, reliable, works for any location on Earth instantly
- No backend infrastructure needed (API is third-party hosted)
- No scraping, no LLM costs, no maintenance burden
- Used by every major prayer app (Muslim Pro, Athan by IslamicFinder, Pillars)
- Works offline once cached (same MMKV pattern as current app)
- Accurate to within 1-3 minutes of mosque times for ~95% of locations

**Cons:**

- Cannot replicate mosque-specific local adjustments (which is the core value proposition)
- Some mosques adjust Fajr and Isha significantly from calculated times, especially at high latitudes
- Users who follow their local mosque's timetable would see different times than expected
- Relies on a third-party API (Aladhan) — no control over uptime or accuracy

**Why Rejected:** The explicit goal is mosque-specific accuracy. Calculated times are a different (and already well-served) market. The app's differentiator is providing the exact times each mosque uses, which calculation methods fundamentally cannot do.

**Note from review:** Calculation-based times could serve as a strong progressive enhancement layer — show calculated times instantly while the AI scrape runs in the background. This was discussed but deferred; the current decision is mosque-only with no calculation fallback. This may be revisited if user feedback indicates a need.

### Alternative 2: Custom Fine-Tuned ML Model

**Description:** The original plan in `future.txt` proposed fine-tuning a custom ML model on 100+ mock mosque websites, using a combination of NLP and computer vision for HTML, PDF, and image extraction.

**Pros:**

- No per-request LLM API cost after training
- Full control over the model
- Could be optimized for the specific domain

**Cons:**

- 100 mock websites is insufficient training data for real-world generalization
- Requires GPU infrastructure for training and serving
- Cannot handle the diversity of mosque website layouts — new layouts require retraining
- PDF/image extraction requires separate computer vision pipeline
- Massive engineering effort for a small team
- General-purpose LLMs (Claude, GPT-4) already handle this task well out of the box with prompt engineering

**Why Rejected:** A prompted LLM API call handles layout diversity far better than any custom model trained on 100 examples, with zero training infrastructure. The entire training pipeline described in `future.txt` is replaced by a single well-crafted prompt.

### Alternative 3: Crowdsourcing / Community Input

**Description:** Allow users to manually input or verify prayer times for their local mosque.

**Pros:**

- No scraping infrastructure needed
- Human accuracy for data entry
- Community engagement

**Cons:**

- Inconsistent data quality — users may enter wrong times
- Burden on users — defeats the "seamless" goal
- Moderation needed to prevent bad data
- Cold start problem — no data until users contribute
- Users expect the app to "just work"

**Why Rejected:** Places too much burden on users. The app should provide times automatically. Dismissed in the original `future.txt` ideation.

### Alternative 4: Single Static Dataset / Global API

**Description:** Use a single global prayer times API or a static dataset maintained by a third party.

**Pros:**

- Simple to integrate
- No scraping or AI needed

**Cons:**

- Known inaccuracies and regional mismatches
- No control over data quality or update frequency
- Cannot serve mosque-specific adjusted times

**Why Rejected:** Same fundamental limitation as calculation-based — cannot replicate mosque-specific adjustments. Dismissed in the original `future.txt` ideation.

### Alternative 5: Hybrid (Calculation Baseline + AI Scraping Layer)

**Description:** Use calculation-based times (Aladhan) as an instant baseline, then silently upgrade to mosque-specific times in the background via AI scraping. Users see calculated times immediately; if a mosque scrape succeeds, the display updates. If scraping fails, the user still has calculated times.

**Pros:**

- Best UX — instant times on location change, no loading states
- Graceful degradation — scraping failure is invisible to the user
- Progressive enhancement — mosque data improves the base over time
- Most resilient architecture

**Cons:**

- More complex — two data pipelines instead of one
- Users may see times change after a few seconds (calculated → mosque), which could be confusing
- Calculated times may anchor user expectations, making mosque adjustments feel "wrong"
- Scope creep — doubles the API integration work

**Why Rejected:** Adds complexity and dilutes the product's identity. The app's value is mosque-specific times, not calculated approximations. If scraping fails, the system tries the next closest mosque rather than falling back to calculations. This may be revisited based on user feedback.

### Alternative 6: Scheduled Scraping for All Discovered Mosques

**Description:** Once a mosque is discovered by any user, add it to a scheduled cron job that re-scrapes it daily (for daily-only timetables) or monthly (for monthly timetables). This ensures all known mosques always have fresh data.

**Pros:**

- All subsequent users get instant results — no cache misses
- Data is always fresh — no user ever pays the scraping latency cost after first discovery

**Cons:**

- A mosque discovered once by a travelling user and never requested again gets scraped indefinitely — burning LLM credits for data nobody reads
- Costs are proportional to total discovered mosques, not actual user demand
- At full UK coverage (~900 mosques), monthly costs of $100-370 regardless of whether anyone uses the data
- Requires cron job infrastructure, adding backend complexity

**Why Rejected:** The cost model is wasteful. Demand-driven caching ensures costs scale with actual usage. The trade-off — one user per cache-expiry window pays the scraping latency — is acceptable. If a mosque has no users on a given day, that's a signal the data isn't needed, not a data gap.

---

## Implementation Notes

### Phase Ordering

1. **Phase 0: Codebase refactor** — Parameterize all London hardcoding (timezone, API, storage keys). This is a prerequisite for any multi-location work and can be done independently.

2. **Phase 1: Backend** — Build the cloud function with scraping pipeline, LLM extraction, validation, and GitHub repo integration.

3. **Phase 2: Mobile app** — Add location services, new API client, location selection UI, mosque display.

4. **Phase 3: Monitoring & iteration** — Track scraping success rates, identify problematic mosque websites, iterate on the extraction prompt.

### Key Files to Modify (Mobile App)

| File                       | Change                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| `shared/time.ts`           | Replace `createLondonDate()` with `createLocalDate(timezone)`, update all 20+ downstream callers |
| `shared/prayer.ts`         | Replace `getLondonHours()` with `getLocalHours(timezone)`                                        |
| `api/config.ts`            | Make endpoint configurable per location source                                                   |
| `api/client.ts`            | Add new client for backend API alongside existing London API client                              |
| `stores/database.ts`       | Location-aware storage keys                                                                      |
| `stores/schedule.ts`       | Parameterize 6+ `createLondonDate()` references                                                  |
| `stores/sync.ts`           | Parameterize timezone for year boundary detection                                                |
| `stores/countdown.ts`      | Parameterize timezone                                                                            |
| `stores/notifications.ts`  | Use user's local timezone for notification scheduling                                            |
| `stores/ui.ts`             | Add location state atom                                                                          |
| `shared/constants.ts`      | Add location-related constants                                                                   |
| `app.json`                 | Add location permission descriptions                                                             |
| New: location selection UI | Screen for choosing/searching locations                                                          |

### Key Files to Create (Backend)

| File                    | Purpose                                                                       |
| ----------------------- | ----------------------------------------------------------------------------- |
| `functions/discover.ts` | Prayer times endpoint — lat/long → check cache → scrape if stale → return     |
| `functions/scrape.ts`   | Scraping pipeline — fetch → navigate → preprocess → LLM → validate            |
| `functions/navigate.ts` | Crawl4AI navigation — browser-based prayer page discovery + date verification |
| `functions/prompt.ts`   | LLM prompt template and variable injection                                    |
| `functions/validate.ts` | Post-LLM validation (ordering, plausibility, confidence gate)                 |
| `functions/github.ts`   | GitHub API integration for writing to data repo                               |

### Extraction Prompt Location

The extraction prompt is preserved in Appendix B of this ADR. It includes:

- System prompt + user prompt (separated)
- Output JSON schema with start/jamaat fields, jummah object, status, confidence, date_on_page, timetable_type
- English alias table for UK mosques
- Pre-processing steps (strip nav/footer/scripts, keyword gate, truncation)
- Post-processing steps (time ordering, plausibility, confidence gate, caching strategy)
- Template variables table

### Monitoring & Observability

Essential monitoring:

- Scraping success rate per mosque (track failures over time)
- LLM confidence distribution (are most results "high"?)
- Cost tracking (LLM API spend per day/month)
- Stale data alerts (mosque data older than expected refresh cycle)
- Website change detection (if a mosque's HTML structure changes significantly, flag for review)

### Risks & Mitigations

| Risk                            | Likelihood | Impact                                       | Mitigation                                                                                                 |
| ------------------------------- | ---------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Mosque website goes down        | Medium     | Users get no times for that mosque           | Try next closest mosque; flag for manual review                                                            |
| Mosque website changes layout   | Medium     | LLM extraction may fail or return wrong data | Confidence scoring catches most failures; next user request triggers a fresh scrape attempt                |
| LLM hallucinates prayer times   | Low        | Users get wrong times (worse than no times)  | Validation pipeline: ordering check, plausibility bounds, confidence gate                                  |
| Google Maps returns wrong place | Low        | Scrape a non-mosque website                  | Status field ("not_relevant") catches this; keyword gating in pre-processing                               |
| Cost overruns from high usage   | Low-Medium | Monthly bill exceeds budget                  | Opus-only is expensive; monitor costs, cache aggressively, cost ceiling as circuit breaker                 |
| GitHub rate limits              | Low        | Can't write to data repo                     | Buffer writes; reads fail gracefully with an error (same-day local cache is acceptable, stale data is not) |

---

## Open Questions

These items were raised during the initial discussion and subsequent review. Most have been resolved or deferred:

1. ~~**Which cloud platform for the backend?**~~ **Deferred:** Infrastructure choice (Cloudflare Workers, AWS Lambda, Vercel Functions) does not impact the architecture. Decision deferred until implementation begins.

2. ~~**How to handle mosques with no website?**~~ **Resolved:** Skip and try next nearest mosque. A mosque is only usable if its website contains an extractable timetable (HTML table, PDF of a table, or image of a table). The scraper should follow download links and navigate sub-pages to find timetables. If no mosque in the area has extractable data → "no mosques found." This is consistent with the existing "try next closest mosque" strategy (see line 66, 168).

3. ~~**Should the data repo be the primary data store or a secondary artifact?**~~ **Resolved:** The public GitHub repo IS the primary data store. The backend writes to it; the mobile app reads from it via jsDelivr CDN. No separate database. See "Public Data Repository" section.

4. ~~**Cache TTL on the mobile app.**~~ **Resolved:** Cache data for as long as the data is valid — driven by the `data_range` field from the LLM extraction (see "Data Collection Strategy" section). Yearly timetable → cache for 1 year. Daily timetable → cache for 1 day. The only variable that needs frequent checking is user location — if the user moves, their nearest mosque changes regardless of cache freshness. Stale data (past `data_range.to`) must never be silently displayed.

5. ~~**What happens when a user is in London?**~~ **Resolved:** The current app behaviour is unchanged for London users — the existing London Prayer Times API remains the data source with no location features. The new multi-location system only activates when the user is outside London.

6. ~~**GitHub repo race conditions (concurrent scrapes)?**~~ **Resolved:** Use an in-memory Map in the cloud function to track in-flight mosque IDs. If a second request arrives for a mosque already being scraped, it waits for the first to finish rather than triggering a duplicate scrape. Simple concurrency lock, not an external queue.

7. ~~**Monthly timetable truncation?**~~ **Resolved:** Pre-processing step 4 (truncate to ±2000 chars) is skipped for pages identified as full timetables (monthly/yearly). Full content is sent to the LLM to avoid cutting off today's row.

8. ~~**Grace period for stale data?**~~ **Resolved:** Yesterday's data remains valid until today's Fajr time. Uses the Islamic day boundary (Fajr-to-Fajr) as the natural cutoff — if the user opens the app at 5:55am and yesterday's times are cached, they are still valid for the remaining minutes before Fajr.

9. **jsDelivr CDN propagation delay** — **Open.** After committing to GitHub, jsDelivr cache takes minutes to update. For initial testing, use raw GitHub URLs (`raw.githubusercontent.com`) directly. CDN layer can be added later with zero architectural changes. Revisit when moving to production.

10. ~~**LLM budget ceiling?**~~ **Resolved:** No hard ceiling. Monitor costs and adjust if unreasonable. Opus-only model selection (see "LLM Model Selection") is the most expensive tier.

11. ~~**Monitoring infrastructure?**~~ **Resolved:** No existing monitoring infrastructure. Setting up scraping success rates, confidence distribution, cost tracking, and stale data alerts is additional implementation work beyond the core pipeline. See "Monitoring & Observability" section.

---

## Related Decisions

- **ADR-001: Rolling Window Notification Buffer** — Notification scheduling will need timezone parameterization
- **ADR-004: Prayer-Based Day Boundary** — Islamic day boundary calculation depends on timezone, needs parameterization
- **ADR-007: Background Task Notification Refresh** — Background refresh logic will need to account for location-based timezone differences

---

## Reference Documents

Source documents and prompts are maintained alongside this ADR in `ai/adr/008/`:

- `ai/adr/008/future.txt` — Original ideation document (also Appendix A below)
- `ai/adr/008/extraction-prompt.md` — LLM extraction prompt (also Appendix B below)
- `ai/adr/008/navigation-prompt.md` — Crawl4AI + navigation LLM strategy (two-LLM architecture for site navigation)

---

## Revision History

| Date       | Author | Change                                                                                                                                                       |
| ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-02-16 | muji   | Initial draft from ideation discussion                                                                                                                       |
| 2026-02-16 | muji   | Resolve Open Question #3: GitHub repo is primary data store, served via jsDelivr CDN                                                                         |
| 2026-02-16 | muji   | Resolve Open Questions #1 (deferred), #2, #4, #5; fix stale-data language                                                                                    |
| 2026-02-16 | muji   | Add request pipeline & security model section; update open questions intro                                                                                   |
| 2026-02-16 | muji   | Fix pipeline (cache-first + attestation); add backend auth subsection; replace jsDelivr with GitHub raw; strengthen invariants #1 and #4                     |
| 2026-02-16 | muji   | Post-review updates: Opus-only model selection, resolve open questions #6-#11, truncation exception for timetable pages                                      |
| 2026-02-16 | muji   | Add Site Navigation phase to scraping pipeline (prayer page discovery + date verification); add navigation prompt; WLICC test case                           |
| 2026-02-16 | muji   | Add Crawl4AI as navigation/rendering layer; browser-first navigation replaces LLM-only approach; ICCUK test case validates decision                          |
| 2026-02-16 | muji   | Revise to two-LLM architecture: navigation LLM always used (not heuristics-first); add navigation LLM cost to projections; ICCUK test case in considerations |
| 2026-02-16 | muji   | Add Vercel Agent Browser to web crawling technology comparison; decision remains Crawl4AI (end-to-end pipeline vs navigation-only)                           |

---

## Appendix A: Original Ideation Document

_Verbatim content of `future.txt` (moved to `ai/adr/008/future.txt`)_

````
// Current Application Overview:
// The current app provides prayer times for Muslims in London by querying a prayer time API. It uses a fixed data source for a specific location (London) and displays daily prayer times accurately.

// Intended Expanded Approach:
// 1. User Location Integration: The app will enable location services. When users are outside London, a "Fetch Prayer Times" button will allow them to initiate a localized search.

// 2. Location-Based Mosque Identification: Upon user request, the app will capture latitude and longitude, then run a Google Maps query to find the closest mosque (by proximity to the user’s location).

// 3. AI-Based Scraping: Instead of relying on structured APIs or static selectors, a machine learning model will be employed to parse each mosque’s unique HTML structure. The AI will detect patterns and extract prayer times from a wide variety of page layouts. This will include scenarios where the times are in HTML tables, as well as cases where the prayer times are presented as PDFs or images.

// 4. Data Persistence and Public Repo: After each user request that triggers a new mosque discovery, if that mosque is not already in the repo, the app will push the newly scraped prayer times to a public repository. This ensures that over time, the repo grows organically with each new request, avoiding scheduled updates while still keeping the data set current.

// 5. Update Strategy: Updates happen dynamically—each time a user requests a prayer time for a new location, if that mosque is missing, it is added to the repo immediately. Thus, the repository grows based on real-time demand, ensuring global coverage as needed.

// AI Model Fine-Tuning:
// 1. Data Collection: Compile a diverse set of at least 100 mock websites representing different mosques. Ensure variety: different layouts, formats, and structures. Specifically include cases where prayer times are embedded in HTML tables, PDFs, or images.
// 2. Labeling: For each mock website, annotate the ground truth prayer times manually. Ensure you have a consistent reference format for comparison.

// 3. Model Selection: Choose a flexible extraction model—consider a combination of NLP and computer vision if PDFs or images are involved. Fine-tune the model using the mock data set, ensuring it learns to identify prayer times regardless of layout format (e.g., table, image, PDF).
// 4. Testing: Create unit tests that run the model against all 100 mock sites. Validate extraction accuracy by comparing model output against the annotated ground truth.
// 5. Robustness Considerations: Ensure edge cases (PDF, image-based times, monthly or yearly schedules) are included in the test set. The model must recognize different time formats—daily, monthly, yearly—and extract them correctly.

// Alternative Approaches Considered but Rejected:
// - Calculation-Based: Using predefined astronomical algorithms (e.g., Umm al-Qura, ISNA) was rejected because some mosques use unique local adjustments that these calculations cannot accommodate accurately.
// - Crowdsourcing: Allowing users to input prayer times was dismissed due to inconsistent user data, low accuracy, and the burden it places on users.
// - Manual User Input: Requiring users to input or adjust times was also rejected to maintain seamlessness and minimize user effort.
// - Single Static Dataset: Relying on a single global public API was discarded due to known inaccuracies and regional mismatches.```

---

## Appendix B: LLM Extraction Prompt

*Verbatim content of `extraction-prompt.md` (moved to `ai/adr/008/extraction-prompt.md`)*

# Prayer Time Extraction Prompt

LLM prompt for extracting mosque prayer times from website content.
Used in the cloud function pipeline: lat/long → Google Maps Places → mosque website fetch → **LLM extraction** → validation → storage.

**Model:** Opus 4.6 only (accuracy over cost)
**Failure strategy:** Try next closest mosque, no fallback APIs

---

## System Prompt

````

You are a mosque prayer time extraction system. Given website content from a mosque, extract today's prayer times as structured JSON.

You must return ONLY valid JSON — no markdown, no explanation, no commentary.

```

## User Prompt

```

Extract prayer times from this mosque's website content.

**Today's date:** {today_date}
**Day of week:** {day_of_week}
**Mosque location:** {latitude}, {longitude} ({city}, {country})
**Content source:** {source_type} (html | pdf_text | image_ocr)

## Output Schema

{
"status": "found" | "no_times" | "not_relevant",
"mosque_name": "string or null",
"date_on_page": "YYYY-MM-DD or null",
"confidence": "high" | "medium" | "low",
"times": {
"fajr": { "start": "HH:MM or null", "jamaat": "HH:MM or null" },
"sunrise": { "start": "HH:MM or null" },
"dhuhr": { "start": "HH:MM or null", "jamaat": "HH:MM or null" },
"asr": { "start": "HH:MM or null", "jamaat": "HH:MM or null" },
"maghrib": { "start": "HH:MM or null", "jamaat": "HH:MM or null" },
"isha": { "start": "HH:MM or null", "jamaat": "HH:MM or null" }
},
"jummah": {
"khutbah": "HH:MM or null",
"prayer": "HH:MM or null"
} | null,
"notes": "string or null"
}

## Rules

### Time Formatting

- All times in 24-hour format: "05:30", "13:15", "20:45"
- Convert 12-hour format: "8:30 PM" → "20:30", "6:15 AM" → "06:15"
- Times must be zero-padded: "5:30" → "05:30"

### Prayer Name Recognition

Match common English aliases to the correct field:

| Field   | Aliases                               |
| ------- | ------------------------------------- |
| fajr    | Fajr, Subh, Fajar                     |
| sunrise | Sunrise, Shuruq, Ishraq               |
| dhuhr   | Dhuhr, Zuhr, Zohr, Thuhr              |
| asr     | Asr, Asar                             |
| maghrib | Maghrib, Magrib, Maghreb              |
| isha    | Isha, Ishaa, Esha                     |
| jummah  | Jumu'ah, Jumuah, Jumma, Friday Prayer |

### Start vs Jamaat/Iqamah

- Many mosques show two times per prayer: "start/begins/adhan/azaan" and "jamaat/iqamah/congregation"
- Extract BOTH into the `start` and `jamaat` fields respectively
- If only one time is shown per prayer, put it in `start` and leave `jamaat` as null
- Column headers like "Begins", "Iqamah", "Azaan", "Jamaat", "Congregation" indicate which is which

### Date Matching

- Extract ONLY times for today ({today_date})
- If the page shows a monthly/yearly timetable, find today's row
- If the page shows only a different date's times, extract them BUT set the `date_on_page` field to that date and confidence to "low"
- If no date is visible, use layout position (most prominent/first visible = likely current)
- Look at the actual date on the page, not just assume it's today

### Friday/Jumu'ah Handling

- If today is Friday and "Jumu'ah" or "Friday Prayer" times are shown, populate the `jummah` object
- If Jumu'ah replaces Dhuhr, still try to extract Dhuhr start time if available separately
- "Khutbah" time (sermon start) differs from the actual prayer time — map each correctly

### Status Field

- "found": prayer times were identified in the content
- "no_times": content appears to be from a mosque/Islamic org but no parseable prayer times found
- "not_relevant": content has no relation to mosque activities or prayer times

### Confidence Scoring

- **high**: Clear timetable found with today's date visible, all or most times extracted, unambiguous format
- **medium**: Times found but some ambiguity — missing 1-2 prayers, date not explicitly shown, or partial table
- **low**: Times may be outdated (date on page ≠ today), heavily incomplete (≤3 prayers), OCR artifacts present, or uncertain extraction

### What to Ignore

- Event schedules, class timetables, Quran lesson times
- Donation amounts, contact information, news/blog content
- Navigation menus, footers, cookie notices
- If multiple locations' times are shown, prefer the one matching the mosque name or the most prominently displayed

### Notes Field

Use for anything the downstream system should know:

- "Timetable dated 2025-01-15, may be outdated"
- "Only weekly schedule found, not daily"
- "Jumu'ah time shown but no regular Dhuhr"
- "Two Jumu'ah congregations listed: 12:30 and 13:30"
- "Times may be OCR artifacts — poor image quality"
- "Hanafi and Shafi Asr times both shown, extracted Hanafi"

---

Website content:

{content}

```

---

## Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{today_date}` | Current date in YYYY-MM-DD | `2026-02-16` |
| `{day_of_week}` | Full day name | `Monday` |
| `{latitude}` | Mosque latitude | `51.5074` |
| `{longitude}` | Mosque longitude | `-0.1278` |
| `{city}` | City from geocoding | `London` |
| `{country}` | Country from geocoding | `United Kingdom` |
| `{source_type}` | Content origin | `html`, `pdf_text`, `image_ocr` |
| `{content}` | Pre-processed website content | Stripped HTML/text |

## Pre-processing (Before Sending to LLM)

1. Strip `<nav>`, `<footer>`, `<script>`, `<style>` tags
2. Check for prayer keywords before calling LLM — skip if none found
3. Headless browser fallback: re-fetch with Puppeteer if raw HTML is empty but Google Maps confirms mosque
4. Truncate large pages around prayer keyword clusters (±2000 chars). **Exception:** skip truncation for pages identified as full timetables (monthly/yearly) — send complete content to avoid cutting off today's row

## Post-processing (After LLM Response)

1. Validate time ordering: fajr < sunrise < dhuhr < asr < maghrib < isha
2. Validate plausibility bounds per prayer
3. Map `maghrib` → `magrib` for app compatibility
4. Cache per mosque, re-extract only on month change
5. On failure: try next closest mosque → "no mosques found" (no Aladhan fallback)

## Field Naming Note

The prompt uses `maghrib` (standard transliteration). The app uses `magrib`. The backend mapping layer must handle this conversion.
```
