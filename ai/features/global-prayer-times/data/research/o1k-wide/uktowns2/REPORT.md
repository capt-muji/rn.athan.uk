# O1k wide — twenty English towns: does anyone outside London republish LUPT?

Capture date: 10 November 2026 (GMT). Public pages only: no login, no form, no contact, no captcha.
Reference: `londonsalahtimes.com/monthly/2027/{01,02,04,07,11,12}` (LUPT publisher's own monthly
pages, 2027-2076), extracted to `data/lupt-2027-*.json`.

## Headline

**None of the twenty towns follows LUPT. Every one prints its own table.** Twenty-one dated
surfaces were captured across the twenty towns: not one matches the LUPT row on a single sampled
day, and the closest (Ilford, on the platform default) still runs +2 to +6 minutes late on fajr.
Sixteen of the twenty-one carry Hanafi asr (asr within 0-3 minutes of LUPT's 2-mithl column), four
carry Shafi asr, and one is too defective in summer to assign.

Cross-year validity of the reference was measured, not assumed: East London Mosque's 2026
full-year table (published as "produced by London Salah Times") diffed against the LUPT 2027
pages on the same MM-DD gives **fajr 152/181 exact, 181/181 within 1 minute, max 1** (dhuhr
148/181 exact, maghrib 66/181 exact, max 1). LUPT's fajr/isha are the fixed interval tables, so
the same-MM-DD test is sound across years.

## Per-town result

`rows` = dated rows captured. `fajr vs LUPT` = minutes late (+) or early (-) against the LUPT 2027
row of the same MM-DD, on the three sample dates named. Full-year mean is over every captured date
that has a LUPT counterpart; the winter mean is restricted to Jan/Feb/Nov/Dec and is the honest
discriminator where a table has a summer defect.

| Town | Mosque / surface | Tier | Dated rows | Class | Fajr vs LUPT on 3 dates | Winter mean |
|---|---|---|---|---|---|---|
| Luton | Central Mosque Luton, `November-2026.pdf` | mosque | 30 (Nov 2026) | own, Hanafi | +4 / +6 / +7 | +6.1 |
| Luton | Bury Park Jamia Masjid | mosque | 0 (app-only) | — | — | — |
| Slough | JMIC Slough, dpt year feed | mosque | 365 (2022 only) | own, **defective** | -22 / -96 / -90 | -18.1 |
| Slough | Slough Islamic Trust, live row only | mosque | 1 (today) | own | today fajr 05:34 vs 05:27 (+7) | — |
| Reading | Aisha Masjid & Islamic Centre, readingmuslim.uk ICS | community platform | 365 (2026) | own, Hanafi | +3 / -1 / +4 | +6.0 |
| Oxford | Central Oxford Mosque Society, dpt year | mosque | 365 (2026) | own, Hanafi, **summer defect** | -16 / -31 / -116 | -12.0 |
| Oxford | Madina Masjid Oxford, dpt year | mosque | 7 (2031 dates, broken) | — | — | — |
| Cambridge | Cambridge Central Mosque, monthly page | mosque | 32 (10 Nov-11 Dec 2026) | own, Hanafi | — / +7 / +7 | +6.9 |
| Brighton | Al Medinah Mosque, masjidway month | community platform | 30 (Nov 2026) | own, Shafi | +3 / +5 / +5 | +4.7 |
| Nottingham | Islamic Centre Nottingham, dpt year | mosque | 365 (2026) | own, Hanafi | -16 / -36 / -118 | -12.2 |
| Coventry | Masjid Zeenatul Islam, dpt year | mosque | 365 (2026) | own, Hanafi | +9 / +4 / -1 | +8.9 |
| Stoke | City Central Mosque, dpt month | mosque | 30 (Nov 2026) | own, Hanafi | 0 / +6 / +8 | +5.1 |
| Bolton | Zakariyya Jaame Masjid, 2026 calendar PDF | mosque | 354 (2026) | own, Hanafi | +18 / +5 / -2 | +17.7 |
| Oldham | Oldham Central Masjid & Islamic Centre, dpt year | mosque | 365 (2026) | own, Hanafi | +14 / -6 / -9 | +15.2 |
| Oldham | Westwood Mosque, dpt year | mosque | 345 (2026) | own, Hanafi | +13 / -8 / -8 | +15.3 |
| Rochdale | Golden Mosque, dpt year | mosque | 365 (2026) | own, Hanafi | +17 / -3 / -4 | +18.5 |
| Rochdale | Central Masjid Rochdale, monthly PDF | mosque | 0 (column-scrambled text, not parseable) | — | — | — |
| Walsall | Walsall Jamia Masjid Ghausia, dpt year | mosque | 366 (2020 rows) | own, **defective** | -12 / -95 / -82 | -7.7 |
| Dudley | Dudley mosque & Muslim community centre, masjidway | community platform | 30 (Nov 2026) | own, Shafi | +11 / +15 / +15 | +14.6 |
| Preston | Jamea Masjid, masjid247 monthly image | mosque (platform-hosted) | 30 (Nov 2026) | own, Hanafi | +18 / +23 / +25 | +22.6 |
| Blackpool | Central Mosque, masjid247 monthly image | mosque (platform-hosted) | 30 (Nov 2026) | own, Hanafi | +19 / +21 / +20 | +20.5 |
| Middlesbrough | Middlesbrough Central Masjid, rendered month | mosque | 30 (Nov 2026) | own, Shafi | +15 / +19 / +22 | +18.5 |
| Stockport | Stockport Islamic Centre, monthly page | mosque | 30 (Nov 2026) | own, Hanafi | +15 / +17 / +16 | +16.3 |
| Stockport | Stockport Muslim Foundation, dpt year | mosque | 365 but contradicted by its own live page | dead install | — | — |
| Watford | Watford Jamia Mosque, November 2026 image | mosque | 30 (Nov 2026) | own, Hanafi | -12 / -11 / -14 | -11.9 |
| Ilford | Ilford mosque, masjidway month | community platform | 30 (Nov 2026) | own, Shafi | +2 / +5 / +5 | +4.7 |

Counts: **LUPT-follower 0 of 20 towns; own table 20 of 20.** By madhab: 16 surfaces in 15 towns
print Hanafi asr (within 0-3 minutes of LUPT's 2-mithl column); four print Shafi asr (Brighton
+0.4, Dudley +1.8, Ilford -3.2 on 1-mithl). The fifth non-Hanafi surface, Walsall, is defective in
summer and cannot be assigned; Middlesbrough sits 10 minutes *before* LUPT's 1-mithl, a third
convention rather than the Shafi default.

## The reference, re-measured

| Surface | Tier | Dated data | Rows |
|---|---|---|---|
| londonsalahtimes.com `/monthly/2027/MM` | publisher | monthly tables for every month of 2027-2076 | 30-31/month captured for 01, 02, 04, 07, 11, 12 |
| East London Mosque `/prayer-times` | mosque (LUPT-produced) | full-year 2026, all six beginnings plus both asr mithls | 365 |

2026 monthly pages on the publisher's site still 301-clamp to 2027, so the 2027 pages plus ELM's
2026 table are the two live witnesses for a same-MM-DD diff.

## What confirms the census record

- LUPT is a London artefact and does not travel. The census's "London keeps its own baked
  timetable, Wifaqul is the community position elsewhere" holds in all twenty towns: not one
  mosque reproduces a LUPT row, although several sit within minutes of it on dhuhr/maghrib purely
  because they share the meridian.
- Latitude separates cleanly as the census predicts: fajr and sunrise carry the spread
  (Preston +22.6, Blackpool +20.5, Middlesbrough +18.5, Stockport +16.3 versus Watford -11.9,
  Slough -18.1), while dhuhr/maghrib collapse to a few minutes.
- The dpt-plugin pool behaves as recorded: `?rest_route=/dpt/v1/prayertime&filter=year` serves a
  full year on Nottingham, Oxford COMS, Oldham OCMIC, Oldham Westwood, Rochdale Golden, Walsall
  WJMG and Stockport Muslim Foundation; `filter=month` serves Stoke's November. Two new dead or
  stale installs appeared (Slough JMIC serving 2022, Walsall WJMG serving 2020 rows that still
  equal its live 2026 today-row, Stockport Muslim Foundation contradicting its own live page).
- Bradford's density has a Lancashire analogue: Oldham carries three sites (OCMIC, Westwood,
  Madina) and one working dpt year each way; Rochdale carries Golden plus Central Masjid.

