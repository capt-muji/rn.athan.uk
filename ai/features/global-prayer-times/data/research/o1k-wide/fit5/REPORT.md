# O1k wide fit phase, batch 5: Philippines, East Africa, Brazil, Toronto

Four jobs fitted against adhan 4.4.6 (`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`),
each in its own `TZ=<zone>` process. Every time is computed at second resolution
(`Rounding.None`) and rounded to the minute by explicit rule, never by the library's default.
Margins sit on a 0.5-minute grid and are bounded to +-2 minutes so an angle cannot hide inside
an offset. Where the span cannot separate a parameter from its compensating margin, the band
that still reproduces every row within 1 minute is reported beside the adopted value. No clock
is read; no network is used. Data: `../philippines/data`, `../horneast2/data`,
`../americas/data`. Outputs: `ph.json`, `ea.json`, `br.json`, `ca.json`.

## Readings that shaped the jobs

- The Philippines' printed isha-maghrib interval is not constant on either surface. Davao runs
  64 to 69 minutes, BARMM 73 to 75. The task brief reads both as fixed offsets; the fit tests
  that reading and rejects it for Davao.
- The East Africa payloads are one platform's tables: eleven mosques, six columns, 366 rows
  each. Nine of eleven fit one angle pair to within 2 minutes on every row.
- Brazil's payloads carry two UTC offsets. Four cities publish UTC-4; fitting them in one zone
  produces a clean 60-minute error on every column of every row, which is a harness error, not
  a method error.
- Toronto's isha is an interval readable directly from the two published columns: exactly
  maghrib + 80 for one mosque on all 365 days, + 90 for the other on 345 days.

## Job 1: the Philippines' two year-round surfaces

Coordinates: Davao 7.0711, 125.6125; Cotabato 7.2047, 124.2310; Marawi 7.9997, 124.2864.
Zone Asia/Manila. 148 dated rows in total.

### One recipe per surface

| Surface | Rows | Span held | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha | Rounding | Exact | Within 1 | Worst |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Davao | 90 | 2025-09-22..2025-10-21 and 2026-10-11..2026-12-09 | 18.1 deg, +0.5 | -1 | +0.5 | Shafi, +0.5 | +0.5 | **16.7 deg, +1.5** | nearest | 354/540 | 540/540 | 1 |
| Cotabato | 29 | 2026-06-16..2026-07-14 | 17.5 deg, -2 | -1 | 0 | Shafi, 0 | +0.5 | **18.1 deg, -1** | nearest | 151/174 | 174/174 | 1 |
| Marawi | 29 | 2026-06-16..2026-07-14 | 17.7 deg, -1 | -1 | 0 | Shafi, 0 | +0.5 | **18.1 deg, -1** | nearest | 133/174 | 174/174 | 1 |

The minute values are the per-column margin. The three rounding modes score identically on all three
surfaces, so the convention is not identified; nearest is adopted.

Davao's six columns in full: fajr 79/90 exact (worst 1), sunrise 46/90, dhuhr 50/90,
asr 64/90, maghrib 49/90, isha 66/90. Cotabato: fajr 29/29 and asr 29/29 exact, sunrise 24/29,
dhuhr 26/29, maghrib 15/29, isha 28/29. Marawi: fajr 28/29, sunrise 20/29, dhuhr 20/29,
asr 20/29, maghrib 16/29, isha 29/29.

Hanafi is refuted on both surfaces, 60 minutes out at Davao and 61 at Cotabato.

### Isha: an angle, not the interval the brief expected

| Surface | Interval model | Angle model |
|---|---|---|
| Davao | best 67 min: exact 30/90, within 1 56/90, **worst 4** | 16.7 deg: exact 66/90, within 1 90/90, worst 1 |
| Cotabato | best 76 min: exact 17/29, within 1 29/29, worst 1 (band 74..78) | 18.1 deg: exact 28/29, within 1 29/29, worst 1 |
| Marawi | best 76 min: exact 23/29, within 1 29/29, worst 1 (band 74..78) | 18.1 deg: exact 29/29, worst 0 |

