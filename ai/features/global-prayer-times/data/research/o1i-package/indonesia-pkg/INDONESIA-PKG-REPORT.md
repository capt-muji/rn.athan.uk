# Indonesia under the package alone

O1i study, Indonesian annex. The adhan package (4.4.6) has no Indonesia preset, so every one of
its 13 `CalculationMethod` presets is scored exactly as the library ships it: the preset object,
`PrayerTimes` constructed from it, no parameter touched, no adjustment reset, no rounding
overridden. Six cities, three civil zones, 365 days of 2026, six prayers, against Kemenag's own
records at two reference columns.

## 1. Headline

Singapore (MUIS, fajr 20 / isha 18, ceiling rounding, dhuhr +1) is the only preset that serves
Indonesia. Against Kemenag's parameter pair it sits 0.43 to 0.54 minutes from the ministry on five
prayers at all six cities, and 1.53 on dhuhr because of its own +1 adjustment. Against Kemenag's
printed minutes it sits 1.1 to 1.7 minutes on fajr, dhuhr, asr and isha, 1.9 to 2.3 on maghrib, and
3.1 to 3.5 on sunrise. Its worst single day at the worst city is 2 minutes on four prayers, 3 on
maghrib and 4 on sunrise.

Karachi, the preset that leads in much of the world, is the wrong Indonesia choice: its 18 degree
fajr lands 6.3 to 6.8 minutes after the ministry's printed fajr, on every day at every city, in
the unsafe direction. Nothing else in the catalogue is close.

## 2. What was run, and what the package actually ships

The verbatim rule matters here, because the preset objects are not the bare angle pairs their
names suggest. Six carry method adjustments, one carries a different rounding, one carries a
maghrib angle instead of sunset, and all 13 default to the Shafi madhab and to the middle-of-night
high-latitude rule.

| Preset | Fajr | Isha | Isha interval | Maghrib angle | Rounding | Adjustments shipped |
|---|---|---|---|---|---|---|
| MuslimWorldLeague | 18 | 17 | - | - | nearest | dhuhr +1 |
| Egyptian | 19.5 | 17.5 | - | - | nearest | dhuhr +1 |
| Karachi | 18 | 18 | - | - | nearest | dhuhr +1 |
| UmmAlQura | 18.5 | - | 90 min | - | nearest | none |
| Dubai | 18.2 | 18.2 | - | - | nearest | sunrise -3, dhuhr +3, asr +3, maghrib +3 |
| MoonsightingCommittee | 18 | 18 | - | - | nearest | dhuhr +5, maghrib +3 |
| NorthAmerica | 15 | 15 | - | - | nearest | dhuhr +1 |
| Kuwait | 18 | 17.5 | - | - | nearest | none |
| Qatar | 18 | - | 90 min | - | nearest | none |
| Singapore | 20 | 18 | - | - | up | dhuhr +1 |
| Tehran | 17.7 | 14 | - | 4.5 deg | nearest | none |
| Turkey | 18 | 17 | - | - | nearest | sunrise -7, dhuhr +5, asr +4, maghrib +7 |
| Other | 0 | 0 | - | - | nearest | none |

Three package facts govern the Indonesia result and none of them was carried by the earlier
21-method grid:

- **Karachi ships Shafi asr, not Hanafi.** The earlier census row gave it Hanafi asr, so it
  carried an asr-school mismatch there. Verbatim, all 13 presets are Shafi, Kemenag is Shafi, and
  the asr school therefore matches for every preset in this grid.
- **Umm al-Qura and Qatar have no Ramadan switch in this build.** Both ship isha as sunset + 90
  minutes, all year. The earlier grid added 30 minutes to Umm al-Qura inside Ramadan from the
  body's documented rule, which is the body's behaviour but not the package's. Verbatim, the preset
  cannot reproduce its own body in Ramadan 2026.
- **`Other` is a blank template, not a method.** With 0/0 angles it returns fajr near the 0 degree
  horizon and isha just before sunset, giving 84 minutes of fajr error. It is kept in the table as
  a row so the count of 13 is honest, and it is not a candidate.

The Singapore preset's ceiling rounding is why it clears the printed table. The ministry prints each
prayer 2 minutes later than its own pair, and ceiling rounding returns about half a minute of that,
which is what keeps Singapore inside the 2-minute bar against published minutes.

