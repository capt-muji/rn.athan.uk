# O1m-29: Kazakhstan's national layer, the gazetteer's 5,694 settlements through the publisher's API

Agent: O1m-29 (wave O1m-29, round o1m). Workspace `$HOME/athan-gitree/census/o1m/o1m-29-kaznational/`.
Surface: the publisher O1m-25 opened, the Spiritual Administration of Muslims of Kazakhstan, its
documented API `https://api.muftyat.kz/prayer-times/<year>/<lat>/<lng>`, keyless and public.
Prior work: `o1m-25-kazakh/REPORT.md` (the 96-settlement dropdown, the 48 N margin switch at exactly
48.000000, and the 5,694-entry gazetteer). Engine: adhan 4.4.6
(`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`), `Rounding.None`, timezone 5, dates taken
from each capture's own `Date` string. Nothing reads the real clock into data. Every capture is
stamped in UTC. The repo was not touched. Nothing here is declared complete.

## 1. Method

1. Parsed the publisher's 5,694-entry gazetteer into `data/gazetteer.json`, deduped on the coordinate
   string because the endpoint matches that exact text.
2. Pulled the 2026 year table for all 5,676 distinct points, one request each, two workers 900 ms
   apart (1.5 requests a second measured), retries on 429 and 5xx, resumable, every raw body saved.
3. Re-fetched any table whose own margin block was not constant across its year, archiving the
   variant body first.
4. Re-probed every failure once, after the sweep, to separate a transient 500 from a missing table.
5. Normalised into one dated table per region, keyed by settlement id plus date.
6. Fitted every table against adhan 4.4.6 on the recorded recipe, with the margin block, scoring
   each settlement under its own set and under the other set.
7. Gated 50 settlements against the publisher's own served script, re-run locally.
8. Repeated the pull for 2027 over the first 20 settlements of every region and compared the two years
   cell by cell.

The endpoint refuses any coordinate text that is not in the gazetteer. `/2026/47.799711/67.714090`
answers 200 with 62,162 bytes, the same point written `/2026/47.799711/67.71409` answers
`404 {"detail":"Not found."}` in 23 bytes, and `/2026/47.9/67.714090` answers 404 as well. A synthetic
latitude sweep is therefore impossible. The 48 N line can only be read through real settlements,
which is what section 4 does with 23 of them. Seven probe bodies are kept as
`captures/probe48-*.json`.

## 2. The gazetteer, parsed

`data/gazetteer.json`, built by `scripts/gazetteer.js` from the 57 pages banked in o1m-25.

| item | value |
|---|---|
| entries | 5,694 |
| distinct ids | 5,694 |
| distinct coordinate strings | 5,676 |
| duplicate coordinate groups | 18 |
| regions | 18 |
| districts | 175 |
| latitude span | 40.599543 N to 55.405802 N |
| longitude span | 46.760176 E to 86.563673 E |
| timezone | 5 at every entry |
| below 48 N (set A) | 2,280 |
| at or above 48 N (set B) | 3,396 |

The 18 duplicate groups pair the publisher's newer id generation (11,256 to 11,367) with an older
entry at the same stored coordinate. Six pairs carry two names for one point: a city suffix
(156/6,268 Щучинск, 169/9,176 Тобыл), a spelling (11,346 Тобыл against 9,210 Тобол), and three that
disagree outright (164 Абай қаласы against 8,411 Дуаншы, 11,333 Береговое against 9,641 Жағалау,
11,367 Төңкеріс against 8,196 Әшім). One pair is filed in two regions: 11,309 Үшбұлақ in Жетісу,
6,016 Үшбұлақ in Абай, same coordinate. Full list: `fit/duplicates-2026.json`.

## 3. Coverage

