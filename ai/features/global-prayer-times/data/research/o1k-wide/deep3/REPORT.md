# deep3: four deep-span fits

Workspace `$HOME/athan-gitree/census/o1k-wide/deep3/`. Raw responses in `captures/`, normalized rows
in `data/`, one JSON per job at the workspace root, scripts in `scripts/`.

**Missing input.** `$HOME/athan-gitree/census/o1k-wide/FIT-RULES.md` does not exist on this machine
(searched the whole census tree). The discipline applied here is the one the brief states and the
one `fit1/lib.mjs` implements: adhan 4.4.6 from `census/adhan-build/node_modules/adhan`, second
resolution taken from the solar core and rounded explicitly per column, no clock reads (every date
is constructed), nothing written under `/tmp`, captures flushed as they arrive, no subagents.

Two mechanics worth naming, because both change numbers:

- adhan returns a UTC instant. Every fit here converts it to wall-clock in the target IANA zone with
  `Intl`, day-aware, so a Reykjavik sunset printed at 00:04 belongs to the next day (+86400 s) rather
  than to 00:04 of the same morning. Without that, Iceland and Estonia's summer isha cross midnight
  and every residual reads 1,440 minutes.
- The margin is folded in before rounding. Adding it afterwards is a different rule:
  `ceil(x + 1.0)` and `ceil(x) + 1` differ on the knife-edge days, and the knife edge is where a
  printed table lives.

Process TZ is `UTC` and the zone conversion is explicit. Second resolution throughout, and no printed
value is compared against a `Date` that has already lost its seconds.

---

## Job 1: Muhammadiyah KHGT, the decade

36 captures (3 coordinates x 6 years x January + July), 1,116 dated rows.
Harvest: `scripts/harvest-khgt.mjs`, one POST per city-month, each response flushed to `captures/`.
Coordinates as briefed: Jakarta -6.2088/106.8456 (elev 12 m), Surabaya -7.2575/112.7521 (8 m),
Jayapura -2.5916/140.6690 (22 m, UTC+9). The service auto-detects elevation from the coordinate and
reports it in every response, and the values are stable across all six years.

### The recipe

**18.0 degrees on both twilights, ceil to the minute, plus one minute of safety.** One cell, fitted
jointly over all 1,116 rows.

| column | exact | within 1 | worst | mean residual |
|---|---|---|---|---|
| fajr | 1,084 / 1,116 (97.1%) | 1,116 (100%) | 1 min | -0.03 |
| isha | 1,109 / 1,116 (99.4%) | 1,116 (100%) | 1 min | 0.00 |

The held reading of 18/18 with +1.5 reproduces exactly if the margin is read against nearest or
floor rounding: `round(x + 1.5)` scores 1,102/1,116 on fajr and 1,102/1,116 on isha. At ceil the same
rule is written `ceil(x + 1.0)`. The two are the same threshold, and only the rounding convention
differs. Fitted freely, the grid puts fajr at 17.9 deg and isha at 18.0 deg, both with ceil and
about +1.0 min, which is the same equivalence class. **So the pair is 18/18 at both twilights, which
corrects the record's 18/17 isha, and the safety margin is one minute at ceil, 1.5 at nearest.**

### Does the pair hold to 2035?

Yes. The same cell, no year-specific allowance:

| year | rows | fajr exact | fajr within 1 | isha exact | isha within 1 |
|---|---|---|---|---|---|
| 2025 | 186 | 183 (98.4%) | 186 (100%) | 184 (98.9%) | 186 (100%) |
| 2027 | 186 | 180 (96.8%) | 186 (100%) | 186 (100%) | 186 (100%) |
| 2029 | 186 | 182 (97.9%) | 186 (100%) | 183 (98.4%) | 186 (100%) |
| 2031 | 186 | 178 (95.7%) | 186 (100%) | 186 (100%) | 186 (100%) |
| 2033 | 186 | 183 (98.4%) | 186 (100%) | 185 (99.5%) | 186 (100%) |
| 2035 | 186 | 178 (95.7%) | 186 (100%) | 185 (99.5%) | 186 (100%) |

