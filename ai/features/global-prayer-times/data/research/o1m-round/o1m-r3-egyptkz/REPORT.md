# O1m-R3 — the span-ledger buys: Egypt past years and Kazakhstan unfitted years

Workspace: `$HOME/athan-gitree/census/o1m/o1m-r3-egyptkz/`. Leaf agent, round o1m, wave R3.
Inputs: O1l-14 (egypt-82), O1l-B1r (wayback-back), O1l-26r (kz-settlements), SPAN-LEDGER buys
#3 and #4. FIT-RULES binding: fits inside the wave, all years held, per-year scores, dated
regime changes never blended. The repo is untouched.

## FRONT 1 — EGYPT 2022-2025

### The replay claim is refuted; the ledger buy is corrected (dated negative, 2026-11-11)

The span-ledger buy #3 said `monthlymwaket.aspx` "replays any year with https + a browser UA +
the EXACT original URL including `:80`". Measured live this run:

- The form carries exactly two selects (city, month 0-12) and no year control of any kind
  (`captures/eg-get-monthlymwaket.html`, field inventory in the session log). A postback
  cannot carry a year, so a replay can only ever re-serve the current year.
- `http://www.esa.gov.eg:80/monthlymwaket.aspx` 301s to the https URL and serves identical
  bytes (10,693 B): the `:80` note is a redirect, not a route.
- Query-string year attempts were already proven byte-identical in O1l-14; not repeated.
- Wayback CDX for the whole domain: 1,891 urlkeys; `monthlymwaket.aspx` has 2 captures, both
  the Vodafone block page; `mwaket.aspx` (the 2018-era page, one capture 2018-09-23) archives
  as a shell — a 60-city select with no grid, nothing to replay.
- `praytimes.aspx` re-verified: one city select, a single today-row, no date control.
- `accurate.aspx` is a surveyor-certification page, not prayer.

**Verdict: ESA's interactive surface serves the current year only. 2022-2023 are unreachable
at authority tier; no full-year 78-city replay exists.** The ledger's buy #3 row should read
"current year only by postback; past years dead" — recorded here as the dated negative.

### BUT: ESA's own daily-sheet archive surfaces in Wayback (the actual past-year door)

The home page links a daily poster at `esa.gov.eg/monthly/<Y>/<M>/<D>.jpg` (the "توقيت مصرية"
sheet: 5 cities x 6 prayers, Arabic-Indic numerals, one day per image, 2400x2100 @300dpi).
Live behaviour (2026-11-11): the current month's days from yesterday onward serve; earlier
days and next month are wiped (2026-11-10..30 = 200, 2026-11-09 and 2026-12-01 = 404).

Wayback holds that poster's archive in depth: **578 distinct days** (2024: 109, 2025: 326,
2026: 143), enumerated in `data/eg-sheets-cdx.json` and downloading into
`captures/sheets/` (resumable driver `scripts/fetch-sheets.zsh`). That is ESA's own past data
at authority tier — 5 cities/day, not 78, and gappy — but it is the real 2024-2026 backward
harvest, and it was invisible to O1l-14's probe set.

### The daily sheet is a second ESA rendering, gated cell-exact (R5)

2026-11-11 sheet, all 30 cells transcribed and compared against the banked 2026 postback grid:
**30/30 exact** for Cairo, Alexandria, Tanta, Assiut, Aswan
(`captures/eg-monthly-2026-11-11.jpg`, transcription in `data/eg-sheet-ladder.json`).

### The sheet ladder (transcribed, dual-verified)

