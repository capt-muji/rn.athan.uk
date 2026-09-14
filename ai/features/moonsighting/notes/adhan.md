# adhan 4.4.6 `CalculationMethod.MoonsightingCommittee()` vs Khalid Shaukat's moonsighting.com method

Researcher notes, 2026-09-14. Deltas in minutes, sign = **adhan minus endpoint**. The source code and the endpoint output decide; the README does not.

## 0. What was compared, and where the evidence lives

| item | location |
|---|---|
| adhan source (4.4.6, identical `src/` to the develop branch: `diff -rq` gave no output) | `~/athan-research/src/adhan-js-4.4.6/src/` |
| adhan git history (full clones, for `git log -S`) | `~/athan-research/adhan/git/adhan-js`, `~/athan-research/adhan/git/Adhan` (cloned 2026-09-14) |
| npm `adhan@4.4.6` used by the harness | `~/athan-research/adhan/harness/node_modules/adhan` |
| endpoint tables (365 days × 12 cities × m0/m1/m2, 2026; London 2024 m0–m2; Sydney 2024 m0) | `~/athan-research/endpoint/moonsighting.ahmedbukhamsin.sa_<city>_<year>_m<n>.json` |
| fetch script and log (timestamps and URLs of every request) | `~/athan-research/adhan/scripts/fetch_endpoint.py`, `~/athan-research/adhan/fetch_endpoint.log` |
| main comparison script → output | `~/athan-research/adhan/harness/compare.cjs` → `~/athan-research/adhan/results/tables.md`, `summary.json` |
| follow-up script → output | `~/athan-research/adhan/harness/edges.cjs` → `~/athan-research/adhan/results/edges.md` |

Run with `cd ~/athan-research/adhan/harness && TZ=UTC node compare.cjs` (and `TZ=UTC node edges.cjs > ../results/edges.md`). `TZ=UTC` is needed because adhan reads the calendar date from the `Date`'s *local* getters (`date.getFullYear()/getMonth()/getDate()`, `PrayerTimes.ts` L52–56; `dayOfYear()` in `DateUtils.ts` L50–61). Adhan's UTC instants are converted to each city's IANA zone with `Intl.DateTimeFormat`. After-midnight endpoint values such as `00:12` are compared by wrapping the delta into (−720, 720].

Endpoint: `https://moonsighting.ahmedbukhamsin.sa/time_json.php?year=Y&tz=Z&lat=..&lon=..&method=m&both=false&time=0`. All 2026 tables were fetched between 2026-09-14 05:11:01 and 05:11:49 +0100, all HTTP 200 with 365 entries. Sydney 2024 was fetched at 2026-09-14T04:22:14Z (200, 366 entries). London 2026 was cached by the lead and London 2024 by another researcher. `pray.php` on moonsighting.com says "Calculation method by moonsighting.com, Developed by Ahmed Bu-khamsin, Original code by PrayTimes.org" (crawl copy `~/athan-research/site/www.moonsighting.com/pray.php`). The endpoint is the developer's own host. The primary moonsighting.com `time_json.php` returned HTTP 500 on 2026-09-14.

---

## 1. Findings in minutes

- **Up to 64°N (London, Makkah, Jakarta, Cape Town, Sydney, New York, Toronto, Oslo, Helsinki, Anchorage, Reykjavik), for all 365 days of 2026 and all three methods, Fajr, Sunrise, Dhuhr, Maghrib and Isha are within ±1 minute of the endpoint on every day.** The only exception is Sydney on 2 days, where the endpoint applies the DST change a day early (±60; §5.7).
- The share of ±1 days grows with latitude. Fajr ±1: Makkah 3/365, London 26/365, Oslo 100/365, Reykjavik 156/365. Mean Δ stays within ±0.04 everywhere (tables.md §1). The endpoint-minus-raw spread of sunrise widens the same way: Jakarta [−0.483, +0.5], Reykjavik [−0.9, +1.0] (tables.md §3). This is sub-minute ephemeris or refraction disagreement, not a rule difference.
- **Asr is where the two disagree.** Hanafi at London: 163 days Δ=0, 202 days ±1, none ≥2. Shafi at London: 28 days of ±2. Toward 60–64°N it grows to ±3 (Hanafi Anchorage), ±4 (Hanafi Reykjavik), −5…+5 (Shafi Anchorage) and −5…+6 (Shafi Reykjavik), mean ≈ 0. Asr is not part of Shaukat's twilight model; the endpoint and adhan use different Asr algorithms (§5.9).
- **Tromsø (69.65°N)** is the only city where the methods really part: the polar night, the midnight sun and the days around them (§6).
- **Endpoint offsets:** Dhuhr = transit + 5 and Maghrib = sunset + 3, matching adhan's `methodAdjustments` (§5.5).
- **Endpoint rounding:** nearest minute, matching adhan's default `Rounding.Nearest` (§5.4).
- **Method mapping:** m0 = Shafaq.General + Hanafi Asr, m1 = Shafaq.Abyad + Hanafi, m2 = Shafaq.Ahmer + Shafi, confirmed empirically (§5.3).
- **Coefficients:** no public moonsighting.com document with the coefficients was found. Adhan's coefficients reproduce, to the minute, the only published figures from Shaukat: Fajr 94 to 122 minutes and Shafaq 66 to 100 minutes at Blackburn's latitude (§4.3).

---

## 2. adhan 4.4.6 source, read in full for this method

### 2.1 `CalculationMethod.ts` L44–54

```ts
MoonsightingCommittee() {
  const params = new CalculationParameters('MoonsightingCommittee', 18, 18);
  params.methodAdjustments = { ...params.methodAdjustments, dhuhr: 5, maghrib: 3 };
  return params;
},
```
Fajr angle 18°, Isha angle 18°, no Isha interval, Dhuhr +5 min, Maghrib +3 min. Nothing else sets Fajr, Sunrise, Asr or Isha.

### 2.2 `CalculationParameters.ts` defaults (L9–70)
`madhab = Shafi`, `highLatitudeRule = MiddleOfTheNight`, `polarCircleResolution = Unresolved`, `rounding = Nearest`, `shafaq = General`. `nightPortions()` (L72–83) gives 1/2, 1/7 or angle/60, but **the MC code path never calls it** (§2.4).

