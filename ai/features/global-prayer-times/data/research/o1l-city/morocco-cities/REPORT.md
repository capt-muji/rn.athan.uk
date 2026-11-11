# O1l morocco-cities: per-city fits at one national regime, and the December watch

Tag `morocco-cities`. Workspace `census/o1l-city/morocco-cities/`. Raw captures in `captures/`,
normalized rows and fit outputs in `data/`, the method is `harness.js` (one output
`run-summary.txt`). Read-only reference: the census record's Morocco row, `../BRIEF.md`,
`../FIT-RULES.md`, and the O1k-M1 block in `o1k-wide/CONSOLIDATION.md`.

## Surface

| Source | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- |
| Ministry rebuilt prayer portal | `habous.gov.ma/data/horaires-2026-10.js`, `-11.js` | authority | 190 cities x 61 days, 11,590 rows, 69,540 cells | 2026-10, 2026-11 |
| Portal chrome (clock rule) | `habous.gov.ma/assets/js/prieres.js` | authority | `DECALAGE_MAROC_MINUTES = 0`, decree 2.26.530 | current |
| Portal index | `habous.gov.ma/` | authority | references October and November only | current |

Both month files were re-fetched fresh this run (200, 301,588 and 292,088 bytes). Enumeration is
190 cities, ids 1..169 plus 301..322 minus 303, zero name/id mismatches across the two months.

## The December watch

Not due until 2026-12-01. Probed anyway three times: `https://www.habous.gov.ma/data/horaires-2026-12.js`
returned **404, 555 bytes, nginx/1.31.8** at 2026-11-11T05:39:57Z, at 05:57:02Z, and at
05:58:52Z at close.
Controls in the same sweep: 2026-11 returns 200, 2027-01 returns 404. The portal root, which is the
portal's own index of published months, references `horaires-2026-10.js` and `horaires-2026-11.js`
and nothing else. Verdict: December is not published, the window is still current plus previous
month, and no December row exists to capture. Record in `data/probe-2026-12.json`.

## Method

Engine adhan 4.4.6, `CalculationParameters("Other", 19, 17)`, madhab Shafi, `Rounding.None`, zero
adjustments during the coordinate solve. Clock UTC+0 throughout: `fuseau:"GMT"` in both month
files, so every printed time is read as a UTC instant with no shift. Dates are built from the
capture strings, never from the real clock.

The portal publishes no coordinates, so each city's point is solved from its own rows:

- **Longitude** from printed dhuhr against the solar transit. This absorbs the national dhuhr
  margin, so the dhuhr column is an anchor and not an independent test.
- **Latitude** from the *shape* of the sunrise-to-maghrib bracket across 61 days, with the
  bracket's mean offset profiled out. The shape, not the level, sets latitude, so latitude and
  the horizon offset do not trade off.
- **Margins** per city as mean(printed minus computed) at the solved point.

Validation against an independent gazetteer: of the 190 names, 98 match a Wikidata settlement
label (94 exactly, 4 by spelling variant), and over those the solved point sits at median latitude
delta -0.21 deg and median longitude delta -0.01 deg. Latitude fit residual (bracket shape) is 0.41 min median, 0.49 worst.

## Result 1: the national margin set

| Column | Rebuilt margin (min) | Census record | Delta | Per-city sd across 190 |
| --- | ---: | ---: | ---: | ---: |
| fajr | -0.44 | -1 | +0.56 | 0.078 |
| sunrise | -4.77 | -3 | -1.77 | 1.570 |
| dhuhr | +5.00 | +5 | 0.00 | 0.036 |
| asr | +0.33 | +1 | -0.67 | 0.146 |
| maghrib | +5.50 | +4 | +1.50 | 1.283 |
| isha | -0.07 | 0 | -0.07 | 0.095 |

The sunrise and maghrib rows are medians over a mixed elevation population and are not the
regime's horizon margins; the sea-level values are in Result 4.

The additive margin and the rounding rule are jointly unidentifiable on this surface. Fitting the
margin to the centre of each rule's interval gives an identical exact-match rate under floor,
nearest and ceiling, because all three intervals are one minute wide and their centres differ by
exactly 0.5 min. Only the combination of the two is observable, so every margin here carries a
plus or minus 0.5 min uncertainty and the census convention (fajr floor, rest nearest) is
inherited from the record rather than measured.

## Result 2: per-city scores at one national margin set

All 190 cities scored at the single set above, each at its own solved point.

| Column | within 1 min | exact (census convention) | worst | cities perfect |
| --- | ---: | ---: | ---: | ---: |
| fajr | 11,590/11,590 (100.0 pc) | 5,616 (48.5 pc) | 0.97 | 190/190 |
| sunrise | 4,541/11,590 (39.2 pc) | 2,189 (18.9 pc) | 4.60 | 39/190 |
| dhuhr | 11,590/11,590 (100.0 pc) | 10,947 (94.5 pc) | 0.60 | 190/190 |
| asr | 11,566/11,590 (99.8 pc) | 9,338 (80.6 pc) | 1.30 | 176/190 |
| maghrib | 5,517/11,590 (47.6 pc) | 2,647 (22.8 pc) | 3.70 | 39/190 |
| isha | 11,590/11,590 (100.0 pc) | 10,002 (86.3 pc) | 0.99 | 190/190 |
| **all** | **56,394/69,540 (81.10 pc)** | **40,739 (58.58 pc)** | **4.60** | **34/190** |

Distribution of city totals (of 366 cells): 366/366 in 34 cities, 360 to 365 in 7, 350 to 359 in
7, 340 to 349 in 4, below 340 in 138. Median 290.5, fifth percentile 243, minimum 239
(c=308, Ait el Kack). City exact totals: median 200.5, range 167 to 314. City worst residual:
median 1.74 min, 95th percentile 3.40, maximum 4.60.

Every failure in the table sits in sunrise, maghrib, or the 24 asr cells that share the same
high-elevation cities. The other three columns are national to the rounding floor.

## Result 3: the ten worst cities, cause named