| item | value |
|---|---|
| requests, 2026 | 5,676 |
| answered 200 | 5,658 (99.68 pc of distinct points) |
| answered 500 | 18 (0.32 pc) |
| pull window | 2026-11-11T11:59:10Z to 13:01:56Z |
| measured rate | 1.51 requests a second |
| raw bodies banked | 335 MB in `captures/raw/2026/` |
| dated rows | 2,065,170 |
| published cells | 12,391,020 |
| row structure | 365 rows in every one of the 5,658 tables, dates continuous, no duplicate date |
| imsak | exactly fajr minus 10 on every row of every table, no exception |
| maghrib minus sunset | exactly +3 at 2,269 tables, exactly +5 at 3,389 |
| 2027 sample | 343 requests, 338 answered, 123,370 rows, 740,220 cells, 5 refusals |

Per region, from `data/coverage-2026.json`:

| region | gazetteer | tables | refused | rows |
|---|---|---|---|---|
| Түркістан облысы | 734 | 731 | 3 | 266,815 |
| Ақмола облысы | 551 | 550 | 1 | 200,750 |
| Қостанай облысы | 549 | 546 | 3 | 199,290 |
| Солтүстік Қазақстан облысы | 527 | 527 | 0 | 192,355 |
| Батыс Қазақстан облысы | 410 | 409 | 1 | 149,285 |
| Алматы облысы | 378 | 376 | 2 | 137,240 |
| Жамбыл облысы | 377 | 376 | 1 | 137,240 |
| Ақтөбе облысы | 325 | 325 | 0 | 118,625 |
| Қарағанды облысы | 300 | 299 | 1 | 109,135 |
| Павлодар облысы | 294 | 293 | 1 | 106,945 |
| Абай облысы | 286 | 286 | 0 | 104,390 |
| Шығыс Қазақстан облысы | 266 | 266 | 0 | 97,090 |
| Жетісу облысы | 232 | 227 | 5 | 82,855 |
| Қызылорда облысы | 203 | 203 | 0 | 74,095 |
| Атырау облысы | 136 | 136 | 0 | 49,640 |
| Ұлытау облысы | 55 | 55 | 0 | 20,075 |
| Маңғыстау облысы | 50 | 50 | 0 | 18,250 |
| Республикалық маңызы бар қалалар | 3 | 3 | 0 | 1,095 |

**The 18 refusals are exactly the 18 coordinate-duplicate groups.** The set of ids the endpoint
refuses is identical, element for element, to the set of ids the dedupe kept from a duplicated
coordinate. Not one unique point was refused, and not one duplicated point answered. Every one was
re-probed once after the sweep and answered `500` again, with the same 187-byte HTML body. The two
tested at other decimal forms of the same point answer `404`, so the failure is the table, not the
lookup. The 2027 sample refused only the five city ids inside
that set (156, 160, 164, 168, 169), which O1m-25 recorded as a live failure. The national reading
now explains them: a point the gazetteer files twice has no server table. `fit/duplicates-2026.json`
carries the check as booleans rather than prose.

## 4. The 48 N line at national scale

The rule the served script implements is `if (lat < 48)`: margin +3 and sunrise -3 below the line,
+5 and -5 at or above it, fajr and isha untouched. At 5,658 points the API's own tables agree with
that assignment on every day of 2026: zero settlements preferred the other set on any day, zero
settlements carried a `maghrib - sunset` constant that contradicted their latitude, and no day tied.
That is 2,065,170 settlement-days with no exception.

**The crossers, 0.05 deg either side: 23 settlements, 9 below the line and 14 above.** Each was read
three ways: the latitude rule, the API's own `maghrib - sunset` constant, and the publisher's served
script forced to each margin in turn (`scripts/line-engine.js`).

