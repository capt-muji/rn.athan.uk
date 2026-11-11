# DISPLAY-RULES.md — the display and convention rule register

Built 2026-11-11 from the o1k-wide night. These are the DISPLAY and CONVENTION rules that
sit beside the calculation recipes: things an app must carry as data or rules to reproduce
what publishers actually print. Calculation recipes live in FIT-INDEX; this register is
their complement. Machine-readable: `display-rules.json`.

Classes: **clock-ladder** (wall-clock constants, ladders, caps), **hand-block**
(hand-maintained blocks and synthetic plateaus), **override-date** (dated overrides and
edition changes), **column-convention** (what a printed column means and how it relates to
its neighbours), **feed-gate** (ingest gates: trust, parse, date-assignment), **regional-offset**
(per-region minute tables carried beside a generator).

Counts: clock-ladder 11, hand-block 4, override-date 7, column-convention 17, feed-gate 10,
regional-offset 6. Total 55.

---

## clock-ladder (11)

- **CL-01 · Pakistan · federal Nizam-e-Salat chart** — Dhuhr adhan prints exactly two wall-clock
  values, 13:00 x183 and 13:15 x183, switching 15 Apr and 15 Oct; no solar term survives
  (best transit+margin scores 32/366). Per-date table. ATHAN-affecting.
  Source: `fit1/REPORT.md`; confirmed `verify3/REPORT.md`.
- **CL-02 · Pakistan · federal Nizam-e-Salat chart** — Isha adhan is a 15-minute clock ladder of
  19 steps (11 distinct quarter-hour values on ~20 hand-set switch dates), including one
  30-minute drop on 1 Oct; the editorial switch dates defeat any angle. Per-date table.
  ATHAN-affecting. Source: `fit1/REPORT.md`; confirmed `verify3/REPORT.md`.
- **CL-03 · Tajikistan · 143-month archive** — Dhuhr window's left bound is a wall-clock constant
  per era: 13:00 to 2019-06-30, 12:40 from 2019-07-01, transitional 12:50 through Oct 2020;
  the convention change is dated to the day. Per-date table. ATHAN-affecting.
  Source: `deep2/REPORT.md`; archive from `centralasia2`.
- **CL-04 · Minsk (Belarus) · islambel.by 2025** — Fixed clock caps pin fajr at exactly 03:08 for
  14 days and isha at exactly 23:06 for 13 days over the publisher's smooth internal curve.
  Per-date table. ATHAN-affecting. Source: `fit6/REPORT.md` (job4).
- **CL-05 · Netherlands · VIN consensus calendar** — 18/17 with hard 03:30 floor and 23:30 cap
  printed literally; the caps bind far wider than the VIN declaration states (95-104 days per
  benelux2, 190-208 printed days per fit9). Global flag. ATHAN-affecting.
  Source: `fit9/REPORT.md` (job1); benelux2 (CONSOLIDATION W9).
- **CL-06 · Guinea · Nono Grande Mosquee (Mawaqit year)** — Dhuhr pinned at a fixed 13:45 wall
  clock on all 365 rows (config, not computed). Global flag. ATHAN-affecting.
  Source: `fit3/REPORT.md`.
- **CL-07 · Cote d'Ivoire · COSIM monthly calendar (authority)** — Zouhr and assr print as fixed
  13:00/16:00 national convention regardless of transit. Per-month block. ATHAN-affecting.
  Source: `sahel2/REPORT.md` (CONSOLIDATION W6).
- **CL-08 · Morocco · ministry sheets and rebuilt portal** — Sheets print civil UTC+1 (the declared
  fuseau:GMT clock) and ignore the national Ramadan clock change to UTC+0; the renderer must
  apply the shift itself. Global flag + per-date interaction. ATHAN-affecting.
  Source: world-table Morocco row; `methods18`; `morocco1`.
- **CL-09 · Lebanon · Dar al-Fatwa five-region tables (masjidi)** — Fixed UTC+2 year-round while
  the platform declares Asia/Beirut: a rendering shift; the inferred year (2028) is never a
  published date. Global flag. ATHAN-affecting. Source: `gulf2/REPORT.md`.
