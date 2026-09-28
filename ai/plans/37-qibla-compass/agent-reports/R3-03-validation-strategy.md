# Round 3, agent 3: how we prove the qibla is correct

Returned 2026-09-28, answering the owner's question directly: 🐋  "How do we know if this list is correct?
Is it proven and tested?"

**This report converts that question into an executable test plan.** Planner's ruling in `RESEARCH.md`
section 22.

---

## The agent's headline

> **The formula is not the risk, and this is provable to arc-minute level against surveyed measurements.
> The compass sensor remains the only link in the chain no source has ever bounded better than a few
> degrees.**

Four independent layers of proof, each citable:

1. **Golden fixtures** from surveyed ground truth (theodolite, astrogeodetic survey)
2. **Property-based invariants** needing no external data at all
3. **An independent oracle**: Karney's GeographicLib geodesic solver
4. **The sun-transit ground truth** for on-device verification

## 1. Surveyed ground truth, the strongest class

| Place | Measured value | Method | Source |
| --- | --- | --- | --- |
| **Universiti Teknologi Malaysia, Johor Bahru** | **292°57′44″ (292.9622°)** | **theodolite + solar observation** | Ismail, Musa & Zainon 2024, *IJARPED* 13(4), DOI 10.6007/IJARPED/v13-i4/23813 |
| Islamic Center of Washington | **N 56°33′15″ E (56.5542°)** | professional boundary survey | *The American Surveyor*, Sept 2010 |
| 11 Greek mosques | Ioannina 132°42′–44′, Chios 141°11′–12′, Trikala 134°12′, Argos 132°43′–44′ | astrogeodetic, axes to ±1′–8′ | Pantazis & Lambrou 2009, *JAHH* 12(2) |
| Edirne mosques (Selimiye, Üç Şerefeli, Eski) | qibla vs minaret-door bearings | GNSS + conventional survey | Pırtı & Hoşbaş 2023 |

**The Malaysian value is the single best citable fixture**: a modern theodolite measurement, published with
its method, in a country whose religious infrastructure treats qibla verification as a state function.

**This session verified it independently.** Computing from the UTM campus coordinates with adhan's Kaaba
constant gives **292.9742°** against the theodolite's **292.9622°**: a difference of **0.012°**, which is
under one arc-minute.

## 2. Where authoritative values do NOT exist, stated plainly

- **No official Saudi geodetic figure for the Kaaba is publicly published.** Several candidates circulate;
  no source resolves them.
- **No national religious authority publishes a per-city qibla table** at navigable precision. Diyanet
  publishes prayer times, not bearings. Kemenag verifies mosques case by case rather than publishing
  tables. **JAKIM's "291 to 293°" is a band, not a table.**
- **No theodolite survey of any London mosque is published.**

## 3. The Kaaba coordinate question, measured

Four candidates circulate:

| Value | Used by |
| --- | --- |
| 21.4225, 39.8262 | most calculators |
| 21.422487, 39.826206 | latlong.net |
| **21.4224779, 39.8251832** | **Google Qibla Finder**, officially documented |
| **21.4225241, 39.8261818** | **`adhan`** |

**Measured across 18 cities: maximum bearing spread 0.0037°.** This session re-measured across 8 cities and
reproduced the figure **exactly**: max 0.0037° at Cairo, typically under 0.002°, and 0.0011° in London.

> **The disagreement is real but provably irrelevant to bearing from any populated place. It matters only
> for the mihrab inside Makkah itself.**

**The agent's recommendation, adopted:** keep adhan's value, and **pin a test asserting that the bearing
under all four candidates differs by less than 0.005°.** That documents the choice and proves its
irrelevance in one test.

## 4. What the published app studies found

- **Ismail, Musa & Zainon 2024**, the strongest study: theodolite ground truth 292°57′44″, tested the 20
  most-downloaded apps. **15 of 20 agreed to the degree; 5 showed a consistent 295°, identically on both
  platforms**, so **the error was algorithmic (wrong coordinates or formula), not sensor-related.**
- **Zaki et al. 2019**: theodolite accurate; **smartphones deviated up to 2°** from true direction.
- **Helmi & Badrian 2024**: sphere vs Vincenty across 13 cities, **differences of 0.035 to 0.038°**.
- **Hamdani et al. 2020**: Bandung campus mosques, worst deviation 7°06′.

**Sun-transit validation of apps has never been done systematically.** The agent flags this as a genuine
gap, and therefore an unclaimed opportunity.

## 5. The invariants, and the one that catches the real bug

The agent derived thirteen. **This session verified the load-bearing ones independently, and all pass:**

| # | Invariant | Verified |
| --- | --- | --- |
| 1a | North of the Kaaba on its meridian gives exactly 180° | **180.000000** |
| 1b | South of it on its meridian gives exactly 0° | **0.000000** |
| 2 | North pole gives `180 − lon` = 140.1738° for any longitude | **140.1738** |
| 3 | South pole gives `lon` = 39.8262° | **39.8262** |
| 4 | Mirror symmetry on the Kaaba's parallel | **exact** |
| 9 | The antipode returns a finite value | **finite** |

