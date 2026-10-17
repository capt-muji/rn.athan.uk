# Plan 111: SDK 58 stable re-pin + the Babel 8 rider

| Field | Value |
| --- | --- |
| Brief | `ai/plans/SDK58-PROGRAMME.md` section 16 (facts A1 to A11), queue row 111 |
| Planned at | uat `fece11d3` 2.0.896, 2026-10-16 (refreshed; every anchor counted 1 at this sha) |
| Planned by | planning session 2026-10-16, refreshed by the lane session 2026-10-16 |
| Needs first | nothing (row 18's standing policy; her go given this session) |
| Parent | none |
| Group | none (the three version files serialize under the version lock) |
| Batch budget | 5 weight units |
| Session budget | 9 weight units |
| Steps count | 4 (steps/1 to steps/4) |
| Device | OnePlus 3T (release build + alarm gates), iPhone XS (owner-ordered deep-dive loop) |
| Owner decisions still needed | none open; D111.1 to D111.17 taken |

## 1. Goal

The app rode the preview lane until this ticket's first attempt. That attempt landed the stable
set (`expo 58.0.12`, `react-native 0.88.0`, three patches rebuilt) and the freshness batch on
uat, and then the first Android build on it failed: `expo-widgets@58.0.19` cannot compile at
all, because its own source imports `io.github.jakex7.peek.*` while the dependency it declares
packages `io.github.expo.peek.*` (16 unresolved references, `:expo-widgets:compileReleaseKotlin
FAILED`). npm has also moved: `expo@58.0.13` and `expo-widgets@58.0.20` published at
2026-10-16T15:43Z and 15:42Z, and `expo 58.0.13`'s `bundledNativeModules.json` moves 17 pins
past the table the first plan carried. The first plan's own section 2.2 makes that drift a
NEEDS REPLAN rather than an improvised bump, and this refresh is that replan.

When this ticket is DONE the app sits on the newest stable SDK 58 set (`expo 58.0.13`, the
`bundledNativeModules` delta, `react-native 0.88.0` unchanged), all three patches are
regenerated at their new package versions and proven on phones, `yarn validate` and
`yarn test:tz` pass, the OnePlus 3T's release build succeeds and its alarm and widget gates
hold, the iPhone XS deep-dive loop finds nothing broken, the Babel 8 rider is re-measured and
recorded (still blocked upstream), and the store-release path reopens. The owner notices
nothing in behaviour, and the app ships again.

Owner rules that apply:

- Row 18's ride-`next` policy: repin to the newest `expo` at every attempt, release candidates
  included; fix breaks in the code, never pin back; a package broken upstream at its latest
  rolls back alone (A1).
- Her order this session: the iPhone XS joins the loop, deep device testing, whatever build it
  needs, notifications and background schedules named, full confidence nothing broke (D111.2,
  D111.5).
- Already ruled at past re-pins, do not re-litigate: no SwiftPM (CocoaPods stays), no Live
  Activities. The "no threadIdentifier" ruling is superseded by her row 120 order; nothing in
  THIS ticket sets threadIdentifier.

## 2. Decisions

### 2.1 Taken

Owner decisions from the 2026-10-16 planning session stand and carry:

- D111.1 (owner, 2026-10-16): ticket 111 runs now.
- D111.2 (owner, 2026-10-16): the verification loop gains an iPhone XS leg; notifications
  firing, background schedules and the rest are deep-checked on glass, iteratively, to full
  confidence.
- D111.3 (owner, 2026-10-16): row 116 (iPhone Duo) created, NOT PLANNED.
- D111.4 (planner, 2026-10-16): `expo-hinge` and every other new SDK 58 package install in row
  116's planning. This ticket moves existing pins only.
- D111.5 (owner, 2026-10-16): the XS loop runs on a Release-configuration build with the real
  API first; a Metro dev build joins only to debug a defect.
- D111.6 (owner, 2026-10-16): the widgets patch's device-locale hunk stays local; no upstream PR
  now; the upstreaming question moves to row 117.
- D111.7 (owner, 2026-10-16): claim `enableRemoteNotifications: false` in the app.json
  `expo-notifications` plugin entry (iOS plugin option, default `true`, registers APNs; this app
  is local-only). Landed in the first attempt's step 1 and stands on uat.
- D111.8 (owner, 2026-10-16): rows 117, 118, 119 created, NOT PLANNED.
- D111.9 (planner, 2026-10-16, policy): the non-SDK freshness drift batches behind the re-pin,
  one commit per package. Landed in the first attempt's step 2 and stands on uat.
- D111.10 (owner, 2026-10-16): rows 120, 121, 122, 123 created, NOT PLANNED.
- D111.11 (owner, 2026-10-16, changelog walk): the metro-config env-in-cache change is
  re-verified at the 3T build step and the e2e README gotcha updated if healed; log-box and
  expo-updates items take no row; the @expo/ui `strokeBorder` `color` to `content` rename rode
  the first attempt's step 1 (`widgets/PrayerWidget.tsx:812`, the only deprecated call site in
  the repo); the iOS widget's live ticking timer stays system-formatted.

