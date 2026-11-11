# FIT-INDEX: every recipe the O1k night produced

Machine-readable companion: `FIT-INDEX.json` (same entries, same wording). Generated 2026-11-10
by the registry agent from the fit deliverables themselves. Recipes are transcribed as the fit
reports and JSON state them; nothing is re-derived here. Where a workspace disagreed with itself
or with another workspace, both readings are carried and the conflict is named.

## Counts

| Measure | Value |
| --- | --- |
| Entries | 59 |
| Countries and territories touched | 52 |
| Grade A candidates | 16 entries (12 distinct objects) |
| Provisional | 16 |
| Community | 27 |
| Grade blocked (no grade on the evidence) | 3 (Benin x2, Kelantan) |
| Entries carrying a conflict note | 23 |
| Conflicts needing arbitration | 3 (PK anchor, Indonesia two lines, Niger grade) |
| One recipe across a real span (yes or frozen-recomputed) | 22 |
| Frozen reprints (year-2 nominal) | 2 (Niger, Belgium) |
| Single year, single month or short sample | 31 |

## The grading rule applied

Owner ruling T-667 #6943, as the policy layer v2.1 encodes it. Grade A needs two to three
distinct years of fitted evidence with one recipe reproducing every year. One published cycle
or one year is provisional. A mosque, federation or platform surface is community. Grade and
tier are independent: a community surface can reach A on multi-year evidence, and an authority
surface sits at provisional on one year.

**Frozen-generation precedent.** A table proven perpetual, or reprinted byte-identical across
nominal years, supplies no distinct year-2. The A path is closed and the object stays
provisional. Precedents already on record: Botswana (146 of 151 tables identical 2021-2026),
Uzbekistan (1400 and 1404 cell-for-cell), Sri Lanka (frozen uploads), Belgium (363 of 365 rows
identical), Niger (1,651 of 2,190 slots identical across seven years).

Span verdict vocabulary: **yes** (one recipe holds), **no** (it changes inside the span),
**frozen-recomputed** (one recipe and the years are recomputed, a genuine multi-year test),
**frozen-reprint** (a reprint, so year-2 is nominal), **untestable-single-year** and
**untestable-single-template**.

## North Africa

| Id | Surface | Tier | Span | Recipe (fajr / isha / asr / other) | Scores (exact / within1 / worst) | Span | Grade |
|---|---|---|---|---|---|---|---|
| TN-TUNIS-FIT1 | Tunis INM 2024+2025 | authority | 2 y, 731 d | 18.10 +0.5 floor / 18.10 +0.5 floor / Shafi 0 / dhuhr +7.5 floor, maghrib +2 ceil | fajr 709/731, isha 706, dhuhr 661, maghrib 692, asr 295 exact (601 within1); worst 2 | yes | **A** |
| TN-TUNIS-DEEP2 | Tunis INM 2020-2026 | authority | 7 y, 2,557 d | 18.1 round / 18.1 round / Shafi 0 floor / dhuhr +7 round, maghrib +2 up | 94.2 pc of days all-five; asr 39.8 exact, 81.8 within1 | yes | **A** |
| DZ-ALGER-1448-FIT2 | Algiers ministry 1448 (4 months) | authority | 119 d | 17.80 floor / 16.10 +5 nearest / Shafi +1 / dhuhr +1, maghrib +4, sunrise +1 | 626 / 714 of 714; worst 1 | yes (with 1447) | **A** |
| DZ-ALGER-1447-FIT11 | Algiers ministry 1447 + between-year | authority | 2 Hijri y, 708 d | frozen 1448 recipe; isha ridge 16.10 to 16.30 | 620 / 708 of 708; worst 1 | frozen-recomputed | **A** |
| MR-NOUAKCHOTT | Nouakchott 1446 imsakia | authority | 30 d | 19.25 -1 ceil / 16.20 +6 floor / Shafi 0 / maghrib +3 | 164 / 180 of 180; worst 1 | untestable | provisional |
| EG, LY, MA, SD | captures only | n/a | n/a | no fit delivered tonight | n/a | n/a | none |

Grade movements: Algeria rises to A on the joined 1447/1448 test, with recomputation proven
(paired same-Hijri cells differ by 10 to 14 minutes and track the sun). Tunisia rises to A on
seven years. Mauritania stays provisional: one Ramadan month cannot pin an angle, and the 15-21
grid all reaches within one minute with a compensating margin.

## West Africa

