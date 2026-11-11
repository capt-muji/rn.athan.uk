# Decade report: the 2027 recipe against the published 2028-2038 timetable

The recipe recovered from 2027 alone was run unchanged over 2028-2038 and scored against
the published tables: 4,018 days, 24,108 (date, prayer) cells per arm, no sampling. The
naive arm replays 2027's literal clock values by month and day. Both arms read the same
truth file. Every number here is printed by `compare.mjs`, whose headline totals were
re-derived independently by `verify.mjs`.

- `compare.mjs` writes `results.json` and a stage file per comparison stage.
- `verify.mjs` recomputes both arms from the raw JSON with separate code.
- `report.mjs` renders the tables below from `results.json`.
- `check-tables.mjs` confirms every table row below equals the row `report.mjs` produced.

Totals from the two independent paths agree exactly:

| arm | exact | within 1 min | worst | mean absolute error |
|---|---|---|---|---|
| recipe | 23,684/24,108 (98.24%) | 24,108/24,108 (100.00%) | 1 min | 0.0176 min |
| naive replay | 13,224/24,108 (54.85%) | 22,593/24,108 (93.72%) | 62 min | 1.2378 min |

## 1. The recipe does reproduce the publisher's next eleven years

Every one of the 24,108 cells lands within one minute, and no cell is two minutes out.
The recipe reproduces the published decade to the width of the publisher's own rounding.
The 424 non-exact cells are all one-minute boundary flips, the same class of miss the fit
already saw inside 2027.

### Recipe arm: per year, all six prayers

| year | days | exact | within 1 | worst | MAE |
|---|---|---|---|---|---|
| 2028 | 366 | 98.00% | 100.00% | 1 | 0.0200 |
| 2029 | 365 | 98.58% | 100.00% | 1 | 0.0142 |
| 2030 | 365 | 98.31% | 100.00% | 1 | 0.0169 |
| 2031 | 365 | 98.95% | 100.00% | 1 | 0.0105 |
| 2032 | 366 | 98.00% | 100.00% | 1 | 0.0200 |
| 2033 | 365 | 98.17% | 100.00% | 1 | 0.0183 |
| 2034 | 365 | 97.81% | 100.00% | 1 | 0.0219 |
| 2035 | 365 | 98.08% | 100.00% | 1 | 0.0192 |
| 2036 | 366 | 98.32% | 100.00% | 1 | 0.0168 |
| 2037 | 365 | 98.13% | 100.00% | 1 | 0.0187 |
| 2038 | 365 | 98.31% | 100.00% | 1 | 0.0169 |
| **2028-2038** | **4018** | **98.24%** | **100.00%** | **1** | **0.0176** |

Exactness by year and by prayer, so no year hides a weak column:

### Recipe arm: exact percent, year against prayer

| year | fajr | sunrise | dhuhr | asr | magrib | isha |
|---|---|---|---|---|---|---|
| 2028 | 97.54% | 97.54% | 98.63% | 97.81% | 98.36% | 98.09% |
| 2029 | 98.63% | 98.63% | 99.45% | 99.73% | 97.53% | 97.53% |
| 2030 | 99.18% | 99.18% | 97.53% | 96.71% | 98.63% | 98.63% |
| 2031 | 99.18% | 99.18% | 98.63% | 99.45% | 98.63% | 98.63% |
| 2032 | 98.09% | 98.09% | 98.36% | 98.09% | 97.81% | 97.54% |
| 2033 | 97.53% | 97.53% | 98.90% | 99.45% | 97.81% | 97.81% |
| 2034 | 99.18% | 99.18% | 98.08% | 96.99% | 96.71% | 96.71% |
| 2035 | 98.90% | 98.90% | 98.63% | 99.18% | 96.44% | 96.44% |
| 2036 | 98.36% | 98.36% | 98.63% | 98.63% | 98.09% | 97.81% |
| 2037 | 98.36% | 98.36% | 98.63% | 98.36% | 97.53% | 97.53% |
| 2038 | 98.63% | 98.63% | 99.45% | 97.53% | 97.81% | 97.81% |
| **all** | **98.51%** | **98.51%** | **98.63%** | **98.36%** | **97.76%** | **97.69%** |

### Recipe arm: mean absolute error in minutes, year against prayer

