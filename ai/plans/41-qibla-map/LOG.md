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

## Step 6, the device proof: the owner REJECTED the feature on sight, 2026-09-30

The Release build installed on the XS at **1.29.154** (`xcrun devicectl device info apps` confirms it) and the
owner opened the Qibla sheet himself. It rendered and it named a real street.

**It was rejected on the interaction, not on a defect.** The screen read "Stand along Parsons Green Lane, then
turn 49 degrees to the left."

🐋  "No user in their mind knows absolutely what 49 degrees looks like... This is really hard, absolutely not. No."

He is right and no measurement was needed. The sentence asks the user to estimate an angle by eye, which is the
one thing a person cannot do. Every accuracy argument in this row is about the NUMBER being correct, and none of
them asked whether a person can ACT on a number. 49 degrees is exact and useless.

**The owner's design, given before he opened the build:**

🐋  "I would like to see you on a map. Where I'm standing, where Macca is, and the line between both, so instead
of the compass, it will be a line... North is always locked in place. And while I'm turning around... as soon as
I line up with Macca, once the line is straight, it will vibrate. Haptic feedback... every time I touch the line
haptic feedback. If I go past it, I come back, haptic feedback. If I'm off, no haptic feedback."

And the requirement that decides everything:

🐋  "I don't want to be able to reference anything in the real world. What if I'm inside my room... or I'm in a
very big shopping centre and I need to know where to pray and it takes 30 minutes to go out of the shopping
centre. We want this to work on the phone completely in the dark without any reference looking around."

**Why this is a genuinely better interaction and a harder engineering problem.** The haptic removes the number
entirely: the user turns until the phone taps their hand, so nothing has to be read, estimated or understood.
That is a real improvement over both the dial and the sentence.

It also requires knowing which way the phone points, which is the heading, which is the thing three sessions
have now failed to measure indoors. The street sentence exists precisely because it needs no heading. Removing
the external reference removes the only thing that was carrying the direction.

**The collision, stated plainly:** the owner's requirement (indoors, in the dark, no reference) can only be met
by the magnetometer, and the magnetometer is what measured 30 degrees wrong in his own bedroom and drifted 20
degrees at a fixed spot across hours.

**Two levers were never pulled, and both are recorded rather than promised:**

1. **The physics-based trust check is SPECIFIED AND NOT BUILT.** `ai/plans/40-heading-rearchitecture/agent-reports/D4-detection-and-honesty.md`
   defines checking the field MAGNITUDE and DIP against the expected values for the user's position. Session 40
   proved the platform's own accuracy band is worthless (the X8 reported HIGH while 71 degrees wrong), but a
   48 uT expectation reading 80 uT is steel, and that is physics rather than a self-report.
2. **Hard-iron calibration harvested from the turn the user already makes.** A local steel offset biases the
   whole circle, and fitting the magnetometer's readings over a full rotation is the standard correction for it.
   The owner's design has the user rotating anyway, so the calibration would cost no extra interaction, which is
   the objection that killed the sun rung (D4) and the stored calibration. UNTESTED, and session 41 already
   proved a STORED calibration cannot work because the error drifts with time; a calibration recomputed during
   the turn is a different claim and has not been measured.

**Status: STOPPED, awaiting the owner's decision.** The build stays on the phone. No code was changed by this
step.

### The owner's further design, same session

🐋  "zoom out until we can see Mecca... I want you to zoom out extra even more so I can see at least the city
that I'm in. And the entire city of Mecca... hide all the names except the city name that I'm in and the city
of Mecca... put a nice little Kaaba icon on Macca. Or if it's easier, just make the map draggable, pinchable,
zoomable, like Google Maps."

**Measured for the owner's own position (Parsons Green, 51.4750 N 0.2015 W) to the Kaaba, 4,796 km:**

| What | Result |
| --- | --- |
| Zoom that fits both on a phone canvas | **z3**, span 228x218 px, well inside 350 pt |
| London's 50 km width at z3 | **4.1 px** |
| True qibla (great circle) | **118.88** |
| A STRAIGHT line on a north-locked map (rhumb) | **133.74** |
| **Error if the path is drawn straight** | **14.86 degrees** |

**Three findings, and the first is a defect waiting to happen.**

1. **The path must be drawn as a CURVE, not a line.** A straight line on a north-up Mercator map IS the rhumb
   line, which is 14.86 degrees wrong here and **71.31 in Los Angeles**. This row's own research already
   recorded it, with a shipped app caught doing exactly this, and it is the documented reason some North
   American mosques face the wrong way. The great circle is drawn as a curve and the arrow at the user's
   position departs along it at 118.88.
2. **"See the entire city" is unreachable at that zoom and the arithmetic is not close.** Any zoom fitting both
   cities renders London 4 px wide. Two markers and two labels is the honest picture; two cities is not
   available at 4,796 km of separation.
