# Indonesia: worldwide methods against Kemenag's basis

O1h study, Indonesian archipelago annex. Calendar year 2026, six cities in three civil zones,
21 methods (the 20 in `methods/methods.json` plus ISNA-2010 18/18), fajr and isha, scored
minute by minute against Kemenag's own reference.

## 1. Headline

Two worldwide methods land within 2 minutes of Kemenag at every one of the six cities on every
day of 2026 on the published parameter pair: MUIS Singapore (20/18 with ceiling rounding, worst
city mean 0.53 minutes) and Fazilet Profile A (19.8/17.8, worst city mean 0.89 minutes). Against
Kemenag's actual printed minutes, only MUIS Singapore survives, at 1.56 minutes worst city and
100 percent of days within 2 minutes on both prayers. Nothing else in the catalogue clears the
bar, and the MABIMS pair itself is the reference.

Kemenag's own basis turns out uniform: 510 of the country's 516 kabupaten/kota carry one pair
and one rounding, and the six exceptions are Papuan highland regencies that sit one degree
higher on both prayers. Regional isha is real, and it does not reach any of the six cities here.

## 2. Kemenag's published basis, measured

Kemenag now serves its own prayer-time records from a public, keyless API
(`https://bimasislam.kemenag.go.id/api/v1/public`), one date per request, with city records that
carry latitude, longitude and elevation. This replaces the session-gated endpoint the earlier
survey recorded, and it removes the third-party carriage the earlier fit depended on.

The census record carries Subuh 20 / Isya 18 as the published parameter pair, with no margins
and no rounding. Measurement against the ministry's own output fixes the rest of the recipe:

| Recipe | Fajr bias | Isha bias | Exact fajr | Exact isha |
|---|---|---|---|---|
| 20/18, nearest, no margin | -2.00 min | -2.00 min | 0 % | 0 % |
| 20/18, each prayer 2 minutes later, nearest | 0.00 min | 0.00 min | 98.9 to 100 % | 98.9 to 100 % |

Kemenag publishes 20 and 18 each moved 2 minutes later, rounded to the nearest minute. The
2 minutes is ihtiyat: fajr later is safer for the fast, isha later is safer for the prayer. The
implied angles over 516 cities are fajr 19.52 and isha 18.47, which is exactly what a 2-minute
later shift of the 20/18 pair produces at equatorial latitudes.

Replayed at each city's own point, the recipe reproduces the printed minutes on 98.9 to 100
percent of fajr days and 98.9 to 100 percent of isha days across the six study cities.

## 3. How uniform the basis is, and whether regional isha matters

Every kabupaten/kota in the country was surveyed on six dates spread across 2026 (516 cities,
3,096 records), with the zone offset calibrated from dhuhr against solar transit so a wrong
timezone field cannot corrupt the angle.

| Group | Cities | Implied fajr | Implied isha | Reading |
|---|---|---|---|---|
| National basis | 510 | 19.52 | 18.47 | 20/18 shifted 2 minutes later |
| Papuan highland basis | 6 | 20.51 | 19.45 | 21/19 shifted 2 minutes later |

The six exceptions are Kab. Intan Jaya, Kab. Lanny Jaya, Kab. Paniai, Kab. Pegunungan Arfak,
Kab. Puncak and Kab. Puncak Jaya, all in the central Papuan highlands at 1,786 to 2,422 metres.
The uplift is not an elevation formula: Kab. Deiyai at 1,718 metres and Kab. Jayawijaya at 1,668
metres stay on the national pair, and no other highland regency in Sumatra, Sulawesi or Nusa
Tenggara carries it. It is a per-regency parameter set for six kabupaten.

Regional isha therefore matters, and only there. One degree of isha is worth 4.19 to 4.23
minutes at these latitudes, so a method pinned to 18 degrees goes from exact to 4.2 minutes out
when the reference moves to 19. None of Jakarta, Medan, Pontianak, Surabaya, Makassar or
Jayapura carries the uplift, so all six score against the same pair, and a single global method
suffers no regional penalty inside this grid.

The old census figure, "Isya 18 regional", reproduces nowhere. The country's own records vary by
one degree in six Papuan highland regencies, and by nothing across island groups. The earlier
fit ran against a third-party carriage, and that carriage reads one minute later than the
ministry's own API on every field and date tested, so the fit measured a shifted recipe rather
than Kemenag's.

## 4. The grid

Six cities, dispatch coordinates, 365 days of 2026, each method run naked at second resolution
and rounded to the nearest minute, compared with the Kemenag pair rounded the same way. Mean,
worst day and days within 2 minutes are minutes of absolute deviation.

