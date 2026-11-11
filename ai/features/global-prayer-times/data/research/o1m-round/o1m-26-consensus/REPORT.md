# O1m-26 — the engine-consensus matrix

Wave O1m-26, round o1m. Workspace `$HOME/athan-gitree/census/o1m/o1m-26-consensus/`. Local analysis
over banked tables: nothing crawled, no page read, no clock read. Engine adhan 4.4.6
(`$HOME/athan-gitree/census/adhan-build/node_modules/adhan`), `Rounding.None`, its own `SolarTime`
core, dates from the rows, zones pinned.

Deliverables: `ENGINE-CONSENSUS.md` (the matrix, the classes, the three contested conventions),
`data/engine-consensus.json` (full per-country record), `data/engine-consensus-matrix.json` (one row
per country), `data/engine-consensus-summary.json` (aggregates), `data/measure.json` (per
family-per-country fits, offsets, city points), `data/special.json` (US/China, Iran, Saudi).
Scripts in `scripts/`: `lib.mjs` (loaders), `engine.mjs` (adhan core), `measure.mjs` (fits),
`consensus.mjs` (crosspoint matrix), `special.mjs`, `report.mjs`.

## 1. What was read, and from where

No new capture. Every table came from a wave that had already banked it:

| family | source workspace | tables | what it carries |
| --- | --- | --- | --- |
| Diyanet | `o1m/o1m-r7-diyanet/data/cities/` + `fit/city_lat.json` | 8,537 cities, 203 countries, 3.12 M rows | civil year 2026, eight columns, no coordinates |
| tawkit | `o1m/o1m-3-platforms/data/tawkit/` | 8,708 cities, 75 countries, 3.18 M rows | 2026-11 to 2027-10, six columns, published coordinates |
| athanpro | `o1l-city/athanpro/data/` + `universe.tsv` | 2,689 cities, 231 countries, 80,670 rows | one frozen September 2026 cycle |
| masjidi | `o1l-city/masjidi/data/tables/` | 167 tables, 24 countries, 61,122 rows | 366-day scaffold, no year, no coordinates |
| turktakvim | `o1m/o1m-1-fallback/data/tt/` + `coords.json` | 73 geocoded tables, 9 countries, 26,645 rows | civil year 2026, eight columns |

## 2. Method, in five steps

1. Measure every table at its own point: published minus engine, per column, per date, wrapped to
   ±720 minutes.
2. Sample up to eight cities per country stratified by latitude, two dates per month.
3. Fit each country's convention: twilight angles, maghrib depression, asr shadow factor, and an
   integer-minute margin per column. An isha printed as an interval is identified from the constant
   isha-minus-maghrib gap, not from the fit.
4. Move every family to one crosspoint per country, at a median-latitude city, on 2026-09-15, and
   take the per-column offset against a shared 18/17 Shafi base.
5. Remove a whole-hour step when all six columns carry one (a fixed clock), and record it.

Diyanet publishes neither coordinates nor a zone, so its points were solved: latitude from the r7
day-length fit, longitude from the sunrise/maghrib midpoint (the temkin is symmetric about noon),
zone from the nearest gazetteer city of that zone. Against the published coordinates of other
families the solved point lands at a median of **9 km**, 90 per cent within 140 km.

**Validation.** The crosspoint synthesis reproduces the measured per-city medians to a median of
0.1 minutes and a 90th percentile of 0.2 to 0.7 minutes on every family. The matrix is a measurement
moved to a common place, not a model projection.

**Independent reproduction of O1m-13.** That wave measured turktakvim against Diyanet at seven
tropical cities over thirty days and got fajr +1, sunrise +3, dhuhr +2, asr +3, maghrib −1, isha +7.
The crosspoint ladder over nine countries gives +0.5, +2.5, +2.0, +3.0, −1.4, +5.9. Two methods, two
samples, one answer.

## 3. Counts

- 232 countries carry at least one family; 202 carry two or more; **184 keep two or more past the
  one-recipe gate** and enter the matrix. 30 are single-family, 18 not comparable.
- Classes: **ONE CONVENTION 3**, **MARGIN DISPUTE 107**, **CONVENTION DISPUTE 74**, NOT COMPARABLE
  18, SINGLE 30.
- Family sets: Diyanet+athanpro 117, Diyanet+tawkit+athanpro 39,
  Diyanet+tawkit+masjidi+athanpro 8, Diyanet+turktakvim+athanpro 7, Diyanet+tawkit 6,
  tawkit+athanpro 2, tawkit+masjidi+athanpro 2, turktakvim+athanpro 2,
  Diyanet+masjidi+athanpro 1.
- Countries with three or more families: 57. With four: 8. With all five: none.

## 4. The disputes named

**The margin ladder is the largest disagreement in the set, and it is one publisher's.** Diyanet's
margins across 193 countries: sunrise −7.0 (p10 −7.1, p90 −6.9), dhuhr +5.0, asr +4.0, maghrib +6.9.
turktakvim carries a second ladder: sunrise −4.5, dhuhr +7, asr +7, maghrib +5.5, isha +7.3. tawkit,
masjidi and athanpro print ≈0. This makes sunrise differ by more than 4 minutes in 178 of 184
countries, maghrib in 175 and dhuhr in 169, while the geometry agrees.