### 2.3 `Astronomical.ts`
**Morning (L327–356), minutes before sunrise:**
```
a = 75 + 28.65/55·|lat|   b = 75 + 19.44/55·|lat|   c = 75 + 32.74/55·|lat|   d = 75 + 48.1/55·|lat|
```
**Evening (L358–401), minutes after sunset:**

| shafaq | a | b | c | d |
|---|---|---|---|---|
| Ahmer (L366–370) | 62 + 17.4/55·\|lat\| | 62 − 7.16/55·\|lat\| | 62 + 5.12/55·\|lat\| | 62 + 19.44/55·\|lat\| |
| Abyad (L371–375) | 75 + 25.6/55·\|lat\| | 75 + 7.16/55·\|lat\| | 75 + 36.84/55·\|lat\| | 75 + 81.84/55·\|lat\| |
| General (else, L376–380) | 75 + 25.6/55·\|lat\| | 75 + 2.05/55·\|lat\| | 75 − 9.21/55·\|lat\| | 75 + 6.14/55·\|lat\| |

**Piecewise-linear interpolation over dyy** (identical in both functions, L340–352 and L385–397):
dyy<91: a→b over 91 days; <137: b→c over 46; <183: c→d over 46; <229: d→c over 46; <275: c→b over 46; else b→a over 91 (the last span actually runs 90 days in a 365-day year). Result is applied as `dateByAddingSeconds(sunrise, Math.round(adj·−60))` or `(sunset, Math.round(adj·60))`, i.e. rounded to whole seconds.

**`daysSinceSolstice` (L403–422):** `latitude >= 0` → `dayOfYear + 10`, wrapped at 365/366, so dyy 0 = 21 Dec. Otherwise `dayOfYear − 172` (173 in leap years), wrapped, so dyy 0 = 21 Jun. Evaluated through adhan's own function, the anchors land on 21 Dec, 22 Mar, 7 May and 22 Jun (edges.md E1).

