# O1m-32 Central Asia appeal

Wave O1m-32 of round o1m. Workspace `$HOME/athan-gitree/census/o1m/o1m-32-caappeal/`.
Read-only against the repository. Engine: adhan 4.4.6
(`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`), `Rounding.None`, dates built from
the literal capture strings, times read in the city's own zone. Captures timestamped in UTC.
Nothing is called complete.

## Status at a glance

| front | state |
| --- | --- |
| Kyrgyzstan | **all 115 settlements banked on one recipe**, 41,975 dated rows; the endpoint is year-blind, re-proved over a full year at three settlements |
| Bashkortostan | the door now located and working; **retention is 2025-2026 exactly**, every pre-2025 year refused by the API's own error text |
| Tatarstan | **2016 and 2017 recovered at all 44 settlements**, not 23: the "21 missing" were renamed files; 32,164 rows bought, both years at 100 pc within-1 |
| Kazan (single city) | nine archived editions 2017-2025 on one recipe; the 2025 rows of the 2024 file are byte-identical to today's live file |
| Tajikistan | the archive floor is **2014-12**, proved with a working control; dhuhr is a **monthly constant**, two eras plus one month |
| Uzbekistan | the portal API carries no prayer route at all; no second year found on any Uzbek surface |

## 1. Kyrgyzstan: 115 settlements, and the recipe holds nationwide

Surface: `https://muftiyat.kg/ru/api/v1/calendar/{locationId}/?start=DD-MM-YYYY&end=DD-MM-YYYY`
(authority, Spiritual Administration of Muslims of Kyrgyzstan). The window is clamped: two
months answer 200, three months answer 302 with no body. Six two-month windows cover a year.

### 1.1 The settlement inventory, enumerated

`captures/kg-index/` holds one one-day response per id for ids 1-130. **115 answer, 15 are 404
gaps** (ids 3, 13-21, 27, 28, 48, 55, 56), and each response carries the settlement's own name
and the oblast the publisher files it under:

| oblast | settlements |
| --- | --- |
| Жалал-Абадская | 25 |
| Баткенская | 18 |
| Ошская | 16 |
| Иссык-Кульская | 15 |
| Чуйская | 14 |
| Нарынская | 14 |
| Таласская | 11 |
| Чоң шаарлар (the two cities) | 2 |

All 115 were pulled for 2026: 690 window requests, **41,975 dated rows**, every settlement a
full 365 days. `data/kg_manifest.json` is the inventory, `data/kg-<id>-<slug>-2026.json` the
rows. The 20 settlements banked in O1m-10 were re-pulled here so the national set is one pull
on one day, and the two sets agree.

### 1.2 Points recovered from the tables, no gazetteer

Kyrgyzstan's list carries no coordinates. They are recoverable from the served columns
themselves: day length fixes the latitude, the sunrise-sunset midpoint fixes the longitude.
Both columns then reproduce at 0.26-0.29 min MAE across 41,975 rows, which is the one-minute
grid and nothing else.

### 1.3 One recipe, 115 settlements

Measured at each settlement's own recovered point, margins applied, nothing removed:

| column | recipe | exact med | within-1 med | within-1 min | MAE med | worst |
| --- | --- | --- | --- | --- | --- | --- |
| fajr | 18.0 deg | 90.4 | 100 | 100 | 0.27 | 1.0 |
| sunrise | astronomical | 92.6 | 100 | 99.7 | 0.26 | 2.7 |
| dhuhr | transit **+0.5 min** | 92.3 | 100 | 100 | 0.26 | 1.3 |
| asr | Hanafi **+2 min** | 42.5 | 100 | 98.9 | 0.59 | 4.5 |
| maghrib | sunset **+7 min** | 43.6 | 100 | 99.7 | 0.58 | 3.8 |
| isha | maghrib + round(0.775·(sunrise−fajr) + 3.5) | 49.6 | 97.0 | 92.6 | 0.54 | 2.0 |
| ALL | | 68.5 | 99.5 | 98.6 | 0.41 | 4.5 |

