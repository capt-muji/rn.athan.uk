# tunisia-cities (O1l-18): the national delegation map, the elevation ladder, and the archive's far edge

Agent tag `O1l-18`, 2026-11-11 (UTC). Public pages only, GET-only, no form, no login, no
challenge met, nothing under `/tmp`. Raw responses in `captures/`, normalized rows in `data/`,
scripts in `scripts/`. Engine: `adhan` 4.4.6 at
`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`, `TZ=Africa/Tunis`, no clock read,
every date built from a literal capture string.

## The surface

| Surface | URL | Tier | Dated data |
| --- | --- | --- | --- |
| INM prayer-time archive | `https://www.meteo.tn/horaire_gouvernorat/{YYYY-MM-DD}/{gouv}/{deleg}` | authority (national meteorological service) | one JSON row per day: `sobh dhohr aser magreb isha`, plus the delegation's own `lat`/`lng`; no sunrise row |
| INM live page | `https://www.meteo.tn/fr/heures-prieres` | authority | today's display for a delegation picked in a form |

The archive is one day per request and has no month form. The span is **2019-10-25 to
2026-12-31** inclusive (2027 answers `{"data":null}`), so a full national sweep at daily
granularity is 259 delegations x ~2,650 days and is not attempted here: the delegation map is
sampled by season, and the densest spans sit on the cities the mission named.

### The delegation map was inside the live page

The live page's governorate `<select>` carries 24 governorate ids; the full governorate-to-
delegation tree, with ids, names in three languages and parent links, is embedded as JSON in
the page's own `drupal-settings-json` block (`rest_ephemeride_priere.restephemeridepriere.list_gouv`).
That yields **24 governorates and 259 delegations** from one request
(`captures/heures-prieres.html`, `data/tn-gouv-deleg-tree.json`, `data/tn-delegations.json`).
Every archive row echoes its governorate and delegation ids and names, so each captured day
validates the id map by construction.

## Method

Sampling: four season months per delegation — 2024-10, 2025-01, 2025-04, 2026-07 — five days
each (5th, 11th, 17th, 23rd, 29th), 20 days per delegation. Every response is written raw to
`captures/tn-horaire-sw-<gouv>-<deleg>.ndjson` and parsed to `data/tn-inm-sw-<gouv>-<deleg>.json`.

Density where the mission named a city: the 13 governorate capitals and Djerba carry every day
of those four months (123 days each), not five per month.

Rows held: 5,144 season rows, 1,722 across the 14 full-month cities, 426 year-pair, 321
back-harvest, 365 Kasserine.

Year-pair test: 72 delegations across all 24 governorates on the same January days two years
apart (2024-01-05/15/25 and 2026-01-05/15/25), so a between-year parameter shift would show as
a moved dip on identical dates.

Back-harvest: Sousse, Kasserine and Djerba Houmt Souk, 107 days each from the archive's
floor at 2019-10-25 to 2023-12-20, plus Kasserine at 365 consecutive days of 2026 for a month-invariance test.

Model: the census recipe (fajr 18.1, isha 18.1, Shafi asr, dhuhr transit + 7 rounded, maghrib
sunset + 2 rounded up) with one added parameter, a **horizon dip** `delta` applied to the four
horizon-crossing prayers: fajr and isha at `-(18.1 + delta)`, sunrise/sunset at
`-50/60 - delta`. Transit and the shadow ratio are untouched, so the dip moves dhuhr and asr
not at all. This is the shape the residual signature demands: printed fajr early, printed
maghrib and isha late, by the same amount, month-invariantly.

Vertical datum: Copernicus GLO-90 elevation from the Open-Meteo elevation API at each
delegation's own captured coordinate (`captures/tn-dem-openmeteo.ndjson`, `data/tn-dem.json`).
The physical dip of a horizon `h` metres above the sea is `arccos(R/(R+h))`, which is
0.0321 degrees per sqrt(metre).

## Validation before any fit

- The custom dip-aware engine reproduces `adhan`'s own `PrayerTimes` at `delta = 0` on every
  column it shares (transit, sunset, `hourAngle`, Shafi afternoon), so the elevation term is
  the only difference from the banked fits.
- The frozen recipe on the banked Tunis 2024 year (366 rows, `o1k-wide/northafrica2`) scores
  **95.36% all-five-within-1**, mean signed residual 0.00 to 0.03 min per column. That is the
  prior waves' own per-year number for 2024, so this pipeline is the same measurement.
