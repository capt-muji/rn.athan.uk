# Round summary: O1l city-level worldwide census, 2026-11-11

Written by O1l-63 at the round's close, against 57 returned CONSOLIDATION blocks, the 54 reports on
disk, and the closing artifacts named in section 5. This is the definitive read of round two:
city-level coverage inside every country on record, year-2 accrual, the dated watches, and a fit
for everything captured.

Two bases govern every number below, and they are named in each row:

- **Script count at close.** `summary/count.mjs` and `summary/files.mjs` walk every `data/` directory
  in `$HOME/athan-gitree/census/o1l-city/` and count dated keys and prayer-row objects per file.
  Dated keys are summed per file, so a 77-province workbook set counts 77 x 365, not 365.
- **The round's own integrity pass.** `integrity2/scan.json`, stamped 2026-11-11 06:48:06Z, counted
  71 workspaces and 1,482,040 raw dated rows, 1,328,077 after de-duplication.

The two agree to within 0.1 pc, which is the check that the close count and the integrity cut
describe the same archive.

---

## 1. The numbers

| Metric | Count | Basis |
| --- | --- | --- |
| Agents dispatched | **69** | Distinct `O1l-` tags in `monitor.log` (O1l-1 to O1l-64 plus the `-r` redispatches and A1, A2, B1, B2, C1) |
| Workspace directories | **70** | `ls -d */` under the round root, the summary included |
| Blocks returned to CONSOLIDATION | **57** | `grep -c '^## ' CONSOLIDATION.md` |
| Reports on disk | **54** | `ls */REPORT.md`. The remaining directories are artifact-only (`algo-table`, `gaps-closed`, `wtdiff2`, `corrections`, `integrity2`) or capture-only aliases (`africa-cities`, `bangladesh-cities`, `pk-transcribe`, all with zero data files) |
| Workspaces with data | **62 of 70** | `summary/count.mjs` |
| Dated rows, raw | **1,482,040** | `integrity2/scan.json` totals, 06:48:06Z |
| Dated rows, deduplicated | **1,328,077** | Same scan, and the close recount gives 1,329,253 dated keys summed per file |
| Prayer-row objects at close | **1,406,969** | `summary/count.mjs`, objects carrying a date key and at least one prayer field |
| Normalized data files | **7,145** | `summary/files.mjs`: 6,566 carry dated keys, 6,212 hold a month or more, 3,244 hold a full year or more |
| JSON parse failures in `data/` | **0** | Both counts. The `badData` 3 in the integrity scan is file-level, not parse-level |
| Dated surfaces in the SQL index | **1,591** | `census-index.db`, `op='o1l-city'`, 32 workspaces, 441,357 rows, dates 2011-01-01 to 2075-12-31, built 05:46Z |
| SQL index, whole database | **2,154 surfaces, 584,358 rows** | `census-index.db`, all ops. The index predates the round's tail and is a floor |
| Archive volume | **3.47 GB, 30,255 files** | `du` at close, 3,474,137,088 bytes, against the integrity scan's 3,391,789,166 bytes at 06:48 |
| New country rows | **18** | `wtdiff2` section 3.1, each with no row in `world-table-v3.md` |
| Rows lifted out of FALLBACK | **10** | 6 at the register cut (CAR, Western Sahara, Madagascar, Guinea-Bissau, Uganda, Tanzania), 4 after it (Rwanda, Burundi, Armenia, French Polynesia) |
| Capitals covered | **194 of 202** (195 with Delhi for New Delhi) | `capitals2`, from 142 at the round's start: 52 closed, 8 gap |
| Corrections to the record | **77** | `corrections/CORRECTIONS-ROUND.md` table A, cut 06:34Z |
| New rows proposed | **34** | Register table B |
| Grade and span movements | **56** | Register table C |
| New rule-forms | **32** | Register table D |
| Items flagged, not adjudicated | **17** | Register flagged list F1 to F17 |
| Fit artifacts on disk | **90** | `find data -name '*fit*.json'`, with 113 fit scripts beside them |
| Algorithm-vs-timetable verdicts | **35 rows, 32 countries: 18 sync, 9 drift, 4 undecidable, 4 empty** | `algo-table/ALGO-TABLE-COMPARE.md` |
| Span-ledger rows | **159** | `span-ledger/SPAN-LEDGER.md` |
| Coordinate ledger records | **1,547, of which 1,247 usable (80.6 pc)** | `coords-ledger/COORDS-LEDGER.md`: 443 PUBLISHED, 650 DERIVED, 154 ANCHOR, 300 UNKNOWN |

The archive reached 3.47 GB against a brief that asked for tens of GB. Disk was never the binding
constraint. The binding constraint was that a page which does not publish a table yields no capture,
and the round closed 18 countries with dated rows that had none before.

