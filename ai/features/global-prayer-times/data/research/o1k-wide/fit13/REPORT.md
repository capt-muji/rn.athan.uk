# Fit13 — Oceania recipe fits (Australia Diyanet, NZ FIANZ, New Caledonia, Adelaide ISSA)

Fitted 2026-11-10 from the oceania2 census data, adhan 4.4.6 astronomy, second-resolution
instants with explicit rounding at the end, no real clock, workspace `fit13/`. Method: residual
medians per prayer against raw astronomy at the stated coordinates, then exact/within-1 scoring of
the assembled recipe. Files: `au-diyanet.json`, `nz-fianz.json`, `nc.json`, `adelaide.json`;
scripts `lib.js`, `job1-au.js`, `job1b-gallipoli.js`, `job2-nz.js`, `job3-nc.js`,
`job4-adelaide.js`, and the compose scripts.

## Job 1 — Australia's Diyanet diaspora: DOMESTIC

Broadmeadows (11331), Preston (11281), Brisbane (11428): 365 rows each, 2026-01-01..2026-12-31;
Auburn Gallipoli own API 91 rows (2026-11..12 + 2027-06). **Verdict: the diaspora serves the
DOMESTIC recipe** (18/17 + temkin), not the European unified 18/16.

- Residual medians vs raw: fajr +0.00/+0.13, sunrise **-6.98/-6.93**, dhuhr **+5.07/+5.03**,
  asr **+4.02/+4.00** (shadow 1), maghrib **+7.00/+7.10**, isha +0.02/+0.05 (Broadmeadows /
  Brisbane). The "-7/+5/+4/+7" temkin set lands on sunrise/dhuhr/asr/maghrib; fajr and isha carry
  the raw angles. This matches the adhan "Turkey" method encoding exactly.
- Exact scores: every prayer within 1 minute on 365/365 days at all three locations (exact
  189-353/365; nearest-minute rounding wins; floor and ceil degrade sharply). European 18/16:
  exact **0** on sunrise/dhuhr/asr/maghrib/isha, worst 5-8 min — rejected.
- All four surfaces agree. Gallipoli: imsak = 18° raw (within-1 91/91), isha = 17° raw
  (within-1 91/91), sunrise -7, dhuhr +5, asr s1 +4, maghrib +7. Friday dhuhr rows are khutbah
  overrides (worst 55 min). Iqamah offsets constant (+52 fajr, +6/+6/+2/+6). Parameters frozen
  across its two years (2026 and 2027 windows score identically: within-1 61/61 and 30/30).
- Seasonal amplitude: Melbourne fajr Jan 04:09-04:51 vs Jul 05:51-06:02 (~86 min swing);
  Brisbane Jan 03:24-03:54 vs Jul 05:09-05:16.
- Limits: the Diyanet platform tables are 2026 calendar years only — between-year stability is
  not testable there; Gallipoli carries the only two-year span.

## Job 2 — NZ FIANZ stated offsets: one pair per city, not shared

90 rows (3 cities × 30, Ramadan 1447H, 2026-02-19..03-20), Pacific/Auckland. The printed offsets
hold verbatim: suhoorEnds = fajr - 5 **exactly, sd 0 across all 90 rows**; maghrib = sunset + 5
(to minute rounding at Auckland/Christchurch); asr single-shadow (shadow-2 residual ~-55 min).

- **Auckland: 18/18.** fajr implied 18.08° (sd 0.06), isha 17.96° (sd 0.05). Recipe exact 28/30
  fajr, 19/30 isha, within-1 30/30 everywhere; sunrise exact 30/30.
- **Wellington: 16/15.** fajr implied 16.14° (sd 0.06), isha 15.08° (sd 0.05). within-1 30/30 on
  fajr/asr/maghrib; isha within-1 26/30 (worst 2).
- **Christchurch: 16/15.** fajr implied 16.07° (sd 0.05), isha 14.99° (sd 0.05). fajr exact
  30/30.
