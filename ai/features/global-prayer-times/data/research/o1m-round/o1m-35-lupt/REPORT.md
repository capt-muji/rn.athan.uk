# O1m-35 — the LUPT 2027 asr break, measured, plus the LUPT-adopter audit

Captured and measured 2026-11-11, all timestamps UTC. Public pages only: no login, no form, no
captcha, no contact. Workspace `o1m/o1m-35-lupt/`. The repo was not touched.

## Headline: the rule-form

**LUPT carries no asr allowance in the 2026 print and a +2 minute allowance on BOTH asr columns
from 2027-01-01 through 2076.** The break falls on one of the five prayer columns, and on both of
its mithl variants (shadow-1 and shadow-2). Fajr, dhuhr, maghrib and isha keep their allowances
across the break, and sunrise is unchanged.

Against the publisher's own solar core (its Meeus sequence, Charing Cross, `+5` zuhr, `-3` sunrise,
`+3` sunset), on 365 days each:

| Column | 2026 print | 2027 print | Move |
|---|---|---|---|
| asr, mithl 1 | +0.44 min mean, 195/365 exact at 0, 166 at +1 | **+2.00 min, 365/365 exact** | **+1.6 min** |
| asr, mithl 2 | +0.61 min mean, 150/365 exact at 0, 208 at +1 | **+2.00 min, 365/365 exact** | **+1.4 min** |
| fajr (interval table) | -2.84 | -3.00 | -0.16 |
| sunrise | -2.84 | -3.00 | -0.16 |
| dhuhr | +0.13, 317/365 exact | 0.00, 365/365 exact | -0.13 |
| maghrib | +3.14 | +3.00 | -0.14 |
| isha (interval table) | +3.15 | +3.00 | -0.15 |

Read the last five rows as one fact: the 2026 generation is a slightly earlier build of the same
engine, scattering by a minute on the solar columns while keeping the same allowances. Only asr
gains a rule.

