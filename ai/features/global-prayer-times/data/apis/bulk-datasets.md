# Bulk, offline, downloadable prayer-time data

Research date: 2026-09-30. All byte figures marked MEASURED were produced by
running `curl` or the GitHub API in this session and are reproducible from the
commands quoted. Figures marked CITED carry the URL they came from. Figures
marked UNVERIFIED are estimates or claims not independently confirmed.

The question behind this document is not "which API is best". An API is a live
dependency: it needs network, a key, a rate limit budget and a vendor that stays
alive. A dataset is none of those things. A dataset that fits in the binary
converts a runtime dependency into a build-time one. Everything below is
evaluated on that basis.

## 1. Findings

1. **A full year of official prayer times for one location costs about 5 KB
   gzipped.** Measured: the JAKIM year JSON for zone `SGR01` is 77,257 bytes raw
   and 4,877 bytes gzipped, a ratio of 15.8x. Prayer times compress extremely
   well because consecutive days differ by one or two minutes. Raw byte sizes
   quoted by repositories are therefore close to meaningless for shipping
   decisions, and every size in this document is given both ways where it
   matters.

2. **The single largest dataset found is `fortextexe/namaz-data`: 18,644
   districts across 211 country codes, scraped from Diyanet, covering 2026 and
   2027.** Measured: 37,290 JSON files totalling 2,364,430,269 bytes
   uncompressed, which git packs to 149,406 KB. This is the only community
   artefact found with genuinely global authority-sourced coverage. It was
   created 2026-09-29, one day before this research, has no licence file, and its
   README states it is internal data for a private API. Treat it as a proof that
   the scrape is possible, not as a dependency.

3. **Diyanet is the highest-value single upstream in the world for this
   problem.** Its own dropdown lists 209 countries (MEASURED by parsing the
   homepage `select` elements), and one request to a district page returns 403
   days of times, to the end of 2027, in a 380 KB HTML response. No key, no rate
   limit published, no registration. One authority covers more of the planet
   than every other national source combined.

4. **Singapore is the only country found where a national religious authority
   publishes its official timetable as a clean, licensed, machine-readable bulk
   file on a national open-data portal.** MUIS publishes four datasets on
   `data.gov.sg` under the Singapore Open Data Licence 1.0. The consolidated
   2024 to 2026 file is 57,771 bytes MEASURED, 8,031 bytes gzipped, 1,096 data
   rows. This is the gold standard and it is, as far as this research found,
   unique.

5. **JAKIM exposes a full-year official export per zone through an undocumented
   but public endpoint.** MEASURED: `period=year` returns HTTP 200 and 77,257
   bytes for every one of the six zones sampled. Sixty zones times 77,257 bytes
   is 4,635,420 bytes for the whole country for a year, which gzips to roughly
   293 KB. Malaysia is fully solved for under 300 KB.

6. **The Maldives dataset demonstrates the compression pattern that makes global
   offline coverage tractable: latitude banding plus a perpetual year.** It
   stores 202 islands as 42 latitude bands times 366 days, with a per-island
   minute offset, in a dummy leap year `0004` matched on month and day. That is
   15,372 rows instead of 202 times 366 equals 73,932, a 4.8x reduction, and it
   never expires. MEASURED: 1,299,231 bytes of SQL, 85,595 gzipped.

7. **Qatar Calendar House's perpetual timetable has already been digitised from
   the authority's PDF into a 14,219 byte CSV under MIT.** MEASURED: 365 rows,
   2,973 bytes gzipped; the encoded `.dat` variant is 10,843 bytes, 2,879
   gzipped. This is the clearest existing proof that PDF-to-dataset digitisation
   of a national timetable is a weekend of work, not a project.

8. **`my-prayers/muslim-data` is the most directly reusable artefact: a shipping
   SQLite file under Apache 2.0, already consumed by iOS, Android and Flutter
   libraries.** MEASURED: `muslim_db_v2.5.1.db` is 28,770,304 bytes. Critically,
   the prayer data is a small minority of that: `prayer_time` plus its index is
   3,433,472 bytes MEASURED via `dbstat`, while the `location` table and its
   three indexes account for about 17.7 MB. The prayer timetables can be lifted
   out and the geocoder left behind.

9. **`muslim-data`'s prayer coverage is narrow but its schema is the right one.**
   MEASURED by SQL: 45,749 rows over 366 distinct dates from `01-01` to `12-31`,
   so it is perpetual, not year-stamped. 252 locations carry
   `has_fixed_prayer_time=1` and 127 more point at another location through
   `prayer_dependent_id`, which is the same one-timetable-serves-many-places idea
   as latitude banding. Countries covered: Iraq 97 locations, Iran 7, Syria 6,
   Kuwait 6, Germany 4, UK 2, UAE 2, France 1.

10. **National open-data portals are, with the Singapore exception, a dead end.**
    MEASURED zero results: `data.gov.uk` CKAN returns `count=0` for `prayer`;
    HDX returns `count=0` for `prayer`; `data.gov.my` returns "No entries found"
    for `solat`. Zenodo returns 0 hits for `mawaqit` and nothing relevant in
    184,090 hits for `prayer times`. This is a real finding: religious timetables
    are published as PDFs by religious ministries, not as datasets by statistics
    agencies.

11. **Authority sites overwhelmingly serve HTML or PDF for one month at a time.**
    Morocco's Habous lists 191 cities (MEASURED by parsing the `ville` select)
    but serves one Hijri month per request at 24,167 bytes, and ignores `mois`
    and `annee` parameters entirely (MEASURED: all three variants return
    identical 24,167 bytes). Egypt's Survey Authority serves 82 cities for a
    single day in one 111,208 byte page and likewise ignores date parameters.

12. **Mosque iqamah times are a different dataset and should not be confused with
    astronomical times.** `open-mosque-prayer-times-dataset` is 19,940 mosques
    across 101 countries, MEASURED at 2,920,076 bytes CSV and 8,275,668 bytes
    JSON, under ODbL with OpenStreetMap attribution. It carries congregation
    times, not computed prayer times, and ODbL share-alike makes it awkward to
    embed.

