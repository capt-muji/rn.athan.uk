# REPORT.md - O1n-58 mosque-database sweep (the global mosque register)

Wave: O1n-58, round four (o1n), session four, dispatched 2026-11-12. Mission: build the
global register of mosques with coordinates - OSM per country, GitHub datasets, national
registers - and cross-reference against the census store to produce every country's
uncovered-mosque worklist. All timestamps UTC. Raw captures under captures/, data under
data/ (osm/, github/, worklist/), nothing enters git.

## CLOSE SECTION (coordinator stop order, 2026-11-12T18:31Z)

The owner closed the session; STOP-ORDER.md received and obeyed. The sweeper process was
stopped mid-run (pid killed; the current Overpass query in flight was abandoned - no
partial file written, journal carries only completed countries). State at stop:

### Front 1 - OSM Overpass sweep (BANKED 9 of 257, all of P0)

`scripts/osm_sweep.py` ran journal-driven, one query in flight, per-country queries
(`area["ISO3166-1"=..]` with name fallback), honoring 429/504 with backoff and one retry.
9 countries banked complete before the stop, 153,273 mosques total:

| country | mosques | banned-name rows dropped | route |
|---|---|---|---|
| united-kingdom | 1,434 | 1 | iso |
| united-states | 1,304 | 0 | iso |
| india | 9,513 | 0 | iso |
| pakistan | 8,745 | 0 | iso |
| indonesia | 79,130 | 0 | iso |
| ng (Nigeria) | 705 | 0 | iso |
| eg (Egypt) | 2,506 | 0 | iso |
| turkiye | 48,145 | 0 | iso |
| germany | 1,791 | 0 | iso |

One row dropped worldwide for carrying the excluded entity's name (UK query; dropped
before write, counted per the standing orders). The exclusion resolves at runtime in
`scripts/countries.py` (EXC_STRINGS/EXC_ISO, character-built) and is never written
literally anywhere. Taiwan never queried (out of scope). Country index: 257 countries
built (`data/countries.json`: P0 ten, P1 246 census-held = tree 180 + ledger ISOs, P2 the
rest), from one global Overpass index query (captures/overpass-country-index.json.gz).

### Front 2 - GitHub datasets (BANKED, partial)

6 TinyFish searches + 6 GitHub REST searches banked (captures/github-search-*.json);
75 unique repos catalogued (data/github/repos.json), licences recorded for 10
(data/github/licences.json: ruqqq GPL-3.0, ummahbuild/mosqueAPI MIT,
pakmultilinks-dot/masjid-finder MIT, kosratdev/MyPrayersData MIT, others none declared).
Files banked under 400 KB each (data/github/, manifest.json carries URL + UTC + size):

- mnMasjidLoc.json.gz - Masjid Nusantara (Indonesia) mosque locations, 114 KB
- sg-masjid.json.gz - Singapore mosque dataset, 47 KB
- sg-citydata.json.gz - Singapore city data, 386 KB
- adzan-indonesia.txt.gz / adzan-america.txt.gz / adzan-egypt.txt.gz - Indonesian city
  coordinate tables + US/EG stubs (cahyadsn/adzan)
- prayer-times-json/ - 275 city files, official tables for Libya (Ministry of Awqaf),
  Saudi Arabia, Jordan (azzubairx/prayer-times-json)
- prayertimes-database/ - 548 zone files + metadata: Brunei 42, Indonesia 27, Singapore
  209 zones (ruqqq; Malaysia zones are ~1.9 MB each and were skipped over the 400 KB cap)

Skipped/negative: SySyAli/mosqueswebscraping carries no data file (scrape code only);
MyPrayersData tree yielded no sub-400 KB data file in the formats probed; ummahbuild/
mosqueAPI has no seed dataset in-tree.

### Front 3 - national registers (OPEN, not started)

Leads captured only: Hartford Institute US mosque database
(hirr.hartfordinternational.edu/research/mosque-database/), Jordan open-data Islamic
centers dataset (opendata.gov.jo). No register page fetched.

### Front 4 - cross-reference (OPEN, not started)

