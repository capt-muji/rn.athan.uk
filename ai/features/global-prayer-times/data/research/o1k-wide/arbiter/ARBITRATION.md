# Arbitration: the three conflicts the fit index flags

Workspace `$HOME/athan-gitree/census/o1k-wide/arbiter/`. Read-only against every other workspace.
Nothing written under `/tmp`, no subagents, no network. Engine adhan 4.4.6 from
`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`, second resolution, explicit rounding
per column, `TZ=Asia/Karachi` for Pakistan and no clock read anywhere.

Scripts written for this arbitration, kept beside this file:

| Script | Purpose |
|---|---|
| `pk-rederive.mjs` | Pakistan: residual per anchor year, per-year optima, fixed-convention scores, maghrib and clock columns |
| `pk-recipe.mjs` | Pakistan: the final recipe scan on the chosen anchor, column by column |
| `pk-anchor.mjs` | Pakistan: month-mean residual at seven candidate years |
| `pk-daylength.mjs` | Pakistan: printed day length against the computed horizon |
| `pk-lat.mjs` | Pakistan: latitude scan against day length |
| `pk-coord.mjs` | Pakistan: dawn shift across the district |

The three conflicts come from `fitindex/FIT-INDEX.md` §Conflicts. Each verdict cites the files it
rests on, and item 1 carries the numbers I re-derived.

---

## 1. Pakistan: the Islamabad chart's anchor and recipe

### What the two fits did

Both workspaces fitted the same artifact: `pk-mora-nizam-e-salat-chart-2016.pdf`, transcribed as
366 dated rows in `southasia/data/pk-islamabad-nizam-2026.json` (11 printed columns, 29 February
present). Both used the same point, 33.6844 N 73.0479 E. Both fitted the same six athan columns
and both set aside the jamaat columns and the printed sunset.

| | fit1 (`fit1/pk-fit.json`, `fit1/REPORT.md`) | southasia2 (`southasia2/REPORT.md`, `southasia2/data/pk-islamabad-method-fit.json`) |
|---|---|---|
| engine | adhan 4.4.6 | own NOAA solar engine (`southasia2/tools/solar.py`) |
| coordinates | 33.6844 / 73.0479 | 33.6844 / 73.0479 |
| date mapping | 2026, 29 February slot at 2028-02-29 | 2028 for every row |
| fajr | 17.95 deg, -0.5 min, floor (315/366 exact on its mapping), or 306/366 at 18.00, 0, floor | 18.00 deg nominal, least squares 18.12, rms 0.59 (0.89 at 18.00) |
| maghrib | computed sunset +6 min, nearest (303/366, worst 2) | printed sunset + 5 min flat, every row |
| asr | Hanafi +2 min, nearest (233/366, worst 1) | implied shadow 2.061, sd 0.03 |
| dhuhr | 13:00 / 13:15 clock, switches 15 Apr and 15 Oct | same, recovered independently |
| isha | 15-minute clock ladder, 11 distinct values | same, 19 transitions, one 30-minute step |
| anchor claim | tracks the current (2026) solar year | leap-anchored to 2028 |

`verify3/pk.mjs` line 28 repeats fit1's date mapping ("2026 is not a leap year ... compute it on
2028-02-29"), so the two confirmations of the chart share one anchor assumption.

### Re-derivation

The published point and the chart rows are fixed. What moves between the two readings is the
convention used to score a print truncated to the minute.

**Coordinates are not the difference.** Both used the same point. Measured sensitivity at this
latitude: 0.10 deg of latitude moves dawn 0.08 min, 0.10 deg of longitude moves it 0.40 min, and
the extremes of the district (33.55 to 33.75 N, 72.95 to 73.15 E) move dawn by at most 0.82 min.
The whole coordinate question is smaller than the print's own resolution and is identical in both
fits, so it explains nothing.

**The angle split is a rounding-convention split.** 0.05 deg of fajr is 0.24 min on 1 March at
18 degrees. The chart prints whole minutes by truncation, and its mean offset from adhan's 18-degree
dawn is -0.73 min on the 2028 mapping and -0.65 on the 2026 mapping. A 0.24-minute angle step and
a 0.5-minute margin therefore trade against each other row by row:

| fajr convention, 2028 mapping | exact | within 1 | worst |
|---|---|---|---|
| 18.00, 0, floor | 219 / 366 | 366 | 1 |
| 18.00, -0.5, floor | 258 / 366 | 366 | 1 |
| 17.95, -0.5, floor | 249 / 366 | 366 | 1 |