- The sheets are per-city calculated and the three cities do **not** share one pair: the North
  Island city runs standard 18/18, the two southern sheets run 16/15. Wellington's solar columns
  sit early vs the census coordinates (sunrise -4.3 min, dhuhr -1.5), so its sheet was likely
  computed for a slightly different grid point; the angle clusters barely move (~0.02°).
- Limits: Ramadan window only — the pair is fitted inside late-summer NZ and the sheets say
  nothing about the rest of the year. Ramadan 1 = Feb 19 on the sheets vs the Hilal Committee's
  Feb 20 (two-editions pattern, recorded at capture).

## Job 3 — New Caledonia's year: hand-maintained board over a 18°/sunset+85 base

365 rows (2026), Pacific/Noumea, Centre Islamique de Nouméa on Mawaqit.

- Grid: dhuhr/asr/isha land on exact 5-minute marks 365/365; fajr/sunrise/maghrib on the
  1-minute grid.
- Base angles: **fajr = 18°** raw nearest (implied 18.10° sd 0.065; exact 188/365, within-1
  365/365). No isha angle exists as a single value (see below); in the graded season the isha
  implied angle reads **17.67° (sd 0.36)** — i.e. sunset + 85 min on the 5-grid.
- Rounding-to-5 shape: it is not daily computation — the 5-grid columns are **hand blocks**:
  dhuhr 19 runs (2-6 weeks each) tracking transit + 30 min (block envelope transit+24..+36;
  round5(transit+30) exact 252/365); asr 13 runs around shadow-1 + 2 min (envelope -8..+16;
  shadow-2 is 55 min off); sunrise raw nearest; maghrib floor(sunset)+5 (exact 313/365).
- Isha: **19:45 holds 2026-04-01..2026-11-29 = 243 days** (the winter floor: computed
  sunset+85 falls to ~18:55-19:20, far below). The 122 free days: Nov 30-Dec 31 graded 19:50 ->
  20:05 in 7-day blocks tracking sunset+85 (the only computed-looking part); Jan blocks
  20:15/20:05/20:00/19:55 (implied ~17.6°); then **Feb 18-Mar 18 = 20:15, exactly Ramadan
  1447H — a taraweeh override** sitting 20-35 min later than any twilight angle (implied 26.6°);
  Mar 19-31 20:00; floor resumes Apr 1.
- Amplitude: fajr Jan 03:47-04:12 vs Jul 05:10-05:15 (~73 min swing). Single year held;
  between-year stability untestable.

## Job 4 — Adelaide ISSA: bare 18/17 calculator, no temkin

61 rows (Nov+Dec 2026), Australia/Adelaide. **Recipe: 18/17, Shafi asr, zero temkin** — fajr
implied 17.98° (sd 0.057), isha 17.13° (sd 0.073); sunrise floored to the minute (exact 56/61);
dhuhr transit raw nearest (13:00 -> 13:19 across the window, NOT a constant column); asr
shadow-1 raw (shadow-2 is 73 min off); maghrib sunset raw nearest. Every prayer within 1 minute
on 61/61 rows. The 9 low-confidence dark-banded Nov rows still fit within 1 minute. This is a
different kind of surface from Diyanet's Australian tables: ISSA prints a raw calculator, Diyanet
serves the temkin'd domestic recipe. Limits: two months only; Apr-Oct 2026 PDFs banked raw for a
full-year follow-up; window spans only the summer side of the cycle (fajr 04:41 -> 04:19, trough
~04:09).

## Cross-job notes

- The Diyanet diaspora verdict is uniform across three Australian grid points and a mosque
  running its own API: domestic recipe everywhere tested, parameters frozen across the spans
  held. Confidence: 1,421 rows scored, zero rows outside ±1 minute under the fitted recipes.
- FIANZ is the odd surface: same federation, three cities, two different angle pairs.
- Noumea is the first mosque board in the census where the hand-block structure is fully
  resolved (19/13/11 runs) plus a dated Ramadan override — worth citing when classifying
  Mawaqit iqamaCalendars as engine output vs board entries.
