# O1m-8 — Arctic and Nordic depth: Greenland, Svalbard, Faroe, Iceland, Norway, Sweden, Finland, the Russian Arctic

Workspace `$HOME/athan-gitree/census/o1m/o1m-8-arctic/`. Captures in `captures/`, dated rows in
`data/`, one analysis record per city in `fit/`. Engine adhan 4.4.6 at
`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`, second resolution, `Rounding.None`
semantics. Every wall clock is converted through `Intl` in the city's own IANA zone, so neither the
host clock nor the host zone enters any number below. Every date is built from a literal capture
string. Nothing under /tmp. The repository was not touched.

Script-counted at the time of writing: **86 dated data files, 33,708 dated rows, 693 raw captures
(51 MB), 87 analysis records** (`python3` walk over `data/`, `captures/`, `fit/`).

## 1. Surfaces banked

| Surface | Tier | Cities | Rows | Span |
| --- | --- | --- | --- | --- |
| tawkit.net arctic subset | platform | 67 (Russia 54, Norway 9, Sweden 4) | 24,167 | 2026-11-01 .. 2027-10-31 |
| islam.nu | community | 13 Swedish towns | 9,331 | 2026-01-01 .. 2027-11-30 (25 months for Lulea, Ostersund, Umea, Sundsvall) |
| namazvakti.diyanet.gov.tr | publisher | Nuuk, Longyearbyen, Reykjavik | 90 | 2026-11-12 .. 2026-12-11 |
| athanpro.com | platform | Torshavn | 30 | 2026-09 |
| grandmosque-iceland.is | community | Reykjavik | 60 | 2026-01, 2026-06 (hand transcription of the mosque's posters) |
| felagmuslima.is | community | Reykjavik | 30 | 2027-11 (year selector set to 2027 in the association's own monthly page) |

**The five mission cities of the Russian Arctic are banked from one platform at full year:**
Murmansk 365, Arkhangelsk 365, Norilsk 365, Yakutsk 365, Magadan 365, beside 49 further Russian
cities from the polar circle down (Vorkuta, Salekhard, Labytnangi, Novy Urenyoy, Dudinka, Talnakh,
Apatity, Kandalaksha, Monchegorsk, Severomorsk, Severodvinsk, Naryan-Mar absent from the platform).

**Sweden is covered beyond the four named towns.** islam.nu carries 67 Swedish towns; thirteen
northern ones are banked with 699-760 dated rows each: Lulea, Ostersund, Umea, Sundsvall (25 months
each), Pitea, Skelleftea, Boden, Arvidsjaur, Harnosand, Hudiksvall, Falun, Gavle, Borlange (23
months each). Lulea, Ostersund and Umea are new surfaces in the record.

**Iceland gains a second Reykjavik line and its forward year.** The Grand Mosque of Iceland publishes
monthly `Bænatímar` posters; eleven were captured as images and two months were transcribed by eye
(the tables are JPEGs, no HTML table and no PDF). January 2026 and June 2026 are in
`data/iceland-gmi-reykjavik.json`. Beside it, Felag Muslima's own monthly page **serves 2027**: its
year selector offers 2025, 2026 and 2027, and November 2027 was read from the rendered table
(`data/felag-reykjavik-2027-11.json`, 30 rows, solar gate 0.31). The association states its isha
convention in words on that page and the rows bear it out: **isha is azan at maghrib + 90 minutes**,
iqamah ten minutes later.

**Selfoss and Isafjordur are explained, not refused.** The association's own town selector lists
exactly nine places (Reykjavik, Keflavik, Akureyri, Akranes, Borgarnes, Hofsos, Husavik,
Hvolsvollur, Hella) on both its daily and its monthly page. Neither refused town is in the list, so
the O1l "API refuses" record is a town the publisher does not serve, not a broken endpoint.

**Faroe leaves the negative list.** athanpro serves Torshavn with a full dated month; the solar
gate is **0.17 min median**, so the values are the town's own, and the recipe is **fajr 18.0 / isha
17.0, Shafi asr (+1.63), sunrise, dhuhr and maghrib at zero margin**. Platform tier, one month,
candidate. The page labels its clock `+00:00` while the Faroes run UTC+1 in September: a label
defect, not a value defect, confirmed by the gate.

## 2. The high-latitude rules, per publisher, with trigger days

This is the load-bearing result of the wave. The record now holds five distinct publishers' answers
to a day whose twilight never arrives, each measured on its own dated rows.

| Publisher | Country | Recipe | Days the angle fails | What it prints instead | Measured fraction of the night |
| --- | --- | --- | --- | --- | --- |
| tawkit.net | Russia | fajr 16.0, isha 15.0 | Murmansk 2027-04-03..2027-09-10 (161); isha 2027-04-06..2027-09-07 (155) | fajr and isha both at the middle of the night | **0.498 fajr / 0.491 isha** (p10-p90 0.49-0.51) |
| tawkit.net | Norway | fajr 18.0, isha 17.0 | Tromso 2027-03-29..2027-05-17 and 2027-07-26..2027-09-13 (50 + 50) | same midpoint rule, and the deep polar days are **omitted from the table entirely** | **0.499** |
| tawkit.net | Sweden | fajr 18.0, isha 17.0 | Umea 2027-04-13..2027-08-28 (138) | midpoint rule, no omission | **0.500** |
| islam.nu | Sweden | fajr 18.0, isha 17.0, Shafi asr, zero solar margin | Lulea 2026-04-07..2026-09-06 for fajr (153), 2026-04-09..2026-09-03 for isha (148); the same window shifts one day in 2027 | **one third of the night each side, one third left** | **0.300 fajr / 0.283 isha** |
| Diyanet | Svalbard | not measurable (30-day window) | Longyearbyen 2026-11-12..2026-12-11, the whole window | a **synthetic solar row**: sunrise frozen at 09:17, maghrib frozen at 14:17, asr set equal to dhuhr | n/a |
| Grand Mosque of Iceland | Iceland | fajr near 18 (mid-January), isha = maghrib + 90 fixed | Reykjavik 2026-06-15..2026-06-28 (14, midnight sun) | both at roughly a quarter of the night | **0.236** |

Four consequences for the round:

1. **The half-night plateau is the dominant Nordic platform rule** and it is exact, not approximate:
   0.498-0.500 with a 0.49-0.51 decile band across 54 Russian cities and nine Norwegian ones. A table
   that prints fajr equal to isha is that rule, not a defect.
2. **The one-third split is a second, distinct rule in the same country.** islam.nu (18/17, Shafi,
   zero temkin) and tawkit Sweden (18/17, small temkin) disagree on every summer day while agreeing
   on every winter day. A fit that pools Swedish publishers across the summer window will fail for
   that reason alone.
3. **Omission is a rule too.** tawkit's Norway layer publishes 247 rows for Tromso where Russia gets
   365: 118 days are simply absent. Any coverage count that treats a missing row as a parse failure
   will overstate the fit's residuals.
4. **A synthetic solar row is a third class.** Diyanet does not omit and does not take a fraction at
   Svalbard: it prints a sunrise that never happened and an asr that equals dhuhr.

**Winter-side rule, Russian Arctic.** The noon collapse (sunrise = dhuhr = maghrib) is dated per city
and reproduced to the day at nine cities: Murmansk 2026-12-02..2027-01-10 (40 days), Norilsk
2026-11-30..2027-01-13 (45), Talnakh 2026-11-29..2027-01-13 (46), Dudinka 2026-11-29..2027-01-13
(46), Severomorsk 2026-12-01..2027-01-11 (42), Monchegorsk 2026-12-11..2027-01-02 (23), Apatity
2026-12-16..2026-12-28 (13), Kirovsk 2026-12-15..2026-12-29 (15), Vorkuta 2026-12-17..2026-12-27
(11). Every one of those windows matches the astronomical polar night at that latitude, so the
publisher's collapse is the honest one: at solar noon the sun is the only event there is.

## 3. Fits

One recipe per publisher, measured on the rows held. Implied angles are solved per day
(10.0-22.0 deg, 0.05 grid) and reported as the median; solar margins are the median of
(printed - computed) in minutes on days whose published solar row reproduces within 3 minutes.

| City | Rows | Solar gate (min) | fajr | isha | dhuhr | maghrib | asr |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Murmansk | 365 | 1.11 | 15.95 | 14.95 | +0.58 | -0.98 | Shafi -1.27 |
| Norilsk | 365 | 1.11 | 15.95 | 15.00 | +0.52 | +0.15 | Shafi -0.43 |
| Talnakh | 365 | 1.13 | 16.00 | 15.00 | +0.48 | -0.02 | Shafi |
| Yakutsk | 365 | 0.59 | 15.95 | 15.05 | +0.43 | +0.55 | Shafi |
| Magadan | 365 | 0.57 | 15.95 | 15.05 | +0.50 | +0.48 | Shafi |
| Arkhangelsk | 365 | 0.72 | 15.95 | 15.05 | +0.57 | +0.35 | Shafi |
| Salekhard | 365 | 0.94 | 15.95 | 15.00 | +0.53 | +0.33 | Shafi |
| Vorkuta | 365 | 0.94 | 15.95 | 15.05 | +0.55 | +0.22 | Shafi |
| Tromso | 247 | 0.49 | 17.95 | 16.95 | -0.12 | -1.67 | Shafi |
| Bodo | 322 | 0.46 | 18.00 | 17.00 | -0.13 | -1.10 | Shafi |
| Harstad | 265 | 0.47 | 17.95 | 16.95 | -0.03 | -1.50 | Shafi |
| Lulea | 760 | 0.36 | 18.00 | 17.00 | +0.03 | 0.00 | Shafi |
| Ostersund | 760 | 0.23 | 18.00 | 17.00 | 0.00 | +0.02 | Shafi |
| Umea | 760 | 0.28 | 18.00 | 17.00 | 0.00 | -0.02 | Shafi |
| Sundsvall | 760 | 0.23 | 18.00 | 17.05 | -0.03 | +0.08 | Shafi |
| Torshavn | 30 | 0.17 | 17.95 | 17.05 | -0.13 | +0.05 | Shafi +1.63 |
| Reykjavik (Grand Mosque) | 60 | 0.22 | 18.05 (median, drifting) | not an angle: maghrib + 90 | +0.50 | -0.03 | Shafi -0.55 |
| Reykjavik (Diyanet) | 30 | 0.23 | not solved (window in the angle) | not solved | - | - | - |

**The Russian Arctic is one recipe across 54 cities in eleven time zones**: fajr 15.90-16.00, isha
14.95-15.10, dhuhr +0.43..+0.58, maghrib -0.98..+0.55, Shafi asr, solar gate 0.47-1.13 minutes. The
spread across the whole arctic layer is smaller than the rounding floor of a single table. That is a
genuine single-recipe finding, not a pooling artefact: each city was solved independently.

**The Russian isha carries a seasonal residual.** At Murmansk, isha at 15.0 deg runs +2.2 min in
November, -1.1 in February, -2.2 in March, +5.0 in September: a 7-minute peak-to-peak seasonal term
on a stable angle. Fajr at 16.0 deg is flat (+0.3 median, sd 1.45). The record already carries a
latitude-dependent isha seasonal correction for tawkit's other countries; the Arctic shows the same
engine behaviour at the top of the range.

**Norway publishes maghrib 1.1-1.7 minutes before its own sunset** and dhuhr 0.03-0.13 minutes
before its own transit, where Sweden publishes both at zero. One minute of temkin separates the two
national layers of the same platform.

## 4. Per-city record

Every city carries a machine record in `fit/<slug>.json` with: rows, honest days, solar gate,
implied angles (median/min/max, June and December medians), per-column solar margins, the dated runs
of noon collapse, of fajr = isha, and of the astronomical polar night, the implied night fraction
with deciles, and the Jan-to-Jul amplitude. `fit/summary.json` holds all 86 in one array.

## 5. Negatives, with the languages searched and the cause

- **turktakvim.com carries the whole Arctic in its gazetteer and serves none of it.** Enumerated
  through the Turkish country pages: Greenland 22 settlements (Nuuk, Sisimiut, Ilulissat, Qaqortoq,
  Qaanaaq, Upernavik, Ittoqqortoormiit and more), Svalbard 7 (Longyearbyen, Barentsburg, Pyramiden,
  Ny-Alesund, Sveagruva, Grumantbyen, Smeerenburg), Iceland 301, Denmark 233 (including five Faroese
  settlements), Norway 691, Sweden 1,483, Finland 970. Every annual and every monthly route for every
  city above roughly 60 deg N returns a page truncated after the first table row: Bergen (60.39 N)
  fails, Stavanger (58.97 N) renders 3,285 cells. Cause: the publisher's annual generator aborts for
  a location where the 18-degree twilight does not exist in midsummer. Turkish.
- **IRN (Islamsk Rad Norge) closed its public read on 2026-11-11.** `api.bonnetid.no/prayertimes/`
  returns `403 {"detail":"Authentication credentials were not provided."}` on all four path variants
  tried; the site's client bundle carries only a user Bearer token, no public key. The 359-municipality
  index with its coordinates (Hammerfest 141, Sor-Varanger 151, Vadso 212, Nordkapp 247, Karasjok 250,
  Kautokeino 251, Batsfjord 234, Tromso 208 and the rest of Finnmark) is held from O1l-31, so the
  layer is enumerable and only the read is blocked. Norwegian.
- **Jamiat Ulama / islamweb.no serves 2026 and no other year.** HTTPS is still unreachable (certificate
  expired, as O1l-52 recorded); over HTTP `phpToPdf/createPDF.php?place=1` returns a 23,489-byte PDF
  titled "Bonnetider for Kristiansand 2026" for `year=2028`, `ar=2028`, `yil=2028` and `aar=2028`
  alike, byte-identical every time. **2028 is not served.** Norwegian.
- **mawaqeet.no has no slug the record missed.** The index holds exactly 89 slugs and all 89 are held
  (88 PDFs banked by O1m-R5, Mysen's URL dead). The network carries no Finnmark town, so the polar
  second source has to come from IRN, which is now closed.
- **rukousajat.fi and rukousaika.fi are coordinate calculators**, not publishers: a city search box,
  latitude and longitude fields and a manual-location save. No dated table of their own. Finnish.
- **Finnmark's towns are left without a surface this pass.** Hammerfest, Kirkenes, Vardo, Alta and
  Nordkapp are absent from tawkit's Norway gazetteer (Tromso is its only town above 69 N) and from
  mawaqeet's 89 slugs; the IRN index carries all of them and its read is now closed (above). Alta's
  held row comes from the O1l-31 IRN fetch. Norwegian.
- **Oulu's own society is identified but its table is not yet extracted.** Pohjois-Suomen
  Islamilainen Yhdyskunta (PSIY, the Oulu mosque) carries a masjidbox prayer page and posts monthly
  "Oulu prayer timetable" PDFs on its public Facebook page. The dated extraction is NEXT. Finnish,
  English.
- **Rovaniemi still has no publisher table.** The community's public page carries a September 2018
  city table as an image; no current cycle. Finnish, English, Swedish.
- **Greenland beyond Nuuk has no authority surface.** Diyanet holds Nuuk alone; tawkit, turktakvim
  and mawaqeet hold nothing; athanpro holds all five towns but on a defective clock (section 6).
  English and Danish/Norwegian searched; the mosques are university and worker communities with no
  timetable page.

## 6. Defects

1. **Diyanet's city layer is not selectable and its dated table is the country's default.** Driven in
   a real browser: selecting RUSYA then MURMANSK, then NORVEC then TROMSO, then ISVEC then KIRUNA,
   then FINLANDIYA then OULU returns the identical 150-day table every time (dhuhr 12:07 on
   2026-11-12), while the one-day panel does change to the selected city. The scripted postback
   returns the same payload. Only countries with a single city give a genuine dated table: Greenland
   (Nuuk), Svalbard (Longyearbyen), Iceland (Reykjavik). Twenty-one 150-day city files were withdrawn
   for that reason; three remain.
2. **Diyanet's Nuuk row is not Nuuk's.** Its solar gate against Nuuk's own coordinates is **59.58
   minutes median**, and its day length for 2026-11-12 is 7 h 06 m against the town's 6 h 16 m. The
   row is computed near 61 N on a UTC-3 clock: both the latitude and the zone are wrong. Greenland's
   only publisher surface is therefore defective and is banked as captured, not as a fit.
3. **Diyanet's Longyearbyen row is synthetic through the polar night.** Sunrise held at 09:17 and
   maghrib at 14:17 for all 30 days of a window in which the sun does not rise, with asr set equal to
   dhuhr. A fixture of the publisher's rule, not a measurement of the sky.
4. **tawkit's Norway layer omits the deep polar days silently.** Tromso 247 rows, Harstad 265, Bodo
   322, Mo i Rana 339 against 365 for every southern city. Russia's layer, same platform, keeps all
   365 by substituting.
5. **tawkit's Avesta row runs one hour late through the summer.** 154 of 364 days reproduce exactly
   (all of them in the standard-time months); the other 210 sit exactly +60 minutes, sunrise 04:29
   against a computed 03:29 on 2027-06-21 and maghrib 23:25 against 22:24. A DST block of roughly
   nine months, not a coordinate error; the solar gate of **59.1 minutes median** is that block.
   Banked as captured, flagged, not fitted.
6. **athanpro's Greenland tables run on a wrong clock and a wrong longitude.** All five towns are
   labelled `-04:00 GMT` where the territory runs UTC-2, and Nuuk's printed dhuhr 14:17 sits 48
   minutes past solar noon under every candidate offset. Not banked as rows.
7. **athanpro's Faroe page is a frozen September** in a November capture, with a `+00:00` label on
   values that are correctly UTC+1. The values are right and the metadata is wrong; banked with the
   defect stated.
8. **Iceland's isha changed between the held year and the forward year.** The held 2026 file for
   Reykjavik carries isha at maghrib + 122 to + 128 minutes in January; the association's own 2027
   page and its own written statement give exactly maghrib + 90. Either the rule moved or the two
   files come from different builders; the record's "14.0 exact" isha claim on the 2026 file cannot
   hold against a published interval, and the fit index must not pool the two years.

## 7. What this changes in the record

- **Greenland is on the board at one surface** (Diyanet Nuuk, 30 rows, defective) where the record
  held nothing.
- **Svalbard is on the board at one surface** (Diyanet Longyearbyen, 30 rows, synthetic through the
  polar night) where the record held nothing.
- **Faroe moves from negative to platform candidate** (athanpro Torshavn, 30 rows, 18/17 Shafi,
  gate 0.17).
- **Iceland gains a second Reykjavik line** with a different winter isha convention (maghrib + 90).
- **Sweden gains three towns** beyond the held set (Lulea, Ostersund, Umea) and a second national
  line whose summer rule is the one-third split.
- **Norway and Russia gain the polar layer at city depth**: nine Norwegian and 54 Russian cities,
  24,167 rows, one recipe each.
- **The rule taxonomy is now five-fold**: half-night plateau (tawkit RU/NO/SE), one-third split
  (islam.nu), omission (tawkit NO deep polar), synthetic solar row (Diyanet Svalbard), quarter-night
  (Grand Mosque of Iceland). Any future fit at these latitudes must name which of the five it is
  testing.

## 8. NEXT

1. **Oulu**: extract PSIY's masjidbox athany payload and its monthly PDF posters; that is the one
   Finnish town where a real community table is now known to exist.
2. **IRN Finnmark**: re-probe `api.bonnetid.no` each round; if the read reopens, 38 northern
   municipalities are one fetch each from the held index.
3. **Greenland**: athanpro's per-city month route (JS-only on the page) and any Danish-language
   Nuuk community page; the Diyanet row's 61 N/UTC-3 error is worth reporting to no one and worth
   recording against every Greenland fit.
4. **Iceland**: transcribe the remaining nine Grand Mosque posters (July-September 2025, February,
   April, May 2026) and locate the current cycle; the mosque appears to have stopped publishing
   after June 2026.
5. **Faroe**: a second month from athanpro and any Faroese-language community page.
6. **Sweden**: extend islam.nu to all 67 towns (only 13 banked) and read its PDF export for the
   month; the site's own `?download=pdf` route is the cheapest full-year route.
7. **Polar rule spread**: run `scripts/summer_rule.mjs` against the held Felag Muslima Icelandic
   nine and the held IRN Norwegian ten to place them in the five-class taxonomy.
