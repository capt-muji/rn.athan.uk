# O1m-25: Kazakhstan's 96 settlements, the whole publisher list, and the 48 N line densified

Agent: O1m-25 (wave O1m-25, round o1m). Workspace: `$HOME/athan-gitree/census/o1m/o1m-25-kazakh/`.
Engine: adhan 4.4.6 (`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`), `Rounding.None`,
`HighLatitudeRule.TwilightAngle`, Hanafi asr, timezone pinned to the publisher's own `data-tz` (5 at
every settlement), dates built from literal capture strings. Nothing reads the clock into data. The
repo was not touched. Nothing here is declared complete.

## 1. The surface, and a second door the record did not have

The publisher (DUMK, the Spiritual Administration of Muslims of Kazakhstan) serves its table at
`https://www.muftyat.kz/ru/namaz_times/`. The page computes every cell in the browser from
`/static/muftyat/scripts/prayTimes.js` (PrayTimes 2.3, sha1 prefix `016c04a7a820a0d7`) through its own
`timesByPeriod()`, which is a thin wrapper:

- `prayTimes.setMethod('ISNA')`, `adjust({asr:'Hanafi'})`, `adjust({highLats:'AngleBased'})`.
- `getTimes(date, [lat,lng], tz, 'auto', '24h')` with `getDst` forced to 0 by the page's own patch.
- a margin block applied AFTER the minute rounding: latitude `< 48` gives sunrise -3 and
  dhuhr/asr/maghrib +3. Latitude `>= 48` gives sunrise -5 and dhuhr/asr/maghrib +5. Fajr and isha
  take no margin.

The publisher also runs a documented public API, linked from the page itself as "Получить API" and
documented on `https://namaz.muftyat.kz/kk/namaz/api/`:

- `https://api.muftyat.kz/prayer-times/{year}/{lat}/{lng}` returns a whole year, one JSON row per
  day, with `imsak`, `fajr`, `sunrise`, `dhuhr`, `asr`, `sunset`, `maghrib`, `isha`, `midnight`,
  `Date`. This is a SERVER-SIDE computation that honours the year input, and it is a second witness
  beside the page script.
- `https://api.muftyat.kz/cities/` is the publisher's full national gazetteer, 5,694 entries with
  coordinates, region and district, paginated at 100 per page. All 57 pages banked. The o1l record
  said the wider list "is not reachable from this page". It is reachable, from the API page.

THE GATE RUNS THREE WAYS at every settlement-year: the live page's rendered DOM table, the served
engine re-run locally from the downloaded script, and the server API table. Every one of the six
published columns must agree to the minute.

| year | settlement-years | page render vs served engine | page render vs server API | engine vs API |
|---|---|---|---|---|
| 2026 | 96 | 0 differing of 210,240 cells | 0 of 199,290 (91 cities) | 0 of 199,290 |
| 2027 | 6 | 0 of 13,140 | 0 of 13,140 | 0 of 13,140 |
| 2028 | 6 | 0 of 13,176 | 0 of 13,176 | 0 of 13,176 |
| 2025 | 3 | 0 of 6,570 | 0 of 6,570 | 0 of 6,570 |
| 2045 | 2 | 0 of 4,380 | 0 of 4,380 | 0 of 4,380 |

113 settlement-years, 41,251 dated rows, 247,506 gated cells, zero disagreement on any route.
Row structure also gated: header `[year, Фаджр, Восход, Зухр, Аср, Магриб, Иша]`, day number and
Russian month name for all 365 or 366 rows, dates continuous, 366 rows in the leap year 2028.

**The API requires the publisher's own coordinate STRINGS.** `prayer-times/2026/47.799711/67.71409`
answers `404 {"detail":"Not found."}`. The identical point written `67.714090`, the form stored in
the publisher's own gazetteer, answers 200 with 365 rows. The endpoint matches the coordinate text.
Every pull here therefore takes `lat`/`lng` verbatim from `/cities/`. Recorded as a
defect, with both bodies kept.

## 2. Coverage

The publisher's dropdown holds exactly 96 settlements, one list under 18 regional optgroups,
replicated byte for byte in all four copies of the select on the page and on the Kazakh-language
mirror. All 96 banked for 2026.

| item | value |
|---|---|
| settlements | 96 (41 below 48 N, 55 at or above 48 N) |
| 2026 | 96 tables, 35,040 rows |
| 2027 and 2028 | the 6 settlements inside 47.5 to 48.5 N, 2,190 and 2,196 rows |
| 2025 and 2045 | the line's core three and two, 1,095 and 730 rows |
| coordinates | 40.775278 N to 54.941120 N, 50.262833 E to 84.969846 E, all `data-tz` 5 |
| rows total | 41,251, every one dated, no gap and no duplicate date |
| table sources | 108 settlement-years from the server API, 5 from the page render (see the 500s below) |

