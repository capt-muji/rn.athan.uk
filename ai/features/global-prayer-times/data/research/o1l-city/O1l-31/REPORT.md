# O1l-31 — Nordics and Baltics, second cities (round two)

Workspace `$HOME/athan-gitree/census/o1l-city/O1l-31/`. Captures in `captures/`, normalized rows in `data/`,
fits in `fits/`. Engine adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`,
`Rounding.None` semantics, second resolution then explicit per-column rounding. Every date is built from
a literal capture string; no clock read anywhere. TZ pinned per country in the runner env:
`Europe/Oslo`, `Europe/Stockholm`, `Europe/Copenhagen`, `Europe/Helsinki`, `Europe/Vilnius`,
`Atlantic/Reykjavik`. Nothing under `/tmp`; the repository was not touched.

Rows banked this wave: **22,943** dated rows across 60 city-year files (33 Norwegian, 7 Swedish,
4 Danish, 4 Finnish, 3 Lithuanian, 9 Icelandic).

## Norway — the three lines, mapped per city

| Surface | URL | Tier | Rows | Years |
| --- | --- | --- | --- | --- |
| IRN (Islamsk Råd Norge) month API | `api.bonnetid.no/prayertimes/{pk}/{year}/{month}/` | community (national body) | 10 × 365 | 2026 |
| Mawaqeet network annual PDF | `mawaqeet.no/bonnetider/{slug}/` → `wp-content/uploads/...pdf` | community (rival line) | 6 × 365 | 2026 |
| Jamiat Ulama / islamweb.no | `islamweb.no/phpToPdf/createPDF.php?place=N` | community (third line) | 10 new × 365 (17 total) | 2026 |

**IRN, ten city-years, 3,650 rows.** Stavanger (pk 200), Haugesund (143), Ålesund (117), Sandnes (191),
Fredrikstad (133), Sarpsborg–Skjeberg (193), Bodø (124), Harstad (142), Alta (118), Oslo (181). The
location index (`captures/no-irn-locations.json`, 359 municipalities) is the publisher's own coordinate
list and is banked. IRN still serves no 2027 (all twelve months return `[]`).

**Fit — IRN 16/15, zero margin, one recipe across all ten.** On angle-honest days every city is
100 pc within 1 min: Stavanger fajr 219/236 exact, 236/236 within1; Haugesund 221/233; Ålesund 196/208;
Sandnes 218/237; Fredrikstad 222/236; Sarpsborg 212/235; Oslo 209/229; isha 15 deg 181/194, 177/192,
169/184, 184/196, 184/206, 186/206, 189/203. The free scan picks 16.0 for fajr in all ten cities.
Solar columns: sunrise 0 margin floor (205/365 exact, 365/365 within1), maghrib sunset+5, dhuhr +5 CET /
+10 CEST (the prior wave's split, confirmed on ten cities).

**Substitution regime, sized.** Where the 16 deg angle does not exist the table holds the last
computable value: Stavanger's fajr freezes at 03:47 from 2026-04-17 to 2026-05-26, then a 60-minute
floor takes over; isha sweeps below 15 deg to an implied ~6 deg at solstice (maghrib+40 at Stavanger,
+46 at Haugesund on 21 June). Window: 2026-04-17..2026-08-23 (fajr) and 2026-03-26..2026-09-12 (isha)
at Stavanger, longer at Ålesund, 123-132 days of polar-day block at Bodø, 129 at Harstad, 132 at Alta.
No tested family reproduces it: frozen-latitude-45 scores 10/145 exact at Malmö's analogue and 0/194 at
Stavanger; night-portion 1/5 scores 1/194. Recorded as an unresolved substitution rule, not adjudicated.

**Defect found — the asr column switches school at the DST boundaries.** IRN's main `asr` column equals
its own `asr_1x_shadow` while CEST and its `asr_2x_shadow` while CET, switching exactly on 2026-03-29 and
2026-10-25 (365/365 attributable at Stavanger, Oslo, Alta). It is a Shafi column in summer and a Hanafi
column in winter. Flagged for the owner; not adjudicated.

**Polar placeholders.** Bodø, Harstad and Alta print synthetic sunrise/maghrib inside the polar night
(Bodø 15 + 36 days, Harstad 37 + 58, Alta 40 + 62), the Tromsø class the prior wave documented. Those
days are excluded from every score above and counted here.

**Mawaqeet, six new city-years, 2,190 rows.** Stavanger, Haugesund, Fredrikstad, Sarpsborg, Sandnes,
Ålesund (Ålesund was already held; five are new). Fit: **18/15**, all angle-honest days within 1 min in
all six (Stavanger fajr 171/171 within1, isha 230/230; Haugesund 235/235 and 247/247; Fredrikstad
247/247 and 242/242; Sarpsborg 141/141 and 123/123). Dhuhr does not reproduce (0/365 exact, worst 6-9
min) — the network's own dhuhr convention, unresolved. Sandnes's PDF is suspect: its solar row does not
reproduce at Sandnes coordinates at all (sunrise 0/365 exact), so it is banked as captured but carries
no fit.

**Jamiat Ulama, ten new city-years, 3,650 rows.** The endpoint serves exactly **17 places** (place 1..17,
place 18+ returns an empty shell): Kristiansand, Oslo, Stavanger, Skien, Bergen, Sandnes, Drammen,
Porsgrunn, Kragerø, Arendal, Flekkefjord, Bø, Farsund, Halden, Horten, Rjukan, Haugesund. New this
wave: Porsgrunn, Kragerø, Arendal, Flekkefjord, Bø, Farsund, Halden, Horten, Rjukan, Haugesund. The
fajr is not an angle (0 days at 18 deg, 0 at 16) — it is the interval table the prior wave fitted
(sunrise − F[day], maghrib + I[day], Hanafi asr). The site's TLS certificate expired 2020-04-18; the
pages answer over plain HTTP, which is how they were captured.

**Which line each city follows.** IRN answers for all 359 municipalities, so every Norwegian city has an
IRN row. Mawaqeet publishes 89 places (Norway plus Göteborg and København) and covers the southern belt
and the west coast but **not** Bodø, Harstad, Alta, Tromsø or Narvik (404 on every slug tried, including
the ø spellings). Jamiat publishes 17 places, all southern. The three-line schism is therefore a
southern phenomenon: the northern cities carry IRN and nothing else. Haugesund now carries all three.

## Sweden — the IF national table at seven second cities

| Surface | URL | Tier | Rows | Years |
| --- | --- | --- | --- | --- |
| IF (Islamiska Förbundet) national table | `islamiskaforbundet.se/wp-content/plugins/bonetider/Bonetider_Widget.php` (POST, JS challenge 454 on plain curl) | community (national body) | 7 × 365 | 2026 |

City list read from the site's own picker: 112 entries. Captured Malmö, Linköping, Örebro, Västerås,
Umeå, Luleå, Kiruna (Uppsala, Stockholm, Göteborg already held).

**Fit — 18/16, and it is exact on angle-honest days.** Malmö fajr 154/220 exact, 220/220 within1;
Linköping 144/203, 203/203; Örebro 142/202, 202/202; Västerås 133/200, 200/200; Umeå 115/176, 176/176;
Luleå 116/167, 167/167. Isha 16 deg likewise 100 pc within1 on the honest days. This is the country-wide
series the record lacked.

**Solar temkin, measured.** Sunrise = adhan − 6.5, dhuhr = transit + 5.5, maghrib = sunset + 6, asr =
adhan Shafi + 2.5..8 (all 365 days within 1-2 min of that offset except at the DST edges). The IF table
is not a bare adhan render: it carries a symmetric ±6-minute day expansion and a +5 dhuhr.

**Substitution window.** Apr–Sep: Malmö 2026-04-12..09-03 (145 d), Linköping 04-04..09-12 (162),
Örebro 04-03..09-12 (163), Västerås 04-02..09-13 (165), Umeå 03-23..09-24 (186), Luleå 03-17..09-30
(198). Frozen-latitude-45 is refuted (10/145 exact at Malmö); night-portion 1/5 is the closest family
(63/145 exact, 98/145 within1) but not the rule.

**Defect — Kiruna is Umeå's row.** Kiruna's table prints Umeå's sunrise to the minute all year (09:17 on
1 January at 67.86 N, where the true sunrise is near 10:45) and differs from Umeå only by a 1-2 minute
asr/fajr shift consistent with a longitude-only difference (Kiruna 20.2253 E, Umeå 20.2630 E). At
Kiruna's own coordinates the table's sunrise is off by up to 140 minutes and only 15 days are
angle-honest. Banked as captured, excluded from the fit. The same class as the Bulgaria longitude-shift
lesson.

## Denmark — four second cities, a fourth line

| Surface | URL | Tier | Rows | Years |
| --- | --- | --- | --- | --- |
| adan.dk per-city month list (dated day pages render the whole month) | `adan.dk/boentider/{city}/{YYYY-MM-DD}/` | community (aggregator) | 4 × 365 | 2026 |

Aarhus, Odense, Aalborg, Esbjerg.

**Fit — 18/17, exact on angle-honest days.** Aarhus fajr 133/242 exact, 242/242 within1; Odense
120/247, 247/247; Aalborg 134/237, 237/237; Esbjerg 114/247, 247/247. Isha 17 deg 100 pc within1 on
the honest days. Solar columns within 1 min all year (sunrise, dhuhr, maghrib). Substitution window
2026-04-19..08-24 at Aalborg, 04-22..08-22 at Aarhus, 04-25..08-19 at Odense and Esbjerg.

This is a **fourth Danish position** beside Copenhagen's 18/16 (Khair al Bariya), 18/15 (Mawaqeet) and
15/15 (salah.dk). The record's three-way Copenhagen split stands; the country now has four lines and the
second cities sit on 18/17. adan.dk's own imsak is fajr − 10.

## Finland — the mosque layer is not the portal's recipe

| Surface | URL | Tier | Rows | Years |
| --- | --- | --- | --- | --- |
| Tampereen Islamin Yhdyskunta monthly PDFs | `islamtampere.com/wp-content/uploads/2026/01/{n}.-{Month}-2026.pdf` | community (mosque) | 334 (Jan is a scan) | 2026 |
| Turun Islamilainen Yhdyskunta year PDF | `tisy.fi/wp-content/uploads/wplhc/1/lunar-hijri-calendar.pdf` | community (mosque) | 365 | 2026 |
| Jyväskylän moskeija monthly PDFs | `jyvaskylamosque.fi/wp-content/uploads/2026/02/{Mon}2026.pdf` | community (mosque) | 353 (Feb 2026–Jan 2027) | 2026-2027 |
| Oulun Al-Nur (nurmoskeija.fi) month tables | `nurmoskeija.fi/prayer-timetable/?mps_year=2026&mps_month=N` | community (mosque) | 365 | 2026 |

**Jyväskylä fits 18/17 exactly**: fajr 114/201 exact, 201/201 within1; isha 127/201, 201/201; all solar
columns within 1 min; substitution window 2026-04-05..09-07. The January 2027 month is inside the same
series, so the recipe holds across the year boundary.

**Turku and Tampere are a different, softer line.** Neither reproduces at 18/17 on any day. The best
zero-margin angles are fajr ≈ 14.75-15 deg (Turku 147 days within1, Tampere 121) and isha ≈ 12 deg
(Turku 239 days). Their solar columns are adhan within 1-3 min in winter, with a ±2-3 minute temkin.
The Finnish mosque layer therefore sits on a ~15/12 family, not on the 18/17 the record attributes to
the rukousajat.fi portal. Reported as measured, not adjudicated.

**Oulu publishes Turku's table.** nurmoskeija.fi's 365 rows equal the Turku PDF's 365 rows cell for cell
on 313 days and differ on the other 52 only where Oulu freezes dhuhr at 12:30 (Turku's moves). Fitted at
Turku's coordinates the table reproduces Turku exactly; at Oulu's own coordinates (65.01 N) its sunrise
is off by up to 100 minutes. The page states the method plainly — "Islamic Council of Norway, Fajr 16,
Isha 15, one-third of the night from late April to early September" — so the **stated** provenance is
the IRN line even though the printed row is mislocated. The stated method is banked; the row is not.

## Baltics

**Lithuania — the muftiate now serves three cities and two years, 2,190 rows.** `muftiate.lt/maldu-laikai/`
embeds a 347 KB JSON (`script.mpt-json`) with a `days` map per city: Vilnius, Kaunas, **Klaipėda** (new),
2026-01-01 to 2027-12-31. The page names the source as Diyanet data; the Hijri labels are Turkish.

Fit — **Diyanet 18/16**, exact on angle-honest days in all three cities and in both years: Vilnius fajr
215/449 exact, 449/449 within1; Kaunas 237/445, 445/445; Klaipėda 197/437, 437/437; isha 16 deg 100 pc
within1. Substitution windows 2026-04-11..09-04 and 2027-04-12..09-04 at Klaipėda (146-147 d each year).
Solar columns carry a domestic temkin of up to 7-10 minutes (sunrise, dhuhr, maghrib, asr), which is the
Diyanet pattern and is recorded, not adjudicated. Two distinct fitted years on one recipe — grade A by
the frozen vocabulary, authority tier (muftiate).

**Šiauliai**: not in the muftiate's city set (three cities only). Negative under these terms.

**Latvia — no new city.** `likc.lv/prayer-times/` still embeds exactly three IslamicFinder widgets:
Riga (456172), Daugavpils (454310), Ventspils (44282926), each at 15/15 and 12/12. No Liepāja, no
Jelgava, no dated table. Searched in Latvian (`lūgšanu laiki Liepāja`, `Islāma kultūras centrs`) and
English; the only hits were the centre's own three cities and unrelated pages.

**Estonia — no new city.** `eestiislamikeskus.org/app.js` defines exactly two cities in its `CITIES`
object (Tallinn 59.4370/24.7536, Tartu 58.3780/26.7290) with the 15/15 method and 1/3 night. Narva and
Pärnu have no EIC surface; searched in Estonian (`palvused Narva Pärnu islamikeskus`).

## Iceland — the two-city claim is refuted

The site's own picker (`felagmuslima.is`, `#city`) offers **nine** cities: Reykjavík, Keflavík, Akureyri,
Akranes, Borgarnes, Hofsós, Húsavík, Hvolsvöllur, Hella. The API answers for all nine; Ísafjörður,
Selfoss, Egilsstaðir, Vestmannaeyjar, Sauðárkrókur, Hólmavík, Neskaupstaður, Ólafsvík, Stykkishólmur,
Blönduós, Siglufjörður, Eskifjörður, Höfn, Vík, Kirkjubæjarklaustur, Patreksfjörður, Bolungarvík,
Súðavík, Kópavogur and Hafnarfjörður all return `{"error":"Unknown city"}` (HTTP 400, probed
2026-11-11). The prior wave's "Iceland is a two-city surface" was true of the two names it probed.

