# O1l-B1 wayback-back — backward harvest + fit (2026-11-11)

Agent O1l-B1. Workspace: this directory. Public pages only; every probe URL and status recorded
per target below; raw responses in `captures/`, normalized rows and fit outputs in `data/`.
Pacing 1.5 s between requests. Engine adhan 4.4.6 (`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`),
TZ pinned per country, no clock reads, dates from literal capture strings.

---

## 1. SAUDI ARABIA — the umqserv century (1318H-1438H backward; 1450-1500H forward held)

### Harvest

Endpoint (keyless GET, s1's pattern): `https://umqserv.kacst.gov.sa/api/v1/Prayer/GetPrayerHijriYear?lang=en&format=24&yh=<H>&lat=<lat>&lon=<lon>&zone=3`

14 GETs (curl, browser UA, 1.5 s pace) — 14/14 HTTP 200, zero refusals:

| Hijri year | Makkah (21.4225, 39.8262) | Medina (24.4672, 39.6111) | Gregorian span of the year |
|---|---|---|---|
| 1318 | 200, 354 rows | 200, 354 rows | 1900-04-30 .. 1901-04-18 |
| 1338 | 200, 354 rows | 200, 354 rows | 1919-09-25 .. 1920-09-12 |
| 1358 | 200, 354 rows | 200, 354 rows | 1939-02-20 .. 1940-02-08 |
| 1378 | 200, 355 rows | 200, 355 rows | 1958-07-17 .. 1959-07-06 |
| 1398 | 200, 355 rows | 200, 355 rows | 1977-12-11 .. 1978-11-30 |
| 1418 | 200, 355 rows | 200, 355 rows | 1997-05-07 .. 1998-04-26 |
| 1438 | 200, 354 rows | 200, 354 rows | 2016-10-02 .. 2017-09-20 |

Zero date gaps or duplicates in every file. Ramadan day counts read from the API's own Hijri
month 9 (never assumed): 1318=30, 1338=30, 1358=30, 1378=29, 1398=29, 1418=29, 1438=29.
Capture files: `captures/sa-makkah-hijri-<H>.json`, `captures/sa-medina-hijri-<H>.json`.
Held data joined into the fit: deep1's forward years 1450/1460/1470/1480/1490/1500 (Makkah fit
point) and s1's 1448 (Makkah fit point).

### Fit — one recipe across 1318-1500H

