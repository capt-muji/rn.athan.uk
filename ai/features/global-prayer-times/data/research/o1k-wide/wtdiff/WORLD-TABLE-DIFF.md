# WORLD TABLE DIFF — what the O1k night changes in `world-table-v2.md`

Drafted by the record-continuity agent, 2026-11-10, against the current 166-row record
(`ai/features/global-prayer-times/data/census/world-table-v2.md`, read-only) and every returned
wave and fit report under `$HOME/athan-gitree/census/o1k-wide/`.


## What this document is

The record is 166 rows. Tonight touched 62 countries with a new dated surface, 15 of them for
the first time, and overturned 37 verdicts (`night-summary/NIGHT-SUMMARY.md` §1, §3). This diff
states, country by country, exactly what changes if the night is adopted, what stays, and where
the evidence stops.

Labels follow the record's own: **new row** = the table has no row at all, or only a one-line
FALLBACK stub that a data row replaces. **Changed row** = the verdict, recipe, grade or caveat
moves. **Grade movement** = an explicit rise or a held grade whose span widened. **Owner call** =
a frozen-generation or belongs-to-version question the evidence cannot settle.

Every entry is cited as `workspace/report §section`, or `CONSOLIDATION <wave>` where the wave's
return is the only record. Where the log and a report disagree, the report governs and the
conflict is stated at the entry and again in §6.

Counts: **7 new row-slots** (5 countries absent from the table, 2 FALLBACK stubs rewritten),
**78 changed rows**, **16 grade movements plus 7 owner calls**, **8 schema rule-forms**.

---

# 1. NEW ROWS

## 1.1 Countries absent from the record

### Guatemala
- **Source and tier:** Mezquita Aldaawa Islamica de Guatemala (Zona 9), mawaqit-hosted; community.
- **Rows held:** 365 dated rows plus 365 iqamah rows, jumua 13:00, coordinates published
  (14.610256, -90.515533, `America/Guatemala`) (`americas2/REPORT.md` §4).
- **Recipe:** literal MWL 18/17, Shafi asr, zero margins, round-to-minute. The wave fitted fajr
  18.0 MAE 0.01 and isha 17.0 MAE 0.04; `fit7` reproduced it at the mosque's own coordinates on
  365/365 rows for five columns and identified the 0.01 as an engine artefact, not a mosque
  decision (`fit7/REPORT.md` §1, CONSOLIDATION F7).
- **Grade candidate:** candidate, community tier. The cleanest single surface in the Americas
  sweep and the country's first dated data.
- **Still needed:** a second year (one page load carries the whole year), and any stated method.
  The mosque states none in text.

### Honduras
- **Source and tier:** Centro Islamico de Honduras, San Pedro Sula, mawaqit-hosted; community.
- **Rows held:** 365 dated rows plus 365 iqamah rows, jumua 13:25, coordinates published
  (15.490210, -88.032334) (`americas2/REPORT.md` §4).
- **Recipe:** fajr 18.0, isha 18.0 plus 5 minutes, maghrib sunset plus 5, Shafi round-to-minute
  elsewhere, and **Hanafi asr**, 61.5 minutes off the Shafi column: the largest single-column
  spread in the Americas sweep. `fit7` §2 confirmed 365/365.
- **Grade candidate:** candidate, community tier.
- **Still needed:** a second year, and a test of whether the app's per-column offset model can
  express a five-minute caution on two columns with none on fajr.

### Venezuela
- **Source and tier:** Mezquita de Caracas monthly PDF, `mezquitadecaracas.com/horario-salat.pdf`;
  community (the mosque is the publisher).
- **Rows held:** 30 dated rows, 2026-10-12 to 2026-11-10, a Hijri month dated by its own weekday
  sequence, six columns plus an iqamah block plus a ten-city offset ladder
  (`americas2/REPORT.md` §6.1).
- **Recipe:** Umm al-Qura family. fajr 18.5 (mean -0.8 min), **isha exactly maghrib + 89 on all
  30 days, zero exceptions**, plus a two-minute caution on maghrib, dhuhr and asr. The web page
  says MWL, the PDF stamps Umm al-Qura, and the numbers side with the PDF (`fit7/REPORT.md` §4,
  CONSOLIDATION F7).
- **Grade candidate:** candidate. One month, a printed method and an exact interval is a strong
  candidate, not a provisional.
- **Still needed:** a monthly fetch series to reach a year, and a ruling on the ladder: the PDF
  prints Maracaibo +19 and Bolivar -12, the web page prints +09 and +10. Take the PDF, never both.

### Luxembourg
- **Source and tier:** Assemblee de la Communaute Musulmane du Grand-Duche (Shoura/ACM) 2026
  calendar, `shoura.lu`; authority.
- **Rows held:** 365 dated rows, French, Hijri day and Jumou'a marks (`benelux2/REPORT.md`
  §Luxembourg, `fit3/REPORT.md` §Luxembourg).
- **Recipe:** **fajr 13.0, isha 12.9**, zero margins, Shafi, standard -0.833 horizon, dhuhr at
  solar noon. A genuine 13/13 pair, neither the Belgian 18/18 next door nor the French
  fixed-interval table. MWL and ISNA refuted at 429/2190 each, UOIF 12/12 at 806/2190.
- **Grade candidate:** candidate, authority tier, one year. `fit3` held the stated pair and found
  a seasonal wobble on isha no single angle absorbs.
- **Defects to carry:** March maghrib +6 for the whole month, 2026-03-29 maghrib and asr left on
  CET, 2026-10-25 fajr unshifted, 2026-10-02 dhuhr typo, 11-18 and 11-19 printed with
  October-stamped keys.
- **Still needed:** a 2025 or 2027 edition (both 404), and a second publisher. The EMB delta table
  already carries Luxembourg City at Brussels -6, which is not this recipe.

### Belarus
- **Source and tier:** Muslim Religious Association of Belarus, `islambel.by/vremya-namazov`;
  authority-tier national association.
- **Rows held:** 365 dated rows, Minsk, 2025 only; the page has not rolled to 2026
  (`nordics2/REPORT.md` §Belarus).
- **Recipe:** unfitted; a **capped table**. fajr stops rising at 07:16 for ten days across the two
  year-ends while sunrise keeps moving, and isha stops rising at 23:06 for thirteen midsummer
  days. A fit needs a cap pair, not angles alone.
- **Grade candidate:** candidate, authority tier, single-year snapshot.
- **Still needed:** a current-year read, a method statement (none exists), and a cap-pair fit.

## 1.2 FALLBACK stubs rewritten as data rows

### Latvia
- **Was:** `Latvia — FALLBACK — no surface (C6 negative)`.
- **Now:** Latvijas Islama Kulturas Centrs, `likc.lv/prayer-times/`, community national centre;
  **6 rows** (Riga, Daugavpils, Ventspils at 15/15 and at 12/12 for 2026-11-10), a published
  seasonal scheme (**UOIF 12/12 summer, ISNA 15/15 winter, Shafi**) and IslamicFinder embeds that
  serve today only (`nordics2/REPORT.md` §Latvia).
- **Grade candidate:** candidate-scheme. The scheme is a seasonal swap of exactly the kind a
  frozen parameter set cannot express, and both settings are visible on the same day.
- **Still needed:** any dated table. No Latvian mosque publishes an annual file, so this is a
  scheme plus one dated row per city per method, nothing more.

### Lithuania
- **Was:** `Lithuania — FALLBACK — no surface (C6 negative)`.
- **Now:** Lietuvos musulmonu muftiatas, `muftiate.lt/maldu-laikai/`, authority-tier; **7 rows**,
  a rolling week (2026-11-09 to 11-15). The published pair is an **18/16 shape**, and the Turkish
  Hijri labels plus the Kaunas mosque's own Diyanet link put the line on Diyanet, not on a Nordic
  reading or a 15/15 family (`nordics2/REPORT.md` §Lithuania).
- **Grade candidate:** candidate.
- **Still needed:** a year, by weekly re-read or from the Diyanet Kaunas/Vilnius page, which this
  pass did not open.

---

# 2. CHANGED ROWS

Rows grouped by region. "Grade effect" states the movement this evidence supports, not a grade
already written into the record.

## 2.1 British Isles and Europe (24)

