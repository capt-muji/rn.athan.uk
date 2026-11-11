# O1m-R4 — the European backward harvest: Tatarstan, Czechia, Cyprus north

Workspace `$HOME/athan-gitree/census/o1m/o1m-r4-backward/`. Captured 2026-11-11, all timestamps UTC.
Engine for every fit: adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`,
`Rounding.None`, dates built from the literal capture strings, times read in the surface's own IANA
zone. The repository at `~/repos/rn.athan.uk` was not touched. Nothing under `/tmp`.

Live capture timestamps: Czechia 2026-11-11 08:14-08:41Z, Cyprus 2026-11-11 08:20-08:25Z,
Tatarstan 2026-11-11 08:08Z onward.

## Headline

- **Czechia grew from 4 city-years to 1,146.** The year selector is not year-limited: it renders
  2019-2030 on demand. 191 towns x 2019-2024 = **418,672 town-days** banked, plus both named cities
  across 2019-2030. The publisher's own method page names UOIF (France), **12 deg both**, and the
  fit returns **12.11 / 11.95, Shafi**.
- **Cyprus north has a hard archive floor at 2022-10-22, not 2019.** 45 of the 96 requested months
  return the current month and are counted as trap hits; 2019-2022-09 does not exist at this
  surface under any parameter. From 2022-10 onward the archive dates honestly and carries **two
  engine generations in a A-B-A-B pattern**, each reproducing at 100 pc within 1 min on five of six
  columns at zero mean residual.
- **Tatarstan's past years are not served live.** `dumrt.ru` carries one rolling two-year edition
  (2025+2026) and nothing else; 2027 is a 404. The Wayback holds one 2017 crawl covering 23 of the 44
  settlements, and a second urlkey family under `/ru/` whose Kazan captures add 2020, 2021 and 2022.

### Dated rows banked this wave

| front | rows |
| --- | --- |
| Czechia, 191 towns x 2019-2024 | 418,672 |
| Czechia, Praha and Brno x 2025-2030 | 4,382 |
| Cyprus north, 2022-10-22 .. 2026-12-31 | 1,505 |
| Tatarstan, 2017 (23 settlements) | 8,395 |
| Tatarstan, Kazan 2019-12, 2020, 2021, 2022 | 1,127 |
| **total** | **434,081** |

Raw: 225 MB in `captures/` (13,896 Czech month pages, 96 Cyprus month pages, 66 archived DUM RT
CSVs, plus every probe and error page). Normalised rows in `data/`, fits in `fit/`.

## 1. Czechia — islamweb.cz, 191 towns x 2019-2024

### 1.1 The surface

`https://islamweb.cz/casy/casy.php?year=YYYY&city=<id>&month=<1-12>`. The selector
(`casy/mesta.php`) is a `<select name="city">` of **191 towns** plus a `<select name="year">` that
offers only 2026 and 2027 — but the year is a query parameter the page honours for any value.
Probed 2019 through 2030 at Praha: twelve distinct pages, each stamped with its own year in the
header and each carrying that year's dates. **The selector understates the surface by nine years.**

Raw: 13,896 month pages, 217 MB, in `captures/czech/months/<city>_<year>_<month>.html`.
Parse: `parse_czech.py` -> `data/czech_<year>.json`. Every page is verified against its own header
(`město <B>X</B> - YYYY`) and its own row dates before a row is banked:
**0 name mismatches, 0 year mismatches, 0 row-date mismatches in 13,896 pages.**

| year | towns | town-days | days per town |
| --- | --- | --- | --- |
| 2019 | 191 | 69,715 | 365 |
| 2020 | 191 | 69,906 | 366 |
| 2021 | 191 | 69,715 | 365 |
| 2022 | 191 | 69,715 | 365 |
| 2023 | 191 | 69,715 | 365 |
| 2024 | 191 | 69,906 | 366 |
| **total** | | **418,672** |

(418,672 town-days is the full banked count, Řevnice included; 416,862 after its 2,187 empty rows
are set aside, which is the basis of every score below.) |