Recipe (s1's, unchanged): fajr 18.5; isha = maghrib + 120 on every Hijri-month-9 day and + 90 on
every other; offsets fajr +1, sunrise 0, dhuhr +1, asr +1, maghrib +1, isha +1; sunrise floor(raw),
prayers floor(raw + 1); Shafi asr; Rounding.None; TZ Asia/Riyadh; engine adhan 4.4.6.

```
(18 files, 6,379 rows, 1318H-1500H)
floor: exact 84.7-88.9 pc, within-1 100.0 pc EVERY file, worst 1 EVERY file
ceil:  exact 22.6-24.7 pc (single-formulation rule confirmed in every era: the floor reading wins)
```

Per-year breakdown (Makkah / Medina floor exact %): 1318 88.9/87.6 · 1338 87.0/86.3 ·
1358 85.9/86.1 · 1378 86.4/86.4 · 1398 84.7/85.3 · 1418 86.7/86.1 · 1438 87.5/86.9 ·
1448 85.5 (s1: 85.4) · 1450 87.1 · 1460 86.1 · 1470 87.0 · 1480 86.3 · 1490 86.1 · 1500 86.1.
The exact rate does not trend: the highest in the whole set is the OLDEST year (1318H, 88.9).

### Regime changes found: NONE

- isha−maghrib interval = {90, 120} only, in all 18 files, 0 violations of the Ramadan rule,
  0 odd intervals. The 120/90 Ramadan switch is month-exact on the API's own Hijri boundaries in
  the OLDEST sampled year (1318H/1900) exactly as in 1448H/2027.
- No era split exists in the data: 120 Hijri years of service, one recipe, one rounding law.
- Residual shape (fajr ~+0.5 mean vs raw 18.5, sunrise ~−0.5, the ceil-of-margin signature) is
  identical in 1318H and 1500H.

### Verdict

- **Span:** 183 Gregorian years (1900-04-30 .. 2076), 18 year-city files, 6,379 rows fitted, one
  recipe, zero splits. Seasonal amplitude beside stability: printed-fajr span per year 90-92 min
  (Makkah), 104-105 min (Medina), flat across the century — the amplitude is latitude's, not era's.
- **Grade effect:** A holds and DEEPENS: the Saudi object's ceiling now has a fitted past floor
  (1318H) to match its fitted future ceiling (1500H). PROVEN-TO-1500H gains "and back to 1318H".
- **Honest caveat:** umqserv computes on demand; the century proves the GENERATOR is stable across
  its full stated range, not that a 1900 paper table printed these digits (no 1900 paper exists in
  reach). The regime-change question is answered as: no regime change exists anywhere in the
  service's own 1318-1500H output — naive forward AND backward extrapolation are both safe here.

---

## 2. HONG KONG — Kowloon/Masjidal feed history 2021-2023 (beside the held 2024-2026)

### Harvest

Endpoint (keyless range API, c42's pattern, masjid_id `xwLVrxLJ`):
`https://masjidal.com/api/v1/time/range?masjid_id=xwLVrxLJ&from_date=2021-01-01&to_date=2023-12-31`

ONE request, HTTP 200, 441,179 bytes, `status: success`, 1,095 daily rows (365+365+365, zero gaps,
dates from the payload's own `date` strings). Capture: `captures/hk-kowloon-2021-2023.json`.

### Fit — the standing recipe, scored per year (adhan 4.4.6, TZ Asia/Hong_Kong, point 22.30395/114.17123)

Recipe (c31's): fajr 18.4 truncate; dhuhr transit +5 nearest; asr Shafi +1; maghrib sunset +3;
isha sunset + 83 (iv 80 vs printed maghrib).

| Year | fajr exact/w1 | dhuhr | asr | maghrib | isha | iv=80 days |
|---|---|---|---|---|---|---|
| 2021 | 353/365 e, 365 w1 | 365/365 | 295 e, 365 w1 | 359 e, 365 w1 | 359 e, 365 w1 | **365/365** |
| 2022 | 292/365 e, 348 w1 | 358 e, 365 w1 | 222 e, 273 w1 (worst 55) | 270 e, 273 w1 | 240 e, 243 w1 | 266/365 |
| 2023 | 169/365 e, 182 w1 | 364/365 | 293 e, 365 w1 | 304 e, 306 w1 | 91 e, 105 w1 | 106/365 |

2021 is the cleanest year the surface has ever produced: 100 percent within-1 on every prayer, isha
− maghrib exactly 80 on all 365 days. 2022 holds the standing recipe to 31 August. Then the feed's
own history breaks, and the breaks are dated:

### The dated interruptions (never blend across them)

| Span | What the data shows | Character |
|---|---|---|
| 2022-09-01..09-30 | iv 73/74 only, every other prayer standing-exact | isha override month (the June-class) |
| **2022-10-01..2022-12-31** | asr = **Hanafi** + 1 (38/92 exact, within-1 clean; Shafi is +44..+52 out); maghrib = sunset **+0** (82/92); fajr 18.4 trunc 30/92; iv 75..80 | **a three-month Hanafi generation — a genuine regime change** |
| 2023-01-01..02-28 | asr back to **Shafi** + 1 (42/59); maghrib sunset **+0** (56/59); fajr 18.4 (55/59); iv 76..81 | mixed generation, maghrib still unset |
| 2023-03 | iv 73/74, else standing | isha override month |
| 2023-04 | fajr +2.0 all month (reads as fajr 18.0); iv 74..78 | fajr-override month |
| 2023-05-01..07-31 | standing recipe again (fajr 89/92, asr 85/92, maghrib 90/92, iv 80 × 92) | clean quarter |
| 2023-08-01..12-31 | fajr **18.0** truncate (109/153 exact; 18.2 and 18.4 exact on 0); maghrib +3 (153/153); asr Shafi; iv 72..80 | fajr re-angled + isha override, five months |

From 2024-01-01 the held record shows the standing recipe restored (with the known April/June
overrides). The Trustees' "three constructions" CONFLICT now has a feed-side explanation: the feed
itself printed a Hanafi-asr, sunset+0-maghrib generation for exactly one quarter.

### Verdict

- **Standing recipe span:** 2021-01-01 .. 2026 (six named years), exact-clean in 2021, 2022-01..08,
  2023-05..07 and the held 2024-2026 — the long-run generator, never a one-year artefact.
  STABLE-ACROSS-6-YEARS for the recipe, with the interruptions dated above.
- **Regime changes:** 2022-10-01 (asr school switch, reverted 2023-01-01; maghrib margin restored
  2023-03-01; fajr angle restored 2024-01-01). The feed's edit history is the regime register.
- Rows banked: 1,095. Honest note: 2021-2023 rows carry iqamah fields as captured, untouched.

---

# Continuation O1l-B1r (2026-11-11, after the provider quota stop)

Sections 1 and 2 above were verified against the files on disk before any new request was made:

- Saudi: 14 captures, 7 Hijri years × 2 cities, all HTTP 200, every file 254-255 KB, every fit line
  present in `data/sa-century-fit.out` (22 scored year-city files, 6,379 rows). No request repeated.
- Hong Kong: `captures/hk-kowloon-2021-2023.json`, 441,179 B, 1,095 rows 2021-01-01..2023-12-31,
  fit in `data/hk-2021-23-fit.out`. No request repeated.

Everything below is new capture.

---

## 3. MALDIVES — the 2036 "horizon" is a relabelled table, not a span

### The MUIS door is closed, the mirror is open

`islamicaffairs.gov.mv` returns a Cloudflare block page ("Sorry, you have been blocked") on the
root, on `/dv`, on the API path and on `www` — four probes, four refusals, saved in
`captures/mv-muis-*.txt`. No MUIS day API was reachable, so the day-API route the mission named is
an honest negative.

The mirror is `namaadhuvaguthu.com` (Arushad), a Maldivian prayer-time site. Its own form POSTs to
`/en` and redirects to a clean GET pattern:

`https://namaadhuvaguthu.com/en/prayertimes/<islandId>/<year>/<month>`

Island ids found by probing: Malé `415`, HA. Thuraakunu `1` (north, 7.1 N), GDh. Hoadedhdhoo `900`
(south, 0.45 N). Harvest: Malé full years 2027/2031/2036 (12 months each), the two islands at
January and July of the same three years. 48 GETs, 48 × 200.

| Surface | Rows | Span |
|---|---|---|
| Malé (415) | 1,096 | 2027, 2031, 2036 full years |
| HA. Thuraakunu (1) | 186 | Jan+Jul of 2027, 2031, 2036 |
| GDh. Hoadedhdhoo (900) | 186 | Jan+Jul of 2027, 2031, 2036 |

Parsed from each row's own `class="day D-M-Y N"` date string, never from the month header.

### The year test the mission demanded: the years do NOT differ

Month-day aligned, 2027 against 2031 and 2036:

```
male         2027 vs 2031  0/365 rows differ    2027 vs 2036  0/365 differ
thuraakunu   2027 vs 2031  0/62  rows differ    2027 vs 2036  0/62  differ
hoadedhdhoo  2027 vs 2031  0/62  rows differ    2027 vs 2036  0/62  differ
```

Two further probes settle the cause: the same page for **1990** and for **2050** prints
`04:54 06:11 12:13 15:34 18:08 19:25` for 1 January, byte-identical to 2027, 2036 and the banked
2026 page. The site relabels the year in the row class and prints one frozen table.

**Verdict: FROZEN-GENERATION, confirmed by direct test.** The record already graded Maldives this
way; the 2036 "horizon" is a label on one computed generation, not a served future. No span can be
claimed, and none is.

### Fit (adhan 4.4.6, TZ Indian/Maldives, MABIMS 20/18, Shafi, nearest)

Recipe as the record states it: fajr +5, sunrise −2, dhuhr +4, asr +1, maghrib +2, isha +4.

| Surface-year | exact | within-1 | worst |
|---|---|---|---|
| Malé 2027 | 71.6 pc | 100.0 pc | 1 |
| Malé 2031 | 71.7 pc | 100.0 pc | 1 |
| Malé 2036 | 65.8 pc | 99.9 pc | 2 |
| Thuraakunu 2027/2031/2036 | 67.5 / 67.5 / 63.2 pc | 98.7 / 98.7 / 97.8 pc | 3 |
| Hoadedhdhoo 2027/2031/2036 | 69.6 / 68.5 / 65.6 pc | 100 / 100 / 100 pc | 1 |

A 15,625-set sweep of the six integer margins on Malé 2031 returns the record's set as the unique
maximum (71.7 pc exact, 100 pc within-1): the census recipe is confirmed, not merely reused. The
residual is sub-minute rounding, which is why exact sits near 70 pc while within-1 is total.

Seasonal amplitude: Malé fajr 04:54-05:05 in January against 04:39-04:46 in July (16 min);
Thuraakunu 05:02-05:11 against 04:36-04:45 (26 min); Hoadedhdhoo 04:51-05:03 against 04:49-04:54
(5 min). The spread is latitude's, as the near-equator framing predicts.

Honest caveats: the Thuraakunu point is nominal (7.10/72.87, not published by the site), which is
why its isha exact rate is 27 pc against Malé's 63 pc. Island coordinates are public place values,
never a device reading.

---

## 4. KAZAKHSTAN — the unfitted years, and the publisher's script unchanged

muftyat.kz serves no times: its page computes them in the browser from its own
`/static/muftyat/scripts/prayTimes.js`. Harvest therefore means running the served script with the
page's own settings (ISNA 15/15, Hanafi asr, AngleBased high lats, the 48 N margin block, dst
forced to 0 because the page passes `auto` and reads the visitor's zone).

Eight Astana years harvested: 2026, 2027, 2029, 2033, 2035, 2040, 2050, 2075 — **2,921 rows**,
`data/kz-astana-<year>.json`. Four of those (2035, 2040, 2050, 2075) were already fitted by deep1;
2027, 2029 and 2033 are new.

**The script has not changed.** The served `prayTimes.js` fetched this run (15,055 B, md5
`9541aeec36f1a75ef07097195b0d794a`) reproduces deep1's banked 2026 table cell-for-cell: 365/365
days, 0 differing cells. A publisher-side engine swap is the residual risk every PROVEN row
carries; for this surface it is measured and absent since the o1k capture.

### Fit (adhan 4.4.6, TZ Asia/Almaty, ISNA 15/15, TwilightAngle, Hanafi, sunrise −5 / dhuhr+asr+maghrib +5)

| Year | exact | within-1 | worst | asr exact | dhuhr exact |
|---|---|---|---|---|---|
| 2026 | 86.3 | 100.0 | 1 | 59.2 | 99.5 |
| 2027 | 86.2 | 100.0 | 1 | 60.3 | 99.7 |
| 2029 | 85.6 | 100.0 | 1 | 57.8 | 99.5 |
| 2033 | 85.7 | 100.0 | 1 | 58.4 | 99.5 |
| 2035 | 87.0 | 100.0 | 1 | 60.5 | 99.2 |
| 2040 | 86.3 | 100.0 | 1 | 61.7 | 99.5 |
| 2050 | 85.8 | 100.0 | 1 | 59.2 | 99.5 |
| 2075 | 86.3 | 100.0 | 1 | 61.9 | 100.0 |

One recipe, 49 years apart, flat: exact 85.6-87.0 pc, within-1 100.0 pc in every year, worst 1
everywhere. The asr column's 58-62 pc is the known ±1 rounding sensitivity, not a drift. Dhuhr
carries the record's constant +1 model bias.

Seasonal amplitude: fajr 06:18-06:36 in January against 02:11-02:31 in July — a 4 h 07 min swing
driven by the TwilightAngle clamp, identical in 2026 and 2075. The amplitude is latitude's, not the
era's.

**Verdict:** PROVEN-TO-2100 stands, and the 2027/2029/2033 gap inside it is closed. The margin block
is an integer added after rounding, so the 48 N test cannot interact with the year; no regime change
exists in the harvested range.

Honest caveat: this is the publisher's generator re-run locally, not a new served table. It proves
the recipe and the script are stable; it cannot prove a 2075 paper was printed.

---

## 5. SPAIN — the PDF route is purged; the poster uploads are not

The record's cheapest European buy was `centro-islamico.com/Doc/Horario/<year>/<Mes>-<year>.pdf`.
Probed this run, one request per year:

| Year | Enero PDF |
|---|---|
| 2020 | 404 |
| 2021 | 404 |
| 2022 | 404 |
| 2023 | 404 |
| 2024 | 404 |
| 2025 | **200**, 324,729 B |
| 2026 | **200**, 317,145 B |

Five naming variants for 2024 (`enero-2024`, `01-2024`, `Enero_2024`, the directory itself, and the
2023 control) all fail: 404 for the files, 403 for the directory listing. Wayback holds exactly one
`/Doc/Horario/` PDF (2025 Septiembre). **The PDF route buys nothing before 2025.**

The posters survive as WordPress uploads, and the live host still serves them full size:
`https://centro-islamico.com/wp-content/uploads/<yyyy>/<mm>/Horario-<Mes>-<year>.jpg`. The upload
directory is not the poster's own month (Enero 2024 sits in `2023/12`, Marzo in `2024/02`), so each
month is probed across the neighbouring directories. `wp-json/wp/v2/media` is Cloudflare-gated
("Just a moment"), so enumeration is by probe; log in `captures/es-uploads.txt`.

**Six of twelve 2024 months are served**: Enero (494,053 B), Marzo (491,799), Abril (376,120), Mayo
(488,138), Junio (481,035), Julio (491,777) — all 1654×2327 JPEG posters. Agosto through Diciembre
return 404 in every probed directory.

### 2024 Madrid, transcribed and fitted

184 rows transcribed by eye from the six posters (`data/es-2024-transcribed.json`), 2024-01-01 ..
2024-07-31. Print defect recorded: **31 March prints its own DST-shifted row** (fajr 06:26 against
05:28 on 30 March) in a highlighted band, and the transcription keeps it as printed.

Fit at Madrid's own point (40.4168/−3.7038), adhan 4.4.6, TZ Europe/Madrid, fajr 18 / isha 17, Shafi,
margins sunrise −2 / dhuhr +1 / asr +1 / maghrib +2 / isha +1 / fajr 0:

| Month | exact | within-1 | worst |
|---|---|---|---|
| 2024-01 | 59.1 | 100.0 | 1 |
| 2024-03 | 39.8 | 94.6 | 2 |
| 2024-04 | 31.1 | 95.0 | 2 |
| 2024-05 | 45.7 | 95.7 | 2 |
| 2024-06 | 71.7 | 100.0 | 1 |
| 2024-07 | 52.7 | 95.7 | 2 |
| **all** | **50.0** | **96.8** | **2** |

Per column (exact / within-1): fajr 53/97, sunrise 42/95, dhuhr 73/100, asr 54/100, maghrib 45/100,
isha 32/89.

A sweep of fajr 17.5-18.5 against isha 16.5-17.5 selects **18/17** as the best pair, not the record's
18.25; the difference is inside the residual and the record's reading is not contradicted, only not
preferred on this month set. The two-month ±0.3 min wobble the record names shows up here as the
March/April worst-2 cells.

**Verdict:** the Spain backward buy is real but changes shape — image posters, one directory probe
per month, transcription required, and only six months of 2024 are served. That is a **third year at
184 rows**, enough to test the recipe across a year boundary but not a full year, so the grade stays
where the record left it: STABLE-ACROSS-2-YEARS is now a 2.5-year basis, not yet 3.

Honest caveat: this table was transcribed by eye, not parsed. The fit is its own check — a single
misread cell would surface as a lone 2 — and the 96.8 pc within-1 says no such slip is systematic.

---

## 6. CHILE — the Wayback inventory, and a 2016 capture that dates a construction change

### Inventory (CDX, `radioislam.cl`, domain match, 3,000-row slice, 136 horario-class URLs)

Four naming eras, each with its own shape:

| Era | URL shape | Dated examples |
|---|---|---|
| A. Joomla per-city PDFs | `/ARCHIVOS/horarios/<yyyy>/<mm>_<mes>/<code>.pdf` | 2016-03 (17 city PDFs), 2016-07 (Copiapó) |
| B. WordPress dated posts | `/<yyyy>/<mm>/<dd>/horarios-de-oraciones-<mes>-<yyyy>/` | 2018-02 .. 2021-07, monthly |
| C. Numbered posts | `/horarios/horarios-de-oraciones-<mes>-<yyyy>/<dd>/<mm>/<yyyy>/` | 2021-10 .. 2022-12, monthly |
| D. Yearless slugs | `/horarios-oraciones-<mes>/` | 2023-05 .. 2025-03 |

Era B and C pages carry the table as a **PNG upload**, not text (2019-10 capture confirmed: the
month table is one `wp-content/uploads` image). Era A is the only text-parseable era.

### Capture (era A, 2016)

18 PDFs via Wayback at exact CDX timestamps: 17 cities for March 2016 (51-53 KB each) plus Copiapó
for July 2016 (77 KB). **558 rows** — `data/cl-2016-03.json` (527) and `data/cl-2016-07.json` (31).
Every page prints the same header ("Mezquita As-Salam, Centro Islámico de Chile"), so the city is the
filename code only. Print defect recorded: **dhuhr prints on a 12-hour clock** (01:54 = 13:54) while
the other five columns print 24-hour.

### Fit — coordinates recovered, then margins read off

Points fitted on sunrise and dhuhr only (the two columns with no published guard), 18/17 Shafi:

| Code | Recovered point | Nearest city | km | exact | within-1 | worst |
|---|---|---|---|---|---|---|
| ari | −18.65/−70.35 | Arica | 19 | 94 | 100 | 1 |
| ant | −24.70/−70.44 | Antofagasta | 117 | 82 | 100 | 1 |
| cal | −33.00/−71.25 | Viña del Mar | 28 | 91 | 100 | 1 |
| conc | −36.75/−73.00 | Concepción | 10 | 92 | 99 | 2 |
| cop | −28.60/−70.38 | Copiapó | 137 | 68 | 100 | 1 |
| coy | −46.26/−72.11 | Coyhaique | 76 | 70 | 99 | 2 |
| mon | −42.00/−73.00 | Puerto Montt | 59 | 81 | 100 | 1 |
| pun | −53.57/−70.96 | Punta Arenas | 45 | 70 | 97 | 3 |
| ran | −34.25/−70.75 | Rancagua | 9 | 95 | 99 | 2 |
| san | −34.25/−70.75 | Rancagua | 9 | 77 | 100 | 1 |
| ser | −30.50/−71.25 | La Serena | 66 | 83 | 100 | 1 |
| tal | −36.39/−71.71 | Talca | 107 | 70 | 100 | 1 |
| tem | −39.00/−72.50 | Temuco | 30 | 86 | 100 | 1 |
| val | −40.00/−73.25 | Valdivia | 21 | 92 | 99 | 2 |
| vin | −33.40/−71.54 | Valparaíso | 40 | 87 | 100 | 1 |
| anto / fel | −31.75/−70.75, −31.75/−70.25 | Viña del Mar | 160/187 | 84/85 | 99/100 | 2/1 |

One recipe across 34.9 degrees of latitude: fajr 18, isha 17, Shafi, **maghrib sunset + 5.4..6.5**,
fajr +0.9..3.7, asr +0.7..2.0, sunrise −0.6..0, dhuhr +0.2..1.0, isha −1.0..+1.7. Within-1 97-100 pc
in every city. The July Copiapó file fits the same recipe in the opposite season (maghrib +5.4,
exact 92 pc, within-1 100 pc), which is the second-season test.

### The dated construction change

The 2016 posters carry **no constant clock offset**: sunrise fits at −0.4 min across all 17 cities,
and every recovered point lands within 9-190 km of a named Chilean city. The 2025/2026 workbook the record
holds carries **+6 min on every column including shuruq**, which the record itself reads as a
workbook clock offset.

Two readings fit the evidence, and the data cannot separate them:

1. The publisher's clock offset changed between the 2016 edition and the 2025 edition.
2. The reference points moved about 1.5 degrees east at some point after 2016.

Either way the recipe's constant is not transportable across 2016-2025, and the record's Chile span
must not blend the two. This is a **dated regime boundary bounded 2016-03 .. 2025-10**, exact date
unknown, and it is the first evidence that the CIS workbook is a different construction from the
CCICH posters that preceded it.

**Verdict:** the 2016 capture lifts Chile's basis from two months in two years to three months in
three years across ten years, on a recovered-and-scored recipe — but the two editions are separate
regimes, so the span is split, never blended. Grade: candidate-plus, not A, because no second year
exists inside either regime.

Honest negatives: era B/C tables are images, so 2018-2022 would need OCR; `anto` and `fel` recover to
a point 160-187 km from any named city, so their identity is not asserted; the two Copiapó months
recover to points 137 km apart, which is a publisher-side point drift, not a fit failure.

---

## What this run adds to the ledger

- **Saudi:** unchanged, verified (no request repeated).
- **Maldives:** the 2036 horizon is a relabelled frozen table — the ledger's FROZEN-GENERATION row
  gains a direct test rather than an inference.
- **Kazakhstan:** the 2027/2029/2033 gap inside PROVEN-TO-2100 is closed; the publisher's script is
  byte-stable since the o1k capture.
- **Spain:** the `/Doc/Horario/` backward route is dead before 2025; the upload-poster route replaces
  it, and six 2024 months are banked and fitted (184 rows, within-1 96.8 pc).
- **Chile:** a 2016 era captured and fitted, and a construction boundary dated to the 2016-2025
  window.

Raw captures: 136 files under `captures/` (Maldives 78, Chile 26, Spain 13, Kazakhstan 3, Saudi 15,
Hong Kong 1).
