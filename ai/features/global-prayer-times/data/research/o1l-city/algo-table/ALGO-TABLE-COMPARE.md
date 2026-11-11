# ALGO-TABLE-COMPARE — the stated-algorithm vs dated-timetable matrix (O1l-A1)

Deliverable of research agent O1l-A1, 2026-11-11. Working file: this document.
Raw scoring runs: `data/score-runs.txt` (engine adhan 4.4.6 at
`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`, `Rounding.None` then the declared
or best-fitting rounding reported separately, TZ pinned per country, dates built from literal
capture strings, no clock reads; scorer `score.js` beside this file).

Read first (binding): `census/o1l-city/BRIEF.md` (ALGORITHM-VS-TIMETABLE order, round-two
owner orders 2026-11-11), `census/o1l-city/FIT-RULES.md`,
`ai/features/global-prayer-times/data/census/world-table-v2.md`,
`ai/features/global-prayer-times/data/research/o1k-wide/CONSOLIDATION.md` (block O1k-W18 and
every wave block cited below), `.../o1k-wide/fitindex/FIT-INDEX.md`.

Rule of the matrix (owner order): where the stated algorithm and the served timetable drift,
NEVER adjudicate which side is correct — both readings are stated and the row is flagged
**owner-ruled**. Sync is a result; drift is a result; "cannot tell" is a result.

## Counts

| Measure | Value |
| --- | --- |
| Qualifying countries (hold BOTH a stated algorithm and dated timetables) | 32 |
| Matrix rows (a country can carry more than one stated line) | 35 |
| Rows SYNC (incl. Iran's partial: fajr only) | 18 |
| Rows DRIFT (owner-ruled flags inside) | 10 |
| Rows UNDECIDABLE | 4 |
| Rows EMPTY-COMPARISON (stated algorithm, timetable not yet fitted) | 3 |
| Rows where I ran the stated parameters myself this session | 2 (Montenegro, Bahrain) + 3 direction probes; Finland scored later by O1l-21r (see §11) |

Verdict vocabulary per prayer: **SYNC** = within 1 min across the full span held;
**DRIFT** = magnitude + direction, seasonal or constant; **UNDECIDABLE** = reason stated.
All other cells cite the banked record; nothing is re-derived except the two scored rows and
three probe pairs, each marked "scored here".

---

## REGION 1 — Europe

### 1. United Kingdom — Wifaqul Ulama — SYNC
- **Stated algorithm:** fajr 18 / isha 15; dhuhr +4, maghrib +5; high-latitude split-night
  portions: fajr 1/2 night (nisful-layl fallback after 13 May), isha = sunset + night/7
  (Moonsighting portion). Parameters published in the calendar's own rule text.
  Source: world table `GB-WIFAQUL-ULAMA`, T-667 #6919 (L4).
- **Timetable evidence:** Wifaqul 2026 calendar, 365 dated rows, one year.
- **Comparison:** stated pair + portions reproduce the table 365/365 within 1 minute (banked
  fit L4). Rounding directions unmeasured (record defect). Single year — the verdict is one
  cycle deep.
- **Verdict:** fajr SYNC, isha SYNC, dhuhr/maghrib SYNC at the stated margins (365/365
  within-1). Span caveat: 2026 only.

### 2. Belgium — EMB — DRIFT (owner-ruled)
- **Stated algorithm:** 18/17 with the frozenLatitude45 summer window (declared on the same
  page as the times), maghrib +2, 18 published per-city deltas (Gent +3, Liege -5, ...).
  `BE-EMB`, T-667 #6911 (I2).
- **Timetable evidence:** EMB calendar, 2 years (730 days), Brussels anchor; Sanabel 2026
  byte-identical (two publishers, one table).
- **Comparison (banked fits I2 + W9 + fit9):** the declared rule does NOT reproduce the
  printed table as stated. Measured window boundaries: fajr leaves the real-latitude curve
  05-10 to 08-02, isha 05-01 to 08-12 (103 days); the substitution is NOT latitude-45 —
  only the middle 65 isha days track lat-45 (RMS 1.8), the rest are flat plateaus 23:26
  (21 days) and 23:33 (17 days). Outside-window isha is 18.0 (RMS 0.52).
- **Both readings (owner-ruled):** the declared object carries isha 17 + the fL45 window;
  the served table reads 18.0 outside the window — the 17-degree reading misses by **7.0
  min** (fit9, `BE-17-DEG` superseded chain). The frozen-generation caution also applies:
  the 2025 edition is 363/365 rows identical to 2026.
- **Verdict:** isha DRIFT (7.0 min at the declared-vs-served seam, constant outside the
  window); fajr DRIFT at the window edges (the declared summer behaviour differs from the
  measured plateaus); dhuhr/maghrib: margins null on the record (UNDECIDABLE).

### 3. Netherlands — VIN declaration — SYNC
- **Stated algorithm:** VIN's own declaration (2 Dec 2023): 18/17 with fixed summer caps
  Fajr 03:30 / Isha 23:30. `NL-VIN`, O1k-W9.
- **Timetable evidence:** 8 city-years (Amsterdam, Utrecht, Rotterdam, Ypenburg × 2025/26),
  2,190-day basis; fit9: reproduces all six scored city-years.
- **Comparison:** fajr 18 floored 03:30 / isha 17 capped 23:30 — worst 2 min across the span,
  within-1 690-702 of 690-730 per city-year (FIT-INDEX `NL-VIN`); parameters frozen
  2025→2026.
- **Flags (recorded, not adjudicated):** the caps bind **190-208 printed days** (fit9) —
  far wider than the declared "summer caps" (an earlier wave read 95-104 days; both readings
  carried). A 2-minute worst day exists on each twilight prayer.
- **Verdict:** fajr SYNC (worst 2), isha SYNC (worst 2). Grade A per the fit index.

### 4. Diyanet European unified scheme (Germany DITIB) — DRIFT (owner-ruled)
- **Stated algorithm:** the prose on DITIB's own German page (O1k-W18): 18/17 + the
  Brussels-conference estimation (isha = maghrib+1h20 capped at the first third, fajr
  summer-only +10); the 2023 European isha change to 16 stated by Diyanet Belgium as
  consensus policy (2021 Istanbul congress with ECFR). `EU-DIYANET-UNIFIED`, T-667
  #6925 (M1), #6918 (L5).
- **Timetable evidence:** DITIB portal full years Koeln/Berlin/Frankfurt, 1,095 rows,
  authority tier (O1k-7 europe). No standing series before that capture — the object was
  grade F on "no series".
- **Comparison:** the served tables run the 2023 EUROPEAN 18/16 angles wrapped in DOMESTIC
  temkin (measured: sunrise -6.5, dhuhr +5.5, asr +3 shadow-1, maghrib +6.5; isha 16 deg
  exact 78/68/76 of 182 winter days at the three cities; isha 17 deg scores 0/0/0 —
  FIT-INDEX `DE-DIYANET`, fit4).
- **Both readings (owner-ruled):** the printed 18/17 prose is the pre-2023 position and the
  printed timetable wins (record rule). Scored here (Berlin, 2026-01-15): isha at 17 deg =
  17:19, at 16 deg = 17:12 — the prose pair prints **~7.2 min earlier** than the served
  isha in winter; the difference holds ~7 min before the 80-min plateau binds in summer.
  The regime change is DATED (January 2023) and the span must not blend across it.
- **Verdict:** isha DRIFT (~7.2 min, prose-vs-served, dated regime change 2023-01); fajr
  angle agrees (18); the temkin margins are measured, never stated — UNDECIDABLE for the
  four margin-bearing prayers against prose alone.

### 5. Sweden — Imam Council published scheme — DRIFT (owner-ruled coexistence)
- **Stated algorithm:** Imam Council's published 18/17 + third-of-night (published scheme;
  predates the 2023 Diyanet amendment). `SE-MOSQUE`, T-665 #6882, T-667 #6918 (L5).
