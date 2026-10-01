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

**THE SESSION'S OWN WORST PROCESS FAILURE, and it happened THREE TIMES: the shared working folder was
deleted while agents were still running in it.** Cleaning up between rounds destroyed live agents'
source files mid-task. Every affected agent recovered by restoring its file verbatim from its own
context and reported the deletion plainly, and one deliberately moved its verification into a private
scratch directory rather than write files it did not own back into shared space. Nothing was lost, but
only because the agents handled it better than the orchestration did. **The rule: scratch space shared
by parallel agents is cleaned only when NOTHING is running in it**, and the durable fix is what this
session eventually did anyway, which is to commit the chosen artefact into the repository rather than
leave it in `$TMPDIR` at all.

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

## Step 1c: the chosen design built as the prototype (2026-09-30, one session: replan, build, install)

The row was NEEDS REPLAN with the design locked in `design/`. This session refreshed the plan against what shipped
and built it, on the owner's instruction to work autonomously: 🐋  "Work until you complete this prototype
execution... No need to do any testing or unit testing or any coverage because it's just a prototype... I will do
the testing physically on the device."

### THE OWNER REVERSED THE iOS-ONLY RULING, MID-SESSION, AND IT IS THE MOST IMPORTANT CHANGE HERE

The plan's decision 2.1.2 gated the Settings row behind `Platform.OS === 'ios'`. He removed it on sight:

🐋  "Don't don't make this iOS only. I mean, it's going to work completely fine on Android as well... we are going
to work on Android next, but we shouldn't block this feature from Android. We want to implement both Android and
iOS. We just simply addressing iOS first... I see you putting iOS only feature flags, but this is just going to
increase the work for us later when we actually become to do it on Android also."

So **the gate is deleted and no Android-blocking wording survives anywhere in the feature**, verified by grep over
every qibla file plus `Settings.tsx`: no `Platform` import, no `ios only`, no `android`. iOS is the platform being
TESTED first, not the platform the code supports. Decision 2.1.2 is void.

### What was built

| File | What |
| --- | --- |
| `shared/qiblaCompass.ts` | New: `FACE` (every radius as a share of the radius), `TICKS`, `CARDINALS`, `rubElHizbPath`, `qiblaLinePath`, `arcPath`, `unwrapHeading` |
| `components/sheets/screens/QiblaCompass.tsx` | New: the two-palette face, the counter-rotating letters and Kaaba, the gold cross-fade |
| `components/sheets/screens/Qibla.tsx` | New: the sheet |
| `shared/qiblaGeometry.ts`, `shared/qiblaAlignment.ts`, `device/qibla.ts`, `hooks/useQibla.ts` | Restored from `working-code/`, the code the owner already accepted on his phone |
| `shared/constants.ts` | `COLORS.qibla.away` and `COLORS.qibla.facing`, the design's two palettes as named tokens |
| `assets/icons/svg/compass.svg` | Restored byte for byte, with `Icon.COMPASS` |
| `Settings.tsx` | The Qibla row under Change athan, card renamed `Sound` to `Prayer`, **on every platform** |
| Deleted | `shared/__tests__/qiblaRemoved.test.ts`, session 44's guard, whose job is done |

### THE PORT WAS PROVEN AGAINST THE APPROVED DESIGN RATHER THAN ASSUMED TO MATCH IT

The design lives as a Node generator and the app is TypeScript, so the geometry was transcribed by hand, which is
exactly where a locked design silently drifts. Two checks, both run:

1. The generator itself still reproduces `design/out/d01-off.svg` and `d01-on.svg` **byte for byte**, so the
   reference is intact.
2. `port-check.mjs` compares the shipped functions against `lib.mjs` primitive by primitive: `facePoint` against
   `pt` over 120 angles at 3 radii, the jewel at 5 phases, the line path against the reference `GESTURE`, and the
   arc. **All 10 comparisons identical, `PORT MATCHES THE APPROVED DESIGN: 1`.**

### THE NARROWED HAPTIC WINDOW WAS MEASURED, AND THE CONTROL REPRODUCED THE BUZZ

The owner's 3-degree window needed `ALIGNMENT_ENTER_DEGREES` 4 and `EXIT` 8 to become 1.5 and 3. **The ratio is what
suppresses the buzz, not the absolute value**, so the 2:1 gap is preserved deliberately. Measured over 13 cases:
one tap held on the line through 0.3-degree jitter, one per crossing, two for a turn away and back, **zero at the
antipode**, and two for two full revolutions. **The control is what makes this evidence rather than assertion: a
SINGLE threshold on the same samples fired 28 taps**, which is the buzz he refuses, so the pair is doing real work.

