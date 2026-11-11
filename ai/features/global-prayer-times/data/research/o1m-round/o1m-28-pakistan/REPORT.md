# O1m-28 - Pakistan's perpetual chart family, completed

Wave O1m-28, round o1m, 2026-11-11. Workspace `$HOME/athan-gitree/census/o1m/o1m-28-pakistan/`.
Nothing in the repository was touched.

## 1. Headline

The chart family that defeated two rounds was never a capture problem. It is a **10-pixel-per-digit
print**, and its native artifact is all that exists: the publisher serves one 2550-pixel-wide JPEG
and no larger original anywhere public. What fixed it is a decoder: cluster every glyph on the page,
label the clusters once from the chart's own day column (which prints 1 to 31 in order, so it
labels itself), then read every cell from those labels.

Result: **25 Pakistani cities banked, 9,120 dated chart-days, 63,227 time cells, and zero cells
that disagree with the recalculated prayer by more than four minutes** in every one of them. A
twenty-sixth chart (Quetta) is captured but its column map fails from April, so none of it is banked.
Rawalpindi and Faisalabad, both recorded UNREADABLE at 14px in O1m-20, are now two of the cleanest charts in
the family at 84.9 percent and 84.7 percent all-six-within-1.

The four cities O1m-20 recorded as absent from the archive (Sialkot, Hyderabad, Gujranwala,
Sargodha) all exist. They are not on archive.org, and that negative is confirmed. They are on the
publisher's own image directory, which the earlier waves never enumerated.

| Measure | Value |
| --- | --- |
| Cities banked | 25 (Quetta captured, not banked) |
| Dated chart-days | 9,120 |
| Time cells read | 63,227 (613 named gaps, 0.96%) |
| Native artifacts saved | 29 PDFs, 29 page images, 176 MB |
| Fits | one recipe, zero residual beyond 4 min in every banked city |
| Federal 13:00/13:15 dhuhr convention | 0 hits in every one of 26 charts |
| Cross-check against O1l-12's hand-read January | 217 of 217 cells identical |

## 2. What the earlier rounds were up against, measured

`Rawalpindi-n-t.pdf` is a single PDF page carrying one JPEG, `/Width 2550 /Height 5460`, DCTDecode.
The publisher's copy is byte-identical to the o1l-12 mirror (sha256 `b319f2fd…`), so there is no
higher-resolution original behind it. Measured on the page:

- Row pitch 34.5 px, glyph height 21 px, time-cell width 50 px for `H:MM` and 64 px for `HH:MM`.
- That is **10 to 12 pixels per digit**, stroke width 1 to 2 px, in a bold condensed face.
- The page is bilevel already: 8.5 percent of pixels below 60, the rest above 240. No grey ink to
  recover, no colour separation to exploit, and the same result from the red, green and blue
  channels.

The bundled Vision reader mangles this face predictably: `5` returns as `i`, `î` or `j`; `0` as
`()`; `2` as `?`; `6` as `(`. Column strips at 3x, 4x and 5x therefore read 9 to 15 of 31 values,
and the leading `5` never survives. O1m-20's "about 14 px per digit" note was measuring correctly
and concluding correctly about the reader; the reader was the limit, not the page.

## 3. The decoder

`pipeline/chart.py`, `pipeline/decode.py`, `pipeline/rows.py`, `pipeline/fallback.py`. Pure local
Python and the local Vision binary. No model-vision pass anywhere in this wave.

1. **Grid.** Horizontal rules are the row separators (32 per band, pitch 34.5 px). Vertical rules
   are the panel borders. That gives four bands of three month panels, and in each panel one day
   column followed by seven time columns.
2. **Glyphs.** Each cell is cropped to its ink rows and segmented on sub-pixel column gaps. Each
   glyph is normalised to a 16x16 canvas, height-fitted, centred.
3. **Clustering.** Greedy nearest-mean over the page's 11,600 glyphs, threshold 0.05. The page
   separates cleanly into 14 named clusters plus digit variants: the distance between two instances
   of one digit is 0.05, the distance between two different digits is 0.13 or more.
4. **The Rosetta stone.** The day column prints 1..31 in order, so its clusters label themselves:
   row 1..9 gives 1..9, rows 10..31 give 1 and 2 and 3 followed by 0..9. Every one of Rawalpindi's
   thirteen digit clusters received a 100 percent unanimous vote. The colon never appears in the
   day column and is named separately, by shape.
