# Ticket 116 - ledger

**Resume from:** the Xcode 27.1 install, which needs the owner's Apple ID (hard-rule stop,
reported not asked). Then section 7.1 of `PLAN.md` in order, then section 7.2's readings,
which set `SIZE.twoPaneMinWidth` and detect the portrait-lock letterbox before step 1's code
is merged. Nothing in this folder is code; step 1's change is specified in `PLAN.md` section
5.6 and is unmerged by decision D116.4.

## Planning (2026-10-16)

Lane 116, dispatched by the orchestrator on the owner's create-now order ("create now, no
planning wanted"). No planner ceremony and no `check-plan.sh` gate: the ticket was made
executable by its own row. What follows is the device-free work the ticket could carry
before it met a hard stop.

### What was measured, and what the row got right or wrong

Every claim below is from the installed source on this machine, from Apple's own published
documentation, or from the npm registry. Where the row's claim survives, it is named as
verified; where it is imprecise, the precise form is written down.

| Row 116's claim | Verdict | Evidence |
| --- | --- | --- |
| Apple requires iPhone Duo compatibility | Verified, with the dates | `developer.apple.com/news/?id=kkphp5qo`: the Duo reaches customers 2026-10-23, developers are asked to recompile with Xcode 27.1, and from April 2027 every submitted app must carry Duo screenshots. Every app runs on the Duo regardless. |
| SDK 58 makes apps Duo-ready day one on both displays | Partly wrong, and the correction matters | Duo readiness is an Xcode/IOS-SDK tier, not an Expo one: `developer.apple.com/iphone-duo/prepare/` gives three tiers -- iOS 26 SDK or earlier shows the app centred with empty space around it; the iOS 27 SDK fills most of the inner display but still avoids the status bar on the right edge; the iOS 27.1 SDK or later is the optimised tier. This app is on the iOS 27.0 SDK, so it is in the middle tier. Expo's part is that `@expo/ui` 58.0.20 and `expo-hinge` 58.0.1 exist in the SDK 58 bundled set. |
| `expo-hinge` reports hinge angle and pose (`useHinge`, `getHinge`, `addHingeListener`) | Verified, and the gating is exact | `expo-hinge@58.0.1` (npm latest, also `expo/bundledNativeModules.json:52` as `~58.0.1`). Exports `isAvailable`, `getHinge`, `addHingeListener`, `useHinge`, and the `Hinge`/`HingeStatus`/`HingeChangeEvent` types. `src/Hinge.ts`: `isAvailable()` is true on Android 11+ or iOS 27.1+ built with the iOS 27.1 SDK. `ios/HingeObserver.swift` guards the whole module on `#if canImport(UIKit, _version: 9127.0.85) // iOS 27.1 SDK`, so it reacts to nothing below that SDK. |
| Apple's guidance is hinge state for interactions, not layout | Verified, in two places | Apple's prepare page: "Avoid using orientation to make layout decisions" and "To find out whether your app is wider than it is tall, compare the width and height of the space you have". `expo-hinge`'s own `addHingeListener` docblock: "Use hinge state for interactions and effects, not for layout." |
| Layout belongs to Expo UI's `ArrangementView` | Verified as an API, rejected as the mechanism here | Measured present in `@expo/ui` 58.0.20 at `src/swift-ui/ArrangementView/index.tsx`, declared `@platform ios 27.1+`. Rejected on three measured grounds, in `PLAN.md` section 5.1: the `ai/AGENTS.md` ban on `@expo/ui` outside widgets, its Swift `#else` falling back to a containerless `Children()` below the 27.1 SDK, and its split style stacking vertically in a window taller than it is wide, which the Duo's inner window is. |
| `requireFullScreen` no longer opts out of resizing on iOS 27 | Verified, and the whole technote is worth having | `TN3192`: "Starting in iOS 27 and iPadOS 27, `UIRequiresFullScreen` no longer opts your app out of resizing... This behavior applies when you build your app with the iOS 27 SDK or later and set `UIRequiresFullScreen` to `YES`, unless `UIRequiresFullScreenIgnoredStartingWithVersion` specifies version 27 or earlier." The note's migration checklist also requires a launch screen, **all interface orientations**, and no `UIRequiresFullScreen` key. `app.json` sets `requireFullScreen: true` today, so `ios/Athan/Info.plist:139-140` carries it. |
| Xcode 27 replaces Simulator.app with Device Hub | Verified | `DeviceHub.app` sits in `/Applications/Xcode.app/Contents/Applications/` beside `Xcode.app` on Xcode 27.0 already, and Apple's news item says "Use Device Hub to visualize how your apps behave on iPhone Duo across all poses and orientations". |
| `expo-hinge` needs iOS 27.1 and Xcode 27.1 | Verified exactly | The Swift `#if canImport(UIKit, _version: 9127.0.85)` comment reads `// iOS 27.1 SDK`. `xcodebuild -version` here is Xcode 27.0 (27A266a); `xcodebuild -showsdks` offers `iphoneos27.0`, not 27.1. |
| The machine has no Duo simulator runtime | Verified, and stronger than the row says | `xcrun simctl list runtimes`: iOS 18.5 and iOS 26.5 only -- no iOS 27.x runtime at all, though `xcodebuild -showsdks` offers the iOS 27.0 SDK. `xcrun simctl list devicetypes` carries no Duo or foldable type, and `strings` over `CoreSimulator.framework` in Xcode 27.0 finds no `Duo`. The Duo device type ships with Xcode 27.1, not with a runtime. |
| The toolchain upgrades before any test runs | Verified, and it is the ticket's blocker | Xcode 27.1 is not present, is not cached anywhere on disk, and `softwareupdate --list--all` offers macOS 27.0.1, not Xcode. `mas` is absent; `brew info xcodes` describes a tool that still needs an Apple ID. Every route to Xcode 27.1 takes the owner's credentials, so this lane reported instead of installing. |

