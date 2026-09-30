# Execution log: Session 41

## Planning, 2026-09-30

The owner's seven rulings landed (`PLAN.md` section 2.1) and reshaped the row: map plus street sentence, no
user interaction, no compass, no London bundle, fetch on demand with a 25 MB cache.

**Proven in the scratch worktree `~/athan-device-sweep/worktrees/plan-41`, then deleted, as the brief requires:**

| What | Result |
| --- | --- |
| The live archive, every offset read from the header | 4 cities fetched in 10 range requests, 873 KB, 5.0 s |
| `shared/tileGeometry.ts`, `shared/vectorTile.ts`, `shared/qiblaStreet.ts` | Built, 62 tests, **100% on all four measures** |
| `npx tsc --noEmit` | exit 0 |
| `npx biome check --error-on-warnings` | exit 0 |
| `scripts/breaks-1.sh` | **caught 18 of 18, ALL AS EXPECTED: 1** |
| `shared/__tests__/unusedExports.test.ts` | FAILS on the modules alone, naming all five exports. This is the sequencing constraint and it is now proven rather than predicted. |

**Four defects found by building rather than by reasoning**, each recorded because each would have reached the
executor as a broken plan:

1. **The break script's perl substitution silently failed** on every search text holding `/`, printing
   `BREAK NOT APPLIED` for both Mercator breaks. Driven through the environment with a `{}` delimiter instead.
2. **The "nearness weight removed" break SURVIVED.** Both ordering fixtures put the far street outside the
   122 m radius, so it was filtered before scoring and nothing tested the ordering at all. This is session
   32's lesson for the third time: a break script is not verified until it is run.
3. **The test helper drew its streets south-to-north**, because tile y grows southward, so a line meant to
   bear 0 bore 180. Caught by the test, which is what it is for.
4. **`metresPerDegree(51.5)` was asserted at 111278 against a true 111258.85.** My arithmetic, not the code's.

Also found, in the data rather than the code: **`is_tunnel` is per segment**, so a tunnel's approach ramps
carry the tunnel's name with the tag absent, which is how "Queensway Tunnel" passed a tag-only filter in
Birmingham. The filter now reads the name as well.

### Step 2, proven the same way

| What | Result |
| --- | --- |
| `shared/tileCache.ts` and its suite | 11 tests, **100% on all four measures** |
| `scripts/breaks-2.sh` | **caught 7 of 7, ALL AS EXPECTED: 1** |
| tsc, Biome | both 0 |

**Three findings, each of which changed the code rather than the test:**

1. **The MMKV mock has no buffer support**, and its own header warns that mocking a method the device lacks
   "passes every test and then throws in the user's hand, on an alarm clock". So `set(key, ArrayBuffer)` and
   `getBuffer(key)` were checked against the installed `react-native-mmkv@4.3.2` declarations BEFORE the mock
   was widened. Both are real.
2. **The suite must reset storage itself.** The harness resets atoms, not raw MMKV, so the first draft read
   5 MB where it expected 3. `database.clearAll()` in a `beforeEach`, following `syncUnreadableDay.test.ts`.
3. **Two coverage gaps were unreachable defensive code, so the code was simplified rather than the branches
   tested.** An `if (oldest === undefined) break;` that the loop guard already prevented, and an `if (entry)`
   whose false path cannot happen because a stored buffer always has an order entry. Carrying the byte size
   in the order list removed both, and it also stopped eviction reading a megabyte of tile just to weigh it.

### Step 3's archive reader, proven the same way

| What | Result |
| --- | --- |
| `shared/pmtiles.ts` | 28 tests across two suites, **100% on all four measures** |
| `scripts/breaks-3.sh` | **caught 14 of 14, ALL AS EXPECTED: 1** |
| tsc, Biome | both 0 |

**The suite that earns its place is `pmtilesLive.test.ts`**, which parses the REAL 127 header bytes the live
planet archive served, checked in as base64 so it needs no network. A reader and a fixture written from the
same wrong understanding agree with each other perfectly, and only real bytes catch that. The synthetic
fixtures are still built field by field from the spec rather than captured as a blob, for the same reason.

**A NEW DURABLE LESSON, and it cost a false green: run the formatter BEFORE the break script, never after.**
The breaks passed 14 of 14, then `biome check --write` wrapped one assignment across two lines, and break 10
went `BREAK NOT APPLIED` on the rerun. A break whose search text a formatter can move is a break that
silently stops testing anything, and the only reason it was caught is that the script was run twice.

### Step 4's pure halves, proven

| What | Result |
| --- | --- |
| `components/qibla/mapProjection.ts` | 15 tests, **100% on all four measures** |
| `shared/qiblaSentence.ts` | 8 tests, **100% on all four measures** |
| `scripts/breaks-4.sh` | **caught 9 of 9, ALL AS EXPECTED: 1**, with the formatter run first this time |
| tsc, Biome | both 0 |

The sentence was pulled out of the component into `shared/qiblaSentence.ts` while writing it: the wording is
logic, it is the product the whole row exists to deliver, and a string built inside a component can only be
tested by rendering one.

Left for the execution session, and named as such: `hooks/useQiblaMap.ts`, `components/qibla/QiblaMap.tsx`
and `device/tiles.ts`. Each needs mocks or a renderer rather than pure inputs, so each is specified by
contract rather than carried, and the plan gives every test row for them.

### The version collision, which R5's repeat-risk list predicted

A concurrent session queued row 42 and pushed `1.29.141` and `1.29.142` while this session was using the
same two numbers locally, so the merge conflicted on `app.json` and `package.json`. Resolved to the higher
version, `1.29.146`, with the gradle file already matching.