- **CL-10 · Canada · Kitchener mosque year** — Isha caps at exactly 22:10 for 89 days.
  Per-date table. ATHAN-affecting. Source: `americas2/REPORT.md` (CONSOLIDATION W14).
- **CL-11 · Hong Kong · Trustees sheet, page 2** — Page 2's dhuhr prints at a fixed 13:00 clock
  while page 1 of the same print uses noon+15. Per-column print. DISPLAY-only.
  Source: `deep3/REPORT.md` (hk-deep).

## hand-block (4)

- **HB-01 · New Caledonia · Noumea board** — Dhuhr/asr/isha land on the 5-minute grid as
  hand-maintained blocks: dhuhr in 19 runs tracking transit+30, asr in 13 runs around
  shadow-1+2; block envelopes no formula reproduces. Per-date table. ATHAN-affecting.
  Source: `fit13/REPORT.md` (job3); `oceania2/REPORT.md`.
- **HB-02 · Norway (Tromsoe) · IRN year** — 235 printed days are a polar-night synthetic: the
  boundary pair is held and crept ~0.2-0.5 min/day into solstice plateaus across three
  ranges; only 130 honest days carry real geometry. Per-date table. ATHAN-affecting.
  Source: `fit8/REPORT.md`.
- **HB-03 · Sweden · IF national table** — The table clamps through summer into a smooth
  solstice plateau (fajr run 9 at 02:20, isha 12 at 23:12) with a proprietary mechanism;
  frozenLatitude45 scores 0/118. Per-date table. ATHAN-affecting. Source: `fit8/REPORT.md`.
- **HB-04 · Belgium · EMB calendar** — Inside dated windows (isha 2026-05-01..08-12, fajr
  05-10..08-02) the table prints flat plateaus plus lat-45 middle arcs; outside them the
  18-deg isha curve returns; the 17-deg object is refuted. Per-date table. ATHAN-affecting.
  Source: `fit9/REPORT.md` (job2); benelux2.

## override-date (7)

- **OD-01 · Saudi Arabia · KACST umqserv** — Isha = maghrib + 120 on every Ramadan day, + 90
  otherwise, month-exact on the API's own Hijri boundaries (1448 Ramadan is 29 days: never
  assume 30); zero violations across 6 Hijri years to 1500H. Per-date table. ATHAN-affecting.
  Source: world-table Saudi row; `deep1/REPORT.md`; `gulf2/REPORT.md`.
- **OD-02 · New Caledonia · Noumea board** — Isha jumps to a 20:15 taraweeh override for exactly
  Ramadan 1447H (Feb 18-Mar 18), 20-35 min past any twilight angle; the free season grades
  sunset+85 in 7-day blocks. Per-date table. ATHAN-affecting. Source: `fit13/REPORT.md`.
- **OD-03 · Sweden · Angeredsmoske/Goeteborg PDF** — On Fridays the jumu'ah time (12:15) is
  printed in the dhuhr column; skip or model Fridays. Per-date table. DISPLAY-only.
  Source: `europe/REPORT.md`.
- **OD-04 · Australia · Auburn Gallipoli API (+ Diyanet diaspora tables)** — Friday dhuhr rows
  are khutbah overrides, worst 55 min. Per-date table. DISPLAY-only.
  Source: `fit13/REPORT.md` (job1).
- **OD-05 · Japan · Tokyo Camii stated method** — 12:30 Jumu'ah is written directly into Friday
  dhuhr. Per-date table. DISPLAY-only. Source: `koreajapan/REPORT.md`.
- **OD-06 · New Zealand · FIANZ sheets vs its own Hilal Committee** — The sheets start Ramadan
  Thu 19 Feb 2026 while the same federation announces Fri 20 Feb; D7 recommends the
  announced date governs Ramadan 1 and the table's times stand. Per-edition block.
  ATHAN-affecting. Source: `oceania2/REPORT.md`; `decisions/DECISIONS.md` D7.
- **OD-07 · Burkina Faso · MSBF 2021 vs 1447 editions** — The 1447 edition prints fajr 5 minutes
  later every day at the same angle and re-sets the isha block walk; sun-anchored columns
  identical, so the change is editorial, dated by edition. Per-edition block.
  ATHAN-affecting. Source: `fit10/REPORT.md`; `decisions/DECISIONS.md` D4.

## column-convention (17)

