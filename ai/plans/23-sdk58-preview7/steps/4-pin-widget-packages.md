# Step 4: pin `@expo/ui` and `expo-widgets` to 58.0.5

This step is `(specified)`: build it from the contracts below.

It is the fix. `@expo/ui@58.0.7` reaches `React.memo` at module scope through
`recycling/useRecycledRows.js`, and the widget runtime's react-stub has no `memo`, so the whole widget bundle
throws at load and every Android card renders `undefined is not a function`. 58.0.5 is the last version where the
Android AND iOS bundles both load (`PLAN.md` section 5).

0. **Anchor check:**

```bash
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
  ai/plans/23-sdk58-preview7/scripts/anchors/4-1.txt package.json
```

It must print `1`. Any other count means NEEDS REPLAN.

1. **Goal:** `@expo/ui` and `expo-widgets` both resolve to exactly 58.0.5, the `expo-widgets` patch applies at that
   version, and the 3T renders its widgets again.

2. **Branch:** `git checkout -b fix/pin-widget-packages-58-0-5 uat-2`

3. **Files:**
   - `package.json`
   - `yarn.lock`
   - `patches/expo-widgets+58.0.7.patch` → renamed to `patches/expo-widgets+58.0.5.patch`
   - `app.json` (version only)

   Nothing else, apart from `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.

4. **Tests first (red).** None are written in this step. The red already exists and is verified in part 5: the
   existing `shared/__tests__/widgetOpenAppPatch.test.ts` fails the moment the pin changes the installed version,
   until the patch is renamed. Step 5 writes the test that covers the defect itself.

5. **Change.**

   **Part 1: pin both packages, EXACTLY.** In `package.json`'s `dependencies`, set both to a bare version with no
   range prefix:

   ```
   "@expo/ui": "58.0.5",
   "expo-widgets": "58.0.5",
   ```

   The bare form is load-bearing and is not a style choice: `~58.0.5` admits 58.0.6 and 58.0.7, which are the
   broken versions this step exists to exclude.

   **Part 2: install.**

   ```bash
   yarn install
   ```

   `patch-package` prints an error for `expo-widgets`, because the patch still names 58.0.7. That is EXPECTED here
   and part 4 fixes it.

   **Part 3: delete the nested copy, then reinstall.** Yarn does not prune a nested copy left by an earlier install,
   and the widget bundle resolves the nested one:

   ```bash
   rm -rf node_modules/expo-widgets/node_modules
   yarn install
   ```

   **Part 4: rename the patch.** `patch-package` matches a patch to a package by the version in its filename, and
   skips a mismatch with an error rather than failing the install:

   ```bash
   git mv patches/expo-widgets+58.0.7.patch patches/expo-widgets+58.0.5.patch
   yarn install
   ```

   Do NOT regenerate the patch with `npx patch-package expo-widgets`. The rename is enough, because the converter
   at 58.0.5 differs from 58.0.7 only by the `cornerRadius` lines, which the patch does not anchor on. If
   `git apply` rejects a hunk, STOP (`PLAN.md` section 2.2, item 5).

   `patches/expo-background-task+58.0.7.patch` is NOT renamed. That package stays at 58.0.7.

   **Part 5: verify what actually resolved.** This is the check that would have caught the nested-copy trap:

   ```bash
   node -p "'flat @expo/ui: ' + require('./node_modules/@expo/ui/package.json').version"
   node -p "'expo-widgets: ' + require('./node_modules/expo-widgets/package.json').version"
   ls node_modules/expo-widgets/node_modules 2>/dev/null || echo "nested: none"
   ```

   Expected, exactly:

   ```
   flat @expo/ui: 58.0.5
   expo-widgets: 58.0.5
   nested: none
   ```

   Anything else is section 2.2, item 4: STOP.

   **Part 6: confirm the fix at the bundle level, before the phone.** Build both widget runtime bundles and load
   each one. Save as `$TMPDIR/verify-23-4.sh` and run with `bash`:

   ```bash
   #!/bin/bash
   set -u
   cd /Users/muji/repos/rn.athan.uk || exit 1
   for PLAT in android ios; do
     OUT="$TMPDIR/verify-23-4-$PLAT.bundle"
     node ./node_modules/expo-widgets/scripts/build-bundle.mjs "$(pwd)" "$PLAT" "$OUT" \
       > "$TMPDIR/verify-23-4-$PLAT.log" 2>&1 || { echo "$PLAT BUILD FAILED"; continue; }
     node -e "
   const fs=require('fs'),vm=require('vm');
   try{ vm.runInThisContext(fs.readFileSync('$OUT','utf8'),{filename:'$OUT'});
     console.log('$PLAT LOAD OK');
   }catch(e){ console.log('$PLAT LOAD THROW:',e.message); }
   "
   done
   ```

   Expected output, both lines:

   ```
   android LOAD OK
   ios LOAD OK
   ```

   A `LOAD THROW` here means the pin did not take: re-run part 5. A `BUILD FAILED` is section 10's own row.

6. **Green.**

   ```bash
   npx jest shared/__tests__/widgetOpenAppPatch.test.ts --watchman=false --selectProjects=unit
   ```

   Expected: `Tests: 6 passed, 6 total`. Then `npx tsc --noEmit` and `npx biome check . --error-on-warnings`, both
   exiting 0.

7. **Breaks.** Save as `$TMPDIR/breaks-23-4.sh` and run with `bash` from the repository root.

   ```bash
   #!/bin/bash
   # Every break edits a file the PLAN itself fixes, restores it afterwards, and
   # counts a substitution that changed nothing as NOT caught.
   set -u
   cd /Users/muji/repos/rn.athan.uk || exit 1
   CAUGHT=0
   TOTAL=0

   run_break () {
     LABEL="$1"; FILE="$2"; FROM="$3"; TO="$4"; TESTS="$5"
     TOTAL=$((TOTAL + 1))
     cp "$FILE" "$FILE.bak"
     # comma delimiter, and the strings ride the environment: the package names
     # carry a slash, which ends a s/// pattern, and double quotes inside them
     # would end the shell's own quoting
     FROM="$FROM" TO="$TO" perl -0pi -e 's,\Q$ENV{FROM}\E,$ENV{TO},' "$FILE"
     if cmp -s "$FILE" "$FILE.bak"; then
       echo "BREAK NOT APPLIED: $LABEL"
       mv "$FILE.bak" "$FILE"
       return
     fi
     if npx jest $TESTS --watchman=false --selectProjects=unit > "$TMPDIR/break-$LABEL.log" 2>&1; then
       echo "NOT CAUGHT: $LABEL"
     else
       echo "caught: $LABEL"
       CAUGHT=$((CAUGHT + 1))
     fi
     mv "$FILE.bak" "$FILE"
   }

   run_break "pin-range" package.json \
     '"@expo/ui": "58.0.5"' '"@expo/ui": "~58.0.5"' \
     shared/__tests__/widgetRuntimeLoads.test.ts

   run_break "pin-version" package.json \
     '"expo-widgets": "58.0.5"' '"expo-widgets": "~58.0.7"' \
     shared/__tests__/widgetRuntimeLoads.test.ts

   echo "caught $CAUGHT of $TOTAL"
   [ "$CAUGHT" -eq "$TOTAL" ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
   ```

   **This script runs in STEP 5, not here**, because the test it drives is written in step 5. Step 4's own
   acceptance is part 6's two `LOAD OK` lines plus part 6's green suite. Step 5's part 7 runs this script and
   expects `caught 2 of 2` and `ALL AS EXPECTED: 1`.

8. **Version and commit.**

   ```bash
   node -p "const v=require('./package.json').version.split('.'); v[2]=+v[2]+1; v.join('.')"
   ```

   Set that version in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Add by name:
   `package.json`, `yarn.lock`, `patches/expo-widgets+58.0.5.patch`, `patches/expo-widgets+58.0.7.patch` (the
   deletion half of the rename), `app.json`, plus `ai/plans/README.md`, `PLAN.md` and `LOG.md`.

   Commit message, in `$TMPDIR/msg-4.txt`:

   ```
   <VERSION> - fix(widgets): pin @expo/ui and expo-widgets to 58.0.5

   The Android widgets have rendered "undefined is not a function" since the
   preview.7 bump. Root cause is not the SDK, React, RN or Reanimated, all of
   which the bisect cleared: @expo/ui 58.0.7 added recycling/useRecycledRows.js,
   which calls React.memo at MODULE scope.

   expo-widgets evaluates widget layouts in a cut-down runtime whose React is
   bundle/react-stub.ts, exporting five names: Fragment, Children,
   isValidElement, createContext, useContext. No memo. ui-globals re-exports the
   platform entry wholesale, so jetpack-compose/index.js reaches LazyColumn,
   LazyItems and useRecycledRows whether our layout uses them or not, and the
   bundle throws at load, before any layout runs.

   iOS breaks one version EARLIER, at 58.0.6, through a different module
   (swift-ui/List/DataListForEach.js) calling the same memo. Nobody had tested
   it, and the phone ladder could not: the 3T is Android. Measured by building
   both runtime bundles per version and loading each:

     58.0.3  android OK   ios OK
     58.0.4  android OK   ios OK
     58.0.5  android OK   ios OK      <- pinned here
     58.0.6  android OK   ios THROW
     58.0.7  android THROW ios THROW

   Both packages move together: expo-widgets 58.0.7 declares @expo/ui ~58.0.7,
   so pinning @expo/ui alone installs a NESTED 58.0.7 that the bundle resolves,
   leaving the flat pin reading 58.0.5 while the throw persists.

   The pins are exact, not ~: a tilde admits the two broken versions.

   No workaround is written for the library. An upstream regression is upstream's
   to fix, and a shim in react-stub would be a third patch to re-verify on every
   bump.
   ```

9. **Review.** Read `git show <sha>` back cold, as a stranger, and check:
   - both pins are bare `58.0.5`, with no `~` or `^`;
   - `patches/expo-widgets+58.0.5.patch` exists and `+58.0.7.patch` is gone, and git records it as a RENAME;
   - `patches/expo-background-task+58.0.7.patch` is untouched;
   - `yarn.lock` moved only the two packages and their transitive resolutions, and no other dependency changed
     version;
   - no source file under `widgets/`, `stores/`, `shared/` or `components/` changed: this step fixes a pin, not the
     layout;
   - the three version numbers match;
   - the commit message's measured table matches what part 6 printed.

   A clean read is all seven true. Handle a finding as `EXECUTOR-BRIEF.md` section 4, item 8 says.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff fix/pin-widget-packages-58-0-5 \
      -m "Merge fix/pin-widget-packages-58-0-5 into uat-2: @expo/ui and expo-widgets pinned to 58.0.5"
    ```

11. **The device proof, on the 3T.**

    **Build** a production build, because widget behaviour needs real prayer times and a mock build installs under
    `com.mugtaba.athan.fleettest`, whose widget providers are never placed:

    ```bash
    zsh ~/athan-device-sweep/session3/bin/build-prod.zsh uat-2 ~/athan-device-sweep/session23/athan-prod-pinned.apk
    ```

    Run it in the background with its log (`EXECUTOR-BRIEF.md` section 3). Success ends `BUILD-PROD OK`. If it
    prints `FAILED`, STOP and quote the line.

    **Before installing, verify the APK declares its widget providers.** `ai/AGENTS.md` records a build that
    shipped widget-less and could not be undone by reinstalling. **`aapt2` is NOT on PATH on this Mac**; it ships
    inside the SDK's build-tools, so it is called by absolute path. A bare `aapt2` exits 127, and `grep -c` on that
    prints `0`, which reads as "widget-less APK" and would stop a perfectly good build (session 23 hit exactly this
    with `aapt`):

    ```bash
    AAPT2=$(ls -d "$HOME"/Library/Android/sdk/build-tools/*/aapt2 | sort -V | tail -1)
    echo "using $AAPT2"
    "$AAPT2" dump xmltree --file AndroidManifest.xml \
      ~/athan-device-sweep/session23/athan-prod-pinned.apk | grep -c "PrayerWidgetProvider"
    ```

    `$AAPT2` must be a path that exists, and the count must be non-zero. If it is empty, STOP: an unmeasured count
    is not a pass. Grepping for a bare `appwidget` is a FALSE positive, because the Glance trampoline receivers
    are always present.

    **Install**, keeping the app's data:

    ```bash
    adb -s 8f7ada76 install -r ~/athan-device-sweep/session23/athan-prod-pinned.apk
    ```

    **Check 1: the alarms are healthy**, which also proves the `expo-background-task` patch still compiles in:

    ```bash
    adb -s 8f7ada76 shell dumpsys alarm | grep -A2 "com.mugtaba.athan}" \
      > ~/athan-device-sweep/session23/alarms-after-pin.txt
    yarn check:device
    ```

    Expect the app's prayer alarms plus the widget-refresh tick, and the one alarm every 3T dump shows at
    `when 2104803640505` (year 2036, not identified). If `yarn check:device` fails, STOP.

    **No clock change is made in this step**, so no armed alarm is fired by a forward jump.

    **Check 2: the widgets render.** Relaunch the app so a fresh snapshot is pushed, then force a widget update:

    ```bash
    adb -s 8f7ada76 shell am start -n com.mugtaba.athan/.MainActivity
    adb -s 8f7ada76 shell am broadcast -a android.appwidget.action.APPWIDGET_UPDATE
    python3 ~/athan-device-sweep/session5/bin/devcheck.py shot \
      ~/athan-device-sweep/session23/widgets-after-pin.png
    ```

    Read the screenshot yourself if your model can see images; if it cannot, call the `vision` subagent with the
    path and this exact question:

    > In this Android home screen screenshot, look at the two Athan widgets. For each one, say whether it shows a
    > prayer card with a prayer name, a countdown and a time, or whether it shows the text "undefined is not a
    > function". Report each widget separately.

    **Expected: both widgets show a prayer card.** Neither shows `undefined is not a function`. If either still
    shows the error text, STOP (`PLAN.md` section 2.2, item 7). If a card renders but looks different from the
    approved look, STOP (section 2.2, item 6): never tune the geometry.

    **Save** the screenshot and both text files under `~/athan-device-sweep/session23/`.

    **The phone is left** on this production build, with automatic time ON (this step never turned it off).

12. **Done when:**
    - `node -p "require('./node_modules/@expo/ui/package.json').version"` prints `58.0.5`;
    - `node -p "require('./node_modules/expo-widgets/package.json').version"` prints `58.0.5`;
    - `ls node_modules/expo-widgets/node_modules` reports no such directory;
    - `bash $TMPDIR/verify-23-4.sh` prints `android LOAD OK` and `ios LOAD OK`;
    - the commit's hook log ends with a `Tests:` line reading `passed, <n> total` and four `100%` coverage lines;
    - the 3T screenshot shows both widgets rendering a prayer card;
    - the step is ticked in `PLAN.md` section 6 as `- [x] Step 4: DONE in <sha>`.
