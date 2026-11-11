# O1l-59 masjidi.app - the pool and the engine question

Workspace: `$HOME/athan-gitree/census/o1l-city/masjidi/`.
Engine reference: adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`
(`Rounding.None`), PrayTimes.js v2.5 from the canonical source (`probe/PrayTimes.js`), and a
NOAA/USNO solar series written for this job (`probe/fitlib.js`). No clock read: every date is
built from a literal day-of-year. Timezone pinned per country, standard offset only (no DST).

## 1. The platform

`tv.masjidi.app` is a live public directory, server-rendered, no login. The root page carries
**495 tenant cards in 33 countries across 266 city groups**, each with `data-id`, `data-name`,
`data-address` and a link to `https://tv.masjidi.app/<id>` (captured: `captures/directory_root.html`,
1.0 MB). All 495 cards parsed into `data/tenants.json`.

Each tenant screen embeds its whole configuration in a `<masjidi-data>` block that ends at about
60 KB. **All 495 screens were enumerated** (`data/platform_tables.json`, zero fetch errors). Two
timing modes exist:

- `table-api` - **468 tenants**. The screen points at one regional table,
  `https://tv.masjidi.app/upload/json_prayers_times/prayer_times_region_json_<n>.json`: a
  **366-row undated day-of-year array** of `{Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha}`, integer
  minutes, no year, no coordinates, no method label.
- `aladhan-api` - **27 tenants** (US 6, Syria 4, UK 4, Canada 4, Australia 2, Spain 2, India 2,
  Turkey, Russia, Pakistan 1 each). These call AlAdhan live and carry no masjidi table. They are
  not part of this pool.

**167 distinct regional tables** serve the 468 table tenants (`data/tables/`, one file per table,
8.4 MB of normalized rows). 46 tables are shared by more than one tenant; table 2 alone serves
176 tenants. Tables per country: Saudi 25, Algeria 22, Indonesia 22, Lebanon 16, Syria 13,
Oman 11, Morocco 11, Malaysia 8, Tunisia 7, Iraq 4, Libya 4, Jordan 4, Egypt 3, Germany 3,
Palestine 2, Sweden 2, Norway 2, then 1 each (Kuwait, UK, Belgium, Romania, Qatar, Bosnia,
Bahrain, Italy).

**Dating.** The payload carries no year. The array is a fixed 366-row scaffold whose 60th row is a
**fabricated February 29**: on the Beirut, Dammam and Jakarta tables it is a byte-copy of the
59th row (6 of 6 fields identical on two of the three). The underlying year is therefore
common-year, and the scaffold's rows 61 onward map one-to-one onto a common-year March to December.
A leap-scaffold index reproduces that alignment exactly, so the exported rows are keyed on a 2028
scaffold so all 366 survive, and the key is recorded as an index, not a claim of year.

One internal calendar anchor does exist, and it dates two cohorts. The Saudi tables extend the
isha interval from maghrib+90 to maghrib+120 for a single contiguous block, which is the Ramadan
convention. Two block positions occur:

- rows 70-99 (30 days) on tables 155, 157, 163 - the first day maps to 11 March, which is Ramadan
  1445, so **these three tables are 2024 vintage**;
- rows 48-78 on the other 22 Saudi tables - the first day maps to 18 February, which is Ramadan
  1447, so **these tables are 2026 vintage**.

Both anchors sit before the scaffold's February 29, so the duplicated row does not disturb them,
and 2026 is a common year, which agrees with the duplicate-row evidence.

The platform is therefore serving **stale, mixed-vintage snapshots**, not one current generation,
and a fit must not be read across the cohorts as one publication. The remaining 142 tables carry
no internal date anchor and cannot be dated. The tenant page renders no times server-side (only
`3:10`, a countdown seed), so the R5 live-page gate cannot date a table. That gate is closed for
this platform, not failed.

## 2. THE ENGINE - a third engine, measured

The record's 6.2-8.1 min solar-gate failure is **an artefact of the fixed standard horizon**,
not a theory mismatch. Five independent measurements settle it.

**(a) The solar theory is precise.** Recovering the implied declination from each table's own
sunrise/maghrib half-day and comparing it with a precise ephemeris gives a residual that is a
smooth annual wave of 0.2-0.6 deg, not the 1-2 deg a coarse model leaves. Recovering the equation
of time from the table's own solar noon gives a residual of about 1 min. The noon and the
declination are right.

**(b) The rise-set depression is a per-region constant, never 0.833 deg.** Fitting latitude from
the day-length curve, with the horizon free, gives a stable depression per table:

| table | country | lat | rise-set depression | minutes of margin | solar RMS |
| --- | --- | --- | --- | --- | --- |
| 247 | Jordan | 31.85 | 0.854 deg | 0.1 | 0.49 |
| 144 | Kuwait | 29.25 | 0.858 | 0.1 | 0.52 |
| 1051 | Saudi (Dammam) | 26.35 | 0.954 | 0.6 | 0.44 |
| 3551 | Algeria | 34.60 | 1.153 | 1.7 | 0.52 |
| 8221 | Morocco | 33.50 | 1.347 | 2.6 | 0.47 |
| 2 | Lebanon (Beirut) | 33.85 | 1.350 | 2.6 | 0.89 |
| 46 | Oman | 17.05 | 1.406 | 2.5 | 0.31 |

The same correction is equally describable as a **constant rise/set margin of 0.1 to 3.6 minutes**
(sunrise earlier, maghrib later, symmetrically): both models score within 0.01 min of each other
on every table tested. Across all 167 tables the fitted depression runs 0.83 to 2.59 deg between
the first and ninety-ninth percentile, with one broken table (Libya region 42, 4.29 deg, 3.36 min
RMS). It is never 0.833. **That is the whole of the record's gate failure.**

**(c) The sun is evaluated once per day at 0h UT.** Comparing a model that takes the declination
and equation of time at the event against one that takes them at 0h UT of the civil day, on
12 tables spanning four continents: **the daily model wins 12 of 12**, by 5 to 30 pc
(`probe/dailytest.js`). This is a real engine signature, not noise, and it is the one thing both
reference engines do differently.

**(d) PrayTimes v2 and adhan are indistinguishable here.** At identical coordinates, across a
year: PrayTimes v2.5 sits 0.10-0.23 min from the NOAA series, adhan 4.4.6 sits 0.21-0.50 min.
Both are below the table's one-minute resolution. The engine therefore cannot be named from its
solar theory; only its departures from both can be named.

**(e) The whole six-column table reproduces on one recipe.** With the rise-set margin, the fajr
model (angle or fixed interval), the isha model (angle or fixed interval), the asr shadow factor
(fitted continuously, not just 1 or 2) and the dhuhr offset all free, **167 of 167 tables fit at a
median 0.54 min RMS and a median 93 pc within one minute** (`out/recipes.json`). The asr factor
lands at 0.97-1.08 on every table, so the asr school is Shafi everywhere, with a small
table-specific shadow bias.

**Verdict.** The engine is a **third engine in the PrayTimes/adhan precision class**, not either
of them. Its measured signature is: a precise solar ephemeris; the sun's declination and equation
of time evaluated once per day at 0h UT; a per-region rise/set margin of 0.1 to 3.6 minutes; a
per-region dhuhr margin of -2.7 to +7 minutes (one broken Libyan table at +12.6); integer-minute
output; a fixed standard-time clock with no DST steps. It is not PrayTimes-v2-family and not adhan,
because both fix the rise-set depression at 0.833 deg and both evaluate at the event.

**Consequence for the pool.** The pool is usable evidence. The 6.2-8.1 min figure over-specified
every recipe; freed, the tables reproduce at the quantization floor, and the twilight angles and
asr school are legible. No recipe should be fitted to these tables with a fixed 0.833 horizon.

## 3. Per-country fit families

One recipe per country, fitted on all of that country's tables and scored on all six columns at
integer-minute resolution. `w1` is the median within-one-minute percentage of the country's tables.

