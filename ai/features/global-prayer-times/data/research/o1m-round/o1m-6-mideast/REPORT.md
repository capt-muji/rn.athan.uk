# O1m-6 (continuation) - Middle East city depth

Workspace: `$HOME/athan-gitree/census/o1m/o1m-6-mideast/`.
This session CONTINUED the cancelled wave from its banked state (67 MB, captures only, no
report). Nothing banked was redone. Engine: adhan 4.4.6 at
`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`, `Rounding.None`, timezone pinned per
country (`Asia/Tehran`, `Asia/Aden`, `Asia/Muscat`, `Africa/Tripoli`, `Asia/Hebron`, `Asia/Riyadh`
...), every date taken from a literal capture string or the page's own month label. No clock read.

## 1. Counted state (scripts/count.py)

| object | surfaces | dated rows | years |
|---|---|---|---|
| tawkit.net, twelve fronts | 2,814 pages / 1,481 cities | 84,949 | 2026-11 + 2027 |
| Iran, pishkhanak monthly | 880 pages / 44 cities | 26,884 | Jalali 1404 + 1405 to Aban |
| Oman, mara.gov.om villages | 86 CityIDs x 12 months | 31,390 | 2026 |
| Yemen, Awqaf six governorate feeds | 6 feeds x 365 days | 2,190 | 2026 |
| Saudi, umqserv grid | 109 points x 2 Hijri years | 77,172 | 1449, 1450 |
| Lebanon, masjidi regional tables | 16 tables (re-fetched) | 5,856 | 2026 scaffold |

Archive: 5,302 files, 301,968,750 bytes (0.30 GB), up from the banked 67 MB. Nothing left in
`/tmp`; nothing written to the repository.

Banked work verified before continuing: the 216 Yemen Livewire captures were real data (the
prior summary had not parsed them); the 202 Saudi captures covered 101 points; 30 masjidi region
tables and 60 tenant screens were intact.

## 2. Iran - the front was empty and is now measured twice

**Two independent surfaces, and they disagree.**

1. **pishkhanak.com** `/tools/prayer-times/<city>/<jalali-year>/<month>` - server-rendered month
   table, seven columns (fajr, sunrise, dhuhr, asr, maghrib, isha, Islamic midnight), and the page
   states its own method in Persian: the Geophysics Institute of Tehran University convention,
   fajr 17.7 deg and maghrib 4.5 deg. 880 pages, 44 cities, 26,884 dated rows across Jalali 1404
   (2025-03-21 .. 2026-03-20) and 1405 to Aban.

   **Fit: one recipe, 38 cities, 23,218 city-days.** fajr 17.70, isha 14.00, maghrib at the sun's
   4.5-degree depression, every margin zero, nearest rounding. Within-1 is **100.0 pc at 29 of 38
   cities and 99.0+ at 36** (median 100.0), exact 78.1-88.8 pc, MAE 0.112-0.219, and the
   4.5-degree basis wins at 36 of 38. The ingredient the fit had to discover: **maghrib is
   a depression, not a margin.** A fixed sunrise-offset reproduces only 64.3 pc of maghrib cells
   (max 3 min); the 4.5-degree model takes the same table to 100 pc within 1. Two cities reject the
   recipe and are recorded as publisher defects, not as counter-evidence: Khorramabad (36.2 pc,
   MAE 6.81, its own sunrise column displaced) and Bam (76.1 pc).

2. **tawkit.net** `/en/prayer-times/iran/<city>` - 202 cities, November 2026 plus a full 2027 for
   40 cities. **Different method**: median fajr 17.45, isha 18.00, and it prints an isha row the
   national print does not carry. Median within-1 100 pc at its own stated coordinates, so both
   surfaces are internally exact and simply encode different conventions. The platform layer is
   recorded as platform, never as the Iranian authority print.

**Authorities probed.** `calendar.ut.ac.ir` (the Calendar Centre of the Geophysics Institute)
answers with a Cloudflare interstitial only - recorded as blocked, not solved.
`time.ir` rebuilt as a Next.js site with no prayer-times section (six path probes, all 404).
`prayer.aviny.com` serves Jalali-1405 city search through an ASP.NET postback chain; the country
and city selects are public but the results table is postback-only, and the site states its own
accuracy as plus or minus 3 minutes - recorded as a calculator, not walked.

