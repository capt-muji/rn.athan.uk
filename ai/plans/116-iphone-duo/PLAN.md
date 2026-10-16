# Ticket 116 - iPhone Duo support: one schedule folded, both schedules open

## Header

| | |
| --- | --- |
| Brief | `ai/plans/116-iphone-duo/` |
| Planned at | `uat` `fcc89dc7` (2.0.917), 2026-10-16 |
| Planned by | lane 116 (athan-lane), from the owner's create-now order at the 111 planning session |
| Needs first | none |
| Parent | none |
| Group | the app root and its native posture: `app/Navigation.tsx`, `app/Screen.tsx`, `app.json`, `ios/Athan/Info.plist`. Shared with no open ticket. |
| Batch budget | 3 |
| Session budget | 6 |
| Steps | 3 (step 1 the device-free layout change, step 2 the toolchain, step 3 the Duo proof) |
| Device | the iPhone Duo simulator, which ships with Xcode 27.1 only. Absent from this machine. |
| Owner decisions still needed | the Xcode 27.1 install, which needs her Apple ID. Everything else on this ticket is agent-ruled. |

**Status of this plan.** Written 2026-10-16 by lane 116, which executed every device-free
part and stopped at a hard rule: the ticket's acceptance is a Duo-simulator proof, the Duo
simulator exists only in Xcode 27.1, and installing Xcode 27.1 needs the owner's Apple ID
(an App Store or developer-portal credential). Credentials are a named stop, so the lane
reports instead of asking. No production code was changed: every gate candidate for the
two-panel layout is either unmeasurable on this machine or changes a shipping platform the
owner has not ruled, which section 5 records in full. The ticket is BLOCKED on that
install; the lane's device-free output is this plan.

## 1. Goal

Apple opens the iPhone Duo to customers on 2026-10-23 and asks developers to recompile with
Xcode 27.1 (`developer.apple.com/news/?id=kkphp5qo`, 2026-10-05). The concrete App Store
requirement is dated: from April 2027 every submitted app must carry iPhone Duo screenshots.
Every app runs on the Duo either way; only an app built with the iOS 27.1 SDK is optimised
for it (measured tiers in section 4).

Today the app renders one schedule at a time on both displays, because it is built with the
iOS 27.0 SDK and capped to a 500pt content column (`shared/constants.ts:611`). The owner's
ruling, made at the 111 planning session and recorded in row 116:

- folded, the app shows ONE schedule on the single page;
- open, the screen is big enough for BOTH schedules, one on the left panel and one on the
  right panel.

When the ticket is DONE her ruling holds on the Duo: closed, the pager she already has, one
schedule; open, the Standard schedule on the leading panel and the Extras schedule on the
trailing panel, both live at once; on every other device the app renders exactly what it
renders today.

Her standing rules that bind this work, quoted with their source:

- `ai/AGENTS.md`: "Visuals are settled. Fixes change behaviour only. Touch no pixel without
  the owner's say." Her ruling above is the say for the two-panel face; everything else on
  this ticket is behaviour.
- `ai/AGENTS.md`: "`@expo/ui` stays inside widget layouts, never app UI."
- `ai/AGENTS.md`: "Bump `app.json` FIRST, then prebuild, then build: `expo run:*` never
  re-syncs an existing native folder."
- `ai/plans/README.md`, row 116: her UX ruling and the toolchain prerequisite.

## 2. Decisions

### 2.1 Taken

Every one of these stood in for an owner answer during this lane, marked agent-ruled and
dated 2026-10-16.

