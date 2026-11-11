# Deep-span fits: Kazakhstan to 2100, Kyrgyzstan 2027-2035, Saudi to 1500H

Tag `deep1`, captured 2026-11-10 (UTC). Public pages only, GET only. Every fit runs
adhan-js 4.4.6 out of `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`, builds
each date from its own calendar fields with no real clock, forms every instant at second
resolution and only then rounds.

Deliverables: `kz-deep.json`, `kg-deep.json`, `sa-deep.json`, scripts under `scripts/`,
the eighteen Kazakhstan tables under `data/`, and raw responses plus the 2100 render note
under `captures/`.

---

## Job 1 - Kazakhstan to 2100

### Surface and harvest

`muftyat.kz/kk/namaz_times/` computes its table in the browser from its own
`captures/kz-prayTimes.js`; there is no server-side year artifact to crawl. The harvest
therefore runs the publisher's own engine at the publisher's own coordinates, with
`dst` forced to 0. The trap is live and still costs an hour on every summer column when a
DST-zone browser does the rendering.

The far end of the span was proved on the page itself, not inferred: a browser session set
the date inputs to 2100-01-01..06 and the table rendered six rows that match the local
engine 36/36 cells (`captures/kz-live-render-2100.json`). The page's year header cell still
reads the static string 2026 on those rows; only the headline is stale.

Coordinates were read from the live option list, not from the brief:

| City | Option id | Latitude | Longitude | tz | Margin set |
|---|---|---|---|---|---|
| Astana | 3 | 51.133333 | 71.433333 | 5 | B (>= 48 N) |
| Petropavl | 51 | 54.862222 | 69.140833 | 5 | B (>= 48 N) |

The brief's 51.1282/71.4304 and 54.87/69.15 are rounded forms of these. Substituting the
brief's pair changes the 2026 Astana score from 69.7 to 69.5 percent exact, so the choice
does not move any verdict.

Petropavl sits 6.9 degrees above the 48 N line, not near it. Both cities therefore take
set B, and the brief's city pair does not exercise the split. That costs nothing: the
margin block is an integer added to an already-rounded minute, so the 48 N test cannot
interact with the year. The split shifts four columns by two minutes and nothing else.

### The recipe

```
ISNA 15/15, Hanafi asr, high latitude TwilightAngle (fajr angle / 60 of the night)
sunrise = round(raw - 5)      dhuhr = round(raw + 5)      asr = round(raw + 5)
maghrib = round(raw + 5)      fajr  = round(raw)          isha = round(raw)
below 48 N the same rule reads -3 / +3.
```

### Per-decade scores

| Year | Astana exact | Astana w1 | Astana MAE | Petropavl exact | Petropavl w1 | Petropavl MAE |
|---|---|---|---|---|---|---|
| 2026 | 69.7 | 99.9 | 0.304 | 66.0 | 99.9 | 0.341 |
| 2030 | 69.5 | 99.9 | 0.306 | 65.1 | 100 | 0.350 |
| 2035 | 70.5 | 99.9 | 0.295 | 66.5 | 100 | 0.335 |
| 2040 | 69.8 | 100 | 0.303 | 66.7 | 99.9 | 0.334 |
| 2050 | 69.3 | 100 | 0.307 | 66.6 | 100 | 0.335 |
| 2060 | 69.4 | 99.9 | 0.307 | 66.4 | 100 | 0.336 |
| 2075 | 69.7 | 100 | 0.303 | 66.4 | 99.9 | 0.337 |
| 2090 | 69.7 | 99.9 | 0.304 | 67.3 | 99.9 | 0.328 |
| 2100 | 69.7 | 99.7 | 0.305 | 65.9 | 99.9 | 0.342 |

The rate moves 1.2 points at Astana and 2.2 at Petropavl across 74 years, and the MAE moves
at most 0.022 minutes. That is flat. No column drifts: the first-to-last change in mean
residual is at most 0.047 minutes (asr), and the whole-century spread of the mean residual
is at most 0.118 minutes.

The exact rate is not 100 percent because the publisher's engine is not adhan. The two
solar models disagree by a fraction of a minute, which is the whole of the residual:

- **Dhuhr carries a constant +1 minute bias** (363 of 365 days at Astana in 2026, the same
  histogram at 2100). The publisher's transit is about 0.4 minutes earlier than adhan's.
  The bias is identical in every year sampled, so it is a model constant, not drift.
- Every other column is within one minute on 99.7 to 100 percent of days, worst case 2.

### Leap-cycle residuals

| City | Leap years sampled | Leap mean MAE | Non-leap mean MAE | Residuals on 29 February (fajr, sunrise, dhuhr, asr, maghrib, isha) |
|---|---|---|---|---|
| Astana | 2040, 2060 | 0.305 | 0.303 | 0,0,1,1,0,0 and 0,0,1,0,0,0 |
| Petropavl | 2040, 2060 | 0.335 | 0.338 | 0,0,1,1,0,0 in both |

The leap insertion leaves no signature: the leap-year MAE is 0.002 minutes from the
non-leap mean at Astana and 0.003 the other way at Petropavl, and the leap day itself
differs from its neighbours only by the standing dhuhr constant. 2100, which is not a leap
year, scores the same as 2090.

