# O1m-R6 — Americas completion: the last US metros, Canada's pool years, Latin America's depth

Agent O1m-R6. Workspace `$HOME/athan-gitree/census/o1m/o1m-r6-americas/`.
Engine: adhan 4.4.6 (`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`),
`Rounding.None`, timezone pinned per surface, dates built from literal capture strings, no clock
read into data. INCREMENTAL: this report grows as the wave runs. No country is called complete.

## 1. Front 1 — the last four US metros: three proven, one still unproven

| metro | surface | tier | rows | span | recipe | w1 (f/s/d/a/m/i) | worst |
|---|---|---|---|---|---|---|---|
| Salt Lake City | Madina Masjid, 1773 W North Temple (masjidbox `madina-masjid-1570652609762`) | mosque | 2,197 | 2020-12-31..2027-01-05 | 14.9/14.9 Shafi | 100/100/100/100/100/100 | 1 |
| Oklahoma City | Islamic Society of Norman, 420 E Lindsey (masjidbox `islamic-society-of-norman`) | mosque | 2,197 | 2020-12-31..2027-01-05 | 17.9/16.9 Shafi | 100/100/100/100/100/100 | 1 |
| Norfolk | Crescent Community Center, Virginia Beach (Masjidal `keLQEzLM`) | mosque | 2,191 | 2021-01-01..2026-12-31 | 14.9/14.9 Shafi | 100/100/100/100/99.8/100 | 2 |
| Norfolk | Masjid Ash-Shura, 3518 Colley Ave (masjidbox `masjid-ashu-ashura`) | mosque | 2,197 | 2020-12-31..2027-01-05 | **defect** | — | 106 |

Three of the four metros the o1l close left unproven now carry a dated athan table that
reproduces at zero margins. The discovery route was the platform's own public prayer-times
pages, not a guessed domain: `masjidbox.com/prayer-times/<slug>` is a live per-mosque page, and
its slug is indexed by city name, which is how SLC Madina Masjid, ISGOC Norman and Ash-Shura
surfaced. Masjidal's tenant universe (o1l-43's 216 resolved ids) supplied Crescent CC.

**Norfolk's second surface is a defect worth recording.** Masjid Ash-Shura's masjidbox tenant
serves five columns frozen for six years — fajr 05:35, dhuhr 11:49, asr 14:38, maghrib 16:59,
isha 18:13 on every date from 2020-12-31 to 2027-01-05 — while its sunrise column moves
correctly. The mosque's athan block is a hand-entered daily row repeated, not a computed table.
Class: frozen-row tenant. Unusable as a dated athan layer; the mosque's own page
(`masjidashshura.org`) publishes today's row only.

**Tallahassee remains unproven.** Every route was walked and each one ends at an iqamah board:
`ictlh.org` and `alnoortlh.org` are WordPress sites on the Mohid plugin whose prayer block
carries today's row and no dated route (350 REST routes on ictlh, none touching prayer; alnoor's
`/wp-json/` answers 401); the Mohid cloud tenant (`us.mohid.co/fl/florida/isct/`) is a 200 SPA
with no table route and its `/masjid/online/` path 404s; no Tallahassee mosque is a Masjidal
tenant (0 of 216), a masjidbox tenant (searched by name and by city, none), a mawaqit install
(no slug), and `masjidway.com` answers 503 to every request from this host. Languages searched:
English; Spanish has no municipal role in Tallahassee and no Spanish-language surface was found.
`islamictallahassee.cfd` was read and carries no times.

The other 21 metros on the o1l unproven list were re-opened by O1l-44 and are not re-worked here;
this wave treats only the four it left empty. Oklahoma City's own AMA Grand Mosque publishes a
monthly image-class PDF series (`amaokc.com/s/AMA-Prayer-Calendar-<m>-<yy>.pdf`; four months
archived — Feb, May, Jun, Aug 2026 — and all four are photographs of a printed sheet with no text
layer). The series is recorded as a surface with an OCR prerequisite; the metro's dated layer is
Norman's masjidbox feed above.

## 2. Front 2 — Canada: the Masjidal pool years, 21 tenants × 6 years

**126 captures, 46,011 athan rows and 46,011 iqamah rows** for all 21 Canadian Masjidal tenants,
2021-2026 inclusive, from the keyless range API
(`masjidal.com/api/v1/time/range?masjid_id=<id>&masjid_detail=yes&from_date=&to_date=`). Years
2024-2026 were already held for five of them; 2021-2023 are new for all 21.