| country | tables | fajr | isha | rise-set | asr factor | dhuhr margin | w1 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Saudi Arabia | 25 | 18.42 deg | maghrib + 90 (25/25) | 1.0 | 1.01 | +0.5 | 93 |
| Algeria | 22 | 18.31 | 16.77 deg | 1.1 | 0.98 | -1.5 | 93 |
| Indonesia | 22 | 19.40 | 18.59 deg | 1.6 | 1.03 | +3.5 | 96 |
| Lebanon | 16 | 20.11 | 17.16 deg | 1.4 | 0.97 | -2.6 | 68 |
| Syria | 13 | 18.19 | 16.84 deg | 1.0 | 0.99 | 0.0 | 95 |
| Oman | 11 | 18.53 | 17.47 deg | 1.4 | 1.03 | +2.5 | 96 |
| Morocco | 11 | 19.51 | 16.59 deg | 1.4 | 0.97 | +2.5 | 93 |
| Malaysia | 8 | 17.89 | 18.12 deg | 0.9 | 1.01 | +1.6 | 93 |
| Tunisia | 7 | 18.29 | 17.95 deg | 1.1 | 0.99 | +6.0 | 96 |
| Iraq | 4 | 16.35-18.23 | maghrib + 75/80 | 0.6-1.0 | 1.03 | +3.9 | 62 |
| Libya | 4 | 18.72 | 17.95 deg | 1.2 | 0.98 | +2.0 | 94 |
| Jordan | 4 | 15.04 | 15.03 deg | 0.9 | 1.00 | 0.0 | 94 |
| Egypt | 3 | 19.54 | 17.53 deg | 0.9 | 1.00 | 0.0 | 98 |
| Germany | 3 | sunrise - 105 | maghrib + 90 | 1.8 | 1.05 | +5.0 | 75 |
| Palestine | 2 | 18.43 | 17.65 deg | 1.8 | 0.98 | -2.0 | 91 |
| Kuwait | 1 | 18.04 | 17.53 deg | 0.9 | 1.00 | 0.0 | 95 |
| Qatar | 1 | 18.47 | maghrib + 90 | 1.1 | 1.00 | -0.1 | 97 |
| Bahrain | 1 | 18.20 | 17.88 deg | 1.0 | 1.00 | +1.3 | 98 |
| Italy | 1 | 18.04 | 17.17 deg | 1.0 | 0.97 | +0.6 | 62 |
| Romania | 1 | 18.08 | 16.05 deg | 2.0 | 1.05 | +5.0 | 77 |
| Bosnia | 1 | 17.75 | 15.80 deg | 1.9 | 1.01 | +1.2 | 74 |
| United Kingdom | 1 | sunrise - 97 | maghrib + 79 | 1.3 | 1.00 | +5.0 | 65 |
| Norway | 2 | sunrise - 125 | maghrib + 109 | 1.1 | 1.08 | +7.0 | 37 |
| Sweden | 2 | sunrise - 130 | maghrib + 113 | 1.5 | 1.05 | +4.8 | 42 |
| Belgium | 1 | sunrise - 118 | maghrib + 112 | 1.0 | 1.01 | +0.5 | 49 |

Reading the families:

- **National pairs are real and tight.** Saudi 18.42 with a maghrib+90 isha on 25 of 25 tables,
  Jordan 15.04/15.03, Egypt 19.54/17.53, Oman 18.53/17.47, Morocco 19.51/16.59, Algeria
  18.31/16.77, Syria 18.19/16.84, Indonesia 19.40/18.59, Malaysia 17.89/18.12. Each country's
  tables agree with each other to 0.02-0.05 deg.
- **Two countries publish intervals, not angles.** Germany (3 tables) is `sunrise - 105` and
  `maghrib + 90` on every day: 100 pc within one minute on fajr. Saudi's isha is an interval, not
  an angle, and its interval stretches from 90 to 120 minutes inside Ramadan.
- **The high-latitude group is not yet modelled.** Norway, Sweden and Belgium (5 tables) fit at
  37-49 pc. Their fajr and isha are fixed intervals for most of the year but collapse in
  midsummer (Fredrikstad fajr-sunrise runs 142, 121, 130, 79, 60, 138 minutes across the year),
  which is a high-latitude clamp, not an angle and not a constant interval. Fitting them needs a
  night-fraction rule; the family is recorded here as open.
- **The asr school is Shafi on all 167 tables.** The fitted shadow factor runs 0.97-1.08, never
  near the Hanafi 2.0. Algeria, Morocco, Lebanon and Italy sit at 0.97-0.98, Indonesia and Oman at
  1.03, Germany and Sweden at 1.05.

## 4. The Lebanon question

Lebanon is the platform's core: **244 tenants, 16 regional tables**, not the five the record
carries from its 76-screen sample.