**The list's own defect: five of the 96 carry the literal label `None`.** Ids 5732, 5733, 5734, 5736
and 5737 are rendered by the Russian template with a missing title. The Kazakh mirror prints them
correctly, and the publisher's own gazetteer resolves them by id and coordinate, both giving the same
five names: БЕСТӨБЕ ауылы, ЗАВОДСКОЙ ауылы and АҚСУ ауылы (Akmola), ҚАШАР ауылы (Kostanay) and
ЖӘЙРЕМ ауылы (Ulytau). So the 96 is 96 settlements. The Russian page needs one template field.

Duplicate test: no two settlements share a point. Zero identical coordinate pairs, and the nearest
pair is Қостанай / Тобыл at 4.90 km, two distinct towns with two distinct tables. The next closest
are ЗАВОДСКОЙ / АҚСУ at 6.23 km and Ембі / Жем at 7.76 km.

Table identity test: the sha1 of the six-column 2026 table is distinct at every one of the 96
settlements, 96 distinct digests and zero duplicate groups. No settlement publishes another's table.

## 3. The 48 N line

**The rule is a hard switch at exactly 48.000000, measured on the served engine.** The page was
driven at ten latitudes on Karazhal's meridian for 2026-01-15:

| latitude | sunrise | dhuhr | asr | maghrib |
|---|---|---|---|---|
| 47.999999 | 07:59 | 12:29 | 15:09 | 16:54 |
| 48.000000 | 07:57 | 12:31 | 15:11 | 16:56 |

One part in a million of latitude flips all four shifted columns by exactly 2 minutes. Fajr and isha
are identical on both sides, which is what a margin block on the solar columns alone looks like. The
probe is `captures/probe-48n.json`, ten points from 47.9 to 48.2 N.

**Settlement coordinates: the list's own boundary cases are three, and all three obey the line.**
Within 0.1 deg of 48 N: Қаражал 48.001042 (set B), Аягөз 47.966667 (set A), Сәтпаев 47.907455
(set A). No settlement in the list disagrees with its latitude. Widening to 0.5 deg adds ЖӘЙРЕМ
48.333113 (B) above and Шалқар 47.831392 (A) and Жезқазған 47.799711 (A) below, six in all, still
unanimous.

**The wrong set is 2 minutes out, exactly, on four columns.** Per day, per settlement-year, the
published row was compared with both sets and the better-fitting set counted:

| settlement | lat | year | days | set A wins | set B wins | ties | A MAE | B MAE | days against the latitude rule |
|---|---|---|---|---|---|---|---|---|---|
| Ембі | 48.823344 | 2026 | 365 | 0 | 365 | 0 | 2.003 | 0.127 | 0 |
| Жем | 48.774532 | 2026 | 365 | 0 | 365 | 0 | 1.999 | 0.127 | 0 |
| ЖӘЙРЕМ | 48.333113 | 2026 | 365 | 0 | 365 | 0 | 2.005 | 0.112 | 0 |
| Қаражал | 48.001042 | 2026 | 365 | 0 | 365 | 0 | 1.995 | 0.132 | 0 |
| Аягөз | 47.966667 | 2026 | 365 | 365 | 0 | 0 | 0.119 | 1.988 | 0 |
| Сәтпаев | 47.907455 | 2026 | 365 | 365 | 0 | 0 | 0.125 | 2.000 | 0 |
| Шалқар | 47.831392 | 2026 | 365 | 365 | 0 | 0 | 0.122 | 2.000 | 0 |
| Жезқазған | 47.799711 | 2026 | 365 | 365 | 0 | 0 | 0.116 | 1.996 | 0 |
| Зайсан | 47.453008 | 2026 | 365 | 365 | 0 | 0 | 0.104 | 1.996 | 0 |
| Атырау | 47.116667 | 2026 | 365 | 365 | 0 | 0 | 0.125 | 2.008 | 0 |

At all 96 settlements the wrong-set score collapses to 26.6 to 31.1 pc exact with 1.35 to 1.40 min
MAE over all six columns, which is the two-minute step diluted by the two unshifted columns. The
full table is `fit/line.md` and `data/line-sets.json`.

**The switch is latitude-only.** Same test, three consecutive years including a
leap year, plus a far point:

| year | Қаражал 48.001042 | Аягөз 47.966667 | verdict |
|---|---|---|---|
| 2026 | B 365/365 days, A MAE 1.995 | A 365/365 days, B MAE 1.988 | holds |
| 2027 | B 365/365, A MAE 2.000 | A 365/365, B MAE 1.996 | holds |
| 2028 (366 days) | B 366/366, A MAE 2.005 | A 366/366, B MAE 2.005 | holds |
| 2025 | B 365/365 | A 365/365 | holds |
| 2045 | B 365/365 | A 365/365 | holds |

