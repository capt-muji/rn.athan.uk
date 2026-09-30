# Execution log: Session 45

## Pre-flight

`bash $TMPDIR/preflight-45.sh 1` printed `PREFLIGHT OK`. All six anchors counted 1, the tree was clean, `uat-2` was at
or ahead of origin at version 1.29.176, row 44 was DONE, `react-native-svg` was present, the world path file was
present, and the iPhone XS was reachable. Row 45 set to IN PROGRESS.

## Step 1: the prototype the owner holds

Branch: none. Nothing is committed in this step, by the plan's own design.

### The install, and the nested-copy trap firing exactly as predicted

`yarn add expo-location@58.0.9` added exactly one line to `package.json`, `"expo-location": "58.0.9",`, and nothing
else moved.

**The nested `@expo/ui` trap fired, as the plan said it would and on an install touching neither package.**
`widgetRuntimeLoads.test.ts` failed 2 of 3 immediately after the install. Measured before the remedy:
`node_modules/expo-widgets/node_modules/@expo/ui` was at **58.0.7** while the flat pin read **58.0.5**. The plan's
mandatory commands (`rm -rf node_modules/expo-widgets/node_modules && yarn install --frozen-lockfile`) fixed it, and
the suite went green at 3 of 3. This cost one command rather than a diagnosis, because the plan carried the remedy.

### What was built

Every file named in step 2's part 3, built from its contracts: `shared/qiblaGeometry.ts`, `shared/qiblaAlignment.ts`,
`device/qibla.ts`, `hooks/useQibla.ts`, `components/sheets/screens/Qibla.tsx`, with `shared/worldPath.ts` copied byte
for byte from the plan's file (26,923 characters, 70 rings), the qibla atom and actions in `stores/ui.ts`, the
iOS-gated Qibla row in `Settings.tsx`, both barrels, the sheet mounted in `app/_layout.tsx`,
`NSLocationWhenInUseUsageDescription` restored to `app.json`, and session 44's guard deleted.

### What was measured before the phone

Not required by step 1, which asks only for `tsc` and Biome, but run because the code is step 2's code and the
evidence is free:

| Check | Reading |
| --- | --- |
| `npx tsc --noEmit` | exit 0 |
| `npx biome check . --error-on-warnings` | exit 0, after `--write` on `Qibla.tsx` reflowed one `Rect` |
| The three unit suites | 38 passed, 38 total |
| `Qibla.test.tsx`, `Settings.test.tsx`, `_layout.test.tsx` | 45 passed (16 + 17 + 12), exactly the plan's prediction |
| `bash $TMPDIR/breaks-45.sh` | `caught 18 of 18`, `ALL AS EXPECTED: 1`, no `BREAK NOT APPLIED` |
| `find-unused-exports.py` | 5 unreachable, the five pre-existing allow-listed entries and nothing else |

The break script printing no `BREAK NOT APPLIED` is the evidence that the code written from the contracts carries the
plan's exact substitution text.

The prototype's own copy is saved at `~/athan-device-sweep/session45/step1-new-files/` and
`step1-prototype-tracked.patch`, so the restore in part 10 cannot lose it.

### The build

`npx expo prebuild -p ios --no-install` finished, and `ios/Athan/Info.plist` carried both the version `1.29.176` and
the location usage string verbatim. `npx expo run:ios --configuration Release --device 00008020-0015585C22D2002E`
ended `Build Succeeded`, `0 error(s)`, and installed `Athan.app` at `✔ Complete 100%`.

### The owner's verdict: the FUNCTION passes, the LOOK is rejected

**The function is accepted, and this is the first time in five sessions that has happened:**

🐋  "I have tested it. Functionally, it works fantastic on the iPhone Excess. Good, good, good, good. It follows the
same as Google Maps and Apple Maps. very good, very, very nice. It works amazingly."

So the heading, the bearing, the hysteresis and the one-tap-per-crossing are PROVEN ON HARDWARE and are not to be
changed: 🐋  "I don't want you to change the functionality of how it works under the hood, just like maps."

