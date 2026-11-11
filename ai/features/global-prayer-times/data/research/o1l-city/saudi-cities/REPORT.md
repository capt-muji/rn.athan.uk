# O1l-40 Saudi governorate sweep: the one recipe across 43 governorate-level points

Workspace: `$HOME/athan-gitree/census/o1l-city/saudi-cities/`. Captures taken 2026-11-11.

## 1. The surface, and what the city list actually is

`umqserv.kacst.gov.sa/api/v1/Prayer/GetPrayerHijriYear`, keyless GET, one per city-Hijri-year,
`lat`/`lon`/`zone=3`. Authority, unchanged from the held record.

**The city list is 13 entries, and it is not addressable by id or name.** `GetTodayPrayersForCities`
returns the whole published list in one payload: Mecca, Medina, Riyadh, Buraydah, Dammam, Abha,
Tabuk, Hail, Arar, Jazan, Najran, Al Bahah, Sakaka. That is the thirteen provincial capitals, and
nothing below them. Four parameter shapes on the year endpoint (`city=Yanbu`, `cityId=2`, `id=2`,
`name=Najran`) all return one byte-identical payload (md5 `cfdb0995...`, fajr 03:33), which is the
endpoint's default point. The service is coordinate-only. The mission's "per-city by id/name" does
not hold on this surface. The per-city path is the coordinate.

**The 13 named rows are the coordinate evaluation at anchors recoverable to two decimals.** Wayback's
own index of this API carries the anchors for nine of them. The remaining four were solved from the
published row and reproduce it exactly. All 13 rows of the live list match a same-day `GetPrayers`
call at those anchors, cell for cell, six columns. Anchors: Makkah 21.426666/39.831666, Medina
24.54/39.63, Riyadh 24.67/46.69, Buraydah 26.33/43.97, Dammam 26.44/50.1, Abha 18.22/42.51, Tabuk
28.38/36.57, Hail 27.52/41.72, Arar 30.99/41.02, Jazan 16.89/42.54, Najran 17.52/44.2, Al Bahah
20.01/41.47, Sakaka 29.97/40.2.

**Two endpoints, one table.** For 2026-11-11 the day endpoint (`GetPrayers`) and the Hijri-year
endpoint agree on all six columns at all 43 points (`data/day-vs-year.tsv`, 43 AGREE, 0 DIFF).

**API note for the next agent.** The month endpoint takes `yh` and `mh`, not `hm`. `mh=9` serves
Ramadan's 29 rows. A wrong parameter name returns 400, an unknown endpoint 302 to
`/errors/gerr.htm`.

## 2. Method

Recipe held fixed, nothing re-derived. Fajr 18.5 deg. Isha = maghrib + 120 on the API's own Ramadan
days (hijri month 9) and + 90 otherwise. Shafi asr, `MiddleOfTheNight`, single formulation
`floor(raw + 1)` per prayer except sunrise at `floor(raw)`. Engine adhan-js 4.4.6, `Rounding.None`,
TZ `Asia/Riyadh`, dates built from the capture strings, no clock reads.

Hijri 1448 (2026-06-16..2027-06-05, 355 rows) and 1449 (2027-06-06..2028-05-24, 354 rows) at every
point: 709 rows each, 30,487 city-days, 182,922 prayer cells.

**Anchors.** Five of the 43 are in the published 13, and take the publisher's own anchor (Arar,
Jazan, Najran, Al Bahah, Sakaka). The other 38 take a city point. That distinction is load-bearing
and is stated again in section 9.

## 3. One recipe, 43 governorate-level points

Span 16.60N (Samtah) to 31.67N (Turaif), 34.93E (Haql) to 50.21E (Al Khobar).

