# Site Navigation Strategy — Browser Use + Gemini 3 Pro

How the scraping pipeline navigates from a mosque's homepage to its prayer times content using autonomous browser navigation.

**Architecture:** Two-model pipeline

1. **Browser Use + Gemini 3 Pro** (navigation) — autonomous browser agent that sees rendered pages and decides what to click to find the prayer timetable
2. **Opus 4.6** (extraction) — parses the found prayer timetable content into structured JSON

---

## Why Browser Use

Real-world testing against WLICC and ICCUK revealed two things:

1. **Raw HTML is insufficient** — many mosque websites use JavaScript rendering, SPAs, and dynamic content that only appears after JS execution. A real browser is required.
2. **Every site is different** — there is no universal set of heuristics that reliably finds the prayer timetable across the full diversity of mosque websites. An LLM must analyse each rendered page to decide where to navigate.

| Component                    | Role                                                                                              | Why needed                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Browser Use (Playwright)** | Opens pages in a real browser, executes JS, clicks links, interacts with dropdowns — autonomously | Handles CSR, SPAs, JS-driven UI — raw HTML fetches miss dynamic content                  |
| **Gemini 3 Pro**             | Receives screenshots + DOM snapshots from Browser Use and decides what to click at each step      | Every mosque site is structured differently — an LLM generalises where heuristics cannot |

The ICCUK test case (iccuk.org) demonstrated this clearly: an LLM reading raw HTML could identify links containing prayer-related keywords, but it could not render the page, click those links, observe the result, or interact with JavaScript-driven UI elements. This amounted to link scraping, not navigation.

Many mosque websites use:

- **Client-side rendering (CSR)** — prayer times loaded via JavaScript after initial page load
- **Single-page applications (SPAs)** — navigation doesn't change the URL
- **JavaScript dropdowns** — month/year selection triggers AJAX requests, not URL changes
- **Dynamic content** — timetables rendered from API calls, not present in raw HTML

Browser Use combines the browser and the LLM into a single closed-loop agent. At each step, it takes a screenshot + DOM snapshot, sends them to Gemini 3 Pro, the model decides the next action (click, scroll, type, select), Browser Use executes it via Playwright, then loops until the task is complete.

### Why Browser Use over Crawl4AI

With Crawl4AI, the navigation loop requires ~12 manual orchestration steps (render page, extract links, call separate LLM, parse response, tell Crawl4AI to click, verify, repeat). With Browser Use, this collapses to a single agent task. See `crawler_comparison.md` section 3 for the detailed comparison and `tool-decision.md` for the full decision rationale.

### Why Gemini 3 Pro for navigation

- 72.7% ScreenSpot-Pro — highest screen understanding of any model
- 85.4% tau2-bench — highest agentic tool use
- Ranked #1 or #2 by all 5 independent research reports
- Vision-based: actually "sees" the rendered page to decide what to click
- See `crawler_comparison.md` section 5 for full model rankings

---

## Navigation Pipeline (Browser Use + Gemini 3 Pro)

### The Agent Task

Browser Use receives a natural language task description and navigates autonomously:

```python
from browser_use import Agent, BrowserSession

browser = BrowserSession(headless=True)

agent = Agent(
    task=(
        f"Navigate to {mosque_url} and find the prayer times page. "
        f"Find today's timetable ({today_date}, {current_month} {current_year}). "
        f"If the wrong month is shown, use dropdowns or navigation to select "
        f"the correct month. Once the prayer times are visible, stop."
    ),
    llm=gemini_3_pro,
    browser=browser,
)

result = await agent.run()
page_content = await browser.get_page_content()
```

### What Browser Use handles autonomously

All of the following were manual orchestration steps in the previous Crawl4AI approach. Browser Use handles them as part of its agent loop:

1. **Render homepage** — opens the mosque URL in headless Chromium, executes JavaScript, waits for page load
2. **Prayer page discovery** — Gemini 3 Pro sees the rendered page and identifies which link leads to the prayer timetable
3. **Navigation** — clicks the identified link, waits for page load, handles SPAs and JS-driven navigation
4. **Date verification** — checks if the rendered content shows current data (today's date, current month/year)
5. **Date correction** — if wrong month is shown, interacts with dropdowns, selects, or date pickers to navigate to the correct month
6. **Error recovery** — if something fails, tries a different approach (back button, alternative link, etc.)

### Constraints

- **Maximum navigation depth:** The agent task should include a reasonable step limit to prevent infinite loops on sites with complex navigation. Browser Use supports `max_steps` parameter.
- **Timeout:** Navigation should complete within 60 seconds for most sites. Sites that exceed this are likely broken or have no prayer times page.
- **Same-domain only:** The agent should stay on the mosque's domain (not follow external links to aggregator sites).

### After navigation completes

Once Browser Use has navigated to the prayer times page:

1. **Get page content** — retrieve the rendered HTML from the browser session
2. **Send to Opus 4.6** — pass the full rendered page content directly to the extraction prompt
3. **No preprocessing** — no Markdown conversion, no HTML stripping, no intermediate LLM call. Opus handles noisy content well (see `tool-decision.md`).

---

## Example: WLICC (West London Islamic Cultural Centre)

**Input:** `wlicc.org` (homepage URL from Google Maps)

Browser Use agent task: "Navigate to wlicc.org and find the prayer times page. Find today's timetable."

1. **Agent opens homepage** — Browser Use loads `wlicc.org` in Chromium
2. **Agent sees page** — Gemini 3 Pro receives screenshot + DOM, identifies "Prayer Time" link in navigation
3. **Agent clicks** — navigates to `wlicc.org/prayertime`
4. **Agent verifies** — sees "February 2026" timetable (current month, correct on first load)
5. **Agent stops** — task complete, prayer times are visible
6. **Extract** — page content sent to Opus 4.6 extraction prompt

**Result:** Autonomous navigation, no manual orchestration code needed.

## Example: ICCUK (Islamic Cultural Centre UK)

**Input:** `iccuk.org` (homepage URL from Google Maps)

Browser Use agent task: "Navigate to iccuk.org and find the prayer times page. Find today's timetable. If the wrong month is shown, select the correct month."

1. **Agent opens homepage** — Browser Use loads `iccuk.org` in Chromium (JS renders the SPA)
2. **Agent sees page** — Gemini 3 Pro identifies prayer/timetable link from the rendered content
3. **Agent clicks** — navigates to prayer page
4. **Agent verifies** — checks if rendered content shows current month
5. **Agent corrects date** — if wrong month, interacts with month selector dropdown
6. **Agent stops** — correct timetable visible
7. **Extract** — page content sent to Opus 4.6 extraction prompt

**Why Browser Use is required here:** The site uses client-side rendering — raw HTML shows `<div id="app"></div>` with no prayer content. A real browser must render the JavaScript. Browser Use handles both the rendering and the navigation intelligence in a single agent loop.

---

## Cost Notes

| Component                        | Cost per scrape                             |
| -------------------------------- | ------------------------------------------- |
| Gemini 3 Pro (navigation agent)  | ~$0.001-0.01 (vision-based, multiple steps) |
| Opus 4.6 (extraction)            | ~$0.03-0.10                                 |
| Browser Use / Chromium rendering | Free (open-source, Cloud Run compute only)  |

Navigation and extraction use different models because they are different tasks. Navigation requires the best screen understanding (Gemini 3 Pro, 72.7% ScreenSpot-Pro). Extraction requires the best structured output accuracy (Opus 4.6, ~95%+ F1).

---

## Previous approach (Crawl4AI, superseded)

The original navigation strategy used Crawl4AI with a separate navigation LLM prompt (see git history for the previous version of this file). That approach required a custom navigation prompt, manual link extraction, explicit orchestration of each navigation step, and separate handling of dropdown interactions. Browser Use replaces all of this with autonomous agent navigation.
