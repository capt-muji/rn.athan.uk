# Round summary: O1m worldwide prayer-times census, round three, 2026-11-11

Written by O1m-38 in the round's close window, against the 44 returned CONSOLIDATION blocks, the
reports on disk, `FIT-INDEX-ROUND3`, `CORRECTIONS-ROUND3`, `DECISIONS-ADDENDUM-ROUND3` and the
counters beside this file. This is the definitive read of round three: what the fleet found, what it
measured, and what it left open.

Two bases govern every number below, and each table row names which one it uses:

- **Script count at this cut.** `count.mjs`, `files.mjs`, `archive.mjs`, `fitcount.mjs`,
  `blockcount.mjs` and `waves.sh` in this directory, each reading the round's own trees and files.
  The cut is the state of disk when the last counter ran; the round was still writing, so every
  scripted number carries the cut and moves up if re-run (section 1 states the growth seen while
  this document was written).
- **The round's own registers.** `CORRECTIONS-ROUND3.md` (counted tables A to D plus the flagged
  list), `FIT-INDEX-ROUND3.json` (154 entries, its own `counts` object), and the decision sheet's
  own counted table. These are quoted, never re-derived.

`o1m-34-wtdiff3` had not landed at this cut, so no after-state class table exists in this document.
Section 1 states the pre-round record class and the round's production side by side, and names the
one artifact that will close the arithmetic.

---

## 1. The numbers

| Metric | Count | Basis |
| --- | --- | --- |
| Agents dispatched | **57 distinct tags** | Union of the 52 `O1m-` rows in `QUEUE.md` and the 47 distinct ids in `monitor.log`. The union adds five the queue table does not carry: O1m-4, O1m-6 and O1m-7, the cancelled originals continued as `-4r`, `-6r` and `-7r`, and O1m-40 and O1m-41, dispatched after the table's last edit |
| Queue rows and status | **52 rows: 41 RETURNED, 1 RETURNED partial, 10 DISPATCHED** | `QUEUE.md` status column, `waves.sh` |
| Fleet size | **10 concurrent** | `BRIEF.md`; `monitor.log` heartbeats report `active(30min)` 10 at 08:08Z and 15 to 16 in the closing hours as respawns overlapped |
| Heartbeats logged | **927 lines, 08:03:39Z to the close** | `wc -l monitor.log` |
| Workspace directories | **55** | `ls -d */`, this summary included |
| Blocks returned | **44** | `grep -c '^## ' CONSOLIDATION.md` |
| Reports on disk | **48** | `ls */REPORT.md` |
| Workspaces carrying data | **45 of 54** | `count.mjs` |
| Normalized data files | **21,877** | `count.mjs` |
| Dated rows, raw | **13,340,267** | `count.mjs`: one row is one surface on one date carrying at least one prayer value, identity path plus date plus values, summed per file |
| Dated rows, de-duplicated | **10,073,002** | Same script: the round-wide union, the same-surface collapse that removes byte-identical re-captures and nothing else |
| Dated keys summed per file | **7,630,773** | Same script, the o1l method as written in the brief. It undercounts a file holding many settlement tables (a 75-country tawkit file gives 365 keys, not 3.18M rows), which is why the row count is the headline |
| Data files holding dated keys | **21,345 of 21,895** | `files.mjs`, its own walk over a growing tree; 20,693 hold a full year or more |
| Dated span | **2014-11-24 to 2076-12-31** | `count.mjs`, 22,378 distinct date values |
| JSON parse failures in `data/` | **0** | All four data scripts |
| Archive on disk | **10.31 GiB, 133,042 files** | `archive.mjs` |
| Archive, original-equivalent | **46.77 GiB** | `archive.mjs`: 61,674 gzip members carry 36.46 GiB for 3.18 GiB on disk (ratio 12.3); the 71,368 uncompressed files are measured as they lie |
| Compression state at the cut | **9 workspaces compressed, 61,674 members** | `compress.log`, 12:09:10Z to 12:29:12Z |
| New rows for the record | **31** | `CORRECTIONS-ROUND3.md` table B |
| New countries | **5: Nicaragua, Aruba, Greenland, Svalbard, Macau** | Register B1, B3, B4, B5, B10, each absent from `world-table-v3.json`; the register's own summary line counts five. Faroe and North Korea are revivals of closed rows (B6, B11) and Timor-Leste is recorded and explicitly not claimed (B31) |
| FALLBACK rows answered | **32 of 35** | `o1m-37-decisions/data/fallback-lift.txt`: `fallback_rows 35`, `with_a_dated_surface 32`, `still_without 3` (Cyprus south, Western Sahara, French Polynesia). One ruling settles a 33rd if French Polynesia rides the o1l O2 clause |
| Capitals covered | **198 of 202 at the start; 7 of 49 platform-only capitals upgraded; 3 gaps closed as honest negatives** | The start figure is the brief's; the moves are `o1m-2-capitals/REPORT.md`. No capital crossed from gap to covered, so the count stands |
| Fitted surfaces in the round's index | **154 entries across 87 countries**, plus 15 multi-country family entries | `FIT-INDEX-ROUND3.json`, `counts` |
| Grades | **A 31, provisional 85, candidate 25, community 11, measured 2** | Same, `counts.grades` |
| Tiers | **community 69, platform 43, authority 39, matrix 2, mixed 1** | `fitcount.mjs` over the entries |
| Span verdicts | **yes 33, no 7, frozen-reprint 5, untestable 80 single-year, 21 short sample, 8 single template** | `counts.spans` |
| Fit artifacts on disk | **50 fit JSON, 100 fit scripts** | `find` over `*/data` and the workspaces |
| Corrections to the record | **82** | `CORRECTIONS-ROUND3.md` table A |
| Grade and span movements | **75** | Register table C |
| New rule-forms | **39, numbered D1 to D39** | Register table D |
| Items flagged, not adjudicated | **22, numbered F1 to F22** | Register flagged list |
| Conflict notes and flags in the fit index | **103 conflicts in 82 entries, 14 flag items in 11 entries** | `fitcount.mjs` over the entries |
| Owner questions opened | **16: 4 decided, 2 owner, 10 conservative** | `DECISIONS-ADDENDUM-ROUND3.md` section 2 |
| Countries in the engine-consensus matrix | **232, of which 184 comparable** | `o1m-26`; classes 3 one convention, 107 margin dispute, 74 convention dispute, 18 not comparable, 30 single |
| `.pdf` files classified by byte magic | **1,212: 1,135 real PDFs, 9 deliberate HTML captures, 68 error bodies** | `o1m-37-decisions/data/pdf-class2.txt`: the 68 are 55 FAIL_404, 4 bot block, 4 denied, 4 not found, 1 challenge; the decision block confirms 68 across 12 workspaces |
| Row totals the blocks quote themselves | **6,420,475 across 17 blocks** | `blockcount.mjs`; a floor, because 27 blocks quote no aggregate |

