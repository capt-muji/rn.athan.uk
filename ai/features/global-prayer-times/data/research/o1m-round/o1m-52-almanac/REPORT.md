# o1m-52 The almanac family: Saudi's print almanac reproduces the pivot recipe

Wave o1m-52, round o1m. Workspace `$HOME/athan-gitree/census/o1m/o1m-52-almanac/`.
Engine adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`,
`CalculationParameters('Other', fajr, isha)`, `Madhab.Shafi`, `HighLatitudeRule.MiddleOfTheNight`,
`Rounding.None`, zone `Asia/Riyadh` for the one fit, every date taken from a literal string in the
captured document. No subagent spawned. The repository was not touched. No clock read into data.

**Stopped by owner order mid-pass.** What follows is what is banked on disk, stated as such. The
Gulf and Maghreb sweep this wave was chartered for is incomplete and says so below.

## Assumptions

- The `qm.edu.sa` 1448 calendar is read as a print almanac of the Umm al-Qura timing rather than as
  a third-party publication, because its own page carries it beside the association's academic
  calendar and its times land on Madinah's meridian to the minute across 354 days.
- A printed 12-hour cell with no suffix is read as fajr, sunrise and dhuhr in the morning and asr,
  maghrib and isha in the afternoon. No captured row makes that reading ambiguous.
- The one row whose isha cell was overwritten by a page footer is kept with isha withheld and every
  other column scored; it is not repaired and not interpolated.
- "Almanac" means a dated annual publication that prints prayer times. A calendar that prints
  dates only is classified as a civil calendar, not as an almanac of times.

## 1. Saudi Arabia: the print almanac and the pivot service are one object

**The document.** `https://qm.edu.sa/files/PrayerTimes1448AH.pdf` (4,628,902 bytes, 13 pages, text
layer, no OCR needed), captured as `captures/sa-qm-prayertimes-1448.pdf`. Twelve month pages plus a
cover; 355 dated rows from **1 Muharram 1448 = 2026-06-16 to 2027-06-05**, six columns
(الفجر، الشروق، الظهر، العصر، المغرب، العشاء) plus weekday, Hijri day and Gregorian day.

**The extraction.** `scripts/pdftext.swift` (PDFKit) produces `captures/sa-qm-prayertimes-1448.txt`;
`scripts/build-sa-qm.py` assembles `data/sa-qm-1448-rows.json` (355 rows, one inserted placeholder at
2026-08-13 where a footer overlapped the isha cell, so that row's isha is null and 354 isha cells
score).

**The recipe, recovered at Madinah (24.4672 N, 39.6111 E):**

| ingredient | value |
|---|---|
| fajr angle | 18.5 degrees |
| isha | maghrib + 90 minutes, **+120 on the 29 Ramadan days** |
| asr | Shafi |
| high latitude | MiddleOfTheNight |
| per-column pad | +1 on fajr, dhuhr, asr, maghrib, isha; 0 on sunrise; floor |

| column | exact | within 1 | MAE (min) | worst |
|---|---|---|---|---|
| fajr | 57.3 pc | 100.0 | 0.121 | 1 |
| sunrise | 88.7 pc | 100.0 | 0.045 | 1 |
| dhuhr | 93.2 pc | 100.0 | 0.056 | 1 |
| asr | 66.4 pc | 100.0 | 0.014 | 1 |
| maghrib | 92.4 pc | 100.0 | 0.042 | 1 |
| isha | 92.4 pc | 100.0 | 0.042 | 1 |
| **2,124 cells** | **81.7 pc** | **100.0** | **0.054** | **1** |

`fit/sa-qm-1448-fit.json`. The same recipe at Makkah (21.4225, 39.8262) collapses to 30.6 pc within 1,
so the print is Madinah's, and the anchor is recoverable from the table alone.

