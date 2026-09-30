# The proof, as it was run

These four scripts are the executed proof behind `../agent-reports/P3-the-concrete-solution.md`. They are
**reference artefacts, not app code**: they ran under Node against the live Protomaps planet archive, and
they are kept so a later session can re-run the proof rather than take the report on trust. `biome.json`
excludes this folder for that reason, as it already excludes `ai/features/moonsighting`.

| File | What it proves | Run it with |
| --- | --- | --- |
| `pmtiles-directory.js` | PMTiles v3 varint directory decode and Hilbert tile indexing, checked against the spec's own worked examples | required by the others |
| `mvt-decoder.js` | Mapbox Vector Tile protobuf decode in 37 lines, no dependency | required by `render-svg.js` |
| `fetch-one-tile.js` | One real London z15 tile out of the 138 GB archive in three HTTP range requests | `node fetch-one-tile.js` |
| `render-svg.js` | The tile drawn with a qibla ray at the great-circle initial bearing | `node render-svg.js` |

`qibla-london.svg` and `qibla-london.png` are the output. The PNG is what the independent vision pass
measured at 119.7 degrees against the 118.987 the maths computed.

The scripts hardcode `/tmp` paths and the archive's byte offsets as they stood on the `20260928` build. The
offsets move with each daily build, so re-running means re-reading the header first. That is deliberate:
the report's claim is that the pipeline works, and a script that silently adapted would hide a changed
format rather than reveal it.

`count-features-by-radius.js` is the fifth script, added after R2's per-frame path ceiling contradicted the
first render. It counts how many features fall within a radius of the tile centre, which is what turned the
feature cap from an unwritten worry into the measured rule in `P3` section 7: a 122 m view is 49 paths and
92 ms on the floor device, and it still holds 16 roads.

Two more scripts close the Hermes question, which was `P3`'s largest open item. `decode-hermes-safe.js` is
the MVT decoder rewritten against `Uint8Array`, `DataView` and `TextDecoder` with zero Node builtins, fed an
input that is verifiably not a `Buffer`. `gunzip-without-zlib.js` proves `fflate`'s browser build inflates a
real tile to a byte-identical result in 4.3 ms with zero `require` calls to Node. See
`../agent-reports/P4-hermes-viability.md`.

`measure-retained-memory.js` settles the memory objection. Run it with `node --expose-gc`: it forces
collection while still holding the decoded tiles, which is the difference between measuring what is RETAINED
and measuring the decode's transient garbage. The naive version of this measurement reported 1,289 KB per
tile for 48 paths, which is absurd, and that is why the script exists in this form.

`street-bearings.js` answers the owner's question "okay we have a map, but what about the actual direction?"
It recovers each street's true bearing from the tile geometry and states the qibla as an offset from it, so
the app can say "the qibla is 53 degrees left of the line of Whitehall". Every number needs ZERO sensors: a
street bearing is a fact of the ground held in the tile, the qibla is arithmetic, and the difference is
arithmetic.

Two scripts record a REJECTED route, kept because the rejection is the finding.
`public-api-solar-rejected.js` derives solar azimuth from `adhan`'s public exports alone, avoiding the deep
import: mean 0.484 degrees over 419 in-gate samples but **7.847 worst at Singapore**.
`why-equator-breaks-it.js` shows why, and it is a singularity rather than a bug: the half-day angle moves only
1.17 degrees across a whole year at Singapore's latitude, and `adhan` rounds to the minute, so one minute of
rounding costs **9.07 degrees of declination** there against 0.20 in London. See `../PROTOTYPE-FINDINGS.md`.
