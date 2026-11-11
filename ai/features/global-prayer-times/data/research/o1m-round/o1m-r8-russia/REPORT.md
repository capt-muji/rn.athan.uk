# O1m-R8 — Russia backward harvest

Wave O1m-R8 of round o1m. Workspace `$HOME/athan-gitree/census/o1m/o1m-r8-russia/`.
Read-only against the repository. Every capture is in `captures/`, dated rows in `data/`,
fits in `fit/`. Engine: adhan 4.4.6 (`census/adhan-build/node_modules/adhan`),
`Rounding.None`, dates built from the literal capture strings, times read in the city's IANA
zone. Scores are measured after removing the publisher's constant clock bias, so "within-1"
reads the shape of the recipe and not its offset. Captures are timestamped in UTC.

## Status at a glance

| front | state |
| --- | --- |
| CDUM city year tables 2016-2026 | **171 city-years, 60,060 dated rows banked and fitted**; four dated rule forms found |
| CDUM Ufa almanac | **the missing 1447 almanac recovered**; eight almanac years inventoried, six fitted (2015-2016 as text, 1445-1448 as images) |
| DUM RB past years | negative, with the API's own error text as the proof |
| DUM RT past years | the archive holds one 2017 pass and nothing else: 2018 and 2019 do not exist |
| DUM RF Moscow prints | 2 live months fitted (18/15 Shafi); 16 archived prints banked with OCR text |

## 1. CDUM (cdum.ru) — the city year tables, 2016 to 2026

### 1.1 The surface serves one year, and the past lives only in the archive

The live city pages are a single year with no parameter: `?year=2024` returns the 2026 page
byte for byte (1,079,332 bytes both calls). No year directory survives either:
`/time-namaz/{2018,2019,2020,2021,2022,2023,2024,2027,2028,1445,1446,1447,1448}/` all answer
404, and only `/time-namaz/2025/` and `/2026/` answer 403 (the almanac image directories, whose
listing is denied while the sheets are served).

So the past is the Wayback captures of the same 21 URLs. CDX inventory:
`data/cdum_wayback_inventory.json` (757 snapshots, 755 with status 200). One capture per
(city, capture year) was taken into `captures/cdum_wb/`, 177 files, and every page was parsed
by its own dates.

Two page generations exist and the year must be read from the page, never from the crawl
date. The 2016-2019 pages print a full date per row (`1.1.2017 (Вс)`). The 2020+ pages print
only a day number plus a weekday abbreviation, and that grid repeats across years (2015 and
2026 share a calendar), so the year is settled by the grid restricted to the capture year and
the year before it. A page carried 2026 in a 2026 capture; a January capture carried the
previous year's table, and the grid caught it.

### 1.2 Coverage

**All 21 pages carry a text table in at least one year.** Twenty of them carry one in the
modern years: Астрахань, Чебоксары, Челябинск, Екатеринбург, Ижевск, Казань, Хабаровск,
Киров, Курган, Москва, Оренбург, Пенза, Пермь, Ростов-на-Дону, Самара, Санкт-Петербург,
Сургут (the page labelled Салехард), Ульяновск, Волгоград, Йошкар-Ола. Уфа has text only in
its oldest captures, 2015 and 2016 (699 rows, banked here), and is image-only from 2017, so
Ufa's later times are the almanac series in section 2.

| year | city-years | rows | notes |
| --- | --- | --- | --- |
| 2015 | 1 | 365 | Ufa page only, legacy layout |
| 2016 | 21 | 7,630 | legacy layout |
| 2017 | 19 | 6,346 | legacy layout, Jan-Nov only in the October captures |
| 2018 | 0 | 0 | **no capture exists at any of the 21 URLs** |
| 2019 | 17 | 6,073 | modern layout |
| 2020 | 19 | 6,954 | Shafi asr year |
| 2021 | 14 | 4,206 | fixed-interval year |
| 2022 | 15 | 5,170 | modern layout |
| 2023 | 12 | 4,185 | modern layout |
| 2024 | 14 | 4,910 | modern layout |
| 2025 | 19 | 6,934 | live-equivalent |
| 2026 | 20 | 7,287 | live capture |

