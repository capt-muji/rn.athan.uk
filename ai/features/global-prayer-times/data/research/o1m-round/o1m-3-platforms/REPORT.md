# O1m-3 — the platform census

Workspace: `$HOME/athan-gitree/census/o1m/o1m-3-platforms/`.
Engine of record: adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`,
`Rounding.None`, timezone resolved per prayer instant so a DST step never leaks into a residual.
Dates come from the literal month headers and day numbers of each captured page; the weekday the
page prints is the calendar check. No clock is read anywhere in this wave.

Status of this document: written incrementally. Numbers below are script-counted from the
artefacts named beside them.

Artefacts: `captures/` 21,635 files / 3.1 GB (tawkit 1.0 GB, Diyanet 1.6 GB, masjidi 57 MB, hunt
1.4 MB); `data/` 301 files / 375 MB; `fit/` 79 files. Every surface named has its raw capture on
disk under the platform's own directory. **3,188,768 dated rows banked** — 3,177,878 from tawkit and
10,890 from Diyanet — plus the full 495-tenant masjidi configuration layer.

---

## 1. tawkit.net — the full universe, walked

### 1.1 Enumeration

The platform publishes a sitemap index of 32 children (`captures/sitemap.xml`). The place
sitemaps are one per interface language; `en` and `ar` are byte-identical in URL count. The
English place sitemap lists **8,784 URLs: 75 country pages and 8,709 city pages**
(`captures/places-en-urls.txt`, `data/cities.json`). The country pages agree with the sitemap
exactly (Russia's page links 861 cities, the sitemap lists 861).

There is no API and no year parameter. The city page renders the current month; the route
`/en/prayer-times/<country>/<city>/timetable/?m=all&print=1` renders a **rolling twelve-month
window** dated 11-2026 to 10-2027, in 95 KB. Probes for `&y=2025` through `&y=2050` all return the
same window (`captures/probe_y*.html`), so the ceiling is one published cycle, not a horizon.

### 1.2 Capture

**All 8,709 city pages and all 8,709 twelve-month routes were captured, zero failures**
(`captures/tawkit/city/`, `captures/tawkit/year/`, 965 MB). Each city also carries the live "today"
panel and its own coordinates in JSON-LD, so the capture holds both the table and the page's own
statement of today (`<time datetime="…">`).

### 1.3 Rows

- **8,708 of 8,709 cities parsed** into `data/tawkit/<country>.json`; **3,177,878 dated rows**.
- **3,177,878 of 3,177,878 rows pass the weekday check** — every dated row falls on the weekday
  the page prints for it. Zero exceptions. This is the dating proof: the year comes from the
  header, and the calendar confirms it without reading a clock.
- One city has no coordinates in its JSON-LD and is excluded; two cities carry a short month
  (see defects).
- 120 distinct timezones across the 75 countries.

Row counts by country: `data/country_city_counts.json`; parse summary:
`data/tawkit_parse_summary.json`.

### 1.4 The shape of the universe

75 countries, heavily skewed. Russia 860 cities, Spain 615, Indonesia 517, France 463, India 461,
Pakistan 453, Turkey 391, Yemen 313, Afghanistan 307, Syria 287, Australia 275, Kazakhstan 265.
Those are city pages; the fit counts in section 2 are lower because clock-defect cities are held
out (Spain 609, France 456, India 460). Eight countries are served by a single city (Aland Islands,
Belgium, Canada, Grenada, South Korea, Kuwait, Netherlands, New Zealand), so a country recipe fitted
on one city is a statement about that city, not about the country.

There is no mosque layer, no iqamah, no tenant: every surface is a city page on a computed table.
The platform is a calculator with a published output, not a mosque service, so the tier is
**platform** throughout and the record never reads it as authority.

The recipe the platform actually runs is visible in the fits below and is dominated by one pair:
**fajr 18, isha 17, Shafi**, which is MWL. Where a country departs from it, the departure is in the
per-column margin, not the angle.

---

## 2. Fits

One recipe per country over that country's clean cities. Engine adhan 4.4.6, `Rounding.None`,
timezone resolved per prayer instant. The fit searches the twilight model (angle or maghrib /
sunrise interval), the asr school, and an integer per-column margin — the margin is the platform's
own published offset, and 37 of 73 countries need none at all.

**Aggregate over 3,067,503 rows and 8,405 cities in 73 countries** (`fit/tawkit_country_fits.json`,
`fit/tawkit_table.md`):

- **88.5 pc of all cells within one minute**, 61.5 pc of cells exact to the minute, 65.2 pc of rows
  within one minute on all six columns and 13.6 pc of rows exact on all six. 65 pc joint is what six
  independent ±0.6-minute residuals must give; the per-cell figures are the ones that measure the
  recipe.
- **37 countries at or above 95 pc of cells within one minute** (1,706,615 rows); 46 at or above 90 pc
  (1,930,319 rows).
- **41 of 73 countries land on fajr 18.0**, 30 on isha 17.0, and **63 of 73 on Shafi asr**. The
  platform runs MWL 18/17 wherever it runs anything.
- **14 countries publish isha as an interval, not an angle**: maghrib + 90 in Yemen, Syria,
  Tanzania, Ethiopia, Burkina Faso, Sudan, Somalia and China; maghrib + 91 in Saudi Arabia and
  Qatar; maghrib + 90 in France.
- **10 countries read Hanafi asr**: Pakistan, Kazakhstan, Uzbekistan, Kyrgyzstan, the United
  Kingdom, Germany, Canada, Denmark, Belgium, Grenada. Pakistan is the one of those that is a clean
  national statement — 99.5 pc joint within one minute, 99.7 pc of cells, worst 25.5 min — and its
  pair is fajr 18.0 / isha 18.0 **Hanafi**, which is a different recipe from every Gulf neighbour.
  The five that also appear in the broken-fit table below carry their madhab pick from a defective
  surface and are not claimed.

The largest clean surfaces, in rows:

| country | cities | rows | fajr | isha | asr | solar RMS | joint w1 | cell w1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Spain | 609 | 222,285 | 15.00 | 15.01 | shafi | 0.65 | 77.6 | 95.3 |
| Indonesia | 517 | 188,614 | 19.41 | 18.59 | shafi | 1.49 | 85.7 | 95.3 |
| India | 460 | 167,897 | 18.00 | 18.00 | shafi | 1.95 | 93.9 | 95.3 |
| Pakistan | 453 | 165,345 | 18.01 | 18.00 | hanafi | 0.54 | 99.5 | 99.7 |
| Yemen | 313 | 114,245 | 18.51 | maghrib + 90 | shafi | 0.62 | 96.5 | 98.5 |
| Afghanistan | 307 | 112,055 | 18.00 | 18.01 | shafi | 0.71 | 85.5 | 96.7 |
| Syria | 287 | 104,755 | 18.46 | maghrib + 90 | shafi | 0.67 | 62.8 | 90.0 |
| Australia | 275 | 100,375 | 17.99 | 16.99 | shafi | 1.52 | 86.3 | 96.4 |
| Saudi Arabia | 202 | 73,730 | 18.43 | maghrib + 91 | shafi | 54.32 | 37.5 | 82.2 |
| Nigeria | 202 | 73,730 | 19.39 | 17.62 | shafi | 0.59 | 77.8 | 96.1 |
| Tanzania | 185 | 67,525 | 18.50 | maghrib + 90 | shafi | 0.46 | 95.8 | 98.9 |
| Malaysia | 179 | 65,335 | 17.89 | 18.11 | shafi | 0.56 | 81.7 | 96.4 |
| Jordan | 141 | 51,465 | 18.01 | 18.00 | shafi | 0.52 | 94.0 | 98.8 |
| Bangladesh | 104 | 37,960 | 18.01 | 18.00 | shafi | 0.39 | 98.9 | 99.7 |
| Sri Lanka | 89 | 32,485 | 19.04 | 18.00 | shafi | 0.32 | 12.8 | 74.7 |

Full table for all 73 in `fit/tawkit_table.md`. Two of the largest surfaces are deliberately absent
from it because their fit is not clean enough to table: Russia 313,900 rows at 73.3 pc of cells and
France 166,440 at 77.8 pc with margins of −3 to +6, and Turkey 142,715 at 83.0 pc. Both of the
platform's two biggest country sets therefore carry a per-column convention the integer margins only
partly absorb.

The country solar RMS in that table is a plain RMS over every row, so a handful of broken city pages
carry it: Saudi Arabia's median city sits at 0.61 minutes while six of its 202 cities run past 5
minutes and two past 500 (`al-hijrah`, `algoze`), which is what puts 54.32 in the column. Oman has
four such cities, Libya ten, Norway six. Read the column beside `worst` and the cell figure, not
alone.

**Eleven countries publish isha as an interval** among the credible fits: maghrib + 90 in Yemen,
Syria, Tanzania, Ethiopia, Burkina Faso, Sudan, Somalia and China; maghrib + 91 in Saudi Arabia and
Qatar; maghrib + 90 in France. The three remaining interval picks — Germany, Canada, Denmark at
maghrib + 130 to + 139 — come from broken fits whose margins reach ±70 minutes, and are not claimed
as findings.

**Two countries have no fit at all.** Morocco: 262 of its 263 cities carry a clock step inside the
window and the 263rd also fails the screen, so no clean city survives. Netherlands: its single city
fails the same screen. Both are recorded as screened, not as fitted.

**Eight countries fit badly and the cause is named, not hidden** — they are the clock-defect class,
not recipe failures:

| country | cell w1 | worst | cause |
| --- | --- | --- | --- |
| Germany | 5.9 | 93.4 | eight city pages, four of them junk slugs (`kehi`, `kiel2`, `gebetszeiten`) on foreign points |
| Belgium | 19.7 | 60.8 | one city, a 60-minute step |
| United States | 23.4 | 36.0 | three cities, one hour out |
| Denmark | 27.0 | 69.8 | a 60-minute step |
| Canada | 32.1 | 77.0 | one city, Vancouver, a 60-minute step |
| New Zealand | 33.3 | 60.7 | Auckland's clock, section 3 |
| Norway | 58.8 | 509.1 | a single city (Bodo) whose asr prints 20:37 for a 12:08 reading |
| Kazakhstan | 64.8 | 99.4 | after-midnight isha printed as 01:36 on a table computed to 23:57 |

**Grade.** Every country here is **one published cycle** — the rolling twelve-month window the
platform serves and nothing else — so per FIT-RULES each family is **provisional**, platform tier.
Two years are not available on this platform by any route found, so nothing lifts to A. What the
span does give is a genuine seasonal test: twelve months, both solstices, and the weekday check
confirms all 3.18 million rows against a real calendar.

**Seasonal amplitude and between-year stability.** No between-year test exists here. The seasonal
amplitude is real and measured per country in `seasonal` in each `fit/countries/<country>.json`:
the January-to-July sunrise residual moves by up to 1.7 minutes at 42 N (Andorra) and settles below
0.4 minutes in the tropics. That wave is a smooth annual function, negative in spring and positive
in autumn, and it is a platform-side signature rather than a fit error: the same table holds its
six columns to 0.6 minutes RMS all year and simply sits a little long in April and a little short
in October. It is not the masjidi engine — a 0h UT daily evaluation makes it worse here, not better
(`scripts/dailytest.mjs`).

---

## 3. Defects and gates

Every city surface was screened against the coordinate its own page publishes: the six columns are
recomputed on adhan 4.4.6 at that point and timezone, and the residual is classified by its
*spread* rather than its level, because a constant per-column offset is a published convention and
a step or a drift is a defect (`data/tawkit_city_checks.json`, `scripts/check_cities.mjs`).

| class | cities | what it is |
| --- | --- | --- |
| clean | 7,266 | residual spread under the thresholds; median solar RMS 0.59 min |
| clock step | 313 | the dhuhr residual steps by 60 minutes inside the window |
| geometry | 1,129 | sunrise/maghrib spread above 4 min — a per-column convention or a wrong point |

The clock class is the largest single defect and it is country-shaped, not random: **Morocco 262
cities**, Germany 8, France 7, Spain 6, Norway 5, United States 4. Morocco's 262 is the standard
time/`Africa/Casablanca` mismatch: the table is printed on one clock and the page declares another,
with a 61-minute range inside one window. Cairo carries the same signature over a 61-minute range.

The geometry class is country-shaped too: **France 455, Turkey 391, Jordan 140, Indonesia 56,
Palestine 24**. In France, Turkey and Jordan the whole national table carries a per-column margin
of several minutes — a Diyanet-style temkin, which the country fits below absorb as an integer
offset. It is not a wrong point; the residual does not drift.

Two named city defects:

- **Auckland**: the page publishes latitude −36.9027, longitude **166.9508**. Auckland sits at about
  174.76 E, so the published point is 7.8 degrees west of the city, and the table is computed at
  that published point: dhuhr runs about 31 minutes late against the real city. The table and the
  coordinate agree with each other and both disagree with Auckland.
- **Auckland again, on the clock**: outside the southern summer the table runs a further 57 to 61
  minutes early (May to August), so the page applies a two-hour annual swing where New Zealand has
  one.

Two high-latitude truncations, which is the correct behaviour and worth recording as such: Harstad
carries 265 rows and Tromso 247 of the 365, because the platform omits the days on which the
twilight event does not occur rather than clamping it.

One city carries no coordinates in its JSON-LD and is excluded from the fits.

---

## 4. masjidi.app — the tenant layer completed

The prior wave fitted all 167 regional tables and sampled 86 tenant screens. This wave captured
**all 495 tenant screens** and extracted every configuration
(`captures/masjidi/`, `data/masjidi_configs.json`, `scripts/masjidi_configs.mjs`).

- **468 table tenants over 167 distinct tables and 24 countries**; **27 AlAdhan tenants over 10
  countries** (`data/masjidi_tenants_full.json`, `data/masjidi_aladhan_27.json`).
- **All 495 iqamah layers banked**, not 86: per prayer a wait in minutes, an athan offset, a
  duration, and every date override (all 495 tenants carry at least one, the Jumu'ah rule).
- **86 tenants carry a non-zero athan offset**, so for those the athan is not the table. The offset
  layer is banked per tenant per prayer.
- Nothing was left unfitted at table level: the 167 tables served are exactly the 167 tables fitted
  (set difference empty in both directions, `scripts/bank_masjidi.mjs`).
- `daylightSaving` is `strategy-or-timezone` on 495 of 495, so the DST step is a client rule, which
  is why the tables themselves are standard-time arrays.
- The 27 AlAdhan tenants are the only masjidi records carrying coordinates. They publish latitude
  and longitude explicitly and some name a method (tenant 1099, Balakovo, names method 2 and school
  1). A platform method label is not provenance; the coordinates are the new fact.

Family index, tenant-weighted over the 167 tables (`fit/masjidi_families.json`), 25 families. The
top six by tenants:

| country | tables | tenants | fajr | isha | horizon | within-1 |
| --- | --- | --- | --- | --- | --- | --- |
| Lebanon | 16 | 244 | 19.91 | 17.19 | 1.49 | 68.9 |
| Saudi Arabia | 25 | 49 | 18.42 | maghrib + 90 | 0.95 | 93.1 |
| Algeria | 22 | 31 | 18.31 | 16.77 | 1.15 | 93.0 |
| Indonesia | 22 | 23 | 19.40 | 18.59 | 1.64 | 95.9 |
| Syria | 13 | 20 | 18.22 | 16.85 | 1.03 | 91.8 |
| Oman | 11 | 16 | 18.54 | 17.46 | 1.38 | 95.8 |

Lebanon remains the only family below the floor, at 68.9: the publisher-side declination-amplitude
defect the prior wave measured, now carried across 244 tenants instead of the 161 it scored before.
The high-latitude three (Norway, Sweden, Belgium) are untouched here; another wave owns them.

---

## 5. New-platform hunt

**Diyanet, the Turkish Religious Affairs Directorate's own namaz vakit service**
(`namazvakti.diyanet.gov.tr`). This is not a mosque-website service; it is a national authority
publishing a calendar for the world, and it is the largest new surface the hunt found.

- **209 countries, 365 provinces, 18,582 cities** enumerated from the site's own cascading
  selectors (`data/diyanet_tree.json`, `captures/diyanet/country_*.html`). 46 provinces hold a
  single city, so their table is unambiguous.
- **363 province tables banked over 207 countries, 30 dated rows each, 10,890 rows**
  (`data/diyanet/`, `scripts/parse_diyanet.mjs`), window 2026-11-12 to 2026-12-11.
- The pages carry no coordinates and no timezone, so latitude is recovered from each table's own
  day-length curve and every column is scored as an interval against dhuhr, which fits the clock
  out (`fit/diyanet_country_fits.json`, 207 countries).
- **Measured temkin**: against adhan 4.4.6 the published columns sit at a constant −4.8 min on
  imsak, sunrise, maghrib and isha, and −7.2 to −7.7 min on asr, with dhuhr unmoved. That constant is the
  publisher's own margin, and after it the tables reproduce at a median 83.3 pc within one minute
  on the imsak column. Turkey's recovered pair is imsak 17.39 and isha 16.35 at asr factor 0.948.

**A capture defect that limits this surface, stated plainly.** The city postback is ignored by the
server: posting two different city ids inside one province returns the same table, and that table
is the province's first city. The German and United States provinces were checked city by city
and 767 of 814 carried one identical table. The province page is therefore the only correctly labelled level —
it renders the table of the province's own first city and names that city in its own dropdown — and
that is what is banked. A per-city Diyanet layer needs a real browser session driving the async
postback, and is queued.

**Other candidates refused, with the reason** (all probed, raw pages in `captures/hunt/`):

- `my-masjid.com` — HTTP 454, no public page.
- `praywatch.islamicity.org` — 403 to a browser user agent; a calculator, not a published table.
- `fiveprayers.org` — a display system for mosques, no dated table.
- `timesprayer.com` — 9 bytes, a client-side shell.
- `islamicfinder.org` — live, but the city pages render from a client calculator; no dated table to
  gate.

---

## 6. Honest negatives

- **No FALLBACK country is lifted by tawkit.** The eleven still-fallback countries (South Sudan,
  Liberia, Turkmenistan, Nepal, Myanmar, Guyana, Papua New Guinea, Solomon Islands, Vanuatu, Samoa,
  Kiribati) are not in the platform's 75-country list at all. What the census adds is depth, not a
  lift: 42 countries gain forty or more cities where the record previously held a capital or a
  handful (Yemen 313, Afghanistan 307, Syria 287, Kazakhstan 265, Sudan 75, DR Congo 65, Somalia 56,
  Kenya 51).
- tawkit.net serves no year parameter; probes for 2025 through 2050 all return the same rolling
  window, so the ceiling is one published cycle and no country can lift to A on this platform.
- No masjidi tenant outside the 468 table tenants publishes a dated table; the 27 AlAdhan tenants
  are a live API call, not a publication.
- The Diyanet per-city route is not reachable by plain HTTP; recorded, not failed.
- No public sitemap or directory was found for a mosque-website platform beyond the four already in
  the programme (masjidal, masjidi, mawaqit, masjidbox) and tawkit.

---

## 7. NEXT

1. **Year-2 on tawkit.** Today the platform serves one rolling window. Watch it: re-capture the same
   city set after the window rolls and check whether the new window reproduces the old on the
   overlapping months. If it does, every country here lifts from provisional to A on a genuine
   two-year test; if it shifts, the shift dates a regime change. This is the cheapest A in the
   round and it costs one re-crawl.
2. **The Morocco clock.** 262 of 263 cities print on a clock the page does not declare. Resolve
   which clock the table uses (it looks like UTC+0 against a declared `Africa/Casablanca`), then
   re-fit Morocco and Netherlands.
3. **The high-latitude rule.** Norway, Sweden, Kazakhstan, Aland and the UK all fail on
   after-midnight rendering rather than on angles: isha printed as `01:36` and asr as `20:37` are
   next-day values in the same cell. A rule that unwraps them would lift five families at once.
4. **Germany's junk slugs.** `kehi`, `kiel2`, `gebetszeiten` sit at longitudes of −1.1 and +1.5
   degrees under `Europe/Berlin`. Either the platform has a broken GeoNames match or the slugs are
   placeholders; the country has eight cities and four are unusable.
5. **The Diyanet per-city route.** The province layer is banked; the per-city layer needs a browser
   session driving the async postback. 18,582 cities and a longer window are waiting behind it,
   which is the largest single remaining surface found this round.
6. **Cross-platform identity check.** tawkit, masjidi and athanpro all publish computed tables. The
   seasonal waves measured here and in the masjidi wave are not the same signature; a three-way
   comparison on one city would say whether they share a library or only a family.
7. **A conflict to record, not to resolve here.** The record carries India's isha as a 17-degree
   line from ten official city tables. tawkit's 460 Indian cities reproduce at isha 18.0 with 95.3 pc
   of cells within one minute. Both can be true — a platform default and a national convention —
   but the index entry should say which is which.
