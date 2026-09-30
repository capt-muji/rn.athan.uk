# R14: how does the app know WHERE it is, offline?

Research only. No app code, no dependency added to the repository's `package.json`, no build, no
git. Everything ran in `/Users/muji/athan-global-scratch/r14/` against `adhan@4.4.6` and
`@photostructure/tz-lookup@11.7.0` installed there alone. Scripts and verbatim outputs are in
`data/location/`, with a reproduction recipe in `data/location/README.md`.

Marking discipline, as `BRIEF.md` requires. **Measured** means this report computed it and the
script is named. **Cited** means a named source asserts it, with its URL and fetch date.
**UNVERIFIED** means neither, and section 8 lists every one.

---

## Findings in one page

1. **A prayer time needs city accuracy, not GPS accuracy, and the number is about 20 km.**
   Measured: the radius inside which all six times stay within one displayed minute is **25 km at
   the equator, 22 at Makkah, 18 at Istanbul, 13 at London and 8 at Oslo**. Fine GPS at 50 m is 250
   times more precision than the problem needs. Every sub-city positioning method is
   indistinguishable in the output.

2. **THE TIMEZONE-ONLY VERDICT IS NO, AND IT IS NOT CLOSE.** Measured across all 34,152 GeoNames
   places: placing a user at their zone's most populous city gives a **median error of 16
   displayed minutes**, a 90th percentile of 51 and a worst case of 120. Only **28.1%** of the
   sampled world population lands within 2 minutes. In Muslim-majority countries the median is 11
   minutes and 35.3% are within 2. **Diyarbakir, the city session 37 measured at 29.7 degrees of
   qibla error, is 55 displayed minutes wrong on prayer times.** The app cannot go worldwide
   without a location signal, and this report could not rescue the permission-free option.

3. **The two errors have different shapes, and that is the real asymmetry.** Measured over the same
   34,152 cities: **8.6% exceed 10 degrees of qibla error while 83.0% exceed 2 minutes of prayer
   error.** Qibla error is catastrophic in a few places and negligible elsewhere, because the
   bearing is singular near Makkah; prayer error is moderate everywhere and grows smoothly at about
   0.04 minutes per km. **So row 37's rejection of timezone inference is not a precedent that
   transfers here, and neither would its acceptance have been.** Jeddah shows it: against the
   capital it is **147.8 degrees of qibla and 40 prayer minutes**, and against the most populous
   city it is **0 and 0**, because Jeddah is that city.

4. **The country is a much better signal than the zone, it needs no permission, and it comes
   free.** Measured from `zone1970.tab`: **47 of 51** Muslim-majority countries have exactly one
   IANA zone, so for them the zone and the country carry identical information. But ten zones name
   more than one country, and those ten hold **17.4%** of the measured Muslim-majority population,
   including all of Nigeria under `Africa/Lagos` and Saudi Arabia sharing `Asia/Riyadh` with Yemen
   and Kuwait. `expo-localization`'s `regionCode` disambiguates every one of them and asks nothing.

5. **Coordinate-to-zone is buildable offline, and R8's UNVERIFIED flag can be lifted for Malaysia.**
   A 1,605-point grid probe of `api.waktusolat.app` established a coordinate-to-JAKIM-zone oracle;
   point-in-polygon over geoBoundaries ADM2 reproduces it on **96.5% of 425 on-land points** with a
   seven-entry alias table, in **63 KB brotli**. The 3.5% residue is structural, not fixable: one
   ADM2 polygon, `Hulu Perak`, spans JAKIM's `PRK03` and `PRK04`. And **10 of the 60 zones were
   never returned by any coordinate**, so a picker is required regardless.

6. **Elevation: read it, and the reason is the reverse of what R1 feared.** Measured on JAKIM's own
   published year: JAKIM's high-ground zones carry a **horizon-dip signature of 4.4 to 7.0 minutes
   in excess of the sea-level baseline**, seasonally stable to under 0.7 minutes and unmoved by a
   50 km coordinate perturbation. Inverted, `PHG06` implies **1,482 m** against an actual 1,440 m.
   R1's warning was that applying elevation makes the app differ from the authority. Measured, the
   opposite holds: **JAKIM applies it, so NOT applying it is what makes the app differ.**

7. **Travel is the hardest problem and a timezone listener does not solve it.** Measured: **88% of
   IANA zones with three or more cities contain an intra-zone journey worth over 5 displayed
   minutes, 72% over 15 and 45% over 30**. London to Glasgow is 44 minutes with no zone change.
   Separately, **34% of cross-zone city pairs within 100 km differ by 2 minutes or less**, so the
   signal fires when it does not matter and stays silent when it does.

8. **The armed alarms are the sharpest consequence and the lightest user is the most exposed.**
   Measured from this worktree: one row armed at-time only reaches **64 days ahead**, so 64 OS
   requests are wrong the moment the user lands. London to Makkah moves the solar instant by up to
   **256 minutes** and the zone by another 120. An alarm left armed across that journey does not
   fire late; it fires at a time that is not any prayer.

9. **A worldwide city picker is cheap and the honest answer to several of these problems.**
   Measured: 34,152 GeoNames places over 15,000 population cost **313 KB brotli** in a binary
   encoding, and a greedy set cover shows **3,211 cities** put every one of those places within 100
   km, at **30 KB**. A 1,000-city list reaching 47.7% of that population is **10 KB**.

10. **`@photostructure/tz-lookup` survived a test 2,000 times larger than R4's.** Measured
    against all 34,152 places: **98.33% identical zone names**, and of the 1.67% that differ, only
    **204 places holding 0.246% of the population** have a genuinely different UTC offset. Every one
    is a land border. 88,029 bytes, CC0-1.0, both read from the installed package.

**The recommendation, in one sentence.** Ask for coarse location once, at the moment the user picks
their source and never at launch; fall back to the device region plus a city or zone picker for
anyone who refuses, which is a complete path and not a degraded one; treat a zone change as a
prompt and never as a silent source switch; and read elevation from a shipped per-place integer
rather than from the device.

---

## 1. What this report had to establish, and the prior constraints it inherited

The architecture in `RECOMMENDATION.md` rests on one sentence: "Auto-select the source from the
user's country, let them change it." Nothing in the eight prior reports establishes how the app
learns the country, the position, or the zone. This report is that layer.

Four constraints were fixed before it started, and all four are load-bearing.

| Constraint | Established by | What it forbids |
| --- | --- | --- |
| The app asks for **no location permission for prayer times**, and for the qibla compass alone | measured in this worktree: `app.json:36-44` declares six Android permissions and not one is a location permission, so the two Android location permissions reach the build from `expo-location`'s own manifest rather than from `app.json`; `app.json:25` carries the one `NSLocationWhenInUseUsageDescription`, whose text names the compass | adding a launch-time permission prompt, or a second reason the user was never told about |
| Inferring position from the timezone is **UNUSABLE for qibla** | row 37, cited in `ai/plans/README.md:127`: 0.5 degrees for Manchester, 6.5 Detroit, 13.7 Peshawar, 29.7 Diyarbakir, **147.5 for Jeddah** | assuming the same trick is safe here without measuring it |
| **No network, no API key, no tile server** at runtime | row 41, `ai/plans/41-qibla-map/BRIEF.md:35` and `ASSUMPTIONS.md:23` | any coordinate-to-anything service call |
| A user's settings are **never silently changed** | the standing rule, restated in `R8` section 6.3 | a source that follows the user without asking |

One prior ruling shapes the answer more than any measurement. Row 37's planning session proposed a
permission gradient and **the owner rejected it**, reasoning that a compass which only finds
magnetic north answers the wrong question. The same test applies here and gives the opposite
answer: a prayer-time app with an approximate position is not broken, it is 1 minute out. That
difference is the whole of section 3.

---

## 2. Part 1: how position-sensitive is a prayer time, really?

All measured with `adhan@4.4.6`, `CalculationMethod.MuslimWorldLeague()`,
`highLatitudeRule = SeventhOfTheNight`, `madhab = Shafi`. Sections 2.1 to 2.5 use
`Rounding.None` so the sub-minute structure is visible; section 2.6 uses `Rounding.Nearest`,
which is what the app displays. Scripts: `data/location/part1.mjs`, `part1b.mjs`, `part1c.mjs`.

`km per degree of latitude = 111.1951` throughout, from `R = 6371.0088` km.

### 2.1 Longitude is exactly a clock offset, and that is the easy half

Four minutes of clock per degree of longitude. So the shift per km east is `4 / (111.195 cos φ)`,
identical for every prayer and every date. Measured, and confirmed against `adhan` to the second
decimal in `part1.txt` section 1B.

| Latitude | km per degree of longitude | minutes per km east | km for 0.5 min | km for 1.0 min |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 111.2 | 0.0360 | 13.9 | 27.8 |
| 20 | 104.5 | 0.0383 | 13.1 | 26.1 |
| 40 | 85.2 | 0.0470 | 10.6 | 21.3 |
| 50 | 71.5 | 0.0560 | 8.9 | 17.9 |
| 60 | 55.6 | 0.0719 | 6.9 | 13.9 |
| 65 | 47.0 | 0.0851 | 5.9 | 11.7 |

Confirmation at London, 2026-03-20, moving east (measured, `part1.txt` 1B): 1 km moves every one of
the six times by 0.05 to 0.07 minutes, 100 km by 5.77 to 5.78, and 500 km by 28.85 to 28.93. **The
spread between the six prayers at 500 km is 0.08 minutes.** Longitude error is a rigid translation
of the whole day.

### 2.2 Latitude error is a different animal, and Dhuhr proves it

Moving north at fixed longitude, Dhuhr cannot move at all, and measured it does not: **0.00 at
every latitude, every distance and every date**. Solar noon is a function of longitude alone. Every
other time moves, because latitude changes the geometry of the sun's path rather than the clock.

Measured at 100 km north, by latitude and season (`part1.txt` 1C, signed minutes):

| Latitude | Date | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | 20 Mar | 0.00 | 0.02 | **0.00** | 1.77 | 0.02 | 0.02 |
| 0 | 21 Jun | -1.68 | -1.57 | **0.00** | 0.38 | 1.55 | 1.67 |
| 20 | 21 Jun | -2.65 | -1.82 | **0.00** | -0.97 | 1.83 | 2.58 |
| 40 | 21 Jun | -2.15 | -3.00 | **0.00** | 1.93 | 2.98 | 2.13 |
| 50 | 21 Jun | -3.38 | -4.73 | **0.00** | 1.88 | 4.73 | 3.38 |
| 55 | 21 Jun | -4.74 | -6.63 | **0.00** | 1.98 | 6.63 | 4.74 |
| 60 | 21 Jun | -7.82 | -10.95 | **0.00** | 2.25 | 10.97 | 7.83 |
| 65 | 21 Jun | **null** | **null** | 0.00 | 2.80 | **null** | **null** |
| 65 | 21 Dec | 15.24 | 21.33 | **0.00** | -8.50 | -21.33 | -15.24 |

Three things in that table.

**Latitude sensitivity grows sharply with latitude and with season.** At the equator in June, 100
km north moves Maghrib 1.55 minutes. At 60 degrees it moves it 10.97, a factor of seven. At 65
degrees in December it is 21.33.

**Sunrise and Maghrib are the most latitude-sensitive pair, not Fajr and Isha.** This is the
opposite of the authority-disagreement picture in `FINDINGS.md` section 1, where Fajr and Isha carry
all the uncertainty. Position error and convention disagreement load different prayers.

**The nulls at 65 degrees in June are `adhan` refusing to guess**, which `R3` established as
deliberate design. Position sensitivity is undefined where the prayer has no solution.

### 2.3 The decomposition, side by side at 100 km

Measured (`part1.txt` 1G), maximum absolute minutes over the four dates. `NS` holds longitude and
`EW` holds latitude.