| settlement | region | lat | set | margin | engine at its margin | engine at the other margin | wrong-set MAE |
|---|---|---|---|---|---|---|---|
| Мамырсу | Абай | 47.951147 | A | +3 | 100.0 pc | 33.3 pc | 1.385 |
| Аягөз қаласы | Абай | 47.966667 | A | +3 | 100.0 | 33.3 | 1.365 |
| Қылыш | Ұлытау | 47.976867 | A | +3 | 100.0 | 33.3 | 1.374 |
| Қаражал | Абай | 47.982723 | A | +3 | 100.0 | 33.3 | 1.370 |
| Қаражал | Абай | 47.983381 | A | +3 | 100.0 | 33.3 | 1.365 |
| Ақшатау | Қарағанды | 47.984876 | A | +3 | 100.0 | 33.3 | 1.383 |
| Батырбек | Атырау | 47.992975 | A | +3 | 100.0 | 33.3 | 1.377 |
| Өтешқали атамбаев | Атырау | 47.994187 | A | +3 | 100.0 | 33.3 | 1.378 |
| Аманат | Шығыс Қазақстан | 47.999819 | A | +3 | 100.0 | 33.3 | 1.362 |
| Қаражал қаласы | Ұлытау | 48.001042 | B | +5 | 100.0 | 33.3 | 1.376 |
| Ақтұмсық | Қарағанды | 48.003400 | B | +5 | 100.0 | 33.3 | 1.374 |
| Жыланды | Ұлытау | 48.008741 | B | +5 | 100.0 | 33.3 | 1.381 |
| Бұран | Шығыс Қазақстан | 48.008988 | B | +5 | 100.0 | 33.3 | 1.370 |
| Қожакелді | Абай | 48.009000 | B | +5 | 100.0 | 33.3 | 1.372 |
| Қосагаш | Абай | 48.009133 | B | +5 | 100.0 | 33.3 | 1.364 |
| Ол жақ қалжыр | Шығыс Қазақстан | 48.012086 | B | +5 | 100.0 | 33.3 | 1.374 |
| Ақшкөл | Қарағанды | 48.017818 | B | +5 | 100.0 | 33.3 | 1.376 |
| Жиделі | Шығыс Қазақстан | 48.025707 | B | +5 | 100.0 | 33.3 | 1.361 |
| Қауылжыр | Ақтөбе | 48.031883 | B | +5 | 100.0 | 33.3 | 1.376 |
| Жайсанбай | Ақтөбе | 48.039595 | B | +5 | 100.0 | 33.3 | 1.379 |
| Мұқыр | Атырау | 48.043824 | B | +5 | 100.0 | 33.3 | 1.368 |
| Ақтам | Ақтөбе | 48.045926 | B | +5 | 100.0 | 33.3 | 1.379 |
| Абай | Қарағанды | 48.046245 | B | +5 | 100.0 | 33.3 | 1.364 |

"Engine at its margin" is the share of the 2,190 published cells the served script reproduces when
forced to the margin its latitude calls for: 100.0 pc at all 23. Forced to the other margin it
reproduces 33.3 pc, which is exactly the two columns the margin does not touch (fajr and isha, 730 of
2,190 cells). The tightest test in the set is Аманат at 47.999819, 0.000181 deg (20 m) south of the
line, and Қаражал қаласы at 48.001042, 0.001042 deg (116 m) north: both obey.

Widening to 0.5 deg gives 257 settlements and the same verdict, 0 disagreements
(`fit/line48-2026.md` lists the band). No settlement carries latitude 48.000000 exactly, so the
line's own edge is bracketed by 20 m rather than landed on.

**Reading of the wrong set: 1.36 to 1.39 min MAE against 0.11 to 0.13 for the right one, with no
day ever preferring the wrong set.** Same magnitude O1m-25 measured on the 96, now confirmed at
every day of every one of 5,658 tables.

## 5. The fits

One recipe, 15/15 Hanafi with the margin block, at 5,658 settlements, 2,065,170 days.
National: **87.51 pc exact, 99.9999 pc within one minute, MAE 0.125 min.**