- **CC-01 · Senegal · CERFI Dakar** — Two-dawn convention: the column printed "sunrise" is
  dawn-2 (Suba, sunrise-60.5); dawn-1 Fajar is sunrise-75.5; the 2011 columns_note
  "Suba = sunrise" is wrong. Edition-stable 2011 to 2026. Global flag. ATHAN-affecting.
  Source: `fit3/REPORT.md`; captures in `africa` and `sahel2`.
- **CC-02 · Hong Kong · Trustees sheet + masjidal feed** — Three constructions on one print:
  page 1 angles (fajr ~18.5, isha ~21.3, noon+15), page 2 fixed intervals (sunrise-80, 13:00
  clock, Hanafi asr, maghrib+80), the feed a hybrid (page 1's fajr, page 2's isha, neither
  page's dhuhr/maghrib); the object is a per-column table of which page each column comes
  from. Per-column print. ATHAN-affecting. Source: `deep3/REPORT.md` (hk-deep).
- **CC-03 · Southern Africa · Jamiat KZN generator** — The dhuha column is
  sunrise + (sunset+3 - sunrise)/4, a quarter of the daylight span, not sunrise+195; its
  offset is latitude-dependent (190 Luanda to 211 Maseru). Global flag. DISPLAY-only.
  Source: `fit6/REPORT.md` (job2).
- **CC-04 · Bahrain · Supreme Council calendar** — Two-site rule, stated: Fajr and sunrise at
  Dilmunia (east), dhuhr/asr/maghrib/isha at Salman (west); Eid at 4 deg altitude.
  Global flag. ATHAN-affecting. Source: `gulf2/REPORT.md`.
- **CC-05 · Pakistan · federal chart** — The four jamaat columns are fixed offsets from their
  adhan columns (+27 fajr, +15 dhuhr, +15 asr, +15 isha). Global flag. DISPLAY-only.
  Source: `fit1/REPORT.md`.
- **CC-06 · New Zealand · FIANZ Ramadan sheets** — Printed offsets hold verbatim and carry as
  stated: suhoorEnds = fajr - 5 exactly (sd 0), maghrib = sunset + 5, asr single-shadow with
  the double-shadow column +40. Global flag. ATHAN-affecting.
  Source: `fit13/REPORT.md` (job2); `oceania2/REPORT.md`.
- **CC-07 · Portugal · CRIL calendar** — The header states isha "12 deg + 3 min and 01:20"
  while the interval column is maghrib + 77 exactly; one recipe spans 2023/2026/2027, so
  header and column reconcile as data. Global flag. ATHAN-affecting.
  Source: `fit9/REPORT.md` (job3); `iberia2`.
- **CC-08 · Norway · mawaqeet network tables** — Summer isha prints a literal `--:--` (null, not
  substituted) on 110-142 days; carry the null, never back-fill a bridge. Per-date table.
  ATHAN-affecting. Source: `fit8/REPORT.md`.
- **CC-09 · Estonia · EIC published scheme** — The published 45-120 minute clamp never moves a
  value (what fires is the unbounded quarter-night guard); the clamp describes code, not
  output. Global flag. DISPLAY-only. Source: `deep3/REPORT.md` (ee-deep).
- **CC-10 · England · LUPT and the town mosaic** — The modal form is LUPT's own construction
  (fajr = sunrise - F[MM-DD], isha = maghrib + I[MM-DD]); offset clusters are
  publisher-shaped; 70 pc of towns are irreducibly per-town (~730 B arrays) — the UK outside
  London ships as per-town data or not at all. Per-date table. ATHAN-affecting.
  Source: `fit14/REPORT.md`; `fit4`, `fit12`; `uktowns2/REPORT.md`; `verify3` (uk).
- **CC-11 · Platform-wide · Masjidal** — Two-layer rule (R3): the athan layer is
  platform-generated, the iqamah layer is tenant configuration; never read as one table.
  Global flag. DISPLAY-only. Source: `decisions/DECISIONS.md` R3; `c42-masjidal/report.md`.
- **CC-12 · Malaysia (Kelantan) · mufti zon posters** — The flagged +1 is a one-minute column
  convention on subuh+syuruk together, not a recipe; both zones are JAKIM 18/17 at different
  reference points. Global flag. ATHAN-affecting.
  Source: `fit10/REPORT.md` (kelantan); `kel2`.
- **CC-13 · Lithuania · muftiate rolling week** — The Turkish-label surface carries
  Diyanet-shaped column conventions (sunrise -7, dhuhr +5, asr +6, maghrib +8); the solar
  columns need these applied before they compare. Global flag. ATHAN-affecting.
  Source: `fit6/REPORT.md` (job4).
- **CC-14 · Latvia · LIKC paired renders** — The fixed column offsets between render pairs
  (+3 sunrise, -3 maghrib, -3 asr, -1/-2 dhuhr) are the IslamicFinder widget's conventions,
  not publisher data; only the fajr/isha delta is the stated seasonal scheme. Global flag.
  DISPLAY-only. Source: `fit6/REPORT.md` (job4); `nordics2`.
- **CC-15 · Norway · IRN tables** — Dhuhr = transit + 4.5 in CET months, + 9.5 in CEST months:
  the 5-minute safety lands DST-doubled, keyed to wall-clock seasons. Global flag.
  ATHAN-affecting. Source: `fit8/REPORT.md`.
- **CC-16 · Tajikistan · window tables** — Window grammar: six window columns whose ends chain —
  dhuhr ends 1 min before asr (698/743), asr 1 min before the sunset bracket (734), the
  bracket 1 min before maghrib (714); isha ends at next-day fajr within a minute (684/720);
  maghrib's window is unchained at 40-41 min; fajr's right bound is the surface's own
  sunrise. Per-date table. ATHAN-affecting. Source: `deep2/REPORT.md`.
- **CC-17 · Saudi Arabia / UAE · iqamah conventions** — Iqamah is mosque-layer convention, never
  merged with athan: KSA's presidency homepage iqamah widget is defective (fixed
  25/20/20/15/20 offsets on a mis-keyed adhan field, wrong at fajr/maghrib/isha); UAE's
  federal feed is athan-only, mosque jama'ah times behind a separate gated city service.
  Global flag. DISPLAY-only.
  Source: `census/c12-gulf/data/manifest.json`; world-table Saudi and UAE rows.