| City | Latitude | Axis | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Jakarta | -6.21 | NS | 1.88 | 1.60 | **0.00** | 1.33 | 1.58 | 1.85 |
| | | EW | 3.63 | 3.63 | 3.63 | 3.62 | 3.62 | 3.63 |
| Makkah | 21.42 | NS | 2.77 | 1.87 | **0.00** | 1.47 | 1.88 | 2.70 |
| | | EW | 3.87 | 3.87 | 3.87 | 3.87 | 3.87 | 3.87 |
| Istanbul | 41.01 | NS | 2.23 | 3.12 | **0.00** | 2.87 | 3.10 | 2.21 |
| | | EW | 4.78 | 4.77 | 4.77 | 4.78 | 4.78 | 4.78 |
| London | 51.51 | NS | 3.70 | 5.18 | **0.00** | 4.23 | 5.18 | 3.70 |
| | | EW | 5.78 | 5.78 | 5.78 | 5.80 | 5.78 | 5.78 |
| Oslo | 59.91 | NS | **7.75** | **10.85** | **0.00** | 6.12 | **10.85** | 7.75 |
| | | EW | 7.18 | 7.18 | 7.18 | 7.20 | 7.18 | 7.18 |
| Tromso | 69.65 | NS | 3.72 | 0.60 | **0.00** | **10.53** | 0.48 | 4.30 |
| | | EW | 10.38 | 10.38 | 10.35 | 10.40 | 10.38 | 10.37 |

**Below about 50 degrees, longitude dominates.** At Jakarta the east-west figure is more than twice
the north-south. That is convenient, because longitude error is a uniform clock offset and therefore
the most forgiving kind of error: the whole day shifts together, the intervals between prayers are
preserved, and the sequence never reorders.

**At Oslo the two cross over**, and above that latitude the north-south figure exceeds it. This is
where position error stops being a clock offset and starts distorting the shape of the day.

**Tromso's row is not a measurement of position sensitivity.** Its Asr figure of 10.53 is `adhan`'s
Asr approximation running away above 60N, which `R7` measured at 2,279 minutes and this report
confirms independently in 2.6.

### 2.4 The worst case over eight compass directions, which is what a positioning error actually is

A real positioning error has a radius, not a direction. Measured (`part1.txt` 1D): the largest
absolute shift of any of the six times over eight bearings and all four dates, with the prayer that
produced it.

| City | Latitude | 1 km | 10 km | 50 km | 100 km | 500 km |
| --- | ---: | --- | --- | --- | --- | --- |
| Singapore | 1.35 | 0.1 isha | 0.4 fajr | 1.9 fajr | 3.8 asr | 18.9 fajr |
| Jakarta | -6.21 | 0.1 fajr | 0.4 fajr | 1.9 fajr | 3.9 fajr | 19.6 fajr |
| Makkah | 21.42 | 0.1 sunrise | 0.5 fajr | 2.3 fajr | 4.7 fajr | 23.6 fajr |
| Karachi | 24.86 | 0.1 sunrise | 0.5 isha | 2.5 isha | 4.9 isha | 24.0 isha |
| Cairo | 30.04 | 0.1 sunrise | 0.5 asr | 2.3 asr | 4.6 asr | 23.1 asr |
| Istanbul | 41.01 | 0.1 maghrib | 0.6 sunrise | 2.8 sunrise | 5.6 sunrise | 28.4 sunrise |
| Toronto | 43.65 | 0.1 sunrise | 0.6 sunrise | 3.0 sunrise | 6.0 maghrib | 30.4 sunrise |
| London | 51.51 | 0.1 sunrise | 0.8 sunrise | 3.9 sunrise | 7.7 sunrise | 40.3 sunrise |
| Oslo | 59.91 | 0.1 sunrise | 1.2 sunrise | 6.2 sunrise | **12.6** sunrise | **76.5** sunrise |
| Tromso | 69.65 | 0.1 asr | 1.5 asr | 7.3 asr | 14.7 asr | 95.9 fajr |

**1 km is 0.1 minutes everywhere on earth.** Nothing in this table justifies GPS.

### 2.5 The direct answer: what radius does a prayer time actually need?

Binary search on the radius at which the worst of the six times over 16 bearings and four dates
first exceeds the tolerance. Measured (`part1.txt` 1E), in km.

| City | Latitude | within 0.5 min | **within 1 min** | within 2 min | within 5 min |
| --- | ---: | ---: | ---: | ---: | ---: |
| Singapore | 1.35 | 12.6 | **25.2** | 50.4 | 125.9 |
| Jakarta | -6.21 | 12.4 | **24.8** | 49.4 | 123.3 |
| Makkah | 21.42 | 10.9 | **21.6** | 43.0 | 106.9 |
| Karachi | 24.86 | 10.3 | **20.5** | 40.9 | 101.6 |
| Cairo | 30.04 | 10.6 | **21.2** | 42.4 | 106.1 |
| Casablanca | 33.57 | 10.2 | **20.4** | 40.8 | 101.8 |
| Istanbul | 41.01 | 9.0 | **18.0** | 36.0 | 89.7 |
| Toronto | 43.65 | 8.5 | **16.9** | 33.8 | 84.2 |
| London | 51.51 | 6.6 | **13.1** | 26.1 | 65.0 |
| Berlin | 52.52 | 6.3 | **12.6** | 25.0 | 62.3 |
| Oslo | 59.91 | 4.1 | **8.1** | 16.2 | 40.3 |
| Tromso | 69.65 | 3.5 | **6.9** | 13.8 | 34.3 |

**The answer to the brief's question, stated plainly: about 20 km, falling to 13 km at London and
8 km at Oslo.** A single number for design purposes is **10 km**, which holds every prayer within
one displayed minute everywhere up to and including London, and within two minutes at Oslo and
Tromso, where the radius is genuinely tighter and no single figure covers it.

The per-prayer breakdown at 0.5 minutes (`part1.txt` 1F) shows the six times are within 2 km of each
other at every city, so **there is no case for a per-prayer position tolerance**. One radius serves
all six, which simplifies any movement trigger considerably.

### 2.6 The displayed-minute question, which is the one the user sees

Sections 2.1 to 2.5 measure the underlying instant. A user sees `HH:mm`. A 0.2-minute shift can
still cross a rounding boundary and change the digits. So the honest measure is: over a whole year,
what fraction of the 2,190 displayed values change when the position moves by N km?

Measured with `Rounding.Nearest`, 365 days of 2026, six times, maximum over eight bearings
(`part1b.txt`):

| City | Latitude | 1 km | 2 km | 5 km | 10 km | 20 km | 50 km |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Jakarta | -6.21 | 3.8% | 8.4% | 18.9% | 36.7% | 72.5% | 100.0% |
| Makkah | 21.42 | 3.6% | 7.2% | 18.3% | 38.7% | 78.0% | 100.0% |
| Cairo | 30.04 | 4.0% | 8.8% | 21.3% | 41.8% | 82.6% | 100.0% |
| Istanbul | 41.01 | 4.6% | 9.9% | 25.1% | 47.9% | 96.0% | 100.0% |
| London | 51.51 | 6.3% | 12.2% | 29.1% | 58.0% | 100.0% | 100.0% |
| Oslo | 59.91 | 7.4% | 14.5% | 35.8% | 71.8% | 100.0% | 100.0% |

And the worst single displayed-minute error over the same sweep:

| City | 1 km | 10 km | 50 km | 100 km | 500 km |
| --- | ---: | ---: | ---: | ---: | ---: |
| Jakarta | 1 | 1 | 2 | 4 | 20 |
| Makkah | 1 | 1 | 3 | 5 | 24 |
| Istanbul | 1 | 1 | 3 | 6 | 29 |
| London | 1 | 1 | **4** | **8** | 41 |
| Oslo | 1 | 2 | 7 | 13 | 77 |

**The two tables say different things and both matter.** A 10 km error changes 37% to 72% of the
year's displayed values, which sounds alarming, but **it never changes any of them by more than one
minute**. That is the distinction a design decision hangs on: the error is broad and shallow. A 50
km error is the first one that produces a 2-minute wrong digit anywhere, and 100 km is the first
that produces 4 or more.

**The Tromso rows in `part1b.txt` show 7,063 minutes at 1 km, and that is not a measurement of
anything real.** `part1c.mjs` isolates it: over 1,820 non-null pairs there are **exactly three**
shifts above 60 minutes, `asr 981 min` on 2026-01-19, `maghrib 232` on 2026-05-18 and `asr 161` on
2026-11-23. Those are `adhan`'s Asr approximation runaway and the polar-day Maghrib discontinuity,
both of which flip on a hair of latitude. This independently confirms `R7`'s finding and
`RECOMMENDATION.md`'s condition to bound Asr above 60N. **Excluding them, Tromso's worst
displayed-minute error at 1 km is 59 and at 500 km is 60**, which is the solver's own instability
rather than the sun's.

---

## 3. Part 2: every way to know where the device is, without a network

### 3.1 The comparison table, with every accuracy figure converted to prayer minutes

Measured with `part2-methods.mjs`: each method's documented accuracy radius applied in 16
directions on 12 dates of 2026, reporting the worst displayed-minute change of any of the six
times. Bundle figures are measured from the installed package or the npm registry on 2026-09-30.

| Method | Permission | Offline? | Accuracy | Jakarta | Makkah | Istanbul | London | Oslo | Bundle cost |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| **Device timezone** | **none** | **yes** | zone-wide, see 3.2 | **68** | **59** | **74** | **72** | **120** | 0, `Intl` is built in |
| **Device region** (`expo-localization`) | **none** | **yes** | country-wide, see 3.4 | 120 | 62 | 55 | 72 | n/a | 157,144 B unpacked (57.0.2, MIT) |
| `Accuracy.Lowest` | coarse | yes | ~3 km, cited Apple | 1 | 1 | 1 | 1 | 1 | in `expo-location`, already a dependency |
| Android approximate grid | coarse | yes | "about 3 square kilometers", cited Google | 1 | 1 | 1 | 1 | 1 | same |
| iOS reduced, best case | coarse | yes | 1 km, cited Apple | 1 | 1 | 1 | 1 | 1 | same |
| **iOS reduced, worst case** | coarse | yes | **20 km**, cited Apple | 1 | 1 | **2** | **2** | **3** | same |
| `Accuracy.Balanced` | fine or coarse | yes | 100 m, cited Apple | 1 | 0 | 0 | 1 | 1 | same |
| Fine GPS, `Accuracy.High` | fine | yes | "usually within about 50 meters", cited Google | 1 | 0 | 0 | 0 | 1 | same |
| **City picker**, city centre | **none** | **yes** | ~15 km within a large city | 1 | 1 | 1 | **2** | **2** | 313 KB brotli for 34,152 cities, or 10 KB for 1,000 |
| **Zone picker** | **none** | **yes** | exact by construction | 0 | 0 | 0 | 0 | 0 | 60 short strings for Malaysia |

The `1` in most cells is not a rounding artefact worth dismissing. It is the floor: **any position
change at all flips some displayed value by one minute somewhere in a year.** What the table shows
is that from fine GPS down to a 3 km coarse grid, **the output is identical**. The first method that
produces a 2-minute error is iOS reduced accuracy at its documented worst case, and then only above
40 degrees latitude.

**The design consequence is blunt: this app has no use for fine location.** `device/qibla.ts:64`
already requests `Accuracy.Balanced` for exactly this reason, with a comment saying so. Prayer
times need less precision than the compass does, so the existing posture is already correct and
needs no strengthening.

### 3.2 The timezone-only verdict: NO

This is the central question of the brief and the answer is negative.

**Method.** GeoNames `cities15000` (34,152 places over 15,000 population, CC BY 4.0, downloaded
2026-09-30) carries an IANA zone per place. A timezone-only app places every user in a zone at that
zone's representative point. For every city, the error is the worst displayed-minute difference
between computing at the city and computing at its zone's representative, over 24 dates in 2026 and
six times, so 144 values per city. Differences above 120 minutes are polar solver discontinuities
and are counted separately rather than included. Script: `part2-tz.mjs`, 356 zones, 34,152 cities.

**The global distribution, measured** (`part2-tz.txt` 2A), using the most populous city as the
representative:

| Statistic | Displayed minutes |
| --- | ---: |
| median city | **16** |
| 75th percentile | 32 |
| 90th percentile | **51** |
| 95th percentile | 65 |
| 99th percentile | 93 |
| worst city | 120 |

