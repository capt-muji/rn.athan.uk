# O1m-R1 masjidi high-latitude summer rule (Norway, Sweden, Belgium)

Round o1m, wave R1, continuation of O1l-69 after a provider cancellation. Parent operation
`$HOME/athan-gitree/census/o1m/`. Standing orders: `BRIEF.md`, `FIT-RULES.md`.

## 1. What was banked, what this session added

Verified before continuing, never redone:

| item | state on arrival |
|---|---|
| `data/table_{394,444,5587,5622,1641}.json` plus `table_2.json` | 6 raw table payloads, 366 dated rows each |
| `data/table_meta.json`, `data/platform_tables.json`, `data/recipes.json` | 167 tables, 495 tenants |
| `data/rule_days_*.json` (5) | per-day regime labels from the banked rule pass |
| `fit/` | solar core, joint fit, night scan, window scan, battery |
| `fit/out/joint_fit.json` | solar + angle parameters per table on the angle-honest days |
| `fit/out/scores.json` | banked per-bucket scores, 37 to 49 pc within 1 |
| report | none |

This session added `fit/final.py` (rule identification and scoring), `fit/cities.py` (twelve-city
consequence), `fit/aqrab2.py`, `fit/ruleid.py`, `fit/regress.py`, `fit/regress2.py`,
`fit/asr_d6.py`, `data/rule_form.json` (per-day rows plus parameters), `data/fit_summary.json`
(parameters and scores, citable), `data/trigger_days.json`, `data/city_rule.json`,
`fit/out/summary.txt`, `fit/out/final_fit.json`.

Source data: `$HOME/athan-gitree/census/o1l-city/masjidi/data/tables/`, block O1l-59 in
`$HOME/athan-gitree/census/o1l-city/CONSOLIDATION.md`. Engine for geometry and scoring: the
measured masjidi solar signature, sun evaluated once per day at 0h UT, fixed standard-time clock,
per-region horizon. adhan 4.4.6 was run as the reference engine and reproduces none of the summer
columns at any of its four high-latitude rules (section 3.4).

Scope limit, stated first: masjidi serves exactly five tenants in the three countries, so five
tables exist. Norway 2 (Asker 394, Fredrikstad 444), Sweden 2 (Fagersta 5587, Lidkoping 5622),
Belgium 1 (Charleroi 1641). No other city in these countries has a masjidi table. Eleven of the
twelve named cities are therefore computed, not scored, and section 6 says which is which.

## 2. The engine, re-measured

- Day-keyed integer-minute rows, no year and no coordinates in the payload, 366 rows on a leap
  scaffold. The scaffold is an index, never a claim of year.
- The sun is evaluated once per day at 0h UT: the whole-year fit on the angle-honest days is
  0.69 to 0.90 min RMS, and a per-prayer time-of-day evaluation does not improve it.
- The clock is fixed standard time all year. No column jumps at the EU DST boundary (section 8).
- Angles, from the joint fit on the angle-honest days: Norway fajr 16.35 and isha 14.76. Sweden fajr
  18.03 and isha 16.05. Belgium fajr 18.05 and isha 17.15. Shafi asr everywhere except the Norwegian
  winter block (section 7).
- The tables are a per-region configuration, not one shared recipe. Two Norwegian tables 85 km
  apart carry different summer constants, and the two Swedish tables differ by 0.012 in the
  fajr night fraction.

## 3. THE RULE FORM

Three mechanisms, one per country. Each is stated as constants, trigger days, and a builder line.
All times are standard-time minutes after local midnight. `N` is the night from the previous
maghrib to today's sunrise, and `N2` from today's maghrib to tomorrow's sunrise. Both come from the
table's own printed sunrise and maghrib.

### 3.1 Norway, `MA-NO-SUMMER` (Asker, Fredrikstad)

Two mechanisms on the same gate, and the gate is a date, not a geometry threshold.

- **fajr.** Angle 16.35 deg outside the gate. Inside, `fajr = min(P, sunrise - 60)`, where `P` is
  the published hold value of the nearer gate edge: `P = 158` (02:38) before the mid-gate day and
  `P = 139` (02:19) after, for Asker; `145` (02:25) and `132` (02:12) for Fredrikstad. The `-60`
  is a fixed interval in minutes, so the term does not scale with the night.
- **isha.** Angle 14.76 deg outside. Inside its own window, `isha = maghrib + 40` exactly. The
  shoulder between the angle and the floor is not reproduced by either, and is left unmodelled.