| # | Row | What changed | Grade effect | Cite |
|---|---|---|---|---|
| 1 | United Kingdom (London) | The publisher's site now serves **monthly tables for every year 2027-2076** plus `LUPT-2027.xlsx`, so year-2 LUPT is publisher-published rather than recovered. ELM 365 rows 35/35 exact against LUPT, ICC 305/305 exact against ELM, MWH 27/30 field-days. The Croydon counterexample now hides behind JS and cannot be re-measured. | A holds; surface caveat improves | `ukscotland/REPORT.md` §Headline |
| 2 | United Kingdom (Wifaqul Ulama) | **First outside-London exact witness of the recipe**: Aberdeen AMIC Central and Spital, two public Google Sheets, 333 parsed rows each, 18/15 with fajr capped at half the night and isha at a seventh, **319/333 exact per column, worst 1 minute**. The free portion scan returns 1/2 and 1/7 without being told. | provisional holds; second-year debt unchanged, evidence base widens | `fit4/REPORT.md` §1, `fit12/REPORT.md` §Clusters |
| 3 | Ireland | IFI `?year=2027` is **byte-identical** to the standing table, so no year-2 exists and the DST defect cannot self-heal. Galway REST v1.3 now labels every row official or provisional (machine-readable), and 2027 dates 404. | candidate holds; frozen-generation caution added to IFI | `ukscotland/REPORT.md` §Ireland |
| 4 | Iceland | **Three years, two cities, 2,190 rows.** 14.2/14.0 with the night portion taken from the angle itself reproduces every row within 1 minute at both cities. The **December +90 display rule fires on 0 days in any year: drop it.** Asr is a generator sweep whose declination lags the date by about two days, and it reaches the capital only as a 12-minute early winter reading, never as asr at or before dhuhr. | provisional → **A** | `deep3/REPORT.md` §3, `nordics2/REPORT.md` §Iceland |
| 5 | France | GMP Paris poster transcribed: **isha = maghrib + 87 exactly on all 30 days**, dhuhr +5, maghrib +3. CTIR's 2020 year prints the **mirror of its own stated pair** (14.5/13.5 against a quoted 13.5/14.5). APBIF states a 48d33' line with an explicit 12-degree refutation. | candidate holds; recipe evidence deepens, no national body | `benelux2/REPORT.md` §France |
| 6 | Belgium | **The 17-degree isha object is refuted.** Outside the window isha is 18.0 (RMS 0.52; 17 deg misses by 7.0). Window boundaries measured: isha leaves the real-latitude curve 2026-05-01 and rejoins 08-12 (103 days), fajr 05-10 to 08-02 (84). The substitution is **not** lat-45: 21 days are flat at 23:26, 17 at 23:33, and only the middle 65 track lat-45 (RMS 1.8). The 2025 and 2026 editions print identical MM-DD times (perpetual). | provisional holds; recipe corrected, year-2 closes as frozen | `benelux2/REPORT.md` §Belgium |
| 7 | Netherlands | **Closed on measurement.** VIN's own declaration (2 Dec 2023) states 18/17 with fajr floored 03:30 and isha capped 23:30. Eight city-years reproduce it at RMS 0.64-0.78, and the caps bind **95-104 days**, wider than the statement's "end of May, June, July". | candidate → **provisional (measured)** | `benelux2/REPORT.md` §Netherlands |
| 8 | Germany / EU-Diyanet | **The named gap closes.** The Diyanet portal serves full years for Koeln, Berlin and Frankfurt (1,095 rows, authority tier) at **18/16, the European pair, not the domestic 18/17**, wrapped in the domestic temkin measured as sunrise -6.5, dhuhr +5.5, asr +3 (shadow 1), maghrib +6.5, with fajr at about night/5 and isha on an 80-minute plateau. | **F → provisional** (standing series now exists, one year) | `fit4/REPORT.md` §4 |
| 9 | Austria | No 2027 edition exists: the calendar is permanent, and the 2029 "correction" is day-of-year slot alignment after leap-year 2028, not solar drift. The 2025 edition is banked. | provisional holds; edition caveat corrected | CONSOLIDATION `O1k-7 europe`, `europe/REPORT.md` §Austria |
| 10 | Switzerland | **A second Swiss organisation with three Hijri years.** Geneva's foundation publishes one PDF per Hijri month, 1,022 rows, 1447 and 1448 complete and reproducing each other to 0.05 min: **fajr 15, no margins anywhere, isha = maghrib + 90 exact.** A different scheme from IZRS's 12.5/13. | candidate holds; "the Swiss method" is now two methods | `iberia2/REPORT.md` §Switzerland |
| 11 | Spain | Madrid re-captured whole, 668 rows, every column within half a minute of the held recipe, parameters frozen 2025-2026. **The record's "misses December both years" is wrong on one**: December 2025 exists; the holes are March 2025 and December 2026. Granada (355 rows, 18/17, shuruq +5) and Malaga (30 rows) are new dated lines, and neither is Madrid's scheme. | A holds; defect corrected, coverage widens | `iberia2/REPORT.md` §Spain |
| 12 | Portugal | The **2023 edition** is recovered for all 21 cities, and **the header settles the fit debate**: it prints `Isha (12 deg + 3 min)` and `Isha (01:20)`, and the interval column is **maghrib + 77 exactly** (sd 0.00). Margins identical 2023 to 2027 to 0.05 min. Braga, Coimbra and Faro banked at 2026 and 2027. | A holds; recipe now stated rather than fitted | `iberia2/REPORT.md` §Portugal |
| 13 | Italy | **The Grand Mosque of Rome does publish Roman times**: a monthly PNG on its own domain, 30 rows, **fajr 19.1, isha = maghrib + 90 exact**, dhuhr noon +1, shuruq -1. UCOII is identified as an AlAdhan method-3 wrapper, so the federation surface is community tier. | candidate holds; the "publishes nothing" defect closes | `iberia2/REPORT.md` §Italy |
| 14 | Croatia | **First Croatian city-year banked**: Medzlis Pula, 242 dated rows across eight months of 2026, geographically its own. The authority's own site embeds the vaktija.eu Zagreb widget, confirming platform-fed provenance at publisher level. | candidate holds; a fit is now possible | `balkans2/REPORT.md` §Croatia |
| 15 | Bosnia and Herzegovina | The **printed Takvim 2026 equals the API on 365/365 rows, zero diffs**, and the API's computed 2027-01-01 echo is **byte-identical** to the printed 2026-01-01 row: the frozen-generation signature caught live. | provisional holds; frozen caution confirmed | `balkans2/REPORT.md` §Bosnia |
| 16 | Serbia | **The offset table is a three-group design, not render damage**: fajr with sunrise, dhuhr alone, asr with maghrib and isha. The 2026 Novi Pazar base is negative. rijaset.rs now embeds an IslamicFinder widget (Belgrade, 18/17), a second, distinct reading. | candidate holds; defect resolved | `balkans2/REPORT.md` §Serbia |
| 17 | Montenegro | **The IZCG portal declares the official parameters: 19.5 fajr, 17.5 isha, standard (Shafi) asr, other towns by fixed minute shift.** The fitted band sits just inside the declaration, and the day-counted capture is 6 city-groups x 365 (2,190 rows). The 5-6 minute rival contradiction is quantified on 2026-11-01. | provisional holds; "band not point" defect resolves to the stated point | `balkans2/REPORT.md` §Montenegro |
| 18 | Bulgaria | **Every non-Sofia town is not a longitude clone by assertion but by proof**: Plovdiv and Varna return their own 365-row years, inter-town deltas match pure longitude, and **day length is byte-identical across the three towns** on every sampled date. Sofia year 2 is banked (365 rows, previously 92 days). | provisional holds; defect proven, year-2 met for Sofia | `balkans2/REPORT.md` §Bulgaria |
| 19 | Greece | Komotini's muftiate site carries a today-only imsak widget and no imsakiye page, so the day-counted muftiate year stays unreachable and the banked 365-row table is a **different lineage's** second witness. Athens: the menu promises a yearly table and the page carries Ramadan only; a second Ramadan season (29 rows) gives isha - maghrib 82, 83, 84. | provisional holds; Komotini caveat sharpens | `balkans2/REPORT.md` §Greece |
| 20 | Norway | **The schism is mapped and a third line exists.** IRN 16/15 and mawaqeet 18/15 were known; islamweb.no / Jamiat Ulama runs an **interval table** with 730/730 integer F/I offsets, city-independent across seven cities, capped at 1/7 of night (2,555 rows). IRN's Tromso prints an invented polar-window sunrise on 50 days. | candidate holds for both mapped lines; third object added | `fit4/REPORT.md` §3, `nordics2/REPORT.md` §Norway |
| 21 | Sweden | **The IF national table serves 111 cities**, and **Angered equals IF Goteborg on all 365 days, cell for cell**, retiring the three-position tension: the mosque layer follows the IF 18/16 line. Sunni Centret diverges (+7 sunrise, +8 isha on the same base). | candidate holds; "three positions" reduced to one plus one | `nordics2/REPORT.md` §Sweden |
| 22 | Denmark | **Copenhagen splits three ways**: Khair al Bariya 18/16, Mawaqeet 18/15, salah.dk 15/15. The record's 15-degree day-fit came from the outlier table, not the dominant line. 456 rows. | candidate holds; the recorded reading is corrected to the outlier's provenance | `nordics2/REPORT.md` §Denmark |
| 23 | Finland | Helsinki year captured (365 rows) **plus a published method statement**: MWL 18/17 with a 1/5-of-night summer rule, stated rather than derived. | candidate holds; stated-method upgrade | CONSOLIDATION `O1k-7 europe`, `europe/REPORT.md` §Finland |
| 24 | Estonia | The headless engine is verified against the live page **36/36 cells exact**, then reimplemented: **1,460 of 1,460 rule classifications match** and one parameter set covers both years. The published **45-120 clamp never moves a value**; what fires is the unbounded quarter-night substitution. | candidate → **provisional** (two years, one parameter set) | `deep3/REPORT.md` §4, `nordics2/REPORT.md` §Estonia |

