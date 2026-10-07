# SDK 58 adoption programme (owner rulings, 2026-09-18)

Briefs for queue rows 12 through 18 and the deferred owner features. The queue table in
`ai/plans/README.md` is the authority for order and status. Facts carry their source. DONE and
CANCELLED sections here are compressed records; the full narratives live in git history under the
`ai/plans/NN-*/` folders this file names, each with the commit that still reaches it (the
2026-10-07 clean deleted most of them — `23-sdk58-preview7` and `28-d3-rolling-buffer` among them;
`27`, `39`, `50` and `54` stand).

## Programme rules (owner rulings, 2026-09-18)

1. **Bleeding edge on purpose.** `uat-2` moves to the SDK 58 beta now and rides it. No store or
   production release until row 18 (stable re-pin) is DONE and RN 0.88 is out of release
   candidate. Full release notes land only at stable (~Oct 7 to 14).
2. **`experiment/alarmclock-backport` is kept**, frozen on SDK 57 at the 1.24.10 era, as the
   known-good backup. Nothing deletes it. Deletion day (B9) was cancelled by owner ruling. FACTUAL
   NOTE, 2026-10-07: the branch no longer exists in local refs or on origin; its last tips are
   reflog-only (`ef33661b`, `c9614692`). Restoring it is the owner's call.
3. **Moonsighting (session 11) is deferred until further notice**, absolute last, after the SDK 58
   programme and the deferred owner features at the bottom of this file.
4. **Verify against real sources, always.** Every session confirms APIs via docs-mcp (resolve the
   exact version from the npm registry first) and opensrc for package source. The changelog
   under-specifies.
5. **Full gates every session**: `yarn validate`, `yarn test:tz`, e2e/device checks where relevant
   (`yarn check:device`, `e2e/flows`).
6. **All dependencies move to latest compatible versions at an upgrade row**, expo-managed and
   third-party, every package named explicitly. Never `npx expo install --fix`.
7. **Foreground show-by-default is wanted** (owner ruling). Our handler
   (`hooks/useNotification.ts:11-18`) returns sound, badge, banner and list all true, matching
   SDK 58's built-in default handler (PR #49072); the flip is a no-op for us by construction.
   Verified on device in row 12.
8. **R8 stays on** (new default) for smaller, faster-starting release builds. ANSWERED: the first
   3T release build was clean, so no opt-out was ever needed (none exists in `app.json`; it would
   have been `enableMinifyInReleaseBuilds: false`).
9. **Not adopted**: `threadIdentifier` grouping (visual change), SwiftPM (CocoaPods stays the
   default supported path), the Noxcturnal transformer (experimental, needs a Babel-free setup),
   the `backgroundOverlay` migration (unused), `disableAutoLaunch` (documented beside `disableFab`
   in `ai/AGENTS.md`; row 13).
10. **Adopted beyond the upgrade**: `delivery: 'alarmClock'` (row 12; constant at
    `shared/notifications.ts:101`, used at `device/notifications.ts:124` and `:242`), and the
    Android notification large icon (adopted row 12, reverted 1.27.231 the same day: owner
    rejected the shade proof).

## 12. SDK 58 beta upgrade + alarmClock (DONE, `a2498afa`)

**Goal.** `uat-2` runs the SDK 58 beta with `delivery: 'alarmClock'` adopted and everything else
behaviorally identical, verified on the 3T.

**What shipped and still anchors the code.** `delivery: 'alarmClock'` in both trigger literals
(`device/notifications.ts:124` at-time, `:242` reminder). Permissions were already present
(`app.json` `USE_EXACT_ALARM:39`, `SCHEDULE_EXACT_ALARM:40`); no permission work was needed. The
`InteractionManager` migration and the test deep-import fix landed with the row. How to read an
alarm-clock arm on each phone is R18-4 in section 16.

## 13. Agent tooling (DONE, `423e2db1`)

`@expo/agent-cli` adopted via npx; its guidance lives in `ai/AGENTS.md` (that file says to revisit
it at the SDK 58 stable re-pin). `disableFab=1` documented and adopted into the workflow;
`disableAutoLaunch` documented beside `disableFab` with the dev-launcher flags (`ai/AGENTS.md`,
`ai/features/agent-tooling/FINDINGS.md`); the workflow's launch examples carry both. The Device Hub
location and screen-share caveat: `ai/AGENTS.md` §6. Zero app-code changes.