Not one day in 9,861 line settlement-days across five years picks the other set, and there is not one
tie: 3,650 settlement-days in 2026 over the ten settlements inside one degree of the line, 2,190 in
2027 and 2,196 in the leap year 2028 over six, plus 1,095 in 2025 and 730 in 2045 on the core pair.
The engine's own test is `if (lat < 48)`, with no date term anywhere in the block, so the measurement
and the code agree: a settlement's set is a function of latitude alone.

## 4. The fits

One recipe, 15/15 Hanafi with the margin block, on every settlement. Per-settlement per-column
scores are in `fit/fit-2026.md` (96 rows, exact / within-1 / worst for each of the six columns).
Grading follows the census definition: the model is the rounded adhan minute, exact means the
published minute equals it, within-1 means the difference is at most one minute.

| band | cities | exact % | within-1 % | fajr | sunrise | dhuhr | asr | maghrib | isha |
|---|---|---|---|---|---|---|---|---|---|
| 39 to 42 N | 3 | 91.20 | 100 | 94.8 | 97.3 | 99.5 | 70.4 | 96.7 | 88.5 |
| 42 to 45 N | 21 | 90.62 | 100 | 94.8 | 96.0 | 99.4 | 68.9 | 96.3 | 88.3 |
| 45 to 48 N | 17 | 89.17 | 100 | 92.8 | 95.2 | 99.5 | 65.7 | 94.6 | 87.1 |
| 48 to 51 N | 25 | 86.97 | 100 | 89.3 | 94.1 | 99.5 | 61.5 | 93.5 | 83.8 |
| 51 to 54 N | 27 | 84.74 | 100 | 84.9 | 93.0 | 99.5 | 56.1 | 92.5 | 82.5 |
| 54 to 57 N | 3 | 82.71 | 100 | 81.3 | 91.9 | 99.5 | 51.6 | 91.7 | 80.3 |

(Cell values are exact percentages.)

96 of 96 settlements are 100 pc within-1 on all six columns, all 365 days. City exact rates run
82.37 pc (Мамлют, 54.941 N) to 91.96 pc (Қаратау, 43.167 N), MAE 0.080 to 0.176 min. Between-year
stability on the six line settlements: FROZEN. Exact rates move inside a 1.5 pc band across 2026,
2027 and 2028 with no bias movement (per-column bias is 0.001 min or less in every year), which is
rounding-grid noise across years with no parameter shift. Seasonal amplitude, fajr 15 Jan to 15 Jul,
runs 176 min at 40.8 N to 272 min at 54.9 N, monotone in latitude.

The line's own fits, both sets shown, are the table above. The correct set sits at 0.11 to 0.13 min
MAE on the four shifted columns at every line settlement in every year, with exact rates of 87.0 to
88.9 pc, inside the national range for their latitude.

## 5. Residual structure

| column | exact % | within-1 % | MAE | bias | worst |
|---|---|---|---|---|---|
| fajr | 89.80 | 100.00 | 0.102 | 0.001 | +1 |
| sunrise | 94.45 | 100.00 | 0.055 | 0.002 | +1 |
| dhuhr | 99.49 | 100.00 | 0.005 | -0.001 | -1 |
| asr | 62.29 | 100.00 | 0.377 | 0.001 | -1 |
| maghrib | 94.06 | 100.00 | 0.059 | 0.001 | +1 |
| isha | 85.07 | 100.00 | 0.149 | 0.003 | -1 |

Every one of the 210,240 published cells for 2026 lies within one minute of the model, and the
distribution of the difference holds nothing but -1, 0 and +1. Counts over the 96 tables:

| column | -1 | 0 | +1 |
|---|---|---|---|
| fajr | 1,770 | 31,465 | 1,805 |
| sunrise | 941 | 33,096 | 1,003 |
| dhuhr | 101 | 34,863 | 76 |
| asr | 6,593 | 21,827 | 6,620 |
| maghrib | 1,021 | 32,960 | 1,059 |
| isha | 2,562 | 29,809 | 2,669 |

Three findings on the residual's shape.

1. **The dhuhr +1 bias recorded as a constant across the century does not appear here.** The dhuhr
   mean bias across 35,040 cells is -0.001 min, with 101 cells at -1 and 76 at +1. Kazakhstan's dhuhr
   carries no bias and is the most exact column in the recipe at 99.49 pc. The +1 reading holds in
   Egypt and belongs to that publisher's rule alone.
2. **The shortfall is all in asr, and it is a rounding artefact.** Asr is the only column near a coin
   flip: 62.29 pc exact, and symmetric (+6,620 and -6,593), which is what a value landing near a
   half-minute boundary does. The Hanafi shadow is long and slow, so the model minute sits close to
   the boundary on most days. The bias is +0.001 min, so no school or margin change is indicated. A
   night-fraction or Shafi variant only widens the spread.
