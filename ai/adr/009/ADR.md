# ADR-009: Prayer time API landscape

**Status:** Superseded by the worldwide research of 2026-09-30 (queue row 42, awaiting owner decisions). Nothing here was built.
**Current as of:** 2026-10-07 (1.29.265)

## What it decided (2026-02-16)

A survey of prayer time APIs, mosque display platforms and libraries concluded:

1. Only prayer start times are needed, so scraping mosque websites (ADR-008) is unnecessary.
2. London keeps its unified timetable from the London Prayer Times API.
3. Everywhere else, the phone computes with the `adhan` library and its Moonsighting Committee method, with the AlAdhan API as a check.
4. No fixed offsets make that method match London's timetable, and the same held for Manchester, so UK timetables would have to be embedded as data.

Conclusions 1 and 2 still stand: nothing scrapes, and the app reads London's own timetable (`api/config.ts`).

## What replaced the rest

All paths are under `ai/features/global-prayer-times/`.

| Conclusion here | What the later research found | Recorded in |
| --- | --- | --- |
| One computed method for the world | No single method fits. The unit is a source: a named authority and its place. A computed source comes last. | `RECOMMENDATION.md` |
| An API as a check or fallback | No general API is justified. Each computes with the same libraries. | `RECOMMENDATION.md` |
| Congregation times are not needed | Showing them is a proposed step. They already arrive from the London API. | `RESUME-FROM.md` |
| London must be embedded as data | London's Fajr and Isha are intervals from sunrise and Maghrib. One small table reproduces fifty published years to within a minute. | `LONDON-LINEAGE.md` |
| The catalogue of APIs and platforms | A measured catalog of 39 sources in 30 countries. | `SOURCE-CATALOG.md` |

## One measurement no later document repeats

Hizbul Ulama's printed Manchester table against AlAdhan method 15 (Hanafi Asr, shafaq abyad), 357 days of 2026, with 8 days around the clock changes excluded. Offsets are the table minus the method, in minutes.

| Prayer | Range | Mean |
| --- | --- | --- |
| Fajr | -2 to +2 | -0.3 |
| Sunrise | -1 to +1 | 0.0 |
| Dhuhr | +4 to +6 | +5.0 |
| Asr | -1 to +2 | 0.0 |
| Maghrib | +2 to +5 | +3.1 |
| Isha | -71 to +3 | -19.6, and -65.3 in June |

The catalog holds no Hizbul Ulama source, and it marks its UK-wide source (`gb-wifaqululama`) as not measured.