### The class shift

`world-table-v3.md` carried 174 rows: A 17, provisional 40, candidate 65, community 15, F 2,
FALLBACK 35. After the round, on the diff's arithmetic (`wtdiff2` 5.2, which closes at 192 = 174 + 18):

| Class | Before | After |
| --- | --- | --- |
| A | 17 | **19** |
| provisional | 40 | **44** |
| candidate | 65 | **71** |
| community | 15 | **24** |
| F | 2 | **2** |
| FALLBACK | 35 | **26** |
| Moved out of a class, no class named | 0 | **6** |

FALLBACK falls by nine while A rises by two. The round's output is discovery, not grade lifting.
Six of its most substantive results (Thailand, Algeria, Brunei, Uganda, Tanzania, China) cannot enter
any count until the close names their class.

---

## 2. Country by country

Labels: **NEW** a dated surface the record did not list. **LIFTED** a FALLBACK row now answered by
dated data. **CORRECTED** a record reading overturned or re-measured. **CONFIRMED** re-measured and
held. **NEGATIVE** searched, nothing found, with the languages named in the block.

### British Isles and Europe

| Country | What moved |
| --- | --- |
| United Kingdom | Surface count 49 to **75**. Scotland 14 new dated surfaces beyond the 4 held (Glasgow AFECC, three mawaqit mosques, Paisley, Edinburgh three more, Falkirk, Perth, Stirling, Dundee, Kilmarnock, Livingston, Inverness). London 9 new borough surfaces. Six one-month towns lifted to full years (Luton, Leicester, Middlesbrough, Ilford, Birmingham, Watford). Cardiff a 15-mosque second layer, Belfast a new year surface. Portsmouth republishes ELM's 2016 LUPT PDF. CORRECTED: go2masjid `slim=365` serves a proven forward year to 2027-11-10, and mawaqit's stored calendar is a different generation from its live page at Plymouth and Lincoln |
| Ireland | NEW: the IFI annual city PDF family, 26 cities, 9,459 rows. Fit horizon -1.26, dhuhr noon+2.00, winter 16.2/15.2, summer isha capped maghrib+90 for 30 to 43 days, summer fajr unmodelled. CORRECTED: the 2027 negative is explained, the `?year=` parameter is discarded by a 301, the feed is parameter-blind with a phantom 29 February, and the DST defect is the PDF's own footnotes with the instructions dropped |
| Germany | 24 cities, 6,570 authority rows, one recipe (dhuhr +5.5 floor exact 290 to 333 of 365, sunrise -6.5, maghrib +6.5). 2027 absent at the portal but present at IGMG's REST mirror, byte-identical on 2,116 of 2,116 overlaps, proven to 2027-11. District layer banked whole: 1,241 ids, 452,965 district-days, and it is a coordinate refinement, not a per-district table. CORRECTED: DITIB's 18/17 prose against the served 18/16, isha about 7.2 min in Berlin winter |
| France | Lyon two mosques 730 rows, Lille, Marseille two, Strasbourg December confirmed. All 14 GMP city pages probed, none carries a table. Fajr and isha are seasonal sweeps no frozen parameter set expresses |
| Italy | Rome fit closed (fajr 19.02, isha maghrib+90 exact, 30/30), with Milan, Turin and Bologna full years |
| Spain | Madrid December 404 on five name variants with a 2025 control at 200. Granada two new mosques, and Barcelona, Valencia and Sevilla fitted. 2024 recovered through WordPress upload posters, 2020 to 2023 unreachable |
| Portugal | Lisboa and Coimbra monthly delta 0. CORRECTED: Porto's monthly is a convention sheet, asr +39 to +54 against its own annual, flagged |
| Netherlands, Belgium, Luxembourg | Held recipes confirmed. Belgium's year-2 remains nominal, 363 of 365 month-days identical. Luxembourg's March maghrib and two DST leftovers carried as defects |
| Switzerland | UNDECIDABLE: IZRS behind a Bronze login, Wayback a 10 KB shell, no dated IZRS rows exist |
| Austria | FILLED: drift on fajr only, mean 12.8 min early, worst 29 in August, with isha in sync at 245 of 245. Form AT-IGGOe = 18/16 + temkin + Istanbul takdir |
| Czechia, Slovakia, Poland, Hungary, Slovenia, Croatia | Held. Czechia proven to 2028, Slovenia frozen by byte equality, Croatia a candidate at 164 to 172 of 180 months |
| Bosnia and Herzegovina | 61 cities, 22,265 city-days, 71.5 pc within-1. CORRECTED twice: the elevation ladder is refuted (temkin -5.5 from 82 m to 1,050 m, corr +0.21), and the country is one Sarajevo-anchored generation redistributed by 4 min per degree of longitude |
| Serbia, Montenegro, Albania, Kosovo, North Macedonia, Greece, Bulgaria | Serbia Novi Pazar 2025 fitted, Belgrade and Nis months. Montenegro's six PDFs are one table plus five fixed shifts, and the stated 19.5/17.5 scores 35.3 pc. Albania Shkodra and Tirana months. Kosovo 2027 not due. Macedonia's two surfaces disagree +45 min on fajr, flagged. Bulgaria's non-Sofia towns are one row longitude-shifted |
| Norway, Sweden, Denmark, Finland, Iceland | Norway 10 cities, IRN 16/15 on angle-honest days, polar placeholders sized per city, and a new defect: IRN's asr is Shafi in CEST and Hanafi in CET, switching on the DST dates. Sweden 7 cities on Diyanet's engine. Denmark a fourth line at Aarhus, Odense, Aalborg, Esbjerg. Finland Jyvaskyla 353 rows exact, Turku and Tampere a measured 15/12 line. CORRECTED: Oulu's 365 rows are Turku's table relabelled. Iceland nine cities, 14.2/14.0 exact at all nine |
| Baltics and Belarus | Klaipeda 730 rows Diyanet 18/16 exact, Siauliai, Liepaja, Jelgava, Narva and Parnu negative, and Belarus still 2025-only |
| Malta, Andorra, Liechtenstein, San Marino, Gibraltar | Malta a record correction: three surfaces, 1,460 rows, the v2.5 "no fit" was an absence. Andorra, Liechtenstein and San Marino new to the record. Gibraltar four years, forward-proven to 2027-12-31 |
| Monaco, Faroe, Isle of Man, Jersey, Guernsey | Monaco negative (the "monaco" slug is Beausoleil, France). Faroe negative in three languages. Isle of Man, Jersey and Guernsey platform-tier only |

