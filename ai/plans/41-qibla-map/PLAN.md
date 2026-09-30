# Plan: Session 41. The qibla against a street the user can see

| Field | Value |
| --- | --- |
| Brief | `ai/plans/41-qibla-map/BRIEF.md`, plus the owner's rulings of 2026-09-30 in section 2 |
| Planned at | `cb124166` (version 1.29.140), 2026-09-30 |
| Planned by | Planning session on 2026-09-30 |
| Needs first | 40 (DONE) |
| Steps | 6, each one branch, one commit, one version |
| Device | iPhone XS for the final proof; no Android phone is connected |
| Owner decisions still needed | None. All seven `PROPOSALS.md` decisions were taken on 2026-09-30, section 2.1 |

## 1. Goal

The qibla screen ships a magnetometer dial that measured **30 degrees wrong in the owner's own bedroom** and
prints a confident three-figure bearing while doing it. Sessions 37 and 40 each shipped correct, audited,
100%-covered code and the feature still failed, because the failure was never in the arithmetic: the bearing
has been exact the whole time and only the *heading* was wrong. This plan stops asking the phone which way it
is pointing. Instead it names **a street the user can see** and states the qibla against it, because a
street's bearing is a fact of the ground held in the map data and no steel in the room can bend it. When this
plan is DONE the Qibla sheet opens on a drawn map of the streets around the user with the qibla ray on it and
a sentence naming the street, the compass dial is gone, and no reading on that screen comes from a
magnetometer.

The owner's rules that apply, quoted:

- 🐋  "The map and the landmark approach are very, very interesting. I would prioritise those 2"
- 🐋  "We do not want the user to have to do anything. If the user has to do more than open the compass and
  look our open direction and look. The user will not do it. Do not do not do not make the user do anything."
- 🐋  "30 degrees is a big difference. We don't want that at all. We're not, 30 degree difference is horrible.
  We would rather ditch the compass feature entirely if that's the case."
- 🐋  "let's not bundle London, because we are going global. This will have nothing to do with London as a
  base in the future."
- 🐋  "we should only have 2 cities saved at a time maximum... maybe 25 megabytes worth of date. If it goes
  above 25 megabytes, then we should start clearing, you know, the old values"
- 🐋  "this app is completely local, offline, no Wi-Fi connection" (2026-09-29, and D2 below is how this plan
  satisfies it)
- 🐋  "the comments should be extremely compact, and they should only explain the why"

## 2. Decisions

### 2.1 Taken

1. **The feature is the map plus the street sentence, and they are ONE thing.** Owner, 2026-09-30, D1:
   🐋  "I would ask you to do the map approach first." Recorded in `PROPOSALS.md` D1 and `STREET-SENTENCE.md`
   section 9. The planning session found they cannot be separated: the sentence "turn 53 degrees left of
   Whitehall" is 180-degree ambiguous on its own, because a street is a line with two directions, and only
   the drawn picture resolves it. See section 5.
2. **The compass dial is DELETED.** Owner, 2026-09-30, D3 and D6: 🐋  "We would rather ditch the compass
   feature entirely if that's the case." The 30-degree indoor error is the case. `components/qibla/Dial.tsx`,
   `components/qibla/dialGeometry.ts` and the heading path in `Qibla.tsx` go with it. This supersedes
   `PROPOSALS.md` D3's recommendation to keep it as rung 4, on the owner's explicit ruling.
3. **The sun rung is NOT built as an interaction.** Owner, 2026-09-30, D4: 🐋  "if you ask them to draw a line
   or put it in the shadow or, you know, something stupid like that. No, no, no." The shadow method needs the
   user to lay the phone flat and rotate a line, so it is cut. The solar maths is not built at all this
   session, which also removes the `adhan` deep-import config work.
4. **Tiles are fetched on demand, per location, and cached.** Owner, 2026-09-30, D2, overriding
   `PROPOSALS.md`'s recommendation to bundle London: 🐋  "let's not bundle London, because we are going
   global." A location's tiles are fetched once, on first use in that place, and kept.
5. **The tile cache is capped at 25 MB and evicts least-recently-used.** Owner, 2026-09-30, D2: 🐋  "maybe 25
   megabytes worth of date. If it goes above 25 megabytes, then we should start clearing... the old values".
   The owner also said 🐋  "only have 2 cities saved at a time maximum" and then reasoned to the megabyte cap
   in the same breath; the megabyte cap is taken as the rule because it is the one that bounds what the owner
   was actually worried about, the user's storage, and 25 MB is about 15 locations rather than 2. Recorded as
   assumption AS3 in section 2.3.
