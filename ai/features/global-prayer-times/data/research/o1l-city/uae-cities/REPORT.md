# O1l-41 UAE: the emirate and mosque layer

Agent O1l-41 (research wave, no children). Workspace
`$HOME/athan-gitree/census/o1l-city/uae-cities/`. Capture window 2026-11-11 05:3x-07:0xZ.
Engine adhan-js 4.4.6 (`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`),
`Rounding.None` then explicit per-column rounding, TZ Asia/Dubai (UTC+4, no DST), dates built
from literal capture strings, no clock reads.

Held: 30,960 distinct federal area-days over 60 areas (2026 full year +
2027-01-01..2027-05-31; 35,880 fit rows counting the overlapping re-captures), 92 Sharjah
portal rows, two mawaqit mosque-years (732 day-entries), four mosque boards read live.

---

## 1. THE AREA ANCHORS ARE RECOVERED (the world table's named defect, closed)

The world table records the UAE object's defect as "the 60 area coordinate anchors are not on
the board (the zone table cannot be built from the object alone)". They are on the board now.

`GET https://mobileappapi.awqaf.gov.ae/APIS/v3/prayer-time/<emirateId>?lang=en`, emirateId 1-7,
returns `cityID`, `cityNameAr/En`, `latitude`, `longitude` for every reference area. Captured
into `captures/federal-areas-emirate{1..7}.json`, consolidated as `data/areas.json`.

| emirate id | emirate | areas |
|---|---|---|
| 1 | Abu Dhabi | 31 |
| 2 | Dubai | 3 (Dubai, Rural Area dubai, Hatta) |
| 3 | Sharjah | 8 |
| 4 | Ajman | 3 |
| 5 | Umm Al Quwain | 1 |
| 6 | Ras Al Khaimah | 7 |
| 7 | Fujairah | 7 |

60 areas total. Coordinates are the publisher's own, four to six decimals. Some anchors are
the publisher's transliterations (`alwaqn alqawe`, `SharjahAbu Musa`, `Ras Alkhaimah Adhan
Asimahg`); they are reproduced verbatim, not corrected. Three anchor pairs are shared
byte-for-byte across emirates (`Sharjah alssahil alsharqiu` = `Fujairah Dibba Al-Bidyah`
25.501111/56.309722; `Ras AlKhaimah Shaam Ghalilah` = `Fujairah habhab` 25.737777/55.885277;
`Ras Alkhaimah Masafi Shawka` = `Fujairah Masafi Seiji` 25.190277/56.0), which is the
federation publishing one table at a border village under two emirate headings.

## 2. Access shape and horizon (re-probed today, unchanged)

`POST .../APIS/v3/sso/StartRequest?lang=en` with `Origin: https://www.awqaf.gov.ae` and `{}`
returns `clientAccessToken` (20-minute JWT). `GET .../prayer-time/prayertimes/<from>/<to>` with
`Authorization: Bearer` answers; 156 days per request. Probed today: the horizon ends
**2027-06-05** (a 2027-06-01..2027-11-10 request returns five days then stops), i.e. a rolling
207-day horizon from the request date. The record's 2027 partial is the horizon, not a refusal.
`2027-06-06` onward is empty.

## 3. Per-emirate fit: one recipe serves all seven

Fit span: 2026-01-01..2026-12-31 plus 2027-01-01..2027-05-31, 60 areas, **35,880 rows**
(`data/FIT-EMIRATES.md`, `scripts/fit.mjs`). Recipe as recorded: fajr 0, sunrise -3 (floor),
dhuhr +2, asr 0, maghrib +2, isha -1, nearest elsewhere, Shafi asr, 18.2/18.2.

| emirate | areas | rows | exact | within1 | MAE |
|---|---|---|---|---|---|
| Abu Dhabi | 31 | 18,538 | 61.8% | 94.0% | 0.454 |
| Dubai | 3 | 1,794 | 55.9% | 93.6% | 0.505 |
| Sharjah | 8 | 4,784 | 64.1% | 95.3% | 0.406 |
| Ajman | 3 | 1,794 | 62.8% | 94.8% | 0.427 |
| Umm Al Quwain | 1 | 598 | 83.2% | **100.0%** | 0.168 |
| Ras Al Khaimah | 7 | 4,186 | 59.0% | 89.7% | 0.655 |
| Fujairah | 7 | 4,186 | 62.8% | 95.0% | 0.423 |

Per-year breakdown, one recipe across both years (`data/FIT-YEAR-SPLIT.md`):

