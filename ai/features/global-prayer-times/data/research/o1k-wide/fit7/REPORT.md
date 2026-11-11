# O1k Americas fit 7: Guatemala, Honduras, Suriname, Venezuela, Mexico

Five surfaces, five verdicts. Two confirm a held recipe to the minute, one refutes the isha rule
it was held as, one confirms the family and corrects the margins, one names a family on seven rows
and stops there.

## Method

Engine: adhan 4.4.6 at `~/athan-gitree/census/adhan-build/node_modules/adhan`, one process per job
with `TZ=<zone>` from the source. Dates are built from calendar parts, never from the clock. Each
column is computed at second resolution with rounding off, then rounded explicitly (nearest, up,
floor) and compared against the printed minute.

A second engine is used as the publisher-side check: the PrayTimes v2-family implementation at
`census/o1f-london/praytimes.cjs`. It earns its place below, because both mawaqit tables and the
Masjidbox table reproduce **exactly** on it at zero margins, which adhan does not.

Columns: `fajr`, `sunrise`, `dhuhr`, `asr`, `maghrib`, `isha`. `exact` counts days where the rounded
value is the printed minute, `within-1` days where it is off by at most one minute, `worst` the
largest whole-minute miss. A perfect table on a faithful engine scores `exact` 100 percent, and a
perfect recipe on a foreign engine scores a mean absolute error near 0.25 minutes, which is the
rounding floor.

Spans: none of these five surfaces publishes more than one year, so no span here is multi-year and
none can separate a frozen recipe from a shifted one. Guatemala and Honduras hold a full 2026,
Suriname 29 days of 2025, Caracas a 30-day Hijri month of 2026, Guadalajara 7 days of 2026. The
far-horizon surfaces named in FIT-RULES (muftyat.kz, KHGT, umqserv, muftiyat.kg, meteo.tn,
calendar_page2, BUTIN) are not among these five, and no network access was permitted to look for
more years on these pages.

---

## 1. Guatemala: literal MWL, confirmed

Mezquita Aldaawa Islámica de Guatemala, Zona 9. Fit at the brief's Guatemala City pair (14.6349,
-90.5069, `America/Guatemala`). The source publishes its own pair 14.610256, -90.515533, which is
what its table is computed at. 365 rows, 2026-01-01 to 2026-12-31.

**Recipe: Muslim World League, fajr 18°, isha 17° angle, Shafi asr, no margin on any column,
nearest minute.** Free fit on adhan at the city pair lands 17.98° fajr and 17.00° isha, and the
18.00/17.00 pair is inside that noise.

| Prayer | exact | within-1 | worst | MAE |
|---|---|---|---|---|
| fajr | 341/365 | 365/365 | 1 min | 0.26 |
| sunrise | 354/365 | 365/365 | 1 min | 0.25 |
| dhuhr | 347/365 | 365/365 | 1 min | 0.26 |
| asr | 265/365 | 365/365 | 1 min | 0.34 |
| maghrib | 348/365 | 365/365 | 1 min | 0.26 |
| isha | 352/365 | 365/365 | 1 min | 0.25 |

All six columns exact on 209 of 365 days, all six within one minute on every day. At the source's
own coordinate pair, zero-margin MWL reproduces fajr, sunrise, dhuhr, maghrib and isha on **365 of
365 days**, with asr at 263/365 and never more than a minute out. The five-column exact hit is the
proof: nothing is left for a margin to do.

The residue belongs to the engine. adhan's transit sits about one minute after this table's dhuhr,
so an adhan-side fit reports a phantom "-1 minute dhuhr margin" that disappears on the engine the
table was built with. The same is true of asr, where adhan takes the sun's declination at the day's
start and this engine takes it at a 13h seed, leaving adhan a seasonal skew of about ±1.2 minutes.

Seasonal amplitude: mean fajr 05:15 in January against 04:23 in July, a swing of 52 minutes, so the
recipe is being tested across the full annual declination range.

