# SDK 58 programme briefs

The queue table in `ai/plans/README.md` is the authority for order and status. This file keeps
only the briefs open rows still cite: section 16 (queue row 18) and D4 (queue rows 38 and 39).
DONE records live in git history.

## 16. SDK 58 stable re-pin + full release-notes review (DONE 2026-10-17, row 111; the ride-`next` policy carries on)

**Trigger.** The owner ruled 2026-10-09: ride the `next` tag and repin to the newest version every
time, release candidates included. SDK 58 hit `latest` 2026-10-16 and row 111 ran the re-pin.
The next attempt takes the newest `expo` at ITS start: `58.0.14` was already on npm at this
ticket's close (published after this attempt's step 1 pinned `58.0.13`, the newest at that
moment), so the next re-pin starts from 58.0.14 or newer.

**Landed set (2.0.908, merge `9dd4eb6a`).** `expo ~58.0.13` with its `bundledNativeModules`
delta (eight direct pins moved, two transitive followed), `react-native` 0.88.0. All three
patches regenerated whole at `expo-background-task+58.0.11`, `expo-location+58.0.17` and
`expo-widgets+58.0.20`, no hunk hand-merged; `didRegisterTaskForTesting` and `mLastAzimuth`
left the patches; the vacuous `local-maven-repo` check died; the guard suite
`shared/__tests__/backgroundTaskPatch.test.ts` pins the offline option on all three sides.
`expo-widgets@58.0.19` was broken upstream for Android (its source imports
`io.github.jakex7.peek.*` while its dependency packages `io.github.expo.peek.*`, 16 unresolved
references at `:expo-widgets:compileReleaseKotlin`); 58.0.20 fixes it, and that defect is why
the first attempt became a NEEDS REPLAN. Proven: `yarn validate` and `yarn test:tz` green at
100 percent, the 3T release build in 517 s with every channel, permission and armed-alert check
passing and the alarm-clock sub-block intact (41 future alerts), the armed production fire at
01:53:00.002 on the second (flags 0x3), and the XS loop green per the row 111 record (cold
start, compass at ~105 delegate calls a second, both language directions, BGTask re-submission,
two mock-build notification fires at their armed seconds with the TIME SENSITIVE level, the
live day-roll cascade). The store-release path is open again.

**Babel 8 rider, re-measured 2026-10-16, still blocked upstream.** `@babel/core` 8.0.7 is
latest; `babel-preset-expo@58.0.17` (the preset `expo@58.0.13` pairs with) depends on 36
`@babel/*` 7.x plugins (among them `@babel/preset-typescript ^7.23.0`,
`@babel/plugin-transform-modules-commonjs ^7.24.8`, `@babel/plugin-transform-react-jsx
^7.28.6`) and `@react-native/babel-preset@0.88.0` depends on `@babel/core ^7.25.2`. A Babel 7
plugin under Babel 8 throws `BABEL_VERSION_UNSUPPORTED`. The four `@babel/*` devDependencies
stay at `^7.29.x` and the rider is re-attempted at every re-pin.

**Scope.**

1. `npx expo install --check` against `latest`: name and bump everything it reports, never `--fix`.
2. Read the full release notes and act on anything new that touches us. Already ruled at past
   re-pins, do not re-litigate: no SwiftPM (CocoaPods stays), no Live Activities. The "no
   threadIdentifier" ruling is superseded by row 120's order.
3. Full regression: `yarn validate`, `yarn test:tz`, e2e, 3T release build, the dumpsys and
   punctuality gates.
4. Reopen the store-release path: nothing ships to a store or to production before the re-pin
   row is DONE.
5. Bookkeeping: the stack line in `README.md`, the patch rows in `ai/UPSTREAM-PRS.md`, this
   section. (The `ai/AGENTS.md` stack tables were deleted by the owner's compaction order at
   `b2096c4a` and stay gone.)

**Pin-set and build facts.**

- `react-dom` equals `react`, and `@react-native/metro-config` and `@react-native/jest-preset`
  equal `react-native`, at every re-pin.
- Three local Android modules hardcode `compileSdk 37`, and only a release build notices:
  `checkReleaseAarMetadata` fails the release build only.
- `expo-in-app-updates` is pinned exactly `0.12.0` and is not an SDK package (its peer range on
  expo is `*`); it compiles Kotlin against `expo-modules-core` symbols. Do not patch it.
- On the 3T the alarm-clock proof is a sub-block, never `flags=0x9`. An alarm-clock arm reads
  `window=0 flags=0x3` with an `Alarm clock:` sub-block. `flags=0x9` is the windowed form shown
  by the 8T and the Find X8.
- The SDK-57 known-good backup branch's last tips are reflog-only (`ef33661b`, `c9614692`).
  Restoring it is the owner's call.

