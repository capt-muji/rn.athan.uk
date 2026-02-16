# Tool & Infrastructure Decision

**Date:** 2026-02-16
**Resolves:** Web Crawling Technology (ADR.md), LLM Model Selection (ADR.md), Backend Platform (Open Question #1)

---

## Summary

| Decision                 | Choice                 | Rationale                                                                  |
| ------------------------ | ---------------------- | -------------------------------------------------------------------------- |
| **Web Crawling Tool**    | Browser Use (Option A) | Navigation is the hardest problem; Browser Use solves it natively          |
| **Navigation Model**     | Gemini 3 Pro           | 72.7% ScreenSpot-Pro, 85.4% tau2-bench, ranked #1 by 5/5 reports           |
| **Extraction Model**     | Opus 4.6               | ~95%+ F1 direct HTML-to-JSON, best instruction-following                   |
| **Infrastructure**       | Google Cloud Run       | Docker-native, 1-hour timeout, free tier covers ~500 invocations/month     |
| **Vercel Agent Browser** | Drop                   | Wrong tool. Navigation-only, no extraction, TypeScript boundary            |
| **Crawl4AI**             | Skip (for now)         | Optimization features (Markdown, BM25, batch) not needed for reliability   |
| **HTML preprocessing**   | None                   | Adds failure point with no reliability benefit; Opus handles noisy content |

---

## Navigation vs Extraction: Two Different Problems

The pipeline has two fundamentally different challenges:

| Problem        | Description                                             | Hard because...                                 |
| -------------- | ------------------------------------------------------- | ----------------------------------------------- |
| **Navigation** | Given a mosque homepage, find the prayer times page     | Every site is different. Requires intelligence. |
| **Extraction** | Given a page with prayer times, extract structured JSON | Requires accuracy and clean content.            |

No single tool is best at both:

- **Crawl4AI** is great at extraction, bad at navigation
- **Browser Use** is great at navigation, mediocre at extraction
- **Vercel Agent Browser** is efficient at navigation, does zero extraction

The solution: use each tool where it's strongest.

---

## What Each Tool Actually Is

### Crawl4AI -- A scraping pipeline with a browser inside it

A factory conveyor belt. You feed it URLs, it renders pages in a browser, converts HTML to clean Markdown, and optionally uses an LLM to extract structured data.

**Built for:** High-throughput data extraction. Taking a URL you already have and getting clean, structured data out of it.

**How it navigates:** It doesn't, really. It can do BFS link crawling (follow every link on a page) and you can script specific JS interactions (click this button, select this dropdown). But it has no intelligence about _what_ to click. If you want it to find the prayer times page on an unfamiliar site, you have to write the orchestration code: render page -> extract links -> call a separate LLM -> parse the LLM's response -> tell Crawl4AI to click -> check result -> repeat. That's the 12-step loop from `crawler_comparison.md`.

**Core strengths:** Best-in-class HTML to Markdown conversion, BM25 content filtering, async batch crawling, built-in caching, no LLM cost for basic extraction (CSS/XPath selectors).

**Core weakness:** No brain. It does exactly what you tell it -- it can't figure out where to go on its own.

### Browser Use -- An AI agent that controls a browser

A human sitting at a computer, looking at the screen, deciding what to click next. Except the "human" is an LLM.

**Built for:** Autonomous navigation of unfamiliar websites. You give it a goal in plain English ("find the prayer times on this mosque website") and it figures out what to click, what to fill in, what to scroll, all by itself.

**How it navigates:** It takes a screenshot + DOM snapshot at each step, sends it to an LLM (your choice: Gemini, Claude, GPT, etc.), the LLM decides the next action, Browser Use executes it via Playwright, then loops. It's a closed-loop agent.

**Core strengths:** Solves the hardest problem (navigation across diverse, unknown websites). Natural language task descriptions. Handles login flows, dropdowns, SPAs, JS-heavy sites. Error recovery. Model-agnostic.

**Core weakness:** No content pipeline. It gives you raw page content -- no Markdown conversion, no content filtering, no batch processing. It's a navigator, not an extractor.

### Vercel Agent Browser -- A CLI tool that makes browsers context-efficient for AI

A translator that sits between an AI agent and a browser, compressing what the browser sees into a format that uses 93% fewer tokens.

**Built for:** Making any AI coding agent (Claude Code, Cursor, etc.) able to control a browser without blowing through its context window. It's a _tool for AI agents_, not an agent itself.

**Why eliminated:** Navigation-only -- no extraction pipeline, no Markdown conversion, no batch crawling. TypeScript/Rust while the backend is Python. All 5 reports unanimously eliminated it because it requires bolting on a separate extraction layer to do what Browser Use or Crawl4AI already provide end-to-end.

---

## Why Browser Use (Option A)

### Navigation is the hardest problem

Crawl4AI's BFS link crawling cannot autonomously navigate unfamiliar mosque websites. Browser Use's LLM-driven navigation can. The 12-step manual orchestration loop (from `crawler_comparison.md` section 3) collapses to 3 lines:

```python
agent = Agent(
    task="Navigate to the prayer times page. Find today's timetable. "
         "If the wrong month is shown, select the correct month.",
    llm=chosen_model,
    browser=browser,
)
result = await agent.run()
```

### Why Gemini 3 Pro for navigation

- 72.7% ScreenSpot-Pro (highest screen understanding of any model)
- 85.4% tau2-bench (highest agentic tool use)
- Ranked #1 or #2 by all 5 independent research reports
- Vision-based: actually "sees" the page to decide what to click

---

## Why Opus 4.6 for Extraction

### Not Gemini 3 Pro

It's tempting to use one model for both navigation AND extraction. But:

1. **No evidence Gemini 3 Pro is better at direct extraction.** Its #1 Zyte benchmark score (0.8533 ROUGE-1 F1) measures _scraping code generation_ ("write me a Python scraper"), not direct HTML-to-JSON extraction. The pipeline sends HTML to an LLM and asks for JSON directly -- that's Opus's core strength.

2. **Opus 4.6 has ~95%+ F1 for structured extraction.** 3/5 reports recommend it specifically. No equivalent benchmark exists for Gemini on the same task.

3. **Gemini 3 Pro is unproven for the specific task.** It might be equally good. It might not. If reliability is everything, go with the proven option. Gemini extraction can be tested later as a comparison.

### No HTML preprocessing step

The idea of using Gemini to strip HTML before sending to Opus adds a failure point for zero reliability gain:

1. If Gemini strips too aggressively, it removes data Opus needs (a prayer time in an unusual format, a jamaat time in a sidebar, a Jummah note in a footnote).
2. Opus handles noisy content well -- 3/5 reports explicitly note this. Sending it a full page with nav bars, footers, and ads doesn't confuse it.
3. Every extra LLM call is another thing that can fail (network timeout, rate limit, model error, unexpected response format).
4. Cost is not a concern -- the only reason to strip HTML first would be to reduce Opus input tokens and save money.

---

## Why Skip Crawl4AI (For Now)

Its strengths (Markdown conversion, BM25 filtering, batch crawling) are optimization features, not reliability features. They save tokens and reduce noise -- but Opus doesn't need that help. Fewer moving parts = fewer things that break.

**Add Crawl4AI later only if** validation testing shows extraction accuracy suffering from noisy HTML. At that point, insert it between Browser Use and Opus as a content-cleaning step (the Hybrid architecture, Option C).

---

## The Pipeline (Deliberately Minimal)

```
Mosque URL (from Google Maps)
    |
Browser Use + Gemini 3 Pro (NAVIGATION)
    -> Opens mosque homepage in Chromium
    -> LLM sees the page, decides what to click
    -> Navigates to prayer times page autonomously
    -> Handles dropdowns, SPAs, JS rendering
    -> Returns rendered page content
    |
Opus 4.6 (EXTRACTION)
    -> Receives full page content (no preprocessing)
    -> Extracts structured JSON via extraction prompt
    -> Returns prayer times + confidence score
    |
Validation -> GitHub repo -> CDN -> App
```

**Two steps. Two models. Each doing what it's best at.**

If navigation fails -> confidence is "low" or status is "no_times" -> try next mosque.
If extraction fails -> confidence is "low" -> discard, try next refresh cycle.

No silent failures. The confidence scoring in the extraction prompt is the safety net.

---

## Infrastructure: Google Cloud Run

### Why Cloud Run (not Lambda)

Browser Use runs headless Playwright/Chromium. Lambda can do this, but it's a fight:

| Factor                       | Cloud Run                           | Lambda                                             |
| ---------------------------- | ----------------------------------- | -------------------------------------------------- |
| **Timeout**                  | 60 minutes                          | 15 minutes                                         |
| **Container size**           | No practical limit (Docker)         | 250MB zip or 10GB container image                  |
| **Chromium deployment**      | Just put it in Docker. Done.        | Need `@sparticuz/chromium` or fight package limits |
| **Cold start (Chromium)**    | ~15-45s                             | ~10-30s (slightly faster but fragile)              |
| **Memory**                   | Up to 32GB                          | Up to 10GB                                         |
| **Scales to zero**           | Yes                                 | Yes                                                |
| **Free tier**                | 180k vCPU-sec/month (~50 CPU-hours) | 400k GB-sec/month                                  |
| **Reliability for browsers** | Excellent (native Docker)           | Fragile (Chromium packaging issues)                |

Lambda was designed for lightweight request-response, not headless browsers. Cloud Run just runs a Docker container -- the same image that works locally works in production.

### Why not Browserbase

| Factor                           | Cloud Run                      | Browserbase                    |
| -------------------------------- | ------------------------------ | ------------------------------ |
| **Cost (500 invocations/month)** | **Free** (within free tier)    | **$20/month** (Developer plan) |
| **Anti-bot/stealth**             | None built-in                  | Stealth mode + auto captcha    |
| **Vendor dependency**            | Google Cloud (massive, stable) | Startup                        |
| **Control**                      | Full                           | Limited to their API           |

Mosque websites don't have aggressive anti-bot measures -- they're simple community sites. Browserbase's premium features (stealth mode, captcha solving) are unnecessary.

### Cold starts

Cloud Run scales to zero. Next request triggers a cold start:

- Container spinup: 5-15 seconds
- Chromium initialization: 10-30 seconds
- **Total cold start: ~15-45 seconds**

For this use case (scraping happens on cache miss, not real-time), a cold start is fine. The user sees cached data immediately; the background refresh happens asynchronously.

To eliminate cold starts: set `min-instances=1` (~$5-10/month for always-warm container).

---

## What Still Needs Validation

Test against 10-20 real mosque websites before building the full backend:

1. **Navigation success rate** -- does Browser Use + Gemini 3 Pro find the prayer page reliably?
2. **Extraction accuracy** -- does Opus get correct JSON from raw Browser Use output?
3. **Edge cases** -- PDF timetables, image-only timetables, sites with no prayer page at all
4. **Fallback behavior** -- when navigation fails, does the pipeline degrade gracefully?

---

## Design Principle

Fewer moving parts = fewer things that break. Use the best model for each job, don't add unnecessary steps, and let the confidence scoring catch failures gracefully.
