# O1l-city deliverable integrity pass, round two

Cutoff: **2026-11-11 07:14:18Z**. Scope: `$HOME/athan-gitree/census/o1l-city/`, excluding this `integrity2/` workspace.
Read-only: nothing outside `integrity2/` was created, changed or deleted. No repair was performed. Scripts and the raw snapshot sit beside this file (`scan.mjs`, `scan.json`).

## Verdict

| Verdict | Workspaces |
| --- | --- |
| PASS | 53 |
| WARN | 14 |
| IN-FLIGHT | 7 |
| FAIL | 3 |

## Totals

| Metric | Value |
| --- | --- |
| Workspaces | 77 |
| Files | 31,209 |
| Total bytes | 3,505,269,389 (3.26 GiB) |
| `data/` bytes | 264,994,966 (252.7 MiB) across 7,707 files |
| Zero-byte files | 65 |
| JSON files | 17,093 |
| JSON parse failures in `data/` | 0 |
| JSON parse failures in `captures/` | 86 |
| JSON parse failures elsewhere | 3 |
| Dated rows in `data/` (raw) | 1,657,556 |
| Dated rows in `data/` (deduplicated) | 1,558,861 |

The totals include the six files at the round root (`BRIEF.md`, `FIT-RULES.md`, `CONSOLIDATION.md`, `QUEUE.md`, `monitor.log`, `watch.sh`), which belong to no workspace. Every other figure is the sum of the per-workspace column below.

**Raw** counts every dated record in every data file. **Deduplicated** collapses a surface banked twice: `rows_X` beside `X`, an athan/iqamah layer pair over the same dates, `data/rows/` beside `data/`. One dated row is a prayer record: a value under a `YYYY-MM-DD` key, or an element of a row array carrying at least two time columns. A date carried by the file name or by a `{month, day}` pair still counts as a row.

## Per-workspace results

