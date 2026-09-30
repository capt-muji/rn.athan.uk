# Step 3: Fetching a location's tiles out of the planet archive

0. **Anchor check.** None; this step adds files only. The pre-flight's archive check must have printed
   `archive range request: 206`.

1. **Goal.** Turn a position into nine decoded tiles, reading them from the cache when they are there and
   from the archive over HTTP range requests when they are not.

2. **Branch.** Same branch as step 1.

3. **Files.**

| File | Kind |
| --- | --- |
| `shared/pmtiles.ts` | new |
| `device/tiles.ts` | new |
| `shared/__tests__/pmtiles.test.ts` | new |
| `device/__tests__/tiles.test.ts` | new |

4. **Tests first (red).**

`shared/__tests__/pmtiles.test.ts` covers the pure archive arithmetic:

| Test | What it proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `reads the header the spec describes` | Field offsets are right | the real 127-byte header, as a fixture | version 3, tile type 1, zoom 0 to 15, bounds -180 to 180 and -85.0511 to 85.0511 |
| `refuses a file that is not a PMTiles archive` | A wrong URL fails loudly | bytes starting `NOTPMTIL` | throws, with the magic in the message |
| `refuses a version it does not understand` | Format drift is caught | a header with version 4 | throws, naming the version |
| `indexes the spec's own worked Hilbert examples` | The tile id is right | z0 (0,0); z1 (0,0), (0,1), (1,1), (1,0); z2 (0,0) | 0, 1, 2, 3, 4, 5 |
| `finds London's z15 tile id` | Real agreement with the archive | z15 (16372, 10896) | 518974351 |
| `decodes a directory of entries` | The varint directory walk | a hand-built 3-entry directory | the three entries, with running-total tile ids |
| `reads a run-length entry as covering a span of tiles` | Run-length encoding | an entry with runLength 4 | a tile inside the run is found |
| `reports no entry for a tile the directory does not hold` | A miss is a miss | a tile id past the last entry | `null` |
| `treats a zero offset after the first entry as following the one before` | The spec's offset shorthand | two entries, the second with offset 0 | the second's offset is the first's offset plus its length |

`device/__tests__/tiles.test.ts` covers the fetching, with `fetch` mocked:

| Test | What it proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `serves a cached tile without going to the network` | The cache is consulted first | a tile already in the cache | `fetch` was not called |
| `fetches a tile the cache does not hold` | The network path | empty cache, mocked 206 responses | the decoded tile comes back, and the bytes are cached |
| `asks only for the byte range it needs` | Never downloads 138 GB | any fetch | every call carries a `Range` header of the form `bytes=<n>-<m>` |
| `gives up when the archive answers anything but 206` | An honest failure | a mocked 200 | returns `null` and logs `QIBLA: Tile archive refused a range request` |
| `gives up when the network throws` | Offline is not a crash | `fetch` rejects | returns `null` and logs `QIBLA: Could not reach the tile archive` |
| `returns what it has when only some tiles arrive` | A partial fetch still draws | 9 requested, 3 fail | the 6 that arrived |
| `reports nothing when the archive has no tile there` | Ocean and desert | a directory miss | an empty result, not an error |

Command:

```
npx jest shared/__tests__/pmtiles.test.ts device/__tests__/tiles.test.ts --watchman=false --selectProjects=unit
```

Expected before the change: `Cannot find module '@/shared/pmtiles'` and `Cannot find module '@/device/tiles'`.

5. **Change.**

**`shared/pmtiles.ts`**, pure, no I/O:

| Export | Signature | Answers | Must never |
| --- | --- | --- | --- |
| `PMTILES_HEADER_BYTES` | `127` | How much of the file the header occupies | |
| `parseHeader` | `(bytes: Uint8Array) => PmTilesHeader` | The archive's layout | Accept a bad magic or an unknown version; it throws instead |
| `tileIdFor` | `(tile: TileAddress) => number` | The Hilbert index of a tile | Disagree with the spec's worked examples |
| `decodeDirectory` | `(bytes: Uint8Array) => DirectoryEntry[]` | A directory's entries | Mis-handle the zero-offset shorthand |
| `findEntry` | `(entries: DirectoryEntry[], tileId: number) => DirectoryEntry \| null` | The entry holding a tile | Return an entry whose run does not cover the id |

`parseHeader` throws `new Error(...)` with the offending value in the message; the two messages are
`PMTiles: unexpected magic <magic>` and `PMTiles: unsupported version <n>`. The planning session's own header
parse was wrong first and reported "minzoom 15, maxzoom 0" with impossible bounds, so the sanity of these
fields is what the first test exists to pin.

**`device/tiles.ts`**, the only file in this step that touches the network:

| Export | Signature | Answers | Must never |
| --- | --- | --- | --- |
| `TILE_ZOOM` | `15` | The zoom the map draws at | Change without re-measuring the path cost |
| `tilesAround` | `(position: Position) => Promise<DecodedTile[]>` | The 3x3 of decoded tiles around a position, cache first | Throw; it returns what it has |

Log lines, exactly:

- `QIBLA: Tile archive refused a range request`
- `QIBLA: Could not reach the tile archive`
- `QIBLA: No map data for this location`

The archive URL is a single module constant, `TILE_ARCHIVE_URL`, so the build it reads is one edit and the
break script has a stable target.

Gzip comes from `fflate`, installed in this step with exactly:

```
yarn add fflate@0.8.3
```

Then, because ANY install can reintroduce the nested `@expo/ui` copy (`ai/AGENTS.md`, session 31):

```
npx jest shared/__tests__/widgetRuntimeLoads.test.ts --watchman=false --selectProjects=unit
```

If it fails: `rm -rf node_modules/expo-widgets/node_modules && yarn install --frozen-lockfile`, then run it
again.

**The invariant:** `tilesAround` performs no network request for a tile the cache already holds.

6. **Green.** The same command, 100% coverage of both new modules, tsc and Biome at 0.

7. **Breaks.** `bash ai/plans/41-qibla-map/scripts/breaks-3.sh`, ending `ALL AS EXPECTED: 1`.

8. **Version and commit.** At the end of step 4.

9. **Review.** At the end of step 4.

10. **Merge.** At the end of step 4.

11. **Done when.** Both suites pass at 100%, `fflate@0.8.3` is in `package.json`, and
    `widgetRuntimeLoads.test.ts` passes.

12. **Stopping part-way.** Delete `shared/pmtiles.ts`, `device/tiles.ts` and their suites. If `fflate` was
    installed, leave it: it is in the lockfile and removing it re-resolves the tree for nothing.
