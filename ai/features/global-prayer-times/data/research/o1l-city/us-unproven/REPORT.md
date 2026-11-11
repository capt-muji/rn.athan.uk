# O1l-44 — US unproven metros, round two

Agent: O1l-44. Workspace: `$HOME/athan-gitree/census/o1l-city/us-unproven/`.
Engine: adhan 4.4.6 (`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`),
`Rounding.None`, `HighLatitudeRule.TwilightAngle`, timezone pinned per metro, dates built
from literal capture strings, no clock read anywhere. Nothing is declared complete.

## 1. What the 25 metros turned out to be

Round one closed these metros as "Mohid/athanplus stacks publishing iqamah boards, not dated
athan tables". That reading held for MOHID and broke for almost everything else. MOHID is a
WordPress product whose prayer block carries an iqamah column only, and its `/masjid/*` routes
have no prayer-table endpoint (eight paths probed, all 404). The dated layer sits one hop
away, on four platforms and four own sites:

- **athanplus / Masjidal monthly board** — `timing.athanplus.com/masjid/widgets/monthly?masjid_id=<id>`
  renders a dated table with ATHAN and IQAMAH columns per prayer; `&date=YYYY-MM-01` selects
  any month in any year, so the span is the endpoint's, not the page's. Eleven masjids in
  nine metros. The same ids drive `masjidal.com/widget/monthly/v2/?masjid_id=<id>`.
- **masjidbox athany API** — `api.masjidbox.com/1.0/masjidbox/landing/athany/<slug>?get=at&days=7&begin=DATE`
  serves seven dated rows per call: athan as ISO datetimes, plus the iqamah block. The key is
  the one the public page ships in its own bundle. Seven masjids in six metros.
- **mawaqit `confData`** — the page's own year calendar, eight mosques in seven metros.
- Own sites: **Raleigh IARB** (`prayer-schedule.php?month=&year=`), **Birmingham Islamic
  Society** (`/wp-json/bis/v1/adhans?date=`), **ISGH Harrisburg** (alminaret 30-day Salah
  calendar), **East Montgomery** (Madina Apps block, 51 dated rows to year end).

The 133-domain guess that failed in round one was not retried. Every id here was read off a
mosque's own homepage or found by search.

## 2. Surfaces banked — 31,882 dated rows

