# O1j R1: hostile review of the per-country preset design

Design under attack: per country, ship the adhan-js 4.4.6 preset whose times land closest to that
country's official timetable; countries with no official data keep one global preset; the app uses
nothing but the package's 13 named presets.

Everything below is read from `o1h-global/` (CONSTRAINTS, SHARED-BRIEF, SIM-REPORT + scores,
TOP30-REPORT, SEASONAL-REPORT, GAPFILL-REPORT, INDONESIA-REPORT, verify slices a-d and
specialforms), `o1i-package/` (PACKAGE-REPORT, HOMEGROUND-REPORT, INDONESIA-PKG-REPORT), and the
shipped `CalculationMethod.js`. No new computation.

## 0. What "the 13 presets" actually means

The menu is 12 usable presets, not 13. `Other` ships 0/0 angles and returns fajr after sunrise and
isha near sunset: 84.4 minutes of fajr error in the Indonesia grid (INDONESIA-PKG-REPORT table 4).
The other 12, verbatim from `CalculationMethod.js`:

| Preset | Fajr | Isha | Baked extras |
|---|---|---|---|
| MuslimWorldLeague | 18 | 17 | dhuhr +1 |
| Egyptian | 19.5 | 17.5 | dhuhr +1 |
| Karachi | 18 | 18 | dhuhr +1 |
| UmmAlQura | 18.5 | sunset+90 | no adjustments, **no Ramadan switch** |
| Dubai | 18.2 | 18.2 | sunrise -3, dhuhr +3, asr +3, maghrib +3 |
| MoonsightingCommittee | 18 | 18 | dhuhr +5, maghrib +3, season curve, 1/7 above 55N |
| NorthAmerica | 15 | 15 | dhuhr +1 |
| Kuwait | 18 | 17.5 | none |
| Qatar | 18 | sunset+90 | none, **no Ramadan switch** |
| Singapore | 20 | 18 | dhuhr +1, **rounding Up** |
| Tehran | 17.7 | 14 | maghrib angle 4.5 |
| Turkey | 18 | 17 | sunrise -7, dhuhr +5, asr +4, maghrib +7 |

All 13 ship `madhab` Shafi, `highLatitudeRule` MiddleOfTheNight, `polarCircleResolution`
Unresolved, `shafaq` General (PACKAGE-REPORT, "How a method is built"). The constructed methods the
O1h study scored beside them (ISNA-2010 18/18, JAKIM, MABIMS/Kemenag, Diyanet-Europe 18/16, ECFR,
Fazilet A/B, Russia 16/15) are NOT in the menu. Several of the study's best rows are therefore out
of stock by the design's own rule.

Residuals below are the O1h combined fajr+isha mean absolute deviation, 2026, from the SIM-REPORT
appendix, restricted to the 12-preset menu, unless attributed to the home-ground or package grids.

## 1. Margin drag: baked adjustments misfire abroad, and at home

The design's selection metric is angle proximity, but the presets carry margin blocks that fire
every day in every country, and they misfire wherever they travel - including in the preset's own
country.

