# Indonesia, deep pass (tag `indonesia`)

Scope: confirm and extend the census record for Indonesia. Read-only against the census table
`world-table-v2.md`. All captures under `captures/`, normalized rows under `data/`.

## 1. Reach and its limits

Kemenag runs behind two separate hosts. `bimasislam.kemenag.go.id` answers (WAF IP
103.7.13.61) and serves a keyless JSON API. Every other `*.kemenag.go.id` host, including the
main portal and all 34 provincial and kabupaten offices tested, resolves to 103.7.13.251 and
refuses connections from this network on 443 and returns 504 on 80. Provincial and kabupaten
pages are therefore recorded from search indexes only, never captured.

`jadwalsholat.nu.or.id` (NU Online) sits behind a Vercel Security Checkpoint. A headless browser
and a normal browser session both returned "Failed to verify your browser, Code 21". Not solved,
not attempted further.

No PDF toolchain exists in this environment (`pdftotext`, `mutool`, `gs`, Python PDF packages
all absent) and installing one was not permitted. One PDF was captured and its scope verified
from its own landing page, but its text is not extracted.

## 2. Surface table

| # | Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|---|
| 1 | Bimas Islam, Ditjen Bimas Islam, Kemenag | `bimasislam.kemenag.go.id/api/v1/public/prayer-times?city_id=&date=` | official | fajr, sunrise, dhuhr, asr, maghrib, isha, one row per city per date, plus `source: precompute:v1` | **exactly 2026-01-01 to 2026-12-31, nothing outside** |
| 2 | Bimas Islam city table | `/api/v1/public/cities` | official | 516 regencies in 35 provinces, each with lat, lng, elevation, IANA zone | 2026 snapshot |
| 3 | Majelis Tarjih dan Tajdid PP Muhammadiyah, KHGT portal | `api-khgt.muhammadiyah.or.id/api/sholat/schedule` (POST lat, lng, date, mode) | authority (second national body) | imsak, subuh, terbit, dhuha, dzuhur, ashar, maghrib, isya, per date, any coordinate | 2025 to 2035 tested, all served |
| 4 | KHGT portal documentation | `api-khgt.muhammadiyah.or.id/docs` | authority | method statement, endpoint contract, markaz global, 5 deg / 8 deg hilal criteria | current |
| 5 | Lembaga Falakiyah PCNU Bojonegoro | `falakiyah.nubojonegoro.or.id`, almanac 2027 PDF via Google Drive | community, NU branch | landing page states the 2027 almanac carries the Bojonegoro prayer table, hilal positions, eclipses | 2027 (PDF captured, text not extracted) |
| 6 | NU Online | `jadwalsholat.nu.or.id/<kab-or-kota>/<year>/<month>` | authority tier by publisher (PBNU), capture blocked | imsak, subuh, terbit, dhuha, zuhur, ashar, maghrib, isya, method printed as "Lembaga Falakiyah NU" | 2027 pages indexed for many regencies, `/imsakiyah` claims Ramadhan 1448 from 8 Feb 2027 for 514 regencies |
| 7 | Masjid Istiqlal Jakarta | `istiqlal.or.id` home widget | community, mosque | today's six times, computed live from `api.aladhan.com/v1/timings?method=2` | rolling |
| 8 | Masjid Istiqlal Ramadhan page | `istiqlal.or.id/ramadhan` | community, mosque | 1447 H imsakiyah table, 5 columns | Ramadhan 1446 only |
| 9 | Universitas Muhammadiyah Malang, AIK | `aik.umm.ac.id/referensi/jadwal-waktu-sholat-2026/` | community, university | 12 monthly pages, 2026 | 2026 |
| 10 | equran.id prayer API | `equran.id/api/v2/shalat` (POST provinsi, kabkota, bulan, tahun) | community, derivative | 517 kab/kota, 34 provinces, seven columns | 2026 and 2027 both answered |
| 11 | Kemenag Jatim file tree (Wayback) | `jatim.kemenag.go.id/file/file/<Kab>/<Kab>.pdf` | official, archived | per-kabupaten full-year tables in the standard national layout | 2020 and older in the archive |
| 12 | Falak ABI | `falak-abi.id/waktu-shalat/` | community, falak practitioners | none fixed, coordinate-driven calculator | n/a |

## 3. What confirms the census record

**The pair 20/18 is confirmed, and now measured, not assumed.** Feeding 365 days of 2026 for
five cities through a solar model that reproduces the published Asr to a median 0.03 minutes
(2 seconds, p5 to p95 0.02 to 0.04 minutes) gives the offset between the published twilight
times and the exact 20 deg and 18 deg crossings:

| Publisher | fajr against 20 deg | isha against 18 deg |
|---|---|---|
| Kemenag SIHAT | +2.0 min later (Jakarta, Surabaya, Medan), +1.9 (Makassar), +1.5 (Jayapura) | +2.0, +2.1, +2.0, +1.9, +1.5 |

So the published table is the 20/18 geometry with a positive offset of about two minutes, which
is the size of a one-minute ceiling plus a stated safety margin. The pair itself is arithmetic,
not inference: shifting fajr from 20 deg to 18 deg moves it 8 minutes later, and that is exactly
what the second publisher prints.

**The 516-regency uniformity holds, and is now exhaustive.** Two anchor dates (15 June and
21 December 2026) over all 516 cities: the implied twilight angles sit within 0.15 deg of the
national value at every latitude from 6 N to 11 S. No regency carries a different pair except
the six in section 4.

**The 2026-only ceiling is confirmed, at a sharper boundary than "2026 only".** The SIHAT API
returns rows for 2026-01-01 and 2026-12-31 and "prayer times not found for the given city and
date" for 2025-12-31 and 2027-01-01. The row actually served carries `source: precompute:v1`
and `calculated_at: 2026-06-03`, so this is a precomputed table, not a live calculator. There is
no year-2 to fetch.

**The SIHAT app is not needed and was not touched.** The same numbers are on the public JSON
API with no login, no key, no app install.

## 4. What is new

**4.1 The six-regency anomaly is a pair, not an isha-only shift, and it is elevation-keyed.**
The census line reads "one degree higher isha". Measured over all 516 regencies on two dates,
both twilights deepen by 1.0 deg in the same six places:

| Regency | Province | Elevation | fajr | isha |
|---|---|---|---|---|
| Kab. Puncak Jaya | Papua | 2,422 m | 21 deg | 19 deg |
| Kab. Puncak | Papua | 2,346 m | 21 deg | 19 deg |
| Kab. Intan Jaya | Papua | 2,168 m | 21 deg | 19 deg |
| Kab. Lanny Jaya | Papua | 2,001 m | 21 deg | 19 deg |
| Kab. Pegunungan Arfak | Papua Barat | 1,960 m | 21 deg | 19 deg |
| Kab. Paniai | Papua | 1,786 m | 21 deg | 19 deg |

The trigger is the elevation, not the region. The next highest regency, Kab. Deiyai at 1,718 m,
sits at the national pair to within 0.04 deg, as do Jayawijaya (1,668 m), Tolikara (1,571 m),
Dogiyai (1,544 m) and every highland outside Papua (Humbang Hasundutan 1,402 m, Bener Meriah
1,392 m, Pegunungan Bintang 1,324 m). Pegunungan Arfak is in Papua Barat, so "Papuan regencies"
is not the boundary either. Subtracting the extra 1.0 deg puts all six inside the normal national
safety band (+1.55 to +2.02 minutes), which is what makes the reading safe rather than a
modelling artefact.

**4.2 Muhammadiyah publishes a keyless full-year prayer API, and its method differs.**
`api-khgt.muhammadiyah.or.id` returns a whole month per POST for any coordinate, keyless, no
login, with elevation auto-detected from the coordinate. Against Kemenag over 365 days in five
cities:

| Column | KHGT minus SIHAT | Reading |
|---|---|---|
| fajr | +8 min later, every day, all five cities, sd 0.5 | the pair differs in fajr only |
| isha | 0 to -1 min, 124 to 208 days of 365 exactly equal | same 18 deg isha |
| sunrise | +2 | different horizon convention |
| dhuhr | -1 to -2 | different rounding |
| maghrib | -1 to 0 | |
| asr | 0 (221 to 284 days identical) | same Shafi rule |

Fitted, KHGT is **18/18 with about +1.5 minutes of safety**, against Kemenag's **20/18 with
about +2.0**. The whole Muhammadiyah and Kemenag divergation concentrates in Subuh: 8 minutes.
This is the "method difference is a finding" case, and it is dated output from two national
bodies, not a statement of intent.