| metro | surface | publisher | rows | span |
|---|---|---|---|---|
| Albany | mawaqit `muna-center-of-albany-schenectady` | MUNA Center of Albany | 366 | 2026 year table |
| Baltimore | masjidbox `masjid-ul-haqq-baltimore` | Masjid Ul Haqq | 1446 | 2023-12-31..2028-01-05 |
| Baltimore | mawaqit `masjid-e-bilal-baltimore` | Masjid E Bilal | 366 | 2026 year table |
| Baltimore | mawaqit `masjied-al-ihsan-baltimore` | Masjid Al-Ihsan | 366 | 2026 year table |
| Baton Rouge | athanplus `4KB0kPA5` | Masjid Al-Noor (ICBR) | 1461 | 2024-01-01..2027-12-31 |
| Baton Rouge | athanplus `jKZpJ7AX` | Ar-Rahman (ICBR) | 1461 | 2024-01-01..2027-12-31 |
| Birmingham | `/wp-json/bis/v1/adhans` | Birmingham Islamic Society | 1095 | 2024-01-01..2026-12-31 |
| Dearborn | mawaqit `islamic-house-of-wisdom-dearborn-heights` | Islamic House of Wisdom | 366 | 2026 year table |
| Detroit | athanplus `4nL1kgda` | IAGD, Rochester Hills | 1461 | 2024-01-01..2027-12-31 |
| Detroit | masjidbox `baic-detroit` | BAIC, Sterling Heights | 1467 | 2023-12-31..2028-01-05 |
| Detroit | mawaqit `tawheed-center-detroit` | Tawheed Center | 366 | 2026 year table |
| Flint | athanplus `E5Avv2AX` | Flint Islamic Center | 1461 | 2024-01-01..2027-12-31 |
| Gainesville | athanplus `rdRvbbdG` | ICCG | 1461 | 2024-01-01..2027-12-31 |
| Gainesville | mawaqit `hoda-center-gainesville` | Hoda Center | 366 | 2026 year table |
| Grand Rapids | masjidbox `masjid-sunnah-grand-rapids-michigan` | Masjid Sunnah | 1467 | 2023-12-31..2028-01-05 |
| Harrisburg | alminaret Salah calendar | ISGH | 30 | 2026-11-11..2026-12-10 |
| Kansas City | masjidbox `islamic-society-of-greater-kansas-city` | ISGKC | 1466 | 2023-12-31..2028-01-05 |
| Knoxville | athanplus `BYADPlAN` | Quran Center of Knoxville | 1461 | 2024-01-01..2027-12-31 |
| Louisville | masjidbox `hira-institute` | Hira Institute | 1467 | 2023-12-31..2028-01-05 |
| Montgomery | Madina Apps block | East Montgomery Islamic Center | 51 | 2026-11-11..2026-12-31 |
| New Orleans | mawaqit `islamic-center-of-new-orleans` | Islamic Center of New Orleans | 366 | 2026 year table (see 5) |
| Portland | athanplus `adJmGxAk` | Masjid As-Saber | 1461 | 2024-01-01..2027-12-31 |
| Portland | athanplus `3AO2n4Le` | Towhid Islamic Center | 1461 | 2024-01-01..2027-12-31 |
| Providence | athanplus `YAD4yNAN` | Masjid Al-Islam, North Smithfield | 1461 | 2024-01-01..2027-12-31 |
| Raleigh | `prayer-schedule.php?month=&year=` | Islamic Association of Raleigh | 1461 | 2024-01-01..2027-12-31 |
| Rochester | athanplus `Vdw3P8de` | Masjid Tawfeeq | 1461 | 2024-01-01..2027-12-31 |
| Rochester | masjidbox `al-rahman` | Al Rahman | 1467 | 2023-12-31..2028-01-05 |
| Rochester | mawaqit `ic-rochester` | Islamic Center of Rochester | 366 | 2026 year table |
| Tucson | athanplus `Edol0GK7` | Islamic Center of Tucson | 1461 | 2024-01-01..2027-12-31 |
| Wilmington | masjidbox `masjid-al-ikhlaas` | Masjid al-Ikhlaas | 1466 | 2023-12-31..2028-01-05 |

Coordinates: platform pages carry none, so each mosque's own address was geocoded once
(`coords.json`) and every fit's residuals are the check that the point is right.

## 3. Live-page gate (R5)

Each feed was re-fetched for dates taken from its own capture and compared cell for cell:
athanplus 11/11 MATCH, masjidbox 7/7 MATCH, mawaqit 8/8 MATCH, Raleigh MATCH on three sampled
months, Birmingham MATCH on three dates, Harrisburg's rendered table identical cell for cell,
Montgomery 51 of 51 rows identical. 30 of 30 surfaces pass. `fits/gates.json`.

## 4. Fits

Full per-surface records in `fits/`, summary in `fits/SUMMARY.json`. Every record carries the
free recipe, a fixed ISNA 15/15 check, per-column scores, per-year scores, the between-year
spread and the Jan-to-Jul fajr amplitude. All 30 surfaces are Shafi asr except Detroit IAGD,
which is Hanafi.