**The look is rejected outright, and the map goes with it:**

🐋  "Now, but however, it looks super ugly. Super, super ugly."

🐋  "The Kibla itself. I actually want a compass, a very, very nice compass, not a map, but a compass, okay? A compass.
But with the same functionality, even though we're using a compass... because the map is really, really small and
really, really ugly and it's just horrible. I hate the whole Kiblet design feature."

🐋  "Let's go for the compass look. And make it Islamic. as Islamic as possible, okay? We make it smooth. Make it like
60 FPS, you know, we're rotating, maybe use a PNG for, I don't know... rotate the, maybe not PNG, but maybe static, but
rotate it using scale or transform."

🐋  "really, really, really do some research on how to design it properly, like an Islamic compass, like they don't
make it look like such a basic, basic boring compass, okay? Make it look like an amazing Islamic Islamic, Islamic,
Islamic, Muslim compass."

**Six specific changes, each named:**

1. 🐋  "The compass icon that we previously had was better, okay? The little diamond shaped compass icon that we
   previously had was absolutely perfect. Right now it's just like 4 dots." That is `assets/icons/svg/compass.svg`,
   deleted by session 44 at `15f735cf`; the sheet currently carries `question.svg`. 🐋  "It should be the the compass
   icon, okay, that we previously had the diamonds. Don't change that 1. That was great."
2. 🐋  "I also noticed you move the Kibla option down to the other section in the settings bottom sheet. When in
   reality, We should have it under change then... we previously had the kibla inside of that sound card below change
   ad van. But I guess maybe we should reword sound to be something, something else because now it will contain the
   Kibla and they change Adan."
3. 🐋  "change the text. It says turn until it taps. What does that mean? Turn until it vibrates or turn, yeah. Turn
   until. It vibrates."
4. 🐋  "We don't want to put any text, any, any other text, I guess. We just won't have the compass."
5. 🐋  "Have the carb icon right now. I can't see a cab icon. I can literally just see a box in Mecca where Mecca is.
   So anyway, it should be the carba icon itself, not the carba emoji, but a carba icon." The plan's decision 2.1.5
   chose a drawn square with a door over `masjid.svg`, and it reads as a box: rejected.
6. 🐋  "this whole thing has to match the app theme, okay? Like it's blue, purple-ish theme, this dark blue, purplish
   theme." And on the sheet's height: 🐋  "It should open to... 85%, 75, 85% or wherever it is now 85%, but then, yeah.
   Or to fit to content. I don't know. You do the entire redesign."

**And the testing order is inverted for this iteration, by his instruction:**

🐋  "don't worry too much about the unit testing yet. Don't worry about the coverage because this is a prototype and I
don't want you to waste time writing unit tests. So do the redesign. Once I, we might redesign again after that. I
don't know. But once I approve, then you go ahead and get 100% coverage on all the unit testing and all the areas that
needs covering."

