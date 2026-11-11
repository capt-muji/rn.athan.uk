# O1k-wide deliverable integrity pass

Cutoff: **2026-11-10 21:53:02Z**. Scope: `$HOME/athan-gitree/census/o1k-wide/`, excluding this `integrity/` workspace.
Read-only: nothing outside `integrity/` was created, changed or deleted. No repair was performed.

## Verdict

| Verdict | Workspaces |
| --- | --- |
| PASS | 51 |
| WARN | 2 |
| IN-FLIGHT | 5 |
| FAIL | 2 |

## Totals

| Metric | Value |
| --- | --- |
| Workspaces | 60 |
| Files | 4,112 |
| Total bytes | 1,261,906,324 (1203.4 MiB) |
| `data/` bytes | 21,978,595 (21.0 MiB) across 506 files |
| Zero-byte files | 3 |
| JSON files | 1,540 |
| JSON parse failures in `data/` | 0 |
| JSON parse failures in `captures/` | 13 |
| JSON parse failures elsewhere | 0 |
| Dated rows in `data/` (raw) | 143,548 |
| Dated rows in `data/` (deduplicated) | 139,929 |

Read the two row totals as follows. **Raw** counts every dated record in every file. **Deduplicated** collapses a dataset banked twice (`rows_X` alongside `X`, or an `athan`+`iqamah` pair over the same dates) to one row set. `americas2` is the only workspace where the gap is large: it banks 21 surfaces in both forms.

## Per-workspace results

