# UK form map

Reconciliation of fit4, fit12 and verify3 against every UK capture they read, plus the extra
English captures fit14 covered. Thirty towns, thirty-five captures, one table. Where the agents
disagree the verdict is re-derived from the raw captures in `uktowns2/data/` and
`ukscotland/data/`, not from their reports.

Engine and discipline: adhan 4.4.6 at `Rounding.None`, every run `TZ=Europe/London`, dates built
from the capture strings, no clock reads, no network, no subagents, everything under
`$HOME/athan-gitree/census/o1k-wide/ukreconcile/`.

## Verdict

**18 towns are interval tables, 12 are angle tables, none is undecidable on its fajr.** Six isha
sides cannot be decided from the one month held. The modal English form is the LUPT interval
construction, as verify3 concluded, and it is a majority rather than a rule: Nottingham is not a
lone counterexample, it is one of twelve angle towns.

## How the verdict was reached

1. **F and I from the print, not from a fit.** `F = sunrise - fajr`, `I = isha - maghrib`, day by
   day, against the capture's own printed solar columns. Intervals are longitude-free and immune to
   a whole-table clock shift.
2. **Implied twilight depression.** The solar altitude at the printed minute. A recipe holds one
   depression. A table does not. Cross-checked against adhan at the fitted angle: agreement to
   0.0 minutes.
3. **Constancy against the rounding floor.** A print rounded to the minute makes a true angle's
   implied depression jitter by `rate / sqrt(12)`. Observed jitter over that floor separates a true
   angle (about 1.0) from a stepping table (2.5 to 130).
4. **Core window Nov-Feb.** A 15 to 18 degree twilight exists at every latitude held, 50.8 to
   57.1 N, through those four months, so a summer cap or an invented summer value cannot enter the
   verdict. Summer behaviour is judged separately and carried as a clause.
5. **Recipe naming at zero offset.** A free offset proves the angle form and never the recipe. At
   Luton a 15 degree isha with a free -3 minute offset is exact on 20 of 30 days. At zero offset 3 of
   30 land within 1 minute. The first number is what fit12 reported.
6. **The isha side cannot carry the verdict at UK latitudes.** In Nov-Feb the isha runs at 13.2 to
   15.2 degrees whatever produced it, and a table rounded to one minute is within 1 to 2 minutes of
   a frozen angle for four months. Fajr separates the constructions by 60 to 300 minutes across a
   year. The town class is therefore fajr-driven, and each isha side is labelled on its own.

Two data defects were repaired before measuring, and both leave F and I untouched: Coventry prints
three rows 60 minutes late on 26 to 28 March, and Slough 2022 and Walsall 2020 print the whole year
on GMT, 217 and 210 rows one hour early.

## The map

Rows are captures. `F` and `I` are the same-MM-DD delta against the LUPT arrays in
`fit14/lupt_fi.json`, independently validated at 0 mismatches on all 181 days of the six captured
LUPT months. The percentage is the share of days within 1 minute of the stated constant.

