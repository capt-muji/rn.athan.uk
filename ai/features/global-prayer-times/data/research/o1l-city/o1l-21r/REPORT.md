# O1l-21r — Peshawar and Quetta chart transcription and fit

Agent: O1l-21r (Pakistan chart transcription). Workspace: `$HOME/athan-gitree/census/o1l-city/o1l-21r/`.
Sources are the O1l-12 captures, copied read-only into `captures/`. Nothing in this workspace touches the repository.

## What the single-pass read had failed on

Both PDFs are photographs of printed Urdu wall charts. `pdftotext` returns garbage (the O1l-12 capture already
recorded this). Two things defeated the single-pass read:

1. **Peshawar** is a 19-column rolling layout: the day number sits mid-table, nine value columns to its right and
   nine to its left, with two blue "note" columns inside the value block. Reading it as a 6-column chart shifts
   every column by one or two, which is what the predecessor's "rolling Urdu layout" note describes.
2. **Quetta** is not the same chart at all: it is an 8-column table with the day number at the far right and no
   rolling element, plus two front-matter pages before the months.

Both were re-read here as raster pages rendered at 200 dpi for the first pass and 400 dpi for every cell the solar
gate flagged. 12 pages per city, every day of the year.

## Column conventions (the deliverable the brief asked for)

**Peshawar** (`ia-pk-peshawar-chart.pdf`, 12 pages = months 01-12, 31/29/31/30/31/30/31/31/30/31/30/31 rows),
numbered 1-19 right to left:

| # | Urdu header | meaning | used |
|---|---|---|---|
| 1 | ابتداء سحری | sehri begins (blue note column) | no |
| 2 | انتباہی تہجد نوافل | tahajjud warning, printed 5 min before fajr | no |
| 3 | صبح صادق / اذان فجر | fajr | **yes** |
| 4 | نماز فجر وقت ختم | fajr window closes, printed 5 min before sunrise | no |
| 5 | طلوع آفتاب | sunrise | **yes** |
| 6 | شروع وقت اشراق | ishraq begins, sunrise + 20 min | no |
| 7 | ختم وقت اشراق / ابتداء چاشت | ishraq ends, chasht begins | no |
| 8 | ابتداء منوع وقت زوال | forbidden time before noon | no |
| 9 | ختم منوع وقت / نماز ظہر | dhuhr | **yes** |
| 10 | month name + day number | | |
| 11 | مثل اول | Shafi asr | no |
| 12 | مثل ثانی / عصر حنفی | Hanafi asr | **yes** |
| 13 | نماز عصر وقت اختتام | asr window closes, sunset − 20 min | no |
| 14 | غروب آفتاب / افطار | sunset = maghrib | **yes** |
| 15 | اذان مغرب (blue) | maghrib adhan, printed white on blue, unreadable in the scan | no |
| 16 | ختم وقت مغرب | maghrib window length in H:MM (maghrib → isha), not a clock time | no |
| 17 | اذان عشاء | isha | **yes** |
| 18 | نصف شب | solar midnight | no |
| 19 | مقدار یوم | day length in H:MM | no |

Column 16 is the trap: it holds `1:25`/`1:30`, which reads like a clock time and is the length of the maghrib
window. Column 2 is the second trap: it is fajr minus five minutes, so a reader who takes it for fajr gets a
consistent −5 min bias.

**Quetta** (`ia-pk-quetta-chart.pdf`, 24 pages: 1 cover, 2 prayer-rule page, 3-14 = months 01-12; February has 28
rows, no 29th), 8 columns right to left: 1 فجر, 2 طلوع آفتاب, 3 زوال, 4 ظہر, 5 عصر (مثل اول), 6 عصر (مثل ثانی),
7 مغرب, 8 عشاء. Every column is used except the zawal and the Shafi asr.

Four printed anomalies were kept as printed and excluded from the scored totals: 04/23 sunrise `5:48` (sequence
runs 6:00, 5:59, [5:48], 5:57), 09/16 isha `7:00` (sequence 8:01, [7:00], 7:58), 09/25 isha `7:59` (sequence 7:50,
[7:59], 7:47), 07/31 Shafi asr `4:03` (run of 4:05).

## Peshawar fit

Engine: adhan 4.4.6, `Rounding.None`, TZ `Asia/Karachi`, dates built from the chart's own day numbers at
34.0151 N 71.5249 E, compared at second resolution then rounded to the printed minute.

**Recipe: 18.0 / 18.0, Hanafi asr, maghrib = sunset, dhuhr = solar transit, margins 0/0/0/0/+1/+1.**
365 dated rows (2026). 366 chart rows scored; the chart's 29 February row is kept in the transcription and dropped
from the dated output because 2026 is not a leap year.

| column | exact | within 1 | worst |
|---|---|---|---|
| fajr | 218 (59.6%) | 366 (100.0%) | −1 |
| sunrise | 236 (64.5%) | 362 (98.9%) | −2 |
| dhuhr | 308 (84.2%) | 366 (100.0%) | +1 |
| asr (Hanafi) | 281 (76.8%) | 358 (97.8%) | +3 |
| maghrib | 206 (56.3%) | 359 (98.1%) | +3 |
| isha | 258 (70.5%) | 361 (98.6%) | +2 |

All six columns within 1 on 348/366 rows (95.1%). Mean signed residual: fajr −0.4, sunrise −0.4, dhuhr 0.0,
asr 0.0, maghrib +1.4, isha +1.0.

- **18/18 confirmed, 18.5 excluded.** 18.5/18.5 needs a +2 margin on fajr and a −2 margin on isha to fit; 18/18
  fits at zero with sub-minute means. At the chart's one-minute print precision the two are separable and 18/18
  wins.
