# Ticket 116 - iPhone Duo support: one schedule on both displays through the existing adaptive layout

## Header

| | |
| --- | --- |
| Brief | `ai/plans/116-iphone-duo/` |
| Planned at | `uat` `3407e984` (2.0.1071), 2026-10-18 |
| Planned by | lane 116 |
| Needs first | nothing |
| Parent | none |
| Group | the app root's layout path: `app/Navigation.tsx`, `app/Screen.tsx`, `shared/constants.ts`, `hooks/useWindowDimensions.ts`, `app.json`. Disjoint from every open ticket: row 117 reads widget surfaces. |
| Batch budget | 3 |
| Session budget | 6 |
| Steps | 1 |
| Device | the iPhone Duo simulator, device type `com.apple.CoreSimulator.SimDeviceType.iPhone-Duo` on the iOS 27.1 runtime. Named `SIMULATOR_UDID` in this plan and resolved by the command in section 7.1. |
| Owner decisions still needed | none. Every decision is agent-ruled and recorded in section 2.1, the portrait-lock ruling included (D116.6). |

**Status of this plan.** Written 2026-10-18, after her evening order superseded the 2026-10-16 two-pane design. The bench branch `bench/116-iphone-duo` stays as history; the row in `ai/plans/README.md` carries its measured display sizes and its supersession. Planning ran the Duo simulator under Xcode 27.1 (27A9275) and took the readings in section 4.4 before this plan was drafted, as her follow-up ordered. The plan changes no production code. The glass readings show the app presents one schedule in both poses through the existing layout, and the open display's centred window is the portrait lock's system behaviour. Section 2.1 rules on that behaviour. One step remains: a cold re-run of the glass matrix by the executor and the record it writes.

## 1. Goal

Apple opens the iPhone Duo to customers on 2026-10-23 and asks developers to recompile with Xcode 27.1 (`developer.apple.com/news/?id=kkphp5qo`). An app built with the iOS 27.1 SDK is in Apple's optimised tier, and the tier's presentation still follows the app's own scene configuration: a portrait-only app receives a portrait window centred in a landscape display.

Her order, 2026-10-18 evening, recorded in row 116:

- no iPhone Duo-specific layout, because the app lives under 12 seconds per open and a Duo layout is overkill;
- the Duo rides the app's existing adaptable-width system, the one that adapts to tablets, resizable windows and laptop and desktop windows;
- treat the open display as an extra-large tablet or a larger phone, with ONE schedule laid out by that system, "one schedule in the middle, or wherever", never one schedule per fold side;
- the benched two-pane design and `SIZE.twoPaneMinWidth` are superseded, and the bench branch stays as history;
- nothing about the normal iPhone, Android, tablet and macOS resizable-window sizes may change, and the work lands only inside the existing adaptive classes, never a new device-specific path;
- `expo-hinge` is optional, only if glass evidence demands hinge state;
- production-ready with full testing.

Her follow-up, same day: the ticket reduces to investigation and testing, because the app may already support the Duo through its tablet and resizable-window support. The lane investigates first on glass, plans against the readings, and investigates again after planning if the plan needs it. Few or no changes are expected under the one-schedule approach.

When this ticket is DONE, four things are true:

1. Every acceptance criterion in section 5.4 has a reading from the Duo simulator, recorded in `LOG.md` with its evidence path.
2. The app shows exactly one schedule in each pose, laid out by the shipped components, with no Duo branch anywhere in the repository.
3. The range carries no change under `app/`, `components/`, `hooks/`, `modules/`, `shared/` or `stores/`, so no other form factor's behaviour moves.
4. Row 116 states the open display's measured presentation and its cause, so the next reader needs no session memory.

The owner notices this ticket through its row: the app is ready for the Duo launch, and the one presentation fact she may weigh (a portrait window centred in the open display) is written where she reads the queue.

Her standing rules that bind this work, quoted with their source:

- `ai/AGENTS.md`: "Visuals are settled. Fixes change behaviour only. Touch no pixel without the owner's say."
- `ai/AGENTS.md`: "`@expo/ui` stays inside widget layouts, never app UI."
- `ai/AGENTS.md`: "A ticket's documentation dies with its merge."
- `ai/AGENTS.md`: "Full unit coverage of every line a change touches, measured with coverage on, red before green and a mutation pass on guarded logic."
- `ai/plans/README.md`, row 116: her evening order and her follow-up, quoted above.

## 2. Decisions

### 2.1 Taken

Every decision below stood in for an owner answer during this lane, marked agent-ruled and dated 2026-10-18. Each was challenged once before it was committed; the challenge and its answer sit in the Why column.

| ID | Decision | Why |
| --- | --- | --- |
| D116.1 | The Duo rides the shipped layout: the single `PagerView` with two `Screen` children, and `Screen`'s `maxWidth: SIZE.contentMaxWidth` cap. No Duo branch is added. | Her order names the existing adapted system as the mechanism. The pager already mounts one `Screen` at a time, and the cap's own comment names large windows. Challenge: a wide window could want a second column. Answer: her evening order supersedes the two-pane design by name. |
| D116.2 | The two-pane design and `SIZE.twoPaneMinWidth` are dead. Nothing from `bench/116-iphone-duo` merges. | Her order supersedes both by name and keeps the bench branch as history. Challenge: the bench code is written and tested. Answer: the owner's later order outranks saved work, and the branch keeps the record. |
| D116.3 | No orientation or scene-resizability change: `app.json` stays `"orientation": "portrait"`, `requireFullScreen` stays true, and the bundle declares no landscape orientation. | Filling the open display needs landscape support. That unlocks rotation on every iPhone and iPad, changes a form factor her order forbids changing, and the fixed vertical stack would clip at an iPhone's landscape height. Challenge: Apple's preparation page asks for all orientations. Answer: that checklist targets resizable apps, and her order wins over Apple's recommendation where the two meet. |
| D116.4 | `expo-hinge` is not added. | The glass readings show no clipping at the fold and no layout decision that needs hinge state, and her order makes the package optional. Challenge: hinge state could separate the half-open pose. Answer: half-open presents the same 951 by 669 screen as open, so hinge state would select nothing. |
| D116.5 | No unit test is added. | No production line changes, and the presentation comes from the OS-granted window, which Jest cannot construct. A test that cannot fail proves nothing, and `ai/AGENTS.md` ties tests to changed lines. Challenge: her order says full testing. Answer: the glass matrix is the test for this ticket, and `yarn validate` runs as the regression gate. |
| D116.6 | The open display's centred portrait window is accepted as the shipped presentation, not a defect to repair, and the row records it. | The window is the system's answer to a portrait-only scene; the app's content inside it is complete and unclipped. Changing it is D116.3, which her order forbids. Challenge: App Store screenshots from April 2027 will show the centred window. Answer: the presentation is Apple's compatibility answer for a portrait app, it is what every portrait-only app shows on the device, and the alternative she named is excluded. |
| D116.7 | The proof vehicle is the installed mock build 2.0.1054, built with the iOS 27.1 SDK, because no app-surface file changed between 2.0.1054 (`8efd0b91`) and `uat` (`3407e984`). | `git log --oneline 8efd0b91..3407e984 -- app components hooks shared stores` lists no file under those trees; the range's changes are widget strings, widget tests and docs. The build lock at `$HOME/athan-gitree/build.lock` is parked with no holder and no build process, and the lane does not reap it. Challenge: a fresh build would be cleaner. Answer: a rebuild would produce the same app-shell bytes for this ticket's surfaces, and the lock is another session's to remove. |

### 2.2 The executor must not decide

None. The step is measurement against fixed expected readings and a record written from them. Section 10 names every observed state that changes the expected reading and the action each selects.

## 3. Pre-flight

