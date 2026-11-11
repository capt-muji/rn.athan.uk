# verify3: adversarial re-check of the night's five load-bearing findings

Workspace: `$HOME/athan-gitree/census/o1k-wide/verify3/`. Engine: adhan 4.4.6 at
`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`. Independent harness (`lib.mjs`,
`pk.mjs`, `khgt.mjs`, `tn.mjs`, `dz.mjs`, `dz2.mjs`, `uk.mjs`, `uk2.mjs`). No fitting agent's
script is imported. Every run is `TZ=UTC node ...` with the calendar date built at 12:00 UTC and
the result rendered in the target zone through `Intl`. No clock is read. adhan runs at
`Rounding.None` with seconds retained, and every rounding is applied explicitly afterwards. Raw
captures are read from disk. No network. Outputs are incremental (`pk.json`, `khgt.json`,
`tn.json`, `dz.json`, `dz2.json`, `uk.json`, `uk2.json`).

---

## 1. Pakistan: federal chart = Karachi 18/18 Hanafi + two-phase dhuhr + 19-step isha ladder

**Verdict: CONFIRMED.**

Data: `southasia/data/pk-islamabad-nizam-m0*.json`, the 11-value monthly transcription of
`captures/pk-mora-nizam-e-salat-chart-2016.pdf` (366 dated rows). The PDF is one image page with
no text layer. I re-read the printed header and the April and October switch rows from a 3x
render.

Column mapping, re-derived from solar geometry and the jamaat-pair structure rather than from
fit1's table. c3 is sunrise (median printed minus computed sunrise -0.87 min), c8 is sunset
(+0.95), c4 is a two-value transit clock (+63 min over transit), c6 is asr (+2.17 over computed
Hanafi asr), c9 is maghrib (+5.95 over sunset), c10 is isha. The jamaat pairs are c2 = c1 + 25..36
(median 30), c5 = c4 + 15 on all rows, c7 = c6 + 12..18 (median 15), c11 = c10 + 15. The printed
header reads, right to left: date, fajr adhan, fajr jamaat, sunrise, dhuhr adhan, dhuhr jamaat,
asr adhan, asr jamaat, sunset, maghrib adhan, isha adhan, isha jamaat. A twelfth cell under
maghrib jamaat carries a weekday note, not a time, which is why the transcription has 11 values.
fit1's six fitted columns are correct.

| Fact | Independent measurement |
| --- | --- |
| Dhuhr values | exactly 13:00 (183 days) and 13:15 (183 days) |
| Dhuhr switches | 15 Apr 13:00 to 13:15, 15 Oct 13:15 to 13:00, both read from the print |
| Isha distinct values | 11, 18:45 to 21:15, every value a multiple of 15 |
| Isha switch dates | 19, steps -30, -15, +15, the -30 on 1 Oct (20:00 to 19:30) and the upward +15 on 20 Dec |
| Best single isha angle | 31/366 exact, worst 26 min. No angle reproduces the ladder |
| `ceil(isha18 + 12.5)` snapped to 15 | 233/366 exact, 133 misses, worst 30 |
| Fajr 18.00 floor 0 | 306/366 exact, 366/366 within 1, worst 1 (grid optimum 17.93 floor -0.5, 324 exact) |
| Asr Hanafi +2 nearest | 233/366 exact, 366/366 within 1, worst 1 |
| Asr Shafi best | 0/366 exact, worst 72 |
| Maghrib sunset +6 | 303/366 exact, 364/366 within 1, worst 2 |
| Sunrise floor -0.5 | 301/366 exact |
| MWL 18/17 on asr | median -55 min, worst 78. Refuted |

The claim's "19-step" is exact as 19 switch dates. The ladder prints 11 distinct values. Both
readings are in the record and both are true.

---

## 2. Muhammadiyah KHGT = 18/18 + 1 min, 2025-2035, 7.8 min after Kemenag

**Verdict: CONFIRMED, with the gap corrected to about 8.0 min.**