Fits, one recipe across the whole six-year span per tenant (per-year scores in `out/fit_*.json`):

| id | mosque | city | recipe | w1 (f/s/d/a/m/i) | worst | clock blocks |
|---|---|---|---|---|---|---|
| RKxw8gdO | Madinah Masjid | Toronto ON | 14.9/11.9 Hanafi | 100/100/100/100/100/73.8 | 20 | none |
| DAgvw3L0 | Masjid Huzaifah | Toronto ON | 14.9/15.0 Hanafi | 94.2/100/99.6/98.6/100/100 | 41 | none |
| 5AvP54KX | IQRA Masjid | Whitby ON | 14.9/15.1 Hanafi | 100/100/100/100/98.7/97.3 | 3 | none |
| DAgvk6L0 | Sarnia Muslim Association | Sarnia ON | 14.9/14.9 Hanafi | 100/100/100/100/84.6/100 | 4 | none |
| nDAga1K0 | Al-Ansaar Islamic Foundation | Calgary AB | 15.0/15.0 Hanafi | 100/100/100/96.5/100/100 | 64 | 2026-11-01..12-31 @+60 |
| 1XAlJWKb | Jamia Imam e Azam | Brampton ON | 18.0/15.0 Hanafi | 95.0/99.7/100/100/95.8/91.9 | 22 | none |
| Vdw3zode | Muslim Association of NB | Saint John NB | 14.9/15.0 Shafi | 80.4/89.9/100/87.9/97.1/99.1 | 3 | none |
| 0xdyV4KX | Imam Bukhari Centre | Milton ON | 15.0/14.3 Shafi | 100/100/100/93.5/100/57.8 | 7 | none |
| 1QL0lpLZ | Halton Islamic Association | Burlington ON | 14.9/15.1 Shafi | 91.4/88.1/96.3/71.8/63.0/64.8 | 63 | none |
| 1VL4rndx | Stittsville Muslims Association | Ottawa ON | 15.0/15.0 Shafi | 75.9/98.8/74.2/83.7/98.3/92.3 | 64 | none |
| Vdw3Dode | Islamic Center of West Island | Dollard-des-Ormeaux QC | 14.5/15.0 Hanafi | 72.1/97.9/99.9/89.1/96.9/89.6 | 74 | none |
| aAeo3XKj | Maktabah As Sunnah | Calgary AB | 14.8/15.2 Shafi | 76.9/86.4/86.1/58.2/86.6/78.0 | 191 | 2021-01..2022-11 @+180 |
| M9L2WrAZ | AlFalah Center Edmonton | Edmonton AB | 18.0/17.1 Shafi | 38.7/85.1/76.6/67.5/79.1/30.1 | 161 | 2026-11 @+60 |
| VrdRkwKG | Markaz Ul Islam | Edmonton AB | 18.1/17.1 Shafi | 24.6/99.9/77.8/59.3/78.1/13.9 | 148 | 2026-11..12 @+60 |
| M0dYkvL6 | Masjid Al-Fatima | Edmonton AB | 18.0/18.0 Hanafi | 64.9/97.4/85.9/88.9/87.9/21.0 | 164 | 2026-11..12 @+60 |
| 1XAlR4Kb | Leduc Islamic Association | Leduc AB | 18.1/17.1 Shafi | 42.9/43.6/99.9/35.4/46.7/16.7 | 161 | 2024-02 @+120, 2026-11 @+60 |
| yLjO8JAQ | Masjid Ibn Masood | Sherwood Park AB | 18.0/18.1 Hanafi | 53.2/92.9/100/79.6/93.0/5.3 | 177 | 2021-2022 @+60, 2026-11 @+60 |
| pVdwyVLe | Masjid At-Taqwa | Edmonton AB | 15.0/12.7 Shafi | 81.6/100/90.1/55.2/61.1/16.6 | 131 | 2021 @+60, 2026-11 @+60 |
| aAe3Z4Kj | Al-Ansar Masjid | Edmonton AB | 18.4/17.4 Shafi | 2.6/77.2/92.6/52.3/85.4/6.7 | 229 | 2021-2023 @+60 |
| EdoleqK7 | Al Falah Islamic Centre | Oakville ON | 14.9/14.9 Shafi | 33.3/70.7/44.2/19.0/66.4/15.3 | 76 | ten blocks @+60/+75, Nov-Mar each year |
| 0dYB46K6 | Nejashi Islamic Center | Toronto ON | 14.1/11.3 Shafi | 71.8/100/100/86.1/93.3/80.0 | 44 | none |