Store surveyed, join designed, not run: store = o1n-3-turktakvim/data/tt/<country>/
(per-table `city`, 181 countries, 112,854 settlements), coordinates only for 2,690
settlements in data/ap-points-all.json (`<country>/<slug>` -> lat/lon/tz), fit index
round 6 = 196 entries keyed ISO-2 (o1n-46-fitindex6/FIT-INDEX-ROUND6.json). Planned join:
name-normalised + 2 km coordinate rule -> per-country worklist (mosques_total, covered,
uncovered + sample).

### Resumption point for the successor

1. `python3 scripts/osm_sweep.py` is fully resumable: data/osm/journal.json marks 9
   countries done; next query is P0 France (FR), then P1 alphabetical from afghanistan,
   then P2. 13 no-ISO slugs (canary-islands, kosovo, northern-cyprus, johnston-atoll,
   palmyra-atoll, wake-island, saint-helena) query by OSM area name (OSM_NAME map).
   Big P1 countries to expect: my/bd/ir/id-scale neighbours, ru, dz, iq.
2. After the sweep: run the cross-reference (scripts/xref.py to be written per the join
   above), banking data/worklist/<country>.json.
3. Then registers (top 20 Muslim-population countries) and the remaining GitHub haul
   (ruqqq Malaysia zones over the cap if the successor's orders allow larger files).
4. Workspace size at stop: ~13 MB data + captures. Nothing under /tmp, nothing in the
   repository. The banned word never appears in any file; drops are counted in journal
   and data files as `dropped_banned`.

## OSM

Covered in the close section above (the sweep never got past P0); the per-country
narrative would have accumulated here.

## GitHub

Covered in the close section above.

## Registers

Not started; leads in the close section.

## Cross-reference

Not started at the previous stop; executed this session (see the continuation below).

## CONTINUATION - session five, round four (O1n-58-db, 2026-11-12)

Dispatch: resume the OSM enumeration (next P0 France, then P1 alphabetical, then P2),
write and run the cross-reference per the close section's join design, then registers
and the permitted GitHub haul. The previous stop order is void for this session.

### Cross-reference (scripts/xref.py, WRITTEN AND RUN)

The join per the close section's design, journal-driven (every country the OSM journal
marks done is processed each run, so reruns pick up newly banked countries):

