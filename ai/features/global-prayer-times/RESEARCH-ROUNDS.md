# RESEARCH-ROUNDS.md — the standing orders for every worldwide prayer-times research round

THE REAL GOAL (owner, 2026-11-11): cover every single province, every single city, every single
region and every single area of every single country. Nothing less. That is why the 100 GB cap is
soft and may not be enough.

Owner order 2026-11-12 (the goal cycle): the 100 GB soft cap is the standing driver of the fleet.
When the round's named task list is exhausted while the archive still sits below the cap, the
coordinator deploys three fresh GLM-5.3-Flash waves on the next coverage gaps (50 percent new
territory, 50 percent re-covering) and keeps cycling, over and over. The fleet never idles below
the cap; the cap itself never stops anything - crossing it is reported to the owner, and the work
continues.

Owner order 2026-11-12 (session four): the dated-records soft target stands at 200 million
records alongside the 100 GB archive cap. Both are soft and neither stops anything; the tree
holds 39.67 million dated rows and the round's own growth measure reports progress toward both.

Owner order 2026-11-11: every instruction in this file is standing. A fresh session started with
`/athan-next` runs the next round from this file alone; the owner repeats nothing. Each round
copies this file into its operation workspace as `BRIEF.md` (with `FIT-RULES.md` carried from the
prior round) and extends it with that round's own territory list.

## Round mechanics

- Tag sequence: o1k, o1l, o1m, o1n, ... one operation tag per round. Workspace
  `$HOME/athan-gitree/census/<tag>/`. The prior round's `CONSOLIDATION.md` and `QUEUE.md`
  leftovers are the first inputs; world-table-v2/v3 rows and the fit index say what each country
  already holds.
- Split per owner order: **50 percent NEW territory** (uncovered countries, provinces, cities,
  platforms), **50 percent RE-COVERING** what is already held (the Scotland rule: one source
  found may hide 49 more; every covered country is re-searched every round for second and third
  sources, regime changes, year-2, hidden archives).
- NO COUNTRY IS EVER COMPLETE. "Complete", "finished" and "done" are not words this programme
  uses about a country, a city or the world. When a search finds nothing, the next round looks
  again: different phrasings, different terms, transliterations and place-name variants, more
  languages, alternative search engines and site-direct navigation where search fails. The
  record's honest negatives are always "not found under these terms", never "does not exist".
- Owner order 2026-11-12 (method resolution inside one city): when two or more published lines exist in
  one city and their nearest standard methods differ, resolution follows adoption — (1) a line that matches
  the national authority's methodology wins; (2) if nothing matches the authority, the city's own local
  practice wins as a group; (3) if the local lines split with no authority match, never average: serve the
  line derived from the surface with the most banked data (most data = the most accurate, drift-resistant
  recipe). The census records every line separately regardless; this order governs which line a city's
  recipe represents.
- Owner order 2026-11-11 (round o1n): Taiwan is out of scope until the owner says otherwise.
  No wave targets it, bulk publisher walks skip its pages, and already-banked rows stay in the
  archive untouched.
- THE OWNER ALONE STOPS THE RESEARCH. An agent never concludes the programme, never declares
  the work finished. A round ends only at the owner's word or the round's named deadline — a
  mechanical commit point, never a conclusion — and the queue row re-arms the next round the
  moment the owner runs `/athan-next` again.
- THE 100 GB CAP IS SOFT. When the raw archive crosses it, the parent SAYS SO in the next report
  to the owner and keeps going. Crossing the cap changes nothing; only the owner's word stops
  anything.
- Duration: the owner names it per round; o1n runs CONTINUOUSLY to 2026-11-17 by owner order
  2026-11-12 (amending the 2026-11-11 order: never stop, never conclude, hold the fleet at
  three GLM-5.3-Flash workers at all times, redeploy every freed slot until the owner stops
  the round personally); default one session of continuous operation.
- The board (owner order 2026-11-11: use it MINIMALLY, like a git history — record exactly
  where things are, nothing more): one Research ticket per round (labels: number, Research,
  research, prayer-times), moved In progress at start with Lane set, updated with one short
  comment per major return, closed Done at the round's commit with a closing comment;
  `board/snapshot.sh` rides the close commit. Board mechanics never stall research: if a board
  write fails or is slow, note it in the round's CONSOLIDATION.md and continue researching;
  reconcile the board at the round's close. The 10 research agents (5+5) are the exception mode
  and are separate from any board lanes running alongside.

## Fleet (the /athan-next exception; owner order 2026-11-11, amended the same day)