So the row goes NEEDS REPLAN, the redesign is prototyped in this same session (🐋  "You do the entire redesign, okay?
In this session now"), and step 2's tests are written only once he accepts the picture.

### What survives his rejection, unchanged

The rejection is of the DRAWING alone, so everything below the screen stands and is already proven on his phone:
`shared/qiblaGeometry.ts`'s `qiblaBearing`, all of `shared/qiblaAlignment.ts`, all of `device/qibla.ts`, and
`hooks/useQibla.ts`'s permission, position, watch and tap logic. `shared/worldPath.ts`, `projectMercator`,
`greatCirclePoint` and `qiblaPathData` are the map's own and die with it.

## Step 1b: the compass redesign, built in the same session on his instruction

🐋  "You do the entire redesign, okay? In this session now."

### The design research, because he asked for it explicitly

🐋  "really, really, really do some research on how to design it properly, like an Islamic compass."

The motif is the **Rub el Hizb** (۞), the eight-pointed star that marks Qur'anic divisions, and it is not a decorative
choice but a construction: two squares rotated 45 degrees to each other, so its inner vertices fall where the squares'
edges cross, at **cos(45)/cos(22.5) = 0.76537** of the outer radius. Verified rather than assumed: with that ratio all
sixteen edges of the resulting octagram measure **41.421 units on a radius of 100**, identical to three decimal places,
which is the test that the shape is the traditional one rather than an approximation of it. The housing is after the
**Ottoman brass qibla indicators** held in museum collections (concentric engraved rings, a studded rim, degree ticks),
which is the historical instrument this feature re-creates.

### The pictures were RENDERED AND READ before the phone, which is what found every defect

Four rounds, each rendered to PNG with `rsvg-convert` and read as an image. **Every fault below was invisible in the
code and obvious in the picture**, which is the same lesson session 37 learned when its dial shipped every label
upside down at 100% coverage:

| Round | What the picture showed | Fix |
| --- | --- | --- |
| 1 | The cardinal letters turned WITH the face, so N, E, S and W lay on their sides and upside down: session 37's exact defect | Each letter counter-rotates in its own `G`, so it orbits to its direction and still reads upright |
| 1 | A bare needle, a tiny box, and a dead empty field between the inner ring and the star | The medallion, the rosette rays and the studded housing |
| 2 | The sixteen-lobe band read as a grey cartoon SUNBURST and dominated the whole face | Deleted, replaced by one quiet medallion disc |
| 3 | A second star at 22.5 degrees made a muddy sixteen-point tangle, the two fighting each other | The twin nests CONCENTRICALLY at 0.84, and an eight-ray rosette fills the field |
| 4 | At a southward qibla the Kaaba COLLIDED with the S, and at every bearing it straddled the medallion's edge | Kaaba pulled in to 0.6, medallion out to 0.72, labels out to 0.79 |

Rounds 4's two collision cases were found by rendering the qibla at **200 degrees** as well as London's 118.876: a
single fixture would have shipped both defects, which is `__tests__/README.md`'s "never test at a starting value"
applied to a picture.

### What shipped

| File | What |
| --- | --- |
| `assets/icons/svg/compass.svg` | **Restored byte for byte** from `15f735cf^`, the diamond icon he asked for by name, with `Icon.COMPASS` back in the enum and the icon map |
| `shared/qiblaCompass.ts` | New: the ticks, the labels, the studs, the Rub el Hizb path, the rosette rays, and `unwrapHeading` |
| `components/sheets/screens/QiblaCompass.tsx` | New: the memoised face, the counter-rotating labels, the Kaaba, the mark that lights brass on the line |
| `components/sheets/screens/Qibla.tsx` | Rewritten: the compass alone, no map, no text but the denial message |
| `shared/constants.ts` | `COLORS.qibla`, eleven named tokens, so no colour is invented at a call site |
| `hooks/useQibla.ts` | The heading now writes to a SHARED VALUE rather than state, so the face turns on the UI thread and a 20-a-second sensor stream costs no React render |
| `components/sheets/screens/Settings.tsx` | The Qibla row moved into the first card, below Change athan, and that card renamed `Sound` to **`Prayer`** |
| Deleted | `shared/worldPath.ts`, `projectMercator`, `greatCirclePoint`, `qiblaPathData`, `MapPoint`, `MERCATOR_MAX_LATITUDE`, `QIBLA_PATH_POINTS` and the map's own tests |

The subtitle is now 🐋  "Turn until it vibrates". The sheet keeps `enableDynamicSizing` with `contentCap` 0.85.

**The 60 fps architecture is the one session 37 proved**, and it is why the face is memoised: react-native-svg re-walks
its whole drawing pipeline on any attribute change, so a 100-element face that re-records costs several frames per
turn. Only the layer above it rotates, which is a compositor matrix multiply rather than a redraw.

### The design exploration: 38 designs over four rounds, all rejected except the compass itself

The owner asked for alternatives, then rejected them all and kept the compass above. What the rounds
actually bought was a set of DEFECT CLASSES that no test could have found, and the owner's own rules.

| Round | What was tried | Verdict |
| --- | --- | --- |
| 1 | 11 designs, wide brief: minimal, Persian illumination, muqarnas, celestial, zellij, HUD, paper, puzzle-lock, Kufic, arabesque, reflecting pool | All rejected. 🐋  "all of these are so complex" |
| 2 | 10 designs built on a proper nautical COMPASS ROSE, because round 1's verdict was 🐋  "none of these look like a compass at all" | All rejected, and the rose was the reason: 🐋  "it looks like a Christian Catholic sort of thing" |
| 3 | 10 single-tweak variants of the compass on the phone | Owner picked ONE, "Kaaba First" |
| 4 | 10 multi-change variants of that pick | Pending the owner's choice |

**TWO DESIGNS ACCIDENTALLY DREW HATE OR OTHER-FAITH SYMBOLS, and this is the most important finding
of the whole exploration.** A square-Kufic pinwheel of four L-blocks in C4 rotation rendered as an
unmistakable **swastika**; a HUD reticle of two overlapping triangles rendered as a **Star of David**.
Both were emergent from ordinary geometric construction, neither was intended, and both would have
been catastrophic in a Muslim prayer app. **The fix is structural rather than vigilance:** an agent
that rebuilt its Kufic generator with full **D4 symmetry** (all four mirror axes, not just rotation)
removed handedness mathematically, so no chiral form can arise. Every later brief carries explicit
bans on hexagrams, swastika-adjacent pinwheels and square Kufic, plus a mandatory self-check.

**EVERY OTHER DEFECT WAS FOUND BY RENDERING THE PICTURE AND LOOKING AT IT, never by reading code.**
The recurring class is "geometrically correct and visually wrong":

- **Cardinal letters rotating with the face**, so N E S W lay on their sides. Session 37 shipped
  exactly this at 100% coverage. Fixed by counter-rotating each letter about its own point.
- **Upright is not the same as PINNED.** A bearing readout counter-rotated to stay level while its
  POSITION still rode the face, so it collided with S, and after the first fix with W. It needs a
  separate `pinned()` treatment that adds the heading to the angle.
- **A needle tapered correctly at its pivot was invisible**, because the hub covered exactly the point
  where it was widest. The over-correction then made it widen outward and pinch at the pivot, a paper
  dart. Right answer: shoulders just past the hub's edge.
- **The Kaaba vanished into its own recess**, `rgba(8,10,24,1)` against a well of `rgba(7,14,40,1)`.
- **A north bead sat on top of the N letter**; a Kaaba collided with S at one bearing and not another.
- **Bunching a path's points near the user made the DRAWING worse while making the formula better**,
  because 2dp pixel rounding destroys a sub-pixel segment's direction (the map, earlier this session).

**The method that works is render, look, fix, repeated.** A single fixture hides half these defects:
the Kaaba/S collision only appears at a southward bearing, and the tilted-cube bug only in the aligned
state. Two states and two bearings is the minimum honest check.

**A MODEL THAT CANNOT SEE MUST NOT BE GIVEN A DESIGN TASK, and this was measured rather than assumed.**
Round 5 ran 100 designs across 10 agents on TWO models. The five agents on one model read their own
PNGs and iterated on what they saw. **All five on the other model reported that their `Read` tool
refuses image input**, so not one of designs 51 to 100 was ever looked at by the agent that drew it.
Each said so plainly, which was the right call, and each substituted geometry audits, pixel probes and
diff-renders. Those caught real defects (a sheen arc drawn across the bottom because a `large-arc-flag`
was wrong, a needle buried under a filled silhouette, sub-pixel clearances). **What they could not
catch is whether the result looks good**, and reading the sheets afterwards found exactly that class:
an interlaced weave that renders as broken dashes, a motif that reads as a half-circle blob, dials so
faint they look empty. **The rule: a design task goes to a model that can see its own output, or the
session reads every render itself.** An analytic audit proves a drawing is correct, never that it is
beautiful, and this project's whole history is defects of the second kind.

**TWO DELIVERED STATES ARE NOT PROOF: SWEEP THE HEADINGS.** A bearing numeral placed on the face looked
correct at both rendered headings and collided with the cardinal letters at others. It took three
attempts and a sweep across seven headings (0, 40, 95, 160, 200, 250, 300) to find the one annulus
nothing ever enters: outside the centre motif, inside the Kaaba's orbit. **Anything placed on a
rotating face must be checked across a full turn, not at the one or two angles a contact sheet shows.**
The same applies to the Kaaba/letter collisions, which appear at some bearings and not others.

**THE TRANSFORM BUG THAT A STATIC RENDER CANNOT SHOW, found twice independently.** The Kaaba is drawn
inside a face that already carries `rotate(-heading)`, so its own counter-rotation must CANCEL that
rotation. Passing `-heading` instead of `+heading` makes the cube spin at TWICE the dial's rate and
tumble as the user turns, while every still frame at a single heading looks perfectly correct. Two
agents hit it, and the only ways to catch it are to reason about the transform composition or to
render the same design at several headings. **Any element that counter-rotates needs checking at more
than one heading**, which is the same lesson as the Kaaba/S collision that only appears at a southward
bearing.

**A process failure worth recording: the working folder was deleted while agents were still running.**
Two agents lost their files mid-task and one correctly STOPPED rather than ship work it knew was
banned by a brief that had changed under it. Clean up scratch space only when nothing is running.

**And the owner's rule on delegation was broken and restated** (🐋  "Stop your agents from deploying
sub agents"): the round-1 and round-2 briefs said "iterate and verify" without forbidding delegation,
so agents fanned out into cheaper models. Every brief from round 3 carries `YOU MUST NOT SPAWN
SUBAGENTS` as an absolute instruction, and it held.

### The layout the owner finally specified, after seven rounds

The exploration converged on an arrangement he described himself, and it is NOT the one every previous
round assumed. Reading outward from the centre:

`hub jewel → a connecting shape → an arrow on an inner ring → the cardinal letters → the KAABA ON THE
DIAL'S EDGE`

**The Kaaba moves from `0.6R` out to about `0.88R` to `0.92R`, riding the rim and still turning with
the face**, which forces the letters inward. An arrow sits on an inner ring at the same bearing,
pointing outward, so alignment is the arrow landing directly beneath the Kaaba rather than a needle
crossing a gap. The dial is session-17's tick block verbatim (every 15 degrees, three weights, one rim
ring and nothing else), the star is shrunk to a jewel of about `0.125R` at the hub, the qibla arc on
the rim narrows from ±13 to ±6 degrees, and the palette is a dark ground with GREY structure and ONE
soft gold accent. **N is plain ink, never the accent**, which was his single explicit correction.

### Where the exploration ended

Six rounds, 168 designs. The owner rejected every alternative to the compass above, then named six he
loved (copper on plum, amber on navy with a cone and a glow, royal blue with a fading beam, teal with
a sweep arc, old gold on near-black, and graphite with one amber accent carrying all the meaning) and
asked for those merged. The final 20 are built only from those approved ingredients and carry his one
correction: **the N letter is plain ink, never the metal or accent colour.**

**The exploration's real product is not the designs, it is the defect catalogue above**, and the
calibration: both anchors were right, ornate was "way too complex", minimal was "so basic, so boring",
and a nautical compass rose reads as another faith's emblem.

### Gates after the redesign

`tsc` 0, Biome 0, `find-unused-exports.py` reporting only the five pre-existing allow-listed entries, and the whole
suite green at **180 suites, 4,819 tests**. Coverage is NOT at 100% and is not expected to be: the owner deferred the
tests for this iteration (🐋  "don't worry too much about the unit testing yet... this is a prototype"), so the new
drawing carries no suite of its own until he accepts the picture.
