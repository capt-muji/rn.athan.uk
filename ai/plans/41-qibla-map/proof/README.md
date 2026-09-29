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
