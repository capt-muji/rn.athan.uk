# Plan: Session 43. The qibla felt, not read

| Field | Value |
| --- | --- |
| Brief | `ai/plans/43-qibla-haptic/BRIEF.md` |
| Planned at | `53976c2b` (version 1.29.156), 2026-09-30 |
| Planned by | Planning session on 2026-09-30 |
| Needs first | 41 (DONE) |
| Steps | 5, each one branch, one commit, one version |
| Device | iPhone XS `00008020-0015585C22D2002E`, Release build, for step 5 |
| Owner decisions still needed | None. Both open questions were taken on 2026-09-30, section 2.1 items 1 and 2 |

## 1. Goal

The Qibla screen states a turn in degrees. The owner's own build read "Stand along Parsons Green Lane, then
turn 49 degrees to the left" and he rejected it in seconds, because **no person can estimate 49 degrees by
eye**. When this plan is DONE the screen shows a world map with the user and the Kaaba on it, the great-circle
path curving between them, and an arrow showing which way the phone points. **The user turns their body until
the phone taps their hand once.** Nothing has to be read, converted or understood, and it works in a windowless
room in the dark.

The owner's rules that apply, quoted:

- 🐋  "No user in their mind knows absolutely what 49 degrees looks like. This is really hard, absolutely not.
  No."
- 🐋  "I would like to see me on a map. Where I'm standing, where Macca is, and the line between both, so
  instead of the compass it will be a line... North is always locked in place. And while I'm turning around...
  as soon as I line up with Macca, once the line is straight, it will vibrate. Haptic feedback... every time I
  touch the line haptic feedback. If I go past it, I come back, haptic feedback. If I'm off, no haptic
  feedback."
- 🐋  "I don't want to be able to reference anything in the real world. What if I'm inside my room and I need
  to know where to pray, or I'm in a very big shopping centre and it takes 30 minutes to go out? We want this
  to work on the phone completely in the dark without any reference looking around."
- 🐋  "zoom out until we can see Mecca... hide all the names except the city name that I'm in and the city of
  Mecca... put a nice little Kaaba icon on Macca."
- 🐋  "no adhan qibla maths", and its companion: our own sourced coordinates.
- 🐋  "the comments should be extremely compact, and they should only explain the why."

**How the owner notices it is done:** he opens Qibla in a room with the curtains shut, turns on the spot, and
the phone taps his hand once when he faces Makkah. It taps again if he turns past and comes back. It does not
buzz while he holds still.

## 2. Decisions

### 2.1 Taken

1. **The heading comes from Reanimated's `useAnimatedSensor`, and `expo-sensors` is NOT installed.** Owner,
   2026-09-30, choosing it over `expo-sensors` when both were put to him with their costs. It is already a
   dependency at `react-native-reanimated@4.7.0`, it reads the OS-fused `ROTATION_VECTOR` (the sensor Google
   Maps uses, gyroscope included), and it runs the reaction **on the UI thread**, which a haptic that must fire
   the instant the line is crossed needs. Session 40 measured it at 9.7 degrees of error where `expo-location`
   read 71.
2. **One far map, north-locked, with a rotating "you are facing" arrow.** Owner, 2026-09-30. The map itself
   never rotates; only the arrow moves. The user lines the arrow up with the drawn curve.
3. **The path is drawn as a GREAT-CIRCLE CURVE, never a straight line.** Planner, on a measurement in this
   session's scratch worktree: from the owner's own address a straight line on the canvas departs at **133.459
   screen degrees against a true qibla of 118.876, which is 14.583 wrong**, while the 32-segment curve departs
   at **119.368, which is 0.493 out**. In Los Angeles the straight-line error is 71.31. The curve bows **27.4 px
   of a 300 px canvas**, so it is visibly a curve and not a rendering artefact.
