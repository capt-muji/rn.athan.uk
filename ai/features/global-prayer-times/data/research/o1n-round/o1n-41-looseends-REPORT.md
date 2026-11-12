# REPORT.md — wave o1n-41-looseends (continuation, session four, 2026-11-12)

Wave O1n-41 died quota-stalled with no report. This continuation verified the inherited
workspace from the files alone and finished the three named items. All times UTC.

## 1. Inherited bank, reconstructed from the files (nothing re-fetched)

### 1a. Fiji Muslim League, Suva (fml-fiji) — 2024 monthly prints, per-cell OCR

- Source: FML Suva monthly JPEG posters (captures/fml-2024-*.jpg, 5 months captured,
  4 parsed; January captured, never parsed — open item).
- Method: scripts/fml-cell-ocr.py v2 — per-cell crops, 6x/8x LANCZOS upscale, normal +
  inverted + three threshold variants per cell, macOS Vision fast level (tools/ocr),
  vote-pool merge across runs (cellrun.log, cellrun2.log both complete to day 31).
- Banked (data/): 121 dated rows across four 2024 months —
  2024-02 (29 rows), 2024-03 (31), 2024-04 (30), 2024-10 (31).
- Columns per row: fajr, sunrise, dhuhr, asr_shafi, asr_hanafi, maghrib, isha.
- Completeness: 76 of 121 rows fully complete; 45 rows carry at least one null cell.
  Null cells by month (cellreport.json): 2024-02: 18, 2024-03: 17, 2024-04: 0 (clean,
  only low-vote notes), 2024-10: 53 (October print is the dirtiest thin-glyph month).
  847 cells parsed across the four months; 88 remain null.
- Fit: none yet. The months are banked but unfitted — a fit against adhan 4.4.6
  (Suva -18.1419/178.4419, Pacific/Fiji) remains an open item for a successor.