- **Trigger days.** Asker fajr 2028-04-12 to 2028-08-27, 138 days. Fredrikstad fajr 2028-04-16 to
  2028-08-24, 131 days. Asker isha floor 2028-05-31 to 2028-07-23, 54 days. Fredrikstad isha floor
  2028-06-01 to 2028-07-22, 52 days.
- **Builder line.** `fajr = angle 16.35 OR min(pin, sunrise - 60) from 12 Apr to 27 Aug, pin 02:38
  then 02:19; isha = angle 14.76 OR maghrib + 40 from 31 May to 23 Jul` (Asker values).

The `min(P, sunrise - 60)` reading is the finding that replaced the banked description. The banked
pass stored the frozen clock value as a per-day literal, which reproduces those days by
construction and predicts nothing. The two published holds are the *twilight time at the gate
edge*, and the interval term takes over where it is earlier, which is exactly where the two curves
cross. That crossing reproduces both the spring hold, the midsummer interval, and the autumn hold
from two published constants and one interval.

### 3.2 Sweden, `MA-SE-SUMMER` (Fagersta, Lidkoping)

One mechanism, continuous, no clock pins.

- **fajr** inside the window: `fajr = sunrise - (a + b*N)`, Fagersta `a = -0.85`, `b = 0.2099`,
  Lidkoping `a = -0.45`, `b = 0.1983`. With `a` at zero this is `fajr = maghrib_prev + 0.790*N`
  (Fagersta) and `+ 0.802*N` (Lidkoping).
- **isha** inside the window: `isha = maghrib + (a + b*N2)`, Fagersta `a = -0.19`, `b = 0.1849`,
  Lidkoping `a = -1.08`, `b = 0.1778`.
- **Trigger days** (first and last day the table leaves the angle): Fagersta fajr 2028-03-08 to
  2028-09-14, isha 2028-03-17 to 2028-09-08. Lidkoping fajr 2028-03-18 to 2028-09-11, isha
  2028-03-25 to 2028-09-05. The portion reproduces 128 of Fagersta's 191 window days and 119 of
  Lidkoping's 178 within 1 min. The remaining shoulder days are a ramp this fit does not carry.
- **Builder line.** `fajr = angle 18.03 OR night/4.76 from 8 Mar to 14 Sep; isha = angle 16.05 OR
  night/5.41 from 17 Mar to 8 Sep` (Fagersta values).

### 3.3 Belgium, `MA-BE-SUMMER` (Charleroi)

The same portion form with a much larger share of the night.

- **fajr**: `fajr = sunrise - (1.68 + 0.3039*N)`, equivalent to `maghrib_prev + 0.696*N`.
- **isha**: `isha = maghrib + 0.279*N2`.
- **Trigger days**: fajr 2028-05-07 to 2028-08-05 (91 days), isha 2028-05-12 to 2028-07-31
  (81 days).
- **Builder line.** `fajr = angle 18.05 OR night/3.29 from 7 May to 5 Aug; isha = angle 17.15 OR
  night/3.58 from 12 May to 31 Jul`.

### 3.4 What the portion is not

The portion is a *time* fraction of the printed night. It is neither a fixed angle nor a preset. Tested
and refuted on these tables, worst error in minutes on the summer days: 1/7 of the night (60 at
Fagersta, 81 at Asker), the midpoint rule (about 90), a fixed 90-minute interval (60 at Fagersta),
and an angle cap with a constant plateau in Sweden and Belgium (the observed curve is continuous,
so no plateau exists there). The fraction is per region: 0.790 and 0.802 within Sweden, 0.696 in
Belgium. That spread, and the Norwegian use of a fixed interval instead, is why no single preset
reproduces the pool.

adhan 4.4.6 measured at Asker's coordinates over all 366 rows, MuslimWorldLeague, Rounding.None,
clock pinned to UTC+1, each high-latitude rule in turn:

| high-latitude rule | fajr RMS | fajr worst | fajr within-1 | isha RMS | isha worst | isha within-1 |
|---|---|---|---|---|---|---|
| none | 120.8 | 200 | 0 | 57.6 | 118 | 1 |
| MiddleOfTheNight | 120.8 | 200 | 0 | 57.6 | 118 | 1 |
| SeventhOfTheNight | 47.4 | 66 | 6 | 60.1 | 93 | 0 |
| TwilightAngle | 83.5 | 120 | 0 | 31.8 | 44 | 17 |
| this report's rule | 0.97 | 4 | 328 | 29.33 | 149 | 200 |

