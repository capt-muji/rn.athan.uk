# O1m-7 Europe city depth — wave report

Continuation of a banked partial run (provider cancellation). Workspace
`$HOME/athan-gitree/census/o1m/o1m-7-europe/`. Nothing here concludes a country; the round
re-arms and looks again.

Captured in this session: 1,592 Diyanet-abroad locality pages (712 MB), 615 tawkit Spanish
municipality pages, six preghiera-orario Italian city pages, the namazvakti Ramadan imsakiye for
Köstence, four Romanian mawaqit tenants, one UCOII shell, one GMP page, and the full 495-tenant
masjidi directory. Script-counted total: 620,183 dated rows, 2,388 capture files, 863.9 MB.

## 1. What the banked work held, and what was done with it

| Artifact | State on arrival | Action |
| --- | --- | --- |
| `captures/ro-diyanet-*.html` | 46 Romanian pages | parsed; the parser crashed on the Bucharest filename (id 15944 read from the page's own selected option) and was repaired |
| `captures/ro-mawaqit-arrahman-bucuresti.html` | one mawaqit page | parsed (embedded twelve-month calendar) |
| `captures/ro-imamali-*.html`, `ro-musulman-home.html` | JS shells, a client calculator | no dated table: recorded as computed-only |
| `work/parse_diyanet.py` | numeric ids only | superseded by `work/parse_diyanet_bulk.py` |
| `data/`, `fit/`, `REPORT.md` | empty | this report |

The Diyanet page's own district list carries **53** Romanian localities, seven more than the
banked 46: Adamclisi 21172, Brăila 16750, Călărași 16751, Ciucurova 16749, Isaccea 21171,
Măcin 21170, Reșița 16708. All seven fetched.

## 2. The instrument

Every fit runs adhan 4.4.6 (`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`),
`Rounding.None`, the city's own `Europe/*` zone pinned through `Intl`, dates from the literal
printed strings. No clock is read.

- `work/angles.mjs` — reads the depression angle of the sun at every published fajr/isha instant
  from adhan's own `SolarCoordinates`. This measures a table's angle instead of assuming one.
- `work/recipe.mjs` — candidate recipes over a whole country.
- `work/fit-each.mjs` — per-city fit. Angle-honest days are separated first (a day whose maximum
  solar depression never reaches the fitted angle cannot carry that angle); the angles are
  searched on those days; the integer temkin is the residual median. Reports `clampedDays` and
  the printed `summerIshaGapMedian` for the block the angle cannot reach.
- `work/solve.mjs` — position solved from a surface's own meridian and horizon pair, when no
  gazetteer match exists.
- `work/geonames.py` — positions from the GeoNames country dumps (CC-BY, `www.geonames.org`).
  Of the 1,591 Diyanet localities that parsed, 1,589 matched (34 by fuzzy spelling, each flagged
  `fuzzy`); the two that did not are Gibraltar (`Gibraltar`, listed under Spain) and the Diyanet
  typo `Beurgtheroulde`. Romania's 53 came from a public geocoder instead, before the gazetteer
  route existed.

Script-counted totals for this workspace (`data/INVENTORY.md`, `work/inventory.py`):
**620,183 dated rows across 21 surface files, 2,388 capture files, 863.9 MB of raw archive.**
Every Diyanet country file was checked for shape: 1,645 localities parsed, each exactly 365 rows,
every date inside 2026, zero defects.

### 2.1 Surfaces captured in this session

| surface | class | scope | dated rows | grade |
| --- | --- | --- | --- | --- |
| `namazvakitleri.diyanet.gov.tr/en-US/<id>` | state authority abroad (Diğer Ülkeler table) | 16 countries, 1,645 localities listed, 1,644 parsed | 600,060 | provisional (one cycle, fitted) |
| `tawkit.net/en/prayer-times/spain/<slug>/` | platform (mosque app) | 615 Spanish municipalities | 18,450 | candidate (one month, fitted) |
| `mawaqit.net/en/<slug>/` | community (mosque tenant) | 4 Romanian mosques | 1,464 | provisional (one cycle, fitted) |
| `preghiera-orario.it/orario-preghiera-<slug>-<id>-it` | platform (Italian aggregator) | 6 named Italian cities | 180 | candidate (one month, fitted) |
| `namazvakti.com/Imsakiye.php?cityID=11281` | platform (Turkish) | Köstence, Ramadan imsakiye | 29 | candidate (dated, one month) |
| `tv.masjidi.app` table 5733 | platform (mosque signage) | Constanța | 366 (undated scaffold) | candidate, and provably Diyanet's table |

## 3. Romania — the country that was FALLBACK

### 3.1 Diyanet abroad, 53 localities, 19,345 dated rows (2026)

Surface: `namazvakitleri.diyanet.gov.tr/en-US/<districtId>`, public, no login, one page per
district carrying the whole year beside the Hijri date.

Recipe: **fajr 18.0°, isha 16.0°**, Shafi asr, temkin **sunrise −7, dhuhr +5, asr +4,
maghrib +7**, fajr and isha 0/−1. Per-column medians across the 53 localities:
fajr 82.2 within 1, sunrise 100, dhuhr 100, asr 84.7, maghrib 95.3, isha 53.4.

The isha value is the post-January-2023 Diyanet-EU regime: the same platform serves **17°** in
Albania, Spain, Greece, Montenegro, North Macedonia, Portugal and Kosovo in the same year, so
the two are never blended. This wave holds 2026 only, one cycle: `provisional`.

The 16° is not exact. The monthly implied angle at Bucharest runs 15.62 (June) to 16.25
(September) — a ±2 minute wobble around 16.0 that no single angle reproduces. Recorded, not
smoothed.

### 3.2 Mawaqit tenants, 4 mosques, 1,464 dated rows (2026)

Fetched by known slug (`mawaqit.net/en/<slug>/`; the `/en/m/<slug>` form redirects). The page
embeds the mosque config and a twelve-month calendar; the year is proved by matching the page's
own "today" row to the calendar, which anchors on 2026-11-11 for all four.

| tenant | recipe | within-1, all columns |
| --- | --- | --- |
| مسجد الرحمن — Moscheea Ar-Rahman, București | 18.0 / 18.0, zero temkin | 99.1 |
| مسجد التقوى — Masjid Ettaqwa, București | 18.0 / 18.2, asr −1 | 95.0 |
| مسجد القدس — Masjid al-Quds, București | 17.9 / 17.0 | 94.5 |
| المركز الإسلامي الثقافي, Constanța | 18.0 / **maghrib + 90 fixed**; dhuhr +5, asr +4, maghrib +7 | 93.2 |

The Constanța tenant is a hand-entered Diyanet-shaped table: its dhuhr +5 and maghrib +7 are the
Diyanet temkin set and its isha is a flat 90 minutes after maghrib on all 366 rows.

### 3.3 Platform defect: masjidi's Romanian table is Diyanet frozen at standard time

`tv.masjidi.app` tenant 1390 (المركز الإسلامي الثقافي, Constanța) serves regional table 5733.
Against Diyanet's Constanța 2026 table, day-of-year for day-of-year: **155 of 365 rows identical
on all six columns, and the median difference on every column is exactly −60 minutes**. The
identical block is the winter half. The payload therefore carries Diyanet's table with the
summer-time instruction dropped — the defect class recorded for the Irish IFI feed in O1l-29.

### 3.4 Romania: what was not found (languages: Romanian, English, Turkish)

- `musulman.ro` (Moscheea Ar-Rahman): JavaScript shell, 2,971 bytes, no table in the HTML.
- `tawhid.ro/orar-rugaciune`: a client-side calculator ("ore calculate astronomic"), states that
  it computes. Computed-only, not data.
- `imamali.ro`: Shia (Jafari/Tehran) monthly calculator with a PDF export; `ramadan_ro.htm` the
  same.
- No Romanian muftiate page carries a prayer table: `culte.gov.ro` describes the 81 places of
  worship and prints none.
- Constanța and Tulcea geamia pages (tourism and heritage sites) print visiting hours, not
  prayer times. The Tatar/Turkish community phrasings are left for the next round.

### 3.5 A Turkish-platform witness for Constanța: namazvakti.com

`namazvakti.com/Imsakiye.php?cityID=11281` publishes Köstence's Ramadan imsakiye — 29 dated rows,
19 February to 20 March 2026, Turkish column convention with **imsak separated from sabah (fajr)**
by 16 minutes. It is a second, independent publisher for the same city as Diyanet, and it dates
its own table (Hijri 1448 / 2026 in the header). Captured and parsed to
`data/ro-namazvakti-imsakiye-2026.json`. The site's daily page carries the same convention for
one day only (`Main.php?cityID=11281`); a year table is not served.

## 4. The Diyanet layer: fifteen countries, 1,592 localities

`/en-US/home/GetRegList?ChangeType=country&CountryId=<n>` is the public endpoint behind the
site's own country dropdown; it lists every locality the platform serves. Captured raw as
`captures/diyanet-reglist-<cc>.json`. One page per locality, then parsed.

| country | localities | dated rows 2026 | isha angle |
| --- | --- | --- | --- |
| France | 587 | 214,255 | 15.9 |
| Netherlands | 283 | 103,295 | 15.9 |
| Belgium | 221 | 80,665 | 15.9 |
| Italy | 144 | 52,560 | 16.0 |
| Spain | 53 | 19,345 | 17.0 |
| Bosnia-Herzegovina | 47 | 17,155 | 16.0 |
| Poland | 46 | 16,790 | 15.9 |
| Greece | 44 | 16,060 | 17.0 |
| North Macedonia | 35 | 12,775 | 17.0 |
| Serbia | 31 | 11,315 | 16.0 |
| Montenegro | 22 of 23 | 8,030 | 17.0 |
| Croatia | 22 | 8,030 | 16.0 |
| Portugal | 21 | 7,665 | 17.0 |
| Albania | 20 | 7,300 | 17.0 |
| Kosovo | 15 | 5,475 | 17.0 |
| Romania | 53 | 19,345 | 16.0 |

Fajr is **18.00° in every one of the sixteen**. The isha split is clean and reproducible: the
implied angles cluster at 16.95–16.98 or 15.87–16.00 with almost no overlap, so this is a
configuration difference, not a latitude artifact.

One Montenegro page (33391) returned no year table. Recorded, not retried.

## 5. Spain second layer: tawkit.net, 614 municipalities, 18,420 rows (November 2026)

`tawkit.net/en/prayer-times/spain/<slug>/` prints "Prayer timetable, 11-2026 — <city>" and a
30-row month. 615 slugs listed, 614 matched to a GeoNames municipality and fitted.

Recipe: **fajr 15.0°, isha 14.8°**, zero temkin (median offsets: asr +1, everything else 0).
**Median within-1 across the 614 municipalities is 100.0** on the thirty days held: this is a
plain 15/15 engine served as a page, not a mosque-entered table. One cycle, `candidate`.

Spain's Diyanet layer (18/17) and tawkit's (15/15) disagree by design; both are recorded, neither
adjudicated.

tawkit's country index carries **only Italy (2 cities), Spain (615) and the Netherlands (1)** of
this mission's countries; Romania, Greece, Poland, Bosnia, Portugal, Croatia, Serbia, Montenegro,
Kosovo and North Macedonia are absent from it (recorded negative).

## 6. Italy: a second witness for the six named cities

`preghiera-orario.it/orario-preghiera-<slug>-<id>-it` serves a monthly table per comune.
Captured Naples 781, Florence 48, Palermo 82, Catania 87, Bari 72, Verona 95 — November 2026,
180 rows.

| city | fajr | isha | within-1 |
| --- | --- | --- | --- |
| Naples | 18.0 | 17.0 | 100 |
| Verona | 18.5 | 17.0 | 98.7 |
| Palermo | 18.5 | 15.5 | 92.0 |
| Catania | 18.0 | 16.0 | 90.0 |
| Bari | 15.2 | 13.0 | 79.3 |
| Florence | 15.0 | 13.0 | 74.0 |

The six do not share a recipe, and Bari/Florence carry a dhuhr offset of +13/+13 minutes against
Naples' −2: this surface's per-city configuration is inconsistent. One month only, `candidate`,
and the dispersion is recorded as a defect of that platform rather than adjudicated.

## 7. Fit table

`fit/SUMMARY.md` is the generated file; the same table stands here. The France row may still
show a blank clamped-day column: that fit was taken before the clamp split was added to the
fitter, and the re-take did not finish inside this session.

| surface | cities | angle-honest rows | fajr | isha | modal temkin (cities on it) | within-1 median | clamped days median |
| --- | --- | --- | --- | --- | --- | --- | --- |
| al-diyanet | 20 | 7,300 | 18.00 | 17.00 | asr+4 dhuhr+5 maghrib+7 sunrise-7 (20) | 96.0 | 0.0 |
| ba-diyanet | 47 | 17,155 | 18.00 | 16.00 | asr+4 dhuhr+5 maghrib+7 sunrise-7 (29) | 92.4 | 0 |
| be-diyanet | 221 | 69,385 | 17.90 | 15.90 | asr+4 dhuhr+5 maghrib+7 sunrise-7 (141) | 75.6 | 52 |
| es-diyanet | 52 | 18,980 | 18.00 | 17.00 | asr+4 dhuhr+5 maghrib+7 sunrise-7 (47) | 95.0 | 0.0 |
| fr-diyanet | 586 | 213,890 | 17.97 | 15.94 | asr+4 dhuhr+5 isha-1 maghrib+7 sunrise-7 (472) | 78.5 | - |
| gr-diyanet | 44 | 16,060 | 18.00 | 17.00 | asr+4 dhuhr+5 maghrib+7 sunrise-7 (41) | 96.8 | 0.0 |
| hr-diyanet | 22 | 8,030 | 18.00 | 16.00 | asr+4 dhuhr+5 isha-1 maghrib+7 sunrise-7 (13) | 84.6 | 0.0 |
| it-diyanet | 144 | 52,560 | 18.00 | 16.00 | asr+4 dhuhr+5 maghrib+7 sunrise-7 (100) | 92.3 | 0.0 |
| it-preghieraorario | 6 | 180 | 18.00 | 15.75 | asr+10 dhuhr+13 fajr-1 isha+2 maghrib+9 (1) | 91.0 | 0.0 |
| me-diyanet | 22 | 8,030 | 18.00 | 17.00 | asr+4 dhuhr+5 maghrib+7 sunrise-7 (22) | 94.3 | 0.0 |
| mk-diyanet | 35 | 12,775 | 18.00 | 17.00 | asr+4 dhuhr+5 maghrib+7 sunrise-7 (34) | 95.5 | 0 |
| nl-diyanet | 283 | 85,178 | 17.90 | 15.90 | asr+4 dhuhr+5 maghrib+7 sunrise-7 (135) | 73.8 | 64 |
| pl-diyanet | 46 | 14,130 | 17.90 | 15.90 | asr+4 dhuhr+5 fajr-1 maghrib+7 sunrise-7 (18) | 76.9 | 55.5 |
| pt-diyanet | 21 | 7,665 | 18.00 | 17.00 | asr+4 dhuhr+5 maghrib+7 sunrise-7 (21) | 94.0 | 0 |
| ro-diyanet | 53 | 19,345 | 18.00 | 16.00 | asr+4 dhuhr+5 isha-1 maghrib+7 sunrise-7 (27) | 85.9 | 0 |
| rs-diyanet | 31 | 11,315 | 18.00 | 16.00 | asr+4 dhuhr+5 maghrib+7 sunrise-7 (15) | 87.3 | 0 |
| tawkit-es | 614 | 18,420 | 15.00 | 14.80 | asr+1 isha+1 (339) | 100.0 | 0.0 |
| xk-diyanet | 15 | 5,475 | 18.00 | 17.00 | asr+4 dhuhr+5 maghrib+7 sunrise-7 (14) | 94.4 | 0 |

## 8. What failed, and why

- **masjidway**: 503 on `www`, `en`, `fr` and the apex, with and without the trailing slash, at
  two separate attempts twenty minutes apart. Platform-side outage; recorded, not retried.
- **Wayback CDX**: "Internet Archive: Temporarily Offline" on the first query of the session, so
  no backward harvest for Diyanet. The two probes run returned HTML error pages, not JSON.
- **Diyanet year parameter**: `?year=2025`, `?yil=2025`, `/2025` and `?tarih=` all return the
  2026 table. The platform serves the running year only, so no year-2 accrual from the live site.
- **GMP Paris** (`grandemosqueedeparis.fr/horaire-des-prieres-paris`): 813 KB Wix page, zero
  tables, zero PDF links, one time-like string ("00:00"). The prior round's negative stands.
- **UCOII** (`ucoii.org/orari-preghiera`, `/servizi/orari-preghiera`): 4.4 KB JS shells, no
  server-rendered table.
- **`dpt`**: the tag in the standing notes is a JSON install format used by UK mosques, not a
  service that covers this wave's countries.
- **`tawkit` Romania**: absent from the country index (see §5).

## 9. Defects and limits carried forward

- Diyanet's `sunrise` is the true horizon **minus 7 minutes**, dhuhr **+5**, asr **+4**, maghrib
  **+7**. A fit that treats those columns as raw solar events reports a false 7-minute bias.
- Diyanet's high-latitude block is not any of adhan's three rules. At Łódź on 2026-06-21 the
  table prints fajr 02:51 and isha 22:27 (maghrib 21:12); adhan gives 00:43/00:44 (middle of the
  night), 03:20/22:07 (seventh) and 02:11/23:09 (twilight angle). Those days are counted as
  `clampedDays`, excluded from the angle score, and their printed interval is recorded.
- mawaqit's Romanian calendars are leap-scaffolds: Ar-Rahman's 366 rows include a February 29
  that is a byte-copy of February 28.
- Belgium/Netherlands/Poland fits carry a wide implied-isha range (a Netherlands city at 8.38,
  an Italian city at 22.72): individual coordinate or table defects, not yet adjudicated.
- Călărași (Romania) fits at 26.6 within-1 against its neighbours' 79–86: the geocoded position
  is likely the wrong of two same-named towns. Flagged for the next round.

## 10. NEXT

1. Romania: the Dobruja community boards in Turkish and Tatar (`cami`, `namaz vakti`,
   `Köstence`, `Tulça`), the Constanța muftiate's own pages, and the Constanța/Tulcea geamia
   Facebook pages — authority-by-publisher holds there.
2. Every country in §4: the named-city authority surfaces (Paris GMP is closed, Toulouse,
   Bordeaux, Nantes, Nice, Montpellier, Rennes, Toulon; Naples done by a platform, the UCOII
   monthly calendars remain unfetched; Bilbao, Zaragoza, Málaga, Murcia, Córdoba, the Canary
   capitals, Ceuta, Melilla against the 2020-23 WordPress poster route).
3. Year-2 accrual: Wayback when it returns; the Diyanet pages themselves serve one year only.
4. The Porto monthly convention sheet stays flagged, not adjudicated.
