# O1h global simulation: every prayer-time methodology, naked, against every national recipe

Simulation year 2026 for forty-nine scored targets, and London scored on its 4,383 published days,
2027-2038. Every number in this file is emitted by `sim.mjs` from `scores.json`. The cell-by-cell
record is in `scores.json` and the aggregate record in `aggregates.json`.

## 1. What was measured

Twenty bodies were run stock, as each body publishes or as the bundled library implements it, at
each target's own coordinates in the target's own civil zone. Each body was scored against that
country's fitted recipe: the census angles, margins, rounding and high-latitude rule on the target
side, and for London the real published minutes of the London Unified Prayer Timetable.

The two sides are deliberately asymmetric. The target side carries everything the census measured,
including per-field rounding and minute margins. The method side carries only what the body itself
defines: the angle pair, the body's own interval or season curve, its rounding where the carrier
states one, and the library's stock high-latitude behaviour. No census margin, no per-country
adjustment and no fitted angle touches a method. A one-minute national margin that the target
carries and the method does not therefore reads as a one-minute deviation, which is the intended
result: the margin is configuration, and configuration is what a deployment adds afterwards.

**Prayers scored:** fajr and isha only. Asr is recorded as a school-match flag against the country's
school and is never scored in minutes. Dhuhr and maghrib are absent from the headline on purpose:
their national values are almost entirely margin (+1 to +10 minutes) plus a rounding direction, so
scoring them would rank bodies on bookkeeping rather than on astronomy, and a configuration layer
can carry them exactly.

## 2. The method side

| id | Angles / rule | Carrier in adhan 4.4.6 | Asr |
|---|---|---|---|
| mwl | 18 / 17 | preset MuslimWorldLeague | shafi |
| isna15 | 15 / 15 | preset NorthAmerica | shafi |
| isna2010 | 18 / 18 | constructed Other | shafi |
| ummalqura | 18.5 / maghrib+90, +120 Ramadan | preset UmmAlQura + Ramadan switch | shafi |
| egyptian | 19.5 / 17.5 | preset Egyptian | shafi |
| karachi | 18 / 18 | preset Karachi | hanafi |
| moonsighting | 18 / 18 + season curve + 1/7 above 55N | preset MoonsightingCommittee | shafi |
| diyanet-tr | 18 / 17 (temkin on other rows) | preset Turkey | shafi |
| diyanet-eu | 18 / 16 | constructed Other | shafi |
| mabims | 20 / 18 | constructed Other (Kemenag instance) | shafi |
| jakim | 18 / 18 | constructed Other | shafi |
| kuwait | 18 / 17.5 | preset Kuwait | shafi |
| qatar | 18 / maghrib+90 | preset Qatar | shafi |
| singapore | 20 / 18, ceiling | preset Singapore | shafi |
| dubai | 18.2 / 18.2 | preset Dubai | shafi |
| tehran | 17.7 / 14 (software default) | preset Tehran | shafi |
| fazilet-a | 19.8 / 17.8 effective | constructed Other | shafi |
| fazilet-b | 20.8 / 18.7 effective | constructed Other | shafi |
| ecfr | 18 / 17 | constructed Other | shafi |
| russia | 16 / 15 | constructed Other | shafi |

Every preset was used verbatim, which is why the carrier column matters: the Muslim World League,
ISNA, Egypt, Karachi, Kuwait, Qatar, Singapore, Dubai, Tehran and Turkey rows all come from the
library's own preset objects, temkin and adjustment fields included. Where a body has no preset the
harness built an `Other` parameter object from the body's own documented pair, which implements the
body rather than modifying it.

Two body-internal rules were implemented because they belong to the method itself:

- **Umm al-Qura** adds 120 minutes to maghrib inside Ramadan and 90 outside. Ramadan 1447 was taken
  as **2026-02-18 through 2026-03-19, thirty days**, per Umm al-Qura's own calendar. For the London
  years the harness used the arithmetic Hijri calendar with its epoch shifted onto that same
  Umm al-Qura date, because the record fixes only 1447. The arithmetic calendar runs about five days
  late unshifted, and the shift keeps the twelve later years within a few days of the real calendar.
- **Karachi** runs the Hanafi Asr, as the brief fixes, although `methods.json` records the pair as
  Shafi. The conflict is recorded here and nowhere else. Asr is not scored.

No fajr or isha margin was applied to any method. The one candidate was ECFR's plus or minus two
minutes from the Fiqh Academy resolution, and it was dropped because the same resolution's offset is
absent from the MWL preset that the brief fixes as the MWL method. Applying it to one and not to the
other would decide the ranking by a bookkeeping asymmetry instead of by astronomy. Every method
therefore differs from its neighbours only in its angles, its interval, its curve and its rounding.

## 3. The target side and its coverage

Forty-nine targets were scored:

- 45 rows from `policy-layer.v2.4.json`: 44 computed from their own fitted angles, margins, per-field
  rounding, high-latitude kind and clock mode, and London computed against the real published minutes.
  Malaysia is among the 44, scored at the WLY01 zone point the record carries, because that object's
  own reference is a zone table and WLY01 is the federation's first zone.
- 4 community rows that exist only in `countries.json` (Indonesia, Pakistan, India, Nigeria). They
  carry no margins and no rounding, so the harness applied zero margins and nearest rounding, which
  is the rule the constraints fix for any body that documents no rounding.

Twenty-four of the seventy-three targets carry no recipe score, and each is excluded for a stated
reason.

**Four excluded forms** (no angle exists to score, so approximating one would invent the target):

- SI-VAKTIJA: seasonalSweep. A per-day hand-tuned angle curve with clamps and no angle pair behind it, so approximating it into angles would invent the target
- UA-DUMU: intervalTable. Fajr is sunrise minus 100 minutes every day and isha is maghrib plus a dated interval ramp of 90 to 100 minutes, so no angle exists to score
- AT-IZW: seasonalSweep. A per-day sweep from about 15.6 degrees in winter to about 11.3 at the solstice, which a frozen pair cannot express
- FR-GMS: seasonalSweep. Fajr sweeps 18 to 12 degrees and isha 16 to 11.5 over the year, and no frozen adhan parameter set encodes it

**Nineteen targets carry no reference point in the record** and cannot be scored at a coordinate:

EU-DIYANET-UNIFIED, JAMIAT-KZN, FAZILET-WORLD, FAZILET-OTTOMAN, NO-RABITA, NO-MAWAQEET, EE-EIC, SE-MOSQUE, FI-PORTAL, BR-IIB, DJ-COMMUNITY, KE-JAMIA, PH-NCMF, AU-UMA, NZ-FIANZ, FJ-FML, TJ-SHURO, TT-MASJIDBOX, RU-CDUM

