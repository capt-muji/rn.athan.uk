# O1m-10 Central Asia and Caucasus depth

Agent: O1m-10. Workspace: `$HOME/athan-gitree/census/o1m/o1m-10-centralasia/`.
Engine: adhan 4.4.6, `Rounding.None`, time zone pinned per country, dates from the
capture strings. Nothing declared complete.

## 1. Kyrgyzstan: 20 cities, and the endpoint is year-blind

Surface: `https://muftiyat.kg/ru/api/v1/calendar/{locationCode}/?start=DD-MM-YYYY&end=DD-MM-YYYY`
(authority). Twenty settlement codes pulled in six two-month windows each, 7,300 dated rows.
Coordinates are recovered from the served columns (sunrise, transit, sunset), residual 0.43-0.54
min per column-day.

Recipe: fajr 18.0 flat; maghrib = printed sunset + 7 on 7,300 of 7,300 rows across the twenty
cities; isha = maghrib + round(k * (sunrise - fajr) + 3.5); Hanafi asr.

| city | lat | lng | fajr exact | maghrib w1 | isha w1 k=.775 | asr w1 | tahajjud exact |
|---|---|---|---|---|---|---|---|
| bishkek | 42.89 | 74.601 | 59.3 | 96.2 | 98.1 | 56.0 | 86.3 |
| osh | 40.55 | 72.809 | 61.4 | 98.1 | 95.9 | 57.3 | 80.3 |
| batken | 40.02 | 70.809 | 35.3 | 94.8 | 96.7 | 62.5 | 81.4 |
| cholponata | 42.62 | 77.059 | 37.5 | 92.9 | 98.1 | 61.6 | 84.7 |
| talas | 42.54 | 72.206 | 49.3 | 94.5 | 98.4 | 58.1 | 81.4 |
| balykchy | 42.45 | 76.162 | 42.7 | 93.7 | 98.4 | 60.8 | 81.6 |
| tokmok | 42.84 | 75.294 | 49.3 | 95.1 | 98.6 | 57.8 | 84.1 |
| kemin | 42.76 | 75.662 | 35.9 | 90.4 | 97.8 | 63.3 | 80.0 |
| kant | 42.91 | 74.883 | 68.2 | 98.9 | 97.0 | 52.6 | 86.3 |
| karabalta | 42.84 | 73.882 | 67.9 | 98.6 | 97.8 | 53.2 | 85.2 |
| kyzylkiya | 40.30 | 72.132 | 61.4 | 94.2 | 97.3 | 61.6 | 81.4 |
| uzgen | 40.76 | 73.294 | 48.2 | 95.6 | 97.5 | 57.8 | 81.1 |
| nookat | 40.30 | 72.632 | 64.7 | 98.1 | 96.4 | 58.1 | 83.0 |
| karasuu | 40.72 | 72.882 | 59.5 | 95.9 | 96.2 | 56.4 | 83.3 |
| suzak | 40.88 | 72.897 | 42.5 | 93.7 | 97.0 | 61.6 | 84.9 |
| kochkor | 42.29 | 75.751 | 59.2 | 93.4 | 97.0 | 56.4 | 80.3 |
| toktogul | 41.89 | 72.941 | 47.9 | 94.2 | 95.9 | 60.8 | 84.1 |
| tashkumyr | 41.33 | 72.206 | 49.3 | 94.5 | 97.5 | 61.1 | 82.7 |
| mailuusuu | 41.30 | 72.456 | 59.2 | 91.0 | 95.1 | 60.8 | 82.7 |
| suluktu | 39.98 | 69.559 | 55.1 | 98.6 | 96.2 | 58.4 | 82.7 |

Fajr is 18.0: 100 pc within-1 at all twenty cities, every column worst 1 min. The 35-68 pc exact
rate is the minute grid, not a rule defect. Hanafi asr is decisive and weak (52-63 pc within-1,
MAE 0.35-0.45): a long shadow on a coarse grid.

### The ratio constant is a ridge, and the band is now 20 cities wide

Sweep over k (0.60-0.90, step 0.005) and the additive constant (3.0-4.0, step 0.25) on 7,299
paired days. The (k, c) pair is under-determined by one observable, so the fit is a ridge, not a
point:

| k | c | within-1 | exact | MAE |
|---|---|---|---|---|
| 0.771 | 4.00 | 97.29 | 51.71 | 0.51 |
| 0.773 | 3.75 | 97.29 | 51.71 | 0.51 |
| 0.775 | 3.50 | 97.14 | 50.45 | 0.52 |
| 0.7778 (7/9) | 3.50 | below the top ten | | |