| Workspace | Verdict | Files | Bytes | Data files | Rows (raw) | Rows (dedup) | Declared | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| africa | PASS | 37 | 6,380,930 | 5 | 151 | 151 | - | ok |
| americas | PASS | 134 | 13,226,000 | 9 | 4,543 | 4,543 | - | ok |
| americas2 | PASS | 155 | 13,667,333 | 51 | 16,830 | 13,211 | 7,670 | rows over declared: 16,830 on disk vs 7,670 (119.4%), explained below; each surface banked twice (raw plus `rows_` copy); dedup column is the row set |
| arbiter | IN-FLIGHT | 7 | 43,541 | 0 | 0 | 0 | - | ok |
| balkans2 | PASS | 144 | 18,014,951 | 15 | 4,346 | 4,346 | 3,276 | rows over declared: 4,346 on disk vs 3,276 (32.7%), explained below |
| benelux2 | PASS | 67 | 20,662,301 | 20 | 6,966 | 6,966 | - | ok |
| centralasia | FAIL | 477 | 30,986,327 | 14 | 2,417 | 2,417 | 2,478 | rows short: 2,417 on disk vs 2,478 declared (-2.5%) |
| centralasia2 | PASS | 257 | 56,413,255 | 13 | 11,612 | 11,612 | - | ok |
| china | PASS | 73 | 24,803,429 | 6 | 144 | 144 | - | ok |
| decisions | IN-FLIGHT | 1 | 16,139 | 0 | 0 | 0 | - | ok |
| deep1 | PASS | 48 | 3,570,961 | 18 | 6,574 | 6,574 | - | ok |
| deep2 | FAIL | 94 | 2,764,385 | 11 | 4,044 | 4,044 | - | report asserts a 4,343-row Tajik archive; `data/tj-dhuhr-era.json` is a 678-byte summary and only 24 month captures exist on disk; report claims 4,343 banked Tajik days; about 744 days of Tajik rows exist on disk |
| deep3 | PASS | 54 | 953,082 | 2 | 1,116 | 1,116 | 1,116 | ok |
| europe | PASS | 136 | 34,373,078 | 32 | 8,424 | 8,424 | 6,966 | rows over declared: 8,424 on disk vs 6,966 (20.9%), explained below |
| fit1 | PASS | 19 | 127,221 | 0 | 0 | 0 | - | ok |
| fit10 | PASS | 27 | 11,341,160 | 0 | 0 | 0 | - | ok |
| fit11 | PASS | 46 | 49,823,051 | 0 | 0 | 0 | - | ok |
| fit12 | PASS | 12 | 547,774 | 0 | 0 | 0 | - | ok |
| fit13 | PASS | 14 | 88,442 | 0 | 0 | 0 | - | ok |
| fit14 | PASS | 46 | 514,182 | 0 | 0 | 0 | - | ok |
| fit2 | PASS | 30 | 13,501,945 | 0 | 0 | 0 | - | ok |
| fit3 | PASS | 18 | 110,233 | 0 | 0 | 0 | - | ok |
| fit4 | PASS | 24 | 502,210 | 0 | 0 | 0 | - | ok |
| fit5 | PASS | 19 | 167,298 | 0 | 0 | 0 | - | ok |
| fit6 | PASS | 18 | 195,302 | 0 | 0 | 0 | - | ok |
| fit7 | PASS | 8 | 65,838 | 0 | 0 | 0 | - | ok |
| fit8 | PASS | 11 | 336,763 | 0 | 0 | 0 | - | ok |
| fit9 | PASS | 16 | 92,253 | 0 | 0 | 0 | - | ok |
| fitindex | PASS | 4 | 276,026 | 0 | 0 | 0 | - | deliverable is FIT-INDEX.md, not REPORT.md; deliverable is `FIT-INDEX.json`, an index not a report |
| gulf2 | PASS | 94 | 198,592,582 | 7 | 2,813 | 2,813 | - | ok |
| horneast2 | PASS | 71 | 4,409,289 | 25 | 7,469 | 7,469 | 7,469 | ok |
| iberia2 | PASS | 173 | 35,329,749 | 24 | 7,727 | 7,727 | 7,059 | rows over declared: 7,727 on disk vs 7,059 (9.5%), explained below |
| indonesia | PASS | 61 | 3,312,419 | 17 | 6,513 | 6,513 | - | ok |
| kel2 | PASS | 49 | 34,321,693 | 1 | 118 | 118 | - | ok |
| koreajapan | PASS | 33 | 15,376,109 | 7 | 850 | 850 | - | ok |
| methods18 | PASS | 7 | 6,653,523 | 0 | 0 | 0 | - | no REPORT.md (CONSOLIDATION.md carries the 15 statements; NIGHT-SUMMARY names it as the one wave consolidated without a report file.) |
| mideast | PASS | 93 | 3,389,540 | 14 | 1,360 | 1,360 | - | ok |
| morocco1 | PASS | 32 | 2,090,191 | 4 | 11,970 | 11,970 | - | ok |
| my2027 | IN-FLIGHT | 124 | 286,722,388 | 11 | 4,015 | 4,015 | - | zero-byte capture/log: my2027/captures/my-muftiwp-home.html |
| nigeria3 | PASS | 28 | 1,693,644 | 4 | 121 | 121 | - | ok |
| night-summary | PASS | 2 | 49,529 | 0 | 0 | 0 | - | deliverable is NIGHT-SUMMARY.md, not REPORT.md |
| nordics2 | WARN | 215 | 18,976,466 | 17 | 5,209 | 5,209 | - | zero-byte capture/log: nordics2/captures/dk-wakf-wayback-retry.html |
| northafrica2 | PASS | 46 | 22,726,045 | 8 | 876 | 876 | - | ok |
| oceania2 | PASS | 127 | 35,125,303 | 19 | 1,997 | 1,997 | 1,690 | rows over declared: 1,997 on disk vs 1,690 (18.2%), explained below |
| opcalendar | IN-FLIGHT | 1 | 9,067 | 0 | 0 | 0 | - | ok |
| philippines | PASS | 43 | 13,281,485 | 3 | 148 | 148 | 148 | ok |
| sahel2 | PASS | 63 | 5,127,982 | 12 | 3,710 | 3,710 | 3,710 | ok |
| sea2 | PASS | 25 | 855,079 | 4 | 1,460 | 1,460 | - | ok |
| southasia | PASS | 29 | 22,673,035 | 11 | 732 | 732 | - | ok |
| southasia2 | PASS | 61 | 11,577,157 | 3 | 731 | 731 | - | ok |
| southernafrica2 | PASS | 69 | 7,154,604 | 22 | 961 | 961 | - | ok |
| thmsg | PASS | 54 | 131,602,143 | 17 | 6,205 | 6,205 | - | ok |
| tncities | PASS | 188 | 7,206,573 | 13 | 4,413 | 4,413 | - | ok |
| ukreconcile | IN-FLIGHT | 5 | 1,022,504 | 0 | 0 | 0 | - | ok |
| ukscotland | WARN | 108 | 48,270,382 | 16 | 2,464 | 2,464 | - | zero-byte capture/log: ukscotland/captures/elm-prayertimes.html |
| uktowns2 | PASS | 257 | 29,677,686 | 29 | 4,519 | 4,519 | - | ok |
| usmap | PASS | 13 | 94,306 | 0 | 0 | 0 | - | deliverable is US-MAP-UPDATE.md, not REPORT.md; deliverable is `US-MAP-UPDATE.md` |
| verify2 | PASS | 8 | 69,600 | 0 | 0 | 0 | - | ok |
| verify3 | PASS | 32 | 10,815,206 | 0 | 0 | 0 | - | ok |
| wtdiff | PASS | 1 | 63,622 | 0 | 0 | 0 | - | deliverable is WORLD-TABLE-DIFF.md, not REPORT.md; deliverable is `WORLD-TABLE-DIFF.md` |

## Declared deliverables

- Every workspace-relative path named in a `REPORT.md` under `data/` or `captures/` resolves on disk once brace notation is expanded (`data/uz-islom.uz-{toshkent,samarqand,buxoro}-...`, `data/kg-{bishkek,osh}-2027.json`, `data/khgt-{2026,2027}-banda-aceh.json` and 15 more). Zero missing.
- No zero-byte file is named as a row source in any report. The two standing zero-byte files are failed-fetch captures that their reports record as negatives: `ukscotland` never cites `elm-prayertimes.html` (its ELM rows come from a different capture), and `nordics2` documents the Danish carrier as rendering no table. The third, `my2027/captures/my-muftiwp-home.html`, belongs to a workspace still in flight.
- The one content-level gap is `deep2`'s asserted 4,343-day Tajik archive, described below.