6. **`fflate@0.8.3` is approved.** Owner, 2026-09-30, D5. Verified against the registry on the day: `latest`
   is 0.8.3, and `npm view fflate dependencies` returns empty, so it has zero transitive dependencies.
7. **No mosque rung.** Owner, 2026-09-30, D7: 🐋  "there's 1000000s of mosques around the world. 300,000 is so
   small." The planning session's own measurement independently kills it: a mosque 300 m away inherits 3.8
   degrees of error from a 20 m position fix before any question of how the building faces
   (`STREET-SENTENCE.md` section 3).
8. **The screen prints no bearing in degrees from north.** Planner, from the owner's D6 reasoning. The number
   is what made the shipped dial look right while being 30 degrees wrong. The turn from a named street is a
   different kind of number: it is checkable against something the user can see, so it is printed.
9. **A location with no usable street falls through to an honest empty state.** Planner. Measured: 4 of 24
   sampled places have no named street within 122 m, all rural (`STREET-SENTENCE.md`, and the coverage sweep
   in section 5.4). The screen says the map has nothing here rather than drawing an empty square.

### 2.2 The executor must not decide

Stop and ask the owner when any of these happens:

1. Any anchor count other than 1. Ask: "Anchor `<file>` counts `<n>`, not 1. The plan needs refreshing
   against today's `uat-2`. Shall I mark the row NEEDS REPLAN?"
2. A test fails that this plan does not expect. Ask: "`<test>` failed with `<line>`, which the plan does not
   predict. What should it be?"
3. A break prints `BREAK NOT APPLIED`. Ask: "Break `<label>` changed nothing, so the substitution does not
   match the code. Shall I mark the row NEEDS REPLAN?"
4. A reviewer finding that section 10 does not answer and that does not meet all three conditions in
   `EXECUTOR-BRIEF.md` section 4, item 8.
5. **The Protomaps archive URL returns anything but 206 on a range request** in step 3's proof. Ask: "The
   tile archive answered `<status>` rather than 206. The plan assumes HTTP range requests against
   `https://build.protomaps.com/<build>.pmtiles`. Has the source moved?"
6. **The daily build named in step 3 is gone.** The bucket retains recent builds only. Ask: "Build
   `<name>.pmtiles` is not there. Which build should the app read?"
7. Anything the step does not answer that the executor would otherwise decide: "The plan does not say `<X>`.
   What should it be?"
8. Anything touching visuals beyond what step 5 and step 6 specify, prayer times, a hand-edited release file,
   `uat` or EAS.

### 2.3 Assumptions taken unattended

These are the planner's, taken because the owner is asleep and asked for assumptions rather than questions.

| # | Assumption | Why | Risk if wrong |
| --- | --- | --- | --- |
| AS1 | The map is **north-up and never rotates**. | Rotating it needs the magnetometer, which is the thing being removed. The market agrees: Al-Azan ships north-up by default with rotation off (`R5` section 5.1). | Low. Rotating it later is additive. |
| AS2 | The drawn radius is **122 m**, the measured cap. | 49 paths and 92 ms on the floor device, still holding 16 roads (`P3` section 7). | Low, measured. |
| AS3 | The cache cap is **25 MB with LRU eviction**, not a 2-city count. | Section 2.1, item 5. | Low. Both bound storage; the megabyte cap is the one the owner reasoned to. |
| AS4 | Tiles are fetched at **z15, a 3x3 grid**, about 0.7 to 1.7 MB per location. | `P3` section 1, measured across eight places. | Low, measured. |
| AS5 | A location is **"new" when the user is more than 500 m from every cached tile centre**. | A z15 tile is 761 m across, so 500 m keeps the user inside their cached 3x3 for ordinary movement without refetching on every open. | Medium. Tunable; a wrong value costs bandwidth, never correctness. |
| AS6 | The straightness floor is **0.95** and the length floor **40 m**. | Chosen because they excluded the cases that read wrong by eye across four cities. This is fixture-blind tuning of the kind this project has been burned by, and it is flagged. | Medium. A bad value names an awkward street; it never bends the direction. |
| AS7 | Buildings are drawn but dropped first if a device cannot afford them. | Two thirds of the record cost at every radius (`P3` section 7). | Low. |
| AS8 | The sheet keeps its existing location permission flow unchanged. | It works and is tested (`device/qibla.ts`). | Low. |

## 3. Pre-flight

Save as `$TMPDIR/preflight-41.sh` and run `bash $TMPDIR/preflight-41.sh <k>`.

