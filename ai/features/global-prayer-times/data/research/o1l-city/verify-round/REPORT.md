# O1l-71 adversarial verification of the round's five load-bearing finds

Agent O1l-71, 2026-11-11. Workspace `census/o1l-city/verify-round/`. No web, no clock reads, no
repository edits. Engine: adhan 4.4.6 at `census/adhan-build/node_modules/adhan/lib/esm/Adhan.js`,
`Rounding.None`, raw seconds converted to local wall clock through `Intl` offsets for the named
zone (never the process clock), then explicit per-column rounding. Every number below is a fresh
computation from the prior waves' data files; no prior block's arithmetic was reused.

Method note: adhan's `CalculationParameters` constructor is `(method, fajrAngle, ishaAngle)`.
Passing angles positionally as `(fajr, isha)` silently fixes fajr at 18 deg and nulls isha. That
mistake produced a false 2.5-minute fajr error on the first Saudi pass; it is corrected here and
recorded because any prior fit built the same way would carry it.

## 1. Turkey, 81 provinces on one recipe: CONFIRMED

Ten provinces re-parsed from `o1l-15r/data/tr-2026-<province>.json`, re-fit with
`CalculationMethod.Turkey()` (18/17, sunrise -7, dhuhr +5, asr +4, maghrib +7), Shafi,
`Europe/Istanbul`, nearest minute. 21,900 cells.

| province | lat | exact % | within-1 % | MAE | worst |
| --- | --- | --- | --- | --- | --- |
| istanbul | 41.0064 | 58.04 | 96.07 | 0.459 | 2 |
| ankara | 39.9208 | 59.04 | 97.03 | 0.439 | 2 |
| izmir | 38.4193 | 61.32 | 97.95 | 0.407 | 2 |
| antalya | 36.8866 | 62.74 | 97.17 | 0.401 | 2 |
| trabzon | 41.0055 | 57.17 | 95.57 | 0.473 | 2 |
| sinop | 42.0266 | 58.54 | 95.53 | 0.459 | 2 |
| hatay | 36.2025 | 64.57 | 98.22 | 0.372 | 2 |
| van | 38.5009 | 65.16 | 98.04 | 0.368 | 2 |
| kars | 40.6071 | 60.91 | 97.58 | 0.415 | 2 |
| igdir | 39.9219 | 61.42 | 97.99 | 0.406 | 2 |

Pooled exact 60.89 %, within-1 97.11 %, worst 2 on all ten. Within-1 95.53-98.22 against the
reported 95.2-99.4 band, MAE 0.368-0.473 against 0.361-0.482, worst 2 everywhere. Per-prayer
pooled MAE: fajr 0.113, sunrise 0.146, dhuhr 0.104, asr 0.735, maghrib 0.616, isha 0.806, with
fajr/sunrise/dhuhr 100 % within one minute and the ±1 spread confined to asr/maghrib/isha. That
is the reported shape: a fixed temkin set against a lengthening twilight, no deviating province,
no latitude-keyed switch. Iğdır at its true 39.9219/44.0436 reproduces at MAE 0.406; the
recorded Nominatim defect (36.3669/30.2858) is real and the correction is right.
Integrity: 81 files, 29,565 rows, zero malformed cells.

## 2. Saudi 43 points and the Ramadan interval: CONFIRMED (naming PARTIAL)

Six points re-fit from `saudi-cities/data/sa-<city>-rows.json`, recipe Other(18.5, 18), Shafi,
`Asia/Riyadh`, `floor(raw + 1)` on five columns and `floor(raw)` on sunrise, isha = maghrib +
interval. 25,524 cells.

| city | lat | exact % | within-1 % | MAE | worst |
| --- | --- | --- | --- | --- | --- |
| turaif | 31.6725 | 81.85 | 99.91 | 0.182 | 2 |
| arar | 30.99 | 82.82 | 99.91 | 0.173 | 2 |
| sakaka | 29.97 | 83.59 | 99.81 | 0.166 | 2 |
| al-khobar | 26.2794 | 84.30 | 99.95 | 0.157 | 2 |
| jizan | 16.89 | 87.19 | 100.00 | 0.128 | 1 |
| samtah | 16.60 | 87.64 | 100.00 | 0.124 | 1 |

Exact 81.85-87.64 against the reported 81.9-87.7, within-1 99.81-100.00 against 99.8-100, MAE
0.124-0.182 against 0.123-0.182. Reproduced to the third decimal on all six.

Ramadan interval, printed `isha - maghrib`: exactly two values at every one of the six, 90 on 651
days and 120 on 58 days. The 120 runs are contiguous, 29 days each, and land on the same dates at
all six points: 2027-02-08..2027-03-08 and 2028-01-28..2028-02-25. Zero violations, zero other
values, month-exact and city-exact. CONFIRMED.

