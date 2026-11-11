# o1m-20 — THE OCR BACKLOG, round o1m

Incremental record. Every count below is measured in this workspace; the command or file behind
each number is named.

## 1. What ran

| Step | Artifact | Count |
| --- | --- | --- |
| Inventory scan (`.pdf .jpg .jpeg .png .webp` under `captures/` in `o1l-city/` and `o1m/`) | `data/inventory2.tsv` | 2,236 sightings, 2,021 distinct after sha256 (`data/hashes.tsv`) |
| Page-level OCR, engine render | `text/` | 1,079 artifacts |
| Page-level OCR, native embedded image | `text-native/` | 809 PDFs attempted, 767 read, 42 unparseable |
| Reconciliation (keep the richer of the two per artifact) | `text/`, losers in `text-alt/` | 195 artifacts where the native page image beat the engine render |
| Classification | `data/classification.json` | TABLE 525, POSTER 56, OTHER 448, UNREADABLE 51 |
| Complete table rows ranked | `data/tablerows.tsv` | 99 artifacts clear 10 rows, 90 clear 30 |
| Fitted | `fit/algeria-marw-fit.json`, `fit/perak-2027-fit.json` | 4 Algerian sheets (732 dated rows, 2 cycles) and 7 Malaysian zones (2,548 dated rows, one full year) |

Nothing here entered the repository. Nothing used a model-vision pass: every character came from
`$HOME/athan-gitree/census/tools/ocr`.

## 2. The tool, measured — this is the finding of the wave

The Vision binary renders a PDF page at `min(2.0, 3000 / maxSide)`, which for an A4 page is about
1190 x 1684. The embedded page image is usually 2480 x 3508. Half the available resolution is
discarded before recognition, so the tool's own render is the weakest path for a scanned page.

Three preprocessing routes were measured. Each wins on a different artifact class, and only the
third reads a poster table:

1. **Render as the tool does (1190 px wide).** Wins on 614 of 809 PDFs, because a site-generated
   page has clean vector text and the render keeps it crisp. Fails on any scanned dense grid.
2. **Extract the largest embedded image and OCR that.** Wins on 195 of 809 PDFs and loses on 614,
   because the largest embedded object is often a decorative strip rather than the composed page.
   Melaka 1448 is the extreme case: the page's largest image is a 6673 x 2148 dark banner, and OCR
   of it returns zero characters at any crop, rotation or inversion.
3. **Render the page at 2400 px through `sips` on a single-page extract, then crop.** The only route
   that reads a poster table, and the route the named items below use.

Hard limits found, each repeatable:

- A single strip wider than about 4000 px or taller than about 5400 px returns nothing at all.
- A column strip of one table column, scaled 3x, reads 30 clean values in day order. That is the
  workhorse for a printed grid.
- Rotating a sideways scan recovers nothing on its own: Rangamati returned 26 and 38 characters at
  90 and 270 degrees against 30 characters upright.

## 3. Job 1 — inventory

`data/INVENTORY.md` is the register: 2,021 distinct artifacts with size, copy count, prior text
status, this wave's class and time-token count.

Two facts it establishes that earlier waves could not see:

- **906 of the 2,021 are Egypt imsakiya derivatives** (sheet crops, bands and page images under
  `o1m-r3-egyptkz` and `o1m-14-egyptimsa`). They are crops of one transcribed artifact and the
  brief orders Egypt skipped, so they are inventoried and not re-OCR'd.
- **A sibling `.txt` is not proof of readable text.** The Pakistan charts carry `.txt` files made
  by an earlier wave from a page render that made the Urdu headers mojibake: `ia-pk-peshawar-chart.txt`
  opens with `M-^HM-^A...` byte soup. Twenty-six artifacts held text before this wave; of those,
  the five Pakistan chart texts and the Polish panel OCR texts are unusable at cell level.

One inventory false negative is mine and worth recording: the sixteen DUM RF prints keep their OCR
in `captures/dumrf/ocr/<stem>.txt`, a subfolder rather than a sibling, so my scan marked them
NO-TEXT. They had text before this wave.

## 4. Job 3 — the named high-value items

### (a) Pakistan's perpetual chart family — PARTIAL, one target landed elsewhere

