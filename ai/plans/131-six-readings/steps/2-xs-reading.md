# Step 2: the XS session, RD3 plus the iOS half of RD4

**Requirements:** R3.1, R3.2, R4.1
Weight: 3

Anchor check: `xs-build-recipe.txt` counts 1 (the pre-flight covers it).

## Goal

One probe install on the XS captures RD3 (the temporary-full-accuracy prompt under a
reduced grant) and the iOS half of RD4 (cached-fix identity), then restores the phone:
precise location back on, the grant as found, and a probe-free build of the found
version family reinstalled.

## Branch and commits

Lane branch `lane/131`. One docs commit at the end:
`<VERSION> - docs(plans): ticket 131 step 2, the XS reading captured`. The scratch
worktree is shared with step 1 (the Android files ignored; iOS prebuild runs in the
same tree).

## Files

- Scratch only: `app/_layout.tsx`, `app/index.tsx`, `ios/` (prebuilt).
- Evidence: `$HOME/athan-gitree/sessions/131/` (`xs-rd.log`, screenshots, the
  installed-version lines).
- Lane: `READINGS.md` sections RD3 and RD4's iOS half.

## Red tests

None. Evidence lines are the gate.

## The session

0. Export `IPHONE_UDID`. Resolve the team once and export it:
   ```
   TEAM_ID=$(security cms -D -i "$(ls -t ~/Library/MobileDevice/Provisioning\ Profiles/*.mobileprovision | head -1)" | plutil -extract TeamIdentifier.0 raw -)
   ```
   Pre-flight passed in step 1 plus `xcrun devicectl list devices | grep $IPHONE_UDID`
   showing the XS connected.

1. Record the found state, under `device-$IPHONE_UDID.lock` (one hold for the whole
   device session):
   `xcrun devicectl device info apps --device $IPHONE_UDID 2>/dev/null | grep -i athan > $HOME/athan-gitree/sessions/131/xs-found-apps.txt`
   and note the installed bundle version. When it differs from the scratch tree's
   `app.json` version, resolve the found version's commit in the scratch worktree
   first (`git log -S '<found version>' -- app.json` in the main tree, then
   `git checkout --detach <sha>` in the scratch worktree and re-copy the probe
   shell in); when it is equal, build as-is; when no commit carries the found
   version, stop per PLAN.md section 2.2.

2. Build the probe app, under `build.lock` (scratch worktree, probe shell already in
   place from step 1):
   ```
   cd $HOME/athan-gitree/worktrees/plan-131
   # one zsh shell so the unsets hold:
   for v in $(printenv | grep -o '^EXPO_PUBLIC_[A-Z_]*'); do unset $v; done
   unset EXPO_ANDROID_SUFFIX EXPO_NAME_SUFFIX
   export EXPO_PUBLIC_ENV=local EXPO_PUBLIC_API_KEY=key EXPO_PUBLIC_IOS_WIDGETS=1 CI=1 EXPO_NO_TELEMETRY=1
   rm -rf $HOME/athan-gitree/worktrees/.tmp-plan-131-ios
   mkdir -p $HOME/athan-gitree/worktrees/.tmp-plan-131-ios
   export TMPDIR=$HOME/athan-gitree/worktrees/.tmp-plan-131-ios
   npx expo prebuild -p ios --no-install --clean > $HOME/athan-gitree/sessions/131/logs/xs-prebuild.log 2>&1
   grep -B1 -A2 "ExpoLocationFullAccuracy" ios/Athan/Info.plist
   xcodebuild -workspace ios/Athan.xcworkspace -scheme Athan -configuration Release \
     -destination 'generic/platform=iOS' -derivedDataPath ios/build \
     -allowProvisioningUpdates CODE_SIGN_STYLE=Automatic \
     DEVELOPMENT_TEAM=$TEAM_ID build \
     > $HOME/athan-gitree/sessions/131/logs/xs-xcodebuild.log 2>&1
   ```
   Expected: `BUILD SUCCEEDED` and the `ExpoLocationFullAccuracy` purpose string
   present in the generated plist (the prompt's precondition; row 121 pinned the
   plugin default). The app is `ios/build/Build/Products/Release-iphoneos/Athan.app`.
   Install:
   `xcrun devicectl device install app --device $IPHONE_UDID ios/build/Build/Products/Release-iphoneos/Athan.app`.
   Release `build.lock`.

