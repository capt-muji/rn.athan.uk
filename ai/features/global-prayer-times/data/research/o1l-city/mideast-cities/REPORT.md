# O1l-8 Middle East second cities: report

Agent: O1l-8 (research wave, no children). Workspace:
`$HOME/athan-gitree/census/o1l-city/mideast-cities/`.
Capture window: 2026-11-11 02:55Z .. 03:25Z. Engine: adhan-js 4.4.6,
`Rounding.None`, second resolution, explicit per-column rounding, no ambient clock
(each run pinned to its country zone). 43 MB of raw captures, 1.8 MB of normalized rows.

Cities covered: 10 Saudi, 6 Oman, 1 Kuwait (capital, full year), 16 Jordan regional
groups, 1 Iraq (national row). 12,360 dated rows normalized in total.

---

## 1. Saudi Arabia: the one recipe extends to all ten cities

**Surface.** `umqserv.kacst.gov.sa/api/v1/Prayer/GetPrayerHijriYear` keyless GET, one per
city-Hijri-year, `lat`/`lon`/`zone=3`. Authority, unchanged.

**Held.** Hijri 1448 (2026-06-16..2027-06-05, 355 rows) and 1449 (2027-06-06..2028-05-24,
354 rows) at all ten cities. New captures for this wave: the six second cities (Abha, Tabuk,
Dammam, Taif, Buraidah, Hail) plus re-capture of the four already on record (Makkah, Riyadh,
Medina, Jeddah) so the ten-city verdict rests on one harvest, one engine, one run.

