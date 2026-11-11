# O1m-43 — the LUPT fifty-year block, banked and verified

Captured, banked and measured 2026-11-11, timestamps UTC. Public pages only: no login, no form,
no captcha, no contact. Workspace `o1m/o1m-43-luptyears/`. The repo was not touched.

Successor to `o1m/o1m-35-lupt/`, which established the +2 asr rule-form at 2027-01-01 on both
mithl columns and found the O1f archive that holds 2027-2076. This wave banks all fifty years as
dated rows, verifies the rule across every one of them, settles the leap class, and decides what
the block's internal structure is.

## Headline

**All 18,263 days of 2027-2076 are on one recipe, and both asr columns sit at exactly +2 minutes
on every one of those days: 18,263 of 18,263, zero deviations, zero drift.** The other five
columns hold their 2027 allowances across the same span, with the largest continuous departure
from the rule anywhere in 127,841 cells at 0.5 minutes, which is the rounding quantum itself.
Three cells print one minute off, each a half-minute rounding tie inside a millisecond of the
tie, not a rule change.

## Coverage: what is banked

| Decade file | Years | Rows | Bytes |
|---|---|---|---|
| `data/lupt-2027-2036.json` | 2027-2036 | 3,653 | 260,640 |
| `data/lupt-2037-2046.json` | 2037-2046 | 3,652 | 260,569 |
| `data/lupt-2047-2056.json` | 2047-2056 | 3,653 | 260,640 |
| `data/lupt-2057-2066.json` | 2057-2066 | 3,652 | 260,569 |
| `data/lupt-2067-2076.json` | 2067-2076 | 3,653 | 260,640 |
| **Block** | **2027-2076** | **18,263** | **1.3 MB** |

Each file carries the full seven-column row for every calendar day, in printed minutes, with the
publisher, place, coordinates, time zone, column order, row count and the sha256 of every raw
source file in its `meta`. Column order is the printed order: fajr, sunrise, dhuhr, asr mithl 1,
asr mithl 2, magrib, isha.

Eighteen thousand two hundred and sixty-three days is the arithmetic of the block: 50 years of
365 days plus the 13 leap days of 2028, 2032, 2036, 2040, 2044, 2048, 2052, 2056, 2060, 2064,
2068, 2072 and 2076. The count matches the prior read exactly.

The dates are the publisher's own serials, resolved from the workbook's Excel date column, not
computed by this wave. The raw artifacts are in `captures/`:

- `captures/o1f-raw/raw-<year>.json`, the fifty workbook extractions from the O1f archive, copied
  whole with their sha256 in `data/o1f-sha256.txt`.
- `captures/workbooks/LUPT-<year>.xlsx`, all fifty per-year workbooks re-fetched live from
  `londonsalahtimes.com/downloads/`, 50 of 50 answered 200, `captures/workbook-fetch.log` records
  code, size and digest per year.
- `captures/live/monthly-<year>-<month>.html`, five monthly pages probed for the live gate.

## The +2, verified across every year

Instrument: the publisher's own Meeus core, carried unchanged from the o1m-35 harness
(`fit/lib.mjs`): the Meeus low-precision solar sequence evaluated at local noon, Charing Cross
51.5073 / -0.12755, the published interval table for fajr (87 to 121 minutes before sunrise) and
isha (63 to 97 minutes after maghrib), and the 2027 allowances applied as constants. Each printed
cell is compared with the core rounded to the nearest minute, so a residual is an integer minute
of departure from the rule.

| Column | Rule | Exact days | Off rule | Max continuous departure | Mean margin across years |
|---|---|---|---|---|---|
| fajr | -3 | 18,262 / 18,263 | 1 | 0.50 | -3.028 .. -2.977 |
| sunrise | -3 | 18,262 / 18,263 | 1 | 0.50 | -3.028 .. -2.977 |
| dhuhr | 0 | 18,262 / 18,263 | 1 | 0.50 | -0.012 .. +0.010 |
| **asr mithl 1** | **+2** | **18,263 / 18,263** | **0** | **0.50** | **+1.970 .. +2.014** |
| **asr mithl 2** | **+2** | **18,263 / 18,263** | **0** | **0.50** | **+1.962 .. +2.032** |
| magrib | +3 | 18,263 / 18,263 | 0 | 0.50 | +2.979 .. +3.027 |
| isha | +3 | 18,263 / 18,263 | 0 | 0.50 | +2.979 .. +3.027 |