The recorded band 3.2-3.5 holds and 0.775 is the best point inside it. Feeding the unrounded
computed sunrise and fajr instead of the printed ones lifts within-1 to 98.63 pc and halves the
two-minute residuals (209 to 100): the residual is input quantisation, not a rule defect.

Tahajjud = maghrib + 2/3 * (next fajr - maghrib), 100 pc within-1 at all twenty cities and 80-86 pc
exact: the tabulated column is that formula on the minute grid, and the exact rate is the grid's.

### Defect found: the year parameter is discarded

Five years probed on the same location code: 2015, 2025, 2026, 2027 and 2030 return tables that
are identical cell for cell (0 differences on 354 winter cells; 0 on 372 summer cells at the
solstice window). The date strings follow the requested year, the times do not. A Karakol pull
today is byte-identical to the O1l capture taken hours earlier (2,190 cells).

Consequence for the record: Kyrgyzstan is ONE published cycle. The prior round's "2026" label is
nominal, and no year-2 exists on this surface at all. Grade stays provisional, and the honest
statement is stronger than "not found": the endpoint cannot produce a second year. Harvesting the
future from it would be harvesting the same generation under a later label.

## 2. Uzbekistan: six new cities, and the recipe read out of the publisher's own bundle

Surface: `islom.uz/taqvim/oylik` (community platform, client-computed). Region set and region
coordinates from the portal's own `new.islom.uz/api/v1/regions` (91 entries, spanning Uzbekistan
plus Ashgabat, Bishkek, Dushanbe, Khujand and four Kazakh cities).

November 2026 captured through a real browser session at seven region ids: Tashkent 27,
Samarkand 18, Namangan 15, Qarshi 25, Termez 74, Khiva 21, and the duplicate Qarshi 93.

Recipe, now read from the shipped JavaScript rather than inferred:
`fajrAngle = 15.5`, `ishaAngle = 15.5`, `madhab = Hanafi`, ishroq = sunrise + 20,
shom (maghrib) = sunset + 4, and a display clock fixed at UTC+5 (`getUTCHours` after a +5 h
shift). No other column carries a margin.

| city | region id | differ_minute | fajr | sunrise | ishroq | dhuhr | asr | maghrib | isha | all columns within-1 |
|---|---|---|---|---|---|---|---|---|---|
| tashkent | 27 | 0 | 100/100 | 100/100 | 100 | 100/100 | 100/100 | 100/100 | 100/100 | yes |
| samarkand | 18 | +9 | 100/100 | 100/100 | 100 | 100/100 | 93.3/100 | 96.7/100 | 100/100 | yes |
| namangan | 15 | -10 | 96.7/100 | 100/100 | 100 | 100/100 | 100/100 | 100/100 | 96.7/100 | yes |
| qarshi | 25 | +12 | 100/100 | 100/100 | 100 | 93.3/100 | 100/100 | 100/100 | 100/100 | yes |
| termez | 74 | null | 100/100 | 100/100 | 100 | 100/100 | 96.7/100 | 96.7/100 | 96.7/100 | yes |
| khiva | 21 | +35 | 96.7/100 | 100/100 | 100 | 100/100 | 96.7/100 | 100/100 | 96.7/100 | yes |
| qarshi (2nd id) | 93 | null | 100/100 | 100/100 | 100 | 96.7/100 | 96.7/100 | 93.3/100 | 96.7/100 | yes |

(exact/within-1 in percent, 30 dated days each.)

`differ_minute` is NOT applied. The new cities settle it on data where the fit alone could not:
Khiva carries +35, Qarshi +12, Namangan -10, Termez null, and all four reproduce at ZERO margin
on every column. The bundle confirms the reason: the calculation reads only the region's latitude
and longitude. `differ_minute` is a legacy display field.

The 1400/1404 identity is not a frozen table either: the page computes from the visitor's clock,
so the portal can only ever serve the current month. Month and year query parameters are
accepted and ignored (identical bytes across five variants), the region is held in localStorage,
and there is no month selector. One cycle is all this surface has.

Two publisher-side defects. Qarshi appears twice in the region list (id 25 at 38.830248/65.778764
and id 93 at 38.860560/65.789050) and prints the same table. Termez, Khiva and the four foreign
cities share the database with regions outside Uzbekistan, so a per-country cut of this list
needs the country field the API does not carry.