| emirate | 2026 exact / within1 | 2027 exact / within1 | MAE 2026 -> 2027 |
|---|---|---|---|
| Abu Dhabi | 61.0 / 93.9 | 64.4 / 94.1 | 0.463 -> 0.427 |
| Dubai | 54.9 / 93.4 | 58.8 / 94.2 | 0.517 -> 0.470 |
| Sharjah | 63.3 / 95.3 | 66.4 / 95.4 | 0.414 -> 0.382 |
| Ajman | 62.2 / 94.7 | 64.8 / 94.9 | 0.434 -> 0.407 |
| Umm Al Quwain | 82.3 / 100.0 | 86.0 / 100.0 | 0.177 -> 0.140 |
| Ras Al Khaimah | 58.2 / 89.6 | 61.6 / 89.9 | 0.666 -> 0.624 |
| Fujairah | 61.9 / 94.9 | 65.6 / 95.3 | 0.434 -> 0.392 |

**Stability verdict: parameters FROZEN.** Within-1 moves by at most 0.4 points at any emirate
between the years, and the exact column's uniform +2 to +4 point lift is the 2027 window's
season (Jan-May), not a parameter shift. No between-year margin tweak anywhere in the seven.

Per-column margin scan over the 23,760 rows of 2026 (margins -2..+4, `scripts/margin-scan.mjs`):

| column | best margin | exact at best | record's margin | exact at record |
|---|---|---|---|---|
| fajr | +1 | 51.7% | 0 | 31.6% (98.2% within 1) |
| sunrise | -3 | 33.9% | -3 | 33.9% |
| dhuhr | +2 | **98.3%** | +2 | 98.3% |
| asr | 0 | **70.6%** (100% within 1) | 0 | 70.6% |
| maghrib | +2 | 43.2% | +2 | 43.2% |
| isha | -1 | **89.4%** (100% within 1) | -1 | 89.4% |

**Verdict: the record's margin set is CONFIRMED on a fresh full-year 60-area span**, with two
standing caveats. Fajr and maghrib are ridge-degenerate per area: no single margin is the
publisher's (fajr residuals scatter ±1 around +0.4; maghrib residuals run 1.4-5.8 by area), and
the per-area constants are what actually reproduce the feed. Ras Al Khaimah is the weakest
emirate because two of its seven anchors are hostile: Jebel Jais (1,900 m summit, residual
maghrib +5.8 against 18.2 raw) and Tonb Al-Kubra (an island anchor whose row behaves like the
mainland). Excluding those two the emirate sits with the rest.

**Seasonal amplitude (Jan vs Jul fajr, capital area of each emirate):** Abu Dhabi 78 min,
Dubai 82, Sharjah 83, Ajman 83, Umm Al Quwain 83, Fujairah 81, Ras Al Khaimah 84. The seven
emirates span 22.7N-26.3N, so the spread is six minutes across the whole country.

## 4. DUBAI: the asr question, adjudicated by measurement

The claim under test: adhan 4.4.6's `CalculationMethod.Dubai()` bakes asr +3.00 against the
authority's own table. Read from the package verbatim (`CalculationMethod.js:40-50`): the preset
is 18.2/18.2 with `methodAdjustments {sunrise: -3, dhuhr: 3, asr: 3, maghrib: 3}`, isha and fajr
unadjusted.

Measured on Dubai's own three areas (cityID 32 Dubai, 59 Rural Dubai, 60 Hatta), 1,794 rows,
2026 full year + 2027 to 05-31:

| recipe | exact | within1 | MAE |
|---|---|---|---|
| record (0, -3, +2, 0, +2, -1) | 55.9% | 93.6% | 0.505 |
| adhan 4.4.6 Dubai preset (0, -3, +3, +3, +3, 0) | 28.8% | 81.2% | 1.029 |

| prayer | preset bias (min) | preset exact | preset worst | record bias | record exact |
|---|---|---|---|---|---|
| fajr | +0.33 | 33.2% | 2 | +0.33 | 33.2% |
| sunrise | -0.26 | 55.8% | -1 | -0.26 | 55.8% |
| dhuhr | **-0.88** | 12.2% | -2 | +0.12 | 87.4% |
| asr | **-2.77** | **0.0%** | -4 | +0.23 | 72.1% |
| maghrib | +0.20 | 52.6% | 1 | +1.20 | 13.7% |
| isha | **-0.89** | 19.2% | -2 | +0.11 | 73.0% |