The last column is the range of the fifty per-year mean margins, so a trend across the span shows
up as a spread rather than as a single number.

Read the two asr rows as the verification the wave was sent for: fifty years, both mithls, every
day, exactly +2. Read the "max continuous departure" column as the proof that nothing else moves:
the printed table is the rule plus one minute of rounding, and the widest continuous excursion
anywhere in the block is half of that rounding quantum.

Per decade, the same test, and the only three imperfect cells in the block fall in one decade:

| Decade | Days | fajr | sunrise | dhuhr | asr | asr 2 | magrib | isha |
|---|---|---|---|---|---|---|---|---|
| 2027-2036 | 3,653 | 3,653 | 3,653 | 3,653 | 3,653 | 3,653 | 3,653 | 3,653 |
| 2037-2046 | 3,652 | 3,652 | 3,652 | 3,652 | 3,652 | 3,652 | 3,652 | 3,652 |
| 2047-2056 | 3,653 | 3,653 | 3,653 | 3,653 | 3,653 | 3,653 | 3,653 | 3,653 |
| 2057-2066 | 3,652 | 3,651 | 3,651 | 3,651 | 3,652 | 3,652 | 3,652 | 3,652 |
| 2067-2076 | 3,653 | 3,653 | 3,653 | 3,653 | 3,653 | 3,653 | 3,653 | 3,653 |

Per-year scores are in `fit/year-<year>.json` (fifty files, one per year: exact, within-1, worst
deviation and its date, mean and sd margin, deviation histogram, Jan and Jul fajr means) and
`fit/block-summary.csv` (one row per year, machine readable), with the aggregate in
`fit/block-summary.json`.

### The three cells that are not the rule

| Date | Column | Printed | Core, continuous | Departure | Distance to a half-minute tie |
|---|---|---|---|---|---|
| 2057-02-10 | fajr | 343 | 345.499987 | -2.499987 | 0.0000134 min (0.8 ms) |
| 2057-02-10 | sunrise | 440 | 442.499987 | -2.499987 | 0.0000134 min (0.8 ms) |
| 2064-03-10 | dhuhr | 736 | 735.499998 | +0.500002 | 0.0000015 min (0.09 ms) |

All three are the publisher's build landing within a millisecond of a half-minute boundary and
rounding to the other side. The neighbours print on the rule on both sides of each day
(`data/boundary-days.json`), 2057-02-09 at -3.31 and 2057-02-11 at -2.67 continuous, which is the
ordinary daily rate of the margin. Neither day is a regime change and neither touches asr. Their
existence is the useful residue: it shows that the publisher's own generation carries ordinary
floating-point ties, so an exact-match test on this block has a ceiling of 127,838 of 127,841
cells for any independent reimplementation.

## The leap class

| Check | Result |
|---|---|
| Row count against the calendar | 50 of 50 years exact, 366 rows in each of the 13 leap years, 365 in each of the 37 common years |
| Missing days | 0 |
| Extra days | 0 |
| 29 February in a common year (the phantom class) | 0 in 37 common years |
| 29 February row on the rule grid | 13 of 13, all seven columns at their allowance |
| 29 February row distinct from 28 February and from 1 March | 13 of 13 on both sides |
| Leap-day step size against the ordinary step envelope | inside it, 1 to 3 minutes on every column |

The leap day is an ordinary row. It carries no copied values, its neighbours keep their own, and
the block never invents a 29 February outside a leap year. The mawaqit defect class, a phantom
29 February in a common year, does not occur anywhere in this block.

## The block's structure: one generation, recomputed per year