## 14. Expo Modules 2.0 spike on modules/tls13 (CANCELLED by the owner, 2026-09-18; never re-queued)

Ruling: skip it, not wanted, cancelled outright — not deferred. Basis: in `expo-modules-core`
58.0.3 the 2.0 API exists only as Swift macros, no Kotlin authoring API exists anywhere in the
installed tree, and `modules/tls13` declares Android only, so there is no Swift side to migrate
and nothing on the Kotlin side to migrate to. The module stays on the 1.0 DSL indefinitely. The
3T verification the row wanted (release build, real data, cold launch, TLS fetch on Android 9) had
already run in row 12.

## 15. Android home-screen widgets (DONE, `0ec4fe70`), with the timeline horizon row

Android widgets shipped on the new `expo-widgets` Android implementation, reusing the pure builder
`shared/widgetTimeline.ts` and the IO layer `stores/widget.ts`. The horizon row that followed
(17) carried the owner's ruling that the user should never need to open the app; it shipped at
`TIMELINE_DAYS = 3` (`shared/widgetTimeline.ts:76`), bounded by the payload guard, rather than the
14-to-30-day arithmetic first sketched.

## 23. SDK 58 preview.7 + RN 0.88.0-rc.2 (DONE 2026-09-26, 1.28.34 to 1.28.45, `430fbfd6`)

Owner instruction, 2026-09-26: ride the beta to its latest preview regardless of whether the
pieces are released candidates. Full record in git history under `ai/plans/23-sdk58-preview7/`
(reachable at `7d818d8c`). The durable findings, all still true:

- **The widget-blanking root cause was neither the SDK, React, RN nor Reanimated**: `@expo/ui`
  58.0.7 calls `React.memo` at MODULE scope and `expo-widgets`' react-stub exports only five
  names, so the widget bundle dies at LOAD. iOS had broken one version earlier, at 58.0.6.
- **Both packages are pinned to exact `58.0.5` and move together** (`package.json:36`, `:59`):
  pinning `@expo/ui` alone installs a NESTED 58.0.7 that yarn never prunes.
- A missing-name guard is the wrong tool; only a LOADED bundle catches a module-scope call.
  `shared/__tests__/widgetRuntimeLoads.test.ts` builds and evaluates the real runtime bundle on
  both platforms.

## 16. SDK 58 stable re-pin (NOT PLANNED; blocked until SDK 58 stable is on npm)

**Trigger.** The `latest` dist-tag moves to 58 stable, RN 0.88 is stable, the root `CHANGELOG.md`
merges, the release blog post lands. Expected ~Oct 7 to 14. This row may jump the queue the day it
triggers. Its second job is Babel 8.

**Babel 8 rider (added to this row by session 21).** `@babel/core` 8.0.6 and its three plugins
cannot move while `babel-preset-expo@58.0.4` depends on 36 Babel 7 plugins and
`@react-native/babel-preset` pins `@babel/core ^7.25.2`; a Babel 7 plugin under Babel 8 throws
`BABEL_VERSION_UNSUPPORTED`. Bump the four together when the SDK presets move (the four `@babel`
packages sit at `^7.29.x` in `package.json:79-82`).

**Scope.**

1. `npx expo install --check` against `latest`; name and bump everything it reports.
2. Read the full release notes (standing owner instruction, 2026-09-16: the beta changelog is
   incomplete) and act on anything new that touches us.
3. Full regression: `yarn validate`, `yarn test:tz`, e2e, 3T release build, the dumpsys and
   punctuality gates one more time.
4. Reopen the store-release path (programme rule 1 ends here).
5. Bookkeeping: update `ai/AGENTS.md` (stack table, ahead-pins table); close the ISSUES #10/#17
   references that waited on #49687 adoption. The old note about
   `ai/prompts/alarmclock-backport.md` is void: the file is deleted (git history) and the branch
   it guarded is gone (rule 2).

**Facts the re-pin needs (A1 to A11).** Recovered on 2026-10-07 from the pre-clean review of the
deleted session 21-24 records, after the plan folders went; every fact below was re-verified
against the working tree the same day and cites its own still-standing proof.

- **A1 — The owner's upgrade policy, two parts (ruling).** (1) Take the absolute latest and fix
  breaks in the code; never pin back or edit a test to pass. (2) A package broken upstream at its
  latest rolls back alone, one version at a time, to an exact pin with no local workaround, until
  a newer one ships.
