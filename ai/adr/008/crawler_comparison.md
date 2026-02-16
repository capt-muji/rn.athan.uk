# Consolidated Crawler & Model Comparison

**Context:** ADR-008 Multi-Location Expansion via AI-Powered Mosque Scraping
**Date:** 2026-02-16

---

## 1. Methodology

Five AI models were independently given the same set of questions about the ADR-008 scraping pipeline:

1. Which crawling tool should the pipeline use? (Crawl4AI vs Browser Use vs Playwright vs Vercel AI Browser)
2. Which are the top models for web navigation and extraction?
3. What architecture should the mosque prayer-time pipeline adopt?

Each model researched and answered without seeing the others' outputs. The five respondents:

| Report        | Model     | Via         |
| ------------- | --------- | ----------- |
| MM2           | MiniMax-2 | Direct      |
| GLM-5         | GLM-5     | Direct      |
| Opus-OpenCode | Opus 4.6  | OpenCode    |
| Kimi          | Kimi      | OpenCode    |
| Opus-Claude   | Opus 4.6  | Claude Code |

Results were then synthesized into this document. Where reports agree, the consensus is stated. Where they diverge, the split and each side's reasoning are presented. No single report's recommendation is adopted wholesale — decisions are deferred to validation testing.

---

## 2. Tool Comparison

All five reports evaluated the same four tools. The consensus comparison:

| Attribute                 | Playwright                 | Vercel Agent Browser         | Crawl4AI                               | Browser Use                    |
| ------------------------- | -------------------------- | ---------------------------- | -------------------------------------- | ------------------------------ |
| **What it is**            | Browser automation library | LLM-powered navigation agent | Playwright wrapper + scraping pipeline | Full browser agent framework   |
| **License**               | Apache 2.0                 | MIT                          | Apache 2.0                             | MIT                            |
| **Language**              | JS / Python                | TypeScript / Rust            | Python                                 | Python                         |
| **GitHub stars**          | —                          | ~12k                         | ~60k                                   | ~78k                           |
| **Self-hostable**         | Yes                        | Yes                          | Yes                                    | Yes                            |
| **Under the hood**        | Direct Chromium            | Accessibility-tree snapshots | Playwright                             | Playwright                     |
| **LLM-driven navigation** | No                         | Yes (82% token savings)      | No — BFS link crawling only            | Yes — LLM sees page, decides   |
| **Extraction**            | Manual selectors           | None (navigation only)       | Schema JSON, LLM helpers, Markdown     | LLM-driven semantic extraction |
| **HTML to Markdown**      | No                         | No                           | Built-in (best-in-class)               | Not a focus                    |
| **Content filtering**     | No                         | No                           | BM25 relevance, pruning                | Vision-based element detection |
| **Batch async crawling**  | Manual                     | No                           | Built-in browser pool                  | Single-agent focus             |
| **Caching**               | Manual                     | No                           | Built-in                               | No built-in                    |
| **LLM support**           | N/A                        | Own model                    | Any (OpenAI, Claude, Ollama)           | Any (OpenAI, Claude, Ollama)   |
| **Cost**                  | Free (compute)             | Free (compute)               | Free (compute)                         | Free (compute)                 |

### Unanimous eliminations (5/5 agree)

**Playwright eliminated.** Every mosque website is different — writing and maintaining brittle CSS selectors for ~900 unique site layouts is exactly the problem LLM-powered scraping solves. All five reports agree raw Playwright is too much manual work.

**Vercel Agent Browser eliminated.** Elegant navigation tech (82% token reduction via accessibility-tree snapshots + element refs), but navigation-only. No Markdown conversion, no content extraction pipeline, no async batch crawling. TypeScript/Rust boundary adds friction to a Python backend. All five reports agree it requires bolting on a separate extraction layer to achieve what Crawl4AI or Browser Use provide end-to-end.

---

## 3. The Critical Difference: LLM-Driven Navigation vs BFS Crawling

The core disagreement between the five reports is whether Crawl4AI's navigation model is sufficient. Understanding this distinction is key.