Asr residual histogram (authority minus preset): **-3 on 1,294 of 1,794 rows (72.1%)**, -2 on
455, -4 on 45. Dhuhr: -1 on 1,568 of 1,794.

**Finding: the baked asr +3.00 is REFUTED against Dubai's own authority.** The authority's asr
margin is 0: the record's asr 0 scores 72.1% exact and 100% within 1, while the preset scores
0.0% exact at every one of 1,794 rows and never once lands inside a minute. The preset runs
2.77 minutes late on asr, 0.88 late on dhuhr and 0.89 late on isha. The record's asr verdict
stands; the package preset contradicts the authority it is named after. This is a consumer
defect, not a census defect, and it is now measured rather than asserted.

Dubai's own board was read live to close the loop: Al Farooq Omar Bin Al Khattab Mosque and
Centre (`alfarooqcentre.com/en/`, 2026-11-11) prints 05:13 / 06:29 / 12:06 / **15:12** / 17:36 /
18:52, byte-identical to the federal Dubai area row for the same date. So the asr 15:12 is what
Dubai prints, and the preset would print 15:15.

## 5. Per-emirate surfaces

**Dubai.** Two surfaces. (a) IACAD (`www.iacad.gov.ae/ar/prayer-times`,
`eservices.iacad.gov.ae/prayer-time`) is the emirate's own authority and is **Cloudflare-blocked
at the IP layer**: curl 403 with `cf-ray ...-MAN`, agent-browser "Sorry, you have been blocked",
both hosts, today and on the record's earlier attempt. TinyFish's egress reaches the page but
the times are injected by a client script and do not survive extraction, so no artifact with
numbers could be saved from it. Recorded as an honest negative with cause, not as absent.
(b) The mosque layer carries the same numbers: Al Farooq (above) and, at platform tier, mawaqit.

