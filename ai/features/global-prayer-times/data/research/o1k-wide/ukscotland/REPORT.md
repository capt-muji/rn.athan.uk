# O1k wide — UK outside London, Scotland first, plus Ireland (`ukscotland`)

Date of capture: 10 November 2026 (GMT). Public pages only; no login, no forms, no contact.
LUPT reference rows used for same-day diffs: londonsalahtimes.com home build, next-seven-days
block (Sat 31 Oct - Thu 5 Nov 2026, covering 1-5 November).

## Headline

The LUPT publisher's site was rebuilt since the census: `londonsalahtimes.com` now serves
**monthly tables for every year 2027-2076 as web pages** (year selector to 2076) plus a
`LUPT-2027.xlsx` download. Year-2 LUPT is now publisher-published, not just recovered.
2026 monthly pages are gone (301 redirect clamps to 2027). January 2027 extracted from
`/monthly/2027/01` (31 rows) into `data/lupt-monthly-2027-01.json`.

Same-day uniformity snapshot (all against LUPT 1-5 Nov 2026, or via ELM's LUPT lineage):

| Adopter | Dated rows held TODAY | vs LUPT |
|---|---|---|
| East London Mosque | 365 rows, full-year 2026, static HTML | **35/35 exact** (7 fields x 5 days); page carries "Prayer times produced by London Salah Times" |
| London Central Mosque (ICC) | 61 rows (Nov+Dec 2026) via Masjidal timings API, key published on their own page | Nov 1 exact vs LUPT; **305/305 exact vs ELM** across Nov+Dec (6 fields) |
| Muslim Welfare House (mwht.org.uk) | 30 rows, November 2026 static table | **27/30 field-days exact**; +2 min on fajr (Nov 4, 5) and sunrise (Nov 4); all zuhr/asr/maghrib/isha exact |
| Mayfair Islamic Centre | month CSV at site root `MMYYYY.csv`; April 2026 captured (30 rows); Nov 2026 CSV not yet posted (404) | not same-day verifiable; adopter per publisher |
| West London Islamic Centre (wlic.co.uk) | monthly-table plugin **broken**: page prints literal `[monthlytable]` | unmeasurable today |
| WLICC (wlicc.org) | homepage live embed only (stale "26 Oct" build), November table = social image | unmeasurable |
| Al Muntada | prayer-times page embeds WLICC ("WLICC Prayer Times - South West London"), no own table | unmeasurable |
| Al Manaar | Softr/Airtable JS app (`api.airtable.com/v0/<public-app-id>/prayTimetable`, server-side key) | unmeasurable |
| Croydon ICT | homepage + /times-display both JS placeholders ("01 JAN 2026", zeros) in static HTML | unmeasurable today (record's own-table member not re-measurable) |
| Poplar PMCC | app-only ("Download our Android app to view live prayer times"); Tower Hamlets directory page is a JS date-picker | unmeasurable |

Verdict: every adopter that publishes dated November 2026 rows today prints LUPT values
(ELM exact, ICC exact, MWH 27/30 field-days). The "unified brand does not bind every mosque"
counterexample (Croydon) now hides behind JS and cannot be re-measured from public static HTML.

## Scotland (owner's first ask)

| Surface | Tier | Dated data held | Rows |
|---|---|---|---|
| Glasgow Central Mosque (centralmosque.co.uk, = "Glasgow Islamic Centre and Central Mosque" - same institution) | mosque, official | dpt plugin `?rest_route=/dpt/v1/prayertime&filter=year`: **full-year 2026 JSON**; today-row gate passed (11-10 exact match year-vs-today-vs-live page) | 365 |
| Edinburgh Central Mosque (edmosque.org) | mosque, official | Monthly Prayer Timetable page, November 2026, weekly held jama'ah blocks (record's print style confirmed) | 30 |
| Aberdeen Mosque & Islamic Centre - Central (aberdeenmosque.org) | mosque, official | table rendered from **public Google Sheets API** (sheet id `1Lwb_Wun3wv--YXBsDlGKGdajboe7_uL--y10CMAmIW8`, key exposed on page); 367 sheet rows (365 days 2026 + one stale 1445H "31 Dec" leftover) | 333 parsed dated |
| Aberdeen AMIC - Spital (aberdeenmosque.org) | mosque, official | second Google Sheet (id `15zxrmrV5e3WJih4ffkGUdjWrE_zrlYEgdxrqXqTf9IE`), same year, +15 Mins jamah offsets | 333 parsed dated |
| Al Maktoum Mosque & ICC Dundee (almaktoummosque.org) | mosque, official | dpt full-year 2026 JSON; today-row gate passed | 365 |
| Dundee Islamic Society / Dundee Central Mosque (dundeeislamicsociety.com) | mosque, official | dpt install **DEAD**: year JSON and today JSON all `00:00:00` (stale-install class, record's "serving-2020" family) | 0 |
| Al-Furqan Mosque Glasgow | mosque | **no own site found**; Masjidbox page = today-only (athan/iqamah, 10 Nov) | 0 dated |
| Khazra Central Mosque Glasgow (masjidkhazra.org / ghh.org.uk) | mosque (bonus) | site is a JS shell; ghh.org.uk masjid path returns 410 | 0 |
| Anniesland (Glasgow) | - | **honest negative**: no mosque website surface findable in English search; aggregators list Anniesland only as a Glasgow area (urdupoint, prayertimesglasgow.co.uk) | 0 |
| Shah Jalal | mosque | Shah Jalal Edinburgh exists (shahjalal-mosque-edinburgh.co.uk) but /prayer-times/ is a JS widget with no static table; no Glasgow-specific Shah Jalal surface found | 0 |

Scotland LUPT classification: **every sampled Scottish mosque prints its own table.**
Same-day (1 Nov): Glasgow fajr 05:21 vs LUPT 05:14, sunrise 07:18 vs 06:51; Edinburgh zuhr 11:58
vs 11:49; Aberdeen fajr 05:08; Dundee fajr 05:12. None republish London.

## England beyond London

| Surface | Tier | Dated data held | Rows |
|---|---|---|---|
| Birmingham Central Mosque (centralmosque.org.uk) | mosque, official | /timetable static page = **November 2026 full table** (12 columns/day); 2027 selectable via JS/AJAX gate (not fetched) | 30 |
| Manchester Central Mosque & ICC, Victoria Park (manchestercentralmosque.org) | mosque, official | monthly PDF timetables 2019-2026 in dropdown; Nov 2026 PDF captured but **image-only** (OCR class); live /prayer-times/ page carries dated today-row (10 Nov) | 1 dated (today) |
| Jamia Masjid Hanfia Bradford (jamiamasjidhanfia.co.uk) | mosque, official | **inline full-year 2026 JSON** in homepage HTML (365 rows, rebuilt site keeps the pattern) | 365 |
| Masjid Bilal Bradford (mbilal.org) | mosque, official | dpt full-year 2026 JSON + monthly PDFs on live page; today-row gate passed (year = today = live) | 365 |
| Victor Street Masjid Bradford (victorstreetmasjid.co.uk) | mosque, official | dated month page, November 2026 static table | 30 |
| Bradford Grand Mosque (bradfordgrandmosque.co.uk) | mosque, official | `/assets/Calendar.pdf` = full-year 2026 calendar, **image-class** (no text layer) | 0 parsed |
| Leeds Grand Mosque (leedsgrandmosque.com) | mosque, official | homepage today-row + `uploads/files/A3_calendar2026_v2_(1).pdf`: 15-page image-class calendar (OCR class, embedded JPEGs, decorative pages) | 1 dated (today) |
| Hull Mosque & Islamic Centre (hullmosque.com) | mosque, official | /prayer-times/ paginated dated tables in static HTML (Jan p1, Nov+Dec p11) | 62 |
| Masjid Umar Leicester (masjid-umar.org) | mosque, official | monthly PDF (`wp-content/uploads/2026/09/November-2026.pdf`), 30 dated rows incl. subh sadiq | 30 |
| Sheffield Grand Mosque (sheffieldgrandmosque.co.uk) | mosque, official | Masjidbox embed, week-level opens/closes only | 0 dated |
| Newcastle Central Mosque (newcastlecentralmosque.com) | mosque, official | **honest negative**: AI-built (gpt-engineer) SPA shell, no static table; today-values render client-side only | 0 |
| Liverpool Muslim Society / Al-Rahma (liverpoolmuslimsociety.org.uk) | mosque, official | same AI-built SPA class ("CentralMosque - Community Management Platform"), JS-only | 0 |
| SWICC Cardiff (theswic.org.uk) | mosque, official | `/timetable/november.jpg` monthly image (read + transcribed); homepage also carries the dated static table | 30 |
| Dar ul Isra Cardiff (darulisra.org.uk) | mosque, official | live page = Masjidbox sync ("Automatically synced"); November table is a Facebook image (community) | 0 dated |

England LUPT classification: **all print their own tables** (same-day diffs vs LUPT all fail on
fajr/sunrise/zuhr: Birmingham 05:37/07:03/11:56 zuhr-begins, Leicester 05:19/07:18/11:48,
Hull 05:39/07:14/11:55 on 10 Nov vs LUPT 05:27/07:07/11:49). Birmingham and Leicester sit near
London's longitude so their maghrib/asr happen to land close to LUPT values; latitude fields
(fajr, sunrise) separate cleanly. No non-London mosque republishes London.

Bradford remains the densest patch exactly as the census says: three dated full sources
(Hanfia inline year, Bilal dpt year, Victor Street month) plus Bradford Grand image calendar.

## Ireland

| Surface | Tier | Dated data held TODAY | Rows |
|---|---|---|---|
| Islamic Foundation of Ireland `islamicfoundation.ie/api/timetable` | feed, authority-adjacent | static 366-row table, keyed `{"month": {"day": [[h,m] x6]}}`; **`?year=2027` returns the byte-identical table** - no year-2 rows exist on this surface; the DST defect therefore cannot self-heal | 366 (unchanged year-1) |
| Galway Islamic Cultural Centre REST `gicc.ie/wp-json/gicc/v1/public-prayer-times` | mosque, official | API v1.3, `?date=` param, `source_priority: [Official monthly/Ramadan timetable, Provisional Master timetable]`; today+tomorrow served from monthly (official), 2026-12-25 served from master (provisional); **2027 dates 404** - no year-2 yet | 4 dated rows (10-11 Nov official, 25-26 Dec provisional) |
| Cork (cicc.ie) | mosque | JS bundle app, no dated public table; census's "app-only" still holds | 0 |

Ireland confirms the census: GICC's REST is the strongest dated Irish capture (now versioned
v1.3 with explicit source labels - a lift: official vs provisional is machine-readable), and IFI
remains a single undated defective table. Neither Irish surface carries 2027 rows yet.

## What confirms the census record

- dpt/masjidal pool behaviour reproduces exactly: Glasgow Central, Al Maktoum Dundee, Masjid
  Bilal all serve `filter=year` full-year JSON; Dundee Islamic Society is a new dead-install data
  point (all-zero year); Manchester Central's live page differs from its own PDF archive's
  image-only tables (no contradiction measurable - PDF has no text layer).
- Edinburgh's weekly held-jama'ah print style reproduces (edmosque.org monthly page).
- SWIC Cardiff's flat dhuhr/asr athan columns reproduce in November 2026 (12:30 / 02:20 all
  month, transcribed from their image).