(percent of cells, except the two margin columns and the MAE and worst columns, which are
minutes.)

Two constants here are new to the record. O1m-10 recorded fajr 18.0, maghrib sunset +7 and the
isha ratio, but scored the asr column at 52-63 pc within-1 and left dhuhr unscored. Measured
without a margin, the asr column sits at a mean **+1.84 min** at every one of the 115
settlements and the dhuhr column at **+0.51 min**: both are publisher constants, so the asr is
Hanafi + 2 and the dhuhr is the transit rounded up. With the margins in, both columns reach 100
pc within-1.

The isha ratio is still a ridge, not a point, and the ridge is now 115 settlements wide:

| k | c | within-1 |
| --- | --- | --- |
| 0.770 | 4.00 | 96.91 |
| 0.775 | 3.50 | 96.89 |
| 0.765 | 4.50 | 96.87 |
| 0.780 | 3.00 | 96.80 |

The recorded band 3.2-3.5 holds. `fit/kg-isha-ridge.json` carries the sweep.

### 1.4 The asr column carries a seasonal term, and it is the publisher's

The asr margin is not one constant. Monthly means at Bishkek run +1.05 min in February,
+1.28 in January and April, +1.63 in June, **+2.75 in September and October**, +1.84 in
December: a 1.7-minute seasonal swing with an autumn maximum. A single +2 margin is the best
constant available and leaves 0.59 min MAE; the swing is the shape of a different asr
computation, not a defect at one city, because all 115 settlements carry the same mean.

### 1.5 Year-blindness re-proved over a full year

Three settlements pulled before this wave have nothing to do with the test: Ak-Say (id 62),
Erkeshtam (id 105) and Kumtor (id 126) were chosen because they are at the country's
south-west, south-east and high-mountain extremes. January-February pulled for 2026, 2027 and
2030 at each, then the remaining ten months of 2027 at Kumtor and Ak-Say:

| test | result |
| --- | --- |
| 2026 vs 2027, Jan-Feb, three settlements | 0 cell differences of 472 |
| 2026 vs 2030, Jan-Feb, three settlements | 0 cell differences of 472 |
| 2026 vs 2027, **all 365 days**, Kumtor and Ak-Say | 0 cell differences |
| date strings | follow the requested year |

The 2027 label is banked in `captures/kg-yr-*` as the record asks, and it is the same
generation relabelled: the endpoint cannot produce a second year, so Kyrgyzstan stays one
published cycle. This is stronger than "not found", and it now covers the whole published
settlement set rather than twenty cities.

## 2. Bashkortostan: the door works, and it retains two years

The API is `api.dumrb.com`. The prior record probed `/GetByCity` at the root, which answers 404
with an empty body and proves nothing. The live route is `/Prayer/GetByCity`:

| probe | status | body |
| --- | --- | --- |
| `/Prayer/GetByCity?cityId=1&year=2026&month=1` | 200 | 4,162 bytes of Ufa's January table |
| `/Prayer/GetByCity?cityId=1&year=2025&month=1` | 200 | 4,534 bytes |
| `/Prayer/GetByCity?cityId=1&year=2024&month=1` | 404 | `{"error":"Запись для города Уфа за 1 месяц 2024 года не найдена"}` |
| `/Prayer/GetByCity?cityId=1&year=2023&month=1` | 404 | same, year 2023 |
| `/Prayer/GetByCity?cityId=1&year=2022&month=1` | 404 | same, year 2022 |

Every year from 2015 to 2024, every month of 2024 and 2023 and 2022, and 2027 and 2028 answer
the API's own not-found text. A working control sits on the same door: 2025 and 2026 return
tables. So the retention boundary is **2025-2026 exactly**, and this is now a measured negative
rather than a failed request. `data/dumrb_year_sweep.tsv` and `data/dumrb_probe.tsv` hold the
170 probes, `captures/dumrb/` the bodies.

One dated field change is visible across the boundary: `suhurDo` is `null` on every 2025 row at
Ufa and populated on every 2026 row (`07:23` on 1 January), so the publisher added the suhur
field with the 2026 edition.