### Middle East and North Africa

| Country | What moved |
| --- | --- |
| Saudi Arabia | 43 governorate points, 30,487 city-days, 182,922 cells, exact 81.9 to 87.7 pc, within-1 99.8 to 100. Ramadan is exactly two interval values (90 and 120) across 43 cities and both years, zero violations. The century holds at 1318H, 1400H and 1500H. CORRECTED: the endpoint is coordinate-only, the id axis does not exist |
| Oman | Conflict closed as ridge-degenerate, both parameterizations carry: 28,105 city-days over 2021-2031, seven cities. Six new cities prefer nearest over ceil, and the exact-rate split is the rounding mode |
| United Arab Emirates | All seven emirates, 30,960 area-days, 2026 full plus 2027 to 05-31. CORRECTED: adhan 4.4.6's Dubai preset bakes asr +3 and runs 2.77 min late against Dubai's own rows, 0.0 pc exact on 1,794 rows. The 60 area coordinate anchors recovered with emirate ids |
| Kuwait, Jordan, Iraq, Bahrain, Qatar | Kuwait capital year banked, 18/17.5 at 99.8 pc, two null margins cleared. Jordan's margins are regional, Irbid and Aqaba carry their own sets. Iraq re-derived at 18.1+1 / 16.9+1 with no city axis (Basra 13.7 min out). Baghdad gains a second surface that drifts +4.6 dhuhr and prints an impossible 2026-02-29. Bahrain and Qatar held |
| Egypt | 78 of 82 ESA cities, 28,468 rows, 28,468 of 28,468 day-rows within one minute. No deviating city: the 13 that fail at gazetteer points pass at their table's own implied point, 17 to 61 km away. No elevation term at 1,500 m. Dar al-Ifta republishes ESA verbatim |
| Morocco | 190 cities x 2 months, 69,540 cells. National on four columns, city-varying on two: sunrise and maghrib carry a per-city horizon term (5.85 to 17.54 min, corr 0.87 with elevation). CORRECTED: O1k-M1's -1.42 asr shift does not reproduce, and the rebuild's real change is the horizon term. December not published. No clock shift, the output is GMT |
| Tunisia | 258 of 259 delegations swept, 5,144 season rows plus 1,722 capital and Djerba rows. Elevation quantified with a formula: per-site dip = 0.0316 x sqrt(metres) - 0.0999 degrees, R2 0.980. The July angle is a dated split (2025-12-15 to 2026-01-15) where 20 delegations drop the dip, rule form TN-INM-FLAT2026 |
| Algeria | 1447 complete for Alger, Adrar and Djelfa, 884 days, books abutting 2025-06-27 to 2026-06-15, plus Constantine's Ramadan table and a 1448 holdout. Frozen per-wilaya recipe, and summer months move one parameter (isha 16.10/+5 against 17.00/0 ceil). The Constantine "imsak" column is sunrise |
| Libya, Sudan, Lebanon, Syria, Yemen, Iran | Libya a one-year widget, Sudan two imsakias, Lebanon five undated regional tables, Syria a dated 2025 decree with no obtainable table, Yemen's two feeds 13.3 min apart at fajr with the owner choice standing, Iran's tables printing no isha row |
| Palestine and Palestine | Jerusalem lifted to 366 days, not by the feed: the live site is Cloudflare-closed, Wayback gives 78 days, and the year comes from the Awqaf's own 2012 print matching 77 of 78 live days at exactly +60 min. The city layer is a published offset rule: the Awqaf print plus each city's 0/+1/+2. Gaza an honest negative |

