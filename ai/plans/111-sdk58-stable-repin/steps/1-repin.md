# Step 1: the stable re-pin commit

Requirements: R1.1, R1.2, R1.3, R1.4, R1.5, R1.6, R1.7
Weight: 2

## Anchor check

Before any edit (the anchors verify the pre-change tree; step 1 consumes them):

```bash
bash ai/plans/111-sdk58-stable-repin/scripts/anchors-check.sh
```

Prints `ANCHORS OK` (every count 1) or names the drifted anchor. A drift is a
STOP.

## Goal

One commit moves the whole pin set, rebuilds all three patches against their
stable packages, renames the one deprecated `strokeBorder` parameter, and
claims `enableRemoteNotifications: false`.

## Branch

```bash
git fetch origin
git checkout uat && git pull origin uat
git checkout -b dep/111-sdk58-stable uat
```

## Files

- `package.json` (31 pins, section 4.1 of PLAN.md)
- `yarn.lock`
- `patches/expo-background-task+58.0.11.patch` (new), old `+58.0.10.patch` deleted
- `patches/expo-location+58.0.16.patch` (new), old `+58.0.12.patch` deleted
- `patches/expo-widgets+58.0.19.patch` (new), old `+58.0.14.patch` deleted
- `widgets/PrayerWidget.tsx` (one parameter rename)
- `app.json` (plugin option; version bump)

## Red tests

The red exists before any change; capture it first:

```bash
yarn install --ignore-engines 2>&1 | tail -40
npx jest shared/__tests__/widgetOpenAppPatch.test.ts --watchman=false --selectProjects=unit 2>&1 | tail -6
```

Expected at the un-rebuilt state: patch-package reports the background-task
patch applied with a version-mismatch warning and errors for expo-location and
expo-widgets; the suite fails 6 tests, including
`the open-the-app patch › names the installed expo-widgets version`. Record the
exact failing lines in `LOG.md`.

## Change contracts

1. Edit `package.json` to the 31 pins in PLAN.md section 4.1. Nothing else
   moves; every new SDK 58 package is absent (D111.4).
2. `yarn install --ignore-engines`. Observe the patch-package output matches
   section 4.2's measured statuses.
3. Rebuild the patches, in this order:
   - expo-background-task: the old patch applied whole, so
     `npx patch-package expo-background-task`, delete
     `patches/expo-background-task+58.0.10.patch`.
   - expo-location: the patch rejects only on `expo-module.config.json`. Apply
     every other hunk by hand exactly as the old patch carries them, then make
     the config-json change by hand: keep upstream's current formatting, remove
     only the `publication` block (A6: that removal is what forces autolinking
     to compile the patched Kotlin from source). Then
     `npx patch-package expo-location`, delete the old patch file.
   - expo-widgets: the patch rejects only on
     `ExpoWidgetEmittableTree.kt`. Apply every other hunk by hand exactly as
     the old patch carries them, then hand-carry the `openApp` branch into
     today's `toPeekButton` shape (the same `launchAppAction` helper, the same
     `props.openApp` branch, the same `WidgetButtonProps.openApp` field added).
     Then `npx patch-package expo-widgets`, delete the old patch file.
   - Both hand-merges stay inside the two named files. A rejection anywhere
     else is the section 2.2 STOP.
4. Clean-install proof (A6):

```bash
rm -rf node_modules/expo-background-task node_modules/expo-location node_modules/expo-widgets
yarn install --ignore-engines --force 2>&1 | sed -n '/patch-package/,/^Done/p'
```

Expected: exactly three ✔ lines, one per package, no `**ERROR**`, no
`Warning: patch-package detected a patch file version mismatch`. Yarn's own
lowercase engine or deprecation warnings outside the patch-package block do
not count. This is R1.3.

5. `widgets/PrayerWidget.tsx`: in the `strokeBorder({...})` call at the
   `ActivePill` (anchor a7), rename the `color:` key to `content:`. Nothing
   else in the file changes. This is R1.7.
6. `app.json`: inside the `expo-notifications` plugin entry (anchor a5), add
   `"enableRemoteNotifications": false` beside `icon` and `sounds`. Version
   bump first (next patch past uat's `package.json`). This is R1.6.
7. Green run:

```bash
yarn validate && yarn test:tz
npx jest shared/__tests__/widgetOpenAppPatch.test.ts shared/__tests__/expoLocationPatch.test.ts --watchman=false --selectProjects=unit 2>&1 | tail -4
node -e "console.log(require('expo/package.json').version, require('react-native/package.json').version)"
```

Expected: validate green at 100 percent on all four measures; test:tz green in
four timezones; both patch suites green; the node line prints
`58.0.12 0.88.0` (R1.1, R1.2, R1.4, R1.5).

## Break script

```bash
mv patches/expo-widgets+58.0.19.patch "$TMPDIR/"
rm -rf node_modules/expo-widgets && yarn install --ignore-engines --force 2>&1 | sed -n '/patch-package/,/^Done/p' | grep -c "expo-widgets.*✔" || echo "0 ✔ lines"
npx jest shared/__tests__/widgetOpenAppPatch.test.ts -t "names the installed expo-widgets version" --watchman=false --selectProjects=unit 2>&1 | tail -4
mv "$TMPDIR/expo-widgets+58.0.19.patch" patches/
rm -rf node_modules/expo-widgets && yarn install --ignore-engines --force 2>&1 | sed -n '/patch-package/,/^Done/p' | grep -c "expo-widgets.*✔"
```

Expected in order: `0 ✔ lines`; the named test FAILS (proves the suite guards
the patch); then `1` (the guard passes again after restore).

## Version and commit

Next patch past uat's `package.json`, bumped in `app.json` first, then
`package.json`, then `android/app/build.gradle` `versionName`. One commit:

`<VERSION> - dep: SDK 58 stable re-pin (expo 58.0.12, RN 0.88.0), three patches rebuilt, strokeBorder content rename, enableRemoteNotifications false`

If the pre-commit hook fails on the single commit, apply the A5 fallback split
in three commits on the same branch (SDK packages with the rebuilt patches;
then React and React Native with `@react-native/jest-preset` and
`@react-native/metro-config`; then Reanimated with worklets), each green
through the hook. The split is the fallback, not the plan.

## Review

The reviewer checks: the 31 pins exactly as section 4.1; the three new patch
files carry both widgets features (openApp and the device-locale injection);
the hand-merged hunks match the old patch's semantics line for line; the
strokeBorder diff is one key rename; app.json carries the new key and nothing
else changed.

## Merge

```bash
git checkout uat && git merge --no-ff dep/111-sdk58-stable -m "<VERSION> - merge dep/111-sdk58-stable"
```

## Done when

R1.1 to R1.7 hold on uat and the ledger records the red lines and the
clean-install output.

## Restore

`git checkout uat -- package.json yarn.lock patches app.json widgets/PrayerWidget.tsx && yarn install --ignore-engines` restores the tree to uat's pins.
