# Execution log: Session 43

## Pre-flight

`bash $TMPDIR/preflight-43.sh 1` printed `version: 1.29.157`, `anchor 4-1.txt: 1`, `reanimated 4.7.0`,
`archive range request: 206`, then `PREFLIGHT OK`. Row set to IN PROGRESS.

## Step 1: Our own qibla bearing, with no `adhan`

Branch `feat/43-own-bearing`.

**Red.** The four new rows in `shared/__tests__/qibla.test.ts` failed with
`TypeError: (0 , _qibla.bearingTo) is not a function`, at `Tests: 4 failed, 29 passed, 33 total`. All 29 existing
rows passed before the change, which is what the step requires.

**Green.** `Tests: 33 passed, 33 total`. `npx tsc --noEmit` exit 0, `npx biome check . --error-on-warnings` exit 0.
`grep -rn adhan shared/ device/ hooks/ components/ app/ stores/` outside tests returns nothing.

**Breaks.** `scripts/breaks-1.sh` caught 7 of 7, `ALL AS EXPECTED: 1`.

### The hook failed on a test the plan does not name, and the plan predicted the opposite direction

`shared/__tests__/unusedExports.test.ts` failed at `Tests: 1 failed, 5010 passed, 5011 total`, coverage 100% on
all four measures. The failing row is `keeps every allow-list entry earning its place, so a stale reason cannot
hide a live symbol`:

```
- Expected  - 1
+ Received  + 0
    "ErrorBoundary",
-   "KAABA",
```

**What happened, and it is a direct consequence of the step's own instruction.** `KAABA` used to be a
restatement of a value only tests read, so it reported unreachable from production and sat on that suite's
allow-list with the reason `adhan keeps its own copy private, so this states it for the test that pins the two
together`. Step 1 makes `qiblaBearing` compute `bearingTo(position, KAABA)`, so production now reaches `KAABA`
and the allow-list entry is stale. Its reason text names the dependency this very step deletes.

**This is the REVERSE of what the plan predicted.** `PLAN.md` section 4.3 and section 10 both describe this
suite failing because a step adds an export nothing imports yet. It failed because a step made an allow-listed
export reachable, which that suite's second row exists to catch. Neither section covers it, so it is
`PLAN.md` section 2.2 item 2 and `EXECUTOR-BRIEF.md` section 7 (`Do not edit the test`).

**Question put to the owner**, with the observation that deleting the entry makes the suite STRICTER rather than
weaker: with `KAABA` off the list, a future edit that stopped production reaching it would fail this test, where
today it would pass silently.

**OWNER DECISION 2026-09-30: delete the `KAABA` allow-list entry.** Done; that suite is back to 2 passed. No
production code changed for it, and no assertion was weakened.

**A lesson for the next plan that deletes a dependency.** `unusedExports.test.ts` has TWO rows and they fail in
opposite directions. Every plan in this programme anticipates the first (an export nothing imports yet) and none
anticipates the second (an allow-listed export that production starts reaching). A step that makes a
test-only symbol load-bearing must budget for the allow-list entry going stale, and the giveaway is in the
entry's own reason text: this one cited the dependency the step removes.

**Commit** `edad8439`, version `1.29.158`. Hook: `Test Suites: 192 passed, 192 total`,
`Tests: 5011 passed, 5011 total`, and Statements, Branches, Functions and Lines all `100%`.

**Review: one round, clean.** Read `git show edad8439` back cold against the step's checklist.

- `adhan` appears nowhere in `shared/`, `device/`, `hooks/`, `components/`, `app/` or `stores/`: confirmed by grep.
- `KAABA` is exactly `21.4225, 39.8262`.
- The 29 existing tests are byte-identical: the diff on `qibla.test.ts` is additions only.
- `east` and `north` are not swapped: the owner's address reads **118.876** and London **118.987**, computed from
  the shipped formula. A swap would read near 61.
- No comment explains what or how.

**One observation for the auditor, deliberately NOT fixed.** Two existing things still name `adhan` in words while
the dependency is gone: the suite's own row `states the same Kaaba position adhan computes from`, and a comment
above it. Both assertions are about bearings on the Kaaba meridian and still hold, so nothing is wrong with what
they check; only their wording is now historical. The step says the 29 existing tests are byte-identical and
`EXECUTOR-BRIEF.md` forbids editing a test the plan did not name, so they are left exactly as they are.

