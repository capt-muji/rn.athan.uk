# Session prompt, 15d: Android widgets size themselves, on any launcher

Copy the block at the bottom into a new session.

---

## What this session is for

The Android widgets are built from hardcoded dp. They render correctly on the OnePlus
3T and break on the Oppo Find X8, which is the second Android phone they have ever been
placed on. Make the Android layout proportional so it survives a launcher that grants a
different width and a user who changed their display size.

Owner ruling, 2026-09-24: *"Our widgets are honestly supposed to be dynamic so that they
can work great on all sizes."* Phone, tablet, both platforms. Do not fix this by tuning a
second set of constants against the X8.

## Already established, do not re-derive

`ai/features/android-widgets-x8/FINDINGS.md` carries the measurements, the two device
screenshots and the owner's reference look. Read it first. The short version:

`HERO_WIDTH` 170dp plus `LIST_WIDTH` 162dp is 332dp of fixed content inside a provider
declared at `minWidth` 310dp, before `APad(13, 13, 20, …)` horizontal padding is counted.
`minWidth` is a floor the launcher must respect, not a grant it must exceed. A launcher
that hands over close to 310dp overflows the `Row`, and Glance clips its first child.
That is exactly what the X8 shows: names sliced from the left (`se`, `ar`, `ib`, `ight`,
`or`), times untouched because they sit at the right anchor.

The X8 also runs a display-size override, `Physical density: 560` with
`Override density: 480`. Text scales with that override; the dp boxes do not. That is the
"too much letter spacing" and "a little bit too big" part of the same defect.

The constants live in `widgets/PrayerWidget.tsx`: `A_ROW_HEIGHT` 24 (:191),
`ROW_TEXT_SIZE` 13 (:192), `LIST_WIDTH` 162 (:199), `HERO_WIDTH` 170 (:212),
`ROW_NAME_WIDTH` 82 (:213), `ROW_TIME_WIDTH` 54 (:214). The Android medium's layout is
`renderAndroid`'s final return, roughly :395-420.

## The two traps that already bit this code

Both are recorded in the source comments. A design that ignores either one re-breaks a
device that currently works.

1. **`fillMaxWidth` fractions starve siblings in Glance.** The comment at :207 says a
   `fillMaxWidth` fraction on the first `Row` child let the hero take the whole card and
   squeezed the day list to zero width, caught on the 3T: the medium rendered hero-only.
   `HERO_WIDTH` is fixed *because* of that failure.
2. **Fill-based and overlay-based two-column rows mislaid the times**, three separate
   device-caught failures (comment at :372-379). The current fixed name/time boxes were
   the thing that finally rendered.

So "just use weights" is not automatically safe here. Whatever the plan picks must be
proven on BOTH Android phones, and the 3T is the one with the regression history.

## The work, in order

**1. Reproduce and separate the two causes.** Both Android phones are on the bench. The
X8 confounds two variables at once: a different launcher grant AND a density override.
Separate them before designing anything. `wm density reset` on the X8 removes the
override non-destructively, and `wm density 480` restores it. Establish whether the
clipping survives at native density. If it does, the overflow alone is the cause and the
override only worsens it. Record both readings.

**2. Measure what each launcher actually grants.** The widget's granted size is in
`OPTION_APPWIDGET_MIN_WIDTH` / `MAX_WIDTH` per placed id, which
`modules/widgetrefresh` already reads for its kind-patching (AGENTS.md, session 15b).
Get the real granted dp on both phones rather than assuming the declared 310dp. The whole
bug is the gap between declared and granted, so this number is the centre of the session.

**3. Design a proportional layout.** The planner decides the mechanism. Constraints it
must satisfy, all evidence-backed:
   - no fixed total that can exceed the granted width;
   - survives the 3T, whose launcher computes spans as `ceil((minWidth + 30) / 70)` and
     HIDES providers that are too wide instead of clamping them, so raising `minWidth` to
     fit the content is not free (400dp made the provider invisible in the 3T picker);
   - interacts correctly with `plugins/androidWidgetGrid.js`, which strips the
     `targetCell*` attributes the expo-widgets plugin writes, because Android 12+ prefers
     them over `minWidth`;
   - does not reintroduce either trap above.

