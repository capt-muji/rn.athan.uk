# O1n-48 REPORT — Americas interior and Central America/Caribbean, re-covering the O1n-30 named leads

Wave O1n-48, round four (o1n), session four, 2026-11-12. Workspace
`$HOME/athan-gitree/census/o1n/o1n-48-americas2/`. Engine for every fit: adhan 4.4.6
(`census/adhan-build/node_modules/adhan`), zone pinned per surface from the surface's own
metadata, dates from literal capture strings, nothing reads the real clock into data.
Public pages only: no login, no forms, no challenges, no contact. Every raw artifact under
`captures/` gzipped in place; derived rows and fits under `data/`. Every image and PDF
through the local macOS Vision fast binary only (none encountered so far). The repository
is never written. The standing exclusion applies at runtime; the excluded place is never
named anywhere in this workspace. Timestamps UTC. Wayback: one probe at a time, stop the
thread on the first 429 (no 429 was hit; all CDX and snapshot fetches returned 200).

Held lines inherited, never redone: Trinidad Darul Uloom 365 (banked, O1n-30), El Bolon /
Ushuaia / La Paz / Maracaibo negatives (O1n-11/O1n-29, not reopened), the muslimsalat
Caribbean rows, the Fazilet per-country rows, the o1n-11 Lima/Colombia routes, the Santa
Cruz and Caracas one-publisher rules, the Panama door's first dated row (O1n-30).

## Method found this wave: the public mawaqit board page is a dated-table surface

The O1n-30 negatives named Facebook/YouTube/mawaqit leads per country. This wave walked the
mawaqit route first: every public board page (`mawaqit.net/<locale>/<slug>`, no login)
server-renders a `"calendar":[...]` blob holding a 12-month day-by-day table
(fajr, shuruq, dhuhr, asr, maghrib, isha), plus the board's own latitude, longitude and
timezone. 20 boards were found across the fronts and fetched 2026-11-12 (one each,
journaled in `data/mw-fetch-journal.jsonl`; 17 in the first sweep, then Curacao and two
Trinidad boards); each parsed to 365 dated rows labelled with the served
civil generation 2026 (the board prints no year; the capture date is 2026-11-12, and the
Feb 29 slot drops in a non-leap generation - 365 rows exactly). Fits at each board's own
coordinates and zone, adhan 4.4.6: angle sweep for fajr/isha, median-margin for solar,
Shafi-vs-Hanafi asr pick. An initial sweep bug (a spread operator dropped the score, so the
first angle always won) was caught by a day-by-day diagnostic and fixed before any fit was
trusted; the buggy run's numbers were discarded, the fixed run banked (`data/mw-fits-run2.log`).

Asr characterization across the clean boards: Shafi within ±2 minutes all year (shadow-formula
edge, not jamaat steps) on the Shafi-picked boards (11 of the first sweep, plus Curacao and
the two Trinidad boards); Hanafi (w1 97.8-100) on Montevideo and the two Panama
musallah boards. The wave's earlier per-month angle diagnostic resolved to a single fixed
recipe per board (the "per-month angle" reading was a median artifact; day-by-day deviations
against the one recipe are 0/±1 everywhere, `data/diag-steps-*`).

Three boards are structurally misconfigured at the publisher and fit nothing:
Havana Abdallah (154), La Paz ACIB (1335), Santa Cruz CIS (45678). Their solar blocks sit
hours off true solar at their own coordinates (dhuhr residuals -365 to -389 min class), the
signature of a Europe-class computation zone behind an Americas display label. Banked
AS PRINTED, NOT PROVEN as city records, never forced into a recipe.

## 1. PANAMA: the door walked - three dated rows, one fitted recipe, plus a same-day three-board witness set

The Fundacion Islamica de Panama / Mezquita Jama widget (`islamenpanama.com/mezquita-jama/`)
now holds three dated rows:

- 2026-11-11 (O1n-30, inherited): Fayr 4:58, Amanecer 6:10, Dzhuhr 12:02, Asr 4:16 PM,
  Maghrib 5:54 PM, Isha 7:02 PM.