**The geometry is one convention.** fajr angle within 1° in 163 of 184 countries (within 0.5° in
158); isha angle within 1° in 131.

**Asr school** splits five countries cleanly — pakistan 55.1, uzbekistan 53.5, kyrgyzstan 53.0,
kazakhstan 52.5, grenada 62.3 — always tawkit Hanafi against Diyanet and athanpro Shafi, flat with
latitude. A sixth (united-kingdom, 49.2) is recorded and not claimed, because tawkit's British layer
is a blend of per-city recipes.

**Isha** carries two disputes. Model: tawkit resolves isha to maghrib + 90 in nine countries, and in
tanzania, the one that survives the gate on both sides, the interval sits 25.1 minutes from the
angle. Angle: a high-latitude ladder of 8 to 11 minutes (sweden 11.0 at Diyanet 16.0 against
athanpro 17.0; lithuania 9.9; poland 8.8), shrinking to 3 to 5 in the Gulf and South Asia.

**Fajr** departs in nineteen countries, and the membership inverts: egypt 6.6 has tawkit (19.40) and
athanpro (19.45) together against Diyanet (17.95), while nigeria 5.6, ivory-coast 5.3 and angola 6.1
have tawkit alone (19.35 to 19.50) against the other two at 18.00.

**Not comparable, 18 countries.** Chiefly athanpro's mosque-source pages failing their own gate:
Ireland 7 of 10 mosque, Germany 8 of 10, the Netherlands 9 of 10, Martinique 10 of 10, Mauritius 9
of 9. The exclusion is recorded per country in the JSON.

## 5. The three contested conventions

- **US/China isha 18/16**: confirmed at Diyanet, and only there. China solves at exactly 18.00/16.00;
  the US at 18.05/15.85. athanpro holds 18.00/17.05 in both. tawkit publishes isha as maghrib + 90
  in China and its US layer does not fit one recipe (loss 10.46).
- **Iran maghrib depression**: no family in the set carries it. Diyanet +6.9 margin, tawkit +0.1,
  athanpro 0.0, all on the horizon. The 4.5° depression stays with pishkhanak, the sixth publisher
  that is not in this matrix.
- **Saudi Ramadan +120**: reproduced exactly by masjidi — 25 Saudi tables, ordinary gap 90, Ramadan
  gap 120 for 31 days whose scaffold dates fall 2028-02-18 to 2028-03-19. tawkit holds a flat +90
  in 203 of its 204 Saudi cities with no step at Ramadan 2027. Diyanet publishes an angle (gap 68.5),
  athanpro a flat +90.

## 6. Defects recorded, not corrected

1. **A solved point absorbs a defective clock.** Diyanet's Birobidzhan page prints 11:14 at dhuhr
   where Vladivostok's own noon is 13:18; the solve moves the city rather than flagging the page.
   4 per cent of Diyanet's sampled points sit beyond 300 km of the nearest gazetteer city and should
   be read as solved positions.
2. **One month cannot separate an angle from an interval in the tropics.** athanpro's isha is
   recorded as an angle except where the gap equals a published constant; several of its tropical
   pages are ambiguous and the offset, not the model, is the citable number.
3. **A country fit can hide a per-city recipe mix.** tawkit's British, German and New Zealand layers
   do not reduce to one convention; Germany and New Zealand fail the gate outright, and the UK passes
   with a 27.7-minute fajr margin that means the blend is being absorbed. Recorded, not claimed.
4. **masjidi's year is a scaffold.** Its 366 rows are indexed on a leap year and its Ramadan window is
   stated in scaffold dates; the wave does not promote that to a calendar claim.

## 7. NEXT

For the closing fit index and the world table:

1. **The margin ladder is a per-family, per-column attribute** and should ride with every family's
   record: Diyanet (−7 / +5 / +4 / +7), turktakvim (−4.5 / +7 / +7 / +5.5 / +7.3), the computed
   platforms (0). A country record that names a publisher without its ladder misstates that
   publisher by up to 7 minutes on three columns.
2. **The multi-family agreement column** for the world table: the class and the widest column per
   country, from `data/engine-consensus-matrix.json`. 184 countries carry it.
3. **The fit index should carry the six asr-school countries** (pakistan, uzbekistan, kyrgyzstan,
   kazakhstan, grenada; the UK unclaimed) as a named convention split, and the nine tawkit interval
   countries as a named isha model.
4. **Open for the next round**: (a) athanpro Qatar prints an 18/17 label over a median 90-minute gap
   (72 to 90 across five mosques) — label-versus-rule, worth a dedicated check; (b) turktakvim's 2,391 tables are geocoded at only 73
   points, so its layer enters this matrix thin — a geocode pass would lift nine countries to a
   proper comparison; (c) Diyanet's Russian and Chinese far-east pages need a per-page clock check,
   since the point solve masks a wrong clock; (d) masjidi's Ramadan +120 is the strictest Umm al-Qura
   witness in the set and deserves its own note in the Saudi record.
5. **No country is complete.** The 30 single-family countries are the obvious next targets — a second
   family in any of them converts a row of the world table into a measured agreement.