The question was whether the block is one generation recomputed per year or a frozen table
reprinted. The answer is one generation, computed once in July 2026, with each year of the block
recomputed from the ephemeris rather than copied from a frozen cycle.

Evidence, three independent lines:

1. **The generation stamp is identical in all fifty workbooks.** Every one of them carries the
   sentence "times & dates valid when generated in July 2026 – londonsalahtimes.com", and every
   one carries a `docProps` created stamp between 2026-07-04T13:25:25Z and 2026-07-05T16:49:35Z,
   in batches across the two days (`data/workbook-provenance.json`). One generation run, one year
   per workbook.
2. **Same-MM-DD rows move between consecutive years.** Across the 49 consecutive year pairs,
   17,690 same-MM-DD rows (DST-straddle dates excluded), 3,307 are byte-identical and 14,383
   differ. Mean absolute movement per column is 0.54 minutes on fajr and sunrise, 0.56 on magrib
   and isha, 0.46 on asr mithl 2, 0.36 on asr mithl 1, and 0.09 on dhuhr. A reprint moves nothing.
3. **The movement tracks the core day for day.** Correlating each MM-DD's printed value across the
   fifty years against the core's own value for the same dates gives r = 0.998 on fajr, sunrise,
   asr and asr mithl 2, 0.998 on magrib and isha, and 0.999 on dhuhr. The block follows the
   ephemeris, including the leap-phase sawtooth. A frozen table or a four-year cycle would give a
   flat series.

All 1,365 same-MM-DD differences above 5 minutes in the whole comparison are DST-straddle dates,
195 MM-DD pairs across the 49 year pairs where the two years' clock switches fall on different
dates (`data/block-structure.json`). No table defect hides in the large deltas.

The practical consequence: one recipe serves all fifty years (FIT-RULES grade A, on fifty distinct
fitted years, the strongest case the vocabulary has), and the app may treat 2027-2076 as one
regime. The rows still have to come from the publisher year by year, because no year is a copy of
another.

## Three independent witnesses

**The workbooks.** All fifty live workbooks were re-fetched and compared cell for cell against the
O1f archive extraction: **identical on every cell of all fifty years**, 18,263 rows and 127,841
cells, zero differences (`data/workbook-vs-archive.json`). The archive is faithful, and the
publisher's live downloads still serve the same generation that was extracted on 2026-11-10.

**The two renditions inside each workbook.** Every workbook ships sheet 1 in twelve-hour form and
sheet 2 in twenty-four hour form. Across all fifty years, **146,254 cells compared, zero
mismatches**: the twelve-hour sheet equals the twenty-four hour sheet exactly, modulo twelve hours,
in the stored double (`data/rendition-check.json`). The rendition class is closed, and the printed
mosque tables that copy the twelve-hour sheet carry the same values as the rows banked here.

**The live pages.** Five monthly pages were probed across the block, 2027-01, 2033-03, 2050-06,
2063-11 and 2076-12, and compared with the banked rows on a twelve-hour modulo, which is all the
pages print: **1,071 cells, zero mismatches** (`data/live-monthly-gate.json`). The far end of the
block is served live and matches the bank.

## The citable slice

The block is the home market's source of truth, it is small, and it is the one dataset in this
programme a London reader will check by eye. **Recommendation: ship all fifty years, as the five
per-decade files, with the fit summary.**

Into `ai/features/global-prayer-times/data/research/o1m/lupt-block/`:

| File | Why it belongs in git |
|---|---|
| `lupt-2027-2036.json` .. `lupt-2067-2076.json` (5 files, 1.3 MB) | the dated rows, compact JSON, self-describing `meta`, per-year sha256 of the raw source |
| `block-summary.json` | the aggregate fit: rule, per-column exact counts, max continuous departure, the two tie cells |
| `block-summary.csv` | one row per year, the table a reviewer reads first |
| `block-index.json` | year list, leap flags, row counts, per-year asr exact counts, raw digests |

Out of git: `captures/` (7.5 MB of workbooks and live pages), `fit/year-<year>.json` (fifty files,
200 KB, reproducible from `fit/emit.mjs`), and every other intermediate in `data/`. The fifty-year
rows fit in 1.3 MB, which is smaller than one round's fit index, so per-year splitting buys
nothing and costs fifty files to review.