Agent-ruled at this refresh (the owner is hands-off; recorded where her answer would sit):

- D111.12 (agent-ruled, 2026-10-16): the refreshed target is `expo ~58.0.13` plus its
  `bundledNativeModules.json` delta, with `react-native` staying `0.88.0`. Why: row 18's
  ride-`next` policy orders the newest at every attempt and `latest` is 58.0.13, and 58.0.13's
  table is the only published statement of which module versions pair with it.
- D111.13 (agent-ruled, 2026-10-16): the three patches are regenerated at their new package
  versions, and no hunk is hand-merged this time. Why: measured, 58.0.19 to 58.0.20 changes
  none of the five files the widgets patch carries and 58.0.16 to 58.0.17 changes none of the
  three files the location patch carries, so all three patches applied whole with no rejected
  hunk (section 4.2).
- D111.14 (agent-ruled, 2026-10-16): the six audit findings the first attempt carried fold
  into this plan as named contracts of step 1, never as prose. Why: the audit's own closing
  record says the replan is where they belong, and each is a one-line change measured now
  (section 4.5).
- D111.15 (agent-ruled, 2026-10-16): the anchor set is rebuilt to assert step 1's starting state
  and the pre-flight stops calling the anchor script. Why: the carried finding is that the old
  anchors were consumed by step 1 while the pre-flight called them at every later step, so the
  script now runs once, inside step 1, and the pre-flight checks npm instead.
- D111.16 (agent-ruled, 2026-10-16): the re-pin lands as one commit even though `expo-widgets`
  and `expo-location` are patched packages, and step 1 also drops the two dead patch symbols and
  the one vacuous script check. Why: the whole set is one yarn graph, the three patch files are
  rebuilt in the same breath as their pins, and the same commit's own hook re-proves the tree
  green; splitting them would leave an unbuildable intermediate commit, which `uat` never takes.
- D111.17 (agent-ruled, 2026-10-16): R4.5's evidence stands as the first attempt recorded it -
  the registered `BGProcessingTaskRequest com.expo.modules.backgroundtask.processing` plus the
  live native scheduling trace - and the refreshed step 3 keeps the two Pino capture targets as
  the named alternative on a logging-enabled build. Why: `shared/logger.ts` disables Pino
  whenever `EXPO_PUBLIC_ENV` is `prod` or `preview`, and D111.5 orders the prod build, so the
  named stamp cannot exist on the vehicle this plan names.

### 2.2 The executor must not decide

- A patch hunk that will not apply on the new packages at all. The measured status is that all
  three apply whole (section 4.2); a rejection is a STOP with the rejected hunk verbatim.
- A new peer warning naming a package this plan does not move, a new R8 stripping symptom on the
  3T (a keep rule would edit app.json, ask-first), or an iOS signing failure on the XS: STOP and
  report with the exact output.
- npm drift: if `npm view expo dist-tags` or `npm view react-native dist-tags` moved past the
  versions in section 4.1 at any step's start, STOP and report; that is a NEEDS REPLAN, never an
  improvised re-measure.
- The OnePlus 3T's `dumpsys alarm` shows an armed alarm this plan does not list, or `auto_time`
  reads other than 1: STOP before touching anything.
