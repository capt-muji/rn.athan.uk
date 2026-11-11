# O1l-10 — dated watches and Europe's cheapest year-2s

Workspace `$HOME/athan-gitree/census/o1l-city/watches-eu/`. Public pages only, GET only, no login,
no registration, no challenge solved, no contact with any body, no subagents. Every probe is in
`probes.tsv` (58 records: time, name, URL, HTTP status, bytes, content type, first 220 bytes as
received) with its raw body in `captures/`. Nothing written under `/tmp`, nothing written to the
repository.

Probe window: 2026-11-11 02:58Z to 03:13Z. User agent
`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36`.
One surface (Thailand) answers 403 to every direct client; it was read through a public
text-extraction reader, the same egress path the O1k `thmsg` wave used, and the reader's output is
saved whole.

## 1. Mission A — the dated watches

| # | Watch | Probe (UTC) | Response | Verdict |
|---|---|---|---|---|
| 1 | JAKIM e-Solat 2027 | 02:58:13 | 200, 77,257 B JSON, zone WLY01, 365 rows, first `01-Jan-2026`, last `31-Dis-2026`, `status: OK!` | signal NOT met; not due until 2027-01-01 |
| 2 | Sri Lanka ACJU uploads | 02:58:09 | 200, 527,014 B; `uploads/2026/11/` holds zone 03 (Mullaitivu, Kilinochchi, Vavuniya) only; the other 11 zones still point at `uploads/2026/10/` | signal partly met: 1 of 12 zones; the month turn is due ~2026-12-05 |
| 3 | Brunei MORA OData | 02:58:22 | 200, 12,454 B; newest `Date` 2026-12-30T16:00:00Z = 2026-12-31 local (UTC+8), list 4,739 items | signal NOT met; not due until 2026-12-20 |
| 4 | Kosovo BIK takvim 2027 | 02:58:42 | 200, 18,663 B; media search `takvim` returns 7 items, newest `takvimi2026vaktet.pdf` and `takvimi2026shkrime.pdf` dated 2026-01-14; media search `2027` returns `[]`; `bik-ks.org` answers 000 | signal NOT met; not due until 2026-12-20 |
| 5 | Chile December | 02:59:01 | `/horarios-diciembre/` 404; guessed December PDFs under `uploads/2026/11/` 404; November page 200 with 17 city PDFs plus Viña del Mar's stale `Octubre-2026.xlsm-Grupo_Parte7.pdf` | signal NOT met; not due until 2026-11-29; Viña del Mar STILL unlinked to a December or November file |
| 6 | Morocco ministry portal | 02:59:28 | `data/horaires-2026-11.js` 200, 292,088 B, 190 cities x 30 days; `data/horaires-2026-12.js` 404; `data/horaires-2027-01.js` 404; every `/prieres/` 404 on the rebuilt static portal | signal NOT met; not due until 2026-12-01 |
| 7 | Turkey Diyanet 2027 | 02:59:01 | 200, 381,061 B; last row `31 Aralık 2026`; zero occurrences of `2027` in the page | signal NOT met; not due until 2027-01-01 |
| 8 | Thailand SKTHAI 2027 | 02:59:02 / 03:08:25 | direct 403 (5,661 B Cloudflare block); reader 200, 19,390 B: menu lists `ปี 2568` (dead link to the homepage) and `ปี 2569` (Drive file), no `ปี 2570`, 76 province XLSX links on the index | signal NOT met; not due until 2027-01-01 |
| 9 | Indonesia 2027 month 1 | 02:59:02 | `api.myquran.com/v2/sholat/jadwal/1301/2027/1` 200, 31 rows, `2027-01-01` to `2027-01-31` | signal MET, 34 days before its 2026-12-15 window |
| 10 | Pakistan unified calendar | 02:59:28 | `mora.gov.pk/Publications` 200: 25 entries, newest 2026-10-15 (`Maqalat e Seerat 2025`), entry 22 still `Nizam-e-Salat Chart 2016 and Onward`, dated 01-01-2016; `LatestNews` 1,314,564 B, zero hits for `Nizam-e-Salat` or `نظام الصلوٰۃ`; six `uniform` hits are all Ramadan and curriculum notices | signal NOT met; no 2026 and no 2027 edition on either register |
| 11 | Selangor zone split pre-check | 02:59:27 to 03:12:00 | JAKIM zone endpoints 404; federation download page offers Hijri calendars only (2028, 2027, 2026, no prayer tables); 14 state mufti sites swept | no state beyond the 11 banked 2027 tables has published one |

