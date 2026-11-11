# O1l-3 — Indonesia city-level: 38 provincial capitals, Kemenag SIHAT + Muhammadiyah KHGT

Agent O1l-3, 2026-11-11. Workspace: `census/o1l-city/indonesia-cities/`.

## Surfaces

| Surface | Endpoint | Shape | Tier |
|---|---|---|---|
| Kemenag SIHAT | `GET bimasislam.kemenag.go.id/api/v1/public/prayer-times?city_id=&date=` | one date per GET; `source: precompute:v1`, `calculated_at 2026-06-03` | authority (Ministry of Religion) |
| Muhammadiyah KHGT | `POST api-khgt.muhammadiyah.or.id/api/sholat/schedule {lat,lng,date,mode:monthly_masehi}` | one month per POST, keyless, any coordinate | authority (Majelis Tarjih dan Tajdid PP Muhammadiyah) |

Raw artifacts: `captures/sihat-raw-banda-aceh-2026-01-01.json`, `captures/sihat-raw-banda-aceh-2026-07-01.json`,
`captures/khgt-raw-banda-aceh-2026-01.json`, plus the banked O1k captures copied beside them
(`*-banked-o1k.json`). Fresh reference captures: `captures/kemenag-provinces-fresh.json`,
`captures/kemenag-cities-*.json`.

## Reference-data findings (new)

- The fresh provinces endpoint lists **38 provinces** — the mission's 36 named plus **BENGKULU (17)** and **LAMPUNG (18)**. No province newer than the 2022 Papua partition is present.
- The `cities?province_id=` filter is **ignored** (returns the whole 516 every call); the join runs locally on each city's `province_id`.
- **Reference gap:** PAPUA TENGAH, PAPUA PEGUNUNGAN and PAPUA SELATAN exist in the provinces table but carry **0 regencies** — every regency still files under pre-split PAPUA / PAPUA BARAT. The three capitals (Nabire, Wamena/Jayawijaya, Merauke) resolve by name from the flat 516. PAPUA BARAT DAYA (Sorong) is properly filed.
- 516 regencies total, identical to the O1k banked capture. Regency count stable, no new splits.

## Coverage map: province -> capital regency -> rows / verdict

38 provinces, 38 capitals, both publishers COMPLETE. Per-city fit detail (per-column scores, margins,
amplitude, gap stats, highland checks): `data/fits.json`; margin sweeps: `data/per-city-margins.json`,
`data/fine-margins.json`. Both harvesters are resumable (`harvest_sihat.py`, `harvest_khgt.py`).

Fit recipes held fixed across everything:
- SIHAT: fajr 20 deg +2 floor, isha 18 deg +2 floor, dhuhr +3 floor, asr +2 floor, maghrib/sunrise +3/-3 floor at sea level with an elevation dip term (below).
- KHGT: fajr 18 deg, isha 18 deg, +1..2 floor (sub-minute engine residue), sunrise -1 / maghrib +2 floor at sea level with the same elevation dip term, asr +2 floor.

### Coverage map (all 38, both publishers complete)

SIHAT rows = 2026; KHGT = 2026+2027. PASS = both publishers reproduce their recipe within-1 at 100% (SIHAT exact-or-1 everywhere, worst 1).

