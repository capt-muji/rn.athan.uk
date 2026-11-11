# fit10: Kemenag highland boundary, Kelantan zon tables, Burkina year-2

Three jobs the 2026-11-10 night left open, worked from the banked captures only. No network.
Timezone pinned at every run (`TZ=Asia/Jayapura`, `TZ=Asia/Kuala_Lumpur`,
`TZ=Africa/Ouagadougou`), no clock read anywhere in the fitting.

Engine: adhan 4.4.6 at `census/adhan-build`, second resolution, then explicit minute rounding
(`floor`/`ceil`/`nearest`) and a margin swept on a 0.5-minute grid. Every printed minute is
inverted against an adhan solar position, so an "implied depth" below is the sun's true
depression at the printed minute, not a back-fitted angle.

Files: `lib.mjs` (engine), `id-highlands.mjs`, `kelantan.mjs`, `burkina.mjs`,
`dhuhr-doctrine.mjs`, `august-check.mjs`, `probe-fajr.mjs` and `probe-ktn.mjs` (the angle
identifiability sweeps), `verdicts.mjs`,
`runs.log` (the numbers every claim above is quoted from), and the three evidence files
`id-highlands.json`, `kelantan.json`, `burkina.json`. `img/` holds the 4x to 9x enlargements
of the 417x590 MSBF posters that the transcription was read from.

---

## Job 1: Kemenag's 21/19 highland rule, from the banked table

Source: `indonesia/data/sihat-2026-all-cities-2dates.json`, 516 regencies, two dates
(2026-06-15, 2026-12-21), each regency at its own coordinate and its own zone (WIT for all
seven). For every regency and both dates the printed fajr and isha were inverted to sun
depression.

### Result: CONFIRMED. Exactly six, and Deiyai is outside.

| Regency | Elevation | fajr depth | isha depth | isha - maghrib | class |
|---|---|---|---|---|---|
| Puncak Jaya | 2422 m | 20.53 | 19.44 | 74 / 75 min | 21/19 |
| Puncak | 2346 m | 20.58 | 19.50 | 74 / 75 | 21/19 |
| Intan Jaya | 2168 m | 20.52 | 19.47 | 74 / 75 | 21/19 |
| Lanny Jaya | 2001 m | 20.56 | 19.53 | 75 / 75 | 21/19 |
| Pegunungan Arfak | 1960 m | 20.53 | 19.46 | 74 / 75 | 21/19 |
| Paniai | 1786 m | 20.54 | 19.44 | 74 / 75 | 21/19 |
| Deiyai | 1718 m | 19.54 | 18.52 | 70 / 71 | 20/18 |
| Jayawijaya (control) | 1668 m | 19.57 | 18.48 | 70 / 71 | 20/18 |
| national median, 510 regencies | various | 19.57 | 18.47 | 70 / 71 | 20/18 |

Measured deltas against the national median of the other 510 regencies:

- fajr depth **+0.97 deg**, isha depth **+1.00 deg**. Taking each regency's median of the two
  dates, the six run fajr 20.52 to 20.58 and isha 19.44 to 19.53; the other 510 run fajr
  19.46 to 19.68 and isha 18.36 to 18.59. The populations do not overlap: nothing in the 516
  lands between 19.68 and 20.52 on fajr, or between 18.59 and 19.44 on isha.
- Clock proof, independent of any ephemeris: `isha - maghrib` prints 74 or 75 minutes at all
  six, and 70 or 71 at Deiyai and Jayawijaya. A 1 deg deeper isha is 4 minutes at this
  latitude, and the printed gap carries exactly those 4 minutes.

Pooled margin fits (all 12 deep days, all 1020 normal days):

| Test | fajr exact | isha exact |
|---|---|---|
| the six at 21/19, +2 min floor | 12/12 | 12/12 |
| the six at 20/18, best margin | 10/12 | 7/12 |
| the other 510 at 20/18, +2 min floor | 1015/1020 | 1007/1020 |
| the other 510 at 21/19 | 558/1020 | 533/1020 |
| Deiyai alone at 20/18, +2 min floor | 2/2 | 2/2 |

The national pair is 20/18 with a +2 minute margin on both twilights (the offset the record
already carries), so the 19.57/18.47 depths are the 20/18 nominal angles seen through that
margin. Add 1 deg to the six and the +2 minute margin reproduces all 12 cells exactly.

### The boundary sits between 1718 m and 1786 m

