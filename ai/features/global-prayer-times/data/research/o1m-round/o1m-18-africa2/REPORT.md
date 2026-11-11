# REPORT.md — o1m-18 Sub-Saharan year-2 (INCREMENTAL)

Wave o1m-18, round o1m. Workspace `$HOME/athan-gitree/census/o1m/o1m-18-africa2/`.
The repo is never touched. Capture timestamps are UTC from the session clock; every date in
`data/` comes from a literal capture string.

Mission: (1) year-2 for the held West- and Central-African surfaces, (2) second mosques in the
same cities, (3) the national councils' own annual prints.

Engine for every fit: adhan 4.4.6 (`Rounding.None`, `MiddleOfTheNight`), timezone pinned per
surface, dates from the literal printed strings.

## 1. The mawaqit forward parameter is a relabel on 15 of 15 surfaces

The calendar PDF route is `https://mawaqit.net/fr/calendar/<uuid>.pdf` with an optional `?year=`.

| surface | 2026 edition | `?year=2027` | `?year=2028` | month-day cell differences |
|---|---|---|---|---|
| Lomé Al-I'tisam | 365 rows | 365 rows, same span | 404 | **0 of 365** |
| Savalou Al-Mu'tîyy | 365 | 365 | 404 | **0 of 365** |
| Korhogo Ihsane | 365 | 365 | 404 | **0 of 365** |
| Freetown Al Ansaar | 365 | 365 | 404 | **0 of 365** |
| Old Yundum Al-Fatih | 365 | 365 | 404 | **0 of 365** |
| Koina Anas bin Malik | 365 | 365 | 404 | **0 of 365** |
| Ngaoundéré Sabongari | 365 | 365 | 404 | **0 of 365** |
| N'Djamena Abu Bakr Siddiq | 365 | 365 | 404 | **0 of 365** |
| Bangui Saina Youssuf | 365 | 365 | 404 | **0 of 365** |
| Brazzaville Houriya | 365 | 365 | 404 | **0 of 365** |
| Malabo Issa Obama | 365 | 365 | 404 | **0 of 365** |
| Port-Gentil Roi Faisal | 365 | 365 | 404 | **0 of 365** |
| Goma Taqwa | 365 | 365 | 404 | **0 of 365** |
| Goma Daaru-ssalaam | 365 | 365 | 404 | **0 of 365** |
| Libreville Kinguélé | 365 | 365 | 404 | **0 of 365** |

Method: each edition parsed to dated rows (`mqpdf.py`), then compared by month-day so a pure
relabel shows zero differences. Result: the `year` parameter rewrites the date text and
recomputes nothing. This reproduces O1l-33's ten-surface finding on the whole West-African set,
so the class now stands at **25 surfaces, zero exceptions**: mawaqit serves one computed
generation, and its forward parameter is not a forward claim.

Two route failures, recorded not repaired:
- Libreville Bellevue 3 (`mosquee-de-bellevue-3-libreville-0000-gabon`): the calendar PDF
  returns an HTML error body (13,796 bytes, `%PDF` absent) while the page and its year table
  serve normally. The Kinguélé page in the same city carries the class test.
- `mawaqit.net/en/m/sabongari-ngaoundere-cameroun` 404s; the live slug is
  `mawaqit.net/en/sabongari-ngaoundere` (the `/m/` form is not universal).

Standing verdict for every mawaqit-held surface in this wave: **frozen edition, one generation.**
No lift by parameter, no forward claim.

## 2. COSIM — the Côte d'Ivoire council's own print is a dated authority table

`cosim-ci.org/ressources/calendrier` serves one image per Hijri month from
`/storage/calendrier/`. Three editions recovered, each transcribed by column with the macOS Vision
binary and re-read as crops:

| edition | span | rows | fajr | sunrise | maghrib | isha |
|---|---|---|---|---|---|---|
| JOUMADA-AL-OULA 1448 | 2026-10-12 .. 2026-11-10 | 30 | 05:03-05:04 | 06:03-06:05 | 17:56-18:02 | 18:56-19:00 |
| RAMADAN 1447 | 2026-02-18 .. 2026-03-19 | 30 | 05:24-05:33 | — (sahur column instead) | 18:27-18:29 | — (no isha column) |

