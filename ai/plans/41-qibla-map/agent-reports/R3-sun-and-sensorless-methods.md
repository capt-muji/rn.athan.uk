# R3: the methods that need no magnetometer and no map

Research agent R3, brief question 4. Computed 2026-09-29/30 in the session's own node runtime against the
installed `adhan@4.4.6`. Every number is either a command output, a `file:line` from `node_modules`, or a
cited URL. Sibling reports `P0-error-budget.md`, `P1-solar-proof.md`, `P2-the-design.md`, `R4` and `R5` were
read after this report's arithmetic was complete; cross-checks are noted where they agree.

Tools used: `tinyfish` MCP for all web search and URL fetch (announced per section); `node` for all
arithmetic; no repo file was modified except this report. A verification pass on 2026-09-30 re-ran the
core computations independently and settled the resolver question the first pass left open
(section 1.1.1); its additions are marked inline.

## Verdict table

| Method | Real-world error | User's effort | Works indoors | Implementation cost | Verdict |
| --- | --- | --- | --- | --- | --- |
| **Sun offset (formulation C: "qibla is N degrees from the sun")** | 0.009 deg computed (measured, section 1.2); the user's aim dominates, ~2 deg total (section 2.4) | Face the sun, turn N degrees | Only with a sunlit window | **Zero new dependencies. `adhan` already ships the solar machinery** (section 1.1) | **BUILD THIS. Primary answer to brief question 4** |
| Sun transit ("Qibla Hour", formulations A/B) | Same computation, and the user judges no angle at all | Wait for the named minute, face the sun | Same | Same 30 lines, plus a crossing solver | BUILD AS THE SPECIAL CASE, never the only path. Fails 64 to 170 days a year in London, Sydney, Reykjavik (section 3.4) |
| Shadow of a vertical object | ~2.2 deg RSS budget in London's good season, dominated by gnomon tilt (section 2.4) | Find a stick, a level floor, the exact minute | Only with sun on the floor | Same as above | OFFER as the no-phone fallback wording, not the UI's core |
| Fused magnetometer compass (session 40, shipped) | 9.7 deg open floor, 30 deg indoors near steel (both measured, session 40 `LOG.md`) | None | **No: the room bends it** | Already shipped | KEEP as the instant answer, demoted with the existing `isFieldTrustworthy` warning |
| `expo-location` heading (session 37) | 71.1 deg measured (session 40 `LOG.md`) | None | No | Already deleted | Stays deleted |
| Gyro-hold after one calibration | 0.1 to 1.2 deg/min drift on consumer MEMS, 4 to 7 deg/s raw chip bias in one lab study (section 5) | Calibrate once, then turn | Yes | High: bias estimation, sensor plumbing | NOT VIABLE as the primary (drift, plus the calibration itself needs the sun or a map anyway) |
| GPS course from walking | ~2.8 deg sd per 100 m at typical phone accuracy; useless at 10 m (section 6.3) | Walk 30 to 100 m in a straight line | No (needs sky) | Low: `expo-location` already exposes `heading` = course (`node_modules/expo-location/build/Location.types.d.ts:281`) | NOT VIABLE as primary; could be a calibration helper at 50 m+, if ever |
| Offline map alignment | 6.2 deg RSS estimated (P0's table; human terms are estimates) | Recognise the street, transfer to body | Yes | The whole of R1/R2's megabyte question | Second to the sun; the sun beats it on every axis except indoor coverage and unfamiliar places |

**The verdict in one paragraph.** The map is the wrong primary answer. The sun's azimuth at a known time and
place is computable to 0.009 degrees with code the app already ships, it is immune to the steel that broke
the compass twice, it costs zero megabytes against the map's tens, and the interaction ("the qibla is 21
degrees right of the sun, right now") asks less of the user than aligning a map does. The map's one real
advantage is that it works indoors and in unfamiliar places, which is exactly where the sun fails; so the
row's honest shape is **sun first, map as the indoor complement**, not map first.

---

## 1. Solar azimuth computation

### 1.1 What `adhan@4.4.6` already exposes: the headline finding

Read on disk, no modification. The CJS build is present and requireable by absolute path:

| Module | Path | Members |
| --- | --- | --- |
| `SolarCoordinates` | `node_modules/adhan/lib/cjs/SolarCoordinates.js` (constructor, lines 16 to 45) | `declination`, `rightAscension`, `apparentSiderealTime`, from a Julian day (fractional hours supported via `Astronomical.julianDay(y, m, d, hours)`) |
| `Astronomical` | `node_modules/adhan/lib/cjs/Astronomical.js:10-306` | 22 functions: `julianDay`, `julianCentury`, `meanSolarLongitude`, `apparentSolarLongitude`, `nutationInLongitude`, `nutationInObliquity`, `meanObliquityOfTheEcliptic`, `apparentObliquityOfTheEcliptic`, `meanSiderealTime`, `altitudeOfCelestialBody`, `interpolate`, `interpolateAngles`, `correctedHourAngle`... |
| `SolarTime` | `node_modules/adhan/lib/cjs/SolarTime.js:17-47` | `transit`, `sunrise`, `sunset` (fractional UTC hours), `hourAngle(angle, afterTransit)`, `afternoon(shadowLength)` |
| `Qibla` | `node_modules/adhan/lib/cjs/Qibla.js:10-19` | the great-circle bearing, Kaaba at 21.4225241, 39.8261818 |

The type declarations confirm the public surface: `node_modules/adhan/lib/types/SolarCoordinates.d.ts`,
`SolarTime.d.ts`, `Astronomical.d.ts`, `Qibla.d.ts`.

The solar series is Meeus' *Astronomical Algorithms*: the source comments cite page 163 (mean solar
longitude, equation of the centre), page 144 (lunar longitude, node, nutation), page 147 (obliquity),
page 165 (declination, right ascension, sidereal time), page 60 (Julian day), page 93 (altitude),
page 102 (transit and hour angle), page 24 (interpolation). Every coefficient matches Meeus' published
values (cross-checked term by term against the NOAA implementation, section 1.2).

**What it lacks: an azimuth function.** `Astronomical` has `altitudeOfCelestialBody` but no
`azimuthOfCelestialBody`. The gap is 20 lines of spherical trigonometry. Given declination `delta`,
hour angle `H` (derivable as `apparentSiderealTime + longitude - rightAscension`, wrapped to
-180..180, positive west) and latitude `phi`:

```
altitude = asin(sin(phi) sin(delta) + cos(phi) cos(delta) cos(H))
azimuth (from south, westward) = atan2(sin(H), cos(H) sin(phi) - tan(delta) cos(phi))
azimuth (from north, clockwise) = the above + 180, wrapped to [0, 360)
```

This is Meeus eq. 13.5's family (the from-south convention); the from-north conversion is the +180 shift.
The hour-angle identity follows from `correctedHourAngle`'s own internals
(`node_modules/adhan/lib/cjs/Astronomical.js:177-185`): `H = Theta - Lw - a` where `Lw = -longitude`, so
`H = apparentSiderealTime + longitude - rightAscension` in the east-positive convention, positive west of
the meridian.

**Zero dependencies, zero megabytes, zero native code.** The 30-line module lives in `shared/` beside
`qibla.ts` and is testable in Jest with the same fixtures. One caveat: the package `exports` map hides
these files from Node's resolver, so an absolute-path require proves the maths but not Metro's behaviour;
P1 records the same caveat and the same conclusion (30-line fallback already proven).

### 1.1.1 The exports-map question, now settled empirically (R3 verification pass, 2026-09-30)