Iqamah, for the record: five fixed offsets from the athan, +10 fajr, +10 dhuhr, +10 asr, +5 maghrib,
+10 isha. No jamaah rule varies with the season.

**Verdict: confirmed exactly.** The held 18/17 reading is right. The earlier "MAE 0.01/0.04" is not
reproducible as a mean against either engine: on the engine this table was built with, the mean is
0.25 minutes, which is the rounding floor a table printed to the minute cannot go below.

---

## 2. Honduras: 18/18 with two five-minute cautions, confirmed

Centro Islámico de Honduras, San Pedro Sula. Fit at the brief's pair (15.5041, -88.0250,
`America/Tegucigalpa`), with a source pair of 15.490210, -88.032334. 365 rows, 2026.

**Recipe: fajr 18°, isha 18° plus 5 minutes, maghrib sunset plus 5 minutes, Hanafi asr, no other
margin, nearest minute.** Free fit: fajr 17.98°, isha 18.00°, isha interval model far worse (74.5
minutes, MAE 2.49), so the isha is an angle plus a fixed caution, as held.

| Prayer | exact | within-1 | worst | MAE |
|---|---|---|---|---|
| fajr | 351/365 | 365/365 | 1 min | 0.25 |
| sunrise | 354/365 | 365/365 | 1 min | 0.26 |
| dhuhr | 356/365 | 365/365 | 1 min | 0.26 |
| asr | 307/365 | 365/365 | 1 min | 0.29 |
| maghrib | 359/365 | 365/365 | 1 min | 0.25 |
| isha | 356/365 | 365/365 | 1 min | 0.26 |

All six exact on 265 of 365 days, all six within one minute on all 365. At the source pair, zero
margins plus the two five-minute additions reproduce five columns on 365 of 365 days, asr 308.

Both asr schools were computed against the table. Hanafi tracks it at 0.29 minutes mean. On the
fitting engine the Shafi column sits 61.5 minutes away and is exact on no day, the largest
single-column separation in this sweep, and the school is unambiguous.

Timezone: Honduras keeps UTC-6 all year. No transition falls inside the span, so nothing in this
fit depends on a DST rule, and the table needs no seasonal clock handling.

Seasonal amplitude: fajr 05:06 in January against 04:11 in July, a swing of 56 minutes.

**Verdict: confirmed exactly.** Zero-margin failure of every standard family in the screen
(Karachi nearest at 1.99 minutes, MML 18/18 at 12.18) is the same finding from the other side: the
mosque's two five-minute cautions are real and are not a calculation method.

---

## 3. Suriname: the isha is an interval, and the held reading is wrong there

Surinaamse Moeslim Associatie, Paramaribo (5.8664, -55.1668, `America/Paramaribo`). 29 rows,
2025-04-29 to 2025-05-27, transcribed from the May 2025 JPG sheet.

**Recipe: fajr 18°, Hanafi asr, maghrib sunset plus 3.5 minutes, isha = maghrib + 70 minutes, no
other margin, nearest minute, with the sunrise column carried half a minute later.** The isha is
the finding.

The condition is printed on the sheet. On all 29 rows, printed isha minus printed maghrib is exactly
70 minutes, one value, no exceptions. Fitted as an 18° angle the column sits at MAE 0.88 with a
residual that drifts linearly from +1.5 to −1.8 minutes across the month, which is the signature of
an interval being forced into an angle. Fitted as an interval it lands on the rounding floor.

| Prayer | exact | within-1 | worst | MAE |
|---|---|---|---|---|
| fajr | 26/29 | 29/29 | 1 min | 0.27 |
| sunrise | 27/29 | 29/29 | 1 min | 0.31 |
| dhuhr | 28/29 | 29/29 | 1 min | 0.21 |
| asr | 24/29 | 29/29 | 1 min | 0.28 |
| maghrib | 25/29 | 29/29 | 1 min | 0.26 |
| isha | 25/29 | 29/29 | 1 min | 0.26 |

All six exact on 17 of 29 days, all six within one minute on all 29.

