# O1n-11 REPORT — the Americas: authority and community witnesses above the platform layer

Wave o1n-11, round four (o1n), 2026-11-11. Workspace
`$HOME/athan-gitree/census/o1n/o1n-11-americas/`. Engine for every fit: adhan 4.4.6
(`census/adhan-build/node_modules/adhan`, `Rounding.None`), timezone pinned per surface,
dates from literal capture strings, nothing reads the real clock into data. Public pages
only; no login, forms, email or challenge. Wayback one probe at a time, spaced, stop on 429.
Every raw artifact saved under `captures/`; images and PDFs OCR'd with the local macOS
Vision binary only. The repository is never written.

Fronts, in dispatch order. INCREMENTAL: this report grows as the wave runs.

## 1. Chile — the Wayback 429 wall broken: 8 sheets banked; the 2025-10 class is a structural negative; September 2025 banked live for all 18 cities (782 new dated rows)

The held state (o1m-r6): 295 of 327 archived Centro Islámico de Chile sheet artifacts, months
2018-03..2025-08, recipe 18/17 Shafi +6 min every column, grade A. This wave's targets: the
sheets still behind the Wayback 429, and the 2026 accrual on the 18 held cities. The December
watch (first honest probe 2026-11-29) was left alone: no horarios-diciembre or December-2026
page was touched.

**Direct Wayback 429s on the first probe (2026-11-11T15:29:12Z); the thread stopped per the
standing rule.** The fallback route o1m-r6 used (TinyFish fetch, its own address) was taken
one URL at a time against the 24 still-missing city-months
(`data/cl-targets.json`, derived from the o1m-r6 CDX bank minus the held rows):

- **8 sheets came back with full text and are banked** — 242 dated rows
  (`data/cl-new-rows.json`, texts in `captures/chile-wayback-txt/`):
  Santiago 2024-12 (the `01-Santigo.pdf` typo artifact), Puerto Montt 2024-12 (the
  `16-Puesrto-Montt.pdf` typo artifact), Rancagua 2025-01, Osorno 2025-02, Puerto Montt
  2025-02, Santiago 2025-05, Antofagasta 2025-05, Concepción 2025-05 (the
  `12-Cancepcion.pdf` typo artifact). Every sheet header agrees with its expected month
  (upload month + 1); the header rule from o1m-r6 holds in every new artifact.
- **16 targets are a structural negative, not a rate limit**: their single Wayback snapshot
  (capture 2025-10-14) carries mimetype `text/html` at 5,772 bytes — the September-2025
  upload directory (`wp-content/uploads/2025/09/*`, the October 2025 sheets) was archived as
  an HTML page in place of the PDF for every city probed. The whole 2025-10 sheet class
  never entered the archive; no retry can recover it. This closes the o1m-r6 "Wayback
  returned HTML in place of the PDF" negative with its mechanism, per artifact.

**The live accrual.** A 28-probe naming matrix over the live upload tree
(`scripts/probe_live_tree.sh`) found exactly one surviving plain-name month:
`wp-content/uploads/2025/08/01-Santiago.pdf` (200). All 18 September 2025 sheets came down
as PDFs (spaced 3 s, `captures/chile-live/`), every one genuine — each header names its own
city and SEPTIEMBRE 2025 (no mis-filing in this month). **540 new dated rows, all 18 cities
now hold September 2025.** No other accrual month survives live: uploads 2025/09..2026/09
404 on both tested name patterns, and October+November 2026 were already banked by C17.

**Fit** (`scripts/parse_score_chile.js`, the held recipe 18/17 Shafi +6 on every column,
civil offset derived per day from each sheet's own dhuhr so the September DST start inside
the month — Sep 6→7, +61 min — is handled by construction, nearest-minute rounding
convention matched to the held scorer): 26 sheets, 782 new rows, 4,489/4,692 cells within-1
(95.7 pc), worst 3. Per-month: December 2024 99.5/98.9 pc; January 2025 98.9; February 2025
74.4/73.2 (the asr/maghrib/isha summer tail the held fit already carries for southern
cities; fajr and dhuhr 100 pc); May 2025 89.8/97.3/86.6; September 2025 94.4-99.4 pc per
city. The +6 regime holds through every new sheet: the recipe is unchanged from March 2018
to November 2026.

**Chile ledger now:** the archive holds 303 of 327 artifacts; the 24 still out are 16
HTML-captured (structural) plus the 8 recorded o1m-r6 gate drops. Grade stays A; the new
months thicken the span without changing the recipe.

## 2. Canada — the Alberta +60 fall-back block live-gated: still served, unchanged, to year end (six tenants)