### THE COUNTER-ROTATION SIGN ERROR WAS CAUGHT BY REREADING, NOT BY A TEST

Written first as `rotation: -turn.value` for both the Kaaba and the letters. The face already carries
`rotate(-turn)`, so a child cancelling it must add `+turn`; `-turn` makes both spin at DOUBLE rate and tumble,
**and every still frame still looks correct.** This is defect 3 in the catalogue, hit for the third time in this
programme and caught before the build this time.

### THE PICTURE WAS RENDERED AND READ, WHICH IS THE ONLY METHOD THAT HAS EVER WORKED HERE

`render-shipped.mjs` transcribes the SHIPPED component's draw order and transform composition to SVG, so what was
read is the app's own geometry rather than the design's. Both states match the approved renders. **Then the
headings were swept**, because two states are not proof: 0, 40, 95, 160, 200, 250, 300, plus a southward bearing of
200, the case that collided a Kaaba with the S in an earlier round. Letters upright and Kaaba upright at every one.

**The collision risk was then bounded numerically instead of by eye, over every bearing on earth at a quarter of a
degree.** Kaaba against the letters is worst at **bearing 7 (3.55 px clear of the N)**, which no previous session
had ever swept for, and it is positive everywhere; the arrow tip clears the Kaaba by 18.19 px, the Kaaba's worst
corner clears the rim arc by 7.09, and the letters clear the deepest major tick by 9.42. Bearing 7 was then
rendered and read: clean.

### The nested-copy trap fired again, exactly as `ai/AGENTS.md` predicts

`yarn add expo-location@58.0.9` added one line to `package.json` and nothing else, and put **`@expo/ui@58.0.7`
under `expo-widgets` while the flat pin read `58.0.5`**. `rm -rf node_modules/expo-widgets/node_modules &&
yarn install --frozen-lockfile` cleared it and `widgetRuntimeLoads.test.ts` went green at 3 of 3. It cost one
command because the remedy was carried rather than diagnosed.

## Step 1d: the owner tested 1.29.179 on the XS and ordered a second redesign

He held the phone while the session ran and gave four structural corrections plus a palette change. **The FUNCTION
is still accepted; this is the drawing again**, which is now the second look rejection of the row and the sixth of
the programme.

### 1. The palette: purple and gold, and no neutrals at all

🐋  "The theme is absolutely horrible, the dark colours. Let's actually go for a purple theme... like a golden
purple theme. Keep the design, but go for a golden purple theme... A soft golden purple theme matching with the app
colours."

🐋  "no more dark black, gray colours. Those are boring colours. We need to match the compass, so like a purply
golden purple theme."

🐋  "in terms of colour, no white, no gray, no black, no dark gray, no light gray, et cetera."

**This is a hard constraint on every token, not a mood.** `COLORS.qibla` is rebuilt on the app's own violet: the
dial is `rgba(58,30,115,1)` on a `#1a0f3d` sheet, the structure is `206,178,255`, the ink `rgba(230,213,255,0.95)`
and the accent a warm `rgba(245,196,106,1)`. The aligned state warms the whole instrument as before, now to a
lighter violet with brighter gold rather than to brown.

### 2. THE ARROW IS STATIC AND THE DIAL TURNS UNDER IT, which inverts the drawing's architecture

🐋  "The arrow needs to always be pointing to the top of the phone. Okay? It needs to be pointing up, static. The
arrow should never change that direction because that should be static. Only the compass itself should change."

Every version in this programme rotated the line to the bearing and turned the whole face as one piece. **Now the
needle leaves the dial entirely**: `Needle` is its own memoised `Svg` drawn straight up and never rotated, and
`Dial` carries the rim, ticks, arc, letters and Kaaba beneath it. This is how a real instrument reads, and it is
also cheaper, because the turning layer is now a plain matrix multiply over a subtree that never re-records.

### 3. The letters are PRINTED on the dial and no longer pivot

🐋  "the letters W North S E... They change orientation based on the phone, landscape or portrait. They actually
flip... They should stay stationary like a real compass. They should be fixed in place. They shouldn't rotate as in
pivot."

