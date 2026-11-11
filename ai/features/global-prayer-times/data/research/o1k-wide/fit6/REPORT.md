# Fit6 — Geneva span, Southern African Jamiat reach, US mosque years, Baltic firsts

Workspace: `o1k-wide/fit6/`. Discipline held: adhan 4.4.6, second resolution then explicit
per-prayer rounding, no clock reads (`TZ=UTC node` + Intl zone reading), nothing under /tmp,
incremental writes, no subagents, no network. Outputs: `job1-geneva.json`, `job2-jamiat.json`,
`job3-us.json`, `job4-baltics.json`, plus diagnostics (`job3-run.log`, `job3-wiggle.json`,
`job4-minsk-diag.mjs`, `job4-minsk-diag2.mjs`).

## Job 1 — the Geneva archive (Fondation Culturelle Islamique de Genève)

Span: hijri 1446+1447+1448 as one span, **2024-07-07 .. 2027-06-05, 1,064-day window, 1,022
dated rows** (1446: 323, 1447: 350, 1448: 349). Per the fit-phase amendment the full held span
is fitted, not just the two complete years.

**The stated reading verifies exactly, and the free fit does not move off it:**

| element | fitted |
| --- | --- |
| fajr | 15.0°, margin 0 (plateau 15..15 only, across the whole 1,022-row span) |
| sunrise / dhuhr / asr / maghrib | margins 0, solar raw, asr Shafi (Hanafi scores 0) |
| isha | maghrib + 90 minutes, exact — printed isha−maghrib = 90 on 1,022/1,022 rows |
| rounding | nearest (or floor; ceil breaks the isha law at interval 89) |

**Per-year scores under the one recipe (6,132 cells):**

| year | exact | within1 | worst |
| --- | --- | --- | --- |
| hijri1447 (350 rows) | 1,954/2,100 (93.0%) | **2,100/2,100 (100%)** | 1 |
| hijri1448 (349 rows) | 1,924/2,094 (91.9%) | **2,094/2,094 (100%)** | 1 |
| hijri1446 (323 rows) | 1,642/1,938 (84.7%) | 1,772/1,938 | 55 |
| span excluding the Feb-1446 defect | 5,520/5,964 (92.6%) | **5,964/5,964 (100%)** | 1 |

**Frozen verdict: FROZEN.** One parameter set (15/0, maghrib+90, Shafi, nearest) fits all three
years; the per-year independent fajr fits all land at 15.0 with plateau 15..15; the two complete
years sit at within-1 100% / worst 1. The frozen-generation precedent applies in its parameter
sense — the years are not byte-identical files, but the generation rule is byte-stable: isha−
maghrib = 90 exactly on every row of every year, and the per-year angle fits are identical. The
remaining ~7% non-exact cells are the publisher's internal solar model sitting sub-minute from
adhan's (worst 1 everywhere clean).

**New defect found: February 2025 (one 1446 poster) is faulty as printed.** All 28 rows drift —
fajr +48 min and sunrise +49 min mean bias, asr −28, maghrib/isha −40 — with no date shift
repairing it (best shift −14 d repairs 4/168 cells). Morning columns run early, evening columns
late: the poster is internally inconsistent. Scoped to 28 of 1,022 rows; the earlier census note
("March 2025 missing") stands alongside it.

**Seasonal amplitude (Jan vs Jul fajr, printed = computed):** Jan 6:34..6:48, Jul 3:46..4:32 —
a ~2 h 45 min swing, reproduced to the minute by fajr 15° in every held January and July
(2025, 2026, 2027). The 46.2°N high-latitude question resolves by observation: 15° twilight
exists all year at Geneva and no clamp ever fires.

## Job 2 — the Southern African December towns (Jamiat KZN generator reach)

11 towns × 31 December-2026 rows × 13 printed columns (403 cells per town): Maputo, Windhoek,
Luanda, Maseru, Mbabane, Harare, Bulawayo, Blantyre, Lilongwe, Mzuzu, Zomba. Fitted at each
town's printed coordinates (Harare/Bulawayo files carry none — census city coords used), at the
tables' fixed UTC offsets (Luanda prints at UTC+1, the rest UTC+2).