- **Dubai is the clean case.** The UAE authority's angles are exactly the preset's 18.2/18.2, yet
  the preset's baked asr +3 runs **3.00 minutes late on 100.0 percent of 1,096 days** against the
  authority's zero asr margin, with dhuhr +1.00 and maghrib +1.00 every day; pooled six-row
  deviation 1.08, only 24.9 percent of prayer-days exact (HOMEGROUND-REPORT, AE-AWQAF and "three
  biggest gaps"). The package report prices the same gap as configuration the preset cannot carry:
  "Dubai: asr, dhuhr and maghrib margins, and the isha -1 | 3.0 min on asr". So even the design's
  best-served country carries a permanent daily asr error, and the same +3/+3 rides into every
  country the map assigns Dubai to (Bangladesh 2.08, Hong Kong 3.01, Maldives 2.88, Libya 0.58).
  Its Indonesian dhuhr residual of 0.36 is margin coincidence with Kemenag's own +3, not
  correctness (INDONESIA-PKG-REPORT section 5).
- **Turkey's temkin (-7/+5/+4/+7) is inert on the two scored prayers and loud on the four unscored
  ones.** At home it is exact: 0.00 pooled on all 6,576 prayer-days (HOMEGROUND-REPORT). Abroad, in
  Indonesia's printed column, the same block prints sunrise 4.40, dhuhr 2.36, asr 2.35 and maghrib
  4.65 minutes off Kemenag's own margins (INDONESIA-PKG-REPORT table 5). A design that ever maps
  Turkey's preset to a zero-margin authority bakes four wrong rows forever. The study scored only
  two prayers, so this drag is invisible to the selection metric the design uses.
- **The dhuhr +1 is a package-wide misfire.** Every preset that ships it (MWL, Egyptian, Karachi,
  NorthAmerica) lands exactly one minute late on every day against a zero-dhuhr recipe - including
  Egyptian against Egypt itself, where the authority zeroes the margin: dhuhr 1.00 mean, 0.0
  percent exact, every day of three years (HOMEGROUND-REPORT EG-ESA). The home-ground report says
  it plainly: "a property of the package, not of the country."
- **UmmAlQura's missing Ramadan switch is the largest single baked error in the menu.** The
  package ships isha = sunset+90 all year; the body's own rule is +120 inside Ramadan. Home ground
  in Saudi Arabia, the design's flagship cell: isha pooled **2.92 mean, worst 31.00**, inside one
  minute on 92.0 percent of days overall and a fraction of a minute outside Ramadan - i.e. a
  30-31 minute miss on all 29-30 Ramadan days of every year (HOMEGROUND-REPORT SA-KACST and raw
  section, 2028 isha 6.46 as Ramadan drifts). The design cannot fix this "with the package": the
  switch does not exist in it (PACKAGE-REPORT, "No Umm al-Qura Ramadan switch"). The O1h main sim
  only scored 0.52 for this cell because the harness implemented the switch as a body-internal
  rule, which the design forbids itself from doing.

## 2. Menu coarseness: countries whose authority sits between presets

Restricting the winner map to the 12-preset menu, these countries have an authority the menu
cannot express. The first three are the study's own named cases.

- **Morocco** (MA-HABOUS, grade A, 36.4m). Authority sits between the menu's 19.5 and 18 degree
  families; closest preset is Egyptian at 1.98 on the print clock (SLICE-A) - and 7.49 with worst
  61 on the civil-clock convention (TOP30). The same cell moves five and a half minutes with the
  harness's clock decision alone, because Morocco prints a fixed UTC+1 that no preset carries
  (SIM-REPORT section 10). The seasonal report adds that its Ramadan month alone moves the annual
  mean about five minutes. A preset picks none of this up.
- **Kazakhstan** (KZ-MUFTIYAT, grade A, 13.2m). The authority runs 15/15 **plus an angle/60-of-night
  clamp**. The menu's NorthAmerica carries the exact pair and still scores **9.12 mean, worst 77.0**
  (TOP30, slice C agrees), because "the same 15/15 pair is 9 minutes out" without the clamp. The
  next best menu entry is Moonsighting at 13.75. No preset expresses the rule.
- **Russia** (RU-DUMRT grade A, 15m; RU-DUMRF-MOSCOW provisional). DUM RT substitutes
  sunrise-120/sunset+90 on the 94-95 days the 18-degree angle is unreachable; the library default
  is Islamic midnight, about two hours earlier on exactly those days (TOP30 cause table). Best menu
  entries by run: Tehran 6.7 (main sim), and far worse in slice B's independent reading - every
  reading agrees no preset clears 5. The publisher choice swings the achievable number from 2.00
  (CDUM at Moscow, MWL-fitted) to 4.11 (DUM RF) to 13.3 (DUM RT Kazan): a single country-to-preset
  mapping picks one of three disagreeing authorities and bakes it.
- **Bangladesh** (BD-IFB, provisional, 150.8m - the second-largest Muslim population scored). Best
  overall is JAKIM (constructed, 18/18 + 2-minute ceiling ihtiyati) at 0.40; the best *preset* is
  Dubai or Karachi at **2.08**, five times the achievable error, purely because the menu cannot
  carry a margin and a rounding direction (SIM-REPORT appendix; slice C: jakim 0.40, dubai 2.08).
- **Bosnia** (BA-RIJASET): authority is 18/16 (Diyanet-Europe, constructed) at 0.00; best preset
  MWL/Turkey at **3.4**, the whole distance being the 17-degree isha no menu member has.
- **Kyrgyzstan** (KG-MUFTIYAT): best overall Diyanet-Europe 0.66; best preset MWL/Turkey **3.2**.
- **Yemen** (YE-AWQAF-SANAA, 26.8m): best overall Diyanet-Europe 0.00; best preset MWL/Turkey
  **2.2**.
- **Portugal** (PT-HSALAH-HUB, grade A): best preset Tehran at **4.7** - a 14-degree isha software
  default serving a European hub because nothing between 15 and 17 exists in the menu.
- **Uzbekistan** (UZ-ISLOM, 29.9m): best preset NorthAmerica at **3.1**, only 17.0 percent of days
  within two (SIM-REPORT appendix row).
- Others in the 2.5-4 band on the best preset: Malaysia 2.5, Maldives 2.9, Hong Kong 3.0,
  Chile 3.4, London 3.7.

The coarseness has a structural signature: the study's fitted authorities cluster at effective
isha 17.5-18.5 and the menu offers isha in {14, 15, 17, 17.5, 18, 18-by-interval}. Kuwait's 17.5
"second-best compromise" is itself inside two minutes in only three countries (SIM-REPORT section
5) because it sits between the families.

## 3. School and high-latitude defaults baked into the design

**The smoking gun: identical means across methods that differ in everything but geometry.** The
main sim ranks ISNA-2010, Karachi and JAKIM joint-first at 3.38 - "the same geometry and therefore
the same score to two decimals" - and slice A finds "every method carrying an 18-degree angle
shares one fajr column": Karachi, JAKIM, ISNA-2010 and Kuwait all post 1.74 fajr / identical cells
across MENA. These methods differ in asr school (Karachi Hanafi vs JAKIM Shafi), provenance and
published margins, and the metric cannot see any of it. That is precisely the design's failure
mode: "closest preset" selects on geometry, while the residual that remains between a country and
its table is geometry's *absence* - margins, rounding, school - which the menu cannot carry. Read
the design's own headline cells this way: Malaysia under the best preset (Karachi) is 2.47 fajr /
2.48 isha **entirely JAKIM's +2 ihtiyati and ceiling**, 0 percent exact, ~53 percent within two
(HOMEGROUND-REPORT bonus row); Saudi under UmmAlQura carries the authority's +1 floor as a
permanent half-minute on fajr; Kemenag's +2/+3 ihtiyati is the whole gap between Singapore's 0.5
and MABIMS' 0.0 in Indonesia.

**The school default is caller state, and one preset cannot serve both of its flagship markets.**
All 13 presets ship Shafi. Pakistan's and India's community tables are Hanafi; Malaysia's is
Shafi. Home ground ran Karachi with Hanafi at Kuala Lumpur and its asr came out **59.19 minutes
late on every day** (mismatch flagged); run verbatim-Shafi it "matches" Malaysia and then mis-
serves Pakistan. Correct asr under this design requires a per-country `madhab` assignment in app
code - a configuration act the "nothing but the package" rule pretends does not exist.

**The high-latitude default is structural, not statistical.** Every preset except Moonsighting
inherits MiddleOfTheNight. At London on 2026-06-01, ten presets print fajr 00:59 and isha 00:58 -
both prayers at the same instant - and Singapore's ceiling pushes them to 01:00/00:59
(PACKAGE-REPORT probe table). Consequences across the grids:

- London: every preset except Moonsighting is 26.0-64.2 combined (SIM-REPORT appendix); even
  Moonsighting, the only menu member with a real rule, runs isha **4.37 mean, worst 11.00, beyond
  five minutes on 1,401 of 4,383 days**, within two on 24.1 percent (HOMEGROUND-REPORT pooled
  2027-2038). The design's UK entry still needs the interval table it exists to avoid.
- Moonsighting's own rule drags when it fires: 1,031 substituted July days across the eight
  high-latitude targets, mean drag 97 minutes, and below 50N its summer isha runs 30-54 minutes
  early across the Balkans, Italy, Spain and Turkey (SEASONAL-REPORT section c).
- The unshippable bucket (section 5) is wholly high-latitude: Czechia 17.5, Belgium 13.9,
  Iceland 11.2, Kosovo 9.1, Kazakhstan 9.1, Russia 6.7-17.8.

**Polar defaults are silently undefined.** `polarCircleResolution` ships Unresolved, which leaves
NaN in the outputs rather than an error (PACKAGE-REPORT). Iceland's own authority publishes no
time on 31 July days; a preset app would print NaN or garbage on days the authority declines to
print (SEASONAL-REPORT: Reykjavik contributes 241 fajr days, Tatarstan fajr 31 skipped).

## 4. Rounding defaults: Singapore's Up everywhere, Nearest everywhere else

Rounding is a preset constant baked in `CalculationMethod.js` (Singapore alone sets `Rounding.Up`,
line 77). The design inherits it as theology:

- **Up's semantics are wrong at the edges**: `Up` adds `60 - seconds`, so a value already exactly
  on the minute gains a whole further minute (PACKAGE-REPORT, "Rounding"). The design's Indonesia
  pick works only because Kemenag rounds outward and the ceiling returns about half a minute of
  the ministry's ihtiyati; against Kemenag's nearest-rounded basis the ceiling *is* the 0.5
  residual (INDONESIA-PKG-REPORT sections 4-6). The menu has no 20/18 preset that rounds nearest -
  MABIMS is constructed and out of stock - so Indonesia gets Singapore's Singapore-tuned rounding
  or nothing.
- **Nearest is silently wrong for the floor/ceiling authorities.** Kuwait's own calendar floors
  fajr; the preset's nearest leaves a systematic 0.51 on Kuwait's own fajr, every day (HOMEGROUND
  KW-AJIRI pooled). Saudi's all-rows floor leaves 0.50 on UmmAlQura's fajr. JAKIM and Kemenag
  ceilings are unexpressable, which is most of Bangladesh's 2.08 and Malaysia's 2.5.
- **Qatar's compose-after-printed-maghrib quirk is unreproduced by the preset**; the harness
  measured the worst-case effect at 1 minute (SLICE-A decisions), a baked daily bias on the
  design's Qatar cell (pooled 0.74) that no preset can remove.
- A global-fallback preset inherits the same lock: the study's recommended fallback is 18/18 with
  Shafi asr and nearest rounding, which happens to be the Karachi preset's geometry with its
  dhuhr+1 riding along - acceptable on fajr/isha, wrong on dhuhr wherever the fallback lands in a
  zero-margin country (section 1).

## 5. Countries where the closest preset is still too far to ship

Best *preset* residual, combined mean, from the SIM-REPORT appendix (TOP30 and slices agree where
they overlap):

| Country | Pop (m) | Best preset | Mean | Verdict |
|---|---:|---|---:|---|
| Czechia (CZ-CENTRUM) | 0.03 | Moonsighting | 17.5 | unshippable |
| Russia, DUM RF Moscow | 15 | Tehran | 17.8 | unshippable |
| Belgium (BE-EMB) | 0.88 | MWL/Turkey | 13.9 | unshippable |
| Iceland (IS-FELAG) | 0.001 | NorthAmerica | 11.2 | unshippable |
| Kosovo (XK-BIK) | 1.7 | Karachi | 9.1 | unshippable |
| Kazakhstan (KZ-MUFTIYAT) | 13.2 | NorthAmerica | 9.1 | unshippable |
| GB Wifaqul Ulama | 4 (community) | Qatar | 7.2 | unshippable |
| Russia, DUM RT Kazan | 15 | Tehran | 6.7 | unshippable |
| Portugal (PT-HSALAH-HUB, A) | 0.04 | Tehran | 4.7 | marginal |

Eight scored targets, roughly 31 million Muslims plus a 4m community row, have no preset within
five minutes, and every one is a high-latitude or substituted-rule authority. Portugal, a grade-A
target, is served only by a preset whose 14-degree isha the SIM-REPORT itself calls "a software
default with no Iranian publisher behind it". Add London at 3.7 with 57 percent of days outside
two minutes and the design's European map is largely holes.

## 6. The selection metric itself is unsound: annual means hide season blowups

The design selects by "closest on the official timetable" - in practice an annual mean. The
seasonal audit shows 100 of 574 cells (17.4 percent) carry a season mean at least double the
annual mean, and 136 at least 1.5 times (SEASONAL-REPORT section b). Named cells: Moonsighting at
Tunisia reads 1.85 annual and 5.55 in July; at Greece 2.05 annual, 7.55 July; Portugal 2.62 annual,
8.74 July. Diyanet-Europe isha at Tatarstan: annual 9.8, July 49.8. A design that picks presets on
the annual column ships a June that is two to five times worse than the number it selected on.

## 7. The strongest steelman

The design is not naive; the study's own numbers give it a real case.

- **Coverage is overwhelmingly good.** Restricted to the 12-preset menu, 30 of 49 scored targets
  sit within 2 minutes and 11 more within 5; only 8 (about 31m people, ~2 percent of the 1,527.9m
  scored population) have no preset within 5. Every one of the ten largest Muslim populations has
  a preset at 2.5 or better: Indonesia 0.5 (Singapore), Pakistan 0.0 and India 0.0 (Karachi),
  Bangladesh 2.08 (Dubai), Nigeria 0.0 (MWL), Egypt 0.0 (Egyptian), Iran 0.05 (Tehran), Turkey
  0.0 (Turkey/MWL), Iraq 0.26 (MWL), Saudi ~0.9 (UmmAlQura).
- **Nine of thirteen presets reproduce or nearly reproduce their own governments** (HOMEGROUND
  summary: Turkey 0.00, Kuwait 0.17, PK/IN 0.17, Egypt 0.17, Qatar 0.74, Tehran 0.11, Singapore
  0.98, Saudi 0.91, Dubai 1.08). The Turkey identity - exact on 6,576 prayer-days - is
  harness-validation-grade evidence that the presets are faithful where they come from.
- **Zero custom parameters is a real property.** Byte-identical behaviour to a widely deployed
  library, no census table to maintain, no fitting to defend, and the method-name string keeps
  Moonsighting's curve alive (copying parameters onto another name silently disables it -
  PACKAGE-REPORT). The fallback case is also strong: the study's own recommended global default,
  18/18 Shafi at 3.38 weighted, exists in the menu as the Karachi preset's geometry.