| Province | Capital regency | SIHAT rows | KHGT rows | Verdict |
|---|---|---|---|---|
| ACEH | Kota Banda Aceh | 365 | 365+365 | PASS |
| BALI | Kota Denpasar | 365 | 365+365 | PASS |
| BANTEN | Kota Serang | 365 | 365+365 | PASS |
| BENGKULU | Kota Bengkulu | 365 | 365+365 | PASS |
| D.I. YOGYAKARTA | Kota Yogyakarta | 365 | 365+365 | PASS |
| DKI JAKARTA | Kota Jakarta Pusat | 365 | 365+365 | PASS |
| GORONTALO | Kota Gorontalo | 365 | 365+365 | PASS |
| JAMBI | Kota Jambi | 365 | 365+365 | PASS |
| JAWA BARAT | Kota Bandung | 365 | 365+365 | PASS (dip: SIHAT rise-set -6/+7) |
| JAWA TENGAH | Kota Semarang | 365 | 365+365 | PASS |
| JAWA TIMUR | Kota Surabaya | 365 | 365+365 | PASS |
| KALIMANTAN BARAT | Kota Pontianak | 365 | 365+365 | PASS |
| KALIMANTAN SELATAN | Kota Banjarmasin | 365 | 365+365 | PASS |
| KALIMANTAN TENGAH | Kota Palangkaraya | 365 | 365+365 | PASS |
| KALIMANTAN TIMUR | Kota Samarinda | 365 | 365+365 | PASS |
| KALIMANTAN UTARA | Kab. Bulungan (Tanjung Selor) | 365 | 365+365 | PASS |
| KEPULAUAN BANGKA BELITUNG | Kota Pangkal Pinang | 365 | 365+365 | PASS |
| KEPULAUAN RIAU | Kota Tanjung Pinang | 365 | 365+365 | PASS |
| LAMPUNG | Kota Bandar Lampung | 365 | 365+365 | PASS |
| MALUKU | Kota Ambon | 365 | 365+365 | PASS |
| MALUKU UTARA | Kota Ternate | 365 | 365+365 | PASS |
| NUSA TENGGARA BARAT | Kota Mataram | 365 | 365+365 | PASS; SIHAT renders WIB clock (civil hour early), KHGT serves UTC+8 |
| NUSA TENGGARA TIMUR | Kota Kupang | 365 | 365+365 | PASS; SIHAT renders WIB clock (civil hour early), KHGT serves UTC+8 |
| PAPUA | Kota Jayapura | 365 | 365+365 | PASS; plain 20/18 |
| PAPUA BARAT | Kab. Manokwari | 365 | 365+365 | PASS; plain 20/18 |
| PAPUA BARAT DAYA | Kota Sorong | 365 | 365+365 | PASS; plain 20/18 |
| PAPUA PEGUNUNGAN | Kab. Jayawijaya (Wamena) | 365 | 365+365 | PASS; plain 20/18 at 1,668 m — the boundary case |
| PAPUA SELATAN | Kab. Merauke | 365 | 365+365 | PASS; plain 20/18 |
| PAPUA TENGAH | Kab. Nabire | 365 | 365+365 | PASS; plain 20/18 |
| RIAU | Kota Pekanbaru | 365 | 365+365 | PASS |
| SULAWESI BARAT | Kab. Mamuju | 365 | 365+365 | PASS |
| SULAWESI SELATAN | Kota Makassar | 365 | 365+365 | PASS |
| SULAWESI TENGAH | Kota Palu | 365 | 365+365 | PASS |
| SULAWESI TENGGARA | Kota Kendari | 365 | 365+365 | PASS |
| SULAWESI UTARA | Kota Manado | 365 | 365+365 | PASS |
| SUMATERA BARAT | Kota Padang | 365 | 365+365 | PASS |
| SUMATERA SELATAN | Kota Palembang | 365 | 365+365 | PASS |
| SUMATERA UTARA | Kota Medan | 365 | 365+365 | PASS |

### KHGT verdict (all 38 capitals, both years)

- 76 city-years, 27,740 dated rows, zero gaps (365 rows per city-year).
- fajr and isha: within-1 **100%** in every city-year (worst 1), exact ~52% at any single integer margin — the per-city argmax splits +1.00/+2.00 (fajr: 17 cities +1, 21 +2) and flips on 6 cities between 2026 and 2027: a sub-minute engine difference, not a convention.
- asr +2 floor: within-1 99.9%+ (worst 2 on two cities). Sunrise/maghrib: the margin tracks KHGT's OWN elevation lookup exactly as the geometric horizon dip 1.76*sqrt(h) arcmin: flat cities -1/+2; yogyakarta (105 m) -2/+3; kupang (193 m) -2/+3; padang (297 m per KHGT) -3/+4; manokwari (265 m) -3/+3; bandung (689 m) -4/+5; jayawijaya (1,704 m per KHGT) -6/+7.
- Between-year stability: FROZEN — sunrise/asr/maghrib argmax identical in all 38 cities; fajr/dhuhr/isha flips confined to the 1-vs-2 tie.
- Zones: KHGT serves each coordinate in its own civil zone (meta `timezone` 7/8/9; Mataram and Kupang served at UTC+8 — see the SIHAT zone finding below).

