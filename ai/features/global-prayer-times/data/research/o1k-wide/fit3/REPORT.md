# Fit3 - tonight's new surfaces

Adhan 4.4.6, `TZ=<zone> node`, second resolution then explicit rounding, no real clock,
no network, no subagents. Shared machinery: `lib.mjs` (copied from `fit1/lib.mjs`,
`params()`/`solarNoonSunset` added). One script + one JSON per country. All times in the
publisher's own zone; all margins in minutes; "exact/within1/worst" = days matching the
printed column at 0 / <=1 / max |diff|.

---

## Korea - KMF Seoul (kr)

`kr.js` -> `kr.json`. Source `koreajapan/data/kmf-seoul-2026-2027.json`, 365 rows
2026-02-01..2027-01-31, Asia/Seoul, city (37.5665, 126.9780).

**Publisher statement (MWL, 37.6/127.0, ceiling) verified as-is, slip day excluded
(2027-01-27 fajr 6:19 is a typesetting slip, 6:09 intended; wave-4 flagged it too):**

| column | exact/364 | within1 | worst |
|---|---|---|---|
| fajr | 105 | 349 | 2 |
| sunrise | 31 | 355 | 2 |
| dhuhr | 17 | 363 | 2 |
| asr | 318 | 364 | 1 |
| magrib | 324 | 361 | 2 |
| isha | 294 | 361 | 2 |

Total exact 1089/2184 (49.9%), within1 2153/2184 (98.6%). The stated coords beat city
coords (1068) and masjid coords (1054) - 37.6/127.0 is genuinely the publisher's basis.

**Verdict: statement holds to +-1 minute on 98.6% of values, does not reproduce every day
to the minute.** The PDF cover states MWL verbatim ("세계무슬림연맹 방식"). Implied fajr
angle across the year: 17.65-18.23 deg (mean 17.9) - MWL confirmed in family; adhan's
ephemeris leaves a +-1 min band on fajr/sunrise/dhuhr. Free fit (floor margins):
sunrise +0 -> 332 exact, dhuhr +1 -> 346, magrib +1 -> 329, isha 17.01 +1 -> 306, fajr
18.07 +2 -> 152 (364 within1). Asr is Shafi (Hanafi worst 64).

---

## Taiwan - CMA Ramadan tables (tw)

`tw.js` -> `tw.json` (+ `tw-diag.js`). 44 rows: 1445 sample (6), 1446 sample (6), 1447
full (32). Taipei (25.0330, 121.5654), Asia/Taipei. The dispatch said 54 rows; the three
captures carry 44 dated rows.

**Derived rule, tested component by component:**

| rule | exact/44 | within1 | edition-stable? |
|---|---|---|---|
| fajr = printed sunrise - 70 | 43 | 44 | YES (6/6, 6/6, 31/32) |
| isha = printed maghrib + 90 | 43 | 43 | YES (6/6, 5/6, 32/32) |
| dhuhr = noon + 19 ceil (= +19.5/20) | 26 | 43 | YES (6/6, 5/6, 26/32) |
| maghrib = sunset + 6.7 floor | 31 | 43 | NO - 1447 only |
| asr fixed 16:06 | 8 | 43 | NO |

- **Maghrib drifts by edition**: sunset allowance ~+4.5/+5 (1445, 1446) -> ~+6/+6.5
  (1447). The +6.7 rule describes 2026 only.
- **Asr is quasi-fixed, not astronomical** (computed Shafi is ~40 min earlier, 0/44): it
  steps 16:05 -> 16:06 -> 16:07 across the Ramadan window with two anomalies
  (2026-02-20 16:07, 2024-04-09 16:04); 1445/1446 sit at 16:07 throughout.
- Anomalies carried as printed: 2026-03-04 dhuhr 12:23 (3-min step), 2025-03-29 maghrib
  +8 over sunset and isha = maghrib + 88.
- Suhoor = fajr - 20, 31/31 exact (1447).
- **The 8-city offsets moved between every edition except Hsinchu and Penghu suhoor**
  (verbatim tables in tw.json `city_offsets_minutes`): Hualien iftar +1 -> -1 -> +1,
  Hengchun suhoor 3 -> 4 -> 2. The offset tables are re-published per edition, not
  stable constants.

**Verdict for the owner's ruling: the fajr/isha/dhuhr interval rules are stable edition to
edition; the maghrib sunset-allowance and the asr constant are NOT.**