- The iPhone XS refuses automation because it is locked: STOP the XS step, leave the 3T work
  merged, and report; no agent step can unlock the phone.

## 3. Pre-flight

`scripts/preflight-111.sh` (in this folder). The executor saves a copy to `$TMPDIR` and runs it
from there against `uat`. It checks the checkout, a clean tree, `origin/uat` merged in, the
version at or past 2.0.896, the three patch files present at the names this plan starts from, the
anchor files present, and the npm dist-tags against section 4.1's table. It ends `PREFLIGHT OK`.

It does not count the anchors: they assert step 1's starting state, so step 1 runs
`scripts/anchors-check.sh` itself before its first edit, and a session resuming at a later step
never has to satisfy them (D111.15).

## 4. Background the executor needs

Measured, not estimated. Every number in section 4.1 and 4.2 came from this lane's candidate run
in `$HOME/athan-gitree/worktrees/lane-111-replan` at uat `fece11d3`, 2026-10-16; the raw logs sit
under `$HOME/athan-gitree/sessions/111/replan/` (`install.log`, `resolved-versions.txt`,
`tsc.txt`, `biome.txt`, `jest-full.log`).

### 4.1 The target pin set (the measured delta)

`expo@58.0.13` `bundledNativeModules.json` (124 entries) plus expo's own dependencies and the
peer ranges. Eight direct pins move and two transitive pins follow. `yarn install` resolves the
graph.

| Package | On uat today | Target | Source of the target |
| --- | --- | --- | --- |
| expo | ~58.0.12 | ~58.0.13 | npm `latest`, published 2026-10-16T15:43Z |
| @expo/ui | 58.0.19 | 58.0.20 | bnm `~58.0.20`; exact per `ai/AGENTS.md` |
| expo-haptics | ~58.0.6 | ~58.0.7 | bnm |
| expo-location | 58.0.16 | 58.0.17 | bnm `~58.0.17`; exact, patched |
| expo-notifications | ~58.1.4 | ~58.1.5 | bnm |
| expo-router | ~58.0.21 | ~58.0.22 | bnm |
| expo-splash-screen | ~58.0.9 | ~58.0.10 | bnm |
| expo-widgets | 58.0.19 | 58.0.20 | bnm `~58.0.20`; exact, patched |
| babel-preset-expo (transitive) | ~58.0.16 | ~58.0.17 | `expo@58.0.13` dependencies |
| expo-modules-core (transitive) | ~58.0.20 | ~58.0.21 | `expo@58.0.13` dependencies |

Nothing else moves. Unchanged and re-verified in the candidate run: react and react-dom 19.3.0,
react-native 0.88.0, `@react-native/jest-preset` and `@react-native/metro-config` 0.88.0,
`@expo/log-box` ~58.0.12 (expo-router 58.0.22 peers `^58.0.12`), `@expo/metro-runtime` ~58.0.14,
`@expo/dom-webview` ~58.0.2, expo-asset, expo-audio, expo-background-task, expo-build-properties,
expo-constants, expo-dev-client, expo-font, expo-linear-gradient, expo-linking, expo-localization,
expo-system-ui, expo-task-manager, expo-updates, jest-expo, react-native-gesture-handler,
react-native-pager-view, react-native-reanimated 4.7.1, react-native-screens,
react-native-safe-area-context, react-native-svg, react-native-worklets 0.13.0.

Measured on the candidate set (uat `fece11d3` plus the eight pins):

| Command | Output |
| --- | --- |
| `yarn install --ignore-engines` | exit 0, resolved expo 58.0.13, expo-widgets 58.0.20, expo-location 58.0.17, @expo/ui 58.0.20, expo-notifications 58.1.5, expo-modules-core 58.0.21, expo-router 58.0.22, expo-haptics 58.0.7, expo-splash-screen 58.0.10, react-native 0.88.0 |
| peer warnings | zero. Only two yarn workspace warnings and the two patch-package version-mismatch warnings |
| `npx tsc --noEmit` | exit 0 |
| `npx biome check . --error-on-warnings` | exit 0, 444 files |
| `npx jest --watchman=false` | `Test Suites: 1 failed, 215 passed, 216 total`, `Tests: 2 failed, 2 skipped, 5704 passed, 5708 total`, 34.9 s |