3. Capture and drive, under the device lock held from item 1. Taps on iOS need the
   agent-device runner, prepared once before the first drive and uninstalled at the
   end (the XS atlas Driver row; the MCP server lacks the team env):
   ```
   AGENT_DEVICE_IOS_TEAM_ID=$TEAM_ID agent-device prepare ios-runner --udid $IPHONE_UDID
   ```

   a. `pymobiledevice3 syslog live --udid $IPHONE_UDID 2>/dev/null | grep --line-buffered '\[RD' > $HOME/athan-gitree/sessions/131/xs-rd.log &`
   b. Launch: `xcrun devicectl device process launch --device $IPHONE_UDID com.mugtaba.athan`;
      every later relaunch adds `--terminate-existing` so the probe cold-starts.
      Wait for `[RD0]` and `[RD4]` lines (15 s cycles). The `[RD0] permission read`
      line names her current grant. The `[RD4]` lines carry the iOS cached-fix
      verdict, `both null` being a valid verdict.
   c. Branch on the `[RD0]` permission read:
      - `granted: true` with `"accuracy":"full"`: reduce the grant. Drive
        Settings > Apps > Athan > Location and switch Precise Location off (atlas
        routes; screenshots along the way as reach evidence). Then relaunch the app
        (item b). The probe logs `[RD3] perm-watch` with `"accuracy":"reduced"`.
      - `granted: false`: the probe itself logs `[RD3] not granted, requesting...`
        and the When-In-Use prompt appears over the app. Screenshot, tap
        Allow While Using by measured coordinates (system alerts swallow off-alert
        taps, so the tap lands on the alert; every iOS tap in this step is one
        agent-device press at a point measured from the preceding screenshot). Then reduce the grant as above and
        relaunch.
      - `granted: true` with `"accuracy":"reduced"` already: the waiter fires on the
        next poll without any Settings drive.
   d. RD3: on the relaunch with `"accuracy":"reduced"`, the probe calls
      `requestForegroundPermissions({ accuracy: 'full' })` and the
      temporary-full-accuracy prompt appears over the app (this is the reading).
      Within the prompt's life: screenshot
      `pymobiledevice3 developer dvt screenshot --udid $IPHONE_UDID $HOME/athan-gitree/sessions/131/rd3-prompt.png`
      (reach evidence), read its title and buttons from the image, tap the
      affirmative (one agent-device press at the measured point). Wait for `[RD3] resolved` and `[RD3] after-get` lines. The
      resolved line is the records claim; the screenshot only reaches the screen.
      If no prompt appears, the `[RD3] resolved` line (expected `"accuracy":"reduced"`) is itself the reading: the absent form, recorded as the verdict.
   e. Restore the grant: Settings > Apps > Athan > Location, Precise Location on.
      Relaunch the app; the probe logs `[RD3] perm-watch` with `"accuracy":"full"`.
      That line is R3.2's restore evidence.
   f. Restore the app: in the scratch worktree, restore the two probe files
      (`git checkout -- app/_layout.tsx app/index.tsx`; when item 1 moved the
      worktree to the found version's commit, checkout is against that commit),
      rebuild with the same commands as item 2 (probe-free, fresh TMPDIR), install
      with devicectl. Record the installed version after:
      `xcrun devicectl device info apps --device $IPHONE_UDID | grep -i athan`.
      Uninstall the two agent-device runner apps. Kill the syslog job. Release the
      device lock.

4. Transcribe RD3 and RD4's iOS half into `READINGS.md` (same honesty rules as step
   1), write the LOG.md entry with its `session:` line, commit, merge under
   `uat.lock`, sync the main tree's `android/app/build.gradle` `versionName` under
   `build.lock`.

## Break script

None owed. Honesty check: every quoted verdict line appears verbatim in
`sessions/131/xs-rd.log`.

## Review checklist

- The plist grep line from item 2 is quoted.
- The found-state and restored installed-version lines are both quoted.
- No coordinate, address or place name appears.
- The prompt's screenshot is referenced but the claim rides the `[RD3]` lines.

## Done when

RD3's section and RD4's iOS half exist in READINGS.md with evidence, the XS sits as
found (grant precise on, probe-free build installed), the locks are released, and
the docs commit is merged.