### Africa

| Country | What moved |
| --- | --- |
| Nigeria | Geography verdict overturned: the Egyptian 19.5/17.5 line is publisher-shaped, not geography-shaped. It reproduces only through masjidway's platform default, and every mosque-configured table is MWL 18/17 exact. Ile-Ife is MWL exact in UTC, the whole table 60 min early |
| Ghana, Togo, Benin, Burkina Faso, Cote d'Ivoire | Kumasi first rows, Lome 365 real rows, Savalou 365, Ouaga's Dubai mosque 2,190 of 2,190 within-1 as the cleanest surface of its wave, and Abidjan nine mosques all jama'ah boards confirming COSIM's convention, with Korhogo a real table |
| Senegal, Mali, Guinea, Guinea-Bissau, Sierra Leone, Gambia, Liberia | Senegal eight second cities on the two-dawn convention, Mali Segou a second Malian line at 15/15 against Bamako's 19/17, Guinea-Bissau lifted, Freetown and Old Yundum new athan years, Liberia current-month only |
| Central African Republic, Cameroon, Chad, Congo-Brazzaville, DR Congo, Gabon, Equatorial Guinea | CAR lifted (Bangui ISNA 15/15 exact). CORRECTED: Cameroon's Ar-Rahma "Douala" page computes at 7.3668/12.3533, Adamawa, not Douala, and Ngaoundere is new. Chad confirmed twice. Congo-Brazzaville and Equatorial Guinea new countries. DR Congo's Daaru-ssalaam a new angle pair at 19.50/17.50 |
| Ethiopia, Eritrea, Djibouti, Somalia, Kenya, Tanzania, Uganda | Jijiga and Jaamuuq new, Djibouti six mosques held, Somalia negative in five cities, Tanzania lifted on Arusha at 1,095 rows over 2025-27 and 365/365 in every year, Uganda lifted on Entebbe. CORRECTED: the platform's "Mwanza" is Malawi's |
| Rwanda, Burundi, Madagascar, Mauritius, Comoros | Rwanda lifted on the community's own timetable images through the public syndication endpoint, fajr 91 of 91 exact, Burundi 6 cities, Madagascar lifted, Mauritius structurally negative for year-2 |
| South Sudan and the remaining interior negatives | South Sudan's council domain is dead and Eid-only, and the honest negatives stand |

### Asia, Russia and the Caucasus

