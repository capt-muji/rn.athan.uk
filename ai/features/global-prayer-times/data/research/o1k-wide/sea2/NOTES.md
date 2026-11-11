# SEA-2 working notes (incremental)

## Indonesia (outer islands) — 10 Nov 2026

Captured via the KHGT API contract on record from the `indonesia` tag (POST
`api-khgt.muhammadiyah.or.id/api/sholat/schedule`, `{lat,lng,date:"YYYY-MM-DD",mode:"monthly_masehi"}`
returns one month; keyless; request shape verified live — a bare `YYYY-MM` date is IGNORED and
returns the current month, the full date is required).

- `khgt-banda-aceh-2026.raw.json`, `khgt-banda-aceh-2027.raw.json`: KOTA BANDA ACEH coordinate
  5.5587, 95.3277 (Kemenag's own city table), 365 rows per year, meta elevation 6 m, tz 7.
- `khgt-puncak-jaya-2026.raw.json`, `khgt-puncak-jaya-2027.raw.json`: KAB. PUNCAK JAYA coordinate
  -3.9833, 137.25 (Kemenag's own table), 365 rows per year, meta ELEVATION 3396 m (KHGT's own
  auto-detect, higher than Kemenag's 2422 m), tz 9.
- Normalized: `data/khgt-{2026,2027}-{banda-aceh,puncak-jaya}.json` (1,460 rows total).
  Jayapura 2026+2027 NOT re-captured — the `indonesia` tag already holds both
  (`indonesia/data/khgt-{2026,2027}-jayapura.json`, 365 rows each).

### Puncak Jaya second look (21/19 elevation rule): NEGATIVE WITNESS

Implied twilight angles (NOAA solar model, the same one the `indonesia` tag used):

| surface | coord elevation | fajr depression (med, range) | isha depression (med, range) |
|---|---|---|---|
| KHGT puncak-jaya 2026 | 3,396 m | 17.65 (17.37..17.92) | 18.36 (18.17..18.54) |
| KHGT puncak-jaya 2027 | 3,396 m | 17.65 (17.37..17.91) | 18.36 (18.16..18.55) |
| KHGT jayapura 2026 (lowland) | 117 m | 17.62 (17.38..17.91) | 18.35 (18.17..18.54) |
| KHGT banda-aceh 2026 | 6 m | 17.65 (17.40..17.86) | 18.35 (18.19..18.54) |
| KHGT banda-aceh 2027 | 6 m | 17.65 (17.39..17.88) | 18.35 (18.18..18.55) |

Muhammadiyah publishes the same 18/18-with-~+1.5-min-safety pair at the highland coordinate as at
sea level, despite auto-detecting a HIGHER elevation (3,396 m) than Kemenag's trigger (2422 m).
Both medians and full ranges coincide to two decimals across a 3,280 m elevation difference.

**Verdict: the 21/19 highland rule is Kemenag's alone.** No second publisher carries it; the
second national body explicitly does not. Any feeder that wants the highland deepening must take
it from Kemenag's table, never compute it from elevation.

### Banda Aceh behaviour (both years, identical character)

- imsak = subuh − 10 min on every one of the 730 days.
- isha − maghrib drifts 68..76 min across the year (angle behaviour, not a fixed interval).
- KHGT 2026 and 2027 are consistent year over year (same implied-angle ranges).

### Kemenag line for Puncak Jaya

The `indonesia` tag's `sihat-2026-all-cities-2dates.json` already holds KAB. PUNCAK JAYA rows for
both anchor dates (elevation 2422 m, 21/19 pair). The Bimasislam API serves 2026 only, so no
year-2 Kemenag row exists anywhere. Nothing further to capture on that line.