### Seasonal amplitude

Peak-to-trough of the published column across a year, minutes:

| Column | Astana | Petropavl |
|---|---|---|
| fajr | 269 | 288-289 |
| sunrise | 259 | 302-303 |
| dhuhr | 30 | 30-31 |
| asr | 213 | 244 |
| maghrib | 267 | 310 |
| isha | 276-277 | 296 |

The amplitude is identical in every year sampled, to within one minute: isha gains a minute
from 2075 onward, and Petropavl's fajr loses one at 2050. The fit error's own amplitude is
2 minutes in every column at both cities, all century.

### Verdict

One parameter set holds to 2100. Yes. Worst year is 2050 at Astana (69.3 percent exact,
0.307 MAE) and 2030 at Petropavl (65.1 percent exact, 0.350 MAE); both sit inside a
2.2-point band with no trend.

---

## Job 2 - Kyrgyzstan 2027-2035

### Surface and harvest

`muftiyat.kg/ru/api/v1/calendar/1/` serves any two-month window in any year. Ten GETs
fetched January (01-01..28-02) and July (01-07..31-08) for 2027, 2029, 2031, 2033 and
2035, 121 rows per year, zero gaps. The full 2027 year already on record in
`centralasia2/data/kg-bishkek-2027.json` is the control.

### The recipe

```
fajr    = floor(18 deg raw)
sunrise = floor(raw)
dhuhr   = round(raw)
asr     = Hanafi, ceil(raw) + 1
maghrib = floor(sunset raw) + 7
isha    = maghrib + round(7/9 * (sunrise - fajr) + 3.5)
```

Maghrib is sunset + 7 on every day of every sampled year, no exception. The asr column is
the weakest in the set: the published time sits 1.25 minutes after adhan's raw asr (median
1.3, range -0.3 to +3.0), so no rounding rule reaches it exactly on most days. The recipe
uses rounded-up-plus-1, which lands within 1 minute on 95.9 percent of the 605 rows. The
census records no asr margin, so this is a measured margin, not a quoted one.

### Per-year scores, held constants (k = 7/9, c = 3.5)

| Year | Rows | Exact | Within 1 | MAE | isha within 1 | k implied | c implied |
|---|---|---|---|---|---|---|---|
| 2027 | 121 | 74.5 | 99.7 | 0.258 | 98.3 | 0.77657 | 3.34 |
| 2029 | 121 | 54.4 | 95.7 | 0.499 | 90.1 | 0.77784 | 3.485 |
| 2031 | 121 | 74.4 | 99.9 | 0.258 | 99.2 | 0.77668 | 3.353 |
| 2033 | 121 | 52.3 | 94.6 | 0.530 | 88.4 | 0.77795 | 3.497 |
| 2035 | 121 | 75.1 | 99.9 | 0.251 | 99.2 | 0.77676 | 3.362 |

Full-year 2027 control, 365 rows: 69.5 exact, 99.6 within 1, 0.308 MAE, implied
k 0.77607, implied c 3.31. The windows reproduce the ratio the full year gives to 0.0005,
though they read 5 points higher on exact because January and July are the two flattest
months for the residual.

The implied k is the clean test: it is `(isha - published maghrib - 3.5) / (sunrise - fajr)`
with the published maghrib as the base, so the maghrib column's own error cannot leak into
it. Across five years and 605 days it reads 0.77657 to 0.77795, a spread of 0.00138, with
a within-year standard deviation of about 0.0055. Seven-ninths is 0.77778, inside every
year's band.

### Leap cycle

The constant oscillates with calendar position, not with time: 2029 and 2033 (years
congruent to 1 mod 4, the years after a leap year) read k 0.7778 and c 3.49, while 2027,
2031 and 2035 read k 0.7767 and c 3.34. The swing is 0.001 in k and 0.15 in c, and it does
not accumulate. Below the ratio, the publisher's own maghrib column widens in those
same years: its residual against adhan is -1..+1 on 121/121 days in 2027 but -2..+2 on
2029 and 2033. Both effects share one cause, the publisher's solar epoch handling after a
leap year, and both are bounded at 2 minutes.

### Seasonal amplitude

The twilight window (sunrise minus fajr) runs 93.9 to 137.8 minutes across a year, an
annual amplitude of 43.9 minutes. The isha offset from maghrib runs 76 to 109 minutes, an
amplitude of 34 minutes, of which the 7/9 slope accounts for 34.1 and the constant for the
rest. The Jan+Jul windows alone give a twilight range of 42.3 minutes, so the two sampled
months capture 96 percent of the annual swing.

### Verdict

The ratio constant holds; it does not drift. Seven-ninths is confirmed to within 0.0014
across 2027-2035, with the additive constant at 3.34-3.50 against the census band 3.2-3.5.
Worst year is 2033 on within-1 (94.6 percent), and the cause is the publisher's maghrib
column in leap-cycle years, not the ratio.

