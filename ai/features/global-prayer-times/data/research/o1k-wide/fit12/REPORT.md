# O1k wide - fit 12: the UK recipe mosaic

Eighteen dated surfaces fitted at their town centres. Answer to the owner's question: **a true
mosaic, six recipe families, and school does not predict the recipe.** No de facto English-Hanafi
recipe exists in this data. The modal *form* is LUPT's own form, a sunrise-anchored table, at 11 of
18 surfaces, but no town reproduces LUPT's values. The only recipe that holds a whole year at 57N is
Wifaqul 18/15 with night caps.

Machinery: `mosaic.mjs` (candidate and free fits), `gapdiag.mjs` (angle versus interval model class),
`season.mjs` (year-surface stability), `assemble.mjs` (this report's JSON). All adhan 4.4.6, seconds
then explicit rounding, `TZ=Europe/London`, no clock reads. Data as held, one year per year surface,
one month per monthly print. Coordinates are standard town centres (the captures carry no coordinate
metadata) and sit in `uk-mosaic.json` beside each town.

## What one month can and cannot prove

A single month cannot pin a dawn angle. With the print offset free, a 12 to 21 degree sweep fits
every one of these monthly prints equally well: the JSON records the band, and it is wide in every
case. What a month *can* pin is the model class (angle or table) and any recipe family about three
degrees away from its neighbours. Blackpool proves the second point: ISNA 15/15 reproduces its fajr
28/30 exact while every 18 degree candidate reaches 0/30.

The model class comes from the drift of the sunrise-to-fajr gap across the window. A dawn angle at
52N widens that gap about 8 minutes through November. A constant interval widens it zero. A printed
monthly table steps it 2 to 6 minutes. The fitted angle model and the fitted interval model are
compared by RMS after a free offset, and the smaller wins (`fitRms` in the JSON carries both).

## Per-surface result

Rows are the dated rows held. School is the asr column that fits, 1-mithl or 2-mithl. Gaps are
November means from the printed values: sunrise minus fajr, and isha minus sunset. LUPT is the 2027
November page, same MM-DD.

| Town | Surface | Rows | School | Fajr model | Fajr gap | Isha model | Isha gap | Best named fajr / isha | Fajr vs LUPT |
|---|---|---|---|---|---|---|---|---|---|
| Luton | Central Mosque | 30 | Hanafi | table | 100 | angle | 95.9 | ISNA 15/15 11/30 / 19/30 | +6.1 [3,8] |
| Brighton | Al Medinah | 30 | Shafi | table | 96.5 | angle | 93.2 | ISNA 15/15 9/30 / 19/30 | +4.7 [3,6] |
| Dudley | Dudley MCC | 30 | Shafi | table | 100.6 | angle | 97.1 | ISNA 15/15 9/30 / 16/30 | +14.6 [11,16] |
| Preston | Jamea Masjid | 30 | Hanafi | table | 100 | unreadable | - | ISNA 15/15 6/30 / - | +22.6 [18,25] |
| Middlesbrough | Central Masjid | 30 | Shafi | table | 101.6 | angle | 95.9 | ISNA 15/15 17/30 / 18/30 | +18.5 [15,22] |
| Ilford | Ilford mosque | 30 | Shafi | table | 98.3 | angle | 94.9 | ISNA 15/15 9/30 / 20/30 | +4.7 [2,6] |
| Cambridge | Central Mosque | 32 | Hanafi | table | 99.4 | angle | 91.2 | ISNA 15/15 9/32 / 27/32 | +7.0 [6,8] |
| Stoke | City Central | 30 | Hanafi | interval 112 | 112.4 | angle 15 | 101 | ISNA 15/15 5/30 / 25/30 | +5.1 [0,8] |
| Birmingham | Central Mosque | 30 | Hanafi | table | 88.4 | angle | 95.6 | ISNA 15/15 5/30 / 18/30 | +26.0 [22,28] |
| Cardiff | SWICC | 30 | Shafi | table | 103.9 | interval 83 | 83.2 | ISNA 15/15 14/30 / 2/30 | +11.8 [11,12] |
| Hull | Hull Mosque | 62 | Shafi | interval 99.5 | 99.5 | interval 80 | 79.7 | ISNA 15/15 10/62 / 0/62 | +14.6 [9,17] |
| Blackpool | Central Mosque | 30 | Hanafi | angle 15 | 103.7 | angle 15 | 103.6 | ISNA 15/15 28/30 / 27/30 | +20.5 [18,22] |
| Stockport | Islamic Centre | 30 | Hanafi | angle 15 | 102.7 | angle 15 | 102.5 | ISNA 15/15 26/30 / 28/30 | +16.3 [14,18] |
| Watford | Jamia Mosque | 30 | Hanafi | angle 18 | 117.1 | angle 18 | 119.2 | Karachi 18/18 29/30 / 28/30 | -11.9 [-14,-10] |
| Leicester | Masjid Umar | 30 | Hanafi | angle 18 | 120.6 | angle 18 | 120.5 | Karachi 18/18 30/30 / 28/30 | -8.7 [-11,-7] |
| Nottingham | Islamic Centre | 273 | Hanafi | angle 18 | 122.6 | angle 18 | 121.5 | Karachi 18/18 220/273 / 195/273 | -9.4 [-11,-8] |
| Edinburgh | Central Mosque | 30 | Shafi | angle 18 | 132 | angle 17 | 124.6 | MWL 18/17 29/30 / 28/30 | +2.2 [-1,4] |
| Aberdeen | AMIC Central | 333 | Shafi | angle 18 capped | 136.8 | angle 15 capped | 114.2 | Wifaqul 18/15 caps 319/333 / 319/333 | -1.2 [-6,1] |

The LUPT footer reads as latitude plus recipe together, so it identifies neither alone. Three towns
run early against LUPT, Watford, Leicester and Nottingham: an 18 degree dawn at 51 to 52N falls about
10 minutes before the London table's interval value in November. Birmingham's +26 is the widest, a
short interval of about 88 minutes rather than any latitude.

## The clusters

| Id | Recipe | Count | Members | Schools |
|---|---|---|---|---|
| T1 | Sunrise-table fajr (88 to 102 min, stepping) plus an angle isha near 15 degrees | 9 | Luton, Brighton, Dudley, Preston, Middlesbrough, Ilford, Cambridge, Stoke, Birmingham | 5 Hanafi, 4 Shafi |
| T2 | Sunrise-table fajr plus a fixed-interval isha of 80 to 83 minutes | 2 | Cardiff, Hull | both Shafi |
| F | ISNA 15/15 (fitted 14.5) | 2 | Blackpool, Stockport | both Hanafi |
| E | Karachi 18/18 (fitted 18.0 to 18.25) | 3 | Watford, Leicester, Nottingham | all Hanafi |
| S | MWL 18/17 (fitted 18.9/16.5) | 1 | Edinburgh | Shafi |
| W | Wifaqul 18/15 with 1/2 and 1/7 night caps | 1 | Aberdeen | Shafi |

T1 is not one table. Its fajr interval spans 88.4 (Birmingham) to 101.6 minutes, with Stoke an
outlier at a constant 112.4 (RMS 0.30 against 2.20 for any angle), and the interval differs by 3.5
minutes between towns at the same latitude (Luton 100, Ilford 98.3, Brighton 96.5). Its isha is an
angle near 15 degrees with an offset anywhere from 0 to -9 minutes (Dudley alone prefers 16). Each
mosque prints its own rows even inside the family, and a single month cannot narrow the isha angle
past a band of about four degrees.

T2 is the cleanest new form. Cardiff's isha sits 83.2 minutes after sunset as a constant (RMS 0.31
against 2.16 for the best angle). Hull's sits 80 minutes after sunset, constant at RMS 0.27, and the
interval holds across both of Hull's windows, January and November-December.