**4.3 Masjid Istiqlal prints ISNA 15/15, not the Ministry's pair.** The national mosque's live
prayer clock on its own homepage calls `api.aladhan.com/v1/timings?method=2` with the visitor's
coordinates. Method 2 is ISNA, fajr 15 deg and isha 15 deg, confirmed in the response metadata.
For Jakarta on 2026-11-10 that yields fajr 04:25 and isha 18:48 against Kemenag's 04:06 and
19:03. The national mosque therefore runs 19 minutes later at Subuh and 15 minutes earlier at
Isya than the ministry that publishes the national table. Its Ramadhan page publishes a separate
five-column imsakiyah table, so the mosque carries two surfaces that need not agree. Treat any
Istiqlal number as mosque-layer, never as authority.

**4.4 The provincial and kabupaten offices publish full-year PDFs on a November cadence, and
the 2027 editions had not appeared on 10 November 2026.** Kanwil Kemenag Gorontalo lists "Jadwal
Shalat 2026 Gorontalo" as a PDF dated 17 November 2025, and Kanwil Sumsel and Kanwil Bengkulu
run rolling `/jadwal-shalat` pages carrying a dated daily table. Kabupaten offices do the same
(Kuningan lists "Jadwal Shalat 2026", Ngawi posted a "2026-2027" table to its social feed). This
is the lift for a future pass: a dated 2027 provincial PDF should exist from about mid-November
2026, and it would be Indonesia's first published year-2 table from the ministry itself.

**4.5 Two independent community counters agree that Kemenag 2027 does not exist yet.** A
2027 jadwal page dated 6 November 2026 states that the official Kemenag 2027 daily schedule was
not found, and an API comparison dated 29 October 2026 states the same. Recorded as corroboration
of section 3, not as evidence in its own right.

**4.6 The regency and province counts do not agree across publishers.** Kemenag's own coordinate
table carries 516 regencies in 35 provinces. equran.id carries 517 in 34. NU Online's imsakiyah
page claims 514. Indonesia has 38 provinces since the 2022 Papua split. A feeder must key on
Kemenag's 516-row table and not on a publisher's prose count.

## 5. Fit notes

- Use `data/sihat-2026-<city>.json` for a whole-year Kemenag fit: 20/18 plus a positive offset
  that reads as +2.0 min in the four western cities and +1.5 in Jayapura. The Jayapura gap is a
  single-city observation, unexplained, and should not be generalised.
- The highland rule is a clean step, not a gradient: at or below 1,718 m the national pair, at
  or above 1,786 m the pair one degree deeper. Nothing in between was sampled, and the exact
  threshold is not published. A feeder should treat 1,750 m as the cut and carry the six
  regencies as named exceptions rather than model the elevation.
- Do not merge the two publishers on one national method. Their asr and maghrib nearly coincide,
  their fajr differs by 8 minutes by construction.
- equran.id answers for 2027 but is a Kemenag derivative. Over June 2026 its Jakarta row stays
  within one minute of the SIHAT row on every column (subuh, maghrib and isya one minute later,
  terbit one minute earlier), and its 2027 month is that table advanced a year. It is a
  calculator, not a publisher, and must not be counted as year-2 evidence.

## 6. Honest negatives

- No official Indonesian publisher has a dated 2027 table reachable from this network. The
  ministry's own API stops at 2026-12-31.
- Provincial and kabupaten Kemenag sites unreachable (103.7.13.251, 443 refused, 80 returns
  504). Searched in Bahasa Indonesia across `jadwal sholat kemenag <provinsi>`, `jadwal shalat
  2027 kemenag kabupaten pdf`, `jadwal imsakiyah 2027 kemenag`, `kalender jadwal sholat 2027
  pdf resmi`, and English. Only index snippets were obtainable.
- NU Online unreachable (Vercel checkpoint, Code 21) in curl and in a browser. The 2027 surface
  is confirmed to exist by indexed pages for many regencies and by its own imsakiyah page, but
  not one row was captured.
- No Islamic university publishes a dated, city-anchored prayer table. UIN and IAIN searches
  return academic papers on prayer-time accuracy, not schedules. UMM's AIK page is the only
  university surface found, and it mirrors the ministry.
- No Muhammadiyah or PBNU printed annual calendar was obtainable as rows. PBNU's calendar is
  behind the blocked host. Muhammadiyah's is an API and a 2027 PDF announced by a news outlet,
  not captured.
- The Bojonegoro 2027 almanac PDF (14 pages, captured, 654 KB) was not text-extracted. Its
  existence and scope come from its landing page.
- `bimasislam.kemenag.go.id/api/v1/public/references?category=<any>` returns an empty list, so
  the ministry's calculation method is not published through this API. The 20/18 pair stays a
  measurement, not a quotation.
