# fit9 - Benelux and Iberia fits (jobs 1-5)

Run 2026-11-10 against the `benelux2/` and `iberia2/` captures. Engine: the capturer's
NOAA solar module (`solar.py`), floats at sub-second resolution, rounded once with
round-half-up to the printed minute. Engine cross-check against adhan 4.4.6
(`adhan_check.js`/`.py`, Amsterdam 4 dates): transit agrees under 1 s, horizon events
under 30 s, deep twilight angles within 76 s - two-engine spread, far below every
tolerance claimed below. Scores: exact/within-1/worst on integer minute differences
printed minus rounded(computed); RMS/bias on floats. All years held in each job; one
recipe per job across the whole span, per-year breakdown underneath.

Files: `job1_nl.json`, `job2_be.json`, `job3_pt.json`, `job4_es.json`, `job5_roma.json`,
scripts `job1_nl.py` .. `job5_roma.py`, `kit.py`, `adhan_check.*`.

## Job 1 - Netherlands, the stated consensus verified at three cities

Recipe exactly as VIN stated it: fajr = 18 deg rising floored at 03:30 local; isha =
17 deg setting capped at 23:30 local (cap/floor applied before the midnight wrap;
days where the 17/18-degree time does not exist take the cap by construction).
Span 730 days per city (2025+2026, one recipe), Europe/Amsterdam.

| city (coords) | fajr exact/w1/worst | isha exact/w1/worst | fajr RMS | isha RMS |
|---|---|---|---|---|
| Amsterdam 52.3702,4.8952 | 419/700/2 | 435/713/2 | 0.73-0.75 | 0.67-0.70 |
| Rotterdam 51.9244,4.4777 | 417/702/2 | 451/721/2 | 0.73-0.75 | 0.64-0.65 |
| Utrecht 52.0907,5.1214 | 412/690/2 | 431/718/2 | 0.77-0.78 | 0.67-0.68 |

Per-year exact never leaves 204-212/365 (fajr) and 214-230/365 (isha); worst 2 both
years. Free-angle fits on non-cap days confirm the stated angles: 17.98-18.00 fajr,
16.96-16.98 isha (RMS 0.71-0.84). Cap binds, printed counts (identical to computed
breach counts to within 1 day): fajr floor 190-197 days/year (from 2-4 May to 6-8 Aug),
isha cap 204-208 days/year (from 1-3 May to 11-13 Aug). Rounding: the publisher is
nearest-minute on dhuhr (694-711/730 exact) and isha; fajr is near-tied; sunrise and
maghrib carry publisher margins, not conventions.

Between-year stability: **parameters frozen** - same angles, same caps, per-year RMS
within 0.03 of each other, no systematic year shift (fajr bias +0.04/+0.05, isha
+0.18/+0.32). Seasonal amplitude at Amsterdam: the 18-degree fajr runs 06:40 (Jan 15)
to about 02:00 at the solstice, a 301-minute year span; the raw 17-degree isha reaches
past midnight around the solstice (perpetual twilight within 0.1 min of 24:00), which
is why the cap binds about 145 days a year. Span: 730 days/city, 2,190 scored rows.

## Job 2 - Belgium, the window rule encoded and scored at Brussels

Encoded rule (day-of-year constants): outside the window, real-latitude 18 deg at
Brussels (50.8503, 4.3517). Isha window 05-01..08-11: 05-01..05-21 flat 23:26,
07-26..08-11 flat 23:33, middle 65 days (05-22..07-25) = latitude-45 18-degree isha
at Brussels longitude (crosses midnight to 00:07 at the solstice). Fajr window
05-10..08-01: plateaus 03:24 on 05-10..05-30 and 07-10..08-01; middle 40 days =
latitude-45 arc at best-fit 19.1 deg (44.75N; at exactly 45N, 18.88 deg) floored at
the 03:24 plateau - RMS 1.01, bias -1.5 to -1.7, the same lat-45 family as the isha
middle. **The middle fajr arc is no longer "free": it is a latitude-45 curve at about
19 degrees, clamped to the plateau clock at its edges.**

Scores under the one recipe: 2025 fajr exact 90/365, w1 240, worst 5; isha exact
295/365, w1 341, worst 6. 2026: fajr 129/365, w1 292, worst 4; isha 228/365, w1 340,
worst 6. Window interior: plateaus exact by construction (44/44, 38/38 every year);
middle-65 isha exact 17-21/65 (worst 6, engine-level agreement with the capturer's
RMS 1.8); middle-40 fajr exact 4-5/40, worst 4-5 at RMS 1.0.

**Frozen-generation verdict: yes.** The 2025 table carries the identical window:
month-day identical on 363/365 days in all six columns, differing only on the two
baked DST days (03-29, 10-25 - each edition bakes its own transition date). The
substituted window values are clock constants in both years. The residual miss mass
sits in the outside-window solar columns and moves with the year: scoring the frozen
table against true per-date computation gives a seasonal V-shaped fajr drift
(+2.8 min May 2025 -> +2.0 May 2026, -2.2 Aug 2025 -> -1.5 Aug 2026) and a sub-minute
to -1-minute isha drift - one frozen generation whose solar columns sit between the
2025 and 2026 true curves. A build must either recompute per date (accepting the
drift against the print) or bake the frozen table (carrying both years exactly).
Amplitude: real-18 fajr spans 290 min across the year at Brussels; the raw isha
crosses midnight at the solstice. Span: 365 days x 2 editions, one day-of-year table.

## Job 3 - Portugal, lisboa across 2023, 2026 and 2027 as one span