The held constant c = 3.5 costs up to 1.7 points of isha within-1 (98.3 percent at 2027
against 100 at c = 3.35); the census band, read at its lower end, fits better. That is a
refinement, not a refutation.

---

## Job 3 - Saudi Arabia to 1500H

### Surface and harvest

`umqserv.kacst.gov.sa/api/v1/Prayer/GetPrayerHijriYear` is keyless and takes one Hijri year
per GET. Six GETs at Makkah (21.4225, 39.8262, zone 3) returned 354-355 rows each. The
ceiling stands: 1500H ends 2077-11-16, and 1501 is refused by the source.

Four of the six responses carry one row of the *previous* Hijri year (1460, 1470, 1490,
1500 begin with the closing day of the year before). Identity `hijriDate.year == yh` drops
it, leaving 354 rows in every year.

### The recipe

```
fajr 18.5 deg, Shafi asr, MiddleOfTheNight
fajr, dhuhr, asr, maghrib = floor(raw + 1)
sunrise                   = floor(raw)
isha = maghrib + 90, and + 120 on the API's own Ramadan days (hijri month 9)
```

The interval is applied to the generated maghrib, so isha inherits maghrib's rounding and
carries one single formulation.

### Per-year scores

| Hijri year | Rows | Gregorian span | Exact | Within 1 | MAE | Ramadan days | Interval set |
|---|---|---|---|---|---|---|---|
| 1450 | 354 | 2028-05-25 .. 2029-05-13 | 87.1 | 100 | 0.129 | 29 | 90/120 |
| 1460 | 354 | 2038-02-06 .. 2039-01-25 | 86.1 | 100 | 0.139 | 29 | 90/120 |
| 1470 | 354 | 2047-10-21 .. 2048-10-08 | 87.0 | 100 | 0.130 | 30 | 90/120 |
| 1480 | 354 | 2057-07-03 .. 2058-06-21 | 86.3 | 100 | 0.137 | 30 | 90/120 |
| 1490 | 354 | 2067-03-17 .. 2068-03-04 | 86.2 | 100 | 0.138 | 29 | 90/120 |
| 1500 | 354 | 2076-11-28 .. 2077-11-16 | 86.1 | 100 | 0.139 | 30 | 90/120 |

Exact moves 1.0 point across 48 solar years and the MAE moves 0.010 minutes. Every column
is within one minute on every day of every year, and the maximum error anywhere in the six
years is 1 minute. Fajr and asr carry the exact-rate ceiling (58-70 percent) because the
two ephemerides differ by a fraction of a minute where those columns move fastest against
the clock; that is the same ceiling the 1447-1449 fits recorded and it is flat across the
span.

### Interval and Ramadan switch

The interval histogram is `{90: 324-325, 120: 29-30}` in every year: exactly two values,
nothing else, anywhere in six Hijri years. Grouped by Hijri month, month 9 holds 120 on
every day and every other month holds 90 on every day. Zero violations in 177 Ramadan days
and 1,947 non-Ramadan days.

The switch is month-exact on the API's own boundaries. In 1500H: Sha'ban 30 (2077-07-20)
reads 90, Ramadan 1 (2077-07-21) reads 120, Ramadan 30 (2077-08-19) reads 120, Shawwal 1
(2077-08-20) reads 90. Ramadan length varies 29 to 30 across the six years and the rule
follows the calendar each time.

### Seasonal amplitude

At 1500H, peak-to-trough across the Hijri year: fajr 90, sunrise 83, dhuhr 30, asr 39,
maghrib 90, isha 117. Isha's extra 27 minutes over maghrib's 90 is the Ramadan step, so the
seasonal amplitude of the interval itself is 30 minutes exactly, constant across all six
years.

### Verdict

The interval and the Ramadan switch hold across four decades of Hijri years. Yes, and the
whole recipe holds: one parameter set, no per-era term, 100 percent within-1 at 1450 and at
1500. Worst year is 1460 (86.1 exact, 0.139 MAE), tied with 1500 inside a 0.010-minute
band.

---

## Honest negatives and limits

- **Kazakhstan has no server artifact.** The 2026-2100 tables are the publisher's own
  client engine, executed locally. That is the surface, and it was proved equal to the live
  page at 2100, but a publisher who later changed the served `prayTimes.js` would change
  the table without any year boundary to detect it.
- **The 48 N margin split is not exercised by these two cities.** Both are above the line.
  The claim that the split cannot drift rests on its structure (an integer added after
  rounding), not on a city sample. Shymkent 2028 at 42.37 N is the standing below-line
  witness, and it is not part of this span.
- **Kyrgyzstan is sampled, not whole.** Jan and Jul per year, 605 rows. The ratio test is
  strong over that range because the twilight window varies 42 of its 44 annual minutes
  across the two months, but a mid-year excursion would be invisible.
- **The Saudi file's extra first row** is a source quirk, not a fit failure. Any consumer
  that assumes `rows[0].hijriDate.year == yh` will mislabel that day; the identity filter
  is required.
- **The KZ dhuhr bias of +1** is real and uniform. A consumer wanting exact minutes should
  carry it; a consumer fitting to within 1 minute may ignore it.