## 3. Yemen - the ministry feed is six governorates, and it parses

`yemenawqaf.org/prayer-times` exposes a public selector with **six** locations: Aden (1), Hawta /
Lahj (2), Mukalla (3), Seiyun (4), Marib (5), Al-Ghaydah / Mahra (6). The banked Livewire walk
held 12 months x 6 locations x 3 years; the parse now yields **2,190 rows, 365 days per location,
zero gaps, for 2026 only** - 2025 and 2027 return "no data for this month" on every location and
month, so the surface is current-year locked.

**Fit, one table per governorate, full year:** all six at **100 pc within 1**, MAE 0.086-0.181.
Per-location pairs: Aden 16.95/17.60, Hawta 16.05/16.75, Mukalla 17.95/16.80, Seiyun 15.40/17.10,
Marib 17.00/16.40, Al-Ghaydah 16.75/17.00 (fajr/isha, nearest). The six pairs are **not one
national angle set** - they spread 15.4-18.0 - which is consistent with the recorded Aden
16.40/17.00 and confirms per-governorate parameterisation rather than a country default.

**Feed-to-governorate map (the brief's question):** this feed serves Aden, Lahj, Hadhramaut
(Mukalla, Seiyun), Marib and Mahra. It does **not** carry Sanaa, Taiz, Hodeidah, Ibb or Dhamar -
the selector has six entries, read from the page's own option list. Those five governorates are
served instead by the tawkit layer (313 Yemen cities, 12,675 rows, isha = maghrib + 90 exactly on
all but five edge days).

## 4. Saudi - the eight briefed cities, and the recipe does not move

Eight new points at 1449 and 1450 (Unaizah, Arar, Sakaka, Najran, Jizan, Al-Ahsa, Qatif, Yanbu),
354 rows per point-year. The grid now stands at **109 points, 77,172 city-days: within-1
99.9-100.0 pc, exact 82.6-88.1 pc**, one recipe (18.5 floor+1, isha maghrib + 90, + 120 on the
API's Ramadan days, Shafi, MiddleOfTheNight, zone 3). No new deviating point. The tawkit Saudi
layer independently prints isha as an interval (median 90, max 120) on 10,865 rows - the
Umm al-Qura convention reaching a platform.

## 5. Oman - the whole 86-entry CityID space, not just the cities

`mara.gov.om/calendar_page2.asp?year&month&CityID` captured at **all 86 CityIDs x 12 months of
2026: 31,390 rows, zero empty months**. The parse keeps the recorded trap: asr, maghrib and isha
print a bare 12-hour clock, dhuhr does not.

26 CityIDs could be matched to a reference point from the platform gazetteer and fitted:
**99.8-100.0 pc within-1, max 2**, angles 17.75-18.35 fajr and 17.0-18.2 isha, margins 2-5. The
national 18/18 + 5 family holds across the village layer. The other 60 CityIDs carry no known
coordinate. Their points were **recovered from their own sun columns** (day length for latitude,
the sunrise/maghrib midpoint for longitude) and the recovery is measured, not trusted: longitude
comes back to about 0.05 deg (the noon column is clean), latitude only to about 1.0-1.3 deg, and
the recovered-point fits land at **54.7-67.3 pc within-1** (`fit/om-village-fit2.json`). Those
sixty are banked as dated rows with the recovered point recorded as provisional and **not**
claimed as a city attribution.

tawkit's Oman layer (91 cities, 5,283 rows) runs **18/17** - a different pair from the ministry's
18/18 - recorded as a platform divergence.

## 6. Iraq, Jordan, Syria, Lebanon, Palestine, Libya, Qatar, Bahrain, Kuwait (tawkit layer)

| front | cities | rows | measured family | defect |
|---|---|---|---|---|
| Iraq | 145 | 8,000 | fajr 18.0, isha 17.0, maghrib sunset+0 (112 cities), 100 pc median | Badrah 48.9 pc, MAE 6.4 |
| Jordan | 142 | 7,180 | two families: 17.3/18.0 (62) and 18.0/18.0 (22), maghrib +6/+7 | Maan MAE 40.6 |
| Syria | 287 | 11,895 | 18.0/18.0, maghrib sunset+0 (227 cities) | Aleppo/Damascus/Idlib MAE 1.4-1.5 |
| Palestine | 25 | 5,106 | 18.0/18.0, maghrib +5..+7, 99.4-100 pc | Rafah 63.6, Tulkarm 82.0 |
| Libya | 64 | 4,110 | 18.55/18.0 median | Tobruk MAE 58.4, Ubari 51.5 |
| Qatar | 5 | 515 | isha = maghrib + 90 on every row | Doha 86.9 pc |
| Bahrain | 2 | 60 | fajr 17.3/18.0, isha 17.05 (+80 min) | none |
| Kuwait | 1 | 30 | 18.0/17.0 | page is the capital only |

**Iraq.** The Diwan surface stays Baghdad-only (the six-parameter probe of the prior wave stands);
the eight briefed cities now have dated rows from a platform instead, and the platform's family
(18/17, zero margins) is **not** the Diwan's (18.1/16.9 with +1/+5/+3 margins). Two Iraqi lines, kept
apart. No Ja'fari shrine table was found on a public page; the shrine line stays unclaimed.

**Jordan.** The regional-margin finding reappears on an independent publisher: two families split
by region and maghrib at +6 or +7, never one national margin. Maan's page is broken (MAE 40.6,
max 75) and is excluded.

**Syria.** The ministry domain `awqaf.gov.sy` does not resolve (NXDOMAIN, Arabic and English
searched); `moa.gov.sy` answers with an incomplete certificate chain and no prayer page. The
Syrian news agency states that the ministry's own calendar is the reference, but publishes no
table. The 287-city platform layer is banked as platform, with a coarse integer clock (MAE 1.4-1.5
against exact solar time).

**Lebanon.** The 16 masjidi regional tables were re-fetched and the dominant one (table 2, which
serves 176 tenants) scored at three candidate points: **Beirut 76.9 pc within-1 (MAE 0.83), Sidon
77.1 pc (0.95), Tyre 66.0 pc (1.25)**. Beirut and Sidon are within noise of each other and Tyre is
clearly out, so the table is one reference point in the Beirut-Sidon corridor with per-tenant
offsets doing the rest; the table's dhuhr is a **fixed 11:41 clock all year on UTC+2**, which is
why a coordinate cannot be pinned tighter. The Dar al-Fatwa domains do not resolve; tawkit serves
no Lebanese city page (country page has zero city links).

**Palestine.** 25 cities at 99.4-100 pc within 1 on 18/18 with maghrib +5..+7 - the Awqaf print
plus the city offset rule, now corroborated on a second platform. Rafah (63.6) and Tulkarm (82.0)
deviate; Nablus carries a +7 maghrib.

**Kuwait.** The masjidi pool settles the governorate question: **all four Kuwaiti tenants**
(Salmiya, Farwaniya, Bayan, Mina Abdullah) sit on **one** national table (id 144), which fits at
100 pc within-1 with fajr 18.0 / isha 17.5 and zero margins. There is no governorate axis on the
platform, only mosque-side offsets. Hawalli, Jahra and Ahmadi still have no authority surface.

**Qatar.** isha is exactly maghrib + 90 on all 515 rows. The masjidi Qatari table (164, Al-Rayyan)
**fails the same test**: rms 2.0, 85.3 pc within-1, fajr 18.575, isha interval 20.1 - recorded as a
second Qatari line, not merged with the platform's +90.

**Bahrain.** Two cities, both 100 pc within-1. No stated fajr angle was found on a public page:
the Sunni Waqf's prayer page carries **embedded files, not an inline table** (0 tables, 0 time
strings in 311 KB), and `awqaf.gov.bh` does not resolve. The tawkit Bahraini pages fit fajr
17.3-18.0 with isha 17.05, and the masjidi Bahraini table repeats the recorded "17.7-deg-like"
reading with no stated angle anywhere.