4. **The alignment uses HYSTERESIS: enter at 4 degrees, leave at 8.** Planner, and it is the most valuable
   thing this session's spike found. A single 5-degree window fired **49 taps in 100 samples** when the reading
   jittered 0.3 degrees either side of the boundary, which is the continuous buzz the owner explicitly refused.
   With a 4-in, 8-out gap the same jitter fires **1**.
5. **A crossing only counts within 90 degrees of the line.** Planner, and it is the second spike defect. The
   signed offset changes sign at the qibla AND at the antipode, so a plain sign-flip test taps when the user
   faces directly AWAY from Makkah. Measured: the naive rule gave 4 taps per 2 revolutions where 2 is right.
6. **The Kaaba's coordinates are `21.4225, 39.8262` and the bearing is ours, not `adhan`'s.** Owner, 2026-09-30
   (🐋  "no adhan qibla maths"). Re-sourced from five independent places in session 41, the strongest being
   OpenStreetMap's surveyed footprint (way 103914569, area centroid 21.4224868, 39.8261262, sides 10.15, 9.15,
   2.51, 10.17 and 12.00 m). All five agree to **0.34 arcseconds** of bearing. Cross-checked against a Vincenty
   WGS84 solve to 0.07 to 0.18 degrees at eight cities.
7. **The magnetometer ships as it is, with no interference detection.** Owner, 2026-09-30, with the evidence in
   front of him: 30 degrees wrong in his bedroom, 20 degrees of drift at a fixed spot. Recorded as a deliberate
   trade in `BRIEF.md`. The two rescue levers stay unbuilt and named.
8. **No pinch, pan or zoom.** Planner, on the measurement in `BRIEF.md` trap 3: a static picture is 4 tiles
   decoded once, while pan and zoom needs a map engine priced at +39.9 MB. The owner offered it as a
   simplification and it is the reverse.
9. **Two labels only, and no city outlines.** Planner, on trap 2: at the zoom that fits both, **London is 4.1 px
   wide**, so "see the entire city" is arithmetically unavailable. The user's city name and "Makkah" are drawn
   as text beside their markers.

### 2.2 The executor must not decide

STOP and ask the owner when any of these happens.

1. Any anchor count other than 1. Ask: "Anchor `<file>` counts `<n>`, not 1. The plan is stale. Replan?"
2. A test fails that this plan does not name. Ask: "`<test>` failed and the plan does not predict it. Here is
   the failure: `<line>`. What should I do?"
3. A break prints `BREAK NOT APPLIED`. Ask: "Break `<label>` did not apply, so it tests nothing. The plan's
   search text does not match the code. Replan?"
4. `expo-sensors`, or any other package, appears to be needed. Ask: "This step seems to need `<package>`, which
   the plan does not install. Decision 2.1 item 1 says the heading comes from Reanimated. What should I do?"
   **Never run `yarn add`.**
5. The sensor reads nothing on the simulator during step 5. Ask: "The rotation sensor reports no values on this
   device. Should the proof move to the physical iPhone only?"
6. Anything the step does not answer. Ask: "The plan does not say `<X>`. What should it be?"
7. Anything touching visuals beyond this screen, a prayer time, a release file, `uat` or EAS.
8. A review finding that section 10 does not answer and that does not meet all three conditions in
   `EXECUTOR-BRIEF.md` section 4, item 8.

## 3. Pre-flight

Save as `$TMPDIR/preflight-43.sh` and run `bash $TMPDIR/preflight-43.sh <k>`.