- Bradford's density (Hanfia inline-year + Bilal dpt-year + Victor Street month) reproduces on
  current sites, Hanfia after a rebuild.
- ELM 365/365 LUPT-exact and LCM LUPT-exact both reproduce in November 2026.
- LUPT not a formula: the publisher now publishes 2027-2076 monthly pages + 2027 xlsx, keeping
  fajr/isha table-driven (Jan 1 2027 fajr 06:26 = Jan 1 2026 ELM 06:26, the annual-recurrence
  signature of the fixed interval tables).

## What is NEW

- LUPT publisher surface: monthly pages 2027-2076 + `LUPT-2027.xlsx` (year-2 as published data).
- Aberdeen AMIC: two public Google Sheets backends (machine-readable full-year, both sites).
- ICC London Central Mosque: Masjidal timings range API with the page-published key
  (`/timings?start_date=&end_date=`, Origin-gated).
- Mayfair Islamic Centre: month CSV convention `MMYYYY.csv` at site root.
- Masjid Umar Leicester monthly PDFs; Hull paginated dated tables; Victor Street dated month page.
- Bradford Grand full-year calendar PDF (image-class) as an extra Bradford surface.
- A new site class observed twice: AI-built SPA mosque sites (Newcastle, Liverpool) with no
  static prayer data - worth a flag in the census's platform row.

## Honest negatives

- Anniesland: no mosque site or dated table exists publicly (searched English; only area pages).
- Shah Jalal Glasgow: no surface; Edinburgh namesake is a JS widget without a static table.
- London Central Mosque's own iccuk.org page embeds the Masjidal widget only (no own HTML table).
- WLIC's monthly plugin is broken today (literal `[monthlytable]`).
- Manchester Nov 2026 PDF and Leeds 2026 calendar PDF have no text layer (OCR class; not parsed).
- Cork: no dated web surface (app/JS only), as the census already held.
- Searches were English-only; Urdu/Arabic site variants were not found for these mosques (the
  few Arabic labels seen were UI chrome on English pages).