Held beyond the target for the two named cities only, as a forward test: Praha and Brno across
2019-2030, 730-732 rows a year. The 2027 and 2028 editions reproduce the 2026 recipe with the same
constants, which is the passing multi-year test the span ledger already recorded.

### 1.2 The method, stated by the publisher

`casy/metoda.html` (captured verbatim) records the decision: from 2005 the Czech organisations
published one unified table; from **2015** they moved to the method of the Union of Islamic
Organisations of France, **12 deg for fajr and 12 deg for isha all year**, on the arithmetic of
Dr Monzur Ahmed. The page names the bodies that adopted it (Ústředí muslimských obcí ČR, the Prague
and Brno foundations and communities, Karlovy Vary, Hradec Králové, Teplice) and states the reason
the older ISNA plus Umm al-Qura hybrid was dropped: two methods in one table.

The 2014/2015 change is a **dated regime change** and the whole 2019-2024 span sits after it, so the
six years are one regime and may be fitted together.

### 1.3 The fit — 12.11 / 11.95, Shafi, one recipe for 1,140 scored city-years

Angle search on Praha pooled over six years, margin free per column (the angle is identified by the
spread of the residual, not its level):

| parameter | value |
| --- | --- |
| fajr angle | **12.11 deg** |
| isha angle | **11.95 deg** |
| asr | **Shafi** (Hanafi loses 0.36 min of spread) |
| fajr margin | +0.57 |
| sunrise margin | -3.38 |
| dhuhr margin | +4.45 |
| asr margin | -0.57 |
| maghrib margin | +2.43 |
| isha margin | +0.02 |

The measured angles land on the published 12/12, which makes this a rare case where the stated
method and the served table agree to a tenth of a degree. The margins are within 0.15 min of the
span ledger's independent figures (sunrise -3.5, dhuhr +4.5, maghrib +2.5, asr 0).

### 1.4 The engine gap, per year — this surface is not adhan

| year | fajr exact/w1 | sunrise | dhuhr | asr | maghrib | isha |
| --- | --- | --- | --- | --- | --- | --- |
| 2019 | 0.9 / 77.2 | 0.7 / 72.3 | 0.8 / 84.0 | 0.3 / 56.3 | 0.4 / 67.6 | 0.2 / 48.2 |
| 2020 | 1.0 / 75.6 | 0.7 / 70.9 | 1.1 / 81.8 | 0.3 / 56.8 | 0.4 / 67.5 | 0.3 / 48.1 |
| 2021 | 0.9 / 79.9 | 0.6 / 75.2 | 1.0 / 87.4 | 0.2 / 54.6 | 0.4 / 66.7 | 0.2 / 48.9 |
| 2022 | 0.9 / 78.8 | 0.7 / 73.9 | 1.0 / 85.8 | 0.2 / 55.3 | 0.4 / 67.3 | 0.3 / 48.6 |
| 2023 | 0.9 / 77.3 | 0.7 / 72.3 | 1.0 / 84.1 | 0.3 / 56.3 | 0.4 / 67.4 | 0.2 / 48.3 |
| 2024 | 0.9 / 75.8 | 0.7 / 71.1 | 1.0 / 81.9 | 0.3 / 56.8 | 0.4 / 67.2 | 0.3 / 48.1 |

Scores are percentages of town-days: exact (same printed minute) and within 1 minute, after the
column's constant margin is removed. Řevnice (section 1.6) is excluded from every figure above;
its zeros would otherwise dominate the residual tails. Worst absolute residual across the 1,140
town-years is 1.63-3.17 min in every column.

The gap is a **smooth seasonal term, not a parameter error**. Mean residual by month at Praha,
2019-2024 pooled:

| month | fajr | sunrise | dhuhr | asr | maghrib | isha |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | -0.06 | 0.25 | 0.05 | -1.17 | -0.65 | -0.95 |
| 02 | 0.41 | 0.78 | 0.36 | -1.29 | -0.66 | -0.93 |
| 03 | 0.51 | 0.84 | 0.64 | -0.89 | -0.57 | -1.02 |
| 04 | 0.06 | 0.24 | 0.20 | -1.06 | -1.06 | -1.73 |
| 05 | 0.07 | -0.02 | -0.12 | -0.84 | -1.09 | -1.83 |
| 06 | 0.28 | -0.18 | -0.18 | -0.33 | -0.47 | -0.53 |
| 07 | -0.26 | -0.56 | -0.24 | 0.30 | 0.49 | 1.10 |
| 08 | -0.94 | -0.92 | -0.45 | 0.77 | 0.92 | 1.27 |
| 09 | -1.70 | -1.55 | -0.91 | 0.71 | 0.53 | 0.58 |
| 10 | -1.43 | -1.25 | -0.72 | 1.14 | 0.64 | 0.42 |
| 11 | 0.12 | 0.26 | 0.75 | 2.29 | 1.66 | 1.34 |
| 12 | 0.86 | 0.96 | 1.16 | 1.43 | 1.26 | 0.95 |

Amplitude 2.0-4.0 min peak to peak, identical shape in all six columns, no drift across the six
years. The record's "33-34 pc exact, 84-85 pc within-1" was measured with a per-prayer seasonal
correction; **without it the pooled within-1 is 67 pc**, which is the number this table supports.

### 1.5 One national table — the per-town spread is three points

The recipe carries no per-town term. Across the 1,140 scored town-years, the per-town within-1
scores span:

| column | median | p10 | min |
| --- | --- | --- | --- |
| fajr | 77.3 | 74.8 | 70.5 |
| sunrise | 72.6 | 69.9 | 66.4 |
| dhuhr | 84.1 | 81.7 | 80.6 |
| asr | 55.9 | 51.8 | 44.7 |
| maghrib | 67.2 | 63.8 | 58.7 |
| isha | 48.4 | 43.7 | 38.1 |

A spread this narrow over 191 towns and six years is one computation at 191 positions, not 191
tables. Czechia is a national line, and the engine gap above applies to every town alike.

### 1.6 Two published defects

- **Řevnice is structurally empty.** Its page prints latitude **449.92** and five of its six columns
  as **00:00 on every day**: 2,187 of 2,192 rows across 2019-2024 carry fajr, sunrise, asr, maghrib
  and isha all at zero, with only dhuhr populated (12:11 in January). The town is banked as captured
  and is excluded from every score.
- **Kladno is computed 1.35 deg north of itself.** The page prints 51.50 N for a town at 50.15 N, and
  the table matches the printed point: the day-length solve puts the served schedule at 51.52 N.
  The error is consistent, so it reproduces on adhan and looks correct in any automated check;
  only the position is wrong, and at solstice it moves sunrise by about 40 minutes.

## 2. Cyprus north — kktcdinisleri.com, the archive floor and the generation map

### 2.1 The trap, measured

`https://kktcdinisleri.com/namaz-vakitleri?ay=YYYY-MM`. The form field carries
`min="2022-10" max="2026-12"`, and the floor is real: every request before 2022-10 is **silently
answered with the current month**. All 96 months of 2019-2026 were requested, so the floor is
bracketed from both sides rather than inferred:

| block | requested | answer | banked |
| --- | --- | --- | --- |
| 2019-01 .. 2022-09 | 45 months | **Kasım 2026, every one** | 0 |
| 2022-10 .. 2022-12 | 3 months | own month (2022-10 starts on the 22nd) | 69 rows |
| 2023-01 .. 2023-12 | 12 months | own month | 341 rows |
| 2024-01 .. 2024-12 | 12 months | own month | 366 rows |
| 2025-01 .. 2026-12 | 24 months | own month | 729 rows |

**Trap hits: 45 of 45 requested pre-floor months, 45 of 96 overall.** Zero were banked; each is
recorded in `data/cyprus_probe.json` with the month it actually returned. The 2026-12 month is
served in full, which moves this surface's forward horizon to the end of 2026.

Correction to the record: the span ledger's "pre-2023 requests silently return the current month"
is right about the mechanism and **too generous about the floor**. Nothing before **2022-10-22**
exists; the archive begins mid-month.

### 2.2 What the archive holds, and its holes

