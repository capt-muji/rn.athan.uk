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
| `shared/tileCache.ts` | new, copied from `files/shared/tileCache.ts.txt` |
| `shared/__tests__/tileCache.test.ts` | new, copied from `files/shared/__tests__/tileCache.test.ts.txt` |
| `shared/__mocks__/react-native-mmkv.ts` | changed, three edits given verbatim in part 5 |

**This is a `(files)` step** for the two new files: copy them and strip the `.txt`. Both were built,
typechecked, linted, tested at 100% and break-tested by the planning session.

4. **Tests first (red).** New suite `shared/__tests__/tileCache.test.ts`.

The suite is carried whole, so these are what its eleven tests prove rather than a specification to build from:

| Test | What it proves |
| --- | --- |
| `keeps a tile it was given` | A stored tile comes back byte for byte |
| `reports nothing for a tile it has never seen` | A miss is a miss, not an empty tile |
| `keeps two locations at once` | The cache is not a single slot |
| `reports how many bytes it is holding` | The cap is checkable |
| `evicts the least recently used tile when the cap is passed` | The 25 MB rule, with a read making the first tile newer than the second |
| `never exceeds the cap after an eviction` | The cap is a ceiling, not a target |
| `evicts more than one tile when a single tile needs the room` | Eviction loops rather than dropping one and giving up |
| `refuses a tile larger than the whole cap` | A pathological tile cannot empty the cache |
| `treats a read as a use, so the tile a user keeps opening survives` | LRU reads, not just writes |
| `forgets everything when asked` | The clear path the upgrade wipe needs |
| `caps at the 25 MB the owner asked for` | The constant is the owner's number |

**The suite resets storage itself**, with `database.clearAll()` in a `beforeEach`, following
`stores/__tests__/syncUnreadableDay.test.ts`. The planning session's first draft did not, and the
`reports how many bytes` test read 5 MB where it expected 3, because the harness resets atoms and this suite
writes raw MMKV.

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

**`shared/tileCache.ts`**, copied from the plan. Its contracts, for the review and the audit:

| Export | Signature | Answers | Must never |
| --- | --- | --- | --- |
| `TILE_CACHE_CAP_BYTES` | `number`, `25 * 1024 * 1024` | The owner's cap | Change without an owner ruling |
| `readTile` | `(key: string) => Uint8Array \| null` | A cached tile's bytes | Return an empty array for a miss |
| `writeTile` | `(key: string, bytes: Uint8Array) => void` | Stores a tile, evicting least-recently-used until it fits | Store a tile larger than the cap, or leave the total above it |
| `cachedBytes` | `() => number` | How much the cache is holding | Disagree with the sum of what it stores |
| `clearTiles` | `() => void` | Empties the cache | Touch any key outside the tile prefix |

Storage keys follow the repo's convention (`ai/AGENTS.md`, "Storage (MMKV)"): every key is prefixed `tile_`,
and the access order is kept under `tile_order` as a list of `{ key, bytes }`. The size is carried in that
list rather than measured from storage, so evicting never reads a megabyte of tile just to weigh it.

**The tile keys are deliberately ABSENT from both `clearAllExcept` keep-prefix whitelists.** A cache is
rebuildable, and a stale tile outliving a format change is worse than a refetch. The test
`forgets everything when asked` pins the clear path.

No log lines: the cache is pure and the caller reports.

**`shared/__mocks__/react-native-mmkv.ts`**, three edits, because the mock has no buffer support and MMKV
4.3.2 does. Its own header warns that a mocked method the device lacks "passes every test and then throws in
the user's hand", so these were checked against the real surface first: `set(key, ArrayBuffer)` and
`getBuffer(key): ArrayBuffer | undefined` are both declared in the installed package.

Change the storage type:

```ts
  const storage: Record<string, string | number | boolean | ArrayBuffer> = {};
```

Add `getBuffer`, directly after `getString`:

```ts
    getBuffer: (key: string) => {
      const value = storage[key];
      return value instanceof ArrayBuffer ? value : undefined;
    },
```

Widen `set`:

```ts
    set: (key: string, value: string | number | boolean | ArrayBuffer) => {
```

**The invariant:** after any `writeTile`, `cachedBytes()` is at most `TILE_CACHE_CAP_BYTES`.

6. **Green.** The same command, expecting exactly:

```
Tests:       11 passed, 11 total
```

Then coverage, which the planning session measured at 100% on all four:

```
npx jest shared/__tests__/tileCache.test.ts --watchman=false --selectProjects=unit --coverage --collectCoverageFrom='shared/tileCache.ts'
```

```
Statements   : 100% ( 38/38 )
Branches     : 100% ( 8/8 )
Functions    : 100% ( 11/11 )
Lines        : 100% ( 29/29 )
```

Then `npx tsc --noEmit` and `npx biome check . --error-on-warnings`, both 0.

`unusedExports` still fails until step 4. That is expected.

7. **Breaks.** `bash ai/plans/41-qibla-map/scripts/breaks-2.sh`, run from the repository root. The planning
   session ran it against this exact code and it printed:

```
caught 7 of 7
ALL AS EXPECTED: 1
```

8. **Version and commit.** At the end of step 4.

9. **Review.** At the end of step 4.

10. **Merge.** At the end of step 4.

11. **Done when.** The anchor applied, the suite passes at 100%, tsc and Biome are 0, and
    `node -e "const c=require('./metro.config.js')({});"` does not throw.

12. **Stopping part-way.** `git checkout -- metro.config.js`, and delete `shared/tileCache.ts` and its suite.