| city | governorate | lat | lon | anchor | rows | exact % | within-1 % | MAE | free fajr | fajr amp |
|---|---|---|---|---|---|---|---|---|---|---|
| samtah | Jazan | 16.60 | 42.95 | city | 709 | 87.6 | 100 | 0.124 | 18.50 | 71 |
| farasan | Jazan | 16.70 | 42.1167 | city | 709 | 87.5 | 100 | 0.125 | 18.46 | 72 |
| jizan | Jazan | 16.89 | 42.54 | publisher | 709 | 87.2 | 100 | 0.128 | 18.48 | 72 |
| abu-arish | Jazan | 16.9667 | 42.8333 | city | 709 | 86.7 | 100 | 0.133 | 18.46 | 73 |
| sabya | Jazan | 17.15 | 42.6333 | city | 709 | 87.4 | 100 | 0.126 | 18.50 | 74 |
| sharurah | Najran | 17.4833 | 47.1167 | city | 709 | 87.7 | 100 | 0.123 | 18.48 | 75 |
| najran | Najran | 17.52 | 44.2 | publisher | 709 | 86.8 | 100 | 0.132 | 18.48 | 75 |
| khamis-mushait | Asir | 18.30 | 42.7333 | city | 709 | 86.8 | 100 | 0.132 | 18.48 | 78 |
| al-namas | Asir | 19.15 | 42.2833 | city | 709 | 86.4 | 100 | 0.136 | 18.46 | 82 |
| baljurashi | Al Bahah | 19.8667 | 41.5667 | city | 709 | 86.3 | 100 | 0.137 | 18.50 | 85 |
| bishah | Asir | 19.9844 | 42.60 | city | 709 | 86.6 | 100 | 0.134 | 18.46 | 85 |
| al-baha | Al Bahah | 20.01 | 41.47 | publisher | 709 | 86.3 | 100 | 0.137 | 18.46 | 85 |
| al-lith | Makkah | 20.15 | 40.2833 | city | 709 | 86.1 | 100 | 0.139 | 18.46 | 85 |
| wadi-ad-dawasir | Ar Riyad | 20.4667 | 44.80 | city | 709 | 87.1 | 100 | 0.129 | 18.50 | 86 |
| al-sulayyil | Ar Riyad | 20.4667 | 45.5833 | city | 709 | 86.9 | 100 | 0.131 | 18.48 | 87 |
| turbah | Makkah | 21.2167 | 41.6333 | city | 709 | 86.6 | 100 | 0.134 | 18.46 | 90 |
| ranyah | Makkah | 21.25 | 42.85 | city | 709 | 86.9 | 100 | 0.131 | 18.46 | 90 |
| al-khurma | Makkah | 22.0833 | 42.0333 | city | 709 | 87.4 | 100 | 0.126 | 18.50 | 93 |
| al-aflaj | Ar Riyad | 22.2833 | 46.7333 | city | 709 | 85.9 | 100 | 0.141 | 18.48 | 95 |
| mahd-adh-dhahab | Al Madinah | 23.50 | 40.85 | city | 709 | 85.9 | 100 | 0.141 | 18.48 | 100 |
| yanbu | Al Madinah | 24.0895 | 38.0618 | city | 709 | 85.2 | 100 | 0.148 | 18.46 | 102 |
| al-kharj | Ar Riyad | 24.1483 | 47.305 | city | 709 | 85.4 | 100 | 0.146 | 18.46 | 103 |
| dawadmi | Ar Riyad | 24.50 | 44.3833 | city | 709 | 85.0 | 100 | 0.150 | 18.44 | 104 |
| umluj | Tabuk | 25.05 | 37.2667 | city | 709 | 84.7 | 100 | 0.153 | 18.48 | 107 |
| hofuf | Ash Sharqiyah (Al Ahsa) | 25.3647 | 49.5872 | city | 709 | 85.4 | 99.9 | 0.147 | 18.46 | 108 |
| al-rass | Al Qassim | 25.8667 | 43.50 | city | 709 | 84.6 | 100 | 0.155 | 18.48 | 111 |
| al-majmaah | Ar Riyad | 25.90 | 45.3667 | city | 709 | 85.6 | 99.9 | 0.144 | 18.48 | 110 |
| unaizah | Al Qassim | 26.084 | 43.9936 | city | 709 | 84.8 | 100 | 0.153 | 18.46 | 111 |
| al-wajh | Tabuk | 26.2456 | 36.4667 | city | 709 | 84.5 | 100 | 0.156 | 18.46 | 112 |
| al-khobar | Ash Sharqiyah | 26.2794 | 50.2083 | city | 709 | 84.3 | 100 | 0.157 | 18.44 | 112 |
| al-zulfi | Ar Riyad | 26.2833 | 44.80 | city | 709 | 84.5 | 100 | 0.155 | 18.46 | 112 |
| al-qatif | Ash Sharqiyah | 26.5196 | 50.0115 | city | 709 | 84.2 | 99.9 | 0.159 | 18.48 | 113 |
| al-ula | Al Madinah | 26.6085 | 37.9236 | city | 709 | 85.1 | 99.9 | 0.150 | 18.46 | 114 |
| jubail | Ash Sharqiyah | 27.0046 | 49.646 | city | 709 | 83.9 | 100 | 0.161 | 18.46 | 115 |
| duba | Tabuk | 27.35 | 35.70 | city | 709 | 84.1 | 99.9 | 0.160 | 18.48 | 118 |
| tayma | Tabuk | 27.6333 | 38.55 | city | 709 | 84.1 | 99.9 | 0.159 | 18.46 | 119 |
| hafar-al-batin | Ash Sharqiyah | 28.4328 | 45.9708 | city | 709 | 83.5 | 100 | 0.165 | 18.46 | 123 |
| haql | Tabuk | 29.2833 | 34.9333 | city | 709 | 83.3 | 100 | 0.167 | 18.46 | 127 |
| rafha | Al Hudud ash Shamaliyah | 29.6267 | 43.5014 | city | 709 | 84.3 | 100 | 0.157 | 18.48 | 129 |
| sakaka | Al Jawf | 29.97 | 40.20 | publisher | 709 | 83.6 | 99.8 | 0.166 | 18.48 | 131 |
| arar | Al Hudud ash Shamaliyah | 30.99 | 41.02 | publisher | 709 | 82.8 | 99.9 | 0.173 | 18.46 | 137 |
| al-qurayyat | Al Jawf | 31.3319 | 37.3428 | city | 709 | 82.8 | 99.9 | 0.173 | 18.48 | 139 |
| turaif | Al Hudud ash Shamaliyah | 31.6725 | 38.6636 | city | 709 | 81.9 | 99.9 | 0.182 | 18.48 | 141 |

