# fit2: four fits on tonight's captures (DZ, MR, TG, BJ)

Date: 2026-11-10. Workspace: `$HOME/athan-gitree/census/o1k-wide/fit2/`.
Engine: adhan-js 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`.
Method on every run: `Rounding.None`, then a per-prayer integer margin and rounding applied in
the comparison; `TZ=<city zone> node ...` per invocation; no clock read (every date comes from
the data); angles scanned 15-21 (fajr) and 14-21 (isha) at 0.05 then refined at 0.01; margins
searched -15..+15 integers; asr scanned both schools.

Reading of a recipe line: `prayer margin/rounding exact/within1/worst`. `exact` counts days
reproduced to the printed minute, `within1` days inside one minute, `worst` the largest miss.

Deliverables here: `dz-fit.json`, `mr-fit.json`, `tg-fit.json`, `bj-fit.json`, plus the
transcriptions (`dz-alger-1448-*.json`), the offset register (`dz-wilaya-offsets-1448.json`),
the hold-out (`dz-holdout.json`) and the scripts (`fit.js`, `dz-transcribe.js`, `dz-offsets.js`,
`dz-holdout.js`, `diag.js`, `diag-lat.js`, `implied-geom.js`, `render.swift`, `render`).

---

## Job 1: Algeria, the ministry's own calendar

### Transcription

The 1448 Alger PDF carries **no text layer**: 16 pages, each one full-page image, zero font
resources, `extract_text()` empty on every sampled page. The instruction's condition ("if a text
layer exists") therefore closes negative, and the pages were read as rendered images instead
(PDFKit at 5-12x, `render.swift`).

Four months are now transcribed, 119 printed days:

| File | Hijri month | PDF page | Days | Window |
| --- | --- | --- | --- | --- |
| `dz-alger-1448-jumada1.json` | Jumada al-Awwal 1448 | 6 | 30 | 2026-10-12 .. 2026-11-10 |
| `dz-alger-1448-jumada2.json` | Jumada al-Thaniya 1448 | 7 | 30 | 2026-11-11 .. 2026-12-10 |
| `dz-alger-1448-rajab.json` | Rajab 1448 | 8 | 29 | 2026-12-11 .. 2027-01-08 |
| `dz-alger-1448-ramadan.json` | Ramadan 1448 | 10 | 30 | 2027-02-08 .. 2027-03-09 |
| `dz-alger-1448-merged.json` | all four | - | 119 | 2026-10-12 .. 2027-03-09 |

Two corrections to the census record came out of the re-read:

1. **The extra column is القبلة (qibla), not al-ishraq.** The header row reads, right to left:
   date, الفجر, الشروق, القبلة, الزوال, العصر, المغرب, العشاء. The column prints the morning moment
   when the sun stands on the qibla azimuth, present while the sun reaches it and `////` after.
2. **Jumada I, 2026-10-22: fajr is 05:35, not 05:36.** Verified at 14x; the sequence is
   05:34 (10-20), 05:35 (10-21), 05:35 (10-22), 05:36 (10-23, Friday). The other 29 fajr cells and
   the sampled cells of the other five columns reproduced exactly, so the prior transcription was
   sound but for this cell.

### The per-wilaya offset register

Transcribed to `dz-wilaya-offsets-1448.json`. Structure on every month page: a caption naming
the month, then **6 prayer rows x 25 wilaya columns** of signed minutes to ADD to the Algiers
column, with Algiers as the base and carrying no column of its own. Only northern wilayas appear.

The offsets are pure longitude at 4 min/degree, which is the internal check: Oran (0.64 W) +14 on
sunrise against Algiers (3.06 E), El Tarf (8.31 E) -21. Nothing is smoothed, so adjacent wilayas
can carry the same value or invert by a minute.

**The table is reprinted per month with recalculated values.** Ramadan's sunrise row begins
-21, -19, -18, -17, -16, -15, -14 against Jumada II's -21, -21, -21, -18, -18, -15, -15, so it is
not a constant national register and a downstream consumer must bind it to the month. Only the
Jumada II instance is transcribed here; the Ramadan page is read but not tabulated.

