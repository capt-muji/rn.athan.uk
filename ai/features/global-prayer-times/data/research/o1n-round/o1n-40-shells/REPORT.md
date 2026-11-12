# O1n-40 — turktakvim shell-only settlements: monthly and city-page route rescue (REPORT)

Wave O1n-40, round four (o1n), session three, 2026-11-12. All timestamps UTC.
Workspace: `$HOME/athan-gitree/census/o1n/o1n-40-shells/`. Run workspace
(`o1n-3-turktakvim/`) READ-ONLY throughout; nothing under /tmp; no subagents
deployed; ONE fetch process at a time through ONE token bucket at 4.7 req/s
(`scripts/ttfetch.py`, copied unmodified from o1n-32; verified byte-identical
to the original). Every request journaled to `data/journal-monthly.jsonl`;
every raw capture gzipped in place under `captures/`.

## 1. Mission and method

The turktakvim tree holds 1,885 shell-only settlements across seven countries
(norway 523 of 692, finland 896 of 971, iceland 301 of 301,
svalbard-and-jan-mayen 7 of 7, tonga 94 of 94, samoa 36 of 36,
wallis-and-futuna 28 of 28): settlements whose annual capture parses to ZERO
dated rows, so parse2's 300-row threshold banked nothing. The question: does
the publisher's monthly route (`index.php?link=aylikvakitler.php&cityID=<id>&
tarih=YYYY-MM-DD`) or the default city page (`index.php?cityID=<id>`, no link)
serve real tables where the annual route serves nothing?

Stages, each banked before the next:

1. **Identify** (`scripts/identify.py`): every settlement without a `.json`
   under the run workspace's `data/tt/<country>/`, classified by parsing its
   BANKED annual capture with the annual grammar (parse2.py's `parse()`,
   copied). Result: the classification is total — every one of the 1,885
   targets is a true zero-row shell; zero short tables (1-299 rows), zero
   unbanked full tables, zero missing captures. Banked:
   `data/shell-targets.json` (per settlement: name, city_label, class,
   capture path). The o1n exclusion resolved from BRIEF.md at runtime; the
   excluded territory carries no cities-world key and none of the seven
   countries is it.
2. **Probe** (39 requests, `data/plan-probe.json` → `data/probe-results.json`):
   - 23 settlements (norway 6, finland 6, iceland 6, svalbard 2, tonga 1,
     samoa 1, wallis 1) through the monthly route at `tarih=2026-06-01`;
     norway probe set includes 10115 Tana, the o1n-32 monthly-shell control.
   - 12 out-of-window probes: `tarih=2025-06-01` and `tarih=2027-06-01` for
     two settlements each of norway, finland, iceland.
   - 4 default-city probes (one per priority country).
   - Link inventories grepped from 12 banked annual shells per country
     (`data/link-inventory.json`): only `siteniz_icin.html`, `kitaplar.php`,
     `seslidinle.php` and static `html` — NO alternate vakit route exists in
     any served HTML for any of the seven countries. The monthly route and
     the default city page are the entire honest probe surface.
3. **Sweep** (`data/plan-sweep.json`): since zero probes served rows, the
   walk stage became a per-settlement single-month sweep — every remaining
   shell settlement fetched once at `tarih=2026-06-01` (1,864 requests,
   norway → finland → iceland → svalbard → tonga → samoa → wallis order, one
   process, one bucket, zero failures). Any settlement whose sweep month had
   served a table would have earned the full 12-month walk; none did.
4. **Parse and bank** (`scripts/parse-monthly.py`): the monthly grammar
   (learned from o1n-32's captures: 12 month-nav rows; 2-cell heading row
   [settlement (admin), MONTH YYYY]; 9-cell weekday header; 9-cell dated rows
   "day weekday" + 8 optional-asterisk times) applied to every capture.
   Banked per country under `data/rows/<country>.json` and counted in
   `data/rescue-counts.json`.

## 2. Verdict per country: the routes serve the identical computational void

**No rows were rescued, because no route serves any rows for these
settlements. This is the honest negative: the publisher genuinely computes
nothing for them, on every route probed.**

| country | shell settlements | monthly swept (2026-06) | dated rows served | verdict |
| --- | --- | --- | --- | --- |
| norway | 523 | 523 (6 probes + 517 sweep) | 0 | identical void, closed per settlement |
| finland | 896 | 896 | 0 | identical void, closed per settlement |
| iceland | 301 | 301 | 0 | identical void, closed per settlement |
| svalbard-and-jan-mayen | 7 | 7 | 0 | identical void, closed per settlement |
| tonga | 94 | 94 | 0 | identical void, re-proved per settlement |
| samoa | 36 | 36 | 0 | identical void, re-proved per settlement |
| wallis-and-futuna | 28 | 28 | 0 | identical void, re-proved per settlement |

(final per-country counts in `data/rescue-counts.json`; settlements gained: 0;
rows rescued: 0.)

## 3. What the shells actually are (shape evidence)

The shells are not generic error pages — they are per-settlement frames the
publisher renders while computing no times:

- **Annual route** (banked o1n-3 captures, ~12.9 KB, 2 closed `<tr`): the
  settlement's name IS in the body (Tana, Eidsvoll, Kumlinge, Eyrarbakki,
  Longyearbyen, Eua Kaufana Airport all verified), one month frame
  (`OCAK 2026`) and the weekday header row print, then nothing.
- **Monthly route** (~16 KB, 17 `<tr` substrings / 14 closed pairs): the
  settlement heading renders with its parent administrative string
  ("Tana (Finnmark / Norveç)", "Eua Kaufana Airport (Eua / Tonga)"), the
  requested month's label renders, the weekday header renders, and a single
  dangling "1 <weekday>" cell prints with NO time cells — the render loop
  breaks at the first day. Zero dated rows, every settlement, every month.
- **Default city route** (~22 KB, zero `<tr` anywhere): the settlement name
  and admin line render as an `<h1>`, and no table exists at all.

The publisher honors every parameter on every route and serves no times. The
o1n-32 verdict (shells stay shell, sampled 2 per country) is confirmed and
extended to EVERY shell settlement in the seven countries.

## 4. Second-year finding: negative (measured)

`tarih=2025-06-01` and `tarih=2027-06-01` serve the same zero-row frames for
these settlements; byte-diffs between the three years touch ONLY the heading
month label and the day-1 weekday label (4 diff lines total on the norway
10115 triple). The route frame honors the date parameter; the body has no
data for any year. No second-year (or prior-year) content exists on this
route for shell settlements. o1n-32's measured negatives stand unchanged:
2026-01..2027-01 is the whole serving window, and 2027-01 is a relabel clone
of 2026-01 where tables exist at all.

## 5. Discrepancy recorded: o1n-37's Pacific shell-probe artifacts

o1n-37's REPORT claims "the publisher serves the BYTE-IDENTICAL no-table
shell on ALL THREE routes" for tonga/samoa/wallis. Its banked probe captures
do not match that description: `shell-tonga-annual-82058.html.gz` is a
436 KB Istanbul-bearing page (391 closed `<tr`), `shell-tonga-monthly-
82058.html.gz` is a full Istanbul November 2026 table (54 KB, 44 rows —
Istanbul is the documented cityID-omitted fallback), and
`shell-tonga-city-82058.html.gz` carries the Istanbul h1. Their fetch URLs
evidently lost the cityID; the settlement name appears nowhere in them,
which is why the captures read as generic. Their CONCLUSION (publisher
computes nothing for those settlements) is nonetheless correct: this wave's
clean per-settlement probes re-prove it — tonga 82058 monthly with cityID
attached renders "Eua Kaufana Airport (Eua / Tonga)" + zero rows, and the
full Pacific sweep measured zero rows for all 158 Pacific shell settlements.
The o1n-37 closure stands, now on valid evidence.

## 6. Request ledger

- Probes: 39 (23 monthly-window, 12 out-of-window, 4 default-city), zero
  failures.
- Sweep: 1,864 requests, zero failures (two unintended Svalbard re-probes:
  the name matcher split on "-m" inside "jan-mayen"; harmless, journaled).
- Total: 1,903 fetches, one process, one bucket, 4.7 req/s ceiling, zero
  failures, 2026-11-12T11:29:30Z -> 11:40:55Z, 30.9 MB raw gzipped in place
  (journal: `data/journal-monthly.jsonl`).
- Reconciliation: journal fetch lines = captures on disk = 1,903, zero
  orphans either way; gzip spot-check 40/40 valid; all 1,885 banked
  settlements carry a rendered month heading (frame honored, body empty).

## 7. Honest negatives

- Alternate route names: none exist in any banked annual shell of the seven
  countries (inventories banked). Weekly/daily routes remain unadvertised
  and unguessed.
- Months outside 2025-06..2027-06 were not probed on this route; the
  measured frame behavior (parameter-blind body) plus o1n-32's window
  measurements make content outside the window unmotivated, but strictly
  "not probed".
- The annual route was not re-fetched this wave; its evidence is the o1n-3
  banked captures, parsed fresh for this classification.