13. **Turkey alone is available as a community dataset at a manageable size.**
    `TA1GI/namaz_vakitleri` holds 1,681 JSON files totalling 158,941,025 bytes
    MEASURED, one per Turkish district, each 94,552 bytes for a full year. No
    licence.

14. **`ruqqq/prayertimes-database` is the longest-running effort and the only one
    with deep historical coverage, but it is GPL-3.0.** MEASURED: 7,839 blobs
    totalling 414,280,867 bytes; Singapore 2011 through 2026, Malaysia 2018
    through 2026, Brunei 2026, Indonesia 2018 and 2019. GPL-3.0 on the data is a
    blocker for a closed-source app.

15. **A defensible count: 12 countries have an authoritative published timetable
    that is realistically obtainable today, of which 5 are already digitised.**
    Evidence and the country list are in section 6.

## 2. Every dataset and timetable found

Sizes are raw bytes unless a gzip figure is given. `auth` means
authority-published, `comm` means community-scraped.

| Name | Operator | Format | Coverage | Bytes | Gzip | Licence | Origin |
|---|---|---|---|---|---|---|---|
| Muslim Prayer Timetable (consolidated) | MUIS via `data.gov.sg` | CSV | Singapore, 2024 to 2026, 1,096 rows | 57,771 MEASURED | 8,031 MEASURED | Singapore Open Data Licence 1.0 | auth |
| Muslim Prayer Timetable 2026 | MUIS via `data.gov.sg` | CSV | Singapore, 2026 | 18,820 CITED | not measured | Singapore ODL 1.0 | auth |
| Muslim Prayer Timetable 2025 | MUIS via `data.gov.sg` | CSV | Singapore, 2025 | 18,431 CITED | not measured | Singapore ODL 1.0 | auth |
| Muslim Prayer Timetable 2024 | MUIS via `data.gov.sg` | CSV | Singapore, 2024 | 17,580 CITED | not measured | Singapore ODL 1.0 | auth |
| JAKIM `takwimsolat` year export | JAKIM `e-solat.gov.my` | JSON | 1 of 60 MY zones, 1 year | 77,257 MEASURED | 4,877 MEASURED | none stated | auth |
| JAKIM all 60 zones, 1 year | JAKIM, extrapolated | JSON | Malaysia, 1 year | 4,635,420 MEASURED-derived | approx 293,000 UNVERIFIED | none stated | auth |
| Diyanet district year page | `namazvakitleri.diyanet.gov.tr` | HTML | 1 district, 403 days to end 2027 | 380,200 MEASURED | not measured | none stated | auth |
| `fortextexe/namaz-data` | community, Diyanet-sourced | JSON | 18,644 districts, 211 countries, 2026 to 2027 | 2,364,430,269 MEASURED | 149,406 KB packed MEASURED | none | comm |
| `TA1GI/namaz_vakitleri` | community, Diyanet-sourced | JSON | Turkish districts, 1,681 files | 158,941,025 MEASURED | not measured | none | comm |
| `ruqqq/prayertimes-database` | community | JSON | SG 2011 to 2026, MY 2018 to 2026, BN 2026, ID 2018 to 2019 | 414,280,867 MEASURED | not measured | GPL-3.0 | comm |
| `muslim_db_v2.5.1.db` | `my-prayers` | SQLite | 252 fixed-timetable locations, 8 countries, perpetual 366 days | 28,770,304 MEASURED | prayer tables 3,433,472 MEASURED | Apache-2.0 | comm |
| `my-prayers/MyPrayersData` | `my-prayers` | CSV, `prayers.db` | 60 cities, 8 countries, perpetual day-of-year | 19,481,373 tree MEASURED; `prayers.db` 18,365,440 | Birmingham CSV 19,442 raw, 4,700 gzip MEASURED | MIT | comm |
| `api-waktusolat-x` Dump-output-2026 | `mptwaktusolat` | CSV | all 60 JAKIM zones, 2026, 21,900 rows | 3,701,205 MEASURED | 709,729 MEASURED | none | comm |
| `api-waktusolat-x` Dump-output-2023-2024 | `mptwaktusolat` | CSV | 60 zones, 2023 to 2024 | 5,659,786 MEASURED | not measured | none | comm |
| `api-waktusolat-x` Dump-output-2027 | `mptwaktusolat` | CSV | 60 zones, partial 2027 | 493,585 MEASURED | not measured | none | comm |
| `TaqweemQatar` `taqweem.csv` | Qatar Calendar House, digitised | CSV | Qatar, perpetual 365 days | 14,219 MEASURED | 2,973 MEASURED | MIT | auth-derived |
| `TaqweemQatar` `taqweem.dat` | same | encoded minutes | Qatar, perpetual | 10,843 MEASURED | 2,879 MEASURED | MIT | auth-derived |
| `maldives_prayer_times.sql` | Maldives Min. Islamic Affairs, digitised | MySQL | 202 islands as 42 bands, perpetual 366 days, 15,372 rows | 1,299,231 MEASURED | 85,595 MEASURED | none | auth-derived |
| `azzubairx/prayer-times-json` | community | JSON | 275 cities: Libya 122, KSA 117, Jordan 37 | 16,901,222 MEASURED | not measured | CC BY 4.0 per README | comm |
| `open-mosque-prayer-times-dataset` CSV | ImanKeeper | CSV | 19,940 mosques, 101 countries, iqamah times | 2,920,076 MEASURED | not measured | ODbL 1.0 | comm |
| `open-mosque-prayer-times-dataset` JSON | ImanKeeper | JSON | same | 8,275,668 MEASURED | not measured | ODbL 1.0 | comm |
| `ajisetiawan716/jadwalsholat-arina` | community, `jadwalsholat.arina.id` | JSON | Indonesia, 1,026 path segments, 514 in `kota.json`, 2026 months 03 to 08 only | 13,449,831 MEASURED | not measured | Apache-2.0 | comm |
| `EzanVaktiAPI` `lookup.json` | community, Diyanet-sourced | JSON | 5,781 districts, 119 countries, geocoded index, no times | 779,370 MEASURED | 117,051 MEASURED | none | comm |
| `ezanvakti-imsakiyem-api` districts | community, Diyanet-sourced | JSON | 880 districts, index only | 333,862 MEASURED | not measured | GPL-3.0 | comm |
| Islamic Foundation Bangladesh prayer calendar | `islamicfoundation.org` | PDF | Bangladesh, 2025 | 4,688,887 MEASURED | not applicable | not stated | auth |
| Green Lane Masjid timetable | GLM Birmingham | PDF | Birmingham, Jun to Jul 2026 | 3,053,326 MEASURED | not applicable | not stated | federation |
| ADAMS Center prayer calendar | ADAMS Center | PDF | Virginia USA, 2026 | 1,200,881 MEASURED | not applicable | not stated | federation |
| Habous monthly timetable | `habous.gov.ma` | HTML | Morocco, 191 cities, one Hijri month per request | 24,167 MEASURED | not measured | not stated | auth |
| Egypt ESA prayer times | `esa.gov.eg` | HTML | Egypt, 82 cities, single day | 111,208 MEASURED | not measured | not stated | auth |
| IslamicFinder yearly print | IslamicFinder | HTML | any city, 1 year | 258,647 MEASURED | not measured | proprietary | commercial |