3. **The latitude structure sits in the twilight columns.** Exact rates fall
   monotonically with latitude, -0.653 pc per degree (r = -0.965), and the fall is carried by fajr
   (94.8 pc at 39 to 42 N to 81.3 pc at 54 to 57 N), asr (70.4 to 51.6) and isha (88.5 to 80.3), while
   dhuhr, sunrise and maghrib stay inside 91.7 to 99.5 pc at every band. Further north the twilight
   angle the rule declares occupies a shorter and faster-moving part of the sky, so more days land
   near a minute boundary. This is the same mechanism o1l-26r measured on seven cities, now confirmed
   from 40.8 N to 54.9 N on 96.

Two extra published columns, both constants, checked over the 91 server tables (33,215 rows):
`imsak` is exactly fajr minus 10 on every row with no exception, and `maghrib` minus the same row's
`sunset` is exactly +5 at the 51 settlements at or above 48 N and exactly +3 at the 40 below, which
independently confirms where the publisher's margin block lands and that it is applied to the printed
maghrib rather than to the sunset.

## 6. Defects and negatives

- **The coordinate-string door.** The prayer-times endpoint matches the stored coordinate text. 16
  of the 96 carry a trailing zero in the gazetteer's decimal string, and the page's
  own dropdown serialises floats, so those 16 answer 404 while the other 80 answer 365 rows. The
  first pull here ran from the page's floats and is kept as `captures/api-float-form/`: 76 tables,
  byte-identical to the string-form pull of the same point, plus 16 404s and 4 of the 500s below.
  Every pull in `captures/api/` takes the coordinate verbatim from `/cities/`, and any future
  harness must do the same.
- **Five settlements have no server table at all.** Ids 156 Щучинск, 160 Есік, 164 Абай, 168
  Жітіқара and 169 Тобыл answer `500` at their own gazetteer coordinate string for 2025, 2026 and
  2027 alike, and `404` at any other decimal form, so the cause is a missing table. These are five
  of the 32 entries in the newest gazetteer generation, ids 150 and above. The page still computes
  all five correctly, so their tables here come from the rendered page and are gated against the
  served engine. Recorded as a live failure.
- **Five labels read `None`** in the Russian template, with the Kazakh mirror and the gazetteer
  carrying the names. Section 2.
- **The download button writes a file from the table the browser already computed.** Its handler
  posts that table with a hardcoded year and month in the request body (`$year = 2026`,
  `$month = 11`), so it carries no second computation and no table here relies on it.
- Not found under these terms: a second independent Kazakhstan authority surface. The muftiate is
  the only publisher found. The API and the page are one publisher with two computation routes.

## 7. NEXT

- The 96 is the publisher's DROPDOWN list. Its own gazetteer holds 5,694 settlements with coordinates
  and the same coordinate door, which puts a national layer of 5,694 settlement-years in reach at one
  request each. That is the next cheap lift for Kazakhstan and it needs no new surface, only a pull.
- The five 500s and the `None` labels are publisher-side and should be re-probed next round rather
  than assumed permanent. A 500 is a live failure and may clear on its own.
- Untested here: whether `imsak = fajr minus 10` survives the far horizon, and whether the margin block
  is the only latitude test in the publisher's stack. The engine probe at 48.000000 is a template for
  probing any other threshold the family may carry.

## 8. Files

- `captures/`: live page, the served `prayTimes.js` and `scripts.js`, the API page and its own
  documentation text, the 57 gazetteer pages, 108 API table responses plus the failure bodies, 113
  rendered page tables, the 48 N latitude probe, the `Date` header of the first pull.
  `captures/MANIFEST.md` lists every artifact with digest and stamp.
- `data/`: `kz-<id>-<year>.json` (113 settlement-years, ISO dated rows), `kz-settlements-96.json`
  (the list with both name forms and the canonical coordinate strings), `kz-kk-names-96.json`,
  `kz-live-list-96.json`, `kz-api-gazetteer-5694.json`, `kz-gate-<year>.json` (per-city gate
  result), `fit-<year>.json`, `line-sets.json`, `jobs-*.json`, `kz-publisher-list-96.json`.
- `fit/`: `fit-2026.md` (per settlement and per column), `fit-2025/2027/2028/2045.md`, `line.md`,
  `residual-2026.md`, `residual-2026.json`.
- `scripts/`: `engine.js` (the served script, driven as the page drives it), `pull-api.js`,
  `render.js` (drives the live page), `gate.js` (three-way), `normalize.js`, `fit.js`, `line.js`,
  `summary.js`, `manifest.sh`.