`/api/DraftPrayerSchedule` carries `cityId`, `year` and `month` and would answer the past, but
it answers 401 to an anonymous request and the key route is `/ApiKey/create` behind a login.
It is recorded as a blocked door, not probed further.

## 3. Tatarstan: the live CSVs are one rolling two-year edition

`https://dumrt.ru/help-info/prayertime/` lists 44 settlements, each as a CSV under
`/netcat_files/482/640/<Slug>.csv?t=111126`. The same 44 answer under the second family
`/netcat_files/391/638/` with identical bytes.

**The file is not one year.** Kazan.csv today is 730 rows spanning **2025-01-01 to 2026-12-31**,
and all 44 settlements are the same: 44 files, **32,119 dated rows** over two calendar years.
The column layout is `date;fajr;mosqueFajr;sunrise;zawal;dhuhr;asr;maghrib;isha;qibla`, and the
2026 half drops the qibla column, so the two halves are two editions in one file. Note that the
2025 half prints `dhuhr` as a fixed `12:00` per row while `zawal` carries the transit: the fixed
jamaah clock the record already flagged is still there.

### 3.1 The record's "21 settlements with no 2017 capture" were renamed files

The 2017-era family is `/netcat_files/391/638/`, and it names **21 of the 44 settlements
differently** from today's list. The record's negative counted names, so it lost those files:

| current file | 2017 file |
| --- | --- |
| Aleksey | Alekseevsk |
| Almet | Almetevsk |
| Bavli | Bavly |
| Bolgary | Bulgar |
| BolshAtna | BolAtnya |
| BolshieKaybesy | BolKaybizi |
| Cheremsan | Cheremhan |
| Chistop | Chistopol |
| KamskoeUstye | KamskoeUste |
| Laish | Laih |
| Mamadis | Mamadih |
| Menzilinsk | Menzelinsk |
| Muslimov | Muslumovo |
| Novosesminsk | Novohehminsk |
| Pestrezy | Pestrezi |
| RibnayaSlpboda | RibnayaSloboda |
| Sarmanovo2 | Sarman |
| StaroeChuprale | StaroeDrogganoe |
| Tet2 | Tatuhi |
| VerhUslon | VerhnyUslon |
| VicokayGora | VisokayaGora |

23 names are unchanged; **exactly the 21 above are the record's "other 21"**. They are not
missing from the crawl, and a prefix query over the whole `/netcat_files/` tree settles it.

### 3.2 A 2016 edition exists, and it covers all 44 settlements

The 2016 crawl of the second family saved 44 files named `*_15.csv` (`Aznakay_15.csv`,
`Kazan_2015.csv`, and so on, with the Tatar transliterations percent-encoded in the URL). All 44
answer 200. Their rows are not 2015: each file is a thirteen-month window holding **December
2015 plus the whole of 2016**.

| year | settlements | rows | span | fitted |
| --- | --- | --- | --- | --- |
| 2015 | 44 | 1,364 | 2015-12-01 to 2015-12-31 | not fitted (one month) |
| **2016** | **44** | **16,104** | 2016-01-01 to 2016-12-31 | **41 of 44 at 100 pc within-1** |
| **2017** | **44** | **16,060** | 2017-01-01 to 2017-12-31 | **42 of 44 at 100 pc within-1** |

So Tatarstan holds two full years across the entire published settlement set. The prior record
held one year at 23 settlements.

### 3.3 Fits: 2016 and 2017, all 44 settlements

Each settlement's point is derived from its own sunrise and sunset columns, then matched to the
nearest point in the record's C23 position set as the identification check. C23's engine scores
the rows: 18/15 Hanafi, the floor/ceil pass swept per column, the substitute rule
(fajr = sunrise−120, isha = maghrib+90 while the 18-degree angle is unreachable), and the six
solstice transition days excluded.

| year | all-column within-1 median | min | MAE median | settlements at 100 pc |
| --- | --- | --- | --- | --- |
| 2016 | 100 | 99.9 | 0.38 | 41 of 44 |
| 2017 | 100 | 99.9 | 0.39 | 42 of 44 |

