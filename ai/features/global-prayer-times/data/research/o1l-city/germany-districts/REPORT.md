# O1l-51 Germany districts — is the portal's district layer a coordinate refinement or a table of its own?

Workspace `$HOME/athan-gitree/census/o1l-city/germany-districts/`. Public pages only, GET only, no
login, no form, no challenge solved, no contact with any body, no subagents. Nothing written under
`/tmp`, nothing written to the repository. Probe window 2026-11-11, 06:1xZ to 07:0xZ. User agent
`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36`.
Engine adhan 4.4.6, `Rounding.None` at second resolution, margin and rounding applied per column
afterwards, TZ `Europe/Berlin`, dates built from the printed strings, no clock read anywhere.

## 1. The district axis is a 1,241-entry gazetteer, and it is not the administrative axis

The predecessor enumerated 16 states and 1,241 district ids from the portal's own region API
(`/de-DE/home/GetRegList`, `ChangeType=country|state`, `CountryId=13`). That enumeration is
reproduced exactly (`data/districts-all.tsv`, 1,241 rows, 16 states, zero duplicate ids), and it
stands as the whole axis: no `ChangeType=district|region|semt` is accepted (all three answer
`{"Result":"error"}`), the state lists carry no sub-level, and a district page carries no
sub-district links (`captures/probe-berlin-11002.html`, zero `/de-DE/<id>/` hrefs).

**The mission's Berlin 12 and Hamburg 7 do not exist on this axis.** Berlin is one id (11002) under
every culture tested (`de-DE`, `tr-TR`, `en-US` answer the same single row), and no Berlin borough
name appears anywhere in the 1,241. Hamburg is six ids filed under the Hamburg state (11012 Hamburg,
10115 Bergedorf, 10116 Billstedt, 10031 Finkenwerder, 10032 Harburg, 10034 Wilhelmsburg) plus
**10654 Glinde (Hamburg)** filed under Schleswig-Holstein, which makes seven Hamburg-named points.
The portal's German "district" is a gazetteer place with its own prayer-time point, not a Bezirk and
not a Kreis. State counts: NRW 286, Baden-Württemberg 235, Bayern 207, Niedersachsen 126, Hessen 118,
Rheinland-Pfalz 75, Schleswig-Holstein 56, Brandenburg 31, Sachsen 29, Sachsen-Anhalt 23, Saarland 20,
Thüringen 17, Mecklenburg-Vorpommern 8, Hamburg 6, Bremen 3, Berlin 1.

## 2. The whole axis banked: 1,241 districts, 452,965 district-days, full 2026

Every one of the 1,241 ids was captured (`captures/district-<id>.html`, 510 MB) and parsed into a
normalized table (`data/district-<id>-2026.json`). Every page carries the full civil year in three
inline tables; the 365-row year table is parsed alone and cross-checked against the other two:
**zero conflicting date across the three tables at all 1,241 districts**, row count 365 at all
1,241, 16 states covered (`data/parse-all.json`). **`2027` occurs zero times in all 1,241 pages**,
so the portal's single-cycle behaviour the city wave measured holds at the district layer too.

**1,239 of the 1,241 tables are distinct.** The two identical clusters are pairs of neighbouring
places, and they are the shared-point signature the refinement model predicts rather than a repeated
page: Lünen (10195) with Oberaden (10922), and Kleinblittersdorf (33279) with Rilchingen-Hanweiler
(33327), the latter being a district of the former.

**All 18 banked city tables equal their own district id's table exactly**, 365 rows by 6 columns each
(Bremen 11005, Dortmund 11006, Duisburg 11007, Düsseldorf 11008, Essen 11009, Freiburg 11011,
Hannover 11013, Karlsruhe 11014, Kiel 11016, Mannheim 11021, Nürnberg 11024, Saarbrücken 11026,
Dresden 11035, Erfurt 10874, Magdeburg 10875, Leipzig 11100, Rostock 10551, Bonn 11004). The city
wave read those pages from a different workspace with a different parser and the two parses agree on
every cell, which is a full cross-validation of this workspace's parse.

## 3. The verdict: a coordinate refinement of the one recipe, at all 1,102 validated districts

Three independent tests, all pointing the same way.

**Test 1 — distinctness.** 1,239 distinct tables over 1,241 ids. The only two repeats are the
neighbouring-place pairs named in section 2, one in Nordrhein-Westfalen and one in Saarland. No
state carries a table repeated across unrelated places, so the district layer is not one table per
state, per Land, or per Kreis.

**Test 2 — the one recipe at each district's own point.** The city wave's domestic temkin set
(dhuhr +5.5 floor, sunrise -6.5 floor, maghrib +6.5 floor, asr Shafi +3, fajr 18.0, isha 16.0),
applied at the district's own gazetteer point and scored against that district's printed table
(`fit/sweep-shard.mjs`, `fit/final.mjs`, `fit/district-sweep.json`):