## 3. GitHub

### The global-scale find: `fortextexe/namaz-data`

```
repo .size (kB, git objects) = 149406
blobs=37291 bytes=2364430269
{"countries": 211, "cities": 18644, "years": "2026.json,2027.json"}
```

All three figures MEASURED via `gh api repos/fortextexe/namaz-data/git/trees/main?recursive=1`.
The tree's recorded blob sizes were cross-checked against real downloads and
match exactly: `namaz/1/751/15153/2026.json` is 10,337 bytes by both the tree and
`curl`. A leaf file's own payload names its provenance:

```json
"kaynak": "https://namazvakitleri.diyanet.gov.tr",
"guncellendi_at": "2026-09-29T17:24:05.978Z",
"ulke": {"id": "1", "ad": "KUZEY KIBRIS"},
"ilce": {"id": "15153", "ad": "LEFKE", "ad_en": "LEFKE"},
"ekstra": {"kible_acisi": "150", "kible_zamani": "11:33"}
```

Path layout is `namaz/<countryId>/<stateId>/<districtId>/<year>.json`. It also
carries qibla angle and qibla time per district, which is a bonus.

The caveats are serious. The repository was created `2026-09-29T18:15:54Z`, one
day before this research. It has zero stars, no licence, and a README that reads
in full: "This repository stores JSON data used internally by the Fortext Namaz
API. It is not listed in the API website catalog." It is one person's scrape
cache that happens to be public. The value here is the demonstration that
18,644 districts of Diyanet data can be captured, and the path structure worth
copying. Do not depend on it.

### The reusable find: `my-prayers/muslim-data`

Apache-2.0, three platform libraries (iOS 38 stars, Android 34, Flutter 28), and
a single SQLite file as the payload. The schema is the most thought-through of
anything found:

```sql
CREATE TABLE "location" (
	"_id"	INTEGER NOT NULL,
	"country_id"	INTEGER NOT NULL,
	"name"	TEXT NOT NULL,
	"latitude"	REAL NOT NULL,
	"longitude"	REAL NOT NULL,
	"has_fixed_prayer_time"	INTEGER NOT NULL DEFAULT 0,
	"prayer_dependent_id"	INTEGER,
	...
);
CREATE TABLE "prayer_time" (
	"location_id"	INTEGER NOT NULL,
	"date"	TEXT NOT NULL,
	"fajr" TEXT, "sunrise" TEXT, "dhuhr" TEXT,
	"asr" TEXT, "maghrib" TEXT, "isha" TEXT,
	...
);
```

Three design decisions worth stealing. `date` is `MM-DD`, so the table is
perpetual: MEASURED `distinct_dates=366, min=01-01, max=12-31`. `has_fixed_prayer_time`
marks which locations override calculation rather than making that a separate
table. `prayer_dependent_id` lets 127 locations reuse a neighbour's timetable,
which is the same insight as the Maldives latitude bands.

Measured coverage of the fixed timetables:

| Country | Locations | Rows |
|---|---|---|
| Iraq | 97 | 35,501 |
| Iran | 7 | 2,562 |
| Syria | 6 | 2,196 |
| Kuwait | 6 | 2,196 |
| Germany | 4 | 1,464 |
| United Kingdom | 2 | 732 |
| UAE | 2 | 732 |
| France | 1 | 366 |

Total 45,749 rows, 252 locations with `has_fixed_prayer_time=1`, 127 dependents.

The byte breakdown is the reason to care. MEASURED via `dbstat`:

| Object | Bytes |
|---|---|
| `location` | 7,042,048 |
| `location_lat_long_index` | 4,382,720 |
| `location_name_index` | 3,115,008 |
| `prayer_time` | 2,601,984 |
| `location_country_id_index` | 1,725,440 |
| `location_prayer_dependent_id_index` | 1,494,016 |
| `prayer_index` | 831,488 |

The 28.7 MB file is mostly a 166,404-row offline geocoder with four indexes. The
prayer payload is 3,433,472 bytes including its index, about 12 percent. An
extract-and-reship is viable.

Its predecessor `my-prayers/MyPrayersData` is MIT, not Apache, and stores the
same idea as flat per-city CSV in an even cleaner shape:

```
City,Date,Fajr,Sunrise,Zuhr,Asr,Maghrib,Isha
Birmingham,01-01,06:38,08:18,12:11,14:18,16:04,18:05
```