## feed-gate (10)

- **FG-01 · Platform-wide · dpt and installed feeds** — Feed-vs-live gate (R5): a feed counts as
  evidence only once gated against its own live page; platform TZ and rounding fields are
  untrustworthy at ingest. Recurrences: IANT Dallas's dpt feed contradicts its own live
  widget all 364 days; Slough/Walsall defective installs; Toledo prints the whole DST window
  on standard time (sunrise exempt); San Antonio's wrong-side asr on DST weekends; dpt
  filter=month ignores its params (parse what d_date covers). Global flag. ATHAN-affecting.
  Source: `decisions/DECISIONS.md` R5; `americas/REPORT.md`; `uktowns2/REPORT.md`;
  `fit6/REPORT.md` (job3); world-table platform table.
- **FG-02 · Chile · Centro Islamico de Chile monthly PDFs** — belongsToDate rollover: archived
  Decembers print post-midnight isha as 00:xx on its own date's row — a 00:xx isha belongs
  to the previous civil date; November's 23:59s are not truncation. The app's belongsToDate
  test case. Per-date table. ATHAN-affecting.
  Source: world-table Chile row; `census/c17-chile/`.
- **FG-03 · Fiji · FML widget vs printed sheets** — Two standing editions disagree stably
  (dhuhr +5 constant, maghrib +2/+3, isha +6..+10); the sheet's maghrib equals the widget's
  iqamah column daily; a fit and any display must name its edition (D1). Per-edition block.
  ATHAN-affecting. Source: `oceania2/REPORT.md`; `decisions/DECISIONS.md` D1.
- **FG-04 · Platform-wide · method labels** — Never read a label as provenance: masjidway's
  "UK Unified Timetable" is a platform method, not LUPT (three towns drift +2..+15).
  Global flag. ATHAN-affecting. Source: `uktowns2/REPORT.md`.
- **FG-05 · Oman · MARA calendar pages** — Parse trap: dhuhr/asr/maghrib/isha print in 12-hour
  form with no meridiem while fajr/sunrise are 24-hour, and dhuhr prints 11:59 in October in
  24 hours; a naive parser produced 51 corrupt 23:59 cells in the banked 2028 file.
  Per-date table. ATHAN-affecting. Source: `deep2/REPORT.md`; `gulf2/REPORT.md`.