Data: `deep3/captures/khgt-{city}-{year}-{01,07}.json`, the raw API payloads. I scored all
1,116 rows (3 cities x 6 years: 2025, 2027, 2029, 2031, 2033, 2035, January and July), which
contains the required three years x two cities.

| Measure | Result |
| --- | --- |
| 18/18 ceil +1, within 1 min | 62/62 rows in every one of the 18 city-year cells |
| Exact with +1 | 58 to 62 of 62 per cell (93.5% to 100%), worst 1 |
| Margin the rule needs | per city-year intervals about 0.92 to 1.08 min. The decade intersection is empty by 0.033 min (2 s), the "two seconds" the night recorded |
| Fajr gap to Kemenag 2026, 365 days | Jakarta 7.99, Surabaya 7.87, Medan 7.90, Makassar 8.08, Jayapura 8.48 |
| Per-year gap at Jakarta and Jayapura | 8.11-8.21 and 8.68-8.84, no drift across the decade |

The decade and the 1-minute tolerance hold. The headline 7.8 is low by 0.1 to 0.7 min depending
on the city. The constant-gap finding itself stands.

---

## 3. Tunisia: one frozen recipe 2020-2026

**Verdict: CONFIRMED.**

Data: `northafrica2/data/tn-inm-tunis-2024/2025.json` and
`deep2/data/tn-inm-tunis-2020..2023,2026.json`. The 2024 and 2025 normalized files were checked
cell by cell against the raw archive `northafrica2/captures/tn-horaire-tunis-YYYY.ndjson`:
3,655 cells, 0 mismatches.

Frozen recipe: fajr 18.1 round, isha 18.1 round, dhuhr transit +7 round, maghrib sunset +2 ceil,
asr Shafi 0 nearest.

| Year | All five columns within 1 | Rows |
| --- | --- | --- |
| 2020 | 95.1% | 366 |
| 2021 | 94.0% | 365 |
| 2022 | 93.7% | 365 |
| 2023 | 93.2% | 365 |
| 2024 | 95.4% | 366 |
| 2025 | 94.5% | 365 |
| 2026 | 93.7% | 365 |
| **All** | **2,409/2,557 = 94.21%** | 2,557 |

Per-column over the seven years: fajr 2,471/2,557 exact (all within 1), isha 2,471, dhuhr 2,308,
maghrib 2,429, asr 764 exact but 2,409 within 1 (worst 2). Per-year free fits return 18.09-18.10
for both angles, +7 round (or +6.5 ceil), +2 ceil (or +2.5 round), asr nearest 0. That is one
parameter set. 2024 and 2025 share only 133 of 365 printed rows, so the calendar is recomputed
each year under the same recipe.

One reproducibility defect in the deliverable. `deep2/tn-deep.json` records asr as floor 0,
which scores 2,091/2,557 joint (81.8%), not the 94.2% it headlines. The 94.2% is reproducible
only with nearest 0, which is the rule fit1 used. The claim holds. The stored asr mode does not
match its own headline.

---

## 4. Algeria: frozen 1447 to 1448, and 1448 is recomputed

**Verdict: CONFIRMED.**

Data: `northafrica2/captures/dz-marw-calendrier-1448-alger.pdf` (no text layer, PDFKit returns
nil on every page) and the four transcription files per year in `fit2/` (1448) and `fit11/`
(1447). I chose Rajab 1448, PDF page 8, and transcribed all 29 rows myself from a 4.5x render
before looking at fit2's file. My 174 cells match fit2's transcription exactly.

Calibration on that one month only: fajr 17.39 floor -2 (29/29 exact), isha 15.73 floor +7.5
(29/29), dhuhr +1 (28/29), asr Shafi +1 (22/29, all within 1), maghrib +4 (28/29), sunrise +1
(25/29). Applied unchanged to the seven other months, every column of every month is within 1:
208 of 208 days, six of six columns.