```bash
#!/bin/bash
# Pre-flight for session 43. Usage: bash preflight-43.sh <first step not DONE>
set -u
STEP="${1:?give the first step not ticked DONE}"
REPO=/Users/muji/repos/rn.athan.uk
cd "$REPO" || { echo "STOP: not at $REPO"; exit 1; }

BRANCH=$(git branch --show-current)
[ "$BRANCH" = "uat-2" ] || { echo "STOP: on $BRANCH, not uat-2"; exit 1; }

DIRTY=$(git status --porcelain | grep -v -E 'ai/plans/README.md|ai/plans/43-qibla-haptic/(PLAN|LOG).md|opencode.json' || true)
[ -z "$DIRTY" ] || { echo "STOP: unexpected changes:"; echo "$DIRTY"; exit 1; }

git fetch -q origin uat-2
git merge-base --is-ancestor origin/uat-2 uat-2 || { echo "STOP: uat-2 is behind origin/uat-2"; exit 1; }

VERSION=$(node -e "console.log(require('./package.json').version)")
echo "version: $VERSION"

grep -q '^| 41 .*DONE' ai/plans/README.md || { echo "STOP: row 41 is not DONE"; exit 1; }

count() {
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"
}
check() {
  local n
  n=$(count "$1" "$2")
  echo "anchor $(basename "$1"): $n"
  [ "$n" = "1" ] || { echo "STOP: anchor $1 counts $n, not 1 (NEEDS REPLAN)"; exit 1; }
}

A=ai/plans/43-qibla-haptic/scripts/anchors
if [ "$STEP" -le 4 ]; then check $A/4-1.txt components/sheets/screens/Qibla.tsx; fi

# Reanimated must expose the sensor API this plan builds on
node -e "const r=require('./node_modules/react-native-reanimated/package.json');console.log('reanimated',r.version)"
grep -q 'useAnimatedSensor' node_modules/react-native-reanimated/lib/typescript/index.d.ts \
  || { echo "STOP: useAnimatedSensor is not exported by the installed reanimated"; exit 1; }
node -e "require('./node_modules/expo-haptics/package.json')" || { echo "STOP: expo-haptics missing"; exit 1; }
node -e "require('./node_modules/react-native-svg/package.json')" || { echo "STOP: react-native-svg missing"; exit 1; }

# expo-sensors must NOT be installed: decision 2.1 item 1
if [ -d node_modules/expo-sensors ]; then echo "STOP: expo-sensors is installed and the plan forbids it"; exit 1; fi

# The tile archive must answer range requests and cover zoom 3
CODE=$(curl -s -o /dev/null -w '%{http_code}' -r 0-126 https://build.protomaps.com/20260929.pmtiles || echo 000)
echo "archive range request: $CODE"
[ "$CODE" = "206" ] || { echo "STOP: archive answered $CODE, not 206"; exit 1; }

echo PREFLIGHT OK
```

Expected tail: `PREFLIGHT OK`. An anchor count other than 1 means NEEDS REPLAN. Any other failure means STOP.

## 4. Background the executor needs

### 4.1 Code map

| File | What it does | This plan |
| --- | --- | --- |
| `components/sheets/screens/Qibla.tsx` | The Qibla sheet. Calls `useQiblaMap` on present, draws `QiblaMap` and the sentence | **Rewritten in step 4** |
| `hooks/useQiblaMap.ts` | Reads position, fetches tiles, finds streets, builds the state | **Deleted in step 4** |
| `components/qibla/QiblaMap.tsx` | Draws the close-in street map | **Deleted in step 4** |
| `components/qibla/mapProjection.ts` | `projectToCanvas`, `rayEndpoint` for the close-in map | **Deleted in step 4** |
| `shared/qiblaStreet.ts` | `nearbyStreets`, `rankStreets`, `qiblaFromStreet` | **Deleted in step 4** |
| `shared/qiblaSentence.ts` | Builds "Stand along X, then turn N degrees" | **Deleted in step 4** |
| `shared/qibla.ts` | `qiblaBearing` (**rewritten in step 1, no `adhan`**), `normaliseHeading`, `shortestDelta` | Changed in step 1 |
| `device/qibla.ts` | Permission and `readPosition` | Unchanged |
| `device/tiles.ts` | `tilesAround`, the fetch and cache path | Gains `tilesForWorld` in step 2 |
| `shared/tileGeometry.ts` | `positionInTile`, `metresPerDegree`, `distanceInMetres` | Unchanged |
| `shared/vectorTile.ts` | The MVT decoder, returns layers keyed by name | Unchanged, read only |
| `shared/tileCache.ts` | The 25 MB LRU cache | Unchanged |

