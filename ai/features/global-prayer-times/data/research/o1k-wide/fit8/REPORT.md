# fit8 — the Norwegian schism lines, Sweden's IF national year, Denmark's three-way split

Workspace `$HOME/athan-gitree/census/o1k-wide/fit8/`. Engine adhan 4.4.6 at
`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`; second resolution then
explicit rounding; `TZ=<zone> node no.mjs|se.mjs|dk.mjs`; no real clock, no network.
Data: `nordics2/data/` + `europe/data/`. Machinery: copied fit4 `lib.mjs`/`engine.mjs`
plus `lib8.mjs` (per-prayer coverage, cap families, per-day substitution classifier).
Per the FIT-RULES amendment: every banked year file of each line is fitted as one
span, per-city scores underneath, stability and seasonal amplitude reported. All
banked spans here are 2026 only — every source refuses year 2 (IRN's API returns
`[]` for all twelve 2027 months; mawaqeet serves 2026 only; the IF page serves
"2026"; the Danish surfaces are live-day or single renders), so the between-year
verdict is honestly "no second year exists"; between-city stability carries what
confidence the span has.

## Job 1 — Norway: the lines hold their stated pairs

Twelve tables fitted (`no-fit.json`): IRN bergen/trondheim/tromso API years (365 each),
Rabita Oslo Nov+Dec (61), mawaqeet trondheim/kristiansand/alesund years (365 each),
mawaqeet oslo/bergen/stavanger PDF years (241-249 parseable rows), islamweb.no
(Jamiat Ulama, third line) oslo/bergen (365 each).

### IRN line — claimed 16/15: HOLDS

Fajr 16°, isha 15°, floor rounding at margin 0. Scores are angle-honest days only;
every residual within 1 minute:

| Table | fajr 16° exact/angle-days | isha 15° exact/angle-days | worst |
| --- | --- | --- | --- |
| bergen | 204/226 | 168/189 | 1 |
| trondheim | 189/204 | 170/191 | 1 |
| tromso (130 honest days) | 67/69 | 61/74 | 1 |
| oslo-rabita (61 rows, Nov-Dec) | 51/61 | 47/61 | 1 (w1 61/61 both) |

The exact-rate on angle days is diluted by a ±1 min seasonal drift between IRN's
solar model and adhan's; within-1 is near-total wherever the angle exists.

**Solar conventions.** dhuhr = transit + 4.5 min in CET months, + 9.5 in CEST
months — IRN's 5-minute safety lands DST-doubled (bergen CET 144/155, CEST 170/210;
the same split at every IRN table). maghrib = sunset + 4.5 floor; asr column sits
between adhan's shadow-1 and shadow-2 in winter (declination-sensitive at 60-70N)
and matches shadow-1 to 0 min in summer; asr school unresolved from this data.

**Substitutions, sized and excluded from the claim scores.** IRN clamps its fajr
column through the summer angle-failure at Bergen (16° fails ~Apr 27-Aug 25):
freeze at an absolute plateau 03:59 (Apr 12-26, 15 days), bridge = sunrise-60
(May 15-Jul 19), freeze at 03:44 (Jul 20-Aug 25, incl. 12 days where 16° exists
again but is not printed); isha clamps Mar 24-Apr 29 + Aug 14-Sep 15 (37+33 days)
toward a maghrib+40 bridge in midsummer. Trondheim same shape (18+13 fajr, 27+23
isha clamped days). These are the record's high-latitude defect classes for the
IRN line, now measured day-by-day.

**Tromsø substitution rule (the polar-night synthetic), characterized and excluded.**
The synthetic block is NOT 50 days; it is 235 days in three ranges: Jan 1-Feb 8
(39), Apr 16-Aug 28 (135), Nov 1-Dec 31 (61). Detector: a real sunrise/sunset pair
straddles transit symmetrically; these 235 printed pairs do not (midpoint off
transit by up to +166 min winter / -160 min summer). Rule shape: hold the boundary
pair and let it creep ~0.2-0.5 min/day into a solstice plateau — winter plateau
sunrise ~11:53, maghrib ~17:1x-17:25; summer plateau ~00:47/19:35 (day ~18h48m
printed where the sun never sets) — then unwind to real pairs at the honest edges.
Honest windows: Feb 9-Apr 15 and Aug 29-Oct 31 = 130 days; the claim score above
runs on those only, and IRN's fajr/isha columns inside the 235 synthetic days are
computed inside the invented daylight (fajr 05:10 on Jan 1), so they carry the
defect too.