- **A2 — The Babel 8 blocker.** Stated above; it is this row's second job.
- **A3 — Four packages differ from Expo's pin set on purpose** (installed
  `expo@58.0.0-preview.7`): `react-native` 0.88.0-rc.2 against the rc.1 pin (the owner takes the
  latest release candidate), `@expo/ui` and `expo-widgets` exact `58.0.5` against `~58.0.7`,
  `expo-location` exact `58.0.9` against `~58.0.7` (`package.json:36`, `:52`, `:59`, `:62-64`).
- **A4 — `@expo/log-box` is invisible to Expo checks.** It is not in `bundledNativeModules.json`,
  so no Expo check reports it. It sits at `~58.0.5` (`package.json:34`) because `expo-router` and
  `@expo/metro-runtime` both declare the peer range `^58.0.5`; move it by that peer range.
- **A5 — The commit order that kept the tree green.** One commit: the SDK packages, the rebuilt
  patches and the type fixes the bump forces (the pre-commit hook runs `tsc`). Then React,
  `react-dom` and React Native with the two `@react-native/*` dev tools. Then Reanimated with
  worklets.
- **A6 — Rebuilding a patch.** `git apply --check` the old patch on the fresh package; apply it,
  or make a rejected hunk's change by hand; `npx patch-package <name>`; delete the old file; then
  delete the package folder and `yarn install --force` to prove a clean install. All three patches
  are rebuilt at this row (`ai/plans/54-patches-and-copy/FINDINGS.md`, section 1).
- **A7 — patch-package log semantics.** After a version bump the install still succeeds whatever
  the patches did: a `warning` in its log means the old patch still applied; an `error` means that
  package is running UNPATCHED. (`shared/__tests__/widgetOpenAppPatch.test.ts:24` words it
  "silently skips"; the installed source applies a patch when it still fits and warns. Both
  readings end the same way for a patch that no longer fits.)
- **A8 — An ESM-only dependency is transformed to CommonJS in BOTH Jest projects;
  `--experimental-vm-modules` is rejected.** Jest 30's `require(esm)` is also gated on
  `canResolveSync()`, which the components project fails for its custom resolver, so the flag
  gated on `canResolveSync()` (`jest-runtime`), which the components project fails for its custom
  resolver (`jest.config.js:62`), so the flag repairs the unit project only; the CommonJS transform
  both projects share is `jest.config.js:20`.
- **A9 — Reanimated 4.7.0 ships the new layout-animation engine as the default.** The legacy proxy
  flag `USE_LEGACY_LAYOUT_ANIMATIONS_PROXY` is `false` in the installed tree
  (`node_modules/react-native-reanimated/src/featureFlags/staticFlags.json`) and no override is
  set anywhere in the repo. Draw sites that ride it: `components/modals/Modal.tsx:81` and `:90`,
  `components/modals/Help.tsx:75`, `components/sheets/screens/Qibla.tsx:61`.
- **A10 — After the install, diff the pin set and read every peer warning.** Session 23 measured
  26 packages and installed 25; `react-native-screens` surfaced only as an `expo-router` peer
  warning (`package.json:73`). One warning is expected: `jest-expo > jest-watch-typeahead@2.2.1`
  wants Jest 29.
- **A11 — In `widgets/PrayerWidget.tsx` a fixed `frame()` comes before a flexible one, and no test
  can see the order.** `@expo/ui` types `frame()` as two overloads that cannot be mixed, so each
  mixed call became two chained modifiers; reversed, the greedy frame takes the space first and
  the row changes size (`:657-658`, `:729`).

**Traps carried from the row 12 record (R18-1 to R18-5).** Recovered and re-verified the same day
as A1 to A11.

- **R18-1 — Packages that depend on each other move in the same wave.** Owner ruling, 2026-09-18.
- **R18-2 — Two groups must match exactly at every re-pin**: `react-dom` equals `react`, and
  `@react-native/metro-config` and `@react-native/jest-preset` equal `react-native`
  (`package.json:85-86`).
- **R18-3 — Three local Android modules hardcode `compileSdk 37`, and only a release build
  notices**: `modules/tls13/android/build.gradle:10`, `modules/qiblaheading/android/build.gradle:10`,
  `modules/widgetrefresh/android/build.gradle:10`; `checkReleaseAarMetadata` fails the release build only.
