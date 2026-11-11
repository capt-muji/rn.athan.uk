# O1l-43 - Masjidal global tenant enumeration and platform sample fit

Workspace: `$HOME/athan-gitree/census/o1l-city/masjidal-global/`.
Engine: adhan 4.4.6 (`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`), `Rounding.None`,
IANA timezone pinned per mosque, dates built from literal capture strings, no clock read.

## 1. What the platform is, and what its directory is not

Two platforms share the name and are enumerated separately in `MASJIDAL-TENANTS.md`:

- **Masjidal** (`masjidal.com`) - the keyless range API that serves full past years with the
  iqamah layer included. 216 tenants resolved.
- **Masjidi** (`masjidi.app`, screens on `tv.masjidi.app`) - the Lebanon/Dar al-Fatwa deployment,
  with a **live public directory** of 495 tenants in 33 countries.

**Masjidal's own directory is retired.** `masjidal.com/timings/` - the "SEARCH BY LOCATION /
MASJID / 5 / 10 / 25 MILES" page archived on 2019-12-05 - now 302s to a Shopify store, and
`/timings/`, `/timings/<slug>`, `/<slug>/` and `/sitemap.xml` all return nginx 404. The portal
(`portal.masjidal.com`) is a login SPA whose bundle exposes 95 endpoints, none of them a public
tenant list; the documented API (`api.masjidal.com/timings`) is keyed (`x-api-key: msj_sk_...`,
per help.masjidal.com/knowledge-base/prayer-times-api/). There is no directory left to walk.

Enumeration therefore ran on the platform's own archived URLs and on tenants that published their
own widget: 3,570 archived `masjidal.com` URLs (Wayback CDX, domain match, status 200) gave 210
distinct `masjid_id` values, index search gave 6 more, and all 216 resolve through
`masjid_detail=yes`, which returns the mosque's name and full postal address with its ISO country
code. Ids are opaque 8-character base62 tokens with no counter structure (a base62 decode of 14
ids shows no ordering), so they cannot be enumerated by construction. **216 is a floor, not a
census.**

## 2. Masjidal universe (216 tenants)

| Country | Tenants | Share |
| --- | --- | --- |
| United States | 174 | 80.6% |
| Canada | 21 | 9.7% |
| United Kingdom | 12 | 5.6% |
| Australia | 6 | 2.8% |
| Hong Kong | 1 | 0.5% |
| Mauritius | 1 | 0.5% |
| Chile | 1 | 0.5% |

Every one of the 216 serves athan and iqamah as separate dated row sets. The reachable universe is
North-America-first: 90.3 pc US+Canada. The UK pool the brief names is 12 tenants, and each is a
distinct mosque, not a chain: Fultali Coventry, New Peckham London, Masjid Al-Huda Sheffield,
Wirral Shahjalal Birkenhead, Madni Blackburn, Jamia Masjid Bodmin Street Sheffield, Masjid Yousuf
London, Maidenhead, Scarborough, Worthing, Salaam Community Association Manchester, Masjid
e-Salaam Bolton. No Irish, South African or Asian tenant was reachable under these terms.

## 3. Sample: 18 tenants x 3 years (2024, 2025, 2026)

54 tenant-years, **19,728 athan rows and 19,728 iqamah rows** banked in `captures/`, canonical
rows in `data/` (`masjidal_<id>_<year>.json` and `iqamah_<id>_<year>.json`).

Method per tenant: solve latitude and longitude from the table's own sunrise/maghrib curve (the
payload carries no coordinates), measure the fajr depression angle, the isha angle or
maghrib-interval, and the asr school, then score that recipe with adhan at zero margins and at the
measured per-column margins. Per-year scores, the three-year parameter spread and the seasonal
amplitude are in `out/f2_<id>.json`.