**Verdict: the Jamiat rule reproduces EVERY town.** The census engine — fajr 18° bare, sunrise
raw, isha Shafi separate 15°, zuhr transit+5, maghrib astro+3, suhoor fajr−5, ishraaq +15,
zawaal −5, both asr schools bare, isha_hanafi evening 18°, split rounding (morning/noon
nearest, afternoon/evening floor) — holds every column of every town at worst 1 min, except
the two divergences below. The worst-1 stragglers are the generator's internal model vs adhan
(biases ≤ 0.4 min); the census's own solar.py ruler gives the same picture (3,500/4,433 exact
cross-check). The generator's reach is now confirmed from 8.8°S (Luanda) to 29.3°S (Maseru).

**Divergence 1 — dhuha is not sunrise+195.** The census constant misses by 4..17 min per town.
The dhuha column is **astro_sunrise + (astro_sunset+3 − astro_sunrise)/4** (quarter of the
daylight span from sunrise to maghrib), nearest-rounded: 22-29/31 exact per town, worst 1.
On Blantyre the +3 marker is absent — its whole evening family runs +3.

**Divergence 2 — Blantyre's town-scoped +3 evening shift recurs in December:** sunset column
prints astro−0 (engine −3) and maghrib prints astro+6 (engine +3), exact 0/31 on both —
identical to the finding the November wave recorded.

The dhuha offsets from sunrise alone (190 Luanda .. 211 Maseru) are latitude-dependent, which
is what identifies the quarter-day formula; a fixed +195 or +205 fits nothing.

## Job 3 — the US mosque years

19 year-fits, 7,145 cells scored: Dar al-Hijrah 2026 (dpt feed), the six Masjidal mosques at
3 years each (Antioch TN: 2026 only — the captures hold one year for that id), Toledo ICGT 2025
with its DST block excluded and sized, San Antonio MCSA 2026 with 4 transition-day defects
excluded and sized.

**15/15 confirmation rate: 6 of 19 year-fits sit exactly on 15/15** (the exact-max plateau
contains 15.0 on both columns: South Bay ×2 of 3 years, Queens ×3, Antioch); **18 of 19
year-fits sit in the 15 family** (best angles within 0.4° of 15, exact@15 ≥ 85% of best).
The one flag is **San Antonio**: its fajr column steps ~2 min at mid-year (monthly mean bias
−0.9 → +1.4, wiggle 2.47 min vs ≤ 0.39 for the Masjidal platform mosques) and its best fajr
angle is 14.6° — NOT reproducible as a single-angle 15/15. Per-mosque:

| mosque (years) | fajr / isha best | asr | rounding | print margins at 15/15 |
| --- | --- | --- | --- | --- |
| Dar al-Hijrah (2026) | 15.2 / 14.7 | Shafi | ceil | 0 / 0 — noisy feed, exact ~40-66% |
| Memphis IC (24/25/26) | 14.8-15.2 / 14.8-15.1 | Shafi | floor/ceil | +0.5..+1.5 |
| Richmond ICCC TX (24/25/26) | 15.2-15.3 / 15.3-15.4 | **Hanafi** | floor/nearest | −1..+0.5 |
| South Bay CA (24/25/26) | 15.0 / 14.9-15.1 | Shafi | ceil | −0.5 / +0.5 |
| MAS Tarbiyah MI (24/25/26) | 14.9 / 14.9-15.1 | Shafi | floor | +0.5 |
| Jamaica MC NY (24/25/26) | 15.0 / 15.0 | **Hanafi** | nearest | +1 / +1 |
| Antioch TN (2026) | 15.0 / 14.9 | Shafi | ceil | −0.5 / −0.5 |
| Toledo ICGT (2025 clean) | 14.9 / 14.9 | Shafi | floor | 0 / +0.5 |
| San Antonio (2026 clean) | **14.6** / 15.4 | Shafi | floor | +1 / +0.5 |

Queens and Richmond settle the asr school by exact count, not assumption: both asr columns fit
Hanafi (shadow 2.0) at margin 0 — Queens asr exact 203/365 at worst 1 in the standalone scan,
Richmond joint within-1 2,190/2,190 under Hanafi. The other seven mosques are Shafi.

**Toledo's DST defect, sized and refined:** the shifted window 2025-03-09..2025-11-01 is 238 of
365 rows (65%). Five columns print on standard time through it (mean bias −60); sunrise prints
wall time (185/238 exact at 0) except 2025-11-01, where sunrise too is on standard time. fajr
alone flips back to wall time for the whole of May 2025 plus 2025-07-01, 10-03 and 10-04 (34
unshifted days inside the block). Repairs: maghrib +60 → 130/238 exact, dhuhr → 183/238.
The 127 clean rows (Jan 1-Mar 8, Nov 2-Dec 31) fit 14.9/14.9, worst 2 — 15/15 family, nothing
outside the block is shifted.