## 2.2 Middle East and North Africa (11)

| # | Row | What changed | Grade effect | Cite |
|---|---|---|---|---|
| 25 | Turkey | The public ilce page still serves 2026 only, so the record's 2027 evidence rests on the awqatsalah API alone; 2027 is not yet on the authority's own surface. | A holds; caveat added | `mideast/REPORT.md` §Turkey |
| 26 | Saudi Arabia | **One recipe serves all four cities**: 18.5 floor+1, isha maghrib+90 and +120 in Ramadan, 100 pc within 1 on every column of **2,836 city-days** at Makkah, Riyadh, Medina and Jeddah, each free fit within 0.04 deg of 18.5. The interval switch holds across six Hijri years to 1500H. | A holds on a four-decade, four-city span | `verify2/REPORT.md` §1, `gulf2/REPORT.md` §3 |
| 27 | Bahrain | **The method statement is captured and Fajr is filled.** The council states isha as true 18 deg, a two-site rule (fajr and sunrise at Dilmunia, the rest at Salman) and dhuhr at disc transit. Fitted fajr **18.1 at Dilmunia, 18.2 at Manama**, band 18.05-18.25; isha 17.7 at the declared site. The full 1448 table is on disk (355 rows). | provisional holds; "fajr angle absent" and "band not point" defects close | `gulf2/REPORT.md` §0, §2 |
| 28 | Oman | **Year 5 then year 8**: 2,920 rows 2021-2028, every column within 1 minute on every day, worst year 2021. **51 dhuhr cells in the banked 2028 file were an 11:59-print artefact** and are repaired. Asr is the Shafi shadow with +5 ceil (the record already carries Shafi; an earlier object reading of Hanafi is what the fit corrects). The CityID trap is on record: **CityID=2 is Adam, not Muscat.** | A holds, span doubled to eight years | `deep2/REPORT.md` §Oman, `gulf2/REPORT.md` §8 |
| 29 | Yemen | **Both feeds are captured and neither is fitted.** The Sanaa API serves a rolling ~10-day window across 31 locations (279 rows from nine days), and the recognised government's Aden surface serves a full month for six cities with a 2025-2027 selector (30 rows). They differ on the same day (fajr 04:49 vs 04:50, different asr and isha). | provisional holds; feed choice is now a real either/or, not a missing surface | `gulf2/REPORT.md` §7 |
| 30 | Iraq | October replays 31/31 at between 1 minute on every column, and **the recorded isha margin is a minute over**: at 16.9 the month prints the minute with **zero margin**, 29/31 exact. The amended pair 18.1+1 / 16.9+0 is the October reading; the standing 18/17 also holds at 100 pc within 1. | provisional holds; recipe margin corrected | `verify2/REPORT.md` §3 |
| 31 | Libya | **A new authority surface exists and is closed unsolved**: the awqaf.gov.ly widget covers 22 cities behind a Cloudflare human challenge, with one proxied Tripoli day recorded. Benghazi's ministry site has no prayer surface. | provisional holds (Muazzin); the authority route is named | `northafrica2/REPORT.md` §Headline, CONSOLIDATION `O1k-W5` |
| 32 | Morocco | **The conditional-A resolver lands.** The rebuilt ministry portal serves the tables itself: `data/horaires-2026-MM.js`, 190 cities, `fuseau:"GMT"`, with October and November 2026 live. Rabat's November rows reproduce the census recipe **100 pc within 1 minute** on the ministry's own new surface, and Casablanca and Laayoune are parsed to disk. | **conditional A → A** on the evidence; the owner's one-line ruling is the only step left | `mideast/REPORT.md` §Morocco |
| 33 | Algeria | **First authority table, fitted and frozen across two Hijri years.** 119 days of 1448 plus 118 of 1447: fajr **17.80 floor**, sunrise and dhuhr +1, maghrib +4, isha **16.10 +5 nearest**, Shafi. Applied unchanged the 1448 recipe holds 1447 at 87.6 pc exact and 100 pc within 1. Fitting autumn alone predicts Ramadan **30/30 exact**. Egyptian 19.5/17.5 refuted (24 pc of cells, worst 9 min). The per-wilaya register is a display aid: both regional books in hand fall outside its 25 wilayas and each reproduces within 1 at its own coordinates. | candidate → **provisional**; A path open on the next full year | `fit2/REPORT.md` §1, `fit11/REPORT.md` §1 |
| 34 | Tunisia | **Seven years, 2,557 days, one frozen recipe**: 18.1/18.1, dhuhr +7 round, maghrib +2 rounded up, Shafi asr. All five columns within 1 minute on **94.2 pc** of days, never below 93.2 in any year. The held object's floor/ceil mix is corrected: the printed bounds are per-column roundings, and the same constants score 81.8 pc under the old mix. 2025 is a recomputation (133 of 365 rows repeat 2024). | provisional → **A** (seven-year span) | `deep2/REPORT.md` §Tunisia, `fit1/REPORT.md` §2 |
| 35 | Mauritania | **First authority-tier dated table**: the ministry's 1446/2025 imsakia PDF, Nouakchott transcribed, 30 Ramadan days. Fitted 19.25/-1 ceil fajr and 16.20/+6 floor isha, 164/180 exact and 180/180 within 1. The corpus 19.37/17.46 holds at zero margin (fajr 30/30 exact). Egyptian is indistinguishable on one Ramadan. | provisional holds; "no surface" defect closes, Ramadan-only limits the grade | `fit2/REPORT.md` §2 |

## 2.3 Africa (16)

