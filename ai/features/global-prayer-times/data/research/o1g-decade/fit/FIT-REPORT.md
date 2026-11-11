# 2027 London Unified Prayer Timetable: recovered recipe

Fit is blind: the only input was `../data/2027.json` (365 days) and the adhan-js 4.4.6
solar routines. Every step ran with `TZ=Europe/London`, dates were built from the data's
own strings, and all times were formed at second resolution before any rounding.

## The recipe

```
lat = 51.51, lon = -0.13          (fit; see "Coordinates" below)
declination = apparent solar declination at 12:00 UT of the date, used once for all events
transit     = refined transit (Meeus equation of time, corrected with the neighbouring
              right ascensions)
horizon     = -0.8333 deg

sunrise = round(transit - HA(-0.8333) - 3)
magrib  = round(transit + HA(-0.8333) + 3)
dhuhr   = round(transit + 5)
asrAlt  = atan(1 / (1 + tan(|lat - dec|)))          # shadow factor 1
asr     = round(transit + HA(asrAlt) + 2)
fajr    = round(sunrise) - F[MM-DD]                 # F ranges 87..121 minutes
isha    = round(magrib)  + I[MM-DD]                 # I ranges 63..97 minutes
```

`round` is nearest minute with halves up: `floor(seconds/60 + 0.5)`. The margins are
added to the second-resolution time, then rounded, never the other way round. The two
offset tables are applied to the already-rounded sunrise and maghrib.

## How each claim was established

**The solar model.** Four structural variants were fitted against the four geometry
columns, scoring by the width of the residual band (a band of one minute is the best any
rounding rule can consume):

| declination / transit | sunrise band | magrib band | asr band | dhuhr band |
|---|---|---|---|---|
| declination at the event, everything refined | 2.05 | 2.08 | 3.55 | 1.03 |
| declination at 00:00 UT, no refinement | 3.00 | 2.90 | 2.45 | 1.03 |
| declination at 12:00 UT, refined transit | 1.03 | 1.01 | 1.02 | 1.03 |

A single noon declination collapses all four columns onto the one-minute rounding window.
The transit must stay refined: replacing it with a noon evaluation widens every band to
1.36-1.40 minutes. This is the signature of a publisher who reads the sun's declination
once per day, at noon, and reuses it, while computing the equation of time properly.

**Horizon angle.** Scanning -1.30 to -0.40 degrees in 0.01 steps peaks at -0.83 to -0.84
for both sunrise (359 exact) and maghrib (361 exact); the standard 50 arcminutes
(-0.8333) is the optimum. Nothing else is close enough to matter.

**Asr.** Shadow factor 1 fits (worst error 1 minute); shadow factor 2 lands 27 to 73
minutes late, so the column is unambiguously shadow-1. The shadow is taken from the same
noon declination, not from a refined one.

**Margins.** With lat 51.51 and lon -0.13 every column's residual band centres on a whole
number of minutes: sunrise -3, dhuhr +5, asr +2, magrib +3. Half-minute offsets appear at
neighbouring longitudes, which is the degeneracy below, not a property of the table.

**Coordinates.** The grid scanned 51.44-51.60 N and -0.22 to +0.05 E in 0.005 steps and
maximised summed exact-minute matches. The peak sits at 51.51 N, -0.13 E, which is London.
Longitude is not separately identifiable: 0.25 degrees of longitude is exactly one minute
of time, and the per-prayer margins absorb it. The pair (longitude, margins) reproduces the
table; longitude alone does not. Latitude is weakly determined too: over 51.48-51.54 the
total exact count moves by less than 1.5 percent.

**Fajr and isha are not angles.** Fixed-angle scans at 0.05-degree steps over 14-21
degrees, on the recovered solar engine:

| column | best angle | residual sd | residual range |
|---|---|---|---|
| fajr | 14.00 | 15.84 min | -41.6 .. +15.6 |
| isha | 14.00 | 29.09 min | -10.4 .. +83.8 |

At 18 degrees the fajr residual sd is 35.74 minutes. No angle works, and the misfit is
structural rather than a tuning problem: the published fajr is an exact whole number of
minutes before the published sunrise for long stretches. The lead is 97 minutes for 78
consecutive days (2027-01-01 to 2027-03-19) while the 18-degree angular separation over
the same days moves by 10.2 minutes (10.7 minutes at 14 degrees); the isha lag is 97
minutes for 33 consecutive days while its angular separation moves by 2.8 minutes. A value
that stays fixed to the minute while its would-be driver moves by several minutes is a
table, not a formula.

Both offsets take 35 distinct values over the year in 88 (fajr) and 87 (isha) constant
runs. The tables are in `recipe.json` under `prayers.fajr.table` and
`prayers.isha.table`, keyed MM-DD, with 2027's 365 entries plus an interpolated 02-29.

**No high-latitude rule.** The night from maghrib to the next sunrise runs 436 minutes
(24 June) to 965 minutes (23 December). The fajr lead is 10.1 to 27.8 percent of that
night and the isha lag 10.1 to 18.5 percent, so neither is a fixed fraction, and no clamp
ever bites: the largest lead is 121 minutes, well inside the shortest night. The summer
columns are pure offsets from sunrise and maghrib.

## In-sample scores, 2027 (365 days per column)

| prayer | exact | within 1 min | worst error |
|---|---|---|---|
| fajr | 360 (98.63%) | 365 (100%) | 1 min |
| sunrise | 360 (98.63%) | 365 (100%) | 1 min |
| dhuhr | 361 (98.90%) | 365 (100%) | 1 min |
| asr | 360 (98.63%) | 365 (100%) | 1 min |
| magrib | 361 (98.90%) | 365 (100%) | 1 min |
| isha | 361 (98.90%) | 365 (100%) | 1 min |

All 27 misses are one-minute boundary flips produced by the residual 0.01-0.03 minute
difference between this solar implementation and the publisher's. The whole table is
2163/2190 exact (98.8 percent) and 2190/2190 within one minute.

## Null results

- No angle, and no angle plus night-fraction clamp, reproduces fajr or isha.
- The four geometry columns carry no residual structure beyond the sub-minute model
  difference. The 27 one-minute misses spread from January to November, at most 8 in one
  month (March, where the declination moves fastest) and none in August, September or
  December. That tracks the declination rate, not a calendar boundary, which rules out a
  per-month angle table for the geometry columns.
- Longitude and the margins are not separately recoverable from a single station's table.
- Nothing in the data distinguishes "table keyed MM-DD" from "table keyed Gregorian day
  of year" for fajr and isha. MM-DD is shipped because a printed timetable repeats by
  calendar date; a leap-day entry is supplied so the recipe stays generative.

## Files

| file | purpose |
|---|---|
| `recipe.json` | the recipe, self-sufficient, including both offset tables |
| `fit.mjs` | the fitting script (coordinate/margin grid, offset extraction, angle scan) |
| `recipe-build.mjs` | assembles `recipe.json` from the stage files |
| `solar.mjs` | the recovered solar engine |
| `lib.mjs` | loads the 2027 source table |
| `predict.mjs` | `generateYear(year)` for any year; `node predict.mjs 2027 --check` scores it |
| `stage*.json` | raw outputs of each fitting stage |

`predict.mjs` was exercised on 2027, 2028 (leap), 2033 and 2038: DST transitions land on
the correct dates, 02-29 is present in leap years, and no value is out of range.