The worst cell anywhere in 32,164 rows is 1 minute. The three settlements below 100 pc (2016:
Archa, Biektau, Kukmara) sit at 99.9 with MAE 0.39-0.40, which is one day in a thousand.

**A naming caveat for any later fitter:** the geometric identification places `T_tesh_15`
(Tetyushi) 8 km from Bolgary, so the two neighbours are not separable by geometry alone; the file
name carries the settlement and the shape should not.

### 3.4 Kazan: nine editions on one recipe, and one frozen generation

The archive reached only Kazan after 2017, but it reached it repeatedly. Nine editions scored on
the same engine and the same recipe:

| year | rows | all-column within-1 | MAE | worst | pass (three-mode sweep, per column) |
| --- | --- | --- | --- | --- | --- |
| 2017 | 365 | 100 | 0.51 | 1 | all floor |
| 2018 (Dec) | 31 | 100 | 0.47 | 1 | asr round, rest floor |
| 2019 | 365 | 100 | 0.47 | 1 | all floor |
| 2020 | 366 | 100 | 0.48 | 1 | all floor |
| 2021 | 365 | 100 | 0.49 | 1 | all floor |
| 2022 | 365 | 100 | 0.48 | 1 | all floor |
| 2023 | 365 | 100 | **0.15** | 1 | **asr round**, rest floor |
| 2024 | 366 | 100 | 0.49 | 1 | **maghrib round**, rest floor |
| 2025 | 365 | 100 | 0.46 | 1 | **maghrib round**, rest floor |

Every edition reproduces at 100 pc within-1 with a worst cell of one minute, so the table is one
recipe from 2017 to 2025. What moves between editions is the per-column rounding pass, and a
729-point sweep over three modes per column finds it: five columns stay on the floor pass
throughout, **asr changes in the 2023 edition** (floor to round, which drops that year's MAE to
0.15, the cleanest edition in the span) and **maghrib changes in the 2024 edition** (floor to
round). So the pass changes twice, in 2023 and 2024, and not in 2025.

The 2025 rows inside the 2024-edition file are **byte-identical to today's live file**: 0 cell
differences over 365 days and nine columns. The publisher does not recompute the second year of
the rolling file; it relabels it. That is the frozen-generation class the grading rules name, and
the 2025 label is not an independent witness of the recipe.

### 3.5 What 2018 and 2019 are, exactly

| year | what exists | evidence |
| --- | --- | --- |
| 2018 | **nothing, anywhere** | a domain-wide prefix query over `/netcat_files/` for 2018-01-01..2018-12-31 returns 44 settlement files, **all 404**, crawled 2018-01-09 and 2018-01-12 |
| 2018 (Dec) | Kazan only | the 2019 file's thirteen-month window starts 2018-12-01 |
| 2019 | **Kazan only** | `Kazan2019.csv` under 391/638, two captures (2019-05-03, 2019-07-22), 365 rows |
| 2018-2020, any other settlement | nothing | the same domain-wide query returns three successful CSV captures in the whole three-year band, all Kazan |

The publisher's year-suffixed naming (`Kazan2019.csv`) is gone from the live site: `Kazan2018.csv`,
`Kazan2019.csv`, `Kazan2020.csv`, `Aznakay2019.csv` all answer 404 today, and
`vremena_namazov_RT_{2018,2019,2024,2027}.xlsx` likewise.

## 4. Tajikistan: the archive floor is 2014-12, and dhuhr is a monthly constant

`POST https://shuroiulamo.tj/tj/namaz/ntime` with `fmonth`, `fyear` and `fday=0`.

### 4.1 Backward to 2010: nothing, with a control at the same door

Seventy-two month probes fill 2008-01 to 2013-12. **Every one answers HTTP 200 with a 2-byte
body** (`data/tj-backward-index.txt`). The same door answers a full table for 2015-01 (31 rows,
8,420 bytes) and 2016-06 (30 rows), and the publisher's own year selector on
`https://shuroiulamo.tj/tj/namaz` lists exactly 2014 to 2026. The floor is **2014-12**: 2014-11
returns 2 bytes, 2014-12 returns 24 rows. The archive cannot be extended backward.

