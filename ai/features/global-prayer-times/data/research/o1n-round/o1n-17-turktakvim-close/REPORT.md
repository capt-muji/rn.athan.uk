# O1n-17 — turktakvim close-out: the measured record at the owner's stop

Wave O1n-17, round o1n, 2026-11-11. Record workspace:
`$HOME/athan-gitree/census/o1n/o1n-17-turktakvim-close/`. The run lives in
`$HOME/athan-gitree/census/o1n/o1n-3-turktakvim/`; nothing there was refetched or
re-enumerated. Engine of record: **adhan 4.4.6**
(`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`) via `scripts/engine.mjs`.
All timestamps UTC. The repo was not touched. The territory exclusion holds everywhere;
the pipeline self-excludes at runtime and the excluded place is not named in any file of
this round.

**This wave ended on the owner's STOP-ORDER (dropped ~21:25Z, read 21:5xZ).** The
harvest stopped at journal index 103,047 of 112,854; the resume belongs to the next
session (`NOTICE.md` carries the exact commands). Everything below is measured on what
was held at the stop.

## 1. The tree, final true count

| measure | value |
| --- | --- |
| province filters enumerated | 3,243 (semicolon-fixed, o1n-3) |
| census entries | 181 (180 with settlements) |
| settlements | **112,854** |
| genuine zero entries | 1 (midway-islands) |
| UK slug collision | fixed in o1n-3 (England 125 + Northern Ireland 6 = 1,160) |

## 2. The harvest, measured

One process, one token bucket throughout (`scripts/harvest2.py`), resumed from journal
line 39,984 and walked to the owner's stop. Measured twice ~60 s apart mid-wave:
127 requests in 27 s = **4.70 req/s steady**, at the ceiling; the process's own progress
lines agree (4.64-4.69/s).

| measure | value |
| --- | --- |
| journal window | 2026-11-11T14:15:38Z → 21:43:55Z (7 h 28 m) |
| fetch lines | 109,945 (unique settlements fetched **109,442**, 97.0% of the tree) |
| duplicate fetches | across restart relaunches: empties and not-good captures refetch by design (`fetch()` skips only good captures) |
| skips (already good) | 4,500 |
| empty responses | **3,994** (3.6% of unique fetched) |
| failures | **0** |
| self-exclusion | journal carries `excluded-skip` 1 + correction 1 |
| walk position at stop | **103,047 of 112,854** (~9,807 order positions never attempted) |
| disk at stop | 55 GB free (watchdog floor 15 GB; never tripped; no STOP-position.json) |
| interruptions | two silent process deaths ~21:18Z and ~21:42Z before the stop order was read, then the owner's STOP-ORDER; the wrapper this wave armed was disarmed by the owner (`close-restart.sh.DISARMED-by-owner-stop`) |

## 3. The parsed row store at the stop

The full store was re-parsed this wave after the grammar fix below (marker reset,
complete re-read): **50,382 tables, 18,389,243 dated rows** banked under `data/tt/`
(coverage.json reads 50,382 tables / 18,389,243 rows; 50,412 docs total on disk). The
fix recovered **7,642 tables / 2,946,313 rows** the old grammar dropped or truncated
(pre-fix store: 42,740 tables / 15,442,930 rows). Captures for walk indices beyond the
last parse (~55k) through 103,047 are on disk, gzipped, unparsed: the next session's
`parse2.py` pass picks them up by marker, then everything below is superseded by the
close-out sequence in NOTICE.md.

## 4. The defect this wave found and fixed

`scripts/parse2.py` carried o1m-51's `HH:MM` row grammar and a 300-row floor. The
publisher prints polar-day cells with an asterisk prefix (`*00:11`, `*01:13`), so
high-latitude tables lost 100+ rows per year to the grammar and fell under the floor:
norway's 169 genuine annual tables parsed to 238 rows and were silently excluded, and
the banked store carried no norway, finland or greenland docs at all. Fixed in
`scripts/parse2.py` (two lines: the time pattern accepts an optional leading `*`, and
the stored value is stripped). The empty-shell detector is unaffected: the publisher's
no-table shell (12.7 KB, 5 `<tr`, zero parseable rows, no city label) still parses to 0
rows and stays excluded. `harvest2.py`'s `.empty.gz` name is a temp name only (renamed
onto the plain table name at write), so empties were measured from the journal and from
capture content, never from filenames.

## 5. The ladder, measured over the tree held at the stop

`scripts/fit.mjs --all` on the fixed store: **176 countries fitted** (the five skips
are the shell-only entries), **4,914 settlement fits**, each on 96 evenly spaced dates
of its own table, at points solved from the tables (latitude from printed day length,
longitude from the transit level, clock zone by minimum transit spread; median zoneMad
~0.05 min). **Every fit rests on exactly ONE distinct fitted year — the publisher's
single published 2026 cycle. All grades are provisional, platform tier, engine adhan
4.4.6.** Whole-tree distribution (count of settlement fits per integer-minute margin):