The publisher states the new rule itself, on its live technical page
(`captures/lupt-technical.html`, fetched 2026-11-10 and re-fetched 2026-11-11): under "adjustments
... to allow for this, also for elevations above sea level and for variations in atmospheric
refraction", the list is `Sunrise: 3 minutes earlier`, `'Asr: 2 minutes later`, `Sunset: 3 minutes
later`, `Zuhr: 5 minutes later`. There is no pre-rebuild copy of that page to compare against (see
Negatives).

## The O1f archive, found and read

The span ledger names `out-eps-2027` and `raw-2027`..`raw-2076`. They are in
`$HOME/athan-gitree/census/o1f-london/`, not in `o1l-city/`. The archive holds the fifty published
years as `raw-<year>.json` (Excel day fractions straight out of the publisher's workbook, sheet 2)
plus the solved-ephemeris working files. All fifty are copied to `captures/o1f-raw/` this wave.

The archive cannot answer the question on its own, and that is the whole reason the break stayed
unknown: **it starts at 2027.** There is no `raw-2026`, no 2026 row anywhere in the o1f tree, and
no report file in the directory at all. A read of O1f alone can only confirm that 2027-2076 is one
generation at +2. The 2026 side has to come from the two artifacts that still print it.

That read also settles the block's own stability: the same-MM-DD values repeat year for year, and
`fit/block-scan.mjs` scores all **18,263 days of 2027-2076 at exactly +2 on both asr columns with
zero deviations** (`data/block-margin-scan.json`). The allowance is constant to 2076, so **the break
is one step at 2027-01-01 and no second step exists in the block.**

## Evidence chain (every gate named)

| Artifact | Covers | How it is gated | Raw file |
|---|---|---|---|
| East London Mosque 2026 table, page states "Prayer times produced by London Salah Times" | 365 days of 2026, both mithls | live page re-fetched 2026-11-11: **365/365 identical on all seven columns** to the held table | `captures/east-london-mosque-2026.json`, `captures/elm-prayer-times-live.html`, `captures/elm-prayer-times-live-2026.json` |
| ICC 2026 print calendar (`ICC_Calendar_2026.pdf`) | Jan, Mar, Jun, Dec 2026, asr column | **123/123 asr cells identical** to the ELM 2026 table | `captures/` (held path `c38-uk2/captures/icc-print-calendar-2026.json`) |
| `LUPT-2027.xlsx` (publisher download) | 365 days of 2027, both mithls | live monthly pages 2027-01/02/04/07/11/12 match the workbook **181/181 on both asr columns** | `captures/lupt-2027.xlsx`, `captures/o1f-raw/raw-2027.json`, `data/live-2027-gate.json` |
| Baked app artifact `london-2026-2076.bin` | 2026-2076 | 2026 column **365/365 identical to ELM 2026**; 2027 column **365/365 identical to the workbook** | `data/artifact-2026-vs-2027-asr.json` |

Two independent 2026 artifacts (a mosque's live HTML table and a mosque's printed PDF, different
publishers, different media) agree on all 123 overlapping days, so the 2026 side is not one
surface's quirk.

## The break at the boundary, and its size

The last 2026 rows and the first 2027 rows are continuous dates, so the step at the join is
directly visible (`fit/boundary.mjs`):

```
2026-12-29  ELM2026   13:44  14:14   +1  +1
2026-12-30  ELM2026   13:44  14:15    0  +1
2026-12-31  ELM2026   13:45  14:15   +1   0
2027-01-01  LUPT2027  13:47  14:17   +2  +2   <- the break
2027-01-02  LUPT2027  13:48  14:18   +1  +1
```

The same window one generation later is the control, and it steps by one minute like any other day:

```
2027-12-31  LUPT2027  13:46  14:16   +1  +1
2028-01-01  LUPT2028  13:47  14:17   +1  +1
```

Size, isolated from the solar drift that a leap cycle puts between two same-MM-DD dates:
`excess = [2027 - 2026] - [2028 - 2027]` over 356 MM-DD pairs (nine dropped where the three years
sit on different sides of a DST edge) gives **+1.76 min mean on mithl 1 (sd 1.35, range -1..+5) and
+1.58 min on mithl 2 (sd 1.53)**, monthly means from +1.06 (January) to +3.63 (September). The
monthly swing is the leap-phase drift of a same-MM-DD comparison showing through, not a second rule.
The rule itself is the flat +2.00 of the 2027 block minus the 2026 print's own +0.44 and +0.61, and
the block hits 365/365 with residual sd 0.29, which is pure rounding noise.

Amplitude of the visible change, which is what a reader of the table sees: the printed asr steps +0.8
minute in January, +1.6 in June and +2.4 in August and September.

## What the live publisher serves now (2026-11-11 probe)

| URL | Result |
|---|---|
| `/` | 200, 74,685 B, year selector to 2076 |
| `/monthly/2027/01` | 200, `'Asr 1` 1:47, `'Asr 2` 2:17 on 2027-01-01 |
| `/monthly/2076/12` | 200, the far end of the block is live |
| `/monthly/2028/01` | 200 |
| `/monthly/2026/01/` | **301**, redirects to itself. 2026 is not served |
| `/downloads/LUPT-2027.xlsx` | 200, 70,171 B |
| `/downloads/LUPT-2028.xlsx`, `LUPT-2030.xlsx` | 200. Per-year workbooks are enumerable |
| `/downloads/LUPT-2025.xlsx`, `/downloads/LUPT-2026.xlsx` | **404**. No pre-2027 edition exists |

The full year range is served, 2028 workbooks are one request away, and every pre-2027 URL dead-ends.
The publisher moved the whole surface into the new generation and retired the old one.

## Adopter audit

The record's own taxonomy is about the **interval** columns, not the absolute rows: `F = sunrise -
fajr`, `I = isha - maghrib`, tested day by day against LUPT's two 366-entry arrays (fit14's
`englupt.json`). That distinction decides everything here, because **asr is not part of the interval
construction.** A surface that borrows LUPT's F and I arrays still computes its own asr from its own
latitude and longitude, so the +2 does not travel to it.

| Class | Surfaces | Carries the 2027 asr break? |
|---|---|---|
| **LUPT pointer** (prints London's absolute rows) | East London Mosque, ICC, MWH North London, West London Islamic Centre, Mayfair, WLICC and Al Muntada, Croydon ICT, Poplar PMCC, Al Manaar | **Yes.** +2 on both asr columns from its first 2027 row |
| **Stale pointer** | Portsmouth Jami Mosque, whose only artifact is `ELM_prayer_timetable_2016.pdf` (404 at the o1l-28 probe) | **No.** A 2016 print predates the 2026 generation and cannot carry the break until it republishes |
| **LUPT interval, own geometry** | Middlesbrough, and the offset towns Coventry, Bolton, Cambridge, Hull | **No.** F and I match LUPT exactly, but fajr and sunrise run +18.3 and asr -8.5 at Middlesbrough |
| **LUPT-family drift** | Birmingham, Blackpool, Brighton, Dudley, Ilford, Leicester, Luton, Oldham (OCMIC, Westwood), Preston, Reading, Rochdale, Stockport, Stoke, Cardiff, Bradford Victor St, Watford | **No.** Drift against the arrays, own solar columns |
| **Not LUPT** | Aberdeen (Central, Spital), Dundee, Glasgow, Bradford Hanfia, Nottingham, Oxford, Slough, Walsall | No transfer |

Three findings correct the record as it stands:

1. **Middlesbrough is not LUPT-exact in absolute time.** Its November 2026 print reproduces LUPT's
   F and I offsets at 0 on 30 of 30 days, which is what "LUPT-exact" was measuring, but its
   absolute columns are a northern-latitude table: fajr +18.3, sunrise +18.3, dhuhr +4.4, maghrib
   -8.0, isha -8.0, asr -8.5 against LUPT's shadow-1 row (range -10..-6). The o1k-wide headline
   "Middlesbrough's November print is LUPT itself" holds only for the intervals. It does not print
   a London asr and it will not inherit the break.
2. **West London Islamic Centre prints LUPT's 2-mithl column.** Its live go2masjid install carries
   51 dated rows (2026-11-11..12-31) where asr equals LUPT shadow-2 within 0.02 min (40/51 exact)
   while fajr is -0.5 and maghrib and isha are exact. So the adopter population splits by column:
   ELM and ICC print shadow-1, WLIC prints shadow-2. The break moved both columns by exactly +2, so
   both readings inherit it.
3. **asr cannot discriminate adoption, and the 2026 convention is the minority reading in London.**
   Measured across every London-area surface the census holds dated rows for
   (`data/london-asr-vs-lupt.json`), fourteen of sixteen reproduce one of LUPT's two 2026 asr
   columns within 2 minutes on at least 314 of their dated days. The two that do not are mawaqit
   Brent Anuur (+7) and Hackney Valide (+9).

   | Surface | Column | Days within 2 min of a constant |
   |---|---|---|
   | East London Mosque | shadow-1 | 365/365 |
   | London Central Mosque (ICC) | shadow-1 | 61/61 |
   | MWH North London | shadow-1 | 30/30 |
   | athanpro London Central, East, West | shadow-1 | 30/30 each |
   | mawaqit Chelsea | shadow-1 | 365/365 |
   | mawaqit Blackbird | shadow-1 | 364/365 |
   | mawaqit Al-Rahman | shadow-1 | 335/365 |
   | mawaqit Brent Islamic Centre | shadow-2 | 365/365 |
   | mawaqit Darul Quran | shadow-2 | 357/365 |
   | mawaqit Talimul Islam | shadow-2 | 314/365 |
   | mawaqit Plashet | shadow-2 | 365/365 at -1 |
   | West London Islamic Centre (go2masjid) | shadow-2 | 51/51 |

   On 2026-06-21 these print 17:25 for shadow-1 and 18:40 for shadow-2, which are LUPT's own
   2026 values with no allowance. The 2027 block prints 17:27 and 18:42 for the same day. So the
   publisher's +2 is a move away from the no-allowance convention that most London surfaces shared
   in 2026, and the app must not assume the rest of London followed.

## The break does not transfer through the interval tables

Empirical transfer test, which is the only direct one available: **no LUPT pointer serves a 2027 row
at this probe.** ELM's live page is 365 days of 2026 only, ICC's feed is current-year, and the
go2masjid forward window (a proven 365-day horizon to 2027-11-10) serves live 2027 asr rows at
exactly eight UK surfaces, none of them a pointer: Green Lane Birmingham, Hazrat Bilal Bristol,
Markazi Jamia Riza Huddersfield, Shahporan Bristol, Totterdown Bristol, Livingston Central,
Dewsbury Masjid-e-Umar, Shahjalal Bradford. Six of the eight print the 2-mithl column shifted by
their own longitude and latitude (+4 at Huddersfield, +8 at both Bristol, +8 at Dewsbury, +13 at
Livingston, all against LUPT shadow-2), Birmingham prints the 1-mithl column, and Shahjalal
Bradford's 2027 rows drift by a median of 2.5 hours against either column, the stale-offset class
(`data/go2masjid-2027-vs-lupt.json`). Not one reproduces a London row.

## The home-market answer: what the builder must do

The app's baked artifact carries the break today, and it carries it as a seam, because the 2026
column is ELM's old-generation table and the 2027 column is the publisher's new workbook:

| Column | 2026 baked vs the 2027 rule |
|---|---|
| asr shadow-1 | **all 365 days move**: +1 min on 165 days, +2 on 196, +3 on 4 |
| asr shadow-2 | 360 of 365 move: +1 on 209, +2 on 151 |

Same-MM-DD step inside the artifact, 2026 to 2027, excluding the eight days where the two years sit
on different sides of a DST edge (`data/artifact-steps.json`): asr moves +1 on 168 days, +2 on 146,
+3 on 33 and 0 on 11, mean +1.56. Every other column averages -0.14 min across the same join: fajr,
sunrise and dhuhr step 0 or -1, maghrib and isha step one minute in both directions and cancel. Only
asr carries a systematic move.

The consequence line, stated for the recipe:

- **The London recipe's asr margin is +0 through 2026-12-31 and +2 through 2076-12-31, applied to
  both mithl columns.** The value is not a fit residual: it is the publisher's stated allowance and
  it hits 365/365 days of the published block.
- **A 2026 re-bake cannot be sourced.** The publisher's 2026 pages 301-loop and its 2026 workbook
  404s, so the only 2026 witnesses are ELM's live table and ICC's paper. Keeping the baked 2026
  column is therefore correct, and the seam at 2027-01-01 is genuine publisher behaviour, not a bake
  error.
- **If a single rule is ever required across 2026-2076**, the 2027 rule applied backwards moves every
  2026 asr by 1 to 3 minutes and breaks the surfaces that printed the old generation.
- **Adopters**: a pointer that republishes inherits +2 on both columns. An interval adopter
  (Middlesbrough and the offset towns) inherits nothing, because its asr is its own geometry. A stale
  pointer (Portsmouth) prints a 2016 generation and inherits nothing until it republishes. Do not
  model "LUPT-family" as "LUPT times": the family is the fajr and isha intervals only.
- **The +2 is a convention shift, not a correction of an error.** Fourteen of sixteen London-area
  surfaces measured here printed LUPT's no-allowance asr in 2026. If the app ever imports another
  London surface's asr it must read that surface's own convention, never assume +2.

## Fit record (FIT-RULES)

- Span: 730 dated days, 2026 and 2027 whole years, plus the 2027-2076 block behind them (18,263
  deduplicated days in the prior read).
- Engines: adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`,
  `Rounding.None`, TZ `Europe/London`, dates from the literal capture strings, Charing Cross
  51.5073 / -0.12755. Corroborated by the publisher's own Meeus core (`fit/asr-break.mjs`,
  `fit/asr-margin-scan.mjs`).