2026 captured for all nine cities (3,276 rows; `data/is-felag-{city}-2026.json`) from 3,285 raw day files
in `captures/is-year/` (nine short by transport retries: Keflavík 363, Akranes 364, Borgarnes 364,
Hella 360).

**Fit — 14.2 / 14.0, exact on angle-honest days, in all nine cities.** Reykjavík fajr 111/207 exact,
207/207 within1; Keflavík 112/207, 207/207; Akureyri 73/199, 199/199; Akranes 107/206, 206/206;
Borgarnes 99/204, 204/204; Hofsós 78/197, 197/197; Húsavík 111/197, 197/197; Hvolsvöllur 111/209,
209/209. Isha 14.0 deg likewise 100 pc within1. Substitution window 2026-03-30..09-13 at the northern
pair, 2026-04-04..09-08 in the south.

The **asr quirk is reproduced at nine cities**: asr − dhuhr ranges from −1 to +42 minutes with no madhab
shape, worst 14 min at Reykjavík and 42 at Húsavík. It is the generator's own sweep, as the record
concluded from two cities; nine cities and 3,276 rows do not change it.

Hofsós and Húsavík print fajr = sunrise = dhuhr = maghrib = isha on the polar-day rows (01:11 on 21 June),
a clamp rather than a solar event; those days are excluded from the score and counted here.