- Store side: `o1n-3-turktakvim/data/tt/<country>/<id>-<slug>.json` settlement names
  (the excluded territory's tt dir is skipped at runtime), coordinates from the same
  tree's `ap-points-all.json` (`<country>/<slug>` -> lat/lon), fit-index round 6
  context counted per ISO-2 (`o1n-46-fitindex6/FIT-INDEX-ROUND6.json`).
- Coverage rules, strongest first: mosque `addr:city` normalised equals a settlement
  name/slug (city_tag); mosque within 2 km of a settlement coordinate (coords2km,
  3x3 grid index); mosque name/name:en normalised equals a settlement name
  (name_exact); a settlement word (>=5 chars) appears whole in the mosque name
  (name_contains).
- Banked: `data/worklist/<slug>.json` per country - mosques_total, covered,
  uncovered, covered_by rule breakdown, settlements totals, fit_index_entries,
  reconciliation block, uncovered sample (50 rows with name, coordinates, osm id).

First run (9 banked countries): mosques 153,273 total, covered 31,702, uncovered
121,571; reconciliation mosques_total == journal n for every country, 0 mismatches.
Per country:

| country | mosques | covered | uncovered | store settlements | note |
|---|---|---|---|---|---|
| united-kingdom | 1,434 | 746 | 688 | 1,158 | |
| united-states | 1,304 | 966 | 338 | 7,881 | |
| india | 9,513 | 767 | 8,746 | 2,514 | |
| pakistan | 8,745 | 704 | 8,041 | 368 | |
| indonesia | 79,130 | 6,244 | 72,886 | 569 | |
| ng (Nigeria) | 705 | 0 | 705 | 0 | no tt store coverage yet |
| eg (Egypt) | 2,506 | 0 | 2,506 | 0 | no tt store coverage yet |
| turkiye | 48,145 | 21,081 | 27,064 | 43,684 | |
| germany | 1,791 | 1,194 | 597 | 5,522 | |

The tt store holds 181 countries; 177 dirs matched countries.json slugs (the excluded territory's
tt dir exists store-side but is never joined: the exclusion resolves at runtime in
xref.py exactly as in countries.py, never written literally). Nigeria and Egypt
carry no tt store dir, so their OSM mosques read as fully uncovered fronts.

### GitHub haul (PERMITTED LARGE FILES, DONE)

The ruqqq/prayertimes-database Malaysia zone files (the close section skipped them
over the citable-layer 400 KB convention; this session's orders bank them in the
wave workspace, which has no cap): all 66 `data/MY/*.json` zone files fetched from
raw.githubusercontent.com, gzipped to `data/github/prayertimes-database/my/`
(4.6 MB banked), each appended to `data/github/manifest.json` (repo, path, file,
size, url, fetched_utc). Rows carrying the excluded entity's name are dropped
before write and counted: the live scan found 0 in the haul. Raw JSON mirrors kept
at `captures/my-raw/` (never enter git).

### Registers (banked this session)

- US: Hartford Institute mosque database - per-state directory walked by GET
  pagination (`?sf_paged=N`), 86 page captures, `data/registers/us-hartford.json`,
  912 mosques (name + website fields as published).
- UK: MuslimsInBritain.org - the directory's full CSV export found and banked
  (`captures/registers/uk-muslimsinbritain-MosquesNov26.csv.gz`,
  `data/registers/uk-muslimsinbritain.json`), 2,191 mosques, all geocoded.
- Jordan: opendata.gov.jo refused direct TCP and the dataset/API paths fail through
  the proxy too (portal root loads through TinyFish only). NEGATIVE recorded; the
  Islamic-centers dataset and the mosque-count dataset remain open items.
- Egypt: awkafonline.gov.eg serves a Cloudflare challenge. NEGATIVE recorded
  (never solved, per the standing orders).
- Kuwait: eservices.awqaf.gov.kw mosque search sits behind a captcha. NEGATIVE
  recorded, route skipped.
- Oman: opendata.gov.om national mosque open-dataset (Ministry of Awqaf and
  Religious Affairs; names, types, geographic locations) - dataset page banked
  (`captures/registers/om-opendata-mosques.html` via TinyFish; the download link is
  built by the JS portal and the direct ArcGIS-style API 404s). OPEN: a successor
  with agent-browser can click the XLSX out of the portal.
- Leads captured, bulk lists not publicly served: Indonesia SIMAS (Kemenag,
  simas.kemenag.go.id, 500k+ mosques+mushalla registered; captures banked),
  Malaysia JAKIM SISMIM (masjid.islam.gov.my/maklumatMasjidSurau), Turkey
  camiler.org (independent guide derived from the Diyanet mosque list, 90k+ mosques
  across 81 provinces, Nuxt app), Germany IGMG Moscheeliste (print list, order page)
  and islam.de Moscheeadressen (city search form).

### OSM sweep (this session)

- First relaunch cycled 502/504 across all three Overpass instances on the France
  query (attempt 1 all three failed, attempt 2 in flight) and was killed cleanly at
  kill-time (SIGTERM; France had no journal entry and no partial file, so the journal
  stayed clean). Relaunch detached (nohup, survives this session's end) from the
  same journal: one Overpass query in flight, France first, then P1 alphabetical.
- Journal growth this session at REPORT time: 0 new countries banked (France still
  in flight; Overpass instances unhealthy for France-scale queries). The sweep is
  journal-driven: whatever banks after this REPORT lands in
  `data/osm/journal.json` and is picked up by the next `scripts/xref.py` run.

### Resumption point (updated)

1. `python3 scripts/osm_sweep.py` (detached, pid may differ; relaunch if gone) -
   journal-driven, France is the next query; PENDING countries are retried on rerun.
2. `python3 scripts/xref.py` after any sweep progress - journal-driven, regenerates
   every done country's worklist with reconciliation; 9 worklists stand now.
3. Registers: Oman XLSX out of the JS portal (agent-browser); Jordan retry;
   SIMAS/SISMIM/camiler.org bulk walks if the owner orders a deeper register round.
4. The banned word never appears in any file (drops counted as dropped_banned,
   counter live in both scripts). Nothing under /tmp, nothing in the repository.

## CONTINUATION - session six, round four (O1n-58-db registers continuation, 2026-11-12)

Dispatch: monitor the detached sweep, bank the Oman XLSX out of the JS portal,
retry Jordan once per route, then the bulk register walks (Turkey camiler.org,
Indonesia SIMAS, Malaysia JAKIM SISMIM, Germany IGMG/islam.de) per THE MOSQUE
DATABASE RECORD. All counts below measured on disk at return (~20:35Z).

### Front 1 - detached OSM sweep (monitoring; 8 new countries into the journal)

The nohup sweep from session five lived and grinds: the journal grew from 9 to
19 done countries this session. France completed at 19:49:43Z (1,166 mosques),
then P1 alphabetical: afghanistan 3,732, albania 670, american-samoa 0, andorra 0,
anguilla 0, antigua-and-barbuda 0, ao (Angola) 4, armenia 3, aruba 2. Overpass
stayed flaky (502/504 cycles across all three instances with backoff; pace
roughly one country per 1-9 minutes against the alphabetical list).
`scripts/xref.py` reruns banked worklists for every new completion; 19 worklists
stand at return, reconciliation 0 mismatches every run. XREF at return: mosques
158,850 total, covered 32,180, uncovered 126,670 (was 153,273 / 121,571 at
dispatch).

### Front 2 - the Oman XLSX (BANKED: 18,214 mosques, the named successor route done)

opendata.gov.om driven with agent-browser (session o1n-58-db): portal search
`/en/datasets?term=mosque` -> dataset "Masajid Data in Oman" (id
98da92a8-6b3e-4f55-a92d-1d6c501f3206, Ministry of Awqaf and Religious Affairs,
created 18/03/2026, 2 XLSX files) -> both files clicked out of the JS portal and
banked (`captures/registers/om-masajid-geo-20261112T195421Z.xlsx` 1.33 MB,
`om-masajid-gov-...xlsx` 15 KB). Parsed with openpyxl (workspace venv `.venv`):

- `data/registers/oman.json` - 18,214 mosque rows (MosqueNumber, name, type,
  governorate, wilayat, village, lon, lat), 18,211 geocoded, 0 with-websites
  (the register publishes no website column - honest absence recorded per row
  shape), dropped_banned 0, 487 covered by the 2 km rule against the store's 10
  geocoded Oman settlements (229 tt settlements, names English-transliterated,
  so Arabic-name joins are honestly not attempted; covered=false reads "not
  within 2 km of a geocoded store settlement").
- The portal's second file is aggregate counts by type (jami 1,952 + masjid
  14,338 + musalla 752 + Eid musalla 929 = 19,971) which exceeds the geo file's
  18,214 rows; the publication gap is recorded in the register notes, not
  reconciled.

### Front 3 - Jordan retry (NEGATIVE, one attempt per route, recorded)

- Route A, direct GET: `curl https://opendata.gov.jo/` -> TCP connect refused
  (curl error 7, 141 ms) at 19:55:50Z.
- Route B, via the Islamic-centers dataset lead through TinyFish: dataset URL
  `target_unreachable` 19:56Z, portal root `proxy_error` 19:57Z.
- The negative stands: the portal is unreachable by both routes from this host
  this session. Open item unchanged.

### Front 4 - bulk register walks

**Turkey camiler.org (BANKED: 7,376 mosques, 7,374 geocoded).** The public
sitemap (robots.txt-declared, `captures/registers/tr-camiler-sitemap-{1,2}.xml`)
inventories 7,508 detail pages: 7,376 mosque pages under `<province>/<district>/
<slug>` plus 132 blog pages (excluded). `scripts/tr_camiler_walk.py` fetched all
7,508 pages (4 polite workers, 0.3 s delay, ~35 min, 0 failures, gzipped under
`captures/registers/tr-camiler-mosques/<prov>/<dist>/`); each page SSRs the
mosque payload (name, address, type, lat, lon). `scripts/tr_camiler_parse.py`
built `data/registers/turkey-camiler.json`: 7,376 mosques, 7,374 geocoded, 0
websites (no website field published), dropped_banned 0, 6,850 store-covered
(settlement-name rule). The site claims 90,000+ mosques across 81 provinces; the
sitemap mass is the Diyanet-derived directory's published inventory and the
district listings render their remainder client-side over a robots-Disallowed
`/api/`, which was never queried. The gap is recorded, not reconciled.

**Indonesia SIMAS (PARTIAL: aggregate layer complete, mosque-level honestly
out of budget).** `simas.kemenag.go.id` publishes no bulk export ("Unduh Data"
is forms/documents). Banked `data/registers/indonesia-simas-stats.json`:
national 319,652 masjid + 395,579 mushalla = 715,231 across 38 provinces;
per-province counts for all 38 (curl-SSR pages, captures banked; sums match the
national figures to within 1 unit - a publication gap recorded in the notes)
and per-kabupaten/kota counts for 356 kabupaten (all 6 verified against the
rendered page for the sampled province). The mosque-level directory
(`/page/profilmasjid`) paginates ~18 rows per filtered view (~40,000 fetches
for the full 715k) - documented as the resumption route, not walked this
session. Coordinate-bearing Indonesia coverage remains the banked MNMasjidLoc
GitHub dataset.

**Malaysia JAKIM SISMIM (PARTIAL: blocked route recorded at ~47/2,580 pages).**
`masjid.islam.gov.my/maklumatMasjidSurau` paginates 10 rows/page, site total
25,793 entries across 2,580 pages (detail pages carry name, address, state,
JAKIM code, phone, history - no coordinates anywhere). The walker banked 47
pages (470 unique rows) before the server started answering HTTP 403 to every
request from this IP (~20:23Z; verified through curl with browser UA and a real
agent-browser session - rate protection, not auth). Walk stopped per the
standing orders; `data/registers/malaysia-sismim.json` banked the 470 rows with
the block recorded in the notes. Resumption needs different egress or a later
window; ~2,533 pages remain.

**Germany IGMG (BANKED: 559 mosques, all geocoded) and islam.de (recorded).**
The IGMG /moscheen/ page is a JS proximity search, but its plugin exposes a
public REST list: `GET /wp-json/igmg-moscheen/v1/list` -> 559 items with name,
association, type (mosque/hq/regional), street, zip, city, country, lat, lon
(`captures/registers/de-igmg-rest-list.json`). `data/registers/germany-igmg.json`:
559 mosques, 559 geocoded, 0 websites, dropped_banned 0, 266 store-covered.
islam.de Moscheeadressen has no bulk list: only a per-city GET search form
(`3068.php?q=<city>`), sampled once with q=Köln (banked); a nation-wide walk
would need a municipality enumeration and is recorded as an open route, not
attempted.

### Register totals this session

| register | banked | geocoded | with-websites | dropped_banned | store-covered |
|---|---|---|---|---|---|
| oman.json (MARA) | 18,214 | 18,211 | 0 | 0 | 487 |
| turkey-camiler.json | 7,376 | 7,374 | 0 | 0 | 6,850 |
| germany-igmg.json | 559 | 559 | 0 | 0 | 266 |
| malaysia-sismim.json (partial) | 470 | 0 | 0 | 0 | 4 |
| indonesia-simas-stats.json (aggregate) | 715,231 registered | n/a | n/a | 0 | n/a |

### Exclusion audit

Character-built exclusion strings resolve at runtime in countries.py,
xref.py, om_register.py and register_build.py; the literal is written nowhere.
A full scan of every banked JSON and script (data/registers, data/worklist,
scripts) for the Latin, Hebrew and Arabic renderings of the excluded entity's
name: zero hits. Taiwan never queried.

### Resumption point (session six)

1. The detached sweep (`scripts/osm_sweep.py`, pid 28132) is still running,
   journal at 19; rerun `python3 scripts/xref.py` after any progress - it is
   journal-driven and idempotent. P1 alphabetical continues (next pending
   around azerbaijan/bangladesh).
2. Registers next: SISMIM from different egress (470/25,793 rows banked, route
   403-blocked at ~20:23Z); islam.de city enumeration if ordered; the
   Turkey remainder stays behind the robots-Disallowed API (not sanctioned).
3. The Oman type-aggregate vs geo-row publication gap (19,971 vs 18,214) is
   recorded in the register; the owner may want a query to MARA - not sent
   (no contact rule).
4. Workspace: data/ 29 MB + captures/ 214 MB (7,508 Turkey page captures
   dominate), venv at `.venv` (openpyxl only). Nothing under /tmp, nothing in
   the repository, raw captures never enter git.
