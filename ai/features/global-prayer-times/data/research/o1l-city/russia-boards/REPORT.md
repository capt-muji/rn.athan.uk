# Russia regional boards, city-level round two (O1l-6)

Scope: the four held Russia objects plus the regional boards the record does not carry.
Read-only against the repository; everything here was captured 2026-11-11.
Workspace: `$HOME/athan-gitree/census/o1l-city/russia-boards/`.

Engine for every fit: adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`,
`Rounding.None`, dates built from the literal capture strings, times read in the city's IANA zone.
Scores are computed on offset-corrected residuals (the publisher's constant margin is measured,
then removed), so "within-1" reads the shape of the recipe and not its clock bias.

## 1. DUM RB (Bashkortostan) - api.dumrb.com

- **Enumeration:** `GetSupportedCities` returns **63 settlements** (HTTP 200, 6,356 bytes,
  `captures/dumrb_supportedcities.json`). No growth since C23.
- **Capture:** 1,512 month requests (63 x 2 years x 12) in `captures/dumrb/`, 24 of them HTTP 404:
  `Приютово` (id 20) and the settlement at id 17 return **no 2026 data at all**. 2026 is complete
  for 61 cities; **2025 is complete for 25 cities and January-March only for the other 38**.
- **2027:** `GetByCity?year=2027` answers `Запись ... не найдена`, HTTP 404, on every month probed.
  The endpoint serves the current and one prior year only.
- **Rows normalised:** 22,265 (2026) + 12,621 (2025) = **34,886 settlement-days**, `data/dumrb_2025.json`
  and `data/dumrb_2026.json`.
- **Recipe (2026, winter half):** fajr **16 deg**, isha **15 deg**, Hanafi asr; `dhuhr` is a fixed
  jama'ah at **13:30** (13:35 for part of the year), `zaual` is solar noon, `suhurDo` = fajr - 15.
- **Summer substitute:** fajr = **model** sunrise - 90, isha = **model** sunset + 90. It is wider than
  16 deg reachability, so the summer half stays structurally unfittable, as the record holds.
- **Publisher defect found this round:** the printed **sunrise** column runs early - by up to 22
  minutes - from mid-August into November, while fajr, maghrib and isha stay on the astronomy.
  The substitute band is therefore classified against the model sunrise, never the printed one.
- **2025 recipe break:** 2025 substitutes fajr at sunrise - **120** and carries no `suhurDo`/`zaual`.
- **Sibay:** off the 16-deg rule on all 365 days of 2026 (`sunrise` +12 min, `maghrib` -12 min against
  its own listed coordinates) - the served schedule is not its listed position.

(per-city table: section 7)

## 2. DUM RT (Tatarstan) - dumrt.ru

- **Enumeration:** the selector on `dumrt.ru/help-info/prayertime/` serves **43 `<option>` entries**
  plus the separately linked `Kazan.csv` = **44 settlements**, the same set the record holds. The
  annual XLSX (`netcat_files/multifile/2649/vremena_namazov_RT_2026.xlsx`) carries the same 44
  settlement names in both the Tatar and Russian header blocks. **No city beyond the 44 exists.**
- **Years:** every CSV carries **2025 and 2026 in one file** (730 rows). **2027 is not served**:
  `vremena_namazov_RT_2027.xlsx` is HTTP 404.
- **Republish check:** 43 of the 44 CSVs are **byte-identical** to the C23 capture of 2026-11-10;
  the one difference is `Aktanis.csv`, whose known missing newline at the 2025/2026 boundary was
  repaired there and arrives unrepaired here (repaired deterministically in `parse_dumrt.py`).
  32,120 rows, 44 x 730, zero gaps.
- **The 2025 ninth column is the qibla time** (confirmed: `Aktanis` 2025-01-01 ends `13:06`);
  2026 drops it.

## 3. CDUM (Central Spiritual Board) - cdum.ru

- **Enumeration:** 21 nav entries, unchanged. **Ufa remains image-only** (0 text rows).
  **Volgograd serves 352 rows** (13 days missing) - a new defect against C23's 365.
- **Republish check:** every 2026 row compared is identical to C23's capture (1,460 rows checked
  across four cities); only page chrome differs. The one-year object is unchanged.
- **Recipe confirmed:** 18 deg fajr / 17 deg isha, Hanafi asr, mornings ~2.6 min early and the four
  later columns ~1.4 min late (Moscow: fajr offset -2.54, sunrise -2.65, dhuhr +1.41, asr +1.46,
  maghrib +1.45, isha +2.24; fajr 18.0, isha 16.9 by grid).
- **Salekhard / Surgut correction stands, with C23's reason refuted.** The nav label `Салехард 2026`
  still points at `/time-namaz/Surgut/Surgut2015.php`. Measured against Salekhard (66.53 N, 66.60 E)
  the printed solar anchors agree in **all twelve months** (1 Jan sunrise 11:14 vs 11:16, sunset
  14:01 vs 13:59; 1 Jun sunrise 01:24 vs 01:27, sunset 23:42 vs 23:41; day-length error p95 4.8 min,
  max 7.1 min). **June does not imply 47 N** - the June day length is 22 h 18 m against Salekhard's
  22 h 14 m. The page is Salekhard's series under a legacy Surgut filename; real Surgut has no
  series anywhere in CDUM.
- **Defects confirmed on that page:** 1 January asr lands **6 minutes after its own dhuhr**; 87 days
  are 5+ minutes off the Salekhard asr curve, all in the polar-night weeks; two rows are corrupt
  (`2026-06-06` maghrib 20:19, `2026-07-09` maghrib 00:00).

## 4. New regional boards

### 4.1 RDUM Samara (CDUM member) - islamsamara.ru
- **NEW SURFACE.** `second/namaz?month=N` serves twelve month tables, **364 parseable rows** for
  Samara (three rows corrupt: 29-31 July), `captures/samara/`, `data/samara.json`.
- The year is not printed and `?year=2027` is ignored (the January table returns unchanged), so the
  table is a single yearless edition that places in 2026 by its own weekdays and geometry.
- **Recipe:** fajr **18 deg**, isha **15 deg**, Hanafi asr - the Tatarstan angles, not CDUM's 17;
  margins dhuhr +5.0, maghrib +4.7, sunrise 0, asr 0; summer substitute fajr = sunrise - 120,
  isha = sunset + 90 for 14 May - 28 Jul.
- The page states the oblast may vary "within 5 minutes" of the Samara city row.
- **Grade:** provisional (one published cycle).

### 4.2 RDUMSO Sverdlovsk - rdums.ru
- **NEW SURFACE, image prints.** `vremena_namaza/` rotates a monthly JPEG; the November 2026 sheet
  is captured (`captures/sverdlovsk/rdums_nov2026.jpg`) and transcribed to
  `data/sverdlovsk_2026_11.json`, **30 rows**.
- **Recipe (this month):** whole month inside the substitute band - fajr = sunrise - 90, isha =
  sunset + 90 exactly; `zenith` is solar noon (agreement 0.4 min), **dhuhr is a fixed 13:20 jama'ah**,
  asr Hanafi (0.8 min). No angular fit is possible from a month that never leaves the substitute.
- **Honest limit:** one month held; the archive is not indexed (image filenames are UUIDs) and prior
  months were not recoverable.

### 4.3 Perm - islam59.ru
- **Negative as authority data, positive as an engine record.** The muftiate's "Календарь намазов на
  месяц" is a client-side table fed from `api.aladhan.com/v1/calendarByCity` with
  `method=3` (MWL, 18/17), `school=1` (Hanafi), city `Perm`, then **zuhr forced to 13:30** and asr
  and isha each +1 min. It is a third-party engine under a muftiate banner, never the board's series.

### 4.4 DUM MO (Moscow oblast) - dummo.ru
- **Negative.** The site carries no prayer-time table: `/islam/namaz` is an article index and the
  homepage has no schedule link. Searched in Russian ("ДУМ Московской области время намаза
  расписание", "расписание намаза Московская область Подольск ДУМ МО 2026"); every hit is an
  aggregator. Moscow oblast has no board-owned series.

### 4.5 Chelyabinsk - rdum-chel.ru, rdum.info
- **Negative.** `rdum-chel.ru` fails TLS (certificate does not cover the host) and over plain HTTP
  serves a **Beget "domain not linked" page**; `rdum.info` serves a Beget parking page and its
  `/сalendar-of-prayer/` is HTTP 404. The oblast board (a CDUM member) has no live site. Chelyabinsk
  city remains covered by CDUM's own page and by the platform table below.

### 4.6 Novosibirsk
- **Negative for a board surface.** The muftiyat exists only on social platforms (VK, Instagram);
  no domain resolves (`dum-nso.ru`, `muftiyat-nso.ru`, `islam-nso.ru`, `nskdum.ru` all fail DNS).
  Searched in Russian. No per-city authority series.

### 4.7 mechet.ru (platform tier) - Chelyabinsk and Novosibirsk
- Platform tables rendered in the browser and captured as text
  (`captures/mechet/{chelyabinsk,novosibirsk}_2026-11.txt`), 30 rows each, November 2026.
- The page labels the table **"метод ДУМ РФ (Россия), ханафитский мазхаб"** - a platform label, not
  provenance. Measured: Hanafi asr (+1.1 min), maghrib sunset +0.3, dhuhr noon +2.3 at both cities.
  The fajr and isha angles are **not separable from one winter month** (fajr 18.0 vs 17.65, isha
  14.85 vs 13.75 across the two cities): the twilight curves are too flat in late November.
- **Verdict:** candidate, platform tier. Not an authority object, and not fittable from one month.

## 5. What confirms, what is new, what is honestly negative

- **Confirms:** DUM RT grade A on a fresh byte-identical capture; CDUM's 18/17 Hanafi one-year object
  and its Moscow/Tatarstan split; DUM RB's 16/15 with the structurally unfittable summer; the
  Salekhard/Surgut label correction (with C23's 47 N reasoning refuted).
- **New:** RDUM Samara's full-year table (18/15 with the Tatarstan substitute), RDUMSO Sverdlovsk's
  November image sheet, the DUM RB sunrise-column defect, CDUM Volgograd's 13 missing days, the
  Perm site's aladhan dependency.
- **Negative:** no DUM MO series, no live Chelyabinsk board, no Novosibirsk board domain, no 2027 at
  either DUM RB or DUM RT, no settlement beyond DUM RT's 44, no city beyond CDUM's 21 entries.

## 6. Verification of the banked report (completion pass)

Every number below was re-derived from the files on disk. Scripts named are in this workspace.

### 6.1 Counts

- **DUM RB enumeration.** `captures/dumrb_supportedcities.json` is an array of **63** entries.
  `data/dumrb_2026.json` holds **61 cities, 22,265 rows**; `data/dumrb_2025.json` holds **63 cities,
  12,621 rows** (25 with 365 days, 38 with January-March only). Total **34,886**, as section 1 states.
- **DUM RT enumeration.** `data/dumrt.json` holds **44 cities, 32,120 rows**, every city at exactly
  730 rows over 2025-01-01 to 2026-12-31, zero gaps. The annual workbook
  `captures/dumrt/RT_2026.xlsx` carries **46 distinct first-column labels: two headers
  (`Торак пункт`, `Населенный пункт`) and 44 settlements**. No 45th settlement exists in either
  artifact. `captures/dumrt/RT_2027_probe.bin` is a 40 KB HTML error page, so 2027 is not served.
- **DUM RT republish.** All 44 current CSVs were compared byte-for-byte against
  `census/c23-russia/dumrt/csv/`: **43 identical, 1 differing (`Aktanis`)**. `Aktanis` 2025-01-01
  ends `13:06`, the ninth-column qibla time. Section 2 holds.
- **CDUM enumeration.** Both the nav capture and a fresh fetch of `/time-namaz/` carry the **same 21
  `time-namaz/` links**. Volgograd holds **352 rows with 13 missing, 2026-06-15 to 2026-06-27**.
  Salekhard 2026-01-01 prints asr at dhuhr + 6 min. Section 3 holds.

### 6.2 The Moscow margins in section 3 are C23's, at a displaced longitude

The quoted margins (fajr -2.54, sunrise -2.65, dhuhr +1.41, asr +1.46, maghrib +1.45, isha +2.24)
are not in `data/cdum_confirm.json`, which records Moscow as "no derived position". They are the
`Moskva` entry of `census/c23-russia/fit/verification_cdum.json`, computed at lat 55.7874,
lon 37.4570, a **longitude error of -0.163 deg** against Moscow's published 37.62.

Re-scored at 55.7558, 37.6173 with the same 18/17 Hanafi recipe, 267 gated days:

| column | margin | within-1 |
| --- | --- | --- |
| fajr | -1.97 | 95.5 |
| sunrise | -2.00 | 100 |
| dhuhr | +2.02 | 100 |
| asr | +2.05 | 83.1 |
| maghrib | +2.02 | 100 |
| isha | +2.02 | 90.6 |

The recipe verdict is unchanged and scores better at the true position: one constant margin near
2 minutes, mornings early and the four later columns late. The margin table should be read from
this run, not from C23's displaced fit.

### 6.3 The DUM RB free-angle fit is an artefact, not a fit

`fit_dumrb.js` and `fit_dumrb_winter.js` search the twilight angle on a winter half. At 55 N the
fajr time is almost linear in the angle, so angle and margin trade one for one: Ufa 2026 winter
scores 100 percent within-1 at **18.55 deg with a +17.58 min margin** and equally at **16 deg with a
0.0 margin**. The search therefore returns whichever end of its range absorbs the level:
`data/dumrb_fit.json` carries Ufa at **fajr 12, isha 11 with a -28.67 min fajr margin**, both at the
search bounds. No per-city table was written because the instrument could not answer.

Replaced by `fit_dumrb_level.js`: the angle is the one whose **median winter residual is zero**,
which is identifiable because the 2026 publisher carries no margin. `data/dumrb_level_fit.json`
holds the result.

### 6.4 DUM RB is two generations, split at the file boundary

The record's 16/15 holds for **2026 only**.

- **2026**, 61 cities, winter half at the identified angle: fajr median **16.05 deg** (range
  15.25-16.1), isha median **14.8** (14-15). Fajr within-1 median **98.9** (P10 95, MAE 0.36),
  isha **86.7**, asr **75.6**, sunrise **93.3**. No city sits more than 1 deg off the median pair.
- **2025**, 25 cities: fajr median **14.55 deg**, isha **14.5**, fajr within-1 median **18.6**
  (MAE 3.14), isha **22.2** (MAE 2.39). The 2025 fajr is not on any single angle: against 16 deg its
  monthly median runs **+13.3 min in January, +8.2 in February, +3.4 in March, -2.1 in April, and
  about 0 from September to December**. That is a flatter curve than the astronomy, not a different
  angle, and no date shift reproduces it (best constant shift -4 days, MAE 5.23).

So the 2025 file is a separate generation whose angular-season fajr cannot be pinned, and the
grade-A claim rests on 2026. Fit the two years separately or not at all.

### 6.5 The sunrise defect is 2026's, and wider than section 1 states

Residuals of the printed sunrise against the model, all 61 cities, 2026: median **-9.4 min in
August, -12.9 in September, -8.9 in October, -1.5 in November**, worst **-68 min**. The 2025 file is
clean in every month (median between +0.1 and -1.2 min). Section 1's "up to 22 minutes" describes the typical
case; the tail is three times that.

### 6.6 Two settlements carry their own published defects

- **Давлеканово**: fajr runs **+56 min late in October, +67 in November, +92 in December** against
  its own listed position, while sunrise stays within a minute. January to March are clean.
- **с. Акъяр Хайбуллинский район**: fajr runs **-32 min in October and -40 in November**, sunrise
  clean. December is mixed.
- **Сибай**: off the recipe all year (fajr within-1 55.2, isha 42.5); see 6.7 for the cause.

### 6.7 Sibay's schedule belongs to another latitude

Section 1 records Sibay as off the 16-deg rule "on all 365 days (sunrise +12 min, maghrib -12 min)".
Re-measured, the deviation is seasonal and mirrored, not constant: sunrise **+15 to +17 min in
January and December, about 0 in March and October, -19 to -21 in June**, with maghrib the same
figures reversed. That is a larger seasonal amplitude than the listed position allows. Fitting the
solar anchors alone puts the served schedule at **55.81 N, 58.69 E, 3.1 degrees north of Sibay's
listed 52.72 N**, residual 2.23 min. The settlement is served a schedule computed for a latitude it
does not sit at, which is a stronger finding than a constant offset.

### 6.8 Re-sweep of the two negative boards

Both negatives were re-searched in Russian on 2026-11-11, with the board named in the query.

- `ДУМ Московской области расписание намаза Подольск 2026` returns nine hits, all platform
  aggregators (5namaz, vremya-namazov, azan.today, azaneum, vremya-namaz, grafik-namazov,
  raspisanienamaza, ummah.su, vremyanamaz). No `dummo.ru` page, and the board's own site still
  carries no schedule.
- `муфтият Новосибирской области время намаза расписание` returns eight hits, all aggregators
  (islam.global, azan.today, azaneum, 5namaz, vremya-namazov, ummah.su, kibla.ru,
  raspisanienamaza). No oblast board surface.

Both stay negative under these terms: the boards publish no dated series, and the aggregators are
platform tables with no authority.

## 7. Section 1.1, the DUM RB per-city fit (2026, winter half)

Angle by level identification, scored on the same winter half at that angle. `w1` is the share of
days within 1 minute of the column's own margin. 61 settlements, sorted by fajr.

| settlement | days | fajr deg | isha deg | fajr w1 | isha w1 | asr w1 |
| --- | --- | --- | --- | --- | --- | --- |
| Мелеуз | 365 | 16.05 | 14.8 | 100 | 95.2 | 77.1 |
| Нефтекамск | 365 | 16.05 | 14.8 | 100 | 85.6 | 70 |
| Октябрьский | 365 | 16.05 | 14.8 | 100 | 86.7 | 76.7 |
| Учалы | 365 | 16.05 | 14.8 | 100 | 85.6 | 76.7 |
| п.г.т. Чишмы Чишминский район | 365 | 16.05 | 14.8 | 100 | 85.6 | 74.4 |
| Янаул | 365 | 16.05 | 14.8 | 100 | 82.2 | 73.3 |
| Бирск | 365 | 16.05 | 14.8 | 100 | 81.1 | 73.3 |
| с. Архангельское Архангельский район | 365 | 16.05 | 14.8 | 100 | 90 | 74.4 |
| с. Аскино Аскинский район | 365 | 16.05 | 14.8 | 100 | 88.9 | 74.4 |
| с. Бакалы Бакалинский район | 365 | 16.05 | 14.8 | 100 | 85.6 | 75.6 |
| с. Бижбуляк Бижбулякский район | 365 | 16.1 | 14.8 | 100 | 90 | 77.8 |
| с. Буздяк Буздякский район | 365 | 16.05 | 14.8 | 100 | 85.6 | 76.7 |
| с. Месягутово Дуванский район | 365 | 16.05 | 14.8 | 100 | 88.9 | 75.6 |
| с. Верхнеяркеево Илишевский район | 365 | 16.05 | 14.8 | 100 | 81.1 | 72.2 |
| с. Калтасы Калтасинский район | 365 | 16.05 | 14.8 | 100 | 88.9 | 70 |
| с. Кушнаренково Кушнаренковский район | 365 | 16.05 | 14.8 | 100 | 82.2 | 77.8 |
| с. Кармаскалы Кармаскалинский район | 365 | 16.05 | 14.8 | 98.9 | 83.3 | 76.7 |
| Межгорье | 365 | 16.05 | 14.8 | 98.9 | 86.7 | 74.4 |
| Уфа | 365 | 16.05 | 14.8 | 98.9 | 82.2 | 74.4 |
| Салават | 365 | 16.05 | 14.8 | 98.9 | 92 | 78.4 |
| Туймазы | 365 | 16.05 | 14.8 | 98.9 | 87.8 | 74.4 |
| с. Толбазы Аургазинский район | 365 | 16.05 | 14.8 | 98.9 | 83.3 | 74.4 |
| с. Старобалтачево Балтачевский район | 365 | 16.05 | 14.8 | 98.9 | 75.6 | 70 |
| с. Бураево Бураевский район | 365 | 16.05 | 14.8 | 98.9 | 81.1 | 73.3 |
| с. Ермекеево Ермекеевский район | 365 | 16.05 | 14.8 | 98.9 | 88.9 | 75.6 |
| с. Иглино Иглинский район | 365 | 16.05 | 14.8 | 98.9 | 82.2 | 76.7 |
| с. Караидель Караидельский район | 365 | 16.05 | 14.8 | 98.9 | 80 | 73.3 |
| с. Верхние Киги Кигинский район | 365 | 16.05 | 14.8 | 98.9 | 80 | 74.4 |
| с. Николо-Березовка Краснокамский район | 365 | 16.05 | 14.8 | 98.9 | 76.7 | 75.6 |
| с. Большеустьикинское Мечетлинский район | 365 | 16.05 | 14.8 | 98.9 | 87.8 | 72.2 |
| Агидель | 365 | 16.05 | 14.8 | 98.9 | 76.7 | 73.3 |
| с. Киргиз-Мияки Миякинский район | 365 | 16.05 | 14.8 | 98.9 | 87.8 | 78.9 |
| с. Красная Горка Нуримановский район | 365 | 16.05 | 14.8 | 98.9 | 84.4 | 73.3 |
| с. Стерлибашево Стерлибашевский район | 365 | 16.05 | 14.8 | 98.9 | 87.8 | 81.1 |
| с. Федоровка Фёдоровский район | 365 | 16.05 | 14.8 | 98.9 | 93.1 | 79.3 |
| с. Чекмагуш Чекмагушевский район | 365 | 16.05 | 14.8 | 98.9 | 90 | 76.7 |
| с. Шаран Шаранский район | 365 | 16.05 | 14.8 | 98.9 | 83.3 | 74.4 |
| с. Малояз Салаватский район | 365 | 16.05 | 14.8 | 98.9 | 87.8 | 75.6 |
| Белебей | 365 | 16.05 | 14.8 | 98.9 | 84.4 | 76.7 |
| Белорецк | 365 | 16.05 | 14.8 | 98.9 | 85.6 | 73.3 |
| Благовещенск | 365 | 16.05 | 14.8 | 98.9 | 85.6 | 74.4 |
| с. Мраково Кугарчинский район | 365 | 16.05 | 14.8 | 98.8 | 96.3 | 82.5 |
| с. Ермолаево Куюргазинский район | 365 | 16.05 | 14.8 | 98.7 | 92.4 | 81 |
| Баймак | 365 | 16.05 | 14.8 | 98.7 | 96.2 | 81 |
| с. Исянгулово Зианчуринский район | 365 | 16.1 | 14.8 | 98.6 | 95.9 | 81.1 |
| Стерлитамак | 365 | 16.05 | 14.8 | 97.8 | 88.9 | 76.7 |
| с. Раевский Альшеевский район | 365 | 16.05 | 14.8 | 97.8 | 87.8 | 76.7 |
| с. Новобелокатай Белокатайский район | 365 | 16.05 | 14.8 | 97.8 | 88.9 | 75.6 |
| с. Языково Благоварский район | 365 | 16.05 | 14.8 | 97.8 | 82.2 | 76.7 |
| с. Красноусольский Гафурийский район | 365 | 16.05 | 14.8 | 97.8 | 85.6 | 77.8 |
| с. Мишкино Мишкинский район | 365 | 16.05 | 14.8 | 97.8 | 82.2 | 72.2 |
| с. Верхние Татышлы Татышлинский район | 365 | 16.05 | 14.8 | 96.7 | 88.9 | 74.4 |
| с. Зилаир Зилаирский район | 365 | 16.05 | 14.8 | 96 | 94.7 | 84 |
| Ишимбай | 365 | 16.05 | 14.8 | 95.6 | 92.2 | 82.2 |
| Кумертау | 365 | 16.05 | 14.8 | 95 | 95 | 78.8 |
| с. Старосубхангулово Бурзянский район | 365 | 16.1 | 14.8 | 94.2 | 90.7 | 79.1 |
| Дюртюли | 365 | 15.6 | 15 | 93.3 | 100 | 92.2 |
| с. Аскарово Абзелиловский район | 365 | 16.05 | 14.8 | 91.1 | 82.2 | 82.2 |
| с. Акъяр Хайбуллинский район | 365 | 16.1 | 14.8 | 80.3 | 97.2 | 85.9 |
| Давлеканово | 365 | 16 | 14.8 | 63.3 | 85.6 | 77.8 |
| Сибай | 365 | 15.25 | 14 | 55.2 | 42.5 | 27.6 |

## 8. CDUM Ufa, the monthly almanac image series (NEW SURFACE)

Section 3 records Ufa as image-only with 0 text rows. The image is not a single scan: it is the
current month of a **twelve-sheet almanac**, and the sheets sit on a predictable path that the page
markup names.

- **Series:** `https://www.cdum.ru/time-namaz/2026/<n>.jpg`, `n` from 1 to 12, each 898x1264 JPEG,
  9.0 MB total in `captures/ufa/`. The sheets are keyed by **Hijri month**, not Gregorian:
  `1.jpg` is Muharram 1448 (16 Jun 2026) and `12.jpg` is Dhu al-Hijja 1448 (7 May to 5 Jun 2027).