| Town | Capture / rows | Fajr | Isha | LUPT |
|---|---|---|---|---|
| Luton | 2026-11 / 30 | interval-table | undecidable | F -1 (73%), I +0 (97%) |
| Brighton | 2026-11 / 30 | interval-table | undecidable | F -4 (83%), I -3 (83%) |
| Dudley | 2026-11 / 30 | interval-table | undecidable | F +0 (83%), I +1 (90%) |
| Preston | 2026-11 / 30 | interval-table | absent, not an isha | F -1 (80%) |
| Blackpool | 2026-11 / 30 | ISNA 15/15 | ISNA 15/15 | F +3 (73%), I +11 (97%) |
| Middlesbrough | 2026-11 / 30 | interval-table | undecidable | F +0 (100%), I +0 (100%) |
| Stockport | 2026-11 / 30 | ISNA 15/15 | ISNA 15/15 | F +2 (77%), I +7 (97%) |
| Watford | 2026-11 / 30 | Karachi 18/18 | Karachi 18/18 | F +14 (80%), I +23 (100%) |
| Ilford | 2026-11 / 30 | interval-table | undecidable | F -2.5 (67%), I -1 (83%) |
| Cambridge | 2026-11-10..12-11 / 32 | interval-table | angle 13.61 | F -2 (100%), I -6 (88%) |
| Stoke | 2026-11 / 30 | constant 110 | ISNA 15/15 | F +8.5 (60%), I +1 (90%) |
| Birmingham | 2026-11 / 30 | interval-table | undecidable | F -12 (80%), I +3 (97%) |
| Leicester | 2026-11 / 30 | Karachi 18/18 | Karachi 18/18 | F +20 (83%), no maghrib column |
| Nottingham | 2026 / 365 | Karachi 18/18 | Karachi 18/18 | F +30 (12%), I +29 (14%) |
| Reading | 2026 / 365 | interval-table | interval-table | no sunrise column, I -5 (41%) |
| Coventry | 2026 / 365 | interval-table | interval-table | F +3 (99%), I +3 (72%) |
| Rochdale | 2026 / 365 | interval-table | interval-table | F +3 (28%), I -4 (35%) |
| Bolton | 2026 / 354 | interval-table | interval-table | F +3 (100%), I +5 (70%) |
| Oldham OCMIC | 2026 / 365 | interval-table | interval-table | F +6 (20%), I -2 (26%) |
| Oldham Westwood | 2026 / 345 | interval-table | interval-table | F +6 (24%), I -2 (35%) |
| Oxford | 2026 / 365 | Karachi 18/18 | Karachi 18/18 to January, clock floor from February | F +26 (12%), I +17 (3%) |
| Slough | 2022 / 365 | angle 18.51 | constant 90 | F +27 (14%), I +11 (9%) |
| Walsall | 2020 / 366 | Karachi 18/18 | Karachi 18/18 | F +25 (10%), I +40 (3%) |
| Cardiff | 2026-11 / 30 | interval-table | constant 80 | F +3 (100%), I -13 (40%) |
| Hull | 2026-01 + 11..12 / 62 | constant 95 | constant 75 | F -2.5 (52%), I -22 (69%) |
| Bradford Hanfia | 2026 / 365 | ISNA 15/15 | angle 9.0, mild summer fallback | no sunrise column, I -22 (4%) |
| Bradford Victor St | 2026-11 / 30 | ISNA 15/15 | angle 9.03 | F +2 (60%), I -37 (83%) |
| London ELM | 2026 / 365 | interval-table | interval-table | F +0 (100%), I +0 (100%) |
| London ICC | 2026-11..12 / 61 | interval-table | interval-table | F +0 (100%), I +0 (100%) |
| London MWH North | 2026-11 / 30 | interval-table | ISNA 15/15 | F +0 (97%), I +0 (100%) |
| Glasgow | 2026 / 365 | interval-table | Karachi 18/18 | F +32 (10%), I +28 (10%) |
| Dundee | 2026 / 365 | Karachi 18/18 | interval-table | F +37 (8%), I +17 (14%) |
| Edinburgh | 2026-11 / 30 | Karachi 18/18 | MWL 18/17 | no sunrise column, I +30 (87%) |
| Aberdeen Central | 2026 / 333 | Wifaqul 18/15, 1/2 and 1/7 caps | same | F +49 (7%), I +12 (12%) |
| Aberdeen Spital | 2026 / 333 | Wifaqul 18/15, 1/2 and 1/7 caps | same | F +49 (7%), I +12 (12%) |

Evidence per side, as measured. The depression is the implied twilight angle in Nov-Feb with
its spread. The last column of each pair is the census angle nearest that depression, scored at
zero offset, exact then within 1 minute, out of the core days where the angle is defined. A
constant array is named instead.

