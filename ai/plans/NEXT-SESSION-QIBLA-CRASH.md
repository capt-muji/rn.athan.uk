# START HERE: the qibla sheet is BROKEN on both phones, and it is my defect

**Read this page first. Nothing else in the queue matters until the sheet opens again.**

The owner's report, on 2026-10-02:

🐋  "on the 1+3T, as soon as I press the Qibla, the error page shows up. And then on the iPhone XS,
when I press the icon, it just completely crashes the app. It doesn't even bother loading."

**I broke a feature he had already accepted.** The comet trail shipped working in 1.29.220 and he liked
it. Everything after that is mine, and the last three versions are me failing to fix my own break.

---

## 1. The state of the world, measured

| | Version | Qibla sheet |
| --- | --- | --- |
| OnePlus 3T | **1.29.224** | Error page: "Oh no! Something went wrong" |
| iPhone XS | **1.29.223** | Hard crash, app closes |
| `uat-2` HEAD | **1.29.225** | **TESTED on the 3T: still the error page.** Neither fix was the cause |
| **Last KNOWN-GOOD** | **1.29.220** | The comet trail the owner approved |

`1.29.225` WAS built and installed on the 3T before the session ended. **It is still broken**, with the
same `undefined is not a function` in `QiblaWave`. Its APK is
`~/athan-device-sweep/session50/athan-FIX2.apk`. So the live suspect is defect 3 below, not the two I
already fixed.

**The first thing to do is not to write code.** Install 1.29.220 on both phones so the owner has a
working app while this is diagnosed:

```bash
# Android, from a clean tree
zsh ~/athan-device-sweep/session3/bin/build-prod.zsh 45ff6267 ~/athan-device-sweep/session53/athan-GOOD.apk
adb -s 8f7ada76 install -r ~/athan-device-sweep/session53/athan-GOOD.apk
```

For iOS the version must be bumped in `app.json` BEFORE `npx expo prebuild -p ios --no-install`, then
`npx expo run:ios --configuration Release --device 00008020-0015585C22D2002E` (`ai/AGENTS.md` section 6).

---

## 2. What I changed, and which part is suspect

Four commits sit between the working build and the broken one:

| Version | What it did | Verdict |
| --- | --- | --- |
| 1.29.220 | The comet trail, and the place name waiting for the compass | **ACCEPTED by the owner. Known good** |
| 1.29.221 | The ten designs preserved. Docs only | Harmless |
| **1.29.222** | **The shake gate, the haptic, and the 3D phone** | **THE BREAK IS IN HERE** |
| 1.29.223 | Docs only | Harmless |
| 1.29.224 | Fix attempt 1: `'worklet'` directives | Partial. 3T still shows the error page |
| 1.29.225 | Fix attempt 2: `polygon` builds its own string | **Tested on the 3T: STILL BROKEN** |

**1.29.222 did three things at once, which is why this is hard to bisect.** A next session should
separate them rather than assume the 3D phone is the only culprit:

1. `shared/qiblaShake.ts` plus `hooks/useQiblaShake.ts`, which arms `useAnimatedSensor`
2. The haptic in `components/sheets/screens/Qibla.tsx`
3. `phoneSlab` in `shared/qiblaWave.ts`, the 3D phone, drawn through four `useAnimatedProps`

---

## 3. The two defects I found, and the one I have not

### Defect 1, fixed in 1.29.224: missing `'worklet'` directives

`phoneSlab`, `phoneBody` and its helpers run on the UI thread through `useAnimatedProps` and carried no
directive. From the 3T's logcat:

```
[Worklets] Tried to synchronously call a Remote Function. Called "anonymous" on the UI Runtime.
  at processStyleValue_reactNativeReanimated_processStyleValueTs1
  at styleUpdater_reactNativeReanimated_useAnimatedStyleCommonTs3
```

A second instance sat in the component: `slabAt` was a closure defined in the render body and called
from four `useAnimatedProps` blocks, which is a Remote Function by construction. Both fixed.

**This is the SECOND time this defect has shipped.** Session 47 blanked the same sheet the same way.

### Defect 2, fixed in 1.29.225: a worklet handed to `map`

After fix 1 the error CHANGED, which is how I knew there were two:

```
TypeError: undefined is not a function
  componentStack: at QiblaWave
```

`polygon` called `points.map(point)`. **A worklet passed BY REFERENCE to a higher-order function does
not survive the hop to the UI runtime: it arrives undefined.** A worklet may call another worklet by
NAME; it may not hand one to `map`, `filter` or `forEach`. `polygon` now builds its string in a plain
loop and `point` is inlined.

### Defect 3, NOT FIXED, and this is the live one

**1.29.225 was built, installed on the 3T and still shows the error page**, confirmed by the owner and
by logcat. The error is unchanged from 1.29.224's second form:

```
TypeError: undefined is not a function
This error is located at:
    at QiblaWave (address at index.android.bundle:1:2076032)
```