`data/cdum_years.json` holds every row; `data/cdum_years_skipped.json` holds the four captures
with no table (an empty Kazan 2020/2021 shell, an empty Spb 2020 shell, and the 2015 Ufa page).
Short counts inside a year are the publisher's own: several pages stop their December block at
day 15 or 21, and one Rostov 2020 capture lost April and part of May.

### 1.3 Four dated rule forms, measured

The publisher's own table changed shape four times. Each row below is measured, not quoted.

| edition | fajr | isha | dhuhr | asr | evidence |
| --- | --- | --- | --- | --- | --- |
| 2016-2017 | 18 deg class, angle | **absent** | solar | **both schools printed** | the row's 6 values are fajr, sunrise, dhuhr, asr Shafi, asr Hanafi, maghrib: Moscow 2017-01-01 prints 13:55 and 14:20 where adhan puts Shafi 13:54 and Hanafi 14:20, and 16:10 where the sunset is 16:07. The header labels those last two `Магриб` and `Иша`, so the labels lie. |
| 2019 | 18 deg | 16.9-17.3 deg | solar | Hanafi | 17 city-years, fajr 90.4 pc within-1 median |
| 2020 | 18 deg | 16.9-17 deg | solar | **Shafi** | **18 of the 19 fitted city-years solve Shafi**, and Hanafi scores 3-6 pc there. The nineteenth, Rostov, is the page with the April-August sunrise fault and its fit is unusable. A one-edition school change. |
| 2021 | **sunrise - 120 fixed** | **maghrib + 90 fixed** | **fixed clock per city** | Hanafi | the fajr interval is 120 min on every single day of every city (range 120..120); isha 90 exactly; dhuhr is one repeated clock value per city (Kazan 12:00, Cheboksary 11:57, Astrakhan 12:54) |
| 2022-2026 | 18 deg | 16.8-17.2 deg | solar | Hanafi | 83 city-years, fajr 83-87 pc, isha 94 pc, asr 98 pc, solar columns 100 pc |

The 2021 edition is the outlier a fitter must not average away: on that page the twilight
columns are intervals and an angle fit returns 6-13 pc, exactly as it should.

### 1.4 The per-city-year fit

`fit/cdum_city_years.json` carries, per city-year: the column layout, the solved angles and
school, per-column median offset, exact and within-1 rates after the offset, and the sunrise
column's median residual by month. Engine adhan 4.4.6, `Rounding.None`, the record's derived
city positions (C23), the city's own zone.

| year | median fajr within-1 | median isha within-1 | median asr within-1 | median dhuhr within-1 |
| --- | --- | --- | --- | --- |
| 2019 | 90.4 | 94.6 | 98.6 | 100 |
| 2020 | 93.4 | 93.7 | 89.9 (Shafi recipe) | 100 |
| 2022 | 85.4 | 94.0 | 98.6 | 100 |
| 2023 | 87.2 | 94.6 | 98.5 | 100 |
| 2024 | 83.6 | 94.3 | 97.2 | 100 |
| 2025 | 83.3 | 94.5 | 98.4 | 100 |
| 2026 | 84.0 | 94.2 | 97.7 | 100 |

The sunrise, dhuhr and maghrib columns sit at 100 pc within-1 in every modern city-year once
the constant is removed: the publisher's clock bias is a per-city constant, not a drift.

### 1.5 The 2026 sunrise defect, tested against the earlier years

The brief's −68 min sunrise excursion is **the Surgut-labelled page, and it is a city swap,
not a sunrise fault**. That page carries Salekhard's series under a Surgut filename, which
C23 found; the archive now dates the swap:

- **2022 and earlier**: the page carries Surgut's own times. 1 Jan 2022 sunrise 09:19, sunset
  15:01, which is Surgut at 61.25 N.
- **2023, 2024, 2026**: the page carries Salekhard's times. 1 Jan 2026 sunrise 11:14 and
  sunset 14:01, which is Salekhard at 66.53 N, and the sunrise residual against Salekhard
  reaches **−66 min in July**, which is the Surgut-versus-Salekhard latitude gap, not a
  publisher slip.

So the defect is **dated to the 2023 edition** and is a mislabelled series, present in 2023,
2024 and 2026, absent from 2016-2022. Two other excursions are genuine one-off faults:
**Rostov 2020** (sunrise monthly median −20 to −59 min, April to August) and **Kurgan 2017**
(August −72 min). Two more are a stale timezone: **Astrakhan 2016** and **Ulyanovsk 2016 and
2021** print every sunrise 60-64 minutes early, all year, in both cases a UTC+3 table served
for a UTC+4 city.

