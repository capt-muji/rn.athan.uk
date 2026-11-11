# FIT-INDEX ROUND 3: every recipe the O1m round produced

Machine-readable companion: `FIT-INDEX-ROUND3.json` (same entries, same wording). Built 2026-11-11 by
the round-3 registry agent (o1m-36) from the waves' own REPORT.md files, their fit artifacts and the
round's CONSOLIDATION blocks. Recipes are transcribed as the fits and the blocks state them; nothing
is re-derived here and nothing is adjudicated. The round-2 index (`o1l-city/fitindex2/`) is the schema
template.

One entry per fitted surface or surface family, exactly as round two counted them. A wave that has not
returned contributes no entry; its state is in **In flight at the close**. Where a wave's report and its
data disagree, the report governs; where two blocks disagree, the later governs and the earlier is
marked superseded.

## Counts

| Measure | Value |
|---|---|
| Entries | 154 |
| Countries and territories touched | 87 |
| Multi-country families and matrices (ZZ, not one country) | 15 |
| Grade provisional | 85 |
| Grade A | 31 |
| Grade candidate | 25 |
| Grade community | 11 |
| Grade measured | 2 |
| Entries carrying a conflict note | 82 |
| Entries carrying a flag | 11 |
| Span verdict untestable-single-year | 80 |
| Span verdict yes | 33 |
| Span verdict untestable-short-sample | 21 |
| Span verdict untestable-single-template | 8 |
| Span verdict no | 7 |
| Span verdict frozen-reprint | 5 |

## The grading rule applied

Owner ruling T-667 #6943 and the frozen-generation precedent T-668 #6986, unchanged. **A** needs two
to three distinct fitted years on one recipe. **provisional** is one published cycle or one year.
**community** is a fitted non-authority surface. **candidate** is dated data with no fit. **F** is
structurally closed and **FALLBACK** no surface. Grade and tier are independent. The classes round one
and two wrote outside the six-class vocabulary are carried as written and counted separately, never
converted: **measured** (China's norislam county grid and the five-engine consensus matrix, neither a
publisher object), **A-candidate** (Thailand, unchanged this round) and **A eligible** (Tanzania,
Portugal). Byte-identical relabelled editions are one computed generation and never lift provisional
to A: the round re-proved that on Sri Lanka's two editions, Fiji's 1,456-of-1,460-cell reprint, Malaysia's
2027 mirror and mawaqit's twenty-five-surface `?year` relabel.

## Method

Engine: adhan 4.4.6 at `census/adhan-build/node_modules/adhan`, `Rounding.None`, timezone pinned per
surface, dates built from literal capture strings, second resolution then the publisher's own rounding.
Exceptions are stated in the entry: the PrayTimes 2.3 engine behind tawkit.net (served file captured),
the publisher's own `prayTimes.js` behind Kazakhstan's muftyat, the masjidi 0h-UT daily ephemeris, the
Diyanet temkin ladder, the turktakvim template, the independent NOAA routine (Pakistan charts) and
adhan's own `SolarCoordinates` where a table's angle is measured rather than assumed. Scores are days,
cells, cities, delegations or tenant-years as each entry states. Where a block printed only a
percentage, the entry carries the percentage and no invented denominator.

Span verdict vocabulary: **yes**, **no**, **frozen-recomputed**, **frozen-reprint**,
**untestable-single-year**, **untestable-single-template**, **untestable-short-sample**.

In the region tables a recipe field appears only where the block states one, in the order fajr, isha,
asr, dhuhr, maghrib, sunrise, margins, rounding, special. A missing field is not stated in the block;
it is never filled from another source.

## Integrity note: the fitter bug is closed

Round two carried an unresolved `const isha` / `+= 1440` bug (register A53, rule-form D9) and flagged
every multi-year score that came from that fitter. Round three's O1m-R2 re-ran both pools under a
patched copy: **US-33-METROS** (39 fits, twice, 98 tenant-years, 35,829 rows) reproduced field for
field, **MASJIDAL-216-POOL** (54 tenant-years, 19,728 rows) reproduced 18 of 18 out files, and
**Newark 8KXm93LM** was re-banked from 2025 geo rms 26.657 and isha worst +722 to 0.849 and +3. The
`integrity2/gen.mjs` paragraph now measures the after-midnight class per dated row (1,467 wrap rows,
1,229 near rows, 9 workspaces). Both carriers keep the flag as a certificate, not an open doubt. One
stale artifact is named: `masjidal-global/out/fit_*.json` is a pre-`fit2.js` run with +1440 residuals
and is not the record.

## What the round's grades say

**A, 31 entries.** One recipe, two to three or more distinct fitted years.

- North Africa and the Maghreb: DZ-MARW-4-SHEETS, EG-IMSAKIYA-245, EG-DAILY-POSTERS-563
- West and Central Africa: ZA-SALAAHTIMES-112
- Europe: Western and Central: CZ-ISLAMWEB-191
- Europe: Nordics and the far north: SE-ISLAMNU-13
- Europe: Russia and the Caucasus: RU-CDUM-171-CITY-YEARS, RU-UFA-ALMANAC-6-EDITIONS, RU-DUMRT-2017
- Central Asia: KZ-SPAN-RE-DERIVATION, TJ-13-YEAR-ARCHIVE, KZ-96-SETTLEMENTS
- Middle East: IR-PISHKHANAK-44, SA-GRID-225-POINTS, JO-AWQAF-WAYBACK-300, QA-MINISTRY-3-YEARS
- South Asia: IN-MOSQUE-23-CITIES, IN-2027-THREE-YEARS-26
- Southeast Asia: MY-PERAK-7-ZONES-2027, SG-MUIS-4-YEARS, ID-KHGT-516-UNITS
- East Asia: HK-MASJIDAL-5-YEARS
- North America: US-33-METROS-CERTIFIED, US-NEWARK-REBANK, US-SALT-LAKE-CITY, US-OKLAHOMA-CITY-NORMAN, US-NORFOLK-CRESCENT, CA-21-TENANTS-6-YEARS
- South America: CL-ARCHIVE-295-SHEETS
- Oceania: AU-MASJIDAL-3-TENANTS
- Platforms, matrices and cross-engine: MASJIDAL-216-CERTIFIED

**The headline finds the grade rule caps, and why.** Iran moves from nothing to measured twice, but
its two surfaces encode different conventions, so the A sits on pishkhanak alone and tawkit's Iran
layer is a separate provisional. Malaysia's 2027 federation is a fresh computation of the same rule at
the same point, not a second fitted year, so it stays provisional while Perak's seven-zone year carries
the OCR block's A. Kazakhstan's 96 settlements hold five nominal years and 247,506 gated cells with
zero disagreement across three routes, which is the round's strongest span. Egypt's imsakiya holds
58,080 cells read from the publisher's own page images, with 0.20 per cent repaired and logged.

**No entry regresses on a new measurement.** Every cap is a frozen generation (Sri Lanka, Fiji,
mawaqit's 25 relabels, Malaysia's 2027 mirror), a single year, a structural closure (Kyrgyzstan's
year-blind endpoint, turktakvim's 2026-only monthly route, SIHAT's 2027 wall) or a dated regime change
(Cyprus north's four segments, CDUM's four rule forms, Tajikistan's 2019-07-01 dhuhr step, COSIM's
0.85-degree move between 1436 and 1448). Three A entries are certificates rather than new claims: the
US and masjidal pools were re-run to clear the round-two fitter bug, and Newark was re-banked from
26.657 rms to 0.849.


## Reconciliation: every movement this round touches

One row per grade or span movement the round's blocks and reports record, mapped to its entry. A
movement with no entry is named as such; nothing is counted that has no entry behind it.