## What is NEW

- **The publisher's own 2027-2076 monthly web tables** are now the primary LUPT surface, so a
  year-2 comparison needs no recovery: `data/lupt-2027-*.json` is scraped, not fitted.
- **masjidway's "UK Unified Timetable" label does not mean LUPT.** Al Medinah Brighton,
  Dudley mosque and Ilford mosque all print "Method: UK Unified Timetable" yet run +2 to +15
  minutes on fajr and carry Shafi asr. The label is a platform method name, not the London tables.
  Any census row that reads a masjidway page as LUPT evidence should be corrected.
- **masjid247 publishes each mosque's monthly timetable as a stable image URL**
  (`cdn.masjid247.com/timetable-published/<id>/<year>/<month>.jpg`), and Jamea Masjid Preston and
  Central Mosque Blackpool embed it. This is the first machine-addressable monthly surface found
  for either town.
- **readingmuslim.uk serves per-mosque iCal calendars** (`/time/<mosque>/athan.ics`, 730 days,
  five prayers per day). Aisha Masjid Reading is 365 dated rows from one URL, refreshed hourly.
- **Central Oxford Mosque Society and Islamic Centre Nottingham both run the dpt plugin at London
  longitude**: their dhuhr sits within 2 minutes of LUPT all year (Oxford mean +0.85, max 2;
  Nottingham mean +0.21, max 1) while their fajr runs 12 minutes earlier in winter. A London
  meridian with a non-LUPT fajr angle, not a LUPT copy.
