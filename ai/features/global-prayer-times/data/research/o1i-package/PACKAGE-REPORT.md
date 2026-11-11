# adhan 4.4.6: package report

## Scope and source

This report documents the `adhan` npm package at version 4.4.6 as installed at
`$HOME/athan-gitree/census/adhan-build/node_modules/adhan/`. Every statement below comes
from reading the shipped CommonJS build, the shipped TypeScript declarations, `README.md`,
`METHODS.md`, `MIGRATION.md` and `CHANGELOG.md`. The package was read offline: no network
call was made, and `README.md` plus `METHODS.md` are the only documentation the package
carries.

The package has no tests inside it. The matching source tree at
`$HOME/athan-gitree/census/adhan-4.4.6-src/` holds a `test/` directory and eight fixture
files under `Shared/Times/`. Those fixtures are used here as an independent oracle, and the
package itself remains the subject.

The catalogue of methods, machine readable, is `package-methods.json` beside this file. The
evidence is `verify-methods.mjs` and its captured output `verification-output.txt`.

## How a method is built

`CalculationMethod` is a plain object of thirteen factory functions, no classes and no
registry. Each factory calls `new CalculationParameters(name, fajrAngle, ishaAngle,
ishaInterval, maghribAngle)` and then mutates the returned instance. The fifth slot means a
caller who reconstructs a preset by hand must keep the order exactly: Tehran passes 4.5 in
that slot, and it is the only preset that does.

Four fields of `CalculationParameters` are class defaults that no factory ever touches.
`madhab` starts at `Madhab.Shafi`. `highLatitudeRule` starts at
`HighLatitudeRule.MiddleOfTheNight`. `polarCircleResolution` starts at `Unresolved`.
`shafaq` starts at `Shafaq.General`. `adjustments` starts at zero for all six prayers.
`rounding` starts at `Rounding.Nearest`, and Singapore alone overrides it to `Up`.

The consequence is immediate. The package has no notion of a school, a latitude policy or a
polar policy per method. A caller wanting Hanafi Asr assigns `params.madhab` after the
factory call, and a caller wanting the seventh-of-the-night rule assigns
`params.highLatitudeRule`. `HighLatitudeRule.recommended(coordinates)` exists and returns
`SeventhOfTheNight` above 48 degrees latitude, but nothing calls it internally.

## The thirteen methods

**MuslimWorldLeague** uses 18 degrees for Fajr and 17 degrees for Isha, with a one minute
Dhuhr adjustment. Rounding is nearest, Madhab Shafi, rule middle of the night. It is the
standard 18/17 pair and is widely used outside the Gulf.

**Egyptian** uses 19.5 degrees for Fajr and 17.5 degrees for Isha, with a one minute Dhuhr
adjustment. It differs from MuslimWorldLeague only in the two angles.

**Karachi** uses 18 degrees at both ends, with a one minute Dhuhr adjustment. The symmetric
pair makes it the least sensitive of the angle methods to the Isha clamp.

**UmmAlQura** uses 18.5 degrees for Fajr and a fixed 90 minute interval from sunset for
Isha, so `ishaAngle` is 0 and unused. It carries no adjustments at all. `METHODS.md`
instructs the caller to add a 30 minute Isha adjustment during Ramadan; there is no Ramadan
branch in the code.

**Dubai** uses 18.2 degrees at both ends and the largest set of small offsets outside
Turkey: sunrise minus 3 minutes, Dhuhr plus 3, Asr plus 3, Maghrib plus 3. Fajr and Isha
carry no offset.

**MoonsightingCommittee** uses 18 degrees at both ends, Dhuhr plus 5 minutes and Maghrib
plus 3. It is the only method with a named branch inside `PrayerTimes.js`. Its real Fajr and
Isha come from a latitude and day-of-year polynomial anchored on the solstice, and its
angles serve as a comparison term rather than the deciding value. Above 55 degrees latitude
the 1/7 night fraction replaces the angle result first. `shafaq` selects the evening
coefficient set, with `Ahmer` earlier and `Abyad` later.

**NorthAmerica**, the ISNA method, uses 15 degrees at both ends with a one minute Dhuhr
adjustment. The low angle makes it the most dependent of the presets on the night clamp at
UK latitudes.

