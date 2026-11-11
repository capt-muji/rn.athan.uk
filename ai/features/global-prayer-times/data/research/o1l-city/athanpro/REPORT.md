# O1l-56 athanpro platform walk — the full city universe

Workspace `census/o1l-city/athanpro/`. Read `BRIEF.md`, `FIT-RULES.md` and the O1l-45 block of `CONSOLIDATION.md`. Engine adhan 4.4.6 at `census/adhan-build/node_modules/adhan`, `Rounding.None`, second resolution, explicit minute rounding per column, zone pinned per city, no clock read.

## Headline

`athanpro.com` serves **2690 city pages across 232 countries**. Every one is captured raw and its dated month table banked: **2690 tables, 80700 dated rows**, all September 2026, all 30 rows, all six columns. The sitemap and the `cities` array each country page embeds agree exactly, city for city, so the enumeration is complete against both.

On the platform-engine gate, **2311 of 2690 tables reproduce at 100pc** within one minute on the five timed prayers, **2371 at 99pc or better** and 2530 at 90pc or better, each on one recipe fitted at the page's own point. The remainder are concentrated in two classes that are not the platform's own computation, reported below.

## The universe

`ATHANPRO-CITIES.md` carries the country table. The full enumeration is `data/universe.tsv`: 2690 rows of country, city, slug, latitude, longitude, IANA zone and platform priority. Five country directories carry no city page at all: French Guiana, Honduras, Hungary, Iceland, Saint Pierre and Miquelon.

The distribution is the platform's product footprint, not a national network: Turkey 510, Malaysia 192, Morocco 112, the UAE 60, Libya 28, then a long tail in which most countries carry ten or fewer cities.

## What each page actually is

The page's `source` field separates four kinds of table, and that distinction decides the tier. It is the most useful structural finding of this walk.

| `source` | Pages | What it is | Tier |
|---|---|---|---|
| `calculator` | 1241 | the platform computes the table from a stated method (MWL for all but a handful) | platform |
| `database` | 781 | the platform computes it with a named authority's method (Diyanet 510, JAKIM 183, Habous 104, UAE 60, Libya 28 and others) | platform |
| `www.e-solat.gov.my` | 183 | JAKIM's own published zone table, re-rendered by the platform | authority, second-hand |
| `mosque` | 485 | a **named mosque's** timetable, carried with jamaat columns, not a computed table | mosque, via platform |

