# verify2: three spot checks on banked data

Binding: `FIT-RULES.md`. Engine: adhan 4.4.6 at `census/adhan-build/node_modules/adhan`, second
resolution, explicit `floor`/`ceil`/`nearest` after the fact, no clock read anywhere. Every run
pins `TZ` before node starts (`Asia/Riyadh`, `Asia/Jakarta`, `Asia/Baghdad`), and the local-civil
conversion reads the IANA offset from the instant, not from the pin. Raw output in
`sa-cities.json`, `khgt-aceh.json`, `iq-oct.json`. Runners: `sa.mjs`, `khgt.mjs`, `iq.mjs`,
shared engine `lib.mjs`.

Nothing here was refitted freely except where a line says so, and no capture was re-taken.

---

## 1. Saudi off-anchor: does one recipe serve all four cities?

Data: Makkah (21.4267, 39.8317) and Riyadh (24.7136, 46.6753) from `census/s1-saudi`
(1448 and 1449 captures, the fit anchors), Medina (24.4672, 39.6111) and Jeddah
(21.4858, 39.1925) from `gulf2/data`. The two `gulf2` files were re-derived from their raw
captures cell for cell before use: 709 rows per city, no disagreement.

Recipe, verbatim from `deep1` job 3, unchanged:

```
fajr 18.5, Shafi asr, MiddleOfTheNight
fajr, dhuhr, asr, maghrib = floor(raw + 1);  sunrise = floor(raw)
isha = maghrib + 90, and + 120 on the capture's own hijri month 9
```

The two isha formulations (interval on the raw sunset, or on the rounded maghrib) are
arithmetically identical for an integer interval, so the pair predicts the same minute.

| City | Rows | Pooled exact | Within 1 (lowest column) | Fajr exact | Isha exact | Worst cell | Free fajr fit | Implied fajr depth |
|---|---|---|---|---|---|---|---|---|
| Makkah | 709 | 85.8% | 100% | 60.5% | 97.0% | 1 min | 18.46 | 18.39 (18.19..18.59) |
| Riyadh | 709 | 85.1% | 100% | 56.4% | 95.9% | 1 min | 18.46 | 18.38 (18.18..18.60) |
| Medina | 709 | 85.3% | 100% | 55.0% | 97.3% | 1 min | 18.46 | 18.38 (18.18..18.60) |
| Jeddah | 709 | 86.1% | 100% | 64.2% | 96.9% | 1 min | 18.49 | 18.39 (18.19..18.57) |

Per-year breakdown (within 1, all six columns): 100% in 1448 and in 1449 at all four cities.
Span covered: 709 days per city, 2026-06-16 to 2028-05-24, 2,836 city-days in all and 1,418
rows at the two new anchors. `Free fajr fit` scans the angle alone, with the rounding and the
margin held at the recipe.

Structural checks, all four cities:

- `isha - maghrib` is exactly 90 minutes on 651 days and exactly 120 on 58, zero other values,
  and the 120s are exactly the capture's hijri month 9 days. Zero switch-day mismatches.
- `Intl islamic-umalqura` reproduces the capture's own `hijriDate.month` on 2,836 of 2,836
  day-cells, so the Ramadan rule is reproducible offline without the capture's field.
- The margin each printed minute demands at floor has a median of 0.48 to 0.62 at all four
  coordinates, a spread of 0.14 min across 3,000 km. No single floor margin reproduces every
  day in any city or column (the intersection is empty by 0.55 to 1.72 min), which is the
  almanac quantisation Bahrain showed: that is why exact tops out near 86% while within-1 is
  total. The digit itself is not in doubt at 0.01 degree between the anchors and the new cities.

Seasonal amplitude (fajr, printed): the Jan mean to Jul mean span is 78 min at Makkah, 91 at
Riyadh, 90 at Medina, 78 at Jeddah. Full monthly swing 89 to 103 min.

**Verdict: yes, one recipe serves all four cities.** 18.5 floor+1 with the 90/120 interval
holds at 100% within 1 on every column of 2,836 days, and each city's own free fit lands
within 0.04 degree of 18.5.

---

## 2. Muhammadiyah at the north-west anchor

Data: `sea2/data/khgt-{2026,2027}-banda-aceh.json`, 730 rows. The surface computes at its own
detected coordinate 5.558704, 95.327713 (elevation 6 m, UTC+7), so that is the scoring
coordinate. The briefed 5.5483, 95.3238 is scored separately below.

Recipe, verbatim from `deep3` job 1 (fitted at Jakarta, Surabaya and Jayapura over 2025-2035):

```
fajr 18.0 degrees, isha 18.0 degrees, ceil to the minute, plus one minute of safety
```

| Year | Rows | Fajr exact | Fajr within 1 | Fajr MAE | Isha exact | Isha within 1 | Isha MAE |
|---|---|---|---|---|---|---|---|
| 2026 | 365 | 98.6% | 100% | 0.014 | 99.2% | 100% | 0.008 |
| 2027 | 365 | 98.1% | 100% | 0.019 | 98.4% | 100% | 0.016 |

Worst cell 1 minute in both years, both columns. The decade fit's own rate at the three
fitting cities was 97.1% fajr exact, so the north-west anchor sits above it.

The sharper test is the margin the print demands at ceil. At Banda Aceh it is **1.000 min in
2026 and 1.017 in 2027**, the same two values the decade fit recorded at its 2025 and 2027
samples, a wander of one second. The knife edge is reproduced at a fourth, far-away
coordinate. Isha needs 1.000 in 2026 and 0.967 in 2027, one day a second on the wrong side,
again exactly the fit's signature.