| Id | Surface | Tier | Span | Recipe | Scores | Span | Grade |
|---|---|---|---|---|---|---|---|
| TG-SOKODE | Sokode Al-Farouk (Mawaqit) | community | 1 y, 365 d | MWL 18 / 17 / Shafi / zero margins, nearest | 1,885 / 2,119 of 2,190; worst 2 | untestable | community |
| BJ-GAKPE-FIT2 | Gakpe page, calendar for Kandi | community | 1 y, 365 d | not reproducible at the stated point: 379 / 2,190, worst 9 | 379 / n/a of 2,190; worst 9 | untestable | blocked |
| BJ-ATTRIBUTION-FIT11 | same capture, grid re-test | community | 1 y, 365 d | best point 11.11 N / 2.94 E (Kandi): 1,852 / 2,190 | 1,852 / 2,190 of 2,190; worst 1 | untestable | blocked |
| BF-OUAGADOUGOU | MSBF 1447 vs 2021 | authority | 2 editions, 122 d | 17.6 (margin -1 in 2021, +4 in 2025) / isha a 5-min block walk / Shafi block / dhuhr a clock block | fajr 31/31 exact in both editions; maghrib 31/31 within1 (18/31 exact); dhuhr one block, asr one block | yes | provisional |
| NG-ABUJA-IKORODU | Masjidway Abuja + Ikorodu | community | 61 d | Egyptian 19.5 / 17.5 / Shafi / dhuhr no offset | RMSE 0.30, 0.24, 0.25 | untestable | community |
| SN-DAKAR-CERFI | CERFI Dakar 2011 + 2026-11 | community | 2 editions, 395 d | Fajar sunrise-75.5 / Guewe maghrib+60 exact / Shafi +2 / Suba sunrise-60.5 | 277/365 exact fajr, 365/365 within1; isha 365/365 exact | yes | community |
| ML-BAMAKO-ALMADINA | Bamako Al Madina (Mawaqit) | community | 1 y, 365 d | 19.0 +7.5 / 17.0 +5.5 / Shafi +8 / dhuhr transit+29 | fajr 363, isha 359, dhuhr 187 exact of 365, all within1 | untestable | community |
| GN-NONO | Grande Mosquee de Nono | community | 1 y, 365 d | 18 +0.5 (worst 19) / 17.0 +0.5 / Shafi 0 / dhuhr fixed 13:45 | isha 356, dhuhr 365, fajr 240 exact; worst 19 | untestable | community |
| NE-NIAMEY | Niamey BUTIN 2025-2031 | authority | 7 y, 2,556 d | 18.00 round / maghrib +75 / Shafi / no margins | every column 100 pc within1; fajr 92.7 exact | frozen-reprint | provisional |

Grade movements: Benin loses its row entirely. The page never says Cotonou, and the calendar is
computed 532 km from the page's own pin; two workspaces agree, so the record's Benin entry must
stop claiming a Cotonou table. Senegal joins the interval-rule family (UA/QA/SD/TW/PH) and is
edition-stable across fifteen years. Niger is the night's one grade regression: see conflicts.

## Central, Southern and East Africa, Indian Ocean

| Id | Surface | Tier | Span | Recipe | Scores | Span | Grade |
|---|---|---|---|---|---|---|---|
| SADC-DEC-11TOWNS | 11 SADC towns, Dec 2026 | community | 1 month, 341 d | bare 18 / Shafi 15 (plus isha_hanafi 18) / both schools printed / maghrib astro+3, dhuhr transit+5 | Maputo 303/403 exact; every non-divergent column within1; solar crosscheck 3,500/4,433 | untestable | community |
| MU-PORTLOUIS | Port Louis + 6 regional tiers | community | 1 y, 365 d | 17.89 +10 ceil / 17.29 +5.5 floor / Hanafi +4.5 / maghrib sunset+6 | fajr.begin 300/361, esha 282/365, asr 260/363 | untestable | community |
| EA-HORN-CLUSTER | 11 mawaqit payloads (SO, DJ) | community | 1 y, 4,026 d | MWL 18 / 17 / Shafi / zero margins | 23,314 of 24,156 within1; two payloads 2,196/2,196 | untestable | community |

Grade movements: Somalia, Somaliland, Djibouti, Madagascar, Mozambique and five SADC fallback
countries get their first dated rows. All stay community: platform defaults, one year.

## Europe: British Isles