- **A new dpt defect class**: an unclamped fajr angle at high latitude. Oxford COMS, Nottingham
  ICC and Walsall WJMG all print fajr near 01:10-01:50 through June (LUPT 03:08). Their own
  jama'ah columns (04:00, 05:15) show the mosques do not use the printed value.
- **A second dpt defect class**: BST is not applied in the summer rows. Slough JMIC and Walsall
  WJMG print sunrise/dhuhr/maghrib a full hour early from April to October.

## What deserves a fit

- Nottingham, Oxford COMS, Oldham OCMIC and Westwood, Rochdale Golden and Coventry all publish a
  clean full-year 2026 dpt feed gated 5/5 (or 6/6) against the mosque's own live row. They are the
  strongest non-London English fits after Bradford: one JSON each, no OCR.
- Preston, Blackpool, Bolton, Luton, Watford, Middlesbrough and Stockport give a single month
  each; a second and third month (the masjid247 URL is month-parameterised) would make an annual
  series.
- Bolton's 2026 calendar PDF omits fajr entirely for 11 midsummer days; the missing rows are the
  high-latitude no-true-dawn window and should be modelled as such, not interpolated.

## Honest negatives

- **Dudley has no mosque website.** Searches in English for Dudley Central Mosque and the Dudley
  mosque and Muslim community centre returned only directories (masjidway, prayersconnect,
  islamicfinder, mosquepay). The only dated surface is the masjidway platform month, used above.
- **Brighton's own sites carry no table.** almedinah.co.uk loads its month grid client-side with
  no fetchable payload; brightonmosque.com returns 404 on `/prayer-times`.
- **Ilford's own site carries no dated table.** ilfordmosque.com embeds a Masjidbox widget
  (today only, hour and minute in separate cells, identical on any `?date=`); the PNG it links
  (`prayer-ilford.png`) is a 128x9 spacer.
- **Jamea Masjid Preston's own host refuses connections** from this network (`jameamasjid.co.uk`
  returns 000 over curl and urllib); its timetable was read from the masjid247 image it embeds.
- **Central Masjid Rochdale's monthly PDF has no column structure in its text layer** (values
  interleaved), so its rows were not parsed; the Golden Mosque dpt feed stands for the town.
- **Stockport Muslim Foundation's dpt year contradicts its own live page** (fajr 04:28 against
  5:24 shown on the page), so its rows are not used.
- **Slough's two biggest institutions publish no usable year**: JMIC's dpt feed is frozen at 2022
  and fails a 5-field gate against its own live row; the Slough Islamic Trust prints only a live
  widget row for today.
- **Madina Masjid Oxford's dpt feed returns 7 rows dated 2031.**
- Searches were English only; no Urdu or Arabic timetable page surfaced for these twenty towns.