| ID | Decision | Why |
| --- | --- | --- |
| D116.1 | The two-panel branch keys off the window the app has, not the device it is on. | Apple's own Duo guidance names the layout signal: "A compact width layout for the outer display and a regular width layout for the inner display give you the fundamentals for every pose" (`developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo`). |
| D116.2 | `@expo/ui`'s `ArrangementView` is rejected for this branch. | Three measured reasons, section 5.1: the `ai/AGENTS.md` ban, its Swift guard compiles to a containerless fallback below the iOS 27.1 SDK, and its split style stacks vertically in a taller-than-wide window. |
| D116.3 | `expo-hinge` is NOT added for the layout branch. | Apple's prepare page: "Avoid using orientation to make layout decisions" and "compare the width and height of the space you have"; `expo-hinge`'s own shipped docblock says "Use hinge state for interactions and effects, not for layout" (`expo-hinge@58.0.1`, `build/Hinge.js`). A dependency that cannot be exercised on this machine is not added for a decision the window size already answers. |
| D116.4 | No production code is merged by this lane. | Unverifiable code in the app root, landing on `uat` that every session's device work exercises, costs more than the same code written once the two facts in section 4.4 are measured. |
| D116.5 | The ticket is BLOCKED, not READY. | The blocker is the owner's credential for the Xcode 27.1 install, which is the "waiting on the owner" case in `ai/plans/README.md` under Status. |

### 2.2 The executor must not decide

None. Everything left is measurement, and section 7 gives each reading with the command that
takes it, the value it decides, and the branch each value selects.

## 3. Pre-flight

`scripts/preflight-116.sh` in this folder. It checks the checkout on `uat`, a clean tree,
`origin/uat` merged in, the version not lower than 2.0.917, Xcode 27.1 present with an iOS
27.1 runtime and an `iPhone Duo` device type, and every anchor count equal to 1. It ends
`PREFLIGHT OK`. It fails today at the Xcode check, which is the ticket's own blocker written
as a command.

## 4. Background the executor needs

### 4.1 Code map

| File | What it is |
| --- | --- |
| `app/Navigation.tsx:84-102` | The root pager. `PagerView` with `initialPage={0}`, `layoutDirection={direction}` (row 103's mirror), `offscreenPageLimit={1}`, `overdrag`, `scrollEnabled={!overlayIsOn}`, and two `MemoScreen` children, Standard then Extra. This is the whole surface this ticket changes. |
| `app/Navigation.tsx:43-65` | `handlePageScrollState` and `handlePageSelected`. The latter carries the overlay self-heal: a swipe that settles on a schedule different from the open overlay's closes the overlay. It is reached only from the pager, so it is unreachable while two panels are shown. |
| `app/Navigation.tsx:104-119` | The chrome layer: the settings button and the two page dots, absolutely positioned at the bottom, both faded by `chromeOpacityStyle` under the overlay. |
| `app/Screen.tsx:27-36` | The shared schedule screen. `maxWidth: SIZE.contentMaxWidth` (500), `width: '100%'`, `alignSelf: 'center'`. It already self-constrains, so a panel narrower than 500 renders the screen at the panel's width with no change. |
| `shared/constants.ts:611` | `SIZE.contentMaxWidth: 500`, whose own comment already names large screens: "Content column cap for large screens (iPad/tablet/Mac windows). The pager itself stays full-width so the whole screen remains swipeable; phones are narrower than this, so the cap never binds there." |
| `shared/constants.ts:333-337` | `SCREEN.paddingHorizontal: 12`, `SCREEN.paddingTop: 17`. |
| `hooks/useWindowDimensions.ts` | Re-exports React Native's live `useWindowDimensions`. Its comment records that this module was made live precisely for resizable windows: the previous memoized launch-time size "froze every absolute-geometry consumer (overlay catchers, veil glow) on resizable windows". |
| `stores/atoms/overlay.ts` | The overlay carries `scheduleType`, so panel identity already exists in state and needs no new field when both schedules render at once. |
| `__tests__/app/Navigation.test.tsx` | The existing suite for this component: nine cases over the pager's props and the overlay self-heal, with `react-native-pager-view` mocked to a `testID='pager'` view. This is where the new cases belong. |
| `components/ui/__tests__/Glow.test.tsx:14` | The repository's own pattern for driving a window size in Jest: `act(() => Dimensions.set({ window: { width, height, scale: 3, fontScale: 1 } }))`. |

### 4.2 How the pieces interact

`Navigation` renders a full-window pager; each page is a `Screen`, which centres itself at
500pt. On a phone the page is narrower than 500pt, so the cap never binds and one schedule
fills the screen. On a window wider than 500pt the page is wide and the single schedule sits
centred in empty space, which is what the open Duo would show without this ticket.

Two panels change only the container: a row of two flexed panels, each rendering the same
`Screen` with a different `ScheduleType`. Nothing inside `Screen` changes, so the settled
visuals of a schedule are untouched.

### 4.3 The existing tests and what they prove

`__tests__/app/Navigation.test.tsx` proves the pager's prop surface (`layoutDirection` per
locale, the two swipe marks) and the overlay self-heal in both directions, plus one Android
case. All nine read the narrow path, which this ticket leaves byte-identical, so all nine
must stay green unchanged.