Every regency at or above 1500 m was listed: Puncak Jaya, Puncak, Intan Jaya, Lanny Jaya,
Pegunungan Arfak, Paniai run deep; Deiyai (1718), Jayawijaya (1668), Tolikara (1571) and
Dogiyai (1544) do not. The threshold is in (1718, 1786] m, which matches the "about 1750 m"
wording on record. Paniai at 1786 m is the lowest-elevation member; Deiyai at 1718 m is the
highest-elevation non-member. There is no seventh member anywhere in the 516.

**Elevation is used, but not for this.** The printed sunrise implies a horizon depression of
2.4 to 2.5 deg at every highland regency, tracking the stated elevation (2422 m gives 2.41,
1718 m gives 2.16 by the dip formula, both inside the one-minute print noise). So the table
does compute at elevation for the horizon, while the 21/19 step is a discrete policy flag on
top. Nothing about 21/19 follows from the dip. This agrees with the sea2 finding that
Muhammadiyah prints plain 18/18 at Puncak Jaya's own 3396 m: the deepened pair is Kemenag
policy alone.

### Checks against a single reading

The table was parsed once and inverted once, so the cross-checks below stand in for a second
read of the same cells:

- the clock-only witness `isha - maghrib`, which involves no ephemeris at all, separates the
  two groups by the same 4 minutes the depression angles do;
- the pooled fit over 1032 regency-days puts the same +2 minute margin on both groups, so the
  1 deg step is the only difference between them;
- the date-to-date spread within a regency is at most 0.15 deg (0.6 minute of print), far
  inside the 0.84 deg gap between the groups; no cell needed adjudication.

---

## Job 2: Kelantan's zon tables

### Transcription: BLOCKED, no table exists in the workspace

The brief states that `sea2/captures/` holds the Jabatan Mufti monthly zon1/zon2 images.
It does not. `sea2/captures/` holds 18 files and no image of any kind (`ls`, then a `find`
for jpg/jpeg/png/webp over the whole `sea2` tree, then the same over the whole `o1k-wide`
tree filtered on mufti/kelantan/ktn/zon/msia/malay: one hit, an unrelated crop in
`centralasia2`). `thmsg/captures/` (the Malaysia pass) holds JAKIM, Selangor, Penang, WP and
Singapore material, no Kelantan table. What the earlier pass banked is the *pointer*: notes
that `facebook.com/MUFTIKELANTAN` posts monthly tables as images, with two 1441H/2020M post
URLs and a Ramadan 1447 snippet.

No transcription is therefore offered. Zon 1 and zon 2 of the mufti's own table remain
unread, and the fit question "is each zone the JAKIM recipe or its own" cannot be answered
from evidence in hand. Recording a table from memory or from the search snippet would break
the double-check rule, so it is not done.

### What can be measured: the KTN01 comparator, all 365 days

From `sea2/captures/msia-ktn01-tahunan-2026.html` (the annual mirror of JAKIM zon KTN01,
365 rows, imsak through isyak), fitted at 6.1200 N / 102.2400 E:

| Column | Measured convention | Best fit |
|---|---|---|
| subuh | sun at 17.64 deg (17.49 to 17.80) | 17.4 deg, margin -1, floor, 345/365 exact, 365/365 within 1 |
| syuruk | sunrise | 0.5 deg, margin +1, 203/365 exact, 365/365 within 1 |
| zohor | true noon +2.57 min (2.10 to 3.09) | one constant for the month |
| asar | Shafi, printed 0 to +4 min above the instant | 189/365 exact, 365/365 within 1; Hanafi refuted (worst 67 min) |
| maghrib | sunset +2 min | 201/365 exact, 365/365 within 1 |
| isyak | sun at 17.36 deg (17.18 to 17.51) | 15.95 deg +6 min, 334/365 exact, 365/365 within 1 |
| imsak | subuh - 10 min exactly, all 365 days | exact |

Reading, stated at the width the evidence supports (`probe-ktn.mjs` sweeps the margin for a
fixed angle):

- **subuh**: every angle from 17.0 to 19.0 deg reproduces all 365 days within 1 minute once
  the margin is free (17.4 deg is the best at 345/365 exact). 20 deg, the value JAKIM prints
  for its general zones, is out by 5 minutes and is excluded. So Kelantan's fajr is a
  shallower angle than the national default, and 18 is comfortably inside the band.
- **isyak**: 16.5 to 18.0 deg all fit within 1 minute, 18.5 deg and deeper are excluded. So
  the recorded 18 is inside the band, and the 17 deg KTN02 exception value is NOT separable
  from it at one-minute print resolution. The point best supported is 17.4 to 17.6.
