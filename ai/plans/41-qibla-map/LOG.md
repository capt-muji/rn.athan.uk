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