| Id | Surface | Tier | Span | Recipe | Scores | Span | Grade |
|---|---|---|---|---|---|---|---|
| GB-SCT-GLASGOW | Glasgow Central, dpt year | community | 1 y, 365 d | own engine, ~18.2 / ~18.1 with +/-3 drift, Shafi, fajr clamped 01:33 for 96 days | best candidate 965 of 2,190 columns; worst 60+ | untestable | community |
| GB-SCT-DUNDEE | Al Maktoum Dundee | community | 1 y, 365 d | winter 18 / 15; summer 0.307 x night / 0.15 x night, weekly plateaus | cap regime fajr 173/365, isha 72/365 | untestable | community |
| GB-SCT-EDINBURGH | Edinburgh Central, Nov 2026 | community | 1 month, 30 d | MWL 18 / 17 / Shafi | 29/30 and 29/30 exact; worst 1 | untestable | community |
| GB-SCT-ABERDEEN | Aberdeen AMIC Central + Spital | community | 1 y, 333 d | 18 capped 1/2 night / 15 capped 1/7 night / Shafi | 319/333 exact each twilight, 333/333 within1 | untestable | community |
| GB-ENG-4TOWNS | Reading, Coventry, Rochdale, Bolton | community | 1 y, 1,449 d | interval tables: fajr = sunrise - F[day], isha = maghrib + I[day]; Hanafi | Coventry +3/+3 on 179/181 and 146/181; Bolton +3/+5 | untestable | community |
| GB-ENG-MOSAIC-18 | 18 English town surfaces | community | 1 y, 1,120 d | six families: T1 9, T2 2, ISNA 15/15 2, Karachi 18/18 3, MWL 1, Wifaqul caps 1 | per-town named-candidate hits; Aberdeen the only whole-year exact | untestable | community |

Grade movements: the UK outside London is confirmed as an own-table mosaic, not a national
recipe. Eleven of eighteen anchor fajr to sunrise as a printed interval (the LUPT form) but no
town reproduces LUPT's values, and school does not predict family (T1 splits 5 Hanafi / 4 Shafi).
Aberdeen AMIC is the first outside-London mosque measured to sit exactly on a named census
object (Wifaqul 18/15 with 1/2 and 1/7 caps).

## Europe: Nordics and Baltics

| Id | Surface | Tier | Span | Recipe | Scores | Span | Grade |
|---|---|---|---|---|---|---|---|
| NO-JAMIAT-INTERVAL | Jamiat Ulama Norway, 7 city-years | community | 3 y, 2,555 d | fajr sunrise - F[day] (43-106 min) / isha maghrib + I[day] (42-101) / Hanafi / 1/7 night caps | 730/730 integer offsets; solar columns +/-1 | yes | community |
| NO-IRN-VERIFY | IRN at Bergen, Trondheim, Tromso | community | 1 y, 921 d | 16 / 15 floor, zero margin (the stated claim), plus a 61-row Oslo Rabita table | Bergen fajr 204/365 exact, 226 within1, worst 117; Oslo 61/61 | no | community |
| DE-DIYANET | Koeln, Berlin, Frankfurt years | authority | 1 y, 1,095 d | 18 +0.5 floor / 16 (2023 European scheme) / Shafi shadow-1 / temkin -6.5 +5.5 +3 +6.5 | isha 16 deg 78/68/76 of 182 winter days; 17 deg 0/0/0 | untestable | provisional |
| EE-EIC | Tallinn + Tartu, 2026-2027 | community | 2 y, 1,460 d | 15 guarded by sunrise - night/4, clamp 45-120 / maghrib+90 May-Aug, else 15 with ceilings / Shafi | 100 pc within1 all four city-years; rule labels 1,460/1,460 | yes | **A** |
| IS-FELAG | Reykjavik + Akureyri, 3 years | community | 3 y, 2,190 d | 14.2 with angle-derived night portion / 14.0 same / Shafi | 2,190/2,190 within1 both columns | yes | **A** |
| SE, DK, FI, LV, LT, BY | captures only | n/a | n/a | no fit delivered tonight | n/a | n/a | none |

Grade movements: Norway now carries three coexisting recipe forms (IRN angles 16/15, mawaqeet
angles 18/15, and the Jamiat interval table), so "Norway's recipe" is the wrong object. Germany
closes the EU-DIYANET-UNIFIED question: the portal serves the 2023 European 18/16 set wrapped in
domestic temkin, not the 18/17 prose. Iceland's December +90 rule fires on zero days in any of
three years and is dropped from the object.

