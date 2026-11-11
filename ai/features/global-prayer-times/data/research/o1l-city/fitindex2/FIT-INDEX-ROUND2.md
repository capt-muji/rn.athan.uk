# FIT-INDEX ROUND 2: every recipe the O1l city-level round produced

Machine-readable companion: `FIT-INDEX-ROUND2.json` (same entries, same wording). Built 2026-11-11 by the round-2 registry agent from the fit deliverables themselves, the CONSOLIDATION blocks, the corrections register and the world-table diff. Recipes are transcribed as the fits and the blocks state them; nothing is re-derived here and nothing is adjudicated. The O1k index is the schema template.

Reconciliation: every entry that the corrections register (`corrections/CORRECTIONS-ROUND.md`, A 77 / B 34 / C 56 / D 32 / F 17) or the world-table diff (`wtdiff2/WORLD-TABLE-DIFF-ROUND2.md`, the 56 grade and span movements) touches carries the register or diff reference in its `register` field. Entries are the fit objects, not the rows: one entry per fitted surface or surface family, exactly as O1k counted them.

## Counts

| Measure | Value |
|---|---|
| Entries | 154 |
| Countries and territories touched | 111 |
| Platform and matrix pools (ZZ, not a country) | 1 |
| Grade A | 31 |
| Grade A-candidate | 1 |
| Grade A eligible | 1 |
| Grade measured | 1 |
| Grade provisional | 52 |
| Grade community | 32 |
| Grade candidate | 36 |
| Entries carrying a conflict note | 36 |
| Entries carrying a flag | 16 |
| Span verdict yes | 42 |
| Span verdict frozen-recomputed | 1 |
| Span verdict frozen-reprint | 14 |
| Span verdict no | 6 |
| Span verdict untestable-single-year | 66 |
| Span verdict untestable-short-sample | 20 |
| Span verdict untestable-single-template | 5 |

## The grading rule applied

Owner ruling T-667 #6943 and the O1k frozen-generation precedent, unchanged. **A** needs two to three distinct fitted years on one recipe. **provisional** is one published cycle or one year. **community** is a fitted non-authority surface. **candidate** is dated data with no fit. **F** is structurally closed and **FALLBACK** no surface. Grade and tier are independent. Three classes the round's blocks wrote outside the six-class vocabulary are carried as written and counted separately, never converted: **A-candidate** (Thailand, leap block cannot separate its years), **measured** (China, an authority grid that is not a publisher object) and **A eligible** (Tanzania). Byte-identical relabelled editions are one computed generation and never lift provisional to A.

## Method

Engine: adhan 4.4.6 at `census/adhan-build/node_modules/adhan`, `Rounding.None`, timezone pinned per country, dates built from literal capture strings, second resolution then explicit per-column rounding. Exceptions are stated in the entry: the independent NOAA routine (Pakistan charts), the PrayTimes-v2 family check (Indonesia, masjidi.app), and the publisher-side `prayTimes.js` (Kazakhstan). Scores are days, cells or delegations as each entry states. Where a block printed only a percentage, the entry carries the percentage and no invented denominator.

Span verdict vocabulary: **yes**, **no**, **frozen-recomputed**, **frozen-reprint**, **untestable-single-year**, **untestable-single-template**, **untestable-short-sample**.

In the region tables a recipe field appears only where the block states one, in the order fajr, isha, asr, dhuhr, maghrib, sunrise, margins, rounding, special. A missing field is not stated in the block; it is never filled from another source.

## Integrity note: the fitter bug

`const isha` followed by `+= 1440` silently drops any year containing one after-midnight isha (register A53, rule-form D9, `o1l-city/us-unresolved/`). The same bug is present in the US-states copy. The fitter-bug audit had NOT landed when this index closed: `o1l-city/flags2/` held only `data/quetta-asr-rows.json` and `fit/quetta-asr.mjs`, and `o1l-city/integrity2/` held `scan.json` and `_md5.txt` only. Every multi-year score in this index that came from that fitter therefore carries an integrity flag on its entry (`US-33-METROS`, `MASJIDAL-216-POOL`, and the dpt sample), and no year count here is certified by the audit. When the audit lands, its findings attach to these ids.

## What the round's grades say

**A, 31 entries.** One recipe, two to three or more distinct fitted years.

- North Africa: TN-INM-258-DELEGATIONS, TN-INM-FLAT2026, MA-HABOUS-190-CITIES, DZ-MINISTRY-1447-1448, EG-ESA-78-CITIES
- West Africa: NG-MWL-NATIONAL-LINE
- Central, East and Southern Africa, Indian Ocean: RW-RMC-KIGALI
- Europe: Nordics, Baltics, Benelux and Central: IS-NINE-CITIES, GI-FOUR-YEARS
- Europe: Russia: RU-DUMRT-44, RU-UFA-ALMANAC
- Middle East: SA-43-GOVERNORATES, SA-CENTURY-1318-1500H, SA-TEN-CITIES-1448-1449, OM-SEVEN-CITIES-2021-2031, AE-SEVEN-EMIRATES, TR-81-PROVINCES, TR-DISTRICTS-144
- Central Asia: KZ-49-YEAR-SPAN, KZ-SEVEN-CITIES, KG-THREE-CITIES
- South Asia: IN-EIGHT-CITY-MOSAIC
- Southeast Asia: ID-KEMENAG-38, ID-KHGT-38, MY-PENANG-PANTAI-ACHEH, MY-MELAKA-1447
- North America: US-33-METROS
- Central America and the Caribbean: MX-GUADALAJARA
- South America: BR-IIB-25, CO-CARTAGENA
- Matrices and platforms: MASJIDAL-216-POOL

**The headline finds the grade rule caps, and why.** Thailand's 77 provinces hold one recipe across two year-blocks but the leap block cannot separate 2024 from 2028, so the block's own A-candidate class is carried. China's 29 capitals are an authority grid measured, not a publisher object, so the class is measured. New Zealand's twenty-year pair, Fiji's twelve sheets, the Maldives' forward years and Germany's 2027 mirror are all frozen reprints: identical generations supply no distinct year-2. Australia's 218 grid points sit on one year. India's eight cities are A-grade community inside a community row, and Brazil is community tier carrying a two-year note, the convention the diff asks the close to rule.

**No entry in this index regresses on a new measurement.** Every cap is a frozen generation, a single year, or a dated constant: Cyprus north keeps provisional because its 2025 edition needs one, and Russia's DUM RB keeps provisional because its regime change is dated 2025.

## Reconciliation: the 56 movements

Every grade or span movement in the register's table C is carried by an entry, or named as having none. Register tables A, B and D are carried per entry in its `register` field; a correction (A) or a new row (B) that produced no fit has no entry and is not counted here, and a rule-form (D) rides inside the recipe of the entry that measured it.

| # | Object | Entry |
|---|---|---|
| C1 | Thailand | TH-77-PROVINCES |
| C2 | India | IN-EIGHT-CITY-MOSAIC |
| C3 | China | CN-29-CAPITALS |
| C4 | Mexico | MX-GUADALAJARA; MX-MONTERREY |
| C5 | Brazil | BR-IIB-25 |
| C6 | Colombia | CO-CARTAGENA |
| C7 | Peru | PE-LIMA |
| C8 | Tanzania | TZ-ARUSHA |
| C9 | Uganda | UG-ENTEBBE |
| C10 | Central African Republic | CF-BANGUI |
| C11 | Western Sahara | EH-LAAYOUNE-DAKHLA |
| C12 | Madagascar | MG-THREE-MOSQUES |
| C13 | Guinea-Bissau | GW-BISSAU |
| C14 | Japan | JP-KOBE |
| C15 | Korea | KR-THREE-CITY-YEARS |
| C16 | Tonga | TO-NIUTOUA |
| C17 | Malta | MT-THREE-SURFACES |
| C18 | Andorra, Liechtenstein, San Marino | AD-ANDORRA; LI-VADUZ; SM-BADR |
| C19 | Algeria | DZ-MINISTRY-1447-1448 |
| C20 | Kazakhstan | KZ-49-YEAR-SPAN; KZ-SEVEN-CITIES |
| C21 | Oman | OM-SEVEN-CITIES-2021-2031 |
| C22 | Saudi Arabia | SA-43-GOVERNORATES; SA-CENTURY-1318-1500H; SA-TEN-CITIES-1448-1449 |
| C23 | United Arab Emirates | AE-SEVEN-EMIRATES |
| C24 | Turkey | TR-81-PROVINCES; TR-DISTRICTS-144 |
| C25 | Morocco | MA-HABOUS-190-CITIES |
| C26 | Egypt | EG-ESA-78-CITIES |
| C27 | Tunisia | TN-INM-258-DELEGATIONS; TN-INM-FLAT2026 |
| C28 | Indonesia | ID-KEMENAG-38; ID-KHGT-38 |
| C29 | Germany (EU-Diyanet) | DE-24-CITIES; DE-DISTRICT-1241 |
| C30 | Russia (DUM RB) | RU-DUMRB-63; RU-CDUM-MOSCOW |
| C31 | Russia (DUM RT) | RU-DUMRT-44 |
| C32 | United States | US-33-METROS; US-OMAHA-REGIME |
| C33 | Australia | AU-218-GRID |
| C34 | New Zealand | NZ-FIANZ-20-YEAR-PAIR |
| C35 | Fiji | FJ-TWELVE-SHEETS |
| C36 | New Caledonia | NC-NOUMEA |
| C37 | Pakistan | PK-KARACHI-CHART; PK-MULTAN-CHART; PK-PESHAWAR-CHART; PK-QUETTA-CHART |
| C38 | Bosnia and Herzegovina | BA-61-CITIES |
| C39 | Malaysia | MY-PERAK-SEVEN-ZONES; MY-PENANG-PANTAI-ACHEH; MY-MELAKA-1447; MY-NEGERI-SEMBILAN |
| C40 | Mauritius | MU-MAURITIUS |
| C41 | Cyprus (north) | CY-NORTH-2025-2026 |
| C42 | Kuwait | KW-CAPITAL-2026 |
| C43 | Iraq | IQ-BAGHDAD-DIWAN; IQ-BAGHDAD-MAWAQIT |
| C44 | Bangladesh | BD-BOLURA-BAND; BD-DHAKA-FOUR |
| C45 | Maldives | MV-FIVE-ISLANDS |
| C46 | Brunei | BN-MORA-2026 |
| C47 | Austria | AT-IGGOE |
| C48 | Switzerland | no entry: undecidable, no dated rows |
| C49 | Ireland | IE-IFI-26-CITIES |
| C50 | Finland | FI-JYVASKYLA-TURKU-TAMPERE |
| C51 | Iceland | IS-NINE-CITIES |
| C52 | Norway | NO-TEN-CITIES |
| C53 | Denmark | DK-FOUR-CITIES |
| C54 | Jordan | JO-REGIONAL-MARGINS |
| C55 | United Kingdom | GB-SCOTLAND-14; GB-LONDON-9-BOROUGHS; GB-ENGLAND-6-TOWNS; GB-WALES-CARDIFF; GB-BELFAST; GB-SECOND-LAYER |
| C56 | dpt and masjidal pool | MASJIDAL-216-POOL |