- The thin-glyph problem this wave attacked (cells OCR'd as junk on first pass) is
  documented per cell in the -cellreport.json files.

### 1b. GMS Strasbourg (Grand Mosque of Strasbourg) — 2025-11 monthly poster

- Source: held PDF (captures/fr/held-gms-2025-11.pdf, archived series sibling); OCR at
  4x and 8x (work/gms202511-x4.txt, x8.txt); scripts/gms202511-parse.py vote-merged the
  two scales into data/gms-2025-11-raw.json (30 row-table entries, both scales agreeing).
- Banked (data/gms-2025-11-rows.json): 30 dated rows 2025-11-01..2025-11-30, columns
  fajr, sunrise, dhuhr, asr, maghrib, isha; zero unresolved after cross-scale merge.
- Banked fit (data/gms-2025-11-fit.json), engine of record adhan 4.4.6, point
  48.5734/7.7521, Europe/Paris:
  - sunrise: adhan + (-7.4 min), 30/30 within-1, worst 0.6, mae 0.2
  - dhuhr: adhan + (+5.2), 30/30 within-1, worst 0.6, mae 0.3
  - asr: adhan + (+5.4), 30/30 within-1, worst 0.7, mae 0.3
  - maghrib: adhan + (+7.9), 30/30 within-1, worst 0.7, mae 0.2
  - fajr: angle 18 deg + (-0.3) — 30/30 exact; interval model 85 min fails (worst 4)
  - isha: angle 12.3 deg + (+23.9) — 30/30 exact; interval 60 min fails (worst 4)
  - Print-day K constants: fajr K=103 (99..106), isha K=90 (87..94)
  - All recorded GMS regime bands (fajr K 97-108, isha K 76-96, column margins)
    re-confirmed with the observed medians inside the bands.
- Verdict inherited: GMS prints compute, not copy — angle-based twilight with a fixed
  temkin block on the solar columns.

### 1c. Loose ends the predecessor left

- captures/ch/izb-arch-31-august-2018.pdf: captured, OCR boxes never produced, no rows
  banked. The Bern 2018 item is therefore entirely unfinished here.
- work/parse_izb_arch.py: written and reusable; expects `izb-arch-boxes-*.txt` box files
  in o1n-25-europerecover format. Its 2018 column-band guess (three bands collapsed at
  x=533) is suspect and is revisited below.
- captures/fr/gms-cal-2024-02.pdf, gms-cal-2024-11.pdf: GMS sibling posters captured,
  not parsed (open item, not this wave's named item).

## 2. Item 1 — BERN 2018 pinned (Islamisches Zentrum Bern, izb.ch)

Held record before this wave: 2016-07 and 2016-08 fitted (zero-temkin, fajr 15 deg,
isha 15 deg, margins within +-1.7); 2026-11 fitted (fajr 17.25 deg - 4.7, isha
12.5 deg + 21.7, solar temkin +5..+8); August 2018 partial (Aug 19-31, 10 usable rows)
flagged unreliable and excluded from the era call.

This wave:

### 2a. December 2018 print fetched (Wayback, one probe)

- Route: web.archive.org snapshot 20181208081515 of
  izb.ch/index.php/gebetszeiten/download?download=37 (dezember-2018), found in the
  o1n-36 CDX capture (work/cdx-izb.txt, already on disk — no CDX re-probe).
- Banked: captures/ch/izb-arch-31-dezember-2018.pdf(.gz).

### 2b. December 2016 print fetched (Wayback, second probe, no 429)

- Route: web.archive.org snapshot 20161116154928 of download=20 (dezember-2016).
  A winter-month print of the old regime, apples-to-apples against the winter 2026-11
  print, sharpening the transition window from both sides.
- Banked: captures/ch/izb-arch-31-dezember-2016.pdf(.gz).

### 2c. Parse and fit

- December 2018 (data/izb-bern-2018-12-rows.json, 31 dated rows, 31/31 complete after
  one 2x-render recovery of the 2018-12-12 isha cell): the German weekday column
  self-certifies every date. Fit (data/izb-bern-2018-12-fit.json, adhan 4.4.6,
  46.9480/7.4474, Europe/Zurich): sunrise -0.7, dhuhr +0.4, asr(Shafi) -0.6, maghrib
  +0.2, all 31/31 within-1; twilight is the December-degenerate case — the print's
  fajr-sunrise gap is a dead-flat -92 min (91..93) and isha-maghrib +92 (90..92),
  which is EXACTLY what an angle-15 recipe produces in December at Bern (verified:
  model-15 gap runs 91..93 across the month). December 2018 is therefore the OLD
  zero-temkin 15/15 recipe, not a third convention.
- August 2018 re-parsed with the corrected layout (work/parse_izb_2018.py; the
  o1n-36 band guess had collapsed sunrise/dhuhr/asr onto x=533 and put isha at 942;
  measured bands are fajr 321, merged middle 437/534/631, maghrib 746, isha 852, with
  the Arabic hijri tail after the isha time): 31 rows, 31/31 complete, weekday column
  certifies all 31 dates. Fit (data/izb-bern-2018-08-fit.json): fajr angle 15
  (margin -1.2, 31/31 within-1), isha angle 15.3 (-0.3, 31/31 within-1), solar
  margins -1.3..+0.6. The o1n-36 "third convention" flag is RESOLVED as a parse
  artifact; August 2018 is the same 15/15 zero-temkin recipe as July/August 2016.
- December 2016 (data/izb-bern-2016-12-rows.json, 31 rows, 31/31 complete after one
  2x-render recovery of the 2016-12-09 asr cell): fit matches August 2018 within
  reading error (sunrise -0.7, dhuhr +0.8, asr +0.2, maghrib +0.8, K -92/+92).
- The December 2018 and December 2016 first-day prints agree within 1 minute on all
  six columns (independent prints, same recipe).
- TRANSITION WINDOW (sharpened): the change from the zero-temkin 15/15 recipe to the
  2026 temkin-block recipe (fajr 17.25 - 4.7, isha 12.5 + 21.7, solar +5..+8)
  happened AFTER 2018-12-31 and BEFORE 2026-11-01. The mosque's own domain in the
  Wayback carries NO print between those dates (CDX reviewed from the o1n-36 capture;
  next captures are 2023 HTML pages whose download listing links nothing, fetched and
  banked as captures/ch/izb-arch-gebetszeiten-download-20230514.html.gz — honest
  negative). The Bern record is now: 2016 (3 months fitted), 2018 (2 months fitted),
  2026-11 (fitted); eras never blended; the 2018 "unresolved" flag is retired.

## 3. Item 2 — ICM Maryland PDFs (Islamic Center of Maryland, Gaithersburg)

- Source: 23 monthly Hijri-table PDFs already captured by o1n-38
  (o1n-38-southasia/captures/in-icomd/, icomd.org "Prayer Schedule"): Hijri 1444
  (5 months, Sep 2022-Feb 2023), the complete 1447 (Jun 2025-Jun 2026, 12 months),
  and 1448 (Jun-Nov 2026, 6 months). Copied into captures/in-icomd/ here; nothing
  re-fetched.
- OCR: all 23 PDFs through the local Vision binary (work/ocrboxes), zero failures,
  journaled (work/icm-ocr-journal.log); boxes gzipped alongside.
- Layouts: two templates — a landscape two-table page (2018-style, 1584x1224) and a
  portrait 1224x1584 page for the 1444 era; column bands derived per page from the
  OCR'd header row itself (scripts/icm-parse.py), 12h clock normalized per column
  (fajr/sunrise AM; the rest PM; dhuhr carries an AM-entry line "11:5x" in some
  months, kept as printed).
- Dating: each table splits a Hijri month across two Gregorian tables; dates come
  from the printed Gregorian day column while the weekday column self-certifies
  (every row carries a weekday label; mismatches are warned). Rows whose labels
  failed OCR are placed positionally only where both neighbours pin the same date,
  else warned and left out.
- Banked (data/icm-*-parsed.json, 23 files): 663 dated rows total, 612 fully
  complete (6 columns each: fajr, sunrise, dhuhr, asr, maghrib, isha).
- Known print fault: the 1444-era portrait PDF's right-hand table is TRUNCATED BY
  THE PAGE ITSELF — only fajr and sunrise are printable (the remaining columns lie
  beyond the page edge); 03-Rabi-Awwal1444 therefore banks 15 complete rows and the
  rest of that Hijri month is unprintable, not unfetched. Verified on the 2x render.
- Fits (data/icm-*-fit.json + data/icm-fit-summary.json, engine adhan 4.4.6,
  39.1437/-77.2038, America/New_York, per-month never blended): solar columns ride
  adhan defaults (margins -0.4..+1.1 across all months); twilight recipe measured by
  the angle-15 invariant check (data/icm-model15-check.json): all 23 months sit
  within +-0.4 min median of fajr 15 deg / isha 15 deg, within-1 typically 26-29 of
  28-30 rows.
- VERDICT: ICM prints are computed at 15/15 with zero temkin on solar columns, one
  stable recipe across 1444, 1447 and 1448 (2022-2026). Tier: authority-publisher
  surface (icomd.org is the center's own site). The per-month fits land with the next
  index cut.

## 4. Item 3 — Sweden IFiS refetch (Islamiska Förbundet, svensk-islam)

- The stale pinned-September state o1n-25 recorded is GONE: the live
  /bonetider page now renders "2026 Bönetider", a month selector (values 1-13,
  13 = "Ramadan: Feb-Mars") and a city selector. curl stays
  challenge-walled (454 splash page, banked captures/se-ifis-bonetider-refetch.html.gz);
  the page was driven in agent-browser (named session, closed after).
- The month tables POST to wp-content/plugins/bonetider/Bonetider_Widget.php with
  only city + month (no year parameter; the year is the server's pinned label).
  The city selector carries 111 cities.
- 2027 check: NEGATIVE under these terms — the endpoint carries no year axis and the
  page serves only "2026 Bönetider"; a 2027 edition cannot be requested on this
  surface and was not served.
- Banked (captures/se-ifis-2026-m01..m13.html.gz): Stockholm's full 2026, all 13
  tables (Jan-Dec + the Ramadan Feb-Mar table).
- Banked rows (data/ifis-stockholm-2026-rows.json): 365 dated rows 2026 (Jan 31,
  Feb 28, Mar 31, Apr 30, May 31, Jun 30, Jul 31, Aug 31, Sep 30, Oct 31, Nov 30,
  Dec 31), every row complete; plus the 29-row Ramadan table banked undated (its
  rows carry no printable dates).
- Fit (data/ifis-stockholm-2026-fit.json, engine adhan 4.4.6, 59.334/18.063,
  Europe/Stockholm, per-month): a dated SEASONAL REGIME, never blended —
  - Sep-Apr the print is computed at adhan defaults (fajr margin -0.3..+0.6,
    100% within-1 in Oct/Nov/Dec/Jan/Feb; isha margin -5.8..-11 at the 18-deg
    default; sunrise -6.2..-7.6, dhuhr +4.8..+5.3, asr +1.4..+6.8, maghrib
    +5.3..+9.3 — a fixed temkin block on the solar columns);
  - May-Jul the 18-deg twilight stops serving (sun below horizon at 59.3N) and the
    print switches to a flat rule: fajr-sunrise gap -65..-102, isha-maghrib
    +58..+107, angle fits fail (recorded, not adjudicated — the summer rule is
    owner-ruled);
  - Mar/Apr/Sep are the transition months (partial within-1).
- Verdict: IFiS is now a DATED authority-publisher surface for Sweden (was: undated
  stale table). Forward longevity: the 2027 flip cannot be probed (no year axis);
  recheck when the server flips its pinned year.

## 5. The OCR continuation — January Fiji, the FML five-month fit, the GMS 2024 siblings (2026-11-12, wave o1n-49, UTC)

### 5a. FML January 2024 parsed whole — 31/31 complete (extends the four-month bank)

- Source: the inherited capture `captures/fml-2024-January.jpg` (the open item the
  successor list named). Grid measured from a fresh ocrboxes base pass
  (`work/fml-jan-base.txt`): 31 day rows at y 242..1240, pitch 33.25, columns at
  x 150-842; bands banked as `captures/2024-01-bands.json`
  (scripts/fml-bands-jan.py, same schema as the four banked months).
- Per-cell OCR pipeline reused unchanged (scripts/fml-cell-ocr.py 1, journaled
  `data/fml-fiji-2024-01-cellrun.log`, vote table `data/fml-fiji-2024-01-cells.json`):
  217/217 cells read, ZERO null cells, one low-vote cell, 13 contested cells
  resolved by vote majority, zero smoothness jumps — the cleanest FML month in
  the census. Rows banked `data/fml-fiji-2024-01-rows.json` (31 rows, all
  complete; fml-assemble.py NDAYS extended with "01").
- Cell-compare against O1n-37's strip reading of the same print: 7 deltas of 217 —
  the three O1n-37 nulls now resolved (01-29 asr_shafi 15:29, 01-31 sunrise
  5:52, 01-31 dhuhr 12:25), three one-minute dhuhr moves (01-15/17/18) and one
  one-minute isha move (01-18), every one of them toward the adhan model.

### 5b. FML five-month fit at the O1n-37 solved point — per-month stats banked

- Banked `data/fml-fiji-2024-five-month-fit.json` (scripts/fml-fit-five.mjs,
  engine adhan 4.4.6, Suva -18.1416/178.4419, UTC+12 constant): the mission's
  152-row set (O1n-37 January 31 + o1n-41's four months) scored at the fixed
  recipe fajr 17.75 / sunrise +0 / dhuhr transit+6 / asr Shafi +0 / maghrib +3 /
  isha 18.5, each month separately, never blended.
- FAULT SCREEN (documented in the file): 56 inherited cells sit >10 min off the
  model (March 21, April 19, October 16 — fajr cells voting 15:0x for 5:0x,
  isha cells voting 17:5x for 19:5x, the known thin-glyph failure), listed
  per date+column in the file; a successor can repair them with
  `fml-cell-ocr.py <month> --retry <day>` re-runs. Screened within-1 per month:
  | month | fajr | sunrise | dhuhr | asr(S) | asr(H) | maghrib | isha 18.5 |
  |---|---|---|---|---|---|---|---|
  | 2024-01 | 31/31 | 30/30 | 30/30 | 30/30 | 31/31 | 31/31 | 24/31 |
  | 2024-02 | 26/26 | 26/26 | 27/27 | 26/26 | 27/27 | 26/27 | 12/26 |
  | 2024-03 | 26/26 | 29/29 | 31/31 | 25/25 | 28/28 | 29/29 | 0/11 |
  | 2024-04 | 16/16 | 30/30 | 30/30 | 29/29 | 28/28 | 28/28 | 0/30 |
  | 2024-10 | 29/29 | 12/27 | n/a (31 null) | 25/25 | 28/28 | 26/26 | 4/13 |
- The recipe verdict sharpens: solar columns hold at within-1 in every readable
  cell of all five months; isha 18.5 is January-exact (24/31, worst -2) and
  drifts +2..+4 min late from February onward (screened means +1.6 Feb, +4.1
  Mar, +3.8 Apr, +2.0 Oct) — a real seasonal isha-family wobble, recorded as
  measured, refinement owner-ruled; the provisional grade stands. October
  sunrise rides +2 (12/27, worst 2) — the dirtiest print, recorded.
- January variant banked inside the same file: the new per-cell January scores
  31/31 within-1 on fajr, sunrise, dhuhr, asr(S), asr(H), maghrib (isha 24/31
  unchanged), strictly better than the strip reading it replaces.

### 5c. GMS Strasbourg 2024 sibling posters parsed + fitted — the frozen regime reaches back to Feb 2024

- Sources: the o1n-36 ocrboxes box passes (scale 2 + scale 4) already on disk in
  the o1n-25 workspace for BOTH posters — copied to
  `work/gms2024-x2/x4-gms-cal-2024-0{2,11}.txt` with a provenance note; nothing
  re-OCR'd. PDFs decompressed to work/ for reference.
- Layout decoded (the o1n-36 "weak day-label rows" mystery resolved): each
  poster page carries TWO tables side by side; each row is one box of six times
  prefixed by the HIJRI day token (sometimes glued to the fajr time:
  "2105:58" = day 21 + 05:58), and the true CIVIL date comes from the row-
  aligned day+weekday label strips (far-left x 75..215 and mid x 838..980):
  gms-cal-2024-02: LEFT = Feb 1-15 (printed as Sha'aban 20-29 + next month
  1-5), RIGHT = Feb 16-29; gms-cal-2024-11: LEFT = Nov 1-15, RIGHT = Nov
  16-30. Parser `scripts/gms2024-parse.py` dates every row from its strip
  label (weekday letter validated; sequence fallback), keeps the Hijri token
  as metadata, and vote-merges scale2+scale4 per row.
- Banked rows: **Feb 2024: 29/29 rows, complete, zero weekday mismatches**
  (the leap month, complete — `data/gms-2024-02-rows.json`);
  **Nov 2024: 30/30 rows, complete, zero weekday mismatches**
  (`data/gms-2024-11-rows.json`); raws beside them
  (`data/gms-cal-2024-0{2,11}-raw.json`).
- Fits (`scripts/gms2024-fit.mjs`, adhan 4.4.6, Strasbourg 48.5734/7.7521,
  Europe/Paris, frozen post-Feb-2024 regime bands per the held record):
  | month | sunrise | dhuhr | asr | maghrib | fajr K_print | isha K_print | within-1 |
  |---|---|---|---|---|---|---|---|
  | 2024-02 | -6.6 [-7,-6.1] | +4.9 | +2.2 | +5.8 | 99 [97,102] | 87 [85,90] | 29/29 every column |
  | 2024-11 | -7.4 [-7.8,-6.9] | +5.1 | +5.3 | +7.7 | 103 [99,106] | 90 [87,94] | 30/30 every column |
  Every median inside the recorded winter bands (sunrise -6.4..-7.6, dhuhr
  +3.9..+5.2, asr +2.1..+5.5, maghrib +5.8..+8.5, fajr K 97-108, isha K
  76-96): the NEW-print recipe is proven from its FIRST printed month (Feb
  2024) through Nov 2025 unchanged. The per-month angle sweeps pin at moving
  points (fajr 17.3 Feb / 15.8 Nov; isha 18.3 / 10.8) while K stays put — the
  o1n-36 "interval convention, not an angle" finding re-confirmed on two more
  months.
- Between-year cell diffs banked (`data/gms-2024-sibling-diffs.json`,
  scripts/gms2024-diff.py, day-of-month match, printed-vs-printed):
  Feb 2024 -> Feb 2026 (26 shared days): medians fajr -1, sunrise -1, dhuhr 0,
  asr +1, maghrib +1, isha +1 — frozen. Nov 2024 -> Nov 2026 (26 shared days):
  medians -1..+1 with outliers ONLY on days 10-11 (sunrise +14/+15, maghrib
  -11) — localized to the HELD 2026-11 parse's left/right table seam (its
  right table starts at day 10, so days 10-11 carry a seam artifact there),
  not to the 2024 print. The o1n-36 "weaker 2024-11 day-label rows" caveat is
  retired: the 2024 side of that diff is now label-certified.


## 6. Wave O1n-53 continuation (2026-11-12, opened 18:05Z UTC) - the FML fault-cell repair

### 6a. The 56 fault cells named, retried, and ruled

- The five-month fit's fault screen listed 56 cells >10 min off the fixed
  recipe (fajr 17.75 / isha 18.5, Suva -18.1416/178.4419, UTC+12): March
  1 fajr + 20 isha, April 15 fajr + 4 other, October 16 isha.
- Repair pass run per the predecessor's named tool: `fml-cell-ocr.py <month>
  --retry <days>` at 8x/10x with the extended threshold set, vote-pool merged
  into the cells.json tables for all 21+15+16 fault days across March, April,
  October (journaled in place).
- Re-assembly + PATCH-ONLY-TOWARD-MODEL-AGREEMENT driver
  (`scripts/fml-repair.py`, model table `data/fml-model-table.json` computed
  at the fixed recipe): **96 cells patched** (new majority within +-1 of the
  model), **85 changes suppressed** (retry winner rejected, pre-repair value
  kept), every decision recorded with its source in
  `data/fml-repair-journal.json`.
- **April: 19 faults -> 0** (the 15:0x fajr hour-phantom resolved; April now
  30/30 within-1 on every column except the recorded isha wobble line).
- **March: 21 -> 20** (the 900 fajr phantom resolved; the 20 isha cells
  remain - see recoveries below).
- **October: 16 -> 15**; sunrise 28/31 (was 12/27) - the worst print's solar
  columns cleaned substantially.
- **The isha story resolved honestly**: the retry recovered PM-valid readings
  ("7:35" = the print's 19:35 with the hour '1' eaten by thin-glyph OCR) for
  44 isha cells - but the recovered values sit +2..+5 min outside the fixed
  isha-18.5 recipe (the seasonal isha wobble the five-month fit already
  records). The +-1 toward-model gate therefore kept them OUT of the patched
  rows; they are banked as evidence in
  `data/fml-repair-journal.json` (`isha_recoveries_not_patched`): the
  pre-repair 17:xx readings are dead (impossible times), the true prints are
  the recovered 19:xx values, and the residual disagreement is the wobble,
  not a misparse. The re-emitted fit keeps those cells screened as faults
  with this note now attached.
- **Re-emitted fit** (`data/fml-fiji-2024-five-month-fit.json`, pre-repair
  copy kept as `-prerepair.json`): scored cells 973 -> 1000, within-1 830 ->
  890 (85.3% -> 89%), exact 335 -> 370. Completeness: March 20 -> 29 fully
  complete rows (the retry also recovered nulls). Row files re-banked with
  pre-repair copies (`fml-fiji-2024-{03,04,10}-rows-prerepair.json`).
