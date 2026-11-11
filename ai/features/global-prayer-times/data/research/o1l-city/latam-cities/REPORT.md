# O1l latam-cities (wave O1l-9): Latin America city-level round two

Agent `o1l-9`, 2026-11-11. Public pages only, no contact, no login. Languages used:
Portuguese and Spanish first, English fallback. Engine: adhan 4.4.6 (`adhan-build`),
`Rounding.None`, minute rendering, dates from literal capture strings, TZ per country,
never the real clock. Rows are `{date: [fajr,sunrise,dhuhr,asr,maghrib,isha]}`.

## 1. Brazil: beyond-25 enumeration CLOSED NEGATIVE; year-2 accrued and confirmed

The IIB month API's city list is **closed at exactly the held 25**. The
`/mesquitas` directory (the site's own mosque index) lists 20 countries and 95
cities; I probed the API for every one of them plus case/slug variants
(`data/probe_iib_results.txt`): every request answers HTTP 400
`{"error":"Unknown city: …"}` in both English and Portuguese country names. The
directory pages carry no prayer payload (`captures/br_iib_dir_*.html`,
`captures/uy_iib_montevideo_mosque.html` — mosque pages are address/contact
only). No 26th city exists to capture.

Year-2 accrual: the keyless API serves any month of any year, so I captured
2025-05 and 2025-08 for all 25 cities (50/50 requests, 31 rows each,
`captures/br_iib_*_2025-*.json`). The whole surface now spans **120 days per
city: 2025-05 + 2025-08 + 2026-02 + 2026-11 = 3,000 dated rows**.

Fit (MWL 18/17 Shafi, zero margins, per-city coordinates, tz stated by the
payload): **18,000 cells scored, 14,525 exact, 17,946 within-1 (99.7%), worst
2 min (Aracaju 2025-05-27)**; every city's worst across both years is 1-2 min
(`data/br_iib_allyears.json`). Per-year: 2025 5,975/6,120 within-1; 2026
11,971/11,880-class exact rates hold. Amplitude (Porto Alegre fajr): May
05:33-05:48 vs Nov 03:42-04:04 — 108-minute seasonal swing carried cleanly by
one frozen recipe. Verdict: **A-grade confirmation stands and strengthens**
(two distinct years on one recipe; parameters frozen, no shift).

## 2. Mexico: Guadalajara A-grade year fit; Monterrey NEW 15/15; four city negatives

- **Guadalajara (Isa Ibn Maryam, Zapopan) — history walk succeeded.** The
  C32 endpoint (`api.masjidbox.com/1.0/masjidbox/landing/athany/{slug}?get=at&days=7&begin=ISO`,
  `apikey` header, the global key from the held HAR) walks 7-day hops: **385
  dated rows 2025-10-31 → 2026-11-19** (`data/mx_guadalajara_masjidbox.json`).
  Fit MWL 18/17 Shafi zero margins at Guadalajara city centre: **2,248/2,310
  exact, ALL within 1, worst 1**, on two calendar years (62 days of 2025, 323
  days of 2026). Amplitude: Jan fajr 06:11-06:14 vs Jul 04:52-05:07 (Mexico
  has no DST, pure solar swing). Verdict: **A-grade** (community tier,
  masjidbox platform).
- **Monterrey (Centro Cultural Islámico del Norte) — NEW surface, mawaqit.**
  Full 12-month 2026 grid, coords 25.6806/-100.3135, tz America/Monterrey.
  Suite: today-row anchoring PASS (exact), byte-identity distinct, iqama
  offsets. Fit: NOT MWL — a **literal 15/15 profile** (fajr 15.0 MAE 0.01,
  isha 15.0 MAE 0.06; sun columns zero margins; asr Shafi MAE 1.2): 1,844/2,190
  exact, worst 2. **First Mexican divergence on record: 15/15 vs Guadalajara's
  MWL 18/17.** Verdict: provisional (platform tier), one published cycle.
- **CDMX, Puebla, Tijuana, Mérida — honest negatives.** Spanish searches
  (`mezquita <ciudad> horarios de oración`, `horario de oración <ciudad>`,
  plus CCM/Puebla-specific queries): only calculated aggregators
  (IslamicFinder, MuslimPro, matw, horarios-salat). Mosque-owned surfaces are
  Facebook/Instagram only; the Puebla IslamPuebla Ramadan post returns HTTP
  400 to the harness (login-walled), recorded and closed. `mezquita-la-paz`
  masjidbox slug is Guadalajara SPAIN (decoy caught).

## 3. Peru: suite RUN, PASSED, banked and fitted (upgrade to provisional)

The banked mawaqit payload (Mezquita de Magdalena del Mar, Lima) parses to a
full **365-row 2026 grid** + 365-row iqama calendar (offsets +20/+15/+10),
coords -12.0939/-77.0720, tz America/Lima. Suite:
1. Today-row anchoring PASS — page today block (times+shuruq) equals the
   grid row for the capture date exactly.
2. Solar gate PASS — sunrise/dhuhr MAE 0.011/0.003 at MWL; fajr/isha literal
   18/17 (MAE 0.005/0.011); **maghrib carries a deliberate +2..+4 safety**
   (mean +3); asr Shafi MAE 0.79 worst 2.
3. Byte-identity-vs-default PASS — three mawaqit grids (Lima, Guatemala,
   Honduras) hash distinct.
4. TZ verified by geometry (solar computation at America/Lima reproduces all
   year; no DST step in dhuhr-vs-noon).
5. Year resolution — 2026 wins uniquely: as-2025 fajr MAE 0.09 vs 0.005;
   maghrib alone would tie (margin-dominated) and was not used.
Fresh capture (2026-11-11) re-served a byte-identical calendar (365/365 real
cells) and re-anchored today exactly (`captures/pe_lima_mawaqit_fresh.html`).
Fit span: 365/365 days of 2026, one published cycle → **provisional
(platform tier), MWL 18/17 Shafi + maghrib +3**.

## 4. Colombia: Cartagena now a fitted A-year; Bogotá static board; Medellín negative

- **Cartagena (Mezquita de Muhammad, Getsemaní) — masjidbox history walk**,
  same endpoint: **385 dated rows 2025-10-31 → 2026-11-19**. The profile's
  timezone field lies: `America/New_York` (a NEW instance of the Chaguanas
  class). All rows render on New York DST rules; 240 needed a -60 min
  geometry-anchored correction, and the platform flips the VALUE a day before
  the offset LABEL on both transition days (2025-11-02, 2026-03-08,
  2026-11-01 — proven by re-fetching single windows,
  `captures/co_mb_fix_*.json`). After correction, MWL 18/17 Shafi zero
  margins at Cartagena: **2,310/2,310 within 1, worst 1** (`data/
  co_cartagena_masjidbox.json`). Verdict: **A-grade**, two years on one
  recipe.
- **Bogotá (Mezquita Estambul) — static congregation board** (community
  tier): Fajr 04:30, Dhuhr 11:50, Asr 15:15, Maghrib 18:00 flat, Isha 19:10,
  Jumua 12:30 — undated fixed blocks, Maghrib flat is board-fixed, no dated
  row (`captures/co_bogota_estambul_actividades.html`).
- **Medellín (Masjid Assalam) — negative**: Instagram/TikTok only, no timed
  page; searched Spanish.

## 5. First rows: Ecuador Quito BANKED; Bolivia Santa Cruz banked (candidate); Uruguay, Paraguay, Guayaquil negatives

- **Ecuador — Quito (Islamic Center Khalid ibn Al-Walid) — FIRST ROW,
  mawaqit.** 365-row 2026 grid, coords -0.1890/-78.4827, tz
  America/Guayaquil. Anchoring PASS exact; **MWL 18/17 Shafi zero margins**
  (fajr/sunrise/dhuhr/maghrib/isha MAE ≤0.036, asr 1.02 worst 2): 2,120/2,190
  within 1, worst 2. Verdict: provisional (platform tier).
- **Bolivia — Santa Cruz (Centro Islámico de Santa Cruz) — FIRST ROW,
  mawaqit.** 365-row 2026 grid, coords -17.7932/-63.1965, tz America/La_Paz.
  Grid carries the Baku seven-column trap (leading imsak duplicating fajr) —
  stripped before scoring. Anchoring PASS exact; fajr/isha reproduce MWL 18/17
  (MAE 0.25/0.48) but the SUN columns drift seasonally ±3-4 min (sunrise -8..-2,
  dhuhr +2..+6, maghrib +4..+8) and **no coordinate in South America
  reproduces them** (grid search -25..-10 lat, -70..-57 lon: best 3.6 min/day
  error) — an uploaded community calendar, not a platform computation.
  Verdict: **candidate** (dated, anchored, night-columns fitted only).
  La-Paz-city masjidbox slug checked: it is a Spain decoy.
- **Uruguay — negative.** Centro Islámico del Uruguay site live
  (`centroislamicouruguay.com.uy`) but carries no times (salat page is
  prose); Montevideo community on Facebook groups; searched Spanish.
  IIB directory's Montevideo mosque page has no payload.
- **Paraguay — negative.** Asunción mezquita (Sep 2023) is Instagram-only;
  searched Spanish; aggregators only.
- **Ecuador Guayaquil — negative**: Centro Islámico Guayaquil is
  Facebook/Instagram only.

## 6. Caribbean: Chaguanas defect STILL LIVE; Jamaica REAL surface found; Trinidad +2 surfaces

- **Chaguanas masjidbox defect recheck (2026-11-11): NOT FIXED.** The slug
  moved to `masjid-chaguanas-tt` and the tz field moved from the held -05:00
  to `America/New_York`, but the defect is the same: today's row prints
  fajr 03:47 / dhuhr 10:50 / maghrib 16:40 — a full hour early against
  San Fernando's same-day 04:46 / 11:50 / 17:43 (`captures/
  tt_mb_today_*.json`). Carried in the known-artifacts list, updated.
- **Trinidad NEW: Ilmul Islam Center, Enterprise/Chaguanas — mawaqit**,
  full 2026 grid, correct tz (America/Port_of_Spain), anchoring PASS exact.
  Another **literal 15/15** mosque: 1,956/2,190 exact, ALL within 1, worst 1
  (fajr MAE 0.01, isha MAE 0.02, sun columns zero margins): provisional.
  This gives the Chaguanas area a correct-tz authority-grade source beside
  the defective masjidbox profile.
- **Trinidad NEW: Darul Uloom (`darululoomtt.net`) — today-only daily
  plugin table**: fajr 04:47, sunrise 06:00, dhuhr 11:55, asr 15:07 athan /
  16:03 jamaat (Hanafi), maghrib 17:43, isha 18:53 (2026-11-11). Against
  adhan at Curepe: fajr/sunrise exact, dhuhr/maghrib/isha +3..+5 (publisher
  margins). Candidate (one dated row); the monthly table is an image (OCR
  class, not attempted).
- **Jamaica — Kingston-area REAL surface: Jamaica Islamic Centre, Spanish
  Town** (`jamaicaislamiccentre.com`, address Frasers Content, Spanish Town;
  NOT the two known decoys). Homepage prints a live athan+jamaat block;
  2026-11-11 salah row matches adhan MWL 18/17 at Spanish Town within 1 min
  on every column (fajr 04:56 vs 04:57, asr exact, maghrib 17:31 vs 17:32).
  The print pairs jamaat 5 min BEFORE salah on every prayer — transcription
  kept verbatim, anomaly flagged. One dated row → candidate. Jamaica's
  third "kingston/jamaica" lead checked and another decoy avoided.

## 7. What this settles for the record

- Brazil: single-city provenance flag fully retired; now 25 cities × two
  years × 120 days at 99.7% within-1. The beyond-25 question is closed:
  the API list is exhaustive and closed.
- Mexico: from FALLBACK-second-zero to **one A-grade surface (Guadalajara
  18/17) + one provisional 15/15 city (Monterrey)**. Mexican practice is NOT
  one national recipe.
- Peru: lead → fitted provisional with the full suite passed and a fresh
  byte-identical re-capture.
- Colombia: from one candidate capture to an A-grade Cartagena year + a
  Bogotá static board; a second confirmed instance of a masjidbox
  profile-tz lie (America/New_York on Cartagena).
- Trinidad: 15/15 divergence (Ilmul Islam) matching Monterrey's practice —
  a masjidbox/mawaqit 15/15 community appears in BOTH Mexico and Trinidad.
- Ecuador and Bolivia hold their first rows; Uruguay, Paraguay, Guayaquil,
  Medellín, CDMX, Puebla, Tijuana, Mérida are honest negatives with the
  languages searched recorded.
- Jamaica holds its first real mosque surface (Spanish Town).