The single failing suite is `shared/__tests__/widgetOpenAppPatch.test.ts`, whose two failures
are `names the installed expo-widgets version` and `patches exactly the known files, all inside
the package`: the patch file is still named for 58.0.19 while the installed package is 58.0.20.
Regenerating the patch at 58.0.20 is what greens them (section 5).

### 4.2 The three patches (measured apply status at the new packages)

All four upstream PRs were open at the first attempt and none of them changed the local patch
work: #50581 (background task), #51291 (location), #51292 (widgets).

| Patch | On uat today | Target | Apply status measured on the target | Upstream |
| --- | --- | --- | --- | --- |
| expo-background-task | +58.0.11 | +58.0.11 | applies whole; the package itself does not move | #50581 open |
| expo-location | +58.0.16 | +58.0.17 | applies whole, every hunk, both `LocationModule.kt` and `DeviceHeadingStreamer.swift` | #51291 open |
| expo-widgets | +58.0.19 | +58.0.20 | applies whole, all five files including `ExpoWidgetEmittableTree.kt` | #51292 open, plus the local-only locale hunk (D111.6) |

Measured grounds, both from the published tarballs and from the installed tree:

- `expo-widgets` 58.0.19 to 58.0.20 changes `CHANGELOG.md`, `android/build.gradle`,
  `WidgetsModule.kt`, the four `notifications/CustomNotification*.kt` files (the peek namespace
  fix that makes `compileReleaseKotlin` compile again), `package.json` and
  `scripts/build-layout-registry.mjs`. Not one of the five files the patch carries appears in
  that list.
- `expo-location` 58.0.16 to 58.0.17 changes `CHANGELOG.md`, `android/build.gradle`,
  `LocationTaskConsumer.kt`, the `local-maven-repo` version directory and `package.json`. Not
  one of the three files the patch carries appears in that list.
- On the candidate install `patch-package` printed `expo-background-task@58.0.11 ✔`,
  `expo-location@58.0.16 ✔`, `expo-widgets@58.0.19 ✔` with the two version-mismatch warnings and
  no `**ERROR**` line, and `git apply --check -R` on each patch was clean, which is only possible
  when every hunk landed.

The write-back stays bounded to regenerating the two renamed files and deleting the old ones
(A6, A7). Two hygiene edits ride the regeneration (D111.14, section 4.5).

### 4.3 The Babel 8 rider: re-measured, still blocked upstream

Re-measured 2026-10-16 at the refreshed set. `@babel/core` is still `8.0.7` on npm.
`babel-preset-expo@58.0.17` (the preset `expo@58.0.13` pairs with) depends on 36 `@babel/*` 7.x
packages, among them `@babel/preset-typescript ^7.23.0`,
`@babel/plugin-transform-modules-commonjs ^7.24.8` and
`@babel/plugin-transform-react-jsx ^7.28.6`; `@react-native/babel-preset@0.88.0` depends on
`@babel/core ^7.25.2`. A Babel 7 plugin under Babel 8 throws `BABEL_VERSION_UNSUPPORTED` (A2).
The four `@babel/*` devDependencies stay at `^7.29.x`; step 4 records the re-measurement and the
row 18 policy carries to the next re-pin.

### 4.4 The landed truth this plan starts from

- The first attempt's step 1 is merged as `bc9699d3` (commit `addc75bb`, 2.0.861) and its step 2
  as `5966e95b` (commits `8878bd69` to `490ddffa`, 2.0.865 to 2.0.869). Their pin numbers are
  superseded by this refresh and their invariant work stands: the `strokeBorder` `content`
  rename, `enableRemoteNotifications: false`, the three patch rebuilds at 58.0.11/58.0.16/58.0.19
  and the five-package freshness batch (jotai 3.0.1, pino 10.4.0, pino-pretty 13.2.0,
  `@testing-library/react-native` 14.1.0, `@biomejs/biome` 2.5.15). The refreshed plan has no
  freshness step.
