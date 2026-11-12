# O1n-32 — turktakvim monthly route probe (2026-11-12, all timestamps UTC)

Wave O1n-32, round four (o1n), session three. Workspace:
`$HOME/athan-gitree/census/o1n/o1n-32-tt-monthly/`. Run workspace read-only; nothing
under `o1n-3-turktakvim/` modified; nothing under /tmp; no subagents deployed.

## 1. Route verdict

**The monthly route exists, is per-settlement, and serves dated tables — but it adds no
new dated records beyond the published 2026 cycle, and its one apparent extra year
(2027) is a relabeled clone of 2026.** Verdict: NOT a new record class at scale; it IS a
recovery surface for genuinely short annual tables, worth a targeted walk only.

- Route: `https://www.turktakvim.com/index.php?link=aylikvakitler.php&cityID=<id>&tarih=YYYY-MM-DD`
- The homepage nav carries both `link=yillikvakitler.php` and `link=aylikvakitler.php`.
- `cityID` is honored (5097 Falklands vs 125216 Turkiye served different, correct tables;
  omitting cityID falls back to Istanbul).
- `tarih` takes a full date and normalizes to its month (day 15 returns the same month
  table). Day 32 fails the request outright (unhandled error, retried 3x, journaled fail).
  A walker should always pass day 01.
- Coverage window: exactly 2026-01 through 2027-01 (13 months). 2025-12, 2027-02 and
  2027-03 render heading + weekday labels but zero dated rows (empty month shells).
- No month-of-fetch limitation: any 2026 month is directly addressable.

## 2. Shape findings

Identical grammar to the annual tables (stage-2 check passed):

- One month per page; heading row carries settlement name + parent administrative
  string, and the month label (`MART 2026`) in a right-aligned cell.
- Eight time columns: İmsâk, Sabâh, Güneş, İşrak, Öğle, İkindi, Akşam, Yatsı (9 cells
  with the date). Full month = 28-31 dated rows, 78 `<tr` per page, ~55 KB raw, ~42 KB
  mean across all fetches.
- The polar asterisk prefix is present and rendered in red (`style=color:#FF0000 >*00:52`),
  same convention as the annual pages.
- Table class `ddd`, cell class `zzz` — same shell classes as the annual grammar.
- Empty-month shell: 17 `<tr`, ~16 KB, month heading present, date labels absent.
- Month navigation on each page: twelve `tarih=2026-MM-01` links (current-year months,
  no cityID in them — a walker must re-attach cityID itself).

## 3. What the monthly rows are, relative to the annual bank

Proven by row-for-row comparison (date + all 8 times, exact string match):

| settlement | month | monthly rows | annual block rows | identical |
| --- | --- | --- | --- | --- |
| 5095 (falkland-islands) | 2026-03 | 31 | 21 | 21/21 |
| 8645 (kiribati) | 2026-02 | 28 | 28 | 28/28 |
| 16702 (turkiye) | 2026-06 | 30 | 30 | 30/30 |
| 6169 (united-states) | 2026-11 | 30 | 30 | 30/30 |

- **2026 months are re-serves of the annual page** for complete tables: identical rows.
- **annual-5095 is genuinely short** (81 dated rows on the annual page: Jan+Feb+March
  to day 22; months April-December absent entirely). The monthly route serves its full
  31-row March and all twelve months — a recovery of 284 dated rows for this one
  settlement.
- **The parse logs' "SHORT" flag is not a reliable shortness test**: annual-10116 was
  flagged SHORT (239 `<tr`) but carries all 365 dated rows; its monthly walk recovers
  0 rows. A date-cell audit of the annual bank is the honest shortness test, and it is
  local and free.
- **2027-01 is a relabeled clone of 2026-01**: all 31 rows carry identical times, only
  the weekday labels are recomputed. Proven on four settlements (5097, 8646, 10987,
  10988) at 31/31 identical rows each. The publisher's second year does not exist on
  this route; it reprints the 2026 cycle under 2027 dates. The close record's
  "any second year: not proven" finding stands — now measured and negative.

## 4. Availability sample (stage 3)

40 settlements across 20 countries, all twelve months of 2026 (480 requests) plus
2027-01 probes and route-matrix fetches: 497 fetches + 1 recorded fail, 21.1 MB raw,
05:39:39Z to 05:49:03Z, one process, one token bucket at 4.7 req/s, every request
journaled to `data/journal-monthly.jsonl`, captures gzipped in `captures/`.

| country | settlements sampled | monthly 2026 result |
| --- | --- | --- |
| afghanistan | 2 | FULL 12/12 both |
| australia | 2 | FULL 12/12 both |
| bahrain | 2 | FULL 12/12 both |
| botswana | 2 | FULL 12/12 both |
| brazil | 2 | FULL 12/12 both |
| falkland-islands | 2 | FULL 12/12 both |
| finland | 2 | SHELL both (0 rows, all months) |
| iceland | 2 | SHELL both |
| india | 2 | FULL 12/12 both |
| indonesia | 2 | FULL 12/12 both |
| japan | 2 | FULL 12/12 both |
| kiribati | 2 | FULL 12/12 both |
| norway | 2 | 1 SHELL (10115 Tana), 1 FULL 12/12 (10116) |
| philippines | 2 | FULL 12/12 both |
| samoa | 2 | SHELL both |
| svalbard-and-jan-mayen | 2 | SHELL both |
| tonga | 2 | SHELL both |
| turkiye | 2 | FULL 12/12 both |
| united-states | 2 | FULL 12/12 both |
| wallis-and-futuna | 2 | SHELL both |

27/40 settlements FULL (365 dated rows each across the year), 13/40 SHELL.