### The Kemenag-KHGT gap (per city, daily, 2026)

- fajr: KHGT subuh prints **+8 min later than Kemenag fajr, median exactly 8.0 on every city so far, band [7..9]** — the record's "about 8 min constant" CONFIRMED at capital level, 365 days per city.
- isha: KHGT 0..1 min EARLIER than Kemenag (the two isha columns nearly coincide; 18+2 vs 18+1..2).
- dhuhr: Kemenag +1..2 later; sunrise: KHGT +2 later; maghrib: KHGT 1 min earlier (both dip-corrected at elevation cities).

### SIHAT verdict (all 38 capitals, 2026 complete)

- 38 city-years, **13,870 dated rows, zero gaps** (365 per city; 365 x 38 exact).
- Recipe columns at the record's pair: fajr 20 deg +2 floor = **13,812/13,870 exact (99.6%), within-1 100%, worst 1**; isha 18 deg +2 floor = **13,790/13,870 exact (99.4%), within-1 100%, worst 1**. Per-city range 359-365/365 exact; no city misses the recipe.
- FULL column convention (NEW, swept, all floor): fajr +2, dhuhr **+3**, asr **+2**, isha +2, sunrise -3 / maghrib +3 at sea level with the elevation dip (below). Full-convention pooled: dhuhr 99.9% exact, asr 83.7% exact (within-1 100%), sunrise 67.0% exact (within-1 99.86%, worst 2), maghrib 70.8% exact (within-1 100%).
- Between-year stability: single year served (2027 refused — below); within 2026 the convention is constant across all 38 cities and all 365 days (no seasonal margin drift beyond the dip).
- Seasonal amplitude (Jan vs Jul printed fajr span): 31 min (Manado, Bulungan) to 53 min (Kupang) — near-equator, latitude-ordered, no outlier. Logged per city in `data/fits.json` (`sihat.amplitude`).
- Provenance carried on every row: `source: precompute:v1`, `calculated_at 2026-06-03` — one national precompute, matching the O1k record.

### SIHAT 2027: honest negative (probed, not assumed)

`?city_id=...&date=2027-01-01` and `2027-06-15` both return **404 "prayer times not found for the given city and date"**; 2026-12-31 serves normally. The precompute ends exactly at 2026-12-31. Raw probe: `captures/sihat-2027-boundary-probe.txt`. Kemenag city-level remains a ONE-YEAR surface; year-2 lives with KHGT.

### The elevation dip: both national lines carry it

NEW characterization. Both publishers correct sunrise and maghrib for the horizon dip at the
city elevation, magnitude matching 1.76*sqrt(h) arcmin: SIHAT bandung (720 m reference field)
sunrise -6.00 / maghrib +7.00 vs its flat -3/+3; KHGT the same shape on its own lookup.
The angle columns (fajr/isha) and dhuhr/asr carry NO elevation term. This is the Tunisia
elevation-ladder class in a second and third form: a publisher-side physical term, not a
convention — and the two publishers compute it from DIFFERENT elevation fields (e.g. padang:
SIHAT field 6 m, KHGT lookup 297 m), so their rise/set columns diverge at elevation cities
even with identical geometry.

### SIHAT reference-table zone finding (Mataram, Kupang) — DEFECT CLASS: wrong-zone render