The `mosque` class is the one that matters. Those pages name the mosque (Istanbul's reads `مسجد الابرار العبيديه`) and print that mosque's schedule. They are not the platform's computation, so an adhan fit is the wrong gate for them and they must not be read as platform coverage of the city. Their best fit is recorded anyway, for the record.

## Gate results by source class

| Source | Tables | 100pc | >=99pc | >=90pc |
|---|---|---|---|---|
| `calculator` | 1241 | 1205 | 1220 | 1239 |
| `database` | 781 | 717 | 737 | 752 |
| `www.e-solat.gov.my` | 183 | 114 | 120 | 182 |
| `mosque` | 485 | 275 | 294 | 357 |

`calculator` is the platform's own engine and it is consistent: 1,148 of its 1,241 pages land on 100pc at MWL 18/17 Shafi with every adjustment at zero. `database` is nearly as clean once the authority's own minute adjustments are fitted. The two weaker classes are the mosque tables and the re-rendered JAKIM feed.

## The recipe, and the adjustments

A stated method label is never taken as the recipe on its own. Every page is tested against a ladder of published recipes (both madhabs) and the ladder's winner is recorded; the platform's own per-prayer minute adjustments are then fitted on top and stored in `data/fits.json` under `adjust`. Where the ladder reaches nothing the fit falls back to a half-degree sweep of both twilight angles, and where a twilight adjustment stays above half an hour the three published night rules are tested as well (`rule`).

| Recipe | Cities |
|---|---|
| MWL 18/17 | 1290 |
| stated method | 436 |
| Kuwait 18/17.5 | 153 |
| UAE 18.2/18.2 | 127 |
| Karachi 18/18 | 111 |
| ISNA 15/15 | 97 |
| UMAM 14/14 | 66 |
| Qatar 18/17 | 58 |
| Habous 19/17 | 53 |
| Libya 18.5/18.5 | 52 |
| JAKIM 20/18 | 39 |
| Egypt 19.5/17.5 | 32 |

## Fit verdict

One recipe per city, one span of 30 days (2026-09-01..2026-09-30), scored jointly on the five timed prayers: 150 cells per city. The per-year breakdown is a single year by construction, and a between-year stability verdict is not available. The sitemap's `lastmod` is `2026-09-29T07:05:28.774Z` on all 2,935 URLs, every page renders the same September month, and 2,684 pages carry `initialPrayerDate` 2026-09-29 (the six that read 2026-09-28 are the Pacific pages still on the 28th at the build instant). This is **one frozen generation**. Under the frozen-generation precedent the grade is **provisional, one published cycle**, and it never lifts to A.

Seasonal amplitude beside a fit is model-derived from the fitted recipe at the city's own point (15 January against 15 July of the same year), because one month is held and no measured year exists. It is stored under `amp` and labelled as model-derived wherever used.

## Defects recorded, not corrected

1. **Eight cities are served a foreign IANA zone, and the table is rendered in it.** Kingston (Jamaica) is served `Pacific/Norfolk`, sixteen hours from its own wall clock; Georgetown (Guyana) `Atlantic/St_Helena`, four hours; San José (Costa Rica) `America/Los_Angeles`, one hour in September; Perth `Europe/London`, eight hours; Hamilton (Bermuda) `Pacific/Auckland`, fifteen; Saint-Pierre (Martinique) `Indian/Reunion`, eight; Port Elizabeth (Saint Vincent) `Africa/Johannesburg`, six; and both Barcelona and Valencia `America/Caracas`, six. The table is internally consistent, so it fits at the page's own point in the page's own zone, but as local prayer times the page is unusable there.
2. **116 cities carry a uniform shift of 30 minutes or more across all six columns**, which is a clock, not a parameter. Morocco 103, Armenia 3, Spain 2, Martinique 1. The largest cluster is Morocco and Western Sahara: those Habous pages render about an hour behind the zone the page itself names, because the table is computed at UTC+0 while `Africa/Casablanca` is UTC+1 in September. 103 of the 116 still fit at 99pc with the shift recorded as an adjustment, so the table is recoverable; the page's clock is not.
3. **The printed offset label is the country's, not the city's.** 653 pages print a fixed offset that disagrees with the zone the table runs in, because the label is copied from the country record. Every DST city is affected. The label must never be read as the zone.
4. **The `Today` block does not contradict the month table anywhere.** The prior record's second defect does not reproduce: on all 2,690 pages the block equals the table row for the day it names. The block is still a build artefact, not a live value.
5. **Ten sitemap URLs under `/countries/palestine/` are dead, and their live equivalents sit in an unlisted directory.** The sitemap advertises twenty `palestine` city URLs. The ten Palestinian cities answer 200; the ten Palestinian cities (Jerusalem, Tel Aviv, Haifa, Rishon LeZion, Petah Tikva, Ashdod, Netanya, Beersheba, Holon, Bnei Brak) answered 404 on re-probe while the same page, canonical `https://athanpro.com/countries/palestine/<city>`, was served under `/countries/palestine/<city>`. Both captures are held.
6. **A `mosque`-source page is not a platform table.** 485 pages carry a named mosque's own schedule with jamaat columns; 294 of them fit at 99pc or better once a uniform offset is absorbed, and the rest are that mosque's own convention. They are recorded as mosque-tier surfaces, never as platform coverage.

## The four broken capital pages, re-probed

| City | Zone served | Country label | Solar gate | Fit | Verdict |
|---|---|---|---|---|---|
| San José | `America/Los_Angeles` | -06:00 | 0 min | MWL 18/17 100pc | zone defect |
| Colonia | `Pacific/Chuuk` | +10:00 | 0 min | MWL 18/17 100pc | clean |
| Kingston | `Pacific/Norfolk` | -05:00 | 0 min | MWL 18/17 100pc | zone defect |
| Georgetown | `Atlantic/St_Helena` | -04:00 | 0 min | MWL 18/17 100pc | zone defect |

All four reproduce at 100pc at the page's own point in the page's own zone, with zero adjustments, and all four pass the solar gate at 0 minutes. The earlier verdict called them broken because the gate was run against the country's offset label rather than the zone the table is rendered in. What actually fails is the zone record for Kingston, Georgetown and San José, and the offset label for all four. Colonia is clean on both counts, so its 61-minute flag does not reproduce.

## Capital coverage

179 of the 202 capitals on the O1l-38 matrix were identified by name among the city pages and now carry a dated table here. The rest are either served under a different name or absent from the platform's directory.

## Honest negatives

- No year-2 data exists on this surface: one frozen build, so no forward-longevity claim is possible and no backward harvest exists in the sitemap.
- Five country directories serve no city page: French Guiana, Honduras, Hungary, Iceland, Saint Pierre and Miquelon.
- `mosque`-source pages carry `null` in every adjustment field, so those tables cannot be reconstructed from stated parameters; the fitted adjustment is an inference, not the mosque's published parameter.
- Nothing here is a second surface for a city. This walk records one platform's directory and its tables; a city-level verdict still needs an authority or community surface beside it.

## Data

- `captures/cities/<country>/<city>.html`: the raw page for every city.
- `data/<country>-<city>.json`: dated rows, `{'YYYY-MM-DD': {fajr..isha}}`.
- `data/universe.tsv`, `data/fits.json`, `data/summary.json`.
- `tools/`: the harvest, the two fit stages and the summariser.