| Rank | Method | Fajr mean | Fajr worst day | Fajr within 2 | Isha mean | Isha worst day | Isha within 2 | Worst city | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| 1 | MABIMS 20/18 | 0.00 | 0 | 100 % | 0.00 | 0 | 100 % | 0.00 | reference |
| 2 | Kemenag RI 20/18 | 0.00 | 0 | 100 % | 0.00 | 0 | 100 % | 0.00 | reference |
| 3 | MUIS Singapore 20/18, ceil | 0.50 | 1 | 100 % | 0.47 | 1 | 100 % | 0.53 | reproduces |
| 4 | Fazilet A 19.8/17.8 | 0.84 | 1 | 100 % | 0.85 | 1 | 100 % | 0.89 | reproduces |
| 5 | Egyptian 19.5/17.5 | 2.10 | 3 | 87.4 % | 2.11 | 3 | 87.9 % | 2.13 | close |
| 6 | Fazilet B 20.8/18.7 | 3.38 | 4 | 0 % | 2.95 | 4 | 6.3 % | 3.42 | partial |
| 7 | Dubai 18.2/18.2 | 7.58 | 9 | 0 % | 0.84 | 1 | 100 % | 7.62 | isha only |
| 8 | Muslim World League 18/17 | 8.42 | 10 | 0 % | 4.22 | 5 | 0 % | 8.48 | fails |
| 9 | ISNA-2010 18/18 | 8.42 | 10 | 0 % | 0.00 | 0 | 100 % | 8.48 | isha only |
| 10 | Karachi 18/18, Hanafi asr | 8.42 | 10 | 0 % | 0.00 | 0 | 100 % | 8.48 | isha only |
| 11 | Moonsighting Committee | 8.42 | 10 | 0 % | 0.05 | 2 | 100 % | 8.48 | isha only |
| 12 | Diyanet domestic 18/17 | 8.42 | 10 | 0 % | 4.22 | 5 | 0 % | 8.48 | fails |
| 13 | JAKIM 18/18 | 8.42 | 10 | 0 % | 0.00 | 0 | 100 % | 8.48 | isha only |
| 14 | Kuwait 18/17.5 | 8.42 | 10 | 0 % | 2.11 | 3 | 87.9 % | 8.48 | fails |
| 15 | ECFR 18/17 | 8.42 | 10 | 0 % | 4.22 | 5 | 0 % | 8.48 | fails |
| 16 | Diyanet Europe 18/16 | 8.42 | 10 | 0 % | 8.44 | 10 | 0 % | 8.52 | fails |
| 17 | Russia 16/15 | 16.85 | 19 | 0 % | 12.64 | 14 | 0 % | 16.92 | fails |
| 18 | Tehran 17.7/14 | 9.69 | 11 | 0 % | 16.84 | 19 | 0 % | 16.97 | fails |
| 19 | Qatar 18, isha +90 | 8.42 | 10 | 0 % | 17.94 | 22 | 0 % | 18.25 | fails |
| 20 | Umm al-Qura 18.5, isha +90/+120 | 6.31 | 7 | 0 % | 20.41 | 52 | 0 % | 20.72 | fails |
| 21 | ISNA 15/15 | 21.05 | 23 | 0 % | 12.64 | 14 | 0 % | 21.15 | fails |

Every method is Shafi at asr except Karachi, which is Hanafi. Kemenag is Shafi, so Karachi
alone carries an asr mismatch. Asr sits outside the headline score and is reported as a flag.

## 5. Per-city detail for the leaders

Deviation is mean absolute minutes per prayer, pair reference.

| City | Zone | MABIMS | Singapore | Fazilet A | Egyptian | MWL | ISNA-2010 |
|---|---|---|---|---|---|---|---|
| Jakarta | WIB | 0.00 / 0.00 | 0.48 / 0.45 | 0.87 / 0.84 | 2.09 / 2.10 | 8.42 / 4.23 | 8.42 / 0.00 |
| Medan | WIB | 0.00 / 0.00 | 0.52 / 0.52 | 0.84 / 0.86 | 2.08 / 2.09 | 8.40 / 4.20 | 8.40 / 0.00 |
| Pontianak | WIB | 0.00 / 0.00 | 0.43 / 0.50 | 0.82 / 0.80 | 2.08 / 2.10 | 8.34 / 4.19 | 8.34 / 0.00 |
| Surabaya | WIB | 0.00 / 0.00 | 0.50 / 0.43 | 0.85 / 0.89 | 2.13 / 2.12 | 8.45 / 4.24 | 8.45 / 0.00 |
| Makassar | WITA | 0.00 / 0.00 | 0.53 / 0.45 | 0.82 / 0.85 | 2.13 / 2.12 | 8.48 / 4.23 | 8.48 / 0.00 |
| Jayapura | WIT | 0.00 / 0.00 | 0.52 / 0.49 | 0.83 / 0.85 | 2.13 / 2.12 | 8.43 / 4.22 | 8.43 / 0.00 |

The six cities span 42 degrees of longitude and 11 of latitude, and it changes almost nothing.
Between Jakarta and Jayapura the same pair drifts by 0.1 minutes of deviation, because the
governing geometry is equatorial: depression angles convert to minutes at the same rate
everywhere in the country.

## 6. Against the printed tables

Scored against Kemenag's actual published minutes at Kemenag's own city point, the ordering
holds but every number gains about 2 minutes, because the tables carry the ihtiyat the pair
does not.