```bash
#!/bin/bash
# Pre-flight for session 41. Usage: bash preflight-41.sh <first step not DONE>
set -u
STEP="${1:?give the first step not ticked DONE}"
REPO=/Users/muji/repos/rn.athan.uk
cd "$REPO" || { echo "STOP: not at $REPO"; exit 1; }

BRANCH=$(git branch --show-current)
[ "$BRANCH" = "uat-2" ] || { echo "STOP: on $BRANCH, not uat-2"; exit 1; }

DIRTY=$(git status --porcelain | grep -v -E 'ai/plans/README.md|ai/plans/41-qibla-map/(PLAN|LOG).md|opencode.json' || true)
[ -z "$DIRTY" ] || { echo "STOP: unexpected changes:"; echo "$DIRTY"; exit 1; }

git fetch -q origin uat-2
git merge-base --is-ancestor origin/uat-2 uat-2 || { echo "STOP: uat-2 is behind origin/uat-2"; exit 1; }

VERSION=$(node -e "console.log(require('./package.json').version)")
echo "version: $VERSION"

grep -q '^| 40 .*DONE' ai/plans/README.md || { echo "STOP: row 40 is not DONE"; exit 1; }

# Anchors for steps not yet built. Each must print exactly 1.
count() {
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"
}
check() {
  local n
  n=$(count "$1" "$2")
  echo "anchor $(basename "$1"): $n"
  [ "$n" = "1" ] || { echo "STOP: anchor $1 counts $n, not 1 (NEEDS REPLAN)"; exit 1; }
}

A=ai/plans/41-qibla-map/scripts/anchors
if [ "$STEP" -le 2 ]; then check $A/2-1.txt metro.config.js; fi
if [ "$STEP" -le 4 ]; then check $A/4-1.txt components/sheets/screens/Qibla.tsx; fi
if [ "$STEP" -le 5 ]; then check $A/5-1.txt components/sheets/screens/Qibla.tsx; fi

# The tile archive must be reachable and answer range requests, or step 3 cannot be proven
if [ "$STEP" -le 3 ]; then
  CODE=$(curl -s -o /dev/null -w '%{http_code}' -r 0-126 https://build.protomaps.com/20260929.pmtiles || echo 000)
  echo "archive range request: $CODE"
  [ "$CODE" = "206" ] || { echo "STOP: archive answered $CODE, not 206 (section 2.2 item 5)"; exit 1; }
fi

node -e "require('./node_modules/react-native-svg/package.json')" || { echo "STOP: react-native-svg missing"; exit 1; }
node -e "require('./node_modules/expo-file-system/package.json')" || { echo "STOP: expo-file-system missing"; exit 1; }

echo PREFLIGHT OK
```

Expected tail: `PREFLIGHT OK`. An anchor count other than 1 means NEEDS REPLAN. Any other failure means STOP.

## 4. Background the executor needs

### 4.1 Code map

| File | What it does | This plan |
| --- | --- | --- |
| `components/sheets/screens/Qibla.tsx` | The Qibla sheet: reads position, arms the rotation sensor, renders the dial and the reading line | Rewritten in step 5; the sensor and dial go |
| `components/qibla/Dial.tsx` | The 84-element compass face, memoised, rotated by a Reanimated transform | **Deleted** in step 5 |
| `components/qibla/dialGeometry.ts` | Tick and label positions for the dial | **Deleted** in step 5 |
| `shared/qibla.ts` | `qiblaBearing` (kept), `normaliseHeading` (kept), and the heading helpers `headingFromYaw`, `dialAngleFromYaw`, `unwrapAngle`, `shortestDelta`, `isFieldTrustworthy` | The heading helpers are deleted in step 5; `shortestDelta` stays, `device/qibla.ts` uses it |
| `device/qibla.ts` | Permission, `readPosition`, `readDeclination` | `readDeclination` is deleted in step 5 (only the dial used it); the rest is unchanged |
| `metro.config.js` | Metro config; already edits `assetExts` to hand `svg` to the transformer | Step 2 adds the tile extension |

### 4.2 How the pieces interact

The sheet is **mounted from launch** like every sheet in this app, and only `onPresent` runs when the user
opens it. That is why the current code arms its sensor inside a child rendered on `isOpen`: `useAnimatedSensor`
subscribes for its component's life, and a mount-time subscription would arm the magnetometer on every device
forever (Performance Design Rule 7). The new screen has no sensor, so that whole hazard disappears, but the
same rule binds the tile work: **nothing may fetch, read or decode a tile at mount.** All of it hangs off
`onPresent`.