No preset is close on fajr. On isha, TwilightAngle happens to be near this report's whole-year RMS
because it spreads a moderate error across the shoulder where this model is either exact or far
off. The within-1 count is 17 against 200.

## 4. Trigger-day table

Measured from the five tables. `departure` is the first and last day the table leaves its own
twilight angle, `rule days` the days the stated substitute reproduces within 1 minute.

| table | city | lat | col | departure window | rule days | substitute |
|---|---|---|---|---|---|---|
| 394 | Asker NO | 59.92 | fajr | 2028-04-12..2028-08-27 | 138/138 | min(pin 158/139, sunrise-60) |
| 394 | Asker NO | 59.92 | isha | 2028-05-31..2028-07-23 | 54/54 | maghrib+40 |
| 444 | Fredrikstad NO | 59.18 | fajr | 2028-04-16..2028-08-24 | 131/131 | min(pin 145/132, sunrise-60) |
| 444 | Fredrikstad NO | 59.18 | isha | 2028-06-01..2028-07-22 | 52/52 | maghrib+40 |
| 5587 | Fagersta SE | 60.10 | fajr | 2028-03-08..2028-09-14 | 128/191 | sunrise-(0.2099N-0.85) |
| 5587 | Fagersta SE | 60.10 | isha | 2028-03-17..2028-09-08 | 126/176 | maghrib+(0.1849N2-0.19) |
| 5622 | Lidkoping SE | 58.58 | fajr | 2028-03-18..2028-09-11 | 119/178 | sunrise-(0.1983N-0.45) |
| 5622 | Lidkoping SE | 58.58 | isha | 2028-03-25..2028-09-05 | 119/165 | maghrib+(0.1778N2-1.08) |
| 1641 | Charleroi BE | 50.33 | fajr | 2028-05-07..2028-08-05 | 91/91 | sunrise-(0.3039N+1.68) |
| 1641 | Charleroi BE | 50.33 | isha | 2028-05-12..2028-07-31 | 81/81 | maghrib+0.279N2 |

The departure window shortens with latitude in the expected direction: 91 days at 50.3 N, 165 to
191 at 58.6 to 60.1 N, and 131 to 138 for the Norwegian fixed-interval gate at 59.2 to 59.9 N.

## 5. Scores, rule days and honest days separately

`RULE` counts only days the substitute reproduces within 1 minute, `HONEST` only days the twilight
angle reproduces within 1 minute, `TRANS` are days neither model reaches.

| table | col | RULE exact/n | HONEST within-1/n | TRANS n | whole year within-1 | RMS | worst |
|---|---|---|---|---|---|---|---|
| 394 Asker | fajr | 138/138 | 190/190 | 38 | 328/366 (89.6 pc) | 0.97 | -4 |
| 394 Asker | isha | 54/54 | 146/146 | 119 | 200/319 (62.7 pc) | 29.33 | +149 |
| 444 Fredrikstad | fajr | 131/131 | 196/196 | 39 | 327/366 (89.3 pc) | 1.03 | -4 |
| 444 Fredrikstad | isha | 52/52 | 155/155 | 116 | 207/323 (64.1 pc) | 31.03 | +163 |
| 5587 Fagersta | fajr | 70/128 | 168/168 | 70 | 296/366 (80.9 pc) | 4.82 | -27 |
| 5587 Fagersta | isha | 74/126 | 174/174 | 66 | 300/366 (82.0 pc) | 3.16 | -16 |
| 5622 Lidkoping | fajr | 67/119 | 171/171 | 76 | 290/366 (79.2 pc) | 4.17 | +20 |
| 5622 Lidkoping | isha | 82/119 | 180/180 | 67 | 299/366 (81.7 pc) | 3.47 | -18 |
| 1641 Charleroi | fajr | 65/91 | 203/203 | 72 | 294/366 (80.3 pc) | 1.12 | +3 |
| 1641 Charleroi | isha | 63/81 | 218/218 | 67 | 299/366 (81.7 pc) | 1.11 | -3 |

Pool totals: fajr 1,535 of 1,830 cells within 1 minute (83.9 pc). isha 1,305 of 1,740 scored cells
(75.0 pc), with 90 cells carrying no prediction at all because the twilight is absent and the
substitute is unmodelled. Combined 79.6 pc, against 37 to 49 pc banked.

Every rule day matches within 1 minute, and 54 to 138 of them match exactly depending on the
country. Inside its window the substitute is the published summer block, not a fit to it.

