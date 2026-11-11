# fit1 — Islamabad Nizam-e-Salat chart + Tunisia INM two-year re-fit

2026-11-10. Discipline: adhan-js 4.4.6 (`census/adhan-build/node_modules/adhan`), every
invocation `TZ=<zone> node ...`, no clock reads, second resolution (Rounding.None semantics)
then explicit floor/ceil/nearest per prayer, parameters scanned systematically, all outputs
incremental under this directory. Scripts: `lib.mjs`, `pk-grid.mjs`, `pk-candidates.mjs`,
`pk-verify.mjs`, `pk-assemble.mjs`, `tn-grid.mjs`, `tn-hold.mjs`, `tn-assemble.mjs`.
Machine-readable: `pk-fit.json`, `tn-fit.json` (+ raw `pk-grid.json`, `pk-candidates.json`,
`pk-verify.json`, `tn-grid.json`, `tn-hold.json`).

---

## Job 1 — Islamabad Nizam-e-Salat federal chart (perpetual, keyed 2026)

Data: `southasia/data/pk-islamabad-nizam-2026.json`, 366 rows, 33.6844 N 73.0479 E,
Asia/Karachi (fixed +5, no DST). Slot `2026-02-29` has no 2026 instant; primary assignment
2028-02-29, alternates scored in the diagnostics.

### Column mapping (11 printed columns -> 6 fit columns)

From the monthly transcription (`pk-islamabad-nizam-m01.json`, 11-element rows):

| c1 | c2 | c3 | c4 | c5 | c6 | c7 | c8 | c9 | c10 | c11 |
|---|---|---|---|---|---|---|---|---|---|---|
| fajr adhan | fajr jamaat | sunrise | dhuhr adhan | dhuhr jamaat | asr adhan | asr jamaat | sunset | maghrib adhan | isha adhan | isha jamaat |

Fitted (the six athan columns): c1 fajr, c3 sunrise (fixed solar check), c4 dhuhr, c6 asr,
c9 maghrib, c10 isha. Excluded: c2/c5/c7/c11 (jamaat: +27, +15, +15, +15) and c8 (printed
sunset, a pre-adhan solar reference). Printed columns dhuhr/asr/maghrib/isha read PM
(12-hour chart).

### Named candidates (best-margin + rounding allowed per prayer, both schools; total exact out of 2196)

| candidate | madhab | fajr | sunrise | dhuhr | asr | maghrib | isha | total |
|---|---|---|---|---|---|---|---|---|
| Karachi 18/18 (+dhuhr 1) | Hanafi | 306 | 301 | 0 | 233 | 303 | 18 | **1161** |
| MWL 18/17 (+dhuhr 1) | Hanafi | 306 | 301 | 0 | 233 | 303 | 4 | 1147 |
| Turkey 18/17 temkin | Hanafi | 306 | 301 | 0 | 233 | 303 | 4 | 1147 |
| Diyanet-Europe 18/16 + temkin | Hanafi | 306 | 301 | 0 | 233 | 303 | 3 | 1146 |
| Diyanet-Europe 18/16 bare | Hanafi | 306 | 301 | 0 | 233 | 303 | 3 | 1146 |
| Umm al-Qura 18.5/+90 | Hanafi | 233 | 301 | 0 | 233 | 303 | 13 | 1083 |

Every candidate: dhuhr exact 0 (worst 64-71 min), isha exact <= 18 (worst 26-43). The
Diyanet-Europe construction assumed Turkey's domestic temkin (sunrise -7, dhuhr +5,
asr +4, maghrib +7) since no European margin set is published; it changes nothing here.

### Free fit (fajr 15-21 x isha 14-21 @0.05, margins -10..+10 @0.5, rounding per prayer, asr both schools)

Best recipe, per prayer (exact / within-1 / worst on 366 rows):