Population-weighted, using each place's own GeoNames population:

| Error at most | Share of `cities15000` population |
| --- | ---: |
| 0 min, exact | 14.3% |
| 1 min | 24.3% |
| **2 min** | **28.1%** |
| 5 min | 34.6% |
| 10 min | 43.7% |
| 20 min | 59.3% |
| 30 min | 70.2% |

Restricted to the 5,094 places in Muslim-majority countries, population 792,043,090:

| Statistic | Value |
| --- | ---: |
| median city error | 11 min |
| 90th percentile | 35 min |
| 99th percentile | 60 min |
| worst | 89 min |
| population within 2 min | **35.3%** |
| population within 5 min | 44.7% |
| population within 10 min | 59.0% |

**64.7% of the sampled Muslim-majority-country population would see a prayer time more than 2
minutes wrong.** Against an app whose whole positioning claim is faithful reproduction of a named
authority's published digits, and against authorities whose own safety margins are 0 to 8 minutes
(`FINDINGS.md` section 1), that is not a viable default.

**The worst zones, and they are not obscure** (`part2-tz.txt` 2B and 2C):

| Zone | Cities | Principal city | Worst city | Worst min | Max km from principal | Population within 5 min |
| --- | ---: | --- | --- | ---: | ---: | ---: |
| `Asia/Shanghai` | 2003 | Shanghai | Lhasa | **120** | 3,884 | 9.5% |
| `Asia/Kolkata` | 3779 | Mumbai | Tezu | 117 | 2,560 | 8.3% |
| `Europe/Moscow` | 689 | Moscow | Ukhta | 120 | 1,886 | 32.0% |
| `Asia/Almaty` | 57 | Almaty | Petropavl | **89** | 1,408 | 23.6% |
| `Europe/Istanbul` | 432 | Istanbul | Şemdinli | **74** | 1,407 | 38.7% |
| `Asia/Jakarta` | 325 | Jakarta | Banda Aceh | 68 | 1,857 | 41.3% |
| `Asia/Tehran` | 428 | Tehran | Jālq | 67 | 1,454 | 31.3% |
| `Asia/Karachi` | 372 | Lahore | Jiwani | 67 | 1,429 | 27.2% |
| `Asia/Kuala_Lumpur` | 303 | Kuala Lumpur | Labuan | 59 | 1,522 | 54.3% |
| `Asia/Riyadh` | 98 | Jeddah | Dammam | 59 | 1,247 | 26.8% |
| `Africa/Lagos` | 269 | Lagos | Gamboru | 57 | 1,356 | 36.8% |
| `Africa/Cairo` | 241 | Cairo | Hala'ib | 45 | 1,024 | 61.5% |
| `Asia/Dhaka` | 137 | Dhaka | Thākurgaon | 16 | 372 | 59.0% |
| `Asia/Gaza` | 13 | Gaza | Rafaḩ | **2** | 31 | 100.0% |
| `Asia/Bahrain` | 8 | Al Muharraq | Manama | **1** | 24 | 100.0% |

**Only 3 of the 68 zones containing a Muslim-majority-country city have a worst case within 2
minutes, and 9 within 5.** The three are Gaza, Bahrain and the Maldives, and they are small
territories.

**The representative choice does not rescue it** (`part2-tz2.txt` 2G). Three candidates, measured
globally:

| Representative | Median prayer min | p90 | Worst | Population within 2 min | within 5 min |
| --- | ---: | ---: | ---: | ---: | ---: |
| most populous city | 16 | 51 | 120 | 28.1% | 34.6% |
| country capital in the zone | 15 | 49 | 120 | 24.7% | 30.4% |
| population-weighted centroid | **14** | **37** | 120 | **7.9%** | 21.7% |

The centroid has the best tail and the worst head: it improves the 90th percentile from 51 to 37
minutes while collapsing the exact-match population from 28.1% to 7.9%, because it moves the answer
away from the big cities where most people are. **No representative choice makes timezone-only
viable.** The approach is not miscalibrated, it is under-determined: a zone is a legal object and
prayer times are a geographic quantity.

### 3.3 The asymmetry against qibla, which is not the one the brief anticipated

Session 37's five measured cities, with both errors computed by the same script from the same
representative (`part2-tz2.txt` 2F):

| City | Zone | Representative | km from it | **Prayer, displayed min** | **Qibla, degrees** |
| --- | --- | --- | ---: | ---: | ---: |
| Manchester | `Europe/London` | London | 262 | **20** | 0.5 |
| Detroit | `America/Detroit` | Detroit | 0 | **0** | 0.0 |
| Peshawar | `Asia/Karachi` | Lahore | 376 | **18** | 6.2 |
| Diyarbakır | `Europe/Istanbul` | Istanbul | 1,026 | **55** | 29.7 |
| **Jeddah** | `Asia/Riyadh` | Jeddah | 0 | **0** | **0.0** |

The qibla column reproduces row 37's published figures to a tenth of a degree for Manchester,
Detroit, Peshawar and Diyarbakir, which validates the harness. **Jeddah is the exception and the
most instructive row in this report.**

Row 37 measured Jeddah at 147.5 degrees of qibla error. This script measures 0.0. Both are correct,
and the difference is the representative: **Jeddah IS the most populous city in `Asia/Riyadh`**, so
under a population representative it maps to itself. Row 37 evidently used Riyadh, the capital. The
capital column confirms it: **Riyadh, 849 km away, gives 40 prayer minutes and 147.8 qibla
degrees**, matching row 37 to 0.3 degrees.

**So the honest statement of the asymmetry is not the one the brief anticipated.** It is not that
prayer times tolerate timezone inference where qibla does not. The two errors have different SHAPES,
and bucketing both by distance from the representative shows it:

| Distance from representative | Cities | Mean prayer min | Worst prayer min | Mean qibla deg | Worst qibla deg |
| --- | ---: | ---: | ---: | ---: | ---: |
| 0 to 10 km | 2,060 | 0.8 | 2 | 0.0 | 0.4 |
| 10 to 50 km | 3,962 | 1.7 | 6 | 0.2 | **2.4** |
| 50 to 100 km | 2,475 | 4.0 | 13 | 0.8 | **76.5** |
| 100 to 250 km | 5,694 | 8.7 | 75 | 1.7 | **170.8** |
| 250 to 500 km | 7,935 | 18.3 | 80 | 3.8 | **179.0** |
| 500 to 1000 km | 6,968 | 32.4 | 120 | 6.1 | 175.2 |
| 1000 to 5000 km | 5,058 | 58.8 | 120 | 8.4 | 152.2 |

Measured, `part2-tz2.txt` 2H. **Prayer error grows smoothly and predictably with distance: roughly
0.04 minutes per km, which is exactly the longitude clock rate from 2.1.** Qibla error is wild:
its mean is small at every distance, 8.4 degrees even at 1,000 km, but its worst case explodes to
76 degrees at 50 km, because the bearing is singular near Makkah and near the antipode. **Qibla
error is catastrophic in a few places and negligible elsewhere; prayer error is moderate
everywhere.** Measured over the same 34,152 cities: **8.6% exceed 10 degrees of qibla error, and
83.0% exceed 2 minutes of prayer error.**

That asymmetry has a design consequence worth stating: **a technique can be fine for qibla and
unusable for prayer times, and the reverse.** Row 37's rejection of timezone inference does not
transfer here as a precedent, and neither would its acceptance have.

### 3.4 The device region, which is the surprising winner among the permission-free options

`expo-localization` 57.0.2 (MIT, 157,144 bytes unpacked, measured from the npm registry
2026-09-30; 58.0.1 exists and is what SDK 58 would use) exposes `regionCode` on its `Locale` type.
Read from the package's own type documentation (`expo-localization-58.0.1.tgz`,
`build/Localization.types.d.ts`, measured):

> The region code for your device that comes from the Region setting under Language & Region on
> iOS, Region settings on Android and is parsed from locale on Web (can be `null` on Web).

Session 39 already recorded the crucial caveat (`ai/plans/39-localisation/LOCALIZATION-API.md:56-60`):
**`regionCode` is read from a settings menu, not from position.** So it is not a location signal.
What it is, precisely, is **a statement of which country's conventions the user expects**, which for
source selection is arguably a better signal than position anyway: a Malaysian working in Dubai who
has left their region as `MY` is telling the app something true.

**Placing the user at their country's capital is worse than the zone for large countries and better
for small ones** (`part2-country.txt` 2J), measured over 60 countries:

| cc | Capital | Cities | Worst city | Worst min | Furthest city km | Population within 2 min | within 10 min |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: |
| ID | Jakarta | 448 | Timika | **120** | 3,777 | 26.1% | 39.9% |
| PK | Islamabad | 372 | Jiwani | 67 | 1,457 | 5.7% | 39.2% |
| TR | Ankara | 432 | Şemdinli | 55 | 1,058 | 6.4% | 13.1% |
| SA | Riyadh | 98 | Ḩaql | 62 | 1,273 | 18.0% | 20.8% |
| EG | Cairo | 241 | Hala'ib | 46 | 1,023 | 43.4% | **88.9%** |
| BD | Dhaka | 137 | Teknāf | 17 | 381 | 47.4% | **91.0%** |
| JO | Amman | 34 | Rukban | **15** | 301 | 92.8% | 96.4% |
| AE | Abu Dhabi | 63 | Dibba Al-Hisn | 12 | 231 | 18.3% | **96.5%** |
| LB | Beirut | 18 | Aarsâl | **5** | 98 | 87.9% | 100.0% |
| BN | Bandar Seri Begawan | 7 | Kuala Belait | **4** | 86 | 79.2% | 100.0% |
| QA | Doha | 26 | Umm Ghuwaylīnah | **3** | 51 | 97.5% | 100.0% |
| KW | Kuwait City | 18 | Ar Riqqah | **2** | 36 | 100.0% | 100.0% |
| BH | Manama | 8 | Sitrah | **1** | 20 | 100.0% | 100.0% |
| MV | Male | 1 | | **0** | 0 | 100.0% | 100.0% |

**Seven of the countries measured are small enough that the capital IS an adequate position**:
Kuwait, Bahrain, Qatar, the Maldives, Brunei, Lebanon and Djibouti all come in at 5 minutes or
better. Jordan at 15 and the UAE at 12 are borderline. Everything larger than that needs a real
position, and Indonesia, Pakistan and Turkey need one badly.

**But the region's real value is not as a position at all, it is as the country key for source
selection**, and there it is decisive. Measured from `zone1970.tab` (`part3-country.txt`):

| Measure | Value |
| --- | ---: |
| Zones in `zone1970.tab` | 312 |
| Zones naming more than one country | **34** |
| Muslim-majority countries in the file | 51 |
| of those, exactly ONE IANA zone | **47** |
| of those, more than one zone | 4: `ID` (4), `KZ` (7), `MY` (2), `PS` (2) |

**A methodological correction worth recording.** A first pass used `zone.tab`, found zero ambiguous
zones, and concluded the timezone identifies the country perfectly. That was wrong, and the reason
is in the IANA distribution's own design: **`zone.tab` lists exactly one country per zone by
construction**, so it cannot express the question. `zone1970.tab` is the file that can, and it shows
34 zones covering more than one country.

**The ten ambiguous zones that touch a Muslim-majority country, every one of them named**
(`part3-country.txt` 3A, populations from `cities15000`):

| Zone | Countries | Muslim-majority members |
| --- | ---: | --- |
| `Africa/Abidjan` | 12 | CI 17.5M, SN 10.1M, ML 7.7M, GN 6.7M, BF 6.1M, MR 2.2M, SL 1.8M, GM 1.3M |
| `Africa/Lagos` | 10 | **NG 75.2M**, NE 3.7M |
| `Africa/Nairobi` | 10 | TZ 21.4M, SO 6.4M, DJ 1.3M, ER 0.8M, KM 0.1M |
| `Asia/Riyadh` | 4 | **SA 23.9M**, YE 6.9M, KW 1.7M |
| `Asia/Dubai` | 5 | AE 12.9M, OM 3.3M |
| `Asia/Kuching` | 2 | MY 37.3M, BN 0.2M |
| `Asia/Qatar` | 2 | QA 1.6M, BH 0.8M |
| `Asia/Singapore` | 3 | MY 37.3M (with SG) |
| `Europe/Belgrade` | 6 | MK 1.8M |
| `Indian/Maldives` | 2 | MV 0.1M |