| City | Artifact | Verdict |
| --- | --- | --- |
| Multan | `ia-pk-multan.pdf` | **Text layer present.** 12 month pages, 7 time columns with seconds, 4,955 time tokens. Readable, but it was already banked and is not re-fitted here. |
| Lahore | `ia-pk-lahore-chart.pdf` | OCR only, 2,129 tokens, column order as printed (isha, maghrib, asr, zuhr, zawal, sunrise, fajr, day). |
| Quetta, Peshawar, Karachi | `ia-pk-{quetta,peshawar,karachi}*.pdf` | OCR text, and the Peshawar/Quetta traps stand exactly as documented: column 2 is fajr minus 5, column 16 is the maghrib window length. |
| Rawalpindi | `rawalpindi-perpetual.pdf` | **UNREADABLE.** Source is a 2550 x 5460 JPEG, about 14 px per digit. Vision returns the title and the footer correctly and mangles every cell: `5:50` comes back `j:?L)`, `6:00` comes back `():í?`. Cropped to a row band at 6x it returns nothing at all. Cells named unreadable: all 7 time columns, all 12 months. |
| Faisalabad | `faisalabad-namaz.pdf` | **UNREADABLE**, same class: 2550 x 5392, four pre-existing crops re-OCR'd and all four fail the same way. |
| Sialkot, Hyderabad PK, Gujranwala, Sargodha | — | **Not in the archive.** No artifact exists under any spelling in `o1l-city/` or `o1m/`. The archive.org perpetual-chart family (`دائمی نقشہ اوقات نماز`) is indexed by 22 items and is the next fetch. |

The method that reads this family is column strips at native resolution, as proved on the Algerian
calendars; the blocker for Rawalpindi and Faisalabad is the source scan, not the column logic.

### (b) Bangladesh — Rangamati permanent schedule — UNREADABLE

`ifb-rangamati-permanent-schedule.jpg` (10.2 MB, 3595 x 5385) and the RGB PNG twin. Upright OCR
returns 30 characters. At 90 degrees, 26. At 270 degrees, 38. Tiled 2x, 3x and 4x: zero. Inverted:
zero. The audience for this result: the poster is a photograph of a printed schedule with a
non-standard face, and the fast recogniser resolves no glyphs in it at all. Nothing invented,
nothing partially transcribed.

### (c) Malaysia — Perlis, Melaka and Terengganu 1448 — PARTIAL, one correction

| Artifact | Pages | Verdict |
| --- | --- | --- |
| `perlis-takwim-1448H.pdf` (67 MB) | 12 | **Header reads, body scrambled.** Column headers come out correct and in order (`SUBUH ZOHOR ASAR MAGHRIB IS'YAK TERBIT MATAHARI LINTASAN MATAHARI`, plus `MILADIAH HIJRIAH HARI`), which fixes the column mapping. Body cells are read column-major with dropped leading digits: page 3 row 1 prints `2:56,.-` where the column is a four-digit time. Named unreadable: the leading digit of every cell in the `LINTASAN MATAHARI` column, and the `MILADIAH` day column on pages 1 and 2. |
| `my-melaka-takwim-1448.pdf` | 2 | **Three Hijri months per page, six months in the file** (Muharram, Safar, Rabiulawal on page 1). Authority line reads `MAJLIS AGAMA ISLAM MELAKA`, months read with their Gregorian spans. Table body needs the column-positional pass; the page carries a 6673 x 2148 dark banner as its largest embedded image, which defeats image extraction and forces the `sips` render. |
| `my-terengganu-1448.pdf` | 28 | **CORRECTION to the O1m-16 note: this is a public-holiday calendar, not a prayer table.** Every page carries `HARI KELEPASAN AM TAHUN 2026`, `TARIKH / KELEPASAN / HARI` and rows like `AWAL MUHARAM | RABU | 17 JUN 2026 | 1 MUHARAM 1448`. The 367 flagged "table rows" in the low-res pass are holiday dates. Classified POSTER; no prayer times exist in it. |
| `penang-takwim-1448H.pdf` | 13 | Body reads at the engine render (303 rows in the first pass). The native-image path returns nothing for this file, so the reconciled `text/` copy is the render. |
| Kelantan | — | **Not in the archive.** No Kelantan poster under any spelling in either tree. |

Melaka's 1446 takwim (`melaka-takwim-2024-2025-1446H.pdf`) is the one Malaysian file that reads
cleanly end to end: 605 rows of exactly 7 times, column order imsak, subuh, syuruk, zohor, asar,
maghrib, isyak, with the Gregorian day and Hijri day printed per row. It is banked as
`data/melaka-1446-times.json`. Automated date binding of those rows failed and the reason is
recorded rather than papered over: OCR drops the printed day number on about a third of rows, so a
monotone date walk over the file binds 102 rows and mis-binds most of them. The rows are kept; the
dates are the open item.

### (d) The UK — Cambridge landed by panel, Karimia absent