| Event | Today | After this plan |
| --- | --- | --- |
| App launch | Sheet mounts, nothing runs | Same |
| Sheet opens | `readPosition`, then `readDeclination` on Android, sensor arms | `readPosition`, then tiles from cache or network, then decode and draw |
| Sheet closes | Sensor unmounts | Nothing to unwind; the decoded tile is dropped with the state |
| Re-open at the same place | Position re-read, sensor re-arms | Position re-read, tiles served from cache |
| Re-open 600 m away | Same | Cache still covers it (AS5), no fetch |
| Offline, place never visited | Dial still draws | Honest "no map here" state |

### 4.3 Existing tests

| Suite | What it proves | This plan |
| --- | --- | --- |
| `shared/__tests__/qibla.test.ts` | The bearing, the angle helpers, the field check | Trimmed in step 5 to the helpers that survive |
| `components/sheets/screens/__tests__/Qibla.test.tsx` | The sheet's states: looking, unavailable, found | Rewritten in step 5 |
| `components/qibla/__tests__/*` | The dial's geometry and the label rotation regression | **Deleted** with the dial in step 5 |
| `shared/__tests__/unusedExports.test.ts` | Every export is reachable from production code | **The sequencing constraint.** It fails on a module with no caller, so a module and its first caller must land in the SAME commit. Proven by the planning session: adding the three modules alone failed this suite with `decodeVectorTile`, `nearbyStreets`, `qiblaFromStreet`, `tileForPosition`, `distanceInMetres` all reported unreachable. |

### 4.4 Why the obvious approach is wrong

**Do not reach for a map library.** MapLibre was priced at **+39.9 MB** of native binary across four ABIs, and
it carries a podspec `post_install` that links SPM into the widget extension and crashes it (`R2`). A qibla map
is a static picture: no panning, no zooming, no gestures, no label collision. `react-native-svg` is already
installed at 15.15.5 and draws it.

**Do not draw a straight line to Makkah on the map.** A straight line on a Mercator projection IS the rhumb
line, which is wrong by 14.84 degrees in London and 71.31 in Los Angeles, and a shipped app has been caught at
exactly this. Draw a short ray at the great-circle initial bearing instead, where drift over 1 km is 0.010
degrees.

## 5. Design

**The invariant, as one sentence a test can check:** the direction the screen tells the user to face is
computed only from their position and the map data, so no value read from a magnetometer, accelerometer or
gyroscope can change it.

### 5.1 The chosen approach

The screen answers in two halves that need each other:

1. **A drawn map**, north-up, 122 m around the user, with the qibla ray from the centre.
2. **A sentence** naming the nearest usable street and the turn from it: "Stand along Whitehall, then turn 53
   degrees to the left."

Neither ships alone. The sentence is 180-degree ambiguous by itself, because a street is a line with two
directions and resolving it would need the compass this row exists to remove. The map resolves it, because the
picture has one orientation. The sentence is what makes the map checkable, since a user who cannot tell which
drawn line is their street still has a name to look for.

### 5.2 Why the street bearing, and not a landmark

Measured by the planning session (`STREET-SENTENCE.md`), and it is the finding the design rests on.

Both terms of the answer are **intrinsic**: the qibla moves 0.5 degrees per 10 km of position error, and a
street's compass bearing does not move at all. So when position error makes the app name a *different* street,
it recomputes the turn for that street, and the two errors cancel. Executing the instruction from the true
position, for whatever street an error-shifted fix named, 300 samples per cell:

| Place | Position error | Named the same street | Mean delivered error |
| --- | --- | --- | --- |
| New York | 100 m | **21%** | **0.000 deg** |
| London | 100 m | 49% | 0.001 deg |
| Jakarta | 100 m | 89% | 0.000 deg |
| Makkah | 100 m | 51% | **2.985 deg** |

**Position accuracy buys recognisability, not correctness.** Makkah is the one exception, and the cause is the
settled near-Makkah geometry rather than the street rule.

Pointing at a landmark instead was measured and **rejected**: bearing error to a target is
`atan(positionError / distance)`, so the most recognisable target in the New York sample, a café 28 m away, is
**36 degrees wrong on an ordinary 20 m fix**. A target far enough to be safe is one the user cannot see.

### 5.3 Alternatives rejected