---

## Luxembourg - Shoura calendar (lu)

`lu.js` -> `lu.json`. 365 rows 2026, Luxembourg City (49.6116, 6.1319), Europe/Luxembourg.

**Stated hypothesis fajr 13.0 / isha 12.9, margin 0, best rounding:** fajr ceil 169/365,
isha nearest 125/365. Free fit: fajr 12.87 +0.5 floor -> 306 exact, 364 within1 (worst 61
= the one DST defect day); isha 12.94 +0.5 floor -> 136 exact, worst 3. Candidates at
margin 0: MWL 429/2190, ISNA 429/2190, UOIF 12/12 806/2190 - all refuted.

**Best recipe: fajr 13.0 (+0.5 min floor bias), isha 12.9 (nearest), sunrise floor +0
(277), dhuhr floor +0 (293), maghrib sunset floor +1 (153 exact - March defect, below),
asr Shafi floor +1.5 (112 exact, winter drift to +3.5).**

Verdict: the census record's 13.0/12.9 HOLDS as the pair; isha carries a seasonal wobble
(exact Jul-Dec, +1..+3 Jan-Jun, peak Apr-May) no single angle absorbs. Defects recorded:
March maghrib +6 for the whole month; 2026-03-29 maghrib AND asr left on CET (55/58 min
off - new this pass, not in the wave report); 2026-10-25 fajr unshifted (61 min, wave
report has it); 2026-10-02 dhuhr typo 13:34; 11-18/19 October-stamped keys.

---

## Mauritius - Jummah Masjid 2026 (mu)

`mu.js` -> `mu.json`. 365 rows 2026, Port Louis (-20.1667, 58.5), Indian/Mauritius (UTC+4,
no DST). The bundle's 365 rows are the Port Louis base; the regional adjustments are
publisher-stated, not per-town data.

**Base table recipe (free fit, per column):**

| column | recipe | exact/365 | within1 | worst |
|---|---|---|---|---|
| fajr.begin | 17.89 deg + 10 ceil | 300 | 361 | 2 |
| sehri | 17.89 deg + 1 floor | 296 | 360 | 2 |
| esha.begin | 17.29 deg + 5.5 floor | 282 | 365 | 1 |
| asr.begin | Hanafi + 4.5 floor | 260 | 363 | 2 |
| sunrise.start | -0.833 sunrise + 4.5 floor | 262 | 359 | 2 |
| sunset.start | -0.833 sunset + 0.5 floor | 292 | 363 | 2 |
| maghrib | sunsetStart + 6 (336) / +7 (29) | - | - | - |
| zawaal.start / .end | noon - 0.5 floor / + 9.5 floor | 321/321 | 365 | 1 |

Derived columns are fixed offsets: sehri = fajr.begin - 10 (361/365); sunrise window is 14
min fixed (365/365), sunset window 5 min fixed (365/365); zawaal window 10 min, zohr.begin
= zawaal.end + 1; asr jamaat = azaan + 15 (365/365); zohr azaan 12:45 fixed, jamaat 13:00
(13:10 on the 52 Fridays); esha jamaat - azaan 15 (337) / 10 (28); fajr jamaat - azaan 30
(295) / 25 (70). esha.begin is NOT a fixed maghrib interval (spread 68-80) - it is its own
~17.3 deg isha time + 5.5.

**Adjustment encoding: yes, fixed minutes per region tier, symmetric.** Three tiers:
+2 maghrib / -2 sehri (7 towns), +3 / -3 (8 towns), +4 / -4 (8 towns) - 3 tiers x 2
directions = the six adjustments. No per-town curves.

---

## Senegal - CERFI Dakar (sn)