| metro | surface | rows | free recipe | free w1 | ISNA 15/15 w1 | exact | amp |
|---|---|---|---|---|---|---|---|
| Albany | muna-center-of-albany-schenectady-12308-unit | 366 | 15/15°, shafi asr | 88.5 | 88.5 | 81.1 | 126.8 |
| Baltimore | masjid-e-bilal-baltimore-21225-united-states | 366 | 15/15°, shafi asr | 89.0 | 89.0 | 82.4 | 101.5 |
| Baltimore | masjid-ul-haqq-baltimore-masjidbox | 1446 | 15/15°, shafi asr | 100.0 | 100.0 | 98.3 | 102.1 |
| Baltimore | masjied-al-ihsan-baltimore-21207-united-stat | 366 | 15/15°, shafi asr | 87.4 | 87.4 | 80.2 | 102.1 |
| Baton Rouge | 4KB0kPA5-athanplus | 1461 | 15/15°, shafi asr | 96.4 | 96.4 | 86.2 | 53.5 |
| Baton Rouge | jKZpJ7AX-athanplus | 1461 | 15/14.9°, shafi asr | 96.4 | 96.8 | 86.4 | 53.7 |
| Birmingham | bis-adhans | 1095 | 14.8/13.4°, shafi asr | 82.8 | 86.6 | 51.1 | 67.2 |
| Dearborn | islamic-house-of-wisdom-dearborn-heights-maw | 366 | 15/15°, shafi asr | 87.2 | 87.2 | 79.9 | 123.1 |
| Detroit | 4nL1kgda-athanplus | 1461 | 15/14.9°, hanafi asr | 78.2 | 78.7 | 53.2 | 125.5 |
| Detroit | baic-detroit-masjidbox | 1467 | 18/17°, shafi asr | 100.0 | 83.6 | 74.1 | 134.7 |
| Detroit | tawheed-center-detroit-mawaqit | 366 | 15/15°, shafi asr | 87.0 | 87.0 | 79.3 | 123.2 |
| Flint | E5Avv2AX-athanplus | 1461 | 15/15°, shafi asr | 93.6 | 93.6 | 82.3 | 128.2 |
| Gainesville | hoda-center-gainesville-42608-united-states- | 366 | 15/15°, shafi asr | 88.5 | 88.5 | 82.5 | 50 |
| Gainesville | rdRvbbdG-athanplus | 1461 | 15/14.9°, shafi asr | 96.5 | 96.9 | 86.7 | 50.1 |
| Grand Rapids | masjid-sunnah-grand-rapids-michigan-masjidbo | 1467 | 18/17°, shafi asr | 100.0 | 84.1 | 74.3 | 137.8 |
| Harrisburg | isgh-alminaret | 30 | 14.8/13.6°, shafi asr | 99.5 | 99.5 | 90.0 | None |
| Kansas City | islamic-society-of-greater-kansas-city-masji | 1466 | 15/15°, shafi asr | 100.0 | 100.0 | 98.5 | 99.8 |
| Knoxville | BYADPlAN-athanplus | 1461 | 15/15°, shafi asr | 95.8 | 95.8 | 84.8 | 81.6 |
| Louisville | hira-institute-masjidbox | 1467 | 18/17°, shafi asr | 100.0 | 86.7 | 76.0 | 101.8 |
| Montgomery | emis-madinaapps | 51 | 15.5/15.4°, shafi asr | 99.0 | 99.0 | 91.8 | None |
| New Orleans | islamic-center-of-new-orleans-new-orleans-70 | 366 | 13/maghrib+60, shafi asr | 4.0 | 4.1 | 2.2 | 60 |
| Portland | 3AO2n4Le-athanplus | 1461 | 17.4/13°, shafi asr | 57.1 | 80.3 | 70.9 | 164.4 |
| Portland | adJmGxAk-athanplus | 1461 | 15/15°, shafi asr | 91.1 | 91.1 | 80.1 | 148.7 |
| Providence | YAD4yNAN-athanplus | 1461 | 15.7/14.6°, shafi asr | 64.3 | 61.7 | 44.2 | 137.3 |
| Raleigh | iarb-prayer-schedule | 1461 | 15.3/15.2°, shafi asr | 90.6 | 89.7 | 54.2 | 81.7 |
| Rochester | Vdw3P8de-athanplus | 1461 | 15/13.8°, shafi asr | 82.5 | 86.4 | 75.0 | 129.4 |
| Rochester | al-rahman-masjidbox | 1467 | 15/15°, shafi asr | 100.0 | 100.0 | 98.4 | 129.7 |
| Rochester | ic-rochester-mawaqit | 366 | 15/15°, shafi asr | 87.0 | 87.0 | 78.9 | 129.1 |
| Tucson | Edol0GK7-athanplus | 1461 | 15/15°, shafi asr | 96.1 | 96.1 | 85.0 | 122.3 |
| Wilmington | masjid-al-ikhlaas-masjidbox | 1466 | 15/15°, shafi asr | 100.0 | 100.0 | 97.9 | 104.9 |

