# O1h gap-fill: the zone-table targets the main grid could not place

Every number below is emitted by `grid.mjs` from `results.json`. 11 of the 21 targets that
`countries.json` left without coordinates are scored here, 2026, fajr and isha, against all 21 methods.
The other 10 are skipped, each with the reason the record gives.

## 1. The filled points

| target | place | lat, lon | basis | days fajr / isha |
| --- | --- | --- | --- | --- |
| MY-JAKIM | Kuala Lumpur and Putrajaya (JAKIM zone WLY01) | 3.139, 101.6869 | recorded | 365 / 365 |
| EU-DIYANET-UNIFIED | Frankfurt am Main (DITIB Germany installation point) | 50.1109, 8.6821 | brief-assigned | 365 / 365 |
| JAMIAT-KZN | Durban (Jamiatul Ulama KZN federation town point) | 29.8587, 31.0218 | brief-assigned | 365 / 365 |
| NO-RABITA | Oslo | 59.9139, 10.7522 | documented-city | 255 / 263 |
| NO-MAWAQEET | Oslo | 59.9139, 10.7522 | documented-city | 243 / 263 |
| EE-EIC | Tallinn | 59.437, 24.7536 | documented-city | 365 / 365 |
| SE-MOSQUE | Goteborg (Angered) | 57.7089, 11.9746 | documented-city | 257 / 269 |
| FI-PORTAL | Helsinki | 60.1699, 24.9384 | documented-city | 242 / 248 |
| BR-IIB | Sao Paulo | -23.5505, -46.6333 | documented-city | 365 / 365 |
| KE-JAMIA | Nairobi | -1.2864, 36.8172 | documented-city | 365 / 0 |
| FJ-FML | Suva (FML national table base) | -18.1416, 178.4419 | documented-city | 365 / 365 |

`recorded` means the record carries the coordinates. `documented-city` means the record names the
fitted place and not its coordinates, so the city centre is adopted, the same way `countries.json`
already treats TR-DIYANET-DOMESTIC (Istanbul) and KZ-MUFTIYAT (Astana). `brief-assigned` means the
shared brief fixes the point by name. Each entry in `fitpoints.json` carries the record sentence.

Days fajr / isha below 365 are days on which the target recipe itself produces no instant. Most are
the polar summer, where the surface's angle never occurs and the record documents no extreme-season
rule; KE-JAMIA's isha column is zero because that body publishes no isha at all. The day is excluded,
never invented, and the count travels with the cell.

## 2. The recipes scored

| target | fajr | isha | margins fajr/isha | rounding | high latitude |
| --- | --- | --- | --- | --- | --- |
| MY-JAKIM | 18 deg | 18 deg | 2 / 2 | up / up | none (unreachable days excluded) |
| EU-DIYANET-UNIFIED | 18 deg | 16 deg | 0 / 0 | nearest / nearest | 45th parallel substituted 42 d fajr, 0 d isha; 80-min plateau 42 d |
| JAMIAT-KZN | 18 deg | 15 deg | 0 / 0 | nearest / down | none (unreachable days excluded) |
| NO-RABITA | 16 deg | 15 deg | 0 / 0 | nearest / nearest | none (unreachable days excluded) |
| NO-MAWAQEET | 18 deg | 15 deg | 0 / 0 | nearest / nearest | none (unreachable days excluded) |
| EE-EIC | 15 deg | 15 deg | 0 / 0 | nearest / nearest | eic clamp/fallback: fajr held 100 d in sunrise-120..-45, isha maghrib+90 100 d |
| SE-MOSQUE | 18.1 deg | 16.2 deg | 0 / 0 | nearest / nearest | none (unreachable days excluded) |
| FI-PORTAL | 18 deg | 17 deg | 0 / 0 | nearest / nearest | none (unreachable days excluded) |
| BR-IIB | 18 deg | 17 deg | 0 / 0 | nearest / nearest | none (unreachable days excluded) |
| KE-JAMIA | 18.2 deg | notPublished | 0 / 0 | nearest / nearest | none (unreachable days excluded) |
| FJ-FML | 18 deg | 17 deg | 0 / 0 | nearest / nearest | none (unreachable days excluded) |

Every recipe is the policy layer verbatim. The only two rules that had no library carrier were written
from their own recorded parameters, and section 5 prices the interpretation they needed.

## 3. Every method against the filled targets

