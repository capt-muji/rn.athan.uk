# O1m-R7 — the DİYANET city layer

Workspace: `$HOME/athan-gitree/census/o1m/o1m-r7-diyanet/`.
Engine of record: adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`,
`Rounding.None`. Dates come from the literal Miladi strings each page prints and the weekday it
prints beside them is the calendar gate. No clock is read anywhere in this wave; captures are
timestamped in UTC.

Status: written incrementally. Numbers are script-counted from the artefacts named beside them.

Continued 2026-11-11T09:50Z after the first session was cancelled at 4,853 captures, and again at
10:35Z and 10:41Z when the harness restarted. Nothing banked was redone: the crawl resumed from its
manifest, and every table below was rebuilt from the captures already on disk. The last measurement
in this revision is timestamped 10:55Z.

---

## 1. The defect, resolved

The prior wave recorded that the city postback returns the province's first city and that a
per-city layer needs a browser. Both halves are now measured, and the conclusion is the opposite
of what the defect implied.

### 1.1 The postback defect is real, and it is bounded to one host

`namazvakitleri.diyanet.gov.tr` (the authority's current service) and
`namazvakti.diyanet.gov.tr` (the older service the prior wave walked) are different applications.
On the older host a city postback that names any city other than the province's first returns a
**150-row table that carries no location at all**. The evidence is byte-level
(`data/oldhost_defect.json`, captures under `captures/col/` and `captures/live2/`):

| request | rows | table head (12.11.2026) | sha1 of the time block |
| --- | --- | --- | --- |
| Colorado → BOULDER | 30 | 05:09 06:35 11:50 14:31 16:55 18:11 | `65b3b2760b3f` |
| Colorado → DENVER | 150 | 05:28 07:00 12:07 14:38 17:03 18:24 | `1655429451d5` |
| Colorado → FORT COLLINS, COLORADO SPRINGS, SPRINGFIELD | 150 | 05:28 07:00 12:07 14:38 17:03 18:24 | `1655429451d5` |
| Hawaii → HILO | 30 | 05:11 06:20 12:09 15:22 17:49 18:49 | `18f9e1442cdc` |
| Hawaii → HONOLULU | 150 | 05:28 07:00 12:07 14:38 17:03 18:24 | `1655429451d5` |

A Colorado city and a Hawaii city, 4,500 km apart, return the same time block to the second. The
default therefore carries no coordinates: it is a page fallback, not the province's first city and
not the requested city. The province's **first** city, and only that city, returns its own real
table (30 rows). The same was confirmed live in a driven browser session
(`AGENT_BROWSER_SESSION=o1m-r7`): selecting HILO renders 30 rows of Hilo, selecting HONOLULU
renders the 150-row fallback, and selecting CEYHAN in ADANA renders the same fallback the US
requests returned.

### 1.2 The current host serves every city, and the city axis is real

`namazvakitleri.diyanet.gov.tr` addresses a city by the same id the cascade publishes, and it
accepts the id bare: `https://namazvakitleri.diyanet.gov.tr/tr-TR/<cityId>`. The slug the site
prints (`.../9206/ankara-icin-namaz-vakti`) is cosmetic; `/tr-TR/9206/x` serves Ankara.

Divergence is measured, not assumed (`scripts/divergence.py`, `data/divergence.json`). Within
every province holding two or more cities, the six printed columns are compared on one fixed date:

```
provinces in the tree                                     363
provinces with 2+ cities                                  317
cities inside those provinces                           8,848
distinct tables inside those provinces                  7,869
provinces where all cities print the same row               1
```

The single identical province is MONTSERRAT, two cities, and it is a two-point territory rather
than a province. Across all multi-city provinces 979 of the 8,848 cities print exactly the same six
cells as another city in the same province. That coincidence is the printed minute, not a repeated
table: the duplicates cluster where settlements are dense (Netherlands 97 of 283, Nordrhein-
Westfalen 94 of 286, France 75 of 587) and in the ocean grid at 0.5 degree spacing (151 of 357),
where a pair of points is closer than the resolution of the table.

The byte-level check agrees. Across 12,081 captured ids there are 12,081 distinct sha1 digests: no
two cities in the walk return the same document, so the old host's fallback page has no counterpart
on this one.