- 2026-11-12 (fetched live this wave, `captures/pa-jama-today-20261112.html.gz`):
  value-identical print (plausible at five-minute rounding; the solar block moves <1 min/day).
- 2024-09-12 (the page's only Wayback snapshot, 20240912212307, fetched
  `captures/pa-jama-wayback-20240912.html.gz`): 9 Rabi al-Awwal 1446, Fayr 4:58,
  Amanecer 6:08, Dzhuhr 12:14 (asr/maghrib/isha outside the widget's rendered cells in the
  archived markup).

Fit at Panama City (8.98, -79.53, America/Panama): the solar block sits on the
**fajr 18 deg / isha 17 deg family at zero margins** on both dated rows (fajr 0/-1,
sunrise 0/0, dhuhr 0/0, maghrib 0, isha -1), and the asr print sits +53 min over Shafi -
the Hanafi shadow class. Two dated rows, one recipe, two years apart: **fajr 18, isha 17,
Hanafi asr, zero solar margins**. Grade candidate (two rows only); tier community (the
Fundacion's own widget). The mihrab.ru-class daily-accumulation route is now measured dead:
the archive holds exactly one snapshot of the widget page and the 43 homepage-class
snapshots (2014-2026, all fetched, journal `data/pa-jama-fetch-journal.jsonl`) carry no
widget - the homepage never rendered one (verified on the largest, 2026-04-27).

Same-day witness set, 2026-11-12, three mawaqit Panama boards:

- MADINA MASJID PANAMA (`madina-masjid-panama-panama-000000-panama`, 9.0031, -79.5216,
  zone America/Panama): 04:57/06:10/12:02/15:24/18:00/19:09. Recipe 15/15 with fixed
  tweaks fajr -13, isha +15, maghrib +6; asr Shafi (w1 91.5). Within-1 100 on every column.
- musallah la loceria (`musallah-la-loceria-panama-00507-panama`) and musalla central
  (`musalla-central-panama-panama-507-panama`): prints 04:57/06:10/12:12/16:17/18:00/19:08.
  18 deg fajr (17.25/15.5 isha), dhuhr +10 (jamaat delay), maghrib +6, **asr Hanafi
  (w1 99.5/97.8)** - the same Hanafi-asr reading as the JAMA door.

The witness structure measured same-day: the door (Hanafi asr, maghrib = sunset+0) against
Madina (Shafi asr, maghrib +6) against the musallahs (Hanafi asr, dhuhr +10, maghrib +6).
Three public lines, recorded separately, never blended.

## 2. CENTRAL AMERICA: four first dated-table surfaces where O1n-30 recorded negatives

All four are mawaqit public boards, 365 dated rows each, fetched and fitted as in the method
section. Within-1 is 100 on every column of every board unless noted.

- **Costa Rica - Mezquita Luz y Fe, Merced/San Jose** (`mezquita-luz-y-fe-mercedes-costa-rica-40002-costa-rica`,
  9.9337, -84.0876 zone America/Costa_Rica): fajr 18, isha 17, maghrib +7, asr Shafi
  (w1 98.6, worst 14). The Diyanet-overseas family. Costa Rica's first dated table above
  platform calculators. O1n-30's line ("Mezquita Omar is Facebook/Instagram only") stands
  for the Omar mosque; this is the other San Jose congregation.
- **El Salvador - Mezquita Dar Ibrahim, San Salvador** (`mezquita-dar-ibrahim-san-salvador-1101-el-salvador`,
  13.6994, -89.1979 zone America/El_Salvador): fajr 18, isha 17, solar zero-margin,
  asr Shafi (w1 87.1, worst 15). El Salvador's first dated-table surface; O1n-30 searched
  Spanish terms and found nothing above platforms.
- **Guatemala - Mezquita Aldaawa Islamica, Zona 9, Guatemala City**
  (`mezquita-aldaawa-islamica-de-guatemala-zona-9-09-guatemala-guatemala`, 14.6103,
  -90.5176 zone America/Guatemala): fajr 18, isha 17, solar zero-margin, asr Shafi
  (w1 96.7). This is the same congregation whose own website holds the ledger's 365-row
  2026 surface (below) - a same-publisher two-surface witness, quantified in section 3.
- **Belize - Masjid Al Falah, Belize City** (`masjid-al-falah-9011-belize-city-belize`,
  17.5046, -88.1975 zone America/Belize): fajr 15, isha 15, every margin 0, asr Shafi
  with within-1 100 (the cleanest board of the wave). The 15/15 family. The Islamic
  Mission of Belize's mosque - O1n-30 named its Facebook group login-walled; the public
  board was the workable surface all along.

Honduras stays negative this wave: no mawaqit board surfaced under `site:mawaqit.net
Honduras` (junk hits only), and the mosque-own-site route is unchanged from O1n-30.

## 3. GUATEMALA: the ledger candidate fitted, and the second witness landed

- The ledger's Guatemala City surface (`o1k-wide/americas2/rows_gt_aldaawa_guatemala_city.json`,
  365 dated rows 2026) is fitted here for the first time (adhan 4.4.6, Guatemala City
  14.6349, -90.5069, America/Guatemala): **fajr 17.75 (median -1, within-1 100, worst 1),
  isha 17 (median 0, within-1 100, worst 1), sunrise/dhuhr/maghrib margin 0, within-1 100,
  worst 1** (`data/gt-aldaawa-fit-sweep.json`).
