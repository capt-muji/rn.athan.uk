# C32 verdict — platform fitness for v3 community sources

Which mosque platforms can feed v3 directly, which need per-mosque
verification, which are unusable. Companion to `SCHEMA.md` (ingest spec) and
`PROBES.md` (probe evidence). Everything here assumes the census's standing
rules: community platforms are never authority, and captures pass the SCHEMA
verification suite before ingest.

## Tier 1 — direct sources (generic, verifiable, machine-complete)

### masjidal (keyless range API)
The strongest community-platform source the census holds. Keyless, no browser,
**full past years in one request** (731-day span served whole), **athan AND
iqamah history together**, per-mosque identity in `data.masjid_info`. Known
ids recover from any mosque's widget embed. Defects are all parse-side
(locale dates, 12h AM/PM) and all handled in SCHEMA §3.4. Limit: the census
must still run the solar gate per mosque — masjidal serves what the mosque
uploaded or the platform computes, and some mosques sit on platform defaults.

### dpt plugin (WordPress)
`filter=year` is one-request full-year JSON, keyless, on ordinary mosque
websites — the census-gold shape C4 named, confirmed on three more domains.
Caveats are per-install span (365 vs 212 rows observed), ignored month
filter, and per-install data quality. Directly usable as a source family;
each domain needs the span audit (SCHEMA §5.4.1) and solar gate. The
`?rest_route=` shape is also a cheap sweep pattern across the English-speaking
mosque web (C4's technique stands).

## Tier 2 — usable with per-mosque verification only

### mawaqit (page embed)
Machine-complete (12-month grid + iqama calendar + coordinates + today-row,
keyless, plain fetch) but the platform carries the census's worst trap
density: year-less grids, Feb-always-29, 6-vs-7 columns, iqama
offset-vs-absolute, byte-identical defaults, congregation-board dhuhr, lying
timezone fields. Every capture must pass the full SCHEMA §1.4 suite. With
those gates, held captures (C1's 22 fitted full-year tables, C2's six
Djibouti mosques) are already community-grade. Bulk enumeration stays the
owner's parked call.

### masjidbox
Usable: global key (one held key serves every slug), `begin=` walks history
in 7-day hops, ISO-instant rows are self-describing, and the **public page
embeds the whole payload inline keyless**. Per-mosque verification needed:
no coordinates (solar gate needs geocoding), unreliable flags
(`verified`, `showIqamah`), no `.ics` (falsified), and platform defaults
exist here too. Cost profile: 1 request per 7 history days per mosque.

### athanplus (widget)
Usable as a today-poll: athan+iqamah pairs, server-rendered, stable ids.
No history, no range, no API in census holdings — one row per day captured
on the day. Fine for a freshness poll of known mosques, useless for fitting.
UMA Sydney's mosque-hosted whole-year JSON corroborates it but is a separate
artifact family (mosque-hosted, not platform API).

## Tier 3 — bounded / unusable as generic sources

### amanahly
The public endpoint is **single-tenant** (pinned to MIA Liverpool; headers do
not re-key it; no tenant parameter). For v3 it is ONE mosque's feed (with a
good ~4-month iqamah ICS), not a platform source. Other Amanahly mosques are
reachable only by discovering each site's own API paths from its bundle —
a per-site hunt with no generic shape. Not unusable, but not a source family
until a tenant parameter surfaces.

### (out of tier) non-platform shapes met on the way
Georgia SAMUFTO's mosque API: 99-mosque inventory, every `prayerTimes` empty
string, `metadata.lastUpdated` set — an inventory, not a timetable source.
GICC Galway's custom `gicc/v1` namespace: dpt-shaped rows, one domain,
treat as a one-off site API, not a platform.

## Known-artifacts list (what a v3 consumer must carry)

Per-capture artifacts the ingest path needs, all held under `athan-gitree/census/`:

1. **Manifests** — `c22-pacific/manifest.json`, `c20-wafrica2/manifest.json`,
   `c3-weurope/manifest.json`, `c9-oceania/manifest.json`,
   `c5-safrica/MANIFEST.md`, `c8-easia/data/MANIFEST.json`,
   `c1-wafrica/data/MANIFEST-timetables.csv`, `c11-indopak/data/_manifest.json`.
2. **Mawaqit raw config payloads** — `c22-pacific/raw/json-mq-*.json` (full
   config objects), `c1-wafrica/data/mawaqit-*.json` (extracted vars),
   `c2-eafrica/data/djibouti-*.json` (normalized full-year), plus the
   extraction script `c1-wafrica/scrape_mawaqit.py`.
3. **Masjidbox landing payloads** — `c4-na/data/mcc-silver-spring.json`,
   `c7-latam/data/tt-*.json`, `c9-oceania/raw/mb_kuraby.html`,
   `c9-oceania/raw/mb_acm.html`.
4. **Masjidal captures** — `c4-na/api/masdc-nov2026.json`,
   `c4-na/api/isbcc-nov2026.json`, `c24-uk-ie/data/london-central-mosque.json`.
5. **Amanahly** — `c9-oceania/data/mia-liverpool.json`,
   `c9-oceania/raw/mia.js` (route names).
6. **dpt captures** — `c4-na/api/dah-year.json`, `c4-na/api/icdc-year.json`,
   `c4-na/api/iant-nov2026.json`, `c4-na/data/dar-al-hijrah-va.json`.
7. **AthanPlus** — `c9-oceania/data/lakemba-lma-2026-11-10.json`,
   `c9-oceania/raw/athanplus.html`, plus the mosque-hosted
   `c9-oceania/data/uma-sydney.json`.
8. **HAR evidence** — `har/mb.har`, `har/masjidal.har` (endpoint shapes,
   header names, one working apikey each; keys are referenced by path only,
   working copy `c32-platforms/probes/mb-apikey.txt`).
9. **This layer's spec + probes** — `c32-platforms/SCHEMA.md`,
   `c32-platforms/PROBES.md`, `c32-platforms/VERDICT.md`, probe payloads in
   `c32-platforms/probes/`.

## Web path (how a source reaches the archive)

`mosque site or platform surface` → capture per SCHEMA.md (page embed, keyless
API, or keyed API with the held key) → today-row anchoring + solar gate +
byte-identity + iqama-form + tz distrust tests → manifest row (URL, capture
UTC, id, referer where identity-free, sha256) → archive under
`census/<wave>/data/` → fitted only after the year/span resolution rules in
SCHEMA §1.4.5 / §5.4.1.