### 2.4 `PrayerTimes.ts`, how Fajr and Isha are chosen
- L22–24 `const HIGH_LATITUDE_THRESHOLD = 55;` (named in PR #204, 2026-08-14; value unchanged since 2016).
- L109 `night = tomorrowSunrise − sunset` (seconds).
- **Fajr** L111–141:
  1. `fajrTime = hourAngle(−18, before transit)`
  2. `if (method === 'MoonsightingCommittee' && coordinates.latitude >= 55) fajrTime = sunrise − night/7` (replaces the 18° value; it is not compared with it).
  3. `safeFajr = seasonAdjustedMorningTwilight(...)` for MC. Otherwise `sunrise − nightPortions().fajr·night`.
  4. `if (isNaN(fajrTime) || safeFajr > fajrTime) fajrTime = safeFajr` → **later of the two**.
- **Isha** L143–181, mirror image: 18° angle, replaced by `sunset + night/7` at lat ≥ 55, then `if (isNaN(ishaTime) || safeIsha < ishaTime) ishaTime = safeIsha` → **earlier of the two**. `shafaq` picks the coefficient set.
- **Threshold is signed.** `coordinates.latitude >= 55` has no `Math.abs`, so the 1/7-night branch never fires in the southern hemisphere (≤ −55°). The seasonal coefficients do use `Math.abs(latitude)`. The RagibHasin/adhaan Rust port uses `latitude.abs() >= 55.0` (see §4.4).
- **HighLatitudeRule is ignored for MC:** `nightPortions()` is only reached in the non-MC `else` branches. Empirically, 0 instants differ between MiddleOfTheNight, SeventhOfTheNight and TwilightAngle across 12 cities × 365 days × 6 prayers (tables.md §6).
- **Invalid propagation:** if sunrise or sunset is NaN (polar day or night) and `polarCircleResolution` is `Unresolved`, the seasonal value and the 1/7 value are NaN too, so Fajr, Sunrise, Maghrib and Isha come back as `Invalid Date`. The 18° candidate may well exist (e.g. Tromsø in polar night) but is discarded, because at lat ≥ 55 it has already been overwritten.
- L193–236: adjustments (`adjustments` + `methodAdjustments`), then `roundedMinute(..., rounding)`.
- L183–191: Maghrib = sunset (the `maghribAngle` branch is only used by Tehran).

### 2.5 `SolarTime.ts`, `TimeComponents.ts`, `DateUtils.ts`, `Rounding.ts`
- Sunrise and sunset use altitude −50′ (L35). Transit and hour angles follow Meeus with interpolation.
- Asr (L93–99) uses the **noon** declination: `tangent = |lat − decl|`, `angle = atan(1/(shadowLength + tan(tangent)))`, then the hour angle. The source carries `// TODO source shadow angle calculation`.
- `TimeComponents` floors to whole seconds. `roundedMinute` (DateUtils L22–35): Nearest rounds up at ≥30 s, Up always adds 60−s (even at s=0), None leaves it.
- `Rounding.ts`: `Nearest | Up | None`.

### 2.6 `HighLatitudeRule.ts`
`recommended(coords)`: `latitude > 48` → SeventhOfTheNight, else MiddleOfTheNight (L8–14). Irrelevant to MC (§2.4). Also signed, with no `abs`.

### 2.7 `PolarCircleResolution.ts`
- **AqrabBalad** (L57–91, L110–119): recomputes `SolarTime` at `lat − 0.5°`. It keeps stepping by 0.5° only while `|lat| >= 65` (`UNSAFE_LATITUDE`, L13); below 65 without a valid result it returns the unresolved default. The shifted `SolarTime` replaces the original **for every prayer, including Dhuhr and Asr**.
- **AqrabYaum** (L18–55): searches alternately forward and back for the nearest date with valid sunrise and sunset, up to 183 days, and uses that date's `SolarTime` for every prayer (Dhuhr moves too).
- Triggered only when today's sunrise or sunset, or tomorrow's sunrise, is invalid (`PrayerTimes.ts` L71–99).

### 2.8 `SunnahTimes.ts`
Middle and last third of the night, from Maghrib to the next day's Fajr, using the same MC params. Not part of the method.

### 2.9 adhan's own test evidence for MC
`Shared/Times/London-MoonsightingCommittee.json` holds 12 dates (1st of each month, 2016) at 51.507194, −0.116711, Hanafi. Its `source` is `http://www.moonsighting.com/pray.php` with the note `"adjusted +/- 1 minute"`, and the source lines mark 12 of the 72 values as `+1`/`-1`: 8 Asr, 2 Fajr, 1 Dhuhr, 1 Isha. The file has no `variance` key, so `test/times.test.ts` L131 uses `data['variance'] || 0`, an exact match. That is adhan's entire CI evidence for this method: 12 days, one city, with hand-adjusted values.

---

## 3. History (git and GitHub, read-only)

| date | commit / thread | what |
|---|---|---|
| 2016-02-21 | batoulapps/adhan-js `5759372` "adding swift implementation" (Ameir Al-Zoubi) | First appearance of all Fajr and General-Isha coefficients (`git log -S` for 28.65, 19.44, 32.74, 48.1, 25.6, 2.05, 9.21, 6.14 all start here; later hits are file moves: `21e8d86` JS 2016-03-18, `d7b1450` Java, `5310ed6`, `a0f248f`, `d047ebc` 2020 refactor). **Values never changed.** |
| 2016-02-28 | `8253e69` "fix for days since solstice function" | Added the year argument (leap-year handling). |
| 2016-04-04 | `aa4713d` / `8e762f7`, PR batoulapps/Adhan#17 "Fix moonsighting calculations for high latitudes" | Before: at lat ≥ 55 the *safe* value was 1/7 night instead of the seasonal one. After: the 18° candidate is replaced by 1/7 night and compared with the seasonal value (today's logic). |
| 2017-05-03 | batoulapps/Adhan#57 "London Unified Prayer Times" | Maintainer z3bi: the London table "uses the Moonsighting committee method with occasional minor offsets (2-3 minutes)". |
| 2017-08-15 | batoulapps/Adhan#79 | A user reports up to 10 min Fajr/Isha variance vs London Central Mosque Oct–Dec. z3bi: "the London Unified Timetable is based off of the moonsighting committee method". These are claims, not measured here. |
| 2016-03-18 | `21e8d86` "finished javascript implementation" | MC's Dhuhr +5 and Maghrib +3 already present as hard-coded `dhuhrOffset`/`maghribOffset` switch cases, commented "Moonsighting Committee requires 5 minutes for the sun to pass the zenith" and "adds 3 minutes to sunset time to account for light refraction". |
| 2018-09-28 | `08bf81b` "support new dubai method" | The same +5/+3 moved from the switch into `params.methodAdjustments = { dhuhr: 5, maghrib: 3 }` (verified with `git show 08bf81b`). No value change. |
| 2021-12-16..23 | adhan-js#78 "Incorrect Isha timing in Milton Canada" → PR #79 `4c62bdf` (v4.3.0) | Isha differed by ~19 min from moonsighting.com for a Shafi user. Adds `Shafaq.Ahmer` / `Shafaq.Abyad` (coefficients 17.4, 7.16, 5.12, 19.44, 36.84, 81.84 first appear here). z3bi, 2021-12-21: **"I have a document from Khalid Shaukat explaining all the calculations."** This is a private document; it was never published in the repo. Reviewer korbav noted a recurring 1-minute Asr difference against pray.php. |
| 2026-08-14 | PR #204 `d8d247f` | `HIGH_LATITUDE_THRESHOLD` constant. No behaviour change. |
| 2026-08-15 | PR #206 | METHODS.md changed "above 55°" to "at or above 55°" to match `>=`. |

METHODS.md L39 (4.4.6): "Method developed by Khalid Shaukat … Uses standard 18° angles for Fajr and Isha in addition to seasonal adjustment values. This method automatically applies the 1/7 approximation rule for locations at or above 55° latitude. Recommended for North America and the UK." No citation.

---

## 4. Primary sources for Shaukat's method, and the comparison

### 4.1 What moonsighting.com says today
`https://www.moonsighting.com/how-we.html` (crawled 2026-09-14, page footer "Updated March 1, 2024"; copy `~/athan-research/site/www.moonsighting.com/how-we.html`):
- "Zuhr: … 5 minutes after Zenith." / "For Sunni's, actual sunset is 3 minutes after theoretical sunset; for Shi'aas it is 17 minutes".
- "From equator to 55degrees, the 18degrees depression angle calculations are compared with the values given by the functions of latitude and seasons and most favorable values are used, which means; For Fajr, the later of the two and for Isha the earlier of the two."
- "at latitudes between 55degrees and 60degrees, the rule of Sab'u Lail (1/7th of the night), is used … Fajr time is later of the two. Similarly … Isha time is earlier of the two."
- "at latitudes more than 60degrees, we slide down to 60degrees and calculate Fajr & Isha using the rule of Sab'u Lail in summer. … In winter, we use research by Moonsighting.com for Subh-Sadiq and Shafaq as functions of latitude and seasons".
- Shafaq, **internally contradictory**: "Moonsighting.com uses Shafaq Ahmer in summer when nights are short and Shafaq Abyad in winter … Shafaq General uses Shafaq Abyad in Summer and Shafaq Ahmer in Winter." The coefficients side with the first sentence. At London, General a = Abyad a = 98.97 (winter, identical coefficient 25.6), while General d = 80.75 ≈ Ahmer d = 80.20 and far from Abyad d = 151.65 (summer) (edges.md E1).
- Coefficients: **not on the page.**

`https://www.moonsighting.com/faq_pt.html` (crawled 2026-09-14, "Updated August 25, 2020"):
- 1.2: "Aqrabul-Bilaad … decreasing the latitude by 0.1 degrees keeping the longitude the same and recalculate Sunset time and repeat this process until a latitude is reached where the sun sets". Zuhr and Asr are "observable for all places on earth and can be easily calculated."
- 2.10: "for areas at or near equator Shafaq disappearance and Subh-Sadiq occurs at 18° every day of the year, and it translates into 75 minutes in all seasons. … Subh-Sadiq at higher latitudes (like Blackburn) is observed at 94 to 122 minutes (14.6° to 10.6 degrees) … Red Shafaq disappears at 66 to 105 minutes (12° to 9.7°)".

### 4.2 Older moonsighting.com material (Wayback, recovered by another agent; provenance in `~/athan-research/pdfs/manifest.json`)
- `http://moonsighting.com:80/articles/fajr&isha-yam.pdf`, capture 20070410171730 (also `fajar&isha-a5.pdf` 20061119060551 and `fajarishainbritain1.pdf` 20060111060751, the same book): Y. A. Miftahi, *Fajar and Isha*, Hizbul Ulama UK, Oct 2005. Book p. 63 quotes Shaukat: "for areas at or near equator shafaq disappearance and subh sadiq occurs in 75 minutes or at 18 degrees in all seasons. … Shafaq disappears at 66 to 100 minutes (9 to 13.6 degrees) at higher latitudes (like England) in different seasons. Subh sadiq at higher latitudes is observed at 94 to 122 minutes (14.5 to 10.6 degrees)". Book p. 89 quotes Shaukat: "the Subha or disappearance of Shafaq is a function of latitude and seasons. When this function is checked against round the year observations of Blackburn, UK, the calculations matched observations with amazing accuracy." **No coefficients anywhere in the three files** (grep for every coefficient value, "formula", "equation" and "curve"; text at `~/athan-research/pdfs/wayback/articles__fajr&isha-yam.pdf.txt`, `~/athan-research/adhan/fajar&isha-a5.pdf.txt`, `~/athan-research/adhan/fajarishainbritain1.pdf.txt`).
- `prayer-french.html`, capture 20100827001844: "Aux latitudes comprises entre 55 et 66 degrés, la règle du soubou` al-layl (1/7e de la nuit) est utilisée". "Le chafaq met entre 66 et 100 minutes (de 9 à 13,6 degrés)". "L'algorithme de moonsighting.com pour la fonction basée sur la latitude et la saison n'est pas encore inclu dans le livret." Beyond the Arctic circle: nearest lower latitude where the sun rises and sets.
- `articles/uk-prayercharts.pdf`, `uk-prayercharts1.pdf` (Hizbul Ulama timetables "computed by Brother Khalid Shaukat"): Zuhr +5, Maghrib +3, Hanafi Asr, Fajr/Isha "based on Mushahadah … Blackburn during September 1987 – August 1988". No formula.
- `articles/prayers-uk.pdf`, capture 20081230101850 (my text extraction: `~/athan-research/adhan/prayers-uk.pdf.txt`): timetables only, no formula.
- `https://www.moonsighting.com/isha_fajr.html` and `/isha_fajr.pdf`: **HTTP 404** on 2026-09-14T04:13Z. acamarata/pray-calc `src/getMSC.ts` cites "moonsighting.com/isha_fajr.html" as its reference. My own Wayback CDX query failed to connect from this shell, so whether that page ever existed is **UNVERIFIED**.

### 4.3 Coefficients: the only public cross-check
There is no public primary document for a/b/c/d. The only published figures are the 2005 minute ranges at "higher latitudes (like England/Blackburn)". Evaluating adhan's own functions (edges.md E1) at Blackburn's latitude, 53.75°N:

| series | adhan min over year | adhan max over year | published (2005 Shaukat quote) | published (faq_pt 2.10, 2020) |
|---|---|---|---|---|
| Fajr | 94.00 (b) | 122.00 (d) | 94 to 122 | 94 to 122 |
| Isha General | 66.00 (c) | 100.02 (a) | "Shafaq" 66 to 100 | "Red Shafaq" 66 to **105** |
| Isha Ahmer | 55.00 (b) | 81.00 (d) | – | – |
| Isha Abyad | 82.00 (b) | 154.98 (d) | – | – |

Fajr min and max, and General-Isha min and max, match the 2005 figures to within 0.02 minutes. That fits coefficients calibrated so that round numbers fall out at 53.75°. The current FAQ's "Red Shafaq … 66 to 105" matches none of adhan's three series at that latitude. Whether 105 is a typo or reflects a later model is **UNVERIFIED**. The degree figures (14.5/14.6° to 10.6°, 9 to 13.6°, 12° to 9.7°) were **not checked**. Equator: every series is 75.00 (Ahmer 62.00), matching "75 minutes in all seasons" for Fajr and General/Abyad.

### 4.4 Coefficient-by-coefficient comparison with other implementations
Identical a/b/c/d for Fajr, General, Abyad and Ahmer, and identical 91/46/46/46/46/91 spans, in:
- `islamic-network/prayer-times-moonsighting`, which how-we.html itself lists under "Moonsighting.com method for prayer times is used by the following resources". Its mawaqit fork is at `~/athan-research/src/mawaqit-prayer-times-moonsighting/src/MoonSighting/{Fajr,Isha,PrayerTimes}.php`. The VB-style comments (`// '91 DAYS SPAN`) suggest a transliteration of BASIC source (inference).
- RagibHasin/adhaan `src/models/method/moonsighting_com.rs`, arafathusayn/masjiduna-waqt `src/moonsighting.ts`, arahmancsd/PrayerTimesManager `MoonsightingPrayerTimes.cs`, acamarata/pray-calc `src/getMSC.ts` (read via `gh api` 2026-09-14).

Differences between the PHP port (the one moonsighting.com links) and adhan:

| aspect | PHP port | adhan | size of effect |
|---|---|---|---|
| dyy on 21 Dec itself | diff = 0 → `dyy = 365` → last branch ≈ a − (a−b)/91 | dyy = 0 → a | London Fajr (101.83−93.20)/91 = 0.095 min; London General (98.97−76.92)/91 = 0.24 min (from E1 values) |
| leap years | `365 + diff`, constant 365 | 366 | 1 dyy ≈ ≤0.25 min. Measured London 2024 and Sydney 2024: all ±1 (edges.md E5) |
| hemisphere | `latitude > 0` north | `latitude >= 0` | none (equator coefficients are constant) |
| rounding | returns `round(minutes)` | rounds to seconds, then the final minute | ≤ 1 min |
| selection rules, 18° or 1/7 | not in the port (offsets only) | §2.4 | – |

### 4.5 Branch by branch: documentation, adhan and the endpoint

| rule | how-we.html (2024) | French page (2010) | adhan 4.4.6 | endpoint (measured) |
|---|---|---|---|---|
| Dhuhr | transit + 5 | – | +5 | +5 (§5.5) |
| Maghrib | sunset + 3 | – | +3 | +3 (§5.5) |
| Fajr < 55° | later of (18°, seasonal) | seasonal function | later of (18°, seasonal) | same. The seasonal value alone is 6–10 min early at Makkah on all 365 days, so the 18° comparison is live (§5.6) |
| Isha < 55° | earlier of (18°, seasonal) | seasonal function | same | same |
| 55–60° | later/earlier of (seasonal, 1/7 night) | 1/7 night between 55 and 66° | 1/7 replaces 18°, then compared with seasonal | same, ±1 (Oslo, Helsinki) |
| > 60° | "slide down to 60°" for 1/7 in summer; functions in winter | 1/7 up to 66° | local 1/7 night, no slide | local 1/7 night, **no slide**: sliding makes Anchorage and Reykjavik worse by up to 5 and 20 min (§5.6) |
| no sunrise/sunset (polar night) | Aqrabul-Bilaad by 0.1° (FAQ 1.2) | nearest lower latitude | Unresolved → Invalid; AqrabBalad 0.5° steps; AqrabYaum | Fajr/Isha = pure 18° times; sunrise/maghrib `-----` (§6) |
| midnight sun | same | same | Invalid, or resolved values | all four `-----` |
| Dhuhr/Asr under polar resolution | "always calculable" (FAQ 1.2) | – | shifted along with the other prayers | not shifted |
| southern ≥ 55° | not stated | not stated | 1/7 branch never fires (signed test) | not measured, **UNVERIFIED** |

---

## 5. Numeric diff against the endpoint (2026, 12 cities, full year)

### 5.1 Main table (library defaults: Nearest, Unresolved)
Cells: days Δ=0 / |Δ|=1 / |Δ|≥2, with [min, max] when not within ±1. Fajr, Sunrise, Dhuhr and Maghrib are identical for m0, m1 and m2. Full per-method rows with means and months are in `results/tables.md` §1.

| city (lat) | Fajr | Sunrise | Dhuhr | Asr m0 (Hanafi) | Asr m2 (Shafi) | Maghrib | Isha m0 General | Isha m1 Abyad | Isha m2 Ahmer |
|---|---|---|---|---|---|---|---|---|---|
| London 51.51 | 339/26/0 | 344/21/0 | 359/6/0 | 163/202/0 | 91/246/28 [−2,2] | 341/24/0 | 339/26/0 | 341/24/0 | 338/27/0 |
| Makkah 21.42 | 362/3/0 | 363/2/0 | 360/5/0 | 305/60/0 | 239/126/0 | 365/0/0 | 358/7/0 | 351/14/0 | 363/2/0 |
| Jakarta −6.21 | 361/4/0 | 365/0/0 | 354/11/0 | 334/31/0 | 316/49/0 | 363/2/0 | 357/8/0 | 352/13/0 | 363/2/0 |
| Cape Town −33.92 | 355/10/0 | 357/8/0 | 360/5/0 | 261/104/0 | 202/163/0 | 358/7/0 | 353/12/0 | 341/24/0 | 359/6/0 |
| Sydney −33.87 | 353/10/2 [−60,60] | 357/6/2 | 355/8/2 | 296/67/2 | 282/81/2 | 361/2/2 | 360/3/2 | 343/20/2 | 353/10/2 |
| New York 40.71 | 350/15/0 | 352/13/0 | 360/5/0 | 190/175/0 | 98/250/17 [−2,2] | 347/18/0 | 348/17/0 | 353/12/0 | 350/15/0 |
| Toronto 43.65 | 351/14/0 | 356/9/0 | 360/5/0 | 176/189/0 | 83/259/23 [−2,2] | 352/13/0 | 350/15/0 | 351/14/0 | 352/13/0 |
| Oslo 59.91 | 265/100/0 | 319/46/0 | 355/10/0 | 89/247/29 [−2,2] | 64/151/150 [−2,3] | 310/55/0 | 325/40/0 | 325/40/0 | 319/46/0 |
| Helsinki 60.17 | 247/118/0 | 312/53/0 | 354/11/0 | 83/263/19 [−2,2] | 57/177/131 [−2,3] | 311/54/0 | 326/39/0 | 322/43/0 | 329/36/0 |
| Anchorage 61.22 | 226/139/0 | 295/70/0 | 359/6/0 | 51/150/164 [−3,3] | 32/68/265 [−5,5] | 286/79/0 | 313/52/0 | 315/50/0 | 314/51/0 |
| Reykjavik 64.15 | 209/156/0 | 288/77/0 | 358/7/0 | 57/160/148 [−4,4] | 37/93/235 [−5,6] | 270/95/0 | 314/51/0 | 305/60/0 | 308/57/0 |
| Tromsø 69.65 | 69/129/50 [−13,7] (n=248) | 131/93/24 [−13,5] (n=248) | 358/7/0 | 42/136/187 [−395,112] | 42/85/238 [−605,162] | 111/112/24 [−19,4] (n=247) | 158/75/15 [−226,4] (n=248) | 161/73/14 [−224,4] | 154/78/16 [−250,4] |

Where large deltas cluster:
- Sydney: 2 days each, 4 Apr (+60) and 3 Oct (−60), the DST boundary (§5.7).
- Asr |Δ|≥2: Oct–Feb, peaking Nov–Jan; e.g. Oslo m0: Jan 11, Feb 5, Oct 4, Nov 8, Dec 1. At Anchorage and Reykjavik m2 it spreads to Mar–Apr and Aug–Sep.
- Tromsø Fajr/Sunrise/Maghrib/Isha |Δ|≥2: only on days next to the polar-night and midnight-sun boundaries (Jan, May, Jul–Aug, Nov). Asr: Sep–Mar.

### 5.2 Months and missing values
In Tromsø the endpoint prints `-----` for Fajr and Isha on 69 days, Sunrise on 117 and Maghrib on 118. Adhan (Unresolved) returns Invalid for Fajr, Sunrise, Maghrib and Isha on 116 days. No other city has any missing value on either side.

### 5.3 Method mapping, checked (tables.md §4)
Isha days with Δ=0, endpoint method vs adhan shafaq (London): m0: General 339, Abyad 17, Ahmer 82. m1: General 15, **Abyad 341**, Ahmer 0. m2: General 79, Abyad 0, **Ahmer 338**. Every city shows the same diagonal; Makkah and Jakarta are less separated because the coefficients converge near the equator. Asr: m0 and m1 `asr` match Hanafi (London 163 exact vs Shafi 0, mean −51.4), m2 `asr` matches Shafi. `asr_s` is always Shafi and `asr_h` always Hanafi, regardless of `method`. **Mapping confirmed: m0 = General+Hanafi, m1 = Abyad+Hanafi, m2 = Ahmer+Shafi.**

### 5.4 Rounding (tables.md §2)
Days with Δ=0, with mean Δ in brackets, for nearest / floor / adhan-Up / ceil applied to adhan's unrounded instant:
- London Fajr 339 (−0.005) / 180 (−0.507) / 185 (+0.493) / 189 (+0.482)
- London Isha 339 (0) / 191 / 174 / 177
- London Dhuhr 359 / 192 / 173 / 183
- Makkah Maghrib 365 (0) / 184 / 181 / 185

**Nearest wins for every non-Asr prayer in every city, and is the only rule with mean ≈ 0.** Floor and Up shift the mean by −0.5 and +0.5. For Asr at high latitude, floor or up sometimes score a few more exact days (Oslo m0: 89 nearest vs 115 floor vs 118 up), but their means sit at ±0.5 while nearest's is ~0. The Asr disagreement is spread, not a rounding bias.

### 5.5 Offsets (tables.md §3): endpoint minute minus adhan's raw instant with `methodAdjustments` zeroed

| city | E.Dhuhr − raw transit [min, max] mean | E.Maghrib − raw sunset [min, max] mean | E.Sunrise − raw sunrise mean | Δ=0 days, Dhuhr/Maghrib with adjustments zeroed |
|---|---|---|---|---|
| London | [4.483, 5.483] 5.002 | [2.400, 3.617] 2.996 | 0.032 | 0 / 0 |
| Makkah | [4.500, 5.483] 4.979 | [2.517, 3.500] 3.004 | 0.023 | 0 / 0 |
| Jakarta | [4.483, 5.483] 4.980 | [2.517, 3.517] 3.022 | −0.005 | 0 / 0 |
| New York | [4.483, 5.483] 4.999 | [2.450, 3.550] 2.991 | 0.028 | 0 / 0 |
| Oslo | [4.483, 5.483] 4.995 | [2.267, 3.717] 3.012 | 0.038 | 0 / 0 |
| Reykjavik | [4.483, 5.483] 4.959 | [2.017, 3.900] 3.005 | −0.002 | 0 / 0 |
| Tromsø | [4.483, 5.483] 5.007 | [−0.567, 22.367] 3.103 (n=247) | 0.084 | 0 / 2 |

All other cities are in the same bands. **The endpoint carries Dhuhr +5 and Maghrib +3 and no sunrise offset.** Zeroing adhan's adjustments drops exact matches for Dhuhr and Maghrib to 0 everywhere, except 2 Tromsø Maghrib days where the sun barely sets. The Tromsø Maghrib outliers are polar-edge days (§6).

### 5.6 Fajr/Isha selection rules (tables.md §5)
Rules built from adhan's own candidates, rounded nearest. A = adhan as shipped; S = seasonal function alone; R2 = documented later-of/earlier-of including 18°, plus 1/7 night at ≥55°, dropping invalid candidates; R2s = R2 with the 1/7 intervals taken from latitude 60° when above 60°.

- **Below 55°, the 18° comparison is live on the endpoint.** Makkah Fajr S: 0/365 exact, Δ −10..−6, mean −8.11; A/R2: 362/3/0. Jakarta Fajr S: Δ −9..−3; Cape Town Fajr S 65 exact vs A 355. Makkah Isha m0 S: 163 exact, max +6; A: 358. At London, New York and Toronto the seasonal value decides nearly every day (S ≈ A).
- **At 55–64° the 1/7 branch is live.** Oslo Fajr S: 174 days ≥2, min −83 (Mar–Sep); A/R2: 265/100/0. Isha S max +38 (May–Aug).
- **A vs R2** (does adhan's dropping of 18° at ≥55° matter?): identical counts in Oslo, Helsinki, Anchorage and Reykjavik. They differ only in Tromsø polar night, where R2 keeps the 18° candidate (§6).
- **No slide to 60°:**
  - Helsinki: R2s 240 exact vs A 247 (still 0 days ≥2).
  - Anchorage: Fajr R2s 119 days ≥2 (min −5), Isha 95 days ≥2 (max +5), vs 0 for A.
  - Reykjavik: Fajr R2s 173 days ≥2 (min −20), Isha 110 (max +20).
  - Evaluating adhan entirely at latitude 60° (tables.md §8): Anchorage Fajr 313 days ≥2 [−12, 11], Reykjavik Fajr 355 days ≥2 [−51, 49].
  - **The endpoint uses the local 1/7 night, as adhan does, not the "slide down to 60°" in today's how-we.html.** It is consistent with the 2010 French page ("entre 55 et 66 degrés").

### 5.7 Sydney DST (edges.md E2)
The endpoint shifts its clock a day early: 4 Apr 2026 is printed in AEST (Dhuhr 12:03) although the zone is still GMT+11 that day (DST ends 5 Apr), and 3 Oct is printed in AEDT (Dhuhr 12:49) although DST starts 4 Oct. Adhan with `Intl` gives 13:03 and 11:49, so Δ = +60 and −60. The same two-day pattern recurs in 2024 (Apr:1, Oct:1). No DST artefact in London, New York, Toronto, Oslo, Helsinki, Anchorage or Reykjavik. This is an endpoint timezone artefact, not a method difference.

### 5.8 Leap year (edges.md E5)
London 2024 m0/m1/m2: every prayer within ±1 except Asr m2 (25 days ±2, same pattern as 2026). Sydney 2024 m0: within ±1 except the two DST days. Adhan's 366-day dyy handling agrees with the endpoint at minute resolution.

### 5.9 Asr
Hanafi at London is within ±1 on all days; Shafi reaches ±2 on 28 days (Jan–Mar, Sep–Nov). At 60–64° it reaches ±3 to ±6, clustering in winter. The mean is ~0 in every city (tables.md §1 and §3: London E.asr − raw asr in [−1.217, +1.233], mean 0.02; Reykjavik [−3.917, +3.683], mean −0.006). This is an algorithm difference with no bias. Adhan uses the noon declination (`SolarTime.afternoon`, carrying a TODO comment). The endpoint is PrayTimes.org-derived per pray.php. Its exact Asr formula is **UNVERIFIED** because the server code is not public. Tromsø Asr is in §6.

---

## 6. High latitude: what each side emits

### 6.1 Named days (tables.md §9; endpoint m0, adhan General+Hanafi)
**Tromsø 21 Jun 2026 (midnight sun)**

| source | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha |
|---|---|---|---|---|---|---|
| endpoint | ----- | ----- | 12:51 | 19:30 | ----- | ----- |
| adhan Unresolved (any HighLatitudeRule) | Invalid | Invalid | 12:51 | 19:30 | Invalid | Invalid |
| adhan AqrabBalad (any rule) | 01:00 | 01:06 | 12:51 | 19:09 | 00:29(+1d) | 00:32(+1d) |
| adhan AqrabYaum (any rule) | 00:52 | 01:05 | 12:56 | 18:59 | 00:01(+1d) | 00:11(+1d) |

**Tromsø 21 Dec 2026 (polar night)**

| source | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha |
|---|---|---|---|---|---|---|
| endpoint | 06:28 | ----- | 11:47 | 12:28 | ----- | 16:56 |
| adhan Unresolved | Invalid | Invalid | 11:47 | 12:28 | Invalid | Invalid |
| adhan AqrabBalad | 09:15 | 11:07 | 11:47 | 11:49 | 12:21 | 14:05 |
| adhan AqrabYaum | 09:05 | 10:57 | 11:36 | 11:08 | 12:09 | 13:53 |
| adhan raw candidates | f18 = 06:28, i18 = 16:56; seasonal, 1/7 night, sunrise and sunset all Invalid | | | | | |

**Reykjavik 21 Jun 2026**

| source | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha |
|---|---|---|---|---|---|---|
| endpoint | 02:31 | 02:55 | 13:35 | 19:46 | 00:07 | 00:28 |
| adhan, all 9 combinations | 02:31 | 02:55 | 13:35 | 19:46 | 00:07(+1d) | 00:29(+1d) |

Reykjavik raw candidates: f18 Invalid, fSeason 00:44, f7 02:30, i7 00:28(+1d), iSeason 01:25(+1d). The 1/7 night decides both prayers. The endpoint prints after-midnight times with no date marker.

Oslo, Helsinki and Anchorage on 21 Jun agree to ±1 across all 9 combinations (1/7 night decides).

### 6.2 Tromsø through the year (edges.md E3, tables.md §5 and §7)
- **Polar night, Nov 28 – Jan 14 (48 days):** the endpoint gives Fajr and Isha; adhan Unresolved gives Invalid. Rounding adhan's raw 18° times to the nearest minute reproduces the endpoint: Fajr 41 days Δ=0 and 7 days ±1; Isha 48/48 Δ=0. **The endpoint falls back to pure 18° Fajr and Isha when sunrise and sunset do not exist.** No moonsighting.com text found documents this. R2, the documented rule applied without adhan's ≥55° overwrite, reproduces it: Fajr n 296, 110 exact vs A's 69; Isha 206 exact vs 158; same ≥2 counts.
- **Midnight sun, May 19 – Jul 25:** both sides empty for Fajr, Sunrise, Maghrib and Isha.
- **Existence mismatches beyond polar night:** May 18 (endpoint all `-----`; adhan Sunrise 00:52, Maghrib 01:54(+1d), Isha 02:59(+1d), Fajr 22:51(−1d), i.e. sunset after sunrise) and Nov 27 (endpoint Maghrib `-----` but Isha 17:11 = 18° time; adhan sunset 11:45 → Maghrib 11:49, Isha 13:25, Δ −226).
- **Transition days with large deltas:** Jan 15 (Fajr/Sunrise −13), Jul 26 (Fajr −13, Maghrib −19, Isha −14), May 17 (Fajr +7). On these days the sun just grazes the horizon, so sub-arc-minute ephemeris or refraction differences flip rise and set times by many minutes.
- **Asr (edges.md E4):** adhan's Asr runs away when the noon solar altitude drops below ~2°. Nov 15: −11 (noon altitude 1.92°). Nov 21: −39 (0.49°). Nov 23: adhan 04:56 vs endpoint 11:31, Δ −395 (0.06°). Jan 19: adhan 07:53 on the next day (−0.03°). The endpoint's Asr stays near noon (11:31–12:06). Neither side returns "no Asr".
- **PolarCircleResolution over the year:**
  - AqrabBalad emits Fajr and Isha on the 69 days the endpoint leaves empty. Where both have values: Fajr Δ −35..+196 (mean +27.8), Isha −204..+4 (mean −29.7), Asr only 1 day Δ=0.
  - AqrabYaum is similar (Fajr mean +28.8) and also moves Dhuhr: 80 days ≥2, ±11.
  - At Oslo, Helsinki, Anchorage and Reykjavik neither option changes anything (the sun rises and sets every day).
- **HighLatitudeRule:** no effect for MC in any city (§2.4).

---

## 7. What in adhan's MC is the documented method, what approximates it, and what is adhan's own choice

**Matches the documentation and the endpoint (measured):**
1. Dhuhr = transit + 5 min; Maghrib = sunset + 3 min (how-we.html; endpoint offsets 5.00 / 3.00 mean).
2. Below 55°: Fajr = later of 18° and the seasonal function; Isha = earlier of 18° and the seasonal function (how-we.html; the endpoint needs the 18° comparison at Makkah, Jakarta and Cape Town).
3. 55–60°: 1/7-of-night compared with the seasonal function, later for Fajr and earlier for Isha (how-we.html; Oslo and Helsinki ±1).
4. Shafaq General / Abyad / Ahmer as three coefficient sets, General by default (endpoint m0/m1/m2 mapping confirmed).
5. Asr shadow factors 1 (Shafi) and 2 (Hanafi).
6. Rounding to the nearest minute (endpoint; not stated on the site).

**Matches the endpoint but not today's how-we.html:**
7. Above 60°: adhan applies the local 1/7 night with no "slide down to 60°". The endpoint does the same (sliding worsens Anchorage and Reykjavik by up to 5 and 20 min). The 2010 French page's "55 to 66°" agrees with this behaviour.

**Taken on trust (no public primary source):**
8. The a/b/c/d coefficients, the 55° normaliser, the 91/46/46/46/46/91 spans and the 21 Dec / 21 Jun anchors. They are identical to the PHP port moonsighting.com links, unchanged since 2016-02-21, and reproduce Shaukat's published 2005 ranges at 53.75°N (Fajr 94–122, Shafaq 66–100) to 0.02 min. The maintainer's source is "a document from Khalid Shaukat" that is not public (adhan-js#78). Status: **corroborated, not verified against a primary text.**

**Adhan-specific choices or divergences:**
9. At ≥55° the 18° candidate is overwritten instead of compared. There is no measurable effect at 55–64°. In polar night it discards the 18° times the endpoint shows, so adhan returns Invalid for 48 Tromsø days.
10. Polar handling. Default Unresolved returns Invalid. AqrabBalad steps 0.5° and only continues while |lat| ≥ 65 (FAQ 1.2: 0.1° steps). AqrabYaum does not appear in the moonsighting.com text. Both resolutions move Dhuhr and/or Asr, which FAQ 1.2 says are always calculable. None of the three reproduces the endpoint's polar-night behaviour.
11. The 1/7 threshold is signed (`latitude >= 55`), so it never applies at ≤ −55°. The seasonal coefficients use `|lat|`.
12. `highLatitudeRule` (including `recommended()`, >48° → SeventhOfTheNight) is silently ignored for MC.
13. The Asr algorithm uses the noon declination: ±1 at London Hanafi, up to ±6 at 64° Shafi, runaway near polar night.
14. Seasonal offsets are rounded to whole seconds before the minute rounding (PHP port: whole minutes). Effect ≤ 1 min, not isolated.
15. The calendar date is read from the JS `Date`'s local fields, so a device zone whose date differs from the location's date shifts the whole day (integration pitfall, not tested on device).

---

## 8. Open questions / UNVERIFIED
1. No public document gives the a/b/c/d coefficients. The `isha_fajr` page cited by pray-calc returns 404, and my Wayback query could not connect.
2. faq_pt 2.10 (2020) says "Red Shafaq … 66 to 105 minutes"; Shaukat in 2005 said "Shafaq … 66 to 100". Adhan's General gives 66–100 and Ahmer 55–81 at 53.75°. Which is current is unresolved.
3. The degree equivalents in the FAQ and the book were not checked.
4. Whether `moonsighting.ahmedbukhamsin.sa` equals moonsighting.com's own `praytable.php` over the full year: the coordinator is checking.
5. The endpoint's Asr and polar-night logic (18° fallback) are inferred from output; the server code is not public.
6. Behaviour of the endpoint at southern latitudes ≤ −55° was not fetched.
7. The Tromsø transition-day deltas (−13 to −19 on sunrise and sunset, −226 on Isha on Nov 27) come from rise/set existence at grazing altitude. Which side is physically right was not assessed.
8. How any of this relates to the London Unified Timetable is out of scope here. The claims in batoulapps/Adhan#57 and #79 are the maintainer's, not measured.

## 9. Sources (fetched 2026-09-14 unless stated)
- adhan source: `~/athan-research/src/adhan-js-4.4.6` (via `opensrc`, by the lead); npm `adhan@4.4.6`.
- `https://github.com/batoulapps/adhan-js` and `https://github.com/batoulapps/Adhan` (git clones); GitHub threads via `gh api`: batoulapps/Adhan #17, #57, #79, #111; batoulapps/adhan-js #29, #78, #79, #204, #206.
- `https://www.moonsighting.com/how-we.html` ("Updated March 1, 2024"), `https://www.moonsighting.com/faq_pt.html` ("Updated August 25, 2020"), `https://www.moonsighting.com/pray.php`: site crawl `~/athan-research/site/www.moonsighting.com/`.
- `https://www.moonsighting.com/isha_fajr.html`, `/isha_fajr.pdf`: 404 at 2026-09-14T04:13Z (copies of the 404 bodies in `~/athan-research/adhan/live_isha_fajr.*`).
- Wayback: `http://moonsighting.com:80/articles/fajr&isha-yam.pdf` @20070410171730; `/fajar&isha-a5.pdf` @20061119060551; `/fajarishainbritain1.pdf` @20060111060751; `/prayer-french.html` @20100827001844; `/articles/prayers-uk.pdf` @20081230101850; `/articles/uk-prayercharts.pdf`, `uk-prayercharts1.pdf` (manifest `~/athan-research/pdfs/manifest.json`).
- Endpoint: `https://moonsighting.ahmedbukhamsin.sa/time_json.php` (URLs and timestamps in `~/athan-research/adhan/fetch_endpoint.log`); API parameters and method labels from `~/athan-research/src/PrayerTimeAPI/README.md`.
- Ports: `~/athan-research/src/mawaqit-prayer-times-moonsighting`; `gh api` contents of acamarata/pray-calc `src/getMSC.ts`, RagibHasin/adhaan `src/models/method/moonsighting_com.rs`, arafathusayn/masjiduna-waqt `src/moonsighting.ts`, arahmancsd/PrayerTimesManager `PrayerTimesManager/MoonsightingPrayerTimes.cs`.