- The three XS proofs the first attempt green: a Release build reached the schedule with no crash
  (R4.1), the compass stream ran unfiltered at roughly 105 delegate invocations a second (R4.3),
  and the Arabic switch relaunched and rendered the target locale from frame one both ways
  (R4.4). They are proofs of the superseded pin set, so step 3 re-runs them.
- R4.5's ground (D111.17): the task is registered and re-armed on every launch
  (`BGProcessingTaskRequest com.expo.modules.backgroundtask.processing`, visible in the unified
  log) and the native scheduling trace is live; the two Pino capture targets the step named
  cannot be emitted on a prod build.
- The Android build failure and its upstream cause: `:expo-widgets:compileReleaseKotlin FAILED`
  with 16 `Unresolved reference` errors from `io.github.jakex7.peek.*`. 58.0.20 is the fix.
  Both logs are under `$HOME/athan-gitree/sessions/111/3t/logs/`.

### 4.5 The carried audit findings (each becomes a named contract)

From `AUDIT.md`, all measured and adjudicated there:

1. `scripts/anchors-check.sh:22` read three patch files step 1 deleted, so it exits 1 and
   `scripts/preflight-111.sh:30` hard-stopped the ticket's own pre-flight. Fixed here: the anchor
   set is rebuilt (D111.15), the check is rewritten to the seven new anchors, and the pre-flight
   no longer calls it.
2. `steps/1-repin.md:33` omitted `scripts/verify-expo-location-patch.sh` from its Files list.
   Fixed here: the rewritten step file lists every file its commit touches.
3. `scripts/verify-expo-location-patch.sh:67` tested `$PKG/android/local-maven-repo`, which the
   shipped package does not have (the repo sits at the package root), so that check can never
   fail. Fixed here: the vacuous branch and its `withMavenRepo` fixture in
   `shared/__tests__/expoLocationPatch.test.ts` are deleted; the `publication` grep above it is
   the switch that guards the patched Kotlin.
4. `patches/expo-background-task+58.0.11.patch` installs `didRegisterTaskForTesting`, which
   nothing calls. Fixed here: the symbol leaves the regenerated patch.
5. `patches/expo-location+58.0.16.patch` installs `mLastAzimuth`, write-only since the gate's
   removal. Fixed here: the declaration, the assignment and the reset leave the regenerated
   patch, together with the patch lines that carry them.
6. `stores/notifications.ts:1919` passes `requiresNetworkConnectivity: false`, which no test
   reads, so a patch that stops carrying the option is caught at install time only. Fixed here:
   a new guard suite, `shared/__tests__/backgroundTaskPatch.test.ts`, asserts the installed
   patched package carries the option on the TypeScript, Kotlin and Swift sides.

### 4.6 The version files, the lock and the hook

Every commit bumps `app.json` first, then `package.json`, then `android/app/build.gradle`
`versionName`, or `shared/__tests__/versionLockstep.test.ts` fails. Fetch `origin` before taking
a number, because the sibling lanes take numbers in between. The pre-commit hook runs
lint-staged, `yarn validate` and the coverage gate: 3 to 4 minutes per commit, and the tree must
be green through it. That is why the re-pin is one commit.

The `android/` and `ios/` folders are gitignored; the gradle `versionName` is written but never
staged.

### 4.7 The 3T gate ground

The main tree `$HOME/repos/rn.athan.uk` is the build bay: `build-prod.zsh` hardcodes it, and it
builds `uat` content, so step 2 runs only after step 1's merge. The 3T is on adb, Android 9,
`auto_time` reads 1, and it carries an older production build (2.0.215) that `adb install -r`
replaces without touching app data. The 3T's alarm-clock proof is a sub-block, never `flags=0x9`
(A3): an alarm-clock arm reads `window=0 flags=0x3` with an `Alarm clock:` sub-block. The
programme's known unexplained app alarm at `when 2104803640505` is named, never counted, when it
appears; on the 2.0.908 install measured 2026-10-16 it did not, and the check named an
`ACTION_FORCE_STOP_RESCHEDULE` block at epoch 2107199034081 instead.