## 3. The two reference columns

Kemenag's published minutes carry an ihtiyati. It is measured here per prayer at each city, against
the same 20/18 plus solar geometry with no margin, both at Kemenag's own city point:

| City | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha |
|---|---|---|---|---|---|---|
| Jakarta | 2 (2..3) | -2.68 (-3..-2) | 2.99 (2..3) | 1.98 (1..3) | 2.65 (2..3) | 1.99 (1..3) |
| Medan | 2 (2..2) | -2.68 (-3..-2) | 3 (3..3) | 2 (1..3) | 2.65 (2..3) | 2 (2..3) |
| Pontianak | 2 (2..2) | -2.69 (-3..-2) | 3 (2..3) | 1.94 (1..3) | 2.66 (2..3) | 1.99 (1..2) |
| Surabaya | 1.99 (1..3) | -2.72 (-3..-2) | 3 (3..3) | 1.96 (1..3) | 2.71 (2..3) | 2 (2..2) |
| Makassar | 1.99 (1..2) | -2.65 (-3..-2) | 3 (3..3) | 2 (1..3) | 2.71 (2..3) | 1.99 (1..2) |
| Jayapura | 2 (2..3) | -2.69 (-3..-2) | 3 (3..3) | 2.01 (1..3) | 2.71 (2..3) | 2 (2..3) |

The shape is uniform: fajr +2, dhuhr +3, asr +2, isha +2, sunrise printed 2.7 minutes earlier,
maghrib printed 2.65 minutes later. The half-minute values are the ministry rounding outward in
the safe direction after adding its margin, and the occasional integer flip is a one-minute
boundary difference between its solar solver and this one, not a recipe change.

Two columns follow, and neither is folded into a method:

- **Basis**: 20/18 plus solar, nearest minute, zero margins. This is Kemenag's recipe without its
  ihtiyati.
- **Printed**: Kemenag's published minute strings. This is what an Indonesian user sees.

Both score the method at the study city's coordinates. Kemenag's minutes are computed at its own
city point, so the coordinate drift sits in the printed column and is bounded: the largest mean
drift across all methods and prayers is 0.36 minutes at Jayapura, and 0.06 to 0.17 at the other
five cities. It cannot move a verdict.

## 4. The grid, basis column

Mean absolute deviation in minutes at the worst of the six cities, per prayer, 365 days.

| Rank | Preset | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha | Worst |
|---|---|---|---|---|---|---|---|---|
| 1 | Singapore 20/18 | 0.534 | 0.542 | 1.529 | 0.512 | 0.526 | 0.521 | 1.53 dhuhr |
| 2 | Egyptian 19.5/17.5 | 2.126 | 0 | 1 | 0 | 0 | 2.121 | 2.13 fajr |
| 3 | Dubai 18.2/18.2 | 7.622 | 3 | 3 | 3 | 3 | 0.86 | 7.62 fajr |
| 4 | MWL 18/17 | 8.479 | 0 | 1 | 0 | 0 | 4.238 | 8.48 fajr |
| 5 | Karachi 18/18 | 8.479 | 0 | 1 | 0 | 0 | 0 | 8.48 fajr |
| 6 | Moonsighting 18/18 | 8.479 | 0 | 5 | 0 | 3 | 0.137 | 8.48 fajr |
| 7 | Kuwait 18/17.5 | 8.479 | 0 | 0 | 0 | 0 | 2.121 | 8.48 fajr |
| 8 | Turkey 18/17 | 8.479 | 7 | 5 | 4 | 7 | 4.238 | 8.48 fajr |
| 9 | Tehran 17.7/14 | 9.748 | 0 | 0 | 0 | 15.436 | 16.97 | 16.97 isha |
| 10 | Umm al-Qura 18.5, +90 | 6.356 | 0 | 0 | 0 | 0 | 18.249 | 18.25 isha |
| 11 | Qatar 18, +90 | 8.479 | 0 | 0 | 0 | 0 | 18.249 | 18.25 isha |
| 12 | ISNA 15/15 | 21.148 | 0 | 1 | 0 | 0 | 12.734 | 21.15 fajr |
| 13 | Other 0/0 | 84.362 | 0 | 0 | 0 | 0 | 75.981 | 84.36 fajr |

