# Step 1: the delta re-pin, the three patch regenerations and the carried hygiene

Requirements: R1.1, R1.2, R1.3, R1.4, R1.5, R1.6, R1.7, R1.8, R1.9, R1.10, R1.11, R1.12, R1.13
Weight: 2

## Anchor check

Before any edit (the anchors verify the starting tree; step 1 consumes them):

```bash
bash ai/plans/111-sdk58-stable-repin/scripts/anchors-check.sh
```

Prints `ANCHORS OK` (every count 1) or names the drifted anchor. A drift is a STOP.

## Goal

One commit moves the eight pins `expo@58.0.13`'s `bundledNativeModules.json` and expo's own
dependencies move, regenerates all three patches at their installed versions, deletes the two dead
patch symbols and the one vacuous guard check the first attempt's audit carried, and adds the
background-task offline-option guard suite.

## Branch

```bash
git fetch origin
git checkout uat && git pull origin uat
git checkout -b dep/111-repin-5813 uat
```

## Files

- `package.json` (eight pins, section 4.1 of PLAN.md)
- `yarn.lock`
- `patches/expo-location+58.0.17.patch` (new), old `patches/expo-location+58.0.16.patch` deleted
- `patches/expo-widgets+58.0.20.patch` (new), old `patches/expo-widgets+58.0.19.patch` deleted
- `patches/expo-background-task+58.0.11.patch` (regenerated in place, one symbol dropped)
- `scripts/verify-expo-location-patch.sh` (the vacuous check and its comment deleted)
- `shared/__tests__/expoLocationPatch.test.ts` (one fixture and one case deleted)
- `shared/__tests__/backgroundTaskPatch.test.ts` (new guard suite)
- `app.json` (version bump only)
- `android/app/build.gradle` (versionName; gitignored, never staged)
- `ai/plans/README.md` (row 111 to `IN PROGRESS, step 1`)
- `ai/plans/111-sdk58-stable-repin/LOG.md` (this step's entries)

## Red tests

The red does not exist on the untouched tree: at uat's pins the three patch files match the
installed packages, so patch-package prints three `✔` lines with no warning and
`shared/__tests__/widgetOpenAppPatch.test.ts` passes. The red appears with contract 1's pins and
is captured by contract 2, whose expected output is written there. Do not look for it before
then.

## Change contracts

1. Edit the eight pins in `package.json`, each by replacing that line's exact value and nothing
   else in the file (the key order and the indentation stay byte-identical):

   ```
   "expo": "~58.0.12",              -> "expo": "~58.0.13",
   "@expo/ui": "58.0.19",           -> "@expo/ui": "58.0.20",
   "expo-haptics": "~58.0.6",       -> "expo-haptics": "~58.0.7",
   "expo-location": "58.0.16",      -> "expo-location": "58.0.17",
   "expo-notifications": "~58.1.4", -> "expo-notifications": "~58.1.5",
   "expo-router": "~58.0.21",       -> "expo-router": "~58.0.22",
   "expo-splash-screen": "~58.0.9", -> "expo-splash-screen": "~58.0.10",
   "expo-widgets": "58.0.19",       -> "expo-widgets": "58.0.20",
   ```

   Nothing else in `package.json` moves; no new package installs (D111.4).
2. `yarn install --ignore-engines`, then capture the red (R1.3's counterpart, before the
   regeneration):

   ```bash
   yarn install --ignore-engines 2>&1 | sed -n '/patch-package/,/^Done/p'
   npx jest shared/__tests__/widgetOpenAppPatch.test.ts --watchman=false --selectProjects=unit 2>&1 | tail -6
   ```

   Expected: patch-package prints `expo-background-task@58.0.11 ✔`, `expo-location@58.0.16 ✔` and
   `expo-widgets@58.0.19 ✔` with two version-mismatch warnings (location made for 58.0.16 applied
   to 58.0.17; widgets made for 58.0.19 applied to 58.0.20) and no `**ERROR**` line; the suite
   fails exactly two tests, `names the installed expo-widgets version` and `patches exactly the
   known files, all inside the package`; and no peer warning appears beyond yarn's own lowercase
   ones. Record the exact lines in `LOG.md`. Measured on the candidate set at uat `fece11d3`:
   `Tests: 2 failed, 2 skipped, 5704 passed, 5708 total`. A new peer warning naming a package
   this plan does not move is the section 2.2 STOP.
3. Regenerate the three patches, in this order. Each regeneration is
   `npx patch-package <package>` followed by deleting the old patch file, then a clean-install
   proof in contract 4.
   - **expo-background-task**: the patch applies whole and the package does not move. Before
     regenerating, delete the `didRegisterTaskForTesting` static function from
     `node_modules/expo-background-task/ios/BackgroundTaskScheduler.swift` — its nine lines
     including the two-line docblock above it — because nothing in this repository or in the package calls
     it. Regenerate at `+58.0.11`, keeping the filename.
   - **expo-location**: the patch applies whole, every hunk. Before regenerating, delete the
     `mLastAzimuth` field from `node_modules/expo-location/android/src/main/java/expo/modules/location/LocationModule.kt`
     — its declaration, its assignment inside the magnetometer branch and its reset — because the
     removed degree gate was the only reader. Regenerate as `+58.0.17.patch`, delete
     `+58.0.16.patch`.
   - **expo-widgets**: the patch applies whole, all five files, because 58.0.20 changes none of
     them. Regenerate as `+58.0.20.patch`, delete `+58.0.19.patch`. Both features stay in the
     regenerated patch: the `openApp` branch (`props.openApp`, `launchAppAction`,
     `WidgetButtonProps.openApp`) and the local-only device-locale injection (`__expoWidgetDeviceLocale`
     through the JSContext Swift selector).
   - No hunk is hand-merged. A patch that does not apply whole is the section 2.2 STOP.
4. Clean-install proof (A6, R1.3):

   ```bash
   rm -rf node_modules/expo-background-task node_modules/expo-location node_modules/expo-widgets
   yarn install --ignore-engines --force 2>&1 | sed -n '/patch-package/,/^Done/p'
   ```

   Expected: exactly three `✔` lines, one per package, no `**ERROR**` line and no
   `Warning: patch-package detected a patch file version mismatch`. Yarn's own lowercase
   workspace or deprecation warnings outside the patch-package block do not count.
5. `scripts/verify-expo-location-patch.sh`: rewrite the docstring on line 3 from
   `patches/expo-location+58.0.16.patch` to `patches/expo-location+58.0.17.patch`. Then delete the `local-maven-repo` block
   (`if [ -d "$PKG/android/local-maven-repo" ] ... fi`) and rewrite the comment above the
   `publication` grep, so it reads that the `publication` block is what makes autolinking resolve
   the prebuilt AAR and its absence is the guard. The shipped package puts that repository at the
   package root, so a check for an `android/` copy cannot fail on any tree a clean install
   produces. This is R1.10's first half.
6. `shared/__tests__/expoLocationPatch.test.ts`: delete the `withMavenRepo` field from the
   `makeTree` overrides type and its `mkdirSync` line, and delete the case
   `it('refuses a tree with a local maven repo', ...)`. The seven remaining cases stay
   byte-unchanged, and the case `refuses a tree that declares a publication block` is R1.10's
   second half.
7. Create `shared/__tests__/backgroundTaskPatch.test.ts`, modelled on
   `shared/__tests__/expoLocationPatch.test.ts` (same `execFileSync` style, same
   `expect(...).toBe(...)` discipline, no temporary tree needed because it reads the installed
   package in place). It asserts, on `node_modules/expo-background-task`:
   - `src/BackgroundTask.types.ts` and `build/BackgroundTask.types.d.ts` each contain the exact
     line `requiresNetworkConnectivity?: boolean;`
   - `android/src/main/java/expo/modules/backgroundtask/BackgroundTaskScheduler.kt` contains the
     exact text `if (requiresNetworkConnectivity) NetworkType.CONNECTED else NetworkType.NOT_REQUIRED`
   - `ios/BackgroundTaskScheduler.swift` contains the exact text
     `request.requiresNetworkConnectivity = requiresNetworkConnectivity`
   - the installed package contains no `didRegisterTaskForTesting`
   Four `it` cases, one per assertion group. `jest.config.js`'s unit project collects
   `shared/__tests__`, so no config change is needed. This is R1.11 and the audit's sixth carried
   finding.
8. Green run:

   ```bash
   yarn validate && yarn test:tz
   npx jest shared/__tests__/widgetOpenAppPatch.test.ts shared/__tests__/expoLocationPatch.test.ts shared/__tests__/backgroundTaskPatch.test.ts --watchman=false --selectProjects=unit 2>&1 | tail -4
   node -e "console.log(require('expo/package.json').version, require('react-native/package.json').version)"
   for p in @expo/ui expo-haptics expo-location expo-notifications expo-router expo-splash-screen expo-widgets; do node -e "console.log('$p', require('$p/package.json').version)"; done
   ```

   Expected: validate green at 100 percent on all four measures; test:tz green in four timezones;
   the three patch suites green; the node line prints `58.0.13 0.88.0` (R1.1, R1.2, R1.4, R1.5);
   the loop prints the seven versions of R1.8.
9. The landed invariants stay: `app.json`'s `expo-notifications` plugin entry keeps
   `"enableRemoteNotifications": false` (R1.6) and `widgets/PrayerWidget.tsx` keeps
   `strokeBorder({ content: ... })` (R1.7). Neither file changes in this step except app.json's
   version.

## Break script

```bash
mv patches/expo-widgets+58.0.20.patch "$TMPDIR/"
rm -rf node_modules/expo-widgets && yarn install --ignore-engines --force 2>&1 | sed -n '/patch-package/,/^Done/p' | grep -c "expo-widgets.*✔" || echo "0 ✔ lines"
npx jest shared/__tests__/widgetOpenAppPatch.test.ts -t "names the installed expo-widgets version" --watchman=false --selectProjects=unit 2>&1 | tail -4
mv "$TMPDIR/expo-widgets+58.0.20.patch" patches/
rm -rf node_modules/expo-widgets && yarn install --ignore-engines --force 2>&1 | sed -n '/patch-package/,/^Done/p' | grep -c "expo-widgets.*✔"
python3 - "$PWD" << 'EOF'
import sys
p = sys.argv[1] + '/node_modules/expo-background-task/ios/BackgroundTaskScheduler.swift'
src = open(p).read()
open(p + '.bak', 'w').write(src)
open(p, 'w').write(src.replace('    request.requiresNetworkConnectivity = requiresNetworkConnectivity', '    request.requiresNetworkConnectivity = true'))
EOF
npx jest shared/__tests__/backgroundTaskPatch.test.ts --watchman=false --selectProjects=unit 2>&1 | tail -4
mv node_modules/expo-background-task/ios/BackgroundTaskScheduler.swift.bak node_modules/expo-background-task/ios/BackgroundTaskScheduler.swift
npx jest shared/__tests__/backgroundTaskPatch.test.ts --watchman=false --selectProjects=unit 2>&1 | tail -4
echo "ALL AS EXPECTED: 1"
```

Expected in order: `0 ✔ lines`; the named test FAILS (the suite guards the patch); then `1` (the
guard passes again after restore); the background-task suite FAILS with
`expect(received).toContain(expected)` on the Swift assertion; then it passes again; then
`ALL AS EXPECTED: 1`. `git status --porcelain` afterwards lists only this step's files and the
plan files.

## Version and commit

Next patch past uat's `package.json`, bumped in `app.json` first, then `package.json`, then
`android/app/build.gradle` `versionName`. One commit:

`<VERSION> - dep: SDK 58 re-pin to expo 58.0.13 (bundledNativeModules delta), three patches regenerated at 58.0.11/58.0.17/58.0.20, dead patch symbols and the vacuous location guard check removed, background-task offline-option guard added`

If the pre-commit hook fails on the single commit, apply the A5 fallback split in two commits on
the same branch: the SDK packages with the regenerated patches and the hygiene, then the new
guard suite. The split is the fallback, not the plan.

## Review

The reviewer checks: the eight pins exactly as section 4.1, and nothing else in `package.json`
moved; the two new patch files carry both widgets features and the location hunks unchanged; the
background-task patch is byte-identical except the `didRegisterTaskForTesting` removal; the
installed `LocationModule.kt` carries no `mLastAzimuth`; the deleted check is gone from the script
and the fixture and case from the suite; the new suite's four cases each fail when their marker is
removed; app.json changed only its version.

## Merge

```bash
git checkout uat && git merge --no-ff dep/111-repin-5813 -m "<VERSION> - merge dep/111-repin-5813"
```

## Done when

R1.1 to R1.11 hold on uat and the ledger records the red lines, the clean-install output and the
seven resolved versions.

## Restore

`git checkout uat -- package.json yarn.lock patches scripts shared app.json && yarn install --ignore-engines`
restores the tree to uat's pins.
