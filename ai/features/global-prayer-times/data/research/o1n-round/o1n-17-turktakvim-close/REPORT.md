# O1n-17 — turktakvim close-out: the measured record of the worldwide tree

Wave O1n-17, round o1n, 2026-11-11. Workspace for this record:
`$HOME/athan-gitree/census/o1n/o1n-17-turktakvim-close/`. The run itself lives in
`$HOME/athan-gitree/census/o1n/o1n-3-turktakvim/` and nothing there was refetched or
re-enumerated. Engine of record: **adhan 4.4.6**
(`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`) via `scripts/engine.mjs`.
All timestamps UTC. The repo was not touched. The standing orders' territory exclusion
holds everywhere; the pipeline self-excludes at runtime and the excluded place is not
named in any file of this round.

## 1. The tree, final true count

| measure | value |
| --- | --- |
| province filters enumerated | 3,243 (semicolon-fixed, o1n-3) |
| census entries with settlements | 181 |
| settlements | **112,854** |
| genuine zero entries | 1 (midway-islands) |
| UK slug collision | fixed in o1n-3 (England 125 + Northern Ireland 6 = 1,160) |

## 2. The harvest, measured

One process, one token bucket (`scripts/harvest2.py --walk 28585`, resumed from journal
line 39,984). Rate at the journal, measured twice ~60 s apart mid-close-out:
127 requests in 27 s = **4.70 req/s**, at the 4.7/s ceiling.

PENDING-FINAL-STATS

## 3. The parsed row store

PENDING-PARSE-TOTALS

## 4. The defect this wave found and fixed

`scripts/parse2.py` carried o1m-51's `HH:MM` row grammar and a 300-row floor. The
publisher prints polar-day cells with an asterisk prefix (`*00:11`, `*01:13`), so high-
latitude tables (norway, finland, greenland, and the same table shape wherever served)
lost 100+ rows per year to the grammar and fell under the floor: norway's 169 genuine
annual tables parsed to 238 rows and were silently excluded; the banked store carried no
norway, finland or greenland docs at all. Fixed in `scripts/parse2.py` (two lines): the
time pattern now accepts an optional leading `*` and stores the stripped value. The
parse marker was reset and the whole store re-parsed; every banked doc is the repaired
grammar's output.

The empty-shell detector is unaffected: the publisher's no-table shell (12.7 KB, 5
`<tr`, zero parseable rows, no city label) still parses to 0 rows and stays excluded.
`harvest2.py`'s `.empty.gz` naming is a temp name only (renamed onto the plain table
name at write), so empties were measured from the journal and from capture content, not
from filenames.

## 5. The ladder, measured over the whole tree

Per-settlement ladder fits at derived points (`scripts/fit.mjs --all`, 96 dates per
table, angle + integer-minute margin, isha as interval where the printed gap is a round
constant). **Every fit rests on exactly ONE distinct fitted year: the publisher's single
published 2026 cycle. All grades are therefore provisional, platform tier, engine adhan
4.4.6.** No year-2 accrual is possible from this surface alone.

PENDING-LADDER-DISTRIBUTION

## 6. Cross-checks, measured

PENDING-CROSSCHECKS

## 7. The FALLBACK join, final state

PENDING-FALLBACK

## 8. The ten probe-empty countries, per-country empty share

Measured from each settlement's final capture on disk (every settlement of all ten is
fetched; empty = the publisher's no-table shell).

PENDING-EMPTY-SHARE

The probe-time hypothesis (one settlement per country returning the shell) held in
direction but not in degree: five of the ten are 100 per cent empty, while fiji (72
tables) and new-zealand (282) serve near-complete trees, and norway/finland serve
partial trees whose gaps are themselves the publisher's own choice of settlements.

## 9. Not proven

In my own words, the honest negatives:

- **Any second year.** Every table in the tree is the single published 2026 cycle.
  Between-year stability, seasonal drift across years and forward longevity are
  unproven for all 181 entries; the fits' margins rest on one fitted year each and are
  provisional until a 2027 cycle is harvested.
- **The publisher's coordinates.** turktakvim prints none; every point in this record
  is derived from the table it belongs to (day length, transit level, zone rules). The
  derived points absorb the printed margins, so per-country margins are comparable
  through the one method, not absolute.
- **Why the five shell-only entries are empty.** The publisher serves its no-table
  shell for every settlement of svalbard-and-jan-mayen, iceland, tonga, samoa and
  wallis-and-futuna (and for most of greenland's). "Not found under these terms": the
  annual-table route (`link=yillikvakitler.php&cityID=`) is the only route walked;
  monthly or city-page routes of the same publisher were not walked this round.
- **The isha dispute's adjudication.** The family pattern (isha +10 against Diyanet,
  angle-vs-interval splits) is measured, not adjudicated; owner-ruled.
- **African tree.** Out of scope by design (o1m-4 holds it); no row here covers the
  50 African entries.
- **Taiwan.** Out of scope by owner order until the owner says otherwise; no row was
  fetched, banked or fitted.
- **The territory exclusion.** Applied by runtime self-exclusion in the pipeline; the
  excluded place's row is absent from every count, fit and cross-check in this record.

## Assumptions

- The harvest journal is the authority for fetch/empty/fail statistics; capture content
  is the authority for per-country empty share (filenames cannot distinguish empties).
  Evidence: journal `table:false` lines match the 0-parsed-row shells on disk.
- The `*` prefix marks the publisher's own polar-day convention and the printed value
  is faithful data. Evidence: the same table's non-asterisk rows parse clean and the
  recovered rows lift norway's tables to ~365 rows with consistent columns.
- `build-order.py` was not run at close-out: the enumeration did not move this session
  (no re-enumeration was requested or performed), so the order file still states the
  tree. Evidence: cities-world.json untouched; order length 112,854 matches the tree.