| column | n | distinct | mode | next values (count) |
| --- | --- | --- | --- | --- |
| fajr | 4,914 | 25 | **-1** (1,076) | 0 (646), -2 (573), +1 (478), +2 (366) |
| sunrise | 4,914 | 14 | **-5** (2,593) | -6 (1,032), -7 (550), -8 (241), -4 (160) |
| dhuhr | 4,914 | 18 | **+7** (1,695) | +8 (757), +10 (707), +9 (575), +11 (438) |
| asr | 4,914 | 18 | **+7** (1,726) | +8 (752), +10 (718), +9 (635), +11 (378) |
| maghrib | 4,914 | 14 | **+6** (2,556) | +7 (1,086), +8 (553), +9 (230), +5 (153) |
| isha | 4,910 | 22 | **+12** (1,503) | +11 (465), +10 (451), +9 (415), +8 (397) |

`data/ladder-final.json` (the run's `fit/ladder-summary.json`) carries every country's
distribution: median/min/p10/p90/max, counts per column, angle grids for fajr/isha,
isha-interval counts, asr-factor counts, seasonal fajr-sunrise drift.

## 6. Cross-checks, measured (pre-fix store; superseded by the next session's pass)

**athanpro: 907 shared settlements** (matched by distance ≤ 30 km at the platform's own
coordinates, September 2026 cycle). Printed-time deltas, turktakvim minus athanpro,
medians: **fajr 0, sunrise -5, dhuhr +7, asr +7, maghrib +6, isha +7** — the o1m-45
margin pattern held at 907 pairs. The anchor read (turktakvim's own year fit at the true
point, printed margins without derived-point absorption): **fajr +0.75, sunrise -4.92,
dhuhr +7.69, asr +7.67, maghrib +5.92, isha +8.56**. `data/crosscheck-athanpro.json`.

**Diyanet: 955 shared settlements** (name-matched within country, per-file dated
windows). Medians: **fajr 0, sunrise +1, dhuhr +4, asr +5, maghrib 0, isha +10**. The
isha column remains the family dispute; the solar columns agree within minutes.
`data/crosscheck-diyanet.json`. Both crosschecks ran on the pre-fix store (18:11Z, 42,740
docs), so the recovered norway/finland/greenland tables are not in these pairs.

## 7. The FALLBACK join, final state (all three rows gain a dated surface)

`fit/fallback-join.json` (14:59Z, the run's own artifact, copied to `data/`):

| row | tree presence | banked | ladder at solved point | second witness |
| --- | --- | --- | --- | --- |
| Cyprus south | selector entries Kibris + Guney Kibris as `cyprus`; northern-cyprus separate | 32 tables, 11,680 rows, 2026 cycle | fajr -4.5, sunrise -7, dhuhr +10, asr +10, maghrib +7.5, isha +12 | athanpro Nicosia within 30 km; Diyanet none (KUZEY KIBRIS only) |
| Western Sahara | no selector entry: served as the WESDERNSAHARA province filter under Fas (countryID 131) | 4 tables, 1,460 rows | fajr +2, sunrise -5, dhuhr +8, asr +8, maghrib +6, isha +7.5 | athanpro pair fails the 30 km match (the o1m-45 clock dispute); Diyanet absent |
| French Polynesia | selector entry Fransiz Polinezyasi (countryID 66) | 51 tables, 18,615 rows | fajr 0, sunrise -5, dhuhr +7, asr +7, maghrib +6, isha +8 | athanpro pairs none within 30 km in this pass; Diyanet absent |

Verdicts are platform-tier dated surfaces, one published cycle. The owner's FALLBACK
closure stays an owner ruling; this wave only supplies the surfaces.

## 8. The ten probe-empty countries, per-country empty share (FINAL)

Every settlement of all ten was fetched (no missing files); empty = the publisher's
no-table shell on disk. These shares are final regardless of the stop.

| country | settlements | tables | empty | empty share |
| --- | --- | --- | --- | --- |
| svalbard-and-jan-mayen | 7 | 0 | 7 | **100.0%** |
| greenland | 22 | 1 | 21 | **95.5%** |
| wallis-and-futuna | 28 | 0 | 28 | **100.0%** |
| samoa | 36 | 0 | 36 | **100.0%** |
| fiji | 79 | 72 | 7 | **8.9%** |
| tonga | 94 | 0 | 94 | **100.0%** |
| new-zealand | 294 | 282 | 12 | **4.1%** |
| iceland | 301 | 0 | 301 | **100.0%** |
| norway | 692 | 169 | 523 | **75.6%** |
| finland | 971 | 75 | 896 | **92.3%** |

The probe-time hypothesis held in direction, not degree: five of the ten are wholly
empty, fiji and new-zealand serve near-complete trees, and norway/finland's gaps are
the publisher's own choice of settlements — plus, before this wave's fix, its asterisk
rows had been silently dropping their tables from the store.

## 9. Not proven

- **Any second year.** Every table is the single published 2026 cycle; between-year
  stability and forward longevity are unproven for all 181 entries. Fits rest on one
  fitted year each: provisional until a 2027 cycle is harvested.
- **The publisher's coordinates.** None are printed; every point is derived from its
  own table. Derived points absorb printed margins: per-country margins are comparable
  through the one method, not absolute.
- **Why whole entries are empty.** Five entries (svalbard-and-jan-mayen, iceland,
  tonga, samoa, wallis-and-futuna) serve only the no-table shell on the annual-table
  route (`link=yillikvakitler.php&cityID=`), the only route walked. Not found under
  these terms: the publisher's monthly and city-page routes were not walked.
- **The tree's final ladder and final cross-checks.** The numbers in sections 5 and 6
  are the held-at-stop state (fits on the fixed store through the mid-walk parse;
  cross-checks on the pre-fix store), not the complete tree: ~9,807 order positions
  were never fetched. The next session's close-out sequence supersedes both.
- **The isha dispute's adjudication.** Measured, not adjudicated; owner-ruled.
- **The African tree.** Out of scope by design (o1m-4 holds it); no row here covers it.
- **Taiwan.** Out of scope by owner order until the owner says otherwise; nothing
  fetched, banked or fitted.
- **The territory exclusion.** Applied by runtime self-exclusion; the excluded place's
  row is absent from every count, fit and cross-check in this record.

## Assumptions

- The journal is the authority for fetch/empty/fail statistics; capture content is the
  authority for per-country empty share, because the walk renames its `.empty.gz` temp
  onto the plain table name (harvest2.py line 107). Evidence: journal `table:false`
  lines match the 0-parsed-row shells on disk exactly.
- The `*` prefix is the publisher's polar-day convention and the printed value is
  faithful data. Evidence: the same tables' non-asterisk rows parse clean; recovered
  tables lift to ~365 rows with consistent columns.
- `build-order.py` was not run: the enumeration did not move this session. Evidence:
  cities-world.json untouched; order length 112,854 equals the tree.
- The two silent deaths before the stop order were external (no traceback, no watchdog
  file, log ends mid-progress); the owner's STOP-ORDER and CLOSE-STATE.md name the
  session closure. Evidence: STOP-ORDER.md in both workspaces at 21:25Z; the owner's
  addendum answers the restarts this wave had already made.

## FINAL - the close-out sequence ran to completion (2026-11-12 ~04:2xZ, session three)

The harvest walk finished on 2026-11-12 ~03:5xZ (2,379 fetched + 7,427 skipped already-good,
0 fail, 0 empty - 100 percent of the tree's 112,854 positions), then NOTICE.md's sequence ran
in order. This section supersedes every number in sections 2, 3, 5, 6 and 7 above.

| measure | final value |
| --- | --- |
| tables | 108,676 (the interim store's 50,382 + 58,294 parsed from the walk's remainder; 1,627 short tables recorded) |
| dated rows | 39,666,128 |
| countries / with settlements | 181 / 180 (midway-islands the genuine zero) |
| settlements | 112,854 (100 percent fetched) |
| countries fitted | 176 (fit/ladder-summary.json; the five skips are the shell-only entries) |
| athanpro crosscheck | 956 pairs, medians: fajr +0.5, sunrise -5, dhuhr +7, asr +7.5, maghrib +6, isha +7 |
| Diyanet crosscheck | 1,059 pairs, medians: fajr 0, sunrise +1, dhuhr +5, asr +6, maghrib 0, isha +11 - the isha family dispute holds at tree scale |
| FALLBACK join | all three rows gain a dated platform surface: Cyprus south 32 tables / 11,680 rows; Western Sahara 4 / 1,460; French Polynesia 51 / 18,615. The owner's closure stays owner-ruled (D3) |

The ladder's whole-tree shape (176 countries, one published 2026 cycle, all provisional,
platform tier) now rests on the complete store: the polar margins are the wide tail
(finland sunrise -14 / dhuhr +21, norway -13 / +19.5, greenland's single table -13 / +21)
against the tropical core (sunrise -5, dhuhr +7, asr +7, maghrib +6 nearly everywhere).

Final artifacts copied into this workspace's data/ from the run's own outputs of
2026-11-12 04:1x-04:2xZ: coverage-final.json (the interim copy renamed
coverage-final-interim-2026-11-11.json), ladder-final.json, crosscheck-athanpro.json,
crosscheck-diyanet.json, fallback-join.json.
