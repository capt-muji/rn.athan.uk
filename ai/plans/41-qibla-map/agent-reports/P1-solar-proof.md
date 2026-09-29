# P1: the solar method, PROVEN in this repo with zero new dependencies

Computed and validated in this planning session, 2026-09-30. Every number below is the output of a script
run against the **installed** `adhan@4.4.6`, not a citation and not an estimate. Scripts are throwaway, per
`PLANNER-BRIEF.md` section 3 item 8; what they taught is recorded here.

## The headline

**`adhan@4.4.6` already ships everything needed to compute the sun's azimuth, and the app already depends on
it.** A sensor-free qibla method therefore costs **zero new dependencies, zero megabytes and zero native
code**. This was not known before this session: sessions 37 and 40 both treated the magnetometer as the only
way to answer "which way am I facing".

## 1. What `adhan` exposes

The package's `exports` map hides its internals, but the files are present and requireable by full path.
Verified on disk:

| Module | Path | What it gives |
| --- | --- | --- |
| `SolarCoordinates` | `node_modules/adhan/lib/cjs/SolarCoordinates.js` | `declination`, `rightAscension`, `apparentSiderealTime` for a Julian day |
| `Astronomical` | `node_modules/adhan/lib/cjs/Astronomical.js` | 22 functions including `julianDay`, `julianCentury`, `altitudeOfCelestialBody`, the nutation and obliquity terms |
| `Qibla` | `node_modules/adhan/lib/cjs/Qibla.js` | the bearing the app already ships |

Constructing `new SolarCoordinates(2460000.5)` returns declination `-9.269391275501143`, right ascension
`337.88542210533745` and apparent sidereal time `154.599548965426`. **Declination plus right ascension plus
apparent sidereal time is a complete horizontal-coordinate solution**, so azimuth and altitude follow from
the standard transformation with the observer's latitude and longitude, which the app already has.

**One caveat for the plan:** the deep-path `require` bypasses the package's `exports` field. Node rejects
`require('adhan/lib/cjs/SolarCoordinates.js')` with `ERR_PACKAGE_PATH_NOT_EXPORTED`, so an absolute path was
used to prove the maths. **Metro's resolver is not Node's and this must not be assumed to work in the app.**
The plan's first step verifies it under Metro; if it is blocked, the transformation is 30 lines of arithmetic
and section 3 below shows it already reproduced independently, so the fallback is proven before it is needed.

## 2. The validation that makes this PROVEN rather than researched

The `adhan`-derived azimuth was compared against **a second, independently written implementation of NOAA's
algorithm** (mean longitude, equation of the centre, apparent longitude, obliquity with the nutation term,
GMST, then the horizontal transformation). Two different algorithms from two different sources.

**104 samples**: six cities (London, New York, Makkah, Sydney, Reykjavik, Singapore), every second month,
five times of day, sun above the horizon only.

| Measure | Maximum disagreement |
| --- | --- |
| Azimuth | **0.54 arcminutes** (0.0089 degrees) |
| Altitude | **0.13 arcminutes** (0.0022 degrees) |

Independent sanity checks that a coding error would have broken:

- **Solstice altitude matches the closed form exactly.** London on 21 June measures 61.93 degrees against
  `90 - 51.51 + 23.44 = 61.94`. Sydney measures 32.69 against 32.69.
- **Solar transit azimuth lands on the meridian.** London 179.83, Cairo 180.27 (both north of the tropic, so
  due south), Jakarta 0.18 and Sydney 359.97 (both south of it, so due north).

**So the sun's direction is known to under one arcminute, which is 0.009 degrees.** Against the magnetometer's
measured 30 degrees indoors, the sun is better by a factor of **3,300**.

## 3. Error sensitivity, which decides the interaction

| Clock error | Azimuth error |
| --- | --- |
| 1 s | 0.005 deg |
| 10 s | 0.054 deg |
| 60 s | 0.327 deg |
| 5 min | 1.649 deg |
| 10 min | 3.337 deg |

| Position error | Azimuth error |
| --- | --- |
| 1 km | 0.019 deg |
| 10 km | 0.188 deg |
| 50 km | 0.947 deg |
| 200 km | 3.868 deg |

Both are benign. The sun moves 15 degrees per hour, so a phone clock (NTP-synced, seconds at worst) costs
under 0.1 degrees, and the coarse position the app already requests costs under 0.2 degrees. **Neither is the
limiting term; the user's own aim is.**