**Verdict.** One recipe serves all 43. Exact 81.9 to 87.7 pc, within-1 99.8 to 100 pc, MAE 0.123 to
0.182. No city needs its own margin and none needs its own angle: the free per-city fajr fit lands
18.44 to 18.50 against the fixed 18.5, a 0.06 deg band, which is the same band the ten-city wave
measured (18.44 to 18.50). The worst point is Turaif at 31.67N and the best is Sharurah at 17.48N.
The ordering is latitude, not governorate.

The distribution is tight and monotone in latitude: MAE rises from 0.12-0.14 in the south to
0.17-0.18 north of 30N, and exactness falls with it. Nothing in the middle of the country departs
from the line.

## 4. Between-year stability

Per city, exactness moves at most 2.0 points between 1448 and 1449 (largest: Yanbu 84.2 to 86.2 and
Umluj 83.7 to 85.7, then Ranyah 85.9 to 87.8 and Farasan 86.6 to 88.4), and MAE moves at most 0.020.
No parameter is re-fitted between years and none needs to be. Parameters frozen across both Hijri
years at all 43 points.

## 5. Seasonal amplitude, and the latitude framing

Fajr peak-to-trough runs 71 min at Samtah (16.60N) to 141 min at Turaif (31.67N), monotone in
latitude with no exception in the sample: 71-75 min across Jazan and Najran, 85 min at Al Bahah and
Bishah, 102-104 at Yanbu and Dawadmi, 112-115 at Al Khobar, Unaizah and Jubail, 127-131 at Haql and
Sakaka, 137-141 at Arar, Al Qurayyat and Turaif. Isha amplitude runs 0 to 2 min WIDER than fajr's south of
19N and 0 to 8 min NARROWER north of 23N, once Ramadan's 30-min step is excluded from the isha
column: the ten-city wave's "2 to 5 min wider" is a southern reading of a latitude-dependent
relation, not a rule.