## North Africa

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / other) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| TN-INM-258-DELEGATIONS | Tunisia INM delegation sweep, 258 of 259 delegations | authority | 7 y, 5,144 season + 2,469 other rows | 18.1 deg / 18.1 deg / Shafi / +7 min / +2 min / per-site DEM horizon dip 0.0316*sqrt(m) - 0.0999 deg, R2 0.980 | 92.7 pc all-five within1 with the dip, 58.3 pc without; 158/258 delegations at 95 pc+ | yes | A |
| TN-INM-FLAT2026 | Kairouan and Sidi Bouzid 20 delegations, the dated July split | authority | 1 window, 129 d | 18.1 deg / 18.1 deg / Shafi / +7 min / +2 min / DEM dip set to 0 for the window (rule form TN-INM-FLAT2026) | 100/100 July rows within1; 129-day 2026 replay 100 pc within1 | yes | A |
| MA-HABOUS-190-CITIES | Morocco 190 cities x 2 months (October and November 2026) | authority | 2 months, 69,540 cells | national set, per-city spread 2-9 s / national set, per-city spread 2-9 s / Shafi +0.33 / +5.00 min (UTC+0, sd 0.29) / -3.13 min / +3.80 min / per-city horizon term 5.85-17.54 min, corr 0.87 with elevation, DEM bands 6.56-13.96 | 99.94 pc within1 with the term; 173/190 cities perfect; fajr/dhuhr/isha 100 pc, asr 99.8, sunrise 39.2, maghrib 47.6 | yes | A |
| DZ-MINISTRY-1447-1448 | Algeria ministry books, Alger / Adrar / Djelfa 1447 plus the 1448 holdout | authority | 2 Hijri y, 884 + 1,074 rows | frozen per-wilaya recipe at own coordinates / 16.10 with +5 winter, 17.00 with 0 ceil summer (the same printed curve) / Shafi / seasonal angle-margin swap, rule form D5 | Alger 97.4 / Adrar 100 / Djelfa 98.6 pc within1; 1448 holdout 1,074/1,074 at worst 1 | frozen-recomputed | A |
| DZ-CONSTANTINE-1447 | Constantine directorate Ramadan-1447 table | authority | 29 d | as the wilaya book / as the wilaya book / Shafi / +5 min / the 'imsak' column is SUNRISE under an imsak header | 174/174 within1 | untestable-short-sample | provisional |
| EG-ESA-78-CITIES | Egyptian General Authority of Survey, 78 of 82 city options, full 2026 | authority | 1 y, 28,468 rows | 19.5 deg / 17.5 deg / Shafi, nearest / zero on all six | 28,468/28,468 all six within1; 48.5 pc all-six exact; dhuhr 96.0, asr 68.9 exact | yes | A |

## West Africa

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / other) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| NG-MWL-NATIONAL-LINE | Nigeria mosque-configured MWL line: Kaduna 6 mosques, Abuja, Benin City, Enugu, Osogbo, Suleja, Ile-Ife | community | 1-2 y, 1,749 rows | 18.0 deg / 17.0 deg / Shafi / zero | Osogbo 365/365 + 34/34 zero margins; Suleja 98 pc; Kaduna 98.9-100 pc | yes | A |
| NG-MASJIDWAY-EGYPT-DEFAULT | masjidway platform default, four Nigerian regions | platform | 1 y, 552+ rows | 19.5 deg / 17.5 deg / Shafi | 98.9-100 pc within1 across four regions | frozen-reprint | provisional |
| NG-ILE-IFE-OFFZONE | Ile-Ife masjidbox table, whole table on UTC | community | 1 y, 399 rows | 18.0 deg / 17.0 deg / Shafi / zero / off-zone: values are UTC | MWL 18/17 exact in UTC; the local clock is 60 min early all year | yes | provisional |
| GH-KUMASI-ACCRA | Kumasi Central, Accra GhanaMasjid layer, Tamale MATW | community | 1 month, 90 rows | not stated in the block / not stated in the block / not stated | Kumasi Central 180/180; the Accra directory layer is a platform wrapper, never mosque-entered | untestable-short-sample | candidate |
| TG-LOME | Lome, Al-I'tisam mosque | community | 1 y, 365 rows | 17.9 deg / 17.1 deg / Shafi | 2,102/2,190 within1; fajr amplitude 24 min | untestable-single-year | provisional |
| BJ-SAVALOU | Savalou, the country's first table outside Cotonou | community | 1 y, 365 rows | 14.9 deg / 15.1 deg / Shafi | 2,016/2,190 within1 | untestable-single-year | provisional |
| CI-KORHOGO | Korhogo, the country's first athan-class table | community | 1 y, 365 rows | 17.9 deg / 17.1 deg / Shafi | 2,005/2,190 within1 | untestable-single-year | provisional |
| CI-ABIDJAN-BOARDS | Abidjan mosques on mawaqit, hand-set jama'ah boards | community | 1 y, 2,555 rows | not stated in the block / not stated / fixed clock 12:45-13:30 / hand-set boards with fixed dhuhr and asr clocks | boards, not computed tables; the fixed dhuhr clocks confirm COSIM's convention | untestable-single-year | candidate |
| SL-FREETOWN-ANSAAR | Freetown, Masjid Al Ansaar | community | 1 y, 365 rows | 17.65 deg / 16.9 deg / Shafi | 2,149/2,190 within1 | untestable-single-year | provisional |
| GM-YUNDUM-KOINA | Old Yundum and Koina, Greater Banjul's first mosque athan tables | community | 1 y, 730 rows | 17.9 deg / 17.1 deg / Shafi | two 365-row surfaces on one pair; Old Yundum fajr amplitude 48 min | untestable-single-year | provisional |
| BF-OUAGA-DUBAI | Ouagadougou, the Dubai mosque | community | 1 y, 365 rows | as served / as served / Shafi | 2,190/2,190 within1, the cleanest surface of the wave | untestable-single-year | provisional |
| BF-MSBF-TEMPLATE | MSBF template across Kanazoe and ten Yaar mosques | community | 2 editions, 122 d | 17.6 deg / a 5-minute block walk / Shafi block / a clock block / 1447 prints fajr five minutes later on every day | fajr 31/31 exact in both editions; maghrib 31/31 within1 (18/31 exact) | frozen-reprint | provisional |
| SN-CERFI-9-CITIES | CERFI, Dakar plus eight second cities | community | 1 edition, 9 cities | sunrise - 75.5 (the two-dawn 15 convention) / maghrib + 60 / Shafi +2 | both conventions hold on all nine cities; 7 rows each | untestable-short-sample | community |
| ML-SEGOU | Segou, a second Malian line beside Bamako | community | 1 y, 365 rows | 15 deg / 15 deg / transit +14 / sunset +0 | 15/15 pair, dhuhr +14, maghrib sunset; differs from Bamako's 19/17 | untestable-single-year | community |
| ET-JIJIGA-JAAMUUQ | Jijiga and Jaamuuq | community | 1 y, 730 rows | 18.00 deg exact / 18.38 / 18.45 deg / Shafi | fajr 18.00 exact; isha 18.38 and 18.45 on the two surfaces | untestable-single-year | community |
| UG-ENTEBBE | Entebbe | community | 1 y, 365 rows | 15 deg / 15 deg / Shafi / clean, zero | clean 15/15 | untestable-single-year | provisional |

