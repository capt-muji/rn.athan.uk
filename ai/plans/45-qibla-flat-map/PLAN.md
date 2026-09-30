# Plan: Session 45. The qibla on a flat world map, the way a maps app does it

| Field | Value |
| --- | --- |
| Brief | `ai/plans/45-qibla-flat-map/BRIEF.md` |
| Planned at | `9e9138fe` (version 1.29.174), 2026-09-30 |
| Planned by | Planning session on 2026-09-30 |
| Needs first | 44 (DONE) |
| Steps | 4, of which 3 commit; step 1 is a prototype that is never committed |
| Device | Physical iPhone XS, `00008020-0015585C22D2002E`, driven by `agent-device` |
| Owner decisions still needed | None (every one was taken while planning; see section 2) |

## 1. Goal

Today the app has no qibla at all: session 44 deleted every trace of four rejected attempts. When this plan is DONE,
the Settings sheet carries a Qibla row that opens a sheet showing the whole flat world map in the app's own colours,
with a mark on Makkah, a dot where the user stands, an arrow showing which way the phone points, and a curved line
from the dot to Makkah. Turning the phone onto that line taps once. Holding on it is silent. Turning away is silent.
Coming back taps once again. The owner will notice by pressing the hex-nut, pressing Qibla, and turning on the spot
in a windowless room until the phone taps his hand.

The owner's rules that apply, quoted:

- 🐋  "I want a static map. I want to see a static map, the world globe, just a map. The flat world map, from A to Z,
  the whole world map, regardless of where the user is, the whole world map."
- 🐋  "In Mecca, I want a small tiny Kaaba icon, or a mosque icon."
- 🐋  "And then where I am standing, I want a dot to render, and I want an arrow pointing to the direction where I am
  pointing, so that I know where to look. And then I want a line going from me to the Kaaba. That's the line, that's
  the place I should face."
- 🐋  "Every single time I touch the line when I'm perfectly lined up, I feel haptic feedback... it's just a one-time
  haptic feedback... If I stay on it, I shouldn't feel a constant haptic feedback. It's just one. Touch like ZZ. Not
  Z, Z, Z, Z, Z. Because this is going to be useful for blind people."
- 🐋  "Remember, this all has to fit the theme of the app."
- 🐋  "With the least amount of permissions possible."
- 🐋  "Based on maps, not based on globe arcing, globe radius, whatever."
- 🐋  "this app is completely local, offline, no Wi-Fi connection."
- 🐋  "we will completely working the iPhone XS for now the physical device, the Android testing comes later."
- 🐋  "Don't worry about the 60 FPS for now, that's something we can adjust later."
- Comments explain WHY, never what or how, and are extremely compact (owner, 2026-09-26).

## 2. Decisions

### 2.1 Taken

1. **A needle, not a cone** (owner, 2026-09-30, asked with the measured evidence in front of him). The screen draws
   the arrow and the line, and nothing depicting uncertainty. The haptic taps on the arrow with a 4-in, 8-out gap.
   The screen goes quiet, drawing no arrow and firing no tap, only when the phone itself reports its heading invalid
   (`trueHeading === -1`). Rejected: drawing Apple's accuracy cone, because `expo-location` buckets the accuracy to
   20, 35 or 50 degrees and nothing between (`FACTS.md` section 5), so the drawn cone would be a coarse lie about a
   fine quantity; and suppressing the tap on poor accuracy, because a blind user in a steel-framed room would feel
   nothing and have no way to know why.
2. **iOS only** (owner, 2026-09-30). The Qibla row is absent on Android. Android's `expo-location` heading fuses the
   accelerometer with the raw magnetometer, no gyroscope, measured at 71 degrees of error with 2 samples in 40
   seconds (`FACTS.md` section 5). The owner's absolute rule is that the app never shows a direction it knows to be
   wrong. The row returns on Android in the row that fixes Android's heading.
3. **The map is Web Mercator and the line is a CURVE** (planner, from measurement). This is the trap the brief names
   and it is resolved here explicitly. A straight line on a flat map is the rhumb line, 71.32 degrees wrong in Los
   Angeles. Mercator is **conformal**, which is the property that decides the design: an angle at a point is
   preserved exactly, so the great circle drawn as a curve **leaves the user's dot at the true bearing**, and the
   arrow drawn at that same bearing lies along it. Measured over the whole inhabited world, the drawn path's first
   segment reads the true bearing to within 0.36 degrees. Rejected: an azimuthal equidistant map centred on the user,
   because it is a different picture for every user and the owner asked for the same whole world map wherever he
   stands; and a short ray at the true bearing with no line to Makkah, because the owner asked for a line to the
   Kaaba.