MEASURED 19,442 bytes for Birmingham, 366 rows, 4,700 gzipped. 60 cities across
France, Germany, Iran, Iraq, Kuwait, Syria, UAE and UK. It is archived and its
README points at the Apache-2.0 successors, but MIT on the same data is a
meaningfully better licence, and the day-of-year CSV is trivially parseable.

### Malaysia, fully covered twice over

`mptwaktusolat` is a 24-repository organisation built entirely around JAKIM data,
and `api-waktusolat-x` carries plain CSV dumps:

```
5659786	resources/csv/Dump-output-2023-2024.csv
3701205	resources/csv/Dump-output-2026.csv
3701205	resources/csv/Dump-output-2025.csv
 493585	resources/csv/Dump-output-2027.csv
```

MEASURED content of the 2026 dump: 21,900 data rows, all 60 zones present
(`JHR01` through `WLY02` verified by `awk | sort -u`), gzips to 709,729 bytes.
Times are stored as Unix epoch integers, which is wasteful compared to `HH:MM`
but unambiguous about timezone:

```
zone,year,month,tarikh_hijri,imsak,fajar,syuruk,dhuha,zohor,asar,maghrib,isyak,updated_date,created_date
JHR01,2026,01,1447-07-11,1767217380,1767217980,1767222360,...
```

No licence on the repository. The upstream endpoint is better anyway, see
section 4.

### Turkey as a community dataset

`TA1GI/namaz_vakitleri`, MEASURED 1,681 JSON files, 158,941,025 bytes, one
district per file at a uniform 94,552 bytes:

```json
{"miladiTarih": "01 Ocak 2026 Perşembe", "hicriTarih": "12 Recep 1447",
 "imsak": "06:19", "gunes": "07:45", "ogle": "12:47",
 "ikindi": "15:18", "aksam": "17:39", "yatsi": "19:00"}
```

Root holds 869 files for the current year and `2025/` holds 809. It is refreshed
by two GitHub Actions workflows (`bayram_kontrol.yml`, `yilbasi_guncelleme.yml`).
No licence.

### The long-running effort: `ruqqq/prayertimes-database`

Created 2016-12-28, last pushed 2026-09-25, so it has been maintained for nearly
ten years. MEASURED 7,839 blobs, 414,280,867 bytes. Coverage by country from the
recursive tree:

| Country | Per-year files | Bytes | Years |
|---|---|---|---|
| MY | 531 | 99,753,728 | 2018 to 2026 |
| SG | 16 | 2,982,520 | 2011 to 2026 |
| BN | 3 | 563,220 | 2026 |
| ID | 2 | 374,020 | 2018 to 2019 |

Singapore back to 2011 is unique among everything found, and useful for
validating any calculation engine against 15 years of authority output. The
repository is honest about provenance: its README credits PrayerTime.sg
"sourced out from MUIS PDFs" and MPT's `provider-muis` extraction, which is
itself evidence that PDF digitisation of a national timetable is a solved
problem in practice.

The blocker is GPL-3.0 on the LICENSE file, confirmed MEASURED by decoding
`contents/LICENSE`. For a closed-source app, GPL-3.0 data with a README that
says "Refer to LICENSE for terms of use" is not usable without legal advice.

### Arabic-world community datasets

`azzubairx/prayer-times-json`, MEASURED 277 blobs, 16,901,222 bytes, split:

| Country | Files | Bytes |
|---|---|---|
| KSA | 117 | 10,467,054 |
| Libya | 122 | 4,984,866 |
| Jordan | 37 | 1,445,526 |

Uniform 89,462 bytes per city. Format is a flat array with `DD-MM-YYYY` dates:

```json
[{"fajr": "04:12","sunrise": "05:38","dhuhr": "12:22","asr": "03:42",
  "maghrib": "07:04","isha": "08:34","date": "26-06-2025"}, ...]
```

Two problems. The times are 12-hour without AM/PM markers, so `asr: "03:42"`
must be read as 15:42 by convention, which is fragile. And the README claims
CC BY 4.0 by badge while the repository has no LICENSE file, so
`license.spdx_id` is `none` MEASURED via the API. The README's own attribution
note says the Libyan data came out of a third-party app's bundle, which makes
the CC BY claim doubtful. The README's stated intent is nonetheless exactly this
project's use case: "بيانات موثوقة وخفيفة الحجم دون الاعتماد على واجهة برمجية
خارجية", reliable lightweight data without depending on an external API.

### Indonesia, incompletely covered

`ajisetiawan716/jadwalsholat-arina`, Apache-2.0, MEASURED 2,572 blobs,
13,449,831 bytes. `kota.json` holds 514 cities MEASURED. But the actual timetable
coverage is patchy: the recursive tree shows only months `03, 04, 05, 06, 08` of
2026 present, and 1,026 distinct path segments against 514 listed cities, so the
generator has been running irregularly. Per-file payload is clean:

```json
[{"tanggal": "2026-03-01", "imsyak": "04:19", "shubuh": "04:29",
  "terbit": "05:47", "dhuha": null, "dzuhur": "11:55",
  "ashr": "14:57", "magrib": "18:02", "isya": "19:12"}, ...]
```

Note the source is `jadwalsholat.arina.id`, a third party, not Kemenag directly.

### Index-only datasets, still useful

`furkantektas/EzanVaktiAPI` `lookup.json` is the best free geocoded index of
Diyanet districts found. MEASURED 779,370 bytes, 117,051 gzipped, and it
resolves the hard problem of mapping a GPS fix to a Diyanet `IlceID`:

```json
{"IlceAdi":"Monaco","SehirAdi":"MONACO","UlkeAdi":"MONAKO",
 "IlceID":"15543","lat":43.73718,"lon":7.42145,"UlkeAdiEn":"MONACO"}
```

MEASURED coverage: 5,781 districts, 119 countries, 208 cities. Smaller than
`namaz-data`'s 18,644 but every row carries coordinates, which `namaz-data` does
not. No licence. `karademirmustafa/ezanvakti-imsakiyem-api` has the same idea
under GPL-3.0 with 880 districts in a 333,862 byte file, but Turkey and Northern
Cyprus only.

