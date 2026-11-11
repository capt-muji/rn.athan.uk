# O1n-3 — TURKTAKVIM re-enumeration, the semicolon fix, and the world harvest

Wave O1n-3, round o1n. Workspace `$HOME/athan-gitree/census/o1n/o1n-3-turktakvim/`.
Capture date 2026-11-11, timestamps UTC, no clock read into data. Repo untouched.
The wave runs for hours and banks as it goes; a successor continues from
`data/journal-enumerate.jsonl`, `data/journal-harvest.jsonl` and
`data/parse-marker`, never redoing a fetch. Engine of record: **adhan 4.4.6**
(`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`) via
`scripts/engine.mjs`, no silent high-latitude fallbacks.

## 1. The tree, corrected twice

**The semicolon fix.** o1m-51's filter class `[A-Za-z0-9%_\-]+` truncated paired
filters (`GOZOISLAND;GOZOADASI` -> `GOZOISLAND`), so 2,052 of 3,104 province
pages returned the publisher's 17,718-byte empty shell. The fixed class
`([^"&]+)` (o1m-45's) re-enumerated the tree (`scripts/enumerate2.py`, journal
`data/journal-enumerate.jsonl`):

| measure | o1m-51 | o1n-3 corrected |
| --- | --- | --- |
| province filters seen | 3,104 | **3,243** (150 semicolon-paired) |
| filters never captured under their full name | — | 716 |
| settlements (non-African tree) | 110,834 | **112,854** (before the UK fix, 112,847) |
| census entries with settlements | 169 | **181** |
| zero entries | 13 | **1** (midway-islands, genuine) |

Twelve false zeros resolved: northern-cyprus 0->123, malta 0->87,
cayman-islands 0->57, palestine 0->31, wallis-and-futuna 0->28 (the o1m-45
measurement, confirmed), kosovo 0->23, and the rest. 100 province pages still
return the shell after refetch with the full filter: genuinely empty provinces,
recorded as such, no longer truncation artifacts. Largest count gains:
azerbaijan +359, india +288, greece +207, kazakhstan +198, united-states +119.

**The slug-collision fix (found this wave, fixed in `scripts/enumerate3.py`).**
The publisher lists England (countryID 204) and Northern Ireland (143) as two
entries, both mapped to the census slug united-kingdom. Both wrote the same
`country-united-kingdom.html` capture, so whichever fetched last decided which
province set was enumerated — o1m-51's 1,123 was one id's tree, this wave's
first pass gave 1,127 with the other winner. The per-countryID re-enumeration
(125 England provinces + 6 Northern Ireland) settles the entry at **1,160
settlements**. An offline recount against the captures confirms every other
slug is single-id and deterministic; uk is the only collision in the non-African
tree.

## 2. The harvest, scheduled and running

`scripts/harvest2.py`: token bucket at **4.7 req/s**, 16 workers, one JSONL
journal line per request (`data/journal-harvest.jsonl`), gzip on write
(`captures/annual-<cityID>.html.gz`; under-table responses kept as
`*.html.empty.gz`), disk watchdog stops cleanly under 15 GB free and writes
`data/STOP-position.json`. Probe-then-walk discipline: one settlement per
country fetched and shape-checked before the walk (182 probed: 140 ok, 10
empty, 31 already banked, 0 fail). Order (`scripts/build-order.py` ->
`data/harvest-order2.json`): unbanked first, breadth before depth, per country
head of 10 then the remainder, shortest country first; banked ids trail.

Measured rate at the journal: 284 lines/60 s = **4.73 req/s**, at the ceiling.
The compute-nothing layer runs ~8 per cent of fetches, consistent with o1m-51's
SHORT rate. Probe-empty countries are the far-north and far-Pacific classes:
svalbard-and-jan-mayen, greenland, wallis-and-futuna, samoa, fiji, tonga,
new-zealand, iceland, norway, finland.

A politeness incident is recorded: between 14:41 and 14:47 UTC two walk
processes ran concurrently (a restart overlap), each carrying its own bucket, so
the ceiling was briefly doubled before the overlap was measured and killed.
turktakvim served o1m-51's 40 workers without complaint; no block or throttle
was observed. One process, one bucket, since.

`scripts/parse2.py` parses incrementally against `data/parse-marker`;
`scripts/bank-loop.sh` banks every 10 minutes (parse, coverage, health line in
`logs-watch.txt`) and stops the walk cleanly if disk crosses the floor.

## 3. The fits: method and ladder distribution

turktakvim publishes no coordinates, so each settlement's point is solved from
its own table (`scripts/solve.mjs`): latitude from the printed day length (less
the assumed +6/-5 pair), longitude from the transit level across the year, clock
zone from the IANA candidate whose rules minimize the transit residual spread
(multi-zone countries resolve per settlement; median zoneMad ~0.05 min). The
point is DERIVED, never published, and absorbs the printed margins — validated
geographically (Athos monasteries solve at 40.3N/24.0E, Limassol at
35.2N/33.0E, Dakhla at its coast).

The ladder is fit per column at the solved point (`scripts/fit.mjs`), 96 evenly
spaced dates, angle plus integer-minute margin, isha read as an interval where
the printed gap is a round constant. **162 countries fitted** on the banked
tables (up to 40 settlements per country). Distribution highlights:

| country sample | fajr | sunrise | dhuhr | asr | maghrib | isha |
| --- | --- | --- | --- | --- | --- | --- |
| yemen, wake-island, american-samoa | -1.5..3 | -5 | +7 | +7 | +6 | +4..8.5 |
| tajikistan, greece, albania | -0.5..0.5 | -6 | +9..10 | +9 | +7 | +10..12 |
| cyprus | -5 | -7 | +10 | +10 | +8 | +12 |

The derived-point read absorbs margins into latitude with latitude-dependent
strength, so the per-country margins are comparable country-to-country through
the same method, not to o1m-45's coordinate-based September read. The clean
margin read is the anchor below. `fit/ladder-summary.json` carries every
country's distribution (median/min/p10/p90/max + counts per column);
`fit/tt-<country>.json` carries per-settlement fits, spans and seasonal
amplitude. All tables are the single published 2026 cycle: the grading
vocabulary puts each fit at **provisional** (one published cycle), platform
tier, engine adhan 4.4.6.

## 4. Cross-checks, measured

**athanpro (709 shared settlements, matched by distance <= 30 km at the
platform's own coordinates, September 2026 cycle):** printed-time deltas
turktakvim minus athanpro, medians: **fajr +0.5, sunrise -5, dhuhr +7, asr +7,
maghrib +6, isha +7** — the o1m-45 margin-dispute pattern reproduced at 27
times the sample. The anchor read (turktakvim's year fit AT the true point)
gives margins **sunrise -4.75, dhuhr +7.35, asr +7.28, maghrib +5.73, isha
+8.64, fajr +1.0**: the Turkish ladder measured without derived-point
absorption. `fit/crosscheck-athanpro.json`.

**Diyanet (644 shared settlements, name-matched within country, per-file dated
windows):** turktakvim minus Diyanet medians: fajr 0, sunrise +1, dhuhr +5, asr
+6, maghrib 0, **isha +10**. The isha column is the family dispute; the solar
columns agree within minutes. `fit/crosscheck-diyanet.json`. The remaining
unmatched Diyanet countries are the African tree (out of scope here by design)
plus entries Diyanet does not carry; western-sahara, french-polynesia and
southern cyprus are absent from Diyanet's own 210-option list.

## 5. The FALLBACK join — all three rows gain a dated surface

The o1m-37 register (`DECISIONS-ADDENDUM-ROUND3`) leaves exactly three FALLBACK
rows. `scripts/fallback-join.py` -> `fit/fallback-join.json`:

| row | tree presence | banked | ladder at solved point | second witness |
| --- | --- | --- | --- | --- |
| Cyprus south | census slug `cyprus` (selector entries Kibris + Guney Kibris; K.K.T.C. kept separate as northern-cyprus) | 32 tables, 11,680 rows, 2026 cycle | fajr -4.5, sunrise -7, dhuhr +10, asr +10, maghrib +7.5, isha +12 | athanpro Nicosia within 30 km; Diyanet none (KUZEY KIBRIS only, the northern entry) |
| Western Sahara | **no selector entry**: served as the WESDERNSAHARA province filter under Fas (countryID 131); banked by o1m-45, re-fitted here | 4 tables, 1,460 rows | fajr +2, sunrise -5, dhuhr +8, asr +8, maghrib +6, isha +7.5 | athanpro pair fails the 30 km match, consistent with the o1m-45 clock dispute; Diyanet absent |
| French Polynesia | selector entry Fransiz Polinezyasi (countryID 66) | 51 tables, 18,615 rows | fajr 0, sunrise -5, dhuhr +7, asr +7, maghrib +6, isha +8 | athanpro pairs none within 30 km in this pass; Diyanet absent |

Verdicts are platform-tier dated surfaces, one published cycle. The owner's
FALLBACK closure stays an owner ruling; this wave only supplies the surfaces.

## 6. Open at this writing

- The walk continues (~105,000 fetches at 4.7 req/s at the last check, ~6.2 h;
  ETA ~21:15 UTC 2026-11-11). A successor reruns `scripts/parse2.py`,
  `scripts/build-order.py` (if the tree moved), then `node scripts/fit.mjs
  --all`, `node scripts/crosscheck.mjs`, `python3 scripts/coverage2.py`,
  `python3 scripts/fallback-join.py` at completion.
- coverage.json is rebuilt every 10 minutes by the bank loop; at 14:52 UTC it
  read 181 countries, 112,854 settlements, 6,900 tables, 2,488,254 dated rows.
- The probe-empty ten need the per-country empty-share measured after the walk
  (probe is one settlement; country verdicts follow the parse counts).
- UK ladder and cross-check pairs will move with the corrected 1,160-settlement
  entry as its tables land.

## Assumptions

- The census tree's scope stays non-African: o1m-4 holds the African 50 entries
  (8,565 settlements), and this wave does not refetch them. Evidence: the brief
  and the o1m-51 report, both excluding AFRICA_IDS (52 ids).
- The 17,718-byte response is the publisher's empty shell, and a refetch that
  still returns it is a genuinely empty province rather than a defect: the
  refetch used the publisher's own full filter string from its country page.
- turktakvim tables carry one annual cycle (2026), so per-year stability across
  years is not measurable from this surface alone; fits are graded provisional
  per the o1n FIT-RULES vocabulary.
- The isha anchor margin (8.64) sits beside the printed delta (7): the anchor
  reads the angle-plus-margin pair at true coordinates, the delta reads the
  printed gap to athanpro's zero ladder; both are reported, neither averaged.