## The year surfaces

Aberdeen AMIC is the strongest single result in this job. Wifaqul 18/15 with fajr capped at half the
night and isha at a seventh reproduces **both** prayers to within one minute in every month held.

| Month | Days | Fajr exact / within 1 / worst | Isha exact / within 1 / worst |
|---|---|---|---|
| Jan | 31 | 17 / 31 / 1 | 16 / 31 / 1 |
| Feb | 28 | 15 / 28 / 1 | 13 / 28 / 1 |
| Mar | 30 | 17 / 30 / 1 | 15 / 30 / 1 |
| Apr | 30 | 21 / 30 / 1 | 14 / 30 / 1 |
| May | 31 | 16 / 31 / 1 | 11 / 31 / 1 |
| Jun | 29 | 14 / 29 / 1 | 10 / 29 / 1 |
| Jul | 31 | 21 / 31 / 1 | 15 / 31 / 1 |
| Aug | 31 | 18 / 31 / 1 | 11 / 31 / 1 |
| Sep | 1 | 1 / 1 / 0 | 1 / 1 / 0 |
| Oct | 30 | 20 / 30 / 1 | 12 / 30 / 1 |
| Nov | 30 | 15 / 30 / 1 | 17 / 30 / 1 |
| Dec | 31 | 17 / 31 / 1 | 14 / 31 / 1 |