| Town | Fajr depression | Fajr, nearest census angle | Isha depression | Isha, nearest census angle |
|---|---|---|---|---|
| Luton | 15.22, spread 0.79 | 15 deg 3/12 of 30 | 14.60, spread 0.33 | 15 deg 0/3 of 30 |
| Brighton | 15.06, spread 0.75 | 15 deg 5/21 of 30 | 14.57, spread 0.36 | 15 deg 0/3 of 30 |
| Dudley | 15.06, spread 0.75 | 15 deg 5/21 of 30 | 14.55, spread 0.37 | 15 deg 0/2 of 30 |
| Preston | 14.49, spread 0.85 | 15 deg 2/8 of 30 | none | none |
| Blackpool | 15.00, spread 0.14 | 15 deg 28/30 of 30 | 15.00, spread 0.26 | 15 deg 27/30 of 30 |
| Middlesbrough | 14.40, spread 0.66 | 15 deg 0/0 of 30 | 13.60, spread 0.30 | 15 deg 0/0 of 30 |
| Stockport | 15.02, spread 0.14 | 15 deg 26/30 of 30 | 15.00, spread 0.14 | 15 deg 28/30 of 30 |
| Watford | 17.91, spread 0.14 | 18 deg 29/30 of 30 | 18.24, spread 0.14 | 18 deg 0/27 of 30 |
| Ilford | 15.07, spread 0.77 | 15 deg 5/21 of 30 | 14.56, spread 0.35 | 15 deg 0/1 of 30 |
| Cambridge | 14.70, spread 0.71 | 15 deg 6/15 of 32 | 13.61, spread 0.17 | 15 deg 0/0 of 32 |
| Stoke | constant 110 | constant 110 | 14.93, spread 0.25 | 15 deg 25/30 of 30 |
| Birmingham | 13.25, spread 0.69 | 15 deg 0/0 of 30 | 14.34, spread 0.42 | 15 deg 0/0 of 30 |
| Leicester | 18.00, spread 0.13 | 18 deg 30/30 of 30 | 17.99, spread 0.15 | 18 deg 28/30 of 30 |
| Nottingham | 18.14, spread 0.16 | 18 deg 58/120 of 120 | 17.99, spread 0.15 | 18 deg 112/120 of 120 |
| Reading | 15.06, spread 1.10 | 15 deg 16/42 of 120 | 13.88, spread 0.72 | 15 deg 0/0 of 120 |
| Coventry | 15.14, spread 1.88 | 15 deg 12/26 of 120 | 14.74, spread 1.29 | 15 deg 16/53 of 120 |
| Rochdale | 14.36, spread 1.39 | 15 deg 13/28 of 120 | 13.26, spread 0.52 | 15 deg 0/0 of 120 |
| Bolton | 14.63, spread 2.02 | 15 deg 15/37 of 117 | 15.02, spread 1.39 | 15 deg 22/49 of 117 |
| Oldham OCMIC | 14.79, spread 1.19 | 15 deg 10/38 of 120 | 13.67, spread 0.58 | 15 deg 0/0 of 120 |
| Oldham Westwood | 14.77, spread 1.42 | 15 deg 6/25 of 112 | 13.74, spread 0.43 | 15 deg 0/0 of 112 |
| Oxford | 18.01, spread 0.36 | 18 deg 65/120 of 120 | 16.89, spread 5.42 | 17 deg 0/0 of 120 |
| Slough | 18.51, spread 0.16 | 18 deg 0/0 of 120 | constant 90 | constant 90 |
| Walsall | 17.99, spread 0.15 | 18 deg 116/121 of 121 | 18.01, spread 0.16 | 18 deg 116/121 of 121 |
| Cardiff | 15.96, spread 0.63 | 16 deg 0/0 of 30 | constant 80 | constant 80 |
| Hull | constant 95 | constant 95 | constant 75 | constant 75 |
| Bradford Hanfia | 15.08, spread 0.28 | 15 deg 96/120 of 120 | 8.98, spread 0.48 | 15 deg 0/0 of 120 |
| Bradford Victor St | 15.11, spread 0.34 | 15 deg 12/30 of 30 | 9.03, spread 0.15 | 15 deg 0/0 of 30 |
| London ELM | 15.40, spread 1.88 | 15 deg 7/26 of 120 | 14.87, spread 1.20 | 15 deg 25/64 of 120 |
| London ICC | 15.45, spread 1.65 | 15 deg 3/16 of 61 | 14.63, spread 0.55 | 15 deg 7/28 of 61 |
| London MWH North | 15.82, spread 0.59 | 16 deg 0/0 of 30 | 14.83, spread 0.39 | 15 deg 14/26 of 30 |
| Glasgow | 17.29, spread 0.44 | 17 deg 0/0 of 120 | 17.96, spread 0.38 | 18 deg 38/119 of 120 |
| Dundee | 17.97, spread 0.18 | 18 deg 98/120 of 120 | 15.16, spread 2.32 | 15 deg 3/56 of 120 |
| Edinburgh | 18.00, spread 0.13 | 18 deg 29/30 of 30 | 17.00, spread 0.13 | 17 deg 28/30 of 30 |
| Aberdeen Central | 18.00, spread 0.13 | 18 deg 119/120 of 120 | 15.00, spread 0.14 | 15 deg 119/120 of 120 |
| Aberdeen Spital | 18.00, spread 0.13 | 18 deg 119/120 of 120 | 15.00, spread 0.14 | 15 deg 119/120 of 120 |

## Counts

| Measure | Interval | Angle | Undecidable |
|---|---|---|---|
| Towns, fajr-driven class | 18 | 12 | 0 |
| Towns, isha side | 10 | 13 | 6, plus Preston's absent column |
| Captures, fajr | 21 | 14 | 0 |
| Captures, isha | 12 | 16 | 6, plus Preston |

Twelve of the thirty towns carry a different class on their two sides. Seven angle towns have a
full year of evidence: Nottingham, Oxford, Slough, Walsall, Bradford Hanfia, Dundee, and Aberdeen's
two sheets. Five towns rest on one month: Watford, Leicester, Blackpool, Stockport and Edinburgh,
plus Bradford Victor St, whose town has a full-year capture beside it.