Kemenag's cities table files KOTA MATARAM and KOTA KUPANG under **Asia/Jakarta (UTC+7)**
while both cities live in the WITA zone (UTC+8); KHGT serves both at UTC+8 with meta
`timezone: 8`. SETTLED BY MEASUREMENT: SIHAT renders both cities ON THE WIB CLOCK —
Mataram dhuhr 11:22 (civil 12:22), Kupang dhuhr 10:52 — correct instants, civil hour early.
Zone-normalized, both reproduce the national recipe exactly (fajr 20/18+2 floor scores
normally against a UTC+7-localized model). A consumer reading SIHAT raw for either capital
fires every prayer 60 minutes early all year: a feed-gate/display-rule defect in the
authority's own service, same class as the Chile belongsToDate trap.

## The 21/19 highland check on the capital set

The six deep regencies (Intan Jaya 2,168 m, Lanny Jaya 2,001 m, Paniai 1,786 m, Pegunungan Arfak 1,960 m, Puncak 2,346 m, Puncak Jaya 2,422 m) contain **no provincial capital**. Every Papuan capital in the set prints the plain national pair:

| Capital | Province | Elevation | Implied fajr depth (4 dates) | Class |
|---|---|---|---|---|
| Kota Jayapura | Papua | 19 m | 19.40-19.65 | plain 20/18 |
| Kab. Manokwari | Papua Barat | 11 m | 19.54-19.64 | plain 20/18 |
| Kota Sorong | Papua Barat Daya | 8 m | 19.38-19.59 | plain 20/18 |
| **Kab. Jayawijaya (Wamena)** | **Papua Pegunungan** | **1,668 m** | **19.47-19.62** | **plain 20/18** |
| Kab. Merauke | Papua Selatan | 5 m | 19.42-19.65 | plain 20/18 |
| Kab. Nabire | Papua Tengah | 12 m | 19.44-19.66 | plain 20/18 |

- **Jayawijaya is the boundary test and it lands plain**: 1,668 m sits below the 1,786 m threshold, and its printed rows score 364/365 exact, within-1 100%, on the plain 20/18+2 recipe — matching Deiyai's plain reading at 1,718 m and the record's threshold placement (Deiyai plain, Paniai deep).
- **No seventh member among the capitals**: all 38 capitals (32 non-Papuan included) reproduce plain 20/18+2; none prints the deep pair. The deep six remain exactly the six non-capital regencies of the O1k record. CONFIRMED.
- Cross-check: Muhammadiyah at Wamena prints plain 18/18 (its decade-deep national rule), consistent with sea2's Puncak Jaya verdict — the 21/19 rule is Kemenag's alone.

## Verdict summary

| Object | Verdict | Grade language |
|---|---|---|
| Kemenag SIHAT city-level | 20/18 +2 ihtyati floor CONFIRMED at all 38 provincial capitals, 13,870 rows, worst 1; NEW full convention (+3 dhuhr, +2 asr, -3/+3 rise-set, elevation dip); 2027 refused (404) | provisional, now confirmed capital-wide (span: one published year, 38 points) |
| Muhammadiyah KHGT city-level | 18/18 floor +1..2 (sub-minute engine residue), within-1 100% on 27,740 rows across 2026+2027, frozen between years | second-line A-grade span extended from 3 to 38 latitudes x 2 years at city level |
| Kemenag-KHGT fajr gap | **8.0 min constant, every city, band [7..9], 365 days each** | the two national lines are DATED OUTPUT, confirmed capital-wide |
| 21/19 highland rule | plain 20/18 on all six Papuan capitals incl. Wamena 1,668 m; no seventh member | record confirmed at the capital layer |
| SIHAT wrong-zone render | Mataram + Kupang print on a WIB clock, civil hour early all year | NEW defect (feed-gate class), owner-visible |

Totals: 41,610 dated rows banked (13,870 SIHAT + 27,740 KHGT), zero parse failures, zero gap days.

## Honest negatives

- `cities?province_id=` filter ignored by the API (returns all 516 each call); harmless, join done locally.
- SIHAT serves no 2027 (404 at the boundary; probe saved). Not retried per-date: the precompute table simply ends.
- SIHAT reference gap: the three new Papua provinces carry 0 regencies (capitals resolved by name); PAPUA BARAT DAYA is properly filed.
- Languages searched: Bahasa Indonesia and English (API surfaces; no forum/community material harvested — nothing else was needed for this layer).