The first attempt's Android build failed in 11 m 9 s at `:expo-widgets:compileReleaseKotlin`;
with 58.0.20 that task compiles. Disk headroom on the build volume was 12 GiB at this refresh,
which is what the previous successful local builds used.

### 4.8 The XS loop ground

The XS is the owner's phone (`IPHONE_UDID`), development-signed with the owner's team
(`TEAM_ID`). It answered `devicectl device info` at the first attempt but refused automation
while locked: `agent-device prepare ios-runner` printed "iOS device is not ready for automation:
Command timeout" and `devicectl device process launch` failed to allocate its RSD device. The
loop's build command mirrors the Android prod env (`EXPO_PUBLIC_ENV=prod` with the API key read
per the EAS read-only rule from `$HOME/.config/athan/.api_key`, never printed). The e2e README's
rules bind: a screenshot reaches a screen, it never proves what is on one; every records claim
needs a log line or a dump.

## 5. Design

One commit carries the whole re-pin: the eight pins, the two transitive pins that follow from
`expo`, the three regenerated patches, the two dead-symbol deletions, the deleted vacuous check
and its fixture, the new guard suite, and the version triple. The measurement proved the set
green together (tsc 0 errors, Biome clean, one suite red only because the patch file still names
the older widgets version), and the patch regeneration is the change that greens that suite.

The re-pin's invariant, checkable by a test and by a command: after the merge, a clean install
prints exactly three `✔` lines from patch-package and nothing else, `yarn validate` passes at
100 percent on all four coverage measures, and `node -e "console.log(require('expo/package.json').version)"`
prints `58.0.13`.

Alternatives rejected:

- Taking `expo-widgets 58.0.20` alone and leaving `expo` at 58.0.12: 58.0.12's
  `bundledNativeModules.json` pins `expo-widgets ~58.0.19`, so the pair drifts out of step, and
  row 18's policy orders the newest `expo` at every attempt.
- Hand-merging hunks into `ExpoWidgetEmittableTree.kt` as the first attempt did: measured
  unnecessary, because 58.0.20 does not touch that file.
- Dropping the two dead patch symbols into a later ticket: the patch files are rebuilt in this
  commit anyway, and a rebuilt patch is the only place the deletions can be proven.
- Running the freshness batch again: landed on uat and the five pins are current.

Concurrency: the sibling lanes 122 and 123 hold docs plans, no code on this plan's files. The
version lock serializes every commit and the npm fetch before it; no jest run overlaps another
full jest run (the SIGSEGV lesson, section 10).

**Acceptance criteria:**