The exact-count wobble is the leap cycle moving the sampled dates across the solar year. It is not
drift. The sharper test is the margin each year needs to print every row correctly at 18 deg with ceil: it
sits at **1.000 min in 2025, 1.017 in 2027, 1.017 in 2029, 1.017 in 2031, 1.017 in 2033, 1.017 in
2035**, a total wander of two seconds. A computed rule behaves exactly this way. In 2029 and 2035
one day sits a second on the wrong side of the knife edge, which is why those two years show a
negative window width and 178/186 rather than 182.

By coordinate the same cell gives fajr 364/372 at Jakarta (97.9%), 359/372 at Surabaya (96.5%),
361/372 at Jayapura (97.0%), and isha 370, 370, 369 of 372. One recipe spans 6.2 S to 2.6 S.

### The Kemenag line across the decade

Kemenag's printed line, measured in the `indonesia` pass, is 20 degrees with ceil and +2.0 min. Run
that model against what KHGT prints: the stored delta is Kemenag minus KHGT, so a negative value is
KHGT printing later. Every value below is read as minutes KHGT sits later.

| year | mean | min | max | Jakarta | Surabaya | Jayapura |
|---|---|---|---|---|---|---|
| 2025 | 7.77 | 7 | 9 | 7.81 | 7.79 | 7.73 |
| 2027 | 7.82 | 7 | 9 | 7.90 | 7.82 | 7.73 |
| 2029 | 7.78 | 7 | 8 | 7.77 | 7.82 | 7.74 |
| 2031 | 7.83 | 7 | 9 | 7.90 | 7.85 | 7.74 |
| 2033 | 7.77 | 7 | 8 | 7.77 | 7.84 | 7.71 |
| 2035 | 7.84 | 7 | 9 | 7.90 | 7.85 | 7.77 |

KHGT prints 7.8 minutes later than the ministry's line. The divergence is constant to a tenth of a
minute over ten years and three latitudes.
It is a geometry difference between 18 and 20 degrees, so no editor can make it drift: the spread
within any year is 7 to 9 minutes and comes from the minute rounding on both sides. Indonesia's two
national lines are now dated output from 2025 to 2035, and the gap between them does not move.

### Seasonal amplitude at the three latitudes

Modelled from the fitted 18 deg line over a full year, plus the printed January and July means:

| city | lat | Jan-Jul fajr | Jan-Jul isha | year swing fajr | year swing isha |
|---|---|---|---|---|---|
| Jakarta | 6.21 S | -16.7 min | +23.5 min | 39.9 min | 35.1 min |
| Surabaya | 7.26 S | -20.2 min | +26.9 min | 43.2 min | 37.2 min |
| Jayapura | 2.59 S | -4.9 min | +11.6 min | 33.6 min | 32.4 min |

The amplitude is not monotone in latitude: it peaks at Surabaya, the most southerly of the three,
because the swing depends on how far the solstice declination reaches past the observer's latitude.
Jayapura, 2.6 degrees from the equator, has the smallest January-July gap (5 minutes) but only a
modestly smaller annual span than Jakarta, because its extreme sits at the December solstice rather
than at either sampled month.

### The rest of the column set

Same 1,116 rows, best cell per column: sunrise `ceil(x - 1.4)` 93.6% exact, dhuhr `floor(x + 2.0)`
98.9%, asr Shafi `floor(x + 1.9)` 97.9%, maghrib `nearest(x + 1.9)` 91.9%. All four are 100% within
one minute. The +/-2 minute structure is one safety margin of about 2 minutes on every column, with
sunrise carrying the elevation horizon dip (about -1.4 min at 12 m) instead.

---

## Job 2: Hong Kong, the Trustees' sheet

Two pages of one printing, both yearless, dated ~2000 by the reprints. Page 2 (the masjid/jama'ah
sheet) is on record as 60 sampled days in `china/data/`. Page 1 (the astronomical sheet) is image
only. The two crops in `china/captures/` cover 1 January to 24 May and were transcribed here into
`hk-deep.json`, 25 days, 9 columns. Every 2000 date is constructed from the calendar.

### The recipe against page 2

| column | recipe | exact | within 1 | worst |
|---|---|---|---|---|
| fajr | 18.4 deg, truncate | 7/60 | 17/60 | 9 min |
| dhuhr | transit + 5 | 0/60 | 0/60 | 49 min |
| asr | Shafi + 1 | 0/60 | 0/60 | 83 min |
| maghrib | sunset + 3 | 0/60 | 0/60 | 3 min |
| isha | sunset + 83 | 0/60 | 0/60 | 12 min |