The free portion scan returns 1/2 and 1/7 on 18/15 without being told, and no bare candidate covers
more than 252 of the 333 days. Seasonal amplitude is 299 minutes of fajr swing, Jan mean 06:12 against
Jul mean 01:13.

Nottingham is the counter-example in the same form. 18/18 bare is exact to a minute from August
through March (Jan-Mar 21/31, 20/28, 18/31 on isha). Then the recipe runs out of definition: in June,
where an 18 degree dawn does not exist at 52.95N, the install prints 01:02 to 01:10, and from April
to August isha is capped at a clock value between 22:34 and 22:50 rather than an angle. The recipe
breaks where it is undefined and the software invents the value rather than declare it.

Both year surfaces hold one year. Between-year stability is untestable here, and this report does not
claim it.

The wider map, from fits already held and not redone here: Dundee sits in W (Wifaqul 18/15 caps tops
its candidate table and the free portion scan returns 1/2 and 1/7), and Glasgow sits in E (Karachi
18/18 tops at 965, free fit 18.2/18.1). Both are consistent with this map. `uk-mosaic.json` records
the cross-check under `reference`.

## What the architecture should take

1. Recipe is not a school question. T1 splits 5 Hanafi to 4 Shafi, the Hanafi towns sit in three
   different families (T1, F, E), and the Shafi towns sit in four (T1, T2, S, W). A single
   "English-Hanafi" default would misdescribe two thirds of the sample.
2. The table form is the norm. 11 of 18 anchor fajr to sunrise as a printed interval. That is why
   the towns look alike in winter and why a same-day delta against LUPT cannot separate them: the
   form is LUPT's, the values are not.
3. The capped angle is the only year-proof family. Bare 18/18 and 15/15 are defined only where
   twilight exists, and the installs that use them print invented times when it does not. Any
   single-recipe default for the UK needs night caps, not a bare angle.
4. Fajr carries the signal. Dhuhr, asr and maghrib track the meridian and the madhab within a few
   minutes everywhere: dhuhr exact on 23 to 30 of every 30-row monthly print (Hull 58/62, and
   261/273 and 316/333 on the year surfaces), asr worst 3 minutes across all eighteen, maghrib within
   1 where the column exists. The
   mosaic is a dawn and nightfall mosaic.

## Honest negatives

- Preston's last column runs 16.5 minutes before sunset all month, so it cannot be an isha. The
  capture maps it as isha. The column is either a mis-read maghrib or a maghrib at another
  convention. Isha is excluded for Preston, fajr and the rest of the row stand.
- A monthly print resolves the model class and the family, never the angle to a degree. Named
  recipes in the table are the closest named candidate, with the free fit beside them in the JSON.
- Aberdeen's sheet holds 333 dated rows for 2026, with one September row and a sparse May and
  August. The gap is in the capture, not the fit.
- Derby does not exist in the held data. The Derbyshire lead resolved to Nottingham only.
- Birmingham, Leicester, Cardiff and Hull sit outside the brief's named list. They were fitted
  because the same capture holds them and each adds a distinct form. They are labelled here so the
  distinction is visible.