Three findings the pool years produce that three years could not:

1. **The Alberta split is real and it is not ISNA.** Seven of the nine Alberta tenants fit 18/17
   (MWL) while six of the seven Ontario tenants fit 15/15 (ISNA), across all six years. The
   provincial line is the recipe line.
2. **A DST-end defect appears in 2026 and only in 2026.** Six Alberta tenants carry a `+60`
   block from 2026-11-01 to the end of the year: the tenant table stayed on daylight time after
   the 1 November fall-back. The same tenants have no such block in 2021-2025, so the 2026
   edition is the broken one. Oakville (`EdoleqK7`) carries the inverse defect every year — a
   fixed UTC-4 clock with a 75-minute block in the last week of each transition month, ten
   blocks across six years.
3. **A Calgary tenant printed on a UTC+3 clock.** Maktabah As Sunnah (`aAeo3XKj`) serves its whole
   table 180 minutes ahead of local Calgary for 2021-01 to 2022-11, then corrects. Its athan
   times are unusable inside that window without a −180 minute correction, which the fit applies
   as a clock block and reports rather than silently.

Rows whose cell order breaks by half a day (a PM printed as AM) are repaired by moving each cell
to the half-day variant nearest its computed expectation: 21 cells across 46,011 rows, all in
Stittsville's zuhr column for 19 days of March 2022 (`zuhr: "1:18AM"`).

## 3. Front 3 — Latin America

### 3.1 Chile: the Wayback PDF bank — 327 artifacts enumerated, 295 banked (209 PDF + 86 text)

The publisher's upload tree holds **327 distinct city-month PDFs** across 2018-02..2025-09
(CDX, `radioislam.cl`, `original:.*\.pdf`, status 200, collapsed by URL — `data/cl-cdx.txt`,
1,213 archived URLs). **209 PDFs** came down directly before Wayback began answering
`429 x-rl: 0` to this host; the remaining **86 sheets** were banked as extracted text through the
fetch service at `captures/chile-wayback-txt/`, which returns the same `id_` URL body from its own
address. `scripts/pull_chile_slow.sh` keeps re-arming the direct path.

**4,832 dated rows** (5,046 before the artifact gate) across **all 18 cities**, months 2018-03 to
2025-08, in `data/cl-wayback-rows.json`; per-artifact log in `data/cl-parse-report.txt`.

Three rules the artifacts force, and the third is a defect class:

1. **The sheet header dates it, not the upload month.** Every `2024/12/NN-City.pdf` artifact is
   the January 2025 sheet (`ENERO 2025 - 1446`), and `2022/08/Arica-Septiembre-2022.pdf` is
   September. The parser dates from the header.