**135,250,527 of the 779,145,461 measured Muslim-majority-country population, 17.4%, lives in a
zone shared with another country.** And these are exactly the cases where it matters: `R1` measured
that Saudi Arabia's Umm al-Qura and Yemen's authority differ, that Oman measures 18.0/18.2 as a real
angle while the UAE measures 18.15/18.09, and that Qatar has a real 90-minute Isha where Bahrain is
NULL. **A user in Yemen whose zone says `Asia/Riyadh` would be handed Umm al-Qura's 90-minute Isha,
which is not Yemen's convention.** The region code resolves every one of these ten cases and costs
nothing.

**So the two permission-free signals are complementary rather than competing.** The zone gives a
coarse position and the UTC offset; the region gives the country. Read both.

### 3.5 Coarse location, which is the right ask

Session 37's `R2-04-location-strategy.md` established the permission landscape in depth and this
report has no reason to revisit it. What it adds is the prayer-time figure for each level, from 3.1:
**coarse location at any of its documented accuracies produces an identical answer to fine GPS.**

Three facts carried forward, all cited from the platform vendors and confirmed in this session:

- **Android's own page states the approximate figure**: an estimate "accurate to within about 3
  square kilometers", against precise at "usually within about 50 meters" (cited,
  `developer.android.com/develop/sensors-and-location/location/permissions`, fetched 2026-09-30).
- **"If the user grants the approximate location permission, your app only has access to
  approximate location, regardless of which location permissions your app declares."** Same page,
  cited. So coarse-graceful behaviour is mandatory whatever the app requests.
- **Apple's own page states the reduced figure**: "The approximate location preserves the user's
  country or region, typically preserves the city, and is usually within 1-20 kilometers of the
  actual location" (cited, `developer.apple.com/documentation/corelocation/kcllocationaccuracyreduced`,
  fetched 2026-09-30).

Apple's own sentence answers this report's question directly. **"Typically preserves the city" is
exactly the accuracy class section 2.5 requires**, and "within 1-20 kilometers" straddles the 10 km
design figure, producing at most 2 minutes of error at London and 3 at Oslo.

**What the app actually ships today is FINE and COARSE, and this report reopens a question the owner
already closed once.** Session 37's `ANDROID-PERMISSIONS.md` measured, from the installed
`expo-location@58.0.8` source, that the module adds **both** `ACCESS_COARSE_LOCATION` and
`ACCESS_FINE_LOCATION` in its own `AndroidManifest.xml`, hardcodes the pair in
`LocationModule.kt:176-186`, and that its config plugin takes no option to drop either. **Coarse-only
is not reachable by configuration; it needs a fourth local config plugin with a
`tools:node="remove"` directive.** The owner then ruled on 2026-09-29, quoted in that file:

> "I want to keep my config very simple... course versus fine, it's not a problem. We just want the
> simplest approach. If we get fine as a bonus, even better... So I think what I'm saying is, yes,
> please go ahead with the default."

**So the coarse-only plugin was CANCELLED and the app ships the default pair.** This report does not
reopen that, and the reason it does not is that the ruling rested on a measurement rather than a
preference: session 37 established that fine location costs the user **no extra steps**, because the
Precise and Approximate choice on API 31+ is a toggle inside the same single dialog.

**What this report adds is one fact the ruling did not have, and it is a cost that arrives later.**
Row 37 also recorded Play's Minimum Scope policy (cited,
`support.google.com/googleplay/android-developer/answer/17033915`): **from November 2026 every app
requesting `ACCESS_FINE_LOCATION` must complete a Play Console declaration explaining why
`ACCESS_COARSE_LOCATION` is not sufficient, enforced 27 January 2027 for new and existing apps**, and
a coarse-only app is exempt. Section 3.1 measures that **for prayer times that declaration cannot be
written honestly: fine GPS and a 3 km coarse grid produce identical displayed times at every latitude
sampled.** Qibla was already in the same position at 10 km.

**This is recorded as a cost with a deadline, not as a recommendation to overturn an owner ruling.**
The decision is the owner's and it was taken with the relevant measurement in hand. What changes is
that after 27 January 2027 the default pair costs a Console declaration whose honest answer is "it is
not necessary", against a one-line manifest directive in a plugin file pattern the repo already runs
(`plugins/androidWidgetGrid.js`). **Worth putting back to the owner before v2.0 ships, on that
timing, and not before.**

**One small finding that would otherwise be discovered late.** The app's single iOS permission
string, measured at `app.json:25`, reads:

> "Your location is used to point the compass toward the Kaaba. It never leaves your device."

**That string names the compass and nothing else.** iOS shows one
`NSLocationWhenInUseUsageDescription` per app, so if prayer times begin using the same permission,
the user is asked for location to find the qibla and the app then uses it to pick a prayer source.
**The second half of that sentence stays true and the first half becomes incomplete.** The string
has to be rewritten before the second use ships, and it is a one-line change that is cheap now and
embarrassing later.

### 3.6 Fine GPS, which buys this app nothing

Measured in 3.1: at every latitude sampled, fine GPS and a 3 km coarse grid produce the same
displayed times. **Fine location buys zero accuracy for prayer times.** The app should continue to
ask for `Accuracy.Balanced` as `device/qibla.ts:64` already does, and should behave correctly when
the user grants Approximate alone, which Google's own page requires regardless: "If the user grants
the approximate location permission, your app only has access to approximate location, regardless of
which location permissions your app declares."

### 3.7 A manual city picker, costed

Measured with `part2-citylist.mjs` against GeoNames `cities15000`, 34,152 places, CC BY 4.0.

**The byte cost of the full list**, trimmed to name, country, latitude and longitude:

| Encoding | Raw bytes | gzip | brotli | brotli B per city |
| --- | ---: | ---: | ---: | ---: |
| JSON array of tuples | 1,145,114 | 418,591 | 348,671 | 10.2 |
| TSV, 3 dp | 949,936 | 411,140 | 341,276 | 10.0 |
| TSV, 2 dp | 881,640 | 362,813 | **302,545** | 8.9 |
| binary, int16 at 0.01 deg | **559,822** | 361,875 | 312,897 | 9.2 |

The binary encoding stores latitude and longitude as `int16` at 0.01 degree, which is 1.1 km of
latitude resolution, comfortably inside the 10 km tolerance from 2.5.

**How many cities are actually needed, which is the question the brief asked.** Since section 2.5
establishes a radius, a city list is a covering of the inhabited world by discs of that radius. A
greedy set cover, taking the city whose R-km disc holds the most uncovered population, until every
one of the 34,152 places is covered:

| R km | Cities for 100% coverage | for 50% of population | for 80% | for 90% | for 95% | brotli cost of the full cover |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 10 | 22,136 | 648 | 4,156 | 8,605 | 13,091 | 198 KB |
| 25 | 13,473 | 379 | 2,100 | 4,280 | 6,743 | 122 KB |
| 50 | 7,198 | 230 | 1,098 | 2,029 | 3,090 | 64 KB |
| **100** | **3,211** | **124** | **487** | **847** | 1,230 | **30 KB** |
| 200 | 1,292 | 58 | 195 | 318 | 450 | 13 KB |

**At the 10 km tolerance section 2.5 establishes, 22,136 cities are needed for complete coverage,
and 648 cover half the population.** Read together with 2.6, which shows that a 10 km error never
moves a displayed value by more than one minute, the pragmatic reading is different: **a 1,000-city
list at 10 KB brotli reaches 47.7% of the sampled population, and a 5,000-city list at 53 KB
reaches 71.8%** (`part2-citylist.txt` 2M). For the remainder, the nearest listed city is within 100
km for 3,211 entries at 30 KB.

**So a picker is cheap at any fidelity anyone would want, and it is not the fallback it looks
like.** Session 37 reached the same conclusion for qibla with the same dataset and recommended
`cities15000` trimmed to about 1 MB. This report's binary encoding is three times smaller for the
same content, so the two sessions can share one asset.

### 3.8 A zone picker, which R8 argued is required anyway

`R8` section 3.5 established that JAKIM publishes 60 named zones rather than coordinates, that
Brunei decrees per-district offsets in writing, and that the app "has never had coordinates" so it
can adopt the right abstraction first time. Nothing in this report contradicts that and section 4
strengthens it considerably.

**Brunei's offsets are confirmed in a second independent place.** `R8` cited the ministry's own
page. This session found the same numbers restated publicly: "The prayer times for Brunei-Muara and
Temburong districts. For Tutong add 1 minute and for Belait add 3 minutes" (cited, a public Brunei
prayer-times account, fetched 2026-09-30). **A 1-minute and a 3-minute decreed offset are below the
noise floor of any positioning method in section 3.1**, so they cannot be derived from a coordinate
even in principle. They are a property of the zone, exactly as `R8`'s proposal Z1 has it.

**The cost of a zone picker is trivial and measured**: 60 short strings for Malaysia, 4 districts
for Brunei. The cost of getting the zone WRONG is not (`zonedelta.txt`, measured against JAKIM's own
published September 2026 times through `api.waktusolat.app`):

| Zone pair | Imsak | Fajr | Syuruk | Dhuhr | Asr | Maghrib | Isha | What the pair is |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `SGR01` vs `WLY01` | 0 | 0 | 1 | 0 | 0 | 0 | 0 | Selangor against Kuala Lumpur, adjacent |
| `SGR01` vs `SGR03` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | Shah Alam against Klang, 30 km |
| `PRK01` vs `PRK02` | 2 | 2 | 1 | 2 | 3 | 2 | 2 | Tanjung Malim against Ipoh |
| `PHG02` vs `PHG06` | 6 | 6 | 1 | 6 | **9** | **12** | 7 | Kuantan against Cameron Highlands |
| `SBH01` vs `SBH07` | 8 | 8 | 8 | 8 | 8 | 8 | 8 | Sandakan against Kota Kinabalu |
| `SWK01` vs `SWK08` | 23 | 23 | 22 | 21 | **26** | 21 | 21 | Limbang against Kuching |
| `WLY01` vs `WLY02` | 56 | 56 | 56 | 55 | **59** | 56 | 56 | Kuala Lumpur against Labuan, same code family, 1,500 km apart |

Worst single-field gap over the whole 32-zone sample: **81 minutes, `SBH01` against `PLS01` on
Imsak**. So the zone picker is not decoration: an adjacent-zone mistake costs 0 to 3 minutes, and a
wrong-state mistake costs an hour.

### 3.9 `@photostructure/tz-lookup`, re-verified at 2,000 times R4's scale

`R4` verified the package on 16 hand-picked coordinates. Since the whole timezone layer rests on it,
this report tested it against all 34,152 GeoNames places, each of which carries its own IANA zone,
making it a two-source check. Script: `part2-tzlookup.mjs`. Version 11.7.0 and licence CC0-1.0 both
read from the installed `package.json`.

| Outcome | Places | Share |
| --- | ---: | ---: |
| identical zone name | 33,581 | **98.33%** |
| different zone name | 571 | 1.67% |
| the library threw | 0 | 0.00% |

**The 1.67% is mostly harmless and the report can say precisely how much.** A different zone NAME
with the same UTC offset all year costs a prayer time nothing, because the only thing the app reads
from a zone is the offset.

| Class | Places | Population |
| --- | ---: | ---: |
| different name, identical offset at both probes | 367 | 20,472,425 |
| **different offset, a real error** | **204** | **10,029,623** |
| offset unreadable | 0 | 0 |

**204 places holding 0.246% of the sampled world population would get a wrong UTC offset**, and
every single one is a land border or an enclave. The largest are Dandong CN on the North Korean
border (`Asia/Shanghai` against `Asia/Pyongyang`, 60 min), Jayapura ID (`Asia/Jayapura` against
`Pacific/Port_Moresby`, 60 min), Bole CN (`Asia/Shanghai` against `Asia/Urumqi`, **120 min**),
Pasir Mas MY on the Thai border (60 min) and Nyingchi CN (`Asia/Shanghai` against `Asia/Kolkata`,
**150 min**).