- The failures are concentrated in low-population high latitudes and in countries whose extra
  accuracy (Bangladesh 0.40, Malaysia 0.0, Kemenag 0.0) is margins and rounding - configuration
  the design deliberately declines to carry, at a cost of two minutes, not twenty.

## 8. Verdict: adopt-with-changes

The preset-per-country core survives for the low and middle latitudes, but "nothing but the
package" does not: the study's data shows the residual error in the design's biggest markets is
configuration, and its European map is structurally broken by baked defaults. Adopt the menu as
the spine, and name these changes:

1. **Add a per-country configuration overlay** carried in the app, not in the presets: margins,
   rounding direction per field, and print clock. Minimum set the data names: Kemenag +2/+2/+3
   with outward rounding; JAKIM +2 with ceiling; Saudi +1 floor; Qatar +1 and interval-composed-
   on-printed-maghrib; Kuwait fajr floor; Morocco fixed UTC+1; Jerusalem fixed UTC+3. This closes
   Bangladesh (2.08 to 0.40), Malaysia (2.5 to 0.0), Saudi (0.9 to 0.5) and Morocco's clock
   ambiguity (1.98 vs 7.49).
2. **Implement the UmmAlQura Ramadan +120 switch in app data.** The package omits it; without it
   the design's best-served country misses isha by 30-31 minutes on every Ramadan day, forever.
   The CONSTRAINTS already classify the switch as body-internal, so this implements the method,
   it does not modify it.