## 7. Method notes

- The fit harness (`scripts/fit-surface.js`) frees fajr and isha angles on a 0.05-degree grid,
  fits sunrise/dhuhr/asr/maghrib as fixed offsets, and tests the 4.5-degree maghrib alternative;
  it sets the country timezone per group, so Iran's +3:30 is not silently scored on Arabia's clock.
- Yemen's and Oman's parsers apply the 12-hour correction to columns 4-6 only, as the recorded
  traps require.
- The Lebanon table rows are keyed on a 2028 leap scaffold (the payload carries no year); the
  scaffold is an index, not a claim.

## 8. Honest negatives (languages searched)

- **Iran authority print**: `calendar.ut.ac.ir` Cloudflare interstitial (blocked); `time.ir` has no
  prayer section (six probes); `aviny.com` postback-only and self-declared plus or minus 3 minutes.
  Searched in Persian and English.
- **Syria ministry table**: `awqaf.gov.sy` NXDOMAIN, `moa.gov.sy` certificate error, no table on
  `sana.sy`. Arabic and English.
- **Yemen Sanaa, Taiz, Hodeidah, Ibb, Dhamar**: absent from the ministry selector (six entries).
  Arabic.
- **Lebanon Dar al-Fatwa years**: `dar-alfatwa.gov.lb` and `dar-alfatwa.org` do not resolve; no
  tawkit Lebanese city page. Arabic, French, English.
