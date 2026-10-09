# SDK 58 programme briefs

The queue table in `ai/plans/README.md` is the authority for order and status. This file keeps
only the briefs open rows still cite: section 16 (queue row 18) and D4 (queue rows 38 and 39).
DONE records live in git history.

## 16. SDK 58 stable re-pin + full release-notes review (NOT PLANNED, blocked until SDK 58 stable is on npm)

**Trigger.** The owner ruled 2026-10-09: ride the `next` tag and repin to the newest version every
time, release candidates included. npm that day: `latest` 57.0.27, `next` 58.0.6. The row is
unblocked and jumps the queue. Its second job is Babel 8.

**Babel 8 rider.** `@babel/core` 8.0.6 and its three plugins cannot move while
`babel-preset-expo@58.0.11` (the preset `expo@58.0.6` pairs with) depends on 36 Babel 7 plugins
and `@react-native/babel-preset` pins `@babel/core ^7.25.2`. A Babel 7 plugin under Babel 8
throws `BABEL_VERSION_UNSUPPORTED`. Bump
the four together when the SDK presets move: `@babel/core`,
`@babel/plugin-transform-modules-commonjs`, `@babel/plugin-transform-react-jsx` and
`@babel/preset-typescript`, all at `^7.29.x` in `package.json:79-82`.

**Scope.**

1. `npx expo install --check` against `latest`: name and bump everything it reports, never `--fix`.
2. Read the full release notes and act on anything new that touches us (owner instruction: the
   beta changelog is incomplete). Already ruled at past re-pins, do not re-litigate: no SwiftPM
   (CocoaPods stays), no threadIdentifier grouping, no Live Activities.
3. Full regression: `yarn validate`, `yarn test:tz`, e2e, 3T release build, the dumpsys and
   punctuality gates.
4. Reopen the store-release path: nothing ships to a store or to production before this row is
   DONE.
5. Bookkeeping: update `ai/AGENTS.md` (stack table, ahead-pins table).

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
- **A10. After the install, diff the pin set and read every peer warning.** Session 23 measured
  26 packages and installed 25. `react-native-screens` surfaced only as an `expo-router` peer
  warning (`package.json:73`). One warning is expected: `jest-expo > jest-watch-typeahead@2.2.1`
  wants Jest 29.
- **A11. In `widgets/PrayerWidget.tsx` a fixed `frame()` comes before a flexible one, and no test
  can see the order.** `@expo/ui` types `frame()` as two overloads that cannot be mixed, so
  each mixed call became two chained modifiers. Reversed, the greedy frame takes the space
  first and the row changes size (`:657-658`, `:729`).

## D4. Localization for v2.0 (NOT PLANNED, carried by queue rows 38 and 39)

Owner goal: the app goes global in v2.0 with a language switcher. Research lives in
`ai/plans/39-localisation/`. Rows 38 and 39 carry the owner's decisions: a typed English
catalog and `t()`, no i18n library, no second language first. RTL is the real work.