The per-letter counter-rotation is deleted. **This reverses defect 1 in the catalogue rather than contradicting
it**: session 37's letters lay on their sides because the whole face turned and nothing compensated, while the fix
then applied, a pivot about each letter's own point, is what he has now seen and rejected. A compass card's letters
turn with the card, so they are plain `Text` in the dial's own space.

**The Kaaba is the one exception and it keeps its counter-rotation**, because a building drawn on its side reads as
a bug where a letter reads as engraving.

### 4. The Kaaba needs more presence

🐋  "try to make the cab a little bit nicer and more prominent, more exposing... Stronger, maybe a golden outline of
it perhaps. Or perhaps maybe a little bit bigger."

`FACE.kaabaSize` goes from `0.116` to `0.15`, and its outline from a grey hairline at `structure(0.55)` to the
accent itself at `2.2` stroke units.

### 5. No glows, no shadows

🐋  "No glows because the glow doesn't work good. No glows and shadows. They don't work great on Android. And they
are not performance."

None were drawn, and none will be: the design's own `README` already called the glow optional polish and flagged
the Android cost.

### And he asked to judge it on the simulator first

🐋  "show me the design first... you can actually build it on the iOS simulator and then open it... use the dev
build for faster iterations, faster hot refresh."

So the iteration loop moves to the booted `iPhone XS replica (18)` simulator with a dev build, and the XS gets a
Release build only once he has approved the colours.

## Step 1e: THE SIMULATOR CANNOT TEST THIS FEATURE, AND IT IS A PLATFORM LIMIT RATHER THAN A DEFECT

The owner asked to judge the new palette on the simulator before spending another device build
(🐋  "you can actually build it on the iOS simulator and then open it... use the dev build for faster iterations").
The dev client built and installed, the sheet opened, and **the compass never drew**. He saw it too:

🐋  "The simulator only opens to about 30% of the bottom sheet... I can see the title and the subtext, the
description and the icon, but I don't see the compass. It's an empty area... This was never an issue on the mobile
phone."

**Diagnosed from CoreLocation's own log rather than guessed**, which is what separates this from the four wrong
diagnoses earlier in the programme. `xcrun simctl spawn <udid> log show --predicate 'process CONTAINS "Athan"'`
shows the property `updatingHeading` transitioning `old:0, new:0` on every attempt, and `Stop updating heading`
immediately after: **a simulator has no magnetometer, so `watchHeadingAsync` never starts and no heading is ever
delivered.** Position is fine on the simulator (`didUpdateLocations` fires), so only the heading half is missing.

**So the simulator can never give a verdict on this feature**, which is exactly what `BRIEF.md` predicted in its
own words: "A simulator has no magnetometer, no taptic engine and cannot be turned on the spot". The iteration loop
returns to the physical XS, now on a DEV build so the owner gets hot reload on hardware that has the sensor.

### Two real defects the simulator trip exposed anyway, both worth having

1. **The sheet opened at a sliver.** `enableDynamicSizing` measures the content, and the stage reserved only
   `SPACING.section` (50 px) until the dial appeared, so the sheet sized itself to the header and then would have
   resized under the user once the fix landed. **The stage now reserves the dial's own square from the first
   frame**, which is Performance Design Rule 3: first-frame must be settled, never corrected afterwards.
2. **The compass waited on the heading before drawing anything.** It now draws as soon as the POSITION is known,
   because the dial is true against north from that moment; only the haptic and the gold state claim to know which
   way the phone points. A user with a slow first heading sees the instrument rather than an empty sheet.

**And `readPosition` now prefers the cached fix** (`getLastKnownPositionAsync`, falling back to a fresh read),
because waiting on a new fix leaves the sheet empty for seconds and 3 km of staleness moves the qibla under 0.15
degrees. That is a real improvement on the phone too, not a simulator workaround.

## Step 2: the owner accepted the compass, and it is now tested to 100%

🐋  "Okay, perfect... Save this, commit this, push this, merge this... I think our next step is to do 100% coverage.
This is now solid. Complete it, make it production ready, make it bulletproof, make it strongly tested. We cannot,
cannot, cannot get this wrong."

### THE DESIGN HE APPROVED, after eight live iterations on the phone

Every change below was made with him holding the device, and each is recorded because the numbers are now
load-bearing and a later session must not "tidy" them away:

| What he asked for | What shipped |
| --- | --- |
| Not iOS-only | No `Platform` gate anywhere in the feature. iOS is tested first, Android is not blocked |
| The arrow static, pointing up | `Needle` is its own memoised `Svg`, never rotated. The DIAL turns beneath it |
| Letters fixed like a real compass card | The per-letter counter-rotation is deleted; they are engraving on the plate |
| The Kaaba flat against the rim | Squared to the rim (`rotate(bearing)`), not counter-rotated. Its roof is parallel to the arc above it |
| Softer, deeper, Ramadan, alert-sheet colours | `COLORS.qibla` rebuilt twice: first too purple, then too gold, settling on the alert sheet's own indigo with gold reserved for the aligned state |
| Gold only when pointing at Makkah | The resting palette is cool indigo; the WHOLE instrument warms to gold on the line |
| A bigger, stronger Kaaba | 33 px with a full accent outline, up from 25.5 px |
| The arc the rim's thickness and the cube's width | Stroke `2.2` units, matching the rim exactly; drawn span 13.136 degrees against the cube's 13.136 |
| The arc on the rim, not below it | `arc` 0.9815 to 0.985, concentric with the rim |
| The inner circle 25% smaller | `medallion` 0.616 to 0.462 |
| Letters further out, fainter | `cardinal` 0.67 to 0.70, alpha 0.45 |

### FOUR DEFECTS FOUND DURING THE LIVE SESSION, each of which the owner saw before any test existed

1. **`invalidTransform`, a real crash.** The Kaaba's rotation was written as a transform STRING, which
   `react-native-svg` cannot parse on the UI thread: `[Worklets] Tried to synchronously call a Remote Function.`
   The array form (`translateX`, `translateY`, `rotate`) is worklet-safe. **The owner's "it pivots from the corners"
   was the same bug**, since `rotation` with `originX`/`originY` recomposes as the dial turns.
2. **The sheet opened at a sliver.** `enableDynamicSizing` measures its content, and the stage reserved 50 px until
   the dial appeared. It now reserves the dial's square from the first frame (Performance Design Rule 3).
3. **The position read hung.** `getCurrentPositionAsync` can wait seconds; `getLastKnownPositionAsync` is served
   first, which is also better on hardware because 3 km of staleness moves the qibla under 0.15 degrees.
4. **A bigger Kaaba collided with the N**, by 4.42 px at bearing 8 and later 8.83 px. **Found by sweeping all 1440
   bearings rather than by looking**, because the clash depends on the user's own qibla: at 0.74R and beyond, 280
   of 1440 bearings collide, which is about one user in five. The letters stop at 0.70R, the last radius clean for
   everyone.

### THE SIMULATOR CANNOT TEST THIS, and the log proves it rather than the symptom suggesting it

`updatingHeading` transitions `old:0, new:0` and logs `Stop updating heading` on every attempt: **a simulator has
no magnetometer, so `watchHeadingAsync` never starts.** Position works there; heading never will. The loop moved to
a DEV build on the physical XS, which is what gave hot reload on hardware that has the sensor.

### The suites, and what they are worth

**4884 tests, 182 suites, 100% on statements, branches, functions and lines.** Five new suites:

| Suite | Tests | What it guards |
| --- | --- | --- |
| `shared/__tests__/qiblaGeometry.test.ts` | 12 | The bearing at six cities, including a qibla NORTH of east, which London alone would never have caught |
| `shared/__tests__/qiblaAlignment.test.ts` | 26 | The hysteresis, the antipode, and one tap per crossing under jitter |
| `shared/__tests__/qiblaCompass.test.ts` | 25 | The face's geometry AND the owner's own clearances, so a later edit cannot quietly undo what he settled by eye |
| `device/__tests__/qibla.test.ts` | 10 | One foreground permission, the coarsest fix, and `trueHeading` passed on untouched |
| `components/sheets/screens/__tests__/Qibla.test.tsx` | 23 | The whole feature as a person meets it, including the three "the sheet closed while I was waiting" races |

**29 of 29 breaks caught** (`~/athan-device-sweep/session45/breaks-45.sh`). Two are worth naming because they guard
the owner's own rulings: *"one threshold for both directions"* is caught, which is the buzz he refuses, and
*"the dial drawn without a live heading"* is caught, which is the app pointing somewhere it does not know.