`scripts/preflight-116.sh` in this folder runs from the repository root and ends `PREFLIGHT OK`. It checks:

- the checkout contains `origin/uat` and the tree is clean;
- the version is at least 2.0.1072;
- `xcodebuild -version` reports Xcode 27.1, `xcodebuild -showsdks` offers `iphoneos27.1`, `xcrun simctl list runtimes` carries iOS 27.1 and `xcrun simctl list devicetypes` carries `iPhone Duo`;
- an iPhone Duo simulator resolves to one UDID;
- the installed `com.example.athan` app exists on that simulator and reports a 2.0.x version at or above 2.0.1054;
- every anchor under `scripts/anchors/` occurs exactly once in its source;
- no app-surface file differs from `origin/uat`: `git diff --name-only origin/uat -- app components hooks modules shared stores` prints nothing.

## 4. Background the executor needs

### 4.1 Code map

| File | What it is |
| --- | --- |
| `app/Navigation.tsx:82-102` | The whole schedule surface: one `PagerView` with `initialPage={0}`, `layoutDirection={direction}`, `offscreenPageLimit={1}`, `overdrag`, `scrollEnabled={!overlayIsOn}` and two `MemoScreen` children, Standard then Extra. |
| `app/Navigation.tsx:104-119` | The chrome layer: the settings button and the two page dots, absolutely positioned at the bottom and faded under the overlay. |
| `app/Screen.tsx:27-33` | The shared schedule screen. `maxWidth: SIZE.contentMaxWidth`, `width: '100%'`, `alignSelf: 'center'`. It caps itself, so a window narrower than the cap renders it at the window width. |
| `shared/constants.ts:605-613` | `SIZE.contentMaxWidth: 500`, whose comment names iPad, tablet and Mac windows and says phones are narrower than the cap. |
| `hooks/useWindowDimensions.ts` | Re-exports RN's live hook. Its comment records that the memoized version froze absolute-geometry consumers on resizable windows. |
| `app.json:6-15` | `"orientation": "portrait"`, `"supportsTablet": true`, `"requireFullScreen": true`. The portrait lock is the cause of the open display's centred window. |
| `__tests__/app/Navigation.test.tsx` | The existing suite over the pager's prop surface and the overlay self-heal. It is untouched by this ticket and must stay green. |
| `components/prayer/List.tsx` | Reads the live window width and height for row geometry; it is the widest consumer of a window change. |

### 4.2 How the pieces interact

`Navigation` renders a full-window pager; each page is a `Screen`, which centres itself at 500 points. On a phone the page is narrower than 500 points, so the cap never binds and one schedule fills the screen. On a window wider than 500 points the page would be wide and the schedule would sit centred, which is the behaviour her order names "one schedule in the middle, or wherever".

Two facts from the glass fix the scope:

1. The closed display is 466 by 678 points and the app receives all of it, so the cap does not bind.
2. The open display is 951 by 669 points, but the portrait lock means iOS grants the app a 469 by 669 point portrait window centred in it. The cap does not bind there either, because 469 is below 500.

The adaptive path never receives a window wider than 500 points on this device, so it has no wider layout to select. The app is correct in both poses by construction.

### 4.3 The existing tests and what they prove

`__tests__/app/Navigation.test.tsx` proves the pager's prop surface and the overlay self-heal on the narrow path. This ticket changes no line the suite touches, so all its cases stay green without an edit. `yarn validate` is the regression gate for the step.

### 4.4 The glass readings taken at planning

All readings were taken 2026-10-18 on the booted iPhone Duo simulator (`SIMULATOR_UDID`) running the installed mock build 2.0.1054 under Xcode 27.1. The window rectangles are the accessibility tree's application rect, in points; the screenshots are the simulator's own captures.