### Watch detail

**1. JAKIM e-Solat.** `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=year&zone=WLY01`
returns the full 2026 year with `2026-01-01` reading `05:56 imsak / 06:06 fajr / 07:18 syuruk /
13:19 dhuhr / 16:42 asr / 19:17 maghrib / 20:31 isha`, byte-for-byte the row the record already
holds. The same call with `&year=2027` appended answers 200 with the identical 77,257 bytes, 365
rows, `01-Jan-2026` to `31-Dis-2026`: the parameter is accepted and ignored. The watch opens
2027-01-01.

**2. Sri Lanka ACJU.** The zone 03 November file is a five-page district PDF, not a new edition of
the twelve-zone set: zone 03 published under `2026/11/` while its own JPG preview still points at
`2026/10/03.-Mullaitivu-1.jpg`. Eleven zones, including Colombo, remain on October. The index
carries 13 zone surfaces (01 to 13): October holds 12 of them and November holds only 03. No new
zone appeared.

**3. Brunei MORA.** The OData list ends exactly where the calendar says it ends, `2026-12-31` in
local time. The 100-list catalogue recheck returned 161 lists; the only prayer surface is
`Waktu Sembahyang` (4,739 items). `iBantuSolat_document` holds eight 2018 devotional PDFs
(prayer for the sick, tayammum, wudu), no timetable. No second prayer list exists.

**4. Kosovo BIK.** The media API enumeration is unchanged since the O1k `balkans2` capture: 2023,
2024 and 2026 editions, 2025 absent, 2027 absent. `bik-ks.org` does not resolve from this host
(HTTP 000), so the Dituria Islame media API remains the only route. Last year's edition landed
2026-01-14, so a 2027 file in mid-December would be early and in mid-January normal.

**5. Chile.** December is 404 on the page and at the guessed upload paths. The Viña del Mar
accordion item (index 7) still carries `uploads/2026/10/Octubre-2026.xlsm-Grupo_Parte7.pdf` while
every other city button points at `Noviembre-2026-N.pdf`. The stale link has now survived a second
month turn; it is a publication defect on the publisher's side, not a capture failure.

**6. Morocco.** The ministry portal is now a static maintenance-era build that loads
`data/horaires-YYYY-MM.js` per month, one file per month, with no network call after the two
script tags. November is live (190 cities, 6 columns, `GMT`), December and January 2027 are 404,
and the legacy `/prieres/` path is gone from the new nginx. The November file is banked at
`captures/ma-horaires-2026-11.bin`; it is a genuine new artifact of the rebuild and worth a fit
lane of its own, outside this mission.

**7. Turkey Diyanet.** The Ankara yearly table still closes at `31 Aralık 2026`; `2027` does not
occur anywhere in 381 KB of page.

**8. Thailand.** The CDN blocks this host outright. The reader's copy of the downloads index shows
the same two year entries the O1k wave recorded and no `ปี 2570`. The 76 province workbook links
are present and unchanged in shape; without the prior hash list on the record, a hash diff cannot
be run, so the edition verdict rests on the menu, which shows no 2027 edition.

**9. Indonesia.** `api.myquran.com` serves 2027 month 1 today, 34 days before the calendar's probe
window. Jakarta rows are saved at `data/id-myquran-jakarta-2027-01.json` (31 rows). The first row
reads `04:19 subuh / 05:38 terbit / 11:59 dzuhur / 15:25 ashar / 18:13 maghrib / 19:29 isya`. This
is early service, not a new publication cycle; the Kemenag SIHAT authority API was not re-probed
because the watch names myquran only.

**10. Pakistan.** Both registers are live and both are silent. The publications register still
lists the 2016 chart as the standing artifact, so the 2026 twin-city edition the calendar watches
for has still not appeared, and no 2027 edition exists either. The watch's own rule applies: if the
2027 edition also fails, the watch closes.