- Second witness: the o1l athanpro September 2026 rows for Guatemala City match the aldaawa
  year cell-for-cell within ±1 (30/30 matched; sunrise 30/30 exact; maghrib/isha medians 0
  with the -1 rounding alternation; `data/gt-athanpro-vs-aldaawa-witness.json`). Two
  independent extractions, one generation.
- Third surface, same congregation: the mawaqit Aldaawa board (section 2) fits 18/17 at
  median 0 - one minute-class offset on fajr (17.75-vs-18 rounding family) between the
  mosque's own site and its board, recorded, never blended.

## 4. SOUTH AMERICA INTERIOR: five first dated-table surfaces (Peru x2, Uruguay x2, Paraguay, Argentina interior)

- **Lima - Mezquita de Magdalena del Mar** (`mezquita-de-magdalena-del-mar-lima-07921-peru`,
  -12.0939, -77.0724 zone America/Lima): fajr 18, isha 17, maghrib +3, asr Shafi (w1 95.1).
- **Lima - Mezquita Nurul Islam** (`mezquita-nurul-islam-lima-15084-peru`, -12.0851,
  -77.0281 zone America/Lima): fajr 18, isha 17, zero margins, asr Shafi (w1 94.2).
  Two independent Lima boards, one 18/17 family, recorded separately.
- **Montevideo - Al Musallah Al Haazimi** (`al-musallah-al-haazimi-11100-departamento-de-montevideo-uruguay`,
  -34.9092, -56.1635 zone America/Montevideo): fajr 18, **isha 18**, zero margins, **asr
  Hanafi within-1 100** (worst 24). A distinct recipe from every other board this wave.
- **Centro Islamico del Uruguay board** (slug `lnwr-lzngryh-1231000-` + a misconfigured
  country label, redacted from this workspace per the standing naming rule; the board's
  own coordinates -34.9075, -56.1865 are Montevideo, its zone label says Sao Paulo):
  fajr 18, isha 17, zero margins, asr Shafi (w1 93.7).
  A second Montevideo line, distinct from Al Haazimi (18/17 Shafi vs 18/18 Hanafi); the
  owner-order resolution rule (adoption) governs, and both are recorded.
- **Ciudad del Este - Mezquita Del Este, Paraguay** (`mezquita-del-este-ciudad-del-este-7000-paraguay`,
  -25.5226, -54.5856 zone America/Asuncion): fajr 15 (fixed tweak -13), isha 15 (fixed
  tweak +9), zero solar margins, asr Shafi (w1 86.3). Paraguay's first dated table.
