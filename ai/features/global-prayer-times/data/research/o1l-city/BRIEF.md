# O1l city-level brief (binding on every O1l agent)

Purpose: round two of the worldwide census — CITY-LEVEL coverage inside every country on record,
YEAR-2 accrual for provisional objects, the dated watches from the operations calendar, and a fit
for everything captured. Official sources first, community second, platform-passing-the-suite
third. This is CONFIRMATION plus DISCOVERY, never re-derivation, and never invention.

## Before you hunt

Read, in order:
1. Your countries' rows in `$HOME/repos/rn.athan.uk/ai/features/global-prayer-times/data/census/world-table-v2.md` (read-only).
2. Your region's entries in `$HOME/repos/rn.athan.uk/ai/features/global-prayer-times/data/research/o1k-wide/CONSOLIDATION.md` (the whole prior night, one block per wave).
3. Where your job names prior fits: `$HOME/repos/rn.athan.uk/ai/features/global-prayer-times/data/research/o1k-wide/fitindex/FIT-INDEX.md`.

Your job is what the record LACKS: the next cities and provinces, the cheapest second years, the
unlisted boards, muftiates and mosques. Never re-litigate a verdict the record already holds
unless you hold new data (the three VOID items in the o1k handoff stay void).

## Standing rules (all binding, all owner orders)

- PUBLIC PAGES ONLY. No login, no registration, no forms, no email, no contact with any person or
  body, never solve a captcha or challenge. If a page blocks you, record it and move on.
- NOTHING under /tmp. All output under `$HOME/athan-gitree/census/o1l-city/<your-tag>/`.
- No subagents. Never spawn another agent.
- Search in the LOCAL LANGUAGE of each country as well as English.
- Web discipline: TinyFish for search where available (it throttles: fall back to curl with a
  browser UA, then to `agent-browser` with your OWN named session `AGENT_BROWSER_SESSION=o1l-<tag>`;
  NEVER run `agent-browser close --all`). Save the raw response of every capture (HTML/JSON/PDF)
  into `captures/`.
- Incremental writes: flush each capture and each report section as you complete it.

## City-level discipline

- One surface per city minimum. Prefer authority, then community, then platform tables that pass
  the suite (today-row anchoring, solar gate, byte-identity-vs-default, TZ distrust, live-page gate).
- Zone/district tables count as city coverage when their reference points are recoverable and
  validated (the Selangor nine-district lesson).
- A feed is not evidence until gated against its own live page (R5). IANT Dallas's feed contradicts
  its own widget on all 364 days; Toledo renders a broken feed faithfully.
- The publisher's engine is part of the recipe: mawaqit/Masjidbox/Masjidal platform tables
  reproduce on a PrayTimes-v2-family engine at zero margins; adhan reports a phantom -1 dhuhr
  margin and a ±1.2 seasonal asr skew on the same rows. Record `engine` with every platform fit.
- SAVE THE RAW ARTIFACT of every surface, images included. The Kelantan lesson: images described
  but never saved block all transcription.
- Community surfaces are recorded as community, never authority. Authority-by-publisher holds even
  when the artifact is a Facebook post.
- Never read a platform method label as provenance (masjidway's "UK Unified Timetable" is a
  platform method, not LUPT).
- Honest negatives record the languages searched and how the surface was closed.
- Do not touch the repository. Work only inside your workspace.

## Fit discipline

`FIT-RULES.md` beside this file is binding: fit ALL years held, harvest the future where an
endpoint serves it, per-year scores, between-year stability verdict, seasonal amplitude beside
every recipe. Engine: adhan 4.4.6 at
`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`, `Rounding.None`, TZ pinned per
country, never read the real clock, dates built from literal capture strings, second resolution
then explicit rounding per column.

## Watches

Dated probes from the operations calendar record: URL, probe time (UTC), exact response (status,
first bytes), and a verdict against the signal the calendar names. A watch not yet due reads
"not due until DATE, probed anyway at TIME: RESULT". Never force a page to answer what it has
not published.

## Deliverables (under `$HOME/athan-gitree/census/o1l-city/<your-tag>/`)

- `captures/` — raw pages saved, one file per surface, filename naming the source.
- `data/` — normalized dated rows where the capture parses cleanly:
  `{'YYYY-MM-DD': {fajr, sunrise, dhuhr, asr, maghrib, isha}}`, parse-clean JSON only.
- `REPORT.md` — per city: source, URL, tier, dated rows held, years, the fit verdict (recipe,
  scores, span, stability, amplitude), what CONFIRMS the record, what is NEW, honest negatives.
- Final message (under 250 words): per city one line — confirmed / new surface (rows) /
  fit verdict / honest negative.

## Round-two owner orders (2026-11-11 02:53, binding through 2026-11-16)

- THE WHOLE WORLD, REPEATEDLY. The real goal (owner, 2026-11-11): every single province, every
  single city, every single region, every single area of every single country. One surface per
  city is the MINIMUM; the mandate is EVERY surface per city. Re-search covered countries again:
  Scotland may hold 50 sources with 49 undiscovered. When your primary list is done, re-sweep
  your territory for second and third sources before returning. Capitals first, then every
  city, every round.
- ALGORITHM-VS-TIMETABLE. Where a country holds BOTH a stated/official algorithm (degrees,
  method, published parameters) AND dated timetables (official or mosque), compare them across
  the FULL span held: do they match, or drift? Report drift with magnitude and direction per
  prayer. NEVER adjudicate which side is correct — flag it for the owner. Sync is a result;
  drift is a result; "cannot tell" is a result.
- SPAN CEILING AND FORWARD DRIFT. With every fit, state the country's data ceiling (years held,
  rows), and a forward-longevity verdict: proven-to-<year> where an endpoint serves the future;
  stable-across-N-years where it does not; every known regime change DATED (the Saudi 2023
  class, the London 2026/2027 asr break, Tajik dhuhr 2019-07-01). Never blend a fit across a
  dated regime change — split the span there and fit per regime.
- BACKWARD HARVEST. Past data is first-class: Wayback CDX enumeration per surface, dated
  archives back in time, every past year a portal serves (Saudi umqserv's 1318-1500H range is a
  century). A backward regime change found in year X kills naive forward extrapolation from any
  span that crosses it — date it, split there.
- TOOLING. agent-browser is FIRST-CLASS this round: many sites hide tables behind JS, navigation
  and PDF links with no API — launch it with your OWN named session (AGENT_BROWSER_SESSION=
  o1l-<tag>) and walk the pages; never run `agent-browser close --all`. opensrc CLI answers
  engine questions (adhan, PrayTimes source). The docs MCP server covers library questions.
- DURATION. This operation runs continuously to 2026-11-16 ~02:50Z. Raw capture volume target:
  tens of GB into THIS archive (the repo takes reports, fits and normalized rows only — never
  push captures). Save everything; disk is the point.
- THE OWNER ALONE STOPS THE RESEARCH (owner order 2026-11-11 ~03:3x). Never declare a country,
  city or the world complete: a negative is always "not found under these terms". When your
  searches come back empty, search again with different phrasings, different terms, place-name
  transliterations, more languages, and different engines or direct site navigation. The 50 GB
  archive cap is soft: the parent reports crossing it and the fleet keeps going.

## Supervision

You deploy no children. The parent checks the session database every 5 minutes and reads your
workspace at close. If you are blocked, write the block into REPORT.md and return what you hold:
an honest negative is a deliverable. Never wait idle; never invent work.