| c | city | within/366 | worst | worst at | bracket | DEM m |
| ---: | --- | ---: | ---: | --- | ---: | ---: |
| 145 | أسول | 244 | 4.60 | 2026-11-22 sunrise | 17.54 | 1079 |
| 84 | بولمان | 242 | 4.58 | 2026-11-26 sunrise | 17.10 | 1508 |
| 308 | آيت القاق | 239 | 4.48 | 2026-11-30 sunrise | 16.96 | 1885 |
| 72 | زاوية أحنصال | 244 | 4.28 | 2026-10-01 sunrise | 16.74 | 1596 |
| 317 | إيكس | 242 | 4.26 | 2026-10-03 sunrise | 16.63 | 1360 |
| 309 | أكدال أملشيل | 244 | 4.00 | 2026-10-01 sunrise | 16.17 | 1749 |
| 146 | أمسمرير | 244 | 3.76 | 2026-11-30 sunrise | 15.86 | 1522 |
| 133 | إملشيل | 243 | 3.75 | 2026-11-23 sunrise | 16.20 | 1749 |
| 120 | إغرم | 242 | 3.41 | 2026-11-27 sunrise | 15.32 | 971 |
| 318 | كرس | 244 | 3.40 | 2026-10-06 sunrise | 15.48 | 1965 |

One cause, the same in all ten: a wider sunrise-to-maghrib bracket than sea level, carried by a
per-city horizon term. All ten sit between 971 m and 1965 m. Their fajr, dhuhr and isha columns
are 61/61; asr slips only where the term is largest (56/61 to 60/61).

## Result 4: the horizon term is elevation

The bracket offset, maghrib minus sunrise in minutes, is 10.20 median and 2.85 sd across the 190
cities, range 5.85 to 17.54. It does not track latitude (corr -0.01) or longitude (corr 0.30). It
tracks elevation: corr 0.75 against the nearest-place DEM, and corr 0.87 against the Wikidata
`P2044` elevation of the 64 matched cities that carry one.

| DEM band | cities | median bracket |
| --- | ---: | ---: |
| 0 to 100 m | 21 | 6.56 |
| 100 to 300 m | 34 | 7.63 |
| 300 to 600 m | 41 | 9.21 |
| 600 to 1000 m | 45 | 11.46 |
| 1000 to 1500 m | 22 | 13.02 |
| 1500 to 3000 m | 27 | 13.96 |

Sea level: the 40 cities under 200 m give a bracket of 6.93 min, and the halfsum of the two
horizon margins is +0.67, so the sea-level horizon margins are **sunrise -3.13 and maghrib
+3.80**. Those are the record's -3 and +4 to within 0.4 min. The rebuilt portal keeps the census
horizon convention and adds a per-city elevation term on top of it.

A model with the national margins on fajr, dhuhr, asr and isha plus this per-city horizon term
scores **69,496/69,540 cells within 1 min (99.94 pc), 173/190 cities perfect, worst 1.30 min**,
with every column at 99.79 pc or better. The term is applied to sunrise and maghrib only: fajr and
isha are 100 pc within 1 min at a national angle and a national margin, so whatever the portal
does for the horizon it does not do for the twilight angles.

## Verdict: national on four columns, city-varying on two

- **fajr, dhuhr, asr, isha: one national margin set.** Per-city spread is 0.036 to 0.146 min, that
  is 2 to 9 seconds, against a 1-minute printed grid. That is the rounding floor, not a
  convention difference. A city-varying twilight regime of the Tunisia elevation-ladder class
  would show a spread of minutes (2.5 to 3.7 there), not seconds.
- **sunrise and maghrib: city-varying, by elevation.** The per-city spread is 1.28 to 1.57 min and
  is fully explained by terrain height (corr 0.87 on independent elevations).

This corrects the O1k-M1 reading. That run reported the sunrise and maghrib per-city spread as
latitude noise and concluded "one national generator, no deviating city in structure". The spread
is the elevation term, and it is a real structural feature of the rebuilt portal.

## Stability and forward span

Between months, at fixed solved points, the per-city margin moves by median -0.22 min (fajr),
+0.31 (asr), +0.26 (isha), and 0.00 (sunrise, maghrib), with per-city sd near 0.1. The small
systematic drift is an engine-to-engine seasonal residual, not a publisher regime change: it stays
inside the 1-minute gate and reverses no city.

Out of sample, points and margins fitted on October and scored on November: 27,363/34,200 cells
within 1 min (80.01 pc), which matches the in-sample 81.10 pc, and 99.30 pc with the per-city
horizon term. The regime is stable across the two months held.

Span ceiling: two months, 61 days, 11,590 rows, 2026 only. No forward extension is served; the
window is current plus previous month and the pre-rebuild archive is gone from this portal (O1k-M1
recorded 12 months of 2025 and the 2024 tail as 404, re-probed this run: 2025-01, 2025-06,
2025-12 and 2024-12 all return 404, 555 bytes). Longevity verdict: stable across 2 months,
proven to 2026-11-30 and no further.

## The GMT clock

The printed times are UTC+0, measured, not assumed. Printed dhuhr minus the UTC solar transit over
all 190 solved longitudes is **+5.00 min, sd 0.29**. A table on UTC+1 would print +65. The value
is the dhuhr margin itself, so the table is the declared clock.

The `fuseau:"GMT"` field could not be checked against a December row because no December file
exists. It is confirmed on both published months (`fuseau:"GMT"` in the 2026-10 and 2026-11
headers) and in the portal's own code (`DECALAGE_MAROC_MINUTES = 0`, with the comment naming
decree 2.26.530 and 2026-09-20). The decree date precedes the whole served window, so the portal's
output needs **no shift** and none is expected when December lands. Ramadan 1448 (about February
2027) falls outside the window; under the decree Morocco stays on GMT year round, so the old C31
Ramadan display rule has no future surface.

## Reconciliation with O1k-M1

| Claim | O1k-M1 | This run |
| --- | --- | --- |
| asr regime shift | -1.42 min | -0.67 min |
| fajr regime shift | +0.42 min | +0.56 min |
| isha regime shift | -0.37 min | -0.07 min |
| 99.5 pc of cells within 1 | at per-city fitted margins | 99.94 pc at national margins plus the elevation term |
| city structure | uniform, no deviating city | uniform on four columns, elevation-varying on two |

The asr shift does not reproduce on adhan 4.4.6 with an independently validated coordinate solve.
Every column moves less than 0.7 min against the record, and the 0.5 min rounding degeneracy
covers most of that, so the rebuilt regime is the recorded regime at this surface's resolution. No
national margin-regime shift of the size O1k-M1 reported is present in the data.

## Honest negatives

- December 2026: not published, three dated 404s, the portal index lists October and November only.
- No coordinates and no region fields in the payload. Points here are fit anchors, not the
  ministry's own city points; longitude is solid (median 0.01 deg from Wikidata), latitude carries
  a 0.2 deg median offset.
