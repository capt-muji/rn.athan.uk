# O1m-51 — TURKTAKVIM WORLDWIDE: the 235-country tree, enumerated and partly banked

Wave O1m-51, round o1m. Workspace `$HOME/athan-gitree/census/o1m/o1m-51-turktakvim/`.
Capture date 2026-11-11, times UTC, no clock read into data. Repo untouched.
Run closed by owner stop order 2026-11-11 ~13:2xZ mid-harvest.

## 1. What is banked

| artifact | contents |
| --- | --- |
| `data/tt-countries.json` | the publisher's own 235-entry country selector: Turkish label -> countryID (copied from o1m-4) |
| `data/cities-world.json` | **110,834 settlements with cityIDs across 182 countries**, the whole non-African tree |
| `data/coverage.json` | per country: settlements in the tree, tables banked, dated rows banked |
| `captures/country-<slug>.html` | 182 country gazetteer pages (provinces + direct lists) |
| `captures/prov-<slug>-<filter>.html` | 3,104 province gazetteer pages |
| `captures/annual-<cityID>.html.gz` | **1,059 annual table captures** (89 MB gzipped) |
| `data/tt/<country>/<cityID>-<slug>.json` | **971 parsed tables, 352,430 dated rows, 121 countries** (30 MB) |
| `scripts/enumerate.py`, `scripts/harvest.py`, `scripts/parse.py` | the three stages, resumable |

Africa is not re-fetched: o1m-4 holds 8,565 African settlements in 50 entries, 3.13M dated
rows. The tree therefore totals **119,399 settlements** in the 232 entries that carry any,
measured as `110,834 + 8,565`.

## 2. The scale finding, which governs the rest

The tree is **not** 603 tables. It is **110,834 non-African settlements**, and the 30-country
sample in o1m-45 saw 0.5 per cent of it.

| rank | country | settlements | | rank | country | settlements |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | turkiye | 43,684 | | 11 | australia | 1,636 |
| 2 | united-states | 7,991 | | 12 | georgia | 1,535 |
| 3 | russia | 6,939 | | 13 | sweden | 1,483 |
| 4 | germany | 5,522 | | 14 | canada | 1,267 |
| 5 | italy | 3,063 | | 15 | afghanistan | 1,248 |
| 6 | china | 2,249 | | 16 | united-kingdom | 1,123 |
| 7 | india | 2,226 | | 17 | philippines | 1,052 |
| 8 | france | 2,148 | | 18 | finland | 970 |
| 9 | brazil | 1,761 | | 19 | japan | 932 |
| 10 | georgia | — | | 20 | croatia | 890 |

Turkey alone is 39 per cent of the tree. At the measured 171 KB raw page, the full harvest is
**19 GB raw / 1.7 GB gzipped**, with ~4.8 GB of parsed JSON. Disk is not the binding
constraint; request time is.

Measured throughput: 10 workers, 40 requests, 4.8 s elapsed, 8.3 req/s. Live harvest at 16
workers settled at 4.7 req/s; the run closed at 40 workers after 1,059 captures. Full-tree
harvest at 5 req/s is 6.5 hours of continuous fetching.

## 3. The banked sample

971 tables over 121 countries, 352,430 dated rows, mean 363 rows per table. Distribution:
**34 countries are completely banked** (every settlement the tree holds), including the whole
small-state layer:

bermuda 1, gibraltar 1, johnston-atoll 1, northern-mariana-islands 1, monaco 1,
palmyra-atoll 1, saint-martin 1, san-marino 1, wake-island 1, grenada 2, montserrat 2,
saint-pierre-and-miquelon 2, saint-kitts-and-nevis 2, turks-and-caicos-islands 2,
luxembourg 3, saint-helena 3, singapore 3, kuwait 4, nauru 4, lesotho 5,
saint-vincent-and-the-grenadines 5, vanuatu 5, caribbean-netherlands 6, new-caledonia 6,
bahrain 7, cyprus 7, suriname 7, tuvalu 7, el-salvador 8, guyana 8, niue 8, palau 8,
guadeloupe 9, reunion 9.

87 further countries carry a partial bank, the head pass (first ten settlements) plus whatever
the ordered remainder reached before the stop. 61 countries carry none.

88 captures hold fewer than 300 dated rows (`SHORT` on stderr in `scripts/parse.py`): the
publisher's own "computes nothing" layer, consistent with the Tokelau and Wallis entries
recorded in o1m-45. Their cityIDs are listed in `logs-harvest2.txt`.

## 4. Defect that invalidates the count as an upper bound: the filter form

Province filters arrive in two forms. The plain form is `cityStateFilter=MALDAISLAND`. The
paired form is `cityStateFilter=GOZOISLAND;GOZOADASI`, a semicolon-joined pair.

