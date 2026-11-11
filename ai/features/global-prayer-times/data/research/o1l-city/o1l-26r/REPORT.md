# O1l-26r — Central Asia second cities (Kazakhstan, Kyrgyzstan, Uzbekistan, Tajikistan, Azerbaijan, Turkmenistan)

Agent: O1l-26r. Workspace: `$HOME/athan-gitree/census/o1l-city/o1l-26r/`.
Engine: adhan 4.4.6 (`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`), `Rounding.None`,
TZ pinned per country in every fit, dates built from literal capture strings, no clock reads.
Nothing declared complete.

## 1. KAZAKHSTAN — seven second cities, three years each, per-city scores

Surface: `https://www.muftyat.kz/ru/namaz_times/` (authority, DUMK). The page's own settlement
list carries 96 entries with `data-lat` / `data-lng` / `data-tz`; the coordinates below are the
publisher's own, read from that list, not a gazetteer. Table rendered by the page's own
`timesByPeriod()` with `prayTimes.getDst` forced to 0 (the visitor-clock DST trap re-confirmed:
without the patch a summer date reads +60 on every column).

Recipe fitted (the recorded one, unchanged): ISNA 15/15, Hanafi asr, `HighLatitudeRule.TwilightAngle`,
margin block switched at 48 N (set A <48: sunrise −3, dhuhr/asr/maghrib +3; set B ≥48: sunrise −5,
dhuhr/asr/maghrib +5; fajr and isha uncorrected).

| city | lat | set | 2025 exact / w1 | 2026 exact / w1 | 2027 exact / w1 | fajr Jan→Jul span |
|---|---|---|---|---|---|---|
| Aktobe | 50.300377 | B | 85.3 / 100 | 87.0 / 100 | 86.9 / 100 | 240 min |
| Atyrau | 47.116667 | A | 87.0 / 100 | 88.8 / 100 | 89.3 / 100 | 240 min |
| Kostanay | 53.219333 | B | 84.6 / 100 | 82.9 / 100 | 84.4 / 100 | 300 min |
| Pavlodar | 52.315556 | B | 85.7 / 100 | 85.1 / 100 | 84.0 / 100 | 300 min |
| Ust-Kamenogorsk | 49.948325 | B | 87.2 / 100 | 86.2 / 100 | 86.8 / 100 | 240 min |
| Taraz | 42.883333 | A | 91.1 / 100 | 90.9 / 100 | 91.2 / 100 | 180 min |
| Turkistan | 43.302025 | A | 92.4 / 100 | 90.5 / 100 | 90.5 / 100 | 180 min |

Every prayer of every city-year is 100 pc within-1; exact 82.9-92.4 pc. The exact rate falls with
latitude (Turkistan 90.5 at 43.3 N, Kostanay 82.9 at 53.2 N) because the twilight-angle clamp binds
more days further north. Per-column, asr is the weakest exact column everywhere (50-73 pc) with MAE
0.35-0.40 min: the Hanafi asr is a long shadow and the minute grid is coarse there, not a rule defect.
Between-year stability: FROZEN. The ±1.5 pc exact wobble between years is rounding-grid noise, not a
parameter shift; no year moves a bias off zero.

Span: 27 city-years, 9,855 dated rows (9 × 365 × 3).

### The 48 N line — the one-each-side sample, settled by measurement

The publisher's own list holds exactly three settlements within 0.1 deg of the line:
Ayagoz 47.966667 (set A), Satpaev 47.907455 (A), Karazhal 48.001042 (B). Karazhal is 0.001042 deg
above the line; Ayagoz is 0.033333 deg below. Cross-test: fit Karazhal with set A and Ayagoz with
set B, and sunrise/dhuhr/asr/maghrib land exactly 2.00 min off with 0.0 pc exact on all four columns
(MAE 1.96-2.02), while the correct set gives MAE 0.00-0.39. The line is a HARD latitude switch, not a
smooth function, and a settlement 0.001 deg above it takes the +5 set. The recorded defect stands as
recorded; nothing on the line is smoothed.

## 2. KYRGYZSTAN — Jalal-Abad, Karakol, Naryn, full 2026

Surface: `https://muftiyat.kg/ru/api/v1/calendar/` (authority, documented JSON API). Location codes
7 (Karakol) and 30 (Naryn) served directly. Jalal-Abad has NO location code in the publisher's own
`alllocations` list (115 entries, no name contains "абад") — captured through the API's documented
coordinate door at 40.9333/73.0000 and recorded as such. Coordinates for Karakol and Naryn were
recovered from the served rows (sunrise + dhuhr + sunset inversion): Karakol 42.50/78.47,
Naryn 41.44/76.07, residual 0.41 min per column-day.

Recipe (the recorded one): fajr 18.0 flat, maghrib = sunset + 7, isha = maghrib + round(k ×
(sunrise − fajr) + 3.5), Hanafi asr.