**Merge** `67737213`, `--no-ff` into `uat-2`.

### The version collision fired again, for the THIRD time in three days

`origin/uat-2` gained `ab8bbea9`, `1.29.158 - docs(global-prayer-times): R9, the remaining countries`, at 09:55,
between this session's pre-flight (09:47, which read `origin/uat-2` at `1.29.157` and passed
`git merge-base --is-ancestor`) and this step's commit at 10:00. Both took **1.29.158**.

`origin/uat-2` merged into `uat-2` cleanly at `2e4e0764`, because the concurrent session touched only
`ai/features/global-prayer-times/` and this step touched only `shared/`. Nothing shipped wrong and no code
conflicts. The cost is cosmetic: **two commits on `uat-2` now carry 1.29.158**, and the later steps continue from
1.29.159 so no third commit can take it.

This is risk 4 in `PLAN.md` section 9 ("Two sessions take one version, fired twice in two days"), whose remedy is
"fetch `origin` immediately before pushing". That remedy does not cover this case, and session 41's log already
found the same gap from the other side: a fetch at the START of a session does not protect a commit made minutes
later, because the window is between the bump and the other session's push, not between the bump and ours.

**The rule that would actually have caught it: fetch and re-read `origin/uat-2`'s version in the same breath as
setting the three version files, then treat a bump as void the moment the commit is not immediate.** In practice
that means the bump belongs in part 6 of the step loop right before `git commit`, which is where the brief already
puts it; the failure here is that the hook took four minutes and had to be re-run after the `unusedExports` STOP,
so 13 minutes passed between the bump and the commit that stuck.

## Step 2: The great-circle path, as drawn positions

Branch `feat/43-the-screen`, which carries steps 2, 3 and 4 under one commit (the sequencing note in step 3).

**Red.** `shared/__tests__/greatCircle.test.ts` failed with
`Cannot find module '../greatCircle' from 'shared/__tests__/greatCircle.test.ts'`, at `Tests: 0 total`.

**Green.** `Tests: 12 passed, 12 total` (the plan predicts `3 passed`, which counts `it` blocks before the three
`it.each` rows expand across London, Los Angeles and New York; 12 is the same six rows). Coverage of
`shared/greatCircle.ts` 100% statements, branches, functions and lines. `npx tsc --noEmit` exit 0.

### `BREAK NOT APPLIED` on break 4, and the formatter is the cause the plan predicted

Ran `npx biome check . --write` BEFORE the break script, as step 4 part 7 requires. It reformatted
`shared/greatCircle.ts`, and then:

```
caught: spherical interpolation replaced by a straight line
caught: destination weight made linear
caught: path reduced to its two endpoints
BREAK NOT APPLIED: arc length halved
caught: haversine loses its latitude term
caught: zero arc no longer guarded
caught: latitude dropped from the reconstruction
caught 6 of 7
ALL AS EXPECTED: 0
```

**Why.** The break searches for `const arc = 2 * Math.asin(`. Written as the plan gives it verbatim, that
expression is 133 characters, over Biome's `lineWidth` of 120, so the formatter breaks it after the `=`:

```ts
  const arc =
    2 * Math.asin(Math.min(1, Math.sqrt(halfLatitude + Math.cos(fromLatitude) * Math.cos(toLatitude) * halfLongitude)));
```

`const arc =` and `2 * Math.asin(` are now on different lines, so the search text cannot match and break 4 tests
nothing. **This is exactly session 41's lesson firing again**, and this plan's step 4 quotes it: a break whose
search text a formatter can move silently stops testing anything. The difference is that here the plan's own
verbatim code is what exceeds the line width, so no ordering of formatter and script can fix it.

**Measured, not guessed.** Extracting the haversine into a named constant puts `const arc = 2 * Math.asin(` back on
one line at 63 characters, and with that one change the same script reports **`caught 7 of 7`,
`ALL AS EXPECTED: 1`**, with the suite still at 12 passed and coverage still 100% on all four measures. Verified as
a probe, then reverted pending the owner's decision.