### Ruled out after checking

| Repository | Why not |
|---|---|
| `open-mosque-prayer-times-dataset` | Iqamah congregation times, not astronomical times. ODbL share-alike. 19,940 mosques MEASURED, top countries Algeria 5,118, USA 2,065, Tunisia 2,031, UK 1,613, France 1,613 |
| `Anjal-Islamic-Library` | Its prayer CSV is 106,924 bytes MEASURED but contains a single date, `29-04-2026`, across 836 rows. Not a timetable |
| `Sami-Zanhour/converting_excel...` | The 38 MB is a Windows `.exe`, 39,409,005 bytes MEASURED. No data |
| `metinkale38/prayer-times-android` | 220 MB is fonts and a compass animation GIF. No bundled timetables found |
| `islamic-network` org | MEASURED: one repository, `.github`, 3 KB. The AlAdhan API publishes no bulk dump. `aladhan.com/data` returns 404 |
| `mohdsyahid/jadual-solat-malaysia` | MIT and clean, but 264 KB serving current data only, not a historical bulk set |

## 4. Authority endpoints that behave like datasets

This is the most actionable category. Three national authorities serve
bulk-shaped responses without a key.

### JAKIM, Malaysia

MEASURED across six zones:

```
period=year&zone=SGR01 -> http=200 bytes=77256 type=application/json
period=month&zone=SGR01 -> http=200 bytes=6494
period=duration&zone=SGR01 -> http=500 bytes=443
WLY01 bytes=77257   KDH01 bytes=77256   JHR02 bytes=77257
PNG01 bytes=77257   SBH07 bytes=77257
```

Path: `www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=year&zone=<ZONE>`.
Response is one object per day with `hijri`, `date`, `day`, `imsak`, `fajr`,
`syuruk`, `dhuha`, `dhuhr`, `asr`, `maghrib`, `isha`. Sixty zones covers the
whole country: `4,635,420` bytes for a year, about 293 KB gzipped. Zone codes
are enumerable from the `e-solat.gov.my` homepage dropdown, which lists all 60
with their district names. No licence is stated anywhere on the portal.

### Diyanet, Turkey and 208 other countries

MEASURED by parsing the homepage `select` elements:

```
country-select  -> 209 options; first: ('33','ABD'), ('166','AFGANISTAN'), ('13','ALMANYA')
city-select     ->  81 options (Turkish provinces)
district-select ->  17 options (for the default province)
```

MEASURED on a district page:

```
https://namazvakitleri.diyanet.gov.tr/tr-TR/9206/ankara-icin-namaz-vakti
  http=200 bytes=380204
date-like rows parsed: 403
first: ['30 Eylül 2026 Çarşamba', '19 Rebiulahir 1448', '05:13','06:37','12:44','16:03','18:41','19:59']
last:  ['31 Aralık 2027 Cuma', '3 Şaban 1449', '06:33','08:03','12:56','15:19','17:39','19:04']
```

One request yields 403 days per district, running fifteen months past today,
with Hijri dates alongside. The URL pattern `tr-TR/<districtId>/<slug>` is
predictable and `data-url` attributes in the page enumerate sibling districts.
The `GetRegList` JSON endpoint exists but returned an empty `StateList` for
every `ChangeType` tried, so enumeration has to come from the HTML.

There is no XLS or PDF export endpoint: MEASURED, all four URL variants tried
(`yillik-namaz-vakti`, `aylik-namaz-vakti`, `home/YillikNamazVakti?ilceId=`, and
the plain district slug) return the same approximately 380,200 byte HTML page.
The scrape is HTML parsing, not file download. `fortextexe/namaz-data` proves
18,644 districts of it is achievable.

### Morocco Habous: cities yes, years no

MEASURED: 191 cities in the `ville` select, with ids running to 322, so the
numbering is sparse. One Hijri month per response at 24,167 bytes. Date
parameters are ignored:

```
index.php?ville=1                    -> http=200 bytes=24167
index.php?ville=1&mois=1             -> http=200 bytes=24167
index.php?ville=1&mois=1&annee=2026  -> http=200 bytes=24167
```

Identical byte counts confirm the parameters do nothing. Collecting a year means
12 requests per city timed across 12 months, or 2,292 requests total, and you
cannot backfill or look ahead. There are no PDF or XLS links on the page
(MEASURED: the regex for `href` containing `pdf|xls|csv` returned an empty set).
Morocco is obtainable but only by polling monthly for a year.

### Egypt Survey Authority: all cities, one day

MEASURED: 82 cities (83 dropdown options less "كل المدن"), 78 dated rows in one
111,208 byte page, Gregorian and Hijri dates both present. Date parameters
ignored:

```
praytimes.aspx                 -> bytes=111208
praytimes.aspx?date=2026-01-01 -> bytes=111224
praytimes.aspx?m=1&y=2026      -> bytes=111223
```

The 16-byte variations are the echoed query string, not different data. This is
an ASP.NET WebForms page whose dropdown posts back, so a year requires 365 daily
polls. Authoritative and complete across Egypt's cities, but only for today.

### Tunisia: partial

`meteo.tn/en/heures-prieres` is the national meteorological institute, which is
the official source. MEASURED 329,105 bytes, but only 13 table rows and a
24-governorate dropdown with an empty dependent "Delegation" select, so the page
is JS-driven. A scraper exists (`Ghorbel37/tunisia-prayer-times-scraper`, 2 KB,
no licence) which confirms the data is reachable but produces daily CSV, not a
year.

## 5. Portals, repositories and platforms

### Data portals