The six undecidable isha sides are Luton, Brighton, Dudley, Middlesbrough, Ilford and Birmingham.
Each refutes a 15 degree isha at zero offset, 0 to 3 days of 30, and each fits both a non-census
angle at 13.6 to 14.6 degrees and a LUPT-construction table. Luton, Middlesbrough and Birmingham
sit at a constant LUPT offset on 97 to 100 percent of days, which favours the table. Brighton,
Dudley and Ilford sit at 83 to 90 percent, which does not.

## The three claims, corrected

**fit4: "England's towns are interval tables."** The form is right and the universal is wrong. Of 30
UK towns, 18 run a date-indexed interval table and 12 run an angle. Even inside fit4's own four
towns the family splits: Coventry and Bolton are LUPT plus a constant offset, Reading and Rochdale
are their own arrays. The sentence that survives is "the modal English form is the LUPT interval
construction", which verify3 already proposed, and its count is 18 of 30.

**fit12: the six-family map.** Five families survive: F (Blackpool, Stockport, both ISNA 15/15), E
(Watford, Leicester, Nottingham, all Karachi 18/18), S (Edinburgh, MWL 18/17), W (Aberdeen, Wifaqul
with 1/2 and 1/7 caps), T2 (Cardiff and Hull, interval on both sides). Two members do not: Glasgow
is not E, since 0 of 120 core days fall within 1 minute of an 18 degree fajr and its fajr lead sits
32 minutes off LUPT's, and Dundee is not W, since the Wifaqul caps hold on 216 of 365 fajr days and
134 of 365 isha days. fit12's own "11 of 18 fajr tables" is exactly right and reproduces here.

The part of fit12 that does not survive is the T1 isha column, "an angle near 15 degrees with an
offset anywhere from 0 to -9 minutes". The offset is doing the work: at zero offset a 15 degree
isha matches 0 to 3 days of 30 at those towns. What is true is that the isha there sits at a
constant 13.6 to 14.6 degrees, which is not a census object, and that the isha cannot be decided on
one month.

**verify3: "the modal form holds, the universal does not".** Confirmed and widened. Nottingham is
an angle town: 120 of 120 core days within 1 minute of 18/18 at zero offset, and its fajr array
swings 129 minutes across the year, which no interval produces. Its summer is an invented clock
value, as fit12 found. Watford and Oxford hold as angle towns, at 30/30 and 120/120 core days.

Twelve towns are angle towns, not three. fit12's own clusters already contained seven of them,
Blackpool and Stockport in F, Watford, Leicester and Nottingham in E, Edinburgh in S and Aberdeen
in W. verify3's scan found three because it required a bare angle against a printed sunrise, which
excludes Edinburgh, whose capture has no sunrise column, and Aberdeen, whose angle is capped. The
map adds Oxford, Slough, Walsall, Bradford and Dundee, all angles on the fajr side and none of them
among fit12's eighteen.

**fit14's vocabulary.** Its classes measure distance from LUPT, not model class, and the two axes
are independent. "fajr drift, isha offset +23" is true of Watford and Watford is an angle town.
"isha offset +24" is true of Leicester and Leicester is Karachi 18/18. "isha offset +10" and "+7"
are true of Blackpool and Stockport and both are ISNA 15/15. An isha offset read off a one-month
print cannot separate a table from an angle, and four of the offsets fit14 recorded are that
artefact.

## The towns where the agents disagreed

| Town | Claim | Verdict from the raw capture |
|---|---|---|
| Glasgow | fit12: E, Karachi 18/18 | Own fajr table, 0/120 core days within 1 of 18 degrees, LUPT +32. fit4 stands. |
| Dundee | fit12: W, Wifaqul caps | 18 degree fajr daily, then a night-fraction of 0.307. Isha is a weekly-stepped table (max step 11 min), not a frozen 15 degrees. fit4 stands. |
| Luton, isha | fit12: angle near 15 | 15 degrees refuted at zero offset (3/30). A non-census 14.6 degrees or LUPT + 0 both fit. |
| Coventry | verify3: seasonal table, F 90 to 157 | Three DST rows at +63 inflate the range. F is LUPT + 3 within 1 on 98.6 percent of all 365 days, with a shared summer isha dip. |
| Stoke | fit12: interval 112 | 110.0 exactly on all 30 days against the printed sunrise. |
| Hull | fit12: 99.5 / 80 | 95 / 75 exactly on all 62 days against the printed sunrise, which runs 4.7 minutes early on average. |
| Cardiff, isha | fit12: 83 | 80.0 exactly on all 30 days. |
| Slough, isha | fit14: angle-like | Constant 90 minutes all year. The fajr is an 18.5 degree angle, and the capture prints the year on GMT. |
| Oxford, isha | none | 18 degrees through January, then a clock floor from February. New. |
| Bradford | fit14: isha angle-like | Resolves to 9.0 degrees isha at both mosques, with 15 degrees fajr. |
| Middlesbrough | fit14: exact both | Stronger: the November print is LUPT itself on both columns, 30/30 at offset 0. |