- The rounding rule is not separable from the additive margin, so absolute margins are known only
  to plus or minus 0.5 min.
- The elevation model behind the horizon term is not recovered. The correlation and the monotone
  DEM bands establish the cause; the portal's own altitude table or coefficient is not published.
- 2024 and 2025: absent from this portal, still Wayback-only.
- Wikidata supplied a coordinate or an elevation for only part of the list (98 of 190 names
  matched, 64 with an elevation). The remaining names are matched by the fit itself, not by an
  external gazetteer.

## Per-city table

Scores at the single national margin set, each city at its solved point. `within/366` counts cells
inside 1 minute over both months; the six column cells give within/cells per column. `bracket` is
maghrib minus sunrise in minutes, the horizon term; `DEM` is the nearest-place elevation.

| c | city | lat | lon | within/366 | exact | worst | worst at | fajr | sunrise | dhuhr | asr | maghrib | isha | DEM m | bracket |
|---:|---|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | الرباط | 33.93 | -6.85 | 244 | 193 | 2.40 | 2026-10-20 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 121 | 6.69 |
| 2 | الخميسات | 33.57 | -6.09 | 366 | 257 | 0.94 | 2026-11-16 sunrise | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 709 | 9.39 |
| 3 | تيفلت | 33.69 | -6.34 | 366 | 265 | 0.87 | 2026-10-21 sunrise | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 214 | 9.47 |
| 4 | الرماني | 33.30 | -6.60 | 366 | 293 | 0.77 | 2026-10-03 asr | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 718 | 9.78 |
| 5 | والماس | 33.10 | -6.03 | 262 | 188 | 2.31 | 2026-10-12 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 18/61 | 61/61 | 897 | 13.27 |
| 6 | بوزنيقة | 33.68 | -7.15 | 244 | 184 | 2.67 | 2026-10-16 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 197 | 6.23 |
| 7 | القنيطرة | 34.18 | -6.60 | 278 | 195 | 1.84 | 2026-10-13 sunrise | 61/61 | 11/61 | 61/61 | 61/61 | 23/61 | 61/61 | 73 | 7.76 |
| 8 | سيدي قاسم | 34.00 | -5.72 | 366 | 265 | 0.92 | 2026-10-27 sunrise | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 471 | 9.41 |
| 9 | سيدي يحيى الغرب | 34.19 | -6.33 | 264 | 206 | 1.85 | 2026-10-18 sunrise | 61/61 | 6/61 | 61/61 | 61/61 | 14/61 | 61/61 | 39 | 7.59 |
| 10 | سيدي سليمان | 34.20 | -5.94 | 244 | 179 | 2.52 | 2026-10-25 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 73 | 6.47 |
| 11 | سوق أربعاء الغرب | 34.19 | -6.33 | 244 | 206 | 2.52 | 2026-10-22 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 39 | 6.26 |
| 12 | عرباوة | 34.77 | -5.92 | 261 | 191 | 2.02 | 2026-10-26 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 17/61 | 61/61 | 207 | 7.53 |
| 13 | مولاي بوسلهام | 34.73 | -6.30 | 244 | 198 | 2.52 | 2026-11-09 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 11 | 6.21 |
| 14 | طنجة | 35.64 | -5.83 | 335 | 227 | 1.30 | 2026-10-10 sunrise | 61/61 | 47/61 | 61/61 | 61/61 | 44/61 | 61/61 | 60 | 8.64 |
| 15 | تطوان | 35.40 | -5.35 | 366 | 290 | 0.87 | 2026-10-04 asr | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 535 | 10.23 |
| 16 | العرائش | 35.03 | -6.13 | 244 | 191 | 2.70 | 2026-11-10 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 106 | 6.24 |
| 17 | أصيلة | 35.34 | -6.07 | 244 | 204 | 2.35 | 2026-11-08 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 107 | 6.68 |
| 18 | شفشاون | 34.83 | -5.29 | 264 | 187 | 2.13 | 2026-11-22 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 20/61 | 61/61 | 540 | 13.01 |
| 19 | مرتيل | 35.57 | -5.30 | 244 | 206 | 2.39 | 2026-10-16 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 24 | 6.56 |
| 20 | المضيق | 35.58 | -5.34 | 244 | 200 | 2.50 | 2026-10-18 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 7 | 6.40 |
| 21 | القصر الكبير | 34.87 | -5.90 | 246 | 195 | 2.30 | 2026-10-14 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 2/61 | 61/61 | 165 | 7.04 |
| 22 | القصر الصغير | 35.72 | -5.58 | 244 | 205 | 2.09 | 2026-10-09 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 303 | 7.08 |
| 23 | الحسيمة | 35.09 | -3.92 | 266 | 189 | 2.00 | 2026-10-31 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 22/61 | 61/61 | 306 | 7.57 |
| 24 | سبتة | 35.56 | -5.35 | 366 | 283 | 0.90 | 2026-11-29 asr | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 8 | 9.79 |
| 25 | الفنيدق | 35.73 | -5.35 | 301 | 196 | 1.67 | 2026-10-07 sunrise | 61/61 | 17/61 | 61/61 | 61/61 | 40/61 | 61/61 | 18 | 8.15 |
| 26 | الجبهة | 35.06 | -4.65 | 302 | 192 | 1.74 | 2026-10-26 sunrise | 61/61 | 19/61 | 61/61 | 61/61 | 39/61 | 61/61 | 896 | 8.12 |
| 27 | واد لاو | 35.35 | -5.10 | 244 | 191 | 2.47 | 2026-10-05 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 446 | 6.43 |
| 28 | باب برد | 34.68 | -4.86 | 244 | 180 | 2.23 | 2026-10-01 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 573 | 13.44 |
| 29 | وزان | 34.55 | -5.59 | 366 | 268 | 0.95 | 2026-11-17 sunrise | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 70 | 11.07 |
| 30 | بوسكور | 34.55 | -3.60 | 366 | 269 | 0.99 | 2026-10-30 sunrise | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 1172 | 9.35 |
| 31 | وجدة | 34.43 | -1.92 | 366 | 260 | 0.98 | 2026-11-30 magrib | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 951 | 11.15 |
| 32 | بركان | 34.76 | -2.35 | 260 | 197 | 1.95 | 2026-10-23 sunrise | 61/61 | 3/61 | 61/61 | 61/61 | 13/61 | 61/61 | 747 | 7.59 |
| 33 | فكيك | 31.83 | -1.26 | 336 | 227 | 1.43 | 2026-11-24 sunrise | 61/61 | 35/61 | 61/61 | 61/61 | 57/61 | 61/61 | 865 | 11.73 |
| 34 | بوعرفة | 32.31 | -1.97 | 326 | 219 | 1.43 | 2026-11-30 sunrise | 61/61 | 39/61 | 61/61 | 61/61 | 43/61 | 61/61 | 1169 | 11.96 |
| 35 | كرسيف | 34.03 | -3.35 | 357 | 249 | 1.12 | 2026-10-19 sunrise | 61/61 | 52/61 | 61/61 | 61/61 | 61/61 | 61/61 | 426 | 9.21 |
| 36 | جرادة | 33.97 | -2.15 | 283 | 175 | 1.70 | 2026-11-22 sunrise | 61/61 | 18/61 | 61/61 | 61/61 | 21/61 | 61/61 | 919 | 12.62 |
| 37 | عين الشعير | 31.96 | -2.54 | 331 | 228 | 1.48 | 2026-10-03 sunrise | 61/61 | 33/61 | 61/61 | 61/61 | 54/61 | 61/61 | 982 | 11.81 |
| 38 | تاوريرت | 34.09 | -2.86 | 303 | 177 | 1.56 | 2026-10-11 sunrise | 61/61 | 26/61 | 61/61 | 61/61 | 33/61 | 61/61 | 740 | 12.31 |
| 39 | الناظور | 35.00 | -2.92 | 262 | 187 | 2.04 | 2026-10-20 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 18/61 | 61/61 | 174 | 7.48 |
| 40 | مليلية | 35.22 | -2.97 | 244 | 199 | 2.49 | 2026-10-29 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 550 | 6.46 |
| 41 | دبدو | 33.68 | -3.04 | 276 | 186 | 2.01 | 2026-10-07 sunrise | 61/61 | 3/61 | 61/61 | 60/61 | 30/61 | 61/61 | 1256 | 12.74 |
| 42 | سلوان | 34.93 | -2.92 | 322 | 212 | 1.45 | 2026-11-03 sunrise | 61/61 | 34/61 | 61/61 | 61/61 | 44/61 | 61/61 | 186 | 8.61 |
| 43 | بني أنصار | 35.13 | -2.90 | 271 | 187 | 1.97 | 2026-10-20 sunrise | 61/61 | 1/61 | 61/61 | 61/61 | 26/61 | 61/61 | 7 | 7.65 |
| 44 | فرخانة | 35.11 | -3.01 | 258 | 202 | 1.87 | 2026-10-18 magrib | 61/61 | 8/61 | 61/61 | 61/61 | 6/61 | 61/61 | 196 | 7.54 |
| 45 | تالسينت | 32.21 | -3.42 | 244 | 179 | 2.48 | 2026-11-27 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 1064 | 13.96 |
| 46 | تندرارة | 32.65 | -2.03 | 242 | 173 | 2.73 | 2026-10-06 sunrise | 61/61 | 0/61 | 61/61 | 58/61 | 1/61 | 61/61 | 1265 | 13.88 |
| 47 | العيون الشرقية | 34.38 | -2.53 | 366 | 292 | 0.81 | 2026-11-26 sunrise | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 1140 | 10.70 |
| 48 | بني ادرار | 34.59 | -2.01 | 366 | 304 | 0.83 | 2026-11-29 asr | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 669 | 10.00 |
| 49 | السعيدية | 35.08 | -2.28 | 244 | 203 | 2.45 | 2026-10-29 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 3 | 6.36 |
| 50 | رأس الماء | 35.02 | -2.40 | 244 | 188 | 2.67 | 2026-11-10 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 68 | 6.32 |
| 51 | تافوغالت | 34.51 | -2.38 | 319 | 204 | 1.38 | 2026-10-09 sunrise | 61/61 | 36/61 | 61/61 | 61/61 | 39/61 | 61/61 | 679 | 11.98 |
| 52 | فزوان | 34.63 | -2.19 | 353 | 236 | 1.13 | 2026-11-22 magrib | 61/61 | 54/61 | 61/61 | 61/61 | 55/61 | 61/61 | 665 | 11.46 |
| 53 | أحفير | 34.78 | -2.10 | 311 | 211 | 1.44 | 2026-11-14 sunrise | 61/61 | 32/61 | 61/61 | 61/61 | 35/61 | 61/61 | 576 | 8.46 |
| 54 | زايو | 34.71 | -2.72 | 366 | 302 | 0.71 | 2026-10-02 isha | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 475 | 10.59 |
| 55 | دريوش | 34.75 | -3.36 | 366 | 293 | 0.75 | 2026-10-18 asr | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 674 | 10.50 |
| 56 | بني تجيت | 32.04 | -3.47 | 244 | 192 | 2.43 | 2026-11-26 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 907 | 13.75 |
| 57 | بوعنان | 31.82 | -3.07 | 343 | 228 | 1.36 | 2026-11-26 sunrise | 61/61 | 42/61 | 61/61 | 61/61 | 57/61 | 61/61 | 770 | 11.61 |
| 58 | الدار البيضاء | 33.39 | -7.65 | 257 | 184 | 2.05 | 2026-11-16 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 13/61 | 61/61 | 185 | 7.41 |
| 59 | المحمدية | 33.58 | -7.38 | 244 | 187 | 2.67 | 2026-11-15 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 122 | 6.19 |
| 60 | بن سليمان | 33.45 | -7.11 | 311 | 196 | 1.57 | 2026-10-14 sunrise | 61/61 | 23/61 | 61/61 | 61/61 | 44/61 | 61/61 | 302 | 8.36 |
| 61 | سطات | 32.83 | -7.61 | 356 | 233 | 1.15 | 2026-11-05 sunrise | 61/61 | 51/61 | 61/61 | 61/61 | 61/61 | 61/61 | 538 | 9.14 |
| 62 | الكارة | 33.09 | -7.26 | 361 | 264 | 1.05 | 2026-10-25 magrib | 61/61 | 61/61 | 61/61 | 61/61 | 56/61 | 61/61 | 627 | 9.29 |
| 63 | البروج | 32.33 | -7.19 | 366 | 288 | 0.75 | 2026-10-06 sunrise | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 341 | 9.87 |
| 64 | ابن أحمد | 32.85 | -7.28 | 366 | 284 | 0.85 | 2026-11-22 sunrise | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 676 | 10.69 |
| 65 | برشيد | 33.06 | -7.59 | 275 | 197 | 1.79 | 2026-10-28 sunrise | 61/61 | 13/61 | 61/61 | 61/61 | 18/61 | 61/61 | 274 | 7.72 |
| 66 | الجديدة | 33.14 | -8.54 | 244 | 207 | 2.49 | 2026-11-22 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 57 | 6.23 |
| 67 | أزمور | 33.20 | -8.35 | 245 | 196 | 2.14 | 2026-10-20 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 1/61 | 61/61 | 115 | 7.08 |
| 68 | سيدي بنور | 32.54 | -8.42 | 259 | 180 | 2.09 | 2026-11-03 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 15/61 | 61/61 | 218 | 7.36 |
| 69 | خميس الزمامرة | 32.44 | -8.72 | 254 | 198 | 2.04 | 2026-11-03 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 10/61 | 61/61 | 188 | 7.29 |
| 70 | خنيفرة | 32.62 | -5.67 | 313 | 184 | 1.56 | 2026-10-02 sunrise | 61/61 | 30/61 | 61/61 | 61/61 | 39/61 | 61/61 | 1794 | 12.14 |
| 71 | مولاي بوعزة | 32.96 | -6.19 | 326 | 207 | 1.31 | 2026-11-26 sunrise | 61/61 | 42/61 | 61/61 | 61/61 | 40/61 | 61/61 | 953 | 11.86 |
| 72 | زاوية أحنصال | 31.38 | -6.10 | 244 | 172 | 4.28 | 2026-10-01 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 1596 | 16.74 |
| 73 | بني ملال | 31.98 | -6.35 | 268 | 185 | 1.86 | 2026-11-26 sunrise | 61/61 | 8/61 | 61/61 | 61/61 | 16/61 | 61/61 | 1330 | 12.82 |
| 74 | أزيلال | 31.60 | -6.59 | 244 | 185 | 3.00 | 2026-11-26 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 1718 | 14.58 |
| 75 | الفقيه بنصالح | 32.33 | -6.69 | 366 | 289 | 0.75 | 2026-10-06 sunrise | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 406 | 9.89 |
| 76 | دمنات | 31.39 | -7.04 | 242 | 181 | 3.05 | 2026-10-01 sunrise | 61/61 | 0/61 | 61/61 | 59/61 | 0/61 | 61/61 | 1904 | 14.61 |
| 77 | القصيبة | 32.28 | -6.07 | 251 | 186 | 2.40 | 2026-10-01 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 7/61 | 61/61 | 1027 | 13.52 |
| 78 | قصبة تادلة | 32.36 | -6.30 | 366 | 295 | 0.78 | 2026-10-03 fajr | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 670 | 9.98 |
| 79 | خريبكة | 32.67 | -6.90 | 344 | 215 | 1.17 | 2026-10-08 magrib | 61/61 | 50/61 | 61/61 | 61/61 | 50/61 | 61/61 | 581 | 11.65 |
| 80 | وادي زم | 32.58 | -6.59 | 338 | 219 | 1.33 | 2026-11-24 sunrise | 61/61 | 43/61 | 61/61 | 61/61 | 51/61 | 61/61 | 488 | 11.75 |
| 81 | فاس | 33.85 | -5.04 | 366 | 274 | 0.87 | 2026-10-11 magrib | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 668 | 9.53 |
| 82 | صفرو | 33.54 | -4.85 | 296 | 190 | 1.66 | 2026-10-09 sunrise | 61/61 | 21/61 | 61/61 | 61/61 | 31/61 | 61/61 | 1692 | 12.33 |
| 83 | مولاي يعقوب | 33.90 | -5.17 | 357 | 234 | 1.14 | 2026-11-04 sunrise | 61/61 | 52/61 | 61/61 | 61/61 | 61/61 | 61/61 | 576 | 9.12 |
| 84 | بولمان | 32.95 | -4.76 | 242 | 168 | 4.58 | 2026-11-26 sunrise | 61/61 | 0/61 | 61/61 | 59/61 | 0/61 | 61/61 | 1508 | 17.10 |
| 85 | ميسور | 32.77 | -4.04 | 330 | 222 | 1.46 | 2026-10-04 sunrise | 61/61 | 32/61 | 61/61 | 61/61 | 54/61 | 61/61 | 1130 | 11.83 |
| 86 | رباط الخير | 33.52 | -4.40 | 244 | 179 | 2.73 | 2026-11-22 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 1222 | 14.34 |
| 87 | المنزل بني يازغة | 33.53 | -4.57 | 281 | 192 | 1.86 | 2026-10-04 sunrise | 61/61 | 8/61 | 61/61 | 61/61 | 29/61 | 61/61 | 1026 | 12.63 |
| 88 | إموزار كندر | 33.40 | -5.04 | 244 | 178 | 2.88 | 2026-11-24 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 1638 | 14.31 |
| 89 | تازة | 33.92 | -4.04 | 337 | 204 | 1.48 | 2026-11-17 sunrise | 61/61 | 35/61 | 61/61 | 61/61 | 58/61 | 61/61 | 899 | 11.87 |
| 90 | تاونات | 34.22 | -4.63 | 351 | 227 | 1.08 | 2026-10-05 magrib | 61/61 | 57/61 | 61/61 | 61/61 | 50/61 | 61/61 | 277 | 11.47 |
| 91 | أكنول | 34.37 | -3.86 | 244 | 184 | 2.46 | 2026-11-21 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 952 | 13.97 |
| 92 | تيزي وسلي | 34.40 | -3.82 | 243 | 173 | 2.76 | 2026-11-29 sunrise | 61/61 | 0/61 | 61/61 | 60/61 | 0/61 | 61/61 | 787 | 14.12 |
| 93 | بورد | 34.43 | -4.10 | 324 | 216 | 1.41 | 2026-10-08 sunrise | 61/61 | 37/61 | 61/61 | 61/61 | 43/61 | 61/61 | 943 | 11.92 |
| 94 | تاهلة | 33.87 | -4.42 | 366 | 295 | 0.84 | 2026-10-02 asr | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 1098 | 10.10 |
| 95 | تيسة | 34.13 | -4.67 | 324 | 209 | 1.49 | 2026-11-15 sunrise | 61/61 | 32/61 | 61/61 | 61/61 | 48/61 | 61/61 | 226 | 8.58 |
| 96 | قرية با محمد | 34.21 | -5.22 | 291 | 199 | 1.67 | 2026-11-07 sunrise | 61/61 | 20/61 | 61/61 | 61/61 | 27/61 | 61/61 | 282 | 8.03 |
| 97 | كتامة | 34.50 | -4.61 | 244 | 181 | 3.18 | 2026-10-01 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 267 | 15.27 |
| 98 | واد أمليل | 34.03 | -4.30 | 364 | 264 | 1.03 | 2026-10-26 magrib | 61/61 | 61/61 | 61/61 | 61/61 | 59/61 | 61/61 | 700 | 9.31 |
| 99 | مكناس | 33.62 | -5.59 | 366 | 305 | 0.86 | 2026-11-25 asr | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 991 | 10.32 |
| 100 | يفرن | 33.10 | -5.10 | 243 | 170 | 2.55 | 2026-10-05 sunrise | 61/61 | 0/61 | 61/61 | 60/61 | 0/61 | 61/61 | 1916 | 13.96 |
| 101 | الحاجب | 33.40 | -5.36 | 257 | 177 | 1.98 | 2026-10-04 sunrise | 61/61 | 2/61 | 61/61 | 61/61 | 11/61 | 61/61 | 1068 | 13.08 |
| 102 | زرهون | 33.74 | -5.55 | 339 | 217 | 1.46 | 2026-10-02 sunrise | 61/61 | 38/61 | 61/61 | 60/61 | 58/61 | 61/61 | 717 | 11.67 |
| 103 | آزرو | 33.11 | -5.26 | 243 | 188 | 2.70 | 2026-11-28 sunrise | 61/61 | 0/61 | 61/61 | 60/61 | 0/61 | 61/61 | 1715 | 14.01 |
| 104 | مراكش | 31.39 | -8.05 | 366 | 304 | 0.76 | 2026-11-28 isha | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 722 | 10.17 |
| 105 | قلعة السراغنة | 31.82 | -7.40 | 366 | 286 | 0.80 | 2026-10-04 asr | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 616 | 9.95 |
| 106 | الصويرة | 31.44 | -9.80 | 244 | 208 | 2.34 | 2026-10-05 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 67 | 6.56 |
| 107 | شيشاوة | 31.34 | -8.79 | 366 | 279 | 0.82 | 2026-10-01 magrib | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 584 | 9.63 |
| 108 | بنجرير | 31.98 | -7.97 | 366 | 301 | 0.72 | 2026-10-03 asr | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 451 | 9.89 |
| 109 | الرحامنة | 32.26 | -7.90 | 365 | 252 | 1.02 | 2026-10-01 magrib | 61/61 | 61/61 | 61/61 | 61/61 | 60/61 | 61/61 | 499 | 11.13 |
| 110 | تمنار | 30.80 | -9.67 | 360 | 250 | 1.07 | 2026-10-27 sunrise | 61/61 | 55/61 | 61/61 | 61/61 | 61/61 | 61/61 | 598 | 9.21 |
| 111 | آسفي | 32.12 | -9.28 | 244 | 193 | 2.25 | 2026-11-10 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 65 | 6.78 |
| 112 | الوليدية | 32.63 | -9.05 | 244 | 203 | 2.49 | 2026-11-12 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 114 | 6.33 |
| 113 | اليوسفية | 32.01 | -8.55 | 366 | 258 | 1.00 | 2026-11-25 magrib | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 400 | 9.30 |
| 114 | تسلطانت | 31.36 | -7.94 | 366 | 306 | 0.75 | 2026-10-02 asr | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 885 | 10.32 |
| 115 | تامصلوحت | 31.26 | -8.10 | 366 | 314 | 0.75 | 2026-10-04 asr | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 872 | 10.31 |
| 116 | قطارة | 31.59 | -8.15 | 366 | 300 | 0.79 | 2026-11-30 fajr | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 434 | 10.09 |
| 117 | أكادير | 30.23 | -9.58 | 308 | 197 | 1.50 | 2026-11-01 magrib | 61/61 | 31/61 | 61/61 | 61/61 | 33/61 | 61/61 | 40 | 8.27 |
| 118 | تارودانت | 30.30 | -8.82 | 301 | 200 | 1.54 | 2026-10-25 sunrise | 61/61 | 29/61 | 61/61 | 61/61 | 28/61 | 61/61 | 864 | 8.14 |
| 119 | تزنيت | 29.52 | -9.76 | 297 | 201 | 1.53 | 2026-11-09 magrib | 61/61 | 28/61 | 61/61 | 61/61 | 25/61 | 61/61 | 451 | 8.15 |
| 120 | إغرم | 29.72 | -8.47 | 242 | 175 | 3.41 | 2026-11-27 sunrise | 61/61 | 0/61 | 61/61 | 59/61 | 0/61 | 61/61 | 971 | 15.32 |
| 121 | تالوين | 30.21 | -7.92 | 244 | 180 | 2.41 | 2026-10-03 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 1735 | 13.73 |
| 122 | تافراوت | 29.42 | -9.01 | 244 | 189 | 2.78 | 2026-11-28 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 1205 | 14.06 |
| 123 | طاطا | 29.49 | -8.01 | 366 | 291 | 0.88 | 2026-11-25 asr | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 544 | 10.59 |
| 124 | أقا | 29.05 | -8.28 | 248 | 173 | 2.58 | 2026-10-05 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 4/61 | 61/61 | 416 | 13.66 |
| 125 | فم لحصن | 28.73 | -8.88 | 320 | 190 | 1.43 | 2026-10-06 sunrise | 61/61 | 33/61 | 61/61 | 61/61 | 43/61 | 61/61 | 345 | 11.99 |
| 126 | بويكرة | 30.10 | -9.35 | 244 | 191 | 2.35 | 2026-10-24 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 151 | 6.81 |
| 127 | أولاد تايمة | 30.21 | -9.22 | 296 | 205 | 1.59 | 2026-10-14 sunrise | 61/61 | 24/61 | 61/61 | 61/61 | 28/61 | 61/61 | 238 | 8.09 |
| 128 | الرشيدية | 31.59 | -4.44 | 320 | 205 | 1.43 | 2026-10-17 sunrise | 61/61 | 36/61 | 61/61 | 61/61 | 40/61 | 61/61 | 838 | 11.96 |
| 129 | الريصاني | 31.00 | -4.29 | 309 | 205 | 1.68 | 2026-11-25 sunrise | 61/61 | 24/61 | 61/61 | 61/61 | 41/61 | 61/61 | 779 | 12.14 |
| 130 | أرفود | 31.11 | -4.26 | 320 | 206 | 1.61 | 2026-10-07 sunrise | 61/61 | 27/61 | 61/61 | 61/61 | 49/61 | 61/61 | 743 | 12.03 |
| 131 | تنديت | 33.43 | -3.61 | 363 | 237 | 1.03 | 2026-11-20 magrib | 61/61 | 61/61 | 61/61 | 61/61 | 58/61 | 61/61 | 862 | 11.24 |
| 132 | كلميمة | 31.44 | -4.94 | 305 | 194 | 1.58 | 2026-11-29 sunrise | 61/61 | 27/61 | 61/61 | 61/61 | 34/61 | 61/61 | 1109 | 12.24 |
| 133 | إملشيل | 31.74 | -5.60 | 243 | 173 | 3.75 | 2026-11-23 sunrise | 61/61 | 0/61 | 61/61 | 60/61 | 0/61 | 61/61 | 1749 | 16.20 |
| 134 | تنجداد | 31.19 | -5.05 | 318 | 209 | 1.66 | 2026-10-02 sunrise | 61/61 | 25/61 | 61/61 | 61/61 | 49/61 | 61/61 | 895 | 12.03 |
| 135 | الريش | 31.91 | -4.47 | 247 | 181 | 2.31 | 2026-11-25 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 3/61 | 61/61 | 1046 | 13.52 |
| 136 | ميدلت | 32.38 | -4.78 | 244 | 189 | 3.00 | 2026-10-08 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 2284 | 14.60 |
| 137 | زاكورة | 30.08 | -5.85 | 365 | 265 | 1.05 | 2026-11-25 sunrise | 61/61 | 60/61 | 61/61 | 61/61 | 61/61 | 61/61 | 763 | 11.10 |
| 138 | ورزازات | 30.62 | -6.92 | 264 | 187 | 1.95 | 2026-10-02 sunrise | 61/61 | 6/61 | 61/61 | 61/61 | 14/61 | 61/61 | 1525 | 12.90 |
| 139 | تنغير | 31.12 | -5.55 | 245 | 176 | 2.65 | 2026-10-02 sunrise | 61/61 | 0/61 | 61/61 | 60/61 | 2/61 | 61/61 | 1921 | 13.85 |
| 140 | هسكورة | 30.74 | -6.57 | 271 | 179 | 2.10 | 2026-11-13 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 27/61 | 61/61 | 1143 | 12.97 |
| 141 | قلعة مكونة | 30.85 | -6.13 | 244 | 178 | 2.50 | 2026-10-03 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 1369 | 13.88 |
| 142 | أكدز | 30.40 | -6.44 | 244 | 181 | 2.71 | 2026-11-27 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 1279 | 14.17 |
| 143 | بومالن دادس | 31.02 | -6.03 | 244 | 180 | 2.90 | 2026-10-01 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 1566 | 14.18 |
| 144 | النيف | 30.87 | -5.17 | 346 | 222 | 1.15 | 2026-11-25 magrib | 61/61 | 48/61 | 61/61 | 61/61 | 54/61 | 61/61 | 790 | 11.56 |
| 145 | أسول | 31.47 | -5.17 | 244 | 168 | 4.60 | 2026-11-22 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 1079 | 17.54 |
| 146 | أمسمرير | 31.34 | -5.83 | 244 | 185 | 3.76 | 2026-11-30 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 1522 | 15.86 |
| 147 | تازارين | 30.57 | -5.58 | 366 | 283 | 0.82 | 2026-10-14 magrib | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 841 | 9.62 |
| 148 | سيدي إفني | 29.20 | -10.17 | 320 | 205 | 1.45 | 2026-11-30 sunrise | 61/61 | 31/61 | 61/61 | 61/61 | 45/61 | 61/61 | 422 | 8.48 |
| 149 | كلميم | 28.78 | -10.08 | 366 | 314 | 0.72 | 2026-10-01 asr | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 247 | 10.34 |
| 150 | أسا | 28.34 | -9.44 | 293 | 186 | 1.72 | 2026-11-14 sunrise | 61/61 | 15/61 | 61/61 | 61/61 | 34/61 | 61/61 | 207 | 7.99 |
| 151 | الزاك | 27.81 | -9.32 | 340 | 229 | 1.25 | 2026-11-06 magrib | 61/61 | 49/61 | 61/61 | 61/61 | 47/61 | 61/61 | 410 | 8.76 |
| 152 | طانطان | 28.30 | -11.10 | 310 | 203 | 1.64 | 2026-10-17 sunrise | 61/61 | 22/61 | 61/61 | 61/61 | 44/61 | 61/61 | 238 | 8.26 |
| 153 | بويزكارن | 28.95 | -9.76 | 366 | 276 | 0.80 | 2026-11-26 asr | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 345 | 9.91 |
| 154 | المحبس | 27.19 | -9.07 | 354 | 251 | 1.15 | 2026-11-06 magrib | 61/61 | 55/61 | 61/61 | 61/61 | 55/61 | 61/61 | 410 | 9.02 |
| 155 | لمسيد | 27.76 | -10.82 | 362 | 245 | 1.03 | 2026-10-29 magrib | 61/61 | 61/61 | 61/61 | 61/61 | 57/61 | 61/61 | 268 | 9.19 |
| 156 | العيون | 27.09 | -13.26 | 244 | 205 | 2.54 | 2026-10-16 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 43 | 6.14 |
| 157 | السمارة | 26.57 | -11.67 | 277 | 188 | 1.79 | 2026-11-01 sunrise | 61/61 | 13/61 | 61/61 | 61/61 | 20/61 | 61/61 | 188 | 7.89 |
| 158 | بوجدور | 25.99 | -14.55 | 244 | 191 | 2.69 | 2026-11-16 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 419 | 5.99 |
| 159 | طرفاية | 27.76 | -12.92 | 244 | 181 | 2.80 | 2026-10-22 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 43 | 5.92 |
| 160 | تفاريتي | 25.92 | -10.58 | 339 | 214 | 1.43 | 2026-11-23 sunrise | 61/61 | 39/61 | 61/61 | 61/61 | 56/61 | 61/61 | 188 | 11.80 |
| 161 | بوكراع | 26.23 | -12.84 | 294 | 201 | 1.64 | 2026-10-27 sunrise | 61/61 | 23/61 | 61/61 | 61/61 | 27/61 | 61/61 | 188 | 8.02 |
| 162 | كلتة زمور | 24.97 | -12.35 | 295 | 177 | 1.77 | 2026-10-18 sunrise | 61/61 | 14/61 | 61/61 | 61/61 | 37/61 | 61/61 | 419 | 7.98 |
| 163 | أمكالة | 25.97 | -11.38 | 279 | 185 | 1.80 | 2026-11-25 sunrise | 61/61 | 13/61 | 61/61 | 61/61 | 22/61 | 61/61 | 188 | 7.85 |
| 164 | أخفنير | 27.97 | -12.07 | 311 | 209 | 1.47 | 2026-10-11 sunrise | 61/61 | 30/61 | 61/61 | 61/61 | 37/61 | 61/61 | 15 | 8.32 |
| 165 | الداخلة | 23.63 | -16.01 | 244 | 200 | 2.27 | 2026-10-20 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 118 | 6.69 |
| 166 | الكويرة | 20.67 | -17.10 | 244 | 192 | 2.87 | 2026-11-29 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 202 | 5.85 |
| 167 | أوسرد | 22.41 | -14.32 | 285 | 201 | 1.67 | 2026-10-11 sunrise | 61/61 | 21/61 | 61/61 | 61/61 | 20/61 | 61/61 | 306 | 7.87 |
| 168 | بئر كندوز | 21.42 | -16.47 | 277 | 192 | 1.82 | 2026-11-01 sunrise | 61/61 | 11/61 | 61/61 | 61/61 | 22/61 | 61/61 | 202 | 7.73 |
| 169 | بئر أنزاران | 23.72 | -14.55 | 324 | 220 | 1.33 | 2026-10-12 magrib | 61/61 | 45/61 | 61/61 | 61/61 | 35/61 | 61/61 | 346 | 8.61 |
| 301 | خميس سيدي عبد الجليل | 33.91 | -4.59 | 366 | 300 | 0.72 | 2026-10-09 asr | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 676 | 10.47 |
| 302 | أولاد عياد | 33.93 | -4.60 | 315 | 214 | 1.45 | 2026-10-15 sunrise | 61/61 | 31/61 | 61/61 | 61/61 | 40/61 | 61/61 | 585 | 8.46 |
| 304 | مطماطة | 33.98 | -4.57 | 244 | 205 | 2.12 | 2026-10-13 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 535 | 7.04 |
| 305 | إيمنتانوت | 30.93 | -8.85 | 332 | 213 | 1.31 | 2026-11-28 sunrise | 61/61 | 41/61 | 61/61 | 61/61 | 47/61 | 61/61 | 1848 | 11.77 |
| 306 | سيدي غانم | 30.96 | -9.44 | 328 | 199 | 1.53 | 2026-10-01 sunrise | 61/61 | 38/61 | 61/61 | 61/61 | 46/61 | 61/61 | 715 | 11.90 |
| 307 | تفنتان | 31.14 | -7.54 | 350 | 240 | 1.13 | 2026-10-04 magrib | 61/61 | 55/61 | 61/61 | 61/61 | 51/61 | 61/61 | 1867 | 8.97 |
| 308 | آيت القاق | 30.80 | -7.80 | 239 | 167 | 4.48 | 2026-11-30 sunrise | 61/61 | 0/61 | 61/61 | 56/61 | 0/61 | 61/61 | 1885 | 16.96 |
| 309 | أكدال أملشيل | 31.66 | -5.51 | 244 | 178 | 4.00 | 2026-10-01 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 1749 | 16.17 |
| 310 | اكودال املشيل ميدلت | 31.70 | -5.51 | 267 | 181 | 2.05 | 2026-11-17 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 23/61 | 61/61 | 1749 | 12.91 |
| 311 | أكايوار | 30.93 | -7.83 | 268 | 185 | 2.10 | 2026-10-01 sunrise | 61/61 | 1/61 | 61/61 | 60/61 | 24/61 | 61/61 | 1840 | 12.77 |
| 312 | عين العودة | 33.71 | -6.80 | 265 | 208 | 1.80 | 2026-10-15 sunrise | 61/61 | 12/61 | 61/61 | 61/61 | 9/61 | 61/61 | 333 | 7.60 |
| 313 | أسكين | 31.04 | -7.79 | 290 | 193 | 1.81 | 2026-11-05 sunrise | 61/61 | 11/61 | 61/61 | 61/61 | 35/61 | 61/61 | 2174 | 12.49 |
| 314 | آيت ورير | 31.32 | -7.63 | 366 | 278 | 0.82 | 2026-11-28 magrib | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 61/61 | 2215 | 10.74 |
| 315 | زاوية مولاي ابراهيم | 30.94 | -7.97 | 271 | 183 | 1.95 | 2026-10-11 sunrise | 61/61 | 3/61 | 61/61 | 61/61 | 24/61 | 61/61 | 2072 | 12.81 |
| 316 | تولكولت | 30.90 | -9.08 | 272 | 191 | 2.10 | 2026-10-01 sunrise | 61/61 | 3/61 | 61/61 | 61/61 | 25/61 | 61/61 | 1015 | 12.76 |
| 317 | إيكس | 30.53 | -7.85 | 242 | 177 | 4.26 | 2026-10-03 sunrise | 61/61 | 0/61 | 61/61 | 59/61 | 0/61 | 61/61 | 1360 | 16.63 |
| 318 | كرس | 31.17 | -7.61 | 244 | 168 | 3.40 | 2026-10-06 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 1965 | 15.48 |
| 319 | تيسنت | 29.65 | -7.32 | 248 | 192 | 2.48 | 2026-11-17 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 4/61 | 61/61 | 475 | 13.70 |
| 320 | فم زكيد | 29.75 | -6.85 | 244 | 181 | 2.45 | 2026-11-19 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 0/61 | 61/61 | 475 | 13.84 |
| 321 | قصر إيش | 32.25 | -1.04 | 257 | 185 | 2.31 | 2026-11-16 sunrise | 61/61 | 0/61 | 61/61 | 61/61 | 13/61 | 61/61 | 869 | 13.37 |
| 322 | إيمين ثلاث | 31.33 | -6.55 | 315 | 206 | 1.65 | 2026-11-30 sunrise | 61/61 | 23/61 | 61/61 | 61/61 | 48/61 | 61/61 | 1709 | 12.08 |