## Europe: Central, Benelux, Iberia

| Id | Surface | Tier | Span | Recipe | Scores | Span | Grade |
|---|---|---|---|---|---|---|---|
| CH-GENEVA | Geneva foundation hijri-month archive | community | 3 Hijri y, 1,022 d | 15 deg, 0, nearest / maghrib + 90 exactly (1,022/1,022) / Shafi 0 | 5,520 of 6,132 exact; 100 pc within1 once one defective month is excluded | yes | **A** |
| NL-VIN | Amsterdam, Rotterdam, Utrecht x 2 years | community | 2 y, 2,190 d | 18 rising floored 03:30 / 17 setting capped 23:30 / Shafi | fajr 412-419 of 690-730 exact, 690-702 within1; worst 2 | yes | **A** |
| BE-EMB | EMB Brussels windows, 2 years | authority | 2 y, 730 d | 18 outside 05-10..08-01, 03:24 plateau, mid arc lat 44.75 at 19.1 / 18 outside 05-01..08-11, 23:26 and 23:33 plateaus, lat-45 in the middle | fajr 90/365 and 129/365 exact; isha outside 262/262 within1 | frozen-reprint | provisional |
| PT-HSALAH | hsalah.info Lisboa, 3 editions | community | 3 y, 1,095 d | 18 (+0.5) / 12 deg +3, and maghrib +77 on the interval column / Shafi +0.5 / dhuhr +5.5, maghrib +3.5 | margin RMS 0.30-0.61 per column; latitude 38.70-38.72 in every edition | yes | **A** |
| LU-SHOURA | Luxembourg City, Shoura 2026 | community | 1 y, 365 d | 13.0 +0.5 floor / 12.9 nearest / Shafi +1.5 / maghrib sunset +1 | fajr 306 exact, 364 within1; isha 136 exact, worst 3 | untestable | community |

Grade movements: Portugal is confirmed at A on three editions with margins stable to 0.05 min.
Belgium is the night's second frozen-generation case: the two editions are 363 of 365 rows
identical, so the second year is nominal. The record's 17-degree isha object is refuted
(outside-window isha is 18.0, RMS 0.52). Netherlands closes to a stated-method object.

## South Asia

| Id | Surface | Tier | Span | Recipe | Scores | Span | Grade |
|---|---|---|---|---|---|---|---|
| PK-ISLAMABAD-FIT1 | Islamabad federal chart (fit1) | authority | 1 template, 366 d | 17.95 -0.5 floor (18.00 canonical) / a 15-minute clock ladder / Hanafi +2 / dhuhr 13:00-13:15 clock, maghrib sunset+6 | computed columns 1,152 of 1,464; with clocks 1,751 of 2,196 | untestable | provisional |
| PK-ISLAMABAD-SOUTHASIA2 | same chart, independent re-fit | authority | 1 template, 366 d | 18.00 (LS 18.12) / 15-minute ladder, 19 steps / Hanafi shadow 2.06 / maghrib sunset+5 flat, same dhuhr clock | fajr 144, sunrise 96, maghrib 70 exact of 366; dhuhr and asr 0 | untestable | provisional |

Grade movements: Pakistan moves from fallback/community-de-facto to an authority surface with a
machine-reproducible computed block. The two clocks (dhuhr, isha) are a new rule-form class for
the policy schema: angles for fajr/asr/maghrib, clock conventions for the other two. The two
workspaces disagree on the anchor (current-year versus leap-basis) and on the fajr angle; that
is arbitration item 1.

## Southeast and East Asia