This is `PLAN.md` section 2.2 item 3 (`A break prints BREAK NOT APPLIED... Replan?`), so it is a STOP.

**OWNER DECISION 2026-09-30: extract the haversine constant.** Applied, with a one-line comment giving the WHY (the
formatter split, not the arithmetic). Every term the plan gives verbatim survives; only the sub-expression is named.
After it: `npx biome check . --write` exit 0, `npx tsc --noEmit` exit 0, `Tests: 12 passed, 12 total`, coverage 100%
on all four measures, and `scripts/breaks-2.sh` **caught 7 of 7, `ALL AS EXPECTED: 1`**.

**A durable lesson for any plan that gives a formula verbatim.** A verbatim contract and a break script that
searches for a slice of that contract are only compatible if the contract fits the repo's `lineWidth`. Session 41's
version of this lesson was "run the formatter BEFORE the break script"; that is necessary and not sufficient,
because here the plan's own line is the thing over the limit and no ordering helps. **A planning session that
writes a break searching for a code slice should check that slice is under 120 characters as formatted**, or name a
sub-expression so it is.

## Step 3: The alignment state machine, with hysteresis

Same branch, `feat/43-the-screen`.

**Red.** `shared/__tests__/qiblaAlignment.test.ts` failed with
`Cannot find module '../qiblaAlignment' from 'shared/__tests__/qiblaAlignment.test.ts'`, at `Tests: 0 total`.

**Green.** `Tests: 17 passed, 17 total` (the plan predicts 12: the 14 rows it specifies, of which row 14 carries four
asserts, plus three rows this session added to cover `initialAlignment` and the two constants, which the 100% gate
needs). Coverage of `shared/qiblaAlignment.ts` **100% statements, 100% branches (13 of 13), functions and lines**.
`npx tsc --noEmit` exit 0, `npx biome check . --write` exit 0 and it moved nothing in this file.

**Breaks.** `scripts/breaks-3.sh` **caught 8 of 8, `ALL AS EXPECTED: 1`**. Every one of the four search texts the
script slices out of this module survives the formatter, unlike step 2's arc line.

**The two spike defects the plan warned about are both genuinely exercised**, which the break script confirms rather
than the suite alone: `sign change no longer detected` is caught (so the crossing branch runs, which needs the
35-degree spin row whose premise is asserted first), and `crossing bound removed` is caught (so the antipode row
would fail without the 90-degree bound).

## Step 4: The screen

**Anchor check.** `scripts/anchors/4-1.txt` against `components/sheets/screens/Qibla.tsx` counts `1`.

### The pre-delete blast-radius read found a caller the plan's delete list does not cover

Step 4 part 3 says to run `codegraph_explore` on the deleted symbols first and STOP if a caller outside the deleted
set appears. It did:

> `qiblaSentence` (shared/qiblaSentence.ts:20) — 4 callers in `components/sheets/screens/Qibla.tsx`; tests:
> `shared/__tests__/qiblaSentence.test.ts`, **`shared/__tests__/realTile.test.ts`**

`shared/__tests__/realTile.test.ts` is NOT in the plan's delete list, and it imports three of the dying symbols:
`qiblaSentence`, `nearbyStreets` and `qiblaFromStreet`. Confirmed by grep across the whole tree; it is the only file
outside the delete set that touches them.

**What it is, and why it is not the same kind of file as the others.** It is the only suite that reads REAL bytes
from the Protomaps archive rather than a fixture the session wrote, and its own doc comment gives the reason: "a
reader and a fixture written from the same wrong understanding agree perfectly". Nine tests, all passing. They split
cleanly in two:

| Rows | What they prove | After the delete |
| --- | --- | --- |
| 1, 2, 3 | The MVT decoder reads the archive's real layers and feature counts, and the qibla at that tile is 119 | **Still valid.** They touch no deleted symbol, and step 4 keeps the decoder. |
| 4, 5, 6, 7, 8, 9 | The street finder, the sentence, and the self-correction under a 100 m position error | **Cannot survive**: every one calls a function this step deletes. |

