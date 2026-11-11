# Independent verification: 2027-fitted recipe applied to 2028-2038

Adversarial re-derivation. Every number below was produced by the scripts in this
directory. No code from `fit/` or `predict/` was read, imported or copied: `verify.mjs`
implements the decoder and the solar engine from `recipe.json` and its stated algorithm
alone. The only borrowed inputs are the recipe, the 2027 table, the extracted truth and the
publisher artifact.

Run order, all with `TZ=Europe/London`:

```
node verify.mjs all      # truth integrity, decade score, leap day, hand checks
node structure.mjs       # MM-DD stationarity, keying, DST cross-check, miss map
node calibrate.mjs       # 2027 in-sample calibration, coordinate/margin sensitivity
node boundary.mjs        # where the 1.7% misses sit relative to the rounding boundary
node keying-cases.mjs    # concrete MM-DD vs day-of-year counterexamples
node finalise.mjs        # consolidate into results.json
```

## 1. Truth integrity

Own decoder for `assets/data/london-2026-2076.bin`: 12-byte header (`LUPT`, format 1,
epochDay 20454, dayCount 18628, columns 6), 18,628 day-major rows of six uint16 LE
minutes. Length checks: 223,548 bytes = 12 + 18,628 x 6 x 2, day 0 = 2026-01-01, last row
2076-12-31.

| Check | Result |
| --- | --- |
| Days extracted for 2028-01-01..2038-12-31 | 4,018 |
| Cells compared with `truth/truth-2028-2038.json` | 24,108 |
| Cell mismatches | **0** |
| Keys in truth absent from the artifact, or extra | 0 / 0 |
| `date` field inconsistent with its key | 0 |
| Artifact's 2027 rows vs `data/2027.json` (the fit input) | 2,190 cells, **0** mismatches |

The truth file is the publisher artifact. The artifact's 2027 equals the fitting table, so
the fit and the target describe the same series. `stage1-truth.json`.

## 2. Regeneration

Implemented from the recipe text: Meeus solar position (low-order series, apparent
longitude with nutation and aberration, true obliquity), apparent sidereal time, transit
solved as the instant local apparent sidereal time equals apparent right ascension,
declination read once at 12:00 UT of the civil date and reused, hour angle
`(180/pi)*acos((sin h - sin lat sin dec)/(cos lat cos dec))/15*60`, margins -3/+5/+2/+3,
nearest-minute halves up, fajr/isha as MM-DD offsets applied to the already-rounded sunrise
and magrib.

London offset computed from the DST rule alone (last Sunday of March and October, 01:00
UTC) and cross-checked against `Intl` for 69,476 instants including every event time:
**0 mismatches** (`stage5-structure.json`).

Calibration: the same engine on 2027 reproduces the recipe's own in-sample table exactly
(fajr 360/365, sunrise 360, dhuhr 361, asr 360, magrib 361, isha 361; overall 2,163/2,190 =
98.77%). An engine that reproduces the fit's own in-sample score to the cell is the engine
the recipe describes, not a lookalike. `stage6-calibration.json`.

## 3. Score, my run

4,018 days x 6 prayers = 24,108 cells.

| Metric | Claimed | Mine |
| --- | --- | --- |
| Exact | 23,684 (98.24%) | **23,690 (98.27%)** |
| Within 1 minute | 24,108 (100%) | **24,108 (100%)** |
| Worst error | 1 min | **1 min** |
| MAE | 0.0176 min | **0.0173 min** |

Error distribution: 23,690 exact, 350 one minute late, 68 one minute early. No cell is off
by 2 or more.

Per prayer:

| Prayer | Exact | % | MAE | Worst |
| --- | --- | --- | --- | --- |
| fajr | 3,959 / 4,018 | 98.53 | 0.0147 | 1 |
| sunrise | 3,959 / 4,018 | 98.53 | 0.0147 | 1 |
| dhuhr | 3,964 / 4,018 | 98.66 | 0.0134 | 1 |
| asr | 3,953 / 4,018 | 98.38 | 0.0162 | 1 |
| magrib | 3,929 / 4,018 | 97.78 | 0.0222 | 1 |
| isha | 3,926 / 4,018 | 97.71 | 0.0229 | 1 |

Per year (exact %):