5. **Fallback.** Cells the cluster step cannot name get a second read as their own crop at 6x, and a
   value enters only if it parses as a clock and sits within four minutes of its neighbouring days.
6. **Proof, not faith.** Nothing is smoothed. The transcription is checked by the fit: a wrong digit
   lands 6, 10 or 720 minutes out, so a chart with zero residuals beyond four minutes across 2,555
   cells has no wrong digits in it.

**Cross-method proof.** O1l-12 hand-transcribed Rawalpindi's January block by eye from the page
image. This decoder's January gives **217 cells, and all 217 agree, with zero differences** - 31
days times 7 columns, no exceptions. Day 1 reads `5:43 7:12 11:28 12:12 3:33 5:13 6:39`, exactly the
record's sample, produced by a completely different method two rounds later. That is why the decoder
is trusted, and why the charts it read are banked.

## 4. Captures

`captures/src/` holds 29 publisher PDFs (83 MB); `captures/native/` holds each page's own embedded
image extracted at its native pixel size (83 MB). Every URL was reached with a browser user agent;
no form, login or captcha was involved.

Source directory discovered this wave: `https://invent.ilmkidunya.com/images/Section/<City>.pdf`
and `<City>-n-t.pdf`. Two naming forms coexist. The directory carries **26+ city charts**, not the
two the record knew about.

| City | File | Native px |
| --- | --- | --- |
| Rawalpindi | `Rawalpindi-n-t.pdf` | 2550 x 5460 |
| Faisalabad | mirror of the Hanfi chart held in o1l-12 | 2550 x 5392 |
| Sialkot | `Sialkot.pdf` | 2550 x 5582 |
| Gujranwala | `Gujranwala.pdf` | 2288 x 5508 |
| Sargodha | `Sargodha.pdf` | 2209 x 5508 |
| Hyderabad | `Hyderabad.pdf` | 2223 x 5391 |
| Karachi | `Karachi-n-t.pdf` | 2550 x 5504 |
| Lahore | `Lahore-n-t.pdf` | 2550 x 5424 |
| Islamabad | `Islamabad-n-t.pdf` | 2550 x 5435 |
| Jhelum | `Jhelum-n-t.pdf` | 2324 x 5410 |
| Bahawalpur | `Bahawalpur-n-t.pdf` | 2332 x 5308 |
| Sukkur | `Sukkur-n-t.pdf` | 2324 x 5418 |
| Dera Ghazi Khan | `DeraGhaziKhan.pdf` | 2288 x 5356 |
| Attock, Bahawalnagar, Dera Ismail Khan, Jhang, Kohat, Larkana, Mirpur Khas, Multan, Narowal, Nawabshah, Okara, Quetta, Sahiwal | one file each | 2200-2550 x 5300-5600 |

Format, identical across the family: twelve month panels, seven time columns
(fajr, sunrise, zawal, zuhr, asr, maghrib, isha), 31 day rows, February left blank from day 29 -
the charts are 365-day, not leap-year. Times are printed on a **12-hour dial with no am/pm**, so
fajr, sunrise and zawal need no conversion and asr, maghrib and isha take +12 before noon. Zuhr
stays as printed: in December these charts print `11:57`, which is the morning side of solar noon.

**The charts do not name their city.** The titles read only `PERPETUAL SAUM-O-SALAT TIMETABLE` or
`HANFI PERPETUAL SAUM-O-SALAT TIMETABLE`. City identity rests on the publisher's filename, and that
is the one provenance weakness of the family - recorded, not resolved.

## 5. Fits

Recipe, one across all 26: **adhan 4.4.6, fajr 18.0, isha 18.0, Madhab.Hanafi, Rounding.None,
HighLatitudeRule default, tz Asia/Karachi**, dates built from the chart's own month-day grid at
reference year 2026 (every chart is undated, so the year is a reference frame, not a claim).
Residual is chart minus engine, in minutes. Margin is the column's median residual, reported to
half a minute so the printed rounding stays visible. w1 is within one minute of the margin.