| Method | Worst city, fajr | Worst city, isha | Days within 2 at that city |
|---|---|---|---|
| MABIMS / Kemenag | 2.00 | 2.00 | 99.7 % |
| MUIS Singapore | 1.56 | 1.55 | 100 % |
| Fazilet A | 1.15 | 2.87 | 100 % fajr, 12.6 % isha |
| Egyptian | 0.13 | 4.11 | 100 % fajr, 0 % isha |
| ISNA-2010 / JAKIM / Karachi | 6.46 | 2.00 | 0 % fajr, 99.7 % isha |

Two readings follow. A method that reproduces the 20/18 pair exactly still sits 2.0 minutes
from the printed table, which is the ihtiyat and not a defect. MUIS Singapore's ceiling
rounding supplies about a minute of the shift back, which is why it alone clears the printed
table inside 2 minutes at every city on every day. Egypt's 19.5 degree fajr is the closest fajr
in the catalogue to Kemenag's printed fajr (0.13 minutes), because 19.5 degrees and 20 degrees
plus 2 minutes are nearly the same instant at the equator, but its isha is 4 minutes early on
every day.

## 7. What the 18/18 family costs

Against the 20 degree reference, the 18 degree fajr is 8.34 to 8.48 minutes early, mean 8.42
minutes, worst city Makassar. Against Kemenag's printed fajr the cost falls to 6.36 to 6.46
minutes, because the printed ihtiyat absorbs part of it. The spread across the six cities is
0.14 minutes, from Pontianak at 8.34 to Makassar at 8.48.

The isha half of the family is exact: 18 degrees is the reference isha, so ISNA-2010, JAKIM and
Karachi return 0.00 minutes mean deviation and Moonsighting 0.05. The 18/18 family is therefore
a correct isha with a fajr that is 8 minutes early, unusable in Indonesia on its published
basis, though its fajr error shrinks to 6.4 minutes against what Kemenag actually prints.

## 8. Method verdicts for Indonesia

**Reproduces Kemenag.** MABIMS 20/18 and the Kemenag row are the reference and score zero.
MUIS Singapore is the same pair with ceiling rounding and stays inside 2 minutes everywhere.
Fazilet A (19.8/17.8) is inside 1 minute on both prayers, a genuinely close independent fit.

**Close, misses the 2-minute bar.** Egyptian 19.5/17.5 sits 2.1 minutes out on both prayers and
inside 2 minutes on 87 percent of days. Its fajr is the best match to the printed table in the
catalogue while its isha is 4 minutes early.

**One prayer only.** Dubai (isha 0.84, fajr 7.58), ISNA-2010, JAKIM, Karachi and Moonsighting
(isha 0.00 to 0.05, fajr 8.42) and Kuwait (isha 2.11, fajr 8.42) supply a usable isha with a
fajr 7 to 8 minutes early.

**Partial.** Fazilet B (20.8/18.7) is 3.4 minutes late at fajr and 2.9 late at isha on the pair,
and its isha lands under 1 minute from the printed table.

**Fails.** Muslim World League, Diyanet domestic, ECFR, Diyanet Europe, Russia, Tehran, Qatar,
Umm al-Qura and ISNA 15/15 each miss at least one prayer by more than 3 minutes at every city.
Umm al-Qura's isha interval is the worst single cell in the grid at 20.7 minutes mean and 52
minutes on its worst day, the Ramadan switch included.

## 9. Defects and caveats

The dispatch labelled Surabaya `Asia/Makassar`. East Java is WIB (UTC+7), and Kemenag's own
city record gives `Asia/Jakarta`, so Surabaya is scored in WIB. The clock is shared by both sides
of every comparison, so no metric moves with the choice.

Kemenag's district records agree with geometry on the clock: the zone offset derived from
dhuhr against solar transit matches the `timezone` field on all 516 cities, 335 at UTC+7, 118
at UTC+8 and 63 at UTC+9. That agreement is what makes the basis survey trustworthy, since a
record printed in the wrong zone would move an implied angle by more than 10 degrees.

The reference is the published parameter pair, as the brief requires. The ihtiyat that Kemenag
applies on top is measured here and reported separately, never folded into a method.

`api.myquran.com` is one minute later than Kemenag on every field tested. Any earlier fit made
against that carriage carries the offset.

## 10. Reproduce

```
node fetch-kemenag.mjs        # 6 cities x 365 days from Kemenag's public API into kemenag/
node survey-basis.mjs         # 516 kab/kota, 6 dates each -> kemenag-basis-survey.json
node measure-angles.mjs       # implied angle per study city -> kemenag-implied-angles.json
node test-kemenag-recipe.mjs  # candidate recipes against printed minutes
node grid.mjs                 # 21 methods x 6 cities -> results.json
node isha-sensitivity.mjs     # cost of a 1 degree isha move -> isha-sensitivity.json
```

`grid.mjs` spawns one process per city with `TZ` set to that city's zone and asserts the
process timezone before scoring.