So neither of my two fixes was the cause. **The remaining suspect, and the evidence for it is strong:**

`components/sheets/screens/QiblaWave.tsx` wraps SVG primitives at module scope:

```ts
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);
const AnimatedGroup = Animated.createAnimatedComponent(G);
```

**`AnimatedPath` is proven fine**: it shipped in 1.29.220, which the owner accepted. `AnimatedPolygon`
and `AnimatedGroup` are new in 1.29.222 and are the only untested wrappers in the file.

**This repository already knows that `createAnimatedComponent` is delicate**, and says so in
`components/ui/Icon.tsx`, which is worth reading before touching this:

> createAnimatedComponent returns a brand new component type on every call, and React identifies a
> subtree by its type: building one during render hands React a different type each pass, so it
> unmounts the icon and mounts a fresh one every render.

`Icon.tsx` caches them. `components/ui/Glow.tsx` wraps `Svg` itself. **Nothing in this codebase wraps
`G` or `Polygon`, and the crash says one of them resolves to undefined.**

**The cheapest test of this theory, and it needs no new code:** replace the four `AnimatedPolygon`
elements and the `AnimatedGroup` with plain `Polygon` and `G`, driving the whole phone from the one
`AnimatedPath`-style transform that already worked in 1.29.220. If the sheet opens, the wrappers are
the cause.

### What is NOT yet explained, and must be the next session's first question

**The iPhone CRASHES while Android shows an error page.** Those are different failure modes, and I
never obtained an iOS crash log. Android's `ErrorBoundary` catches a React render throw; a hard crash
on iOS suggests something native, which a JS worklet error would not usually cause.

**So do not assume fix 2 cures the iPhone.** Get the real iOS error first:

```bash
pymobiledevice3 crash ls
pymobiledevice3 crash pull <dir>
# or, live:
pymobiledevice3 syslog live -pn Athan
```

`ai/AGENTS.md` section 6 documents both. A likely suspect worth checking early is
`useAnimatedSensor(SensorType.ACCELEROMETER)` in `hooks/useQiblaShake.ts`, which is new in 1.29.222,
is native on both platforms, and has never run on an iPhone.

---

## 4. The guards I added, and the hole they do not close

`shared/__tests__/qiblaWave.test.ts` now carries two source-text checks:

1. Every function the UI thread reaches carries `'worklet'`: 7 functions pinned.
2. No bare function reference is passed to `map`, `filter`, `forEach` or `reduce` past the first
   worklet in the file.

Each was verified by reintroducing the exact line that crashed and watching the suite go red.

**They read SOURCE TEXT because nothing else can see this.** `tsc` cannot, and Jest cannot: its
Reanimated mock runs every worklet on the one thread the test already runs on, so **the thread boundary
that breaks the app does not exist in the test environment**. 5072 tests pass against a build that dies
on launch.

**The hole, stated plainly: both guards only cover `shared/qiblaWave.ts`.** A worklet defect in
`qiblaCompass.ts`, `qiblaShake.ts` or any component would ship exactly the same way. Widening them, or
finding a real check, is worth a row of its own.

---

## 5. The lesson, and it is mine

**I claimed a fix was done without opening the sheet.** The device was connected, `agent-device` could
drive it, and I shipped on a green suite instead. The owner found both failures within a minute of
installing, twice.

**A suite that cannot see the thread boundary is not evidence that the app runs.** For anything touching
Reanimated, the acceptance test is the sheet opening on a device, nothing less. `agent-device` can do
it without the owner:

```
open    { app: "com.mugtaba.athan", serial: "8f7ada76", session: "<name>", foreground: true }
screenshot { session: "<name>" }
```

That is how the error page was finally seen, and it should have been done before the first claim.

---

## 6. What the next session should do, in order

1. **Put 1.29.220 on both phones**, so the owner has a working app. Do this before diagnosing anything.
2. **Get the iOS crash log.** It is the one piece of evidence nobody has, and the crash differs from
   Android's error page.
3. **Test defect 3's theory**: drop `AnimatedPolygon` and `AnimatedGroup` for plain `Polygon` and `G`.
   They are the only untested `createAnimatedComponent` wrappers in the file, and `AnimatedPath` is
   proven good by 1.29.220.
4. **If that does not cure it, revert 1.29.222 wholesale** rather than patching further. The owner has
   lost a working feature for four versions now, and a revert gives it back immediately.
5. **Re-land the three parts of 1.29.222 one at a time**, each proven on a device before the next.
   The shake gate, the haptic and the 3D phone are independent; shipping them together is what made
   this impossible to bisect.

**What is worth keeping from 1.29.222, if it is reverted:** the shake gate closes a real, measured
defect (a waved phone opened the settling gate at 3.7s and 11.88 degrees of error against a still
phone's 9.7s and 2.98). `shared/qiblaShake.ts` is pure arithmetic at 100% coverage and is almost
certainly innocent of the crash. The 3D phone is the part that touches the UI thread.
