# O1l-23 Turkey district layer — REPORT

Wave: O1l-23 (Turkey district layer, city-level round two). Workspace:
`$HOME/athan-gitree/census/o1l-city/o1l-23/`. Captured 2026-11-11. No repository edits.

Engine: adhan 4.4.6 (`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`),
`CalculationMethod.Turkey()` = fajr 18 / isha 17 with method adjustments sunrise -7,
dhuhr +5, asr +4, maghrib +7 (read from `lib/cjs/CalculationMethod.js`), `Rounding.None`,
second resolution formatted in `Europe/Istanbul`, then nearest-minute. TZ pinned, no clock read.

## 1. The enumeration door, and its two defects

Diyanet serves a per-ilce table at `namazvakitleri.diyanet.gov.tr/tr-TR/{ilceId}`. Two doors
exist for the id space:

1. **The province page's own district select** — `<select name="stateRegion">` on
   `/tr-TR/{provinceCapitalId}` lists every ilce Diyanet publishes for that province, with ids.
   Captured for the eight provinces in `captures/ilce-select-*.html`, parsed to
   `data/ilce-index.json`.
2. **`GetDestinationUrl`**, the resolver the record credits (O1l-15r):
   `GET /Tr-tr/home/GetDestinationUrl?CountryName=TÜRKİYE&StateName=<İL>&StateRegionName=<İLÇE>&Culture=tr-TR`
   → `{"IlceId":"9542"}`. Raw responses in `captures/ilce-resolve.txt` (198 calls, all `Result: ok`).

Both doors were walked for all 198 administrative districts of the eight provinces
(`data/admin-districts.json`, from the Turkish Wikipedia province navboxes; counts match the
administrative registers: İstanbul 39, Ankara 25, İzmir 30, Konya 31, Bursa 17, Antalya 19,
Diyarbakır 17, Erzurum 20).

**Defect A — the resolver returns the province capital for a district that has its own table.**

| district | resolver | own table | evidence |
| --- | --- | --- | --- |
| Çubuk (Ankara) | 9206 | 9211 | dropdown lists 9211 |
| Seferihisar (İzmir) | 9560 | 9566 | dropdown lists 9566 |

**Defect B — the resolver returns the province capital for a name it fails to match, where a
table exists.** Arnavutköy (İstanbul) resolves to 9541, yet `/tr-TR/9535` is its own table and
the two differ on 365 of 366 days. A resolver fallback is therefore not evidence of absence.

Consequence: the resolver is a reproducible door for *finding* an ilce id, never an enumeration
of the id space, and never a negative test. The district select is the authoritative list, and
the 9542-Kartal warning in the record should carry this caveat.

## 2. What the district layer actually is

Diyanet publishes a separate table for **144** of the 198 administrative districts sampled, plus
one province table each (152 pages). The rest resolve to the province table and are absent from
the publisher's own dropdown:

| province | admin districts | own tables | resolve to province table |
| --- | --- | --- | --- |
| İstanbul | 39 | 18 | 21 |
| Ankara | 25 | 16 | 9 |
| İzmir | 30 | 20 | 10 |
| Konya | 31 | 31 | 0 |
| Bursa | 17 | 13 | 4 |
| Antalya | 19 | 15 | 4 |
| Diyarbakır | 17 | 13 | 4 |
| Erzurum | 20 | 18 | 2 |

The layer is not one table per administrative district. It is one table per district whose point
Diyanet judges to need one. İstanbul's core (Fatih, Kadıköy, Beşiktaş, Üsküdar, Bakırköy, Şişli,
Beyoğlu and the rest of the historic peninsula and near suburbs) has no own table, while the
outer belt (Şile, Çatalca, Silivri, Tuzla, Kartal, Pendik) does. Konya is the opposite extreme:
all 31 districts carry their own table.

Capture: 152 pages, 55,480 dated rows, 365 days each (2026-01-01..2026-12-31), zero missing
days, no 2027 string on any page. Raw HTML in
`captures/tr-2026-<province>--<district>-<ilce>.html`, normalized rows in
`data/tr-2026-<province>--<district>.json`, manifest `data/capture-manifest.json`.