- Live-page gate (R5): the archive row for 2026-11-11 at Tunis is `05:24 12:10 14:52 17:15
  18:42`; the live page displays exactly `05:24 12:10 14:52 17:15 18:42` for Tunis today.
  The archive and the live surface are the same table.

## Results

### Coverage

258 delegations across 24 governorates, 5,144 dated rows, 20 days each by design (5 days in each of 2024-10, 2025-01, 2025-04, 2026-07). That is 256 delegations at the full 20 days, Chrarda at 14 and Sfax/Tina at 10 (publisher nulls), and Arram at zero: the publisher serves no table for Arram on any probed date. The four banked cities (Tunis, Sfax, Kairouan, Gafsa) sit inside the sweep.

Beside the season sweep: 71 delegations x 6 January days in 2024 and 2026 (the year-pair test), 3 cities x 107 days across 2019-10-25 to 2023-12-20 (the back-harvest), and Kasserine x 365 consecutive days of 2026 (the month-invariance test).

### The recipe is national; the horizon is per site

Mean per-column scores at the fitted dip, over all 258 delegations:

| Column | Within 1 min | Exact | MAE (min) | Mean signed (min) |
| --- | --- | --- | --- | --- |
| fajr | 98.6% | 91.3% | 0.12 | -0.06 |
| dhuhr | 100.0% | 90.8% | 0.09 | 0.00 |
| asr | 94.2% | 30.0% | 0.76 | 0.03 |
| maghrib | 100.0% | 91.6% | 0.08 | -0.01 |
| isha | 98.7% | 91.8% | 0.12 | 0.06 |

On a flat horizon the same recipe gives:

| Column | Within 1 min | Mean signed (min) |
| --- | --- | --- |
| fajr | 67.0% | 1.25 |
| dhuhr | 100.0% | 0.00 |
| asr | 94.2% | 0.03 |
| maghrib | 66.7% | -1.22 |
| isha | 67.3% | -1.22 |

All five columns within 1 min: flat horizon 58.3% mean, 40 delegations at 100%; with the per-delegation dip fitted 92.7% mean, 158 of 258 at 95% or better. The dip alone moves the national mean by 34.5 points.

The asr column's 5.8% miss is a seasonal skew, not a parameter: at the fitted dip the asr residual runs +0.95 min in January, +0.64 in April, -0.24 in July and -1.20 in October, the engine's own seasonal asr term on these rows. Dhuhr is 100% within 1 in every season.

### The elevation ladder

Fitted dip against the delegation's own Copernicus GLO-90 elevation:

- dip = 0.0316 x sqrt(metres) - 0.0999 degrees, R2 0.980, n 258;
- the geometric dip arccos(R/(R+h)) is 0.0321 degrees per sqrt(metre), so the fitted ladder runs at 98.3% of the geometric slope with a 0.100-degree offset at sea level: one physical term explains the per-delegation constant;
- flat-horizon fajr residual = 0.166 x sqrt(metres) - 0.432 min, R2 0.948: 2.4 min at 300 m and 4.0 min at 700 m;
- controls: residual against latitude R2 0.0263; against longitude alone R2 0.433; elevation and longitude together R2 0.927 with coefficients 0.00548 min/m and -0.16853 min/degree;
- longitude inside the under-50 m set alone (n 120): -0.16673 min/degree, R2 0.101.
- season invariance: within each delegation the dip fitted separately on January, April, July and October spans 0.049 degrees on average (median 0.020, max 0.610); 250 of 256 inside half a degree.
- seasonal amplitude (January minus July, sampled rows): fajr 125-169 min, isha 123-166 min, dhuhr 0-1 min.

### The ladder rung by rung

| DEM band (m) | Delegations | Mean dip fitted (deg) | Mean dip from DEM (deg) | Fajr residual at flat horizon (min) | Maghrib residual at flat horizon (min) | All-5 within 1, flat | All-5 within 1, dip fitted |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0-25 | 80 | 0.015 | 0.107 | 0.01 | -0.01 | 93.9% | 93.9% |
| 25-50 | 40 | 0.092 | 0.194 | 0.57 | -0.52 | 94.3% | 94.3% |
| 50-100 | 38 | 0.151 | 0.263 | 0.88 | -0.84 | 83.7% | 92.4% |
| 100-200 | 27 | 0.240 | 0.384 | 1.43 | -1.47 | 21.0% | 92.2% |
| 200-300 | 18 | 0.402 | 0.511 | 2.21 | -2.13 | 0.0% | 93.6% |
| 300-500 | 29 | 0.540 | 0.643 | 2.63 | -2.84 | 0.0% | 86.4% |
| 500-700 | 16 | 0.703 | 0.804 | 4.00 | -3.70 | 0.0% | 94.4% |
| 700-1200 | 10 | 0.826 | 0.928 | 4.63 | -4.30 | 0.0% | 93.5% |

