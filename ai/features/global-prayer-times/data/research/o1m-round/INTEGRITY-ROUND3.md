# O1m integrity certificate, round three

**State: STOPPED MID-RUN by owner order at 13:19Z.** This certificate carries what was banked before
the stop and names, by section, what was not. It is not a complete certificate.

| Instrument | State at the stop | Banked |
| --- | --- | --- |
| Index builder (`build-index2.mjs`) | one full run completed 13:16:38Z | yes, `data/index-stats.json`, 1.0 GiB DB |
| Index rebuild with the corrected extractor | running at the stop | **no** |
| Integrity scanner (`scan3.mjs`) | running at the stop, `scan.json` not yet written | **no** |
| Error-body `.pdf` sweep (`pdf-sweep.mjs`) | completed 13:18Z, re-scored 13:19Z | yes, `data/pdf-sweep.json` |

Read-only: nothing outside `o1m-33-index/` was written except the index DB at the census root. No
repair was performed. No web page was read; nothing was taken from the clock into data.

## 1. The index build

`census-index-o1m.db` at the census root, 1.0 GiB, written 13:16:38Z. The o1l index
(`census-index.db`) is preserved untouched, so the two read against each other.

| Metric | Value |
| --- | ---: |
| Surfaces (one data file each) | 16,484 |
| Dated rows | 10,355,129 |
| Files scanned | 31,432 |
| Files with no parseable dated row | 14,948 |
| Gzipped data files read | 0 |
| Operations covered | 70 |
| Date range | 2000-01-01 to 2100-12-31 |
| DB size | 1.0 GiB |

Per operation, the twelve largest:

| Op | Files | Surfaces | Rows | First | Last |
| --- | ---: | ---: | ---: | --- | --- |
| o1m | 22,392 | 9,260 | 8,683,669 | 2014-11-24 | 2050-12-31 |
| o1l-city | 7,619 | 6,621 | 1,484,196 | 2006-09-25 | 2075-12-31 |
| o1k-wide | 523 | 456 | 166,375 | 2000-01-01 | 2100-12-31 |
| c1-wafrica | 53 | 22 | 8,030 | 2027-01-01 | 2027-12-31 |
| c10-caucasus | 28 | 28 | 7,113 | 2026-01-01 | 2026-12-31 |
| c24-uk-ie | 28 | 19 | 2,279 | 2020-01-01 | 2026-12-31 |
| c16-fits | 13 | 4 | 1,460 | 2025-01-01 | 2026-12-31 |
| c17-chile | 27 | 18 | 540 | 2026-11-01 | 2026-11-30 |
| o1g-decade | 1 | 1 | 365 | 2027-01-01 | 2027-12-31 |
| c8-easia | 12 | 11 | 330 | 2026-11-01 | 2026-11-30 |
| c3-weurope | 18 | 6 | 181 | 2026-10-01 | 2026-11-30 |
| c9-oceania | 11 | 7 | 181 | 2024-11-01 | 2026-11-30 |

The 2000 and 2100 ends are `o1k-wide` sentinel grids, not published tables; the earliest dated
prayer row is o1m 2014-11-24.

### What the builder had to change, and the effect measured

Three defects in `census/tools/build-index.mjs` blocked this round's tree:

1. **It read only `data/*.json` one level deep.** A workspace that banks `data/tawkit/` beside
   `data/diyanet/` was invisible. The tree shape differs by round (`<op>/<ws>/data/` for the short
   rounds, `<op>/<wave>/data/` for o1m), so the test is now "a `data` segment anywhere below the op".
2. **It read only a flat map of dates.** A country file holding 1,200 settlement tables counted as
   zero rows. The extractor now walks path-aware and carries the positional-array-with-`columns`
   shape the round's own counter reads.
3. **It had no gzip path.** The archive carries 61,674 `.gz` members, all under `captures/`; none is
   a data file, so the gzip path is present and unused this round. It is exercised by the same read
   call, not a separate branch.

The effect against the preserved o1l DB, same op, same disk:

| Op | o1l builder | This builder |
| --- | ---: | ---: |
| o1l-city surfaces | 1,591 | 6,621 |
| o1l-city rows | 441,357 | 1,484,196 |

### Not banked

The rebuild with the corrected extractor was running at the stop: it had replaced the DB file and was
writing into it when the order arrived. The figures above are the 13:16 run, preserved in
`data/index-stats.json`, whose extractor lacked the positional-array branch, so **10,355,129 rows is
a floor, not the archive's row count**. Against `count.mjs`'s 13,540,000-odd dated rows for the same
tree, the shortfall is the array-with-`columns` shape (Indonesia, tawkit and the platform exports).
The DB on disk is only complete once that rebuild exits.

## 2. The error-body `.pdf` class, measured

The record (o1m-34 correction, carried into the summary) states **68 error-body captures across 12
workspaces**. Measured over o1m and o1l-city at 13:18Z, re-scored at 13:19Z:

| Reading | Count |
| --- | ---: |
| `.pdf` files in the census tree | 1,817 |
| Non-PDF bodies under a `.pdf` name, o1m + o1l | **78** |
| Workspaces carrying one | **14** |
| of those: HTML error page | 66 |
| of those: XML error body | 4 |
| of those: `File not found.` text, 16 bytes | 4 |
| of those: anti-bot block page, 620 bytes | 4 |

The class is real and the record's reading is short by ten captures and narrow by two workspaces:

| Workspace | Error bodies |
| --- | ---: |
| `o1m/o1m-18-africa2` | 20 |
| `o1m/o1m-12-uk` | 16 |
| `o1l-city/O1l-31` | 12 |
| `o1m/o1m-r5-watches` | 5 |
| `o1l-city/O1l-33` | 4 |
| `o1l-city/o1l-20r` | 4 |
| `o1m/o1m-15-europecities` | 4 |
| `o1m/o1m-23-indiacomplete` | 4 |
| `o1l-city/o1l-22` | 2 |
| `o1m/o1m-14-egyptimsa` | 2 |
| `o1m/o1m-5-asia` | 2 |
| `o1l-city/o1l-28` | 1 |
| `o1m/o1m-2-capitals` | 1 |
| `o1m/o1m-41-bahrain` | 1 |

Two of the added classes are new information:

- **Four 620-byte block pages** read `Your request is being blocked because our system has flagged
  it as sus...` and sit in `o1m-14-egyptimsa` (two Egyptian imsakiya 1446 captures) and
  `o1m-5-asia` (two ACJU 2025 zone files). These are anti-bot refusals, not 404s, so a verdict
  resting on them is a fetch failure of a different kind from the HTML-404 class.
- **Four 16-byte `File not found.` bodies** are the Islamic Academy's dead PDF route in
  `o1m-23-indiacomplete`, which confirms o1m-44's reading independently.

A method defect was found and corrected inside the sweep: the first pass tested byte 0 for `%PDF-`,
which scored 36 real PDFs as unrecognised because a PDF may carry up to 1024 bytes before the
header. The re-score reads the header from the banked bytes. No second disk pass was run.

## 3. The integrity sweep: NOT BANKED

`scan3.mjs` was running at the stop and had not written `data/scan.json`. **No per-workspace verdict
table exists for round three.** The round's own summary says the same about the 08:23 certificate:
it covers 31,232 files against 140,832 now. The close cannot quote this document for a verdict.

What the scanner measured before the stop, and what therefore needs one more run:

| Measure | State |
| --- | --- |
| Per-workspace PASS/WARN/FAIL | not produced |
| File and data-file counts per workspace | not produced |
| Dated rows raw and deduplicated | not produced |
| JSON parse failures per directory class | not produced |
| Zero-byte files | not produced |
| The after-midnight class | not produced |
| Orphan data files (workspace with rows and no capture) | not produced |
| Gzip health (every member opens, ISIZE agrees) | not produced |

The unscanned measures that are cheap and independent are already in hand: the file census below,
the PDF class above, and the builder's totals.

## 4. The census of the tree at the cut

Measured on disk at 13:12-13:16Z, `find` over `$HOME/athan-gitree/census/o1m`:

| Measure | Value |
| --- | ---: |
| Files, whole tree | 140,832 |
| `.gz` members | 61,674 |
| `.json` files anywhere | 38,819 |
| `.json` under a `data/` segment | 22,390 |
| Files under `data/` of any kind | 22,546 |
| Files under `captures/` | 115,801 |
| On disk | 11 GiB |

Every one of the 61,674 `.gz` members sits under `captures/`. No `data/` file was compressed, which
is why the builder's gzip path found nothing to read, and why the data layer's counts are comparable
with the summary's.

## 5. Defects carried forward

1. **The row count is a floor** (section 1). The positional-array branch was added after the banking
   run and its rebuild did not finish.
2. **No verdict certificate** (section 3). This is the round's only integrity gap that the close
   cannot work around: a per-workspace verdict needs the scanner's own output.
3. **The error-body class moves to 78 / 14** (section 2). The four block pages and four
   `File not found.` bodies are new members; a verdict resting on any of the eight is a fetch
   failure and must be recorded as such.
4. **The tree moved under every counter.** The o1m data layer grew 22,041 → 22,390 while this pass
   ran, and `o1m-29` banked 2,065,170 rows at 14:1x. Any figure here is a cut, not a state.

## 6. NEXT

1. Run `node scan3.mjs` to completion and generate the verdict table from `data/scan.json`. It is
   the only outstanding instrument.
2. Re-run `node build-index2.mjs` with the corrected extractor. Expect the row count to move from
   10.4M toward the summary's 13.5M plus o1m-29's 2.07M.
3. Reconcile the error-body class in the corrections register: 78 across 14 workspaces, with the
   eight new members named.
