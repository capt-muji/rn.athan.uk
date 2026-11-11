# O1l-38 — capital cities gap filler

Round two of the city-level census, capital-only. Built 2026-11-11 in
`$HOME/athan-gitree/census/o1l-city/capitals/`. Nothing in the repository was touched.

## 1. What the record already held

The census index (`census/census-index.db`) holds 1,547 surfaces across 103 countries. A
filename-only join against the 202 capitals found 60 of them named directly. That understates
the archive: a filesystem sweep of every `data/` table under `$HOME/athan-gitree/census`
(21,137 candidate files) found dated capital tables the index never carried — Kabul's MOHIA
permanent table, Islamabad's Nizam-e-Salat chart, Kyiv's DUMA calendar, Budapest's MME table,
Tallinn's EIC table, Ljubljana's IZŠ table, Belgrade's Bajrakli table, Astana's muftyat years,
and the whole `c15-jamiat` network (Pretoria, Lusaka, Harare,
Maputo, Windhoek, Maseru, Mbabane, Lilongwe, Kampala, Dodoma, Gaborone, Luanda).

**Result: 142 capitals covered, 60 gap, 202 on the list.** `CAPITAL-MATRIX.md` carries one row
per capital with surface, row count, span and tier, ordered by capital population.

False positives were removed by hand rather than trusted: Bathurst (Australia) is not Banjul,
Kingston (Hobart) is not Kingston (Jamaica), Victoria Falls (Zimbabwe) is not Victoria
(Seychelles), Goma is not Kinshasa, Msida and Birkirkara are not Valletta.

## 2. Filled this wave — 18 capitals, one gated capture each

Every capture is a mawaqit mosque page, saved raw in `captures/`, with the platform's own
embedded `confData` calendar flattened to dated rows in `data/`. The year comes from the page's
own `lastUpdated` epoch, never from a clock. The live-page gate compares the page's rendered
`times` array with the calendar row it equals; all 18 pass, and the gate day is recorded.