4. **The world map is one SVG path shipped as an asset** (planner). Natural Earth 1:110m land, public domain, rings
   under 2 square degrees dropped, simplified to 0.0015 units: 26,515 characters, 69 rings. No tile archive, no
   network, no key, no new dependency; `react-native-svg` is already installed. Rejected: PMTiles and MVT, which
   session 41 built and session 44 deleted, because a whole-world outline at one fixed zoom is a far smaller problem
   than street tiles; and MapLibre, measured in session 41 at +39.9 MB.
5. **The mark on Makkah is drawn, not `masjid.svg`** (planner, and it departs from the brief's suggestion). The owner
   said 🐋  "use the masjid.svg", but that file is a 30-path full-colour illustration in greys, blues and orange,
   designed to be seen at 45 px; at the 10 px this mark occupies on a whole-world map it would read as a coloured
   smudge against the app's navy, and `components/ui/Masjid.tsx` already avoids drawing it at all for performance
   reasons, rendering a PNG instead. The mark is a small filled square with a door, in one theme colour, which reads
   as a Kaaba at 10 px. **This is a visual the owner judges on sight in step 1, and reverting to the SVG is one
   line.**
6. **One permission, the one the app already had** (planner). `watchHeadingAsync` requires foreground location, which
   also supplies the position, so position and heading cost one prompt between them. `expo-location` is reinstalled
   at exactly `58.0.9` and `NSLocationWhenInUseUsageDescription` returns to `app.json`. No motion permission, no
   background permission, no second prompt.
7. **The position is read once per sheet open, at `Accuracy.Lowest`** (planner). Three kilometres of position error
   moves the qibla by under 0.15 degrees (`FACTS.md` section 2), so the coarsest fix the platform offers is ample,
   and it is the fastest and least invasive. The heading is watched continuously while the sheet is open and the
   subscription is removed when it closes.
8. **The tap is `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)`** (planner), which is what every other
   deliberate press in this app already fires.
9. **The prototype is step 1, it ships no tests, and it is never committed** (owner's structure, 🐋  "Step 3 is
   implementing a prototype, first a quick prototype"). Measured while planning: untested code and unreachable
   exports each fail the pre-commit hook, and `--no-verify` is forbidden, so a prototype cannot reach `uat-2` at
   all. It is built in the working tree, put on the phone, judged by the owner, and restored away; what survives is
   his ruling in `LOG.md`. This is the cheapest way to find a fifth rejection before a test suite is built around
   it, and session 43's prototype branch died unmerged for exactly this reason.
10. **Nothing is measured for 60 fps** (owner, 2026-09-30): 🐋  "Don't worry about the 60 FPS for now, that's
    something we can adjust later." `e2e/scripts/frame-audit.sh` is `adb`-only and measures the 3T, so it could not
    run against an iPhone in any case.

### 2.2 The executor must not decide

STOP and ask the owner when any of these happens:

1. Any anchor count other than 1. Ask: "Anchor `<file>` counts `<n>`, not 1. The plan needs refreshing. Shall I mark
   the row NEEDS REPLAN?"
2. A test fails that this plan does not expect. Ask: "`<test name>` failed and the plan does not predict it. The
   failure line is `<line>`. What should I do?"
3. A break prints `BREAK NOT APPLIED`. Ask: "Break `<label>` did not apply, so it tested nothing. The plan's
   substitution does not match the code I wrote. What should I do?"
4. The owner rejects the prototype's look in step 1. Ask: "What should change about the map, the arrow, the line, the
   dot or the Makkah mark?" Then STOP: a visual change the owner asks for is NEEDS REPLAN, never written from the
   executor's own judgement.
5. Anything the plan does not answer that the executor would otherwise decide. Ask: "The plan does not say `<X>`.
   What should it be?"
6. Anything touching visuals beyond what this plan specifies, prayer times, a hand-edited release file, `uat` or EAS.
7. `yarn add expo-location@58.0.9` adds or changes any line in `package.json` other than
   `"expo-location": "58.0.9",`. Ask: "The install also moved `<package>`. The plan expects `expo-location` alone.
   What should I do?" **The nested `@expo/ui` copy is NOT this case**: it is expected, and the step already carries
   its remedy as a mandatory command.
8. `shared/__tests__/widgetRuntimeLoads.test.ts` still fails AFTER
   `rm -rf node_modules/expo-widgets/node_modules && yarn install --frozen-lockfile`. Ask: "The widget runtime suite
   fails after the documented remedy. The nested `@expo/ui` version is `<version>` against the flat `<version>`.
   What should I do?"
9. The XS does not answer. Ask: "The iPhone XS is not reachable. Is it plugged in and unlocked?"

## 3. Pre-flight

Save as `$TMPDIR/preflight-45.sh` and run `bash $TMPDIR/preflight-45.sh <k>`, where `<k>` is the first step in
section 6's checklist not ticked DONE (1 for a new plan).

```bash
#!/usr/bin/env bash
set -u
STEP="${1:?usage: preflight-45.sh <step>}"
ROOT=/Users/muji/repos/rn.athan.uk
PLAN="$ROOT/ai/plans/45-qibla-flat-map"
cd "$ROOT" || { echo "STOP: not $ROOT"; exit 1; }

[ "$(git rev-parse --abbrev-ref HEAD)" = "uat-2" ] || { echo "STOP: not on uat-2"; exit 1; }

dirty=$(git status --porcelain | grep -vE ' (ai/plans/README\.md|ai/plans/45-qibla-flat-map/(PLAN|LOG)\.md)$' | grep -v 'ai/plans/45-qibla-flat-map/')
[ -z "$dirty" ] && echo "tree clean" || { echo "STOP: unexpected changes:"; echo "$dirty"; exit 1; }

git fetch -q origin uat-2
git merge-base --is-ancestor origin/uat-2 uat-2 || { echo "STOP: uat-2 is behind origin"; exit 1; }
echo "uat-2 is at or ahead of origin"

echo "package.json version: $(node -p "require('./package.json').version")"
echo "  (must not be lower than 1.29.174, the Planned at version)"

grep -q '| 44 |.*DONE' ai/plans/README.md && echo "row 44 DONE" || { echo "STOP: row 44 is not DONE"; exit 1; }

count() {
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"
}
check() {
  n=$(count "$PLAN/scripts/anchors/$1.txt" "$ROOT/$2")
  echo "anchor $1 ($2): $n"
  [ "$n" = "1" ] || { echo "NEEDS REPLAN: anchor $1 counts $n"; exit 2; }
}

# Steps 1 and 2 build the same files, so both need every anchor. Steps 3 and 4 change no anchored code.
if [ "$STEP" -le 2 ]; then
  check 1-1 shared/__tests__/qiblaRemoved.test.ts
  check 2-1 app/_layout.tsx
  check 2-2 components/sheets/index.ts
  check 3-1 components/sheets/screens/Settings.tsx
  check 3-2 components/sheets/screens/Settings.tsx
  check 3-3 stores/ui.ts
fi

node -p "require('./package.json').dependencies['react-native-svg']" | grep -q 15 \
  && echo "react-native-svg present" || { echo "STOP: react-native-svg is not installed"; exit 1; }

if [ -f "$PLAN/files/worldPath.ts.txt" ]; then
  echo "world path file present"
else
  echo "STOP: files/worldPath.ts.txt missing"
  exit 1
fi

# Steps 1 and 3 put a build on the phone; steps 2 and 4 do not need it
if [ "$STEP" -eq 1 ] || [ "$STEP" -eq 3 ]; then
  if xcrun devicectl list devices 2>/dev/null | grep -q 00008020-0015585C22D2002E; then
    echo "iPhone XS reachable"
  else
    echo "STOP: the iPhone XS is not reachable, and this step needs it"
    exit 1
  fi
fi

echo PREFLIGHT OK
```

An anchor count other than 1 means NEEDS REPLAN. Any other failure means STOP.

## 4. Background the executor needs

### Code map

| File | What it does | This plan |
| --- | --- | --- |
Steps 1 and 2 build the same files: step 1 in the working tree for the owner to hold, step 2 as the commit.

| File | What it does today | This plan |
| --- | --- | --- |
| `shared/worldPath.ts` | Does not exist | **New**: the coastline, copied byte for byte from `files/worldPath.ts.txt` |
| `shared/qiblaGeometry.ts` | Does not exist | **New**: the bearing, the projection, the drawn path |
| `shared/qiblaAlignment.ts` | Does not exist | **New**: the offset, the hysteresis, the tap |
| `device/qibla.ts` | Does not exist | **New**: the only file that imports `expo-location` |
| `hooks/useQibla.ts` | Does not exist | **New**: permission, position, heading, and firing the tap |
| `components/sheets/screens/Qibla.tsx` | Does not exist | **New**: the screen |
| `shared/__tests__/qiblaRemoved.test.ts` | Session 44's guard: no shipped file may name the qibla | **Deleted in step 2's commit** (anchor 1-1), because it fails the moment a qibla file exists |
| `stores/ui.ts` | Sheet modal references and the actions that present them | The qibla sheet's atom and actions (anchor 3-3) |
| `components/sheets/screens/Settings.tsx` | The settings sheet; its Other card holds What's new and Help | The Qibla row, iOS only (anchors 3-1, 3-2) |
| `components/sheets/screens/index.ts` | The screens barrel | Exports `Qibla`. **Two barrels need it, not one** |
| `components/sheets/index.ts` | The sheets barrel | Re-exports `Qibla` and `BottomSheetQibla` (anchor 2-2) |
| `app/_layout.tsx` | Mounts the three sheets past the first content frame | Mounts the Qibla sheet beside them (anchor 2-1) |
| `app.json` | Expo config | Restores `NSLocationWhenInUseUsageDescription` |
| `package.json` | No `expo-location` | Adds `expo-location@58.0.9`, the one new dependency |
| `metro.config.js` | `assetExts` still lists `pmtiles` and `mvt` | **Step 4** removes them; session 44 missed them because its guard searches only the shipped directories |

### How the pieces interact

The sheet is mounted from launch like every other sheet in this app, and its content renders whenever it is
presented. Nothing reads a sensor until the sheet opens.

| Event | What happens | Why it matters |
| --- | --- | --- |
| App launch | The sheet mounts, renders nothing live, subscribes to nothing | Performance Design Rule 7: a closed surface ticks nothing. Every sheet in this app is mounted from launch, so a naive `watchHeadingAsync` at module or component scope would arm the magnetometer permanently on every device |
| Settings row pressed | Settings dismisses, the Qibla sheet presents | Matches `handleAthanPress` exactly |
| Sheet presented | Permission asked if not already granted, then position read once, then the heading watch starts | Position before heading: `trueHeading` is `-1` without location permission |
| Heading arrives | The offset is recomputed, the arrow turns, a crossing onto the line taps | The only per-frame work is one subtraction and one comparison |
| Sheet dismissed | The heading subscription is removed | Leaving it armed drains the battery and violates Rule 7 |
| Permission denied | No arrow, no line, no tap, and the sheet says the qibla needs location | The owner's rule: never show a direction the app cannot know |
| Sheet reopened after a denial | The permission is asked again only if the platform still allows it; otherwise the same message stands | iOS asks once, so a second prompt never appears |

### Existing tests that cover this code

| Suite | What it proves | This plan |
| --- | --- | --- |
| `shared/__tests__/qiblaRemoved.test.ts` | No shipped file names the qibla | **Deleted in step 2**, in the same commit that adds the first qibla file, because it fails the moment one exists |
| `shared/__tests__/unusedExports.test.ts` | No exported symbol is unreachable from production | Fails on every new export until a production file reaches it. Measured: adding `shared/qiblaGeometry.ts` alone reports 6 unreachable exports |
| `components/sheets/screens/__tests__/Settings.test.tsx` | The settings sheet's rows and toggles | **Step 2** adds the Qibla row's tests here |
| `__tests__/app/_layout.test.tsx` | The root layout mounts the sheets | **Step 2** adds the Qibla sheet to its expectations |
| `shared/__tests__/versionLockstep.test.ts` | `app.json`, `package.json` and gradle agree | Every step bumps all three |
| `shared/__tests__/widgetRuntimeLoads.test.ts` | Both widget bundles load | Run after the `yarn add`, in steps 1 and 2 alike: any install can reintroduce a nested `@expo/ui`, and one DID during planning |

### Why the obvious simple fix is wrong

**Drawing a straight line from the dot to Makkah is the defect that made North American mosques face the wrong way.**
It is also the literal reading of the owner's 🐋  "based on maps, not based on globe arcing". His reasoning is
vindicated by `FACTS.md` section 3 (the great-circle bearing and the straight-line-through-the-earth azimuth are
identical to six decimal places), so there is no arc-versus-chord choice about the DIRECTION. The choice is only
about the DRAWING, and on a flat map a straight line is the rhumb line: London 14.86 degrees wrong, Los Angeles
**71.32**.

**Bunching the path's points near the user makes it worse, not better.** The obvious way to make the first drawn
segment read the true bearing is to place the early points very close to the dot. Measured, that is exactly wrong:
the path is rounded to 2 decimal places of a pixel, and a squared ramp puts the first point 0.017 px from the dot in
London, where the rounding destroys its direction entirely and the drawn angle reads 116.565 instead of 118.876.
Uniform spacing at 64 points puts the first point about 1 px away and reads 119.211, an error of 0.336 degrees.

**The drawn angle is never what the haptic reads.** The tap is `|normalise(bearing - heading)|` against a threshold:
arithmetic on two numbers, no geometry. The drawing only has to look like the direction; the direction itself is
never measured off the drawing.

## 5. Design

### The approach

Three pure modules with no React and no platform in them (`shared/qiblaGeometry.ts`, `shared/qiblaAlignment.ts`,
`shared/worldPath.ts`), one thin platform file (`device/qibla.ts`), one hook that joins them (`hooks/useQibla.ts`),
and one screen that draws the result (`components/sheets/screens/Qibla.tsx`).

**The invariant, as one sentence a test can check:** the drawn path leaves the user's dot in the same screen
direction as the arrow drawn at the qibla bearing, and the phone taps exactly once each time the heading crosses
into 4 degrees of that bearing and not again until it has left 8.

### Alternatives rejected

| Rejected | Why |
| --- | --- |
| Azimuthal equidistant map centred on the user | Its straight line IS correct, which is elegant, but it is a different picture for every user and the owner asked for the same whole world map wherever he stands |
| A straight line on Mercator | The rhumb line: 71.32 degrees wrong in Los Angeles |
| Apple's accuracy cone | Owner's ruling (2.1). `expo-location` buckets the accuracy, so the cone would be coarse |
| MapLibre or any map engine | +39.9 MB measured in session 41, for a picture with no pan, zoom or gestures |
| PMTiles and MVT tiles | A street-level pipeline for a whole-world outline; one static path is 26 KB |
| `masjid.svg` for the Makkah mark | A 30-path full-colour illustration; unreadable at 10 px on navy (decision 2.1.5) |
| Reading the accuracy bucket to gate the tap | Owner's ruling: a blind user would feel nothing with no way to know why |
| Suppressing the haptic on Android instead of hiding the row | The map would still draw a needle tens of degrees wrong |

### Concurrency trace

| Caller | Before | After |
| --- | --- | --- |
| `app/_layout.tsx` | Mounts 3 sheets when chrome is deferred | Mounts 4. The new one subscribes to nothing until presented |
| Settings row press | Dismisses Settings, presents Sound | Same shape for Qibla: dismiss, then present |
| Sheet present | Sound warms its 32-row list | Qibla asks permission, reads one position, starts the heading watch |
| Sheet dismiss | Sound commits its selection | Qibla removes the heading subscription |
| Rapid open, close, open | | The second open starts a new subscription only after the first was removed, because removal is in the same effect's cleanup |
| Permission prompt while the sheet closes | | The position resolves into an unmounted component, so the hook must not write state after cleanup |
| The phone reports `trueHeading: -1` | | No arrow, no tap. Android reports a negative `trueHeading` wherever declination is negative, so the sentinel is matched exactly rather than tested as "negative" (`FACTS.md` section 5) |

### Design review

Reviewed by this planning session on 2026-09-30, reading the design back cold and attacking it. Five findings, each
fixed before the steps were written:

1. **The first draft bunched the path's points near the user** and would have shipped a drawn line up to 10.6
   degrees off its own arrow, because 2-decimal rounding destroys a sub-pixel segment's direction. Found by rendering
   the picture and measuring the drawn output rather than the formula. Fixed: uniform spacing, and the acceptance
   criterion measures the DRAWN string.
2. **The antimeridian was a whole-map streak.** A route from Honolulu leaves the left edge and re-enters at the
   right, and joining those points draws a line straight back across the map. Fixed: the path splits wherever
   consecutive points jump more than half the map width. Measured: Honolulu, Anchorage, Nome, Apia and Fairbanks all
   give exactly 2 sub-paths; London gives 1.
3. **An unbounded crossing test taps at the antipode.** A signed offset changes sign both at the qibla AND at the
   bearing directly away from it. Fixed by construction rather than by a bound: `alignmentOffset` normalises to
   -180..180, so the magnitude at the antipode is 180 and no threshold near 4 can ever match. A test sweeps 170 to
   190 degrees and asserts zero taps.
4. **A test asserting the first segment's angle would pass against a LINEAR path.** Both a great circle and a
   straight line leave the dot at... different angles, but only by 0.336 against 14.86 in London, so a loose
   tolerance would not discriminate. Fixed: the Los Angeles case, where the true bearing is 23.9 and the rhumb line
   is 95.2, so the test asserts the drawn angle is under 45 degrees and a straight-line implementation fails it by 50
   degrees. Verified: the break "the rhumb line: a straight line instead of the great circle" is caught.
5. **Session 44's guard blocks step 1 and must die in the same commit.** `shared/__tests__/qiblaRemoved.test.ts`
   fails the moment any file named `qibla*` exists. Measured: adding the two modules fails it with 12 hits. So the
   guard's deletion cannot be a separate step, because either ordering leaves `uat-2` red.

## 6. Steps

- [ ] Step 1: A rough prototype the owner can hold, no tests, never committed (specified)
- [ ] Step 2: Build it properly, at 100% (specified, with four test suites carried as files)
- [ ] Step 3: Device proof on the iPhone XS (specified)
- [ ] Step 4: Audit the tree: no dead code, compact why-only comments (specified)

Each step is written in full in its own file:

- `steps/1-the-prototype.md`
- `steps/2-build-it-properly.md`
- `steps/3-device-proof.md`
- `steps/4-audit-the-tree.md`

**Why the whole feature is ONE commit, in step 2, and why step 1 commits nothing.** Two gates in this repository
decide it, and both were measured while planning rather than assumed:

- `shared/__tests__/unusedExports.test.ts` reports every new export as unreachable until a production file imports
  it. Adding the geometry alone reports 6.
- `shared/__tests__/qiblaRemoved.test.ts`, session 44's guard, fails the moment any file named `qibla*` exists.
  Adding two modules fails it with 12 hits.

So no smaller cut of the feature leaves `uat-2` green, which is exactly what session 44 found for its own deletion,
and the pre-commit hook runs both. A prototype is untested code with unreachable exports, so it fails the hook twice
over and `--no-verify` is forbidden: step 1 therefore builds in the working tree, goes on the phone, earns the
owner's ruling, and is then restored away. Session 43's prototype branch died unmerged for the same reason.

## 7. Device proof

Step 3 is the device proof and is written in full in `steps/3-device-proof.md`. Step 1 also puts a build on the
phone, for the owner's look-and-feel ruling before any test exists. In summary:

- The device is the physical iPhone XS, `00008020-0015585C22D2002E`, driven by `agent-device`.
- The build is a local Release build through the prebuild ritual in `ai/AGENTS.md` section 6, because
  `expo-location` returns to the native tree and a JS reload cannot carry a native module.
- **No clock is changed and no alarm is touched**, so the `dumpsys alarm` safety reading does not apply: it is an
  `adb` command and the device is an iPhone. Nothing in this session arms, cancels or reads a notification.
- The owner's own hands are needed for two things, and they are the two that matter: saying whether the picture is
  right (step 1) and whether the tap lands when he faces Makkah (step 3).
- The phone is left on the step 3 build, unlocked, with the app closed.

## 8. Records

### Findings text

Add to `ai/features/uat-2/AUDIT-FINDINGS.md` under the exact heading `## Session 45: the qibla on a flat world map`:

```markdown
## Session 45: the qibla on a flat world map

The qibla returns, rebuilt from nothing after session 44 deleted four rejected attempts. A static Web Mercator world
map in the app's own colours, a mark on Makkah, a dot for the user, an arrow for the phone's heading, and a curved
great-circle line between them. One haptic tap each time the arrow crosses onto the line.

**THE PROPERTY THE WHOLE DESIGN RESTS ON IS THAT MERCATOR IS CONFORMAL.** A straight line on a flat map is the rhumb
line, wrong by 14.86 degrees in London and 71.32 in Los Angeles, and a shipped app has been caught at exactly this.
Drawing the great circle as a CURVE fixes it for a reason worth stating precisely: a conformal projection preserves
angles at a point, so the curve leaves the user's dot at the true bearing exactly and the arrow drawn at that bearing
lies along it. Measured over the whole inhabited world at 64 uniformly spaced points, the drawn path's first segment
reads the true bearing to within <WORST_SEGMENT> degrees.

**THE TRAP INSIDE THAT FIX, and it produced a wrong-but-plausible picture before it was caught: bunching the path's
points near the user makes the drawing WORSE.** The obvious way to make the first segment read true is to place the
early points very close to the dot, and a squared ramp improves the formula's error to 0.007 degrees. It ships a
visibly wrong line, because the path is rounded to 2 decimal places of a pixel and the first segment is then 0.017 px
long in London: the rounding destroys its direction and the DRAWN angle reads 116.565 against a true 118.876. Uniform
spacing puts the first point about 1 px out and draws 119.211. **The acceptance criterion measures the drawn string,
not the formula**, which is the only reason this was found.

**A route that leaves the map edge must be drawn in two pieces.** From Honolulu the great circle exits the left edge
and re-enters at the right; joining those points draws a line straight back across the whole map. The path splits
wherever consecutive points jump more than half the map width: Honolulu, Anchorage, Nome, Apia and Fairbanks each
give exactly 2 sub-paths, London 1.

**The haptic never reads the drawing.** The tap is the absolute normalised difference of two numbers against a
threshold, so the picture can be redrawn freely without touching the behaviour a blind user feels.

**Two owner rulings, both taken against measured evidence.** (1) **A needle, not Apple's cone**: `expo-location`
buckets the heading accuracy to 20, 35 or 50 degrees and nothing between, so a drawn cone would be a coarse lie about
a fine quantity, and suppressing the tap on poor accuracy would leave a blind user in a steel-framed room feeling
nothing with no way to know why. The screen goes quiet only when the phone itself reports `trueHeading === -1`.
(2) **iOS only**: Android's heading has no gyroscope in it and measured 71 degrees wrong with 2 samples in 40
seconds, so the row is absent there rather than showing a direction known to be wrong.

**No new dependency and no network.** The world is one SVG path of <WORLD_CHARS> characters (Natural Earth 1:110m
land, public domain, rings under 2 square degrees dropped, simplified to 0.0015 units), drawn with the
`react-native-svg` already installed. `expo-location` returns at exactly 58.0.9 and is the only package added; one
foreground permission carries both the position and the heading, so the app asks for exactly what it asked before.

**The position is read at `Accuracy.Lowest`**, because 3 km of position error moves the qibla by under 0.15 degrees.
Fine GPS would be 300 times the precision the problem needs.

**Session 44's guard had to die in the same commit that added the first file**, since it fails the moment anything
named `qibla*` exists, and either ordering leaves `uat-2` red. Measured with the whole feature built in a scratch
worktree: the guard was the ONLY failing suite, at 178 of 179 passing, and it named 13 hits. Its job is done: it
protected an empty tree, and the tree is no longer empty. **Session 44 also missed two entries**: `metro.config.js`
still listed `pmtiles` and `mvt` in `assetExts`, because the guard searches only shipped directories. Removed here.

**Four idioms in this repository were each found by a failing draft rather than by reading**, and each is written
into the step that needs it. A sheet draws nothing until the library reports a present, so a suite must fire
`change, 0` before asserting; a dismiss is fired as `'dismiss'`, not as `change, -1`; `renderHook` is unusable here,
returning an object with no keys at all under RNTL 14 and throwing under the unit project's hand-written React
Native mock, so the hook is tested through its screen; and there are TWO sheet barrels, not one.

Proven on the physical iPhone XS: <DEVICE_RESULT>.

Suite after: <TESTS_AFTER>, 100% on all four measures. Breaks: <BREAKS_CAUGHT>.
```

### Table rows

The executor sets the `ai/plans/README.md` row 45 status to EXECUTED.

The auditor applies this text to the `ai/prompts/README.md` closed-prompts list on PASS:

```markdown
- 45. `ai/plans/45-qibla-flat-map/PLAN.md` — DONE 2026-09-30 — the qibla returns as a static flat world map with a
  curved great-circle line, a heading arrow and one haptic tap per crossing. The design rests on Mercator being
  CONFORMAL: the curve leaves the user's dot at the true bearing exactly, so the arrow lies along it, where a
  straight line would be 71.32 degrees wrong in Los Angeles. The trap inside that fix is that bunching the path's
  points near the user makes the DRAWN line worse, because 2-decimal pixel rounding destroys a sub-pixel segment's
  direction; uniform spacing is right and the acceptance criterion measures the drawn string rather than the
  formula. Two owner rulings: a needle rather than Apple's cone, because expo-location buckets the accuracy; and iOS
  only, because Android's heading has no gyroscope and measured 71 degrees wrong. One SVG path of 26,515 characters
  replaces the whole tile pipeline, and one permission carries both position and heading.
```

### Docs commit

`<VERSION> - docs(plans): session 45 executed: the qibla on a flat world map`

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes `uat-2` after
a PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

### Symptom table

| Symptom | Cause | Action |
| --- | --- | --- |
| `qiblaRemoved.test.ts` fails | It was not deleted in the same commit that added the new files | Delete it as step 2's file list says. It is expected to die there |
| `unusedExports.test.ts` reports new unreachable exports | A production file does not yet import them | Expected until the step that imports them. Each step's "Green" part names which exports must be reachable by its end |
| `versionLockstep.test.ts` fails | The three version numbers differ | Set all three to the step's version |
| `yarn add` moves a package other than `expo-location` | The install re-resolved the tree | Section 2.2, item 7: STOP and ask |
| `widgetRuntimeLoads.test.ts` fails after the install | A nested `@expo/ui` copy returned (`ai/AGENTS.md`) | Section 2.2, item 7: STOP and ask |
| The drawn first segment's angle is more than 1 degree from the bearing | The path's points are bunched rather than uniform | The rounding trap in section 4. Uniform spacing is the plan's contract; STOP if uniform spacing still fails |
| The line streaks across the whole map | The edge split is missing or its threshold is wrong | The split threshold is half the map width. STOP if it is already that |
| The haptic buzzes continuously | One threshold instead of two | `ALIGNMENT_ENTER_DEGREES` 4 and `ALIGNMENT_EXIT_DEGREES` 8 are the plan's contract |
| The build fails on `expo-location` missing from the native tree | `npx expo prebuild` was not re-run after the install | The build ritual in steps 1 and 3 re-runs prebuild. It is required, not optional |
| Anything else | | `EXECUTOR-BRIEF.md` section 7's table |

### Anticipated review fixes

These are the only fixes the executor may make to anything this plan fixed, and each is given word for word:

1. **If a comment in the executor's own code explains WHAT or HOW rather than WHY**, delete the comment. If the code
   then needs explaining, rename the symbol or split the function, and leave no comment.
2. **If `npx biome check . --error-on-warnings` reports a line over 120 characters in a file the executor wrote**,
   run `npx biome check --write <file>` and rerun the step's break script, because the formatter can move text a
   break substitutes.
3. **If the review finds an unused import in a file the executor wrote**, remove the import.

A reviewer finding this section does not answer is handled by `EXECUTOR-BRIEF.md` section 4, item 8.

### Stopping part-way

Steps 1 and 2 touch the same files, so they share one restore list.

| Step | `git checkout --` | Delete |
| --- | --- | --- |
| 1 and 2 | `shared/__tests__/qiblaRemoved.test.ts`, `components/sheets/screens/Settings.tsx`, `components/sheets/screens/__tests__/Settings.test.tsx`, `components/sheets/index.ts`, `components/sheets/screens/index.ts`, `app/_layout.tsx`, `__tests__/app/_layout.test.tsx`, `stores/ui.ts`, `app.json`, `package.json`, `yarn.lock` | `shared/qiblaGeometry.ts`, `shared/qiblaAlignment.ts`, `shared/worldPath.ts`, `device/qibla.ts`, `hooks/useQibla.ts`, `components/sheets/screens/Qibla.tsx`, `shared/__tests__/qiblaGeometry.test.ts`, `shared/__tests__/qiblaAlignment.test.ts`, `device/__tests__/qibla.test.ts`, `components/sheets/screens/__tests__/Qibla.test.tsx` |
| 3 | `app.json`, `package.json` | Nothing |
| 4 | `metro.config.js`, `app.json`, `package.json` | Nothing |

`node_modules` keeps `expo-location` after a restore, because `git checkout -- package.json yarn.lock` does not
uninstall it and the next attempt adds it by the same command. Nothing else in the tree references it.

## 11. Subagents in this plan

None. The session does its own planning, execution, review and audit (owner, 2026-09-26). Steps 1 and 3 each produce
a screenshot; the executor reads it itself when its model can see images, and calls `vision` with the path and the
step's exact question when it cannot. **The owner holds the device and reports what he sees, and that is the verdict
that counts** (owner, 2026-09-30): 🐋  "I will physically pick up the device and test it, walk around the house...
And I'll tell you if anything is visually incorrect." A screenshot read is the executor's own sanity check, never a
substitute for his ruling.

## 12. Report to the owner

The final message starts with `Execution session` and a `Time:` line from `date '+%H:%M:%S %d.%m.%Y'`, then:

- a few plain sentences on what changed and what was proven, including whether the owner accepted the prototype's
  look and whether the tap landed when he faced Makkah;
- the progress table (format in `EXECUTOR-BRIEF.md` section 6);
- any decision now waiting on the owner;
- the four-line handoff from the `athan-next` skill, section 8.