So the honest count is that deleting the street finder also deletes six of these nine rows, including row 9, which is
the measured evidence for session 41's central finding. That finding is about a feature the owner has now rejected,
so the rows are testing something the app will no longer do.

This is `PLAN.md` section 2.2 item 6 (anything the step does not answer), so it is a STOP rather than a guess.

**OWNER DECISION 2026-09-30: keep rows 1 to 3, delete rows 4 to 9.** `realTile.test.ts` is now four rows, all green:
the three London rows plus the Makkah Arabic-name row, which survived because it can read the `name` tag straight off
the decoded layer rather than through the deleted street finder. That keeps the only real-archive-bytes proof of the
MVT decoder, which step 4's own `tilesForWorld` depends on.

### A second suite the delete list does not name: the screen's own

`components/sheets/screens/__tests__/Qibla.test.tsx` tests the screen step 4 REWRITES, so it is not a deletion and not
a keep: every one of its six rows asserts the street sentence or the `qibla-ray` testID, both of which are gone. It is
rewritten in place, for the same screen, which is what the step's "Changed" list implies for `Qibla.tsx` itself. Nine
rows now, covering the three states, the drawing, when the sensor is armed and dropped, the iOS reference frame, and
the haptic firing once on a crossing and never on a hold.

### Six defects found by building, not by reasoning

1. **`useAnimatedProps` cannot rotate an SVG node under the Jest mock, and the plan's `matrix` assertion is
   unreachable through it.** Measured: a static `<Path rotation={90} origin={...}>` resolves to
   `matrix [6.12e-17, 1, -1, 6.12e-17, 100, 0]`, but the same path with `animatedProps={{ rotation: 90 }}` renders
   `matrix [1, 0, 0, 1, 0, 0]`, because the published Reanimated mock returns the props object and never applies it.
   Session 37's dial had the same need and solved it differently: it rotated an `Animated.View` LAYER with
   `useAnimatedStyle`, which is also the faster thing on device (a compositor matrix multiply rather than an
   `react-native-svg` pipeline re-walk). `FacingArrow` now does that, and its test asserts the layer's `rotate`
   transform. **The plan's `matrix` rule still stands for a STATIC transform**, which is what session 37 asserted; it
   simply does not reach an animated one.
2. **`getByText` cannot find SVG text at all.** `react-native-svg` draws a label as an `RNSVGTSpan` host node carrying
   a `content` prop, so `screen.queryAllByText(/./)` returns **0** for a canvas with two visible labels. Session 37
   met this and wrote a tree walk for it; this suite does the same, and the row now asserts
   `svgLabels()` equals `['London', 'Makkah']` exactly, which also proves the "nothing else" half.
3. **The plan's logger call has Pino's argument order, not this repo's.** It specifies
   `logger.warn({ tile }, 'Tile unavailable for the world map')`, and `shared/logger.ts` takes the message first:
   tsc refused it with `Argument of type '{ tile: TileAddress; }' is not assignable to parameter of type 'string'`.
   Corrected to `logger.warn('QIBLA: Tile unavailable for the world map', { tile })`, matching all four existing calls
   in `device/qibla.ts` and the `QIBLA:` prefix every other message in this path uses.
4. **`tilesForWorld(here).catch(...)` crashes when the function is mocked without a promise return.** Found by a probe
   whose mock returned `undefined`: `TypeError: Cannot read properties of undefined (reading 'catch')`. The real
   function always returns a promise, so this is defensive rather than a live defect, but a hook whose whole purpose is
   to degrade gracefully should not be the thing that throws. Now `Promise.resolve(tilesForWorld(here)).catch(...)`.
5. **The first "sensor is dropped on dismiss" test asserted the wrong thing.** It checked that `qibla-facing`
   disappears, but the arrow belongs to the MAP, not the sensor, so it is still there with the sheet closed and the
   test failed against correct code. The sensor child renders `null`, so it has no visible observable at all. Measured
   the real one: open registers 1 `useAnimatedSensor` call, dismiss and reopen registers a 2nd. A second registration
   is only possible if the first child unmounted, so that is the assertion.
