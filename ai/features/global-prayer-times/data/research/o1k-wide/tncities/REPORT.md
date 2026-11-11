# tncities: Tunisia countrywide recipe test and three more Egyptian cities

Agent tag `tncities`, 2026-11-10 (UTC). Public pages only, GET-only except the one ESA postback the
site's own form performs, polite pacing (0.4 s sleep between requests plus response time, at most three concurrent streams), no
contact, no challenge met, nothing written under `/tmp`. Raw responses in `captures/`, normalized
rows in `data/`, one JSON per fit at the workspace root, scripts in `scripts/`.

Two jobs: (1) harvest Kairouan, Gafsa and Sfax over the same seven years `deep2` harvested for Tunis,
then score `deep2`'s frozen Tunis recipe at each; (2) harvest three further ESA cities and score the
frozen Egyptian recipe there. Both surfaces served more than the brief asked, so both jobs carry a
wider span than requested: the Egyptian cities run the whole of 2026, and the Tunisian search adds
Bizerte, Ben Guerdene and Kasserine for the latitude ends and the elevation test.

## Method

- Model: `adhan` 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`, `Rounding.None`
  (second resolution), then one explicit rounding per bound with an integer minute pad. Identical
  machinery to `deep2/scripts/lib.js` and `deep2/scripts/engine.js`, copied unchanged into
  `scripts/`. Every run fixes `TZ=Africa/Tunis` or `TZ=Africa/Cairo` and builds each day from its own
  date at 12:00 local; no clock is read.
- Coordinates are the ones each surface reports for itself: the INM payload carries `lat`/`lng` in
  every row (Tunis 36.800/10.183, Kairouan 35.677/10.097, Gafsa 34.421/8.787, Sfax 34.733/10.750).
  The ESA table prints no coordinates, so the Egyptian cities are scored at their standard
  city-centre pairs (stated per city below).
- The frozen recipes are scored exactly as `deep2`'s and the census record's reports state them, and
  where a report carries two readings of one element both are scored and named.

## Surface table

| Surface | URL | Tier | Dated data | Years |
| --- | --- | --- | --- | --- |
| Tunisia INM dated archive | `https://www.meteo.tn/horaire_gouvernorat/{YYYY-MM-DD}/{gouv}/{deleg}` | authority | one JSON row per day, five prayers, no sunrise | 2020-01-01 .. 2026-12-31 |
| Egypt ESA monthly table | `https://www.esa.gov.eg/monthlymwaket.aspx` (postback) | authority | 28-31 rows per city-month, six columns | any month of 2026; harvested all twelve |

### The Tunisian endpoint has no month form

`horaire_gouvernorat/2024-01/357/630` answers 200 with the row for **2024-01-01**, the same payload
`horaire_gouvernorat/2024-01-01/357/630` returns (`id` 666857 both). The path is one day per request;
the only granularity is the day. The harvest therefore issues one request per day and banks one
NDJSON per city-year. Depth probed at Kairouan: 2020-06-15, 2024-01-01, 2026-11-30 and 2026-12-31
all answer rows, every 2019 date probed before October 2019 answers `{"data":null}` and 2027-01-01
answers `{"data":null}`
(`captures/tn-depth-probe.txt`). The archive is the seven calendar years 2020-2026 inclusive, and it
serves the whole of 2026 including days still in the future.

The archive's real start is earlier than 2020: `2019-10-31` answers (id 315211) and every 2019 date
before it probed does not (`2019-10-15` down to `2019-06-15` null). The 62 days from 2019-10-31 to
2019-12-31 are therefore harvestable too; they are not in this job's span and are held back exactly
as `deep2` held them back.

## Job 1: Tunisia, three more cities over the same seven years

### Harvest

7,671 day requests (gouv/deleg 357/630, 365/638, 359/632), at most three concurrent streams with a
0.4 s sleep between requests: **2,557 dated rows per city, zero null days, zero failures**
(`captures/tn-horaire-{kairouan,gafsa,sfax}-<year>.ndjson`, one raw JSON per day;
`data/tn-inm-<city>-<year>.json`). The coordinates are the ones each row reports for itself:
Kairouan 35.677 / 10.097, Gafsa 34.421 / " 8.787", Sfax 34.733 / 10.750. All seven years were
harvested for all three cities; nothing was held back.