- **Margins are real but small**: maghrib is +1 min and isha +1 min on the printed recipe; fajr, sunrise, dhuhr
  and asr carry none.
- **Span ceiling**: the chart carries no year and no Hijri date. Scored against every year 2018-2032 it fits
  equally (mean |r| 0.32-0.57 min; the four leap years score 0.54-0.57 because the 29 February row shifts the
  March-December rows by one day in a non-leap reconstruction). It is a **perpetual chart, one published cycle**:
  grade **provisional** under FIT-RULES, with the recipe independently reproduced on 12 monthly tables.
- **Seasonal amplitude**: fajr 05:49 (1 Jan) to 03:21 (Jun-Jul) = 148 min; isha 18:46 to 21:14 = 148 min; day
  length 9:56 to 14:26.
- **Between-year stability**: not applicable in the usual sense, the same table is served for every year; the
  stability that matters is the monthly one, and the recipe is frozen across all 12 pages (no month carries a
  different angle).

## Quetta fit

Same engine and timezone, 30.1841 N 66.9966 E. 365 dated rows.

**Recipe: 18.2 / 18.0, Hanafi asr, margins fajr 0 / sunrise 0 / dhuhr +1 / asr 0 / maghrib +2 / isha +2.**
(18.0 with a −1 fajr margin scores 246/365 against 250/365 at 18.2; the two are not separable at this precision.)

| column | exact | within 1 | worst |
|---|---|---|---|
| fajr | 115 (31.5%) | 250 (68.5%) | +4 |
| sunrise | 164 (45.1%) | 325 (89.3%) | −2 |
| dhuhr | 220 (60.3%) | 364 (99.7%) | −2 |
| asr (Hanafi) | 55 (15.1%) | 176 (48.2%) | +7 |
| maghrib | 145 (39.7%) | 311 (85.2%) | +3 |
| isha | 108 (29.8%) | 255 (70.2%) | −4 |

- **Same family, coarser table.** Fajr sits at 18.0-18.2 with a ±2 min monthly wobble (Aug −3.1 mean, Mar +1.3),
  isha at 18 with a +2 margin, maghrib at sunset +2, dhuhr at transit +1. None of it is a different method; it is
  a hand-computed table printed to the minute.
- **The asr column does not reproduce and is the finding.** Monthly mean residuals run −3.9 (Jan), −2.7 (Feb),
  −1.0 (Mar), +1.6 (Apr), **+5.5 (May)**, +3.3 (Jun), +1.2 (Jul), +0.3 (Aug), +1.0 (Sep), +0.9 (Oct), −0.6 (Nov),
  −2.9 (Dec) against adhan's Hanafi asr. A smooth annual swing of about ±5 min, trough in January, peak in May,
  crossing zero in March and September. No margin fixes it; the publisher's asr table is its own computation.
  Flagged for the owner, not adjudicated.
- **Seasonal amplitude**: fajr 06:02 to 03:52 = 130 min; isha 19:10 to 21:16 = 126 min.
- **Span ceiling**: same perpetual single-cycle chart, grade **provisional**.

## Provincial-family verdict, extended

The O1l-12 verdict stands and now has two more cities behind it: the federal clock conventions (dhuhr 13:00 /
13:15) do not describe the provincial layer; the cities run the Karachi-method family with their own margins.

| city | fajr | isha | asr | maghrib | margins |
|---|---|---|---|---|---|
| Karachi | 18.4 | 18.0 | Hanafi +3.5 | sunset | asr +3.5 |
| Multan | 18.0 | 18.0 | Hanafi +2 | sunset +1.6 | fajr −0.5, sunrise −1.5, dhuhr +0.5, isha +0.6 |
| **Peshawar** | **18.0** | **18.0** | **Hanafi, 0** | **sunset +1** | fajr 0, sunrise 0, dhuhr 0, isha +1 |
| **Quetta** | **18.2** | **18.0** | **Hanafi, table drift ±5** | **sunset +2** | dhuhr +1, isha +2 |

What is new: the margins are not a provincial constant either. Four cities, four different margin sets, one angle
pair (18-18.5 fajr, 18 isha) and one madhab. Peshawar is the bare recipe with only the +1 maghrib/isha ihtiyat;
Quetta carries the largest pads (dhuhr +1, maghrib +2, isha +2) and the only asr table that leaves the engine.

## Honest negatives

- Peshawar column 15 (maghrib adhan) is printed white on a blue field and is unreadable in the scan at any
  resolution tried (200 and 400 dpi). It is not needed: column 14 is sunset and the fit puts maghrib on sunset
  +1 min.
- No Hijri dates, no year, no publisher imprint beyond the chart header; neither chart can be dated, so neither
  yields a multi-year test. Both are graded provisional on one published cycle.
- No second surface for either city was opened in this pass (no web was used, per the brief). The O1l-12 captures
  hold no Peshawar or Quetta rival table.
- Quetta's asr column is not explained. The two candidate stories (a different shadow convention, a coarse
  declination table) are both consistent with the residuals and neither is proven.

## Files

- `data/peshawar-transcribed.js` — raw transcription, 6 of 19 columns, 366 chart rows.
- `data/quetta-transcribed.js` — raw transcription, 8 columns, 365 chart rows.
- `data/pk-peshawar-chart-2026.json` — 365 dated rows, `{fajr, sunrise, dhuhr, asr, maghrib, isha}`.
- `data/pk-quetta-chart-2026.json` — 365 dated rows, same shape.
- `work/` — raster renderer (`render.swift`), solar gate, margin scan, epoch test, Finland scoring.