| # | Object | Movement | Entry |
|---|---|---|---|
| R1 | Iran | FALLBACK to measured twice: 44 cities, two Jalali years, one recipe at 100 pc within-1 at 29 of 38 cities | IR-PISHKHANAK-44 |
| R2 | Iran (platform line) | first dated platform layer, a different convention (17.45/18.00) never merged | IR-TAWKIT-202 |
| R3 | Syria | the record's 18/18 misread corrected: isha is maghrib + 90 on all 4,380 rows | SY-TAWKIT-287-INTERVAL |
| R4 | Saudi Arabia | grid 109 to 225 points, 77,172 to 159,300 city-days, Ramadan still exactly 90/120 | SA-GRID-225-POINTS |
| R5 | Oman | the whole 86-entry CityID space walked; 26 fitted, 60 recovered and NOT claimed | OM-MARA-86-CITYIDS |
| R6 | Jordan | authority grid recovered from 30 Wayback snapshots: 300 rows, 2021-2026, one recipe across the 2022 clock change | JO-AWQAF-WAYBACK-300 |
| R7 | Lebanon | dated at last: seven cities, 147 PDFs, two years | LB-ALMANAR-7-CITIES |
| R8 | Iraq | two Iraqi lines kept apart (Diwan 18.1/16.9 with margins, platform 18/17 zero) | IQ-TAWKIT-145; IQ-DIWAN-AXIS-FREE |
| R9 | Palestine | 25 cities at 99.4-100 pc, the Awqaf offset rule corroborated on a second platform | PS-TAWKIT-25 |
| R10 | Kuwait | the governorate axis refuted: four tenants, one national table | KW-MASJIDI-144 |
| R11 | Qatar | platform to authority: three years, 1,095 rows, one recipe, 4 edge cells in 6,570 | QA-MINISTRY-3-YEARS |
| R12 | Bahrain | a dated regime change (2021-08-09) and a 74-minute isha floor, both new | BH-ZUBARAH-REGIME |
| R13 | Egypt | 2022-2023 closed as unreachable; 2024-2026 posters 563 of 578; the imsakiya 245 city-months | EG-DAILY-POSTERS-563; EG-IMSAKIYA-245 |
| R14 | India | 8 cities to 23 mosque cities, plus a 70-city and a 95-workbook publisher layer | IN-MOSQUE-23-CITIES; IN-ACADEMY-70-CITIES; IN-WORKBOOKS-95 |
| R15 | India | 2027 a genuine third recomputation: 26 tenants, three years, one recipe | IN-2027-THREE-YEARS-26 |
| R16 | India (isha) | the 17-degree line is mosque tier: 0 of 165 publisher tables at 17, 43 mosque tables at 2026 | IN-MOSQUE-23-CITIES (conflict); IN-ACADEMY-70-CITIES |
| R17 | Pakistan | the chart family still blocked with cause; first platform dated tables | PK-PLATFORM-3-CITIES; PK-TAWKIT-453 |
| R18 | Sri Lanka | all 13 zones at depth; 2025 and 2026 identical on every overlapping day, so no lift | LK-ACJU-13-ZONES |
| R19 | Indonesia | capital layer to the whole second level: SIHAT 209 units, KHGT all 516 for two years | ID-SIHAT-209-UNITS; ID-KHGT-516-UNITS |
| R20 | Malaysia | 2027 met in full for 59 zones, mirror-gated; the subuh move is a publisher split, not national | MY-JAKIM-59-ZONES-2027 |
| R21 | Malaysia | Perak's seven zones graded A by the OCR block; Kelantan's 17 confirmed; KDH07 unresolved | MY-PERAK-7-ZONES-2027; MY-KELANTAN-ISHA-17; MY-HORIZON-ZONES |
| R22 | Singapore | four MUIS years on one recipe: 2024-2027 | SG-MUIS-4-YEARS |
| R23 | Thailand | no 2570 edition; the 77 workbook hashes identical to the held generation, so TH-77-PROVINCES is unchanged | no entry: TH-77-PROVINCES stands as written |
| R24 | China | the Diyanet tree was already held unparsed: 222 cities at 18/16, plus a ten-point county grid measured | CN-DIYANET-222; CN-NORISLAM-10 |
| R25 | Japan, Korea, Taiwan, Macau, Hong Kong, Mongolia | first dated city layers from the same tree; Nagoya's own year; Kowloon at five years | JP-DIYANET-143; JP-NAGOYA-YEAR; KR-DIYANET-40; TW-DIYANET-10; MO-DIYANET-1; HK-MASJIDAL-5-YEARS; MN-DIYANET-67 |
| R26 | North Korea | the record's closure lifted at one platform city | KP-DIYANET-1 |
| R27 | Vietnam, Cambodia, Laos | first dated mosque tables | VN-HANOI-AL-NOOR; KH-PHNOM-PENH-ALSERKAL; LA-VIENTIANE-JAMIA |
| R28 | United States | the fitter flags cleared by re-run; Newark re-banked; the last three metros proven | US-33-METROS-CERTIFIED; US-NEWARK-REBANK; US-SALT-LAKE-CITY; US-OKLAHOMA-CITY-NORMAN; US-NORFOLK-CRESCENT |
| R29 | Canada | 21 tenants, six years, two provincial lines | CA-21-TENANTS-6-YEARS |
| R30 | Caribbean and Central America | year-2 closed on three doors; five new surfaces; the Chaguanas mechanism measured | NI-MANAGUA; PA-FOUR-TENANTS; TT-PRINCES-TOWN; SR-PARAMARIBO; BS-NASSAU; TT-CHAGUANAS-DEFECT |
| R31 | Bolivia and Venezuela | Santa Cruz resolved, La Paz reclassified, Maracaibo decided on the sky | BO-SANTA-CRUZ-RESOLVED; BO-LA-PAZ-RECLASSIFIED; VE-MARACAIBO-SHEET |
| R32 | South America | a platform layer over ten countries: 4,075 cities, 1,486,211 rows, 99.93 pc | SA-NAMAZVAKTI-4075 |
| R33 | Chile | the +6 offset proven back to March 2018 across 295 sheets | CL-ARCHIVE-295-SHEETS |
| R34 | Oceania | the Pacific authority layer at twenty cities; Australia's mosque layer; NZ's year-round buy | OC-DIYANET-20-CITIES; AU-MOSQUE-55-SURFACES; AU-MASJIDAL-3-TENANTS; NZ-16-YEAR-SURFACES |
| R35 | Samoa and Tonga | Samoa filled at authority tier; Tonga's date-line defect recorded | WS-APIA-DIYANET; TO-NUKUALOFA-DIYANET |
| R36 | Romania | out of FALLBACK: 53 Diyanet localities, four mawaqit tenants, one Turkish imsakiye | RO-DIYANET-53; RO-MAWAQIT-4 |
| R37 | Europe (Diyanet) | the isha split in one year: 16 degrees in nine states, 17 in seven, never blended | EU-DIYANET-16-ISHA-SPLIT |
| R38 | Czechia | 4 city-years to 1,146: 191 towns x 2019-2024 on one recipe | CZ-ISLAMWEB-191 |
| R39 | Cyprus north | archive floor 2022-10-22 and two engine generations in an A-B-A-B pattern | CY-NORTH-ARCHIVE |
| R40 | Tatarstan | past years not served live; the 2017 crawl and Kazan 2020-2022 fitted | RU-DUMRT-2017 |
| R41 | Russia (CDUM) | 171 city-years from 757 inventoried snapshots; four dated rule forms | RU-CDUM-171-CITY-YEARS |
| R42 | Russia (Ufa) | the missing 1447 almanac found; six editions on one fixed-interval recipe | RU-UFA-ALMANAC-6-EDITIONS |
| R43 | Portugal | thirteen cities on one recipe, including the Azores row the zone table lacked | PT-CIP-13-CITIES |
| R44 | France | the record's 18->12 sweep refuted for nineteen of twenty surfaces; one publisher's summer block is the sweep | FR-MAWAQIT-19-FROZEN; FR-GMS-STRASBOURG-SWEEP |
| R45 | Spain | a third Spanish line confirmed (15/15, 18/17, 12/12) and tawkit's 614 municipalities | ES-MAWAQIT-8-CITIES; ES-TAWKIT-614 |
| R46 | United Kingdom | eighteen new surfaces, twelve full-year; Scotland's interval question answered from AMIC's own print | GB-UK-FULL-YEAR-6; GB-UK-CANDIDATE-8; GB-AMIC-SCOTLAND-NIGHT |
| R47 | Iceland | a second Reykjavik line with maghrib + 90; the 2026 and 2027 isha cannot be pooled | IS-NINE-CITIES; IS-REYKJAVIK-GMI; IS-FELAG-2027 |
| R48 | Greenland, Svalbard, Faroe | three new objects, two defective in measured ways; the polar rule taxonomy now five-fold | GL-NUUK-DIYANET; SJ-LONGYEARBYEN-DIYANET; FO-TORSHAVN-ATHANPRO |
| R49 | Norway and Sweden | the masjidi summer rule identified as three mechanisms; tawkit, islam.nu and mawaqeet layers banked | MASJIDI-495-TENANTS; SE-ISLAMNU-13; NO-TAWKIT-9; SE-TAWKIT-4; NO-MAWAQEET-89 |
| R50 | Kyrgyzstan | 3 cities to 20, and the endpoint proven year-blind, so the 2026 label is nominal | KG-20-CITIES |
| R51 | Kazakhstan | the 48 N switch settled at exactly 48.000000; 96 settlements; five nominal years; 301 city-years re-derived | KZ-96-SETTLEMENTS; KZ-SPAN-RE-DERIVATION |
| R52 | Uzbekistan, Tajikistan, Turkmenistan | the recipe read out of the publisher's bundle; a 20-minute dhuhr regime change; the FALLBACK lift | UZ-ISLOM-6-CITIES; TJ-13-YEAR-ARCHIVE; TM-DIYANET-6 |
| R53 | Georgia, Azerbaijan, Afghanistan | the Diyanet block confirmed in three countries; Kabul's second witness at 18/18 zero | GE-DIYANET-6; GE-TBILISI-JUMA; AZ-NAMAZ-4-CITIES; AF-TAWKIT-8 |
| R54 | Tunisia, Algeria, Morocco, Nigeria, Ghana and 40 more O1k/O1l entries | no new fit this round; the Maghreb wave has not returned, and no O1m artifact moves them | no entry: they stand as round two wrote them |
| R55 | Switzerland | still undecidable: no dated rows | no entry |
| R56 | The fallback eleven | ten of eleven lifted to dated rows; no country lifts to A on a platform tier | TT-PLATFORM-10-COUNTRIES; DI-8-FALLBACK-SECOND; NP-KATHMANDU-DARULIFTA-12M; KI-AHMADIYYA-2026 |
| R57 | The platform census | tawkit walked whole (3.18M rows), masjidi completed (495 tenants), masjidal certified, Diyanet's temkin named across 207 countries | TAWKIT-COUNTRY-73; MASJIDI-495-TENANTS; MASJIDAL-216-CERTIFIED; DIYANET-TREE-207 |
| R58 | The cross-engine matrix | five families at one crosspoint per country: the geometry is one convention, the printed margins are not | ENGINE-CONSENSUS-184 |
| R59 | The capital matrix | 7 of 49 athanpro-only capitals upgraded, 42 honest negatives | CAPITALS-49-UPGRADE |

## The entries

### North Africa and the Maghreb

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / sunrise / margins / rounding / special) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| LY-TRIPOLI-ALI-BIN-ABI-TALIB | Tripoli, Masjid Ali bin Abi Talib, mawaqit seven-column board | community | 1 y, 365 rows | 18.5 deg / 18.5 deg / Shafi / fajr +1, dhuhr +3, maghrib +4, isha -1, asr 0 | 345/365 jointAllFive (94.5 pc) / 2 | untestable-single-year | provisional |
| DZ-MARW-4-SHEETS | Ministry of Religious Affairs and Waqf (MARW) four transcribed sheets, 732 dated rows | authority | 2 y, 732 rows | the wilaya recipe / the wilaya recipe / Shafi / two Alger cycles on one recipe; Adrar and Djelfa stay provisional | both Alger cycles reproduce on one recipe / 1 | yes | A |
| EG-IMSAKIYA-245 | ESA national imsakiya, three Hijri editions plus the second 1446 edition | authority | 1445H (2023-2024) | 19.5 deg / 17.5 deg / Shafi / zero on all six / imsak = fajr - 20, suhur = imsak - 120, both printed relations | 91.78 (1445) / 90.10 (1446) / 89.41 (1447) at the implied point / 100.00 (1445, 77 of 77 cities) / 99.12 (1446, 82 of 83) / 99.93 (1447, 73 of 77) / 2 (1445 and 1447); 28 on one 1446 city | yes | A |
| EG-DAILY-POSTERS-563 | ESA daily 'tawqit misriyya' poster archive, 563 of 578 days | authority | 3 y, 563 rows | 19.5 deg / 17.5 deg / Shafi / zero | 90.56 / 91.38 / 79.44 / 72.22 pc by edition / every cell within 1 min of 19.5/17.5 zero-margin / 1 | yes | A |

### West and Central Africa

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / sunrise / margins / rounding / special) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| CI-COSIM-3-EDITIONS | COSIM council prints: Safar 1436, Ramadan 1447, Joumada al-Oula 1448 | authority | 3 y, 90 rows | 14.10 (1436), 14.85 (Ramadan 1447), 14.95 (Joumada 1448) / 15.85 (1436), 15.10 (Joumada 1448) / Shafi / sunset +0 (Joumada), +1 (Ramadan), +3 (1436) / printed convention: zouhr 13:00 and assr 16:00 'conventionnelle' all year (rule form CI-COSIM-CONV); imsak = fajr - 15 | 1,140/1,190 across the 2026 editions; 30/30 every column on the 1436 sheet / 1 | no | provisional |
| BF-MSBF-1442-ANNUAL | MSBF 1442 annual print plus the 2026 mosque pages it reproduces | community | 5 y, 365 rows | 17.75 deg / a five-minute block walk / a five-minute block / three clock values / sunset +1 / the five-minute blocking is printed doctrine, not a fit failure | fajr and maghrib computed to the minute; asr and isha on printed blocks | frozen-reprint | provisional |
| TT-AFRICA-8565 | turktakvim.com African gazetteer: 8,565 settlements, 50 country entries, 138 cities fitted | platform | 1 y, 365 rows | 17.75 deg (median; 17.50-17.85 across 24 fitted) / 18.75 deg (median; 18.70-19.25) / Shafi / +8 min / +6 min / -4 min / dhuhr +8 (365/365 at every fitted city), asr +8, maghrib +6, sunrise -4 | 95 of 138 cities all six columns at 364/365 or better / 5 | untestable-single-year | provisional |
| ZA-SALAAHTIMES-112 | salaahtimes.co.za: 112 towns, 2026 and 2027 both | platform | 2 y, 730 rows | 17.90 deg (Luanda) / 18.10 deg / Shafi / +5 / +3 / +0 | dhuhr 365/365 within-1 at every town; fajr and isha pass at all but five town-years / 1 | yes | A |
| CV-PRAIA-AIDES | Praia, AIDES mosque (mawaqit) | community | 1 y, 365 rows | 14.90 deg / 15.10 deg / Shafi | 87.9 pc all six / 2 | untestable-single-year | provisional |
| ZW-HARARE-MSASA | Harare, Msasa mosque (mawaqit) | community | 1 y, 365 rows | 14.90 deg / 15.10 deg / Shafi | 72.3 pc minimum across the six columns / 3 | untestable-single-year | provisional |
| GN-BOKE-CORRERAH | Boke, Correrah mosque (mawaqit) | community | 1 y, 365 rows | 14.90 deg / 15.10 deg / Shafi | 80.5 pc minimum across the six columns / 2 | untestable-single-year | provisional |
| GW-BISSAU-ATTADAMUN | Bissau, Mesquita Attadamun (mawaqit) | community | 1 y, 365 rows | as served (no angle reproduces the column) / as served / as served | fajr 71/365, asr 19/365 | untestable-single-year | candidate |
| AF-MAWAQIT-WEST-BOARDS | Five West African mawaqit boards (Nono, Lusaka Barkaatiyah, Nampula Fatima, Gbessia Port2, UCAD Dakar) | community | 1 y, 365 rows | 17.85 (Nono) / 14.85 (Lusaka) / 17.10 (Nono) / 19.90 (Lusaka) / Shafi | worst 19 (Nono), 33 (Lusaka), 46 (Nampula), 51 (UCAD), 103 (Gbessia) / 103 | untestable-single-year | candidate |
| ML-BAMAKO-7-SURFACES | Bamako mosaic: seven surfaces, three clean tables and four boards | community | 1 y | as each surface states / as each surface states / Shafi | three clean tables, four boards | untestable-single-year | community |
| UG-KAMPALA-1790 | Kampala mosque table | community | 1 y | 17.90 deg / 17.35 deg / Shafi | all six within-1 | untestable-single-year | provisional |

### East, Southern Africa and the Indian Ocean

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / sunrise / margins / rounding / special) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| TZ-DAR-2-WITNESSES | Dar es Salaam, two independent witnesses | community | 1 y, 365 rows | 17.90 deg / 17.10 deg / Shafi | 2,136 of 2,190 and 2,109 of 2,190 on the two witnesses / 2 | untestable-single-year | provisional |