- [R1.1] WHEN `node -e "console.log(require('expo/package.json').version)"` runs on the merged re-pin commit THE SYSTEM SHALL print `58.0.13`
- [R1.2] WHEN `node -e "console.log(require('react-native/package.json').version)"` runs on the merged re-pin commit THE SYSTEM SHALL print `0.88.0`
- [R1.3] WHEN a clean install runs (`rm -rf node_modules/expo-background-task node_modules/expo-location node_modules/expo-widgets && yarn install --ignore-engines --force`) THE SYSTEM SHALL print one `✔` line per patch and no `**ERROR**` line and no version-mismatch `warning` from patch-package
- [R1.4] WHEN `yarn validate` runs on the re-pin commit THE SYSTEM SHALL pass tsc, Biome and Jest with 100 percent on statements, branches, functions and lines
- [R1.5] WHEN `yarn test:tz` runs on the re-pin commit THE SYSTEM SHALL pass in all four timezones
- [R1.6] WHEN the app.json `expo-notifications` plugin entry is read on the merged re-pin commit THE SYSTEM SHALL still carry `"enableRemoteNotifications": false`
- [R1.7] WHEN `widgets/PrayerWidget.tsx` is read on the merged re-pin commit THE SYSTEM SHALL still pass `strokeBorder` a `content` parameter and no `color` parameter
- [R1.8] WHEN the seven moved modules are resolved from the merged re-pin commit THE SYSTEM SHALL print `@expo/ui 58.0.20`, `expo-haptics 58.0.7`, `expo-location 58.0.17`, `expo-notifications 58.1.5`, `expo-router 58.0.22`, `expo-splash-screen 58.0.10` and `expo-widgets 58.0.20`
- [R1.9] WHEN the regenerated patch files and the installed patched packages are read THE SYSTEM SHALL add no patch line that adds `didRegisterTaskForTesting` or `mLastAzimuth` (a removal hunk necessarily quotes the symbol it removes, so `mLastAzimuth` appears on its removal lines alone) and SHALL carry neither symbol in the installed `expo-background-task` and `expo-location` sources
- [R1.10] WHEN `bash scripts/verify-expo-location-patch.sh` runs on a patched tree THE SYSTEM SHALL print `PATCH AS SHIPPED`
- [R1.11] WHEN `npx jest shared/__tests__/backgroundTaskPatch.test.ts --watchman=false --selectProjects=unit` runs on the merged re-pin commit THE SYSTEM SHALL pass
- [R1.12] WHEN `bash scripts/verify-expo-location-patch.sh` runs against a tree whose `expo-module.config.json` carries the `publication` block THE SYSTEM SHALL print `PATCH NOT AS SHIPPED`
- [R1.13] WHEN the offline-refresh option is removed from the installed patched package THE SYSTEM SHALL fail `npx jest shared/__tests__/backgroundTaskPatch.test.ts --watchman=false --selectProjects=unit`
- [R3.1] WHEN `build-prod.zsh` completes on the re-pin commit THE SYSTEM SHALL print `BUILD-PROD OK`
- [R3.2] WHEN `yarn check:device 3T_SERIAL` reads the 3T after install THE SYSTEM SHALL pass every channel, permission and armed-alert check it runs, comparing against the tree with the script's own `ALLOW_STALE=1` route when sibling lanes have carried `uat` past the built commit
- [R3.3] WHEN `dumpsys alarm` reads one armed athan on the 3T THE SYSTEM SHALL show `window=0 flags=0x3` with an `Alarm clock:` sub-block
- [R3.4] WHEN `npx jest shared/__tests__/widgetRuntimeLoads.test.ts --watchman=false --selectProjects=unit` runs on the re-pin commit THE SYSTEM SHALL pass
- [R3.5] WHEN two `npx expo export --platform android` runs on the re-pin commit differ only in `EXPO_PUBLIC_ENV` THE SYSTEM SHALL print the two entry-chunk md5 lines and the ledger SHALL record whether they differ
- [R3.6] WHEN the mock export's entry chunk is read THE SYSTEM SHALL contain the mock marker
- [R4.1] WHEN the Release-configuration build installs on the XS and cold-launches THE SYSTEM SHALL reach the schedule with no crash
- [R4.2] WHEN a real athan moment passes on the XS THE SYSTEM SHALL deliver its notification with the interruption level its armed row carries
- [R4.3] WHEN the compass sheet opens on the XS THE SYSTEM SHALL stream heading readings without a filter floor
- [R4.4] WHEN the language switches to Arabic and back on the XS THE SYSTEM SHALL relaunch and render the target locale from frame one
- [R4.5] WHEN the app has launched on the XS THE SYSTEM SHALL show the registered `BGProcessingTaskRequest com.expo.modules.backgroundtask.processing` beside a live native scheduling trace, or the two named Pino lines on a logging-enabled build
- [R4.6] WHEN the home-screen and lock-screen widgets render on the XS THE SYSTEM SHALL show current data for the day
- [R4.7] WHEN a reminder and its athan both fire on the XS THE SYSTEM SHALL deliver the reminder before the athan, never after
- [R4.8] WHEN one midnight boundary passes with the app running on the XS THE SYSTEM SHALL roll the list and move the countdown to the next day's first prayer
- [R5.1] WHEN `README.md`, `ai/UPSTREAM-PRS.md` and `ai/plans/SDK58-PROGRAMME.md` are read after the bookkeeping commit THE SYSTEM SHALL carry the stable stack line, the patch record at the new versions, and the Babel 8 re-measurement

## 6. Steps

Checklist (each step is its own file under `steps/`):

1. `steps/1-repin.md` — the delta re-pin to `expo 58.0.13`, the three patch regenerations, the
   two dead-symbol deletions, the deleted vacuous check, the new background-task guard suite.
   Requirements R1.1 to R1.11. Weight 2.