| 2028 | 2029 | 2030 | 2031 | 2032 | 2033 | 2034 | 2035 | 2036 | 2037 | 2038 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 98.04 | 98.58 | 98.40 | 98.95 | 98.09 | 98.17 | 97.85 | 98.08 | 98.32 | 98.13 | 98.31 |

No drift: the band is 97.85 to 98.95 and the year-on-year moves are noise around a flat
line. The 2038 figure matches the claim exactly; 2028 differs by 0.04 pp.

## 4. Cross-check against the other agents' numbers

Their `results.json` reports 23,684 exact, 98.24%, MAE 0.0176, worst 1
(`predict/results.json`, read for numbers only). The 6-cell difference is **exactly one
cell per prayer, each in a different year** (2028 asr, 2030 magrib, 2030 isha, 2032 fajr,
2032 sunrise, 2034 dhuhr). That is the signature of two independently written Meeus
engines differing by a fraction of a second at the rounding boundary, not a disagreement
about the recipe.

Sensitivity probes confirm the recipe is constrained, not tuned loose
(`stage6-calibration.json`):

| Variant | Exact % |
| --- | --- |
| As specified | 98.27 |
| Margins zeroed | 0.00 (worst 6) |
| Latitude 52.5 instead of 51.51 | 23.49 (worst 6) |
| Longitude -0.35 instead of -0.13 | 10.88 (worst 2) |

## 5. February 29

From my extraction, for each leap year:

| Year | fajr lead 02-28 / 02-29 / 03-01 | isha lag 02-28 / 02-29 / 03-01 |
| --- | --- | --- |
| 2028 | 97 / 97 / 97 | 87 / **86** / 86 |
| 2032 | 97 / 97 / 97 | 87 / **86** / 86 |
| 2036 | 97 / 97 / 97 | 87 / **86** / 86 |

Across all 366 MM-DD keys and both offset columns, the recipe's table disagrees with the
offsets the truth exhibits at exactly one place: 02-29 isha, table 87, truth 86. The
publisher's 02-29 row therefore equals its 03-01 row, not the mean of 02-28 and 03-01.

Scoring the leap days themselves (3 days x 6 prayers = 18 cells, `stage3-leap.json`):

| Variant | Exact |
| --- | --- |
| Shipped recipe (mean-fill isha 87) | 15 / 18 |
| Copy 03-01 into both tables | **18 / 18** |

All three misses are isha, one minute late, one per leap day. `stage4-hand.json` shows the
same cell by hand: 2032-02-29 magrib 1062.5017 -> 17:43, plus 87 -> 19:10, truth 19:09.

The 2027 source has no 02-29 (365 entries), so the fit had to invent the row. Copying
03-01 is what the publisher evidently did.

## 6. Hand checks

Five dates, recomputed step by step from the recipe in `stage4-hand.json`.

| Date | Transit (wall) | Offset | Dec (deg) | HA horizon (min) | asr alt (deg) | HA asr (min) | Raw sunrise / dhuhr / asr / magrib | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2028-12-21 winter | 718.8387 = 11:59 | 0 | -23.436086 | 234.753 | 11.966846 | 98.9317 | 481.0857 / 723.8387 / 819.7704 / 956.5918 | all six match truth |
| 2038-06-21 summer | 782.3923 = 13:02 | 60 | 23.433593 | 499.1587 | 33.109839 | 262.8101 | 280.2336 / 787.3923 / 1047.2024 / 1284.5509 | all six match truth |
| 2028-03-26 spring shoulder | 786.0215 = 13:06 | 60 | 2.523789 | 378.0835 | 24.945847 | 205.8909 | 404.9381 / 791.0215 / 993.9124 / 1167.105 | all six match truth |
| 2033-10-30 autumn shoulder | 704.1612 = 11:44 | 0 | -13.97049 | 292.8571 | 17.393253 | 144.4687 | 408.3041 / 709.1612 / 850.6299 / 1000.0184 | all six match truth |
| 2032-02-29 leap day | 732.9036 = 12:13 | 0 | -7.644862 | 326.598 | 20.50075 | 170.242 | 403.3056 / 737.9036 / 905.1456 / 1062.5017 | five match, isha 19:10 vs 19:09 |

Both DST shoulders resolve correctly, and in opposite directions: 2028-03-26 dhuhr is
13:11 (offset 60 applied after the 01:00 UTC change), 2033-10-30 dhuhr is 11:49 (offset 0).
A fixed-offset generator cannot produce both.