| Portal | Query | Result | Verdict |
|---|---|---|---|
| `data.gov.sg` | `prayer`, agency MUIS | 4 datasets, CSV, Singapore ODL 1.0 | The one success |
| `data.gov.uk` | `prayer` via CKAN | `count=0` MEASURED | Nothing |
| HDX | `prayer` via CKAN | `count=0` MEASURED | Nothing |
| `data.gov.my` | `solat` | "No entries found" MEASURED | Nothing live |
| `archive.data.gov.my` | dataset `waktu-solat-seluruh-malaysia` | `http=000`, host unreachable MEASURED | Dead. The MAMPU-era dataset existed and is CITED by search results but the archive no longer serves it |
| `data.europa.eu` | `prayer times` | 82,161 hits, none prayer-related on inspection | Keyword noise |
| `bayanat.ae` | portal reachable, no prayer dataset surfaced | UNVERIFIED, JS-gated | Unlikely |
| `open.data.gov.sa` / `od.data.gov.sa` | no prayer dataset surfaced | UNVERIFIED, JS-gated | Unlikely |

Singapore's four MUIS datasets, all MEASURED via the `data.gov.sg` v2 metadata
API:

| Dataset ID | Name | Bytes | Coverage |
|---|---|---|---|
| `d_a6a206cba471fe04b62dd886ef5eaf22` | consolidated | 57,771 | 2024-01-01 to 2026-12-31 |
| `d_d441e7242e78efc566024dd5b0d9829c` | 2026 | 18,820 | 2026 |
| `d_e81ea2337599b674c4f645c1af93e0dc` | 2025 | 18,431 | 2025 |
| `d_dddc19f6c90edd7cff6b57494630ad29` | 2024 | 17,580 | 2024 |

Columns are `Date, Day, Subuh, Syuruk, Zohor, Asar, Maghrib, Isyak` with typed
metadata (`Date (YYYY-MM-DD)`, `Time (HH:mm:ss)`). Download is a two-step
`poll-download` call that returns a presigned S3 URL:

```
GET https://api-open.data.gov.sg/v1/public/api/datasets/<id>/poll-download
-> {"status":"DOWNLOAD_SUCCESS","url":"https://s3.ap-southeast-1.amazonaws.com/..."}
```

MEASURED fetch of the consolidated file: 57,771 bytes, HTTP 200, 1,096 data
rows, gzips to 8,031 bytes. One caveat visible in the data itself: times are
12-hour without meridiem, so `Zohor` reads `01:10` for 13:10.

```
Date,Day,Subuh,Syuruk,Zohor,Asar,Maghrib,Isyak
2024-01-01,Mon,05:44,07:07,01:10,04:34,07:10,08:25
```

Licence is the Singapore Open Data Licence 1.0, which permits commercial reuse
with attribution and carries an explicit "as is" disclaimer.

### Academic repositories: nothing

Zenodo API, MEASURED hit counts and top results inspected:

| Query | Total | Relevant |
|---|---|---|
| `prayer times` | 184,090 | None. Top hits are a 1919 theology article, NYT covid data, and Indonesian education papers |
| `salat times` | 182,526 | None. Top hits include lettuce cultivation (`salat` is Uzbek for lettuce) and a solar-physics package named SALAT |
| `mawaqit` | 0 | None |
| `hijri calendar` | 4,190 | Conversion software only: `HijriDate` Python package, Stata converters. No timetables |
| `namaz vakitleri` | 63 | Turkish theology papers, one AGPL app named `Ezan` |

Kaggle has `ashrafkhetran/daily-islamic-prayer-times-across-cities-dataset` but
the page failed to render through fetch (CSS chunk error) so its coverage, size
and licence are UNVERIFIED. Kaggle also carries `riotulab/salat-postures`, which
is images of prayer postures, and various Quran text corpora. Nothing that is a
timetable.

This absence is itself a finding. Prayer timetables are a religious-administrative
artefact, not a research output, so they do not land in research data
repositories.

### Islamic platforms

| Platform | Bulk data? | Evidence |
|---|---|---|
| AlAdhan | No | MEASURED: `aladhan.com/data` returns 404. `islamic-network` GitHub org has exactly one repository, `.github`, 3 KB |
| Quran.com / Quran Foundation | Quran text only | QUL at `qul.tarteel.ai` serves Quran JSON downloads, MEASURED 74,495 byte landing page. No prayer data |
| Muslim Pro | No | No published dataset found. App-internal only |
| IslamicFinder | Print pages only | MEASURED 258,647 bytes for a yearly print view, HTML, proprietary |
| London Prayer Times | Key-gated API, London only | CITED from its own docs: "Cities: We only provide times for London", key application "manually processed" |
| Wifaqul Ulama UK | Per-city PDFs on request | CITED: "Manual timetables will only be created for special cases", city appears in green when available |
| Mawaqit.net | Mosque-federation API, community wrappers | `mrsofiane/mawaqit-api` has 90 stars, MIT, but it is an API wrapper not a dataset |

## 6. How many countries can realistically be digitised

The defensible count is **12 countries where an authoritative published timetable
is obtainable today**, of which **5 already exist as usable datasets** and **7
require work**. Every row below rests on an HTTP response obtained in this
session.

### Already digitised and usable

| Country | Artefact | Evidence | Licence |
|---|---|---|---|
| Singapore | `data.gov.sg` MUIS CSV | 57,771 bytes MEASURED, 2024 to 2026 | Singapore ODL 1.0 |
| Malaysia | JAKIM year endpoint, 60 zones | 77,257 bytes per zone MEASURED across 6 zones | none stated |
| Qatar | `TaqweemQatar` perpetual CSV | 14,219 bytes MEASURED, 365 rows | MIT |
| Maldives | `maldives_prayer_times.sql` | 1,299,231 bytes MEASURED, 202 islands, 42 bands | none |
| Turkey | Diyanet district pages | 380,204 bytes for 403 days MEASURED; 1,681-file community mirror 158,941,025 bytes MEASURED | none stated |

### Obtainable with effort, source confirmed live

