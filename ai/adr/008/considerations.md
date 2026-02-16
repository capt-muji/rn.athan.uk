# ADR-008 Consolidated Review

Five independent reviews of ADR-008 were conducted on 2026-02-16. This document captures the consensus, concerns, and all resolved decisions.

---

## Effort Consensus

All reviews agree this is a **large** project. Estimates range from 3 weeks to 6 months depending on assumptions:

| Phase                           | Effort                  | Risk                                         |
| ------------------------------- | ----------------------- | -------------------------------------------- |
| Phase 0: Codebase refactor      | Medium (2-3 days)       | Medium — regressions in 20+ callers          |
| Phase 1: Backend infrastructure | High (1-4 weeks)        | High — entirely new, no backend exists today |
| Phase 2: Mobile app changes     | Medium-High (1-2 weeks) | Medium                                       |
| Phase 3: Monitoring & iteration | Medium (ongoing)        | Low                                          |

The backend is unanimously identified as the hardest and riskiest phase. The app goes from zero backend to a multi-service pipeline (cloud functions + Google Maps + headless browser + LLM + GitHub API + app attestation).

---

## Unanimous Strengths

All five reviews praised these architectural decisions:

1. **Demand-driven caching** — costs scale with actual usage, not total mosques. Zero users = zero cost.
2. **GitHub + jsDelivr** — public repo as primary data store with free global CDN. Simple, transparent, version-tracked.
3. **Layered security** — cache-first > rate limiting > app attestation > cost ceiling. Each layer catches a different class of abuse.
4. **Try-next-mosque** — graceful degradation when a mosque's website fails or has no extractable data.
5. **London unchanged** — existing London Prayer Times API continues as-is. The new system only activates outside London.
6. **Validation pipeline** — format check, ordering check, plausibility bounds, confidence gate catches hallucinations.

---

## Concerns Raised & Resolutions

Thirteen questions were raised across the five reviews. All were discussed and resolved with the project owner.

### Architecture Decisions

**#1 — Hybrid fallback (Aladhan calculation baseline)?**
All five reviews recommended reconsidering Alternative 5 (show calculated times instantly, upgrade to mosque times in background).

> **Decision: No fallback.** Mosque-only as written. If scraping fails, user gets nothing. The product identity is mosque-specific accuracy — calculated approximations are a different market. May be revisited based on user feedback.

**#2 — App attestation phasing?**
Three reviews suggested deferring Firebase App Check to post-MVP for reduced complexity.

> **Decision: Include in MVP.** Ship with full attestation from day 1. Security is non-negotiable for a system that converts HTTP requests into LLM API spend.

**#3 — Scraping scope (headless browser, PDF, image)?**
Four reviews recommended deferring Puppeteer and PDF/image support. Many mosque sites are simple HTML tables; headless browser adds ~50MB, 3-10s cold starts, and memory pressure.

> **Decision: Full scope from day 1.** HTML + Puppeteer + PDF + image as written in the ADR. No phased deferral.

**#4 — LLM model selection?**
The extraction prompt says "Opus 4.6 only" but the ADR body recommends "Haiku first, escalate to Sonnet/Opus." All reviews flagged this contradiction.

> **Decision: Opus only.** As the extraction prompt says. Accuracy over cost. The ADR's "LLM Model Selection" section needs updating to align.

### Technical Gap Decisions

**#5 — GitHub repo race conditions?**
Parallel scrapes for the same mosque will trigger concurrent pushes. Git doesn't handle this gracefully. Not addressed in the ADR.

> **Decision: In-memory dedup.** Track in-flight mosque IDs in a Map within the cloud function. Second request for the same mosque waits for the first to finish. Simple concurrency lock, not an external queue (no SQS).

**#6 — jsDelivr CDN propagation delay?**
After committing to GitHub, jsDelivr cache takes minutes to update. A second user during the propagation window gets a cache miss and triggers another scrape.

> **Decision: Open question.** Start with raw GitHub URLs (`raw.githubusercontent.com`) for initial testing. CDN layer can be added later with zero architectural changes. Revisit when moving to production.

**#7 — Monthly timetable truncation?**
Pre-processing step 4 truncates pages to +/-2000 chars around prayer keyword clusters. A full monthly HTML table (30 rows x 6-12 columns) can exceed 4000 chars. Truncation could cut off today's row.

> **Decision: Skip truncation for timetable pages.** If the page is identified as a full timetable (monthly/yearly), send the full content to the LLM without truncation.

**#8 — Grace period for stale data?**
Edge case: mosque posts today's times at 6am, user opens app at 5:55am. Yesterday's `date_on_page` would mark data as stale, but yesterday's times are still valid for the remaining 5 minutes.

> **Decision: Valid until Fajr next day.** Yesterday's data remains valid until today's Fajr time. This uses the Islamic day boundary (Fajr-to-Fajr) as the natural cutoff.

### Validation & Pre-Implementation

**#9 — Extraction prompt tested on real sites?**
Multiple reviews recommended testing the LLM prompt against 10-20 real UK mosque websites before building infrastructure.

> **Decision: Not yet.** This is a pre-implementation prerequisite. Must validate extraction accuracy before committing to the full pipeline.

**#10 — UK mosque coverage estimate?**
What percentage of UK mosques have extractable timetables (HTML tables, PDFs, images)?

> **Decision: Unknown.** Haven't researched this yet. Closely tied to #9 — prompt testing will reveal real coverage numbers.