| Workspace | Verdict | Files | Bytes | Data files | Rows (raw) | Rows (dedup) | Declared | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| africa-cities | FAIL | 9 | 113,076 | 0 | 0 | 0 | - | No REPORT.md and no named alternative deliverable. Nine captures, no data, no report, idle since 04:00. |
| algeria-1447 | PASS | 96 | 70,625,070 | 6 | 1,062 | 1,062 | - | ok |
| algo-table | PASS | 3 | 55,858 | 1 | 0 | 0 | - | ok |
| athanpro | IN-FLIGHT | 5669 | 539,769,927 | 2709 | 80,708 | 80,708 | - | No REPORT.md and no named alternative deliverable. 2,699 data files and 80,700 rows written with no report. |
| balkan-cities | WARN | 403 | 17,288,239 | 89 | 25,152 | 25,152 | 24,910 | 1 zero-byte capture: balkan-cities/captures/ba_api_lokacije.txt. Disk ahead by 242, headline counts the listed tables only. |
| bangladesh-cities | FAIL | 25 | 2,270,658 | 0 | 0 | 0 | - | No REPORT.md and no named alternative deliverable. 25 captures, no data, no report, idle since 04:03. |
| canada2 | PASS | 120 | 12,805,137 | 38 | 13,192 | 12,827 | - | ok |
| capitals | PASS | 57 | 4,443,901 | 24 | 7,384 | 7,384 | - | ok |
| capitals2 | PASS | 154 | 24,970,537 | 60 | 2,135 | 2,135 | - | ok |
| capitals3 | PASS | 53 | 2,196,875 | 13 | 1,030 | 1,030 | - | ok |
| china-capitals | PASS | 196 | 32,276,408 | 91 | 14,426 | 14,426 | 10,250 | Disk ahead: 28 capitals x 365 = 10,220 plus the calculator grid samples. |
| coords-americas | PASS | 33 | 4,827,436 | 5 | 0 | 0 | - | ok |
| coords-ledger | WARN | 19 | 15,839,455 | 6 | 0 | 0 | - | 12 records carry the wrong country, not 14 (see Defects). |
| corrections | PASS | 1 | 45,104 | 0 | 0 | 0 | - | ok |
| eastasia2 | PASS | 353 | 155,848,856 | 146 | 40,480 | 40,480 | 34,314 | REPORT.md landed during this pass. Disk ahead by 6,136 over the headline (re-captures). |
| egypt-82 | PASS | 1141 | 64,959,105 | 94 | 28,778 | 28,778 | 28,468 | Disk ahead by 310, 81 surface files against 78 named cities (one 274-row and one 6-row partial). |
| fallback-sweep | PASS | 60 | 3,079,292 | 29 | 4,440 | 4,440 | 4,440 | 2 empty stderr/log files. |
| fallback2 | PASS | 124 | 3,016,341 | 52 | 1,201 | 1,201 | 1,201 | ok |
| final-sweep | PASS | 215 | 17,069,623 | 86 | 2,580 | 2,580 | - | REPORT.md landed during this pass. |
| fitindex2 | IN-FLIGHT | 5 | 205,617 | 0 | 0 | 0 | - | No REPORT.md and no named alternative deliverable. |
| fitter-audit | IN-FLIGHT | 169 | 1,113,682 | 0 | 0 | 0 | - | No REPORT.md and no named alternative deliverable. 1 zero-byte capture: fitter-audit/work-us-unresolved/err_b.txt. Written to the cutoff, no report yet. |
| flags2 | IN-FLIGHT | 19 | 39,954,360 | 2 | 0 | 0 | - | No REPORT.md and no named alternative deliverable. Written to the cutoff, no report yet. |
| gaps-closed | PASS | 823 | 20,775,902 | 84 | 21,456 | 21,456 | - | ok |
| germany-cities | PASS | 526 | 14,685,404 | 47 | 18,376 | 18,376 | 11,076 | Disk ahead: the IGMG 26-table block is 11,076 of 18,376, Diyanet and mawaqit files make up the rest. |
| germany-districts | PASS | 2503 | 574,559,698 | 1246 | 452,965 | 452,965 | 452,965 | Exact: 1,241 districts x 365. |
| il-ps | WARN | 197 | 13,142,552 | 6 | 78 | 78 | 78 | 1 zero-byte capture: il-ps/captures/ps-awqafalquds-wb-20261101.html. |
| india-cities | PASS | 168 | 18,674,486 | 41 | 13,140 | 13,140 | 13,140 | ok |
| indonesia-cities | PASS | 177 | 21,535,746 | 120 | 41,610 | 41,610 | 41,610 | ok |
| indonesia2 | PASS | 1193 | 121,930,451 | 9 | 50,306 | 34,948 | 34,648 | Raw double-banks one dataset (`jsorg-raw.json` repeats `jadwalsholat-org-rows.json`), dedup 34,948 against 34,648 declared. |
| latam-cities | PASS | 327 | 8,452,340 | 25 | 7,787 | 7,787 | 3,385 | Disk ahead: `br_iib_allyears.json` 3,000 plus country surfaces outside the headline. |
| malaysia-states | PASS | 42 | 116,903,598 | 13 | 24,799 | 24,799 | - | ok |
| masjidal-global | PASS | 634 | 27,981,953 | 110 | 39,456 | 19,728 | - | 1 empty stderr/log file. |
| masjidi | PASS | 540 | 24,952,555 | 257 | 61,122 | 61,122 | - | Written to the cutoff: 257 data files, 61,122 rows. |
| masjidi-highlat | IN-FLIGHT | 7 | 29,644 | 0 | 0 | 0 | - | No REPORT.md and no named alternative deliverable. |
| megacities | WARN | 56 | 3,742,257 | 6 | 1,127 | 1,127 | - | One citation does not resolve from this workspace: `data/dar-alifta-cairo-2026-11.json` lives in `egypt-82/data/`. |
| microstates | PASS | 177 | 7,502,103 | 12 | 4,411 | 4,411 | - | ok |
| mideast-cities | PASS | 967 | 44,734,266 | 25 | 12,350 | 12,350 | 12,360 | Disk 10 short of the headline, the report components sum to 12,350 exactly, so the total line overstates by 10. |
| morocco-cities | PASS | 27 | 30,114,169 | 9 | 11,590 | 11,590 | 11,590 | ok |
| nigeria-states | PASS | 104 | 7,936,972 | 36 | 3,252 | 3,252 | 276 | Disk ahead: masjidbox athan+iqamah pairs (399 each) for six surfaces. |
| nz-finish | PASS | 109 | 29,319,609 | 39 | 1,485 | 1,485 | 1,020 | Disk ahead by 465 (2006 Ramadan block). |
| o1l-13r | PASS | 84 | 50,192,513 | 11 | 1,893 | 1,893 | - | ok |
| o1l-15r | WARN | 215 | 39,838,144 | 90 | 30,660 | 30,660 | 29,565 | 2 zero-byte captures: o1l-15r/captures/test-monthly-9541.json, o1l-15r/captures/test-states.json. Disk ahead by 1,095 (one extra city-year). |
| o1l-19r | PASS | 558 | 134,116,042 | 227 | 80,886 | 80,886 | 79,570 | Disk ahead by 1,316 (2006 and 2026 Ramadan blocks plus Fiji). |
| o1l-20r | WARN | 49 | 2,684,309 | 3 | 4,452 | 4,452 | 4,443 | 1 zero-byte capture: o1l-20r/captures/jamiat-month-default.html. Disk ahead by 9: the stored mawaqit file holds 3,294, the report says 3,285. |
| o1l-21r | PASS | 151 | 399,663,702 | 4 | 730 | 730 | 730 | The second O1l-21r block in CONSOLIDATION.md describes this workspace, its twin `pk-transcribe` holds no rows. |
| o1l-22 | PASS | 61 | 23,917,691 | 4 | 5,632 | 5,632 | 5,632 | ok |
| o1l-23 | PASS | 349 | 71,167,150 | 164 | 55,480 | 55,480 | 55,480 | ok |
| o1l-24 | PASS | 96 | 12,252,734 | 9 | 2,599 | 2,599 | - | ok |
| o1l-26r | WARN | 142 | 4,633,671 | 80 | 11,251 | 11,251 | - | 3 zero-byte captures: o1l-26r/captures/kg-cal-test.html, o1l-26r/captures/kg-calendar.html, o1l-26r/captures/kg-ru-calendar-.html. |
| O1l-27 | PASS | 112 | 39,597,105 | 11 | 730 | 730 | 730 | ok |
| o1l-28 | PASS | 292 | 45,735,796 | 53 | 18,982 | 18,982 | 5,602 | Disk ahead: 53 data files, 18,982 rows, the headline counts the 32 new live surfaces only. |
| o1l-29 | WARN | 191 | 22,007,454 | 88 | 18,918 | 18,918 | 9,459 | 1 zero-byte capture: o1l-29/captures/body.77473. Exactly double the headline: every city banked twice (`_printed` and measured). |
| O1l-30 | PASS | 67 | 2,961,140 | 31 | 4,029 | 4,029 | - | ok |
| O1l-31 | PASS | 3786 | 30,539,293 | 61 | 25,133 | 25,133 | 22,943 | Disk ahead: the Mawaqeet block (2,190) is banked but outside the headline. |
| O1l-33 | WARN | 86 | 6,760,535 | 35 | 12,410 | 12,410 | 4,015 | 1 zero-byte capture: O1l-33/captures/probe-se.html. Disk holds 8,395 more: the `data/relabel-2027/` set, payload-identical to the 2026 files (one computed generation relabelled). |
| offset-registers | PASS | 126 | 7,848,272 | 12 | 2,500 | 2,500 | - | REPORT.md landed during this pass. |
| pacific2 | PASS | 53 | 4,144,255 | 16 | 1,490 | 1,490 | 1,095 | Disk ahead: Fiji 2024 + Noumea + Tonga + 12 month sheets. |
| pakistan-cities | WARN | 67 | 80,736,866 | 7 | 794 | 794 | 732 | 1 zero-byte capture: pakistan-cities/captures/jamaattimes-home.html. Disk ahead: 732 chart rows plus 62 month-image rows. |
| pk-transcribe | FAIL | 4 | 10,217,617 | 0 | 0 | 0 | - | No REPORT.md and no named alternative deliverable. Empty stub: two copied PDFs, empty `data/` and `work/`, no report, superseded by `o1l-21r`. |
| residual-fits | IN-FLIGHT | 54 | 483,539 | 47 | 3,949 | 3,949 | - | No REPORT.md and no named alternative deliverable. 1 empty stderr/log file. Written to the cutoff, no report yet. |
| russia-boards | WARN | 1702 | 63,302,159 | 41 | 75,189 | 75,189 | 32,120 | Zero-byte file in data/: russia-boards/data/dumrb_fit.log. 1 empty stderr/log file. Disk ahead: `dumrt.json` is the 32,120 headline, the DUM RB and CDUM files add 43,069. |
| saudi-cities | PASS | 184 | 32,206,537 | 49 | 30,487 | 30,487 | 30,487 | ok |
| second-witnesses | PASS | 59 | 21,695,057 | 1 | 58 | 58 | 58 | REPORT.md landed during this pass. |
| span-ledger | PASS | 2 | 84,011 | 0 | 0 | 0 | - | ok |
| summary | PASS | 3 | 39,090 | 0 | 0 | 0 | - | ok |
| thailand-provinces | PASS | 254 | 12,961,119 | 156 | 56,286 | 56,286 | 56,286 | ok |
| tunisia-cities | PASS | 756 | 12,906,150 | 370 | 7,978 | 7,978 | 5,144 | Disk ahead: full-year files (123 rows) beside the 20-day delegation sweep. |
| uae-cities | WARN | 71 | 29,969,397 | 6 | 31,052 | 31,052 | 35,880 | Rows short: 31,052 on disk vs 35,880 declared (-13.5%). Declared 35,880. The federal file holds 60 areas x 516 days = 30,960 for the span 2026-01-01..2027-05-31, plus 92 Sharjah rows. The stated span yields 30,960 for the federal layer, so the headline overstates by 4,920. |
| uk-seconds | PASS | 110 | 10,396,540 | 29 | 9,907 | 9,907 | - | ok |
| us-states | PASS | 485 | 35,821,416 | 202 | 68,046 | 35,532 | 25,208 | Raw counts the athan and iqamah layers separately, dedup 35,532. |
| us-unproven | WARN | 2357 | 91,474,658 | 30 | 28,955 | 28,955 | - | 1 zero-byte capture: us-unproven/captures/harrisburg-alminaret-salah-calendar.html. REPORT.md landed during this pass. |
| us-unresolved | PASS | 708 | 75,731,908 | 203 | 65,015 | 34,285 | 33,513 | Raw counts both layers, dedup 34,285 against 33,513 declared. |
| verify-round | IN-FLIGHT | 2 | 6,461 | 0 | 0 | 0 | - | No REPORT.md and no named alternative deliverable. |
| watches-eu | PASS | 113 | 9,644,322 | 4 | 1,126 | 1,126 | - | 43 empty stderr/log files. |
| wayback-back | PASS | 181 | 11,020,306 | 44 | 5,131 | 5,131 | - | ok |
| westafrica2 | WARN | 171 | 7,813,392 | 83 | 7,930 | 7,930 | 7,930 | 4 zero-byte captures: westafrica2/captures/bf-sunna-heuresprieres.html, westafrica2/captures/bf-sunna-home.html, westafrica2/captures/mawaqit-.html, westafrica2/captures/t2.html. Row total matches the headline exactly. |
| wtdiff2 | PASS | 1 | 70,061 | 0 | 0 | 0 | - | ok |