The archive measured 46.77 GiB original-equivalent against the owner's 100 GB soft cap, and 10.31 GiB
on disk after the compression pass. The compression log's own free-space trace runs 14 GiB to 76 GiB,
a 62 GiB release, which is larger than the 36.46 GiB the gzip members account for. The disk
measurement in `archive.mjs` is the one this document uses; the difference is not explained by the
compressed captures alone.

The counters moved while this document was written: dated rows went 12,841,567 to 13,340,267, blocks
39 to 44 and workspace directories 52 to 55 across the drafting window, and five waves opened after
the first cut. Every figure above is the last run, and each is one command from a re-cut.

### The class shift

`world-table-v3.json` (repo `ai/features/global-prayer-times/data/census/`) carries 174 rows:
A 17, provisional 40, candidate 65, community 15, F 2, FALLBACK 35. It is the pre-round record and
the round applied nothing to it.

The round's production side is the fit index: 154 entries, A 31, provisional 85, candidate 25,
community 11, measured 2. The two figures are not a before and after, because the index indexes what
the round fitted and the world table holds one row per country.

The bridge is the corrections register: **31 new rows** and **75 grade or span movements**, with the
FALLBACK arithmetic at 32 of 35 answered. `o1m-34-wtdiff3` owns the collapse into one class table,
and it had not landed at this cut. Until it does, the two counts stand beside each other and this
document names no after-state total.

FALLBACK falls from 35 to 3 on the presence test, which is the round's largest single movement. The
register is explicit that the test is presence, not quality: 22 of the 32 lifted rows hold a
turktakvim table, and a row with one dated month is `candidate`.

---

## 2. Country by country

Labels: **NEW** a dated surface the record did not list. **LIFTED** a FALLBACK row now answered by
dated data. **CORRECTED** a record reading overturned or re-measured. **REFUTED** a premise the round
disproved. **CONFIRMED** re-measured and held. **NEGATIVE** searched, nothing found, with the
languages named in the block. Tier words are the fit index's own (authority, platform, community)
and no grade below is invented.

### British Isles and Europe