## 6. The Ramadan interval, month-exact at every point

Across 43 cities and two Hijri years, exactly two interval values appear and no others: 90 on 651
days and 120 on 58 days, at every single city. Ramadan contributes 29 days in 1448 (2027-02-08 to
2027-03-08) and 29 in 1449 (2028-01-28 to 2028-02-25). Every Ramadan day carries 120, every
non-Ramadan day carries 90, at all 43 points: **zero violations, month-exact on the API's own Hijri
boundaries, 86 city-years.**

The 30-minute step is the only discontinuity in the isha column. Nothing else in Ramadan changes:
the fajr and asr movement that looks like a rule is seasonal composition, as the held record states.

## 7. The century, at both latitude extremes

The held century proof (1318H to 1500H) rests on Makkah alone. The same recipe was run at the two
ends of this sample's latitude span, Turaif at 31.67N and Farasan at 16.70N, at 1318H (1900-04-30),
1400H (1979-11-21) and 1500H (2076-11-28):

| city | 1318H | 1400H | 1500H |
|---|---|---|---|
| Turaif | 85.3 pc exact, 100 within-1, MAE 0.147 | 82.3, 99.9, 0.178 | 81.4, 99.9, 0.187 |
| Farasan | 89.2 pc exact, 100 within-1, MAE 0.108 | 88.7, 100, 0.113 | 87.8, 100, 0.122 |

Intervals across the three Hijri years at both points: exactly 90 and 120, 89 Ramadan days, zero
violations, month-exact. The ceiling is the same at a governorate point: `yh=1501` at Turaif returns
400 naming the 1318 to 1500 range.

Exactness eases down toward 1500H at both points (Turaif 85.3 to 81.4, Farasan 89.2 to 87.8, MAE
rising 0.04 and 0.01) while within-1 stays at 99.9 to 100. That is a small forward softening inside
the tolerance, not a regime change: no parameter moves, and nothing crosses the one-minute gate.

## 8. The residual class: 58 cells, one phenomenon

58 cells of 182,922 (0.032 pc) sit 2 minutes out, all with the same sign (-2), on 12 dates:
2026-09-15 (12 cells), 2026-09-16 (7), 2026-10-15 (1), 2027-03-11 (1), 2027-04-09 (3), 2027-04-10
(3), 2027-09-03 (6), 2027-09-04 (2), 2027-10-03 (15), 2028-02-27 (1), 2028-03-27 (3), 2028-03-28
(4). By column: sunrise 15, asr 11, maghrib 16, isha 16 (isha inherits maghrib), **fajr 0, dhuhr 0**.

The signature, measured on every case: the published minute holds across a day boundary while the
solar time declines about 1.0 to 1.3 min, so that day prints 2 minutes late, and the following day
carries the catch-up. Arar maghrib 2026-09-13..17 prints 18:25, 18:24, 18:24, 18:22, 18:20 against
raw 18:24.40, 18:23.12, 18:21.83, 18:20.55, 18:19.25: a held minute, then a 2-minute drop. The same
dates recur across cities at different latitudes, so the trigger is the solar rate and not the
place. This is the publisher's own quantisation plateau, the class the ten-city wave recorded as its
edge days. The wider sample finds twelve such dates rather than six, and shows the plateaus never
touch fajr or dhuhr.

## 9. Coordinate sensitivity, the digit noise floor