- Exactly 3 subagents at all times, ALL on `cpa-glm/GLM: GLM-5.3-Flash` (owner order,
  2026-11-11, the day's standing amendment). The DeepSeek, opencode-free and opencode-go legs,
  and every free-tier model, are stood down for good: the GLM flash model is the only worker.
  The fleet runs CONTINUOUSLY: a replacement dispatches the moment a slot frees. The
  plans-queue no-subagent rule does not apply to research rounds.
- NO GRANDCHILDREN (owner order 2026-11-11, reaffirmed at every fleet change since): the round's
  coordinator is the only agent that dispatches. A wave never deploys a subagent of its own;
  every wave works its mission in its own session, and any child found running under a wave is
  brought down (bank and end) the moment the order reaches it. The worker model is the GLM flash
  model above only.
- MODEL IDS DRIFT: providers rename models (DeepSeek became "...Flash 1017" mid-round on
  2026-11-11). Before a dispatch, resolve the exact id with the models tool; if a dispatch
  returns "unknown provider for model", re-resolve and redispatch — never retry the stale id.
- QUOTA ROTATION (owner order 2026-11-11): when one provider's quota is exhausted, the whole
  fleet runs on the other until the quota returns; a job already banked by a quota-stopped
  agent is CONTINUED by a fresh agent reading its workspace, never redone, and the continuation
  writes into the same workspace only after verifying what exists. A stuck agent's session is
  left inert (the parent cannot cancel it); its replacement finishes the job.
- Supervision law (AGENTS.md): every dispatch prompt carries the supervision block; the parent
  checks the session DB every 5 minutes via a background heartbeat log
  (`monitor.log`, pattern `watch.sh` in the round workspace), and takes an alarm turn every 10
  minutes (a background `sleep 600` whose completion wakes the parent) to count the fleet,
  consolidate returns, redeploy, and re-arm. A child quiet past its work's explanation (about 40
  minutes for a web wave with no message activity and no report growth) is respawned from its
  job into a fresh `-rN` workspace the same minute.

## Web and capture discipline (binding, all owner orders)

- PUBLIC PAGES ONLY: no login, no registration, no forms, no email, no contact with any person
  or body, never solve a captcha or challenge. Blocked page: record, move on.
- Local-language searches beside English; forum hearsay is never data; community surfaces are
  labelled community, never authority; authority-by-publisher holds even on Facebook; platform
  method labels are never provenance; honest negatives record the languages searched.
- NOTHING under /tmp. Raw captures (HTML/JSON/PDF/images) into `<tag>/<wave>/captures/`; every
  surface's raw artifact is saved, images included (the Kelantan lesson).
- Tooling: agent-browser is FIRST-CLASS for JS- and PDF-hidden tables (own named session
  `AGENT_BROWSER_SESSION=<tag>-<wave>`, never `close --all`); TinyFish for search, curl with a
  browser UA as fallback; opensrc CLI for engine source questions; the docs MCP for libraries.
- EVERY IMAGE AND PDF IS OCR'd, with the local macOS Vision binary
  (`$HOME/athan-gitree/census/tools/ocr <file> [page-limit]`), never with a model-vision pass:
  posters, charts, scans, phone photos, image-only PDFs. Nothing stays unparsed; a capture
  without its extracted text is an open item, never a finished one. Vision's accurate level
  hangs in plain CLI processes on this host, so the binary runs the fast level.
- A feed is evidence only after gating against its own live page (R5). The publisher's engine is
  part of the recipe (PrayTimes-v2 family for platform tables; record engine with the fit).

## The four standing studies (every round)

1. CITY-LEVEL COVERAGE: one surface per city minimum, every discoverable source per city,
   capitals first, then every city. Authority, then community, then platform-passing-the-suite.
2. YEAR-2 ACCRUAL: every provisional object's cheapest second year (dated archives,
   year-parameter endpoints, Wayback). FIT-RULES.md binding: fit ALL years held, harvest the
   future where served, per-year scores, between-year stability, seasonal amplitude; never blend
   across a dated regime change (Saudi 2023 class, London 2026/2027 asr, Tajik dhuhr 2019-07-01).
3. ALGORITHM-VS-TIMETABLE: where a country holds both a stated algorithm and dated tables,
   compare across the full span; drift is reported with magnitude and direction per prayer and
   flagged owner-ruled, never adjudicated.
4. BACKWARD HARVEST AND THE SPAN LEDGER: past years everywhere served (Wayback CDX per surface,
   Saudi umqserv 1318H-1448H, dated archives); per country the data ceiling, the recipe, the
   forward-longevity verdict (proven-to-<year> / stable-across-N / single-cycle), every regime
   change dated. Plus the dated watches from the current operations calendar.

## Volume and the close

- Raw archive target: tens of GB per multi-day round (owner target 100 GB cumulative, raised from 50 on 2026-11-11). Git
  carries reports, fits and normalized rows only — captures never enter the repo.
- Close (owner's word or the round's deadline): integrity pass, world-table diff, fit index,
  decisions addenda, round summary; then rsync the citable layer to
  `ai/features/global-prayer-times/data/research/<tag>/`, version bump (package.json, app.json,
  shared/whatsNew.ts, fetch origin first), privacy scrub ($HOME placeholders, no locale words),
  `yarn validate` green, push uat, board ticket Done, `board/snapshot.sh` in the close commit.
- The repo is never touched mid-round; the application is never touched at all.
