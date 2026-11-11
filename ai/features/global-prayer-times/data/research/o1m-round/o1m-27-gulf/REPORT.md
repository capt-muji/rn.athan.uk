# o1m-27 Gulf completion

Workspace: `$HOME/athan-gitree/census/o1m/o1m-27-gulf/`. Wave o1m-27, round o1m.
Engine: adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`,
`CalculationParameters('Other', fajr, isha)`, `Madhab.Shafi`, `HighLatitudeRule.MiddleOfTheNight`,
`Rounding.None`, every timezone pinned per country, every date taken from a literal capture string.
No clock read into data. No subagent spawned. The repository was not touched.

Captures: `captures/` (Qatar ministry day files, Saudi lattice, masjidbox Bahrain windows,
Oman MARA pages, Kuwait Wayback). Dated rows: `data/`. Fits: `fit/`.

## Assumptions

- The Qatar ministry gateway's `?date=DD-MM-YYYY` parameter is read as a dated request because the
  response body carries a different `gregorianDate` object per value; the record's "ignores date
  params" note is refuted by that body, not by the URL.
- The Saudi endpoint is coordinate-only (O1l-40), so a lattice over a region is read as a
  uniformity test of the rule at coordinates and never as a city claim.
- The Oman MARA `calendar_page4.asp` row order is read as the CityID order because row 1 (Muscat)
  and row 2 (Ibra) reproduce CityID `00` and `01` of the held 2026 year to the minute.
- Gazetteer coordinates from a public Nominatim lookup are read as locality centroids, not as the
  publisher's own anchor.

## 1. Saudi residual regions — 116 new points, one recipe, zero Ramadan violations

`scripts/harvest-sa-grid.sh` walked 116 lattice points inside the five thinnest regions at Hijri
1449 and 1450: **82,128 city-days, 492,768 prayer cells**, 232 captures of 354 rows each, zero
failures. Fit: `scripts/fit-sa-grid.js`, the held one recipe unchanged (fajr 18.5 deg, isha =
maghrib + 90, + 120 on the API's own Ramadan days, Shafi, MiddleOfTheNight, floor(raw)+1 with
sunrise at floor(raw), zone 3).

| region | points | city-days | within-1 min | exact range | cells > 1 min |
|---|---|---|---|---|---|
| Al Bahah | 20 | 14,160 | 100.0 | 85.4-87.6 | 0 |
| Jazan | 20 | 14,160 | 100.0 | 86.7-88.2 | 0 |
| Najran | 20 | 14,160 | 100.0 | 86.6-88.0 | 0 |
| Najran (Sharurah basin) | 16 | 11,328 | 100.0 | 86.9-87.7 | 0 |
| Al Jawf | 20 | 14,160 | 99.7 | 82.4-84.0 | 102 |
| Northern Borders | 20 | 14,160 | 99.8 | 81.7-84.1 | 92 |

**Span verdict.** Within-1 99.7-100.0 pc, exact 81.7-88.2 pc, MAE 0.118-0.185, worst cell 2 min.
85 of 116 points are wholly within 1 minute; all 116 sit at or above 99.5 pc. Fajr seasonal
amplitude runs 71 min to 142 min, monotone with latitude. **Ramadan is exactly two interval values
across all 116 points and both years: 90 minutes on 650 days and 120 on 58 per point, zero
violations** in 232 point-years.

**The latitude edge is now measured, not assumed.** All 194 cells that miss by more than a minute
sit in the two northernmost regions, and 192 of them are exactly −2 minutes (the model runs
2 minutes early). By column: isha 59, maghrib 59, sunrise 46, asr 28, fajr 2. They occupy
**126 point-days on 15 distinct dates out of 708** across 40 points, and 33 of the 40 have isha
affected — a publisher-side edge concentrated on a handful of days, not a drifting geometry, and
in one direction only. By Hijri month: Ramadan 82, Shawwal 48, Rabi' I 35. Al Jawf's exactness
(82.4-84.0) sits below Al Bahah's (85.4-87.6) for the same reason. The grid now stands at
**225 points and 159,300 city-days** across 13 regions (109 points and 77,172 city-days held
before this wave), one recipe, no deviating point.

## 2. Qatar — the ministry's own gateway takes a date, and four years reproduce on one recipe

The record held Qatar on platform layers because `islam.gov.qa` renders client-side and
`prayers.qa` carries no dated table. The site is an Angular build whose `assets/appsettings.json`
names its gateway:

```
ServiceGatewayBrokerAPIURL = https://meiaservicesext.islam.gov.qa/ServicesBrokerGatewayAPI/api/
```

and its prayer component calls `PrayerTimes?date=DD-MM-YYYY`. **The date parameter works**: each
value returns its own `gregorianDate` and its own six times, so one dated row costs one request.
`scripts/qa-walk.py` walked **2024, 2025, 2026 and 2027 in full: 1,461 rows, zero gaps**. One
day's raw JSON is 1.4 KB, so the archive cost is trivial.

Sample (2026-07-15, Doha): fajr 03:24, sunrise 04:53, dhuhr 11:40, asr 15:04, maghrib 18:29,
isha 19:59.

**Isha is exactly maghrib + 90 on every one of the 1,461 rows, zero violations.** The fit
(`scripts/fit-qa.js`, `fit/qa-fit.json`):

| | 2024 | 2025 | 2026 | 2027 | all four |
|---|---|---|---|---|---|
| rows | 366 | 365 | 365 | 365 | 1,461 |
| exact | 66.6 pc | 75.1 pc | 84.9 pc | 87.9 pc | 78.6 pc |
| within-1 | 100.0 pc | 100.0 pc | 100.0 pc | 99.8 pc | 100.0 pc |
| MAE | 0.334 | 0.249 | 0.151 | 0.123 | 0.214 |
| worst cell | 1 | 1 | 1 | 2 | 2 |

One recipe, all four years, parameters frozen between them: **fajr 18.42 deg at floor(raw)+1;
sunrise floor(raw); dhuhr floor(raw); asr floor(raw); maghrib floor(raw)+2; isha = maghrib + 90**.
Eight thousand seven hundred and sixty-six cells yield **4 outliers, all on two February 2027 days
where the printed maghrib and isha sit 2 minutes late**.

The dhuhr column pins the meridian at 51.41 E and the latitude scan lands at **25.24-25.26 N,
against the Ministry of Interior's own published "Latitude 25:15, Longitude 51:36"** — the
authority's coordinate, recovered from its own times.

**Exactness climbs monotonically with the year — 66.6, 75.1, 84.9, 87.9 pc — while the fitted
parameters do not move.** Two readings fit: the authority tightened its rounding at some point in
the span, or a parameter is drifting by less than the 0.01-degree search resolution. The record
should carry the trend as an open question rather than a verdict; a 2022 and 2023 walk would date
it.

The maghrib margin of +2 minutes is the one non-obvious ingredient; without it the column loses
about 20 points of exactness. It is an ihtiyat on sunset, not a geometry change, and it propagates
into isha through the +90 rule.

Grade: **A** — four distinct fitted years on one recipe, parameters frozen, and 4 edge cells in
8,766. The record's platform line already carried isha = maghrib + 90 on 515 rows and scored its
tawkit Doha fit at 86.9 pc; the authority's own gateway now reproduces at 100 pc within 1.

## 3. Bahrain — the authority states its own method, and the method is two anchors

The General Directorate of Sunni Endowments publishes no table on a public page. What it does
publish is the method, in Arabic, on `sunniwaqf.com` ("مواقيت الصلاة"): the times are set by the
**Al Zubarah and Bahrain almanac** (روزنامة الزبارة والبحرين), adopted in 1783. A press conference
report by Al Ayam (2021-08-05, issue 11807) records the Supreme Council for Islamic Affairs'
own members describing the regime that starts **9 August 2021 (1 Muharram 1443)**:

1. **Two calculation sites in one country.** The easternmost tip of Dilmunia island supplies
   **fajr and sunrise**; the westernmost point of Salman city supplies **dhuhr, asr, maghrib and
   isha**. The two calendars differ by one to two minutes.
2. **Isha is no longer maghrib + 90.** The fixed 90-minute interval was abolished; isha follows
   astronomical twilight. The **minimum maghrib-to-isha span is 74 minutes, on 21 March and
   22 September**.
3. **Dhuhr is the sun's meridian transit**, no offset.
4. Islamic months follow the 1998 Jeddah criterion at Makkah's coordinates.

That is a dated regime change and a falsifiable floor, both new to the record.

**The floor is testable and the platform surface fails it by 1-2 minutes.** Masjidbox's Manama
tenant (`masjid-adnan-abdulmalik`, BH) serves a dated year; `scripts/harvest-mbx.py` walked
2025 and 2026 (673 distinct city-days, 2025-01-01..2027-01-06). Its maghrib-to-isha span runs
72 to 86 minutes, and at the two equinox days it prints **73 minutes on 2026-03-21 and 72 on
2025-09-22** — one and two minutes below the council's stated 74-minute minimum.

Fit of that surface (`fit/fit-bh-adnan-2025-2026-rows.json`): **fajr 17.99 deg, isha 17.01 deg,
floor(raw) with dhuhr at floor(raw)+1, every other column zero pad — exact 97.6 pc, within-1
100.0 pc, worst cell 1 minute, 4,038 cells, two distinct years, identical parameters in both.**
The pair reads as a stated 18/17 and is a platform convention: it is **not** the Zubarah line, and
the 17.01 isha is what produces the equinox shortfall.

Honest negative: **no dated authority table for Bahrain was found on a public page.** `awqaf.gov.bh`
does not resolve; `moj.gov.bh/en/prayer-times` returns the site's not-found page and
`moj.gov.bh/ar/prayer-times` returns the home page shell; `bahrain.bh` serves the prayer page from
an IBM WebSphere portlet that renders empty without the portal's AJAX chain; the sunniwaqf page
carries text and app-store links only (0 tables, 0 time strings in 311 KB, re-verified this pass,
also rendered through a real browser). Wayback has no capture of any of them. Searched in Arabic
and English.

## 4. Kuwait — the ministry publishes no prayer page, and the calendar it adopts is the one held

`awqaf.gov.kw` was read in Arabic through a real browser and its whole link graph enumerated: it
carries news, services, publications, the mosque charter and the mosques app — **no prayer-times
page, no dated table, no governorate selector**. The commercial gateway refused curl at the TLS
layer (`Recv failure: Connection reset by peer`) and answered normally to the browser, which is
recorded as a transport defect, not a block.

The line the ministry does adopt is named publicly by `awgatalsalat.com`: the times are "taken
directly from the Ministry of Awqaf and Islamic Affairs' calendar according to the astronomical
almanac of Dr Saleh Al-Ojeiri". Its row for 2026-11-11 is **identical in all six columns to the
held `alojeiri.com` row** (fajr 04:47, sunrise 06:08, dhuhr 11:32, asr 14:34, maghrib 16:55, isha
18:15). So the held 2026 year is the ministry's adopted calendar, published by the almanac's
own house, and the "one row for Kuwait City and its suburbs" wording on both pages is the
governorate answer restated: **there is no governorate axis because the ministry's calendar has
one row.**

**New defect recorded.** `alojeiri.com/en/ojeiri-calendar?date=2025-06-15` **relabels the date and
serves today's times**: the page printed "Sunday 15 Jun 2025" above the 2026-11-11 values
(04:47, 06:08, 11:32, 14:34, 16:55, 18:15). The `date` parameter is decoration. This is why the
prior wave's probe read the surface as year-locked.

Second year: **not served by the publisher, and the archive closed on us.** The Wayback CDX
lists 21 snapshots of the calendar (2023-10 to 2026-05), each of which would have carried one
dated day. The archive answered one of them — **2025-11-13: fajr 04:48, isha 18:14** — and
refused the other twenty with its own block page ("flagged it as suspected abusive bot traffic
that is degrading the performance of the Wayback Machine", raw responses kept). That is a
second-year data point, not a second year.

## 5. Oman — the 86 CityIDs now have their names

The record's Oman layer was 86 rows keyed `00`-`85` with 60 of them carrying no city attribution
because the CityID space had no published name list. `calendar_page4.asp` — "عرض مناطق الصلاة
لجميع مناطق السلطنة", one of the four pages the ministry's own calendar menu links — prints all
86 prayer areas for a chosen year, month and day, **in Arabic, with the full six-column day row**.

**The row order is the CityID order, verified to the minute:** row 1 (مسقط) reproduces CityID `00`
for 2026-01-01 (fajr 05:29, sunrise 06:49, dhuhr 12:15) and row 2 (ابراء) reproduces CityID `01`
(05:26, 06:46, 12:14). `data/om-area-names.json` carries the 86 names in order; `captures/om-page4/`
holds the raw pages, and the GET form `?year=&month=&day=` is confirmed to select the day.

The 86 areas run from Muscat, Ibra, Adam, Izki, Al Ashkharah, Al Buraimi, Al Jazir, Al Jummah,
Al Hashman, Al Halaniyat, Al Hamra, Al Khaburah, Al Khadrafi, Al Khuwair, Al Duqm, Al Rustaq,
Al Awabi, Qabil ash-Sharqiyah, Qabil adh-Dhahirah, Al Kamil wal Wafi, Al Mudhaibi, Al Ma'murah,
Al Huwaysah, Al Wasit, Al Wasil, Bukha, Bidbid, Bidiya, Barka, Bahla, Thumrait, Jiddat al
Harasis, Ja'alan Bani Bu Hasan, Ja'alan Bani Bu Ali, Habrut, Hijj, Khadra, Dibba al-Bay'ah,
Ra's al-Hadd, Ra's Madrakah, Rakhyut, Rimal al-Wahibah, Raysut, Sadah, Samail, Samad ash-Sha'n,
Sinaw, Suwayq, Sayh al-Rawl, Siq, Shalim, Shinas, Sohar, Saham, Sarab, Sarfait, Salalah, Sur,
Dhank, Taqah, Dhalkut, Ibri, Fuhud, Qarn al-Alam, Quriyat, Kanhat, Liwa, Mahdah, Mahawt, Madha,
Mirbat, Marmul, Marramul, Musandam, Musana'ah, Masirah, Maqshan, Manah, Nakhal, Nizwa, Namr,
Harweel, Hayma, Wadi Bani Khalid, Wadi Hibbi, Yanqul.

77 of the 86 were geocoded against a public gazetteer (Nominatim, Arabic query, one request per
second, raw responses in `captures/om-nominatim/`). **9 returned no locality**: Al Hamra,
Al Khadrafi, Qabil adh-Dhahirah, Jiddat al Harasis, Rimal al-Wahibah, Dhalkut, Kanhat, Marramul,
Musana'ah. Several of the 77 matched a business or a street rather than the settlement (Qabil
ash-Sharqiyah returned a filling station, Al Huwaysah a street in Bawshar, Al Ma'murah a caravan
site), and those are carried as doubtful.

**What the fit measured, and what it did not.** The printed table carries a constant per-column
margin: Muscat for 2026-01-01 sits at 18/18 with residuals **+2 fajr, +2 sunrise, +6 dhuhr,
+6 asr, +6 maghrib, +2 isha**, which is the recorded "margins 2-5" seen as a margin set. Fitting
each area with a free angle pair and a per-column median margin (`scripts/fit-om.js`,
`fit/om-areas-fit.json`): **median within-1 94.1 pc, 36 of 77 at or above 95 pc, 17 at or above
99 pc, 2 wholly within 1**.

Sixteen of those seventeen converge on one shape: **dhuhr, asr and maghrib all at floor(raw) + 5,
sunrise + 0, fajr + 0 to + 1, isha + 0 to + 2, with angles in a 17.6-18.6 fajr band and a
17.2-18.5 isha band.** The exceptions are points that are plainly misplaced (Habrut, Taqah,
Raysut — three villages whose displaced coordinates move every column at once).

**The rule is not yet separated from the point.** Scoring one national recipe
(18.0/18.0 with 1,0,5,5,5,1) at every area's gazetteer point gives a median of only **22.1 pc
within 1, and just 24 of 77 areas at or above 99 pc** (`fit/om-national-recipe.json`); the best
alternative padding reaches 25.2 pc. A Nominatim wilayat centroid routinely sits 10-40 km from
the settlement the ministry computes at, and 40 km of longitude is minutes of clock. So the
per-area fit above is a joint fit of point and rule and cannot be quoted as a rule confirmation,
while the national-recipe pass measures the centroid error rather than the rule.

**The 60 previously unattributed villages are now named but are not yet closed.** Their fit
stands where o1m-6 left it (54.7-67.3 pc on points recovered from their own sun columns). What
the name list buys is that the next pass can go straight to a known settlement instead of
fitting a nameless key.

## 6. Negatives and defects

| item | verdict | evidence |
|---|---|---|
| Bahrain authority table | not found on a public page | `awqaf.gov.bh` NXDOMAIN; moj.gov.bh both locales serve shells; bahrain.bh portlet renders empty; sunniwaqf 311 KB with 0 tables; no Wayback capture. Arabic + English |
| Bahrain stated fajr angle | still absent | the council states dhuhr +1 and the isha twilight basis, never a fajr depression |
| Kuwait ministry prayer page | does not exist | full Arabic link graph of `awqaf.gov.kw` enumerated in a real browser |
| Kuwait second year | not served | `?date=` relabels only; Wayback refused this host mid-pass |
| Oman published coordinate list | not found | MARA's four calendar pages carry names and times, never coordinates |
| alayam.com (Bahrain method report) | Cloudflare 403 to curl, read through a real browser | recorded, not solved |
| `alojeiri.com` `?date=` | **defect: relabels the date, serves today's times** | 2025-06-15 label above 2026-11-11 values |
| `awqaf.gov.kw` TLS | connection reset to curl, normal in a browser | transport, not a block |
| Qatar municipal axis | closed negative | `lat`, `lon`, `city`, `cityId`, `id`, `lang` all return the Doha payload byte for byte |
| Wayback | refused this host during the pass | "flagged it as suspected abusive bot traffic" |

## 7. Counted state

| object | surfaces | dated rows | years | fit |
|---|---|---|---|---|
| Saudi residual lattice | 116 points | 82,128 | 1449, 1450 | one recipe, 99.7-100 pc within 1, 0 Ramadan violations |
| Qatar ministry gateway | 1 endpoint, day-parameterised | 1,461 | 2024-2027 | fajr 18.42 / maghrib+90, 100 pc within 1, 4 edge cells |
| Bahrain masjidbox Manama | 1 tenant | 673 | 2025, 2026 | 17.99/17.01, 100 pc within 1 |
| Oman MARA areas | 86 named | 28,105 fitted | 2026 | median 94.1 pc within 1 at gazetteer points |
| Kuwait | ministry calendar via mirror | 365 held + 1 dated 2025 row | 2026 | holds at 99.8 pc within 1 |

Archive: **1,823 captures, 66 MB** in this workspace — 57 MB the Saudi lattice (232 files of
354 rows each), 5.7 MB the Qatar day files, the rest the Bahrain, Oman and Kuwait layers.

## 8. NEXT

1. **Qatar back to 2022-2023** — the gateway answers any valid date (`?date=29-02-2024` returns a
   2024 leap day while `29-02-2023` and `29-02-2025` fall back to today's date, so an absent year
   is detectable in one probe). Two more years date the exactness trend above, which is the one
   open question on an otherwise settled object.
2. **Qatar city layer** — closed negative on the ministry gateway: `lat`, `lon`, `city`,
   `cityId`, `id` and `lang` are all ignored and every request returns Doha's payload
   byte for byte, so the eight municipalities have no ministry surface. The search moves to the
   mosques app and to platform tenants per municipality.
3. **Bahrain** — the Zubarah 74-minute equinox floor is now a falsifiable predicate. Any dated
   Bahraini surface can be graded against it in one pass; the Islamiyat app's payload is the
   obvious remaining authority target (the app is published by the eGovernment Authority).
4. **Oman** — resolve the 9 unnamed points from Omani administrative gazetteers, then refit; the
   recovered-point method needs the dhuhr margin fixed first, since longitude and margin are the
   same degree of freedom.
5. **Kuwait** — a second year needs a surface other than the almanac's own site; the ministry's
   mosques app is the only remaining candidate and it is app-only.
6. **Saudi** — the −2 minute edge at 30-32 N is systematic. Test whether the far-north drift is a
   rounding plateau (the rule's floor against a 0.5-minute boundary) or a real angle difference, by
   fitting the Al Jawf and Northern Borders points with a free fajr angle at 0.01-degree steps.