- everything else is sharp: Shafi asr (not Hanafi), maghrib at sunset, imsak at subuh minus
  10, and dhuhr at noon +2.6 minutes as a monthly block.

### The flagged +1 minute

Sample: the mufti-attributed 2026-03-18 post, subuh 06:10, syuruk 07:18.
Comparator: KTN01 2026-03-18 as printed in this file's own parse: imsak 05:59, subuh 06:09,
syuruk 07:17, zohor 13:22, asar 16:32, maghrib 19:24, isyak 20:29.

The +1 lands on subuh and syuruk together. A twilight angle cannot move syuruk: sunrise is
geometry. So the delta is a column or clock convention, not a recipe difference, and the
"different recipe" reading is closed. It cannot be pinned further: one sample from a
third-hand mirror cannot separate a one-minute whole-table offset (0.25 deg of longitude,
plausible because zon1's reference point is a zone centroid, not Kota Bharu town) from a
morning-pair convention of one minute. The mufti's own zon1 table settles it, and that table
is not in the workspace.

---

## Job 3: Burkina Faso, year 2

### The transcribed month: October 2025, 1447 edition

Read from `sahel2/captures/msbf-1447-annual-page4.jpg` (rows 1 to 22 October) and
`page5.jpg` (rows 23 to 31 October), each enlarged 4x to 9x. Every October row was read
twice, from the raw enlargement and from a second crop at higher magnification: the two
reads agree on all 310 printed cells of the month. The printed weekday was used as an
independent binding check: 1 October 2025 is Wednesday and the row says Mercredi; 23 October
is Thursday and the row says Jeudi; 31 October is Friday and the row says Vendredi. All 31
rows reproduce the 2025 calendar, so the Gregorian binding of the month is not in doubt.

The poster carries its own note under the table: "Des ajustements pourraient etre apportes
aux heures de Fajr et nous vous en tiendrons informes" (adjustments may be made to the Fajr
hours). The fajr column is the one the federation reserves the right to tune, which is
consistent with the 5-minute move found below.

October 2025, Ouagadougou, azan and iqama (full rows in `burkina.json`):

| Date | Fajr | Dhuhr | Asr | Maghrib | Isha |
|---|---|---|---|---|---|
| 01 | 04:51 05:05 | 12:25 12:40 | 15:15 15:30 | 17:56 18:03 | 19:20 19:35 |
| 05 | 04:51 05:05 | 12:25 12:40 | 15:15 15:30 | 17:54 18:03 | 19:20 19:35 |
| 10 | 04:51 05:05 | 12:25 12:40 | 15:15 15:30 | 17:51 18:00 | 19:15 19:30 |
| 15 | 04:51 05:05 | 12:25 12:40 | 15:15 15:30 | 17:49 17:56 | 19:15 19:30 |
| 20 | 04:51 05:05 | 12:25 12:40 | 15:15 15:30 | 17:45 17:52 | 19:15 19:30 |
| 23 | 04:51 05:05 | 12:25 12:40 | 15:10 15:25 | 17:44 17:51 | 19:10 19:25 |
| 27 | 04:52 05:05 | 12:25 12:40 | 15:10 15:25 | 17:42 17:51 | 19:10 19:25 |
| 31 | 04:52 05:05 | 12:25 12:40 | 15:10 15:25 | 17:41 17:48 | 19:10 19:25 |

Comparator month: October 2021, page 10 of `msbf-heures-priere-2021.pdf`'s text layer, 31
rows, weekday check also clean (1 October 2021 is Friday and the row says Vendredi).

### Between-year test: one recipe holds, with one change

Per-date clock difference, 2025 minus 2021, over all 31 days:

| Column | Delta | Days |
|---|---|---|
| fajr | +5 | 31 |
| dhuhr | 0 | 31 |
| asr | 0 or +5 | 27 / 4 |
| maghrib | 0 or +1 | 29 / 2 |
| isha | +5 or +10 | 18 / 13 |

Column models, both editions:

- **maghrib** is the sunset instant. 31/31 within 1 minute in both years, 18/31 exact each,
  at margin +1 floor. Identical parameter, stepped day by day.
- **asr** is Shafi, printed as a coarse block on a 5-minute grid. Identical parameter; the
  block holds up to 4 minutes above the computed Shafi instant and 1 minute below it at its
  end (2025: computed 15:15 falling to 15:11, printed 15:15 throughout, then the block
  changes to 15:10 when the computed value reaches 15:11). The block changed on 19 October
  in 2021 and on 23 October in 2025, which is the only reason four days differ.