### Additional facts the row did not carry, which change the design

- The app is **portrait-locked**: `app.json` `"orientation": "portrait"` produces
  `ios/Athan/Info.plist:143-152` with `UIInterfaceOrientationPortrait` and
  `UIInterfaceOrientationPortraitUpsideDown` for iPhone and for iPad. Apple's migration
  checklist requires all interface orientations, and the Duo's inner display is wider than any
  iPhone, so whether the current lock letterboxes the open display is the reading that can
  force an owner decision. Recorded as `PLAN.md` section 4.4 reading 2.
- The Duo's displays, from `apple.com/iphone-duo/specs/`: inner 7.6 inch, 1878 by 2670 pixels
  at 430 ppi; outer 5.4 inch, 1398 by 2034 pixels. At the 3x scale those resolutions imply,
  that is 626 by 890 and 466 by 678 points, and Apple's HIG names the inner window regular
  width and the outer window compact width. Both are derived from pixels, not measured, and
  `PLAN.md` section 4.4 reading 1 is the measurement that corrects them.
- The repository already anticipates large windows: `SIZE.contentMaxWidth`'s own comment names
  "iPad/tablet/Mac windows", and `hooks/useWindowDimensions.ts` records that the hook was made
  live because a memoized size "froze every absolute-geometry consumer (overlay catchers, veil
  glow) on resizable windows".
- Our own code is clean against Apple's Duo checklist. `grep` over `app/`, `components/`,
  `hooks/`, `modules/`, `shared/` and `stores/` finds no `UIScreen`, no
  `UIDevice.current.orientation`, no `statusBarOrientation`, no `interfaceOrientation`, no
  `userInterfaceIdiom`, no `horizontalSizeClass` and no `Platform.isPad`. The only Swift
  outside `Pods/` is `ios/Athan/AppDelegate.swift`, `ios/Athan/SceneDelegate.swift` and
  `modules/qiblaheading/ios/QiblaHeadingModule.swift`, all three clean too. Apple's resizability
  scanner is not in `xcrun agent skills export` on Xcode 27.0 (it exported ten skills, none of
  them Duo-related), which is a further sign that the tooling arrives with 27.1.
- `@expo/ui`'s changelog dates the fix that makes its Duo API work: "`ArrangementView` and
  `onHingeChange` now work on iOS 27.1 without `buildFromSource` when the app is built with
  Xcode 27.1 or later", shipped at 58.0.19. The repository has 58.0.20, so the API is present
  and the SDK is the missing half.

### The agent-ruled decisions

Recorded in `PLAN.md` section 2.1 as D116.1 to D116.5, argued twice each. The two that do the
work:

- **D116.1, the layout signal is the window, not the hinge.** Challenged once on the grounds
  that the hinge is the only signal that cannot fire on an iPad; the challenge was answered by
  Apple's own Duo model, which makes the inner display's regular-width window the two-panel
  case and calls that "the same way it adapts between regular and compact environments on
  other iPhone devices". Committed.
- **D116.4, this lane merges no production code.** Challenged once on the grounds that the
  owner asked for work rather than a plan. The challenge was answered by two facts that only
  the Duo can supply -- the real window widths and whether the portrait lock letterboxes --
  both of which change the code, so code written now is code rewritten then; and by the
  measured consequence that a width threshold high enough to miss the Duo's outer display
  still catches an iPad in portrait, a change to a shipping platform the owner has not ruled.
  Seeded unverifiable code into the app root, on the branch every session's device work
  exercises, which is the worse trade. Committed.

### What this lane leaves undone, and why

Step 1 (the layout code) is specified to the line but not built, because its threshold is one
of the two readings the Duo alone can take. Step 2 (the toolchain) and step 3 (the proof) both
begin with the owner's Apple ID. The row is set BLOCKED with the install named as its
Waiting-on.

session: ses_eb9fc31c8ffeJp2xJfdOMNuyvL
