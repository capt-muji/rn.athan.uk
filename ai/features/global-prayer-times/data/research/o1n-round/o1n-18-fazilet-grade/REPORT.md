# O1n-18: the Fazilet family grade — tier-A close, whole-list grade, index placement

Wave o1n-18, round o1n, 2026-11-11. Mission: finish the Fazilet family (faziletcalendar.com,
publisher Fazilet Nesriyat) — the tier-A anchor walk, the family's grade over the whole
6,506-city list, and the family's index placement. Workspace `captures/`, `data/`, `scripts/`;
the inherited bank lives in `~/athan-gitree/census/o1n/o1n-13-fazilet/` (the walk's own
workspace). Engine: adhan 4.4.6 at `census/adhan-build/node_modules/adhan`, UTC timestamps
throughout. No subagents deployed. Nothing written to the repository.

## 1. The tier-A walk, closed

The coordinator's walker (`scripts/o1n13-walk.py data/plan-A-anchors.json A`, pid 40439)
finished at **20:33:09Z**: **8,976 of 8,976 slots** (204 anchors x months 01+07 x years
2026+2027 x eleven day steps), 1.05 s spacing, every request journalled. **Zero walk SHORTs;
one request error** (city 3120, 2027-01-01, read timeout — journaled, not refetched, one
missing day). This wave also walked the Ulaanbaatar special (city 737, 44 requests, 17:59Z)
into this workspace's `captures/fazilet-walk/`; the consolidator reads it as a third source.
Nothing was refetched; the 2,636 captures banked before the quota stop were skipped in place.

Consolidation: **230 cities, 30,055 city-dates** (15,107 in 2026, 14,948 in 2027); **230 fits**
in `data/fits/` (one file per city). The city list re-consolidates byte-stable: **6,506 unique
city ids, 211 layers, zero duplicates, zero empty layers**.

## 2. The family grade over the whole list

`data/grade-table-final.json` holds the full table; `data/report-country-table.md` is its
markdown. Numbers first:

- **Served:** 6,506 cities, 211 layers. **In scope:** 6,486 cities, 210 layers — one layer is
  excluded by id (owner order 2026-11-11, resolved at runtime from the round brief; 20 city
  ids; never named anywhere in any output).
- **Fit-verified:** **248 distinct cities** across **208 of the 210 in-scope layers**
  (walk bank 230, including O1n-9's 28 re-fitted with the o1n-13 solver; Africa bank 34;
  overlap 16).
- **Two distinct fitted recomputed years on one recipe: 245 cities.** One-year only: 3
  (Conakry, Kankan, Nouakchott — all door-side void years, named below). Per the grading rule
  the 245 are A-eligible evidence; the 3 are provisional, never A.
- **100 pc within-1 on every held year: 216 cities** (213 two-year clean at 99.9+ plus the
  3 one-year cities at 100 on their held year).
- **Within-1 departures: 32 two-year cities**, every one a named rule-form (section 5).

| family measure | value |
|---|---|
| served / in scope | 6,506 / 6,486 cities; 211 / 210 layers |
| fit-verified cities (union of three bases) | 248 (walk 230 + Africa 34 − overlap 16) |
| two-year fits (one recipe, both years) | 245 |
| one-year fits (provisional) | 3 |
| 100 pc within-1 on all held years | 216 |
| within-1 departures, all rule-form named | 32 |
| recipe band (230 fits) | fajr 17.5-20 deg / isha 17.5-20 deg at the 0.25 quantum, **Shafi 230/230** |
| offset | standard year-round at 228 fits; the civil-DST hypothesis wins at 2 (Białystok, Stockholm) |
| seasonal amplitude (fajr..isha span) | Jan 752-1,095 min, Jul 783-1,407 min — the latitude framing |

Per-country counts (served cities, two-year fits, one-year fits, Africa-attributed fits,
100 pc within-1, departures) are in `data/report-country-table.md` for all 208 verified
layers; the two layers with no verified city are Antarctica (2 cities) and Svalbard (1), both
structural negatives (section 7).

**Family grade: A**, one entry, on 245 cities x two recomputed fitted years x one recipe at
0.25-degree resolution, 213 of them at 100 pc within-1 in both years. The three one-year
cities ride the entry as provisional.

## 3. The between-year recompute proof