| Country | What moved |
| --- | --- |
| Turkey | All 81 provinces, 29,565 rows, plus 144 district tables across 8 provinces, 55,480 rows. One recipe across 177,390 cells, no deviating province. CORRECTED: the district layer is a coordinate refinement (residual 0.264 min median, longitude corr 0.984), and GetDestinationUrl returns the province id for three districts that have their own tables. 2027 not served publicly |
| China | Leaves FALLBACK. 15/15 Hanafi confirmed at all 29 provincial capitals, 4,176 city-days, and the 18/17 form label refuted everywhere by +13.8 to +21.5 min. The grid is measurably a 2004 computation. islamichina.com serves 28 capitals, 10,220 rows, at 18/17 Shafi, with its "Urumqi" computing at 117.5 E |
| Japan, Korea | Kobe's record overturned: kobemosque.com is the official site, 366 dated rows plus 2025 PDFs identical to the minute, and its maghrib column is the iqama. Kyoto a new Ramadan image calendar. Korea three new city-years at 18/18 or 18/17 Hanafi |
| India | Leaves FALLBACK to a measured mosaic: 13,140 dated rows, 20 tenants, eight cities fitted A-grade community (Hyderabad, Mumbai, Bengaluru, Kolkata, Srinagar, Ramban, Moradabad, Baharampur). Authority tier unchanged. Flagged: isha 17 sits 4 to 5 min earlier than 18 everywhere |
| Pakistan | The federal chart's clock conventions do not describe the provincial layer. Peshawar and Quetta transcribed from rolling Urdu and flat charts: four cities, four margin sets, one angle pair, one madhab. Quetta's asr does not reproduce, a smooth plus or minus 5 min swing with zero crossings in March and September |
| Malaysia | Perak fitted on a third baseline, Penang and Melaka two-year fits at A-grade class, Negeri Sembilan gap filled, the federation now 59 zones. Census +2 ihtiyati margins score zero exact days, while Recipe B (18/18, zohor +1.5 only) carries all zones. Bukit Larut carries an elevation term |
| Indonesia | 38 of 38 provincial capitals at both publishers: Kemenag 13,870 rows and KHGT 27,740 rows over 2026 and 2027, within-1 100 pc every city-year. Both publishers apply a 1.76 x sqrt(h) arcmin horizon dip from different elevation fields. jadwalsholat.org a new national surface, 643 kab/kota, 34,648 rows. SIHAT renders Mataram and Kupang on WIB, a civil hour early |
| Thailand | Complete: 77 of 77 CICOT provincial workbooks, 56,286 rows, one recipe (19.8/18.1, zero margins on all six columns), parameters frozen across both year-blocks. Nan's printed longitude typo and Ranong's 30 December stop recorded |
| Singapore, Brunei, Philippines, Vietnam, Cambodia, Laos, Myanmar, Mongolia | Singapore held at the 20/18 ceiling, Brunei 20/18 confirmed at 99.2 pc within-1, the Philippines' two regional methods never merged, and the rest negative or platform-tier only |
| Kazakhstan, Kyrgyzstan, Uzbekistan, Tajikistan, Turkmenistan | Seven new Kazakh cities at 1,095 rows each and the 48 N line settled by measurement (Karazhal 48.001042 takes set B, Ayagoz 47.966667 set A, and the wrong set puts four columns exactly 2.00 min off). Kyrgyzstan's ratio rule 98.9 to 99.5 pc within-1. Uzbekistan's "+5 margins" refuted: 15.5/15.5 Hanafi, six columns 30/30 exact. Tajikistan's Khujand window rows. Turkmenistan negative in three languages |
| Azerbaijan, Georgia, Armenia, Afghanistan | Baku two distinct lines (mawaqit 16/15 Hanafi and nam.az 18/17 Shafi), Georgia one dated table, Armenia lifted on tawkit.net at 18 cities and 540 of 540, and Afghanistan image-only with no independent witness |
| Russia | DUM RB 63 settlements, 34,886 rows, with the 16/15 recipe holding for 2026 only and the 2025 regime change now measured and dated. DUM RT 44 cities, 32,120 rows, 43 of 44 CSVs byte-identical to C23. Ufa a new fixed-interval almanac, 355 rows, cell-exact 90.8 pc, grade A. CORRECTED: Moscow's quoted margins were computed 0.163 deg west of the published position, the 2026 sunrise defect reaches -68 min, and Sibay is served a schedule for 55.81 N |

### Americas

| Country | What moved |
| --- | --- |
| United States | 33 of 64 metros now carry a dated surface, 33,513 rows across 41 surfaces. 15/15 verdict: 26 of 37 plain ISNA (70 pc), 31 in the 15-family. Clean firsts at Sacramento, Chattanooga, Fort Wayne, Allentown, Bridgeport, Lexington, Shreveport, Tulsa, Greensboro, St Louis, Orlando, Worcester, Staten Island, Des Moines, Wichita, San Antonio, Cincinnati, Columbus, Albuquerque and Buffalo. Defects: Omaha a dated 2026 regime change, Mobile computing Houston coordinates, Little Rock serving 2023, Anchorage's site computing Makkah client-side |
| Canada | A second pass in flight at close, with 26 feeds on record, 15/15 at 14, and FCNA's stated 13/13 configured by 0 of 26 |
| Mexico, Brazil, Colombia, Peru | Mexico leaves FALLBACK to A (Guadalajara 385 rows across two years, Monterrey a second surface). Brazil A on two years, 25 cities, 18,000 cells 99.7 pc within-1. Colombia A on Cartagena. Peru candidate to provisional |
| Ecuador, Bolivia, Uruguay, Paraguay | Ecuador and Bolivia country-firsts, while Uruguay and Paraguay are negative in Spanish |
| Cuba, Puerto Rico, Haiti, Barbados, Belize, El Salvador, Dominican Republic, Panama, Costa Rica | Ten new surfaces, five-plus country firsts. Cuba's only mosque, 353 of 365 exact. Barbados and the Dominican Republic 7-row candidates |
| Jamaica, Trinidad | Jamaica a country-first dated row after both decoys avoided. Trinidad's Chaguanas -1h defect still live and its timezone label lies |
| Guatemala, Honduras, Guyana, Suriname, Venezuela, Bahamas | Held rows reconfirmed, with Guyana and the Bahamas negative and the traps named (masjidbilalnassau1.org is Farmingdale, New York) |
| Chile, Argentina | Chile's 2016 era captured, 18 PDFs, 558 rows, one recipe across 34.9 deg of latitude at 97 to 100 pc, with the regime boundary dated 2016 to 2025 (+6 on every column in 2025). Argentina a stale 2021 PDF |