6. **Two coverage holes in `useQiblaWorld` that the plan's four test rows leave open**, both in `nearestPlaceName`:
   a place with no geometry or no name (branch 2), and a farther place arriving AFTER a nearer one (branch 4, which
   only one of the two feature orders exercises). Found at 95.34% statements and 83.33% branches, and closed with
   `it.each` over both orders plus a malformed-feature row. The archive genuinely carries both shapes.

**Green, per file.**

| Suite | Tests | Coverage of its file |
| --- | --- | --- |
| `shared/__tests__/greatCircle.test.ts` | 12 | 100% on all four |
| `shared/__tests__/qiblaAlignment.test.ts` | 17 | 100% on all four, 13 of 13 branches |
| `hooks/__tests__/useQiblaWorld.test.ts` | 10 | 100% on all four |
| `device/__tests__/tiles.test.ts` | 18 | 100% on all four |
| `components/qibla/__tests__/WorldMap.test.tsx` | 8 | with the screen suite below |
| `components/sheets/screens/__tests__/Qibla.test.tsx` | 9 | with the map suite above |
| `shared/__tests__/realTile.test.ts` | 4 | decoder rows only |

`npx tsc --noEmit` exit 0 and `npx biome check . --error-on-warnings` exit 0.

### A seventh defect, found only by the WHOLE suite: `tilesAround` became dead code

Every per-file run was green and `unusedExports.test.ts` still failed:

```
NEVER reachable from production code: 6
  device/tiles.ts: tilesAround
```

`tilesAround` and `TILE_ZOOM` existed for the close-in street map, which step 4 deletes, and `tilesForWorld` is the
only tile entry point the app now has. The plan's `device/tiles.ts` row says "Gains `tilesForWorld`" and does not say
the old function goes, so this is the **same class of defect session 41 met** ("the dead-code guard refused three
exports, of which `clearTiles` turned out to duplicate a wipe `clearAllExcept` already does"): a plan that adds a
replacement rarely remembers to name the thing it replaces.

Both are deleted. Their 13 archive-protocol test rows are NOT deleted, because they test `loadTile` and `fetchTile`,
the PMTiles directory walk, the leaf walk, the gzip and every failure path, all of which `tilesForWorld` uses
unchanged: those rows now drive `tilesForWorld` instead, and `device/tiles.ts` stays at **100% on all four measures
(66 statements, 20 branches, 8 functions, 53 lines)** with 17 rows.

One of those rows asserted `'QIBLA: No map data for this location'`, a log line only `tilesAround` emitted. Replaced
with a row that names all four expected world tiles one by one rather than counting them, so a grid that silently
shrank would still fail.

### An eighth defect, and the first diagnosis of it was wrong

The whole-suite run left `hooks/useQiblaWorld.ts` at 99.95% with two uncovered statements, lines 62 and 65, both in
`nearestPlaceName`. The first explanation written here was "the two-project coverage merge", which `jest.config.js`
does warn about. **That was wrong, and measuring it is what showed so:** both projects emit a 43-statement map for
this file, so the maps agree and the merge is sound. Measured per project:

| Run | line 62 | line 65 |
| --- | --- | --- |
| `unit` alone (`useQiblaWorld.test.ts`) | 8 hits | 6 hits |
| `components` alone (`Qibla.test.tsx`) | **0** | **0** |

So the components project genuinely never reached those lines, because the screen suite stubbed `tilesForWorld` with
`[]` and the inner loop over a tile's places never ran. **A merged report takes the minimum per counter, so one
project's blind spot cannot be covered by another's hit.** Fixed where the gap actually was: the screen suite now
supplies a real z3 tile carrying a coastline and three places, one farther, one nearer and one unnamed, which also
made the suite better rather than merely greener. Two rows came with it, asserting the user's marker is labelled with
the place the hook ranked (`London`, not `Faraway`) and falls back to `You` when no tile names one.

**The lesson worth keeping: a plausible explanation for a coverage gap is not a diagnosis.** "It is the known merge
quirk" fitted the symptom exactly and would have justified leaving a genuinely untested branch in place. Comparing the
two projects' statement maps and per-line hit counts took one command and gave the real answer.

**And the first fix was not enough, which the same method caught.** Supplying a real tile moved line 62 from 0 hits to
24 and left FOUR other lines at zero (39, 58, 65 and 99: the two `continue` guards for a tile with no `earth` or no
`places` layer, the "keep what you have" side of the ranking, and the `catch`). So `hooks/useQiblaWorld.ts` needs
every branch reached from BOTH projects, which in practice means the screen suite must cover the hook as thoroughly as
the hook's own suite. Three rows closed it, each a real screen behaviour rather than a coverage errand: a grid over
open ocean carrying neither layer, a fetch that throws, and the nearer place listed first. The screen suite alone now
measures the hook at **100% on all four measures**, and it is 14 rows.

**Then a third round of the same hunt, and the file being blamed was the wrong one throughout.** After both projects
individually reported the hook at 100%, the merged run STILL said 99.95%. Reading `coverage-summary.json` rather than
the stale `coverage-final.json` named the real file in one line:

```
components/sheets/screens/Qibla.tsx  s 93.33  b 90  f 71.42  l 96.42
```

Three genuine gaps in the new screen, all worth a test on their own merits: the reaction's `prepare` closure (nothing
asserted that it reads the sensor's YAW, and a reaction watching a value that never changes would never run, so the
arrow would sit still and the phone would never tap), the **Android** branch of the axis correction (only the iOS path
was exercised, so a correction wrongly applied on both platforms would have passed), and `handleDismiss`.