### Per governorate

| Governorate | Delegations | Mean DEM (m) | Max DEM (m) | Mean dip (deg) | All-5 within 1, flat | All-5 within 1, dip fitted |
| --- | --- | --- | --- | --- | --- | --- |
| Tunis | 22 | 24 | 90 | 0.045 | 89.1% | 90.5% |
| Zaghouan | 6 | 164 | 209 | 0.305 | 5.8% | 92.5% |
| Siliana | 10 | 515 | 1021 | 0.602 | 0.0% | 94.5% |
| Mahdia | 12 | 51 | 143 | 0.107 | 79.2% | 94.6% |
| Gabes | 8 | 94 | 372 | 0.172 | 71.3% | 96.3% |
| Sousse | 12 | 29 | 78 | 0.070 | 92.1% | 92.5% |
| Ben Arous | 12 | 16 | 59 | 0.028 | 94.6% | 94.6% |
| Nabeul | 16 | 36 | 96 | 0.075 | 90.6% | 94.4% |
| Tataouine | 9 | 231 | 314 | 0.368 | 19.4% | 98.3% |
| Tozeur | 6 | 93 | 292 | 0.182 | 75.8% | 95.0% |
| Medenine | 9 | 75 | 468 | 0.113 | 82.8% | 97.2% |
| Jendouba | 8 | 265 | 694 | 0.380 | 15.6% | 95.0% |
| Sidi Bouzid | 12 | 320 | 463 | 0.417 | 2.1% | 75.0% |
| Béja | 8 | 219 | 447 | 0.340 | 30.6% | 89.4% |
| Kairouan | 10 | 224 | 474 | 0.259 | 35.1% | 82.5% |
| Ariana | 7 | 30 | 94 | 0.053 | 90.0% | 93.6% |
| Sfax | 15 | 40 | 174 | 0.080 | 85.7% | 95.3% |
| Manouba | 8 | 50 | 69 | 0.114 | 87.5% | 88.8% |
| Bizerte | 17 | 59 | 318 | 0.107 | 77.1% | 94.4% |
| Kasserine | 11 | 720 | 963 | 0.757 | 0.0% | 95.9% |
| Le kef | 11 | 624 | 811 | 0.697 | 0.0% | 92.7% |
| Monastir | 13 | 29 | 73 | 0.065 | 92.3% | 93.1% |
| Gafsa | 10 | 357 | 601 | 0.491 | 1.0% | 97.0% |
| Kébili | 6 | 49 | 72 | 0.125 | 95.0% | 97.5% |

### The named cities at full months

Every day of the four season months (123 days) at the 13 governorate capitals and Djerba, one dip per city:

| City | Days | DEM (m) | Dip fitted (deg) | Dip from DEM (deg) | All-5 flat | All-5 fitted | All-5 DEM dip | Season dips 10/01/04/07 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Beja/Beja | 123 | 209 | 0.400 | 0.464 | 0.0% | 91.9% | 91.9% | 0.39/0.4/0.39/0.4 |
| Gabes/Gabes | 123 | 8 | 0.000 | 0.091 | 95.9% | 95.9% | 95.9% | 0/0/0/0 |
| Jendouba/Jendouba | 123 | 145 | 0.280 | 0.387 | 10.6% | 96.7% | 96.7% | 0.27/0.28/0.28/0.29 |
| Kebili/Kebili | 123 | 34 | 0.090 | 0.187 | 95.9% | 95.9% | 95.9% | 0.08/0.1/0.09/0.09 |
| Medenine/Djerba Houmt Souk | 123 | 13 | 0.000 | 0.116 | 95.9% | 95.9% | 95.9% | 0/0/0/0 |
| Medenine/Medenine | 123 | 89 | 0.220 | 0.303 | 68.3% | 95.9% | 95.9% | 0.21/0.22/0.22/0.22 |
| Monastir/Monastir | 123 | 13 | 0.000 | 0.116 | 86.2% | 86.2% | 78.9% | 0/0/0/0 |
| Nabeul/Nabeul | 123 | 11 | 0.020 | 0.106 | 89.4% | 89.4% | 89.4% | 0.01/0.02/0.02/0.02 |
| Sidi Bouzid/Sidi Bouzid | 123 | 332 | 0.480 | 0.585 | 0.0% | 65.0% | 65.0% | 0.48/0.48/0.49/0 |
| Siliana/Siliana | 123 | 428 | 0.560 | 0.664 | 0.0% | 97.6% | 97.6% | 0.55/0.56/0.56/0.56 |
| Sousse/Sousse | 123 | 13 | 0.020 | 0.116 | 96.7% | 96.7% | 96.7% | 0.02/0.02/0.02/0.02 |
| Tataouine/Tataouine | 123 | 236 | 0.390 | 0.493 | 0.0% | 95.9% | 95.9% | 0.38/0.39/0.39/0.39 |
| Tozeur/Tozeur | 123 | 40 | 0.120 | 0.203 | 94.3% | 94.3% | 94.3% | 0.11/0.12/0.11/0.12 |
| Zaghouan/Zaghouan | 123 | 209 | 0.340 | 0.464 | 0.0% | 99.2% | 99.2% | 0.34/0.34/0.34/0.35 |