### The fallback eleven

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / sunrise / margins / rounding / special) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| TT-PLATFORM-10-COUNTRIES | turktakvim.com gazetteer across South Sudan, Liberia, Turkmenistan, Nepal, Myanmar, Guyana, PNG, Solomon Islands, Vanuatu, Kiribati | platform | 1 y, 365 rows | 17.85-17.93 deg / 18.59-18.74 deg / Shafi (asr +7) / +7.00 min / +5.45 min / -4.40 min / imsak = fajr - 12, constant / isha carries a latitude-dependent summer correction: 365/365 at Kiribati, 220-247/365 at Turkmenistan | 365/365 on five of six columns at all 54 fitted cities | untestable-single-year | provisional |
| DI-8-FALLBACK-SECOND | Diyanet second publisher, one genuine 30-day table per country | platform | 1 y, 30 rows | 17.97-18.04 deg / 16.81-17.02 deg / Shafi / +4.68 to +5.10 / +6.42 to +7.12 / -6.95 to -7.42 | 30/30 all six columns in each of the eight tables / 1 | untestable-short-sample | candidate |
| NP-KATHMANDU-DARULIFTA-12M | Kathmandu, Darul Ifta Wal Qaza twelve-month cycle | authority | undated month-day cycle (leap template) | 19.10 deg recovered / 18.31 deg recovered / Hanafi / +3.55 / +6.33 / -6.62 / the angles ARE the elevation: MWL 18/17 at sea level plus a 1.1 deg horizon dip for 1,400 m; the sheet states PrayTimes as its engine | fajr 336/363, dhuhr 363/364, maghrib 281/365, isha 228/365 | untestable-single-template | provisional |
| NP-RAMADAN-1446 | Kathmandu, Nepali Jame Masjid Ramadan 1446 sheet | community | 1 y, 30 rows | 19.01 deg / Shafi / sunset +5.85 | fajr 30/30 (27 exact); maghrib 30/30 (29 exact) / 1 | untestable-short-sample | provisional |
| NP-RAHMANIYA-BOARD | Siddharthanagar, Jama Masjid Rahmaniya (mawaqit), defective board | community | 1 y, 365 rows | no latitude in either hemisphere reproduces the table / as served / as served / pinned 13:30 all year | 263/365 days print fajr at or after sunrise | untestable-single-year | candidate |
| KI-AHMADIYYA-2026 | Tarawa/Bairiki, Ahmadiyya Ramadan 2026 sheet | community | 1 y, 30 rows | implied 16.22 deg, spread 1.47 / fixed 19:45 clock / fixed 16:00 clock / fixed 13:30 clock / -0.65 min | maghrib 30/30 exact; fajr 10/30 / 2 | untestable-short-sample | candidate |

### Europe: British Isles

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / sunrise / margins / rounding / special) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| GB-UK-FULL-YEAR-6 | Jersey Islamic Centre, Aberdeen AMIC, Newport Diyanet, Lancaster Masjid al-Noor, Leeds Islamic Centre, Halifax Faizan e Madina | community | 3 y, 2196 rows | 17.9 (Jersey, Aberdeen, Newport); 15.0 (Lancaster); 18.0 (Leeds, Halifax) / 15.1 (Jersey, Aberdeen); 16.1 (Newport); 15.0 (Lancaster, Leeds); 18.0 (Halifax) / Hanafi on five; Shafi at Aberdeen / +4.5 (Jersey), +5.4 (Aberdeen), +4.3 (Lancaster), +0.5 (Leeds) / +5.5 (Jersey), +5.4 (Aberdeen), +4.5 (Lancaster), +5.0 (Leeds) | fajr 95.0-100 pc, isha 93.4-100 pc; MAE 0.08-0.85 / 6 | untestable-single-year | provisional |
| GB-UK-GATE-FAIL-2 | Burnley Faizan e Madina and Preston Quwwat-ul-Islam | community | 1 y, 730 rows | 18.3 (Burnley); 14.3 (Preston) / 18.1 (Burnley); 15.0 capped maghrib+60 in June (Preston) / Hanafi / +3 (Preston) | Burnley fajr 90.9, isha 99.2; Preston isha 100, fajr 24.4 / 6 | untestable-single-year | provisional |
| GB-UK-CANDIDATES-8 | Swansea, Milton Keynes, Oldham Central, Oldham Madina Institute, Enniskillen, Sheffield, Bolton, Hull | community | 1 y, 1800 rows | 13.8-17.84 by surface / 11.2-17.97 by surface / Hanafi on most | fajr 19.1-72.7 pc; isha 18.2-91.7 pc / 3 | untestable-single-year | candidate |
| GB-AMIC-SCOTLAND-NIGHT | Aberdeen AMIC's Scottish summer rule | community | 1 y, 366 rows | 18 deg all winter / 15 deg all winter, a night-fraction substitute April to August / Shafi / isha interval 47-50 min in June, sd 1.0, on the mosque's own print | fajr 100/0.22, isha 100/0.21 outside the substituted block / 2 | untestable-single-year | provisional |

### Europe: Western and Central

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / sunrise / margins / rounding / special) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| RO-DIYANET-53 | Diyanet abroad, 53 Romanian localities | authority | 1 y, 365 rows | 18.0 deg / 16.0 deg / Shafi / sunrise -7, dhuhr +5, asr +4, maghrib +7, fajr 0, isha -1 | fajr 82.2, sunrise 100, dhuhr 100, asr 84.7, maghrib 95.3, isha 53.4 / 2 | untestable-single-year | provisional |
| EU-DIYANET-16-ISHA-SPLIT | Diyanet abroad, 1,592 localities across France, Netherlands, Belgium, Italy, Spain, Bosnia, Poland, Greece, North Macedonia, Serbia, Montenegro, Croatia, Portugal, Albania, Kosovo, Romania | authority | 1 y, 365 rows | 18.00 deg in all sixteen / 16 deg in nine states, 17 deg in seven / Shafi / temkin sunrise -7, dhuhr +5, asr +4, maghrib +7 | modal within-1 median 73.8-96.8 pc by country / 2 | untestable-single-year | provisional |
| RO-MAWAQIT-4 | Bucharest Ar-Rahman, Bucharest Ettaqwa, Bucharest al-Quds, Constanta cultural centre | community | 1 y, 366 rows | 18.0 / 18.0 / 17.9 / 18.0 / 18.0 / 18.2 / 17.0 / maghrib + 90 fixed / Shafi / +5 (Constanta) / +7 (Constanta) | 99.1 / 95.0 / 94.5 / 93.2 pc all columns / 3 | untestable-single-year | provisional |
| RO-MASJIDI-5733 | masjidi table 5733 at Constanta, Diyanet's table frozen at standard time | platform | undated 366-day scaffold | Diyanet's 18.0 / Diyanet's 16.0 / Shafi / Diyanet's temkin set; the summer-time instruction is dropped / integer | 155 of 365 rows identical to Diyanet on all six; median difference exactly -60 min | frozen-reprint | candidate |
| ES-TAWKIT-614 | tawkit.net, 614 Spanish municipalities, November 2026 | platform | 1 y, 30 rows | 15.00 deg / 14.80 deg / Shafi (+1) / asr +1, isha +1, rest 0 | median 100.0 across the 614 / 2 | untestable-short-sample | candidate |
| IT-PREGHIERA-6 | preghiera-orario.it, Naples, Florence, Palermo, Catania, Bari, Verona | platform | 1 y, 30 rows | 15.0-18.5 by city / 13.0-17.0 by city / Shafi / -2 (Naples) to +13 (Bari, Florence) | 74.0-100 pc by city / 4 | untestable-short-sample | candidate |
| CZ-ISLAMWEB-191 | islamweb.cz, 191 towns x 2019-2024 plus Praha and Brno to 2030 | community | 12 y, 418672 rows | 12.11 deg / 11.95 deg / Shafi / +4.45 / +2.43 / -3.38 / a smooth seasonal term of 2-4 min peak-to-peak on all six columns, no drift across six years | 67 pc pooled without the seasonal correction / 5 | yes | A |
| CY-NORTH-ARCHIVE | Kibris north archive, 2022-10-22 to 2026-12-31 | authority | 5 y, 1505 rows | 2026 recipe / 2026 recipe / Shafi / TWO engine generations in an A-B-A-B pattern: A 2022-10-22..2022-12-31 and 2023-04-07..2025-12-31; B 2023-01-01..2023-04-06 and all 2026; B prints +2.4 min later on every column | 100 pc at a segment's own constants, 0 pc at the other's / 1 | no | provisional |
| FR-MAWAQIT-19-FROZEN | Nineteen of twenty French surfaces: Lyon x2, Lille x2, Marseille x3, Bordeaux, Nantes, Nice x2, Montpellier, Rennes x2, Toulon x2, Toulouse x3 | community | 1 y, 366 rows | 12.47 (Lille) to 14.35 (Lyon) frozen pairs / 12.71 (Lille) to 13.61 (Lyon) / Shafi / +0 to +6 / +3 to +7 by mosque / +0 to +1 | median 311/366, median fajr MAE 0.67 min, median worst 3 / 38 | untestable-single-year | community |
| FR-GMS-STRASBOURG-SWEEP | Grande Mosquee de Strasbourg, twelve monthly PDFs for 2026 plus the 2025-12 sheet | community | 2 y, 395 rows | 18.00 exact for nine months, sweeping to 11.3 / 16.00 to 10.4 in the same block / Shafi / a 108-day summer block, 28 April to 13 August, opening and closing at N=9.56 h, continuous with no discontinuity | 18.00/16.00 exact on 257 of 365 days; the block is continuous / 1 | no | provisional |
| FR-MONTPELLIER-INTERVAL | Montpellier, isha as a fixed interval | community | 1 y, 366 rows | frozen pair / maghrib + 80 exactly / Shafi / one distinct isha value on all 366 rows: a fixed interval, not an angle | isha = maghrib + 80 on 366 of 366 | untestable-single-year | community |
| NL-BE-PL-MAWAQIT-9 | Amsterdam, Rotterdam, Den Haag, Utrecht, Eindhoven, Antwerpen, Liege, Warszawa, Bialystok | community | 1 y, 365 rows | 11.95-19.995 by city / 11.955-19.95 by city / Shafi | 62.36-91.53 pc / 480 | untestable-single-year | community |
| PL-MUFTI-16-CITIES | Polish mufti's sixteen Ramadan PDFs | authority | 1 y, 30 rows | 18.15 deg / 17.14 deg / Shafi | 100 pc pinned, on the 11 of 30 days that pass the solar gate / 1 | untestable-short-sample | candidate |

### Europe: Iberia, Italy and the Balkans

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / sunrise / margins / rounding / special) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| PT-CIP-13-CITIES | Comunidade Islamica de Portugal annual sheet, thirteen cities including Faro, Funchal and Ponta Delgada | authority | 1 y, 365 rows | 18.00 deg / 12 deg + 3 / Shafi / +6 / +4 | 60.46-79.5 pc by city / 96.6-99.95 pc / 2 | untestable-single-year | provisional |
| ES-MAWAQIT-8-CITIES | Bilbao, Murcia, Cordoba, Las Palmas, Santa Cruz de Tenerife, Zaragoza, Malaga, and a Ceuta-named tenant outside the city | community | 1 y, 365 rows | 15.085 (Bilbao), 18.09 (Murcia), 15.095 (Cordoba), 17.895 (Tenerife), 18.095 (Malaga) / 14.92 (Bilbao), 16.91 (Murcia), 14.905 (Cordoba), 16.89 (Tenerife), 16.91 (Malaga) / Shafi | 90.23-95.02 pc on five; Las Palmas 18.22 and Zaragoza 60.37 / 107 | untestable-single-year | community |
| GR-ATHENS-STATE | Athens state mosque Ramadan table, transcribed from the image | authority | 1 y, 29 rows | 16.95 deg / 16.65 deg / Shafi | 89.08 pc / 174/174 / 1 | untestable-short-sample | provisional |
| BA-SARAJEVO-PODGORICA | Sarajevo and Podgorica (mawaqit), plus the Balkan city layer | community | 1 y, 365 rows | 15.05 (Sarajevo), 12.35 (Podgorica) / 14.7 (Sarajevo), 12.145 (Podgorica) / Shafi | Sarajevo 100, Podgorica 95 / 2 | untestable-single-year | community |