- **FG-06 · Egypt · ministry postback** — The form's option values carry tatweel; exact Arabic
  spelling is load-bearing. Global flag. ATHAN-affecting.
  Source: `northafrica2/REPORT.md` (CONSOLIDATION W5).
- **FG-07 · Platform-wide · mawaqit** — Mandatory trap suite at ingest: today-row anchoring,
  solar gate, byte-identity-vs-default, iqama form detection (minute offsets in some
  mosques, absolute clock times in others), TZ-field distrust, calendar-year resolution.
  Global flag. ATHAN-affecting. Source: world-table platform table; `decisions` R5.
- **FG-08 · China · norislam grid** — The footnote states 15/15 HANAFI +5/+5 imsak -10 while
  the query form says 18/17; the live grid measures 15 deg. Trust the footnote and the
  measurement, never the form's stated pair. Global flag. ATHAN-affecting.
  Source: `china/REPORT.md` (CONSOLIDATION W1).
- **FG-09 · Iceland · felagmuslima API** — The record's December +90 display rule does not
  exist: zero days at a 90-minute isha-maghrib gap in any of six series; drop the clause
  (it misreads the summer quarter-night substitution as a winter rule). Global flag.
  ATHAN-affecting. Source: `deep3/REPORT.md` (is-deep).
- **FG-10 · Kazakhstan · kmdb visitor clock** — The visitor-clock DST trap measures exactly +60
  on all columns: the rendered page's clock shifts, not the data; a capture gate.
  Global flag. DISPLAY-only. Source: `centralasia/REPORT.md`; `deep1`.

## regional-offset (6)

- **RO-01 · Algeria · ministry Hijri books, per-wilaya register** — The register (6 prayer rows
  x 25 northern wilayas of signed minutes, reprinted monthly with recalculated values) is a
  DISPLAY AID, not the generator: regional books are computed at their own coordinates with
  the frozen Algiers recipe, and the register's 4-min/degree rule misses uncovered books by
  up to 45 min. Per-month block. DISPLAY-only.
  Source: `fit11/REPORT.md`; `fit2/REPORT.md`; `verify3/REPORT.md`.
- **RO-02 · Taiwan · CMA Ramadan editions** — The interval rules are edition-stable (fajr
  sunrise-70, isha maghrib+90, dhuhr noon+19) but the 8-city offset table moves every
  edition except two cells; carry offsets per edition, edition stamped. Per-edition block.
  ATHAN-affecting. Source: `fit3/REPORT.md` (tw); `china`; `decisions` D9.
- **RO-03 · Indonesia · Kemenag SIHAT 516-regency table** — Exactly six highland regencies
  (>= 1,786 m) print both twilights 1.0 deg deeper (21/19); Kemenag's publisher policy, not
  physics — Muhammadiyah prints plain 18/18 at Puncak Jaya's 3,396 m. Carry as a named
  regional exception; never derive from elevation. Global flag. ATHAN-affecting.
  Source: `fit10/REPORT.md`; `indonesia`, `sea2`; `decisions` D8.
- **RO-04 · Mauritius · Jummah Masjid PWA year + llms.txt** — Six regional adjustment minutes as
  fixed symmetric tiers (+2 maghrib / -2 sehri, +3/-3, +4/-4) — three tiers x two
  directions, publisher-stated, no per-town curves. Global flag. ATHAN-affecting.
  Source: `fit3/REPORT.md` (mu); `southernafrica2/REPORT.md`.
- **RO-05 · Montenegro · IZCG portal** — Stated 19.5/17.5 Shafi carries per-city minute shifts
  (6 city-groups at the Podgorica anchor). Per-month block. ATHAN-affecting.
  Source: `balkans2/REPORT.md` (CONSOLIDATION W11).
- **RO-06 · Serbia · Devridaim offset table** — The offset table is a 3-group design (fajr+
  sunrise / dhuhr / asr+maghrib+isha), not render damage; read the groups as designed.
  Per-month block. DISPLAY-only. Source: `balkans2/REPORT.md` (CONSOLIDATION W11).