2. `steps/2-3t-gates.md` — the 3T release build, the alarm and widget gates, the metro env
   re-verify. Requirements R3.1 to R3.6. Weight 3.
3. `steps/3-xs-loop.md` — the owner-ordered iPhone XS deep-dive loop.
   Requirements R4.1 to R4.8. Weight 3.
4. `steps/4-bookkeeping.md` — records, stack tables, programme refresh, queue cell.
   Requirements R5.1. Weight 1.

## 7. Device proof

In `steps/2-3t-gates.md` and `steps/3-xs-loop.md`: the build commands, the per-check commands
with expected readings, and where each capture is saved (`~/athan-gitree/sessions/111/`).
`dumpsys alarm` is read before any clock change, and no clock change is planned on either phone.

## 8. Records

- `LOG.md`: every step opens `### Step <NN> — <state>` and ends with a `session: <ses_id>` line.
- The DONE cell (the lead applies on DONE): `DONE 2026-10-XX, audited: the newest stable SDK 58
  set landed (expo 58.0.13 with its bundledNativeModules delta, RN 0.88.0) and all three patches
  were regenerated at 58.0.11/58.0.17/58.0.20, the 58.0.19 Android build defect in expo-widgets
  closed by 58.0.20, the patch hygiene and guard findings of the first attempt's audit fixed, the
  3T gates and the owner-ordered XS deep-dive loop green, Babel 8 re-measured blocked upstream,
  the store path reopened`.
- The docs commit message at the refresh merge: `2.0.XXX - docs(plans): ticket 111 refreshed
  READY (expo 58.0.13 re-pin re-measured, patches regenerated, carried audit findings folded)`.

## 9. Push

None. The executor worker never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| patch-package prints an error or version-mismatch warning after the regeneration | a hunk list changed beyond section 4.2 | STOP, report the rejected hunk verbatim; NEEDS REPLAN |
| `:expo-widgets:compileReleaseKotlin` fails again with `io.github.jakex7.peek` unresolved | the widgets package regressed upstream | STOP with the gradle error; the package is broken at its latest, so A1's single-package rollback needs a version that compiles |
| `checkReleaseAarMetadata` names compileSdk in a local module | expo-modules-core raised the expected compileSdk past 37 | STOP, report the error; the three modules' build.gradle files are shared ground |
| A jest worker dies SIGSEGV during a full run | two full jest runs overlapped | rerun the one suite in isolation; green means transient, record it; never run two full suites at once |
| 3T release build loses a module at runtime (NoSuchMethodError, silent haptics) | R8 stripping a new reflection path | STOP and report; a keep rule edits app.json, ask-first |
| The XS build fails signing, or refuses automation with a lock message | certificate drift, or the phone is locked | STOP and report with the error; the lock answer is the owner's hands |
| Metro env-blindness at the 3T build (stale EXPO_PUBLIC_* in the bundle) | the pre-58 behaviour the changelog says is fixed | clear the metro cache and the generated bundle per the e2e README, re-verify, record whether the gotcha healed |
| A widget stays on its loading layout after install | the widget patch ran unpatched (A7) | verify the patch-package `✔` lines, reinstall, reprove |

Anticipated review fixes, word for word:

- "The plan's jest numbers cite the candidate run at `fece11d3`; the re-pin commit's own
  validate output is the number the ledger records."
- "Step 3 names the XS by placeholder; the executor substitutes the connected device's UDID and
  never writes it down."

Per-step restore lists sit in each step file.

## 11. Subagents

Planning: `explore` for bounded facts, `athan-plan-griller` for the grill. Delivery: the lead
dispatches `athan-executor` and `athan-reviewer`; a worker that cannot see an image calls
`vision`.

## 12. Report to the owner

Plain sentences: the newest stable SDK 58 set landed with the three patches regenerated and
proven on both phones; the expo-widgets release that could not compile Android is behind it; what
the XS loop checked and what it found; the Babel 8 rider still blocked upstream; the audit
hygiene the first attempt carried, now fixed. The progress table, decisions waiting on the owner
(none), the four-line handoff.