| year | fajr | sunrise | dhuhr | asr | magrib | isha |
|---|---|---|---|---|---|---|
| 2028 | 0.0246 | 0.0246 | 0.0137 | 0.0219 | 0.0164 | 0.0191 |
| 2029 | 0.0137 | 0.0137 | 0.0055 | 0.0027 | 0.0247 | 0.0247 |
| 2030 | 0.0082 | 0.0082 | 0.0247 | 0.0329 | 0.0137 | 0.0137 |
| 2031 | 0.0082 | 0.0082 | 0.0137 | 0.0055 | 0.0137 | 0.0137 |
| 2032 | 0.0191 | 0.0191 | 0.0164 | 0.0191 | 0.0219 | 0.0246 |
| 2033 | 0.0247 | 0.0247 | 0.0110 | 0.0055 | 0.0219 | 0.0219 |
| 2034 | 0.0082 | 0.0082 | 0.0192 | 0.0301 | 0.0329 | 0.0329 |
| 2035 | 0.0110 | 0.0110 | 0.0137 | 0.0082 | 0.0356 | 0.0356 |
| 2036 | 0.0164 | 0.0164 | 0.0137 | 0.0137 | 0.0191 | 0.0219 |
| 2037 | 0.0164 | 0.0164 | 0.0137 | 0.0164 | 0.0247 | 0.0247 |
| 2038 | 0.0137 | 0.0137 | 0.0055 | 0.0247 | 0.0219 | 0.0219 |
| **all** | **0.0149** | **0.0149** | **0.0137** | **0.0164** | **0.0224** | **0.0232** |

Worst error by year and by prayer is 1 minute in all 66 cells of that grid, so no
single year or column is the weak one.

### Recipe arm: per prayer over all 4,018 days

| prayer | exact | within 1 | worst | MAE | 1-min flips | >=2 min |
|---|---|---|---|---|---|---|
| fajr | 3958/4018 (98.51%) | 4018/4018 (100.00%) | 1 | 0.0149 | 60 | 0 |
| sunrise | 3958/4018 (98.51%) | 4018/4018 (100.00%) | 1 | 0.0149 | 60 | 0 |
| dhuhr | 3963/4018 (98.63%) | 4018/4018 (100.00%) | 1 | 0.0137 | 55 | 0 |
| asr | 3952/4018 (98.36%) | 4018/4018 (100.00%) | 1 | 0.0164 | 66 | 0 |
| magrib | 3928/4018 (97.76%) | 4018/4018 (100.00%) | 1 | 0.0224 | 90 | 0 |
| isha | 3925/4018 (97.69%) | 4018/4018 (100.00%) | 1 | 0.0232 | 93 | 0 |
| **all** | **23684/24108 (98.24%)** | **24108/24108 (100.00%)** | **1** | **0.0176** | **424** | **0** |

The published table is rounded to whole minutes, so a one-minute band is the narrowest
tolerance it allows, and the recipe meets that band on every cell. The 424 non-exact
cells are all one-minute boundary flips, the same class of miss the fit already saw
inside 2027.

## 2. The offset tables carry across years untouched

Fajr is defined as sunrise minus a table offset, and isha as maghrib plus a table offset. If
those tables are year-stable, the signed fajr error must equal the signed sunrise error on
every date. It does, on 4,018 of 4,018 days. Isha matches maghrib on 4,015 of 4,018 days;
the three exceptions are 2028-02-29, 2032-02-29 and 2036-02-29, where the 02-29 offset
entry is one minute out (section 3).

So the fajr and isha tables recovered from a single year of 2027 are the publisher's
tables, and every fajr and isha miss below is inherited from the solar sunrise and
maghrib, not from the offsets.

## 3. 29 February: the geometry is computed, the offset row is 03-01's

The recipe as shipped fills 02-29 by taking the rounded mean of the 02-28 and 03-01
offset entries, and it computes the leap day's solar geometry normally. The publisher
does the same thing for the geometry: on all three leap days, all four solar columns
match truth exactly (12 of 12 cells).

For the offset rows the publisher's value is visible through truth. Fajr's implied offset
on 02-29 is 97 minutes in 2028, 2032 and 2036. Isha's is 86 minutes in all three years.
The 2027 table holds fajr 97 on both 02-28 and 03-01, so fajr cannot discriminate; isha
holds 87 on 02-28 and 86 on 03-01, so the publisher's leap-day offset is the 03-01 entry,
which is also the mean truncated down rather than rounded up. The shipped recipe carries
87, one minute too many, and that costs exactly one minute on isha on each of the three
leap days.

### 02-29: truth against the candidate fills