`handleDismiss` was uncovered for a real reason: the suite's own `dismiss()` helper fired only a `change` event, and
`Sheet.tsx` raises `onDismiss` from the LIBRARY's `dismiss` event, which waits for spring completion. So the test that
claimed to prove "the sensor is dropped when the sheet closes" was closing the sheet in a way the app never sees. Fixed
by firing both events, which is what `components/sheets/parts/__tests__/Sheet.test.tsx` already does.

**One test was deleted rather than fixed.** A row asserting the arrow turns to the heading could not pass: writing a
shared value does not re-render under the Reanimated mock, so the rendered transform never changes. Its intent is
covered on device by step 5 and in `WorldMap.test.tsx`, which passes the heading as a prop. Asserting it here would
have meant asserting the mock.

**Final: 191 suites, 5001 tests, 100% statements, branches, functions and lines.** tsc 0, Biome 0.

**Owner ruling during this stretch, and it is correct on this programme's own evidence** (🐋  "Is there any point in
actually doing some tests right now if we, if this is still a prototype? We don't even know if it works properly yet?
So what's the point of wasting time on writing tests?"): the coverage chase was stopped and the session moved to the
device. Sessions 37, 40 and 41 each shipped at 100% and were each rejected on sight, so the axis this row is judged on
is the owner's hand, not the gate. The tests stay because the pre-commit hook enforces 100% and they are already
green; what stopped is polishing them further.

## Step 5: The device proof on the iPhone XS

Version bumped to **1.29.160** FIRST, then prebuild, then build, which is the repo's order (breaking it once shipped
1.22.10 code stamped 1.22.9). `origin/uat-2` had moved to 1.29.159 while this session ran, which is why the bump skips
1.29.159: fetched immediately before setting the three files.

`npx expo prebuild -p ios --no-install` exit 0, and `ios/Athan/Info.plist` reads
`CFBundleShortVersionString 1.29.160`, matching `app.json`.

`xcrun devicectl list devices` shows the XS `00008020-0015585C22D2002E` connected. Build succeeded, 0 errors,
3 warnings, and `devicectl device info apps` confirms `com.mugtaba.athan 1.29.160` on the phone.

### The first device reading: 90 degrees clockwise, and the cause was DERIVED rather than tuned

🐋  "It's pointing me instead of 12 o'clock. It's pointing me to 3 o'clock, 3 p.m. Not good. Both on Google Maps and
Apple Maps... directly facing Saudi Arabia from London, it is 12 o'clock. The app, for some reason, your map shows me
it's 3 o'clock."

**Exactly 90 degrees is a precise signal, so nothing was tuned by eye.** Session 40 tried seven constants against a
dial and never converged; this took two measurements.