| Country | Capital | Rows | Gate day |
|---|---|---|---|
| CA | Ottawa | 365 | 2026-11-11 |
| PS | Jerusalem (East, publisher's own label) | 365 | 2026-11-11 |
| CM | Yaounde | 365 | 2026-10-29 |
| LV | Riga | 365 | 2026-11-11 |
| MK | Skopje | 365 | 2026-11-11 |
| MD | Chisinau | 365 | 2026-11-11 |
| HU | Budapest | 365 | 2026-11-11 |
| CZ | Prague | 365 | 2026-11-11 |
| PL | Warsaw | 365 | 2026-11-11 |
| RO | Bucharest | 365 | 2026-11-11 |
| ER | Asmara | 365 | 2026-11-09 |
| CV | Praia | 365 | 2026-11-11 |
| KM | Moroni | 365 | 2026-11-11 |
| UY | Montevideo | 365 | 2026-11-11 |
| NI | Managua | 365 | 2026-11-11 |
| AR | Buenos Aires | 365 | 2026-11-11 |
| SY | Damascus | 365 | 2026-11-11 |
| AE | Abu Dhabi | 365 | 2026-11-10 |

Two more capitals gained a surface from captures already in the archive or fetched today:

- **Beijing** — `islamichina_beijing_2026.json`, 365 dated rows for 2026, tier platform
  (a commercial travel site embedding a calculator widget). Candidate, not a published table.
- **Nairobi** — `Ramadhan-Timetable-1447-2026.pdf` from Jamia Mosque Nairobi, 7 pages, held raw
  in `captures/`, not normalised. Clerical.

## 3. Fits — adhan 4.4.6, Rounding.None, zone pinned per capital

Engine: adhan 4.4.6 at `census/adhan-build/node_modules/adhan`. Each city is fitted at the
capital's own point with the IANA zone the record carries, one recipe across all 365 days:
fajr and isha angles searched at 0.25 degrees across 10-20, three high-latitude rules, asr
tested Shafi and Hanafi, per-prayer constant recovered as the median residual. Columns are
exact / within-1 percentages.

| CC | Capital | Recipe fajr/isha, madhab, rule | fajr | sunrise | dhuhr | asr | maghrib | isha | Jan-Jul amp (min) | Publisher point vs city |
|---|---|---|---|---|---|---|---|---|---|---|
| CV | Praia | 15/14.8 shafi middle | 98.9/100 | 97.8/100 | 99.7/100 | 34.5/99.7 | 98.4/100 | 97.3/100 | -53/46 | 0.01 deg |
| SY | Damascus | 18/16.8 shafi middle | 97/99.7 | 97.8/99.7 | 98.1/100 | 13.2/58.1 | 96.2/99.7 | 87.7/100 | -136/127 | 0.02 deg |
| UY | Montevideo | 18/18 hanafi middle | 96.2/100 | 97.8/100 | 97.8/100 | 43.8/100 | 97.3/100 | 89.9/100 | 136/-142 | 0.03 deg |
| ER | Asmara | 17.75/16.8 shafi middle | 94/100 | 96.7/100 | 96.4/100 | 17.8/77.3 | 97.5/100 | 95.9/100 | -56/49 | 0.02 deg |
| CA | Ottawa | 15/15 shafi middle | 92.6/100 | 94.2/100 | 99.7/100 | 11.8/41.6 | 93.7/100 | 84.1/99.7 | -153/265 | 0.04 deg |
| NI | Managua | 14.5/14.5 shafi middle | 88.8/100 | 98.6/100 | 98.6/100 | 22.5/81.4 | 99.5/100 | 94/100 | -43/37 | 0.04 deg |
| HU | Budapest | 18/17 shafi twilight | 83.6/100 | 92.6/100 | 98.6/100 | 14/56.2 | 91.5/100 | 82.2/100 | -186/297 | 0.03 deg |
| AE | Abu Dhabi | 17/18.3 shafi middle | 78.6/100 | 61.1/97.8 | 94.5/100 | 57/98.1 | 66.6/98.1 | 55.1/98.6 | -90/84 | 1.29 deg |
| RO | Bucharest | 18/18 shafi middle | 68.2/99.2 | 72.9/100 | 95.6/100 | 52.1/98.6 | 69.6/98.9 | 85.5/100 | -157/269 | 0.06 deg |
| AR | Buenos Aires | 17.5/10 shafi seventh | 51.5/68.8 | 97.8/100 | 4.1/11.8 | 1.6/5.2 | 97.5/100 | 0.5/1.9 | 102/-19 | 0.03 deg |
| PS | Jerusalem | 18.25/17.5 shafi middle | 43.8/88.5 | 46.3/97.3 | 95.9/99.5 | 57.3/99.5 | 63.6/99.5 | 52.9/99.5 | -66/179 | 0.08 deg |
| MD | Chisinau | 17.75/13 shafi twilight | 35.9/70.7 | 29.3/94.5 | 87.7/97.5 | 47.1/97.3 | 22.2/92.9 | 18.4/32.3 | -170/257 | 0.06 deg |
| KM | Moroni | 10/10 hanafi middle | 32.6/71 | 3/13.2 | 43.8/87.9 | 2.2/6 | 36.2/78.9 | 14.8/41.9 | 36/-42 | 1.03 deg |
| CZ | Prague | 12/12 shafi middle | 26.8/83.3 | 29.3/78.1 | 56.2/98.4 | 16.4/64.1 | 16.2/73.4 | 13.4/60.8 | -191/304 | 0.01 deg |
| PL | Warsaw | 10/10.3 shafi twilight | 23/47.7 | 30.7/77.3 | 57.8/99.2 | 31.8/75.9 | 32.6/85.2 | 8.2/20.3 | -191/279 | 0.05 deg |
| LV | Riga | 14/15.3 shafi twilight | 16.4/52.1 | 58.1/68.2 | 85.5/100 | 35.9/66.6 | 53.4/69 | 21.9/49.3 | -217/328 | 0.03 deg |
| MK | Skopje | 16/15.5 shafi seventh | 11.2/32.1 | 51.8/100 | 3.6/11.5 | 23.8/77.3 | 19.7/74.2 | 29.9/66.3 | -109/241 | 0.11 deg |
| CM | Yaounde | 10.25/20 hanafi middle | 4.1/14.2 | 1.4/4.7 | 3.6/11.5 | 3.6/11.8 | 2.2/4.1 | 1.4/4.7 | -22/51 | 25.19 deg |

Three distinct results fall out, and they are defects of the publisher, not of the engine.

1. **Eight capitals reproduce** on adhan 4.4.6 at within-1 minute for fajr and isha, with dhuhr
   at 95-100 percent exact: Praia, Damascus, Montevideo, Asmara, Ottawa, Managua, Budapest,
   Bucharest. One recipe each, 365 days. Grade provisional (one published cycle, no second
   year held). Stability between years cannot be tested: the conf serves the current cycle
   only, so the ceiling is one year.
2. **Dhuhr is snapped, not computed**, in Skopje (3.6 percent exact), Buenos Aires (4.1) and
   Yaounde (3.6). Skopje prints dhuhr on the hour all year (12:00 or 13:00) against a true
   11:20-11:43, an 77-89 minute display rule. That is a column defect the fit surfaces.
3. **Two publisher points contradict their city.** Yaounde's page carries 16.006 N, 13.691 W
   (Mauritania) with `Africa/Dakar`, 25.2 degrees from Yaounde; no recipe can reproduce a
   Yaounde table from that point, and the fit fails on every column. Moroni's point is 1.03
   degrees off and Abu Dhabi's 1.29. These are recorded as published-point defects, never
   corrected by assumption.
4. **High-latitude tables are not angle tables.** Riga, Warsaw, Prague and Chisinau fit poorly
   at every angle and rule, including the seventh-of-the-night and twilight-angle variants,
   while their horizon columns (sunrise, maghrib) fit near 100 percent. Their fajr and isha are
   printed from interval tables or fixed caps, so a single angle recipe does not describe them.
   Recorded as structurally non-angle, not fitted.

## 4. Honest negatives

Terms searched: English, French, Spanish, Portuguese, Arabic and the local language of each
capital where it differs, plus transliterations. Sources tried: TinyFish search, direct site
navigation, `census-index.db`, the coordinate ledger, and a filesystem sweep.

- **Mawaqit API is closed.** `mawaqit.net/api/2.0/mosque/...` returns 401 Unauthorized and the
  search endpoint returns 404. Discovery ran through web search, and every page that answered
  was captured; the SPA renders its table only through the embedded `confData`.
- **Masjidal has no public directory.** `/api/v1/masjid/search`, `?search=` and `/nearby` all
  return 404; only the id-keyed `time/range` endpoint answers, so a capital without a known
  mosque id cannot be reached.
- **Masjidbox search returns other cities' pages** for Beijing, Mexico City, Bogota, Brasilia,
  Manila and Yerevan; none names the capital.
- **Blocked pages, recorded and left:** `centro-islamico.com` (Mexico City) returns 403;
  `regi.iszlamweb.hu` (Budapest) returns 403; `owqat.ir` (Tehran) does not resolve;
  `jerusalem-awqaf` captures in the archive are empty files.
- **Not found under these terms** for the 60 gaps: Beijing's neighbours aside, no dated table
  naming Kinshasa, Mexico City, Tehran, Bogota, Addis Ababa, Pyongyang, Brasilia, Manila,
  Kathmandu (a PDF is held, unnormalised), Port Moresby, Juba, Kigali, Thimphu, Naypyidaw, Dili,
  Ashgabat, Yerevan, Valletta, Bern, and the small-island and Caribbean capitals. The full list
  with the reason per capital is in `CAPITAL-MATRIX.md`.

This is not a claim that any capital or country is complete. It is what these terms returned.

## 5. Files

| File | Content |
|---|---|
| `CAPITAL-MATRIX.md` | one row per capital: status, surface, rows, span, tier; gap list by population |
| `data/capitals.json` | the 202-capital list with point, zone and population |
| `data/surfaces.tsv` | all 1,547 indexed surfaces flattened from the ledger |
| `data/inventory2.json` | per-capital dated-table inventory from the filesystem sweep |
| `data/mawaqit-*.json` | 18 normalised 2026 tables, `{date: {fajr..isha}}` |
| `data/fits.json` | per-city recipe, per-prayer scores, amplitude, publisher-point delta |
| `captures/` | every raw page and PDF saved this wave |
| `fetch_mawaqit.py`, `fit_mawaqit.js`, `build_matrix.py`, `data/inventory.py` | the pipeline |
| `manifest.tsv` | capture manifest with gate day and verdict |