**No. The masjidal recipe does not reproduce the Trustees' print.** Page 2 is not an angle table at
all. Its own intervals, measured over the 60 days:

| printed interval | range | median |
|---|---|---|
| fajr before sunrise | 80 to 81 | 80 |
| maghrib after sunset | 4 to 5 | 5 |
| isha after maghrib | 80 to 90 (one 90) | 80 |
| isha after sunset | 84 to 95 | 85 |
| dhuhr after transit | 23 to 54 | 37 |
| asr after the Shafi time | 47 to 84 | 62 |
| noon after transit | 0 to 1 | 0 |
| sunrise after geometric sunrise | 0 to 1 | 0 |

So page 2 prints fajr at a fixed sunrise - 80, maghrib at sunset + 4/+5, isha at maghrib + 80, dhuhr
at a fixed 13:00 clock, and asr at something 47 to 84 minutes after the Shafi time. Inverting the
fajr column to an angle gives 16.66 to 19.28 degrees across the year (mean 18.24): the fixed interval
mimics an angle without being one. Inverting isha gives 17.67 to 22.10 (mean 19.46), which is not a
number either.

The asr column is the surprise: page 2's asr **is page 1's Hanafi column**, identical on all 25
overlapping days, and adhan's Hanafi time plus 2 minutes nearest reproduces it 43/60 exact and 55/60
within one. So the masjid sheet publishes the Hanafi asr. Page 1's Shafi column is a separate line on
the astronomical page.

### The recipe against page 1

| column | model | exact | within 1 | worst |
|---|---|---|---|---|
| fajr | 18.4 deg, truncate | 0/25 | 17/25 | 3 min |
| isha | sunset + 83 | 0/25 | 0/25 | 16 min (mean 9.8 early) |
| dhuhr | transit + 5 | 0/25 | 0/25 | 11 min |
| asr Shafi | Shafi + 1 | 0/25 | 0/25 | 6 min |
| asr Hanafi | Hanafi + 1 | 0/25 | 13/25 | 4 min |
| maghrib | sunset + 3 | 0/25 | 0/25 | 8 min |
| sunrise | geometric, nearest | 11/25 | 24/25 | 2 min |
| noon | transit, nearest | 18/25 | 25/25 | 1 min |
| sunset | geometric, nearest | 11/25 | 23/25 | 2 min |

Page 1 is the astronomical page and it does use angles, and those angles are not the feed's:

- fajr inverted per day runs **17.90 to 19.01 degrees, mean 18.49**, drifting up through the spring.
  That brackets the feed's fitted 18.4 and is nowhere near the 15 to 17 band. The drift is the
  print's own one-minute rounding: at 22 N the twilight is 76 to 89 minutes long, so one printed
  minute is worth about 0.15 degrees.
- isha inverted per day runs **20.73 to 21.96, mean 21.26**. Page 1's isha is an angle of about 21.3,
  which is 9.8 minutes later than the feed's fixed sunset + 83.
- dhuhr is noon + 15 minutes on all 25 days, which is the sheet's own N.B.: "ZUHR WAQT STARTS 15
  MINUTES AFTER (ZAVAL) NOON TIME".
- asr Shafi is adhan's Shafi + 5 minutes nearest, 22/25 exact and 24/25 within one. asr Hanafi is
  adhan's Hanafi + 2 minutes nearest, 21/25 exact.
- maghrib is sunset + 5 to 8 (median 6), and isha is maghrib + 82 to 93.

### Do the two surfaces agree on the rule?

**Only on fajr.** The scorecard, both pages against the fitted feed rule:

| column | masjidal feed | page 1 (astronomical) | page 2 (masjid) |
|---|---|---|---|
| fajr | 18.4 deg, truncating | angle, 17.9 to 19.0, mean 18.5 | sunrise - 80 |
| dhuhr | transit + 5 | noon + 15 | fixed 13:00 |
| asr | Shafi + 1 | Shafi + 5 and Hanafi + 2 | Hanafi |
| maghrib | sunset + 3 | sunset + 5 to 8 | sunset + 4 to 5 |
| isha | sunset + 83 | angle, mean 21.3 | maghrib + 80 |

