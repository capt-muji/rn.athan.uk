# fit/ — o1m-20

Two fits ran this wave.

## 1. Malaysia — Perak 2027, seven zones

- `perak-2027-fit.json` — recipe, per-zone per-prayer offsets and scores.
- Rows: `../data/perak-2027-rows.json` (2,548 dated rows, 364 per zone, zero weekday rejections).
- Parser: `../parse_perak.py`. Fitter: `../fit_perak.mjs`. Angle sweep: `../sweep.mjs`.

Recipe: adhan 4.4.6, `CalculationMethod.Singapore` (fajr 20, isha 18), `Madhab.Shafi`,
`Rounding.None`, `HighLatitudeRule.MiddleOfTheNight`, tz `Asia/Kuala_Lumpur`, plus each zone's
measured ihtiyat. Worst residual 2 minutes across 21 zones-columns.

Two printed conventions: imsak is subuh minus exactly 10 minutes on all 2,548 rows; the afternoon
and evening clocks print on a 12-hour dial (`1:22` = zohor 13:22).

Grade **A**: seven distinct zones, one recipe, one full published year.

## 2. Algeria — MARW calendars

- `algeria-marw-fit.json` — recipe, per-prayer offsets, per-column scores for four sheets.
- Rows: `../data/algeria-marw-rows.json`.
- Parser: `../parse_dz2.py`. Fitter: `../fit_dz3.mjs`.

Recipe: adhan 4.4.6, `CalculationMethod.MuslimWorldLeague` (fajr 18, isha 17), `Madhab.Shafi`,
`Rounding.None`, `HighLatitudeRule.MiddleOfTheNight`, tz `Africa/Algiers`, plus the ministry's
printed ihtiyat measured per prayer (dhuhr +0, fajr +1, sunrise +1, isha +1, maghrib +4).

| City | Cycle | Rows | Grade |
| --- | --- | ---: | --- |
| Alger | 1447 | 175 | A (two cycles, one recipe) |
| Alger | 1448 | 163 | A |
| Adrar | 1447 | 189 | provisional |
| Djelfa | 1447 | 205 | provisional |

Engine source of truth for both: `$HOME/athan-gitree/census/adhan-build/node_modules/adhan` (4.4.6).
