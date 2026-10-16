# Plan 111: SDK 58 stable re-pin + the Babel 8 rider

| Field | Value |
| --- | --- |
| Brief | `ai/plans/SDK58-PROGRAMME.md` section 16 (facts A1 to A11), queue row 111 |
| Planned at | uat `c15b06eb` 2.0.854, 2026-10-16 (every anchor counted 1 at this sha) |
| Planned by | planning session 2026-10-16 |
| Needs first | nothing (row 18's standing policy; her go given this session) |
| Parent | none |
| Group | none (rows 116 to 123 hold no code; the three version files serialize under the version lock) |
| Batch budget | 5 weight units |
| Session budget | 11 weight units |
| Steps count | 5 (steps/1 to steps/5) |
| Device | OnePlus 3T (release + alarm gates), iPhone XS (owner-ordered deep-dive loop) || Owner decisions still needed | none open; D111.1 to D111.11 taken |

## 1. Goal

Today the app rides the preview lane: `expo ~58.0.6`, `react-native 0.88.0-rc.3`,
three patches at preview versions. SDK 58 stable is on npm: `expo 58.0.12` is
`latest` (newer than `next` at 58.0.11) and `react-native 0.88.0` is stable, 11
commits past the installed rc.3. When this ticket is DONE the app sits on the
stable pin set, all three patches are rebuilt against their stable packages and
proven on phones, `yarn validate` and `yarn test:tz` pass, the 3T release build
and its alarm gates hold, the iPhone XS deep-dive loop finds nothing broken, the
Babel 8 rider is re-measured and recorded (still blocked), and the store-release
path reopens. The owner notices: nothing changes in behaviour, and the app ships
again.

Owner rules that apply:

- Row 18's ride-`next` policy: repin to the newest `expo` at every attempt,
  release candidates included; fix breaks in the code, never pin back; a package
  broken upstream at its latest rolls back alone (A1).
- Her order this session: the iPhone XS joins the loop, deep device testing,
  whatever build it needs, notifications and background schedules named, full
  confidence nothing broke (D111.2, D111.5).
- Already ruled at past re-pins, do not re-litigate: no SwiftPM (CocoaPods
  stays), no Live Activities. The "no threadIdentifier" ruling is superseded by
  her row 120 order; nothing in THIS ticket sets threadIdentifier.

## 2. Decisions

### 2.1 Taken

- D111.1 (owner, 2026-10-16): ticket 111 runs now.
- D111.2 (owner, 2026-10-16): the verification loop gains an iPhone XS leg;
  notifications firing, background schedules and the rest are deep-checked on
  glass, iteratively, to full confidence.
- D111.3 (owner, 2026-10-16): row 116 (iPhone Duo) created, NOT PLANNED.
- D111.4 (planner, 2026-10-16): `expo-hinge` and every other new SDK 58 package
  install in row 116's planning. This ticket moves existing pins only.
- D111.5 (owner, 2026-10-16): the XS loop runs on a Release-configuration build
  with the real API first; a Metro dev build joins only to debug a defect.
- D111.6 (owner, 2026-10-16): the widgets patch's device-locale hunk stays
  local; no upstream PR now; the upstreaming question moves to row 117.
- D111.7 (owner, 2026-10-16): claim `enableRemoteNotifications: false` in the
  app.json `expo-notifications` plugin entry (iOS plugin option, default `true`,
  registers APNs; this app is local-only).
- D111.8 (owner, 2026-10-16): rows 117 (widgets and languages, inventory
  first), 118 (variable fonts), 119 (@expo/agent-cli) created, NOT PLANNED.
- D111.9 (planner, 2026-10-16, policy): the non-SDK freshness drift batches
  behind the re-pin, one commit per package: jotai 3.0.1, pino 10.4.0,
  pino-pretty 13.2.0, @biomejs/biome 2.5.15, @testing-library/react-native
  14.1.0. jest stays on its caret range ahead of Expo's pins on purpose.
- D111.10 (owner, 2026-10-16): rows 120 (iOS Notification Center grouping),
  121 (expo-location/next), 122 (AVD/adb management), 123 (Android widget
  refresh on OEMs) created, NOT PLANNED.
- D111.11 (owner, 2026-10-16, changelog walk): the metro-config env-in-cache
  change is re-verified at the 3T build step and the e2e README gotcha updated
  if healed; log-box and expo-updates items take no row; the @expo/ui
  `strokeBorder` `color` to `content` rename rides this re-pin
  (`widgets/PrayerWidget.tsx:811`, the only deprecated call site in the repo);
  the iOS widget's live ticking timer stays system-formatted (her read
  confirmed, row 69's ground).

### 2.2 The executor must not decide

- A patch hunk that will not apply on the stable package beyond the two named
  rejected files (expo-location `expo-module.config.json`, expo-widgets
  `ExpoWidgetEmittableTree.kt`): STOP and report the rejected hunk verbatim.
- A release-build failure naming `compileSdk` in `modules/qiblaheading`,
  `modules/tls13` or `modules/widgetrefresh`: STOP and report the exact
  `checkReleaseAarMetadata` error.
- Any new peer warning naming a package this plan does not move, any new R8
  stripping symptom on the 3T (a keep rule would edit app.json, ask-first), any
  iOS signing failure on the XS build: STOP and ask, with the exact output.
- npm drift: if `npm view expo dist-tags` or `npm view react-native dist-tags`
  moved past the versions in section 4 at any step's start, STOP and report;
  that is a NEEDS REPLAN, never an improvised re-measure.

## 3. Pre-flight

`scripts/preflight-111.sh` (in this folder). The executor saves a copy to
`$TMPDIR` and runs it from there against `uat`. It checks the checkout, a clean
tree, `origin/uat` merged in, the version at or past 2.0.854, no other ticket
IN PROGRESS or EXECUTED, every anchor count equal to 1, and the npm dist-tags
against section 4's table. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

Measured, not estimated: every number below came from the scratch worktree
re-pin at `$HOME/athan-gitree/worktrees/plan-111` (detached at `810010eb`),
2026-10-16. The full suite ran on the stable set: tsc 0 errors, jest 5681
passed with the only failures being the patch-assertion suite against the two
pristine packages (6 tests, `shared/__tests__/widgetOpenAppPatch.test.ts`) plus
one transient worker SIGSEGV (see the symptom table). The blast radius of the
re-pin itself is empty; the work is the patches and the proofs.

### 4.1 The stable pin set (the target)

`expo@58.0.12` `bundledNativeModules.json` plus peer ranges. Move every line;
`yarn install` resolves the graph.

| Package | Today | Stable pin |
| --- | --- | --- |
| expo | ~58.0.6 | ~58.0.12 |
| react-native | 0.88.0-rc.3 | 0.88.0 |
| @react-native/jest-preset, @react-native/metro-config | 0.88.0-rc.3 | 0.88.0 |
| @expo/log-box | ~58.0.11 | ~58.0.12 (expo-router@58.0.21 peer, A4) |
| @expo/metro-runtime | ~58.0.13 | ~58.0.14 |
| @expo/ui | 58.0.14 | 58.0.19 (A3; exact per `ai/AGENTS.md`) |
| expo-asset | ~58.0.13 | ~58.0.16 |
| expo-audio | ~58.0.7 | ~58.0.9 |
| expo-background-task | ~58.0.10 | ~58.0.11 (patch rebuild) |
| expo-constants | ~58.0.10 | ~58.0.12 |
| expo-dev-client | ~58.0.11 | ~58.0.13 |
| expo-font | ~58.0.7 | ~58.0.8 |
| expo-haptics | ~58.0.5 | ~58.0.6 |
| jest-expo | ~58.0.8 | ~58.0.11 |
| expo-linking | ~58.0.11 | ~58.0.13 |
| expo-localization | 58.0.4 | ~58.0.4 |
| expo-location | 58.0.12 | ~58.0.16 (patch rebuild) |
| expo-notifications | ~58.1.1 | ~58.1.4 |
| expo-router | ~58.0.16 | ~58.0.21 |
| expo-splash-screen | ~58.0.6 | ~58.0.9 |
| expo-system-ui | ~58.0.5 | ~58.0.6 |
| expo-task-manager | ~58.0.11 | ~58.0.12 |
| expo-updates | ~58.0.15 | ~58.0.17 |
| expo-widgets | 58.0.14 | 58.0.19 (patch rebuild; exact per `ai/AGENTS.md`) |
| react-native-gesture-handler | ~3.2.1 | ~3.3.0 |
| react-native-pager-view | 9.0.4 | 9.0.7 |
| react-native-reanimated | 4.7.0 | 4.7.1 (with worklets, A5) |
| react-native-screens | ~4.28.0 | ~4.30.0 (also the expo-router peer) |
| react-native-safe-area-context | ~5.9.1 | ~5.10.1 |
| react-native-svg | 15.15.5 | 15.16.0 |

Unchanged: react and react-dom 19.3.0, react-native-worklets 0.13.0,
@expo/dom-webview ~58.0.2, expo-build-properties ~58.0.10, expo-linear-gradient
~58.0.3, expo-in-app-updates 0.12.0 (latest on npm, peer `*`, never patch it,
A3). Zero peer warnings appeared in the measured install.

### 4.2 The three patches (A6 rebuild, each phone-proven)

All PRs re-checked open 2026-10-16. Measured apply status on the stable
packages:

| Patch | From | To | Apply status measured | Upstream |
| --- | --- | --- | --- | --- |
| expo-background-task | 58.0.10 | 58.0.11 | applies whole, warning only | #50581 open |
| expo-location | 58.0.12 | 58.0.16 | ONLY `expo-module.config.json` rejects; `LocationModule.kt` and `DeviceHeadingStreamer.swift` hunks apply clean | #51291 open |
| expo-widgets | 58.0.14 | 58.0.19 | ONLY `ExpoWidgetEmittableTree.kt` rejects; the other four files apply clean | #51292 open, plus the local-only locale hunk (D111.6) |

The rejected files reject because upstream reformatted `expo-module.config.json`
(platforms arrays) and evolved the converter around the `toPeekButton` region.
The hand-merge is bounded to those two files. `openApp`'s TypeScript surface is
app-owned (`widgets/PrayerWidget.tsx:350`), which is why tsc passed with the
widgets package pristine. Patch semantics per A7: after the rebuild,
`patch-package` must print three ✔ and nothing else on a clean install.

### 4.3 The Babel 8 rider: still blocked upstream

`@babel/core` 8.0.7 is `latest` on npm. `babel-preset-expo@58.0.16` depends on
36 Babel 7 plugins (`@babel/preset-typescript ^7.23.0` among them) and
`@react-native/babel-preset@0.88.0` depends on `@babel/core ^7.25.2`. A Babel 7
plugin under Babel 8 throws `BABEL_VERSION_UNSUPPORTED` (A2). The four
`@babel/*` devDependencies stay at `^7.29.x`; step 5 records the re-measurement
and the row 18 policy carries to the next re-pin.

### 4.4 Changelog items that touch us (full notes read 2026-10-16)

- iOS 27 scene life cycle: `ios/` is gitignored and prebuild regenerates it
  (SceneDelegate.swift already generated in the working tree); Expo forwards
  delegate events; the repo has no AppDelegate override. Verified at the XS
  build.
- R8 in release builds: absorbed. `app.json` carries device-verified keep rules
  (androidx.work, androidx.glance, kolibri, expo modules v2, haptics,
  application). The 3T release build is the re-verify.
- RN Strict TypeScript API and the removed APIs: absorbed at rc.2/rc.3 (tsc
  green; the repo's only reference is a comment naming the replacement).
- `alarmClock` delivery: in use (`shared/notifications.ts:103`).
- Fingerprint `balanced` default, prebuilt `expo-modules-core` Android
  libraries, faster Expo module calls: free wins, no action.
- Expo Router navigation-core rework: no `expo-router/react-navigation` import,
  no custom navigator; tsc and the suite hold it.
- @expo/ui deprecations: one call site, D111.11's rename. `backgroundOverlay`,
  `List.ForEach`, TimePicker colour names: unused. Recycling lists: no `List`
  usage anywhere.
- @expo/metro-config env vars in the transform cache: re-verify at the 3T
  build; update the e2e README gotcha if healed (D111.11).
- `expo-location/next`: exists at 58.0.16 with `headingAccuracy` in its Position
  type; not adopted here (row 121).
- NODE_ENV forced by command: the build scripts carry their own env; the 3T and
  XS builds re-verify.
- expo-notifications `enableRemoteNotifications` (iOS plugin option, default
  `true`, registers APNs): claimed false, D111.7. Verified in the installed
  `plugin/build/withNotificationsIOS.js:45`.

### 4.5 The version files and the lock

Every commit bumps `app.json` first, then `package.json`, then
`android/app/build.gradle` `versionName`, or
`shared/__tests__/versionLockstep.test.ts` fails. Fetch `origin` before taking
a number. The pre-commit hook runs lint-staged, `yarn validate` and the
coverage gate: 3 to 4 minutes per commit, and the tree must be green through
it, which is why step 1 is one commit for the whole pin set.

### 4.6 The XS deep-dive loop's ground

The XS is the owner's phone (`IPHONE_UDID`), connected. The generated ios
project signs automatically with the owner's team (`TEAM_ID`). A
Release-configuration build installs on it through development signing. The
loop's build command mirrors the Android prod env: `EXPO_PUBLIC_ENV=prod` with
the API key read per the EAS read-only rule. `xcodebuildmcp` builds and
launches; `agent-device` drives taps; log capture through xcodebuildmcp. The
e2e README's rules bind: a screenshot reaches a screen, it never proves what is
on one; every records claim needs a log line or a dump.

## 5. Design

The re-pin lands as one commit because the measurement proved the whole set
green together (tsc 0 errors; only the patch-assertion suite red, which the
rebuild itself greens). The A5 three-commit split is the named fallback if the
hook fails on the single commit: SDK packages with the rebuilt patches first,
then React and React Native with the two `@react-native/*` dev tools, then
Reanimated with worklets. The invariant a test can check: after the merge,
`patch-package` on a clean install prints exactly three ✔ and `yarn validate`
passes with coverage at 100 on all four measures.

Alternatives rejected: staging each package on its own branch (yarn.lock is one
graph; the queue's one-package rule governs the freshness batch, not the SDK
set, which rows 6 and 26 landed as one commit each); skipping the XS loop
(her order); taking `next` 58.0.11 (older than `latest`, A1).

Concurrency: no other ticket holds code; rows 116 to 123 are NOT PLANNED. The
version lock serializes every commit. No jest run overlaps another full jest
run (the SIGSEGV lesson, symptom table).

**Acceptance criteria:**

- [R1.1] WHEN `node -e "console.log(require('expo/package.json').version)"` runs on the merged re-pin commit THE SYSTEM SHALL print `58.0.12`
- [R1.2] WHEN `node -e "console.log(require('react-native/package.json').version)"` runs on the merged re-pin commit THE SYSTEM SHALL print `0.88.0`
- [R1.3] WHEN a clean install runs (`rm -rf node_modules/expo-background-task node_modules/expo-location node_modules/expo-widgets && yarn install --force`) THE SYSTEM SHALL print one ✔ per patch and no `error` or version-mismatch `warning` from patch-package
- [R1.4] WHEN `yarn validate` runs on the re-pin commit THE SYSTEM SHALL pass tsc, Biome and Jest with 100 percent on statements, branches, functions and lines
- [R1.5] WHEN `yarn test:tz` runs on the re-pin commit THE SYSTEM SHALL pass in all four timezones
- [R1.6] WHEN the app.json `expo-notifications` plugin entry is read THE SYSTEM SHALL carry `"enableRemoteNotifications": false`
- [R1.7] WHEN `widgets/PrayerWidget.tsx` is read THE SYSTEM SHALL pass `strokeBorder` a `content` parameter and no `color` parameter
- [R2.1] WHEN the freshness commits are merged THE SYSTEM SHALL resolve jotai at 3.0.1, pino at 10.4.0, pino-pretty at 13.2.0, @biomejs/biome at 2.5.15 and @testing-library/react-native at 14.1.0
- [R3.1] WHEN `build-prod.zsh` completes on the re-pin commit THE SYSTEM SHALL print `BUILD-PROD OK`
- [R3.2] WHEN `yarn check:device 3T_SERIAL` reads the 3T after install THE SYSTEM SHALL list every channel and every armed alarm at prayer times beside the known unexplained alarm at `when 2104803640505`
- [R3.3] WHEN `dumpsys alarm` reads one armed athan on the 3T THE SYSTEM SHALL show `window=0 flags=0x3` with an `Alarm clock:` sub-block
- [R3.4] WHEN the widget runtime load suite runs against the 3T build THE SYSTEM SHALL load every widget module without error
- [R4.1] WHEN the Release-configuration build installs on the XS and cold-launches THE SYSTEM SHALL reach the schedule with no crash
- [R4.2] WHEN a real athan moment passes on the XS THE SYSTEM SHALL deliver its notification with sound and time-sensitive interruption
- [R4.3] WHEN the compass sheet opens on the XS THE SYSTEM SHALL stream heading readings without a filter floor
- [R4.4] WHEN the language switches to Arabic and back on the XS THE SYSTEM SHALL relaunch and render the target locale from frame one
- [R4.5] WHEN a background refresh completes on the XS THE SYSTEM SHALL stamp the notification schedule gate
- [R4.6] WHEN the home-screen and lock-screen widgets render on the XS THE SYSTEM SHALL show current data for the day
- [R4.7] WHEN a reminder and its athan both fire on the XS THE SYSTEM SHALL deliver the reminder before the athan, never after
- [R4.8] WHEN one midnight boundary passes with the app running on the XS THE SYSTEM SHALL roll the list and move the countdown to the next day's first prayer
- [R5.1] WHEN `README.md`, `ai/UPSTREAM-PRS.md` and `ai/plans/SDK58-PROGRAMME.md` are read after the bookkeeping commit THE SYSTEM SHALL carry the stable stack line, the two-hunk widgets patch record, and the Babel 8 re-measurement

## 6. Steps

Checklist (each step is its own file under `steps/`):

1. `steps/1-repin.md` — the stable re-pin commit: pins, three patch rebuilds,
   the strokeBorder rename, enableRemoteNotifications false. Requirements
   R1.1 to R1.7. Weight 2.
2. `steps/2-freshness.md` — the five non-SDK bumps, one commit each.
   Requirements R2.1. Weight 2.
3. `steps/3-3t-gates.md` — the 3T release build, alarm and widget gates, the
   metro env re-verify. Requirements R3.1 to R3.4. Weight 3.
4. `steps/4-xs-loop.md` — the owner-ordered iPhone XS deep-dive loop.
   Requirements R4.1 to R4.8. Weight 3.
5. `steps/5-bookkeeping.md` — records, stack tables, programme refresh, queue
   cell. Requirements R5.1. Weight 1.

## 7. Device proof

In `steps/3-3t-gates.md` and `steps/4-xs-loop.md`: the build commands, the
per-check commands with expected readings, and where each capture is saved
(`~/athan-gitree/sessions/111/`). `dumpsys alarm` is read before any clock
change, and no clock change is planned on either phone.

## 8. Records

- `LOG.md`: every step opens `### Step <NN> — <state>` and ends with a
  `session: <ses_id>` line.
- The DONE cell (the lead applies on DONE): `DONE 2026-10-XX, audited: the
  stable pin set landed (expo 58.0.12, RN 0.88.0) with all three patches
  rebuilt and phone-proven, enableRemoteNotifications false claimed, the
  strokeBorder rename ridden, the freshness batch landed, the 3T gates and the
  owner-ordered XS deep-dive loop green, Babel 8 re-measured blocked upstream,
  the store path reopened; rows 116 to 123 were created by her order at
  planning`.
- The docs commit message at planning merge: `2.0.XXX - docs(plans): ticket 111
  READY (SDK 58 stable re-pin plan, grilled and gated)`.

## 9. Push

None. The executor worker never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| patch-package prints an error or version-mismatch warning after the rebuild | a hunk list changed beyond section 4.2's two files | STOP, report the rejected hunk verbatim; NEEDS REPLAN |
| `checkReleaseAarMetadata` names compileSdk in a local module | expo-modules-core 58.0.20 raised the expected compileSdk past 37 | STOP, report the error; the three modules' build.gradle files are shared ground |
| A jest worker dies SIGSEGV during a full run | two full jest runs overlapped (measured 2026-10-16: the worktree suite beside the main repo's pre-commit hook; isolated rerun 19/19 green) | rerun the one suite in isolation; green means transient, record it; never run two full suites at once |
| 3T release build loses a module at runtime (NoSuchMethodError, silent haptics) | R8 stripping a new reflection path | STOP and ask; a keep rule edits app.json, ask-first |
| The XS build fails signing | certificate or team drift on the owner's machine | STOP and ask, with the xcodebuild error |
| Metro env-blindness at the 3T build (stale EXPO_PUBLIC_* in the bundle) | the pre-58 behaviour the changelog says is fixed | clear the metro cache and the generated bundle per the e2e README, then re-verify and record whether the gotcha healed |
| A widget stays on its loading layout after install | the widget patch ran unpatched (A7) | verify the patch-package ✔ lines, reinstall, reprove |

Anticipated review fixes, word for word:

- "The plan's jest numbers cite the worktree run at 810010eb; the re-pin
  commit's own validate output is the number the ledger records."
- "Step 4's checks name the XS by placeholder; the executor substitutes the
  connected device's UDID and never writes it down."

Per-step restore lists sit in each step file.

## 11. Subagents

Planning: `explore` for bounded facts, `athan-plan-griller` for the grill.
Delivery: the lead dispatches `athan-executor` and `athan-reviewer`; a worker
that cannot see an image calls `vision`.

## 12. Report to the owner

Plain sentences: the stable re-pin landed with the patches rebuilt and proven
on both phones; what the XS loop checked and what it found; the Babel 8 rider
still blocked upstream; the freshness batch; the rows created at planning. The
progress table, decisions waiting on the owner (none), the four-line handoff.