| Country | Source | Evidence | Work required |
|---|---|---|---|
| Morocco | `habous.gov.ma` | 191 cities MEASURED, 24,167 bytes per month | 12 monthly polls per city over a year, no backfill |
| Egypt | `esa.gov.eg` | 82 cities MEASURED in one 111,208 byte page | 365 daily polls |
| Bangladesh | `islamicfoundation.org` PDF | 4,688,887 bytes MEASURED, 2025 calendar | PDF table extraction |
| Brunei | `ruqqq` BN data | 563,220 bytes, 2026 MEASURED | Already partly done, needs a licence path |
| Indonesia | Kemenag `bimasislam.kemenag.go.id/jadwalshalat` | reachable, 30,135 bytes MEASURED; community mirror covers 514 cities but only 5 months of 2026 | Find the real per-kabupaten export; the community set is incomplete |
| Libya | `azzubairx` Libya set | 122 cities, 4,984,866 bytes MEASURED | Licence is doubtful, needs re-sourcing from the Awqaf ministry |
| Jordan | `azzubairx` Jordan set | 37 cities, 1,445,526 bytes MEASURED | Same licence problem |

### Why not more

Countries excluded, and the reason each was excluded:

- **Saudi Arabia.** The `azzubairx` KSA set exists (117 cities, 10,467,054 bytes
  MEASURED) but its README says only "مواقيت رسمية معتمدة", officially approved
  times, without naming the issuing body. Umm al-Qura is the authority and no
  downloadable Umm al-Qura file was found. Counted as UNVERIFIED, not
  obtainable.
- **Tunisia.** `meteo.tn` is the right authority and is live, but the page is
  JS-driven with an empty delegation dropdown, MEASURED 13 table rows only. A
  scraper exists but produces daily output. Not counted, because no
  year-or-perpetual artefact was reached.
- **UAE, Kuwait, Iraq, Iran, Syria.** `muslim-data` carries fixed timetables for
  all of these, 97 Iraqi locations most notably, but the upstream authority file
  was never located; the data arrives through a community app with no cited
  source. Usable in practice, not defensible as authority-published.
- **Pakistan, Nigeria, South Africa, Algeria.** Searched, nothing
  authority-published found. Results were aggregator sites (IslamicFinder,
  MuslimPro, `islamicacademy.org`) or Scribd uploads of unknown provenance.
- **United Kingdom.** No single national authority exists. What exists is
  federation and mosque-level PDFs: Green Lane Masjid 3,053,326 bytes MEASURED,
  and London Prayer Times behind a manually approved API key limited to London.
  Wifaqul Ulama states plainly that its app is the primary source and manual
  timetables are exceptional. The UK is many local datasets, not one national
  one.

The count of 12 is deliberately conservative. It counts a country only where a
file or endpoint returned real prayer times over HTTP in this session. A looser
count that trusted `muslim-data`'s unsourced coverage would reach 19 countries; a
looser one still that trusted `fortextexe/namaz-data`'s Diyanet scrape would
claim 211 country codes, but Diyanet computes times for foreign cities rather
than publishing each nation's own authority timetable, so that number answers a
different question.

The strategic reading: **Diyanet alone, at 209 countries and 18,644 districts, is
worth more than the other eleven national sources combined**, because it is one
scrape, one format, one enumeration problem. The others matter where local
practice rejects Diyanet's method, which is precisely Malaysia, Singapore,
Indonesia, Morocco, Egypt and Qatar, all six of which are on the obtainable list.

## 7. Size budget, measured

The numbers that decide whether this ships. Left column MEASURED directly, the
extrapolations scale the measured 31-day Diyanet sample to 365 days.

Per location, one year:

| Encoding | Bytes | Basis |
|---|---|---|
| Raw Diyanet JSON | 121,710 | extrapolated from 10,337 MEASURED over 31 days |
| Gzipped JSON | 16,931 | extrapolated from 1,438 MEASURED |
| Compact CSV, times only | 17,520 | extrapolated from 1,488 MEASURED |
| Gzipped compact CSV | 5,028 | extrapolated from 427 MEASURED |
| Delta-encoded bytes | 2,190 | extrapolated from 186 MEASURED |
| Gzipped delta | 1,024 | extrapolated from 87 MEASURED |

The delta encoding stores each prayer's minute-of-day as a one-byte difference
from the previous day, per prayer column. MEASURED on the real sample: 186 bytes
for 31 days times 6 prayers, against 10,337 bytes of JSON. That is a 55x
reduction before compression and 119x after.

Scaled to whole territories:

| Territory | Raw JSON | Gzip JSON | Gzip CSV | Delta |
|---|---|---|---|---|
| 60 JAKIM zones | 7.0 MiB | 1.0 MiB | 0.3 MiB | 0.1 MiB |
| 42 Maldives bands | 4.9 MiB | 0.7 MiB | 0.2 MiB | 0.1 MiB |
| 514 Indonesian kota | 59.7 MiB | 8.3 MiB | 2.5 MiB | 1.1 MiB |
| 1,000 Turkish districts | 116.1 MiB | 16.1 MiB | 4.8 MiB | 2.1 MiB |
| 18,644 Diyanet districts, world | 2,164.0 MiB | 301.0 MiB | 89.4 MiB | 38.9 MiB |

Three conclusions follow. A single country at zone or band granularity is free,
well under 1 MiB. A large country at district granularity is affordable at a few
MiB. Global district-level coverage is not shippable as JSON at 2.1 GiB, is
marginal as gzipped CSV at 89 MiB, and becomes plausible at 39 MiB delta-encoded,
which the Maldives latitude-band trick would cut further by collapsing
neighbouring districts onto shared timetables.

Corroborating real-world gzip ratios, all MEASURED:

| File | Raw | Gzip | Ratio |
|---|---|---|---|
| JAKIM `SGR01` year JSON | 77,257 | 4,877 | 15.8x |
| `data.gov.sg` consolidated CSV | 57,771 | 8,031 | 7.2x |
| Malaysia 60-zone 2026 CSV | 3,701,205 | 709,729 | 5.2x |
| Maldives SQL | 1,299,231 | 85,595 | 15.2x |
| Qatar perpetual CSV | 14,219 | 2,973 | 4.8x |
| Birmingham perpetual CSV | 19,442 | 4,700 | 4.1x |
| `EzanVaktiAPI` lookup index | 779,370 | 117,051 | 6.7x |
| `fortextexe/namaz-data` whole repo | 2,364,430,269 | 152,991,744 packed | 15.5x |