Davao settles it. A fixed interval cannot produce a 64 to 69 minute span (worst 4), while a
single isha angle of 16.7 degrees reproduces the drift: the printed interval lengthens as the
sun's declination moves away from the equinox, which is what a fixed depression angle does at 7N.
The 64 to 69 minute spread is the angle signature, not a fixed offset.

BARMM is the opposite case. Its 29 days sit inside one solstice, so an 18.1 degree angle and a
76 minute interval both reproduce it within 1 minute. The angle model wins on exact count (28/29
and 29/29 against 17/29 and 23/29), and the printed interval itself declines from 75 to 73
through July, which no fixed interval produces.

### What the rows can identify

| Surface | Fajr band | Isha angle band | Isha interval band |
|---|---|---|---|
| Davao | 17.3..18.5 | 16.5..17.6 | none (no interval reaches within 1) |
| Cotabato | 17.3..18.6 | 17.3..18.5 | 74..78 |
| Marawi | 17.3..18.5 | 17.3..18.5 | 74..78 |

Each band is the range of the parameter that still puts every row within 1 minute once the
margin absorbs the difference. At 7N, 1 degree of fajr angle is worth about 4 minutes of clock,
so a one-month poster identifies almost nothing. The adopted values are the plateau members with
the smallest margin.

### Per year

Davao 2025 (30 rows): 180/180 within 1, 138 exact. Davao 2026 (60 rows): 360/360 within 1, 216
exact. One recipe serves both years. Fitted per year on their own, fajr lands on 17.6 with a
-1 margin for 2025 and 18.4 with +1.5 for 2026, and isha on 17.0 and 16.7: the free per-year
parameters move 0.8 degrees inside the margin band, so the span carries the identification and
neither year does. Parameters frozen is the correct read; the year-on-year movement is the
unidentifiable axis, not a shift.

### Do the two regions share one method

Yes on fajr, asr, rounding and the sunrise/dhuhr/maghrib convention; no on isha.

- Fajr: one angle of 18.1 degrees with a +0.5 margin on all three surfaces reproduces all 148
  rows within 1 minute, 124 exact.
- Isha: applying either region's isha to the other misses by 4 minutes on **every** row
  (0 of 29, 0 of 90, 0 of 90 within 1). One shared angle of 17.4 degrees covers all 148 rows
  within 1 minute only by keeping a regional offset: -1 minute on Davao, +1.5 on BARMM. The
  regions differ about 9 minutes of post-maghrib interval at the same latitude, which no single
  configuration produces.
- Asr is Shafi and within 1 minute under every cross-application.

Seasonal amplitude over the segment held: Davao fajr 04:14..04:23 (9 min), maghrib 17:18..17:35
(17 min), isha 18:25..18:40 (15 min). Cotabato fajr 04:11..04:18 (7 min). No January or July
rows exist for the Philippines on any surface, so the annual amplitude is not measurable here.

## Job 2: the East Africa mosque clusters

Zones: Africa/Mogadishu for Somalia, Africa/Djibouti for Djibouti. Both are UTC+3 with no DST in
2026 and their offsets are identical on every day of the year, verified, so one process zone is
exact for both. Eleven payloads, 366 rows each, all of 2026.

### The platform class

**Muslim World League 18/17, Shafi asr, nearest rounding, zero margins, zero adjustments.**
That is the platform's own default, not a mosque-authored parameter statement, so the grade is
community. Under it, unchanged, per payload:

| Payload | Worst | Within 1 | Exact | Fajr angle fitted | Fajr / sunrise / dhuhr / asr / maghrib / isha worst |
|---|---|---|---|---|---|
| Hargeisa, Masjid Marwa | 2 | 2169/2196 | 1887 | 18.0 @ 0 | 1 / 1 / 1 / 2 / 1 / 1 |
| Hargeisa, Masjid Nuurul Huda | 2 | 2150/2196 | 1882 | 18.0 @ 0 | 1 / 1 / 1 / 2 / 1 / 1 |
| Hargeisa, Masjid Ina Weerar | 3 | 1789/2196 | 1260 | 17.1 @ -2 | 3 / 1 / 1 / 1 / 1 / 2 |
| Mogadishu, Rabbul Caalamiin | 2 | 2147/2196 | 1650 | 18.2 @ +0.5 | 1 / 1 / 1 / 2 / 1 / 1 |
| Mogadishu, Cali Jimcaale | 2 | 2181/2196 | 1891 | 18.0 @ 0 | 1 / 1 / 0 / 2 / 1 / 1 |
| Djibouti, Djaffar Gabode 4 | 1 | **2196/2196** | 1936 | 18.0 @ 0 | 1 / 1 / 1 / 1 / 1 / 1 |
| Djibouti, Abd ar-Rahman bin Awf | 2 | 2131/2196 | 1709 | 18.2 @ +0.5 | 1 / 1 / 1 / 2 / 1 / 1 |
| Djibouti, Al-Salam FYART | **15** | 1970/2196 | 919 | 17.9 @ 0 | 3 / 7 / 5 / 15 / 13 / 6 |
| Djibouti, Tayib Nagad | 1 | **2196/2196** | 1863 | 18.0 @ 0 | 1 / 1 / 1 / 1 / 1 / 1 |
| Djibouti, Nashr Aldine | 2 | 2195/2196 | 1899 | 18.0 @ 0 | 1 / 1 / 1 / 2 / 1 / 1 |
| Djibouti, Ihsaan | 2 | 2190/2196 | 1895 | 18.0 @ 0 | 1 / 1 / 1 / 2 / 1 / 1 |

Seven of eleven land on 18.0 with a zero margin on the nose. Every available cell of every
payload is within 1 minute except asr. Asr is the platform's soft column: 72 to 166 exact of 366
with the residual split evenly either side of the minute boundary (histograms of +1 and -1 near
equal, bias under 0.05 minute on every payload that fits the class). Two different minute
margins score identically, so the platform's asr sits about half a minute off adhan's and cannot
be improved from minute-resolution data.

### The cleanest payload per city, and the cluster verdicts

| City | Cleanest payload | Recipe | Grade |
|---|---|---|---|
| Hargeisa | Masjid Marwa | MWL 18/17, Shafi, nearest, zero margins | community (platform default) |
| Mogadishu | Masjidka Cali Jimcaale | MWL 18/17, Shafi, nearest, zero margins | community (platform default) |
| Djibouti | Masjid Djaffar Gabode 4 | MWL 18/17, Shafi, nearest, zero margins | community (platform default) |

**Hargeisa: one configuration for two of the three mosques.** Marwa and Nuurul Huda differ by
0 or 1 minute on every column on every day of the year. Ina Weerar does not: against the class
recipe its fajr prints 1 to 2 minutes later all year and its isha 1 to 2 minutes later as well,
and against Marwa the fajr gap reaches 3 minutes. The fit reads that as a fajr angle near 17
degrees and an isha 1.5 minutes later than the pair. The cluster is one configuration plus one
mosque running its own angles.

**Mogadishu: one configuration.** The pair differs by 0 or 1 minute in every column, one table
uniformly a minute earlier. Cali Jimcaale's dhuhr is exact on all 366 days.

**Djibouti: one configuration for five of six.** Djaffar Gabode 4, Abd ar-Rahman, Tayib Nagad,
Nashr Aldine and Ihsaan agree within 1 minute in every column. Al-Salam FYART is defective:
asr scatters -14 to +16 minutes, sunrise -7 to +6, maghrib -2 to +13, fajr mostly a minute early.
Each column carries a different offset, the arithmetically inconsistent class, and it is excluded.