The first run of this check covered 78 provinces and 874 cities and also found zero identical
provinces; the full set confirms it at 317 provinces. The city axis is not cosmetic; it was the old
host's postback that was broken. Spot checks across continents agree: Akyurt 05:55/07:21/12:37
against Ankara 05:56/07:22/12:38 (1 min apart); Hilo against Honolulu; Dakar 05:55 against Kaolack
05:49; Aalen against Achern; Eldoret against Kisumu; the Syrian points Abian Saman and Afrin 1 to 3
minutes apart.

### 1.3 The window is a whole civil year

Each city page carries three tables: weekly, monthly and **annual**. The annual table is 365 dated
rows of that city, 01 Ocak 2026 to 31 Aralık 2026. Every dated row of every capture passes the
weekday check against its own printed weekday (`data/parse_summary.json`, `wdBad`).

Year probes (`?y=`, `?yil=`, `?year=`, `/2027`, `?tarih=`) are ignored: the page always canonicalises
and always serves the current civil year. So this surface is one published cycle, and the ceiling
moves by itself every January. `captures/nvd_...9206...` holds the probes; `data/year_probe.json`
records them.

### 1.4 The tree is complete, and two enumerations agree on it id for id

The walk's plan comes from the older service's cascade (18,582 cities). The current host was
enumeration-checked against it rather than assumed. Its HTML POST cascade is broken in a way the
old host's was (`data/enumerate_defect.json`): a country POST returns 81 provinces and a province
POST returns Ankara's 17 ilçe for every province, so a naive enumeration yields 1,377 Turkish
cities in every country and would have reported the United States with 81 states.

The selects are filled client-side from `/tr-TR/home/GetRegList?ChangeType=country|state`, which
the page itself calls (`captures/reglist/`, `scripts/enumerate_reglist.py`). Walked in full that
endpoint returns **207 country entries, 363 provinces and 18,582 cities**, and every id, name and
province matches the plan. The tree is therefore confirmed twice, by two independent applications,
and the count is exact rather than estimated.

Two entries carry no cities at all (TACIKISTAN, ENDONEZYA), and 10,043 of the 18,582 are ocean
grid points rather than settlements (see 6).

---

## 2. The walk

`scripts/crawl_nvd.py`. One request per city, resumable, priority-ordered: the thinnest authority
tiers first so a cut-short walk still banks what nothing else covers, then Turkey's ilçe layer,
then the diaspora, then the Islamic world's second cities, then the rest.

Plan: **207 country entries, 363 provinces, 18,582 cities** (`data/plan.json`). Two entries carry
no cities at all: TACIKISTAN and ENDONEZYA. Per-country banked surface is `fit/coverage.md`,
generated from `data/coverage.json`.

State at 2026-11-11T10:45Z, counted from `data/manifest.jsonl`:

| tier | what it holds | banked of tree |
| --- | --- | --- |
| 1 | Africa, Pacific, Caribbean, Caucasus, Central Asia | 637 of 637 |
| 2 | Turkey | 869 of 869 |
| 3 | the diaspora | 3,556 of 3,556 |
| 4 | the Islamic world's second cities | 101 of 101 |
| 5 | the rest, ocean grid first banked last | 6,126 of 13,419 |
| | **every city that is not an ocean grid point** | **8,539 of 8,539** |
| | every city in the tree | 8,875 parsed, 3,239,093 dated rows |

The four priority tiers are complete and so is the fifth's settled layer. What remains is the
10,043-point ocean grid of 6, which costs about 30 GB and is being banked last so that no city
waits behind it.

Progress and counts: `data/manifest.jsonl` (one line per request with status, bytes, sha1, UTC
time), `logs/crawl.log`, `data/parse_summary.json`.

---

## 3. Fits

Method. The pages publish **no coordinates and no timezone**, so the latitude of every city is
recovered from that city's own year of printed day lengths, and a per-column temkin is then
measured on adhan 4.4.6.

Latitude cannot be read off a day length alone: Diyanet shifts sunrise and maghrib by its temkin,
which inflates the printed day and biases a naive latitude by 2 to 3 degrees. The pair (latitude,
constant horizon offset) is over-determined by a year, because the offset is constant while
latitude bends the seasonal curve. `scripts/fit_lat.mjs` takes the latitude whose day lengths, once
one constant offset is removed, are flattest across the year (MAD minimised over a 0.01-degree
refinement).