The Declared column carries the headline count a report states, where it states one. A dash means the report gives per-surface figures only.

## Declared deliverables

- Every path a `REPORT.md` names under `data/` or `captures/` resolves on disk, once brace notation (`data/uz-islom.uz-{toshkent,samarqand,buxoro}-...`), range notation (`captures/federal-areas-emirate1..7.json`, `captures/fml-2024/January..December.jpg`) and truncated family prefixes (`data/eg-esa-`, `captures/mawaqit-`) are read as the families they denote.
- One citation resolves in a sibling workspace rather than its own: `megacities/REPORT.md` names `data/dar-alifta-cairo-2026-11.json`, which is `egypt-82/data/dar-alifta-cairo-2026-11.json`. The data exists; the path is wrong from inside `megacities`.
- Five paths are portal request paths rather than local files and are read as such: `watches-eu` records `data/horaires-2026-11.js` and its siblings as the Morocco ministry's URL, and `second-witnesses` records `data/horaires-2026-12.js` the same way.
- No zero-byte file is named as a row source in any report.

## Defects

### Unparseable `.json` files (89)

None sits in a `data/` directory, so no dated deliverable is affected. Every one is a fetched HTTP body saved under a `.json` name: an HTML error page, the literal text `Not Found` or `Forbidden`, an empty file, or the Wayback offline page. The defect is the extension, which breaks any consumer that globs `**/*.json`.