**Fit at Abidjan (5.3599, -4.0083, Africa/Abidjan):**

| edition | fajr angle | fajr exact / within-1 / worst | maghrib margin | other columns |
|---|---|---|---|---|
| Joumada 1448 | **14.95** | 29/30, 30/30, −1 | sunset +0 | isha **15.10** (26/30 exact, 30/30, −1); sunrise +2 (23/30 exact, 30/30) |
| Ramadan 1447 | **14.85** | 29/30, 30/30, −1 | sunset +1 | sahur = fajr − 15 on all 30 days |

One recipe across both editions: **fajr 14.85-14.95 deg, maghrib at sunset +0..+1.** The two
editions agree to a tenth of a degree, which is the printed-minute quantum at this latitude.

**The conventions are printed, not inferred.** Both sheets carry a single merged cell reading
"13 Heures conventionnelle en Côte d'Ivoire" under ZOUHR and "16 Heures conventionnelle" under
ASSR. So the fixed 13:00/16:00 clock that the O1l-50 wave measured on nine Abidjan mawaqit pages
is the **council's own doctrine**, printed on the authority surface. Rule-form: **CI-COSIM-CONV**
(zouhr 13:00, assr 16:00, whole country, all year).

Two defects worth the record:
- The Ramadan sheet has **seven** header cells and no isha column; a first pass read an isha
  from the neighbouring text panel and it is withdrawn. Column count is load-bearing.
- The Joumada sheet's isha (15.1 deg) and the Ramadan sheet's absence of one mean the two
  editions cannot be compared on isha at all.

Zone: the Ramadan footer names the coverage — ABIDJAN, DABOU, AGBOVILLE, JACQUEVILLE,
BINGERVILLE, ANYAMA, ADZOPE, AFFERY. This is a **zone table**, not a point table.