### 4.4 The two facts only a Duo session can measure

These decide the branch and cannot be taken on this machine. They are step 3's first two
readings.

1. **The window size of each display, in points.** From Apple's published hardware figures the
   inner display is 1878 by 2670 pixels at 430 ppi (`apple.com/iphone-duo/specs/`), which at
   the 3x scale that resolution implies is 626 by 890 points, and the outer display is 1398
   by 2034 pixels, which is 466 by 678 points at the same scale. Those are derived, not
   measured: the App Store figure is pixels, and the point scale is an assumption until the
   simulator prints the window. Apple's HIG calls the inner window regular width and the
   outer window compact width.
2. **Whether the portrait lock letterboxes the open display.** `app.json` sets
   `"orientation": "portrait"`, so `ios/Athan/Info.plist` declares Portrait and
   PortraitUpsideDown only. Apple lists "Supports all interface orientations" as a
   precondition for a resizable scene (`TN3192`), and the Duo's inner display is wider than
   any iPhone. Whether a portrait-locked app is given the full 626pt window or a
   portrait-shaped window with empty space beside it decides whether D116.1's size branch can
   fire at all, and it is the one reading that can force an owner decision this ticket does
   not otherwise need.

### 4.5 Why the obvious fixes are wrong

- **Rendering the pager wider.** The page is already full-window and the screen is already
  capped at 500pt, so a wider pager shows one schedule in a wider empty band. It is the
  behaviour the ticket exists to replace.
- **Reordering the pager's children under RTL.** Rows 103 and 68 measured that the pager
  mirrors natively through `layoutDirection`. Two panels are a logical row, so the leading
  panel is the start edge in both directions with no mirror decision at all.
- **A hinge-angle-driven layout.** `expo-hinge`'s own documentation and Apple's guidance both
  reserve hinge state for interactions, and the angle answers a pose question the owner did
  not ask. Her ruling has two states, both of which the window size already distinguishes.

## 5. Design

### 5.1 The mechanism, and the rejected alternative

**Taken.** `app/Navigation.tsx` branches on the window it is given. Below the threshold it
renders today's `PagerView` unchanged. At or above the threshold it renders the two
`MemoScreen` children in a `flexDirection: 'row'` container, one per flexed panel, and it
omits the pager and the page dots, which name a position that no longer exists.

**Rejected: `@expo/ui`'s `ArrangementView`**, which row 116's fact set names. Three measured
reasons, each from the installed `@expo/ui` 58.0.20:

1. `ai/AGENTS.md` bans it: "`@expo/ui` stays inside widget layouts, never app UI."
2. Its Swift body is `#if canImport(SwiftUICore, _version: 8.0.85)` with an `#else` that
   renders `Children()` alone (`ios/ArrangementViewView.swift`). `8.0.85` is the iOS 27.1
   SDK, so under this machine's Xcode 27.0 the component compiles to a container that lays
   out nothing. Its own TypeScript declares `@platform ios 27.1+` and notes "Below iOS 27.1,
   the children render without a container", and its changelog puts the fix at
   `@expo/ui` 58.0.19: "`ArrangementView` and `onHingeChange` now work on iOS 27.1 without
   `buildFromSource` when the app is built with Xcode 27.1 or later."