Five cities were captured twice, at the publisher's two-decimal anchor and at a city point 0.002 to
0.068 deg away (Najran is the widest at 0.068 deg in longitude). The printed digits move by at most
1 minute on any column, and exactness moves by at most 0.5 points (Najran 86.8 to 86.9, Arar 82.8 to
82.4, Sakaka 83.6 to 83.7, Jizan 87.2 to 87.1, Al Bahah 86.3 to 86.2). A 0.07 deg error in longitude
is worth about 0.3 min of mean bias, which costs roughly 19 points of exactness while leaving
within-1 at 100. Coordinate precision is therefore the whole risk in this layer, and the recipe is
not.

## 10. What this confirms, what is new, and the limit that matters

**Confirms.** The one-recipe verdict extends from ten cities to 43 governorate-level points across
the kingdom's full latitude and longitude span, at both held Hijri years. Fajr 18.5 with a 0.06 deg
free-fit band, `floor(raw + 1)`, sunrise `floor(raw)`, isha by interval, Shafi asr: no city departs.

**New.** 43 governorates banked at 709 rows each (30,487 city-days, 182,922 cells), of which 38 are
new points and 5 are the publisher's own named rows for Arar, Jazan, Najran, Al Bahah and Sakaka.
With the held ten this puts 53 Saudi city points and 37,577 city-days on the surface. The city list
is now enumerated: 13 provincial capitals, coordinate-only, no id or name axis. Twelve
quantisation-plateau dates rather than six. The Ramadan switch is proved month-exact over 86
city-years rather than 20. The century holds at both latitude extremes of the sample, so the
no-regime-change finding is no longer Makkah-only, and the 1318 to 1500 ceiling is measured at a
governorate point.

**The limit, stated plainly.** Beyond the 13 named cities, umqserv publishes no per-governorate
table. A governorate row here is the publisher's own engine evaluated at that city's coordinate, so
the fit proves the rule is uniform across the kingdom rather than that 43 separate tables were
published and independently agreed. For the five named cities the anchor is the publisher's own. For
the other 38 the anchor is a city point, and the fit can validate the rule at that point but cannot
validate the place name. Section 8 quantifies what that costs. This distinction should travel with
any use of these rows.

## 11. Honest negatives

- **No second independent publisher for governorates.** Searched Arabic and English. `islam.gov.sa`
  and `gph.gov.sa` time out from here, `my.gov.sa` returns 403 to a plain GET, `awqaf.gov.sa` serves
  a page with no prayer markers, and `ummulqura.org.sa` is a calendar SPA whose bundles carry no
  prayer service (recaptcha only). The KACST service remains the only governorate-level surface
  found.
- **No id or name axis on the API.** Four parameter shapes tested, all ignored, all byte-identical.
- **No per-governorate table inside the presidency's own output.** The held record's defective
  homepage iqamah widget remains the only other presidency surface, and it is already recorded as
  wrong at fajr, maghrib and isha.

Nothing here is complete. The negative is "not found under these terms".

## 12. Files

- `captures/` 102 `sa-*.json` captures (43 cities x 2 Hijri years, 5 duplicate anchors, 6 century
  probes) and 21 probe files (the 13-city list in two languages, the parameter sweeps, the site and
  host probes, the Wayback CDX index, the 1501 ceiling), 27 MB.
- `data/cities.json` the 43 anchors and the recipe. `data/sa-gov-fit.json` the full fit (per city:
  per-year scores, per-column scores, free angle, intervals, per-month interval sets, amplitude,
  outliers). `data/sa-gov-bias.json` signed-error histograms. `data/sa-century-probe.json` the
  1318H/1400H/1500H run at Turaif and Farasan. `data/najran-point-search.json` the anchor grid.
  `data/sa-<city>-rows.json` 43 normalized row files, 709 dated rows each. `data/day-vs-year.tsv`
  the cross-endpoint check.
- `scripts/` `harvest-gov.sh`, `harvest-gov2.sh`, `fit-gov.js`, `bias-gov.js`, `najran-point.js`,
  `century-probe.js`, `emit-rows.js`, `day-vs-year.sh`. Re-runnable with
  `TZ=Asia/Riyadh node scripts/fit-gov.js`.
