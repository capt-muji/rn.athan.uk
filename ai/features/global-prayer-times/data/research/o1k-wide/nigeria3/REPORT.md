# Nigeria (tag nigeria3)

Date of capture: 2026-11-10. Owner priority: Nigeria. Record on entry: prayertimesnigeria.com
(community, MWL 18/17) plus mosque leads, NSCIA announcements-only.

## Surfaces

| # | Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|---|
| 1 | Prayer Times Nigeria (Orygin Solutions) | prayertimesnigeria.com/calendar | community, client-computed | 30 rows per LGA per Hijri month, 6 columns | current month plus navigation |
| 2 | NSCIA | nscia.com.ng | national authority publisher | none, announcements and moonsighting statements only | latest post 2026-06-28 |
| 3 | National Mosque official app | nigerianmosqueservices.app | mosque (app publisher) | 6 values for one day, static in HTML | none |
| 4 | Ansar-Ud-Deen Society of Nigeria | ansaruddeensociety.com/api/v1/prayer-times | national society | none served, endpoint returns empty body | none |
| 5 | Masjidway mosque listings (NEW) | en.masjidway.com/masjid/10935, /11444, /11445 | community platform, method labelled | 30 and 31 rows per month, 6 columns | per-month pages back to at least 2024 |
| 6 | LEMU, Lekki Muslim Ummah | lekkicentralmosque.org | mosque | none | none |
| 7 | Premier Radio 102.7 (Kano state radio) | facebook.com/premierradiong | state broadcaster by publisher, Facebook hosted | one row per day, Hausa | daily series, not retrievable |
| 8 | Lagos Central Mosque (Idumota) | no site | mosque | none | none |

## What confirms the record

Prayer Times Nigeria still carries the computed national layer, and its own about page states the
platform is built "around Nigeria's commonly used Maliki practice", which agrees with the recorded
Shafi asr. NSCIA remains announcements-only. The Abuja National Mosque still publishes no monthly
table, which the census already records.

## What is new

Three mosque-level monthly tables with a stated method, from a platform the record does not carry.
Masjidway lists Nigerian mosques with per-month tables and a printed method line. All three captured
tables print "Egyptian General Authority of Survey".

- Ansar-Ud-Deen Society Central Mosque, listed Abuja: November 2026 (30 rows) and October 2026 (31 rows).
- Ansar-Ur-Deen Mosque, Ikorodu, Lagos: November 2026 (30 rows).
- Central Mosque, Ikorodu, Lagos: November 2026 (30 rows).

Raw HTML sits in `captures/`, normalized rows in `data/`.

A provenance note, hedged: the National Mosque app landing page is a Vercel static page whose
timetable is six fixed values baked at deploy (last-modified 2026-11-07). Its only script advances
the highlighted row from the wall clock. No API, no month, no JSON. The app is the sole carrier of
the schedule, so the schedule is app-only.

A second provenance note, also hedged: Prayer Times Nigeria links to x.com/simwal and names Orygin
Solutions as developer. NSCIA's Moon Sighting Committee page lists "Mal. Simwal Usman Jibrin" as a
member. The surname matches the site's linked handle, so the community platform appears to be
authored by a member of the council's moonsighting committee. The platform stays community tier.

## Fit

Fit discipline: `adhan` from `census/adhan-build/node_modules`, `TZ=Africa/Lagos` pinned, no real
clock, second resolution computed then compared at whole-minute rounding.

Ansar-Ud-Deen Society Central Mosque at 9.0579, 7.4951, 61 rows (October plus November 2026):

| method | fajr | sunrise | dhuhr | asr | maghrib | isha | overall RMSE |
|---|---|---|---|---|---|---|---|
| MWL 18/17 | 6.18 | 0.00 | 0.13 | 0.67 | 0.13 | 2.06 | 2.67 |
| ISNA 15/15 | 18.58 | 0.00 | 0.13 | 0.67 | 0.13 | 10.36 | 8.69 |
| Egyptian 19.5/17.5 | 0.13 | 0.00 | 0.13 | 0.67 | 0.13 | 0.18 | 0.30 |
| MWL with Hanafi asr | 6.18 | 0.00 | 0.13 | 55.44 | 0.13 | 2.06 | 22.79 |
| free angles, dhuhr offset 0 | 19.50 | 0.00 | 0.00 | 0.58 | 0.00 | 0.26 | 0.26 |

Free fit lands on fajr 19.50 and isha 17.50 with sunrise holding at 0.00, which pins the coordinates
the page uses. Both Ikorodu tables repeat the result at 6.6194, 3.5105 (overall 0.24 and 0.25, free
fit again 19.50/17.50). Recipe for the platform: adhan-equivalent Egyptian 19.5/17.5, Shafi asr,
dhuhr at solar noon with no offset, whole-minute output. That is the platform's method, not the
mosque's own ruling, so these tables are community tier.

## Honest negatives

Searched in English and Hausa ("lokaci salla Kano", "jadawalin lokacin salla", "lokutan sallah",
"lokacin sallah jihar Kano"). No council, Hisbah, emirate or state-government timetable surfaced for
Kano, Kaduna, Ibadan, Ilorin or Abeokuta in either language. What exists is aggregator output, which
the brief excludes, and social images.

The binding loss is Facebook. Every Nigerian institutional poster carries its timetable as an image
or a text post whose body is served only after login: Premier Radio Kano's daily Hausa series, LEMU,
the Sultan Bello Mosque Kaduna page, and the moonsighting astronomer's monthly national table. Bodies
returned comments only, `mbasic.facebook.com` returned HTTP 400, and `m.facebook.com` returned 400.
LEMU's own page returned `login_required`.

LEMU is Lekki Muslim Ummah, an umbrella for the Lekki peninsula founded 1999, not a league of ulama.
Its public site carries 56 posts and no timetable page, and WordPress search for timetable, sallah
and lokaci returns nothing. Its monthly table appears to live only in social posts.

Ansar-Ud-Deen Society of Nigeria, the national body, exposes `/api/v1/prayer-times?city=&date=` which
answers HTTP 200 with `content-length: 0` for all six dates probed (2025-11-10, 2026-02-18,
2026-03-20, 2026-06-01, 2026-11-01, 2026-11-10). The public page then shows a hardcoded fallback set
of 05:15, 06:30, 12:30, 15:45, 18:30, 19:45 regardless of date. Treat the widget as a defect class,
not a table.

Lagos Central Mosque has no web presence at four candidate domains, all unresolvable. The National
Mosque app schedule is app-only. NSCIA has no publications page in `wp-sitemap`, and its
`info-portal` page is leftover theme demo text.

## Files

- `captures/masjidway-10935-{10,11}2026.html`, `captures/masjidway-1144{4,5}-112026.html`
- `captures/nationalmosque-landing.html`, `captures/nationalmosque-jsmain.js`
- `captures/ads-api-prayer-times-empty.txt`, `captures/ads-page.js`
- `captures/lemu-posts.json`, `captures/lemu-media-100.json`, `captures/lemu-wp-search-timetable.json`
- `captures/nscia-latest-posts.txt`, `captures/ptn-bundle.js`, `captures/fb-premier-jina.txt`
- `data/masjidway-10935-abuja-2026-{10,11}.json`, `data/masjidway-11444-ikorodu-2026-11.json`,
  `data/masjidway-11445-ikorodu-central-2026-11.json`
- `fit/fit.mjs`, `fit/free.mjs`, `fit/check.mjs`
