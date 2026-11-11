# O1k morocco1 — the rebuilt Habous portal, harvested and verified, 2026-11-10

Tag `morocco1`. Workspace `census/o1k-wide/morocco1/`. Raw captures in `captures/`,
normalized rows in `data/`, the method is `harness.js` (self-contained NOAA solar engine,
anchored on JD 2451545.0; one output `run-summary.txt`). Read-only reference: the census
record's Morocco row (19/17, margins -1/-3/+5/+1/+4/0, fajr floor, Shafi asr, declared GMT
clock) and `../mideast/REPORT.md` (the surface's discovery).

## Surface table

| Source | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- |
| Ministry rebuilt prayer portal (data files) | `habous.gov.ma/data/horaires-YYYY-MM.js` | authority | **190 cities x 2 months, 11,590 rows** | 2026-10, 2026-11 |
| Ministry portal chrome (clock rule) | `habous.gov.ma/assets/js/prieres.js` + root page | authority | the GMT decree comment | current |
| Ministry Hijri month starts | `habous.gov.ma/data/hijri.js` | authority | announced crescent month starts | current |

## The mechanism, confirmed and bounded

- One static JS file per month, one `HORAIRES_MOIS` push: `annee`, `mois`,
  **`fuseau:"GMT"`**, `cols`, `villes` (`c` id, `n` Arabic name, `h` = days x 6 times
  `HH:MM`). No coordinates, no region fields, no API. Served fresh this run
  (200 both months), byte-compatible with the mideast captures.
- **Window = current + previous month.** 22 probes: 2026-10 and 2026-11 are 200;
  2026-09, 2026-12, 2025-01..12, 2024-10..12, 2027-01..03 are all 404 (nginx).
  The pre-rebuild era (2024/2025 tables, five Wayback cities) is GONE from the new
  portal; December 2026 is not yet published 10 days before month start.
- **Enumeration: 190 cities** (169 contiguous ids `c=1..169` plus `c=301..322` minus
  303; range 1..322). Identity stable across months: 0 name/id mismatches;
  `c=1` الرباط, `c=58` الدار البيضاء, `c=156` العيون — matching the mideast parse.
- Banked: `data/cities.json` (all 190 with ids/names), `data/2026-10.json`,
  `data/2026-11.json` (normalized dated rows, 31+30 days x 190 cities).

## Verification

- **Monotonicity:** 1176 single-minute reversals in 68,400 day-over-day steps (1.7 pc),
  1168 of them in dhuhr — its underlying value drifts ~0.5 min/day across rounding
  boundaries, a rounding signature, not bad data. Zero reversals at the Oct/Nov
  boundary; worst magnitude 1 min.
- **Recipe, strict gate (census margins exactly as recorded, 10 cities at known
  coordinates):** 0/10 PASS — Rabat 295/366 (worst 1.97 @ fajr), Casablanca 243/366,
  Tangier 242, Fes 214, Marrakech 193, Agadir 263, Oujda 190, Nador 277, Laayoune 269,
  Dakhla 276. Two stacked causes, separated below: (a) a **national margin-regime
  shift**, (b) my remembered city-centre coordinates vs the ministry's city points
  (Fes/Oujda/Casablanca maghrib 0/61 is a pure offset signature).
- **Recipe, national anchored fit (all 190, coordinates solved from the portal's own
  rows; longitude from dhuhr, latitude+daylength margins from sunrise/maghrib):**
  the solar engine reproduces the whole grid at fitted margins: **69,168/69,540 cells
  within 1 min (99.5 pc), 39/190 cities perfect 366/366, worst residual 1.35 min**.
  One national generator, no regional conventions, no deviating city in structure.
- **The margin regime shifted at the rebuild (the decisive finding).** Fitted margin
  medians, noon-referenced to dhuhr +5 (measured exact, bias -0.01 min): fajr
  **-0.58**, sunrise **-4.81**, maghrib **+5.20** (daylength bracket +10.0 vs the
  recipe's +7 — wider brackets, or equivalently a ~0.3 deg deeper horizon altitude;
  underdetermined inside a 2-month window), asr **-0.42**, isha **-0.37**. Against the
  recorded margins the deltas are fajr +0.42 / asr **-1.42** / isha -0.37: with the
  recipe as recorded, **0/190 cities pass the 1-min gate** (66.6 pc of cells), worst
  2.84 min, everywhere asr-driven. This quantifies the record's "margins shifted HALF
  A MINUTE (as likely the rebuild)" note on the ministry's own new surface and
  strengthens the conditional-A ruling's evidence: the table did not change, the
  additive margins did.
- **Angle identification is degenerate on this surface:** mutation pass at real
  coords (Rabat, Fes, Agadir, Laayoune, Dakhla) — fajr 18/19/20, isha 16/17/18, asr
  Shafi vs Hanafi all fit 61/61 once margins float. A 2-month window cannot
  discriminate angles; the 19/17/Shafi identification stays with the census multi-year
  fit. This surface contributes uniformity (190/190 cities consistent) and the margin
  quantification, not angle confirmation.
- Reconciliation: mideast's Rabat November "100 pc within 1 min" (recorded margins)
  vs mine 173/180 at my coordinates — their margin/rounding treatment or city point
  differed slightly; the national numbers above supersede the 3-city evidence.

## The GMT-clock rule (task 4)

The Ramadan interaction is RESOLVED as permanent law, encoded in the portal itself:
`prieres.js` carries `// Heure légale du Maroc = GMT depuis le 20/09/2026 (décret
2.26.530)` and `DECALAGE_MAROC_MINUTES = 0`, and every month file declares
`fuseau:"GMT"`. Morocco's legal clock is GMT year-round since 2026-09-20 by decree:
the ministry's declared fixed clock and civil time now coincide permanently, and the
old Ramadan display rule (C31) has no future surface to apply to. Ramadan 1448
(~Feb 2027) sits outside the served window, so no Ramadan month file exists yet to
check. `data/hijri.js` (captured) publishes the crescent-announced month starts the
portal displays.

## What confirms / what is NEW / what deserves a fit

- CONFIRMS: the census recipe's digits and structure on the ministry's own rebuilt
  surface, now at national scale (190 cities, 2 months) instead of 3 spot cities.
- NEW: the full 190-city list with ids; the margin-regime quantification (fitted
  margins medians above); the GMT decree encoding (2.26.530, 2026-09-20); the
  window's exact bounds (current + previous month only, monthly roll); per-city
  generator anchors (lat/lon fitted from the rows, in `data/recipe-national.json` —
  fit anchors, not GPS city centres).
- DESERVES A FIT: the fitted margin set as the post-rebuild regime candidate; a
  monthly fetch job (the window rolls: December must be caught when published, and
  a Ramadan-month capture would test the decree encoding directly).

## Honest negatives

- 2025 archive: absent from the new portal (all 12 months 404) — pre-rebuild era
  remains Wayback-only.
- December 2026: not yet published; 2027: nothing served.
- No coordinates/region fields in the payload; city points are only solvable as
  fit anchors (latitude weakly identified over a 2-month window — degenerate with
  the daylength margin).
- Angle discrimination impossible on this surface (see mutation pass above).
- Searched in Arabic and French (the portal's own languages); no other ministry
  prayer surfaces probed — out of this task's scope.
