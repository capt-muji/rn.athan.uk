# O1l-65 (flags closer 2): the four wtdiff2 flags closed

Agent O1l-65, 2026-11-11. Workspace `$HOME/athan-gitree/census/o1l-city/flags2/`. Read-only against
the record and against every banked block. Nothing in the repository was touched, no web was used,
no clock was read, engine adhan 4.4.6 with `Rounding.None` and the timezone pinned per country.

Binding inputs: `../BRIEF.md`, `../FIT-RULES.md`, `../wtdiff2/WORLD-TABLE-DIFF-ROUND2.md` section 7.

The four flags F2, F3, F4, F5 close below. F1 (Oman) was already closed as ridge-degenerate and is
not reopened.

---

## F2. Quetta asr: a hand-ruled asr convention, not a rounding artefact and not an error

Source: `../o1l-21r/data/quetta-transcribed.js` (8 columns, both asr columns, 365 chart rows) and
`../o1l-21r/data/pk-quetta-chart-2026.json`. Point 30.1841 N 66.9966 E, TZ `Asia/Karachi`.
Four printed anomalies excluded (`2026-04-23`, `07-31`, `09-16`, `09-25`), 361 scored rows.
Scripts `fit/quetta-asr.mjs`, `fit/quetta-rule.mjs`, `fit/quetta-name.mjs`, `fit/quetta-chain.mjs`,
`fit/quetta-lat.mjs`. Rows written to `data/quetta-asr-rows.json`.

The chart prints TWO asr columns, `عصر (مثل اول)` and `عصر (مثل ثانی)`. The dated census column is
the second. Both were fitted separately.

**Column 5 (mithl awwal) is a fraction rule, and it is the finding that settles the flag.**
`asr1 = transit + 0.5 x (sunset - transit)`, the half-afternoon point. The measured fraction is
0.4977 mean with sd 0.0046 across the year (monthly means 0.4902 to 0.5025, every month's sd at or
under 0.009). The rule scores 105/361 exact and 252/361 within 1, worst 7. Shadow-1 from noon scores
0/361 within 1 at mean -17.4 min, so the printed Shafi column is NOT a shadow computation at all.
A chart that hand-rules one asr column this crudely is not an engine output.

**Column 6 (mithl thani) is shadow-2 with a seasonal term.**

| family | exact | within 1 | mean | worst |
|---|---|---|---|---|
| shadow-2 from noon | 67/361 | 173/361 | -0.30 | 7 |
| cot = 2 + 0.935 cot(noon) | 95/361 | 235/361 | +1.15 | 8 |
| seasonal n(d) = 1.666 + 0.215 sin d + 0.329 cos d | 110/361 | 252/361 | -0.01 | 6 |
| half-afternoon + one shadow increment | 0/361 | 0/361 | +7.09 | 14 |
| asr-only latitude 31.05 N, n 2.01 | 103/361 | 265/361 | - | 7 |
| fixed fraction 0.71 of the afternoon | 38/361 | 112/361 | -3.83 | 15 |

Monthly mean residual against shadow-2 runs -4.5 (Jan), -3.2, -1.5, +1.0, **+5.0 (May)**, +2.8, +0.7,
-0.1, +0.6, +0.4, -1.1, -3.4 (Dec). Zero crossings fall in mid-April and early August. The residual
is a smooth function of declination (r2 0.61 against sin d, identical against day length, the two
collinear), and the within-month scatter is plus or minus 1 min, which is the print quantum.

**Not rounding.** The swing is plus or minus 5 min, ten times the 1 min print quantum, and it is
smooth and seasonal. A rounding artefact cannot produce a between-month trend ten quanta wide while
the within-month scatter stays at one quantum.

**Not an error of point or ephemeris.** On the same table, the same point and the same engine,
sunrise is 325/365 within 1, dhuhr 364/365 and maghrib 311/365. A wrong reference point or a wrong
declination model would move those columns too. It does not.

**Verdict: a different asr convention.** Rule-form **PK-QUETTA-ASR**: two hand-ruled asr columns,
the Shafi at the half-afternoon fraction `noon + 0.5 (sunset - noon)`, the Hanafi at shadow-2 plus a
declination-tracking seasonal term of plus or minus 5 min. The generator of that seasonal term is
undecidable at the print quantum: no member of the shadow family absorbs it (the best, the seasonal
shadow factor, leaves a worst of 6 and 109 rows outside 1). What is decided is that the swing is a
RULE, not noise, and that the census column is not the shadow-2 engine's output.

---

## F3. Macedonia: bfi.mk is the anomaly, and the cause is neither timezone, nor DST, nor the city point

Sources: `../balkan-cities/data/mk_bfi_2026-11-11.json` (bfi.mk home widget, one day, five columns)
and `../balkan-cities/data/eu_vaktijaeu_2026.json` (vaktija.eu Skopje, 30 rows, November 2026).
Script `fit/macedonia.mjs`, result `data/macedonia.json`.