### Europe: Nordics and the far north

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / sunrise / margins / rounding / special) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| IS-REYKJAVIK-GMI | Reykjavik, Grand Mosque of Iceland monthly posters (January and June transcribed) | community | 1 y, 60 rows | 18.05 deg median, drifting / maghrib + 90 fixed, not an angle / Shafi / +0.50 / -0.03 / the midnight-sun block takes a quarter of the night (0.236 measured) | solar gate 0.22 min median / 2 | untestable-short-sample | candidate |
| IS-FELAG-2027 | Felag Muslima monthly page, November 2027 | community | 1 y, 30 rows | as served / azan at maghrib + 90, iqamah ten minutes later / Shafi | solar gate 0.31 min / 1 | untestable-short-sample | candidate |
| IS-NINE-CITIES | Nine Icelandic places on the Felag Muslima line | community | 1 y, 365 rows | 14.2 deg with the angle-derived night portion / 14.0 deg / Shafi | 14.2/14.0 exact at all nine (O1l measurement) / 1 | no | provisional |
| FO-TORSHAVN-ATHANPRO | Torshavn, athanpro month | platform | 1 y, 30 rows | 17.95 deg / 17.05 deg / Shafi (+1.63) / -0.13 / +0.05 / 0 | solar gate 0.17 min median / 1 | untestable-short-sample | candidate |
| GL-NUUK-DIYANET | Nuuk, Diyanet single-city table | platform | 1 y, 30 rows | as served / as served / as served | solar gate 59.58 min median / 60 | untestable-short-sample | candidate |
| SJ-LONGYEARBYEN-DIYANET | Longyearbyen, Diyanet single-city table | platform | 1 y, 30 rows | as served / as served / set equal to dhuhr / frozen 14:17 / frozen 09:17 / a synthetic solar row through the polar night: a publisher fixture, not a measurement of the sky | no angle measurable in a 30-day window | untestable-short-sample | candidate |
| NO-TAWKIT-9 | tawkit.net Norway, nine cities including Tromso, Bodo, Harstad | platform | 1 y, 247 rows | 17.95-18.00 deg / 16.95-17.00 deg / Shafi / -0.03..-0.13 / -1.10..-1.67 / half-night plateau 0.499; the deep polar days are OMITTED from the table (Tromso 247 rows, Harstad 265, Bodo 322) | solar gate 0.46-0.49 min / 2 | untestable-single-year | provisional |
| SE-TAWKIT-4 | tawkit.net Sweden, four northern towns including Umea | platform | 1 y, 365 rows | 18.00 deg / 17.00-17.05 deg / Shafi / -0.03..+0.03 / -0.02..+0.08 / half-night plateau 0.500 fajr, no omission | solar gate 0.23-0.28 min / 1 | untestable-single-year | provisional |
| SE-ISLAMNU-13 | islam.nu, thirteen northern Swedish towns (Lulea, Ostersund, Umea and ten more) | community | 2 y, 760 rows | 18.0 deg outside the window / 17.0 deg outside the window / Shafi / 0.00 / 0.00 / one-third-of-the-night split: 0.300 fajr and 0.283 isha inside the trigger window; a second, distinct rule in the same country | solar gate 0.23-0.36 min / 2 | yes | A |
| NO-MAWAQEET-89 | mawaqeet.no, 88 PDFs over 89 enumerated slugs | community | 2 y, 365 rows | 18 deg / 15 deg / Shafi | 18 of 20 clean: fajr 93.2-98 pc exact, 99.6 within-1; isha 88-91, 100 within-1, worst 0.8 / 1 | yes | provisional |

### Europe: Russia and the Caucasus

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / sunrise / margins / rounding / special) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| RU-ARCTIC-TAWKIT-54 | tawkit.net arctic subset, 54 Russian cities from Murmansk to Magadan | platform | 1 y, 365 rows | 15.95-16.00 deg / 14.95-15.10 deg / Shafi / +0.43..+0.58 / -0.98..+0.55 / half-night plateau 0.498 fajr / 0.491 isha inside the trigger window; the polar noon collapse is dated per city (Murmansk 40 days, Norilsk 45) | solar gate 0.47-1.13 min median at every city / 2 | untestable-single-year | provisional |
| RU-CDUM-171-CITY-YEARS | CDUM city year tables, 21 cities, 2015-2026 from the Wayback | authority | 12 y, 60060 rows | 18 deg (2022-2026) / 17 deg (2022-2026) / Hanafi (2022-2026) / FOUR dated rule forms measured: 2016-2017 prints both asr schools and no isha; 2020 is Shafi asr; 2021 is a fixed-interval edition (fajr = sunrise - 120, isha = maghrib + 90); 2022-2026 back to 18/17 Hanafi | 2022-2026 at 83-87 pc fajr and 94 pc isha; 2018 absent at every URL / 6 | no | A |
| RU-UFA-ALMANAC-6-EDITIONS | Ufa almanac, six editions (1439-1448) | authority | 10 y, 2190 rows | sunrise - 100 / maghrib + 90 / Hanafi of the date plus ten days / max(13:30, noon + 5) / sunset + 1 to + 4 / suhur = fajr - 20; a fixed-interval recipe, not angular | 90.8 pc / cell-exact 90.8 pc on the held edition; fajr and isha exact in every edition / 1 | yes | A |
| RU-DUMRT-2017 | DUM RT, 23 of 44 settlements in the 2017 Wayback crawl plus Kazan 2020-2022 | authority | 3 y, 9522 rows | 18 deg / 15 deg / Hanafi / substitute fajr = sunrise - 120 and isha = maghrib + 90 on about 100 and 92 days; Kazan's 2020-2022 editions carry the recipe FROZEN at a uniform -1.0 min on every column | 99.6-100 pc at 23 settlements in 2017 / 2 | yes | A |
| RU-DUMRF-61 | DUM RF Moscow, two live months plus sixteen archived prints | authority | 4 y, 61 rows | 18.0 deg / 15.0 deg / Shafi / +5 / +4 / -5 | median residual 0.00 | untestable-short-sample | candidate |

### Central Asia

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / sunrise / margins / rounding / special) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| KZ-SPAN-RE-DERIVATION | Kazakhstan banked city-years re-derived from the captured engine, plus 13 new live-gated city-years | authority | 31 y, 301 rows | 15.0 deg (ISNA) / 15.0 deg / Hanafi / set A (sunrise -3, dhuhr/asr/maghrib +3) below 48 N, set B (-5/+5) at or above / the 48 N switch is latitude-only and measured at exactly 48.000000 (O1m-25) | 648,300 cells, ZERO differing against the live engine; 122 live gates spanning 2020-2050 | yes | A |
| KG-20-CITIES | muftiyat.kg JSON API, twenty settlement codes | authority | 1 y, 365 rows | 18.0 deg flat / maghrib + round(k*(sunrise - fajr) + 3.5) / Hanafi / printed sunset + 7 on 7,300 of 7,300 rows / the ratio is a RIDGE: k 0.771/c 4.0, 0.773/3.75 and 0.775/3.5 all score 97.1-97.3 pc; unrounded inputs lift to 98.6 | 35.3-68.2 pc fajr / 100 pc fajr at all twenty; isha 95.1-98.6 by city / 1 | untestable-single-year | provisional |
| UZ-ISLOM-6-CITIES | islom.uz/taqvim/oylik, seven region ids at November 2026 | community | 1 y, 30 rows | 15.5 deg / 15.5 deg / Hanafi / zero / sunset + 4 / zero / ishroq = sunrise + 20; display clock fixed UTC+5 by the bundle; differ_minute proven unused | 93.3-100 pc / all seven regions within-1 on every column / 1 | untestable-short-sample | provisional |
| TJ-13-YEAR-ARCHIVE | shuroiulamo.tj/tj/namaz/ntime, every month 2014-2026 | authority | 13 y, 4328 rows | as the window print / window start; the night window crosses midnight / Shafi / a 40-minute window, then 90 minutes to night start / the dhuhr offset steps 20 minutes on exactly 2019-07-01 (+31.6 to +11.4 against adhan 18/18) | 156 month cells requested, 144 carry rows | no | A |
| TM-DIYANET-6 | Diyanet tree, six Turkmen cities | platform | 1 y, 365 rows | 18.0 deg / 17.0 deg / Shafi / sunrise -7, dhuhr +5, asr +4, maghrib +7, fajr 0, isha 0 | 55.1-66.5 pc / 97.9-99.5 pc all six / 2 | untestable-single-year | provisional |
| GE-DIYANET-6 | Diyanet tree, six Georgian cities | platform | 1 y, 365 rows | 18.0 deg / 17.0 deg / Shafi / sunrise -7, dhuhr +5, asr +4, maghrib +7 | 96.5-97.7 pc all six / 2 | untestable-single-year | provisional |
| GE-TBILISI-JUMA | Tbilisi Juma Mosque board (mawaqit) | community | 1 y, 366 rows | 18.0 deg / 17.0 deg / Shafi / the Diyanet temkin block; listed point shifted 0.053 deg north in the fit | 96.6 pc across 2,196 cells / 3 | untestable-single-year | provisional |
| AZ-NAMAZ-4-CITIES | nam.az, Ganja, Sumqayit, Lankaran, Sheki | community | 1 y, 365 rows | 18.0 deg / 17.0 deg / Shafi / ZERO on every column | 91.0-97.8 pc on the solar columns / 100 pc on all six at all four cities / 1 | untestable-single-year | provisional |
| AZ-DIYANET-6 | Diyanet tree, six Azerbaijani cities | platform | 1 y, 365 rows | 18.0 deg / 17.0 deg / Shafi / sunrise -7, dhuhr +5, asr +4, maghrib +7 | 97.0-98.6 pc all six / 2 | untestable-single-year | provisional |
| AF-TAWKIT-8 | tawkit.net Afghanistan, eight cities of 307 enumerated | platform | 1 y, 30 rows | 18.0 deg / 18.0 deg / Shafi / ZERO / nearest | 78.3-88.3 pc / 100 pc at every city; largest residual anywhere 0.80 min / 1 | untestable-single-year | provisional |
| KZ-96-SETTLEMENTS | muftyat.kz: all 96 dropdown settlements for 2026, plus 2025, 2027, 2028 and 2045 | authority | 5 y, 41251 rows | 15.0 deg (ISNA) / 15.0 deg / Hanafi / +3 / +5 / +3 / +5 / -3 below 48 N, -5 at or above / the 48 N switch is a hard latitude-only switch at exactly 48.000000: one part in a million flips sunrise/dhuhr/asr/maghrib by exactly 2 min while fajr and isha stay identical | 82.37 (Mamlyut) to 91.96 (Karatau) pc / 96 of 96 settlements at 100 pc within-1 all six for 2026 / 1 | yes | A |