## Central, East and Southern Africa, Indian Ocean

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / other) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| TD-NDJAMENA | N'Djamena, mosque table plus its 12-page PDF | community | 1 y, 365 rows | 18.0 deg / 17.0 deg / Shafi / zero | MWL 18/17 exact on all six; the PDF matches 365/365 | untestable-single-year | provisional |
| CM-NGAOUNDERE | Ngaoundere, three mosque pages, one table | community | 1 y, 365 rows | 18.00 deg / 17.00 deg / Shafi / +3 min | every column within1; three mosque pages carry one byte-identical table | untestable-single-year | provisional |
| CM-ARRAHMA-ADAMAWA | Ar-Rahma page, computed at the Adamawa point | community | 1 y, 365 rows | sun-tracking / sun-tracking / sun-tracking / all six columns sun-tracking | all six columns sun-tracking; no angular recipe | untestable-single-year | candidate |
| CG-BRAZZAVILLE | Brazzaville, the country's first table | community | 1 y, 365 rows | 12.3 deg / 18.19 deg / Shafi / dhuhr prints 60 min after its own solar noon while sunrise and sunset are exact | fajr 12.3 / isha 18.19; dhuhr carries an internal one-hour inconsistency | untestable-single-year | candidate |
| GQ-MALABO | Malabo, the country's first row | community | 1 y, 365 rows | 18.0 deg / 17.0 deg / Shafi / zero | MWL exact on all six | untestable-single-year | community |
| GA-PORT-GENTIL | Port-Gentil, beside the held Libreville surfaces | community | 1 y, 365 rows | 18.0 deg / 17.0 deg / Shafi / zero | MWL exact | untestable-single-year | community |
| CD-GOMA-TWO-MOSQUES | Goma, Taqwa and Daaru-ssalaam | community | 1 y, 730 rows | 18.0 (Taqwa) / 19.50 (Daaru-ssalaam) / 17.0 / 17.50 / Shafi | Taqwa MWL exact; Daaru-ssalaam 19.50/17.50 exact 365/365, a new angle pair | untestable-single-year | community |
| CF-BANGUI | Bangui, lifted out of FALLBACK | community | 1 y, 365 rows | 15 deg / 15 deg / Shafi / zero / fixed 12:00 jama'ah clock | 365/365 within1 on ISNA 15/15; dhuhr is a fixed 12:00 clock | untestable-single-year | provisional |
| RW-RMC-KIGALI | Rwanda Muslim Community monthly timetable images (Kigali and the Northern Province), plus Tawkit's 11 cities | authority | 2 y, 121 + 330 rows | 18.0 deg / 17.0 deg / Shafi / zero | fajr 91/91 exact, 121/121 within1 across two years | yes | A |
| BI-TAWKIT-6 | tawkit.net, six Burundian cities | platform | 1 cycle, 180 rows | 18.0 deg / 17.0 deg / Shafi / +0.5 min | 180/180 within1 | untestable-short-sample | provisional |
| AM-TAWKIT-18 | tawkit.net, eighteen Armenian cities | platform | 1 cycle, 540 rows | 18.0 deg / 17.0 deg / Shafi / as served | 540/540 within1 | untestable-short-sample | provisional |
| EH-LAAYOUNE-DAKHLA | Laayoune and Dakhla, horaire-de-priere.ma | community | 2 months, 60 rows | 19 deg / 17 deg / Shafi / 0 / -3 / +5 / +1 / +4 / 0 | 30/30 within1 on the six-margin set | untestable-short-sample | candidate |
| MG-THREE-MOSQUES | Three Malagasy mosques | community | 1 y, 1,095 rows | as served / as served / Shafi | three surfaces, 1,095 rows; no single recipe stated | untestable-single-year | candidate |
| GW-BISSAU | Bissau | community | 1 y, 365 rows | as served / as served / Shafi | 365 rows; no recipe stated in the block | untestable-single-year | candidate |
| TZ-ARUSHA | Arusha, salaahtimes API, 2025-2027 | platform | 3 y, 1,095 rows | 18.0 deg / 18.0 deg / Shafi / transit +5 / sunset +3 | 365/365 all six within1 in each of three years; fajr amplitude 7 min | yes | A eligible |
| MU-MAURITIUS | Mauritius 2026 year (span ledger) | community | 1 y, 365 rows | as the held object / as the held object / Shafi | full 2026 year fitted; year-2 structurally negative (the same 365 rows re-ship per year) | frozen-reprint | community |

## Europe: British Isles

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / other) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| GB-SCOTLAND-14 | Fourteen new dated Scottish surfaces: Glasgow AFECC dpt + three mawaqit mosques, Paisley, Edinburgh x3, Falkirk, Perth, Stirling, Dundee-Tayside, Kilmarnock, Livingston, Inverness, Motherwell, East Kilbride | community | 1 y, 4,000+ rows | 15.4-18.1 deg by surface / 15.0-15.5 deg by surface / Shafi / Paisley and Edinburgh carry own prints; Livingston 18.1 fajr at 100 pc within1 | per-surface named pairs; Livingston 18.1 fajr 100 pc within1 | untestable-single-year | community |
| GB-LONDON-9-BOROUGHS | Nine new London borough surfaces: Brent x3, Newham x2, Camden x2, Kensington and Chelsea, Hackney Valide | community | 1 y, 9 surfaces | 15.x family on most; Hackney Valide 12.3 / 18.2 at Hackney Valide / Shafi | one 15.x table within a minute; Hackney Valide 12.3/18.2 a distinct pair | untestable-single-year | community |
| GB-ENGLAND-6-TOWNS | Six one-month towns lifted to years: Luton, Leicester, Middlesbrough, Ilford, Birmingham, Watford | community | 1 y, 2,196 rows | 12.2 (Luton) / 15.0 (Leicester) / 15.5 (Ilford) / 12.5 (Birmingham) / 12.0 / 12.7 / 15.0 / 14.5 / Shafi / Luton 12.2/12.0 is a new pair with no cap | six year surfaces; Luton a new pair, Birmingham's 12.5/14.5 unstable, Stockport rejected | untestable-single-year | community |
| GB-WALES-CARDIFF | Cardiff, fifteen mosques, second Welsh layer | community | 1 y, 15 surfaces | 15.0 deg / 15.5 deg / Shafi | 13 of 15 mosques on one 15.0/15.5 pair | untestable-single-year | community |
| GB-BELFAST | Belfast, the first Northern Irish year surface | community | 1 y, 365 rows | 15.6 deg / 14.9 deg / Shafi / ISNA fajr refuted | 15.6/14.9; the ISNA fajr reading is refuted | untestable-single-year | community |
| GB-SECOND-LAYER | England's second layer: Plymouth, Lincoln, Bath, Bristol x3, York, Norwich, Portsmouth | community | 1 y, 3,000+ rows | 13.5-18.0 by surface / 10.9-15.0 by surface / Shafi / Portsmouth is an LUPT adopter on a 2016 print | per-surface pairs; Portsmouth the fourth LUPT adopter, on the 2016 PDF | untestable-single-year | community |
| IE-IFI-26-CITIES | Islamic Foundation of Ireland annual city PDFs, 26 cities | authority | 1 y, 9,459 rows | winter 16.2 deg, horizon -1.26 both ends / winter 15.2 deg; summer capped maghrib +90 for 30-43 days / Shafi / noon +2.00 / summer fajr UNMODELLED | winter twilights rms 1.75; summer isha capped maghrib+90; summer fajr unmodelled | untestable-single-year | provisional |

## Europe: Nordics, Baltics, Benelux and Central

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / other) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| DE-24-CITIES | EU-Diyanet portal, 24 cities, full 2026 | authority | 1 y, 6,570 rows | 18.0 deg / band 15.8-16.3 (16 exact) / Shafi shadow-1 / +5.5 floor / -6.5 / +6.5 / domestic temkin; amplitude fajr 144-166, isha 256-284 | dhuhr +5.5 floor exact 290-333/365; fajr 18.0 exact 128-148/182 winter days, 182/182 within1; isha zero at 15.0/16.5/17.0 | frozen-reprint | provisional |
| DE-DISTRICT-1241 | German portal district layer, all 1,241 district ids | authority | 1 y, 452,965 district-days | 18.0 deg / 16.5 excluded at 1,102/1,102 / Shafi, temkin latitude-dependent (+3 at 49 districts, +3.5 at 35, +6.5 at five northern) / +5.5 floor / -6.5 floor / coordinate refinement, not a per-district table | dhuhr +5.5 floor 1,102/1,102; fajr 18.0 182/182 within1; winter residual never exceeds 2 min over 4,222 same-state pairs | untestable-single-year | provisional |
| FI-JYVASKYLA-TURKU-TAMPERE | Jyvaskyla, Turku and Tampere; Oulu corrected | community | 1-2 y, 1,083 rows | 18.0 deg (Jyvaskyla); about 15 on Turku/Tampere / 17.0; about 12 on Turku/Tampere / Shafi | Jyvaskyla 18/17 exact on 353 rows; Turku and Tampere a measured 15/12 line | yes | candidate |
| SE-SEVEN-CITIES | Sweden, seven cities on the Islamic Federation line | community | 1 y, 2,555 rows | 18.0 deg / 16.0 deg / Shafi / -6.5 / +5.5 / +6 | 18/16 exact on angle-honest days; temkin -6.5/+5.5/+6 | untestable-single-year | candidate |
| NO-TEN-CITIES | Norway, ten cities: IRN line, mawaqeet line, polar placeholders | community | 1 y, 3,650 rows | 16 deg (IRN) / 18 deg (mawaqeet) / 15 deg / 15 deg / Shafi, seasonal school switch (D6) / polar placeholders sized 15/36, 37/58, 40/62 days | IRN 16/15 exact on angle-honest days; mawaqeet 18/15 at five; placeholders sized per city | untestable-single-year | candidate |
| DK-FOUR-CITIES | Aarhus, Odense, Aalborg, Esbjerg, a fourth Danish line | community | 1 y, 1,460 rows | as served / as served / Shafi | exact at all four cities | untestable-single-year | candidate |
| LT-KLAIPEDA | Klaipeda, 2026-2027 Diyanet | authority | 2 y, 730 rows | 18.0 deg / 16.0 deg / Shafi / temkin | 18/16 exact across both years | yes | candidate |
| IS-NINE-CITIES | Iceland, nine cities on the Felag Muslima line | community | 1 y, 3,285 rows | 14.2 deg with the angle-derived night portion / 14.0 deg / Shafi | 14.2/14.0 exact at all nine cities | yes | A |
| CY-NORTH-2025-2026 | KKTC 2025 and 2026 editions | authority | 2 editions, 730 rows | 2026 recipe / 2026 recipe / Shafi / 2025 needs a -2.5 min constant; with it 552/552 within1 | 552/552 within1 with the -2.5 constant; the 2025 edition fails as-is (mean -2.42) | no | provisional |
| GI-FOUR-YEARS | Ibrahim-al-Ibrahim, 2011 / 2014 / 2026 / 2027 | community | 4 y, 1,460 rows | 18.1 deg / 16.9 deg / Shafi / -1 min | 341-345 exact per year across four editions | yes | A |
| MT-THREE-SURFACES | Birkirkara, Bilal and Paola (masjidway) | community | 1-2 y, 1,460 rows | 18 deg (Birkirkara, behind a fixed 05:13 floor for 213 days) / 18 (Bilal) / 17.9 (Paola) / 17 / 16.9 / Shafi | three surfaces; Paola 17.9/16.9 fits 2025 AND 2026, the country's only year-pair | yes | candidate |
| AD-ANDORRA | Centre Cultural Islamic, mawaqit | community | 1 y, 365 rows | 18.1 deg / 16.9 deg / Shafi / -1 min | 365/365 within1 | untestable-single-year | candidate |
| LI-VADUZ | IGMG Vaduz plus the IGFL line | community | 1 y, 396 rows | 18.0 deg / 17.0 deg / Shafi / temkin / the summer block leaves the angles, not a fixed fraction, so the form cannot be told | 18/17 + temkin; IGFL line identical to the minute | untestable-single-year | candidate |
| SM-BADR | Associazione Badr | community | 1 y, 365 rows | 14.9 deg / 15.1 deg / Shafi / zero | 14.9/15.1 zero margins | untestable-single-year | candidate |

