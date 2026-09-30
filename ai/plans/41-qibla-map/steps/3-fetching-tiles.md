# Step 3: Fetching a location's tiles out of the planet archive

0. **Anchor check.** None; this step adds files only. The pre-flight's archive check must have printed
   `archive range request: 206`.

1. **Goal.** Turn a position into nine decoded tiles, reading them from the cache when they are there and
   from the archive over HTTP range requests when they are not.

2. **Branch.** Same branch as step 1.

3. **Files.**

| File | Kind |
| --- | --- |
| `shared/pmtiles.ts` | new, copied from `files/shared/pmtiles.ts.txt` |
| `shared/__tests__/pmtiles.test.ts` | new, copied |
| `shared/__tests__/pmtilesLive.test.ts` | new, copied |
| `device/tiles.ts` | new, built from the contract in part 5 |
| `device/__tests__/tiles.test.ts` | new, built from the rows in part 4 |

The three `shared/` files are a `(files)` sub-step: copy them and strip the `.txt`. They were built,
typechecked, linted, tested at 100% and break-tested by the planning session. `device/tiles.ts` is
`(specified)`, because it touches the network and its test needs mocks the executor writes.

4. **Tests first (red).**

The two `shared/` suites are carried whole, 28 tests between them. What they prove:

`shared/__tests__/pmtiles.test.ts`, 22 tests over synthetic fixtures built field by field from the spec, so a
wrong field POSITION fails rather than being baked into the fixture: the header's layout, the magic and
version guards with their exact messages, the spec's own six worked Hilbert examples, London's real tile id
518974351, the directory's delta-encoded tile ids, its zero-offset shorthand, run-length spans, leaf pointers,
and the empty directory.

`shared/__tests__/pmtilesLive.test.ts`, 6 tests over **the real 127 header bytes the live planet archive
served on 2026-09-30**, checked in as base64 so the suite needs no network. This is the suite that matters:
a reader and a fixture written from the same wrong understanding agree with each other perfectly, and only
real bytes catch that. It pins the Web Mercator bounds, the zoom range, the root offset at 127, and that
London's position resolves to the tile id the archive actually served.

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

**`shared/pmtiles.ts`**, copied from the plan, pure and with no I/O. Its contracts:

| Export | Signature | Answers | Must never |
| --- | --- | --- | --- |
| `PMTILES_HEADER_BYTES` | `127` | How much of the file the header occupies | |
| `parseHeader` | `(bytes: Uint8Array) => PmTilesHeader` | The archive's layout | Accept a bad magic or an unknown version; it throws instead |
| `holdsVectorTiles` | `(header: PmTilesHeader) => boolean` | Whether the decoder can read this archive | Pass a raster archive |
| `tileIdFor` | `(tile: TileAddress) => number` | The Hilbert index of a tile | Disagree with the spec's worked examples |
| `decodeDirectory` | `(bytes: Uint8Array) => DirectoryEntry[]` | A directory's entries | Mis-handle the zero-offset shorthand |
| `findEntry` | `(entries: DirectoryEntry[], tileId: number) => DirectoryEntry \| null` | The entry holding a tile | Return an entry whose run does not cover the id |
| `pointsAtLeaf` | `(entry: DirectoryEntry) => boolean` | Whether an entry is a leaf directory rather than a tile | |

`parseHeader` throws with the offending value in the message: `PMTiles: unexpected magic <magic>` and
`PMTiles: unsupported version <n>`. The planning session's first header parse was wrong and reported
"minzoom 15, maxzoom 0" with impossible bounds, which is exactly the wrong-but-plausible result the
live-bytes suite exists to catch.

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

6. **Green.** The same command. The two carried suites were measured by the planning session at:

```
Tests:       28 passed, 28 total
Statements   : 100% ( 88/88 )
Branches     : 100% ( 24/24 )
Functions    : 100% ( 9/9 )
Lines        : 100% ( 73/73 )
```

`device/tiles.ts` must reach 100% on all four too. tsc and Biome exit 0.

7. **Breaks.** `bash ai/plans/41-qibla-map/scripts/breaks-3.sh`. The planning session ran it against the
   formatted code and it printed `caught 14 of 14` and `ALL AS EXPECTED: 1`.

**Run Biome BEFORE the break script, never after.** The planning session ran the breaks first, got 14 of 14,
then formatted, and break 10 went `BREAK NOT APPLIED`: Biome had wrapped the assignment it targets across
two lines, so a single-line search matched nothing. The script now targets the wrapped form. A break whose
text a formatter can move is a break that silently stops testing anything.

8. **Version and commit.** At the end of step 4.

9. **Review.** At the end of step 4.

10. **Merge.** At the end of step 4.

11. **Done when.** Both suites pass at 100%, `fflate@0.8.3` is in `package.json`, and
    `widgetRuntimeLoads.test.ts` passes.

12. **Stopping part-way.** Delete `shared/pmtiles.ts`, `device/tiles.ts` and their suites. If `fflate` was
    installed, leave it: it is in the lockfile and removing it re-resolves the tree for nothing.