**A design note the measurement produces for free.** The Bole and Nyingchi rows are the same case
`R4` praised: tz-lookup returns the geographically correct zone for western China rather than the
legally correct `Asia/Shanghai`. For qibla that is the better answer. **For prayer times it is the
wrong one, because a Chinese user's phone clock runs on Beijing time whatever their longitude.**
This is a genuine conflict between the two features and it is worth stating: **when the device's own
zone is available, prefer it over the coordinate lookup, because the app must agree with the clock
the user reads.** The coordinate lookup's role is to supply a zone for a city the user PICKED, where
no device zone applies.

The measured bundle cost, read from the installed tree:

| File | Bytes |
| --- | ---: |
| `tz.js` | 73,381 |
| `LICENSE` | 6,554 |
| `README.md` | 6,445 |
| `package.json` | 1,424 |
| `index.d.ts` | 225 |
| **total on disk** | **88,029** |

Confirming `R4`'s figure exactly.

---

## 4. Part 3: the coordinate-to-source problem

### 4.1 Country to authority, and the case where one country needs a user choice

For most countries this is a lookup keyed on the region code, resolved in 3.4. `R9` measured the
exception and it is instructive.

**France has no national authority and two bodies publishing different angles for the same city.**
`R9` measured 52 mosques across Paris, Marseille, Lyon, Lille, Toulouse and Strasbourg:
**48.1% print a Fajr at or near 12 degrees** (the Musulmans de France position), **11.5% near 18**
(the Grande Mosquée de Paris position), 28.8% between 13 and 15, and the whole-sample Fajr median is
**14.25**. `R9` also measured that the clustering is by city rather than national: Marseille and
Lille are almost uniformly 12 to 13, Lyon sits at 14.25, and Strasbourg splits between a 12-degree
group and a 17.9-degree group carrying the Diyanet temkin signature.

**So a country key is not always a function to one authority, and the app's data model must allow a
country to offer a CHOICE.** This is not a French peculiarity: `R5` measured that Iraq requires two
different Maghrib rules for its two communities, and `R1` measured Azerbaijan as a Shia
Maghrib paired with a Hanafi Asr that no library expresses.

The design answer follows from `R8`'s proposal Z1 without extension: **a country maps to a LIST of
sources, ordered, with the first as the default and the list visible.** Where the list has one
entry the UI never appears. Where it has two, as in France, the user picks once. **Nothing in this
needs a position beyond the country.**

### 4.2 Coordinate to ZONE: R8's UNVERIFIED flag can be lifted for Malaysia

`R8` section 3.5 flagged this and was right to: "zone selection from GPS is UNVERIFIED and should
be assumed to need a user-facing picker at first". This report closes it, with three results.

**First, a coordinate-to-zone service exists and works.** `api.waktusolat.app` exposes
`GET /zones/{lat}/{lon}` and its own documentation advertises "zone detection based on coordinates"
(cited, `api.waktusolat.app/docs`, fetched 2026-09-30). Probed on a 1,605-point grid at 0.25-degree
resolution over two bounding boxes covering peninsular Malaysia and Malaysian Borneo including
surrounding sea (`part3-gps.mjs`):

| Outcome | Points | Share |
| --- | ---: | ---: |
| a zone was returned | **425** | 26.5% |
| `No zone found for the given coordinates.`, HTTP 500 | 1,180 | 73.5% |
| transport failure | 0 | 0.0% |

The no-zone points are open sea inside the bounding boxes, which is correct behaviour. **What it
establishes is that the service refuses rather than guesses**, so a user just offshore gets nothing.
The service is a network dependency and therefore unusable under row 41's constraint, but it is an
excellent ORACLE for building something that is not.

**Second, 10 of JAKIM's 60 zones were never returned by any coordinate on the grid**: `JHR01`,
`KDH05`, `KDH07`, `PHG01`, `PHG05`, `PHG07`, `PRK07`, `SBH06`, `SWK09` and `WLY01`. Some are too
small for a 28 km grid (`WLY01` is Kuala Lumpur, and a direct probe at its coordinates does return
it). But several are the special zones `R1` identified: `KDH07` Puncak Gunung Jerai, `PRK07` Bukit
Larut, `SBH06` Gunung Kinabalu and `PHG05` Genting Sempah are **mountain peaks and named localities
rather than areas**, and `SWK09` is `Zon Khas (Kampung Patarikan)`, one village. **No coordinate
lookup can ever reach a zone that is a single point, so a picker is required regardless of how good
the geocoding gets.**

**Third, and this is the finding: the mapping reproduces OFFLINE at 96.5%.** The service returns a
`district` name alongside the zone, which reveals its construction: point-in-district-polygon plus a
district-to-zone table. That is shippable. Tested against the 425-point oracle using point-in-polygon
over geoBoundaries gbOpen MYS ADM2, 159 district polygons (`part3-offline-zone.mjs`):

| Stage | Result |
| --- | --- |
| district names the service returns that the polygon set carries | **132 of 143, 92.3%** |
| districts the service mapped to more than one zone | **0**, so the relation is a function |
| naive name match reproduces the service | 398 of 425, **93.6%** |
| **with a seven-entry alias table** | **410 of 425, 96.5%** |

The alias table is short and obvious: `Kulaijaya` against `Kulai`, `Ledang` against `Tangkak`,
`Ulu Langat` against `Hulu Langat`, `Ulu Selangor` against `Hulu Selangor`, and three more.

**The 3.5% residue is structural and should be stated as a limit rather than a bug:**

| Points | Reason |
| ---: | --- |
| 8 | **one ADM2 polygon, `Hulu Perak`, spans JAKIM's `PRK03` and `PRK04`.** No district lookup can split it |
| 1 | `Labuan` likewise spans `WLY02` and its surroundings |
| 6 | genuine polygon disagreement at three Borneo boundaries: `Selangau`, `Belaga`, `Keningau`, `Kinabatangan` |

`zonedelta.txt` prices the residue: `PRK03` against `PRK04` is not in the measured pair set, but
comparable adjacent Perak pairs run 1 to 3 minutes. **So the 3.5% of coordinates the offline lookup
gets wrong cost a few minutes, not an hour**, because the confusable zones are adjacent by
construction.

### 4.3 The same question for the other five countries R8 flagged

Measured from geoBoundaries gbOpen ADM2, downloaded 2026-09-30, with the licence read from each
country's own metadata file (`part3-offline-zone.txt` 3E-5):

| Country | Polygons | Level called | Vertices | Raw GeoJSON | brotli at 3 dp | Licence in its own metadata |
| --- | ---: | --- | ---: | ---: | ---: | --- |
| **Malaysia** | 159 | Districts | 25,751 | 1,134 KB | **63 KB** | CC BY 3.0 |
| Indonesia | 519 | regency, city | 260,746 | 10,745 KB | **592 KB** | CC BY 3.0 IGO |
| **Brunei** | 38 | Mukim | 1,168 | 58 KB | **3 KB** | Public Domain |
| **Sri Lanka** | 25 | (unnamed) | 9,073 | 236 KB | **21 KB** | ODbL 1.0 |
| Bangladesh | 64 | district | 38,112 | 1,647 KB | **84 KB** | CC BY 3.0 IGO |
| Turkey | 973 | Districts | 132,258 | 3,778 KB | **317 KB** | ODbL 1.0 |

**Every one of the six has a machine-readable polygon set at the right administrative level, and
five of the six cost under 100 KB brotli.** That is the answer to the brief's question, and it is
more positive than `R8` expected.

**What each country still needs, and the honest state of each:**

| Country | Zone structure | Polygon level available | Is the zone-to-district table published? |
| --- | --- | --- | --- |
| **Malaysia** | 60 JAKIM zones as district lists | 159 districts, 63 KB | **Yes**, JAKIM's own `Tukar Zon` selector prints the district list per zone (read 2026-09-30, transcribed into `part3-zones.mjs`) |
| **Brunei** | 4 districts, decreed offsets | 38 mukim, 3 KB | **Yes**, the ministry's own page per `R8`, restated publicly as Tutong +1 and Belait +3 (cited) |
| **Sri Lanka** | ACJU publishes **13 district GROUPS** | 25 districts, 21 KB | **Yes, on ACJU's own page** (cited, `acju.lk/prayer-times/`, fetched 2026-09-30). Its headings read `COLOMBO DISTRICT, GAMPAHA DISTRICT, KALUTARA DISTRICT`, `KANDY DISTRICT, MATALE DISTRICT, NUWARA ELIYA DISTRICT`, and so on, with one anomaly: `MULLAITIVU DISTRICT (EXCEPT NALLUR)` and a separate `JAFFNA DISTRICT, NALLUR`, so **one sub-district is carved out by name** and cannot come from a district polygon |
| **Indonesia** | Kemenag publishes per kabupaten/kota | 519 regencies, 592 KB | **Partially. UNVERIFIED for Kemenag itself.** `equran.id` documents 517 kabupaten/kota "Sumber data: Bimas Islam Kementerian Agama RI" (cited, `equran.id/apidev/shalat`, fetched 2026-09-30), which matches the polygon count to within two. `R4` finding 5 already flagged that no Kemenag page endorses a third-party mirror |
| **Bangladesh** | district offsets from Dhaka | 64 districts, 84 KB | **UNVERIFIED.** No Islamic Foundation page carrying a district offset table was located in this session |
| **Turkey** | Diyanet publishes per district | 973 districts, 317 KB | **UNVERIFIED at the ID level.** Diyanet's own site is per-district by `ilce` id, and R1 separately measured 32 days from the id-based feed (`ezanvakti.emushaf.net/vakitler?ilce=9206`), so the shape is proven. **The `diyanet_times_9541.meta.json` capture this row originally cited is a ZERO-BYTE failed fetch and proves nothing; it is kept only as the record of the failure.** No district-id-to-name-to-polygon mapping was assembled here |

**The honest overall answer, as the brief anticipated: for Malaysia, Brunei and Sri Lanka the
zone-to-district table is published and the polygons exist, so coordinate-to-zone is buildable
offline. For Indonesia, Bangladesh and Turkey the polygons exist and the table does not, so a picker
is the only defensible route today.** And in every one of the six, a picker is needed anyway for the
point-zones section 4.2 found and for users who refuse location.

**Cost of the picker, restated so it is comparable:** 60 strings for Malaysia, 4 for Brunei, 13 for
Sri Lanka, 517 for Indonesia, 64 for Bangladesh. At an average 20 bytes that is under 15 KB for all
five, against 1,080 KB of polygons. **The picker is 70 times cheaper than the geocoding and works in
every case the geocoding does not.** That is the recommendation.

### 4.4 A user in a country with no authority, which R5 measured as 29.9% of the world's Muslims

`R5` measured that **597,378,244 Muslims, 29.9% of the world's, live in a country where nothing
about the convention could be sourced**, including India, Pakistan, Nigeria, Iraq, Sudan,
Afghanistan, Ethiopia, Uzbekistan, China, Niger, Mali, Tanzania, Senegal and Syria.

For positioning, this population is the EASIEST case, and it is worth saying why. Where an authority
publishes a zone list, the app must place the user inside the authority's own administrative
geometry, which is sections 4.2 and 4.3's difficult problem. **Where no authority publishes
anything, the app is computing with `adhan` at a coordinate, and section 2.5 says a coordinate to 10
km suffices.** So for 29.9% of the world's Muslims:

- **The zone-to-district problem does not exist**, because there are no zones.
- **A coarse fix, or a city from the picker, is a complete answer.**
- `RECOMMENDATION.md`'s kind-3 source, "`adhan` plus a published parameter set, labelled as a
  computation", is the only option and it needs nothing from this report beyond a position.