- **Backward year:** `/time-namaz/2025/` serves the same twelve-sheet shape for **Hijri 1446**
  (Muharram starts 7 Jul 2024), captured to `captures/ufa2025/`. Directories 2024, 2025, 2026,
  2027 and 1447 were probed: 2024, 2027 and 1447 answer 404, and both live directories hold exactly
  twelve sheets (`13.jpg` and `0.jpg` are 404 in each). No 1447 sheet was found under these terms.
- **Rows:** `data/ufa_1448.json`, **355 rows, 2026-06-16 to 2027-06-05**, every row checked against
  its own printed weekday. `data/ufa_1446.json` holds **87 rows** from three sheets (Muharram,
  Jumada al-Awwal, Ramadan) spread across that year.
- **Language and layout:** Tatar headers, a fixed `Өйлә` jama'ah column, and a `Сәхәр` suhur column
  that appears only in the Ramadan sheet.

### 8.1 The recipe

The almanac is a fixed-interval table on the solar anchors, and it reproduces exactly:

| column | rule | measurement |
| --- | --- | --- |
| sunrise | adhan solar | median +0.03 min, max 0.67, 355/355 within 1 |
| maghrib | sunset + 4 | median +3.97, range 3.42-4.65 |
| fajr | sunrise - 100 | 355/355 exact |
| isha | maghrib + 90 | 355/355 exact |
| dhuhr | max(13:30, solar noon + 5) | 355/355 within 0.6 |
| asr | Hanafi asr of the printed date **+ 10 days** | 355/355 within 1, max 0.78 |
| suhur (Ramadan) | fajr - 20 | 29/29 exact |