Stated rule scored at 38.7223, -9.1393 (Europe/Lisbon), 1,095 days, one recipe:
fajr 18 deg, sunrise raw horizon, dhuhr noon+5, asr Shafi, maghrib sunset+3,
isha = 12 deg + 3 (2026/2027 label column), interval = printed maghrib + 77
(2023 has only the interval column; through model sunset the interval is sunset+80).

Absolute-frame scores per edition - solar columns exact 156-200/365, within-1 344-365,
worst 1-2 (sunrise, dhuhr, asr, maghrib, interval all within-1 complete or complete
minus a handful of days); the isha 12+3 column exact 172-188/365, worst 2. The frame
carries one uniform +0.49 min offset on every solar column (dhuhr mean +5.49 against
the +5 rule, maghrib +3.49 against +3, fajr +0.50, isha +0.49): the publisher's
effective noon sits half a minute off the given coordinates (coordinate rounding or
refraction constants), not a rule difference.

**Zawal-anchored margins (engine-free), per edition:**

| column | 2023 | 2026 | 2027 |
|---|---|---|---|
| zawal - solar noon | 0.00 (sd 0.00) | 0.00 | 0.00 |
| dhuhr - zawal | +5.00 (sd 0.00) | +5.00 | +5.00 |
| sunrise - horizon | -1.02 | -1.05 | -1.03 |
| maghrib - sunset | +3.00 (sd 0.50) | +3.04 | +3.01 |
| asr Shafi | +0.03 | -0.06 | +0.02 |
| fajr vs 18 deg | +0.01 | -0.03 | +0.05 |
| isha vs 12+3 | - | -0.03 | -0.01 |
| second isha - maghrib | +77 (sd 0.00) | +77 | +77 |

**2023->2027 stability verdict:** the engine-free integers are exact zeros (zawal,
dhuhr, interval); sunrise and maghrib move 0.03-0.04 min; fajr and asr medians move
0.08-0.09 min on distributions whose sd is 0.5-0.7 min. The capturer's "identical to
0.05 min" holds on sunrise/maghrib and is exact on noon and the interval; on fajr/asr
a 0.05 claim is below the noise floor and unprovable either way. No evidence of any
parameter shift across the span. Asr school: Shafi (Hanafi reads -54 min). Fitted
latitude 38.70-38.72 every edition (real city 38.7223). Amplitude: fajr 138 min
(06:19 Jan -> 04:13 Jul), 12-degree isha 240 min. Span: 1,095 days, three editions.

## Job 4 - Spain, Madrid's CCIM recipe against Granada and Malaga

Madrid recipe applied whole: fajr 18.25+1, sunrise -2 (Granada's column is Shuruq),
dhuhr noon+1, asr Shafi+1, maghrib sunset+2, isha 17+1.

Granada (37.1773, -3.5986), full span 502 days (hijri 1447 complete 2025-06-27..
2026-06-16 + 1448 to 2026-11-10, continuous, Europe/Madrid). Under Madrid's recipe:
fajr exact 297/502 worst 2; isha 173/502 worst 2; dhuhr 34/502; asr 80/502; maghrib
201/502; shuruq 0/502 (worst 8). The columns fail exactly where the margins differ:
Granada's own free margins are **fajr 18.0 -0.0 (RMS 0.6), isha 17.0 -0.0, dhuhr
+0.0, asr Shafi +0.0, maghrib +1.63/+2.13, shuruq = sunrise +5** - zero margins
everywhere against Madrid's +1s, and a shuruq convention Madrid does not have.
Per hijri year: 1447 fajr bias -0.01, 1448 fajr bias -0.48 - fajr/isha margins drift
half a minute into 1448, everything else frozen; worst 2 throughout.

Malaga (36.7213, -4.4213), 30-row poster, November 2026. Free margins: fajr +0.88,
sunrise -0.68, dhuhr +1.55, asr Shafi +0.22, maghrib +1.38, isha +0.21 - near Madrid's
+1s on dhuhr/asr/maghrib but fajr is 18 deg +0.9 (not 18.25) and sunrise -0.7 (not -2).

**Verdict: no one national recipe.** Madrid is its own line (18.25/17 with +1s);
Granada is MWL-clean 18/17 with zero margins and sunrise+5 shuruq; Malaga sits on a
third micro-line close to but not equal to Madrid's. Granada's two hijri years
reproduce to half a minute on every column (parameters frozen). Amplitude at Granada:
fajr spans 124 min across the held year, isha 240 min. Span: 502 + 30 rows.

## Job 5 - Rome, the Grand Mosque poster verified and fitted

30 rows (2026-11-11..2026-12-10) at 41.9028, 12.4964 (Europe/Rome), all CET.

Held readings **confirmed**: isha - maghrib = 90 on all 30 days (single value in the
column); fajr fits **19.1 deg exactly** with bias pinned at zero (RMS 0.30; a free-bias
fit is degenerate on one month, noted in the JSON).

Stated-rule scores: dhuhr 30/30 exact (noon+1, worst 0); fajr 27/30, sunrise 21/30,
asr 21/30, maghrib 27/30, isha 27/30 - all worst 1. Margins vs the plain model:
sunrise -0.75, dhuhr +0.97, asr +0.33, maghrib +0.90. **Asr school: Shafi** (Hanafi
reads -37.8 min, RMS 1.01). One month, no second year; the DST question stays open
exactly as the capturer left it.

## Totals

| job | surface | span | scored rows |
|---|---|---|---|
| 1 NL | 3 cities x 2 years, stated consensus verified | 730 d/city | 4,380 (2 columns x 2,190) |
| 2 BE | frozen window table, rule encoded | 2 editions, 1 table | 1,460 |
| 3 PT | lisboa 2023/2026/2027, one recipe | 1,095 d | 7,300 |
| 4 ES | granada 502 + malaga 30 | 502 d | 3,192 |
| 5 Roma | 30-row poster | 30 d | 180 |