The held defect (o1m-r6): six Alberta Masjidal tenants carry a `+60` block from 2026-11-01
to 2026-12-31 — the tenant table stayed on daylight time after the 1 November fall-back,
and 2026 is the only broken year. This wave re-fetched all six from the keyless range API
for 2026-10-25..2026-12-31 (`captures/masjidal-ca/`):

- **Every overlap day is byte-identical to the held capture**: 68/68 per tenant, six
  tenants, zero corrections. The block was never fixed.
- **The November 1-10 rows (actually served this week) still carry the block**: dev medians
  against adhan at each tenant's own coordinates are +59..+67 min on every column for the
  five Edmonton-class tenants (AlFalah, Markaz Ul Islam, Al-Fatima, Leduc, Ibn Masood).
- **Leduc (`1XAlR4Kb`) serves December at +120**, not +60 — a second broken month on top of
  the recorded one (its 2024-02 block was also +120). The other five hold +60 through
  December. Verdict table: `data/ca-plus60-livegate.json`.

No year-3 accrual was available: the range API serves nothing beyond 2026-12-31 for these
tenants yet. The held grade (A, six recomputed years, Alberta 18/17 in 7 of 9, Ontario
15/15 in 6 of 7) stands; the live gate strengthens it.

## 3. United States — Oklahoma City gains its own mosque's dated table (ISNA, 28 rows, 100 pc)

The held metros (Salt Lake City, Oklahoma City, Norfolk, Newark) are community/mosque-tier
A's; the mission asked for second witnesses and the authority surfaces behind the 39-state
fit layer. First banked:

**US-OKC-AMA-GRANDMOSQUE-FEB2026.** The American Muslim Association of Oklahoma (Grand
Mosque OKC, 3201 NW 48th St) publishes a monthly photo-PDF calendar
(`amaokc.com/s/AMA-Prayer-Calendar-<m>-<yy>.pdf`). Four months were captured by o1m-r6 as
photographs (no text layer); this wave OCR'd all four with the local Vision binary
(`captures/us-okc/*.txt`) and transcribed them (`data/us-okc-ama-transcript.json`):

- **February 2026 page 2 is a genuine 28-row adhan table and it fits NorthAmerica (ISNA)
  15/15 at zero margin: 168/168 cells within-1, worst 1** — at both the mosque's own point
  and the city centroid (`data/us-okc-ama-fit.json`). This is Oklahoma City's second dated
  witness, from the metro's Grand Mosque, on the recipe the city's ISNA country would
  predict (Norman's 17.9/16.9 MWL remains the held first witness; two mosques, two recipes,
  one city — recorded, never blended).
- Page 1 of every sheet is an iqama board (banded date ranges, fixed clock rows) — never
  banked, the Tallahassee class.
- **May, June and August sheets are unreproducible and recorded as such.** Tested: every
  adhan method (ISNA, MWL, Karachi, Umm al-Qura, Moonsighting, angle pairs 12-18), a
  1,600-point North American location grid at ISNA, and day-shifts -40..+10 days. No
  combination fits. June's rows are internally consistent (sunrise 6:15, sunset 8:41, noon
  1:29 — one sky) but that sky is no North American point's June sky at any tested method:
  its maghrib prints six minutes before OKC's sunset. Class: unreproducible image-sheet,
  recorded with the failed hypotheses, not banked.
- The `/s/` calendar path is dead live (Squarespace 404 page) and the CDX holds no archived
  PDF of the series; the four o1m-r6 captures are the only artifacts.

## 4. Mexico — the Guadalajara mosque's own publisher family: five city tables, 900 rows, MWL zero margin

The held Mexico layer is the platform gazetteer plus Monterrey's mawaqit install (Centro
Cultural Islámico del Norte, 14.9/14.9). This wave found **islamguadalajara.com** — the
Guadalajara mosque's own site (mezquita at Centauro 2912, La Calma, Zapopan) — which
publishes a self-computed prayer page per city: the method and coordinates are declared on
each page (Muslim World League, Fajr 18, Isha 17, Asr Shafi; per-city coordinates and
qibla), and a full-month dated table renders under
`/mezquita/horarios-de-oracion/<ciudad-estado>/`. curl is 403; captures are TinyFish
markdown (`captures/mx/`).

**Five city pages live, five fits, one recipe: 900 rows, 900/900 cells within-1, worst 1**
(`data/mx-islamguadalajara-fits.json`):

| city | self-declared point | rows | w1 | note |
|---|---|---|---|---|
| Guadalajara | 20.6597, -103.3496 | 30 | 180/180 | the mosque's own city |
| Monterrey | 25.6866, -100.3161 | 30 | 180/180 | **second witness** beside the held mawaqit install (two publishers, one city) |
| Ciudad de México | 19.4326, -99.1332 | 30 | 180/180 | new city surface |
| Mérida | 20.9674, -89.5926 | 30 | 180/180 | new city surface |
| Toluca | 19.2826, -99.6557 | 30 | 180/180 | new city surface |

