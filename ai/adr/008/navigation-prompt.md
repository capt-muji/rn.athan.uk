# Site Navigation Strategy — Crawl4AI + Navigation LLM

How the scraping pipeline navigates from a mosque's homepage to its prayer times content, renders dynamic pages, and prepares content for LLM extraction.

**Architecture:** Two-LLM pipeline

1. **Navigation LLM** (inside Crawl4AI) — analyses rendered pages to decide where to click to find the prayer timetable
2. **Extraction LLM** (Opus 4.6) — parses the found prayer timetable content into structured JSON

---

## Why Browser + LLM Navigation

Real-world testing against WLICC and ICCUK revealed two things:

1. **Raw HTML is insufficient** — many mosque websites use JavaScript rendering, SPAs, and dynamic content that only appears after JS execution. A real browser is required.
2. **Every site is different** — there is no universal set of heuristics that reliably finds the prayer timetable across the full diversity of mosque websites. An LLM must analyse each rendered page to decide where to navigate.

| Component                 | Role                                                                                 | Why needed                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| **Crawl4AI (Playwright)** | Renders pages in a real browser, executes JS, clicks links, interacts with dropdowns | Handles CSR, SPAs, JS-driven UI — raw HTML fetches miss dynamic content                  |
| **Navigation LLM**        | Analyses rendered content and decides which link leads to the prayer timetable       | Every mosque site is structured differently — an LLM generalises where heuristics cannot |

The ICCUK test case (iccuk.org) demonstrated this clearly: an LLM reading raw HTML could identify links containing prayer-related keywords, but it could not render the page, click those links, observe the result, or interact with JavaScript-driven UI elements. This amounted to link scraping, not navigation. Conversely, keyword heuristics alone would fail on sites with non-standard navigation structures, unusual terminology, or deeply nested prayer pages.

Many mosque websites use:

- **Client-side rendering (CSR)** — prayer times loaded via JavaScript after initial page load
- **Single-page applications (SPAs)** — navigation doesn't change the URL
- **JavaScript dropdowns** — month/year selection triggers AJAX requests, not URL changes
- **Dynamic content** — timetables rendered from API calls, not present in raw HTML

A real browser handles the rendering. An LLM handles the decision-making. Together they navigate any site.

---

## Navigation Pipeline (Crawl4AI + Navigation LLM)

### Step 1: Render Homepage

Crawl4AI loads the mosque homepage URL (from Google Maps) in Playwright:

- Full browser rendering — executes JavaScript, loads dynamic content
- Waits for page load complete (network idle or DOM stable)
- Captures rendered HTML + screenshot for debugging

### Step 2: Prayer Page Discovery (Navigation LLM)

The navigation LLM analyses the **rendered** page content and visible links to decide which link most likely leads to the prayer timetable.

**Navigation LLM prompt** (sent with rendered page content):

```
You are navigating a mosque website to find the prayer times page.
Given the rendered page content and available links, identify which link
most likely leads to the prayer timetable.

**Base URL:** {base_url}
**Available links on page:**

{links_list}

**Rendered page content (summary):**

{page_content_summary}

## Output Schema

{
  "best_link": "absolute URL or null",
  "link_text": "text of the suggested link, or null",
  "confidence": "high" | "medium" | "low",
  "reasoning": "brief explanation of why this link was chosen",
  "prayer_times_on_current_page": true | false,
  "notes": "string or null"
}

## Rules

- Only suggest links on the same domain as {base_url}
- Prefer links in navigation menus over body content
- Consider both link text and URL path when making the decision
- Look for prayer-related terms in any language: prayer, salah, namaz, timetable, times, prayertime, salat, awqat, mawaqit
- If prayer times are already visible on the current page, set prayer_times_on_current_page to true and best_link to null
- If no link seems prayer-related and no times are visible, return best_link as null
- Confidence should reflect how certain you are this leads to prayer times
```

**Template variables:**

| Variable                 | Description                                            | Example                               |
| ------------------------ | ------------------------------------------------------ | ------------------------------------- |
| `{base_url}`             | Mosque homepage URL                                    | `https://www.iccuk.org`               |
| `{links_list}`           | Extracted links from rendered page (text + href pairs) | `Prayer Times → /prayer-times`        |
| `{page_content_summary}` | Key content from the rendered page (truncated)         | Visible text, headings, table headers |

**Navigation LLM model:** TBD — best model for web navigation tasks. This is a structural analysis task (understand page layout, identify the right link), not data extraction. Model selection should optimise for navigation accuracy.

**If `prayer_times_on_current_page` is true** → skip to Step 4 (some mosques embed times directly on the homepage).

**If `best_link` is returned** → proceed to Step 3.

**If `best_link` is null and no times on page** → flag as no prayer page found, proceed with homepage content as-is.