| column | recipe | exact | w1 | worst |
|---|---|---|---|---|
| fajr | 17.95 deg, margin -0.5, floor (canonical 18.00, 0, floor: 306/366/1) | **315** | 366 | 1 |
| sunrise | computed, -0.5 floor | **301** | 366 | 1 |
| asr | Hanafi +2 min, nearest (+2.5 floor identical) | **233** | 366 | 1 |
| maghrib | sunset +6 min, nearest (+6.5 floor identical) | **303** | 364 | 2 |
| dhuhr | seasonal fixed clock (rule below) | **366** | 366 | 0 |
| isha | quarter-hour schedule (rule below) | **233** | 233 | 30 |

Computed columns only: 1152/1464 exact (78.7%). With the two clock rules: 1751/2196 (79.7%).

The isha angle is unidentifiable by design: pairs 19.45-20.25 all score 345-346 with
fajr 17.95 (grid runner-up 17.95/19.45, sum 345); the margin only slides the clock snap.
Fajr angle is pinned to the 18-deg family within print resolution (+/-0.1 deg): the chart
minute sits 30-90 s BEFORE computed 18-deg fajr (offsets p5 0.13 / median 0.65 / p95 1.18 min),
so a 0.05-deg step moves 20-40 rows across the rounding edge.

### The two clock columns (not margins at all)

- **dhuhr adhan** prints exactly two values: 13:00 x183 and 13:15 x183. Switch dates:
  15 Apr (13:00 -> 13:15) and 15 Oct (13:15 -> 13:00). A quarter-snap of transit+m scores
  0/366; the best constant margin over transit (+69, floor) is 32/366 exact, worst 31.
  The rule above reproduces all 366 rows.
- **isha adhan** prints 11 values, all on the 15-minute grid, moving through ~20 hand-set
  switch dates (1 Jan, 16 Jan, 1 Feb, 16 Feb, 1 Mar, 11 Mar, 11 Apr, 1 May, 22 May, 21 Jun,
  16 Jul, 6 Aug, 21 Aug, 1 Sep, 11 Sep, 1 Oct, 11 Oct, 28 Oct, 20 Nov, 20 Dec), including
  one 30-minute step (30 Sep -> 1 Oct, 20:00 -> 19:30). Best computational approximation:
  ceil(isha@18 deg + 12.5 min) to the quarter grid = 233/366 exact; the 133 misses (>1 min,
  worst 30) are the editorial switch dates.

### Anchor and Feb-29 diagnostics

- fajr@18 best exact per anchor year: 2024: 260, **2026: 306**, 2028: 258. The template
  tracks the 2026 solar year; the "2016 and onward" title is the system name, not the
  computation epoch. The ministry computes current-year geometry.
- Feb-29 slot: as a duplicate of the 28 Feb row it fits best (sunrise, maghrib exact;
  fajr/asr -1); computed at 2024- or 2028-02-29 it misses fajr by -2. Immaterial (1 row).

### Verdict

**The federal chart is its own construction, no named method equals it.** Its computed
block is Karachi/UISK 18-deg with no dawn safety margin, Hanafi asr +2, maghrib sunset+6,
printed half a minute early; its dhuhr and isha adhan are seasonal fixed clocks that no
named method produces. Nearest named method: **Karachi (UISK) 18/18, Hanafi asr** (1161/2196
only because dhuhr/isha are clocks). The census flip to "state timetable" is safe: the
chart is live, current-year, and machine-reproducible except for its two clock columns.

---

## Job 2 — Tunisia INM Tunis 2024 vs 2025 re-fit

Data: `northafrica2/data/tn-inm-tunis-{2024,2025}.json` (366/365 rows), Tunis 36.8 N
10.18 E, Africa/Tunis (fixed +1, no DST). Held object: 18/18, dhuhr +7, maghrib +2,
fajr FLOOR, isha CEIL.

### Printed-row overlap

Only **133/365** shared month-day rows are string-identical between 2024 and 2025:
2025 is a recomputation, not a reprint.

### Free fit per year (same grid as Job 1; asr both schools)