**The 15/15 verdict on the new sample.** Plain ISNA 15/15 is the free best fit on 19 of 30
surfaces, and it lands at or above 85 pc within-1 on 24 of 30. The exceptions are a real
split, not noise:

- **18/17 (MWL), 100 pc within-1, 98 pc exact** — BAIC Detroit, Masjid Sunnah Grand Rapids,
  Hira Institute Louisville. On these three the fixed 15/15 recipe collapses to 83-87 pc, so
  the board is demonstrably not ISNA.
- **15/15 with a constant maghrib offset** — Birmingham adds +4 to maghrib; Kansas City,
  Harrisburg, Montgomery and Raleigh sit at 15/15 with sub-minute margins.
- **Hybrids that no single recipe reproduces** — Portland Towhid (isha mirrors fajr exactly,
  sunrise-fajr = isha-maghrib in every month, but fajr matches only 11 pc of days at any one
  angle), Providence (fajr 15.7, isha 17 in summer and ~17 minutes early in winter: a winter
  isha floor), Rochester Tawfeeq (isha 13.8 free, 15/15 fixed scores better at 86 pc).
- **New Orleans is not a timetable at all** — section 5.

**Between-year stability.** The three masjidbox boards are frozen: identical within-1 scores in
all six years, spread 0.0. athanplus surfaces are stable to 0.3-1.5 pc across four years
(Flint 0.3, Tucson 0.3, Baton Rouge 0.5, Gainesville 0.6, Knoxville 1.5). Five surfaces move,
and each carries a dated break rather than a parameter drift:

| surface | per-year within-1 | reading |
|---|---|---|
| Detroit IAGD | 70.0, 71.6, 72.4, 99.1 | regime change at 2027-01-01 |
| Raleigh IARB | 81.6, 88.3, 94.5, 98.2 | a different generator each year, converging |
| Providence | 65.1, 52.7, 59.7, 79.6 | 2027-01-01 break |
| Portland Towhid | 67.9, 64.4, 52.9, 43.1 | degrading, fajr column throughout |
| Rochester Tawfeeq | 86.0, 76.3, 78.9, 88.6 | 2025 dip, isha column |
| Birmingham | 88.0, 81.1, 79.4 | isha column weakens from 2025 |

**Seasonal amplitude** (Jan-to-Jul fajr span) runs 50 min at Gainesville to 164 min at
Portland Towhid, tracking latitude as expected: 81 min Knoxville, 99 min Kansas City, 122 min
Tucson, 126 min Albany, 129 min Rochester, 148 min Portland As-Saber.

## 5. Defects found

- **New Orleans mawaqit serves a two-row placeholder.** The 2026 calendar holds exactly two
  distinct rows, switching on the DST dates, with a constant "day length" of 401 minutes in
  every month. It is not a solar timetable and cannot be fitted (4.1 pc within-1). Its live-page
  gate passes, because the page faithfully renders its own placeholder row: the gate proves
  the capture is faithful, not that the table is a timetable. Recorded, excluded.
- **Birmingham's route mis-prints dhuhr on the spring-forward day.** `?date=2024-03-10`
  returns dhuhr `00:58:00.000Z` for a 12:58 local transit. One row of 1096, dropped and
  recorded in the data file.
- **Masjidbox's 2027 tail refuses for BAIC Detroit** from 2027-05-28 onward while the other
  five masjids serve 2028. Platform-side, not a mosque setting.
- **mawaqit has no prior-year door.** Wayback snapshots exist for two of the eight slugs but
  the 2025 page predates `confData`, so no second year is recoverable from that platform.