**1. The map was eliminated first, and it is correct.** Re-ran the projection and the path off-device: from the owner's
address the drawn curve departs at **119.368 screen degrees against a true qibla of 118.876, an error of 0.493**. The
x and y scales are 9.9940 and 9.8978 px per Mercator degree, so the canvas is very nearly square and no aspect-ratio
error is available to explain 90 degrees. **So the geometry, the bearing and the drawing were all right, and only the
heading feeding the arrow was wrong** — which is the same shape as session 40's finding.

**2. The constant was derived from Apple's own frame, reading `ReanimatedSensor.m`.** Under
`XTrueNorthZVertical` (`startDeviceMotionUpdatesUsingReferenceFrame:(1 << 2)`) reference X is true north and Z is up,
so Y is west. A phone held flat, screen up, with its TOP EDGE on true north has device Y on north and device Z up, so
device X = Y cross Z points EAST, which is a rotation of -90 about up. Hence:

```
heading = -yaw - 90     (i.e. IOS_AXIS_CORRECTION = 270)
```

**3. Cross-checked backwards from the owner's own report, which discriminates all three candidates.** Given he faced
the true qibla, what would each constant have drawn?

| If correct is | Arrow drawn at | Path sits, clockwise from arrow | Reads as |
| --- | --- | --- | --- |
| 90 | 208.9 | 270.0 | 9 o'clock |
| 180 (shipped) | 118.9 | 0.0 | 12 o'clock |
| **270** | **28.9** | **90.0** | **3 o'clock** |

He reported 3 o'clock, so **only 270 produces the observed reading**. The derivation and the observation agree
independently, which is the standard session 40 never reached.

`IOS_AXIS_CORRECTION` was changed to **270**, with the derivation in its comment rather than a tuning history, and a
1.29.161 build was started.

### The owner stopped that build, and he is right: the platform already ships the calibrated heading

🐋  "We don't want to make anything custom 3 o'clock here... We shouldn't have to do anything like that. We should be
using exactly the way Google Maps and Apple Maps does, their calibration, when they point in the map or they have the
user facing a particular direction."

**This is a better objection than the fix it interrupted.** A DERIVED constant is still a constant this app invented,
and it would have to be right about the reference frame, the device axes, the sign convention and the interface
orientation, on two platforms, forever. Apple and Android both publish the answer directly.

**`Location.watchHeadingAsync` reports `trueHeading`, which IS the platform's own fused, declination-corrected
heading** (`expo-location/ios/LocationModule.swift:114` forwards `CLHeading.trueHeading` from Core Location, the same
value Apple Maps points with). With it the app needs **no axis constant, no declination term and no reference frame
choice at all**.

**And session 37 already did it this way.** Recovered from `9401fec9`: `watchHeading` wrapped
`Location.watchHeadingAsync`, read `trueHeading`, matched the `-1` not-ready sentinel exactly and normalised. Session
40 replaced that with the raw fused sensor and **introduced** the axis constant, which is where this whole class of
error entered. Restoring `watchHeading` verbatim is therefore not a new design; it is undoing an invention.

**What is now gone from production entirely**, and it is checkable:
`grep -rn 'useAnimatedSensor\|SensorType\|IOSReferenceFrame\|IOS_AXIS' components/ shared/ device/ hooks/ app/ stores/`
returns nothing outside tests.

**What replaces it.** `HeadingWatch`, a child mounted only while the sheet is open, subscribes to `watchHeading`,
writes each bearing to the shared value the arrow reads, and runs the same `stepAlignment` hysteresis for the haptic.
One detail worth the line it costs: the sheet can close while the subscription is still being awaited, so the effect
carries an `isCancelled` flag and stops an orphaned stream, which would otherwise leave the compass running.

**The honest trade this accepts.** Session 40 measured `expo-location`'s Android heading at **71 degrees wrong with 2
samples in 40 seconds**, against the fused sensor's 9.7 degrees and 148 samples, because
`LocationModule.kt:646` fuses accelerometer and RAW magnetometer with no gyroscope and gates updates at 2 degrees and
50 ms. **On iOS there is no such trade**: `CLHeading.trueHeading` is Core Location's own fused value. So this change is
unambiguously right for the XS in hand, and the Android path may need revisiting when a phone is connected. That is
recorded rather than guessed at, and the owner's rule decides it: use what the platform's own maps use.

