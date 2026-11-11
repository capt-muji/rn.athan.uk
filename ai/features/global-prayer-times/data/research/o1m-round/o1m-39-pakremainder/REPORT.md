# O1m-39 - Pakistan chart remainder: Quetta's later panels, three new templates, the second edition

Wave O1m-39, round o1m, 2026-11-11. Workspace `$HOME/athan-gitree/census/o1m/o1m-39-pakremainder/`.
Nothing in the repository was touched. Captures are in `captures/`, dated rows in `data/`, fits in
`fit/`.

## 1. Headline

The four charts O1m-28 could not read are read, and the directory that carries them turns out to hold
**two scans of every one of twelve charts**. Both findings overturn something the round had recorded.

Quetta's later panels were never a column problem. The o1m-28 note said the chart gains an extra
leading column from April; it does not. All twelve panels carry eight columns and the day column is
the first one in every month, labelling every day of every month. April to December failed for two
different reasons, both now measured: the chart prints **zuhr on a 12-hour dial**, so a May zuhr of
13:34 prints as `1:34` and the old row rule read it as 01:34; and the chart prints a **+60 minute clock
block from 3 April to 29 October inclusive**, a daylight-saving convention applied to all seven
columns. Remove both and Quetta fits at **mean absolute error 0.33 to 0.44 minutes per column with
zero cells beyond four minutes** in 2,466 read cells.

| Measure | Value |
| --- | --- |
| Charts decoded this wave | 4 unread (Quetta, Mardan, Swat, Peshawar) |
| Second editions decoded | 12 charts x 2 scans, 29,242 cells compared, **0 differing** |
| Chart cities on the publisher's directory | 29, none unseen |
| Cells read, four new charts | 2,466 (Quetta) + 2,472 (Mardan) + 2,541 (Swat) + 2,500 (Peshawar) |
| Cells beyond four minutes after margin | **0** in all 16 fits |
| Margin sets | 13 measured half-minute vectors, **four genuinely different tables** |
| Angle pair | 18.0 fajr / 18.0 isha, Hanafi, at all 29 cities |
| Federal chart | still the 2016 PDF, byte identical |

## 2. Quetta - the column map that was not a column map

`Quetta.pdf`, native page 2263 x 5502, four bands of three month panels. The generalised grid reader
(`pipeline/chart2.py`) resolves the panel borders inside each band and lets a panel carry any number
of columns. Quetta resolves to **eight slots in every one of the twelve panels**, and the day column
labels every day of every month in the self-labelling test (scores 28 to 31, which is each month's own
day count):

```
day column slot per month: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                           (scores [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31])
```

Column order, left to right, printed in the header of every panel and confirmed by the fit:
**Date | Fajr | Sunrise | Zawal Begins | Zuhr | Asr | Maghrib | Isha**. The third time column is
labelled `Zawal Begins`, the start of the forbidden time about 42 minutes before noon, which is why
it carries no prayer value. There is no ninth column in any panel, and no panel whose day column sits
anywhere but first.

What broke April to December:

1. **The 12-hour dial is not uniform across the family.** Rawalpindi's chart prints zuhr as `11:58`
   in winter and `12:12` in summer, so a rule that leaves zuhr alone works there. Quetta's zuhr runs
   12:2x to 12:4x in standard time and **1:2x to 1:4x inside the clock block**, because Quetta sits
   eight degrees west of the meridian. A zuhr of `1:34` read as 01:34 is 720 minutes out. **210
   zuhr cells** are printed in that form.
2. **A +60 minute clock block.** Every column in every panel of April, May, June, July, August,
   September and October is printed one hour later than the same chart's winter panels. The block is
   exact at both edges:

```
sunrise residual against adhan 4.4.6 at 30.1841 N 66.9966 E:
 3/28 4.5   3/29 3.7   3/30 3.9   3/31 4.1   4/1 4.3   4/2 3.5
 4/3 63.7   4/4 63.9   4/5 64.1   4/6 64.3
10/25 64.3 10/26 64.6 10/27 64.9 10/28 64.1 10/29 64.4
10/30 4.6  10/31 4.9  11/1 4.1   11/2 4.3   11/3 4.6
```