**Cambridge annual poster — the method works.** The page is 2838 x 1734 carrying six month panels
in a 3 x 2 grid. Full-page OCR scrambles the panels; a 3 x 2 split, each panel scaled 2.5x, reads
month names and cell values in order. Output: `text/o1m/o1m-12-uk/captures/cambridge-annual.pdf.panels.txt`,
3,895 time tokens across the twelve panels, against an expected 12 months x 30 days x 12 values
(begins and jama'at for six prayers). Row assembly inside each panel is the remaining step; the
per-panel column strip method proved out on Algeria is the route.

Also recorded: `cambridge-2026-01.pdf` is not a PDF. It is 61 KB of `<!DOCTYPE html`, a capture of
an error page. That is why O1m-12 recorded the poster as unread rather than unfitted.

**Karimia Nottingham — no artifact exists.** There is no PDF in the archive; the only trace is the
O1m-12 note that TinyFish's extractor returned a lossy alternating-day grid. Nothing to OCR. A
public re-fetch of the poster is the next action and was not attempted here.

### (e) Egypt — skipped by order

906 derivative sightings inventoried, none re-OCR'd.

### (f) Other inventory hits with a table — the Algerian calendars and Perak 2027 landed

`dz-marw-calendrier-1447-{alger,adrar,djelfa}.pdf` and `dz-marw-calendrier-1448-alger.pdf` print an
explicit date key per row (`2025|1|06|27` for 27 June 2025) and seven clocks. 732 dated rows were
extracted and fitted; see section 5.

The single largest table in the backlog is Malaysia's Perak 2027 takwim, `my-perak-2027-zon1` ..
`zon7` (365 rows each, one per zone). Those seven PDFs carry a text layer, so OCR returns cells
exactly: **364 dated rows per zone with zero weekday rejections** — every printed day and weekday
agrees with the calendar, which is the strongest internal check in this wave. 2,548 rows banked as
`data/perak-2027-rows.json` and fitted in section 5.

## 5. Job 4 — the fit

Recipe, one across all four sheets: **adhan 4.4.6, CalculationMethod.MuslimWorldLeague (fajr 18,
isha 17), Madhab.Shafi, Rounding.None, HighLatitudeRule.MiddleOfTheNight, tz Africa/Algiers**, plus
the ministry's printed ihtiyat, which the fit measures rather than assumes: dhuhr +0, fajr +1,
sunrise +1, isha +1, **maghrib +4**.

| City | Cycle | Rows | Span | fajr | sunrise | dhuhr | asr | maghrib | isha |
| --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- |
| Alger | 1447 | 175 | 2025-06-27 .. 2026-06-15 | 165/175, w1 174 | 165/175, w1 173 | 172/175, w1 175 | 84/175, w1 172 | 162/175, w1 172 | 146/175, w1 169 |
| Adrar | 1447 | 189 | 2025-06-27 .. 2026-06-16 | 152/189, w1 170 | 172/189, w1 187 | 170/189, w1 188 | 100/189, w1 186 | 176/189, w1 187 | 173/189, w1 188 |
| Djelfa | 1447 | 205 | 2025-06-27 .. 2026-06-17 | 166/205, w1 182 | 174/205, w1 194 | 190/205, w1 199 | 93/205, w1 190 | 174/205, w1 198 | 174/205, w1 197 |
| Alger | 1448 | 163 | 2026-06-23 .. 2027-06-05 | 143/163, w1 154 | 145/163, w1 153 | 155/163, w1 161 | 63/163, w1 157 | 138/163, w1 149 | 131/163, w1 152 |

Exact and within-1 counts are against the printed value after the column's own measured offset.
Between-year stability: the two Alger cycles carry the same offsets to the minute (+1, +1, 0, +1,
+4, +1), so the recipe is frozen across the 1447/1448 boundary and not re-tuned.

Grades. Alger holds two distinct published cycles on one recipe, so **A** by the T-667 ruling.
Adrar and Djelfa hold one cycle each, **provisional**. Seasonal amplitude is the reason the asr
column looks soft: its exact rate is lowest (84/175 to 100/189) while its within-1 rate stays above
95 percent, which is a one-minute rounding edge in a column that moves fastest across the year.

The worst per-column residuals (60 to 120 minutes) are OCR cell errors, not clock disagreements: a
dropped leading digit turns `13:26` into `1:26` and lands 720 minutes out. They are named, not
smoothed.

## 5b. Perak 2027 — seven zones, one full year

Recipe: **adhan 4.4.6, CalculationMethod.Singapore (fajr 20, isha 18), Madhab.Shafi,
Rounding.None, HighLatitudeRule.MiddleOfTheNight, tz Asia/Kuala_Lumpur**, one recipe across all
seven zones, each zone with its own measured ihtiyat.

| Zone | Rows | subuh | matahari | zohor | asar | maghrib | isyak |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| 1 Tapah, Slim River, Tanjung Malim | 364 | +10, 246/364, w1 364 | -1, 188/364, w1 356 | +2, 295/364, w1 364 | +2, 262/364, w1 364 | +2, 264/364, w1 364 | +2, 274/364, w1 364 |
| 2 Ipoh, Batu Gajah, Kampar, Sg. Siput, Kuala Kangsar | 364 | +11, 257/364, w1 364 | -2, 193/364, w1 364 | +3, 200/364, w1 364 | +3, 192/364, w1 357 | +2, 194/364, w1 364 | +2, 198/364, w1 364 |
| 3 Pengkalan Hulu, Gerik, Lenggong | 364 | +11, 161/364, w1 364 | -1, 245/364, w1 364 | +2, 325/364, w1 364 | +2, 228/364, w1 363 | +2, 272/364, w1 364 | +2, 261/364, w1 364 |
| 4 Temengor, Belum | 364 | +10, 235/364, w1 361 | -2, 236/364, w1 364 | +2, 222/364, w1 364 | +2, 201/364, w1 361 | +2, 226/364, w1 364 | +2, 228/364, w1 364 |
| 5 Teluk Intan, Bagan Datuk, Kg Gajah, Seri Iskandar, Beruas, Parit, Lumut, Setiawan, Pangkor | 364 | +11, 226/364, w1 360 | -1, 250/364, w1 364 | +3, 361/364, w1 364 | +3, 263/364, w1 361 | +3, 281/364, w1 364 | +3, 281/364, w1 364 |
| 6 Selama, Taiping, Bagan Serai, Parit Buntar | 364 | +11, 238/364, w1 364 | -1, 220/364, w1 364 | +3, 192/364, w1 364 | +2, 175/364, w1 363 | +2, 213/364, w1 364 | +2, 210/364, w1 364 |
| 7 Bukit Larut | 364 | +9, 235/364, w1 364 | -5, 239/364, w1 364 | +1, 343/364, w1 364 | +1, 264/364, w1 364 | +6, 313/364, w1 364 | +1, 295/364, w1 364 |

Cells read "offset minutes, exact/n, within-1/n". Worst residual across all seven zones and all six
clocks is **2 minutes**.

Two printed conventions fall out of the table and are worth carrying forward:

- **Imsak is exactly subuh minus ten minutes**, on every one of the 2,548 rows: the gap reads
  10..10 minutes, no variance.
- **The fajr angle is not separable from a constant offset at this resolution.** Sweeping 16 to 20
  degrees on zone 2 moves the median offset from -6 to +11 minutes while within-1 stays at 364/364
  throughout. So the table is reproducible on this recipe family, and the angle plus its published
  ihtiyat is the honest statement; naming one angle as the truth would be a guess dressed as a
  measurement.

Grade: **A**. Seven distinct zones, one recipe, a full published year, zero weekday rejections.

Malaysian tables print the afternoon and evening clocks on a 12-hour dial (`1:22` for zohor, `4:44`
for asar, `7:22` for maghrib, `8:31` for isyak). That conversion is applied in the parser and is the
one convention a future wave must not lose.

## 6. Follow-up targets added mid-wave

### DUM RF monthly prints (16) — text present, rows still column-major

The sixteen prints carry OCR made by O1m-R8 at `captures/dumrf/ocr/`. My own pass produced zero
tokens for these files, because both the render path and the native path fail on the dot-matrix
face. The existing text is column-major and partly mangled: `2:33 2:32 2:31 2:30` is a clean fajr
column, and the day column beside it reads `BT BT 12 13 14`. A column-crop pass is the right next
step and was not reached inside this wave's time. No rows written.

### Ufa almanac sheets — 1445 partial, 1442/1443/1444 sampled

Sheets present: twelve for 1445 (`77_1` .. `77_12`), three for 1443 (`21222_1` .. `21222_3`), three
for 1442 (`2122_1` .. `2122_3`), one for 1444 (`212_1`). **No 1439 and no 1447 sheet exists in the
archive**, contrary to the follow-up note.

The 1445 sheets read well where they read at all: `77_4` gives rows of six ascending clocks with the
day and month marker, for example `6:06 7:46 13:30 16:21 18:19 19:49` then `16 OKT`. A delimiter
parse over all sheets yields **52 complete rows across 9 sheets**, worst sheet 13 rows, five sheets
zero. The blocker is the same in every failure: the six clocks and the date marker are split across
OCR lines irregularly, so the row delimiter is not stable. Daten-binding also needs the Hijri month
name from a header the OCR reads as `hHXÇPH 1445 29 KOH MHllallM 2023`, which loses the month word.
52 rows banked as `data/ufa-almanac-rows-raw.json`; no fit attempted, because a weekday check cannot
be run without the month.

### DUM RT 2017, the missing 21 settlements — checked, and the negative is firm

The archive holds exactly 46 dated 2017 sheets, 23 settlements under two URL families
(`wb_391_638_*`, `wb_482_640_*`) plus one `wb_Kazan` copy. The 21 absent settlements — Aleksey, Almet, Bavli, Bolgary, BolshAtna, BolshieKaybesy,
Cheremsan, Chistop, KamskoeUstye, Laish, Mamadis, Menzilinsk, Muslimov, Novosesminsk, Pestrezy,
RibnayaSlpboda, Sarmanovo2, StaroeChuprale, Tet2, VerhUslon, VicokayGora — appear in no 2017
capture under any name.

What does exist: `o1l-city/russia-boards/captures/dumrt/` holds a live 2026 CSV for **all 44**
settlements. So the 2017 hole is historical and the surface is complete today; the hole cannot be
filled from this archive.

## 7. Negatives and traps this wave found

1. **Thirty captures saved as `.pdf` are HTML or XML error pages.** `head -c 8` returns `<!DOCTYP`,
   `<html` or `<?xml`. They are `o1m-12-uk` Wrexham x12 and Dundee x2 and Cambridge-2026-01,
   `o1m-r5-watches` be-emb-2027, be-sanabel-2027, mawaqit-cal-gib-2027, no-mawaqeet-mysen-year,
   `o1m-18-africa2` Libreville x3, `o1l-city/O1l-33` probes x3, `o1l-city/o1l-22` es-ccim and
   pt-braga, `o1l-city/o1l-28` portsmouth-jami, `o1l-city/o1l-20r` cerfi-Kaolack, `o1m-2-capitals`
   sc/iso-jumada, `o1l-city/O1l-31` fi-jyvaskyla-April, `o1m-12-uk` amic-2025. Every "unfitted"
   verdict attached to one of these is a capture failure, not a data verdict.
2. **A `.txt` sibling can be worse than no text**, because it stops the next wave looking.
3. **The largest embedded image is not the page.** Any pipeline that assumes so loses on 614 of 809
   PDFs, and loses completely on the Malaysian posters.
4. **A rotated scan is not a rotated read.** Rotation bought Rangamati 8 characters.

## 8. Unreadable cells, named

- Rawalpindi perpetual chart: all 7 time columns, all 12 months.
- Faisalabad namaz chart: all 7 time columns, all 12 months.
- Rangamati permanent schedule: the whole sheet, at 0, 90 and 270 degrees.
- Perlis 1448: `LINTASAN MATAHARI` leading digits, all pages; `MILADIAH` day column, pages 1-2.
- Melaka 1448: the table body before the column-positional pass; headers and month spans read.
- Cambridge annual poster: row assembly within each of the twelve panels, not the cells.

## 9. NEXT

1. Run the column-strip pass over `melaka-takwim-2024-2025-1446H.pdf` to bind the 605 banked rows
   to dates; then the same pass on Melaka 1448, Perlis 1448 and Cambridge's twelve panels.
2. Fit the other full-year tables this pass surfaced and that nobody has fitted:
   `th-cicot-national10-bE2569.pdf` (607 rows, 13,379 cells, ten Thai provinces),
   `nagoya_daily_prayer_table.pdf` (377 rows), `WIA_2026_Prayer_Times.pdf` (365 rows, Canada),
   and the `no-mawaqeet-*-year.pdf` set (365 rows each, Norway).
3. Fetch the four absent Pakistan charts (Sialkot, Hyderabad PK, Gujranwala, Sargodha) from the
   archive.org perpetual-chart family, and search for a higher-resolution scan of Rawalpindi and
   Faisalabad before declaring them F for OCR.
4. Column-crop `captures/dumrf/ocr/` for the sixteen DUM RF prints and pull the day column out of
   the dot-matrix separately from the clocks.
5. Re-fetch the Karimia Nottingham poster as a rendered page.
6. Re-capture the thirty HTML-in-PDF names with a browser, since each is already a known URL.
7. Ufa: crop the date column and the Hijri month header as separate strips so the row delimiter and
   the month come from geometry rather than from OCR line order.