All three sit inside the same 18-degree family and all three reproduce every row within a minute.
The angle is not identifiable to 0.05 degrees from a one-minute print read through a different
solar engine. The record should carry 18.0 degrees nominal and the least-squares figure as its
uncertainty, which is what southasia2 says and what fit1's own "canonical 18.00" row says.

**Maghrib is one rule, stated against two references.** fit1 scores computed sunset +6 nearest.
southasia2 scores printed sunset +5 flat. I checked the chart's own columns: printed maghrib minus
printed sunset is +5 on all 366 rows, one value. The printed sunset runs 1.12 min after adhan's
computed sunset (southasia2's JSON), so "printed sunset +5" and "computed sunset about +6" are the
same rule. No disagreement.

**The anchor rests on an instrument that does not measure it.** fit1's evidence is a best exact
count per year: 260 (2024), 306 (2026), 258 (2028) as recorded in `fit1/pk-fit.json`. Re-running
that instrument over a coarse grid (angle, margin, rounding mode free per year) gives 277, 315, 276
and 274 for 2024, 2026, 2027 and 2028, each at a different angle, margin and mode. The comparison
therefore ranks truncation alignment at a different convention per year, and it cannot rank anchors.
The 306 is real and I reproduce it: fajr 18.00, 0, floor on the 2026 mapping gives 306/366 exact and
366/366 within 1. That number records how truncation lands under a different seasonal phase, and it
says nothing about the publisher's computation year.

The monthly residual was the sharper instrument, and it does not survive either:

| year | Jan | Feb | Mar | Apr | Jun | Sep | Oct | Dec |
|---|---|---|---|---|---|---|---|---|
| 2016 (leap) | -0.7 | -1.1 | -0.4 | -0.3 | -0.4 | -0.9 | -1.0 | -0.9 |
| 2024 (leap) | -0.7 | -1.1 | -0.3 | -0.2 | -0.4 | -1.0 | -1.0 | -0.9 |
| 2028 (leap) | -0.7 | -1.0 | -0.3 | -0.2 | -0.4 | -1.0 | -1.1 | -0.9 |
| 2026 | -0.6 | -0.7 | -1.0 | -0.9 | -0.4 | -0.6 | -0.7 | -0.7 |
| 2027 | -0.6 | -0.9 | -1.3 | -1.3 | -0.4 | -0.4 | -0.5 | -0.5 |

The leap years agree with each other because they share a phase. Any fixed month-day table does
that, so the agreement is true by construction and cannot identify the anchor. Against the 2028
mapping the 2026 mapping is flatter overall (fajr sd 0.33 against 0.46, day length 0.55 against
0.98), which points the other way from southasia2. The reason is that the residual carries the
ministry's own horizon convention as well as truncation: the printed day length runs 2.07 min longer
than adhan's on average, up to 3.1 min in February, and latitude cannot produce that (0.10 deg
moves day length 0.03 min). A one-day phase error is worth 1.18 min at fajr on 1 March, the same
order as the engine difference, so neither test separates the two.

**One structural claim falls.** southasia2 argues that a printed 29 February row "already forces a
leap basis". The row is byte-identical to 28 February on all 11 printed columns (I read both rows
directly). It is a duplicate of 28 February rather than a computed leap row, so it evidences nothing about
the computation year and the leap-basis inference loses its structural support.

### Verdict 1

The difference between the two workspaces is a **rounding-convention choice plus an anchor claim
that no available instrument measures**. Coordinates do not enter it, the two recipes agree, and the
same fajr convention lands within a minute on every row under either date mapping (maghrib, the
weakest column, stays within two).

**The chart's recipe, stated once:**

- fajr 18.0 degrees (Karachi/UISK family), no dawn safety margin, the minute truncated.
- sunrise and sunset on the solar horizon, the printed day running about 2 min longer than the
  computed horizon (sunrise 0.9 min early, sunset 1.1 min late).
- maghrib = printed sunset + 5 min exactly, 366 of 366 rows.
- asr Hanafi shadow factor 2 at +2 min.
- dhuhr a two-phase clock, 13:00 from 15 October to 14 April and 13:15 from 15 April to
  14 October.