Row of 2026-11-11, bfi.mk minus vaktija.eu: fajr **+45**, dhuhr +6, asr +8, maghrib +8, isha -10.

**vaktija.eu's month is internally consistent.** At 42.0 N 21.4333 E on 18/16 Shafi, its 30 rows
give fajr +0.23 mean (27/30 within 1), dhuhr +1.00 (30/30), maghrib -0.17 (28/30), isha +2.17
(12/30), asr -6.33 (0/30). The asr offset is the platform's own margin, the same -5.5 to -6.3 the
block recorded for Shkodra and Zagreb. So vaktija's fajr IS the 18-degree line at the Skopje point.
The block's 164/180 scores the fitted per-column margins, not the raw engine times scored here at
113/180. The two denominators differ and neither contradicts the other.

**All three candidate causes are excluded by the row's own geometry.**

| cause | required signature | observed |
|---|---|---|
| timezone field | one whole hour on every column | spread 55 min (45, 6, 8, 8, -10) |
| DST handling | a uniform 60 min | same, no uniform step |
| different city point | dhuhr, asr, maghrib move together at 4 min per degree | dhuhr +6.7, maghrib +7.9, asr +1.4, so the solar columns imply 1.7 to 2.0 deg west while asr implies 0.3 deg |

A point 1.7 deg west would move asr with dhuhr and maghrib. It does not. bfi's asr sits +1.4 on the
engine's Shafi asr at Skopje while its dhuhr sits +6.7 and its maghrib +7.9, so the row is not one
point's output.

**What the row does carry is a different twilight rule.** Its fajr is 51.0 min before the engine's
Skopje sunrise, which needs a fajr angle of 9.79 deg (about 10.5 deg at the implied western point).
Its isha is 77.9 min after the engine's Skopje maghrib, about 70 min after the implied point's
maghrib, which needs an isha angle of 14.68 deg. Neither is an 18/16 pair, and the pair is not a
recognised one.

**Verdict: bfi.mk's one-day sample is the anomaly.** It is a different fajr and isha rule at or near
Skopje (about 10 deg and 14.7 deg, or equivalently 51 min before sunrise and 70 min after maghrib)
with about +7 min on the solar columns. One day cannot separate an angle rule from an interval rule,
so bfi's exact form stays undecidable until a second day is banked. Both surfaces stay on the row,
per the round's rule. vaktija.eu's month is the surface of record for the recipe.

---

## F4. Porto: the monthly is a convention sheet, the annual is the publisher's own table

Sources: `../o1l-22/data/pt-monthly-2026-11.json` (porto_nov) and the banked annual
`o1k-wide/iberia2/captures/pt-porto_2026.pdf` page 11, re-parsed here. Script `fit/porto.py`,
parsed annual written to `data/porto-annual-nov.json`.

The annual is a computed table: 28 distinct fajr values across 30 days, 18 distinct asr, 23 distinct
maghrib, 6 distinct dhuhr. The monthly is a step ladder.

| column | monthly, distinct values (days) | monthly minus annual |
|---|---|---|
| fajr | 5:45 (1-9), 6:00 (10-21), 6:15 (22-30) | +3 to +20 |
| sunrise | solar, 30 values | 0 every day |
| dhuhr | **12:30, one value, 30 days** | +1 to +6 |
| asr | **15:45 (1-21), 15:30 (22-30)** | **+39 to +54** |
| maghrib | solar, 23 values | 0 every day |
| isha | 19:00 (1-14), 18:50 (15-30) | +9 to +23 |

Sunrise and maghrib are copied from the computed table to the minute. The four discretionary columns
are replaced by fixed clock rungs. That is a posted convention schedule, not a computation.

**The annual is the publisher's own.** Fitted at 41.1579 N 8.6291 W on 18/17 Shafi it scores fajr
+1.07 (0 to 2), sunrise -0.53, asr **+0.70 (0 to 1)**, maghrib +3.70, and isha80 = its own maghrib
+77 exactly on all 30 days. Hanafi asr scores -39.40, so the annual's asr is Shafi. The hub's other
two monthly sheets, Lisboa and Coimbra, are byte-identical to their annuals on all five computed
columns, so the monthly format itself normally carries the annual's computation. Porto's monthly is
the exception, and it is the mosque's posted schedule.

**Verdict: a convention sheet against the publisher's computed annual.** Rule-form
**PT-PORTO-MONTHLY-LADDER**: dhuhr fixed at 12:30, asr a two-rung clock ladder 15:45 then 15:30 at
the month's mid-point, fajr three rungs 5:45, 6:00, 6:15, isha two rungs 19:00, 18:50, with sunrise
and maghrib left solar. The +39 to +54 asr gap is the distance from the computed Shafi asr (15:06
falling to 14:48 across the month) to the fixed rung. No error and no drift is claimed against the
annual: the annual stays the surface of record and the monthly is recorded as the convention sheet
the wtdiff asked for.

