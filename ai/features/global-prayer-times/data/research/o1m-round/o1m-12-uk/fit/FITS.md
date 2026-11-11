# O1m-12 fit ledger

Engine for every row: adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`,
`Rounding.None`, TZ `Europe/London`, dates from the literal capture strings. `within` is the
winter-core percentage (Nov-Feb) at the stated angles and zero margins except where a margin is
named. `mae` in minutes. `worst` in minutes.

| surface | days | span | fajr | fajr within/mae | isha | isha within/mae | clock | grade |
|---|---|---|---|---|---|---|---|---|
| Jersey Islamic Centre | 334 | 2026-02-01..12-31 | 17.9 | 100 / 0.09 | 15.1 | 100 / 0.24 | dhuhr +4.5, asr Hanafi (mae 0.00), maghrib +5.5 | provisional |
| Aberdeen AMIC | 366 | 2024 full | 17.9 | 100 / 0.22 | 15.1 | 100 / 0.21 | dhuhr +5.4, asr Shafi, maghrib +5.4; night-fraction substitute Apr-Aug | provisional |
| Newport Diyanet | 366 | 2026 full | 17.9 | 100 / 0.08 | 16.1 | 98.3 / 0.64 | asr Hanafi | provisional |
| Lancaster, Masjid al-Noor | 365 | 2025 full | 15.0 | 98.3 / 0.64 | 15.0 | 100 / 0.44 | dhuhr +4.3, asr Hanafi, maghrib +4.5 | provisional |
| Leeds Islamic Centre | 363 | 2026 full | 18.0 | 95.0 / 0.72 | 15.0 | 97.5 / 0.85 | dhuhr +0.5, asr Hanafi, maghrib +5.0 | provisional |
| Halifax, Faizan e Madina | 366 | 2026 full | 18.0 | 99.2 / 0.11 | 18.0 | 93.4 / 1.02 | asr Hanafi | provisional (gate fail) |
| Burnley, Faizan e Madina | 366 | 2026 full | 18.3 | 90.9 / 0.60 | 18.1 | 99.2 / 0.55 | asr Hanafi | provisional (gate fail) |
| Preston, Quwwat-ul-Islam | 364 | 2026 full | 14.3 | 24.4 / 2.45 | 15.0 | 100 / 0.49 | asr Hanafi, maghrib +3, isha capped maghrib+60 in June | provisional on isha |
| Swansea Mosque | 365 | 2026 full | 14.7 | 47.5 / 2.17 | 14.0 | 91.7 / 0.78 | asr Hanafi | candidate |
| Milton Keynes (MKMA) | 365 | 2026 full | 15.0 | 29.2 / 2.17 | 13.75 | 76.7 / 0.94 | dhuhr +4.9, maghrib +1.4 | candidate |
| Oldham Central Masjid | 365 | 2026 full | 14.4 | 47.5 / 2.62 | 13.7 | 91.7 / 0.61 | asr Hanafi | candidate |
| Oldham Madina Institute | 51 | 2026-11-11..12-31 | 17.84 | 100 / 0.47 | 17.97 | 72.5 / 1.37 | asr Hanafi | candidate (short span) |
| Enniskillen, Iman Mosque | 366 | 2026 full | 17.8 | 72.7 / 1.04 | interval | - | - | candidate (gate fail) |
| Sheffield, Madina Masjid | 366 | 2026 full | 17.5 | 45.5 / 1.95 | 17.7 | 47.9 / 2.82 | asr Hanafi | candidate (gate fail) |
| Bolton, Zakariyya | 110 | 2026-11-11..2027-02-28 | 14.6 | 19.1 / 3.65 | 14.9 | 18.2 / 2.80 | asr Hanafi (100 / 0.32) | candidate |
| Hull, Hull Mosque & Islamic Centre | 31 | 2026-01 only | 13.8 | 38.7 / 2.52 | 11.2 | 41.9 / 2.19 | one static month | candidate |

## Shape notes

- **Angles that hold exactly**: Jersey and Aberdeen (18/15), Newport (17.9/16.1), Lancaster
  (15/15), Leeds (18/15), Halifax (18/18), Burnley (18.3/18.1).
- **Approximate pairs, scattered**: Preston fajr, Swansea, Milton Keynes, Oldham Central, Sheffield.
  A coordinate search on Oldham moved the optimum 2.6 km and improved the mae by 0.06, so the
  scatter is in the publisher's table, not in our point.
- **Interval tables**: Enniskillen isha (best constant angle 29.8% within 1); Wrexham September
  isha = maghrib + 80 exactly (sd 0.00); Leeds and Preston hold a fixed clock through the
  impossible-angle weeks; Aberdeen substitutes a night fraction (isha interval 47-50 min in June).
- **One generation, two places**: Milton Keynes and Swansea are offset by their own longitude
  (3.2 degrees apart, 11-15 minutes across every column) on the same 15/13.75-14.0 construction.