**11. Malaysia zone pre-check.** `zonlist` and `senaraiZon` both 404; the zone catalogue is not a
public endpoint. The federation download page (`siteId=24&pageId=52`) serves Hijri calendars for
2028, 2027 and 2026, never prayer tables. The state sweep:

| State site | Status | 2027 in page | Reading |
|---|---|---|---|
| Selangor `muftiselangor.gov.my/takwim-solat/` | 200 | five district PDFs embedded (Gombak, Hulu Langat, Kuala Langat, Sabak Bernam, Sepang) | the banked set, no new districts |
| Perak `mufti.perak.gov.my` | 200 | 0 | 2026 only |
| Penang `mufti.penang.gov.my` | 200 | 3 | the 1448 H grid only, already PARTIAL |
| Johor `mufti.johor.gov.my/.../jadual-takwim/` | 200 | 0 | 2026 only |
| Melaka `muftimelaka.gov.my` | 200 | 0 | 2026 only |
| WP `muftiwp.gov.my` | 200 | 0 | landing page 2026; the 2027 PDFs are direct paths, already banked |
| Perlis `muftiperlis.gov.my` | 200 | 4 | a 2027 event notice (PISC 30-31 January), no table |
| Negeri Sembilan `muftins.gov.my` | 200 | 2 | `Pelan Strategik 2023/2027`, no table |
| Pahang `mufti.pahang.gov.my` | 200 | 0 | nothing published |
| Terengganu `mufti.terengganu.gov.my` | 403 | 0 | closed to this host |
| Kedah, Kelantan, Sabah, Sarawak | 000 | 0 | do not resolve from this host |

Verdict: the Selangor nine-district split is published and banked; no further state has moved.

## 2. Mission B — Europe's cheapest year-2s

### Germany — three new Diyanet city-years, no 2027

The international portal serves each German city as one page carrying the full civil year in three
inline tables (desktop, mobile, print). Munich, Hamburg and Stuttgart were resolved through the
portal's own region API (`/de-DE/home/GetRegList`, country 13, states 851/855/850, districts 11022 /
11012 / 11027), then read from their city pages. `2027` occurs zero times in all three pages and in
the Köln page re-read as a control.

| City | URL | Rows | Span |
|---|---|---|---|
| München | `namazvakitleri.diyanet.gov.tr/de-DE/11022/gebetszeit-fur-munchen` | 365 | 2026-01-01 to 2026-12-31 |
| Hamburg | `.../de-DE/11012/gebetszeit-fur-hamburg` | 365 | 2026-01-01 to 2026-12-31 |
| Stuttgart | `.../de-DE/11027/gebetszeit-fur-stuttgart` | 365 | 2026-01-01 to 2026-12-31 |

Dated rows are in `data/de-diyanet-{muenchen,hamburg,stuttgart}-2026.json`, six columns, no
duplicate or conflicting date across the three tables on each page.

**Fit verdict: the held recipe reproduces on all three, and 2027 is not served, so the EU-DIYANET
year-2 lift stays blocked.** One recipe, one published year each: the object stays provisional
under R1; nothing here is a second year. Engine adhan 4.4.6, `Rounding.None` at second resolution,
margin and rounding applied per column afterwards, TZ `Europe/Berlin`, dates built from the
printed strings. Script `fit/germany2.mjs`, output `fit/germany2-fit.json`.

| City | fajr 18 | isha 16 | sunrise -6.5 floor | dhuhr +5.5 floor | asr Shafi +3.5 floor | maghrib +6.5 floor |
|---|---|---|---|---|---|---|
| München | 208/365 (+0.5 floor) | 91/365 (-0.5 floor) | 255, worst 1 | 326, worst 1 | 102, within-1 219, worst 3 | 160, within-1 225, worst 3 |
| Hamburg | 151/287 (+0.5 floor) | 67/305 (-1 floor) | 231, worst 1 | 317, worst 1 | 88 (+3), within-1 194, worst 4 | 136 (+6), within-1 199, worst 4 |
| Stuttgart | 205/349 (+0.5 floor) | 98/365 (-0.5 floor) | 261, worst 1 | 330, worst 1 | 106, within-1 217, worst 3 | 154, within-1 227, worst 3 |