## 3. District table vs province table — the deviation distribution

Every district table differenced against its own province capital's table, 365 days x 6 columns
(`data/deviation.json`, flat in `data/deviation-flat.json`):

| statistic | value |
| --- | --- |
| districts | 144 |
| min (district mean abs diff) | 0.03 min — Konya Karatay |
| median | 1.76 min |
| mean | 2.11 min |
| max | 6.76 min — Konya Halkapınar |
| worst single cell | 11 min — Konya Kulu, Erzurum Olur |
| identical cells, median district | 5.5% |
| identical cells, best district | 96.9% — Konya Karatay |
| districts with zero identical cells | 47 of 144 |
| districts identical to their province table | 0 (minimum 57 differing days) |

Histogram of the per-district mean absolute difference:

| band (min) | districts |
| --- | --- |
| 0-0.25 | 3 |
| 0.25-0.5 | 4 |
| 0.5-0.75 | 9 |
| 0.75-1 | 18 |
| 1-1.5 | 26 |
| 1.5-2 | 22 |
| 2-3 | 23 |
| 3+ | 39 |

The Kartal datum reproduces exactly — 0.837 min against O1l-15r's 0.84 — and sits at the 16th
percentile of this distribution: 23 of 144 districts are at or below it. Kartal, Pendik and
Çekmeköy are all inner-belt, and the inner belt is the low end. Per-prayer mean
absolute difference is flat across the six columns (fajr 2.21, sunrise 2.08, dhuhr 2.00, asr
2.06, maghrib 2.08, isha 2.25 min) and the signed bias is uniformly small (-0.30..-0.17 min).
No column carries a systematic margin of its own.

Per province:

| province | districts | dev median | dev max | fit within-1 median | fit within-1 min |
| --- | --- | --- | --- | --- | --- |
| İstanbul | 18 | 1.05 | 2.92 | 96.4% | 91.9% |
| Ankara | 16 | 2.06 | 6.00 | 97.4% | 95.4% |
| İzmir | 20 | 1.49 | 4.27 | 97.9% | 97.3% |
| Konya | 31 | 2.12 | 6.76 | 98.4% | 71.9% |
| Bursa | 13 | 0.99 | 2.82 | 96.8% | 96.6% |
| Antalya | 15 | 3.06 | 6.51 | 98.7% | 98.3% |
| Diyarbakır | 13 | 1.84 | 3.70 | 98.4% | 98.1% |
| Erzurum | 18 | 2.33 | 4.37 | 97.9% | 72.4% |

## 4. Coordinate refinement or per-district margins?

**(a) The seasonal signature.** A coordinate shift moves dhuhr by a near-constant offset
(longitude) while fajr and isha swing seasonally (latitude). Antalya/Alanya vs Antalya:

| month | fajr | dhuhr | isha |
| --- | --- | --- | --- |
| Jan | -5.52 | -5.32 | -4.90 |
| Apr | -4.33 | -5.33 | -6.20 |
| Jul | -3.71 | -5.35 | -7.03 |
| Oct | -5.23 | -5.26 | -5.48 |

Dhuhr is constant to 0.09 min across the year; the twilight columns swing 1.8 and 2.1 min.