`data/between-year-recompute.json`: **12,882 of 103,726 same-month-day cells move 2026→2027
(12.42 pc) across 228 cities; zero frozen cities.** The movement carries the latitude framing
exactly as FIT-RULES orders: Budapest 32.53 pc, Albertirsa 30.33 pc move most among clean
cities; Jakarta 4.18, Malé 3.74, Bogotá 3.08 move least. The two apparent outliers at the top
(Havana 53.85, Nuuk 34.51) move for their own named causes (a dated displacement and the polar
isha rule), not for recompute breadth. The 2026→2027 movement reproduces O1n-9's 12.89 pc and
O1n-13's live 15.63 pc claims at fleet scale: **genuine recompute, proven 2026→2027.**

## 4. The Diyanet cross-check

`data/crosscheck-vs-diyanet.json`: **12 pairs, zero unresolved** (Tashkent's door id 532
pinned this run — see section 8; 96 shared days there, 66 at every other pair). Per-column
signed medians, Fazilet minus Diyanet, local civil minutes at each fit's solved offset:

| city | shared | imsak | sabah(=fajr) | gunes | ogle | ikindi | aksam | yatsi |
|---|---|---|---|---|---|---|---|---|
| Amsterdam | 66 | -99 | -79 | -28 | -28 | -28.5 | -28 | +14 |
| Astana | 66 | -50.5 | -30.5 | +3 | +2 | +1 | +1 | +13 |
| Berlin | 66 | -97.5 | -77.5 | -26.5 | -28.5 | -28 | -30 | +12 |
| Bişkek | 66 | -14 | +6 | +2 | +1 | +1 | 0 | +5 |
| Graz | 66 | -46.5 | -26.5 | -27 | -27.5 | -28 | -28 | +8.5 |
| Moskova | 66 | -64.5 | -44.5 | +2 | +2 | +1.5 | +2 | +11.5 |
| Paris | 66 | -63 | -43 | -27.5 | -27.5 | -28.5 | -28 | +13 |
| Pekin | 66 | -14.5 | +5.5 | +2 | +2 | +1 | +2 | +13.5 |
| Seoul | 66 | -12.5 | +7.5 | +3 | +2 | +1 | 0 | +6 |
| Taşkent | 96 | -11 | +9 | +4 | +2 | +1 | 0 | +5.5 |
| Tokyo | 66 | -11.5 | +8.5 | +4 | +2 | +1 | +1 | +6 |
| İstanbul | 66 | -17.5 | +2.5 | -1 | +5 | +6 | +2 | +11 |

Two stable observations: (1) the night columns run Fazilet-later (+5..+14 at the Asia pairs)
while the solar columns sit near-equal (+1..+4) or at Diyanet's −28 temkin line (the western-
Europe diaspora pairs), one convention family with its own values, quantified city by city;
(2) the Astana pair splits by season on the night columns (January imsak −12/yatsi +13, July
imsak −135/yatsi +80) — the same summer night-column regime the fits measured, visible from
the other publisher's side. Graz's uniform −27/−28 displacement re-appears exactly as O1n-13
recorded it. O1n-9's relations stand unchanged (muftiyat.kg 304/330 differ; islom.uz 174/174;
Tbilisi 371/396).

## 5. The departures, characterised as rule-forms

All 32 within-1 departures classify into four named forms; the record's three named
departures (Colombo, Ulaanbaatar, Conakry/Kankan) are covered too.