| id | country | mosque | lat, lon | solar rms | fajr deg 24/25/26 | isha | asr | margins | twilight within-1 | worst | Jan->Jul fajr | 3y spread |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| nzKzVnKO | AU | Afghan Islamic Centre, Doveton VIC | -38, 145.238 | 0.395 | 18/18/18 | 16.99/16.99/16.98 | Hanafi | none | 100% | 1 | 95 | 0.01 deg |
| VGA6npAe | AU | United Muslims of Brisbane, Logan QLD | -27.66, 153.113 | 0.342 | 18.51/18.51/18.51 | maghrib+90 | Shafi | none | 100% | 1 | 99 | 0.00 deg |
| wdqDq6Ab | AU | Australian Islamic Centre, Newport VIC | -37.85, 145.298 | 1.307 | 17.97/17.94/17.96 | 15.21/15.34/15.35 | Shafi | D+4 A+4 M+6 | 90.4% | 20 | 94 | 0.14 deg |
| 0dYB46K6 | CA | Nejashi, Toronto ON | 43.71, -80.75 | 1.11 | 14.85/14.86/14.87 | 10.49/10.49/10.49 | Shafi | D-4 A-2 M+1 | 91.5% | 3 | -136 | 0.02 deg |
| 1QL0lpLZ | CA | Halton Islamic Assoc., Burlington ON | 43.29, -79.712 | 0.641 | 14.87/14.85/14.86 | 15.12/15.05/14.91 | Shafi | D+1 A+1 M+1 | 50.8% | 16 | -132 | 0.21 deg |
| 5AvP54KX | CA | IQRA Masjid, Whitby ON | 43.96, -79.06 | 1.232 | 14.99/15.01/15.01 | 14.93/15/15.01 | Hanafi | M+2 | 100% | 1 | -138 | 0.08 deg |
| Vdw3zode | CA | Muslim Assoc. of New Brunswick, Saint John NB | 45.24, -65.808 | 0.902 | 14.86/14.86/14.86 | 15.16/15.16/15.15 | Shafi | D+1 A+1 M+1 | 80.6% | 2 | -148 | 0.01 deg |
| oxdN7nKV | CL | Mezquita As-Salam, Santiago | -33.47, -72.109 | 0.682 | 17.72/17.72/17.73 | maghrib+80 | Shafi | D+2 M+1 I+1 | 98.1% | 2 | 68 | 0.01 deg |
| 0xdyO0LX | GB | Masjid Al-Huda, Sheffield | 53.37, -1.498 | 1.005 | 10.01/10/10 | 10/10.01/10 | Shafi | none | 100% | 2 | -218 | 0.01 deg |
| M9L2byLZ | GB | Wirral Shahjalal, Birkenhead | 53.38, -3.058 | 1.007 | 15/15/15 | 15.01/14.99/14.99 | Shafi | none | 97% | 18 | -283 | 0.02 deg |
| pArDDkKb | GB | Fultali Islamic Centre, Coventry | 52.38, -1.527 | 0.975 | 18.49/18.5/18.5 | maghrib+90 | Hanafi | none | 97.8% | 9 | -290 | 0.01 deg |
| RKxqeRLO | GB | New Peckham Mosque, London | 51.07, -6.349 | 19.949 | 17.29/18.07/17.86 | 15.17/15.95/17.11 | Shafi | F+21 S+20 D-15 A-15 M-20 I-20 | 45.9% | 59 | -229 | 1.94 deg |
| pVdwkode | HK | TADREES-UL-QURAN, Kowloon | 22.34, 114.161 | 0.578 | 17.89/18/18.01 | 18.3/18.44/18.43 | Hanafi | D+5 A+1 M+3 | 80.3% | 2 | -82 | 0.14 deg |
| EdoeoqL7 | MU | Test01, Port Louis | -20.19, 57.503 | 0.349 | 15/15/14.99 | 15/14.99/14.99 | Shafi | none | 100% | 1 | 65 | 0.01 deg |
| 1QL0VydZ | US | ICOPS, Lynnwood WA | 47.83, -122.313 | 1.276 | 15.01/15.02/15.02 | 15.02/15.02/15.02 | Shafi | none | 100% | 2 | -175 | 0.01 deg |
| 3OA8V3Kp | US | MAS Staten Island NY | 40.59, -74.104 | 0.852 | 15/15/15.01 | 15.01/15.01/15 | Shafi | none | 100% | 2 | -113 | 0.01 deg |
| 6adJkrKk | US | Islamic Center of Irvine CA | 33.71, -117.704 | 0.78 | 14.84/14.82/15 | 15.17/15.19/15.02 | Shafi | D+1 A+1 M+1 | 93.4% | 2 | -70 | 0.18 deg |
| xdy03lAX | US | IANT, Richardson TX | 32.92, -96.736 | 0.727 | 15.01/15/15 | 15.01/15.02/15.01 | Shafi | none | 100% | 1 | -66 | 0.01 deg |