### Column constants (best per delegation, modal across the country)

| Column | Modal pad / rounding | Delegations |
| --- | --- | --- |
| fajr | 0/round | 219 |
| dhuhr | 7/round | 225 |
| asr | -0.5/round | 114 |
| maghrib | 2.5/round | 205 |
| isha | 0/round | 215 |

### Kasserine, 365 days of 2026: the dip is month-invariant

Kasserine sits at 674 m DEM, dip 0.833 degrees. The dip fitted month by month: 10:0.73, 11:0.74, 12:0.73, 01:0.73, 02:0.73, 03:0.73, 04:0.73, 05:0.74, 06:0.73, 07:0.73, 08:0.73, 09:0.74 degrees, spread 0.010. On the flat horizon fajr runs 4.10 min and maghrib -3.83 min off across the whole year; dhuhr and asr are untouched (asr -0.01 min). All five within 1: 0.0% flat, 94.8% at the single fitted dip of 0.730 degrees.

### Back-harvest 2019-2023: the term is frozen

| City | Days | Span | Dip, whole span (deg) | All-5 within 1 | Per-year dips (deg) |
| --- | --- | --- | --- | --- | --- |
| Sousse | 107 | 2019-10-25 to 2023-12-20 | 0.020 | 95.3% | 2019:0.02, 2020:0.02, 2021:0.02, 2022:0.02, 2023:0.02 |
| Djerba Houmt Souk | 107 | 2019-10-25 to 2023-12-20 | 0.000 | 97.2% | 2019:0, 2020:0, 2021:0, 2022:0, 2023:0 |
| Kasserine | 107 | 2019-10-25 to 2023-12-20 | 0.730 | 95.3% | 2019:0.72, 2020:0.73, 2021:0.73, 2022:0.73, 2023:0.73 |

Across the three spread cities the dip holds to a hundredth of a degree per year for four years and into the 2024-2026 sweep. Sousse sits at sea level and needs none; Djerba Houmt Souk likewise; Kasserine needs 0.730 degrees every year from 2019 to 2026. No regime change appears in the span.

### Year-pair 2024 vs 2026: parameters frozen, sample noise only

71 delegations on the same six January days two years apart: mean dip 0.242 degrees in 2024 and 0.217 in 2026, mean absolute shift 0.039 degrees (median 0.010, max 0.510); 62 of 71 inside 0.05 degrees and 66 inside 0.10. Applying 2024's dip to 2026's rows scores 89.2% all-five-within-1 against 92.0% at 2026's own dip; applying 2026's dip to 2024's rows scores 93.0% against 98.1%. The per-column flat-horizon residuals are year-invariant to within 0.2 min, so the cross-year loss is six-day sampling on a one-minute grid, not a moved parameter.

### A regional summer edition: Kairouan and Sidi Bouzid change angle in July

Fitting the July rows alone, per delegation, at its own DEM dip: 236 of 258 reproduce the frozen 18.1/18.1 angles on every July day (two more miss a single day at a rounding boundary); 20 need a fajr/isha angle between 17.1 and 17.6 degrees and reproduce at it exactly. All 20 sit in two adjacent governorates: the ten Kairouan delegations and ten of Sidi Bouzid's twelve. The other three seasons in the same tables hold 18.1. This is a seasonal regime inside the publisher's own year, not an elevation term: the July residuals are symmetric (fajr late, isha early), so no positive dip can absorb them, which is why the July dip for those delegations fits to zero.