## Defects

### Unparseable `.json` files in `captures/` (13)

Every one is a fetched HTTP body saved under a `.json` name: HTML error pages, an HTML login/consent page, or the literal strings `Bad Gateway` and `<html>`. None sits in `data/`; no dated deliverable is affected. The defect is the extension, which breaks any consumer that globs `**/*.json`.

| File | Bytes | Content |
| --- | --- | --- |
| `americas/captures/us_daralhijrah_dpt_year.json` | 676,065 | HTML body |
| `centralasia/captures/fml-dpt-year.json` | 2,541 | HTML body |
| `centralasia/captures/islomapi-uz-day-toshkent.json` | 11 | `Bad Gateway` |
| `centralasia/captures/islomapi-uz-month-toshkent.json` | 11 | `Bad Gateway` |
| `gulf2/captures/lb-masjidi-region-6.json` | 196 | HTML body |
| `horneast2/captures/ethiopia-addis-api-settings.json` | 981 | HTML body |
| `methods18/captures/qatar-moi-prayertimings-today-ar.json` | 245 | HTML body |
| `oceania2/captures/fj-fml-wp-media-all.json` | 9,426 | HTML body |
| `oceania2/captures/fj-fml-wp-media-timetable.json` | 9,426 | HTML body |
| `oceania2/captures/nz-fianz-cdx-pdfs.json` | 562 | HTML body |
| `oceania2/captures/nz-fianz-cdx-salat-prefix.json` | 11,832 | HTML body |
| `sea2/captures/msia-esolat-ktn01-2026-03.json` | 443 | not JSON |
| `sea2/captures/msia-esolat-ktn01-mar18-probe.json` | 443 | not JSON |

### Zero-byte files

| File | Kind |
| --- | --- |
| `my2027/captures/my-muftiwp-home.html` | capture, failed fetch |
| `nordics2/captures/dk-wakf-wayback-retry.html` | capture, failed fetch |
| `ukscotland/captures/elm-prayertimes.html` | capture, failed fetch |

### Row-count divergence

- **centralasia** declares 2,478 dated rows in its method line. `data/` holds 2,417. The 61-row gap equals Fiji exactly (November 30 + December 31): the two live month files are on disk (`fj-fml-2026-11-live.json`, `fj-fml-2026-12-live.json`) and were counted twice, or a combined 61-row file was assumed and never written. Net effect is a report arithmetic overstatement, not lost data.
- **europe** declares 6,966; disk holds 8,424. The 1,458 difference is the Estonia generator pair (`ee-eic-both-cities-2026-2027.json`, 1,460 rows), which the headline excludes. Disk is ahead, not behind.
- **iberia2** declares 7,059; disk holds 7,727. The 668 difference is Madrid 2025 plus Madrid 2026 (334 each), which the headline counts once. Disk is ahead.
- **americas2** declares 7,670; disk holds 16,830 raw and 13,211 deduplicated. The headline counts newly banked surfaces only; the workspace also re-banks census captures and stores each surface in two forms.
- **balkans2** declares 3,276; disk holds 4,346. Disk is ahead; the headline excludes re-captures.
- **oceania2** declares about 1,690 AU rows; disk holds 1,997 across AU and NZ. Approximate headline, disk ahead.
- **deep2** asserts a "banked 143-month archive" of 4,343 days at `data/tj-dhuhr-era.json`. That file is 678 bytes holding a `rows: 4343` number and a 14-entry change list, not 4,343 rows. No 4,343-row Tajik artifact exists in the workspace or in the repository census tree. The workspace physically holds 24 Tajik month captures (`captures/tj-months/`, about 1,486 day-tokens across two bound tables). This is the one place where a report describes rows that are not on disk.

## Closing artifacts

| Artifact | Exists | Bytes | Structure |
| --- | --- | --- | --- |
| `night-summary/NIGHT-SUMMARY.md` | yes | 48,136 | H1 x1, H2 x7 |
| `FIT-RULES.md` | yes | 2,071 | H1 x1, H2 x0 |
| `CONSOLIDATION.md` | yes | 61,881 | H1 x0, H2 x87 |

- `NIGHT-SUMMARY.md` is a 493-line owner brief with 7 top-level sections and a numbers table. Intact.
- `FIT-RULES.md` is 26 lines, 4 numbered binding rules. Intact.
- `CONSOLIDATION.md` carries one `##` entry per returned wave and fit. Intact and still being appended at cutoff.

## Live-tree caveat

The operation was still writing when this pass ran. Between the first sweep and the cutoff the tree grew from 3,690 files / 953,387,501 bytes to the figures above, and seven workspaces were created after the enumeration began: `arbiter`, `decisions`, `morocco1`, `my2027`, `opcalendar`, `tncities`, `ukreconcile`. No workspace disappeared. Workspaces marked IN-FLIGHT had writes within 15 minutes of cutoff and no report yet; their absence is timing, not loss. Re-run `integrity/_report.mjs` after the operation closes to refresh every number here.