The isha worst cases are the shoulder days where the twilight angle still exists and this model
predicts it while the table ignores it. Those days are counted as errors rather than left blank. The RMS and worst columns are carried entirely by
the TRANS days, and by the pin-boundary days in Norway where the fitted 16.35 deg angle is 4
minutes off the table at the crossing (my model's error, not the rule's).

## 6. The twelve named cities

Scored: only Oslo, through the Asker table, whose fitted coordinate is 59.92 N against Oslo's
59.91 N. The rule computed at Oslo's own coordinates gives 01:54 for midsummer fajr, the same
minute as the Asker table. The other eleven have no masjidi tenant, so their numbers are the rule
applied, not a fit.

Computed at each city's own coordinates, standard horizon, Norway constants (interval 60/40 with
the pins being published constants that do not travel), Sweden and Belgium portions as measured.

| city | cc | lat | twilight-fajr gap | midnight-sun / polar-night | substitution window (fajr) | midsummer fajr | midsummer isha |
|---|---|---|---|---|---|---|---|
| Tromso | NO | 69.65 | 166 d | 69 d midnight sun, 49 d polar night | 2028-04-05..2028-09-08 | degenerate | 23:55 |
| Alta | NO | 69.97 | 167 d | 71 d midnight sun, 53 d polar night | 2028-04-04..2028-09-08 | degenerate | 23:33 |
| Harstad | NO | 68.80 | 161 d | 61 d midnight sun, 39 d polar night | 2028-04-05..2028-09-07 | degenerate | 24:05 |
| Bodo | NO | 67.28 | 153 d | 43 d midnight sun, none | 2028-04-07..2028-09-05 | degenerate | 24:12 |
| Trondheim | NO | 63.43 | 133 d | none | 2028-04-11..2028-09-02 | 01:02 | 23:18 |
| Bergen | NO | 60.39 | 115 d | none | 2028-04-14..2028-08-30 | 02:10 | 22:51 |
| Oslo | NO | 59.91 | 111 d | none | 2028-04-14..2028-08-29 | 01:54 | 22:24 |
| Stockholm | SE | 59.33 | 118 d | none | 2028-03-21..2028-09-22 | 01:26 | 22:06 |
| Gothenburg | SE | 57.71 | 107 d | none | 2028-03-26..2028-09-17 | 01:59 | 22:20 |
| Malmo | SE | 55.61 | 93 d | none | 2028-04-01..2028-09-11 | 02:05 | 22:05 |
| Brussels | BE | 50.85 | 53 d | none | 2028-05-10..2028-08-02 | 02:11 | 23:05 |
| Antwerp | BE | 51.22 | 57 d | none | 2028-05-09..2028-08-03 | 02:10 | 23:06 |

`degenerate` marks a city where the Norway interval rule produces a fajr before local midnight,
which is not a time any builder can print. Bodo is 15 minutes before midnight, Harstad 44, Alta 46,
Tromso 53. At Tromso, Alta and Harstad the sun does not set for 61 to 71 days, so `maghrib` and
`sunrise` do not exist and the portion has no input at all. The measured rule therefore stops
being usable at about 67 N, and the platform has no tenant to show what it does above that. This
is a builder limit, not a data defect.

## 7. D6: the asr school switch

Real, in Norway, on two dates, identical in both Norwegian tables:

- 2028-01-01 to 2028-03-28: shadow factor 1.96, Hanafi.
- 2028-03-29 to 2028-10-24: shadow factor 1.0 (fitted 0.97), Shafi.
- 2028-10-25 to 2028-12-31: shadow factor 1.92 to 1.96, Hanafi.

The jump at each boundary is 50 and 34 minutes in asr minus dhuhr. Both Norwegian tables switch on
the same two days. Sweden and Belgium stay on shadow factor 1.0 all year (Sweden 1.03 to 1.20 by
month, Belgium 0.99 to 1.04). The pool carries no Iranian-style school switch. It carries a
Norwegian seasonal one, and that is the only abrupt column change in the five tables.

The Swedish asr is not explained to better than 2.3 to 2.6 min RMS by shadow factor 1 at the
fitted coordinate, with the residual smooth across the year (winter late, summer on line). A
smooth residual of that size at a 60 N fitted latitude is consistent with a small latitude error in
the fit, and it is flagged rather than adjudicated.

## 8. DST in Belgium

No convention change. Charleroi's dhuhr runs 769, 769, 769, 768, 768, 768, 768 across 23 to 29
March, and 747, 747, 747, 747, 746, 746 across 26 to 31 October. The EU changeover dates fall
inside those runs and produce no 60-minute jump in any column. The same holds for both Swedish and
both Norwegian tables.