| table | tenants | cities it serves | lat, lon | fajr | isha | asr f | dhuhr | w1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | 176 | Beirut, Sidon, Tyre, Shuf, camps | 33.84, 34.96 | 20.11 | 17.16 | 0.97 | -2.5 | 69 |
| 3 | 14 | Wadi Khaled, Nahr al-Bared, north | 34.29, 35.26 | 18.50 | 17.59 | 1.01 | +0.4 | 74 |
| 7199 | 13 | Mazboud, Ketermaya, Chhim | 33.78, 34.98 | 20.14 | 17.15 | 0.97 | -2.5 | 68 |
| 7202 | 7 | Aramoun, Bchamoun | 33.91, 35.04 | 20.12 | 17.17 | 0.97 | -2.6 | 62 |
| 7213 | 7 | Kamid al-Lawz, Majdel Anjar, Bekaa | 33.78, 35.37 | 20.11 | 17.19 | 0.97 | -2.7 | 62 |
| 7508 | 6 | Tripoli, Batroun | 34.30, 35.26 | 18.51 | 17.58 | 1.01 | +0.4 | 74 |
| 7203 | 5 | Aley | 33.98, 35.14 | 20.12 | 17.16 | 0.97 | -2.7 | 61 |
| 7200 | 4 | Anout, Daraya, Hasrout | 33.75, 35.06 | 20.13 | 17.18 | 0.97 | -2.6 | 61 |
| 4 | 3 | Mashmash, Qarna, Wali Azi al-Din | 34.28, 34.64 | 18.98 | 17.10 | 0.99 | -2.1 | 68 |
| 7509 | 2 | West Bekaa | 33.84, 35.21 | 17.67 | 16.19 | 0.97 | +0.5 | 69 |
| 8166 | 2 | Zaarouriya | 33.53, 35.50 | 18.05 | 18.04 | 1.00 | 0.0 | 96 |
| 5 | 1 | Jurd Ayn al-Dabba | 34.28, 34.76 | 18.88 | 17.20 | 0.99 | -1.6 | 70 |
| 7204 | 1 | Qabay | 33.93, 35.19 | 20.11 | 17.18 | 0.97 | -2.6 | 63 |
| 8140 | 1 | Marj | 33.84, 35.21 | 17.67 | 16.78 | 0.97 | +0.5 | 68 |
| 8389 | 1 | Taalabaya | 33.73, 34.74 | 18.28 | 16.88 | 0.97 | -0.5 | 88 |
| 8390 | 1 | Laqlouq | 34.31, 33.76 | 19.85 | 17.08 | 0.97 | -2.2 | 62 |

Three findings.

**A. The "composite feed" is 16 district tables, and the mosque layer is mostly the iqamah.** The
record's Dar al-Fatwa composite feed is confirmed as a district set, but it is 16 tables, not 5.
Eight of them (2, 7199, 7202, 7203, 7200, 7204, 7213, 8390) share the 20.1/17.16 recipe and a
dhuhr margin of about -2.5; two (3 and 7508) share the 18.5/17.6 recipe with +0.4; the other six
differ. The mosque layer carries
`iqamaWaitDuration` per prayer plus a Friday Jumu'ah override on Dhuhr, and that is the iqamah
layer. **The athan is regional, the iqamah is per mosque.**

The mosque layer can also shift the athan, and the fit must read it: 17 of the 86 sampled tenants
set a non-zero `timeOffset`, including tenant 741 (Morocco) at -60 minutes on all five prayers,
which is a whole-hour clock correction rather than a minute tweak, and tenant 790 (Canada) at +40
on isha. **None of the 10 sampled Lebanon tenants sets any offset**, so for Lebanon the athan is
exactly the table.

**B. Table 2 is a Beirut table served to 176 tenants, including Sidon and Tyre.** Its fitted
coordinate is 33.84 N, 34.96 E, which is Beirut. Sidon sits 33.56 N, 35.37 E and Tyre 33.27 N,
35.20 E. A Sidon mosque reading table 2 gets Beirut's solar geometry. The error is small (1-2 min)
but it is a misattribution, and it means Lebanon's mosque-level coverage is **one coordinate for
72 pc of the country's tenants**.

**C. The Lebanon tables are the only ones that do not reach the floor.** Fifteen of the 16 fit at
61-74 pc within one minute, against 93-98 pc for every other country; only table 8166 (Zaarouriya)
reaches 96. The residual is not noise: for table
2 the sunrise residual is a smooth annual wave, -1.26 min in April to +0.95 in August, with the
maghrib residual exactly anti-symmetric (+0.98 in May to -1.38 in September). A day that is too
long in spring and too short in autumn is a declination amplitude about 1 pc too large. This is a
**publisher-side defect of the Lebanese feed**, not the platform engine, and it is why the record
could not reproduce the Lebanon tables from any single coordinate. The one clean Lebanon table is
8166 (Zaarouriya) at 96 pc.

## 5. What this confirms and what is new

**Confirms:** the 495-tenant directory and its 33-country distribution; the platform's separate
athan and iqamah layers; the fixed standard-time clock with no DST steps; and one national
twilight pair per country.