### Middle East

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / sunrise / margins / rounding / special) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| IR-PISHKHANAK-44 | pishkhanak.com, 44 cities, 880 monthly pages across Jalali 1404 and 1405 | community | 2 y, 610 rows | 17.70 deg / 14.00 deg / Shafi / the sun's 4.5-degree depression / zero on every column / nearest / maghrib is a DEPRESSION, not a margin: a fixed sunrise offset reproduces 64.3 pc, the 4.5-degree model 100 pc | 78.1-88.8 pc / 100.0 pc at 29 of 38 cities, 99.0+ at 36; median 100.0 / 3 | yes | A |
| IR-TAWKIT-202 | tawkit.net Iran layer, 202 cities | platform | 1 y, 365 rows | 17.45 deg median / 18.00 deg median / Shafi | median 100 pc at its own stated coordinates | untestable-single-year | provisional |
| YE-AWQAF-6-GOVERNORATES | yemenawqaf.org, six governorate feeds (Aden, Lahj, Mukalla, Seiyun, Marib, Mahra) | authority | 1 y, 365 rows | 15.40-17.95 by governorate / 16.40-17.60 by governorate / Shafi / nearest | 87-95 pc / all six at 100 pc within-1 / 1 | untestable-single-year | provisional |
| YE-TAWKIT-313 | tawkit.net Yemen layer, 313 cities | platform | 1 y, 365 rows | 18.51 deg / maghrib + 90 / Shafi | 61.5 pc of cells / 98.5 pc of cells; 96.5 pc of rows joint / 5 | untestable-single-year | provisional |
| SA-GRID-225-POINTS | Umm al-Qura grid, 225 points across thirteen regions, 1449 and 1450 | authority | 2 y, 159300 rows | 18.5 deg floor + 1 / maghrib + 90, +120 on every Ramadan day / Shafi / floor(raw) + 1 / floor(raw) + 1 / floor(raw) / prayers = floor(raw + 1 min); the Ramadan interval is exactly two values (D14) | 81.7-88.2 pc / 99.7-100.0 pc of city-days / 2 | yes | A |
| OM-MARA-86-CITYIDS | mara.gov.om calendar, all 86 CityIDs x twelve months of 2026 | authority | 1 y, 31390 rows | 17.75-18.35 deg / 17.0-18.2 deg / Shafi / 2-5 min | 26 CityIDs at 99.8-100 pc; the other 60 at 54.7-67.3 pc on recovered points / 2 | untestable-single-year | provisional |
| IQ-TAWKIT-145 | tawkit.net Iraq layer, 145 cities | platform | 1 y, 365 rows | 17.8-18.5 deg / 16.65-17.65 deg / Shafi / sunset +0 | 60.5-70.2 pc / 95-100 pc by city / 2 | untestable-single-year | provisional |
| IQ-DIWAN-AXIS-FREE | Diwan of the Sunni Endowment endpoint, axis-free | authority | 1 y, 1 rows | Baghdad's line / Baghdad's line / Shafi | the endpoint ignores city, governorate, date and year and returns Baghdad | untestable-short-sample | candidate |
| JO-AWQAF-WAYBACK-300 | Jordan Awqaf ministry grid through 30 Wayback snapshots | authority | 6 y, 300 rows | 18.1 deg / 18.15 deg / Shafi / +7 / -5 | 97.6 pc overall; per year 93.3-100 / 2 | yes | A |
| JO-TAWKIT-142 | tawkit.net Jordan layer, 142 cities | platform | 1 y, 365 rows | 17.3 (62 cities) or 18.0 (22 cities) / 18.0 deg / Shafi / +6 or +7 | 57.3-81.1 pc / 100.0 at seven of twelve sampled cities, 99.4 Tafilah, 91.6 Karak / 60 | untestable-single-year | provisional |
| SY-TAWKIT-287-INTERVAL | tawkit.net Syria layer, twelve cities over a full year and 287 cities one month | platform | 1 y, 365 rows | 18.05-18.70 deg by city / maghrib + 90 minutes / Shafi / sunset +0 / isha is an INTERVAL on all 4,380 rows of both editions, not a pair; the record's 18/18 misread the surface | 55.3-61.1 pc / 91.2-98.8 pc by city / 2 | untestable-single-year | provisional |
| PS-TAWKIT-25 | tawkit.net Palestine layer, 25 cities | platform | 1 y, 365 rows | 18.0 deg / 18.0 deg / Shafi / +5 to +7 | 99.4-100 pc / 3 | untestable-single-year | provisional |
| LB-MASJIDI-16-TABLES | masjidi.app Lebanon, sixteen regional tables serving 244 tenants | platform | undated 366-day scaffold | 19.91 deg / 17.19 deg / Shafi / fixed 11:41 clock on UTC+2 / a publisher-side declination-amplitude defect; the family sits at 68.9 pc across 244 tenants | Beirut 76.9 pc (MAE 0.83), Sidon 77.1, Tyre 66.0 / 9 | untestable-single-template | community |
| LB-ALMANAR-7-CITIES | almanar.com.lb monthly city calendars, seven cities, 2026 whole and 2025 April-December | community | 2 y, 547 rows | 15.90-16.05 deg / 14.90-15.50 deg / Shafi / the sun's 4.5-degree depression / imsak nine minutes before fajr | 1,381 rows past the solar-noon gate | untestable-single-year | provisional |
| LY-TAWKIT-64 | tawkit.net Libya layer, 64 cities | platform | 1 y, 365 rows | 18.55 deg median / 18.0 deg median / Shafi | median within-1 clean / 59 | untestable-single-year | provisional |
| QA-MINISTRY-3-YEARS | Qatar ministry gateway, Doha, 2025, 2026 and 2027 in full | authority | 3 y, 1095 rows | 18.42 deg at floor(raw) + 1 / maghrib + 90 / Shafi / floor(raw) / floor(raw) + 2 / floor(raw) / isha exactly maghrib + 90 on all 1,095 rows, zero violations | 75.1 / 84.9 / 87.9 pc by year / 100.0 / 100.0 / 99.8 pc / 2 | yes | A |
| QA-MASJIDI-164 | masjidi.app table 164 (Al-Rayyan) | platform | undated 366-day scaffold | 18.575 deg / interval 20.1 min / Shafi | 85.3 pc / 12 | untestable-single-template | community |
| BH-TAWKIT-2 | tawkit.net Bahrain, two cities | platform | 1 y, 365 rows | 17.3-18.0 deg / 17.05 deg (+80 min) / Shafi | both 100 pc / 1 | untestable-single-year | provisional |
| BH-ZUBARAH-REGIME | Bahrain's stated method: the Al Zubarah and Bahrain almanac, regime from 9 August 2021 | authority | 5 y | two calculation sites: Dilmunia for fajr and sunrise / astronomical twilight, abolished fixed +90 / meridian transit, no offset / minimum maghrib-to-isha span 74 minutes, on 21 March and 22 September | no dated table on a public page | untestable-short-sample | candidate |
| KW-MASJIDI-144 | masjidi.app Kuwait: four tenants (Salmiya, Farwaniya, Bayan, Mina Abdullah) on one national table | platform | undated 366-day scaffold | 18.0 deg / 17.5 deg / Shafi / zero | 100 pc within-1 / 1 | untestable-single-template | provisional |

### South Asia

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / sunrise / margins / rounding / special) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| IN-ACADEMY-70-CITIES | Islamic Academy perpetual city timetables, 70 cities | community | undated perpetual template | 18.0 deg / 18.15 deg / Hanafi / +1 / +4 / dhuhr +1, asr +1, maghrib +4 | 24,768 of 25,200 (98.3 pc); 33 tables perfect / 2 | untestable-single-template | provisional |
| IN-WORKBOOKS-95 | Islamic Academy Excel workbooks, 96 parsed and 95 fitted | community | undated perpetual template | 17.97 deg / 18.06 deg / Hanafi at all 95 / +1 at 37 / +3 at 92 | 82 of 95 hold all six within 1 on 95 pc+ of the year; 51 on all 365 / 2 | frozen-reprint | provisional |
| IN-MOSQUE-23-CITIES | Twenty-three new mosque-tier cities on masjidbox and mawaqit, two dated years each | community | 2 y, 730 rows | 18.0 (most), 18.2 (Jaigahan, Kalamb) / 17.0 (most), 18.0 Hanafi (Asansol), 17.9 (Jaigahan, Kalamb) / Shafi on most, Hanafi on Asansol / zero on most; -1 on the solar three at Jaigahan and Kalamb | 24 tenant-years (23 new cities) at 99 pc or more across all six on BOTH years / 1 | yes | A |
| IN-LUCKNOW-AL-KHIZR | Lucknow, Masjid al-Khizr (mawaqit) | community | 1 y, 365 rows | 18.0 deg / 18.0 deg / Hanafi / +3 | 365/365 / 1 | untestable-single-year | provisional |
| IN-2027-THREE-YEARS-26 | 34 tenant-years of the A-grade mosque layer harvested for 2027 | community | 3 y, 11998 rows | the tenant pair, unchanged / the tenant pair, unchanged / Shafi or Hanafi per tenant | 26 tenants reproduce at 97-100 pc of days | yes | A |
| PK-TAWKIT-453 | tawkit.net Pakistan, 453 cities | platform | 1 y, 365 rows | 18.01 deg / 18.00 deg / Hanafi | 99.5 pc joint within-1; 99.7 pc of cells / 25.5 | untestable-single-year | provisional |
| PK-PLATFORM-3-CITIES | Rawalpindi Jamia Masjid Sector D, Islamabad Jamia Abu Al-Khair, Sialkot Masjid Usman Zulnoorain, plus two candidates | community | 2 y, 730 rows | 18.0 (Rawalpindi, Islamabad, Sialkot); 17.65 (Charg Din) / 18.0 Hanafi (Rawalpindi); 17.0 Shafi; 17.5 (Charg Din) / Hanafi at Rawalpindi, Shafi elsewhere / zero on the three primary tables | Rawalpindi 365/365 all six; Islamabad and Sialkot 344/344 both years / 2 | yes | provisional |
| LK-ACJU-13-ZONES | ACJU 13 zones, twelve monthly tables each, 2025 and 2026 editions | authority | 2 y, 730 rows | 18.75-20.40 by zone / 16.30-18.05 by zone / Shafi / dhuhr +1, asr +1, maghrib +1 on eleven zones; +2 on zones 02 and 13 | 12 of 13 reproduce all six within 1 across a full year / 2 | frozen-reprint | provisional |

### Southeast Asia

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / sunrise / margins / rounding / special) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| MY-JAKIM-59-ZONES-2027 | The 2027 federation: 59 distinct zones, mirror-gated against three publishers | authority | 1 y, 21535 rows | the federal frozen pair / the federal frozen pair / Shafi / zohor +1.5 (Recipe B); the census +2 margins refuted a fourth time | fajr 98.2, zohor 100.0, asar 98.9, maghrib 93.1, isyak 94.8 pc / 880 | untestable-single-year | provisional |
| MY-PERAK-7-ZONES-2027 | Perak 2027: seven zone PDFs, 365 days each, re-fitted through the OCR route | authority | 1 y, 2548 rows | CalculationMethod.Singapore with per-zone ihtiyat / the same method / Shafi / zohor +1.5; zon7 carries the Bukit Larut horizon term (maghrib +6, syuruk -5) / imsak = subuh - 10 on every row; the fajr angle is not separable from a constant at 1-minute resolution | every column but syuruk within 1 on all 364 days in zones 1-6 / 2 | yes | A |
| MY-KELANTAN-ISHA-17 | Kelantan KTN01 and KTN02, isha at 17 degrees | authority | 1 y, 365 rows | as the state table / 17.0 deg / Shafi | 0/365 at 18 deg, 320/365 at 17 deg in both zones | untestable-single-year | provisional |
| MY-HORIZON-ZONES | Pahang PHG05 and PHG06, Sabah SBH06, the horizon-term zones | authority | 1 y, 365 rows | within 1 on the twilights / within 1 on the twilights / Shafi / a horizon dip on the two solar columns only: PHG05 sunrise 0/365 (worst -4) and maghrib 0/365 (worst +4); SBH06 the largest at 8-9 min, on the Kinabalu massif | fajr 344/365 and isyak 330/365 at PHG05 | untestable-single-year | provisional |
| SG-MUIS-4-YEARS | MUIS 2024, 2025, 2026 and 2027 editions | authority | 4 y, 1461 rows | 20 deg ceiling / 18 deg ceiling / Shafi / +1 zohor | high / fajr and isha within-1 every day of all four years / 1 | yes | A |
| ID-SIHAT-209-UNITS | Kemenag SIHAT, 209 second-level units, full 2026 | authority | 1 y, 365 rows | 20 deg + 2 floor / 18 deg + 2 floor / Shafi + 2 / +3 / +2 with the same dip / -2 with a horizon dip / horizon dip 1.76*sqrt(h) arcmin; the two-elevation-field defect is measured over 209 units | 49-51 pc / fajr, dhuhr, asr and isha 100 pc within-1 at all 209 units / 1 | untestable-single-year | provisional |
| ID-KHGT-516-UNITS | Muhammadiyah KHGT, all 516 second-level units, 2026 and 2027 | authority | 2 y, 730 rows | 18 deg + 2 / 18 deg + 2 / Shafi + 2 / +2 / +2 before elevation / 0 / the maghrib pad is an elevation ladder: 2 min at sea level to 8 at 1,500 m, corr(sqrt(elevation), pad) 0.959; slope 0.032 per sqrt(metre), Tunisia's dip coefficient in a second country | the publisher's half-minute floor / one recipe at every unit: four clock columns at exactly +2, single-value histograms / 1 | yes | A |
| ID-MYQURAN-2028-2030 | myquran community feed, Jakarta 2028 whole plus 2029 and 2030 samples | community | 3 y, 366 rows | SIHAT recipe unchanged / SIHAT recipe unchanged / Shafi | 100 pc within-1 on the full 2027 and the 2028 year / 1 | yes | provisional |
| VN-HANOI-AL-NOOR | Hanoi, Masjid Al-Noor (mawaqit) | community | 1 y, 365 rows | 18.0 deg / 17.0 deg / Shafi +1 / -1 | 365/365 / 1 | untestable-single-year | provisional |
| KH-PHNOM-PENH-ALSERKAL | Phnom Penh, Al-Serkal Mosque (mawaqit) | community | 1 y, 365 rows | 18.4 deg with fajr -5 / 17.35 deg with isha +4 / Shafi | 330/365 / 4 | untestable-single-year | provisional |
| LA-VIENTIANE-JAMIA | Vientiane, Jamia Masjid (mawaqit) | community | 1 y, 365 rows | 18.0 deg / 18.0 deg Hanafi / Hanafi / +6 / isha prints nine minutes above 18 degrees: a fixed convention rather than an angle pair | 365/365 / 1 | untestable-single-year | provisional |

