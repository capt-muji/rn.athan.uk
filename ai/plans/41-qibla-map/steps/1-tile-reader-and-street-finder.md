# Step 1: The tile reader and the street finder, with their first caller

0. **Anchor check.** None. This step adds files and changes no existing code except `shared/qibla.ts`'s export
   surface, which it does not touch either. Run the pre-flight for step 1 and expect `PREFLIGHT OK`.

1. **Goal.** Land the three pure modules that turn tile bytes into "Whitehall, turn 53 degrees left", with
   tests, at 100% coverage.

2. **Branch.** `git checkout -b feat/41-tile-reader uat-2`

3. **Files.**

| File | Kind |
| --- | --- |
| `shared/tileGeometry.ts` | new, copied |
| `shared/vectorTile.ts` | new, copied |
| `shared/qiblaStreet.ts` | new, copied |
| `shared/__tests__/tileGeometry.test.ts` | new, copied |
| `shared/__tests__/vectorTile.test.ts` | new, copied |
| `shared/__tests__/qiblaStreet.test.ts` | new, copied |

Nothing else, apart from `ai/plans/README.md`, this folder's `PLAN.md` and `LOG.md`, and the three version
files.

**This is a `(files)` step.** Every file is carried in `ai/plans/41-qibla-map/files/` with a `.txt` suffix,
the convention session 6b set, because Jest discovers any `*.test.ts` under the repository and the pre-commit
hook then runs the plan's copies as if they were real suites. Copy each one and strip only that suffix:

```bash
cd /Users/muji/repos/rn.athan.uk
F=ai/plans/41-qibla-map/files
cp $F/shared/tileGeometry.ts.txt shared/tileGeometry.ts
cp $F/shared/vectorTile.ts.txt shared/vectorTile.ts
cp $F/shared/qiblaStreet.ts.txt shared/qiblaStreet.ts
cp $F/shared/__tests__/tileGeometry.test.ts.txt shared/__tests__/tileGeometry.test.ts
cp $F/shared/__tests__/vectorTile.test.ts.txt shared/__tests__/vectorTile.test.ts
cp $F/shared/__tests__/qiblaStreet.test.ts.txt shared/__tests__/qiblaStreet.test.ts
```

Change nothing in any of them. Every one was built, typechecked, linted, tested and break-tested by the
planning session in a scratch worktree; the numbers in part 6 are what it measured.

4. **Tests first (red).** The three test files come with the step, so the red state is what the suite reports
   with the tests present and the modules absent. Copy ONLY the three test files first, stripping the `.txt`,
   and run:

```
npx jest shared/__tests__/tileGeometry.test.ts shared/__tests__/vectorTile.test.ts shared/__tests__/qiblaStreet.test.ts --watchman=false --selectProjects=unit
```

Expect three failures of the form `Cannot find module '@/shared/tileGeometry' from ...`. If any suite passes,
STOP: a module already exists that this step means to create.

Existing tests that change: none. Existing tests that must not change:
`shared/__tests__/qibla.test.ts`, which covers the bearing this step leaves alone.

5. **Change.** Copy the three module files. This step is `(files)`, so the contracts below are what the copied
   code already implements; they are stated so the review and the audit can check them.

| Export | Signature | Answers | Must never |
| --- | --- | --- | --- |
| `tileForPosition` | `(position: Position, zoom: number) => TileAddress` | Which tile holds a position | Return a fractional x or y |
| `positionInTile` | `(tile: TileAddress, point: TilePoint, extent: number) => Position` | What a tile point means on the ground | Disagree with `tileForPosition`, which it inverts |
| `metresPerDegree` | `(latitude: number) => { latitude: number; longitude: number }` | The local scale | Ignore latitude on the longitude axis |
| `offsetInMetres` | `(from: Position, to: Position) => { east: number; north: number }` | Local offset, signed | Return a magnitude |
| `distanceInMetres` | `(from: Position, to: Position) => number` | Local distance | Be negative |
| `decodeVectorTile` | `(bytes: Uint8Array) => Record<string, TileLayer>` | Every layer in a tile | Reach for `Buffer`, `zlib` or any Node builtin |
| `nearbyStreets` | `(roads: TileLayer, tile: TileAddress, here: Position) => NearbyStreet[]` | Usable streets, best first | Return a rail line, a tunnel, a sidewalk, a service lane, a bend or anything under 40 m |
| `qiblaFromStreet` | `(qibla: number, street: NearbyStreet) => QiblaFromStreet` | The acute turn and its side | Return a turn above 90 |
| `SEARCH_RADIUS_METRES` | `122` | The search radius | Change without re-measuring the path cost |

No module here logs anything: they are pure and the caller owns the reporting.

**The invariant:** the turn `qiblaFromStreet` returns, applied to the street's line in either direction,
reaches the qibla.

6. **Green.** The same command. Expected exactly:

```
Tests:       62 passed, 62 total
Test Suites: 3 passed, 3 total
```

Then coverage of the three modules, which the planning session measured at 100% on all four:

```
npx jest shared/__tests__/tileGeometry.test.ts shared/__tests__/vectorTile.test.ts shared/__tests__/qiblaStreet.test.ts --watchman=false --selectProjects=unit --coverage --collectCoverageFrom='shared/tileGeometry.ts' --collectCoverageFrom='shared/vectorTile.ts' --collectCoverageFrom='shared/qiblaStreet.ts'
```

```
Statements   : 100% ( 236/236 )
Branches     : 100% ( 95/95 )
Functions    : 100% ( 24/24 )
Lines        : 100% ( 206/206 )
```

Then `npx tsc --noEmit` and `npx biome check . --error-on-warnings`, both exiting 0.

**Expect `shared/__tests__/unusedExports.test.ts` to FAIL at this point**, naming `decodeVectorTile`,
`nearbyStreets`, `qiblaFromStreet`, `tileForPosition` and `distanceInMetres`. That is correct and expected:
the guard refuses an export with no production caller, and step 4 is the caller. **Do not commit this step on
its own.** Build steps 1 to 4 on this one branch and commit them together, which is the sequencing constraint
in `PLAN.md` section 4.3. Tick steps 1 to 3 in the checklist as built, and take the commit at the end of step
4.

7. **Breaks.** `bash ai/plans/41-qibla-map/scripts/breaks-1.sh`, run from the repository root, after step 4's
   code exists so the suite is green. The planning session ran it and it printed:

```
caught 18 of 18
ALL AS EXPECTED: 1
```

Two things it found, recorded so the executor recognises them rather than re-deriving them: the perl
substitution must be driven through the environment, because every search text holds `/` from a `Math.PI`
division; and the "nearness weight removed" break SURVIVED the first draft of the tests, because both
fixtures put the far street outside the search radius, so nothing tested the ordering at all.

8. **Version and commit.** Taken at the end of step 4.

9. **Review.** At the end of step 4.

10. **Merge.** At the end of step 4.

11. **Done when.** The three modules and their three suites exist, 62 tests pass, coverage is 100% on all
    four measures for the three modules, tsc and Biome exit 0, and `unusedExports` fails with exactly the five
    names above and no others.

12. **Stopping part-way.** Delete `shared/tileGeometry.ts`, `shared/vectorTile.ts`, `shared/qiblaStreet.ts`
    and the three new suites. Nothing else changed.