| column | best (margin, rounding) across 1,102 districts | exact, median / p10 / worst |
|---|---|---|
| **dhuhr** | **+5.5 floor at 1,102 of 1,102** | 318 / 295 / 271 of 365 |
| sunrise | -6.5 floor at 1,058, -7 at 33, -6 at 11 | 247 / 232 / 209 |
| maghrib | +6.5 floor at 952, +6 at 139, +7 at 11 | 141 / 129 / 113 |
| asr | Shafi +3 at 475, +3.5 at 436, +6 at 121, +6.5 at 63, +2.5 at 5 | 104 / 94 / 86 |
| asr Hanafi | never: 0 exact at **1,102 of 1,102**; Shafi better at 1,102 of 1,102 | — |

Dhuhr is the clean one: **one margin, one rounding, at every district in Germany.** The column that
cannot be faked by a coordinate (it is the transit plus a constant temkin) lands on +5.5 floor
everywhere, the value the 24 cities gave. Sunrise and maghrib hold the same -6.5/+6.5 mode at 96% and
86% of districts with the rest one half-minute either side. The asr margin is the one that genuinely
spreads: +3 to +3.5 over 83% of the country and +6 to +6.5 at 184 northern districts, which is the
latitude-dependent temkin drift the city wave saw on the wider mirror window, now mapped at 1,102
points rather than 24.

**Test 3 — difference space.** For 4,222 sampled same-state pairs across all 16 states, the observed
table difference minus the difference the same recipe predicts from the two points
(`fit/difference-space.json`):

| column | winter, residual within 1 min | median pair | max residual |
|---|---|---|---|
| fajr 18.0 | 95.6-100.0% of days | 100.0% | **2 min** |
| sunrise | 94.0-100.0% | 100.0% | **2 min** |
| dhuhr | 89.6-100.0% | 100.0% | **2 min** |
| asr | 92.9-100.0% | 100.0% | **2 min** |
| maghrib | 92.3-100.0% | 100.0% | **2 min** |
| isha 16.0 | 95.6-100.0% | 100.0% | **2 min** |

**Not one of 4,222 pairs exceeds a two-minute residual on any day of the winter window, and the
median pair is within one minute on all 182 days in every column.** Two districts' printed tables
differ by exactly what their two points predict under one recipe. That closes the Turkey-style
question for Germany: the district id is a coordinate, not a table.

The summer tail is the twilight clamp, not a second parameter. On the days where the 18°/16°
depression is never reached at 53-54 N the portal substitutes its summer rule, and the fajr and isha
residuals then reach 83 and 115 minutes with the median pair within one minute on only 48% and 45%
of days. The solar columns stay at 2 minutes all summer. Restricting to the winter window, where the
angle is defined on 182 of 182 days at every district, removes the tail entirely.

## 4. The deviation distribution against a city table

For the 1,102 validated districts measured against the nearest of the 18 banked city tables (median
separation 58.9 km, maximum 213.3 km) — `data/vs-city.json`:

| column | median abs | signed median | worst day | days differing |
|---|---|---|---|---|
| fajr | 2.0 min | -1.0 | 15 | 91.8% |
| sunrise | 2.0 | -1.0 | 14 | 91.5% |
| dhuhr | 2.0 | -1.0 | 10 | 100.0% |
| asr | 2.0 | -1.0 | 13 | 96.4% |
| maghrib | 2.0 | -1.0 | 14 | 91.5% |
| isha | 2.0 | -1.0 | 19 | 92.9% |

A district 59 km from its city reads 2 minutes away on a typical day and up to 19 on the extreme day,
with a uniform one-minute offset (signed median -1 across every column, the district point running
marginally east or south of the city point). The district layer buys a real 2-minute refinement over
the city point, which is exactly the quantity a coordinate change produces at this latitude.

## 5. Coordinates: the pages carry none, the gazetteer does, and the columns vouch for them

No portal page carries a latitude or longitude (`captures/probe-berlin-11002.html`: zero decimal
degree strings, no `enlem`/`boylam`/`koordinat`, no coordinate data attribute). The IGMG gazetteer
does: its `cities` route lists 1,272 German entries and its `times` route publishes the `sun` point
the table is computed at, to 0.1 degree. **1,105 of the 1,241 portal ids name-match a gazetteer entry
and 1,106 points are banked** (`data/igmg-sun.json`; the 136 that do not match are counted in
section 8). The coordinate ledger carries the 1,102 validated points with their state and source
(`data/district-coords.json`).

**The latitude is recovered from the columns independently and agrees with the gazetteer point.**
Solving the seasonal shape of sunrise, sunset and asr with one constant removed per column
(`fit/lat-shard.mjs`, `fit/recovered-lat.json`) returns the gazetteer latitude within **0.02 degree
at the median, 0.06 at p99, and all 1,102 validated districts within 0.08 degree**.

