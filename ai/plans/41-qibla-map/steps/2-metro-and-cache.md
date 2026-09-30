# Step 2: Metro learns the tile extension, and the tile cache

0. **Anchor check.**

```
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/41-qibla-map/scripts/anchors/2-1.txt metro.config.js
```

Must print `1`. Anything else means NEEDS REPLAN.

1. **Goal.** Let Metro carry a binary tile, and give the app a place to keep tiles that never exceeds 25 MB.

2. **Branch.** Same branch as step 1, `feat/41-tile-reader`. Steps 1 to 4 are one commit
   (`PLAN.md` section 4.3).

3. **Files.**

| File | Kind |
| --- | --- |
| `metro.config.js` | changed, at anchor `2-1.txt` |
| `shared/tileCache.ts` | new |
| `shared/__tests__/tileCache.test.ts` | new |

4. **Tests first (red).** New suite `shared/__tests__/tileCache.test.ts`.

| Test | What it proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `keeps a tile it was given` | A stored tile comes back | one tile, 60 KB, then read it | the same bytes |
| `reports nothing for a tile it has never seen` | A miss is a miss, not an empty tile | read an unstored key | `null` |
| `keeps two locations at once` | The cache is not a single slot | store 9 London tiles then 9 Jakarta tiles, read one London tile | the London bytes |
| `evicts the least recently used tile when the cap is passed` | The 25 MB rule | store tiles of 10 MB, 10 MB, 10 MB in that order, having read the first after the second | the second is gone and the first and third remain |
| `never exceeds the cap after an eviction` | The cap is a ceiling, not a target | store 4 tiles of 10 MB | total held is at most 25 MB |
| `evicts more than one tile when a single tile needs the room` | Eviction loops | fill to 24 MB with 12 tiles of 2 MB, then store a 6 MB tile | enough tiles are gone that the total is at most 25 MB |
| `refuses a tile larger than the whole cap` | A pathological tile cannot empty the cache | store a 30 MB tile | it is not stored and the cache still holds what it had |
| `reading a tile makes it most recently used` | LRU reads, not just writes | store A then B, read A, store enough to force one eviction | B is gone, A remains |
| `reports how many bytes it is holding` | The cap is checkable | store 3 tiles of 1 MB | the reported total is 3 MB |
| `forgets everything when asked` | A clear path exists for the cache-wipe on upgrade | store tiles, clear, read one | `null` |

Command:

```
npx jest shared/__tests__/tileCache.test.ts --watchman=false --selectProjects=unit
```

Expected before the change: `Cannot find module '@/shared/tileCache'`.

5. **Change.**

**`metro.config.js`**, at the anchor. Add `pmtiles` and `mvt` to `assetExts` so Metro will carry a tile as a
binary asset. The repo already edits this array, removing `svg` so the SVG transformer owns it, so the
pattern exists. The replacement, verbatim:

```js
  config.resolver = {
    ...resolver,
    // Metro carries no binary map tile by default, and base64 in a module would cost 33% more bytes plus an
    // unmeasured Hermes string-literal parse (facebook/hermes#1046)
    assetExts: [...resolver.assetExts.filter((ext) => ext !== 'svg'), 'pmtiles', 'mvt'],
    sourceExts: [...resolver.sourceExts, 'svg'],
  };
```

**`shared/tileCache.ts`**, a new module. It is pure bookkeeping over MMKV and holds no file I/O, so it is
testable without a device.

| Export | Signature | Answers | Must never |
| --- | --- | --- | --- |
| `TILE_CACHE_CAP_BYTES` | `number`, `25 * 1024 * 1024` | The owner's cap | Change without an owner ruling |
| `readTile` | `(key: string) => Uint8Array \| null` | A cached tile's bytes | Return an empty array for a miss |
| `writeTile` | `(key: string, bytes: Uint8Array) => void` | Stores a tile, evicting least-recently-used until it fits | Store a tile larger than the cap, or leave the total above it |
| `cachedBytes` | `() => number` | How much the cache is holding | Disagree with the sum of what it stores |
| `clearTiles` | `() => void` | Empties the cache | Touch any key outside the tile prefix |

Storage keys follow the repo's convention (`ai/AGENTS.md`, "Storage (MMKV)"): every key is prefixed
`tile_`, and the access order is kept under `tile_order`. Use the existing `stores/database.ts` wrapper
rather than a new MMKV instance.

**One rule that must be written into the code**, because the widget lesson applies: the tile keys must be
added to BOTH `clearAllExcept` keep-prefix whitelists if and only if they should survive a version upgrade.
They should NOT: a cache is rebuildable, and keeping stale tiles through an upgrade risks serving a tile
whose format the new code reads differently. So they are deliberately absent from the whitelist, and the
test `forgets everything when asked` is what pins the clear path.

No log lines: the cache is pure and the caller reports.

**The invariant:** after any `writeTile`, `cachedBytes()` is at most `TILE_CACHE_CAP_BYTES`.

6. **Green.** The same command, then:

```
npx jest shared/__tests__/tileCache.test.ts --watchman=false --selectProjects=unit --coverage --collectCoverageFrom='shared/tileCache.ts'
```

100% on all four measures. Then `npx tsc --noEmit` and `npx biome check . --error-on-warnings`, both 0.

`unusedExports` still fails until step 4. That is expected.

7. **Breaks.** `bash ai/plans/41-qibla-map/scripts/breaks-2.sh`, given in full in `scripts/breaks-2.sh`. It
   must end `ALL AS EXPECTED: 1`.

8. **Version and commit.** At the end of step 4.

9. **Review.** At the end of step 4.

10. **Merge.** At the end of step 4.

11. **Done when.** The anchor applied, the suite passes at 100%, tsc and Biome are 0, and
    `node -e "const c=require('./metro.config.js')({});"` does not throw.

12. **Stopping part-way.** `git checkout -- metro.config.js`, and delete `shared/tileCache.ts` and its suite.
