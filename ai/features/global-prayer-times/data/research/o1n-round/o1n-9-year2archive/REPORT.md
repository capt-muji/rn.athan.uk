# O1n-9: second recomputed year hunt, outside Europe (confidence ladder A)

Wave o1n-9, round o1n, 2026-11-11. Mission: for every single-cycle surface the record holds
outside Europe, hunt a genuine second recomputed year — a value diff against the held year,
never a relabel. Workspace `captures/` (raw), `data/` (normalised rows, verdicts), this report.
Inputs: FIT-INDEX-ROUND4 (164 entries), the o1m workspaces, RESEARCH-ROUNDS.md standing orders.
Engine: adhan 4.4.6 at `census/adhan-build/node_modules/adhan` unless stated. UTC timestamps.

Grade rule (FIT-RULES): A = 2-3+ distinct fitted years on one recipe. Byte-identical relabelled
editions are ONE generation and never lift. Recomputed years are a genuine multi-year test.

## Verdicts

### OM-MARA-86-CITYIDS (Oman, authority) — SECOND YEAR BANKED, lifts to A

The record's row (untestable-single-year, provisional, 60 areas "NOT claimed") is stale against
the o1m-40 report: that wave already walked `calendar_page2.asp` 2021-2031 for all 86 areas and
fit the tail. Verified here from the banked rows:

- **Between-year value diff (run 2026-11-11 from o1m-40's own data):** 2026 vs 2027 on the same
  month-day, 188,340 cells compared, **19,172 cells move (10.18 pc), zero of 86 areas frozen** —
  a genuine recompute (Algeria class), not a relabel. Example: area 00 (Muscat) 2026-01-01 fajr
  05:29 against 2027-01-01 fajr 05:28.
- **Fit, one recipe across six years** (o1m-40 `fit/om-tail-fit.json`, adhan 4.4.6, Other 18/18,
  Shafi, Rounding.None, Asia/Muscat): every area-year 75.6-84.6 pc exact, **100 pc within-1,
  worst cell 1 minute in all six years 2026-2031** (1,130,040 cells). Parameters frozen; the
  exact-rate band moves 0.2 pc with no trend.
- **Seasonal amplitude (area 00, 2026):** fajr-isha span 821 min (January) against 989 min
  (July), 168 min swing.
- Span held: 6 years, 188,340 dated rows. Raw: `o1m-40-oman/captures/om-page2/` (121 MB).
- Banked here: `data/om-second-year-verified.json`. Grade **A** (6 distinct recomputed years,
  one recipe). The FIT-INDEX row should carry the o1m-40 tail and this verdict.

### The tawkit.net pool (IQ, YE, LY, IR, PK, JO, SY, PS, BH, AF platform layers; TAWKIT-COUNTRY-73) — DATED NEGATIVE + ROLL WATCH

- The year parameter is inert, confirmed independently this hour on Kabul's timetable:
  `?y=2025&m=07`, `?y=2026&m=07`, `?y=2027&m=07` all serve the same "07-2027" table;
  `?m=12` serves 12-2026, `?m=01` serves 01-2027 — a rolling current-month-plus-eleven window,
  exactly as o1m-24 measured (`captures/tawk-kabul-tt-*.html`, five probes).
- Every tawkit pull on disk (o1m-3 08:19Z, o1m-6 10:00Z, o1m-24 11:41Z, this wave 13:xxZ) carries
  the SAME window 2026-11..2027-10. No prior window exists anywhere in the archive, so no value
  diff across windows is available today.
- **Roll watch (the dated continuation):** on or after 2026-12-01 the window rolls to
  2026-12..2027-11. Re-capture one city per priority country and diff the 11 overlap months
  (2026-12..2027-10) against today's bank (`o1m-3-platforms/data/tawkit/`): overlap identity
  proves a frozen append-only engine; the appended 2027-11 month is the first new month.
  A year-2 for the whole 73-country pool needs the 2027-11..2027-12 accumulations, one month
  per calendar month.


### JP-NAGOYA-YEAR (Nagoya Mosque, authority) — PRINT DATED, TABLE UNDATED: no second year exists here

The held PDF's own metadata settles the print date: `CreationDate D:20190107130736+09'00'`,
`ModDate` identical, producer "Microsoft: Print To PDF", source "Prayer Time Table-1.xlsx"
(`o1m-11-eastasia/captures/nagoya_daily_prayer_table.pdf`). The table inside is a perpetual
leap-year template: 365 rows with a 29 February row, and o1m-11's fits reproduce it on 2024 and
2028 alike at 91.5 pc within-1. A 2019 print cannot be pinned to a data year, and no year stamp
appears in the transcribed text (o1m-11 `data/nagoya_mosque_year_table.json`). Verdict: the
surface carries ONE computed generation rendered into a dated 2019 print; the "undated"
span note upgrades to "print dated 2019-01-07 JST, table a leap template". No second year on
this surface. Grade stays provisional. Routes tried: PDF metadata, raw PDF strings, the
transcribed text, the 2024/2028 value-fits.


### NEW SURFACE: Fazilet Takvimi (faziletcalendar.com, publisher Fazilet Nesriyat) — a hidden any-date door across 211 countries, banked 2026+2027 at eight cities, grade A-class

Discovery route: the Kyrgyzstan second-door hunt. The site's WordPress pages embed a React
app whose only data call is `/api/cms/daily?districtId=<city>&lang=<lang>`; the dispatcher
serves a 3-day window around the visitor's clock, BUT an undocumented `date=` parameter moves
the window to ANY date (probes: `tarih=`, `baslangic/bitis`, `ay/yil`, `month/year` are inert;
`date=2027-07-15` serves 2027-07-14..16). Probes back to 2020 and forward to 2030 return real
tables. Rows are UTC instants with an `is_takdiri` flag — clean data, no render rounding.

- Cities walked (Jan + Jul, 2026 and 2027, 3-day steps, 372 requests): Bishkek, Osh, Uzgen,
  Balykchy (KG); Baku (AZ); Tbilisi (GE); Tashkent (UZ, plus November 2026 whole); Dushanbe (TJ).
  Raw captures `captures/fazilet-walk/`, normalised rows `data/fazilet-*-rows.json`.
- **Fit (adhan 4.4.6, `data/fazilet-fit.json`, method: angles + per-column median margins
  recovered on 2026, frozen, then residual-scored on every year):** at EVERY city the frozen
  recipe reproduces BOTH years at **100 pc within-1, worst 1 minute**. Exact 67.2-79.6 pc.
  The Fazilet block: fajr angle 19.25-19.75 deg, isha 17.0-17.75 deg, Shafi asr, margins
  fajr +16..19, sunrise -2..-5, dhuhr +6..7, asr +5, maghrib +6..8, isha +1..4 — a temkin
  block in the Diyanet neighbourhood, its own values.
- **Between-year recompute proof:** 3,619 same-month-day cells compared 2026 vs 2027 across
  the eight cities; **632 moved (17.46 pc)**, every column moving including the solar ones —
  a genuine second recomputed year, not a relabel.
- **Between-year stability:** exact-rate change 2027 minus 2026 sits between -4.0 and +2.3
  points per city with one recipe; seasonal amplitude (fajr-isha span) 781-786 min January
  against 1118-1187 min July.
- **Second-witness relations:** Fazilet vs muftiyat.kg at Bishkek (Jan+Jul 2026): 304 of 330
  cells differ — independent generations. Fazilet vs islom.uz at Tashkent (Nov 2026): 174 of
  174 differ (asr by the school: Shafi against Hanafi, rest by margins/point). Fazilet vs the
  Tbilisi mawaqit Diyanet block: 371 of 396 differ, small temkin-family deltas. Fazilet is an
  independent publisher everywhere tested, close to but never equal to the Diyanet block.
- Country layers served by the same door (cities-by-country endpoint): Kyrgyzstan 78 cities,
 Kazakhstan 155, Uzbekistan 48, Georgia 40, Tajikistan 37, Sri Lanka 21, Mongolia 23,
  Azerbaijan, Iraq 14, Libya 12, Yemen 10, Nepal 9 — the deepest Central Asian layer outside
  the muftiates themselves.

**Verdict per front:** a NEW authority-grade publisher surface (Fazilet Nesriyat prints the
annual Fazilet Takvimi used across Turkey and exported through these editions) carrying
2 distinct recomputed years on one recipe at every tested city — grade **A** on its own entry
(`FAZILET-8-CITIES`), and the named second door for the KG, AZ, GE, UZ, TJ, IQ, LY, YE, NP, LK
and MN fronts. The batch-2 capitals (Baghdad, Tripoli, Sanaa, Kathmandu, Colombo, Ulaanbaatar)
are walking now and will be appended below.

### AZ-NAMAZ-4-CITIES, IQ-DIWAN, YE-AWQAF — dated negatives on their own surfaces

- `nam.az` serves only `/{city}/{MM}/{DD}`; year paths 404 (`captures/namaz-probe-*`). The
  year is the visitor's clock. Wayback CDX for nam.az holds ONE snapshot total (the /ganja
  homepage, 2026-05-20) — no earlier city-day values exist. Closed; Fazilet Baku stands as
  Azerbaijan's second dated publisher.
