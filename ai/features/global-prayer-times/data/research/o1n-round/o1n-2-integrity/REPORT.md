# o1n-2 integrity wave — REPORT

**Mission:** close the round-three integrity certificate (INTEGRITY-ROUND3.md, written
mid-stop 13:19Z). **State: DONE.** Closed as `INTEGRITY-ROUND3-CLOSED.md` in this workspace.
All figures program-verified; every reconciliation runs to zero. No fetches, no repo writes,
no clock values in data.

## What was verified

1. **Index DB** — `census-index-o1m.db` (2.5 GiB, built 13:33:34Z): `PRAGMA quick_check` =
   `ok`; the `build` table and all 18 row-carrying per-op counts equal `index-stats.json`
   (15,108,920 rows, 29,567 surfaces, 32,110 files, 0 unparseable).
2. **Row reconciliation** — 15,108,920 vs ROUND-SUMMARY's 13,340,267 raw resolves exactly:
   +556,678 growth in 5 workspaces, −461,555 shrink in 8 (leader `o1m-r4-backward`
   −424,559), +1,673,530 from the 69 non-o1m ops. The 10,073,002 dedup is the round-wide
   same-surface collapse; the index banks per file and does not collapse across files.
3. **o1m-29 found and verified** — its 2,188,540 rows (2,065,170 for 2026, equal to the
   REPORT to the row, + 123,370 for 2027) are healthy in `captures/raw/`, banked 13:04:14Z,
   and invisible to every round instrument (outside `data/`, capital-D `Date` field inside a
   `result` list). The index undercounts healthy rows by 2,188,540; with o1m-11's fourth
   shape (172,280 rows, 472 city tables) the archive's true row state is ~17.47M.
4. **Verdict certificate** — 60 workspaces: **15 PASS / 44 WARN / 1 FAIL**
   (`o1m-r1-masjidihigh`: 4,038 rows, empty `captures/`). badJson 160 = 0 in data / 159 in
   captures / 1 fit artifact. Zero-byte 315 (7 under `data/`, all process droppings).
   After-midnight classes: lifted 182,394, am-clocked 80,130, wrapped 17,021.
5. **68-vs-78 settled per file** — the decisions sheet counts fetch failures only (68/12)
   and holds 9 deliberate HTML captures separately; the sweep counts all non-PDF bodies
   (78/14). The sheet's 68 are a strict subset of the 78. Delta = the 9 RECORDED_HTML
   reclassifications + 1 post-cut bank (`alayam-13474`, Cloudflare block page, 13:07:30Z).
   The "four o1l workspaces" hypothesis is refuted: the sheet already counted five o1l-city
   workspaces (21 of the 68). Final ledger: **69 failures across 13 workspaces**, 78 bodies
   across 14 with the deliberate class counted in.
6. **Gzip health** — scanner's full pass 61,881/61,881 healthy with ISIZE agreement; this
   wave's independent 200-sample: 200/200 healthy, 0 bad.

## Open (carried in the certificate, section 5)

- o1m-29 normalization (2,188,540 rows) and o1m-11 fourth shape (172,280 rows), then one
  index rebuild.
- o1m-r1 provenance adjudication; `o1m-49-wayback` report; 17 zero-rows WARN eyeballs.
- Tree growth since the scan (62,733 `.gz` now vs 61,881): one `scan3.mjs` re-run covers it.

## Artifacts

- `INTEGRITY-ROUND3-CLOSED.md` — the completed certificate (sections 1-6).
- `data/verdicts.csv` — per-workspace verdicts and measures (60 rows).
- `data/db-o1m-perws.txt` — per-workspace rows queried back from the index DB.
- `data/scan-detail.json` — badJson and pdfErrors itemized from scan.json.
- `data/gzip-sample.json` — the 200-member sample result.