### The fit

Best recipe with plausible (non-negative) margins:

| Prayer | Margin | Rounding | Exact | Within 1 | Worst |
| --- | --- | --- | --- | --- | --- |
| fajr 17.80 | 0 | floor | 111/119 | 119/119 | 1 |
| sunrise | +1 | floor | 113/119 | 119/119 | 1 |
| dhuhr (printed as الزوال) | +1 | floor | 114/119 | 119/119 | 1 |
| asr | +1 | floor | 62/119 | 119/119 | 1 |
| maghrib | +4 | floor | 111/119 | 119/119 | 1 |
| isha 16.10 | +5 | nearest | 115/119 | 119/119 | 1 |

Totals: **626/714 exact (87.7 pc), 714/714 within one minute, worst 1 minute, MAE 0.12**.
Asr is Shafi (Hanafi misses by up to 34 minutes).

Unconstrained the same data prefers fajr 16.91 (margin -5) with isha 15.91 (margin +6):
633/714 exact, identical within-1. The two are the same printed table seen from two points on a
ridge, and the ridge is wide: **every fajr angle from 15 to 21 reaches within one minute with a
compensating integer margin**, exact counts decaying smoothly from 114 (at 17.0) to 82 (at 21.0);
every isha angle from 14.0 to 20.25 does the same, peaking at 115 (16.0). A five-month window at
1-minute print precision does not identify a twilight angle on its own; it identifies the printed
time. The margin convention picks the point: all six columns print at or after the astronomical
time, so the non-negative-margin solution above is the defensible one.

**Hold-out.** Refitting the angles on the autumn window alone (2026-10-12..2026-11-30, 50 days)
gives fajr 17.80 floor with margin 0, and that recipe reproduces the spring window it never saw
(Ramadan, 30 days) **30/30 exact, worst 0**. Fitting on spring alone also lands on 17.80. The isha
angle fits 16.0 on autumn and 16.1 on spring, both transferring within one minute. The recipe is
stable across the two windows; only its parameterisation along the ridge is loose.

### Candidates

| Candidate | Tuned margins | Exact | Within 1 | Worst | Zero-margin exact | Zero-margin worst |
| --- | --- | --- | --- | --- | --- | --- |
| **record fallback 17.91/17.09** | per-prayer | 618/714 | 714/714 | 1 | **392/714** | 4 |
| MWL 18/17 | per-prayer | 621/714 | 714/714 | 1 | 281/714 | 4 |
| Morocco 19/17 | per-prayer | 610/714 | 714/714 | 1 | 232/714 | 6 |
| Tunisia 18/18 | per-prayer | 611/714 | 714/714 | 1 | 223/714 | 5 |
| Egyptian 19.5/17.5 | per-prayer | 598/714 | 714/714 | 1 | 174/714 | **9** |

**The census's expectation is refuted: Algeria is not Egyptian 19.5/17.5.** At zero margin
Egyptian reproduces 24 pc of cells and misses by up to 9 minutes; it is the worst of the five.
MWL 18/17 ties the record's own fallback within three cells of 714 (0.4 pc), which is inside the
noise of a visual transcription.

**The record's fallback 17.91/17.09 holds.** Already at zero margin it is the best of the five and
reproduces fajr 109/119 and isha 109/119 exactly, with every column inside one minute once the
sheet's own +1/+4 margins are applied. The free fit's own answer (fajr 17.8 at margin 0, isha
16.1 at +5 which is 17.1-class at margin 0) sits on top of it. The fallback's fajr is 0.1 degree
high and its isha is where the sheet is.

Limits: October-March only, so the summer solstice is unexercised and the annual extremum of a
low-angled recipe is untested; values are read from page images and a cell may be off by a
minute; asr carries a seasonal drift of -0.6 (October) to +0.7 (March) minutes, the same shape
seen in Togo, so the sheet's asr engine differs slightly from adhan's.