**Crawl4AI navigation** is BFS (breadth-first search) link crawling. It follows all links on a page, optionally filtering by pattern. It does NOT look at a rendered page and decide "the prayer times are behind this link" or "I need to click this dropdown to change the month." Navigation requires manual orchestration — you render a page, extract links, call a separate navigation LLM, parse the response, tell Crawl4AI to click, check the result, and repeat.

**Browser Use navigation** is LLM-driven. You give it a natural language task ("Find the prayer times for February on this mosque's website") and it autonomously decides what to click, scroll, type, or select at each step. The LLM IS the navigation layer.

The Opus-OpenCode report illustrates this concretely. With Crawl4AI, the navigation loop requires ~12 manual orchestration steps:

```
1.  Render page via Crawl4AI
2.  Extract link text
3.  Call navigation LLM (separate model, separate prompt)
4.  Parse LLM response for best link
5.  Tell Crawl4AI to navigate to that link
6.  Wait for page load
7.  Check if correct content loaded
8.  If wrong month, call nav LLM again for dropdown
9.  Handle Crawl4AI clicking the dropdown
10. Verify final page content
11. Convert to Markdown
12. Send to extraction LLM
```

With Browser Use, steps 1-10 collapse to:

```python
agent = Agent(
    task="Navigate to the prayer times page. Find today's timetable. "
         "If the wrong month is shown, select the correct month.",
    llm=chosen_model,
    browser=browser,
)
result = await agent.run()
# Then send result to extraction LLM
```

This is the strongest technical argument for Browser Use: it solves the hardest problem (navigation across diverse, unfamiliar websites) natively, while Crawl4AI requires building the entire navigation intelligence manually.

---

## 4. Why a Browser Tool Is Needed

All five reports agree unanimously: an LLM with just a prompt and an HTTP fetch cannot handle the pipeline. The reasons:

| Capability           | LLM + Prompt Only                        | With Browser Tool                      |
| -------------------- | ---------------------------------------- | -------------------------------------- |
| JavaScript rendering | Cannot — sees empty `<div id="root">`    | Renders JS fully via Chromium          |
| SPA support          | Cannot — can't execute React/Vue/Angular | Handles all frameworks                 |
| Dropdown interaction | Cannot — can't click or select           | Real browser automation                |
| Dynamic content      | Cannot — static HTML snapshot only       | Handles lazy loading, AJAX             |
| Token efficiency     | 50K-200K tokens of raw HTML per page     | Content filtering gives 90%+ reduction |

**Real-world evidence (ICCUK test case):** An HTTP fetch to `iccuk.org` returns HTML with `<div id="app"></div>` — no prayer times. The site loads content via client-side JavaScript. A browser tool renders the page and extracts the actual timetable. This was confirmed in ADR-008's earlier considerations testing.

Many mosque websites load prayer times via JavaScript after page load, use dropdowns to switch months, or are single-page apps. A browser is not optional — it is required infrastructure.

---

## 5. Top Navigation Models

Synthesized from all five reports. Models are ranked by how many reports include them and their benchmark scores.