The switch is at midnight on 3 April and back at midnight on 30 October. That is a daylight-saving
convention, not a meridian: a longitude error would shift all twelve months and this block switches
on and off with the month. The switch dates match no Pakistani daylight-saving window this session
could verify, so the chart's year stays unknown: it is a DST-era artefact and the block is the only
trace of the era in it. **It is a defect of the chart, not of the capture**, and it is the reason 926
cells in the o1m-28 pass sat beyond four minutes.

### Quetta fit

Engine adhan 4.4.6, `Rounding.None`, tz `Asia/Karachi`, Hanafi, dates built from the chart's own
month-day grid at reference year 2026. One column of the seven is discarded: zawal is the start of the
forbidden time before noon, not a prayer, and the chart prints no Shafi asr beside the Hanafi one.
Printed clock block removed before scoring.

**Recipe: 18.0 / 18.0 Hanafi; margins fajr +4, sunrise +4, zuhr +5, asr +4.5, maghrib +7.5, isha +5.**

| column | exact | within 1 | worst | mae |
| --- | --- | --- | --- | --- |
| fajr | 231/335 | 329/335 | -1.25 | 0.37 |
| sunrise | 262/359 | 358/359 | +1.05 | 0.34 |
| zuhr | 277/358 | 355/358 | -1.08 | 0.33 |
| asr | 252/356 | 347/356 | +1.37 | 0.37 |
| maghrib | 267/355 | 350/355 | +1.17 | 0.34 |
| isha | 207/349 | 334/349 | -1.37 | 0.44 |

all six within one minute on 260/365 days (71.2 percent); **residuals beyond four minutes: 0**. Named
gaps: 89 cells of 2,555 (3.5 percent), scattered singles rather than one column.

The margins are a flat **+4 minute pad on every column** with maghrib carrying +7.5, so the chart's
clock sits four minutes late all year. That is a different table from the archive.org Quetta print
O1l-21r fitted, which carried no fajr pad, +1 on dhuhr and +2 on maghrib and isha, and whose **asr does
not reproduce** (a smooth +/-5 minute annual swing).

**This Quetta chart's asr does reproduce**: median residual +4.5, mean 4.6, worst 1.37, and the
quarter medians run 4.38 | 4.38 | 4.92 | 4.80. The asr anomaly belongs to the archive.org print
alone, not to Quetta as a city. The flag O1l-21r raised is now bounded: one of Quetta's two charts
computes asr by a different route, and this one does not.

## 3. Mardan - the family template, unmodified

`Mardan.pdf`, native 2272 x 5356, four bands of three panels, eight columns, same as the 25 charts
O1m-28 banked. It failed that wave because the page's vertical rules stop at each band boundary, so a
whole-page column profile never reaches the 0.80 threshold the old reader used. Measured inside a band,
the borders are at full strength and the grid resolves immediately.

**Recipe: 18.0 / 18.0 Hanafi; margins fajr -0.5, sunrise -0.5, zuhr +0.5, asr +0.5, maghrib +3.5,
isha +0.5** - the family's main template digit for digit.

| column | exact | within 1 | worst | mae |
| --- | --- | --- | --- | --- |
| fajr | 259/362 | 345/362 | +1.65 | 0.37 |
| sunrise | 252/355 | 340/355 | +1.63 | 0.39 |
| zuhr | 298/365 | 365/365 | -0.80 | 0.29 |
| asr | 242/360 | 352/360 | -1.17 | 0.40 |
| maghrib | 262/365 | 358/365 | -1.23 | 0.37 |
| isha | 190/300 | 285/300 | -1.30 | 0.42 |

all six within one on 248/365 (67.9 percent); beyond four minutes: 0. Gaps: 90 cells, of which **61
are the isha column of the October and December panels, physically clipped by the publisher's page
edge** - the scan ends mid-value (`6:3` with the last digit off the sheet). Those 61 stay named gaps.

## 4. Swat - the chart was computed elsewhere

`Swat.pdf`, native 2575 x 5314, same eight-column template, same band-rule problem as Mardan. Read at
the gazetteer point for Mingora (34.7717 N 72.3600 E) the table fits badly: fajr mean absolute error
1.08 minutes, quarter medians -0.82 | -3.35 | -2.08 | -0.45, all six within one on 74/365 days. Fajr
and sunrise run **early** in summer while maghrib and isha run **late**, and zuhr sits at zero all
year - the signature of a latitude, not a clock: the printed summer day is longer than Mingora's.

