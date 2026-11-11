# o1n-19 index normalization — REPORT

**Mission:** fold the two unread row stores into the census index (certificate defects 1-2,
o1n-2 section 5): o1m-29's capital-D `Date` store and o1m-11's fourth array shape. One
rebuild, into a NEW index; the o1m artifact preserved. **State: DONE.** All figures
program-measured this run; the ledger reconciles to zero.

## 1. Source counts, proven from the source files

Claims to verify, not trust. Verified by `normalize.mjs --verify-only`
(`data/normalization-stats.json`), then re-verified after the derived write, then queried
back from the new DB: three counters, one number each.

| Store | Source files | Tables | Rows | Unreadable | Claim |
| --- | --- | ---: | ---: | ---: | ---: |
| `o1m-29-kaznational/captures/raw/{2026,2027}/*.json` | 5,996 (5,658 + 338) | 5,996 | **2,188,540** (2,065,170 + 123,370) | 0 | 2,188,540 ✓ |
| `o1m-11-eastasia/data/diyanet_{cin,japonya,mogolistan,guney_kore}_2026.json` | 4 | 472 | **172,280** (81,030 + 52,195 + 24,455 + 14,600) | 0 | 172,280 ✓ |

Both claims verify exactly. Every row carries a valid `YYYY-MM-DD` date and every canonical
column (0 rows missing columns, 0 bad dates, 0 anomalies).

## 2. Normalization method

The pass writes derived files only; it never modifies a source file. It writes into fresh
subdirectories of each source workspace's `data/` layer so the unchanged builder attributes
the rows to the right workspace (`op='o1m'`, workspace `o1m-29-kaznational` /
`o1m-11-eastasia`). The builder is reused, not rewritten: `build-index3.mjs` is a
byte-identical copy of o1m-33's `build-index2.mjs` whose sole change (diff-checked, one
site) makes the stats JSON path a `--stats` argument with the old default, because the
hardcoded path would otherwise overwrite o1m-33's banked artifact.

**Shape A (capital-D `Date`).** Each source table `{result: [365 day objects]}` becomes one
derived flat date-keyed map at `o1m-29-kaznational/data/normalized-raw/<year>/<id>.json`,
canonical columns only. `sunset` and `midnight` are not columns of the index's row model
and are dropped here (the source keeps them); the metadata key `source` (a string, skipped
by the builder) records the origin. One derived file per source table: 5,996 files, 365
rows each.

Worked example, table `captures/raw/2026/100.json` (Кентау қаласы), before — element 0 of
`result`:

```json
{"imsak":"06:43","fajr":"06:33","sunrise":"07:56","dhuhr":"12:32","asr":"15:21","sunset":"17:00","maghrib":"17:03","isha":"18:26","midnight":"00:30","Date":"2026-01-01"}
```

after — key `2026-01-01` of `data/normalized-raw/2026/100.json` (366 keys: `source` + 365
dates):

```json
{"imsak":"06:43","fajr":"06:33","sunrise":"07:56","dhuhr":"12:32","asr":"15:21","maghrib":"17:03","isha":"18:26"}
```

**Shape B (date at element 0 of positional arrays).** The four certificate-named country
files hold `{cities: {<id>: {id, city, rows: [[date, v1..v6] x 365]}}}`. Each becomes one
derived file at `o1m-11-eastasia/data/normalized/<country>.json` in the builder's own
second shape: date-keyed arrays beside a top-level `columns` sibling. Column order
`imsak, sunrise, dhuhr, asr, maghrib, isha` is `scripts/parse_diyanet.py`'s own capture
order, not a guess.

Worked example, city 12367 HARBIN, before — `cities.12367.rows[0]`:

```json
["2026-01-01","05:27","07:08","11:42","13:46","16:06","17:35"]
```

after — `cities.12367.rows["2026-01-01"]` under `columns: ["imsak","sunrise","dhuhr","asr","maghrib","isha"]`:

```json
["05:27","07:08","11:42","13:46","16:06","17:35"]
```

(The source carries no separate fajr column; the index stores fajr NULL for this source.)
Derived counts re-read from the written files equal source counts exactly: 5,996 files /
2,188,540 rows and 4 files / 172,280 rows.

## 3. The rebuild

`node build-index3.mjs --db=$HOME/athan-gitree/census/census-index-o1n.db
--stats=$HOME/athan-gitree/census/o1n/o1n-19-indexnorm/data/index-stats-o1n.json`, all ops,
EXIT=0 (`build.log`). Built **2026-11-11 18:19:28Z**, 5,930,078,208 bytes (5.5 GiB).

| Total | o1m index (13:33:34Z) | o1n index (18:19:28Z) |
| --- | ---: | ---: |
| Surfaces | 29,567 | **79,068** |
| Rows | 15,108,920 | **33,172,679** |
| Files scanned | 32,110 | 81,786 |
| Unparseable | 0 | **0** |
| Files yielding no dated rows | 2,543 | 2,718 |

