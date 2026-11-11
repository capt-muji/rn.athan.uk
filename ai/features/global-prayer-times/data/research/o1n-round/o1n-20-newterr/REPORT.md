# O1n-20-newterr continuation — REPORT (wave O1n-24, round o1n)

Continuation of this workspace. The predecessor banked the Wayback CDX sweeps
(`captures/cdx/`), the Dakar UCAD surface (five dated years, 2020/2021/2022/2025/2026,
1,830 days, genuine between-year movement, all gates PASS) and the Santa Cruz surface
(2025 archive + 2026 live, merged). This wave worked the four fronts in the dispatch.
Engine of record: adhan 4.4.6 at `census/adhan-build`, Rounding.None, MiddleOfTheNight.
All timestamps UTC from literal capture strings; the real clock reads nothing into data.

## Front 1 — the CDX fronts (Nono, La Paz, Rahmaniya, Lusaka, Bissau, Nampula, Gbessia; Dakar done)

**Where the predecessor left it:** every CDX shape returned empty for these seven boards —
exact-URL queries under en/es/pt/fr with and without /m/, the domain sweep filtered on each
slug, and the per-language prefix sweeps (`captures/cdx/*.txt`,
`data/cdx-prefix-sweep.json`, `data/cdx-slug-sweep.json`). Only dakar-ucad and santacruz
hold archived snapshots, and both are banked.

**This wave added:**

- **archive.today (archive.ph / archive.today / archive.is): unreachable** — connection
  timeout on all three hostnames (3 probes). The engine is closed from this host.
- **Live gates, 7/7 PASS**: each board's live page fetched 2026-11-11
  (`captures/live/live-<key>-20261111.html.gz`), parsed through the wave's confData parser,
  and compared cell for cell against the held banks — Nono, Lusaka, Nampula, Gbessia and
  Bissau against o1m-4 africa, Rahmaniya against o1m-2 capitals, La Paz against o1m-22.
  Every one of the 2,555 common days (365 x 7 minus none — 2026 is not a leap year) is
  identical on all six columns, and the metadata (name, latitude, longitude, timezone) is
  unchanged. `data/front1-live-gate.json`, `data/front1-live-fetch.json`.
- **Second-year verdict: the door is closed for these seven.** No archive snapshot exists
  under any tried shape; the mawaqit page carries no year parameter (the JS bundles this
  workspace saved expose no calendar endpoint); the app API is JWT-walled (recorded last
  round). The boards remain candidate, one published cycle, and the live gate now proves
  the same edition is still served.

**Note on the dispatch:** "Nono (Bolivia)" is not the board this wave holds. The Nono
surface is the Grande Mosquée de Nono, Nono, Guinea (slug `...-guinee`, solved point
10.876 N, 10.496 W, Africa/Conakry). Bolivia's surfaces are Santa Cruz and La Paz, both
already banked by the predecessor. One correction to the merged Santa Cruz record: the
2025-vs-2026 diff in `data/bo-santa-cruz-merged.yeardiff.json` is **zero moving cells on
every column** — per the grading rule that is one computed generation (frozen reprint),
so the Santa Cruz year-2 does NOT lift the row; it stays candidate with the diff banked.

## Front 2 — New Zealand (the 16 year-surfaces row, and the authority layer)

### The authority surface: FIANZ's own year-round table (NEW, supersedes a held negative)