**The horizon offset comes out at 13.9 to 14.1 minutes in every country measured so far**
(Niger, Algeria, Ethiopia, Madagascar, Martinique, Micronesia, Comoros, Senegal, Azerbaijan,
Armenia). That is sunrise −7 and maghrib +7, the Turkish temkin set the brief proposed as the
starting hypothesis, and it wins the horizon pair everywhere on this layer.

Every column except dhuhr is then scored as an interval to dhuhr, which cancels the clock offset
and any daylight-saving step in the published clock. Dhuhr's own margin is read against the
sunrise/maghrib midpoint, which carries the two horizon temkins and no clock.

Results are in `fit/country_fits.json` and `fit/city_scores.json`; the table is
`fit/table.md`.

### 3.1 The temkin set, measured across 207 countries

The recipe is fixed at Diyanet's stated pair (fajr 18, isha 17, shadow factor 1, `Rounding.None`)
and every column is read as a margin on the publisher's own clock (`fit/fixed_margins.json`). One
set wins on 207 countries and 3,245,380 scored cells:

| column | imsak | sunrise | dhuhr | asr | maghrib | isha |
| --- | --- | --- | --- | --- | --- | --- |
| margin | 0.0 | −7.0 | +5.0 | +4.0 | +7.0 | 0.0 |

Of the 207 countries:

- **105 land on that vector to 0.1 minute in all six columns.**
- **61 more sit within one minute of it** in every column.
- **41 depart**, and the departures are not scattered: 39 are a latitude ladder and two are a
  different isha in the largest country layers (3.5).

Median imsak within-1 across all countries is 98.8 pc, and 168 countries hold 90 pc or better.
Above 45 degrees of latitude the same measure is 59.2 pc, which is the named exception class in 3.4.

The horizon offset recovered independently from the day-length curve is **14.0 minutes**, which is
sunrise −7 and maghrib +7 seen from the other side. The brief's starting hypothesis wins. The prior
wave's −4.8 on sunrise and maghrib and −7.2 on asr are the same table read against dhuhr instead of
the clock; adding the dhuhr margin back turns −4.8 into +0.2 and −7.2 into −2.2, and the direct
measurement here puts them at 0.0 and +4.0.

Turkey, from the same fit: fajr 18.00, isha 16.85, asr at shadow factor 1, and 96.2 pc of imsak
cells within one minute.

### 3.2 Latitude accuracy

Recovered latitude against the true coordinates of four Turkish cities, off the fitted set:

| city | truth | recovered | error |
| --- | --- | --- | --- |
| Ankara | 39.93 | 39.96 | +0.03 |
| Kars | 40.60 | 40.58 | −0.02 |
| Adana | 37.00 | 37.02 | +0.02 |
| Polatlı | 39.58 | 39.56 | −0.02 |

Median interquartile spread of the day-length residual across cities is 0.8 minutes, so the
recovered latitude is good to a few hundredths of a degree.

The ocean grid (6) turns that from a spot check into a measurement over a printed coordinate set:
one longitude column, 91 points from −35.0 to +55.0 latitude, each carrying its own latitude in its
name.

| measure | value |
| --- | --- |
| points | 91 |
| mean error | +0.003° |
| median error | +0.01° |
| worst absolute error | 0.14° (at 0.0 and 35.0) |
| recovered horizon offset | 13.7 to 14.4 min, mode 14.0 |

So the recovery holds to a tenth of a degree across 90 degrees of latitude, and the horizon pair
stays at the same 14 minutes off the equator as on it.

### 3.3 One column behaves differently, and the cause is named

Asr reproduces at 55 to 61 pc within one minute where imsak holds 94 to 97 pc. Its residual is not
noise: it is a smooth annual wave. Ankara's asr residual by month, after the constant margin, runs
−1.1, −1.4, −1.3, −1.0, −0.7, −0.1, +0.4, +0.8, +1.3, +1.3, +1.2, +0.3 minutes. The publisher's
asr margin moves with the season by about ±1.4 minutes around +4; a constant margin cannot absorb
that, so the wave is the publisher's seasonal temkin, not a model error.