### 4.2 The heading path, recovered from git

The heading was deleted in `c0c24524`. The executor does not need to recover it: every fact it established is
written here, because two of them cost a session each to find.

| Fact | Why it matters |
| --- | --- |
| `useAnimatedSensor(SensorType.ROTATION, { interval, iosReferenceFrame })` | The API that carries the fused heading |
| **`iosReferenceFrame: IOSReferenceFrame.XTrueNorthZVertical` is mandatory** | Reanimated's default is `Auto`, which resolves to `XArbitraryCorrectedZVertical`, whose yaw zero is **wherever the phone woke up**. A compass on the default points at nothing. |
| **The iOS axis correction is 180** | Under that frame, yaw turns from a reference half a turn from the bearing the top edge points at. It is an axis relationship, so only a multiple of 90 is defensible. Session 40 tuned seven values by eye and never converged; 180 is the one the readings support. |
| **The declination correction is Android-only** | `XTrueNorthZVertical` is already true-north referenced, so applying declination on both bends the iOS needle by twice the local declination. |
| **`useAnimatedSensor` subscribes for its component's life** | Every sheet in this app is mounted from launch, so the sensor must live in a child rendered only while the sheet is open, or it arms the magnetometer on every device forever (Performance Design Rule 7). |
| **`rotation.register()` does not exist** | Only `unregister`. Calling it crashes on open. |

### 4.3 Existing tests

| Suite | What it proves | This plan |
| --- | --- | --- |
| `shared/__tests__/qibla.test.ts` | `qiblaBearing` against known cities, `normaliseHeading`, `shortestDelta` | Kept, and step 1 adds rows |
| `shared/__tests__/qiblaStreet.test.ts` | The street finder and ranking | **Deleted in step 4** |
| `shared/__tests__/qiblaSentence.test.ts` | The sentence strings | **Deleted in step 4** |
| `hooks/__tests__/useQiblaMap.test.ts` | The state machine, cross-tile ranking | **Deleted in step 4** |
| `components/qibla/__tests__/*` | The close-in map drawing | **Deleted in step 4** |
| `shared/__tests__/unusedExports.test.ts` | No exported symbol is unreferenced | **Sequencing constraint: it fails if a step adds an export nothing imports yet.** Each step below adds its consumer in the same commit. |

### 4.4 Why the obvious approach is wrong

**Drawing a straight line from the user to the Kaaba is the defect this row must not ship.** A straight line on
a north-locked Mercator canvas IS the rhumb line. Measured in this session's scratch worktree from the owner's
own address: straight departs at 133.459 screen degrees, the true qibla is 118.876, an error of **14.583
degrees**. In Los Angeles it is 71.31. A shipped app has been caught at exactly this and it is the documented
reason some North American mosques face the wrong way.

## 5. Design

**The invariant, in one sentence a test can check:** the phone taps exactly once each time the heading enters
the aligned window from outside it, and never while the heading holds still or sits at the antipode.

**The chosen approach.** Four pure modules and one screen.

1. `shared/qibla.ts` gains our own great-circle bearing and loses the `adhan` import.
2. `shared/greatCircle.ts` returns the path as an array of positions, so the drawing bends correctly.
3. `shared/qiblaAlignment.ts` is the hysteresis state machine, pure and fully testable off-device.
4. `device/tiles.ts` gains `tilesForWorld`, which fetches the four z3 tiles bounding the user and the Kaaba.
5. `components/sheets/screens/Qibla.tsx` draws it and fires the haptic.

**Alternatives rejected.**