| # | Row | What changed | Grade effect | Cite |
|---|---|---|---|---|
| 36 | Senegal | **The country's first real surface, and an interval-rule country.** CERFI publishes 152-city weekly tables and monthly PDFs crediting the Seminaire des Imams; Dakar's 2011 edition is the artifact (365 rows) and the 2026-11 sheet cross-checks it. **Fajar = sunrise - 75.5 and Suba = sunrise - 60.5, both 365/365 within 1; isha = maghrib + 60 exactly, 365/365.** The column printed "sunrise" is Suba, the second dawn gate, and misses astronomical sunrise by up to 51 minutes. Edition-stable 2011 to 2026. | candidate → **provisional** | `fit3/REPORT.md` §Senegal, `sahel2/REPORT.md` §Senegal |
| 37 | Mali | **FALLBACK broken.** Four Bamako mawaqit mosques, 365 rows each. The cleanest, Al Madina Al Mounawara, fits **19.0 +7.5 fajr, 17.0 +5.5 isha, maghrib sunset +3.5, dhuhr transit +29, Shafi asr +8** (fajr 363/365 exact, isha 359/365, maghrib 363/365). AR-RAHMAN and Oumar Ibn Kattab carry fixed jama'ah columns and are not athan. | FALLBACK → **candidate** (community) | `fit3/REPORT.md` §Mali, `sahel2/REPORT.md` §Mali |
| 38 | Guinea | **FALLBACK broken at one mosque only.** Grande Mosquee de Nono, 365 rows: isha 17.0 +0.5, maghrib sunset +0.5 until 15 October then a smooth drift hump peaking +9.7 in late November, **dhuhr pinned 13:45 on all 365 rows**, and fajr on a seasonal dawn curve (58-76 minutes before sunrise) that no fixed angle or interval convention reproduces. Conakry still has no passing table (three broken configurations). | FALLBACK → **candidate, weakest of the night** | `fit3/REPORT.md` §Guinea, `sahel2/REPORT.md` §Guinea |
| 39 | Gambia | November 2026 recaptured (29 of 30 rows agree; day 23 maghrib carries a 1-minute two-witness disagreement) and, through a lookaside route past the login wall, **a December 2022 calendar (31 rows)**: two distinct calendar years now held. GSIC's own website carries no prayer table at all. | provisional holds, **year-2 condition now met** | `sahel2/REPORT.md` §Gambia, CONSOLIDATION `O1k-9` |
| 40 | Togo | **The served table is 2026, not 2027** (C1's assumed alignment is corrected). Fit: **MWL 18/17, zero margins, nearest, 365 days**, five columns within 1 minute every day, asr exact on 76/365 with a clean annual sinusoid (the platform's declination series, not a second school). | candidate → **provisional** (community ceiling, year complete) | `fit2/REPORT.md` §3, `sahel2/REPORT.md` §Togo |
| 41 | Benin | **The held capture is not Cotonou.** The page never says Cotonou: it names Gakpe, pins 6.4161/2.1211 (30 km west of the city, 6.9 km from Ouidah) and the calendar is computed at **11.11 N / 2.94 E, which is Kandi** (1,852/2,190 exact). At its own pin the table misses by up to 14 minutes and no margin repairs it; dhuhr alone fits at the pin, which is the latitude signature. | candidate withdrawn; **row must stop claiming a Cotonou table** and gains a named northern-Benin surface with no publisher | `fit2/REPORT.md` §4, `fit11/REPORT.md` §2 |
| 42 | Burkina Faso | **Year 2, with a rule change caught.** The MSBF printed annual (2021) has a text layer and the current 1447 edition is five Gregorian-dated images: every sun-anchored column is identical to the minute, but **the 1447 fajr prints 5 minutes later on every day** (same 17.6 angle, margin -1 to +4), and the isha block walk was re-set. **Dhuhr +33 is the platform's normalisation at the season of capture, not federation doctrine**: the federation prints a fixed clock block (12:30 for six months, 12:25 for four, 12:45 in Ramadan). Bobo-Dioulasso (365 rows) tracks true noon. | candidate holds; year-2 met with a documented rule change | `fit10/REPORT.md` §3, `sahel2/REPORT.md` §Burkina |
| 43 | Cote d'Ivoire | Beyond the broken AlAdhan proxy, **COSIM's own site hosts a monthly calendar image** (30 rows, Rabi II 1448) on which **zouhr and asr print as FIXED 13:00 and 16:00 national conventions**, in the sheet's own words. The proxy and the authority surface carry two different dhuhr doctrines. | candidate → authority surface exists, one month | `sahel2/REPORT.md` §Ivory Coast |
| 44 | Somalia and Somaliland | **First data ever**: five mawaqit mosques (three Hargeisa, two Mogadishu), **1,830 rows**. One recipe fits the cluster: **MWL 18/17 Shafi, zero margins** (two of the three Hargeisa mosques share one configuration, Ina Weerar runs its own). The ministry publishes Eid and Ramadan announcements only. | FALLBACK → **candidate** (community/platform) | `horneast2/REPORT.md` §Somalia, `fit5/REPORT.md` §East Africa |
| 45 | Djibouti | **All six enumerated mosques captured fresh, 2,196 rows**, and the East Africa cluster fit puts **five of six on one recipe** (MWL 18/17 Shafi, zero margins); Al-Salam FYART is defective on asr (-14 to +16). The platform index claims 12 mosques but the unindexed half is beyond public pages; the ministry is a negative. | candidate → **provisional** (cluster recipe, platform tier) | `horneast2/REPORT.md` §Djibouti, `fit5/REPORT.md` §East Africa |
| 46 | Kenya | **The recorded lift closes negative**: meteo.go.ke carries no prayer content and KMD is a co-preparation credit inside Jamia's Ramadan PDF, not a host. The new data is the mosque layer: three mawaqit mosques, 1,098 rows, with UMMA Kajiado's dhuhr +67 a jama'ah lean. | provisional holds; lift re-pointed at the mosque layer | `horneast2/REPORT.md` §Kenya, CONSOLIDATION `O1k-9` |
| 47 | Madagascar | **First dated rows for the country**: Mahajanga November 2026 (30 rows) via salaahtimes.co.za, internally consistent on longitude and UTC+3. Antananarivo's Masjidbox page remains today-only, and the lat/lon 0.0 mirror defect cannot be re-verified from the page (no coordinates served). | FALLBACK → **candidate** (one month, community) | `horneast2/REPORT.md` §Madagascar |
| 48 | South Africa (MJC, Cape) | **Second month and the two-body delta quantified** on November 2026: MJC minus Jamiat is dhuhr **-5**, maghrib -2 to -3, isha **+13 over the Shafi column and -5 under the Hanafi**, fajr and sunrise equal. New surfaces: **salaahboard.com** (21 Cape mosques, dated jamaat, keyless JSON) and salaahtimes.co.za serving **Cape Town on Jamiat times inside MJC territory**. The full MJC year is unreachable (query params ignored, one Wayback snapshot). | candidate holds; geography now data | `southernafrica2/REPORT.md` §South Africa |
| 49 | Botswana | December 2026 captured (30 towns x 31 days, 930 rows) and **the table set is proven perpetual: 146 of 151 monthly tables byte-identical between 2021 and 2026**, the five differences typo fixes, zero time values changed. December 2025 is not archived anywhere. | candidate holds; **grade-A year path closed by the frozen-generation precedent** | `southernafrica2/REPORT.md` §Botswana |
| 50 | Malawi | **The Blantyre variant is explained**: sunset prints at astronomical sunset (not astro-3) and maghrib at astro+6 (not +3), a +3 bump on the evening pair only, town-scoped like Isipingo's ishraaq. The national body's homepage bar (maghrib 17:24 against Jamiat 17:53) remains a separate undated anomaly. | candidate holds; the one named variant resolves | `southernafrica2/REPORT.md` §Malawi |
| 51 | Mauritius | **Full 2026 year, 365 rows, 15 fields** from the PWA bundle, fitted: **fajr 17.89 +10, isha 17.29 +5.5, asr Hanafi +4.5, maghrib sunsetStart +6**, zawaal windows fixed, jamaat offsets fixed. The six regional adjustments are three symmetric minute tiers (2/3/4). The trailing-zero minute encoding is decoded ("4.2" = 04:20). The date-mislabel defect does not touch the data layer. Year-2 negative: the bundle ships exactly 365 rows per year. | candidate → **provisional** | `southernafrica2/REPORT.md` §Mauritius, `fit3/REPORT.md` §Mauritius |

## 2.4 South, Southeast, Central and East Asia, Russia (18)

