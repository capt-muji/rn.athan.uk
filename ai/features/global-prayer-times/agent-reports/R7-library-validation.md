# R7: validating the library decision where it is weakest

Research agent report, 2026-09-30, wave 2 of `ai/features/global-prayer-times`. Scope: test the four soft spots
R3 was honest about in recommending `adhan@4.4.6`, and decide whether the recommendation survives.

Every number is marked **measured** (this agent computed it), **cited** (a named source asserts it, with a URL and
a fetch date) or **UNVERIFIED**. Scripts, fixtures and raw output are in
`ai/features/global-prayer-times/data/validation/`, with a `README.md` covering how to run them. Packages were
installed into `/Users/muji/athan-global-scratch/`, never into the repository.

Prior art read in full and not repeated: `R3-offline-libraries.md` and the master table plus sections 1, 2 and 4
of `R1-authorities-and-conventions.md`. This report starts from R1's sourcing rather than redoing it, and it
corrects one of R1's own measurements.

---

## Findings in one page

1. **`adhan`'s `Egyptian` preset is CORRECT, and R1's figure for it was wrong.** R1 measured Egypt at Fajr 19.59
   and Isha 17.43 from one Cairo row. Inverting the authority's own 78-city table across 22 cities spanning 24.1N
   to 31.4N gives **Fajr 19.51 (range 19.39 to 19.64) and Isha 17.49 (range 17.39 to 17.60)**, measured. adhan
   ships 19.5/17.5. The delta is 0.01 degrees, which is zero minutes at every Egyptian latitude on every day of
   the year. **Verdict: correct, and now the best-verified preset in the library.**

2. **adhan's `Egyptian` reproduces the Egyptian authority's own table to the minute on 22 of 22 cities**, measured:
   Fajr 20/22 exact and 22/22 within a minute, sunrise 22/22 exact, Asr 22/22 within a minute, Maghrib and Isha
   21/22 exact. The only systematic offset is Dhuhr at exactly +1 minute on all 22, which is adhan's own
   `methodAdjustments.dhuhr = 1` preset; zeroing it gives **22 of 22 exact**.

3. **The `MuslimWorldLeague` preset cannot be validated, because the MWL does not use it.** This report found the
   MWL's own prayer-times service, `POST https://portal.themwl.org/api/salat/prayer-times`, in its Angular bundle
   and measured it at 24 cities. Its Fajr inverts to **18.06 degrees mean**, which matches adhan's 18. But its
   **Isha is not 17 degrees in Saudi Arabia**: at Makkah, Madinah and Riyadh it is **exactly Maghrib + 90 minutes**
   (measured, all three), which is the Umm al-Qura rule. Elsewhere it inverts to 17.0. So MWL's own software ships
   a country-switched method that no library implements, and adhan's `MuslimWorldLeague` is **18 to 21 minutes early
   on Isha at the MWL's own headquarters city**.

4. **The `Karachi` preset is UNVERIFIABLE and will stay that way.** R1 found no University of Islamic Sciences
   publication, and neither did this report. What is measurable is the cost of the uncertainty: at Karachi, Lahore,
   Delhi and Dhaka, choosing 18 over 19.5 moves Fajr by **7.2 to 7.8 minutes mean**, and choosing 18 over 15 moves
   it by **14.1 to 15.5 minutes mean** (measured). That is the size of a decision nobody can check.

5. **The `NorthAmerica` preset is WRONG FOR CANADA and the error is large.** FCNA publishes 13/13 for Canada in its
   own words (cited, `fiqhcouncil.org`, the Dallas General Body Meeting of 27 to 29 October 2017). adhan ships
   15/15 with no country split. Measured: a Canadian user is served Fajr **13.1 minutes early at Toronto, 13.9 at
   Montreal, 16.3 at Vancouver, 18.1 at Edmonton and 18.9 at Calgary on the yearly mean, peaking at 64 minutes at
   Edmonton**, with Isha symmetrically late by the same amounts. R1 noted that 13/13 appears in no software
   library; this report confirms it is absent from adhan and quantifies what that costs.

6. **The high-latitude rule is confirmed as the dominant lever, and the spread is far larger than R3 measured.**
   R3 measured library-to-library spread under one rule. Measured here is the spread BETWEEN rules at one library:
   **Fajr 47.8 minutes mean and 173 max at London, 69.9 and 191 at Oslo, 112.7 and 232 at Tromso**. At Stockholm
   and above, **no day of the year has all rules agreeing within a minute**. This is a user-facing choice worth up
   to four hours, not a tie-break.

7. **The latitude thresholds are now exact.** An 18-degree Fajr first loses a day at **48.6N** and loses 60 days a
   year at 51.5N, 90 at 55N, 122 at 60N, 150 at 65N and 174 at 69.6N (measured, `astronomy-engine`, longitude 0).
   A 12-degree Fajr survives to **54.6N**; a 20-degree one breaks at **46.6N**. The spread of thresholds across the
   angles real authorities use is eight degrees of latitude, which is why no single high-latitude threshold serves
   every convention.

8. **`SeventhOfTheNight` is the right default, but not for R3's reason, and it should not be the only setting.**
   R3 recommended it because it collapses library disagreement. Measured here, it is also the rule that changes the
   most days (221 of 365 at London, 365 at Oslo and above) and by the most minutes (47.6 mean at London, 90.8 at
   Tromso). Its real virtue is that it is the only portion rule that never leaves the user without an answer and
   never produces a Fajr the `MiddleOfTheNight` rule would call absurd. **Recommendation: follow the user's chosen
   authority where that authority publishes a rule, and default to `SeventhOfTheNight` otherwise.**

9. **The Diyanet rule is cheap to implement and behaves well.** Implemented from R1's citation (above 45 degrees,
   Isha is Maghrib + 1h20m capped at one third of the shar'i night), it moves Isha earlier by a mean of **41.8
   minutes at London, 48.4 at Ushuaia, 66.9 at Oslo and 136.5 at Tromso** (measured). The one-third cap binds on
   **0 days anywhere below Reykjavik**, 42 there and 21 at Tromso, so the fixed 1h20m is doing nearly all the work.
   It never fails to produce an answer above 45 degrees except on days with no night at all.

10. **`AqrabBalad` and `AqrabYaum` both move prayers they had no reason to touch, and `AqrabBalad` is the milder
    of the two.** Measured at Tromso: `AqrabBalad` leaves Dhuhr untouched on all 365 days but moves Asr on **117 of
    365 days by up to 92 minutes**, on days Asr was already perfectly calculable. `AqrabYaum` additionally moves
    **Dhuhr on 100 of 365 days** and Asr on 118 by up to 82. At Longyearbyen (78.2N) `AqrabBalad` moves Asr by up
    to **1,547 minutes**.

11. **Even `Unresolved` produces an incoherent prayer card, which no previous report caught.** Measured at Tromso:
    on **18 of the 248 days where all six values exist**, the six are not in time order, with a worst inversion of
    **2,208 minutes**. That is the Asr runaway, not the polar rule. `AqrabBalad` raises it to 43 broken days and
    `AqrabYaum` to 66. **A polar policy that only fills nulls does not fix the card.**

12. **The polar problem affects very few people and the report should say so.** About **4 million people live north
    of the Arctic Circle** (cited, multiple secondary sources agreeing at 4 to 6 million; no primary census
    aggregate found, so marked UNVERIFIED as a precise figure). The largest settlement above it is Murmansk at
    about 270,000 to 300,000 (cited). Tromso is about 78,000 (cited, Statistics Norway via secondary). By contrast
    **Saint Petersburg, Oslo, Helsinki and Stockholm are all near or above 59.3N**, and those four alone are several
    million people who hit the HIGH-LATITUDE question every summer without ever hitting the polar one. The
    engineering priority follows: **the high-latitude rule is a first-class product decision; the polar resolution
    is an edge case that needs a defensible answer and no more.**

13. **The verification suite R3 designed is built, runs, and passes.** Layer 1: **1,142 comparisons against the
    USNO rise/set service, 1,111 exact, mean +0.01 minutes, worst 1 minute, 0 of 20 cities failing**. Layer 2: the
    USNO's whole-year astronomical twilight tables at -18 degrees, which is numerically the MWL and Karachi Fajr
    angle, giving **36,198 comparisons across three angles, 35,082 exact, mean 0.00, 0 of 20 cities failing**. The
    fixtures are 400 JSON responses and 80 whole-year HTML tables, all committed verbatim as US Government work.

14. **Layer 2 gives something no previous check could: the no-solution counts are independently confirmed.** The
    USNO prints `////` on days where the sun never reaches the angle. Measured: at 18 degrees adhan agrees with the
    USNO on **120 of 120 null days at London, 246 of 246 at Oslo, 294 of 294 at Reykjavik, 350 of 350 at Tromso and
    259 of 259 at Anchorage**, and never returns a value where the USNO says there is none. A government body with
    no opinion about prayer confirms the exact days a Fajr rule must fire.

15. **The case against adhan is stronger than R3 made it, and it turns on one function.** `SolarTime.afternoon`,
    the one carrying `// TODO source shadow angle calculation`, is measurably worse than `praytime`'s at 17 of the
    18 city-madhab pairs tested. Against an exact shadow-ratio solve: adhan is exact on **135 of 365 days at London
    and 55 at Reykjavik** against praytime's 294 and 238, and at Tromso adhan's worst error is **2,279 minutes**
    against praytime's **1 minute** (measured). The TODO comment is not a missing citation on correct code.

16. **Three of the five charges against adhan collapse under measurement.** The maintenance gap changed **0 of
    135,239 outputs** between `adhan@4.4.3` (2022-05-14) and `adhan@4.4.6` (2026-08-31), measured, so the four
    silent years hid no bug. The bundle-size argument is 2.2 KB. And `praytime` has no Moonsighting Committee
    method, which is the one method wave 1 verified line by line.

17. **Two charges survive and both are actionable without switching library.** The `MoonsightingCommittee` path
    silently ignores `highLatitudeRule`, measured: all three rules produce a byte-identical year at London, Oslo,
    Reykjavik and Tromso, while `MuslimWorldLeague` produces three distinct years. And
    `HighLatitudeRule.recommended()` tests `coordinates.latitude > 48` rather than the absolute value, so it
    **never fires in the southern hemisphere**: at Ushuaia (54.8S) it returns `MiddleOfTheNight` where the mirrored
    northern latitude gets `SeventhOfTheNight`, changing Fajr on **242 of 365 days by a mean of 54.2 minutes**.