`R5` also measured the harder half: several of these countries have no authority because of their
internal structure, not because of a gap in the searching. Iraq has two state endowment diwans plus
Sistani's office; Lebanon has Dar al-Fatwa and the Higher Islamic Shia Council; Senegal's effective
authorities are the Sufi turuq at Tivaouane and Touba. **For those the app's problem is not
positioning, it is that "which authority serves this coordinate" has no answer even with perfect
coordinates**, and section 4.1's country-to-list design is what carries it.

---

## 5. Part 4: the travel problem

Row 37 got this wrong once and the owner corrected it: "some people are travellers... we still need
a compass even when we are in a different country." That correction applies here with more force,
because prayer times drive alarms.

### 5.1 How far is "enough movement to matter"?

From section 2.5, and the answer is one number rather than six because 2.5 showed the six prayers
agree within 2 km:

| Latitude band | Move before any prayer changes by 1 displayed minute | by 2 minutes |
| --- | ---: | ---: |
| equatorial, under 10 degrees | 25 km | 50 km |
| tropical, 20 to 35 | 20 km | 41 km |
| temperate, 40 to 45 | 17 km | 34 km |
| high, 50 to 55 | 13 km | 25 km |
| very high, 60 and above | 8 km | 16 km |

**A movement trigger should use 10 km, and above 55 degrees latitude it should tighten to 8.**
`part1b.txt` justifies a second, looser threshold from the other side: below Oslo's latitude a move
under 10 km never changes any displayed value by more than one minute, so **a re-arm below 10 km is
cosmetic and above 50 km is urgent.**

### 5.2 A timezone change as a travel signal: reliable when it fires, and it often does not

A timezone change costs nothing and needs no permission. Session 37's own table listed it as a
"free invalidation signal" (`R2-04-location-strategy.md:114`). This report measures how good it
actually is, and the answer is: good as a positive signal, useless as a complete one.

**What it MISSES, measured** (`part4-travel.mjs` 4B). For every IANA zone with three or more
cities, the two cities inside it whose prayer times differ most. A user making exactly that journey
gets no timezone event and no other permission-free signal at all.

| Statistic | Zones |
| --- | --- |
| zones with 3 or more cities | 277 |
| worst intra-zone gap over 5 min | **244, 88%** |
| worst intra-zone gap over 15 min | **200, 72%** |
| worst intra-zone gap over 30 min | **126, 45%** |

The worst cases include journeys people actually make:

| Zone | City A | City B | km | Worst min |
| --- | --- | --- | ---: | ---: |
| `Europe/Moscow` | Makhachkala | Murmansk | 3,008 | **274** |
| `Europe/Oslo` | Tromsø | Time | 1,366 | 232 |
| `Asia/Shanghai` | Harbin | Kunming | 3,139 | 156 |
| `Asia/Jakarta` | Situbondo | Banda Aceh | 2,542 | 100 |
| `America/New_York` | Boston | St. Petersburg FL | 1,932 | 88 |
| `Asia/Tehran` | Orūmīyeh | Zahedan | 1,712 | 85 |
| `Asia/Kolkata` | Kolkata | Srinagar | 1,841 | 84 |
| `Africa/Khartoum` | Port Sudan | Al-Junaynah | 1,716 | 75 |

**And the domestic journeys this app's own users make** (`part4-travel.txt` 4A), holding the origin
position after arrival:

| Journey | km | IANA zone | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha | Worst |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Makkah to Mina | 7 | **same** | 1 | 1 | 1 | 1 | 0 | 1 | **1** |
| Jeddah to Makkah | 66 | **same** | 3 | 3 | 3 | 3 | 3 | 3 | **3** |
| Makkah to Madinah | 346 | **same** | 9 | 7 | 2 | 9 | 8 | 11 | **11** |
| **London to Manchester** | 262 | **same** | 12 | 19 | 9 | 12 | 20 | 17 | **20** |
| **London to Bradford** | 277 | **same** | 10 | 18 | 7 | 11 | 20 | 16 | **20** |
| **London to Glasgow** | 555 | **same** | 24 | 41 | 17 | 26 | 44 | 36 | **44** |
| Cairo to Aswan | 682 | **same** | 15 | 19 | 7 | 23 | 21 | 25 | 25 |
| Jakarta to Surabaya | 663 | **same** | 26 | 26 | 24 | 25 | 25 | 26 | 26 |
| Moscow to Kazan | 718 | **same** | 46 | 47 | 46 | 46 | 46 | 46 | 47 |
| Karachi to Lahore | 1,033 | **same** | 45 | 45 | 30 | 42 | 44 | 39 | 45 |
| New York to Miami | 1,758 | **same** | 53 | 65 | 25 | 61 | 63 | 47 | 65 |
| Oslo to Tromso | 1,148 | **same** | 134 | 177 | 33 | 115 | 203 | 156 | **203** |
| London to Paris | 344 | changes | 15 | 23 | 10 | 16 | 24 | 20 | 24 |
| London to Istanbul | 2,501 | changes | 133 | 158 | 117 | 138 | 162 | 149 | 162 |
| **London to Makkah** | 4,794 | changes | 205 | 249 | 160 | 223 | **256** | 239 | **256** |

**London to Bradford is the row to sit with.** `R8` notes it is the largest Muslim diaspora move in
Britain. It is 20 displayed minutes of prayer-time error, it crosses no timezone, and **nothing
permission-free tells the app it happened.** London to Glasgow is 44 minutes under the same
silence.

**The false alarms from the other side** (`part4-travel.txt` 4C). Pairs of cities over 100,000
population in different zones within 100 km of each other, which is what a border crossing or a
coastal commute looks like:

- **2,311 such pairs exist.**
- **778 of them, 34%, differ by 2 displayed minutes or less.**

Examples: Windsor `America/Toronto` and Detroit `America/Detroit`, 4 km apart, 1 minute of prayer
difference. Petrolina `America/Recife` and Juazeiro `America/Bahia`, 1 km apart, **0 minutes**.
Kinshasa and Brazzaville, 8 km, 1 minute. Shenzhen and Hong Kong, 20 km, 1 minute.

**So the timezone-change signal is wrong in both directions.** It stays silent on 88% of zones'
worst internal journeys, and it fires on a third of short international hops where nothing changed.
The design conclusion is not that it is useless but that **its role is narrow: it is a strong hint
that something happened, never a measurement of what, and never a trigger for an automatic
change.**

One thing it IS reliable for, and it is the more important half: **a zone change always invalidates
the WALL CLOCK**, because the UTC offset is the thing that changed by definition. Section 5.4 shows
that is a separate and larger error than the solar one.

### 5.3 The travel design, stated

Session 37 reached the design that dissolves the staleness problem and it transfers with one
change. Its rule was: never cache authoritatively, re-fix on every sheet open, and the cache is a
paint-over that can never mislead because it is never shown without a refresh in flight.

**That works for a compass, which the user opens deliberately, and it does NOT work here, because
prayer times are consumed by a widget, a notification and a lock screen that the user never
opens.** There is no "sheet open" moment to hang a refresh on.

So the design has to be different in kind:

| Moment | What the app does | Why |
| --- | --- | --- |
| **App foreground** | read the device zone from `Intl`, free and instant; compare with the stored source's zone | the one permission-free signal that costs nothing and runs everywhere |
| **Zone differs** | show a **prompt**, never a switch: "Your device is now in `Asia/Riyadh`. Your prayer times are from London Prayer Times. Change source?" | the standing rule that settings are never silently changed, and section 5.2's 34% false-alarm rate |
| **User opens the source setting** | re-fix with `Accuracy.Balanced`, exactly as `device/qibla.ts:64` already does | the deliberate moment, and the only place a permission prompt belongs |
| **User accepts a change** | wipe the cache for the old source, refetch, re-arm every alarm | section 5.4 |
| **No permission, ever** | the region code plus the picker, which is a complete path | sections 3.4 and 3.7 |
| **Never** | background location, significant-location-change, or a periodic fix | session 37 rejected all three and this report finds no prayer-time argument for any of them |

**Why a prompt and not an automatic follow, argued rather than asserted.** The case for automatic is
strong: a traveller who lands in Makkah and gets London's Fajr alarm has been failed badly, and 256
minutes is not a subtlety. The case against is stronger for three measured reasons.

1. **A source is not a position.** Changing it changes which AUTHORITY the user prays by, which
   `FINDINGS.md` section 1 measured as worth up to 87 minutes on Fajr independently of any position.
   A user who chose `london-prayer-times` chose an authority, and a two-week trip does not revoke
   that choice. Some travellers will want to keep it.
2. **The signal is unreliable in both directions**, measured in 5.2. An automatic switch on a zone
   change would fire on 34% of short border hops where nothing changed, and would still miss London
   to Glasgow entirely.
3. **The app already has the right precedent.** `R8` section 6.4 requires that a user-chosen source
   change performs a cache wipe, an alarm re-arm and a delta warning. That is a heavy, visible,
   deliberate operation. Firing it from a zone listener would make it invisible and involuntary.

**What makes the prompt honest rather than a fudge is that it names the delta.** The app knows both
sources' times for today, so it can say "your Maghrib would move by 4 hours 16 minutes", which turns
an abstract setting into a concrete consequence. `R8` section 5.3 already drafts this kind of
wording for a different case.

### 5.4 What happens to the armed alarms, which is the sharpest consequence

Measured in this worktree: `NOTIFICATION_REQUEST_BUDGET = 64` (`shared/constants.ts:75`) and
`SCHEDULE_CANDIDATE_DAYS = NOTIFICATION_REQUEST_BUDGET + 2 = 66` (`:88`). So the OS may be holding
alarms for instants up to two months away.

**An OS notification request holds an absolute instant, so a move produces two independent errors**
(`part4-alarms.mjs`):

| Error | Cause | Fixed by |
| --- | --- | --- |
| solar | the sun reaches the same altitude at a different instant at the new position | a re-arm with the new position |
| zone | the same instant renders as a different wall clock | a re-arm with the new zone |

Measured on 15 June 2026:

| Journey | Worst solar min | Zone min | Worst total |
| --- | ---: | ---: | ---: |
| Jeddah to Makkah | 3 | 0 | **3** |
| London to Manchester | 20 | 0 | **20** |
| London to Istanbul | 162 | +120 | 282 |
| London to Jeddah | 253 | +120 | 373 |
| **London to Makkah** | **256** | **+120** | **376** |
| Dhaka to Makkah | 210 | -180 | 390 |
| Kuala Lumpur to Makkah | 290 | -300 | **590** |
| London to Toronto | 352 | -300 | **652** |

**An alarm armed in London and left armed in Makkah does not fire late. It fires at a time that is
not any prayer**, and the largest measured case, London to Toronto, is nearly eleven hours out.

**How many armed requests a move invalidates, and the answer is counter-intuitive.** The app arms
rows whole and the budget is fixed, so reach and density trade off:

| User configuration | Requests per day | Days the budget reaches | Requests invalidated by a move |
| --- | ---: | ---: | ---: |
| **1 row, at-time only** | 1 | **64** | **64** |
| 3 rows, at-time only | 3 | 21 | 63 |
| 6 rows, at-time only | 6 | 10 | 60 |
| 6 rows, each with one reminder | 12 | 5 | 60 |
| 21 rows, each with both reminders | 63 | 1 | 63 |

**The lightest user is the most exposed.** One row armed at-time only reaches 64 days ahead, so 64
alarms are wrong the moment they land. The heaviest user is paradoxically the safest, because 63
requests buy only one day of reach and tomorrow's re-arm fixes everything.

**The machinery to fix this already exists and is already correct.** `replacePrayerCache`
(`stores/sync.ts:338-389`) reads the armed days before the wipe (`:345`), wipes by whitelist
(`:358-372`), carries yesterday across (`:349-374`), and `saveDownloadedDays` (`:126-133`) reopens
the notification gate when an armed day changed. `R8` section 1.4 identified the one thing that
becomes wrong, and this report confirms it from the source: the whitelist comment at `:365-368`
says alarm records are kept because "a new timetable does not change what the OS has armed", which
**is true for a new timetable of the same source and false for a different source**. A source change
must sweep `scheduled_notifications_` and `scheduled_reminders_` too, and cancel the OS requests they
describe.