## Europe: Iberia and the Balkans

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / other) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| FR-LYON-LILLE-MARSEILLE | Lyon two mosques, Lille Grande Mosquee, Marseille two mosques | community | 1 y, 1,460 rows | 14.42 (Lyon GMP and Attawba) / 12.51 (Lille) / 13.03 and 12.92 (Marseille) / 13.54 / 13.47 / 12.66 / 13.02 and 12.84 / Shafi / seasonal sweeps | Lyon GMP all six 258/365; Lille 42/365; Marseille 730 rows | untestable-single-year | community |
| IT-ROME-MILAN | Rome, Milan, Turin, Bologna | community | 1 month-1 y, 1,125 rows | 19.02 (Rome) / 18 (Milan, Bologna) / 15 (Turin) / maghrib +90 (Rome) / 17 / 15 / Shafi | Rome fajr 19.02 30/30, isha maghrib+90 exact, all six 30/30; the rest five of six at zero margin | untestable-short-sample | community |
| ES-FIVE-CITIES | Granada two mosques, Barcelona, Valencia, Sevilla twice | community | 1 y, 1,200+ rows | 18.0 deg on four surfaces; Granada 18/18 on one / 17.0 deg / Shafi / +3 on one Granada surface | Valencia 339/365, Barcelona 280/365, Sevilla 265 and 170 | untestable-single-year | community |
| ES-2024-POSTERS | Spain 2024 posters recovered from the WordPress upload tree | community | 1 y, 184 rows | as the posters / as the posters / Shafi | 96.8 pc within1 on 184 rows | untestable-single-year | candidate |
| PT-LISBOA-COIMBRA-PORTO | Lisboa and Coimbra monthly sheets, Porto annual and monthly | community | 2 editions, 90 rows | 18 deg / 12 deg +3 / Shafi +0.5 / +5.5 / +3.5 / Porto monthly asr +39 to +54 against its own annual | Lisboa and Coimbra monthly delta 0; Porto monthly asr +39..+54 against its own annual | yes | community |
| AT-IGGOE | IGGOe line against the IZW tables | community | 1 y, 245 rows | 18.0 deg / 16.0 deg / Shafi / temkin + Istanbul takdir | isha sync 245/245 within1; fajr drift mean 12.8 min earlier, worst 29 in August | no | provisional |
| BA-61-CITIES | Bosnia, 61 cities on the Rijaset tables | authority | 1 y, 22,265 city-days | 18.0 deg + scalar k per city / 16.0 deg - k / Shafi / -5.5 / +5.5 / +0.5 / one Sarajevo-anchored generation redistributed 4 min/degree longitude (mean error 0.31) | 71.5 pc within1, 35.2 pc exact; seven tables exact constant shifts | frozen-reprint | provisional |
| RS-NOVI-PAZAR-BELGRADE | Novi Pazar 2025, Belgrade, Nis | community | 1 y, 540 rows | 19.6 deg (Novi Pazar) / 17.8 deg / Shafi | Novi Pazar 19.6/17.8 at 46.4 pc within1; Belgrade 180/180, Nis 176/180 months | untestable-single-year | candidate |
| HR-ZAGREB-RIJEKA-SPLIT | Zagreb, Rijeka, Split | community | 1 y, 540 months-rows | as served / as served / Shafi | Zagreb 172/180, Rijeka 170/180, Split 164/180 months | untestable-single-year | candidate |
| ME-ONE-TABLE-SIX-SHIFTS | Montenegro, six PDFs | authority | 1 y, 2,190 rows | one table plus {-4,-2,0,+1,+3,+5} min / same shifts / Shafi / the stated 19.5/17.5 scores 35.3 pc; fajr seasonal swing about 11.5 min | cell-exact on one table plus six shifts; the stated pair scores 35.3 pc | frozen-reprint | provisional |
| MK-SKOPJE-TWO-SURFACES | Skopje on bfi.mk and vaktija.eu | community | 1 y, 344 rows | two surfaces +45 min apart / as each surface / Shafi | vaktija.eu 164/180 months; bfi.mk a 1-day accrual; the two disagree +45 min on fajr | no | candidate |
| AL-SHKODRA-TIRANA | Shkodra and Tirana | community | 1 y, 360 rows | as served / as served / Shafi | Shkodra 162/180, Tirana 149/180 months; KMSH client-rendered negative | untestable-single-year | candidate |

## Europe: Russia

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / other) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| RU-CDUM-MOSCOW | CDUM Moscow and the CDUM settlement set | authority | 1 y, 365 rows | 18.0 deg / 17.0 deg / Shafi / near 2 min | 95.5 pc within1 at the true position; the 2026 sunrise defect reaches -68 min | untestable-single-year | provisional |
| RU-DUMRB-63 | DUM RB, 63 settlements, 2025 and 2026 | authority | 2 y, 34,886 rows | 16 deg / 15 deg / Hanafi / the free-angle fit was degenerate; replaced by level identification | 2026 fajr median 16.05, within1 98.9 pc; 2025's fajr fits NO single angle (18.6 pc) | no | provisional |
| RU-DUMRT-44 | DUM RT, 44 cities | authority | 1 y, 32,120 rows | as the C23 recipe / as the C23 recipe / Hanafi | 32,120 rows, zero gaps; 43 of 44 CSVs byte-identical to C23 | yes | A |
| RU-UFA-ALMANAC | Ufa, the twelve-sheet Hijri-1448 almanac plus three 1446 sheets | authority | 2 Hijri y, 442 rows | sunrise - 100 / maghrib + 90 / Hanafi of the date plus ten days / sunset + 4 / max(13:30, noon + 5) / suhur = fajr - 20; fixed-interval recipe, not angular | cell-exact 90.8 pc | yes | A |