Mean of the per-target mean absolute deviations, in minutes, across the filled targets that carry
that prayer. `within 2` counts the targets on which both prayers sit inside 2 minutes, so it runs out
of 10 because KE-JAMIA publishes no isha. The means mix 365-day cells with the 242 to 269 day cells
of the Nordic surfaces, whose excluded days are the same window for every method.

| rank | method | fajr mean | isha mean | combined | within 2 | asr school matched |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | diyanet-eu | 9.13 | 10.68 | 9.91 | 1/10 | 7/11 |
| 2 | mwl | 9.13 | 13.54 | 11.34 | 3/10 | 7/11 |
| 3 | diyanet-tr | 9.13 | 13.54 | 11.34 | 3/10 | 7/11 |
| 4 | ecfr | 9.13 | 13.54 | 11.34 | 3/10 | 7/11 |
| 5 | kuwait | 9.13 | 16.97 | 13.05 | 0/10 | 7/11 |
| 6 | russia | 15.60 | 10.86 | 13.23 | 1/10 | 7/11 |
| 7 | tehran | 10.09 | 17.59 | 13.84 | 0/10 | 7/11 |
| 8 | isna2010 | 9.13 | 20.40 | 14.77 | 0/10 | 7/11 |
| 9 | karachi | 9.13 | 20.40 | 14.77 | 0/10 | 0/11 |
| 10 | jakim | 9.13 | 20.40 | 14.77 | 0/10 | 7/11 |
| 11 | isna15 | 20.73 | 10.86 | 15.79 | 0/10 | 7/11 |
| 12 | dubai | 10.28 | 21.71 | 15.99 | 0/10 | 7/11 |
| 13 | egyptian | 19.76 | 16.97 | 18.36 | 0/10 | 7/11 |
| 14 | qatar | 9.13 | 29.74 | 19.44 | 0/10 | 7/11 |
| 15 | fazilet-a | 21.94 | 19.03 | 20.49 | 0/10 | 7/11 |
| 16 | ummalqura | 12.49 | 29.64 | 21.06 | 0/10 | 7/11 |
| 17 | singapore | 22.87 | 20.78 | 21.83 | 0/10 | 7/11 |
| 18 | mabims | 23.37 | 20.40 | 21.88 | 0/10 | 7/11 |
| 19 | kemenag | 23.37 | 20.40 | 21.88 | 0/10 | 7/11 |
| 20 | moonsighting | 23.92 | 29.04 | 26.48 | 0/10 | 7/11 |
| 21 | fazilet-b | 29.03 | 25.14 | 27.09 | 0/10 | 7/11 |

Kemenag duplicates MABIMS by construction: the two bodies publish the same 20/18 pair, so the row
repeats rather than measures anything new.

A few means land on .99 or .01 where the true value is a whole minute. That residue comes from the
library's own nearest-minute rounding, which leaves a fraction of a second on the instant, and the
main grid carries it identically.

## 4. Per target

### MY-JAKIM (Kuala Lumpur and Putrajaya (JAKIM zone WLY01))

Malaysia. Grade provisional, Asia/Kuala_Lumpur. Scored on all 365 days.

| method | fajr mean | fajr worst | fajr within 2 | isha mean | isha worst | isha within 2 |
| --- | --- | --- | --- | --- | --- | --- |
| isna2010 | 2.47 | 3.00 | 53% | 2.48 | 3.00 | 52% |
| karachi | 2.47 | 3.00 | 53% | 2.48 | 3.00 | 52% |
| jakim | 2.47 | 3.00 | 53% | 2.48 | 3.00 | 52% |
| dubai | 3.29 | 4.00 | 0% | 1.67 | 2.00 | 100% |
| moonsighting | 2.47 | 3.00 | 53% | 2.50 | 3.00 | 49% |
| isna15 (worst) | 10.15 | 11.00 | 0% | 15.08 | 16.00 | 0% |

### EU-DIYANET-UNIFIED (Frankfurt am Main (DITIB Germany installation point))

Diyanet European unified scheme (DITIB Germany, IFiS Sweden, unified European calendars). Grade F, Europe/Berlin. Scored on all 365 days.