## 3. Tajikistan: the archive tail is fully served, and it dates the dhuhr regime change

Surface: `POST https://shuroiulamo.tj/tj/namaz/ntime` with `fmonth`, `fyear`, `fday=0`
(authority, Shuroi Ulamo). Every year 2014-2026 and every month was posted: 156 month cells, 144
of which carry rows. 4,328 dated rows across 13 files.

| year | rows | span |
|---|---|---|
| 2014 | 24 | Dec only |
| 2015 | 363 | full |
| 2016 | 365 | full |
| 2017 | 364 | full |
| 2018 | 338 | full, 27 defective rows rejected |
| 2019 | 360 | full |
| 2020 | 360 | full |
| 2021 | 364 | full |
| 2022 | 364 | full |
| 2023 | 362 | full |
| 2024 | 365 | full |
| 2025 | 365 | full |
| 2026 | 334 | Jan-Nov |

The earlier "three of fourteen probes" was a request-shape problem, not an empty archive. The
form's own year list (2014-2026) is the archive's true extent: 2014 January to November return an
empty body (2 bytes), 2026 December is not yet served, and every other month returns a table.

### The window grammar, measured over twelve years

Six intervals per day, in order: fajr, dhuhr, asr, the disliked sunset interval, the maghrib
window, the night window. Measurements across the full span:

- The maghrib window is 40 min on the mode in every year, but the share it holds moves a lot:
  100 pc in 2014, 99.4 in 2018, 95-99 in 2020, 2021 and 2025, 89-93 in 2023, 2024 and 2026,
  and only 49-76 pc in 2015, 2017, 2019 and 2022, which print a seasonally varying 40-47 min
  instead. The recent years print a fixed window; the middle of the span did not.
- maghrib start to night start is exactly 90 min (63.6 pc in 2015 rising to 99.4 pc in 2026).
  The 90 is the constant; where the maghrib window is cut inside it is what moves.
- The sunset window ends one minute before the maghrib start (mean +0.95 min over the span).
- The sunset window starts 7-19 min BEFORE adhan sunset, and the lead shrinks across the span
  (-19.3 in 2014, -9.2 in 2025).
- The maghrib precaution margin drifts upward: +7.2 min in 2014 to +9.7 min in 2026.
- Fajr start: January mean 05:57-06:08, July mean 03:21-03:38, amplitude 139-167 min.
- Isha start never crosses midnight at Dushanbe (January 19:03-19:08, July 21:22-21:28). The
  night WINDOW crosses midnight; the isha bound does not.

### The 2019 dhuhr regime change, pinned to the day and sized

Dhuhr offset against adhan 18/18 at Dushanbe's own point, day by day across the boundary:

- 2018-12-31: +32.3 min
- 2019-06-30: +31.6 min
- 2019-07-01: +11.4 min
- 2019-08-01: +8.8 min

A 20-minute step on exactly the recorded 2019-07-01 date, with no overlapping days and no drift
on either side. The record already flagged this boundary; this measures its magnitude.

## 4. Turkmenistan: the FALLBACK lifts, on a platform tier

No authority surface exists (reconfirmed in Turkmen, Russian and English). The route that works
is the Diyanet tree: `namazvakitleri.diyanet.gov.tr`, country id 159, 33 Turkmen settlements
enumerated through its own `home/GetRegList` endpoint.

Each city page carries a full dated year (365 unique dates, 2026-01-01 to 2026-12-31, with some
dates repeated in the payload). Six captured: Ashgabat (16408), Turkmenabat (18938), Dashoguz as
TASAUZ (16415), Mary as MERV (16411), Balkanabat (18939), Turkmenbashi (16412). 2,190 rows.

This is a platform tier, not an authority. It is, however, the first dated Turkmen surface in the
record, and it makes the country measurable rather than absent.

Fit at each city's own centre: adhan 4.4.6, 18.0/17.0, Shafi asr, with the temkin block measured
below (sunrise -7, dhuhr +5, asr +4, maghrib +7, fajr 0, isha 0).

| city | all exact | all within-1 | MAE | worst |
|---|---|---|---|---|
| Ashgabat | 55.1 | 99.2 | 0.50 | 1.8 |
| Turkmenabat | 66.5 | 99.4 | 0.45 | 1.7 |
| Dashoguz (TASAUZ) | 63.1 | 97.9 | 0.49 | 2.0 |
| Mary (MERV) | 65.8 | 99.5 | 0.44 | 1.6 |
| Balkanabat | 63.9 | 99.0 | 0.47 | 1.8 |
| Turkmenbashi | 62.6 | 98.9 | 0.48 | 1.8 |