**One thing this report can add that R8 could not.** The re-arm is not optional and it is not
deferrable. `SCHEDULE_CANDIDATE_DAYS` of 66 means the stale window is up to two months, and there is
no natural event inside it that would fix itself. **So a source change must cancel and re-arm
synchronously, in the same operation as the cache wipe, and the 64-request budget makes that a
bounded piece of work: at most 64 cancellations and 64 arms.**

---

## 6. Part 5: elevation, closed out

### 6.1 The physics, confirmed through the shipping solver

A raised observer sees a depressed horizon, so sunrise comes earlier and sunset later. The dip is
`acos(R / (R + h))` with `R = 6,371,000` m. Measured (`part5-elevation.mjs`), dip in degrees: 50 m
0.2270, 100 m 0.3210, 500 m 0.7178, 1,000 m 1.0151, 2,000 m 1.4355, 2,500 m 1.6048.

Minutes that Maghrib is later at elevation `h`, recomputing the hour angle at
`-(0.833 + dip)` instead of `-0.833`:

| Place and date | 100 m | 200 m | 500 m | 1,000 m | 2,000 m | 2,500 m |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| equator, equinox | 1.28 | 1.82 | 2.87 | 4.06 | 5.74 | 6.42 |
| Cameron Highlands 4.5, equinox | 1.29 | 1.82 | 2.88 | 4.07 | 5.76 | 6.44 |
| Makkah 21.4, equinox | 1.38 | 1.95 | 3.08 | 4.36 | 6.17 | 6.90 |
| Makkah 21.4, June | 1.53 | 2.17 | 3.43 | 4.85 | 6.86 | 7.67 |
| **London 51.5, equinox** | **2.06** | 2.92 | 4.61 | 6.53 | 9.23 | 10.32 |
| London 51.5, June | 2.75 | 3.89 | 6.18 | 8.77 | 12.48 | 13.98 |
| **Oslo 59.9, June** | **4.51** | 6.41 | 10.25 | 14.68 | 21.16 | 23.85 |

**This reproduces `R4` section 6.4 exactly**, to two decimal places at every cell the two share,
which is a useful independent check on both. Sunrise moves by the same amount in the opposite
direction, so the day lengthens by twice these figures.

### 6.2 How high the world actually lives

Measured from GeoNames `cities15000`, which carries a `dem` value (the SRTM or GTOPO30 elevation)
for **34,152 of 34,152 places**, against only 4,496 with a populated `elevation` field.

| Statistic | Value |
| --- | ---: |
| median city `dem` | 128 m |
| 75th percentile | 378 m |
| 90th percentile | 937 m |
| 99th percentile | 2,279 m |
| highest | 5,022 m |
| population at or above 200 m | **35.5%** |
| population at or above 500 m | **19.6%** |
| population at or above 1,000 m | **10.2%** |
| population at or above 2,000 m | 2.2% |

**A fifth of the sampled world population lives at or above 500 m, which is 3 to 6 minutes of
Maghrib depending on latitude and season.** That is larger than JAKIM's whole declared safety margin
of 2 minutes, which `R4` already noted, and larger than Turkey's temkin of 7 to 9 minutes only at
the very top of the range.

The 25 highest cities over 300,000 population in Muslim-majority countries (measured):

| City | cc | Population | dem m | Maghrib later, equinox | in local summer |
| --- | --- | ---: | ---: | ---: | ---: |
| Asmara | ER | 563,930 | 2,334 | 6.43 | 7.09 |
| Sanaa | YE | 1,937,451 | 2,253 | 6.32 | 6.96 |
| Erzurum | TR | 767,848 | 1,914 | **7.32** | **8.71** |
| Kabul | AF | 4,434,550 | 1,798 | 6.61 | 7.64 |
| Hamadān | IR | 528,256 | 1,820 | 6.67 | 7.72 |
| Quetta | PK | 1,565,546 | 1,683 | 6.09 | 6.93 |
| Ta'if | SA | 688,693 | 1,672 | 5.63 | 6.26 |
| Isfahan | IR | 1,547,164 | 1,578 | 6.06 | 6.95 |
| Tabriz | IR | 1,424,641 | 1,396 | 6.10 | 7.16 |
| Shiraz | IR | 1,249,942 | 1,545 | 5.81 | 6.59 |

**Kabul at 4.4 million people is 6.6 to 7.6 minutes of Maghrib.** `R5` measured Afghanistan as NULL,
meaning its prayer times would come from `RECOMMENDATION.md`'s kind-3 computed source, so **there is
no authority table to hide the error behind.** Ignoring elevation there is a straightforward 7-minute
mistake in the app's own arithmetic.

### 6.3 The decisive test: does the authority already apply it?

`R1` warned that an app applying an elevation correction will DIFFER from the authority's published
table, because the authority's table does not apply one. **That warning is refuted for JAKIM,
measured on JAKIM's own published year.**

**The method, and it is designed so the answer does not depend on guessing the ground height.** A
horizon dip is ANTISYMMETRIC: it moves sunset later by X and sunrise earlier by X. A safety margin
is SYMMETRIC: it moves both later. So from the two residuals against a sea-level computation:

```
dip component    = (maghribResidual - syurukResidual) / 2
margin component = (maghribResidual + syurukResidual) / 2
```

The dip component is immune to any symmetric margin and, because it is a difference, to any
longitude error in the reference coordinate. Script: `part5-jakim.mjs` and `part5-jakim-robust.mjs`.
JAKIM times from `e-solat.gov.my` `esolatApi/takwimsolat` with `period=year`, fetched 2026-09-30.
Computed times from `adhan@4.4.6` MWL with `Rounding.None` at the named coordinate treated as sea
level.

**JAKIM's four high-ground zones against six low ones, whole published year:**

| Zone | Place | Assumed elev m | Dip component min | Symmetric margin min | Elevation the dip implies |
| --- | --- | ---: | ---: | ---: | ---: |
| **`PHG06`** | Cameron Highlands | 1,440 | **6.31** | -0.08 | 2,401 m |
| **`PRK07`** | Bukit Larut | 1,250 | **5.74** | -0.01 | 1,984 m |
| **`SBH06`** | Gunung Kinabalu | 1,563 | **8.33** | 0.10 | 4,164 m |
| **`KDH07`** | Gunung Jerai | 1,180 | **4.97** | -0.29 | 1,483 m |
| `PHG04` | Raub | 105 | 0.49 | 0.53 | 14 m |
| `PRK06` | Taiping | 43 | 1.69 | 0.31 | 172 m |
| `SBH07` | Ranau | 480 | 0.50 | 3.08 | 15 m |
| `KDH02` | Sungai Petani | 20 | 1.54 | 0.02 | 142 m |
| `WLY01` | Kuala Lumpur | 56 | 1.36 | 0.55 | 112 m |

**The high zones carry 5 to 8 minutes of dip and the low zones carry 0.5 to 1.7. That is the
signature of an elevation correction, and JAKIM is applying one.**

**Two checks that it is not an artefact of my reference coordinates**, which is the obvious
objection since a latitude error also moves sunset and sunrise antisymmetrically:

**Seasonal stability.** A latitude error's effect REVERSES sign between June and December. A dip's
does not, and grows only mildly with declination. Measured per month over the whole published year:

| Zone | Jan | Feb | Apr | Jun | Jul | Sep | Nov | Range |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `PHG06` | 6.35 | 6.11 | 6.14 | 6.59 | 6.51 | 6.11 | 6.38 | **0.49** |
| `PRK07` | 5.85 | 5.70 | 5.54 | 5.93 | 5.88 | 5.50 | 5.74 | **0.44** |
| `SBH06` | 8.30 | 8.12 | 8.18 | 8.73 | 8.67 | 8.09 | 8.22 | **0.64** |
| `KDH07` | 4.72 | 5.05 | 4.72 | 5.23 | 5.19 | 4.92 | 4.95 | **0.51** |
| `WLY01` | 1.06 | 1.00 | 1.54 | 1.73 | 1.73 | 1.41 | 1.03 | 0.73 |

**No sign reversal anywhere, and a range under 0.7 minutes across the whole year.** A latitude error
of the size needed to fake 6 minutes at Cameron Highlands would swing by several minutes between
solstices.

**Coordinate sensitivity.** Perturbing the reference coordinate by 50 km in each direction moves the
measured dip component by at most **0.05 minutes**:

| Zone | as sited | +50 km E | -50 km E | +50 km N | -50 km N |
| --- | ---: | ---: | ---: | ---: | ---: |
| `PHG06` | 6.31 | 6.32 | 6.31 | 6.29 | 6.34 |
| `SBH06` | 8.33 | 8.33 | 8.33 | 8.30 | 8.36 |
| `WLY01` | 1.36 | 1.36 | 1.36 | 1.33 | 1.38 |

**Separating the ihtiyati from the elevation.** `R6` measured JAKIM Kuala Lumpur's per-field offsets
as Sunrise -1 and Maghrib +2, which is itself an antisymmetric pair and therefore contributes
`(2 - (-1)) / 2 = 1.50` minutes of apparent dip at zero elevation. The measured `WLY01` baseline is
**1.36 minutes against R6's predicted 1.50, agreeing to 0.14**, which is an independent
cross-validation of two reports measuring different things. Subtracting the baseline:

| Zone | Place | Dip component | Excess over `WLY01` | **Elevation the excess implies** | **Actual elevation** |
| --- | --- | ---: | ---: | ---: | ---: |
| `PHG06` | Cameron Highlands | 6.31 | 4.96 | **1,482 m** | ~1,440 m |
| `PRK07` | Bukit Larut | 5.74 | 4.38 | **1,155 m** | ~1,250 m |
| `KDH07` | Gunung Jerai | 4.97 | 3.61 | **784 m** | ~1,180 m |
| `SBH06` | Gunung Kinabalu | 8.33 | 6.97 | 2,917 m | ~1,563 m at park HQ |
| `PHG04` | Raub | 0.49 | -0.87 | about 0 | ~105 m |
| `KDH02` | Sungai Petani | 1.54 | 0.19 | about 0 | ~20 m |

**Cameron Highlands implies 1,482 m against an actual 1,440 m, which is a 3% agreement, and Bukit
Larut implies 1,155 m against 1,250 m.** Gunung Kinabalu's 2,917 m exceeds my Kinabalu Park HQ
figure, which is unsurprising: JAKIM's `SBH06` zone is the mountain, whose summit is 4,095 m, and
the reference elevation for a mountain zone is a judgement rather than a fact. **The low zones come
out at about zero, which is the control working.**

**So the recommendation reverses R1's, and the reason is measurement rather than argument.**

| | If the app IGNORES elevation | If the app APPLIES it |
| --- | --- | --- |
| Against JAKIM's high zones | **5 to 8 minutes wrong**, measured | agrees to about 1 minute |
| Against JAKIM's low zones | agrees | agrees, because the dip at 50 m is 0.3 minutes |
| Against an authority that does NOT apply it | agrees | differs by the dip, which is R1's warning |
| For the 29.9% with no authority | 6.6 minutes wrong at Kabul, with no table to hide behind | physically correct |
| Cost | 0 | 2 bytes per place |

**The recommendation: read elevation, from a shipped per-place integer, never from the device.**
Three reasons, in order.

1. **It is the cheapest accuracy improvement available.** One `int16` per place. Measured: all
   34,152 GeoNames places cost **68,304 raw bytes, 40,989 brotli**; 1,000 cities cost 2,000 bytes;
   the 60 JAKIM zones cost 120 bytes. GeoNames already carries a `dem` value for **every one of the
   34,152 places**, so if the app ships the city list from 3.7 it has the elevations already.
2. **It is a property of the SOURCE, not of the device**, which is what makes it safe. `R8`'s
   proposal Z1 makes a source declare its place; the elevation belongs in that declaration next to
   the coordinate. For a published source it is the elevation the authority itself used, which the
   method in 6.3 can measure per zone. For a computed source it is the place's own `dem`. **In
   neither case does the device's altimeter enter, so there is no permission, no drift, no
   staleness, and no barometric calibration problem.**