### East Asia

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / sunrise / margins / rounding / special) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| CN-DIYANET-222 | Diyanet tree, 222 Chinese cities | platform | 1 y, 365 rows | 18 deg / 16 deg / Shafi / sunrise -7, dhuhr +5, asr +4, maghrib +7 / China and Mongolia are an 18/16 family, not 18/17: the 17-degree isha misses every Chinese city by 4.5 min mean at zero margin | 121 of 222 at 100 pc all-six; median 100.0 / 47.1 (Altay, a summer substitution) | untestable-single-year | provisional |
| CN-NORISLAM-10 | norislam county grid, ten county points | community | undated 2004 computation | 15 deg / 15 deg / Hanafi / 0-1 min on all six columns | MAE 0.25-1.09 across 24.9 N to 53.5 N | untestable-single-template | measured |
| JP-DIYANET-143 | Diyanet tree, 143 Japanese cities | platform | 1 y, 365 rows | 18 deg / 17 deg / Shafi / sunrise -7, dhuhr +5, asr +4, maghrib +7 | 93 of 143 at 100 pc all-six / 84.7 | untestable-single-year | provisional |
| JP-NAGOYA-YEAR | Nagoya Mosque full-year PDF | authority | undated leap-shaped year | 17.95 deg / 17.05 deg / Shafi / +1 / -1 | all-six 91.5 pc; fajr 361/365, dhuhr 365/365, isha 360/365 / 3 | untestable-single-template | provisional |
| KR-DIYANET-40 | Diyanet tree, 40 Korean cities | platform | 1 y, 365 rows | 18 deg / 17 deg / Shafi / sunrise -7, dhuhr +5, asr +4, maghrib +7 | 23 of 40 at 100 pc all-six / 87.7 | untestable-single-year | provisional |
| TW-DIYANET-10 | Diyanet tree, ten Taiwanese cities | platform | 1 y, 365 rows | 18 deg / 17 deg / Shafi / sunrise -7, dhuhr +5, asr +4, maghrib +7 | 9 of 10 at 100 pc all-six / 99.7 | untestable-single-year | provisional |
| HK-MASJIDAL-5-YEARS | Masjidal Kowloon range API, five years | platform | 5 y, 1827 rows | 17.9 deg / 18.5 deg / Hanafi +1 / noon + 5 / sunset + 3 | 2024 is a separate generation at 69.1 pc / 100 pc on all six in 2025, 2026, 2027 and 2028 / 2 | yes | A |
| MO-DIYANET-1 | Diyanet tree, Macau's single city | platform | 1 y, 365 rows | 18 deg / 17 deg / Shafi / sunrise -7, dhuhr +5, asr +4, maghrib +7 | 100 pc / 1 | untestable-single-year | provisional |
| KP-DIYANET-1 | Diyanet tree, Pyongyang's single city | platform | 1 y, 365 rows | 18 deg / 17 deg / Shafi / sunrise -7, dhuhr +5, asr +4, maghrib +7 | 98.6 pc all-six / 3 | untestable-single-year | provisional |
| MN-DIYANET-67 | Diyanet tree, 67 Mongolian cities | platform | 1 y, 365 rows | 18 deg / 16 deg / Shafi / sunrise -7, dhuhr +5, asr +4, maghrib +7 / a summer substitution block May-August: at 47.9-49.5 N the 17-degree twilight never arrives and the publisher clamps (Ulaanbaatar isha 22:34 on 21 June against a 21:02 maghrib) | 0 of 67 at 100 pc all-six; median 58.1 / 37.8 | untestable-single-year | provisional |

### North America

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / sunrise / margins / rounding / special) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| US-33-METROS-CERTIFIED | The 39 us-unresolved fits and the 33-metro US layer, re-run twice under the repaired fitter | community | 3 y, 35313 rows | 15 deg at 26 of 37 verdict surfaces / 15 deg / Shafi on most / mostly zero | 26 of 37 plain ISNA 15/15; 31 of 37 in the 15-family / 4 | yes | A |
| US-NEWARK-REBANK | Newark tenant 8KXm93LM, re-banked under the repaired fitter | community | 3 y, 1096 rows | 14.65 / 14.71 / 14.66 by year / 15.35 / 15.35 / 15.34 / Shafi | 44 fajr, 264 sunrise, 11 dhuhr, 37 asr, 248 maghrib, 20 isha in 2025 / 4 | yes | A |
| US-SALT-LAKE-CITY | Salt Lake City, Madina Masjid (masjidbox) | community | 7 y, 2197 rows | 14.9 deg / 14.9 deg / Shafi | 100 pc on all six / 1 | yes | A |
| US-OKLAHOMA-CITY-NORMAN | Oklahoma City, Islamic Society of Norman (masjidbox) | community | 7 y, 2197 rows | 17.9 deg / 16.9 deg / Shafi | 100 pc on all six / 1 | yes | A |
| US-NORFOLK-CRESCENT | Norfolk, Crescent Community Center (Masjidal keLQEzLM) | community | 6 y, 2191 rows | 14.9 deg / 14.9 deg / Shafi | 100/100/100/100/99.8/100 / 2 | yes | A |
| US-NORFOLK-ASHSHURA-DEFECT | Norfolk, Masjid Ash-Shura (masjidbox), frozen-row tenant | community | 7 y, 2197 rows | 05:35 fixed / 18:13 fixed / 14:38 fixed / 11:49 fixed / 16:59 fixed | five columns frozen for six years while sunrise moves / 106 | no | candidate |
| CA-21-TENANTS-6-YEARS | 21 Canadian tenants x six years (46,011 athan and 48,202 iqamah rows) | community | 6 y, 2190 rows | 18 deg (Alberta), 15 deg (Ontario) / 17 deg (Alberta), 15 deg (Ontario) / Shafi | Alberta 18/17 in 7 of 9 tenants; Ontario 15/15 in 6 of 7, across all six years / 3 | yes | A |

### Central America and the Caribbean

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / sunrise / margins / rounding / special) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| NI-MANAGUA | Managua (mawaqit) | community | 1 y, 365 rows | 15 deg + 0 / 15 deg + 5 / Shafi | all six within-1 / 2 | untestable-single-year | provisional |
| PA-FOUR-TENANTS | Panama City plus Musalla Central, Perejil and Loceria | community | 1 y, 365 rows | 18.5 deg + 2 / as served / Hanafi | all six within-1 on the three new tenants / 2 | untestable-single-year | provisional |
| TT-PRINCES-TOWN | Princes Town mosque | community | 1 y, 365 rows | 15 deg / 15 deg / Shafi / zero on every column | 365/365 on all six / 1 | untestable-single-year | provisional |
| TT-SAN-FERNANDO | San Fernando (masjidbox), seven rows | community | 1 y, 7 rows | as served / as served / Hanafi (Shafi 53 min off) | Hanafi zero; Shafi 53 min off / 53 | untestable-short-sample | candidate |
| SR-PARAMARIBO | Paramaribo, namazvakti | platform | 1 y, 365 rows | 18.35 deg + 2 / 16.75 deg + 8 / Shafi | all six within-1 / 2 | untestable-single-year | provisional |
| BS-NASSAU | Nassau, athanpro month | platform | 1 y, 30 rows | underdetermined / underdetermined / Shafi | every isha angle 14.0-20.0 reproduces at MAE 0.33 with a one-minute offset | untestable-short-sample | candidate |
| TT-CHAGUANAS-DEFECT | Chaguanas mawaqit install, clock defect mechanism | community | 1 y, 365 rows | correct Trinidad events / correct Trinidad events / Shafi / settings blob reads country TT and timezone America/New_York; fitted on the declared clock the four solar columns reproduce at 0.2-0.4 min MAE | correct on the declared clock, exactly 60 min early November to early March / 60 | untestable-single-year | provisional |

### South America

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / sunrise / margins / rounding / special) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| SA-NAMAZVAKTI-4075 | namazvakti.co.uk yearly tables: 4,075 cities across ten countries | platform | 1 y, 365 rows | 18 deg / 17 deg / Shafi / Diyanet temkin per point: sunrise -4 to -7, dhuhr and asr +7 to +9, maghrib +5 to +6, isha +6 to +11 | fajr 100.00, sunrise 100.00, dhuhr 100.00, asr 99.60, maghrib 99.99, isha 100.00 pc within-1 / 99.93 pc of 8,917,266 cells; never more than 2 min / 2 | untestable-single-year | provisional |
| BO-SANTA-CRUZ-RESOLVED | Santa Cruz, mawaqit, re-parsed | community | 1 y, 365 rows | 18.0 deg / 15.9 deg / Shafi | 94.2 / 95.9 / 92.3 / 94.8 / 94.2 / 93.2 pc by column / 6 | untestable-single-year | candidate |
| BO-LA-PAZ-RECLASSIFIED | La Paz, mawaqit install plus the platform year | community | 1 y, 365 rows | as served / as served / Shafi | the install's own rows are Santa Cruz's; the platform pass scores 100 pc at La Paz / 1 | untestable-single-year | candidate |
| VE-MARACAIBO-SHEET | Maracaibo, page ladder against the sheet footer | community | 1 y, 365 rows | +19 on the sheet / +19 on the sheet / Shafi | the Caracas-to-Maracaibo delta measures 19.0/19.0/19.0/18.9/18.7/18.9 min constant over the month | untestable-single-year | provisional |
| AR-CCIAR-2026-09 | Buenos Aires, CCIAR monthly image series, September-October 2026 | community | 1 y, 30 rows | 18 deg / 17 deg / Shafi | 100/93.3/100/100/100/100 pc by column | untestable-short-sample | candidate |
| CL-ARCHIVE-295-SHEETS | Chile's sheet archive: 295 of 327 archived sheets, 2024-2026 | community | 9 y, 4832 rows | 18 deg / 17 deg / Shafi / +6 on every column / the sheet header, not the file name, dates and names the sheet (2024/12/01-Santiago.pdf is Copiapo) | 17 of 18 cities at or above 92 pc on fajr / 4 | yes | A |
| SA-MAWAQIT-17-YEARS | Seventeen new mawaqit year tables: Lima x2, Guayaquil, Buenos Aires, Cordoba, Mar del Plata, Sao Paulo, Vitoria, Caxias do Sul, Aruba, Monterrey, Panama x3, Santiago | community | 1 y, 365 rows | as each surface states / as each surface states / Shafi | all six within-1 on the clean tenants / 3 | untestable-single-year | community |