Cell-exact reproduction of the printed minute is **1,934 of 2,130 cells, 90.8 percent**; the
remainder are one-minute rounding boundaries, which is what a floor-rounded table looks like.

**The asr column is ten days ahead of its own row.** At the printed date it is wrong by up to
-22 min in September and +19 in February; shifted ten days it lands within a minute on every one of
355 rows. This is a publisher date defect, not a madhab: the column is Hanafi, and no shadow ratio
reproduces the printed curve at the row's date.

### 8.2 Second year, same shape, two constants moved

The 1446 sheets (87 rows) reproduce on the same fixed-interval shape:

- fajr = sunrise - 100 and isha = maghrib + 90, exact on 87 of 87 rows;
- suhur = fajr - 20, exact on all 29 Ramadan rows;
- dhuhr = max(13:30, noon + 5), all 87 within 0.8 min;
- **maghrib = sunset + 2.8** (median, range 1.5-3.7), one minute less than 1448's +4;
- **asr sits on its own row's date** (mean absolute error 0.64 min, best shift 0), so the ten-day
  defect is a 1448-only fault.

### 8.3 Grade and limits

**A**, two fitted years on one recipe (1448 full, 1446 sampled at three months), one published
cycle per year. The recipe is not an angle at all, so it is not comparable with the 16/15 boards:
Ufa's almanac never uses a twilight angle, and at Ufa's latitude it never needs one.

Honest limits: the 1446 year is transcribed at three sheets, not twelve; no 1447 sheet was found
at any probed path, which is a negative under these terms and not a proof of absence; and the
sheets carry no machine-readable text, so the transcription is manual and its only checks are the
printed weekday column and the recipe's own exactness.

## 9. Completion ledger

Verified and left standing: every count in section 1, the DUM RT republish check, the CDUM nav and
Volgograd defects, the Salekhard label correction.

Corrected: the Moscow margin table (6.2), the DUM RB fit instrument (6.3), the single-recipe claim
across 2025 and 2026 (6.4), the sunrise defect's year and tail (6.5), and Sibay's cause (6.7).

Added: the DUM RB per-city table (section 7), the two generation split with dated blocks, the
per-settlement defects at Давлеканово and Акъяр, and Ufa's two-year almanac series (section 8).

Still negative, under these terms: no DUM MO series, no live Chelyabinsk board, no Novosibirsk
domain, no 2027 at DUM RB or DUM RT, no settlement beyond DUM RT's 44, no CDUM city beyond its 21
entries, and no 1447 almanac at CDUM.