Grade-worthiness: an authority sheet, 119 days, every column within one minute, hold-out clean
across two independent windows. **One year or more is not yet met** (four Hijri months of 1448).
Second-year evidence already exists in the captured 1447 books (Alger, Adrar, Djelfa, untranscribed).

---

## Job 2: Mauritania, the ministry's 1446 imsakia

30 Ramadan days, 2025-03-01 .. 2025-03-30, Nouakchott, from the ministry's own imsakia PDF.

| Prayer | Margin | Rounding | Exact | Within 1 | Worst |
| --- | --- | --- | --- | --- | --- |
| fajr 19.25 | -1 | ceil | 30/30 | 30/30 | 0 |
| sunrise | 0 | floor | 28/30 | 30/30 | 1 |
| dhuhr | 0 | nearest | 23/30 | 30/30 | 1 |
| asr | 0 | nearest | 27/30 | 30/30 | 1 |
| maghrib | +3 | nearest | 26/30 | 30/30 | 1 |
| isha 16.20 | +6 | floor | 30/30 | 30/30 | 0 |

Totals: **164/180 exact (91.1 pc), 180/180 within one minute, worst 1**. Asr is Shafi (Hanafi
misses by up to 46 minutes). The unconstrained fit walks to fajr 15.7/-8, an exact surrogate for
the same printed time; the margin convention prefers the constrained point.

**The corpus measurement holds.** Evaluated as published, at zero margin, 19.37/17.46 reproduces
**fajr 30/30 exact** and **isha 28/30 exact with all 30 inside one minute**. Its total at zero
margin is 124/180 against Egyptian 109, MWL 66 and Morocco 66. Tuned, it ties Egyptian and
Morocco at 162/180 and beats MWL's 158. Nothing separates 19.37/17.46 from Egyptian 19.5/17.5 on
a single Ramadan, but the corpus figure is at least as good and is the measured one.

The printed imsak is the printed fajr minus 5 minutes on all 30 days, so it adds no independent
constraint. Fajr at 19.37 sits 4.5-5.5 minutes after the printed imsak every day.

Limits: **30 Ramadan days only**: one month, no annual swing, no equinox, no solstice, and the
Ramadan print of a ministry that publishes a year-round calendar elsewhere. The angle is barely
identified here; the ridge spans the whole 15-21 grid at within-1. Two candidates (Egyptian,
corpus) are indistinguishable.

Grade-worthiness: provisional at best. **One year is not met** (30 days of one month). A second
imsakia year, or any year-round ministry table, is the lift.

---

## Job 3: Togo, Sokode

365 days of 2026, `togo-sokode-al-farouk-mawaqit-2026.json`, community tier.

| Prayer | Margin | Rounding | Exact | Within 1 | Worst |
| --- | --- | --- | --- | --- | --- |
| fajr 18 | 0 | nearest | 364/365 | 365/365 | 1 |
| sunrise | 0 | nearest | 362/365 | 365/365 | 1 |
| dhuhr | 0 | nearest | 364/365 | 365/365 | 1 |
| asr | 0 | nearest | 76/365 | 294/365 | 2 |
| maghrib | 0 | nearest | 364/365 | 365/365 | 1 |
| isha 17 | 0 | nearest | 355/365 | 365/365 | 1 |

Totals: **1885/2190 exact (86.1 pc), 2119/2190 within one minute (96.8 pc), worst 2**.
MWL 18/17 is the answer at **zero margin and nearest rounding on every column**, no tuning at
all, and the monthly residual means for fajr, sunrise, dhuhr and maghrib are 0.00 to within
0.1 minute in all twelve months. The platform appears to run an adhan-class engine at MWL
defaults with no adjustments, which is what a Mawaqit page is.

ISNA 15/15 is refuted (1166/2190 at zero margin, worst 28) and Egyptian 19.5/17.5 is refuted
(1166/2190, worst 7).

