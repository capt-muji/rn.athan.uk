# CORRECTIONS REGISTER - O1l city-level round (2026-11-11)

Built by O1l-55 at 06:34Z from the 52 CONSOLIDATION blocks present at that cut-off (O1l-45,
O1l-47 and O1l-43 landed while this file was being written and are included). Record of
reference: `world-table-v3.md` and `policy-layer.v2.5.json` (repo
`ai/features/global-prayer-times/data/census/`, read-only). Four tables plus a flagged list, one
line per item, no adjudication: each line records what a block measured and what the record said
before it.
Workspace paths are under `$HOME/athan-gitree/census/o1l-city/`.

Counts: A 77 corrections, B 34 new rows, C 56 grade/span movements, D 32 rule-forms, plus 17
flagged items. Cut-off note: blocks for O1l-44, 46, 49, 50, 51, 52, 53 and 54 had not returned
when this register closed; their workspaces were in flight and are not represented.

## A. CORRECTIONS (a record reading overturned or a record defect re-measured)

| # | Item | Record reading (v3 / v2.5) | Round measurement | Block (workspace) |
|---|---|---|---|---|
| A1 | Japan, Kobe | v3 Japan: "Kobe Mosque has NO official website (kobemosque.info is a content farm)" | kobemosque.com is the OFFICIAL site (its own "beware of the fake websites"); 366 dated rows plus 2025 PDFs identical to the minute; 18/17 Shafi +1, all-six 322/365; its Maghrib column is the iqama | O1l-24 japan-korea (o1l-city/o1l-24/) |
| A2 | Malta | v2.5 carries no Malta object; the "no fit" was an ABSENCE | three surfaces, 1,460 rows: Birkirkara 18 deg behind a fixed 05:13 floor (213 days), Bilal 18/17, Paola (masjidway) 17.9/16.9 fitting 2025 AND 2026; must enter the closing wtdiff | O1l-36 microstates (o1l-city/microstates/) |
| A3 | Cameroon anchor | v3 Cameroon row = Ar-Rahma "Douala", all six columns sun-tracking | that page computes at 7.3668/12.3533 (Adamawa), not Douala; the record's Cameroon anchor is mislabelled | O1l-33 central-africa (o1l-city/O1l-33/) |
| A4 | Morocco, asr | v3 asr +1; O1k-M1 held a -1.42 asr shift in the rebuild | the -1.42 does NOT reproduce: asr is 99.8pc within-1 at +0.33; sea-level margins sunrise -3.13 / maghrib +3.80 are the record's -3/+4 | O1l-39 morocco-cities (o1l-city/morocco-cities/) |
| A5 | Morocco, rebuild | v3: "margins shifted HALF A MINUTE" | the rebuild's real change is the per-city HORIZON TERM (bracket 5.85-17.54 min, corr 0.87 with elevation, monotone DEM bands 6.56-13.96); national margins plus term = 99.94pc, 173/190 perfect | O1l-39 morocco-cities |
| A6 | Nigeria, Egyptian line | v3 D6 reversal: Egyptian 19.5/17.5 is masjidway's platform default | re-measured publisher-shaped, not geography-shaped: uniform north (Kaduna 6 mosques, 552 rows), middle belt (Abuja), south (Benin City 2), southeast (Enugu 1); every mosque-configured table is MWL 18/17 Shafi exact | O1l-7 nigeria-states (o1l-city/nigeria-states/) |
| A7 | Nigeria, Ile-Ife | not on record | MWL 18/17 exact IN UTC, whole table 60 min early (off-zone bug), the TZ-distrust trap caught | O1l-7 nigeria-states |
| A8 | Oman, parameterization | v3: 18/18, ceil, +5 on dhuhr/asr/maghrib | six new cities prefer NEAREST over ceil; the deep2 amendment (17.8/18.15 +5 ceil) drops to 87-99pc on them; conflict flagged for arbitration | O1l-8 mideast-cities (o1l-city/mideast-cities/) |
| A9 | Oman, ridge | the two parameterizations were in dispute | RIDGE DEGENERATE, BOTH CARRY: 28,105 city-days over 2021-2031, seven cities; the exact-rate split is the ROUNDING MODE and 0.08 deg reference-point uncertainty outweighs the 0.2 deg in dispute | O1l-25 gaps-closed (o1l-city/gaps-closed/) |
| A10 | Russia, Moscow margins | CDUM margins as previously quoted (C23's set) | those were computed 0.163 deg WEST of the published position; at the true position the same 18/17 recipe scores 95.5pc within-1 with margins near 2 min | O1l-6r russia-boards (o1l-city/russia-boards/) |
| A11 | Russia, DUM RB fit | a free-angle fit carried in the record | the free-angle fit was DEGENERATE (search bounds returned); replaced by level identification | O1l-6r russia-boards |
| A12 | Russia, DUM RB span | 16/15 recipe, multi-year | holds for 2026 only (fajr median 16.05, within-1 98.9pc); 2025's fajr fits NO single angle (18.6pc); regime change dated 2025 | O1l-6r russia-boards |
| A13 | Russia, sunrise defect | 2026 sunrise defect stated at 22 min | reaches -68 min | O1l-6r russia-boards |
| A14 | Russia, Sibay | listed at 52.72N | served a schedule computed for 55.81N | O1l-6r russia-boards |
| A15 | Finland, Oulu | v3 Finland candidate; Oulu treated as its own surface | Oulu's 365 rows are TURKU'S TABLE relabelled; its stated IRN 16/15 + 1/3 night is provenance only | O1l-31 nordics2-cities (o1l-city/O1l-31/) |
| A16 | Cyprus north, constant | v3 CY-KKTC: per-edition constant warning, 2025 mean -2.42 | 2025 edition fails as-is and passes on one additive constant; with -2.5 the 2026 recipe plus correction gives 552/552 within-1; the regime split is dated 2025 | O1l-A2 span-ledger (o1l-city/span-ledger/) |
| A17 | Uzbekistan, margins | v3: display margins +5 (Ishroq +20, Shom +4) | the "+5 margins" is REFUTED: 15.5/15.5 Hanafi, six columns 30/30 exact, maghrib sunset +4 | O1l-26 centralasia2-cities (o1l-city/o1l-26r/) |
| A18 | Montenegro, declared pair | v3: "the declared 19.5/17.5 is nearly exact" | that was a WINTER/SUMMER CANCELLATION ARTIFACT: fajr seasonal swing about 11.5 min (winter +4.05, summer -7.43) | O1l-A1 algo-table-matrix (o1l-city/algo-table/) |
| A19 | Montenegro, PDF family | six PDFs read as six tables | one table plus {-4,-2,0,+1,+3,+5} min, cell-exact; the stated 19.5/17.5 scores 35.3pc | O1l-16r balkan-cities (o1l-city/balkan-cities/) |
| A20 | Bosnia, elevation ladder | a 611m rung in the temkin ladder | REFUTED: temkin -5.5 for 57/61 cities from 82m to 1,050m, corr(residual,elev) +0.21; the 611m rung reproduces Sarajevo only because Sarajevo is the anchor | O1l-16r balkan-cities |
| A21 | Bosnia, generation | not on record as one generation | ONE Sarajevo-anchored generation redistributed by 4 min/degree longitude (mean error 0.31); seven tables exact constant shifts; one twilight scalar k per city | O1l-16r balkan-cities |
| A22 | China, 18/17 label | v3 China FALLBACK; the 18/17 form-label line | 18/17 REFUTED at all 29 provincial capitals (fajr +13.8 to +21.5); 15/15 Hanafi confirmed (4,176 city-days, rms 0.29-0.47); the grid is measurably a 2004 computation | O1l-4 china-capitals (o1l-city/china-capitals/) |
| A23 | China, Urumqi | islamichina.com served as a national platform surface | its "Urumqi" computes at 117.5E (about 119 min early) | O1l-4 china-capitals |
| A24 | Pakistan, federal convention | the federal chart's dhuhr 13:00/13:15 clock conventions | do NOT describe the provincial layer: 6/366 hits in Multan, 0/366 in Karachi; cities run the Karachi-method family with their own margins | O1l-12 pakistan-cities (o1l-city/pakistan-cities/) |
| A25 | Pakistan, Quetta asr | asr assumed to reproduce | asr DOES NOT REPRODUCE: monthly mean residual -3.9 (Jan) to +5.5 (May), a smooth annual swing with zero crossings March and September | O1l-21r pakistan-charts (o1l-city/o1l-21r/) |
| A26 | Malaysia, census margins | census +2 ihtiyati margins | 0 exact on fajr/asar/isyak across Perak's seven zones; Recipe B (18/18, zohor +1.5 only) carries all zones within 1; refuted again in Negeri Sembilan | O1l-1 malaysia-states (o1l-city/malaysia-states/) |
| A27 | Malaysia, Bukit Larut | not on record | zon7 carries an ELEVATION term (terbit -5.9, maghrib +5.6, month-invariant); the Gafsa class reaches Malaysia | O1l-1 malaysia-states |
| A28 | Tunisia, July angle | 20 Kairouan/Sidi Bouzid tables print a July angle near 17.3 (flagged) | it is a DATED SPLIT (2025-12-15 to 2026-01-15) where those delegations DROP the DEM horizon dip at unchanged 18.1/18.1; 100/100 July rows within-1; rule form TN-INM-FLAT2026 | O1l-18r tunisia-cities, O1l-25 gaps-closed |
| A29 | Tunisia, elevation | elevation "IS the term" (unquantified) | per-site horizon dip = 0.0316*sqrt(metres) - 0.0999 degrees, R2 0.980 (98.3pc of the geometric slope); latitude R2 0.026 against elevation 0.921; the dip lifts all-five-within-1 from 58.3pc to 92.7pc | O1l-18r tunisia-cities (o1l-city/tunisia-cities/) |
| A30 | Egypt, elevation | not on record; Tunisia's ladder was newly found and recurrence untested | NO elevation term: St Catherine at about 1,500m is exact; the ladder does not recur | O1l-14 egypt-82 (o1l-city/egypt-82/) |
| A31 | Egypt, deviating cities | 13 cities failed the fit | all 13 pass 100pc at their table's OWN implied point (17-61 km coordinate disagreement, never recipe error) | O1l-14 egypt-82 |
| A32 | Egypt, rival publisher | not on record | Dar al-Ifta REUBLISHES ESA verbatim (150/180 Cairo values identical, the 30 diffs a swapped dhuhr meridiem); al-Azhar and NRIAG publish nothing | O1l-14 egypt-82 |
| A33 | Saudi, city axis | the endpoint has a city/cityId axis | the endpoint is COORDINATE-ONLY: city, cityId, id and name all return one byte-identical default payload; the 43 points are the publisher's engine at coordinates | O1l-40 saudi-cities (o1l-city/saudi-cities/) |
| A34 | UAE, Dubai asr | adhan 4.4.6's Dubai preset is taken as the Dubai recipe | the preset BAKES asr +3 and runs 2.77 MIN LATE against Dubai's own rows (0.0pc exact on 1,794 rows); asr margin 0 confirmed; the package contradicts its namesake authority | O1l-41 uae-cities (o1l-city/uae-cities/) |
| A35 | Americas, zone degeneracy | 166 of 167 surfaces unplaceable; tables reproduce at four-five longitudes | the degeneracy was an UNREAD FIELD: Masjidal masjid_info.location, mawaqit lat/lon, Masjidbox JSON-LD PostalAddress, dpt street text, radioislam city per sheet; UNKNOWN falls 166 to 0 | O1l-34 coords-americas (o1l-city/coords-americas/) |
| A36 | Coordinate ledger, country field | 1,547 records by country | 14 surfaces carry the WRONG COUNTRY (12 US files under CA, plus Guatemala and Honduras) | O1l-34 coords-americas |
| A37 | Ireland, 2027 | IFI year=2027 byte-identical, suspected frozen generation | the ?year= parameter is DISCARDED by a 301 (2026/2027/2028 all return the same 25,380 bytes); the feed is parameter-blind, 366-day leap-shaped with a phantom Feb 29 | O1l-29 ireland-wales-iom (o1l-city/o1l-29/) |
| A38 | Ireland, DST defect | unexplained offset | cause found: the PDF's footnotes say add an hour after summer time starts and subtract after it ends; the API is that table with the INSTRUCTIONS DROPPED (+57 min 1 April, -59 min 1 November) | O1l-29 ireland-wales-iom |
| A39 | Fiji, dhuhr | dhuhr transit +3 | dhuhr is transit +5 to +6 NOT +3 (the +3 scores 0/365) | O1l-35 pacific2 (o1l-city/pacific2/) |
| A40 | Fiji, isha | isha treated as a fixed offset | isha is an INTERVAL table (maghrib +75 exact March to September); the Facebook November-2026 sheet is IDENTICAL to November 2024 (210 cells, zero diffs) | O1l-35 pacific2 |
| A41 | New Caledonia, isha | v3 NC-NOUMEA: "pinned 19:45 all year" REFUTED, a 19:45 floor holds 243 days | re-confirmed at exactly 243 days; dhuhr/asr are hand blocks; a new iqama layer is held | O1l-35 pacific2 |
| A42 | Tanzania, Mwanza | the platform's Mwanza row read as Tanzanian | its "Mwanza" is MALAWI's | O1l-20r africa-cities (o1l-city/o1l-20r/) |
| A43 | Thailand, margins | four null margins in the record | measured at ZERO on all six columns (19.8/18.1 Shafi); 166,433/166,434 values within 1 across 77 provinces in 2026 | O1l-2 thailand-provinces (o1l-city/thailand-provinces/) |
| A44 | Thailand, defects | not on record | Nan's printed longitude typo (the implied point reproduces all 2,190 rows); Ranong's normal block stops 30 Dec | O1l-2 thailand-provinces |
| A45 | Algeria, recipe | one frozen recipe per wilaya | SUMMER MONTHS MOVE ONE PARAMETER: isha 16.10/+5 leaves a -1.9 min January residual; 17.00/0 ceil is the same printed curve and holds 2113/2113 plus 1074/1074 on the 1448 holdout | O1l-17r algeria-1447 (o1l-city/algeria-1447/) |
| A46 | Algeria, Constantine imsak | an imsak column | the "imsak" column is SUNRISE under an imsak header | O1l-17r algeria-1447 |
| A47 | Kuwait, margins | dhuhr and asr margins null | 18/17.5 at 99.8pc, margins no longer null | O1l-8 mideast-cities |
| A48 | Jordan, margins | a national margin set | REGIONAL NOT NATIONAL: Irbid and Aqaba carry their own sets (100pc each; Aqaba 66.7pc on Amman's); Zarqa sits inside Amman's group | O1l-8 mideast-cities |
| A49 | Iraq, city axis | a city axis assumed | no city axis: Basra sits 13.7 min out at Baghdad's recipe; the national row is Baghdad | O1l-8 mideast-cities |
| A50 | US, Anchorage | Anchorage held as a US surface | alaskamasjid.org computes MAKKAH client-side (21.3891/39.8579, TZ+3, MWL); no Anchorage data exists | O1l-5 us-states (o1l-city/us-states/) |
| A51 | US, platform defects | not on record | New Orleans mawaqit month-scale UTC-offset blocks; Las Vegas Tawheed hand-edited worst +79; Gwinnett mid-year +-15 | O1l-5 us-states |
| A52 | US, dated defects | not on record | Omaha a DATED 2026 regime change (15/15 to 18.47 plus a fixed isha interval); Mobile computes Houston coordinates; two dpt installs zeroed years; Little Rock serving 2023 | O1l-37 us-unresolved (o1l-city/us-unresolved/) |
| A53 | US, fitter bug | not on record | `const isha` then `+= 1440` silently drops any year containing one after-midnight isha; PRESENT IN THE US-STATES COPY TOO | O1l-37 us-unresolved |
| A54 | Maldives, served years | 2027/2031/2036 read as forward years | they do not differ at all (0/365 month-day rows change; 1990 and 2050 print identical values); no span exists, the frozen generation is proven by direct test | O1l-B1r wayback-back (o1l-city/wayback-back/) |
| A55 | Kazakhstan, publisher | a publisher change suspected across the span | the served prayTimes.js reproduces deep1's 2026 table 365/365; NO publisher change; 49-year span at 100pc within-1 | O1l-B1r wayback-back |
| A56 | Chile, regime | one span assumed | regime boundary DATED 2016-2025: 2016 carries no clock offset (sunrise -0.4), the 2025 workbook +6 on every column | O1l-B1r wayback-back |
| A57 | Trinidad, tz label | profile tz trusted | the tz LIES America/New_York (Chaguanas-class; the value flips before the label); Chaguanas' -1h defect is STILL LIVE after the slug moved | O1l-9 latam-cities (o1l-city/latam-cities/) |
| A58 | UK, platform defects | not on record | phantom 29 Feb, unreliable tz labels, fixed-BST prints, slug fallback resolving US mosques | O1l-B2 uk-seconds (o1l-city/uk-seconds/) |
| A59 | mawaqit, stored calendar | one calendar per mosque | the STORED calendar is a DIFFERENT GENERATION from the live page at Plymouth and Lincoln (new defect class) | O1l-28 uk-seconds2 (o1l-city/o1l-28/) |
| A60 | Indonesia, clock | SIHAT renders each city on its own zone | SIHAT renders Mataram and Kupang on WIB, a civil hour early all year; Kemenag's cities?province_id filter is ignored | O1l-3 indonesia-cities (o1l-city/indonesia-cities/) |
| A61 | Indonesia, horizon | elevation handling unmeasured | BOTH publishers apply a horizon dip of 1.76*sqrt(h) arcmin on sunrise/maghrib from DIFFERENT elevation fields (Bandung and Jayawijaya -6/+7 against flat -3/+3) | O1l-3 indonesia-cities |
| A62 | Germany, isha | DITIB 18/17 prose | 18/16 plus domestic temkin reproduces at six cities (isha 16 exacts 32/27/32 of 182 winter days, zero at 15.5/16.5/17) | O1l-10 watches-eu (o1l-city/watches-eu/) |
| A63 | Turkey, district layer | districts suspected as a different recipe (the 9542-Kartal trap) | the layer is a COORDINATE REFINEMENT: Kartal 0.84 min off Istanbul (worst 2), residual rises with latitude and correlates 0.984 with longitude | O1l-15r turkey-cities (o1l-city/o1l-15r/), O1l-23 turkey-districts |
| A64 | Turkey, 2027 | year-2 path assumed open | NOT served publicly: ilce page last row 31 Aralik 2026, ?yil ignored, awqatsalah 401 credential-gated | O1l-15r turkey-cities |
| A65 | Turkey, resolver | GetDestinationUrl trusted | returns the PROVINCE id for Cubuk, Seferihisar and Arnavutkoy (all three have own tables); the district select is the authoritative enumeration | O1l-23 turkey-districts (o1l-city/o1l-23/) |
| A66 | New Zealand, span | community span unproven | FIANZ pairs IDENTICAL in Ramadan 1427 (2006) and 1447 (2026), one engine, ZERO DRIFT; dated regime change: double-shadow asr +1h15 (2006) against +40 min (2026) | O1l-19r australia-nz (o1l-city/o1l-19r/) |
| A67 | Portugal, Porto | monthly sheet read as the same rule as the annual | the monthly is a CONVENTION SHEET: asr +39 to +54 against its own annual (flagged, not adjudicated) | O1l-22 europe-second (o1l-city/o1l-22/) |
| A68 | Macedonia, fajr | two surfaces read as agreeing | bfi.mk and vaktija.eu DISAGREE +45 min on fajr (flagged) | O1l-16r balkan-cities |
| A69 | India, isha line | isha 17 and 18 treated as one family | isha 17 sits 4-5 min EARLIER than 18 across every city and season while the other four columns are identical (flagged for the fit index) | O1l-11r india-cities (o1l-city/india-cities/) |
| A70 | Bangladesh, band artifact | the IFB band artifact read as a national object | NOT platform-wide (Dhaka shows none); Bolura's table implies a reference point 0.5 deg from its own mosque; DISTRICT/ZONE TABLE, SUPPORTED BUT UNPROVEN | O1l-13r bangladesh-cities (o1l-city/o1l-13r/) |
| A71 | Brunei, provenance | weak-provenance statement | 20/18 CONFIRMED (MORA 2026: 95.1/86.8pc exact, 99.2pc within-1, dhuhr transit+1); weak provenance carried | O1l-25 gaps-closed |
| A72 | Austria, drift | empty comparison | DRIFT on fajr only (IGGOe mean 12.8 min earlier, worst 29 in August), isha SYNC (245/245 within-1); form AT-IGGOe = 18/16 + temkin + Istanbul takdir | O1l-25 gaps-closed |
| A73 | Switzerland, IZRS | empty comparison | UNDECIDABLE: IZRS behind a Bronze login, Wayback a 10KB shell, no dated IZRS rows exist | O1l-25 gaps-closed |
| A74 | Germany, 2027 | 2027 absent everywhere, the year-2 lift blocked | PRESENT at IGMG's WP REST mirror (26 tables 2026-10 to 2027-11, 11,076 rows), BYTE-IDENTICAL to the portal on 2,116/2,116 overlapping city-days; proven-to-2027-11, but a mirror cannot lift provisional to A | O1l-42 germany-cities (o1l-city/germany-cities/) |
| A75 | UAE, anchors | the 60 area coordinate anchors absent (named defect) | recovered with emirate ids, closing the object's named defect | O1l-41 uae-cities |
| A76 | masjidi.app, solar gate | the platform pool treated as one engine family | ALL 37 masjidi.app tables FAIL the solar gate at 6.2-8.1 min RMS (an engine mismatch, new lead); New Peckham London carries a jama'ah schedule in the athan slot (rms 19.9); Halton Burlington a 63-day DST block | O1l-43 masjidal-global |
| A77 | Baghdad, second surface | the Diwan's zero margins are the only Baghdad reading | mawaqit Jami al-Hasanayn 366 rows (18.08/16.93) drifts +4.6 dhuhr / +2.8 asr / +2.5 maghrib against the Diwan, and its calendar prints an impossible 2026-02-29 | O1l-47 megacities |

## B. NEW ROWS (country new to the record, or a country's first dated row)

| # | Country / row | Kind | Surface and rows | Tier | Fit verdict | Block |
|---|---|---|---|---|---|---|
| B1 | Congo-Brazzaville | new country | Brazzaville 365 rows (fajr 12.3 / isha 18.19; dhuhr prints 60 min after its own solar noon while sunrise/sunset are exact) | community | candidate; internal one-hour inconsistency recorded | O1l-33 central-africa |
| B2 | Equatorial Guinea | new country | Malabo 365 rows MWL exact; Bata negative | community | fitted exact | O1l-33 central-africa |
| B3 | Cuba | new country | Havana, mawaqit Abdallah, 365 rows (15-21 fajr / 15+12 isha / maghrib +3), 353/365 exact; the country's only mosque | community | fitted | O1l-30 caribbean-central |
| B4 | Puerto Rico | new country | San Juan and Ponce, 365 rows each, plain MWL 18/17 | community | fitted | O1l-30 caribbean-central |
| B5 | Haiti | new country | Port-au-Prince 365 rows (fajr 18+10, dhuhr transit+15, asr Shafi+5 floored 15:30, which binds 101 days) | community | fitted | O1l-30 caribbean-central |
| B6 | Barbados | new country | Bridgetown, masjidbox, 7 rows | community | candidate | O1l-30 caribbean-central |
| B7 | Belize | new country | Belize City 365 rows, ISNA 15/15 | community | fitted | O1l-30 caribbean-central |
| B8 | El Salvador | new country | San Salvador, two tables, 730 rows, MWL 18/17; the two agree within 1 all year | community | fitted | O1l-30 caribbean-central |
| B9 | Dominican Republic | new country | Santo Domingo, masjidbox, 7 rows | community | candidate | O1l-30 caribbean-central |
| B10 | Panama | new country | Panama City 365 rows, 18/18.5, maghrib sunset+6 | community | fitted | O1l-30 caribbean-central |
| B11 | Costa Rica | new country | San Jose 365 rows, MWL 18/17, maghrib +7 | community | fitted | O1l-30 caribbean-central |
| B12 | Tonga | existing candidate, now with times | Masjid Al-Taiyab Niutoua on mawaqit, 365 rows, MWL 18/17, five columns 365/365 within-1, floor rounding (asr +-2 platform artefact) | community | provisional | O1l-35 pacific2 |
| B13 | Jamaica | country-first dated row | Jamaica Islamic Centre, Spanish Town, today-row, MWL 18/17 within 1; both decoys avoided | community | candidate | O1l-9 latam-cities |
| B14 | Ecuador | country-first | Quito, mawaqit, 365 rows, MWL 18/17 anchored | community | provisional | O1l-9 latam-cities |
| B15 | Bolivia | country-first | Santa Cruz, mawaqit, 365 rows; fajr/isha 18/17 but the sun columns unreproducible at any South America coordinate | community | candidate | O1l-9 latam-cities |
| B16 | Malta | absent row, now three surfaces | Birkirkara, Bilal and Paola (masjidway), 1,460 rows; Paola 17.9/16.9 fits 2025 and 2026 | community / platform | candidate; must enter the closing wtdiff | O1l-36 microstates |
| B17 | Andorra | new country | Centre Cultural Islamic, mawaqit, 365 rows (fajr 18.1 -1, isha 16.9 -1, 365/365 within-1); the O1k negative stands for a mosque-printed table | community | candidate | O1l-36 microstates |
| B18 | Liechtenstein | new country | IGMG Vaduz 396 rows plus IGFL's own line identical to the minute (18/17 + temkin; the summer block leaves the angles, not a fixed fraction, so cannot tell) | community | candidate | O1l-36 microstates |
| B19 | San Marino | new country | Associazione Badr 365 rows (14.9/15.1 zero margins) | community | candidate | O1l-36 microstates |
| B20 | Central African Republic | lifted from FALLBACK | Bangui, mawaqit, 365 rows, ISNA 15/15 zero margins, 365/365 within-1 (dhuhr a fixed 12:00 jama'ah clock) | community | provisional | O1l-48 fallback-sweep |
| B21 | Western Sahara | lifted from FALLBACK | Laayoune and Dakhla, 60 rows, 19/17 with margins 0/-3/+5/+1/+4/0, 30/30 within-1, printed on GMT (the decree reaches the southern provinces) | community | candidate | O1l-48 fallback-sweep |
| B22 | Madagascar | lifted from FALLBACK | 3 mosques, 1,095 rows | community | candidate | O1l-48 fallback-sweep |
| B23 | Guinea-Bissau | lifted from FALLBACK | Bissau 365 rows | community | candidate | O1l-48 fallback-sweep |
| B24 | Cote d'Ivoire | new surface set beside the held proxy | 7 Abidjan mawaqit mosques, 2,555 rows, hand-set boards with fixed dhuhr/asr clocks | community | candidate | O1l-48 fallback-sweep |
| B25 | Uganda | country-first | Entebbe 365 rows, clean 15/15; Kampala Mulago fails the gate, Kiyindi 404 | community | fitted | O1l-20r africa-cities |
| B26 | Tanzania | country-first multi-year | Arusha, salaahtimes API, 1,095 rows 2025-27 (fajr 18 / isha 18, dhuhr transit+5, maghrib sunset+3, Shafi), 365/365 all six within 1 in every year, amplitude 7 min | platform | A eligible | O1l-20r africa-cities |
| B27 | Nepal | surface only, no dated series | Kathmandu khidmat.org.np (AlAdhan method-4 wrapper, computed, nothing dated); later a 30-row table at 99.3pc within-1 (capitals2), the held PDF is a date calendar with NO prayer column | community | FALLBACK stands for a dated authority series | O1l-27 southasia-fringe, O1l-45 capitals2 |
| B28 | China | country row moves from FALLBACK to measured | 29 provincial capitals 4,176 city-days at 15/15 Hanafi; islamichina.com 28 capitals x 2026 = 10,220 rows at 18/17 Shafi; Guangzhou 30 dated Ramadan rows (cheen.cn) | authority grid + platform | measured; no mainland mosque or association publishes a timetable | O1l-4 china-capitals |
| B29 | Russia, Ufa | new second line | twelve-sheet Hijri-1448 almanac 355 rows (2026-06-16 to 2027-06-05) plus three 1446 sheets (87 rows), fixed-interval recipe, cell-exact 90.8pc | authority | A | O1l-6r russia-boards |
| B30 | India | row moves from FALLBACK to a measured mosaic | 13,140 dated rows, 20 tenants, 8 cities fitted A-grade community; authority tier unchanged (no board publishes a daily table) | community | A-grade community; FALLBACK stands at authority tier | O1l-11r india-cities |
| B31 | Capitals | capital matrix closed | 142 to 194 covered of 202 (195/7 accepting Delhi for New Delhi); 30-row tables at each new capital, athanpro.com a frozen September-2026 build (platform, provisional) | mixed | fitted per capital; three publish a snapped dhuhr, two a point contradicting the city | O1l-38 capitals, O1l-45 capitals2 |
| B32 | Masjidi.app tenants | new platform surface set | 495 tenants in 33 countries (Lebanon 244, Saudi 49, Algeria 31, Syria 24, Indonesia 23, Oman 16, Jordan 15, Morocco 13, tail) | platform | all 37 sampled tables fail the solar gate; the pool is enumerated, not fitted | O1l-43 masjidal-global |
| B33 | Megacity second witnesses | new second sources for four megacities | Istanbul turktakvim 365 rows (fajr 17.93 clean 365/365, isha seasonal 217/365, temkin about double Diyanet); Karachi masjidway mosque 11160 (18/18 Hanafi zero margins, 30/30); Jakarta jadwalsholat Jakarta Pusat 365 rows (19.51/18.50, +2 on dhuhr/asr/maghrib, imsak exactly fajr-10, NOT a Kemenag mirror); Baghdad mawaqit 366 rows | community | second witness held for four megacities | O1l-47 megacities |
| B34 | athanpro.com | new capital-lever surface | one FROZEN September-2026 build, platform tier, 30-row capital tables; three recorded defects (wrong offset labels, a Today block contradicting its own month table, four broken capital pages) | platform | provisional; the 49 small states were covered at 30 rows through it | O1l-45 capitals2 |

## C. GRADE AND SPAN MOVEMENTS

| # | Country / object | Movement | Basis | Block |
|---|---|---|---|---|
| C1 | Thailand | provisional to A-CANDIDATE | 77/77 CICOT provinces, 56,286 rows, two year-blocks, one recipe (19.8/18.1 Shafi, zero margins), parameters frozen across both; the leap block cannot separate 2024/2028 so no year is asserted | O1l-2 thailand-provinces |
| C2 | India | FALLBACK to community MOSAIC, 8 cities A-grade | 13,140 dated rows, 20 tenants; Hyderabad, Mumbai, Bengaluru, Kolkata, Srinagar, Ramban, Moradabad, Baharampur; authority tier unchanged | O1l-11r india-cities |
| C3 | China | FALLBACK to measured | 29 capitals at 15/15 Hanafi (4,176 city-days) plus a 10,220-row platform surface; no mainland authority publishes a timetable | O1l-4 china-capitals |
| C4 | Mexico | FALLBACK to A | Guadalajara masjidbox walk 385 rows 2025-10 to 2026-11, MWL 18/17, within-1 worst 1, two years; Monterrey a second new surface at 15/15 | O1l-9 latam-cities |
| C5 | Brazil | provisional to A on two years | 25 IIB cities, 3,000 rows, MWL 18/17 zero margins, 18,000 cells 99.7pc within-1, one recipe across 2025 and 2026 | O1l-9 latam-cities |
| C6 | Colombia | candidate to A | Cartagena masjidbox 385 rows, MWL 18/17 within-1 | O1l-9 latam-cities |
| C7 | Peru | candidate to provisional | Lima suite run and passed, fresh capture byte-identical, MWL 18/17 + maghrib +3, 365/365 | O1l-9 latam-cities |
| C8 | Tanzania | FALLBACK to A ELIGIBLE | Arusha 1,095 rows over 2025-27, one recipe, 365/365 all six within 1 in every year | O1l-20r africa-cities |
| C9 | Uganda | FALLBACK to country-first fitted | Entebbe 365 rows clean 15/15 | O1l-20r africa-cities |
| C10 | Central African Republic | FALLBACK to provisional | Bangui 365 rows, ISNA 15/15, 365/365 within-1 | O1l-48 fallback-sweep |
| C11 | Western Sahara | FALLBACK to candidate | Laayoune and Dakhla 60 rows, 30/30 within-1 | O1l-48 fallback-sweep |
| C12 | Madagascar | FALLBACK to candidate | 3 mosques, 1,095 rows | O1l-48 fallback-sweep |
| C13 | Guinea-Bissau | FALLBACK to candidate | Bissau 365 rows | O1l-48 fallback-sweep |
| C14 | Japan | candidate to provisional | Kobe 366 dated rows plus 2025 PDFs identical to the minute, 18/17 Shafi +1, all-six 322/365 | O1l-24 japan-korea |
| C15 | Korea | candidate, three new city-years | Daegu, Seoul Masjid Noor and Yangju Gatbawi, 365/365 each at 18/18 or 18/17 Hanafi | O1l-24 japan-korea |
| C16 | Tonga | candidate to provisional | 365 rows fitted, five columns 365/365 within-1 | O1l-35 pacific2 |
| C17 | Malta | absent to CANDIDATE, wtdiff entry required | three surfaces, 1,460 rows, one of them fitting two years | O1l-36 microstates |
| C18 | Andorra, Liechtenstein, San Marino | new to candidate | 365, 396 and 365 rows respectively | O1l-36 microstates |
| C19 | Algeria | candidate to fitted multi-year | 1447 complete for Alger/Adrar/Djelfa (884 days) plus a 1448 holdout, frozen recipe per wilaya (97.4 / 100 / 98.6pc within-1) | O1l-17r algeria-1447 |
| C20 | Kazakhstan | A, span widened | 49-year span at 100pc (8 Astana years, 2,921 rows) plus 7 new cities at 1,095 rows each; the 48N line settled by measurement | O1l-B1r wayback-back, O1l-26 centralasia2-cities |
| C21 | Oman | A, span widened | 2021-2031, seven cities, 28,105 city-days, 100pc within-1 on 18/18 nearest | O1l-25 gaps-closed |
| C22 | Saudi Arabia | A, span widened | 43 governorate points, 30,487 city-days, 182,922 cells, exact 81.9-87.7pc, century holds at 1318H/1400H/1500H | O1l-40 saudi-cities |
| C23 | United Arab Emirates | A, span widened | 7 emirates, 30,960 area-days, 2026 full plus 2027 to 05-31, within-1 89.7-100pc | O1l-41 uae-cities |
| C24 | Turkey | A, span widened | 81 provinces 29,565 rows plus 144 district tables 55,480 rows; one recipe across 177,390 cells | O1l-15r turkey-cities, O1l-23 turkey-districts |
| C25 | Morocco | A, span widened | 190 cities x 2 months, 69,540 cells; national on four columns, city-varying on two | O1l-39 morocco-cities |
| C26 | Egypt | A, span widened | 78 of 82 ESA cities, 28,468 rows, 28,468/28,468 day-rows within 1 (100pc) | O1l-14 egypt-82 |
| C27 | Tunisia | A, span widened | 258 of 259 delegations, 5,144 season rows plus 1,722 capital/Djerba rows, 426 year-pair rows, 321 back-harvest rows | O1l-18r tunisia-cities |
| C28 | Indonesia | candidate to both publishers fitted | Kemenag 13,870 rows and KHGT 27,740 rows (2026 plus 2027, frozen between years), within-1 100pc every city-year | O1l-3 indonesia-cities |
| C29 | Germany (EU-Diyanet scheme) | provisional, PROVEN-TO-2027-11 | IGMG mirror 11,076 rows, byte-identical on 2,116/2,116 overlaps; a mirror of one generation cannot lift to A | O1l-42 germany-cities |
| C30 | Russia (DUM RB) | provisional, 63 settlements | 34,886 rows; the 16/15 recipe holds 2026 only, so the 2025 regime change bars a lift | O1l-6r russia-boards |
| C31 | Russia (DUM RT) | A, span widened | 44 cities, 32,120 rows, zero gaps, 43 of 44 CSVs byte-identical to C23 | O1l-6r russia-boards |
| C32 | United States | candidate, 33 of 64 metros dated | 33,513 rows across 41 surfaces; 15/15 verdict 26 of 37 plain ISNA (70pc), 31 in the 15-family; 25 metros stay unproven | O1l-37 us-unresolved, O1l-5 us-states |
| C33 | Australia | candidate, complete at the gazetteer | 218 Diyanet grid points, 79,570 rows, one recipe within 2 min on all 365 days | O1l-19r australia-nz |
| C34 | New Zealand | candidate, twenty-year pair test | FIANZ pairs identical 2006 and 2026, one engine, zero drift; no lift (identical generations) | O1l-19r australia-nz |
| C35 | Fiji | provisional, recipe corrected | 12 sheets, 365 rows, fajr/sunrise/dhuhr/asr/maghrib 365/365 within-1 after the dhuhr and isha corrections | O1l-35 pacific2 |
| C36 | New Caledonia | candidate, machine-readable | 365 rows on mawaqit with a new iqama layer; between-year stability still untestable | O1l-35 pacific2 |
| C37 | Pakistan | provisional, four-city provincial family | Karachi, Multan, Peshawar, Quetta, four margin sets, one angle pair and one madhab; perpetual undated charts cap the grade | O1l-12 pakistan-cities, O1l-21r pakistan-charts |
| C38 | Bosnia and Herzegovina | provisional, 61 cities | 22,265 city-days, 71.5pc within-1, one generation (frozen-generation precedent bars a lift) | O1l-16r balkan-cities |
| C39 | Malaysia | provisional, 59 zones | Perak 7 zones 2,555 rows, Penang 354 rows and Melaka 355 rows at A-grade class, Negeri Sembilan 730 rows | O1l-1 malaysia-states |
| C40 | Mauritius | community held | full 2026 year fitted; year-2 structurally negative (the same 365 rows re-ship per year) | O1l-A2 span-ledger |
| C41 | Cyprus (north) | provisional, constant dated | 2025 edition passes on one additive constant; two honest editions would open A | O1l-A2 span-ledger |
| C42 | Kuwait | provisional, margins now measured | capital 2026 year, 365 rows, 18/17.5 at 99.8pc | O1l-8 mideast-cities |
| C43 | Iraq | provisional, Baghdad re-derived | 18.1+1 / 16.9+1 at 100pc; no city axis | O1l-8 mideast-cities |
| C44 | Bangladesh | provisional, band artifact supported | 68 bands on one mosque table, 45pc within-1 both twilights; the quantization cap confirmed by construction | O1l-13r bangladesh-cities |
| C45 | Maldives | provisional, one recipe across 7.6 deg | five more islands, 1,080 cells, every one within 1 min of MABIMS 20/18; frozen generation bars a lift | O1l-27 southasia-fringe, O1l-B1r wayback-back |
| C46 | Brunei | candidate to fitted 20/18 | MORA 2026: 95.1/86.8pc exact, 99.2pc within-1, dhuhr transit+1 | O1l-25 gaps-closed |
| C47 | Austria | provisional, drift measured | fajr drift only (mean 12.8 min early, worst 29 in August), isha sync 245/245 | O1l-25 gaps-closed |
| C48 | Switzerland | candidate, undecidable | IZRS login-walled, no dated rows exist | O1l-25 gaps-closed |
| C49 | Ireland | candidate, new 26-city surface | 9,459 rows, horizon -1.26, dhuhr noon+2.00, winter 16.2/15.2, summer isha capped maghrib+90 for 30-43 days; one cycle | O1l-29 ireland-wales-iom |
| C50 | Finland | candidate, two city findings | Jyvaskyla 353 rows 18/17 exact (spans into Jan 2027); Turku/Tampere a measured 15/12 line; Oulu corrected | O1l-31 nordics2-cities |
| C51 | Iceland | A, nine cities | 14.2/14.0 EXACT at all nine; Isafjordur and Selfoss refuse (20 towns probed) | O1l-31 nordics2-cities |
| C52 | Norway | candidate, 10 cities | IRN 16/15 exact on angle-honest days; mawaqeet 18/15 at five; polar placeholders sized per city | O1l-31 nordics2-cities |
| C53 | Denmark | candidate, a fourth Danish line | Aarhus, Odense, Aalborg and Esbjerg exact | O1l-31 nordics2-cities |
| C54 | Jordan | F row, regional margins measured | Irbid and Aqaba carry own sets; the block does not move the row's grade | O1l-8 mideast-cities |
| C55 | United Kingdom | 49 to 75 surfaces | 26 new surfaces; Scotland 14 new dated surfaces, London 9 new borough surfaces, six one-month towns lifted to years | O1l-28 uk-seconds2, O1l-B2 uk-seconds |
| C56 | dpt / masjidal platform pool | pool enumerated, 216 tenants | US 174, Canada 21, UK 12, Australia 6, Hong Kong 1, Mauritius 1, Chile 1, a FLOOR not a census (the public directory is retired); sample 18 tenants x 3 years, 19,728 athan rows, seven at zero margins 100pc, twelve stable within 0.03 deg over 2024-2026, suite 9/18 strict | O1l-43 masjidal-global |

## D. NEW RULE-FORMS

| # | Rule form | Statement as measured | Block |
|---|---|---|---|
| D1 | TN-INM-FLAT2026 | A dated split (2025-12-15 to 2026-01-15) in which 20 Kairouan/Sidi Bouzid delegations DROP the DEM horizon dip at unchanged 18.1/18.1; 100/100 July rows within-1, 129-day 2026 replay 100pc | O1l-25 gaps-closed, O1l-18r tunisia-cities |
| D2 | DEM horizon-dip formula | per-site dip = 0.0316*sqrt(metres) - 0.0999 degrees, R2 0.980 (98.3pc of the geometric slope); flat-horizon fajr residual 0.166*sqrt(m)-0.432 min (2.4 min at 300m, 4.0 at 700m) | O1l-18r tunisia-cities |
| D3 | Elevation arcmin dip | both Indonesian publishers apply 1.76*sqrt(h) arcmin on sunrise/maghrib, from DIFFERENT elevation fields (Bandung and Jayawijaya -6/+7 against flat -3/+3) | O1l-3 indonesia-cities |
| D4 | Morocco per-city horizon term | bracket offset 5.85-17.54 min, corr 0.87 with elevation, monotone DEM bands 6.56-13.96; national margins plus term = 99.94pc, 173/190 cities perfect | O1l-39 morocco-cities |
| D5 | Algeria seasonal angle-margin swap | isha 16.10 with +5 leaves a -1.9 min January residual; 17.00 with 0 ceil is the same printed curve and holds 2113/2113 and 1074/1074 on the 1448 holdout | O1l-17r algeria-1447 |
| D6 | IRN asr school switch | the IRN asr column is SHAFI in CEST and HANAFI in CET, switching on the DST dates (a seasonal school switch) | O1l-31 nordics2-cities |
| D7 | mawaqit stored-vs-live generation | the stored calendar is a DIFFERENT GENERATION from the live page at Plymouth and Lincoln | O1l-28 uk-seconds2 |
| D8 | go2masjid forward year | the slim=365 path serves a PROVEN FORWARD YEAR to 2027-11-10 | O1l-28 uk-seconds2 |
| D9 | Fitter bug | `const isha` then `+= 1440` silently drops any year containing one after-midnight isha; present in the US-states copy too | O1l-37 us-unresolved |
| D10 | Kazakhstan 48N hard switch | set A (sunrise -3, dhuhr/asr/maghrib +3) below 48N, set B (-5/+5) at or above; the wrong set puts four columns EXACTLY 2.00 min off (0.0pc exact); Karazhal 48.001042 takes B, Ayagoz 47.966667 takes A | O1l-26 centralasia2-cities |
| D11 | Turkey district refinement | difference-space residual 0.264 min median (141/144 under 0.5); deviation against the province table median 1.76 min, max 6.76, correlating 0.984 with longitude (0.211 latitude) | O1l-23 turkey-districts |
| D12 | Russia Ufa fixed-interval recipe | fajr = sunrise-100, isha = maghrib+90, maghrib = sunset+4, dhuhr = max(13:30, noon+5), asr = Hanafi of the date plus ten days, suhur = fajr-20; cell-exact 90.8pc | O1l-6r russia-boards |
| D13 | Saudi single-formulation rule | prayers = floor(raw + 1 min), arithmetically the same minute as ceil-of-raw; a builder applying BOTH lands a minute late (23.9pc exact) | O1l-40 saudi-cities |
| D14 | Saudi Ramadan interval | isha = maghrib+120 on every Ramadan day, +90 otherwise; exactly two values across 43 cities and both years, zero violations, month-exact over 86 city-years | O1l-40 saudi-cities |
| D15 | UAE ridge-degenerate pair | 18.2/18.2 with many angle pairs fitting equally; the data does not discriminate the pair | O1l-41 uae-cities |
| D16 | Bosnia generation plus twilight scalar | one Sarajevo-anchored generation redistributed by 4 min/degree longitude, plus one scalar k per city (fajr +k, isha -k) | O1l-16r balkan-cities |
| D17 | Egypt national point-recipe | 19.5/17.5 zero margins Shafi nearest serves 22.32N (Halaib) to 31.73N (Saloum) at the user's own coordinates, 100pc within 1 | O1l-14 egypt-82 |
| D18 | Fiji isha interval | isha is maghrib +75 exact March to September, an interval table not an angle | O1l-35 pacific2 |
| D19 | New Caledonia isha ladder | a 19:45 floor for 243 days, then 7-day blocks tracking sunset+85, plus a Ramadan taraweeh override at 20:15 | O1l-35 pacific2 |
| D20 | Bangladesh IFB band artifact | 68 bands (42 of 5 days, 12 of 4, 7 of 7) with dhuhr a fixed 13:10 clock, fajr 19.25, isha 18.65, Hanafi asr; the quantization cap holds by construction | O1l-13r bangladesh-cities |
| D21 | Maldives frozen generation | the mirror's 2027/2031/2036 years are byte-identical to the base (0/365 month-day rows change); no span exists | O1l-B1r wayback-back |
| D22 | Ireland high-latitude form | horizon -1.26 both ends, dhuhr noon+2.00, winter fajr 16.2 / isha 15.2, summer isha capped maghrib+90 for 30-43 days; summer fajr UNMODELLED | O1l-29 ireland-wales-iom |
| D23 | Muhammadiyah 2026 change | the association DROPS the elevation correction in 2026 (a dated rule change, flagged) | O1l-32 indonesia2 |
| D24 | jadwalsholat line | Kemenag 20/18 plus a uniform +2 min, with Kemenag's elevation dip OMITTED; frozen 2024-2028 | O1l-32 indonesia2 |
| D25 | Pakistan chart layout traps | column 2 is fajr MINUS 5 min and column 16 is the maghrib WINDOW LENGTH, not a clock time | O1l-21r pakistan-charts |
| D26 | masjidway month rendering | /prayer/MMYYYY renders ANY month (January 2028 verified) | O1l-7 nigeria-states |
| D27 | e-Solat year parameter | HTTP 200 with the year parameter SILENTLY IGNORED (payload opens 01-Jan-2026) | O1l-1 malaysia-states |
| D28 | China 2004 grid | the national grid is measurably a 2004 computation (2026 drifts fajr +0.34 to +0.82); its form note states it | O1l-4 china-capitals |
| D29 | Jordan regional margin sets | Irbid and Aqaba carry their own margin sets; Zarqa sits inside Amman's group | O1l-8 mideast-cities |
| D30 | Oman rounding-mode split | 18/18 nearest against 17.8/18.15 ceil: the exact-rate split is the ROUNDING MODE, and 0.08 deg reference uncertainty outweighs the 0.2 deg in dispute | O1l-25 gaps-closed |
| D31 | New Zealand double-shadow asr | asr +1h15 in 2006 against +40 min in 2026, a dated regime change inside one engine | O1l-19r australia-nz |
| D32 | Saudi century rule | no regime change across 1318H-1500H: 7 Hijri years at Makkah and Medina, 6,379 rows, 183-year span, 100pc within-1 | O1l-B1r wayback-back |

## Flagged, not adjudicated

Items the blocks themselves flag, or that the record and the round leave open. Recorded, not decided.

| # | Item | State | Where |
|---|---|---|---|
| F1 | Oman parameterization | ridge degenerate: 18/18 nearest and 17.8/18.15 ceil both carry; the pair is underdetermined by 0.08 deg reference uncertainty. Arbitration closed, identification not achieved | O1l-25 gaps-closed |
| F2 | Quetta asr | does not reproduce; a smooth annual swing of about +-5 min with zero crossings in March and September; cause not named | O1l-21r pakistan-charts |
| F3 | Macedonia fajr | bfi.mk and vaktija.eu disagree by +45 min on fajr; both surfaces stay on the record | O1l-16r balkan-cities |
| F4 | Portugal, Porto | the monthly sheet's asr runs +39 to +54 against its own annual; convention versus error unresolved | O1l-22 europe-second |
| F5 | India isha line | isha 17 sits 4-5 min earlier than 18 in every city and season while the other four columns match; flagged for the fit index | O1l-11r india-cities |
| F6 | O1l-21r counted twice | two blocks carry the same Peshawar/Quetta work with different row counts (Peshawar 366 rows and fajr 366/366 in one, 365 rows and fajr 365/365 in the other); the wtdiff must pick one | O1l-21r pakistan-charts, O1l-21r pk-transcribe |
| F7 | US 15/15 denominators | 20 of 29 verdict surfaces in one block, 26 of 37 in another; different denominators for the same verdict class | O1l-5 us-states, O1l-37 us-unresolved |
| F8 | Capitals count | 194 covered of 202, or 195 of 202 with Delhi accepted for New Delhi; the two blocks state both readings | O1l-38 capitals, O1l-45 capitals2 |
| F9 | Cameroon label | the record row must be relabelled from Douala to the Adamawa point (7.3668/12.3533); the block records the correction, the row text still says Douala | O1l-33 central-africa |
| F10 | Malta | absent from both `world-table-v3.md` and `policy-layer.v2.5.json`; the wtdiff must add the row, not edit one | O1l-36 microstates |
| F11 | Kelantan split void | the mission names it; NO O1l block carries a Kelantan measurement this round. The record already voids the KTN01/KTN02 split (world-table v3, Malaysia row) | mission; world-table-v3.md Malaysia |
| F12 | Benin / Kandi | the mission names it; NO O1l block carries Benin. The record already withdrew the Cotonou candidate (v3 Benin row, D15 item 4); a Benin probe was in flight in the westafrica2 workspace at cut-off | mission; world-table-v3.md Benin |
| F13 | Mauritius | no O1l block carries a Mauritius measurement; the span ledger holds it at SINGLE-CYCLE with a structurally negative year-2 | O1l-A2 span-ledger |
| F14 | Masjidi.app engine | all 37 sampled tables fail the solar gate at 6.2-8.1 min RMS; the block names an engine mismatch to investigate, no cause | O1l-43 masjidal-global |
| F15 | Iran, Tehran | a 30-row table exists (95/149) but is NOT claimed against the record's closure; the closure stands untouched | O1l-45 capitals2 |
| F16 | Blocks not returned at cut-off | O1l-44 us-unproven, O1l-46 il-ps, O1l-49 eastasia2, O1l-50 westafrica2, O1l-51 germany-districts, O1l-52 second-witnesses, O1l-53 fallback2, O1l-54 nz-finish; their work is not represented here | CONSOLIDATION tail |
| F17 | Platform traps | goldenmosque.org is Rochdale UK; arresala/fambras is Sao Paulo; masjidway 9631 is Hyderabad; Cairo's Awqaf site has no prayer-times section | O1l-45 capitals2, O1l-47 megacities |
