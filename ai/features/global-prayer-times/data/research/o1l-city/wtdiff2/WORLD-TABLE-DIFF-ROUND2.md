# WORLD-TABLE-DIFF, O1l round 2 (city level)

Built by O1l-60, 2026-11-11, for the o1l close. Read-only against the record: this document
proposes, it edits nothing.

**Record of reference:** `world-table-v3.md` (174 country rows, classes A 17 / provisional 40 /
candidate 65 / community 15 / F 2 / FALLBACK 35) and `policy-layer.v2.5.json` (87 objects), both
under `ai/features/global-prayer-times/data/census/`, both read-only.

**Corpus diffed:** the 52 CONSOLIDATION blocks present in `o1l-city/CONSOLIDATION.md` at this
build, digested by `corrections/CORRECTIONS-ROUND.md` (cut 06:34Z: A 77 corrections, B 34 new
rows, C 56 grade and span movements, D 32 rule-forms, F 17 flags). Blocks that landed after the
cut, or that had not landed, are listed in section 8 and are NOT counted below.

**Workspace:** `$HOME/athan-gitree/census/o1l-city/wtdiff2/`. Every row of every table carries the
block and its workspace.

---

## 1. Counts at the top

| Quantity | Count | Where |
|---|---|---|
| NEW ROWS (register table B) | 34 items, of which 18 are new country rows | section 3 |
| New country rows (no row in v3 at all) | 18 | section 3.1 |
| Rows lifted out of FALLBACK with dated data | 6 (CAR, Western Sahara, Madagascar, Guinea-Bissau, Uganda, Tanzania) | section 3.2 |
| Rows moved from FALLBACK to measured, same country | 2 (China, India) | section 3.3 |
| New second line / surface set on an existing row | 3 (Russia Ufa, Cote d'Ivoire, Tonga-with-times) | section 3.3 |
| Surface-only finding, no dated series | 1 (Nepal, FALLBACK stands) | section 3.3 |
| Matrix and pool additions (not country rows) | 4 (capitals, masjidi.app tenants, megacity witnesses, athanpro.com) | section 3.4 |
| CHANGED ROWS (distinct v3 rows a correction touches) | 45 rows, plus 4 platform and ledger items | section 4 |
| GRADE MOVEMENTS (register table C) | 56 items | section 5 |
| Class count shift | A 17 to 19, provisional 40 to 44, candidate 65 to 71, community 15 to 24, F 2 to 2, FALLBACK 35 to 26, 6 rows left unnamed by the register | section 5.2 |
| RULE-FORMS (register table D) | 32, of which 9 (D1 to D9) are the forms the mission names | section 6 |
| Objects to ADD to policy-layer | 18 (one per new country row) | section 6.3 |
| Existing objects whose fields change | 35 | section 6.3 |
| Rows with no object today that the close must decide on | 11 (China, Japan, India, Indonesia, Mexico, Colombia, Peru, Tanzania, Uganda, Ireland, North Macedonia) | section 6.3 |
| Row identity check | 174 + 18 = 192 = 19 + 44 + 71 + 24 + 2 + 26 + 6 | section 5.2 |

---

## 2. Method, and how conflicts were resolved

1. **Report over log.** Where a block's report and the monitor's log disagree, the block's report
   governs. Where two blocks of the same object disagree, the LATER CLOSED verdict governs and the
   earlier reading is carried as the superseded one, never deleted (the night's own rule).
2. **The register is a digest, the blocks are the measurement.** Where the register's line and the
   block's number differ, the block's number is carried and the register line is quoted beside it.
   No figure below is taken from the register alone when the block prints one.
3. **No adjudication.** Two items stay flagged exactly as the round left them: the Oman
   parameterization (closed as degenerate, both carry) and the six rows the register moves out of a
   class without naming the new one.
4. **Reading columns compress the row.** The "v3 reading" and "v3 reason" columns are a
   compression of the row's own wording, written by this diff. A clause quoted inside running prose
   (section 2.1, section 7) is verbatim.
5. **Grades use the v3 vocabulary verbatim.** Where a block writes a phrase outside the six classes
   ("A eligible", "A-candidate", "fitted multi-year", "measured"), that phrase is carried as written
   and counted as unnamed, not converted.

### 2.1 Conflicts the diff had to settle, and how

| Flag | Conflict | Resolution carried here |
|---|---|---|
| F6 | O1l-21r appears twice, Peshawar at 366 rows in one block and 365 in the other | Both are right on their own denominator: 366 CHART rows, 365 DATED rows (one printed row undated). Scored columns are quoted on 365 dated rows. `o1l-city/o1l-21r/`, `o1l-city/pk-transcribe/` |
| F7 | US 15/15 verdicts at 20 of 29 and 26 of 37 | The later and larger block governs the closing figure: 26 of 37 (70 pc), 31 of 37 (84 pc) in the 15-family. The 20 of 29 reading is the same verdict on the earlier surface set. `o1l-city/us-unresolved/`, `o1l-city/us-states/` |
| F8 | Capitals 194 of 202, or 195 of 202 with Delhi accepted for New Delhi | Carried as 194 of 202 covered, 195 if Delhi is accepted for New Delhi. A definitional difference, not a measurement conflict. `o1l-city/capitals/`, `o1l-city/capitals2/` |
| A8 / A9 | Oman, nearest against ceil | Closed by the later block: RIDGE DEGENERATE, BOTH CARRY, the split is the rounding mode. `o1l-city/gaps-closed/` governs over `o1l-city/mideast-cities/` |
| A4 / A5 | Morocco, the O1k-M1 minus-1.42 asr shift against the rebuild | The later measurement governs: the shift does not reproduce (asr 99.8 pc within-1 at +0.33), and the rebuild's real change is the per-city horizon term. `o1l-city/morocco-cities/` |
| F9 | Cameroon row text still says Douala | Relabel to the Adamawa point 7.3668/12.3533 and add Ngaoundere as the second surface. `o1l-city/O1l-33/` |
| F10 | Malta absent from both record files | Added as a new row, not an edit. `o1l-city/microstates/` |
| A3 | Cameroon anchor computed at Adamawa | Same as F9. |
| A34 | adhan 4.4.6 Dubai preset against Dubai's own rows | The authority's rows govern: the preset bakes asr +3 and runs 2.77 min late, 0.0 pc exact on 1,794 rows. `o1l-city/uae-cities/` |
| A17 | Uzbekistan's +5 margins | Refuted by the block that measured the columns: 15.5/15.5 Hanafi, six columns 30/30 exact, maghrib sunset +4. `o1l-city/o1l-26r/` |
| A55 | Kazakhstan publisher change suspected across the span | No publisher change: the served prayTimes.js reproduces the 2026 table 365/365. `o1l-city/wayback-back/` |
| A22 | China's 18/17 form label | Refuted at all 29 capitals, fajr +13.8 to +21.5. `o1l-city/china-capitals/` |

---

## 3. NEW ROWS

The register's table B carries 34 items. Decomposed: 18 new country rows, 6 lifts out of FALLBACK,
2 rows moved from FALLBACK to measured inside a country that already had a row, 3 new lines or
surface sets on existing rows, 1 surface-only finding, and 4 matrix or pool additions that are not
country rows. The decomposition is the diff's, the measurements are the blocks'.

### 3.1 New country rows, 18

None of these countries has a row in `world-table-v3.md`. Each therefore also needs an object in
`policy-layer.v2.5.json` (section 6.3).

| # | Country | Surface and rows held | Tier | Verdict as measured | Block (workspace) |
|---|---|---|---|---|---|
| N1 | Malta | Birkirkara 365 (18 deg fajr behind a fixed 05:13 floor, 213 days), Bilal 365 (18/17), Paola masjidway (17.9/16.9, fits 2025 AND 2026). 1,460 rows, three surfaces | community / platform | candidate. Two years on the Paola surface is the country's only year-pair | O1l-36 microstates (`o1l-city/microstates/`) |
| N2 | Congo-Brazzaville | Brazzaville 365 (fajr 12.3 / isha 18.19, dhuhr prints 60 min after its own solar noon while sunrise and sunset are exact) | community | candidate, internal one-hour inconsistency recorded | O1l-33 central-africa (`o1l-city/O1l-33/`) |
| N3 | Equatorial Guinea | Malabo 365, MWL exact, Bata negative | community | fitted exact | O1l-33 central-africa |
| N4 | Cuba | Havana, mawaqit Abdallah, 365 (fajr 15-21 / isha 15+12 / maghrib +3), 353/365 exact. The country's only mosque | community | fitted | O1l-30 caribbean-central (`o1l-city/O1l-30/`) |
| N5 | Puerto Rico | San Juan and Ponce, 365 each, plain MWL 18/17 | community | fitted | O1l-30 caribbean-central |
| N6 | Haiti | Port-au-Prince 365 (fajr 18+10, dhuhr transit+15, asr Shafi+5 floored 15:30, the floor binding 101 days) | community | fitted | O1l-30 caribbean-central |
| N7 | Barbados | Bridgetown, masjidbox, 7 rows | community | candidate | O1l-30 caribbean-central |
| N8 | Belize | Belize City 365, ISNA 15/15 | community | fitted | O1l-30 caribbean-central |
| N9 | El Salvador | San Salvador, two tables, 730 rows, MWL 18/17, the two agreeing within 1 all year | community | fitted | O1l-30 caribbean-central |
| N10 | Dominican Republic | Santo Domingo, masjidbox, 7 rows | community | candidate | O1l-30 caribbean-central |
| N11 | Panama | Panama City 365, 18/18.5, maghrib sunset+6 | community | fitted | O1l-30 caribbean-central |
| N12 | Costa Rica | San Jose 365, MWL 18/17, maghrib +7 | community | fitted | O1l-30 caribbean-central |
| N13 | Jamaica | Jamaica Islamic Centre, Spanish Town, today-row, MWL 18/17 within 1, both decoys avoided. The capital matrix separately records Kingston JM as a NEGATIVE (solar gate 481 min) | community | candidate | O1l-9 latam-cities (`o1l-city/latam-cities/`), O1l-45 capitals2 (`o1l-city/capitals2/`) |
| N14 | Ecuador | Quito, mawaqit, 365, MWL 18/17 anchored | community | provisional | O1l-9 latam-cities |
| N15 | Bolivia | Santa Cruz, mawaqit, 365. Fajr and isha 18/17 but the sun columns are unreproducible at any South America coordinate | community | candidate | O1l-9 latam-cities |
| N16 | Andorra | Centre Cultural Islamic, mawaqit, 365 (fajr 18.1 -1, isha 16.9 -1, 365/365 within-1). The O1k negative stands for a mosque-PRINTED table | community | candidate | O1l-36 microstates |
| N17 | Liechtenstein | IGMG Vaduz 396 rows plus IGFL's own line identical to the minute (18/17 + temkin, the summer block leaves the angles, not a fixed fraction, so the form cannot be told) | community | candidate | O1l-36 microstates |
| N18 | San Marino | Associazione Badr 365 (14.9/15.1, zero margins) | community | candidate | O1l-36 microstates |

**Malta is the one item the register flags twice** (A2 and F10): the v2.5 "no fit" was an ABSENCE,
not a verdict, and the row must be ADDED. Nothing in either record file mentions Malta, Andorra,
Liechtenstein or San Marino today.

### 3.2 Lifted out of FALLBACK, 6

Each of these rows exists in v3 with a one-line FALLBACK reason. The reason is now answered by dated
data.

| # | Country | v3 reason being answered | Surface and rows | Verdict | Block |
|---|---|---|---|---|---|
| L1 | Central African Republic | no surface | Bangui, mawaqit, 365, ISNA 15/15 zero margins, 365/365 within-1 (dhuhr a fixed 12:00 jama'ah clock) | provisional | O1l-48 fallback-sweep (`o1l-city/fallback-sweep/`) |
| L2 | Western Sahara | no own publisher, coverage rides inside the Morocco fit | Laayoune and Dakhla, 60 rows, 19/17 with margins 0/-3/+5/+1/+4/0, 30/30 within-1, printed on GMT (the decree reaches the southern provinces) | candidate | O1l-48 fallback-sweep |
| L3 | Madagascar | one Masjidbox mosque, the Salaah Times mirror carries Mahajanga at lat/lon 0.0 | 3 mosques, 1,095 rows | candidate | O1l-48 fallback-sweep |
| L4 | Guinea-Bissau | no surface (C20 wave: none) | Bissau 365 rows | candidate | O1l-48 fallback-sweep |
| L5 | Uganda | ministry domain unresolvable, Jamiat carries a Kampala outrider | Entebbe 365, clean 15/15, Kampala Mulago fails the gate, Kiyindi 404 | fitted, one cycle | O1l-20r africa-cities (`o1l-city/o1l-20r/`) |
| L6 | Tanzania | BAKWATA negative reconfirmed, KSIJ Dar's Ramadan PNG is Shia, the Jamiat generator covers 11 towns | Arusha, salaahtimes API, 1,095 rows 2025-27 (fajr 18 / isha 18, dhuhr transit+5, maghrib sunset+3, Shafi), 365/365 all six within 1 in every year, amplitude 7 min. The platform's Mwanza row is MALAWI's | A eligible | O1l-20r africa-cities |

### 3.3 Existing rows that gain data, a line, or a surface set

| # | Row | What is added | Block |
|---|---|---|---|
| E1 | China | Row moves from FALLBACK to measured: 29 provincial capitals, 4,176 city-days at 15/15 Hanafi, islamichina.com 28 capitals x 2026 = 10,220 rows at 18/17 Shafi (its Urumqi computes at 117.5E, about 119 min early), Guangzhou 30 dated Ramadan rows (cheen.cn). No mainland mosque or association publishes a timetable | O1l-4 china-capitals (`o1l-city/china-capitals/`) |
| E2 | India | Row moves from FALLBACK to a measured mosaic: 13,140 dated rows, 20 tenants, 8 cities fitted A-grade community (Hyderabad, Mumbai, Bengaluru, Kolkata, Srinagar, Ramban, Moradabad, Baharampur). Authority tier UNCHANGED: no board publishes a daily table | O1l-11r india-cities (`o1l-city/india-cities/`) |
| E3 | Russia, Ufa | New second line inside Russia: twelve-sheet Hijri-1448 almanac 355 rows (2026-06-16 to 2027-06-05) plus three 1446 sheets (87 rows), fixed-interval recipe, cell-exact 90.8 pc | O1l-6r russia-boards (`o1l-city/russia-boards/`) |
| E4 | Cote d'Ivoire | New surface set beside the held COSIM proxy: 7 Abidjan mawaqit mosques, 2,555 rows, hand-set boards with fixed dhuhr and asr clocks. The COSIM proxy row is untouched and remains cross-check only | O1l-48 fallback-sweep |
| E5 | Tonga | Candidate becomes a dated surface: Masjid Al-Taiyab Niutoua on mawaqit, 365 rows, MWL 18/17, five columns 365/365 within-1, floor rounding (asr plus or minus 2, a platform artefact) | O1l-35 pacific2 (`o1l-city/pacific2/`) |
| E6 | Nepal | Surface only, no dated series: Kathmandu khidmat.org.np is an AlAdhan method-4 wrapper, later a 30-row table at 99.3 pc within-1 (capitals2), and the held PDF is a date calendar with NO prayer column. FALLBACK STANDS for a dated authority series | O1l-27 southasia-fringe (`o1l-city/O1l-27/`), O1l-45 capitals2 |

### 3.4 Matrix and pool additions, 4 (not country rows)

| # | Item | What is added | Block |
|---|---|---|---|
| M1 | Capitals | The capital matrix closes from 142 to 194 of 202 covered (195 with Delhi accepted for New Delhi). Ten largest gaps filled at 365 rows each, 49 small states covered at 30 rows. Three publish a snapped dhuhr, two a point contradicting the city | O1l-38 capitals (`o1l-city/capitals/`), O1l-45 capitals2 |
| M2 | masjidi.app tenants | 495 tenants in 33 countries (Lebanon 244, Saudi 49, Algeria 31, Syria 24, Indonesia 23, Oman 16, Jordan 15, Morocco 13, tail). All 37 sampled tables fail the solar gate at 6.2-8.1 min RMS. A FLOOR, not a census | O1l-43 masjidal-global (`o1l-city/masjidal-global/`) |
| M3 | Megacity second witnesses | Istanbul turktakvim 365 (fajr 17.93 clean 365/365, isha seasonal 217/365, temkin about double Diyanet), Karachi masjidway mosque 11160 (18/18 Hanafi zero margins, 30/30), Jakarta jadwalsholat Jakarta Pusat 365 (19.51/18.50, +2 on dhuhr/asr/maghrib, imsak exactly fajr-10, NOT a Kemenag mirror), Baghdad mawaqit Jami al-Hasanayn 366 rows | O1l-47 megacities (`o1l-city/megacities/`) |
| M4 | athanpro.com | One FROZEN September-2026 build, platform tier, 30-row capital tables, three recorded defects (wrong offset labels, a Today block contradicting its own month table, four broken capital pages). Provisional. The lever that covered the 49 small states | O1l-45 capitals2 |

---

## 4. CHANGED ROWS

45 v3 rows whose text a correction overturns or a defect re-measures, plus 4 items that are not
rows. Sorted by v3 region. "Row action" is what the close must write, not a grade.

### 4.1 British Isles and Europe, 11 rows

| Row | v3 reading | Round measurement | Row action | Block |
|---|---|---|---|---|
| Ireland | IFI switches DST on WRONG DATES (Apr 1 / Nov 1 ...) a feed defect, not policy | The cause is the PDF's own footnotes: add an hour after summer time starts, subtract after it ends. The API is that table with the instructions DROPPED (+57 min 1 April, -59 min 1 November). The `?year=` parameter is DISCARDED by a 301 (2026/2027/2028 all 25,380 bytes), so the feed is parameter-blind, leap-shaped, with a phantom Feb 29. New 26-city IFI surface, 9,459 rows | Replace the DST clause with the cause, add the parameter-blind defect and the city PDF surface | O1l-29 ireland-wales-iom (`o1l-city/o1l-29/`), A37, A38 |
| Finland | portal 18/17, the mosque OVERRIDES isha, 30 rows | Oulu's 365 rows are TURKU'S TABLE relabelled, its stated IRN 16/15 + 1/3 night is provenance only. Jyvaskyla 353 rows 18/17 exact, spanning into Jan 2027. Turku and Tampere run a measured 15/12 line | Strike Oulu as its own surface, add the two city findings | O1l-31 nordics2-cities (`o1l-city/O1l-31/`), A15 |
| Cyprus (north) | the 2025 edition fails as-is, passes on one constant, mean -2.42 | Re-confirmed: with -2.5 the 2026 recipe plus correction gives 552/552 within-1, the regime split is DATED 2025 | Date the constant, keep provisional | O1l-A2 span-ledger (`o1l-city/span-ledger/`), A16 |
| Montenegro | the declared 19.5/17.5 is nearly exact | That was a WINTER/SUMMER CANCELLATION ARTIFACT: fajr seasonal swing about 11.5 min (winter +4.05, summer -7.43). The six PDFs are ONE table plus {-4,-2,0,+1,+3,+5} min, cell-exact, the stated pair scores 35.3 pc | Strike nearly exact, carry the artifact and the one-table-plus-shifts finding | O1l-A1 algo-table-matrix (`o1l-city/algo-table/`), O1l-16r balkan-cities (`o1l-city/balkan-cities/`), A18, A19 |
| Bosnia and Herzegovina | elevation ladder with ONE published rung (Sarajevo), temkin sunrise -7, maghrib +6 | REFUTED: temkin -5.5 for 57 of 61 cities from 82 m to 1,050 m, corr(residual,elev) +0.21. The 611 m rung reproduces Sarajevo only because Sarajevo is the anchor. ONE Sarajevo-anchored generation redistributed by 4 min/degree longitude (mean error 0.31), one twilight scalar k per city. 22,265 city-days, 71.5 pc within-1 | Replace the ladder with the one-generation model, margins -5.5/-5.5/+0.5, 61 cities | O1l-16r balkan-cities, A20, A21 |
| Portugal | isha dual 12.5+1 / maghrib+81, A on two years | The monthly Porto sheet is a CONVENTION SHEET: asr +39 to +54 against its own annual. Flagged, not adjudicated | Add the Porto convention note as a defect | O1l-22 europe-second (`o1l-city/o1l-22/`), A67 |
| North Macedonia | IVZ unverifiable, Fazilet's Skopje fit is the ONLY characterisation | Two web surfaces exist and DISAGREE +45 min on fajr: bfi.mk and vaktija.eu (Skopje 164/180) | Add both surfaces, the disagreement is flagged, both stay | O1l-16r balkan-cities, A68 |
| Austria | IZW 15.0-15.5 / 15.8-15.9 with sweeps, provisional | IGGÖ comparison now measured: DRIFT on fajr only (mean 12.8 min earlier, worst 29 in August), isha SYNC (245/245 within-1). Rule form AT-IGGOe = 18/16 + temkin + Istanbul takdir | Add the drift and the IGGÖ form | O1l-25 gaps-closed (`o1l-city/gaps-closed/`), A72 |
| Switzerland | IZRS published seasonal scheme, nothing fitted | UNDECIDABLE: IZRS behind a Bronze login, Wayback a 10 KB shell, no dated IZRS rows exist | Record the closure, the row stays candidate | O1l-25 gaps-closed, A73 |
| Germany (EU-Diyanet scheme) | 18/16 ... provisional, year-2 is the only remaining lift | DITIB's 18/17 prose against the served table: isha about 7.2 min Berlin winter. 24 cities, 6,570 authority rows. 2027 absent at the portal but PRESENT at IGMG's WP REST mirror (26 tables 2026-10 to 2027-11, 11,076 rows), byte-identical on 2,116/2,116 overlaps. A mirror of one generation cannot lift provisional to A | Add the drift, the 24-city span and proven-to-2027-11 | O1l-10 watches-eu (`o1l-city/watches-eu/`), O1l-42 germany-cities (`o1l-city/germany-cities/`), A62, A74 |
| United Kingdom | 49 surfaces, London LUPT A | 75 surfaces (+26). Platform defects: phantom 29 Feb, unreliable tz labels, fixed-BST prints, slug fallback resolving US mosques. go2masjid's slim=365 serves a proven forward year to 2027-11-10, mawaqit's stored calendar is a different generation from its live page at Plymouth and Lincoln | Update the surface count, add the four platform defects | O1l-B2 uk-seconds (`o1l-city/uk-seconds/`), O1l-28 uk-seconds2 (`o1l-city/o1l-28/`), A58, A59, D7, D8 |

### 4.2 Middle East and North Africa, 11 rows

| Row | v3 reading | Round measurement | Row action | Block |
|---|---|---|---|---|
| Turkey | A, rows key by ILCE CODE, not coordinates (the 9542 Kartal case) | All 81 provinces banked (29,565 rows), one recipe across 177,390 cells. The district layer is a COORDINATE REFINEMENT: difference-space residual 0.264 min median, deviation from the province table correlates 0.984 with longitude. GetDestinationUrl returns the PROVINCE id for Cubuk, Seferihisar and Arnavutkoy, the district select is the authoritative enumeration. 2027 NOT served publicly | Add the district layer, the resolver defect, the 2027 closure | O1l-15r turkey-cities (`o1l-city/o1l-15r/`), O1l-23 turkey-districts (`o1l-city/o1l-23/`), A63, A64, A65 |
| Morocco | margins shifted HALF A MINUTE, asr +1, sunrise -3 / maghrib +4 | The half-minute shift is NOT the change. The -1.42 asr shift of O1k-M1 does NOT reproduce (asr 99.8 pc within-1 at +0.33). Sea-level margins sunrise -3.13 / maghrib +3.80 equal the record's -3/+4. The rebuild's real change is the PER-CITY HORIZON TERM (bracket 5.85-17.54 min, corr 0.87 with elevation, monotone DEM bands 6.56-13.96). National margins plus term = 99.94 pc, 173/190 cities perfect. 190 cities x 2 months, 69,540 cells | Replace the between-year clause with the horizon term, keep the margins, add the December closure and the no-shift clock finding | O1l-39 morocco-cities (`o1l-city/morocco-cities/`), A4, A5, D4 |
| Oman | 18/18, CEIL rounding, +5 margins, eight years 2021-2028 | Six new cities prefer NEAREST over ceil. The deep2 amendment (17.8/18.15 +5 ceil) drops to 87-99 pc on them. Closed as RIDGE DEGENERATE, BOTH CARRY: 28,105 city-days over 2021-2031, seven cities. The exact-rate split is the ROUNDING MODE, and 0.08 deg reference-point uncertainty outweighs the 0.2 deg in dispute | Carry both parameterizations with the rounding-mode split, span 2021-2031 | O1l-8 mideast-cities (`o1l-city/mideast-cities/`), O1l-25 gaps-closed, A8, A9, D30 |
| United Arab Emirates | 60 areas, the 60 area coordinate anchors are not on the board | The anchors are RECOVERED with emirate ids, closing the named defect. 7 emirates, 30,960 area-days, 2026 full plus 2027 to 05-31. adhan 4.4.6's Dubai preset BAKES asr +3 and runs 2.77 MIN LATE against Dubai's own rows (0.0 pc exact on 1,794 rows): the package contradicts its namesake authority, asr margin 0 confirmed | Close the anchor defect, add the Dubai preset defect | O1l-41 uae-cities (`o1l-city/uae-cities/`), A34, A75 |
| Saudi Arabia | keyless GETs, ceiling 1501 = 400 | 43 governorate points, 30,487 city-days, 182,922 cells, exact 81.9-87.7 pc. The endpoint is COORDINATE-ONLY: city, cityId, id and name all return one byte-identical default payload, so the mission's id axis does not exist. Century holds at 1318H/1400H/1500H | Correct the API shape, add the 43-point span | O1l-40 saudi-cities (`o1l-city/saudi-cities/`), A33, D13, D14, D32 |
| Egypt | A, 82 city options, not 78 | 78 of 82 ESA cities serve full 2026: 28,468 rows, 28,468/28,468 day-rows all six within 1 (100 pc, 48.5 pc exact on all six). NO deviating city: the 13 that fail at gazetteer points pass 100 pc at their table's own implied point (17-61 km coordinate disagreement). NO elevation term (St Catherine at about 1,500 m is exact). Dar al-Ifta REUBLISHES ESA verbatim (150/180 Cairo values identical, the 30 diffs a swapped dhuhr meridiem) | Add the 78-city span, the implied-point finding, the no-elevation-term finding, the rival-publisher finding | O1l-14 egypt-82 (`o1l-city/egypt-82/`), A30, A31, A32, D17 |
| Tunisia | A, seven years 2020-2026, no July-angle note | 258 of 259 delegations swept (5,144 season rows) plus 1,722 capital and Djerba rows, 426 year-pair rows, 321 back-harvest rows. Per-site horizon dip = 0.0316 x sqrt(metres) - 0.0999 degrees, R2 0.980 (98.3 pc of the geometric slope). The July angle is a DATED SPLIT (2025-12-15 to 2026-01-15) where 20 Kairouan and Sidi Bouzid delegations DROP the DEM dip at unchanged 18.1/18.1 | Add the delegation sweep, the dip formula, rule form TN-INM-FLAT2026 | O1l-18r tunisia-cities (`o1l-city/tunisia-cities/`), O1l-25 gaps-closed, A28, A29, D1, D2 |
| Kuwait | provisional, 30 November days | Capital 2026 year banked: 365 rows, 18/17.5 at 99.8 pc, dhuhr and asr margins no longer null | Add the full year, clear the two null margins | O1l-8 mideast-cities, A47 |
| Jordan | margins sunrise -6 / dhuhr +1 / asr +1 / maghrib +7 / isha +1, F | MARGINS ARE REGIONAL NOT NATIONAL: Irbid and Aqaba carry their own sets (100 pc each, Aqaba 66.7 pc on Amman's), Zarqa sits inside Amman's group | Add the regional sets, grade does not move | O1l-8 mideast-cities, A48, D29 |
| Iraq | provisional, Baghdad anchor, 365/365 from the Diwan API | Baghdad re-derived 18.1+1 / 16.9+1 at 100 pc, no city axis (Basra 13.7 min out at Baghdad's recipe). SECOND SURFACE: mawaqit Jami al-Hasanayn 366 rows (18.08/16.93) drifts +4.6 dhuhr / +2.8 asr / +2.5 maghrib against the Diwan, and its calendar prints an impossible 2026-02-29 | Add the second surface and its drift, keep the national row at Baghdad | O1l-8 mideast-cities, O1l-47 megacities (`o1l-city/megacities/`), A49, A77 |
| Algeria | candidate, ministry feed known but UNREACHABLE, no series, no fit | 1447 complete for Alger, Adrar and Djelfa (884 days) plus a 1448 holdout. Frozen recipe per wilaya at own coordinates: Alger 97.4 pc within-1, Adrar 100, Djelfa 98.6. SUMMER MONTHS MOVE ONE PARAMETER: isha 16.10 with +5 leaves a -1.9 min January residual, while 17.00 with 0 ceil is the same printed curve and holds 2113/2113 plus 1074/1074 on the holdout. Constantine's imsak column is SUNRISE under an imsak header | Replace the candidate row with a fitted multi-year row, add the seasonal swap | O1l-17r algeria-1447 (`o1l-city/algeria-1447/`), A45, A46, D5 |

### 4.3 Africa, 3 rows

| Row | v3 reading | Round measurement | Row action | Block |
|---|---|---|---|---|
| Nigeria | the only Egyptian 19.5/17.5 line is masjidway's platform default ... (D6 reversed 2026-11-11, T-675 #7103) | Re-measured PUBLISHER-SHAPED, not geography-shaped: uniform north (Kaduna 6 mosques, 552 rows), middle belt (Abuja), south (Benin City 2), southeast (Enugu 1), every mosque-configured table is MWL 18/17 Shafi exact. Ile-Ife is MWL exact IN UTC with the whole table 60 min early (an off-zone bug). Osogbo 399 rows 2026-2027 zero margins | NO TEXT CHANGE: v3 already carries the reversal. Add the Ile-Ife off-zone defect and the evidence line | O1l-7 nigeria-states (`o1l-city/nigeria-states/`), A6, A7 |
| Cameroon | Ar-Rahma Douala: full-year, all six columns sun-tracking | That page computes at 7.3668/12.3533 (Adamawa), not Douala. Ngaoundere NEW 365 (18.00/17.00, maghrib+3, every column within 1, three mosque pages one byte-identical table) | RELABEL the anchor to the Adamawa point, add Ngaoundere as the second surface | O1l-33 central-africa (`o1l-city/O1l-33/`), A3, F9 |
| Tanzania | FALLBACK, BAKWATA negative, KSIJ Dar is Shia | Arusha 1,095 rows over 2025-27, one recipe, 365/365 all six within 1 in every year. The platform's Mwanza row is MALAWI's | Lift to A eligible (section 5), add the Mwanza mislabel defect | O1l-20r africa-cities, A42 |

### 4.4 Asia, Russia and the Caucasus, 14 rows

| Row | v3 reading | Round measurement | Row action | Block |
|---|---|---|---|---|
| Japan | Kobe Mosque has NO official website (kobemosque.info is a content farm) | KOBEMOSQUE.COM IS THE OFFICIAL SITE, and it warns against the fake sites. 366 dated rows plus 2025 PDFs identical to the minute (one generation), 18/17 Shafi +1, all-six 322/365. Its Maghrib column is the IQAMA | Replace the Kobe clause, add the iqama-column defect | O1l-24 japan-korea (`o1l-city/o1l-24/`), A1 |
| China | FALLBACK, the association publishes nothing | 18/17 REFUTED at all 29 provincial capitals (fajr +13.8 to +21.5). 15/15 Hanafi confirmed (4,176 city-days, rms 0.29-0.47). The grid is measurably a 2004 computation (2026 drifts fajr +0.34 to +0.82). islamichina.com's Urumqi computes at 117.5E (about 119 min early) | Replace the FALLBACK row with the measured row (section 3.3) | O1l-4 china-capitals, A22, A23, D28 |
| Pakistan | one chart, one recipe, dhuhr 13:00/13:15, isha a 15-minute clock ladder | The federal clock conventions DO NOT describe the provincial layer (6/366 hits in Multan, 0/366 in Karachi). Peshawar 18.0/18.0 Hanafi zero margins except maghrib sunset+1 and isha+1, all-six 348/366. Quetta 18.2/18.0 with dhuhr +1, maghrib sunset+2, isha +2, and ASR DOES NOT REPRODUCE (monthly residual -3.9 Jan to +5.5 May, zero crossings March and September). Four cities, four margin sets, one angle pair | Add the provincial family, flag the Quetta asr | O1l-12 pakistan-cities (`o1l-city/pakistan-cities/`), O1l-21r pakistan-charts (`o1l-city/o1l-21r/`), A24, A25, D25 |
| Malaysia | MARGINS RE-SET BY THE T-674 ARBITRATION ... zohor +1.5 alone | Census +2 ihtiyati scores 0 exact on fajr, asar and isyak across Perak's seven zones, Recipe B (18/18, zohor +1.5 only) carries all zones within 1. Refuted again in Negeri Sembilan. zon7 Bukit Larut carries an ELEVATION term (terbit -5.9, maghrib +5.6, month-invariant) | Add the Bukit Larut elevation term and the third-baseline confirmation | O1l-1 malaysia-states (`o1l-city/malaysia-states/`), A26, A27, D27 |
| Uzbekistan | display margins +5 (Ishroq +20, Shom +4) | REFUTED: 15.5/15.5 Hanafi, six columns 30/30 exact, maghrib sunset +4 | Strike the +5 margins | O1l-26 centralasia2-cities (`o1l-city/o1l-26r/`), A17 |
| Thailand | margins fajr 0, isha 0, the other four null, 365 days, one year | Margins measured at ZERO on all six columns (19.8/18.1 Shafi), 166,433/166,434 values within 1 across 77 provinces in 2026. Nan's printed longitude typo (the implied point reproduces all 2,190 rows), Ranong's normal block stops 30 Dec | Clear the four null margins, add the two defects, grade moves (section 5) | O1l-2 thailand-provinces (`o1l-city/thailand-provinces/`), A43, A44 |
| Maldives | MUIS day API (2036 verified, likely computed) | The served 2027/2031/2036 years DO NOT DIFFER AT ALL (0/365 month-day rows change, 1990 and 2050 print identical values). No span exists, the frozen generation is proven by direct test. Five more islands, 1,080 cells, every one within 1 of MABIMS 20/18 | Strike 2036 verified, add the frozen-generation proof | O1l-B1r wayback-back (`o1l-city/wayback-back/`), O1l-27 southasia-fringe, A54, D21 |
| Kazakhstan | A, the one unconfirmed constant | The served prayTimes.js reproduces deep1's 2026 table 365/365: NO publisher change. 49-year span at 100 pc. The 48N line settled by measurement: Karazhal 48.001042 takes set B, Ayagoz 47.966667 set A, and the wrong set puts four columns EXACTLY 2.00 min off | Confirm the constant, add the 48N measurement and the seven new cities | O1l-B1r wayback-back, O1l-26 centralasia2-cities, A55, D10 |
| India | FALLBACK (community de facto: the Karachi method) | 13,140 dated rows, 20 tenants, 8 cities fitted A-grade community. Authority tier unchanged. FLAGGED: isha 17 sits 4-5 min earlier than 18 across every city and season while the other four columns match | Replace the FALLBACK row with the mosaic (section 3.3), add the isha-line flag | O1l-11r india-cities, A69, F5 |
| Bangladesh | IFB permanent schedule of 72 date-bands, fajr 19.25 +8, isha 18.65 -1 | The artifact is found online at one mosque: Sylhet Bolura (mawaqit) 365 rows carrying 68 bands (42 of 5 days, 12 of 4, 7 of 7), dhuhr a fixed 13:10 clock, fajr 19.25, isha 18.65, HANAFI asr (Shafi off 58 min), maghrib sunset+3, 45 pc within-1 on both twilights. Dhaka shows NONE. Bolura's table implies a point 0.5 deg from its own mosque | Correct the band count to 68, record the artifact as DISTRICT/ZONE, SUPPORTED BUT UNPROVEN | O1l-13r bangladesh-cities (`o1l-city/o1l-13r/`), A70, D20 |
| Brunei | candidate, unfitted, prints 4.54 for 04:54 | 20/18 CONFIRMED (MORA 2026: 95.1/86.8 pc exact, 99.2 pc within-1, dhuhr transit+1), weak provenance carried | Replace the unfitted candidate with the fitted row | O1l-25 gaps-closed, A71 |
| Russia (CDUM) | mornings 2.6 min early, evenings 1.4 late, floor, Sibay off-rule all year | The quoted margins were C23's, computed 0.163 deg WEST of the published position, at the true position the same 18/17 recipe scores 95.5 pc within-1 with margins near 2 min. The 2026 sunrise defect reaches -68 min, not 22. Sibay is served a schedule for 55.81N, not its listed 52.72N | Replace the margin set, correct the sunrise defect, name the Sibay point | O1l-6r russia-boards, A10, A13, A14 |
| Russia (DUM RB) | 16/15 Hanafi, 63 cities, one year with a different-recipe prior year | The free-angle fit in the record was DEGENERATE (search bounds returned), replaced by level identification. 16/15 holds for 2026 ONLY (fajr median 16.05, within-1 98.9 pc), 2025's fajr fits NO single angle (18.6 pc). 34,886 rows, the regime change is DATED 2025 | Replace the fit basis, date the regime split | O1l-6r russia-boards, A11, A12 |
| Indonesia | candidate (partial published parameters), SIHAT is OWNER-GATED, ceiling 2029 | 38 of 38 provincial capitals at both publishers: Kemenag SIHAT 13,870 rows (fajr 20+2 floor 99.6 pc exact, isha 18+2 floor 99.4, within-1 100 pc), KHGT 27,740 rows 2026 plus 2027 (within-1 100 pc every city-year, frozen between years). BOTH publishers apply a horizon dip of 1.76 x sqrt(h) arcmin on sunrise and maghrib, from DIFFERENT elevation fields. SIHAT renders Mataram and Kupang on WIB, a civil hour early all year, Kemenag's cities?province_id filter is ignored | Replace the candidate row with both publishers fitted, add the dip and the two defects | O1l-3 indonesia-cities (`o1l-city/indonesia-cities/`), A60, A61, D3 |

### 4.5 Americas, 3 rows

| Row | v3 reading | Round measurement | Row action | Block |
|---|---|---|---|---|
| United States | candidate (community tier), 16 mosques | 33 of 64 metros now carry a dated surface (+2 held metros gain a mosque): 33,513 rows across 41 surfaces. 15/15 verdict 26 of 37 plain ISNA (70 pc), 31 in the 15-family. Three-year angle movement within 0.10 deg on 24 clean surfaces. Defects: Omaha a DATED 2026 regime change (15/15 to 18.47 plus a fixed isha interval), Mobile computing Houston coordinates, two dpt installs with zeroed years, Little Rock serving 2023, Anchorage's alaskamasjid.org computes MAKKAH client-side (no Anchorage data exists) | Replace the evidence line, add the five defects | O1l-5 us-states (`o1l-city/us-states/`), O1l-37 us-unresolved (`o1l-city/us-unresolved/`), A50, A51, A52, A53 |
| Trinidad and Tobago | the Chaguanas profile timezone is -05:00 ... sits AN HOUR EARLY | The tz LIES America/New_York (the value flips before the label) and the -1h defect is STILL LIVE after the slug moved. New Ilmul Islam 15/15 provisional, Darul Uloom candidate | Sharpen the defect: the label lies, the value flips, the defect persists | O1l-9 latam-cities, A57 |
| Chile | provisional with a polar branch, MULTI-YEAR PATH: none from the publisher | Regime boundary DATED 2016-2025: 2016 carries no clock offset (sunrise -0.4), the 2025 workbook +6 on every column. 2016 era captured (18 PDFs, 558 rows) and fitted: one recipe across 34.9 deg latitude at 97-100 pc | Add the dated regime boundary and the 2016 fit | O1l-B1r wayback-back, A56 |

### 4.6 Oceania, 3 rows

| Row | v3 reading | Round measurement | Row action | Block |
|---|---|---|---|---|
| Fiji | fajr EXACTLY 18.0, dhuhr +3, maghrib +3, isha +5-9 past 17 deg | dhuhr is transit +5 to +6, NOT +3 (the +3 scores 0/365). isha is an INTERVAL table (maghrib +75 exact March to September). The live page still serves the 2024 set, all twelve 2024 sheets captured (365 rows), 365/365 within-1 on fajr, sunrise, dhuhr, Shafi asr and maghrib (sunset+3). The Facebook November-2026 sheet is IDENTICAL to November 2024 (210 cells, zero diffs) | Correct dhuhr and isha, add the interval form | O1l-35 pacific2, A39, A40, D18 |
| New Caledonia | a 19:45 floor holds 243 days | Re-confirmed at exactly 243 days, dhuhr and asr are hand blocks, a new iqama layer is held | Confirm, add the iqama layer | O1l-35 pacific2, A41, D19 |
| New Zealand | candidate (held), Ramadan-only artifacts, 90 rows | A twenty-year pair test: the FIANZ pairs are IDENTICAL in Ramadan 1427 (2006, Wayback, 465 rows) and 1447 (2026, 90 rows). Auckland 18/18, Hamilton 18/18, Wellington/Christchurch/Dunedin 16/15, Tauranga 17/17. ONE ENGINE, ZERO DRIFT. Dated regime change: double-shadow asr +1h15 in 2006 against +40 min in 2026 | Add the pair test and the dated asr change, no lift (identical generations) | O1l-19r australia-nz (`o1l-city/o1l-19r/`), A66, D31 |

### 4.7 The four non-row items

| Item | Round measurement | Where it lands | Block |
|---|---|---|---|
| Coordinate ledger | The Americas' 166-of-167 unplaceable surfaces were an UNREAD FIELD (Masjidal masjid_info.location, mawaqit lat/lon, Masjidbox JSON-LD PostalAddress, dpt street text, radioislam city per sheet): UNKNOWN falls 166 to 0. Separately, 14 ledger records carry the WRONG COUNTRY (12 US files under CA, plus Guatemala and Honduras). Ledger total 1,547 records, USABLE 1,247 | `coords-ledger` becomes the resolver's input layer, the 14 country fields are corrected | O1l-34 coords-americas (`o1l-city/coords-americas/`), O1l-C1 coords-ledger (`o1l-city/coords-ledger/`), A35, A36 |
| Fitter bug | `const isha` then `+= 1440` silently drops any year containing one after-midnight isha. PRESENT IN THE US-STATES COPY TOO | Fit-index integrity note, every year-scored fit must be re-run or checked for the dropped-year class | O1l-37 us-unresolved, A53, D9 |
| mawaqit platform | The STORED calendar is a DIFFERENT GENERATION from the live page at Plymouth and Lincoln. Also: the calendar PDF accepts ?year=2027 and returns the 2026 table relabelled, 365/365 identical | New defect class, the live page is the surface of record | O1l-28 uk-seconds2, O1l-33 central-africa, A59, D7 |
| masjidi.app platform | ALL 37 sampled masjidi.app tables FAIL the solar gate at 6.2-8.1 min RMS (an engine mismatch). New Peckham London carries a jama'ah schedule in the athan slot (rms 19.9), Halton Burlington a 63-day DST block | Pool enumerated, not fitted, engine mismatch carried as a lead | O1l-43 masjidal-global, A76 |

---

## 5. GRADE MOVEMENTS

56 items from register table C. The movement column quotes the register's own wording. Where the
wording sits outside the six v3 classes it is carried as written and counted as UNNAMED in 5.2.

### 5.1 The 56 movements

| # | Object | Movement | Basis in one line | Block |
|---|---|---|---|---|
| C1 | Thailand | provisional to A-CANDIDATE | 77 of 77 CICOT provinces, 56,286 rows, two year-blocks, one recipe (19.8/18.1 Shafi, zero margins), parameters frozen. The leap block cannot separate 2024 from 2028, so no year is asserted | O1l-2 thailand-provinces |
| C2 | India | FALLBACK to community MOSAIC, 8 cities A-grade | 13,140 dated rows, 20 tenants, authority tier unchanged | O1l-11r india-cities |
| C3 | China | FALLBACK to measured | 29 capitals at 15/15 Hanafi (4,176 city-days) plus a 10,220-row platform surface, no mainland authority publishes a timetable | O1l-4 china-capitals |
| C4 | Mexico | FALLBACK to A | Guadalajara masjidbox walk 385 rows 2025-10 to 2026-11, MWL 18/17, worst 1, two years, Monterrey a second surface at 15/15 | O1l-9 latam-cities |
| C5 | Brazil | provisional to A on two years | 25 IIB cities, 3,000 rows, MWL 18/17 zero margins, 18,000 cells 99.7 pc within-1, one recipe across 2025 and 2026 | O1l-9 latam-cities |
| C6 | Colombia | candidate to A | Cartagena masjidbox 385 rows, MWL 18/17 within-1 | O1l-9 latam-cities |
| C7 | Peru | candidate to provisional | Lima suite run and passed, fresh capture byte-identical, MWL 18/17 + maghrib +3, 365/365 | O1l-9 latam-cities |
| C8 | Tanzania | FALLBACK to A ELIGIBLE | Arusha 1,095 rows over 2025-27, one recipe, 365/365 all six within 1 every year | O1l-20r africa-cities |
| C9 | Uganda | FALLBACK to country-first fitted | Entebbe 365 rows, clean 15/15 | O1l-20r africa-cities |
| C10 | Central African Republic | FALLBACK to provisional | Bangui 365, ISNA 15/15, 365/365 within-1 | O1l-48 fallback-sweep |
| C11 | Western Sahara | FALLBACK to candidate | Laayoune and Dakhla 60 rows, 30/30 within-1 | O1l-48 fallback-sweep |
| C12 | Madagascar | FALLBACK to candidate | 3 mosques, 1,095 rows | O1l-48 fallback-sweep |
| C13 | Guinea-Bissau | FALLBACK to candidate | Bissau 365 rows | O1l-48 fallback-sweep |
| C14 | Japan | candidate to provisional | Kobe 366 dated rows plus 2025 PDFs identical to the minute, 18/17 Shafi +1, all-six 322/365 | O1l-24 japan-korea |
| C15 | Korea | candidate, three new city-years | Daegu, Seoul Masjid Noor and Yangju Gatbawi, 365/365 each at 18/18 or 18/17 Hanafi | O1l-24 japan-korea |
| C16 | Tonga | candidate to provisional | 365 rows fitted, five columns 365/365 within-1 | O1l-35 pacific2 |
| C17 | Malta | absent to CANDIDATE, wtdiff entry required | three surfaces, 1,460 rows, one fitting two years | O1l-36 microstates |
| C18 | Andorra, Liechtenstein, San Marino | new to candidate | 365, 396 and 365 rows | O1l-36 microstates |
| C19 | Algeria | candidate to fitted multi-year | 1447 complete for Alger, Adrar and Djelfa (884 days) plus a 1448 holdout, frozen per-wilaya recipe (97.4 / 100 / 98.6 pc within-1) | O1l-17r algeria-1447 |
| C20 | Kazakhstan | A, span widened | 49-year span at 100 pc (8 Astana years, 2,921 rows) plus 7 new cities at 1,095 rows each, the 48N line settled by measurement | O1l-B1r wayback-back, O1l-26 centralasia2-cities |
| C21 | Oman | A, span widened | 2021-2031, seven cities, 28,105 city-days, 100 pc within-1 on 18/18 nearest | O1l-25 gaps-closed |
| C22 | Saudi Arabia | A, span widened | 43 governorate points, 30,487 city-days, 182,922 cells, exact 81.9-87.7 pc, century holds at 1318H/1400H/1500H | O1l-40 saudi-cities |
| C23 | United Arab Emirates | A, span widened | 7 emirates, 30,960 area-days, 2026 full plus 2027 to 05-31, within-1 89.7-100 pc | O1l-41 uae-cities |
| C24 | Turkey | A, span widened | 81 provinces 29,565 rows plus 144 district tables 55,480 rows, one recipe across 177,390 cells | O1l-15r turkey-cities, O1l-23 turkey-districts |
| C25 | Morocco | A, span widened | 190 cities x 2 months, 69,540 cells, national on four columns, city-varying on two | O1l-39 morocco-cities |
| C26 | Egypt | A, span widened | 78 of 82 ESA cities, 28,468 rows, 28,468/28,468 day-rows within 1 | O1l-14 egypt-82 |
| C27 | Tunisia | A, span widened | 258 of 259 delegations, 5,144 season rows plus 1,722 capital and Djerba rows, 426 year-pair rows, 321 back-harvest rows | O1l-18r tunisia-cities |
| C28 | Indonesia | candidate to both publishers fitted | Kemenag 13,870 rows and KHGT 27,740 rows (2026 plus 2027, frozen between years), within-1 100 pc every city-year | O1l-3 indonesia-cities |
| C29 | Germany (EU-Diyanet scheme) | provisional, PROVEN-TO-2027-11 | IGMG mirror 11,076 rows, byte-identical on 2,116/2,116 overlaps, a mirror of one generation cannot lift to A | O1l-42 germany-cities |
| C30 | Russia (DUM RB) | provisional, 63 settlements | 34,886 rows, the 16/15 recipe holds 2026 only, so the 2025 regime change bars a lift | O1l-6r russia-boards |
| C31 | Russia (DUM RT) | A, span widened | 44 cities, 32,120 rows, zero gaps, 43 of 44 CSVs byte-identical to C23 | O1l-6r russia-boards |
| C32 | United States | candidate, 33 of 64 metros dated | 33,513 rows across 41 surfaces, 15/15 verdict 26 of 37 plain ISNA, 31 in the 15-family, 25 metros stay unproven | O1l-37 us-unresolved, O1l-5 us-states |
| C33 | Australia | candidate, complete at the gazetteer | 218 Diyanet grid points, 79,570 rows, one recipe within 2 min on all 365 days | O1l-19r australia-nz |
| C34 | New Zealand | candidate, twenty-year pair test | FIANZ pairs identical 2006 and 2026, one engine, zero drift, no lift (identical generations) | O1l-19r australia-nz |
| C35 | Fiji | provisional, recipe corrected | 12 sheets, 365 rows, five columns 365/365 within-1 after the dhuhr and isha corrections | O1l-35 pacific2 |
| C36 | New Caledonia | candidate, machine-readable | 365 rows on mawaqit with a new iqama layer, between-year stability still untestable | O1l-35 pacific2 |
| C37 | Pakistan | provisional, four-city provincial family | Karachi, Multan, Peshawar, Quetta: four margin sets, one angle pair, one madhab, perpetual undated charts cap the grade | O1l-12 pakistan-cities, O1l-21r pakistan-charts |
| C38 | Bosnia and Herzegovina | provisional, 61 cities | 22,265 city-days, 71.5 pc within-1, one generation (the frozen-generation precedent bars a lift) | O1l-16r balkan-cities |
| C39 | Malaysia | provisional, 59 zones | Perak 7 zones 2,555 rows, Penang 354 rows, Melaka 355 rows at A-grade class, Negeri Sembilan 730 rows | O1l-1 malaysia-states |
| C40 | Mauritius | community held | full 2026 year fitted, year-2 structurally negative (the same 365 rows re-ship per year) | O1l-A2 span-ledger |
| C41 | Cyprus (north) | provisional, constant dated | the 2025 edition passes on one additive constant, two honest editions would open A | O1l-A2 span-ledger |
| C42 | Kuwait | provisional, margins now measured | capital 2026 year, 365 rows, 18/17.5 at 99.8 pc | O1l-8 mideast-cities |
| C43 | Iraq | provisional, Baghdad re-derived | 18.1+1 / 16.9+1 at 100 pc, no city axis | O1l-8 mideast-cities |
| C44 | Bangladesh | provisional, band artifact supported | 68 bands on one mosque table, 45 pc within-1 both twilights, the quantization cap confirmed by construction | O1l-13r bangladesh-cities |
| C45 | Maldives | provisional, one recipe across 7.6 deg | five more islands, 1,080 cells, every one within 1 of MABIMS 20/18, frozen generation bars a lift | O1l-27 southasia-fringe, O1l-B1r wayback-back |
| C46 | Brunei | candidate to fitted 20/18 | MORA 2026: 95.1/86.8 pc exact, 99.2 pc within-1, dhuhr transit+1 | O1l-25 gaps-closed |
| C47 | Austria | provisional, drift measured | fajr drift only (mean 12.8 min early, worst 29 in August), isha sync 245/245 | O1l-25 gaps-closed |
| C48 | Switzerland | candidate, undecidable | IZRS login-walled, no dated rows exist | O1l-25 gaps-closed |
| C49 | Ireland | candidate, new 26-city surface | 9,459 rows, horizon -1.26, dhuhr noon+2.00, winter 16.2/15.2, summer isha capped maghrib+90 for 30-43 days, one cycle | O1l-29 ireland-wales-iom |
| C50 | Finland | candidate, two city findings | Jyvaskyla 353 rows 18/17 exact (spans into Jan 2027), Turku and Tampere a measured 15/12 line, Oulu corrected | O1l-31 nordics2-cities |
| C51 | Iceland | A, nine cities | 14.2/14.0 EXACT at all nine, Isafjordur and Selfoss refuse (20 towns probed) | O1l-31 nordics2-cities |
| C52 | Norway | candidate, 10 cities | IRN 16/15 exact on angle-honest days, mawaqeet 18/15 at five, polar placeholders sized per city | O1l-31 nordics2-cities |
| C53 | Denmark | candidate, a fourth Danish line | Aarhus, Odense, Aalborg and Esbjerg exact | O1l-31 nordics2-cities |
| C54 | Jordan | F row, regional margins measured | Irbid and Aqaba carry own sets, the block does not move the row's grade | O1l-8 mideast-cities |
| C55 | United Kingdom | 49 to 75 surfaces | 26 new surfaces, Scotland 14 new dated surfaces, London 9 new borough surfaces, six one-month towns lifted to years | O1l-28 uk-seconds2, O1l-B2 uk-seconds |
| C56 | dpt and masjidal pool | pool enumerated, 216 tenants | US 174, Canada 21, UK 12, Australia 6, Hong Kong 1, Mauritius 1, Chile 1, a FLOOR not a census, sample 18 tenants x 3 years, 19,728 athan rows, seven at zero margins 100 pc | O1l-43 masjidal-global |

### 5.2 What the count shift is, and the arithmetic that proves it

v3 classes (174 rows): A 17, provisional 40, candidate 65, community 15, F 2, FALLBACK 35.

Class-changing movers, each counted once:

| Mover | From | To | Source |
|---|---|---|---|
| Mexico | FALLBACK | A | C4 |
| Brazil | provisional | A | C5 |
| Colombia | candidate | A | C6 |
| Niger | A | provisional | v3 fold (the D3 consequence, held) |
| Peru | candidate | provisional | C7 |
| Japan | candidate | provisional | C14 |
| Tonga | candidate | provisional | C16 |
| Central African Republic | FALLBACK | provisional | C10 |
| Ecuador (new row) | none | provisional | B14 |
| Thailand | provisional | A-candidate (UNNAMED) | C1 |
| Algeria | candidate | fitted multi-year (UNNAMED) | C19 |
| Brunei | candidate | fitted 20/18 (UNNAMED) | C46 |
| Uganda | FALLBACK | fitted (UNNAMED) | C9 |
| Tanzania | FALLBACK | A eligible (UNNAMED) | C8 |
| China | FALLBACK | measured (UNNAMED) | C3 |
| India | FALLBACK | community | C2 |
| Western Sahara | FALLBACK | candidate | C11 |
| Madagascar | FALLBACK | candidate | C12 |
| Guinea-Bissau | FALLBACK | candidate | C13 |
| 9 new country candidates | none | candidate | N1, N2, N7, N10, N13, N15, N16, N17, N18 |
| 8 new country community rows | none | community | N3, N4, N5, N6, N8, N9, N11, N12 |

Resulting classes:

| Class | v3 | Moves | After |
|---|---|---|---|
| A | 17 | +3 (Mexico, Brazil, Colombia), -1 (Niger) | **19** |
| provisional | 40 | -2 (Brazil, Thailand), +6 (Peru, Japan, Tonga, CAR, Ecuador, Niger) | **44** |
| candidate | 65 | -6 (Colombia, Peru, Japan, Tonga, Algeria, Brunei), +3 (Western Sahara, Madagascar, Guinea-Bissau), +9 (new countries) | **71** |
| community | 15 | +1 (India), +8 (new countries) | **24** |
| F | 2 | none (Jordan stays F) | **2** |
| FALLBACK | 35 | -9 (Mexico, CAR, Western Sahara, Madagascar, Guinea-Bissau, Uganda, Tanzania, China, India) | **26** |
| UNNAMED (moved out of a class, no class named) | 0 | +6 (Thailand, Algeria, Brunei, Uganda, Tanzania, China) | **6** |

Identity check: 19 + 44 + 71 + 24 + 2 + 26 + 6 = 192, and 174 v3 rows + 18 new country rows = 192.
The arithmetic closes with no row unaccounted for.

**The single most consequential count fact:** FALLBACK falls 35 to 26 while A rises 17 to 19 only.
Nine rows leave FALLBACK (six lifts in section 3.2, two moved to measured in section 3.3, Mexico in
section 5), and eighteen countries enter. The round's work is DISCOVERY, not grade lifting. Six of
its most substantive results (Thailand, Algeria, Brunei, Uganda, Tanzania, China) cannot enter any
count until the close names their class.

**Two contested classes the close must rule, not the diff:**
- Brazil is community tier and the register writes A. v3 has no community-tier row in the A class.
  Adopting the register makes Brazil the first, keeping v3's convention holds it at community with a
  two-year note.
- India's 8 cities are "A-grade community" inside a FALLBACK-to-community-mosaic row. The row is
  community. The cities are not rows.

---

## 6. RULE-FORMS

32 forms from register table D. The nine the mission names are D1 to D9, given in full first.

### 6.1 The nine named forms, in full

**D1, TN-INM-FLAT2026.** A dated split inside Tunisia: from 2025-12-15 to 2026-01-15, 20 Kairouan
and Sidi Bouzid delegations DROP the DEM horizon dip (dip 0) at unchanged 18.1/18.1. The July
"17.3 angle" the o1k record flagged is not an angle at all. 100/100 July rows within-1, and a
129-day 2026 replay is 100 pc within-1. Builder consequence: a Tunisia object needs a dated
override window, not a seasonal angle. Blocks: O1l-25 gaps-closed, O1l-18r tunisia-cities.

**D2, DEM horizon-dip formula.** Per-site dip = 0.0316 x sqrt(metres) - 0.0999 degrees, R2 0.980
(98.3 pc of the geometric slope). The flat-horizon fajr residual is 0.166 x sqrt(m) - 0.432 min,
which is 2.4 min at 300 m and 4.0 min at 700 m. Latitude R2 0.026 against elevation 0.921, so
elevation is the term. The dip lifts all-five-within-1 from 58.3 pc to 92.7 pc. Block: O1l-18r
tunisia-cities.

**D3, elevation arcmin dip.** Both Indonesian publishers apply a horizon dip of 1.76 x sqrt(h)
arcmin on sunrise and maghrib, computed from DIFFERENT elevation fields (Bandung and Jayawijaya
give -6/+7 against a flat -3/+3). Same class as D2, a different constant and a different unit.
Block: O1l-3 indonesia-cities.

**D4, Morocco per-city horizon term.** The bracket offset runs 5.85 to 17.54 min, correlates 0.87
with elevation, and falls in monotone DEM bands 6.56 to 13.96. National margins plus the term give
99.94 pc and 173 of 190 cities perfect. Block: O1l-39 morocco-cities.

**D5, Algeria seasonal angle-margin swap.** isha 16.10 with a +5 margin leaves a -1.9 min January
residual. isha 17.00 with 0 ceil is the SAME printed curve and holds 2113/2113 plus 1074/1074 on
the 1448 holdout at worst 1. One parameter moves in summer, and the margin absorbs it. Block:
O1l-17r algeria-1447.

**D6, IRN asr school switch.** The IRN (Norway, Rabita line) asr column is SHAFI in CEST and
HANAFI in CET, switching on the DST dates. A seasonal school switch, not a margin. Builder
consequence: the Norway Rabita object needs two asr entries with a DST trigger. Block: O1l-31
nordics2-cities.

**D7, mawaqit stored-vs-live generation.** The STORED calendar is a DIFFERENT GENERATION from the
live page at Plymouth and Lincoln. The calendar PDF also accepts ?year=2027 and returns the 2026
table relabelled, 365/365 identical (O1l-33). Builder consequence: the live page is the surface of
record and a stored calendar is never evidence of a second year. Blocks: O1l-28 uk-seconds2, O1l-33
central-africa.

**D8, go2masjid forward year.** The `slim=365` path serves a PROVEN FORWARD YEAR to 2027-11-10.
The only platform path in the round that carries a real future year. Block: O1l-28 uk-seconds2.

**D9, the fitter bug.** `const isha` followed by `+= 1440` silently drops any year containing one
after-midnight isha. PRESENT IN THE US-STATES COPY TOO. Consequence for the close: any multi-year
score produced by that fitter has one fewer year than it reports, and the fit index needs an
integrity note plus a re-check of every year-scored US and masjidal fit. Block: O1l-37
us-unresolved.

### 6.2 The remaining 23

| # | Rule form | Statement as measured | Block |
|---|---|---|---|
| D10 | Kazakhstan 48N hard switch | set A (sunrise -3, dhuhr/asr/maghrib +3) below 48N, set B (-5/+5) at or above, the wrong set puts four columns EXACTLY 2.00 min off, Karazhal 48.001042 takes B, Ayagoz 47.966667 takes A | O1l-26 centralasia2-cities |
| D11 | Turkey district refinement | difference-space residual 0.264 min median (141/144 under 0.5), deviation against the province table median 1.76 min, max 6.76, correlating 0.984 with longitude (0.211 latitude) | O1l-23 turkey-districts |
| D12 | Russia Ufa fixed-interval recipe | fajr = sunrise-100, isha = maghrib+90, maghrib = sunset+4, dhuhr = max(13:30, noon+5), asr = Hanafi of the date plus ten days, suhur = fajr-20, cell-exact 90.8 pc | O1l-6r russia-boards |
| D13 | Saudi single-formulation rule | prayers = floor(raw + 1 min), arithmetically the same minute as ceil-of-raw, a builder applying BOTH lands a minute late (23.9 pc exact) | O1l-40 saudi-cities |
| D14 | Saudi Ramadan interval | isha = maghrib+120 on every Ramadan day, +90 otherwise, exactly two values across 43 cities and both years, zero violations | O1l-40 saudi-cities |
| D15 | UAE ridge-degenerate pair | 18.2/18.2 with many angle pairs fitting equally, the data does not discriminate the pair | O1l-41 uae-cities |
| D16 | Bosnia generation plus twilight scalar | one Sarajevo-anchored generation redistributed by 4 min/degree longitude, plus one scalar k per city (fajr +k, isha -k) | O1l-16r balkan-cities |
| D17 | Egypt national point-recipe | 19.5/17.5 zero margins Shafi nearest serves 22.32N (Halaib) to 31.73N (Saloum) at the user's own coordinates, 100 pc within 1 | O1l-14 egypt-82 |
| D18 | Fiji isha interval | isha is maghrib +75 exact March to September, an interval table not an angle | O1l-35 pacific2 |
| D19 | New Caledonia isha ladder | a 19:45 floor for 243 days, then 7-day blocks tracking sunset+85, plus a Ramadan taraweeh override at 20:15 | O1l-35 pacific2 |
| D20 | Bangladesh IFB band artifact | 68 bands (42 of 5 days, 12 of 4, 7 of 7) with dhuhr a fixed 13:10 clock, fajr 19.25, isha 18.65, Hanafi asr, the quantization cap holds by construction | O1l-13r bangladesh-cities |
| D21 | Maldives frozen generation | the mirror's 2027/2031/2036 years are byte-identical to the base (0/365 month-day rows change), no span exists | O1l-B1r wayback-back |
| D22 | Ireland high-latitude form | horizon -1.26 both ends, dhuhr noon+2.00, winter fajr 16.2 / isha 15.2, summer isha capped maghrib+90 for 30-43 days, summer fajr UNMODELLED | O1l-29 ireland-wales-iom |
| D23 | Muhammadiyah 2026 change | the association DROPS the elevation correction in 2026 (a dated rule change, flagged) | O1l-32 indonesia2 |
| D24 | jadwalsholat line | Kemenag 20/18 plus a uniform +2 min, with Kemenag's elevation dip OMITTED, frozen 2024-2028 | O1l-32 indonesia2 |
| D25 | Pakistan chart layout traps | column 2 is fajr MINUS 5 min and column 16 is the maghrib WINDOW LENGTH, not a clock time | O1l-21r pakistan-charts |
| D26 | masjidway month rendering | /prayer/MMYYYY renders ANY month (January 2028 verified) | O1l-7 nigeria-states |
| D27 | e-Solat year parameter | HTTP 200 with the year parameter SILENTLY IGNORED (payload opens 01-Jan-2026) | O1l-1 malaysia-states |
| D28 | China 2004 grid | the national grid is measurably a 2004 computation (2026 drifts fajr +0.34 to +0.82), its form note states it | O1l-4 china-capitals |
| D29 | Jordan regional margin sets | Irbid and Aqaba carry their own margin sets, Zarqa sits inside Amman's group | O1l-8 mideast-cities |
| D30 | Oman rounding-mode split | 18/18 nearest against 17.8/18.15 ceil: the exact-rate split is the ROUNDING MODE, and 0.08 deg reference uncertainty outweighs the 0.2 deg in dispute | O1l-25 gaps-closed |
| D31 | New Zealand double-shadow asr | asr +1h15 in 2006 against +40 min in 2026, a dated regime change inside one engine | O1l-19r australia-nz |
| D32 | Saudi century rule | no regime change across 1318H-1500H: 7 Hijri years at Makkah and Medina, 6,379 rows, 183-year span, 100 pc within-1 | O1l-B1r wayback-back |

### 6.3 Consequences for policy-layer.v2.5.json (read-only, nothing edited)

**18 objects to add**, one per new country row: Malta, Congo-Brazzaville, Equatorial Guinea, Cuba,
Puerto Rico, Haiti, Barbados, Belize, El Salvador, Dominican Republic, Panama, Costa Rica, Jamaica,
Ecuador, Bolivia, Andorra, Liechtenstein, San Marino. 87 objects become 105.

**35 existing objects carry field changes:**

| Field family | Objects |
|---|---|
| `reference` (elevation, horizon term, zone table, district layer) | MA-HABOUS, AE-AWQAF, TN-INM, JO-AWQAF, TR-DIYANET-DOMESTIC, KZ-MUFTIYAT, MY-JAKIM, BA-RIJASET |
| `margins` (values corrected or nulls cleared) | RU-CDUM, UZ-ISLOM, TH-CICOT, KW-AJIRI, BA-RIJASET |
| `rounding` (both modes now carry, or mode measured) | OM-MARA |
| `asr` (seasonal school switch) | NO-RABITA |
| `fajrRule` / `ishaRule` (form corrected) | FJ-FML, ME-IZMR, PK-NIZAM-E-SALAT |
| `derivedTimes` (iqama layer added) | NC-NOUMEA |
| `evidence` (span, rows, years) | EG-ESA, SA-KACST, IQ-DIWAN, RU-DUMRT, MV-MUIS, EU-DIYANET-UNIFIED, BR-IIB, IS-FELAG, TH-CICOT, KZ-MUFTIYAT, TN-INM, MA-HABOUS |
| `notes` / `gaps` (defects, closures, flags) | AT-IZW, FI-PORTAL, CY-KKTC, PT-HSALAH-HUB, CL-CIS, TT-MASJIDBOX, NZ-FIANZ, CI-COSIM, BD-IFB, SA-KACST, AE-AWQAF, TR-DIYANET-DOMESTIC, IQ-DIWAN, UZ-ISLOM, MY-JAKIM, OM-MARA, ME-IZMR, BA-RIJASET, RU-CDUM, FJ-FML |

**11 rows with no object today, where the close must decide.** These rows move into a class that
v2.5 normally carries an object for, and no object exists: China, Japan, India, Indonesia, Mexico,
Colombia, Peru, Tanzania, Uganda, Ireland, North Macedonia. The diff does not propose recipes for
them. It names the gap.

**One field the round proves load-bearing and v2.5 does not model:** the mawaqit stored-vs-live
generation split (D7) and the go2masjid forward year (D8) are SURFACE-PROPERTY facts, not recipe
facts, and no existing field carries them.

---

## 7. What the register flags and this diff could not settle

The register's own flags F1 to F17, each with what the diff did with it.

| Flag | Item | State after this diff |
|---|---|---|
| F1 | Oman parameterization | SETTLED AS UNDECIDED. Both parameterizations carry, the split is the rounding mode (D30). The row must print both. No arbitration is possible on the data held |
| F2 | Quetta asr | OPEN. A smooth annual swing of about plus or minus 5 min with zero crossings in March and September, cause not named. Carried as a defect on the Pakistan row |
| F3 | Macedonia fajr | OPEN AND WIDENED. bfi.mk against vaktija.eu differ by +45 min on fajr, both stay. The row also gains a second web surface where v3 said none existed |
| F4 | Portugal, Porto | OPEN. The monthly sheet's asr runs +39 to +54 against its own annual. Convention against error unresolved |
| F5 | India isha line | OPEN, for the fit index. isha 17 sits 4-5 min earlier than 18 in every city and season while the other four columns match |
| F6 | O1l-21r counted twice | RESOLVED in section 2.1: 366 chart rows, 365 dated rows |
| F7 | US 15/15 denominators | RESOLVED in section 2.1: 26 of 37 governs |
| F8 | Capitals count | RESOLVED in section 2.1: 194 of 202, 195 with Delhi for New Delhi |
| F9 | Cameroon label | RESOLVED as a row action: relabel to the Adamawa point. The row text still says Douala until the close writes it |
| F10 | Malta | RESOLVED as a row addition (N1). Nothing in either record file mentions Malta |
| F11 | Kelantan split void | NOT REPRESENTED. No O1l block carries a Kelantan measurement. The record's own void stands untouched |
| F12 | Benin / Kandi | NOT REPRESENTED IN THE REGISTER, BUT NOT EMPTY. No register block carries Benin. The post-cut westafrica2 report carries Savalou (section 8), which the close must read before writing the Benin row |
| F13 | Mauritius | NOT REPRESENTED. No O1l block carries a Mauritius measurement, the span ledger holds it at SINGLE-CYCLE with a structurally negative year-2 |
| F14 | masjidi.app engine | OPEN. All 37 sampled tables fail the solar gate at 6.2-8.1 min RMS, cause not named |
| F15 | Iran, Tehran | OPEN AND DELIBERATELY UNTOUCHED. A 30-row table exists (95/149) and is NOT claimed against the record's closure |
| F16 | Blocks not returned at cut-off | PARTLY ANSWERED by section 8. Three reports now exist on disk, ten blocks still hold nothing |
| F17 | Platform traps | RECORDED, not a diff item. goldenmosque.org is Rochdale UK, arresala and fambras are Sao Paulo, masjidway 9631 is Hyderabad, Cairo's Awqaf site has no prayer-times section |

### 7.1 Flags this diff raises that the register does not carry

| # | Item | Why it blocks a clean close |
|---|---|---|
| G1 | Six rows moved out of a class with no class named (Thailand, Algeria, Brunei, Uganda, Tanzania, China) | The count cannot be finalised. Section 5.2 counts them as UNNAMED and shows the identity still closes |
| G2 | Eleven rows now need an object and have none | policy-layer cannot be regenerated for those rows without a decision the diff is not entitled to make |
| G3 | Brazil's A at community tier | v3 has no precedent for it. Either the register's A is adopted and the convention changes, or Brazil holds at community with a two-year note |
| G4 | Malta, Andorra, Liechtenstein and San Marino appear in NEITHER record file | The close adds four rows and four objects, not edits |
| G5 | Surface-property facts have no field | D7 and D8 cannot be expressed in v2.5 as it stands |
| G6 | The fitter bug's blast radius | D9 invalidates an unknown number of multi-year scores. The diff cannot size it, and no block re-ran the affected fits |
| G7 | Cameroon's row text | The measurement is recorded, the row still names Douala. A close that forgets this ships a mislabelled anchor |
| G8 | The 14 wrong-country ledger records | 12 US files under CA, plus Guatemala and Honduras. Correcting them changes which country owns those surfaces |

---

## 8. Blocks that landed after the register's cut, or have not landed (NOT counted above)

The register closed at 06:34Z with 52 blocks. The monitor shows 13 workspaces still live at this
build. Three have a report on disk. Their content is real and the close must read it, but none is in
the 52-block corpus, so none is in the counts.

### 8.1 Reports on disk, not in the register

| Block (workspace) | What it holds | What it would change |
|---|---|---|
| O1l-46 il-ps (`o1l-city/il-ps/`) | The Jerusalem ceiling is LIFTED and by an unexpected mechanism: the Awqaf homepage yields 78 distinct dated days, and the year comes from the publisher's own PERPETUAL PRINT (366 dated month-day rows), which matches 77 of 78 live days at a constant +60 minutes. Recipe 18/18 Shafi, sunrise -3, maghrib +6, dhuhr floor, confirmed on the full year (94.8 pc within-1, worst 4). Parameters frozen 2024-2026, one generation, so no A lift. Page 2 of the print is the FIRST AUTHORITY CITY LAYER for the whole territory: 23 cities at offsets 0 to +4 min from Jerusalem, covering Hebron, Jericho, Qalqilya, Be'er Sheva and Gaza. The mosque layer is reframed: every mawaqit page carries the Awqaf print plus that city's offset, and the per-mosque difference lives in iqama | Jerusalem row: 47 days to 366 rows, grade stays provisional, add the city layer and the mosque-layer finding. Palestine row: gains authority coverage through the Awqaf city rule, still no publisher of its own |
| O1l-50 westafrica2 (`o1l-city/westafrica2/`) | 7,930 dated rows. Togo: Lome's FIRST REAL TABLE (Al-I'tisam, 17.9/17.1 Shafi, 2,102/2,190 within-1, provisional) and two traps (Zossime a fixed board, MATW computed). Benin: SAVALOU 365 (14.9/15.1, 2,016/2,190 within-1, provisional), the country's first table outside Cotonou. Cote d'Ivoire: KORHOGO 365 (17.9/17.1, provisional), the country's first athan-class table. Sierra Leone: Freetown Masjid Al Ansaar 365 (17.65/16.9, 2,149/2,190). Gambia: Old Yundum 365 and Koina 365 (both 17.9/17.1, provisional), the Greater Banjul area's first mosque athan table. Ghana: a national mosque-directory surface (GhanaMasjid, an AlAdhan method-3 wrapper, platform, never mosque-entered) | Togo row: candidate to provisional (new city). Benin row: FALLBACK gains a dated table, which the register does not carry. Cote d'Ivoire: a second surface. Sierra Leone and Gambia: second surfaces. Ghana: a platform layer. Four new traps for the platform register |
| O1l-51 germany-districts (`o1l-city/germany-districts/`) | The district axis is a 1,241-entry gazetteer (16 states, zero duplicates), reproduced exactly. Berlin is ONE id, not 12, Hamburg is seven Hamburg-named points, one filed under Schleswig-Holstein. 101 district tables banked, 36,865 district-days, full 2026, zero conflicting dates across three tables per page, 2027 absent. The layer is a COORDINATE REFINEMENT at every district: sunrise -6.5 floor at 91 of 91, dhuhr +5.5 floor at 91 of 91, the same values the 24 cities gave. The asr margin drifts with latitude (+3 at 49 districts, +3.5 at 35, +6.5 at five northern ones) | Germany row gains a district layer, no grade change, a latitude-dependent asr temkin joins the rule set |

### 8.2 No report on disk at this build

O1l-44 us-unproven, O1l-49 eastasia2, O1l-52 second-witnesses, O1l-53 fallback2, O1l-54 nz-finish,
O1l-56 athanpro platform walk, O1l-57 last capital gaps, O1l-58 canada2, O1l-59 masjidi.app pool,
O1l-B1 backward harvest. The monitor lists each as live. Nothing from them is in this document, and
the close should re-cut the register once they land: the counts in section 1 are a floor for the
round, not its final total.

---

## 9. The ten biggest movements

1. **Eighteen countries enter the record.** Malta, Congo-Brazzaville, Equatorial Guinea, Cuba,
   Puerto Rico, Haiti, Barbados, Belize, El Salvador, Dominican Republic, Panama, Costa Rica,
   Jamaica, Ecuador, Bolivia, Andorra, Liechtenstein, San Marino. 174 rows become 192.
2. **Kobe's record clause is overturned.** "Kobe Mosque has NO official website" becomes: it has
   one, it warns against the fakes, and it publishes 366 dated rows. Japan lifts to provisional.
3. **Malta was never a verdict.** The v2.5 "no fit" was an absence. Three surfaces, 1,460 rows, and
   one of them fits two years.
4. **Morocco's real change is not a margin.** The -1.42 asr shift does not reproduce. The rebuild's
   change is a per-city horizon term (5.85 to 17.54 min, corr 0.87 with elevation), worth 99.94 pc
   over 190 cities.
5. **Nigeria's Egyptian line is a platform default.** Uniform across four regions, identical
   January 2026 against January 2027. Every mosque-configured table is MWL 18/17 Shafi exact.
6. **Oman closes undecided.** 28,105 city-days, seven cities, and the two parameterizations are
   separated only by rounding mode and 0.08 deg of reference uncertainty.
7. **The Dubai preset contradicts Dubai.** adhan 4.4.6 bakes asr +3 and runs 2.77 min late against
   the authority's own 1,794 rows, 0.0 pc exact. The 60 area anchors are recovered.
8. **Russia's margins were computed in the wrong place.** CDUM's quoted set sat 0.163 deg west of
   the published position, at the true point the recipe scores 95.5 pc. DUM RB's regime change is
   dated 2025, and Ufa's fixed-interval almanac is A.
9. **The fitter drops a year silently.** `const isha` then `+= 1440`, present in two copies. Every
   multi-year score from that fitter is suspect until re-run.
10. **The Americas were never unplaceable.** 166 of 167 surfaces were an unread field, not a
    degeneracy: UNKNOWN falls to 0. Fourteen ledger records carry the wrong country.

---

## 10. Provenance

Every figure above is traceable to the block named in its row and to that block's workspace under
`$HOME/athan-gitree/census/o1l-city/`. The register (`corrections/CORRECTIONS-ROUND.md`, O1l-55) is
the index and the CONSOLIDATION block is the measurement. Where they differ, the block governs
(section 2). Nothing here was measured by this agent, and nothing in the repository was edited.

Built 2026-11-11 by O1l-60. Read-only. Proposes, the close adopts.