| leap day | prayer | 02-28 | 03-01 | truth | rounded mean | truth matches | recipe | recipe err |
|---|---|---|---|---|---|---|---|---|
| 2028-02-29 | fajr | 05:09 | 05:04 | 05:06 | 05:07 | truncated mean | 05:06 | 0 |
| 2028-02-29 | sunrise | 06:46 | 06:41 | 06:43 | 06:44 | truncated mean | 06:43 | 0 |
| 2028-02-29 | dhuhr | 12:18 | 12:18 | 12:18 | 12:18 | all four | 12:18 | 0 |
| 2028-02-29 | asr | 15:04 | 15:06 | 15:05 | 15:05 | mean, truncated mean | 15:05 | 0 |
| 2028-02-29 | magrib | 17:41 | 17:44 | 17:42 | 17:43 | truncated mean | 17:42 | 0 |
| 2028-02-29 | isha | 19:08 | 19:10 | 19:08 | 19:09 | 02-28 | 19:09 | 1 |
| 2032-02-29 | fajr | 05:08 | 05:04 | 05:06 | 05:06 | mean, truncated mean | 05:06 | 0 |
| 2032-02-29 | sunrise | 06:45 | 06:41 | 06:43 | 06:43 | mean, truncated mean | 06:43 | 0 |
| 2032-02-29 | dhuhr | 12:18 | 12:18 | 12:18 | 12:18 | all four | 12:18 | 0 |
| 2032-02-29 | asr | 15:04 | 15:06 | 15:05 | 15:05 | mean, truncated mean | 15:05 | 0 |
| 2032-02-29 | magrib | 17:41 | 17:44 | 17:43 | 17:43 | mean | 17:43 | 0 |
| 2032-02-29 | isha | 19:08 | 19:10 | 19:09 | 19:09 | mean, truncated mean | 19:10 | 1 |
| 2036-02-29 | fajr | 05:08 | 05:04 | 05:06 | 05:06 | mean, truncated mean | 05:06 | 0 |
| 2036-02-29 | sunrise | 06:45 | 06:41 | 06:43 | 06:43 | mean, truncated mean | 06:43 | 0 |
| 2036-02-29 | dhuhr | 12:18 | 12:18 | 12:18 | 12:18 | all four | 12:18 | 0 |
| 2036-02-29 | asr | 15:04 | 15:06 | 15:05 | 15:05 | mean, truncated mean | 15:05 | 0 |
| 2036-02-29 | magrib | 17:41 | 17:44 | 17:43 | 17:43 | mean | 17:43 | 0 |
| 2036-02-29 | isha | 19:08 | 19:10 | 19:09 | 19:09 | mean, truncated mean | 19:10 | 1 |

The three leap days rescored with the 02-29 offset set to the 03-01 entry:

| 02-29 offset fill | exact | within 1 | worst |
|---|---|---|---|
| shipped (half-up mean) | 15/18 | 18/18 | 1 |
| 02-28 entry | 15/18 | 18/18 | 1 |
| 03-01 entry | 18/18 | 18/18 | 0 |

The fill rule that matches the publisher is the 03-01 entry. Applying it lifts the decade
total from 23,684 to 23,687 exact cells, 98.25 percent, and removes the only three misses
that do not come from the solar boundary.

Read the table's `recipe` column as the day's own value: the generator computes 02-29's
solar geometry from the date itself, exactly as it does for any other day. That column
equals truth in all twelve geometry cells, so 29 February is a computed date in the
publisher's data and the neighbour rules only happen to land on it. The isha row of 2028
is the one place where the two views look different: truth 19:08 equals 02-28's 19:08 at
the clock, because maghrib moved one minute later (17:41 to 17:42) while the offset moved
one minute smaller (87 to 86). That cancellation is arithmetic, and the 2032 and 2036
rows, where the same offset of 86 yields 19:09 against 02-28's 19:08, separate the two
readings and leave the 03-01 entry as the one that holds in all three years.

## 4. Keying: month-day holds, day of year fails

In a leap year, day-of-year keying drifts by one position for every date from 03-01
onward, so the two keyings disagree on 143 days of each leap year. Scoring both against
truth settles it on every leap year:

| year | keying | fajr exact | fajr worst | fajr MAE | isha exact | isha worst | isha MAE |
|---|---|---|---|---|---|---|---|
| 2028 | MM-DD | 97.54% | 1 | 0.0246 | 98.09% | 1 | 0.0191 |
| 2028 | day-of-year | 74.59% | 2 | 0.2596 | 77.87% | 2 | 0.2322 |
| 2032 | MM-DD | 98.09% | 1 | 0.0191 | 97.54% | 1 | 0.0246 |
| 2032 | day-of-year | 74.86% | 2 | 0.2541 | 79.51% | 2 | 0.2158 |
| 2036 | MM-DD | 98.36% | 1 | 0.0164 | 97.81% | 1 | 0.0219 |
| 2036 | day-of-year | 74.86% | 2 | 0.2568 | 79.23% | 2 | 0.2186 |

| year | days where the keyings differ | rows truth separates | MM-DD closer | day-of-year closer | MM-DD exact, DOY not | DOY exact, MM-DD not | verdict |
|---|---|---|---|---|---|---|---|
| 2028 | 143 | 163 | 161 | 2 | 160 | 2 | MM-DD |
| 2032 | 143 | 163 | 157 | 6 | 157 | 6 | MM-DD |
| 2036 | 143 | 163 | 159 | 4 | 158 | 4 | MM-DD |

Day-of-year keying loses about 23 points of fajr exactness and pushes the worst error to
two minutes. The 12 votes it collects across the three years are one-minute flips that
landed its way by chance. Month-day keying is the publisher's keying.

## 5. The raw numbers on their own

The naive arm copies 2027's literal values onto the same month and day of every later
year, filling 02-29 with the half-up mean of 2027's 02-28 and 03-01 rows.

| year | exact | within 1 | worst | MAE | worst, DST-aligned | exact, DST-aligned | MAE, DST-aligned |
|---|---|---|---|---|---|---|---|
| 2028 | 36.16% | 84.97% | 62 | 1.4244 | 2 | 36.34% | 0.7796 |
| 2029 | 40.14% | 97.17% | 61 | 1.5817 | 2 | 40.55% | 0.6073 |
| 2030 | 66.89% | 98.08% | 61 | 1.4671 | 1 | 67.81% | 0.3219 |
| 2031 | 94.84% | 98.08% | 60 | 1.1831 | 1 | 96.76% | 0.0324 |
| 2032 | 36.61% | 83.38% | 2 | 0.8001 | 2 | 36.61% | 0.8001 |
| 2033 | 38.68% | 97.08% | 61 | 0.9607 | 2 | 38.81% | 0.6356 |
| 2034 | 63.88% | 98.90% | 61 | 1.0091 | 1 | 64.47% | 0.3553 |
| 2035 | 92.65% | 98.36% | 61 | 1.0438 | 1 | 94.16% | 0.0584 |
| 2036 | 36.16% | 80.24% | 62 | 1.9508 | 2 | 36.43% | 0.8233 |
| 2037 | 36.21% | 94.70% | 62 | 1.8064 | 2 | 36.53% | 0.6694 |
| 2038 | 61.32% | 100.00% | 1 | 0.3868 | 1 | 61.32% | 0.3868 |
| **2028-2038** | **54.85%** | **93.72%** | **62** | **1.2378** | **2** | **55.42%** | **0.4975** |

| prayer | exact | within 1 | worst | MAE | rows >=2 min | worst, DST-aligned |
|---|---|---|---|---|---|---|
| fajr | 1774/4018 (44.15%) | 3695/4018 (91.96%) | 62 | 1.3549 | 323 | 2 |
| sunrise | 1774/4018 (44.15%) | 3695/4018 (91.96%) | 62 | 1.3549 | 323 | 2 |
| dhuhr | 3549/4018 (88.33%) | 3968/4018 (98.76%) | 61 | 0.8512 | 50 | 1 |
| asr | 2458/4018 (61.17%) | 3927/4018 (97.74%) | 61 | 1.1371 | 91 | 2 |
| magrib | 1834/4018 (45.64%) | 3654/4018 (90.94%) | 62 | 1.3644 | 364 | 2 |
| isha | 1835/4018 (45.67%) | 3654/4018 (90.94%) | 62 | 1.3641 | 364 | 2 |

The raw numbers fall into two clean populations (exact rows omitted):

| error | rows |
|---|---|
| 1 minute | 9369 |
| 2 minutes | 1215 |
| 3-5 minutes | 0 |
| 6-30 minutes | 0 |
| more than 30 minutes | 300 |

Nothing sits between three and thirty minutes. The 300 rows over thirty minutes are not
numeric drift at all: every one falls in a band around the March or October clock change,
as wide as the gap between the two years' switch dates. The literal 2027 clock value is
then an hour out, and the hour plus or minus the one-to-two minute drift gives 60 to 62.