### What each city's table actually is

Fitted freely over the full 2,557 days per city, at that city's own geometry:

| City | fajr | isha | dhuhr | maghrib | asr | 
| --- | --- | --- | --- | --- | --- |
| Tunis | 18.1 deg, round, 96.6% exact | 18.1 deg, round, 96.6% | noon +7, round, 90.3% | sunset +3, floor, 95.1% | Shafi, floor, 39.8% (81.8% within 1) |
| Kairouan | 18.1 deg, -1, round, 72.6% | 18.2 deg, ceil, 73.6% | noon +7, round, 90.0% | sunset +3, ceil, 87.5% | Shafi, -1, ceil, 40.8% (81.9%) |
| Gafsa | **18.5 deg, floor, 87.7%** | **18.5 deg, ceil, 88.3%** | noon +7, round, 89.2% | **sunset +5, round, 85.8%** | Shafi, floor, 42.2% (84.5%) |
| Sfax | 18.0 deg, -1, round, 80.8% | 18.0 deg, +1, round, 82.3% | noon +7, round, 89.6% | sunset +3, round, 77.6% | Shafi, -1, ceil, 43.8% (83.6%) |

Every column of every city is inside a minute on 100% of days except the asr (81-85%) and Kairouan's
twilights (91-92%). The constants are **not** identical: Gafsa needs 18.5 degrees or a 5-minute
maghrib margin, Sfax 18.0, Kairouan 18.1/18.2, Tunis 18.1. A joint fit over all four cities returns
18.3/18.3 with a +-1 minute pad and is exact on only 46.8% of days, which is the arithmetic of four
different tables averaged into one.

### The frozen Tunis recipe at each city

`18.1/18.1 round, noon +7 round, sunset +2 rounded up (+3 floor)`, Shafi asr, scored unchanged at
each city's own coordinates. "within 1 / 2 / 3" is the whole five-prayer block on the same day.

| City | all five within 1 | within 2 | within 3 | fajr | dhuhr | asr | maghrib | isha |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Tunis | **94.2%** | 100% | 100% | 100% | 100% | 94.2% | 100% | 100% |
| Sfax | **96.9%** | 100% | 100% | 100% | 100% | 96.9% | 100% | 100% |
| Kairouan | **91.6%** | 100% | 100% | 97.8% | 100% | 95.8% | 100% | 97.8% |
| Gafsa | **0.0%** | 18.8% | 92.8% | 0% | 100% | 96.6% | 0% | 0% |

The asr reading matters and is named: with `floor` instead of `round` the same block scores 81.8%,
78.0%, 84.2% and 0.0%, because asr is the column with the seasonal sub-minute term. `deep2`'s report
carries both readings; the 94.2% headline is the `round` one and is reproduced here exactly.

### Gafsa is not noise: it is the horizon

Under the frozen recipe the residual is a **constant, month-invariant offset** rather than a
seasonal drift:

| City | fajr mean | maghrib mean | isha mean | monthly medians (Jan..Dec) |
| --- | --- | --- | --- | --- |
| Tunis | -0.03 | +0.01 | +0.02 | 0 in every month, all three |
| Sfax | +0.29 | -0.26 | -0.29 | 0 or -1, all twelve |
| Kairouan | +0.69 | -0.85 | -0.69 | +1 / -1 / -1 in all twelve |
| Gafsa | +2.56 | -2.42 | -2.58 | +2 or +3 / -2 or -3 / -2 or -3 |

Printed fajr runs *early* and printed maghrib and isha run *late* by the same amount, while dhuhr and
asr are untouched. That is a **horizon** term, not a solar-model term: a depressed horizon lengthens
the day symmetrically and leaves noon and the shadow ratio alone. Published elevation, the residual,
and the angle that absorbs it line up across seven cities, including three sampled for this test:

| City | published elevation (approx.) | fajr residual | implied dip | implied elevation | fajr angle absorbing it |
| --- | --- | --- | --- | --- | --- |
| Ben Guerdene (33.139/11.215) | ~50 m | +0.07 | 0.014 deg | 0 m | 18.10 |
| Tunis | ~10 m | -0.03 | 0.000 | 0 m | 18.10 |
| Sfax | ~10 m | +0.29 | 0.024 deg | 4 m | 18.00 |
| Bizerte (37.276/9.873) | ~5 m | +0.41 | 0.082 deg | 6 m | 18.15 |
| Kairouan | ~50 m | +0.69 | 0.114 deg | 19 m | 18.10 |
| Gafsa | ~300 m | +2.56 | 0.528 deg | 271 m | 18.50 |
| Kasserine (35.168/8.836) | ~700 m | +3.74 | 0.764 deg | 566 m | 18.85 |

The three new sites bracket it. Kasserine, an inland highland town at roughly 700 m, is 3.7 to 3.9
minutes out on every one of 61 sampled days in the predicted direction, with dhuhr and asr inside a
minute.
Ben Guerdene, a lowland southern town, is 0.07 minutes out on all 61. Bizerte and Ben Guerdene also
close the latitude question: the frozen recipe holds at 37.28 N and at 33.14 N as it does at 34-36 N.

### Does one recipe serve the whole country?

**No, not to the minute.** The frozen Tunis recipe holds minute precision at the coast and the
centre (Tunis 94.2%, Sfax 96.9%, Kairouan 91.6%, Bizerte 98.4%, Ben Guerdene 100%) and misses
inland highland cities by 2.5 to 4 minutes on essentially every day (Gafsa 0%, Kasserine 0%). The
per-city refits confirm it independently: the constants that each city's own table needs drift from
18.0 to 18.5 degrees and maghrib from +3 to +5.

With the site's horizon supplied, one recipe does serve the whole country. Every city's offset is
the elevation term above, and the per-city fitted fajr angles equal **18.1 degrees plus the city's
own dip to within 0.15 degrees** (Kasserine 18.85 against 18.86 predicted, Kairouan 18.1 at a -1
minute pad against 18.21 predicted, Sfax 18.0 at a -1 minute pad against 18.12). Remove the horizon
term and the shared recipe sits inside a minute on 100% of days at Tunis, Sfax and Gafsa and 91-92%
at Kairouan (whose table carries about a minute of its own jitter). The practical statement for the
census: **Tunisia is one recipe plus a per-city elevation, and a flat-horizon recipe understates the
day at Gafsa and Kasserine by about 2.5 and 4 minutes.**

### Between years

The seven years are near-identical but not frozen. For each calendar date the spread across the
seven years of any one column is at most 2 minutes at Tunis, Gafsa and Sfax and 3 minutes at
Kairouan; the number of dates whose five values are identical in all seven years runs 1 of 366
(Kairouan), 12 (Tunis), 21 (Gafsa) and 25 (Sfax). Per-year frozen-recipe scores are flat: Tunis
93.2-95.4%, Sfax 96.2-97.8%, Kairouan 87.4-97.3%, Gafsa 0% in all seven. There is no year term to
fit, and no year that behaves differently from its neighbours.

## Job 2: Egypt, three more cities

### Capture

The ESA month table is a postback: `monthlymwaket.aspx` re-renders when `DropDownList2` (the month)
fires, carrying the city in `DropDownList1`. A fresh GET per city supplies `__VIEWSTATE`,
`__VIEWSTATEGENERATOR` and `__EVENTVALIDATION` and its own cookie jar; the body is written to a file
and sent with `--data-binary` under `Content-Type: application/x-www-form-urlencoded`, `Referer` and
`Origin` set. The option strings carry tatweel and must be posted byte-for-byte as the page prints
them: `بورسعيـد`, `الأقصر`, `أسيــوط`. All three were present in the page's 83 city options, so no
city needed substituting. Responses are 47 KB each and echo the city name in every row, which the
parser verifies row by row.

`data/eg-esa-{portsaid,luxor,assiut}-2026.json`: 365 dated rows each, 2026-01-01 .. 2026-12-31,
six columns (fajr, sunrise, dhuhr, asr, maghrib, isha). Zero missing days, zero parse failures, and
every row echoes the requested city.

