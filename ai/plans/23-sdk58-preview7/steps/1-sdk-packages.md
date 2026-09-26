# Step 1: SDK 58 preview.7, both patches rebuilt, and the `frame()` split

This step is large because it is the smallest change that leaves `uat-2` green. The SDK packages break both native
patches and reveal the `@expo/ui` `frame()` overload split; the tree does not typecheck again until all three are
done. Splitting them further would need `--no-verify`, which `EXECUTOR-BRIEF.md` section 2 forbids, so they are one
commit. Steps 2 and 3 are separable and stay separate.

0. **Anchor check:** run the section 3 count for this step's three anchors before anything else.

   ```bash
   cd /Users/muji/repos/rn.athan.uk
   P=ai/plans/23-sdk58-preview7/scripts/anchors
   for a in 1-1 1-2; do
     python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' $P/$a.txt widgets/PrayerWidget.tsx
   done
   python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' $P/1-3.txt shared/__tests__/widgetOpenAppPatch.test.ts
   ```

   Each must print `1`. Any other count means NEEDS REPLAN (`PLAN.md` section 2.2, item 1).

1. **Goal:** every SDK-pinned package except React, RN and Reanimated sits at what `expo@58.0.0-preview.7` pins;
   both native patches apply again; and no `frame()` call mixes the two overloads.

2. **Branch:** `git checkout -b chore/sdk58-preview7 uat-2`

3. **Files:** `package.json`, `yarn.lock`, `app.json`, `widgets/PrayerWidget.tsx`, and under `patches/`: delete
   `expo-background-task+58.0.3.patch` and `expo-widgets+58.0.3.patch`, add `expo-background-task+58.0.7.patch` and
   `expo-widgets+58.0.7.patch`. **`shared/__tests__/widgetOpenAppPatch.test.ts` is NOT edited** (part 5, section C).

4. **Tests first (red).** No new test file. The red is produced by the install, and exactly this red is expected:

   ```bash
   yarn add expo@~58.0.0-preview.7 \
     @expo/dom-webview@~58.0.1 @expo/metro-runtime@~58.0.7 @expo/ui@~58.0.7 \
     expo-asset@~58.0.7 expo-audio@~58.0.2 expo-background-task@~58.0.7 \
     expo-build-properties@~58.0.7 expo-constants@~58.0.7 expo-font@~58.0.2 \
     expo-linear-gradient@~58.0.1 expo-linking@~58.0.7 expo-notifications@~58.0.7 \
     expo-router@~58.0.8 expo-splash-screen@~58.0.1 expo-system-ui@~58.0.2 \
     expo-task-manager@~58.0.8 expo-updates@~58.0.9 expo-widgets@~58.0.7
   yarn add --dev @expo/log-box@~58.0.5 expo-dev-client@~58.0.7 jest-expo@~58.0.3
   ```

   Expected immediately after, and each is fixed later in THIS step:

   | Red | Fixed by |
   | --- | --- |
   | `patch-package finished with 2 error(s)`, both version mismatches against 58.0.7 | part 5, section A |
   | `tsc`: `requiresNetworkConnectivity does not exist in type 'BackgroundTaskOptions'` at `stores/notifications.ts(1795,7)` | part 5, section A |
   | `tsc`: `'height' does not exist in type` at `widgets/PrayerWidget.tsx(656,53)` | part 5, section B |
   | `tsc`: `'width' does not exist in type` at `widgets/PrayerWidget.tsx(725,53)` | part 5, section B |
   | `shared/__tests__/widgetOpenAppPatch.test.ts`, 5 tests | part 5, section A |

   Confirm the error count is exactly 3, and the failing-suite count exactly 1:

   ```bash
   npx tsc --noEmit 2>&1 | grep -c "error TS"          # must print 3
   npx jest --silent --watchman=false 2>&1 | grep -E "^Test Suites:"   # 1 failed, 169 passed
   ```

   Anything beyond that list is a STOP (section 2.2, item 2). Also confirm `yarn install` prints NO
   `@expo/log-box` peer warning; if it does, the `@expo/log-box` pin did not take, and that is a STOP.