Naming defect: `cities.json` holds 43 points but only 13 distinct `gov` values, which are the 13
regions. The find is 43 governorate-level points across 13 regions, not "43 governorates". The
report's own body says "governorate-level points"; the mission's label overstates it.

## 3. Thailand, 77 provinces and 166,433/166,434: CONFIRMED (one leap cell differs)

Full 77-province re-fit, not a sample, because the claim is a national count. Recipe Other(19.8,
18.1), Shafi, `Asia/Bangkok`; fajr and isha nearest, sunrise/dhuhr/asr/maghrib ceiling. Nan scored
at the implied point 18.70/100.66, since its printed longitude is 3 degrees out.

| block | printed values | exact | within 1 | worst |
| --- | --- | --- | --- | --- |
| normal (all 77, Nan included) | 168,624 | 140,559 (83.36 %) | 168,623 | 2 |
| normal, Nan's 2,190 removed | 166,434 | - | **166,433** | 2 |
| leap (all 77) | 169,092 | 140,111 (82.86 %) | 169,080 | 2 |
| leap, Nan's 2,196 removed | 166,896 | - | 166,884 | 2 |

The 166,433 of 166,434 figure is reproduced exactly: one cell in the whole normal block exceeds
one minute, `chonburi 2026-06-25 fajr` model 265 printed 263, the artefact the report names.
Nan at its printed 18.7333/103.75 scores 0.00 % within one minute, MAE 12.00, worst 13, and at the
implied point 2,190 of 2,190 within one minute, so the longitude defect is confirmed as stated.

Leap block: I find 12 cells over one minute where the report lists 11. The extra cell is
`kalasin/leap 2028-04-19 sunrise` model 351 printed 353; the other eleven match the report's list
(chonburi 2028-06-28 and 2028-07-07 fajr, kalasin sunrise on 03-11, 03-15, 03-19, 03-28, 04-01,
04-09, 04-16, kalasin isha 09-09, krabi asr 08-31). So 166,884 not 166,885. The headline claim is
unaffected; the leap sub-count is one cell low.

## 4. Egypt, 78 cities at 100 % within one minute: CONFIRMED

Ten cities re-fit from `egypt-82/data/eg-esa-<i>-2026.json`, recipe Other(19.5, 17.5), Shafi,
`Africa/Cairo` (DST inside the span), nearest per column. The publisher prints no coordinate, so
each city's point was re-derived here by my own grid search minimising the joint
sunrise+dhuhr+asr error, then the full year scored at that point. 21,900 cells.

| i | city | implied lat | implied lon | km from gazetteer | exact % | within-1 % | MAE | worst |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | القاهرة | 30.063 | 31.285 | 3 | 90.1 | 100.00 | 0.099 | 1 |
| 8 | المنيا | 28.117 | 30.753 | 3 | 92.6 | 100.00 | 0.074 | 1 |
| 16 | السلوم | 31.554 | 25.158 | 0 | 90.9 | 100.00 | 0.091 | 1 |
| 24 | بلطيم | 31.356 | 31.089 | 22 | 92.1 | 100.00 | 0.079 | 1 |
| 32 | برنيس | 23.721 | 35.499 | 25 | 92.0 | 100.00 | 0.080 | 1 |
| 40 | موط (الداخلة) | 25.467 | 28.904 | 8 | 90.4 | 100.00 | 0.096 | 1 |
| 48 | السويس | 30.024 | 32.526 | 6 | 87.9 | 100.00 | 0.121 | 1 |
| 56 | الدلنجات | 30.793 | 30.536 | 4 | 90.4 | 100.00 | 0.096 | 1 |
| 64 | الفشن الجديدة | 28.843 | 30.679 | 22 | 87.4 | 100.00 | 0.126 | 1 |
| 77 | غرب النوبارية | 30.670 | 29.675 | 26 | 89.2 | 100.00 | 0.108 | 1 |

Every one of the 21,900 cells is within one minute, worst 1, every column unbiased. Pooled exact
90.3 % per cell. The 100 % claim is confirmed on ten cities spanning 23.7-31.6 N and 25.2-35.5 E.

Coverage count from the manifest: 82 options, 77 with 365 rows, 4 empty (منوف, ديرب نجم, ابو تشت,
سمالوط), 1 with 363 (مدينة 15 مايو, missing 2026-03-20 and 2026-05-26). So "78 cities" is 77 full
plus one partial. The report's phrase "serving a full 2026 year" is loose for the 78th; the count
and the named missing days are right.

## 5. Indonesia, 38 capitals on Kemenag 20/18+2 and the +8 gap: CONFIRMED, rounding label REFUTED