| Rejected | Why |
| --- | --- |
| A single alignment window with no hysteresis | Measured: 49 taps in 100 samples of 0.3-degree jitter at the boundary. The continuous buzz the owner refused. |
| A plain sign-flip crossing test | Fires at the antipode, so it taps when the user faces away from Makkah. Measured 4 taps per 2 revolutions against a correct 2. |
| Drawing the path straight | 14.583 degrees wrong at the owner's address, 71.31 in Los Angeles. |
| Pinch, pan and zoom | +39.9 MB for a map engine, against a static picture that decodes 4 tiles once. |
| `expo-sensors` | A new dependency whose Magnetometer is the raw unfused reading that measured 71 degrees wrong, and whose DeviceMotion runs on the JS thread, adding latency to the haptic. |
| Keeping the street sentence beside the map | It is the thing the owner rejected. Keeping it would make the screen state a number again. |
| A continuous vibration while aligned | 🐋  "not a continuous haptic feedback". |

**The concurrency trace.**

| Event | Before | After |
| --- | --- | --- |
| App launch | Sheet mounts, nothing runs | Same. No sensor, no tile, no fetch at mount. |
| Sheet opens (`onPresent`) | `readPosition`, tiles, street search | `readPosition`, then the four z3 tiles, then the sensor child mounts |
| While open | Nothing moves | The sensor drives the arrow on the UI thread; each crossing calls back to JS for one haptic |
| Sheet closes (`onDismiss`) | State dropped | The sensor child unmounts, so the subscription ends |
| Re-open at the same place | Position re-read | Position re-read, tiles served from cache |

**The design review, by the planning session, 2026-09-30, on its own design.** Attacked it three ways and two
attacks landed.

1. **"What fires the haptic, the UI thread or JS?"** The reaction runs on the UI thread and `Haptics` is a JS
   API, so the crossing must cross the bridge with `runOnJS`. That is one call per crossing, not per sample,
   which is the reason the state machine returns a boolean rather than the raw offset.
2. **"What happens at the antipode?"** It taps. Found by running the spike over two full revolutions and
   counting 4 where 2 is right. Fixed with the 90-degree crossing bound, and it is now a named test.
3. **"What happens when the hand shakes at the window edge?"** 49 taps in 100 samples. Fixed with hysteresis,
   and it is now two named tests.

## 6. Steps

- [x] Step 1: DONE in `edad8439`
- [ ] Step 2: The great-circle path, as drawn positions (specified)
- [ ] Step 3: The alignment state machine, with hysteresis (specified)
- [ ] Step 4: The screen: the world map, the arrow and the haptic (specified)
- [ ] Step 5: The device proof on the iPhone XS (specified)

Each step's detail is in `steps/<k>-<name>.md`. Scripts are in `scripts/`, anchors in `scripts/anchors/`.

## 7. Device proof

Full detail in `steps/5-device-proof.md`. In summary: a local Release build on the iPhone XS
(`00008020-0015585C22D2002E`), and the owner turning on the spot **in a room with the curtains shut**, which is
the requirement that queued this row. No clock change is needed, so no `dumpsys alarm` reading is required and
no armed alarm can fire. The phone is left on the Release build with automatic time on.

**The acceptance is the owner's hand, not a screenshot.** The screenshot checks the drawing; only the owner can
say whether the tap arrives when he faces Makkah.

## 8. Records

Given in `steps/5-device-proof.md` section 8, with `<TESTS_AFTER>` and `<SUITES_AFTER>` as the only
placeholders.

## 8b. What the planning session proved, and what it did not

**Proven in the scratch worktree `~/athan-device-sweep/worktrees/plan-43`, then deleted:**

| What | Result |
| --- | --- |
| Steps 1, 2 and 3 built end to end | **53 tests, 100% statements, branches, functions and lines** |
| `npx tsc --noEmit` | exit 0 |
| `npx biome check --error-on-warnings` | exit 0 |
| `scripts/breaks-1.sh` | **7 of 7, ALL AS EXPECTED: 1** |
| `scripts/breaks-2.sh` | **7 of 7, ALL AS EXPECTED: 1** |
| `scripts/breaks-3.sh` | **8 of 8, ALL AS EXPECTED: 1** |
| Our own bearing against the 29 existing tests | All 29 pass **unchanged** |
| `unusedExports.test.ts` on the new modules alone | **Fails, naming `stepAlignment` and the rest.** The sequencing constraint in step 3 is proven, not predicted. |