**(b) The difference-space residual.** For each district the observed difference (district table
minus province table) is compared with the model difference (adhan at the district's gazetteer
point minus adhan at the province capital's point). A pure coordinate refinement leaves only
rounding noise.

| statistic | value |
| --- | --- |
| min | 0.064 min |
| median | 0.264 min |
| mean | 0.276 min |
| max | 1.161 min — Konya Yunak |
| districts under 0.25 | 40 |
| 0.25-0.5 | 101 |
| 0.5-1 | 1 |
| 1-1.5 | 2 |

Correlation of the observed deviation with the coordinate offset: |dlon| 0.984, distance from
the capital 0.865, |dlat| 0.211. The layer's deviation is a longitude effect with a latitude
seasonal term: coordinates, not margins.

Three districts carry the whole tail. Yunak (Konya), Aziziye (Erzurum) and Beylikdüzü (İstanbul)
sit 20-30 km from the point that reproduces their table; with the point moved to the grid's
best fit they score 0.40-0.45 MAE like the rest (`data/fit-districts.json`, `anchor` field).
That is a publisher-point disagreement, not a recipe difference.

## 5. The fit at district coordinates

One recipe, adhan `Turkey()` at each district's own gazetteer point, 144 districts x 365 days x
6 columns = **315,360 cells**:

| metric | value |
| --- | --- |
| MAE | 0.425 min |
| within 1 min | 97.35% |
| exact | 60.24% |
| worst cell | 3 min |
| per-district MAE | min 0.358, median 0.41, max 1.187 |
| districts at >=95% within-1 | 141 of 144 |
| districts at >=90% | 142 of 144 |
| districts below 85% | 2 (Yunak 71.9%, Aziziye 72.4%) |

Per prayer: fajr 0.11 / sunrise 0.16 / dhuhr 0.11 / asr 0.73 / maghrib 0.62 / isha 0.81 MAE,
worst 3 each. Signed bias per prayer -0.05..-0.02 min; only Yunak (-1.19) and Aziziye (+1.07)
exceed 0.3 min, both the point-disagreement cases above.

Span: 365 days per district, one published cycle (2026). Between-year stability is untestable
from this wave: no second year is served publicly (O1l-15r's 2027 probe stands). Seasonal
amplitude, July minus January at the same district: fajr -188 min (Arnavutköy) to -151 min (Kaş),
isha +143 to +178 min, across latitudes 36.20-41.18 N.

**Verdict: the recipe stays one.** Every district table is the province recipe evaluated at the
district's own point, at 97.35% within-1 and worst 3 min, which is the same quality the province
centres scored (95.2-99.4%). The district layer is a coordinate refinement, not a second
arithmetic.

## 6. Coordinates

`data/district-coords.json` — 198 administrative districts of the eight provinces, lat/lon to 4
decimals, each with the Nominatim display name for provenance; raw responses in
`captures/nominatim-districts.json`. The resolver carries no coordinate (the page has no lat/lon,
no map attribute, no `enlem`/`boylam` string), so the ledger's points come from a gazetteer keyed
by district name and province, exactly as O1l-15r resolved the province centres.

One gazetteer defect was caught and corrected (`data/coords-corrections.json`): Nominatim returns
Antalya city for "Alanya, Antalya", so every hit was validated against the first token of its
display name; the Alanya point is now 36.5437/32.0019.

## 7. Negatives and defects

- 54 of the 198 administrative districts have no own table (section 2). The publisher states this
  through its own dropdown; it is not a capture failure.
- No 2027 row exists on any of the 152 pages; the year selector is absent from the markup.
- `GetDestinationUrl` under-reports (defects A and B). A resolver-only sweep would miss Çubuk and
  Seferihisar and would record Arnavutköy as having no table.
- Yunak, Aziziye and Beylikdüzü: the table's own point is 20-30 km from the gazetteer centroid.
  Not adjudicated; recorded with the recovered point.

## 8. What this confirms and what is new

**Confirms** the O1l-15r one-recipe verdict at 144 more points (315,360 cells, 97.35% within-1,
worst 3), and confirms that the 0.84 min Kartal figure is a sample from the low end of a
distribution whose median is 1.76 min and whose tail reaches 6.76 min. No deviating district, no
per-district margin set, no second arithmetic anywhere in the layer.
**New:** (1) the district select as the authoritative id enumeration, with the resolver's two
defects dated and evidenced; (2) the shape of the district layer — 144 tables over 198
administrative districts, İstanbul 18 of 39, Konya 31 of 31; (3) the deviation distribution and
its longitude signature (r 0.984); (4) the pure-refinement residual (median 0.264 min) that
settles coordinate-versus-margins for the whole layer; (5) the district coordinate ledger
(198 points); (6) 55,480 dated district rows.

Grade effect: none. One published cycle, so the district layer is provisional evidence that
widens the A-grade recipe's point coverage; it cannot lift the country's year count.
