# O1l-C1 coordinate ledger: session report

Agent tag `coords-ledger`, 2026-11-11. Record work only, no web, no subagents, nothing under
`/tmp`, the repository untouched. Deliverables: `COORDS-LEDGER.md`, `coords-ledger.json`, and the
scripts under `derive/`.

## What was built

One record per surface for all 1,547 surfaces in `census-index.db`, each carrying country,
latitude, longitude, point class, citation, timezone and residual.

| Class | Count |
| --- | --- |
| PUBLISHED | 443 |
| DERIVED | 650 |
| ANCHOR | 154 |
| UNKNOWN | 300 |

1,247 of 1,547 surfaces (80.6%) carry a usable point.

## Method

Four sources carry a point the record already names, and they are extracted verbatim:
the INM Tunisia delegation points echoed in every archive row (339 surfaces), the CICOT Thailand
printed district coordinates (154, classed ANCHOR because each is a zone reference for a
province), the Kemenag Indonesian city register (43), the vaktija.eu location register for Bosnia
and the Sandzak (61), and the ESA Egypt implied points the Egypt job itself solved (78).

Everything else is derived from the surface's own columns by `derive/solve.mjs`: longitude from
the horizon pair where both sunrise and maghrib exist, else from the transit, else from any two
solar columns; latitude by weighted least squares over the seasonal curve, then a joint
refinement.

## Evidence

- Gate: the solar core reproduces adhan 4.4.6 at Cairo within 10.8 s on sunrise and transit and
  60.3 s on asr across six dates (`derive/validate.mjs`). The asr gap is a formulation
  difference and it carries the lowest weight in the fit.
- Cross-check: where the record names a point and the solver recovers one from the same table,
  the median disagreement is 0.04 deg (Egypt, 78 surfaces), 0.16 deg (Thailand, 154), 0.43 deg
  (Bosnia, 61), 0.44 deg (Indonesia, 38) and 0.54 deg (Tunisia, 273). This is what licenses the
  DERIVED class elsewhere.
- Every derived record carries its residual, its per-column bias, the number of days behind it,
  and the 1-sigma precision of each coordinate.

## Findings the resolver should carry

- **The US is the largest gap and it is structural.** 101 of 111 US surfaces reproduce at four
  or five longitudes a civil-zone step apart, and neither the capture nor the record names the
  mosque's point. Those records carry a latitude and no longitude. Russia, Chile, Portugal,
  Australia, Spain and Canada fail the same way.
- **A printed dhuhr margin is a longitude shift.** Where the horizon pair exists the ledger uses
  it; where it does not, the bias is carried and labelled `lonBasis: dhuhr`. Turkey shows the
  residual 1.2 deg this leaves.
- **Two publisher defects fall out of the cross-check.** CICOT's Nan workbook prints a longitude
  3.17 deg from the point its own rows imply, the typo the Thailand job already recorded. Bosnia's
  Trebinje and Bileca sit 2.1 to 2.4 deg from the federation's register point.
- **Precision is not accuracy.** The LUPT April 2027 block derives at 55.0 N, 1.2 W with a
  0.14 deg sigma, 3.5 deg from London, because its columns come from interval tables rather than
  a horizon angle.

## Honest negatives

- 17 surfaces hold fewer than two solar columns and cannot be placed.
- 91 surfaces do not move with the sun (fixed or partly fixed tables).
- 39 fitted points fall outside their country's envelope.
- 17 surfaces have a transit column contradicting the horizon pair.
- 11 have too few dated rows.
- 2 file names resolve to no country on record.

## What a next pass would need

A point named by the record for the multi-zone platform surfaces: the Masjidal mosque profile
pages, or a mawaqit meta capture beside each table. That single input would convert 196
zone-degenerate records into usable points.
