# GAPS-CLOSED — O1l-25 (flagged-gaps closer)

Closed 2026-11-11. Engine adhan 4.4.6 (`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`),
`Rounding.None` at second resolution, then an explicit per-column rounding; TZ pinned per country
(`Africa/Tunis`, `Asia/Muscat`, `Europe/Vienna`, `Asia/Brunei`); every date built from a literal
capture string; no clock read. Raw captures in `captures/`, normalized rows in `data/`, scripts in
`scripts/`. Nothing was written outside this workspace; the repository was not touched.

---

## 1. TUNISIA — the "July angle" is not a July window and not an angle

**VERDICT:** The class is a dated regime change at the turn of 2026: the 20 Kairouan and Sidi Bouzid
delegations drop the DEM horizon-dip term (dip -> 0) and keep the 18.1/18.1 angle, from between
2025-12-15 and 2026-01-15 onward, all year. The "July" label was a season-sampling artifact: those
delegations' only summer block on record was 2026-07, while their other seasons (2024-10, 2025-01,
2025-04) are pre-change.

**Fit-index row text:**
`TN-INM-FLAT2026 | Kairouan + Sidi Bouzid (20 delegations) | 18.1/18.1 Shafi, dip 0 (elevation term dropped), dhuhr +7, maghrib +2, round | 2026-01-01+ | 100/100 July rows within 1 both columns; 129-day 2026 replay at Kairouan and Sidi Bouzid 100% within 1 | DATED SPLIT: dip restored before 2026-01-01 and for the other 238 delegations | no angle change`

**Evidence.**
- Class membership re-derived from `tunisia-cities/data/tn-july-class.json`: 20 of 258 delegations
  (10 Kairouan, 10 Sidi Bouzid); the other two delegations in those governorates (Sidi Ali Ben Aoun,
  Souk Jedid) are not in the class.
- 18.1 at **dip 0** reproduces all 100 banked July rows (20 delegations x 5 days) within 1 minute on
  fajr and isha, worst 1. 18.1 at the fitted DEM dip reproduces 0 of them.
- 2026 full-window replay (129 days each, 2026-05..09 plus probes): Kairouan and Sidi Bouzid 100%
  within 1 on both columns at dip 0; 2.3-3.9% at the DEM dip.
- Probes at 2026-01-15, 02-15, 03-15, 04-15, 10-15, 11-15 show the same flat-horizon depression all
  year (Kairouan 17.69-17.79 angle-equivalent, Sidi Bouzid 17.34-17.50) — **not a July window**.
- 2025 at 05, 06, 07, 09, 10, 11, 12 keeps the DEM dip (18.0-18.1 angle-equivalent); 2025-12-15 still
  needs the dip, 2026-01-15 does not.
- Control: Sidi Ali Ben Aoun (same governorate, not in the class) keeps 18.1 at its DEM dip through
  2026 (45 days, 100% within 1).
- The class's per-delegation "17.1-17.6 July angle" is exactly `18.1 - dipDem` (mean error 0.23 deg,
  the july-class scan's 0.1-step and lowest-angle tie-break): the dip, read as an angle.

**Rule-form name for the fit index:** `TN-INM-FLAT2026` — elevation-dip term dropped, angle
unchanged, 20 delegations, 2026 onward.

---

## 2. OMAN — the ridge is degenerate; both parameterizations carry the span

**VERDICT:** On the full 2021-2031 span at seven cities (28,105 city-days) neither parameterization
is refuted: both hold 100% within 1 on fajr, isha, sunrise, dhuhr and maghrib at every city. The
exact-rate difference is a rounding-convention and reference-point artifact, not an angle
discrimination. **Both carry; the conflict dissolves.**

**Fit-index row text:**
`OM-MARA | 7 cities (Muscat + Salalah/Sohar/Nizwa/Sur/Ibri/Buraimi) | 2021-01-01..2031-12-31, 4,015 rows each | fajr/isha 17.8-18.15 deg, Shafi, +5 dhuhr/asr/maghrib | nearest, or ceil with -1 on fajr/isha | 18/18 nearest: 100% within 1 on every column at every city; 17.8/18.15 ceil: 100% within 1 everywhere except asr at the six cities (98.8-99.6%, max 2) | RIDGE DEGENERATE: the 100%-within-1 band is 0.3-0.45 deg wide and both pairs sit inside it under their own rounding | the exact-rate split is the rounding mode, not the angle`