The Malaysia CSV's poor 5.2x ratio is explained by its epoch-integer times,
which defeat the redundancy gzip would otherwise exploit. Storing `HH:MM`
compresses better than storing `1767217380`.

## 8. UNVERIFIED and open

- **Kaggle's `daily-islamic-prayer-times-across-cities-dataset`.** Page failed to
  render. Coverage, city count, year range, byte size and licence all unknown.
  Worth one retry through a real browser.
- **`azzubairx` licence.** README badges CC BY 4.0, repository has no LICENSE
  file, and the Libyan data is credited to a third-party app's bundle. The CC BY
  claim is probably not the author's to make. Needs resolution before use.
- **JAKIM and Diyanet terms of use.** Neither portal states a licence anywhere
  found. Both serve public data without a key. Redistribution rights are
  genuinely unclear and this is the single largest legal unknown in the report.
- **`fortextexe/namaz-data` longevity.** Created one day before this research,
  zero stars, no licence, README says it is internal. Could vanish. The
  reproducible asset is the method, not the repository.
- **Saudi Umm al-Qura official file.** Not located. If an official Umm al-Qura
  timetable download exists, it would be high value and would raise the
  digitisable count to 13.
- **Kemenag's real bulk export.** `bimasislam.kemenag.go.id/jadwalshalat` is live
  at 30,135 bytes MEASURED but its per-kabupaten export path was not found. One
  search result CITED an API with data from 2013 to 2073, which if real would be
  remarkable, but it was an unverified third-party blog mirror.
- **`bayanat.ae`, `open.data.gov.sa`, `opendata.gov.jo`, `opendata.gov.om`.** All
  are JS-gated and were not driven with a real browser. Absence of a prayer
  dataset is inferred, not proven.
- **Diyanet request budget.** 18,644 districts at one request each is feasible in
  principle, but no rate limit is published and no throttling behaviour was
  tested. Someone has evidently done it, since `namaz-data` exists.
- **`prayers.db` in `MyPrayersData`.** 18,365,440 bytes, MIT, not opened. May
  contain more than the 60 CSV cities visible in the tree.
- **Turkish district total.** Diyanet's dropdown shows 81 provinces and 17
  districts for the default province; the true Turkish district count was not
  enumerated. The 1,000-district figure used in the size table is a conventional
  approximation, and `TA1GI`'s 869 current-year files is the better empirical
  anchor.

## 9. Sources

All fetched 2026-09-30.

Authority endpoints and portals:
- `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=year&zone=SGR01`
- `https://www.e-solat.gov.my/`
- `https://namazvakitleri.diyanet.gov.tr/tr-TR`
- `https://namazvakitleri.diyanet.gov.tr/tr-TR/9206/ankara-icin-namaz-vakti`
- `https://api-production.data.gov.sg/v2/public/api/datasets/<id>/metadata`
- `https://api-open.data.gov.sg/v1/public/api/datasets/<id>/poll-download`
- `https://data.gov.sg/datasets?agencies=Majlis%20Ugama%20Islam%20Singapura%20(MUIS)`
- `https://data.gov.sg/open-data-licence`
- `https://www.habous.gov.ma/prieres/`
- `https://www.esa.gov.eg/praytimes.aspx`
- `https://www.meteo.tn/en/heures-prieres`
- `https://bimasislam.kemenag.go.id/jadwalshalat`
- `https://www.islamicfoundation.org/pdf/if-prayer-calendar-2025.pdf`
- `https://greenlanemasjid.org/wp-content/uploads/2026/05/GLM-SALAH-TIMETABLE-JUNJUL26.pdf`
- `https://adamscenter.org/wp-content/uploads/2026/02/ADAMS-Prayer-Times-2026.pdf`
- `https://londonprayertimes.com/api/`
- `https://www.wifaqululama.co.uk/salahtimes/`
- `https://www.islamicfinder.org/prayer-times/print-yearly-prayers/?timeInterval=year&calendarType=Gregorian&year=2026`

GitHub repositories, all queried through `api.github.com`:
- `github.com/fortextexe/namaz-data`
- `github.com/my-prayers/muslim-data-ios`, `-android`, `-flutter`
- `github.com/my-prayers/MyPrayersData`
- `github.com/ruqqq/prayertimes-database`
- `github.com/TA1GI/namaz_vakitleri`
- `github.com/mptwaktusolat/api-waktusolat-x`
- `github.com/osamaalassiry/TaqweemQatar`
- `github.com/itsMaadh/maldives-prayer-times`
- `github.com/azzubairx/prayer-times-json`
- `github.com/cjfalcone94-bit/open-mosque-prayer-times-dataset`
- `github.com/ajisetiawan716/jadwalsholat-arina`
- `github.com/furkantektas/EzanVaktiAPI`
- `github.com/karademirmustafa/ezanvakti-imsakiyem-api`
- `github.com/mohdsyahid/jadual-solat-malaysia`
- `github.com/Abdallahnangere/Anjal-Islamic-Library`
- `github.com/Ghorbel37/tunisia-prayer-times-scraper`

Negative-result queries, all run and recorded:
- `ckan.publishing.service.gov.uk/api/3/action/package_search?q=prayer` returned `count=0`
- `data.humdata.org/api/3/action/package_search?q=prayer` returned `count=0`
- `data.gov.my/data-catalogue?search=solat` returned "No entries found"
- `archive.data.gov.my` host unreachable, `http=000`
- `zenodo.org/api/records?q=mawaqit` returned `total=0`
- `aladhan.com/data` returned 404
- GitHub repository search returned `total=0` for `waktu+solat+dataset`,
  `jadwal+shalat+dataset`, `mawaqit+salat+data`, `mawaqit+dataset`,
  `solat+dataset+csv`, `ramadan+timetable+dataset`