Their references are zone tables whose per-city coordinates were never carried (Fazilet's 110 cities,
JAMIAAT's 494 towns, CDUM's 21 cities, Norway's 4, Djibouti's 6, Trinidad's 4) or point objects the
record marks as not captured. Three of the nineteen are the Fazilet and Diyanet-European schemes
themselves, which would in any case be self-comparisons. Inventing a city coordinate would have put a
fabricated number in the decision table, so they are absent from every aggregate and named here.

**One further exclusion:** CI-COSIM (Cote d'Ivoire) carries coordinates but no fitted rule, because
the census could not fit it. There is nothing to score against.

**Coverage:** the scored targets carry **1527.9 million** Muslims under the one-row-per-country
weighting rule described below. The nineteen unscored targets are mostly small or duplicated
populations. The largest single omission is Tanzania at 19.4 million, which appears inside the Southern
Africa federation row rather than as its own object.

## 4. The decision table

Weights are Muslims per country from `POPULATIONS.md`. Where one country has two scored rows (Greece,
Russia, the United Kingdom) the population is carried once, by the highest-grade row, so no country is
counted twice. Combined deviation is the mean of the fajr and isha mean absolute deviations, in minutes
of the country's own civil clock.

| # | Method | Weighted all | Rank | Excl. PK+IN | Rank | Authorities | Rank | Unweighted | Within 2 min |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | ISNA 2010 statement (18/18) | 3.38 | 1 | 4.71 | 2 | 5.22 | 5 | 9.20 | 8 |
| 2 | Karachi, Hanafi Asr (18/18) | 3.38 | 2 | 4.71 | 3 | 5.22 | 6 | 9.20 | 8 |
| 3 | JAKIM (18/18) | 3.38 | 3 | 4.71 | 4 | 5.22 | 7 | 9.20 | 8 |
| 4 | Kuwait Awqaf (18/17.5) | 3.72 | 4 | 4.70 | 1 | 5.00 | 1 | 8.84 | 3 |
| 5 | Dubai AWQAF (18.2/18.2) | 3.91 | 5 | 5.08 | 8 | 5.63 | 8 | 9.76 | 8 |
| 6 | Muslim World League (18/17) | 4.22 | 6 | 4.93 | 5 | 5.12 | 2 | 8.71 | 9 |
| 7 | Diyanet domestic (18/17) | 4.22 | 7 | 4.93 | 6 | 5.12 | 3 | 8.71 | 9 |
| 8 | ECFR (18/17) | 4.22 | 8 | 4.93 | 7 | 5.12 | 4 | 8.71 | 9 |
| 9 | Moonsighting Committee (18 + season curve) | 5.05 | 9 | 5.97 | 9 | 7.03 | 11 | 10.81 | 0 |
| 10 | Egyptian General Authority (19.5/17.5) | 5.87 | 10 | 6.26 | 10 | 7.92 | 13 | 11.94 | 2 |
| 11 | Diyanet European (18/16) | 6.12 | 11 | 6.62 | 11 | 6.60 | 10 | 9.60 | 3 |
| 12 | Fazilet Profile A (19.8/17.8) | 6.26 | 12 | 6.81 | 12 | 8.95 | 14 | 12.95 | 4 |
| 13 | MUIS Singapore (20/18, ceiling) | 6.47 | 13 | 7.10 | 13 | 9.40 | 15 | 13.53 | 4 |
| 14 | MABIMS / Kemenag (20/18) | 6.52 | 14 | 7.17 | 14 | 9.66 | 16 | 13.70 | 4 |
| 15 | Qatar MOI (18, isha +90) | 6.97 | 15 | 8.06 | 15 | 6.05 | 9 | 9.64 | 1 |
| 16 | Umm al-Qura (18.5, isha interval) | 8.71 | 16 | 9.52 | 16 | 7.83 | 12 | 11.45 | 1 |
| 17 | Fazilet Profile B (20.8/18.7) | 9.88 | 17 | 10.40 | 17 | 12.89 | 19 | 17.52 | 0 |
| 18 | Tehran (17.7 / 14) | 10.81 | 18 | 10.96 | 18 | 10.67 | 17 | 13.12 | 0 |
| 19 | Spiritual Administration of Russia (16/15) | 12.54 | 19 | 12.70 | 19 | 12.54 | 18 | 14.21 | 0 |
| 20 | ISNA / FCNA 2017 (15/15) | 14.98 | 20 | 15.15 | 20 | 15.14 | 20 | 16.14 | 0 |

**Reading the four columns.** The first is the headline and ranks by population, so Indonesia,
Pakistan, India, Bangladesh and Nigeria decide most of it. The second removes Pakistan and India,
whose targets are the community 18/18 Hanafi practice rather than a state authority: they are 433
million people held at zero by every 18/18 row, and removing them promotes Kuwait to first at 4.70
with the 18/18 row second at 4.71, a gap of one hundredth of a minute. The third restricts to the
targets the census graded A or provisional. There the 18/17 family edges ahead at 5.12 against 5.22,
so the authorities prefer a seventeen-degree isha and the population prefers eighteen. The fourth
weighs every country equally, which is how the small European and island targets get a vote, and it
moves the 18/17 family above Kuwait.

Three findings survive all four columns:

- **Fajr has one answer.** 18 degrees at 3.30 minutes is the best or joint-best fajr in the table.
  Every other choice is worse, and the losses are large: 18.5 is 4.42, 19.5 is 7.14, 20 is 8.96,
  20.8 is 12.99, 16 is 11.63 and 15 is 16.20.
- **Isha has one answer, and it is also 18.** 18 degrees at 3.56 minutes beats 17.5 at 4.28, 17 at
  5.35 and 15 at 13.69.
- **The 18/18 row wins on both halves**, and the three bodies that carry it -- the ISNA 2010
  statement, Karachi and JAKIM -- are the same geometry and therefore the same score to two decimals.
  Their ranking is a tie on minutes and must be broken on something other than astronomy.

The spread from first to last is 11.60 minutes. The top four distinct pairs -- 18/18, 18/17.5, 18.2
and 18/17 -- sit inside 0.84 minutes of each other, which is less than the rounding granularity of
most national tables.

## 5. Natural constituency

Countries where the method is within two minutes mean deviation on **both** fajr and isha:

- **ISNA 2010 statement (18/18)** (8): JERUSALEM-AWQAF, AE-AWQAF, TN-INM, OM-MARA, LY-MUAZZIN, JO-AWQAF, PK-DEFACTO, IN-DEFACTO
- **Karachi, Hanafi Asr (18/18)** (8): JERUSALEM-AWQAF, AE-AWQAF, TN-INM, OM-MARA, LY-MUAZZIN, JO-AWQAF, PK-DEFACTO, IN-DEFACTO
- **JAKIM (18/18)** (8): JERUSALEM-AWQAF, AE-AWQAF, TN-INM, OM-MARA, LY-MUAZZIN, JO-AWQAF, PK-DEFACTO, IN-DEFACTO
- **Kuwait Awqaf (18/17.5)** (3): KW-AJIRI, BG-SOFIA, CY-KKTC
- **Dubai AWQAF (18.2/18.2)** (8): JERUSALEM-AWQAF, AE-AWQAF, TN-INM, OM-MARA, LY-MUAZZIN, JO-AWQAF, PK-DEFACTO, IN-DEFACTO
- **Muslim World League (18/17)** (9): TR-DIYANET-DOMESTIC, GR-ATHENS, GR-KOMOTINI, BG-SOFIA, IQ-DIWAN, IT-UCOII, CY-KKTC, ES-CCIM, NG-SPA
- **Diyanet domestic (18/17)** (9): TR-DIYANET-DOMESTIC, GR-ATHENS, GR-KOMOTINI, BG-SOFIA, IQ-DIWAN, IT-UCOII, CY-KKTC, ES-CCIM, NG-SPA
- **ECFR (18/17)** (9): TR-DIYANET-DOMESTIC, GR-ATHENS, GR-KOMOTINI, BG-SOFIA, IQ-DIWAN, IT-UCOII, CY-KKTC, ES-CCIM, NG-SPA
- **Moonsighting Committee (18 + season curve)** (0): none
- **Egyptian General Authority (19.5/17.5)** (2): EG-ESA, ME-IZMR
- **Diyanet European (18/16)** (3): YE-AWQAF-SANAA, BA-RIJASET, KG-MUFTIYAT
- **Fazilet Profile A (19.8/17.8)** (4): EG-ESA, LK-ACJU, TH-CICOT, ID-KEMENAG
- **MUIS Singapore (20/18, ceiling)** (4): LK-ACJU, TH-CICOT, SG-MUIS, ID-KEMENAG
- **MABIMS / Kemenag (20/18)** (4): LK-ACJU, TH-CICOT, SG-MUIS, ID-KEMENAG
- **Qatar MOI (18, isha +90)** (1): QA-MOI
- **Umm al-Qura (18.5, isha interval)** (1): SA-KACST
- **Fazilet Profile B (20.8/18.7)** (0): none
- **Tehran (17.7 / 14)** (0): none
- **Spiritual Administration of Russia (16/15)** (0): none
- **ISNA / FCNA 2017 (15/15)** (0): none

## 6. Indonesia, broken out

Kemenag's target-side rule is 20/18 with zero margins and no rounding direction: that is what
`countries.json` and the world table carry, and `policy-layer.v2.4.json` has no Indonesian object at
all. The +3 minute margins and per-field rounding that the method catalog records for Kemenag were
measured through a third-party carriage and exist only on the method side of this study, so they cannot
be scored against. The naked MABIMS pair is also 20/18 and rounds nearest, so the MABIMS row therefore
reproduces the target to the minute by construction. That zero is not a finding about Indonesia. It is
the statement that Kemenag's published pair, run with no national margins, is exactly the shared MABIMS
pair. The real Indonesian result is every other column: what each body costs against 20/18.

| Method | Fajr mean | Fajr worst | Fajr within 2 min % | Isha mean | Isha worst | Isha within 2 min % |
|---|---:|---:|---:|---:|---:|---:|
| MABIMS / Kemenag (20/18) | 0.00 | 0.0 | 100.0 | 0.00 | 0.0 | 100.0 |
| MUIS Singapore (20/18, ceiling) | 0.48 | 1.0 | 100.0 | 0.45 | 1.0 | 100.0 |
| Fazilet Profile A (19.8/17.8) | 0.87 | 1.0 | 100.0 | 0.84 | 1.0 | 100.0 |
| Egyptian General Authority (19.5/17.5) | 2.08 | 3.0 | 91.5 | 2.10 | 3.0 | 90.1 |
| Fazilet Profile B (20.8/18.7) | 3.39 | 4.0 | 0.0 | 2.98 | 4.0 | 6.3 |
| ISNA 2010 statement (18/18) | 8.42 | 10.0 | 0.0 | 0.00 | 0.0 | 100.0 |
| Karachi, Hanafi Asr (18/18) | 8.42 | 10.0 | 0.0 | 0.00 | 0.0 | 100.0 |
| JAKIM (18/18) | 8.42 | 10.0 | 0.0 | 0.00 | 0.0 | 100.0 |
| Dubai AWQAF (18.2/18.2) | 7.62 | 9.0 | 0.0 | 0.86 | 1.0 | 100.0 |
| Moonsighting Committee (18 + season curve) | 8.42 | 10.0 | 0.0 | 0.09 | 1.0 | 100.0 |
| Kuwait Awqaf (18/17.5) | 8.42 | 10.0 | 0.0 | 2.10 | 3.0 | 90.1 |
| Muslim World League (18/17) | 8.42 | 10.0 | 0.0 | 4.23 | 5.0 | 0.0 |
| Diyanet domestic (18/17) | 8.42 | 10.0 | 0.0 | 4.23 | 5.0 | 0.0 |
| ECFR (18/17) | 8.42 | 10.0 | 0.0 | 4.23 | 5.0 | 0.0 |
| Diyanet European (18/16) | 8.42 | 10.0 | 0.0 | 8.48 | 10.0 | 0.0 |
| Qatar MOI (18, isha +90) | 8.42 | 10.0 | 0.0 | 17.74 | 21.0 | 0.0 |
| Umm al-Qura (18.5, isha interval) | 6.29 | 7.0 | 0.0 | 20.21 | 51.0 | 0.0 |
| Tehran (17.7 / 14) | 9.75 | 11.0 | 0.0 | 16.90 | 19.0 | 0.0 |
| Spiritual Administration of Russia (16/15) | 16.92 | 19.0 | 0.0 | 12.69 | 14.0 | 0.0 |
| ISNA / FCNA 2017 (15/15) | 21.12 | 23.0 | 0.0 | 12.69 | 14.0 | 0.0 |

## 7. London, against the published minutes

The London Unified Prayer Timetable is not a formula: its fajr and isha are date-keyed integer tables
recovered from the Hizbul Ulama 1987-88 observations. Against 4,383 real published days nineteen of the
twenty bodies fail, and the reason is structural rather than a matter of angles.

| Method | Fajr mean | Fajr worst | Fajr within 2 min % | Isha mean | Isha worst | Isha within 2 min % |
|---|---:|---:|---:|---:|---:|---:|
| Moonsighting Committee (18 + season curve) | 2.95 | 8.0 | 43.4 | 4.37 | 11.0 | 24.1 |
| ISNA / FCNA 2017 (15/15) | 15.91 | 86.0 | 23.0 | 30.74 | 127.0 | 22.3 |
| Qatar MOI (18, isha +90) | 41.21 | 132.0 | 0.0 | 10.74 | 24.0 | 8.4 |
| Spiritual Administration of Russia (16/15) | 23.73 | 113.0 | 22.0 | 30.74 | 127.0 | 22.3 |
| Umm al-Qura (18.5, isha interval) | 45.31 | 136.0 | 0.0 | 12.19 | 35.0 | 7.0 |
| Tehran (17.7 / 14) | 38.70 | 130.0 | 0.0 | 23.43 | 84.0 | 9.9 |
| Diyanet European (18/16) | 41.21 | 132.0 | 0.0 | 41.98 | 155.0 | 0.0 |
| Muslim World League (18/17) | 41.21 | 132.0 | 0.0 | 51.32 | 165.0 | 0.0 |
| Diyanet domestic (18/17) | 41.21 | 132.0 | 0.0 | 51.32 | 165.0 | 0.0 |
| ECFR (18/17) | 41.21 | 132.0 | 0.0 | 51.32 | 165.0 | 0.0 |
| Kuwait Awqaf (18/17.5) | 41.21 | 132.0 | 0.0 | 55.65 | 169.0 | 0.0 |
| ISNA 2010 statement (18/18) | 41.21 | 132.0 | 0.0 | 59.85 | 173.0 | 0.0 |
| Karachi, Hanafi Asr (18/18) | 41.21 | 132.0 | 0.0 | 59.85 | 173.0 | 0.0 |
| JAKIM (18/18) | 41.21 | 132.0 | 0.0 | 59.85 | 173.0 | 0.0 |
| Dubai AWQAF (18.2/18.2) | 42.87 | 134.0 | 0.0 | 61.47 | 175.0 | 0.0 |
| Egyptian General Authority (19.5/17.5) | 53.16 | 146.0 | 0.0 | 55.65 | 169.0 | 0.0 |
| Fazilet Profile A (19.8/17.8) | 55.44 | 148.0 | 0.0 | 58.19 | 172.0 | 0.0 |
| MABIMS / Kemenag (20/18) | 56.95 | 150.0 | 0.0 | 59.85 | 173.0 | 0.0 |
| MUIS Singapore (20/18, ceiling) | 56.45 | 150.0 | 0.0 | 60.36 | 174.0 | 0.0 |
| Fazilet Profile B (20.8/18.7) | 62.86 | 156.0 | 0.0 | 65.57 | 253.0 | 0.0 |

**One method survives, and it is the curve.** Moonsighting tracks the published minutes to 3.0 on fajr
and 4.4 on isha across 4,383 days, and it does so precisely on the days that break every other body.
On 2027-06-21 the table prints 02:40 and 22:42 and Moonsighting prints 02:43 and 22:42, while the Muslim
World League cannot reach 18 degrees, clamps to a night portion and prints 01:02 for both prayers. The
curve and the table are the same family of method, which is why one of them reproduces the other at a
latitude where no angle exists.

**The remaining gap is still a table.** Even Moonsighting lands inside two minutes on only 43 percent
of fajr days and 24 percent of isha days, so a London deployment still needs the interval table. The
difference is that one world body is in the same family as the table and the rest are not: the second
best is 23.3 minutes out on average and the median method is 47.3. Any global body offered for the
United Kingdom has to be judged on this target alone, and only one of the twenty is a candidate.

## 8. Per-country winner

| Target | Grade | Pop (m) | Best method | Combined | Second | Combined |
|---|---|---:|---|---:|---|---:|
| EG-ESA | A | 87.5 | Egyptian General Authority (19.5/17.5) | 0.00 | Fazilet Profile A (19.8/17.8) | 1.53 |
| MA-HABOUS | A | 36.4 | Egyptian General Authority (19.5/17.5) | 1.98 | Muslim World League (18/17) | 3.49 |
| LK-ACJU | provisional | 2.1 | MUIS Singapore (20/18, ceiling) | 0.45 | Fazilet Profile A (19.8/17.8) | 0.93 |
| TH-CICOT | provisional | 3.6 | MUIS Singapore (20/18, ceiling) | 0.22 | Fazilet Profile A (19.8/17.8) | 0.65 |
| KW-AJIRI | provisional | 2.2 | Kuwait Awqaf (18/17.5) | 0.26 | Muslim World League (18/17) | 1.52 |
| ME-IZMR | provisional | 0.12 | Egyptian General Authority (19.5/17.5) | 1.36 | Fazilet Profile A (19.8/17.8) | 1.42 |
| YE-AWQAF-SANAA | provisional | 26.8 | Diyanet European (18/16) | 0.00 | Muslim World League (18/17) | 2.20 |
| JERUSALEM-AWQAF | provisional | 4.3 | ISNA 2010 statement (18/18) | 0.00 | Karachi, Hanafi Asr (18/18) | 0.00 |
| AE-AWQAF | A | 6.3 | Dubai AWQAF (18.2/18.2) | 0.50 | ISNA 2010 statement (18/18) | 0.51 |
| BA-RIJASET | provisional | 2 | Diyanet European (18/16) | 0.00 | Muslim World League (18/17) | 3.43 |
| BE-EMB | provisional | 0.88 | Muslim World League (18/17) | 13.87 | Diyanet domestic (18/17) | 13.87 |
| TN-INM | provisional | 10.2 | ISNA 2010 statement (18/18) | 0.48 | Karachi, Hanafi Asr (18/18) | 0.48 |
| KZ-MUFTIYAT | A | 13.2 | ISNA / FCNA 2017 (15/15) | 9.12 | Moonsighting Committee (18 + season curve) | 13.75 |
| KG-MUFTIYAT | provisional | 5.5 | Diyanet European (18/16) | 0.66 | Muslim World League (18/17) | 3.24 |
| MV-MUIS | provisional | 0.37 | Dubai AWQAF (18.2/18.2) | 2.88 | ISNA 2010 statement (18/18) | 3.72 |
| SG-MUIS | A | 0.92 | MUIS Singapore (20/18, ceiling) | 0.98 | MABIMS / Kemenag (20/18) | 1.49 |
| MY-JAKIM | provisional | 20.1 | ISNA 2010 statement (18/18) | 2.47 | Karachi, Hanafi Asr (18/18) | 2.47 |
| TR-DIYANET-DOMESTIC | A | 81.2 | Muslim World League (18/17) | 0.00 | Diyanet domestic (18/17) | 0.00 |
| GB-WIFAQUL-ULAMA | provisional | 4 | Qatar MOI (18, isha +90) | 7.16 | Umm al-Qura (18.5, isha interval) | 9.75 |
| IS-FELAG | provisional | 0.001 | ISNA / FCNA 2017 (15/15) | 11.15 | Spiritual Administration of Russia (16/15) | 17.13 |
| GR-ATHENS | provisional | 0.31 | Muslim World League (18/17) | 0.00 | Diyanet domestic (18/17) | 0.00 |
| GR-KOMOTINI | provisional | 0.31 | Muslim World League (18/17) | 0.00 | Diyanet domestic (18/17) | 0.00 |
| BG-SOFIA | provisional | 0.86 | Kuwait Awqaf (18/17.5) | 1.67 | Muslim World League (18/17) | 1.68 |
| GB-LONDON-INTERVAL-TABLE | A | 4 | Moonsighting Committee (18 + season curve) | 3.66 | ISNA / FCNA 2017 (15/15) | 23.33 |
| OM-MARA | A | 2.4 | ISNA 2010 statement (18/18) | 0.49 | Karachi, Hanafi Asr (18/18) | 0.49 |
| CZ-CENTRUM | A | 0.03 | Moonsighting Committee (18 + season curve) | 17.51 | ISNA / FCNA 2017 (15/15) | 25.30 |
| CL-CIS | provisional | 0.004 | ISNA 2010 statement (18/18) | 3.42 | Karachi, Hanafi Asr (18/18) | 3.42 |
| SA-KACST | A | 31.5 | Umm al-Qura (18.5, isha interval) | 0.52 | Qatar MOI (18, isha +90) | 2.38 |
| IQ-DIWAN | provisional | 39 | Muslim World League (18/17) | 0.26 | Diyanet domestic (18/17) | 0.26 |
| HK-MASJIDAL | provisional | 0.3 | Dubai AWQAF (18.2/18.2) | 3.01 | ISNA 2010 statement (18/18) | 3.74 |
| BD-IFB | provisional | 150.8 | Dubai AWQAF (18.2/18.2) | 2.08 | ISNA 2010 statement (18/18) | 2.10 |
| LY-MUAZZIN | provisional | 6.6 | Dubai AWQAF (18.2/18.2) | 0.58 | ISNA 2010 statement (18/18) | 1.65 |
| JO-AWQAF | A | 10.2 | ISNA 2010 statement (18/18) | 0.53 | Karachi, Hanafi Asr (18/18) | 0.53 |
| IR-NATIONAL | provisional | 85.7 | Tehran (17.7 / 14) | 0.05 | Moonsighting Committee (18 + season curve) | 1.45 |
| SD-MINISTRY | provisional | 38.6 | Qatar MOI (18, isha +90) | 1.91 | Umm al-Qura (18.5, isha interval) | 2.04 |
| IT-UCOII | candidate | 3 | Muslim World League (18/17) | 0.00 | Diyanet domestic (18/17) | 0.00 |
| RU-DUMRT | A | 15 | Diyanet European (18/16) | 5.15 | Tehran (17.7 / 14) | 6.69 |
| CY-KKTC | provisional | 0.28 | Kuwait Awqaf (18/17.5) | 1.45 | Muslim World League (18/17) | 1.72 |
| PT-HSALAH-HUB | A | 0.04 | Tehran (17.7 / 14) | 4.72 | Moonsighting Committee (18 + season curve) | 7.87 |
| ES-CCIM | A | 2.5 | Muslim World League (18/17) | 0.75 | Diyanet domestic (18/17) | 0.75 |
| UZ-ISLOM | provisional | 29.9 | ISNA / FCNA 2017 (15/15) | 3.11 | Spiritual Administration of Russia (16/15) | 3.12 |
| XK-BIK | provisional | 1.7 | ISNA 2010 statement (18/18) | 9.08 | Karachi, Hanafi Asr (18/18) | 9.08 |
| NE-BUTIN | A | 21.1 | Moonsighting Committee (18 + season curve) | 1.03 | ISNA 2010 statement (18/18) | 1.24 |
| RU-DUMRF-MOSCOW | provisional | 15 | Spiritual Administration of Russia (16/15) | 16.04 | Diyanet European (18/16) | 17.69 |
| QA-MOI | A | 1.6 | Qatar MOI (18, isha +90) | 1.00 | Umm al-Qura (18.5, isha interval) | 3.36 |
| ID-KEMENAG | candidate (published parameters, MABIMS family) | 249.8 | MABIMS / Kemenag (20/18) | 0.00 | MUIS Singapore (20/18, ceiling) | 0.46 |
| PK-DEFACTO | community de facto (Karachi method) | 233 | ISNA 2010 statement (18/18) | 0.00 | Karachi, Hanafi Asr (18/18) | 0.00 |
| IN-DEFACTO | community de facto (Karachi method) | 200 | ISNA 2010 statement (18/18) | 0.00 | Karachi, Hanafi Asr (18/18) | 0.00 |
| NG-SPA | community (national SPA reads MWL 18/17) | 96 | Muslim World League (18/17) | 0.00 | Diyanet domestic (18/17) | 0.00 |

## 9. Ranking

Ordered by the population-weighted combined deviation over all scored targets. Every line states what
the method is good at and bad at, on the numbers above.

**1. ISNA 2010 statement (18/18)** -- 3.38 minutes weighted (4.71 without Pakistan and India, 5.22 on authorities only, rank 5 there). Wins both halves of the score, 3.30 minutes on fajr and 3.56 on isha, because 18/18 is the pair the world itself prints on both prayers. Its eight within-two countries are the 18/18 and 18/18-plus-margin tables. What it is bad at is everything else: the row is geometry with no publishing body behind it, and it carries no answer for the interval half of the world or for London.

**2. Karachi, Hanafi Asr (18/18)** -- 3.38 minutes weighted (4.71 without Pakistan and India, 5.22 on authorities only, rank 6 there). Identical geometry to ISNA-2010 and the same 3.38, with the Hanafi Asr that matches only seven of the forty-nine targets. Strongest in Pakistan, India and the Levant. It inherits the whole 18/18 constituency and buys nothing on isha that the plain 18-degree instant does not already give.

**3. JAKIM (18/18)** -- 3.38 minutes weighted (4.71 without Pakistan and India, 5.22 on authorities only, rank 7 there). The third copy of the 18/18 row, at the same 3.38 and the same eight countries, so its position measures the pair rather than any Malaysian rule. It is a national zone table that happens to publish the winning angles, and the margins and ceilings that make it exact in Malaysia are absent from the score.

**4. Kuwait Awqaf (18/17.5)** -- 3.72 minutes weighted (4.70 without Pakistan and India, 5.00 on authorities only, rank 1 there). Second on the headline at 3.72 and first once Pakistan and India are removed, 4.70 against 4.71. Keeps the 18-degree fajr at 3.30 and moves isha to 17.5 for 4.28, which is the best non-18 compromise in the table. Its weakness is that 17.5 sits between the two isha families, so it is inside two minutes in only three countries.

**5. Dubai AWQAF (18.2/18.2)** -- 3.91 minutes weighted (5.08 without Pakistan and India, 5.63 on authorities only, rank 8 there). Fifth overall at 3.91 with the most balanced pair in the table, 3.72 on fajr and 4.18 on isha, and eight countries inside two minutes. It is the best answer of any body that does not simply publish 18/18. Its drawback is that the 18.2 pair is a ridge of equally good fits, so the margins and rounding that make the UAE calendar exact were never part of the score.

**6. Muslim World League (18/17)** -- 4.22 minutes weighted (4.93 without Pakistan and India, 5.12 on authorities only, rank 2 there). The widest natural constituency at nine countries, on 4.22, with the 18-degree fajr at 3.30 and a 17-degree isha at 5.35. The isha pair is the whole distance to the top: 1.79 minutes worse than 18/18 on isha and identical on fajr. Diyanet and ECFR are the same row to two decimals, so this score belongs to the pair.

**7. Diyanet domestic (18/17)** -- 4.22 minutes weighted (4.93 without Pakistan and India, 5.12 on authorities only, rank 3 there). Numerically identical to MWL and ECFR at 4.22 because the Turkish pair is also 18/17 and the domestic temkin falls on rows this study does not score. Nine countries inside two minutes. The temkin buys nothing on fajr or isha and the domestic tables are league-average worldwide.

**8. ECFR (18/17)** -- 4.22 minutes weighted (4.93 without Pakistan and India, 5.12 on authorities only, rank 4 there). The third copy of 18/17 at 4.22, with the same nine countries. Its proportional high-latitude rule is the only thing that separates it from MWL in principle, and it changes nothing on the scored set, which never reaches the latitudes where the rule binds.

**9. Moonsighting Committee (18 + season curve)** -- 5.05 minutes weighted (5.97 without Pakistan and India, 7.03 on authorities only, rank 11 there). The best of the curve-based bodies at 5.05: the season curve improves fajr to 3.60 from the 18-degree base, but costs isha at 6.81, and it is inside two minutes in no country at all, because an effective angle that moves between about 12 and 18 degrees matches no national table closely.

**10. Egyptian General Authority (19.5/17.5)** -- 5.87 minutes weighted (6.26 without Pakistan and India, 7.92 on authorities only, rank 13 there). Ties Kuwait for the second-best isha at 4.28 from 17.5 degrees, and pays for it on fajr at 7.14 from 19.5. Exact in Egypt and Montenegro and nowhere else, because no other authority prints 19.5/17.5. A national pair being read as a world pair.

**11. Diyanet European (18/16)** -- 6.12 minutes weighted (6.62 without Pakistan and India, 6.60 on authorities only, rank 10 there). Holds the winning 18-degree fajr at 3.30 and then loses the plot on isha at 9.37, because 16 degrees is early for almost every authority outside Europe. Three countries inside two minutes, two of them by latitude rather than by agreement.

**12. Fazilet Profile A (19.8/17.8)** -- 6.26 minutes weighted (6.81 without Pakistan and India, 8.95 on authorities only, rank 14 there). The second-best isha in the table at 3.84 from its 17.8 effective angle, against a fajr of 8.23 from 19.8. Four countries inside two minutes, all in the low latitudes. The effective angles encode a padding that does not travel and the profile is a 110-city print with no global claim attached.

**13. MUIS Singapore (20/18, ceiling)** -- 6.47 minutes weighted (7.10 without Pakistan and India, 9.40 on authorities only, rank 15 there). The best isha of the ceiling-rounded family at 3.85 from 18 degrees, and a fajr of 8.62 from 20 degrees, which is the fourth-worst fajr here. Four countries inside two minutes, every one of them near the equator: this is a tropical pair and the score says so.

**14. MABIMS / Kemenag (20/18)** -- 6.52 minutes weighted (7.17 without Pakistan and India, 9.66 on authorities only, rank 16 there). The 20/18 pair reproduces Kemenag exactly and matches the best isha in the table at 3.56, so its whole cost is on fajr, 8.96 minutes, the third worst. Four countries inside two minutes, all South-East Asian. As a world default the 20-degree fajr is the defect.

**15. Qatar MOI (18, isha +90)** -- 6.97 minutes weighted (8.06 without Pakistan and India, 6.05 on authorities only, rank 9 there). Keeps the winning 18-degree fajr at 3.30 and then spends 11.18 minutes on isha, because a fixed ninety minutes after sunset is only true near the tropics. Exact in Qatar, inside two minutes in one country, and structurally unable to serve a temperate latitude.

**16. Umm al-Qura (18.5, isha interval)** -- 8.71 minutes weighted (9.52 without Pakistan and India, 7.83 on authorities only, rank 12 there). A strong fajr at 4.42 from 18.5 degrees, and the second-worst isha at 13.51, because the ninety-minute interval is a Makkah rule that fails wherever the twilight lasts longer. Exact in Saudi Arabia and inside two minutes in one country. As a global default it is a fajr method with an isha that does not travel.

**17. Fazilet Profile B (20.8/18.7)** -- 9.88 minutes weighted (10.40 without Pakistan and India, 12.89 on authorities only, rank 19 there). A 20.8/18.7 effective pair that suits the Ottoman sphere and nothing else: 12.99 on fajr, 6.13 on isha, no country inside two minutes. Its temkin is larger than Profile A in every row, which is exactly why it does not travel.

**18. Tehran (17.7 / 14)** -- 10.81 minutes weighted (10.96 without Pakistan and India, 10.67 on authorities only, rank 17 there). The second-best single fajr angle in the study at 4.18 from 17.71 degrees, and the worst isha in the table at 18.46, because the 14-degree isha is a software default with no Iranian publisher behind it. A fajr parameter set with no isha method attached.

**19. Spiritual Administration of Russia (16/15)** -- 12.54 minutes weighted (12.70 without Pakistan and India, 12.54 on authorities only, rank 18 there). The 16/15 pair is the earliest of any method, 11.63 on fajr and 13.69 on isha, and inside two minutes nowhere. The pair is known only from secondary tables and the census graded it low. It is in this table to show what a two-degree error costs.

**20. ISNA / FCNA 2017 (15/15)** -- 14.98 minutes weighted (15.15 without Pakistan and India, 15.14 on authorities only, rank 20 there). The worst method here at 14.98, 16.20 on fajr and 13.69 on isha, inside two minutes in no country. The 15-degree pair is the North American convention and it is roughly three degrees early for the rest of the world, which is the cleanest demonstration in the study that a continental default does not scale.

### What the ranking recommends

The single global default that the numbers support is the **18/18 pair with the Shafi Asr**, at 3.38
minutes weighted, 4.71 with Pakistan and India removed and 5.22 on the authorities-only subset. It
wins the fajr half outright at 3.30 and the isha half outright at 3.56, and it stays at or near the
top of every one of the four aggregate columns, which no other pair does.

That answer has an awkward consequence: what wins is a pair with no publishing body behind it. The three rows that carry it are the
ISNA 2010 statement, Karachi and JAKIM, and they are the same geometry, so the ranking cannot separate
them on minutes. Two structural facts do separate them. Karachi's Asr is Hanafi and matches only seven
of the forty-nine targets, while ISNA's and JAKIM's Shafi Asr matches thirty-nine. Of those two, JAKIM is a
national zone table publishing the win by accident, and the ISNA 18/18 form is a statement the body
itself moved away from in 2017. A deployment that needs a body with a current worldwide claim and the
winning pair has to take 18/18 from the historical record or from South Asian practice, or accept the
18/17 family at 4.22, which is 0.84 minutes worse and is what the Muslim World League, the Diyanet and
the ECFR all publish today.

If the deployment has to serve a high-latitude city with a printed observation table, that
recommendation does not hold: the 18/18 pair is 50.5 minutes out at London and only Moonsighting is
usable there.

## 10. Harness decisions and their reasons

- **Rounding.** Where the carrier states a rounding it was used: Singapore ceils because its preset
  says so, and every other preset and constructed pair rounds nearest, which is also the rule the
  constraints fix for the bodies that state nothing. No method carries the +1 minute margins that the
  Saudi, Kuwaiti and other national recipes use, so those read as exactly one minute of deviation on
  the target side. Targets were computed with rounding off and then rounded per field, so a national
  table's floor or ceiling is reproduced to the minute.
- **High latitude.** Targets use the object's own kind, including "none", which means the angle is
  used everywhere and a day with no such twilight is a day the authority simply does not print. That
  is why Reykjavik contributes 241 fajr days and 243 isha days, Kazan 271 and 293, and Moscow 365
  fajr days but 293 isha days: its summer isha is served from observation in the record, never
  modelled. Methods keep the library's stock behaviour, which is one half of the night for every body
  that does not define its own rule. That default is what produces most of the London gap.
- **Frozen latitude 45.** Brussels and Istanbul both carry the rule with a declared summer window and
  no window dates. The harness applied it on the days the angle does not exist at the city's own
  latitude, which is the window the record describes. At Istanbul's 41 degrees the rule never fires.
- **Clock.** Every target was computed in its own IANA zone in its own process, asserted against the
  requested zone at start. Morocco, Jerusalem and Niger were additionally rendered at their fixed
  printed offsets rather than the civil zone, because their tables ignore the DST change.
- **Intervals.** Where a target's isha is an interval, the interval was applied to the computed sunset
  and then the target's own margin and rounding. Qatar's is applied after rounding the displayed
  maghrib, which is the ordering the record measured.
- **No real clock.** Every date is constructed from a string. Nothing in the harness reads the system
  time.

## 11. Appendix: every cell

Combined mean absolute deviation, minutes, one decimal. Column keys are the method ids of section 2.

| Target | mwl | isna15 | isna2010 | ummalqura | egyptian | karachi | moonsighting | diyanet-tr | diyanet-eu | mabims | jakim | kuwait | qatar | singapore | dubai | tehran | fazilet-a | fazilet-b | ecfr | russia |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| EG-ESA | 5.1 | 17.8 | 5.1 | 7.8 | 0.0 | 5.1 | 7.4 | 5.1 | 7.6 | 2.6 | 5.1 | 3.8 | 7.8 | 2.6 | 5.1 | 13.5 | 1.5 | 6.4 | 5.1 | 15.2 |
| MA-HABOUS | 3.5 | 16.9 | 6.2 | 7.1 | 2.0 | 6.2 | 8.0 | 3.5 | 6.2 | 4.7 | 6.2 | 4.8 | 7.3 | 4.7 | 6.2 | 12.4 | 3.6 | 8.9 | 3.5 | 14.3 |
| LK-ACJU | 6.3 | 16.8 | 4.1 | 12.3 | 2.0 | 4.1 | 4.2 | 6.3 | 8.4 | 0.9 | 4.1 | 5.2 | 12.1 | 0.5 | 3.3 | 13.2 | 0.9 | 3.3 | 6.3 | 14.7 |
| TH-CICOT | 6.3 | 17.2 | 4.1 | 11.7 | 2.0 | 4.1 | 4.6 | 6.3 | 8.5 | 0.7 | 4.1 | 5.2 | 11.6 | 0.2 | 3.7 | 13.5 | 0.7 | 3.5 | 6.3 | 15.0 |
| KW-AJIRI | 1.5 | 14.1 | 1.5 | 6.4 | 3.5 | 1.5 | 3.6 | 1.5 | 4.0 | 6.1 | 1.5 | 0.3 | 4.5 | 6.1 | 2.0 | 9.8 | 5.1 | 9.9 | 1.5 | 11.5 |
| ME-IZMR | 7.4 | 23.8 | 5.5 | 11.2 | 1.4 | 5.5 | 21.4 | 7.4 | 10.7 | 2.8 | 5.5 | 5.8 | 11.9 | 2.8 | 5.5 | 18.1 | 1.4 | 8.1 | 7.4 | 20.6 |
| YE-AWQAF-SANAA | 2.2 | 8.8 | 4.4 | 14.3 | 6.6 | 4.4 | 3.8 | 2.2 | 0.0 | 8.8 | 4.4 | 3.3 | 12.0 | 8.8 | 5.3 | 5.0 | 7.9 | 12.1 | 2.2 | 6.6 |
| JERUSALEM-AWQAF | 2.6 | 15.6 | 0.0 | 5.6 | 5.2 | 0.0 | 4.6 | 2.6 | 5.2 | 5.3 | 0.0 | 1.3 | 3.0 | 5.3 | 1.1 | 11.1 | 5.3 | 9.2 | 2.6 | 13.0 |
| AE-AWQAF | 2.8 | 14.8 | 0.5 | 6.6 | 4.3 | 0.5 | 2.8 | 2.8 | 5.2 | 4.4 | 0.5 | 1.6 | 5.1 | 4.3 | 0.5 | 10.7 | 4.3 | 8.0 | 2.8 | 12.4 |
| BA-RIJASET | 3.4 | 13.7 | 6.9 | 7.4 | 10.7 | 6.9 | 13.7 | 3.4 | 0.0 | 14.4 | 6.9 | 5.2 | 4.3 | 14.3 | 8.4 | 7.7 | 12.9 | 20.0 | 3.4 | 10.3 |
| BE-EMB | 13.9 | 24.6 | 18.4 | 24.9 | 22.3 | 18.4 | 32.2 | 13.9 | 17.0 | 26.4 | 18.4 | 16.2 | 22.6 | 26.4 | 20.0 | 22.1 | 24.8 | 32.4 | 13.9 | 23.8 |
| TN-INM | 3.3 | 17.5 | 0.5 | 5.7 | 5.8 | 0.5 | 8.9 | 3.3 | 6.2 | 5.8 | 0.5 | 1.9 | 3.5 | 5.3 | 0.7 | 12.7 | 5.8 | 9.7 | 3.3 | 14.7 |
| KZ-MUFTIYAT | 35.1 | 9.1 | 39.5 | 29.5 | 43.3 | 39.5 | 13.7 | 35.1 | 30.3 | 47.4 | 39.5 | 37.3 | 26.3 | 47.4 | 41.1 | 23.9 | 45.8 | 53.3 | 35.1 | 15.1 |
| KG-MUFTIYAT | 3.2 | 13.8 | 6.6 | 6.6 | 9.6 | 6.6 | 12.5 | 3.2 | 0.7 | 13.2 | 6.6 | 4.9 | 4.2 | 13.1 | 7.5 | 8.1 | 11.7 | 18.5 | 3.2 | 10.6 |
| MV-MUIS | 5.8 | 16.3 | 3.7 | 8.9 | 4.5 | 3.7 | 3.7 | 5.8 | 7.9 | 4.5 | 3.7 | 4.8 | 8.7 | 4.0 | 2.9 | 12.8 | 4.5 | 4.7 | 5.8 | 14.2 |
| SG-MUIS | 6.3 | 16.8 | 4.2 | 12.0 | 2.1 | 4.2 | 4.2 | 6.3 | 8.4 | 1.5 | 4.2 | 5.3 | 11.8 | 1.0 | 3.4 | 13.2 | 1.5 | 3.1 | 6.3 | 14.7 |
| MY-JAKIM | 4.6 | 12.6 | 2.5 | 11.3 | 6.7 | 2.5 | 2.5 | 4.6 | 6.7 | 6.7 | 2.5 | 3.5 | 9.0 | 6.2 | 2.5 | 10.2 | 6.7 | 7.3 | 4.6 | 10.5 |
| TR-DIYANET-DOMESTIC | 0.0 | 15.7 | 3.2 | 6.8 | 6.5 | 3.2 | 11.2 | 0.0 | 3.1 | 9.8 | 3.2 | 1.6 | 3.9 | 9.7 | 4.5 | 10.3 | 8.4 | 14.7 | 0.0 | 12.6 |
| GB-WIFAQUL-ULAMA | 27.7 | 31.6 | 31.7 | 9.8 | 35.4 | 31.7 | 31.2 | 27.7 | 23.6 | 39.1 | 31.7 | 29.7 | 7.2 | 39.3 | 33.3 | 19.3 | 37.7 | 44.5 | 27.7 | 27.2 |
| IS-FELAG | 40.4 | 11.1 | 46.0 | 49.7 | 51.4 | 46.0 | 51.3 | 40.4 | 34.6 | 56.9 | 46.0 | 43.1 | 48.8 | 56.9 | 48.1 | 20.8 | 54.7 | 65.0 | 40.4 | 17.1 |
| GR-ATHENS | 0.0 | 14.6 | 2.9 | 6.0 | 5.9 | 2.9 | 7.0 | 0.0 | 2.9 | 8.9 | 2.9 | 1.5 | 3.3 | 8.9 | 4.1 | 9.6 | 7.7 | 13.5 | 0.0 | 11.7 |
| GR-KOMOTINI | 0.0 | 15.7 | 3.2 | 6.8 | 6.5 | 3.2 | 11.4 | 0.0 | 3.2 | 9.8 | 3.2 | 1.6 | 4.0 | 9.8 | 4.5 | 10.3 | 8.5 | 14.8 | 0.0 | 12.6 |
| BG-SOFIA | 1.7 | 18.2 | 3.4 | 7.6 | 5.2 | 3.4 | 16.2 | 1.7 | 5.0 | 8.7 | 3.4 | 1.7 | 6.4 | 8.7 | 3.4 | 12.5 | 7.3 | 14.0 | 1.7 | 14.9 |
| GB-LONDON-INTERVAL-TABLE | 46.3 | 23.3 | 50.5 | 28.8 | 54.4 | 50.5 | 3.7 | 46.3 | 41.6 | 58.4 | 50.5 | 48.4 | 26.0 | 58.4 | 52.2 | 31.1 | 56.8 | 64.2 | 46.3 | 27.2 |
| OM-MARA | 2.8 | 14.1 | 0.5 | 7.6 | 5.2 | 0.5 | 2.4 | 2.8 | 5.2 | 5.2 | 0.5 | 1.7 | 5.2 | 4.7 | 0.9 | 10.1 | 5.2 | 8.3 | 2.8 | 11.7 |
| CZ-CENTRUM | 51.6 | 25.3 | 56.4 | 38.7 | 60.4 | 56.4 | 17.5 | 51.6 | 45.7 | 64.8 | 56.4 | 54.1 | 35.3 | 64.8 | 58.2 | 35.1 | 63.1 | 70.9 | 51.6 | 30.2 |
| CL-CIS | 6.0 | 13.3 | 3.4 | 8.0 | 8.7 | 3.4 | 8.7 | 6.0 | 8.7 | 8.8 | 3.4 | 4.6 | 5.4 | 8.4 | 3.8 | 13.1 | 8.7 | 12.2 | 6.0 | 10.6 |
| SA-KACST | 10.6 | 22.1 | 8.3 | 0.5 | 11.2 | 8.3 | 9.9 | 10.6 | 12.9 | 11.2 | 8.3 | 9.5 | 2.4 | 10.7 | 7.4 | 18.2 | 11.2 | 11.4 | 10.6 | 19.8 |
| IQ-DIWAN | 0.3 | 13.5 | 2.5 | 6.3 | 5.1 | 2.5 | 4.3 | 0.3 | 2.9 | 7.9 | 2.5 | 1.1 | 3.8 | 7.9 | 3.5 | 9.0 | 6.8 | 11.9 | 0.3 | 10.9 |
| HK-MASJIDAL | 5.7 | 17.3 | 3.7 | 4.8 | 5.7 | 3.7 | 5.0 | 5.7 | 8.0 | 6.0 | 3.7 | 4.6 | 4.7 | 5.6 | 3.0 | 13.3 | 5.9 | 7.1 | 5.7 | 14.9 |
| BD-IFB | 4.4 | 14.1 | 2.1 | 7.6 | 6.8 | 2.1 | 4.1 | 4.4 | 6.8 | 6.8 | 2.1 | 3.3 | 5.2 | 6.3 | 2.1 | 10.8 | 6.8 | 8.3 | 4.4 | 11.7 |
| LY-MUAZZIN | 4.3 | 17.5 | 1.7 | 4.3 | 5.2 | 1.7 | 6.8 | 4.3 | 7.0 | 5.2 | 1.7 | 3.0 | 3.5 | 4.7 | 0.6 | 13.0 | 5.2 | 7.8 | 4.3 | 14.9 |
| JO-AWQAF | 3.1 | 16.2 | 0.5 | 5.2 | 5.3 | 0.5 | 5.2 | 3.1 | 5.7 | 5.3 | 0.5 | 1.8 | 3.1 | 4.8 | 0.5 | 11.7 | 5.3 | 8.8 | 3.1 | 13.6 |
| IR-NATIONAL | 1.6 | 15.1 | 1.6 | 4.5 | 10.2 | 1.6 | 1.4 | 1.6 | 1.6 | 13.0 | 1.6 | 1.6 | 1.6 | 12.5 | 2.8 | 0.0 | 11.9 | 17.6 | 1.6 | 9.5 |
| SD-MINISTRY | 11.6 | 22.6 | 9.4 | 2.0 | 10.0 | 9.4 | 10.1 | 11.6 | 13.8 | 10.0 | 9.4 | 10.6 | 1.9 | 9.5 | 8.6 | 18.9 | 10.0 | 10.3 | 11.6 | 20.4 |
| IT-UCOII | 0.0 | 16.1 | 3.3 | 7.3 | 6.7 | 3.3 | 12.9 | 0.0 | 3.2 | 10.1 | 3.3 | 1.7 | 4.4 | 10.1 | 4.6 | 10.5 | 8.7 | 15.2 | 0.0 | 12.9 |
| RU-DUMRT | 10.1 | 13.9 | 14.7 | 16.3 | 19.4 | 14.7 | 40.4 | 10.1 | 5.2 | 24.0 | 14.7 | 12.5 | 14.1 | 24.0 | 16.3 | 6.7 | 22.2 | 31.2 | 10.1 | 9.6 |
| CY-KKTC | 1.7 | 13.7 | 2.8 | 6.8 | 5.7 | 2.8 | 5.8 | 1.7 | 4.5 | 8.5 | 2.8 | 1.4 | 4.1 | 8.5 | 4.0 | 9.1 | 7.3 | 12.7 | 1.7 | 11.0 |
| PT-HSALAH-HUB | 13.1 | 15.6 | 16.1 | 15.1 | 19.2 | 16.1 | 7.9 | 13.1 | 10.1 | 22.2 | 16.1 | 14.6 | 12.3 | 22.2 | 17.3 | 4.7 | 21.0 | 26.9 | 13.1 | 12.7 |
| ES-CCIM | 0.8 | 16.2 | 3.4 | 6.0 | 5.6 | 3.4 | 10.9 | 0.8 | 3.9 | 8.8 | 3.4 | 1.8 | 4.2 | 8.8 | 3.6 | 10.9 | 7.5 | 13.7 | 0.8 | 13.2 |
| UZ-ISLOM | 12.7 | 3.1 | 15.9 | 15.1 | 19.2 | 15.9 | 10.7 | 12.7 | 9.5 | 22.6 | 15.9 | 14.3 | 12.2 | 22.5 | 17.2 | 11.6 | 21.2 | 27.6 | 12.7 | 3.1 |
| XK-BIK | 12.4 | 14.1 | 9.1 | 19.3 | 15.9 | 9.1 | 20.2 | 12.4 | 15.7 | 16.1 | 9.1 | 10.7 | 17.1 | 15.6 | 9.4 | 21.1 | 16.0 | 18.3 | 12.4 | 13.8 |
| NE-BUTIN | 2.5 | 13.4 | 1.2 | 9.9 | 5.0 | 1.2 | 1.0 | 2.5 | 4.7 | 5.6 | 1.2 | 1.7 | 7.5 | 5.4 | 1.7 | 9.7 | 5.3 | 7.6 | 2.5 | 11.2 |
| RU-DUMRF-MOSCOW | 22.6 | 17.9 | 27.4 | 28.2 | 30.6 | 27.4 | 41.1 | 22.6 | 17.7 | 34.6 | 27.4 | 25.1 | 26.0 | 34.6 | 29.1 | 17.8 | 33.0 | 40.7 | 22.6 | 16.0 |
| QA-MOI | 8.0 | 18.9 | 5.6 | 3.4 | 10.4 | 5.6 | 7.9 | 8.0 | 10.4 | 10.4 | 5.6 | 6.8 | 1.0 | 9.9 | 5.6 | 14.8 | 10.4 | 10.9 | 8.0 | 16.6 |
| ID-KEMENAG | 6.3 | 16.9 | 4.2 | 13.2 | 2.1 | 4.2 | 4.3 | 6.3 | 8.4 | 0.0 | 4.2 | 5.3 | 13.1 | 0.5 | 4.2 | 13.3 | 0.9 | 3.2 | 6.3 | 14.8 |
| PK-DEFACTO | 2.4 | 14.3 | 0.0 | 7.2 | 4.8 | 0.0 | 2.2 | 2.4 | 4.7 | 4.8 | 0.0 | 1.2 | 4.7 | 4.8 | 0.9 | 10.2 | 4.8 | 8.4 | 2.4 | 11.9 |
| IN-DEFACTO | 2.5 | 14.9 | 0.0 | 6.1 | 5.0 | 0.0 | 3.3 | 2.5 | 5.0 | 5.0 | 0.0 | 1.3 | 3.6 | 5.0 | 1.0 | 10.6 | 5.0 | 8.8 | 2.5 | 12.4 |
| NG-SPA | 0.0 | 10.6 | 2.1 | 13.0 | 4.3 | 2.1 | 2.0 | 0.0 | 2.1 | 6.4 | 2.1 | 1.1 | 10.7 | 6.4 | 3.0 | 7.0 | 5.6 | 9.6 | 0.0 | 8.5 |