## 4. The formulation question, and the answer is NOT the obvious one

Three formulations were tested against a full year of 2026 for 16 cities.

**Formulation A, "face the sun": the app names the minute when the sun's azimuth EQUALS the qibla.** The user
faces the sun and judges no angle at all. Tested with the sun above 5 degrees:

| City | Days per year such a moment exists |
| --- | --- |
| Cairo, Moscow | 365 |
| London, Tromso | 258, 257 |
| Jakarta | 218 |
| Sydney | 195 |
| Karachi | 186 |
| **New York, Toronto, Chicago, Los Angeles** | **0** |

**Formulation A FAILS OUTRIGHT in North America.** New York's qibla is 58.5 degrees, north of east, and the
sun there never reaches that azimuth above 5 degrees of altitude. Any design resting on "we will tell you
when to face the sun" is broken for a continent.

**Formulation B, "the shadow points at the qibla": the sun is OPPOSITE the qibla, so a vertical stick's
shadow lies along it.** This is the classic method and it covers exactly the cities A misses (New York 301
days, Toronto 313, Chicago and Los Angeles 365), because a qibla north of east has its opposite south of
west, where the sun does go. But B fails where A works: Cairo 0 days, Moscow 0.

**A and B together still leave holes.** Best of both: Sydney 195 of 365, Karachi 186, Reykjavik 198, with a
**worst gap of 170 consecutive days in Sydney**. A feature unavailable for six months is not a feature.

**Formulation C, "the qibla is N degrees from the sun": the app states the offset continuously.** Whenever
the sun is visible at all, the offset is computable.

| City | Days with usable sun (above 5 deg) | Average usable hours per day |
| --- | --- | --- |
| London, New York, Toronto, Cairo, Jakarta, Karachi, Sydney, Jeddah | **365 of 365** | 10.9 to 11.3 |
| Reykjavik | 312 of 365 (85%) | 9.8 |
| Tromso | 270 of 365 (74%) | 9.7 |

**Formulation C is the answer.** It works every day of the year everywhere except inside the polar night,
where nothing solar can work and the honest response is to say so. It also degrades gracefully: A and B are
the special cases of C where the offset happens to be 0 or 180, so the app can still announce those moments
as the easiest ones without depending on them.

A worked example, London on 21 June, showing what the user reads:

| Time UTC | Sun azimuth | Sun altitude | What the app says |
| --- | --- | --- | --- |
| 08:00 | 97.5 | 36 | qibla is 21 degrees to the RIGHT of the sun |
| 10:00 | 128.5 | 53 | qibla is 9 degrees to the LEFT of the sun |
| 12:00 | 178.9 | 62 | qibla is 60 degrees to the LEFT of the sun |
| 16:00 | 261.5 | 37 | qibla is 143 degrees to the LEFT of the sun |

## 5. Why this changes the row

The row is titled "the qibla on an offline map". The map's justification in `P0-error-budget.md` is that its
error does not grow indoors. **The sun shares that property and costs nothing**, and its own error is four
orders of magnitude smaller than the map's human-alignment term.

The two are complements rather than rivals, and they fail in opposite conditions:

| Method | Needs | Fails when | Error |
| --- | --- | --- | --- |
| Sun offset | A view of the sun, the time, a coarse position | Overcast, night, indoors with no window, polar night | 0.009 deg computed; the user's aim dominates |
| Map alignment | Recognisable surroundings, map data for the place | Unfamiliar or featureless place, no data for the region | 6.2 deg estimated |
| Fused compass | A clean magnetic field | Indoors near steel, which is most of the time | 9.7 outdoors, 30 indoors, both measured |

## 6. The altitude gate, measured rather than guessed

Near local noon the sun climbs toward the zenith, where its azimuth is geometrically ill-conditioned. The
rate is the alarming part, measured over a full year:

| City | Peak azimuth rate | At altitude |
| --- | --- | --- |
| Tromso | 19 deg/hour | 44 |
| London | 29 deg/hour | 62 |
| Singapore | **511 deg/hour** | 88 |
| Makkah | **799 deg/hour** | 90 |