| Rejected | Why |
| --- | --- |
| Keep the compass as a last resort | Owner, D3/D6. 30 degrees indoors is not a fallback, it is a wrong answer. |
| The sun and shadow interaction | Owner, D4. It asks the user to do something. |
| Point at a named landmark | Section 5.2. Position error makes near targets unusable and far targets invisible. |
| The nearest mosque | Owner D7, and 3.8 degrees inherited at 300 m before any orientation question. |
| Bundle London's tiles | Owner D2. |
| A map library | +39.9 MB, and a widget-extension crash. |
| Rotating the map to the heading | It reintroduces the magnetometer. |
| Printing the bearing from north | It is what made the dial look right while being wrong. |

### 5.4 Coverage, measured rather than assumed

24 places swept live, deliberately weighted to the hostile cases: **20 have a usable named street within
122 m.** The 4 that do not are all rural (Norfolk village, Welsh village, rural Punjab, Lagos Ikeja's
particular tile). That is the empty state in section 2.1 item 9, not a defect.

### 5.5 The design review

Reviewed by the planning session on 2026-09-30, reading the design back cold and attacking it:

| Attack | Finding | What changed |
| --- | --- | --- |
| "Turn 53 left of Whitehall" tells the user nothing without a facing | **Correct, and it was nearly shipped.** A street is a line. | The map became mandatory rather than a nicer presentation, section 5.1 |
| The probe named "IRT Lexington Avenue Line", a subway | **Correct.** Invisible from the pavement. | The kind filter, built from the tag data, section 8 of `STREET-SENTENCE.md` |
| The tunnel filter let "Queensway Tunnel" through | **Correct.** `is_tunnel` is per segment, so the approach ramps carry the name with the tag absent. | The name guard beside the tag guard |
| "New York 21% same street" says the feature fails | **Wrong, and this was my own first reading.** | Section 5.2's self-consistency measurement |
| 0.000 degrees is a tautology | **Not a tautology**: the turn comes from the believed position and is executed against the true street bearing. Makkah returning 2.985 on the same code path proves the measurement can be non-zero. | Recorded |
| Four tiles is a thin sample | **Correct.** | The 24-place sweep, section 5.4 |

## 6. Steps

- [x] Step 1: The tile reader and the street finder (files) DONE
- [x] Step 2: Metro learns the tile extension, and the cache (files) DONE
- [x] Step 3: Fetching a location's tiles, with the 25 MB cap (files + specified) DONE
- [x] Step 4: The drawn map (files + specified) DONE
- [x] Step 5: The Qibla sheet becomes the map, and the dial is deleted (specified) DONE
- [ ] Step 6: The device proof on the iPhone XS (specified)

Each step's detail is in `steps/<k>-<name>.md`. Scripts are in `scripts/`, anchors in `scripts/anchors/`.

## 7. Device proof

Full detail in `steps/6-device-proof.md`. In summary: a local Release build on the iPhone XS
(`00008020-0015585C22D2002E`), the sheet opened at a known location, and a screenshot read against the real
street layout. No Android phone is connected, so the Android half of the proof is deferred and named as
outstanding, exactly as row 40's was.

No clock change is needed, so no `dumpsys alarm` reading is required and no armed alarm can fire.

The phone is left on the Release build with automatic time on.

## 8. Records

Given in `steps/6-device-proof.md` section 8, with `<TESTS_AFTER>` and `<SUITES_AFTER>` as the only
placeholders.

## 9. Push

None in this plan. The executor never pushes; the audit session pushes after a PASS.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| `unusedExports.test.ts` names a new module's exports | The module landed without its caller | The step is wrong, not the guard. Both go in one commit (section 4.3) |
| A range request answers 200 with the whole file | The CDN ignored the `Range` header | STOP, section 2.2 item 5. Never download the whole 138 GB archive |
| The decode returns no `roads` layer | The tile is empty ocean or desert | This is the empty state, not a failure. The test for it is in step 1 |
| A street name renders as boxes | The script has no font on the device | Record it in `LOG.md`; the sentence still reads, section 5.1 |
| Biome reports an unused constant in the decoder | A wire-type constant the code no longer needs | Delete it rather than underscore it; the planning session hit this with `COMMAND_LINE_TO` |
| Everything else | | `EXECUTOR-BRIEF.md` section 7 |

**Anticipated review fixes.** None beyond `EXECUTOR-BRIEF.md` section 4, item 8, whose three conditions govern
what the executor may fix in its own code.

**Stopping part-way** is per step, in each step file's part 12.

## 11. Subagents in this plan

None, except `vision` in step 6, where the executor's model may not be able to read the device screenshot. The
exact question is in that step.

## 12. Report to the owner

Per `TEMPLATE.md` section 12, starting `Execution session` and a `Time:` line.