| Reading | Closed pose | Open pose |
| --- | --- | --- |
| Display | 466 by 678 points | 951 by 669 points |
| App window | 466 by 678 points, full display | 469 by 669 points, centred, 241 points of display each side |
| Schedules on screen | one, the Standard page at launch | one, the Standard page at launch |
| Page dots | present at the bottom | present at the bottom of the app window |
| Second schedule | none | none |
| Fold or unfold | process 98145 before and after, no relaunch; an open overlay stayed open across the fold | same |
| Cold launch while open | not applicable | 469 by 669 points, Standard page |
| Overlay | opens on the tapped row, explanation box inside the window | opens on the tapped row, explanation box inside the window |
| Settings sheet | opens inside the window and scrolls | opens inside the app window and scrolls |

Evidence paths: `$HOME/athan-gitree/sessions/116/inv-closed.png`, `inv-open-1.png`, `inv-open-extras.png`, `inv-open-overlay.png`, `inv-open-settings.png`, `inv-closed-overlay.png`, `inv-open-cold-launch.png`. The screenshots are not committed.

The open display's centred window is the portrait lock's system presentation. Apple's tier table describes the optimised tier for an app that resizes; a portrait-only scene keeps a portrait window at every tier.

### 4.5 Why the obvious changes are wrong

- **A two-pane branch above a width threshold.** It is the superseded bench design. The open window is 469 points wide, so it would never fire, and her order forbids the layout by name.
- **Unlocking orientation so the open display fills.** It turns rotation on for every iPhone and iPad, which her order forbids, and the schedule's fixed stack clips at an iPhone's landscape height.
- **A hinge-driven layout.** Apple and `expo-hinge` both reserve hinge state for interactions, the half-open pose presents the same screen as open, and no reading demands it.
- **A new width test in Jest.** It would assert a constant against a constant the OS decides, and no production line changes.

## 5. Design

### 5.1 The approach

No production change. The step is a cold re-run of the glass matrix against fixed expected readings, plus the record it produces. The delivered behaviour is the behaviour already shipped: one schedule, laid out by `Screen` inside the pager, in a window the OS grants.

### 5.2 The invariant

One sentence the audit can check: the app mounts exactly one `Screen` in every Duo pose, its application rect equals the display rect when closed and a centred 469 by 669 point window when open, and the range changes no file under `app/`, `components/`, `hooks/`, `modules/`, `shared/` or `stores/`.

### 5.3 Concurrency trace

None. The ticket starts no subscription, timer or effect. A fold is one OS scene resize, which RN's live hook already re-renders; the process id stays the same across it.

### 5.4 Acceptance criteria

- [R1.1] WHEN the Duo is closed THE SYSTEM SHALL report a 466 by 678 point app window covering the display, showing the Standard schedule and the pager's two page dots.
- [R1.2] WHEN the Duo is open THE SYSTEM SHALL report a 951 by 669 point display and a centred portrait app window between 465 and 473 points wide and 665 and 673 points high, showing one schedule and no fold-side split.
- [R1.3] WHEN the device folds or unfolds while the app is in the foreground THE SYSTEM SHALL keep the same process id and re-lay the content without a relaunch.
- [R2.1] WHEN the user swipes once in either pose THE SYSTEM SHALL show the other schedule with its own rows filled.
- [R2.2] WHEN a prayer row is tapped in either pose THE SYSTEM SHALL open the overlay with its explanation box inside the app window.
- [R2.3] WHEN the Settings button is tapped in either pose THE SYSTEM SHALL open the settings sheet inside the app window and scroll to its last row.
- [R3.1] WHEN the app is launched cold in the open pose THE SYSTEM SHALL show the Standard schedule in the same centred portrait window.
- [R4.1] WHEN the range is audited THE SYSTEM SHALL show no changed file under `app/`, `components/`, `hooks/`, `modules/`, `shared/` or `stores/` against `origin/uat`.
- [R4.2] WHEN the ticket closes THE SYSTEM SHALL carry the readings and the portrait-lock finding in row 116 of `ai/plans/README.md`.

### 5.5 What the record states