| method | fajr mean | fajr worst | fajr within 2 | isha mean | isha worst | isha within 2 |
| --- | --- | --- | --- | --- | --- | --- |
| diyanet-eu | 12.01 | 116.99 | 88% | 11.47 | 112.00 | 88% |
| qatar | 12.01 | 116.99 | 88% | 17.59 | 73.00 | 0% |
| tehran | 14.40 | 112.99 | 60% | 20.39 | 62.00 | 0% |
| mwl | 12.01 | 116.99 | 88% | 23.26 | 153.00 | 0% |
| diyanet-tr | 12.01 | 116.99 | 88% | 23.26 | 153.00 | 0% |
| fazilet-b (worst) | 34.77 | 116.99 | 0% | 38.90 | 159.01 | 0% |

### JAMIAT-KZN (Durban (Jamiatul Ulama KZN federation town point))

Southern Africa federation (South Africa, Zambia, Malawi, Botswana, Tanzania, Eswatini, Lesotho, Zimbabwe, Mozambique, plus outriders). Grade community, Africa/Johannesburg. Scored on all 365 days.

| method | fajr mean | fajr worst | fajr within 2 | isha mean | isha worst | isha within 2 |
| --- | --- | --- | --- | --- | --- | --- |
| diyanet-eu | 0.00 | 0.00 | 100% | 5.53 | 7.00 | 0% |
| tehran | 1.53 | 2.00 | 100% | 4.50 | 6.00 | 0% |
| moonsighting | 0.00 | 0.00 | 100% | 8.75 | 16.00 | 32% |
| mwl | 0.00 | 0.00 | 100% | 10.60 | 13.00 | 0% |
| diyanet-tr | 0.00 | 0.00 | 100% | 10.60 | 13.00 | 0% |
| fazilet-b (worst) | 14.33 | 18.00 | 0% | 19.24 | 24.00 | 0% |

### NO-RABITA (Oslo)

Norway. Grade candidate, Europe/Oslo. Scored on 255 fajr and 263 isha days.

| method | fajr mean | fajr worst | fajr within 2 | isha mean | isha worst | isha within 2 |
| --- | --- | --- | --- | --- | --- | --- |
| russia | 0.00 | 0.00 | 100% | 0.07 | 19.00 | 99% |
| isna15 | 10.04 | 36.00 | 0% | 0.07 | 19.00 | 99% |
| tehran | 18.38 | 78.00 | 0% | 10.32 | 73.00 | 0% |
| diyanet-eu | 21.52 | 86.00 | 0% | 11.15 | 70.01 | 0% |
| mwl | 21.52 | 86.00 | 0% | 21.68 | 91.01 | 0% |
| fazilet-b (worst) | 49.83 | 131.99 | 0% | 39.00 | 120.01 | 0% |

### NO-MAWAQEET (Oslo)

Norway. Grade candidate, Europe/Oslo. Scored on 243 fajr and 263 isha days.

| method | fajr mean | fajr worst | fajr within 2 | isha mean | isha worst | isha within 2 |
| --- | --- | --- | --- | --- | --- | --- |
| diyanet-eu | 0.00 | 0.00 | 100% | 11.15 | 70.01 | 0% |
| tehran | 3.06 | 15.00 | 41% | 10.32 | 73.00 | 0% |
| russia | 19.56 | 61.00 | 0% | 0.07 | 19.00 | 99% |
| mwl | 0.00 | 0.00 | 100% | 21.68 | 91.01 | 0% |
| diyanet-tr | 0.00 | 0.00 | 100% | 21.68 | 91.01 | 0% |
| moonsighting (worst) | 57.40 | 162.00 | 0% | 46.51 | 192.00 | 0% |

### EE-EIC (Tallinn)

Estonia. Grade candidate, Europe/Tallinn. Scored on all 365 days.

| method | fajr mean | fajr worst | fajr within 2 | isha mean | isha worst | isha within 2 |
| --- | --- | --- | --- | --- | --- | --- |
| isna15 | 39.73 | 197.00 | 72% | 27.40 | 152.00 | 72% |
| moonsighting | 26.44 | 143.00 | 6% | 42.08 | 160.00 | 0% |
| russia | 47.57 | 197.00 | 0% | 27.40 | 152.00 | 72% |
| qatar | 62.64 | 197.00 | 0% | 27.96 | 137.00 | 27% |
| ummalqura | 66.29 | 197.00 | 0% | 26.56 | 137.00 | 27% |
| fazilet-b (worst) | 82.59 | 197.00 | 0% | 55.23 | 152.00 | 0% |

### SE-MOSQUE (Goteborg (Angered))

Sweden. Grade candidate, Europe/Stockholm. Scored on 257 fajr and 269 isha days.