3. **Assign madhab per country** (Hanafi for Pakistan/India community tables, Shafi elsewhere).
   All presets ship Shafi; the school is caller state, and one preset serves both PK and MY only
   if the app sets it.
4. **Carve out the high latitudes explicitly.** No preset for Kazakhstan, Russia (either
   publisher), Czechia, Belgium, Iceland, Kosovo or GB-Wifaqul: their authorities clamp,
   substitute or sweep, and no preset expresses it. London keeps Moonsighting **plus the interval
   table** - the preset alone is beyond five minutes on 1,401 of 4,383 days. Never ship a
   MiddleOfTheNight preset above roughly 50 degrees without an explicit rule.
5. **Select on worst-day and season-split, never the annual mean alone.** Gate any country whose
   July mean exceeds twice its annual mean (17.4 percent of cells qualify) or whose worst day
   exceeds 10 minutes.
6. **Keep the method-name string load-bearing** in any stored configuration: the
   MoonsightingCommittee branch fires on the literal name, so a parameter-copy store silently
   loses the curve.

With changes 1-3 the design's coverage floor rises from "everything within ~2.5 minutes, Europe
broken" to "everything within ~1 minute except the carved-out set"; changes 4-6 keep it honest.
Without them, reject: the design as literally stated ships a 31-minute Ramadan error in Saudi
Arabia, a permanent 3-minute asr error in the UAE, nine-minute floors in Kazakhstan and Kosovo,
and NaN at the polar circle - all measured, all baked, all avoidable only by leaving the package.

## Sources

- `o1h-global/`: SIM-REPORT.md (sections 2, 4, 5, 7, 8, 10, appendix), TOP30-REPORT.md (winner
  map, no-close-method table, sensitivity), SEASONAL-REPORT.md (a, b, c), GAPFILL-REPORT.md
  (sections 4, 6), INDONESIA-REPORT.md (1, 4, 6-8), verify/slice-a..d and specialforms reports.
- `o1i-package/`: PACKAGE-REPORT.md, homeground/HOMEGROUND-REPORT.md (summary, per-pair pools,
  three biggest gaps, Karachi bonus), indonesia-pkg/INDONESIA-PKG-REPORT.md (tables 4-5, section
  7).
- `adhan-build/node_modules/adhan/lib/cjs/CalculationMethod.js`: preset parameters verbatim.