**The recovered angles move, and the size of the move tracks the rise-set margin.** Against the
record's values: Saudi 18.42 against 18.31, Jordan 15.04/15.03 against 15.02/15.02, Egypt
19.54/17.53 against 19.51/17.50 and Kuwait 18.04/17.53 against 18.01/17.51 agree within 0.15 deg,
and all four are tables whose margin is 0.1-0.6 min. The tables with a 1.5-3.6 min margin move
further: Oman 18.53/17.47 against 18.00/16.85, Morocco 19.51/16.59 against 19.01/16.03, Algeria
18.31/16.77 against 18.00/16.43, Lebanon 20.11/17.16 against 19.60/16.64, Bosnia 17.75/15.80
against 16.79/14.79 and Romania 18.08/16.05 against 16.83/14.82. The twilight angle and the
rise-set margin are coupled: fitting one with the other fixed moves the other. The values here are
the ones to carry, because they come from a fit that reaches the one-minute floor; a recipe built
on the record's angles must keep the record's horizon assumption with it.

**New:** the engine signature (daily 0h UT evaluation plus a per-region rise-set margin), which
makes the pool fittable at the floor; the full 167-table census; the fabricated February 29 row;
the 16-table Lebanon structure against the record's five; the German fixed-interval family; the
Saudi Ramadan isha extension to 120 minutes and the two vintages it dates (2024 and 2026); the
per-tenant offset layer; the Beirut-coordinate misattribution of table 2; the Lebanon
declination-amplitude defect.

**Correction to the record:** "ALL 37 masjidi.app tables fail the solar gate at 6.2-8.1 min RMS"
does not reproduce. Under a free rise-set margin the solar columns of all 167 tables fit at a
median 0.45 min RMS (range 0.30 to 3.78, two tables above 1.5). Under the standard 0.833 horizon
with latitude and longitude free the same columns fit at 0.49-3.19 min on the eight tables
measured, not 6.2-8.1. The record's exact fitting procedure is not stated, so the 6.2-8.1 figure
may come from a constrained fit; either way it should not be carried forward as an engine
mismatch.

## 6. Ceiling and forward longevity

The tables are undated day-of-year arrays with no horizon: the platform serves one table per
region and the payload has no year, so nothing in the artifact proves a year, and no endpoint
serves a future year. The ceiling is therefore **one published cycle per table, 366 rows, with
two dated cohorts (2024 and 2026) and 142 tables undateable**. The platform is not refreshing: the
2024 cohort is still being served in November 2026, which is a two-year staleness on 3 Saudi
tables. Wayback CDX was attempted for a backward harvest of the table URLs and the Internet
Archive returned "Temporarily Offline" at 2026-11-11 06:4x UTC; the backward harvest is open.

## 7. Honest negatives

- **No live-page gate.** The tenant page renders no prayer times server-side; the times are
  computed in the browser from the same table. Gating the table against the page is circular.
- **No year for 142 of 167 tables.** Only the Saudi Ramadan block dates anything (22 tables 2026,
  3 tables 2024). The rest carry no year, no coordinates and no method label.
- **The Lebanon angles differ from the record.** The record carries Lebanon 19.60/16.64 from its
  five-table sample; the dominant family here recovers 20.11/17.16 on 8 of 16 tables, a 0.5 deg
  fajr difference. The recovered angle on a table with the Lebanon declination defect is
  method-sensitive, so treat 19.6 and 20.1 as an open interval, not a settled pair.
- **The 27 aladhan-api tenants carry no masjidi table.** Turkey, the UK, the US, Canada, Spain,
  Russia, India, Pakistan and Australia therefore contribute no table to this pool; their
  masjidi coverage is an AlAdhan call, not a masjidi publication.
- **The high-latitude group is open.** Norway, Sweden and Belgium fit at 37-49 pc; a night-fraction
  rule is needed and was not fitted.
- **Wayback was offline** for the backward harvest.
- **Iraq (62 pc), Italy (62 pc), the UK table (65 pc) and Bosnia (74 pc)** are single or few tables
  and fit below the platform's floor; each is recorded as candidate, not as a settled recipe.

## 8. Grade

Per FIT-RULES: each table is **one published cycle**, so each country's family is **provisional**
on the platform tier. Nothing here lifts to A: no table carries a second dated cycle, the two
Saudi vintages are two different tables and not two years of one table, and 142 tables cannot be
dated at all. The engine verdict and the Lebanon defect are measurements, not grades.

Not complete. The 167 tables are the platform's whole published set as of 2026-11-11, and the
engine signature is measured; the year, the live-page gate and the high-latitude rule remain open.
