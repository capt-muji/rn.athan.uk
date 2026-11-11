# O1n-4 — FIT-INDEX ROUND 4: the three late O1m returns folded, the gate run, the line widened

Wave `o1n-4`, round o1n, round four. Workspace
`$HOME/athan-gitree/census/o1n/o1n-4-fitindex/`. 2026-11-11, all times UTC, nothing under
/tmp, nothing written to the repository (the 3B cut stands unedited in it, verified by git
status and mtime). Public pages only: the gate GETs the public jadwal endpoint, the sweep
POSTs exactly the KHGT schedule body O1m-5 used, 4 workers. Engine adhan 4.4.6 at
`census/adhan-build`, `Rounding.None`. Nothing reads the real clock into data.

## 1. Deliverables

| item | state |
| --- | --- |
| `FIT-INDEX-ROUND4.md/.json` | 164 entries: 160 carried verbatim from 3B, 2 amended in place (ID-MYQURAN-2028-2030, ID-KHGT-516-UNITS), 2 new (KZ-NATIONAL-5658, TT-TREE-110834) |
| the live gate | RUN: 32 units, 96 unit-years, 23,808 cells, ZERO mismatches. The bank is gated |
| the KHGT 2028 sweep | 518 of 518 points, 189,588 rows, 293 s |
| the 2028 national line | widened 49 to 517 units; the 8-minute class answers for 2028, residual median 0.00 |
| generator | two runs byte-identical (sha256 `36d2c157…` json, `459d4c0a…` md); counts reconcile |

## 2. The new entries

**KZ-NATIONAL-5658 (A, authority).** O1m-29's completed report enters: 5,658 settlements x
2026 whole (2,065,170 rows) plus the 2027 sample (338 settlements), 15/15 Hanafi with the
margin block, 87.51 pc exact / 99.9999 within-1 / MAE 0.125 in 2026 and 87.71 pc at the
2027 sample against 87.73 at the same settlements in 2026. The 48 N switch is verified at
national scale: 2,065,170 settlement-days, zero exceptions, the tightest crossers 20 m and
116 m from the line. The publisher's own served prayTimes.js re-run reproduces the API
cell for cell at the 50-settlement gate. Amplitude 174 to 274 min (fajr Jan-15 vs Jul-15),
monotone in latitude. Span yes, A on two distinct fitted years.

**TT-TREE-110834 (candidate, platform, ZZ pool).** O1m-51's worldwide tree at the lower
bound: 110,834 non-African settlements enumerated across a 235-entry selector, 1,059
annual captures, 971 tables / 352,430 rows parsed over 121 countries, 34 countries
complete. No fit: the wave's four named questions are open, and the fits are O1n-3's
running task. The province-filter defect (2,052 of 3,104 shells, thirteen zero-reads on
the truncation) is carried as a conflict. Amplitude across 954 banked tables: median 66
min, 1 to 280. The entry will be superseded by O1n-3's re-enumeration.

## 3. The amended entries

**ID-MYQURAN-2028-2030: provisional to A.** The bank now holds 517 units x 3 years
(566,632 rows). The full-set fit: 2028 fajr 42.3 pc exact / 89.6 within-1 / worst 10, and
2029, 2030 within 0.3 pc on every column. Drift frozen (shift 0.00-0.01 min, swing
0.15-0.34). Relabel gate closed by value diff (8.7 / 6.6 / 13.0 pc of cells change, zero
units with zero change). Live gate PASS (below). Horizon ladder at full set: dip
0.0378*sqrt(m) + 0.18, corr 0.291, sea-level band -0.04 against 1,000 m band +4.12. vs
SIHAT widened to 203 units, every column within one minute. Amplitude: median 11 min
(near-equator), 0 to 34.

**ID-KHGT-516-UNITS: span 2026-2028.** The sweep's 189,588 rows reproduce the standing
recipe at every one of the 518 points as single-value histograms; the carried conflict's
sign is corrected (KHGT subuh sits LATER than SIHAT, per GAPS-CLOSED-ROUND3 item 6); the
widened 2028 line and the five zone disagreements are added as conflicts. Amplitude 11
min median, 0 to 33.

## 4. The gate (the difference between ungated and trusted)

The wave's own `gate.py`, run unchanged against the regenerated unit list: 32 units (the
stratified every-17th sample plus the six island and odd entries, including the working
Sofifi 3211 and the four island seeds), March of 2028, 2029 and 2030 refetched live and
compared cell by cell on all eight fields. **96 unit-years, 2,976 days, 23,808 cells,
zero mismatches, zero missing bank rows.** Verdict per unit in
`data/gate-live-recheck.json` and the index's per-unit table. Raw payloads gzipped at
`captures/gate/` (384 KB gz).