**Evidence.**
- Harvest: `mara.gov.om/calendar_page2.asp` year x month x CityID, 684 month pages, 0 failures
  (2021-2025, 2027-2030 for six cities; 2029-2031 for Muscat), merged with the banked 2026+2031 and
  the 2021-2028 Muscat years. Parse trap respected: dhuhr prints 24h (51 October cells arrive as
  23:59 and are corrected), asr/maghrib/isha print 12h.
- 18/18 nearest +5: six second cities fajr exact 95.7-98.4%, every column 100% within 1; Muscat
  fajr exact 57.2%.
- 17.8/18.15 ceil -1: six second cities fajr exact 56-66%, within-1 100% (asr 98.8-99.6%, max 2);
  Muscat fajr exact 94.1%, every column 100% within 1.
- Cross-tab, same rounding both sides: at the six cities 18/18 + round scores 95.7-98.4% exact fajr
  while 17.8/18.15 + round collapses to 6.4-14.9%; at Muscat 17.8/18.15 + ceil scores 94.1% while
  18/18 + ceil collapses to 7.2%. The angle and the rounding trade off one for one.
- Ridge (angles scoring 100% within 1 over the whole span): six cities fajr 17.85-18.15 round,
  17.75-18.05 ceil; isha 17.95-18.10 round, 18.10-18.20 ceil. Muscat fajr 17.75-18.10 round,
  isha 18.05-18.15 round. Both candidate pairs sit inside these bands.
- Reference-point test: at Muscat 18/18 nearest scores 47.9% exact fajr at 23.588/58.3829 and 93.7%
  at 23.55/58.30 — 0.08 deg of coordinate uncertainty moves it further than the 0.2 deg of angle in
  dispute.
- The one residual worth an owner read: isha 18.15 vs 18.0 (0.15 deg) is at the print-resolution
  edge at Muscat (18.0 gives 59.6% exact, 18.15 gives 64.4% under ceil) and outside the six cities'
  nearest-round band (17.95-18.10).

---

## 3. AUSTRIA — IGGÖ vs IZW: DRIFT on fajr only

**VERDICT:** The IGGÖ scheme and the IZW table are the same computation on dhuhr and asr (245/245
exact) and on isha (245/245 within 1), and differ only on fajr: the IGGÖ holds 18.0 deg where IZW
sweeps 15.0-15.5, mean 12.8 min earlier (IGGÖ), worst 29 min, 18-25 min through autumn and winter.

**Fit-index row text:**
`AT-IGGOe | derislam.at published table, Vienna | 18/16 + temkin (sunrise -7, dhuhr +5, asr +4, maghrib +7, fajr/isha 0) + Istanbul 2021 takdir above 44.5N, June-21 anchored V | 245 published Vienna days 2026-05-01..12-31 | vs AT-IZW 2025: dhuhr 245/245 exact, asr 245/245 exact, isha 245/245 within 1 (219 exact), fajr DRIFT mean 12.8 min earlier, worst 29 | sunrise -7.03 and maghrib +4.6 are fixed temkin conventions, not drift | clause engages ~1 May to 9 Aug at Vienna (implied 12.4 deg at the solstice)`

**Evidence.**
- The published recipe was read in full from `derislam.at/service/einheitliche-gebetszeiten/`
  (method page: fajr 18, isha 16, dhuhr +5, asr +4, maghrib +7, sunrise 7 min before astronomical
  rise, fajr/isha temkin 0; takdir above 44.5N with one-third of night, 20-minute transitions,
  June-21 reference).
- The IGGÖ's own published Vienna table was captured for May-December 2026 (245 days, 9 location
  pages plus the month sweep). Its implied depression is 18.0/16.0 from 10 August onward and falls
  to 12.4/11.4 at the solstice: the high-latitude clause is real and measurable, and no 18/16 pair
  reproduces their June without it (18 deg fajr at Vienna on 21 June is 01:28; their table prints
  03:09).