### 4.2 The dhuhr eras, dated to the day, with the mechanism measured

The published dhuhr is not a computed instant at all. Across 144 month cells it is **one constant
per month**:

| span | printed dhuhr | months |
| --- | --- | --- |
| 2014-12 to 2019-06 | **13:00** | 55 |
| 2019-07 to 2026-11 | **12:40** | 87 |
| **2020-10 only** | **12:50** | 1 |
| 2023-02 | 12:00 on one row, 12:40 on the other 26 | a defective row |

So the 2019 boundary is a 20-minute step on 2019-07-01 exactly (`fit/tj-dhuhr-series.json`,
day-level delta -20.2 min), and the October-2020 era is dated: **2020-10-01 to 2020-10-31
printed 12:50**, with the month either side on 12:40 (+10.3 min on 1 October, -10.0 on
1 November). The 2023-02 exception is the malformed 2023-02-13 row the record already carries
(12:00 against 12:40), not a third era.

The sawtooth visible in any offset-against-transit series is the transit moving under a fixed
printed constant, which is why the offset runs +1.4 min in February to +30.0 in November inside
one era. Any future fit must score this column as a constant, never as an angle.

## 5. Uzbekistan: no dated endpoint exists on the portal

The taqvim is a Next.js page that computes in the browser. Its own API is
`https://new.islom.uz/api/v1`, and the bundle's whole route list is `auth/user`, `authors`,
`authors/{id}`, `authors/{id}/counts` and `regions` (`captures/uz/chunks/`). Probed by route:
`prayer-time`, `prayer_times`, `prayertimes`, `namoz`, `times`, `prayer-time/{id}`,
`prayer-time/{id}/{year}/{month}`, `docs`, `schema`, `swagger` all answer 404 with the
framework's own route-not-found body. **There is no prayer-times route to carry a year**, so the
second-year question is closed by the surface rather than unfound.

Second-year alternatives, measured:

| surface | what it serves |
| --- | --- |
| `namozvaqti.uz/oylik/{month}/{city}` | a dated month, 31 rows, current year only; `?yil=2025` returns the 2026 page byte-identically (72,896 bytes both calls) and `/oylik/11/toshkent/2025` is 404 |
| `namozapi.uz` | a FastAPI wrapper with one route, `/namoz/{region}`; it answers **today only** (`date` field, no parameters) and its region ids are islom.uz's own (Tashkent 27, Namangan 15, Andijan 1) |
| `praytime.uz` | a region page computed from the clock, no year parameter |

So the Uzbek record stays at one cycle and the 15.5/15.5 zero-margin recipe keeps its
provisional grade. `differ_minute` still has no dated endpoint to appear on.

## 6. Negatives, with the languages and the surfaces searched

- **Kyrgyzstan second year**: structurally closed by the endpoint, re-proved over a full year at
  three settlements (section 1.5). Searched in Russian and Kyrgyz beside English.
- **Bashkortostan before 2025**: not served, with a working control on the same door (section 2).
  The draft-schedule route would answer but needs a key behind a login: blocked, not probed.
- **Tatarstan 2018**: nothing exists. A domain-wide prefix query over `/netcat_files/` for the
  whole of 2018 returns 44 settlement files, all 404, crawled on two January days. Searched in
  Russian and Tatar beside English, and by year-suffixed file names in both families.
- **Tatarstan 2019-2025, any settlement but Kazan**: the same domain-wide query returns three
  successful CSV captures in the whole 2018-2020 band, all Kazan.
- **Tajikistan before 2014-12**: 72 month probes, every one a 2-byte body, against a working
  control at 2015-01. The publisher's own year selector starts at 2014.