- isha a 15-minute clock ladder, 11 distinct values and 19 transitions, one of them 30 minutes
  (30 September to 1 October) and one upward while the sun is still falling (20 December).
  No angle reproduces it. The best single angle is 31 of 366 exact with a worst miss of 26 min.
- carrier: the chart's own 366-row month-day table, 29 February being a copy of 28 February.

**Anchor.** Publish no computation-year claim. Score the fit on the leap-calendar form of the
template (2016, 2024 and 2028 all return the same residuals, 2028 being the form the table
presents) and say in the row that the choice is a scoring convention that makes no claim about
the year the ministry computed. `fit1/REPORT.md`'s "tracks the 2026 solar year" and `southasia2/REPORT.md`'s
"leap-anchored to 2028" should both leave the record.

Record grade unchanged at provisional: one template, one year, whatever the anchor.

---

## 2. Indonesia: two national lines

### What each line is

| | Kemenag | Muhammadiyah |
|---|---|---|
| Publisher | Bimas Islam, Ditjen Bimas Islam, Ministry of Religious Affairs (state) | Majelis Tarjih dan Tajdid PP Muhammadiyah (mass organisation) |
| Surface | `bimasislam.kemenag.go.id/api/v1/public/prayer-times`, one row per regency per date | `api-khgt.muhammadiyah.or.id/api/sholat/schedule`, POST lat/lng/date, keyless, any coordinate |
| Span served | 2026-01-01 to 2026-12-31 and nothing else, `source: precompute:v1`, `calculated_at: 2026-06-03` (`indonesia/REPORT.md` lines 26 and 60-63) | 2025 to 2035 (`indonesia/REPORT.md` line 28) |
| Tier | authority, state | authority, second national body |
| Recipe | fajr 20 deg +2 min, isha 18 deg +2 min, the +2 being the printed ihtyati | fajr 18 deg, isha 18 deg, ceil plus 1 min |
| Evidence | 510 regencies: fajr 1,015/1,020, isha 1,007/1,020 exact. Six highland regencies at 21/19: 12/12 both (`fit10/id-highlands.json`, `fit10/REPORT.md` §1) | 1,116 rows over 6 years, 3 cities, 2 months per year, plus Banda Aceh 2026+2027 and its 730 rows (`deep3/muhammadiyah-deep.json`) |
| Grade on the night's rule | provisional, one published cycle | A, decade |

The Muhammadiyah decade numbers, from `deep3/REPORT.md` §1 and `deep3/muhammadiyah-deep.json`:

- fajr 1,084 of 1,116 exact (97.1 per cent), isha 1,109 (99.4 per cent), both 1,116 of 1,116
  within one minute, worst miss one minute.
- Per-year exact 178 to 186 of 186 in every sampled year from 2025 to 2035, the wobble being the
  leap cycle moving the sampled dates rather than drift.
- The margin the rule needs at 18 degrees and ceil: 1.000 min in 2025 and 1.017 in each of 2027,
  2029, 2031, 2033 and 2035, two seconds of wander across the decade.
- Three latitudes, 6.2 S to 2.6 S, one cell. A fourth anchor at Banda Aceh holds unchanged.
- Kemenag's own national pair, measured by the `indonesia` pass over 365 days and five cities, is
  20/18 with the +2 min ihtyati on both twilights (`CONSOLIDATION.md` O1k-1).

The two lines differ by geometry, 20 degrees against 18 at fajr, and the gap is constant: 7.77,
7.82, 7.78, 7.83, 7.77 and 7.84 min mean over the six sampled years, spread 7 to 9 minutes from
the rounding on both sides (`deep3/REPORT.md` §1). Measured coordinate to coordinate the gap is
wider than the model figure: 7.99 min at Jakarta, 7.87 at Surabaya, 8.48 at Jayapura on 2026, and
7.9 to 8.8 across cities and years, because SIHAT and KHGT snap a city to slightly different points
(`verify3/khgt.json`, `kemenagGap`, and `verify3/REPORT.md` verdict 2). The flat 7.8 is a model-to-model
number and the record must not use it as the served gap.

### What app-side question each line answers

- **Kemenag answers what the state tells a citizen to pray by.** It is the ministry's own table,
  the one a mosque registered with the ministry follows, and its 2-minute margin is a deliberate
  ihtyati that prints ahead of the astronomical time. It is one published cycle, precomputed for a
  single year, so its evidence is one year whatever its authority.