| Country | What moved |
| --- | --- |
| United Kingdom | 18 surfaces, 6,630 rows, 269 artifacts (o1m-12). Twelve are full years: Jersey Islamic Centre 334d 17.9/15.1, Aberdeen AMIC 366d, Newport Diyanet 366d, Lancaster 15/15, Leeds IC 18/15, Halifax and Burnley 18/18, Preston isha 15 with the maghrib+60 cap, Swansea 14.7/14.0 with fajr flagged. Scotland's interval question answered from AMIC's own print: 18/15 all winter with a night fraction late April to early August, isha 47-50 min in June (rule-form UK-SCOTLAND-NIGHT). CORRECTED: Milton Keynes and Swansea are one construction offset by 3.2 deg longitude (GB-UK-ONE-CONSTRUCTION). Traps named: lcic.org.uk is London Colney, go2masjid's Stoke is Bradley Stoke |
| United Kingdom, LUPT | The home surface's last unknown closed (o1m-35) and then banked whole (o1m-43). asr margin +0 through 2026-12-31 and **+2 from 2027-01-01 to 2076-12-31 on both mithl columns**, 18,263 days at exactly +2, zero deviations, and the publisher states it on its own technical page (LUPT-ASR-2027). CORRECTED on the structure: the fifty workbooks are ONE GENERATION RECOMPUTED PER YEAR, not one table reprinted, since same-MM-DD rows move between consecutive years on 14,383 of 17,690 compared rows and track the core at r 0.998. CORRECTED twice on adopters: Middlesbrough is not LUPT-exact in absolute time, West London Islamic Centre prints the 2-mithl column on 51 live rows. 14 of 16 London-area surfaces printed the no-allowance convention in 2026, so the +2 is a move away from the local norm, not a correction. Wayback holds zero captures of the domain |
| Ireland | Year-2 closed at the surface: the IFI `?year=2027` payload is sha-equal to 2026 (o1m-R5) |
| France | REFUTED and rebuilt (o1m-21): nineteen of twenty surfaces carry a frozen angle pair, not a seasonal sweep (Toulouse 14.93/14.90, Bordeaux 12.67/12.45, Lyon 14.42/14.45), median fajr MAE 0.67 min, median 311/366 within-1. Strasbourg is the one real sweep: 18.00/16.00 exact 257 of 365, then a 108-day block from 28 April to 13 August sweeping to 11.3/10.4. Montpellier is an interval, isha = maghrib+80 on 366/366 (FR-MONTPELLIER-80). The night-portion form refuted by sign. 13 new mosque-years, 7,348 rows over 20 surfaces |
| Spain, Portugal, Italy, Greece, Poland | Portugal is the find (o1m-15): 13 cities from the Comunidade Islamica's twelve-page annual sheet, including Faro, Funchal and Ponta Delgada on Atlantic/Azores, one recipe 18/12+3 with temkin dhuhr +6 and maghrib +4, 96.6-99.95 pc within-1, authority tier and A-eligible on its second cycle. Spain gained Malaga and confirmed three lines (15/15, 18/17, 12/12), with Ceuta a negative and a trap (a tenant named for Ceuta sits 260 km inside Murcia), Las Palmas broken. Poland's sixteen Ramadan PDFs measure 18.16/17.15 in every city at 100 pc, 11 of 30 days past the solar gate. Greece's Athens state mosque fits 16.95/16.65 at 100 pc |
| Romania and the Diyanet-abroad block | LIFTED (o1m-7r): 53 Diyanet-abroad localities, 19,345 rows for 2026, four mawaqit tenants, a Turkish imsakiye for Constanta, authority tier. The isha split in one year: fajr 18.00 in all sixteen countries with isha at 16 degrees in Romania, Serbia, Croatia, Bosnia, Italy, Poland, Belgium and the Netherlands, and at 17 in Albania, Spain, Greece, Montenegro, North Macedonia, Portugal and Kosovo, never blended |
| Norway, Sweden, Denmark, Finland, Iceland, Faroe, Greenland, Svalbard | The polar rule is five distinct publisher behaviours, each with trigger days (o1m-8, POLAR-5): half-night plateau 0.498-0.500 (tawkit), one-third split (islam.nu), silent omission (tawkit Norway drops 118 days at Tromso), a synthetic solar row (Diyanet Svalbard), quarter-night (Reykjavik). Norway: 89 place slugs, 88 PDFs, 32,120 rows, 83 places new, Koperivik serving a genuine 2025 (o1m-R5). The Norway rule itself identified and scored: fajr = min(P, sunrise-60) inside a date gate, 138/138 and 131/131 rule days exact (o1m-R1r, NO-GATE-60), with the asr school switching on the DST dates (NORWEGIAN-ASR-SWITCH). Sweden gains 13 towns on islam.nu with the one-third form (SE-ISLAMNU-13) beside the continuous portion (SE-PORTION). NEW: Greenland (Nuuk) and Svalbard (Longyearbyen), both defective in measured ways; Faroe leaves the negative list on a 0.17 min median gate; Iceland gains a second Reykjavik line and a 2027 page. Finland's Rovaniemi and Oulu: PSIY identified, dated table outstanding |
| Czechia and Cyprus north | CORRECTED (o1m-R4). Czechia: 13,896 month pages, 191 towns x 2019-2024 = 418,672 town-days plus Praha/Brno 2025-2030, 0 mismatches against every page's own header, fit 12.11/11.95 with a 2-4 min seasonal term and no drift across six years (CZ-SEASONAL-TERM). Defects: Revnice prints latitude 449.92 and 00:00 on five columns, Kladno computed at 51.50N. Cyprus north: two engine generations in an A-B-A-B pattern, B +2.4 min later on every column (CY-ABAB), the archive floor 2022-10-22 |
| Tatarstan, Russia's republics and Ufa | CORRECTED (o1m-R4, o1m-R8). Tatarstan 2020-2024 structurally not served, Wayback 2017 gives 23 of 44 settlements at 18/15, and Kazan's 2020-2022 editions freeze the recipe at a uniform -1.0 min (TATARSTAN-UNIFORM-M1). Ufa's missing year found: seven live almanac sets 1439-1448, six editions fitted, fajr = sunrise-100 and isha = maghrib+90 exact in every one, the ten-day asr shift 1448 only |
| Russia | CDUM walked backward (o1m-R8): 757 snapshots inventoried, 177 captured, 171 city-years, 60,060 dated rows, 21 cities, 2015-2026, 2018 absent at every URL. Four dated rule forms measured, not read (CDUM-4-FORMS). The -68 min sunrise defect is the Surgut page carrying Salekhard's times, dated to the 2023 edition. DUM RF: two live months plus sixteen archived prints with OCR text |
| Baltics, Benelux, Central Europe | Held or confirmed. Belgium's table clock is fixed standard time with the summer offset the client's job (BE-PORTION, Charleroi dhuhr 769 then 768 across 23-29 March). Iceland's isha move sits flagged, not pooled (F14) |

### Middle East and North Africa