| Id | Surface | Tier | Span | Recipe | Scores | Span | Grade |
|---|---|---|---|---|---|---|---|
| ID-MUHAMMADIYAH-DECADE | KHGT Jakarta, Surabaya, Jayapura 2025-2035 | authority | 6 sampled y, 1,116 d | 18.0 ceil +1 / 18.0 ceil +1 / Shafi / sunrise ceil -1.4, dhuhr floor +2, maghrib nearest +2 | 1,084 and 1,109 exact; 1,116/1,116 within1 | yes | **A** |
| ID-MUHAMMADIYAH-ACEH | KHGT Banda Aceh 2026-2027 | authority | 2 y, 730 d | same cell, unchanged | fajr 98.6/98.1 pc exact; 100 pc within1 both years | yes | **A** |
| ID-KEMENAG-HIGHLAND | Kemenag SIHAT, six highland regencies | authority | 2 dates, 1,032 d | 20 +2 floor / 18 +2 floor nationally; 21/19 for six regencies | six at 21/19: 12/12 exact; 510 at 20/18: 1,015 and 1,007 of 1,020 | untestable | provisional |
| KR-SEOUL-KMF | KMF national PDF 2026-02..2027-01 | authority | 1 y, 365 d | MWL 18 / 17 as stated / Shafi / ceiling | 1,089 of 2,184 exact, 2,153 within1 | untestable | provisional |
| TW-TAIPEI-CMA | CMA editions 1445/1446/1447 | community | 3 editions, 44 d | sunrise - 70 / maghrib + 90 / asr quasi-fixed 16:06 / dhuhr noon +19 ceil | fajr 43/44, isha 43/44, dhuhr 26/44 exact | no (buffers drift) | provisional |
| HK-TRUSTEES | Trustees' print (2 pages) + masjidal feed | community | 1 print, 85 d | page 1 angles 18.5 / 21.3; page 2 sunrise -80 / maghrib +80; feed 18.4 / sunset +83 | feed vs page 2: worst dhuhr 49, asr 83 | no | provisional |
| MY-KELANTAN | Kelantan zon tables (unread) + KTN01 | authority | 1 y, 365 d | KTN01: subuh 17.4 -1 / isyak 15.95 +6 / Shafi / maghrib sunset+2 | subuh 345/365, isyak 334/365, asr 189/365 | untestable | blocked |

Grade movements: Indonesia now holds two dated national lines a decade deep: Kemenag (20/18,
21/19 above about 1,750 m) and Muhammadiyah (18/18 +1), diverging by a constant 7.7 to 7.8
minutes for fajr. The highland pair is Kemenag policy, not physics: Muhammadiyah prints plain
18/18 at Puncak Jaya's own 3,396 m. Taiwan's fallback verdict is overturned on geometry: the
fajr/isha/dhuhr interval rules are edition-stable, while the maghrib allowance and asr constant
drift by edition. Hong Kong's withdrawn grade A stays withdrawn, harder: one printing carries
three constructions. Kelantan is an honest capture-discipline failure, not a negative.

## Middle East and Central Asia

| Id | Surface | Tier | Span | Recipe | Scores | Span | Grade |
|---|---|---|---|---|---|---|---|
| SA-MAKKAH-1500H | Makkah, six Hijri years to 1500H | authority | 6 Hijri y, 2,124 d | 18.5 floor+1 / maghrib +90, +120 in Ramadan / Shafi floor+1 / sunrise floor raw | 86.1-87.1 pc exact; 100 pc within1 every year | yes | **A** |
| SA-FOUR-CITIES | Makkah, Riyadh, Medina, Jeddah 1448-1449 | authority | 2 Hijri y, 2,836 d | same recipe, unchanged | 85.1-86.1 pc pooled exact; 100 pc within1 | yes | **A** |
| OM-MUSCAT | Muscat 2021-2028 | authority | 8 y, 2,920 d | 17.8 -1 ceil / 18.15 -1 ceil / Shafi +5 ceil / dhuhr, maghrib +5 ceil | all six columns 100 pc within1; exact 60.3-94.1 | yes | **A** |
| TJ-SHUROI | Shuroi Ulama windows 2015-2026 | authority | 12 y, 743 d | no single fajr angle (15.3-20.35 implied) / printed maghrib +90 exactly / asr shadow 1.6-2.6 / dhuhr a clock in eras | dhuhr 740/740; isha 671/743; asr 0/743 both schools | no | provisional |
| KZ-ASTANA-PETROPAVL | Astana + Petropavl to 2100 | authority | 9 y, 6,580 d | ISNA 15 / 15 with TwilightAngle / Hanafi / -5, +5, +5, +5 at 48 N and above | 65.1-70.5 pc exact; 99.7-100 pc within1; no trend | yes | **A** |
| KG-BISHKEK-OSH | Bishkek full 2027 + 2027-2035 windows | authority | 5 sampled y, 970 d | 18 floor / maghrib + round(7/9 x (sunrise-fajr) + 3.5) / Hanafi ceil+1 / maghrib sunset+7 | 52.3-75.1 pc exact; 94.6-99.9 pc within1; k 0.77657-0.77795 | yes | **A** |
| IQ-BAGHDAD | Baghdad October 2026 replay | authority | 1 month, 31 d | 18.1 floor+1 / 16.9 nearest+1 (October asks +0) / Shafi +4 / maghrib +3, dhuhr +5 | 100 pc within1 all columns; fajr 31/31 exact | untestable | provisional |
| YE, LB, QA, KW, JO, IR, SY, PS | captures, confirmations, negatives | n/a | n/a | no fit delivered tonight | n/a | n/a | none |