The table's clock is fixed standard time all year: Belgium UTC+1, Sweden and Norway UTC+1. A
builder must apply the zone's summer offset itself. A client that renders the table as local time
without adding the offset prints every column 60 minutes early from late March to late October.

## 9. Defects

1. **The Norwegian isha shoulder is unmodelled.** 119 of 319 scored Asker cells and 116 of 323
   Fredrikstad cells fall between the twilight angle and the 40-minute floor, drifting smoothly.
   Measured shape: the interval from maghrib falls from 112 min at the spring gate to 40 at the
   floor and back to 118 at the autumn gate, while the night fraction it implies falls from 0.19 to
   0.11. No constant portion, fixed interval, midpoint or angle reproduces it. This is the single
   largest remaining hole, at 33 pc of the two Norwegian isha columns.
2. **The Swedish and Belgian shoulders are a ramp.** 70 fajr and 66 isha days at Fagersta, 76 and
   67 at Lidkoping, 72 and 67 at Charleroi sit between the angle and the portion, with a systematic
   sign: shorter than the portion in spring, longer in autumn. Magnitude is 2 to 27 min in Sweden
   and 2 to 3 min in Belgium.
3. **The gate is a date, not a geometry.** At Asker the 16.35 deg twilight becomes unreachable on
   2028-04-27 and returns on 2028-08-15. The published block runs 2028-04-12 to 2028-08-27, so it
   starts 15 days early and ends 12 days late, and for those 27 days the angle still exists and the
   table overrides it. Fredrikstad: unreachable 2028-04-29 to 2028-08-13, block 2028-04-16 to
   2028-08-24, 13 days early and 11 late. The same holds in Sweden and Belgium, where the
   departure window opens 44 and 22 days before the angle fails. A builder cannot derive the
   trigger from latitude.
4. **The pin values do not travel.** 02:38 and 02:19 at Asker, 02:25 and 02:12 at Fredrikstad, 85
   km apart and at nearly the same latitude. Two more Norwegian regions would likely carry two
   more pairs, and there is no masjidi tenant to measure.
5. **Tromso, Alta, Harstad and Bodo cannot be served** by the measured rule (section 6).
6. **The afternoon column in Sweden is 2.3 to 2.6 min off** under shadow factor 1 at the fitted
   coordinate (section 7).
7. **The scaffold is not a year.** All dates here are 2028 keys of a leap scaffold. Every rule
   constant is a clock-and-night relation, so it is year-independent, but no calendar claim is
   made and no seasonal drift between years can be measured from one published generation. Under
   FIT-RULES grading this is one published cycle: candidate, not provisional, not A.

## 10. NEXT

1. Find a second generation of any of the five tables (a dated reprint, an archived payload, a
   tenant whose config carries a different tableId at the same city) to test whether the pins and
   portions move between years. The portion constants are the part that would move.
2. Reach the Norwegian publisher behind the Asker and Fredrikstad blocks. The pins are published
   constants, so a public annual table from the same body would give both the mechanism and the
   other regions. Search the mosque names in Norwegian, not in Arabic.
3. Test the isha shoulder against a "portion of the night measured from the fajr floor" family,
   which is the one form not yet tried and is suggested by the shoulder's symmetry about the gate.
4. Sweep the o1l masjidi pool for the same `min(hold, interval)` signature at other latitudes.
   Tawkit-style platforms often carry it outside the high latitudes as a Ramadan or winter block,
   and one confirmed second site would lift the rule from candidate to provisional.
5. Carry the D6 finding into the platform census: a seasonal asr school switch is a new defect
   class for the suite, and the Sweden residual is a new latitude-fit tolerance to set.

## Assumptions

- The five tables are engine output on a per-region configuration, not hand-typed mosque tables.
  Evidence: all 366 rows of all five fit one solar model within 1 min on the angle-honest days,
  and the same engine signature (0h UT, standard time) holds across the 167-table masjidi pool
  measured in O1l-59.
- The 2028 scaffold keys are treated as an index only, never as a year. Evidence: the payload
  carries no year, and the banked `dateBasis` note says so.
- The twelve-city numbers use the country constants measured at the nearest anchors, and the
  substitution window is the day the portion overtakes the angle at that city's own coordinates.
  Evidence: at the three portion tables the crossing lands 5 to 15 days from the measured window
  edge, and the mismatch is confined to the unmodelled shoulder.