- **Uzbekistan second year**: no prayer route exists on the portal's API (eleven routes probed),
  `namozvaqti.uz` discards a year parameter byte-identically, `namozapi.uz` answers today only
  with no parameters, and `praytime.uz` computes from the clock. Searched in Uzbek, Russian and
  English.

## 7. Defects found

1. **The muftiyat.kg window is clamped to two months.** Three months or more answer HTTP 302
   with no body. A year needs six requests.
2. **DUM RT's rolling file relabels rather than recomputes.** The 2025 half of the current file
   is byte-identical to the 2025 half of a 2024-edition capture, 0 differences over 365 days and
   nine columns.
3. **DUM RT renamed 21 of its 44 settlement files**, which is what hid them from the previous
   pass. Any inventory keyed on today's names will keep missing them.
4. **DUM RT's `dhuhr` column is a fixed `12:00` while `zawal` carries the transit**, in the 2025
   half of the live file and in the 2016 files, so a fitter that treats `dhuhr` as the prayer
   instant will score a one-hour error.
5. **DUM RB's `suhurDo` is null on every 2025 row and populated on every 2026 row** at Ufa: the
   field arrived with the 2026 edition.
6. **Tajikistan's dhuhr is a monthly constant, not a computed instant**, and its 2023-02-13 row
   prints 12:00 against the month's 12:40.
7. **muftiyat.kg's asr column carries a 1.7-minute seasonal term** (mean +1.05 in February,
   +2.75 in September) at every one of the 115 settlements, so no single margin is exact.

## 8. Counts (script-derived)

| block | files | dated rows |
| --- | --- | --- |
| Kyrgyzstan, muftiyat.kg, 115 settlements, 2026 | 690 | 41,975 |
| Kyrgyzstan, 2027 label test, 3 settlements | 18 | 1,095 |
| Tatarstan, DUM RT, 44 settlements, 2016 | 44 | 16,104 |
| Tatarstan, DUM RT, 44 settlements, 2017 | 44 | 16,060 |
| Tatarstan, DUM RT, 44 settlements, 2015-12 | 44 | 1,364 |
| Tatarstan, DUM RT, live 44 settlements, 2025-2026 | 44 | 32,119 |
| Kazan, archived editions 2017-2025 (Kazan's 2017 counted twice) | 16 | 2,953 |
| Tajikistan, month probes 2008-2013 | 72 | 0 |
| **total banked in this wave** | **972** | **111,670** |

`captures/` 16 MB, `data/` 16 MB, `fit/` 596 KB. Nothing was written under a temporary directory
and the repository was not touched.

## 9. Next

1. **Tatarstan 2016 and 2017 at the remaining 40 settlements of the 44** are already banked here;
   the next step is the per-settlement table in `fit/dumrt_2016_44_fit.json` and
   `fit/dumrt_2017_44_fit.json` folded into the record's Russia position set, with the 21 renames
   recorded as aliases so no later pass loses them again.
2. **DUM RT's third family**: the 2018 pass shows a third slug set (`NabChelny`, `BolAtnya`,
   `RibnayaSloboda`) that no year-suffixed query would ever find. A prefix query per year band,
   not per name, is the only reliable inventory for this publisher.
3. **Kyrgyzstan's asr seasonal term** needs the publisher's own generator, or a shadow-factor
   sweep against the daily residuals, to say whether it is a different asr definition or an
   approximation in their solar engine.
4. **Uzbekistan** needs an authority surface with a year, not another aggregator: the portal's
   region list is banked and the recipe is settled, so only a dated table can lift the grade.
5. **Tajikistan's October-2020 month** is banked as an era; the next question is whether any
   other month in the 144-cell span carries a second value, which the held series can answer.

## 10. Stop note

This wave was closed on the owner's stop order, at 13:45Z. Banked and finished: all five jobs
above. Not banked, and left as they were: the archived DUM RF prints, the Ufa almanac sheets, and
any further Uzbek search. `data/dumrt-cdx-bands.log` shows the Wayback band sweep interrupted
after the 391/638 2019 band; every band that was read is saved under `captures/dumrt_cdx/`, and
the interrupted queries answer 503 and are not recorded as findings.