**4. Prove it on both phones, plus a density sweep.** A pass is: all six rows show FULL
names on both phones, at native density and with a display-size override applied, with
the times still right-aligned and the pill still spanning the list. The 3T must not
regress to hero-only or to mislaid times.

**5. Only then consider the small kind.** Its letters read too wide on the X8 but its
structure is sound (hero only, no list). It may need nothing once the sizing is
proportional. Do not widen scope on a hunch; re-measure after step 4 and decide.

## The target look

`ai/features/android-widgets-x8/reference-ios-target-look.png` is the owner's reference
(iPhone XS replica, 2026-09-20; the owner confirms the physical XS matches). The medium
shows six rows with full names, names left, times right, the active pill spanning the
whole list block.

**It is a reference for the LOOK, not the implementation.** iOS renders through SwiftUI
with its own `MEDIUM_LIST_WIDTH` 146; Android renders through Glance. Copying the iOS
numbers across is how the Android layout got its fixed widths in the first place.

## Out of scope

- **Widget taps not opening the app.** Confirmed by the owner on both Android phones, and
  it is its own queue row, 15c. AGENTS.md already names the likely cause: expo-widgets
  routes taps for layout buttons only. Do not fold it in.
- **iOS widgets.** Session 16a owns those and is awaiting its audit. This session does not
  touch `widgets/LockPrayerWidget.tsx` or the SwiftUI branch of `PrayerWidget.tsx`.
- **The palette, the pill shape, the fonts, the footer lift.** All settled by owner
  rulings in 15b and 16a. This session changes SIZING only. If a sizing fix visibly moves
  a colour or a weight, that is a bug in the fix.

## Bench

| Device | Serial | Notes |
| --- | --- | --- |
| OnePlus 3T | `8f7ada76` | Android 9, API 28, density 420. The regression risk: it is the phone the current constants were tuned on |
| Oppo Find X8 | `G6RWBAQ4VKWWEAIZ` | Android 16, API 36, density 560 with a 480 override. **Returning to its user, confirm availability before planning device work** |
| iPhone XS | `00008020-0015585C22D2002E` | Not needed this session |

The X8 currently runs production 1.27.335+ under the real package id `com.mugtaba.athan`,
installed fresh on 2026-09-24. Its widgets are on home screen page 4: a medium light, a
small light and a medium dark, plus the app icon.

## Gotchas that cost time already

- **The vision subagent's model was unavailable throughout 2026-09-24** (`Zai/glm-5.3-flash`,
  "Model unavailable"). The owner unbanned direct image reading for that session. Check
  whether it works before relying on it, and ask the owner if it is still down.
- ColorOS shows an install-confirmation dialog for every sideload: `adb install` returns
  only after the owner or a tap confirms it. The button is "Continue installation"; read
  its coordinates from `uiautomator dump`, which works on the X8.
- A plain `uat-2` build has **both widget flags OFF**, so no widgets appear at all. Android
  widgets need `EXPO_PUBLIC_ANDROID_WIDGETS=1` at build time.
- Version bump on EVERY commit, `app.json` and `package.json` together, then prebuild, or
  `versionLockstep.test.ts` fails. Bump FIRST, then prebuild, then build.
- Known flake, not a regression: `shared/__tests__/audioMatrix.test.ts` times out under
  load. Re-run to confirm before investigating.
- The 3T needs `EXPO_ANDROID_SUFFIX=fleettest EXPO_NAME_SUFFIX=FleetTest` on BOTH prebuild
  and build.

## Tools to use, not guess with

`codegraph_explore` for anything structural in this repo. `adb shell dumpsys appwidget`
for what the launcher granted. `wm density` / `wm density reset` for the override
variable. The Glance renderer tests in `shared/__tests__/widgetRenderer.test.ts` and
`widgetContract.test.ts` pin the current behaviour and will need updating with the layout.

---

## Copy this into the new session

```
Read ai/AGENTS.md and begin as Orchestrator.

Then read ai/prompts/android-widget-proportional-sizing.md and carry out the work it
describes: make the Android widget layout proportional so the medium kinds stop
clipping their prayer names on launchers other than the OnePlus 3T's, prove it on both
Android phones at native density and under a display-size override, and do not
reintroduce either of the two Glance failures the source comments record.

Read ai/features/android-widgets-x8/FINDINGS.md first: the root cause is already
measured and does not need re-deriving.
```
