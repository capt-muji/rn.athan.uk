# O1m-R2 fitter remediation

Agent O1m-R2, 2026-11-11. Workspace `$HOME/athan-gitree/census/o1m/o1m-r2-fitter/`. Mission: execute
the O1l-66 fitter-audit recommendation exactly. Engine adhan 4.4.6 at
`census/adhan-build/node_modules/adhan`, `Rounding.None`, every timezone read from the surface's own
payload or recovered by reproduction, every date from a literal capture string, no clock read. No web,
no repository write, nothing under `/tmp`. The O1l archive was read only; the one file changed inside
it is `integrity2/gen.mjs`, one paragraph, as instructed.

## 1. Newark re-bank, `8KXm93LM`

The buggy twin was copied, patched `const isha` to `let isha`, and run against the three Newark
captures. A third copy carries the repair pass and is the record of the round.

| state | years | rows | 2025 geo | 2025 fajr, isha | fajr | sunrise | dhuhr | asr | maghrib | isha |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| banked in the archive | 2024+2025+2026 | 1,096 | 40.70, -74.404, k0, rms 26.657 | 14.72 / 15.02 | 52 / 2 | 55 / -3 | 69 / -721 | 71 / -722 | 29 / -721 | 35 / 722 |
| buggy declaration | 2024+2026 | 731 | year absent | - | - | - | - | - | - | - |
| `let` only | 2024+2025+2026 | 1,096 | 40.70, -74.404, k0, rms 26.657 | 14.72 / 15.02 | 52 / 2 | 55 / -3 | 69 / -721 | 71 / -722 | 29 / -721 | 35 / 722 |
| `let` and repair, the corrected record | 2024+2025+2026 | 1,096 | 40.73, -74.154, k2, rms 0.849 | 14.71 / 15.35 | 44 / 3 | 264 / 2 | 11 / 3 | 37 / 4 | 248 / -3 | 20 / 3 |

Each score cell is exact count then worst residual in minutes. Corrected three-year recipe: fajr
14.65, 14.71, 14.66 and isha 15.35, 15.35, 15.34, at rms 0.829, 0.849, 0.866. 2024 and 2026 are
byte-identical to the archive block; only 2025 moves.

The corrected deltas match the audit: geo rms 26.657 to 0.849, isha worst +722 to +3, dhuhr worst
-721 to +3, asr worst -722 to +4, maghrib worst -721 to -3. Seven checks printed by
`fit/scripts/compare_newark.mjs`, all holding:

- the buggy declaration drops 2025 (2 years, 731 rows)
- `let` restores 2025 at 365 dated rows
- `let` alone leaves the banked score, geo rms 26.657
- the repair pass reaches geo rms 0.849
- the repair pass reaches isha worst +3
- 2024 and 2026 are unchanged by the repair
- three years sit on one recipe, fajr 14.65 to 14.71 and isha 15.34 to 15.35

The corrected record is `fit/banked/fit_8KXm93LM.json`.

The whole us-unresolved set of 39 fits was then re-run under the repaired copy, so the audit's second
reading is measured rather than quoted. 37 reproduce the archive byte for byte. `0aAeyzAj` keeps its
years and its exact counts and moves only its dhuhr worst, -714 to +6, which is the AM/PM artefact on
one day and not a year or a score change. Newark moves both the span and the score, as above. Every
`--rows` surface was replayed the way its own bank file records: three carry a pinned point and a
residual of 0, the rest a free solve, and the runner reads that per file. Comparison in
`fit/unres-compare.tsv`.

## 2. Flags A53 and D9 cleared

**US-33-METROS, A53.** 39 fits re-run twice, once under the copy patched `const` to `let` and once
under the unpatched copy. Both produce the archive's 39 files field for field: 98 scored tenant-years,
35,829 dated rows, zero years lost, zero scores moved, zero geometry moved. Before: "every year-scored
US fit is suspect until re-run". After: certified, no multi-year score from that fitter left
uncertified. The 39/39 comparison is `fit/states-compare.tsv`.

**MASJIDAL-216-POOL, D9.** Its fitter `masjidal-global/fit2.js` already declares `let isha` at line 51
and wraps the scored side. The 18-tenant by 3-year sample was re-run in full: 54 tenant-years, 19,728
dated rows, 18 of 18 `out/f2_*.json` identical in parameter spread, per-year angles, margins and every
scored column. Sixteen captures carry their zone; the two with an empty `general_setting` were
resolved by reproduction, Europe/London for Birkenhead and Indian/Mauritius for Port Louis, and the
controls UTC and America/New_York fail the same test (rms 32.532 and 16.567 against 1.002). Before:
"any multi-year score from that fitter uncertified". After: certified, with one caveat recorded,
`masjidal-global/out/fit_*.json` is a stale pre-`fit2.js` run carrying +1440 isha residuals. The 18/18
comparison is `fit/masjidal-compare.tsv`.

## 3. The integrity script, corrected

`integrity2/gen.mjs:232` asserted that the bug cannot reach banked data and that the after-midnight
rows are safe. Both claims are wrong on the score axis. The paragraph now says what the archive shows:
`const` to `let` keeps the year and leaves the score wrong, the Newark 2025 block was banked at rms
26.657 with an isha worst of +722, the repair pass reaches 0.849 and +3, and the standing rule is to
handle isha at or past 1440 on both sides. The only archive file changed this wave is that one
paragraph.

