# Night consolidation: O1k wide research, 2026-11-10 19:00 onward

Drafted 2026-11-10 20:52 against 34 returned reports. Rewritten at the night's closing cut,
after every fit and harvest that was still running at the draft landed: `fit4`, `fit6`, `fit8`,
`fit9`, `fit10`, `fit11`, `fit12`, `fit13`, `fit14`, `verify2`, `verify3`, `kel2`, `nigeria3`,
`oceania2`, `usmap`, `morocco1`, `tncities` and the closing artifacts (`fitindex/FIT-INDEX.md`,
`wtdiff/WORLD-TABLE-DIFF.md`, `decisions/DECISIONS.md`, `integrity/INTEGRITY.md`). Only
`my2027` (report pending, data banked) and the tail of `tncities`' Tunisia section (data banked,
report mid-write) were still writing at this cut, and nothing from their pending sections is
counted as settled below.

One document for the owner. Sources: `CONSOLIDATION.md` plus the `REPORT.md` of all 50 returned
wave and fit workspaces under `$HOME/athan-gitree/census/o1k-wide/`, read this session. The long
tables live where they were built and are cross-referenced here, not duplicated: every recipe is
registered in `fitindex/FIT-INDEX.md`, the country-by-country record diff is
`wtdiff/WORLD-TABLE-DIFF.md`, the owner decision sheet is `decisions/DECISIONS.md`, and the
archive-wide deliverability pass is `integrity/INTEGRITY.md`.

Method note on every number here: counts are either stated by a wave's own report or counted on
disk by script (`night-summary/count.mjs`, which walks `data/` and counts distinct dated keys per
file). Nothing is extrapolated. Where a wave gave no count, the cell says what was captured
instead. One consequence of the key-per-file basis: `morocco1`'s 61 keys are 11,590 city-day rows
(190 cities x 2 months), and `my2027`'s 4,015 keys are 11 whole-year 2027 tables.

---

## 1. The numbers

| Metric | Count | Basis |
| --- | --- | --- |
| Dated keys written to `data/` | **131,678** | Script count at this cut, 34 workspaces with data, distinct dated keys per file |
| Waves and fits that returned a report | **50** | 50 `REPORT.md` files on disk: 31 wave-class, 19 fit-class |
| Consolidated without a report file | 4 | `methods18` (15 statements), plus `usmap`, `wtdiff`, `decisions`, which delivered named artifacts (`US-MAP-UPDATE.md`, `WORLD-TABLE-DIFF.md`, `DECISIONS.md`) |
| Deliverables with no consolidation entry yet | 2 | `fitindex` (FIT-INDEX.md) and `integrity` (INTEGRITY.md) |
| Workspaces still writing at this cut | 2 | `my2027` (data banked, report pending), `tncities` (Egypt complete, Tunisia report section unfinished) |
| Countries and territories touched | **148** | Section 2, distinct names |
| Countries with a new dated surface | **65** | Section 2, rows marked NEW or LIFTED |
| New dated surfaces (publisher artifacts) | **113** | Counted from section 2, one per named artifact |
| Country firsts (first dated table on record) | **17** | The draft's 15, plus Nigeria (Masjidway months) and New Caledonia (the Noumea year) |
| Method statements captured | **28** | 15 in `methods18`, 13 in country waves (the FIANZ sheet offsets and Auburn Gallipoli's printed method are this cut's additions) |
| Fit jobs completed | **69** | `fit1` 2, `fit2` 4, `fit3` 7, `fit4` 4, `fit5` 4, `fit6` 4, `fit7` 5, `fit8` 3, `fit9` 5, `fit10` 3, `fit11` 3, `fit12` 1, `fit13` 4, `fit14` 1, `deep1` 3, `deep2` 4, `deep3` 4, `verify2` 3, `verify3` 5 |
| Recipes registered | **59 entries** | `fitindex/FIT-INDEX.md`, across 52 countries; 16 grade-A candidates on 12 distinct objects; 3 arbitrations named there |
| One recipe across a real span | **22 entries** | FIT-INDEX span verdicts, plus 2 frozen reprints (Niger, Belgium); the 13 headline spans are section 5 |
| Verdicts overturned | **48** | Section 3, table rows (37 at the draft cut) |
| Honest negatives recorded | **27** rows | Section 2, rows marked NEGATIVE (Nigeria left the set; the Pacific islands and Tahiti joined it) |
| Archive-wide integrity | PASS 48 / WARN 2 / FAIL 2 / IN-FLIGHT 5 | `integrity/INTEGRITY.md` at its cutoff: 57 workspaces, 3,828 files, 0 JSON parse failures in `data/` |

Rows by region, from the same script:

| Region | Rows | Largest single holder |
| --- | --- | --- |
| Europe (incl. UK and Ireland) | 38,904 | `iberia2` 7,727 |
| Southeast Asia | 22,780 | `indonesia` 10,952 (incl. `my2027`'s 11 whole-year tables, 4,015 keys) |
| Americas | 19,471 | `americas2` 16,830 |
| Middle East, Caucasus, Central Asia | 17,907 | `centralasia2` 11,611 |
| Africa | 17,544 | `tncities` 4,413 (incl. `morocco1`'s 61 keys = 11,590 city-day rows) |
| Deep-span harvests (all regions) | 10,618 | `deep1` 6,574 |
| Oceania | 1,997 | `oceania2` |
| South Asia | 1,463 | `southasia` 732 |
| East Asia | 994 | `koreajapan` 850 |

Reconciliation anchors, by path:

- `fitindex/FIT-INDEX.md`: 59 entries, 52 countries, 16 grade-A candidates on 12 objects, 16
  provisional, 27 community, 3 grade-blocked, 23 conflict notes of which 3 need arbitration
  (the Pakistan anchor, Indonesia's two national lines, Niger's grade). Its "in flight" section
  predates the last four returns (`fit13`, `fit14`, `verify3`, `wtdiff`) and the completions of
  `fit6`, `fit8`, `fit9`; those gaps are closed in this document.
- `wtdiff/WORLD-TABLE-DIFF.md`: against the 166-row record, 7 new row-slots, 78 changed rows,
  16 grade movements plus 7 owner calls, 8 schema rule-forms. Its three biggest: Pakistan leaves
  FALLBACK on a fitted federal chart, Taiwan's no-stable-rule verdict overturned, Germany's
  EU-Diyanet leaves F while Tunisia (7-year) and Iceland (3-year) reach A. It was drafted before
  `fit14` and the final UK synthesis; the UK rows here carry the later reading.
- `integrity/INTEGRITY.md`: the whole-archive pass. 48 workspaces PASS, 2 WARN (one zero-byte
  capture each in `nordics2` and `ukscotland`), 2 FAIL (`centralasia` serves 2,417 keys against
  2,478 declared, minus 2.5 pc; `my2027` had no report at its cutoff), 5 in flight at its cutoff.
  Its raw/deduplicated row totals (136,498 / 132,879) use a different method than the key count
  above; both are stated so neither is mistaken for the other.

### Still writing at this cut

| Workspace | Scope | State on disk |
| --- | --- | --- |
| `my2027` | the Malaysia state-mufti 2027 sweep for national year-2 | 11 whole-year 2027 tables banked (Jawi KL and Labuan, nine Selangor districts), 4,015 keys. No report |
| `tncities` | Tunisia countrywide recipe test + three more Egyptian cities | Egypt complete and settled (section 2). The Tunisia three-city harvest is banked in `data/`; the report ends mid-write before its Tunisia results |

---

## 2. Country-by-country changes

Labels: **NEW** = a dated surface the record did not list, with the count of distinct artifacts.
**LIFTED** = a recorded lift met. **CORRECTED** = a recorded reading changed. **CONFIRMED** =
the record's reading re-measured and held. **NEGATIVE** = searched, nothing found.

Star marks the owner's five priorities.

### Southeast Asia

| Country | Change | Rows held | Fit recipe |
| --- | --- | --- | --- |
| Indonesia * | NEW (3): Muhammadiyah KHGT API 2025-2035, Banda Aceh and Puncak Jaya years, Istiqlal's second surface. CORRECTED twice: the six-regency anomaly is 21/19 on both twilights and elevation-keyed to Kemenag alone, and KHGT is 18/18 at both twilights | 10,952 (SIHAT 5 cities 2026, KHGT 5 cities 2026 and 2027) | Kemenag 20/18 +2.0 (Jayapura +1.5) over 365 days. KHGT 18/18 ceil +1, 100 pc within 1 over 1,116 rows to 2035 and unchanged at Banda Aceh 2026-2027. The Kemenag gap is about 8 min at fajr (7.9 to 8.5 by city), not 7.8 (`verify3`). The 21/19 boundary sits between Deiyai 1,718 m and Paniai 1,786 m; exactly six regencies, no seventh in the 516 (`fit10`) |
| Thailand * | NEW (2): nine provincial CICOT workbooks, 365 rows each, edition year-stamped BE 2569 by exact cross-match with the 10-province PDF | 3,285 | Held 19.8/18.1. No re-fit ran. Province coordinates are printed in each workbook |
| Philippines * | LIFTED (2): Davao City year-round series (90 rows), BARMM four-province series (58 rows) | 148 | Davao fajr 18.1 +0.5, isha an angle 16.7 +1.5 (540/540 within 1). BARMM fajr 17.5 to 17.7, isha 18.1. The two isha rules miss each other by 4 min on every row |
| Malaysia | NEW (3): 2027 zone tables, KL/Putrajaya, Labuan, five of nine Selangor districts (Selangor splits three zones into nine districts on 2027-01-01); the Kelantan mufti's zon 1 and zon 2 posters, Zulkaedah 1441, captured at last (`kel2`); Terengganu's PADK 1448H takwim poster album. CORRECTED: the recorded KTN01/KTN02 isha split does not exist in Kelantan's own posters | 2,555 plus the zon and takwim images | Held 18/18, dhuhr +1.5, maghrib without ihtiyati. Kelantan zon 1 is the JAKIM rule at 18/17 (isha 18 misses by 5.3 min on all 59 days); zon 2 is the same rule at a different reference point (~4.4-4.9 N, 101.6-101.9 E), reproducing to 0.1 min. KTN01's fajr-20 candidate is excluded by 5 min; the flagged +1 is a subuh-and-syuruk column convention (`fit10`, `kel2`). The `my2027` state-mufti sweep is banked, report pending |
| Singapore | CONFIRMED, year 4 | 365 | 20/18 ceiling. MUIS 2027 PDF parsed |
| Brunei | NEGATIVE: OData still ends 2026-12-31. Method now community-sourced 20/18 citing Odeh 2024 rev 17 Dec 2024 | 0 | Fallback 20/18, nearest, dhuhr +1 |
| Vietnam, Cambodia, Laos | NEGATIVE (all three): mawaqit-only mosques | 0 | None |
| Myanmar | NEGATIVE at authority tier, Burmese pass | 0 | None |

### South Asia

| Country | Change | Rows held | Fit recipe |
| --- | --- | --- | --- |
| Pakistan * | NEW (1): federal Nizam-e-Salat chart, 366 rows, authority tier. Method resolved and independently confirmed (`verify3` re-derived the column map from geometry): dhuhr is exactly 13:00/13:15 on 183 days each, the isha ladder prints 11 distinct values on 19 switch dates, and no angle reproduces it. The 2026 unified calendar has still not moved | 366 | Karachi 18/18 Hanafi asr +2, maghrib sunset+6, dhuhr the two-phase clock, isha the 15-minute ladder. MWL 18/17 refuted on asr by 58 min. The two workspaces' anchor disagreement (current-year vs leap-basis) is fit-index arbitration item 1 |
| India | NEGATIVE. Kerala's print source named: Suprabhatham. Trap: makkahmasjid.net is Garland, Texas | 0 | None |
| Bangladesh | NEGATIVE. Decoy unmasked: kivabe.com prints smooth curves instead of the 3-6 day band | 0 | None |
| Sri Lanka | CONFIRMED: no regeneration, third observation. Zone 03 re-upload is a title fix | 30 re-checked | 12 zones unchanged, 0/180 mismatches |
| Maldives | NEW (1): community per-island annual table, yearless | 365 | MABIMS 20/18 with margins, all 2,190 values within 2 min |
| Nepal | NEGATIVE: both named bodies NXDOMAIN | 0 | None |

### East Asia

| Country | Change | Rows held | Fit recipe |
| --- | --- | --- | --- |
| China | CORRECTED: method now quotable. The portal's own footnote states 15/15 Hanafi, +5/+5, and the 15-degree decision traces to the association's 2002 journal | 0 (calculator grid) | 15/15 Hanafi, dhuhr +5, maghrib +5, imsak -10. Still a calculation, never a publication |
| Taiwan | CORRECTED: the interval rules are edition-stable, the buffers are editorial | 44 | fajr sunrise-70, isha maghrib+90, dhuhr noon+19, asr quasi-fixed 16:06, maghrib +6.7 in 1447 only |
| Hong Kong | NEW (2): Trustees' printed full-year sheet (60 sampled days) and their 2026 Ramadan table (30 rows). CORRECTED: the sheet is three constructions, not one | 90 | Page 1 uses angles (fajr 18.5 mean, isha 21.3). Page 2 is fixed intervals (fajr sunrise-80, isha maghrib+80, dhuhr a 13:00 clock, Hanafi asr). The feed takes page 1's fajr and page 2's isha |
| Macau | NEGATIVE: no site, Facebook login-walled | 0 | None |
| South Korea | NEW (1): KMF national full-year PDF plus a stated method | 365 | MWL 18/17 ceiling, 2,153 of 2,184 within 1 min |
| Japan | NEW (3): Nagoya full-year PDF, Tokyo Camii monthly plus stated margins, Sapporo two Ramadan years | 485 | Nagoya 18/17 Shafi plus or minus 2.5, no margins. Tokyo sunrise -7, dhuhr +5, asr +5, maghrib +8 |
| Mongolia | NEGATIVE: islam.mn SERVFAIL | 0 | None |

### Europe and the UK

| Country | Change | Rows held | Fit recipe |
| --- | --- | --- | --- |
| Germany | NEW (1): Diyanet portal full years for Koeln, Berlin, Frankfurt. CORRECTED: the EU-DIYANET-UNIFIED object's recipe question is closed and it leaves grade F | 1,095 | The portal serves the 2023 European scheme (18/16) wrapped in DOMESTIC temkin: sunrise -6.5, dhuhr +5.5, asr +3 shadow-1, maghrib +6.5, caps near night/5 fajr and an 80-min isha plateau (`fit4`). Isha 16 deg hits 78/68/76 of 182 winter days at the three cities; 17 deg scores zero. Not the 18/17 prose |
| Norway | CORRECTED: the schism is three coexisting recipe forms, and the third line is a Moonsighting Committee table, not an angle pair | 5,209 across `nordics2` | IRN 16/15 holds on angle-honest days (its 5-min dhuhr safety lands DST-doubled); mawaqeet 18/15 holds with a midnight-capped fajr and printed null summer isha; Jamiat Ulama's islamweb.no is Moonsighting Committee high-latitude with Hanafi asr, 7 city-years. Tromso's polar-night synthetic block is 235 days in three ranges, not the 50 first recorded (`fit8`) |
| Sweden | CORRECTED: one recipe, three cities, on Diyanet's engine. The record's freeze mechanism does not survive | 1,460 | IF 18/16 holds as the pair, not year-round; the engine fingerprint is Diyanet's (sunrise -6.5, dhuhr +5.5, maghrib +6). The record's frozenLatitude45 with an 80-minute plateau reproduces nothing, and the same failure shows on the Koeln control (`fit8`). The January fajr freeze belongs to the Goeteborg mosque PDF layer, not the IF national table |
| Denmark | CORRECTED: Copenhagen splits three ways, and the 15/15 day-fit is the minority layer | 456 | Khair al Bariya 18/16 confirmed with mosque-layer offsets; Mawaqeet 18/15 confirmed (the network's render, not a Danish body); salah.dk 15/15 confirmed as the aggregator. DIT/wakf, the record's original day-fit source, prints isha = maghrib + 97. Imam Ali runs Tehran 17.7/sunset+4.5, confirmed (`fit8`) |
| Finland | NEW (2): Helsinki year plus a published method | 395 | MWL 18/17, summer 1/5 of night, stated not derived |
| Iceland | CONFIRMED plus year 3, grade A. CORRECTED: the winter +90 clause does not exist | 2,190 across three years and two cities | 14.2/14.0 with the night portion taken from the angle itself, 2,190/2,190 within 1. The December +90 rule fires on zero days and is dropped. The asr column lags the date by about two days at both cities |
| Estonia | CONFIRMED twice, grade A: engine verified 36/36 live, then reimplemented at 1,460 of 1,460 rule labels | 1,460 | 15/15 with quarter-night fajr and month-fixed isha. One parameter set covers both years; the published 45-120 bounds never move a value |
| Latvia | NEW (1): first data, three cities, at an IslamicFinder-rendered centre. The seasonal pair renders as a delta over an operative 15/15 (`fit6`) | 6 | UOIF 12/12 summer, ISNA 15/15 winter |
| Lithuania | NEW (1): first data, muftiate rolling week | 7 | 18/16 shape with Diyanet-family margins (-7/+5/+6/+8, `fit6`); Kaunas routes to Diyanet |
| Belarus | NEW (1): first data, Minsk 2025 | 365 | Capped table: fajr stops at 07:16, isha at 23:06; `fit6` reads 18/~16 with fixed-clock caps (fajr 03:08 x 14 days, isha 23:06 x 13) - a second clock-ladder country |
| Ukraine | NEGATIVE: 2027 not published, five paths 404 | 0 new | Interval-rule object unchanged |
| Netherlands | LIFTED (1), grade A: closed on measurement and verified | 2,920 | 18 rising floored 03:30 / 17 setting capped 23:30 reproduces all six city-years, worst 2 min; caps bind 190-208 printed days; parameters frozen 2025-2026 (`fit9`) |
| Belgium | CORRECTED, provisional on a frozen reprint: window boundaries measured, the 17-degree object refuted | 730 (two years) | 18/18 outside the window (RMS 0.52). Only the middle 65 isha days track latitude 45; the rest are flat plateaus. `fit9` encodes and freezes the window rule (worst 6 across both years), and the 2025 table carries the identical window, 363/365 month-days identical |
| France | NEW (2): GMP November poster, CTIR 2020 year | 427 | GMP isha = maghrib + 87 exactly. CTIR prints the mirror of its stated pair: 14.5/13.5 |
| Luxembourg | NEW (1): Shoura 2026 full year | 365 | 13.0 fajr, 12.9 isha. MWL and ISNA refuted; new defect: 29 March maghrib and asr left on CET (`fit3`) |
| Austria | CORRECTED: no 2027 edition exists, the calendar is permanent. The 2025 XLSX is banked | 365 | Permanent calendar, one minute per year, 2029 leap correction |
| Switzerland | NEW (1): Geneva foundation archive, 1,022 rows, 1447 and 1448 frozen. Now fitted across the span, grade A | 1,022 | One recipe (fajr 15.0, zero margins, isha = maghrib + 90 exact on 1,022/1,022) fits 1446/1447/1448 identically, 100 pc within 1 with one defective month excluded (`fit6`). New defect: the Feb-2025 poster is internally inconsistent (mornings -49, evenings +40). IZRS stays login-gated |
| Italy | CORRECTED: the Grand Mosque of Rome does publish. UCOII identified as an AlAdhan method-3 wrapper | 150 | Rome fajr 19.1 exact, isha = maghrib + 90 on 30/30, asr Shafi, margins measured (`fit9`) |
| Spain | NEW (2): Granada full Hijri year, Malaga poster. Madrid re-captured whole. CORRECTED: there is no national recipe | 1,200 | Granada is 18/17 with zero margins frozen across both hijri years (Madrid's +1s fail there, worst 2); Malaga is a third micro-line (`fit9`) |
| Portugal | LIFTED (1), grade A: the 2023 edition at the Wayback hold, and the header settles the fit | 2,190 (six city-years) plus the 2023 set | isha 12 deg + 3 min, capped 01:20; the interval column is maghrib + 77 exactly. One recipe spans all three editions (2023/2026/2027, 1,095 days), margins move at most 0.09 min, fitted latitude identical to 0.02 deg (`fit9`) |
| Croatia | NEW (1): Pula 242 rows | 272 | Own table, longitude-correct |
| Bosnia | CONFIRMED: printed Takvim equals the API, zero diffs. The 2027 echo is a 2026 copy | 365 | Held recipe |
| Serbia | CORRECTED: the offset table is a three-group design that the record filed as render damage | 0 new | Fajr+sunrise, dhuhr, and asr+maghrib+isha carry separate offsets |
| Montenegro | NEW (1): the IZCG portal declares its own recipe, plus 2,190 rows | 2,190 | 19.5/17.5 Shafi with per-city minute shifts |
| Bulgaria | NEW (1): Plovdiv and Varna own rows, Sofia year-2 | 1,095 | Longitude-only defect proven: identical day lengths across towns |
| Greece | CONFIRMED negative plus a second Ramadan season at Athens | 59 | Komotini is widget-only. Athens isha gap 82 to 84 min |
| North Macedonia | NEGATIVE: ivz.mk dead, IVZ today-only | 0 | None |
| Romania | NEGATIVE: calculators only | 0 | None |
| Kosovo | NEGATIVE: no 2027 edition yet. Last year's landed 14 January | 0 | None |
| Ireland | NEGATIVE: IFI `?year=2027` is byte-identical, Galway 2027 dates 404 | 366 | Frozen undated table with a live DST defect |
| UK, London | CONFIRMED: LUPT uniformity at the flagship, and the publisher now serves 2027-2076 | 365 (ELM) plus 121 adopter rows | LUPT table. ELM 35/35 exact, ICC 305/305 exact against ELM. `fit14` adds the ELM 0/-7 and MWH -1/-7 offset pairs |
| UK, Scotland | CORRECTED: zero Scottish surfaces republish LUPT, every one prints its own, and each mosque is its own engine | 2,464 across the workspace, England included | Aberdeen AMIC is the Wifaqul recipe exactly (18/15, half-night fajr cap, seventh-night isha; 333/333 within 1 - the only year-surface that holds at latitude); Dundee runs a night-fraction summer regime with weekly plateaus; Glasgow is a private engine with fajr clamped 01:33 for 96 days; Edinburgh November reads MWL 18/17 (`fit4`) |
| UK, 20 English towns | CORRECTED: the mosaic is mapped to its final form by `fit14` | 4,498 | 30 captures with 25 or more dated rows: 3 LUPT-exact windows (ELM full-year, ICC, Middlesbrough Nov), 6 LUPT+constant-offset (Coventry +3/+3, Bolton +3/+5, ELM 0/-7, MWH -1/-7, Hull -3/-21, Cambridge -2/-5), 16 running their own interval arrays in LUPT's construction, 5 angle feeds on defective dpt installs (Oxford, Nottingham, Slough 2022, Walsall 2020, Bradford Hanfia's isha). No capture anywhere in England carries the Wifaqul fixed-angle construction. The Reading and Rochdale isha deviations are the same curve within 0.6 min: one alternative isha table, two publishers |

### Middle East

| Country | Change | Rows held | Fit recipe |
| --- | --- | --- | --- |
| Bahrain | NEW (1): the full 1448 table, plus the council's method statement | 355 | Isha 18 deg true, dhuhr at disc transit. Fajr recovered empirically at 18.1 (Dilmunia) and 18.2 (Manama) |
| Saudi Arabia | CONFIRMED, grade A on the span, plus Medina and Jeddah, 1448 and 1449 | 1,418 new | 18.5 floor+1, isha maghrib+90 and +120 in Ramadan, month-exact. `verify2` extends it: one recipe serves all four cities, 100 pc within 1 on 2,836 days, each free fit within 0.04 deg of 18.5 |
| Yemen | NEW (2): the Sanaa API and the recognised government's Aden month. Neither fitted, owner choice. `kel2` adds the neutral diff: the feeds serve disjoint geographies and sit 13.3 min apart at fajr, 14.2 at isha, 0.9 at dhuhr | 309 | Unfitted by instruction |
| Lebanon | NEW (1): the composite feed, five regional tables, 366 rows each, year inferred 2028 | 0 dated (undated keys) | No single coordinate reproduces it. Unfitted |
| Palestine | NEGATIVE: three named closures | 0 | None |
| Syria | NEGATIVE: the new portal closes | 0 | None |
| Oman | CONFIRMED, year 5, grade A, plus the 2021-2028 decade | 2,920 | 17.8/18.15, +5 ceil on dhuhr, asr and maghrib, Shafi asr (Hanafi is 56 min out). The banked 2028 file's 51 mis-parsed dhuhr cells repaired |
| Egypt | CONFIRMED, now countrywide: `tncities` proves the frozen recipe at Port Said, Luxor and Assiut over full 2026 (365 rows each, zero pads, zero misses beyond 1 min), beside Cairo | 1,095 new (Cairo 30, two cities 60, three cities 1,095) | 19.5/17.5, zero margins, Shafi asr, no city or column needs a pad across 25.7-31.3 N. The postback needs the exact tatweel spelling |
| Morocco | NEW: the ministry's rebuilt portal harvest is banked at national scale - 190 cities x Oct+Nov 2026 (`morocco1`). CORRECTED: the additive margin regime shifted at the rebuild | 61 keys (11,590 city-day rows) | At the recorded margins 0 of 190 cities pass the 1-min gate (asr-driven, worst 2.84); at fitted margins the solar engine reproduces 99.5 pc of 69,540 cells, 39 cities perfect. The table did not change, the margins did. The legal clock is GMT year-round since 2026-09-20 by decree 2.26.530, encoded in the portal itself; the old Ramadan display rule has no future surface. Angle identification is degenerate on two months: 19/17 stays with the census multi-year fit. The portal window is current + previous month only, and December must be caught when it publishes |
| Algeria | NEW (1), grade A on the joined test: first authority table, four ministry PDFs from Wayback | 119 + 708 across both Hijri years | fajr 17.80 floor, isha 16.10 +5 nearest, Shafi +1, dhuhr +1, maghrib +4, sunrise +1. Frozen across 1447 and 1448 (`fit11`), and 1448 is recomputed, not reprinted: 11 of 174 paired cells identical, the differences track the 10-day solar drift (`verify3` confirms; the constants are a family from 17.4 to 17.8, the printed times are frozen). The per-wilaya register is a display aid, not the generator. Egyptian 19.5/17.5 refuted |
| Tunisia | CORRECTED, grade A on seven years: a dated archive in place of the recorded today-only page | 2,557 (2020-2026) plus 3,318 banked keys for Kairouan, Gafsa and Sfax | 18.1/18.1 round, dhuhr +7 round, maghrib +2 ceil, Shafi asr nearest, frozen across seven years, 94.2 pc of days all-five within 1 (`verify3` confirms; the deliverable's stored asr floor mode does not match its own headline). The archive's true start is 2019-10-31; the endpoint is one day per request with no month form. The three-city countrywide test is banked, its report section still writing |
| Libya | NEW (1): awqaf widget, 22 cities, Cloudflare challenge, closed unsolved | 1 day | None |
| Sudan | NEGATIVE: the ministry domain expired mid-2026 | 0 | None |
| Jordan | CONFIRMED: a fresh ten-day grid | 10 days | Within 1 min including the revised maghrib +7 |
| Qatar | CONFIRMED: today row | 1 | Held |
| Iraq | CONFIRMED: the four failed dates self-healed. `verify2` adds October: the fit holds 31/31, and October isha prints 16.9 at zero margin on 29/31 - the recorded +1 is a minute over | 31 | Held |
| Kuwait | CONFIRMED: Al-Ojeiri date-addressable | 10 | Held, matches the ministry paper |
| Turkey | CONFIRMED: 2027 not yet served | 730 | Held |
| Iran | NEGATIVE: JS cookie challenge everywhere | 0 | None |

### Africa

| Country | Change | Rows held | Fit recipe |
| --- | --- | --- | --- |
| Senegal | NEW (2): CERFI weekly tables for 152 cities and monthly PDFs. The 2011 edition is the artifact | 395 | Two dawn gates as fixed intervals: sunrise -75.5 and sunrise -60.5, isha maghrib+60 exactly. Printed "sunrise" is the second dawn. Edition-stable 2011 to 2026 |
| Mali | LIFTED (1): Bamako mawaqit cluster, four mosques | 1,460 | Al Madina: 19 +7.5 / 17 +5.5, dhuhr transit+29, Shafi asr +8 |
| Guinea | LIFTED (1): Grande Mosquee de Nono | 365 | 18/17 class, dhuhr pinned 13:45, maghrib drifts after 16 October |
| Burkina Faso | NEW (2): the MSBF printed annual calendar with a text layer (2021), the current 1447 edition as five dated images, plus Bobo-Dioulasso. CORRECTED: the recipe is frozen 2021 to 2025 except the 1447 fajr, which prints 5 min later on every day | 365 | Dhuhr +33 is the platform's normalisation, not printed doctrine. Bobo tracks true noon. The 1447 fajr shift is a genuine between-year change (`fit10`) |
| Togo | CORRECTED: the served year is 2026. Year complete at community tier (`fit2`) | 365 | MWL 18/17, zero margin, nearest |
| Benin | CORRECTED: the record's Benin entry must stop claiming a Cotonou table. The page never says Cotonou; the calendar is Kandi's (11.11 N / 2.94 E, 1,852/2,190 exact), 532 km from the page's own pin | 365 | Fails at the stated point (379/2,190). Grade blocked: the row reads "Kandi community, Cotonou absent" (`fit2`, `fit11`, fit index) |
| Ivory Coast | NEW (1): COSIM's own-site calendar | 30 | Zouhr and asr print as fixed 13:00 and 16:00 national convention |
| Ghana | NEW (1): Mountari Accra second mosque | 365 new | Held |
| Liberia | NEW (1): second month | 60 | Held |
| Sierra Leone | CONFIRMED: the Ramadan sheet captured whole | 30 new | Community table, "estimated calendar" in its own text |
| Nigeria * | CORRECTED, and the negative breaks: the first mosque-level fitted recipe landed via Masjidway, a platform the record does not carry - Ansar-Ud-Deen Central Abuja (Oct+Nov) plus both Ikorodu mosques. LEMU identity corrected: Lekki Muslim Ummah, no timetable on its site | 121 | Egyptian 19.5/17.5 Shafi, RMSE 0.30/0.24/0.25 (MWL 18/17 scores 2.67, ISNA 8.69, Hanafi asr 55 min out): Nigerian practice is not uniform, and the tier-2 line needs both recipes. Every institutional body gates its timetable behind Facebook login |
| Niger | CONFIRMED: freshness passes, 30/30. Grade under arbitration: the generator has no year term and 1,651 of 2,190 slots are identical across seven served years | 0 new | 18.00 fajr, isha maghrib+75, Shafi asr, no margins |
| Mauritania | NEW (1): the ministry's 1446 imsakia, Nouakchott transcribed | 30 | Corpus 19.37/17.46 holds at zero margin (`fit2` fits 19.25/16.2, 180/180 within 1). Egyptian indistinguishable on one month |
| Somalia and Somaliland | NEW (1): first data ever, five mawaqit mosques | 1,830 | MWL 18/17 Shafi, zero margins. Two of three Hargeisa mosques share one configuration |
| Djibouti | CONFIRMED plus enumeration: all six mosques | 2,196 | Same platform class. Al-Salam FYART defective on every column |
| Ethiopia | NEGATIVE reconfirmed | 0 | None |
| Kenya | NEW (1): mosque layer, three mawaqit mosques. The Kenya Met host lead closed | 1,098 | Held Ramadan table. UMMA dhuhr +67 is a jama'ah lean |
| Tanzania | NEW (1): three Dar es Salaam Sunni mosque years, plus Arusha and Mwanza months | 1,158 | Community tier |
| Uganda | NEW (2): Sayyidina Abubakar year, and a second witness for the Kampala Jamiat generator | 761 | Generator to the minute, phantom 29 February present |
| Mozambique | NEW (2): Nampula mosque year, Maputo month | 396 | Community tier |
| Madagascar | NEW (1): Mahajanga month, first dated rows | 30 | None fitted |
| Rwanda, Burundi, Eritrea | NEGATIVE reconfirmed | 0 | None |
| South Africa | NEW (2): salaahboard 21 Cape mosques, salaahtimes.co.za serving Cape Town on Jamiat times. CONFIRMED plus extended: the Jamiat/KZN rule reproduces all 11 southern-African December towns, worst 1 min from 8.8 S to 29.3 S (`fit6`) | 61 MJC rows plus a 21-mosque board | Two-body delta measured: dhuhr -5, isha +13/-5. The dhuha formula refines to sunrise+(sunset+3-sunrise)/4; Blantyre's +3 evening shift recurs as a genuine local variant |
| Botswana | NEW (1): December, 30 towns | 930 | Proven perpetual: 146 of 151 tables identical 2021-2026 |
| Zimbabwe | NEW (1): December for Harare and Bulawayo | 62 | Held |
| Zambia | NEW (1): 13 taqweem regions plus 19 masjid jamaat sets | 13 regions, 19 jamaat sets, dated sample | Held |
| Malawi | NEW (1): December for four towns. Blantyre explained | 124 | Blantyre is +3 on sunset and maghrib only |
| Namibia, Angola, Lesotho, Eswatini | NEW (1): 31 December rows each | 124 | Fallback countries gain dated community rows |
| Mauritius | NEW (1): full 2026 year, 365 rows, 15 fields | 365 | 17.89 +10 / 17.29 +5.5, asr Hanafi +4.5, maghrib sunsetStart +6. Six regional adjustments are symmetric fixed minutes |
| Gambia | CONFIRMED plus year-2 exceeded: December 2022 via the lookaside route | 61 | Iqaamah +20/+20/+20/+10/+15 on every row |

### Americas

| Country | Change | Rows held | Fit recipe |
| --- | --- | --- | --- |
| USA | NEW (9): two dpt year feeds, seven Masjidal mosques at three years each. The default is now measured, not asserted (`usmap`): 15/15 at 105 of 134 US mosques (78.4 pc) across three independent products, 15-deg fajr at 81.9 pc, Hanafi asr 30 pc. C47's plus-or-minus-1 margin layer dissolves as an engine artefact | 2 dpt years and 7 Masjidal ids at up to three years | Plain ISNA 15/15 at round-to-minute, two with Hanafi asr. Defects: Toledo's whole-DST-window block sized 238/365 (`fit6`), San Antonio's per-column DST rows, and San Antonio's fajr stepping about 2 min mid-year (14.6 deg best) |
| Canada | NEW (9): four dpt feeds, two Quebec City mawaqit years, three Edmonton Masjidal. Separated from the US (`usmap`): 26 mosques - 14 at 15/15, 20 at 15-deg fajr, 5 at 18, 3 printing isha intervals, zero at FCNA's 13/13 | 4 dpt years, 2 Quebec years, 3 Edmonton years | 15/15 in Halifax and Quebec City. Toronto prints fajr 14.9 and 15.2 with isha as fixed maghrib+80 and +90. Five prairie installs print November +60; Saskatoon carries a Ramadan interval defect |
| Brazil | LIFTED (1): IIB keyless month API, 25 cities | 1,450 | MWL 18/17 Shafi, zero margins, 8,700 of 8,700 within 1 min |
| Chile | CONFIRMED: 18 cities re-captured, 0 mismatches. December absent | 540 | Held. Vina del Mar link defect now three months old |
| Guatemala | NEW (1): first data, Mezquita Aldaawa | 365 | Literal MWL 18/17, zero margin. Five columns 365/365 at the mosque's own pair |
| Honduras | NEW (1): first data, San Pedro Sula | 365 | 18 fajr, isha 18 +5, maghrib sunset +5, Hanafi asr (+61.5) |
| Mexico | NEW (1): first dated rows, Guadalajara Masjidbox | 7 | MWL 18/17 Shafi with zero margins on five of six columns. A lead, seven rows wide |
| Suriname | CORRECTED: the retry found a national recipe, and its isha is an interval | 29 | fajr 18, maghrib sunset+3.5, Hanafi asr, isha = maghrib + 70 exactly. The held 18/18 fails on isha |
| Venezuela | NEW (1): Mezquita de Caracas monthly PDF | 30 | Umm al-Qura 18.5 with a +0.75 fajr caution, isha maghrib+89 exactly |
| Peru | Lead only: Lima mawaqit payload, suite not run | 0 | None |
| Argentina | NEGATIVE: the flagship's only download is November 2020 | 0 | None |
| Colombia | NEGATIVE: Masjidbox landing carries one day | 0 | None |
| Trinidad | NEGATIVE plus the live Chaguanas -1h defect | 0 | None |
| Jamaica | NEGATIVE after two traps (Kingston is Surrey, the JMC is Queens) | 0 | None |
| Costa Rica, Panama, Haiti, Barbados, Bahamas, Guyana, Ecuador | NEGATIVE | 0 | None |

### Caucasus, Central Asia, Oceania

| Country | Change | Rows held | Fit recipe |
| --- | --- | --- | --- |
| Kazakhstan | CONFIRMED year 6, grade A on the span, plus Karaganda and Shymkent 2028 on both sides of the 48 N line | 1,098 | ISNA 15/15, Hanafi, -5/+5 above 48 N, -3/+3 below |
| Kyrgyzstan | LIFTED (1), grade A: the JSON API serves any window in any year | 730 (2027, two cities) | Ratio isha = maghrib + 7/9 x (sunrise - fajr) + 3.5. Maghrib sunset+7 on every day |
| Tajikistan | LIFTED (1): the archive holds 143 months back to 2014-12 | 4,343 (743 scored by the fit; the integrity pass notes only 24 month captures on disk) | Window-class: isha = printed maghrib + 90, dhuhr a wall-clock constant in two eras |
| Uzbekistan | CORRECTED: the state board and the portal do not publish the same numbers | 90 | Portal 15.5/15.5. The board adds +5 to dhuhr and ignores parameters |
| Turkmenistan | NEGATIVE reconfirmed | 0 | None |
| Afghanistan | CONFIRMED image-only. A 1400 edition matches the 1404 poster cell for cell | 0 (rasters) | Frozen generation, same publisher |
| Azerbaijan | CORRECTED: the archive is 2025-2026 only, no 2027 | 0 | None |
| Georgia | Lead fails the solar gate | 0 | None |
| Australia | NEW (7): Diyanet full-year 2026 for Broadmeadows, Preston, Brisbane; Auburn Gallipoli's own monthly API with the method printed on the gate; Lakemba and Othman Bin Affan AthanPlus monthly iqamah; Adelaide ISSA November+December plus 7 raw months. QLD/WA/SA now carry dated tables | 1,997 in the workspace | The Diyanet diaspora serves the DOMESTIC recipe (18/17 + temkin -7/+5/+4/+7), not the European 18/16, which scores exact 0 (`fit13`); Gallipoli is row-exact to the same recipe across both its years. Adelaide ISSA is a bare 18/17 calculator with no temkin, 61/61 within 1. Fitted latitude and the athan-plus iqamah offsets constant |
| New Zealand | CORRECTED twice: the FIANZ domain was suspended, and FIANZ is REBORN on fianz.com - Ramadan 1447H sheets for 33 cities with the stated offsets printed verbatim, Auckland, Wellington and Christchurch transcribed | 90 | One federation, two angle pairs: Auckland 18/18, Wellington and Christchurch 16/15 (`fit13`); suhoorEnds = fajr - 5 exactly, maghrib = sunset + 5, asr single-shadow. Contradiction caught: the sheets start Ramadan Thu 19 Feb 2026, the Hilal Committee announces Fri 20 Feb. Ramadan window only; the rest of the year is unserved and Wayback accrual has not been run |
| Fiji | NEW (1): December 2026 posted, and the two standing editions are now characterised | 61 | Widget vs sheet: dhuhr +5 constant, maghrib +2/+3, isha +6..+10, fajr/sunrise/asr within 1. The sheet's maghrib equals the widget's iqamah column daily; the Dec 2025 sheet is the year evidence. A fit must name its edition |
| New Caledonia | NEW (1), the country's first dated data: Centre Islamique de Noumea's full 2026 year, 365 rows, gated live | 365 | A hand-maintained board over an 18 deg / sunset+85 base (`fit13`): dhuhr 19 runs at transit+30, asr 13 runs at shadow-1+2, maghrib floor(sunset)+5, and a dated Ramadan taraweeh override (Feb 18-Mar 18 = 20:15). The recorded isha-19:45-all-year rule is REFUTED: it holds 243/365. Dhuhr and asr on exact 5-minute marks all year |
| Tonga | CONFIRMED as a mosque layer: Masjid Al-Khadeejah's public page exists, no times posted | 0 | Times remain calculator-only |
| French Polynesia (Tahiti) | NEGATIVE: the Masjidway page is unclaimed, times are calculator output, nothing captured | 0 | None |
| PNG, Solomon Islands, Vanuatu, Samoa, Kiribati | NEGATIVE again: calculators only (Kiribati's Ahmadiyya mosque posts no times) | 0 | None |

---

## 3. Verdicts that flipped

| Object | Prior reading | Tonight |
| --- | --- | --- |
| Taiwan | "No stable rule. Buffers drift year over year." | The interval rules are edition-stable: fajr sunrise-70 on 43 of 44 rows, isha maghrib+90 on 43 of 44, dhuhr noon+19 ceil. What drifts is the maghrib sunset allowance and the asr constant. The rule is stable, the buffers are editorial |
| Somalia and Somaliland | FALLBACK. No dated data. | First data ever: five mawaqit mosques, 1,830 rows, MWL 18/17 Shafi with zero margins |
| China's method | Fallback recipe carried without a stated basis | The norislam grid's own footnote states 15/15 Hanafi, dhuhr +5, maghrib +5, imsak -10, while its query form still says 18/17. The 15-degree decision traces to the association's 2002 journal. Live grid measures 15 deg |
| UK outside London | LUPT presumed the reference, Wifaqul the community position | The mosaic is measured, twice over. `uktowns2`+`fit4`: every town prints its own table, and none carries the Wifaqul fixed-angle construction. `fit12`: 18 surfaces, six families, school does not predict recipe. `fit14`, the final map: 3 LUPT-exact windows, 6 LUPT+constant-offset pairs, 16 own-array drift tables in LUPT's construction, 5 angle feeds on broken dpt installs. Nottingham's June install prints an invented fajr 01:02-01:10 |
| England's tables are interval tables | fit4's "every angle candidate scores fajr exact 0; the towns are interval tables, not angle tables" | REFUTED as stated (`verify3`): Nottingham is an angle table (18/18 reproduces fajr 220/273 exact), with Watford and Oxford alongside. The modal form holds - the LUPT interval construction - and the universal does not |
| Philippines isha | "A fixed interval after maghrib" | Davao is an angle, 16.7 deg: a fixed interval cannot produce a 64 to 69 minute span, the angle reproduces it at worst 1. BARMM is also an angle, 18.1. Two regional methods, 4 min apart on every row |
| Azerbaijan | "Images posted to 2031" | The archive is 2025 and 2026 only. 2027 through 2032 return 302 |
| Serbia offsets | "Render-damaged offset table" | A three-group design by column. The 2026 Novi Pazar base is negative; rijaset.rs is an IslamicFinder widget |
| Tunisia | Today-only page | A dated archive serving any date back to 2019-10-31, first-party. 2024 and 2025 harvested whole, zero null days; seven years now fitted and graded A |
| Kyrgyzstan | "21-day clamp, no year door" | The muftiyat JSON API serves any two-month window in any year. Full 2027 for Bishkek and Osh, and 2028 serves too |
| Iceland | One year, two captures, a winter +90 display rule | Three years banked, 14.2/14.0 with the night portion from the angle, every row within 1 min. The December +90 rule fires on zero days in any year and is dropped |
| Togo and Benin | Captures aligned to 2027; Benin a northern-city puzzle | Both are 2026-aligned. Benin resolved to attribution: the page never says Cotonou and the calendar is Kandi's, 532 km from the pin. The record's Benin entry must stop claiming a Cotonou table |
| Algeria | Expected Egyptian 19.5/17.5 | Refuted at zero margin. The ministry's own tables are frozen across two Hijri years and 1448 is recomputed, not reprinted. The constants are a family; the printed times are frozen |
| Belgium's isha object | The 17-degree isha object | Outside the window isha is 18.0 (RMS 0.52); 17 deg misses by 7 min. Inside the window only the middle 65 days track latitude 45; the rest are flat plateaus. The window on page one is not the window the table uses |
| Italy | The federation publishes nothing of its own | The Grand Mosque of Rome publishes Roman times as a monthly PNG: fajr 19.1 deg, isha maghrib+90 exactly. UCOII is an AlAdhan method-3 wrapper |
| Uzbekistan | "The numbers agree" | The state board disagrees at dhuhr, maghrib and isha and ignores every parameter. islom.uz is the publisher of record |
| Quebec | "The flagship is an image-only calendar" | Two mawaqit years, both literally 15/15 at 0.06 and 0.07 min on fajr |
| Guatemala | "MAE 0.01 and 0.04", read as a fitted result | Reproduced exactly at the mosque's own coordinates; the 0.01 was an engine artefact and the true rounding floor is 0.25 min |
| Suriname | Retry negative | A real national recipe: fajr 18, maghrib sunset+3.5, Hanafi asr, isha = maghrib + 70 on all 29 rows |
| Canada and FCNA | Councils state 13/13 for Canada | Neither of Toronto's two largest mosques uses it. `usmap` closes it: 0 of 26 Canadian mosques at 13/13; Canada is materially less uniform than the US |
| Denmark | A 15-degree fajr day-fit on record | The 15-degree reading came from salah.dk's aggregator table. The dominant published lines are 18/16 and the mawaqeet-network 18/15; DIT/wakf prints isha = maghrib + 97 (`fit8`) |
| Russia | The C23 row labelled "Surgut" | The page serves Salekhard data under a Surgut URL. Surgut itself is absent from CDUM's web |
| Masjidal platform | Range API "returns today only" | The widget's own script builds from_date and to_date, keyless, any span. Ten ids at three years each |
| Mexico | The one promising site returned 403 | That domain belongs to Madrid's CCIM. Guadalajara's Masjidbox page gives the first dated rows |
| Jamaica | Two live leads | Both were the wrong country: Surrey, England and Queens, New York |
| New Zealand | The FIANZ surface on record; later, "the surface is gone" | Both halves wrong, in sequence: the suspended fianz.co.nz is dead, but FIANZ is reborn on fianz.com with Ramadan 1447H sheets for 33 cities and printed offsets. And the sheets start Ramadan 19 Feb against the Hilal Committee's 20 Feb: the table-vs-announcer split inside one federation |
| Netherlands | A candidate that could not be closed | Closed on measurement and verified: VIN's own declaration reproduces all six city-years, worst 2 min. Grade A |
| Spain, Madrid | "Misses December both years" | Wrong on one: the 2025 December file exists. Re-captured whole |
| Oman | Asr read as Hanafi | Asr is the Shafi shadow with +5 ceil. Hanafi is 56 min out |
| Kenya | "Kenya Met hosts the year-round tables" | meteo.go.ke carries no prayer content. The year-round surface stays the Muslim Pro widget class |
| Sri Lanka | The lift was "a regenerated edition" | Third observation of the perpetual artifact. It did not happen in 2026 |
| Bangladesh | kivabe.com as an IFB republication | A decoy: smooth daily curves, no 3 to 6 day plateaus |
| Botswana | The grade-A year path was open | Perpetual: 146 of 151 monthly tables identical 2021-2026 |
| Egypt | `city = القاهرة` works in the postback | The option value must carry the exact tatweel spelling. And the recipe is now countrywide at four cities over full years (`tncities`) |
| Mauritania | "Provisional, corpus-measured, no surface" | The ministry's own 1446 imsakia exists. Nouakchott transcribed |
| Hong Kong | One fitted recipe for the feed | The print is three constructions: page 1 angles, page 2 fixed intervals with a 13:00 dhuhr clock, the feed a hybrid of both. Grade A stays withdrawn, harder |
| South Korea | Two mawaqit captures | A national council PDF with a stated MWL method and ceiling rounding |
| Portugal | The fit debate over its isha | The header settles it, and one recipe spans three editions. Grade A |
| Germany's EU-Diyanet | Grade F, recipe unknown | The portal serves the 2023 European 18/16 set wrapped in domestic temkin, not the 18/17 prose. The object's recipe question closes and it leaves F (`fit4`) |
| New Caledonia's isha | Isha pinned 19:45 all year | REFUTED: 19:45 holds 243/365; the free days grade toward sunset+85 in 7-day blocks, with a dated Ramadan taraweeh override at 20:15 (`oceania2`, `fit13`) |
| Kelantan's zones and the KTN split | "KTN01 isha 18 / KTN02 isha 17"; the mufti posters unread | The split does not exist: both zon posters are the JAKIM rule at 18/17 at different reference points, zon 2 solving to ~4.4-4.9 N. The posters were captured at last after the first attempt honestly failed to save them; KTN01's fajr-20 candidate is excluded by 5 min and the +1 sample is a column convention (`fit10`, `kel2`) |
| Sweden's freeze mechanism | frozenLatitude45 with an 80-minute plateau, verified exact | Does not survive: frozenLatitude45 scores 0/118 at Stockholm and the same failure shows on the Koeln control. What is verified is the 18/16 pair on Diyanet's engine plus a proprietary summer plateau (`fit8`) |
| Burkina Faso's frozen generation | One recipe across editions | Frozen 2021 to 2025 except the 1447 fajr, which prints 5 min later on every day, with the isha block re-set. The multi-year ruling's target class, caught again (`fit10`) |
| Nigeria | CONFIRMED negative, no dated data | First mosque-level fitted recipe: Egyptian 19.5/17.5 Shafi at RMSE 0.30/0.24 via Masjidway, diverging from the SPA's 18/17. Practice is not uniform (`nigeria3`) |
| Australia's Diyanet scheme | Presumed the European unified set | The diaspora serves the DOMESTIC recipe (18/17 + temkin) at all three grid points and at Gallipoli's own API; European 18/16 scores exact 0 (`fit13`) |
| Norway's Tromso synthetic | A 50-day polar-night block | 235 days in three ranges, with a creep rule of 0.2-0.5 min/day into solstice plateaus and 130 honest days (`fit8`) |
| Iraq's isha margin | October needs +1 | October prints isha 16.9 at zero margin on 29/31: the recorded +1 is a minute over (`verify2`) |
| Muhammadiyah's Kemenag gap | A constant 7.8 min at fajr | Confirmed as constant, corrected to about 8.0: 7.99 Jakarta, 8.48 Jayapura, per-year spans 8.1-8.8 with no drift (`verify3`) |
| Morocco's margin regime | The recorded margins (fajr -1, asr +1, isha 0) on the rebuilt portal | 0 of 190 cities pass at the recorded margins, everywhere asr-driven. At fitted margins the national generator reproduces 99.5 pc of cells. The table did not change, the additive margins did; the GMT decree of 2026-09-20 makes the old Ramadan display rule permanent-law-obsolete (`morocco1`) |

---

## 4. New rule-forms for the policy schema

The night produced shapes the current schema cannot express. Each one is stated with the evidence
that forces it, because a rule-form without its measurement is folklore.

**1. Clock ladder (Pakistan, isha; Minsk, both gates).** The federal chart prints eleven distinct
isha values from 18:45 to 21:15 on a 15-minute grid across nineteen switch dates, including one
30-minute drop on 1 October and one upward step on 20 December while the sun is still falling.
No angle reproduces it (best 31/366 exact, worst 26 min); the best computational approximation
hits 233 of 366 and the 133 misses are exactly the editorial switch dates (`verify3` confirms
both readings: 19 switch dates over 11 distinct values). Minsk is a second instance: fixed-clock
caps at fajr 03:08 x 14 days and isha 23:06 x 13 (`fit6`). Schema need: a value class that is a
dated schedule with a step size and named switch dates, distinct from both an angle and a
constant margin.

**2. Two-phase federal clock (Pakistan, dhuhr).** Dhuhr prints exactly two values, 13:00 on 183
days and 13:15 on 183, switching 15 April and 15 October; the rule reproduces 366 of 366 and
`verify3` re-derived the column map from solar geometry independently. A quarter-snap of transit
scores zero. Schema need: a wall-clock window pair with fixed calendar boundaries, evaluated
before any angle logic.

**3. Window grammar (Tajikistan).** Each day prints six windows in place of six instants, and the
ends chain (dhuhr's window ends one minute before asr starts on 698 of 743 days). Two bounds
carry a single rule across twelve years: isha's left bound is printed maghrib + 90 (671 of 743
exact) and dhuhr is a wall-clock constant in dated eras (740 of 740). Fajr does not decode at
all: implied angle 15.30 to 20.35 degrees across months. The authority's homepage today-instants
equal each window's left bound, so a window surface converts with the existing consumer path.
Schema need: a row of interval pairs.

**4. Two-dawn intervals (Senegal).** Fajar is sunrise - 75.5 and Suba is sunrise - 60.5, both
fixed intervals (365 of 365 within 1 each), and the printed "sunrise" column is dawn two, not
sunrise: it misses astronomical sunrise by up to 51 minutes on every row. Edition-stable 2011 to
2026. Schema need: two dawn fields, a flag that the sunrise column is not sunrise, and an
interval class for dawn.

**5. Flat plateaus (Belgium).** Isha leaves the real-latitude 18-degree curve on 1 May and
rejoins 12 August, 103 days; fajr runs 10 May to 2 August. Inside the window, 21 days are flat
at 23:26 and 17 at 23:33, and only the middle 65 track latitude 45. Outside, isha is 18.0 (RMS
0.52). `fit9` froze the full window rule and showed the 2025 table carries the identical window.
Schema need: per-prayer seasonal substitution windows with measured boundaries carried beside
the stated ones, and a flat-plateau value type.

**6. Three-group offsets (Serbia).** The Devridaim register offsets three column groups in place
of six prayers: fajr with sunrise, dhuhr alone, asr with maghrib and isha. Read per prayer it
looks like render damage, which is how the record filed it. Schema need: offset groups that
bind several prayers to one constant.

**7. Elevation-keyed 21/19 (Kemenag only).** Six regencies deepen both twilights by 1.0 degree.
The boundary is now exact: the threshold sits between Deiyai 1,718 m (plain 20/18) and Paniai
1,786 m (21/19), with no seventh member in the 516 (`fit10`). Muhammadiyah prints plain 18/18
at its own 3,396 m. The rule belongs to one publisher and must never be derived from elevation.
Schema need: a named exception set keyed to a publisher.

**8. Edition-named surfaces (Fiji, Hong Kong).** Fiji has two standing authority editions whose
deltas are stable and characterised (dhuhr +5 constant, maghrib +2/+3, isha +6..+10), so a fit
without an edition name is undefined. Hong Kong is one print carrying three constructions, and
the Masjidal feed is a hybrid of two of them. Schema need: an edition identifier on a surface,
and per-edition recipes under one publisher.

**9. Hand-block boards (New Caledonia).** The Noumea year is not daily computation: the 5-minute
columns are hand blocks (dhuhr 19 runs tracking transit+30, asr 13 runs at shadow-1+2, isha
graded 7-day blocks toward sunset+85) plus a dated Ramadan taraweeh override. The first census
board whose block structure is fully resolved - the citation class for mawaqit iqamaCalendars
as board entries versus engine output (`fit13`). Schema need: a block-run value type with
override dates.

Supporting forms, with this cut's additions:

- **Isha as a printed interval**: Toronto +80 and +90, Taiwan +90, Hong Kong +80, Venezuela +89,
  Niger +75, Suriname +70, Senegal +60, Davao's BARMM neighbours, and Denmark's DIT/wakf at +97.
- **Summer caps**: Kitchener pins isha at 22:10 for 89 consecutive days, the Netherlands at
  03:30/23:30, Belarus at 07:16/23:06, Glasgow's private engine clamps fajr at 01:33 for 96 days.
- **Seasonal scheme swap**: Latvia runs 12/12 summer and 15/15 winter, Estonia fixes isha per
  month, Finland states 1/5 of night. A single frozen parameter set cannot express these.
- **Rounding carried per column**: Tunisia needs dhuhr rounded and maghrib rounded up; Oman
  needs ceil on three columns; Kelantan reads floor. Rounding is part of the recipe.
- **Per-city angle pairs under one federation**: NZ's FIANZ sheets run 18/18 at Auckland and
  16/15 at Wellington and Christchurch. A publisher name does not determine a recipe.
- **DST defect classes**: Toledo's 238-day whole-window standard-time block with sunrise exempt,
  San Antonio's per-column transition rows, five prairie installs and four Canadian blocks at
  November +60, Luxembourg's 29 March CET leftovers, Geneva's internally inconsistent Feb-2025
  poster.

---

## 5. The deep-span verdicts

One recipe across years or editions. Every job fits each year separately, reports the per-year
score, and tests whether the recovered constant moved. The full registry with per-entry scores
is `fitindex/FIT-INDEX.md` (22 span-verdict entries plus 2 frozen reprints); these are the 13
headline spans.

| Surface | Span | Rows | The one recipe | Stability | Seasonal amplitude |
| --- | --- | --- | --- | --- | --- |
| Kazakhstan, Astana and Petropavl | 2026 to 2100, nine sampled years | 6,580 | ISNA 15/15, Hanafi asr, twilight-angle high latitude, -5/+5 above 48 N | Flat: 99.7 to 100 pc within 1, no trend. A live 2100 render matched the harvest 36/36. Dhuhr carries a constant +1 min model bias all century | Fajr 269 min at Astana, 288 to 289 at Petropavl |
| Saudi Arabia, Makkah | Hijri 1450 to 1500, six sampled years | 2,124 | 18.5 floor+1, isha maghrib+90 and +120 in Ramadan | Exactly two interval values across six Hijri years: 177 Ramadan days at 120, 1,947 at 90, zero violations, month-exact. `verify2` extends the same recipe to all four cities on 2,836 days | Fajr 90, isha 117 including the 30-minute Ramadan step |
| Kyrgyzstan, Bishkek | 2027 to 2035, five sampled years | 970 | Ratio: isha = maghrib + 7/9 x (sunrise - fajr) + 3.5, maghrib sunset+7 every day | The ratio holds: implied k 0.77657 to 0.77795. Worst year 2033 at 94.6 pc, caused by the publisher's post-leap maghrib column, bounded at 2 min and non-cumulative | Twilight window 43.9 min |
| Tunisia, Tunis | 2020 to 2026 | 2,557 | 18.1/18.1 round, dhuhr +7 round, maghrib +2 ceil, Shafi asr nearest | One recipe, all parameters frozen, per-year refits identical: 94.2 pc of days all-five within 1, never below 93.2 in any year (`verify3` confirmed). 2025 is a recomputation: only 133 of 365 printed rows repeat 2024 | Asr is the weak column |
| Tajikistan | 2014-12 to 2026, twelve years | 743 scored (4,343 harvested) | Isha = printed maghrib + 90. Dhuhr a wall clock in dated eras | Two of six bounds hold; the dhuhr convention change is dated to 2019-07-01 with an unrecorded 12:50 month in October 2020. Fajr does not hold: implied angle 15.3 to 20.35 | Month-by-month fajr spread median 15 min |
| Oman, Muscat | 2021 to 2028 | 2,920 | 17.8/18.15, +5 ceil on dhuhr, asr and maghrib, Shafi | Every one of six columns inside 1 min on every one of 2,920 days. The banked 2028 file needed 51 dhuhr cells repaired | 0 min on fajr, sunrise and dhuhr; 2 min on asr and maghrib |
| Niger, Niamey | 2025 to 2031, seven served years | 2,556 | 18.00 fajr, isha maghrib+75, Shafi asr, no margins | Frozen reprint, not a span: 1,651 of 2,190 date-and-column slots identical across all seven, the rest one minute apart. Grade under arbitration (fit index item 3) | Not measured separately |
| Indonesia, Muhammadiyah KHGT | 2025 to 2035, six sampled years, plus Banda Aceh to 2027 | 1,116 + 730 | 18/18 at both twilights, ceil plus one minute | Holds with no year allowance: 100 pc within 1 in every year and at the Aceh anchor; the margin the rule needs wanders two seconds across the decade. Prints about 8 min later than Kemenag at fajr, constant across the decade and three latitudes (`verify3` corrected the gap) | Fajr 39.9, 43.2, 33.6 and isha 35.1, 37.2, 32.4 at Jakarta, Surabaya, Jayapura |
| Switzerland, Geneva foundation | Hijri 1446 to 1448, three years | 1,022 | fajr 15.0, zero solar margins, isha = maghrib + 90 exact | 1,022/1,022 on the isha interval; 93.0/91.9/92.6 pc exact per year, 100 pc within 1 with one defective month excluded. New defect found: the Feb-2025 poster contradicts itself | Not measured |
| Algeria, Algiers ministry | Hijri 1447 and 1448, two years | 708 joint | fajr 17.80 floor, isha 16.10 +5 nearest, Shafi +1, dhuhr +1, maghrib +4, sunrise +1 | Frozen-recomputed: the 1448 recipe applies to 1447 unchanged (708/708 within 1) and paired same-Hijri cells differ by the solar drift, so the years are a genuine test. fit2's 1448 fit predicted Ramadan 30/30 exactly. The constants are a family from 17.4 to 17.8; the printed times are frozen | Not measured |
| Iceland, Reykjavik and Akureyri | 2025 to 2027, three years | 2,190 | 14.2/14.0 with the night portion derived from the angle | 2,190/2,190 within 1 on both columns. The December +90 rule fires on zero days and is dropped; the Akureyri asr defect never reaches Reykjavik | Not restated this cut |
| Estonia, Tallinn and Tartu | 2026 and 2027, two years | 1,460 | 15/15 with quarter-night fajr and month-fixed isha, clamp 45-120 | One parameter set: 1,460/1,460 rule labels match; the published bounds never move a value | Not restated this cut |
| Portugal, hsalah Lisboa | Editions 2023, 2026, 2027 | 1,095 | 18 (+0.5) / isha 12 deg + 3 min capped 01:20, interval column maghrib + 77 | Margins move at most 0.09 min across three editions, under the noise floor of the 0.05-min claim; fitted latitude identical to 0.02 deg. Grade A | Not restated this cut |

Notes that matter for the record:

- The Kazakhstan span is 74 years, so its grade-A claim rests on a span rather than a year.
- The Saudi interval switch is month-exact on the API's own boundaries, including a 29-day
  Ramadan in one year and 30 in another.
- The Kyrgyz result corrects the census wording: the record writes the ratio in terms of
  (fajr - sunrise), whose sign is flipped. The magnitude is the rule.
- The Muhammadiyah decade also settles Indonesia's second line: the ministry's 20 degrees and
  the society's 18 degrees are about 8 minutes apart at fajr, a geometry difference no publisher
  can make drift.
- Five of the eight frozen-generation candidates on the sheet (Botswana, Maldives, Sri Lanka,
  Belgium, Niger) stay one-generation; Algeria is the counterexample that proves the test is
  real: recomputation, not reprint (`decisions/DECISIONS.md` D3).

---

## 6. Open decisions for the owner

Everything actionable is in one numbered sheet: `decisions/DECISIONS.md`. It carries 26 numbered
items - 15 new (D1-D15), 7 pre-existing (R1-R7) and 4 architecture calls (A1-A4, with A3 already
decided) - plus 5 dated watches (W1-W5). Reply one line per item. Do not re-derive here; the
sheet states the measurement and a recommendation beside every option.

The three most consequential, for orientation only:

- **A1**, the sub-45-latitude fallback pair, two candidates 0.84 min apart.
- **A4**, the T-42 go.
- **D3**, the frozen-generation ruling, which five surfaces turn on (Botswana, Maldives, Sri
  Lanka, Belgium, Niger against Algeria's recomputation counterexample).

New since the draft, in brief: Fiji's edition choice (D1), Yemen's feed choice with the
13.3/14.2-minute deltas (D2), the frozen-generation calls (D3), Burkina's fajr shift, Morocco's
conditional-A answer now measurable from the ministry's own portal, Nigeria's two-recipe tier,
NZ's Ramadan-start contradiction, and the Kemenag 21/19 rule staying regional. The fit index
adds three arbitrations that need a ruling: the Pakistan chart's anchor, Indonesia's two
national lines, and Niger's grade.

---

## 7. What tonight did NOT resolve

**Year-2 remains the rule's failure mode.** Of the fit index's 59 entries, 31 are single-year,
single-month or short-sample. The spans that hold are named in section 5. Most of the 65
new-surface countries hold one year.

**The US sweep is weaker than its number reads.** 133 of the 204 domains did not resolve at all,
so the finding concerns the guessed domain list, and those metros remain unproven either way.
The 20-metro conclusion stands. The small-metro conclusion does not.

**Two reports were still writing at this cut.** `my2027` has 11 whole-year 2027 tables banked
and no report; `tncities` has its Egypt section settled and its Tunisia three-city results
unwritten. Neither's pending content is counted as settled anywhere above.

**Tajikistan's archive closed mid-session, and its on-disk footprint is thin.** The month
endpoint served three of fourteen probes and then stopped serving history; the integrity pass
notes only 24 month captures on disk against the report's 4,343-day claim, with the fit's scored
span at 743 days. Whether the restriction is permanent is unknown.

**The Philippines cannot be measured across a year.** No January or July rows exist on either
surface, so annual amplitude is unmeasurable, and the BARMM isha verdict is a model choice on 29
solstice days rather than a proof.

**Afghanistan has no independent witness.** Both editions are the same ministry's, four years
apart: a stability result, not corroboration.

**Five countries closed by force rather than by absence.** Iran (challenge), Libya (challenge),
Sudan (domain expired), Syria and Palestine (walls and dead hosts). Their recorded states stand
without new evidence.

**Switzerland's IZRS calendar is still gated**, and the Geneva foundation's Feb-2025 poster is
internally inconsistent (mornings -49, evenings +40). The archive rows are the only clean Swiss
witness.

**Lebanon's feed is undated and its year is inferred.** Five regional tables, 366 undated rows
each, year read as 2028. No fit ran and no single coordinate reproduces it.

**Mexico is seven days.** A surface only. The platform's history walk did not reopen.

**Nigeria's line is two months wide.** The first fitted recipe rests on October and November;
there is no year-2, and every institutional body gates its timetable behind Facebook login.

**NZ has a Ramadan month, not a year.** The reborn FIANZ surface is Ramadan-only, its sheets
disagree with the Hilal Committee on the month's start, and no full-year surface exists.

**Fit debt is now the larger queue.** No fit ran on Thailand's nine workbooks, Malaysia's 2027
tables (the state-mufti sweep is banked and awaiting its report), Bahrain's 1448 table,
Turkey, Kuwait, Qatar, Jordan, Yemen (owner choice pending), Lebanon, Fiji (edition choice
first), Morocco's rebuilt portal (a monthly fetch job is needed - the window rolls and December
must be caught), or the Maldives yearless table.

**Morocco's window rolls monthly.** The rebuilt portal serves current and previous month only;
the pre-rebuild era is Wayback-only, and December 2026 was unpublished ten days before month
start. A standing monthly fetch is the only way the surface stays alive.

**The publisher's engine is part of the recipe.** The PrayTimes v2-family engine reproduces the
platform tables at zero margins while adhan reports phantom margins and a seasonal asr skew;
`usmap` dissolved C47's whole plus-or-minus-1 margin layer the same way. A fit that carries
those artefacts over-specifies every recipe it touches.

**Search language coverage was uneven.** The 20 English towns were searched in English only, and
the waves that searched locally found the negatives they report. Any country marked NEGATIVE
without a local-language line in its report should be read as a weaker negative.

**Two integrity findings stand unrepaired.** `centralasia` serves 2,417 keys against 2,478
declared (minus 2.5 pc), and two captures are zero-byte (`nordics2`, `ukscotland`). Read
`integrity/INTEGRITY.md` before trusting any per-workspace row total.

**One structural caution for the schema.** Tonight added three defect classes to the stale 2020
install already on record: a single-month DST block, a whole-DST-window shift with sunrise
exempt, and San Antonio's per-column transition rows. A feed is not evidence until it is gated
against its own live page, and Toledo shows the page can be a faithful render of a broken feed.