| column | exact % | within-1 % | beyond 1 min | MAE | bias | worst |
|---|---|---|---|---|---|---|
| fajr | 89.6 | 100.0 | 1 | 0.104 | +0.002 | -9 |
| sunrise | 94.4 | 100.0 | 0 | 0.056 | -0.001 | +1 |
| dhuhr | 99.5 | 100.0 | 0 | 0.005 | -0.001 | +1 |
| asr | 62.5 | 100.0 | 0 | 0.375 | 0.000 | -1 |
| maghrib | 94.1 | 100.0 | 0 | 0.059 | -0.001 | +1 |
| isha | 85.0 | 100.0 | 8 | 0.150 | +0.002 | +108 |

Per region (`fit/fit-2026.md`, with per-column exact rates):

| region | settlements | exact % | within-1 % | MAE | fajr | sunrise | dhuhr | asr | maghrib | isha |
|---|---|---|---|---|---|---|---|---|---|---|
| Түркістан | 731 | 91.3 | 100.0 | 0.087 | 95.4 | 96.6 | 99.5 | 70.7 | 96.4 | 89.3 |
| Жамбыл | 376 | 90.9 | 100.0 | 0.091 | 94.8 | 96.4 | 99.5 | 69.9 | 96.2 | 88.6 |
| Алматы | 376 | 90.9 | 100.0 | 0.091 | 94.8 | 96.2 | 99.5 | 70.2 | 96.1 | 88.5 |
| Маңғыстау | 50 | 90.1 | 100.0 | 0.099 | 94.4 | 96.2 | 99.6 | 66.8 | 96.0 | 87.6 |
| Жетісу | 227 | 90.2 | 100.0 | 0.098 | 94.0 | 95.8 | 99.5 | 68.8 | 95.7 | 87.2 |
| Қызылорда | 203 | 89.7 | 100.0 | 0.103 | 93.8 | 95.8 | 99.5 | 67.1 | 95.5 | 86.7 |
| Republican cities | 3 | 89.3 | 100.0 | 0.107 | 92.2 | 95.4 | 99.5 | 67.0 | 96.0 | 85.5 |
| Атырау | 136 | 87.9 | 100.0 | 0.121 | 91.7 | 94.9 | 99.5 | 62.2 | 94.6 | 84.8 |
| Ұлытау | 55 | 87.8 | 100.0 | 0.122 | 90.6 | 94.5 | 99.6 | 63.5 | 94.3 | 84.7 |
| Абай | 286 | 87.8 | 100.0 | 0.122 | 89.8 | 94.4 | 99.5 | 64.3 | 94.2 | 84.5 |
| Шығыс Қазақстан | 266 | 87.8 | 100.0 | 0.122 | 89.8 | 94.3 | 99.5 | 64.4 | 94.0 | 84.6 |
| Қарағанды | 299 | 87.2 | 100.0 | 0.128 | 89.2 | 94.3 | 99.5 | 62.4 | 93.9 | 84.2 |
| Ақтөбе | 325 | 86.8 | 100.0 | 0.132 | 89.2 | 94.3 | 99.5 | 60.2 | 93.9 | 83.9 |
| Батыс Қазақстан | 409 | 86.1 | 100.0 | 0.139 | 88.3 | 93.9 | 99.5 | 57.8 | 93.5 | 83.5 |
| Ақмола | 550 | 85.2 | 100.0 | 0.148 | 85.9 | 92.9 | 99.5 | 57.7 | 92.6 | 82.7 |
| Павлодар | 293 | 84.9 | 100.0 | 0.151 | 84.9 | 92.5 | 99.5 | 57.7 | 92.3 | 82.4 |
| Қостанай | 546 | 84.3 | 100.0 | 0.157 | 84.6 | 92.6 | 99.5 | 55.1 | 92.1 | 82.1 |
| Солтүстік Қазақстан | 527 | 83.4 | 100.0 | 0.166 | 82.6 | 91.8 | 99.5 | 53.8 | 91.3 | 81.5 |

Latitude bands:

| band | settlements | exact % | within-1 % | MAE | fajr | sunrise | dhuhr | asr | maghrib | isha |
|---|---|---|---|---|---|---|---|---|---|---|
| 40-42 N | 345 | 91.7 | 100.0 | 0.083 | 95.7 | 96.8 | 99.5 | 71.5 | 96.6 | 90.0 |
| 42-44 N | 1,112 | 91.0 | 100.0 | 0.090 | 95.0 | 96.4 | 99.5 | 70.1 | 96.2 | 88.7 |
| 44-46 N | 441 | 90.1 | 100.0 | 0.099 | 94.1 | 95.9 | 99.5 | 68.2 | 95.7 | 87.1 |
| 46-48 N | 371 | 88.6 | 100.0 | 0.114 | 92.0 | 95.1 | 99.5 | 65.0 | 94.8 | 85.3 |
| 48-50 N | 822 | 87.3 | 100.0 | 0.127 | 89.8 | 94.3 | 99.5 | 62.2 | 94.0 | 84.3 |
| 50-52 N | 1,095 | 86.1 | 100.0 | 0.139 | 87.5 | 93.7 | 99.5 | 59.3 | 93.3 | 83.4 |
| 52-54 N | 1,156 | 84.3 | 100.0 | 0.157 | 84.2 | 92.4 | 99.5 | 55.6 | 91.9 | 82.1 |
| 54-56 N | 316 | 82.8 | 100.0 | 0.172 | 81.6 | 91.3 | 99.5 | 52.3 | 91.1 | 81.0 |

Extremes: 93.15 pc (Аққұм, Түркістан, 42.196 N) to 80.09 pc (Красный яр, Солтүстік Қазақстан,
55.369 N). The 96-settlement sample O1m-25 fitted ran 82.37 to 91.96 for the same reason: it stopped
at 54.94 N. Seasonal amplitude, fajr 15 Jan to 15 Jul, runs 174 min at the southernmost point
(40.60 N) to 274 min at the northernmost (55.41 N), monotone in latitude: band means 190, 220, 250
and 264 min.

**The gate.** The publisher's own `prayTimes.js` (sha1 `016c04a7a820a0d7`, kept at
`captures/served/prayTimes.js`), re-run locally as the page drives it, reproduces the server table
cell for cell at 50 settlements across the country: 109,500 cells, zero differences
(`fit/gate-2026.json`). The recipe and the publisher's two computation routes agree everywhere
tested.

## 6. The residual, and the slope at 5,658 points

The difference between the published minute and the model minute holds nothing but -1, 0 and +1 at
12,391,011 of 12,391,020 cells. Full histograms and per-column readings: `fit/residual-2026.md`.

**The latitude slope of exactness is -0.661 pc per degree at r -0.968 (n = 5,658).** O1m-25 measured
-0.653 pc/deg at r -0.965 on the 96. The national layer confirms it to 1.2 pc of the slope value and
to 0.003 of the correlation. A control run of the identical regression on the 91 settlements O1m-25
banked reads -0.650 at r -0.965, so the two measurements differ only in sample, not in method.

| series | slope (pc/deg) | r |
|---|---|---|
| all six columns | -0.661 | -0.968 |
| fajr | -1.054 | -0.940 |
| asr | -1.438 | -0.915 |
| isha | -0.664 | -0.843 |
| sunrise | -0.395 | -0.811 |
| maghrib | -0.413 | -0.817 |
| dhuhr | -0.001 | -0.011 |
| twilight columns averaged | -1.052 | -0.961 |
| solar columns averaged | -0.270 | -0.887 |

So the slope is not "entirely in the twilight columns" at national scale. Dhuhr is flat to three
decimals and carries no latitude term at all. Fajr, asr and isha fall three to four times faster than
sunrise and maghrib, which nonetheless fall at about -0.4 pc/deg with strong correlation. The
twilight share of the slope is about four fifths, not all of it. The mechanism O1m-25 named still
holds: further north the declared twilight angle sits in a shorter, faster-moving part of the sky,
so more days land near a minute boundary. Sunrise and maghrib inherit a smaller version of the same
compression because their own minute boundary is crossed more often at high latitude in winter.