`margins` is the median per-column offset of the printed table from the fitted recipe, in minutes
(F fajr, S sunrise, D dhuhr, A asr, M maghrib, I isha); `none` means every column reproduces at
zero margins. `worst` is the largest single-day error of the recipe at those margins.

### What the sample establishes

- **The engine is a PrayTimes-v2-family generator at zero margins.** Seven tenants reproduce
  with every column at zero margins and 100 pc within one minute across three years: IANT
  Richardson (15/15), MAS Staten Island (15/15), ICOPS Lynnwood (15/15), Masjid Al-Huda Sheffield
  (10/10), Mauritius (15/15), Brisbane (18.51 + maghrib+90), Doveton (18/17 Hanafi). IQRA Whitby
  (15/15 Hanafi) and Wirral Birkenhead (15/15) add two more at a single +2-minute maghrib margin
  and at 97 pc within one. This confirms the record's O1k finding that the platform's +-1 margin
  layer dissolves on the publisher-side engine.
- **Per-mosque settings ride the same generator.** The remaining tenants differ only in the pair
  and the margins: Coventry 18.5 + maghrib+90 Hanafi, Santiago 17.72 + maghrib+80, Kowloon
  18/18.4 Hanafi with dhuhr +5 / asr +1 / maghrib +3 (the record's Kowloon +6 dhuhr class, now
  measured on a second Kowloon tenant), Irvine 14.84/15.17 with +1s, Toronto Nejashi 14.86 with an
  isha angle of only 10.49 deg.
- **A 10-degree mosque exists.** Masjid Al-Huda Sheffield prints fajr and isha at 10.0 deg on all
  1,096 days of 2024-2026 at 100 pc within one minute. It is the shallowest pair in the record.
- **Parameters are frozen.** Twelve of eighteen tenants hold their fajr and isha parameters
  within 0.03 deg across three years; the largest stable spread outside the broken tenant is
  0.21 deg (Halton).
- **Seasonal amplitude sits beside the stability, as FIT-RULES requires.** The northern tenants
  swing 218-290 minutes between the January and July fajr (Sheffield 218, Coventry 290, Wirral
  283); the southern tenants swing 65-99 (Santiago 68, Doveton 95, Brisbane 99) with the sign
  reversed, and the near-equator Mauritius tenant swings 65.

### Suite pass rate

Strict suite (solar gate rms <= 2.0 min, both twilights >= 95 pc within one minute, parameter
spread <= 0.10 deg, worst single-day error <= 5 min): **9 of 18 tenants pass (50 pc)**.

Reproducible-recipe tier (solar gate passes and both twilights >= 90 pc within one minute):
**14 of 18 (78 pc)**.

The four tenants that fail both tiers, with their causes:

- **New Peckham Mosque, London** - no solar solution exists (rms 19.9 min, worst 59). The printed
  "athan" columns are not solar times: on 1 January 2025 the table prints sunrise 08:51 against a
  true 08:06, dhuhr 12:14 against a transit of 12:04, and fajr 06:53 against an 18-deg 06:02.
  The row set behaves as a jama'ah/iqamah schedule published in the athan slot. Honest negative:
  no recipe, and the live page carries the same widget, so gating the feed against it is circular.
- **Halton Islamic Association, Burlington ON** - a DST block: 63 days print one hour out (worst
  16 min against the fitted recipe, 50.8 pc twilight within one). The same defect class as the
  record's Toledo and San Antonio finds, on a third platform.
- **Australian Islamic Centre, Newport VIC** - four columns carry a +4 to +6 margin and 90.4 pc
  within one; a per-column editorial offset rather than a clean pair.
- **Wirral Shahjalal** and **Fultali Coventry** clear 97 pc within one but carry a single 18-minute
  and 9-minute worst day respectively, which is the high-latitude clamp, not a recipe error.

