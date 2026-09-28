# Round 3, agent 4: the npm ecosystem audit

Returned 2026-09-28, answering the owner's question: 🐋  "Are there any packages already built for this
qibla finders? Go out there and do research on what is already out there that we could use. We don't have
to build it from scratch. What is proven and tested?"

**Method:** the agent swept ~45 keyword families (qibla, qiblah, qibleh, kaaba, kiblat, kible, mecca,
makkah, salat, salah, namaz, athan, adhan, compass, magnetometer, hijri, umalqura) across **567 unique
package names**, filtered to ~30 genuinely relevant, and **read the published tarballs** of the serious
candidates via unpkg and jsdelivr. Numeric verdicts were computed, not quoted.

Planner's ruling in `RESEARCH.md` section 23.

---

## 1. TWO PUBLISHED PACKAGES RETURN WRONG ANSWERS

**Both reproduced independently by this session.**

### `qibla@1.1.0` (56 downloads/week, MIT, last published 2025-02)

Computes `deltaL = longitude − kaabaLongitude`, **the sign flipped**, which negates the `atan2` numerator
and mirrors every bearing about the north-south axis.

| City | Correct | `qibla` returns | Error |
| --- | --- | --- | --- |
| London | 118.99 | **241.01** | 122.03 |
| New York | 58.48 | **301.52** | 116.96 |
| Jakarta | 295.15 | **64.85** | 129.70 |
| Tokyo | 293.00 | **67.00** | 134.00 |

### `qibla-direction@1.0.0` (2 downloads/week, last published 2023-12)

Normalises with `if (C < 0) C *= 360` where `C += 360` was meant.

**Jakarta returns −23,345°. Tokyo returns −24,120°.**

> **Both are installable from npm today.** The failure mode in this ecosystem is not drift; it is a wrong
> formula shipped with confidence.

## 2. The math-only libraries

| Package | Weekly | Formula | Correct? | Note |
| --- | --- | --- | --- | --- |
| **adhan** | **48,154** | spherical | ✅ | the incumbent; test vectors at 0.001° |
| @acamarata/qibla | 16 | spherical + haversine | ✅ | **bundles opt-in telemetry** to the author's domain |
| @masaajid/qibla | 6 | spherical | ✅ | 2 stars, one release ever |
| @misque/qibla | 5 | spherical + declination option | ✅ | web `DeviceOrientation` only, no RN path |
| qibla-compass (alkarartech) | 25 | **Vincenty WGS84** + spherical fallback | ✅ | the only lib with real declination support (NOAA WMM fetch + cache) |
| qibla-calc | 2 | spherical | ✅ | bundles an ~85-city list of unverified provenance |
| @islam-kit/qibla | 7 | spherical | ✅ | ugly `atan2(x,y)` naming, numerically right |
| @jauza/core | 170 | pluggable, default spherical | ⚠️ unverified | 1.6 MB, minified, no repo link |
| tauqeet-js | 32 | **Vincenty + spherical + rhumb** | ✅ structure | most complete math; 0 stars, 4 months old |
| islamic-utils | 4 | spherical | ✅ | part of a prayer/hijri toolkit |
| **qibla** | 56 | spherical, **sign-flipped** | ❌ **WRONG** | see section 1 |
| **qibla-direction** | 2 | spherical variant | ❌ **WRONG** | see section 1 |
| asturlab | 2 | great-circle + rhumb | ⚠️ half-broken | returns unnormalised negatives; abandoned 2019 |

**Every correct implementation agrees within 0.01°**, because they are all the same formula.

## 3. The sensor libraries

| Package | Weekly | New Arch | Heading source | Verdict |
| --- | --- | --- | --- | --- |
| **react-native-nitro-compass** | 35 | ✓ Nitro | Android: accel+mag → `getRotationMatrix` + adaptive low-pass + **gyro fusion via `TYPE_GAME_ROTATION_VECTOR`** + **EMA on (sin, cos) so it is wrap-safe**; iOS: `CLHeading` | **the only correct sensor architecture on npm**, but 3 stars, 1 author, 10 open issues, released 2026-05 |
| react-native-attitude | 432 | ✓ Turbo | rotation vector + `remapCoordinateSystem` | already audited in R2 |
| react-native-compass-heading | **4,386** | ✗ old arch | weak `atan2` | **the highest downloads belong to the worst algorithm** |
| expo-sensors Magnetometer | huge | ✓ | raw magnetometer | the DIY path everyone uses, and the weak one |
| ahrs | 1,016 | n/a | **pure-JS Madgwick/Mahony** | a building block; no RN bindings |
| react-native-adhan | 74 | ✓ Turbo | n/a, math only | native port of maths we already have in JS; pointless here |

**`react-native-nitro-compass` is the notable find.** It surfaces interference detection (field-magnitude
band plus hard-iron bias jumps), calibration quality, `setDeclination()`, `setLocation()` with WMM2025, and
a Reanimated-friendly direct listener. **Its risk is organisational, not technical.**

## 4. The UI components, read at source level

**`react-native-qibla-compass@1.4.0`** (20 stars, the "maintained" one):

- **Heading is raw `atan2(y, x)` of the magnetometer**, plus a `+90` fudge written as
  `degree = m - 90 >= 0 ? m - 90 : m + 271` — **asymmetric by one degree; it should be 270.**
- **No tilt compensation.** "Tilt it 30° and the heading is wrong by 15 to 30°."
- **No declination**, so a magnetic heading is compared against a true bearing.
- **No accuracy or calibration surface.**
- **No shortest-path interpolation**, so the dial **spins the long way round** crossing north.
- 10 React state updates per second.
- **Its maths is correct**, matching adhan. That is the one thing it gets right.