`data/cyprus_lefkosa.json`, 1,505 rows, one table for Lefkoşa (the board serves no city selector):

| year | rows | span | missing |
| --- | --- | --- | --- |
| 2022 | 69 | 2022-10-22 .. 2022-12-31 | 2022-12-01, 2022-12-02 |
| 2023 | 341 | 2023-01-01 .. 2023-12-31 | 24 days, 2023-06-25 .. 2023-07-12 |
| 2024 | 366 | 2024-01-01 .. 2024-12-31 | none |
| 2025 | 365 | 2025-01-01 .. 2025-12-31 | none |
| 2026 | 364 | 2026-01-01 .. 2026-12-31 | 2026-11-11 (the day of capture) |

### 2.3 The generation map — two engines, alternating

The detector is the **sunrise residual**, which carries no twilight angle: a 7-day median of it
steps by 2.8 min and nowhere drifts. `find_cyprus_bands.js`:

| band | span | sunrise level |
| --- | --- | --- |
| **A** | 2022-10-22 .. 2022-12-31 | -7.3 |
| **B** | 2023-01-01 .. 2023-04-06 | -5.3 |
| **A** | 2023-04-07 .. 2025-12-31 | -6.9 |
| **B** | 2026-01-01 .. 2026-12-31 | -5.4 |

The switch days were read row by row. 2022-12-31 sunrise -7.67 -> 2023-01-01 -4.88. 2023-04-06
-5.00 -> 2023-04-07 -7.63. 2025-12-31 -7.72 -> 2026-01-01 -4.92. No intermediate day, no ramp.

Cross-scoring settles that these are two discrete generations and not a drift: each segment scored
at the other generation's constants gives **0 pc within 1 on every column**, while at its own
constants it gives 100 pc (table in `fit/cyprus_crosscheck.json`):

| segment | model A | model B |
| --- | --- | --- |
| 2022-10-22..2022-12-31 | 100 / -0.09 | 0 / -2.69 |
| 2023-01-01..2023-04-06 | 0 / +2.58 | 100 / -0.02 |
| 2023-04-07..2023-12-31 | 100 / -0.02 | 0 / -2.62 |
| 2024-01-01..2024-12-31 | 100 / +0.03 | 0 / -2.57 |
| 2025-01-01..2025-12-31 | 100 / -0.02 | 0 / -2.62 |
| 2026-01-01..2026-12-31 | 0 / +2.58 | 100 / -0.02 |

(first number is within-1 per cent on fajr, second its mean residual in minutes; the other columns
behave identically.)

### 2.4 The recipe, per generation

One twilight pair, two temkin constants. Both generations fit at **fajr 17.9 deg, isha 16.9 deg,
Shafi**, with the solar and later columns carrying a constant:

| column | A margin | B margin | B - A |
| --- | --- | --- | --- |
| fajr | -0.87 | +1.73 | +2.60 |
| sunrise | -7.38 | -4.88 | +2.50 |
| dhuhr | +4.67 | +7.09 | +2.42 |
| asr | +3.65 | +5.77 | +2.12 |
| maghrib | +6.63 | +8.83 | +2.20 |
| isha | +0.15 | +1.21 | +1.06 |

The record's "one temkin-shaped additive term, mean -2.42 on every prayer" is confirmed and now
dated: it is **+2.4 min on all six columns**, applied in both B bands.

Scored on its own span, generation A reproduces at 100 pc within 1 on fajr, dhuhr and sunrise
(99.9), 87.9 on maghrib, 78.3 on asr and 74.1 on isha. Generation B reproduces at 100 on fajr,
sunrise and dhuhr, 86.3 on maghrib, 78.3 on asr, 76.1 on isha. The evening three carry a **seasonal
term of about 2 min peak to peak** (asr +2.8 in February to +4.8 in October), the same shape in both
generations — it is the engine's, not the era's, and it is what the record's per-prayer seasonal
correction was absorbing.

### 2.5 What this means for the record