Between-year stability is untestable: one year held per payload. Seasonal amplitude over 2026,
fajr minimum to maximum: Hargeisa 47 minutes (04:26..05:13), Djibouti 54 (04:25..05:19),
Mogadishu 31 (04:30..05:01). At 2N the annual swing is about half the 11N swing, as latitude
framing predicts.

## Job 3: Brazil, the 25-city verification

Method held fixed: Muslim World League 18/17, Shafi asr, nearest rounding, **no margins**. Data:
25 cities, 2026-02 and 2026-11, 1,450 dated rows, 8,700 cells. Four payloads publish UTC-4
(Manaus, Cuiaba, Campo Grande, Porto Velho) and 21 publish UTC-3; each group was evaluated in
its own zone.

| City | Coords | Worst | Within 1 | Exact |
|---|---|---|---|---|
| Manaus | -3.1190, -60.0217 | 0 | 348/348 | 348/348 |
| Salvador | -12.9777, -38.5016 | 1 | 348/348 | 345/348 |
| Sao Paulo | -23.5505, -46.6333 | 0 | 348/348 | 348/348 |
| Curitiba | -25.4284, -49.2733 | 1 | 348/348 | 335/348 |
| Porto Alegre | -30.0346, -51.2177 | 0 | 348/348 | 348/348 |
| **All 25 cities** | **5 named plus 20** | **1** | **8700/8700** | **8503/8700** |

The confirmation holds: every city, north to south and across the equator, reproduces within
1 minute with no margin, mean absolute error 0.023 minute. Nine cities carry 1-minute cells,
197 of 8,700 in all: Brasilia 63, Joao Pessoa 49, Vitoria 42, Fortaleza 22, Curitiba 13,
Porto Velho 3, Salvador 3, Goiania 1, Guarulhos 1. The other sixteen are exact on all 348
cells. No city needs an adjustment and no column needs a margin: the best margin per column is
0 in all five cities tested.

The national surface is one method at one rounding, confirmed on 34 degrees of latitude.

## Job 4: Canada's year feeds

Toronto 43.6532, -79.3832, zone America/Toronto. Two dpt year feeds, 365 dated rows each, 2026.

### Two recipes

| Mosque | Fajr | Isha | Asr | Rounding | Exact | Within 1 | Worst |
|---|---|---|---|---|---|---|---|
| Masjid Toronto (MAC) | 14.9 deg, margin 0 | **maghrib + 80**, every day | Shafi, margin 0 | nearest | 1063/2190 | 1876/2190 | 3 |
| Islamic Institute of Toronto | 15.2 deg, margin +0.5 | **maghrib + 90**, 345 days; 89 on 20 April days | Shafi, margin 0 | nearest | 1065/2184 | 1769/2184 | 3 |

The interval is not fitted from a model: it is printed in the data. Printed isha minus printed
maghrib is exactly 80 on all 365 days for Masjid Toronto, and 90 on 345 days and 89 on 20 April
days for the Institute. Expressed against adhan's own sunset the intervals fit at 81 and 90
minutes, because adhan's sunset sits about half a minute earlier than theirs.

Hanafi asr is 72 and 105 minutes out, so the school is Shafi, decisively.

Per column, Masjid Toronto: fajr 228/365 exact (worst 2), sunrise 137 (worst 2), dhuhr 301
(worst 1), asr 145 (worst 3), maghrib 126 (worst 2), isha 126 (worst 2). The Institute is the
same shape.

**One defect row.** The Institute's asr on 2026-03-08 is 60 minutes early, the day Canada
advances its clocks. Dropping that single row leaves worst 3 and 1769/2184 within 1. It is a
DST-day artifact in one column, not a method difference.

### Why the geometric columns stop at worst 3

Sunrise and maghrib move symmetrically about an exact dhuhr: in August to October the printed
sunset is 2 to 3 minutes later than adhan's and the printed sunrise 2 minutes earlier, while
dhuhr is within 1 minute all year. That is a day length 4 to 6 minutes longer in that season,
not a clock or longitude offset. A coordinate fit over latitude 43.30..44.00 and longitude
-79.70..-79.09 does not reduce it (best point 43.66, -79.40, mean absolute residual 0.91
minute), so no published coordinate explains it. Asr inherits the same error through the shared
declination. The recipe is right; their solar model is off by about half a degree of declination in
that season.