**Three points fail the cross-checks, and they are the name collisions 1,241 ids invite.** Horst
(NRW) solves at 51.03 against a gazetteer 52.0 and Regenstauf (Bayern) at 49.14 against 48.1 — both
about a degree out, and both also fail the solar sweep outright (Horst's sunrise best margin is +2.5
with 48 of 365 exact, Regenstauf's -2.5 with 51, where every sound district sits at -6.5 or one half
minute from it). Lauenförde (Niedersachsen) has the right latitude and the wrong longitude: its
solar columns fit at the country's own margins, but its dhuhr margin is **+9.5, shared only with
Horst among the 1,105 districts that carry a point, where the other 1,103 sit at +5.5**, and its
zero-margin fajr is 0 of 182. **All three are excluded from the fit and named rather than fitted at a
guessed point; the remaining 1,102 carry a point their own table confirms.** A wrong longitude leaves
a constant residual in every column, which the dhuhr margin measures directly, and a wrong latitude
breaks the column shape, which the recovery measures directly. Both tests fire on all three and on
nothing else.

**The dhuhr temkin degeneracy is handled, not papered over.** A longitude error and the dhuhr temkin
shift every column by one and the same constant, so longitude is not recoverable from the printed
columns at any district — the city wave's finding, restated and confirmed here, and the reason the
+9.5 margins above are read as longitude errors rather than as a second recipe. The fits therefore
run at the gazetteer's own 0.1-degree point, and the fitted margins absorb the constant.

## 6. The angle pair, identified at zero margin at every district

Winter window, 182 days, zero margin, nearest rounding (`fit/district-sweep.json`):

- **fajr**: exact **0 at 17.0, 17.5, 18.25 and 18.5 at all 1,102 districts**, exact 111-153 of 182
  (median 133) at 18.0 with **182 of 182 within one minute at every single district**. A single clean
  angle, identical to the city wave's 18.0 and now excluded at four neighbouring angles everywhere.
- **isha**: exact **0 at 15.0, 15.5, 16.5 and 17.0 at all 1,102 districts**; the band sits at 15.75
  (30-77 exact, median 53) and 16.0 (22-52 exact, median 33, 105-165 within one), with 16.25 at
  22-44. The record's 16.0 sits inside the band and **16.5 is excluded outright at 1,102 of 1,102**
  — a tightening of the city wave's 16.45 exclusion.

Seasonal amplitude (January mean minus July mean) across all 1,241 tables: fajr 139-171 minutes,
isha 248-289, sunrise 141-208. The city wave's 144-166 and 256-284 are reproduced.

**Between-year stability** cannot be tested here: the portal serves one published cycle, `?yil=2027`
is ignored, and not one of the 1,241 district pages carries a 2027. The object stays **provisional**,
exactly as O1l-42 left it, and the district layer adds no second cycle.

## 7. What this confirms and what is new

- **Confirms** the one-recipe verdict at 1,102 more points: the domestic temkin set is the
  publisher's country-wide rule, not a 24-city coincidence. Dhuhr +5.5 floor is uniform across the
  whole country.
- **Confirms** the reference point is the gazetteer's own point, now at 1,102 districts within
  0.08 degree, 0.02 at the median.
- **New**: the German district axis is a **coordinate refinement**, not a per-district table. The
  answer is uniform across 4,222 pairs and 1,102 districts — no deviating district anywhere, worst
  residual two minutes.
- **New**: the asr temkin is latitude-dependent, +3 to +3.5 over 83% of the country and +6 to +6.5 at
  184 northern districts.
- **New**: isha 16.5 is excluded at 1,102 of 1,102 districts, tightening the identified band to
  15.75-16.25.
- **New**: the layer is so strictly coordinate-driven that a one-degree gazetteer error is visible in
  both the column shape and the dhuhr margin, which is the strongest form of the refinement result.

## 8. Honest negatives

- **Berlin's 12 boroughs are not on the portal.** One id, one table, under three cultures. If a
  borough-level Diyanet table exists it is not reachable from this axis.
- **136 of the 1,241 ids have no IGMG gazetteer entry under name matching**, so their coordinates
  are not banked and they are excluded from the fit rather than fitted at a guessed point. Their
  tables are banked. Three of the 1,105 that do match are ambiguous place names, caught by the
  latitude recovery and the dhuhr margin and named in section 5.
- **No 2027 at the district layer** and no year parameter with any effect, as at the cities.
- **The district pages carry no coordinates**, so the coordinate ledger rests on the IGMG gazetteer
  plus the column-based latitude check, not on the portal's own page.
- Not reached this wave, and open: `e-corlu.com` (403 to this host at the city wave), any DITIB
  district-level PDF, and the gazetteer entries for the 136 unmatched ids.

## Assumptions

- The German page's first time column is the imsak row and is treated as fajr, per the record's
  scheme note.
- A district's gazetteer point is the point the portal computes at. Evidence: the city wave's
  byte-identity on 2,116 of 2,116 overlapping city-days, the 0.02-degree median latitude agreement
  at 1,102 districts here, and the two-minute residual ceiling in the difference space.
- The three rejected points are name collisions rather than a second recipe. Evidence: each is about
  a degree out on one axis, and the pair of symptoms (column shape and dhuhr margin) is the signature
  of a coordinate error, not of a parameter change.
- "Winter window" is the held 182 days, January-March plus October-December.