- **dhuhr** prints the same 12:25 block in both years, the same minute on all 31 days.
- **fajr** is the same twilight angle in both years. The printed fajr is 17.6 deg with margin
  -1 in 2021 (31/31 exact) and the same 17.6 deg with margin +4 in 2025 (31/31 exact). At
  17.8 deg the 2021 fit degrades to 28/31, so 17.6 is pinned to about 0.1 deg, and the whole
  5-minute difference is the margin.
- **isha** is not an angle in either edition: it is a hand-set walk of 5-minute blocks, 19:15
  then 19:05 in October 2021, and 19:20, 19:15, 19:10 in October 2025. Its implied depth
  therefore drifts inside each block (20.36 deg median in 2021, 22.00 in 2025) and only the
  clock value is comparable. In October the 1447 walk sits 5 to 10 minutes later with one
  extra step; in August it walks the identical values (19:45 down to 19:25) with boundaries
  one or two days apart. So the walk was re-set in 1447, not shifted by a fixed amount.

Column resolution, identical in both editions: maghrib is computed day by day; dhuhr is one
constant for the month; fajr, asr and isha are coarse blocks that hold for one to four weeks
without fixed alignment to the Hijri month (2025 changes at 23 October, a month start; 2021
changes at 19 and 10 October, both mid-month). Fajr sits on a 1-minute grid, asr and isha on
a 5-minute grid. Over one October at 12 N the true fajr moves one minute, so a single printed
minute reproduces all 31 days and the angle is pinned to about ±0.12 deg.

**Verdict: one parameter set holds, with a fixed 5-minute addition on fajr.** Every
sun-anchored column is identical to the minute across the four years: the same dhuhr block,
Shafi asr, and maghrib at the sunset instant. The fajr is the same twilight angle in both
editions (17.6 deg, margin -1 in 2021 and +4 in 2025, 31/31 exact each) and the 1447 edition
prints it 5 minutes later on every day. The margin matters to the fit: one margin carried
across both editions misses every 2025 day by exactly 5 minutes, so the 2021 recipe no longer
describes the 1447 edition. That is Burkina's year-2 evidence: same federation, same solar
parameters, a deliberate 5-minute later fajr.

A second month confirms it (`august-check.mjs`, August 2025 from poster pages 2 and 3 against
August 2021 from the annual's page 8, 29 days): fajr is +5 on 25 days and +4 or +6 on the
four block-edge days, never anything else. Isha over the same month is 0 on 24 days and +5 on
5, because the two editions walk the same block values with boundaries one or two days
apart: 19:45, 19:40, 19:35, 19:30, 19:25 in both, against 19:20 down to 19:10 in October.

### The dhuhr +33 doctrine, settled

The record holds that six byte-identical Ouagadougou platform records sit at dhuhr = noon
+33, and asks whether that is doctrine or data entry. All 12 months of the 2021 annual were
parsed (365 rows):

| Months | Printed dhuhr azan | Offset against true noon |
|---|---|---|
| Jan, Feb, Mar, Jun, Jul, Aug | 12:30 | mean +10.2 to +23.2 |
| Apr, May (the two Ramadan months) | 12:45 | mean +38.8, +42.2 |
| Sep, Oct, Nov, Dec | 12:25 | mean +24.0, +33.0, +33.7, +23.1 |

The printed dhuhr is a clock block, not a noon offset: it holds 12:30 for six months, drops
to 12:25 for the last four, and rises to 12:45 for the Ramadan months. Its offset against
true noon therefore swings from +10.2 (February) to +42.2 (May) across the year, mean +24.8.
October measures +33.0 and November +33.7, which is exactly where the platform records were
sampled. **Noon +33 is the platform's normalisation at the season of capture, not the
federation's printed doctrine**; the federation prints a fixed clock block and adds 15
minutes in Ramadan.

---

## Honest negatives and what would close them

- **Kelantan transcription**: no mufti table in the workspace. Closing it needs one captured
  monthly zon1 and zon2 poster pair (any month, any year). Until then the zon split, the
  recipe comparison and the +1 flag stay open, with the flag's *kind* settled (non-angular).
- **Kemenag boundary**: verified on two dates only, because the banked table carries two
  dates. Nothing suggests date dependence (both twilights scale with the seasonal geometry
  and the +2 minute margin is stable), but a two-date table cannot prove constancy across the
  year. A third date at high declination would.
- **Burkina**: two months per edition (October fully transcribed, August for the two
  twilight columns and the block walks). The eight remaining months of both editions were not
  transcribed. The 2021 annual gives the full-year doctrine check and it is consistent; a
  third month would only re-confirm the +5.