Per-op before/after for the two normalized stores (queried back from each DB):

| Workspace | Surfaces before | Rows before | Surfaces after | Rows after |
| --- | ---: | ---: | ---: | ---: |
| `o1m-29-kaznational` | 0 | 0 | 5,996 | **2,188,540** |
| `o1m-11-eastasia` | 0 | 0 | 4 | **172,280** |

Spot-checked values landed faithfully (HARBIN row and Kazakhstan rows queried back;
0 rows in the whole index carry a malformed date).

## 4. The count rise, with its arithmetic

Gross rise 33,172,679 − 15,108,920 = **18,063,759**, which resolves exactly:

| Component | Rows |
| --- | ---: |
| **The two normalized stores alone** | **2,188,540 + 172,280 = 2,360,820** |
| `o1m-51-turktakvim` growth since 13:33 (243,570 → 352,430) | +108,860 |
| op `o1n` at the walk's cut (see 4.1) | +15,594,079 |
| **Total** | **18,063,759** ✓ |

The certificate's predicted defect-closure state 15,108,920 + 2,188,540 + 172,280 =
17,469,740 holds arithmetically; the index exceeds it only by other parties' tree movement
(+108,860 op o1m, +15,594,079 op o1n). Every op outside `o1m` and `o1n` is unchanged
row-for-row (`data/measure.json`, all 70 ops). Op `o1n` at the cut: `o1n-3-turktakvim`
15,462,512, plus 131,567 across nine other o1n waves (o1n-12 75,330, o1n-10 15,652, o1n-13
11,576, o1n-16 10,539, o1n-5 8,500, o1n-14 4,322, o1n-9 3,728, o1n-11 1,355, o1n-7 565).

**4.1 The turktakvim op is a moving number.** The `o1n-3-turktakvim` harvest was writing
concurrently under `data/tt/` while the build walked (files land by atomic tmp+rename, so
only whole files enter). Its 15,462,512 rows are the state at this build's cut, not a
final figure, and will keep rising until the harvest closes. **The harvest's final rows are
certified by wave O1n-17's close-out, not by this report.**

## 5. Certification

`PRAGMA quick_check` on `census-index-o1n.db` returns **ok**. The index of record
`census-index-o1m.db` is preserved: bytes unchanged at 2,710,315,008, mtime unchanged
2026-11-11T13:34:17Z, its own `quick_check` ok. Disk: 63 GB free before the build, 57 GB
after.

## 6. Not proven

1. **`o1n-3-turktakvim`'s final row count** — a moving cut (15,462,512 at 18:19:28Z);
   certified by O1n-17's close-out, not here.
2. **Three same-shape `o1m-11` country files outside the closed certificate's four-file
   scope** — Hong Kong (5 cities), Macau (1), North Korea (1): 7 city tables, 2,555 rows,
   same fourth shape, verified on disk, NOT indexed. Folding them is a coordinator
   decision; this wave's scope was the certificate's 172,280.
3. **One further same-shape `o1m-11` country file (10 cities, 3,650 rows)** — skipped under
   the round's territory exclusion. The pass resolves the exclusion at runtime by
   allowlisting the certificate's four files; the excluded place is never read, derived, or
   named.
4. **`o1m-51`'s +108,860 and the nine other o1n waves' 131,567 rows** — measured tree
   movement, attributed above, not produced or certified by this wave.
5. **Row health beyond shape conformance** — the pass proves parse, date validity, and
   canonical-column presence; it does not re-adjudicate the values themselves (that is the
   source workspaces' fit layer's job).
6. **The index is a view at a cut** — the tree keeps moving; any figure here is the state at
   2026-11-11 18:19:28Z.

## 7. Artifacts (this workspace)

- `normalize.mjs` — the normalization pass (`--verify-only` re-proves sources without
  writing; a plain run re-writes and re-verifies the derived stores).
- `build-index3.mjs` — the builder copy (single verified patch, named in section 2).
- `measure.mjs` — post-build ledger: `data/measure.json` (the build's own stats copied,
  per-op before/after for all ops, preservation and quick_check verdicts).
- `data/index-stats-o1n.json` — the new index's stats JSON, the build's own output.
- `data/normalization-stats.json` — source and derived verification counts.
- `build.log` — the build's own console line, EXIT=0.

Runnable by a successor: `node normalize.mjs`, then
`node build-index3.mjs --db=$HOME/athan-gitree/census/census-index-o1n.db --stats=$PWD/data/index-stats-o1n.json`, then `node measure.mjs`.

---

Wave o1n-19 of round o1n, 2026-11-11. No fetches, no repo writes, no board writes, no
children; source row stores untouched.