Grade movements: Saudi and Oman confirm A on spans to 1500H and 2028. Oman's asr is corrected
from Hanafi to the Shafi shadow (Hanafi is 56 minutes out). Kazakhstan holds one recipe to 2100
with no trend; Kyrgyzstan's twilight ratio holds to 0.0014 with a non-cumulative leap
oscillation. Tajikistan cannot be frozen: only two of six bounds carry one rule across twelve
years, and naming a single fajr constant would be false to within a quarter of an hour.

## North America

| Id | Surface | Tier | Span | Recipe | Scores | Span | Grade |
|---|---|---|---|---|---|---|---|
| US-DEFAULT-TALLY | 134 US mosque feeds | community | 3 y, 23 measured | fajr 15 / isha 15 at 105 (78.4 pc); 18 family 17 (12.7 pc); Hanafi 40 (29.9 pc); interval isha 0 | counts, not day scores; dark-quarter RMS 0.36-0.79 | yes (three-year profiles) | community |
| US-EIGHT-SURFACES | 9 new US surfaces (dpt + Masjidal) | community | 3 y, about 6,400 d | 14.6-15.2 / 14.7-15.4 / Shafi mostly, Hanafi at Richmond and Queens | joint within1 2,010-2,190 of 2,190 (Toledo 745/762, San Antonio 2,066/2,166); worst 1-3 | yes | community |
| CA-TORONTO | Masjid Toronto + Islamic Institute | community | 1 y, 730 d | 14.9 margin 0 / maghrib +80 (365/365); 15.2 +0.5 / maghrib +90 (345 d, 89 on 20 April) | 1,063 of 2,190 exact, 1,876 within1; worst 3 | untestable | community |
| CA-TALLY-26 | 26 Canadian mosque feeds | community | 3 y, 13 measured | 15/15 at 14 (53.8 pc); 15-deg fajr 20 (76.9 pc); interval isha 3 (11.5 pc); FCNA 13/13 at 0 | counts, not day scores | yes (three-year profiles) | community |

Grade movements: the honest North American default is measured, not asserted: fajr 15 and isha
15 at 119 of 160 mosques (74.4 pc), a 15-degree fajr at 131 (81.9 pc), and no mosque in either
country configuring FCNA's Canadian 13/13. Canada is materially less uniform than the United
States and is the only part of the corpus with a fixed-interval isha practice.

## Central and South America

| Id | Surface | Tier | Span | Recipe | Scores | Span | Grade |
|---|---|---|---|---|---|---|---|
| BR-25-CITIES | IIB 25 cities, Feb + Nov 2026 | community | 1 y, 1,450 d | MWL 18 / 17 / Shafi / zero margins, nearest | 8,503 of 8,700 exact; 8,700 within1; worst 1 | untestable | community |
| GT-GUATEMALA | Mezquita Aldaawa, Zona 9 | community | 1 y, 365 d | MWL 18 / 17 / Shafi / zero margins | fajr 341/365; all 2,190 cells within1; five columns 365/365 at the source pair | untestable | community |
| HN-SANPEDRO-SULA | Centro Islamico de Honduras | community | 1 y, 365 d | 18 / 18 + 5 min / Hanafi / maghrib sunset + 5 | fajr 351/365; all within1 | untestable | community |
| SR-PARAMARIBO | SMA Paramaribo, May 2025 sheet | community | 29 d | 18 / maghrib + 70 exactly / Hanafi / maghrib sunset + 3.5 | all 174 cells within1; fajr 26/29 exact | untestable | community |
| VE-CARACAS | Mezquita de Caracas, one Hijri month | community | 30 d | 18.5 +0.75 / maghrib + 89 exactly / Shafi +0.5 / dhuhr +2, maghrib +2 | all 180 cells within1; fajr 28/30 exact | untestable | community |
| MX-GUADALAJARA | Guadalajara Isa Ibn Maryam (Masjidbox) | community | 7 d | MWL 18 / 17 / Shafi / zero margins | five of six columns 7/7 exact | untestable | community |