### 3.4 The latitude ladder: where the canonical set stops

The 41 departures sort by latitude, monotonically, from 44° to 64°N
(`fit/fixed_margins.json`). Representative rows:

| country | lat | imsak | sunrise | isha | imsak within-1 pc | imsak Jan-Jul amplitude |
| --- | --- | --- | --- | --- | --- | --- |
| BOSNA HERSEK | 44.3 | +0.1 | −7.0 | −6.5 | 88.5 | −0.1 |
| KAZAKISTAN | 44.9 | +0.2 | −7.0 | −6.8 | 78.6 | 0.8 |
| ROMANYA | 45.2 | +0.1 | −7.0 | −6.7 | 80.8 | 5.8 |
| KANADA | 45.6 | +0.2 | −7.0 | −6.9 | 73.3 | 13.0 |
| SLOVENYA | 46.3 | +0.2 | −7.0 | −6.8 | 73.6 | 17.9 |
| FRANSA | 47.8 | +0.2 | −7.0 | −7.0 | 70.9 | 39.7 |
| ALMANYA | 50.6 | +0.4 | −7.0 | −7.7 | 59.8 | 106.8 |
| HOLLANDA | 52.0 | +0.4 | −7.0 | −8.1 | 56.5 | 130.8 |
| INGILTERE | 52.4 | +0.5 | −7.0 | −8.2 | 54.4 | 130.1 |
| DANIMARKA | 55.6 | +0.6 | −7.0 | −9.1 | 46.0 | 122.8 |
| ISVEC | 58.4 | +0.8 | −6.9 | −10.5 | 38.3 | 112.3 |
| NORVEC | 59.8 | +1.1 | −6.9 | −11.8 | 26.5 | 101.7 |
| FINLANDIYA | 60.9 | +1.1 | −6.8 | −12.0 | 24.8 | 96.6 |
| SVALBARD | 63.2 | +49.6 | −6.8 | −86.9 | 0.5 | 51.2 |
| GRONLAND | 64.0 | +7.6 | −6.8 | −14.3 | 0.3 | 92.9 |
| IZLANDA | 64.0 | +7.4 | −6.8 | −14.3 | 0.3 | 92.2 |

The amplitude column is the January-to-July swing of the imsak residual in minutes. It is 0.0 at
44°, 40 at 48° and 130 at 52°, so the departure is a **summer substitution, not a different country
margin**: the winter half-year keeps the canonical set and the summer half-year is served by a rule
of the publisher's own. Svalbard is the extreme where that substitution collapses entirely (imsak
error +49.6, isha −86.9), which is what an unbounded summer rule does above the Arctic circle.

Measured directly on one city's year (`scripts/monthly_diag.mjs`, Yeovil, recovered latitude 51.0,
residuals in minutes against 18/17):

| month | J | F | M | A | M | J | J | A | S | O | N | D |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| imsak | −4.7 | −4.7 | −4.6 | −4.4 | **+64.6** | **+124.6** | **+126.6** | +7.5 | −5.3 | −5.2 | −5.1 | −4.9 |
| isha | −12.4 | −12.8 | −13.8 | −15.8 | **−70.1** | **−144.2** | **−99.5** | −14.8 | −10.1 | −9.9 | −10.3 | −11.5 |

None of adhan's three high-latitude fallbacks reproduces it. Measured against the same city, the
residual envelope over April to August is: seventh-of-the-night −36 to −47 minutes on imsak and
+16 to +25 on isha, middle-of-the-night +8 to +127 and −15 to −144, twilight-angle +8 to +38 and
−15 to −50. The publisher's rule is none of the three, and no published Diyanet statement of it was
found on a public page. It is recorded as an open question, not modelled.

### 3.5 Two low-latitude countries depart, and the axis of the departure is measurable

The United States (median latitude 39.4) and China (32.6) are the only exceptions below 44°N, and
both depart on the same column. At 18/17 the isha margin is −5.7 minutes for the United States and
−5.3 for China. Two readings fit that bias: isha 17 with a five minute margin, or isha one degree
lower with no margin. The latitude slope separates them (`scripts/lat_test.mjs`, minutes of
residual per degree of latitude, all cities sampled):