The step writes into `LOG.md` the readings table with the measured values, the process ids across a fold, the evidence paths, and this finding in one paragraph: the open display is a 951 by 669 point landscape panel; the portrait lock makes iOS grant the app a 469 by 669 point portrait window centred in it; inside that window one schedule fills the width because the 500 point cap never binds; no Duo code path exists and none is added; filling the panel would require landscape support, which changes every iPhone and iPad and is excluded by her order.

## 6. Steps

- [ ] Step 1 - The Duo glass matrix and the record (device, weight 3)

Step 1 is specified in `steps/01-duo-glass-matrix.md`.

## 7. Device proof

### 7.1 The vehicle

Resolve the device once and keep the value in the shell:

```bash
SIMULATOR_UDID="$(xcrun simctl list devices | grep 'iPhone Duo' | head -1 | sed -E 's/.*\(([0-9A-F-]{36})\).*/\1/')"
printf '%s\n' "$SIMULATOR_UDID"
```

Expected: one UUID. Empty output is a STOP.

Confirm the installed app and its version:

```bash
xcrun simctl get_app_container "$SIMULATOR_UDID" com.example.athan
APP_PATH="$(xcrun simctl get_app_container "$SIMULATOR_UDID" com.example.athan)"
/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$APP_PATH/Info.plist"
```

Expected: a path under the simulator's data container, and a version of 2.0.1054 or higher. A missing app is a STOP: the build lock is parked and this lane does not build.

### 7.2 The matrix

Use the `agent-device` MCP with a session named `lane-116`. Open the app once:

```
open com.example.athan --udid <SIMULATOR_UDID> --session lane-116 --foreground
```

Then, for each pose, take the reading, the screenshot and the interaction:

| Order | Command | Expected reading |
| --- | --- | --- |
| 1 | `fold closed` | the pose applies; the tool may report `no sample to verify it` because the Duo simulator exposes no hinge angle. Confirm from the next snapshot. |
| 2 | `snapshot -i` | application rect 466 by 678; labels carry one schedule only; a `Settings` label |
| 3 | `screenshot $HOME/athan-gitree/sessions/116/duo-closed.png` | 466 by 678 |
| 4 | `swipe` from 350,300 to 250,300 | the Extras schedule's rows replace the Standard rows; no second schedule beside them |
| 5 | `press` a row ref | the overlay opens; its explanation box sits inside the window |
| 6 | `press` the close target | the overlay closes |
| 7 | `press` the Settings ref | the settings sheet opens inside the window; scroll to the last row |
| 8 | `fold open` | the pose applies; the next snapshot reports the open window |

Repeat rows 2 to 7 in the open pose, expecting a 951 by 669 display and a 469 by 669 app window. Read the application rect from `snapshot -i`; read the display size from `screenshot`.

Fold transitions, in this order:

1. open the overlay in the open pose, record the app's pid from a snapshot's first node;
2. `fold closed`, snapshot: the pid is unchanged and the overlay is still open;
3. `fold open`, snapshot: the pid is unchanged and the overlay is still open;
4. close the overlay.

Cold launch in the open pose:

1. `open com.example.athan --udid <SIMULATOR_UDID> --session lane-116 --foreground --relaunch`;
2. `snapshot -i`: application rect 469 by 669, Standard schedule.

### 7.3 Evidence

Save every screenshot under `$HOME/athan-gitree/sessions/116/` with the name `duo-<pose>-<screen>.png`. Never commit a screenshot. Record every reading in `LOG.md` as it lands, with its capsule name and the value read.

### 7.4 Restore

Leave the simulator folded closed and the app on the Standard schedule. Leave iOS automatic time alone: this matrix changes no clock. The simulator stays booted.

### 7.5 Why the installed build is the vehicle

The app surface is unchanged since the installed build. The planning session verified:

```bash
git log --oneline 8efd0b91..3407e984 -- app components hooks shared stores
```

prints no path under those trees: the range's app-surface changes are widget strings, widget tests and docs. The build lock at `$HOME/athan-gitree/build.lock` is a parked directory with no holder and no build process; the lane does not reap it and takes no build.