- **R18-4 — On the 3T the alarm-clock proof is a sub-block, never `flags=0x9`.** An alarm-clock
  arm reads `window=0 flags=0x3` with an `Alarm clock:` sub-block in the dumpsys output.
  `flags=0x9` is the windowed form shown by the 8T and the Find X8. This corrects the row 12
  proof script, which predicted `0x9` for the 3T: the 3T was exact, not windowed.
- **R18-5 — The owner accepts the system alarm icon that alarm-clock delivery can show, and no API
  hides it.** The 3T shows none.

**Also true at the re-pin.**

- Predictive back is opted out: `app.json` sets no `predictiveBackGestureEnabled`, and the manifest
  carries `android:enableOnBackInvokedCallback="false"`
  (`android/app/src/main/AndroidManifest.xml:23`). Re-read both before adopting it.
- `expo-in-app-updates` is pinned exactly `0.12.0` (`package.json:49`) and is not an SDK package
  (its peer range on expo is `*`); it compiles Kotlin against `expo-modules-core` symbols. Do not
  patch it.
- The balanced fingerprint question, ANSWERED: no `runtimeVersion` policy exists anywhere in
  `app.json`, so the default stands untouched.

**The three patches, and corrections to `ai/plans/54-patches-and-copy/FINDINGS.md` (read in full,
2026-10-07).** Each patch is rebuilt at this row (A6). Upstream, none of the three is fixed in the
newest published versions: `expo-background-task` 58.0.10, `expo-widgets` 58.0.14 and
`expo-location` 58.0.12 all still carry the defects. expo/expo#50581 (ours) is open and unreviewed
since 2026-09-24; the competing draft expo/expo#48469 has not moved since 2026-08-04.

- **The `expo-location` publication-block hunk IS load-bearing**, and any reading of the Android
  hunks as removable must respect it. Removing the `publication` block from the package's
  `expo-module.config.json` is what forces autolinking to compile the patched Kotlin from source;
  with the block present, autolinking resolves the prebuilt AAR and Gradle never compiles the
  patched Kotlin (`ai/plans/50-which-patch-fixed-it/MEASURED.md`, the publication-block consequences).
- The three Android sensor hunks are unreached on phones carrying Google's fused sensor
  (`hooks/useQibla.ts:249-253` calls `watchFusedHeading` and never `watchHeadingAsync` there), but
  no build without them was ever made, and the removal that was started was put back. A session
  that removes them must also move the guard: `scripts/verify-expo-location-patch.sh` and
  `shared/__tests__/expoLocationPatch.test.ts` assert the Android hunks are present, and the
  guard's last check (`android/local-maven-repo`) can never fire as written, because the package
  ships its prebuilt library at `local-maven-repo` in the package root.
- Row 51 context: a 5-to-50 Hz sensor-rate change is the weakest of the three upstream candidates
  and optional. The FOP as an npm package is deliberately NOT recommended. Corrections go upstream
  as PRs — there is no process to hand modules to Expo — and `ai/AGENTS.md` section 8 binds every
  post: anonymity absolute, no app name, repo link, device serial or secret.

## Deferred owner features (recorded 2026-09-18; sequenced after the SDK 58 programme, before moonsighting)

Each became a row only when the owner specced and scheduled it. Outcomes below; the queue rows are
the full record.

### D1. Notification sound through silent mode (DONE 1.28.58, `7b5e3a38`)

Owner goal: prayer sounds play at full volume even when the phone is silenced, with permission.
Outcome: the mute switch itself is unreachable on both platforms and the owner accepted that; five
real defects were fixed on the way. The record: `ai/plans/27-silent-mode-bypass/FINDINGS.md` (it
backs the answers `shared/help.ts` gives) and queue row 27. From the original sketch, the Android
part held: the app holds `ACCESS_NOTIFICATION_POLICY` (`app.json:42`) and a DND-access deep link
exists.

### D2. Qibla direction finder and D5. Location support (both DONE 2026-09-29, queue row 37)

Shipped together, on a coarse cached location. The compass is locked on both platforms: never an
unvouched heading; Android uses Google's fused sensor only; iPhone uses a 30-degree cone.

### D3. Rolling buffer, plus a second reminder (DONE 2026-09-27, 1.28.60 to 1.29.5, `0b4a1edc`)