Every column at every city is 97 pc within-1 or better except asr and isha, which sit at 90-99 pc
with a worst residual of 2.0 min.

## 5. Georgia: Tbilisi's year, and the Juma Mosque board is the Diyanet generation

Two surfaces.

**Diyanet**, country id 62, 36 settlements enumerated. Six captured at 365 rows each: Tbilisi
(13554), Batumi (13555), Kutaisi (17820), Marneuli (13543), Gardabani (33304), Rustavi (13549).
2,190 rows. This closes the 99-mosque inventory that had every prayer field empty.

**mawaqit**, Tbilisi Juma Mosque, `mawaqit.net/en/tbilisi-juma-mosque-32-botanikuri-street-tbilisi-georgia`,
listed point 41.687/44.81. Its stored calendar is a full year (366 rows for a 365-day year, the
known phantom 29 February), last updated 2026-06-23.

Fit at 41.740/44.81 (the listed point shifted 0.053 deg north, which collapses the day-length
spread from 3.1 to 0.70 min):

| column | exact | within-1 | MAE |
|---|---|---|---|
| fajr | 84.4 | 100 | 0.28 |
| sunrise | 85.8 | 99.7 | 0.28 |
| dhuhr | 91.0 | 100 | 0.26 |
| asr | 32.2 | 93.4 | 0.77 |
| maghrib | 37.7 | 96.7 | 0.66 |
| isha | 22.7 | 89.6 | 0.90 |
| ALL | 59.0 | 96.6 | 0.52 |

Recipe: adhan 4.4.6, 18.0/17.0, Shafi asr, with the Diyanet temkin block (sunrise -7, dhuhr +5,
asr +4, maghrib +7, fajr 0, isha 0). The mosque's board and the state directorate's table are ONE
generation: 96.6 pc within-1 across 2,196 cells.

## 6. Mongolia: the negative lifts, and the summer does not fit

Diyanet country id 60, 67 settlements enumerated. Three captured at 365 rows: Ulaanbaatar as
ULAN BATOR (15534), Erdenet (15475), Darkhan as DARHAN (15532). 1,095 rows.

The winter reproduces adhan 18/17 with the same temkin block (fajr 68.5-74.0 pc within-1, sunrise,
dhuhr, asr and maghrib 99.5-100 pc). The summer does not: fajr worst residual 43-50 min, isha
worst 47-52 min, because at 47.9-49.5 N the 17-degree twilight never arrives and the publisher
clamps. Ulaanbaatar prints isha 22:34 on 21 June against a maghrib of 21:02 - a 92-minute interval
where the angle rule would place it near midnight. All-column within-1 falls to 78.1-78.9 pc.

So Mongolia is a clamped regime in the high-sun season, and the clamp is not one fixed interval
(94 min on 1 June, 88 on 15 July). It needs its own high-latitude test; it is not a plain angle
fit and this report does not claim one.

## 7. Azerbaijan: the per-city route confirmed at four more cities

**nam.az** serves `/{city}/{MM}/{DD}` for ganja, sumqayit, lankaran and sheki, all 200, all with
a full dated year. 365 rows each, 1,460 rows.

Fit: adhan 18/17 Shafi at each city's own centre, ZERO margins on every column.

| city | fajr exact | sunrise | dhuhr | asr | maghrib | isha | within-1 |
|---|---|---|---|---|---|---|---|
| ganja | 93.2 | 94.8 | 97.8 | 54.5 | 95.3 | 85.5 | 100 all |
| sumqayit | 95.9 | 97.0 | 97.3 | 55.9 | 95.1 | 87.1 | 100 all |
| lankaran | 92.3 | 94.8 | 97.8 | 54.0 | 95.3 | 87.4 | 100 all |
| sheki | 95.6 | 91.0 | 97.8 | 53.4 | 97.5 | 86.8 | 100 all |

**Diyanet**, country id 5, 37 settlements. Six captured (Baku 11631, GENCE 11634, SUMQAYIT 11641,
LENKERAN 11645, SEKI 11635, NAHCIVAN 11637), 2,190 rows, fitting the same template at 97.0-98.6 pc
within-1 (Baku 61.6 exact / 98.6 w1 / MAE 0.48).