| city | fajr w1 | maghrib−sunset | isha ratio w1 (k=7/9) | isha ratio w1 (k=0.775) | asr Hanafi w1 | asr Shafi w1 |
|---|---|---|---|---|---|---|
| Karakol | 100 | 7 on 365/365 | 98.9 | 98.6 | 49.3 | 0.0 |
| Naryn | 100 | 7 on 365/365 | 98.4 | 99.5 | 47.1 | 0.0 |
| Jalal-Abad | 100 | 7 on 365/365 | 96.2 | 99.5 | 47.4 | 0.0 |

Fajr is 18.0 exactly: 100 pc within-1 at all three, and a 0.5-degree step to 17.5 or 18.5 drops it
to 0 pc with MAE 3.1-3.5 min. Hanafi asr is decisive (Shafi 0.0 pc within-1). The ratio constant is
a BAND, refined: at these three cities 0.775 scores better than 7/9 on exact and MAE (0.43-0.47 vs
0.55-0.58) without separating on within-1, so the recorded band 3.2-3.5 holds and 0.775 is the
better point inside it.

Seasonal amplitude (fajr, 15 Jan → 15 Jul): Karakol 198 min, Naryn 190 min, Jalal-Abad 185 min.
Span: 3 city-years, 1,095 rows.

## 3. UZBEKISTAN — Bukhara, Nukus, Fergana, Andijan (+ Tashkent anchor)

Surface: `https://islom.uz/taqvim/oylik` (the portal's monthly table, client-computed; its own
`new.islom.uz/api/v1/regions` supplies 91 regions with coordinates and `differ_minute`). November
2026 captured for all five; the Hijri tab adds 11 Nov - 9 Dec for Bukhara. No month selector exists
and no URL parameter moves the month: the portal serves the current month only.

Recipe fitted: fajr 15.5 / isha 15.5, Hanafi asr, no adjustments except ishroq = sunrise + 20 and
maghrib = sunset + 4.

| city | region coord | fajr | sunrise | ishroq | dhuhr | asr | maghrib | isha |
|---|---|---|---|---|---|---|---|---|
| Tashkent | 41.300872/69.241813 | 30/30 | 30/30 | 30/30 | 30/30 | 30/30 | sunset+4 | 30/30 |
| Bukhara | 39.772300/64.423324 | 30/30 | 30/30 | 30/30 | 30/30 | 30/30 | sunset+4 | 30/30 |
| Nukus | 42.471325/59.616820 | 30/30 | 30/30 | 30/30 | 30/30 | 30/30 | sunset+4 | 30/30 |
| Fergana | 40.376952/71.793129 | 30/30 | 30/30 | 30/30 | 30/30 | 30/30 | sunset+4 | 30/30 |
| Andijan | 40.786215/72.328205 | 30/30 | 30/30 | 30/30 | 30/30 | 30/30 | sunset+4 | 30/30 |

Every column except maghrib is EXACT on 30/30 days at all five cities (MAE 0.00); maghrib is exactly
sunset + 4 on 30/30. Bukhara's Hijri window (29 rows, 11 Nov - 9 Dec) reproduces all seven columns
exactly as well, 29/29.

CORRECTION to the record: the object's "display margins +5 added at render time" does not hold at any
of these five cities. The real block is maghrib + 4 and ishroq + 20, with dhuhr, asr, fajr and isha at
ZERO margin. `differ_minute` is not an additive correction either: it is already inside the region
coordinates (Fergana carries a null and fits exactly like the others). Span: 179 rows, one published
cycle, candidate class.

## 4. TAJIKISTAN — Khujand, window grammar, two months

Surface: `https://shuroiulamo.tj/tj/namaz` and its `POST /tj/namaz/ntime` month endpoint (authority,
Shuroi Ulamo). The table is WINDOW-CLASS: six intervals per day — Бомдод, Пешин, Аср, the disliked
sunset interval ("Фурӯ рафтани офтоб…"), Шом, Хуфтан. July 2026 (31 rows) and November 2026 (30 rows)
captured, both seasons.

THE PER-CITY GRAMMAR, new: the authority publishes ONE Dushanbe table plus a per-city minute-offset
list in its own footnote. Khujand is **−3 minutes on every bound** (verbatim list: Истаравшан −1,
Кӯлоб −4, Хуҷанд −3, Рашт −6, Конибодом −6, Исфара −7, Ашт −6, Хоруғ −11, Мурғоб −20, Ҳамадонӣ −3,
Ш. Шоҳин −5, Муминобод −5; after Dushanbe: Бохтар +4, Панҷакент +5, Шаҳритус +3, Айнӣ +1,
Н. Хусрав +4, Турсунзода +3). A second city therefore costs one subtraction, not a second table.

Window spans measured (Dushanbe = Khujand + 3, identical durations): fajr 89-94 min, dhuhr 161-322 min
(ends where asr begins), asr 93-99 min, the disliked sunset interval 18-21 min, maghrib EXACTLY 40 min
on all 61 days, night 352-664 min and crossing midnight. Windows chain contiguously where printed
(93/155 joins in July, 88/150 in November); the gap sits between maghrib and the night window.

