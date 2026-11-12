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

Not started; the store survey and join design are in the close section.