- **Timetable evidence:** IF national table (Stockholm, Uppsala, Goeteborg) + Angered year
  (O1k-W12, 1,460 rows): ONE recipe across three cities and it is Diyanet's engine (sunrise
  -6.5, dhuhr +5.5, maghrib +6, Shafi), 18/16 confirmed; Angered byte-equal Goeteborg
  (fit8); frozenLatitude45 fits 0/118 days.
- **Both readings (owner-ruled):** the stated Imam Council pair (18/**17**) coexists with
  the served IF line (18/**16**). Scored here (Stockholm, 2026-01-15): isha at 17 deg =
  17:49, at 16 deg = 17:41 — **~7.8 min** between the stated pair and the served national
  tables in winter. The record's rule stands: the printed timetable wins over prose.
- **Verdict:** isha DRIFT (~7.8 min, stated-vs-served, two publishers in one country);
  fajr agrees at 18; the IF margins are measured, not stated (UNDECIDABLE vs the Imam
  Council prose).

### 6. Austria — IGGÖ — EMPTY-COMPARISON
- **Stated algorithm:** IGGÖ published recipe: 18/16 + full temkin + high-latitude rules —
  "the most complete publication found in T-666" (`AT-IZW` row, T-666 #6893).
- **Timetable evidence:** NONE from IGGÖ itself. The Austrian fit on the record is IZW
  Vienna (a different body, custom engine, seasonal sweeps, 365 days 2026) — it cannot fill
  this row.
- **Cheapest fit to fill:** bank one IGGÖ-published city-year (the IGGÖ calendar/scheme
  output) and score the stated 18/16 + temkin against it with adhan at Rounding.None then
  the declared rounding. One capture closes the row.

### 7. Switzerland — IZRS — EMPTY-COMPARISON
- **Stated algorithm:** published seasonal scheme: 12.5/13 with Isha 12 (T-666 #6893).
- **Timetable evidence:** IZRS Ramadan Zuerich, 30 rows (O1k-7 europe); the full calendar is
  login-gated and IZRS Wayback is blocked (stays negative, O1k-W10).
- **Cheapest fit to fill:** score the stated seasonal pair against the 30 banked Ramadan
  rows (tests only the Ramadan branch), or capture one IZRS city-month outside Ramadan.
- **Verdict:** EMPTY-COMPARISON — the stated pair is untested against any held rows.

### 8. Montenegro — IZCG — DRIFT (owner-ruled) — scored here
- **Stated algorithm (verbatim, IZCG-aligned portal declaring the official takvim,
  monteislam.com/vaktija footer, capture `o1k-wide/balkans2/captures/me_monteislam_vaktija.html`,
  2026-11-10):** "Vremena se računaju za Podgorica (**19.5° za zoru, 17.5° za jaciju,
  standardna ikindija**), a ostala mjesta se pomjeraju za utvrđen broj minuta — isto kako je
  objavljeno u zvaničnom takvimu." (Fajr 19.5°, isha 17.5°, standard/Shafi asr, other towns
  = fixed minute shifts.) Rounding: NOT stated.
- **Timetable evidence:** vaktija.me yearly generator (Medžlis IZ Bijelo Polje, organ of the
  Islamska Zajednica), 6 city-groups × 365 days, Podgorica = group -1
  (`data/me_grp-1_vaktijame_2026.json`), O1k-W11.
- **Comparison (scored here, adhan 4.4.6, TZ Europe/Podgorica, Podgorica 42.4410/19.2630,
  Shafi, TwilightAngle guard, Rounding.None):** residuals = table minus computed, 365 days:
  - fajr: mean -1.41 min; winter mean **+4.05**, summer mean **-7.43**; within-1 50/365;
    exact 31/365 at nearest. NOT constant: a ~11.5 min seasonal swing sits inside the
    near-zero annual mean.
  - isha: mean -0.17; winter **-5.47**, summer **+5.47**; within-1 47/365.
  - asr (declared standard): mean -1.48; winter -5.44, summer +1.70; within-1 82/365.
  - dhuhr: mean -0.64; within-1 310/365; floor exact 298/365 — reproduces.
  - sunrise: mean -6.98 early (winter -2.16, summer -11.84); maghrib: mean +5.61 late
    (winter +1.18, summer +9.82) — both UNDECIDABLE vs the statement (nothing declared),
    measured pads recorded.
  - DST edges: exactly TWO days (2026-03-29, 2026-10-25) sit at ~±60 min on EVERY prayer —
    the table's DST calendar differs from IANA on those dates (the Kosovo 60-minute
    DST-edge class).
- **Both readings (owner-ruled):** the record's W11 verdict "the band question resolves to
  the stated point" and the C21/J1 fitted band (fajr 19.25-19.4, isha 17.75-17.85) BOTH
  stand on this scoring: the declared 19.5/17.5 reproduces the table's ANNUAL MEAN
  (cancellation of opposite seasonal halves) but not the table within 1 min in any season.
- **Verdict:** fajr DRIFT (seasonal, table later than declared-19.5 in winter ~+4, earlier
  in summer ~-7); isha DRIFT (seasonal, ~±5.5 around the declared line); asr DRIFT
  (seasonal); dhuhr SYNC (floor rounding); sunrise/maghrib UNDECIDABLE vs statement
  (unstated; pads measured 3-10 early / 2-9 late); rounding UNDECIDABLE (no declaration;
  floor fits dhuhr, nothing fits the twilights to 1 min).

### 9. Estonia — EIC published scheme — SYNC
- **Stated algorithm:** 15/15 with the PUBLISHED clamp/fallback pair: fajr clamp 45-120 min
  before sunrise; isha per-month extreme fallback maghrib+90 (published by EIC on its own
  tables). `EE-EIC`, T-668 #6953 (C6).
- **Timetable evidence:** Tallinn + Tartu 2026 + 2027, 1,460 rows (O1k-7 europe, deep3);
  headless engine verified against the live page 36/36 exact (O1k-W12).
- **Comparison:** the published scheme reproduces 100 pc within-1 on all four city-years;
  rule classifications match 1,460/1,460; the clamp binds 134/133 days; the published
  45-120 bounds never move a value (deep3). Grade A.
- **Verdict:** fajr SYNC, isha SYNC (the clamp and fallback are part of the stated scheme
  and are load-bearing exactly as published).

### 10. Latvia — LIKC stated seasonal pair — UNDECIDABLE
- **Stated algorithm:** UOIF 12/12 summer / ISNA 15/15 winter — a stated seasonal scheme
  (O1k-W12, first data, 3 cities).
- **Timetable evidence:** LIKC tables, 3 cities; fit6 read "15/15 operative (the seasonal
  pair renders as a delta)" (O1k-F6); the FIT-INDEX lists LV under captures-only, "no fit
  delivered".
- **Why undecided:** the stated summer 12/12 does not surface as a 12-deg computation in
  the served tables per the operative reading, no day-counted fit exists, and the two
  registries disagree on whether a fit happened at all. Thin (3 cities).
- **Verdict:** UNDECIDABLE — state both readings, no scoring. Cheapest fill: one
  day-counted city-year scored against both stated branches.

### 11. Finland — Helsinki statement — DRIFT (summer), SYNC (asr, winter twilights)
- **Stated algorithm:** published method statement: MWL 18/17 with 1/5-night summer
  (O1k-7 europe: "stated, not derived"); the Helsinki mosque separately states isha =
  maghrib+85 (world table `FI-PORTAL`).
- **Timetable evidence:** Helsinki year, 365 rows banked (O1k-7 europe)
  (`o1k-wide/europe/data/fi-helsinki-rukousaika-2026.json`); the portal's 30 rows.
- **Comparison (scored 2026-11-11 by O1l-21r, own solar engine, Helsinki 60.1699/24.9384,
  TZ Europe/Helsinki, 365 rows):**
  - **asr SYNC, and it settles the madhab:** Shafi asr at zero margin reproduces
    365/365 within 1 (mean +0.10, 260 exact, worst 1). Hanafi is off by −49 min mean. The
    table runs Shafi although the statement names no madhab.
  - **isha SYNC on the clean days:** 17° reproduces **233/233 within 1** (226 exact,
    worst +1) on every day the −17° twilight is actually reached.
  - **isha DRIFT in summer:** on the 118 days the −17° twilight is never reached, the
    stated 1/5-night rule misses by up to 221 min. The served summer isha tracks the
    mosque's **maghrib+85** override instead: within 1 on 43/118, worst −5 — close, not
    exact, and NOT the 1/5 rule.
  - **fajr SYNC on the clean days, floor in summer:** 18° reproduces 227/236 within 1.
    Nine shoulder days (16-19 Apr, 22-26 Aug) and the 118 high-sun days carry a summer
    floor instead, worst 191 min against the stated 1/5 rule. `sunrise − 0.4 × night`
    fits those days within 1 on 24/123, worst 10 — suggestive, not proven.
  - **sunrise/maghrib/dhuhr UNDECIDABLE vs the statement (nothing declared), pads
    measured:** sunrise −4 min (range −6..−3), maghrib +4 (+3..+6), dhuhr +2. The
    day-length pads are the load-bearing part of this table, not the twilights.
- **Verdict:** asr SYNC (Shafi, zero margin); fajr and isha SYNC at the stated 18/17 on
  every clean day; fajr and isha DRIFT through the high-sun season, where the stated
  1/5-night rule is not what the table does and the mosque's own maghrib+85 override is
  closer but still 5 min out. The stated/observed isha gap the record carried is now
  measured: it is a summer rule substitution, not a constant offset.

### 12. Norway — IRN (Rabita line) — DRIFT (owner-ruled)
- **Stated algorithm:** 16/15, matching IRN's national numbers, published at
  rabita.no/bonnetider; the fit reads it with floor rounding and ZERO margin ("the stated
  claim"). `NO-RABITA`, T-668 #6953 (C6).
- **Timetable evidence:** IRN city-years Bergen, Trondheim, Tromsoe + 61-row Oslo Rabita
  table (921-day basis, O1k-W12); Tromsoe carries 235 synthetic polar days (fit8).
- **Comparison (banked, conflicting readings BOTH carried):**
  - fit8 narrative: "BOTH CLAIMED PAIRS HOLD — IRN 16/15 (floor; dhuhr = transit +4.5 CET /
    +9.5 CEST, a DST-DOUBLED SAFETY — a new clock quirk)"; Tromsoe's 130 honest days hold
    16/15 at worst 1; Oslo 61/61.
  - FIT-INDEX `NO-IRN-VERIFY`: Bergen fajr 204/365 exact, 226 within-1, **worst 117 min**;
    span verdict **no**.
- **Both readings (owner-ruled):** the stated pair holds where the twilight is clean
  (Oslo, Tromsoe honest days) and diverges by up to 117 min at Bergen's shoulder season —
  direction not stated in the index (the fit's residual ledger carries it). The dhuhr
  DST-doubling is a 5-min seasonal step against the stated zero-margin reading: the table
  runs +9.5 min late in summer (CEST) vs +4.5 in winter (CET).
- **Verdict:** fajr DRIFT at Bergen (up to 117 min, span-dependent; SYNC at Oslo/winter);
  isha SYNC on honest days; dhuhr DRIFT (seasonal, 5-min step at each DST change, direction
  late-in-summer); the polar-night synthetic days are documented and excluded from the
  honest span.

### 13. Norway — Mawaqeet network line — SYNC
- **Stated algorithm:** 18/15, declared by the network's own articles (which refuse the IRN
  table); full-year XLSX per place, both Asr schools. `NO-MAWAQEET`.
- **Timetable evidence:** the same network's XLSX tables, 4 cities × 365 (O1k-W12).
- **Comparison:** fit8: "mawaqeet 18/15 (midnight cap, summer --:--)" — the claimed pair
  holds on its own tables; the summer cap produces the table's own blank cells.
- **Verdict:** fajr SYNC, isha SYNC (with the declared midnight cap), both-Asr columns as
  printed.

### 14. Norway — Jamiat Ulama / islamweb.no line (Moonsighting) — SYNC
- **Stated algorithm:** Moonsighting Committee's OWN full method statement (the curve
  documented by the body, O1k-W18 capture).
- **Timetable evidence:** the islamweb.no tables, 7 city-years, 2,555 rows (O1k-7 europe).
- **Comparison:** fit8 PROVED the line IS the Moonsighting Committee: fajr 253/365 exact at
  Oslo, isha MC+3.5, Hanafi asr — "the first PROVEN real-world MCW publisher". The tables
  are additionally interval-shaped (integer F/I offsets, seventh-night caps — fit4), the
  construction the MC curve encodes.
- **Verdict:** fajr SYNC (253/365 exact), isha SYNC at MC+3.5 (the +3.5 offset is part of
  the measured recipe, not a stated constant — flagged).

---

## REGION 2 — Middle East + North Africa

### 15. Turkey — Diyanet domestic — SYNC
- **Stated algorithm (doctrine page verbatim, O1k-W18/T-667 #6925):** 18/17; NO temkin on
  imsak/yatsi; -7 attaches to SUNRISE only; dhuhr +5; asr +4; maghrib +7; imsak row IS fajr;
  nearest.
- **Timetable evidence:** Diyanet ilce tables: Istanbul + Ankara 2026 (365 days each) +
  Istanbul 2027 via the awqatsalah API. Grade A (two distinct years).
- **Comparison:** the stated temkin mapping IS the recipe that reproduces the tables
  (grade A under #6943); "isha 17 bottoms the angle scan" — the stated angle is the fitted
  angle; no seasonal switch (16 gives 0/365).
- **Verdict:** fajr SYNC, sunrise SYNC (stated -7), dhuhr/asr/maghrib SYNC (stated +5/+4/+7),
  isha SYNC (stated 17). The folk -10 imsak temkin is refuted on the record.

### 16. Syria — ministry MWL adoption — DRIFT (owner-ruled)
- **Stated algorithm:** dated ministry statement (SANA 2025-02-28) adopting the MWL miqat
  for prayer/imsak/iftar, corroborated by the decree binding the ministry's calendar on
  every mosque. `SY` row, T-667 #6939 (P2).
- **Timetable evidence:** only 6 observed Damascus days + the 38-day-class fits; the
  ministry table itself is unobtainable (awqaf.gov.sy dead, app shells dead, Telegram CDN
  404).
- **Both readings (owner-ruled):** the stated MWL (18/17) is REFUTED at Damascus by the
  observed days — isha misses **4-7 min** at 18 deg (Islamweb's 18/18 also refuted); the
  +2..3 maghrib margin is deliberate (Rounding.Up moves it max 1.00 min). The policy
  adopts MWL; the observed practice sits off it.
- **Verdict:** isha DRIFT (4-7 min, stated-vs-observed, 6 days only); maghrib DRIFT
  (deliberate +2..3 beyond the stated MWL); span caveat: six days, no seasonal span.

### 17. Egypt — ESA — SYNC
- **Stated algorithm:** 19.5/17.5 with ZERO margins on every prayer (the owner's stated
  reading; the library Egyptian() preset ships dhuhr +1 and must be zeroed — re-proven
  71/92 vs 0/92). `EG-ESA`, T-667 #6941 (AB1), #6983 (C31).
- **Timetable evidence:** 2026 full year 365/365 + 48 distinct Cairo days 2022-2026 from
  Wayback + Alexandria/Aswan/Port Said/Luxor/Assiut years (O1k-W5 northafrica2, O1k-T1
  tncities; six-plus cities nationally, 1,095 extra rows).
- **Comparison:** 19.5/17.5 zero-pad is exact-or-1 on every column, every day, every city;
  the free refit returns pad 0 — the stated zero margins are confirmed, not approximated.
  Nearest rounding. Grade A.
- **Verdict:** all six prayers SYNC. Owner flag from the record (carried, not scored): the
  printed Hijri column disagrees with the ANNOUNCING body (ESA 2026-02-18 vs Dar al-Ifta
  2026-02-19) — an option-C override class, not a time drift.

### 18. Morocco — Habous — DRIFT (owner-ruled), partial statement
- **Stated algorithm:** the ministry's own clock prose: 'fuseau:GMT' in its schema; the
  sheets print civil UTC+1 and ignored the Ramadan clock change; decree 2.26.530 makes
  legal time GMT since 20/09/2026 (O1k-W18, O1k-M1 morocco1). Angles/margins: NOT stated
  (the 19/17 pair is derived, census multi-year evidence).
- **Timetable evidence:** the rebuilt ministry portal: 190 cities × 2 months banked
  (11,590 rows) + the census 3-year evidence (117 days 2026 + Wayback 150 days).
- **Comparison:** the stated clock prose matches the served sheets' civil-time printing
  (and the decree now supersedes the Ramadan interaction entirely). The DERIVED recipe as
  recorded passes 0/190 at the rebuilt regime: a NATIONAL MARGIN-REGIME SHIFT at the
  rebuild (fajr +0.42 / asr -1.42 / isha -0.37 mean, worst 2.84); with the rebuilt regime's
  fitted margins, 99.5 pc of all cells within 1.
- **Both readings (owner-ruled):** same angles, two margin regimes, one owner line converts
  Morocco to full A (the conditional-A on record). No adjudication here.
- **Verdict:** clock SYNC (stated); fajr/isha DRIFT ≤1 min at the rebuild; asr DRIFT
  (mean -1.42, worst 2.84, dated regime change at the portal rebuild); maghrib/dhuhr
  UNDECIDABLE vs statement (unstated margins).

### 19. Bahrain — Supreme Council — DRIFT (small, owner-ruled) — scored here
- **Stated algorithm (captured in full, `almajles.gov.bh/Programs/calendar/` + calendar
  book, O1k-W4 gulf2):** Isha = true 18° depression (replacing the conventional +90);
  Fajr and sunrise computed at Dilmunia (26.27 N, 50.68 E); Dhuhr/Asr/Maghrib/Isha at
  Salman (26.22 N, 50.44 E); Dhuhr at the disc's meridian crossing (+1 min over the
  midpoint); Eid at 4° altitude. NO fajr degree stated anywhere (Arabic and English read
  in full).
- **Timetable evidence:** the council's own daily calendar PDF, 355 dated rows 1448
  (2026-06-16 → 2027-06-07 span held: `data/bh-bahrain-calendar-1448.json`), cross-checked
  against the desk book.
- **Comparison (scored here, adhan 4.4.6, TZ Asia/Bahrain, Rounding.None, the two-site
  rule as stated):** residuals = table minus computed, 355 days:
  - maghrib (declared sunset geometry, Salman): mean +0.04, worst +0.65, **355/355 within
    1**, nearest exact 323/355 — the declared geometry reproduces.
  - sunrise (declared site Dilmunia, no margin stated): mean -0.46, **350/355 within 1**,
    floor exact 334/355 — the declared SITE rule reproduces (floor-like rounding).
  - dhuhr (declared transit+1): mean **-1.43**, worst -1.92, within-1 33/355 — the table
    reads ~1.4-1.9 min EARLY vs the stated transit+1 (effectively transit without the +1;
    against the midpoint reading it sits ~0.4 early). Constant, both seasons (-1.41/-1.49).
  - isha (declared true 18°): mean **-1.43**, worst -2.08, within-1 35/355, constant
    (-1.33 winter / -1.55 summer) — the table runs ~1.4-2.1 min EARLY vs its own declared
    degree. Consistent with the independent recovery: isha fits 17.7° at the declared site
    (334/355 exact, MAE 0.06, gulf2) and fajr fits 18.1 Dilmunia / 18.2 Manama (band
    18.05-18.25, no single value admits all 355 days — the surface is almanac-quantised).
- **Both readings (owner-ruled):** the statement says 18° and transit+1; the table behaves
  like ~17.7° and transit-without-+1. Neither is adjudicated here.
- **Verdict:** maghrib SYNC; sunrise SYNC; dhuhr DRIFT (constant ~1.4 min early vs
  stated); isha DRIFT (constant ~1.4-2.1 min early vs stated); fajr/asr UNDECIDABLE (no
  degree/shadow stated anywhere; recovered values recorded above).

### 20. Iran — Astan Qods national table — partial SYNC (weak statement)
- **Stated algorithm:** the secondary parameter chain — fajr ≈ 17.7 via council-member
  testimony — CONFIRMED on the record as published practice. No publisher statement for
  any other prayer (maghrib 4.47° depression is derived; "Isha 14" is a software default
  with NO Iranian publisher). `IR-NATIONAL`, T-668 #6961 (C13).
- **Timetable evidence:** the shrine endpoint, 30 days (Tehran-consistent numbers).
- **Comparison:** the fit min=max at 17.71 across the 30 days — the stated ~17.7 is exact
  at the second decimal.
- **Verdict:** fajr SYNC (17.7 stated vs 17.71 fitted, 0.01 deg); sunrise/dhuhr/asr/maghrib
  UNDECIDABLE vs statement (nothing stated; measured values on the record: maghrib at a
  4.47° depression, sunrise 0.84); isha not published — the table prints NO isha row.

### 21. Lebanon — Al-Amin UAQ statement — UNDECIDABLE
- **Stated algorithm:** Mohamad Al-Amin Beirut states Umm al-Qura in its own iqamah data
  (20/10/10/5/10 offsets) — the region's only mosque publishing method-as-data (T-667
  #6927 M5).
- **Timetable evidence:** the Dar al-Fatwa composite feed: 5 regional annual JSON tables,
  366 UNDATED rows each, year inferentially 2028, fixed UTC+2 re-proved, unfitted — no
  single coordinate reproduces it (O1k-W4 gulf2).
- **Why undecided:** the stated method belongs to a mosque's iqamah configuration; the only
  dated-capable surface is undated and coordinate-unreproducible, so the stated UAQ cannot
  be scored against any dated table. The mosque itself sits ~7 min off the composite at
  maghrib (iqamah-vs-feed, not algorithm-vs-table).
- **Verdict:** UNDECIDABLE — record both readings, score nothing.

---

## REGION 3 — Africa

### 22. Niger — BUTIN — SYNC
- **Stated algorithm (quoted verbatim on the portal):** built on the Umm al-Qura Makkah
  calendar via "Prayer Times 4". `NE`, T-668 #6977 (C26), #6985 (C34).
- **Timetable evidence:** the same portal: 56 region-years (8 regions × 2025-2031),
  20,448 rows, zero integrity failures.
- **Comparison:** both declarations verify exactly: fitted fajr 17.90-17.95 (the UAQ 18°
  fingerprint), isha interval 75.0 on all 240 scored rows, margins exactly 0.00 both
  directions, sunrise/dhuhr/maghrib median 0, nearest ties-up; 100 pc within-1 (69-93 pc
  exact). Frozen by three independent lines (no year branch in the served function;
  per-region-year refits return 17.99-18.01; no date moves >1 min across served years).
- **Verdict:** fajr SYNC, isha SYNC (interval 75 = the UAQ fingerprint), solar columns SYNC.
  Grade caveat on the record: frozen-recomputed vs frozen-reprint is arbitration item 3
  (the arbiter's label stands; not adjudicated here).

### 23. Kazakhstan — DUMK — SYNC (with the load-bearing clamp)
- **Stated algorithm:** the muftiate's ISNA statement — 15/15 uniform nationwide — plus
  the margin rule PUBLISHED VERBATIM in its own served JS: hard-coded 48 N switch, set A
  (<48) sunrise -3 / dhuhr+asr+maghrib +3; set B (≥48) -5/+5; fajr and isha never
  corrected; imsak = fajr+10. `KZ-MUFTIYAT`, T-667 #6921 (L1), T-668 #6970 (C19).
- **Timetable evidence:** muftyat.kz: 5+ full years banked (1,826-day basis) and the
  deep1 harvest to 2100 (9 years × 2 cities, 6,580 rows).
- **Comparison:** the ISNA statement is TRUE only with the TwilightAngle clamp — at 51 N
  the effective angle dips to 11.5 at solstice (fajr = sunrise - 0.25 × night on clamp
  days). WITH the clamp and the JS-published margins: 100 pc within-1, every prayer, every
  year, no trend to 2100 (exact 65.1-70.5 on the deep-span basis).
- **Verdict:** fajr SYNC (as qualified by the clamp — the clamp is part of the publisher's
  own code, so the statement plus its own mechanism reproduces); isha SYNC; solar columns
  SYNC. Flag carried: a bare "ISNA 15/15" reading without the clamp is NOT reproducible —
  the qualification must travel with the object.

### 24. Uzbekistan — islom.uz — SYNC (bundle-stated)
- **Stated algorithm (read from the portal's own bundle):** fajr 15.5 / isha 15.5 / Hanafi;
  display margins +5 at render (Ishroq +20, Shom +4); per-region differ_minute.
  `UZ-ISLOM`, T-667 #6935 (P5), T-668 #6954 (C9).
- **Timetable evidence:** 60 days (Tashkent + Samarkand); attribution settled: islom.uz IS
  the publisher; the state board muslim.uz adds +5 to dhuhr and serves one city one day —
  "the numbers agree" is REFUTED (O1k-W3 centralasia2).
- **Comparison:** the bundle-stated set reproduces the portal's own day to within 1 min;
  the islom.uz grids match praytime.uz (which prints it republishes the Idora taqvim) to
  0-1 min.
- **Verdict:** fajr/isha SYNC (stated 15.5), asr SYNC (Hanafi), display margins as stated.
  Caveat: private-portal provenance (the attribution now favours the portal as publisher).

### 25. Russia — Tatarstan DUM RT — SYNC (stated 45-degree rule)
- **Stated algorithm:** the latitude-45 rule STATED by the Ulama Council (2011, Astrakhan):
  aqrab al-bilad at 45 N — the summer substitute (fajr sunrise-120, isha sunset+90) applies
  where the 18° angle is unreachable (O1k-W18 upgrade, derived→stated).
  `RU-DUMRT`, T-668 #6982 (C23).
- **Timetable evidence:** 44 cities × two years (2025+2026), full-year CSV per city.
- **Comparison:** the substitute is ASTRONOMICALLY BOUNDED — exactly the days 18° is
  unreachable (Kazan 6 May-8 Aug, 95 days; isha switches one day early, consistent with
  shafaq). Multi-year pass OUT OF SAMPLE: 2026-fitted positions on 2025, 100 pc within-1
  every column but isha 2025 (92.2 pc, a ~30 s rounding-pass difference). Grade A.
- **Verdict:** fajr SYNC, isha SYNC (the stated rule reproduces the astronomical bound),
  all columns 100 pc within-1. Flag: never merge across publishers on one national method
  (CDUM/DUM RB/DUM RF are different lines).

---

## REGION 4 — Asia

### 26. China — norislam footnote — UNDECIDABLE (internal contradiction flagged)
- **Stated algorithm (the grid's own footnote, O1k-W1 china):** 15/15 HANAFI, dhuhr +5,
  maghrib +5, imsak -10; the 15-deg decision traces to the China Islamic Association's own
  journal (Zhongguo Musulin 2002 no. 6). The query form STILL SAYS 18/17 — an internal
  contradiction inside one publisher.
- **Timetable evidence:** the norislam computed national grid, 2,460 county points —
  YEARLESS, 3-day sampling; a stated +5 min safety shift instruction. No dated rows banked.
- **Comparison:** live-grid probe only: Lanzhou 1 Jan fajr 07:00 vs 06:59 computed at 15
  deg — matches the stated 15 (1-day probe). The isha/dhuhr stated margins were never
  scored against dated rows; a yearless grid cannot support a span verdict.
- **Verdict:** fajr SYNC-at-probe (single day); isha/dhuhr UNDECIDABLE (yearless surface,
  no span); the 15/15-vs-18/17 form contradiction is flagged **owner-ruled**.

### 27. South Korea — KMF — SYNC (within 1, not to the minute)
- **Stated algorithm (printed on the PDF itself):** MWL at 37.6 N / 127.0 E, ceiling
  rounding (mean +0.02 vs ceil). `KR` row, O1k-W2 koreajapan.
- **Timetable evidence:** the KMF national PDF 2026-02 → 2027-01, 365 rows parsed; one
  typo recorded as printed.
- **Comparison (fit3):** the stated MWL holds to ±1 min: 1,089/2,184 exact, 2,153 within-1,
  one slip day excluded.
- **Verdict:** fajr SYNC, isha SYNC (within-1 across the full cycle; sub-minute exactness
  unattained — the ceiling rounding is stated and matches at mean +0.02).

### 28. Indonesia — Kemenag — SYNC (fajr stated; isha derived)
- **Stated algorithm:** Kemenag Dirjen 2020 states fajr (Subuh) -20°; isha stays DERIVED
  (the T-666 "Isya -18 regional" partial was upgraded by W18: fajr now STATED, isha not).
  The SIHAT tables print the +2 ihtyati. Six-regency 21/19 exception stated by Kemenag's
  own tables (threshold between Deiyai 1,718 m and Paniai 1,786 m; confirmed 6 regencies,
  fajr +0.97 / isha +1.00 vs national median — fit10).
- **Timetable evidence:** SIHAT 2026: 516 regencies / 35 provinces (banked 365 days × 5
  cities scored); ceiling 2029.
- **Comparison (O1k-1 indonesia, confirmed BY MEASUREMENT):** 20 deg +2.0 / 18 deg +2.0 —
  365 days × 5 cities, the +2 being the printed ihtyati; asr reproduces to 0.03 min on the
  solar model. The stated fajr degree plus the table's own margin reproduces the tables.
- **Both readings (owner-ruled, the owner's named example):** Kemenag's +2 ihtyati is a
  printed margin ON the timetable; the algorithm's raw minutes (without ihtyati) sit 2 min
  early. Both are Kemenag's own surfaces; never merge.
- **Verdict:** fajr SYNC (stated 20 + stated ihtyati +2); isha SYNC-at-derived (18 + 2
  reproduces; the degree itself unstated); the 21/19 highland exception SYNCs at exactly
  six regencies (12/12 exact, fit10).

### 29. Indonesia — Muhammadiyah KHGT — SYNC
- **Stated algorithm:** the Majelis Tarjih pair as carried by the record: 18/18, ceil +1
  (the demanded margin measured 1.000-1.017 min, wandering 2 s across the decade). Second
  national line, NEVER merged with Kemenag (arbiter ruling O1k-X4).
- **Timetable evidence:** the KHGT API: 2025-2035 any coordinate (banked: 3 latitudes +
  Banda Aceh; 1,846 rows basis).
- **Comparison:** 100 pc within one on 1,846 rows across three latitudes and the NW anchor;
  62/62 within 1 in all 18 city-years (verify2); prints 7.8 min later than Kemenag fajr
  (7.9-8.5 by city) EVERY year — a DATED two-line divergence.
- **Verdict:** fajr SYNC, isha SYNC. The Kemenag-vs-Muhammadiyah gap is the owner's named
  two-line decision (DECISIONS.md item, carried).

### 30. Sri Lanka — ACJU — UNDECIDABLE
- **Stated algorithm:** the sheets NAME the method: M.I. Abdus Samad Makdoomi (printed on
  every sheet). The Makdoomi parameter set is NOT on the record — the census has never
  captured published degrees for the name.
- **Timetable evidence:** 721 rows across 13 zones + seasonal months; the derived recipe:
  fajr 19.75 / isha 18.2 to second-level precision, safety trio +1.1..+2.2, storey bands,
  dual Asr (C14/C25).
- **Why undecided:** the derived recipe reproduces the sheets, but the comparison the
  owner ordered is STATED-vs-TABLE, and the statement is a name without numbers. No
  parameter set exists to score.
- **Verdict:** UNDECIDABLE — the name is stated, the parameters unknown. Fill path: locate
  a Makdoomi parameter publication (print class; not found on the web under these terms).

### 30b. Brunei — MABIMS pair — EMPTY-COMPARISON (weak statement provenance)
- **Stated algorithm:** Subuh 20 / Isyak 18 (Odeh 2024 rev 17 Dec 2024) — community-sourced
  (O1k-W16 sea2); the ministry publishes data without angles (W18 negative).
- **Timetable evidence:** MORA OData serves any month/year to 2026-12-31 — bakeable,
  unfitted (T-665 #6882, T-666 #6893).
- **Verdict:** EMPTY-COMPARISON. Cheapest fill: one OData month scored against 20/18 +
  margins; caveat carried: the statement is not the ministry's own wording.

---

## REGION 5 — Americas

### 31. United States — FCNA — SYNC (majority line) with one stated contradiction
- **Stated algorithm:** FCNA published scheme 15/15 USA (the 2011 second witness adds the
  moonsighting functions with fallback 17.5/15 — three dated statement layers, O1k-W18).
- **Timetable evidence:** the mosque mosaic: 134 US mosque feeds measured (O1k-U1 usmap);
  8 clean 15/15 surfaces (O1k-W14); Dar al-Hijrah 365 rows at 15/15 MAE 0.4/0.7;
  16-mosque capture (O1k-5 americas).
- **Comparison:** the stated 15/15 reproduces the majority of held tables — 105/134 US
  mosques (78.4 pc) at exactly 15/15, 15-deg fajr at 81.9 pc; the three-product
  confirmation (Masjidal + dpt + one more) makes 15/15 the measured default.
- **Contradiction (owner-ruled, recorded not adjudicated):** Chicago's Islamic Foundation
  prints FAJR 18 / ISHA 15 / ASR HANAFI — the pre-2015 FCNA convention — explicitly
  contradicting the stated 15/15 on every page of its full-year calendar. The unstated
  big-city columns sit at-or-earlier than the 18-degree line (community skew conservative).
- **Verdict:** fajr SYNC (15-deg majority), isha SYNC (majority); Chicago DRIFT (stated 18
  vs the 15-deg family — direction: deeper angle, earlier fajr; magnitude not quantified
  on the record); the mosaic ceiling stands.

### 32. Canada — FCNA 13/13 — DRIFT (owner-ruled) — direction scored here
- **Stated algorithm:** FCNA 13/13 for Canada, printed in the same sentence as the USA's
  15/15 on the council's own page (O1k-5 americas), with the 2011 fallback layer.
- **Timetable evidence:** 26 Canadian mosque feeds (O1k-U1); Masjid Toronto + Islamic
  Institute full years (fit5); five prairie November prints.
- **Comparison:** ZERO mosques at 13/13 anywhere in the corpus. Toronto's two largest:
  fajr 14.9-15.2 deg + isha intervals maghrib+80/+90 — fit5: "NEITHER is FCNA 13/13
  (misses 15-25 min)". Scored here (Toronto 43.6532/-79.3832, 2026): the stated 13-deg
  pair prints fajr **11 min later** (Dec) to **17 min later** (Jun) and isha **11 min
  earlier** (Dec) to **18 min earlier** (Jun) than the 15-deg practice — the stated pair
  does not reproduce any held Canadian table.
- **Verdict:** fajr DRIFT (~11-17 min, stated-later-than-practice), isha DRIFT (~11-18
  min, stated-earlier-than-practice); the divergence is seasonal (amplitude ~6 min across
  the year at Toronto's latitude).

### 33. New Zealand — FIANZ — SYNC on stated offsets; degrees UNDECIDABLE
- **Stated algorithm (printed verbatim on the Ramadan sheets):** suhoor = fajr - 5;
  maghrib = sunset + 5; single-shadow Asr primary with double-shadow +40 later. The
  federation states NO angles. `NZ-FIANZ`, O1k-W15 oceania2, fit13.
- **Timetable evidence:** Ramadan 1447 sheets, 33 cities; Auckland/Wellington/Christchurch
  transcribed (90 rows).
- **Comparison:** the stated offsets hold everywhere (fit13). The ANGLES are city-specific
  and unstated: Auckland 18/18, Wellington 16/15, Christchurch 16/15 (sd ~0.05 deg) — the
  sheets aggregate city methods, not a federation method.
- **Verdict:** the stated offsets SYNC on every sheet; fajr/isha degrees UNDECIDABLE
  (unstated, city-specific measured pairs); Asr school SYNC (single-shadow stated and
  served). Contradiction carried: the sheets start Ramadan 19 Feb while the Hilal
  Committee announces 20 Feb (owner call W-item, not a time drift).

### 34. Australia — Diyanet-label mosques — SYNC (domestic encoding)
- **Stated algorithm:** Auburn Gallipoli's own API PRINTS "Diyanet" as its method; the
  Diyanet full-year surfaces (Broadmeadows, Preston, Brisbane) carry the same label class.
  O1k-W15 oceania2, fit13.
- **Timetable evidence:** the four surfaces, 1,421 rows; Gallipoli two years frozen.
- **Comparison:** the label is TRUE only under the DOMESTIC temkin encoding: 18/17 with
  sunrise -7 / dhuhr +5 / asr +4 / maghrib +7 (adhan's Turkey encoding verbatim); the
  European 18/16 scores exact 0 on the temkin prayers; every prayer within 1 on 1,421
  rows.
- **Verdict:** all prayers SYNC with the domestic temkin set. Flag: the same label
  ("Diyanet") means 18/16-temkin-less in Europe and 18/17-full-temkin here — the label is
  a family name, the encoding is local.

---

## BORDERLINE cases recorded, not scored (statement absent from the record)

These hold derived recipes and dated timetables but NO captured statement of parameters by
the publisher; per the brief's "never invent a parameter: unknown is unknown" they do not
enter the matrix: Czechia (12/12+margins derived; engine-gap), Slovenia (seasonal angles
fitted), Bosnia (18/16 fitted), Albania (18/17 fitted), Kosovo (margins measured per
edition), Bulgaria, Greece (Athens/Komotini), Cyprus KKTC, Palestine, Jordan, Qatar, Kuwait,
Iraq, Yemen, UAE (ridge-degenerate), Oman (derived 17.8/18.15), Saudi Arabia (publishes NO
parameters anywhere — explicit), Libya, Tunisia, Mauritania, Gambia, Senegal (interval
rules derived), Burkina, Kenya, Maldives (MABIMS text unpublished online, W18), Thailand,
Malaysia (JAKIM publishes data without angles, W18), Singapore (same), Kyrgyzstan (ratio
derived), Tajikistan (windows), Ukraine (intervals derived), Taiwan (rule derived,
buffers editorial), Hong Kong (three constructions), Pakistan (chart is a scanned image,
no method page, W18), Fiji, Luxembourg (13.0/12.9 fitted, not stated), Guatemala,
Honduras, Suriname, Venezuela, Brazil, Chile ("No method stated" — explicit), Trinidad,
Iceland (derived), France GMS (sweeps only).

---

## EMPTY-COMPARISON queue (feeds the fit queue)

| Row | Cheapest fill |
| --- | --- |
| Finland | **FILLED 2026-11-11 (O1l-21r)** — see §11: asr SYNC (Shafi 365/365), fajr/isha SYNC at 18/17 on the 233-236 clean days, both DRIFT through the high-sun season (the stated 1/5-night rule is not the served rule) |
| Austria (IGGÖ) | One IGGÖ-published city-year; score the stated 18/16 + full temkin |
| Switzerland (IZRS) | Score the stated 12.5/13 seasonal pair against the 30 banked Ramadan rows; or one non-Ramadan city-month |
| Brunei | One MORA OData month scored against Subuh 20 / Isyak 18 (+ margins); statement is community-sourced citing Odeh 2024 — capture the ministry's own wording if it exists |

## Provenance of the two scored rows

- Montenegro: `o1k-wide/balkans2/data/me_grp-1_vaktijame_2026.json` (365 days, Podgorica
  anchor; O1k-W11 capture) + the IZCG declaration
  (`o1k-wide/balkans2/captures/me_monteislam_vaktija.html`). Engine adhan 4.4.6, TZ
  Europe/Podgorica, Podgorica 42.4410/19.2630, Shafi, Rounding.None (rounding not
  declared). Raw output: `data/score-runs.txt`.
- Bahrain: `o1k-wide/gulf2/data/bh-bahrain-calendar-1448.json` (355 days, council daily
  calendar PDF; O1k-W4 capture) + the council method statement (`almajles.gov.bh`).
  Engine adhan 4.4.6, TZ Asia/Bahrain, the two-site rule as stated (fajr/sunrise Dilmunia
  26.27/50.68; dhuhr/asr/maghrib/isha Salman 26.22/50.44), Shafi, Rounding.None (rounding
  not declared; floor fits sunrise/dhuhr/isha best and is reported). Raw output:
  `data/score-runs.txt`.
- Direction probes (scored here, single dates): Toronto 13-vs-15 (2026-06-01, 2026-12-01,
  TZ America/Toronto); Berlin isha 17-vs-16 (2026-01-15, TZ Europe/Berlin); Stockholm isha
  17-vs-16 (2026-01-15, TZ Europe/Stockholm).

Nothing under /tmp; the repository untouched; no subagents; no web fetches needed this
session (every gap closed from the banked record; the two scored rows use banked captures).