The feed's fajr matches page 1's angle to within the print's rounding, and 18.4 degrees at Kowloon
models a 76.0 to 88.4 minute sunrise interval against the sheet's 80 to 81, so the fixed interval and
the angle land within four minutes of each other all year. The feed's isha interval matches page 2's
(83 against 84 to 85) and misses page 1's by ten minutes. The feed's dhuhr and maghrib match neither
page.

Hong Kong is therefore three constructions stacked on one printing: an astronomical page built on
angles, a masjid sheet built on fixed intervals and clock conventions, and a platform feed that takes
its fajr from the first page, its isha from the second, and computes dhuhr, asr and maghrib from
solar time in a way neither page does. **"The same recipe" is the wrong question for this surface.
The right object is a per-column table of which page each column comes from.** The one solid
cross-era confirmation stands: fajr at 18.4 degrees, measured 26 years apart.

---

## Job 3: Iceland, three years

**The three-year set did not exist on disk.** `europe/` holds 2025 and `nordics2/` holds 2027, 365
days each for two cities, and no 2026 anywhere. The API serves any date, so 2026 was captured fresh
into `captures/is-felagmuslima-{Reykjavik,Akureyri}-2026.jsonl` (730 rows, zero misses, raw responses
kept as returned). Six city-years, 2,190 rows, Reykjavik 64.1466/-21.9426, Akureyri 65.6835/-18.1002,
`Atlantic/Reykjavik`.

### The recipe

**fajr 14.2, isha 14.0, with the high-latitude portion taken from the angle itself**: fajr is
`max(angle crossing, sunrise - (14.2/60) x night)`, isha is `min(angle crossing, sunset + (14.0/60) x
night)`, night being previous sunset to sunrise and sunset to next sunrise. That single rule covers
both regimes: the plain crossing for eight months, and the portion substitution for the four weeks
either side of midsummer when the sun never reaches 14 degrees below the horizon.

At 14.2 / 14.0 the print is reproduced **within one minute on every one of the 2,190 rows**, both
cities, three years:

| city-year | fajr exact | fajr within 1 | isha exact | isha within 1 |
|---|---|---|---|---|
| Reykjavik 2025 | 271 (74.3%) | 365 (100%) | 265 (72.6%) | 365 (100%) |
| Reykjavik 2026 | 296 (81.1%) | 365 (100%) | 260 (71.2%) | 365 (100%) |
| Reykjavik 2027 | 278 (76.2%) | 365 (100%) | 264 (72.3%) | 365 (100%) |
| Akureyri 2025 | 266 (72.9%) | 365 (100%) | 267 (73.2%) | 365 (100%) |
| Akureyri 2026 | 268 (73.4%) | 365 (100%) | 265 (72.6%) | 365 (100%) |
| Akureyri 2027 | 242 (66.3%) | 365 (100%) | 269 (73.7%) | 365 (100%) |

The residual never exceeds one minute in either direction, and its spread is an engine difference
rather than a parameter one: at plain floor rounding the same pair is exact on only 37 to 50% of rows
with a mean of -0.5 minutes, so the site's own ephemeris runs about half a minute ahead of adhan's
and the half-minute allowance recovers the rest. A free grid fit returns 14.2 and 14.0 exactly,
which is the strongest form the result can take: the fit does not move the held pair.

### The substitution window

| city | 2025 | 2026 | 2027 |
|---|---|---|---|
| Reykjavik | 158 days, 04-04 to 09-08 | 158 days, 04-04 to 09-08 | 159 days, 04-04 to 09-09 |
| Akureyri | 166 days, 03-31 to 09-12 | 167 days, 03-31 to 09-13 | 167 days, 03-31 to 09-13 |

The window opens 17 days before the angle crossing fails: on 10 April 2025 the 14.2 degree
crossing still exists at 03:32 but the site prints 03:59, which is sunrise minus one quarter of the
night. That is the `max` in the rule doing its work, and it is why a model that only substitutes when
the crossing is undefined would miss the first 17 days of the window.

### The December +90 display rule does not exist

December isha minus maghrib, all December days, all six series:

| city | 2025 | 2026 | 2027 |
|---|---|---|---|
| Reykjavik | 157 to 169 min (mean 165.4) | 156 to 169 (165.4) | 157 to 169 (165.5) |
| Akureyri | 174 to 194 (188.2) | 174 to 194 (188.0) | 174 to 194 (188.0) |