- **Bahrain stated angle**: no public statement found; the Waqf prayer page is embedded files.
  Arabic and English.
- **Kuwait governorates**: no authority or platform surface; four tenants on one table. Arabic and
  English.
- **Iraq Ja'fari shrine line**: no public dated table found. Arabic and English.
- **Qatar daily rows**: `prayers.qa` carries no dated table (its tables are navigation), and
  `islam.gov.qa` renders client-side. Arabic.

## 9. Defects recorded

1. tawkit Iran prints an isha row at 18 deg where the Iranian convention has none - a platform
   convention, not an error to repair.
2. tawkit Saudi "Algoze" page: MAE 589.6, max 842 min - a broken render.
3. tawkit Saudi "Al Hijrah": MAE 227.7, max 696 - a broken render.
4. tawkit Oman "Rasalhad": one day 721 min out (AM/PM flip), the rest exact.
5. tawkit Jordan "Maan": MAE 40.6 across the year.
6. tawkit Libya "Tobruk" and "Ubari": MAE 58.4 and 51.5 - clock, not geometry.
7. tawkit Iran "Khorramabad" and "Bam": the only two cities where the Geophysics recipe fails,
   both with own-column displacement.
8. masjidi Qatar table 164: rms 2.0 on a full year, the worst of the re-fitted Mideast tables.
9. pishkhanak and aviny both self-declare a plus or minus 1-3 minute tolerance; their tables are
   calculators and are never cited as the ministry print.

## 10. NEXT

1. Recover reference points for the 60 unfitted Oman CityIDs from their own sunrise/day-length
   columns, then fit them on the national recipe.
2. Walk `prayer.aviny.com`'s ASP.NET postback for Iran's four named cities to test whether the
   calculator and the authority print agree to the minute.
3. Yemen: search for a second Yemeni publisher for Sanaa, Taiz, Hodeidah, Ibb and Dhamar
   (governorate awqaf pages, Ramadan imsakiyya prints).
4. Syria: watch `moa.gov.sy` and the ministry's own calendar publication; the platform layer is
   the only dated object.
5. Lebanon: enumerate tenant-side offsets for all 244 tenants and test whether table 2 + offsets
   reproduces Sidon and Tyre at the minute.
6. Iraq: probe shrine waqf pages (Najaf, Karbala) for a dated Ja'fari table, kept separate from
   the Diwan line.
7. Qatar and Bahrain: find a year-long authority table; both currently rest on platform layers.
8. Iran: extend pishkhanak to all cities that resolve, and to Jalali 1403 for a three-year span.