**San Antonio's second defect:** the asr cell on the two DST-transition weekends carries the
wrong-side value (16:07 on Mar 8-9, 16:24 on Nov 1-2 — ±61 min) — 4 of 365 rows, excluded from
the score and recorded. No wholesale DST block exists in that feed (maghrib tracks sunset all
year).

## Job 4 — the Baltic firsts

**Latvia LIKC — stated pairs verify.** On 2026-11-10, 3 cities × 2 renders. The between-render
deltas confirm the labels: printed(15/15)−printed(12/12) equals computed ISNA−UOIF on fajr in
all 3 cities (−22/−23 min) and on isha to the minute (Riga +23 exact; Daugavpils/Ventspils +22
vs +21/+23 — 1-min rounding boundary). The fixed column offsets in both renders (+3 sunrise,
−3 maghrib, −3 asr, −1/−2 dhuhr) are the IslamicFinder widget's own conventions, identical
across pairs. November is winter per the centre's scheme, so the operative rule now is 15/15;
the 12/12 summer render exists as its stated alternative.

**Lithuania muftiate (Vilnius, 7-row rolling week) — the 18/16 reading verifies and sharpens.**
fajr = 18.0° margin 0 (exact on the held days, plateau 17.9..18.1); isha = 16° (16.2 ± 0.5,
plateau 16..16.2). The Turkish-label surface carries column conventions: sunrise −7, dhuhr
transit+5, asr Shafi +6, maghrib sunset +8 — a Diyanet-shaped recipe, as the capture wave
suspected. 5/7 fajr cells exact at margin 0; the solar columns need their conventions to
compare at all.

**Belarus islambel.by Minsk 2025 (365 rows) — the caps characterised.**
The nordics2 reading ("fajr capped 07:16, isha 23:06") corrects to:

- **fajr = 18° and the 07:16 "cap" is natural.** The computed 18° fajr reads 07:16 on exactly
  the printed-plateau dates (Jan 1-6, Dec 28-31) and 07:15 on Jan 7 where the print says 7:15 —
  the plateau is the true 18° curve flattening at the solstice, worst 1, MAE 0.16 over the
  robust season (178/212 exact).
- **isha ≈ 16°** (per-month bias −1.8..+2.4 around 16° nearest).
- **The real caps are FIXED CLOCK CAPS on the summer side:** fajr pins at exactly 03:08 for 14
  days (2025-06-08..21) and isha at exactly 23:06 for 13 days (2025-06-21..07-03) while the
  night moves day by day — night-fraction families (night/2, /7, /8, q·night sweeps, angle/60)
  all fail cross-season, so the pins are clock caps on the publisher's smooth internal curve
  (through May 20..Jul 25 neither 15° nor 18° twilight exists at 53.9°N; the fajr interval
  bottoms at sunrise−83).
- Column conventions: sunrise −7, dhuhr transit+5 (300/339 exact), maghrib sunset +~7
  (drift +6.0→+8.5; depression scan prefers 1.63°), asr Shafi-family with a seasonal +2..+6
  drift (best single shadow factor 1.04, 106/365), rounding nearest. Publisher model noise
  runs up to ~±2 min from adhan seasonally. Not night fraction, not the Moonsighting seasonal
  curves (tested: MAE 23-24 min).

## Assumptions

- Geneva coords 46.2044, 6.1432 and Minsk 53.9006, 27.5590 as given in the brief; Lithuania
  fitted at Vilnius 54.6872, 25.2797; LIKC cities at canonical Riga/Daugavpils/Ventspils coords
  (the widgets key to those cities).
- US mosque coords reuse the capture wave's values where recorded (`fit_all.zsh`); Dar
  al-Hijrah 38.8823/−77.1711, ICGT 41.6770/−83.6990, MCSA 29.4430/−98.4860, IC TN
  36.0660/−86.6630 are standard mosque locations (none printed in the feeds).
- Toledo's shifted window taken as 2025-03-09..2025-11-01 inclusive; verified against the data
  (no shifted rows outside it).
- "3 years each" for the Masjidal six holds for five mosques; `rdRvm3dG` (Antioch) exists only
  as 2026 in the captures.