The month dropdown serves any month of 2026, so the job does not stop at November: each city was
pulled for all twelve months, December included (a future month, served complete).
That is 36 postbacks, and it turns a one-month check into a full-year one at no extra depth cost.

### The frozen Egyptian recipe at each city

Recipe as the census record states it: **19.5 / 17.5, zero margins on every prayer**, nearest
minute, Shafi asr, `Africa/Cairo`. Scored at each city's centre pair, raw geometry, no city pad.
Each cell is exact / within one minute out of 365 days.

| City | fajr | sunrise | dhuhr | asr | maghrib | isha | all six within 1 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Port Said (31.2653, 32.3019) | 364/365, 100% | 336/365, 100% | 363/365, 100% | 260/365, 100% | 347/365, 100% | 352/365, 100% | **365/365** |
| Luxor (25.6872, 32.6396) | 346/365, 100% | 322/365, 100% | 348/365, 100% | 259/365, 100% | 356/365, 100% | 349/365, 100% | **365/365** |
| Assiut (27.1809, 31.1837) | 357/365, 100% | 357/365, 100% | 363/365, 100% | 256/365, 100% | 337/365, 100% | 349/365, 100% | **365/365** |
| Cairo (30.0444, 31.2357), November control | 27/30, 100% | 24/30, 100% | 22/30, 100% | 24/30, 100% | 25/30, 100% | 26/30, 100% | 30/30 |

Every one of the 1,095 new days and all six columns is exact or one minute out, in every month of
the year. The worst residual anywhere in the Egyptian block is 1 minute. The free refit agrees: a
pad sweep of -2..+2 minutes per column returns **pad 0 for all six columns at all three cities**
(`eg-deep.json`, `bestPad`), so no city and no column needs a correction. The Hanafi asr is 56 to 59
minutes out on average and never within a minute, so asr is the Shafi shadow at these cities as at
Cairo. Asr is also the only column whose exact count is low (70-71%), all within a minute: the
sub-minute seasonal term the Tunisian fit shows too.

### The coordinate pair is not doing hidden work

The table prints no coordinates, so the pair used matters. Shifting each city's pair by 0.2 degrees
in latitude leaves the verdict unchanged (365/365 within a minute at every offset tested). Shifting
longitude by 0.2 degrees adds a mean bias of 0.8 minutes and drops 20 to 150 days to a 2-minute
residual (`scripts/eg-sensitivity.js`). A pair more than a tenth of a degree from the publisher's
own would therefore show as a systematic bias, and none appears (mean signed residual 0.00 to 0.05
minutes). The centre pairs are the publisher's to within that tolerance.

## What confirms the census record

- **Tunisia's five-prayer recipe is reproduced from fresh data.** `deep2`'s 18.1/18.1, noon +7,
  sunset +2 (printed at +3 floor), Shafi asr scores 94.2% of 2,557 days inside a minute at Tunis,
  matching `deep2`'s own number. Twenty-one fresh city-years (Kairouan, Gafsa, Sfax) sit behind it.
- **Tunisia prints no sunrise.** The payload carries five fields only (`sobh`, `dhohr`, `aser`,
  `magreb`, `isha`) at every one of the 7,671 rows harvested. The census's missing-field case holds
  on the dated archive, not only on today's page.
- **The dhuhr margin is national and the maghrib margin is national on flat ground.** Noon +7 round
  lands inside a minute on every day at all seven cities. Sunset +2/+3 holds 100% within a minute at
  the four fitted cities and at both latitude ends, and fails only at Kasserine, where the horizon
  term moves sunset rather than the margin.
- **Egypt's zero margins are national, not Cairo-specific.** 19.5/17.5 with no pad on any column
  reproduces all six columns within a minute on all 365 days of 2026 at Port Said, Luxor and Assiut,
  and the same reading at Cairo for November reproduces the census's fitted city.
- **Asr is the Shafi shadow in both countries.** Hanafi is 43-59 minutes out wherever it is tried.

## What is NEW

- **Kairouan, Gafsa, Sfax over seven years each** (7,671 fresh dated rows, 2020-01-01 to
  2026-12-31), a three-city widening of Tunisia's multi-year record.