Owner ruling on the UI, 2026-09-18: a Reminders master toggle, then Reminder 1, then Reminder 2,
Reminder 2 disabled until Reminder 1 is enabled. Outcome: the window is no longer counted in days
at all. Rows are armed whole, in time order, under the iOS 64-request ceiling, and the budget is
spent a whole ROW at a time; the next Fajr is always armed.
`shared/__tests__/constants.test.ts:306` computes the worst case from the code itself. The
day-count arithmetic that led to the ruling explains why the unit had to change but no longer
describes the code; it lives in git history under `ai/plans/28-d3-rolling-buffer/` (last touched
at `5a8a98d7`).

### D4. Localization for v2.0 (NOT PLANNED; queue rows 38 and 39)

Owner goal: the app goes global in v2.0 with a language switcher. Research lives in
`ai/plans/39-localisation/`. Rows 38 and 39 carry the owner's decisions of 2026-09-28 (a typed
English catalog and `t()`, no i18n library, no second language first; RTL is the real work).

### D6. Help: one modal answering "why did I not hear the athan?" (DONE 2026-09-27, `a3f8812c`)

Owner ruling: a modal, not the brief's second sheet. The shipped answers state plainly that no app
can play through the silent switch on either platform. The page cannot lie (every claim was
measured), and the app is never named in user copy (pinned by a test). The final visual treatment
is still OPEN; the candidate layouts and their component source are kept outside the repo, as
queue row 29 records.

## Answered: update prompt from the stores instead of releases.json (DONE, ISSUES #35, 1.29.30)

iOS reads iTunes Lookup; Android asks Play through `expo-in-app-updates`; a failed check retries
in an hour; `releases.json` is deleted. Queue rows 30 and 31 carry the record.

## Ruling log (changelog sweep, owner decisions 2026-09-18)

| Item | Ruling |
| --- | --- |
| iOS 27, scene life cycle, UIScreen.main | Care at upgrade, free (prebuild artifact, no custom AppDelegate) |
| requireFullScreen + orientation locks | Care; deferred risk, no iOS 27 runtime yet |
| Device Hub | In use by owner; CLI support rides the upgrade |
| iPhone Duo | No |
| `delivery: 'alarmClock'` | THE goal, row 12 |
| Foreground flip | Wanted; no-op for us (handler matches the new default); verified |
| iOS delegate forwarding | No |
| `threadIdentifier` | No grouping |
| `largeIcon` | Yes, adopt, row 12, asset from screenshots; reverted 1.27.231 the same day (owner rejected the shade proof) |
| Android widgets | Definitely; own row (15) |
| Live Activities | Not us, double-checked (our staleness is the deliberate terminal card) |
| @expo/ui spacing/Host changes | Care later; widgets flag is OFF so inert now |
| Router core rework | Care at upgrade, migration guide; no deep imports today |
| Router data loaders, native tabs | Low |
| Async web routes, web features | No |
| Prebuilt expo-modules-core | Free win |
| Faster module calls | Free |
| Expo Modules 2.0 | Cancelled, row 14 (owner, 2026-09-18): iOS-only in SDK 58, no Kotlin authoring API to migrate to; row never re-queued |
| SwiftPM | No, CocoaPods stays |
| Fingerprint balanced | Verify in row 12 — ANSWERED: no `runtimeVersion` policy anywhere, default untouched |
| R8 | Keep on, watch first release build — ANSWERED: clean, no opt-out added |
| Noxcturnal | No |
| NODE_ENV | Nothing to do |
| Proxy/tunnel fixes, tunnel v2 | No |
| AVD + adb rewrite | Rode the upgrade |
| `@expo/agent-cli` | Yes, row 13 |
| EAS Observe, PostHog | No |
| Strict TS, API removals | Care, migrations landed in row 12 |
| RN font variation, ArrayBuffer, DevTools | No |
| `disableFab` / `disableAutoLaunch` | Row 13; both documented and verified (`ai/AGENTS.md`), `disableFab` the workflow default |
| expo-audio, camera, file-system, image, secure-store, sqlite, location, font | camera, file-system, image, secure-store, sqlite, font not installed; expo-audio installed and in use; location answered by rows 37 and 51 |
| Deprecations (File.md5, AppMetrics, useLibSQL, backgroundOverlay) | No |
| Node floors, AGP 9 | Satisfied |