| prayer | 2024 best | 2025 best | frozen across years |
|---|---|---|---|
| fajr | 18.10 deg, +0.5 floor: 353/366, w1 366, worst 1 | 18.10 deg, +0.5 floor: 356/365, w1 365, worst 1 | 18.10 deg: 709/731, w1 731, worst 1 |
| isha | 18.10 deg, +0.5 floor: 354/366 | 18.10 deg, +0.5 floor: 352/365 | 18.10 deg: 706/731 |
| dhuhr | +7.5 floor (== +7 nearest): 323/366, w1 366, worst 1 | 338/365, w1 365, worst 1 | 661/731, w1 731, worst 1 |
| maghrib | +3 floor (== +2 ceil): 349/366, w1 366, worst 1 | 343/365, w1 365, worst 1 | 692/731, w1 731, worst 1 |
| asr | Shafi 0, floor: 150/366, w1 303, worst 2 | 145/365, w1 298, worst 2 | 295/731, w1 601, worst 2 |

Every frozen joint sum equals the per-year optima summed (707+708, 323+338, 349+343):
freezing parameters loses zero rows. Top joint pairs: 18.1/18.1 = 1415, next 18.1/18 = 1378.

### Held object scored as-is (dhuhr +7 nearest, asr 0 nearest, maghrib +2 nearest; total /1830, /1825)

| prayer | 2024 | 2025 |
|---|---|---|
| fajr (floor) | 331 exact, w1 366, worst 1 | 340 exact, w1 365, worst 1 |
| dhuhr (+7 nearest) | 323 exact, w1 366, worst 1 | 338 exact, w1 365, worst 1 |
| asr (0 nearest) | 107 exact, w1 350, worst 2 | 114 exact, w1 345, worst 2 |
| maghrib (+2 nearest) | 176 exact, w1 366, worst 1 | 207 exact, w1 365, worst 1 |
| isha (ceil) | 336 exact, w1 366, worst 1 | 328 exact, w1 365, worst 1 |

Rounding sensitivity at frozen margins: **maghrib +2 CEIL is the data's one refinement**
(345/366 and 345/365 exact; the grid's +3 floor differs only on exact-minute rows).
Dhuhr +7 nearest confirmed (floor 182/177, ceil 192/193; note floor(x+7.5) == nearest(x+7)).
Asr reads slightly better as floor (150/145) but stays worst-2 either way; it is the
weakest column of the calendar (w1 601/731).

### 4-city today rows (2026-11-10, held recipe)

| city | fajr | dhuhr | asr | maghrib | isha |
|---|---|---|---|---|---|
| Tunis | exact | exact | +-1 | exact | exact |
| Sfax | exact | exact | +-1 | +-1 (exact with maghrib ceil) | +-1 |
| Kairouan | +-1 | +-1 | exact | -2 (-1 with ceil) | exact |
| Gafsa | -3 | exact | +-1 | -3 | -2 |

Gafsa drifts 2-3 min on the dawn/dusk block regardless of rounding; one-day row against
delegation-level coordinates, no verdict drawn.

### Verdict (the multi-year ruling)

**2024 and 2025 share one recipe with every parameter frozen.** Angles 18/18 (grid optimum
18.10 with the +0.5-floor print convention, indistinguishable from the held 18/18), dhuhr
+7 nearest, maghrib +2 ceil, asr Shafi 0. No margin or angle shifts between years; the
joint frozen fit equals the per-year fits exactly. INM recomputes the calendar yearly
(only 133 printed rows repeat), but under a constant recipe. The held object stands on
both years as-is (within-1 everywhere except asr worst-2), with the single recorded
refinement: maghrib rounds CEIL.

---

## Files

`REPORT.md` (this file), `pk-fit.json`, `tn-fit.json`; supporting: `lib.mjs`, scripts,
`pk-grid.json`, `pk-candidates.json`, `pk-verify.json`, `tn-grid.json`, `tn-hold.json`.
