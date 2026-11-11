# O1m-24 — the Levant and Iraq year-2

Workspace: `$HOME/athan-gitree/census/o1m/o1m-24-levant/`. Engine: adhan 4.4.6 at
`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`, `Rounding.None`, timezone pinned per
surface, every date taken from a literal capture string or the page's own title/heading. No clock
read into any dataset. Nothing written to the repository; nothing under `/tmp`.

## 1. Counted state

| object | surfaces | dated rows | span |
|---|---|---|---|
| tawkit, Syria + Jordan + Iraq | 1,368 month pages, 38 cities | 13,870 | 2026-11-01 .. 2027-10-31 |
| Lebanon, al-Manar city calendars | 147 PDFs, 7 cities, 125 city-months | 3,662 parsed / 1,381 validated | 2025-04 .. 2026-12 |
| Iraq, Diwan of the Sunni Endowment | 1 JSON endpoint | 1 day (today only) | 2026-11-11 |
| Jordan, Awqaf ministry grid | 1 page, 17 governorate options | 10 days (today+9) | 2026-11-11 .. 11-20 |
| Jordan, Awqaf grid via Wayback | 30 snapshots | 300 (184 distinct days) | 2021-01-08 .. 2026-08-16 |

Captures: 1,368 tawkit month pages, 147 calendar PDFs with their OCR text, the Diwan bundle and its API
JSON, the Awqaf page, the Syrian ministry site, and the Dar al-Fatwa domain probes.

## 2. tawkit — the forward window is eleven months, and it is the only year-2 the platform serves

**The window is bounded and now measured.** 2027 exists for every city probed and months 01-10
return their own 2027 table. Two bounds fall out of the capture, both recorded from the served
title rather than assumed:

- `?m=11&y=2027` and `?m=12&y=2027` serve **11-2026** and **12-2026** (the same month, previous year).
- `?m=01&y=2026` through `?m=10&y=2026` serve **01-2027** through **10-2027** (the same month, next year).
- `?m=05&y=2028` serves **05-2027**.

So the surface carries a current-month-plus-eleven window and nothing else: no history, no 2028.
This corrects the record's phrasing "2026-11 + 2027", which is the same fact unmeasured. 912 pages
were fetched before the bound was read; 532 of them are the clamped copies and are kept as the
evidence of the bound, not as data.

**The rows.** 38 cities, 13,870 dated rows, one continuous solar year 2026-11-01 .. 2027-10-31:
Syria 12 cities / 4,380 rows, Jordan 12 / 4,380, Iraq 14 / 5,110.

**The fit, one recipe per city across the full twelve months** (`fit/tawkit-year2-fit.json`):

| country | cities | within-1 | exact | MAE | worst |
|---|---|---|---|---|---|
| Jordan | 9 of 12 | 100.0 (7 cities), 99.4 (Tafilah), 91.6 (Karak) | 57.3-81.1 | 0.19-0.54 | 60 (Karak, one day) |
| Iraq | 14 | 95.0-100.0 | 60.5-70.2 | 0.30-0.43 | 2 |
| Syria | 12 | 91.2-98.8 (see §3) | 55.3-61.1 | 0.43-0.51 | 2 |

Jordan's family is **18.0/18.1 with maghrib +6 or +7 and sunrise -5**, reproduced at 100 pc on
seven cities; Irbid sits at 17.9/17.75 and Aqaba at 18.0/17.9 with maghrib +6, which is the two
regional families the record already carries, now measured on a second year. Iraq is
**17.8-18.5 fajr / 16.65-17.65 isha** with the six solar columns at zero margin; Baghdad alone
carries margins (dhuhr +5, asr +4, maghrib +3), the same +5/+3 pair the Diwan's own line carries.

**Two city pages named, with their cause (one excluded, one kept):**
- **Maan**: every column of the 2027 page sits 40.6 minutes later than Maan's own geometry
  (mean signed +40.67 over 1,824 cells), while the same slug's 2026 page fits at MAE 0.36. A page
  displaced as a whole, not a method change; the four AM/PM flips at 2027-02-09, 02-10, 02-24 and
  10-27 are the same displacement breaking the clock. City excluded.