| method | fajr mean | fajr worst | fajr within 2 | isha mean | isha worst | isha within 2 |
| --- | --- | --- | --- | --- | --- | --- |
| diyanet-eu | 1.04 | 8.00 | 96% | 1.94 | 17.00 | 86% |
| mwl | 1.04 | 8.00 | 96% | 8.45 | 62.00 | 0% |
| diyanet-tr | 1.04 | 8.00 | 96% | 8.45 | 62.00 | 0% |
| ecfr | 1.04 | 8.00 | 96% | 8.45 | 62.00 | 0% |
| kuwait | 1.04 | 8.00 | 96% | 13.45 | 69.00 | 0% |
| moonsighting (worst) | 50.48 | 169.00 | 0% | 48.21 | 172.00 | 0% |

### FI-PORTAL (Helsinki)

Finland. Grade candidate, Europe/Helsinki. Scored on 242 fajr and 248 isha days.

| method | fajr mean | fajr worst | fajr within 2 | isha mean | isha worst | isha within 2 |
| --- | --- | --- | --- | --- | --- | --- |
| mwl | 0.00 | 0.00 | 100% | 0.17 | 42.99 | 99% |
| diyanet-tr | 0.00 | 0.00 | 100% | 0.17 | 42.99 | 99% |
| ecfr | 0.00 | 0.00 | 100% | 0.17 | 42.99 | 99% |
| kuwait | 0.00 | 0.00 | 100% | 5.58 | 51.00 | 0% |
| diyanet-eu | 0.00 | 0.00 | 100% | 10.42 | 95.00 | 0% |
| moonsighting (worst) | 58.77 | 176.00 | 0% | 63.17 | 231.00 | 0% |

### BR-IIB (Sao Paulo)

Brazil. Grade provisional, America/Sao_Paulo. Scored on all 365 days.

| method | fajr mean | fajr worst | fajr within 2 | isha mean | isha worst | isha within 2 |
| --- | --- | --- | --- | --- | --- | --- |
| mwl | 0.00 | 0.00 | 100% | 0.00 | 0.00 | 100% |
| diyanet-tr | 0.00 | 0.00 | 100% | 0.00 | 0.00 | 100% |
| ecfr | 0.00 | 0.00 | 100% | 0.00 | 0.00 | 100% |
| kuwait | 0.00 | 0.00 | 100% | 2.37 | 3.00 | 63% |
| moonsighting | 0.00 | 0.00 | 100% | 4.28 | 6.00 | 10% |
| isna15 (worst) | 14.03 | 17.00 | 0% | 9.32 | 11.00 | 0% |

### KE-JAMIA (Nairobi)

Kenya. Grade provisional, Africa/Nairobi. Scored on all 365 days.

| method | fajr mean | fajr worst | fajr within 2 | isha mean | isha worst | isha within 2 |
| --- | --- | --- | --- | --- | --- | --- |
| dubai | 0.00 | 0.00 | 100% | n/a | n/a | n/a |
| mwl | 0.81 | 1.00 | 100% | n/a | n/a | n/a |
| isna2010 | 0.81 | 1.00 | 100% | n/a | n/a | n/a |
| karachi | 0.81 | 1.00 | 100% | n/a | n/a | n/a |
| moonsighting | 0.81 | 1.00 | 100% | n/a | n/a | n/a |
| isna15 (worst) | 13.38 | 15.00 | 0% | n/a | n/a | n/a |

### FJ-FML (Suva (FML national table base))

Fiji. Grade community, Pacific/Fiji. Scored on all 365 days.

| method | fajr mean | fajr worst | fajr within 2 | isha mean | isha worst | isha within 2 |
| --- | --- | --- | --- | --- | --- | --- |
| mwl | 0.00 | 0.00 | 100% | 0.00 | 0.00 | 100% |
| diyanet-tr | 0.00 | 0.00 | 100% | 0.00 | 0.00 | 100% |
| ecfr | 0.00 | 0.00 | 100% | 0.00 | 0.00 | 100% |
| kuwait | 0.00 | 0.00 | 100% | 2.23 | 3.00 | 77% |
| moonsighting | 0.00 | 0.00 | 100% | 3.21 | 5.00 | 32% |
| ummalqura (worst) | 2.23 | 3.00 | 77% | 20.82 | 52.00 | 0% |

## 5. The two rules that needed an interpretation