**THE TEST SUITE FOUND A REAL DEFECT THE LIVE SESSION HAD INTRODUCED.** Drawing the dial on POSITION alone, added
to work around the simulator, meant a lost heading left the dial frozen at its last angle: **the app would have
pointed confidently in a stale direction**, which is the one thing it must never do. The test asserted the correct
behaviour, failed, and the screen was fixed rather than the test.

**One break was a no-op and was rewritten rather than accepted:** `activeRef.current = true;` plus `void 0` changes
nothing, so it printed SURVIVED against a hook that genuinely works. The honest break removes `onPresent` from the
screen, and it is caught.

### The assumptions this session took, because the owner was unavailable

He instructed: 🐋  "Don't ask me any questions. I'm unavailable. Make assumptions as you go... and at the end list
what those assumptions are." Each is reversible and named here so he can overturn any of them on sight.

| # | Assumption | Why, and how to reverse it |
| --- | --- | --- |
| 1 | **Enter 1.5, exit 3** for his 3-degree window | He specified the window, not the pair. The exit must stay wider or the haptic buzzes, and 2:1 is the ratio session 43 proved. Two constants in `shared/qiblaAlignment.ts` |
| 2 | **The haptic stays `Heavy`** | It is what he already accepted on the XS, and the loudest the platform gives a blind user. One line in `hooks/useQibla.ts` |
| 3 | **The gold cross-fade takes 200 ms** (`ANIMATION.duration`) | An instant switch would flicker on sensor jitter at the boundary; a slow one would lag the tap. The haptic itself is never delayed |
| 4 | **The face turns over 150 ms** (`ANIMATION.durationFade`), snapping on first evaluation | Carried from the version he accepted, so the motion he liked is unchanged |
| 5 | **The letters use `TEXT.family.medium`** | The design's generator asks for Helvetica weight 600, which this app does not ship; medium is its nearest own token, and inventing a font is forbidden |
| 5b | **The exact purple and gold values** | He named the THEME ("soft golden purple", no neutrals) and not the hex codes. Built on the app's own violet so the sheet belongs to the app: dial `rgba(58,30,115,1)`, structure `206,178,255`, accent `rgba(245,196,106,1)`. All ten tokens are in one `COLORS.qibla` block and are his to move |
| 5c | **The Kaaba keeps its counter-rotation while the letters lose theirs** | He asked for the letters to stop pivoting and said nothing about the cube. A letter on its side reads as engraving on a compass card; a building on its side reads as a defect |
| 5d | **The Kaaba grows to `0.15` with a full accent outline** | He asked for "a little bit bigger" and "maybe a golden outline", offering both without choosing. Both were applied together because either alone is a small change, and the collision sweep still clears |
| 6 | **The compass is `min(width, contentMaxWidth) - SPACING.xl * 2`** | Fills the sheet's width on a phone and is capped on a tablet, matching every other sheet |
| 7 | **The sheet keeps `enableDynamicSizing` with `contentCap` 0.85** | He said 🐋  "85%... or to fit to content. I don't know. You do the entire redesign", which is both at once |
| 8 | **The Qibla row sits under Change athan in a card renamed `Prayer`** | His instruction, and `Sound` no longer describes a card holding the qibla |
| 9 | **No tests ship with this iteration** | His explicit deferral. `shared/__tests__/qiblaRemoved.test.ts` is deleted rather than left failing, and the full coverage gate is not run |
| 10 | **Nothing is committed** | The pre-commit hook would reject untested code with unreachable exports, and `--no-verify` is forbidden. The work sits in the working tree for him to judge |

### Gates before the phone

`npx tsc --noEmit` 0 and `npx biome check . --error-on-warnings` 0. `_layout.test.tsx` 12 of 12 and
`Settings.test.tsx` 15 of 15, both still green with the new sheet and row. A throwaway 8-test smoke suite (deleted
before the build, since the owner deferred the real coverage) proved on the component runtime that the sheet arms
no sensor until presented, draws on a reading, taps once per crossing and not while held, taps again on returning,
never taps at the antipode, goes quiet on `trueHeading === -1`, and disarms its watch on dismiss.

### Gates after the redesign

`tsc` 0, Biome 0, `find-unused-exports.py` reporting only the five pre-existing allow-listed entries, and the whole
suite green at **180 suites, 4,819 tests**. Coverage is NOT at 100% and is not expected to be: the owner deferred the
tests for this iteration (🐋  "don't worry too much about the unit testing yet... this is a prototype"), so the new
drawing carries no suite of its own until he accepts the picture.