## Honest negatives

- Norway 2027: IRN returns `[]` for all twelve months (probed 2026-11-11).
- Norway north: mawaqeet has no place for Bodø, Harstad, Alta, Tromsø, Narvik (404 on every slug).
- Sweden: IF has no year archive; the endpoint serves 2026 only, and Wayback holds no monthly snapshot.
- Denmark: no Danish publisher prints an annual table; adan.dk's dated day pages are the only route,
  and its month selector is not URL-addressable, so the month list view was used.
- Finland: Tampere's January PDF is an image with no text layer (`tesseract` and `pdftoppm` are absent
  on this host), so 31 days are missing; Oulu's own row is mislocated as recorded above.
- Baltics: no Liepāja, Jelgava, Šiauliai, Narva or Pärnu surface found under these terms.
- Iceland: twenty town names probed and refused by the API; nine served.

## What confirms, what is new

Confirms: IRN 16/15 at zero margin (now ten cities); mawaqeet 18/15 (now nine cities); the Norwegian
three-line schism and its southern geography; Sweden's IF 18/16 (now ten cities); Denmark's multi-line
split (now four lines); Diyanet's 18/16 in Lithuania (now three cities, two years).

New: Norway's asr school-switch at the DST boundary; IRN's substitution shape (frozen last value then a
60-minute floor); Jamiat's exact 17-place footprint; Sweden's temkin set (sunrise −6.5, dhuhr +5.5,
maghrib +6); Kiruna's mislocation; Denmark's 18/17 second-city line; the Finnish mosque layer's ~15/12
family; Oulu's Turku-relabelled table and its IRN method statement; Lithuania's Klaipėda and its 2027
year; Iceland's nine-city surface and the 14.2/14.0 fit at nine cities.

## Files

- `captures/` — 401 raw files (HTML, JSON, PDF, JS bundles), one per surface, named by source.
- `data/` — 60 normalized year files, `{YYYY-MM-DD: {fajr, sunrise, dhuhr, asr, maghrib, isha}}`.
- `fits/` — `no-irn-fit.json` (10 cities), `se-ifis-fit.json` (7), `classify-fit.json` and the
  per-country `classify-*.json` inputs, `multi-fit.json`.
- Runners: `fit-no.mjs`, `fit-se.mjs`, `fit-multi.mjs`, `fit-classify.mjs`; parsers
  `parse-mawaqeet.py`, `parse-jamiat.py`, `parse-ifis.py`, `parse-adan.py`, `parse-tampere.py`,
  `parse-turku.py`, `parse-jyvaskyla.py`, `parse-oulu.py`; fetchers `fetch-iceland-2026.zsh`.