### Agreement with each other

| Column | Institute minus Masjid Toronto, minutes |
|---|---|
| fajr | -2..0 |
| sunrise | -2..0 |
| dhuhr | -1..0 |
| asr | -59..1 (the 8 March row; otherwise -1..1) |
| maghrib | -2..1 |
| isha | +8..+10 |

The two mosques agree on the method: fajr at 15 degrees, Shafi asr, a fixed post-maghrib
interval, nearest rounding. They differ only in the interval, 80 against 90 minutes, which is
the whole of the isha gap.

### Divergence from FCNA's stated 13/13

Neither mosque uses FCNA's Canadian pair, and neither uses 15/15 either.

| Mosque | Printed isha minus a 13 deg isha | Printed isha minus a 15 deg isha |
|---|---|---|
| Masjid Toronto | -12.5..+15.5 min (mean +5.4 later) | -30.5..+4.5 min (mean -7.7) |
| Islamic Institute | -2.5..+24.5 min (mean +14.8 later) | -21.5..+13.5 min (mean +1.7) |

Read against 13 degrees, the printed isha is up to 15 minutes late at Masjid Toronto and up to
25 minutes late at the Institute. It falls behind that line only in May to July at Masjid
Toronto, and only in June at the Institute. This is the
sharpest available Canadian rebuttal to the assumption that the community follows 13/13: the two
largest Toronto mosques print fajr at 15 degrees and an interval, and the interval read back as
an angle runs from 11.7 degrees in June to 15.7 in October at Masjid Toronto (12.9 to 17.3 at
the Institute). That wobble is the interval, not a parameter.

Seasonal amplitude: fajr 03:46..06:32 (166 minutes), isha 18:01..22:24 (263 minutes). The
high-latitude surface swings 18 times the Philippine fajr span, which is the latitude framing
point in its strongest form.

## Why a span, not a year

| Job | Span held | Between-year test |
|---|---|---|
| Philippines | 148 rows, three Hijri months, 2025 and 2026 | both Davao years hold at worst 1 under one recipe; per-year free fits wander 0.8 degree inside the margin band |
| East Africa | 11 payloads, one year each | untestable, one year held |
| Brazil | 25 cities, two months of 2026 | untestable, but the two months are five months apart and both hold within 1 minute |
| Toronto | two feeds, one year each | untestable, one year held |

Only the East Africa and Toronto year feeds hold every day of a year. The Philippines holds no
January or July row, and Brazil holds two months five months apart.

## Limits

- Minute-resolution data bounds every claim at 1 minute. A one-month poster cannot separate an
  angle from a compensating margin; each such value is reported with the band that fits.
- The margin grid is 0.5 minute. Sub-minute conventions (refraction, solar model) are invisible
  to the fit and show up as the residual spread that stops several columns short of exact.
- The Philippines' isha verdict for BARMM is a model choice on exact count, not a proof: both
  models pass the 1-minute test on 29 solstice days.
- Toronto's worst 3 is the publisher's solar model, not the recipe. The recipe reproduces fajr,
  the interval and the school on every row within the stated score.

## Files

- `ph.json`, `ea.json`, `br.json`, `ca.json`: one deliverable per job.
- `lib.mjs` (shared machinery), `ph.mjs`, `ea.mjs`, `br.mjs`, `ca.mjs` (per-job fits),
  `ca-coord.mjs` (the coordinate test behind the Toronto residual), `ea-detail.mjs` (per-column
  residual histograms), `compose.mjs` (builds the four deliverables from the raw fit outputs).
- Raw fit outputs `ph-fit.json`, `ea-fit.json`, `br-fit.json`, `br-fit-m3.json`, `br-fit-m4.json`,
  `ca-fit.json`.