Puebla, Tijuana and Querétaro slugs 404. Tier: the tables are the mosque's own calculator
(self-declared, no external service), so the provenance is a mosque but the engine is
self-computed at city coordinates — recorded as community tier with the self-declaration
quoted, not blended with the platform layer.

**Mexico City authority route, dated negative:** the Centro Cultural Islámico de México AC
(Av. Colonia del Valle 324-7, Col. del Valle, CDMX) holds no own-site timetable that any
search surfaced — directory entries only (islammessage.org center page, near-place and
Cybo listings; phone +52 55 5687-05-14). Languages: Spanish and English. The CCIM class
remains without a dated surface; CDMX's new rows above are the Guadalajara publisher's city
page, not CCIM's.

## 5. Brazil, Peru, Colombia — one new São Paulo publisher banked; Lima's authority body resolves to the held install

**BR-SAO-PAULO-JERRAHI-2005.** The Jerrahi community of São Paulo publishes a full-year
São Paulo table at `masnavi.org/jerrahi/Horario_das_oracoes/horario_das_oracoes.html`
(365 dated rows, DD/MM + six columns, "Horários válidos apenas para a cidade de São
Paulo"). Three findings banked (`data/br-jerrahi-sp-2005.json`):

- **The year is 2005, pinned by the publisher's own export.** The page is an Excel-sheet
  export whose date cells carry `x:num` serials 38353..38717 = 2005-01-01..2005-12-31.
- **It is one frozen generation, served ~16 years.** The Wayback content digest is constant
  from 2010-07-29 through 2018-10-22, and the live table checked identical to the 2010
  capture on its rows. Frozen-reprint verdict; candidate grade; never lifts anything.
- **The printed table is fixed UTC-3 standard time.** The page warns "durante o horário de
  verão acrescentar uma hora" — the reader adds DST; printed values carry none. Fit at fixed
  standard time: **Other 18/18, zero margin, at (-23.6, -46.6): 1,768/2,190 cells within-1
  (80.7 pc), worst 4** (fajr 360/365, dhuhr 365/365; the maghrib column 182/365 is the
  publisher's sunset rounding, ±2). A new Brazilian community publisher above the platform
  mass, distinct from FAMBRAS (whose page embeds nine IslamicFinder widgets and publishes no
  own table) and Mesquita Brasil (no prayer block).

**Peru — the authority body maps to a held surface.** The Asociación Islámica del Perú
(Jirón Tacna 556, Magdalena del Mar, Lima) is the operator of the Mezquita de Magdalena del
Mar, whose mawaqit year table is already held and fitted (o1m-r6: 17.8/16.8 Shafi, 365
rows, 100 pc on five columns). The association's own web domain (islamenperu.org) is dead:
DNS failure from this host and TinyFish rejects it. No new Lima surface; the mapping is
recorded so the authority tier carries its install's fit.

**Colombia — Bogotá search routes returned nothing new.** DuckDuckGo rate-limited the
session mid-front (empty responses on two consecutive queries); the routes already recorded
in o1m-r6 (masjidbox search dead, social images, no tenant) stand. No new banked rows.

## 6. Argentina south (pending)

## 7. Bolivia, Venezuela, Ecuador, Uruguay, Paraguay (pending)

## 6. Argentina south — the southernmost mosque found; the 50-55S blanks stay without a local publisher

The 12 unbanked points at 50-55S (Ushuaia, Río Grande, Río Gallegos, the Tierra del Fuego
and Santa Cruz coast points) carry blank summer cells in the platform layer because the sun
never reaches the fajr/isha angles; the dispatch asked for any southern publisher. Findings:

- **The world's southernmost mosque exists and is real**: the Mezquita Sufí de la Patagonia
  (Naqshbandi Rabbani Argentina, El Bolsón, Río Negro, -42.27S) —
  `naqshbandi-rabbani-argentina.com.ar`, with a Spanish-language dawah site and its own
  Facebook presence. **Its site publishes no prayer table** (the fetched homepage is posts
  only; horarios paths not present; curl receives an empty 200 body, TinyFish the text —
  both show no timetable). El Bolsón is 700 km north of the blank-cell class.
- **No publisher of any kind surfaced for Ushuaia or Río Gallegos under Spanish terms**
  (mezquita Ushuaia, horarios de oración Tierra del Fuego, centro islámico Río Gallegos,
  comunidad musulmana Ushuaia, islam Patagonia austral; English variants beside). Every hit
  is a platform calculator (IslamicFinder, HalalTrip, quranmajeed, moustaqim, timesprayers).
  The 50-55S summer blanks remain without a local publisher: honest negative, dated today.

## 7. Bolivia, Venezuela, Ecuador, Uruguay, Paraguay — the second-witness sweep

- **Bolivia (La Paz's own table)**: no La Paz publisher surfaced. Every hit is a platform
  calculator (IslamicFinder, IslamiCity PrayWatch) plus an AI-generated content site whose
  self-asserted claim about local conventions is forum-hearsay class and is recorded as
  never-data. The clone finding (the install serves Santa Cruz's table) stands uncorrected;
  La Paz's usable layer remains the platform pass.
- **Venezuela (Maracaibo)**: no Maracaibo-specific publisher exists under the searched terms
  (mezquita Maracaibo, horarios Zulia; Spanish). The page-versus-sheet defect keeps its
  resolution: both artifacts are served by one publisher, the Caracas mosque's own domain
  (mezquitadecaracas.com), and the sheet's +19 governs; the page's +09 is that publisher's
  one-row transcription error. Platform calculators are the only Maracaibo tables beyond it.
- **Ecuador**: Quito's own mosque (El Centro Islámico del Ecuador, Mezquita Assalam)
  surfaces only through app mirrors (prayer-times.app2mob.com is a mirror of app data, not
  the mosque's own publication). No own-site table found.
- **Uruguay / Paraguay**: no second publishers surfaced beyond the held mawaqit tenants and
  the platform layer; the islamguadalajara family serves Mexico only (tested slugs for
  Montevideo, Asunción, Santiago, Bogotá, Lima: absent).

## 8. Negatives this wave, with routes

| target | result | routes |
|---|---|---|
| Chile October 2025 sheets (16 cities) | structural: Wayback archived HTML (5,772 B, text/html) in place of the PDF for the whole 2025/09 upload class | Wayback id_ via TinyFish, one at a time |
| Chile accrual 2025-09..2026-09 live | only uploads/2025/08 survives (September 2025 sheets, banked); 2025/09..2026/09 404 on both name patterns | live radioislam.cl, 28 probes spaced 3 s |
| AMA OKC May/Jun/Aug 2026 sheets | unreproducible: no method, no North American location, no day-shift fits | adhan method sweep, 1,600-point location grid, day-shift scan |
| amaokc.com calendar path live | dead: 404 (www redirect), and CDX holds no PDF of the series | curl www, CDX prefix + domain queries |
| Ushuaia / Río Gallegos publishers | none found; southernmost mosque (El Bolsón) publishes no table | Spanish + English terms, direct site fetches, engine searches |
| La Paz own publisher | none; platform calculators only | Spanish terms; hearsay-class claim recorded as never-data |
| Maracaibo own publisher | none; the defect stays one publisher's page typo against its own sheet | Spanish terms; publisher domain re-read |
| Quito mosque own site | none; app mirror only | Spanish terms |
| ISNA federation timetable print | no web artifact: isna.net serves no timetable PDF (live and CDX); the timetable is a print publication | isna.net direct, CDX pdf filter |
| masjidbox per-city indexing for US second witnesses | no index surface: search API dead (o1m-r6), sitemap lists product pages only (36 locs, no per-mosque routes) | sitemap-main.xml fetched and checked |
| masjidbox sitemap | recorded | curl, browser UA |

## 9. Totals banked this wave

| block | surfaces | dated rows | captures |
|---|---|---|---|
| Chile, Wayback 429 survivors (8 sheets) | 1 publisher, 5 cities | 242 | 8 text artifacts |
| Chile, live September 2025 (18 sheets) | 1 publisher, 18 cities | 540 | 18 PDFs + 18 texts |
| Canada, Masjidal +60 live gate | 6 tenants re-served, 68/68 identical each | 0 new (gate) | 6 JSON |
| US, AMA Grand Mosque OKC February 2026 | 1 mosque | 28 | 4 PDFs + 4 OCR texts |
| Mexico, islamguadalajara city family (November 2026) | 1 publisher, 5 cities | 150 | 5 text captures |
| Brazil, Jerrahi São Paulo 2005 | 1 publisher | 365 | 1 HTML (430 KB) |

Totals: 9 new dated surfaces (plus 6 gate re-serves), 1,325 new dated rows, 242 Chile
rows strengthening a grade-A span, one defect corrected in the record's understanding
(the Chile 2025-10 class is structural, not rate-limit), one frozen-generation new find
(São Paulo 2005) graded candidate, and one new city-second-witness (Monterrey).

Engine: adhan 4.4.6, `Rounding.None`, civil timezones pinned per surface (Chile sheets via
per-day dhuhr-derived offset, which survives the September DST start inside the month);
dates from literal capture strings; UTC provenance stamps; no clock reads in data.