This is repeat-risk 5 in `agent-reports/R5-prior-attempts-and-adversarial.md`, which named the exact
condition: "the version-counter collision... the exact condition that stamped 1.29.107 and 1.29.108 twice".
Its remedy is to take the version from `origin/uat-2` at the moment of the bump rather than from the working
tree. **This session read the working tree, as every previous one has.** Nothing shipped wrong because the
conflict is loud and `versionLockstep.test.ts` guards the three files, but the lesson is now recorded twice
and the cheap fix is a `git fetch` immediately before each bump.

**The same merge also left `uat-2` unable to commit at all**, and that is the more serious half. The other
session committed 444 research data files (`ai/features/global-prayer-times/data/`) that neither gate
accepts: Biome reported 1,656 formatting errors across its JSON measurements, and the coverage gate
reported seven `.mjs` scripts as unmeasured. Their own push succeeded because the hook only inspects
STAGED files and those commits staged just `README.md`, `app.json` and `package.json`; the files arrived in
the tree without ever passing a gate, and the next session to stage anything inherits the failure.

Fixed here by the precedent each gate already carries for exactly this kind of artefact: the folder is
excluded in `biome.json` beside `ai/features/moonsighting` and this row's own `proof/`, and registered in
`UNMEASURED` in `scripts/check-changed-coverage.js` beside the same `proof/` entry, with the reason
"executed research artefacts, run once under Node against published timetables, never by the app".

**DURABLE LESSON: a commit that stages only three files still leaves everything else it wrote in the tree,
and the gates are staged-only, so unstaged research output can block the NEXT session rather than the one
that produced it.** A session that writes data artefacts registers them in both gates in the same commit.

## Execution, 2026-09-30

Steps 1 to 5 are built. `yarn validate` passes at **192 suites, 5006 tests, 100% on all four measures**, and
the four break scripts catch **47 of 47**.

**The invariant holds and is checkable:**
`grep -rn 'useAnimatedSensor\|MAGNETIC_FIELD\|SensorType\|IOSReferenceFrame' components/ shared/ device/ hooks/ app/ stores/`
returns nothing outside tests. Deleted with the dial: `Dial.tsx`, `dialGeometry.ts` and their two suites,
`headingFromYaw`, `unwrapAngle`, `dialAngleFromYaw`, `isFieldTrustworthy`, `FIELD_MIN`, `FIELD_MAX`,
`readDeclination` and `NO_HEADING`.

**What execution found that planning did not, each a real defect:**

1. **The nested-copy trap fired, exactly as `ai/AGENTS.md` predicts.** `yarn add fflate@0.8.3` re-resolved
   the tree and put `@expo/ui@58.0.7` back under `node_modules/expo-widgets/`, shadowing the flat 58.0.5
   pin; `widgetRuntimeLoads.test.ts` failed with the production error. The recorded remedy fixed it. **The
   plan told the executor to run that suite after the install, and that instruction is why this was caught
   in seconds rather than on a blank widget.**
2. **The sheet was passing the STREET's bearing to the map instead of the qibla**, so the ray would have
   been drawn along the road rather than toward Makkah. Caught reading my own diff back, not by a test,
   because every test had been written against the hook rather than the wiring. `QiblaMapState` now carries
   `qibla` explicitly so the two cannot be confused again.
3. **`renderHook` does not exist in the `unit` project.** The repo has its own `hooks/__tests__/hookHarness.ts`
   for hook tests, which the plan should have named.
4. **Three exports had no production caller and the dead-code guard refused all three**: `readDeclination`
   (its last caller was the dial), `cachedBytes` and `clearTiles`. The first two are genuinely dead and were
   deleted. `clearTiles` was too, on a finding rather than a whim: `clearAllExcept` already drops every
   `tile_` key on upgrade, because the tile prefix is deliberately absent from the keep list, so a separate
   clear path was duplicating a wipe that already happens.
5. **`shortestDelta` was about to become dead with `readDeclination`**, and deleting it would have taken a
   real invariant test with it. Instead `qiblaFromStreet` now uses it, which is what it always meant: the
   signed shortest turn between two bearings. Four lines of duplicated angle logic and a `FULL_TURN`
   constant went with the change.
6. **`SIZE.contentPadding` and `COLORS.activeBackground` do not exist.** I invented both while writing the
   map component. The real names are `SPACING.xl` (the sizing the dial itself used) and
   `COLORS.prayer.activeBackground`.

**A break script needs re-running after a refactor, not only after a formatter.** Removing `clearTiles`
made break 7 of `breaks-2.sh` print `BREAK NOT APPLIED`, which is the script correctly reporting that its
target is gone. It was deleted rather than repointed, because the behaviour it guarded no longer exists.

**Review of the commit, read back cold.** Three findings, all in code the plan did not give verbatim, so all
three were applied under `EXECUTOR-BRIEF.md` section 4 item 8:

1. A **nested ternary** chose between the three non-ready strings. Replaced with a `WITHOUT_A_MAP` record
   keyed on the status, which also removed the separate `state.status === 'ready'` branch around the `Text`:
   one element now renders either the sentence or the state's line.
2. `handlePresent` was an `async` arrow whose whole body was `await start()`. It is `() => start()`.
3. A comment read "Named the condition" where it meant "Names the condition".

Everything else checked clean: the settled visuals are untouched (title, subtitle, icon, snap point,
`perfName` and both styles are byte-identical to what shipped), no name or log line differs from the plan's
contracts, and nothing outside the step's file list changed. **`opencode.json` was swept into the first
commit by a `git add -A` and was removed by amend**: the MCP toggles are the owner's configuration, not this
step's work.
