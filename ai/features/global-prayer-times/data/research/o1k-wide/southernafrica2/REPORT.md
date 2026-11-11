# O1k wide-research — `southernafrica2` report (2026-11-10)

Scope: South Africa (MJC second month + Cape mosque split), Botswana (second month),
Zimbabwe, Zambia (zamasjids), Malawi (Blantyre offset), Mozambique, Namibia, Angola,
Lesotho, Eswatini (Jamiat fallback months), Mauritius (Jummah Masjid).
All work public pages only; no logins, no forms, no contact. Raw pages in `captures/`,
normalized rows in `data/`. Total new dated rows: ~990.

## South Africa

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Muslim Judicial Council (SA) salaah-times | mjc.org.za/salaah-times/ | community (second national body) | Cape Town month table (fajr/sunrise/dhuhr/asr/maghrib/isha), server-rendered **current month only** | 2026-10 (Wayback), 2026-11 (live) |
| Jamiat KZN generator, Cape Town row | salaahtimes.starlite.za.net/jamiat/perpetual/month.php | community | Cape Town November, 17 columns | 2026-11 (December month also pulled: jamiat-capetown-2026-11.json) |
| salaahtimes.co.za Cape Town page | salaahtimes.co.za/cape-town | community (already on record) | today + month links, **explicitly "Times from the Jamiatul Ulama KZN perpetual timetable"** | rolling |
| Salaah Board | salaahboard.com (salaahboard.co.za redirects) | community | per-masjid daily jamaat (fajr/zuhr/asr/isha + ts) for **21 Cape Town mosques**, 397 masjids nationally; `data/times.js` + `data/masjids.js`, keyless | today-only, ts 2026-11-09 |
| masjids.co.za | masjids.co.za/salaahtimes | community | today per town incl. Cape Town, footer credits Jamiatul Ulama KZN | today-only |

**Confirms:** MJC exists as the second body with a Cape Town month table; the
two-body split is real and measurable.

**NEW:**
- `data/mjc-cape-town-2026-10.json` — MJC **October 2026, 31 rows**, recovered from the
  single Wayback snapshot (2026-10-09). Second month achieved.
- `data/mjc-cape-town-2026-11.json` — 30 rows (re-capture with the today-row fixed).
- `data/salaahboard-capetown-masjids.json` + `...-jamaat.json` — new mosque-level surface:
  21 Cape mosques with dated (2026-11-09) jamaat rows, keyless static JSON.
- The two-body delta quantified on November 2026 (MJC − Jamiat, medians): fajr 0,
  sunrise 0, dhuhr **−5** (MJC prints transit, Jamiat transit+5), maghrib **−2..−3**,
  asr = Jamiat asr-shafi ±1, isha **+13 over shafi / −5 under hanafi** (MJC isha sits
  between the schools). Any Cape fit must choose a body; the bodies are not interchangeable.

**Fit-worthy:** MJC October+November (61 dated rows) as the second-body seed, kept
separate from Jamiat per the census rule.

**Negatives:** MJC full year is NOT retrievable: `?month=&year=` query params are
ignored (dec fetch byte-identical to nov), WP REST has no prayer post type
(`mjc-wpjson-root.json` audited), theme JS has no data endpoint, only one Wayback
snapshot exists. No Cape mosque found republishing the MJC monthly table itself; MJC's
own page directs readers to "confirm congregational times with your local Masjid".
Jamiat-attributed republishers inside Cape territory exist (salaahtimes.co.za,
masjids.co.za). Languages searched: English (Cape Muslim web publishes in English).

## Botswana

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Botswana Muslim Association | bma.org.bw/prayer-times/ | community (national body layer) | **all 12 months × 34 towns in one 2.5 MB page DOM**; client JS only toggles divs | rolling, no year labels |

**Confirms:** the census record (all 33-34 towns, dated month, both asr schools,
DOM-parseable).

**NEW:**
- `data/bma-botswana-2026-12.json` — **December 2026, 30 towns × 31 days = 930 rows**
  (4 towns ship no December: Ghanzi, Gweta, Hukuntsi, Rasesa). Second month achieved.
- `data/bma-perpetual-evidence.json` — **the BMA table set is PERPETUAL**: 146/151
  shared tables are byte-identical between the 2021-11-30 Wayback snapshot and the
  2026-11-10 live page (2023-02-06 snapshot: 145/150 identical); the 5 differences are
  typo fixes (`12;:18;` → `12:18;`), zero time values changed. Coverage grew from
  2 months × 34 towns (2021) to 12 months × 34 towns (2026) with the old cells unchanged.

**Fit-worthy:** the same one-generation perpetual treatment as the Jamiat generator.

**Negatives:** December 2025 is NOT archived — not on the site (no "2025" in the DOM)
and not in the Wayback CDX (snapshots: 2021-04/06/11, 2022-02/06/09, 2023-02/06,
2026-08 only). **The grade-A year path through BMA is closed**: distinct years carry
identical cells. A day-19 defect mashes zawwal+shafi-asr into one cell in a few tables
(Bobonong jan/feb/mar).

## Zimbabwe

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| zamasjids.com | zamasjids.com (Lovable PWA) | community | **none — Zambia-only**: app bundle references only the two Zambia Apps Script feeds; 0 mentions of Zimbabwe/Harare/Bulawayo | — |
| Jamiat generator (census surface) | month.php?month=December | community | `data/jamiat-harare-2026-12.json`, `data/jamiat-bulawayo-2026-12.json` — December 2026, 31 rows each | 2026-12 (new) |

**Confirms:** Jamiat 5-town coverage stands as the record's Zimbabwe layer.

**NEW:** 62 December 2026 rows for Harare + Bulawayo (second month; C5 held November).