5. **Change.**

   **Section A: rebuild both patches for 58.0.7.**

   Upstream has fixed neither behaviour, verified while planning: `grep requiresNetworkConnectivity` in
   `node_modules/expo-background-task` returns nothing at 58.0.7, and `grep openApp` in
   `node_modules/expo-widgets/android/src/main/java/expo/modules/widgets/ExpoWidgetEmittableTree.kt` returns nothing.
   So both patches still carry behaviour this app depends on and are regenerated, not dropped.

   For each package, apply the OLD patch's intent by hand to the new source, then regenerate:

   ```bash
   npx patch-package expo-background-task
   npx patch-package expo-widgets
   ```

   `patch-package <name>` writes `patches/<name>+<installed version>.patch` from the current state of
   `node_modules/<name>`. Delete the two `+58.0.3` files once the `+58.0.7` ones exist.

   The two patches must reproduce exactly these contracts, which are what the old patches carried:

   - **`expo-background-task`** (ISSUES #37, upstream PR expo/expo#50581, still open). In
     `BackgroundTaskConsumer.kt`, `didRegister` reads a `requiresNetworkConnectivity` boolean from the task options
     and passes it to `BackgroundTaskScheduler.registerTask`, defaulting to
     `BackgroundTaskScheduler.DEFAULT_REQUIRES_NETWORK_CONNECTIVITY` when absent. In `BackgroundTaskScheduler.kt`,
     `registerTask` takes that third parameter and sets WorkManager's network constraint from it, with the constant
     `DEFAULT_REQUIRES_NETWORK_CONNECTIVITY = true` so the library's own behaviour is unchanged. The TypeScript side
     adds `requiresNetworkConnectivity?: boolean` to `BackgroundTaskOptions`.
     **The `expo-module.config.json` `publication` block must stay deleted** (`ai/AGENTS.md`, 2026-09-24): while it
     is present, autolinking resolves the module to its prebuilt AAR and Gradle never compiles the patched Kotlin,
     so the patch is a silent no-op on device.
   - **`expo-widgets`** (session 15c). In `ExpoWidgetEmittableTree.kt`, the button props gain
     `val openApp: Boolean = false,` and `toPeekButton` maps a true `openApp` to `actionStartActivity` for the host
     app's launch activity rather than the default action. The imports `androidx.glance.action.Action` and
     `androidx.glance.appwidget.action.actionStartActivity` come with it.

   **Section B: the `frame()` overload split.**

   `@expo/ui` 58.0.7 declares `frame()` twice: a fixed overload taking `width`/`height`/`alignment`, and a flexible
   one taking `minWidth`/`idealWidth`/`maxWidth`/`minHeight`/`idealHeight`/`maxHeight`/`alignment`. A call mixing
   them matches neither. That is SwiftUI's own rule expressed in the types.

   Two sites change, and ONLY these two. The owner chose the stacked form on 2026-09-26 (`PLAN.md` decision 3):

   | File and anchor | From | To |
   | --- | --- | --- |
   | `widgets/PrayerWidget.tsx`, anchor `1-1.txt` | `frame({ maxWidth: Infinity, height: ROW_HEIGHT })` | `frame({ height: ROW_HEIGHT }), frame({ maxWidth: Infinity })` |
   | `widgets/PrayerWidget.tsx`, anchor `1-2.txt` | `frame({ width: MEDIUM_LIST_WIDTH, maxHeight: Infinity })` | `frame({ width: MEDIUM_LIST_WIDTH }), frame({ maxHeight: Infinity })` |

   **The order within each pair is load-bearing and is not the executor's to choose.** SwiftUI applies modifiers
   outward, so the FIXED frame sizes the view first and the FLEXIBLE frame then positions it in the space offered.
   Reversed, the greedy frame claims the space before the fixed one constrains it, and the row or column changes
   size. Write them in the order the table gives.

   No other `frame()` call changes. Confirm with:

   ```bash
   grep -nE "frame\(\{[^}]*\}" widgets/*.tsx | grep -E "(^|[^a-zA-Z])(width|height):" | grep -E "(maxWidth|maxHeight|minWidth|minHeight)"
   ```

   It must print nothing after the change.

   **Section C: the patch guard needs NO edit, and that is the point.**

   `shared/__tests__/widgetOpenAppPatch.test.ts` derives the expected filename from the installed package at
   runtime, which anchor `1-3.txt` pins:

   ```typescript
   const installedVersion = (): string =>
     (JSON.parse(read('node_modules/expo-widgets/package.json')) as { version: string }).version;
   ```

   So it starts passing again on its own the moment `patches/expo-widgets+58.0.7.patch` exists with the right
   content. **Do not edit this file.** If it still fails after both patches are rebuilt, STOP: the guard is telling
   the truth about something section A got wrong, and editing the guard would be deleting the only thing that
   noticed.

6. **Green.**

   ```bash
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   npx jest --silent --coverage --watchman=false
   ```

   All three exit 0. The suite prints `Test Suites: 170 passed, 170 total` and
   `Tests: 2 skipped, 4660 passed, 4662 total`, with four `100%` coverage lines. `yarn install` prints
   `patch-package finished` with NO errors.

7. **Breaks.** Given in full in `scripts/breaks-1.sh`. Three breaks, each naming the test expected to fail:

   | Break | Substitution | Expected to fail |
   | --- | --- | --- |
   | `patch-version` | rename `patches/expo-widgets+58.0.7.patch` to `+58.0.6` | `widgetOpenAppPatch.test.ts` "names the installed expo-widgets version" |
   | `patch-content` | delete `val openApp: Boolean = false,` from the patch body | `widgetOpenAppPatch.test.ts` "applies to the installed converter" |
   | `frame-order` | swap the two chained `frame()` calls at anchor `1-1` | `widgetContract.test.ts`, the layout-serialization assertion |

   It ends `ALL AS EXPECTED: 1`. If `frame-order` is NOT caught, that is recorded rather than worked around: it
   means no unit test can see modifier order, which is true of a serialized widget layout, and the device proof in
   step 4 is what covers it. Record it in `LOG.md` as not caught, with that reason, and carry on.

8. **Version and commit.** Version command:

   ```bash
   node -e "const v=require('./package.json').version.split('.');v[2]=+v[2]+1;console.log(v.join('.'))"
   ```

   Set it in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Edit each version string in
   place; never re-serialise `app.json`. Add by name: `package.json`, `yarn.lock`, `app.json`,
   `widgets/PrayerWidget.tsx`, the two new patch files, the two deleted ones, plus `ai/plans/README.md` and this
   folder's `PLAN.md` and `LOG.md`.

   ```
   <VERSION> - chore(sdk58): preview.7 packages, patches rebuilt, frame() split

   Nineteen runtime packages and three dev ones move to what
   expo@58.0.0-preview.7 pins in its own bundledNativeModules.json, which is
   what expo install --check measures against. @expo/log-box is the exception,
   absent from that file and taken at 58.0.5 because @expo/metro-runtime@58.0.7
   and expo-router@58.0.8 both declare that peer range.

   These three changes ship together because the tree does not typecheck until
   all of them are done, and this programme never commits with --no-verify.

   Both native patches are rebuilt against 58.0.7. Upstream has fixed neither
   behaviour: expo-background-task still has no requiresNetworkConnectivity
   (ISSUES #37, PR expo/expo#50581 open) and expo-widgets still has no openApp
   in its converter (session 15c). patch-package skips a version-mismatched
   patch with an error rather than a failure, so widgetOpenAppPatch.test.ts is
   what caught this, which is the job it was written for.

   @expo/ui 58.0.7 splits frame() into a fixed overload and a flexible one that
   cannot be mixed, which is SwiftUI's own rule in the types. The two mixed
   calls become two chained modifiers, fixed first so it sizes the view before
   the greedy frame positions it. The owner chose this form on 2026-09-26 and
   verifies the render on the XS in the device proof.
   ```

9. **Review.** No subagent (`PLAN.md` section 11). Read `git show <sha>` back and check: the only source change is
   the two `frame()` lines; both patch files are named `+58.0.7`; the two `+58.0.3` files are deleted; no widget
   colour, size or spacing constant moved. Record the read in `LOG.md`.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff chore/sdk58-preview7 -m "Merge chore/sdk58-preview7 into uat-2: SDK 58 preview.7, patches rebuilt, frame() split"
    ```

11. **Done when:**
    - `node -p "require('./node_modules/expo/package.json').version"` prints `58.0.0-preview.7`;
    - `ls patches/` lists only `expo-background-task+58.0.7.patch` and `expo-widgets+58.0.7.patch`;
    - `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0;
    - the suite prints `Test Suites: 170 passed, 170 total` with four `100%` lines;
    - the break script ends `ALL AS EXPECTED: 1`.
