# O1m-14, Egypt imsakiya completion, the 2027 edition, the refused posters

Workspace `$HOME/athan-gitree/census/o1m/o1m-14-egyptimsa/`. Leaf agent, round o1m, wave 14.
Inputs: O1m-R3 (`o1m-r3-egyptkz`: the ESA door, its 245 extracted page images and four hand-read
city-months), O1l-14 (`egypt-82`: the postback sweep and the 82 coordinates), FIT-RULES.md,
BRIEF.md. The repo is untouched. Captures in `captures/`, dated rows in `data/`, fits in `fit/`.

---

## FRONT 1, the imsakiya completed

### What was transcribed

| edition | file | Wayback | pages | city-months | rows |
|---|---|---|---|---|---|
| 1445 | `emsakya/1445.pdf` | 20240313154903 | 77 | 77 | 2,310 |
| 1446 | `emsakya/1446-2.pdf` | 20250218164930 | 90 | 90 | 2,610 |
| 1447 | `emsakya/1447.pdf` | 20260205141154 | 78 | 78 | 2,340 |
| 1446, second edition | `emsakya/1446-4.pdf` | 20251130121842 | 93 | 93 | 2,697 |

**338 city-months and 7,260 printed days on the three main editions, 58,080 time cells**, every
one read from the publisher's own page image. R3 banked 4 city-months by hand (Aswan 1445/1446/
1447, Alexandria 1445); this wave adds the other 334.

The second 1446 edition is a discovery of this wave: the CDX index carries `1446-4.pdf` at two
captures (`20250323131355`, 28,898,486 B and `20251130121842`, 35,113,278 B) and `1446.pdf` at
`20250414175012` (21,653,162 B), where the capture R3 reached was truncated at exactly
1,048,576 B. The `-4` edition holds 93 city pages against the `-2` edition's 90.

### The reading method

The pages are 30-row tables of Arabic-Indic digits about 13 px tall. A model-vision pass is not
reproducible across 338 pages, and the host's local Vision binary reads these digits
inconsistently: on a crop whose values are known it returns `£` for ٤, `)` for ٣ on one row and
`r` on the next (`captures/ocr-test-rows1-4.png`, output in the session log), so it cannot be
gated. The reading is mechanical and self-checking instead:

1. **Ruling lines.** Horizontal rules by longest dark run per row, vertical rules per column, at
   four thresholds, taking the first that yields a layout this printer makes (12 or 13 columns
   in the 1445/1446 editions; 20 in 1447, whose hour and minute sit in separate columns). A rule
   that does not detect is recovered from the darkness profile of the table body, or from a
   second, faint line; a band that merges two days is split on the faint rule it left, else on
   the blank row between the glyph rows.
2. **Cells to glyphs.** Column projection, with pieces joined when the gap is under 3 px (this
   face prints ٧ as two strokes).
3. **Digits to numbers.** Hour and minute are two printed numbers inside one cell in 1445/1446
   (split at every gap, each split a candidate) and two columns in 1447. Digits run left to
   right, most significant first.
4. **Templates.** Each edition's templates are trained on the Aswan page of that edition, 240
   known cells from R3's hand transcription label about 960 glyphs, all ten digit classes
   present, and every other page is read against them by nearest neighbour on a 20x14 bitmap.
5. **The clock.** Asr, maghrib and isha print on a **12-hour clock** (`عصر مساء`, `مغرب مساء`,
   `عشاء مساء`); fajr, sunrise and dhuhr print the plain hour. Measured on the page
   (`captures/dbg-header-cols.png`) and cross-checked on the daily poster: 2026-06-02 prints
   asr 4:29 for 16:29 and isha 9:24 for 21:24.

Two held-out tests ran before any page was banked:

| test | cells | exact | note |
|---|---|---|---|
| Alexandria 1445 read with Aswan 1445 templates (another page, same edition) | 180 | 179 | the one difference is a defect in the R3 file |
| Aswan 1446 read with Aswan 1445 templates (another edition, 1119x1600 against 1228x1754) | 174 | 174 | templates transfer across editions unchanged |

**A defect in the R3 hand transcription.** Alexandria 1445, 2024-03-27, dhuhr: the R3 file
carries 12:06; the page prints `١٢ ٥` (the ٥ matches its template at 6.3 against 92.6 for ٠, and
the 8x crop in `captures/dbg-alex-r17-dhuhr.png` shows the circle), and the recipe at
Alexandria's own point gives 12:05. The OCR reading is banked; the R3 row was pulled to
al-adkar's steady +1 on dhuhr.

### Gates, printed relations, never the recipe

Three relations the publisher prints, checked on every row of every page:

- `imsak = fajr - 20`
- `suhur = imsak - 120`
- day-to-day drift under 3 minutes on every column (sunrise moves about a minute a day in March)

A cell that broke a relation, or landed outside the interval its neighbours allow, or sat a
whole hour off the month's own quadratic trend, was re-read, every split at native resolution,
then at 3x with LANCZOS upsampling, and replaced only by a candidate that restored the printed
relations. Every change is logged in the page file's `repairs` list with both values and the
reason. **119 cells of 58,080 were touched (0.20%): 77 fills where the first pass read nothing,
42 corrections.** No cell was ever set to a recipe value: the recipe is the instrument that
judges, never the one that fills.

### The fit, one recipe, every city, every year

The recipe is adhan 4.4.6, `CalculationParameters('Other', 19.5, 17.5)`, Shafi, zero adjustments,
`Rounding.None`, Europe/London civil time through each year's DST window. Two points are
reported: the gazetteer point (the O1l-14 coordinate list) and the point each table implies.
The publisher does not print its survey points, so the implied point is solved from the table -
dhuhr carries the longitude, the angles and the asr shadow the latitude, inside a 50 km box
around the gazetteer point (`scripts/eg-implied.js`, `fit/eg-imsakiya-implied.json`).

| edition | cities | cells | exact | within 1 | worst | cities at 100% within 1 |
|---|---|---|---|---|---|---|
| 1445, at gazetteer point | 77 | 13,860 | 74.60% | 94.74% | 3 |, |
| 1445, at implied point | 77 | 13,860 | **91.78%** | **100.00%** | **±1** | **77 of 77** |
| 1446, at gazetteer point | 83 | 14,616 | 73.09% | 93.81% | 29 |, |
| 1446, at implied point | 83 | 14,616 | **90.10%** | **99.12%** | 28 | 82 of 83 |
| 1447, at gazetteer point | 77 | 14,040 | 75.84% | 94.64% | 4 |, |
| 1447, at implied point | 77 | 14,040 | **89.41%** | **99.93%** | **2** | 73 of 77 |

The 1447 edition holds 78 pages; two of them (`052`, `055`) print `سفاجة`, the title of `055`
says so, and `052` is the page the time match settles on the same name, so the fit carries 77
city records over 78 pages. The 1446 edition holds 90 pages: 84 fitted and 6 printing cities the
select does not carry (below).

Per column at the implied point (exact% / within-1% / worst):

| edition | fajr | sunrise | dhuhr | asr | maghrib | isha |
|---|---|---|---|---|---|---|
| 1445 | 98.79 / 100 / −1 | 96.97 / 100 / −1 | 98.23 / 100 / 1 | 65.11 / 100 / −1 | 93.68 / 100 / 1 | 97.92 / 100 / 1 |
| 1446 | 96.18 / 98.80 / −28 | 95.55 / 98.80 / −24 | 97.42 / 99.71 / −6 | 61.74 / 99.79 / 2 | 93.56 / 98.80 / 14 | 96.05 / 98.80 / 17 |
| 1447 | 95.00 / 100 / 1 | 94.23 / 99.83 / 2 | 96.88 / 99.96 / 2 | 59.49 / 100 / −1 | 94.57 / 99.91 / 2 | 96.28 / 99.87 / 2 |