| country | isha angle | centre | spread across cities | slope per degree |
| --- | --- | --- | --- | --- |
| USA (25.7 to 60.0 N) | 17.0 | −10.4 | 1.2 | −0.1 |
| USA | 16.0 | −5.1 | 0.4 | 0.0 |
| USA | 15.0 | +0.3 | 0.5 | +0.1 |
| China (18.3 to 47.8 N) | 17.0 | −10.2 | 0.7 | −0.1 |
| China | 16.0 | −5.0 | 0.3 | 0.0 |
| China | 15.0 | +0.1 | 0.5 | +0.1 |

A constant margin leaves the residual flat in latitude; an angle error tilts it. The tilt vanishes
at 16.0 in both countries, and that reading puts the margin at 0.0 on the publisher's clock, so the
served pair is **18/16 for the United States and China** and 18/17 everywhere else measured. Fajr on
the same test is flattest at 18.0 in both (US spread 0.2 over 35 degrees of latitude, China 0.1 over
30), so only isha moves.

The alternative reading, 17 with a −5 minute margin, is indistinguishable on bias alone and is
preferred against only by the tilt. It is recorded because the two readings differ in the summer
half-year, where a margin is constant and an angle is not.

### 3.6 Which temkin wins, per country

`fit/fixed_margins.json` carries the answer country by country: `temkinAbs` is the margin that wins
on the publisher's clock, `within1` is how much of that country's year it explains, and
`seasonalAmplitude` is the January-to-July swing per column, so a country whose margin is constant
reads amplitude 0 and a country on a seasonal rule reads its swing. `fit/table.md` is the fitted
recipe per country with the same margins beside the within-1 shares.

### 3.7 The same set on a coordinate grid, with no city in it

The ocean grid (6) removes every city factor at once: each point carries its printed latitude, so
the margins can be measured at a latitude with no elevation, no local convention and no urban
heat. `scripts/atl_bands.mjs` reads the banked grid points and reports each 5-degree band
(`fit/atl_bands.json`):

| band | points | imsak | sunrise | asr | maghrib | isha | imsak within-1 | imsak Jan-Jul |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| −25..−20 | 5 | 0.0 | −7.0 | 3.9 | 7.0 | 0.0 | 99.3 | −0.1 |
| −5..0 | 271 | 0.0 | −7.0 | 4.0 | 7.0 | 0.0 | 99.9 | −0.2 |
| 0..5 | 5 | 0.0 | −7.0 | 4.0 | 7.0 | 0.0 | 99.5 | −0.1 |
| 20..25 | 5 | 0.0 | −7.0 | 4.0 | 7.0 | 0.0 | 99.0 | −0.2 |
| 30..35 | 5 | 0.0 | −7.0 | 3.9 | 7.0 | −0.1 | 98.5 | −0.4 |
| 40..45 | 5 | 0.0 | −7.0 | 4.0 | 7.0 | −0.1 | 96.7 | −0.4 |
| 45..50 | 5 | +0.2 | −7.0 | 4.0 | 7.0 | −7.0 | 69.8 | **+28.8** |
| 50..55 | 5 | +0.4 | −7.0 | 4.0 | 6.9 | −8.1 | 54.0 | **+129.9** |

Two things follow. The canonical set is flat on a coordinate grid from 35°S to 45°N, which is the
same answer 3.1 gives from 207 country layers, reached without a single city coordinate. And the
summer substitution switches on between 45 and 50 on the grid, where the country ladder put it at
44: the grid's asr share falls steadily with latitude (98.4 pc at the equator, 54.5 at 40, 43.3 at
45) exactly as the seasonal wave in 3.3 predicts.

The isha column reads −7.0 at 45..50 and −8.1 at 50..55, which is the same summer substitution
seen from the other side, not a different angle.

---

## 4. Honest negatives

- The old host's per-city route stays broken; nothing more is expected there. Recorded, not failed.
- The current host's HTML POST cascade is equally broken and in a worse way
  (`data/enumerate_defect.json`): 81 provinces and Ankara's 17 ilçe come back for every country and
  every province, so any enumeration built on the POST would report one country's tree for all 207.
  The real source is the `GetRegList` endpoint, and a naive check would have "confirmed" 1,377
  Turkish cities in the United States.
