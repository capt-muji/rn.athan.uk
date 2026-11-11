# O1k wide — fit4: the Scottish own tables, the English Hanafi towns, the Norwegian third line, the German Diyanet years

Date of analysis: 10 November 2026. Data: the o1k-wide workspaces named below, captured the same
day (all live-gated). Discipline: adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build`,
`TZ=<zone> node ...` per job, times formed at second resolution then explicit margin+rounding per
prayer, no real clock reads, nothing under /tmp, incremental writes, no subagents, no network.
Every fit ran blind to any recipe claim: free angle scan (12-21 deg @0.25, refine 0.05) plus
margin/rounding sweep (-10..+10 @0.5, floor/ceil/nearest) plus night-portion grids (1/2..1/12)
on top of every named candidate. Probe: the fast path equals full `PrayerTimes` to the second on
bare angles, night-portion fallback on NaN days, and both madhabs (`probe.mjs`).

## Job 1 — Scotland: four mosques, four tables. No de facto Scottish recipe.

| Mosque | Rows | What the fit says |
|---|---|---|
| Glasgow Central | 365 | Own engine. Solar margins sunrise −4.5 / dhuhr +6.5 / asr(1-mithl) −0.5 / maghrib +7.5 min. Fajr ~18.2 deg and isha ~18.1 deg but with ±3 min seasonal drift (month medians move smoothly Oct→Apr) — no frozen angle pair. Fajr is wall-clock clamped at 01:33 for 96 consecutive days (5 May-8 Aug); isha has short plateaus at 22:56-23:04. Best candidate Karachi 965/2190 columns, Wifaqul caps 918/2190; every candidate carries worst errors of 60+ min. |
| Al Maktoum Dundee | 365 | Split regime. Winter fajr is exactly 18 deg — month medians ±0.1 min Oct through Apr; winter isha exactly 15 deg Oct-Feb. From the angle-fail window the table switches to a night-fraction regime: fajr lead ≈ 0.307 × night, isha lag ≈ 0.15 × night, rounded to weekly plateaus (7-day runs at 02:25, 23:00, ...). The Wifaqul cap regime (1/2 + 1/7) matches neither fraction (fajr 173/365, isha 72/365). |
| Edinburgh Central | 30 (Nov 2026) | MWL 18/17: fajr 29/30, isha 29/30, worst 1 min. Isha 15 deg scores 0/30 and 16 deg 21/30, so November isha is 17 deg. A month cannot carry a full recipe claim, but it is not Wifaqul and not Glasgow. |
| Aberdeen AMIC Central + Spital | 333 ×2 | **The census's Wifaqul Ulama recipe, exact.** 18/15 angles capped at 1/2 night (fajr) and 1/7 night (isha): 319/333 exact on each column at both mosques, worst error 1 minute, coverage = the 333 parsed sheet rows. The two sheets share identical athan columns (same Google-Sheets family); Spital's dhuhr column diverges (289 vs 314 exact) — a jamaah variant on one field. |

**Cross-mosque verdict: each is its own.** Aberdeen is Wifaqul-exact; Dundee shares the 18/15
angle basis but replaces the caps with its own fraction regime; Glasgow runs a private engine with
large print margins and long clamps; Edinburgh reads 18/17 in November. The only shared element is
the solar engine class (every sunrise/maghrib column fits within ±1 min at city coordinates).
Scotland has no de facto national table, and the one exact named match belongs to the census's
Wifaqul object, 400 miles from Blackburn.

## Job 2 — the English Hanafi towns: one recipe FORM, four local editions. Not angles.

All four tables fail every angle candidate: fajr exact = 0 (worst 110-130 min) for Wifaqul caps,
MWL, Diyanet-Europe and Karachi alike. The regime is the London interval-table form: fajr =
sunrise − F[MM-DD], isha = maghrib + I[MM-DD], with F/I tracking LUPT's published tables at
constant per-town shifts (same-MM-DD cross-year diff against `lupt-2027-{01,02,04,07,11,12}`):

| Town | F shift (lead − LUPT F) | I shift (lag − LUPT I) | Reading |
|---|---|---|---|
| Reading (Aisha Masjid ICS) | +2..+4, drifting | −4..−9, drifting | LUPT family, own solar, no sunrise column |
| Coventry (Zeenatul Islam) | **+3 on 179/181 days** | **+3 on 146/181** | LUPT +3/+3 |
| Rochdale (Golden Mosque) | +5..+3 drifting | −3..−9 drifting | LUPT family, seasonal drift |
| Bolton (Zakariyya, 12h PDF) | **+3 on 172/176 days** | **+5 on 134/176** | LUPT +3/+5 |

Asr is Hanafi (shadow 2) in all four (best-fit exact 163-257); solar margins run dhuhr +3.5..+5.5,
maghrib +2.5..+5.5. **Verdict: one shared English-Hanafi recipe form — the London interval table —
instantiated per town with small shifts; none republishes LUPT exactly, none uses Wifaqul's
angle+portion recipe.** The census conflict rule (own table outside London) now has a mechanism:
these are LUPT-class tables with local calibration. Coventry carries the dpt DST defect (+60 min
on 26-28 March 2026).

## Job 3 — Norway: the third line is its own interval table, near neither mapped line

The islamweb.no / Jamiat Ulama Norway city-years are **not** 16/15 (IRN) and **not** 18/15
(mawaqeet). Both mapped lines fail everywhere: bare angles exact 0; capped variants reach only
fajr 140-163/365 and isha 71-85/365 across the seven cities. The actual recipe is the interval
form again: fajr = sunrise − F[day], isha = maghrib + I[day] with **730/730 integer-minute
offsets** (F spans 43-106 min over 64 values, I spans 42-101 over 60), capped at 1/7 of night on
both ends through the summer plateau (fajr lead/night 0.138-0.144 in May-Aug).

- The F/I curve is **city-independent**: all seven cities share the same seasonal leads
  (fajr 99/102/105/103/100/97 min for Oct-Nov-Dec-Jan-Feb-Mar; isha 82/91/99/94/86/77).
- That curve fits no single angle (best 11.9 deg, rmse 5.9 min) and no fixed fraction: it is a
  published table, like London's.
- Same-day separation: vs mawaqeet the fajr gap averages +53..+59 min and isha −35..−40
  (Oslo/Bergen/Stavanger); vs IRN Bergen fajr +33.6 mean [4..79], isha −19.2 [−43..16].
- The solar columns ARE the shared engine class: sunrise/dhuhr/maghrib match mawaqeet within ±1
  (dhuhr +5.5, maghrib +5.5 margins), asr is Hanafi shadow-2 in six cities — Skien alone fits
  Shafi (96/248), a one-city anomaly worth a lane.

**Verdict: a third, independent line — an interval-table recipe of the same class as London's,
with ⅐-of-night summer caps.** Norway now has three coexisting recipe FORMS: IRN angles (16/15),
mawaqeet angles (18/15), and the JU table.

## Job 4 — Germany: the portal serves the 2023 European pair (18/16) with the domestic temkin

The Diyanet international portal's German city-years are **fajr 18, isha 16 — the European
scheme — not the domestic 18/17.**

- Fajr: 18 deg exact (margin +0.5 floor, 165-180 exact on the 296-323 angle days).
- Isha: 16 deg unambiguously. Winter exacts with temkin-free margins (±1): 16 deg scores
  **78 / 68 / 76** (Köln / Berlin / Frankfurt of 182) against 24 / 25 / 35 for 15.5 deg and
  **0 / 0 / 0 for 17 deg**. The stock Turkey preset (18/17 + temkin) scores isha 0/365.
- The temkin margins are the DOMESTIC Turkish set, measured (the record's "no measured margins"
  gap now filled): **sunrise −6.5, dhuhr +5.5, asr +3..+3.5 (shadow factor 1.0), maghrib +6.5** —
  each within 0.5-1 min of the Turkish preset's −7 / +5 / +4 / +7. Asr is shadow-1 (Shafi), as
  the record holds for the scheme.
- High-latitude window: fajr lead plateaus at ≈ night/5 (lead/night 0.199-0.205), isha lag
  plateaus at ≈ 80 min (0.178-0.182 × night) — consistent with the record's frozenLatitude45 +
  80-minute plateau and the 2023 amendment (no summer tathbit).

**Verdict: the DITIB-adopted European scheme (18/16) is what the portal serves, wrapped in the
domestic temkin print margins and the scheme's high-latitude caps.** The "published 18/17 prose"
is refuted at the served-table level, exactly as the record predicted for printed calendars.

## Cross-job findings

- **The interval-table form is the dominant European publisher class**, now measured on three
  independent surfaces (London LUPT, four English towns, Jamiat Ulama Norway). Angle recipes
  (Wifaqul, IRN, mawaqeet, Diyanet) are the minority form.
- **dpt DST defect reproduced twice**: Glasgow Central and Coventry print +58..+61 min on
  26-28 March 2026 — the same defect class the census already records.
- **LUPT parse trap**: the publisher's 12h columns carry genuine pre-noon dhuhr values
  ("11:56"-class) beside pm values ("01:09"); column-level am/pm flags misparse them. Any future
  LUPT-consumer needs per-value bump logic (bump hours 1-9 only on dhuhr).
- **Aberdeen AMIC** is the first outside-London mosque measured to sit exactly on a named census
  object (Wifaqul, provisional grade, 2026): its two Google Sheets are machine-readable year
  witnesses for that recipe.

## Provenance

Everything under `$HOME/athan-gitree/census/o1k-wide/fit4/`: `lib.mjs` (fit1 machinery),
`engine.mjs` (loader, second-resolution context, adhan-semantics pair computation with portion
fallbacks, candidates, free fit, stock presets, diagnostics), `probe.mjs` (fast path ==
`PrayerTimes` to the second), runners `scotland.mjs` / `englishtowns.mjs` / `norway.mjs` /
`germany.mjs`, analysis scripts `debug.mjs`, `msc-test.mjs`, `summer.mjs`, `broken.mjs`,
`regime.mjs`, `shifts.mjs`, `ludiff.mjs`, `nowinter.mjs`, run logs `*-run.log`, and one JSON per
job with embedded findings: `scotland-fit.json`, `uktowns-fit.json`, `norway-fit.json`,
`germany-fit.json`. Data inputs: `ukscotland/data/`, `uktowns2/data/` (+ `lupt-2027-*.json`),
`europe/data/no-islamweb-*.json`, `europe/data/no-mawaqeet-*.json`, `europe/data/de-diyanet-*.json`,
`nordics2/data/no-irn-bergen-2026.json`. Run commands: `TZ=Europe/London node scotland.mjs`,
`TZ=Europe/London node englishtowns.mjs`, `TZ=Europe/Oslo node norway.mjs`,
`TZ=Europe/Berlin node germany.mjs`.