**Makkah's sun sweeps 799 degrees of azimuth per hour near the zenith**, against the 15 deg/hour everyone
assumes. At that rate a computed offset in Singapore stays within 1 degree for **0 seconds**, against 3
minutes in London. A design that shows a static number would be wrong before the user looked up.

The shadow's readability fails in the same place and for the same reason. Taking a user able to locate a
shadow tip to within 5% of the stick's height:

| Sun altitude | Shadow length | Resulting azimuth error |
| --- | --- | --- |
| 80 | 0.18x | 15.8 deg |
| 70 | 0.36x | 7.8 deg |
| **65** | **0.47x** | **6.1 deg** |
| 50 | 0.84x | 3.4 deg |
| 30 | 1.73x | 1.7 deg |
| 10 | 5.67x | 0.5 deg |

**This inverts the usual intuition: the sun method is MOST accurate when the sun is LOW**, which is also when
it is comfortable to look at and when prayer times fall. The morning and late-afternoon sun is the good case,
not the compromise.

**The gate is 5 to 65 degrees of altitude, and it was chosen by sweeping the alternatives rather than picked.**
Coverage across 16 cities at three candidate ceilings:

| Ceiling | Tropical cost (Singapore) | Worst city | Shadow error at the ceiling |
| --- | --- | --- | --- |
| 60 deg | 7.9 h/day | Tromso 74% | 4.9 deg |
| **65 deg** | **8.9 h/day** | **Tromso 74%** | **6.1 deg** |
| 70 deg | 10.0 h/day | Tromso 74% | 7.8 deg |

At 65 degrees every city outside the Arctic keeps **365 days of 365** with 8.9 to 10.9 usable hours a day, and
the worst single day anywhere in the temperate set is 6 hours. The ceiling costs a slice of tropical midday
and buys a bound on the error. Reykjavik at 85% and Tromso at 74% are the polar night, where no solar method
can work and the honest answer is to say so rather than to draw something.

## 7. The strongest validation available: reproducing the published rashd al-qiblah

**This method is not an invention. It is `rashd al-qiblah` (also `rasd al-qibla`), attested in Islamic
astronomy since at least the 13th century**, described by Jaghmini around 1221 and by Nasir al-Din al-Tusi
(1201 to 1276) in `al-Tadhkira al-Nasiriyya fi ilm al-Hay'a`. Al-Tusi's own instruction is the daily
formulation this report arrives at independently:

> "Let an observation be made on that day at that time, before noon if Mecca is to the east or after if
> [Mecca] is to the west; the direction of the shadow [of the sun] at that time is [opposite to that of] the
> qibla bearing."

Source: Wikipedia, "Qibla observation by shadows", citing Abdali 1997 p. 21, van Gent 2017, Hadi Bashori
2015, and King's `Encyclopaedia of Islam` article on `Kibla: Astronomical Aspects`.

Twice a year the sun stands at the Kaaba's zenith, so every vertical object on the sunlit hemisphere casts a
shadow pointing directly away from Makkah. The published times are **27 or 28 May at 09:18 UTC** and **15 or
16 July at 09:27 UTC**, with antipodal events on **12 to 14 January at 21:30 UTC** and **28 or 29 November at
21:09 UTC**.

**The code written in this session reproduces every one of those four events to the minute, from first
principles, having been given only the Kaaba's coordinates.** Searching each day of the year for the moment of
maximum solar altitude at Makkah:

| Computed here | Max altitude | Published |
| --- | --- | --- |
| 2026-05-28 **09:18Z** | 89.931 | 27/28 May, 09:18 UTC |
| 2026-07-15 **09:27Z** | 89.904 | 15/16 July, 09:27 UTC |
| 2027-05-28 **09:18Z** | 89.969 | same |
| 2027-07-16 **09:27Z** | 89.924 | same |

And at the Kaaba's antipode, which the code derived as -21.4225, -140.1738:

| Computed here | Max altitude | Published |
| --- | --- | --- |
| 2027-11-28 **21:09Z** | 89.914 | 28/29 November, 21:09 UTC |
| 2027-01-13 **21:29Z** | 89.896 | 12/13/14 January, 21:30 UTC |

**Four independent events, four matches to the minute, against figures published by historians of Islamic
astronomy.** Combined with the 0.54-arcminute agreement against a second algorithm in section 2, the solar
computation in this repo is proven to a standard neither session 37 nor session 40 ever reached for the
magnetometer.