- **Muhammadiyah answers what the organisation's own mosques and schools use.** It is the second
  national body's hisab line, computed live for any coordinate, and it is the only Indonesian line
  with a decade of served output to test.
- **Neither answers the mosque layer.** Istiqlal, the national mosque, runs AlAdhan ISNA 15/15 on
  its own clock, 19 minutes later at fajr and 15 earlier at isha than Kemenag (`CONSOLIDATION.md`
  O1k-1). That is a third object and it displaces neither national line.
- **The highland step belongs to Kemenag alone.** Six regencies at or above 1,786 m print 21/19,
  Deiyai at 1,718 m prints 20/18, and no seventh member exists in 516. Muhammadiyah prints plain
  18/18 at Puncak Jaya's own 3,396 m, so the step is a publisher policy and never an elevation
  correction (`fit10/REPORT.md` §1, `sea2/REPORT.md` §2).

### Recommendation for ratification

1. **Primary: Kemenag**, 20 deg fajr and 18 deg isha with the +2 min ihtyati, and the six
   highland regencies as a named regional exception (this is D8 option a in
   `decisions/DECISIONS.md`, recommended there on the same 12/12 evidence). Grade stays
   provisional, one cycle.
2. **Named second line: Muhammadiyah**, 18/18 at ceil plus 1 min, grade A on 1,846 rows across a
   decade and four anchors.
3. **The two never merge and the 21/19 step is never derived from elevation.** The record carries
   them as one country row naming Kemenag as primary and one named line section for Muhammadiyah,
   the shape the table already uses for Norway's two lines.
4. **App-side**, the default for an Indonesian coordinate is Kemenag and the alternation names
   Muhammadiyah. A city Kemenag does not serve takes the Muhammadiyah line with the method named,
   never a synthesised blend.