- Table-vs-table against the banked IZW 2025 XLSX at Vienna, month-day matched: fajr mean -12.8
  (MAE 14.4, max 29, 18/245 within 1), sunrise -7.03 constant, dhuhr 245/245 exact, asr 245/245
  exact, maghrib +4.6 constant, isha mean -0.07 (219/245 exact, 245/245 within 1).
- Monthly fajr difference: May -4.0, Jun +2.3, Jul -0.5, Aug -24.9, Sep -20.3, Oct -18.4,
  Nov -18.2, Dec -18.6. IZW's implied fajr runs 15.46/15.01/15.21/14.91/14.35/12.61/14.00/14.83/
  15.01/15.04/15.09/15.07 by month; the two coincide only at the solstice trough.
- IZW defect recorded: its DST shift lands one day early on both 2025 edges (03-29 and 10-25 asr
  off by 58-59 min).

---

## 4. SWITZERLAND — UNDECIDABLE (login-gated)

**VERDICT:** UNDECIDABLE. The only IZRS prayer surface is a members' calculator behind a free Bronze
login, which the rules forbid; the banked Wayback replay carries no table; the only dated Swiss
tables on record are another publisher's and cannot test the 12.5/13 pair.

**Fit-index row text:**
`CH-IZRS | izrs.ch | federation | published seasonal 12.5/13, isha 12 | NO dated rows: calendar behind Bronze login | UNDECIDABLE — gate, not absence | nearest testable surface is CH-FCIGENEVE (15 deg / maghrib+90), a different publisher and a different scheme`

**Evidence.**
- Live probe 2026-11-11: `izrs.ch/izr-gebetszeiten` returns a registration notice ("mindestens über
  die Bronze Mitgliedschaft verfügbar und angemeldet"), captured.
- Banked Wayback replay `iberia2/captures/ch-izrs-wayback-20260612.html` is a 10 KB shell with no
  table and no PDF link.
- `iberia2` holds Geneva's foundation tables (1446-1448, 15.0 deg fajr, isha maghrib+90), a
  different publisher: scoring them would test a scheme, not the IZRS one.

---

## 5. BRUNEI — 20/18 CONFIRMED against MORA 2026 (weak-provenance flag carried)

**VERDICT:** The community 20/18 statement reproduces MORA's own 2026 table: fajr 20 deg 95.1%
exact / 99.2% within 1, isha 18 deg 86.8% exact / 99.2% within 1. The statement is confirmed; its
provenance stays community.

**Fit-index row text:**
`BN-MORA | mora.gov.bn OData 'Waktu Sembahyang' | authority table, community method statement (BAS, citing Odeh 2024) | 20/18 Shafi, dhuhr transit +1, no other margins, imsak = fajr - 10 | 364 local days 2026 | fajr 346/364 exact, 361/364 within 1; isha 315/364 exact, 360/364 within 1; asr 85.7% exact, maghrib 88.4%, sunrise 97.2% | WEAK PROVENANCE: MORA publishes tables, never a method`

**Evidence.**
- MORA OData list captured whole for 2026 (`captures/bn-mora-2026-raw.json`, 367 rows, 364 unique
  local dates; 2026-01-01 falls outside the list's window). Convention: Zohor 24h, Asar/Maghrib/Isyak
  12h with no meridiem.
- Implied depression on a 23-day sample: fajr 19.80-20.24, isha 17.80-18.30 — the 20/18 pair
  throughout, no seasonal term.
- Five publisher typos recorded and excluded: 2026-01-22 isha `741`; 2026-03-24 dhuhr `112.28`;
  2026-04-08 asr `6.28`; 2026-04-23 sunrise `69.11`; 2026-08-05 maghrib `3.36`.
- Imsak is fajr minus 10 minutes (mean 9.95 min), a printed convention, not a second dawn.

---

## Open items handed to the owner

- Oman isha: 18.15 vs 18.0 (0.15 deg) at Muscat is at the print-resolution edge; a 2027+ capture with
  the publisher's own seconds would close it. Not adjudicated here.
- Tunisia: the exact switch date sits between 2025-12-15 and 2026-01-15; one month of December 2025
  rows per delegation would date it to the day.