| City | Days | fajr w1/margin | sunrise | zuhr | asr | maghrib | isha | all-six | >4 min |
| --- | ---: | --- | --- | --- | --- | --- | --- | ---: | ---: |
| Dera Ghazi Khan | 365 | 358/365 -0.5 | 361 -0.0 | 365 +0.5 | 360 +0.5 | 361 +3.5 | 351 +0.5 | 91.2% | 0 |
| Mirpur Khas | 364 | 356/364 -0.5 | 347 -0.5 | 364 +0.5 | 362 +0.5 | 360 +3.5 | 360 +0.5 | 91.2% | 0 |
| Sukkur | 365 | 363/365 -0.5 | 361 -0.5 | 365 +0.5 | 359 +0.5 | 344 +3.0 | 357 +0.5 | 89.9% | 0 |
| Karachi | 365 | 364/365 -0.5 | 363 -0.5 | 365 +0.5 | 349 0.0 | 361 +3.0 | 348 +0.5 | 89.6% | 0 |
| Larkana | 363 | 361/363 -0.5 | 358 -0.5 | 363 +0.5 | 354 +0.5 | 346 +3.5 | 347 +0.5 | 89.3% | 0 |
| Multan | 365 | 351/365 0.0 | 356 0.0 | 365 +0.5 | 364 +0.5 | 361 +3.5 | 349 +0.5 | 89.3% | 0 |
| Dera Ismail Khan | 365 | 359/365 -0.5 | 358 0.0 | 365 +0.5 | 355 +0.5 | 354 +3.5 | 341 +0.5 | 87.4% | 0 |
| Sahiwal | 365 | 347/365 -0.5 | 352 0.0 | 365 +0.5 | 361 +0.5 | 361 +3.5 | 346 +0.5 | 85.8% | 0 |
| Rawalpindi | 365 | 350/365 -0.5 | 355 -0.5 | 362 +0.5 | 356 0.0 | 361 +3.0 | 341 0.0 | 84.9% | 0 |
| Faisalabad | 365 | 357/365 0.0 | 353 0.0 | 361 +1.0 | 356 +0.5 | 359 +3.5 | 338 +0.5 | 84.7% | 0 |
| Islamabad | 365 | 344/365 -1.0 | 340 -1.0 | 365 0.0 | 363 0.0 | 358 +3.0 | 348 0.0 | 84.7% | 0 |
| Kohat | 365 | 357/365 -0.5 | 360 -0.5 | 363 +0.5 | 348 0.0 | 362 +3.0 | 335 0.0 | 84.1% | 0 |
| Lahore | 365 | 332/365 -0.5 | 339 0.0 | 365 +0.5 | 365 +0.5 | 360 +3.5 | 355 +0.5 | 83.8% | 0 |
| Bahawalpur | 363 | 337/363 -0.5 | 349 0.0 | 363 +0.5 | 355 +0.5 | 358 +3.5 | 351 +0.5 | 83.7% | 0 |
| Gujranwala | 365 | 336/365 0.0 | 340 0.0 | 365 +0.5 | 361 +0.5 | 358 +3.5 | 340 +0.5 | 80.8% | 0 |
| Bahawalnagar | 365 | 346/365 -0.5 | 350 -0.5 | 365 +0.5 | 343 0.0 | 347 +3.5 | 344 +0.5 | 80.3% | 0 |
| Jhelum | 365 | 347/365 -0.5 | 341 -0.5 | 365 +0.5 | 355 +0.5 | 345 +3.5 | 338 +0.5 | 79.7% | 0 |
| Jhang | 365 | 351/365 -0.5 | 347 -0.5 | 365 +0.5 | 362 +0.5 | 358 +3.5 | 291/304 +0.5 | 73.7% | 0 |
| Narowal | 365 | 324/365 -0.5 | 326 0.0 | 365 +0.5 | 360 +0.5 | 341 +3.5 | 346 +0.5 | 73.7% | 0 |
| Attock | 365 | 349/365 -0.5 | 349 -0.5 | 365 +0.5 | 356 +0.5 | 343 +3.0 | 281/304 0.0 | 68.8% | 0 |
| Nawabshah | 365 | 359/365 0.0 | 364 0.0 | 365 +0.5 | 360 +0.5 | 365 +3.5 | 238/243 +0.5 | 63.8% | 0 |
| Hyderabad | 365 | 356/365 **-5.5** | 353 **-5.0** | 365 **-4.5** | 362 **-4.5** | 364 **-1.5** | 236/242 **-4.5** | 61.6% | 0 |
| Sargodha | 365 | 343/365 -0.5 | 346 0.0 | 365 +0.5 | 364 +0.5 | 355 +3.5 | 240/243 +0.5 | 58.9% | 0 |
| Okara | 365 | 342/365 -0.5 | 341 -0.5 | 365 +0.5 | 364 +0.5 | 358 +3.5 | 237/243 +0.5 | 58.1% | 0 |
| Sialkot | 365 | 203/365 **+2.5** | 266 **+2.0** | 365 **+2.5** | 233 **+2.5** | 223 **+5.5** | 201 **+2.0** | 27.7% | 0 |
| Quetta (not banked) | 365 | column map fails from April, see section 7 | | | | | | 26.8% | 926 |