**NOT proven:** step 4 and `scripts/breaks-4.sh`. Its breaks target code the executor writes, so they could not
be run here. If one prints `BREAK NOT APPLIED`, that is section 2.2 item 3.

**Six defects the spike found, every one in this plan's own first draft rather than in the code:**

1. **A single alignment threshold fired 49 taps in 100 samples** of 0.3-degree jitter. This is the continuous
   buzz the owner refused, and it is why hysteresis exists.
2. **The crossing test fired at the antipode**, so the phone tapped when facing away from Makkah. Found by
   running two full revolutions and counting 4 where 2 is right.
3. **The obvious fast-spin test lands 1.12 degrees from the line by luck**, so it never exercised the crossing
   branch at all and a break SURVIVED against it. A 35-degree step never lands inside the window, and the test
   now asserts that premise so it cannot silently rot.
4. **The great-circle suite passed against a LINEAR implementation.** Only the even-spacing assert catches a
   linear `toWeight`, a halved `arc` or a broken haversine, because all three keep the path on the great circle
   and both endpoints exact: a correct path gives `max/min` hop of `1.000000`, those give `1.155330`,
   `1.108577` and `1.072947`.
5. **`distanceInMetres` is a flat approximation** whose own doc says "nearby positions", so using it over
   4,796 km was wrong. The test declares its own `arcBetween`.
6. **The first `departs along the qibla bearing` assertion was simply wrong**, measuring the bearing AT
   `path[1]` where it should measure the bearing FROM the user TO `path[1]`. Along a great circle the bearing
   changes continuously, so London already reads 120.330 at `path[1]` against 118.876.

## 9. Risks

| Risk | Why it is real | What the plan does |
| --- | --- | --- |
| **The heading is wrong indoors** | Measured at 30 degrees in the owner's bedroom | Nothing. Owner ruling 2.1 item 7. The proof will show it, and the two rescue levers are named in `BRIEF.md`. |
| The haptic fires late | The reaction is on the UI thread, the haptic is on JS | One `runOnJS` per crossing, never per sample. Step 5 asks the owner whether the tap felt immediate. |
| The z3 tiles have no coastline | A world map with no land is unreadable | The `earth` layer is confirmed present in the archive; step 2 asserts the decoded tile carries it. |
| Two sessions take one version | Fired twice in two days | `EXECUTOR-BRIEF.md` order, plus fetch `origin` immediately before pushing. |

## 10. Anticipated review fixes

| Symptom | The fix, word for word |
| --- | --- |
| `unusedExports.test.ts` fails naming a new export | The step that adds an export also adds its consumer. If the consumer is in a later step, move the export into that later step. Never add an ignore. |
| `versionLockstep.test.ts` fails | Set the same version in `app.json`, `package.json` and `android/app/build.gradle`, and commit again. |
| tsc reports the `adhan` import is unused in `shared/qibla.ts` after step 1 | Delete the import line. Step 1 removes the last use of it. |
| Biome reports the haptic import is unused in a test | The test asserts the mock was called; import the mock, not the module. |

Anything else: `EXECUTOR-BRIEF.md` section 4, item 8.

**Files to restore, per step**, if a step stops part-way: listed in each step's part 10.

## 11. Who does what

One session does the planning, the execution and the audit. Subagents are banned except `vision`, and `vision`
is called only with a file path and one exact question, for an image.

## 12. The report

The execution session's final response starts with `Execution session`, then the time line, then at most three
sentences, then the progress table from `EXECUTOR-BRIEF.md` section 6, then the four-line handoff.