**#11 — Monthly LLM budget ceiling?**
Cost projections range from $2-400/month. Opus-only (decision #4) pushes costs to the higher end.

> **Decision: No hard ceiling.** Willing to spend what's needed. Monitor costs and adjust if they become unreasonable.

**#12 — Monitoring infrastructure?**
Multiple reviews noted monitoring is "non-negotiable" for a scraping system. Is there existing infrastructure?

> **Decision: None yet.** No existing Sentry, Datadog, CloudWatch, etc. Monitoring setup is additional implementation work beyond what the ADR describes.

---

### Site Navigation

**#13 — Homepage vs prayer page gap?**
Real-world testing against WLICC revealed that Google Maps returns the mosque homepage, not the prayer times page. The extraction prompt assumes the right content is already fetched.

> **Decision: Add Site Navigation phase.** A two-pass step between Homepage Fetch and Pre-processing: (1) discover the prayer times page link from the homepage, (2) verify the page shows current data before extracting. Many sites default to the current month on first load — check content first before attempting URL parameter manipulation. See ADR.md "Site Navigation (Pre-Extraction)" section and `navigation-prompt.md`.

---

## Real-World Test Results

### WLICC — West London Islamic Cultural Centre

**Mosque:** WLICC, 7 Bridges Place, Parsons Green, London SW6 4HW
**Website:** wlicc.org/prayertime
**Google Maps URL:** Points to wlicc.org (homepage, not prayer page)

**Key findings:**

1. **Third-party aggregators were inaccurate:** Aggregator sites showed times 2-6 minutes off from the mosque's own timetable, and none included jamaat (congregation) times. This validates the ADR's core thesis — mosque-specific scraping provides data that aggregators cannot.

2. **Navigation required:** Google Maps returned the homepage. The prayer times page is at `/prayertime`, discoverable via a "Prayer Time" link in the site navigation.

3. **Date handling is nuanced:** The prayer page defaults to the current month on first load with **no URL query parameter**. A months dropdown exists — only when a user selects a different month does the URL update with a `?month=N` parameter. This means:
   - For the current month: a simple fetch of `/prayertime` returns correct data
   - For other months (e.g., fetching ahead): the `?month=N` parameter is needed
   - The navigation step should check content first, not assume URL parameters are always needed

4. **Extraction difficulty: Easy** — Clean HTML table with separate "Start" and "Jama'ah" columns for each prayer. The extraction prompt would handle this with high confidence.

5. **Scrapability: High** (once navigated to the correct page)

**Implications for the pipeline:**

- Homepage → prayer page navigation is a required step, not optional
- Content verification (does the page already show today's data?) should precede URL parameter discovery
- Sites with JS-driven dropdowns may need Puppeteer to change months, but simple first-load fetches work for the current month

### ICCUK — Islamic Cultural Centre UK

**Mosque:** ICCUK, 146 Park Road, London NW8 7RG
**Website:** iccuk.org
**Google Maps URL:** Points to iccuk.org (homepage)

**Key findings:**

1. **LLM-only navigation failed:** When given raw HTML, the LLM could parse links and identify prayer-related URLs, but it could not render the page, click links, observe results, or interact with JavaScript-driven UI. This was link scraping, not navigation.

2. **Browser required:** The site uses dynamic content that requires JavaScript rendering. Raw HTML fetches miss content that only appears after JS execution.

3. **Validates Crawl4AI decision:** This test case proved that navigation requires a real browser (Crawl4AI/Playwright) with an LLM analysing rendered content — not an LLM reading raw HTML.

**Implications for the pipeline:**

- Navigation must use a real browser (Crawl4AI/Playwright), not raw HTML + LLM
- An LLM inside Crawl4AI analyses rendered pages to decide where to navigate
- This is a two-LLM architecture: navigation LLM (find the page) + extraction LLM (parse the times)

---

## Remaining Open Questions

Only two items remain unresolved:

1. **CDN propagation delay (#6)** — Start with raw GitHub URLs; revisit CDN strategy for production.
2. **Pre-implementation validation** — Prompt testing (#9) and mosque coverage assessment (#10) must happen before Phase 1 begins.

---

## Consensus Recommendations (Annotated with Decisions)

All five reviews converged on these recommendations. Each is annotated with the user's decision where it differs from the recommendation.

1. **Tier the LLM model (Haiku first, Opus fallback)**
   _User chose: Opus only._ ADR to be updated to align with extraction prompt.

2. **Defer Puppeteer and PDF/image to later phase**
   _User chose: Full scope from day 1._ No phased deferral.

3. **Defer app attestation to post-MVP**
   _User chose: Include in MVP._ Security ships on day 1.

4. **Reconsider hybrid fallback (calculation baseline)**
   _User chose: No fallback._ Mosque-only as designed.

5. **Prototype scraping pipeline first**
   _User agrees._ Test extraction prompt on 10-20 real mosque websites before building infrastructure.

6. **Start with Phase 0 (refactor) immediately**
   _User agrees._ London parameterization is valuable independently and is a prerequisite.

7. **Monitoring is non-negotiable**
   _User agrees._ But notes this is additional setup — no existing infrastructure.

8. **Scope lock to UK in Phase 1**
   _User agrees._ ~900 UK mosques are enough to validate the approach.

9. **Add race condition handling (dedup)**
   _User agrees._ In-memory Map, not an external queue.

10. **Skip truncation for full timetable pages**
    _User agrees._ Send complete content to LLM for monthly/yearly tables.

---

## ADR Updates Required

Based on these decisions, the following changes are needed in `ADR.md`:

- [ ] Update "LLM Model Selection" section to reflect Opus-only (remove Haiku-first recommendation)
- [ ] Add resolved items (#5, #7, #8) to Open Questions section
- [ ] Note that #6 (CDN propagation) remains open — start with raw GitHub URLs
- [ ] Add truncation exception to pre-processing
- [ ] Note monitoring requires additional infrastructure setup