EE-EIC and EU-DIYANET-UNIFIED are the only targets here whose high-latitude rule has no library
carrier. Both were written from the rule's own recorded parameters, and in both cases one reading
choice moves the cell. The readings are run side by side, so the size of the choice is visible
rather than buried in a sentence.

| target | reading | mwl fajr | mwl isha | diyanet-eu fajr | diyanet-eu isha |
| --- | --- | --- | --- | --- | --- |
| EU-DIYANET-UNIFIED | as scored | 12.01 | 23.26 | 12.01 | 11.47 |
| EU-DIYANET-UNIFIED | unconditional | 12.01 | 48.54 | 12.01 | 36.75 |
| EE-EIC | as scored | 62.64 | 42.84 | 62.64 | 35.22 |
| EE-EIC | unconditional | 70.36 | 42.84 | 70.36 | 35.22 |
| EE-EIC | window at the early bound | 42.09 | 42.84 | 42.09 | 35.22 |

The scored reading follows the record's own words: the policy layer calls the EE-EIC pair its
"extreme-season policy", so the band and the fallback act in the window where the angle fails; and
the EU plateau belongs to the same window as the 45th parallel, so it caps there and not year-round.
The EU fajr column is stable across readings because the 45th-parallel substitution binds on the same
days either way. The EU isha column is not: capping year-round would move the 16-degree cell by
25.28 minutes for every 16-degree body, which is why the window reading is the one scored.

The EE-EIC fajr column spans
42.09 to 70.36 minutes for MWL across the three readings of one
sentence. Treat that cell as a range, not a point: the surface publishes a fixed lead before sunrise
in its extreme season, no body does, and the gap between them is the finding. It is the widest
single interpretive band in this study and the merge should carry it as such.

## 6. What the gap-fill changes and what it exposes

The filled set has its own angle mix and its ranking follows it. diyanet-eu leads on combined deviation at 9.91 minutes, the 18/17 family (mwl, diyanet-tr, ecfr) sits at 11.34, and fazilet-b trails at 27.09. Its 10 isha-bearing targets average 16.12 degrees, against 16.9 across the main grid's 41, and 4 of them sit at 15. A set weighted that far to the short end puts the 16- and 15-degree bodies on top, which is exactly what the table shows, and it is why these cells must be read as a second sample rather than a repeat of the main ranking.

The record contradicts itself on NO-RABITA. Its high-latitude provenance says "59.9 N: a 16-deg angle exists all year at Oslo, so no clamp is forced", but at 59.9 N the sun's greatest depression at the June solstice is about 6.7 degrees, so a 16-degree twilight cannot exist for weeks either side. The sentence is physically false and the network's real summer handling is in its tables and unmeasured. 255 fajr days survive, and on them the 16-degree body (Russia, at 16/15) is the only one that scores zero.

FJ-FML is scored on the recorded 18/17 because that is the recipe the policy layer carries, while its world-table entry says the published isha sits "5-9 min past a 17-degree computation - a seasonal margin band, not a fixed interval". A 17-degree body therefore reads 0.00 minutes against a table that is really 5 to 9 minutes later than its own recipe. Every isha number in that cell is that band too flattering. Writing the band into the recipe would invent the value the record declines to fix, so the cell is left as recorded and flagged here.

FI-PORTAL carries an unresolved override: the portal is 18/17 and the Helsinki mosque states maghrib+85, observed 19:30 against the portal's 18:21 with `reconciliation: null`. The gap-fill scores the portal, which is the object, and leaves the override as the record leaves it. 242 fajr and 248 isha days survive the polar summer. The fajr cell reads zero for an 18-degree body on every surviving day, which is what a 18/17 surface measured against an 18-degree body must read.

MY-JAKIM is a five-zone table scored at one recorded zone point (WLY01). The record's own note says WLY01 and SGR01 "differ on 199/365 days: multipoint blend jitter, not separate rules", so no single point can reproduce the federation. The cell is the WLY01 cell, and its 2.47-minute fajr for an 18-degree body is the national +2 ihtiyati plus the ceiling, which is configuration rather than astronomy.

KE-JAMIA publishes suhoor-end and iftar only, so its isha cell is empty by rule, not by failure, and it is the one target the "within 2" count cannot use. Its fajr is one 18.2-degree angle serving 47 cities at RMSE 0.18-0.52, which makes the single Nairobi point a fair proxy in a way the Malaysian zone table is not.