- adhan 4.4.6 margins, mean over the year: 2026 asr1 +0.42 (range -1.0..+2.1), 2026 asr2 +0.62
  (-0.35..+1.85), 2027 asr1 +1.98 (0.17..3.75), 2027 asr2 +2.00 (0.70..3.28). The adhan spread is
  wider than the publisher-core spread because adhan's solar series is a different truncation of
  Meeus. The publisher-core scan is the instrument that resolves the rule, and it does so at
  365/365.
- Stability verdict: **one regime change, dated 2027-01-01, none after it to 2076.** All 18,263 days
  of the block score exactly +2 on both asr columns with zero deviations (`data/block-margin-scan.json`).
  Everything else is frozen: the interval tables and the sunrise, dhuhr and sunset allowances do not
  move across the break.
- Seasonal amplitude: the visible asr step runs +0.78 min in January, 1.63 in June and 2.43 in
  September, so midwinter hides about a minute of the rule change and late summer shows all of it.

## Negatives, recorded

- **Wayback holds nothing for this publisher.** CDX for `londonsalahtimes.com` returns zero captures
  (`captures/wayback-cdx-lupt.txt`, empty) while the same endpoint returns records for a control
  domain in the same call. The pre-rebuild site, including its 2026 monthly pages and its old
  technical note, is not recoverable there. Searched: domain root, `*` wildcard, `matchType=domain`,
  and the availability API for `/technical`.
- **No 2026 publisher artifact survives anywhere reachable.** Monthly pages 301, `LUPT-2026.xlsx`
  404, Wayback empty. The 2026 generation exists only as ELM's table and ICC's paper.
- **No LUPT pointer serves 2027 yet**, so the transfer is a rule consequence, not a measurement. The
  eight go2masjid surfaces that do serve 2027 are not pointers.
- **The o1f archive cannot close this question by itself** and did not: it has no 2026 rows and no
  report file.

## NEXT

1. **Re-probe ELM and ICC monthly** for their first 2027 rows. That is the day the transfer becomes
   measurable rather than inferred, and one request each.
2. **Bank the per-year workbooks** `LUPT-2028..2076.xlsx` (the URL pattern is proven) if a second raw
   witness to the block is wanted beside the o1f extraction.
3. **Correct the two records**: Middlesbrough's "LUPT-exact" is interval-only, and the UK surface map
   should name which asr column each adopter prints.