Kemenag is the primary because the product's promise is the authority's timetable and the state
line is the one a citizen is held to. The owner's own rule makes grade and tier independent
(T-667 #6943, `decisions/DECISIONS.md` R1), so a provisional primary above an A second line is
coherent: Muhammadiyah's decade tests Muhammadiyah's arithmetic and does not transfer to the
ministry's constants.

**What is genuinely the owner's call.** Which line the app presents by default is a
product-promise decision, because "official" has to mean one body. I recommend Kemenag with
Muhammadiyah named beside it. If he prefers the organisation's line as the default, the swap costs
the record nothing: both objects stand independently and neither depends on the other's grade.

---

## 3. Niger: the grade against the frozen-generation precedent

### The object

Niamey is fitted in `deep2/ne-deep.json` on 2,556 dated rows, 2025-01-01 to 2031-12-31, from the
BUTIN perpetual-calendar page. One recipe reproduces it: fajr 18 deg round, 2,370 of 2,556 exact
and 2,556 of 2,556 within one minute, mean signed error -0.005 min. Sunrise, dhuhr and maghrib
sit at the solar horizon or transit, asr at shadow factor 1, and isha equals printed maghrib plus
75 minutes on 2,556 of 2,556 rows.

`c34-niger` widens the same object to eight regions and repeats it: 56 region-years, 20,448 dated
rows, every column 100 per cent within one minute, bias 0.00 on all six columns, and a free fajr
angle fit returning 17.99 to 18.01 degrees in every one of the 56 region-years
(`c34-niger/REPORT.md` §2).

### Why the record calls it frozen

`deep2/ne-deep.json` `frozen`: the largest spread of any month-day and column across the seven
served years is one minute, histogram 1,651 slots identical and 539 one minute apart out of 2,190.
`fitindex/FIT-INDEX.md` reads that as a reprint, labels the span `frozen-reprint`, and closes the
A path with "Niger (1,651 of 2,190 slots identical across seven years)".

### The portal computes rather than reprints

Three facts, all from the capture and the served values:

1. `c34-niger/data/ne_portal_capture.html` line 850 defines
   `calculHoraires(a, b, c, d, e, f, g, h)`, one solar routine. Lines 925 to 927 set the
   arguments to literals, `var e = 1; var f = 18; var g = 75;`, and the call sites at lines 951
   and 1027 pass `anneeSelectionnee` or `an` into the first slot. The year is a date parameter
   fed to the same function. There is no year branch, no per-year table and no per-year constant
   anywhere in the generator.
2. The served years are not byte-identical. I read the seven Niamey files directly: 15 January
   prints fajr 06:03 in 2028 against 06:04 in the other six, and 15 January dhuhr prints 13:00 in
   2026, 2027, 2028 and 2030 against 13:01 in 2025, 2029 and 2031. Across all month-days, 268 of 365
   fajr values are identical over the seven years and the 97 that differ do so by one minute,
   spread across the years with 2028 the most frequent outlier, which is where the year-to-year
   solar drift crosses a minute boundary.
3. The three independent lines the `c34-niger` report states (source, fit, drift) all describe a
   computation, and a relabelled reprint would contradict the served values.

A reprint has one value per slot. This object has 539 slots that move with the year. The FIT-INDEX
label is wrong on its own definition: its span vocabulary separates `frozen-reprint` (a reprint, so
year 2 is nominal) from `frozen-recomputed` (one recipe and the years are recomputed, a genuine
multi-year test), and Niger is the second.

### The case that the A stands

1. The precedent's trigger is byte-identical editions. R2 (T-668 #6986, `decisions/DECISIONS.md`)
   says "Byte-identical editions across years are one computed generation". Niger publishes no
   editions and its years are not identical, so the trigger is not met.
2. The owner has already ruled the neighbouring case. D3 puts Algeria outside the precedent for
   exactly this reason: "1448 is a fresh computation rather than a reprint: no Gregorian cell is
   shared with 1447 and the printed differences track the sun to 1.15 minutes". Niger's seven years
   are a fresh computation on every request and their differences track the sun by 0 to 1 minute.
   Consistency with Algeria carries Niger across.
3. The evidence itself is strong. One recipe, 20,448 rows, eight regions, seven years, 100 per cent
   within a minute, zero bias, and a free angle returning 18.00 in all 56 region-years. That is more
   evidence than most A rows on the night carry.
4. The alternative turns the grade on the publisher's mechanism rather than on the evidence. A
   compiler who recomputes on demand and states the method is treated worse than one who reprints a
   computed table with a new year on it.

### The case that it falls to provisional

1. R2's operative clause is "one computed generation ... never lift provisional to A, however many
   years they span". Niger's seven years are literally one computed generation of one function.
2. The year test cannot fail. There is no year term, so no served year can contradict another, and
   seven samples of one algorithm measure the algorithm's arithmetic. A test that cannot fail is not
   the distinct-year evidence the ruling asks for.
3. An annual table is a publication event: the publisher asserts these times for this year. A query
   parameter is not an assertion about a year. The ruling counts fitted evidence years, and a year
   the publisher never issued is a render rather than an evidence year.
4. It sits beside Maldives, which was ruled one generation because a yearless table returns the same
   slot for 2027. Niger is also a calculator. That its output moves a minute with the date is
   arithmetic, not a second year of publisher practice.

### Verdict 3

The label is wrong whichever way the grade goes, and the correction is mechanical: Niger's span
verdict is `frozen-recomputed`, so the FIT-INDEX may not cite it as a precedent of the reprint
class. The grade itself turns on one question the record does not answer, and the answer is
the owner's because it defines what "distinct year" means in his ruling.

On the criterion he has already applied to Algeria (the values are recomputed and they track the
sun), A is the consistent reading, and I would keep A with the provenance caveats `c34-niger`
already states (BUTIN is a clerical compiler rather than the Conseil Islamique, and the gate
proves arithmetic alone, with no sighting practice behind it). If he rules that only separately issued years count, Niger
drops to provisional and the drop is a correction of the evidence class, not of the fit.

**The question for the owner, one line:**

> Does a year the portal computes on demand count as a fitted evidence year, or only a year the
> publisher separately issued?

---

## Summary

| Id | Verdict | One line |
|---|---|---|
| PK anchor | One chart, one recipe, scored under a convention | One chart, one recipe: Karachi/UISK 18 deg truncated, maghrib printed sunset +5, Hanafi +2, dhuhr and isha clocks, 366-row month-day template, no anchor claim |
| Indonesia | Two lines, one primary | Kemenag 20/18 +2 ihtyati (provisional, 2026) as primary with the six-regency 21/19 exception, Muhammadiyah 18/18 +1 (A, 2025-2035) named beside it, never merged |
| Niger | Label corrected, grade to the owner | The years are recomputed, so the reprint label fails. Keep A on the Algerian criterion or drop to provisional if only issued years count |