Cross-checks against the annual bank (read-only):

- All 13 monthly shells are also zero-table on the annual route. **The monthly route
  does NOT rescue the five shell-only countries** (iceland, samoa, svalbard-and-jan-mayen,
  tonga, wallis-and-futuna) — their availability is identical on both routes.
- Per-settlement availability matches the annual route exactly within the sampled
  countries: where the annual page serves, the monthly route serves; where it shells,
  the monthly route shells.

## 5. Scale plan (if the owner wants the recovery walk)

The monthly route's only unique value is restoring dated rows for settlements whose
annual page is genuinely short. Plan the walk in two phases, the first local and free:

**Phase A — short-table audit (local, no network, prerequisite).** Parse all 108,676
annual captures by date-cell count (`>NN Weekday</td>` regex), not by `<tr` count.
Output: `data/short-annual-ids.json`, the list of settlements with fewer than 365 dated
rows on their annual page. Two known ground truths to validate the audit against:
5095 → 81 rows (genuinely short), 10116 → 365 rows (complete, despite its SHORT flag).

**Phase B — targeted monthly walk.** For each audited-short settlement, fetch twelve
monthly tables. Machine parameters:

- URL template: `https://www.turktakvim.com/index.php?link=aylikvakitler.php&cityID=%s&tarih=2026-%02d-01`
- Parameter space: cityID from the Phase A list; month 1..12 of 2026 only. Never fetch
  2027 (proven clone), never other years (empty shells), always day 01 (other days
  normalize; invalid days error out).
- Estimated requests: if Phase A finds close to the logs' bound (703 SHORT-flagged in
  the surviving parse logs; the close report records 1,627 short tables), 703-1,627
  settlements x 12 = 8.4k-19.5k requests.
- Estimated hours at 4.7 req/s: 0.5-1.2 hours. Estimated raw: ~350-800 MB (mean 42 KB
  per page), gzipped ~15-30 percent of that.
- Command shape: reuse `scripts/ttfetch.py` as-is (it is the resumable walker — it
  journals every request to `data/journal-monthly.jsonl`, gzips each capture in place,
  retries 3x, and runs one bucket at 4.7 req/s), driven by a generated plan file:

```
python3 - <<'EOF'
import json
ids = json.load(open("data/short-annual-ids.json"))
json.dump([{"name": f"m-{cid}-2026-{m:02d}",
            "url": f"https://www.turktakvim.com/index.php?link=aylikvakitler.php&cityID={cid}&tarih=2026-{m:02d}-01"}
           for cid in ids for m in range(1, 13)],
          open("data/plan-recovery.json", "w"))
EOF
python3 scripts/ttfetch.py data/plan-recovery.json
```

- Resumability: rerun regenerates the plan; completed captures are overwritten, so for
  skip-if-good behavior filter the plan against `data/journal-monthly.jsonl` fetch lines
  first (the journal is the position record).
- Exclusion: Phase A must apply the runtime self-exclusion exactly as harvest2.py does —
  drop every id absent from `cities-world.json` (the excluded place carries no key).
- Verification per capture: settlement heading present, month label present, 28-31 dated
  rows, eight time columns, shells (17 `<tr`) recorded not retried.
- After Phase B: re-parse the recovered settlements into the store and reconcile their
  dated-row totals; expected recovery is bounded by ~(short settlements) x (365 - annual
  rows), worth ~10^5 rows if the genuinely-short class is near the log bound, possibly
  only a few thousand if the SHORT flag over-counted as badly on the full bank as it did
  on 10116.

**Do NOT run a full 112,854 x 12 monthly walk.** That is 1.35M requests, ~78 hours at
4.7 req/s, ~57 GB raw, to re-fetch dated rows already banked row-identical from the
annual route. The four-pair equivalence proof above is the evidence.

## 6. Honest negatives

- Route shapes tried: `aylikvakitler.php` (serves), with and without `tarih` (current
  month without; explicit month with), `cityID` omitted (Istanbul fallback), 2025-01,
  2025-12, 2027-02, 2027-03 (empty shells), day 15 (normalizes), day 32 (request fails).
- No other dated route name appeared in any fetched page: the site's visible `link=`
  inventory is `yillikvakitler.php`, `aylikvakitler.php`, plus non-table pages
  (`seslidinle.php`, `kitaplar.php`, `bilgiler.php`, `siteniz_icin.html`, static html).
  Weekly and daily route names (`haftalik*`, `gunluk*`) were not advertised anywhere in
  the banked captures or the homepage; they were not guessed beyond the mission's
  `aylikvakitler.php` candidate and remain "not found under these terms".
- Whether the ANNUAL route accepts a year parameter for a real 2027 cycle: not probed
  (the annual route is out of this wave's scope by order). The 2027-01 monthly clone
  makes a real 2027 cycle unlikely but does not prove its absence on other routes.


## PHASE B RESULT (2026-11-12, the coordinator's machine run)

The recovery walk fetched 468 monthly pages (36 candidates x 13 months, one bucket,
zero failures). The monthly route recovered **612 genuinely-new 2026 dated rows**
across the 36 short annual tables (17-18 missing days each - fetch-time truncations,
not publisher gaps) with **zero value diffs** against the held rows: every date both
sources serve agrees exactly, so the recovery is a clean restoration of the same
generation. The 1116 2027-01 rows are the relabel class the probe already proved
(identical times, recomputed weekdays), recorded as such, never new dated records.
Artifacts: data/short-tables-o1n.json (the audit list), data/plan-recovery.json,
data/recovery-o1n.json (per-row recovered/diff detail), scripts/audit-short.py,
scripts/recover.py.