## The product line for the UK outside London

Two encodings are on the table: a per-town table for every town, or per-recipe clusters with
per-town parameters. The counts do not favour a single answer.

| Route | Towns | What it carries |
|---|---|---|
| One angle pair, plus a cap clause where the summer needs it | 10 | Aberdeen, Blackpool, Bradford, Edinburgh, Leicester, Nottingham, Oxford, Stockport, Walsall, Watford |
| Angle plus a small isha table or constant | 2 | Slough (18.5 degrees, isha 90), Dundee (18 degrees, isha weekly table) |
| Two constants | 1 | Hull, 95 and 75 |
| Constant plus an angle | 1 | Stoke, fajr 110, isha 15 degrees |
| LUPT pointer | 2 | London, Middlesbrough |
| LUPT plus a constant offset | 4 | Coventry, Bolton, Cambridge, Cardiff |
| Per-town array | 10 | Birmingham, Brighton, Dudley, Glasgow, Ilford, Luton, Oldham, Preston, Reading, Rochdale |

Counted by side rather than by town, 28 of the 70 capture sides need a table array. At 366 bytes a
side that is 10.2 KB, against 21.5 KB for all 30 towns as full pairs and 25.6 KB for all 35
captures. The LUPT base costs 732 bytes once and serves the four offset towns and the two pointers.

The cluster route is real but thin. Karachi 18/18 covers five towns, ISNA 15/15 three, MWL 18/17
one and Wifaqul one, and Slough and Dundee are single-town parameter sets. The offsets that fit14
proposed as an encoding cover two towns on a full-year span, London and Bolton's fajr. Coventry's
isha needs the shared summer dip written beside it, and the isha offsets recorded for Watford,
Leicester, Blackpool and Stockport describe angles, not tables. "LUPT plus per-town offset" is
therefore a description of the London and Bolton corner, not a national encoding.

The honest line is: shared angle recipes carry 10 towns and two more are single-town angle sets, so
12 towns need parameters and not tables. The other 18 need a per-town table, of which 8 can be
expressed as LUPT, a constant, or a pointer plus a small annotation.

## Scotland and the LUPT-adopter rows, settled

These are not part of the English mosaic and are recorded so the map is complete.

- **Glasgow**: per-town fajr table at an effective 17.3 degrees, drifting 0.44 degrees across
  Nov-Feb and 8.6 degrees across the year, with a 01:33 wall-clock clamp. Its isha is an 18 degree
  angle, within 1 minute on 119 of 120 core days. Mixed, and not Karachi.
- **Dundee**: an 18 degree fajr on every day the angle is defined, then a night-fraction regime of
  0.307 for fajr and 0.15 for isha rounded to weekly plateaus. The isha is a table: 56 of 120 core
  days within 1 minute of 15 degrees, maximum step 11 minutes.
- **Edinburgh**: MWL 18/17, November only, fajr 30/30 and isha 28/30 at zero offset.
- **Aberdeen AMIC Central and Spital**: Wifaqul 18/15 with 1/2 and 1/7 night caps, 318/333 fajr and
  319/333 isha within 1 minute over the whole span at both mosques. The two sheets print identical
  fajr, sunrise, asr, maghrib and isha columns and differ on dhuhr for 29 rows, as fit4 recorded.
- **LUPT adopters**: London East London Mosque is LUPT within 1 minute on all 365 fajr and isha
  days, exactly on every fajr day and on 361 of 365 isha days. London ICC (61 days) and MWH North
  (30 days) sit at offset 0 on both columns. Middlesbrough's November print is LUPT itself, 30/30
  on both columns.

## Files

- `uk-form-map.json`: the map, one record per capture, with each agent's claim, the resolved class,
  the evidence that decided it and the corrections that follow.
- `recon.json`: every measurement, per capture and per side.
- `recon.mjs`, `classify.mjs`, `solarcheck.mjs`: the measurement, classification and printed-solar
  diagnostic scripts. `towns.json` holds the capture list and the town grouping.