Grade movements: Brazil's single-city provenance is now a 25-city surface. Suriname's held 18/18
is refuted: the isha is the printed maghrib + 70. Guatemala and Honduras are confirmed exactly at
zero margins, with the earlier "MAE 0.01/0.04" reading withdrawn as unreproducible on either
engine. Mexico's first dated rows are a lead, not a grade.

## Conflicts: three need arbitration

**1. Pakistan, the Islamabad chart's anchor.** Two workspaces fitted the same federal print.
fit1 fits fajr 17.95 with a -0.5 floor margin and concludes the chart tracks the current (2026)
solar year, citing fajr@18 exact counts of 260 (2024), 306 (2026) and 258 (2028). southasia2 fits
18.00 (least squares 18.12) and concludes the template is leap-anchored to 2028, because the 2028
residual stays inside -1.5..-0.1 minutes in every month while a common-year re-phase swings to
-2.48 in March. The two clocks and the Hanafi asr agree exactly. Suggested resolution: carry the
clocks verbatim, hold fajr at 18.00, and publish the leap-basis caveat rather than choosing one
anchor.

**2. Indonesia, two national lines.** Kemenag prints 20/18 with a +2 margin (21/19 for six
highland regencies above about 1,750 m). Muhammadiyah prints 18/18 at ceil plus one minute and
lands 7.7 to 7.8 minutes earlier for fajr every year from 2025 to 2035. Neither is an error.
Suggested resolution: ship both as distinct objects; never merge into one Indonesia recipe, and
never derive the 21/19 step from elevation (Muhammadiyah prints plain 18/18 at 3,396 m).

**3. Niger, the grade.** The record holds A on a freshness check: the served code reproduces the
banked November 2026 bank 30/30 with unchanged constants. But the generator has no year term, and
1,651 of 2,190 date-and-column slots are identical across all seven served years, the rest
differing by exactly one minute. Under the frozen-generation precedent there is no distinct
year-2. Suggested resolution: decide whether a freshness check satisfies the multi-year ruling
or whether only recomputation does. The precedent on record says recomputation.

## Conflicts recorded and resolved by the fits

| Id | Parties | Verdict | What changed |
|---|---|---|---|
| TN-ROUNDING | fit1 vs deep2 | superseded | constants agree; deep2's seven-year reading (round, not floor) wins |
| DZ-ISHA-RIDGE | fit2 vs fit11 | consistent | fajr 17.80 recovers identically; isha 16.10 vs 16.30 is two cells of 118 |
| SA-DUPLICATE | deep1 vs verify2 | consistent | same recipe; verify2 adds three cities and 1,418 rows |
| BJ-CITY-ABSENT | fit2 vs fit11 | consistent | both find the capture computed for Kandi; fit11 refines the point |
| OM-ASR-SCHOOL | deep2 | superseded | asr is the Shafi shadow, not Hanafi (56 min apart) |
| SR-ISHA-RULE | fit7 | superseded | isha is maghrib + 70, not 18 degrees |
| US-WIDGET-VS-FEED | fit6 vs usmap | superseded | IANT's live widget (15/15) beats its dpt feed (18/17) |
| GT-ENGINE-RESIDUE | fit7 vs the Americas wave | superseded | the "MAE 0.01/0.04" reading is an engine artefact; the floor is 0.25 min |
| BE-17-DEG | fit9 | superseded | outside-window isha is 18.0 (RMS 0.52); the 17-deg object is 7.0 min off |
| ID-HIGHLAND-PHYSICS | fit10 vs sea2 | superseded | the 21/19 step is Kemenag policy, not an elevation effect |
| PK-ANGLE | fit1 vs southasia2 | arbitration | 17.95 versus 18.00/18.12; see item 1 |
| NE-GRADE | deep2 vs the record | arbitration | A on freshness versus provisional on the frozen precedent |
| TW-BUFFERS | fit3 | superseded | geometry stable, buffers editorial; the record's "no stable rule" is half right |
| HK-THREE-CONSTRUCTIONS | deep3 | superseded | one print, three constructions; grade A stays withdrawn |
| NO-THREE-LINES | fit4 vs fit8 | consistent | IRN, mawaqeet and the Jamiat table are three publishers, not one conflict |
| CA-INTERVALS | fit5 vs usmap | consistent | both read the Toronto mosques as a 15-deg fajr plus an 80/90-minute isha |
| MY-CAPTURE-GAP | sea2 vs fit10 | recorded | the zon1/zon2 images were described but never saved |
| MY-JAKIM-MARGINS | census MY-JAKIM row vs my2027 (T-674 re-derivation) | superseded | the +2 fajr/asr/isha and -1 syuruk margins reproduce neither baseline (2026: 0.2/0.5/0.1/12.0 pc exact of 20,805 rows; 2027: 0/0/0 of 4,015); margins collapse to zohor +1.5 round alone, maghrib 0 ceil confirmed; syuruk is the per-zone eastern point, not a margin |
| BF-FAJR-SHIFT | fit10 | recorded | the 1447 edition prints fajr five minutes later on every day |
| KZ-DHUHR-BIAS | deep1 | recorded | a constant +1 minute model bias all century |
| RU-SALEKHARD | centralasia (wave) | recorded | C23's "Surgut" row is Salekhard data; real Surgut is absent |
| IL-COMPOSITE | gulf2 (wave) | recorded | five regional tables, year inferred 2028, no single coordinate reproduces it |
| YE-TWO-FEEDS | kel2 (wave) | recorded | Sanaa API and yemenawqaf.org Aden disagree; a diff, not a recipe |
| FI-TWO-EDITIONS | oceania2 (wave) | recorded | widget and sheet differ by up to 9 min; a fit must name its edition |