The affected delegations, angle that reproduces July: Sidi Bouzid/Hichria 17.2/17.3; Sidi Bouzid/Regueb 17.4/17.5; Sidi Bouzid/Meknassi 17.4/17.4; Sidi Bouzid/Jelma 17.3/17.3; Sidi Bouzid/Sabbalet Ouled Asker 17.3/17.2; Sidi Bouzid/Bir El Hafey 17.2/17.2; Sidi Bouzid/Menzel Bouzayane 17.3/17.3; Sidi Bouzid/Mezouna 17.5/17.5; Sidi Bouzid/Ouled Haffouz 17.4/17.4; Sidi Bouzid/Sidi Bouzid 17.3/17.2; Kairouan/Sebikha 17.6/17.6; Kairouan/Chebika 17.5/17.5; Kairouan/Haffouz 17.3/17.3; Kairouan/El Alaa 17.2/17.2; Kairouan/Oueslatia 17.1/17.2; Kairouan/Hajeb El Ayoun 17.3/17.3; Kairouan/Nasrallah 17.5/17.5; Kairouan/Bou Hajla 17.5/17.5; Kairouan/Chrarda 17.5/17.6; Kairouan/Kairouan 17.6/17.6.

### The national verdict

One recipe covers 258 delegations: fajr 18.1, isha 18.1, Shafi asr, dhuhr transit +7 rounded, maghrib sunset +2 rounded up, fajr/isha rounded to the minute. One per-site term covers the rest: a horizon dip at the delegation's own DEM elevation, whose fitted slope runs at 98.3% of the geometric value (R2 0.980). The DEM dip alone scores 92.1% all-five-within-1 against 58.3% on a flat horizon. Flat-horizon failure tracks elevation and nothing else: latitude R2 0.0263, longitude alone 0.433, elevation 0.921. The one regional exception is dated: the 20 Kairouan and Sidi Bouzid tables print a July fajr/isha angle near 17.3 and 18.1 the rest of the year.

## Honest negatives

- **Arram (Medenine, 353/495) publishes nothing.** Twenty sampled days return
  `{"data":null,"method":"GET"}`, and three extra probes (2024-03-15, 2025-06-15, 2026-02-15)
  return the same. The id is the publisher's own, taken from the live page's tree. One of 259
  delegations has no table in this archive.
- **Chrarda (Kairouan, 357/529) and Tina (Sfax, 359/549) have holes.** Chrarda serves 14 of
  20 sampled days (all five April 2025 days and 2025-01-29 null); Tina serves 10 (the whole
  2025-04 month and 2026-07-05 null). Both serve normally outside the hole.
- **The archive's floor is 2019-10-25.** Probed directly: 2019-10-24 and every earlier date
  answer `{"data":null}`, 2019-10-25 serves a row. The back-harvest starts at that floor.
- The Ministère des Affaires Religieuses site is down at probe: `www.affaires-religieuses.gov.tn`
  refuses the TLS connection (curl 7), the `http://` origin answers **503** in 798 bytes, and
  `marhp.gov.tn` does not resolve. No second authority surface was reachable there.
- A second publisher surface was sought and not found. The mawaqit search API answers **401**
  (`captures/mawaqit-search-tunis.json`) and its search page **404**. Individual mawaqit mosque
  pages do render (`captures/mawaqit-medenine.html`, mosque id 41190), but their data endpoints
  answer **404** without the app's own token, so no dated calendar is obtainable under these
  terms. Nothing else surfaced in French or Arabic search.
- Platform surfaces exist but do not reproduce the authority. The yabiladi Tunis table's first
  row reads `05:26 12:04 14:52 17:17 18:42` (`captures/yabiladi-tunis.html`) against the
  authority's today row `05:24 12:10 14:52 17:15 18:42`: a different engine with dhuhr at
  transit. Recorded as platform, never as confirmation of the INM table.
- Tunisia still prints **no sunrise row** anywhere in 259 delegations: the payload is five
  fields only. The census's missing-field case is confirmed at national scale.
- The archive stops at 2026-12-31; 2027 answers `{"data":null}`. Forward longevity is
  proven-to-2026 only, and the 2019-10-25 floor is the far edge in the other direction.
- **The 20 Kairouan and Sidi Bouzid tables resist the frozen recipe in July.** Their July
  fajr/isha reproduce at 17.1-17.6 degrees, not 18.1, while October, January and April hold
  18.1. No dip absorbs a symmetric fajr-late/isha-early residual, which is why their July dip
  fits to zero. Sidi Bouzid at 123 days therefore scores 65.0% while the other 13 capitals
  score 86-99%. Flagged for the owner, not adjudicated.
