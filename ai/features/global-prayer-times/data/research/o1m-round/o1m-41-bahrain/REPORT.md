# o1m-41 Bahrain: the almanac found, the two-site rule measured, the 74-minute floor refuted

Wave o1m-41, round o1m. Workspace `$HOME/athan-gitree/census/o1m/o1m-41-bahrain/`.
Engine: adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`,
`CalculationParameters('Other', fajr, isha)`, `Madhab.Shafi`, `HighLatitudeRule.MiddleOfTheNight`,
`Rounding.None`, zone `Asia/Bahrain` (UTC+3, no DST), every date taken from a literal string printed
in a captured document. No subagent spawned. The repository was not touched. No clock was read into
any dataset.

## Assumptions

- The council's own statement of its method is read as the specification of the recipe, not as
  provenance taken on trust: the statement supplies two coordinates and the isha depression, and the
  tables then decide whether the statement is what was computed.
- A printed minute is read as the truncation of a computed instant, so a column whose mean residual
  is 0.0 minutes with a spread inside ±0.5 minutes is a reproduction, and a column with a mean
  residual of +1.0 minute carries a one-minute addition rather than a coordinate error.
- The `Asia/Bahrain` offset is read as a fixed +03:00 across every span because Bahrain abolished
  seasonal change in 2014 and no captured document departs from it.
- A 12-hour print with no suffix is read with fajr, sunrise and dhuhr in the morning and asr,
  maghrib and isha in the afternoon; neither captured calendar prints a value that makes the reading
  ambiguous.
- The council's page prints the Dilmunia longitude as "68.50" in one sentence, read as 50.68 because
  the same sentence names the easternmost point of Muharraq; the longitude recovered from the table
  lands at 50.675.
- The Ramadan imsakiyya's English and Arabic editions are read as one computed generation: both print
  the same times, and the English edition is parsed because its digits extract cleanly.

## 1. The almanac: the council publishes it, and the ministry serves it as a PDF

The prior wave recorded a hard negative, that no dated Bahraini authority table existed on a public
page. That is overturned. The surface was reachable through the two bodies the prior wave named but
never resolved.

**The council's host is `almajles.gov.bh`.** The Supreme Council for Islamic Affairs publishes on
`/Programs/calendar/` the method in full and two annual documents, a daily calendar and a desk
calendar. The method page states, in Arabic, the recipe the 2021 press report only summarised:

1. Fajr and sunrise are computed at **the easternmost point of Muharraq, the Dilmunia area, latitude
   26.27 N and longitude 50.68 E**, which the council calls one minute earlier.
2. Dhuhr, asr, maghrib and isha are computed at **the westernmost point of the Bahrain island, Salman
   city in the Northern Governorate, latitude 26.22 N and longitude 50.44 E**, which the council
   calls one minute later for maghrib and isha.
3. Isha follows **the sun at 18 degrees below the horizon**, replacing the fixed 90 minutes after
   maghrib.
4. Dhuhr is the moment **the whole solar disk crosses the meridian**, which the council calls one
   minute later than the previous convention.
5. The Eid entry time is the sun's lower limb at 4 degrees.

**The dated documents, all banked in `captures/`:**

| file | object | pages | span |
|---|---|---|---|
| `bh-council-calendar-daily-1448.pdf` | council daily calendar, Hijri 1448 | 357 | 2026-06-16 to 2027-06-05, one page per day |
| `bh-council-calendar-book-1448.pdf` | council desk calendar, 1448 | 79 | same year, book layout |
| `bh-taqweem-daftri-2021.pdf` | ministry desk calendar, "التقويم الفلكي البحريني" 1442, prepared by Wahib Isa al-Naser and Mohammed Jasim al-Othman | 26 | 2020-08-20 to 2021-08-08 |
| `bh-imsakiyya-1442..1446-{ar,en}-*.pdf` | ministry Ramadan imsakiyya, five years | 10-25 each | Ramadan 1442 to 1446 |

Parsed rows, every date a literal string from the page: `data/bh-council-daily-1448-rows.json`
(355 rows, zero gaps, twelve Hijri month starts in order), `data/bh-almanac-1442-rows.json` (354 rows),
`data/bh-ministry-ramadan-1442..1446-*-rows.json` (29 to 30 rows each).

The 1448 desk calendar carries the same method as a printed preface, and it names the committee: a
twelve-name roll whose chairman is Abd al-Rahman bin Mohammed bin Rashid Al Khalifa, and which includes
al-Naser and al-Othman, the two authors of the 1442 almanac. The 1442 almanac and the 1448 calendar are
therefore one lineage, which is why the two tables fit one recipe.

**The 1442 almanac prints two isha columns**, the astronomical isha and the fiqh isha. The fiqh
column is maghrib + 90 minutes on **354 of 354 rows, exactly**, which is the pre-1443 rule caught in
the act. The astronomical column runs 76 to 91 minutes after maghrib and fits 17.96 degrees. The same
90-minute rule holds on all 30 rows of the April 2021 imsakiyya.

**The live page gates the parse.** The council's calendar page server-renders today's six times into
the page; the capture carries fajr 04:33, sunrise 05:52, dhuhr 11:23, asr 14:28, maghrib 16:51, isha
18:08 for 2026-11-11, and the parsed 1448 row for that date is 4:33, 5:52, 11:23, 2:28, 4:51, 6:08.
Six for six.

## 2. The two-site rule: real, and recoverable from the table alone

The council names two points 0.23 degrees of longitude apart, which is 0.92 minutes of mean solar
time. The split is finer than the printed minute, so no single cell can prove it and the aggregate
can.

**The stated recipe reproduces the council's whole year.** Coordinates pinned at the stated values,
fajr at 18.00 degrees, isha fitted at 17.80 degrees, one integer padding per column (dhuhr +1 for the
disk rule, maghrib +1, the rest zero):

| column | exact | within 1 | MAE (min) | worst | mean residual |
|---|---|---|---|---|---|
| fajr | 92.4 pc | 100.0 | 0.076 | 1 | +0.02 |
| sunrise | 94.1 pc | 100.0 | 0.059 | 1 | +0.02 |
| dhuhr | 92.1 pc | 100.0 | 0.079 | 1 | +1.08 raw, +1 padded |
| asr | 67.6 pc | 100.0 | 0.324 | 1 | -0.01 |
| maghrib | 53.0 pc | 100.0 | 0.470 | 1 | +0.53 raw, +1 padded |
| isha | 94.9 pc | 100.0 | 0.051 | 1 | +0.02 |
| **2,130 cells** | **82.3 pc** | **100.0** | **0.177** | **1** | |

`fit/bh-1448-stated-fit.json`. Two thousand one hundred and thirty cells, not one beyond a minute.

**The per-column longitude solve is the two-site test.** Latitude and both angles held at the stated
values, one longitude free per column:

| column | recovered longitude | site the council names | difference |
|---|---|---|---|
| fajr | 50.675 | 50.68, Dilmunia | -0.005 |
| sunrise | 50.665 | 50.68, Dilmunia | -0.015 |
| dhuhr | 50.175 | 50.44, Salman | -0.265 |
| asr | 50.465 | 50.44, Salman | +0.025 |
| maghrib | 50.295 | 50.44, Salman | -0.145 |
| isha | 50.435 | 50.44, Salman | -0.005 |

The two morning columns sit 0.23 degrees east of the four afternoon columns: the stated split, to
within 0.01 degrees. The two afternoon columns that drift are exactly the two that carry an addition
the council also states. Dhuhr's -0.265 degrees is +1.08 minutes of the disk rule; maghrib's -0.145
degrees is +0.55 minutes of the almanac's own sunset criterion. Neither is a second site.

**The split is invisible per cell and decisive in aggregate.** A single site at the best compromise
longitude, 50.525, with the same angles and paddings, still lands 100.0 pc within one minute, but its
exactness falls from 82.3 to 58.8 pc, and fajr alone falls from 92.4 pc exact to 33.0 pc. The line is
real; it is simply finer than the print.

**The pre-regime almanac had half the rule.** The 1442 table fitted the same way resolves fajr at
50.675, sunrise at 50.455, dhuhr at 50.440, asr at 50.475, maghrib at 50.340, the astronomical isha
at 50.400. So the eastern point was already used for fajr alone in 1442, and the council's extension
of that point to sunrise is the 1443 change it describes. `fit/bh-1442-stated-fit.json`: 100.0 pc
within one minute, worst 1, exact 73.8 pc over 354 days.

**Both named points check against a public gazetteer.** Dilmunia resolves to 26.272 N, 50.673 E, which
is the council's 26.27 and 50.68; Salman city resolves to 26.233 N, 50.454 E, which is the council's
26.22 and 50.44. Raw responses in `captures/nominatim-*.json`.

## 3. The floor: there is no 74-minute floor, and the press number is the rule's own minimum

The prior wave read the Al Ayam report of 2021-08-05 as a floor, a minimum maghrib-to-isha span of 74
minutes reached on 21 March and 22 September, and graded the masjidbox Manama year as failing it at
73 and 72 minutes. **The tables falsify the floor reading.**

The council's own document says the isha basis changed to the sun at 18 degrees and says nothing about
a minimum. The printed minimum span in the council's 1448 year is **75 minutes**, on 49 of 355 days,
running mid-September to mid-October and late February to late March; the maximum is 90 minutes in late
June. Seventy-four never appears in 355 days, nor in four post-regime imsakiyya whose minima are 76,
75, 75 and 75.

**The decisive test is the implied angle per day.** Inverting each printed isha minute for the
depression angle that produces it, at the stated site:

| year | fajr implied angle | isha implied angle | isha span |
|---|---|---|---|
| 1443 (2022) | 17.99 mean, 17.89-18.08 | 17.78 mean, 17.69-17.89 | 76-82 |
| 1444 (2023) | 17.98 mean, 17.89-18.10 | 17.77 mean, 17.68-17.87 | 75-79 |
| 1445 (2024) | 18.01 mean, 17.89-18.10 | 17.79 mean, 17.68-17.89 | 75-78 |
| 1446 (2025) | 17.99 mean, 17.91-18.12 | 17.79 mean, 17.67-17.88 | 75-76 |
| 1448 (2026-27) | 18.00 mean, 17.88-18.13, sd 0.062 | 17.81 mean, 17.67-17.94, sd 0.062 | 75-90 |

A floor of the form max(twilight, maghrib + 74) would bend the implied angle upward wherever it bit,
which is the month either side of each equinox. It does not bend. The whole spread of 0.13 degrees in
each column is the quantisation of a one-minute print, identical in standard deviation across five
years. **The rule is one constant angle near 17.8 degrees, and the short equinox span is its
consequence, not a clamp.**

The same inversion on Ramadan 1442, the pre-regime year, returns a mean implied isha angle of 19.59
degrees with a spread of 18.90 to 20.30. An angle that wanders is the signature of a fixed interval,
and the interval measures 90 minutes directly.

What the press report's 74 minutes measures is the depth of the equinox trough in the 18-degree curve,
which this engine computes at 76.5 minutes at these coordinates. The number describes the curve; it
does not bound it. The correction matters because the prior wave's grading of a platform surface rested
on it: masjidbox's Manama tenant is not failing a floor, it is running a smaller angle, and the right
measurement of it is the angle.

## 4. Bahrain's own mosques and the platforms: one chain carries the almanac, one does not

Platform surfaces were measured against the council's own table over the 217 days where the spans
overlap, 2026-11-01 to 2027-06-05.

| surface | fajr identical | maghrib identical | isha identical | cells beyond 1 min |
|---|---|---|---|---|
| tawkit `awqaf` | 83.9 pc | 90.8 pc | 88.5 pc | 0 of 1,302 |
| tawkit `manama-awqaf` | 70.5 pc | 76.5 pc | 73.3 pc | 0 of 1,302 |
| masjidi region table 5883 | identical to tawkit `awqaf` row for row | | | |
| masjidi region table 5884 | a second Bahraini table, 5:11 fajr against 5:02, locality unnamed | | | |
| masjidbox Manama tenant | 17.99 fajr, 17.01 isha, platform convention | | | |

`fit/tawkit-awqaf-vs-council.json`, `fit/tawkit-manama-vs-council.json`,
`captures/masjidi-region-5883.json`, `captures/masjidi-region-5884.json`. The chain that carries the
almanac is tawkit's `awqaf` tenant and masjidi's region 5883, which are the same table: fajr 5:02,
sunrise 6:24, dhuhr 11:42, asr 14:38, maghrib 16:58, isha 18:19 on 2027-01-01 on both. The `manama-awqaf`
tenant is a different computation at a southern coordinate, one minute away on a third of days.

The masjidbox Manama tenant stays a platform convention at 17.01 degrees of isha. It is not the
almanac and it must not be graded against one.

**Tenant enumeration is partial.** The census already holds one masjidi tenant in Bahrain, the Sabika
bint Ibrahim Al Ansari centre in Manama, whose configuration pulls region table 5883; its iqama offsets
are mosque settings, never prayer times. Riffa, Muharraq and Isa Town have no tenant found on these
platforms in this pass, and the platforms publish no country index that a public read can enumerate.

## 5. The 2027 probe

The council's current edition is **Hijri 1448, covering 2026 and 2027**, served from
`/MediaManager/Media/Documents/taqweem1448/`. Its daily calendar runs 2026-06-16 to 2027-06-05, so the
council's 2027 calendar exists and is in hand for 1 January to 5 June 2027. A 1449 edition, which would
begin in June 2027, is **not published at the capture date**: the calendar page links the 1448 daily and
desk documents only, and probes for `taqweem1447`, `taqweem1449` and their daily and book files return
404 on every name tried, including the exact 1448 file-naming pattern with the year swapped.

## 6. Negatives and defects

| item | verdict | evidence |
|---|---|---|
| annual calendar for 1443 to 1447 | not published on a public page | `taqweem<year>/` path family 404 for every year but 1448; no Wayback capture of the calendar page; the ministry's page links 1441 and 1442 only |
| `awqaf.gov.bh` | does not resolve | the council's host is `almajles.gov.bh`; `scia.gov.bh` serves the same council home and an empty calendar path |
| islam.gov.bh REST API | blocked by plugin policy | `itsec_rest_api_access_restricted` on every media query |
| Wayback, `almajles.gov.bh/MediaManager/*` | no captures | CDX returns a zero-row body |
| Wayback, islam.gov.bh PDFs | works | 199 PDF URLs, which is how the 2021-2025 imsakiyya series was found |
| imsakiyya 1446, day 30 | missing | the booklet prints 29 days and stops |
| imsakiyya 1444 English edition | not retrievable | the live host serves a soft 404; the Wayback copy returned an age-gate page; the Arabic edition was parsed instead |
| almanac 1442, 2021-08-09 | missing | the table ends at 29 Dhu al-Hijjah 1447 |
| almanac 1442 weekdays | 2 apparent mismatches, resolved | 2021-05-23 and 2021-07-28 extracted as "لأاحد" and "لأاربعاء"; the print is correct and the extractor scrambles those two ligatures, so the row data stands |
| council page Dilmunia longitude | printed "68.50" | read as 50.68; the recovered longitude 50.675 and the gazetteer 50.673 both support the reading |

Searches ran in Arabic and English, with the phrases تقويم الزبارة والبحرين, التقويم البحريني, روزنامة
الزبارة والبحرين, إمساكية رمضان 1447, and the English "Bahrain prayer times calendar PDF". The dated
tables came from direct site navigation after the search named the council, not from the search results
themselves.

## 7. Counted state

| object | surface | rows | years | fit |
|---|---|---|---|---|
| council daily calendar | 1 PDF, 357 pages | 355 | 1448 (2026-2027) | stated recipe, 100 pc within 1, 82.3 pc exact, worst 1 |
| ministry desk almanac | 1 PDF, 26 pages | 354 | 1442 (2020-2021) | 100 pc within 1, 73.8 pc exact, isha fixed at 90 min |
| ministry imsakiyya | 5 PDFs | 148 | 1442-1446 | 100 pc within 1 for 1443-1446, worst 1 |
| tawkit and masjidi awqaf chain | 2 platform surfaces | 365 each | 2026-2027 | 0 of 1,302 cells beyond 1 min against the council |
| masjidbox Manama | 1 tenant | 673 | 2025-2026 | platform convention, 17.99/17.01 |

Archive: 45 capture files, 243 MB, of which the council daily calendar is 128 MB and the desk calendar
81 MB. Ten dated-row files and eight fit reports.

## 8. NEXT

1. **Annual calendars 1443 to 1447.** The council's path family serves only 1448. The next pass reads
   the council's publication index and its news archive for the years the calendar was launched, and
   tries the ministry's `files/` tree, where the 2023 imsakiyya lived under a name no site page links.
2. **The 1447 launch report.** A February 2026 Al Ayam issue carries the council's 1447 launch; its
   text may state the same five rules and give the equinox minimum, which would let the 74-minute
   sentence be traced to its source.
3. **Tenant enumeration for Riffa, Muharraq and Isa Town.** No country index exists on masjidi or
   tawkit; the route is a mosque-by-mosque read of the two apps' public screens.
4. **The second Bahraini region table, 5884.** It is a minute away from the awqaf table and its locality
   is unnamed. It should be attributed before it is carried.
5. **The 1442 weekday mismatches.** Two rows disagree with the calendar's own weekday column; the page
   image would settle whether the print or the parse is at fault.