### Step 3: Navigate to Prayer Page

If a prayer link was identified in Step 2:

- Crawl4AI clicks the link (real browser click, not HTTP fetch)
- Waits for page load complete
- This handles SPAs, JS-driven navigation, and pages that don't change the URL

### Step 4: Date Verification

Check if the rendered prayer page contains **current** data:

**Check for (in rendered content):**

- Today's exact date in any format (e.g., "16 February 2026", "16/02/2026", "2026-02-16")
- Current month name ("February") or number with correct year
- A timetable header/caption referencing current month/year

**Important:** Many mosque websites default to the current month on first load with no URL parameters. The absence of date parameters does NOT mean data is stale — always check rendered content first.

**If content has current data → proceed to Step 5** (no further navigation needed).

**If content shows wrong month/date:**

- Look for `<select>` dropdowns with month/year options
- Look for navigation tabs or links with month names
- Look for URL patterns (`?month=N`, `?m=N&y=YYYY`, `/timetable/2026/02`)
- If a dropdown exists: Crawl4AI selects the correct month value and waits for content update
- If URL parameters exist: Crawl4AI navigates to the corrected URL
- If navigation requires JS interaction (e.g., `onchange` event on a `<select>`): Crawl4AI triggers the event and waits for DOM update

**If still wrong after navigation attempt → flag as stale.** Proceed with available content — the extraction prompt handles stale detection via `date_on_page` + low confidence.

### Step 5: Content Extraction

Once the prayer page is rendered with current data:

- Crawl4AI converts rendered HTML to Markdown (built-in feature)
- Strip non-content elements (nav, footer, cookie banners, ads)
- The Markdown output is passed to the Opus 4.6 extraction prompt

**Maximum navigation depth:** 3 page loads per mosque (homepage → prayer page → date-corrected page). This prevents infinite loops on sites with complex navigation.

---

## Example: WLICC (West London Islamic Cultural Centre)

**Input:** `wlicc.org` (homepage URL from Google Maps)

1. **Render homepage** — Crawl4AI loads `wlicc.org` in Playwright
2. **Navigation LLM** — analyses rendered page, identifies `<a href="/prayertime">Prayer Time</a>` in navigation as the best link (high confidence)
3. **Click prayer link** — Crawl4AI clicks, page loads `wlicc.org/prayertime`
4. **Verify date** — Rendered content shows "February 2026" timetable (current month, correct on first load)
5. **Extract** — Convert to Markdown, send to Opus extraction prompt

**Result:** 2 page loads, 1 navigation LLM call, correct content obtained.

## Example: ICCUK (Islamic Cultural Centre UK)

**Input:** `iccuk.org` (homepage URL from Google Maps)

1. **Render homepage** — Crawl4AI loads `iccuk.org` in Playwright
2. **Navigation LLM** — analyses rendered page, identifies prayer/timetable link (the LLM can understand page context that simple keyword matching might miss)
3. **Click prayer link** — Crawl4AI clicks, navigates to prayer page
4. **Verify date** — Check if rendered content has current month data
5. **If JS dropdown needed** — Crawl4AI interacts with month selector, waits for content update
6. **Extract** — Convert to Markdown, send to Opus extraction prompt

**Why a real browser + LLM is required here:** The LLM could identify links in raw HTML but could not render the page, click them, or interact with any dynamic elements. The "navigation" was just URL guessing. Crawl4AI provides the browser; the navigation LLM provides the intelligence.

---

## Cost Notes

Navigation has an LLM cost per scrape — each navigation requires one call to the navigation LLM to analyse the rendered page and decide where to click. This is in addition to the Opus 4.6 extraction cost.

| Component                  | Cost per scrape                                 |
| -------------------------- | ----------------------------------------------- |
| Navigation LLM (model TBD) | ~$0.001-0.01 (structural analysis, small input) |
| Extraction LLM (Opus 4.6)  | ~$0.03-0.10                                     |
| Crawl4AI rendering         | Free (compute only)                             |

The navigation LLM model will be chosen based on the best accuracy for web navigation tasks. It does not need to be the same model as extraction — navigation is a simpler task (pick the right link) while extraction requires Opus-level accuracy.

---

## Pre-processing Notes

All pre-processing is handled by Crawl4AI's built-in capabilities:

1. **JavaScript rendering** — Playwright executes all JS before content extraction
2. **Markdown conversion** — Crawl4AI converts rendered HTML to clean Markdown
3. **Element removal** — Configure Crawl4AI to strip `<script>`, `<style>`, cookie banners, ads
4. **Screenshot capture** — Optional, useful for debugging navigation failures

The output of this navigation pipeline is clean Markdown content ready for the Opus 4.6 extraction prompt. No additional pre-processing step is needed between navigation and extraction.