- **Tunisia's national table carries an elevation term.** The frozen recipe misses Gafsa by 2.5
  minutes and Kasserine by 3.7 on every day, in the exact signature of a depressed horizon (fajr
  early, maghrib and isha late, dhuhr and asr untouched, month-invariant), and the size of the miss
  is monotone in published elevation across seven cities. Nothing in the census record or the
  earlier waves names this. Any minute-precision claim for inland Tunisia needs the elevation.
- **The Tunisian archive starts on 2019-10-31**, not 2020-01-01: 62 further days (id block 315211)
  answer and serve normal rows. The `2020-06-15` floor recorded earlier is seven and a half months
  later than the true edge.
- **The ESA month table serves any month of 2026**, not only the running one, including months still
  in the future, so the Egyptian surface is month-addressable at one postback per city-month. That
  it also serves earlier years is untested: the form carries no year field.
- **Port Said, Luxor, Assiut for the whole of 2026** (1,095 dated rows, six columns), the first
  Egyptian rows outside Cairo, Alexandria and Aswan.

## What deserves a fit

- **Tunisia with an elevation term.** The multi-city table is now large enough (10,228 rows across
  four cities) to fit one recipe with a per-site horizon and check it at Bizerte, Ben Guerdene and
  Kasserine. The seven-city evidence says the elevation is the whole remaining error.
- **Egypt at more cities over a year.** The two-request-per-city shape (GET + postback) makes all 82
  listed cities a 164-request job; the recipe needs no fitting, only proving.

## Honest negatives

- **The Tunisian endpoint has no month form.** `horaire_gouvernorat/2024-01/{gouv}/{deleg}` returns
  2024-01-01, so "one request per month per city" is not available: the harvest is 7,671 day
  requests, paced 0.4 s apart over three streams for about 33 minutes, and every one succeeded.
- **Kairouan is the one city a per-city fit cannot reproduce exactly**: 91.9% within a minute on
  fajr and 91.1% on isha even at its own best constants, against 100% at the other three. Its table
  carries about a minute of scatter no smooth model absorbs. Reported, not explained.
- **The Egyptian coordinates are assumed, not read.** The ESA table prints no latitude, longitude or
  elevation. The three new cities give mean signed residuals of 0.00 to 0.05 minutes, and a 0.2-degree
  longitude shift adds 0.8 minutes of bias, so the pairs are close to the publisher's, but the
  publisher's own values remain unknown.
- **Tunisia's sunrise cannot be fitted** because it is not printed, at any city, in any year. Nothing
  here changes the census's "derive nothing, label it computed" rule.
- **The elevation evidence is inference.** No INM page states that elevation is applied. The case
  rests on the residual signature, its month-invariance, and its monotone agreement with published
  elevation across seven cities.

## Files

- `captures/tn-horaire-{kairouan,gafsa,sfax}-<year>.ndjson` (21 files, one raw JSON per day, 7,671
  rows); harvest logs in `logs/`.
- `captures/eg-esa-monthlymwaket-{portsaid,luxor,assiut}-2026-<mm>.html` (36 responses, 46-48 KB
  each, one per city-month), plus `captures/eg-esa-get-portsaid-01.html`, the form page the postback
  state was scraped from.
- `captures/tn-depth-probe.txt`: the depth probe that fixes the archive's span and the month-form
  negative.
- `data/tn-inm-{kairouan,gafsa,sfax}-<year>.json` (21 files, 2,557 rows each),
  `data/tn-inm-{bizerte,benguerdene,kasserine}-edge.json` (61 rows each),
  `data/eg-esa-{portsaid,luxor,assiut}-2026.json` (365 rows each),
  `data/eg-esa-cairo-2026-11.json` (30 rows, control).
- `tn-country.json` (per-city fits, joint fit, frozen-recipe scores per city and year, residual
  structure), `eg-deep.json` (per-city column scores, monthly scores, best pads).
- `scripts/`: `tn-harvest.js`, `tn-country.js`, `tn-edge.js`, `tn-edge-fit.js`,
  `eg-year.js`, `eg-post.js`, `eg-parse.js`, `eg-fit.js`, `eg-sensitivity.js`, plus the shared
  `lib.js` and `engine.js` copied unchanged from `deep2`.