A latitude sweep is decisive. At **35.25 N, 72.40 E** the same recipe halves the scatter:

| point | fajr mae | all six within 1 |
| --- | --- | --- |
| 34.7717 N 72.3600 E (Mingora) | 1.08 | 74/365 |
| 35.20 N 72.40 E | 0.44 | 285/365 |
| 35.25 N 72.40 E | 0.44 | 285/365 |
| 35.60 N 72.40 E | 0.85 | 71/365 |

Longitude is flat from 72.0 to 72.8 (mae 0.39 to 0.40 either way). 35.25 N is the latitude of Bahrain
in northern Swat district; Mingora is 0.45 degrees south of it. The chart is a Swat-district table
computed from a northern point. **Flagged, not adjudicated** - the chart names no place, and identity
rests on the publisher's filename exactly as it does for the other 28.

**Recipe at 35.25 N 72.40 E: 18.0 / 18.0 Hanafi; margins fajr -1, sunrise -0.5, zuhr 0, asr 0,
maghrib +3, isha 0.** All six within one on 285/365 (78.1 percent), beyond four minutes: 0, mae 0.31
to 0.45. An angle sweep at that point keeps 18/18: 18.5 costs 85 all-six days and 17.5 costs 41, while
both keep mean error inside 0.08 minutes, so the angle pair is not separable from its neighbours.

One defect of the printed page: the isha column of the **March, June, September and December panels is
printed in a face three times the size** of every other column (36 pixel digits against 12), spilling
across its rule. Glyph clustering cannot name those digits, and the local reader's second pass read
them wrongly when it read them at all, so **122 cells of that scan stay unreadable**. The `-n-t` scan
of the same chart prints the column in the normal face throughout and recovers every one of them; the
union's remaining gaps are 21 scattered cells, 4 of them isha.

## 5. Peshawar - a second witness, and the two witnesses disagree

`Peshawar.pdf` is a different artefact from the rest: one PDF page carrying a **726 x 1708 JPEG**, about
six pixels per digit. Glyph clustering is impossible at that size (the day column scores 22 of 31 and
cells merge two digits into one blob). The local Vision reader reads a whole table row cleanly at 8x,
so every row was cut on the grid and read as one line, with each value gated against the median of
the six neighbouring days in its own column. Result: **2,500 of 2,562 cells (97.6 percent)**, 358 dated
days, and **zero cells beyond four minutes**.

Two cells needed their own re-crop: 16 and 17 May asr, where the reader had put a leading `1` on `5:05`
and made it `15:05`. Re-read at 10x from the page, both are `5:05`. They are recorded in
`work/Peshawar.repairs.json` and applied by the row builder, not silently patched.

**Recipe: 18.0 / 18.0 Hanafi; margins fajr 0, sunrise 0, zuhr +0.5, asr +0.5, maghrib +3.5, isha +0.5.**

| column | exact | within 1 | worst | mae |
| --- | --- | --- | --- | --- |
| fajr | 233/358 | 345/358 | -1.33 | 0.40 |
| sunrise | 250/358 | 351/358 | +1.28 | 0.37 |
| zuhr | 278/358 | 358/358 | +0.90 | 0.31 |
| asr | 232/352 | 343/352 | +1.12 | 0.38 |
| maghrib | 236/358 | 351/358 | -1.27 | 0.38 |
| isha | 209/358 | 331/358 | -1.30 | 0.47 |

all six within one on 302/358 (84.4 percent), the best of the four. Gaps: 62 cells, 49 of them the day
31 row of seven bands, which sits on the band's bottom rule and is not readable at any scale.

**The disagreement.** O1l-21r decoded Peshawar from the archive.org 19-column poster and fitted
**maghrib at sunset +1 and isha +1 with no other pad**. This chart is the family's main template:
**maghrib +3.5, isha +0.5, zuhr +0.5, asr +0.5, fajr 0**. Same angle pair, same city, two printed
tables two and a half minutes apart on maghrib. That is Karachi's shape repeating. A second witness splits this city
rather than confirming it. Neither chart is authority; both are community prints.

