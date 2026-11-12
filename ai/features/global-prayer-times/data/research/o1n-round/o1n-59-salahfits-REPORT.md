# REPORT.md - O1n-59 salah.no per-location fits (coordinator-cut machine work)

Wave: O1n-59, session five, 2026-11-12. Cut and run by the coordinator per the O1n-46
precedent (deterministic machine work on banked artifacts keeps the two fetch slots on
the O1n-57/O1n-58 continuations). Input: the session-four salah.no bank - 542,353 dated
rows, 359 locations x five distinct years (2022-2026), 39 printed columns - split to
per-location files (scripts/split_salah.py; coordinates from the banked salah.no
locations register, 359/359 with lat/lon). Engine: a NOAA low-precision solar model
embedded in scripts/fit_salah.mjs (adhan's public exports carry no solar internals);
journal-driven, resumable, one journal line per location.

## The headline

**Norway's national layer is FITTED: 232 of 359 locations hold one stable recipe across
all five distinct years** (fajr and isha implied angles drift <= 0.5 deg 2022->2026),
227 of them with stable dhuhr/maghrib margins too. fajr median angle 16.05 deg, isha
median 14.96 deg (the red-twilight end), fajr angle-day within-1 median 99.6 pc. This
is the A-class pattern the round hunts: five distinct fitted years on one recipe, per
location, 359 times over.

## The recipe of record (per location, in data/salah-fits.json)

- fajr: 16.05 deg (winter angle regime; per-location implied angle in each year object).
- isha: 14.96 deg (the shafaq al-ahmar end class) - angle regime Sep-Mar at every
  location where the event exists.
- Summer rule (per generation, never blended): 2022's tables used a fixed gap
  (Oslo: fajr sunrise-60, isha sunset+39 at 91-96 pc within-1); the 2023-2026
  generations replaced it with the publisher's own curve, irreducible to a single
  constant (Oslo monthly gaps Apr/Sep: 102/112 min, Jun/Jul: 44; fixed-gap,
  night-portion and fixed-clock candidates all scored honestly and banked). The curve
  is banked per location-year as rule_monthly_gaps.
- dhuhr and maghrib ride monthly margin tables (Oslo: dhuhr transit+~9, maghrib
  sunset+~5; 94-100 pc within-1, median 0).
- asr is a SEASONAL FLIP (Oslo: hanafi Nov-Mar, shafi Apr-Oct, DST-tied; monthly
  winners banked per location-year). 65 locations show class changes across years.
- 60 locations are POLAR: the twilight events do not solve year-round at
  Finnmark/Troms latitudes; their coverage-limited years are flagged, never forced.

## Verdicts (data/fit-summary.json)

- 232 / 359 angle-stable across five years; 227 with stable margins as well.
- 299 MOVED total: 172 of the angle-stable moved ONLY in the summer gap (the 2022
  generation change) - flagged per FIT-RULES, never blended; the rest carry genuine
  per-year angle or margin moves, each year's recipe banked separately.
- 60 POLAR, 0 unclassified.

## Method notes (what the fit does)

Per location-year each twilight column splits into regimes: the winter angle regime
(implied altitude median, classified at 0.3 deg) and the summer rule (candidates:
fixed gap, night portion, fixed clock - scored per print quantum), plus solar-column
validation (sunrise/transit/sunset), monthly dhuhr/maghrib margins, asr class by
per-day classification (monthly winners), and recompute stats per printed column
(within-1, within-3, within print quantum). Engine deltas: the publisher's own solar
model wobbles 0-3 min seasonally against NOAA (Oslo isha Dec 100 pc within-1, Mar 3 pc,
within-3 ~95+) - an engine delta, recorded as such, not a recipe delta.

## Defects found and fixed in-session

1. A double wall-clock conversion shifted asr/sunrise predictions by the DST offset
   (med 120 min, mad 1 - the systematic signature caught it); all predFns now return
   raw UTC and plainScore converts once.
2. The 0.75 deg angle-day classification swallowed fast-moving shoulder days
   (fajr angle-day within-1 63 pc); tightened to 0.3 deg (now 99-100 pc).
3. The splitter's register lookup missed one location on a trailing space
   ("Asker - Borgen - Roeyken - Saetre"); keys now stripped, 359/359 joined.

## Open for successors

- The salah.no summer curve's mechanism (their table generator) is unnamed; the
  monthly-gap curves banked per location-year are the evidence.
- The 299 MOVED verdicts deserve a per-location read for genuine methodology moves vs
  generation quirks; drift fields discriminate (angle_deg vs *_gap_min).
- The asr flip's exact switch dates (DST-tied at Oslo) can be dated per location from
  asr_days monthly tables.
- ROUND7 fold: one fit-index entry per the national layer plus the per-location
  register; the 5-year A-class verdict upgrades NO's span verdict.

Verify: `node scripts/fit_salah.mjs` (resumable; journal data/journal-fit.jsonl,
359 lines); `python3 -c "import json; d=json.load(open('data/fit-summary.json'));
print(d)"` prints the counts above. Timestamps UTC; nothing entered git; the
repository untouched.