---

## F5. India's isha line is a 17-degree isha, floored to the minute

Sources: the ten banked 2026 masjidbox city tables in `../india-cities/data/`, at the points O1l-11r
recovered. Script `fit/india-isha.mjs`, result `data/india-isha.json`. TZ `Asia/Kolkata`.

| city | printed isha - maghrib, spread | isha 17 | isha 18 | best angle |
|---|---|---|---|---|
| Hyderabad, Madinatul ilm | 71.3 mean, sd 2.9, spread 10 | **365/365 within 1**, mean -0.51 | 0/365, mean -4.94 | 16.70 |
| Mumbai, Anjuman Risalat | 72.2, sd 3.1, spread 11 | **365/365**, -0.53 | 0/365, -5.04 | 16.70 |
| Mumbai, Sunni Pathan | 72.2, sd 3.1, spread 10 | **365/365**, -0.28 | 0/365, -4.79 | 16.75 |
| Kolkata, Rafah-e-Aam | 74.2, sd 3.5, spread 12 | **365/365**, -0.53 | 0/365, -5.14 | 16.75 |
| Kolkata, Nandanpur | 74.1, sd 3.5, spread 12 | **365/365**, -0.52 | 0/365, -5.14 | 16.75 |
| Ramban, Noorani | 83.5, sd 5.8, spread 19 | **365/365**, -0.53 | 0/365, -5.84 | 16.80 |
| Baharampur, Fazle Elahi | 75.2, sd 3.7, spread 13 | **365/365**, -0.50 | 0/365, -5.22 | 16.75 |
| Moradabad, Chand | 79.3, sd 4.7, spread 16 | **365/365**, -0.50 | 0/365, -5.50 | 16.75 |
| Bengaluru, Rahmania | 74.0, sd 2.8, spread 10 | 0/365, +3.83 | **365/365**, -0.50 | 17.70 |
| Srinagar, SOQTE | 90.1, sd 6.9, spread 22 | 0/365, +4.92 | **365/365**, -0.51 | 17.80 |

**Not an interval.** The printed isha to maghrib interval spreads 10 to 22 min and its sd runs 2.8
to 6.9 min. The best fixed interval per city scores 22 to 37 exact and 85 to 112 within 1 of 365.

**Not a rounding convention.** The 17 and 18 degree lines are 4.34 to 5.44 min apart by city, four
to five print quanta. Every table sits within 1 min of one line on 365/365 rows and outside 1 min on
0/365 of the other. A quantum that separates two candidates 365 to 0 is not producing the line.

**The floor is the platform's, and it is visible in the mean.** At the correct angle every city's
mean residual is -0.28 to -0.53 with a worst of 1 and every residual at or below zero, which is
truncation to the minute, not nearest rounding.

**Verdict: a 17-degree isha.** Eight of the ten tables carry it and two, Bengaluru and Srinagar,
carry 18 degrees as a mosque-level override. Rule-form **IN-ISHA-17**: isha at 17 degrees below the
horizon, floored to the minute, with 18 degrees as the minority city line. This closes the flag's
"17 versus 18" question: the 4 to 5 min gap is the geometric separation of the two angles at Indian
latitudes, and the banked tables resolve it decisively in favour of a real angle on every surface,
with the split by city rather than by season.

---

## What the close must write

| flag | row action |
|---|---|
| F2 | Replace "asr does not reproduce" with the rule-form PK-QUETTA-ASR and the two-column finding. Keep the row provisional and the chart's one published cycle |
| F3 | Record bfi.mk as the anomaly with the three excluded causes, keep both surfaces, name vaktija.eu's 18/16 as the recipe of record |
| F4 | Add PT-PORTO-MONTHLY-LADDER as a defect-class note: the monthly is a convention sheet, the annual is the computed table |
| F5 | Replace the isha flag with IN-ISHA-17 and the 8-of-10 count, 18 degrees at Bengaluru and Srinagar |

## Honest limits

- F2: the exact generator of the Hanafi column's seasonal term is not identified. Every named
  shadow-family member leaves a worst of 6 to 8 min and at least 96 rows outside 1 min. The flag's
  class (rule, not artefact, not error) is decided, the generator is not.
- F3: one day cannot separate bfi.mk's angle rule from an interval rule. A second dated day closes it.
- F4: one month of the monthly sheet is held. A second month would confirm the ladder's step dates
  rather than infer them from one month's rungs.
- F5: the isha column alone was fitted. The asr school and the fajr line were taken from O1l-11r and
  not re-derived here.
