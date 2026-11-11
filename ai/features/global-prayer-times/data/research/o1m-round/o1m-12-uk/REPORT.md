# O1m-12 — UK third layer (England mosaic, Northern Ireland, Crown Dependencies, Wales, Scotland remainder)

Captured 2026-11-11, from ~10:30Z. All captures timestamped UTC. Engine for every fit: adhan 4.4.6
(`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`), `Rounding.None`, TZ `Europe/London`,
dates built from the literal capture strings, no clock reads.

Held before this wave: 75 UK surfaces. One held negative was retried and closed (Sunderland); no held
surface was re-captured otherwise.

## 1. What was found

### 1.1 Full-year surfaces (new)

| Surface | Place | Rows | Span | Recipe (adhan 4.4.6) | Winter-core within-1 | Grade |
|---|---|---|---|---|---|---|
| Lancaster Islamic Society, Masjid al-Noor (DPT year JSON) | Lancaster | 365 | 2025-01-01..12-31 | **fajr 15.0 / isha 15.0**, dhuhr +4.3, maghrib +4.5, asr Hanafi | fajr 98.3, isha 100.0, dhuhr+4.3 100, maghrib+4.5 100 | provisional (one cycle) |
| Leeds Islamic Centre, Central Jamia Mosque (12-page own PDF) | Leeds | 363 | 2026-01-01..12-31 | **fajr 18.0 / isha 15.0**, dhuhr +0.5, maghrib +5.0, asr Hanafi | fajr 95.0, isha 97.5, dhuhr 100, maghrib 100 | provisional |
| Halifax, Faizan e Madina (mawaqit year) | Halifax | 366 | 2026-01-01..12-31 | **fajr 18.0 / isha 18.0**, dhuhr +0, asr Hanafi | fajr 99.2 (mae 0.11), isha 93.4 (mae 1.02) | provisional, gate fail |
| Burnley, Faizan e Madina (mawaqit year) | Burnley | 366 | 2026-01-01..12-31 | **fajr 18.3 / isha 18.1**, asr Hanafi | fajr 90.9 (mae 0.60), isha 99.2 (mae 0.55) | provisional, gate fail |
| Milton Keynes Muslim Association (athanplus board) | Milton Keynes | 365 | 2026-01-01..12-31 | fajr 15.0 / **isha 13.75**, dhuhr +4.9, maghrib +1.4 | fajr 29.2 (mae 2.17), isha 76.7 (mae 0.94) | candidate |
| Preston, Quwwat-ul-Islam Masjid (month-param site) | Preston | 364 | 2026-01-01..12-31 | fajr 14.3 / **isha 15.0**, dhuhr +5.5, maghrib +3, asr Hanafi | isha 100.0 (mae 0.49), fajr 24.4 (mae 2.45) | provisional on isha, candidate on fajr |
| Oldham Central Masjid & Islamic Centre (DPT year JSON) | Oldham | 365 | 2026-01-01..12-31 | fajr 14.4 / isha 13.7 | fajr 47.5 (mae 2.62), isha 91.7 (mae 0.61) | candidate |
| Enniskillen, Iman Mosque (mawaqit year) | Enniskillen, Co. Fermanagh | 366 | 2026-01-01..12-31 | fajr 17.8 / isha interval | fajr 72.7 (mae 1.04), isha refuted as angle | candidate, gate fail |
| **Jersey Islamic Centre (the mosque's own Google Sheet)** | St Helier, Jersey | 334 | 2026-02-01..12-31 | **fajr 17.9 / isha 15.1**, dhuhr +4.5, maghrib +5.5, asr Hanafi | fajr 100.0 (mae 0.09), isha 100.0 (mae 0.24), asr 100.0 (mae 0.00) | provisional - the cleanest UK fit of the wave |
| **Newport Diyanet (mawaqit year)** | Newport, Wales | 366 | 2026-01-01..12-31 | **fajr 17.9 / isha 16.1**, asr Hanafi | fajr 100.0 (mae 0.08), isha 98.3 (mae 0.64) | provisional, **gate pass** |
| Swansea Mosque (own site, `?month=` walk) | Swansea, Wales | 365 | 2026-01-01..12-31 | fajr 14.7 / isha 14.0 | fajr 47.5 (mae 2.17), isha 91.7 (mae 0.78) | candidate |
| **Aberdeen Central Mosque, AMIC (own 12-page 2024 print)** | Aberdeen | 366 | 2024-01-01..12-31 | **fajr 17.9 / isha 15.1**, dhuhr +5.4, maghrib +5.4, asr Shafi | fajr 100.0 (mae 0.22), isha 100.0 (mae 0.21) | provisional - the Scotland remainder's interval question answered |
| Madina Masjid Sheffield (mawaqit year) | Sheffield | 366 | 2026-01-01..12-31 | fajr 17.5 / isha 17.7 | fajr 45.5 (mae 1.95), isha 47.9 (mae 2.82) | candidate, gate fail |

### 1.2 Month and window surfaces (new)

| Surface | Place | Rows | Window | Note |
|---|---|---|---|---|
| Sunderland masjid (masjidway 2781) | Sunderland | 30 | 2026-11 | the retry the record asked for: masjidway served a full month where go2masjid 768 was all-zero |
| Royal Devon & Exeter Mosque timetable | Exeter | 31 | 2026-11 | own site, server-rendered month |
| Northampton Islamic Centre (masjidbox) | Northampton | 7 | rolling | 7-day window only, platform API now key-walled |
| Grimsby Central Mosque (masjidbox) | Grimsby | 7 | rolling | same ceiling |
| AMIC Aberdeen (masjidbox `amic`) | Aberdeen | 7 | rolling | the AMIC *own platform* page, 7 days |
| Derby Jamia Masjid (masjidbox + go2masjid 290/344/689) | Derby | 7 + 132 | rolling + 2026-12-21..2027-07-31 | the go2masjid window is unstable (see defects) |
| Zakariyya Jaame Masjid (go2masjid 262/263/658/659/660) | Bolton | 110 | 2026-11-11..2027-02-28 | five ids, one generation |
| Taiyabah Masjid (go2masjid 264) | Bolton | 59 | 2027-01..02 | second Bolton line |
| Madina Institute (go2masjid 410/411/750/751) | Oldham | 51 | 2026-11-11..12-31 | **second Oldham line: fajr 17.84 (100% within 1, mae 0.47), isha 17.97 (72.5%)** |
| Jame Masjid / Oadby & Wigston (go2masjid 706/709/710, 69) | Leicester | 11 + 31 | 2027-06..07 | future-only window |
| Doncaster Mosque (go2masjid 340/341) | Doncaster | 31 | 2027-07 | future-only window |
| Masjid-E-Noor (go2masjid 287) | Gloucester | 11 | 2027-06-20..30 | future-only window |
| Iqra Centre (go2masjid 71) | Leeds | 31 | 2027-07 | second Leeds line, future-only |
| Al-Habib Islamic Centre (go2masjid 272) | Swindon | 14 | rolling | live this pass, all-zero in O1l-28 |
| Wrexham Islamic Cultural Centre (own month PDFs) | Wrexham | 58 | 2026-08-01..09-30 | the dead-install retry: the DPT year is dead, the mosque's own month PDFs are not. isha = maghrib + 80 exactly in September (sd 0.00) |
| Hull Mosque & Islamic Centre (own site) | Hull | 31 | 2026-01 only | a static January page with no month selector: the site publishes one month and never advances it |

### 1.3 Captured, not yet transcribed

- **Cambridge Central Mosque 2026 annual poster** (`captures/cambridge-annual.pdf`, 2 pages,
  12 month panels, begins + jama'at). Text is outlined; the table is read from the rendered page
  (`captures/img/cambridge-p1.png`) and needs a careful hand-transcription pass.
- **Karimia Institute Nottingham 2026 timetable PDF**: the host refuses `curl` (empty reply);
  TinyFish's extractor returns a lossy alternating-day grid, so the artifact is recorded as
  captured-but-unread rather than fitted.
- **Rochdale Central Mosque**: three 2026 month PDFs from the mosque's own media library
  (Jumad-Al-Ula 2026-10, Rabi-Al-Aakhir 2026-09, Dhul-Hijjah 2026-05). No 12-month set is
  published; the library holds only the Hijri-named months the mosque chose to upload.
- **London Colney Islamic Centre** (Hertfordshire): a full 2026 set of twelve monthly PDFs found
  while chasing Coleraine. See the trap list.
- **Dundee Islamic Society**: `November-2026.pdf` only; the January and June names 404, so the
  archive is a rolling single month rather than a year.

## 2. Platform findings (dated this pass)

1. **go2masjid serves only the months an install has published.** The `slim=365` window is a
   forward door (proven to 2027-11-10 in O1l-28) but returns partial spans: Derby 132 days,
   Bolton 110, Oldham 51, three towns a single future month (2027-07), Gloucester eleven days in
   2027-06. Reading a 365-day request as "a year" overstates the platform.
2. **The masjidbox public API is now key-walled.** `api.masjidbox.com/1.0/masjidbox/landing/athany/
   <slug>?get=at&days=N&begin=` - the route that produced 385-row walks earlier in this round -
   returns 401 `No API key found in request`, with and without `Origin`/`Referer`; `/2.0/` is 404.
   The SEO page `masjidbox.com/prayer-times/<slug>` still carries a rolling **7-day** window inside
   `window.REDUX_STATE`, which is the new ceiling for that platform.
3. **masjidway is intermittent, not dead.** Every id probed after 11:10Z returned 503; the same
   host served Sunderland's full November table twenty minutes earlier. A 503 here is a platform
   pause, never a negative.
4. **mawaqit's stored calendar and its live page still disagree** (the O1l-28 generation-mismatch
   class): Halifax 9-10 min, Burnley up to 16 min, Enniskillen 10 min. Every mawaqit surface in
   this wave is marked GATE-FAIL and fitted from the calendar with the failure recorded.
5. **A DPT install can be year-blind.** Lancaster's `?rest_route=/dpt/v1/prayertime&filter=year`
   returns the 2025 table byte-identically for `date=01-01-2026` and `date=01-01-2027`. The install
   is a frozen 2025 object, not a live 2026 one. Grade stays provisional on one cycle.
6. **TinyFish's PDF extractor is lossy on dense poster tables.** The Karimia 2026 poster came back
   with four of six columns and alternating rows only. Never fit from that extraction.

## 3. Traps (recorded so the next wave does not repeat them)

| Query | Trap | What it actually is |
|---|---|---|
| "Coleraine mosque prayer times" | `lcic.org.uk` | **London Colney** Islamic Centre, Hertfordshire (AL2 1JY, twelve monthly PDFs). Not Coleraine. |
| go2masjid `name=Stoke` | id 10 "Dalmo" | **Bradley Stoke**, Bristol - not Stoke-on-Trent |
| go2masjid `name=Gloucester` | 287 Masjid-E-Noor | correct city, but only 11 live days |
| masjidbox "Derby Jamia Masjid" | 7-row window | every begins cell is `00:00` in the state payload: a dead board behind a live page |
| mawaqit "Dumfries" | `/m/bccd` | Badr Community Center of **Dumfries, Virginia** (the O1l-28 slug-fallback class, still live) |

## 4. Fits in detail

### Lancaster, Masjid al-Noor — 2025, the cleanest English surface of the wave
All 365 days. adhan 4.4.6, 15/15, Shafi, margins fajr 0, sunrise 0, dhuhr +4.3, asr Hanafi,
maghrib +4.5, isha 0.

| column | winter-core within-1 | mae | worst |
|---|---|---|---|
| fajr | 98.3 | 0.64 | -2 |
| sunrise | 100.0 | 0.45 | +1 |
| dhuhr | 100.0 (at +4.3) | 0.48 | +1 |
| asr (Hanafi) | 100.0 | 0.43 | +1 |
| maghrib (at +4.5) | 100.0 | 0.47 | +1 |
| isha | 100.0 | 0.44 | +1 |

Seasonal amplitude: fajr depression 15.0 held through the winter core; summer needs the substitute
band (the same 15-degree ceiling that drove Glasgow's 96-day clamp in the O1l record).

### Leeds Islamic Centre — 2026, own print
18/15 with dhuhr +0.5, maghrib +5.0, asr Hanafi. Winter core: fajr 95.0 (mae 0.72), sunrise 100
(mae 0.65), dhuhr 100 (mae 0.50), maghrib 100 (mae 0.26), isha 97.5 (mae 0.85), asr 57.9 (the asr
column carries its own rounding).

Summer behaviour, read from the print: fajr holds a **fixed 01:30** and isha a fixed ~22:50 through
the weeks when 18 degrees is unreachable at 53.8 N - an own-array interval substitute, not an
angle. Defects: 3 days lost to a column that prints a ditto without a slot (2026-06-11, 2026-07-04,
2026-07-31), and both DST-transition weeks print on the old clock.

### Preston, Quwwat-ul-Islam — 2026
isha is **15.0 degrees exact** (100% within 1, mae 0.49) with a hard **maghrib + 60** ceiling that
binds for the whole of June (interval sd 0.00). fajr is near 14.3 degrees but scatters (mae 2.45,
24.4% within 1) - the column is not a clean angle and no coordinate shift recovers it (best point
53.52/-2.11 moved 2.6 km and moved the mae only 0.06).

### Halifax and Burnley — the 18/18 pair
Both Faizan e Madina installs run an **18-degree fajr over an 18-degree isha** (Karachi pair, zero
cap): Halifax fajr 99.2% within 1 at mae 0.11, Burnley fajr 90.9% at mae 0.60 and isha 99.2% at
mae 0.55. Between them the two mosques establish the pair as a northern-English convention beside
the 18/15 (Leeds) and 15/15 (Lancaster) families.

### Enniskillen — the first dated surface in Co. Fermanagh
fajr 17.8 (72.7% within 1, mae 1.04). isha is **not an angle**: the best constant sweep stops at
29.8% within 1 (mae 5.59), so the column is an interval table and is recorded as such.

### Jersey and Aberdeen — one pair, two islands of the record
Both fit an **18/15 pair** and both reproduce essentially to the minute across the whole span:

| surface | days | fajr | isha | asr |
|---|---|---|---|---|
| Jersey Islamic Centre 2026 | 334 | 17.9, 100% within 1, mae 0.09 | 15.1, 100%, mae 0.24 | Hanafi, mae 0.00 |
| Aberdeen AMIC 2024 | 366 | 17.9, 100% within 1, mae 0.22 | 15.1, 100%, mae 0.21 | Shafi |

Jersey carries dhuhr +4.5 and maghrib +5.5 as its whole clock convention. Aberdeen carries dhuhr
+5.4 and maghrib +5.4.

**Aberdeen's interval construction, measured.** The mission named it as the special case. It is:
the 18/15 angles hold through the winter core at 57.1 N, and from late April to early August the
publisher substitutes a night fraction. The isha interval collapses to a **47-50 minute** band in
June (sd 1.0) while fajr's sunrise interval reaches 158-168 minutes, then both return to the angles
by September. Twelve monthly panels of the mosque's own 2024 print, 366 days including 29 February.

### Newport Diyanet — the wave's only gate-passing mawaqit surface
fajr 17.9 (100% within 1, mae 0.08), isha 16.1 (98.3%, mae 0.64). The live page and the stored
calendar agree, which makes it the exception among the four mawaqit captures here.

## 5. Negatives (honest, terms stated)

- **Isle of Man (Douglas)**: the Islamic Association's own page (`iaiom.com/prayer-time`) is a
  Java-Script widget that calls `api.aladhan.com/v1/timings/` in the browser, with the calculation
  method and coordinates read from a config object. The island has **no own table**: the mosque
  publishes the AlAdhan wrapper, so the record's held wrapper is the island's own method, now
  documented from the mosque's own source rather than inferred.
- **Guernsey**: no mosque publication under English terms. Every result is an aggregator
  (muslimpro, islamicfinder, hamariweb, time.now). The O1l read stands: the only surface is the
  IslamicFinder calculation at 18.5/10, which is a calculator, not a published table.
- **Alderney, Sark**: no mosque exists; recorded as a negative on the same terms as Lerwick.
- **Lisburn, Newry, Armagh, Omagh, Portadown** (NI): no mosque publication under English terms
  ("<town> mosque prayer times timetable 2026"). Every result was an aggregator (muslimpro,
  islamicfinder, hamariweb, faithcentre, quranonline) or the Belfast Islamic Centre's own Belfast
  table. The O1l negative for Lisburn and Newry stands.
- **Coleraine**: the only "LCIC" host is London Colney. No Coleraine mosque publication found.
- **Derry**: the North West Islamic Association site (`nwia.org.uk`) renders a today-widget only
  (25 time tokens, no dated table); no dpt/mawaqit/masjidbox install behind it.
- **Wigan, Blackburn, Bolton (own sites), Carlisle, Newcastle Central, Middlesbrough, Aberdeen
  (own site)**: pages carry no server-rendered table, no DPT year JSON, no PDF. They are
  JS-widget sites and are recorded as blocked-by-rendering, not as absent surfaces.
- **Wakefield Central Mosque**: `prayerTimetable.html` is 15 kB of shell with zero time tokens.
- **masjidal UK tenants** (Stoke's Masjid Abi Hurairah, Newport's Ummah Masjid, two London
  mosques, Keston): the directory payload carries numeric ids only, and the keyless range API
  refuses them (`No masjid with masjid_id = 1799 exists`). The opaque tokens are not in the
  archived tenant payload, so the UK tenant set stays unreachable this pass.

## 6. Counting

`tools/count.sh`, run against the workspace:

| | |
|---|---|
| data files with live dated rows | 43 |
| live dated rows | **6,630** |
| captures | 269 (43.4 MB) |
| full-year surfaces (>= 330 days) | 12 |
| month/window surfaces | 16 |

Four files are duplicate generations and must not be counted as four surfaces: `oldham-410/411/750/
751-go2` are one table under four ids, and `mk-athanplus-2026` is the raw board that `mk-2026`
normalizes. Distinct surfaces: **18 dated, of which 12 carry a year.**

Fit ledger: `fit/FITS.md`.

### Surfaces by nation and dependency

| | new dated surfaces | of which a year | notes |
|---|---|---|---|
| England | 13 | 9 | Leeds, Preston, Lancaster, Milton Keynes, Oldham x2, Halifax, Burnley, Sheffield, Hull, Exeter, Sunderland, Gloucester, Doncaster, Leicester, Bolton x2, Swindon (partials across the last six) |
| Wales | 3 | 3 | Swansea, Newport, Wrexham |
| Scotland | 2 | 1 | Aberdeen AMIC (2024 year); Kilmarnock blocked |
| Northern Ireland | 1 | 1 | Enniskillen |
| Crown Dependencies | 1 | 1 | Jersey |
| Isle of Man | 0 | 0 | answered negatively (AlAdhan client) |

## 7. NEXT

1. Transcribe Cambridge's 2026 poster from the rendered page (12 panels, begins + jama'at) - it is
   the only full-year Cambridge surface and it is already in hand.
2. Render and read the Karimia Nottingham 2026 poster the same way; the curl block is the host's,
   not ours.
3. Retry masjidway after a pause: Sunderland proved a full month is served for towns whose own
   sites render nothing (Barnsley 2918, Durham 3269, Doncaster 2917, Wrexham 2729).
4. Fit the three Rochdale month PDFs, the Dundee November print and the London Colney twelve-month
   set (all four artifacts are captured; the columns need hand parsing).
5. Parse Wrexham's six other 2026 month names out of its own upload paths (only Aug and Sep resolve
   under `2026/09/`).
6. Guernsey stays a calculator-only surface; the Isle of Man is answered as an AlAdhan client. No
   further route is visible for either without a mosque publication.