- **Karak**: clean for 364 days and one 59-minute flip at 2027-02-11 (fajr 05:01 where its
  neighbours read 06:00). Kept, with the day named.

## 3. Syria — the line is an interval, not a pair, and the second edition carries it identically

**isha is maghrib + 90 minutes on every row of both editions: 4,380 of 4,380.** Twelve cities, 365
consecutive days, two calendar years, zero exceptions. The record's "18.0/18.0, maghrib sunset+0"
was a fit that had no interval in its model; freed, the surface reproduces at a far better score
(`fit/syria-interval-fit.json`, isha scored as maghrib+90):

| city | fajr | within-1 | MAE | worst |
|---|---|---|---|---|
| as-suwayda | 18.45 | 98.8 | 0.43 | 2 |
| dara | 18.70 | 96.5 | 0.45 | 2 |
| homs | 18.50 | 95.7 | 0.44 | 2 |
| aleppo | 18.50 | 95.6 | 0.44 | 2 |
| latakia | 18.55 | 94.4 | 0.45 | 2 |
| hamah | 18.50 | 93.0 | 0.50 | 2 |
| al-qamishli | 18.05 | 92.9 | 0.49 | 3 |
| damascus | 18.25 | 92.6 | 0.47 | 2 |
| idlib | 18.45 | 92.6 | 0.49 | 2 |
| deir-ez-zor | 18.35 | 92.1 | 0.50 | 2 |
| ar-raqqah | 18.50 | 91.2 | 0.51 | 2 |
| tartus | 18.15 | 91.7 | 0.48 | 2 |

Fajr is **per city, 18.05-18.70**, not one national angle; maghrib is sunset + 0 or +1; dhuhr and
asr are exact on every city. The residual is a coarse integer clock (the record's MAE 1.4-1.5 was
that clock read against an 18/18 model), and it does not move between editions.