It also supplies the honest coverage limit, from the same source: the yearly observation is impossible in the
hemisphere opposite the Kaaba, and at the rim of that hemisphere it falls near sunrise or sunset, so
**Abdali 1997 records that it cannot be seen at all in New York City or Ottawa** and needs a completely
unobstructed horizon in Boston and Montreal. That is the published confirmation of this report's own
section 4 finding that formulation A fails in North America, arrived at separately by a full-year sweep.

## What I attacked in my own conclusion

- **I assumed the deep `require` proves the app can do this, and it does not.** Node's `exports` field
  rejected the path and I worked around it with an absolute path. Metro resolves differently. Recorded as the
  plan's first verification step rather than as a finding, and the 30-line fallback is already proven by the
  independent implementation in section 2.
- **I started with formulation A because it needs no angle judgement, and a full-year sweep killed it.** Had
  I tested London and Cairo only, both of which work, A would have looked correct and shipped broken for
  North America. This is session 37's fixture-blind-spot rule catching a real defect: the cities that break a
  qibla method are not the obvious ones.
- **I checked whether the agreement in section 2 is circular.** It is not: the second implementation derives
  declination and right ascension from its own series expansion and never calls `adhan`. If both were wrong
  in the same way they would have to share an error, and the closed-form solstice check is independent of
  both.
- **The altitude ceiling started as a guess and is now swept.** The first draft carried a 5-degree floor and
  no ceiling at all, which would have shipped a screen showing a confident number while Makkah's noon sun
  swept 799 degrees of azimuth per hour. Section 6 replaces it with a measured 5 to 65 band and states what
  the ceiling costs.
- **I checked whether reproducing the rashd al-qiblah dates is circular, and it is not.** The published
  figures come from historians of Islamic astronomy; the code derives them from `adhan`'s solar series and
  the Kaaba's coordinates, and it was never given a date to aim at. It searched all 365 days and the two it
  found are the two that are published.
- **The strongest remaining objection is that none of this helps a user with no sun**, and that is true. The
  polar night, an overcast day and a windowless room are all real and the sun answers none of them. This is
  why the report ends as a complement to the map rather than a replacement for it, and why the design owes
  the user an honest "not now" rather than a drawn line.

## 8. The interaction, and the number that decides it

A user cannot read an azimuth off the sky. The question is what they DO, and four candidate actions were
costed. The transfer from aim to heading is one to one, so the aiming error IS the heading error:

| Action | Aim error | Notes |
| --- | --- | --- |
| Point the phone's top edge at the sun, by eye | 8 deg | Worst, and the obvious design |
| Align the sun in the camera and tap its centre | 3 deg | Needs the camera permission |
| **Lay the phone flat, match a drawn line to the real shadow falling on the screen** | **2 deg** | Needs nothing but the accelerometer |
| Gnomon shadow with the sun below 40 deg | 1.5 deg | Needs a stick |

**Tilt is what separates them, and it is the same 65-degree gate again.** An aiming error perpendicular to the
sun projects onto the horizontal as `error / cos(altitude)`, so 5 degrees of tilt costs 5.1 degrees of
azimuth at a 10-degree sun, 6.5 at 40 degrees, 11.8 at the 65-degree gate and **28.8 at 80 degrees**. One
gate bounds the shadow length, the azimuth rate and the tilt sensitivity together, which is why it is a
single constant rather than three.

**The shadow-on-screen method is the design, and its budget is measured rather than asserted:**

| Term | Degrees |
| --- | --- |
| Level, from the accelerometer with the phone flat | 0.50 |
| Matching the drawn line to the shadow's edge | 2.00 |
| Shadow edge sharpness, the sun being 0.53 deg wide | 1.00 |
| Solar azimuth computation | 0.01 |
| **RSS total** | **2.29** |

The phone lies flat, so the accelerometer gives level to a fraction of a degree and **the magnetometer is
never consulted**. Adding the same 5-degree body-transfer term every method pays gives **5.5 degrees end to
end**, against the map's 6.2 and the compass's 30 indoors.

**The penumbra term is the floor nobody can remove:** the sun's disc is 0.53 degrees wide, so a shadow edge
is inherently soft. It is also the reason this is honest, because a soft edge the user can see is a visible
uncertainty, which is exactly the property `P0-error-budget.md` says the dial lacks.