| Rank | Model                        | Reports (out of 5) | Key Benchmarks                                         | Type                      | Origin            |
| ---- | ---------------------------- | -----------------: | ------------------------------------------------------ | ------------------------- | ----------------- |
| 1    | **Gemini 3 Pro**             |                5/5 | ScreenSpot-Pro 72.7%, tau2-bench 85.4%, MMMU-Pro 81.0% | Closed                    | Google, US        |
| 2    | **DeepSeek v3.2**            |                3/5 | WebArena 74.3% (#1 on leaderboard)                     | Open-source               | DeepSeek, China   |
| 3    | **UI-TARS-1.5/2**            |                3/5 | Mind2Web 88.2%, OSWorld 42-47%, WebVoyager 84.8%       | Open-source               | ByteDance, China  |
| 4    | **ChatGPT Agent / Operator** |                4/5 | WebVoyager 87%, BrowseComp 68.9% (SOTA)                | Closed                    | OpenAI, US        |
| 5    | **Surfer 2**                 |                1/5 | WebVoyager 97.1% (claimed), OSWorld 60.1%              | Open-weights (Apache 2.0) | H Company, France |
| 6    | **Claude Opus 4.6**          |                3/5 | WebVoyager 84.1%, Online-Mind2Web 62.9%                | Closed                    | Anthropic, US     |

### Notes on rankings

**Gemini 3 Pro** is the only model ranked #1 or #2 by all five reports. Its ScreenSpot-Pro score (72.7%) is the highest screen-understanding result from any model. Caveat: no published WebArena or WebVoyager scores yet (model still in Preview). Ranking is based on agentic/grounding benchmarks as proxy.

**DeepSeek v3.2** holds the #1 position on the WebArena leaderboard (74.3%, beating GPT-5 at 71.6%). Fully open-source. Text/DOM-based, aligning with text-based crawling pipelines. Named by opus-opencode, glm, and opus-claude.

**UI-TARS-1.5/2** is the only model purpose-built for GUI interaction. Fine-tuned on ~50B tokens of GUI data. The 7B version is open-source on HuggingFace. 72B version outperforms GPT-4o on GUI benchmarks. Named by opus-opencode, opus-claude, and glm.

**Surfer 2** was surfaced by only one report (opus-claude) but claims the highest WebVoyager score of any agent (97.1%) — the first to surpass human baselines on both desktop and mobile. Multi-agent architecture. Open-weights under Apache 2.0. Not independently verified by other reports.

**ChatGPT Agent / Operator** has the highest BrowseComp score (68.9% SOTA), which tests exactly the ADR-008 scenario — finding specific data buried in diverse websites. Named by 4/5 reports but ranked lower because it is a closed product, not an embeddable model.

---

## 6. Top Extraction Models

| Model               | Extraction Quality                 | Notes                                            |
| ------------------- | ---------------------------------- | ------------------------------------------------ |
| **Claude Opus 4.6** | ~95%+ F1 structured extraction     | Best raw extraction accuracy for HTML/PDF/images |
| **Gemini 3 Pro**    | ROUGE-1 F1 0.8533 (Zyte benchmark) | #1 scraping code quality — but see caveat below  |
| **GPT-5**           | ROUGE-1 F1 0.8461 (Zyte benchmark) | Higher code complexity (13.68 vs 6.28)           |
| **Gemini 2.5 Pro**  | ROUGE-1 F1 0.8469 (Zyte benchmark) | Solid but slower than 3 Pro                      |
| **Sonnet 4.5**      | ROUGE-1 F1 0.7843 (Zyte benchmark) | Lower accuracy, fast and cheap                   |

### The Zyte benchmark caveat

The Zyte Web Scraping Copilot benchmark — which places Gemini 3 Pro at #1 — measures scraping **code generation** ("write me a Python scraper for this site"), not direct HTML-to-JSON extraction. The ADR-008 pipeline does not generate scraping code. It sends rendered HTML/Markdown content directly to an LLM and asks for structured JSON output.

Three reports (mm2, opus-opencode, opus-claude) correctly identify this distinction and recommend Opus 4.6 for extraction. Two reports (glm, kimi) recommend Gemini 3 Pro based on the Zyte benchmark without noting the code-generation vs direct-extraction difference.

For the actual pipeline step — raw HTML in, structured JSON out — Opus 4.6's instruction-following accuracy and structured output capabilities are best-in-class.

### Zyte detailed results (scraping code quality)

| Model          | SLOC  | Complexity | ROUGE-1 F1 (adj) |
| -------------- | ----- | ---------- | ---------------- |
| Gemini 3 Pro   | 21.49 | 6.28       | 0.8533           |
| Gemini 2.5 Pro | 20.07 | 5.75       | 0.8469           |
| GPT-5          | 38.71 | 13.68      | 0.8461           |
| GPT-5.1        | 35.47 | 11.64      | 0.8414           |
| GPT-5.1 Codex  | 35.61 | 12.10      | 0.8421           |
| Sonnet 4.5     | 20.66 | 6.00       | 0.7843           |
| Haiku 4.5      | 19.11 | 5.62       | 0.7955           |
| GPT-5 Mini     | 50.43 | 15.94      | 0.8027           |

---

## 7. Gemini 3 Pro Deep-Dive

Released November 2025. Named by all five reports. Consolidated benchmarks from across reports:

| Benchmark                             | Score                    | Context                                                      |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------ |
| ScreenSpot-Pro (screen understanding) | 72.7%                    | Highest of any model (UI-TARS-1.5: 61.6%, Claude 4.5: 36.2%) |
| tau2-bench (agentic tool use)         | 85.4%                    | Highest of any model                                         |
| MMMU-Pro (multimodal understanding)   | 81.0%                    | Strong vision capability                                     |
| GPQA Diamond (reasoning)              | 91.9% (93.8% Deep Think) | Top-tier reasoning                                           |
| AIME 2025 with code                   | 100%                     | Math                                                         |
| SWE-Bench (coding)                    | 76.2%                    | Strong coding                                                |
| Terminal-Bench 2.0 (computer use)     | 54.2%                    | General computer use                                         |
| Vending-Bench 2 (agentic planning)    | $5,478 mean net worth    | 272% higher than GPT-5.1                                     |
| Web scraping code quality (Zyte)      | 0.8533 ROUGE-1 F1 — #1   | Beats GPT-5, Claude Sonnet 4.5                               |
| Code complexity (Zyte)                | 6.28 — lowest            | GPT-5 was 13.68 (2x more complex)                            |
| Inference speed                       | ~2x faster than 2.5 Pro  | Matters at 900-mosque scale                                  |
| Context window                        | 1M-2M tokens             | Can ingest entire monthly timetables                         |
| WebVoyager                            | Not published            | 2.5 Pro was 88.9% — likely improved                          |
| WebArena                              | Not published            | 2.5 Pro was 54.8%                                            |

**Assessment:** Gemini 3 Pro is a legitimate top-tier contender for both navigation and extraction. Its screen understanding (72.7% ScreenSpot-Pro) and agentic tool use (85.4% tau2-bench) scores are the highest of any model. The caveat is that WebVoyager and WebArena scores are not yet published — navigation ranking is projected from 2.5 Pro's scores and agentic benchmarks, not confirmed via end-to-end web agent benchmarks.

---

## 8. Architecture Options

Three architecture options emerged from the five reports. No decision is made here — all three are viable and should be validated against real mosque websites.

### Option A: Browser Use Only

```
Mosque Website → Browser Use (Chromium + Navigation LLM)
                    → Navigates to prayer times page
                    → Returns rendered page content
                        ↓
                 Extraction LLM (TBD)
                    → Parses timetable into structured JSON
                        ↓
                 Validation → GitHub repo → CDN → App
```

**Pros:**

- Solves the hardest problem (autonomous navigation) natively
- Simplest architecture — one tool, one agent task description
- Eliminates manual orchestration loop and separate navigation prompt
- 89.1% WebVoyager benchmark score
- Free, MIT license, self-hostable, Python, Playwright-based
- 78k GitHub stars, active development

**Cons:**

- No built-in Markdown conversion (Opus handles noisy content well, or use basic HTML stripping)
- No built-in batch async crawling (run multiple agents for concurrent refreshes)
- No built-in caching (results cached in GitHub data repo anyway)
- Less mature content filtering than Crawl4AI

**Advocated by:** opus-opencode, kimi, opus-claude (3/5)

### Option B: Crawl4AI Only

```
Mosque Website → Crawl4AI (Playwright + Markdown + Extraction)
                    → Renders page, converts to Markdown
                    → Manual navigation orchestration via separate LLM
                        ↓
                 Extraction LLM (TBD)
                    → Parses timetable into structured JSON
                        ↓
                 Validation → GitHub repo → CDN → App
```

**Pros:**

- Best-in-class Markdown conversion and content filtering (BM25, pruning)
- Built-in async batch crawling with browser pooling
- Built-in caching layer
- End-to-end scraping pipeline (render → clean → extract)
- Full control over extraction prompts

**Cons:**

- No LLM-driven navigation — BFS link crawling only
- Requires building a 12-step manual orchestration loop for navigation
- Requires a separate navigation prompt and navigation LLM wiring

**Advocated by:** mm2, glm (2/5)

### Option C: Hybrid (Browser Use nav + Crawl4AI extraction)

```
Mosque Website → Browser Use (Navigation LLM)
                    → Navigates to prayer times page
                    → Returns page URL or content
                        ↓
                 Crawl4AI (Markdown + Content filtering)
                    → Converts to clean Markdown
                    → Applies BM25 filtering
                        ↓
                 Extraction LLM (TBD)
                    → Parses timetable into structured JSON
                        ↓
                 Validation → GitHub repo → CDN → App
```

**Pros:**

- Best navigation (Browser Use) + best content processing (Crawl4AI)
- Maximum accuracy potential

**Cons:**

- Two tools to install, configure, and maintain
- More complex architecture and higher latency
- Content processing gains may be marginal — Opus handles noisy content well

**Not explicitly advocated by any report**, but emerges as a logical middle ground.

### Which option to validate

The 3 pro-Browser-Use reports make the stronger technical argument: navigation is the hardest problem, Crawl4AI cannot do LLM-driven navigation, and Browser Use handles it natively. However, the 2 pro-Crawl4AI reports correctly note its superior extraction pipeline features.

**Decision: Deferred.** Test all three options against 10-20 real mosque websites during pre-implementation validation. The validation should measure: navigation success rate (does it find the prayer times page?), extraction accuracy (does it get the right JSON?), and latency.

---

## 9. Extraction Model Options

Two models emerged as candidates for the extraction step. No decision is made here — both should be validated against real mosque sites.

### Claude Opus 4.6

- **Advocated by:** mm2, opus-opencode, opus-claude (3/5)
- **Strength:** Best raw extraction accuracy for direct HTML-to-JSON (~95%+ F1 structured extraction). Strongest instruction-following and prompt injection resistance. Already the extraction model in the current ADR.
- **Use case fit:** The pipeline sends rendered content to an LLM and asks for JSON directly. This is Opus 4.6's core strength.
- **Cost:** ~$0.03-0.10 per extraction

### Gemini 3 Pro

- **Advocated by:** glm, kimi (2/5)
- **Strength:** #1 on Zyte's web scraping benchmark (0.8533 ROUGE-1 F1). 1M-2M token context window. Native multimodal (handles PDF/image timetables). ~2x faster inference than 2.5 Pro.
- **Caveat:** Zyte measures scraping code generation, not direct extraction. Pipeline performance for HTML-to-JSON may differ.
- **Cost:** Lower than Opus 4.6

### Why this matters

If Gemini 3 Pro proves equally accurate at direct HTML-to-JSON extraction (not just code generation), it offers significant advantages: larger context window (1M vs 200K), faster inference, lower cost, and multimodal PDF/image support. But this is unproven for the specific pipeline task.

**Decision: Deferred.** Test both models against 10-20 real mosque websites. Measure extraction accuracy (F1 against manually verified ground truth), cost per extraction, and latency.

---

## 10. Individual Report Summaries

Brief summary of each model's position for transparency.

### MM2 (MiniMax-2)

- **Tool:** Keep Crawl4AI
- **Navigation model:** Gemini 3 Pro
- **Extraction model:** Claude Opus 4.6 (or Gemini 3 Pro)
- **Key contribution:** Concise overview. Mentions Browserable at 90.4% WebVoyager (not corroborated by other reports).
- **Weakness:** Least detailed. States Crawl4AI has "LLM extraction built-in" without addressing that it lacks LLM-driven navigation.

### GLM-5

- **Tool:** Crawl4AI (add Browser Use only for complex nav)
- **Navigation model:** Gemini 3 Pro (#1), Claude Opus 4.6 (#2)
- **Extraction model:** Gemini 3 Pro (primary), Claude Opus 4.6 (alternative)
- **Key contribution:** ScreenSpot-Pro scores, BrowserGym reference, honorable mentions for DeepSeek and Qwen.
- **Weakness:** Confuses Claude model naming (lists 3.7 Sonnet and 4 Sonnet as separate entries). Recommends Gemini 3 Pro for extraction based on general benchmarks, not extraction-specific ones.

### Opus-OpenCode (Opus 4.6 via OpenCode)

- **Tool:** Browser Use replaces Crawl4AI
- **Navigation model:** Gemini 3 Pro (#1), UI-TARS-1.5 (#2), DeepSeek v3.2 (#3)
- **Extraction model:** Claude Opus 4.6
- **Key contribution:** Most technically detailed. 12-step vs 3-line comparison. DeepSeek v3.2 at 74.3% WebArena (#1 on leaderboard). Clear feature-by-feature comparison table. Identifies what you LOSE by dropping Crawl4AI (batch crawling).
- **Weakness:** UI-TARS-1.5 may be superseded by UI-TARS-2.

### Kimi (via OpenCode)

- **Tool:** Browser Use replaces Crawl4AI
- **Navigation model:** Gemini 3 Pro (#1)
- **Extraction model:** Gemini 3 Pro (single model for both)
- **Key contribution:** Clean format. Includes ICCUK real-world test case, quotes ADR-008 directly. Presents 3 architecture options (A/B/C).
- **Weakness:** Recommends Gemini 3 Pro for extraction based on Zyte code-generation benchmark — but the pipeline does direct HTML-to-JSON, not code generation. Lists Claude 3.7 Sonnet as #2 (outdated naming).

### Opus-Claude (Opus 4.6 via Claude Code)

- **Tool:** Browser Use replaces Crawl4AI
- **Navigation model:** Surfer 2 (#1, 97.1% WebVoyager), Gemini 3 Pro (#2)
- **Extraction model:** Claude Opus 4.6 (~95%+ F1)
- **Key contribution:** Only report to surface Surfer 2 (H Company). Detailed Zyte benchmark table with all 8 models. Correctly distinguishes code-generation benchmark from direct extraction. 27 source URLs.
- **Weakness:** Surfer 2 claims not independently verified by other reports.

---

## 11. Sources

Deduplicated URLs from all five reports.

### Crawl4AI & Browser Use

- https://github.com/unclecode/crawl4ai
- https://github.com/browser-use/browser-use
- https://docs.crawl4ai.com/extraction/no-llm-strategies/
- https://aiagentstore.ai/compare-ai-agents/browser-use-vs-crawl4ai
- https://pypi.org/project/Crawl4AI/0.3.7/
- https://www.scrapingbee.com/blog/crawl4ai/

### Gemini 3 Pro

- https://www.zyte.com/blog/gemini-3-pro-web-scraping-benchmarks/
- https://www.vellum.ai/blog/google-gemini-3-benchmarks
- https://smartscope.blog/en/blog/gemini-3-pro-review/
- https://www.unite.ai/google-unveils-gemini-3-pro-with-benchmark-breaking-performance/
- https://developers.googleblog.com/real-world-agent-examples-with-gemini-3/
- https://extractdata.substack.com/p/web-scraping-with-gemini30pro
- https://ai505.com/gemini-s-native-web-scraper-the-100-free-multimodal-tool-you-re-not-using/
- https://www.geeky-gadgets.com/gemini-built-in-scraper/
- https://serenitiesai.com/articles/gemini-3-flash-pro-review-2026

### Web agent benchmarks

- https://webchorearena.github.io/
- https://www.browserbase.com/blog/evaluating-browser-agents
- https://research.aimultiple.com/ai-web-browser/
- https://github.com/sagekit/webvoyager

### Comparison articles

- https://www.firecrawl.dev/blog/best-open-source-web-crawler
- https://www.firecrawl.dev/blog/best-open-source-web-scraping-libraries
- https://scrapeops.io/web-scraping-playbook/best-ai-web-scraping-tools/
- https://brightdata.com/blog/ai/best-agent-browsers
- https://aimultiple.com/open-source-web-agents
- https://scrapegraphai.com/blog/crawl4ai-alternatives
- https://www.browse.ai/blog/the-best-ai-web-scraper-tools
- https://medium.com/@tuguidragos/the-open-source-web-scraping-revolution-a-deep-dive-into-scrapegraphai-crawl4ai-and-the-future-d3a048cb448f