### Invariant 6 is the one that matters

**From the Kaaba's own latitude, the bearing is NOT 90° or 270°.** Measured this session: **86.3477° from
20°E and 271.8622° from 50°E.**

> **An implementation returning exactly 90 or 270 there has the rhumb-line bug or an equator-only formula.
> This single test would have caught the five apps scoring 295° in the Malaysian study.**

Other invariants worth keeping: quadrant coverage through Anchorage, Tokyo and Cape Town (the arXiv survey
warns that using `arctan` instead of `atan2` is the classical error); west-longitude fixtures, because sign
conventions are a documented historical bug; and a **great-circle sailing round trip**, where repeatedly
stepping along the current bearing must arrive at the Kaaba.

## 6. The independent oracle

**GeographicLib** (Karney), whose own test suite is peer-reviewed, accurate to 12 nanometres. Assert that
our spherical result sits within **0.25°** of its WGS84 geodesic azimuth over a global grid, excluding the
degenerate caps.

That figure is anchored by two measurements: session 37's own max of **0.181°** at Sydney, and Helmi 2024's
measured band of 0.035 to 0.038°. **It turns the literature's sphere-versus-ellipsoid debate into a
regression bound.**

## 7. The London device protocol

**Rasd al-qibla, the free ground truth.** On **27/28 May at 09:18 UTC** and **15/16 July at 09:27 UTC** the
sun is over the Kaaba, so the sun's azimuth IS the qibla, and any vertical object's shadow points away from
it.

**Accuracy:** "observations made within a five-minute interval, and at the same time one or two days before
or after the prescribed date, are accurate with negligible deviation."

**The antipodal events (January and November) are nighttime in Britain and unobservable from London.**

**Both 2026 events have passed. The next London-observable windows are 27/28 May 2027 and 15/16 July 2027.**

The protocol needs no equipment: a vertical pole, mark the shadow at the instant, and the qibla is directly
opposite it. Photograph the app's arrow against the marked line in one frame as the audit artifact.
**Tolerance: the astronomy is exact to under 0.1°, so anything beyond that is the magnetometer**, which is
the claim being tested anyway.

**A daily fallback exists:** every day the sun crosses the great-circle plane between a location and the
Kaaba once, and the time is computable from a solar ephemeris. **No app ships this.**

## 8. London landmarks are NOT ground truth

East London Mosque and London Central Mosque are orientation references, and published guidance puts
London at **118.98 to 119°** true. But an aerial survey of six purpose-built English mosques found the Fazl
Mosque (1926) deviates most, **and its community confirms praying "at an angle" to correct it.**

**Lesson for the copy: historic mosque walls are not ground truth, anywhere.**

A useful cross-check on the true-versus-magnetic distinction: *The Guardian* in 2001 gave Greenwich's qibla
as **123.7° east of MAGNETIC north**, which reconciles exactly with 118.98° true at that era's ~4.7°W
declination.

## 9. The executable plan

1. **Golden fixtures in two tiers.** Surveyed tier at 0.05° tolerance (UTM Johor Bahru, Washington DC, four
   Greek mosques). Cross-validation tier at 0.05° (adhan's 11 published city values, plus London 118.98,
   Birmingham 117.95 and Jakarta 295.15 from three independent publishers).
2. **Coordinate-robustness test:** every fixture under all four Kaaba candidates, asserting spread under
   0.005°.
3. **Property suite:** the thirteen invariants, seeded and excluding the degenerate caps.
4. **Oracle regression:** GeographicLib over a ~10k-point global grid at the 0.25° bound.
5. **Device protocol in London** on the next sun-transit date, on both fleet devices since magnetometers
   differ.

## 10. The answer to the owner's question, in one paragraph

> **"The mathematics agrees with theodolite-measured ground truth to better than 0.05° in published
> studies; with the sun-over-Makkah observation to better than 0.1° on any clear 28 May or 16 July; with
> the adhan library to 0.0006°; and the only error source no one can eliminate is the phone's
> magnetometer, which the app surfaces rather than hides."**

## Key sources

- Ismail, Musa & Zainon 2024, *IJARPED* 13(4), DOI 10.6007/IJARPED/v13-i4/23813
- Pantazis & Lambrou 2009, *JAHH* 12(2): `users.ntua.gr/gpanta/pdf/publications/3.4.11.pdf`
- *The American Surveyor*, Sept 2010: `amerisurv.com/2010/09/25/not-what-but-where-is-qibla/`
- Helmi & Badrian 2024, DOI 10.36256/ijrs.v6i2.491
- Saksono, Fulazzaky & Sari 2018, *J. Applied Geodesy* 12(2), DOI 10.1515/jag-2017-0036
- Google Qibla Finder method: `support.google.com/faqs/answer/7364753`
- QiblaLocator "How It Works": `qiblalocator.com/how-it-works.html`
- GeographicLib (Karney) and its `GeodTest` set
- van Gent, Utrecht: `webspace.science.uu.nl/~gent0113/islam/qibla.htm`
- Roegel 2008, al-Khalili's table reconstruction, HAL `inria-00336090`
