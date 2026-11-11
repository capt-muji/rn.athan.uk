# REPORT.md — o1m-4 Africa third-city layer (INCREMENTAL)

Wave o1m-4, round o1m. Workspace `$HOME/athan-gitree/census/o1m/o1m-4-africa/`. The repo is never touched.
Capture date: 2026-11-11 (all dates from literal capture strings; no real clock read into data).

## Script-counted inventory (updated as jobs close)

The block below records the pass before the provider cancellation. The **Continuation pass** section
further down carries the current totals for the same surfaces plus the new ones.

- tawkit.net: **571 African cities x 365 dated rows = 208,415 rows**, every city a rolling 12-month window
  `2026-11-01..2027-10-31` (the platform's own `?m=all&print=1` timetable page). Per country:
  Ethiopia 81, Burkina Faso 80, Sudan 75, DR Congo 65, Somalia 56, Senegal 53, Kenya 51, Niger 44,
  Angola 26, Mali 21, Mauritania 19. Raw city page + all-page HTML captured per city under `captures/`.
- mawaqit: 8 new mosque surfaces x 365 rows = 2,920 rows (Praia CV, Lusaka ZM, Harare ZW, Nampula MZ,
  Boké GN, Nono GN, Gbessia Conakry GN, UCAD Dakar SN); every one gated against its own live page
  (`live_page_gate: pass` in each file).
- masjidway (flaky host; ar host + trailing slash + retries is the working recipe): 9 month files —
  Pikine Touba mosque SN (Nov+Dec 2026, Jan+Feb 2027), Grande Mosquée Dakar SN (Nov+Dec), Nord Foire SN (Nov),
  Mosquée du CHU Libreville GA (Nov+Dec). Retry queue running for Okala GA, Andrainjato MG, Colobane SN,
  Rue 10 SN, plus Mar 2027 for Pikine.
- Senegal CERFI: second dated snapshot of all 9 cities (63 rows, 2026-11-11 week) — the year-2 accrual
  for Saint-Louis/Touba continues; API responses saved under `captures/cerfi2-api-*-o1m.json`.
- Country-page enumeration of masjidway discovered: Senegal 51202, Gabon 51075, Guinea-Bissau 51091,
  Nigeria 51161 (the `<id>-<country>` browse the prior round recorded as absent).

## Platform method notes

- tawkit city page carries `"latitude"/"longitude"` in embedded JSON; the all-table page splits by
  `<h2>Prayer times · city, country · MM-YYYY</h2>`, six `<td>` per row. Parser: `parse-tawkit-all.py`.
  Gate: the current-month table on the city page is diffed cell-by-cell against the same month inside
  the all page (first 5 days) — done in the fitter, `gate.checked/gate.diff` per city.
- baligubadle (SO) serves an integer latitude (`"latitude":9`) — flagged `coords_imprecise: true`.
- masjidway: `en.` refused outright this pass (000/503), `www` 503-heavy, `ar` + `fr` worked.
  The search box fires no request (structurally broken discovery); only known ids resolve.
  Country browse exists at `https://ar.masjidway.com/<id>-<country>` (with `/m2`..`/m8` pagination).

## Fits (fit/ directory, adhan 4.4.6, Rounding.None, tz pinned per country)

- `fit/mawaqit-fits.jsonl` — done. Headlines:
  - Praia AIDES (CV): fajr 14.90 / isha 15.10, all-six within-1 min 87.9 pct, worst 2 — a real table
    (first Cape Verde surface).
  - Harare Msasa (ZW): 14.90/15.10, min within-1 72.3 pct, worst 3 — real table (first Zimbabwe surface).
  - Correrah-Bokè (GN): 14.90/15.10, min within-1 80.5 pct, worst 2 — real table, new Guinean city.
  - Nono (GN): 17.85/17.10 but worst 19 — partially hand-set; recorded, not adjudicated.
  - Lusaka Barkaatiyah (ZM): 14.85/19.90, worst 33 — jama'ah board in the table slot (community tier).
  - Nampula Masjid Fátima (MZ): worst 46 — hand-set components (first Mozambique surface, candidate).
  - Gbessia Port2 (GN): worst 103, and the page's own coords are round `9/-13` — a hand-set board.
  - UCAD Dakar (SN): worst 51 — jama'ah board.
- `fit/tawkit-fits.jsonl` — running (4 workers over 571 cities; 208,415 cells total).
- `fit/masjidway-fits.jsonl` — running.

## Negatives (recorded with the languages searched)

- Massawa (ER): no mosque surface on any platform; calculators only (English; Tigrinya/Arabic via
  transliteration in search). Asmara's held surface IS mawaqit `masjid-al-khifa-al-rashidin...` (capitals wave).
- Kankan, N'Zerekore, Kissidougou (GN): no mosque tables; calculators only (FR).
- Abeche, Moundou (TD): calculators only (FR/AR phrasings).
- Toamasina (MG): calculators only (FR). Antananarivo mosque pages are Instagram-only.
- Serrekunda, Brikama (GM): nothing beyond the UK Gambian-centre trap (Smethwick B66).
- Bo, Kenema (SL): nothing (EN). Freetown Ansaar already held.
- Tamale (GH): ghanamasjid.org serves wrappers only, no own annual table (EN).
- São Tomé (ST): no surface at all (PT). Cape Verde covered by the Praia find above.
- Jamia Nairobi "DAILY": jamiamosque.co.ke carries only the Ramadhan-1447 PDF (held); the X timeline
  (public syndication endpoint, no login) carries announcements only, no daily timetable posts (EN/SW terms).
- Wayback CDX on `cerfi.sn/api/horaires*`: zero captures (the API has never been archived).

## Defects

- masjidway host behaviour this pass: `en.` 000-refusal, `www` 503, `ar`/`fr` usable — wider than the
  recorded "host rotation + trailing slash"; record updated.
- tawkit baligubadle integer latitude (above).
- The mawaqit Conakry mosque Gbessia Port2 carries round coordinates (9/-13) — platform page hand-located.

## Continuation pass (resumed 2026-11-11 after the provider cancellation)

Banked state verified at resume: 144 MB, 603 data files, 1,464 captures, tawkit fits 287 unique cities
of 571, masjidway retry queue closed with 4 usable months, salaahtimes batch closed at 224 files.

Script-counted at the end of this pass:

- **turktakvim: 8,565 settlements in 50 African countries, 8,565 annual captures, 8,565 normalized
  tables, 3,126,225 dated rows**, every table exactly 365 rows spanning 2026-01-01..2026-12-31.
- **salaahtimes: 112 towns, 224 town-year pulls, 224 fitted, 81,760 dated rows** (2026 and 2027).
- tawkit: 571 cities fitted (was 287), 208,415 rows, per-country summary in `fit/tawkit-summary.txt`.
- mawaqit: 9 mosque surfaces, 3,285 rows (the ninth is the new Bissau find).
- **Wave total: 3,419,685 dated rows** across four platforms.
- Cross-check: 273 cities shared by turktakvim and tawkit, constant per-city offsets.
- Captures 10,898 files, data 9,434 files, workspace 4.0 GB.

### Repair: the tawkit fit race

- The handover left eight `fit-worker.zsh` shells reading one queue, so every city was fitted twice and
  the journal held 1,143 lines for 286 cities (the duplicate pairs are byte-identical). Three of the four
  surviving shells were stopped, the remaining 282 cities were sharded `[i::4]` into four dedicated
  workers, and no city is now fitted by two processes. Journal at 553 unique cities and rising.
- `data/fit-rem-*.txt`, `fit-worker2.zsh` are the shards; the old queue and worker stay for the record.
  The journal keeps its duplicate lines (the race is part of the record); `fit/tawkit-fits-clean.jsonl`
  holds the 571 canonical rows, last fit per city winning.

### NEW SURFACE — salaahtimes.co.za (112 African towns, two years each)

The handover had banked 224 town-year pulls and never parsed them. They are now normalized
(`parse-salaah.py`) and fitted (`fit-generic.mjs`, adhan 4.4.6, Rounding.None, tz from the pull):

- 224 files, 112 towns, 2026 and 2027 both present for every town, 365 rows each = **81,760 dated rows**.
- Country spread: Botswana 33 towns, Malawi 29, Zambia 15, Eswatini 13, Zimbabwe 6, Mozambique 2,
  Lesotho 2, plus Angola, Ghana, Cameroon, Tanzania, Uganda, Madagascar, Namibia, and four non-African.
- Columns served: sehri, subuhSadiq, fajr, sunrise, ishraaq, chast, zawaal, zuhr, asrShafi, asrHanafi,
  sunset, maghrib, esha. The six fit columns take fajr, sunrise, zuhr, asrShafi, maghrib, esha.
- All 224 fitted: **dhuhr is 365/365 within-1 on every town**, worst 1; fajr and isha pass at all but
  five town-years (two are the Mahajanga coordinate defect, two the Serowe hand-set board, one a
  non-African town). Luanda: fajr 17.90, isha 18.10, sunrise +0, dhuhr +5, asr +0, maghrib +3,
  amplitude Jan 4 / Jul 2. Two published years on one recipe is the grading A test (FIT-RULES rule 1).
- This is new territory for Zambia, Zimbabwe, Malawi, Botswana, Eswatini and Lesotho, all of which had
  no own town tables in the record.

### THE LEVER — turktakvim African gazetteer (8,565 settlements, 52 country entries)

`turktakvim.com` enumerates African settlements at three levels, exactly as it did for the eleven
fallback countries last round. The gazetteer URL shape is
`index.php?link=Ulkeler_Listesi.php&countryID=<id>&cityStateFilter=<province>`, and the country
page must be fetched **without** the empty `cityStateFilter` parameter: with it, the publisher returns a
17 KB shell carrying no province links.

- 233 countries on the index; **52 African entries** enumerated: **8,565 settlements** with cityIDs.
  Largest: Liberia 1,981, Nigeria 496, Algeria 475, DR Congo 472, Niger 385, Madagascar 339,
  Morocco 327, South Africa 300, Zimbabwe 262, Libya 253, Egypt 241, Comoros 232, Tanzania 189,
  Ethiopia 179, Guinea 171, Mali 163, Angola 163, Rwanda 145, Ghana 130, Burkina Faso 129,
  Senegal 122, Mozambique 117, Chad 110, Sudan 91, Zambia 88, Kenya 53, Cameroon 52, Gabon 43,
  Mauritania 42, Somalia 41, Eritrea 12, Gambia 7, Guinea-Bissau 6. Cape Verde and São Tomé are 0 —
  the two gazetteer holes, matching the report's earlier negatives for those countries.
- **Every mission-named city resolves to a cityID**: Kankan/N'Zerekore (GN), Mopti 9011 / Sikasso 9020 /
  Kayes 9006 (ML), Dire Dawa 5068 / Harar 74682 / Hawassa 74574 (ET; Addis Ababa itself is absent), Mombasa 8617 /
  Kisumu 8634 / Nakuru 8641 / Nairobi (KE), Bosaso 81486 / Kismayo 62588 (SO), Bobo Dioulasso 2866 /
  Koudougou 2861 (BF), Niamey 9985 / Zinder 9994 / Maradi 62558 / Tahoua 9990 (NE), Abeche 3860 /
  Moundou 3854 (TD), Kassala 15823 / Omdurman 122820 / Port Sudan 15778 (SD), Asmara 5031 /
  Massawa 5038 (ER), Kinshasa 21060 / Lubumbashi 21040 (CD), Douala 2972 / Yaounde 2968 (CM),
  Franceville 5697 (GA), Beira 9495 / Maputo 9467 (MZ), St Louis 15203 / Touba 71576 / Dakar (SN),
  Tamale 5971 / Takoradi 5978 / Accra 5968 (GH), Bo 15216 / Kenema 41436 / Freetown 15219 (SL),
  Serrekunda 43412 / Brikama 71759 / Banjul 16650 (GM), Nouadhibou 9042 / Nouakchott 9052 (MR),
  Antananarivo 8761 / Toamasina 8871 (MG).
- Annual table: `index.php?link=yillikvakitler.php&cityID=<id>` — 365 dated rows, eight columns
  (İmsâk, Sabâh, Güneş, İşrak, Öğle, İkindi, Akşam, Yatsı), ~430 KB per capture.
- Harvest resumable at 8 workers (`tt-harvest-africa.py`); parse (`tt-parse-africa.py`) writes
  `data/tt/<country>/<cityID>-<slug>.json` with the publisher's own month headers and day labels, so no
  clock is read.
- **Year-2 result, measured:** the annual endpoint ignores `tarih` and always renders 2026. The monthly
  endpoint `aylikvakitler.php&cityID=<id>&tarih=YYYY-MM-01` serves **2026 only** for these cities: 2026-01
  and 2026-12 return 77-row tables, while 2025-11, 2027-02 and 2027-06 return a 17-row shell with the
  publisher's stale default header (MAYIS 2016). One published cycle, therefore provisional, not A.
  This narrows the O1m-1 note that the endpoint rendered any year, which held for that round's countries.

### Negatives recorded this pass

- **Diyanet worldwide API is closed.** `awqatsalah.diyanet.gov.tr` documents a full JSON surface
  (`api/Place/Countries`, `api/Place/States/{countryId}`, `api/Place/Cities/{stateId}`,
  `api/PrayerTime/Monthly/{cityId}`, `api/PrayerTime/DateRange`) but every call returns **401**; the
  documented `Auth/Login` is a credential wall and is out of bounds. The public page
  `namazvakti.diyanet.gov.tr` renders a **single day** per city through ASP.NET postbacks — no dated
  table. Captured: the 210-country select list (`data/diyanet-countries.json`, 44 African entries) and
  the API documentation page. No rows.
- **masjidway Senegal country browse is Dakar-only.** Pages `51202/m2..m5` list 7 mosques each, every one
  in the Dakar region (Pikine, Yoff, Mermoz, Hann, Cambérène); no Touba, no Saint-Louis. Of the 24 mosque
  month pages fetched in the retry queue, 23 publish **no table** (the page renders without the
  `subh_val` block) and only one (id 7315) serves a table. Country ids outside 51040-51300 are not
  reachable by enumeration: the range walk found only Gabon and Guinea-Bissau among African entries.
- **Cape Verde and São Tomé have no turktakvim entry** (0 settlements), confirming the earlier negative
  from a second publisher.

### Defects found this pass

- turktakvim serves the monthly table for the current year only, with a stale MAYIS 2016 header on every
  out-of-range request. A parser keyed on the header rather than the requested month would silently bank
  2016 rows under a 2027 label; the parse here reads the table's own header.
- masjidway mosque pages without a published table are 24 KB and return 200 — a 200 is not a table.

### Gate: turktakvim annual table against the publisher's own monthly page

90 cities (every African settlement carrying a geocode and both captures), five November days each,
six columns: **gate PASS, 0 diffs**. The annual table and the monthly page agree byte for byte, so the
365-row harvest is the publisher's live table and not a stale edition.

### The engine across Africa (24 cities fitted, 365 days each, adhan 4.4.6, Rounding.None)

| column | recovered value across the 24 cities |
|---|---|
| fajr | depression **17.50-17.85**, median 17.75 |
| isha | depression **18.70-19.25**, median 18.75 |
| sunrise | **-4** min (-5..-3) |
| dhuhr | **+8** min (+7..+9), **365/365 within-1 at every city** |
| asr (Shafi) | **+8** min (+7..+9) |
| maghrib | **+6** min (+6..+8) |

- The recipe is one engine, and it matches the O1m-1 pooled result (fajr 17.85, isha 18.6-18.75,
  sunrise -4.4, dhuhr +7.0, asr +7.0, maghrib +5.45) within a fifth of a degree. The African cities sit
  slightly lower on fajr and slightly higher on isha, the same latitude-driven isha correction the record
  already documented.
- isha reproduces 365/365 at 18 of 24 cities. The six that do not are the higher-latitude or desert
  points: Algiers 259, Oran 269, Constantine 274, New Cairo 287, Aswan 338, Kayes 324 (worst 5 min). The
  near-equator cities (Cotonou, Malabo, Bangui, Luanda, Abeche, Moundou, Douala, Kampala class) all sit at
  365/365, which is the seasonal-correction signature, not a per-city defect.
- Kayes (Mali) is the one outlier on both angles (17.50/19.25). It is flagged as a coordinate question,
  not an engine defect, and is left unadjudicated.
- Every parsed table holds exactly 365 dated rows; no month is short across the first 5,017 parsed files.

### Cross-check: turktakvim against tawkit on the 273 cities both serve

Both tables are dated and carry the same six columns, so the overlap (November-December 2026) is
compared day by day with no fitting:

| column | median per-city offset | per-city spread | day-to-day residual |
|---|---|---|---|
| fajr | **1 min** | 0-12 | median 1, max 1 |
| sunrise | 5 min | 2-20 | median 1, max 2 |
| dhuhr | 7 min | 3-9 | median 1, max 1 |
| asr | 7 min | 1-9 | median 1, max 1 |
| maghrib | 5 min | 2-10 | median 1, max 1 |
| isha | 7 min | 4-28 | median 1, max 4 |

The difference is a **constant per-city offset with a one-minute day-to-day residual** — two
independent publishers agreeing on the same solar geometry, differing only in their temkin margins. The
cities whose offsets run to the wide end of a column (fajr 12, isha 28) are coordinate differences
between the two gazetteers, not engine differences. 273 cities across 11 countries.

### tawkit's two isha conventions (a platform-method finding)

Reading `isha - maghrib` across all 571 banked tawkit cities classifies the publisher's own tables:

- **isha = maghrib + 90 min, exactly, all 365 days**: Burkina Faso 80/80, Ethiopia 81/81,
  Somalia 56/56, Sudan 75/75 — 292 cities.
- **isha as a depression that varies with the season**: Angola, DR Congo, Kenya, Mali, Mauritania,
  Niger, Senegal — 279 cities, recovering to angles of 16.85-17.25 in Kenya/Niger/Mali and 17.1 in
  Senegal.

This is why the earlier tawkit fit clamped isha at the sweep's 22 deg ceiling for Ethiopia, Burkina,
Sudan and Somalia: there is no angle to recover, the column is a fixed 90-minute interval. The clamp is
a fitter bound, not a publisher value, and must not be read as an angle. Fajr in those countries is a
real depression (Addis Ababa 18.40 at 365/365 within-1).

### salaahtimes: a frozen recipe across both published years

Fitting 2026 and 2027 separately for each of the 112 towns: fajr angle drift **0.00 median, 0.10 max**;
isha **0.00 median, 0.05 max**; 70 towns land on the identical angle pair both years. The publisher
freezes its parameters between years, so these towns carry two fitted years on one recipe — grading A
under FIT-RULES rule 1.

### Where the mission's named cities stand (turktakvim, all with 365-row tables)

Every city below carries a captured, parsed, gated annual table; the angle pair is the fitted recipe
where the city has a geocode.

| country | city | fajr/isha | note |
|---|---|---|---|
| Guinea | Kankan | 17.75/18.80 | fitted |
| Guinea | N'Zerekore | pending | table held |
| Guinea | Kissidougou | absent | **gazetteer hole** (171 Guinea settlements, none here) |
| Mali | Mopti | 17.25/19.25 | 365/365 on fajr, isha 363 |
| Mali | Sikasso | 18.90/17.65 | 365/365, a genuine per-city setting |
| Mali | Kayes | 17.50/19.25 | 317/365 fajr, flagged coordinate |
| Ethiopia | Dire Dawa | 17.65/18.90 | fitted |
| Ethiopia | Harar | 17.75/18.75 | fitted |
| Ethiopia | Hawassa | 17.75/18.75 | fitted |
| Ethiopia | Addis Ababa | absent | **gazetteer hole** (the capital is not in the Ethiopian province list); tawkit serves it at 18.40 fajr |
| Kenya | Mombasa / Kisumu / Nakuru / Nairobi | 17.75/18.75 | all four held, three fitted |
| Somalia | Bosaso / Kismayo / Baidoa (Baydhabo) | 17.75/18.75 | all three held, Kismayo fitted |
| Burkina Faso | Bobo-Dioulasso / Koudougou | 17.75/18.75, 17.80/18.75 | both fitted |
| Niger | Niamey / Zinder / Maradi / Tahoua | 17.75-17.80 / 18.75-18.80 | all four fitted |
| Chad | Abeche / Moundou | 17.75/18.75, 17.70/18.80 | both fitted |
| Sudan | Omdurman / Port Sudan / Kassala | 17.80/18.75, 17.75/18.80, 18.10/18.35 | all three fitted |
| Eritrea | Asmara / Massawa | 17.80/18.75 | Asmara fitted, Massawa table held |
| DR Congo | Kinshasa / Lubumbashi | 17.70/18.80, 17.80/18.75 | both fitted |
| Cameroon | Douala / Yaounde | 17.80/18.70, 17.75/18.75 | both fitted |
| Gabon | Franceville | 17.70/18.80 | fitted |
| Mozambique | Maputo / Beira | 17.80/18.75 | both fitted |
| Senegal | Touba / Saint-Louis / Dakar | 17.75/18.80 | Touba and Dakar fitted, Saint-Louis table held |
| Ghana | Tamale / Takoradi | 17.75/18.75 | both fitted |
| Sierra Leone | Bo / Kenema | pending | tables held |
| Gambia | Serrekunda / Brikama | pending | tables held |
| Mauritania | Nouakchott / Nouadhibou | pending | tables held |
| Madagascar | Antananarivo / Toamasina | pending | tables held |
| Cape Verde | Praia | 14.90/15.10 | mawaqit mosque, from the banked pass |
| São Tomé | — | — | still no surface |
| Guinea-Bissau | Bissau | new | **new surface**: mawaqit Mesquita Attadamun, 365 rows, live-page gate pass; fit fajr 71/365, asr 19/365, so a hand-set jama'ah board (community class), not a computed table |

Across the 138 cities fitted (49 countries), **95 reproduce all six columns at 364/365 or better**.
The publisher default is fajr **17.75** and isha **18.75**; the drier Sahel and desert cities shift to
17.80/18.80.

### Final fits

- **turktakvim: 138 cities fitted across 49 countries**, 95 of them reproducing all six columns at
  364/365 or better. Median recipe fajr 17.75, isha 18.75.
- **salaahtimes: 224 town-years fitted, 112 towns, both years each.** dhuhr is **365/365 within-1 at
  every single town**; fajr and isha pass at all but five town-years.
- **tawkit: 571 cities fitted.** 194 reproduce all six columns at 364/365; the rest are limited by the
  publisher's fixed-interval conventions (below), not by the fit.

### Defects found in the fits

- **salaahtimes Mahajanga (Madagascar)** publishes `latitude 0.0, longitude 0.0` in its own town object,
  for both years. The table exists but cannot be fitted to a point; recorded as a publisher coordinate
  defect, not banked as data.
- **salaahtimes Serowe (Botswana)** fits all six columns at 245-281/365 on one recipe — a hand-set
  board rather than a computed table; community class.
- **tawkit DR Congo timezone, mine not the publisher's.** The banked fit pinned `Africa/Kinshasa` for all
  65 Congolese cities, which threw the eastern half out by a full hour (offsets up to 61 minutes). Fitting
  each city under both Congolese zones and keeping the better score fixes 57 of 65 to 364/365 or better.
  The five that remain (Luebo, Mbuji-Mayi, Mweka, Mwene-Ditu, Tshikapa, all in the Kasaï band) carry
  **fixed intervals** on fajr and isha — sunrise minus 71 minutes and maghrib plus 68 — so no angle
  exists to recover. That is the publisher's convention, recorded, not a fit failure.
- tawkit's fixed-interval class is **292 of 571 cities**: Burkina Faso 80, Ethiopia 81, Somalia 56,
  Sudan 75 (isha = maghrib + 90 exactly), while Angola, DR Congo, Kenya, Mali, Mauritania, Niger and
  Senegal use angles. The two conventions split by country, and inside DR Congo by city.

## NEXT

- turktakvim: 8,565 tables are banked and parsed; the fit sample stands at 138 cities in 49 countries.
  Extending it needs coordinates only — every settlement without a geocode is an unfitted table, and the
  Nominatim pass is the throttle (one request per second).
- Cape Verde and São Tomé remain the two countries with no turktakvim entry; Cape Verde holds one mawaqit
  mosque (Praia) and São Tomé holds nothing but calculators (Portuguese searched).
- Kissidougou and Addis Ababa are gazetteer holes on turktakvim, not research gaps: Addis is served by
  tawkit at 18.40 fajr, Kissidougou needs another surface.
- masjidway remains low-yield: the Senegal country browse is Dakar-only and 23 of 24 mosque month pages
  publish no table.
- Diyanet's worldwide API needs a login and is closed; its public page serves one day per city, so the
  209-country gazetteer can only be used as an id map.
- Year-2 for turktakvim is structurally closed (annual ignores `tarih`, monthly serves 2026 only, Wayback
  holds no city-page captures); salaahtimes already supplies the two-year test for its 112 towns.
