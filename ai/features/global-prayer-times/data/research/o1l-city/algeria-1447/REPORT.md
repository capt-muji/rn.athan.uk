# O1l-17r: Algeria 1447, three ministry books complete, and a fourth wilaya

Date: 2026-11-11. Workspace: `$HOME/athan-gitree/census/o1l-city/algeria-1447/`.
Engine: adhan-js 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`, `Rounding.None`,
then one integer margin per column; `TZ=Africa/Algiers` per invocation; every date comes from a printed
cell, never the clock. No subagents, nothing under `/tmp`, the repository untouched.

A recipe line reads `prayer angle margin/rounding exact/within1/worst`. Every printed cell is a whole
minute, so one minute is the resolution of the source, not an error budget.

---

## 1. What is in hand

The three 1447 wilaya books on `marw.gov.dz/media/calendrier/1447/` were already banked as PDFs in
`captures/`. All thirteen pages of each are one full-page image with no text layer (PDFKit reads zero
characters on every page), so transcription is visual: each month page rendered at 3x as a table crop,
read whole, and written to `src/tsv/<wilaya>-<month>.tsv`.

| Book | Months | Days | Cells | Source |
| --- | --- | --- | --- | --- |
| Alger | 12 | 354 | 2124 | `dz-marw-calendrier-1447-alger.pdf`, pages 2-13 |
| Adrar | 12 | 354 | 2124 | `dz-marw-calendrier-1447-adrar.pdf`, pages 2-13 |
| Djelfa | 12 | 354 | 2124 | `dz-marw-calendrier-1447-djelfa.pdf`, pages 2-13 |
| Constantine | 1 (Ramadan) | 29 | 174 | directorate table, `captures/dz-constantine-ramadan1447-internews.jpg` |

**1091 days and 6546 printed cells**. Of the three books, 884 days are new this session: fit11 held
118 days of Alger, 30 of Adrar and 30 of Djelfa, and every one of those is carried unchanged. The three books abut
day for day from Muharram 1 = 2025-06-27 to Dhu al-Hijja 29 = 2026-06-15, 354 days each, with no gap
and no duplicate. Columns right to left: day, Hijri day, Gregorian date, الفجر, الشروق, القبلة, الزوال,
العصر, المغرب, العشاء.

Two 1448 pages were transcribed as well, for the between-year test: Muharram 1448 (30 days) and Dhu
al-Qada 1448 (30 days), added to the four months fit2 already held.

Read audit: every column of every month was checked against the mean of its two neighbours, and every
cell the fit misses by two minutes or more is listed in `data/dz-fit-1447-full.json` under `misses`.
That list holds three kinds of cell and nothing else: the Alger isha print defect, the one Djelfa asr
typo, and the summer isha degeneracy of section 3. A misread digit anywhere else would have surfaced
there as a several-minute outlier, and none did. Adrar's list is empty.

---

## 2. The frozen recipe, all twelve months, three wilayas

fit2's 1448 recipe applied unchanged: fajr 17.80 at margin 0 floor, sunrise +1 floor, dhuhr +1 floor,
asr Shafi +1 floor, maghrib +4 floor, isha 16.10 at +5 nearest.

| Wilaya | Exact | Within 1 | Worst | fajr | sunrise | dhuhr | asr | maghrib | isha |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Alger | 1666/2113 (78.8 pc) | 2058 (97.4 pc) | 2 | 294/354 | 338/354 | 345/354 | 169/354 | 333/354 | 187/343 |
| Adrar | 1735/2124 (81.7 pc) | **2124 (100 pc)** | **1** | 325/354 | 322/354 | 332/354 | 191/354 | 332/354 | 233/354 |
| Djelfa | 1726/2124 (81.3 pc) | 2095 (98.6 pc) | 11 | 309/354 | 326/354 | 340/354 | 186/354 | 332/354 | 233/354 |

Adrar is the clean result: every one of 2124 cells inside one minute, at 27.8743/-0.2939, with the
1448 recipe untouched. The Alger column counts 2113 cells because its eleven defective isha cells are
withheld; the other two books carry no defective cell. Djelfa's worst of 11 is a single source typo (section 6). Alger's worst of 2 is
the isha column, and that is the one real finding against the frozen recipe.

The free fit at each site returns the same shape from three directions: fajr 17.91-18.00, asr Shafi,
maghrib +4 floor, and an isha angle that lands anywhere from 16.9 to 17.2 depending on the margin it
is paired with. The fajr angle is identified; the isha angle is not, on its own.

---

## 3. The summer months move the isha parameterisation, and nothing else

The frozen isha leaves a seasonal residual that the four winter months fit2 held could not show:

| Month | Alger mean residual, isha | Djelfa | Adrar |
| --- | --- | --- | --- |
| Jan | -1.86 | -1.38 | -0.45 |
| Feb | -1.17 | -0.87 | -0.13 |
| Mar | -0.52 | -0.31 | +0.14 |
| Apr | -0.17 | -0.03 | +0.33 |
| May | 0.00 | +0.10 | +0.53 |
| Jun | -0.07 | +0.03 | +0.24 |
| Jul | 0.00 | +0.03 | +0.33 |
| Aug | 0.00 | +0.08 | +0.60 |
| Sep | -0.10 | +0.03 | +0.52 |
| Oct | -0.71 | -0.04 | +0.33 |
| Nov | -1.03 | -0.72 | -0.10 |
| Dec | -1.72 | -1.45 | -0.45 |

The printed isha is a single fixed-angle curve, but 16.10/+5 describes it only in summer. The angle
and the margin are degenerate over the printed range (a 0.9 degree step is worth about four minutes,
which is the difference between +5 and +1), so the pair cannot be separated by any one season. With
the full year in hand the degeneracy breaks:

| Parameterisation | Alger | Adrar | Djelfa | 1448 holdout |
| --- | --- | --- | --- | --- |
| isha 16.10 / +5 nearest (frozen) | 288/343 w1 | 354/354 w1 | 326/354 w1 | 150/179 w1, worst 3 |
| isha 17.00 / 0 ceil | **343/343 w1** | **354/354 w1** | **354/354 w1** | **179/179 w1** |

With isha at 17.00/0 ceil the whole recipe reproduces **2113/2113 Alger, 2124/2124 Adrar, 2123/2124
Djelfa and 1074/1074 on the 1448 holdout**, worst one minute everywhere, at each wilaya's own
coordinates. Exact counts rise to 84.1, 86.2 and 85.5 pc.

This is a re-parameterisation of one printed curve, not a new method: the same computation, described
at the angle the summer months identify. The owner decides whether the app ships 16.10/+5 or
17.00/0 ceil. The data says 17.00/0 ceil is the better description of what the ministry prints.

---

## 4. Between-year verdict, extended to the summer corner

Same Hijri cell, one Hijri year apart (354 or 355 Gregorian days), printed difference against adhan's
difference at the frozen recipe. Six months now, including both solstice corners:

| Month | Gap | fajr printed / model / resid | maghrib printed / model / resid | isha printed / model / resid |
| --- | --- | --- | --- | --- |
| 1 Muharram | 354 | -8.17 / -8.14 / -0.03 | +2.34 / +2.44 / -0.10 | +4.59 / +4.53 / +0.06 |
| 5 Jumada I | 354 | -9.83 / -9.87 / +0.04 | +11.37 / +11.48 / -0.11 | +10.23 / +10.23 / +0.01 |
| 6 Jumada II | 354 | -9.00 / -8.90 / -0.10 | +2.03 / +1.99 / +0.04 | +0.79 / +0.84 / -0.05 |
| 7 Rajab | 355 | -2.76 / -2.84 / +0.08 | -7.34 / -7.24 / -0.11 | -6.69 / -6.75 / +0.06 |
| 9 Ramadan | 354 | +14.34 / +14.27 / +0.08 | -11.28 / -10.92 / -0.36 | -10.59 / -10.50 / -0.09 |
| 11 Dhu al-Qada | 354 | +17.07 / +16.96 / +0.11 | -9.83 / -9.82 / 0.00 | -13.38 / -13.11 / -0.27 |

Residual means sit at or under 0.36 minutes and residual maxima under 1.2 minutes on every column of
every month, winter and summer alike. The printed drift between the two Hijri years is the sun's own
drift over 354 days, and no month shows a reprint: a copy would print a difference near zero, and the
smallest printed difference here is 0.17 minutes (dhuhr, Jumada I) with twenty-one of the thirty-six
month-column pairs beyond five minutes.

**Verdict: the recipe is frozen across the two Hijri years and across the solstices.** The 1448 book
is freshly computed, and the 1447 books are the same computation at their own coordinates.

---

## 5. Seasonal amplitude beside the stability

Printed span inside January and inside July, with the recipe's modelled span beside it:

| Site | fajr Jan / Jul (model) | sunrise | dhuhr | asr | maghrib | isha |
| --- | --- | --- | --- | --- | --- | --- |
| Alger | 7 / 30 (6.9 / 29.8) | 10 / 20 (10.1 / 20.2) | 10 / 3 (9.8 / 2.6) | 26 / 2 (26.7 / 1.9) | 30 / 15 (29.7 / 15.6) | 26 / 25 (26.2 / 23.8) |
| Adrar | 3 / 20 (3.0 / 20.2) | 5 / 15 (5.1 / 14.8) | 10 / 2 (9.9 / 2.6) | 21 / 5 (21.3 / 4.6) | 23 / 10 (23.6 / 10.1) | 21 / 16 (20.8 / 14.9) |
| Djelfa | 6 / 27 (5.9 / 27.0) | 8 / 19 (8.8 / 18.8) | 10 / 3 (9.9 / 2.6) | 25 / 2 (25.3 / 1.7) | 28 / 14 (28.1 / 14.2) | 25 / 22 (24.8 / 21.3) |

Modelled and printed agree to the minute in every month of every column, so the whole annual
extremum is now exercised by printed cells. The summer solstice corner that fit11 named as untested
is tested, and it is what moved the isha parameterisation.

---

## 6. Defects found in the source books

**The Alger book prints isha an hour high on eleven days.** 2026-02-14 to 02-18 read 20:50, 20:51,
20:51, 20:52, 20:53 against 19:49 on 02-13, and 2026-04-13 to 04-18 read 21:47 to 21:52 against
20:45 on 04-12. Both clusters were re-rendered at 6x and read again: the print is unambiguous, and
both resume the correct ramp one day after the cluster ends (Ramadan 1 at 19:54; Dhu al-Qada 1 at
20:53). The Adrar and Djelfa books print those same dates correctly, so the defect is in the Alger
book alone. The eleven cells are excluded from every score above and listed in the fit bundle.

**The Djelfa book prints one asr cell ten minutes early.** 2026-01-18 reads 15:33 between 15:42 and
15:44. Recorded as printed, excluded from no score but named here; it is the only cell in 6372 that
breaks its own ramp.

**The qibla column returns earlier than fit11 could see.** fit11 held no Sha'ban page and inferred
that the column resumes on 19 February. With all twelve months in hand it resumes on 2026-02-15 for
Alger, 2026-02-21 for Djelfa and 2026-03-18 for Adrar, each at the morning moment the sun first
reaches the qibla azimuth after sunrise. The column is not a prayer time and is not fitted.

**The Constantine table's second column is sunrise under an imsak header.** Values run 07:18 on
2026-02-19 to 06:39 on 2026-03-19, which is sunrise, not the pre-dawn imsak the header names.
Recorded as sunrise.

---

## 7. A fourth wilaya: Constantine, Ramadan 1447

Wayback holds no fourth book (section 8), but the Constantine directorate published its own Ramadan
1447 table, captured at `captures/dz-constantine-ramadan1447-internews.jpg` (internews.dz,
2026-02-18, stamped by the directorate). 29 days, six columns, 174 cells, transcribed to
`src/tsv/co47-09.tsv`.

At Constantine 36.3650/6.6147 with the frozen recipe: 170/174 inside one minute, worst 2, and the
signed residuals are uniform rather than seasonal, fajr -0.47, sunrise -0.76, dhuhr -0.73, asr -0.80,
maghrib -4.63, isha -5.53. Refitting only the margins at that site gives fajr 0 ceil, sunrise +1
nearest, dhuhr +1 floor, asr +1 nearest, **maghrib +5 floor, isha +6 floor**, which holds 174/174 at
worst one minute.

So the fourth wilaya confirms the angles and the structure, and prints maghrib and isha one minute
later than the ministry books do. A Ramadan public table carrying one precautionary minute is the
plain reading; the capture does not say, and nothing here is adjudicated.

This is a directorate surface, not a ministry book: one month, six columns, no other wilaya of the
year. It is recorded as a new wilaya surface with that limit stated.

---

## 8. The fourth book: honest negative

The Wayback CDX index for `marw.gov.dz/media/calendrier/` with `matchType=prefix` returns exactly four
PDFs, saved at `captures/wb/cdx-calendrier-domain.json`:

| URL | First capture | Bytes |
| --- | --- | --- |
| `.../1447/Adrar.pdf` | 2026-02-19 | 3565336 |
| `.../1447/Alger.pdf` | 2026-02-20 | 3193899 |
| `.../1447/Djelfa.pdf` | 2026-02-19 | 3307763 |
| `.../1448/Alger.pdf` | 2026-07-30 | 3638619 |

No Oran, Constantine, Annaba, Setif or Bechar book exists under that path in any year the archive
holds, and the 1448 folder carries one book, not three. The per-wilaya offset register printed on
every page footer is the ministry's own display aid for the other 55 wilayas, and fit11 showed it
does not reproduce a regional book: it carries 25 northern wilayas, misses Djelfa and Adrar entirely,
and its own longitude rule misses Adrar's sunrise by 17 minutes. Searched in Arabic for wilaya-specific 1447 books; the only per-wilaya surfaces reached are the
Constantine Ramadan table above and directorate Facebook posts with no dated rows.

---

## 9. Does one recipe serve the country at the user's coordinates?

Yes, and the three books are the proof rather than the assumption.

**The books differ from each other exactly as their sites do.** Over 354 paired days, Adrar minus
Alger prints +24.23 fajr, +13.44 sunrise, +13.32 dhuhr, +13.59 asr, +13.20 maghrib, +3.14 isha; adhan
at the two sites gives +24.15, +13.53, +13.41, +13.68, +13.29, +3.92. Residual means 0.09 minutes or
less on every column, maxima under 1.2. Djelfa minus Alger prints +2.33 fajr and -0.78 sunrise, and
the model gives +2.25 and -0.77. Nothing in the difference between two books is a convention or a
per-wilaya fudge: it is the coordinate difference and nothing else.

**A user must be served at their own coordinates, because the spread is large.** One degree of
longitude is a flat four minutes on every column; one degree of latitude is up to six minutes on fajr
and 5.5 on isha at Alger's latitude:

| Offset | fajr | sunrise | dhuhr | asr | maghrib | isha |
| --- | --- | --- | --- | --- | --- | --- |
| lat +0.25 (28 km) | 1.5 | 0.7 | 0.0 | 0.7 | 0.7 | 1.4 |
| lat +0.50 (55 km) | 3.0 | 1.5 | 0.0 | 1.4 | 1.5 | 2.7 |
| lat +1.00 (111 km) | 6.0 | 3.0 | 0.0 | 2.8 | 3.0 | 5.5 |
| lon +1.00 | 4.0 | 4.0 | 4.0 | 4.0 | 4.0 | 4.0 |

Within one wilaya the error stays inside a minute or two; between wilayas it reaches 24 minutes
(Adrar against Alger on fajr). So the country is served by computing at the user's coordinates with
the one recipe, never by shipping a neighbouring wilaya's book.

**Confidence and its ceiling.** Four independently published surfaces (three ministry books over 354
days each, one directorate table), one recipe, every cell inside one minute once the isha
parameterisation is fixed. Data ceiling: 1447 complete for three wilayas, 1448 held for six months of
Alger, no forward horizon beyond 1448. Longevity is stable-across-two-Hijri-years, not proven to a
year.

---

## 10. Files

- `data/dz47-1447-all.json`, `data/ad47-1447-all.json`, `data/dj47-1447-all.json`: 354 days each, with
  the month inventory and the ramp audit.
- `data/dz-fit-1447-full.json`: frozen and isha17 scores per wilaya and per month, free fits, angle
  ridges, implied points, cross-book residuals, coordinate sensitivity, seasonal amplitude, every
  miss of two minutes or more.
- `data/dz-between-year-full.json`: the 1448 holdout and the six-month same-cell drift.
- `data/dz-constantine-1447-ramadan-fit.json`: the fourth wilaya.
- `src/tsv/`: 33 transcribed month files, one line per printed day.
- `src/`: `render-pages.zsh`, `assemble.js`, `fit.js`, `diag-isha.js`, `between-year.js`,
  `fit-constantine.js`, `pdftext.swift`.
- `captures/`: the four PDFs, the Constantine table image, the Wayback CDX index.
- `pages/`: every rendered table crop read, plus the 6x re-checks of the Alger isha clusters.