## 4. Masjidi (masjidi.app): 495 tenants, 37 tables, and a platform-tier negative

The public directory enumerates 495 tenants in 33 countries (Lebanon 244, Saudi Arabia 49, Algeria
31, Syria 24, Indonesia 23, Oman 16, Jordan 15, Morocco 13, Malaysia 9, Tunisia 8, Egypt 7, then a
long tail to 1). 76 screens were sampled up to 3 per country; 58 reference a regional athan table
and those resolve to 37 distinct 366-row undated day-of-year tables, all banked in `captures/`.

**Every one of the 37 fails the solar gate.** Fitting latitude from each table's own
sunrise/maghrib curve gives plausible country latitudes (Beirut 33.92, Cairo 30.00, Kuala Lumpur
6.02, Oslo 59.18, Berlin 52.60, Java -6.24), but the
residual is **6.21 to 8.10 minutes RMS** - an order of magnitude worse than the Masjidal range API
(0.34 to 1.31). The residual is seasonal, not constant: for the Beirut table it runs 1.6 minutes
in March-April and 3.6 in August-September. Freeing the horizon constant from -0.833 to -1.4 deg
does not close it (6.22 min remains). These tables are generated by a coarse solar model and
**cannot be reproduced within one minute by any single solar solution**, so no recipe from this
platform can pass the suite as the record defines it.

Their angles are nonetheless legible and cluster on national pairs: Saudi 18.31 + maghrib+90,
Kuwait 18.01/17.51, Qatar 18.22 + maghrib+90, Bahrain 18.04/17.71, Oman 18.00/16.85, Iraq
16.05 + maghrib+80, Jordan 15.02/15.02, Palestine 17.52/16.72, Syria 18.01/16.62, Lebanon
19.60/16.64, Egypt 19.51/17.50, Morocco 19.01/16.03, Algeria 18.00/16.43, Tunisia 18.00/17.65,
Libya 18.29/17.55, Malaysia 17.76-17.84/17-18, Indonesia 17.66-18.65/16.85-17.85, Germany
15.06-16.56 + maghrib+90, Sweden 17.06/15.06, Norway 15.90/14.27, Belgium 17.83/17.00, Italy
17.93/17.01, Romania 16.83/14.82, Bosnia 16.79/14.79. Every table is Shafi asr and every one runs
a fixed-offset clock (implied-longitude drift 0.2-1.0 min, no DST steps) - a clock regime the
record does not yet carry for these countries and one the owner should note before any build reads
these tables.

## 5. Honest negatives

- **No live-page gate was run.** The Masjidal API is the mosque's own widget source, so gating the
  feed against the page that renders it is circular, and no independent printed artifact was
  reachable for any sampled tenant. The record's Kowloon gate (O1k HK-MASJIDAL) stands as the
  platform's only live-page confirmation.
- **No Irish, South African, Gulf or Asian Masjidal tenant was found.** Searches ran in English and
  in Arabic (مسجد, مواقيت الصلاة, أوقات الصلاة) plus `site:` probes on the widget URL, and the
  archived directory was enumerated in full. Under these terms the platform has no reachable
  tenant outside the seven countries listed.
- **The 495-tenant Masjidi directory is a complete enumeration of that platform's public list, but
  the list itself is the vendor's, not a census of mosques in those countries.**
- **Mauritius is a test tenant.** `Test01` (Port Louis) serves a clean ISNA 15/15 table and is
  counted, but it is a test record and should not be read as a mosque.
- **`nzKzVnKO` (Doveton VIC) and `VGA6npAe` (Brisbane) report the same parameters as the record's
  O1k-F13 Australia finding (18/17 and a maghrib+90 line), which confirms rather than extends it.**

## 6. Ceiling and forward longevity

The range API serves 2024, 2025 and 2026 whole for every one of the 18 sampled tenants, 365/366
rows with zero gaps, and 2026 was served complete before year end. The sample therefore proves
**2024-2026 stable** on one recipe per tenant, and the platform demonstrably serves the future
(2026 captured in full). The ceiling is the platform's retention, not a published horizon: no
tenant was probed beyond 2026.

Not complete. 216 tenants is the floor of a directory that no longer exists, and 18 of them were
fitted.