`scripts/enumerate.py` used the character class `[A-Za-z0-9%_\-]+`, which truncates at the
semicolon. The request then returns the publisher's **17,718-byte empty shell** instead of the
settlement list. Evidence: `captures/prov-malta-GOZOISLAND.html` is 17,718 bytes and carries no
`cityID` link, while the country page's own filter string is the pair.

**2,052 of the 3,104 province captures are shells under 19 KB**, so the enumeration is a
**lower bound**, not the tree size. The worst-affected entries: turkiye 289, united-kingdom 110,
greece 86, philippines 79, thailand 66, france 53, indonesia 39, romania 34, vietnam 33,
colombia 30. Thirteen entries returned zero settlements, of which cayman-islands,
christmas-island, falkland-islands and british-virgin-islands are known non-zero (o1m-45 banked
5, 1, 1 and 1) and malta, palestine, kosovo, macao, guam are almost certainly the same defect
rather than true zeros. wallis-and-funuta is a genuine zero (o1m-45 measured 28 settlements that
compute nothing; here the filter truncation hides even those).

The fix is one character class, `([^"&]+)`, as o1m-45's harvester already had. Re-enumeration
is the first move of the continuation, and the tree size will rise above 110,834.

## 5. Not settled in this run, and why

The stop order arrived mid-harvest. These were the wave's named questions and they are **open**,
not answered. No fit, no ladder distribution, no cross-check and no FALLBACK verdict was
computed, and none is claimed here.

| question | state | what remains |
| --- | --- | --- |
| per-country fit against the two known recipes | **open**, 0 fits | 971 tables are parsed and ready; the four columns dhuhr, asr, fajr and isha score against adhan 4.4.6 at a solved point |
| the isha angle-versus-margin question at country level | **open** | the Pacific and far-north entries (svalbard 7, greenland, iceland, norway 259, finland 970) are enumerated and partly banked; the northern test o1m-45 asked for is now reachable |
| the six-number ladder's structure | **open** | needs the per-country fits below; the o1m-45 prior is that the six numbers are a publisher constant, not a country rule |
| the world cross-check against other families | **open** | the pairing method is banked in o1m-45 (`scripts/pairfit.mjs`, `data/ap-points.json`); the turktakvim side is now present in 121 countries |
| FALLBACK gains from this tree | **open** | needs the 26-country list joined against `data/coverage.json`; the join is local and costs minutes |

The fit method to use, in one paragraph, so the continuation does not re-derive it. turktakvim
publishes no coordinates. Two options stand. The first is geocoding, as o1m-4 did through
Nominatim at one request per second for a sample of 24 cities. The second is a solar solve from
the table itself: `maghrib − sunrise` is the day length plus the publisher's own
`+6 − (−5) = 11` minute pair, and `(sunrise + maghrib) / 2` is solar noon plus half a minute, so
a one-dimensional search over latitude and a longitude-plus-offset search over the year's 365
rows pins the point without a geocoder. Use adhan's `SolarTime` for declination and the equation
of time so the engine stays one engine, then score fajr, dhuhr, asr and isha independently. The
o1m-45 caution stands: a point solved this way absorbs the printed margins into latitude, so
report it as derived, never as published.

## 6. NEXT

1. **Re-enumerate with `citySelector=([^"&]+)`** (semicolon pair preserved). 2,052 shell
   captures are already on disk to overwrite. Expect the tree to exceed 110,834 settlements and
   the zero entries to resolve.
2. **Resume the harvest from `data/harvest-order.json`**; the head pass for every country is
   already complete, so a 40-worker run adds depth, not breadth, and is interruptible.
3. **Fit per country on the 971 banked tables**, using the solar solve above, and settle the
   isha angle-versus-margin question on the northern and Pacific latitudes this wave reached.
4. **Report the ladder distribution** across the fitted countries, which tests o1m-45's
   publisher-constant claim on the Americas, Asia, Europe and Oceania for the first time.
5. **Join `data/coverage.json` against the FALLBACK list** and name every country that gains
   its first dated surface here. The data is local; the join does not need the network.

## Assumptions

- The African 50 are the 52 entry ids in `o1m-4-africa/tt-enum-africa.py`, so `235 − 52 = 183`
  non-African entries were enumerated; one (wallis-and-funuta) resolved to zero settlements,
  leaving 182 keys. Evidence: the enumeration output line `countries to enumerate 183` and
  `COUNTRY wallis-and-funuta 0`.
- `data/coverage.json` counts a table as banked only when the parse produced 300 or more dated
  rows, so the 88 short captures are excluded from both the table count and the row count.
  Evidence: `scripts/parse.py` threshold and its `parsed 971 tables, 352430 dated rows, short 88`.
- The 17,718-byte page is the publisher's empty shell. Evidence: five shell captures of
  identical size carrying no `cityID` link beside country pages that name the semicolon-pair
  filter.