**The slope by region** (`fit/residual-2026.md`, each region regressed across its own settlements):

| region | settlements | lat mean | exact % | slope | r | fajr | asr | isha | dhuhr |
|---|---|---|---|---|---|---|---|---|---|
| Түркістан | 731 | 42.0 | 91.3 | -0.442 | -0.647 | -0.385 | -0.935 | -0.848 | +0.012 |
| Жамбыл | 376 | 43.2 | 90.9 | -0.446 | -0.368 | -0.541 | -0.993 | -0.609 | -0.009 |
| Алматы | 376 | 43.5 | 90.9 | -0.548 | -0.425 | -0.528 | -1.209 | -0.927 | -0.002 |
| Маңғыстау | 50 | 44.2 | 90.1 | -0.623 | -0.698 | -0.820 | -1.083 | -0.914 | -0.110 |
| Жетісу | 227 | 45.1 | 90.2 | -0.506 | -0.547 | -0.628 | -1.041 | -0.814 | +0.073 |
| Қызылорда | 203 | 45.2 | 89.7 | -0.687 | -0.795 | -0.789 | -1.606 | -0.909 | -0.051 |
| Атырау | 136 | 47.5 | 87.9 | -0.580 | -0.619 | -1.123 | -0.891 | -0.401 | -0.031 |
| Ұлытау | 55 | 48.5 | 87.8 | -0.477 | -0.402 | -1.210 | -0.908 | +0.145 | -0.187 |
| Абай | 286 | 49.0 | 87.8 | -0.619 | -0.834 | -1.159 | -1.366 | -0.567 | +0.014 |
| Шығыс Қазақстан | 266 | 49.2 | 87.8 | -0.635 | -0.736 | -1.148 | -1.337 | -0.466 | +0.016 |
| Қарағанды | 299 | 49.5 | 87.2 | -0.719 | -0.761 | -1.351 | -1.603 | -0.711 | +0.007 |
| Ақтөбе | 325 | 49.6 | 86.8 | -0.596 | -0.751 | -1.135 | -1.239 | -0.465 | +0.025 |
| Батыс Қазақстан | 409 | 50.3 | 86.1 | -0.778 | -0.754 | -1.429 | -1.694 | -0.447 | -0.024 |
| Ақмола | 550 | 52.0 | 85.2 | -0.913 | -0.744 | -1.518 | -2.072 | -0.752 | -0.003 |
| Павлодар | 293 | 52.6 | 84.9 | -0.857 | -0.768 | -1.566 | -1.691 | -0.598 | +0.047 |
| Қостанай | 546 | 52.8 | 84.3 | -0.927 | -0.841 | -1.676 | -1.973 | -0.698 | -0.003 |
| Солтүстік Қазақстан | 527 | 54.0 | 83.4 | -1.103 | -0.728 | -1.864 | -2.238 | -1.022 | -0.020 |

Every region with enough settlements to carry a slope shows the same sign, and the steepest are the
northern regions. Within a single region the slope is steeper than the national figure, because a
region spans about three degrees (a national fit mixes the between-region level with the within-region
gradient). Dhuhr's per-region slopes are noise around zero, +0.073 to -0.187, with no region
significant in its own right.

**Nine cells beyond one minute, and all nine are model, not publisher.** At 9 settlements the model
disagrees with a smooth published table on exactly one day apiece:

| settlement | lat | date | column | model | published | model the day before and after |
|---|---|---|---|---|---|---|
| Ақадыр | 53.15 | 2026-07-13 | isha | 21:23 | 22:36 | 22:37, 22:36 |
| Құспек | 52.74 | 2026-07-10 | isha | 20:54 | 22:42 | 22:42, 22:42 |
| Байсал | 54.89 | 2026-07-23 | isha | 21:17 | 22:34 | 22:35, 22:34 |
| Петровка | 54.50 | 2026-07-21 | isha | 21:34 | 22:45 | 22:46, 22:44 |
| Измайловка | 54.89 | 2026-07-23 | isha | 22:13 | 22:37 | 22:38, 22:36 |
| Сосновка | 52.87 | 2026-07-11 | isha | 22:17 | 22:32 | 22:32, 22:32 |
| Иван-қала | 53.77 | 2026-07-17 | isha | 22:31 | 22:36 | 22:37, 22:36 |
| Петропавловка | 53.01 | 2026-07-12 | isha | 22:39 | 22:43 | 22:43, 22:43 |
| Старошумное | 53.91 | 2026-05-26 | fajr | 02:47 | 02:38 | 02:39, 02:38 |

In every case the published table is smooth across the day and the model jumps, so this is an adhan
4.4.6 discontinuity in its high-latitude interpolation, one day wide, at latitudes 52.7 to 54.9 N.
The recipe is not implicated and no margin, angle or school change repairs a one-day spike.
`fit/outlier-context-2026.json` holds the five-day window for each.

## 7. The sampled second year

2027, the first 20 settlements of every region: 343 requests, 338 tables, 123,370 rows, 0 mixed
captures, 0 line disagreements. Fitted on the same recipe: **87.71 pc exact, MAE 0.123**, against
87.73 pc and 0.123 at the same 338 settlements in 2026 (`fit/fit-2027.md`). The national 2026 figure
over all 5,658 tables is 87.51 pc and 0.125.

| test | result |
|---|---|
| settlements compared cell by cell | 338 |
| tables identical to 2026 | 0 |
| days identical across all six columns | 20.0 pc |
| largest cell difference | 1 minute |
| per-column identical share | fajr 66.6, sunrise 69.0, dhuhr 94.6, asr 74.3, maghrib 67.9, isha 65.7 pc |
| mean exact-rate change, 2027 minus 2026 | -0.015 pc |
| per-column mean change | fajr -0.05, sunrise +0.01, dhuhr -0.02, asr +0.14, maghrib -0.06, isha -0.11 pc |
| single-settlement spread of the change | -2.28 to +2.79 pc |

No table repeats 2026, every cell agrees to a minute, and the year's own solar drift is what moves
the identical share. The 2026 tables are computed for the year asked for, not relabelled.
`fit/year2-2027.json`.

## 8. Defects

1. **The endpoint intermittently serves a table whose margin block switches mid-year.** Nine of the
   5,658 captures (0.16 pc) came back with exactly one transition in `maghrib - sunset`, and in every
   case the later block carried the *opposite* margin for that latitude:

   | settlement | lat | set | blocks (days) | transition |
   |---|---|---|---|---|
   | Тасарал | 46.30 | A | 3:74, 5:291 | 2026-03-16 |
   | Жаңатілек | 51.78 | B | 5:75, 3:290 | 2026-03-17 |
   | Тасқұдық | 47.79 | A | 3:87, 5:278 | 2026-03-29 |
   | Павлодар қаласы | 52.32 | B | 5:167, 3:198 | 2026-06-17 |
   | Жігер | 49.69 | B | 5:174, 3:191 | 2026-06-24 |
   | Алексеевка | 52.53 | B | 5:240, 3:125 | 2026-08-29 |
   | Шолпан | 47.06 | A | 3:241, 5:124 | 2026-08-30 |
   | Междуозерное | 53.45 | B | 5:272, 3:93 | 2026-09-30 |
   | Сарытоғай | 42.60 | A | 3:336, 5:29 | 2026-12-03 |

   A single re-request returned a consistent table in all nine cases, so the publisher's cache
   serves a mixed answer intermittently and not for long. A mixed table puts its minority block two
   minutes out on four columns for the whole of that block, so every capture is checked for a
   constant margin before it is fitted, and the variant bodies are archived in
   `captures/variants/` (`fit/variants-2026.json`). The surface is stateful, and one pull is not
   evidence of the next.