**Facts the re-pin needs (A1 to A11).** Each cites proof that still stands in the working tree.

- **A1. Upgrade policy, two parts (owner ruling).** Take the absolute latest and fix breaks in
  the code, never pinning back or editing a test to pass. A package broken upstream at its
  latest rolls back alone, one version at a time, to an exact pin with no local workaround,
  until a newer one ships.
- **A2. The Babel 8 blocker** is the rider above. It is this row's second job.
- **A3. Deliberate divergences from Expo's pin set** (installed `expo@58.0.6`, riding the `next`
  tag on the owner's 2026-10-09 ruling):
  `react-native` 0.88.0-rc.3 against the stable pin (the owner takes the latest release
  candidate). `@expo/ui` and `expo-widgets` sit at `58.0.14`, no longer exact-pinned: the 58.0.5
  pin that protected the Android widget stub (row 26) broke iOS at dyld launch on this re-pin,
  because the 58.0.5 ExpoUI binary references a `_uiRuntime` symbol the new ExpoModulesCore no
  longer exports. Upstream closed the trap: the 58.0.14 stub exports `memo` as a passthrough,
  and the loaded-bundle suite is green. Durable lesson: `@expo/ui`'s iOS framework tracks
  ExpoModulesCore's Swift ABI, so the pair moves with the SDK, never against it.
- **A4. `@expo/log-box` is invisible to Expo checks**: it is not in `bundledNativeModules.json`,
  so no Expo check reports it. It sits at `~58.0.5` (`package.json:34`) on the `^58.0.5` peer
  range that `expo-router` and `@expo/metro-runtime` declare. Move it by that peer range.
- **A5. The commit order that kept the tree green.** One commit: the SDK packages, the rebuilt
  patches and the type fixes the bump forces (the pre-commit hook runs `tsc`). Then React,
  `react-dom` and React Native with the two `@react-native/*` dev tools. Then Reanimated with
  worklets.
- **A6. Rebuilding a patch.** `git apply --check` the old patch on the fresh package. Apply it,
  or make a rejected hunk's change by hand. Run `npx patch-package <name>` and delete the old
  file. Then delete the package folder and run `yarn install --force` to prove a clean install.
  All three patches are rebuilt at this row (`ai/plans/54-patches-and-copy/FINDINGS.md`,
  section 1), and each rebuild is proven on a phone, never by a green build alone. Removing the
  `publication` block from `expo-module.config.json` is what forces autolinking to compile the
  patched Kotlin from source: with the block present, autolinking resolves the prebuilt AAR and
  Gradle never compiles the patched code.
- **A7. patch-package log semantics.** After a version bump the install succeeds whatever the
  patches did. A `warning` means the old patch still applied. An `error` means that package
  runs UNPATCHED (`shared/__tests__/widgetOpenAppPatch.test.ts:24`).
- **A8. An ESM-only dependency is transformed to CommonJS in BOTH Jest projects, and
  `--experimental-vm-modules` is rejected.** Jest 30's `require(esm)` is gated on
  `canResolveSync()`, which the components project fails for its custom resolver
  (`jest.config.js:62`). The CommonJS transform both projects share is `jest.config.js:20`.
- **A9. Reanimated 4.7.0 ships the new layout-animation engine as the default.** The legacy
  proxy flag `USE_LEGACY_LAYOUT_ANIMATIONS_PROXY` is `false` in the installed tree
  (`node_modules/react-native-reanimated/src/featureFlags/staticFlags.json`) and no override
  is set anywhere in the repo. Draw sites that ride it: `components/modals/Modal.tsx:81` and
  `:90`, `components/modals/Help.tsx:75`, `components/sheets/screens/Qibla.tsx:61`.
- **A10. After the install, diff the pin set and read every peer warning.** Job 23 measured
  26 packages and installed 25. `react-native-screens` surfaced only as an `expo-router` peer
  warning (`package.json:73`). One warning is expected: `jest-expo > jest-watch-typeahead@2.2.1`
  wants Jest 29.
- **A11. In `widgets/PrayerWidget.tsx` a fixed `frame()` comes before a flexible one, and no test
  can see the order.** `@expo/ui` types `frame()` as two overloads that cannot be mixed, so
  each mixed call became two chained modifiers. Reversed, the greedy frame takes the space
  first and the row changes size (`:657-658`, `:729`).

- expo-notifications 58.1.0 grew `enableRemoteNotifications: false` for local-only
  apps: a candidate for the next app.json pass, still unclaimed at 1.29.321.

## D4. Localization for v2.0 (NOT PLANNED, carried by queue rows 38 and 39)

Owner goal: the app goes global in v2.0 with a language switcher. Research lives in
`ai/plans/39-localisation/`. Rows 38 and 39 carry the owner's decisions: a typed English
catalog and `t()`, no i18n library, no second language first. RTL is the real work.