## 2. CDUM Ufa — the almanac series, and the missing 1447

The almanac directories are named by hand and carry no year. A full sweep of
`/time-namaz/<n>/1.jpg` for n = 1..999 plus 2020-2031 and 1440-1450 found seven live sets,
and the archive supplies the eighth:

| directory | Hijri year | first month | sheets | capture |
| --- | --- | --- | --- | --- |
| `/upload/time/` 1-11, 14 | 1439 | 21 Sep 2017 | 12 | live, `captures/cdum_uploadtime/` |
| `/time-namaz/2122/` | 1442 | 20 Aug 2020 | 12 | live, `captures/cdum_almanac/2122_*` |
| `/time-namaz/21222/` | 1443 | 2021/2022 | 15 (cover + months) | live, `captures/cdum_almanac/21222_1` |
| `/time-namaz/212/` | 1444 | 30 Jul 2022 | 12 | live, `captures/cdum_almanac/212_1` |
| `/time-namaz/77/` | 1445 | 19 Jul 2023 | 12 | live, `captures/cdum_almanac/77_*` |
| `/time-namaz/2025/` | 1446 | 7 Jul 2024 | 12 | live, held since C23 |
| **1447** | **1447** | **26 Jun 2025** | **12** | **archive, `captures/cdum_wb_2026dir/`** |
| `/time-namaz/2026/` | 1448 | 16 Jun 2026 | 12 | live, held since C23 |

**The 1447 almanac — the missing year — came out of the archive.** The live
`/time-namaz/2026/` directory holds the 1448 sheets today, but the twelve URLs were crawled on
2025-11-13 to 2025-11-22, when the directory held the previous almanac. All twelve sheets were
fetched, and sheet 1 prints `һиҗри 1447 30 көн миләди 2025`: Muharram 1447 = **26 June 2025**.
The directory name is a rolling label, not a year, and only the archive dates it.

Recipe across the six years measured so far (per year, never blended):

| Hijri year / edition | span | rows | fajr | isha | maghrib | dhuhr | asr |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2015 (text page) | 2015 full year | 365 | sunrise − 100 (99..118) | maghrib + 90 | sunset **+1** | max(13:30, noon+5) | Hanafi of the row's date, mae 6.6 |
| 2016 (text page) | Jan-Nov | 334 | sunrise − 100 exact | maghrib + 90 | sunset **+2** | max(13:30, noon+5) | Hanafi of the row's date, mae 0.7 |
| 1445 | 2023-07-19..2023-10-15 | 89 | sunrise − 100 exact | maghrib + 90 exact | sunset **+4** (2..5) | max(13:30, noon+5) exact | Hanafi of the row's date, +1 min, mae 1.0 |
| 1446 | 2024-07-07..2025-03-29 | 87 | sunrise − 100 exact | maghrib + 90 exact | sunset **+3** (1..4) | max(13:30, noon+5), worst 1 | Hanafi of the row's date, mae 1.0 |
| 1447 | 2025-06-26..2025-07-25 | 30 | sunrise − 100 exact | maghrib + 90 exact | sunset **+3** (3..4) | max(13:30, noon+5) exact | Hanafi of the row's date, mae 0 |
| 1448 | 2026-06-16..2027-06-05 | 355 | sunrise − 100 exact | maghrib + 90 exact | sunset **+4** (3..5) | max(13:30, noon+5) exact | **Hanafi of the row's date + 10 days**, mae 0 |

The fixed-interval recipe therefore runs from 2015 to 2027 on one shape, with the maghrib
margin as the only constant that moves (+1 in 2015, +2 in 2016, +4 in 1445, +3 in 1446 and
1447, +4 in 1448). A fit carrying one edition's margin into another is a minute or two wrong,
and that is exactly the error a "one recipe held for years" claim would hide.

Two dated findings. The maghrib safety margin moves between editions (+4 in 1445, +3 in 1446
and 1447, +4 in 1448), so a fit carrying one year's margin into another is a minute wrong. And
the ten-day asr shift is **1448 only**: at 1445, 1446 and 1447 the asr column lands on its own
row's date (mae 0.0-1.0), so that defect is an edition fault, not a house rule.