Built as **1.29.162**; plist confirmed before the build.

### The second device reading CANCELLED the row, and it is the most valuable measurement in the programme

🐋  "Major breakthrough. Major, major breakthrough. Turns out, I was wrong. Google Maps and Apple Maps are the source
of truth, and they are also very, very jittery. If I walk 1 metre from one bedroom to another bedroom to the living
room to the balcony, everything is very different. So okay, we have been doing testing all wrong."

**This inverts the founding premise of sessions 37, 40, 41 and 43.** Every one of them treated compass disagreement as
OUR defect and went hunting for OUR mistake: session 37 blamed its dial, session 40 blamed `expo-location`'s fusion,
session 41 blamed the sensor so completely that it deleted the compass and rebuilt the feature around a street, and
session 43 blamed an axis constant. **The reference was never validated, and it does not hold still.** So there was no
app-level defect to find, and four sessions were spent chasing a property of magnetism in a building.

**The arithmetic settles which half moved.** Computed from the owner's own address: walking 1 m moves the true qibla by
**0.000008 to 0.000016 degrees**, 10 m by 0.000084 to 0.000159, and 100 m by 0.000841 to 0.001591. So every degree he
saw change was the compass, never the geometry.

**Two of his own questions were answered this session and both vindicate him.**

1. **The "man in space" question.** He asked whether someone in a tall building, or cutting straight through the earth
   rather than following a curve, faces differently. Computed both ways at seven cities, the great-circle initial
   bearing and the literal 3D chord projected onto the local horizontal are **identical to six decimal places**
   (London, New York, Los Angeles, Jakarta, Sydney, Cairo, Toronto). **There is no arc-versus-chord choice about the
   DIRECTION.** The rhumb line is a separate matter and remains a real trap: 14.86 degrees at London, 71.32 at Los
   Angeles.
2. **"Exactly like Google Maps and Apple Maps."** Read from installed source, `expo-location` **buckets** Apple's
   heading accuracy into 0 to 3 at the 50, 35 and 20 degree boundaries (`LocationUtils.swift:9`), discarding the
   degrees. That matters because searching Apple's own documentation shows **Apple Maps draws a CONE whose width IS
   that accuracy**, and `CLHeading.headingAccuracy` is documented as going negative under "strong interference from
   local magnetic fields". **The platform's answer to indoor jitter is to DISPLAY the uncertainty**, which is the one
   thing none of the four attempts did.

**Owner ruling: the row is CANCELLED, the code is removed, and the research is void.**

🐋  "we will completely, completely wipe, clean up anything we've done regarding a compass, regarding maps, regarding
absolutely everything... The first one has to be a cleanup, a complete deep cleanup."

🐋  "You can forget about the previous research that we've done because I think we've come to the conclusion that all
the previous research is incorrect."

**Queued in its place:** row 44, a deletion-only session removing every qibla artefact from `uat-2`, and row 45, a
rebuild from a clean tree as a static flat world map with a dot, an arrow, a line and a one-shot haptic. Both briefs
are written. **The measurements that survive the ruling are collected in `ai/plans/44-qibla-cleanup/FACTS.md`, which is
the only thing row 45 may build on.**

## What this session leaves behind

**Merged and on `uat-2`:** step 1 alone, `edad8439` at 1.29.158 (our own bearing, `adhan`'s `Qibla` import removed).
Row 44 reverts it along with everything from sessions 37, 40 and 41.

**Not committed, and dropped with its branch:** steps 2 to 4. Branches `feat/43-the-screen` and `feat/43-own-bearing`
are deleted. A full patch of the working tree is kept at
`~/athan-device-sweep/session43/step2-4-unfinished.patch` (1,432 lines) with its status file, so row 45 can read what
was tried without any of it being on `uat-2`.

**On the owner's iPhone XS:** 1.29.162, which is the `trueHeading` build. Row 44 or 45 replaces it; nothing about that
build is armed or scheduled, so leaving it there costs nothing.

**The lesson, in one line, and it is why row 44 exists at all: an acceptance criterion that measures our output
against a reference nobody validated is not a test.** The cheapest experiment in the programme was to check whether
the reference holds still, and it was available from day one.