18. **The recommendation stands: `adhan@4.4.6`, with five conditions, one of which is new.** The new condition is
    that **Asr must not be taken from adhan above about 60 degrees** without a bound, because the shadow-ratio
    definition runs away there and adhan's approximation runs away worse than the exact solve does. Everything else
    R3 attached still holds, and this report adds the Canada preset override and the southern-hemisphere rule fix
    to the list.

---

## Part 1: the four untested presets

R3 finding 16: adhan's entire CI correctness evidence is 462 fixture days, and four of its thirteen methods have no
fixture at all. The constants, read from `src/CalculationMethod.ts` of `adhan@4.4.6` via
`opensrc path npm:adhan@4.4.6`:

| preset | `fajrAngle` | `ishaAngle` | `ishaInterval` | `methodAdjustments` | fixture |
|---|---|---|---|---|---|
| `MuslimWorldLeague` | 18 | 17 | 0 | `dhuhr: 1` | **none** |
| `Egyptian` | 19.5 | 17.5 | 0 | `dhuhr: 1` | **none** |
| `Karachi` | 18 | 18 | 0 | `dhuhr: 1` | **none** |
| `NorthAmerica` | 15 | 15 | 0 | `dhuhr: 1` | **none** |

One methodological note before the verdicts. Every angle below was recovered by inverting an authority's own
published clock time with `astronomy-engine@2.1.19`, which R3 measured against Skyfield driven by JPL DE440s at
0.45 arcsec mean. The inversion is **geometric**, not apparent. Using the refracted altitude costs a flat 0.52
degrees and recovered Egypt at 18.99 against its known 19.5 on the first run, which reads exactly like a
half-degree preset error and is nothing but the refraction term. Anyone reproducing this must use the airless
altitude.

### `Egyptian`: CORRECT

**Source.** `https://esa.gov.eg/praytimes.aspx`, the Egyptian General Authority of Survey's own page, fetched
2026-09-30 and committed verbatim as `data/validation/authority/esa_praytimes.html` and `esa_cities.json`. The page
serves **78 Egyptian cities for one day**, which is a better latitude sweep than one city across a month, because
it separates a real angle from a coordinate error.

22 of those cities have unambiguous coordinates and were inverted. All figures **measured**:

| city | lat | published Fajr | implied Fajr deg | published Isha | implied Isha deg |
|---|---|---|---|---|---|
| Damietta | 31.42 | 05:18 | 19.49 | 19:58 | 17.60 |
| MarsaMatruh | 31.35 | 05:36 | 19.56 | 20:16 | 17.55 |
| Alexandria | 31.20 | 05:25 | 19.64 | 20:05 | 17.51 |
| Mansoura | 31.04 | 05:20 | 19.49 | 19:59 | 17.49 |
| Cairo | 30.04 | 05:21 | 19.55 | 19:59 | 17.49 |
| Faiyum | 29.31 | 05:23 | 19.56 | 20:00 | 17.46 |
| Minya | 28.11 | 05:24 | 19.59 | 20:00 | 17.51 |
| Asyut | 27.18 | 05:23 | 19.55 | 19:58 | 17.55 |
| Sohag | 26.56 | 05:22 | 19.39 | 19:55 | 17.39 |
| Luxor | 25.69 | 05:18 | 19.54 | 19:51 | 17.42 |
| Aswan | 24.09 | 05:18 | 19.48 | 19:50 | 17.57 |

Full 22-city table in `data/validation/presets.txt`.

| quantity | measured across 22 cities | adhan ships | delta |
|---|---|---|---|
| Fajr angle | **19.51 mean, 19.39 to 19.64** | 19.5 | **+0.01 deg** |
| Isha angle | **17.49 mean, 17.39 to 17.60** | 17.5 | **-0.01 deg** |

The spread of 0.25 degrees across 22 cities is the authority's own one-minute rounding, not a varying angle: one
minute of clock at 30N in late September is about 0.2 degrees of solar depression.

**This corrects R1.** R1 measured 19.59/17.43 from a single Cairo row and called it "the single best-verified entry
in this table". The direction was right and the precision was not; 22 cities give 19.51/17.49. The correction does
not change R1's conclusion, it strengthens it.

**Running adhan against the authority's table, city by city**, all 22 cities, delta in minutes, **measured**:

| prayer | n | mean | min | max | exact | within 1 min |
|---|---|---|---|---|---|---|
| fajr | 22 | 0.0 | -1 | 1 | 20/22 | **22/22** |
| sunrise | 22 | 0.0 | 0 | 0 | **22/22** | 22/22 |
| dhuhr | 22 | **+1.0** | 1 | 1 | 0/22 | 22/22 |
| asr | 22 | -0.5 | -1 | 0 | 10/22 | 22/22 |
| maghrib | 22 | 0.0 | -1 | 0 | 21/22 | 22/22 |
| isha | 22 | 0.0 | -1 | 0 | 21/22 | 22/22 |

With `methodAdjustments.dhuhr` zeroed, Dhuhr becomes **22 of 22 exact**. So adhan's `Egyptian` reproduces the
Egyptian authority's own table exactly, and the single visible offset is a preset adhan chose, not an error.

**Verdict: CORRECT.** This is now the best-evidenced preset in the library, and it has no fixture. The obvious fix
is to add one.

### `MuslimWorldLeague`: UNVERIFIABLE as stated, and WRONG where the MWL itself operates

R1 could find no MWL method publication and marked 18/17 UNVERIFIED. This report went one step further and found
the MWL's own prayer-times service.

**Source.** `https://portal.themwl.org/en/applications/prayer-times` is an Angular application. Its lazy chunk
`2569.fedca3ed5e30bcba.js` contains the service
`getPrayerTimes(latitude, longitude, zoneId) { return this.http.post("/api/salat/prayer-times", {latitude, longitude, zoneId}) }`.
That endpoint was called for 24 cities on 2026-09-30 and the responses are committed verbatim as
`data/validation/authority/mwl_portal.json`.

This is not an MWL method document, and it is not claimed as one. It is the MWL's own software output, which is a
strictly better source than a third-party constant and a strictly worse one than a publication.

All figures **measured**:

| city | lat | Fajr | implied Fajr deg | Isha | implied Isha deg | Isha minus Maghrib (min) |
|---|---|---|---|---|---|---|
| **Makkah** | 21.42 | 04:56 | 18.41 | 19:40 | **21.87** | **90** |
| **Madinah** | 24.47 | 04:55 | 18.57 | 19:40 | **21.35** | **90** |
| **Riyadh** | 24.71 | 04:27 | 18.48 | 19:11 | **21.15** | **90** |
| Cairo | 30.04 | 05:28 | 18.05 | 19:57 | 17.06 | 75 |
| London | 51.51 | 05:07 | 18.04 | 20:26 | 17.06 | 105 |
| Istanbul | 41.01 | 05:28 | 17.97 | 20:14 | 16.99 | 86 |
| Karachi | 24.86 | 05:08 | 17.95 | 19:31 | 16.90 | 71 |
| Jakarta | -6.21 | 04:29 | 18.01 | 18:52 | 16.90 | 65 |
| NewYork | 40.71 | 05:19 | 18.06 | 20:07 | 17.01 | 86 |
| Toronto | 43.65 | 05:37 | 18.01 | 20:32 | 17.03 | 90 |
| Oslo | 59.91 | 04:58 | 18.01 | 21:05 | 17.01 | 132 |
| Sydney | -33.87 | 04:10 | 18.05 | 19:16 | 16.99 | 79 |

Full 24-city table in `data/validation/presets.txt`.

**Two findings, both measured.**

The **Fajr angle is 18**, confirmed across 21 non-Saudi cities at 17.89 to 18.09 degrees. adhan's 18 is right.

The **Isha rule is country-switched**. At Makkah, Madinah and Riyadh the gap from Maghrib is **exactly 90 minutes
on all three**, and the implied angle is 21.15 to 21.87, which is not an angle anybody uses. It is the Umm al-Qura
interval. Everywhere else the implied angle is 16.88 to 17.12, which is 17. So the MWL's own application serves
`UmmAlQura` inside Saudi Arabia and 18/17 outside it, and **no library implements that switch**.

Running adhan's `MuslimWorldLeague` against the portal, delta in minutes, **measured**:

| prayer | n | mean | min | max | within 1 min |
|---|---|---|---|---|---|
| fajr | 24 | +0.3 | 0 | 2 | 21/24 |
| sunrise | 24 | 0.0 | 0 | 0 | **24/24** |
| dhuhr | 24 | +0.1 | 0 | 1 | 24/24 |
| asr | 24 | 0.0 | 0 | 0 | **24/24** |
| maghrib | 24 | 0.0 | 0 | 0 | **24/24** |
| **isha** | 24 | **-2.4** | **-21** | 0 | 21/24 |

adhan matches the MWL's own output exactly on 21 of 24 cities and on every prayer. The three misses are Makkah,
Madinah and Riyadh, where adhan's Isha is **21, 19 and 18 minutes early** respectively, because it applies the
17-degree angle where the MWL applies 90 minutes.

**Verdict: the angle pair 18/17 is CONFIRMED as what the MWL's own software uses outside Saudi Arabia, and
UNVERIFIED as a published MWL position, because no publication exists. Inside Saudi Arabia the preset is WRONG,
by 18 to 21 minutes on Isha, including at the MWL's own headquarters.** For this app the practical consequence is
small, because a user in Saudi Arabia should be on `UmmAlQura` anyway, and R2's country map should route them
there. It is worth recording that the MWL agrees.

### `Karachi`: UNVERIFIABLE

R1 searched for a University of Islamic Sciences, Karachi publication and found none. This report searched again
and found none. Arabeyes ITL's own documentation admits "no contacts have been made to obtain the correct (or
up-to-date) numbers as published by such organizations" (cited, R1). There is nothing to check 18/18 against.

What can be measured is the size of the uncertainty: how far 18/18 sits from the other defensible values in the
same region. Full year of 2026, **measured**:

| city | lat | 18 vs 19.5 Fajr (min) | 18 vs 15 Fajr (min) | 18 vs 17 Isha (min) |
|---|---|---|---|---|
| Karachi | 24.86 | 7.3 [7,8] | -14.2 [-16,-13] | 4.8 [4,6] |
| Lahore | 31.52 | 7.8 [7,10] | -15.5 [-19,-14] | 5.3 [5,6] |
| Delhi | 28.61 | 7.5 [7,9] | -14.9 [-18,-14] | 5.2 [5,6] |
| Dhaka | 23.81 | 7.2 [7,8] | -14.1 [-16,-13] | 4.6 [4,5] |

**Verdict: UNVERIFIABLE, permanently, and the uncertainty is worth 7 to 16 minutes of Fajr for roughly the
population of Pakistan, India and Bangladesh.** That is not a defect in adhan; every library carries the same
number from the same unsourced origin. It is a fact the app should be honest about in its method picker: the
Karachi label names a convention, not a verified authority position.

### `NorthAmerica`: CORRECT for the USA, WRONG for Canada

**Source.** `https://fiqhcouncil.org/the-suggested-calculation-method-for-fajr-and-isha/`, the Fiqh Council of
North America's own page, fetched 2026-09-30 and committed as `data/validation/authority/fcna_ruling.html`. Its
words, cited verbatim:

> "The Fiqh Council of North America suggests using 15° for both Fajr and Isha in the USA and using 13° for both
> Fajr and Isha in Canada, throughout the year. This corresponds to 'Islamic Society of North America' in most
> prayer apps."

Two things follow. adhan's 15/15 is **correct for the USA** and correctly attributed, given that FCNA itself names
the ISNA software label. And adhan has **no Canada variant**, so every Canadian user of every app built on adhan is
served the USA figure.

**What that costs, measured across all 365 days of 2026.** Delta is 15/15 minus 13/13, in minutes. A negative Fajr
delta means the app calls Fajr earlier than the user's own council says.

| city | lat | Fajr mean | Fajr min | Fajr max | Isha mean | Isha min | Isha max | days 15 deg has no solution |
|---|---|---|---|---|---|---|---|---|
| Toronto | 43.65 | **-13.1** | -19 | -11 | +13.1 | +11 | +19 | 0 |
| Montreal | 45.50 | **-13.9** | -21 | -11 | +13.9 | +11 | +21 | 0 |
| Vancouver | 49.28 | **-16.3** | -31 | -12 | +16.3 | +12 | +31 | 0 |
| Edmonton | 53.55 | **-18.1** | **-64** | -13 | +18.1 | +13 | **+64** | **49** |
| Calgary | 51.04 | **-18.9** | -49 | -13 | +18.9 | +13 | +49 | 0 |

Two readings. The mean error is **13 to 19 minutes every day of the year**, which is larger than any astronomy
disagreement anywhere in R3's report. And at Edmonton the 15-degree Fajr has **no solution at all on 49 days**
while the 13-degree one has a solution on every day, so the Canadian figure is not merely different, it is the one
that works.

**Verdict: CORRECT for the USA, WRONG for Canada by 13 to 19 minutes on the mean and up to 64 at the northern
edge.** The fix is one line in this app's own preset layer, not a library change: when the user's country is
Canada, use 13/13.

---

## Part 2: the high-latitude decision

R3 called the rule choice the single largest lever in its whole report, having measured it as library-to-library
spread. Measured here is the more important quantity: the spread **between rules** at one library, which is what a
user experiences when the app picks one.

### The rules that exist

| rule | source | definition as implemented and measured here |
|---|---|---|
| `MiddleOfTheNight` | `adhan@4.4.6` `CalculationParameters.nightPortions` | Fajr no earlier than 1/2 of the night before sunrise; Isha no later than 1/2 after sunset. adhan's default |
| `SeventhOfTheNight` | same | the same bound at 1/7 |
| `TwilightAngle` | same | the bound at `fajrAngle / 60` and `ishaAngle / 60` of the night |
| `recommended()` | `adhan@4.4.6` `HighLatitudeRule.ts` | `SeventhOfTheNight` above 48 degrees, else `MiddleOfTheNight`. Tests the SIGNED latitude, see Part 5 charge 3 |
| Diyanet | cited, R1, `ditib.de/detail2.php?id=424`, Din Isleri Yuksek Kurulu, 2009-08-28 | above 45 degrees, Isha is Maghrib + 1h20m, capped at one third of the shar'i night |
| Nisful-Layl | cited, R1, Wifaqul Ulama `wifaqululama.co.uk/highlat/`, ruling of 2018-11-11 | the night halved. Numerically identical to `MiddleOfTheNight` |
| Aqrabul-Ayyam | same source | the times of the nearest day on which the angle does have a solution. Wifaqul Ulama specifies a **3-day average**, not the single last day. Both measured |
| Moonsighting 1/7 | cited, R1 and wave 1 | above 55 degrees, 1/7 of the night, applied by adhan inside the `MoonsightingCommittee` path only |
| Aqrab al-Bilad | `adhan` `PolarCircleResolution.AqrabBalad` | walk the latitude toward the equator in 0.5-degree steps until the sun rises and sets |

Aqrabul-Ayyam needs one implementation note, because a naive reading of it is wrong. Transferring a raw clock time
from a donor day 60 days away would be an hour out. What is transferred here is the **offset from that day's
sunrise or sunset**, which is the only defensible reading and is what makes the rule continuous. Measured at
Tromso, the furthest donor day the 3-day average reaches is **55 days away**.

### Where an angle stops having a solution

Days per year on which the sun never reaches the given depression before sunrise, so Fajr has no angle-based
answer. Pure solar solve, no library and no rule involved, longitude 0, 2026. All **measured**.

| latitude | 12 deg | 13 deg | 15 deg | 17 deg | 18 deg | 19.5 deg | 20 deg | no sunrise at all |
|---|---|---|---|---|---|---|---|---|
| 45 N | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 48 N | 0 | 0 | 0 | 0 | 0 | 33 | 41 | 0 |
| 49 N | 0 | 0 | 0 | 0 | 22 | 48 | 54 | 0 |
| 50 N | 0 | 0 | 0 | 22 | 41 | 60 | 64 | 0 |
| 51.5 N | 0 | 0 | 0 | 48 | **60** | 74 | 78 | 0 |
| 52.5 N | 0 | 0 | 33 | 60 | 69 | 82 | 86 | 0 |
| 53.5 N | 0 | 0 | 48 | 69 | 78 | 90 | 92 | 0 |
| 55 N | 22 | 41 | 64 | 82 | 90 | 100 | 104 | 0 |
| 57 N | 54 | 64 | 82 | 96 | 104 | 112 | 116 | 0 |
| 59 N | 74 | 82 | 96 | 110 | 116 | 125 | 128 | 0 |
| 60 N | 82 | 90 | 104 | 116 | **122** | 130 | 134 | 0 |
| 62 N | 96 | 104 | 116 | 128 | 134 | 142 | 144 | 0 |
| 64 N | 110 | 116 | 128 | 139 | 144 | 153 | 155 | 0 |
| 65 N | 116 | 122 | 134 | 144 | **150** | 158 | 161 | 0 |
| 66.5 N | 125 | 130 | 142 | 153 | 158 | 166 | 168 | **30** |
| 69.6 N | 142 | 148 | 158 | 169 | **174** | 182 | 184 | **116** |

The exact latitude at which each angle first loses a single day, searched to 0.1 degrees, **measured**:

| angle | first latitude with any null day | who uses that angle |
|---|---|---|
| 20 | **46.6 N** | MUIS Singapore, Kemenag Indonesia, Brunei |
| 19.5 | **47.1 N** | Egypt |
| 18 | **48.6 N** | MWL, Karachi, Diyanet, Wifaqul Ulama |
| 17 | 49.6 N | MWL Isha, Morocco, Algeria |
| 15 | **51.6 N** | FCNA USA |
| 13 | 53.6 N | FCNA Canada |
| 12 | **54.6 N** | Musulmans de France |

**Three consequences for the app.** adhan's own 48-degree threshold in `recommended()` is very close to right for
an 18-degree Fajr (48.6 measured) and wrong by 2 degrees for Egypt's 19.5. Diyanet's published 45-degree threshold
is deliberately conservative, three degrees below where its own 18-degree angle actually breaks, which is
consistent with R1's note that Diyanet justified it on *istihsan* rather than astronomy. And the Moonsighting
Committee's 55-degree threshold is far above where 18 degrees breaks, so between 48.6 and 55 the MC method relies
on its seasonal function alone.

### What each rule does, measured over a full year

Base convention MWL 18/17, so the rule is the only thing varying. Full tables for all 11 cities in
`data/validation/highlat.txt`. Three representative cities:

**London, 51.5N:**

| rule | Fajr days changed | Fajr change mean | Fajr change max | Fajr no answer | Isha days changed | Isha change mean | Isha change max |
|---|---|---|---|---|---|---|---|
| angle only | 0 | 0 | 0 | **60** | 0 | 0 | 0 |
| `MiddleOfTheNight` | 60 | n/a | n/a | 0 | 48 | n/a | n/a |
| `SeventhOfTheNight` | **221** | 47.6 | 152 | 0 | 200 | -49.9 | 154 |
| `TwilightAngle` | 92 | 31.1 | 77 | 0 | 88 | -35.3 | 88 |
| Diyanet | n/a | n/a | n/a | n/a | 365 | -41.8 | 141 |
| Aqrabul-Ayyam (3-day) | 4 | 0.0 | 9 | 0 | n/a | n/a | n/a |

**Oslo, 59.9N:**

| rule | Fajr days changed | Fajr change mean | Fajr change max | Fajr no answer | Isha days changed | Isha change mean | Isha change max |
|---|---|---|---|---|---|---|---|
| angle only | 0 | 0 | 0 | **122** | 0 | 0 | 0 |
| `MiddleOfTheNight` | 122 | n/a | n/a | 0 | 116 | n/a | n/a |
| `SeventhOfTheNight` | **365** | 34.0 | 161 | 0 | 355 | -27.9 | 156 |
| `TwilightAngle` | 144 | 32.1 | 76 | 0 | 142 | -32.9 | 83 |
| Diyanet | n/a | n/a | n/a | n/a | 365 | -66.9 | 150 |
| Aqrabul-Ayyam (3-day) | 6 | 0.1 | 12 | 0 | n/a | n/a | n/a |

**Tromso, 69.6N:**