## Middle East

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / other) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| SA-43-GOVERNORATES | Saudi Arabia, 43 governorate points, 1448 and 1449 | authority | 2 Hijri y, 30,487 city-days | 18.5 deg floor +1 / maghrib + 90, +120 on every Ramadan day / Shafi floor +1 / floor raw / prayers = floor(raw + 1 min), arithmetically ceil-of-raw (D13); the Ramadan interval is exactly two values (D14) | exact 81.9-87.7 pc, within1 99.8-100 pc, MAE 0.123-0.182; free fajr fits 18.44-18.50 | yes | A |
| SA-CENTURY-1318-1500H | Makkah and Medina across 1318H-1500H | authority | 7 Hijri y, 6,379 rows, 183-year span | 18.5 deg floor +1 / maghrib + 90, +120 in Ramadan / Shafi floor +1 / floor raw | 6,379 rows at 100 pc within1; zero regime changes | yes | A |
| SA-TEN-CITIES-1448-1449 | Abha, Tabuk, Dammam, Taif, Buraidah, Hail and four more, 1448 + 1449 | authority | 2 Hijri y, 7,090 city-days | 18.5 floor +1 / maghrib +90 / +120 in Ramadan / Shafi floor +1 | 99.8-100 pc within1; 13 cells of 42,540 sit 2 min out on six publisher edge days | yes | A |
| OM-SEVEN-CITIES-2021-2031 | Oman, seven cities, 2021-2031 | authority | 11 y, 28,105 city-days | 18.0 deg, NEAREST / 18.0 deg, nearest / Shafi +5 ceil / +5 ceil / +5 ceil / the competing reading is 17.8/18.15 with +5 ceil; the split is the ROUNDING MODE | 18/18 nearest 100 pc within1 everywhere; 17.8/18.15 ceil holds except asr at six second cities (98.8-99.6 pc) | yes | A |
| AE-SEVEN-EMIRATES | UAE federal AWQAF feed, all seven emirates, 60 areas | authority | 2 y, 30,960 area-days | 18.2 deg / 18.2 deg / Shafi / the angle pair is ridge-degenerate (D15) | exact 55.9-83.2 pc, within1 89.7-100 pc; frozen (within1 moves 0.4 pt between years); fajr amplitude 78-84 min | yes | A |
| KW-CAPITAL-2026 | Kuwait capital, full 2026 | authority | 1 y, 365 rows | 18.0 deg / 17.5 deg / Shafi / dhuhr and asr now measured | 18/17.5 at 99.8 pc within1 | untestable-single-year | provisional |
| JO-REGIONAL-MARGINS | Jordan, Amman group plus Irbid and Aqaba | authority | 1 y, 1,095 rows | as the national set / as the national set / Shafi / Irbid and Aqaba carry own sets; Zarqa sits in Amman's group | Irbid and Aqaba 100 pc on their own sets; Aqaba 66.7 pc on Amman's | yes | provisional |
| IQ-BAGHDAD-DIWAN | Baghdad, the Diwan al-Waqf table | authority | 1 y, 365 rows | 18.1 deg +1 / 16.9 deg +1 / Shafi / zero on the rest | 18.1+1 / 16.9+1 at 100 pc within1 | untestable-single-year | provisional |
| IQ-BAGHDAD-MAWAQIT | Baghdad, mawaqit Jami al-Hasanayn, second surface | community | 1 y, 366 rows | 18.08 deg / 16.93 deg / Shafi | drifts +4.6 dhuhr / +2.8 asr / +2.5 maghrib against the Diwan | untestable-single-year | community |
| IL-JERUSALEM-AWQAF | Jerusalem, the Awqaf perpetual print plus 78 live days | authority | 1 y, 366 rows | 18.0 deg / 18.0 deg / Shafi / -3 / +6 / floor / fixed UTC+3 re-proved including winter; the print matches the live site at +60 min | 94.8 pc within1, worst 4; MAE 0.485; dhuhr floor 92.3 pc exact; fajr amplitude 111 min | frozen-reprint | provisional |
| IL-PS-CITY-OFFSET | The Awqaf city layer: 23 cities at published offsets from Jerusalem | authority | 1 y, 23 cities | the Jerusalem print / the Jerusalem print / Shafi / each payload is the Awqaf print PLUS that city's published offset (0/+1/+2 on the mawaqit pages, 0 to +4 on the print's page 2); iqama is own-config | each payload = print + that city's offset; 13 payloads, 26 pages | yes | provisional |
| TR-81-PROVINCES | Turkey, all 81 provinces, full 2026 | authority | 1 y, 29,565 rows | 18.0 deg / 17.0 deg / Shafi, nearest / -7 / +5 / +4 / temkin +7 on isha; residual rises monotonically with latitude | within1 95.2-99.4 pc, MAE 0.361-0.482, worst 2; 98.5 pc at 36-37 N, 95.6 pc at 42 N; no deviating province | yes | A |
| TR-DISTRICTS-144 | Turkey, 144 district tables across 8 provinces | authority | 1 y, 55,480 rows | the province recipe at the district point / same / Shafi / a coordinate refinement, not a different recipe (D11) | 315,360 cells 97.35 pc within1, MAE 0.425, worst 3; difference-space residual 0.264 min median (141/144 under 0.5) | yes | A |
| IR-TEHRAN-30 | Tehran, a 30-row table | community | 1 month, 30 rows | not stated / not stated / not stated | 95/149 cells; the table is NOT claimed against the record's closure | untestable-short-sample | candidate |

## Central Asia

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / other) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| KZ-49-YEAR-SPAN | Kazakhstan muftyat.kz, Astana across 49 years | authority | 49 y, 8 Astana years 2,921 rows | 15.0 deg (ISNA) / 15.0 deg with TwilightAngle / Hanafi / set A (sunrise -3, dhuhr/asr/maghrib +3) below 48 N, set B (-5/+5) at or above / the 48 N switch is a hard switch 0.001 deg wide (D10) | 100 pc within1 across the 49-year span; 99.7-100 pc on the sampled years; no trend | yes | A |
| KZ-SEVEN-CITIES | Aktobe, Atyrau, Kostanay, Pavlodar, Ust-Kamenogorsk, Taraz, Turkistan, 2025-2027 | authority | 3 y, 7,665 rows | 15.0 deg / 15.0 deg / Hanafi / set A/B per the 48 N line | exact 83-92 pc, 100 pc within1 on all seven | yes | A |
| KG-THREE-CITIES | Karakol, Naryn, Jalal-Abad | authority | 1 y, 1,095 rows | 18.0 deg floor / maghrib + round(7/9 x (sunrise - fajr) + 3.5) / Hanafi ceil +1 / sunset +7 | ratio rule 98.9-99.5 pc within1 on all three | yes | A |
| UZ-FOUR-CITIES | Bukhara, Nukus, Fergana, Andijan | authority | 1 month, 120 rows | 15.5 deg / 15.5 deg / Hanafi / sunset +4 / the record's '+5 display margins' is refuted | six columns 30/30 exact | untestable-short-sample | provisional |
| TJ-KHUJAND-WINDOW | Khujand window rows | authority | 1 window, 40 rows | as the national table / as the national table / Shafi / window exactly 40 min | the maghrib window is exactly 40 min | untestable-short-sample | candidate |
| AZ-BAKU-TWO-LINES | Baku, mawaqit mosque and nam.az | community | 1 y, 731 rows | 16.0 (mawaqit) / 18.0 (nam.az) / 15.0 / 17.0 / Hanafi / Shafi / margin 12-17 on the mawaqit line | nam.az MWL 18/17 Shafi 100 pc; mawaqit 16/15 Hanafi with a 12-17 min maghrib margin | yes | community |

## South Asia

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / other) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| PK-KARACHI-CHART | Karachi, perpetual city chart | community | 1 template, 366 d | 18.4 deg / 18.0 deg / Hanafi +3.5 / solar noon / sunset | 18.4/18.0 Hanafi, maghrib sunset, zuhr solar noon, asr +3.5 | untestable-single-template | provisional |
| PK-MULTAN-CHART | Multan, perpetual city chart | community | 1 template, 366 d | 18.0 deg / 18.0 deg / Hanafi +2 / fajr -0.5, sunrise -1.5, zuhr +0.5, asr +2, maghrib +1.6, isha +0.6 | 18/18 Hanafi with six frozen margins; the federal dhuhr clock hits 6/366 | untestable-single-template | provisional |
| PK-PESHAWAR-CHART | Peshawar, 19-column rolling Urdu chart | community | 1 template, 366 chart rows | 18.0 deg / 18.0 deg +1 / Hanafi / sunset +1 / column 2 is fajr MINUS 5 and column 16 is the maghrib WINDOW LENGTH (D25) | fajr 366/366 within1, sunrise 362, dhuhr 366, asr 358, maghrib 359, isha 361; all-six 348/366 (95.1 pc) | untestable-single-template | provisional |
| PK-QUETTA-CHART | Quetta, 8-column flat chart | community | 1 template, 365 d | 18.2 deg / 18.0 deg +2 / Hanafi (does not reproduce) / +1 / sunset +2 | fajr 68.5 pc within1, sunrise 89.3, dhuhr 99.7, maghrib 85.2, isha 70.2; asr does not reproduce | untestable-single-template | provisional |
| IN-EIGHT-CITY-MOSAIC | India's measured mosaic: Hyderabad, Mumbai, Bengaluru, Kolkata, Srinagar, Ramban, Moradabad, Baharampur | community | 1 y, 13,140 rows | 18.0 deg on seven cities / 17.0 or 18.0 by city / Shafi on six, Hanafi on Bengaluru and Moradabad / three variants: 18/17 Shafi, 18/18 Hanafi, 18/17 Hanafi | Hyderabad 18/17 Shafi 730 rows at 356/365 exact; Mumbai 2,190 rows; Bengaluru the null hypothesis as a dated table | yes | A |
| BD-BOLURA-BAND | Sylhet Bolura, the IFB band artifact found online | community | 1 y, 365 rows | 19.25 deg / 18.65 deg / Hanafi (Shafi off 58 min) / fixed 13:10 clock / sunset +3 / 68 date-bands (42 of 5 days, 12 of 4, 7 of 7), the quantization cap by construction (D20) | 45 pc within1 on both twilights; fajr amplitude 97 min | untestable-single-year | provisional |
| BD-DHAKA-FOUR | Dhaka, four mawaqit mosques | community | 1 y, 1,460 rows | 15.00 deg exact / ceiling by mosque / Hanafi / sunset / each mosque pins its own zuhr clock (12:50/13:00/13:15/13:30) and a fajr floor or isha ceiling | fajr 15.00 exact at all four; maghrib sunset; Hanafi asr | untestable-single-year | community |
| MV-FIVE-ISLANDS | Five more Maldivian islands beside the held set | authority | 1 y, 1,080 cells | 20 deg (MABIMS) / 18 deg / Shafi / the fixed integer set | 1,080/1,080 within1 of MABIMS 20/18; one recipe across 7.6 deg of latitude | frozen-reprint | provisional |
| LK-NOVEMBER-WATCH | Sri Lanka zones, November watch plus Trincomalee and Galle | community | 1 y, zones | as the zone table / as the zone table / Shafi | zone 12 sub-minute; Kandy Aruppola is ACJU zone 07 at 150/150 cells; Kollupitiya an independent witness 1-2 min off | untestable-single-year | community |
| NP-KATHMANDU-30 | Kathmandu, a 30-row table | community | 1 month, 30 rows | not stated / not stated / not stated | 99.3 pc within1 | untestable-short-sample | candidate |
| BN-MORA-2026 | Brunei MORA 2026 | authority | 1 y, 365 rows | 20 deg / 18 deg / Shafi / transit +1 | 95.1 / 86.8 pc exact, 99.2 pc within1 | untestable-single-year | provisional |

