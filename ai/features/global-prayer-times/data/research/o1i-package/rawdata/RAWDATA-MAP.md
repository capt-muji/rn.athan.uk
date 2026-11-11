# Raw-data map — o1i round two (methods study vs raw government data)

Scope: machine-readable RAW government captures for the seven priority countries, normalized to
one JSON each. Schema of every country file below:

```json
{ "meta": { country, authority, source_files[], capture_agent, city, city_coords,
            years[], per_year_days{}, day_count, coverage{first,last}, notes[], ... },
  "days": { "YYYY-MM-DD": { "fajr": "HH:MM", "sunrise": "HH:MM", "dhuhr": "HH:MM",
                             "asr": "HH:MM", "magrib": "HH:MM", "isha": "HH:MM" } }
}
```

Times are wall clock exactly as published by the source (including DST transitions, flagged in
meta). Every file round-trip-parsed after write, with per-year counts re-derived from `days` and
checked against `meta`.

## Found and normalized

| file | city | years | days | source (archive) |
|---|---|---|---|---|
| saudi-arabia.json | Makkah | 2025, 2026, 2027, 2028 (Hijri 1447-1449) | 1064 | `s1-saudi/144{7,8,9}_21-4267_39-8317.json` (KACST Umm al-Qura API) |
| uae.json | Abu Dhabi | 2026 full + 2027 to 06-05 | 521 | `c19-year2/uae/raw-2026.json` (obs fields) + `c19-year2/uae/awqaf-2027.json` |
| kazakhstan.json | Astana | 2025, 2026, 2027, 2030, 2036 | 1826 | `c19-year2/kaz/astana-*.json` (muftyat.kz year tables) |
| jordan.json | Amman | 2012, 2013, 2021, 2022, 2023, 2024, 2025, 2026 | 579 | `c40-wayback/jo_master_v2.json` (awqaf.gov.jo via Wayback) |
| qatar.json | Doha | 2017, 2018, 2019, 2021, 2022, 2025, 2026 | 28 | `c40-wayback/qa_rows.json` (portal.moi.gov.qa today-API captures) |
| egypt.json | Cairo | 2026 | 365 | `ab-harvest/egypt-cairo-2026.json` |

Key caveats per country (full notes inside each file's meta):

- Saudi: Makkah chosen (Umm al-Qura seat). Riyadh series (same three Hijri years) and the
  synthetic Makkah fit point exist in `s1-saudi/` and are excluded, one city per file. isha is
  verbatim +120 inside the API's Ramadan, +90 outside.
- UAE: 2027 is partial because the AWQAF feed serves a ~207-day rolling horizon (2026-11-10
  capture). 59 other areas exist in the same files; excluded. 2026 read from the obs (feed)
  fields of raw-2026.json, 2027 from the feed capture directly.
- Kazakhstan: muftyat.kz has no server API; the tables are the site's own PrayTimes.js
  (15/15, Hanafi, AngleBased) rendered in-browser, DST defect patched during capture. 2030 and
  2036 carry the site's simple solar algorithm. Almaty and Shymkent series excluded.
- Jordan: scattered coverage (captured windows, not continuous years; 2025 strongest at 223
  days). Four surfaces with one platform change: 2012-2013 pre-rebuild sheets print a
  systematically narrower horizon pair. Times were 12-hour without markers; conversion rule and
  all checks recorded in meta.
- Qatar: 28 single-day captures across 7 years — thin by design, each payload prints one day.
  Three duplicate captures deduplicated, values identical. 163 of 168 cells sit within one
  minute of the c40 recipe (the five beyond are asr at exactly 2 minutes).
- Egypt: 2026 only. Published Cairo wall clock carrying Egypt DST (+59 min on 2026-04-24,
  -60 min on 2026-10-30, detected empirically). Arabic AM/PM markers converted.

## Not found (honest negatives)

- **Turkey — no Diyanet/awqatsalah government captures anywhere in the census.** Searched
  `turk*`, `diyanet*`, `awqatsalah` file names and content across the whole archive. Near
  misses, none of which are Turkish state data: `c15-jamiat/data/Turkey/istanbul-turkey.json`
  (Jamiatul Ulama South Africa perpetual calendar rendered for Istanbul, one month 2026-11,
  third-party body), `o1h-global/sim/out` and `o1h-global/verify/*/parts` TR-DIYANET files
  (fitted-recipe target minutes, not captures), `c36-dpt/threads/*.html` (forum threads),
  `adhan-4.4.6-src` fixtures. No file emitted.
- **Singapore — no MUIS captures anywhere in the census.** Searched `muis*`, `sg-*`,
  `singapore*`, and grep for muis content. Near misses: `o1h-global` SG-MUIS files are
  fitted-recipe target minutes, `c36-dpt/verify/sg-timetable.html` is Southgate Mosque
  (London), `c18-yeartables/` holds ccim/gms PDFs unrelated to MUIS. No file emitted.

Also searched per dispatch and negative for Saudi remnants: `ab-harvest/` holds cz/egypt/oman/
iran only; `c43-adversarial/` holds fit scripts and fit outputs (`out_ks_*.json`), no raw
captures; `c12-gulf/` holds haramain short-window captures, superseded by the s1-saudi
multi-year series.