The caveat above is no longer open. This pass drove the exact specifier `adhan/lib/cjs/SolarTime.js`
through all three resolvers the app actually runs under, with real resolver instances rather than reasoning:

| Resolver | Result | Evidence |
| --- | --- | --- |
| **Metro 0.87.1** (the app's bundler, `unstable_enablePackageExports: true` from Expo's default config) | **Resolves.** `metro-resolver/src/PackageExportsResolve.js:44` throws `PackagePathNotExportedError` for the subpath, and `metro-resolver/src/resolve.js:512-527` catches exactly that error class, logs "Falling back to file-based resolution. Consider updating the call site or asking the package maintainer(s) to expose this API." and continues hierarchically into `node_modules/adhan/lib/cjs/SolarTime.js` | `metro-resolver.resolve(ctx, 'adhan/lib/cjs/SolarTime.js', 'ios')` returned `{type: 'sourceFile', filePath: .../node_modules/adhan/lib/cjs/SolarTime.js}` with the warning firing |
| **Jest 30.5.1, both projects** (the repo's `unit` default resolver and the `components` project's `@react-native/jest-preset/jest/resolver.js`) | **Fails.** "Cannot find module 'adhan/lib/cjs/SolarTime.js'" | scratch jest runs through the repo's own `node_modules/jest` and the RN preset resolver, both suites failing on resolution |
| **TypeScript 7.0.2, `moduleResolution: bundler`** (the repo's `tsc --noEmit`) | **Fails.** `TS2307: Cannot find module 'adhan/lib/cjs/SolarTime.js' or its corresponding type declarations` | tsc trace shows the exports map consulted and the subpath rejected |

The repo's `jest.config.js` `moduleNameMapper` has no adhan entry today, so the deep package specifier
would ship in the bundle but break the suite and the typecheck. Three working integrations, all verified:

1. **A relative file path** (`require('../node_modules/adhan/lib/cjs/SolarTime.js')` from `shared/`):
   no exports map governs a file path. Verified under jest (suite passed against the real package) and
   tsc needs `lib/types/SolarTime.d.ts` beside it or a local declaration.
2. **One `moduleNameMapper` line** (`'^adhan/lib/cjs/(.*)$': '<rootDir>/node_modules/adhan/lib/cjs/$1.js'`)
   fixes jest while Metro and the specifier stay as they are.
3. **The 30-line self-contained module** (P1's fallback): no adhan internals at all, sidesteps every
   resolver, at the cost of duplicating Meeus coefficients this report has already cross-validated twice.

**The finding that changes nothing and confirms everything: the solar code is already in the shipped
bundle.** `PrayerTimes` (the public export, `lib/cjs/Adhan.js:8`) constructs `SolarTime` at
`lib/cjs/PrayerTimes.js:16`, which constructs `SolarCoordinates` and pulls in the whole `Astronomical`
module. Since `shared/qibla.ts:1` imports from `'adhan'`, Metro's module graph already contains every
solar function this report relies on. The bundle cost of the sun feature is the 30 lines of azimuth
arithmetic, not the astronomy.

### 1.1.2 The public-API-only route, measured (the no-deep-import fallback)

If the plan wants zero contact with adhan internals, solar azimuth is derivable from the public exports
alone: `PrayerTimes` gives `sunrise`, `sunset`, `dhuhr` as `Date`s; half the sunrise-to-sunset span gives
the hour angle at adhan's own -50-arcmin altitude; that equation solves for the sun's declination
(bisection, both hemispheres); `dhuhr` anchors the hour angle for any instant. Measured against the
direct model over 112 samples (5 cities, 6 dates, 5 times each):

```
worst azimuth error: 1.350 deg (Cairo, 21 Jun, near-noon)
mean azimuth error: 0.288 deg
worst altitude error: 0.311 deg
```

Two documented limits: the day-length-to-declination inversion is ill-conditioned near the solstices
(day length changes least there, so adhan's minute-rounded sunrise/sunset saturates the solve), and it
collapses entirely above the polar circle. **0.29 degrees mean is accurate enough for a 45-degree fiqh
floor and a 2-degree accuracy bracket, but the deep import's 0.004 degrees is free, so the public-only
route is the fallback, not the plan.**

### 1.2 Validation: 0.006 degrees against the NOAA reference

The NOAA solar calculator's own implementation was fetched and read in full
(`https://gml.noaa.gov/grad/solcalc/main.js`, fetched via tinyfish `fetch_content`; the calculator itself at
`https://gml.noaa.gov/grad/solcalc/`). NOAA's algorithm is the same Meeus lineage: identical coefficients
for mean longitude (`280.46646`), equation of the centre (`1.914602...`), apparent longitude
(`- 0.00569 - 0.00478 sin(Omega)`), and obliquity correction (`+0.00256 cos(Omega)`).

I ported NOAA's `calcAzEl` verbatim (hour angle from the equation of time) and computed the azimuth
independently from `adhan` (hour angle from sidereal time). Two different hour-angle paths around the same
solar theory. Sample output, both evaluated at the exact instant (NOAA's own web UI evaluates solar
coordinates at 0h UT, which adds up to 0.2 deg of hour-angle staleness; the first run at 0h UT showed
that residual and the instant-eval run removed it):

```
instant-eval comparison (NOAA evaluated at the exact instant, geometric, no refraction):
case | adhan az | NOAA az | daz | adhan alt | NOAA alt | dalt
London 2026-09-29 12:42 UTC | 195.6467 | 195.6409 | 0.0058 | 34.8681 | 34.8689 | -0.0008
London 2026-06-21 05:00 UTC |  63.5182 |  63.5189 | -0.0007 |  9.0937 |  9.0942 | -0.0006
London 2026-12-21 12:00 UTC | 180.3377 | 180.3353 | 0.0024 | 15.0546 | 15.0546 | -0.0000
Jakarta 2026-03-20 02:00 UTC |  84.1269 |  84.1256 | 0.0013 | 44.6472 | 44.6532 | -0.0060
Reykjavik 2026-06-21 14:00 UTC | 190.6493 | 190.6507 | -0.0015 | 48.9839 | 48.9838 | 0.0001
New York 2026-01-15 15:30 UTC | 155.5016 | 155.5022 | -0.0006 | 24.3778 | 24.3780 | -0.0002
Sydney 2026-07-05 01:00 UTC |   16.1894 |  16.1879 | 0.0015 | 31.5791 | 31.5795 | -0.0003
Cape Town 2026-10-10 08:20 UTC |  56.1299 |  56.1288 | 0.0011 | 48.9045 | 48.9052 | -0.0007
max |daz| = 0.0058 deg, max |dalt| = 0.0060 deg
```

**0.006 degrees (22 arcseconds) of maximum disagreement across 8 cities, 4 continents, both hemispheres,
all four seasons.** This matches sibling P1's independent 104-sample cross-check, which measured 0.54
arcminutes (0.0089 deg) max disagreement against a second independently-written implementation. Two
separate cross-validations, same order of magnitude.

One documented ill-conditioning: at Makkah on 27 May near solar noon, the sun sits at 89.8 deg altitude and
a 0.065 deg altitude difference near zenith amplifies to 3.9 deg of azimuth difference between the two
implementations, because `cos(zenith)` divides the azimuth formula. Azimuth near zenith is geometrically
meaningless, not wrong; the design gates on altitude (P1 section 6, ceiling 65 deg) which excludes this case.

### 1.3 The published algorithms, compared

| Algorithm | Published accuracy | Valid range | Cost | Phone-appropriate | Source |
| --- | --- | --- | --- | --- | --- |
| **NREL SPA (Reda & Andreas)** | **±0.0003 deg** (±1 arcsecond) | years -2000 to +6000 | Heaviest: hundreds of terms, iterative Julian-century transforms, trig tables A4.x | Overkill: heliocentric latitude, Earth-Helmertz terms for a 1-arcsecond claim nobody's prayer needs | NREL/TP-560-34302, confirmed by Sandia PVPMC (`pvpmc.sandia.gov/modeling-guide/1-weather-design-inputs/sun-position/solar-position-algorithm-spa/`) and the paper text itself (`docs.nlr.gov/docs/fy08osti/34302.pdf`, fetched via tinyfish search snippets from three mirrors) |
| **Meeus low-precision (NOAA, adhan)** | sunrise/sunset "theoretically accurate to within a minute for locations between +/- 72 latitude" per NOAA; my cross-validation shows **0.006 deg** instant azimuth agreement between two independent implementations of this class | 1901 to 2099 (spreadsheet approximation); the web calculator -2000 to +3000 | ~40 trig calls per position; measured **1.8 million positions/second in node on this machine** (below) | **Yes, and it is already installed** | `https://gml.noaa.gov/grad/solcalc/calcdetails.html` (fetched via tinyfish) |
| **PSA (Blanco-Muriel et al. 2001)** | "accurate to within **0.5 minutes of arc** (0.0083 deg) for the year 1999-2015" | 1999 to 2015 (extended 2020-2050 by Grena's 2012 update) | Comparable to NOAA-class; optimised for microcontrollers in C++ | Yes, but no better than what `adhan` already gives, and the validity window is narrower | pveducation.org summarising Blanco-Muriel, "Computing the solar vector", Solar Energy 70(5):431-441 (`https://www.pveducation.org/pvcdrom/properties-of-sunlight/suns-position-to-high-accuracy`, fetched via tinyfish); MDPI Applied Sciences 13(3):1821 confirms the 0.01 deg window and the 2020-2050 update |
| **Grena (2012), five algorithms** | errors spanning **0.19 deg down to 0.0027 deg** by variant | 2010 to 2110 | The cheapest variant is fewer terms than NOAA-class | Yes for engineering use; still no better than installed `adhan` at the accurate end | "Five new algorithms for the computation of sun position by from 2010 to 2110", Solar Energy 86 (2012), `https://www.sciencedirect.com/science/article/abs/pii/S0038092X12000400` (abstract via tinyfish search) |
| Kepler-equation variants (Huang 2022) | ~0.01 deg class | varies | cheap | not needed | MDPI Applied Sciences 12(11):5449, via tinyfish search |

**The decision this table makes: none of them is worth adding.** The question's framing ("is there a
published, citable reference implementation and what is the accuracy claim") has a better answer than any of
these: **the app already ships the Meeus series inside `adhan@4.4.6`, it is citable (Meeus, *Astronomical
Algorithms* 2nd ed., chapters 25 and 28, page numbers in the source comments), and it validates to 0.006 deg
against NOAA's own implementation.** SPA's 0.0003 deg is 20x finer, and it buys nothing: the fiqh tolerance
(section 4) is measured in whole degrees, and the user's own aim is 2 deg and up. The 1.8M
evaluations/second measurement:

```
100k sunPosition calls: 55.57 ms total, 1,799,637 per second
```

So a per-second live "qibla is N degrees from the sun" display costs 0.00006% of one CPU second. The
battery question is the sensor subscriptions, not this arithmetic.

### 1.4 Is there a published reference implementation to cite for the whole method?

Yes, twice over:

1. **NOAA's calculator and its equations page** (`https://gml.noaa.gov/grad/solcalc/calcdetails.html`) is the
   citable public implementation of the same Meeus lineage `adhan` uses, with the stated accuracy claim.
2. **The method itself is `rashd al-qiblah` / qibla observation by shadows**, in the Islamic tradition since
   at least the 13th century, with modern scholarly treatments: Abdali, *The Correct Qibla* (1997); van Gent,
   "Determining the Sacred Direction of Islam" (2017, `https://webspace.science.uu.nl/~gent0113/islam/qibla.htm`);
   Hadi Bashori, *Pengantar Ilmu Falak* (2015) pp. 123-130; King, "Kibla: Astronomical Aspects",
   *Encyclopaedia of Islam* 2nd ed. V:83-88. Section 3 develops this fully.

---

## 2. The shadow method

### 2.1 The physics and the exact interaction

A vertical gnomon's shadow points opposite the sun's azimuth. So "at 13:42 today, a pen's shadow lies along
the qibla" is exactly the statement "the sun's azimuth at 13:42 is the qibla bearing plus 180", which is
formulation B in P1's terms. The app computes the instant; the user holds a pen vertical on the floor and
draws the shadow line.

The arithmetic works: my full-year London sweep (section 3) finds the shadow-along-qibla instant on 42 days
in London at a 5-degree sun gate, and the face-the-sun instant on 258 days, both with times computed to the
second from `adhan`.

### 2.2 The measured error budget

Terms computed in node (script output, London equinox-morning case, sun altitude 21.5 deg at the event):

| Term | Degrees | Basis |
| --- | --- | --- |
| Solar azimuth computation | 0.01 | section 1.2 cross-validation |
| Qibla bearing | 0.05 | session 37's validated figure |
| Phone clock (NTP-synced, seconds) | ~0.01 | azimuth rate 0.23 deg/min, so 1 s costs 0.004 deg |
| Reading the shadow tip 1 mm off, 30 cm gnomon (shadow is 66 cm at this altitude) | 0.87 | `atan(1/66)`, computed |
| **Gnomon 5 deg tilt, worst direction** | **1.80** | Monte Carlo over tilt directions, computed below |
| Floor 1 deg off level, worst direction | 0.90 | linear in the slope, computed |
| **RSS total** | **2.19** | |
| Worst case, all aligned | 3.63 | |

The gnomon-tille table, computed numerically (shadow-direction error, worst over tilt direction):

```
sun altitude 10 deg: tilt 2deg -> 0.4 deg, tilt 5deg -> 0.9 deg, tilt 10deg -> 1.8 deg
sun altitude 20 deg: tilt 2deg -> 0.7 deg, tilt 5deg -> 1.8 deg, tilt 10deg -> 3.7 deg
sun altitude 35 deg: tilt 2deg -> 1.4 deg, tilt 5deg -> 3.5 deg, tilt 10deg -> 7.1 deg
sun altitude 50 deg: tilt 2deg -> 2.4 deg, tilt 5deg -> 6.0 deg, tilt 10deg -> 12.1 deg
sun altitude 65 deg: tilt 2deg -> 4.3 deg, tilt 5deg -> 10.8 deg, tilt 10deg -> 22.2 deg
```

Two properties fall out. First, **the dominant term is the gnomon's verticality, and it scales with the
sun's altitude**: a 5-degree tilt costs under a degree at 10 degrees of sun but 10.8 degrees at 65. A pen
held by hand is 2 to 5 degrees off plumb at best; a phone lying on the floor is a better gnomon base than a
pen standing in a fist. Second, **the method is most accurate when the sun is low**, matching P1's
independent conclusion from the azimuth-rate side.

### 2.3 Failure modes, each real and each computed

| Failure | Mechanism | Where it bites |
| --- | --- | --- |
| **Cloud** | No shadow, no method | London averages ~106 cloudy days a year; any date may fail |
| **Indoors** | No sun on the floor | The majority use case, which is the map's remaining niche |
| **Night** | Sun below horizon | Every prayer after Maghrib in winter |
| **High sun near noon** | Shadow too short to read; azimuth ill-conditioned near zenith (section 1.2's Makkah case: 799 deg/hour sweep rate, P1 section 6) | Tropics, midday |
| **High-latitude winter** | The sun never reaches the qibla azimuth at all: London Dec 21 sunrise azimuth is 128.4 against a qibla of 119.0, so the crossing does not exist (computed, section 3.3) | London Nov 14 to Jan 28, Reykjavik Oct to Feb |
| **Timing** | Azimuth moves 0.21 to 0.28 deg/min in London at event times (computed): 2 minutes late costs 0.5 deg | Everywhere; mitigated by a countdown in the UI |
| **Unlevel floor** | Tilts the whole shadow plane | Any room |

None of these is fatal to the method as a *secondary* path; the design must gate on them and say why it is
unavailable (P2's design does this).

### 2.4 Does the "pen upright" interaction work?

Yes, with the above budget: **about 2 degrees total in the good season, dominated by how plumb the pen is.**
That is better than the fused compass indoors (30 deg), comparable to the compass on open floor (9.7 deg),
and comparable to P0's map-alignment estimate (6.2 deg RSS) but with smaller human terms: the shadow gives
the user a physical line on their own floor, which is a stronger reference than a line on a screen they must
then transfer to their body.

---

## 3. The Qibla-by-solar-transit method, its real names, and the arithmetic of existence

### 3.1 The names and the tradition

The term the tradition uses is **`rashd al-qiblah`** (also transliterated `rasd al-qibla`), "observing the
qibla"; Wikipedia's article "Qibla observation by shadows"
(`https://en.wikipedia.org/wiki/Qibla_observation_by_shadows`, fetched via tinyfish) is the best single
collected source and its bibliography names the scholarly treatments: Abdali 1997, van Gent 2017, Hadi
Bashori 2015, Raharto & Surya 2011, King 1986/1996. The Indonesian literature calls the twice-yearly event
**istiwa' adzam** ("great culmination", `al-istiwa' al-a'dham`), and a 2025 study in the journal *Islamiyyat*
evaluates smartphone qibla apps against it (Umar, R., "Accuracy of Qibla Direction: Evaluating Smartphone
Apps with the Istiwa' Adzam Method", *Islamiyyat* 47(1):3-14, DOI 10.17576/...; found via tinyfish search,
ResearchGate page bot-blocked, so the result figures are UNVERIFIED beyond the abstract snippet: "the
accuracy of the Qibla direction determined using the istiwa' adzam method is consistent. In contrast,
several [smartphone apps]...").

"Yaum al-Qiblatayn" (the day of the two qiblas) refers to the historical event in 624 CE when the qibla
changed from Jerusalem to Makkah, NOT to the sun phenomenon; conflating the two is a common error. The
sun-over-Kaaba days have no widespread single name in English beyond "qibla day" in journalism; the
technical terms are `rashd al-qiblah` for the observation and `al-istiwa' al-a'dham` for the zenith event.

The lineage, per the Wikipedia article and its sources: **Jaghmini (c. 1221)** first recorded the method,
fixing it by the sun's ecliptic position (7 deg 21' Gemini and 22 deg 39' Cancer). **Nasir al-Din al-Tusi
(1201-1276)** relates it in *al-Tadhkira al-Nasiriyya fi 'ilm al-Hay'a*, and his instruction is the daily
method itself: convert Mecca's noon to local time by 4 minutes per degree of longitude difference, observe
on that day, "the direction of the shadow [of the sun] at that time is [opposite to that of] the qibla
bearing." Because the obliquity of the ecliptic is decreasing, al-Tusi's positions differ from today's: as
of 2000 the correct positions are 6 deg 40' Gemini and 23 deg 20' Cancer (van Gent, via the Wikipedia
article's history section).

### 3.2 The two zenith dates, computed from `adhan` and matched against the published record

The derivation: the sun is directly over the Kaaba when its declination equals the Kaaba's latitude
(21.4225 N) at the moment of local solar noon there. Declination crosses +21.4225 twice a year, once rising
(late May) and once falling (mid July). Computed with `adhan` by scanning for minimum zenith distance at the
Kaaba:

| Event | Computed here (2026) | Published | Match |
| --- | --- | --- | --- |
| Sun at Kaaba zenith, first crossing | **2026-05-28 09:18:03 UTC, zenith distance 0.070 deg** | 27/28 May, 09:18 UTC | to the minute |
| Sun at Kaaba zenith, second crossing | **2026-07-15 09:26:33 UTC, zenith distance 0.076 deg** | 15/16 July, 09:27 UTC | 27 seconds |
| Antipodal: sun at Kaaba nadir, first | **2026-01-13 21:30 UTC** (declination crossing computed 12:28 UTC 13 Jan at -21.4225) | 12/13/14 Jan, 21:30 UTC | to the minute |
| Antipodal, second | **2026-11-28 21:09 UTC** (crossing computed 21:44 UTC 28 Nov) | 28/29 Nov, 21:09 UTC | to the minute |

Published times from the Wikipedia article, which cites Hadi Bashori 2015 p. 125-127, Raharto & Surya 2011
p. 25, van Gent 2017 and Abdali 1997 p. 22. The zenith distance is not exactly zero on either date because
declination 21.4225 and local noon do not coincide to the second; 0.07 deg of zenith distance changes the
shadow direction by under a tenth of a degree anywhere on Earth (UNVERIFIED as a computed figure; the
article's own claim is "observations made within a five-minute interval, and at the same time one or two
days before or after the prescribed date, are accurate with negligible deviation", citing Raharto & Surya
and Hadi Bashori).

Antipodal events are usable on the other side of the Earth: the shadow points the same way it would for a
zenith event, and the user faces along the shadow rather than away. Per the Wikipedia article, the events
are visible only where the sun is up: the zenith events serve the hemisphere within 90 degrees of Makkah
(Europe, Africa, most of Asia), and the antipodal events serve the Americas, the Pacific and Australasia,
where the zenith events happen at night. **Abdali 1997 p. 22 records that the first event occurs six minutes
after sunrise in Boston and Montreal, two minutes before sunrise in Ottawa and eleven minutes before sunrise
in New York City, so it cannot be observed in New York or Ottawa at all** (via the Wikipedia article's
observation section).

### 3.3 The daily method, and the arithmetic of existence, city by city

The daily method: the app computes the time the sun's azimuth equals the qibla bearing (user faces the sun)
or its antipode (user reads the shadow). The question is when such a time exists.

The geometry: in the northern hemisphere outside the tropics, the sun rises north of east in summer and
south of east in winter, sweeping from sunrise azimuth through 180 (transit) to the symmetric sunset
azimuth. A crossing exists on the "face the sun" formulation iff the qibla bearing lies within the day's
sunrise-to-transit azimuth range, and on the "shadow" formulation iff the qibla's antipode does.

Computed for 2026, sun above 5 degrees at the crossing (matching P1's gate), 5-minute sampling with
interpolated crossings, deduplicated:

| City | Qibla | Days with face-sun event | Days with shadow event | Either | Longest no-event gap |
| --- | --- | --- | --- | --- | --- |
| Istanbul | 151.6 | 365 | 0 | **365** | 0 |
| Cairo | 136.1 | 365 | 0 | **365** | 0 |
| Jakarta | 295.2 | 218 | 146 | **364** | 1 |
| Makkah | 324.9 | 43 | 311 | 354 | 6 |
| New York | 58.5 | **0** | 301 | 301 | 43 |
| London | 119.0 | 258 | 42 | 258 | 64 (30 Oct to 12 Feb at the 5-degree gate; 14 Nov to 28 Jan at a 0-degree gate) |
| Reykjavik | 106.1 | 197 | 123 | 197 | 94 |
| Sydney | 277.5 | 195 | 130 | 195 | **170** |

These agree with P1's independent sweep (its London 258, Sydney 195, New York 0 face-sun/301 shadow,
Cairo/Moscow 365, Jakarta 218 face-sun) to within a day or two of sampling resolution. Two analyses written
independently from the same `adhan` install reach the same table, which is the strongest internal check
available.

**The answers to the brief's direct questions:**

- **Does the time exist every day in London? No.** On 258 of 365 days for face-the-sun, and the gap is
  winter: from 14 November to 28 January (64 consecutive days) the sun rises south of the qibla bearing and
  never reaches it. On 21 December the sunrise azimuth is 128.4 against a qibla of 119.0: the day's whole
  azimuth arc starts 9.4 degrees south of the qibla and moves further south until transit. There is no
  instant, by geometry, not by cloud.
- **In Jakarta? Almost.** 364 of 365 days have one or the other event (the miss is 4 March, when the sun
  passes near zenith and the azimuth sweep skips the crossing while the sun is above the 5-degree gate).
  Jakarta sits 6 degrees south of the equator with a qibla of 295 (north-west), so both formulations fire
  year-round at various hours.
- **In Reykjavik? No, and worse than London.** 197 of 365 days, with a 94-day winter gap. The polar day
  helps in summer (events at 33 degrees of sun, midnight sun coverage), but from October to February there
  is neither a crossing nor usable sun.
- **In New York and Cairo (this pass's additions)?** New York: 0 face-sun days, 301 shadow days at the
  5-degree gate, because the qibla (58.5, north-east) lies between summer's extreme sunrise azimuth and
  due east, and the sun's whole morning arc north of east only brushes it at the solstice sunrise. Cairo:
  365 face-sun days, the best case in the table, because a 136-degree qibla sits inside the sunrise-to-
  transit arc every day of the year at that latitude. The daily event's existence is a property of
  (latitude, qibla bearing) as a pair, which is why no single interaction can serve all cities.

**The design consequence, agreeing with P1 section 4:** formulations A and B are complementary but their
union still leaves months-long holes. Formulation C (continuous offset, "the qibla is N degrees from the sun
right now") is computable whenever the sun is visible at all, which is 365 days a year outside the polar
night. A transit-time feature ("Qibla Hour") is worth shipping as the special case where the offset is
exactly 0 or 180 and the user judges no angle, but it must never be the only sun-based path.

### 3.4 When the daily event happens in London, worked examples

Computed, BST = UTC+1:

| Date | Event time | Sun altitude | Shadow length (gnomon heights) |
| --- | --- | --- | --- |
| 21 Mar | 09:29 BST | 21.5 | 2.54 |
| 28 May | 10:18 BST | 46.9 | 0.93 |
| 21 Jun | 10:28 BST | 49.4 | 0.86 |
| 15 Jul | 10:26 BST | 47.0 | 0.93 |
| 15 Aug | 10:03 BST | 37.8 | 1.29 |
| 15 Sep | 09:24 BST | 24.7 | 2.18 |
| 1 Oct | 09:02 BST | 17.2 | 3.23 |
| 15 Oct | 08:45 BST | 10.8 | 5.22 |

The event sits in the mid-morning all year in London, always between 08:45 and 10:30 local. That is a
prayer-friendly hour (between Fajr and Zuhr), and the sun altitude at the event is always in the 10 to 50
degree band where the shadow is long and the azimuth rate is slow (0.21 to 0.28 deg/min). **For London
specifically, the daily event is a well-behaved feature for 8 to 9 months of the year and impossible for
3.**

---

## 4. Accuracy comparison and the fiqh tolerance

### 4.1 The decisive table

| Method | Real-world error | Conditions that produce it | Source |
| --- | --- | --- | --- |
| Solar azimuth, computed | **0.006 to 0.009 deg** | Any time the sun is up and the position is known within tens of km | This report, section 1.2; P1 section 2, two independent cross-validations |
| Sun method, end to end (user's aim included) | **~2 deg** | User holds the phone toward the sun and turns N degrees; dominated by the aim, not the astronomy | Section 2.4 budget, engineering estimate for the aim term |
| Shadow method, end to end | **~2.2 deg RSS, 3.6 deg worst case** | Good season, level floor, plumb gnomon | Section 2.2 budget, computed |
| Fused-rotation-vector compass, open floor | 9.7 deg | Measured on the Find X8, top edge aimed at the qibla | Session 40 `LOG.md`, measured |
| Fused compass, indoors near steel | **30 deg** | Two metres of walking in the owner's room; drywall corner bead, steel studs, 19.5 uT horizontal field | Session 40 `LOG.md`, measured |
| `expo-location` heading | 71.1 deg | Same phone, same place, same moment | Session 40 `LOG.md`, measured |
| Smartphone compasses, literature | "discrepancies as high as 80 deg with azimuthal errors dominant" in adverse cases; mean deviations of consecutive-direction azimuths 1.9, 5.5, 6.9 deg across apps | Android devices in field-geology use | Novakova & Pavlis 2017, "Assessment of the precision of smart phones and tablets for measurement of planar orientations", *Journal of Structural Geology*, via ScienceDirect abstract and citing summaries (fetched via tinyfish search; full text bot-blocked) |
| Mosque qiblas as built in practice | Only 30% within 2 deg; 54% between 2 and 10 deg; 16% over 10 deg off | 70 mosques, Bangka Belitung, measured against geodetic azimuths with the solar shadow method as reference | Ismanto et al., "Qibla Direction Accuracy in Bangka Belitung Mosques", *Al-Hilal: Journal of Islamic Astronomy* 8(1):39-50, April 2026, `https://journal.walisongo.ac.id/index.php/al-hilal/article/download/30969/7592/93210` (fetched via tinyfish) |
| Map alignment by eye | 6.2 deg RSS, 10.5 worst case | Human terms are engineering estimates | P0's table; flagged UNVERIFIED there and still needing R4's literature pass |

The Bangka Belitung study matters because it is the largest measured sample I found of the sun-shadow method
used as the REFERENCE against which everything else (compasses, apps, mosque walls) was judged: the
astronomical shadow measurement is treated as ground truth, and the mosques' accumulated compass-and-consensus
errors are what deviate from it. That inverts the usual assumption that the phone sensor is the reference.

### 4.2 The fiqh tolerance: what angular error matters

This is a real question with a real literature. Three sourced positions:

**The Hanafi position (and the majority): `jihat al-Ka'bah`, the general direction, suffices outside Makkah.**

- Al-Marghinani (d. 593 H), *al-Hidayah*: "Whoever is in Mecca, his obligation is to face it directly. And
  whoever is absent, his obligation is to face its direction. This is the sound opinion because obligation
  is according to ability." Quoted in the islamanswers.co.uk answer "facing the Qiblah precisely"
  (`https://islamanswers.co.uk/question/facing-the-qiblah-precisely/`, fetched via tinyfish).
- Ibn al-Humaam (d. 861 H), *Fath al-Qadeer*, records that the early scholars set the qibla of Bukhara,
  Samarqand, Nasaf, Tirmidh, Balkh, Marv and Sarakhs all to the same direction (the place of sunset),
  despite those cities being spread over hundreds of km: precision was not the practice.
  Same source.
- Al-Ayni (d. 855 H), *al-Binayah Sharh al-Hidayah*, lists the majority who held this: al-Thawri, Malik,
  Ibn al-Mubarak, Ahmad ibn Hanbal, Ishaq, Abu Dawud, al-Muzani, and al-Shafi'i in one of his two opinions.
  Same source.

**The commonly cited figure: 45 degrees.** The islamanswers answer derives it from Shurunbulali's
*al-Maraqi al-Falah*: the nullifying deviation is "a deviation that does not completely negate facing it,
such that a part of the surface of the face remains aligned with the Kaaba or its air", and al-Tahtawi's
commentary glosses the nullifying case as "that which goes beyond the east to the west" (for people facing
roughly south, like the community around the Kaaba). Because the face's surface spans a perceptible arc,
the read-out is that within about 45 degrees of the qibla the prayer stands. islamqa.info fatwa 101449
(`https://islamqa.info/en/answers/101449`, fetched via tinyfish) rules the same way on a Jeddah mosque 45
degrees off: "If the deviation from the qiblah is less than 45 degrees, then your prayer is valid, because
what you have to do is face the right direction, not face the Ka'bah or Makkah precisely", citing
al-Dardeer's *al-Sharh al-Kabeer* (1/227) and the hadith "What is between the east and the west is qibla"
(Tirmidhi 342, Ibn Majah 1011, classed sahih by al-Albani). Egypt's Dar al-Ifta has an equivalent fatwa on
rows deviating up to 45 degrees (`https://www.dar-alifta.org/en/fatwa/details/6453/deviating-from-the-qiblah`).

**The Shafi'i school's relied-upon position: `ayn al-Ka'bah`, the exact direction, as far as possible.**
SeekersGuidance's Shafi'i answer (`https://seekersguidance.org/answers/shafii-fiqh/can-i-face-the-qiblas-general-direction/`,
fetched via tinyfish): "The requirement in the Shafi'i School is that the exact direction of the Ka'ba must
be faced (to the extent possible)" citing Misri's *'Umdat al-Salik*; but it also documents the second
Shafi'i position, ascribed to Imam Shafi'i himself via al-Muzani and preferred by Abu al-Hasan al-Juri,
that one distant must merely face `jihat al-Ka'bah`, which is the Hanafi/Maliki/Hanbali criterion ("some
portion of the person's face is directed towards the Ka'ba"). Their practical ruling: following the majority
position is valid, without talfiq, even for a Shafi'i.

**What this means for the app's error budget.** The strictest relied-upon school position (`ayn`) demands
facing the exact direction "to the extent possible", and the exact direction is not geometrically available
to anyone outside Makkah (P0's table: the Kaaba subtends 0.47 arcseconds from London). Every school
therefore operates on `jihat` in practice, and the operative tolerance band between the schools is:

| Reading | Effective tolerance |
| --- | --- |
| The 45-degree figures in the fatwas | validity floor: prayer stands within 45 deg, nullifying beyond |
| Shurunbulali's face-surface criterion | the same 45 deg, derived from the face's arc |
| The Shafi'i `ayn` position, practically | face as precisely as your means allow; the sun method's ~2 deg is well inside any reading |
| The measured mosque population | 84% of mosques sit within 10 deg; 30% within 2 deg |

**No school requires single-degree precision, and every school prefers the most precise available means.**
The Bangka Belitung study's framing is typical of the Indonesian fiqh-astronomy literature: the shadow
method is the verification standard, and 2 degrees is the "accurate" bracket. The sun method at ~2 degrees
end-to-end sits inside the 2-degree bracket the literature treats as accurate, and the fused compass
indoors at 30 degrees sits inside the 45-degree validity floor but far outside any bracket called accurate.
That 30-degree reading is lawful by the fatwas and still wrong by the standard the same tradition uses to
audit mosques, which is the honest sentence to put in front of the owner.

---

## 5. The gyroscope-only option

### 5.1 The physics and the published drift figures

A MEMS gyro measures angular rate; integrate it and you get angle, but every bias error integrates too. The
published consumer-grade figures:

| Source | Figure | Meaning |
| --- | --- | --- |
| de Alteriis et al. 2021, *Sensors* (PMC8309765) | "Consumer-grade MEMS gyros can be affected by a bias instability in the order of **50 degrees per hour or more**" | bias instability, the Allan-variance floor |
| Firgelli / IMU drift estimator (engineering reference) | "MEMS IMUs show typical bias drifts between **1 and 100 deg/hr**" | the consumer band |
| TDK InvenSense ICM-20690 datasheet (the Mi 8's IMU), board-level spec | gyro bias error **±1 deg/s** = ±3600 deg/hr | the chip's own spec sheet, quoted in Bochkati & Pany 2021 |
| **Bochkati & Pany 2021, measured** (Xiaomi Mi 8, 4 units, lab calibration) | raw gyro bias **-3.6 to -7.4 deg/s** per axis (Dev1: -4.1, -6.7, +4.8; mean -4.2, -4.0, +3.0), i.e. **up to 26,640 deg/hr**, and "the bias errors for all tested devices did not reach the expected value which is ±1 deg/s" | the actual uncalibrated chip |
| Same paper, Allan variance | the Mi 8's IMU was "surprisingly competitive" with a commercial MEMS IMU after calibration | the noise floor is not the problem; the bias is |

Sources: Bochkati & Pany, "Does the Android Operating System Provide what the MEMS-IMU Manufacturers
Promise?", DGON Inertial Sensors and Systems 2021
(`https://athene-forschung.unibw.de/doc/139291/139291.pdf`, fetched via tinyfish); de Alteriis et al.
(`https://pmc.ncbi.nlm.nih.gov/articles/PMC8309765/`, search snippet).

### 5.2 The arithmetic of "calibrate once, then turn"

Suppose the user establishes north once by the sun or a map, then turns to face the qibla. Drift
accumulates from the moment of calibration:

| Gyro quality | Drift rate | 2 degrees of error after | 5 degrees after |
| --- | --- | --- | --- |
| Raw chip bias, Mi 8 measured worst axis (-7.4 deg/s) | 444 deg/min | **0.27 seconds** | 0.68 seconds |
| Board spec ±1 deg/s | 60 deg/min | 2 seconds | 5 seconds |
| Bias instability, consumer typical (50 deg/hr) | 0.83 deg/min | 2.4 minutes | 6 minutes |
| Bias instability, good consumer (10 deg/hr) | 0.17 deg/min | 12 minutes | 30 minutes |

The raw bias is not the figure that applies in practice, because Android and iOS do not hand the app raw
integrated gyro: `ROTATION_VECTOR` and CoreMotion fuse the gyro with the accelerometer (gravity direction)
and, in the frames that reference north, the magnetometer. The 50 deg/hr bias-instability figure is the
honest number for a gyro-only hold, and it is the number the OS cannot remove without the magnetometer,
because the accelerometer constrains pitch and roll, not yaw. **Yaw is the one axis with no non-magnetic
absolute reference on a phone.** That is precisely why session 40 found `GAME_ROTATION_VECTOR` (gyro +
accelerometer, no magnetometer) rock-steady and useless for a compass: it holds yaw beautifully but its yaw
zero is wherever it woke up.

**"Calibrate once then turn" is viable for seconds to a few minutes, not for a session.** With a 0.83
deg/min consumer drift, a user who establishes north by the sun, turns to the qibla, and prays a 5-minute
salah picks up about 4 degrees of drift, borderline against the 2-degree standard; a user who sets the
phone down and comes back in 20 minutes is looking at 17 degrees. And the calibration step itself needs the
sun or the map anyway, so the gyro adds a short-lived bridge, not a method.

### 5.3 Where the gyro IS the answer

Inside the sensor fusion the app already uses. Session 40 shipped the fused rotation vector precisely
because the gyro carries fast rotation while the magnetometer corrects north; its problem was never the
fusion but the room's field. The gyro also makes the sun method's interaction better: a "hold the phone
toward the sun, now turn N degrees" UI can use the gyro for the turn itself, where sub-minute drift is
irrelevant, and the sun for the absolute reference. That hybrid (sun for absolute, gyro for relative)
covers exactly the sun method's weakness, which is that the user cannot see the sun AND read the screen at
the same time. P2's design should consider it.

---

## 6. GPS course-over-ground

### 6.1 What `expo-location` exposes

Read from the installed package:

- `node_modules/expo-location/build/Location.types.d.ts:281`: `heading: number | null` on
  `LocationObjectCoords`, documented as "Horizontal direction of travel of this device, measured in degrees
  starting at due north and continuing clockwise around the compass."
- `node_modules/expo-location/android/.../records/LocationResults.kt:156`: `heading = location.bearing.toDouble()`
  i.e. Android's `Location.getBearing()`, the GNSS course over ground.
- `node_modules/expo-location/ios/LocationUtils.swift:30`: `"heading": location.course`, i.e. CoreLocation's
  `CLLocation.course`, the course over ground.

So the field exists on both platforms and is the true course, not the magnetometer. `speed` (m/s) is
exposed alongside (`Location.types.d.ts:287`), filled from `location.getSpeed()` / `location.speed`. There
is NO `bearingAccuracy`/`courseAccuracy` exposure: Android's `Location.getBearingAccuracyDegrees()` and
iOS's `CLLocation.courseAccuracy` are dropped on the floor, so the app cannot know how good a given course
fix is. Also note `heading` is only meaningful when moving: a stationary phone reports a stale or zero
course.

### 6.2 How accurate, at what distance

Two error models, both computed (Monte Carlo, 200k trials, course from two position fixes):

| Walk | Course sd at 5 m horizontal accuracy (sigma 3.5 m/axis) | At 2 m accuracy | At 10 m (urban canyon) |
| --- | --- | --- | --- |
| 10 m | 34.2 deg | 17.1 deg | 75.2 deg |
| 20 m | 14.7 deg | 8.2 deg | 49.9 deg |
| 50 m | 5.7 deg | 3.2 deg | 17.1 deg |
| 100 m | 2.8 deg | 1.6 deg | 8.2 deg |

The two-fix model is pessimistic for a real chipset: modern GNSS derives velocity from Doppler shift, which
is substantially cleaner than differencing two position fixes (Li et al. 2022, "Accuracy Evaluation of
Multi-GNSS Doppler Velocity Estimation Using Smartphones", `https://d-nb.info/1256353183/34`, found via
tinyfish; iMAR's engineering note makes the same point, that Doppler velocity and course-over-ground are
distinct quantities with distinct accuracies, `https://www.imar-navigation.de/downloads/Decision_assistant-Dateien/Decision_assistant.pdf`).
But since `expo-location` exposes no velocity-accuracy field and the app cannot reach the raw Doppler fix,
the usable figure is the position-difference model, and it says: **"walk ten steps and we will tell you
which way you are facing" is not viable.** Ten steps is 7 to 8 m: 40 to 70 degrees of course sd at typical
accuracy. The interaction only works from 50 to 100 m of deliberate straight-line walking (3 to 6 deg),
outdoors, with the phone held steady, and it still needs the user to then turn in place, which reintroduces
the body-transfer term. It also cannot run indoors, where the whole problem lives.

One further structural problem: the course is the direction of TRAVEL, not the direction the phone points.
The user must hold the phone flat and pointing along their walk, and any off-axis carry angle becomes a
constant error. This is the same class of problem as session 40's axis-correction hunt, with no geometry
constant to fix it.

**Verdict: not viable as the primary or even the secondary. A possible calibration helper at 100 m, if a
future design ever needs one.**

---

## 7. What shipping apps do

Found via tinyfish search and the App Store pages (fetched). Two shipping apps with a sun-based qibla
feature were identified:

| App | Feature | Interaction | Evidence |
| --- | --- | --- | --- |
| **Adhan Status** (Antik Bilişim, iOS, free + IAP) | **"Qibla Hour" / "Qibla Time"**: "see when the sun aligns with the Qibla direction for your selected location" on the compass screen | The app names the hour; the user faces the sun at that time. The release notes also say "The compass now uses the gyroscope and turns much more smoothly" and show a "glass dial with a Kaaba badge" | App Store page `https://apps.apple.com/id/app/adhan-status/id6503454523`, What's New text (fetched via tinyfish) |
| **Barakah: Prayer Times & Qibla** (Hazem Abdeltawab, iOS, free) | Qibla by the sun's shadow: release notes "Find Qibla using the sun's shadow, no compass sensor required" | Shadow-based; the store text does not describe the interaction in detail | App Store page `https://apps.apple.com/ru/app/barakah-prayer-times-qibla/id6782983180` (fetched via tinyfish) |
| **onlineqiblafinder.com** (web, not an app) | "Solar Qibla Time" with both "Solar Alignment (Face the Sun)" and "Antipodal Alignment (Shadow Points to Qibla)" modes, plus a rasd al-qibla explainer | Enter city or GPS; the calculator names the minute and the mode | `https://onlineqiblafinder.com/guides/how-to-find-qibla-using-sun-and-shadow/` (fetched via tinyfish). Its fiqh-history section (Ibn Abidin, al-Nawawi "Fiqh al-Zilal", al-Hattab) is UNVERIFIED: I could not trace those citations to primary texts |
| **Muslim Pro, Athan Pro, mainstream compass apps** | No sun-based method found in any store listing | Standard compass dials | Store pages via tinyfish search; Muslim Pro's own article on qibla history mentions sun-tracking as a historical method ("This isn't entirely accurate as the...", `https://www.muslimpro.com/how-the-qibla-direction-was-determined-in-624-ce-and-now/`) but the app ships a compass |

User sentiment on qibla apps generally (the brief asks what users say): the Reddit thread "How to know if a
qibla app is safe or accurate" (r/MuslimLounge) recommends the sun-over-Kaaba moment as the way to VERIFY an
app's compass ("When the sun is directly over the Ka'bah, the shadow of straight objects standing upright
will show you the qiblah. can be used to verify the..."), which is users independently discovering that the
sun is the audit standard. The Quora thread "the qiblah keep changing on all the apps I have tried" and the
Ask Nanima Facebook group post "Please advise of a compass/qibla app that actually works... Have found most" (the quoted user's own words, kept verbatim)
to be inaccurate" are the complaint pattern: apps disagree with each other and with the mosque, and users
have no way to tell which one is right. That is the trust gap the owner already identified, and the sun is
the only reference that resolves it without trusting anyone's sensor.

No app I found ships formulation C (the continuous "N degrees from the sun" reading). Adhan Status's Qibla
Hour is formulation A/B with the availability holes this report measures (London: 64 consecutive days with
no event). **The continuous offset appears to be an unclaimed design, or at least not visible in any store
listing; R4's competitive teardown is the cross-check.**

---

## 8. Verdict

Ranked on the four axes:

### (a) Accuracy

1. **Sun offset (C), computed: 0.006 to 0.009 deg.** Two independent cross-validations, both in this repo.
2. Shadow method end to end: ~2.2 deg, dominated by gnomon verticality.
3. Sun method end to end: ~2 deg, dominated by the user's aim.
4. Map alignment: 6.2 deg RSS (estimated terms).
5. Fused compass outdoors: 9.7 deg measured.
6. Fused compass indoors: 30 deg measured. This is the number that killed the row's premise.
7. `expo-location` heading: 71.1 deg measured.
8. GPS course at 10 m: useless; at 100 m: 2.8 deg but only outdoors and only after a long deliberate walk.

### (b) How much the user has to do

1. Compass: nothing (but untrustworthy indoors).
2. Map: study the street, transfer to the body.
3. **Sun offset: face the sun, turn N degrees.** Two steps, no line to read, no street to recognise.
4. Qibla Hour: wait for the named minute, then face the sun. Cheapest of all WHEN it exists, which is not
   always (section 3.3).
5. Shadow: find a plumb object and a level floor and the exact minute.
6. GPS walk: 50 to 100 m of deliberate straight-line walking, twice (there and back), outdoors.

### (c) Works indoors

1. Map: yes (this is its one decisive advantage).
2. Fused compass: physically yes, trustworthily no near steel.
3. Gyro-hold: yes, for minutes, after an outdoor calibration.
4. Sun anything: only with a sunlit window, which most British prayer rooms lack in winter.
5. GPS walk: no.

### (d) Implementation cost

1. **Sun offset: zero new dependencies, zero megabytes, ~30 lines in `shared/` plus UI.** The solar
   machinery is already installed; P1 proves the same arithmetic independently; the fallback if Metro
   blocks the deep import is itself already proven.
2. Qibla Hour: the same 30 lines plus a crossing solver (a bisection over the same azimuth function).
3. GPS course: `expo-location` already exposes `heading`; a few dozen lines. Cheap, but not worth the
   interaction.
4. Gyro-hold: sensor plumbing, bias estimation, calibration UX. Expensive for a minutes-long bridge.
5. Map: the entire subject of R1 and R2: tens of MB or a one-time download, a renderer on RN 0.88-rc with
   Fabric, an owner decision on the offline rule's edge (ASSUMPTIONS B3).

### What I would build

**Build the sun as the primary sensor-free method, in this order:**

1. **Formulation C first**: "The qibla is N degrees left/right of the sun, right now", computed once per
   second from `adhan`'s solar coordinates, gated to 5 to 65 degrees of sun altitude (P1's measured band).
   Available every day the sun is visible, everywhere outside the polar night, at 0.009 degrees of computed
   error. This is the feature the other apps do not have.
2. **The Qibla Hour as the special case**: when the offset crosses 0 or 180, announce it ("face the sun at
   10:26"). This is the traditional `rashd al-qiblah` in its modern form, it needs no angle judgement at
   all, and Adhan Status proves the appetite for it. Gate it on availability and say plainly when it does
   not exist (London: 14 Nov to 28 Jan).
3. **The shadow wording as the zero-phone fallback**: the same instant the Qibla Hour names, expressed as
   "a pen's shadow will lie along the qibla at 10:26", for users who want the physical line on their own
   floor. The error budget (section 2.2) is honest about the gnomon term.
4. **Keep the compass** with session 40's `isFieldTrustworthy` warning, as the instant answer when the
   field is clean and the sun is not available.
5. **Keep the map as the indoor complement**, sized by R1/R2's findings, presented as the thing you open
   when the sun is down and the field is dirty. The map is worth building; it is not worth building FIRST.

**And be willing to say the map is the wrong primary answer, which the evidence does say.** The brief's own
framing is "is one of them the real answer rather than the map" (question 4). The sun is that answer for
every condition except indoors-and-overcast, and no method solves indoors-and-overcast except the map. The
row's map work is not wasted; it is the second half of the pair, and the sun is the first half that costs
nothing.

---

## Assumptions I recorded rather than asked

1. **London coordinates 51.5074, -0.1278 and BST = UTC+1** throughout the worked examples; the app is
   London-only per the North Star, so London is the design case.
2. **The 5-degree sun-altitude gate** follows P1's sweep for comparability; my 42-day London shadow-event
   count uses it. A zero gate (sun's upper limb on the horizon) would add a handful of marginal days at
   both ends of the winter gap.
3. **The "user's aim" term (~2 deg) in the end-to-end sun figures is an engineering estimate**, same class
   as P0's human-error terms; no published figure for "turn N degrees from the sun and stop" was found.
   R4 is tasked with replacing these.
4. **Gyro drift in practice is bounded by the OS fusion's behaviour, not the raw chip spec.** I used 50
   deg/hr (the consumer bias-instability band) as the honest figure for a gyro-only yaw hold, and the raw
   chip numbers only to show why uncalibrated integration is hopeless.
5. **The two-fix GPS model is pessimistic but is what the app can compute in practice**, since `expo-location`
   drops `bearingAccuracy` on both platforms.
6. **The Islamiyyat 2025 study's per-app figures are UNVERIFIED** (ResearchGate bot-blocked); only its
   abstract-level finding (istiwa' adzam consistent, apps inconsistent) is relied on, and the Bangka
   Belitung study's full text carries the load for measured app/mosque error.

## What I attacked in my own conclusion

- **A verification pass attacked this report's own open caveat on 2026-09-30.** The exports-map question
  (below, first bullet) was the plan's first verification step; this pass ran the specifier through the
  real Metro, Jest and tsc resolvers and settled it: Metro resolves with a warning, Jest and tsc reject,
  and three working integrations are now documented in section 1.1.1 with the public-API fallback measured
  in 1.1.2. Nothing in the verdict changed; the risk shrank from "unknown" to "one jest config line".
- **I attacked the headline finding by trying to break the cross-validation.** The first comparison run
  showed a 3.9-degree disagreement at Makkah and I initially read it as an implementation error; isolating
  it showed azimuth near zenith is ill-conditioned by `1/cos(zenith)` and both implementations were right.
  That case is now documented as the reason for the altitude ceiling rather than buried.
- **I attacked the transit method with the cities that break it, not the ones that flatter it.** My first
  London-only sweep found 282 event days and looked like a year-round feature; adding New York (0 face-sun
  days), Sydney (170-day gap) and Reykjavik (94-day gap) killed that reading. Formulation C survives
  specifically because A and B fail on different continents, and P1's independent sweep reached the same
  verdict from different fixtures.
- **I attacked the adhan finding with the exports-map caveat, and the verification pass closed it.** The
  deep require works in node and may not under Metro; the report stated it as the plan's first
  verification step rather than claiming the feature is free. The 2026-09-30 pass (section 1.1.1)
  resolved it empirically: Metro warns and falls back to file-based resolution, so the specifier bundles;
  Jest and tsc need the one-line mapping or a relative path. The 30-line fallback remains proven, so the
  caveat delays nothing.
- **I attacked the fiqh section's circularity risk.** The 45-degree figure circulates on forums; I traced
  it to Shurunbulali's face-surface criterion and al-Tahtawi's gloss via islamanswers' Arabic quotations,
  and to a second independent fatwa (islamqa 101449, citing al-Dardeer). The two agree on 45 degrees from
  different texts, which is the minimum bar for citing it. The Shafi'i stricter position is recorded too,
  because a user following it changes what "good enough" means.
- **I attacked the GPS-walk idea with its own best case.** At 100 m in good conditions it reaches 2.8 deg,
  which is competitive; the kill is the interaction (outdoors, 100 m, twice) and the travel-vs-pointing
  ambiguity, not the accuracy. Recorded so a future session does not re-litigate it from the accuracy side.
- **I attacked the verdict itself.** The map's indoor advantage is real and the sun cannot replace it; a
 hostile reviewer would say "the sun fails indoors, which is your own opening premise". The answer is that
 the sun and the map fail in exactly complementary conditions, and the row's question 4 asked which one is
 the real answer: the sun is the primary because it is free, precise, traditional and sensor-free, and the
 map is the complement, not the replacement. If the owner's ruling (ASSUMPTIONS A4) is map-first regardless,
 this report's ranking is the dissenting evidence.