**Abu Dhabi.** Sheikh Zayed Grand Mosque Centre, `www.szgmc.gov.ae/en/worshippers/prayer-timingss`
and the home page, both captured 2026-11-11: 05:16 / 06:32 / 12:09 / 03:15 / 05:40 / 06:56,
**byte-identical to the federal Abu Dhabi area row** (cityID 1) for the same date. The Grand
Mosque prints the federal table. Its page publishes no iqamah column.
`adawqaf.gov.ae` (the Endowments and Minors' Funds Authority) is endowments only, no timetable.

**Sharjah.** `ds.sharjah.ae` (Digital Sharjah, the Islamic Affairs Department service) serves a
month endpoint `.../islamicaffairsdeptServices/get-month/1/1?month=MM/YYYY`, keyed by a
`dstoken` header the page mints itself. Captured Oct, Nov, Dec 2026: **92 dated rows**, and
**92 of 92 identical to the federal Sharjah city row** (areaID 33). The window is current month
±1: every other month returns an empty `prayerTimes` array, and 2027 returns empty, so the
portal's ceiling is 2026-12-31. Sharjah's own surface is a republication, one computed
generation, and does not lift the federal object's grade.
`sia.gov.ae` (the Department's own site) publishes no timetable.

**Ajman, Umm Al Quwain, Ras Al Khaimah, Fujairah.** No web surface exists. Searched in Arabic
and English, then probed candidate hosts directly: `awqafajman.ae`, `awqaf.ajman.ae`,
`awqafrak.ae`, `awqaf.fujairah.ae`, `awqafshj.gov.ae` all NXDOMAIN (curl 000). The
`rak.ae` authority page and the `ajman.ae` / `fujairah.ae` portals return service directories
with no prayer-time service. Their authorities publish daily times through Instagram and X,
which are login-walled and off-limits. **Their emirate-level surface is therefore the federal
feed's own area rows** (Ajman 3, UAQ 1, RAK 7, Fujairah 7), which are held dated and fitted in
section 3. Platform tables for these cities exist (`salatcalendar.com` city 82/94,
`qebla.com/umm-al-quwain.html`) but both declare themselves AlAdhan-API derivatives and both
render their tables client-side; a derivative is not a witness, so neither is counted.

## 6. Mosque layer (R3 two-layer rule)

| mosque | emirate | surface | adhan layer | iqamah layer |
|---|---|---|---|---|
| Al Farooq Omar Bin Al Khattab | Dubai | own site, today-row | = federal Dubai row | none published |
| Sheikh Zayed Grand Mosque | Abu Dhabi | szgmc.gov.ae, today-row | = federal Abu Dhabi row | none published |
| مسجد غمران راشد بوقراعة (Ghumran Rashid Bugarah) | Dubai | mawaqit, full year | own computation (below) | +10/+10/+10/+5/+10 |
| مسجد سهيل محمد درويش المزروعي (Sweihan) | Abu Dhabi | mawaqit, full year | = federal Al Ain row today | +25/+20/+20/+8/+20 |
| Masjid Al-Tawasal | Abu Dhabi | masjidbox, today-row | **fails the solar gate** | +25/+15/+15/+5/+15 |

**The Dubai mawaqit mosque runs a different line from the authority.** Angle scan over its 366
day-entries (`scripts/scan-mawaqit-dubai.mjs`): fajr **18.5** (RMS 0.105 min; 18.2 gives 1.528),
isha = **maghrib + 90 minutes exactly** (100% within 1 at 90, 0% at 89 and 91), sunrise raw
(bias +0.50, no -3), maghrib raw (bias -0.00), dhuhr transit (bias -0.01), asr Shafi (bias
+0.02, 75.4% within 1). That is the Gulf interval pair, not the federal 18.2/18.2: on the
federal recipe this mosque scores 3.1% exact and its isha sits +9.36 minutes late on average,
worst +15. Platform engine recorded as the mosque's own PrayTimes-family configuration; the fit
is the mosque's, never the emirate's.

**The Sweihan mawaqit mosque reproduces the federal Al Ain row exactly today** (05:10 / 06:25 /
12:04 / 15:11 / 17:36 / 18:51) although its own profile coordinates (24.3185, 55.6638) sit about
60 km from the Al Ain anchor, so its configuration is Al Ain's table rather than its own point.
Against the record recipe over its 366 day-entries: 32.0% exact, 84.9% within 1, maghrib +1.38
mean, worst 5.

**The masjidbox Abu Dhabi tenant is defective** and is recorded as such: it prints Fajr 5:34,
Chourouq **7:00** against a real sunrise of 6:32, Dohr a fixed **13:00**, Asr **15:55** against
a Shafi asr of 15:15, Maghrib 17:33 against a sunset of 17:36, Isha a fixed 19:00. It fails the
solar gate on four columns and its dhuhr/asr/isha are clock conventions, not astronomy. Not a
witness for Abu Dhabi; a genuine mosque-layer record of what that mosque prints.

**Jumeirah Mosque (Dubai)**: `jumeirahmosque.ae` publishes visiting hours and tours only, no
timetable. Honest negative for the named target. Masjidal has **no UAE tenant** (three query
shapes plus the widget sweep found none) and masjidbox yielded the one defective Abu Dhabi
profile.

## 7. What CONFIRMS the record

- The federal recipe, on a fresh full-year 60-area span: dhuhr +2 (98.3% exact), asr 0 (100%
  within 1), isha -1 (100% within 1), sunrise -3 floor. Margins unchanged from the C19 fit.
- The 207-day rolling horizon: 2027 reachable to 2027-06-05 and no further, re-probed today.
- The 18.2/18.2 ridge-degenerate pair: fajr and maghrib remain per-area quantities, not policy.
- The asr school (Shafi) and the fixed UTC+4 clock.

## 8. What is NEW

- The 60 area coordinate anchors, with emirate ids, captured and on the board (closes the
  object's named defect).
- The emirate split of the fit: all seven emirates on one recipe, within-1 89.7-100%.
- The Dubai asr measurement: the adhan Dubai preset is 2.77 minutes late, 0.0% exact on 1,794
  authority rows; asr margin 0 confirmed.
- Two emirate institutions (SZGMC Abu Dhabi, Sharjah's Digital Sharjah portal) proven to be
  byte-identical republications of the federal rows, one computed generation each.
- A Dubai mosque on the Gulf interval line (18.5 / maghrib+90), 15 minutes off the authority in
  isha at the extreme.
- A defective masjidbox Abu Dhabi tenant, documented column by column.

## 9. Honest negatives

- IACAD (Dubai) closed by Cloudflare IP block on both hosts; no artifact with numbers saved.
- No Ajman, UAQ, RAK or Fujairah authority web surface exists under the names searched
  (`awqaf*` domains NXDOMAIN; government portals carry no prayer service).
- Jumeirah Mosque publishes no timetable.
- Masjidal has no UAE tenant; masjidbox one, defective.
- `adawqaf.gov.ae` is endowments only; `sia.gov.ae` has no timetable; `salatcalendar.com` and
  `qebla.com` are AlAdhan derivatives, not witnesses.
- Instagram and X carry the northern emirates' daily tables and are login-walled; not read.