Six sheets transcribed to dated rows (`data/eg-sheet-ladder.json`), every cell cross-checked
against BOTH al-adkar (community, cell-exact to the recipe, 2024/2025) and adhan 4.4.6 at the
ESA implied points (o1l-14's recovered coordinates):

| date | worst |diff| vs al-adkar | worst |diff| vs adhan at implied pts | notes |
|---|---|---|---|
| 2024-08-19 | 1 | −1 | earliest archived sheet; Hijri header "13 Safar 1446" is decoration (Umm al-Qura: 14) |
| 2024-09-15 | 2 | +2 | the ±2s are coordinate deltas (al-adkar's own city points vs ESA implied), not misreads |
| 2024-11-07 | 1 | −1 | standard time (DST ended 10-31) |
| 2024-12-16 | 2 | −1 | |
| 2025-02-14 | 2 | −1 | 2025 blue-frame layout redesign |
| 2025-02-19 | 1 | −1 | |

**The sheet class prints DST civil time in summer (2024-08-19 evening cells carry the +60)
and standard time in winter — same convention as the 2026 grid.** No surface regime change in
the sheet's printing across 2024-2026; only the frame design changed (2025).

DST windows used everywhere (and confirmed by the fits): 2024-04-26..2024-10-31,
2025-04-25..2025-10-30, 2026-04-24..2026-10-29 (last Friday April to last Thursday October).

### The full-year community tier: al-adkar 2024+2025 banked and fitted (17 cities, 24,804 rows)

`/salat/<city>/<year>` serves full Gregorian years for 17 Egyptian cities (slug list in
`data/aladkar-slugs.txt`; Egyptian set: alexandria, aswan, asyut, beni-suef, cairo, damanhur,
hurghada, ismailia, luxor, mansoura, minya, port-said, qena, sohag, suez, tanta, zagazig).
Floor: 2024 (2021-2023 are 404s; 2024-2027 all serve). Pages captured raw (68 x ~550 KB).

Parser (`scripts/aladkar-parse.js`): rows carry Gregorian day-of-month + Arabic weekday +
a Hijri label; dates reconstructed as Jan 1 + row index, proven by weekday continuity on
every row and by month lengths (366 rows in 2024, 365 in 2025-2027). **DEFECT (new): the
Hijri label column is a static month decoration (all rows repeat one month's day cycle),
never a per-row Hijri calendar — do not read it as data.**

**GATE 2026 vs the ESA authority grid (17 cities x 365 days x 6 = 36,864 cells):**
fajr 282/365 exact per city class (all diffs +1), sunrise 288, maghrib 335, isha 313, asr 229
(diffs ±1), dhuhr 0/365 exact with a steady +1.2 mean (the unzeroed library preset) —
`fit/aladkar-gate-fit.json` holds the full per-column, per-month table. No seasonal block, no
DST error: the derivative tracks Egypt DST exactly.

**FIT 2024+2025 (adhan 4.4.6, ESA recipe 19.5/17.5 Shafi zero margins, Rounding.None,
nearest, TZ per DST window, at the derivative's own JSON-LD coordinates):**
every city, every year: **5 of 6 columns exact on every single day (worst 0), dhuhr exactly
+1 on every single day (worst 1); overall 83.33% exact / 100.00% within-1; between-year
stability frozen 2024→2025 (the +1 identical both years).** The derivative IS the ESA recipe
run at its own coordinates with the one recorded preset margin — nothing else.

Egypt rows banked this wave: ladder 6 sheets x 30 cells (authority) + al-adkar 17 cities x
(366+365+365+365) days (community, full years 2024-2027, the mission's 2024-2025 target years
included) + the 578 raw Wayback sheets preserved for full transcription (NEXT).

## FRONT 2 — KAZAKHSTAN

### The engine is byte-stable; every new year and every new settlement gated live (109/109)

Fresh `prayTimes.js` fetched 2026-11-11: md5 `9541aeec36f1a75ef07097195b0d794a`, **identical
to the O1l-B1r capture**. The page's inline kmdb logic (ISNA 15/15, Hanafi asr, AngleBased,
sunrise −3/−5 and dhuhr/asr/maghrib +3/+5 at 48 N, dst `auto`) re-read from the live page and
unchanged.

Engine harvest (`scripts/kz-harvest-r3.js`, served script in a VM, dst forced 0): **105,128
new dated rows**, 288 city-years, `data/kz-<key>-<year>.json`:
- Astana 2020-2024 + 2031-2040 (15 years; the mission's unfitted years and ladder),
- Petropavlovsk (54.86 N) 2020-2027 + 2031/2033/2035/2037/2039/2040 (14 years, first bank),
- all 86 remaining publisher-list settlements (the full 96-list minus the 10 already banked)
  at 2025-2027,
- the 48 N boundary settlements shalkar 47.83, zhezkazgan 47.80, satpaev 47.91 (set A) and
  the publisher's own unnamed entry id 5737 at 48.33 (set B) additionally at 2035.

Self-check: my Astana 2033/2035/2040 re-derivation vs the O1l-B1r files: **6,576 cells, 0
diffs.**

Live gates (`scripts/kz-live.js`, agent-browser session o1m-r3, page's own `timesByPeriod`
with getDst forced 0, raw renders in `captures/kz-live-*.json`): **109/109 city-years
rendered live and matched the engine rows cell-for-cell, 0 differing cells** — Astana every
new year 2020-2040, Petropavlovsk 2020/2024/2035/2040, every new settlement 2026, the four
boundary settlements 2035. The named residual risk (a changed script changes the table with
no year boundary) is measured and absent this session: the served page reproduces the served
script across 21 years of span and 90 settlements.

### Fit (adhan 4.4.6, ISNA 15/15, Hanafi, TwilightAngle, margin block, Rounding.None)

`fit/kz-fit-summary.json`, per-year and per-city: **630,768 cells, exact 87.32%, within-1
100.00% minus exactly ONE cell, worst 8.** Set A (114 city-years <48 N): mean exact 90.09,
worst 1. Set B (174 city-years ≥48 N): mean exact 85.51, worst 8. Astana per-year exact
85.29-87.03 with no drift across 2020-2040 (the 2031-2040 ladder holds the same constants:
**no drift, verdict frozen**). Asr is the weak exact column everywhere (49-62%), dhuhr
99-100% — the recorded rounding-grid signature, unchanged.

**The one cell outside within-1: petropavlovsk 2039-07-23 isha, 8 min — the TwilightAngle
clamp boundary at 54.86 N.** The publisher's own prayTimes AngleBased clamp resolves it;
adhan's TwilightAngle diverges on that single day in 14 Petropavlovsk years. Recorded, never
smoothed; at every settlement ≤53.2 N the two rules are within-1-equivalent across all years.

### The 48 N line, densified

Below the line, added: shalkar 47.831, zhezkazgan 47.800, satpaev 47.907 (all set A, exact
86.4-89.2%, worst 1). Above: karazhal 48.001 (banked) and none-5737 48.333 (set B, exact
87.3-88.7%, worst 1). The publisher's own list carries no settlement between 48.00 and
48.33, so the line is now bracketed by measurements at 47.80 / 47.83 / 47.91 / 47.97 (A) and
48.00 / 48.33 (B) — the hard-switch reading of O1l-26r stands, denser on both sides.

## Deliverables

- `captures/` — ESA live probes, the 2026-11-10..30 daily sheets, the 2026-11-11 sheet crop,
  Wayback sheet archive (`captures/sheets/`, 578 target, download resumable and in progress),
  al-adkar 68 pages, muftyat page + prayTimes.js + scripts.js, 109 live-render JSONs,
  CDX enumerations.
- `data/` — eg-sheets-cdx.json (578 days), eg-sheet-ladder.json (transcribed, dual-verified),
  aladkar-<city>-<year>.json (68 files, 24,804 rows), kz-<key>-<year>.json (288 files,
  105,128 rows), kz-new-settlements.json (publisher coordinates + set flags).
- `fit/` — aladkar-gate-fit.json, kz-fit-summary.json.
- `scripts/` — fetch-sheets.zsh, crop-sheet.zsh, aladkar-sweep.zsh, aladkar-parse.js,
  aladkar-gate-fit.js, kz-harvest-r3.js, kz-live.js, kz-fit-r3.js.

## Negatives (all dated 2026-11-11)

- ESA past-year replay: no year control on the form; `:80` is a redirect; Wayback
  monthlymwaket = block pages only; 2018 mwaket.aspx archived as a shell. **2022-2023 remain
  unreachable at authority tier.**
- ESA daily-sheet window: current month from yesterday onward only; 2026-12-01 already 404.
  Forward horizon one month; a standing month-start fetch banks the next month's sheets.
- al-adkar years before 2024: 404 (2021, 2023 probed; 2022 404 at first probe).
- al-adkar Hijri labels: static decoration, not data (defect, not a negative).
- Petropavlovsk 2039-07-23 isha: the single clamp divergence (8 min), publisher AngleBased vs
  adhan TwilightAngle.

## NEXT

1. Finish the 578-sheet download (in progress, ~40%), then transcribe the full ESA sheet
   archive with the proven crop pipeline (`scripts/crop-sheet.zsh`, 2 crops/sheet,
   al-adkar ±2 gate per cell) — a ~5-city authority ladder over 2024-2026.
2. Transcribe the 2026-02-18 and 2026-02-19 sheets when they land: the sheet's own Hijri
   header on the Ramadan-split pair documents what the poster printed (the trap: the sheet's
   Hijri marker is a decoration, the 02-18 grid column is ESA's own — record both, never read
   the marker as the announcement).
3. 2025 summer/autumn ladder sheets (07-19, 10-19) for the DST-turn coverage in the ladder.
4. Fold the sheet-ladder rows and the al-adkar 2024/2025 verdict into the world-table Egypt
   row: authority tier gains a 2024-2026 dated presence (5 cities), the ledger buy #3 line
   corrects to "current year only by postback; daily-sheet archive in Wayback is the past door".

---

## O1m-R3 CONTINUATION (from 2026-11-11 09:47Z)

Resumed after the provider cancellation. Nothing banked by the first pass was redone. Every
figure below was measured this session and every raw artifact is on disk.

### Verification of the banked state (before touching anything)

- 290 `data/kz-*.json` files, 68 `data/aladkar-*.json`, 2 `fit/` files, 361 data files, 546 MB.
- Independent self-check of the whole Kazakhstan harvest: **288 city-years, 630,768 cells
  re-derived from the captured `captures/kz-prayTimes.js` under the page's own margin block,
  0 cells differing.** The banked rows are reproducible from the captured engine alone.
- The sheet download was dead at 339 images with no `sheets.done`: the driver used the Wayback
  `im_` modifier, which resolves to the archive root (a 145,566 B HTML page) instead of the
  payload. Fixed by switching to `<ts>id_` and resuming; see FRONT 1.2.

### FRONT 1.2 - the ESA daily-poster archive completed (563/578)

Driver `scripts/fetch-sheets2.zsh`, resumable, 4 s spacing, two attempts per key.

| year | archived days | banked | refused |
|---|---|---|---|
| 2024 | 109 | 108 | 1 |
| 2025 | 326 | 312 | 14 |
| 2026 | 143 | **143** | 0 |
| total | 578 | **563** | 15 |

Refusal classes (`logs/sheets-fail2.log`): 12 replay 404, 2 connection failures, 1 HTTP 200 that
is not a JPEG. Twelve of the fifteen sit in one contiguous block, 2025-09-17 to 2025-10-01, which
reads as a publisher outage inside the capture window rather than a per-day gap. `2024-09-20`
answers 200 with a non-image body. All fifteen are dated negatives, not blanks.

The whole 2026 selection the archive holds is now downloaded (143 days), so the 2026 authority
ladder is complete in the sense that nothing archived is missing. It is not continuous: it runs
in 10 blocks, the longest 2026-01-01..2026-02-15 (46 days), 2026-04-12..2026-05-20 (39),
2026-03-10..2026-03-31 (22) and 2026-02-18..2026-03-08 (19).

### FRONT 1.3 - sheet ladder extended: 13 more authority days, 570/570 cells gated

`data/eg-sheet-ladder-r3b.json`, `-r3c.json` and `-r3d.json`, transcribed cell by cell
from the posters, gated by `scripts/eg-ladder-gate.js` against both al-adkar (community) and
adhan 4.4.6 at the ESA implied points (`fit/eg-sheet-ladder-gate.json`):

| date | clock | why it matters | worst |diff| vs al-adkar | worst |diff| vs recipe |
|---|---|---|---|---|
| 2024-10-31 | DST +3 | last DST day 2024 | 2 | 2 |
| 2024-11-01 | +2 | first standard day, the -60 turn | 2 | 2 |
| 2024-12-21 | +2 | winter solstice | 2 | 2 |
| 2025-01-15 | +2 | mid-winter | 2 | 2 |
| 2025-03-01 | +2 | Ramadan 1446 day 1, Ramadan layout | 2 | 2 |
| 2025-03-29 | +2 | Ramadan 1446 day 29, Ramadan layout | 2 | 2 |
| 2025-03-30 | +2 | THE SPLIT, see 1.5 | 2 | 2 |
| 2025-04-24 | +2 | day before the 2025 DST start | 2 | 2 |
| 2025-04-27 | DST +3 | first held DST day, every cell carries the +60 | 2 | 2 |
| 2025-06-21 | DST +3 | summer solstice | 2 | 2 |
| 2026-02-18 | +2 | Ramadan 1447 day 1, the counter lags, see 1.5 | 2 | 2 |
| 2026-03-20 | +2 | Eid al-Fitr 1447, the counter agrees | 2 | 2 |
| 2026-04-26 | DST +3 | first archived 2026 DST day, completes the turn in all three years | 2 | 2 |

**570 cells, 19 sheets, no cell beyond 2 minutes on either side.** The DST turn is printed by the
poster itself in both directions: Cairo maghrib 18:09 on 2024-10-31 and 17:08 on 2024-11-01 (a
-61 for a one-day solar drift of +1), fajr 03:45 on 2025-04-24 and 04:42 on 2025-04-27 (+57 over
three days of drift).

The gate earned its keep on the 2026-03-20 sheet: the first pass read Asyut sunrise as `05:09` and
the Asyut/Alexandria fajr cells 10 minutes low, and the gate flagged all three against al-adkar.
A zoomed re-crop at 1.6x resolved them to `05:59`, `04:35` and `04:36`, and the sheet now passes.
Reads are only banked once the gate passes.

Two defects recorded from the posters, both cosmetic: the 2024-10-31 edition strikes a diagonal
through the `المدينة والتوقيت` header cell, and the 2025-01-15 edition renders the isha header as
a mangled ligature (`المنثان`). In both cases the column's values are the ordinary isha column.

The Ramadan layout adds two columns the standard layout does not print, `سحور` and `إساك`, and
holds fixed offsets on every city of every Ramadan sheet: **imsak = fajr - 20, suhur = imsak -
120**.

### FRONT 1.4 - the authority past-year door: ESA's own imsakiya PDFs (NEW, 2024/2025/2026)

The archived domain carries a surface the first pass did not reach: `esa.gov.eg/emsakya/`, the
national imsakiya, one PDF per Hijri year, one page per city, the whole Ramadan month with
fajr, sunrise, dhuhr, asr, maghrib, isha, imsak, suhur and fast length.

| file | Wayback | bytes | pages | Ramadan served |
|---|---|---|---|---|
| `emsakya/1445.pdf` | 20240313154903 | 23,116,512 | 77 | 2024-03-11..2024-04-09 (30 days) |
| `emsakya/1446-2.pdf` | 20250218164930 | 36,161,877 | 90 | 2025-03-01..2025-03-29 (29 days) |
| `emsakya/1447.pdf` | 20260205141154 | 19,558,023 | 78 | 2026-02-18..2026-03-19 (30 days) |

Live probing: `emsakya.aspx` and `emsakya/<hijri>.pdf` are 404 on the live host today, so the
archive is the only door. `emsakya/1446.pdf` (Wayback 20250212015833) replays **truncated at
exactly 1,048,576 bytes**, so the `1446-2` edition was taken instead and the truncation is
recorded as a capture defect.

Page images are extracted losslessly with `scripts/pdf-extract-jpeg.py` (the 1445/1447 files
carry `[/FlateDecode /DCTDecode]`, an inflate then a JPEG, which is why a naive stream scan finds
nothing), 77/90/78 images into `captures/emsakya/pages-<hijri>/`. Page 004 is Aswan in all three
editions, confirmed by cropping the title strip of each.

**Transcribed: Aswan all three Ramadan months plus Alexandria for 1445, 119 days, 714 gated
cells** (`data/eg-imsakiya-aswan.json`, `data/eg-imsakiya-alexandria-1445.json`,
`fit/eg-imsakiya-gate.json`):

| city | Hijri | span | days | exact vs recipe | within-1 vs recipe | worst vs al-adkar |
|---|---|---|---|---|---|---|
| aswan | 1445 | 2024-03-11..2024-04-09 | 30 | 90.56% | **100.00%** | 1 |
| aswan | 1446 | 2025-03-01..2025-03-29 | 29 | 91.38% | **100.00%** | 2 |
| aswan | 1447 | 2026-02-18..2026-03-19 | 30 | 79.44% | **100.00%** | 2 |
| alexandria | 1445 | 2024-03-11..2024-04-09 | 30 | 72.22% | **100.00%** | 2 |

**The 19.5/17.5 Shafi zero-margin recipe reproduces the authority's own imsakiya at every cell of
three Ramadan months across three years and both ends of the country, worst 1 minute.** Aswan is
23.9 N and Alexandria 31.2 N, the southern and northern ends of the served span, and each passes
100% within one minute at its own coordinates. The per-column worsts are +-1 in every year and
every column, with no year carrying a systematic offset: no margin, no angle change and no regime
change inside 2024-2026. The imsak and suhur offsets hold on all 119 printed rows.

This is the first authority-tier dated presence Egypt holds for 2024 and 2025. It covers Ramadan
only, 78 cities of the 82 options, and it was invisible to the postback probes because the PDFs
live under a path the select-based sweep never requested.

### FRONT 1.5 - the Ramadan Hijri split, measured against the announcement

Both ESA renderings are banked at both Ramadan boundaries, and the two of them disagree with each
other in both years. Which one matches the announced month is settled by the announcing body:

| date | poster prints | imsakiya prints | Dar al-Ifta announced |
|---|---|---|---|
| 2025-03-01 | `١ رمضان ١٤٤٦` | row 1 = 1 Ramadan, 2025-03-01 | 1 Ramadan = 2025-03-01 |
| 2025-03-29 | `٢٩ رمضان ١٤٤٦` (Ramadan layout) | row 29, last row of the table | not the last fast |
| 2025-03-30 | `٣٠ رمضان ١٤٤٦` | table already ended | the completion of Ramadan, Eid on 2025-03-31 |
| 2026-02-18 | `٣٠ شعبان ١٤٤٧` | row 1 = 1 Ramadan, 2026-02-18 | last day of Sha'ban, Ramadan starts 2026-02-19 |
| 2026-03-19 | not held | row 30, last row of the table | the last fast |
| 2026-03-20 | `١ شوال ١٤٤٧` | table already ended | Eid al-Fitr = 2026-03-20 |

Announcements are dated and sourced: Dar al-Ifta's statement of 2026-02-17
(`dar-alifta.org/ar/articles/details/11039/...`) with the press report of the same day naming
Thursday 2026-02-19 as the first fast, and the announcement of 2025-03-29 reported the next day
naming Sunday 2025-03-30 as the completion of Ramadan and Monday 2025-03-31 as Eid al-Fitr.

The reading is consistent across both years, and it is the opposite of what a first glance
suggests:

- **The poster's counter follows the announced month.** It printed 30 Ramadan on the announced
  completion day in 2025, and 30 Sha'ban on the announced last day of Sha'ban in 2026.
- **The imsakiya prints the astronomical month, and it was a day out in both years, in opposite
  directions.** Its 1446 table runs 1 to 29 Ramadan, one day short of the announced 30. Its 1447
  table starts at 2026-02-18, one day before the announced first fast, and runs 30 rows. Both
  editions were captured before the announcement (2025-02-18 and 2026-02-05), which is why they
  cannot have followed it.
- **The two renderings never disagree on a time.** The poster's 2026-02-18 Aswan row is
  cell-identical to the imsakiya's 1447 row 1 across all six columns.

Two readings were corrected on the way to this one, and both are recorded because the trap is
easy: the 2026 poster's counter first read as a lag, and the 2025 poster's 30 Ramadan first read
as a lag too. The announcement dates reversed both. The world table's existing Egypt defect line
("ESA Ramadan 1447 = 2026-02-18 UAQ; Dar al-Ifta said Feb 19") is confirmed and now carries the
imsakiya's own behaviour beside it.

**Reading rule for the record: never take a Hijri date from an ESA surface as the calendar its
times follow. The grid is Gregorian and the times are unaffected by the label. The poster's
counter tracks the announcement; the imsakiya is printed early on the astronomical month and can
lead or fall short of it by a day. Date a Ramadan boundary from the announcing body.**

### FRONT 1.6 - 2026 poster against the 2026 postback grid (authority vs authority)

`2026-01-01` poster, 5 cities x 6 columns, against `eg-esa-<idx>-2026.json` from the postback
sweep: **30/30 cells identical**. With the first pass's 2026-11-11 gate (30/30) this is two
independent dates on which the image poster and the ASP.NET grid are the same computation.

### FRONT 1.7 - recipe span now four years (2024-2027), 17 cities

`scripts/aladkar-span.js`, output `fit/aladkar-span-2024-2027.json`:

| year | cities | days | cells | exact | within-1 | dhuhr |
|---|---|---|---|---|---|---|
| 2024 | 17 | 6,222 | 37,332 | 83.33% | 100.00% | +1 every day |
| 2025 | 17 | 6,205 | 37,230 | 83.33% | 100.00% | +1 every day |
| 2026 | 17 | 6,205 | 37,230 | 83.33% | 100.00% | +1 every day |
| 2027 | 17 | 6,205 | 37,230 | 83.33% | 100.00% | +1 every day |

24,837 days, 149,022 cells, five of six columns exact on every single day of every year and
dhuhr exactly +1 on every single day: the derivative's preset margin is frozen across four
cycles. 2027 is a computed cycle at the derivative, not an ESA-served year, and is labelled so.

### FRONT 2 - Kazakhstan: verified, then the two holes closed

The mission's Kazakh asks were banked by the first pass. This session verified them and filled
the gaps they left.

**Verification.** `data/kz-*.json` held 288 city-years: Astana 2020-2024 plus the 2031-2040
ladder, Petropavlovsk 54.86 N 2020-2027 plus 2031/2033/2035/2037/2039/2040, 86 further publisher
settlements at 2025-2027, and the 48 N boundary set (shalkar 47.83, zhezkazgan 47.80, satpaev
47.91, none-5737 48.33) with 2035 on top. Re-derivation from `captures/kz-prayTimes.js` under the
page's own ISNA 15/15, Hanafi, AngleBased margin block: **630,768 cells, 0 differing.** The rows
are a deterministic function of the captured engine.

**Two holes, now closed** (`scripts/kz-harvest-fill.js`, same engine, coordinates taken from the
banked files so the new rows are continuous with the old):

- Astana's own job list jumped from 2024 to 2031, so **2025-2030 were absent**. Banked now, seven
  years with no gap: Astana runs **2020-2040 continuous**.
- Petropavlovsk stopped at 2030 in its odd-year sampling. **2028-2030 banked**, so its span is
  2020-2031 continuous plus odd years to 2040.
- **Far points 2045 and 2050** banked for both, which turns the "serves any year" claim into a
  measured one at a distance of 24 years from today.

**Nine new city-years plus four far points, every one live-gated** with `scripts/kz-live.js`
(the page's own `timesByPeriod`, dst forced 0, raw renders in `captures/kz-live-*.json`):
**13/13 rendered and matched cell for cell, 0 differing cells.** Live gates on file are now 122
city-years, spanning 2020 to 2050.

Re-derivation self-check over the whole archive after the fills: **301 city-years, 648,300 cells,
0 differing.**

### Negatives, all dated 2026-11-11

- **Egypt 2022-2023 at authority tier: closed, now by three independent probes.** (i) The
  postback form has no year control. (ii) Wayback holds no `/monthly/<year>/` capture for 2020,
  2021, 2022 or 2023, so the daily-poster archive begins 2024-08-19 and cannot reach back
  further. (iii) No imsakiya PDF is archived for 1442, 1443 or 1444 (availability API, five
  candidate names), and the one 1444 city poster the CDX does list
  (`emsakya/المنصورة الجديدة.jpg`, 2023-03-23) replays 404.
- `emsakya.aspx` and `emsakya/<hijri>.pdf` are 404 live: the imsakiya is archive-only.
- 15 sheet days unrecoverable, listed in FRONT 1.2 with their classes.

### Deliverables added this session

- `captures/` - 563 archived ESA daily posters (1.2 GB total archive), the three imsakiya PDFs,
  their 245 extracted page images, title contact sheets, band crops and cell crops,
  `kz-live-*.json` renders now 122.
- `data/` - `eg-sheet-ladder-r3b.json` (10 dated sheets), `-r3c.json` (2), `-r3d.json` (1),
  `eg-imsakiya-aswan.json` (3 Ramadan months), `eg-imsakiya-alexandria-1445.json`,
  13 new `kz-<key>-<year>.json`.
- `fit/` - `aladkar-span-2024-2027.json`, `eg-sheet-ladder-gate.json`, `eg-imsakiya-gate.json`.
- `scripts/` - `fetch-sheets2.zsh`, `pdf-extract-jpeg.py`, `imsakiya-crop.py`,
  `aladkar-span.js`, `eg-ladder-gate.js`, `eg-imsakiya-gate.js`, `kz-harvest-fill.js`.

### NEXT

1. Transcribe the imsakiya for the remaining 76 cities. Aswan and Alexandria already bracket the
   span at 24 N and 31.2 N and both pass 100% within one minute, so the remaining pages add city
   count rather than recipe information. Start with Cairo to close the middle of the span, then
   the 2024 set as a whole.
2. The 2026 poster set is complete (143 days) and untranscribed beyond the two Ramadan dates.
   A monthly sample across it would make the 2026 authority ladder continuous rather than paired.
3. Fold into the world table: Egypt's authority tier now carries 2024, 2025 and 2026 dated
   presence (Ramadan months, 78 cities available, 2 transcribed), the ledger buy #3 line
   corrected to "current year only by postback; the imsakiya PDFs and the daily-poster archive in
   Wayback are the past doors", and the Ramadan reading rule.
4. Kazakhstan holds 301 city-years, 2020-2050, live-gated at 122 points. Its open question is not
   data but the 48 N hard switch, which has measurements on both sides and no settlement inside
   the band.