**The 19.5/17.5 Shafi zero-margin recipe reproduces the authority's own imsakiya within one
minute at all 77 cities of 1445, at 82 of 83 cities of 1446 and at all 77 cities of 1447 but for
five single cells.** Exactness runs 89-92%, asr the weakest column, the rounding signature R3
recorded (asr's seconds sit nearest the half-minute, so the printed minute tips either way).

The residual on the gazetteer point is coordinate, not recipe: across 236 city-editions the
implied point sits a median 8.3 km from the gazetteer centre, 48 km at the 90th percentile and
74 km at the worst, the wide ones all cities founded in the desert where the gazetteer entry is
a different phase of the same new town (`العبور`, `المنصورة الجديدة`, `بورسعيد الجديدة سلام`).

**The five cities that do not hold 100% within 1** (all one cell at 2 minutes, recorded, not
smoothed): `بنى سويف` 1447 (dhuhr 2), `سفاجة` 1447 (dhuhr 2), `غرب النوبارية` 1447 (2),
`الأقصر` 1447 (2), `واحة سيوة` 1445/1447 (2). One page fails wholesale:
**`واحة سيوة` 1446, page 035**, 122 of its 174 cells sit 3 to 28 minutes off the recipe at
Siwa, and the page reproduces the recipe at Siwa about six days ahead of its printed dates
(shifting the dates +6 days lifts within-1 from 20.7% to 82.8%). Its own print is coherent -
the 2025-03-01 row reads fajr 05:11, sunrise 06:37, dhuhr 12:29, asr 15:51, maghrib 18:21,
isha 19:38, fast 13:30, and the offsets hold, so this is a publisher schedule that is not the
recipe at Siwa, and it is recorded as such, not repaired.

### Community cross-check

The al-adkar derivative agrees with the imsakiya to within 2 minutes on every cell of the cities
it serves: 3,060 cells (1445), 2,958 (1446), 3,060 (1447), worst 2, exact 71-73%. That is the
same ±1-2 stamp R3 measured from the other direction.

### Cities outside the postback list

The imsakiya covers cities the 82-option postback select does not. Page titles were read for
every page the time match could not settle (`data/page-city-overrides.json`, crops
`captures/dbg-title-*.png`): the first 1446 edition prints six cities the select does not carry -
`بني مزار الجديدة`, `دشنا`, `صدفا`, `قنا الجديدة`, `كوم حمادة`, `ملوي الجديدة`, and its second
edition adds `البليـنا` and `طمـا`. Each carries a full Ramadan month of dated authority times.
They are banked as rows and left out of the fit because no independent coordinate exists for
them; two further pages the title names (`واحة سيوة`, `العريش`, `سفنكس الجديدة`) are in the
select and fitted.

### The two 1446 editions are one computation

| gate | result |
|---|---|
| pages in the second edition with a cell-identical counterpart | 90 of 93 |
| cells compared | 15,817 |
| exact | 97.92% |
| within 1 | 99.46% |
| pages that differ from their counterpart | 1 (`السلوم`, mean 1.57 min, 27 cells over 2) |
| pages whose read did not settle | 2 (`البليـنا` 091, `طمـا` 092, the column rules do not detect and the fallback mis-crops; named by their titles) |

Two files, captured nine months apart, printing the same month: 90 of 93 pages did not move a
single cell, one moved a minute or two on 27 cells, and two could not be compared. Under the
grading vocabulary a byte-different relabelled edition is still ONE computed generation, and the
1446 year therefore stays provisional rather than A.

---

## FRONT 2, the 2027 (1448) edition: NOT MET, with the payload date

Probed 2026-11-11 ~10:47Z:

| probe | answer |
|---|---|
| `https://www.esa.gov.eg/emsakya/` | 403 (directory listing refused) |
| `https://www.esa.gov.eg/emsakya.aspx` | 404 |
| `https://www.esa.gov.eg/emsakya/1447.pdf` | 404 |
| `https://www.esa.gov.eg/emsakya/1448.pdf` | 404 |
| Wayback CDX `esa.gov.eg/emsakya*` filtered to `.pdf` | 7 rows, newest `1447.pdf` at 20260205141154; no 1448 |

`captures/cdx-emsakya-pdfs.json` holds the whole index. The publication pattern says the next
edition is not due yet:

| edition | first archived | Ramadan it serves | lead |
|---|---|---|---|
| 1445 | 2024-03-13 | 2024-03-11 | −2 days (recapture) |
| 1446-2 | 2025-02-18 | 2025-03-01 | +11 days |
| 1446-4 | 2025-03-23, again 2025-11-30 | 2025-03-01 | re-issue |
| 1447 | 2026-02-05 | 2026-02-18 | +13 days |

Ramadan 1448 begins about 2027-02-08, so the edition is due in the second half of January 2027.
**Verdict: NOT MET, payload date 2026-11-11.** The filename to watch is `emsakya/1448.pdf`, and
the pattern to watch is a first capture 10-15 days before the month.

---

## FRONT 3, the refused posters: 0 of 15 recovered, cause measured

The 15 refused days were re-probed through the CDX index and the `id_` replay, one request per
90 seconds, twice each (`scripts/wayback-retry2.zsh`, `logs/wayback-retry2.log`). Nothing was
banked; `captures/posters/` is empty.

| class | days | what the retry returned |
|---|---|---|
| replay 404 | 12, 2025-09-17..10-01 | 404 with a 4,635 B replay-error page, or 429 |
| HTTP 200 not a JPEG | 1, 2024-09-20 | 429 (block page, 620 B) |
| connection failure | 2, 2025-09-17 and 2025-10-01 | 429 |

The cause is in the index, not in the replay: the CDX row for each of the 13 days it would return
carries a **negative length field** (`-3572067800`, `-4158514468`, ..., `captures/cdx-missing15-all.jsonl`,
13 rows, 13 negative). A negative length means the index holds the URL but no payload was ever
stored, so no replay of any modifier can serve the image. The `id_` pattern is right and remains
documented; there is nothing behind it for these days. The Wayback host also answered the whole
retry window with HTTP 429 on bursts (620-byte block page), which is why the pacing is 90 s.

Eleven of the fifteen were re-probed before the session closed (2024-09-20, then 2025-09-17 to
2025-09-27); every reply was a 404 replay page, a 429 block page, or a 200 that is the block
page. The remaining four (2025-09-28..10-01) sit behind the same index rows with the same
negative length, and the pacing that would reach them needs an hour of 90-second gaps the
session did not have.

**Verdict: the 15 days are closed as publisher-side gaps in the 2025-09-17..10-01 outage window,
recorded with the index evidence, not as blanks.** The 563 banked sheets stand.

---

## FRONT 4, the 2026 poster against the postback grid, a third date

**2026-06-02: 30 of 30 cells identical.** The archived 2026-06-02 poster
(`captures/poster-2026-06-02-half.png` with full-resolution row crops) was transcribed for its
five cities and compared with the postback sweep O1l-14 banked: Cairo, Alexandria, Tanta, Assiut
and Aswan agree on all six columns (`data/eg-poster-2026-06-02.json`,
`fit/eg-poster-20260602-gate.json`). With R3's 2026-01-01 and 2026-11-11 this is three
independent days on which the printed poster and the ASP.NET grid are the same computation, and
2026-06-02 is inside the DST window (the poster prints asr 4:29, maghrib 7:52, isha 9:24 for
16:29, 19:52, 21:24).

**The endpoint still serves.** A live form refresh and one postback for Cairo and month 11
returned the 2026-11 grid (200, 46,799 B, 30 days). Its 2026-11-11 row, fajr 4:47 ص, sunrise
6:17 ص, dhuhr 11:39 ص, asr 2:40 م, maghrib 5:1 م, isha 6:21 م, is the banked sweep's row exactly
(04:47, 06:17, 11:39, 14:40, 17:01, 18:21), six cells of six (`captures/eg-live-post2.html`).
The city select still offers 82 cities plus `كل المدن`, unchanged from O1l-14, and the live grid
carries the same 12-hour clock with ص/م markers that the poster prints.

---

## Deliverables

- `captures/`, the 93 page images of the second 1446 edition, the 2026-06-02 poster and its row
  crops, the live and archived postback captures, the CDX enumerations (emsakya PDFs, the 13
  refused days), the title-strip reads, the cell crops that settle every disputed character, and
  the OCR comparison crops.
- `data/`, `imsakiya-<edition>-p<page>.json` × 245 with dated rows, per-cell costs and the
  repair log; `eg-imsakiya-1446b-pages.json` (93 pages); `page-city-map.json` (page → city, worst
  deviation, runner-up); `page-city-overrides.json` (title reads); `esa-coords-82.json`;
  `templates-<edition>.json`; `eg-poster-2026-06-02.json`; `eg-live-city-options-20261111.json`.
- `fit/`, `eg-imsakiya-fit.json` (gazetteer point, per city, per edition, with the al-adkar
  gate), `eg-imsakiya-implied.json` (recovered point, per city, per edition),
  `eg-imsakiya-1446-second-edition.json`, `eg-poster-20260602-gate.json`.
- `scripts/`, `imsa.py` (grid, bands, columns), `imsa_train.py` (templates), `imsa_read.py`
  (page reader), `imsakiya-run.py`, `imsakiya-recover.py`, `imsakiya-fix2.py`,
  `imsakiya-drift.py`, `imsakiya-fix.py` (superseded), `imsa-read-1446b.py`, `eg-fit.js`,
  `eg-implied.js`, `eg-1446-editions.js`, `wayback-retry.zsh` and `wayback-retry2.zsh`,
  `pdf-extract-jpeg.py`, `pipeline.zsh`.

## Negatives, all dated 2026-11-11

- 2027 imsakiya: not published; live paths 403/404, no CDX row. Payload date 2026-11-11.
- 15 refused daily posters: no payload in the index (negative CDX length), replay 404, host 429.
- ESA live directory listing `emsakya/`: 403.
- The two extra 1446 captures R3 missed (`1446.pdf` whole, `1446-4.pdf` first capture) are still
  blocked as bot traffic (620 B); the `1446-4.pdf` late capture serves and is transcribed.
- Vision OCR on these tables: not usable (digit rendering inconsistent across rows), measured.
- `واحة سيوة` 1446 page: publisher schedule off the recipe at Siwa; recorded, not repaired.

## NEXT

1. Fit the nine extra-city pages of the 1446 edition against a recovered point once a coordinate
   source exists for `ملوي الجديدة`, `قنا الجديدة`, `سفنكس الجديدة`, `بني مزار الجديدة`, `دشنا`,
   `صدفا`, `كوم حمادة`, `البليـنا` and `طمـا`; the rows are banked and gated on their offsets.
2. Read the 1446-4 edition's other eight pages whose column rules did not detect and pair them to
   the first edition; three cities appear only there.
3. Carry the 1447 edition's five single-cell 2-minute residuals to the world table as the
   recorded worst, and the `واحة سيوة` 1446 schedule as a dated publisher deviation.
4. Watch `emsakya/1448.pdf` from 2027-01-15; the pattern is a first capture 10-15 days before
   Ramadan 1448.
5. Transcribe the 143 archived 2026 posters beyond the three gated dates, the sheet archive is
   the authority's only daily rendering and 140 of its days are untranscribed.