Two details worth carrying. The sunrise column is the one column that is later than the computed
value by a systematic 0.6 minutes, which is round-up, the safe direction for the end of fajr. The
maghrib caution measures 3.5 minutes: at +3 the column sits at 0.37 mean error, at +3.5 at 0.26,
against a rounding floor of 0.25.

Limits: 29 near-equator days, where an isha angle and an isha interval are close to degenerate in
general, so the interval is argued here from the printed relation alone. One month, one year, no
second month to test stability against.

**Verdict: confirmed on fajr, asr school, maghrib and dhuhr, refuted on isha.** The surface is
18° fajr with a 70-minute isha interval, and the held 18/18 fails on that column. The earlier
"reproducing to 0.03" cannot have come from an isha angle fit: on the angle model the column sits at
0.88 mean error, and on the interval model at 0.26.

---

## 4. Venezuela: Umm al-Qura family and the 89-minute isha, confirmed for one month

Mezquita de Caracas (10.4806, -66.9036, `America/Caracas`). 30 rows, 2026-10-12 to 2026-11-10, one
Hijri month.

**Recipe: fajr 18.5° with a +0.75 minute caution, isha = maghrib + 89 minutes exactly, Shafi asr,
dhuhr +2, maghrib +2, asr +0.5, sunrise −0.5, nearest minute.**

The interval is printed and exact: printed isha minus printed maghrib is 89 minutes on all 30 rows,
one value. The family is confirmed from the other side too: screened at zero margins against six
standard families, Umm al-Qura ranks first at 1.04 minutes mean against 4.24 for 18/18 and 4.93 for
MWL.

| Prayer | exact | within-1 | worst | MAE |
|---|---|---|---|---|
| fajr | 28/30 | 30/30 | 1 min | 0.25 |
| sunrise | 27/30 | 30/30 | 1 min | 0.25 |
| dhuhr | 24/30 | 30/30 | 1 min | 0.31 |
| asr | 23/30 | 30/30 | 1 min | 0.37 |
| maghrib | 28/30 | 30/30 | 1 min | 0.26 |
| isha | 28/30 | 30/30 | 1 min | 0.26 |

All six exact on 15 of 30 days, all six within one minute on all 30.

The margins are real here, unlike in Guatemala and Honduras: measured against the publisher-side
engine, this sheet adds about +1.9 minutes to maghrib, +1.7 to dhuhr, +0.7 to asr, +0.75 to fajr and
takes 0.6 off sunrise. That is the same two-minute caution the earlier report found on three
columns, with the fajr caution now measured as well.

On the fajr angle: with the caution held at +0.75 minutes the free fit lands 18.48°, and with no
caution it lands 18.3°. The two are the same line over 30 days, and only the split between angle and
caution is unmeasured. The interval and the family are settled, and 18.5° is retained because it is
Umm al-Qura's stated value.

Timezone: Venezuela keeps UTC-4 all year. The span crosses no transition.

**Limits, stated plainly.** One month. Thirty days of October and November cannot distinguish a
recipe frozen across the year from one that drifts, and the seasonal amplitude is unmeasurable from
this span. Two claims survive the limit: the Umm al-Qura family ranking, and the 89-minute relation,
both of which are printed facts. The margins and the fajr angle are one
month's reading.

**Verdict: confirmed on the family and the exact interval, with the margins corrected and the
confidence capped at one month.**

---

## 5. Mexico: first dated Mexican rows name MWL, and say no more than that

Mezquita de Guadalajara Isa Ibn Maryam, Zapopan (20.6597, -103.3496, `America/Mexico_City`). Seven
rows, 2026-11-09 to 2026-11-15, Masjidbox.

Candidate family screen at zero margins, seven days:

| Family | mean MAE | columns exact |
|---|---|---|
| MWL 18/17 | 0.37 min | fajr 7/7, sunrise 7/7, dhuhr 7/7, maghrib 7/7, isha 7/7, asr 2/7 |
| 18/18 | 1.06 | no column at the floor |
| Egypt 19.5/17.5 | 1.75 | three columns off |
| Umm al-Qura 18.5/90 | 3.67 | isha far out |
| ISNA 15/15 | 3.96 | fajr and isha far out |
| Karachi 18/18 Hanafi | 9.03 | asr far out |

| Prayer | exact | within-1 | worst | MAE |
|---|---|---|---|---|
| fajr | 7/7 | 7/7 | 0 min | 0.24 |
| sunrise | 7/7 | 7/7 | 0 min | 0.25 |
| dhuhr | 7/7 | 7/7 | 0 min | 0.27 |
| asr | 2/7 | 7/7 | 1 min | 0.62 |
| maghrib | 7/7 | 7/7 | 0 min | 0.26 |
| isha | 7/7 | 7/7 | 0 min | 0.21 |

Five of six columns are exact on every row at zero margins, which is the same fingerprint as the two
mawaqit tables: a PrayTimes-family engine at MWL 18/17 with Shafi asr and no caution. The asr column
sits 0.6 minutes early with one minute of scatter, which seven rows cannot separate from a school
margin.

Treat this as a lead only. Seven days in November cannot establish a year, cannot bound a margin, and
cannot distinguish a frozen recipe from a seasonal one. What it does establish is that the first
dated Mexican data on record is a standard MWL surface with no mosque-specific caution, which makes
Mexico a cheap country to grade once a longer series appears.

**Verdict: lead. MWL 18/17, Shafi, zero margins, on seven rows.**

---

## Cross-cutting

**The publisher-side engine is how these tables are made.** Both mawaqit surfaces (Guatemala and
Honduras) and the Masjidbox surface (Guadalajara) reproduce to **365/365, 365/365 and 7/7** on five
of six columns when run on the PrayTimes v2-family engine at zero margins. For the two mawaqit
tables that is at the coordinate pair the mosque publishes. Guadalajara publishes no pair, so it
runs at the city centre and still hits seven for seven. The match is exact, column for column. It
also explains two artefacts that an adhan-only fit reports as mosque decisions: a phantom −1 minute
dhuhr margin, and a ±1.2 minute seasonal skew on asr. Neither is a margin. A fit that reports them
will over-specify every recipe it touches, and the earlier Americas report did exactly that when it
reported dhuhr at 0.0 and asr at 0.0 for Guatemala.

**Two of five surfaces carry isha as an interval.** Caracas prints maghrib + 89 on all 30 rows,
Paramaribo maghrib + 70 on all 29. Suriname's held 18/18 is the 70-minute interval in disguise.
Both are exact printed relations, so both are stronger evidence than any fit.

**Coordinates matter at the third decimal.** Guatemala's brief pair is 0.025 degrees in latitude and
0.009 in longitude from the pair the mosque publishes, and that shift alone moves a minute-rounded
fajr from 365/365 to 341/365 while the recipe stays identical. Fit at the published pair where one
exists, and expect a one-minute scatter if a city centre is all the brief gives.

## What this changes for the Americas record

- Guatemala: recipe stands, and the confidence rises from "fitted" to "reproduced exactly with no
  margin on any column".
- Honduras: recipe stands, likewise exact, with the two five-minute cautions confirmed as mosque
  decisions and not as a calculation method.
- Suriname: the isha rule changes from 18° to maghrib + 70, and the maghrib caution is 3.5 minutes.
- Venezuela: family and interval stand, margins are now measured on all six columns, confidence is
  one month.
- Mexico: first entry is a lead, MWL 18/17, seven rows.

Files: `gt-aldaawa-guatemala.json`, `hn-centro-islamico-san-pedro-sula.json`,
`sr-sma-paramaribo.json`, `ve-mezquita-de-caracas.json`, `mx-guadalajara-isa-ibn-maryam.json`.
Machinery: `fit.mjs` (engine wrapper, scoring, sweeps), `verify.mjs` (one job per run, writes the
job's JSON).