Signed bias says which way each error runs. The 18 degree fajr family is late, not early: MWL,
Karachi, Kuwait and Moonsighting all mean +8.42 minutes after the 20 degree basis. Isha is where
they split: Karachi and Moonsighting are exact to 0.14, Kuwait is 2.11 early, MWL 4.22 early.

## 5. The grid, printed column

Same statistic against the ministry's published minutes, which carry the ihtiyati above.

| Rank | Preset | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha | Worst |
|---|---|---|---|---|---|---|---|---|
| 1 | Singapore 20/18 | 1.616 | 3.523 | 1.627 | 1.567 | 2.34 | 1.655 | 3.52 sunrise |
| 2 | Egyptian 19.5/17.5 | 0.463 | 3.027 | 2.129 | 2.068 | 2.8 | 4.205 | 4.21 isha |
| 3 | Dubai 18.2/18.2 | 5.91 | 0.4 | 0.359 | 1.353 | 0.652 | 1.252 | 5.91 fajr |
| 4 | MWL 18/17 | 6.764 | 3.027 | 2.129 | 2.068 | 2.8 | 6.323 | 6.76 fajr |
| 5 | Karachi 18/18 | 6.764 | 3.027 | 2.129 | 2.068 | 2.8 | 2.085 | 6.76 fajr |
| 6 | Moonsighting 18/18 | 6.764 | 3.027 | 2.359 | 2.068 | 0.652 | 2.222 | 6.76 fajr |
| 7 | Kuwait 18/17.5 | 6.764 | 3.027 | 3.129 | 2.068 | 2.8 | 4.205 | 6.76 fajr |
| 8 | Turkey 18/17 | 6.764 | 4.4 | 2.359 | 2.353 | 4.652 | 6.323 | 6.76 fajr |
| 9 | Umm al-Qura 18.5, +90 | 4.658 | 3.027 | 3.129 | 2.068 | 2.8 | 16.51 | 16.51 isha |
| 10 | Qatar 18, +90 | 6.764 | 3.027 | 3.129 | 2.068 | 2.8 | 16.51 | 16.51 isha |
| 11 | Tehran 17.7/14 | 8.005 | 3.027 | 3.129 | 2.068 | 12.951 | 19.055 | 19.06 isha |
| 12 | ISNA 15/15 | 19.364 | 3.027 | 2.129 | 2.068 | 2.8 | 14.819 | 19.36 fajr |
| 13 | Other 0/0 | 82.249 | 3.027 | 3.129 | 2.068 | 2.8 | 78.066 | 82.25 fajr |

Read the sunrise, dhuhr, asr and maghrib columns with care. Ten of the 13 presets carry no
adjustment on sunrise and only three carry one on maghrib, so their 3.0 and 2.8 are the ministry's
own ihtiyati, not a method defect: the app is astronomically correct and the printed table is
deliberately conservative. Only Dubai, Turkey and Moonsighting carry margins there. Dhuhr separates
the presets by their own adjustment: 3.13 for those that ship none, 2.13 for the +1 group, 2.36 for
the +5 pair, 1.63 for Singapore whose own +1 plus ceiling rounding return about 1.5 of the
ministry's +3, and 0.36 for Dubai whose +3 lands on the ministry's +3 almost exactly.

## 6. Singapore city by city

Mean absolute deviation, basis column first, printed column second.

| City | Zone | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha |
|---|---|---|---|---|---|---|---|
| Jakarta | Asia/Jakarta | 0.48 / 1.55 | 0.53 / 3.17 | 1.52 / 1.52 | 0.51 / 1.53 | 0.49 / 2.21 | 0.45 / 1.57 |
| Medan | Asia/Jakarta | 0.52 / 1.48 | 0.54 / 3.21 | 1.47 / 1.54 | 0.50 / 1.52 | 0.46 / 2.21 | 0.52 / 1.51 |
| Pontianak | Asia/Pontianak | 0.43 / 1.58 | 0.50 / 3.13 | 1.53 / 1.52 | 0.49 / 1.50 | 0.48 / 2.23 | 0.50 / 1.56 |
| Surabaya | Asia/Jakarta | 0.50 / 1.62 | 0.49 / 3.09 | 1.50 / 1.63 | 0.50 / 1.57 | 0.46 / 2.34 | 0.43 / 1.66 |
| Makassar | Asia/Makassar | 0.53 / 1.33 | 0.45 / 3.27 | 1.50 / 1.41 | 0.49 / 1.39 | 0.53 / 2.06 | 0.45 / 1.42 |
| Jayapura | Asia/Jayapura | 0.52 / 1.14 | 0.50 / 3.52 | 1.45 / 1.19 | 0.51 / 1.13 | 0.47 / 1.87 | 0.49 / 1.16 |