Joint fit across both Hijri years (237 days): fajr 17.4 floor -2 (229/237 exact, 237/237 within
1), isha 16.6 ceil +2 (227/237, 237/237), dhuhr +1 (229), asr Shafi ceil 0 (122 exact, 237
within 1), maghrib +4 (223), sunrise +1 (222). The 1447 and 1448 joint fits return the same
constants. The published pair (fajr 17.80 floor 0, isha 16.10 nearest +5) also scores 237/237
within 1 on all six columns. The constants are not identifiable to 0.1 degree from
minute-printed data. An equivalent family spans 17.4 to 17.8 with the matching margin, and
15.73 to 16.6 for isha. What is identifiable is the printed time, and that is frozen.

Reprint test, Rajab 1447 against Rajab 1448 by corresponding Hijri day: 11 of 174 cells
identical (6.3%), mean absolute difference 5.54 min, maximum 10. The 355-day gap moves the
Gregorian date about 10 days earlier in the solar year, which is exactly the observed drift. A
reprint would be 174 of 174 identical. 1448 is recomputed.

---

## 5. England's towns are interval tables in the LUPT construction, not angle tables

**Verdict: REFUTED as stated. The modal form holds. The universal and the "not angle tables"
clause do not.**

Three towns re-derived from `uktowns2/data/` raw captures. F is printed sunrise minus printed
fajr. I is printed isha minus printed maghrib.

| Town | Rows | F range | I range | Karachi 18/18 fajr, within 1 | Class |
| --- | --- | --- | --- | --- | --- |
| Luton | 30 (Nov) | 98-102 (5 values) | 89-96 (8 values) | 8/30, worst 6 | interval table |
| Coventry | 365 | 90-157, plateaus at 100 and 60 | 20-100, plateaus at 100 and 60 | 72/365, worst 119 | seasonal table |
| Nottingham | 365 (273 defect-free) | 114-243 | 68-139 | 244/273, 220 exact, worst 4 | angle 18/18 |

Luton's F and I arrays match the LUPT reference arrays almost cell for cell. ELM November F is
97-102 and I is 88-97, against Luton's F 98-102 and I 89-96. The LUPT construction is confirmed
there. Coventry is a date-indexed table with flat plateaus (January and February F exactly 100,
June and July I exactly 60). It is not a constant interval and not an angle. Nottingham is an
angle table. 18/18 reproduces fajr 220/273 exact and 244/273 within 1 on its defect-free rows,
and its F array swings 129 minutes across the year, which no constant or stepped interval
produces.

The counterexample is not alone. A scan of the 18 dated surfaces with a printed sunrise gives
three angle-18 surfaces (Watford 30/30 within 1 and 29/30 exact in November, Nottingham 332/365
within 1 over all rows, Oxford 332/365). The rest are interval or seasonal tables. One-month
surfaces cannot separate a 15-degree angle from a table, so the exact table count is soft. The
existence of three angle surfaces is not soft. The night's own fit12 records the same trio. The
finding must be restated as "the modal English form is the LUPT interval construction", which is
true, and not as "England's towns are interval tables, not angle tables", which Nottingham
refutes.

---

## Verdict table

| # | Claim | Verdict | Counterexample or correction |
| --- | --- | --- | --- |
| 1 | Pakistan: Karachi 18/18 Hanafi, two-phase dhuhr, 19-step isha ladder | CONFIRMED | 19 switch dates over 11 distinct values |
| 2 | Muhammadiyah 18/18 +1, 2025-2035, 7.8 min after Kemenag | CONFIRMED | gap is 7.9 to 8.5 by city, not 7.8 |
| 3 | Tunisia one frozen recipe 2020-2026 | CONFIRMED | 94.21% joint. The deliverable's asr floor gives 81.8% |
| 4 | Algeria frozen 1447 to 1448, 1448 recomputed | CONFIRMED | constants are a family, the times are frozen |
| 5 | England's towns are interval tables, not angle tables | REFUTED | Nottingham 18/18 244/273 within 1, Watford 30/30, Oxford 332/365 |

Machine-readable: `verdicts.json`.