| Workspace | Files | Kind |
| --- | --- | --- |
| india-cities | 17 | `Not Found` text x12, HTML body x5 |
| o1l-19r | 17 | HTML body x17 |
| o1l-28 | 11 | HTML body x10, empty or 1-byte x1 |
| latam-cities | 8 | not JSON x5, `Not Found` text x3 |
| africa-cities | 6 | HTML body x6 |
| O1l-31 | 5 | `Forbidden` text x5 |
| canada2 | 4 | HTML body x4 |
| wayback-back | 3 | HTML body x3 |
| balkan-cities | 2 | HTML body x2 |
| germany-cities | 2 | HTML body x2 |
| masjidal-global | 2 | HTML body x2 |
| o1l-13r | 2 | HTML body x2 |
| o1l-15r | 2 | empty or 1-byte x2 |
| algeria-1447 | 1 | HTML body x1 |
| gaps-closed | 1 | HTML body x1 |
| masjidi | 1 | HTML body x1 |
| nigeria-states | 1 | `Not Found` text x1 |
| o1l-22 | 1 | HTML body x1 |
| pakistan-cities | 1 | HTML body x1 |
| tunisia-cities | 1 | HTML body x1 |
| uk-seconds | 1 | HTML body x1 |

The two genuinely empty files are `o1l-15r/captures/test-monthly-9541.json` and `o1l-15r/captures/test-states.json`; both are probe leftovers, and the workspace's report does not cite them. The remaining empty-input failure is a one-byte fetch in `o1l-28`.