- **Cordoba - Centro Islamico de la Provincia, Argentina interior**
  (`centro-islamico-de-la-provincia-265-cordoba-argentina`, -31.4207, -64.1836 zone
  America/Argentina/Buenos_Aires): fajr 18, isha 17, maghrib +4, asr Shafi (w1 79.7).
  O1n-30 recorded Cordoba with no discoverable own site; the public board is its first
  dated-table surface.

Bolivia: both mawaqit boards found (La Paz ACIB, Santa Cruz CIS) are in the structurally
misconfigured class (section on anomalies above); AS PRINTED, NOT PROVEN; the held La Paz /
Santa Cruz one-generation lines stand untouched.

Colombia and Venezuela interior: no mawaqit board surfaced (`site:mawaqit.net Colombia`,
`... Venezuela ...` junk only). Their O1n-30/O1n-11 negatives stand; the remaining routes
are the named FB/TikTok pages (public-pages-only discipline keeps them leads, not fetches).

## 5. CARIBBEAN, first pass: Cuba's only board is the misconfigured class

- **Havana - Mosque Abdallah** (`mosque-abdallah-edificio-cupet-la-habana-154-havana-cuba`,
  23.1374, -82.3599 zone America/Havana): the board is structurally misconfigured (solar
  residuals dhuhr -365, sunrise -86; the Paris-computation-zone signature). AS PRINTED,
  NOT PROVEN as a Havana record. Cuba beyond Havana: Santiago de Cuba still platform-only.

## Anomaly class recorded for the fleet

Three of the 20 mawaqit boards in the Americas carry the Europe-computation-zone
misconfiguration
(Havana 154, La Paz 1335, Santa Cruz 45678; also seen: the Uruguay board whose slug says
"geo-redacted" while its coordinates are Montevideo). Fleet note: always fit the solar block at
the board's own coordinates before trusting any mawaqit board's print; a hours-class dhuhr
residual means the board is misconfigured at the publisher, and the print is banked
AS PRINTED, never fitted as a city record.

## 6. CARIBBEAN, continued: Curacao, Dominica, Trinidad's two new boards, Jamaica walked

- **Curacao - Omar Ibn Alkhattab Mosque, Willemstad**
  (`mawaqit.net/en/omar-ibn-alkhattab-mosque-6-weg-naar-welgelegen-4796`, 12.1155,
  -68.9490, zone America/Curacao): 365 dated rows, **fajr 18, isha 17, solar zero-margin,
  asr Shafi (within-1 94)** - the 18/17 family. The Lesser Antilles' first dated-table
  surface above platform calculators. Aruba, Bonaire, Barbados, Grenada, Saint Lucia,
  Antigua, St Kitts, Dominica, St Vincent: no board surfaced (negatives, routes named
  in section 8).