EU-DIYANET-UNIFIED is the only grade-F target in the study: no series exists behind it, so its cells measure a published scheme against the bodies and nothing more. At Frankfurt the 18-degree fajr fails on 42 days, where the recorded rule substitutes the 45th parallel, and against a naked 18-degree body that substitution is worth up to 116.99 minutes. The cell is the single largest argument in this set that a high-latitude rule is configuration, not astronomy.

EE-EIC is the only Nordic surface whose extreme-season policy is written as numbers, and it is the only high-latitude target here scored on all 365 days. Its fajr is a fixed lead before sunrise in that window, so angle bodies diverge from it by up to 197.00 minutes in June, and its isha fallback to maghrib+90 does the same to every angle body's isha. The cell is sound as a reading of the surface and useless as a ranking signal: no naked body can match a published interval, and the spread across the readings of that one sentence is priced in section 5.

Every method in the study shares one high-latitude default, and it dominates the four Nordic cells. adhan 4.4.6 sets `MiddleOfTheNight` on `CalculationParameters` and no preset overrides it, so each naked body holds fajr and isha inside the middle of the night whatever it publishes. In the polar summer that collapses both prayers onto one instant: at Frankfurt on 2026-06-21 MWL returns 01:27 for fajr and 01:27 for isha, which section 7 shows against a target of 03:05 and 22:59. The 40 to 90 minute summer deviations on NO-RABITA, NO-MAWAQEET, SE-MOSQUE and FI-PORTAL are that default, not the bodies' own rules, and any body that published a high-latitude rule of its own would be scored against a carrier that cannot express it.

The eleven cells merge into the main grid's 49 to give 60 targets. The weighting is the lead's call and it is not mechanical: six of the eleven are not single-country. JAMIAT-KZN spans 23 countries, EU-DIYANET-UNIFIED is a transnational scheme, and the four Nordic surfaces are community lines inside populations of a few hundred thousand at most. Only MY-JAKIM (20.1 m), BR-IIB (1.5 m), KE-JAMIA (5.5 m) and FJ-FML (0.06 m) take a national population without a decision.

RU-CDUM stays skipped although it carries a fitted 18/17 recipe and a margin set. Its reference is a zone table of 21 unnamed cities, the record states "coordinates not carried in the record", and the fit excluded about 94-98 days per city. Choosing one of the 21 would be picking a target the record never fixed.

Six targets have a place but no recipe: DJ-COMMUNITY, PH-NCMF, AU-UMA, NZ-FIANZ, TJ-SHURO, TT-MASJIDBOX. Their angles are null in both the board and the policy layer, so no cell exists to score and none was invented. SI-VAKTIJA is the seventh non-scorable form, a seasonal sweep with no angle pair behind it. Together with the two method-side Fazilet entries and RU-CDUM that is the ten this pass leaves open, and every one of them is open for a reason the record states.


## 7. The target side, three days at a time

The readings the harness produced, against MWL on the same day, so a reader can see the rule do
its work rather than take the mean on trust. Every row comes from `debug` in `results.json`.

| target | day | target fajr | target isha | mwl fajr | mwl isha |
| --- | --- | --- | --- | --- | --- |
| MY-JAKIM | 2026-02-20 | 06:19 | 20:40 | 06:16 | 20:34 |
| MY-JAKIM | 2026-06-01 | 05:50 | 20:37 | 05:48 | 20:30 |
| MY-JAKIM | 2026-12-01 | 05:52 | 20:17 | 05:49 | 20:11 |
| EU-DIYANET-UNIFIED | 2026-01-15 | 06:22 | 18:35 | 06:22 | 18:41 |
| EU-DIYANET-UNIFIED | 2026-06-21 | 03:05 | 22:59 | 01:27 | 01:27 |
| EU-DIYANET-UNIFIED | 2026-09-15 | 05:08 | 21:17 | 05:08 | 21:24 |
| EE-EIC | 2026-01-15 | 06:55 | 18:06 | 06:31 | 18:22 |
| EE-EIC | 2026-06-21 | 03:18 | 00:13 | 01:23 | 01:23 |
| EE-EIC | 2026-09-15 | 04:49 | 21:41 | 04:19 | 22:01 |

MY-JAKIM on 2026-06-01 was also reproduced by an independent route - adhan `PrayerTimes` at
`Rounding.None` with the +2 ihtiyati applied and the ceiling taken by hand - which returned the same
05:50 and 20:37, so the target pipeline is not merely self-consistent.