### Oceania

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / sunrise / margins / rounding / special) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| OC-DIYANET-20-CITIES | Diyanet tree, twenty Oceania cities in nine countries | authority | 1 y, 365 rows | 18 deg / 17 deg / Shafi / -4.6..-5.1 / -6.8..-7.1 / +6.9..+7.5 / ZERO twilight margins / the solar columns carry the publisher's own margins: sunrise +7, dhuhr -5, asr -4, maghrib -7 | 18 of 20 at 365/365 on both twilights / 2 | untestable-single-year | provisional |
| AU-MOSQUE-55-SURFACES | 55 Australian mosque surfaces: 29 masjidbox, 23 mawaqit and 3 masjidal | community | 3 y, 371 rows | 18 deg at 43 of 95 surfaces / 17 deg at 43 of 95 / Hanafi at 22 | 43 at 18/17 on both twilights at 95 pc+; 14 another pair; 38 below 95 pc / 106 | untestable-single-year | community |
| AU-MASJIDAL-3-TENANTS | Southport Masjid (Gold Coast), Shepparton Albanian Islamic Society, Ravenhall Masjid Ar-Rahma | community | 3 y, 1096 rows | 18 deg / 17 deg / Shafi / zero at Southport and Shepparton; maghrib sunset+1 at Ravenhall | 1,096/1,096 on all six at both clean tenants / 1 | yes | A |
| NZ-16-YEAR-SURFACES | Thirteen masjidbox and three mawaqit year surfaces across eight towns | community | 1 y, 371 rows | as each surface states / as each surface states / Shafi or Hanafi | solar columns honest on five; dhuhr is a clock 27-45 min after noon on the Auckland pages / 45 | untestable-single-year | candidate |
| FJ-FML-2026-WIDGET | Fiji Muslim League 2026 whole, from the league's own widget | community | 1 y, 365 rows | 18 deg / 17 deg / Shafi / zero | 365/365 on all six; asr 221/365 at the one-minute floor / 1 | frozen-reprint | provisional |
| FJ-SUVA-AL-HAQQ | Suva, Masjid al-Haqq (masjidbox athany walk) | community | 2 y, 384 rows | 18 deg / 17 deg / Shafi / fajr, maghrib, isha, sunrise zero; fixed jamaat margins dhuhr +65.5, asr +46 | 384/384 jointAllFive / 1 | yes | provisional |
| WS-APIA-DIYANET | Apia, Diyanet tree | authority | 1 y, 365 rows | 18 deg / 17 deg / Shafi / sunrise +7, dhuhr -5, asr -4, maghrib -7 | 365/365 on both twilights / 1 | untestable-single-year | provisional |
| TO-NUKUALOFA-DIYANET | Nuku'alofa, Diyanet tree, date-line surface | authority | 1 y, 365 rows | 18 deg / 17 deg / Shafi / sunrise +7, dhuhr -5, asr -4, maghrib -7 / the rows are six hours ahead of UTC; a plain reading puts every column ten hours late and scores 0/365 | fajr 306, isha 297 / 365/365 once the local-date instant is selected / 1 | untestable-single-year | provisional |
| NC-NOUMEA-3-SURFACES | Noumea: mawaqit 365, Diyanet 365 and masjidway March-June 122 | mixed | 1 y, 365 rows | 18 deg / 17 deg / Shafi | masjidway 122/122; mawaqit and Diyanet 365 each / 2 | untestable-single-year | provisional |