**Kuwait** uses 18 degrees for Fajr and 17.5 for Isha with no adjustments, so its output is
the raw astronomy plus rounding.

**Qatar** uses 18 degrees for Fajr and the same 90 minute sunset interval as UmmAlQura. It
carries no adjustments and no Ramadan branch.

**Singapore** uses 20 degrees for Fajr and 18 for Isha with a one minute Dhuhr adjustment,
and is the only preset that sets `Rounding.Up`. Its `METHODS.md` description claims
Singapore, Malaysia and Indonesia together.

**Tehran** uses 17.7 degrees for Fajr, 14 degrees for Isha, and `maghribAngle` 4.5. It is the
only preset whose Maghrib is not sunset. The angle result is adopted only when it falls after
sunset and before Isha, so the guard cannot produce Maghrib later than Isha.

**Turkey** uses 18 degrees for Fajr and 17 for Isha with sunrise minus 7, Dhuhr plus 5, Asr
plus 4 and Maghrib plus 7. `METHODS.md` calls it an approximation of Diyanet, less accurate
outside Turkey.

**Other** is a blank template with both angles at 0. In its delivered state it is degenerate:
a zero angle is the 0 degree geometric crossing, which in the morning falls about 7 minutes
after sunrise and in the evening about 6 minutes before sunset. The night clamp cannot
repair either end, because each clamp only moves a time in one direction. A caller must
supply angles or an interval before this preset produces a usable day.

## Engine mechanics

### Date components

`SolarTime` reads the local calendar components of the date argument and passes them to
`Astronomical.julianDay(year, month + 1, day, 0)`. `PrayerTimes` rebuilds every result with
`TimeComponents.utcDate(date.getFullYear(), date.getMonth(), date.getDate())`, which calls
`Date.UTC`. The date argument is therefore a day selector read in the host time zone, not an
instant: its hour, minute, second and millisecond are discarded, and its year, month and day
become a UTC calendar day. The six returned values are absolute UTC instants.

Two hazards follow. A date built from a UTC epoch string, such as `Date.parse('2026-06-01')`,
reads as the previous day on any host west of UTC. And no daylight saving logic exists
anywhere in the library: `README.md` states that results are absolute UTC values and
requires the caller to format them against an explicit zone such as `Europe/London`.
`MIGRATION.md` records that version 4.0.0 removed `adhan.Date.formattedTime` for exactly
that reason, so the package ships no formatter today.

### Rounding

`DateUtils.roundedMinute` reads `getUTCSeconds()` and adds a signed second offset, so
rounding acts on the absolute instant. `Nearest`, the default, floors from 0 to 29 seconds
and ceilings from 30 to 59. `Up` always adds `60 - seconds`, which means a value already
exactly on the minute gains a whole further minute, because `60 - 0` is 60. `None` leaves
the fractional seconds in place.

Order within one prayer is fixed: raw astronomical value, then user adjustment, then method
adjustment, then rounding. Rounding is last and never feeds back. All six outputs round,
including sunset, which is the only output with no adjustment applied. `SunnahTimes` is the
exception: it calls `roundedMinute` without an argument, so its two outputs always round
nearest regardless of what the caller set.

### Isha interval

When `ishaInterval` is greater than zero the interval branch replaces the angle branch
entirely: Isha becomes raw sunset plus the interval in minutes. That base is the unadjusted
sunset, so a Maghrib adjustment does not move an interval Isha, while an Isha adjustment
does, and is applied afterwards. The whole night-clamp block sits in the other branch, so an
interval Isha receives no high latitude bound at all, and `nightPortions().isha` is never
read. A caller who sets `ishaInterval` back to zero on UmmAlQura or Qatar leaves
`ishaAngle` at 0 and gets the 0 degree crossing.

### High latitude

The night runs from today's sunset to tomorrow's sunrise, computed by building a full
`SolarTime` for the next day, and is expressed in seconds. The clamp compares rather than
assigns. Fajr is replaced only when the clamped value is later than the astronomical one,
and Isha only when it is earlier. A clamp therefore cannot rescue a time that already sits
on the wrong side of sunrise or sunset, which is why `Other` produces Fajr after sunrise.