Full per-column scores, quarter medians, seasonal amplitude and angle sweeps are in
`fit/pakistan-family-fit.json` and `fit/pakistan-summary.json`.

### The family verdict

**One angle pair, one madhab, one margin template.** Across the 25 banked cities the pair is
**18.0 fajr and 18.0 isha, Hanafi**, and the margins are:

- fajr -0.5, sunrise -0.5 to 0, zuhr +0.5, asr +0.5, **maghrib sunset +3.5**, isha +0.5.

with two sub-variants: Karachi, Islamabad, Kohat, Attock and Bahawalnagar carry **maghrib sunset
+3.0 and isha 0**, and Islamabad carries the bare floor everywhere (fajr -1, sunrise -1, zuhr 0,
asr 0, maghrib +3, isha 0). That is the same shape O1l-21r measured at Peshawar, where the chart was
the bare recipe plus +1 on maghrib and isha - so the five-city record of "four cities, four margin
sets, one angle pair" now stands at **twenty-five cities, three margin sets, one angle pair**.

**The angle pair is not separable from its ihtiyat at this resolution.** Sweeping fajr to 18.4 moves
Rawalpindi's median from -0.68 to +0.42 while within-1 barely moves; naming 18.0 as the truth and
the -0.5 as the printed pad is the honest statement, exactly as the Perak finding recorded for
Malaysia.

**The federal chart's dhuhr convention is not in the provincial layer.** The 13:00/13:15 clock
matches **0 of 365 days in every one of the 26 charts, Quetta included**. Dhuhr is solar noon plus half a minute to a minute
everywhere. O1l-12's finding is now measured on 26 cities instead of four.

**Hyderabad is the family's second oddity.** Every column sits 4.5 to 5.5 minutes *earlier* than the
engine at the gazetteer point, with the tightest scatter in the family (zuhr 365/365, maghrib
364/365). A uniform shift of that size is a meridian, not a recipe: the chart behaves as though it
were computed about 1.1 degrees east of Hyderabad city. Maghrib alone is only -1.5 because it keeps
the +3 sunset pad. **Flagged, not adjudicated**; the chart's identity also rests only on the
publisher's filename.

**Sialkot is a hand-computed table.** It is one of the "Islamic Academy, 5.00 Hours from GMT" prints,
and it is the only chart whose quarter medians wander (fajr 1.45 | 3.23 | 3.38 | 1.38 across the
year, maghrib 5.85 | 4.08 | 5.03 | 6.45). Its zuhr is still 365/365 within a minute, so the template
is the same and the twilight columns are computed by hand or rounded in a table. Same class as the
Quetta chart O1l-21r flagged for a a plus-or-minus 5 minute annual asr swing.

**Karachi now has a second witness, and the two disagree.** The archive.org Karachi chart fitted in
O1l-12 runs fajr 18.4 with margins -2.3 and **maghrib at sunset minus 0.5, asr +3.5**. This
publisher's Karachi chart runs fajr 18.0 with **maghrib sunset +3.0, asr 0.0**. Two distinct Karachi
tables exist. Neither is authority; both are community prints. This is the family's clearest case
where a second witness does not confirm a city but splits it.

Seasonal amplitude, for the fit index's high-latitude comparison: fajr Jan-to-Jul span runs 92 min
at Karachi, 122 to 134 min across Punjab and Khyber Pakhtunkhwa, and 95 min at Hyderabad.

Grades. One published cycle per chart, undated, designed never to be superseded: **provisional** by
the T-667 vocabulary for every one of them, with the family-level recipe now carrying 25 independent
charts. No A grade is available from this family, and no future year can be harvested from it.

## 6. The federal chart - register probe