**Between-year verdict.** The two editions split at the calendar year, not at a regime: 2026-11-01
.. 2026-12-31 (61 days) fits at 100 pc on the same interval recipe, and 2027-01-01 .. 2027-10-31
(304 days) at 91.2-98.8. The winter fragment is too short to constrain an angle (its free fits
scatter 17.75-19.10 while the ten-month fit lands 18.05-18.70), so the honest reading is **one
generation, twelve continuous months, parameters fixed**; the 61-day half adds stability evidence
only. Seasonal amplitude: fajr 81 minutes Jan-to-Jul, isha 188 (an interval rides maghrib's swing).

**The ministry.** `awqaf.gov.sy` still returns no A record (NXDOMAIN, re-probed 2026-11-11); the
Syrian ministry has moved to a **new public domain, `mow.gov.sy`**, live and current (news through
2026-11-11, contact at Mazzeh, Damascus, the minister's biography dated to his March 2025
appointment). It carries **no prayer-times page**: five path probes (`/prayer-times`, `/prayer`,
`/مواقيت-الصلاة`, `/services`, `/sitemap.xml`) all return the site's own 404, and the string
"مواقيت" appears nowhere in the 145 KB home page. Its digital-transformation section advertises
**تطبيق مسجدك** (`mobile.masjidak.app`, App Store id 6768942028, Play Store
`mobile.masjidak.app`), which is a mosque directory with a map and announcements; the web host does
not resolve, so the app could not be read. **The decree's binding calendar has no public table on
the ministry's own site in this pass**, which is why the platform layer is the only dated Syrian
series on record.

## 4. Lebanon — seven cities are now dated, and the platform's 16 tables are still undated

**A dated Lebanese print exists and was found on the second phrasings.** `almanar.com.lb` serves
monthly **city calendars** as PDFs at `/static/calendars/<year>/<city>-<month>.pdf`, eight columns
under their own Arabic heads (imsak, subh, sunrise, dhuhr, asr, maghrib, isha, Islamic midnight);
the page body carries no year but the path and the printed header both name it.

- **Seven cities**: beirut, saida, tyre, tripoli, baalbek, hermel, nabatieh-bintjbeil. The last is
  named only on the publisher's own prayer page (`/salat/`), which lists the month's seven PDFs;
  thirty-odd other Lebanese place names probed return 404 (zahle, sour, jounieh, zgharta, hasbaya,
  marjayoun and the rest).
- **Coverage**: 2026 has all twelve months for all seven; 2025 has April to December (the static
  store has dropped 2025-01..03, which return 404).
- **Rows**: 147 PDFs, OCR'd with the macOS Vision binary, parsed to **3,662 rows** over 125
  city-months. Two page orientations occur (row-major for beirut, column-major for the rest);
  both parse, and a column-major month that lost an OCR cell shifts every later row, so each
  city-month is gated against the sun's own noon and 22 of 125 were dropped, and single days whose
  own noon is more than 15 minutes out are dropped too, leaving **1,381 rows that passed the gate**
  (`fit/lb-almanar-valid-fit.json`). The loss is concentrated where a column split drifts inside a
  month (Tripoli keeps 279 of its 610 parsed rows), so the banked rows are clean and the coverage is
  partial, not complete.

**Fit, one recipe on seven cities and two years:** the print carries its own heads, right to left —
**الإمساك، الصبح، الشروق، الظهر، العصر، المغرب، العشاء، منتصف الليل** — so the column fitted as fajr
is الصبح (the prayer's own dawn) and imsak is its own prefixed column.

| city | rows | fajr | isha | within-1 | exact | MAE | 2025 | 2026 |
|---|---|---|---|---|---|---|---|---|
| saida | 157 | 16.00 | 15.00 | 99.3 | 86.7 | 0.15 | - | 99.3 |
| tripoli | 279 | 16.05 | 14.95 | 99.0 | 81.5 | 0.30 | 100.0 | 98.6 |
| tyre | 140 | 16.00 | 15.10 | 96.8 | 85.0 | 0.19 | - | 96.8 |
| baalbek | 278 | 16.00 | 15.00 | 94.7 | 79.4 | 0.62 | 96.9 | 93.9 |
| nabatieh-bintjbeil | 127 | 15.25 | 14.50 | 93.7 | 69.4 | 6.59 | - | 93.7 |
| beirut | 175 | 15.70 | 15.50 | 87.2 | 58.3 | 1.31 | 95.0 | 83.9 |
| hermel | 225 | 15.95 | 14.90 | 86.0 | 70.3 | 1.32 | 98.9 | 79.6 |

One family, **fajr 15.90-16.05, isha 14.90-15.50, maghrib at the 4.5-degree depression, every other
column at zero margin**, holding across the two years on the three cities that carry both. The
Nabatieh sheet is the exception twice over: its free fajr lands at 15.25, and its sunrise column
carries displaced rows (MAE 15.9, worst 428) on about five per cent of days while its dhuhr stays
clean at 0.23 — the sheet's times are scrambled on those rows, not its dates, and both readings are
recorded rather than repaired. The
print's conventions are measured with it: **imsak sits 9 minutes before fajr on the median over all
3,662 rows**, isha sits **maghrib + 54**, and midnight is the midpoint of the night. Its maghrib at
the 4.5-degree depression and its prefixed imsak are the Shia print conventions, so this is a
distinct Lebanese line and is not blended with the platform's.

**The platform's 16 district tables stay undated, and the reason is now measured, not assumed.**
The regional JSON carries no year; the server's own `Last-Modified` for all four probed tables is
**2026-10-28 18:14Z** in one batch, which dates the *upload*, not the times. The archive settles the
stability half: table 2's file captured on **2026-04-07** and the live file of **2026-11-11** parse
to the identical 366 rows, value for value, so the generation has not been regenerated in seven
months and no dated edition can be distinguished inside that window. Solar geometry cannot
separate one year from the next at one-minute resolution, and no Lebanese table carries an internal
calendar anchor (the Saudi cohort's Ramadan interval extension has no counterpart here). The one
dated Lebanese print now in hand is **not** the platform's source: on 2026-01-01 Beirut, the
platform's table 2 prints fajr 5:07 / sunrise 6:42 / dhuhr 11:41 / asr 14:21 / maghrib 16:45 /
isha 18:07 while the print reads imsak 5:15, fajr 5:24, sunrise 6:43, dhuhr 11:41, asr 14:22,
maghrib 17:00, isha 17:55. Sunrise, dhuhr and asr agree to a minute; every twilight and maghrib
disagree, so these are **two Lebanese lines**, and they are not blended. Table 2's maghrib is
sunset with isha as an angle (its isha-maghrib runs 75-97 minutes across the year, so an interval
model is refuted for it), while the print's maghrib is the 4.5-degree depression with isha at 15
degrees.

**Dar al-Fatwa.** `dar-alfatwa.gov.lb` still has no A record; `daralfatwa.org` resolves to a
parking page reading "Horizon Pharma is under construction", and the archive holds that domain only
for 2011-2014, before the repurposing. No year print from the Dar itself was reachable in this pass
(Arabic, French, English searched). The 244 platform tenants sit on those same 16 undated tables, all
of them `table-api` (no tenant in Lebanon calls a live calculator), so no tenant screen can date
them either.

## 5. Jordan — the ministry's grid is the platform layer, and the archive gave five years of it

`awqaf.gov.jo/ar/Pages/PrayerTime` is live and carries **17 governorate options** (Amman/Balqa/
Zarqa/Madaba, Irbid, Karak, Tafilah, Maan, Aqaba, North Ghors, Jerash and Ajloun, Mafraq, Deiban,
Azraq, Central Ghors, Shobak and Petra, Dalil and Hashimiyah, Ruwaished, and **Jerusalem**), and one
table of **ten days starting at the request date** (11/11/2026 .. 20/11/2026 in this capture) with
six columns in `HH:MM:SS`. The governorate select is an ASP.NET postback, so any governorate other
than the default needs a form post; the page has no date parameter at all. Asr, maghrib and isha
print a bare 12-hour clock and dhuhr does not (the record's trap, handled).

**The identity that matters: tawkit's Jordanian layer IS this grid.** All **ten** live days
(2026-11-11 .. 11-20) match tawkit's Amman page to the minute on all six columns, and the fitted
margins agree - sunrise -5 floor, maghrib +6/+7 floor, asr +1 floor. The 142-city platform layer is
the ministry's own table at one remove, and the per-city differences it carries are the ministry's
own regional margin sets, not a platform invention.

**Wayback was 503 for the first hour and then returned**, and the harvest changes the Jordan
picture. 31 captures of the prayer page exist, 2021-02-26 .. 2026-08-07; 30 returned a table and
every one parsed to ten rows: **300 dated authority rows, 184 distinct days, 2021-01-08 ..
2026-08-16** (`data/jo-awqaf-wayback-rows.json`). The table's own date column is the key; the
snapshot timestamp is only the fetch.

**The fit, one recipe across five years** (`fit/jo-awqaf-fit.json`): fajr **18.1**, isha **18.15**,
sunrise -5 floor, dhuhr 0 ceil, asr +1 floor, maghrib +7 floor, Shafi.

| year | days | within-1 | MAE | worst |
|---|---|---|---|---|
| 2021 | 10 | 96.7 | 0.38 | 2 |
| 2022 | 10 | 100.0 | 0.30 | 1 |
| 2023 | 10 | 93.3 | 0.43 | 2 |
| 2024 | 61 | 98.1 | 0.30 | 2 |
| 2025 | 83 | 97.2 | 0.31 | 2 |
| 2026 | 10 | 100.0 | 0.28 | 1 |

Overall **97.6 pc within 1, exact 71.2, MAE 0.31, worst 2** over 1,104 cells. This is the first
Jordanian authority span longer than one cycle on record, and it crosses the October 2022 clock
regime (Jordan moved to permanent UTC+3) with no parameter move: the print followed the clock, not a
changed method.

**Year-2 for the six briefed cities** is the tawkit layer: twelve months for eight named cities plus
four more (Amman, Irbid, Aqaba, Zarqa, as-Salt, Karak, Madaba, Mafraq, Jerash, Ajlun, at-Tafilah,
Maan), the six briefed cities included, at 91.6-100 pc within 1, and per the identity above that
2027 edition is the ministry's grid too.

## 6. Iraq — the Diwan's endpoint is alive, today-locked and Baghdad-only by its own shape

`dws.gov.iq` is a Vite SPA whose bundle names its API base and its routes. `GET
https://eldwanapp.jeeteak.com/api/prayer-times` returns

```
{"success":true,"message":"Prayer times retrieved successfully.","data":{"date":"2026-11-11",
 "fajr":"05:05","sunrise":"06:29","dhuhr":"11:51","asr":"14:45","maghrib":"17:06","isha":"18:23",
 "is_today":true,"is_closest":false}}
```

and it **ignores every parameter tried** (`?city=1`, `?governorate=1`, `?date=2027-01-01`,
`?year=2027` all return the identical 225-byte body with the same date). The page's own label is
"مواقيت الصلاة الرسمية لليوم" — today's official times. The record's "2026-locked" verdict is
confirmed in a stronger form: **the endpoint has no city axis and no date axis at all**, so no
second year can come from it by any parameter.

**The shrine lines, probed as separate objects and kept separate.**
- `imamali.net` (the Imam Ali shrine, Najaf): the 197 KB home page holds **zero tables** and two
  time strings, its times render client-side, and no "مواقيت" link exists among its `?id=`
  navigation. No dated table.
- `imamhussain.org` (the Imam Hussain shrine, Karbala): 132 KB, **zero tables, zero time strings**;
  its only prayer anchor is a `#prayer` fragment. No dated table.
- `alabbas.io` (the Abbas shrine) does not resolve.

**Najaf and Karbala therefore remain separate objects with no dated Ja'fari table**, and nothing was
merged across the madhab line.

## 7. The Awqaf city-offset rule on new payloads

**Jordan: the rule form holds.** Every Jordanian city in the 2027 layer carries the **same base table
with a per-city margin set** — sunrise -5 floor everywhere, maghrib +6 on ten cities and +7 on Amman
and Karak, dhuhr 0 or +1 — and the fit reproduces at 100 pc once the margin is allowed. Aqaba's
distinct pair (18.0/17.9) and Irbid's (17.9/17.75) are the two regional families, not per-city
geometry, and the base is the ministry's own (see §5).

**Lebanon: no offset structure, and that is a measurement, not an absence.** The seven dated
city prints were compared on every shared date. Beirut against Tripoli differs by **-1 minute** on
sunrise, dhuhr and maghrib; Saida against Tripoli by -1 to -2; Tyre against Saida by -1; Baalbek
against Hermel by -1 to 0. Those are the meridian differences (Beirut 35.50 E to Tripoli 35.85 E is
0.35 deg, 1.4 minutes; Saida to Tripoli 0.47 deg, 1.9 minutes), so the Lebanese print is **one
convention evaluated at each city's own point**, not a base table with published minute offsets. The
Palestine/Jordan rule-form needs a publisher that states an offset; this one states none, and none
was invented.

**Syria: no offset structure either.** The twelve Syrian cities fit at their own points with fajr
18.05-18.70 and margins of 0 or 1 minute, and their isha rides maghrib + 90 exactly.

## 8. Fit rules applied

- One recipe per surface across the FULL span held (twelve continuous months for tawkit, 21 months
  for the Lebanese print), then the per-year breakdown underneath.
- Per-year scores are in `fit/tawkit-year2-fit.json` (`byYear`) and `fit/lb-almanar-valid-fit.json`.
- Seasonal amplitude is in each fit's `amplitude`: Syria fajr 81 / isha 188 minutes, the Lebanese
  print fajr 74-78 / isha 185-188, the Amman authority span fajr 66 / isha 166.
- Engines: adhan 4.4.6 for every surface here; the tawkit tables reproduce on it at the integer
  clock's floor, so the publisher's engine is not separable from adhan at one-minute resolution.
- Never blended: Syria's interval line and the Diwan's pair line; the platform's Lebanese tables
  and the print's; the Sunni layers and the shrine line.

## 9. Defects recorded

1. **Maan, tawkit 2027**: the whole page displaced +40.6 minutes on all six columns relative to
   Maan's geometry, with four AM/PM flips; the 2026 page at the same slug is clean. Excluded.
2. **Karak, tawkit 2027-02-11**: fajr printed 05:01 against 06:01/06:00 on the neighbouring days.
3. **tawkit's forward window is asymmetric**: past-month requests are answered with next year's
   same month and future requests beyond ten months with this year's same month, both silently.
   Any harvest that trusts the URL's year will bank the wrong year; the served title is the gate.
4. **Dar al-Fatwa**: `daralfatwa.org` is a repurposed pharmaceutical parking page; the `.gov.lb`
   domain has no A record.
5. **al-Manar parse**: the Beirut sheets are row-major where the rest are column-major, and OCR
   loses a cell in about a tenth of the rows, which shifts every later row of that column; the noon
   gate catches the shift and drops those rows (Beirut keeps 175 of 586, Tripoli 279 of 610).

## 9a. The Syrian platform tenants, as the brief asked

The pool's 24 Syrian tenants sit on **13 regional tables** (20 tenants) plus **4 AlAdhan tenants**
(877, 1044 and two more), the latter a live calculator rather than a table. None of the 13 carries an
internal calendar anchor: their isha-maghrib interval runs 80-83 minutes in winter and 93-97 in
late May to mid June, which is an angle's seasonal swing, not a fixed interval and not a Ramadan
block like the Saudi cohort's. Those tables are therefore undated on the same evidence as Lebanon's,
and the four AlAdhan tenants are a calculator, never an authority.

## 10. Honest negatives (languages searched)

- **Syria ministry table**: `awqaf.gov.sy` NXDOMAIN; the new `mow.gov.sy` has no prayer page (five
  probes) and its app is store-only with no resolving host. Arabic and English.
- **Syria Ja'fari/second line**: none found. Arabic.
- **Lebanon Dar al-Fatwa year print**: both domains dead as above; no 2027 edition of any Lebanese
  calendar (al-Manar's 2027 paths are 404, probed at 2027-01, 2027-11, 2027-12). Arabic, French,
  English.
- **Lebanon: platform table dating**: no internal anchor and no dated live gate; the archive holds
  one capture of table 2 (2026-04-07) and it is byte-identical to the live file, so it bounds the
  generation's age without naming its year. Arabic, English.
- **Jordan beyond the default governorate**: the Awqaf grid serves one governorate per render and
  needs a postback for the other sixteen, so the archive's 30 snapshots date only the default group
  (Amman/Balqa/Zarqa/Madaba). Irbid, Karak, Aqaba and the rest have no archived authority rows.
  Arabic, English.
- **Iraq second year**: Diwan endpoint today-only, parameter-blind. Arabic, English.
- **Iraq shrine lines**: no dated table on `imamali.net` (client-side times) or `imamhussain.org`
  (zero tables); `alabbas.io` does not resolve. Arabic.
- **Syria ministry archive**: `awqaf.gov.sy` has **zero captures** in the Wayback CDX, so the old
  domain never carried an archived prayer table either. Arabic, English.

## 11. NEXT

- **Lebanon's 16 platform tables**: the archive holds only table 2, and only once; a CDX run on the
  other fifteen ids plus a second capture months apart would settle whether the set is regenerated
  yearly. Until then the 2026-10-28 batch `Last-Modified` and the April-to-November identity are the
  dating evidence.
- **Jordan governorates**: the same Wayback harvest with the postback's governorate argument would
  date the other sixteen; that needs a form post per snapshot and was not attempted here.
- **Syria**: the ministry app's own backend is the only remaining authority route; probing it needs
  the APK's host, and no public web host resolves today.
- **Iraq shrine line**: `imamhussain.org` and `imamali.net` both render their times client-side; the
  next probe is their JSON or app backend, kept as a separate Ja'fari object.
- **Lebanon 2027**: every al-Manar 2027 path is 404 on 2026-11-11; the year-3 check is cheap and
  should ride the next round's watches.
- **al-Manar row recovery**: a per-day re-alignment (matching each column's own solstice turning
  point instead of splitting the stream into fixed columns) would recover the roughly two thirds of
  rows the noon gate now drops.