**`react-native-qibla-finder@1.1.2`** and its near-identical fork:

- Same fatal sensor path, at 50 state updates per second.
- **`isAligned` is a raw subtraction, so it is broken across the 0/360 boundary**: heading 359 against
  qibla 1 reports 358° off when it is 2° off, **so the vibration never fires for users whose qibla is near
  north.**

> **The agent's verdict: "Adopting one means inheriting precisely the parts we'd have to rewrite, while the
> parts worth keeping are ~30 lines each."**

**And the shape of the whole ecosystem, in one line:**

> **"No package on npm combines correct math + a proper sensor path + a compass UI. The ecosystem is:
> correct math libs with no UI, and UI libs with broken physics."**

## 5. Accuracy: what the evidence actually is

- **adhan is the only package whose correctness evidence is a committed test suite** asserting hard-coded
  bearings at 0.001°, cross-asserted in JS, Kotlin and Swift. **But the repo cites no ground-truth source
  for those values**, so they prove implementation consistency and cross-port corroboration, not external
  truth.
- **Nobody on npm has a test suite validated against surveyed ground truth.**
- The Vincenty libraries ship **no test files at all** in their tarballs.

### Sphere vs ellipsoid, measured on a 16,200-point grid

| Band | Mean | Max |
| --- | --- | --- |
| Populated (abs lat <= 60, within 150° of Mecca) | 0.11° | **0.39°** |
| Within 170° of Mecca | — | 1.3° |
| The South Pacific antipodal zone | — | **up to 20°** |

**This session re-measured and confirmed it**, which corrected section 1.4's own twelve-city figure of
0.181°. The antipodal zone affects roughly 300,000 people.

### The Kaaba coordinate is numerically irrelevant

The agent varied the Kaaba position across **all six values used in the wild**, a ~150 m spread, and the
London, Jakarta and New York bearings **moved by less than 0.001°**.

## 6. An independent government cross-check

**Turkey's Diyanet publishes an official city qibla table** (Türkiye Takvimi, "İstikbâl-i Kıble", PDFs in
nine languages). Istanbul, converted from their from-south convention, is **152° from north against our
computed 151.62°**.

**A state religious authority publishing numbers our formula reproduces is a stronger fixture than
agreement with another JavaScript library.**

**A second live oracle:** `api.aladhan.com/v1/qibla/{lat}/{lng}`, verified as pure spherical and matching
to 4 decimal places at five coordinates. Usable in CI, though it is a network dependency.

## 7. The dataset question

Audited before the owner's ruling cancelled it. Recorded for a future session.

| Source | Rows | Size | Licence | Note |
| --- | --- | --- | --- | --- |
| cities.json | ~130,000 | 19.1 MB | **CC-BY-4.0** | fresh, but attribution required and huge |
| all-the-cities | 138,398 | 6.3 MB | MIT | frozen since 2020 |
| **Natural Earth 50m** | **1,249** | **~1.1 MB raw** | **CC0, no attribution** | curated cartographic standard; filterable to a top-500 at 150 to 300 KB |

**GeoNames is a crowd-edited gazetteer, not a surveyed authority**: city-centre precision is 1 to 5 km and
coordinates "wander between releases". **Natural Earth's 50m set would have beaten every npm option on
licence, size and curation.**

The agent also ranked three approaches above any dataset: **timezone to coarse centroid** (no permission at
all), **the coarse-location permission tier** as a softer ask, and **graceful degradation**. All three are
moot under the owner's gating ruling.

## 8. The agent's recommendations

**Adopt:**
- **`adhan` for the maths.** "Nothing in this audit displaces it; every alternative either matches it to
  0.01° or is broken."
- **`react-native-nitro-compass` as the heading source, after a spike**, with `react-native-attitude` as
  the fallback. (**This session did NOT adopt this**: see `RESEARCH.md` section 23.5. It becomes fallback
  number one behind `expo-location`.)
- Natural Earth 50m if a dataset is ever needed.

**Write ourselves, because no package covers it:** declination handling, shortest-path angle difference,
the Reanimated dial, and the accuracy and calibration UI.

**Do not touch:** `qibla` (mirrored), `qibla-direction` (normalisation garbage),
`react-native-qibla-compass` and `-finder` (broken physics), `react-native-adhan` (a native port of maths
we already have), `qibla-camera-finder` (which returns an `<iframe>` string pointing at the author's
website).

## 9. The agent's own verified-vs-inferred split

**Verified by computation or source reading:** every correctness verdict; the formula transcriptions;
adhan and AlAdhan agreement; the sphere-vs-ellipsoid grid statistics; Kaaba-coordinate insensitivity; the
Diyanet values; dataset row counts, licences and sizes; nitro-compass's architecture.

**Inferred, not proven:** tauqeet-js's and @jauza/core's numeric output (structure read, not executed);
nitro-compass's on-device behaviour and the severity of its 10 open issues; Batoul Apps' production use;
and that adhan's test vectors are original, since no external citation was found in-repo, **which is
precisely why section 22's multi-oracle strategy exists.**

## Key sources

- npm registry search API; package tarballs via unpkg and jsdelivr
- `batoulapps/adhan-js` `test/qibla.test.ts`; `adhan-kotlin` `QiblaTest.kt`
- `api.aladhan.com/v1/qibla/{lat}/{lng}` (live checks)
- Türkiye Takvimi "İstikbâl-i Kıble": `turktakvim.com/pdf/en.2.pdf`
- NOAA geomag-web: `ngdc.noaa.gov/geomag-web/calculators/calculateDeclination`
- Natural Earth populated places (110m, 50m, 10m), live row counts
- arXiv:2512.03271, "Determining the Qibla Direction by Astronomical and Geometrical Methods"