Tier: authority (the council's own publication). Span: two editions inside Gregorian 2026, one
published cycle per edition. A third edition (another Hijri month, or the 1436 prints) decides
whether the angles hold across years.

### The decade witness: Safar 1436 (November-December 2014)

Wayback holds the council's 1436 prints (`20150203100123`, `20150503200705`). The Safar sheet
parsed from its own text layer — no OCR involved:

| edition | span | rows | columns as printed | fajr | isha | maghrib |
|---|---|---|---|---|---|---|
| SAFAR 1436 | 2014-11-24 .. 2014-12-23 | 30 | imsak, fajr, maghrib, isha | **14.10** (21/30 exact, **30/30 within-1**) | **15.85** (30/30) | sunset **+3** |
| JOUMADA 1448 | 2026-10-12 .. 2026-11-10 | 30 | fajr, sunrise, maghrib, isha | 14.95 (29/30, 30/30) | 15.10 (26/30, 30/30) | sunset +0 |
| RAMADAN 1447 | 2026-02-18 .. 2026-03-19 | 30 | imsak, fajr, maghrib | 14.85 (29/30, 30/30) | — | sunset +1 |

One family, twelve years apart: fajr 14.1-15.0 deg, isha 15.1-15.9, maghrib at sunset +0..+3,
imsak = fajr − 15 on all 60 days of the two sheets that carry it. The parameters **moved**
(0.85 deg on fajr, 0.75 on isha, three minutes on maghrib), so the table is recomputed edition by
edition and is not frozen — the honest verdict is a stable family with measured drift, not a
frozen generation and not one fixed pair.

The printed coverage list also varies between the council's own sheets: the Safar 1436 PDF reads
"Horaires valables pour les villes suivantes" over a national list of about sixty places
(Abidjan, Bouaké, Korhogo, Daloa, Yamoussoukro, Abengourou, Bondoukou, Sassandra ...), while the
Rabioul-thani 1436 image and the Ramadan 1447 image carry the eight-city Abidjan-region list
(ABIDJAN, DABOU, AGBOVILLE, JACQUEVILLE, BINGERVILLE, ANYAMA, ADZOPE, AFFERY). Two coverage
scopes exist on the publisher's own prints within one Hijri year.

The Rabioul-thani 1436 image (`captures/cosim-1436-rabioul-thani.jpg`) is captured but **not
scored**: its OCR returns 87 of 120 time cells with `05` misread as `0S`, and a printed table is
not transcribed from an unreliable read. Its first printed week reads imsak 05:17, fajr 05:32,
maghrib 18:24, isha 19:24 — the same structure, recorded as evidence only.

## 3. CERFI — Senegal's council prints fixed intervals, and serves 2027

`cerfi.sn` publishes weekly sheets at
`/static/salats/<City>/hebdo/10x1/<City>Hebdo10x1_YYYYMMDD.pdf`. Dakar resolves for every
Friday probed from 2026-11-06 to **2027-07-02**; 2028-01-01 is 404. The sheet prints six rows in
Wolof with day-of-month cells:

| row | sense |
|---|---|
| Fajar | imsak (the two-dawn pair) |
| Suba | fajr |
| Tisbâr | dhuhr |
| Takusân | asr |
| Timis | maghrib |
| Guêwé | isha |

Dakar 2027-01-22: Fajar 06:23, Suba 06:38 (**the 15-minute two-dawn convention, held**),
Tisbâr 13:23, Takusân 16:39, Timis 19:05, Guêwé 20:05.

**34 weekly sheets parsed: 238 dated rows, 2026-11-06 .. 2027-07-01** — two Gregorian years
on one publisher.

The columns are **intervals, not angles**, and they are exact:

| column | recovered rule | exact | within-1 | worst |
|---|---|---|---|---|
| fajr (Suba) | sunrise − 60 min | 185/238 | **238/238** | 1 |
| imsak (Fajar) | fajr − 15 min | 238/238 | **238/238** | 0 |
| dhuhr (Tisbâr) | transit + 2 min | 209/238 | **238/238** | 1 |
| asr (Takusân) | Shafi asr + 2 min | 142/238 | **238/238** | 1 |
| maghrib (Timis) | sunset + 2 min | 205/238 | **238/238** | 1 |
| isha (Guêwé) | maghrib + 60 min | 205/238 | **238/238** | 1 |

1,140 of 1,190 cells within one minute. Rule-form: **SN-CERFI-INTERVAL** (fajr = sunrise − 60,
isha = maghrib + 60, imsak = fajr − 15, margins +2 on the three solar columns).

The angle fit is the trap this closes: sweeping fajr as a depression returns 14.45 in
November-December and 15.45 in March, a smooth seasonal curve that looks like a drifting angle
and is not one. The printed fajr is exactly 60 minutes before sunrise on every one of the 238
days (span 59-61, monthly mean 60.0-60.5), so the "drift" is the changing angular cost of a
fixed interval. This is why the held Senegal reading of a "two-dawn 15" convention fits, and it
names the rule behind it.

Thies and Kaolack do not resolve under the Dakar slug pattern (404); their city paths differ and
are queued. Tested and negative for the PDF route: Thiès, Saint-Louis, Touba, Mbour, Kaolack —
the weekly sheets exist for **Dakar only**, and the other cities remain on the council's API
(the route the held Senegal layer already uses).

## 4. MSBF — the Burkina federation's annual print explains its own "blocked template"

`sunna.bf/heuresprieres/` returns a 0-byte body (the held defect stands), and the directory is
not listable, but the annual PDF resolves at a known name:
`https://www.sunna.bf/heuresprieres/Heures%20Priere%202021.pdf` — 12 pages, 1.0 MB,
**Hijri 1442, Ouagadougou**, athan and iqama pairs on every row.

Parsed by page label and row position: **365 dated rows, 2021-01-01 .. 2021-12-31**, each page's
printed day column matching its row count exactly (31/28/31/30/31/30/31/31/30/31/30/31).

Fit at Ouagadougou (12.3714, -1.5197, Africa/Ouagadougou):

| column | distinct printed values | recovered rule | exact | within-1 | worst |
|---|---|---|---|---|---|
| fajr | 58 | **17.75 deg** | 280/365 | **365/365** | −1 |
| maghrib | 59 | **sunset + 1** | 346/365 | **365/365** | −1 |
| dhuhr | **3** (12:25, 12:30, 12:45) | fixed clock | 13/365 | 38/365 | 20 |
| asr | **7** | 5-minute blocks | 87/365 | 223/365 | −3 |
| isha | **11** | 5-minute blocks | 57/365 | 163/365 | 16 |
| fajr iqama | 13 | fajr + 13..18 (13, 14, 15, 16, 17 carry all but two days) | — | — | — |

**This settles the "MSBF blocked template" question the O1l-50 wave raised.** The federation does
not fail to compute dhuhr, asr and isha: its print carries three fixed clocks for dhuhr and
5-minute blocks for asr and isha, while fajr and maghrib are computed to the minute. The blocking
is the doctrine, published. A fit that treats the two block columns as angles will always look
broken; the honest reading is a mixed table.

The 2026 mawaqit pages carrying the "MSBF | BRC" label reproduce that structure (three dhuhr
clocks, seven asr values, nine isha values), so the template is stable **2021 → 2026** and this
1442 print is its dated authority witness. It is a second year on the same recipe for fajr and
maghrib, five years earlier.

Not found: any 1448 (2026-27) edition. `sunna.bf/heuresprieres/Heures Priere 1448.pdf` and
`... 2026.pdf` both 301 to the bare host and then 404; the home page links only the 2021 file; the
federation's Facebook post announcing the 1447 print returns HTTP 400 anonymously; the Scribd
copy ("Heures Priere 1448", document 1059951936) serves a 3 KB block page. Languages searched:
French, Arabic, English.

## 5. BAKWATA — negative, the site carries no timetable

`bakwata.or.tz` is a Laravel/Inertia single-page app. Its props read out the home page (slides,
leaders, quote) and `/services` returns 3,218 bytes; every Swahili and English route
(`/nyakati-za-sala`, `/prayer-times`, `/sala`, `/ratiba`, `/huduma`) is 404. `bakwata.org` is a
separate Swahili news site. The council publishes no dated table online. Languages searched:
Swahili, English.

## 6. Second mosques — new dated surfaces from the same cities

Eleven mawaqit pages fetched, parsed and gated against their own live page (today's five times
plus shuruq equal one calendar row on all eleven):

| city | mosque | slug | fit | totals |
|---|---|---|---|---|
| Kampala | Sayyidina Abubakar (York Terrace) | `sayyidna-abubakar-mosque-12-york-terrace-12345-kampala-uganda` | **17.90/17.35 Shafi, dhuhr +1, asr +1, maghrib +0** | **2,163/2,190 within-1, worst 2** |
| Dar es Salaam | Masjid Kisota (Mji Mwema) | `masjid-kisota-mji-mwema-dar-es-salaam-17106-tanzania` | **17.90/17.10 Shafi, sunrise +1, dhuhr +0, maghrib +1** | **2,136/2,190, worst 2** |
| Dar es Salaam | Masjid Quba | `quba-mosque-dar-es-salaam-14113-tanzania` | **17.90/17.10 Shafi, dhuhr +1** | **2,109/2,190, worst 3** |
| Ségou | Sibila Missiriba | `sibila-missiriba-sibila-segou-41051-mali` | **14.90/15.10 Shafi, dhuhr +14, maghrib +1** | **2,082/2,190, worst 3** |
| Bamako | Al Madina Al Mounawara | `mosquee-al-madina-al-mounawara-bamako-99-mali` | **17.25/18.30 Shafi, dhuhr +29, asr +8, maghrib +4** | **2,122/2,190, worst 2** |
| Bamako | Al Hikma | `al-huqma-bamako-99000-mali` | isha 17.10 clean (341/365), fajr blocked (161/365), dhuhr fixed +43 | 1,484/2,190, worst 27 |
| Bamako | Atata Senou | `mosquee-atata-senou-bamako-senou-91096-mali` | **14.90/13.50, maghrib +8, dhuhr fixed +88** | 1,767/2,190, worst 17 |
| Bamako | Al Tawfiq | `mosquee-al-tawfiq-bamako-91095-mali` | board (fajr worst 33) | 1,393/2,190 |
| Bamako | Quinzambougou | `mosquee-sunnite-de-quinzambougou-bamako-125-mali` | mixed board (fajr worst −35) | 1,036/2,190 |
| Bamako | Niaréla | `mosquee-babou-kane-de-niarela-bamako-mali` | board (maghrib worst 39, isha 58) | 739/2,190 |
| Bamako | AR-RAHMAN Badalabougou | `ar-rahma-bamako` | partial (fajr worst 27) | 1,176/2,190 |
| Abidjan | Mouaz Ibn Djabal (Riviera Faya) | `mosquee-mouaz-ibn-djabal-...` | board, dhuhr +29 | 1,064/2,190 |
| Abidjan | Riadh As Salihin | `mosquee-riadh-as-salihin-abidjan-1387-cote-divoire` | board, dhuhr +59 | 1,011/2,190 |
| Mayotte | M'Kiri Wangazidja (Dzaoudzi) | `m-wangazidja` | trap: Indian/Mayotte at −12/45, not Congo | — |

Two findings:
- **Kampala is a second Ugandan line.** The held Entebbe surface fits 15/15; this Kampala
  mosque fits 17.9/17.35 on 2,163 of 2,190 cells. Uganda therefore carries two recipes, and the
  O1l-20r "Kampala Mulago fails gate" note is not the end of the city.
- **Dar es Salaam is a new city and a two-witness line.** Two independent mosques, Kisota and
  Quba, both fit **17.90/17.10 Shafi within one minute** (2,136 and 2,109 of 2,190). Tanzania
  therefore carries two lines — 17.9/17.1 at the coast and the held Arusha 18/18 inland — and
  Dar es Salaam, named in the mission with no held surface, now has a year.
- **Ségou is confirmed by a second surface.** The held Ségou platform table reads 15/15 with
  dhuhr transit +14 and maghrib at sunset. This mosque, a different publisher two years later,
  reads **14.90/15.10 with dhuhr +14 and maghrib +1** and 2,082 of 2,190 cells within one. The
  Ségou line is now two independent witnesses on one recipe.
- **Bamako is a mosaic, not one line.** Seven mosques produce seven different recipes: one clean
  athan table (Al Madina 17.25/18.30), one clean 14.9/13.5 with a fixed dhuhr clock (Atata),
  one with a clean isha and a blocked fajr (Al Hikma), and four boards. The held Bamako 19/17
  pair is one member of that set, not the city's rule.
- **The Abidjan board layer extends to two more mosques** and reproduces the COSIM convention
  (section 2): dhuhr pinned 29 and 59 minutes after transit. Every Abidjan surface now agrees
  with the council's printed 13:00.

## 7. Year-2 verdict per held surface

| held surface | second-year route tried | verdict |
|---|---|---|
| Lomé Al-I'tisam (365) | mawaqit `?year=2027`; own site `mosqueealitisam.tg` | **frozen**; the mosque's own domain embeds the mawaqit widget and states "Horaires synchronisés automatiquement … via MAWAQIT", so the platform table carries the mosque's endorsement (authority-by-publisher) |
| Savalou Al-Mu'tîyy (365) | `?year=2027` | frozen |
| Korhogo Ihsane (365) | `?year=2027`; COSIM council prints | frozen on mawaqit; **the council's own print is the same country's authority line** (section 2) |
| Freetown Al Ansaar (365) | `?year=2027`; Wayback CDX (empty) | frozen; no archive capture exists |
| Old Yundum (365) | `?year=2027`; Wayback CDX (empty) | frozen |
| Koina (365) | `?year=2027`; Wayback CDX (empty) | frozen |
| Ngaoundéré (365) | `?year=2027` | frozen |
| N'Djamena (365) | `?year=2027`; Wayback CDX (one 1,500-byte JS stub, 2025-06-20) | frozen; the archive holds no calendar |
| Bangui (365) | `?year=2027` | frozen |
| Brazzaville (365) | `?year=2027` | frozen |
| Malabo / Port-Gentil / Libreville Kinguélé (365 each) | `?year=2027` | frozen |
| Goma Taqwa / Daaru-ssalaam (365 each) | `?year=2027` | frozen |
| Kumasi Central (30 rows) | GhanaMasjid monthly cache | held reading stands: one rolling month, no dated archive; not re-probed this pass |
| Entebbe (365) | new Kampala surface (section 6) | **Uganda gains a second city surface**, not a second year |
| Arusha (3 years) | already A-eligible on salaahtimes 2026-27 | unchanged |
| Ségou (365) | new Ségou mosque (section 6) | **second witness in the same city**, same recipe, not a second year |
| Bamako (365) | seven new Bamako mosques (section 6) | city mosaic measured; no second year |

Consequence, stated plainly: **not one mawaqit-held surface in this wave can be lifted to A.**
The publisher serves one computed generation per mosque, the forward parameter relabels, and the
archive holds no capture of these pages. The year-2 accrual for this region must come from the
councils' own prints, which is where the wave's real gain sits (sections 2, 3, 4).

## 8. Inventory

- `captures/` — 188 files, 42 MB: 30 mawaqit mosque pages, 64 mawaqit calendar PDFs (edition
  tests), 35 CERFI weekly PDFs, the COSIM 1448 and 1447 sheets plus 2 Wayback 1436 artifacts,
  the MSBF 1441/1442 annual PDF, COSIM/GSIC/BAKWATA/CERFI page captures and their app bundles,
  and every OCR column crop used for transcription.
- `data/` — 76 files, **5,803 primary dated rows** across 52 surface files (12 mawaqit year
  tables, 34 CERFI weekly sheets, 3 COSIM editions, 1 MSBF annual print), plus the derived fit
  inputs and the per-surface edition tests.
- `fit/` — `cosim-ci-fit.json` and the timestamped `fit2-*.json` for every mosque surface.

## NEXT

- COSIM: the remaining monthly editions between 1448 Joumada and the current month are not
  served (one file at a time, id 20). Watch the `/storage/calendrier/` path as each Hijri month
  turns; a full Hijri year of editions would fix the seasonal curve and settle the drift.
- CERFI: find the city-path pattern for the other eight held Senegalese cities (Dakar resolves;
  Thies and Kaolack 404 under the same pattern), then extend the interval rule across them.
- MSBF: the 1448 print is the missing artifact; the federation's Facebook post and the Scribd
  copy are both walled. A dated revisit after the next monthly roll is the cheapest route.
- Second mosques still open, in mission order: Bangui, Brazzaville, Pointe-Noire, Malabo, Goma,
  Kinshasa, Arusha, Kumasi, Yaoundé, Lomé (third mosque), Cotonou, Freetown (second), Serrekunda,
  N'Djamena (second), Libreville. Languages to carry: French, Portuguese, Lingala, Swahili, Twi,
  Ewe, Fon, Sango.
- "Jamiat" and "SUPERSOL" in the mission's council list resolve to no body under those names in
  Senegal, Gambia, Sierra Leone or Ghana (English and French, four phrasings each). Of the named
  councils, three publish prints — COSIM (CI), CERFI (SN), MSBF (BF) — and two do not: GSIC's
  site carries moon-sighting notices, a mosque list and reports but no timetable (its monthly
  calendar lives on Facebook, HTTP 400 anonymously), and BAKWATA has no timetable route at all.
  If the two unresolved names belong to another country, the next pass should carry them there.