The two "editions" of the span ledger (2025 and 2026 as single cycles) are two generations, and the
adjacent archive shows the older one running from at least 2022-10-22 to 2025-12-31. The B
generation is not new in 2026: it already served **2023-01-01 to 2023-04-06** and was then replaced
by A for 33 months. The archive therefore looks like a store in which some months were recomputed
by a newer engine while others kept the older values, rather than a year-by-year publishing
history. That is a defect class worth carrying: **an archived month's values are not evidence of
the engine in use at that date**.

## 3. Tatarstan — DUM RT, the archived editions 2017 and 2020-2022

### 3.1 The live surface serves two years and refuses a third

`https://dumrt.ru/help-info/prayertime/` carries 44 `<option data-url>` entries, one CSV per
settlement, each holding **2025 and 2026 in one file** (730 rows). There is no year parameter
anywhere in the page, in the JavaScript, or in the Russian-language tree at `/ru/help-info/prayertime/`
(which serves the same 44 settlements from a second storage path, `/netcat_files/391/638/`).
The annual workbook exists for 2026 only: `vremena_namazov_RT_2026.xlsx` (and `_2026_0.xlsx` in the
Russian tree); **2020 through 2025 and 2027 all return 404** at that path.

### 3.2 The archive holds three editions, not five

Both CSV families were queried in Wayback, one settlement at a time, and every distinct capture was
fetched raw. The result is not the 220 CSVs the span ledger hoped for:

| edition | settlements | rows | how |
| --- | --- | --- | --- |
| 2017 | 23 | 8,395 | one April-May 2017 crawler pass, both URL families |
| 2019 (December only) | 1 (Kazan) | 31 | tail of the 2020 edition |
| 2020 | 1 (Kazan) | 366 | capture of 2020-06-04 |
| 2021 | 1 (Kazan) | 365 | capture of 2021-01-21 |
| 2022 | 1 (Kazan) | 365 | capture of 2022-02-13 |
| 2025, 2026 | 44 | 32,120 | live, already held |

**2023 and 2024 do not exist at this surface.** The proof is a trap of the same class as Cyprus:
asking Wayback for the 2023-06 and 2024-06 windows returns **HTTP 200 with a 26,134-byte file
identical to the 2022-02-13 capture**, because Wayback serves the nearest snapshot. The years
inside those files are 2021 and 2022, never 2023 or 2024, so nothing was banked from them; the
year split in `parse_dumrt_archive.py` is read from each row's own printed year, not from the
snapshot's date.

Archive probes that came back negative: 21 of the 44 settlements have no capture in either URL
family, and 23 have one; `archive.today` timed out on every attempt (recorded as unavailable,
not as absence); Wayback CDX `matchType=prefix` answered 503 on every call, so the inventory was
taken one exact URL at a time.

### 3.3 The 2017 edition — one recipe, 23 settlements, 8,395 rows

Positions come from the C23 record (derived from the 2026 series, reused unchanged). Engine adhan
4.4.6, 18/15 Hanafi, `Rounding.None`, `Europe/Moscow`, dates from the printed strings.

| column | margin | mae | within-1 | worst | n |
| --- | --- | --- | --- | --- | --- |
| fajr | -1.00 | 0.26 | 99.8 | 8.3 | 6,077 |
| sunrise | -1.17 | 0.25 | 100 | 0.6 | 8,395 |
| zawal | -0.98 | 0.25 | 100 | 0.6 | 8,395 |
| dhuhr | -0.98 | 0.25 | 100 | 0.6 | 8,395 |
| asr | -0.55 | 0.41 | 94.7 | 1.6 | 8,395 |
| maghrib | -0.82 | 0.25 | 100 | 0.6 | 8,395 |
| isha | -0.98 | 0.25 | 100 | 0.7 | 6,270 |

The summer substitute holds exactly as the record describes it: **fajr = sunrise - 120, isha =
maghrib + 90**, on 2,318 and 2,125 rows — about 100 and 92 days per settlement — and those rows are
excluded from the twilight scores, not scored against an unreachable angle.

### 3.4 Kazan across five editions — the recipe is frozen from 2017 to 2022