`sn.js` -> `sn.json`. 2011 edition: 365 rows (sahel2 capture, "Entree en vigueur le 27
Rajab 1432"); cross-checked on the 2026-11 sheet, 30 rows (africa capture). Dakar
(14.7167, -17.4677), Africa/Dakar.

**The two-dawn convention, resolved.** The printed gap between the sheet's fajr and
"sunrise" columns is exactly 15 min on all 365 rows, and the "sunrise" column misses
astronomical sunrise by up to 51 min (0/365). **The column printed "sunrise" is not
sunrise: it is Suba, the second dawn gate.** The 2011 capture's columns_note ("Suba =
sunrise") is wrong; the 2026 capture's reading (two dawn gates) is right. Both dawn
columns are FIXED INTERVALS from astronomical sunrise, not angles (single angles refuted:
66/365 and 75/365, worst 9/7):

| column (2011) | recipe | exact/365 | within1 | worst |
|---|---|---|---|---|
| Fajar (dawn-1) | sunrise - 75.5 floor | 277 | 365 | 1 |
| Suba (dawn-2, printed "sunrise") | sunrise - 60.5 floor | 277 | 365 | 1 |
| Tisbar (dhuhr) | transit + 2 floor | 280 | 365 | 1 |
| Takusan (asr) | Shafi asr + 2 floor | 211 | 364 | 2 |
| Timis (maghrib) | sunset + 1.5 floor | 266 | 365 | 1 |
| Guewe (isha) | maghrib + 60 exactly | 365 | 365 | 0 |

**Between-edition stability: holds.** The same recipe on the 2026-11 sheet: Fajar -75.5
26/30 (within1 30/30), Suba -60.5 26/30 (30/30), Tisbar 27/30, Takusan 24/30, Timis 28/30.
Dawn-1 sits in the ~18 deg class, dawn-2 in the ~15 deg class (the 2026 sheet's own note);
the publisher computes one dawn and prints the other at +15.

---

## Mali - Bamako Al Madina Al Mounawara (ml)

`mlgn.js` -> `ml.json`. 365 rows 2026 via Mawaqit (community tier), mosque coords
(12.6086, -7.9542), Africa/Bamako. Both Mali and Guinea files carry a "2-29 extra" parse
problem note (dropped by the wave parser; 365 rows as promoted).

| column | recipe | exact/365 | within1 | worst |
|---|---|---|---|---|
| fajr | 19.0 deg + 7.5 floor | 363 | 365 | 1 |
| isha | 17.0 deg + 5.5 floor | 359 | 365 | 1 |
| sunrise | + 0.5 floor | 362 | 365 | 1 |
| maghrib | sunset + 3.5 floor | 363 | 365 | 1 |
| dhuhr | transit + 29 floor | 187 | 365 | 1 |
| asr | Shafi + 8 floor | 137 | 297 | 2 |

**Verdict: 18/17-class angles with safety minutes, transit+29 dhuhr - a clean
community-grade Mawaqit fit.** Asr carries a +6.6..+9.6 seasonal drift band (worst 2 at
+8). Hanafi asr refuted (worst 58).

---

## Guinea - Nono Grande Mosquee (gn)

`mlgn.js` -> `gn.json`. 365 rows 2026 via Mawaqit, mosque coords (10.876, -10.496),
Africa/Conakry.

| column | recipe | exact/365 | within1 | worst |
|---|---|---|---|---|
| isha | 17.0 deg + 0.5 floor | 356 | 365 | 1 |
| sunrise | + 0.5 floor | 364 | 365 | 1 |
| asr | Shafi + 0 | 170 | 331 | 2 |
| maghrib | sunset + 0.5 floor | 296 | 302 | 10 |
| dhuhr | fixed clock 13:45 | 365 | 365 | 0 |
| fajr | 18 deg + 0.5 floor (best single) | 240 | 247 | 19 |

Anomalies: **dhuhr is pinned at 13:45 on all 365 rows** (config-fixed, not computed);
**maghrib** fits sunset exactly Jan 1-Oct 15, then a smooth drift hump 2026-10-16..12-19
(peak +9.7 late Nov); **fajr** rides a smooth seasonal dawn curve (implied interval 58-76
min before sunrise, implied depression ~13.4 deg winter to ~17.5 summer, roughly
dep = 15.5 + 0.09 x declination) - the winter-longer direction rules out any fixed-angle
or fixed-interval convention at this latitude; no standard recipe reproduces it and the
table alone cannot resolve what does. Community-grade recipe is the 18 deg approximation;
the curve is recorded in gn.json.

---

## Cross-country notes

- Korea's "MWL ceil" statement and Luxembourg's "13.0/12.9" both held in family; Taiwan's
  maghrib/asr rules did not hold across editions; Senegal's two-dawn reading is confirmed
  and now edition-stable across 15 years.
- The three Mawaqit/community tables (ml, gn, mu) all carry second-resolution computed
  times with fixed safety minutes; the Senegal sheet is the only fixed-interval dawn
  convention found so far that is edition-stable.
- Diagnostics kept as evidence: `kr-fajr-diag.js`, `kr-coords.js`, `tw-diag.js`.