1. **The summer night-column class — 25 cities** (Reykjavik, Nuuk, Oslo, Helsinki, Stockholm,
   Tallinn, Riga, Vilnius, Aabenraa, Moskova, Minsk, Kiev, Astana, London, Berlin, Amsterdam,
   Antwerpen, Paris, Białystok, Dublin, Benešov, Bratislava, Budapest, Vaduz, Albertirsa;
   Erdenet shares it at 49N on top of its pad). Winter fits the family angle pair at 100 pc
   within-1 at every one of the 25 (the seasonal scan's jan halves are 99.5-100). Summer the
   isha column leaves the angle: measured at Reykjavik and Nuuk, served yatsi = maghrib
   + ~49-51 minutes fixed in July (angle model says +133), while fajr keeps its angle+pad and
   every solar column stays on its pad. Severity is latitude-graded: worst cell grows from 2
   min near 48N to 154 min at 55N; the polar-undefined band of the 19.5-degree angle is the
   cause the door answers with a shallower or fixed-interval summer rule. This is the door's
   own rule, not fit noise: the served columns move as one measured mechanism.
2. **Two-term surfaces — 3 cities** (Graz, Toronto, Port-Au-Prince): each half-year resolves
   100 pc within-1 at its own angle pair and margin set; the whole-span single-term fit
   departs. Graz's earlier "city-specific pad" reading is superseded: it is a two-term
   publisher setting, the same form Toronto shows. Port-Au-Prince's two terms differ by the
   offset regime in 6 below.
3. **The Mongolian fajr pad — 3 cities** (Ulaanbaatar 737 and Nalaikh 8343: +10..+13 min over
   the angle, identical at both cities; Erdenet 888: +14..+17, a wider swing, plus the 49N
   band). Per-month measurement: the pad rises to its peak at the June solstice and returns to
   +10 in winter; imsak always fajr−20; every other column constant. O1n-9's finding survives
   with its correct attribution: the pad is the Mongolian layer's rule, present at both cities
   measured, not one town's quirk. Within-1 floor 93-96.7, worst 3-4.
4. **The dated offset regimes — 2 cities.** Havana: the served 2027-January table sits
   ≈+60 minutes at every column (medians +48..+69) while 2026-01, 2026-07 and 2027-07 sit on
   the family pad set — a dated half-year displacement on the publisher's side. Port-Au-Prince:
   the door computes the city under a summer +60 shift (July instants at UTC−4, January at the
   true UTC−5) and serves the zone name America/Guyana; Haiti observes no DST. The shift is
   constant per half, so each half fits 100 pc (two-term verdict) while the whole-span fit
   fails completely (w1 0, worst 61) — an offset regime, not noise.

**The record's named departures, settled:**
- **Colombo (3073):** 100 pc within-1 both years on the whole-span recipe (18.75/17.5 Shafi).
  The 2027 dhuhr pad move is now measured exactly: the ogle column's median residual is −3.0
  in every 2026 month and −1.0 in every 2027 month — **a +2 minute dhuhr pad revision dated
  2027**, uniform at every served cell, every other column frozen (imsak −12, sabah +8, gunes
  −9, ikindi −3, aksam −3, yatsi −7 in both years).
- **Ulaanbaatar:** settled as rule-form 3 above — and the true Ulaanbaatar (737, walked by
  this wave as the special) carries the same pad as Nalaikh; O1n-9's mislabel is fully
  repaired in both directions.
- **Conakry and Kankan:** confirmed from the O1n-14 bank and re-confirmed inside this walk's
  own captures (the tier-A anchor for Guinea is Conakry itself): **no fajr (sabah) column
  served anywhere in 2026; 2027 serves it** (65/66 days at Conakry, 2027). Nouakchott joins
  the same gap class with the year reversed: **2026 serves no times at all** (every row
  all-null; 0/66 computable), 2027 serves with one fajr-hole day (65/66). These three are the
  family's only one-year fits; provisional, never A.

## 6. The index placement

**One family entry, `FAZILET-N-CITIES` (N = 248), grade A, carrying the per-country counts
as fields. Not one entry per country.** Full reasoning in `data/family-placement.md`. The
rule in three lines: the index counts one entry per fitted surface or surface family
(ROUND3B method line 11); whole-platform walks count once (TAWKIT-COUNTRY-73: 8,709 pages,
75 countries, one entry, per-country detail inside). Fazilet is one surface — one API with
`date=`, one publisher, one engine, one recipe family, one recomputed 2020-2030 horizon —
and its 211 layers are coverage of one door, not 211 publishers; no layer runs a different
engine or regime. The data does not argue against the precedent: every departure above is a
characterisation inside the family (pads, margin sets, a dated displacement, a column gap),
the same shape that kept tawkit one entry. `FAZILET-28-CITIES` (O1n-9) is superseded into
this entry; `FAZILET-AFRICA-33-CITIES` (O1n-14, grade A) stays a named sub-evidence base
with its 34 cities folded in under their own attribution, as the tawkit precedent keeps
separately graded country entries beside the whole-walk entry.

## 7. Reconciliation and the "not proven" list

**Attribution.** Three evidence bases, kept separate everywhere: (1) O1n-9's 28 cities — all
present, re-fitted by the o1n-13 solver, **27 of 28 at 100 pc within-1 both years reproduced,
Nalaikh departing as recorded**; (2) this wave's tier-A bank — 230 fits; (3) O1n-14's Africa
bank — 34 front cities, 32 two-year at 100 pc, Conakry/Kankan 2027-only; 16 cities overlap
with the tier-A anchors and are counted once. **Verified counts:** every number in section 2
is measured from banked captures and fit files; the served totals come from the door's own
selector enumeration (211 requests, zero errors, O1n-13). **Not verified (stated plainly):**

- **The 6,238 in-scope cities with no fit.** The family grade rests on the 248; that the
  remaining cities share the recipe is the door's uniform architecture, not a per-city proof.
- **The 2020-2030 horizon.** The `date=` parameter answers for those years (O1n-9/O1n-13
  probes), but no horizon-year capture was fit-verified in this wave; recompute is proven
  2026→2027 only.
- **Tiers B (163 second cities), C (547 depth cities), H (horizon sample), W (whole-year
  walks) and the rest of S:** planned in `data/plan-*.json`, not walked. Only S's
  Ulaanbaatar ran.
- **The DST question:** the door serves standard offsets in 228 of 230 fits; two diaspora
  cities fit best under civil DST (Białystok, Stockholm) and Benešov's raw rows carry the
  CET/CEST signature. The per-layer civil-vs-standard reading is recorded, not adjudicated;
  fit quality is unaffected (margins absorb either reading).
- **Absolute local time for the displaced tables** (Graz vs Diyanet's Graz at −27/−28;
  Havana's 2027-January; Port-Au-Prince's summer shift): quantified relations, not
  adjudicated to a "correct" table.
- **Antarctica and Svalbard layers:** structural negatives under these terms — the door's
  January rows are all-null (polar night) and Longyearbyen's July rows carry null
  sunrise/sunset/isha (midnight sun); zero computable days in the walk's full Jan+Jul
  density. South Orkney (third city of the layer) was not in the anchor plan; its state is
  unverified.
- One capture gap: city 3120, 2027-01-01 (single journaled timeout).

## 8. Scripts: what was modified, and why

Read in full before running; changed only where a defect blocked the mission. All changes
named:

1. `scripts/exclusion.py` and `scripts/exclusion.js` (new): the o1n-3 runtime-exclusion
   pattern — the excluded layer resolves from the round brief (Turkish-orthography fold,
   unique nearest label at edit distance 1; verified unique, next candidate at distance 3);
   no script writes the name.
2. `o1n13-consolidate-rows.py`: exclusion guard, and this wave's special-capture directory
   added as a third source (the Ulaanbaatar captures were invisible to it otherwise).
3. `o1n13-fit.js`, `o1n13-grade-table.py`, `o1n13-recompute.py`, `o1n13-seasonal-scan.js`:
   exclusion guards (the tier-A plan carries one anchor belonging to the excluded layer; the
   running walker's in-memory plan could not be amended, so its captures stay banked in the
   archive untouched and are excluded from every count and output by these guards).
4. `o1n13-crosscheck-diyanet.py`: one WANTS line pinned — Tashkent's id 532. The name probe
   missed because the anchor list carries Bukhara for Özbekistan, and the pair vanished
   silently (11 pairs with an empty unresolved list was the symptom).
5. `diag-angles.js` (this workspace): `HighLatitudeRule.None` removed — the enum does not
   exist in adhan 4.4.6 and the diagnostic threw on its first rule.

New in this workspace: `scripts/build-final.py` (the family grade builder),
`scripts/walk-special.py` + `watch-walk.sh` (the Ulaanbaatar special walk, already banked
17:59Z), `scripts/diag-season.js`, `diag-month.js`, `diag-years.js` (inherited from this
wave's earlier phase; diag-angles fixed as named).

## Discipline statement

Public pages only; 1.05 s spacing; every request journalled; nothing refetched that the
journal records; the city list never re-enumerated. No subagents. The excluded layer is
skipped by id, resolved at runtime, never named in any input, output or count; its raw
payload name appears nowhere in any file written this wave. Raw captures stay in the
census archive and never enter git. Timestamps UTC; no real clock read into data; fits never
blend across a dated regime change (Havana's 2027-January is dated, never blended into its
other half-years). An honest negative reads "not found under these terms" and names the
routes sampled. The repository was not written; no yarn, no commits, no board writes.