| edition | fajr margin | sunrise | zawal | asr | maghrib | isha | fajr w1 | substitute days |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2017 | -0.98 | -1.17 | -0.98 | -0.55 | -0.80 | -0.98 | 99.7 | ~100 |
| 2020 | -0.97 | -1.20 | -1.01 | -0.58 | -0.82 | -1.00 | 100 | 95 |
| 2021 | -1.07 | -1.12 | -1.00 | -0.52 | -0.85 | -0.97 | 99.6 | 94 |
| 2022 | -0.98 | -1.18 | -1.00 | -0.62 | -0.82 | -1.01 | 99.6 | 95 |

One constant near **-1.0 min on every column**, unchanged across five editions and nine years of
span. That is a stronger statement than the record's two-year stability, and it is the first
measurement of the pre-2025 convention: **the directional rounding pass the record found in 2025
(all floor but maghrib) and 2026 (fajr floor, rest ceil) is not present in 2017-2022**, where the
sub-minute residual is uniform on every column. The split is therefore dated to the 2025 edition at
the earliest and cannot be placed inside 2023-2024, because no 2023 or 2024 edition exists.

### 3.5 A second dated change — the fixed dhuhr jama'ah column

In the 2017 edition the fifth column **equals** the zawal on every settlement and every day
(Kazan 2017-07-15: zawal 11:49, dhuhr 11:49). From 2020 it is the published **12:00 jama'ah**
(Kazan 2020-07-15: zawal 11:49, dhuhr 12:00), and it stays so through 2025 and 2026. The convention
change sits between the 2017 and 2020 editions; it is not the fixed 12:00 column the record
describes for the years it held, and a fit that carries that column as solar noon would be wrong
for 2017.

## 4. Negatives and blocks, as measured

| surface | result |
| --- | --- |
| `dumrt.ru` annual workbook, 2020-2025 | HTTP 404 at every probed filename in both trees |
| `dumrt.ru` year parameter | none exists; the page, its JavaScript and the Russian tree carry only the current data-url |
| Wayback, Tatarstan 2023-2024 CSVs | absent; the 200 responses are the 2022 capture served as nearest |
| Wayback CDX prefix queries | HTTP 503 on every attempt, all day |
| `archive.today` | connection timeout on every attempt, not an absence |
| Cyprus `?ay=` before 2022-10 | 45 of 45 requests answered with November 2026 |
| Czechia year selector | offers 2026 and 2027 only, but the endpoint honours 2019-2030 |

## 5. Defects found

1. **Cyprus archive is a mixture of engine generations, not a publishing history.** Two
   generations alternate A-B-A-B across 2022-10 to 2026, with a clean mid-month cut at 2023-04-07.
   A month's values are therefore not evidence of the engine in use on that date.
2. **Cyprus 2023 has 24 missing days** (2023-06-25 to 2023-07-12), 2022-12-01 and 02 missing, and
   the archive omits the current day (2026-11-11) from its own table.
3. **Czechia, Řevnice: the table is empty.** Latitude printed as 449.92; five of six columns print
   00:00 on every day of every year. 2,187 of 2,192 rows unusable.
4. **Czechia, Kladno: computed 1.35 deg north of itself** and reproducible there, so no automated
   check can catch it.
5. **DUM RT 2017: the dhuhr column is the zawal**, not a jama'ah — a consumer applying the current
   convention to the 2017 file will read 11:49 as a jama'ah time.

## 6. Next

- **Czechia**: the surface renders 2025-2030 for all 191 towns at the same cost as 2019-2024; the
  next round should take the six remaining years and lift the country from a six-year span to
  twelve. A per-prayer seasonal term would raise the within-1 from 67 pc to about 95 and is worth
  fitting explicitly rather than absorbing.
- **Cyprus**: nothing before 2022-10 exists at this host; the only remaining path is Wayback
  captures of the same page, which are unpriced. The generation map should be re-read after any
  archive change, because the mixture means months can be rewritten.
- **Tatarstan**: 2023 and 2024 are the only unbanked years and they are not archived. The 2017
  edition is banked and fits; the next round should confirm it against the 2018 and 2019 crawls if
  any exist (the 2017 pass covers April-May only, so a 2018 pass would date the dhuhr-column change
  to a single year).