3. **Pinch-and-zoom is the MOST expensive option offered, not the cheapest.** A static picture decodes nine
   small tiles once. Pan and zoom needs tiles at every level on demand, a gesture layer and a real map engine,
   priced in this row's own research at **+39.9 MB** for MapLibre against +0.0 for the `react-native-svg`
   already installed. The owner's "if that's easier" inverts the true cost.

### OWNER RULING: build it, and accept the sensor as it is

Asked directly whether to measure the two untried heading levers first, the owner chose to **build the whole
feature now and accept the magnetometer as it stands**.

This is recorded as a deliberate trade rather than an oversight, because it sits against this programme's own
measurements: the sensor read **30 degrees wrong in the owner's bedroom** (session 40) and drifted **20 degrees
at one fixed spot across hours** (session 41's controlled test, prediction written first). The haptic will
therefore tap the user's hand at the wrong angle in any room with steel in it, and the app cannot tell when.

The two untried levers stay unbuilt and stay recorded: the field-magnitude and dip physics check
(`ai/plans/40-heading-rearchitecture/agent-reports/D4-detection-and-honesty.md`, specified, never built) and
hard-iron calibration harvested from the turn the user already makes. Either could be added later without
reshaping the feature.

**Row 41 is CLOSED on its device proof: the code shipped and the interaction was rejected.** The new design is
a new row, because it reverses this row's founding decision (no sensor) and replaces the screen this row built.

### OWNER RULING: no `adhan` qibla maths, our own coordinates and our own trigonometry

🐋  "I don't want you to use the Qibla from the adhan app. I actually want you to build your own coordinates of
Mecca by referencing online sources... build it by yourself... no adhan qibla maths."

**Done, and the result is not what the ruling assumed. It is worth recording honestly.**

**The coordinates, sourced independently, five ways:**

| Source | Latitude | Longitude |
| --- | --- | --- |
| **OpenStreetMap, the SURVEYED building footprint** (way 103914569, area centroid computed from its 5 vertices) | 21.4224868 | 39.8261262 |
| Wikidata Q29466 (`P625`) | 21.4225 | 39.8261667 |
| Wikipedia geo API | 21.4225 | 39.82617 |
| latlong.net | 21.422487 | 39.826206 |
| `adhan`, the shipped value | 21.4225241 | 39.8261818 |

The OSM footprint is the strongest of these because it is a surveyed polygon rather than a quoted number, and
its side lengths measure **10.15, 9.15, 2.51, 10.17 and 12.00 m**, which matches the real Kaaba (roughly
rectangular, about 11 by 13 m, the short side being the Hijr corner). So it is the actual building.

**The worst disagreement between all five sources is 8.27 m.**

**THE FINDING THAT MATTERS: the coordinates were never the problem, and this is measurable rather than
arguable.** Across all five sources the qibla from the owner's own address spans **0.34 ARCSECONDS**, which is
0.0000932 degrees. Nine-millionths of a degree. The sensor that was rejected is wrong by **30 degrees**, which
is **320,000 times larger**.

Our own great-circle implementation, written from the spherical law of sines with no library:

| City | Ours | Previously recorded |
| --- | --- | --- |
| London | 118.876 | 118.99 |
| Cairo | 136.137 | 135.90 |
| Jakarta | 295.152 | 295.20 |
| New York | 58.482 | 58.50 |

**Cross-checked against a SECOND, independent method**: a full Vincenty inverse solution on the WGS84
ellipsoid, which models the Earth's actual flattening rather than a sphere. Sphere against ellipsoid differs by
**0.07 to 0.18 degrees** at every city tested. Both are far inside any usable tolerance, so the sphere ships
and the ellipsoid stands as the check that it is right.

**The honest conclusion, which contradicts the ruling's premise:** the previous compass was NOT misaligned
because of `adhan`'s coordinates or its trigonometry. Session 40 proved this directly by instrumenting the live
sensor stream: the bearing was exact and the HEADING was 71 degrees wrong. Replacing the maths changes the
answer by nine-millionths of a degree and fixes nothing.

Our own implementation ships anyway, and it is the right call for reasons the ruling did not name: it removes a
dependency from the one calculation the app must never get wrong, it is 12 lines we control and can test to the
arcsecond, and it makes the app's most important number auditable rather than borrowed.


### The version collision fired again, exactly as this row predicted

`uat-2` and a concurrent session both took **1.29.154**: this session bumped from a freshly fetched `origin`
at 08:34, and the global-prayer-times session committed its own 1.29.154 afterwards. The merge itself was
clean, because the two touched different files, but the version was duplicated.

This is **repeat-risk 5 in this row's own register, and the second time it has fired in two days.** Session
41's earlier note already says "fetch `origin` immediately before every version bump", and that was done; the
gap is that a bump is only safe until the moment someone else commits, so a fetch at the START of a long
session does not protect a commit made an hour later.

**The rule that actually holds: fetch `origin` immediately before `git push`, not only before the bump, and
re-bump if the version has been taken.** Resolved here by merging origin and moving this session's docs to
**1.29.155**.