The two Baku lines stay two lines: nam.az at zero margins, Diyanet at the temkin block.

### The Diyanet temkin block is one global template

Across all eighteen non-Mongolian cities captured this wave, one parameter set reproduces every
table: 18.0/17.0 Shafi, sunrise -7, dhuhr +5, asr +4, maghrib +7, fajr 0, isha 0.

| country | cities | all within-1 | MAE | worst | fajr | sunrise | dhuhr | asr | maghrib | isha |
|---|---|---|---|---|---|---|---|---|---|---|
| Turkmenistan | 6 | 97.9-99.5 | 0.44-0.50 | 2.0 | 100 | 100 | 100 | 97-99.5 | 99.5-100 | 90.7-97.3 |
| Georgia | 6 | 96.5-97.7 | 0.51-0.53 | 2.1 | 100 | 100 | 100 | 92.3-96.2 | 97.3-100 | 88.8-92.3 |
| Azerbaijan | 6 | 97.0-98.6 | 0.47-0.52 | 2.1 | 100 | 100 | 100 | 95.6-96.7 | 97.8-99.7 | 88.5-94.8 |

(all figures in percent unless a minute value is named.) All eighteen non-Mongolian cities carry a
worst residual of 2.1 min or less on every column. The residual sits on asr and isha, and it is a
small seasonal term rather than a constant, which is what a takdir correction looks like and what
a pure angle does not.

## 8. Afghanistan: Kabul's second witness, and seven more cities

Surface: `tawkit.net/en/prayer-times/afghanistan/{city}/` (platform). The country page enumerates
307 cities, by far the deepest Afghan inventory in the record. Each city page embeds the current
month's timetable; the month is served from the clock and no parameter moves it
(`?m=2026-10` and `?month=10&year=2026` both return 11-2026). One month only, 30 rows per city.

Eight captured, 240 rows, coordinates from each page's own JSON-LD: Kabul 34.52813/69.17233,
Kandahar 31.61332/65.71013, Herat 34.34817/62.19967, Mazar-e-Sharif 36.70904/67.11087,
Ghazni 33.55391/68.42096, Jalalabad 34.42647/70.45153, Kunduz 36.72895/68.857,
Balkh 36.75635/66.8972.

Fit: adhan 18.0/18.0 Shafi, ZERO margins, UTC+4:30.

| city | all-column exact | all-column within-1 | MAE |
|---|---|---|---|
| kabul | 88.3 | 100 | 0.26 |
| kandahar | 85.0 | 100 | 0.28 |
| herat | 81.7 | 100 | 0.28 |
| mazar-e-sharif | 81.7 | 100 | 0.27 |
| ghazni | 81.7 | 100 | 0.29 |
| jalalabad | 86.1 | 100 | 0.28 |
| kunduz | 78.3 | 100 | 0.28 |
| balkh | 88.3 | 100 | 0.26 |

Every column at every city is 100 pc within-1, and the largest residual anywhere in the 1,440
cells is 0.80 min. Kabul now has a second witness that is NOT the municipality's ISNA widget:
18/18 at zero margins against the widget's 15/15 ISNA, which is the 11-minute gap the record
already carried.

The Shia Ja'fari Ramadan table is a separate object and was not touched, per the standing rule.

## 9. Negatives, with the languages searched

- **Armenia, Yerevan Blue Mosque own table**: not found in Armenian ("Կապույտ մզկիթ namaz",
  "ժամերգությունների աղյուսակ"), Russian or English. The Blue Mosque returns only tourism,
  Wikipedia and news pages; no timetable page, no mawaqit tenant, no masjidbox tenant. tawkit's
  18 Armenian cities remain the only surface, and tawkit is parameter-blind, so the year-2 window
  is closed by the surface, not merely unfound.
- **Turkmenistan authority**: no muftiate site under "namaz wagty", "Türkmenistanyň müftüligi",
  "время намаза Туркменистан", "муфтият Туркменистана", English. Unchanged from O1l-26r; the
  Diyanet tree is the substitute recorded in section 4.
- **tawkit for Turkmenistan, Georgia, Mongolia, Azerbaijan**: the platform's 75 countries do not
  include any of the four. Only Afghanistan (307), Armenia (18), Uzbekistan (86), Kyrgyzstan (83),
  Kazakhstan (265) and Pakistan (453) are present among this wave's targets.