The scan itself now measures the class instead of asserting it. `integrity/scan-o1m.mjs` applies the
round-two row and dedup rules unchanged and adds one test per dated row: isha printed before maghrib,
split into **wrap** (the next clock day, gap past five hours, the fitter's class) and **near** (minutes
apart, never a wrap). Result over the archive: 1,467 wrap rows and 1,229 near rows across 9
workspaces, and 0 rows already lifted, so no file stores a wrapped isha.

`INTEGRITY-O1M-FIX.md` is the certificate: 78 workspaces, 31,232 files, 3,510,456,081 bytes (3.27 GiB),
`data/` 269,779,276 bytes in 7,731 files, 1,657,916 dated rows raw and 1,559,221 deduplicated, 60 PASS,
14 WARN, 4 FAIL, 0 IN-FLIGHT. Round two read 77 workspaces and 1,657,556 raw rows at 07:14Z; the
difference is the archive growing under the same rules.

## 4. The sweep

529 script files under `o1l-city/`, `node_modules` and the capture and probe trees excluded. 22 carry
an isha lift to 1440. Five declare isha inside a `const` list, which is the throwing form. Two of those
are live archive fitters and three are the audit's own archived evidence copies.

| file | sites | declaration | state |
| --- | --- | --- | --- |
| `us-states/fit_masjidal.js` | 42, 57 | `const` list | **BUGGY, live.** Archive file left as read-only instructed; patched copy at `fit/scripts/fit_states_let.js`, certified no-op |
| `us-unresolved/scripts/fit_debug.mjs` | 42, 57 | `const` list | **BUGGY, live debug twin.** Archive file left as read-only instructed; patched copies at `fit/scripts/fit_newark_let.mjs` and `fit_newark_repaired.mjs` |
| `us-unresolved/scripts/fit_masjidal.js` | 42, 57 | `let` | safe, patched at 05:53Z before its bank |
| `masjidal-global/fit2.js` | 51 | `let` | safe, wraps the scored side |
| `masjidal-global/masjidi_fit.js` | 38 | `let` | safe |
| `fitter-audit/scripts/fit_debug_buggy.mjs`, `fit_us-states_buggy.js`, `fit_us-unresolved_buggy.js` | 42, 57 | `const` list | **BUGGY by design**, archived evidence copies, never run as a bank |
| `fitter-audit/scripts/fit_debug_fixed.mjs`, `fit_us-states_fixed.js`, `fit_us-unresolved_fixed.js` | 42, 57 | `let` | safe, the audit's fixed copies |
| `fitter-audit/scripts/fit_us-unresolved_repaired.js` | 51 | `let`, lift on the day object | safe, the repair |
| `canada2/fit.js` | 82 | property `out.isha` | safe |
| `o1l-22/work/fit_mq.mjs` | 42 | property `rows[d].isha` | safe |
| `O1l-31/{dbg,dbg3,dbg4}.mjs` | 5, 7, 9 | property `s.chart.isha` | safe |
| `O1l-31/{fit-se,fit-multi,fit-classify}.mjs` | 38, 49, 27 | property `s.chart.isha` | safe |
| `O1l-31/dbg7.mjs` | 14 | ternary read, no assignment | safe |
| `integrity2/gen.mjs` | 232 | prose | safe, corrected this wave |

No other file in the tree carries the pattern. Every remaining fitter that touches 1440 near isha does
it through a property, a `let`, or a bidirectional modular diff.

## Defects

1. The round-two fitter paragraph was wrong on the score axis. Corrected in place and in the
   certificate.
2. The audit's row arithmetic is one high: the Newark block is 1,096 dated rows, not 1,097, so the
   drop reading is 2 years and 731 rows. Span and score conclusions do not move.
3. `us-states/out/fit_undefined.json`, 16 bytes of `{"years": []}`, an invocation with no tenant
   argument at 03:27Z. Scores nothing.
4. `masjidal-global/out/fit_*.json` is a stale run with +1440 residuals, worst 1,446 and 1,491. The
   bank is `out/f2_*.json`.
5. `athanpro` prints Cordoba with isha 34 minutes before its own maghrib on all 30 days and Brussels on
   29. A column-order defect, now separable from the wrap class by measurement.
6. Two masjidal captures hold an empty `general_setting`, so their zone had to be recovered by
   reproduction.
7. Five `masjidal-global` iqamah sheets pin a fixed isha clock the maghrib overtakes from April,
   1,122 rows. No fit consumes them.

## Limits

The two live archive fitters keep the `const` form because this wave may not write there. Their banks
are certified by re-run from patched copies, and any later round that re-runs them in place must carry
the patch first. The after-midnight measurement covers `data/` only, which is where fits read; the
capture layer was measured for the four trigger surfaces the audit named, not swept in full.

## NEXT

1. Patch the two archive fitters in place in the next round that owns the archive, `us-states` and
   `us-unresolved/scripts/fit_debug.mjs`, so no future re-run can take the throwing form.
2. Replace `us-states/out/fit_undefined.json` and retire `masjidal-global/out/fit_*.json`, so the
   stale +1440 set stops reading as a witness.
3. Feed the corrected Newark record into the closing fit index: `8KXm93LM` at 14.71 and 15.35 for
   2025, three years on one recipe, verdict unchanged.