## 6. The publisher's directory, enumerated

The directory has no index (403 on the directory itself, recorded in
`captures/ilmkidunya-directory-index.html`), so enumeration is name probing. **136 district and city
names in both naming forms, 272 HEAD requests** (`captures/ilmkidunya-probe-all.txt`):

- 41 files return 200, all served as `application/pdf`;
- 231 return 404;
- the 41 files carry **29 names**, 28 of which are charts and one of which is a board notification;
  and 12 of the 28 chart cities carry **both** the plain and the `-n-t` form.

Every one of those cities was already known to the round. The "20-plus unclaimed charts" O1m-28
projected do not exist: the directory's ceiling is the 29 cities this family already holds, and 25 of
them were already banked. What the full enumeration did find is the **second edition** of twelve
charts, which O1m-28 missed because it probed one naming form per city.

| what the enumeration found | count |
| --- | --- |
| Head probes | 272 |
| Files served (200) | 41 |
| Chart cities | 29, counting Faisalabad's separately named file |
| Cities with two scans | 12 |
| New cities | 0 |
| False positives | 1 (`Malakand.pdf` is a BISE Malakand examination notification) |

**The two editions are one table.** All twelve pairs were decoded independently, and across 29,242
cells both scans read there are **zero differences** (`captures/edition-pairs.txt`). The native images
are separate scans, not one file under two names: Attock 2575 x 5346 against 2324 x 5450, Sukkur
2324 x 5418 against 2600 x 5340, and so on for every pair. Under the round's grading rule that makes
them **one computed generation and never a second witness**.

**What the second scan is good for is coverage.** Each scan loses cells the other keeps. Uniting them
recovers **1,394 cells** (622 that only the `-n-t` scan reads, 772 that only the plain scan reads),
which takes every one of the twelve cities above 99 percent of its 2,562 cells. The union rows are in
`data/<city>-perpetual-rows-union.json` and `data/second-edition-index.json`; **every cell present in
both scans is identical**, so the union supersedes the O1m-28 file for those twelve cities without
changing a single value.

### Decode status of the twelve paired charts

Cells read out of 2,562 per chart (366 chart days x 7 columns). The two scans are separate
photographs of one printed master, so their losses fall in different places.

| City | plain edition | -n-t edition | united |
| --- | ---: | ---: | ---: |
| Attock | 2,494 | 2,537 | 2,554 |
| Bahawalnagar | 2,555 | 2,409 | 2,555 |
| Bahawalpur | 2,541 | 2,415 | 2,554 |
| Gujranwala | 2,555 | 2,529 | 2,555 |
| Jhang | 2,494 | 2,518 | 2,553 |
| Jhelum | 2,555 | 2,388 | 2,555 |
| Nawabshah | 2,433 | 2,530 | 2,553 |
| Okara | 2,433 | 2,543 | 2,552 |
| Sargodha | 2,433 | 2,531 | 2,554 |
| Sialkot | 2,555 | 2,548 | 2,555 |
| Sukkur | 2,555 | 2,415 | 2,555 |
| Swat | 2,411 | 2,501 | 2,541 |

**Faisalabad's provenance is repaired.** It is the one chart city the name probe could not reach.
O1m-28 banked Faisalabad
from a mirror and recorded that `Faisalabad-n-t.pdf` and `Faisalabad.pdf` both 404. The chart is on the
directory under a third name, `Faisalabad-namaz-timing.pdf`, which is why the 136-name probe in the two
standard forms did not reach it. Its native image is **byte identical** to the mirror O1m-28 used
(sha256 `cda1d659.`), so the mirror's city identity now rests on the publisher's own file.

## 7. The family verdict, extended

29 cities: the 25 O1m-28 banked, 11 of them re-fit here from the united editions, and the four this
wave read (Quetta, Mardan, Swat, Peshawar). Full numbers per city in
`fit/pakremainder-fit.json`, and the assembled family table in `fit/family-margins.json`.

