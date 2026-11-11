# O1l-67 final sweep — the four capital gaps and the eleven FALLBACK

Workspace `$HOME/athan-gitree/census/o1l-city/final-sweep/`. Read before starting: `BRIEF.md`,
`FIT-RULES.md`, the O1l-57 block (capitals 198/4) and the O1l-53 block (11 FALLBACK remain) in
`CONSOLIDATION.md`. Engine adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`,
`Rounding.None`, TZ pinned per country, dates built from literal capture strings, no clock read.
Public pages only, no login. Nothing outside this workspace was touched.

## Headline

**The eleven FALLBACK countries now hold dated rows.** The athanpro sitemap carries **85 city
pages across all ten of them** (Guyana already lifted), every page a September 2026 month table:
**2,550 dated rows, 85 of 85 pass the solar gate at 2 minutes or less**, and after the two named
page corrections **all 85 fit within 2 minutes on every column**. 64 of the 85 hit 100 pc within 1
on MWL 18/17 Shafi; 80 reach 98.7 pc or better on their own recipe. The eleventh, Guyana, was
closed at capital level by O1l-57.

**Three of the four capital gaps stay open, each with a cause now nailed down.** Palikir has no
surface and no tenant. Ngerulmud's only mosque is on another island (the 23.6 km ruling stands,
unclaimed). Tegucigalpa's mosque had a domain and that domain **never held a page** — Wayback's
only capture is a Squarespace "En construcción" parking page. Tehran stays closed, not claimed.

Nothing here is a completeness claim. Every negative is "not found under these terms".

---

## 1. The athanpro city layer for the eleven

Captured 2026-11-11 06:2x-06:3xZ, HTTP 200 on all 85, `captures/ap-all/`, 13 MB. Every page is
the same static build (`buildId owtQHPa50jqHRVjyU4ilT`), one month table, September 2026, with the
printed weekday agreeing 30/30 on every page, so the year is recovered from the page's own anchors
and not from a clock.

| Country | Cities | Rows | Gate ≤2 | 18/17 perfect | Exceptions named |
|---|---|---|---|---|---|
| South Sudan | 10 | 300 | 10 | 8 | Bor prints on `Europe/Istanbul` (-60 min, corrected arithmetically, then 99.3 pc) |
| Liberia | 10 | 300 | 10 | 6 | Monrovia and Bensonville print a 15/15 pair; Harper 99.3, New Yekepa 98 |
| Turkmenistan | 10 | 300 | 10 | 8 | Balkanabat and Dasoguz 99.3 |
| Nepal | 10 | 300 | 10 | 6 | Birganj's coordinate field is Kathmandu's (defect, see below); three at 99.3 |
| Myanmar | 10 | 300 | 10 | 7 | Bago, Monywa, Myitkyina 98.7-99.3 |
| Papua New Guinea | 10 | 300 | 10 | 9 | Lae 99.3 |
| Solomon Islands | 3 | 90 | 3 | 2 | Gizo 99.3 |
| Vanuatu | 7 | 210 | 7 | 6 | Port Vila prints a 15/15 pair |
| Samoa | 10 | 300 | 10 | 7 | two of the ten are islands, not cities (see below) |
| Kiribati | 5 | 150 | 5 | 5 | all five are South Tarawa villages |
| **Total** | **85** | **2,550** | **85** | **64** | 80 pages at 98.7 pc or better on their own recipe |

### The platform's own convention, measured

Signed residuals (printed minus adhan 4.4.6 at the fitted recipe) pooled over all 2,550 rows:

| Column | exact | median residual | range |
|---|---|---|---|
| fajr | 2,494 / 2,550 | 0 | -1..+1 |
| sunrise | 2,506 / 2,550 | 0 | -1..+1 |
| dhuhr | 21 / 2,550 | **-1** | -2..0 |
| asr (Shafi) | 1,530 / 2,550 | 0 | -2..+2 |
| maghrib | 2,507 / 2,550 | 0 | -1..+1 |
| isha | 2,407 / 2,550 | 0 | -1..+1 |

**dhuhr is truncated, not rounded**: the median residual is -1 minute with only 21 exact days in
2,550, which is floor-of-seconds on solar noon. This is a platform convention and it is the same on
every page, so it is named rather than absorbed by a margin. Nothing here is a temkin: no column
carries a positive offset.

### Two named page defects

**Birganj (Nepal) carries Kathmandu's coordinates.** The page's own `latitude`/`longitude` field is
27.7172 / 85.324, Kathmandu's point, while its table is Birgunj's. Fitted at Birgunj's true
27.0104 / 84.8770 the same table scores **150/150 within 1 on all six columns at 18/17**, against
44.7 pc at the page's printed coordinate. The coordinate field is the defect; the table is sound.
No other page in the 85 duplicates another city's point.

**Bor (South Sudan) renders its table on `Europe/Istanbul`.** The page's zone list is
`Africa/Juba`, `+03:00`, `Europe/Istanbul`; the printed table is 60 minutes late and corrects to a
1-minute gate. Same class as the O1l-57 Kingston/San José/Georgetown defect, same arithmetic
correction (`local = printed + (offset(city) - offset(render))`), never a fitted shift.

### Samoa's list is not a city list

`samoa/upolu` and `samoa/savaii` are **islands**, and `faleula`, `siusega`, `vaiala`,
`fasitoouta`, `malie` and `mulifanua` are villages inside Apia's urban area. The ten entries are
therefore **one capital city plus its villages plus two island labels**, not ten cities. Kiribati's
five are the five South Tarawa villages of one atoll. The row count is real; the city count is not
ten. Recorded so the census does not read 85 as 85 distinct cities.

### Grade

**candidate, platform tier, one published cycle.** These are the platform's computation at each
city's point, not a mosque's or a muftiate's publication: no publisher is behind any of the 85
pages. That is exactly the disposition O1l-53 gave French Polynesia's masjidway month, and the same
owner question applies: **whether a platform calculator at a city's own coordinates lifts a
country out of FALLBACK is an owner ruling, not mine.** On the record's precedent for athanpro
(Kingston JM, O1l-57, platform/provisional) it does. If the ruling is no, the eleven stand as they
were and this wave has banked the dated layer without moving the ledger.

### The live block is build-time data, not today

Every page prints a "Today" block beside a dynamic Hijri/Gregorian label that reads
**Wed 11 Nov 2026, 1 Jumada al-Thani 1448**. The times in that block are **not 11 November's**.
Scanned against all 365 days of 2026 at each page's own coordinates and recipe, **81 of the 85
blocks reproduce within 1 minute on days between 2026-09-27 and 2026-10-03**, and none reproduces
11 November: Juba's block is 2026-09-28..10-03, Monrovia's 2026-09-29..10-01, Yangon's
2026-09-28..30.

So the page is a static build frozen in one seven-day window at the end of September, carrying a
live date label over stale numbers. **R5's live-page gate cannot be passed on these pages**, and
that is the defect, not a mismatch of method: the month table and the stale block come from the
same computation. Four pages fail build-date recovery altogether: Birganj (its block is computed
at Birgunj while the model runs on the Kathmandu field), Bor (its block prints on Istanbul time),
Bensonville (15/15 pair) and Dasoguz. The first two are the named defects below, so the failure
corroborates them rather than standing as an independent fault.

**The build serves one month only.** No month parameter, route suffix or query changes the table:
`/countries/south-sudan/juba/2026-10` and `/october` are 404, `?month=10` returns the same
same September table at 29,601 B, and the sitemap carries no month-suffixed URL. There is
therefore no second cycle to harvest from this platform, which is why the grade is candidate.

Consequence for the grade: the tables rest on the solar gate (85/85 at ≤2 min) and the printed
weekday anchor (30/30 on every page), never on a self-verifying live block.

### Seasonal amplitude and stability

One published cycle, 30 days, September 2026. The in-month fajr span is a **median 14 minutes**
across the 85 pages, **36 minutes at Dasoguz** (40 N) and single digits in Kiribati and Samoa.
Between-year stability is **untestable**: one cycle, no second year, no archive endpoint. That is
the honest limit of this layer, and it is why the grade is candidate and not provisional.

---

## 2. Palikir FSM — honest negative, and the mosque is real

Not found under these terms. This sweep re-ran English (Palikir mosque, Pohnpei mosque, Kolonia
mosque, Islamic Society of Micronesia, Ahmadiyya FSM) plus site-scoped sweeps of mawaqit, masjidal,
masjidbox and masjidway for Micronesia, Pohnpei and Palikir.

- **The athanpro sitemap still carries no Pohnpei page.** Micronesia's whole set is Colonia (Yap),
  Tofol (Kosrae) and Weno (Chuuk). Re-checked this sweep against all 2,928 sitemap URLs.
- **Five candidate domains do not resolve**: `ahmadiyyafsm.org`, `ahmadiyya.fm`, `islamfsm.org`,
  `pohnpeimosque.org`, `fsmislamic.org` (all NXDOMAIN).
- **Tawkit's country list has no Micronesia entry** (76 country pages parsed).
- The mosque is **Pohnpei Mosque, Ahmadiyya Muslim Community, Blue Nile Second Floor, Kolonia,
  Pohnpei 96941**, 7.4 km from Palikir on the same island. Its public presence is Facebook
  `ahmadiyyamuslimfsm` and Instagram `islamahmadiyyafsm`.
- **Facebook is closed to anonymous access.** `mbasic.facebook.com/islamahmadiyyafsm` answers
  "Join Facebook or log in to continue", and the desktop page serves a login form. The login wall
  is recorded as the closing cause, not as absence of a timetable.

Palikir stays a capital gap. No transfer is offered: the nearest dated surface is 2,223 km away.

## 3. Ngerulmud PW — the ruling stands, unclaimed

The country's only mosque is the **Palau Central Jame Masjid, Main St, Koror**, **23.6 km** from
Ngerulmud across water. Both of its surfaces remain defective, re-probed this sweep:

- `palaucentralmosque.com` (captured 2026-11-11) still prints the same theme-demo block under the
  live label "1th Jumada-Al-Thani, 1448 - Wed, 11th Nov, 2026": fajr 07:50, zuhr 14:42, asr 17:52,
  maghrib 20:14, isha 21:44 against true Koror fajr 04:44, dhuhr 11:47, asr 15:05, maghrib 17:47,
  isha 18:54. Three hours late on every column, and no recipe and no single shift reproduces it.
- mawaqit `palau-central-mosque-main-st-koror-96940-palau` is a hand-set board with a mid-year
  regime change (O1l-57's full-year pull), not a table.

**I do not claim Ngerulmud on a 23.6 km transfer to another island.** The parent's ruling is the
only thing that can move it: accept Koror and the capital count is 199/3, refuse it and the count
stands at 198/4. Recorded here for that ruling, unclaimed.

Palau's own five athanpro pages (Airai, Kloulklubed, Koror, Mengellang, Ulimang) are platform
calculators at island points, not mosques. Straight-line from Ngerulmud: **Ulimang 13.4 km,
Airai 17.4 km, Mengellang 22.2 km, Koror 23.8 km** (my own figure; the record's 23.6 is within
0.2 km). The first three sit on Babeldaob with the capital, and none of them is a mosque or a dated
publisher surface. **A shorter transfer is still a transfer, and I make no claim on any of them.**

## 4. Tegucigalpa HN — honest negative, with the domain now settled

Not found under these terms. Spanish and English this sweep: "mezquita Tegucigalpa horario de
oración", "Centro Islámico de Honduras Tegucigalpa", "Comunidad Islámica de Honduras Tegucigalpa
mezquita", "mezquita Tegucigalpa horario salah", "horario de oración Tegucigalpa 2026", plus
`site:` sweeps of masjidbox, masjidal, masjidway and athanplus for Honduras.

- **`mezquitadehonduras.org` existed and never held a page.** The domain resolves through
  Squarespace to a 404 "Website Expired" today; **Wayback holds exactly one capture**
  (`20261016063816`) and that capture is a Squarespace **"Próximamente — En construcción" parking
  page**. There is no timetable anywhere in the domain's history. That closes the "the mosque has
  a site we have not found" line of enquiry with evidence rather than with absence.
- **athanpro carries a Honduras country page and zero city pages** — reconfirmed against all 2,928
  sitemap URLs this sweep (`countries/honduras` appears once, with no city beneath it).
- **mawaqit's only Honduras tenant is San Pedro Sula** (Cortés), the country's other mosque, 180 km
  from the capital: a fresh `site:mawaqit.net Honduras` sweep returned that tenant in ten locales
  and nothing else. masjidal's 216 reachable tenants include none in Honduras, and masjidi.app's
  495 tenants in 33 countries include none (both lists re-read this sweep).
- **Athan+ is an app, not a directory.** `athanplus.org` is Kaltech Digital's product page (2,397 B,
  no mosque list, no country browse), and `mymasjidal.com` is a Shopify storefront. Neither serves
  a tenant a census could walk.
- The capital's body, **Comunidad Islámica de Honduras / Mezquita Islámica Hondureña**, publishes
  on Facebook `islamenhondurasmezquita` only. Anonymous access is refused: the desktop page serves
  the login form and `mbasic` answers "Join Facebook or log in to continue".

Tegucigalpa stays a capital gap, cause: **the mosque has no website and its only public surface is
behind a login wall; no platform tenant exists in the country.**

## 5. Tehran — closed, not claimed

Unchanged from O1l-57 and not re-opened here. The candidate artifact (30 September rows, fajr
17.75, isha unexplained at maghrib+80..84) stays a candidate. **Iran stays closed and nothing in
this sweep lifts it.**

## 6. Masjidway — retried, still flaky, still not closed

Retried this sweep across `www`, `en`, `fr` and `ar` with trailing-slash and bare forms:

| Time (Z) | URL | Result |
|---|---|---|
| 06:3x | all four hosts, four paths | 503, 19 B |
| 06:5x | `en.masjidway.com/masjid/3462/prayer/112026/` | **200, 9,143 B** |
| 06:5x+1min | same URL | **502, 6,418 B** |
| 06:5x | `www` month route | timeout, 0 B after 18 s |
| 06:5x | `sitemap.xml` on `www` and `en` | 404, 244 B |

The single 200 was **not a month table** (the prior window's table was ~40 KB with dated rows;
this was 9 KB and carried no `prayer` rows), so no tenant could be confirmed or refuted from it.
`sitemap.xml` is now a 404 rather than the 503 O1l-53 saw, and there is still **no country browse**.
The O1l-53 verdict stands unchanged: **a flaky backend behind Cloudflare, not a closure.** No
masjidway tenant exists for any of the eleven under these terms.

## 7. Honest negatives for the eleven, with the languages tried

Every line is "not found under these terms". The dated layer now held for each is the athanpro
city table above; what follows is what was searched for a **publisher** and did not exist.

- **South Sudan** — English, Arabic ("جدول أوقات الصلاة جوبا جنوب السودان"). Every Arabic result is
  a calculator (timesprayer, islamicfinder, athantime, muslimpro) plus athanpro's own page. The
  South Sudan Islamic Council's `icsouthsudan.org` does not resolve; its Facebook carries an Eid
  announcement only.
- **Liberia** — English, French. No platform tenant. The T-665 January-class feed was not located
  under any phrasing (O1l-53's negative, not re-run here). Unchanged: candidate, uncensused.
- **Turkmenistan** — Turkmen ("namaz wagtlary", "Aşgabat namaz wagtlary 2026"), Russian, Turkish,
  English. **Fifth independent sweep, same result**: the muftiate publishes images only. New this
  pass: namazvakti's Turkmen-language monthly pages (`WSLanguage=TM`, province ids 18198, 18216)
  are a Diyanet-derived calculator, and every other hit is a calculator or a news page using the
  word "namaz" without a table.
- **Nepal** — Nepali ("काठमाडौं मस्जिद नमाज समय तालिका"), English. New this pass: the Kathmandu
  valley mosques' Eid tables on Facebook (`allnepalmuslim`) and an Instagram Eid reel, both Eid
  only. **The khidmat wrapper is now opened and named**: `khidmat.org.np/prayer-times.php` serves
  an empty table and fills it from `/assets/js/prayertimes.js`, which is
  `jquery-prayer-times` calling `api.aladhan.com/v1/timingsByCity?midnightMode=1&method=4`. Its
  Kathmandu row for 2026-11-11 (fajr 04:59, maghrib 17:14, isha 18:44) is Umm al-Qura, and isha is
  exactly maghrib + 90 minutes, which confirms the method id. A Nepali charity's page therefore
  publishes **a Makkah method at 27.7 N**, not a Nepali table. The one mawaqit tenant
  (Siddharthanagar) stays a frozen 50-tuple board (O1l-53's full-year pull; not re-run here).
- **Myanmar** — Burmese ("ရန်ကုန် ဆွလာသ်အချိန်ဇယား အစ္စလာမ့်စင်တာ"), English. The dated material is
  a private account's **daily** Yangon image post (`lumaw.lumaw.94651`, one day per post, no
  month) and a TikTok account doing the same. `mmislamic.znnt.org/adhan-time-table/` re-fetched
  this sweep: 8,539 B, **four `aladhan` references**, and its own banner still asks the visitor to
  use a VPN. It is a client, not a table.
- **Guyana** — closed at capital level by O1l-57 (athanpro Georgetown 150/150; CIOG live but empty
  across its whole CDX).
- **Papua New Guinea, Solomon Islands, Vanuatu, Samoa, Kiribati** — English, French, Tok Pisin,
  Bislama, Samoan, Gilbertese, plus site-scoped sweeps of all four platforms (fresh this sweep for
  masjidway and masjidbox, which returned nothing for each). No tenant in any of the five. Every
  result is a calculator. Kiribati's Ahmadiyya community posting Jalsa Salana material rather than
  a timetable is O1l-53's finding, not re-run here.

## 8. Counts

- **Dated rows banked: 2,550** across **85 athanpro city pages** in 10 countries, one September 2026
  cycle each, all 85 passing the solar gate at ≤2 minutes, all 85 within 2 minutes on every column
  after the Bor zone correction and the Birganj coordinate correction.
- **Capitals: 198 covered / 4 gap of 202** — unchanged. Palikir, Ngerulmud, Tegucigalpa and Tehran
  remain, each with the cause recorded above. Accepting Koror for Ngerulmud would make it 199/3.
- **FALLBACK: 10 of the 11 now hold a dated platform surface** (Guyana was already lifted at capital
  level by O1l-57) and **0 of the 11 hold a publisher**. Whether a calculator lifts a country is the
  owner's ruling (see the grade note in section 1); the parent can move them to candidate/platform
  or leave them FALLBACK with the dated layer banked.
- **Masjidway**: available intermittently, still no directory, still no tenant for the eleven.

Nothing here is a completeness claim.

## 9. Files

- `captures/ap-all/` — the 85 city pages, 13 MB, the ten capitals among them.
- `captures/hn-*` — the Honduras domain's 404, its Wayback parking-page capture, the athanplus
  product page. `captures/pw-palaucentralmosque.html`, `captures/wiki-islam-in-palau.html`.
- `captures/np-khidmat.html` + `np-prayertimes.js` (the AlAdhan client), `captures/mm-mmislamic.html`,
  `captures/mw-3462-112026.html` and `captures/probe-mw-3462.html` (the Masjidway 502/503 pair).
- `captures/tawkit-countries.html`, `captures/athanpro-sitemap.xml` (2,928 URLs),
  `captures/ap-probe-juba-month10.html`, `captures/cdx-*`.
- `data/` — 85 normalized month files; `data/corrected/` holds Bor's zone-corrected copy, kept
  apart so no glob double-counts the page.
- `fits-athpro.json` (per page: gate, recipe, joint, worst, per-column), `tally.json`,
  `residuals.json`, `build-dates.json`, `parsed-index.json`.
- `tools/` — `athanpro.py` (page parser), `deshift.js` (zone correction + fit), `fixed.js`,
  `atcoord.js`, `fit-all.js`, `sweep.js`, `tally.js`, `residuals.js`, `today.js`,
  `daterecover.js`, `builddate.js`, `parse-all.py`, `get.sh`.