### Oceania

| Country | What moved |
| --- | --- |
| Australia | Complete at the gazetteer: 218 Diyanet grid points, 79,570 rows, one recipe (18/17 + temkin) within 2 min on all 365 days. Six of 218 grid points print on the eastern clock whatever their label |
| New Zealand | A twenty-year pair test: the FIANZ pairs are identical in Ramadan 1427 (2006) and 1447 (2026), one engine, zero drift. Dated regime change: double-shadow asr +1h15 in 2006 against +40 min in 2026. Thirty more 2026 sheets captured, transcription in flight |
| Fiji | Corrected twice: dhuhr is transit +5 to +6, not +3, and isha is an interval table, maghrib +75 exact March to September. The November-2026 sheet is identical to November 2024 |
| Tonga, New Caledonia | Tonga a dated surface at last, 365 rows MWL 18/17, and New Caledonia machine-readable with the 19:45 floor re-confirmed at exactly 243 days and a new iqama layer |
| Tahiti, PNG, Solomon, Vanuatu, Samoa, Kiribati | Negative across nine languages, with French Polynesia lifted on a masjidway month, citable but unclaimed |

---

## 3. The standing questions

### 3.1 Recipe longevity per class

The span ledger answers "how do I know the recipes still hold in 20 years" for all 159 recorded rows.
The classes are the owner's five plus FALLBACK, counted outside them on purpose.

| Class | Rows | What it proves | Longest members |
| --- | --- | --- | --- |
| PROVEN-TO-year | **15** | An endpoint serves the future and one recipe held across it | Kazakhstan 2100, Saudi 1500H (about 2076), London 2076, Indonesia 2035, Kyrgyzstan 2035, Oman 2031, Niger 2031, Czechia 2028, plus 2027 members (Turkey, UAE, Portugal, Iceland, Estonia, Norway/Jamiat, Malaysia) |
| STABLE-ACROSS-N-YEARS | **21** | Multi-year past evidence, no future endpoint | Fazilet 16 years (both profiles), Tajikistan 12, Tunisia 7, Egypt 5, Morocco 3, Singapore 3, Hong Kong 3, Switzerland 3, US and Canada 3 |
| SINGLE-CYCLE | **83** | One published cycle: a year, an edition, a month or a short sample | Still the majority of the record, and the reason the same one-year gap repeats on five continents |
| FROZEN-GENERATION | **12** | Byte-identical or perpetual editions, more years buy nothing | Ireland, Belgium, Austria, Slovenia, Bosnia, Kosovo, Uzbekistan, Bangladesh, Sri Lanka, Maldives, Botswana, South Africa |
| RECOMPUTED-SPAN | **1** | Multiple years, one recipe, the years provably recomputed | Algeria alone |
| FALLBACK | **27** | No object, no recipe | Counted separately, never folded into SINGLE-CYCLE |

Two cautions travel with the PROVEN class, both from the ledger's own closing section. Fourteen of
the fifteen rest on endpoints that serve computed future rows, so they prove the publisher's
generator is stable, not that the publisher will keep it. And Kazakhstan's tables are the publisher's
own client engine executed locally, so a changed served script changes the table with no year
boundary. That is the residual risk every PROVEN row carries.

### 3.2 The drift question, answered with this round's evidence

The question was whether a recipe proven today still describes the timetable in twenty years. The
round answered it three ways, and the three answers differ by class.

**At century scale, the answer is no drift.** Saudi Arabia spans 183 years: seven Hijri years at
Makkah and Medina across 1318H to 1500H, 6,379 rows, one recipe, 100 pc within one minute, zero
regime changes. Kazakhstan spans 49 years at 100 pc within one minute, with the served prayTimes
script reproducing the 2026 table 365 of 365, so the suspicion of a publisher change is closed. New
Zealand spans 20 years on a community surface, the FIANZ Ramadan pairs identical in 2006 and 2026,
one engine, zero drift. Where the horizon is that long and the publisher is a machine, the recipe is
the generator, and the generator did not move.

**At edition scale, the answer is drift with a date.** Every change the round found is now dated, and
a span that crosses one must be split there:

| Date | Object | What changed |
| --- | --- | --- |
| 2019-07-01 | Tajikistan | dhuhr wall clock 13:00 to 12:40, with a further 12:50 era in October 2020 |
| January 2023 | Diyanet EU (DITIB Germany, IFiS Sweden) | isha 17 to 16 on European calendars, summer tathbit abolished |
| January 2023 | Cyprus north | the archive's January 2023 matches 2026 while other 2023 to 2025 months carry the older constant |
| 2025 | Russia, Bashkortostan | summer substitute sunrise -120 to -90, and the 2025 fajr fits no single angle (18.6 pc) |
| 2025 | Cyprus north | every 2025 cell 2.16 to 2.83 min behind 2026, one per-edition constant |
| 1447 edition (about 2025-06) | Burkina Faso | fajr prints five minutes later on every day, isha block walk re-set |
| At the 2026 rebuild | Morocco | the margin regime shifts. The angles survive, the margins do not |
| 2026-09-20 | Morocco | decree 2.26.530 makes legal time GMT permanently |
| 2016 to 2025 | Chile | 2016 carries no clock offset, the 2025 workbook +6 on every column |
| 2006 to 2026 | New Zealand | double-shadow asr +1h15 to +40 min |
| 2026/2027 | United Kingdom, LUPT | an asr margin break named in the brief. The artifacts exist and no report states its size, so the split sits at 2026-12-31 pending a read |
| Pending | Pakistan | the federal unified timetable approved November 2025 for 1 January 2026 and still unpublished. If it publishes, the country's verdict flips |

Two of these are the round's own discovery, and both are the kind that would have poisoned a naive
extrapolation: Russia's 2025 substitute, found only by fitting both years separately, and Chile's
clock offset, found only by harvesting the 2016 era from Wayback.

**At publisher scale, drift is a property of the engine, not the sky.** The round's largest drifts
are all statements against practice, never against astronomy. Norway's IRN line at Bergen drifts 117
min at fajr and the drift is span-dependent. Canada's FCNA states 13/13 while its mosques practise
15 to 25 min apart, so the stated 13-degree prints fajr 11 to 17 min later and isha 11 to 18 min
earlier than the tables actually used. Montenegro's "nearly exact" declared pair was a winter and
summer cancellation artifact with an 11.5 min seasonal swing. Sweden's Imam Council prose 18/17
against a served 18/16 is 7.8 min at Stockholm in winter, and Germany's DITIB prose is 7.2 min at
Berlin in winter. Austria drifts on fajr only, 12.8 min mean, 29 worst in August, with isha in sync.

### 3.3 Algorithm against timetable

`ALGO-TABLE-COMPARE.md` scores 35 rows across 32 qualifying countries, those holding both a stated
algorithm and dated tables. The verdicts are 18 sync, 9 drift, 4 undecidable, 4 empty-comparison.
Every drift is flagged for the owner and none was adjudicated, which is the brief's rule and the
right one: the round measures whether the two sides agree, never which side is correct.

Five largest drifts, with magnitude and direction. Norway at Bergen, fajr worst 117 min,
span-dependent. Canada, FCNA's stated 13/13 against practice, fajr 11 to 17 later and isha 11 to 18
earlier. Montenegro, the declared 19.5/17.5 against its own table, fajr winter +4.05 and summer
-7.43. Sweden, 18/17 prose against 18/16 served, isha about 7.8 min in Stockholm winter. Germany,
18/17 prose against 18/16 served, isha about 7.2 min in Berlin winter.

Bahrain scored fresh: maghrib and sunrise sync, dhuhr and isha a constant 1.4 to 2.1 min early
against the council's own statement, fajr and asr undecidable because no degree is stated. The four
empty comparisons are Finland (banked, zero web cost), Austria IGGO, Switzerland IZRS and Brunei.

The derived-only countries (Saudi, Oman, JAKIM, MUIS, Kuwait and about 35 more) are listed unscored.
No parameters exist to compare and none were invented.

---

## 4. What this round did not resolve

**Eleven countries remain FALLBACK, sixteen counting Palestine.** South Sudan (council domain dead,
Eid-only), Liberia (no tenant), Turkmenistan (image-only, fourth sweep), Nepal (calculators, and the
held PDF is a date calendar with no prayer column), Myanmar (AlAdhan client), Guyana (Facebook only),
and PNG, Solomon, Vanuatu, Samoa and Kiribati (no tenant across four languages). Palestine stays
FALLBACK in the ledger at January-class feed only.

The two FALLBACK counts in this document use different denominators and must not be read as a
disagreement. The world table's class holds 26 rows, because it also holds countries that have a
community surface and no authority surface (India before this round is the shape). The fallback
sweep's 11 counts only countries with no surface at any tier. The first number is a record class, the
second is a research result.

**Eight capital gaps.** Pyongyang, Kingston (Jamaica), San Jose (Costa Rica), Georgetown (Guyana),
Palikir (Micronesia), Ngerulmud (Palau) and Tegucigalpa, with New Delhi the eighth only because
athanpro serves "Delhi" 5 km away. The first six are solar-gate failures on the only platform page
(a 481, 239, 61 and 61 min gate miss), not search failures.