### Zero-byte files (65)

- 46 empty `.err` files, which record a probe that wrote nothing to stderr. Normal, and no report cites one.
- 2 empty log files: `residual-fits/stage1.log`, `russia-boards/data/dumrb_fit.log`. None is a row source, and no report cites one.
- 17 other empty files, nearly all failed-fetch captures recorded as negatives in their own reports:

| File | Bytes |
| --- | --- |
| `O1l-33/captures/probe-se.html` | 0 |
| `balkan-cities/captures/ba_api_lokacije.txt` | 0 |
| `fitter-audit/work-us-unresolved/err_b.txt` | 0 |
| `il-ps/captures/ps-awqafalquds-wb-20261101.html` | 0 |
| `o1l-15r/captures/test-monthly-9541.json` | 0 |
| `o1l-15r/captures/test-states.json` | 0 |
| `o1l-20r/captures/jamiat-month-default.html` | 0 |
| `o1l-26r/captures/kg-cal-test.html` | 0 |
| `o1l-26r/captures/kg-calendar.html` | 0 |
| `o1l-26r/captures/kg-ru-calendar-.html` | 0 |
| `o1l-29/captures/body.77473` | 0 |
| `pakistan-cities/captures/jamaattimes-home.html` | 0 |
| `us-unproven/captures/harrisburg-alminaret-salah-calendar.html` | 0 |
| `westafrica2/captures/bf-sunna-heuresprieres.html` | 0 |
| `westafrica2/captures/bf-sunna-home.html` | 0 |
| `westafrica2/captures/mawaqit-.html` | 0 |
| `westafrica2/captures/t2.html` | 0 |

### Row-count divergence

Two workspaces hold fewer rows than their headline claims, and one of those is an arithmetic slip rather than lost data.

- **uae-cities** declares 35,880 dated rows for "2026-01-01..2027-05-31, 60 areas". That span is 516 days, and `data/federal-areas-rows.json` holds exactly 60 x 516 = 30,960. The data is complete for the stated span; the headline corresponds to 598 days. Nothing is missing, and the report's count is wrong by 4,920.
- **mideast-cities** declares 12,360. Its own components (10 Saudi x 709, 6 Oman x 730, Iraq 365, Kuwait 365, Jordan 150) sum to 12,350, which is what `data/` holds. The total line overstates by 10.

Every other divergence runs the other way, disk ahead of the headline, and each has a cause on record:

- **indonesia2** banks the same 38-city payload twice (`jadwalsholat-org-rows.json` and `jsorg-raw.json`, 15,358 rows each). Deduplicated, the workspace holds 34,948 against a declared 34,648.
- **o1l-29** banks every city twice, `_printed` and measured: 18,918 rows against a declared 9,459, exactly double.
- **O1l-33** holds the eleven dated surfaces (4,015 rows) plus `data/relabel-2027/`, ten 2027 files whose payload is identical to the 2026 files. The report names that set as relabel evidence and grades it a frozen generation, which is the correct reading under FIT-RULES.
- **russia-boards** holds the 32,120-row `dumrt.json` headline plus 43,069 rows in the DUM RB, CDUM and Ufa files.
- **o1l-28**, **nigeria-states**, **tunisia-cities**, **latam-cities**, **O1l-31**, **o1l-15r**, **o1l-19r** and **germany-cities** all count newly banked surfaces in the headline while `data/` also holds re-captures, second layers or partial files.

### Known issues, verified