2. **18 points have no table, and they are exactly the 18 coordinate duplicates.** Section 3.
   O1m-25 recorded five of them as unexplained 500s. The national layer shows the rule.
3. **20 pairs of settlements publish the same table because they are one point.** The gazetteer files
   them twice, 0.1 to 5.2 m apart, so their tables are identical to the cell
   (`fit/identity-2026.json`). 24 pairs sit under 50 m. Seven of the 20 pairs carry two different
   names, including Ошақ against Қара-адыр, Ойтал (Сарымолдаев) against Меркі (ст.), and Жыныс ата
   against Таукент. So the 5,694-entry list resolves to 5,656 distinct places at ten metres, and the
   "national coverage" figure of 5,694 overstates it by 0.7 pc.
4. **adhan 4.4.6 has one-day high-latitude discontinuities.** Section 6, nine settlements.
5. **The endpoint refuses any coordinate text not in the gazetteer**, which bars synthetic
   latitude probes and means the 48 N edge can only be read through settlements. The closest are
   20 m and 116 m from the line.

## 9. Files

- `captures/raw/2026/` 5,658 raw API bodies; `captures/raw/2027/` 338; `captures/variants/` the nine
  mixed tables and their re-fetched forms; `captures/probe48-*.json` the seven refused synthetic
  probes; `captures/served/prayTimes.js` the served script; `captures/pull-2026.log`,
  `captures/pull-2027.log`, `captures/pull-2026.jsonl`, `captures/pull-2027.jsonl`; `captures/MANIFEST.md`
  digests and byte counts.
- `data/gazetteer.json`; `data/region-<slug>-2026.json` (18 files) and `-2027.json`; `data/margins-*.json`;
  `data/coverage-*.json`; `data/normalize-*.json`; `data/jobs-*.json`.
- `fit/fit-2026.json` and `.md`, `fit/fit-2027.*`, `fit/regions-*.json`, `fit/residual-*.md`,
  `fit/line48-2026.*`, `fit/line-engine-2026.json`, `fit/gate-2026.json`, `fit/identity-2026.json`,
  `fit/outliers-2026.json`, `fit/outlier-context-2026.json`, `fit/variants-2026.json`,
  `fit/duplicates-2026.json`, `fit/failures-2026.json`, `fit/year2-2027.json`, `fit/refetch-*.json`.
- `scripts/`: `gazetteer.js`, `pull.js`, `refetch.js`, `reprobe-failures.js`, `normalize.js`,
  `fit.js`, `make-md.js`, `gate.js`, `engine.js`, `line-engine.js`, `identity.js`, `duplicates.js`,
  `outlier-context.js`, `variants.js`, `year2.js`, `summary.js`, `manifest.sh`.

Disk: 377 MB of raw captures, 187 MB of dated tables, 15 MB of fits. Nothing here approaches the
2 GB line, so the full national year is banked rather than sampled.

## 10. NEXT

- **The margin switch is the open question.** Nine captures in 5,658 arrived with a mid-year flip,
  and each flip is the opposite margin. A second pull of the same 5,658 points, compared cell for
  cell, would say whether these are one per settlement per year or a moving cache. The pull is
  63 minutes and the comparison is free.
- **The 18 duplicate points** are the only gap in the national layer. O1m-25 found the page still
  computes five of them in the browser. If the page route is general, the 18 can be filled from the
  served script rather than the API, which would close the layer at 5,676 of 5,676.
- **The far horizon.** The same endpoint takes any year. 2035, 2050 and 2076 at a handful of
  settlements would date the recipe's stability, and 2025 would give the second full national year
  rather than the 20-per-region sample.
- **The adhan discontinuity** should be traced to its source in 4.4.6 and reported upstream. Nine
  cells in 12.4 million, but it is an engine defect in the same rule every high-latitude recipe uses.
- Untested: whether a settlement's set can ever disagree with its latitude, since the cache variant
  is the only place the opposite margin has appeared, and only for part of a year.