- **Pakistan north (Gilgit-Baltistan, Chitral)**: no published dated table found. Every hit is an
  aggregator (muslimandquran, islamicfinder, muslimpro, hamariweb, salah.com) or a chart image.
  `islamicacademy.org/html/Times/Gilgit.htm` is a link to an Excel download, not a table on the
  page; it is a lead, not data. Unchanged negative.
- **Tajikistan second publisher**: `takvim.tj` lists 19 cities (one more than the authority's own
  offset list, which names 18) and states on its own homepage that its times are taken from the
  Islamic Centre of the Republic of Tajikistan. It is a mirror of the captured authority, not an
  independent witness, and its pages served no dated rows in two probes. Tajik-language search
  also returned namazvakti.com, praytime.uz and salattimes.net, all aggregators.

## 10. Defects found

1. **muftiyat.kg is year-blind.** 2015, 2025, 2026, 2027 and 2030 print identical times (0
   differences in 726 cells across two seasons) while the date strings follow the requested year.
   Any "future harvest" from this endpoint is the same generation relabelled.
2. **shuroiulamo.tj 2018-12 is served twice**, the second block all `00:00 - 00:00` placeholders
   (62 rows in the payload for a 31-day month). Two further rows are malformed
   (2019-08-14, 2023-02-13) and were rejected. 27 rows in 2018 carry partial zeros.
3. **islom.uz carries Qarshi twice** (region id 25 and id 93, coordinates 0.03 deg apart) and both
   print the same table.
4. **tawkit's month is the visitor's clock**, with no archive and no parameter: `?m=`, `?month=`
   and `?year=` are all discarded.
5. **mawaqit Tbilisi stores 366 rows for 2026**, the phantom 29 February class already recorded.
6. **Diyanet repeats dates in its payload** (403 date cells for 365 unique days on the Turkmen
   and Georgian pages); parsing must dedupe on the date or the fit is triple-weighted.

## 11. Counts (script-derived, `scripts/inventory.js`)

| block | files | dated rows |
|---|---|---|
| Kyrgyzstan (muftiyat.kg, 20 cities) | 20 | 7,300 |
| Tajikistan (shuroiulamo.tj, 13 years) | 13 | 4,328 |
| Turkmenistan (Diyanet, 6 cities) | 6 | 2,190 |
| Georgia (Diyanet, 6 cities) | 6 | 2,190 |
| Georgia (mawaqit Tbilisi) | 1 | 366 |
| Azerbaijan (Diyanet, 6 cities) | 6 | 2,190 |
| Azerbaijan (nam.az, 4 cities) | 4 | 1,460 |
| Mongolia (Diyanet, 3 cities) | 3 | 1,095 |
| Uzbekistan (islom.uz, 7 regions) | 7 | 210 |
| Afghanistan (tawkit, 8 cities) | 8 | 240 |
| **total** | **74** | **21,569** |

Captures: 234 files at the top level plus 156 `tj-ntime` month responses and four `az-namaz`
per-day archives holding 372 pages each (every 2026 date plus the impossible ones, 1,488 pages),
71 MB. New settlement inventories banked as publisher lists: Kyrgyzstan
(115 settlement codes), Diyanet Turkmenistan (33), Georgia (36), Azerbaijan (37), Mongolia (67),
Afghanistan (307 city slugs), islom.uz (91 regions with coordinates and differ_minute).

## 12. Next

- Turkmenistan and Mongolia need an authority witness; the Diyanet tier is a platform, and the
  record's grading vocabulary allows only community/platform there. Search Turkmen and Mongolian
  state domains again with the platform data in hand as the thing to match.
- Mongolia's summer clamp needs its own rule test (fixed interval vs 1/7 night vs a Diyanet
  takdir form) across all 67 settlements the tree offers.
- Afghanistan's 307-city inventory is the deepest in the record and only 8 cities were taken; the
  remaining 299 are one request each, same tawkit month.
- Kyrgyzstan's ratio ridge should be tested on a city outside the 20, ideally one at the eastern
  or western extreme of longitude, to see whether k moves with the arc of the day.
- The Diyanet temkin block (sunrise -7, dhuhr +5, asr +4, maghrib +7) reproduced identically in
  three countries here. Testing it against a Diyanet-EU city would settle whether it is one global
  template or a regional one.
- takvim.tj's 19-city list is one city wider than the authority's offset list; the missing city is
  worth resolving, and its city selector needs a browser to read (the pages served no rows to a
  plain fetch).
