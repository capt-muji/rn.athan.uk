# The qibla sheet crash: REVERTED to 1.29.220's drawing, then the shake gate rebuilt on top

**Status: CLOSED in 1.29.227.** The drawing is back to the comet trail the owner accepted; the 3D phone that
crashed the sheet is gone for good. The shake gate returns as the owner's own requirement, at 500ms, and the
permission refusal now explains itself and offers Settings.

The owner's instruction, 2026-10-02, after seeing ten rendered design alternatives and rejecting all of them:

🐋  "All of them are trash... Let's go back to design number 220, the last working version... Completely
revert everything we've done until that point."

Then, in the same session:

🐋  "Anytime they open the [qibla], they must shake the phone, and we have to listen to the shake... The shake
is the requirement to open the compass. And that gives us time to load the compass in the background."

🐋  "let's do it for 500 milliseconds, so half a second... just so it can be much quicker."

🐋  "if the phone turns sideways and it becomes invisible, that's not something we want."

---

## 1. What was reverted

`uat-2` carried five commits after 1.29.220 and the last three were failed attempts to fix the first.
Every one of them is undone in code:

| Version | What it did | Fate |
| --- | --- | --- |
| 1.29.220 | The comet trail, and the place name waiting for the compass | **KEPT. The owner accepted it** |
| 1.29.222 | The shake gate, the haptic, and the 3D phone | Reverted |
| 1.29.224 | Fix attempt 1: `'worklet'` directives | Reverted with it |
| 1.29.225 | Fix attempt 2: `polygon` builds its own string | Reverted with it |

Deleted outright: `shared/qiblaShake.ts`, `hooks/useQiblaShake.ts` and both their suites.
Restored to their 1.29.220 content: `QiblaWave.tsx`, `Qibla.tsx`, `qiblaWave.ts`, `Qibla.test.tsx`,
`qiblaWave.test.ts` and `jest.components.setup.js`.

**Verified rather than assumed:** `git diff 45ff6267 -- components shared hooks app jest.components.setup.js`
prints nothing, so the shipped code is byte-identical to the build the owner approved.

---

## 2. The two defects, diagnosed before the revert, so they are never re-walked

Both were proven by RUNNING the libraries' own code on this machine, not by reading it. They are recorded
because the next session to animate an SVG in this app will hit them otherwise.

### Defect A: an animated transform STRING cannot be SVG syntax

`QiblaWave` placed the phone with `transform: \`translate(12.34 -5.67) rotate(20.5)\``, which is valid SVG
and which `react-native-svg` parses correctly. **Reanimated 4.7.0 re-parses an ANIMATED transform through
its own CSS grammar first** (`updateProps.native.ts` calls `processTransform` whenever `isAnimatedProps`),
and that grammar is not SVG's. Running the real processor on the exact production string:

```
STRING => THROWS: [Reanimated] Invalid transform property: rotate(20.5)
ARRAY  => OK
```

Two faults in one string. `parseValues` splits on COMMAS, so `translate(12.34 -5.67)` reads as a single
argument and the y value is silently dropped; and `parseRotate` requires a unit, so `rotate(20.5)` fails
and throws. The throw lands on the UI thread at the first frame, which is why **iOS crashed outright while
Android showed the error page**: one cause, two failure modes, which is what made it look like two bugs.

**The rule: an animated transform is a transform ARRAY (`[{ translateX }, { rotate: '20deg' }]`), never a
string, even on an SVG node.** A static transform may be a string, because nothing re-parses it.

### Defect B: `Polygon` has no animatable `points`

`AnimatedPolygon` animated `points` every frame. **`Polygon` is not a native element**: its `render()`
returns `<Path d={...}>` and there is no `RNSVGPolygon` in the codegen at all. So `points` was pushed to a
native Path node that has no such prop, and the wrapper's ref resolved to the inner composite rather than a
host view, so the update had no view tag to address either. That is the `undefined is not a function`.

**The rule: animate `d` on a `Path`. A shape whose native form is a Path cannot have its own prop animated.**

### What the earlier fixes got right, and why they were not enough

1.29.224's `'worklet'` directives were a REAL defect correctly fixed, and 1.29.225's `map` finding was too:
a worklet handed by reference to a higher-order function arrives undefined on the UI runtime. Both were
genuine. Neither was the crash, which is why two ship-and-test rounds failed.

---

## 3. The lesson, and it is mine

**I claimed a fix was done without opening the sheet.** Both phones were connected and could have been
driven directly; I shipped on a green suite instead, twice, and the owner found the failure within a minute
each time.

**A suite that cannot see the thread boundary is not evidence that the app runs.** Jest's Reanimated mock
runs every worklet on the one thread the test is already on, so the boundary that breaks the app does not
exist in the test environment: 5072 tests passed against a build that died on open. For anything touching
Reanimated, the acceptance test is the sheet OPENING ON A DEVICE, nothing less.

**And a feature the owner has not seen is not a feature.** 1.29.222 shipped a shake gate, a haptic and a 3D
phone in one commit, which is also why it could not be bisected. One visible change per commit, proven on a
device before the next.

---

## 4. What shipped in 1.29.227, beyond the revert

**The drawing is 1.29.220's**, with one correction the owner asked for: `waveRoll` ran a raw cosine through
0 and -1, so the phone VANISHED at each turn and then drew itself mirrored. It is now floored at `MIN_ROLL`
and takes an absolute value, so it narrows to a visible sliver and never flips.

**The shake is now the GATE on the compass**, which is a stronger rule than 1.29.222's version: the compass
stays shut until the wave is done AND the heading is ready, where before the wave only fed a progress bar.
`hasWaved` LATCHES, because re-testing it would take the compass away the moment the user held the phone
still to read it. It resets on every open, because the calibration goes stale with the room.

**`requiredMs` is 500**, and `windowMs` came down to 400 with it: a window LONGER than the requirement keeps
crediting motion from samples the user has stopped producing, so a wave shorter than the gate asks for could
finish it on stale readings alone. A test pins `windowMs < requiredMs` so the pair cannot drift apart again.

**A refused permission now explains itself and offers Settings.** A bearing needs a position, so a refusal
ends the feature rather than degrading it; and once refused, the system dialog never appears again, so the
app's own settings screen is the only route back.

### What this closes

Row 50's measured defect is **closed**: a user who obeys the figure-eight instruction no longer gets a worse
first reading, because the compass no longer opens early on a window the wave itself filled.

### The testing note that matters for the next session

**The sheet's suite MOCKS `useQiblaShake`, and that is deliberate.** The gate reads the accelerometer through
`useAnimatedReaction`, which runs on the UI runtime and which no test can drive. So `useQiblaShake.test.tsx`
owns proving a wave is judged correctly, and `Qibla.test.tsx` owns what the sheet DOES with the answer.

That split has a cost, and it is the session-48 finding in a new place: **breaking the latch passes the whole
sheet suite**, because a mocked hook cannot report a broken one. It fails 3 tests in the hook's own suite.
Seven breaks were run against this work and all seven were caught, but only because each was aimed at the
suite that can actually see it.