- **Dominica - Muslim Community of Dominica (Roseau Masjid)**, `dominicamuslim.org/prayer-times/`
  walked whole: the page renders a PrayTimes-plugin monthly table client-side from the
  publisher's stated config, embedded in the page: `latitude 15.3, longitude -61.4,
  timezone -4, dst 0, method "Makkah"` (the Umm al-Qura class: fajr 18.5 deg, isha
  maghrib+90). **A stated-algorithm surface, not a dated table**: recorded under the
  algorithm-vs-timetable study as Dominica's first stated recipe above platforms, never
  generated into rows. The static "Jamah Salah Times" clock block (Fajr 5:15 AM, Dhuhr
  1:15 PM, Jummah 1:20, Asr 4:15 PM) is a jamaat clock list, recorded never fitted.
- **Trinidad - two NEW mawaqit boards beyond the banked Darul Uloom line**:
  - Masjid-Ul-Ahad, Princes Town (`masjid-ul-ahad-aldana-st-850412-princes-town-trinidad-tobago`,
    10.2691, -61.3709, America/Port_of_Spain): 365 rows, fajr 15, isha 15, all margins 0,
    asr Shafi within-1 100.
  - Ilmul Islam center, Enterprise/Chaguanas (`ilmul-islam-center-ragoonanan-road-madras-settlement-501819-enterprise-chaguanas-trinidad-and-tobago`,
    10.5366, -61.3486, America/Port_of_Spain): 365 rows, identical family, asr Shafi
    within-1 100.
  - Board-vs-board witness: the two boards are cell-identical within ±1 minute on all 365
    matched dates, every column median 0 (`data/tt-board-vs-board-witness.json`) - one
    15/15 generation across central and south Trinidad. The island now holds TWO distinct
    published lines: the Darul Uloom's 19.5/17.5 Hanafi (+7/+3) institute print (banked
    O1n-30, untouched) and the 15/15 Shafi community-board line (this wave). Both recorded
    separately; adoption-based resolution is owner-ruled and never averaged here.
- **Jamaica - centralmasjidjamaica.com** (Central Masjid Jamaica) walked: nav carries
  about-us and "Prayer in Islam" fiqh text only, no timetable page, no widget, no board
  embed. Jamaica stays a negative with a new route recorded (section 8).

## 7. COLOMBIA: first dated-table surface - Cartagena, with the timezone artifact measured

**Mezquita de Muhammad, Getsemani, Cartagena de Indias** (masjidbox board
`mezquita-de-muhammad-1747848830940`, address verified Cl. 25 #8b-177, Getsemani,
Cartagena; walked via the masjidbox public landing API in 53 seven-day windows,
2026-01-01..2026-12-31, journal in `captures/mbx/`): **371 dated rows spanning
2025-12-31..2027-01-05** (window overhang included; dates from the response's own literal
fields). The board's settings carry `timezone America/New_York` against the Colombia
address - and the print shows it measured: dhuhr residual vs UTC-5 is +1 min median in
the five EST months (n=157) and **+61 min median in the seven NY-DST months (n=214)**.
Recipe (EST months, adhan 4.4.6 at Getsemani 10.4236, -75.5478): **fajr 18, isha 17,
zero margins, asr Shafi**, within-1 84.7 (rounding-class misses). The +60 block is a
board-configuration artifact of one generation, recorded as such - a dated regime split
by artifact, never blended across it. Colombia's first dated table; the Maicao and
Barranquilla FB/TikTok named leads (O1n-11/O1n-30) stand.

## 8. Honest negatives this wave, with routes and languages

- **Honduras**: `site:mawaqit.net Honduras` junk only; the mosque-own-site route unchanged
  (O1n-30). The congregation's Facebook page (`islamenhondurasmezquita`) surfaces in
  search and is login-walled - named lead, never fetched. Platform calculators only
  (time.now, duakitapligi). The YouTube-described-timetable route searched under
  `mezquita "san pedro sula" horarios`, `"horarios de oración" 2026 ... cuba OR jamaica`,
  and `site:youtube.com horarios oración "noviembre 2026"`: lecture and news videos only,
  no timetable-bearing descriptions. Spanish, English.
- **Puerto Rico**: Centro Islamico de Puerto Rico is an islamicfinder listing; Masjed
  Montehiedra (San Juan) and Mezquita Uthman (Ponce) remain Facebook-post classes,
  login-walled, named leads. No mawaqit/masjidbox board. Spanish, English.
- **Jamaica**: centralmasjidjamaica.com walked (no timetable); Islamic Council of Jamaica
  still salatomatic-listing only; pray.zone / prayertimesalert.com are platform
  aggregators. English.
- **Cuba beyond Havana**: Havana's only board is the misconfigured class (the anomaly
  block above); Santiago de Cuba platform-only; Mezquita Abdallah's own presence
  stays visits-only social. Spanish, English.
- **Lesser Antilles remainder**: Barbados (Jama Masjid, Madina Masjid Bridgetown) press/
  Facebook classes; Grenada, Saint Lucia, Antigua, St Kitts, Dominica (the PrayTimes
  algorithm surface above), St Vincent, Aruba, Bonaire - no dated surface at any tier
  above platforms under the searched terms (English, Dutch, Spanish).
- **Venezuela interior**: Naguanagua/Valencia (Mezquita Alquds Ash-Sharif) Instagram reel
  only; Maracay platform-only. The Caracas and Maracaibo held rules stand. Spanish.
- **Ecuador, Peru interior, Bolivia interior, Paraguay (Asuncion), Argentina interior
  beyond Cordoba**: unchanged from O1n-30's walked negatives; this wave's new surfaces
  cover Lima x2, Ciudad del Este and Cordoba (sections above).
- **Trinidad ASJA** (`asja1935` Facebook, the largest T&T body): still login-walled -
  named lead, never fetched.

## Totals and grades

| front | surface | dated rows | recipe (adhan 4.4.6) | grade / tier |
|---|---|---|---|---|
| Panama door | PA-JAMA-3ROWS | 3 | 18/17, solar 0, Hanafi asr | candidate / community |
| Panama boards | mawaqit x3 | 1,095 | Madina 15/15+tweaks; musallahs 18/17.25, 18/15.5 Hanafi, dhuhr +10 | provisional / platform |
| Costa Rica | MW Luz y Fe | 365 | 18/17, maghrib +7, Shafi | provisional / platform |
| El Salvador | MW Dar Ibrahim | 365 | 18/17 zero-margin, Shafi | provisional / platform |
| Nicaragua | MW Managua | 365 | 15/15, isha +5, Shafi | provisional / platform |
| Guatemala board | MW Aldaawa Z9 | 365 | 18/17 zero-margin, Shafi | provisional / platform |
| Guatemala ledger | Aldaawa own site | 365 | 17.75/17 zero-margin, Shafi | provisional / community |
| Guatemala witness | athanpro Sep | 30 | ±1 vs ledger, 30/30 matched | witness |
| Belize | MW Al Falah | 365 | 15/15 zero-margin, Shafi (cleanest board) | provisional / platform |
| Trinidad | MW x2 boards | 730 | 15/15 zero-margin, Shafi; two boards ±1 identical | provisional / platform |
| Curacao | MW Omar Ibn Alkhattab | 365 | 18/17 zero-margin, Shafi | provisional / platform |
| Colombia | masjidbox Cartagena | 371 | 18/17 zero-margin, Shafi; +60 NY-DST artifact block | provisional / platform |
| Peru | MW x2 | 730 | 18/17 (+3 maghrib one), Shafi | provisional / platform |
| Uruguay | MW x2 | 730 | 18/18 Hanafi w1 100; 18/17 Shafi | provisional / platform |
| Paraguay | MW Del Este | 365 | 15/15, tweaks -13/+9, Shafi | provisional / platform |
| Argentina int. | MW Cordoba | 365 | 18/17, maghrib +4, Shafi | provisional / platform |
| Dominica | stated algorithm | 0 | PrayTimes Makkah (18.5 / maghrib+90), (15.3,-61.4), UTC-4 | algorithm surface |
| Cuba | MW Abdallah | 365 | misconfigured - AS PRINTED | not proven / platform |
| Bolivia | MW x2 | 730 | misconfigured - AS PRINTED | not proven / platform |
| 8 fronts | negatives with routes | 0 | - | honest negatives |

Dated rows banked this wave: **7,674** (20 mawaqit boards x 365 = 7,300; masjidbox
Cartagena 371; Panama door 3 live/archive rows; the rest of the data/ files are fits and
witnesses of banked surfaces, no new rows). Of those, 1,095 rows sit in the not-proven
misconfigured class (Cuba, Bolivia) and are banked AS PRINTED only.

Wayback: 2 CDX probes + 45 snapshot fetches (43 homepage-class in the journaled loop, one
homepage re-verify on the largest capture, and the widget-page 2024 snapshot), one
sequential thread, zero 429s. masjidbox API: 53 windows + 4 slug probes, zero failures.
All raw captures gzipped under `captures/`; nothing enters git; no subagents were
deployed at any point; the standing exclusion applies at runtime and the excluded place
is never named anywhere in this workspace.