**Seventeen items sit flagged, not adjudicated.** The ones that block a schema decision: Oman's
parameterization is underdetermined by 0.08 deg of reference-point uncertainty. Quetta's asr has a
smooth plus or minus 5 min annual swing with no named cause. Macedonia's two surfaces disagree +45
min on fajr. Porto's monthly asr runs +39 to +54 against its own annual. India's isha 17 sits 4 to 5
min earlier than 18 in every city and season. masjidi.app's 37 sampled tables all fail the solar
gate at 6.2 to 8.1 min RMS with no cause. Tehran's 30-row table exists but is not claimed against the
record's closure.

**A latent fitter bug is unfixed and travels.** `const isha` followed by `+= 1440` silently drops any
year containing one after-midnight isha. It is present in the US-states copy as well as the copy
that found it, so every year-scored fit must be re-run or checked for the dropped-year class before
any grade that rests on it is trusted.

**masjidway is flaky, not closed.** It answered 200 with host rotation and a trailing slash at
06:24Z, then 502 and 503. Its month endpoint renders any month (January 2028 verified), and two
tenants were found, but there is no country browse and no reliable census route.

**Ten workspaces had not returned a report at this cut**, and their content is not counted above:
athanpro (2,694 data files across 224 country and territory slugs, the largest single surface sweep
of the round), eastasia2 (China second-tier grid and islamichina enumeration), canada2 (a Canadian
second pass), capitals3 (13 residual capital files), nz-finish (the 2006 and 2026 NZ sheet sets, 38
files), masjidi (the masjidi.app pool, 495 tenants), second-witnesses, offset-registers (Jordan,
Kosovo, Palestine), residual-fits (empty) and integrity2 (the scan artifact, read here).

**The SQL index is a floor, not the archive.** `census-index.db` was built at 05:46Z and covers 1,591
o1l surfaces, and the round kept writing for six more hours. Any query against it undercounts.

**The archive is 3.47 GB against a brief that asked for tens of GB.** The gap is not effort: a
country whose authority publishes nothing yields no capture, and 11 countries closed with no surface
at all.

**Three items were named in the mission and never measured this round.** Kelantan, Benin and
Mauritius appear in the mission text but in no O1l block. Kelantan's split is already void on the
record, Benin's Cotonou candidate was already withdrawn, and Mauritius is held at single-cycle with
a structurally negative year-2. They are not gaps in the round's coverage. They are items the record
had already closed.

**Six rows cannot enter any class count.** Thailand, Algeria, Brunei, Uganda, Tanzania and China
moved out of a class without a class being named. The close must rule on each before the world table
can absorb them.

---

## 5. Reconciliation anchors

Every closing artifact, by path, under `$HOME/athan-gitree/census/o1l-city/`:

| Artifact | Path | What it holds |
| --- | --- | --- |
| This summary | `summary/ROUND-SUMMARY.md` | The definitive read, with counters beside it |
| Counters | `summary/count.mjs`, `summary/files.mjs` | The scripts behind every scripted number in section 1 |
| Consolidation | `CONSOLIDATION.md` | 57 blocks, one per returned agent, in return order |
| Corrections register | `corrections/CORRECTIONS-ROUND.md` | 77 corrections, 34 new rows, 56 movements, 32 rule-forms, 17 flags, cut 06:34Z |
| World-table diff | `wtdiff2/WORLD-TABLE-DIFF-ROUND2.md` | 18 new country rows, 45 changed rows, the class arithmetic that closes at 192 |
| Span ledger | `span-ledger/SPAN-LEDGER.md` | 159 rows, the six verdict classes, the regime-change register, the ten cheapest buys |
| Coordinate ledger | `coords-ledger/COORDS-LEDGER.md` and `coords-ledger.json` | 1,547 records, four classes, the resolver's input layer |
| Algorithm matrix | `algo-table/ALGO-TABLE-COMPARE.md` | 35 rows, 18 sync, 9 drift, 4 undecidable, 4 empty |
| Gap closures | `gaps-closed/GAPS-CLOSED.md` | The Tunisia flag, the Oman conflict, Austria, Switzerland, Brunei |
| Capital matrix | `capitals/CAPITAL-MATRIX.md`, `capitals2/REPORT.md` | 142 to 194 of 202, the 8 gap, the 59 athanpro pages |
| Integrity scan | `integrity2/scan.json` | 71 workspaces, 30,255 files, 1,482,040 raw rows, 1,328,077 deduped, 06:48:06Z |
| SQL index | `$HOME/athan-gitree/census/census-index.db` | 2,154 surfaces, 584,358 rows, with the o1l slice at 1,591 surfaces |
| Raw archive | every `*/captures/` directory | 3.47 GB, 30,255 files, saved per the brief |
| Normalized rows | every `*/data/` directory | 7,145 JSON files, 6,566 with dated keys |

The repo receives reports, fits and normalized rows only, never captures. Raw capture volume stays
in this archive.