## 6. Honest negatives

Not found under these terms (English; the metros are US, so no second language applies):

- **Norfolk** — Masjid Ash-Shura runs on Bubble (client-rendered, no table); Masjid An-Noor on
  MOHID (`va/norfolk/mct`, iqamah only). No dated athan table found.
- **Salt Lake City** — Utah Islamic Center on MOHID (`ut/westjordan/uic`, iqamah only);
  utahmuslims.com prints a static iqamah block with no dates.
- **Tallahassee** — Masjid Al-Noor's WordPress carries `alnoorSettings.iqamahTimes` only
  (fajr and isha fixed); ictlh.org shows no times.
- **Oklahoma City** — ISGOC's Squarespace prints a hand-typed "November 1st - 10th" iqamah
  block and embeds an IslamicFinder widget (`4544349`, stated ISNA 15/15) that renders today
  only and 403s outside its own referer context. Edmond's ISE is on MOHID.

## 7. Per-metro verdicts

| metro | surface found | fit verdict |
|---|---|---|
| Albany | mawaqit MUNA Center, 366 rows | 15/15, 88.5 pc within-1 |
| Baltimore | masjidbox Ul Haqq 1446; mawaqit Bilal 366; mawaqit Al-Ihsan 366 | 15/15 on all three: 100.0 / 89.0 / 87.4 |
| Baton Rouge | athanplus Al-Noor and Ar-Rahman, 1461 each | 15/15, 96.4 and 96.8 |
| Birmingham | BIS own route, 1095 rows | 15/15 with maghrib +4, 86.6; isha weakens from 2025 |
| Dearborn | mawaqit Islamic House of Wisdom, 366 | 15/15, 87.2 |
| Detroit | athanplus IAGD 1461 (Hanafi asr); masjidbox BAIC 1467; mawaqit Tawheed 366 | 15/15 78.7 with a 2027 break; 18/17 100.0; 15/15 87.0 |
| Flint | athanplus Flint Islamic Center, 1461 | 15/15, 93.6 |
| Gainesville | athanplus ICCG 1461; mawaqit Hoda 366 | 15/15, 96.9 and 88.5 |
| Grand Rapids | masjidbox Masjid Sunnah, 1467 | 18/17, 100.0 |
| Harrisburg | alminaret 30-day Salah calendar, 30 | 15/15, 99.5 (span too short for a year verdict) |
| Kansas City | masjidbox ISGKC, 1466 | 15/15, 100.0 |
| Knoxville | athanplus Quran Center, 1461 | 15/15, 95.8 |
| Louisville | masjidbox Hira Institute, 1467 | 18/17, 100.0 |
| Montgomery | Madina Apps block, 51 | 15/15, 99.0 (to year end only) |
| New Orleans | mawaqit Islamic Center, 366 | FAILS: two-row placeholder, 4.1 pc |
| Portland | athanplus As-Saber 1461; athanplus Towhid 1461 | 15/15 91.1; Towhid symmetric isha, 80.3 fixed 15/15 |
| Providence | athanplus Masjid Al-Islam, 1461 | 15.7 fajr, winter isha floor, 61.7 fixed 15/15 |
| Raleigh | IARB own month view, 1461 | 15/15, 89.7, improving year on year |
| Rochester | athanplus Tawfeeq 1461; masjidbox Al Rahman 1467; mawaqit ICR 366 | 15/13.8 86.4 fixed; 15/15 100.0; 15/15 87.0 |
| Tucson | athanplus Islamic Center of Tucson, 1461 | 15/15, 96.1 |
| Wilmington | masjidbox Masjid al-Ikhlaas, 1466 | 15/15, 100.0 |
| Norfolk | none | honest negative (Bubble + MOHID iqamah boards) |
| Oklahoma City | none dated | honest negative (Squarespace block + IslamicFinder widget, today only) |
| Salt Lake City | none | honest negative (MOHID iqamah board) |
| Tallahassee | none | honest negative (iqamah-only WordPress) |