3. Apple's split arrangement "presents the primary and secondary views side by side when the
   containing view is wider than it is tall" and "splits vertically when the arrangement is
   taller than it is wide"
   (`developer.apple.com/documentation/technologyoverviews/preparing-your-app-for-iphone-duo`).
   The Duo's inner window is taller than it is wide (626 by 890 derived), so the component's
   own rule would stack the two schedules vertically, which is not the owner's ruling.

`ArrangementView` remains the right answer for an app built with the iOS 27.1 SDK. It is not
the right answer for this repository, which bans `@expo/ui` outside widgets and does not have
the SDK.

### 5.2 The invariant

One sentence a test can check: the schedule region mounts exactly one `Screen` below the
two-panel threshold and exactly two `Screen`s, Standard before Extra, at or above it, and it
never mounts the `PagerView` while two panels are shown.

### 5.3 Concurrency trace

None. The branch is a pure function of the window size, read by React Native's live hook,
which re-renders on a real dimension change. No effect, no subscription, no timer, nothing to
start, stop or clear. A fold is one dimension change, so one render, in the same commit the
window resizes.

### 5.4 The recorded default

`twoPaneMinWidth = 600`, added to `SIZE` in `shared/constants.ts`. It is a recorded default,
pinned by a test, to be confirmed or corrected by reading 1 in section 4.4. The reasons for
600:

- It sits between the two derived window widths: the outer display's 466pt and the inner
  display's 626pt.
- It is the width at which two panels hold the app's narrowest supported phone width each:
  the iPhone SE's 320pt. Below it, two panels are narrower than any phone this app ships to.
- Every iPhone this app ships to is narrower than 500pt in portrait, so the branch cannot fire
  on an iPhone.

Two consequences the audit must re-read before the code merges, both recorded rather than
hidden:

- **An iPad in portrait (744pt or wider) crosses 600 and would show two panels.** That is
  Apple's own Duo model applied consistently, "the same way it adapts between regular and
  compact environments on other iPhone devices", but it is a visible change to a shipping
  platform the owner has not ruled on. It belongs in her read.
- **A window between 600pt and 640pt gives two panels narrower than the iPhone SE.** The
  measurement at reading 1 corrects the constant if the Duo's real inner width needs it.

### 5.5 Acceptance criteria

- [R1.1] WHEN the window is narrower than `SIZE.twoPaneMinWidth` THE SYSTEM SHALL mount one `Screen` inside the `PagerView` with the properties `__tests__/app/Navigation.test.tsx` already pins.
- [R1.2] WHEN the window is at least `SIZE.twoPaneMinWidth` wide THE SYSTEM SHALL mount the Standard panel before the Extra panel in a single horizontal container, and SHALL NOT mount a `PagerView`.
- [R1.3] WHEN the window is at least `SIZE.twoPaneMinWidth` wide THE SYSTEM SHALL NOT mount the page indicator dots.
- [R1.4] WHEN the window crosses `SIZE.twoPaneMinWidth` in either direction THE SYSTEM SHALL re-render with the layout the new width selects, without remounting the app root.
- [R2.1] WHEN the app runs under an RTL locale THE SYSTEM SHALL place the Standard panel at the layout's start edge and the Extra panel at its end edge, through logical styles only.
- [R3.1] WHEN the window is at least `SIZE.twoPaneMinWidth` wide THE SYSTEM SHALL render both schedules' content, observable as the Standard schedule's rows and the Extras schedule's rows on screen together.
- [R4.1] WHEN the app renders on a window narrower than `SIZE.twoPaneMinWidth` THE SYSTEM SHALL produce the same component tree as `uat` at `fcc89dc7`, observable as the unchanged nine cases of `__tests__/app/Navigation.test.tsx`.
- [R5.1] WHEN the Duo simulator reports the open display's window size THE SYSTEM SHALL report a value at or above `SIZE.twoPaneMinWidth`, or the constant SHALL be corrected to that measurement before the code merges.

### 5.6 The exact change

`shared/constants.ts`, inside `SIZE`, beside `contentMaxWidth`:

```ts
  /**
   * Width at or above which the two schedules show side by side. Recorded default: the
   * Duo's inner display is wider than this and its outer display narrower, and it is two
   * iPhone SE columns wide. Correct it from the open display's measured window size.
   */
  twoPaneMinWidth: 600,
```

`app/Navigation.tsx`, replacing the single `<PagerView>` block:

```tsx
  const { width } = useWindowDimensions();
  const twoPane = showsBothSchedules(width);
```

rendering, in place of lines 84 to 119's pager and dots block:

```tsx
      {twoPane ? (
        <View style={styles.panes}>
          <MemoScreen type={ScheduleType.Standard} />
          <MemoScreen type={ScheduleType.Extra} />
        </View>
      ) : (
        <PagerView
          style={{ flex: 1 }}
          initialPage={0}
          layoutDirection={direction}
          offscreenPageLimit={1}
          overdrag={true}
          scrollEnabled={!overlayIsOn}
          onPageScrollStateChanged={handlePageScrollState}
          onPageSelected={handlePageSelected}>
          <MemoScreen type={ScheduleType.Standard} />
          <MemoScreen type={ScheduleType.Extra} />
        </PagerView>
      )}
```

with the dots row wrapped in `{!twoPane && ( ... )}` inside `styles.dotsContainer`, and one
new style:

```ts
  panes: {
    flex: 1,
    flexDirection: 'row',
  },
```

and `showsBothSchedules` as a pure function beside the component, or in
`shared/schedulePanes.ts` if the audit wants it reviewed on its own:

```ts
/**
 * Whether the window holds both schedules side by side. Apple's Duo guidance gives the inner
 * display a regular-width window and the outer display a compact-width one, so the window
 * itself decides and no pose is read.
 */
export const showsBothSchedules = (width: number): boolean => width >= SIZE.twoPaneMinWidth;
```

## 6. Steps

- [ ] Step 1 - The device-free layout change (code, weight 2)
- [ ] Step 2 - The toolchain (machine, weight 1)
- [ ] Step 3 - The Duo proof (device, weight 3)

### Step 1 - The device-free layout change

Requirements: R1.1, R1.2, R1.3, R1.4, R2.1, R3.1, R4.1.
Branch `feat/116-two-panes` off `uat`. Files: `shared/constants.ts`, `app/Navigation.tsx`,
`__tests__/app/Navigation.test.tsx`.

Red tests, in the existing suite, using `Glow.test.tsx`'s own window pattern
(`act(() => Dimensions.set({ window: { width, height, scale: 3, fontScale: 1 } }))` before
`render`):

1. at 440 by 956 the tree holds `testID='pager'` and no second schedule's rows;
2. at 626 by 890 the tree holds no `testID='pager'`, holds the page dots' container, and
   holds both the Standard and the Extras rows;
3. at 626 by 890 the two panels are siblings of one horizontal container;
4. resizing from 440 by 956 to 626 by 890 inside one mounted tree swaps the layouts.

The nine existing cases must stay green with no edit. Green run: `npx tsc --noEmit`,
`npx biome check . --error-on-warnings`, then the suite. Break script: make
`showsBothSchedules` return `false` unconditionally and confirm cases 2 to 4 fail and 1
passes. Version: the next patch. Commit message
`<VERSION> - feat(app): both schedules side by side on a window wide enough for two panels`.

### Step 2 - The toolchain

Requirements: none; it unblocks step 3. Machine work, under `$HOME/athan-gitree/build.lock`.
Section 7.1 is the procedure. It needs the owner: installing Xcode 27.1 takes an Apple ID.

### Step 3 - The Duo proof

Requirements: R3.1, R5.1. A device step, dispatched alone. Section 7.2 is the procedure. Its
first two readings feed section 4.4 and may correct `twoPaneMinWidth` before step 1 merges;
if they do, rerun step 1 with the corrected constant and the corrected test expectations
before the proof.

## 7. Device proof

### 7.1 The toolchain upgrade procedure

Each command's output is saved under `$HOME/athan-gitree/sessions/116/toolchain/`. Hold
`$HOME/athan-gitree/build.lock` for the whole procedure. Nothing here builds the app.