Window-class confirmed, not an instant rule: against adhan 18/18 Hanafi at Dushanbe's coordinates the
bounds move by a different offset per column and per season (fajr start +12 min median with a 0.6-19.8
spread, sunset window start −11, maghrib start +11, night start −6). No single angle reproduces them.
Span: 61 days, two months, both seasons.

## 5. AZERBAIJAN — Baku mosque layer + the muftiate template

**Muftiate (authority) — image-only CONFIRMED, template now named.** `qafqazislam.com` serves the
namaz təqvimi at `https://www.qafqazislam.com/teqvim/{year}/{City}/{MM}.jpg` for ~80 enumerated cities,
years 2025 and 2026 only. Baku November 2026 captured (813 KB JPEG, CMYK, 1200×1696). 2027 redirects
(302) — the O1k-10 correction holds today. No text layer, no OCR attempted.

**mawaqit mosque (platform) — Şəhidlər Xiyabanı Məscidi, Baku**, 40.3657367/49.8275643,
`mawaqit.net/en/shehidler-xiyabani-mescidi-…`. Its `confData` carries the full-year `calendar`
(12 months × 31 days × 7 values), `times`, `shuruq`, `jumua` 12:25 and a separate `iqamaCalendar`.
Fit: fajr 16.0 / isha 15.0, Hanafi asr (a 0.1-degree sweep puts the fajr optimum at 16.1; the column
figures below are the 16.0/15.0 fit) — fajr 91.5 pc, shuruq 96.4, dhuhr 99.7, asr 99.7,
isha 96.4 within-1. Maghrib is the mosque's own precaution margin, NOT the platform default:
published maghrib − adhan sunset runs 12-17 min across the year (mode 15). Engine note: the residuals
sit inside the recorded mawaqit-family engine difference (adhan reports the phantom −1 dhuhr here
too: bias −0.36).

**nam.az (community/platform) — full 2026 year, 365 dated rows.** `nam.az/baku/{MM}/{DD}` serves any
date of 2026. Reproduces MWL 18/17 with SHAFI asr at 40.4093/49.8671: 100 pc within-1 on all six
columns, exact 95.9 fajr / 97.3 sunrise / 99.7 dhuhr / 52.6 asr / 97.3 maghrib / 86.3 isha.
The asr school is the discriminator against the mawaqit mosque (15:07 vs 15:44 on 1 Jan, same
sunrise and dhuhr to the minute).

## 6. TURKMENISTAN — negative reconfirmed

Searched in Turkmen ("namaz wagty", "Türkmenistanyň müftüligi namaz wagty", "metjit"), Russian
("время намаза Туркменистан", "муфтият Туркменистана"), and English. No muftiate site exists. Every
dated table returned is a third-party aggregator (aladhan, namazvakti.co.uk in TM language,
prayertimes.date, azaneum, 5namaz, time-namaz) — platform class, no publisher behind them. The one
state-domain hit, `turkmenistaninfo.gov.tm`, carries a news item announcing Eid al-Adha prayer times
in the mosques; its body does not render and it is jama'ah-class, one event, not a daily table.
Verdict: FALLBACK stands for authority surfaces. Not found under these terms.

## 7. Honest negatives and open leads

- Jalal-Abad has no location code in muftiyat.kg's own 115-entry list; only the coordinate door serves it.
- islom.uz exposes no month selector and no month URL parameter; the portal serves the current month only,
  so Uzbekistan stays candidate-class at 30-39 rows per city.
- masjidbox returned no Baku mosque under English, Azerbaijani or Turkish search terms.
- The muftiate's 2027 Azerbaijani images are not posted (302 to HTML).
- KZ: the publisher's dropdown lists 96 settlements, not the 5,694 the census records for the authority;
  the wider list is not reachable from this page and was not found elsewhere in this session.

## 8. Files

- `captures/` — every raw surface: KZ page HTML, KG JSON windows and `alllocations`, UZ month tables and
  `regions` JSON, TJ month responses and the footnote page, AZ mawaqit HTML, nam.az page, the muftiate JPEG.
- `data/` — normalized rows: `kz-<city>-<year>.json` (27 files), `kg-<city>-2026.json` (3),
  `uz-<city>-2026-11.json` (5) + `uz-bukhara-1448j1.json`, `tj-dushanbe-2026-{07,11}.json` and
  `tj-khujand-2026-{07,11}.json`, `az-baku-namaz-2026.csv` (365), `az-baku-mawaqit.json`.
- `scripts/` — `kz-pull.sh`, `kz-batch.sh`, `fit-kz.js`, `kg-pull.sh`, `kg-fit.js`, `uz-month.sh`,
  `uz-fit.js`, `az-namaz-pull.sh`.