Correcting only the clock state, the same literal replay is within two minutes
everywhere, at 55.42 percent exact and 0.4975 minutes mean absolute error. So the raw
numbers are stable to one or two minutes over eleven years, and a naive replay fails on
the calendar, since the numbers themselves never move that far.

That is also why the naive score swings so much year to year. Under the clock correction
2031 sits at 96.76 percent exact and 2035 at 94.16, against 36.34 percent in 2028 and
36.43 in 2036: 2031 and 2035 are simply the years whose published times sit closest to
2027's, at 0.03 and 0.06 minutes mean absolute error, while 2028 and 2036 are the
farthest at about 0.8. 2032 and 2038 carry no hour-sized miss at all, because their
clock-change dates land on the same calendar dates as 2027's.

## 6. Where the recipe misses sit

Every recipe miss is one minute, which is the signature of a rounding boundary. No miss
reaches two minutes anywhere in the eleven years:

| month | 1-min flips | >=2 min |
|---|---|---|
| 01 | 20 | 0 |
| 02 | 26 | 0 |
| 03 | 57 | 0 |
| 04 | 40 | 0 |
| 05 | 22 | 0 |
| 06 | 26 | 0 |
| 07 | 36 | 0 |
| 08 | 18 | 0 |
| 09 | 16 | 0 |
| 10 | 67 | 0 |
| 11 | 67 | 0 |
| 12 | 29 | 0 |

The flips are spread across the whole year with no month free of them: heaviest in
October and November (67 each) and March (57), lightest in September (16) and August
(18). As in the 2027 fit, the spread follows the sub-minute phase of each event as it
crosses a rounding boundary, and no calendar boundary of its own appears. Maghrib and isha
carry the most (90 and 93 of 424). No month, no year and no prayer contributes a
two-minute error, and the largest error anywhere in eleven years is one minute.

Per year the count runs from 23 (2031) to 48 (2034), with no upward drift.

## 7. Trend: flat across the decade

| prayer | 2028 exact | 2028 MAE | 2038 exact | 2038 MAE | delta MAE | slope (min/year) |
|---|---|---|---|---|---|---|
| fajr | 97.54% | 0.0246 | 98.63% | 0.0137 | -0.0109 | -0.000222 |
| sunrise | 97.54% | 0.0246 | 98.63% | 0.0137 | -0.0109 | -0.000222 |
| dhuhr | 98.63% | 0.0137 | 99.45% | 0.0055 | -0.0082 | -0.000349 |
| asr | 97.81% | 0.0219 | 97.53% | 0.0247 | +0.0028 | 0.000251 |
| magrib | 98.36% | 0.0164 | 97.81% | 0.0219 | +0.0055 | 0.000895 |
| isha | 98.09% | 0.0191 | 97.81% | 0.0219 | +0.0028 | 0.000825 |
| **all** | **98.00%** | **0.0200** | **98.31%** | **0.0169** | **-0.0031** | **0.000195** |

Distance from 2027 does not raise the error. 2028 scores 98.00 percent exact, the farthest
year 2038 scores 98.31, and 2031 sits between them at 98.95. Three of the six prayers
improve slightly with distance and three worsen slightly, all inside a thousandth of a
minute per year. A decade of extrapolation moves the mean absolute error by 0.002 minutes,
which is two parts in a thousand of the rounding step.

The recipe is generation-stable. Its residual is a sub-minute difference between this
solar implementation and the publisher's, and that difference does not accumulate with
time; it simply decides which side of a half-minute boundary each event falls on.

## Answers

1. Yes. The 2027 recipe reproduces the publisher's 2028-2038 tables at 98.24 percent
   exact and 100 percent within one minute, worst error one minute, over all 4,018 days
   and all six prayers. With the leap-day offset set to the 03-01 entry it reaches 98.25
   percent and the worst error stays at one minute.
2. The raw numbers survive on their own to one or two minutes but not to the clock. A
   literal replay scores 54.85 percent exact and 93.72 percent within one minute, with
   300 rows an hour out because it cannot move the daylight-saving switch; corrected for
   the clock it is 55.42 percent exact and within two minutes everywhere. The recipe's
   advantage is that the arithmetic regenerates the clock as well as the times.
3. The misses are 424 one-minute boundary flips, all of them in the geometry columns and
   their fajr and isha dependants, heaviest in maghrib and isha and in March, October and
   November, with no structural error anywhere. The only misses that are not solar
   boundary flips are three leap-day isha cells, one minute each, and they vanish under
   the 03-01 offset entry.