## Southeast Asia

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / other) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| TH-77-PROVINCES | Thailand, 77 CICOT provincial workbooks | authority | 2 year-blocks, 56,286 rows | 19.8 deg / 18.1 deg / Shafi / ZERO on all six / ceil on sunrise/dhuhr/asr/maghrib, half-up on fajr/isha | 166,433/166,434 within1 in 2026; 166,885/166,896 in the leap block; parameters frozen across both | frozen-reprint | A-candidate |
| ID-KEMENAG-38 | Kemenag SIHAT, 38 provincial capitals | authority | 1 y, 13,870 rows | 20 deg +2 floor / 18 deg +2 floor / Shafi +2 / +3 / -3 / +3 / horizon dip 1.76*sqrt(h) arcmin on sunrise and maghrib (D3) | fajr 20+2 floor 99.6 pc exact, isha 18+2 floor 99.4 pc; within1 100 pc, worst 1 | yes | A |
| ID-KHGT-38 | Muhammadiyah KHGT, 38 provincial capitals, 2026 and 2027 | authority | 2 y, 27,740 rows | 18.0 deg floor +1..2 / 18.0 deg floor +1..2 / Shafi / subuh +8.0 min median against Kemenag on all 38 cities, band [7..9] | within1 100 pc every city-year; subuh +8.0 min median against Kemenag | frozen-reprint | A |
| ID-JADWALSHOLAT-643 | jadwalsholat.org, 643 kab/kota | community | 1 y, 34,648 rows | 20 deg +2 / 18 deg +2 / Shafi / Kemenag's 20/18 plus a uniform +2 but with Kemenag's elevation dip OMITTED | Kemenag line with the dip omitted; fajr -8.0 min against KHGT at 38/38 cities | frozen-reprint | community |
| ID-PERSIS-NU-LINES | Persis and NU Online stated methods | community | stated only, no dated series | -20 deg (Persis, no absolute elevation correction); 20 deg (NU) / 18 deg (NU) / Shafi / NU: elevation applied, NO ihtiyati, round-up; a third line inside the 20-deg family | Persis reproduces one day to the minute; NU publishes a method, no table | untestable-short-sample | candidate |
| MY-PERAK-SEVEN-ZONES | Perak, seven zones | authority | 1 y, 2,555 rows | 18.0 deg / 18.0 deg / Shafi / zohor +1.5 only / the census +2 ihtiyati margins score 0 exact; zon7 Bukit Larut carries an elevation term (terbit -5.9, maghrib +5.6) | Recipe B (18/18, zohor +1.5) carries all seven zones within1; census +2 scores 0 exact | yes | provisional |
| MY-PENANG-PANTAI-ACHEH | Penang, mufti 1448H grid | authority | 2 y, 354 rows | one frozen recipe at Pantai Acheh / same / Shafi | one frozen recipe at Pantai Acheh across 354 rows | yes | A |
| MY-MELAKA-1447 | Melaka, 1447H takwim | authority | 1 Hijri y, 355 rows (spans two Gregorian years) | as the takwim / as the takwim / Shafi / zohor +1.5 | zohor +1.5 on 342/355 rows | yes | A |
| MY-KELANTAN-1446 | Kelantan zon 1 and 2 (Majlis Daerah Jeli), Ramadan 1446 / 2025 | authority | 1 month, 29 d | 18 deg (subuh) / 17 deg (isyak) / Hanafi / imsak = subuh - 10 on all 58 zone-days; a dated change fajr 19 -> 18 from 24 April 2020 | subuh and isha 27/29 exact, 29/29 within1; imsak = subuh-10 on 58/58 zone-days; Hanafi asr 0/29 | yes | provisional |
| MY-NEGERI-SEMBILAN | Negeri Sembilan, NGS01 and NGS02 | authority | 1 y, 730 rows | 18.0 deg / 18.0 deg / Shafi / zohor +1.5 | 730 rows; the census +2 margins are refuted a third time | untestable-single-year | provisional |

## East Asia

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / other) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| CN-29-CAPITALS | China, 29 provincial capitals on the national grid | authority | 1 y, 4,176 city-days | 15.0 deg / 15.0-15.1 deg / Hanafi / the grid is measurably a 2004 computation: 2026 drifts fajr +0.34 to +0.82 | fajr mean -0.01..+0.10 (rms 0.29-0.47), isha +0.04..+0.13, noon/asr/sunset within 0.15; 18/17 refuted (+13.8..+21.5) | untestable-single-year | measured |
| CN-ISLAMICHINA-28 | islamichina.com, 28 capitals x 2026 | platform | 1 y, 10,220 rows | 18.0 deg / 17.0 deg / Shafi / sunset +1 | measured 18/17 Shafi, maghrib sunset +1 | untestable-single-year | community |
| CN-GUANGZHOU-RAMADAN | Guangzhou, 30 dated Ramadan-1448 rows (cheen.cn) | community | 1 month, 30 rows | 18.2 deg, imsak = fajr - 10 / as served / Shafi / iftar = sunset + 4.25 | imsak = fajr 18.2 -10 (MAE 1.28); iftar sunset +4.25 | untestable-short-sample | candidate |
| JP-KOBE | Kobe Mosque, 366 dated rows plus 2025 PDFs | authority | 2 editions, 366 rows | 18.0 deg / 17.0 deg / Shafi +1 / +1 solar / its Maghrib column is the IQAMA | all-six 322/365 within1 | frozen-reprint | provisional |
| JP-KYOTO | Kyoto, Ramadan-1447 image calendar | community | 1 month, 30 rows | 18.0 deg / 17.0 deg / Shafi / zero | 18/17 zero margins, 29/30 exact | untestable-short-sample | candidate |
| JP-TOKYO | Tokyo, masjidbox tenant | community | 7 rows | as served / as served / Shafi / -7 / +5 / +7/8 | reproduces the held Tokyo margins exactly (sunrise -7, dhuhr +5, asr +5, maghrib +7/8) | untestable-short-sample | candidate |
| KR-THREE-CITY-YEARS | Daegu, Seoul Masjid Noor, Yangju Gatbawi | community | 1 y, 1,095 rows | 18.0 deg (Daegu, Seoul, Yangju) / 18.0 (Daegu, Seoul) / 17.0 (Yangju) / Hanafi / zero | 365/365 within1 at each of the three | untestable-single-year | provisional |

## North America

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / other) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| US-33-METROS | 33 of 64 US metros dated, 41 surfaces | community | 3 y, 33,513 rows | 15 deg at 26 of 37 verdict surfaces / 15 deg / Shafi mostly / 31 of 37 in the 15-family (84 pc); 5 at 18 deg (14 pc); one hand-edited | 26 of 37 plain ISNA 15/15 (70 pc), 31 in the 15-family (84 pc), 5 at 18 deg; three-year angle movement <=0.10 deg on 24 clean surfaces | yes | A |
| US-OMAHA-REGIME | Omaha ICOM, the dated 2026 change | community | 2 y, 730 rows | 15 deg (2025) then 18.47 (2026) / a fixed isha interval from 2026 / Shafi | 15/15 to 18.47 plus a fixed isha interval, dated 2026 | no | community |

## Central America and the Caribbean

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / other) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| MX-GUADALAJARA | Guadalajara, Isa Ibn Maryam (masjidbox) | community | 2 y, 385 rows | 18.0 deg / 17.0 deg / Shafi / zero | MWL 18/17 within1, worst 1, across 14 months | yes | A |
| MX-MONTERREY | Monterrey, mawaqit | community | 1 y, 365 rows | 15 deg / 15 deg / Shafi / literal, zero | literal 15/15 | untestable-single-year | provisional |
| CU-HAVANA | Havana, mawaqit Abdallah, the country's only mosque | community | 1 y, 365 rows | 15-21 deg sweep / 15 deg +12 / Shafi / +3 | 353/365 exact | untestable-single-year | community |
| DO-SANTO-DOMINGO | Santo Domingo, masjidbox | community | 7 rows | as served / as served / Shafi | 7 rows, no fit | untestable-short-sample | candidate |
| PR-SANJUAN-PONCE | San Juan and Ponce | community | 1 y, 730 rows | 18.0 deg / 17.0 deg / Shafi / plain MWL | plain MWL 18/17 on both | untestable-single-year | community |
| HT-PORTAUPRINCE | Port-au-Prince | community | 1 y, 365 rows | 18 deg +10 / as served / Shafi +5 floored 15:30 / transit +15 / the asr floor binds 101 days | fajr 18+10, dhuhr transit+15, asr Shafi+5 floored 15:30 (binds 101 days) | untestable-single-year | community |
| BB-BRIDGETOWN | Bridgetown, masjidbox | community | 7 rows | as served / as served / Shafi | 7 rows, no fit | untestable-short-sample | candidate |
| BZ-BELIZE-CITY | Belize City | community | 1 y, 365 rows | 15 deg / 15 deg / Shafi / ISNA | ISNA 15/15 | untestable-single-year | community |
| PA-PANAMA-CITY | Panama City | community | 1 y, 365 rows | 18.0 deg / 18.5 deg / Shafi / sunset +6 | 18/18.5, maghrib sunset +6 | untestable-single-year | community |
| CR-SAN-JOSE | San Jose, two surfaces | community | 1 y, 365 rows | 18.0 deg / 17.0 deg / Shafi / +7 (one surface +8) | MWL 18/17 with maghrib +7; mawaqit surface 1,788/1,825 within1 | untestable-single-year | community |
| SV-SAN-SALVADOR | San Salvador, two tables | community | 1 y, 730 rows | 18.0 deg / 17.0 deg / Shafi / MWL | MWL 18/17; the two tables agree within 1 all year | yes | community |
| TT-ILMUL-ISLAM | Trinidad, Ilmul Islam plus Darul Uloom and the Chaguanas defect | community | 1 y, 365 rows | 15 deg / 15 deg / Shafi | Ilmul Islam 15/15 provisional; the Chaguanas -1h defect is STILL LIVE | untestable-single-year | provisional |
| JM-SPANISH-TOWN | Jamaica Islamic Centre, Spanish Town | community | 1 today-row | 18.0 deg / 17.0 deg / Shafi / MWL | MWL 18/17 within1 on one day; both decoys avoided | untestable-short-sample | candidate |