The one defect is **asr**: 76/365 exact, 294/365 within one minute, worst 2, and the monthly mean
residual is a clean annual sinusoid, -1.4 in March, +1.6 in September, 0.0 at both solstices. That
is the signature of a slightly different solar-declination series in the platform's asr, not of
another school (Hanafi would sit 40-60 minutes later and ISNA/Hanafi scoring confirms it).
Writing this off as a mosque-level quirk is not available: the drift is a smooth annual sinusoid
shared by the engine that produced the table, and the civilian asr conventions in the region
(standard and Hanafi) both sit far outside it.

Coordinates: the table's geometry is the file's own 8.9709 / 1.1726 (residuals 0.00). The town
point handed to this job (8.9833 / 1.6333) is 0.46 degree east and puts a uniform +1.8 minutes on
every column; the mosque's own point is the one the table was computed at.

Grade-worthiness: community tier, so no higher than candidate. Every column but asr is
**365/365 within one minute with zero margin**, which is year-complete. On a strict "one year or
more" reading of the depth rule it qualifies on days; on tier it does not reach A.

---

## Job 4: Benin, Cotonou, the capture is not Cotonou

365 days of 2026, `benin-cotonou-omar-el-farooq-mawaqit-2026.json`, community tier, aligned to
2026 per the census correction.

**The table cannot be reproduced from the stated coordinates.** At the file's own 6.4161 / 2.1211
(as at the city point 6.3703 / 2.3912) the best recipe reaches 379/2190 exact (17.3 pc), 27.1 pc
within one minute, **worst 9 minutes**, and no candidate does better: MWL 376, ISNA 371, Egyptian
371, all with worst 9-12.

Dhuhr fits at the stated point (293/365 exact, worst 1) while sunrise, fajr, maghrib, isha and
asr miss by up to 9. A clock or alignment fault would move every column together; dhuhr moving
alone means the **latitude** is wrong, and the sunrise residual is a clean annual sinusoid
(+3.8 minutes in January, -11.6 in June, zero crossings at the equinoxes) whose amplitude is the
latitude signature.

Solving for it: latitude from the residual amplitude gives **11.12 N**, longitude from the dhuhr
residual level gives **2.97 E** (residual spread 0.24 minutes). At that point the table fits
**1842/2190 exact (84.1 pc), 2190/2190 within one minute, worst 1**, and MWL 18/17 with the
platform's usual +0/+1 margins reaches 1807/2190. The implied point is **Kandi, Benin
(11.13 N, 2.94 E), about 3 km away**, some 520 km north of Cotonou.

So the page captured as "Mosquee Omar El Farooq, Cotonou (Gakpe)" serves a calendar computed for
northern Benin. The capture is not a Cotonou table and Beninese prayer times cannot be graded from
it. `bj-fit.json` carries both geometries; the stated-coordinate fit is the one that fails.

Grade-worthiness: none. **The city has no usable capture.** The page's own coordinates, the
calendar's coordinates, and the census's city point disagree, and only the calendar's is measured.

---

## Cross-cutting notes

- **A one-minute print rarely pins a twilight angle on its own.** A constant margin absorbs an
  angle change over a short window: in every job here, fajr angles across the whole 15-21 grid
  reach within one minute with a compensating integer margin. What identifies the angle is the
  exact-count peak - sharp at Togo (364/365 at 18.00, 338 at 18.25, 281 at 17.00), sharp but
  broad at Algeria (114/119 at 17.00 falling to 82 at 21.00), flat at Mauritania (23-30 exact
  anywhere from 16 to 21 on a single month). Reporting an angle without the margin it was fitted
  with is meaningless, and a short window cannot pin one at all. The Algeria hold-out is the one
  test here that closes the question, because it asks a fitted point to predict a window it never
  saw.
- **asr is the weak column everywhere.** Algeria drifts -0.6 to +0.7 minutes by season, Togo
  +/-1.5 with the extremes at the equinoxes, Mauritania within one. The pattern points at a
  declination series slightly different from adhan's inside the publishing engines, not at a
  second asr school in any of the four.
- The record's Algeria and Mauritania measurements both survive contact with the primary sheets;
  the record's Algerian expectation of Egyptian angles does not.