Eight capitals re-fit from `indonesia-cities/data/sihat-2026-<city>.json` at each row's own
`lat/lng/tz`, recipe Other(20, 18), Shafi, ihtiyati +2 fajr, +2 isha, +3 dhuhr, +2 asr. 11,680
cells.

| city | tz | fajr exact % | fajr within-1 | isha exact % | isha within-1 | pooled exact % |
| --- | --- | --- | --- | --- | --- | --- |
| jakarta-pusat | Asia/Jakarta | 99.2 | 100.00 | 98.1 | 100.00 | 94.2 |
| banda-aceh | Asia/Jakarta | 99.7 | 100.00 | 99.2 | 100.00 | 94.6 |
| medan | Asia/Jakarta | 99.5 | 100.00 | 98.9 | 100.00 | 94.7 |
| bandung | Asia/Jakarta | 97.0 | 100.00 | 99.5 | 100.00 | 94.2 |
| surabaya | Asia/Jakarta | 99.2 | 100.00 | 98.6 | 100.00 | 94.9 |
| makassar | Asia/Makassar | 98.9 | 100.00 | 98.4 | 100.00 | 95.3 |
| kupang | Asia/Jakarta | 98.6 | 100.00 | 99.5 | 100.00 | 95.1 |
| jayapura | Asia/Jayapura | 98.1 | 100.00 | 98.6 | 100.00 | 96.6 |

The 20/18+2 claim holds: fajr 97.0-99.7 % exact and isha 98.1-99.5 % exact, both 100 % within one
minute, zero cells over one minute in 11,680, worst 1. Dhuhr (+3) and asr (+2) also 100 % within
one minute.

The rounding label is wrong. With the report's stated `floor`, fajr scores 48.5 % exact and MAE
0.515 at Jakarta; with `nearest` it scores 99.7 % exact and MAE 0.003. The publisher rounds to the
nearest minute, not down. The reported exactness figures are right; the word "floor" is not.

KHGT minus SIHAT fajr, 365 days each: +7.95, +7.97, +7.92, +7.93, +7.99, +7.95, +7.90 for seven
capitals, band [7..9] everywhere. **Kupang is the failing cell at +68.06** (band [67..69]), which
is the recorded wrong-zone render: SIHAT serves Kupang on the WIB clock, so the true +8 sits under
a 60-minute zone error. The gap claim is confirmed for the seven and confirmed-with-caveat for
Kupang; it is not 38/38 on raw subtraction.

## Verdict table

| find | verdict | re-measured |
| --- | --- | --- |
| O1l-15r Turkey, 81 provinces one recipe | CONFIRMED | 10 provinces, 21,900 cells, within-1 95.53-98.22 %, MAE 0.368-0.473, worst 2 |
| O1l-40 Saudi, 43 points one recipe | CONFIRMED | 6 points, 25,524 cells, exact 81.85-87.64 %, within-1 99.81-100 %, MAE 0.124-0.182 |
| O1l-40 Saudi, Ramadan 90/120 | CONFIRMED | 90 x 651, 120 x 58 at all six; runs 2027-02-08..03-08 and 2028-01-28..02-25, 29 d each |
| O1l-40 Saudi, "43 governorates" | PARTIAL (naming) | 43 points, 13 distinct regions |
| O1l-2 Thailand, 166,433/166,434 | CONFIRMED | all 77 re-fit: 168,623/168,624, minus Nan 2,190 = 166,433/166,434; one failing cell chonburi 2026-06-25 fajr |
| O1l-2 Thailand, leap block 166,885 | PARTIAL | 166,884; extra failing cell kalasin/leap 2028-04-19 sunrise |
| O1l-14 Egypt, 78 cities 100 % | CONFIRMED | 10 cities, 21,900 cells, 100.00 % within 1, worst 1 |
| O1l-14 Egypt, "78 full years" | PARTIAL (wording) | 77 full + 1 at 363 days (مدينة 15 مايو) |
| O1l-3 Indonesia, 20/18+2 at 38 capitals | CONFIRMED | 8 capitals, fajr 97.0-99.7 % exact, isha 98.1-99.5 %, both 100 % within 1 |
| O1l-3 Indonesia, "floor" rounding | REFUTED | nearest; floor scores 48.5 % exact, nearest 99.7 % |
| O1l-3 Indonesia, +8 min KHGT gap | CONFIRMED with caveat | +7.90..+7.99 on seven; Kupang +68.06 (wrong-zone render) |

## Files

- `lib.mjs` shared engine and scoring; `turkey.mjs`, `saudi.mjs`, `thailand.mjs`,
  `thailand-all.mjs`, `egypt.mjs`, `indonesia.mjs`, `integrity.mjs` the five re-fits.
- `probe_*.mjs` the diagnostics behind the adhan constructor bug, the Saudi fajr angle curve, the
  Indonesia rounding sweep.
- `logs/*.log` the captured output of each run.