**The fitter bug (`const isha += 1440`).** `us-states/fit_masjidal.js` declares `isha` as a `const` and then adds 1440 to it on the after-midnight branch, which throws `TypeError: Assignment to constant variable`. The throw is caught by the per-year `catch { continue }`, so a triggering year would vanish from the fit output silently rather than crash the run.

The bug cannot reach banked data. The fitter reads `captures/` and `data/` and writes only `out/`; no dated row passes through it. Its practical reach is nil in this tree: a scan of all 403 date-keyed files in `us-states`, `us-unresolved` and `us-unproven` found zero rows with isha before maghrib in `us-states`, so the branch is never taken there. The 42 fits in `us-states/out/` are therefore unaffected. `us-unresolved/scripts/fit_masjidal.js` carries the fix (`let isha`), and the eleven after-midnight rows in its two files are safe. `o1l-22/work/fit_mq.mjs` uses a mutable `rows[d].isha` and is not affected.

**The O1l-21r row count.** The round produced two workspaces for one job. `o1l-21r` holds the transcription and the data: 365 dated rows for Peshawar and 365 for Quetta, 730 in total, and its report states 366 chart rows against 365 dated for Peshawar because the printed chart carries a 29 February row that 2026 cannot hold. `pk-transcribe` holds the two copied PDFs and nothing else: `data/` and `work/` are empty and there is no report. The two `CONSOLIDATION.md` blocks differ only in that one counts chart rows (366) and the other dated rows (365). There is no data discrepancy, and `pk-transcribe` is a dead duplicate.

**The wrong-country ledger records.** The ledger carries 30 records under `CA`. Twelve of them are misassigned, not fourteen: ten `rows_us_*` files, `rows_gt_aldaawa_guatemala_city.json` and `rows_hn_centro_islamico_san_pedro_sula.json`. The cause is `countryOf` in `derive/countries.mjs`: the ISO-prefix test is anchored at the start of the file name, so a `rows_` prefix defeats it and the workspace default `americas2: "CA"` takes over. `rows_ca_*` resolves correctly by coincidence. The two US files that are also banked without the prefix (`us_icgt_toledo.json`, `us_mcsamasjid_san_antonio.json`) carry `US` and are correct, which is why the summary figure of 14 double-counts two records.

**Writes outside a workspace.** No wave script writes outside its own directory. The cross-workspace references found are reads: `germany-districts` reads `germany-cities`, `indonesia2` reads `indonesia-cities`, `gaps-closed` reads `mideast-cities` and `tunisia-cities`, `coords-ledger` reads five workspaces, `coords-americas` reads `us-states`, `nz-finish` reads `O1l-19r`, and `residual-fits` reads `o1k-wide`. One script writes `../fetch_ba.log` (`balkan-cities/fetch_ba.sh`), and no such file exists at the round root. The repository carries two uncommitted changes from the operation, `ai/plans/README.md` and `ai/features/global-prayer-times/RESEARCH-ROUNDS.md`; both are lead-level artefacts, not wave output. The shared `census/census-index.db` was written at 05:46Z by a process outside this tree and cannot be attributed from here.

## Closing artifacts

| Artifact | Exists | Bytes | Structure |
| --- | --- | --- | --- |
| `BRIEF.md` | yes | 7,932 | H1 x1, H2 x8 |
| `FIT-RULES.md` | yes | 2,265 | H1 x1, H2 x0 |
| `CONSOLIDATION.md` | yes | 78,698 | H1 x1, H2 x65 |
| `QUEUE.md` | yes | 5,739 | H1 x1, H2 x4 |
| `monitor.log` | yes | 785,587 | append-only log |

- `CONSOLIDATION.md` carries one `##` block per returned wave and was still being appended at the cutoff.
- `BRIEF.md` and `FIT-RULES.md` are the binding documents and are unchanged since 03:18Z and 02:52Z.
- `QUEUE.md` is the round's opening queue and is unchanged since 02:57Z.

## Live-tree caveat

The operation is still writing. This pass saw the tree grow from 68 workspaces to 77 between the first sweep and the cutoff. The 9 created after the sweep began: `final-sweep`, `fitindex2`, `fitter-audit`, `flags2`, `masjidi-highlat`, `residual-fits`, `summary`, `verify-round`, `wtdiff2`. No workspace disappeared. The IN-FLIGHT workspaces had writes inside the last 15 minutes and no report yet; their absence is timing, not loss. The figures here are a snapshot, not a final count: re-run `integrity2/scan.mjs` and `integrity2/gen.mjs` after the operation closes.