3. **The failure mode of NOT reading it is silent, and the failure mode of reading it is visible.**
   A wrong Maghrib at Cameron Highlands looks exactly like a right one. Whereas if a future
   authority turns out not to apply a dip, the per-source elevation is a single field to set to
   zero, and the correction table `R6` built would absorb the residual anyway.

**What device elevation would cost, so the rejected option is priced.** `expo-location` returns
`coords.altitude`, so there is no extra permission beyond the coarse fix. But it is
**GPS-derived and noisy, typically worse than horizontal accuracy**; it is null under the coarse and
reduced-accuracy modes section 3.5 recommends; and it is **the wrong quantity**, because what the
correction needs is the elevation the AUTHORITY used, not where the user is standing. A user on the
tenth floor in Kuala Lumpur is 30 m up and JAKIM's `WLY01` is not. **Reading the device altimeter
would make the app disagree with the authority in order to be more physically accurate, which is
exactly the trade the never-invent rule forbids.**

**Offline elevation DATA, costed for completeness.** `R4` measured `srtm-elevation` (ISC, 3,150,360
B) and `geotiff` (MIT, 3,829,334 B), neither of which ships tiles, and SRTM's global 30 m coverage
is hundreds of gigabytes. Confirmed and not worth pursuing: the per-place integer is four orders of
magnitude smaller and answers the question that is actually being asked.

---

## 7. What this means for the app, in one table

Not a plan. The decisions this report's measurements constrain, so a later session does not
re-derive them.

| Decision | What the measurement says | Where |
| --- | --- | --- |
| Does v2.0 need a location permission? | **Yes, or an explicit picker.** Timezone-only is 16 minutes median and 51 at p90 | 3.2 |
| Which accuracy? | **`Accuracy.Balanced`, as the app already asks.** Fine GPS and a 3 km grid give identical output | 3.1, 3.6 |
| Does the Android manifest change? | **Not on this report's evidence alone.** The owner cancelled the coarse-only plugin on 2026-09-29 with the relevant measurement in hand. What is new is that Play's Minimum Scope enforcement lands 27 January 2027, and prayer times cannot justify fine | 3.5 |
| When is it asked? | At the moment the user picks a source. Never at launch | 5.3 |
| Does any existing string change? | **Yes, one.** `app.json:25`'s iOS string names the compass alone, and iOS shows one per app | 3.5 |
| Is refusal a dead end? | **No.** Region plus picker is a complete path, and the picker is needed anyway for point-zones | 3.4, 3.7, 4.2 |
| What identifies the country? | **`regionCode`, not the zone.** Ten shared zones hold 17.4% of the measured Muslim population | 3.4 |
| Coordinate to JAKIM zone? | **Buildable offline at 96.5%, 63 KB.** R8's UNVERIFIED lifts for Malaysia | 4.2 |
| Coordinate to zone elsewhere? | **Malaysia, Brunei, Sri Lanka yes. Indonesia, Bangladesh, Turkey no, so a picker** | 4.3 |
| Does the source follow the user? | **No. Prompt, with the delta named** | 5.3 |
| What triggers the prompt? | A device zone change, read free from `Intl` on foreground | 5.2, 5.3 |
| What does a source change cost? | A cache wipe, a refetch, and up to **64 alarm cancellations and re-arms**, synchronously | 5.4 |
| Which comment becomes wrong? | `stores/sync.ts:365-368`, on the day a second source ships | 5.4 |
| Elevation? | **Read it, from a shipped per-place `int16`. Never from the device** | 6.3 |
| Movement threshold? | **10 km**, one number for all six prayers | 5.1 |

---

## 8. UNVERIFIED and open

1. **Whether Kemenag itself publishes a kabupaten-to-coordinate mapping.** `equran.id` documents 517
   kabupaten/kota and attributes them to Bimas Islam (cited), and geoBoundaries has 519 IDN ADM2
   polygons, but no Kemenag page endorses the mirror. `R4` finding 5 flagged the same gap for the
   times themselves. **The 592 KB polygon cost is measured; the table that would use it is not.**
2. **Whether Bangladesh's Islamic Foundation publishes a district offset table.** Searched and not
   found in this session. `R2` established the authority; this report could not establish the
   geography.
3. **Whether Diyanet's `ilce` ids map to named districts in any published form.** `R4` measured the
   id-based endpoint working. The id-to-name-to-polygon chain was not assembled, so Turkey's 973
   polygons are measured and unusable as yet.
4. **Whether any authority other than JAKIM applies an elevation correction.** The method in 6.3 is
   general and cheap, and it was run on JAKIM alone. **Kemenag is the highest-value next target**,
   because `R1` found it publishes a correction table by metres, which would be a second, independent
   confirmation from an authority that states its intent in writing.
5. **What reference elevation JAKIM used for `SBH06`.** The measured dip implies 2,917 m. Kinabalu
   Park HQ is about 1,563 m and the summit is 4,095 m. The zone is a mountain, so the "correct"
   reference is a judgement JAKIM made and did not publish.
6. **The `PRK03` against `PRK04` delta.** Section 4.2's offline residue is 8 grid points confusing
   these two zones, and `zonedelta.txt` does not contain that pair, so the cost of that specific
   error is inferred from comparable adjacent Perak pairs at 1 to 3 minutes rather than measured.
7. **How stale on-device tzdata actually gets on real hardware.** `R4` section 6.1 flagged this and
   it remains UNVERIFIED. It matters here because 5.2's zone-change signal reads the device's zone,
   and `R4` measured that a year-old database makes every Moroccan prayer time an hour wrong for 103
   consecutive days.
8. **Whether `expo-location` on SDK 58 returns a usable `coords.altitude` under coarse
   permission.** Not measured, because 6.3 recommends against using it either way. If a later
   session wants the device altimeter, this is the first thing to test.
9. **The GeoNames `dem` value's own accuracy.** It is SRTM or GTOPO30 sampled at a point, and a
   city's "elevation" is not a single number. For the 6.3 recommendation this does not matter, since
   the figure the app wants is the authority's reference rather than the ground truth.
10. **Population figures throughout are GeoNames `cities15000` populations**, which cover only
    places over 15,000 and total 4,072,387,709 rather than the world's population. Every share in
    this report is a share of that sample, not of the world, and is labelled that way. It is a
    reasonable proxy for an app's user base and a poor proxy for humanity.
11. **The Muslim-majority country list is a 51-entry ISO-code set assembled here** from standard
    demographic groupings, used only to split results. It is not a prayer-time fact and no
    conclusion rests on its exact membership.
12. **No device was driven for this report.** Every permission behaviour is cited from the platform
    vendor's own documentation or from session 37's reading of the installed `expo-location` source.
    Nothing here was confirmed against a running iPhone or the 3T.

---

## 9. Sources

### 9.1 This repository, read in this worktree on branch `research/global-prayer-times`

| What | Where |
| --- | --- |
| No location permission declared for prayer times | `app.json:36-44`, six Android permissions, none of them location |
| The one location string, whose text names the compass alone | `app.json:25`, `NSLocationWhenInUseUsageDescription` |
| That `expo-location` forces both Android location permissions, and the owner's 2026-09-29 ruling to ship the default | `ai/plans/37-qibla-compass/ANDROID-PERMISSIONS.md` sections 1 and 4a |
| `Accuracy.Balanced` and why | `device/qibla.ts:62-70`, with its own comment on the 10 km figure |
| The notification budget | `shared/constants.ts:75`, `NOTIFICATION_REQUEST_BUDGET = 64` |
| The alarm lookahead | `shared/constants.ts:88`, `SCHEDULE_CANDIDATE_DAYS = 66` |
| The cache wipe model | `stores/sync.ts:338-389`, `replacePrayerCache` |
| The comment that becomes wrong | `stores/sync.ts:365-368`, on keeping alarm records through a wipe |
| The gate reopen | `stores/sync.ts:126-133`, `saveDownloadedDays` |
| `adhan` at 4.4.6, `expo-location` at 58.0.8, no `expo-localization` | `package.json:52` and the dependency block |
| Session 37's qibla figures | `ai/plans/README.md:127` |
| Session 37's location strategy | `ai/plans/37-qibla-compass/agent-reports/R2-04-location-strategy.md` |
| Session 39 on `regionCode` not being a location signal | `ai/plans/39-localisation/LOCALIZATION-API.md:56-60` |
| The no-network, no-key, no-tile rule | `ai/plans/41-qibla-map/BRIEF.md:35`, `ASSUMPTIONS.md:23` |
| Prior reports relied on | `R1` sections on Gulf angles and JAKIM high-ground zones, `R4` section 6, `R5` on the 29.9% and on Iraq and Lebanon, `R6` on JAKIM's per-field offsets, `R7` on the Tromso Asr runaway, `R8` sections 1 and 3, `R9` on France |

### 9.2 Packages, read from the installed tree or the npm registry on 2026-09-30

| Package | Version | Licence | Size | How established |
| --- | --- | --- | --- | --- |
| `adhan` | 4.4.6 | MIT | already a dependency | installed `package.json` |
| `@photostructure/tz-lookup` | 11.7.0 | CC0-1.0 | **88,029 B on disk** | installed `package.json` and a directory walk |
| `expo-localization` | 57.0.2 latest, 58.0.1 for SDK 58 | MIT | 157,144 B unpacked | `npm view`, and `npm pack` for the types |

### 9.3 Datasets

| Dataset | Licence | Size | Fetched |
| --- | --- | --- | --- |
| GeoNames `cities15000` | CC BY 4.0 | 34,152 places, 8,534,357 B | 2026-09-30 |
| IANA `zone1970.tab` | public domain, stated in the file | 312 zones | with the tzdata distribution |
| system tzdata version | 2026c | | `/var/db/timezone/zoneinfo/+VERSION` |
| geoBoundaries gbOpen ADM2 for MYS, IDN, BRN, LKA, BGD, TUR | per country, each read from its own metadata file and tabulated in 4.3 | 1,134 to 10,745 KB raw | 2026-09-30 |

### 9.4 External pages, all fetched 2026-09-30 through `tinyfish` unless noted

| Source | What it establishes |
| --- | --- |
| `developer.android.com/develop/sensors-and-location/location/permissions` | approximate is "accurate to within about 3 square kilometers", precise "usually within about 50 meters", and that an approximate grant caps the app "regardless of which location permissions your app declares" |
| `developer.apple.com/documentation/corelocation/kcllocationaccuracyreduced` | "preserves the user's country or region, typically preserves the city, and is usually within 1-20 kilometers" |
| `support.google.com/googleplay/android-developer/answer/17033915` | the Minimum Scope location policy, via session 37's reading |
| `www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=year&zone=<ZONE>` | JAKIM's own published year per zone, the oracle for the elevation finding. Fetched by `curl` and `fetch` |
| `www.e-solat.gov.my/` `Tukar Zon` selector | the 60 zone codes and their district lists, transcribed verbatim into `part3-zones.mjs` |
| `api.waktusolat.app/docs` | "zone detection based on coordinates" |
| `api.waktusolat.app/zones/{lat}/{lon}` | the 1,605-point coordinate-to-zone oracle. Fetched by `fetch`, cached |
| `api.waktusolat.app/v2/solat/{zone}` | JAKIM September 2026 times for 32 zones, behind `zonedelta.txt` |
| `www.acju.lk/prayer-times/` | Sri Lanka's 13 district groups, with `MULLAITIVU DISTRICT (EXCEPT NALLUR)` naming a sub-district carve-out |
| `equran.id/apidev/shalat` | 517 Indonesian kabupaten/kota, "Sumber data: Bimas Islam Kementerian Agama RI" |
| a public Brunei prayer-times account | "For Tutong add 1 minute and for Belait add 3 minutes", a second independent statement of what `R8` cited from the ministry |

### 9.5 Files this report produced

All under `data/location/`, with a reproduction recipe and a per-file index in its `README.md`.
Nineteen scripts, nineteen verbatim outputs, and four result datasets:
`tz-perzone.json` (per-zone summary for all 356 zones), `tz-error-muslim-majority-cities.csv` (the
per-city error for 4,961 places), `part4-intrazone.json` (the worst internal journey for every zone
with three or more cities) and `part5-jakim.json` (the residuals behind the elevation finding).