### Platforms, matrices and cross-engine

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / dhuhr / maghrib / sunrise / margins / rounding / special) | Scores (exact / within1 / worst) | Span verdict | Grade |
|---|---|---|---|---|---|---|---|
| TAWKIT-COUNTRY-73 | tawkit.net walked whole: 8,709 city pages, 75 countries, 3,177,878 dated rows | platform | 1 y, 365 rows | 18.0 in 41 of 73 countries / 17.0 in 30; maghrib + 90 or + 91 in 14 / Shafi in 63 of 73; Hanafi in 10 / 37 of 73 countries need none / engine is PrayTimes 2.3 (served file captured, 16,064 bytes) at GeoNames points; the 3.18M rows are one engine replicated across 8,709 settlements and are regenerable, so they stay archive-only | 61.5 pc of cells / 88.5 pc of all cells within 1 min; 61.5 pc exact; 65.2 pc of rows joint within-1 / 509.1 (Bodo's asr) | untestable-single-year | provisional |
| MASJIDI-495-TENANTS | masjidi.app tenant layer completed: all 495 tenant screens, 468 table tenants over 167 tables | platform | undated 366-day scaffold | per-country family (Saudi 18.42, Jordan 15.04, Egypt 19.54, Oman 18.53, Morocco 19.51, Algeria 18.31, Syria 18.19, Indonesia 19.40, Malaysia 17.89) / per-country family; Saudi maghrib + 90 (25/25) / Shafi everywhere (fitted factor 0.97-1.08) / a THIRD engine: precise ephemeris, sun evaluated once per day at 0h UT, per-region rise-set margin 0.1-3.6 min, integer output, no DST steps; the summer rule is three mechanisms, one per country (MA-NO-SUMMER, MA-SE-SUMMER, MA-BE-SUMMER) | 62-98 pc by country family / 167/167 fit at median 0.54 min RMS and median 93 pc within-1 / 4 | untestable-single-template | community |
| MASJIDAL-216-CERTIFIED | masjidal.com 216-tenant pool, an 18-tenant x 3-year sample re-run in full | platform | 3 y, 1096 rows | per tenant / per tenant / Shafi mostly | seven tenants zero margins at 100 pc / 18 of 18 out files identical field for field; twelve within 0.03 deg over three years / 2 | yes | A |
| DIYANET-TREE-207 | Diyanet tree: 209 countries, 365 provinces, 18,582 cities; 12,081 city ids captured | authority | 1 y, 30 rows | 18 deg / 16 or 17 by latitude family / Shafi / 105 countries EXACT on imsak 0 / sunrise -7 / dhuhr +5 / asr +4 / maghrib +7 / isha 0; 61 within-1; 41 form a latitude ladder / above 44 N the imsak amplitude reaches 130 min: a summer substitution, not a country margin; none of adhan's three fallbacks reproduces it | 105 exact on the canonical block, 61 within-1 / 3 | untestable-single-year | provisional |
| ENGINE-CONSENSUS-184 | Five calculator families measured against adhan 4.4.6 at one crosspoint per country | matrix | 1 y, 30 rows | 163 of 184 countries within 1 deg (0.5 in 158) / 131 of 184 within 1 deg / schools dispute: pakistan 55.1, uzbekistan 53.5, kyrgyzstan 53.0, kazakhstan 52.5, grenada 62.3 (percentage of residual explained) / sunrise differs by more than 4 min in 178 countries, maghrib in 175, dhuhr in 169: the geometry is one convention, the printed margins are not | crosspoint offsets reproduce the measured per-city medians to 0.1 min median, p90 0.2-0.7 / 0.7 (p90) | untestable-short-sample | measured |
| CAPITALS-49-UPGRADE | The 49 athanpro-only capitals, upgraded where a dated surface exists | matrix | 2 y, 385 rows | per capital / per capital / Shafi | Suva 384/384 jointAllFive; Victoria 29/29; Roseau 94.9 pc; Tripoli 94.5 pc; Bratislava, St George's and Castries are half-hand-set boards / 88 | untestable-short-sample | provisional |

## Flags carried, never adjudicated

| Flag | Item | Entry | State in this index |
|---|---|---|---|
| F-US-CN-18-16 | United States and China sit on 18/16 | DIYANET-TREE-207; ENGINE-CONSENSUS-184; CN-DIYANET-222 | Diyanet's ALONE. China exactly 18.00/16.00; athanpro 18.00/17.05; tawkit an interval in China and no single recipe in the US. The latitude slope of the residual vanishes at 16.0, and 17.0-with-minus-5-min cannot be separated by bias alone. Both readings recorded |
| F-IRAN-MAGHRIB | Iran's maghrib is a 4.5-degree depression | IR-PISHKHANAK-44; ENGINE-CONSENSUS-184 | NO family among the five carries it. A fixed sunrise offset reproduces 64.3 pc of cells, the depression 100 pc. tawkit's Iran layer instead prints an isha row the national print does not carry |
| F-SA-RAMADAN | Saudi Ramadan +120 | SA-GRID-225-POINTS; MASJIDI-495-TENANTS | masjidi ALONE reproduces it (25 tables, 31 days); tawkit holds a flat +90. Exactly two interval values, zero violations in 232 point-years |
| F-TAWKIT-ISHA | tawkit's two isha conventions | TT-AFRICA-8565; YE-TAWKIT-313; SY-TAWKIT-287-INTERVAL; ENGINE-CONSENSUS-184 | 292 of 571 African cities print maghrib + 90 exactly; 279 carry an angle of 16.85-17.25. The split is by country and, inside DR Congo, by city. The 22-degree clamp the earlier fit reported is a fitter bound, never a publisher value |
| F-CHAGUANAS | Chaguanas timezone defect | TT-CHAGUANAS-DEFECT | STILL LIVE. The settings blob reads `country: TT` and `timezone: America/New_York`; the platform computes correct Trinidad events and renders them on New York's offset, exactly 60 minutes early November to early March. One-line fix, nothing in the recipe moves |
| F-HTML-PDFS | thirty captures saved as `.pdf` are HTML error pages | no entry: a capture-integrity item | Every "unfitted" verdict on those thirty is a capture failure, not a surface verdict. The OCR block raised it for the close; the index carries no fit for them and claims none |
| F-MAWAQIT-YEAR | `?year` is a relabel | AF-MAWAQIT-WEST-BOARDS; IS-NINE-CITIES; SA-MAWAQIT-17-YEARS; NC-NOUMEA-3-SURFACES | 25 of 25 surfaces, zero exceptions: 2027 returns the 2026 table with 0 of 365 cell differences and 2028 returns 404. In o1m-R5 the trap sharpened: `?year=2027` now rewrites the DATE COLUMN while every value stays identical, so a payload-date check passes and only a value diff gates it |
| F-DIYANET-150 | the city-postback defect | DIYANET-TREE-207; DI-8-FALLBACK-SECOND | The old host returns one shared 150-row table carrying no location at all (Colorado and Hawaii agree to the second); a genuine table is 30 rows. On the current host the selects are filled client-side and 8,539 of 8,539 non-grid cities banked with 12,081 distinct digests. The 150-row count is the detection test |
| F-KUWAIT-NO-AXIS | Kuwait has no governorate axis | KW-MASJIDI-144 | All four Kuwaiti tenants sit on one national table (id 144) at 18.0/17.5 zero margins. Only mosque-side offsets exist. Hawalli, Jahra and Ahmadi still have no authority surface |
| F-KDH07 | KDH07 reproduces on no angle pair | MY-HORIZON-ZONES | Unresolved. The best pair (19/19) still leaves 110 fajr days and 171 isha days out. Flagged, not adjudicated, not fitted |
| F-FITTER-A53 | the after-midnight isha bug | US-33-METROS-CERTIFIED; US-NEWARK-REBANK; MASJIDAL-216-CERTIFIED | CLEARED by re-run, not by assertion. 39 US fits twice and 54 masjidal tenant-years reproduced field for field; the one stale pre-fix artifact is named |
| F-DIYANET-SUMMER | Diyanet's high-latitude block matches none of adhan's three rules | EU-DIYANET-16-ISHA-SPLIT; DIYANET-TREE-207 | At Lodz on 21 June the table prints 02:51/22:27 against adhan's 00:43/00:44, 03:20/22:07 and 02:11/23:09. Those days are counted as clamped and excluded from the angle score |
| F-MASJIDI-SUMMER | the masjidi summer rule is three mechanisms | MASJIDI-495-TENANTS | MA-NO-SUMMER (fajr = min(P, sunrise - 60) inside a date gate), MA-SE-SUMMER (a continuous night portion), MA-BE-SUMMER (the same form, larger share). Pooling them across a summer window cannot succeed |
| F-ICELAND-ISHA | Iceland's isha moved between the held year and the forward year | IS-NINE-CITIES | The held 2026 file carries maghrib +122..+128 in January; the association's own 2027 page and its written statement give +90 exactly. Either the rule moved or the two files have different builders. The two years are NOT pooled |
| F-TAWKIT-YEAR | tawkit serves one eleven-month forward window | TAWKIT-COUNTRY-73; SY-TAWKIT-287-INTERVAL; IQ-TAWKIT-145 | 2027 exists for months 01-10 and answers 11 and 12 with the previous year's same month, silently, from the served title. The harvest gates on the title, never the URL |

## Conflicts

Conflicts are carried, never resolved here. The round's own additions sit beside the inherited ones.

| Entry | Parties or readings | State |
|---|---|---|
| IR-PISHKHANAK-44 | pishkhanak 17.70/14.00 with a 4.5-degree maghrib against tawkit 17.45/18.00 | two conventions, both internally exact; neither merged |
| SY-TAWKIT-287-INTERVAL | the record's 18/18 pair against 4,380 rows of maghrib + 90 | the interval reading governs; the pair was a fit with no interval in its model |
| SA-GRID-225-POINTS | tawkit's flat +90 against the authority's Ramadan +120 | both carried; masjidi is the only family reproducing +120 |
| SA-GRID-225-POINTS | six Maldivian forward years read as span | they do not differ at all; no span exists |
| OM-MARA-86-CITYIDS | 18/18 +5 against the platform's 18/17 | two Omani lines, kept apart |
| IQ-TAWKIT-145 | Diwan 18.1/16.9 with +1/+5/+3 against the platform 18/17 zero | two Iraqi lines |
| JO-TAWKIT-142 | two regional families, maghrib +6 or +7 | never one national margin; now measured on the authority grid and the platform |
| LB-MASJIDI-16-TABLES | one reference point in the Beirut-Sidon corridor against a per-tenant offset layer | Beirut 76.9 and Sidon 77.1 are within noise; Tyre 66.0 is out |
| PS-TAWKIT-25 | Rafah 63.6 and Tulkarm 82.0 against 99.4-100 elsewhere | carried as publisher deviations |
| QA-MINISTRY-3-YEARS | the ministry's +90 against masjidi table 164's 20.1-minute interval | two Qatari lines |
| KW-MASJIDI-144 | a governorate axis assumed | none exists on the platform |
| BH-ZUBARAH-REGIME | isha = maghrib + 90 (the old reading) against astronomical twilight with a 74-minute floor | the regime is dated 2021-08-09; both states recorded |
| IN-MOSQUE-23-CITIES | isha 17 against isha 18 | 19 of 43 mosque tables at 17, all 70 publisher tables at 18; the 17-degree reading sits 4.22-5.12 min earlier and correlates 0.978 with latitude. A tier line, not a national one |
| IN-WORKBOOKS-95 | the workbook read as a new layer | it is the PDF's own generation reprinted: 52 of 54 paired cities agree every cell within 1, median 80.3 pc exact |
| PK-TAWKIT-453 | tawkit's 18/18 Hanafi against the printed chart family (18-18.5/18 with per-city margins) | two Pakistani objects; the charts still blocked with cause |
| LK-ACJU-13-ZONES | the 2025 edition read as a second year | 62 overlapping days identical on every column: one generation relabelled |
| MY-JAKIM-59-ZONES-2027 | the round's premise that 2027 subuh moved nationally | overturned: 56 zones did not move (means within 0.05 min); the -1.3 min belongs to Jawi and Selangor, whose reference point moved about 0.3 deg south with the pair frozen |
| MY-HORIZON-ZONES | PHG05/06 and SBH06 against a plain angle fit | a horizon dip on the two solar columns only; KDH07 reproduces on none |
| ID-KEMENAG-38 vs ID-KHGT-516-UNITS | Kemenag 20/18 +2 against KHGT 18/18 +2 | two national lines, 8 min apart on subuh at every one of 209 common units |
| CN-DIYANET-222 | the record's China FALLBACK and the 18/17 form label | 18/16 confirmed, 18/17 refuted at every city |
| HK-MASJIDAL-5-YEARS | five years on one recipe | 2024 is a separate generation at 69.1 pc; 2025-2028 carry one recipe |
| US-NORFOLK-CRESCENT vs US-NORFOLK-ASHSHURA-DEFECT | one city, two tenants | one computed, one a frozen hand-entered row repeated for six years |
| CA-21-TENANTS-6-YEARS | one Canadian line | two: Alberta 18/17, Ontario 15/15; six Alberta tenants missed the 2026 fall-back |
| BO-SANTA-CRUZ-RESOLVED | the "unreproducible sun columns" | a parser column offset, not the publisher: a seven-value calendar read as six |
| BO-LA-PAZ-RECLASSIFIED | La Paz's install read as a La Paz table | it serves Santa Cruz's table, 365 days byte-identical, 15 degrees of longitude apart |
| VE-MARACAIBO-SHEET | the page ladder +09 against the sheet footer +19 | the sheet governs; the page is defective at one city of ten |
| CL-ARCHIVE-295-SHEETS | the file name as the sheet's identity | the header governs: 2024/12/01-Santiago.pdf is Copiapo |
| FR-MAWAQIT-19-FROZEN | France as a seasonal sweep | nineteen of twenty surfaces carry a frozen pair; the sweep is Strasbourg's own block plus an averaging artefact |
| CY-NORTH-ARCHIVE | two editions read as two years | two engine generations in an A-B-A-B pattern, 100 pc at a segment's own constants and 0 pc at the other's |
| RU-CDUM-171-CITY-YEARS | the record's single CDUM line | four dated rule forms, one of them a fixed-interval edition (fajr = sunrise - 120, isha = maghrib + 90) |
| PT-CIP-13-CITIES | Portugal's held Lisbon/Coimbra/Porto rows | thirteen cities on one recipe; the Azores row sits on UTC-1 |
| GB-UK-FULL-YEAR-6 | Milton Keynes and Swansea read as two recipes | one construction, offset by 3.2 degrees of longitude |
| IS-NINE-CITIES | the 2026 isha claim | cannot hold against a published maghrib + 90 interval; the years are not pooled |
| GL-NUUK-DIYANET | a Greenland table | computed near 61 N on a UTC-3 clock: 59.58 min solar gate, day length 7h06 against 6h16 |
| TT-CHAGUANAS-DEFECT | a table fault | a timezone field: the events are Trinidad's, the offset is New York's |
| EG-IMSAKIYA-245 | the R3 hand transcription | Alexandria 1445 dhuhr is 12:05, not 12:06; the page image governs |
| CI-COSIM-3-EDITIONS | the fixed 13:00/16:00 clock as a mosque habit | the council prints it as doctrine; the parameters still moved 0.85 deg between 1436 and 1448 |
| TT-PLATFORM-10-COUNTRIES | the monthly endpoint as any-year | 2026 only for its cities; O1m-1's note is narrowed by O1m-4 (later governs) |
| DI-8-FALLBACK-SECOND | turktakvim against Diyanet on isha | fajr agrees within 1 min in all seven shared settlements; isha runs +7 min at 4-22 deg and +9 at Ashgabat. Both carried, no blend |
| DERIVED-SPAN | Kazakhstan's 48 N switch read as a date rule | latitude-only, at exactly 48.000000, no date term in 9,861 settlement-days |

## In flight at the close

These waves have NOT returned and contribute no entry. Their artifacts are on disk and are named so
the next cut starts from what exists.

| Wave | State on disk | What is banked |
|---|---|---|
| o1m-28-pakistan | 196 files, `fit/pakistan-family-fit.txt` and `fit.js`, no REPORT.md, no CONSOLIDATION block | A raw chart fit exists for Rawalpindi, Faisalabad and Sialkot (18/18 Hanafi, 310/365, 309/365 and 101/365 all-six). It is NOT an entry here: the wave has not returned and the OCR block records the chart digits as unreadable at 14 px. The two blocks disagree and the later (OCR, 12:2x) governs the reading question |
| o1m-29-kaznational | 166 MB, REPORT.md whose §2 pull, §3 crossers, §4 fits, §5 residual and §6 second year are marked PENDING | The 5,694-entry gazetteer is parsed (18 duplicate coordinate groups, 175 districts, 5,676 distinct coordinate strings). No fit yet, so no entry; KZ coverage is carried by KZ-96-SETTLEMENTS and KZ-SPAN-RE-DERIVATION |
| o1m-30-maghreb | 293 MB, `pages/`, `data/`, an empty `fit/`, no REPORT.md, no block | Tunisia and Algeria sweep work is under way (tn-sweep.py through tn-sweep5.py, dz48 parsers). No stated recipe, so no entry; the Maghreb entries stand as round two wrote them |
| o1m-31-indonesia | 53 MB, 771 files, `fit/` with drift, leap, recipe, myquran and coverage JSONs, no REPORT.md, no block | Banked measurements exist (drift per year and seasonal, leap-and-relabel, myquran aggregate and margins, a 2028 comparison). No report states a recipe, so no entry; Indonesia is carried by the SIHAT and KHGT entries |
| o1m-32-caappeal | 1,060 files, Central Asian JSON captures, no fit directory, no REPORT.md | Capture-only. No entry |
| o1m-35-lupt | 87 files, LUPT captures and eight fit scripts, no REPORT.md | Scripts and captures, no stated fit. No entry |
| o1m-33-index, o1m-34-wtdiff3 | opened, empty | Support waves with no artifact at this cut |

**Returned with a report but no CONSOLIDATION block:** o1m-27-gulf and o1m-29-kaznational. For
o1m-27 the report governs and its entries are in this index; the block is a digest, not the measurement.

## Not fitted

Surfaces captured with no recipe this round, and the negative that closes each at these terms. No
negative here is a closure of a country.

- **Bangladesh**: the 68-band district artifact and the IFB notices; every channel publishes a newspaper image or a Facebook post. Searched Bengali and English.
- **Pakistan's printed chart family**: Faisalabad, Hyderabad PK, Gujranwala, Sargodha, the Rawalpindi full year, the Peshawar and Quetta charts; image-only PDFs at 14 px.
- **Switzerland**: no dated rows (IZRS login-walled), unchanged from round two.
- **Iran's authority print**: calendar.ut.ac.ir answers a Cloudflare interstitial; time.ir has no prayer section; aviny is postback-only and self-declares plus or minus 3 minutes. Persian and English.
- **Syria's ministry**: awqaf.gov.sy NXDOMAIN; moa.gov.sy a certificate error; no table on the news agency.
- **Lebanon's Dar al-Fatwa**: neither domain resolves, and the 16 platform tables stay undated.
- **Bahrain's stated angle**: no public statement; the Waqf page carries embedded files, 0 tables and 0 time strings in 311 KB.
- **Iraq's Ja'fari shrine line**: no public dated table; Najaf and Karbala are separate undated objects.
- **Kuwait's governorate layer**: Hawalli, Jahra and Ahmadi have no surface; four tenants, one table.
- **Armenia**: Yerevan's Blue Mosque publishes no timetable in Armenian, Russian or English; tawkit's 18 cities remain the only surface and tawkit is parameter-blind.
- **Turkmenistan's authority**: no muftiate site resolves; the Diyanet tree is the substitute.
- **Mongolia's authority and its summer clamp**: no Mongolian-language table; the clamp is flagged, not modelled.
- **Greece, Thrace**: the muftiates time out behind a third-party widget; Thessaloniki, Rhodes and Kos have no authority surface.
- **Bosnia's IC sheet and Croatia's Rijeka PDF**: OCR-defeated and 403 respectively.
- **Kosovo 2027**: untouched.
- **Estonia**: resolved as a client-side calculator (15/15 plus a night portion, year clamped 2024-2100); the "built-in CSV" is browser-generated, never served.
- **Slovenia**: the feed ignores month, year and date and returns the same 2026 calendar.
- **Denmark**: salah.dk is today-only and Khair al Bariya's history API 404s.
- **Austria**: the 2029 correction is declaration-only; the workbook is a 2026 single sheet.
- **Luxembourg, Belgium, Iceland's two towns**: 2027 requests 404 or return "Unknown city"; the surfaces stand as held.
- **France's GMP Paris and UCOII**: a Wix page with zero tables and JS shells.
- **Ireland, Chile, Fiji, Morocco**: December accrual probes 404 or re-serve the prior month.
- **Thailand's BE 2570, Brunei's 2027, the Philippines at authority tier, the Philippines' BARMM**: not published at these terms; NCMF 403, Davao image-only.
- **Indonesia at Kemenag**: the ceiling is 2026-12-31.
- **New Caledonia 2027 and Tonga year two**: current-year-only routes and a 503 Wayback endpoint.
- **Palikir, Ngerulmud, Tegucigalpa**: enumeration closed at every platform that exists today.
- **Majuro, Nauru, Tuvalu, Tokelau, Cook Islands, FSM, Solomon Islands**: no tenant and no dated table under the languages named.
- **Hobart and Cairns**: a today-only block and an iqamah-only place page.
- **Tallahassee**: every route ends at an iqamah board.
- **Ceuta and Melilla, Monaco, the Faroe second month, Greenland beyond Nuuk, Finnmark's towns, Oulu, Rovaniemi**: named, no dated table.
- **The four Egyptian ESA options that render empty all year**: unchanged.
- **The sixty Oman CityIDs with no published point**: banked as rows on recovered points, recorded provisional and NOT claimed as city attributions.
- **The sixteen 1446 Egyptian pages printing cities the select does not carry**: recorded, not fitted.
- **Cambridge's annual poster**: cracked by a 3x2 panel split, 3,895 cells read, row assembly outstanding.
- **Melaka 1446**: 605 clean OCR rows, dates open (OCR drops the printed day on a third and a monotone walk mis-bound most).
- **The named unreadable posters**: Rawalpindi and Faisalabad perpetual charts (14 px digits), Rangamati (no glyphs at any rotation), Perlis 1448 and Melaka 1448 bodies.

## Provenance

Every figure is traceable to the block or report named in the entry's `source_workspace` and to that
wave's workspace under `$HOME/athan-gitree/census/o1m/`. The register is the digest, the report is the
measurement, and where they differ the report governs. No web access, no subagents, nothing under
`/tmp`, and the repository was not touched.
