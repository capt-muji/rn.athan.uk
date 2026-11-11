# O1m-46 fit-index refresh: the re-cut after the 12:34 cut

Registry wave, round o1m, 2026-11-11. Workspace `$HOME/athan-gitree/census/o1m/o1m-46-fitrefresh/`.
Job: re-run the index's own generator over the current state of every workspace so that the waves which
returned after the 12:34 cut contribute, and leave the 12:34 cut unedited beside the result.

Method: `build.py` and `build_md.py` are o1m-36's own, copied and re-pointed at
`FIT-INDEX-ROUND3B.md` / `.json`; the new material is one additional entry table,
`entries_refresh.py`, appended to the load order. Every string in it is transcribed from the wave's
REPORT.md or from the corrections register. Nothing was re-derived, nothing adjudicated, no web access,
no subagents, nothing under `/tmp`, the repository untouched, no clock read into data.

## Counts

| Measure | 12:34 cut | This cut |
|---|---:|---:|
| Entries | 154 | 162 |
| Countries and territories | 87 | 89 |
| Multi-country families (ZZ) | 15 | 16 |
| Grade A | 31 | 33 |
| Grade provisional | 85 | 90 |
| Grade candidate | 25 | 25 |
| Grade community | 11 | 11 |
| Grade measured | 2 | 3 |
| Span verdict yes | 33 | 33 |
| Span verdict no | 7 | 9 |
| Span verdict frozen-recomputed | 0 | 2 |
| Span verdict frozen-reprint | 5 | 6 |
| Untestable single-year | 80 | 81 |
| Untestable single-template | 8 | 9 |
| Untestable short-sample | 21 | 22 |
| Reconciliation rows | 59 | 81 |
| Flag rows | 15 | 23 |
| Conflict rows | 40 | 49 |

Verified rather than asserted: every one of the 154 entries in the 12:34 JSON is byte-identical in this
one (a key-for-key comparison of the two entry lists returns an empty difference), the entry schema is
unchanged (one key set across all 162), and the top-level JSON keys are unchanged too.

## What the returned waves contribute

**o1m-28 pakistan**: PK-CHART-25-CITIES. The 14-px digits were a reader limit: 25 cities, 9,120
chart-days, 63,227 cells, one 18.0/18.0 Hanafi pair with three margin sets, no banked cell more than four
minutes from the recalculated prayer, and O1l-12's hand-read Rawalpindi January matching 217/217. The
four "absent" cities exist. The federal dhuhr clock matches 0 of 365 days in all 26 charts, and the
unified 2026 calendar is still unpublished at a 12:20:53Z register probe. Provisional, because every
chart is one undated perpetual cycle; the family's agreement with tawkit's 453-city line is recorded as
corroboration, not as a second year.