## South America

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / other) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| BR-IIB-25 | Brazil, 25 IIB cities, 2025 and 2026 | community | 2 y, 3,000 rows | 18.0 deg / 17.0 deg / Shafi / zero | 18,000 cells 99.7 pc within1, worst 2 | yes | A |
| CO-CARTAGENA | Cartagena, masjidbox | community | 2 y, 385 rows | 18.0 deg / 17.0 deg / Shafi / MWL | MWL 18/17 within1 across 14 months | yes | A |
| PE-LIMA | Lima, the suite run | community | 1 y, 365 rows | 18.0 deg / 17.0 deg / Shafi / +3 | 365/365 within1 | untestable-single-year | provisional |
| EC-QUITO | Quito, mawaqit | community | 1 y, 365 rows | 18.0 deg / 17.0 deg / Shafi / MWL anchored | MWL 18/17 anchored | untestable-single-year | provisional |
| BO-SANTA-CRUZ | Santa Cruz, mawaqit | community | 1 y, 365 rows | 18.0 deg / 17.0 deg / Shafi / the sun columns are unreproducible at any South American coordinate | fajr/isha 18/17 but the sun columns reproduce at no South American coordinate | untestable-single-year | candidate |
| CL-2016-ERA | Chile 2016 era, 18 PDFs | authority | 1 y, 558 rows | one recipe across 34.9 deg latitude / same / Shafi / -0.4 (no clock offset) | one recipe across 34.9 deg of latitude at 97-100 pc within1 | yes | provisional |
| CL-2025-WORKBOOK | Chile 2025 workbook | authority | 1 y, 365 rows | as 2016 plus a +6 clock offset / same / Shafi / +6 on every column | +6 on every column against the 2016 era | no | provisional |

## Oceania

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / other) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| AU-218-GRID | Australia, 218 Diyanet grid points | authority | 1 y, 79,570 rows | 18.0 deg / 17.0 deg / Shafi / temkin / Geelong also fits 18/18 + maghrib +3 on its own mawaqit year | one recipe within 2 min on all 365 days at all 218 points | untestable-single-year | candidate |
| NZ-FIANZ-20-YEAR-PAIR | FIANZ Ramadan pairs, 1427 (2006) and 1447 (2026) | community | 2 editions, 555 rows | 18.0 (Auckland, Hamilton) / 16.0 (Wellington, Christchurch, Dunedin) / 17.0 (Tauranga) / 18.0 / 15.0 / 17.0 / Shafi; +1h15 double shadow in 2006, +40 min in 2026 / one engine, zero drift over twenty years | the pairs are identical; one engine, zero drift over twenty years | frozen-reprint | candidate |
| FJ-TWELVE-SHEETS | Fiji, twelve 2024 sheets on the live FML page | community | 1 y, 365 rows | 18.0 deg / maghrib +75 exact March to September / Shafi / transit +5 to +6 / sunset +3 / isha is an interval table, not an angle (D18) | 365/365 within1 on five columns; isha the maghrib+75 interval | frozen-reprint | provisional |
| NC-NOUMEA | Noumea, mawaqit | community | 1 y, 365 rows | 18.0 deg / 19:45 floor for 243 days, then 7-day blocks tracking sunset +85 / hand block / hand block / sunset +5 / a Ramadan taraweeh override at 20:15; an iqama layer is held | fajr 18, sunset+5, isha 19:45 floor at exactly 243 days; dhuhr and asr hand blocks | untestable-single-year | candidate |
| TO-NIUTOUA | Masjid Al-Taiyab Niutoua, mawaqit | community | 1 y, 365 rows | 18.0 deg / 17.0 deg / Shafi / MWL / floor | five columns 365/365 within1; asr +-2 is a platform artefact | untestable-single-year | provisional |
| PF-TAHITI | Tahiti, masjidway month | platform | 1 month, 30 rows | 18.0 deg / 17.0 deg / Shafi / sunset +4 | 18/17, maghrib sunset +4; the tenant is unclaimed | untestable-short-sample | candidate |

## Matrices and platforms

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / other) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| CAPITALS-198 | The world capital matrix: 198 of 202 covered (195 with Delhi accepted for New Delhi) | platform | 1 cycle, 30-365 rows per capital | per capital / per capital / Shafi / eight reproduce within1 on fajr+isha; three publish a snapped dhuhr; two publish a point contradicting the city; four are interval tables | eight reproduce within1 on fajr+isha (Praia 98.9/97.3, Damascus 97/87.7, Asmara 94/95.9); Skopje's snapped dhuhr 3.6 pc; Yaounde 25.2 deg off, Moroni 1.03 | untestable-short-sample | provisional |
| MASJIDI-167-TABLES | masjidi.app, 167 distinct regional tables serving 468 table tenants | platform | 1 template per table, 366 rows | per-country family (Saudi 18.42, Jordan 15.04, Egypt 19.54, Oman 18.53, Morocco 19.51, Algeria 18.31, Syria 18.19, Indonesia 19.40, Malaysia 17.89) / per-country family; Saudi maghrib +90 (25/25), Germany maghrib +90 / Shafi everywhere (fitted factor 0.97-1.08, never near 2.0) / a THIRD engine: precise ephemeris, sun evaluated once per day at 0h UT, per-region rise-set margin 0.1-3.6 min, integer output, no DST steps | 167/167 fit at median 0.54 min RMS and median 93 pc within1; per-country families 62-98 pc | untestable-single-template | community |
| MASJIDAL-216-POOL | masjidal.com, 216 tenants, an 18-tenant x 3-year sample | platform | 3 y, 19,728 athan rows | per tenant / per tenant / Shafi mostly / seven tenants reproduce at zero margins; twelve hold parameters within 0.03 deg over 2024-2026 | 19,728 athan + 19,728 iqamah rows; seven tenants zero margins 100 pc; twelve within 0.03 deg over three years; suite 9/18 strict | yes | A |

## Flags carried, not adjudicated

| Flag | Item | Entry | State in this index |
|---|---|---|---|
| A53 / D9 | fitter bug | MASJIDAL-216-POOL | any multi-year score from that fitter has one fewer year than it reports; this pool's year count is not certified by the audit |
| A53 / D9 | fitter bug | US-33-METROS | const isha then += 1440 drops any year containing one after-midnight isha; PRESENT IN THE US-STATES COPY TOO; every year-scored US fit is suspect until re-run |
| D27 | e-Solat year parameter | MY-PERAK-SEVEN-ZONES | HTTP 200 with the year parameter silently ignored (payload opens 01-Jan-2026) |
| D6 | IRN asr school switch | NO-TEN-CITIES | asr is SHAFI in CEST and HANAFI in CET, switching on the DST dates; a builder needs two asr entries with a DST trigger |
| F1 | Oman parameterization | OM-SEVEN-CITIES-2021-2031 | RIDGE DEGENERATE, BOTH CARRY: 18/18 nearest and 17.8/18.15 ceil both fit; 0.08 deg reference uncertainty outweighs the 0.2 deg in dispute |
| F10 | Malta absent from both record files | MT-THREE-SURFACES | the wtdiff must add the row, not edit one |
| F11 | Kelantan split void | MY-KELANTAN-1446 | answered in part: a later month (Ramadan 1446) was found and transcribed; the banked 18/17 holds; the record's KTN01/KTN02 void stands untouched |
| F12 | Benin / Kandi | BJ-SAVALOU | no register block carried Benin; this post-cut surface is the country's first dated table outside Cotonou, so the close reads it before writing the row |
| F13 | Mauritius | MU-MAURITIUS | no O1l block carries a Mauritius measurement; the span ledger holds it at SINGLE-CYCLE with a structurally negative year-2 |
| F14 | masjidi.app engine | MASJIDI-167-TABLES | CLOSED by O1l-59: the 6.2-8.1 min solar-gate failure is an artefact of the fixed 0.833-deg horizon; freed, 167/167 fit at 0.54 min RMS |
| F15 | Iran, Tehran | IR-TEHRAN-30 | a 30-row table exists (95/149) but is NOT claimed against the record's closure; the closure stands untouched |
| F2 | Quetta asr | PK-QUETTA-CHART | does not reproduce: monthly mean residual -3.9 (Jan) to +5.5 (May), a smooth annual swing with zero crossings in March and September; cause not named |
| F3 | Macedonia fajr | MK-SKOPJE-TWO-SURFACES | bfi.mk and vaktija.eu disagree by +45 min on fajr; both surfaces stay on the record, flagged, not adjudicated |
| F4 | Portugal, Porto | PT-LISBOA-COIMBRA-PORTO | the monthly sheet's asr runs +39 to +54 against its own annual; convention versus error unresolved |
| F5 | India isha line | IN-EIGHT-CITY-MOSAIC | isha 17 sits 4-5 min EARLIER than 18 in every city and season while the other four columns are identical; flagged for the fit index, not adjudicated |
| F8 | Capitals count | CAPITALS-198 | 194 of 202, or 195 with Delhi accepted for New Delhi; then 198 of 202 after capitals3 |