- IQ-DIWAN-AXIS-FREE and YE-AWQAF-6-GOVERNORATES: the o1m-24 and o1m-6 measurements stand
  (endpoint ignores date/year; 2025/2027 answer "no data"). No re-probe spent. Fazilet Baghdad
  and Sanaa (batch 2) are the doors those fronts gain this round.

### Wayback status this hour

Internet Archive answered my nam.az CDX (200), then returned "Temporarily Offline" 503 on the
acju.lk 2018-2024 probe (`captures/cdx-acju-early.json`). Per the standing discipline the
Wayback thread is stopped for now; the ACJU earlier-editions question (LK's genuine second
year) stays open on it. The o1m-5 record already holds the 2025 edition (frozen-reprint
verdict stands; its CDX for 2025 succeeded there).


### Fazilet batch 2 — the priority-front capitals (banked 2026+2027)

Baghdad (IQ), Tripoli (LY), Sanaa (YE), Kathmandu (NP), Colombo (LK), Ulaanbaatar (MN), the
same Jan+Jul walk, same fit method (`data/fazilet-fit.json`):

| city | recipe (fajr/isha, margins) | 2026 | 2027 | move 2026-2027 |
|---|---|---|---|---|
| Baghdad | 19.5/17.75, +17/-4/+7/+5/+7/+1 | 79.8e 100w1 w1 | 82.6e 100w1 w1 | 51/455 |
| Tripoli | 19.5/17.5, +18/-3/+7/+5/+7/+2 | 75.8e 100w1 w1 | 74.1e 100w1 w1 | 54/455 |
| Sanaa | 19.5/17.5, +18/-2/+7/+5/+6/+2 | 86.1e 100w1 w1 | 86.2e 100w1 w1 | 38/455 |
| Kathmandu | 19.5/17.5, +17/-3.5/+7/+5/+8/+3 | 78.7e 100w1 w1 | 75.9e 100w1 w1 | 55/455 |
| Colombo | 19/17, +17/-1/+5/+5/+5/+3 | 96.5e 100w1 w1 | 79.5e **83.6w1 w2** | 91/455 |
| Ulaanbaatar | 19.25/17.25, +15/-5/+5/+4/+6/+2 | 56.8e **98.2w1 w4** | 59.5e **98.0w1 w4** | 132/455 |

All six carry genuine between-year recomputation (8.4-29.0 pc of same-month-day cells move;
Sanaa, near the equator, moves least — exactly the latitude framing FIT-RULES orders).

- **Colombo 2027: the publisher moved its own dhuhr pad.** The frozen 2026 recipe holds
  65/65 within-1 on five columns in 2027 but 1/65 on dhuhr with worst 2: Fazilet's 2027
  table shifted dhuhr about two minutes for Colombo. Recorded as a dated per-year pad change
  on one column, not a recipe family change. Sri Lanka's front gains a second dated publisher
  (Fazilet) beside ACJU's frozen-reprint pair.
- **Ulaanbaatar:** a stable seasonal fajr pad the fixed +15 misses by up to 4 minutes in
  winter, identical shape both years; no takdiri flags served. Within-1 98 pc both years.
  Mongolia's Diyanet-only front gains its first independent dated second publisher.