**Negatives:** zamasjids week sampling impossible: both feeds are today-only and ALL
date/month/year query params are ignored (`date=`, `dt=`, `day&month&year`,
`month&year`, `week=` each return the identical today payload; jamaat feed same). The
endpoints have never been archived (Wayback CDX for `script.google.com/macros/s/AKfycbz*`
audited — no hits for either key). A week of regional taqweem requires daily polling.

## Zambia

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Zambia Salaah Times taqweem feed | script.google.com/.../AKfycbzYGp.../exec | community | 13 regions × today, 10 columns (Suhoor..Isha), dated "10 Nov" | 2026-11-10 |
| Zambia Salaah Times jamaat feed | script.google.com/.../AKfycby7rh.../exec | community | 19 masjids × today (Fajr/Dhuhr/Asr/Esha jamaat, Jumuah, city, Maps link) | 2026-11-10 |

**Confirms:** the census "best mosque layer" description (per-region taqweem +
per-masjid jamaat, today-only).

**NEW:** `data/zamasjids-taqweem-2026-11-10.json` (13 regions) and
`data/zamasjids-jamaat-2026-11-10.json` (19 masjids: Lusaka 11, Chipata 3, Lundazi,
Livingstone, Kafue, Katete, Kabwe). Dated sample captured; Lusaka/Ndola/Kitwe included.

**Negatives:** the "current week" ask — closed as infeasible (today-only, params
ignored, no archive). Same negative as Zimbabwe; a week needs a daily poll job.

## Malawi

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Jamiat generator | month.php?month=December&id=... | community | Blantyre, Lilongwe, Mzuzu, Zomba — December 2026, 31 rows each | 2026-12 |

**Confirms:** Jamiat 29-town coverage.

**NEW — the Blantyre anchor offset is EXPLAINED.** Comparing printed columns against
computed solar (NOAA/Meeus, `solar.py`, `malawi_diff.py` → `data/malawi-margin-diff.json`):
every column fits the census recipe margins at all four towns EXCEPT Blantyre's
sunset/maghrib pair, which carries an extra **+3 minutes** — Blantyre prints
sunset = astro sunset (not astro−3) and maghrib = astro+6 (not astro+3). Verified on
2026-12-10/20/31 (e.g. 12-20: Blantyre sunset 18:09 = astro 18:09, maghrib 18:15;
Lilongwe sunset 18:08 = astro−3 of 18:10, maghrib 18:14 = astro+3). A horizon- or
ijma-safety bump on the evening pair only, town-scoped like Isipingo's ishraaq +20.
The national-body homepage bar (maghrib 17:24) remains a separate, undated anomaly.

62 new December rows for Blantyre/Lilongwe (+62 Mzuzu, +31 Zomba).

## Mozambique / Namibia / Angola / Lesotho / Eswatini

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Jamiat generator (only publisher) | month.php?month=December&id=... | community | one month each: Maputo 2026-12 (31), Windhoek 2026-12 (31), Luanda 2026-12 (31), Maseru 2026-12 (31), Mbabane 2026-12 (31) | 2026-12 (new) |

**Confirms:** the census FALLBACK grades (no publisher beyond the generator's row).

**NEW:** 155 December 2026 rows across the five capitals — first dated fallback-country
rows outside November.

**Negatives:** no other public surface surfaced for these five (searches in English;
Portuguese probe deferred — the generator's coverage IS the local-language-layer gap).

## Mauritius

| Source | URL | Tier | Dated data | Years |
|---|---|---|---|---|
| Jummah Masjid Namaz Times PWA | namaztimes.jummahmasjid.org | community (official masjid timetable) | **the full 2026 year, 365 dated rows × 15 fields** (sehri, fajr begin/azaan/jamaat, sunrise range, zawaal range, zohr, asr ×3, sunset range, maghrib, esha ×3), embedded as `const M7` in the app bundle | 2026 full year |

**Confirms:** athan+jamaat layer and the regional adjustments — the publisher's own
`llms.txt` states the six adjustment tiers verbatim: +2/−2 min (7 towns), +3/−3 (8),
+4/−4 (8) on Maghrib/Iftar vs Sehri around the Port Louis base.

**NEW:**
- `data/jummahmasjid-mauritius-2026.json` — 365 rows (current month November included;
  Jan-Oct serve as archive depth). Zohr azaan 12:45 / jamaat 13:00 (13:10 Fridays) are
  fixed in code, documented in the file.
- The census "PWA MISLABELS DATES" defect does not touch the data layer: each raw line
  carries its own dd/mm/yyyy, and my parse reads those directly.
- The bundle's minute encoding drops TRAILING zeros ("4.2" = 04:20); proven by
  monotonicity (0 violations of begin≤azaan≤jamaat across 1095 triples vs 637 under
  left-padding). Recorded in the data file so the next reader does not mis-parse.

**Fit-worthy:** the year table as a Mauritius seed (jamaat columns), regional
adjustments as a named offset table.

**Negatives:** year-2 (2027) is absent — the bundle carries exactly 365 rows, all 2026;
the app is re-shipped per year. Facebook page not probed (public-page discipline; the
bundle + llms.txt are the publisher's own complete statement).

## Method notes

- Wayback CDX + snapshots worked for MJC (1 snapshot) and BMA (8 snapshots) but not for
  the zamasjids Apps Script feeds.
- Jamiat perpetual generator re-confirmed frozen: December pages render with
  `perp-year 2026` labels and unchanged cells (consistent with the C15 verdict); the
  capture value here is the December label/rows themselves.
- Parsers kept in the workspace: `parse_jamiat.py`, `parse_mjc.py`, `parse_bma.py`,
  `solar.py`, `malawi_diff.py` (rerunnable).
- TinyFish used for search and page reads; curl with browser UA for raw captures;
  agent-browser not needed.