Days within 2 minutes of the printed minute, worst city: fajr 100 percent, dhuhr 100, asr 100,
isha 100, maghrib 66 to 98 (worst at Surabaya), sunrise 0. Worst single day: 2 minutes on fajr,
dhuhr, asr and isha, 3 on maghrib, 4 on sunrise.

The 42 degrees of longitude and 11 of latitude between Jakarta and Jayapura move nothing that
matters, because the governing geometry is equatorial: a depression angle converts to the same
number of minutes everywhere in the country.

## 7. Preset verdicts for Indonesia

**Serves Indonesia.** Singapore. Within 0.55 minutes of the ministry's recipe on five prayers,
1.53 on dhuhr from its own +1, and inside the 2-minute bar on the printed table for fajr, dhuhr,
asr and isha at every city on every day.

**One prayer, wrong the other.** Egyptian: the best fajr in the catalogue at 0.06 to 0.46 minutes
against the printed table, because 19.5 degrees and the ministry's 20 degrees plus 2 minutes are
nearly the same instant at the equator. Its isha is 3.8 to 4.3 minutes early with no day inside 2.

**Isha only.** Karachi (isha 2.09, fajr 6.76 late), Moonsighting (isha 2.22, fajr 6.76 late),
Kuwait (isha 4.21, fajr 6.76 late). Each is a correct isha bolted to a fajr that starts the fast
6 to 7 minutes after the ministry.

**Margins only, no angles.** Dubai: sunrise 0.40, dhuhr 0.36, maghrib 0.65, asr 1.35, isha 1.25,
all inside the bar, on an 18.2 degree fajr that is 5.6 minutes late on average and 5.9 at the worst
city. It is the only preset whose sunrise matches the printed sunrise, because its own -3 happens
to equal the ministry's ihtiyati in that direction.

**Fails.** MWL (isha 6.32 early), Turkey (maghrib 4.65 late from its +7, fajr 6.76 late), Umm
al-Qura (isha 16.51 late from +90 with no Ramadan switch), Qatar (same isha), Tehran (isha 19.06
early, maghrib 12.95 late from its 4.5 degree maghrib), ISNA 15/15 (fajr 19.36 late, isha 14.82
early), and `Other`, which produces no usable time at all.

## 8. Singapore against Karachi, the worldwide leader

The architecture question is one preset for the package, and Karachi is the candidate that leads
elsewhere. In Indonesia it costs, per prayer, against the printed table at the worst city:

| Prayer | Singapore | Karachi | Direction of the Karachi error |
|---|---|---|---|
| Fajr | 1.62 | 6.76 | 6.5 late on average, no day inside 2 minutes |
| Sunrise | 3.52 | 3.03 | 2.7 late, the ministry's ihtiyati |
| Dhuhr | 1.63 | 2.13 | 2.0 early |
| Asr | 1.57 | 2.07 | 1.9 early |
| Maghrib | 2.34 | 2.80 | 2.6 early |
| Isha | 1.66 | 2.09 | 2.0 early |

Karachi is better on sunrise only, and by half a minute. It is 5.1 minutes worse on fajr, in the
direction that starts the fast after the ministry's own start. A generalist preset that leads in
Pakistan, Turkey and the Gulf is not a defensible Indonesian default.

What an Indonesian user would then see, against the published minute: fajr 1.45 early, dhuhr 1.47
early, asr 1.44 early, isha 1.48 early, maghrib 2.16 early, sunrise 3.23 late. The early fajr is
the safe direction for starting the fast and the late sunrise is the safe direction for ending it.
The early maghrib is not a method error: sunset is the correct instant to break the fast, and the
ministry prints 2.65 minutes after it. Singapore carries the same 20 degree fajr as the ministry,
so its entire fajr offset is the ihtiyati, partly returned by ceiling rounding, not a difference of
method.