| Country | What moved |
| --- | --- |
| Iran | MEASURED TWICE from nothing (o1m-6r): pishkhanak 880 pages, 44 cities, 26,884 rows across two Jalali years, one recipe fajr 17.70, isha 14.00, maghrib at the sun's 4.5-degree depression, 100 pc within-1 at 29 of 38 cities. The depression is load-bearing: a fixed sunrise offset reproduces 64.3 pc (IR-DEPRESSION-4.5). Tawkit's Iran layer runs a different convention and is recorded, never merged |
| Yemen | The walk was data (o1m-6r): 216 captures parsed to 2,190 rows, 365 days across six ministry governorate feeds at 100 pc, per-governorate angles 15.4 to 18.0. The selector carries Aden, Lahj, Mukalla, Seiyun, Marib and Mahra only; Sanaa, Taiz, Hodeidah, Ibb and Dhamar are absent from the authority surface |
| Saudi Arabia | 116 new points across five thin regions at 1449+1450, 82,128 city-days, zero harvest failures (o1m-27); the grid stands at 225 points and 159,300 city-days, one recipe, within-1 99.7-100, Ramadan exactly 90/120 with zero violations in 232 point-years. CONFIRMED, and the +120 interval is reproduced by masjidi alone (F3) |
| Oman | The 86 unnamed CityIDs now have Arabic names from calendar_page4.asp, row order equal to CityID order, verified to the minute on Muscat and Ibra; 77 geocoded (o1m-27, B21). Per-area fit median 94.1 pc, but a national-recipe pass at the same points drops to 22.1 pc: RULE AND POINT NOT SEPARABLE (F17) |
| Qatar | The wave's largest return (o1m-27): the ministry does not ignore date parameters, its gateway answers per day, and 2024 to 2027 walked in full, 1,461 rows, no gaps. One frozen recipe across four years, isha exactly maghrib+90 on every row, within-1 100 pc, MAE 0.214. Exactness climbs 66.6/75.1/84.9/87.9 pc while every parameter holds, recorded open (QA-EXACTNESS-CLIMB, F18) |
| Bahrain | The authority publishes its method, not a table: the Al Zubarah almanac, isha on twilight with a stated 74-minute floor reached on 21 March and 22 September, computed at two sites (BH-FLOOR74). No dated authority table found, every dead host named, and the masjidbox Manama year fails the floor at 73 and 72 min |
| Kuwait | One row and no governorate axis, better founded: the ministry has no prayer page, and awgatalsalat names Dr Saleh Al-Ojeiri's calendar, whose 2026-11-11 row matches the held year in all six columns. New defect: alojeiri.com?date= relabels to today |
| Iraq, Jordan, Syria, Lebanon, Palestine, Libya | Nine fronts banked (o1m-6r, o1m-24). Iraq 145 cities, the Diwan endpoint alive and axis-free (IQ-TWO-LINES). Jordan 142 tables, two regional families, and Wayback gives 300 dated authority rows 2021-2026 across the October 2022 clock change with no parameter move. Syria 287 tables, and its isha is an interval, maghrib+90 on all 4,380 rows of both editions, which frees 91.2-98.8 pc. Lebanon now dated: al-Manar seven cities, 147 PDFs, 3,662 rows parsed, two years, one recipe (B20). Palestine 25 cities at 18/18 with maghrib +5 to +7, 99.4-100 pc, corroborating the Awqaf offset rule (PS-AWQAF-OFFSET). Libya 64 tables and no year-2 (the named app's domain is a design agency) |

### Sub-Saharan Africa

| Country | What moved |
| --- | --- |
| The continent, platform tier | turktakvim's three-level gazetteer enumerates **8,565 African settlements across 50 countries**; every annual table harvested, 3,126,225 dated rows, gate passed at 90 cities with zero diffs on all six (o1m-4r). One template (TT-AFRICA-TEMPLATE), 138 cities fitted across 49 countries, 95 perfect. salaahtimes became the cleanest dataset: 112 towns with 2026 and 2027 both, 224 town-years fitted, angle drift 0.00 (SALAAHTIMES-TWO-YEARS). tawkit's race repaired to 571 cities fitted and its two isha conventions exposed (TAWKIT-ISHA-SPLIT, F4) |
| Egypt | Four years on one recipe (o1m-R3r, o1m-14): 17 cities, 149,022 cells, 83.33 pc exact and 100 pc within-1 in 2024, 2025, 2026 and 2027, dhuhr exactly +1 every day. 563 of 578 posters captured after the Wayback `id_` fix. A new authority door: esa.gov.eg/emsakya, one PDF per Hijri year, one page per city, 245 city-months, 58,080 cells, 99.12-100 pc at the recovered point (B25). Ramadan split settled against the announcing body; 2022-2023 closed by three independent probes |
| Algeria | The 1448 ministry book from Wayback, eight months transcribed, 219 verified days, one recipe with the isha 17.00/0 ceil confirmed on a second Hijri year at 194/219 exact against 102/219 for the frozen pair (DZ-ISHA17-CEIL). Graded A with the deficit stated |
| Tunisia | CORRECTED twice (o1m-30). 2027 closed and December 2026 serves, 1,102 rows. The Kairouan/Sidi Bouzid branch is not a dip window: 20 of 22 delegations moved from 18.25-18.70 to exactly 18.00/18.00 between 2025-12-16 and 2026-01-10 and held, horizon columns untouched (TN-NORM2026) |
| Morocco | The pre-rebuild span REFUTED: Wayback holds no 2024 or 2025 month and the old Hijri endpoint's 17 captures serve one static 2012 table. December still 404, no 2027 at six paths, the decree holds, and the discriminating October 2026 month passed with no 2027 anywhere (F16) |
| Nigeria, Ghana, Cote d'Ivoire, Senegal, Burkina Faso, Mali | Year-2 route closed at the platform and open at the councils (o1m-18). mawaqit's year parameter is a relabel on 25 of 25 surfaces with no exception (F7). COSIM prints three editions including a 2014 sheet from Wayback, one family with measured drift. CERFI's 34 weekly sheets carry interval columns, fajr = sunrise-60 and isha = maghrib+60, 1,140 of 1,190 cells within-1 across two Gregorian years. MSBF's 1442 print blocks asr and isha in five-minute values, doctrine printed and reproduced five years later. Nigeria's Egyptian line CONFIRMED as a platform parameter at national scale: tawkit carries 19.39/17.62 across 202 cities |
| Tanzania, Uganda, Kenya, DR Congo, Ethiopia | Dar es Salaam new with two independent witnesses on one recipe, 2,136 and 2,109 of 2,190 (o1m-18). Kampala carries 17.90/17.35 against Entebbe's 15/15, so Uganda holds two lines. Bamako a mosaic of seven surfaces. Negatives with languages: BAKWATA none on any route, GSIC Facebook-walled |
| The fallback eleven | LIFTED on the turktakvim gazetteer: 2,391 annual tables, 872,715 rows, one engine fitted at 54 cities in ten countries (o1m-1). Liberia 1,981 villages and 723,065 rows, PNG 116 tables and 42,340 rows, Kiribati and Vanuatu dated. Nepal found at authority tier: the Darul Ifta twelve-month Kathmandu cycle, 366 rows, 19.10/18.31 resolving as MWL 18/17 plus a 1.1-degree dip at 1,400 m (B12). Samoa's gazetteer is genuinely empty with a verified cause. The second-witness wave (o1m-13) closed the tenant layer for all ten countries and reproduced Diyanet's 150-row default mechanism |
| Madagascar, Comoros, Rwanda, Burundi, CAR, Chad, Gabon, Congo, Equatorial Guinea | Dated surfaces from the continent sweep, each at platform tier; the block names the row counts and the traps (Mahajanga published at 0,0 by salaahtimes, Serowe a hand-set board) |

### Asia, Russia and the Caucasus

| Country | What moved |
| --- | --- |
| India | Three waves and a measured mosaic. The Islamic Academy's 70-city perpetual Hanafi layer, one recipe fajr 18.0, isha 18.15, 98.3 pc, covering Lucknow, Kanpur, Nagpur, Patna and Delhi among others (o1m-17); 11 new masjidbox tenants taking the city count from 8 to 13, seven of them at 18/17 with zero margins on 365/365 (o1m-5); then 23 mosque-tier cities at A on two recomputed years with Lucknow lifted at 18/18 Hanafi 365/365 (o1m-17); then the Excel layer built from nothing with a standard-library BIFF8 reader, 96 workbooks, 95 fitted, 42 cities beyond the PDF layer (o1m-23); 34 tenant-years of 2027 as a genuine third recomputation, 26 tenants now A at three years. THE ISHA-17 LINE IS A TIER LINE: publisher tier 0 of 165 at 17 degrees, mosque tier 43 at 2026 and 25 of 34 at 2027, and the 17-degree reading sits 4.2-5.1 min earlier with a 0.978 latitude correlation (IN-ISHA-17). Waqf boards: no daily table from any that answered |
| Pakistan | The chart family decoded (o1m-28): the 14 px limit was a reader limit, not a capture limit, and a glyph-cluster decoder labelled from the chart's own day column banked 25 cities, 9,120 chart-days, 63,227 cells at 0.96 pc named gaps, with O1l-12's hand-read Rawalpindi January matching 217 of 217 cells. One pair 18.0/18.0 Hanafi with one margin template and three variants (PK-18-18-TEMPLATE). CORRECTED: the federal 13:00/13:15 dhuhr clock matches 0 of 365 days in all 26 charts; the four "absent" cities exist on a directory earlier waves never enumerated. tawkit's 453-city layer reads 18/18 Hanafi at 99.5 pc (o1m-3). The unified 2026 calendar remains unpublished |
| Malaysia | 2027 MET IN FULL and the round's premise OVERTURNED (o1m-16): 59 zones, 21,535 rows, no gaps, gated against the Jawi/Putrajaya authority PDF 365/365 and Perak's own 2027 PDFs. The subuh move is a publisher split, not national: across 56 comparable zones the JAKIM line did not move, and the -1.3 min belongs to Jawi and Selangor, whose point moved about 0.3 deg south with the pair frozen (A11). Per-zone rules: Kelantan isha 17 confirmed, Pahang a horizon term on the two solar columns, KDH07 unfitted on any pair (F10) |
| Indonesia | Closed at both publishers (o1m-5): SIHAT 209 units for 2026, 76,285 rows, four columns 100 pc; KHGT all 516 second-level units for 2026 and 2027, 376,680 rows, one recipe at every unit, the maghrib pad climbing 2 to 8 min with elevation at r 0.959 (KHGT-DIP-0.032). Both publishers apply a 1.76 sqrt(h) arcmin dip from different elevation fields (SIHAT-DIP-1.76). KHGT's subuh sits 8 min earlier than SIHAT across all 209 common units. myquran serves 2028 whole on the community tail |
| Singapore, Brunei, Thailand, Philippines, Sri Lanka | Singapore 2027 at A: four MUIS years 2024-2027 on one 20/18 ceiling recipe, fajr and isha within-1 every day (o1m-16). Brunei 2027 not met, Thailand's 2570 not met (77 workbook hashes identical), the Philippines not met at authority tier. Sri Lanka at zone depth: all 13 ACJU zones, 12 of 13 reproducing all six columns within 1, Mannar solving offshore and flagged (F22) |
| China, Japan, Korea, Taiwan, Hong Kong, Macau, Mongolia | The Diyanet tree already held East Asia unparsed: 489 city pages, 178,485 rows, China 222 cities, Japan 143, Mongolia 67, Korea 40, Taiwan 10, Hong Kong 5, Macau 1, North Korea 1 (o1m-11). China 18/16 (F1), Mongolia summer clamp at -11.2 deg at printed fajr, flagged not modelled. Nagoya's own full-year PDF a new authority surface at 18/17. Hong Kong reaches 2028 across five years. Taiwan's first dated year from the tree. Clock defects re-verified: Urumqi, Turpan, Dunhuang and Lhasa print 118.8-120.1 min early |
| Kazakhstan, Kyrgyzstan, Uzbekistan, Tajikistan, Turkmenistan | Kazakhstan 96 settlements gated three ways with zero disagreements across 247,506 cells, 2025-2045 including leap 2028, one recipe at 100 pc within-1 on all six and the 48N switch settled at exactly 48.000000, latitude-only, zero date term in 9,861 line days (KZ-48-EXACT). Kyrgyzstan 3 to 20 cities and the endpoint proven year-blind (KG-YEAR-BLIND), the ratio rule a ridge rather than a point (KG-RATIO-RIDGE). Uzbekistan's recipe out of the publisher's own bundle at zero margin with differ_minute proven unused (UZ-ZERO-MARGIN). Tajikistan's archive tail served to 2014-12 with the dhuhr regime change on exactly 2019-07-01. Turkmenistan LIFTED on platform tier, six cities, 97.9-99.5 pc |
| Georgia, Armenia, Azerbaijan, Afghanistan, Mongolia | Georgia closes with six cities and the Juma Mosque board on the state directorate's own generation. Azerbaijan's per-city route confirmed at zero margins on every column (B30). Armenia's Yerevan Blue Mosque own table a negative in three languages. Afghanistan's Kabul gains a second witness plus seven cities at 18/18 with a 0.80 min maximum residual |

### The Americas

| Country | What moved |
| --- | --- |
| United States | The last four metros, three proven (o1m-R6): Salt Lake City 14.9/14.9, Oklahoma City 17.9/16.9, Norfolk 15/15 over six years, all 100 pc within-1 on six columns, with Tallahassee a documented negative. Newark re-banked after the fitter repair: 3 years, 1,096 rows, geo rms 26.657 to 0.849 (o1m-R2). The fitter certificate cleared by re-run, not assertion: 39 US fits twice and 54 masjidal tenant-years reproduced field for field (F11) |
| Canada | 21 tenants x 6 years, 46,011 athan and 48,202 iqamah rows (o1m-R6). Alberta is 18/17 in 7 of 9 tenants and Ontario 15/15 in 6 of 7 across all six years; six Alberta tenants carry a +60 block from 2026-11-01 only, the 2026 edition missing the fall-back; one Calgary tenant printed on a UTC+3 clock for 22 months |
| Chile, Argentina, Peru, Brazil, Colombia, Bolivia, Venezuela, Ecuador, Uruguay, Paraguay | 4,075 cities, 1,486,211 rows, 8,917,266 cells at 99.93 pc within-1, one publisher-uniform recipe, eight of ten countries complete at platform tier (o1m-22). Chile's archived sheets: 327 enumerated, 295 banked, 4,832 dated rows, the +6 offset proven back to March 2018 (o1m-R6). CORRECTED: Santa Cruz was a parser column offset and re-parses at 92.3-95.9 pc; La Paz reclassified because its install serves Santa Cruz's table 15 deg away; Maracaibo decided on the sky, the sheet governing |
| Central America and the Caribbean | Nicaragua NEW (Managua mawaqit, 365 rows, all six within-1, provisional, B1). Panama three tenants, 1,095 rows. Trinidad's Princes Town at 15/15 with zero margins on every column. Suriname LIFTED at calculator tier (B2). Aruba NEW (Oranjestad 14.8/14.8 Shafi, 100 pc, B3). The Chaguanas defect measured to its mechanism: the settings blob reads country TT with timezone America/New_York, so the platform computes correct Trinidad events and renders them 60 min early November to early March, correct by accident from March to November; the fix is one timezone field and nothing in the recipe moves (TT-CHAGUANAS-ONE-LINE, F5) |

### Oceania

| Country | What moved |
| --- | --- |
| Australia | 55 mosque surfaces beside the 218 grid points (o1m-9): 29 masjidbox, 23 mawaqit, 3 masjidal at three years, with Gold Coast and Shepparton reproducing 1,096 of 1,096 within-1 at 18/17 across 2024-2026. The layer is thinner than its row count: 30 of 43 masjidbox and 5 of 25 mawaqit surfaces publish jama'ah boards, not athan tables |
| New Zealand and Fiji | The year-round buy met: 16 dated year surfaces where only Ramadan sheets existed, with fianz.com re-confirmed to link nothing else (o1m-9). Fiji's 2026 year captured whole from the league's widget, 365 rows at 365/365, and 1,456 of 1,460 cells identical to the held edition |
| The Pacific states | The authority layer: namazvakitleri.diyanet serves a 365-row yearly table for 20 cities in nine countries, one request each, and 18 of 20 fit one recipe at fajr 18 / isha 17 with zero twilight margins, 365/365 within-1 (o1m-9). Samoa, Tonga, Guam, Palau, Niue, Vanuatu, New Caledonia and nine PNG towns now hold dated rows, 7,300 rows, Samoa at authority tier (B13). Kiribati holds a community Ramadan sheet with five of six columns fixed clocks (B14) |

---

## 3. The standing questions

### 3.1 The totals and the class counts

The round's own registers answer the counts in four places, and they disagree by design, so each is
named with what it counts.

| Count | Figure | What it counts |
| --- | --- | --- |
| Record rows before the round | 174 | `world-table-v3.json`: A 17, provisional 40, candidate 65, community 15, F 2, FALLBACK 35 |
| Fitted surfaces in the round's index | 154 | `FIT-INDEX-ROUND3.json`: A 31, provisional 85, candidate 25, community 11, measured 2 |
| New rows proposed | 31 | Register B, countries and first dated rows |
| Movements | 75 | Register C, grade and span |
| FALLBACK answered | 32 of 35 | `fallback-lift.txt`, a presence test, not a grade |
| Corrections | 82 | Register A |
| Rule-forms | 39 | Register D |
| Flags | 22 | Register flagged list, F1 to F22 |
| Dated rows on disk | 13,340,267 raw, 10,073,002 after collapse | `count.mjs` |

The largest single figure is the row count, and its composition matters more than its size. Four
workspaces carry 70 pc of it: turktakvim's Africa sweep at 3,420,020 rows (o1m-4r), the platform
census at 3,188,768 of which tawkit is 3,177,878 (o1m-3), the South American platform pass at
1,487,602 (o1m-22) and the European pass at 1,238,113 (o1m-7r). Three are platform tier. The fourth
is Diyanet abroad, which its own block grades authority and the decision sheet leaves open as D2, the
tier question reserved to the owner. tawkit's rows are generator-derived and counted separately: the
decision sheet confirms them archive-only (D1), because the rows carry no information the parameter
table does not. The same-surface collapse removes a quarter of the raw count, and it removes most where
a published table repeats across neighbouring settlements: Africa falls from 3,420,020 to 2,119,953,
South America from 1,487,602 to 1,233,937 and Europe from 1,238,113 to 620,183, while the platform
census barely moves at 3,188,768 to 3,188,523.

### 3.2 Recipe longevity per class

The round's answer to "does the recipe still hold" is the fit index's span verdicts, applied to every
entry it carries:

| Verdict | Entries | What it proves |
| --- | --- | --- |
| yes | **33** | The span was tested and the one recipe held across it |
| no | **7** | The span was tested and the recipe does not travel |
| frozen-reprint | **5** | Byte-identical or perpetual editions: more nominal years buy nothing |
| untestable, single year | **80** | One published cycle, the majority of the record |
| untestable, short sample | **21** | A month, a Ramadan block or a handful of days |
| untestable, single template | **8** | One construction printed for many places, so the places are not years |

The round's longest proven spans, each with the wave that proved it: LUPT to 2076-12-31, fifty live
workbooks re-fetched 50 of 50, 18,263 days at exactly +2 on both asr columns with every column's
per-year mean margin inside a 0.06 min band and one generation recomputed per year (o1m-35, o1m-43);
Kazakhstan to 2045 and 2050 with 122 live gates over 2020-2050 and 301 city-years re-derived at zero
differing cells (o1m-25, o1m-R3r); Saudi Arabia at 1449 and 1450 with the grid at 225 points (o1m-27);
Qatar 2024 to 2027 on one frozen recipe (o1m-27); Malaysia 2027 in full at 59 zones (o1m-16);
Singapore 2024 to 2027 (o1m-16); Hong Kong to 2028 (o1m-11); Gibraltar to 2028-12-31 with 29 February
present and no clamping (o1m-R5); Indonesia to 2030 on the community tail (o1m-16).

The counterweight is the untestable 109, and the class is the honest answer for most of the world:
one published cycle, no second door. The round's own year-2 verdict for the platform route is that
the door is shut: mawaqit relabels on 25 of 25 surfaces (F7), masjidbox's date and year parameters
return a byte-identical seven-day list (o1m-19), and Diyanet's year parameters are ignored (o1m-7r).

### 3.3 The drift register, this round's entries

Every change the round found is dated, and a span that crosses one must be split there.

| Date | Object | What changed | Wave |
| --- | --- | --- | --- |
| 2019-07-01 | Tajikistan | dhuhr moves, measured as a 20-minute step, 31.6 to 11.4 against adhan | o1m-10 |
| 2020 | Russia, CDUM | a Shafi-asr edition: 18 of 19 city-years solve Shafi, Hanafi 3-6 pc | o1m-R8 |
| 2021 | Russia, CDUM | a fixed-interval edition: fajr sunrise-120, isha maghrib+90, dhuhr fixed per city | o1m-R8 |
| 2022-2026 | Russia, CDUM | back to 18/17 Hanafi at 83-87 pc fajr and 94 pc isha within-1 | o1m-R8 |
| 2022-10-22 (floor) | Cyprus north | two engine generations in an A-B-A-B pattern, B +2.4 min later on every column | o1m-R4 |
| before 2025 | Tatarstan | the directional rounding pass is absent: Kazan's 2020-2022 editions frozen at a uniform -1.0 min | o1m-R4 |
| 2023 edition | Russia, Surgut | the page carries Salekhard's times: the -68 min sunrise defect dated (2022-01-01 sunrise 09:19 against 11:14 in 2026) | o1m-R8 |
| 2025-12-16 to 2026-01-10 | Tunisia | 20 of 22 delegations move from 18.25-18.70 to exactly 18.00/18.00 and hold through December 2026, horizon columns untouched | o1m-30 |
| 2026-11-01 | Canada, Alberta | six tenants carry a +60 block from this date only: the 2026 edition missed the fall-back | o1m-R6 |
| 2027-01-01 | LUPT, London | asr moves from +0 to +2 on both mithl columns and holds to 2076-12-31, a +2 step where the trend is +1 | o1m-35 |
| 1448 edition | Russia, Ufa | the ten-day asr shift appears in 1448 only; six editions fitted | o1m-R8 |
| 1447 to 1448 | Algeria | the isha pair re-parameterises to 17.00/0 ceil, confirmed on a second Hijri year | o1m-30 |

Two of these are the round's own discovery and both would have poisoned a naive extrapolation: Russia's
2021 fixed-interval year, found only by walking the Wayback snapshots and fitting each year separately,
and Tunisia's angle normalisation, found only by reading per-delegation columns rather than the
national pair. A third, the LUPT asr break, sat in a fifty-year archive outside the census tree and
was found by the block that went looking for it.

At century scale the answer is still no drift, and the round added two confirmations: Kazakhstan's
630,768 re-derived cells with zero differing (o1m-R3r), and Czechia's six years with a seasonal term
and no drift (o1m-R4). At publisher scale, drift remains a property of the engine: the
engine-consensus matrix shows fajr angles landing within 1 degree in 163 of 184 countries while
sunrise differs by more than 4 minutes in 178, which is one publisher's ladder, not the sun.

### 3.4 Algorithm against timetable

The round's addition is the engine-consensus matrix (o1m-26): 232 countries, 184 comparable, five
publisher families, and a citation test that reproduces the measured per-city medians to 0.1 min on
all five.

| Class | Countries | Reading |
| --- | --- | --- |
| one convention | **3** | Turkey, Aland Islands, American Samoa |
| margin dispute | **107** | The geometry agrees, the printed margins do not |
| convention dispute | **74** | The angle pair or the interval itself differs |
| not comparable | **18** | No common object to compare |
| single | **30** | One family only |

The ladders are named per family and hold across the whole matrix: Diyanet 0.0 / -7.0 / +5.0 / +4.0 /
+6.9 / +1.4 across 193 countries, turktakvim +0.5 / -4.5 / +7.0 / +7.0 / +5.5 / +7.3, tawkit near
zero on every column, masjidi -1.7 on sunrise, athanpro near zero throughout. Diyanet's ladder holds
to a tenth of a minute across 193 countries, which confirms the city-layer finding from a different
pipeline, sample and solved point (DIYANET-TEMKIN-207).

Three contested conventions are now stated with the evidence that decides their shape and not their
truth. In the United States and China the 18/16 membership is Diyanet's alone, with China exactly
18.00/16.00 while athanpro reads 18.00/17.05 and tawkit an interval, and the decision sheet corrects
the premise the flag was raised on: a 16-degree-band isha is carried by at least one family in 99 of
232 countries, so the angle is not a Diyanet oddity and what is specific is the membership (F1, D4).
Iran's 4.5-degree maghrib depression is carried by none of the five families (F2). Saudi Arabia's
Ramadan +120 is reproduced by masjidi alone while tawkit holds a flat +90 (F3). Every one is flagged
and none adjudicated, which is the brief's rule.

The derived-only countries add nothing here by design: no stated parameter set exists to compare, and
the round invented none.

---

## 4. What this round did not resolve

**Oman's rule against its point.** Per-area fit is 94.1 pc, a national-recipe pass at the same points
is 22.1 pc, and the wilayat centroid sits 10 to 40 km from the ministry's computed town. The rule and
the point are not separable on what the ministry publishes (F17, register A36).

**Sixty-eight `.pdf` captures that are error bodies, and four verdicts that reopen.** The register
classifies 1,212 `.pdf` files by byte magic: 1,135 are real PDFs, 9 are deliberate HTML captures and
68 are error bodies (55 404, 4 bot block, 4 denied, 4 not found, 1 challenge) across 12 workspaces.
Most are honest negatives where the 404 is the finding. Four put a claim on an error page and reopen:
Jyvaskyla, where 353 dated rows survive with no artifact behind them, Seychelles, where a 29-row bank
sits on a 403 body, the Islamic Academy's "series stop", and the Wrexham and Dundee month failures
(F6, register A34, D7).

**The Morocco October test.** October 2026 was the discriminating month for the decree and it passed
with no 2027 anywhere, December still 404 at six paths, and the record's pre-rebuild Wayback leg
refuted. The A is carried on evidence that does not include the month that would have tested it (F16).

**The Diyanet tier.** The tree is 18,582 cities and 12,081 captured ids with the temkin ladder named
across 207 countries, and it is the round's largest single coverage gain. Whether it is authority
abroad or platform everywhere is decision D2, one of the two items reserved to the owner.

**US and China at isha 16.** The membership is Diyanet's alone, the latitude slope of the residual
vanishes at 16.0, and the 17.0-with-minus-5-min reading cannot be separated from it on the bias. The
decision sheet recommends no country rule, because adopting it would print fajr 17 to 27 min earlier
than the surfaces the record grades A. Both readings are recorded (F1, D4).

**Iran's depression.** The 4.5-degree maghrib reproduces 100 pc where a fixed offset reproduces 64.3,
and no publisher family carries it. The rule-form is proposed and not adopted (F2, D5).

**The polar five.** Five distinct publisher behaviours, each with trigger days, and a pooled fit over
a summer window cannot succeed. The five are named (POLAR-5) and the policy layer's twelve
high-latitude kinds are not yet reconciled to them (D13).

**The mawaqit relabel class.** 25 of 25 surfaces relabel, zero exceptions, and the trap now rewrites
the date column, so only a value diff gates it. It is a defect register entry, not a fix (F7, D14).

**Eleven record readings the round refuted**, each a claim that will mislead the next reader if the
register is not applied: France's seasonal sweep (nineteen of twenty surfaces are frozen pairs),
Malaysia's national 2027 subuh move (a two-publisher split), Morocco's pre-rebuild Wayback span (it
does not exist), Pakistan's federal 13:00/13:15 dhuhr clock (0 of 365 days in 26 charts), Pakistan's
four absent cities (present on an un-enumerated directory), Rawalpindi and Faisalabad unreadable (a
reader limit, not a capture limit), Bolivia's Santa Cruz unreproducible sun columns (a parser offset),
Tatarstan's 2025 rounding split (the directional pass is absent before 2025), Cyprus's 2025 regime date
(an A-B-A-B pattern from 2022-10-22), Terengganu's "1448 takwim" (a public-holiday calendar), and the
error-page `.pdf` class (30 named by the OCR wave, 68 measured).

**Two capitals questions stay with the owner.** The Ngerulmud transfer 23.6 km to Koror is measured
and unclaimed, and Palikir's nearest mosque is 7.4 km away with no dated table anywhere. Both stay
honest negatives until the owner rules.

**Nine waves had not returned a block at this cut**, and their content is counted only where a report
existed: o1m-29 (Kazakhstan national layer), o1m-31 (Indonesia 2028-2030), o1m-32 (Central Asia
appeal), o1m-33 (index and integrity sweep), o1m-34 (the world-table diff), o1m-39 (Pakistan
remainder), o1m-44 (reopen), o1m-45 (singles) and o1m-47 (flags closer). o1m-40 and o1m-46 returned a
report without a block and are folded in from the report. Two of the nine, o1m-33 and o1m-34, are the
closing arithmetic, and section 1 says what each will add.

**Six workspaces carry no report**: o1m-33, o1m-34, o1m-39, o1m-41, o1m-44 and o1m-45, beside the
root capture directory. o1m-37 and o1m-42 landed their registers without a REPORT.md of their own.

---

## 5. Reconciliation anchors

Every closing artifact, by path, under `$HOME/athan-gitree/census/o1m/`:

| Artifact | Path | What it holds |
| --- | --- | --- |
| This summary | `o1m-38-summary/ROUND-SUMMARY.md` | The definitive read, with counters beside it |
| Counters | `o1m-38-summary/count.mjs`, `files.mjs`, `archive.mjs`, `fitcount.mjs`, `blockcount.mjs`, `waves.sh` | The scripts behind every scripted number in section 1, with their JSON outputs beside them |
| Consolidation | `CONSOLIDATION.md` | 44 blocks, one per returned agent and addendum, in return order |
| Corrections register | `o1m-42-corrections/CORRECTIONS-ROUND3.md` | 82 corrections, 31 new rows, 75 movements, 39 rule-forms, 22 flags |
| Fit index | `o1m-36-fitindex3/FIT-INDEX-ROUND3.md` and `.json` | 154 entries, 87 countries, A 31, the span verdicts, 82 conflict entries, 11 flagged |
| Decisions addendum | `o1m-37-decisions/DECISIONS-ADDENDUM-ROUND3.md` | 16 owner questions: 4 decided, 2 owner, 10 conservative, with their scripts and outputs in `data/` |
| LUPT fifty-year block | `o1m-43-luptyears/` | Five per-decade files, 18,263 days, 50 workbooks re-fetched, 50 per-year fits, the asr rule exact on every day |
| World-table diff | `o1m-34-wtdiff3/` | Not landed at this cut: the class arithmetic that closes the round |
| Integrity | `o1m-r2-fitter/integrity/` | The round's certificate: 78 workspaces, 31,232 files, 3.27 GiB, 1,657,916 raw and 1,559,221 deduplicated rows, 60 PASS / 14 WARN / 4 FAIL, plus the patched generator |
| The close-time sweep | `o1m-33-index/` | Not landed at this cut: the index build and per-workspace integrity sweep |
| Raw archive | every `*/captures/` directory | 10.31 GiB on disk, 46.77 GiB original-equivalent, 133,042 files |
| Normalized rows | every `*/data/` directory | 21,877 JSON files, 21,345 carrying dated keys, span 2014-11-24 to 2076-12-31 |
| The queue and the monitor | `QUEUE.md`, `monitor.log`, `compress.log` | 52 queue rows, 927 heartbeats, the compression trace |

The repo receives reports, fits and normalized rows only, never captures. Raw capture volume stays in
this archive, and the archive-only decisions (tawkit's 3.18M rows, the ocean grid remainder) are the
round's own rulings, recorded in `DECISIONS-ADDENDUM-ROUND3.md` as D1.