Zero days at 90 in any series. December is the deepest night of the year and the 14.0 degree isha is
the largest gap of the year, so there is nothing for a display rule to rescue: the pure angle covers
December cleanly and the held clause is redundant. **Drop it from the recipe.** The +90 in the record
is most likely a description of the summer substitution misread as a winter one. The summer
substitution is 14/60 of the night, about 40 minutes at the solstice, against the 90 the record
carries.

### Does the Akureyri asr defect appear in the capital?

**No.** Printed asr minus printed dhuhr, and printed asr minus the Shafi time:

| series | asr at or before dhuhr | minimum separation | Jan asr vs Shafi | Nov asr vs Shafi |
|---|---|---|---|---|
| Reykjavik 2025 | 0 days | 17 min (2025-12-29) | -11.9 | +9.2 |
| Reykjavik 2026 | 0 days | 17 min (2026-12-27) | -12.5 | +9.4 |
| Reykjavik 2027 | 0 days | 17 min (2027-12-27) | -12.3 | +9.1 |
| Akureyri 2025 | 19 days | -1 min (2025-01-01) | -20.9 | +12.5 |
| Akureyri 2026 | 20 days | -1 min (2026-01-01) | -22.0 | +12.9 |
| Akureyri 2027 | 19 days | -1 min (2027-01-01) | -21.6 | +12.6 |

The generating error is present at both cities and is one thing: the asr column is Shafi in
form but built from a declination that lags the date by about two days, so it prints before the Shafi
time at the winter solstice (12 minutes at Reykjavik, 21 at Akureyri) and after it in November (9 and
12.5), crossing zero between June and July. Substituting the declination of D-2 for D cuts the mean
asr error from 4.7 to 2.4 minutes at Reykjavik and from 6.7 to 4.1 at Akureyri
(`scripts/diag-iceland-asr.mjs`).

Because the asr altitude sits within a tenth of a degree of the noon altitude at 65.7 N in late
December, the error that costs 21 minutes at Akureyri puts asr one minute before dhuhr on 19 or 20
days. At Reykjavik the sun climbs 1.5 degrees higher and the same error leaves 17 minutes of
separation at its worst. **The defect is not a capital-city defect, and it is not independent of the
Akureyri one. It is the same sweep, resolved by latitude.**

The years are computed rather than copied: comparing the same calendar day in 2025 and 2027, fajr is
identical on 82 of 365 days at Reykjavik, differs by one minute on 207, and by more on 76.

---

## Job 4: Estonia, two years, one engine

`europe/data/ee-eic-both-cities-2026-2027.json`, Tallinn and Tartu, 2026 and 2027, 1,460 rows. The
scheme is the one the site publishes and the prior pass ran headlessly: 15/15, asr shadow 1,
sunrise/sunset at -0.833, dhuhr and maghrib at the solar instant, fajr = the 15 degree crossing
guarded by sunrise minus one quarter of the night (15/60) and clamped to 45 to 120 minutes when the
crossing fails, isha = maghrib + 90 fixed in May through August and the 15 degree crossing elsewhere
with a per-month ceiling (180 in April and September, 220 in March and October, 240 otherwise) and a
magnitude of 90 minutes as the fallback.

Reimplemented here from adhan's solar core rather than the site's own code:

| city-year | fajr exact | within 1 | isha exact | within 1 | rule labels agree |
|---|---|---|---|---|---|
| Tallinn 2026 | 361 (98.9%) | 365 (100%) | 346 (94.8%) | 365 (100%) | 365/365 |
| Tallinn 2027 | 359 (98.4%) | 365 (100%) | 357 (97.8%) | 365 (100%) | 365/365 |
| Tartu 2026 | 341 (93.4%) | 365 (100%) | 343 (94.0%) | 365 (100%) | 365/365 |
| Tartu 2027 | 342 (93.7%) | 365 (100%) | 343 (94.0%) | 365 (100%) | 365/365 |

Sunrise, dhuhr and maghrib land 94 to 99% exact and 100% within one. **One parameter set, two years:
yes.** The independent implementation also classifies every day into the same rule as the publisher's
own `fajrRule` and `ishaRule` labels, 1,460 for 1,460, which is the harder test: the branch
structure matches as well as the output minute.

### Does the clamp bind identically both years?

Almost. Days on which fajr leaves the plain angle:

| city | 2026 | 2027 | window 2026 | window 2027 |
|---|---|---|---|---|
| Tallinn | 134 | 133 | 04-16 to 08-27 | 04-17 to 08-27 |
| Tartu | 128 | 127 | 04-19 to 08-24 | 04-20 to 08-24 |

Comparing month-days rather than dates, 133 of 134 days coincide at Tallinn and 127 of 128 at Tartu.
The single extra day is 04-16 and 04-19, both in 2026. So the window is the same window, one day
longer in the leap-aligned year, and it is one day longer at the spring end only.

**The 45 and 120 bounds never displace a value.** Inside the substitution branch the portion runs
80.15 to 119.68 minutes at Tallinn and 85.52 to 117.95 at Tartu, in both years. The published clamp
is real but inoperative at these latitudes: what actually fires is the unbounded quarter-night
substitution, and the window edges are set by when the 15 degree crossing fails. The cap takes no
part in either year, and the 45-minute floor is 35 minutes away from ever being reached. Reporting
the pair as "15/15 with a 45 to 120 clamp" describes the code rather than the output.

Counts by rule, as the publisher labels them: 123 isha days a year are the fixed May-August
maghrib + 90 at both cities. The angle-preferred months fall back on 5 to 7 days. Fajr splits into
roughly 231 angle, 34 guard and 99 to 100 quarter-night days at Tallinn.

### Where the residual is

asr is the only weak column: 27 to 30% exact, 86 to 92% within one, worst 2 minutes, no bias. The
site's own solver samples the declination at a different instant from adhan, which moves the asr
altitude by a hundredth of a degree and the clock time by a minute or two. A shadow-length change
would bias the residual one way, and this does not.

---

## Verdicts

1. **Muhammadiyah, to 2035: the pair holds.** 18/18 at both twilights with a one-minute safety, 100%
   within one minute on 1,116 rows across six years, three latitudes and both seasons. The margin the
   rule needs moves by two seconds between 2025 and 2035. The Kemenag line stays 7.7 to 7.8 minutes
   earlier for fajr throughout, and the two national lines are now comparable output a decade deep.
2. **Hong Kong: the recipe does not reproduce the Trustees' print, and the surfaces do not agree on a
   rule.** Page 2 is a fixed-interval jama'ah sheet with a 13:00 dhuhr clock and the Hanafi asr. Page 1
   is an angle table at 18.5 fajr and 21.3 isha. The feed is a third hybrid: page 1's fajr, page 2's
   isha, neither page's dhuhr or maghrib. The one durable confirmation is fajr at 18.4 degrees across
   26 years.
3. **Iceland, three years: the pair holds, and the recipe needs one clause removed.** 14.2/14.0 with
   the angle-derived night portion reproduces all 2,190 rows within one minute at both cities. The
   December +90 display rule does not appear in any of the three years and should be dropped. The
   Akureyri asr defect does not reach the capital: 0 days of asr at or before dhuhr at Reykjavik
   against 19 or 20 at Akureyri, same generating error, larger latitude.
4. **Estonia, two years: one parameter set reproduces both years.** The independently reimplemented
   scheme matches 1,460 of 1,460 rule classifications and reproduces fajr and isha within one minute
   on every row. The clamp binds on 134 and 133 days (Tallinn) and 128 and 127 (Tartu), the same
   month-days bar one, and the published 45 to 120 bounds never move a value.

## Files

- `muhammadiyah-deep.json`: recipe, grid fit, per-year and per-city scores, per-year margin windows,
  Kemenag deltas, amplitude, other columns.
- `hk-deep.json`: page 1 transcription, recipe-against-both-pages scores, printed intervals, implied
  angles per day, cross-check of page 1 Hanafi against page 2 asr.
- `is-deep.json`: rule, grid fit, six city-year scores, clamp windows, asr tables, December isha,
  year-copy check.
- `ee-deep.json`: scheme, four city-year score sets, rule-label agreement, clamp windows, portion
  ranges, bound-bind counts, publisher rule counts.
- `data/khgt-decade-rows.json`: the 1,116 normalized KHGT rows. `data/khgt-candidates.json`: the
  named-cell comparison behind the 18/18 +1.5 reading.
- `captures/`: 36 KHGT responses plus the 730 recovered 2026 Iceland responses.
- `scripts/`: harvest and fit per job, plus `diag-iceland-asr.mjs`, which recovers the declination lag
  from the printed asr column.