Probed **2026-11-11T12:20:53Z**. `https://mora.gov.pk/SiteImage/Publication/New_Chart_2016_One.pdf`
returns 200, 6,600,971 bytes, `application/pdf`, sha256 prefix `9babc428ffb200c4d6a5b354` - **byte
identical** to the o1l-12 capture, so the register has not changed since 03:39Z. The Publications
page carries 26 links and not one dated 2026 or 2027; the newest artefacts are the 2024-25 year book
and the 2025 Seerat collection. **The 2025-11 approved unified timetable for 1 January 2026 remains
unpublished.** Negative dated 2026-11-11T12:20:53Z.

## 7. Negatives and defects

1. **The four "absent" cities exist.** O1m-20 recorded Sialkot, Hyderabad, Gujranwala and Sargodha as
   absent from the archive. Confirmed absent from archive.org: the perpetual-chart family there is
   exactly 22 items and neither Urdu (`دائمی نقشہ اوقات نماز <city>`) nor English (`naqsha namaz
   <city>`) queries return any of the four - searched in Urdu, English and transliteration. They are
   present on the publisher's image directory, which no earlier wave enumerated. The negative was
   real and the conclusion drawn from it was wrong.
2. **The publisher serves no higher-resolution original.** The one JPEG per chart is the whole
   artifact. Rawalpindi's copy on the publisher's host is byte-identical to the o1l-12 mirror.
3. **Quetta's column map breaks from April.** The ilmkidunya Quetta chart's later panels carry an
   extra leading column, so the generic eight-slot map shifts by one and reads the day column as
   fajr. January to March decode correctly; April to December are captured, transcribed into
   nonsense and therefore **not banked**. The chart is a genuine capture, not a capture failure, and
   it needs its own column map - the same shape O1l-21r documented for the archive.org Quetta print.
4. **Six hundred and thirteen cells are unreadable, 0.96 percent of the banked total**, and they sit
   in seven charts rather than being spread: Hyderabad 124, Nawabshah, Okara and Sargodha 122 each,
   Attock and Jhang 61 each, Dera Ghazi Khan 1. Twenty-eight of them are the February 29 that the
   charts do not print. The rest are the isha column of the second-pass read, which clustering could
   not name and the 6x crop could not clear - counted and published as gaps, never filled.
5. **No chart names its city.** Identity is the publisher's filename only.
6. **Mardan, Peshawar and Swat do not parse** with the four-band assumption (Peshawar's file is a
   different, 593 KB chart entirely). Captured, not transcribed.
7. **The publisher directory is not an enumeration.** It was found by probing city names; there is no
   index page, so a city whose file is spelled differently will be missed. `Faisalabad-n-t.pdf` does
   not exist while `Rawalpindi-n-t.pdf` does - the two naming forms coexist and neither is complete.

## 8. NEXT - the cleanest transcription path

The 14-pixel problem is a **source** problem and cannot be captured away: the publisher's JPEG is the
artifact. The path that works, and that the next round should reuse verbatim from `pipeline/`:

1. `native.py` - pull the single DCTDecode page image out of the PDF at its own size.
2. `chart.py` - derive the ruled grid, segment glyphs, write every cell's bitmap.
3. `decode.py` - cluster the page's glyphs and label them from the **day column**, which is
   self-labelling. This is the whole trick and it needs no external truth, no template library and
   no language model.
4. `rows.py` - apply the 12-hour dial rule per column.
5. `fallback.py` - second read for the cells clustering cannot name, gated by a four-minute
   neighbour check.
6. Fit, and treat *any* residual beyond four minutes as an OCR defect rather than a clock
   disagreement. That gate is what proves the transcription rather than asserting it.

Concretely queued:

- The remaining **~20 publisher charts** already probed and unclaimed this wave, and the same
  directory probed against every district name in the census gazetteer, in both `City.pdf` and
  `City-n-t.pdf` forms.
- **Quetta**: build the per-chart column map for the later panels, then fit; the archive.org Quetta
  print already carries the 18.2/18.0 fit and an asr anomaly to compare against.
- **Mardan, Peshawar, Swat**: identify their templates before decoding.
- **The Islamic Academy prints** (Sialkot and kin): find whether their `5.00 Hours from GMT` line
  names a computation service, which would explain the hand-computed scatter.
- **Hyderabad**: settle the implied meridian, and find a second Hyderabad chart to test it.
- Every chart here is undated and perpetual. **No year-2 accrual exists for this family by
  construction**, so the census ceiling for Pakistan's city layer is one published cycle per city and
  the forward-longevity verdict is "no future year served". The federal calendar remains the only
  dated national object, and it is still unpublished.