The held row said "fianz.com links nothing but the Ramadan calendar, so no year-round
FIANZ surface exists". That is no longer true. `fianz.com/prayer-times/` now runs a
bespoke WordPress plugin (`wp-content/plugins/city-prayer-times/cpt.js`) serving, through
the page's own AJAX (`action=cpt_get_view` with the page nonce), a per-city, per-month
timetable for **20 cities x the current year**. This is FIANZ's own publisher surface
(the national federation's own domain, own plugin, own data), not a third-party widget:
authority tier above the platform mass.

**The walk** (`scripts/walk_fianz_2026.py`, 240 requests, one at a time; raw bodies
`captures/fianz/<city>-<month>.json.gz`): all 20 cities serve months 2..12 of 2026 —
January returns zero rows (the plugin's data starts in February; the page carries a
2026-02-16 publish date), December serves in full — **334 dated rows per city,
6,680 rows total, 2026-02-01..2026-12-31** (`data/fianz-2026.json`). The plugin's
today-row matches the month table's matching row on all 20 cities (gate 20/20 PASS).
There is no year parameter: passing `year=2027` returns the 2026 table, so this is a
current-year surface and no second year can come from it yet.

**The parse:** the plugin prints times without an AM/PM suffix; cpt.js appends AM to
fajr/shuruq and PM to zuhr/asr/maghrib/isha. The first pass read the PM columns as
am times; `scripts/reflatten_fianz.py` rebuilds from the raw captures with the +12h rule
on PM columns below 12 (no refetch needed).

**The fit** (`scripts/fianz_fit.mjs`, `data/fianz-2026.fit.json`): the plugin publishes no
coordinates, so each city's point is solved from its own table — solar grid solve on
sunrise/dhuhr/maghrib with per-column medians removed and a small-margin regulariser
(0.3/min) that pins longitude (a longitude shift alone is absorbed by the margin; the
regulariser prefers the point whose margins sit near zero). The solved points land on the
real cities (Auckland -36.84/174.64, Wellington -41.26/174.62, Christchurch
-43.59/172.46). Recipe and scores, per city:

| City | solved point | recipe (fajr/isha angles, asr) | within-1 pc (six columns) | worst |
|---|---|---|---|---|
| Auckland | -36.84, 174.64 | 18.0/18.0, Shafi, all margins 0 | 100/100/100/100/100/100 | 1 |
| Hamilton | -37.79, 175.11 | 18.0/18.0, Shafi, 0 | 100/100/100/100/100/100 | 1 |
| Palmerston N. | -40.34, 175.52 | 17.05/17.0, Shafi, 0 | 100/100/100/100/100/100 | 1 |
| Christchurch | -43.59, 172.46 | 15.95/14.95, Shafi, 0 | 100/100/100/100/100/96.7 | 4 |
| Wellington | -41.26, 174.62 | 16.0/15.0, Shafi, 0 | 100/100/100/100/100/100 | 1 |
| Napier | -39.56, 176.73 | 16.0/14.95, Shafi, 0 | 100/100/100/100/100/100 | 1 |
| (all others) | see fit file | 16-18/15-17 by latitude | 94-100 on fajr/sunrise/dhuhr/asr; maghrib 98-100; isha 69-96 (the deep-south summer isha sits 3-4 min off the angle) | 2-4 |

Exact rates run 47.9-96.4 pc (whole-minute renders against sub-minute events). The angle
pair grades with latitude: 18/18 at the northern North Island down to 16/15 at Invercargill
— one publisher, a latitude-dependent convention. Two defects named:

- **Whangarei is defective**: within-1 22.2 pc on isha, worst -164 (fajr worst +97). The
  city's rows do not sit on any point at any angle pair; the defect is in the served table.
- **Blenheim and Nelson serve byte-identical tables** (334/334 rows equal, same solved
  point -41.25/173.12): one table under two city names, and that table's asr column
  deviates (within-1 6.9 pc, worst -13 on a Shafi -5 reading; the Hanafi reading needs an
  impossible -54). Southern cities show isha within-1 69-95 pc with worst 4 — the
  summer isha sits 3-4 min off the angle at the mid-latitude and southern cities.

**Grade: provisional** — authority publisher, one published cycle, clean fitted recipe,
gates PASS. Span verdict untestable-single-year (no year parameter; January unserved).
Measured seasonal amplitude: Auckland fajr spans 38 min in February against 11 min in July;
Invercargill 57 against 17 (the framing holds).

### The masjidbox year-2 walk (13 surfaces, 2027 walked)

`scripts/walk_mbj_2027.py` walked 2027-01-01..2027-12-31 for all thirteen masjidbox NZ
surfaces through the same public athany endpoint the held bank used (7-day windows, one
request at a time; raw captures `captures/mbj2027/<slug>/*.json.gz`; per-surface banks
`data/mbj2027/<slug>-2027.json`, summary `data/mbj2027-walk-summary.json`,
verdicts `data/front2-nz-second-years.json`). Verdicts against the held 2026 rows by
month-day:

- **Genuine second editions (4)**: Taranaki (459 moving cells, all six columns),
  Lincoln University Musalla (537, all six), Aman Islamic Trust (457 — fajr re-set on
  365/365 days, 05:00 -> 04:45 on 01-01, plus 92 sunrise moves), NZ Islamic Cultural
  Trust (158 — sunrise 78, maghrib 80; one 7-day window answered 404 at 2027-03-05, so
  358 of 365 rows banked and the gap named). Masjid-E-Umar is a partial: sunrise edited
  on 77 days while its four famous fixed clock columns stay fixed.
- **Frozen reprints (8)**: Masjid Al-Ameen, Linwood, Manawatu, UCMUSA, VicMuslims,
  Waikato, Wellington Kilbirnie, Masjid Al-Manar — 365/365 rows byte-identical to 2026.
  One computed generation; per the grading rule the relabel never lifts these rows.

The four genuine editions stay candidate (dated boards, no fitted recipe), now with a
two-year span and the between-year diff as evidence; span verdict moves from
untestable-single-year to **yes, 2 years** for those four.

### The three mawaqit NZ surfaces: no second year (blocked class)

Wayback holds captures for Nelson Islamic Centre (2025-02-11, 2026-04-21) and Suhail
Patel/Birkenhead (2025-07-10) — `captures/cdx/nz-mawaqit-nelson.txt`,
`nz-mawaqit-suhailpatel.txt`. All three fetched: each serves the same 10,319-byte
"Age restricted content" page, byte-identical md5 — the archive's crawler sat behind a
Vodafone UK content filter (the block page carries the filter's own redirect with an
msisdn parameter) and captured the block, not the board. Al-Makhtoom has no captures.
Live mawaqit serves the current year only. **No second year by any route; the archive
captures carry no table.**

## Front 3 — the negatives retried (new phrasings, languages, engines)

- **Bhutan**: English routes ("Thimphu mosque", "Bhutan muslim association jamaat prayer
  timetable") and the HalalTrip mosque directory (its Bhutan facet redirects to the empty
  global directory). Result: no officially recognised mosque (multiple sources), no
  Bhutanese publisher; only third-party calculators (islamicfinder, muslimpro,
  muslimandquran, salahtimes) serve Bhutan points. **Negative stands: not found under
  these terms** (English routes; the Dzongkha vocabulary negative from the earlier pass
  stands with it).
- **Djibouti**: new route probed — islamdjibouti.com, "the portal of Islam in Ambouli" (a
  Djibouti-hosted Somali-language Islamic portal): lecture library (muxaadaro, tafsiir),
  its Salaada category answers an error page; no timetable anywhere on the portal. The
  French searches surface only platform calculators; the Ministry of Islamic Affairs and
  Waqfs has no site under these terms. **Negative stands** (La Nation's zero-item search
  from the earlier pass stands with it).
- **Somalia**: Somali phrasing (waqtiga salaada Muqdisho) and Arabic (the Ministry of
  Endowment and Religious Affairs' name) surface only platform calculators and the
  ministry's Wikipedia article — no ministry site, no printable table. Radio Mogadishu's
  domain is archived but is a news site. **Negative stands.**
- **Mali HCIM**: French routes (the Council's name + calendrier/imsakia, maliweb.net
  religion pages). maliweb's Ramadan 2026 article carries only the government ministry's
  moon-sighting start-date announcement (Ramadan began 18 February 2026), no timetable;
  the HCIM's own presence remains Facebook-only (login-walled). **Negative stands.**
- **Sierra Leone Islamic Web**: NEW precision — the project has an own website,
  sierraleoneislamicweb.com (a One Deen Group project). The live domain is down
  (Cloudflare 522, origin unreachable; capture saved). Its one Wayback capture
  (2026-06-16) serves the same Vodafone filter stub as the mawaqit NZ pages — no content.
  The prints (the Ramadan 2026 Freetown calendar PDF) post to Facebook only
  (login-walled). **Negative stands, now with the sharper reason: the publisher's own
  site exists, is dead, and its archive copy is a filter block.**
- **Ghana**: the National Mosque's own site (ghananationalmosque.com) fetched — no
  timetable on the page, the prayer-times block in the search snippet is the Muslim Pro
  widget adoption already recorded; services.html carries khutba times only. "Jamiat" and
  the ASWAJ transliteration resolve to no body with a print (an app announcement on
  Facebook only). **Negative stands.**

## Front 4 — countries with no dated surface

Checked the fit index's country set plus the o1n CONSOLIDATION against the census index
(`census-index-o1n.db`, surface paths): the plausible residue (Comoros, Eritrea, Congo-
Brazzaville, Lesotho, Eswatini, Timor-Leste, Burundi, CAR) already carries index surfaces
from the platform trees (path hits: comor* 237, eswatini 45, burundi 80, dili 14, maseru
6, bangui 9, asmara 4, brazzaville 7). The genuine no-surface residue is micro-territories
with no Muslim institution: **Greenland** (no mosque; a single Lebanese-origin restaurant
keeper is the community; platform calculators only) and the **Faroe Islands** (no mosque;
the community meets in borrowed rooms; platform calculators only) — both recorded as
negatives under these terms. **Western Sahara**: a live lead, not banked — fm6oa.org (the
Mohammed VI Foundation of African Ulema) serves per-region prayer tables that include the
Saharan provinces; the MENA lane owns that publisher class, so the lead is handed off
rather than worked here. The index rebuild itself is O1n-19's lane and was not touched.

## Not proven (in my own words)

- A second dated year for the Nono, Lusaka, Nampula, Gbessia, Bissau, Rahmaniya and La Paz
  surfaces: not proven. No archive copy exists under the shapes searched; the live serve
  is the same edition it has been all year.
- A FIANZ second year: not provable today — the plugin exposes no year parameter and
  January 2026 is not served; the 2027 walk becomes possible in January 2027.
- Bhutan, Djibouti, Somalia, Mali's HCIM, Sierra Leone's Islamic Web, Ghana's Jamiat and
  National Mosque: still no dated surface under the terms searched this wave; each
  negative names its routes and languages above.
- The eight frozen-reprint masjidbox surfaces: their "2027" is a reprint of 2026, so a
  second cycle is NOT proven for them.
- The SL Islamic Web's own timetable: its site exists but is dead and its archive copy is
  a filter block; nothing bankable was ever seen outside Facebook.

## Artifacts

- `data/fianz-2026.json`, `data/fianz-2026.fit.json` (20 x 334 dated rows + fits)
- `data/mbj2027/*.json` (13 x 365 dated 2027 rows), `data/mbj2027-walk-summary.json`,
  `data/front2-nz-second-years.json`
- `data/front1-live-gate.json`, `data/front1-live-fetch.json`
- `captures/fianz/*.json.gz` (240 raw AJAX bodies), `captures/fianz-prayer-times.html.gz`,
  `captures/fianz-cpt.js.gz`
- `captures/mbj2027/*/*.json.gz` (684 raw windows), `captures/mbj-probe-2027-window.json.gz`
- `captures/live/*.html.gz` (7 board pages), `captures/wayback/` (4 stub captures kept as
  negative evidence), `captures/cdx/nz-mawaqit-*.txt`
- `scripts/` (this wave's scripts, all rerunnable)