**o1m-30 maghreb**: two entries and one cross-check. Algeria's 1448 book is a second recomputed Hijri
year on one recipe (219 verified days over eight months, 219/219 within-1 on all six columns, isha
17.00/0 ceil at 194/219 exact against the frozen description's 102/219), graded A with the deficit
stated. Tunisia gains a dated object whose span verdict is NO: 20 of 22 Kairouan/Sidi Bouzid delegations
moved to exactly 18.00/18.00 between 2025-12-16 and 2026-01-10, permanently, with the horizon untouched;
2027 is closed. The Maghreb cross-check is a measured row: four national lines against four platform
families, none reproduced at zero margins. Morocco and Libya contribute rows with no entry, because
neither produced a new fit: Morocco's pre-rebuild Wayback leg does not exist, and Libya has no year-2 on
any surface.

**o1m-32 caappeal**: KG-115-SETTLEMENTS. The whole published Kyrgyz set on one recipe, 41,975 rows,
median 99.5 pc within-1 across all six columns, with dhuhr transit +0.5 and asr Hanafi +2 named as
publisher constants. Frozen-reprint, because the endpoint is year-blind: 2026 against 2027 and 2030 gave
0 differences in 472 cells over January-February and 0 over all 365 days at two settlements. No entry was
written for Tatarstan's rolling two-year edition, Tajikistan's monthly dhuhr constant, Uzbekistan's
absent prayer route or Bashkortostan's retention boundary: each is a row here, none is a recipe.

**o1m-35 lupt**: GB-LUPT-ASR-BREAK-2027. The asr allowance is +0 through 2026-12-31 and +2 from
2027-01-01 on both mithl columns, stated on the publisher's own technical page and visible in the rows:
2026-12-31 prints 13:45/14:15 against 2027-01-01's 13:47/14:17, while the same-generation control steps
+1. Provisional, because each side of the seam is one year; the adopters are audited inside the entry
(Middlesbrough is interval-exact only and inherits nothing; West London Islamic Centre prints the
2-mithl column; 14 of 16 London-area surfaces printed the no-allowance convention in 2026).

**o1m-43 luptyears**: GB-LUPT-BLOCK-2076, graded A on fifty recomputed years: 18,263 days, asr exactly
+2 on 18,263 of 18,263 both columns, 127,838 of 127,841 cells exact with three half-minute ties named,
and 14,383 of 17,690 same-MM-DD rows moving between consecutive years at r 0.998 against the
publisher's core. That makes it one of the two `frozen-recomputed` verdicts the index now carries, and
it corrects O1m-35's "values repeat year for year".

**o1m-31 indonesia**: no new entry, and the reason is in the wave's own first line: its report calls
itself incremental with the harvest still running. What it did establish is recorded in R79: 518 units
enumerated, 2028 through 2030 served, every column within one minute of the Kemenag authority at the
paired units, Jakarta 2028 byte-identical to the held 366 rows, id 3212 listed with no table.

**Aruba**, which no post-cut wave returned but the corrections register names as a country new to the
record and the 12:34 cut had missed: AW-ORANJESTAD-SAVANETA, 365 rows at 14.8/14.8 Shafi, all six
columns within one minute. Folded for completeness, and flagged in the diff as such.

## Waves that returned without an entry

**o1m-29 kaznational** holds a report whose sections 2 to 8 are all still PENDING, while its fits landed
after the report was written. Under the in-flight rule it contributes nothing, and its in-flight row now
names exactly what a later cut can enter: the gazetteer (5,694 entries, 5,676 coordinates), the pull's
state (2,002 of 5,676 captured, 730,730 rows, 3,674 refusals) and the national fit on disk at ISNA 15/15
Hanafi over 935 settlement tables (86.2 pc exact, 99.9 pc within-1).

**o1m-37 decisions and o1m-42 corrections** measure nothing themselves. The decisions sheet's sixteen
items and the corrections register's 82 corrections, 31 new rows, 75 movements, 39 rule-forms and 22
flags are mapped by R76 and R77 rather than re-entered.

## Corrections made inside the cut's own text

Two rows are marked superseded instead of deleted, so the reader sees both readings: R17 (Pakistan's
charts blocked) by R60, and R54 (the Maghreb wave has not returned) by R63 to R68. The PK-TAWKIT-453
conflict now reads as corroboration. The Not fitted list loses Rawalpindi and Faisalabad, which are read,
and gains Quetta, Mardan, Peshawar, Swat, Morocco's December and 2027, Algeria's four lost months,
Libya's year-2, Uzbekistan's second year, Bashkortostan before 2025 and Tatarstan before 2025.

## NEXT

1. **The close names the final index.** `FIT-INDEX-ROUND3B.md` / `.json` is the current state;
   `FIT-INDEX-ROUND3.*` is the 12:34 cut and should not be shipped as the round's register. Copies of
   the two 3B files sit beside the 12:34 cut in `o1m-36-fitindex3/` (checksums identical); this
   workspace is canonical, because the generator and the new entry table live here.
2. **The three things the next cut can enter in one step**: o1m-29's national fit (blocked only on its
   own report), o1m-31's 518-unit myquran layer once the harvest closes, and o1m-39's four remaining
   Pakistan charts (Quetta's column map first).
3. **Two date and word choices belong to the close**: Bahrain's regime date (2021-08-05 or 2021-08-09)
   and whether the LUPT seam ships as one object with two regimes or as the two entries this cut carries.
4. **The ledger line for the close**: eight entries added, two of them A, both span proofs; twenty-two
   reconciliation rows; eight flag rows; nine conflict rows; no entry regressed.