Portions come from `highLatitudeRule` alone: one half for middle of the night, one seventh
for seventh of the night, and the angle divided by 60 for the twilight angle rule. Under
`TwilightAngle` the portion moves with the method's own angles, so Tehran's 14 degree Isha
gives the smallest Isha portion in the package.

At London on 2026-06-01 the clamp sets both ends for the 18 degree and deeper pairs. Muslim
World League, Egyptian, Karachi, Kuwait, Turkey and Dubai each return Fajr 00:59 and Isha
00:58, one minute apart across midnight, because the true twilights do not occur at that
latitude and season. Singapore reaches the same instants and its `Up` rounding pushes them to
01:00 and 00:59. The 15 degree ISNA pair stays inside the day at 02:05 and 23:54,
and the MoonsightingCommittee curve at 02:56 and 22:22, because a shallower angle is reached
before the half-night limit. Every other preset in the table collapses onto or next to
midnight that week. For a London-only product this is the single most important behaviour in
the library.

### Moonsighting branch

`PrayerTimes.js` compares `calculationParameters.method` against the literal string
`'MoonsightingCommittee'` and switches Fajr and Isha onto
`Astronomical.seasonAdjustedMorningTwilight` and `seasonAdjustedEveningTwilight`. Those
functions interpolate between latitude-scaled coefficients across the year and are
independent of `fajrAngle` and `ishaAngle`. Above `HIGH_LATITUDE_THRESHOLD = 55` the 1/7
night fraction replaces the angle result before the polynomial is compared. The recognition
is by name, so copying the MoonsightingCommittee parameters onto any other method name
silently disables the whole mechanism. A probe at 59.9139 N puts Fajr 122 minutes from
Muslim World League.

### Maghrib angle

Only Tehran sets it. The test runs after Isha is computed, so an interval Isha is already in
place when the guard evaluates.

### Polar circle and Qibla

`Unresolved` is the default and leaves invalid dates in place, so a formatter receives
`NaN` rather than an error. `AqrabYaum` walks dates up to 183 days and `AqrabBalad` walks
latitude in 0.5 degree steps. `Qibla` uses fixed Kaaba coordinates 21.4225241 N,
39.8261818 E and returns a spherical bearing.

## Verification

`verify-methods.mjs` runs four checks and exits non-zero on any failure.

1. It pulls every factory from the installed package and diffs name, `method`, the four
   angle and interval values, `methodAdjustments`, `rounding`, `madhab`,
   `highLatitudeRule`, `polarCircleResolution`, `shafaq` and the numeric `nightPortions()`
   against `package-methods.json`. All thirteen pass.
2. It instantiates all thirteen at 51.5074 N, 0.1278 W for 2026-06-01 and prints six times.
3. It probes sixteen behaviours the JSON and this report assert: the Hanafi override, the
   seventh-of-the-night override, `recommended()` at 51.5, the 90 minute interval, the
   Maghrib adjustment independence, the Isha adjustment on an interval, `Rounding.None`
   seconds, `Rounding.Up` minutes, the Tehran angle Maghrib, zero angle degeneracy, the
   London midsummer collapse, the method-name gate, the 55 degree branch, and SunnahTimes.
4. It replays the eight upstream fixture files, 2772 prayer values, in their own time zones.
   Worst deltas are 0 minutes for Makkah, Doha and London, 1 minute for Dubai and Tehran,
   and 2 minutes for Ankara, Kuwait and Singapore, each inside the variance the fixture
   itself declares.

The probe table for 2026-06-01, host zone Europe/London, reads:

| method | fajr | sunrise | dhuhr | asr | maghrib | isha |
| --- | --- | --- | --- | --- | --- | --- |
| MuslimWorldLeague | 00:59 | 04:49 | 12:59 | 17:19 | 21:08 | 00:58 |
| Egyptian | 00:59 | 04:49 | 12:59 | 17:19 | 21:08 | 00:58 |
| Karachi | 00:59 | 04:49 | 12:59 | 17:19 | 21:08 | 00:58 |
| UmmAlQura | 00:59 | 04:49 | 12:58 | 17:19 | 21:08 | 22:38 |
| Dubai | 00:59 | 04:46 | 13:01 | 17:22 | 21:11 | 00:58 |
| MoonsightingCommittee | 02:56 | 04:49 | 13:03 | 17:19 | 21:11 | 22:22 |
| NorthAmerica | 02:05 | 04:49 | 12:59 | 17:19 | 21:08 | 23:54 || Kuwait | 00:59 | 04:49 | 12:58 | 17:19 | 21:08 | 00:58 |
| Qatar | 00:59 | 04:49 | 12:58 | 17:19 | 21:08 | 22:38 |
| Singapore | 01:00 | 04:50 | 13:00 | 17:19 | 21:09 | 00:59 |
| Tehran | 00:59 | 04:49 | 12:58 | 17:19 | 21:40 | 23:33 |
| Turkey | 00:59 | 04:42 | 13:03 | 17:23 | 21:15 | 00:58 |
| Other | 04:56 | 04:49 | 12:58 | 17:19 | 21:08 | 21:02 |

Run it with:

```
ADHAN_PKG=$HOME/athan-gitree/census/adhan-build/node_modules/adhan \
FIXTURES=$HOME/athan-gitree/census/adhan-4.4.6-src/Shared/Times \
DOC=./package-methods.json node verify-methods.mjs
```

## What the package does NOT contain

**No Indonesia preset.** No Kemenag variant, no 20/18 pair labelled for Indonesia. The
Singapore entry claims Indonesia in prose and nothing more.

**No Nigeria preset.** Neither the Nigerian Supreme Council variant nor any unity variant.

**No Malaysia preset.** No JAKIM entry. Malaysia appears only in the Singapore
description.

**No Kazakhstan preset.** No Spiritual Administration of Muslims of Kazakhstan entry.

**No Morocco preset.** No Ministry of Habous entry, and no 19/17 pair labelled for Morocco.

**No Umm al-Qura Ramadan switch.** The 120 minute Ramadan interval does not exist. The
caller must add 30 minutes to Isha by hand, and the package offers no signal that Ramadan
has begun, since it carries no Hijri calendar.

**No school per method.** Every preset is Shafi, and Hanafi is an assignment the caller
makes on the parameters object. The same holds for the high latitude rule, the polar circle
strategy and shafaq.

**No method selection by place.** There is no registry keyed by country, city, timezone or
locale, no alias table, and no lookup function. Choosing a method is entirely the caller's
work.

**No metadata about a method.** A preset exposes a name string, up to four numbers,
`methodAdjustments` and `rounding`. There is no provenance, no scholarly reference, no
region list and no validity range. The only citations live in `METHODS.md` prose and in the
fixture files, which ship outside the npm package.

**No time zone, DST or formatting support.** All arithmetic is UTC. The package refuses to
format, having removed `adhan.Date.formattedTime` in 4.0.0, and tells the caller to use
`Temporal` with an explicit zone.

**No calendar features.** No Hijri conversion, no Ramadan or Eid detection, no month or year
tables, no caching, and no batch API. One call computes one day at one coordinate.

**No notification or audio features.** No adhan playback, no iqama offset, no scheduling, no
per-prayer offsets beyond flat minutes, and no seasonal or monthly adjustment model.

**No comparison table across methods.** No function reports how two presets differ, and no
fixture ships inside the package, so a caller cannot regression test the presets without
obtaining upstream test data separately.

**No linting of a degenerate configuration.** Nothing rejects `ishaAngle` 0 with
`ishaInterval` 0, angles outside a sane range, or an Isha that lands before Maghrib. The
computed values are returned as delivered.

## Consequences for an architecture decision

Three properties govern any design that leans on this package. The method name is
load-bearing, so a store that keeps only numbers loses the MoonsightingCommittee behaviour.
The night clamp is one-way and silent, so a London summer day needs an explicit policy
rather than the default, and the default produces Fajr and Isha one minute apart. And the
package computes from astronomy alone, so every regional preset the product needs beyond
these thirteen, and every Ramadan adjustment, must be represented in the application's own
data rather than requested from the library.