| City | Days | fajr | sunrise | zuhr | asr | maghrib | isha | all-six | >4 min |
| --- | ---: | --- | --- | --- | --- | --- | --- | ---: | ---: |
| Quetta | 365 | +4 | +4 | +5 | +4.5 | +7.5 | +5 | 71.2% | 0 |
| Mardan | 365 | -0.5 | -0.5 | +0.5 | +0.5 | +3.5 | +0.5 | 67.9% | 0 |
| Swat (35.25 N) | 365 | -1 | -0.5 | 0 | 0 | +3 | 0 | 78.1% | 0 |
| Peshawar | 358 | 0 | 0 | +0.5 | +0.5 | +3.5 | +0.5 | 84.4% | 0 |
| Attock | 365 | -0.5 | -0.5 | +0.5 | +0.5 | +3 | +0.5 | 81.4% | 0 |
| Bahawalnagar | 365 | -0.5 | -0.5 | +0.5 | 0 | +3.5 | +0.5 | 80.3% | 0 |
| Bahawalpur | 365 | -0.5 | 0 | +0.5 | +0.5 | +3.5 | +0.5 | 83.3% | 0 |
| Gujranwala | 365 | 0 | 0 | +0.5 | +0.5 | +3.5 | +0.5 | 80.8% | 0 |
| Jhang | 365 | -0.5 | -0.5 | +0.5 | +0.5 | +3.5 | +0.5 | 86.8% | 0 |
| Jhelum | 365 | -0.5 | -0.5 | +0.5 | +0.5 | +3.5 | +0.5 | 79.7% | 0 |
| Nawabshah | 365 | 0 | 0 | +0.5 | +0.5 | +3.5 | +0.5 | 94.5% | 0 |
| Okara | 365 | -0.5 | -0.5 | +0.5 | +0.5 | +3.5 | +0.5 | 84.1% | 0 |
| Sargodha | 365 | -0.5 | 0 | +0.5 | +0.5 | +3.5 | +0.5 | 86.3% | 0 |
| Sialkot | 365 | +2.5 | +2 | +2.5 | +2.5 | +5.5 | +2 | 27.7% | 0 |
| Sukkur | 365 | -0.5 | -0.5 | +0.5 | +0.5 | +3 | +0.5 | 89.9% | 0 |

The twelve re-fits are of the same tables O1m-28 fitted, now with every cell both scans can supply;
their margins move by half a minute at most and their all-six counts rise.

### One angle pair, four tables

**The angle pair does not vary.** 18.0 fajr and 18.0 isha with the Hanafi asr is the best or within
0.02 minutes of the best at all four new charts, and O1m-28 established it for the other 25. Quetta
prefers 18.25 by 0.01 minutes, which is one sixtieth of the print resolution and not separable, exactly
as O1l-21r found for the archive.org Quetta print.

**The margins cluster into one template with three exceptions.** Against the template fajr -0.5,
sunrise -0.5, zuhr +0.5, asr +0.5, maghrib +3.5, isha +0.5, **26 of the 29 cities sit within half a
minute on every column**. The maghrib pad is printed at +3.0 in six of them and at +3.5 elsewhere, and
those six also carry asr and isha at 0.0 rather than +0.5. Measured at the chart's own one-minute
precision the 29 cities produce **13 distinct half-minute margin vectors**, which is printer rounding,
not method: **four tables are genuinely different**:

1. **The main template** (26 cities, including all three new templates: Mardan, Swat and the ilmkidunya
   Peshawar). One shape, maghrib at sunset plus 3 to 3.5 minutes and half a minute elsewhere.
2. **Quetta** - a flat +4 minute pad on every column and +7.5 on maghrib. Its own table, but the same
   astronomical content to a third of a minute.
3. **Sialkot** - the Islamic Academy hand table: a +2 to +2.5 block on the twilight columns, zuhr still
   365/365 within a minute, and quarter medians that wander by two minutes across the year. Its
   within-one scores (203/365 fajr) are three times worse than any computed chart in the family.
4. **Hyderabad** - the -4.5 to -5.5 uniform offset O1m-28 flagged, which is a meridian of about 1.1
   degrees east, not a margin set. It survives the re-fit unchanged.

**The federal dhuhr convention is still absent.** 13:00/13:15 matches **0 of 365 days in every one of
the 16 charts fitted here**, Quetta included. Dhuhr is solar noon plus half a minute everywhere in the
provincial layer.