**The finding that matters for the almanac question.** The printed isha is maghrib + 90 minutes on
**325 days and maghrib + 120 on exactly the 29 Ramadan days, zero other values**. The held Saudi
service carries the identical two-value rule (90 on 651 days, 120 on 58 across 1448 and 1449, zero
violations, O1l-40). The print therefore reproduces the pivot computation, not a parallel one:
**SAUDI = ALMANAC-IS-TABLE**, with the caveat that the fit is one Hijri year (provisional by the
round's grading) and the print's own margins equal the API's margins column for column.

**The civil calendar is a separate object on the same host.** `www.ummulqura.org.sa` publishes
`/ar/calendar` (Hijri dates, month grids, 1448, city Makkah) and `/ar/prayer-times` (a city/day
service) as two products of one body. The prayer page printed for 2026-11-11 at Makkah: fajr 05:11,
sunrise 06:29, dhuhr 12:05, asr 03:17, maghrib 05:41, isha 07:11, and isha is maghrib + 90 exactly.
That is a single-day gate, not a fit; the page was mid-navigation (year view) when the stop order
arrived and its year table is **not banked**.

## 2. What the other countries carry, and what is only a lead

This section is leads and held facts, not measurements made this wave. It is written so the next
pass does not re-walk it.

| country | object in hand or on the board | this wave |
|---|---|---|
| SAUDI | print almanac 1448 (banked, fitted) + Umm al-Qura calendar and prayer service | **ALMANAC-IS-TABLE**, evidenced |
| KUWAIT | Al-Ojeiri almanac; the ministry adopts it (O1m-27); seven almanac books listed, two banked: `captures/kw-alm-timings-qibla.pdf` (المواقيت والقبلة, 280 pages) and `captures/kw-alm-hijri-calendar.pdf` | rule **UNKNOWN** pending a read of the method book; no times transcribed |
| QATAR | ministry gateway with dated rows (O1m-27); the Qatari calendar is a desk publication requested through Hukoomi | rule **UNKNOWN**; desk calendar not captured |
| UAE | 60-area federal API fully held (O1l-41); new site `/prayer-times` serves the same table for today (2026-11-11, default area: fajr 05:16, sunrise 06:32, dhuhr 12:09, asr 15:15, maghrib 17:40, isha 18:56) | `/en/prayer-times` is a 404 under the rebuilt site; `mobileappapi.awqaf.gov.ae/APIS/v3/prayer-time/emirates-and-cities` answers 401 without the app key, so the gateway is alive. No annual print found. Rule **UNKNOWN** |
| OMAN | MARA `calendar_page2.asp` / `calendar_page4.asp`, 86 named areas, 2021-2031 (O1m-27, O1m-40) | not re-probed this wave |
| BAHRAIN | council daily calendar 1448, desk calendar 1442, five imsakiyya (O1m-41); the tawkit `awqaf` tenant reproduces the almanac row for row | **ALMANAC-IS-TABLE**, held evidence cited, nothing new needed |
| MOROCCO | Habous portal month files (current + previous month), no printed almanac year found (O1m-30) | untouched this wave |
| ALGERIA | 1447 and 1448 ministry books, 219 verified days, one recipe (O1m-30) | **ALMANAC-IS-TABLE**: the annual book IS the object. Held evidence |
| TUNISIA | INM dated API, 2027 closed (O1m-30) | untouched |
| LIBYA | single-cycle widget only; no authority table (O1m-30) | untouched |
| EGYPT | ESA city tables 82/78 at 100 pc; ESA imsakiyya | NRIAG's annual astronomical guide is a lead only, not captured |
| JORDAN | `awqaf.gov.jo/ar/Pages/PrayerTime` renders a dated table (2026-11-11 Amman: fajr 05:37, sunrise 06:55, dhuhr 12:21, asr 03:18) | page located, **not captured, not fitted** this wave |
| IRAN | Geophysics Institute almanac named in pishkhanak's method statement | host returns a Cloudflare challenge page to curl; no capture |
| PALESTINE | Awqaf 2012 print + 78 live days (O1l-46) | held, nothing new |

## 3. Defects and negatives

| item | verdict | evidence |
|---|---|---|
| `qm.edu.sa` PDF | one row's isha cell overwritten by a running footer in the text layer (2026-08-13); every other cell clean | `data/sa-qm-1448-rows.json`, isha null on that date |
| `qm.edu.sa` cover | image-only, no text layer, OCR returns fragments | `pages/sa-qm-p1.png` |
| `awqaf.gov.ae/en/prayer-times` | 404 under the rebuilt site while `/prayer-times` works | two captures of the same shell |
| `awqaf.gov.ae` appsettings probes | `appsettings.json`, `config.json` all return the SPA shell, not JSON | captures `ae-probe-*` |
| `geophysics.ut.ac.ir` | challenge page to curl, 6 KB, no content | `captures/probe-geophysics.ut.ac.ir_.html` |
| Kuwait almanac books | two of seven banked; the method statement inside them not yet read | `captures/kw-alm-*.pdf` |
| Umm al-Qura year view | not banked; the page was mid-navigation at the stop order | this report, §1 |

Languages searched this pass: Arabic and English. No forum, no social surface, no login, no form.

## 4. Counted state

| object | surface | rows | span | fit |
|---|---|---|---|---|
| Saudi print almanac 1448 | 1 PDF, 13 pages | 355 | 2026-06-16 … 2027-06-05 | 18.5 / maghrib+90(+120 Ramadan), 2,124 cells, 100 pc within 1, 81.7 pc exact, worst 1 |
| Umm al-Qura date calendar | 1 page | month grid | 1448 | none (dates only) |
| Umm al-Qura prayer service | 1 page | 1 gated day | 2026-11-11 | gate only |
| UAE federal service | 1 page | 1 gated day | 2026-11-11 | gate only |
| Jordan Awqaf | 1 page located | 0 | — | none |

Archive: 23 capture files + 10 chunk files, 22 MB; 15 MB of page renders; three data files; one fit.

## 5. NEXT

1. **Saudi second year.** `qm.edu.sa` likely serves `PrayerTimes1447AH.pdf` and a 1449 file; one
   request each decides whether the print is an annual series. A second year lifts the print from
   provisional and turns ALMANAC-IS-TABLE into a two-year proof.
2. **Umm al-Qura year view.** The prayer page's content switcher (يوم/أسبوع/شهر/سنة) renders a full
   Hijri year for any city; that is the authority's own year table for 1448 and, by probe, 1449.
   Capture it with a real browser and a settled settings drawer.
3. **Kuwait method book.** Read `kw-alm-timings-qibla.pdf` (280 pages) for the almanac's stated
   angles; it is the only route to the Kuwaiti rule now that the ministry publishes no page.
4. **Jordan.** Capture `awqaf.gov.jo/ar/Pages/PrayerTime` across a full year and fit; the page
   prints dated rows, so it is a table, and O1l-8's regional-margin finding can be restated on it.
5. **Qatar desk calendar.** Hukoomi documents it as a distribution request; the civil question is
   whether its print carries the gateway's times. No public PDF was found.
6. **Morocco and Libya almanac years.** Neither has a printed year found; search the Habous
   publications tree and the Libyan centre's site in Arabic and French.