1. Read the current state and save it: `xcodebuild -version`, `xcode-select -p`,
   `xcrun simctl list runtimes`, `xcrun simctl list devicetypes | grep -i duo`,
   `df -h "$HOME"`. Expected today: Xcode 27.0 (27A266a), iOS 18.5 and iOS 26.5 runtimes
   only, no Duo device type, 24 GiB free. The free space is the constraint to watch: Xcode
   plus an iOS 27.1 runtime is a large download.
2. **Owner step.** Install Xcode 27.1 from the App Store, or from
   `developer.apple.com/download/all` after signing in. This is the credential stop: it
   cannot be scripted without her Apple ID, and the lane that took this ticket reported
   rather than asked.
3. Install the iOS 27.1 simulator runtime: `xcodebuild -downloadPlatform iOS -buildVersion 27.1`.
   If the version is refused, `xcodebuild -downloadPlatform iOS` and read the version it
   installs.
4. Point the toolchain at it and confirm the SDK: `sudo xcode-select -s
   /Applications/Xcode.app` (adjust if the install lands elsewhere), then
   `xcodebuild -showsdks | grep -i "iphoneos27"`. Expected: an `iphoneos27.1` SDK.
5. Confirm the Duo: `xcrun simctl list devicetypes | grep -i "iPhone Duo"`. Expected:
   `com.apple.CoreSimulator.SimDeviceType.iPhone-Duo`.
6. Create the device: `xcrun simctl create Athan-Duo com.apple.CoreSimulator.SimDeviceType.iPhone-Duo <the iOS 27.1 runtime id from step 3>`.
7. Re-read the repo's own expectation: `xcodebuild -showsdks`, `node -p
   "require('./node_modules/expo/package.json').version"`. Expected: `58.0.13`. If a newer
   expo is on `uat` by then, take it, because row 111 re-pins on every attempt.
8. Prebuild, in the **main tree only** and only after step 1's code is merged, because the
   build scripts hardcode that path: `app.json` first, then the repo's own
   `build-mock.zsh`. Never `npx expo prebuild` bare: it drops the env vars and the prebuild
   order the scripts carry (`ai/AGENTS.md`, Commands).
9. Write the build log's last line into `LOG.md`. Success ends `BUILD-MOCK OK`.

### 7.2 The Duo reading procedure

Read `e2e/README.md`'s Gotchas section first. The Duo has no physical device, so this is a
simulator session and every reading is a `simctl` or log line, never a screenshot claim.

1. Boot the device: `xcrun simctl boot Athan-Duo`, then `xcrun simctl list devices | grep Duo`
   and record the state. Device Hub replaces Simulator.app in Xcode 27 (`DeviceHub.app` is
   present in this machine's Xcode 27.0 too, at
   `/Applications/Xcode.app/Contents/Applications/DeviceHub.app`); pose changes are made
   there, not in `Simulator.app`.
2. Install and launch the mock build with agent-device (`ai/AGENTS.md`, Tool routing).
3. Closed reading: with the device closed, record the reported window size and whether one
   schedule fills the outer display. This is section 4.4's reading 2 for the compact case.
4. Open reading: unfold in Device Hub, then record the reported window size. Expected from
   Apple's figures: 626 by 890 points. **This value decides `SIZE.twoPaneMinWidth`.** If it is
   below 600, correct the constant and rerun step 1 before continuing.
5. Portrait-lock reading: while open, record whether the app occupies the full inner display
   or is letterboxed with empty space beside a portrait-shaped window. If it is letterboxed,
   `app.json`'s `"orientation": "portrait"` is the cause, removing it is an owner decision
   because it unlocks rotation on every iPhone and iPad, and the ticket stops for her answer.
6. Partition reading: partially fold the device through Device Hub and record whether content
   is clipped by the fold. Two panels meeting at the centre avoid the folding region by
   construction; any clipping here is new information.
7. Acceptance readings, one per criterion:
   - R1.2 and R3.1: both schedules' rows are on screen at once, Standard leading.
   - R1.3: no page dots.
   - R1.4: closing the device returns to the pager with no relaunch and no flash.
   - R2.1: under an RTL locale the Standard panel stays at the start edge.
8. Turn automatic time back on and leave the simulator in the state section 7.1's log names.

## 8. Records

Findings text for `LOG.md` under `## Findings`:

- The Duo simulator exists only in Xcode 27.1, and this machine has Xcode 27.0 with no Duo
  device type and no iOS 27.x runtime. The ticket's acceptance cannot be taken here.
- The installing of Xcode 27.1 needs the owner's Apple ID, so the lane reported instead.
- `@expo/ui`'s `ArrangementView` is not usable in this repository: it is banned outside
  widget layouts and its Swift guard needs the iOS 27.1 SDK to lay anything out.
- Our own native and JavaScript code is already clear of every pattern Apple's Duo checklist
  names: no `UIScreen.main`, no orientation-driven layout, no idiom or size-class check
  anywhere under `app/`, `components/`, `hooks/`, `modules/`, `shared/` or `stores/`.
- The app is portrait-locked, so the open display's window width is the one reading that can
  force an owner decision.

Queue cell text the lead applies on DONE: none, the ticket does not reach DONE in this lane.
The row's BLOCKED text and its Waiting-on are written by this lane, in section 9.

## 9. Push

None. The lane never pushes. The row's status and blocker are written by this lane so the
next session reconstructs the ticket from the repository alone.

## 10. When something goes wrong

| Symptom | Action |
| --- | --- |
| `xcodebuild -downloadPlatform iOS -buildVersion 27.1` refuses the version | Run it without `-buildVersion` and read the version it installs; if that is not 27.1, stop and report the version it offered. |
| Free disk space drops below the size of the runtime being downloaded | Stop the download, delete the iOS 18.5 runtime if it is unused by this repo's flow, and report. |
| The Duo device type is absent after the Xcode 27.1 install | Stop. The Xcode install, not the repository, is wrong. |
| The open display's measured width is below `SIZE.twoPaneMinWidth` | Correct the constant to the measurement, rerun step 1's red tests with the new expectation, then continue. |
| The open display letterboxes the app | Stop and report to the owner: the portrait lock must come off, and that decision is hers. |
| Step 1's merge conflicts on `ai/plans/README.md` or the three version files | Lane weather: abort, rebase onto `uat`, keep both lanes' rows and the higher version, retry once, then stop. |
| A prebuild or build is already running | Never run two at once. Wait in `sleep 15` cycles for `$HOME/athan-gitree/build.lock`, and if it is still held after 20 minutes, rotate. |

Per-step restore: step 1 touches `shared/constants.ts`, `app/Navigation.tsx` and one test
file, and restores each with `git checkout -- <file>`.

## 11. Subagents

Planning and delivery run through the `athan-lane`, `athan-executor` and `athan-reviewer`
workers named in `.opencode/agents/`, with `explore` for fact questions and `vision` for any
image a worker cannot see. Nothing else.

## 12. Report to the owner

The Duo ticket is blocked on one thing, and it is not in the repository: the Duo simulator
ships with Xcode 27.1, and this machine runs Xcode 27.0. Installing 27.1 needs your Apple ID,
so I did not install it. Everything that could be done without it is done and recorded here:
the row's fact set is corrected against Apple's own documentation, our code is verified clean
of every pattern Apple's Duo checklist names, the two-panel change is specified down to the
code and its tests, and the toolchain and device procedures are written as commands. One
reading can change the design and one can need your answer: the open display's real window
width sets the two-panel threshold, and if the current portrait lock letterboxes the open
display then unlocking rotation is your call, because it turns rotation on for every iPhone
and iPad.

Progress:

| Task | Status |
| --- | --- |
| Source verification of `expo-hinge`, `@expo/ui` `ArrangementView`, Xcode and the runtimes | done |
| Our code audited against Apple's Duo resizability checklist | done |
| The two-panel change and its tests specified | done |
| The toolchain upgrade procedure | done |
| Xcode 27.1 install | blocked on your Apple ID |
| The Duo simulator proof | blocked on the install |