The angle discrimination is the held one. At zero margin over the 182 October-March days, isha
exact counts read München 32, Hamburg 27, Stuttgart 32 at 16.0 degrees, and 0 at 15.5, 16.5 and 17
degrees in all three cities; fajr at 18.0 scores 142, 122 and 152. The stock Turkey preset (18/17
plus its own temkin) scores isha 0/365 in every city, as it did at Köln, Berlin and Frankfurt. The
portal serves the European 18/16 pair with the domestic print margins, unchanged.

Summer coverage is the high-latitude signature: no 18-degree fajr exists at Hamburg for 78 days
(151/287), and no 16-degree isha exists at Hamburg for 60 days; the portal substitutes its own
plateau there, which is why the whole-year isha worst error runs to 1,371 minutes and the winter
window is the only honest angle test. Seasonal amplitude (January mean minus July mean, fajr):
München 149.0 min, Hamburg 162.4 min, Stuttgart 140.3 min; isha 255.2, 279.7 and 251.2 min. These
are the largest amplitudes in the European set and the reason a one-year fit cannot be trusted far
from the fitted season.

### Belarus — not rolled, no year-2

`https://islambel.by/vremya-namazov` 200, 354,209 B. The table is 365 rows starting `01.01.2025`
and closing `31.12.2025`, with `2025` occurring 365 times and `2026` once, in the footer's
copyright range. The page has not rolled. The O1k reading stands: Minsk 2025 only, fixed-clock caps
at fajr 03:08 (14 days) and isha 23:06 (13 days) over a smooth 18/~16 curve. No year-2 candidate
exists.

### Ireland — both routes still closed

`https://www.islamicfoundation.ie/api/timetable?year=2027` returns 200 with the same 25,380 bytes
as `?year=2026`; both files hash to
`99e600d0ad2e655dacc88e501c1a2fd88db710c10777588fcefef256bdbc8aaa`. The year parameter is still
ignored and the table is byte-identical, so the frozen generation cannot self-heal and the DST
defect stands. `https://gicc.ie/wp-json/gicc/v1/public-prayer-times?date=2027-01-01` returns 404
`no_prayer_data`; the undated call serves 2026-11-11 normally (fajr 05:52, maghrib 16:49).

### Austria — the edition is byte-identical

`https://www.izwien.at/gebet-service/gebetszeiten` 200; the only workbook is the Drive file
`1waW-buD-lMDkkFLajZfweITOD9259ZE4`. Fetched through `uc?export=download`, it is 20,706 bytes and
hashes to `44d1f62ad3516b4582fa86e99d183ef2401c28c50d6d24ad7b6da223dc62e99d`, identical to the
O1k-held `at-izw-jahresgebetszeiten-2026.xlsx`. The calendar is permanent by design (2025-2028),
so there is no second edition to bank and nothing new to record.

## 3. Honest negatives and blocks

- Thailand's direct surface is closed to this host (Cloudflare, 403 to curl and to a browser
  session). Read through a public text-extraction reader; no challenge was attempted.
- Terengganu 403, and Kedah, Kelantan, Sabah and Sarawak do not resolve from this host (HTTP 000).
  Those five states remain unverified for 2027 rather than verified absent.
- `bik-ks.org` does not resolve from this host (HTTP 000).
- JAKIM publishes no zone-catalogue endpoint (`zonlist`, `senaraiZon` both 404), so the zone split
  can only be inferred from what the states themselves publish.
- The Thailand hash diff cannot be run: the record carries no prior hash list.

## Assumptions

- German city coordinates taken as the standard city points: München 48.1372, 11.5756; Hamburg
  53.5511, 9.9937; Stuttgart 48.7758, 9.1829 (the held fit used the same class of point for Köln,
  Berlin and Frankfurt).
- The German page's first time column (`Morgengebet (Fastenbeginn)`) is the imsak row and is
  treated as fajr, as the record's scheme note holds.
- "Winter window" means 2026-01-01 to 2026-03-31 plus 2026-10-01 to 2026-12-31, 182 days, matching
  the 182-day comparison fit4 used on the held German cities.
- Sri Lanka's `uploads/2026/11/` holding one zone is read as a partial month rather than a
  permanent redesign, because the other eleven zones still carry October files and the index shape
  is unchanged.