**Recommendation.** Ship the Singapore preset if the package alone must serve Indonesia. Do not
ship Karachi for it, and do not present any preset as reproducing Kemenag, because none does: the
ministry's pair plus ihtiyati is a target-side recipe and no preset carries a margin like it. With
Singapore the build is inside 2 minutes of the ministry on fajr, dhuhr, asr and isha at all six
cities on all 365 days, and outside it only on maghrib (66 to 98 percent of days inside) and
sunrise (never inside), both by the ministry's own margin rather than by the method's geometry.

One caveat outside the grid: six Papuan highland regencies carry a 21/19 basis, one degree higher
on both prayers, which is worth about 4.2 minutes at these latitudes. There Singapore's 20/18 would
move from 1.5 minutes early to roughly 3 minutes late at fajr, and from 1.5 early to about 6 early
at isha. No function of the package closes that without a regional parameter. The arithmetic is
this section's, applied to the prior survey's one-degree measurement, not a new measurement.

## 9. Multi-year

Kemenag's public keyless API serves calendar 2026 and nothing else. One date per request, one
record per call, and the handler is date-keyed:

| Probe | Result |
|---|---|
| 2026-01-01, 2026-12-31 | data |
| 2025-01-01, 2025-06-15, 2025-12-31 | `prayer times not found for the given city and date` |
| 2024-06-15 | same error |
| 2027-01-01 | same error |
| second city, 2025-08-17 | same error |
| `&month=6&year=2025` with a date | rejected, only `date` is read |
| `?month=&year=` without a date | rejected, `date query parameter is required` |
| `prayer-times/monthly`, `monthly-prayer-times` | 404 |
| `imsakiyah?month=&year=` | same date-keyed handler |
| public `/jadwal-sholat?year=2025` | page hard-initialises 2026, and the year selector is client-side over date-keyed data |

So the study stands on 2026 alone, at 365 days and six cities, and the multi-year extension is not
obtainable from the ministry. The one-year basis is defensible for this particular question because
Kemenag's recipe is a static parameter set: a 20/18 pair plus a fixed ihtiyati, with no seasonal or
year-dependent term. A different year moves both sides of every comparison by the same geometry, so
the between-preset ordering would not move. That is reasoning about the recipe, not a measurement
of 2024 or 2025, and it is not presented as one. No third-party carriage was used to stand in for a
missing year: the earlier study measured `api.myquran.com` reading one minute later than the
ministry's own API on every field it tested, so it is a different recipe and cannot extend this grid.

## 10. Defects and caveats

The earlier 21-method Indonesia report says the 18 degree fajr is 8.34 to 8.48 minutes **early**.
It is late, by the same amount: the 18 degree sun is less far below the horizon than 20 degrees, so
the fajr instant is later. Its table carried only absolute values, so the prose sign was never
tested. The direction decides the user consequence, which is why this grid reports signed bias.

The earlier grid also forced Hanafi asr onto Karachi from the census method definition. The package
ships Shafi, so that asr mismatch does not exist in a package-only build, and this grid reports the
school match for all 13 presets as Shafi against Shafi.

`Other` is not a usable method: 0/0 angles degrade to the horizon and to sunset-adjacent times. It
is reported, not recommended.

Surabaya is scored in `Asia/Jakarta`. East Java is WIB at UTC+7 and Kemenag's own city record gives
`Asia/Jakarta`. Each child asserted its process zone against the city zone, and the sampled offsets
were identical at six points across the year in all six cities.

The package's default high-latitude rule is middle of the night. At these latitudes it never binds:
the closest approach measured is 258 minutes of slack between the angle instant and the
middle-of-night bound, so the default is inert here and no preset is flattered or penalised by it.
Moonsighting's season-adjusted twilight also barely engages: it moves isha by 0.14 minutes on
average and never binds fajr, and its 55 degree high-latitude branch never runs.

Dhuha is present in Kemenag's records and is not one of the six prayers, so it is excluded. It also
prints a constant 06:00 on the two dates inspected, which reads as a defect in the record rather
than a time.

## 11. Reproduce

```
node grid.mjs            # 6 cities, one TZ-asserted child each -> results.json
```

The harness reproduces the earlier study's Jakarta cells exactly (Singapore 1.515 / 1.548,
MWL 6.436 / 6.214, Karachi 6.436 / 1.995, Moonsighting 6.436 / 2.077, Dubai 5.636 / 1.134 at
Kemenag's point against the printed table), which is the regression check on the shared geometry.