Structure and the rest of the table:

- `imsak = fajr - 10` on 730 of 730 rows.
- Implied depression from the printed minutes: fajr 17.65 (2026) and 17.66 (2027), isha 18.35
  both years. `sea2/NOTES.md` measured the same two numbers independently, so the harnesses
  agree.
- Other columns at one rounding family: sunrise floor+0 100% within 1, dhuhr floor+2 100%,
  maghrib nearest+2 100%, asr floor+2 99.5% (two days at 2 min, same rate in both years).

Coordinate sensitivity: at the briefed 5.5483, 95.3238 the same cell gives fajr 99.2% (2026)
and 98.9% (2027) exact, isha 97.8% and 97.5% exact, 100% within 1 in both years. The choice of
coordinate does not move the verdict.

Seasonal amplitude: fajr Jan mean 340.6 min against Jul 318.9, a span of 21.7 min at 5.5 N.

**Verdict: the decade recipe holds unchanged at the north-west anchor.** 18/18 at ceil+1,
100% within 1 in both years, and the one-minute margin sits on the same second as at the three
fitting cities.

---

## 3. Iraq: the fitted recipe on October's 31 rows

Data: `mideast/data/iq-diwan-october-2026.json`, 31 rows, 2026-10-01 to 2026-10-31, checked
cell for cell against `mideast/captures/iq-diwan-days/` with zero mismatches. Baghdad
33.3152, 44.3661, Asia/Baghdad.

The fitted config is taken from `census/n2f-topup/out/iq-report.json` (`bestCfg`), the 365-day
fit record, not from memory: fajr 18.1 floor+1, dhuhr nearest+5, Shafi asr nearest+4,
maghrib nearest+3, isha 16.9 nearest+1, sunrise floor+0.

| Column | October exact | October within 1 | October MAE | Year 365 exact | Year 365 within 1 | P(exact or fewer) |
|---|---|---|---|---|---|---|
| fajr | 31/31 | 100% | 0.000 | 84.9% | 100% | 1.000 |
| dhuhr | 25/31 | 100% | 0.194 | 61.9% | 100% | 0.993 |
| asr | 10/31 | 100% | 0.677 | 55.9% | 100% | 0.007 |
| maghrib | 13/31 | 100% | 0.581 | 67.9% | 100% | 0.003 |
| isha | 2/31 | 100% | 0.935 | 84.4% | 100% | <0.001 |

Within-1 is total on every column of the month, worst cell 1 minute. The exact rates for asr,
maghrib and isha sit below the year's, and the residual histograms show why: they are
one-sided, `fajr {0:31}`, `dhuhr {0:25, +1:6}`, `asr {0:10, +1:21}`, `maghrib {0:13, +1:18}`,
`isha {0:2, +1:29}`. A rounding-label difference would scatter both signs. A one-sided `+1`
means the continuous offset moved.

October's own reading, with the angles and offsets held:

- fajr: 18.1 is the MAE-optimal angle on the month, exact 31/31, and the within-1 band runs
  17.9 to 18.3. Confirmed.
- isha: at 16.9 the month prints the minute with **zero** margin (nearest), exact 29/31,
  MAE 0.065, within 1 on 31/31. The fitted +1 is one minute late on 29 of 31 days.
- Offsets the month asks for: fajr floor+1, dhuhr nearest+5, asr floor+4 or nearest+3,
  maghrib floor+3, isha nearest+0 (equivalently floor+0.5). fajr and dhuhr match the fit
  exactly. asr at the fit record's +4 gives 32.3% exact, at the prose's +3 it gives 67.7%,
  both 100% within 1. maghrib and isha at floor instead of nearest with the same offset give
  96.8% and 93.5% exact.
- Implied depression from the printed minutes: fajr 17.96, isha 16.78, both consistent with
  18.1 and 16.9 plus their rounding bias. The angles are right, the isha margin is what moved.
  With the margin held at the fit's +1, the angle band that keeps 100% within 1 runs 16.55 to
  16.9, so 16.9 sits at its shallow edge, which is the same statement from the angle side.
- The standing 18/17 pair also holds on the month: fajr exact 48.4%, isha exact 67.7%, both
  100% within 1.

Caveat, stated because it bounds the claim: the 365-day fit covers all of 2026, October
included, so this is a replay of a fitted month, not a holdout. The 31 rows carry no
independent evidence about the year fit's horizon. What they do show is that the constants are
stable on a fresh month, with one named exception.

**Verdict: the fit holds on October at the record's own standard, 100% within 1 on every
column, and both amended angles are confirmed. The recorded isha margin is a minute over:
October prints 16.9 with a zero margin.**

---

## Assumptions

- The Saudi anchors are the fit's own captures, read from `census/s1-saudi` rather than from
  the `gulf2` report's prose, because the four-city comparison needs one harness on one span.
- Banda Aceh is scored at the coordinate the publisher computed with (5.558704, 95.327713),
  since the question is whether the recipe reproduces the print, not the brief's rounding of
  the coordinate. The briefed coordinate is scored beside it.
- The Iraqi fitted config is read from `bestCfg` in the year fit record, not from
  `mideast/REPORT.md`'s prose, which records asr +3 where the fit record holds +4. Both are
  scored on the month, and both keep within 1.
- "Within 1" means an absolute error of one minute or less, the standard every other fit in
  this programme used.

## Progress

| Task | Status |
| --- | --- |
| Read FIT-RULES and the three banks | done |
| Saudi four-city score (2,836 days) | done |
| KHGT Banda Aceh score (730 days) | done |
| Iraq October replay (31 days) | done |
| Deliverables written | done |