## 8. Records

Findings text for `LOG.md` under `## Findings`:

- The closed display grants the app all 466 by 678 points and one schedule fills it, with the page dots and the Settings button on screen.
- The open display is a 951 by 669 point landscape panel. The portrait lock makes iOS grant the app a 469 by 669 point portrait window centred in it, with 241 points of display each side.
- Inside that window the app lays out one schedule at 469 points wide, below the 500 point `SIZE.contentMaxWidth` cap, so the cap never binds and no wider layout is reachable on this device.
- Folding and unfolding keeps the process alive and re-lays the content in place; an open overlay survives the fold.
- The code carries no Duo, fold, hinge, idiom or size-class path before this ticket and gains none after it.
- Filling the open panel needs landscape support. That turns rotation on for every iPhone and iPad, which her order excludes, and the fixed stack clips at an iPhone's landscape height.
- The range changes no file under `app/`, `components/`, `hooks/`, `modules/`, `shared/` or `stores/`; every other form factor renders what it rendered before.

Queue cell text the lead applies on DONE: the audit writes it from `LOG.md` in the same commit that deletes this folder.

## 9. Push

None. The lane never pushes; the orchestrator pushes reviewed commits.

## 10. When something goes wrong

| Symptom | Action |
| --- | --- |
| The pre-flight reports no iPhone Duo simulator | STOP: the device type ships with Xcode 27.1 and its absence is a toolchain fault, not a repository one. |
| `fold` reports `no sample to verify it` | Continue: the pose applies and the next snapshot or screenshot proves it. Record the message once. |
| The open application rect is outside 465 to 473 by 665 to 673 | Record the value, take a screenshot, and STOP: the presentation changed from the planning reading and the plan's criteria need a replan against the new numbers. |
| The closed application rect is not 466 by 678 | Record the value and STOP for the same reason. |
| The fold changes the process id | STOP: a relaunch on fold would break the overlay and the countdown continuity, and the plan does not cover it. |
| The app opens a second schedule, a hinge gap or a fold-side split | STOP: the app carries a Duo path the planning read did not see, and the plan must be rewritten. |
| The installed app is missing or below 2.0.1054 | STOP: the build lock is parked and this lane does not build. Report the state. |
| `yarn validate` fails on a file the range does not touch | STOP and quote the failure; the plan expects a green tree. |
| The merge conflicts on `ai/plans/README.md` or the version files | Lane weather: abort, rebase onto `uat`, keep both lanes' rows and the higher version, retry once, then STOP. |

Per-step restore: the step changes no source file. `git checkout -- <file>` restores `ai/plans/README.md`, `app.json`, `package.json` and `LOG.md` if a commit is abandoned.

## 11. Subagents

Planning: this lane ran the fact reads itself, because the device session and its claimed simulator belong to it. Delivery: one `athan-executor` batch (the single step, weight 3) or the lane itself when the device session cannot be handed over; audit dispatches the `athan-reviewer` workers named by the lead. Every worker may call `vision` for an image it cannot see.

## 12. Report to the owner

The Duo needs no code. On the simulator built with Xcode 27.1 the app already shows one schedule on both displays through its shipped layout: full screen when the device is folded, and a centred portrait window of 469 by 669 points when it is open on a 951 by 669 display. That centred window is iOS's presentation for a portrait-locked app, not a layout fault; filling the open panel would need landscape support, which turns rotation on for every iPhone and iPad and is excluded by your order. Folding and unfolding keeps the app alive with its overlay open, and both schedules, the overlay and the settings sheet work inside the window. Nothing under the app's layout path changed, so no other form factor moves.

Progress:

| Task | Status |
| --- | --- |
| Glass readings on both Duo displays | done at planning, re-run in step 1 |
| The portrait-lock cause | measured and recorded |
| Production code change | none by decision |
| The record in row 116 | step 1, then the audit |