## 5. The 2028 national line, widened

All 517 common units, 189,222 paired unit-days, clock-normalised (each surface's own dhuhr
removed):

| column | raw median (p5..p95) | normalised |
| --- | --- | --- |
| subuh | -7 (-11..-5) | **-9 (-10..-9)** |
| sunrise | -3 (-7..0) | -5 (-9..-2) |
| dhuhr | +2 (-1..+4) | 0 by construction |
| asr | +1 (-2..+3) | **-1, exactly, at every unit** |
| maghrib | +2 (-2..+6) | 0 (-3..+4) |
| isha | +1 (-2..+4) | **-1, every unit but one (max +3)** |

**The 8-minute class explains the 2028 line.** The per-unit 20-vs-18 angle model at each
unit's own point gives -8.03 [-8.12..-8.00]; with the flat one-minute column offset it
reads -9.03 against a measured median of -9.00; residual median 0.00 (p5 -1, p95 +0.12),
worst -4.97 at three Papua highland units. The angle is itself nearly constant across the
country, so the flat -9 line is the prediction. GAPS-CLOSED-ROUND3 item 6 carries to 2028
and to the third surface (`data/line-2028-widened.json`).

Five units carry one-hour civil-zone disagreements (raw dhuhr -58 to +63), all five
KHGT-side: the Barito trio (WIB) rendered WITA, and Kepulauan Sula and Pulau Taliabu
(North Maluku, WIT) rendered WITA with KHGT's timezone field pinned at 8, against myquran
printing WIT. Solar noon supports each surface's own clock, so the split is zone
assignment, not computation; the SIHAT wrong-zone four of 2026 are the precedent. The
normalisation removes them from the angle comparison.

## 6. Corrections found this round

1. **The o1m-31 zone picker was shift-invariant** (`scripts/solve_fit.mjs`): residual
   spread cannot see a constant, so every unit tied 7/8/9 and first-wins chose 7; the
   eastern half of the country misfit by one to two hours. Fixed to minimise the summed
   absolute residual median; rerun picks 302 WIB / 150 WITA / 65 WIT and the weakest
   unit's worst residual fell 123 min to 3. The pre-fix rates (37 pc exact, worst 124)
   were an artefact, never published as national, and are superseded. Section 15 of the
   o1m-31 report records the continuation.
2. **The carried KHGT conflict's sign** corrected per item 6 (KHGT later, not earlier).
3. **This wave's own scorer error, caught before publication:** the first KHGT 2028
   recipe check measured subuh on the default 20-degree ruler and read +10; the correct
   18-degree ruler reads +1.5 with the other columns. The +10 was the angle plus the
   margin, not a recipe change.

## 7. Files

- `FIT-INDEX-ROUND4.md/.json` the cut; `gen.py` the deterministic generator (runs twice,
  byte-identical).
- `data/` — `gate-live-recheck.json` (per-unit verdicts), `khgt-2028-comparison.json`
  (the widened comparison), `line-2028-widened.json` (the angle model and residuals),
  `khgt-2028-recipe-check.json` (518-point recipe check), `myquran-margins.json`,
  `drift-seasonal.json`, `leap-and-relabel.json`, `dip.json`, `myquran-vs-sihat.json`,
  `amplitudes.json`, `score2.log`, `dip2.log`, `vs_sihat2.log`.
- `scripts/` — `line2028.mjs` (the widened line and the 20-vs-18 model),
  `khgt2028score.mjs` (the recipe check).
- In o1m-31's workspace: `captures/khgt2028/` 518 raw sweeps (gzipped in place, 2.0 MB),
  `captures/gate/` 96 gate payloads (gzipped, 384 KB), `fit/` refreshed (solver, recipe,
  drift, dip, vs-sihat, comparison), `REPORT.md` section 15 appended.

## 8. NEXT

- O1n-3's turktakvim re-enumeration supersedes TT-TREE-110834's count when it returns;
  the tree's fits (per-country recipe, isha question, ladder, FALLBACK join) are its task.
- SIHAT re-probe from late December: 2027 opens at the calendar roll.
- The myquran front end may state the method the API does not.
- Kazakhstan: the far-horizon years and the second national pull remain open (entry
  open_caveats).