**Grades.** Every chart in this family is one undated published cycle, designed never to be superseded:
**provisional** for all four new ones, and no A grade is available because no year-2 exists by
construction. The two editions of a chart are one generation and do not lift anything.

**Seasonal amplitude** for the fit index: Quetta fajr 116 minutes Jan to Jul (maghrib 99, isha 109);
Mardan 138 (117, 129); Swat 143 (121, 136); Peshawar 137 (116, 129) - the northern charts swing widest,
as the latitude framing says they should.

## 8. The federal register

Re-probed **2026-11-11T13:00:29Z** (`captures/mora-reprobe.txt`).
`https://mora.gov.pk/SiteImage/Publication/New_Chart_2016_One.pdf` returns 200, 6,600,971 bytes,
sha256 `9babc428ffb200c4d6a5b354dac60642d7d0bbfd1f3ca2e9aa4f38c9013b2254` - **byte identical** to the
03:39Z and 12:20Z captures. The 2025-11 approved unified timetable for 2026 is still unpublished.

## 9. Capture inventory

| Artefact | Count | Size |
| --- | --- | ---: |
| Publisher PDFs | 41 chart files + 1 duplicate-name Faisalabad file | 138 MB |
| Native page images | 42 | 119 MB |
| Directory probe log | 272 probes | - |
| Directory index attempt (403) | 1 | - |
| Federal register re-probe | 1 PDF + log | 6.6 MB |

Every file is public, reached with a browser user agent. No form, login, account or captcha was
involved anywhere.

## 10. Defects, negatives, and what is not proven

1. **No unseen city is on the publisher's directory.** 29 cities is the ceiling and all 29 are known.
   The negative is bounded: it covers the 136 district and city names probed in both naming forms,
   searched in English spellings only; a chart filed under a village or a spelling outside that list
   would be missed. The directory 403s, so there is no index to read instead.
2. **The two editions are one generation.** Twelve pairs, 29,242 cells compared, zero differences.
   No second witness, and the union adds coverage, not independence.
3. **Quetta's chart carries a DST clock block** (3 April to 29 October, +60 minutes). Any consumer that
   reads the printed April to October block as standard time is an hour out. The banked rows are
   normalised back to standard time and the convention is recorded in the file's note.
4. **Swat's isha column is printed in a face three times the normal size** in four panels, which costs
   that scan 122 cells. The `-n-t` scan prints the column normally and recovers all of them, so the
   union banks 2,541 of 2,562.
5. **Mardan's isha column is clipped by the page edge** in October and December, 61 cells.
6. **Peshawar's day-31 rows sit on the band rule** in seven bands; 49 cells. Two 16-17 May asr cells
   were re-read from their own crop and repaired.
7. **No chart names its city.** Identity rests on the publisher's filename for all 29, Quetta's DST
   block and Swat's implied northern point included.
8. **Malakand.pdf is not a chart** - a BISE Malakand examination notification that matched the district
   name. Recorded so no later wave re-downloads it.
9. **Quetta's asr does reproduce**, so O1l-21r's asr flag is bounded to the archive.org print and does
   not describe the city.

## 11. NEXT

1. **The remaining named gaps**: Mardan's clipped isha (61, physically off the sheet), Peshawar's 49
   day-31 cells, Quetta's 89 scattered singles, Swat's 21. None is recoverable from the artefacts in
   hand; a third scan of Mardan or Peshawar from another host is the only route, and Wayback holds the
   Peshawar chart only as the 19-column poster already banked. An equal-ink-mass cluster pass would
   close most of Quetta's 89 if a second scan of that chart ever appears.
2. **Quetta's second table**: the two Quetta charts now disagree on asr and on the pads. A third Quetta
   print would say which is the city's habit.
3. **Swat's computation point**: 35.25 N is Bahrain in northern Swat. A chart from Kalam or Madyan, or
   a Swat district mosque table naming its town, would confirm or kill the inference.
4. **The Islamic Academy prints** (Sialkot and kin): whether their `5.00 Hours from GMT` line names a
   computation service still unanswered.
5. Every chart here is undated and perpetual. **No year-2 accrual exists for this family by
   construction**, so Pakistan's city layer ceiling stays one published cycle per city until the
   federal unified timetable is published.