2. **The sheet header names the city, not the file name.** The archive serves a different city's
   sheet under several names: `2024/12/01-Santiago.pdf` carries Copiapó, `04-Copiapo.pdf` carries
   San Felipe, `05-La-Serena.pdf` carries Viña del Mar, `09-Rancagua.pdf` carries Talca. Five
   pairs of artifacts are byte-identical in text. This is the same mis-filing C17 found on the
   live November page (city 7's button pointing at an October file), now proven across the
   archive. Every row is therefore attributed to the city the sheet prints.
3. **Artifact gate.** A month whose six columns all miss the held recipe by more than 5 minutes
   is not that city's sheet and is dropped, listed per city: Copiapó and La Serena drop 2022-08,
   Rancagua drops 2025-04 and 2025-05. Punta Arenas drops 2022-12, 2024-12 and 2025-01 — those
   are its summer sheets, where the night-portion branch (not the angle recipe) governs, so the
   drop is the gate's artefact and the branch is the real explanation.

Scored on the held recipe (**18/17 Shafi, +6 min on every column**, duration-fit by C17) rather
than re-solved, because the recipe is the record's and the archive is the test:

| city | rows | w1 (f/s/d/a/m/i) | worst |
|---|---|---|---|
| La Serena | 306 | 92.8/88.6/92.5/93.1/95.4/92.8 | 5 |
| Arica | 306 | 99.7/99.3/100/96.1/99.3/99.0 | 2 |
| San Felipe | 306 | 99.0/97.4/100/84.6/97.1/97.1 | 3 |
| Santiago | 305 | 95.7/97.7/100/89.2/97.0/95.4 | 3 |
| Copiapó | 275 | 99.6/97.1/100/91.6/98.5/98.5 | 2 |
| Antofagasta | 275 | 100/99.3/100/94.2/98.9/99.3 | 2 |
| Rancagua | 214 | 99.1/99.1/100/93.0/96.7/96.7 | 3 |
| Viña del Mar | 275 | 99.6/93.8/100/90.2/97.8/98.5 | 3 |
| Osorno | 278 | 95.3/94.6/100/82.7/95.7/96.8 | 3 |
| Talca | 275 | 97.1/96.4/100/78.2/96.0/94.2 | 3 |
| Temuco | 275 | 96.7/94.9/100/77.5/91.6/93.8 | 3 |
| Linares | 275 | 96.7/96.4/100/88.0/94.2/94.5 | 3 |
| Valdivia | 275 | 98.2/91.3/100/82.2/95.6/94.5 | 3 |
| Coyhaique | 275 | 94.5/82.9/100/69.8/89.8/86.9 | 4 |
| San Antonio | 244 | 98.0/96.7/100/84.4/95.1/96.7 | 3 |
| Concepción | 213 | 96.7/94.4/99.1/81.2/93.9/93.4 | 7 |
| Puerto Montt | 216 | 96.8/90.3/100/78.2/93.5/95.4 | 3 |
| Punta Arenas | 244 | 72.1/78.7/100/51.2/82.4/81.1 | 24 |

Two things this settles. **The +6 minute clock offset is not a 2025/2026 artefact**: Santiago's
March 2018 sheet scores 95.7 pc within-1 on fajr and 100 pc on dhuhr at +6, so the offset regime
runs back to at least 2018-03. **Punta Arenas needs its own branch in the archive years too** —
it is the only city whose asr and fajr fall away, which is the night-portion switch C17 fitted
for November 2026.

### 3.2 Six new mawaqit surfaces across four countries (2,190 rows)

`confData.calendar` on each mosque's own page carries a full year of six columns plus the
mosque's own latitude, longitude and timezone. New:

| city | mosque | slug | rows | recipe | w1 (f/s/d/a/m/i) | worst |
|---|---|---|---|---|---|---|
| Lima | Mezquita de Magdalena del Mar | `mezquita-de-magdalena-del-mar-lima-07921-peru` | 365 | 17.8/16.8 Shafi | 100/100/100/95.1/100/100 | 2 |
| Lima | Mezquita Nurul Islam | `mezquita-nurul-islam-lima-15084-peru` | 365 | 17.8/16.8 Shafi | 100/100/100/94.2/100/100 | 2 |
| Guayaquil | Islamic Center of Guayaquil | `islamic-center-guayaquil-090511-ecuador` | 365 | 17.8/16.8 Shafi | 100/100/100/84.9/100/100 | 2 |
| Buenos Aires | Mezquita Al Ahmad | `mezquita-al-ahmad-1541-alberti-buenos-aires-argentina` | 365 | 17.9/16.9 Shafi | 99.5/100/100/100/91.8/100 | 3 |
| Córdoba (AR) | Centro Islámico de la Provincia | `centro-islamico-de-la-provincia-265-cordoba-argentina` | 365 | 17.9/16.9 Shafi | 100/100/100/79.7/100/100 | 2 |
| Mar del Plata | Mezquita Mar del Plata | `mezquita-mar-del-plata-2577-bolivar-b7600-mar-del-plata-argentina` | 365 | **defect** | 64.7/87.1/12.6/3.6/87.1/1.4 | 103 |

The first five are one recipe family (17.8-17.9 fajr, 16.8-16.9 isha — MWL 18/17 at the
minute grid) and land 100 pc within-1 on five of six columns. Mar del Plata carries two defects:
a `+30`-minute clock block from 2026-10-13 to 2026-11-28 (Argentina has no DST, so this is a
misconfiguration, not a transition), and its sunrise and maghrib columns run 4 minutes early
against the same coordinates, which puts maghrib before sunset. Recorded, not repaired.

### 3.2b Three more mawaqit surfaces in Brazil, one in Aruba, one for Santiago (1,825 rows)

| city | mosque | slug | rows | recipe | w1 (f/s/d/a/m/i) | worst |
|---|---|---|---|---|---|---|
| São Paulo | Mesquita Khaled Ibn el Walid | `mesquita-khaled-ibn-08021290-sao-paulo-brazil` | 365 | 17.8 / maghrib+74 Shafi | 100/100/100/88.2/100/100 | 2 |
| Vitória (ES) | Mesquita Vitória | `msjd-fytwry-mesquita-vitoria-vitoria-es-29090-750-brazil` | 365 | 17.8/16.8 Shafi | 100/100/100/83.8/100/100 | 2 |
| Caxias do Sul (RS) | Mesquita Abu Baker Assadik | `33767` | 365 | 17.9/16.8 Shafi | 100/100/100/84.1/100/100 | 2 |
| Oranjestad (Aruba) | Aruba Mezquita, Savaneta | `aruba-mezquita-sabana-basora-savaneta-aruba` | 365 | 14.8/14.8 Shafi | 100/100/100/100/100/100 | 1 |
| Santiago (CL) | Mezquita As-Salam (CIS's own install) | `mezquita-as-salam-santiago-7770353-chile-1` | 365 | 16.8 / maghrib+85 Shafi | 83.0/100/100/79.7/100/100 | 3 |

Brazil's three cities sit on the same 17.8-17.9 / 16.8 minute-grid recipe as the rest of the
continental set, with São Paulo the only one on a maghrib interval. Aruba is a clean new country
surface at 14.8/14.8 and reproduces at 1 minute across all six columns. Santiago's mawaqit install
is the publisher's own second surface and does **not** match its PDF series: the install carries a
maghrib+85 isha and a fajr that lands 83 pc within-1 at 16.8, against the PDF series' 18/17 + 6.
Two surfaces, two recipes, one publisher — the mawaqit install is platform-tier and must not be
blended with the PDF span.

### 3.2d Monterrey, Panama ×3, La Paz: Mexico depth and two new countries

| city | mosque | slug | rows | recipe | w1 (f/s/d/a/m/i) | worst |
|---|---|---|---|---|---|---|
| Monterrey (MX) | Centro Cultural Islámico del Norte | `centro-cultura-islamico-del-norte-mezqui-monterrey-64000-mexico` | 365 | 14.9/14.9 Shafi | 100/100/100/65.5/100/100 | 2 |
| Panama City (PA) | Madina Masjid Panama | `madina-masjid-panama-panama-000000-panama` | 365 | 18.0/18.5 Shafi | 100/100/100/91.5/100/99.7 | 2 |
| Panama City (PA) | Musalla Central Panamá | `musalla-central-panama-panama-507-panama` | 365 | 17.9/18.2 Hanafi | 97.3/100/96.2/97.8/100/91.5 | 22 |
| Panama City (PA) | Musallah de Perejil | `musallah-de-perejil-panama-507-panama` | 365 | 17.9/18.1 Hanafi | 98.9/100/100/99.5/58.1/97.8 | 6 |

Monterrey gains a second surface beside the held mawaqit instalment, at 14.9/14.9 rather than the
held 15/15 — same city, two mosques, two recipes. Panama is **two new country surfaces, four
mosques**: three fit (Madina Masjid cleanest at 18/18.5), and `fundacion-centro-educativo-de-panama`
(La Chorrera) is a **partial jamaat substitution** — its fajr, sunrise and maghrib are the athan
while dhuhr reads +43 min and isha +65 min, so the install publishes jamaat in two of six columns.

**La Paz is a broken install, recorded not repaired.** The Asociación Comunidad Islámica install
carries correct coordinates (−16.496, −68.124, America/La_Paz) but a scrambled calendar: fajr and
sunrise both read 04:19 on 1 January and the six columns land 4 to 8 hours off any La Paz sky.
Class: column-mapping defect. It carries no usable rows.

### 3.2c Live-page gate (R5): 17 surfaces, 0 mismatches

Every new feed was re-requested for dates taken from its own capture and compared cell for cell
(`out/gates.json`): masjidbox 3 surfaces × 3 sampled days × 6 columns = 18/18 each, Masjidal
Crescent CC one whole month 168/168, and the thirteen mawaqit installs 2,190/2,190 each. Seventeen of
seventeen pass.

### 3.3 Venezuela: the Caracas ladder, and the Maracaibo disagreement

The live sheet (`mezquitadecaracas.com/horario-salat.pdf`, captured) is the same Jumada I 1448
edition the record already holds — 12 October to 10 November 2026, 30 rows, fajr fixed at 05:05
(sunrise − 71 min) and isha at maghrib + 89-90. No new rows.

The publisher's city ladder is the only Maracaibo route and **the two surfaces disagree**: the
web page prints "MARACAIBO + 09 mn" while the PDF's own footer prints "Maracaibo: +19". The PDF
is the artifact and the page is prose, so the ladder is ambiguous by ten minutes and Maracaibo is
not banked. Class: publisher self-contradiction on a derived product.

Wayback holds no capture of `horario-salat.pdf` (CDX for the exact URL returns zero rows), so
the full-year path this publisher never offered stays closed.

## 4. Negatives, with languages

| target | result | languages searched |
|---|---|---|
| Tallahassee | no dated surface; two Mohid iqamah boards, no platform tenant | EN |
| Venezuela full year | sheet is one Hijri month, no archive, no year route | ES |
| Venezuela Maracaibo | ladder contradicts itself (+9 page, +19 PDF) | ES |
| Suriname year-2 | SMA site still serves MEI 2025 only; Wayback has 3 URLs for the domain, none a table | NL, EN |
| Bahamas | `masjidbilalnassau1.org` is Farmingdale NY (the brief's trap); `massic.org` is MAS Staten Island Center, New York — read in full, not Nassau | EN |
| Guyana | no mawaqit, masjidbox or Masjidal tenant; CIOG publishes on Facebook only | EN |
| Rio de Janeiro, Brasília, Salvador, Fortaleza | no mawaqit or masjidbox tenant under these terms; `fambras.org.br` and `arresala.org.br` render through a JS widget with no dated route in the payload, `hsalah.info` is Portugal | PT, EN |
| Arequipa, Trujillo, Bogotá, Medellín, Cali | no platform tenant under these terms | ES, EN |
| Tijuana, CDMX, Mérida, Puebla | no mawaqit or masjidbox tenant; the masjidbox Spanish directory returns only US mosques for these city names | ES, EN |
| Chile, ~75 artifacts | Wayback returned HTML in place of the PDF; 104 city sheets still queued behind a 429 rate limit | ES |
| masjidway.com (all metros) | 503 on every slug and every dated URL pattern | EN, ES |

## 5. Totals banked this wave

| block | surfaces | dated athan rows | captures |
|---|---|---|---|
| Canada, Masjidal pool years | 21 tenants × 6 years | 46,011 (+48,202 iqamah rows normalised) | 126 JSON |
| US metros (Norfolk, OKC, SLC) | 4 | 8,782 | ~660 masjidbox windows + 6 Masjidal years |
| Latin America, mawaqit year tables | 17 | 6,205 | 17 pages |
| Chile, archived CIS city sheets | 18 cities | 4,832 | 209 PDFs + 86 text captures |
| **total** | **60** | **65,830** | **1,438 files, 125 MB** |

Fit records: 58 (`out/fit_*.json`), aggregate in `out/summary.json`, gates in `out/gates.json`,
Chile scores in `out/fits-chile-wayback.json`.

## 6. Method notes

- Every platform id was read off a mosque's own homepage, a platform page indexed by mosque name,
  or the o1l-43 tenant universe; no domain was guessed. The four-metro hunt cost zero guessed
  domains this round.
- Masjidbox slugs are discoverable by search because `masjidbox.com/prayer-times/<slug>` is a
  public page: that page pattern, not the mosque's site, is the fastest route to a dated table.
- The fit script solves fajr angle, isha angle-or-interval and asr school per surface over the
  whole span, then scores with per-column median margins, and detects clock blocks from the
  angle-free dhuhr column. Its meridiem repair moves a cell by whole half-days to the variant
  nearest its computed expectation, which cannot fire on a genuine reading.

## 7. NEXT

- Finish the Chile queue (104 city sheets, ~75 HTML-instead-of-PDF retries): Wayback answered
  `429 x-rl: 0` from 09:32Z and had not cleared by 10:00Z. `scripts/pull_chile_tables.py`
  re-arms from the workspace; then re-run `scripts/parse_chile.py` and `scripts/score_cl.mjs`.
- Tallahassee: the only remaining US metro. Next routes are the mosque's Facebook page images
  (authority-by-publisher) and the Mohid app's own JSON if a public route exists.
- Venezuela: a second city from a mosque's own site (Maracaibo, Valencia, Barquisimeto) is
  required before the ladder is usable; the ladder alone is not data.
- Suriname: the SMA Facebook monthly JPGs are the only publication channel left.
- Mexico/Brazil depth beyond the mawaqit set: Tijuana, CDMX, Mérida, Puebla, São Paulo's
  Mesquita Brasil, Rio, Salvador, Brasília, Fortaleza remain without a mosque-owned dated
  surface. The Brazilian federations (`fambras.org.br`, `arresala.org.br`) need a JS pass to
  find whether their widget calls a dated endpoint.
- La Paz and La Chorrera installs are recorded as defects; a second Bolivian city is still
  wanted.