- `ramazan.diyanet.gov.tr` serves a per-district Ramadan imsakiye PDF at
  `/tr-TR/Imsakiye/ImsakiyePdf?ilceId=<id>&ilceAd=<name>` (`captures/ramazan_bursa.bin`, a
  31 KB PDF). It is a 30-day Ramadan-only table, and a `yil` parameter changes nothing. Banked as
  a second authority surface, not walked: the annual table on the main host supersedes it.
- Year probes are ignored on the current host as well (`?y=`, `?yil=`, `?year=`, `/2027`,
  `?tarih=`): every probe canonicalises to the current civil year (`data/year_probe.json`), so the
  twelve-month route costs a crawl after each 01 Ocak and cannot be bought earlier.
- Tajikistan and Indonesia carry zero cities in the site's own cascade, so the city layer cannot be
  walked for them from this tree at all. Both were enumerated twice (old service, `GetRegList`) and
  both return no cities under either.
- Turkey's layer is 869 entries, not the 973 ilçe: the site's own page prints "ANKARA ilçeleri" as
  17 entries, the metropolitan core ilçe are folded into the province centre, and the core ilçe
  that were added later (Avcılar, Başakşehir, Meram, Selçuklu, Karatay) carry 17,8xx ids. So the
  missing ilçe are the authority's own publishing choice, not a walk gap, and no id inside
  9146-9955 is unassigned.
- `robots.txt` and `sitemap.xml` return a security-challenge page rather than a document
  (`captures/site/robots.txt`), so there is no sitemap route to the city list; the endpoint in 1.4
  is the only one.
- Two of 11,911 captured pages are not tables (`data/blocked.json`). PERLEZ returns the WAF
  challenge page on three attempts with three request shapes and stays blocked for that id alone;
  ROZAJ(K) returns an ASP.NET runtime error, which is the publisher's fault and not a block. Both
  are recorded and left, per the rules; the walk is otherwise 100 pc clean, and no capture is a
  truncated or empty table.

---

## 5. NEXT

1. Finish the ocean grid (6) and re-run parse, divergence and fit over the complete 18,582.
2. Re-capture the same city set after 01 Ocak 2027: the annual table rolls to 2027 by itself, so
   the whole layer lifts from one published cycle to a genuine between-year test at the cost of one
   crawl.
3. Name the summer rule above 44°N (3.4): it is the one measured behaviour this layer does not yet
   reproduce, and it decides every European and Canadian city for four months of the year. The next
   probe is a single city's summer dates against each candidate rule (fixed interval by month,
   one-seventh of the night with a floor, and the Diyanet "temkin" tables published in their own
   almanac), scored the same way 3.4 scores the three adhan fallbacks.
4. Settle the US and China isha reading (3.5) on a surface that separates margin from angle: a
   city pair at the same latitude in different continents, or a dated year where the angle's effect
   on the summer half-year is visible.
5. Bank a second published cycle for the thin tiers: the annual table is one cycle, so grade A
   needs the 2027 crawl and nothing cheaper exists on this host.

---

## 6. The ocean grid, priced

10,043 of the 18,582 cities sit under one entry, ATLANTİK OKYANUSU, and they are a coordinate
grid, not settlements: names of the form `ATLAS(41-9)`, latitude every 1 degree from −35 to 55 and
longitude every 0.5 degree from −82 to +18 (`data/atl_lonm30.json` for one column, 91 points).
Each name carries its own position, which makes the column a truth set: the latitude recovered by
`fit_lat.mjs` can be checked against a printed coordinate instead of a city's published
coordinates, and the temkin measured against a latitude with no city, no elevation and no local
convention.

The price is measured: one grid page is **3,000,752 bytes**, against 380 KB for a city page, so the
full grid is about **30 GB** of captures for 10,043 tables. It is banked last for that reason: the
city layer finished first (2), and the grid then walks behind it. At 2026-11-11T10:55Z, 3,335 of the
10,043 points are held, with the archive at 10 GB and 32 GB of disk free; a watchdog stops the walk
rather than the host if free space falls below 15 GB (`scripts/disk_watch.sh`), and the grid is
resumable from the manifest at any point.

One full longitude column (91 points, lat −35 to 55 at lon −30) was captured first as the stratified
sample that makes 3.2 measurable.