| # | Row | What changed | Grade effect | Cite |
|---|---|---|---|---|
| 52 | Kazakhstan | **Year 6 plus the 48 N line witnessed from both sides**: Astana 2028, Karaganda 2028 (set B, >=48 N) and Shymkent 2028 (set A, <48 N). The deep span runs **2026-2100, nine sampled years, two cities, 6,580 rows, 99.7-100 pc within 1, MAE 0.295-0.350, no trend**, and a live 2100 render matched the harvest 36/36. Dhuhr carries a constant +1 model bias all century. The visitor-clock DST trap is re-measured at exactly +60. | A holds on a 75-year span | `centralasia2/REPORT.md` §Kazakhstan, `deep1/REPORT.md` §1 |
| 53 | Kyrgyzstan | **The ceiling is gone**: the documented JSON API serves any two-month window in any year. Full-year 2027 for Bishkek and Osh (365 each), **maghrib = sunset + 7 on 365/365**, ratio k 0.7766-0.7779 against 7/9, additive c 3.34-3.50 (the held 3.5 costs up to 1.7 points, a refinement). **Asr now has a measured margin: Hanafi ceil+1, 1.25 min after adhan's raw asr, 95.9 pc within 1**, where the record carries none. The record's ratio wording has its sign flipped; the magnitude is the rule. | provisional → **A candidate** (year-2 plus a 2027-2035 span) | `centralasia2/REPORT.md` §Kyrgyzstan, `deep1/REPORT.md` §2 |
| 54 | Uzbekistan | **Attribution settled against state authorship.** islom.uz is the publisher (private portal, 15.5/15.5 Hanafi); the state board adds +5 to dhuhr and disagrees at maghrib (+2) and isha (+3), serving one city, one day, ignoring every parameter. **"The numbers agree" is refuted at three of five prayers**, and the portal's `differ_minute` field is dead in the shipped bundle. | provisional holds; state-attribution defect closes as settled | `centralasia2/REPORT.md` §Uzbekistan |
| 55 | Tajikistan | **The archive exists and the window grammar decodes.** The month endpoint holds **143 months back to 2014-12 (4,343 days)**. Isha left bound = printed maghrib + 90 (90.3 pc exact); **dhuhr is a wall-clock constant in two eras, the change dated to 2019-07-01**, with an unrecorded 12:50 transitional month in October 2020; maghrib = sunset-bracket end +1. Fajr and asr do not decode (implied fajr 15.30-20.35 deg by month). The authority's homepage instants equal each window's left bound, so window-class converts with the existing consumer path. | candidate → **provisional** (window class decoded, two of six bounds hold) | `deep2/REPORT.md` §Tajikistan, `centralasia2/REPORT.md` §Tajikistan |
| 56 | Afghanistan | Image-only confirmed (zero fonts, nine rasters). **A 1400 SH monthly series is relocated**: 12 pages, one per Afghan solar month, one row per day, with a zawal column. It **matches the 1404 poster cell for cell**, which is a frozen generation from the same publisher, not a second witness. | candidate holds; no independent witness exists | `centralasia2/REPORT.md` §Afghanistan |
| 57 | Pakistan | **The first authority dated table ever found.** The federal register carries "Nizam-e-Salat Chart 2016 and Onward", Active since 2016-01-01: 366 rows, transcribed and validated. Method: fajr **18.00 floor** (17.95 -0.5 refines to 315/366), sunrise -0.5 floor, **asr Hanafi +2** (MWL 18/17 refuted by 58 minutes), maghrib sunset +5/+6, **dhuhr a two-phase clock 13:00/13:15 switching 15 April and 15 October (366/366)**, isha a **15-minute clock ladder of 19 steps** (best single angle 21.1 at 10.9 min rms). The chart is leap-anchored and **computed for the current year despite its title** (2026 scores 306, 2024 260, 2028 258). The 2026 unified calendar has not moved. | FALLBACK → **provisional** (authority, one year, method fitted) | `southasia2/REPORT.md` §Pakistan, `fit1/REPORT.md` §1 |
| 58 | Sri Lanka | **No regeneration, third observation.** Twelve zones still serve from uploads/2026/10; the thirteenth moved only to re-title the sheet and is **byte-identical** to round 1; Colombo September is 0/180 mismatches. | provisional holds; the lift stays open for a future year | `southasia2/REPORT.md` §Sri Lanka |
| 59 | Maldives | A community per-island annual table corroborates the object at **all 2,190 values within 2 minutes**, mean absolute error under half a minute on every column. It is **yearless**: a request for 2027 returns the same January slot, so 2027 is the same table read again and not year-2. The official PDF is still 403. | provisional holds; corroboration only, lift untouched | `southasia2/REPORT.md` §Maldives |
| 60 | Thailand | Nine provincial CICOT workbooks parsed, 365 rows each, and **the edition is stamped BE 2569 (2026)** by exact cross-match with a newly found 10-province national PDF. Each workbook prints both a normal-year and a leap-year block, so one capture covers two year lengths. | provisional holds; year-2 and the four unmeasured margins now fittable | `thmsg/REPORT.md` §Thailand |
| 61 | Malaysia | Three 2027 zone tables parsed (KL/Putrajaya, Labuan, five of nine Selangor districts). **Selangor moves from three zones to nine districts on 2027-01-01**, and the nine are not cosmetic (Gombak differs from Hulu Langat on 365/365 days). JAKIM's own feed still serves 2026. **New publisher: Kelantan's Jabatan Mufti** posts zon1/zon2 monthly tables on Facebook (authority by publisher), but the zon images were never saved to captures, so transcription is blocked; the KTN01 comparator excludes 20 deg by 5 minutes and shows the flagged +1 sits on subuh and syuruk together, closing "different recipe" in favour of a column or clock convention. | provisional holds; year-2 reachable, Kelantan unresolved | `thmsg/REPORT.md` §Malaysia, `fit10/REPORT.md` §2 |
| 62 | Indonesia | **Kemenag 20/18 confirmed by measurement**: 20 deg +2.0 (Jayapura +1.5) over 365 days and five cities, with SIHAT precomputed for 2026 only. **Muhammadiyah KHGT is a second national line**: 18/18 +1 at ceil, 100 pc within 1 on 1,116 rows across 2025-2035 and three latitudes, printing 7.8 min later at fajr every year with no drift. **The six-regency anomaly is 21/19 on both twilights and elevation-keyed**: threshold between Deiyai 1,718 m (plain) and Paniai 1,786 m, six members, no seventh in 516, and Muhammadiyah prints plain 18/18 at Puncak Jaya's own 3,396 m, so the rule is policy, never physics. Istiqlal runs AlAdhan ISNA 15/15. | candidate → **provisional** (measured pair plus a decade-deep second line) | `indonesia/REPORT.md` §3-4, `fit10/REPORT.md` §1, `deep3/REPORT.md` §1, `verify2/REPORT.md` §2 |
| 63 | Philippines | **Fitted, and the census lead corrected.** Davao is an **angle** method (fajr 18.1 +0.5, isha 16.7 +1.5, 540/540 within 1). BARMM is also an angle (Cotabato 17.5 -2, Marawi 17.7 -1, isha 18.1 -1, 174/174 each). A fixed interval cannot produce Davao's 64-69 minute span, and **the two regions' isha rules miss each other by 4 minutes on every row**, so there are two regional methods and they never merge. | candidate → **provisional** (Ramadan-only, two recipes) | `fit5/REPORT.md` §1 |
| 64 | China | Table negative but **the method is now quotable**: the norislam grid's own footnote states **15/15 Hanafi, dhuhr +5, maghrib +5, imsak -10**, while its query form still says 18/17. The 15-degree decision traces to an essay in the China Islamic Association's own journal (Zhongguo Musulin 2002 no. 6), and the live grid measures 15 deg (Lanzhou, 1 January: 07:00 printed, 06:59 at 15, 06:44 at 18). | FALLBACK holds; the shipped recipe gains a stated basis | `china/REPORT.md` §What is new 6 |
| 65 | Taiwan | **Verdict overturned.** 44 dated rows across three association editions plus the mosque's own poster: **fajr = sunrise - 70 (43/44), isha = maghrib + 90 (43/44), dhuhr = noon + 19 ceil, maghrib = sunset + 6.7 floor (1447 only), asr fixed 16:06 stepping by edition**. The rule is stable and the buffers are editorial: the maghrib allowance moves 4.5/5 to 6/6.5, and the 8-city offset table changed in every edition but two cells. | FALLBACK → **candidate** | `china/REPORT.md` §What is new 4, `fit3/REPORT.md` §Taiwan |
| 66 | Hong Kong | **The Trustees' print is three constructions on one sheet.** Page 1 is an angle table (fajr 18.5, isha 21.3); page 2 is fixed intervals (fajr sunrise-80, isha maghrib+80, **dhuhr a 13:00 clock**, Hanafi asr); the Masjidal feed takes page 1's fajr and page 2's isha and matches **neither page's dhuhr or maghrib** (worst column 49 minutes). The one durable cross-era result is fajr at 18.4 deg, 26 years apart. | the withdrawn A stays withdrawn, harder; row must state per-column provenance | `china/REPORT.md` §What confirms, `deep3/REPORT.md` §2 |
| 67 | Japan | **The Nagoya prize captured**: full-year PDF, 365 rows, yearless and 2019 vintage, fitting **18/17 Shafi at solar noon +-2.5 minutes with no margins**. Tokyo Camii adds monthly PDFs and a three-language stated method (sunrise -7, dhuhr +5, asr +5, maghrib +8, fajr and isha plain, 12:30 Jumu'ah written into Friday dhuhr). Sapporo gives two Ramadan years, Osaka a jama'ah-only schedule. | candidate holds; the recipe is now fit-ready, still no national body | `koreajapan/REPORT.md` §Japan |
| 68 | Korea (South) | **Year-1 complete plus a stated method**: the Korea Muslim Federation publishes a full-year PDF (2026-02 to 2027-01) naming **MWL at 37.6 N / 127.0 E with ceiling rounding**, 365 rows. The statement holds to +-1 minute on **2,153 of 2,184 values (98.6 pc)**, not to the minute; one typesetting slip is carried as printed. | candidate holds; two mawaqit captures become a national surface | `koreajapan/REPORT.md` §South Korea, `fit3/REPORT.md` §Korea |
| 69 | Russia (CDUM) | **The C23 "Surgut" row is Salekhard data**, which explains its 125-minute fit anomaly; real Surgut is absent from CDUM's web. St Petersburg (365) and Salekhard (365) are captured, Moscow is 365/365 byte-stable, and the DUM RF November PNG is banked. | A (DUM RT) holds; CDUM defect corrected | `centralasia/REPORT.md` §Russia, CONSOLIDATION `O1k-10` |

## 2.5 Americas (5)

| # | Row | What changed | Grade effect | Cite |
|---|---|---|---|---|
| 70 | United States | **15/15 is the default across three independent products, not one vendor's setting.** 134 mosques: **105 at 15/15 (78.4 pc)**, 111 with a 15-degree fajr, 17 in the 18-degree family, 40 Hanafi asr, and **zero fixed-interval isha**. Six Masjidal profiles captured at three years each move at most **0.03 degrees** across 2024-2026. Two new defect classes: the whole DST window printed on standard time with sunrise exempt (Toledo), and per-column transition-day rows (San Antonio). IANT's dpt feed and Masjidal widget contradict each other all 364 days (fajr +15.6, isha -10.5), and the live page wins. | candidate holds; mosaic conclusion firmer, published FCNA 15/15 still printed by almost nobody | `usmap/US-MAP-UPDATE.md` §1, `americas2/REPORT.md` §1 |
| 71 | Canada | **15/15 in print on three coasts, and FCNA's 13/13 at zero.** 26 mosques: **14 at 15/15 (53.8 pc)**, 20 with a 15-degree fajr, and **0 at 13/13**. Toronto's two largest mosques print isha as fixed intervals (**maghrib +80** exactly on 365/365, and **+90** on 345 days) against fajr 14.9 and 15.2. Kitchener pins isha at **22:10 for 89 consecutive days**. Saskatoon prints **+85, and +90 through Ramadan**. Six prairie installs print November (two to end-December) one hour late across both products. Quebec City's two mosques are literal 15/15 to 0.07 minutes, retiring the "image-only flagship" line. | candidate holds; the practice-versus-statement divergence is quantified | `usmap/US-MAP-UPDATE.md` §2, `americas2/REPORT.md` §2 |
| 72 | Mexico | **First dated Mexican rows.** Guadalajara's Masjidbox page gives **7 rows** (2026-11-09 to 11-15) with athan, iqamah and imsak/iftar, at the mosque's own place and clock, naming the MWL family. The platform's history walk does not reopen from the landing page. The record's "403" lead was the Centro Cultural Islamico de **Madrid**. | FALLBACK → **lead only** (a surface, not a series) | `americas2/REPORT.md` §3, `fit7/REPORT.md` §5 |
| 73 | Brazil | **The single-city carry becomes a 25-city verified surface**: IIB's keyless month API, **25 cities, 1,450 rows, 8,700 of 8,700 cells within 1 minute**, at MWL 18/17 Shafi with zero margins (8,503 exact). Manaus, Sao Paulo and Porto Alegre are perfect. | provisional holds; the single-city provenance flag clears | `fit5/REPORT.md` §3, `americas/REPORT.md` §5 |
| 74 | Suriname | **The retry is overturned and the isha is an interval.** The SMA Paramaribo sheet (29 rows, April-May 2025) is a real national recipe: **fajr 18.0, maghrib sunset +3.2, Hanafi asr, and isha = maghrib + 70 exactly on all 29 rows**. The held 18/18 fails on isha (18.0 fits at MAE 0.86, which is the angle reading of a fixed interval). A printed town ladder (Nickerie +8, Moengo -3, Albina -5) rides with it. | FALLBACK → **candidate** (image-class, seven months stale) | `americas2/REPORT.md` §5.2, `fit7/REPORT.md` §3 |

## 2.6 Oceania (4)

| # | Row | What changed | Grade effect | Cite |
|---|---|---|---|---|
| 75 | Australia | **The Amanahly day API serves any date**, so MIA Liverpool yields a full year (365 rows) rather than the recorded 30-day window; the tenant is hard-pinned and only one Amanahly mosque is publicly enumerable. Diyanet full-year 2026 for Broadmeadows, Preston and Brisbane adds 1,095 rows, and the two Melbourne grid points differ 0-1 minute. Auburn Gallipoli's own API prints Diyanet; Adelaide ISSA and the two AthanPlus monthlies add QLD, WA and SA dated tables. | candidate holds; per-state coverage and two fittable years | `oceania2/REPORT.md` §Australia, CONSOLIDATION `O1k-10` |
| 76 | New Zealand | **FIANZ is reborn, not dead.** `fianz.co.nz` is suspended but `fianz.com` serves 33 city Ramadan sheets with the stated offsets printed verbatim; Auckland, Wellington and Christchurch are transcribed (90 rows). **A contradiction is on record: the sheets start Ramadan 1 on Thursday 19 February 2026 while the Hilal Committee announces Friday 20 February**, the table-versus-announcer split inside one federation. | candidate holds; surface restored, contradiction added | `oceania2/REPORT.md` §New Zealand |
| 77 | Fiji | **Two standing authority editions confirmed and characterised.** The live widget and the printed sheet disagree by up to 9 minutes, stable across two months: dhuhr **+5 constant**, maghrib +2/+3, isha +6 to +10, fajr/sunrise/asr +-1. The sheet's maghrib **equals the widget's iqamah column daily**. December 2026 has posted (61 widget rows) and the December 2025 sheet (31 rows) gives year evidence. | provisional holds; **a fit must name its edition** (owner call) | `oceania2/REPORT.md` §Fiji, `centralasia/REPORT.md` §Fiji |
| 78 | New Caledonia | **The full year is captured (365 rows) and the isha reading is corrected.** Dhuhr and asr land on exact 5-minute marks all year (confirmed), but **isha pinned at 19:45 holds only 243/365 days**; 19:50, 19:55, 20:00, 20:05 and 20:15 cover the rest. Iqamah offsets are constant (+10, +10, +10, +5 asr, +10). | candidate holds; "isha pinned all year" refuted | `oceania2/REPORT.md` §Pacific retries |

---

# 3. GRADE MOVEMENTS IMPLIED

## 3.1 Rows that move up, with the span that justifies it

| Row | From | To | Span and test that carries it | Cite |
|---|---|---|---|---|
| Tunisia | provisional | **A** | 7 years, 2020-2026, 2,557 days, one frozen recipe, all five columns within 1 minute on 94.2 pc of days, never below 93.2 in a year. 2025 is a recomputation (133/365 rows repeat), so the span is not a reprint. | `deep2/REPORT.md` §Tunisia, `fit1/REPORT.md` §2 |
| Iceland | provisional | **A** | 3 years, 2 cities, 2,190 rows, 14.2/14.0, **100 pc within 1 on every row**. One clause removed (December +90) and one defect carried as a generator sweep (asr). | `deep3/REPORT.md` §3 |
| Germany / EU-Diyanet | **F** | **provisional** | The standing series the object lacked: 3 cities, 1,095 rows, one year, serving 18/16 plus the domestic temkin measured, not transplanted. Year-2 is the only remaining lift. | `fit4/REPORT.md` §4 |
| Netherlands | candidate | **provisional** | Published declaration plus 8 city-years, RMS 0.64-0.78, caps literal. Two years of tables (2025, 2026). | `benelux2/REPORT.md` §Netherlands |
| Estonia | candidate | **provisional** | 2 years, 2 cities, 1,460 rows, one parameter set, 1,460/1,460 rule classifications identical. | `deep3/REPORT.md` §4 |
| Mauritius | candidate | **provisional** | 1 full year, 365 rows, 15 fields, per-column fit, regional tiers encoded as fixed minutes. Year-2 is negative (bundle re-shipped per year). | `southernafrica2/REPORT.md` §Mauritius |
| Togo | candidate | **provisional** | 1 full year, 365 days, MWL 18/17 at zero margin, five columns within 1 minute every day. Community ceiling, so no A. | `fit2/REPORT.md` §3 |
| Senegal | candidate | **provisional** | 1 fitted year plus an edition-stable cross-check to 2011 (15 years), two dawn intervals and an exact isha interval. | `fit3/REPORT.md` §Senegal |
| Algeria | candidate | **provisional** | 2 Hijri years, 237 transcribed days, frozen recipe, free fit returns 17.80 in both years, autumn predicts Ramadan 30/30. A full year is the next test. | `fit2/REPORT.md` §1, `fit11/REPORT.md` §1 |
| Pakistan | **FALLBACK** | **provisional** | First authority table, 366 rows, method fitted to 366/366 on the clock columns and 315/366 exact at fajr. One year; the 2026 unified calendar would be a second artifact. | `southasia2/REPORT.md` §Pakistan |
| Taiwan | **FALLBACK** | **candidate** | 44 dated rows across 3 editions, interval rules stable, buffers editorial. Ramadan-only, no year-round table. | `fit3/REPORT.md` §Taiwan |
| Somalia / Somaliland | **FALLBACK** | **candidate** | 5 mosques, 1,830 rows, one cluster recipe. No authority surface. | `horneast2/REPORT.md` §Somalia |
| Djibouti | candidate | **provisional** | 6 mosques, 2,196 rows, 5 of 6 on one MWL recipe with zero margins. Platform tier caps it below A. | `fit5/REPORT.md` §East Africa |
| Mali | **FALLBACK** | **candidate** | 4 Bamako mosques, 1,460 rows, one clean mosque-year fitted (19/17-class with a transit+29 dhuhr). | `fit3/REPORT.md` §Mali |
| Guinea | **FALLBACK** | **candidate** | 1 mosque-year, 365 rows, but dhuhr pinned and fajr on an unexplained curve. The weakest promotion of the night. | `fit3/REPORT.md` §Guinea |
| Morocco | conditional A | **A** (pending the owner's one-line ruling) | The ministry's own rebuilt surface reproduces the recipe at 100 pc within 1 minute, which is the evidence the condition asked for. | `mideast/REPORT.md` §Morocco |

## 3.2 Rows held at grade on a wider span (no movement, deeper footing)

- **Oman.** 8 years, 2,920 rows, every column within 1 minute on every day, and the 2028 file repaired (`deep2/REPORT.md` §Oman, `gulf2/REPORT.md` §8).
- **Kazakhstan.** 75 years to 2100, 6,580 rows, no trend, a live 2100 render matching 36/36 (`deep1/REPORT.md` §1).
- **Saudi Arabia.** Four cities and six Hijri years to 1500H, 2,836 city-days, zero interval violations (`verify2/REPORT.md` §1, `deep1/REPORT.md` §3).
- **Kyrgyzstan.** Listed as an up-move above on the strength of year-2 plus 2027-2035; if the owner reads year-2 strictly, it is at least this: a span with a constant that moves 0.0014 in k (`deep1/REPORT.md` §2).
- **Singapore.** Year 4 (2027 PDF parsed), 20/18 ceiling unchanged (`thmsg/REPORT.md` §Singapore).
- **Bosnia.** Printed Takvim equals the API 365/365, and the 2027 echo is the frozen signature again (`balkans2/REPORT.md` §Bosnia).
- **Spain, Portugal.** Madrid frozen 2025-2026 and Portugal frozen 2023-2027 to 0.05 min, both now with a stated header (`iberia2/REPORT.md` §Spain, §Portugal).
- **Maldives, Sri Lanka.** Both corroborated, neither lifted: the Maldives surface is yearless, Sri Lanka did not regenerate (`southasia2/REPORT.md`).
- **Niger.** Seven served years are one table repeated, and the declared recipe is confirmed exactly (`deep2/REPORT.md` §Niger).
- **South Africa (Jamiat), Botswana, Kosovo, Slovenia.** Perpetual or frozen editions; the precedent governs, not a new measurement.
- **Egypt, Turkey, Kuwait, Qatar, Jordan.** Recipe checks at 100 pc within 1 minute on fresh rows (`mideast/REPORT.md`, `verify2/REPORT.md`).

## 3.3 Owner calls the evidence cannot settle

1. **Botswana.** 146 of 151 tables byte-identical 2021-2026. The grade-A year path is closed unless the owner rules a perpetual table a distinct generation, which would contradict T-668 #6986 (`southernafrica2/REPORT.md` §Botswana).
2. **Sri Lanka (ACJU).** The perpetual 12-zone artifact, third observation, still never regenerated. Same precedent question. The brief's "Maldives ACJU" is this object: ACJU is Sri Lanka's body (`southasia2/REPORT.md` §Sri Lanka).
3. **Algeria, the inverse case.** The 1448 book is **recomputed, not reprinted**: no Gregorian cell is shared with 1447 and the printed differences track the sun to 1.15 min. Ask the owner to confirm this does **not** trigger the frozen-generation precedent, which would otherwise block a real two-year span (`fit11/REPORT.md` §1).
4. **Belgium.** 2025 and 2026 print identical MM-DD times with baked DST dates, so the second year adds nothing and the window constants are day-of-year. The 17-degree refutation stands either way (`benelux2/REPORT.md` §Belgium).
5. **Fiji, two editions.** Authority output disagrees with itself by up to 9 minutes. Decide the edition the app belongs to, or add a version field so both coexist (`oceania2/REPORT.md` §Fiji).
6. **Yemen, two feeds.** Sanaa API and the recognised government's Aden surface are both captured, neither fitted. Name the one to fit (`gulf2/REPORT.md` §7).
7. **Morocco.** The conditional A's resolver has landed. The ruling itself is still the owner's (`mideast/REPORT.md` §Morocco, T-668 #6983).

---

# 4. SCHEMA ADDITIONS

Eight rule-forms the night forces. Each is stated with the measurement that requires it, because a
rule-form without its measurement is folklore (`night-summary/NIGHT-SUMMARY.md` §4).

| # | Rule-form | Where it lands | What forces it |
|---|---|---|---|
| 1 | **Clock ladder** | A dated value schedule with a step size and named switch dates, beside `twilightAngleRule` and never as a margin | Pakistan isha prints 11 values from 18:45 to 21:15 on a 15-minute grid across 19 switch dates, one a 30-minute drop on 1 October and one an upward step on 20 December while the sun still falls. Best single angle 21.1 at 10.9 min rms; the best computational approximation reproduces 233/366 (`southasia2/REPORT.md` §Pakistan, `fit1/REPORT.md` §1) |
| 2 | **Two-phase federal clock** | A wall-clock window pair with fixed calendar boundaries, evaluated before any angle logic | Pakistan dhuhr prints exactly 13:00 on 183 days and 13:15 on 183, switching 15 April and 15 October, 366/366 by rule. A quarter-snap of transit scores 0 (`fit1/REPORT.md` §1) |
| 3 | **Window grammar (interval pairs)** | A row of interval pairs, with the rule that the **left bound is the instant** | Tajikistan prints six windows per day, chained end to end (dhuhr ends 1 minute before asr on 698/743 days). Isha left = printed maghrib + 90 (90.3 pc), dhuhr a constant in two eras (740/740), and the authority's homepage instants equal each window's left bound (`deep2/REPORT.md` §Tajikistan, `centralasia2/REPORT.md` §Tajikistan) |
| 4 | **Two-dawn intervals** | Two dawn fields, a flag that the sunrise column is not sunrise, and an interval class for dawn | Senegal: Fajar = sunrise - 75.5 and Suba = sunrise - 60.5, both 365/365. The printed "sunrise" misses astronomical sunrise by up to 51 minutes, and the publisher computes one dawn and prints the other at +15 (`fit3/REPORT.md` §Senegal) |
| 5 | **Flat plateaus and substitution windows** | Per-prayer seasonal windows with measured boundaries beside the stated ones, plus a plateau value type | Belgium: 21 days flat at 23:26, 17 at 23:33, only the middle 65 tracking lat-45 (RMS 1.8), window ends 11 days past the printed "fin juillet". Any build must carry the plateaus, not a lat-45 formula (`benelux2/REPORT.md` §Belgium) |
| 6 | **Three-group offsets** | An offset group that binds several prayers to one constant | Serbia: fajr with sunrise, dhuhr alone, asr with maghrib and isha. Read per prayer the table looks like render damage, which is how the record filed it (`balkans2/REPORT.md` §Serbia) |
| 7 | **Elevation-keyed exception set** | A named exception set keyed to a publisher, never an elevation formula | Kemenag: six regencies at or above 1,786 m deepen **both** twilights by 1.0 deg (21/19). Deiyai at 1,718 m is untouched and there is no seventh member in 516. Muhammadiyah prints plain 18/18 at Puncak Jaya's own 3,396 m, so the rule is policy, not physics (`fit10/REPORT.md` §1, `indonesia/REPORT.md` §4.1) |
| 8 | **Edition identity (belongs-to-version)** | An `editionId` on the policy object, so two standing authority editions can coexist | Fiji: widget and sheet disagree by up to 9 minutes with a stable signature. New Zealand has the same shape (sheet says 19 February, Hilal Committee says 20) (`oceania2/REPORT.md` §Fiji, §New Zealand) |

Four supporting forms also land, each with its own evidence:

- **Isha as a printed interval**: Toronto +80 and +90, Saskatoon +85 (and +90 through Ramadan), Taiwan +90, Hong Kong +80, Venezuela +89, Niger +75, Suriname +70, Senegal +60. Two of them (Suriname, Venezuela) only became readable as intervals tonight (`usmap/US-MAP-UPDATE.md` §2, `fit7/REPORT.md` §3-4).
- **Summer caps**: Kitchener 22:10 for 89 days, Netherlands 03:30 and 23:30, Belarus 07:16 and 23:06, Glasgow 01:33 for 96 days. A cap is a bound with a date range, not an angle (`americas2/REPORT.md` §2.3, `benelux2/REPORT.md` §Netherlands, `nordics2/REPORT.md` §Belarus, `fit4/REPORT.md` §1).
- **Seasonal scheme swap**: Latvia 12/12 summer and 15/15 winter, Estonia month-fixed isha with a quarter-night fajr, Finland a stated 1/5 of night, Lithuania an 18/16 shape. A single frozen parameter set cannot express these publishers (`nordics2/REPORT.md`, `deep3/REPORT.md` §4).
- **Per-column rounding**: Tunisia needs dhuhr rounded and maghrib rounded up (81.8 pc under the record's mix against 94.2 under per-column rounding), Oman needs ceil on three columns. Rounding is part of the recipe, not a rendering detail (`deep2/REPORT.md` §Tunisia, §Oman).

One further rule the fits impose on the builder rather than the schema: **the publisher's engine is
part of the recipe**. A PrayTimes v2-family engine reproduces the mawaqit and Masjidbox tables at
zero margins, while adhan reports a phantom -1 minute dhuhr margin and a +-1.2 minute seasonal asr
skew on the same rows. A fit anchored on adhan over-specifies every platform recipe it touches, and
the first Americas pass did exactly that on Guatemala (`fit7/REPORT.md` §Cross-cutting,
`usmap/US-MAP-UPDATE.md` §3).

---

# 5. UNCHANGED BUT REINFORCED

One short list, for rows the night re-measured without moving.

- **LUPT uniformity.** ELM 365/365 and ICC 305/305 against ELM, MWH 27/30 field-days; the publisher now serves 2027-2076 from its own site (`ukscotland/REPORT.md` §Headline).
- **The UK mosaic.** 0 of 20 English towns follow LUPT and 20 of 20 print their own table, fajr -22 to +25 minutes against it; six recipe families, and school does not predict the family (`uktowns2/REPORT.md` §Headline, `fit12/REPORT.md` §Clusters).
- **The North American default.** 119 of 160 mosques at 15/15, 131 with a 15-degree fajr, zero at FCNA 13/13 (`usmap/US-MAP-UPDATE.md` §4).
- **Egypt.** 19.5/17.5, zero margins, 180/180 within 1 minute on a fresh Cairo month; the `:80` note is http-era legacy and the option value must carry the page's exact tatweel spelling (`mideast/REPORT.md` §Egypt).
- **Turkey, Kuwait, Qatar, Jordan.** 2026 re-captured, recipe checks at 100 pc within 1 minute, Jordan's maghrib +7 cliff holding on fresh days (`mideast/REPORT.md`).
- **Bangladesh, India, Nepal.** No authority table; the IFB schedule stays print-only, Kerala's source is named (Suprabhatham) and print-only, and `makkahmasjid.net` remains Garland, Texas (`southasia2/REPORT.md`).
- **Chile.** 18 cities re-captured, 540 rows, 0 mismatches, December still absent, Vina del Mar's link defect now three months old (`americas2/REPORT.md` §7).
- **Peru, Argentina, Colombia, Trinidad, Jamaica, Costa Rica, Panama, Ecuador.** Negatives, with the Jamaica traps (Kingston is Surrey, the JMC is Queens) and the Chaguanas -1h defect still live (`americas2/REPORT.md` §5, §10).
- **Australia's mosque layer, Tonga, French Polynesia, PNG, Solomon, Vanuatu, Samoa, Kiribati.** Negatives or calculator-class, re-confirmed (`oceania2/REPORT.md` §Pacific retries).
- **The three fixed-clock users** (Palestine, Lebanon, Niger's fixed +1) and the Ramadan-clock display rule in Morocco stand as recorded (`mideast/REPORT.md`, `gulf2/REPORT.md` §6).
- **The US/Canada dpt pool law.** The live-page gate holds, and a feed is not evidence until gated: Toledo shows the page can be a faithful render of a broken feed (`americas2/REPORT.md` §8).

---

# 6. WHERE THE LOG AND A REPORT DISAGREE

The report governs in every case. Five conflicts, plus two reconciliations that are not conflicts.

1. **New Zealand.** `NIGHT-SUMMARY.md` (drafted 20:52) records FIANZ's domain as suspended and the surface gone. `oceania2/REPORT.md` §New Zealand records the successor domain `fianz.com` live with 33 city sheets and 90 transcribed rows. **New Zealand keeps a surface.** The summary predates the wave's return.
2. **Five waves excluded from the summary.** `NIGHT-SUMMARY.md` §1 lists `fit4`, `fit6`, `fit8`, `fit9` and `oceania2` as still running and counts nothing from them. All five returned by 21:0x, and CONSOLIDATION carries their results. This diff uses the returns, so its counts exceed the summary's.
3. **Benin.** CONSOLIDATION `O1k-F11` summarises the verdict as "Kandi community, Cotonou absent". `fit11/REPORT.md` §2 is stricter: the table backs **no country row** at all until a Kandi publisher is found, because correcting the city to Kandi would invent a publisher. The report's reading is adopted.
4. **Suriname.** `americas2/REPORT.md` §5.2 fits isha at 18.0 deg with MAE 0.86. `fit7/REPORT.md` §3 measures **maghrib + 70 exactly on all 29 rows** and reads the 18.0 as the angle image of a fixed interval. The fit governs, and the record's 18/18 does not survive.
5. **Oman's asr.** `deep2/REPORT.md` §Oman describes correcting a held object from Hanafi to Shafi asr. The world table's Oman row **already carries Shafi**, so nothing changes on that field. The real corrections are the 51 repaired dhuhr cells and the CityID trap.
6. **Morocco** is a reconciliation, not a conflict: CONSOLIDATION calls the rebuilt portal the "conditional-A resolver", and `mideast/REPORT.md` supplies the measurement the condition named. The grade moves only when the owner rules.
7. **Thailand and Malaysia.** The summary's "held recipe, no re-fit" and the waves' "year-2 reachable" describe different things (a fit that did not run, and data that now exists). Both are recorded above without a grade claim.

Two record repairs fall out of the night and are not country rows: the Kyrgyz ratio's wording in the
record has its sign flipped (the magnitude is the rule), and `FIT-RULES.md` is missing at the path
two agents were given (`deep2/REPORT.md` §Honest negatives, `deep3/REPORT.md` §Missing input).

---

# 7. WHAT ADOPTION WOULD COST

Adoption is a record edit plus one fit queue, not a build. The cheapest closes, in order:

1. **Guatemala, Quebec City, Halifax** - one page load each for a second year at a fully determined recipe.
2. **Mauritius, Estonia, Iceland** - editions already in hand; only the grade line moves.
3. **Algeria** - one owner ruling on recomputation, then the 1447 books' remaining eight months.
4. **Germany** - one re-read after the portal rolls, for the year that lifts F to a real series.
5. **Pakistan** - one re-check of the 2026 unified calendar, the single largest watch item in the record.

The largest single-country change available anywhere in the census remains Pakistan flipping from
FALLBACK to a state timetable, and tonight it is half done: the authority chart exists, is fitted,
and only its twin-city 2026 edition has not published (`southasia2/REPORT.md` §Headline).

---

## Assumptions

- **The brief's "Maldives ACJU" is Sri Lanka's ACJU.** ACJU is the All Ceylon Jamiyyathul Ulama and the perpetual 12-zone artifact is Sri Lanka's; the Maldives has MUIS and no ACJU. Evidence: `southasia2/REPORT.md` §Sri Lanka against the record's Maldives row.
- **"Nigeria (whatever nigeria3 lands)" landed nothing.** The workspace holds captures and two fit scripts, `data/` is empty, and neither CONSOLIDATION nor any REPORT records a return, so the row is treated as a confirmed authority negative with leads only.
- **Mexico, Mauritania, Senegal, Mali, Guinea, Somalia, Djibouti, New Caledonia, Latvia and Lithuania are changed rows, not new ones.** The world table already carries a row for each (Latvia and Lithuania as one-line FALLBACK stubs). Only Guatemala, Honduras, Venezuela, Luxembourg and Belarus have no row at all.
- **Morocco's A is stated as "pending the owner's ruling".** The record itself makes the grade conditional, and the resolver supplies evidence rather than a decision.
- **Grade names follow the record's vocabulary**, so a community-tier fitted year is written "provisional" only where it has a full year and a fitted recipe, and "candidate" where either is missing.
