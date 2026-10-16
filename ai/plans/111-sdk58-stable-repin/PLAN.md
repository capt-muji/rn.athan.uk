# Plan 111: SDK 58 stable re-pin + the Babel 8 rider

| Field | Value |
| --- | --- |
| Brief | `ai/plans/SDK58-PROGRAMME.md` section 16 (facts A1 to A11), queue row 111 |
| Planned at | (skeleton; anchors verified at READY) uat `1108844c` 2.0.851, 2026-10-16 |
| Planned by | planning session 2026-10-16 |
| Needs first | nothing (row 18's standing policy; her go given this session) |
| Parent | none |
| Group | none (no open ticket shares `package.json`, `patches/`, `ai/AGENTS.md`) |
| Batch budget | TBD at draft |
| Session budget | TBD at draft |
| Steps count | TBD at draft |
| Device | OnePlus 3T (release + gates), iPhone XS (owner-ordered deep-dive), simulator (widget face if needed) |
| Owner decisions still needed | interview round 1 open |

Resume from: section 4 fact pack is landing; next is the scratch-worktree re-pin
measurement, then interview round 1, then the draft.

## 1. Goal

Today the app rides the preview lane: `expo ~58.0.6`, `react-native 0.88.0-rc.3`,
three patches at preview versions. SDK 58 stable is on npm (`expo 58.0.12` latest,
`react-native 0.88.0` stable). When this ticket is DONE the app sits on the stable
pin set, every patch is rebuilt against its stable package and proven on a phone,
the full gates pass (`yarn validate`, `yarn test:tz`, e2e), the 3T release build
and its alarm gates hold, the iPhone XS deep-dive loop (owner order, below) finds
nothing broken, and the store-release path reopens. The owner notices: the app is
unchanged in behaviour and ships again.

Owner rules that apply:

- Row 18's ride-`next` policy, restated in her order: repin to the newest `expo`
  at every attempt, release candidates included; the Babel 8 rider is re-attempted
  at every re-pin (A1, A2).
- Her order this session: use the iPhone XS for a deep-dive device loop, create
  whatever build the loop needs, and prove nothing broke, notifications and
  background schedules named explicitly.
- Already ruled at past re-pins, do not re-litigate: no SwiftPM (CocoaPods stays),
  no threadIdentifier grouping, no Live Activities (programme section 16).

## 2. Decisions

### 2.1 Taken

- D111.1 (owner, 2026-10-16, this session): ticket 111 runs now. Her go supersedes
  the queue's "her go" waiting cell.
- D111.2 (owner, 2026-10-16, this session): the verification loop gains an iPhone
  XS leg. Deep-check notifications firing, background schedules, and the rest of
  the surface on the XS with whatever build the loop needs, iteratively, to full
  confidence. Recorded in `PLAN.md` this section and in the step list at draft.
- D111.3 (owner, 2026-10-16, this session): a separate iPhone Duo ticket is
  created now, unplanned, as queue row 116. Folded pose: one schedule. Open pose:
  both schedules, one per panel. Tested on the Duo simulator through Device Hub;
  no physical Duo device exists.
- D111.4 (planner, 2026-10-16): `expo-hinge` and every other new SDK 58 package
  install in row 116's planning, not here. This ticket moves existing pins only.
- D111.5 (owner, 2026-10-16, interview round 1): the XS deep-dive loop runs on a
  Release-configuration build with the real API first. A Metro dev build joins
  only if a defect needs live debugging.
- D111.6 (owner, 2026-10-16, interview round 1): the widgets patch's
  device-locale hunk stays local; no upstream PR now. `ai/UPSTREAM-PRS.md` is
  refreshed to record both hunks, and the upstreaming question moves to row 117's
  inventory.
- D111.7 (owner, 2026-10-16, interview round 2): claim
  `enableRemoteNotifications: false` in the `expo-notifications` app.json plugin
  entry. Verified from the installed 58.1.4 plugin source: iOS plugin option,
  default `true`, registers APNs; this app is local-only.
- D111.8 (owner, 2026-10-16, interview rounds 1 and 2): rows 117 (widgets and
  languages, inventory first), 118 (variable fonts, investigation first) and 119
  (@expo/agent-cli adoption) created by her order; all NOT PLANNED.
- D111.9 (planner, 2026-10-16, policy): the non-SDK freshness drift batches into
  this ticket after the SDK re-pin, one commit per package: jotai 3.0.1, pino
  10.4.0, pino-pretty 13.2.0, @biomejs/biome 2.5.15, @testing-library/react-native
  14.1.0. jest stays on its caret range ahead of Expo's pins on purpose.
- D111.10 (owner, 2026-10-16, round 3): rows 120 (iOS Notification Center
  grouping, threadIdentifier; supersedes the programme's no-threadIdentifier
  ruling) and 121 (expo-location/next evaluation, heavy compass testing) created
  by her order.

### 2.2 The executor must not decide

- A patch hunk that will not apply on the stable package: STOP and report the
  rejected hunk verbatim. Do not hand-edit a patch without the plan naming it.
- A release-build failure naming `compileSdk` in `modules/qiblaheading`,
  `modules/tls13` or `modules/widgetrefresh`: STOP and report the exact
  `checkReleaseAarMetadata` error. The three files are shared ground with the
  build scripts' prebuild order.
- Any new peer warning that names a package this plan does not move: STOP and
  report it. The plan records the expected warning set.

## 3. Pre-flight

To be written at draft (`scripts/preflight-111.sh`).

## 4. Background the executor needs

Fact pack verified 2026-10-16 against npm, GitHub and the working tree. Anchors
land at draft.

### The stable pin set (target)

`expo@58.0.12` is `latest` on npm; `next` is 58.0.11, so `latest` is the newer
lane and the policy's target. `react-native 0.88.0` is stable; rc.3 to 0.88.0 is
11 commits (release bumps, a Pressable disabled-reset fix, augmentable prop
types, AssetRegistry types), a small delta.

Moved against `package.json` today, from `expo@58.0.12` `bundledNativeModules.json`
plus peer ranges:

| Package | Today | Stable pin |
| --- | --- | --- |
| expo | ~58.0.6 | ~58.0.12 |
| react-native | 0.88.0-rc.3 | 0.88.0 |
| @react-native/jest-preset, @react-native/metro-config | 0.88.0-rc.3 | 0.88.0 |
| @expo/log-box | ~58.0.11 | ~58.0.12 (expo-router@58.0.21 peer, A4) |
| @expo/metro-runtime | ~58.0.13 | ~58.0.14 |
| @expo/ui | 58.0.14 | 58.0.19 (moves with the SDK, A3; exact per `ai/AGENTS.md`) |
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
| react-native-reanimated | 4.7.0 | 4.7.1 (moves with worklets, A5) |
| react-native-screens | ~4.28.0 | ~4.30.0 (also the expo-router peer) |
| react-native-safe-area-context | ~5.9.1 | ~5.10.1 |
| react-native-svg | 15.15.5 | 15.16.0 |

Unchanged: react and react-dom 19.3.0, react-native-worklets 0.13.0,
@expo/dom-webview ~58.0.2, expo-build-properties ~58.0.10, expo-linear-gradient
~58.0.3, expo-in-app-updates 0.12.0 (latest on npm, not an SDK package, do not
patch, A3). `expo-hinge`, `expo-device-hub`, `expo-app-intents` and every other
new SDK 58 package: D111.4, not this ticket.

### The three patches

All three stay: their upstream PRs were checked 2026-10-16 and every one is open
and unmerged on `expo/expo` main. Each is rebuilt per A6 and proven on a phone.

| Patch | Today | Rebuild against | Upstream (open) |
| --- | --- | --- | --- |
| expo-background-task | 58.0.10 | 58.0.11 | #50581 (network constraint configurable) |
| expo-location | 58.0.12 | 58.0.16 | #51291 (headingFilter, headingAccuracy) |
| expo-widgets | 58.0.14 | 58.0.19 | #51292 (openApp) plus a local-only hunk |

The widgets patch carries TWO features: the `openApp` Button hunk of #51292 and
the `__expoWidgetDeviceLocale` injection (row 39's widget-runtime locale patch)
through the Android C++/JNI runtime and the iOS runtime. `ai/UPSTREAM-PRS.md`
records only `openApp`; it is refreshed by this ticket. Whether the locale hunk
also goes upstream is an open interview question.

### The Babel 8 rider: still blocked upstream

`@babel/core` 8.0.7 is `latest` on npm, but `babel-preset-expo@58.0.16` still
depends on Babel 7 plugins (`@babel/preset-typescript ^7.23.0` among 36 others)
and `@react-native/babel-preset@0.88.0` depends on `@babel/core ^7.25.2`. A
Babel 7 plugin under Babel 8 throws `BABEL_VERSION_UNSUPPORTED` (A2). The rider
is re-verified blocked and recorded; the four `@babel/*` devDependencies stay at
`^7.29.x`.

### Changelog items that touch us (full notes read 2026-10-16)

- iOS 27 scene life cycle: prebuild generates `SceneDelegate.swift` and the
  manifest entry; `ios/` is gitignored and regenerated per build, and the working
  tree already carries `ios/Athan/SceneDelegate.swift`. Expo forwards delegate
  events; no repo-side AppDelegate override exists. No action beyond the build.
- `requireFullScreen` no longer opts out of resizing on iOS 27; `app.json` sets
  it `true`. Recorded for row 116, no change here (portrait iPhone app).
- R8 in release builds: already absorbed. `app.json` carries device-verified
  keep rules (androidx.work, androidx.glance, the kolibri runtime, expo modules
  v2, haptics, application) from the preview cycle.
- RN Strict TypeScript API default: absorbed at rc.2/rc.3 (tsc green today, no
  `customConditions`). Removed APIs (InteractionManager, Touchable root,
  NativeMethods, Modal animated, StatusBar props): no usage in the repo (one
  comment in `components/prayer/List.tsx:68` names the replacement only).
- `alarmClock` delivery: already used (`shared/notifications.ts:103`).
- Fingerprint `balanced` default and prebuilt `expo-modules-core` Android
  libraries: free wins, no action.
- Expo Router navigation-core rework (58.0.16 to 58.0.21): deterministic state,
  deferred dispatch, removed forked React Navigation surface. No
  `expo-router/react-navigation` import and no custom navigator in the repo;
  tsc and the suite hold the line.
- `@expo/ui` deprecations (`backgroundOverlay`, `List.ForEach` children,
  border color param): no usage in the repo (widget code uses neither).
- expo-notifications 58.1.x grew `enableRemoteNotifications` for local-only
  apps: candidate, pending exact-shape verification and an owner question.
- `expo-location/next` provider API: preview, not adopted; the classic API stays
  (the patch rides it).
- NODE_ENV is now forced by command (development for debug, production
  otherwise): the build scripts carry their own env; verified at the build step.

## 5. Design

To be drafted after the scratch measurement and the interview.

## 6. Steps

To be drafted. Shape: the A5 commit order (SDK packages and patch rebuilds with
the type fixes the bump forces, then React and React Native with the two
@react-native dev tools, then Reanimated with worklets), full gates, the 3T
release build and alarm gates, the XS deep-dive loop, bookkeeping
(`ai/AGENTS.md` stack table, `SDK58-PROGRAMME.md` section 16 refresh,
`ai/UPSTREAM-PRS.md` refresh).

## 7. Device proof

To be drafted: 3T release build, `dumpsys alarm` readings, punctuality gates;
the XS loop's build and checks.

## 8. Records

To be drafted.

## 9. Push

None. The executor worker never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

To be drafted with the symptom table.

## 11. Subagents

Planning: `explore` for bounded facts, `athan-plan-griller` for the grill.
Delivery: the lead dispatches `athan-executor` and `athan-reviewer`.

## 12. Report to the owner

To be drafted.