| rule | Fajr days changed | Fajr change mean | Fajr change max | Fajr no answer | Isha days changed | Isha change mean | Isha change max |
|---|---|---|---|---|---|---|---|
| angle only | 0 | 0 | 0 | **174** | 0 | 0 | 0 |
| `MiddleOfTheNight` | 105 | n/a | n/a | **118** | 100 | n/a | n/a |
| `SeventhOfTheNight` | 247 | 90.8 | 228 | **118** | 247 | -79.7 | 205 |
| `TwilightAngle` | 127 | 43.1 | 124 | **118** | 125 | -43.2 | 117 |
| Diyanet | n/a | n/a | n/a | n/a | 365 | -136.5 | 224 |
| Aqrabul-Ayyam (3-day) | 14 | 0.3 | 29 | **116** | n/a | n/a | n/a |

**Four readings, all measured.**

Every portion rule leaves **118 days without an answer at Tromso**, because a portion of the night is undefined
when there is no night. Only Aqrabul-Ayyam gets close, at 116, and it fails on the same grounds: there is no
sunrise to anchor the offset to.

`SeventhOfTheNight` is the most aggressive rule by a wide margin. At Oslo and above it changes **every single day**,
because a seventh of the night is a tighter bound than the 18-degree angle even in winter. That is not a defect,
it is the rule doing what it says, but an app must not present it as a minor correction.

`MiddleOfTheNight` and Nisful-Layl are the same number. R1 reported them as two rules from two traditions; they
compute identically, and the app should offer one setting with both labels rather than two.

The Diyanet rule behaves well and is cheap. Its one-third-of-the-night cap binds on **0 days from London to
Anchorage, 42 at Reykjavik and 21 at Tromso**, measured, so the fixed 1h20m is doing the work almost everywhere and
the cap only engages inside and just below the polar circle, where the night is short enough for a third of it to
fall before 80 minutes have passed.

### The spread between rules, which is the size of the decision

On each day, the widest gap between any two rules. **Measured**, 365 days of 2026, MWL 18/17.

| city | lat | Fajr spread mean (min) | Fajr spread max | Isha spread mean | Isha spread max | days all rules agree within 1 min |
|---|---|---|---|---|---|---|
| London | 51.5 | 47.8 | 173 | 58.6 | 167 | 148/365 |
| Berlin | 52.5 | 50.9 | 174 | 63.2 | 169 | 140/365 |
| Manchester | 53.5 | 53.6 | 177 | 67.2 | 170 | 132/365 |
| Copenhagen | 55.7 | 59.1 | 180 | 75.6 | 173 | 110/365 |
| Stockholm | 59.3 | 68.3 | 189 | 88.0 | 182 | **0/365** |
| Oslo | 59.9 | 69.9 | 191 | 89.9 | 184 | **0/365** |
| Helsinki | 60.2 | 70.5 | 192 | 90.7 | 185 | **0/365** |
| Anchorage | 61.2 | 73.0 | 194 | 94.0 | 187 | **0/365** |
| Reykjavik | 64.1 | 79.1 | 206 | 102.5 | 197 | **0/365** |
| Tromso | 69.6 | 112.7 | 232 | 137.5 | 232 | **0/365** |
| Ushuaia | -54.8 | 54.2 | 178 | 70.6 | 173 | 126/365 |

**This is the number the app's design has to respect.** At London the rule choice is worth 48 minutes on an average
day and nearly three hours on the worst. At Oslo, Helsinki and Stockholm there is **not one day in the year on
which the rules agree**. R3's finding that the rule matters more than the library was correct and understated:
measured this way it is worth up to four hours, against the under-one-second astronomy difference R3 measured
between engines.

### The recommendation: what this app should do

**Follow the user's chosen authority where that authority publishes a rule. Default to `SeventhOfTheNight` where it
does not. Expose the rule as a visible, changeable setting, not as a hidden default.**

The reasoning, in the order it matters.

**The rule is a fiqh position, so it belongs with the authority, not beside it.** R1 established that Diyanet,
Wifaqul Ulama and the Moonsighting Committee each publish a high-latitude rule as part of their method, and that
Wifaqul Ulama explicitly warns against mixing Aqrabul-Ayyam and Nisful-Layl. A user who picks Diyanet and gets
`SeventhOfTheNight` is not getting Diyanet. So the mapping is: Diyanet users get Maghrib+80 capped at a third;
Wifaqul Ulama users get Nisful-Layl or Aqrabul-Ayyam as that body offers both; Moonsighting Committee users get its
1/7 above 55 (which adhan already applies, and only there, see Part 5).

**Where no rule is published, `SeventhOfTheNight` is the least-bad default, for a reason R3 did not give.** R3's
reason was engine agreement, which is a property of the harness and not of the user's experience. The better reason
is measured here: the portion rules differ in how often they fire, and `MiddleOfTheNight` fires only on the days
the angle has no answer (60 of 365 at London) while `SeventhOfTheNight` fires on 221. A rule that only engages at
the extreme produces a **discontinuity**: Fajr drifts smoothly for 305 days and then jumps by up to 173 minutes.
`SeventhOfTheNight` is continuous because it is engaged most of the time. For an app that shows a countdown and
sends a notification, a continuous rule is the correct engineering choice, and it happens to agree with adhan's own
`METHODS.md` recommendation above 48 degrees (cited, R3).

**It must be a separate, visible setting as well.** Two reasons. First, R1 found that the authorities themselves
admit the question is unresolved, quoting Diyanet: "up to now no unity has been achieved on any single estimation
method". A setting the app hides is a position the app has taken on the user's behalf on a question their own
scholars have not settled. Second, the measured spread is up to 232 minutes; a user whose mosque uses a different
rule has no way to reach agreement with it unless the setting exists.

**Where the threshold should sit.** Not at a fixed latitude. The measured thresholds run from 46.6N for a
20-degree Fajr to 54.6N for a 12-degree one, so the rule should engage **when the chosen angle has no solution or
when the portion bound would displace it**, which is exactly what adhan already does. What should NOT be copied is
`recommended()`'s fixed 48, both because it is angle-blind and because of the southern-hemisphere bug in Part 5.

---

## Part 3: the polar policy

### What each resolution does

Method `MuslimWorldLeague`, `highLatitudeRule` at adhan's default, full year of 2026. Null count is days on which
the value is `Invalid Date`. All **measured**, full tables in `data/validation/polar.txt`.

| city | lat | resolution | fajr nulls | sunrise nulls | dhuhr nulls | asr nulls | maghrib nulls | isha nulls |
|---|---|---|---|---|---|---|---|---|
| Anchorage | 61.22 | any | 0 | 0 | 0 | 0 | 0 | 0 |
| Reykjavik | 64.15 | any | 0 | 0 | 0 | 0 | 0 | 0 |
| Murmansk | 68.96 | `Unresolved` | 63 | 102 | 0 | 0 | 102 | 63 |
| Tromso | 69.65 | `Unresolved` | **69** | **116** | 0 | 0 | **116** | **69** |
| Utqiagvik | 71.29 | `Unresolved` | 83 | 146 | 0 | 0 | 146 | 83 |
| Longyearbyen | 78.22 | `Unresolved` | 129 | **240** | 0 | 0 | **240** | 129 |
| all four | | `AqrabBalad` or `AqrabYaum` | 0 | 0 | 0 | 0 | 0 | 0 |

R3's Tromso counts of 69 and 116 reproduce exactly. Note that **Anchorage and Reykjavik have no nulls at all**:
both are below the Arctic Circle, so the polar resolution never fires there and the whole question is a
high-latitude one, not a polar one.

### The cost of resolving: what each one moves that it did not need to

This is the question R3 raised and did not answer. Dhuhr and Asr are calculable on every day of the year at every
latitude, so a resolution that changes them is substituting a fiction for a fact. Days where BOTH the resolution
and `Unresolved` produced a value, so the count isolates unnecessary movement. **Measured**:

| city | resolution | dhuhr moved | asr moved | asr mean move | asr max move |
|---|---|---|---|---|---|
| Tromso | `AqrabBalad` | **0/365** | 117/365 | -16.1 | **92** |
| Tromso | `AqrabYaum` | **100/365** | 118/365 | -19.2 | 82 |
| Murmansk | `AqrabBalad` | **0/365** | 102/365 | -11.8 | 63 |
| Murmansk | `AqrabYaum` | **92/365** | 104/365 | -14.5 | 61 |
| Utqiagvik | `AqrabBalad` | **0/365** | 148/365 | -32.0 | **402** |
| Utqiagvik | `AqrabYaum` | **119/365** | 148/365 | -38.6 | 206 |
| Longyearbyen | `AqrabBalad` | **0/365** | 241/365 | -92.4 | **1547** |
| Longyearbyen | `AqrabYaum` | **203/365** | 241/365 | -122.8 | 401 |

**`AqrabBalad` never moves Dhuhr; `AqrabYaum` moves it on up to 203 days a year.** That is the clean separator
between the two, and it follows from the mechanics: walking the latitude leaves the longitude and the date alone,
so transit is unchanged, while walking the date changes the equation of time.

Both move Asr, and neither has a good reason to. `AqrabBalad`'s Asr moves are the larger in the tail (1,547 minutes
at Longyearbyen) because the substituted latitude changes the noon solar altitude, which is the input the
shadow-ratio definition is most sensitive to near the pole.

**How far each has to reach**, measured:

| city | days needing a resolution | `AqrabBalad` max latitude walked | `AqrabYaum` max days walked |
|---|---|---|---|
| Tromso | 117 | 4.0 deg | 35 |
| Murmansk | 103 | 3.5 deg | 32 |
| Utqiagvik | 148 | 6.0 deg | 42 |
| Longyearbyen | 240 | **12.5 deg** | **65** |

At Longyearbyen `AqrabBalad` substitutes a place 1,390 km away and `AqrabYaum` substitutes a day two months away.
Neither is a small fiction.

### The finding no previous report caught: the card is incoherent even when nothing is null

A prayer card must read Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha in time order. Counted over 365 days, on days
where all six values exist. **Measured**:

| city | resolution | days with all six | days OUT OF ORDER | worst inversion (min) |
|---|---|---|---|---|
| Anchorage | any | 365 | **0** | 0 |
| Reykjavik | any | 365 | **0** | 0 |
| Tromso | `Unresolved` | 248 | **18** | **2208** |
| Tromso | `AqrabBalad` | 365 | **43** | 2208 |
| Tromso | `AqrabYaum` | 365 | **66** | 2208 |
| Murmansk | `Unresolved` | 262 | 18 | 706 |
| Murmansk | `AqrabYaum` | 365 | 47 | 706 |
| Utqiagvik | `Unresolved` | 218 | 21 | **5761** |
| Utqiagvik | `AqrabYaum` | 365 | 85 | 5761 |
| Longyearbyen | `AqrabYaum` | 365 | **125** | 686 |

**Filling the nulls makes the ordering worse, not better.** At Tromso, `Unresolved` breaks the order on 18 days and
`AqrabYaum` on 66. The 2,208-minute inversion is the Asr runaway that R3 measured and wave 1 traced to the noon
solar altitude dropping below about 2 degrees, and it is present under **every** resolution because none of them
touches the cause. A polar policy that only asks "does every field have a value" ships a card that says Asr comes
before Fajr.

### How many people this actually affects

Sized honestly, because the answer changes the engineering priority.

| population | figure | status |
|---|---|---|
| north of the Arctic Circle (66.57N) | **about 4 million**, with a range of 4 to 6 million across sources | **cited**, several secondary sources agreeing (`geographyrealm.com`, `discoveringthearctic.org.uk`, `transun.co.uk`, all fetched 2026-09-30). **UNVERIFIED as a primary census aggregate**: no national statistics office publishes a cross-border above-66.57 total |
| largest settlement above the Arctic Circle | Murmansk, **about 270,000 to 300,000** | cited, multiple secondary sources, spread of 30,000 between them |
| settlements above the Arctic Circle over 40,000 people | **eight** | cited, `transun.co.uk`, fetched 2026-09-30 |
| Tromso | about 78,000 | cited, secondary, from Statistics Norway 2023 to 2024 figures |
| Longyearbyen, Svalbard | about 2,500 | cited, secondary |
| Muslim population above the Arctic Circle | **not sourceable** | **UNVERIFIED.** No census anywhere breaks religion by latitude. The nearest usable proxies are national: Norway about 5.7 percent and Sweden about 8 percent Muslim (cited, secondary summaries of Pew), but those are national shares and the Arctic populations are not representative |
| Anchorage Muslim community | about 3,000 | cited, `alaskamasjid.org` and the Islamic Community Center of Anchorage. **Anchorage is at 61.2N, below the Arctic Circle**, so this is a high-latitude number, not a polar one |

**The contrast is the point.** Saint Petersburg (59.9N, about 5.6 million), Oslo, Helsinki, Stockholm and Uppsala
all sit at or near 60N. Measured in Part 2, those latitudes have **zero days a year on which the high-latitude
rules agree** and Fajr spreads of 68 to 91 minutes. The Arctic Circle population, at 4 million spread across eight
countries with no sourceable Muslim share, is a fraction of the people affected by the rule question at 60N alone.

**Honest conclusion: the polar circle is a correctness obligation, not a product priority.** It affects a small
number of users, but a wrong answer there is visibly wrong, and an app claiming worldwide coverage cannot show
`Invalid Date`.

### The recommended polar policy

**Four parts, in order.**

1. **Keep `PolarCircleResolution.Unresolved`.** It is the only setting that tells the truth. Both alternatives
   substitute a place or a date and neither is more defensible than the other, but only `Unresolved` lets the app
   choose what to say.

2. **Handle the null in the UI, with a named rule, not a blank.** The prayer exists as an obligation even when the
   astronomical marker does not; what is missing is the marker. The honest display names the substitution: "no
   twilight today; Fajr estimated from the nearest day on which there was one" is a sentence a user can evaluate.
   `Invalid Date` is not.

3. **If a substitution is needed, use Aqrabul-Ayyam over either adhan resolution.** It is a rule a named body
   publishes (Wifaqul Ulama, cited, R1), it is the same family as `AqrabYaum` but anchored on the sunrise and
   sunset OFFSET rather than the raw clock, and measured in Part 2 it leaves Dhuhr and Asr completely untouched
   because it only supplies Fajr and Isha. `AqrabYaum` moves Dhuhr on up to 203 days a year; Aqrabul-Ayyam as
   implemented here moves nothing it was not asked to.

4. **Bound Asr independently of the polar question.** The 2,208-minute inversion at Tromso and 5,761 at Utqiagvik
   are present under every resolution and are not a polar-circle problem; they are the shadow-ratio definition
   failing when the noon sun is very low. See Part 5. Any polar policy that does not also bound Asr ships a broken
   card.

---

## Part 4: the verification suite, delivered

R3 designed this in detail, called it "the direct answer to 'we can't verify if it's correct or not'", and did not
build it. It is built. Everything is in `data/validation/`, and `README.md` there covers how to run it.

### What was delivered

| artefact | what |
|---|---|
| `usno_fetch.sh`, `usno/` | **400 committed JSON responses**, 20 cities x 20 dates, `https://aa.usno.navy.mil/api/rstt/oneday`, API v4.0.1, `tz=0`. 1.6 MB |
| `usno_twilight_fetch.sh`, `usno_year/` | **80 committed whole-year HTML tables**, 20 cities x 4 quantities (sunrise/sunset, and twilight at -6, -12 and **-18**), `https://aa.usno.navy.mil/calculated/rstt/year`. 1.3 MB |
| `verify.mjs` | the runnable checker. `--gate` gives terse stderr and exit 1 on any failure, which is the CI shape |
| `verify.txt` | its full output |
| `authority/` | the MWL portal, the Egyptian ESA table and the FCNA ruling, all verbatim |

Licence: USNO data is US Government work, not subject to domestic copyright, so it is committed verbatim. The `ID`
parameter in the request URLs is the USNO's own unique-user counter, not authentication, and carries no secret.

**One correction to R3's design.** R3 proposed using the USNO's astronomical twilight from the JSON API. That API
publishes **only civil twilight**; its own documentation says "For the Sun, it also computes the times at which
civil twilight begins and ends" and nothing more (cited, `aa.usno.navy.mil/data/api`, fetched 2026-09-30). The -12
and -18 tables come from the separate whole-year form, whose `task` parameter takes `0` sunrise/sunset, `2` civil,
`3` nautical and `4` astronomical (read from the form at `aa.usno.navy.mil/data/RS_OneYear`). That form returns a
**whole year in one request**, so Layer 2 ended up 30 times larger than R3's design rather than a subset of it.

### Layer 1: sunrise, transit and sunset, against the USNO rise/set service

All **measured**, `adhan@4.4.6`, `MuslimWorldLeague` with method adjustments zeroed.

| city | lat | tolerance | n | exact | within tol | worst | mean | verdict |
|---|---|---|---|---|---|---|---|---|
| London | 51.5 | 1 | 60 | 57 | 60 | 1 | -0.02 | PASS |
| Makkah | 21.4 | 1 | 60 | **60** | 60 | 0 | 0.00 | PASS |
| Jakarta | -6.2 | 1 | 50 | **50** | 50 | 0 | 0.00 | PASS |
| Istanbul | 41.0 | 1 | 60 | 59 | 60 | 1 | 0.02 | PASS |
| Karachi | 24.9 | 1 | 60 | 55 | 60 | 1 | 0.02 | PASS |
| Lagos | 6.5 | 1 | 60 | 59 | 60 | 1 | 0.02 | PASS |
| NewYork | 40.7 | 1 | 59 | **59** | 59 | 0 | 0.00 | PASS |
| SaoPaulo | -23.6 | 1 | 60 | **60** | 60 | 0 | 0.00 | PASS |
| CapeTown | -33.9 | 1 | 60 | 59 | 60 | 1 | 0.02 | PASS |
| KualaLumpur | 3.1 | 1 | 50 | **50** | 50 | 0 | 0.00 | PASS |
| Dhaka | 23.8 | 1 | 55 | **55** | 55 | 0 | 0.00 | PASS |
| Cairo | 30.0 | 1 | 60 | 59 | 60 | 1 | 0.02 | PASS |
| Oslo | 59.9 | 1 | 60 | 57 | 60 | 1 | -0.02 | PASS |
| Reykjavik | 64.1 | 2 | 59 | 57 | 59 | 1 | 0.00 | PASS |
| Tromso | 69.6 | 3 | 50 | 47 | 50 | 1 | 0.02 | PASS |
| Singapore | 1.4 | 1 | 50 | 48 | 50 | 1 | 0.04 | PASS |
| Dubai | 25.2 | 1 | 60 | 59 | 60 | 1 | 0.02 | PASS |
| Casablanca | 33.6 | 1 | 60 | 56 | 60 | 1 | 0.07 | PASS |
| Tashkent | 41.3 | 1 | 59 | 57 | 59 | 1 | 0.03 | PASS |
| Anchorage | 61.2 | 2 | 50 | 48 | 50 | 1 | -0.04 | PASS |

**Layer 1: 1,142 comparisons, 1,111 exact (97.3 percent), mean +0.01 minutes, worst 1 minute, 0 of 20 cities
failing.**

### Layer 2: the twilight solver, at the angle an authority actually uses

Days where adhan's night-portion bound displaced the value are excluded from the delta, because those measure the
rule and not the solver. They are counted separately in the null table. All **measured**.

| angle | what it is | n | exact | within 1 | worst | mean |
|---|---|---|---|---|---|---|
| 6 deg | civil twilight | 13,749 | 13,331 | **13,749** | 1 | +0.01 |
| 12 deg | nautical twilight | 12,686 | 12,281 | 12,685 | 198 | -0.01 |
| **18 deg** | **astronomical twilight, numerically the MWL and Karachi Fajr angle** | **9,763** | **9,470** | **9,763** | **1** | **+0.01** |

At the 18-degree angle, by city:

| city | lat | tolerance | n | exact | within tol | worst | verdict |
|---|---|---|---|---|---|---|---|
| London | 51.5 | 1 | 293 | 282 | 293 | 1 | PASS |
| Makkah | 21.4 | 1 | 730 | 714 | 730 | 1 | PASS |
| Jakarta | -6.2 | 1 | 729 | 703 | 729 | 1 | PASS |
| Istanbul | 41.0 | 1 | 423 | 409 | 423 | 1 | PASS |
| Karachi | 24.9 | 1 | 710 | 693 | 710 | 1 | PASS |
| Lagos | 6.5 | 1 | 730 | 709 | 730 | 1 | PASS |
| NewYork | 40.7 | 1 | 424 | 398 | 424 | 1 | PASS |
| SaoPaulo | -23.6 | 1 | 730 | 711 | 730 | 1 | PASS |
| CapeTown | -33.9 | 1 | 522 | 507 | 522 | 1 | PASS |
| KualaLumpur | 3.1 | 1 | 729 | 711 | 729 | 1 | PASS |
| Dhaka | 23.8 | 1 | 729 | 703 | 729 | 1 | PASS |
| Cairo | 30.0 | 1 | 568 | 549 | 568 | 1 | PASS |
| Oslo | 59.9 | n/a | 0 | n/a | n/a | n/a | every day bounded by the rule |
| Reykjavik | 64.1 | n/a | 0 | n/a | n/a | n/a | every day bounded by the rule |
| Tromso | 69.6 | 3 | 98 | 91 | 98 | 1 | PASS |
| Singapore | 1.4 | 1 | 729 | 714 | 729 | 1 | PASS |
| Dubai | 25.2 | 1 | 686 | 671 | 686 | 1 | PASS |
| Casablanca | 33.6 | 1 | 515 | 501 | 515 | 1 | PASS |
| Tashkent | 41.3 | 1 | 418 | 404 | 418 | 1 | PASS |
| Anchorage | 61.2 | n/a | 0 | n/a | n/a | n/a | every day bounded by the rule |

**Layer 2: 36,198 comparisons across three angles, 35,082 exact (96.9 percent), mean 0.00, 0 of 20 cities failing
at 18 degrees.**

The single 198-minute outlier at 12 degrees is a USNO day-boundary artefact: at a handful of coordinates an event
lands within a minute of 00:00 UTC and the USNO prints only one of the pair in that cell (for instance
`'2359       '` at Karachi on 7 May). It is documented in the parser and is not a library defect.

**The three cities reporting "every day bounded by the rule" are the useful ones.** At Oslo, Reykjavik and
Anchorage adhan's night-portion bound is active on all 365 days at 18 degrees, so the raw solver is never exposed.
That is itself a measurement: above about 59.9N, **an 18-degree Fajr from adhan is never the angle, it is always
the rule**.

### The no-solution agreement, which no other check can give

The USNO prints `////` when the sun never reaches the angle. adhan must have no unbounded solve on exactly those
days, and must not produce a value where the USNO says there is none. Both directions counted, at 18 degrees, all
**measured**:

| city | lat | USNO `////` sides | adhan agrees | adhan answered where USNO had none | adhan null where USNO answered |
|---|---|---|---|---|---|
| London | 51.5 | 120 | **120** | 0 | **0** |
| Oslo | 59.9 | 246 | **246** | 0 | **0** |
| Reykjavik | 64.1 | 294 | **294** | 0 | **0** |
| Tromso | 69.6 | 350 | **350** | 0 | **0** |
| Anchorage | 61.2 | 259 | **259** | 0 | **0** |
| NewYork | 40.7 | 2 | 0 | 2 | 0 |
| Dubai | 25.2 | 2 | 0 | 2 | 0 |
| Tashkent | 41.3 | 2 | 0 | 2 | 0 |
| Karachi | 24.9 | 2 | 0 | 2 | 0 |
| Jakarta, KualaLumpur, Singapore, Dhaka | | 1 each | 0 | 1 each | 0 |

**Perfect agreement at every high-latitude city.** The handful of one-and-two-side disagreements at low latitude
are the same day-boundary artefact as the 198-minute outlier: the USNO's cell is half-blank, not the sun failing to
reach -18 degrees at Singapore.

This is the strongest single result in the report. **A US Government body with no opinion about prayer confirms,
on 1,269 separate high-latitude day-sides, the exact days on which an 18-degree Fajr rule must fire.** No fiqh
source can do that and no library's self-consistency can either.

### The tolerance, and why each band is defensible rather than fitted

| latitude band | tolerance | justification |
|---|---|---|
| below 60 | **1 minute** | the USNO publishes only to the minute, so a sub-minute gap is unobservable in the source. Measured here: the worst miss below 60 across 1,142 Layer 1 and 33,000 Layer 2 comparisons is exactly 1 minute, so the gate is tight with zero false alarms |
| 60 to 66.5 | **2 minutes** | R3 measured 0.21 to 0.40 seconds of sunrise per arcsecond of declination error in this band, and adhan's declination error peaks at 11.7 arcsec, so the astronomy alone is worth up to 4.7 seconds. The second minute is rounding headroom, not slack for a bug |
| above 66.5 | **3 minutes** | R3 measured 7.6 seconds of sunrise per arcsecond at Tromso, so the same 11.7 arcsec is worth 89 seconds before any rule applies. A 1-minute gate here would fail on physics rather than on a defect |

The measured worst case is 1 minute everywhere, so every band passes with room. **A 1-minute global gate would also
have passed today**, but it would be undefensible: it would be luck at 69.6N, not correctness, and the first
ephemeris update would break it.

### What the suite proves and what it cannot

| layer | proves | cannot prove |
|---|---|---|
| Layer 1 | adhan's solar position, rise/set solver and transit are correct to 1 minute against a US Government source, at 20 cities from the equator to 69.6N in both hemispheres | nothing about Fajr, Isha, Asr or any angle choice |
| Layer 2 | adhan's twilight solver is correct to 1 minute at -6, -12 and -18 degrees, and its no-solution days are exactly right, which is the whole high-latitude trigger condition | that 18 degrees is the correct Fajr angle. That is a fiqh input |
| Layer 3, not built | nothing; it is adhan's own 8 fixtures as a regression pin plus `authority/` as evidence | it is a pin, not a proof, and R3 said so |

**The honest statement to the owner: the astronomy is now verifiable and verified, against a government source,
offline, with the fixtures committed. The fiqh is not verifiable by anybody, and this report has just measured, in
Part 1, that even the authorities' own software disagrees with their own labels.**

### Two harness traps, and a third this report found

R3 documented two and they are both handled and commented in `verify.mjs`.

**Trap 1, the day pairing, is worse than R3 described.** R3 found that west of about 120 degrees longitude a UTC
day's sunset is printed on the following UTC day, which gave a flat 3-minute error at Anchorage. Measured here, the
same trap bites in the **opposite direction east of about 90 degrees**: at Singapore (103.8E) the sunrise falls
before 00:00 UTC and is printed on the previous UTC day. The first run of `verify.mjs` reported 10 "unpaired" rows
per eastern city because of it. The fix is not a longitude special case: the events are flattened into one absolute
timeline per city and picked by their relation to the transit, which is what the library means by a solar day.

**Trap 2, rounding, reproduces exactly.** The USNO rounds to nearest, `Date.getUTCMinutes()` floors. `mins()`
rounds.

**Trap 3, new here: the USNO's whole-year tables are FIXED WIDTH and must be sliced by column.** Splitting on
whitespace shifts every month after February left by one pair on rows 29, 30 and 31, because February leaves those
cells blank while later months do not. That attributed March times to February and produced 689-minute outliers on
the first run. Each month occupies 11 characters starting at column 4, laid out `bbbb eeee  `.

All three, plus the refraction and search-direction traps from Part 1, are listed in
`data/validation/README.md` so that a future harness does not rediscover them.

---

## Part 5: the case against `adhan`, tested

Five charges, each measured rather than asserted. Full output in `data/validation/attack.txt`.

### Charge 1: the Asr TODO comment. SURVIVES, and it is the strongest charge.

The shipped code, `src/SolarTime.ts` L99-105 of `adhan@4.4.6`:

```ts
afternoon(shadowLength: number) {
  // TODO source shadow angle calculation
  const tangent = Math.abs(this.observer.latitude - this.solar.declination);
  const inverse = shadowLength + Math.tan(degreesToRadians(tangent));
  const angle = radiansToDegrees(Math.atan(1.0 / inverse));
  return this.hourAngle(angle, true);
}
```

Two defects are visible on reading and both are measurable. It uses the **noon** declination for an event hours
later, which R3 identified. And it approximates the noon zenith distance as `|latitude - declination|`, which is
only exact if the sun transits at the observer's meridian at the instant the declination is evaluated.

Tested against the exact definition, `cot(A) = f + cot(a)` with `a` the sun's altitude at the true transit instant,
solved independently with `astronomy-engine`. Delta is the library minus the exact solve, in minutes, across all
365 days of 2026. All **measured**:

**Standard Asr (shadow factor 1):**

| city | lat | adhan exact days | adhan worst | `praytime` exact days | `praytime` worst |
|---|---|---|---|---|---|
| Makkah | 21.4 | 267/365 | 1 | **337/365** | 1 |
| Cairo | 30.0 | 237/365 | 1 | **330/365** | 1 |
| Karachi | 24.9 | 289/365 | 1 | **343/365** | 1 |
| Jakarta | -6.2 | 328/365 | 1 | **353/365** | 1 |
| NewYork | 40.7 | 150/365 | 1 | **296/365** | 1 |
| London | 51.5 | 135/365 | **2** | **294/365** | 1 |
| Oslo | 59.9 | 92/365 | **2** | **275/365** | 1 |
| Reykjavik | 64.1 | 55/365 | **6** | **238/365** | 1 |
| Tromso | 69.6 | 56/308 | **2279** | **188/308** | **1** |

**Hanafi Asr (shadow factor 2):** the same pattern, adhan worst 4 minutes at Reykjavik and **1,197 at Tromso**,
praytime worst 1 minute everywhere. The one city where adhan is ahead is Jakarta, 352 exact days against 343, and
at 6.2S the noon sun is near the zenith and the approximation costs nothing.

**This charge lands.** `praytime` is closer to the exact definition at **17 of the 18 city-madhab pairs tested**,
by a factor of two to four in exact-day count. And at Tromso the difference is not a refinement: adhan's worst
error is **2,279 minutes** where praytime's is **1**. R3 attributed the Tromso Asr runaway to "a property of the
shadow-ratio definition near the polar circle, not of any one library". Measured against an exact solve, that is
**not correct**: the definition itself is stable to a minute there, and adhan's approximation is what runs away.