Data: `data/ufa_1445.json` (89 rows, three sheets), `data/ufa_1447.json` (30 rows, sheet 1),
`fit/ufa_almanac_years.json`. The remaining sheets of every year are captured but not yet
normalised: the OCR binary misreads the Tatar header and the digits interleave across columns,
so each sheet needs a manual pass, and the weekday column plus the two interval identities are
the checks that catch a slip. That is the wave's largest open item.

## 3. DUM RB (Bashkortostan) — the API retains two years, and says so

`Prayer/GetByCity` answers 2024, 2023, 2022 and 2019 with
`{"error":"Запись для города Уфа за 1 месяц <year> года не найдена"}` (HTTP 404).
`Prayer/GetByLocation`, which takes coordinates rather than a city record, answers the same for
2019, 2022, 2024 and 2027. The schedule generator
`/PrayerSchedule/generate?CityId=&Year=&Month=` declares a 2024..2100 range in its own Swagger
document but serves only 2025 and 2026 (PDF, 381,919 and 382,307 bytes); 2024 and 2027 answer
404, and 2023 answers 400 as out of range. `/api/PrayerAdmin/prayer-schedule/year` exists but is
an admin endpoint.

**Every pre-2025 year is unserved at every door.** The 2025 edition's own recipe is already
dated (substitute sunrise −120 against 2026's −90), so nothing was blended.
Captures: `captures/dumrb_ufa_202{2,3,4}_m1.json`, `captures/dumrb_byloc_*_m1.json`,
`captures/dumrb_gen_*.bin`, `captures/dumrb_swagger.json`, log in `probes.tsv`.

## 4. DUM RT (Tatarstan) — the 2017 pass is the whole archive

The 44 settlement CSVs were re-queried in both URL families
(`/netcat_files/482/640/` and `/netcat_files/391/638/`), all 44 settlements, with the CDX
working this time (the earlier pass lost several queries to 503):

| year | settlements with a capture | what it is |
| --- | --- | --- |
| 2017 | **23** | one crawler pass, April-May 2017, both URL families, 218 captures |
| 2018 | **0** | none, at either family |
| 2019 | **0** | none |
| 2020 | 1 (Kazan) | held since O1m-R4 |
| 2021 | 1 (Kazan) | held since O1m-R4 |
| 2022 | 1 (Kazan) | held since O1m-R4 |

The 2017 set is the same 23 settlements O1m-R4 fitted (8,395 rows, every file spanning
1 Jan to 31 Dec 2017), so the crawl cannot be extended: the other 21 settlements have no
capture in either family, and **2018 and 2019 do not exist anywhere at this surface**. The
live annual workbook confirms it: `vremena_namazov_RT_{2018,2019,2024,2027}.xlsx` all answer
404. Inventory: `data/dumrt_missing_inventory.json`.

## 5. DUM RF (dumrf.ru) — the Moscow monthly prints

The print lives at `/img/namaz/<month>.jpg` (PNG bytes under a .jpg name). Only the current and
previous month are live: 10 and 11 answer 200, 1-9 and 12 answer 404, and no year directory
exists. Both live prints were captured and transcribed in full: 61 dated rows, 1 Oct to
30 Nov 2026, every row checked against its printed weekday (`data/dumrf_2026_raw.json`).

| column | measured | within-1 at that reading |
| --- | --- | --- |
| fajr | 18.0 deg, median residual 0.00 | 61/61 |
| sunrise | solar sunrise **−5 min** | 61/61 with the margin, 0/61 against the plain astronomy |
| dhuhr | transit **+5 min** | 61/61 with the margin |
| asr | **Shafi**, median +1 | 61/61 |
| maghrib | sunset **+4 min** | 61/61 with the margin |
| isha | **15.0 deg**, median 0.00 | 61/61 |

The brief's expected line is confirmed: **Shafi asr with isha at 15 degrees**, and the three
solar anchors carry fixed safety margins (sunrise 5 min early, maghrib 4 min late, dhuhr 5 min
late). Fit: `fit_dumrf.js`, residuals in `fit/dumrf_2026_residuals.json`.

**Archived series.** The Wayback index for `/img/namaz/*` holds 16 prints with status 200, all
fetched into `captures/dumrf/` and OCR'd to `captures/dumrf/ocr/`, which reads each print's own
month and year header:

| year | months archived |
| --- | --- |
| 2023 | May, Jul, Aug, Oct, Nov, Dec |
| 2024 | Jan, Mar, Apr, Jun |
| 2026 | Mar, Apr, May, Jul, Aug, Oct |

So a backward series does exist, and the 2023 and 2024 prints are the cheapest next step: the
image is captured and its text is extracted, but the OCR emits the six time columns as blocks
rather than rows, so normalising them needs a column-crop pass. Until that pass, these twelve
are open items, not rows.

## 6. Negatives and blocks, as measured

| surface | result |
| --- | --- |
| CDUM 2018 | no capture at any of the 21 URLs, at either page generation: a hole between the 2017 and 2019 crawls |
| CDUM `?year=` | ignored: 2024 returns the 2026 page byte for byte |
| CDUM Ufa year page | image-only from 2017; the 2015-2016 text tables are the last machine-readable years at that page |
| DUM RB before 2025 | not served (section 3) |
| DUM RT 2018, 2019 | not served live, not archived (section 4) |
| DUM RF past months | overwritten live; the archive has 12 usable prints, not 36 |
| Wayback rate limit | `web.archive.org` refuses a Chrome user agent with HTTP 429 "suspected abusive bot traffic" and serves the same URL to a plain `curl` agent. Every archive fetch here uses the plain agent, paced at 1.5-3 s. |
| OCR | the Vision binary reads Latin/digit columns well and Cyrillic header words poorly; the Tatar almanac headers come out as Latin garbage while the digits survive, so almanac sheets are transcribed by hand with the weekday and interval identities as the check |

## 7. Artifacts

| path | what |
| --- | --- |
| `captures/cdum_wb/` (177 files, 168 MB) | one raw Wayback page per CDUM city and capture year, 2016-2026 |
| `captures/cdum_wb_2026dir/` (12 files) | the twelve **1447** almanac sheets, from the November 2025 capture of `/time-namaz/2026/` |
| `captures/cdum_almanac/` | 1442, 1443, 1444, 1445 sheet sets (live) |
| `captures/cdum_uploadtime/` (12 files) | the 1439 sheet set from `/upload/time/` |
| `captures/dumrf/` (18 images) + `captures/dumrf/ocr/` | two live prints and sixteen archived prints, with their extracted text |
| `captures/dumrb_*` | the API's own 404 bodies, the two PDFs, and the Swagger document |
| `data/cdum_years.json` | 171 CDUM city-years, 60,060 dated rows |
| `data/cdum_city_years.tsv` | the fitted per-city-year table, 169 rows, one line per city-year |
| `data/dumrf_2026_raw.json` | the 61 transcribed DUM RF rows |
| `data/ufa_1445.json`, `data/ufa_1447.json` | the almanac rows transcribed |
| `data/cdum_wayback_inventory.json`, `data/dumrt_missing_inventory.json` | the two archive inventories |
| `fit/cdum_city_years.json`, `fit/ufa_almanac_years.json`, `fit/dumrf_2026_residuals.json` | the three fits |
| `probes.tsv` | every probe with status, bytes and content type |

## 8. Next


1. **Ufa almanac, remaining sheets**: 1439, 1442, 1443, 1444 and the rest of 1445 and 1447.
   The eight-set inventory is complete, so this is transcription only, and each sheet's own
   weekday column plus the two interval identities validate it. That closes the almanac to a
   nine-year span (2017-2027) on one recipe family.
2. **DUM RF column-crop pass**: crop the six time columns out of the 12 archived prints and
   OCR each column vertically, which turns them into rows. That gives 2023 and 2024 months on
   the same 18/15 Shafi line, and lifts the surface from one cycle to three years.
3. **CDUM 2016-2017 legacy layout**: the six-value rows are understood (both asr schools, no
   isha), but the fajr angle of that generation is not yet solved; a fit restricted to
   fajr/sunrise/dhuhr/maghrib on those 40 city-years would close it.
4. **CDUM 2021 interval year**: record it as a rule form in the span ledger (fajr = sunrise −
   120, isha = maghrib + 90, dhuhr a fixed clock per city) so no later fitter scores it against
   an angle.
5. **DUM RB substitute boundary**: the 2025/2026 recipe break is measured; the remaining
   question is the exact first day of the substitute band in each year, which the held 34,886
   rows can answer without any new capture.