### Mawaqeet line — claimed 18/15: HOLDS

Fajr = 18° with the midnight cap (night/2 fallback, i.e. adhan's portion 1/2);
isha = bare 15° with the summer plateau printed `--:--` (null, not substituted);
floor +1 rounding. Worst residual 1 at every city:

| Table | fajr 18°/midnight exact/angle-days | isha 15° exact/coverage | null isha days |
| --- | --- | --- | --- |
| trondheim | 229/247 | 200/223 | 142 |
| kristiansand | 269/306 | 233/255 | 110 |
| alesund | 231/259 | 207/229 | 136 |
| oslo (PDF year) | 218/242 | 214/243 | 122 (dropped by the PDF parser) |
| bergen (PDF year) | 237/240 | 220/241 | 124 (dropped) |
| stavanger (PDF year) | 246/248 | 224/249 | 116 (dropped) |

Solar: sunrise m0 floor (353-359/365 at the full years), dhuhr +6 floor, maghrib
+5 floor. The earlier-wave PDF files (oslo/bergen/stavanger) carry 241-249 rows
because the summer `--:--` isha rows were dropped by the first parser; fajr on
those files still fits the same recipe within 1, so the line is one recipe across
all six city files. Parameters frozen across the span; seasonal amplitude: fajr-
sunrise gap Jan −146..−182 vs Jul −137..−193 (the midnight cap keeps the summer
gap large — that is the difference from IRN's sr−60 bridge).

### Third line — Jamiat Ulama (islamweb.no): Moonsighting Committee, not an angle pair

Neither 16/15 nor 18/15 fits (best bare angle 33/365). The recipe is
MoonsightingCommittee with the high-latitude season adjustment (Oslo 59.9N ≥ 55):

- fajr: 253/365 EXACT, 365/365 within-1, worst 1 (Oslo); 247/365, w1 365 (Bergen)
- isha: MC evening +3.5 floor: 244/365, w1 364, worst 2 (Oslo); 212/365, w1 355 (Bergen)
- dhuhr +0.5 floor (350/365 w1 365), sunrise m0.5 floor, maghrib = sunset +4.8..5.5
  DST-aware, asr = shadow-2 (Hanafi) to ±1.1 all year

Recorded in `no-fit.json` under `thirdLineMC`. The census's two-line schism is
therefore three recipes: IRN 16/15 (Shafi-ish asr, DST-doubled dhuhr safety),
mawaqeet 18/15 (midnight-capped fajr, null summer isha), JU = MC high-latitude
(Hanafi asr).

## Job 2 — Sweden: one recipe, three cities — yes, but not "exact" year-round

`se-fit.json`: IF Stockholm/Uppsala/Göteborg (365 each) + Angered (byte-equal to
IF Göteborg, fitted identically). Run at Stockholm 59.3293/18.0686, Uppsala
59.8586/17.6389, Göteborg 57.7089/11.9746, Europe/Stockholm. Diyanet Köln
(europe/data, 365) run as the control for the claimed scheme.

- **One recipe across three cities: YES.** The three IF tables fit identically
  (fajr bare-18 best at every city: 138/140/142 exact; identical solar offsets),
  and Angered equals Göteborg with 0 differing cells. Angered's year is IF
  Göteborg's year, confirming the record.
- **The engine is Diyanet's.** Shared fingerprint on every solar column, IF Sweden
  and Köln alike: sunrise = computed −6.5, dhuhr = transit +5.5 floor (w1 365/365),
  maghrib = sunset +6, asr = Shafi (Hanafi refit fails, 0-20/365). This is the
  Diyanet European unified engine the record names.
- **"18/16 exact" survives only as the pair, not year-round.** Per-month on
  angle-honest days: Sep-Apr the 18° fajr lands 23-30/28-31 exact at margin 0/+1
  and the 16° isha 20-28 at −0.5..−2, in the same month-by-month drift pattern as
  the Diyanet control — an engine-vs-adhan drift of ±1-2 min, not a different
  recipe. The record's "EXACT" (L5) matches a short-window reading.
- **High-latitude handling: the table clamps into a smooth summer V, mechanism
  unidentified.** At Stockholm the 18° fajr fails Apr 24-Aug 19 (118 days) and the
  16° isha Apr 30-Aug 13 (106 days); the table prints through both with a solstice
  plateau (fajr longest run 9 @ 02:20; isha run 12 @ 23:12) and never goes dark.
  No standard rule reproduces it: frozenLatitude45 (times computed at 45° same
  date) 0/118, minute caps ≤3/118, gap-transfer 1/118 — and the SAME failure shows
  on the Diyanet Köln control (frozen45 0/54; best fixed cap sr−96 only 12/54,
  where the record's "80-minute plateau" reads 96 at Köln). The record's freeze
  mechanism ("frozenLatitude45 with the 80-minute plateau verified exact") does
  not survive this test and needs correction; what is verified is the PAIR plus a
  proprietary summer plateau shared with Diyanet.
- **No January fajr freeze in the IF national year**: longest fajr runs are 8-9
  days; the record's "January fajr FROZEN at 06:25" belongs to the Göteborg mosque
  PDF layer, not the IF national table.

Stability: single year served; the site has no archive and Wayback holds no
monthly snapshots, so between-year confidence does not exist for the IF line.

## Job 3 — Denmark: the three-way split, confirmed line by line

`dk-fit.json` at Copenhagen 55.6761/12.5683, Europe/Copenhagen.

- **Mawaqeet Copenhagen (365): 18/15 CONFIRMED.** Fajr 18° with midnight cap 282/365
  (w1 346), isha 15° 247/271 (w1 271) with 94 summer `--:--` days, maghrib +5
  (353/365), sunrise m0 (359/365), dhuhr +6, asr printed in both schools. Same
  recipe as the Norwegian mawaqeet cities — it is the network's render, not a
  Danish body's.
- **Khair al Bariya (live day 2026-11-10): 18/16 CONFIRMED.** fajr 05:25 = 18° −1,
  isha 18:08 = 16° +1, with mosque-layer offsets (+5.4 dhuhr, +7 asr, +9 maghrib,
  shurooq −8) — the My Masjid iqama board, not a pure calculator table.
- **salah.dk (live day): 15/15 CONFIRMED.** isha 17:59 = 15° EXACT, fajr 05:48 =
  15° +1, dhuhr +1.4, maghrib = sunset, asr Shafi +1 with the Hanafi column exact.
- **DIT/wakf (live day, the record's original day-fit source):** fajr 05:47 = 15°
  EXACT, isha = printed maghrib + 97 (an offset rule, not an angle).
- **Imam Ali (91 rows, Jan/Jun/Nov): Tehran method CONFIRMED.** fajr 17.7° 57/61
  exact (the 30 June rows have no 17.7° fajr at 55.7N), maghrib = sunset+4.5°
  81/91, dhuhr 91/91 EXACT, sunrise 79/91; no asr/isha printed (Jafari midnight).

**Does the 15/15 reading survive as representative? NO — it is a minority table.**
The only Danish mosque bodies with known recipes are Khair al Bariya (Stormoskeen,
the capital's largest mosque) at **18/16** and Imam Ali at **Tehran 17.7/4.5**;
both confirmed here. The 15/15 family holds exactly on the live day but belongs to
salah.dk (an aggregator's own compute) and, in its +97-isha variant, to DIT/wakf
whose table generator is defunct. The census's Denmark verdict, which rests on
that 15/15 day-fit, should read: the 15/15 is real but not the capital's mosque
line; the dominant published recipes are 18/16 (Khair al Bariya) and the
mawaqeet-network 18/15 render, with salah.dk's 15/15 as the aggregator layer.

## Deliverables and provenance

- `no-fit.json` (12 tables + `thirdLineMC`), `se-fit.json` (3 cities + Angered +
  Köln control + per-month breakdown), `dk-fit.json` (year fit + 91-row fit +
  single-day computed table), this REPORT.md.
- Coordinates: IRN cities from IRN's own location index capture
  (`nordics2/captures/no-irn-locations.json`, 359 municipalities); Oslo/Bergen and
  Sweden/Denmark city coordinates as given in the brief plus standard centres for
  Uppsala/Göteborg; Imam Ali/mawaqeet/khair-al-bariya/salah.dk/DIT at Copenhagen.
- Runs: `TZ=Europe/Oslo node no.mjs`, `TZ=Europe/Stockholm node se.mjs`,
  `TZ=Europe/Copenhagen node dk.mjs` (raw run log `se-run.log`).