Batch 3 (Tokyo, Osaka, Nagoya, Seoul, Beijing — the East Asia Diyanet tree's second doors)
is walking now.


### Fazilet batch 3 — the East Asia tree (JP, KR, CN)

Tokyo, Osaka, Nagoya, Seoul, Beijing, same walk, same fit:

| city | recipe (fajr/isha, margins) | 2026 | 2027 |
|---|---|---|---|
| Tokyo | 19.5/17.25, +17/-4/+7/+5/+7/+4 | 83.1e 100w1 w1 | 83.3e 100w1 w1 |
| Osaka | 19.25/17.25, +17/-3/+7/+5/+6/+3 | 74.0e 100w1 w1 | 74.6e 100w1 w1 |
| Nagoya | 19.25/17, +17/-2/+7/+5/+7/+5 | 77.5e 100w1 w1 | 77.2e 100w1 w1 |
| Seoul | 19.5/17.75, +17/-4/+7/+5/+7/+1 | 77.5e 100w1 w1 | 79.7e 100w1 w1 |
| Beijing | 19.75/17.5, +17/-5/+7/+5/+9/+4 | 82.3e 100w1 w1 | 82.8e 100w1 w1 |

The Diyanet-tree fronts (JP-DIYANET-143, KR-DIYANET-40, CN-DIYANET-222) gain an independent
dated second publisher with two recomputed years — Diyanet's own year parameters stay inert
(paid for in the o1m-r7 work), so Fazilet is the door. Fazilet's Japan layer runs 143 cities,
the same count as the Diyanet tree's Japan layer (both GeoNames-seeded, different engines).

**JP-NAGOYA-YEAR note:** the city whose only authority print is the mosque's undated 2019
leap-template now carries Fazilet Nagoya — an independent, dated, recomputed 2026+2027 line.

### Fazilet batch 4 — Afghanistan, Sudan, and the community-board fronts (KH, LA, UG, ZW, PA, TT, NI)

Kabul, Khartoum, Phnom Penh, Vientiane, Kampala, Harare, Panama City, Port of Spain, Managua,
same walk, same fit — **all nine reproduce BOTH years at 100 pc within-1, worst 1**
(exact 76.9-92.9 pc 2026, 76.9-91.8 pc 2027; between-year movement 5.1-29.0 pc of cells, the
near-equator fronts moving least, exactly the latitude framing):

| city | front it doors | recipe (fajr/isha, margins) |
|---|---|---|
| Kabul | AF-TAWKIT-8 (tawkit month = visitor's clock) | 19.5/17.25, +17/-4/+7/+5/+7/+4 |
| Khartoum | Sudan: NO index entry — a first dated publisher surface for the country | 19.5/17.25, +17/-3/+7/+5/+7/+4 |
| Phnom Penh | KH-PHNOM-PENH-ALSERKAL (mawaqit board) | 19.75/17.75, +19/-2/+7/+5/+6/+1 |
| Vientiane | LA-VIENTIANE-JAMIA (mawaqit board) | 19.25/17.25, +16/-3/+7/+5/+7/+4 |
| Kampala | UG-KAMPALA-1790 (mosque table) | 18.25/16.25, +12/-3/+7/+5/+7/+8 |
| Harare | ZW-HARARE-MSASA (mawaqit board) | 19.25/17.25, +16/-3/+7/+5/+7/+4 |
| Panama City | PA-FOUR-TENANTS (mawaqit boards) | 19.75/17.75, +19/-2/+7/+5/+6/+1 |
| Port of Spain | TT-PRINCES-TOWN / SAN-FERNANDO / CHAGUANAS | 18.5/16.75, +14/-2/+7/+5/+6/+5 |
| Managua | NI-MANAGUA (mawaqit board) | 19.75/17.75, +19/-2/+7/+5/+6/+1 |

Every mawaqit/masjidbox board these fronts held stays what it was (the relabel traps are paid
for); what each front GAINS is an independent dated publisher surface carrying two recomputed
years on one recipe.

## The whole hunt in one table

| Front (record entry) | Second year on ITS surface? | What it gains |
|---|---|---|
| OM-MARA-86-CITYIDS | YES — 2027-2031 already banked by o1m-40, verified here | grade A (6 years, 10.18 pc cells move) |
| KG-20-CITIES / KG-115-SETTLEMENTS | no (endpoint year-blind, confirmed) | Fazilet KG layer: 78 cities, 2 years, A-class |
| UZ-ISLOM-6-CITIES | no (client-computed, year params ignored) | Fazilet Tashkent 2 years + Nov identity check (174/174 differ) |
| AZ-NAMAZ-4-CITIES | no (no year axis; Wayback holds one snapshot) | Fazilet Baku 2 years |
| GE-TBILISI-JUMA | no (mawaqit one generation) | Fazilet Tbilisi 2 years |
| IQ-DIWAN-AXIS-FREE / IQ-TAWKIT-145 | no (endpoint ignores date; tawkit window fixed) | Fazilet Baghdad 2 years |
| YE-AWQAF / YE-TAWKIT-313 | no (2025/2027 answer no data; tawkit window fixed) | Fazilet Sanaa 2 years |
| LY-TRIPOLI / LY-TAWKIT-64 | no | Fazilet Tripoli 2 years |
| AF-TAWKIT-8 | no | Fazilet Kabul 2 years |
| LK-ACJU-13-ZONES | no (2025=2026 frozen; Wayback offline both probes) | Fazilet Colombo 2 years + a dated dhuhr pad change in 2027 |
| NP-KATHMANDU-DARULIFTA-12M | no (one undated leap template) | Fazilet Kathmandu 2 years |
| JP-NAGOYA-YEAR | no (2019 print of a perpetual leap template) | Fazilet Nagoya 2 years + the print dated 2019-01-07 |
| JP/KR/CN/MN Diyanet tree | no (Diyanet year params inert) | Fazilet Tokyo, Osaka, Seoul, Beijing, Ulaanbaatar, 2 years each |
| TAWKIT pool (73 countries) | not yet — the window rolls 2026-12-01 | roll watch recorded |
| Sudan | no held surface at all | first dated surface (Fazilet Khartoum, 2 years) |
| KH/LA/UG/ZW/PA/TT/NI/AF boards | no (mawaqit/masjidbox traps paid for) | Fazilet capitals, 2 years each |
| African council prints | settled by o1m-18 (COSIM 3 editions with a measured parameter shift; MSBF doctrine-blocked) | nothing owed |

**28 cities x 2 years x 65-66 sampled days x 7 columns are banked** under
`data/fazilet-*-rows.json` (one file per city) with the frozen-recipe fits in
`data/fazilet-fit.json`; raw JSON per request in `captures/fazilet-walk/` (1,252 requests,
polite ~1.05 s spacing, zero errors at walk time).

### Grades this wave proposes

- OM-MARA-86-CITYIDS: provisional → **A** (six distinct recomputed years on one recipe).
- FAZILET-28-CITIES (new entry, authority publisher): **A** — 2 distinct recomputed years on
  one recipe at every one of 28 cities; sample depth Jan+Jul per year, stated.

## Open items carried

1. **Tawkit roll watch (2026-12-01):** re-capture one city per priority country; diff the 11
   overlap months against `o1m-3-platforms/data/tawkit/`; the appended 2027-11 month is the
   first new content of the next window.
2. **ACJU earlier editions (LK):** Internet Archive answered one CDX then degraded (503
   "Temporarily Offline", then 504 on a 40-minute-spaced retry; `captures/cdx-acju-early.json`
   holds the error bodies). The route stands: CDX acju.lk 2018-2024, PDFs, then parse with
   o1m-5's `scripts/acju_zones.py`.
3. **Fazilet deep walk:** the Jan+Jul samples prove the recipe; a full-year walk per city is
   the continuation, and the door serves 2020-2030 both directions.
4. **Greece (Athens) and Denmark:** Europe — left to O1n-8 this hour, not walked here.

## Discipline statement

Public pages only; no login, forms, email or challenge solved. Local-language terms used in
searches (Kyrgyz, Russian, Turkish). Wayback touched four times total, spaced, then stopped on
the failures. Every Fazilet request's raw body is saved; every image/PDF question this wave met
was answered from already-OCR'd artifacts or raw PDF strings, no model-vision passes. All
timestamps UTC; no clock read into data; no blending across years — every fit is per-year on a
frozen recipe with the base year named. The repository was not written.

## Provenance note

All plain captures in `captures/` (this wave's HTML probes, the Fazilet walk bodies and range
probes) are gzipped in place at the close, per the standing discipline; filenames above carry
their pre-gzip names. Fazilet walk request count: 362 + 274 + 220 + 396 = 1,252.