## Fit record

- **Span**: 18,263 dated days, 2027-01-01 to 2076-12-31, all fifty years, one recipe.
- **Engine**: the publisher's Meeus core, as carried by the o1m-35 harness, with the publisher's
  printed interval table for the two interval columns. This is the engine that resolves the rule.
- **Corroborating engine**: adhan 4.4.6 at
  `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`, `Rounding.None`, tz
  `Europe/London`, Charing Cross, sampled at 2027, 2036, 2056 and 2076 (`data/adhan-block-margins.json`).
  Printed minus adhan: asr mithl 1 +1.98, +1.99, +1.99, +1.99 and asr mithl 2 +2.00, +2.02,
  +1.99, +2.03, so the +2 is a pure allowance on a core adhan already reproduces. Sunrise -2.98
  against its -3 allowance, and magrib +3.02 against its +3. Dhuhr +4.00 is the publisher's
  +5 minute zuhr allowance less about a minute of engine difference between adhan and the core.
  adhan's angle-based fajr and isha are not applicable to this table: LUPT's fajr and isha are
  intervals from sunrise and maghrib, so its fajr runs 87 to 121 minutes and its isha 63 to 97,
  and no angle reproduces them.
- **Stability verdict**: parameters frozen, rows recomputed per year. Every allowance is constant
  across the span, and the per-year mean margin stays inside a band of 0.06 minutes for every
  column (fajr -3.028 to -2.977, asr +1.970 to +2.014, magrib and isha +2.979 to +3.027). No
  trend, no second step, no regime change anywhere after 2027-01-01.
- **Seasonal amplitude**: mean fajr 376 to 377 minutes in January against 191 to 192 in July, a
  span of 184 to 186 minutes. The block's midwinter fajr sits 06:16 to 06:17 and its midsummer
  fajr 03:11 to 03:12, which is the amplitude any seasonal comparison of this surface must carry.

## Negatives

- **The O1f archive cannot witness 2026.** It starts at 2027. The pre-2027 generation is out of
  scope this wave and stays where o1m-35 left it, with ELM's live table and ICC's paper as the
  only witnesses.
- **No pre-2027 workbook exists** to test the block against an earlier build. `LUPT-2025.xlsx` and
  `LUPT-2026.xlsx` were 404 at the o1m-35 probe, and this wave did not re-probe them.
- **No monthly page for a year inside the block differs from the bank**, so the live gate cannot
  tell whether a page is rendered from this generation or from a separate one. The workbooks
  settle it in the affirmative.
- **The publisher's own engine is not published as source.** The Meeus core is a reconstruction
  from the o1m-35 harness and fits at 99.995 percent of cells exactly, with the three misses
  accounted for as ties. A different solar series inside the publisher's build cannot be excluded
  below the 0.5 minute rounding quantum.

## NEXT

1. **Re-probe ELM and ICC for their first 2027 rows**, as o1m-35 asked. That turns the adopter
   transfer from rule consequence to measurement, and it is the one open item on the London side.
2. **File the citable slice** at the round's close under
   `ai/features/global-prayer-times/data/research/o1m/lupt-block/` with the five decade files, the
   two summaries and the index, and record the block in the fit index as grade A, 2027-2076, one
   recipe, +2 on both asr columns.
3. **Correct the prior record's structure claim.** `o1m-35` wrote that "the same-MM-DD values
   repeat year for year". Measured across all fifty years, 81.3 percent of same-MM-DD rows move by
   a minute between consecutive years and the movement tracks the ephemeris at r = 0.998. The block
   is one generation with per-year recomputation, not a reprint.
4. **Carry the tie class into the fit index vocabulary.** Three cells of 127,841 print one minute
   off the rule because the publisher's build lands within a millisecond of a half-minute boundary.
   Any future exact-match test on this publisher should expect a ceiling of 127,838, so a later
   wave does not read those three as a break.