## 7. Keying: MM-DD, not day-of-year

Two independent arguments, both from my own extraction (`stage5-structure.json`,
`stage8-keying-cases.json`).

First, stationarity: for every one of the 366 MM-DD keys, the truth's fajr lead and isha
lag take exactly **one** value across all 11 years. Sets of size 1 everywhere, so no
year-dependent or day-of-year component is present.

Second, direct scoring of the two keyings against the truth, using the truth's own sunrise
and magrib so only the offset application can differ:

| Keying | Exact | Of 24,108 |
| --- | --- | --- |
| MM-DD | 24,105 | 99.99% |
| Day-of-year | 23,616 | 97.96% |

Concrete counterexamples for day-of-year keying:

| Date | Truth lead / lag | MM-DD uses | DOY borrows | DOY error |
| --- | --- | --- | --- | --- |
| 2028-03-02 | 97 / 86 | 03-02 (97/86) | 03-03 (97/85) | isha -1 |
| 2036-12-25 | 100 / 97 | 12-25 (100/97) | 12-26 (98/97) | fajr -2 |
| 2028-06-30 | 117 / 73 | 06-30 (117/73) | 07-01 (116/72) | fajr -1, isha -1 |
| 2028-02-29 | 97 / 86 | 02-29 (97/87) | 03-01 (97/86) | none (the one place DOY wins) |

Separately, the recipe's tables are bit-identical to the 2027 table's own lead and lag on
all 365 days (0 mismatches, checked directly). The offsets carry no fitted freedom: one
year determines them. Whatever the fit's provenance, the decade result cannot be an
artefact of seeing the decade.

## 8. Where the residual 1.7% comes from

The four solar columns are rounded from a raw minute value, so a cell can only mismatch if
its raw value sits near the .5 boundary. Measured (`stage7-boundary.json`): of cells whose
raw value is within 0.0087 min (0.5 s) of the boundary, 19 of 52 (sunrise), 28 of 58
(dhuhr), 35 of 57 (asr) and 41 of 86 (magrib) do mismatch. The misses are one-sided (350
late, 68 early), which is what a sub-second offset against the publisher's engine looks
like.

So 98.2% is not the recipe's accuracy against the astronomy. It is the accuracy against the
publisher's own rounding, limited by a sub-second difference between two Meeus
implementations. The claim's "100% within one minute, worst one minute" is the honest
headline; the exact percentage is implementation-dependent at the 0.03 pp level.

## 9. Verdicts

| Claim | Verdict | Evidence |
| --- | --- | --- |
| 4,018 days, 24,108 cells | CONFIRMED | own extraction and enumeration |
| 98.24% exact | CONFIRMED | 98.27% mine, 0.03 pp apart on 6 boundary cells |
| 100% within one minute | CONFIRMED | 24,108 / 24,108 |
| Worst error 1 minute | CONFIRMED | distribution is 0, +1, -1 only |
| MAE 0.0176 min | CONFIRMED | 0.0173 mine, difference equals the 6-cell delta |
| Error flat across the decade | CONFIRMED | 2028 98.04, 2038 98.31, band 97.85-98.95, no trend |
| Publisher's 02-29 row equals 03-01 (isha 86) | CONFIRMED | 87/86/86 in all three leap years; table 87 is the only table-vs-truth mismatch anywhere |
| Copy-03-01 scores 18/18, shipped mean-fill misses isha by 1 on all three | CONFIRMED | 18/18 vs 15/18, all three misses isha, +1 |
| Offsets key by MM-DD, not day-of-year | CONFIRMED | single-valued per MM-DD over 11 years; 24,105 vs 23,616 exact; 2036-12-25 -2 under DOY |
| "Blind-fitted to 2027 alone" | UNVERIFIABLE, immaterial | provenance cannot be tested; the tables are exactly the 2027 lead/lag and are stationary, so no decade information could be exploited |

## 10. Limits

- Provenance of the fit is not testable from the artifacts. Section 7 shows it cannot
  matter for the decade result.
- The 0.03 pp headline difference is not resolvable: it is 6 cells sitting within a
  fraction of a second of a half-minute boundary, where "correct" is undefined between two
  sound Meeus implementations.
- I did not evaluate the naive or fixed-offset baselines; they are not part of the claim.