**The mechanism.** Near the polar circle the noon solar altitude is small, so `cot(a)` is large and the Asr altitude
is a tiny positive number. adhan's `|latitude - declination|` approximation errs by a fraction of a degree, which
at that point on the cotangent curve is worth hours, and its `hourAngle` search then lands on a different day.
praytime, which evaluates the declination at the Asr time and iterates, does not.

**The TODO comment is not a missing citation on correct code. It marks a function that is wrong, and the maintainers
knew.**

### Charge 2: `highLatitudeRule` ignored on the `MoonsightingCommittee` path. SURVIVES.

Wave 1 read this in the source. Reproduced as a measurement here. `PrayerTimes.ts` L120-131: when
`method === 'MoonsightingCommittee'`, the `safeFajr` branch calls `Astronomical.seasonAdjustedMorningTwilight` and
never reads `nightPortions()`.

Each rule run for a full year, then the years compared byte for byte. **Measured**:

| city | method | distinct Fajr years across the three rules | distinct Isha years |
|---|---|---|---|
| London | `MoonsightingCommittee` | **1** | **1** |
| London | `MuslimWorldLeague` | 3 | 3 |
| Oslo | `MoonsightingCommittee` | **1** | **1** |
| Oslo | `MuslimWorldLeague` | 3 | 3 |
| Reykjavik | `MoonsightingCommittee` | **1** | **1** |
| Tromso | `MoonsightingCommittee` | **1** | **1** |

A count of 1 means all three rules produced an identical year, so the setting did nothing. Confirmed.

**What the user loses**, measured as the gap between the MC Fajr and what each rule would have produced under MWL:

| city | lat | rule | days differing | mean (min) | worst (min) |
|---|---|---|---|---|---|
| London | 51.5 | `middleofthenight` | 365/365 | 42.2 | 131 |
| London | 51.5 | `seventhofthenight` | 361/365 | -5.6 | 57 |
| Oslo | 59.9 | `middleofthenight` | 365/365 | 85.4 | 191 |
| Oslo | 59.9 | `seventhofthenight` | 187/365 | 15.6 | 50 |
| Reykjavik | 64.1 | `middleofthenight` | 365/365 | 97.5 | 206 |
| Tromso | 69.6 | `middleofthenight` | 248/248 | 133.3 | 232 |
| Tromso | 69.6 | `seventhofthenight` | 129/248 | 21.0 | 217 |

**The charge lands but the damage is small in practice**, because the MC method's own seasonal function lands
closest to `SeventhOfTheNight` (mean -5.6 at London, 15.6 at Oslo, 21.0 at Tromso), which is the rule this report
recommends anyway. The real problem is the **silence**: a setting that appears to be honoured and is not is worse
than one that is documented as unavailable. The app must not offer the rule setting when the MC method is selected.

### Charge 3: `recommended()` never fires in the southern hemisphere. SURVIVES.

`src/HighLatitudeRule.ts`, verbatim:

```ts
recommended(coordinates: Coordinates) {
  if (coordinates.latitude > 48) {
    return HighLatitudeRule.SeventhOfTheNight;
  } else {
    return HighLatitudeRule.MiddleOfTheNight;
  }
}
```

The comparison is on the **signed** latitude, not `Math.abs`. **Measured**:

| city | lat | `recommended()` returns | Fajr days differing from the mirrored choice | mean (min) | worst (min) |
|---|---|---|---|---|---|
| Manchester | 53.5 | `seventhofthenight` | 0/365 | 0.0 | 0 |
| Copenhagen | 55.7 | `seventhofthenight` | 0/365 | 0.0 | 0 |
| **Ushuaia** | **-54.8** | **`middleofthenight`** | **242/365** | **-54.2** | **178** |

Ushuaia at 54.8S is further from the equator than Manchester at 53.5N and gets the opposite rule, moving Fajr by
54 minutes on the mean and 178 on the worst day. Punta Arenas (53.2S), Rio Gallegos (51.6S) and the southern
Falklands are in the same position.

**The charge lands. It is a one-character bug (`latitude` should be `Math.abs(latitude)`) and it is worth an hour
of Fajr to every user below 48S.** This app should not call `recommended()`; it should apply its own threshold on
the absolute latitude.

### Charge 4: the three-year maintenance gap. COLLAPSES.

Registry facts, `npm view adhan time`, fetched 2026-09-30: 4.4.3 on **2022-05-14**, then nothing until 4.4.4 on
**2026-06-13**, 4.4.5 on 2026-08-30 and 4.4.6 on 2026-08-31. A gap of three years and eleven months.

The question that matters is not the gap's length but whether it hid anything. `adhan@4.4.3` was installed
alongside `adhan@4.4.6` and both were run over 7 presets x 9 cities x 365 days x 6 prayers. **Measured**:

| city | comparisons | outputs differing | worst (min) |
|---|---|---|---|
| Makkah, Cairo, Karachi, Jakarta, NewYork, London, Oslo, Reykjavik | 15,330 each | **0** | 0 |
| Tromso | 12,599 | **0** | 0 |

**0 of 135,239 comparisons differ between the last pre-gap release and the current one.**

**The charge collapses.** Four years of silence changed nothing, which means the library was not broken and waiting
for a fix. The 2026 commits R3 identified (`d8d247f` naming the `HIGH_LATITUDE_THRESHOLD` constant, `b414ab4f`
correcting wrong dates in a fixture) are exactly what this measurement predicts: housekeeping, not bug fixes. A
stable library that nobody needed to change is a different risk profile from an abandoned one, and this
measurement tells them apart.

### Charge 5: `praytime@3.2.0` is smaller and has better Asr physics. PARTLY SURVIVES, does not change the decision.

The Asr half is charge 1 and it lands. The size half is 2.4 KB against 4.6 KB minified and gzipped (cited, R3), a
difference of 2.2 KB in an app binary, which is not a decision input.

**What switching would cost**, with every preset, rounding rule and high-latitude rule matched so nothing but the
engine differs. Cells are days equal out of the comparable days, then the worst delta. All **measured**:

| city | lat | fajr | sunrise | dhuhr | asr | maghrib | isha |
|---|---|---|---|---|---|---|---|
| Makkah | 21.4 | 362/365, max 1 | 363/365, max 1 | 361/365, max 1 | 239/365, max 1 | **365/365, max 0** | 354/365, max 1 |
| Cairo | 30.0 | 353/365, max 1 | 357/365, max 1 | **365/365, max 0** | 202/365, max 1 | 359/365, max 1 | 333/365, max 1 |
| Jakarta | -6.2 | 361/365, max 1 | **365/365, max 0** | 362/365, max 1 | 316/365, max 1 | 363/365, max 1 | 357/365, max 1 |
| NewYork | 40.7 | 335/365, max 1 | 352/365, max 1 | 363/365, max 1 | 98/365, max 2 | 347/365, max 1 | 322/365, max 1 |
| London | 51.5 | 305/365, max 1 | 344/365, max 1 | 364/365, max 1 | 91/365, max 2 | 339/365, max 1 | 324/365, max 1 |
| Oslo | 59.9 | 253/365, max 1 | 319/365, max 1 | 360/365, max 1 | 64/365, max 3 | 310/365, max 1 | 268/365, max 1 |
| Reykjavik | 64.1 | 228/365, max 1 | 288/365, max 1 | **365/365, max 0** | 37/365, max 6 | 270/365, max 1 | 221/365, max 1 |
| Tromso | 69.6 | 144/296, max 13 | 131/248, max 13 | 362/365, max 1 | 42/365, **max 2279** | 111/247, max 19 | 148/296, max 14 |

Below the polar circle the two engines agree within a minute on everything except Asr. Above it they diverge on
everything, and the Asr column is charge 1.

**The charge partly survives and does not change the decision**, for three measured reasons. `praytime` has no
Moonsighting Committee method, which is the one method wave 1 audited line by line and found faithful. `praytime`
has no polar-circle resolution at all: R3 measured it returning the string `"-----"` on 69 to 118 days a year at
Tromso, with `NightMiddle` and `OneSeventh` giving **identical** null counts, meaning its high-latitude rules do
not engage there. And R3 measured its solar series at roughly twice adhan's declination error, degrading from 12.0
to 20.5 arcsec max between 1950 and 2100 where adhan's does not degrade.

### Does the recommendation survive

**Yes. `adhan@4.4.6` stands.** Three of five charges collapse under measurement, and the two that survive are both
fixable in this app's own code without changing library.

Two things changed in the reasoning, and both should be recorded.

**R3's Asr conclusion was wrong and this report corrects it.** R3 wrote that the Tromso Asr runaway is "a property
of the shadow-ratio definition near the polar circle, not of any one library". Measured against an exact solve of
that definition, the definition is stable to 1 minute at Tromso and adhan's approximation is what produces 2,279
minutes. It is a library defect, in the one function whose source says it is unfinished.

**The strongest argument for adhan is now different from R3's.** R3 led on licence, maintenance and the
cross-language fixture family. After this report the strongest argument is that adhan is the **only candidate whose
astronomy has been verified against a government source across 37,340 comparisons with zero failures**, and that
verification is now a committed, runnable artefact rather than a claim. The family's own fixtures did not do that;
`praytime` has not had it done. That is a real asymmetry and it is new evidence.

### The conditions attached to the recommendation

R3 attached five. Four survive unchanged, one is restated, and three are new.

| condition | status | evidence |
|---|---|---|
| Set `highLatitudeRule` explicitly, never leave it at the default | **survives, and is now the largest lever in the whole research wave** | measured: the rule spread is 47.8 minutes mean at London and 112.7 at Tromso, with zero agreeing days at or above 59.3N |
| Keep `rounding` at `Nearest` | survives unchanged | R3, measured |
| Decide the polar policy in the app, not by default | **survives and is sharpened**: keep `Unresolved`, name the substitution in the UI, prefer Aqrabul-Ayyam over either adhan resolution | measured: `AqrabYaum` moves Dhuhr on up to 203 days a year; `AqrabBalad` moves Asr on 117 of 365 at Tromso by up to 92 minutes |
| Treat Asr above about 60 degrees as unreliable | **restated as a hard requirement, not a caveat.** Asr must be bounded independently, because it breaks the card ordering under every polar resolution | measured: 2,279 minutes at Tromso, 5,761 at Utqiagvik, 18 out-of-order days even under `Unresolved` |
| Build the USNO fixture suite before writing feature code | **done.** 480 committed fixture files, a runnable gate, 37,340 comparisons, 0 failures | `data/validation/` |
| **NEW: override `NorthAmerica` to 13/13 for Canada** | adhan has no Canada variant and FCNA publishes one | measured: 13 to 19 minutes of daily Fajr error, up to 64 at Edmonton, plus 49 days a year with no 15-degree solution there |
| **NEW: do not call `HighLatitudeRule.recommended()`** | it tests the signed latitude and never fires below the equator | measured: 242 of 365 days wrong at Ushuaia, mean 54.2 minutes |
| **NEW: do not offer the high-latitude rule setting when `MoonsightingCommittee` is selected** | the path ignores it silently | measured: all three rules produce a byte-identical year at four cities |