**Recipe tested (the record's, unchanged).** fajr 18.5; isha = maghrib + 120 on the API's
own Ramadan days (hijri month 9) and + 90 otherwise; single formulation
`floor(raw + 1)` per prayer except sunrise at `floor(raw)`; Shafi asr; `MiddleOfTheNight`.

**Fit, both years, one recipe (7,090 city-days, 42,540 prayer cells).**

| city | rows | exact % | within-1 % | MAE | free fajr angle |
|---|---|---|---|---|---|
| Makkah | 709 | 85.9 | 100 | 0.141 | 18.48 |
| Riyadh | 709 | 85.1 | 100 | 0.149 | 18.46 |
| Medina | 709 | 85.3 | 100 | 0.147 | 18.46 |
| Jeddah | 709 | 86.1 | 100 | 0.139 | 18.48 |
| Abha | 709 | 87.5 | 100 | 0.125 | 18.46 |
| Tabuk | 709 | 84.0 | 99.9 | 0.161 | 18.48 |
| Dammam | 709 | 84.8 | 100 | 0.152 | 18.46 |
| Taif | 709 | 86.6 | 100 | 0.134 | 18.46 |
| Buraidah | 709 | 84.6 | 100 | 0.154 | 18.50 |
| Hail | 709 | 84.5 | 99.8 | 0.157 | 18.44 |

Per year: exact 83.8-87.7 (1448) and 84.3-87.3 (1449); MAE spread between years 0.010-0.018
at every city. Parameters frozen, no between-year shift.

**The Ramadan switch is one value, ten cities.** Exactly two intervals appear across all
7,090 rows: 90 and 120. Ramadan contributes 58 days both years at every city, all at
exactly 120; every other month exactly 90. Zero violations, month-exact on the API's own
Hijri boundaries (1448 Ramadan is 29 days, 1449 is 29 days).

**Seasonal amplitude (Jan vs Jul fajr).** Abha 78 min, Makkah 90, Taif 90, Jeddah 91,
Medina 104, Riyadh 105, Buraidah 112, Dammam 113, Hail 119, Tabuk 122. Isha amplitude runs
2-5 min wider than fajr at every city (the 30-min Ramadan step is excluded from the
prayer's own amplitude).

**Verdict.** The one-recipe verdict EXTENDS to all ten cities. Free per-city fajr fits land
18.44-18.50, all within 0.06 deg of 18.5; the fixed 18.5 scores 99.8-100 % within 1 at every
city in both years. No city needs its own margin. **NEW:** six cities at two Hijri years
(4,254 new city-days); the ten-city total is 7,090 city-days.

**Residual.** 13 cells out of 42,540 sit 2 min out (99.97 % within 1). They cluster on six
dates (2026-09-15, 2026-09-16, 2026-10-15, 2027-09-03, 2027-10-03, 2028-03-27), on
maghrib/isha at Tabuk and Hail and asr at Buraidah, with one sunrise at Hail. Not at a Hijri
month boundary and not a city-wide offset; recorded as the publisher's own edge days rather
than smoothed away.

---

## 2. Oman: the CityID list is 86 entries, and the recipe holds at six second cities

**Surface.** `mara.gov.om/calendar_page2.asp?year=&month=&CityID=`, plain GET, authority.

**The real CityID list (enumerated from the page's own `<select>`, not assumed).** Values
0-85, 86 entries: 0 Muscat, 1 Ibra, **2 Adam**, 3 Izki, 4 Al Ashkhara, 5 Buraimi, 6 Al-Jazir,
7 Al Jama'a, 8 AlHashman, 9 Halaaniyat, 10 Al-Hamra, 11 Al-Khabura, 12 AlKhadrafi,
13 Lekhwair, 14 Al Duqm, 15 Ristaq, 16 Al Awabi, 17 AlQabil(Sh), 18 AlQabil(Dh),
19 Kamil&Wafi, 20 Mudhaibi, 21 Maamura, 22 Al-Howaisa, 23 AlWasit, 24 Wasl, 25 Bukha,
26 Bidbid, 27 Bidiya, 28 Barka, 29 Bahla, 30 Thumrait, 31 J Harasis, 32 JB Hassan,
33 JB BuAli, 34 Habrut, 35 Hag, 36 Daba Bay'aa, 37 Ras AlHad, 38 RMadrakah, 39 Rakhyut,
40 Rwahiba, 41 Raysut, 42 Sad'h, 43 Samail, 44 Samad Shan, 45 Sinaw, 46 Suwaiq, 47 Seyh Rawl,
48 Saiq, 49 Salyim, 50 Shinas, **51 Sohar**, 52 Saham, 53 Sarab, 54 Sarfayt, **55 Salalah**,
**56 Sur**, 57 Dhank, 58 Taqah, 59 Dhalqut, **60 Ibri**, 61 Fahud, 62 Qarn Alam, 63 Quriyat,
64 Kanhat, 65 Liwa, 66 Mahdha, 67 Mhut, 68 Mad'ha, 69 Mirbat, 70 Marmour, 71 Marmul,
72 Musandam, 73 Musana'a, 74 Masirah, 75 Muqshin, 76 Manah, 77 Nakhal, **78 Nizwa**,
79 Nimr, 80 Harweel, 81 Haima, 82 Khazan, 83 WB Khalid, 84 Wadi Hibi, 85 Yanqul.
The list is mostly villages and oil camps, not cities; the eight entries that are cities of
consequence are 0, 1, 5, 51, 55, 56, 60, 78, and the wave captured four of the six new
ones plus Ibri and Buraimi.

**Held.** Salalah (55), Sohar (51), Nizwa (78), Sur (56), Ibri (60), Buraimi (5); 2026 and
2031, twelve months each = 730 rows per city, 4,380 city-days, zero gaps.

**Parse trap, sharpened.** The page prints a bare 12-hour hour for asr, maghrib and isha
(03:16 = 15:16) but prints dhuhr as 11:59 through 12:4x. Applying the "+12 when below 12"
rule to the dhuhr column as well puts Nizwa and Sur 12 hours out on late-October days
(11:59 -> 23:59) and scores them at 78-93 % within 1 instead of 100 %. The conversion
belongs to columns 4-6 only.

**Fit, one recipe, both years.** 18/18, Shafi asr, margins dhuhr +5 / asr +5 / maghrib +5,
fajr / sunrise / isha at zero margin.

| city | rows | exact % | within-1 % | MAE | free fajr | free isha | free dhuhr/asr/maghrib |
|---|---|---|---|---|---|---|---|
| Salalah | 730 | 53.6 | 100 | 0.464 | 18.11 f | 17.75 +1 r | 5 / 5 / 5 |
| Sohar | 730 | 48.3 | 99.9 | 0.519 | 18.00 r | 18.25 -1 f | 5 / 5 / 5 |
| Nizwa | 730 | 51.4 | 99.9 | 0.487 | 18.11 f | 18.05 -1 c | 5 / 5 / 5 |
| Sur | 730 | 48.9 | 99.9 | 0.512 | 18.00 r | 18.05 0 f | 5 / 5 / 5 |
| Ibri | 730 | 48.3 | 99.9 | 0.518 | 18.00 r | 18.05 0 f | 5 / 5 / 5 |
| Buraimi | 730 | 47.2 | 99.8 | 0.529 | 18.00 r | 18.05 0 f | 5 / 5 / 5 |

Per year: 2026 99.8-100 %, 2031 99.8-100 %; MAE spread between years at most 0.013. Frozen.

**The briefed 17.8/18.15 pair does not hold.** Same margins, same years, nearest rounding:
18/18 scores 100 % within 1 at all six cities with max error 1 min and exact 77.9-83.8 %;
17.8/18.15 falls to 98.7-99.5 % within 1 with max 2, and exact 58.4-64.5 %. Under ceiling
rounding the gap widens: 18/18 gives 99.8-100 % (max 2), 17.8/18.15 gives 87.0-91.0 %
(max 2). The 18/18 verdict is CONFIRMED at the second cities; 17.8/18.15 is refuted as a
description of these six tables.

**Rounding refinement, offered not imposed.** The record carries CEIL. Nearest rounding with
the same +5 margins scores strictly better at every one of the six: 100 % within 1 with max
1 versus 99.8-100 % with max 2, and exact 77.9-83.8 % versus 47.2-53.6 %. Within-1 is 100 %
either way, so this refines the digit description rather than overturning the recipe; the
record's basis is Muscat across 2020-2026 and this wave did not capture Muscat, so the
comparison is not like-for-like at the anchor.

**Verdict.** Recipe confirmed at six second cities, two years, 4,380 city-days. **NEW:**
five new cities on the surface (the record holds Muscat only), the 2031 year at each, the
full 86-entry CityID table, and the dhuhr-column parse correction.

---

## 3. Kuwait: the capital carries a full year; the governorates have no authority surface

**Surface.** `alojeiri.com/en/ojeiri-calendar?date=YYYY-MM-DD`, authority-tier by usage.
Date-addressable, one day per fetch, and **year-locked to 2026**: 2027-06-15 and 2028-01-15
both return today's page (11 Nov 2026), while every 2026 date serves its own day.

**Held.** Kuwait City, 365/365 days of 2026, zero gaps. The record held 10 November days;
this is 355 new days.

**Fit, the recorded recipe (18/17.5, fajr and sunrise FLOOR, maghrib and isha NEAREST,
dhuhr/asr fitted where the record leaves them null).** 99.8 % within 1, exact 67.0 %,
MAE 0.332, max 2 (2,189 cells; one sunrise cell excluded, see defect). Per column within-1:
fajr 100, sunrise 99.2, dhuhr 100, asr 100, maghrib 99.7, isha 100.

Free fits agree with the library-exact reading: fajr 17.85 (-1, nearest), isha 17.35 (+1,
floor), dhuhr 0, asr 0, maghrib 0, sunrise 0 — every column 100 % within 1. The two free
angles bracket 18/17.5 and the free margins are all zero, so the adhan Kuwait preset carries
the calendar with no margin, as the record says. dhuhr and asr at zero margin now
CONFIRMED, closing a null the record carried.

Seasonal amplitude (Jan vs Jul): fajr 127 min, isha 133, maghrib 123, asr 60, dhuhr 30,
sunrise 404.

**Defect found in the publisher's own page.** 2026-09-10 prints sunrise `00:00`. Verbatim,
one day, an obvious print fault; recorded and excluded from the sunrise denominator rather
than corrected.

**Governorates: honest negative at authority tier.** Al-Ojeiri serves one station. The page
carries no city or area selector; its only location parameter is `country_id`, which
enumerates countries (1 and 2 identical, 3 different by 14 min, 4-7 empty), not Kuwaiti
governorates. A probe of every query parameter the endpoint accepts (`city`, `city_id`,
`governorate`, `province`, `id`, `lat`/`lng`) returns byte-identical rows: the date is the
only parameter that moves the output. `alojeiri.com/sitemap.xml` is a 404, and the site's
navigation carries no per-city prayer page.

The Ministry (awqaf.gov.kw) publishes no prayer table on its public site; the ministry's
prayer surface is the "Masajid Kuwait" app, which is app-only. A news aggregator account
(community, not authority) states the ministry's structure as a single national table plus
published offsets from the capital: Salmi +6, Abdali +2, Jahra +2, Nuwaisib -2, Failaka -2,
Qaruh -3, with Ahmadi and Wafra following the capital. That is a community statement about
an authority table, held as community and never as data. Hawalli, Salmiya and Farwaniya sit
inside the capital's own governorate grouping and would carry zero offset under that
structure, but nothing authority-tier publishes it.

Languages searched: Arabic ("مواقيت الصلاة الجهراء 2026 وزارة الأوقاف الكويت") and English.
Community per-governorate rows exist on mawaqetsalat, almosaly, timesprayer, islamicfinder,
namazvakti and athanpro; all are computed platform tables, and none reproduces the ministry
row at Jahra (timesprayer prints Jahra fajr 04:45 against the capital's 04:46, i.e. one
minute EARLY where the stated offset is +2). Recorded as community candidates, not fitted
into this object.

---

## 4. Jordan: the grid serves 16 regional groups, not Amman only

**Surface.** `awqaf.gov.jo/ar/Pages/PrayerTime`, ASP.NET WebForms, authority. The grid
server-binds to exactly today+9; the date-range search is the known server-side binding bug
and was not retried.

**The select is public and per-region.** `DropCompany` carries 16 served values:
1 عمان، البلقاء، الزرقاء، مادبا (Amman + Balqa + Zarqa + Madaba, combined), 2 اربد, 3 الكرك,
4 الطفيلة, 5 معان, 6 العقبة, 7 الأغوار الشمالية, 8 جرش وعجلون, 9 المفرق, 11 ذيبان, 12 الأزرق,
13 الأغوار الوسطى, 14 الشوبك والبتراء, 15 الظليل والهاشمية, 19 الرويشد, 33 القدس.
A POST back with `__EVENTTARGET=ctl00$MainContent$DropCompany` and the city value serves that
region's own ten rows, with the option re-rendered as `selected`. **NEW SURFACE:**
per-region Jordan times are publicly reachable; the record's "Amman only" reading is
superseded.

**Held.** All 16 groups, 10 days each, 2026-11-11..11-20 (probed 2026-11-11T03:20Z), 160
rows. Group 33 (Jerusalem) serves zero rows.

**Parse trap.** asr, maghrib and isha print a bare 12-hour hour; dhuhr does not (`12:21`,
and `11:5x` does not occur in this window). Applying +12 to the dhuhr column as well scores
every group at 360-363 MAE and max 720.

**Fit, the recorded recipe (18/18, sunrise -6, dhuhr +1, asr +1, maghrib +7, isha +1).**

| group | held exact % | held within-1 % | free fajr | free margins (sun/dhuhr/asr/maghrib/isha) | own-recipe within-1 |
|---|---|---|---|---|---|
| 1 Amman (+Balqa/Zarqa/Madaba) | 88.3 | 100 | 17.55 -2 f | -6 / +1 / +1 / +7 / +1 | 100 |
| 2 Irbid | 51.7 | 98.3 | 18.05 0 f | -5 / 0 / +1 / +6 / 0 | 100 |
| 3 Karak | 70.0 | 100 | 17.50 -2 f | -7 / 0 / +1 / +7 / 0 | 100 |
| 6 Aqaba | 41.7 | 66.7 | 17.50 -2 f | -4 / 0 / +1 / +5 / 0 | 100 |
| 9 Mafraq | 63.3 | 100 | 17.65 -2 f | -5 / 0 / +1 / +7 / 0 | 100 |
| 14 Shobak/Petra | 28.3 | 90.0 | 17.45 -2 f | -8 / 0 / 0 / +8 / 0 | 100 |
| 7 North Jordan Valley | 23.3 | 66.7 | 17.70 -1 r | -4 / 0 / 0 / +5 / 0 | 66.7 max 5 |
| 13 Central Jordan Valley | 45.0 | 66.7 | 18.00 0 r | -4 / 0 / +1 / +5 / 0 | 66.7 max 4 |

(Thirteen of the fifteen served groups reach 100 % within 1 on their own margins; only the
two Jordan Valley groups do not. The full per-group table is in `data/jo-fit.json`, including 4 Tafilah, 5 Ma'an, 8 Jerash, 11 Dhiban, 12 Azraq,
15 Dhlail, 19 Ruwaished.)

**What confirms.** At Amman, the free fit lands on the record's margins EXACTLY (sunrise -6,
dhuhr +1, asr +1, maghrib +7, isha +1) and scores 88.3 % exact / 100 % within 1 on ten fresh
November days, reproducing the record's revised maghrib +7 on a new window.

**What is new.** The margins are REGIONAL, not national. Irbid runs sunrise -5, maghrib +6,
isha 0, dhuhr 0; Aqaba -4 / +5 / 0 / 0. Applying the Amman set countrywide lands Aqaba 4 min
out. Each region is internally exact on its own set, so the object needs a per-region margin
table rather than one national recipe.

**Angle separability.** Free fajr fits span 17.45-18.11 across the 16 groups while all reach
100 % within 1. At a ten-day span the fajr angle is ridge-degenerate against the anchor
coordinate: the ministry's own reference point per region is unpublished, so the angle
cannot be pinned from this window alone. The margins are what the data actually tests.

**Zarqa: honest negative.** Zarqa is inside group 1 with Amman, Balqa and Madaba and has no
value of its own. No separate Zarqa row exists on any authority surface found.

**Watch, not due.** The December Fajr-16 switch: the grid reaches December only when today+9
crosses 1 December, i.e. from about 2026-11-22. Probed 2026-11-11T03:20Z: not due, window
2026-11-11..11-20, no December day served. Nothing forced.

---

## 5. Iraq: the national row is Baghdad, and the pair is re-derived on a full year

**Surface.** `eldwanapp.jeeteak.com/api/prayer-times?date=`, keyless, authority (Sunni
Endowment Diwan). 365/365 dates of 2026 captured.

**Operational finding.** A `-P 6` parallel burst returns HTTP 500 on 47 dates; the same 47
dates all serve on a serial retry with a one-second gap, twice over. The store has no hole;
the endpoint rate-limits burst traffic and answers 500 rather than 429.

**City axis: honest negative, with measurement.** The endpoint takes one row per date. Six
query parameters (`city=Basra`, `city_id=2`, `governorate=Basra`, `province=Basra`, `id=2`,
`lat`/`lng` for Basra) all return byte-identical rows. There is no per-city axis on the
surface, so Basra, Mosul, Erbil, Kirkuk and Najaf cannot be sourced from the Diwan API.

The record's "countrywide" claim is measurable and does not survive as city coverage: the one
national row reproduces at Baghdad (100 % within 1) and nowhere else. Mean absolute error of
that row against each city's own sky: Najaf 1.95 min (max 7), Kirkuk 3.29 (max 12), Erbil
4.57 (max 16), Mosul 6.30 (max 20), Basra 13.74 (max 27). The Diwan's app publishes Baghdad's
clock, not a national grid.

**Fit, the recorded pair re-derived.** Free search over 15.5-19.5 deg returns **fajr 18.1 (+1,
floor), 84.9 % exact / 100 % within 1**, and **isha 16.9 (0, ceiling), 85.5 % exact / 100 %
within 1** — the record's amended pair, recovered independently from the full year rather
than from October. Free margins: sunrise -1 (nearest), dhuhr +5 (nearest), asr +3 (nearest,
Shafi), maghrib +3 (nearest). Composed, the one recipe scores 100 % within 1 on every column
across 365/365 days.

**Verdict.** Recipe CONFIRMED on a full year at Baghdad, closing the October-only basis. Per
city, Iraq stays an honest negative: authority publishes one strip.

---

## 6. What this wave changes in the record

1. **Saudi `SA-KACST`:** the one-recipe verdict now rests on ten cities and 7,090 city-days
   (was four cities, 2,836). Six second cities are new to the surface. Grade A holds.
2. **Oman `OM-MARA`:** five new cities; the surface now has six second cities at two years
   each (4,380 city-days). The 17.8/18.15 pair is refuted; 18/18 is confirmed; near rounding
   with +5 matches the digits better than ceil. The dhuhr-column parse trap is corrected.
3. **Kuwait `KW-AJIRI`:** a full 365-day year at the capital replaces the 10-day basis, and
   dhuhr/asr margins are no longer null. The surface is year-locked to 2026. Governorates:
   no authority surface, and the reason is documented.
4. **Jordan `JO-AWQAF`:** the grid is per-region, not Amman-only. Sixteen groups served in one
   window; the margins are regional. December switch still open, watch dated.
5. **Iraq `IQ-DIWAN`:** the amended pair re-derived on the full year; the surface carries one
   station, measured against five cities.

## 7. Honest negatives, with the languages searched

- **Kuwait governorates (Hawalli, Jahra, Ahmadi, Salmiya, Farwaniya):** no authority surface.
  Arabic and English searched. Al-Ojeiri has one station and no area parameter; the ministry
  site carries no table; the ministry app is app-only. The offset structure is a community
  statement, held as community.
- **Iraq per-city (Basra, Mosul, Erbil, Kirkuk, Najaf):** no city axis on the Diwan API; the
  six-parameter probe is recorded. Arabic and English searched; the Diwan's web front door
  redirects to a login, which was not attempted.
- **Jordan Zarqa:** not separable from Amman's group on any authority surface.
- **Jordan Jerusalem (value 33):** the option exists and serves zero rows.
- **Jordan December Fajr-16 switch:** not due until about 2026-11-22; probed as a watch and
  recorded as not due.
- **Oman villages:** the CityID space is 86 entries, most of them villages and oil camps;
  those were enumerated and deliberately not captured as cities.

## 8. Files

`captures/` — 20 Saudi JSON, 144 Oman monthly HTML, 365 Kuwait day HTML + the calendar
probe pages and the `country_id` probes, 365 Iraq day JSON + the parameter probe, 16 Jordan region-POST captures plus the base grid GET, the sitemap 404 and the ministry
pages.
`data/` — `sa-<city>-rows.json` (10), `sa-ten-cities-fit.json`, `om-<city>.json` (6),
`om-six-cities-fit.json`, `om-variant-comparison.json`, `kw-kuwait-city-2026.json`,
`kw-fit.json`, `jo-groups.json`, `jo-fit.json`, `iq-baghdad-2026.json`, `iq-fit.json`.
`scripts/` — the harvesters and fitters, all re-runnable; `TZ=<country zone> node scripts/<x>.js`.