The register's remaining flags are resolved or carried elsewhere: F6 (the 366/365 row count) in the Peshawar conflict, F7 (the 15/15 denominators) in the US entry's 26-of-37 reading, F9 (the Cameroon relabel) in the Cameroon conflict, F16 (blocks unreturned) in the in-flight section, and F17 (platform traps) in the conflict table and here: goldenmosque.org is Rochdale UK, arresala and fambras are Sao Paulo, masjidway 9631 is Hyderabad, Cairo's Awqaf site has no prayer-times section, and Monaco's 'monaco' slug is Beausoleil, France.
## Conflicts

Conflicts are carried, never resolved here. The three that need arbitration at the close (Pakistan's chart anchor, Indonesia's two national lines, Niger's grade) are inherited from O1k; the round adds the Oman parameterization (closed degenerate, both carry), the Quetta asr, Macedonia's +45-minute fajr split, Porto's convention sheet, the India isha line and the two Indonesia publisher lines.

| Entry | Parties or readings | State |
|---|---|---|
| TN-INM-258-DELEGATIONS | record: 20 Kairouan/Sidi Bouzid tables print a July angle near 17.3 | a dated split (2025-12-15..2026-01-15) where those delegations drop the DEM dip at unchanged 18.1/18.1; carried as TN-INM-FLAT2026 |
| MA-HABOUS-190-CITIES | O1k-M1 held a -1.42 asr shift | does not reproduce: asr is 99.8 pc within1 at +0.33; the rebuild's change is the horizon term |
| EG-ESA-78-CITIES | 13 cities failed the fit at gazetteer points | all 13 pass 100 pc at their table's own implied point, a 17-61 km coordinate disagreement, never recipe error |
| NG-MWL-NATIONAL-LINE | v3 held Egyptian 19.5/17.5 as a regional line | it is masjidway's platform default; every mosque-configured table is MWL 18/17 exact (the v3 reversal stands) |
| TG-LOME | Zossime read as a second Togolese surface | a fixed board, a trap; not a table |
| BJ-SAVALOU | the O1k Cotonou candidate | withdrawn; this is Savalou, 14.9/15.1, not Cotonou |
| CI-ABIDJAN-BOARDS | fallback-sweep counts 7 Abidjan mosques, westafrica2 nine | two blocks, two surface counts on one city; carried, not reconciled |
| GM-YUNDUM-KOINA | King Fahd's Gambia site | a static theme demo: maghrib 19:27 against a 18:39 sunset; not a surface |
| ML-SEGOU | Bamako Al Madina held 19.0/17.0 | Segou is a second Malian line at 15/15; two lines in one country |
| CM-NGAOUNDERE | v3 Cameroon row: Ar-Rahma 'Douala', all six columns sun-tracking | that page computes at 7.3668/12.3533 (Adamawa), not Douala; the anchor is mislabelled |
| CF-BANGUI | central-africa block read Bangui's dhuhr as a defect (15/365 exact, worst +17) | fallback-sweep fits it as a fixed 12:00 jama'ah clock at 365/365; both readings carried |
| TZ-ARUSHA | the platform's 'Mwanza' row read as Tanzanian | it is Malawi's; a mislabel, not a second Tanzanian line |
| DE-24-CITIES | DITIB's 18/17 prose | the served table is 18/16 plus temkin; isha about 7.2 min off Berlin winter |
| FI-JYVASKYLA-TURKU-TAMPERE | Oulu held as its own surface with a stated IRN 16/15 + 1/3 night | Oulu's 365 rows are TURKU'S TABLE relabelled; the statement is provenance only |
| SE-SEVEN-CITIES | Kiruna read as its own surface | it publishes UMEA's row; excluded and flagged |
| PT-LISBOA-COIMBRA-PORTO | the monthly Porto sheet read as the same rule as the annual | it is a CONVENTION SHEET; carried, not adjudicated |
| BA-61-CITIES | the record held a 611 m elevation rung in the temkin ladder | REFUTED: temkin -5.5 for 57 of 61 cities from 82 m to 1,050 m, corr(residual,elev) +0.21 |
| ME-ONE-TABLE-SIX-SHIFTS | v3: 'the declared 19.5/17.5 is nearly exact' | a winter/summer cancellation artifact: fajr seasonal swing about 11.5 min (winter +4.05, summer -7.43) |
| RU-CDUM-MOSCOW | the record quoted C23's margins | those were computed 0.163 deg west of the published position |
| SA-43-GOVERNORATES | the endpoint was assumed to carry a city/cityId axis | coordinate-only: city, cityId, id and name all return one byte-identical default payload |
| OM-SEVEN-CITIES-2021-2031 | deep2 amendment 17.8/18.15 +5 ceil | drops to 87-99 pc on the six new cities; both readings carried |
| AE-SEVEN-EMIRATES | adhan 4.4.6's Dubai preset taken as the Dubai recipe | the preset BAKES asr +3 and runs 2.77 min late against Dubai's own 1,794 rows (0.0 pc exact); asr margin 0 confirmed |
| IQ-BAGHDAD-DIWAN | a city axis was assumed | none exists: Basra sits 13.7 min out at Baghdad's recipe |
| IQ-BAGHDAD-MAWAQIT | the Diwan's zero margins read as the only Baghdad reading | this surface drifts +4.6 dhuhr / +2.8 asr / +2.5 maghrib against it; a diff, not a recipe |
| KZ-49-YEAR-SPAN | a publisher change suspected across the span | no publisher change: the served prayTimes.js reproduces 2026 365/365 |
| UZ-FOUR-CITIES | v3: display margins +5 (Ishroq +20, Shom +4) | REFUTED: 15.5/15.5 Hanafi, six columns 30/30 exact, maghrib sunset +4 |
| TJ-KHUJAND-WINDOW | a single Tajik fajr constant | naming one would be false to within a quarter of an hour; the O1k verdict stands |
| PK-PESHAWAR-CHART | the same block counted at 366 and 365 rows | both right on their own denominator: 366 chart rows, 365 dated |
| MV-FIVE-ISLANDS | 2027/2031/2036 read as forward years | they do not differ at all; no span exists |
| ID-KEMENAG-38 | Kemenag and Muhammadiyah read as one Indonesia recipe | two national lines: Kemenag 20/18 +2 and KHGT 18/18 +1, 7.7-8.0 min apart for fajr every year; ship both |
| CN-29-CAPITALS | v3: China FALLBACK, the 18/17 form-label line | 18/17 refuted at all 29 capitals; 15/15 Hanafi confirmed |
| JP-KOBE | v3: 'Kobe Mosque has NO official website' | kobemosque.com is the official site and warns against the fakes |
| TT-ILMUL-ISLAM | the profile timezone trusted | the tz LIES America/New_York (the value flips before the label); the -1h defect is still live after the slug moved |
| JM-SPANISH-TOWN | the capital matrix records Kingston JM as a negative (solar gate 481 min) | capitals3 later covers Kingston via athanpro 30 rows at 150/150 and reads the JIC row as the same body |
| CL-2016-ERA | one span assumed | regime boundary DATED: 2016 carries no clock offset (sunrise -0.4), the 2025 workbook +6 on every column |
| FJ-TWELVE-SHEETS | v3: dhuhr +3, isha a fixed offset | dhuhr is transit +5 to +6 (the +3 scores 0/365); isha is maghrib +75 |

## In flight at the close

Reports on disk and counted here: `il-ps`, `westafrica2`, `germany-districts`, `fallback2`, `masjidi`, `capitals3`, `second-witnesses`. Workspaces with data and no report at this cut, therefore NOT in the counts: `eastasia2` (China grid and Hong Kong years), `canada2`, `nz-finish`, `athanpro`, `final-sweep`. Their fits land in the next cut of this index.

## Not fitted

Surfaces captured with no recipe this round: Switzerland (IZRS login-walled, no dated rows), Iran (a 30-row Tehran table, not claimed), North Korea (untouched), Monaco, Faroe, Turkmenistan, South Sudan, Liberia, Myanmar, Guyana, PNG, Solomon Islands, Vanuatu, Samoa, Kiribati, Palikir, Ngerulmud, Tegucigalpa, Benin's Cotonou row (withdrawn in O1k), and the four Egyptian ESA options that render empty all year.

## Provenance

Every figure is traceable to the block named in the entry's `source` field and to that block's workspace under `$HOME/athan-gitree/census/o1l-city/`. The register is the digest, the block is the measurement, and where they differ the block governs. No web access, no subagents, nothing under /tmp, and the repository was not touched.
