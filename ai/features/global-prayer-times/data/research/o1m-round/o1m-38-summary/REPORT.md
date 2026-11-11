# REPORT: O1m-38 round summary

## What this wave did

Wrote `ROUND-SUMMARY.md` (390 lines) from the round's own data: 44 CONSOLIDATION blocks, 48 reports,
`FIT-INDEX-ROUND3`, `CORRECTIONS-ROUND3`, `DECISIONS-ADDENDUM-ROUND3`, and six counters written here.
The document mirrors the o1l template: a numbers table with a basis per row, the class shift, country by
country across six regions, the four standing questions, the unresolved items, and the reconciliation
anchors by path.

## What was counted

All scripted, each with its script and output beside it.

| Counter | Script | Output |
| --- | --- | --- |
| Workspaces, data files, dated rows raw and de-duplicated, date span, parse failures | `count.mjs` | `count.json` |
| Data-file classification: dated keys, a month or more, a full year or more | `files.mjs` | `files.json` |
| Archive size on disk and original-equivalent, file count, gzip ratio | `archive.mjs` | `archive.json` |
| Fit index: grades, tiers, span verdicts, regions, flags and conflicts | `fitcount.mjs` | `fitcount.json` |
| Blocks, and the per-block flags for corrections, defects, negatives, year-2 | `blockcount.mjs` | `blockcount.json` |
| Agents dispatched, queue status, blocks, reports, workspaces with captures, heartbeat span | `waves.sh` | `waves.txt` |

Three method notes.

- **The row count is not the dated-key count.** The brief's o1l method counts distinct dates per file,
  which gives 7,630,773 and undercounts a file holding many settlement tables: tawkit's 75 country files
  hold 3,177,878 rows but only 27,339 date keys between them. `count.mjs` therefore counts rows as
  surface-date pairs and reports both figures, with the reason stated in the document.
- **De-duplication is a same-surface collapse**, keyed on the path from the file root to the date map plus
  the date and the values, never on the file name. It removes byte-identical re-captures and nothing else,
  so a differing row stays as the drift signal the brief asks the archive to carry.
- **Original-equivalent archive size comes from the gzip ISIZE field**, four bytes at the end of each
  member, exact for members under 4 GiB. 61,674 members give 36.46 GiB against 3.18 GiB on disk.

## What was not counted, and why

- **The class after-state.** `o1m-34-wtdiff3` had not landed. The document states the pre-round record
  (174 rows, A 17, provisional 40, candidate 65, community 15, F 2, FALLBACK 35) beside the round's
  production (154 fit entries) and refuses an after-state total it cannot compute.
- **The integrity sweep of the close.** `o1m-33-index` had not landed. The round's own certificate is
  quoted from `o1m-r2-fitter/integrity` (78 workspaces, 1,657,916 raw rows, 1,559,221 de-duplicated,
  60 PASS / 14 WARN / 4 FAIL) with its date, and the document says it predates the round's tail.
- **Nine waves had not returned a block** at the cut: o1m-29, 31, 32, 33, 34, 39, 44, 45 and 47. Their
  content is excluded by name rather than guessed. o1m-40 and o1m-46 returned a report without a block
  and are folded in from the report.
- **Capitals moved within a tier, not across.** The round raised 7 of 49 platform-only capitals to dated
  surfaces and closed the three gaps as honest negatives, so the count stands at 198 of 202. Reporting a
  higher figure would have been an invention.
- **The compression's free-space arithmetic.** The log records a 62 GiB release against 36.46 GiB of
  gzip originals. The disk measurement is used and the difference is stated as unexplained rather than
  reconciled by guesswork.

## Corrections this wave made to its own first draft

The round was live while the document was written. Three figures changed under it and were re-run, not
edited by hand: dated rows 12,841,567 to 13,340,267, blocks 39 to 44, workspace directories 52 to 55.
Two readings were also corrected from the blocks that landed mid-draft: the error-body `.pdf` count is
68 across 12 workspaces (not the 30 the OCR wave named), and the LUPT fifty-year block shows one
generation recomputed per year rather than one table reprinted, which corrects o1m-35's own reading.

## NEXT

1. Re-run `count.mjs`, `files.mjs` and `archive.mjs` once `o1m-34` and `o1m-33` land, and replace the
   class-shift section with the register's own after-state arithmetic.
2. Fold the nine outstanding waves into sections 2 and 4 as their blocks arrive. o1m-39 and o1m-40 touch
   two unresolved items directly (Pakistan's Quetta panels, Oman's rule against point).
3. Re-run `fitcount.mjs` after o1m-46's re-cut, which exists to fold every return after o1m-36 into the
   index. The 154-entry figure is that index's own count at 12:34 and will move.
4. Hand the summary to the close for the repo's citable-layer rsync, the privacy scrub and the version
   bump. Nothing in this workspace belongs in the repo except this document and its counters if the
   close wants them.
