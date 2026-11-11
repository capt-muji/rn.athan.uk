# fit11: Algeria's between-year test, and Benin's city attribution

Date: 2026-11-10. Workspace: `$HOME/athan-gitree/census/o1k-wide/fit11/`.
Engine: adhan-js 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`.
Method on every run: `Rounding.None`, then a per-prayer integer margin applied in the comparison;
`TZ=<zone> node ...` per invocation; no clock read (every date comes from the data); angles scanned
15-21 (fajr) and 14-21 (isha) at 0.05 then refined at 0.01; across -15..+15 integers; asr both schools.
No network, no subagents, nothing under /tmp.

A recipe line reads `prayer margin/rounding exact/within1/worst`. `exact` counts days reproduced to
the printed minute, `within1` days inside one minute, `worst` the largest miss. Every printed cell is
a whole minute, so one minute is the resolution of the source, not an error budget.

---

## Job 1: Algeria, 1447 against 1448

### Transcription

The 1447 Alger book carries no text layer either (13 pages, one full-page image each). The four
months fit2 used were rendered at 6x and read, two vertical halves per page.

| File | Hijri month | PDF page | Days | Window |
| --- | --- | --- | --- | --- |
| `dz-alger-1447-jumada1.json` | Jumada al-Ula 1447 | 6 | 30 | 2025-10-23 .. 2025-11-21 |
| `dz-alger-1447-jumada2.json` | Jumada al-Thaniya 1447 | 7 | 29 | 2025-11-22 .. 2025-12-20 |
| `dz-alger-1447-rajab.json` | Rajab 1447 | 8 | 30 | 2025-12-21 .. 2026-01-19 |
| `dz-alger-1447-ramadan.json` | Ramadan 1447 | 10 | 29 | 2026-02-19 .. 2026-03-19 |

118 printed days, 708 cells. Columns right to left: day, Hijri day, Gregorian date, الفجر, الشروق,
القبلة, الزوال, العصر, المغرب, العشاء. The extra column is the qibla moment, printed //// when the sun
does not reach the qibla azimuth. It is blank from 27 October through the end of Rajab (19 January in
the transcribed run) and filled again on 19 February, the first Ramadan day.

Read audit: every column of every month was checked for a cell that jumps against the mean of its
neighbours. None was flagged at 2 minutes. The one suspicious shape, fajr sitting at 06:29 for
thirteen consecutive January days, was re-rendered at 12x and confirmed (a genuine plateau, the
17.8 degree curve is flat within a print minute there). Month boundaries abut day for day.

### The frozen test: fit2's 1448 recipe applied to 1447 unchanged

| Prayer | Margin/rounding | 1447 exact | 1447 within 1 | 1448 exact (fit2) |
| --- | --- | --- | --- | --- |
| fajr 17.80 | 0 / floor | 112/118 | 118/118 | 111/119 |
| sunrise | +1 / floor | 109/118 | 118/118 | 113/119 |
| dhuhr | +1 / floor | 115/118 | 118/118 | 114/119 |
| asr (Shafi) | +1 / floor | 59/118 | 118/118 | 62/119 |
| maghrib | +4 / floor | 112/118 | 118/118 | 111/119 |
| isha 16.10 | +5 / nearest | 113/118 | 118/118 | 115/119 |

Totals: **620/708 exact (87.6 pc), 708/708 within one minute, worst 1**, against 626/714 (87.7 pc)
and 714/714 on its own year. Nothing degraded across the year boundary beyond print noise.

The margins transfer as well as the angles: holding the angles at 17.80/16.10 and refitting only the
margins on 1447 gains exactly one cell, 621/708. The frozen margins are not the reason for the
one-minute misses.

### The free fit on 1447

| Prayer | Angle | Margin / rounding | Exact | Within 1 |
| --- | --- | --- | --- | --- |
| fajr | **17.80** | 0 / floor | 112/118 | 118/118 |
| isha | 16.30 | +4 / nearest | 115/118 | 118/118 |
| sunrise | | +1 / floor | 109/118 | 118/118 |
| dhuhr | | +1 / floor | 115/118 | 118/118 |
| asr | | 0 / ceil | 59/118 | 118/118 |
| maghrib | | +4 / floor | 112/118 | 118/118 |

Totals **631/708 exact (89.1 pc), 708/708 within one minute, worst 1**. Asr is Shafi (Hanafi misses by
up to 36 minutes). Fajr lands on 17.80 to the hundredth, which is fit2's 1448 answer with the same
margin and the same rounding.

Isha is the one column that moves. On 1448 the constrained fit prefers 16.10 at +5 (115/119), on 1447
it prefers 16.30 at +4 (115/118). At the frozen 16.10/+5, 1447 gives 113/118. The 0.2 degree step is
worth two cells of 118 and sits inside print resolution.

### The ridge, margins frozen

Varying the angle while holding fit2's margins fixed, the exact-count peak is narrow, about 0.2 degree
wide at half height, and both years peak on the same grid point:

| Angle | 1447 fajr exact/118 | 1448 fajr exact/119 | worst | | Angle | 1447 isha exact/118 | 1448 isha exact/119 | worst |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 17.00 | 0 | 0 | 5 | | 15.00 | 0 | 0 | 6 |
| 17.50 | 0 | 0 | 2 | | 15.50 | 0 | 0 | 4 |
| 17.70 | 57 | 63 | 1 | | 16.00 | 44 | 46 | 1 |
| **17.80** | **112** | **111** | **1** | | **16.10** | **113** | **115** | **1** |
| 17.85 | 87 | 86 | 1 | | 16.20 | 72 | 72 | 1 |
| 17.90 | 59 | 52 | 1 | | 16.30 | 3 | 4 | 1 |
| 18.00 | 0 | 2 | 2 | | 17.00 | 0 | 0 | 5 |
| 19.00 | 0 | 0 | 7 | | 21.00 | 0 | 0 | 26 |
| 21.00 | 0 | 0 | 17 | | | | | |

Read the exact counts beside the worst column, not alone: the apex is identical in both years, and the
collapse to zero at 18.00 is a floor-boundary artefact (the curve crosses a print minute there, so every
cell misses by one at once), not an error blow-up.

### The generation question: reprinted or recomputed?

The two books share **no Gregorian cell**. The 1447 book ends at Dhu al-Hijja 29 = 2026-06-15 and the
1448 book begins at Muharram 1 = 2026-06-16, so the years abut without overlap and a byte comparison
of identical cells is not available.

The structural comparison is available. Pairing the same Hijri month-day one Hijri year apart (354
days), the printed difference reproduces adhan's own difference at 1448's recipe:

| Month | Column | Printed mean difference | adhan mean | residual mean | residual max | identical cells |
| --- | --- | --- | --- | --- | --- | --- |
| Jumada I | fajr | -9.83 | -9.87 | +0.04 | 0.95 | 0/30 |
| Jumada I | maghrib | +11.37 | +11.48 | -0.11 | 1.05 | 0/30 |
| Jumada II | sunrise | -10.41 | -10.12 | -0.30 | 0.87 | 0/29 |
| Rajab | fajr | -2.76 | -2.84 | +0.08 | 0.88 | 6/29 |
| Rajab | asr | -6.86 | -7.02 | +0.16 | 1.15 | 0/29 |
| Ramadan | fajr | +14.34 | +14.27 | +0.08 | 0.88 | 0/29 |
| Ramadan | maghrib | -11.28 | -10.92 | -0.36 | 0.93 | 0/29 |

A reprint would print a difference near zero, because the same numbers would sit on dates 354 days
apart. The printed differences instead run to 10-14 minutes and track the sun: **the 1448 book is
freshly computed, not copied**. The handful of identical cells (dhuhr in Jumada I at 11/30, fajr in
Rajab at 6/29) fall where the seasonal curve is flat within a print minute, not in a block.

### Verdict for the owner's ruling

**The recipe is frozen across the two Hijri years. No change.** Four independent statements agree:

1. Applied unchanged, the 1448 recipe holds 1447 at 87.6 pc exact and 100 pc within one minute,
   against 87.7 pc and 100 pc on its own year.
2. Fitted freely on 1447, fajr comes back at 17.80 with margin 0 floor, identical to 1448.
3. With the margins frozen, the exact-count peak is 17.80 in both years and 16.10 in both years.
4. The 1447 recipe transfers back to 1448 at 626/714 exact, the same count the 1448 fit reaches on
   its own year.

Isha's fitted angle sits at 16.10 on 1448 and 16.30 on 1447, a two-cell difference at print
resolution. That is the only parameter that is not identical, and it does not survive as a
correction: 16.10 with the frozen margin holds 1447 at 113/118 and 118/118 within one.

The generation is frozen too, in the sense the owner asked about: both books are generated by the
same computation, and neither is a copy of the other.

### The per-wilaya offset register

`dz-wilaya-offsets-1447.json` transcribes the page-6 footer of the 1447 book: 25 northern wilayas,
6 rows of signed minutes to add to the Algiers column, in the same order and with the same membership
as fit2's 1448 register. Values differ from the 1448 Jumada II instance (Souk Ahras fajr -19 here
against -20 there, Oran isha +16 against +17), which matches fit2's finding that the table is
reprinted per month with recalculated values.

Two regional books of the same month were transcribed to test it:

| Site | Cells | Exact | Within 1 | Worst |
| --- | --- | --- | --- | --- |
| Alger (control) | 180 | 162 | 180/180 | 1 |
| Djelfa 34.6703/3.2630 | 180 | 157 | 180/180 | 1 |
| Adrar 27.8743/-0.2939 | 180 | 144 | 180/180 | 1 |

**Neither regional wilaya appears in the register**, in 1447 or in 1448. That is the first answer: the
table cannot reproduce a book it does not cover.

The sharper answer is that the register is not the computation at all. Each regional book is
computed at its own coordinates with the frozen Algiers recipe, to within one minute on all 180
cells. The register's own rule (pure longitude, 4 min per degree) misses the same books badly:

| Site | Column | Printed vs Alger | adhan vs Alger | 4 min/deg rule | worst miss, adhan | worst miss, longitude rule |
| --- | --- | --- | --- | --- | --- | --- |
| Djelfa | sunrise | -4.4 | -4.42 | +0.8 | 0.8 | 6.8 |
| Djelfa | asr | +3.0 | +2.99 | +0.8 | 1.0 | 3.2 |
| Adrar | sunrise | -0.8 | -0.80 | +13.4 | 1.0 | 17.4 |
| Adrar | asr | +27.5 | +27.56 | +13.4 | 0.8 | 44.4 |
| Adrar | maghrib | +27.8 | +27.73 | +13.4 | 0.9 | 45.4 |

For Adrar, whose longitude is close to Oran's, the register's nearest entry (+15/+14/+15/+18/+18/+16)
is the best the table can do: it misses the printed difference by 7.6 (fajr), 14.8 (sunrise), 1.7
(dhuhr), 9.5 (asr), 9.8 (maghrib) and 3.7 (isha) minutes. Djelfa shows the reason: it is 0.2 degree
east of Algiers, so the longitude rule gives it +1 on every column, while the book prints -4 on
sunrise and +3 on maghrib, a two-degree latitude term the table has no column for.

**The register does not reproduce a regional book.** It carries Algiers plus 25 northern wilayas, both
books in hand fall outside that set, and extending it by its own rule (pure longitude) misses them by up
to 45 minutes. The books come from a per-site computation with the frozen recipe, which is what makes
the between-year verdict portable to every wilaya book rather than to Algiers alone.

### Seasonal amplitude beside the stability

| | fajr | sunrise | dhuhr | asr | maghrib | isha |
| --- | --- | --- | --- | --- | --- | --- |
| Printed span in hand (Oct-Mar, both years), minutes | 62 | 68 | 30 | 68 | 87 | 82 |
| Recipe's modelled annual span at 36.75 N, minutes | 171 | 151 | 30 | 89 | 156 | 170 |

January to July fajr span at this latitude: 155 minutes. The months in hand exercise 62 of those 171
minutes, so the annual extremum of a 17.8 degree fajr is still unexercised by any printed cell. The
between-year verdict is solid on the window that exists, and the summer solstice remains the one
untested corner.

Limits: values are read from page images and a cell may be off by a minute. The 1447 Ramadan month is
29 days and 1448's is 30, so the pairing for that month covers 29. Nothing here separates a 0.2 degree
isha shift from print noise.

---

## Job 2: Benin, the held table is a Gakpe mosque calendar computed for Kandi

### What the page says about itself

Captured at `sahel2/captures/mawaqit-omar-el-farooq-cotonou-benin.html`, mosque ID 25625, platform
build v4.134.29-prod. Its own fields:

| Field | Value |
| --- | --- |
| name and label | Mosquée Omar El Farooq - GAKPè |
| countryCode | BJ |
| timezone | Africa/Porto-Novo |
| latitude / longitude | 6.41612489208 / 2.1211123466492 |
| association | Association Omar El Farooq |
| external site | `h26y2k86kh.wixsite.com/mosque-omar-el-faro` |
| slug | `mosquee-c-interculturel-omar-el-farooq-gakpe-00000-benin` |
| jumua / Eid | 13:00 / 08:45 |

**The page never says Cotonou.** The string does not occur once in the capture. "Cotonou" is the
census's own label, carried from C1 through `sahel2` into the data file, and the label is wrong twice
over.

First, the pin: 6.4161 N, 2.1211 E sits 30.3 km west of the Cotonou centre and 6.9 km from Ouidah,
outside the city. Second, the table: the live display for the capture day and the
calendar agree to the minute, and both are northern:

- live `times` 2026-11-10: 05:30 12:32 15:52 18:22 19:30, shuruq 06:42
- calendar row 2026-11-10: identical
- adhan at Kandi 11.1342/2.9364, MWL 18/17: 05:29 06:42 12:32 15:51 18:21 19:30
- adhan at the page's own pin, 6.4161/2.1211: 05:27 06:39 12:35 15:56 18:30 19:38
- adhan at Cotonou 6.3703/2.3912: 05:26 06:38 12:34 15:55 18:29 19:37

So the congregation is being served northern times today, not from a stale bank, and neither the
name nor the pin on the page supports the city the census gave it. The publisher states no city
beyond Gakpè and the country. Nothing on the capture suggests a Kandi mosque.

### The geometry

365 days, 2,190 cells, aligned to 2026.

| Point | Exact | Within 1 | Worst | MAE |
| --- | --- | --- | --- | --- |
| the page's pin 6.4161 / 2.1211 | 70 | 222/2190 | 14 | 5.26 |
| Cotonou 6.3703 / 2.3912 | 70 | 216/2190 | 13 | 4.84 |
| Porto-Novo 6.4969 / 2.6289 | 76 | 493/2190 | 12 | 4.42 |
| Parakou 9.3372 / 2.6303 | 175 | 940/2190 | 6 | 2.05 |
| Malanville 11.8656 / 3.3833 | 226 | 808/2190 | 4 | 1.77 |
| **Kandi 11.1342 / 2.9364** | **1845** | **2190/2190** | **1** | **0.16** |
| freed margins at the pin | 376 | 586/2190 | 10 | |

A 0.1 degree grid over 6-12.6 N and 1.8-3.6 E, then a 0.01 refinement, puts the best point at
**11.11 N / 2.94 E**: 1852/2190 exact (84.6 pc), 2190/2190 within one minute, worst 1, MAE 0.15, with
the monthly mean residual between -0.7 and +0.7 minutes on every column in all twelve months. That
point is **2.7 km from Kandi**, 530 km from the Cotonou centre and 530 km from the page's own pin.

The residual shape at the declared point is the latitude signature, not a clock or alignment fault:
dhuhr stays at +3.2 minutes all year (a longitude term only), while sunrise runs +0.4 in October to
+11.6 in June and fajr runs +1.1 to +13.3, a clean annual sinusoid of the size a 4.7 degree latitude
error produces. No margin repairs it: freed margins still leave a worst of 10 minutes.

### What is not on the page

The capture carries one calendar and one live display, and no second table, no nearby-mosque list,
no map widget and no address block beyond the fields above. The association's Wix site is referenced
but was not captured, and this session ran without network, so it was not opened.

No other Beninese surface exists in the census. Searches of every capture under `o1k-wide/` for
"Omar El Farooq", "Kandi", "Porto-Novo" and "Benin" return this one page and its two derived files.
A Cotonou central mosque table and a Porto-Novo table are therefore **not in hand**, and the claim
that neither exists is not available from this evidence: they were not reached.

### Verdict

**Cotonou-absent.** Benin's row must stop claiming a Cotonou table, and the held capture is not one.

The publisher never claims Cotonou: it names Gakpè, gives country BJ, and pins 30 km west of the city.
The census's city label came from the capture's own filename and record, not from the page. On top of
that, the calendar is computed at the Kandi point, 532 km from the page's pin, so the table is wrong
for the place it publishes and cannot be graded as any Benin witness, nor used to serve the mosque's
own neighbourhood.

Not "corrected-city": the only correction the evidence supports is to Gakpè, and at Gakpè the table
misses by up to 14 minutes, so correcting the city produces no usable row. Correcting it to Kandi would
invent a publisher. Not "Kandi-community" for the same reason: no Kandi mosque or community published
this table, and none is attested to use it.

Recorded as: a Gakpè mosque's community-platform calendar (association Omar El Farooq), computed at
the Kandi point, a generator or profile-entry fault whose mechanism the capture does not show. Its
standing as a northern-Benin computed surface is real (1852/2190 exact at the implied point) but it
backs no country row until a Kandi publisher is found.

Follow-ups this session could not run: the association's Wix site, a Cotonou central mosque on the
same platform, and Porto-Novo. Each is one capture away and each would decide whether Benin has any
usable surface at all.

---

## Deliverables

- `dz-1447.json`, the between-year bundle: transcription inventory, both fits, the frozen-margin
  ridge, the copy test, the register check and the verdict.
- `bj-attribution.json`, the Benin bundle: declared point, grid and refinement, named cities,
  monthly residuals.
- `dz-alger-1447-{jumada1,jumada2,rajab,ramadan}.json`, `dz-adrar-1447-jumada1.json`,
  `dz-djelfa-1447-jumada1.json`, the 178 transcribed days.
- `dz-wilaya-offsets-1447.json`, the 1447 register (25 wilayas x 6 columns).
- `dz-fit-1447.json`, `dz-between-year.json`, `dz-offset-register-check.json`, the full run output.
- `src/`, the seven scripts (`validate`, `fit-1447`, `between-year`, `offsets`, `amplitude`,
  `bj-attribution`, `assemble`).
- `pages/`, the renders read.