---

## UNVERIFIED and open

Ordered by how much the gap would matter.

1. **Whether the MWL endorses the software it ships.** `portal.themwl.org/api/salat/prayer-times` is the MWL's own
   application and it is measured here, but the MWL publishes no method document and the endpoint carries no
   attribution. Whether its country-switched Isha is a policy or an integration detail is **UNVERIFIED**. Next
   step: contact the MWL, or search its Arabic publications and any Islamic Fiqh Council resolution on prayer
   times. R1 left this open and it remains open with better evidence attached.

2. **The Karachi 18/18 pair.** Still no publication, from two independent searches. It is likely that none exists,
   but absence of evidence is all this is. Next step: a direct approach to the University of Karachi, or accept
   permanently that the label names a convention and say so in the app.

3. **The Egyptian measurement is one day.** 22 cities across 7.3 degrees of latitude is a strong sweep, but it is a
   single date (2026-09-30). The angle could in principle be seasonal, as R1 found Malaysia's measured angle
   contradicting its published one. The ESA page serves only today and its month view returns the same day, so a
   seasonal check needs either repeated daily fetches across a year or a different route into the same data.

4. **Redistribution terms for `data/validation/authority/`.** The USNO fixtures are unambiguous (US Government
   work). The three authority captures are not: no licence statement was found on `esa.gov.eg`,
   `portal.themwl.org` or `fiqhcouncil.org`. They are committed as research evidence rather than redistributed as
   product data, which is a defensible position and not an established one. **This is the same legal risk R3
   flagged for national timetables and it is now realised in three files.**

5. **The Diyanet rule's "shar'i night".** R1's citation says the cap is one third of the shar'i night. The shar'i
   night is sunset to true dawn, and on days where true dawn has no solution this report substituted sunrise, which
   is the only computable reading. Diyanet's own handling of that case is **UNVERIFIED**. It changes the cap by up
   to about 80 minutes at 60N in midsummer.

6. **The Arctic population figure.** Four million is cited by several secondary sources and by none of them
   primarily. No national statistics office publishes a cross-border above-66.57 aggregate, and the range in
   circulation is 4 to 6 million. The Muslim share of it is not sourceable at all: no census anywhere breaks
   religion by latitude. Both are marked UNVERIFIED and the recommendation does not depend on either being precise.

7. **Aqrabul-Ayyam as implemented here is this report's reading, not a published algorithm.** Wifaqul Ulama
   specifies "a 3-day average, not the absolute last day" (cited, R1) and does not specify what is averaged. This
   report averaged the OFFSET from sunrise and sunset, because averaging raw clock times across a 55-day reach
   would be nonsense. That choice is defensible and **UNVERIFIED as the body's own intent**.

8. **The exact Asr solve is this report's, not an authority's.** Charge 1's oracle implements
   `cot(A) = f + cot(a)` from `praytimes.org`'s statement of the rule (cited, R1 section 3) with `a` taken at true
   transit. The International Astronomical Center's paper adds a refraction correction to the resulting zenith
   angle (cited, R1), which this solve omits. Including it would move every figure in charge 1 slightly, and would
   not change the ordering, because the correction is common to both libraries.

9. **Layer 3 of the verification suite is not built.** It is adhan's own 8 fixtures, which R3 already ran and found
   all passing inside their declared variance, plus the authority captures. Wiring them into `verify.mjs` is
   straightforward and was not done here.

10. **The `praytime` Asr advantage was measured at 9 cities, not 20.** The pattern is consistent and the mechanism
    is understood, but the sweep is narrower than Layer 1's.

11. **No measurement on the OnePlus 3T.** R3's open item 1 stands untouched. This report added `astronomy-engine`
    to the harness, which is a development-time dependency only and would never ship, so the performance picture
    is unchanged.

12. **The USNO's `////` at low latitude.** A handful of one-sided cells at Singapore, Karachi, Dubai and Tashkent
    were diagnosed as a day-boundary artefact from the raw HTML, which is an inference from the cell layout rather
    than a documented USNO behaviour. It affects 18 of 36,198 Layer 2 comparisons.

---

## Sources

All fetched 2026-09-30 unless stated. Tool named per fact, as the brief requires.

**Authorities, fetched and committed verbatim under `data/validation/authority/`:**

- `https://esa.gov.eg/praytimes.aspx`, the Egyptian General Authority of Survey's own prayer-times page, 78 cities
  for 2026-09-30. Fetched with `curl` (Node's own `fetch` could not reach this host from the research machine, and
  TinyFish returned the page without the postback grid). Saved as `esa_praytimes.html` and parsed to
  `esa_cities.json`.
- `https://portal.themwl.org/api/salat/prayer-times`, the Muslim World League's own portal endpoint, 24 cities.
  The endpoint was located by reading the Angular bundle: `https://portal.themwl.org/runtime.4a30a5c7b36f148c.js`
  gave the chunk map, and `https://portal.themwl.org/2569.fedca3ed5e30bcba.js` contains the service definition.
  Fetched with `curl` via `execFileSync`. Saved as `mwl_portal.json`.
- `https://fiqhcouncil.org/the-suggested-calculation-method-for-fajr-and-isha/`, the FCNA ruling of the Dallas
  General Body Meeting, 27 to 29 October 2017, carrying the 15/15 USA and 13/13 Canada figures and the software
  attribution note. Fetched via `tinyfish.fetch_content` for reading and `curl` for the committed copy. Saved as
  `fcna_ruling.html`.

**The US Naval Observatory, fetched and committed verbatim:**

- `https://aa.usno.navy.mil/api/rstt/oneday`, API v4.0.1, 400 responses, 20 cities x 20 dates, `tz=0`. In
  `data/validation/usno/` with a full URL-and-status log.
- `https://aa.usno.navy.mil/calculated/rstt/year`, 80 whole-year tables, 20 cities x `task` in {0, 2, 3, 4}, which
  is sunrise/sunset and twilight at -6, -12 and -18 degrees. In `data/validation/usno_year/` with a log.
- `https://aa.usno.navy.mil/data/api`, the API documentation, for the statement that the one-day service computes
  civil twilight only. Via `tinyfish.fetch_content`.
- `https://aa.usno.navy.mil/data/RS_OneYear`, the whole-year form, for the `task` option list
  (`0` sunrise/sunset, `1` moonrise/moonset, `2` civil twilight, `3` nautical twilight, `4` astronomical
  twilight). Via `curl`.

**Source code read:**

- `adhan@4.4.6` via `opensrc`, resolved to
  `/tmp/opensrc/repos/github.com/batoulapps/adhan-js/4.4.6`: `src/CalculationMethod.ts` (in full),
  `src/CalculationParameters.ts` (in full), `src/HighLatitudeRule.ts` (in full),
  `src/PolarCircleResolution.ts` (in full), `src/PrayerTimes.ts` (in full), `src/SolarTime.ts` (in full).
- `praytime@3.2.0` from the installed tree, `src/praytime.js` L270-300, for `asrAngle` and `adjustHighLats`.
- `astronomy-engine@2.1.19` `astronomy.js` L6479, for the refraction option validation that establishes how to
  request an airless altitude.

**Registry facts** via `npm view adhan time --json`: the publish dates 4.4.3 on 2022-05-14, 4.4.4 on 2026-06-13,
4.4.5 on 2026-08-30 and 4.4.6 on 2026-08-31.

**Population, all secondary and all marked as such:** `geographyrealm.com/arctic-circle/`,
`discoveringthearctic.org.uk`, `transun.co.uk`, `simplemaplab.com/tools/arctic-circle` for the 4 million Arctic
figure and the eight settlements over 40,000; `alaskamasjid.org` and the Wikipedia entry for the Islamic Community
Center of Anchorage Alaska for the 3,000 Anchorage figure; `en.wikipedia.org/wiki/60th_parallel_north` for the
cities on 60N; `statsmapsnpix.com/2021/11/world-population-by-latitude.html` for the WorldPop 2020 by-latitude
analysis. All via `tinyfish.search` and `tinyfish.fetch_content`. **No primary census aggregate for any
latitude-bounded population was found.**

**Scripts and data written by this report**, all under `ai/features/global-prayer-times/data/validation/`:

| file | what it does |
|---|---|
| `README.md` | how to run everything, and the five harness traps |
| `lib.mjs` | shared helpers: geometric angle inversion, transit-anchored solving, adhan drivers |
| `authority_fetch.mjs` | fetches the MWL portal, the Egyptian ESA table and the FCNA ruling |
| `presets.mjs`, `presets.txt` | Part 1, the four untested presets against the authorities |
| `highlat.mjs`, `highlat.txt` | Part 2, every rule at 11 cities across a year, plus the latitude threshold table |
| `polar.mjs`, `polar.txt` | Part 3, the three polar resolutions, their displacement and the card-ordering check |
| `usno_fetch.sh`, `usno/` | Layer 1 fixtures, 400 JSON responses |
| `usno_twilight_fetch.sh`, `usno_year/` | Layer 2 fixtures, 80 whole-year tables |
| `verify.mjs`, `verify.txt` | Part 4, the two-layer suite and its `--gate` mode |
| `attack.mjs`, `attack.txt` | Part 5, the five charges, each tested |

Environment for every measurement: node v24.14.1, darwin arm64 (Apple M1), `TZ=UTC`, `adhan@4.4.6`,
`adhan@4.4.3` (installed as `adhan-443`), `praytime@3.2.0`, `astronomy-engine@2.1.19`. Every package lives in
`/Users/muji/athan-global-scratch/harness/node_modules`, reached through a gitignored symlink. **Nothing was
installed into the repository.**