## In flight at the time of writing

| Workspace | State | Scope |
|---|---|---|
| fit13 | started, empty (only lib.js, 21:20) | Australia Diyanet years (Broadmeadows, Preston, Brisbane), NZ FIANZ stated offsets, New Caledonia year, Adelaide ISSA |
| fit14 | not created | the LUPT-family synthesis across England |
| verify3 | not created | adversarial re-check of the night's five load-bearing finds |
| wtdiff | not created | the country-by-country world-table diff draft |
| fit8 (partial) | Norway only | Sweden's IF national line and Denmark's three-way split are unfitted |
| fit9 (partial) | NL, BE, PT delivered | Spain (Madrid CCIM) and Italy (the Rome PNG) are unfitted |
| fit6 (partial) | three jobs delivered | the Baltic firsts (LV, LT, BY) did not land |
| nigeria3 | fit in REPORT.md, no JSON | Nigeria has two months, no year-2 |

## Not fitted tonight

Captures or confirmations exist, recipes do not: Kuwait, Qatar, Jordan, Egypt, Morocco, Turkey,
Iran, Yemen, Lebanon, Iraq (year fit), Palestine, Syria, Sweden, Denmark, Finland, Latvia,
Lithuania, Belarus, Spain, Italy, Andorra, Australia, New Zealand, New Caledonia, Fiji, Singapore,
Brunei, Sri Lanka, Bangladesh, India, Nepal, Maldives, Thailand.

## The five highest-confidence new recipes

1. **Kazakhstan, Astana and Petropavl to 2100.** ISNA 15/15 Hanafi with the high-latitude angle
   fallback and a -5/+5 margin block above 48 N: one recipe across nine sampled years and 6,580
   days, 99.7 to 100 per cent within a minute, no trend, and a live 2100 render matching the
   harvest 36 of 36 cells.
2. **Saudi Arabia, 18.5 floor+1 with the 90/120 interval.** Six Hijri years to 1500H and four
   cities over 2,836 days: exactly two interval values anywhere, zero violations in 177 Ramadan
   days, 100 per cent within a minute at Makkah and at every added city, each free fajr fit
   within 0.04 degrees of 18.5.
3. **Tunisia, 18.1/18.1 with dhuhr +7 and maghrib +2.** Seven years and 2,557 days at 94.2 per
   cent of days with all five columns inside a minute, per-year refits returning identical
   constants, and the held object's floor reading corrected.
4. **Indonesia, Muhammadiyah 18/18 at ceil plus one minute.** Eleven years, three latitudes and
   a fourth anchor at Banda Aceh: 100 per cent within a minute on 1,846 rows, with the required
   margin wandering two seconds across the decade and a constant 7.8-minute lead on Kemenag.
5. **Portugal, 18 / 12 deg +3 with the maghrib +77 interval column.** Three editions with
   margins identical to 0.05 minutes and a fitted latitude identical to 0.02 degrees, on 1,095
   days, with the header itself settling the isha question.

Runner-up: Iceland 14.2/14.0 with the angle-derived night portion, three years and 2,190 rows
all within a minute, and the record's December +90 clause shown to fire on zero days.
