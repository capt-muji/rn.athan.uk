# Step 1: the 3T session, RD4, RD1, RD5, RD2

**Requirements:** R1.1, R1.2, R2.1, R2.2, R4.1, R5.1, R5.2
Weight: 3

Anchor check: all five anchors under `scripts/anchors/` count 1 at `ca73f5a9`
(`bash scripts/preflight-131.sh` covers it).

## Goal

One fleettest install on the 3T captures four readings in the order RD4, RD1, RD5,
RD2, then restores the phone: grants re-granted, services on, fleettest package
uninstalled.

## Branch and commits

Lane branch `lane/131` in the lane worktree. One docs commit at the end of the step
(evidence is a device session, not code): version bumped, message
`<VERSION> - docs(plans): ticket 131 step 1, the 3T readings captured`. The scratch
worktree `$HOME/athan-gitree/worktrees/plan-131` carries the probe and is never
committed; it is removed at the lane's end.

## Files

- Scratch only: `app/_layout.tsx` and `app/index.tsx` in `$HOME/athan-gitree/worktrees/plan-131`, replaced from `scripts/probe-131.txt`.
- Evidence: `$HOME/athan-gitree/sessions/131/` (logs, screenshots, dumps; never committed).
- Lane: `ai/plans/131-six-readings/READINGS.md` sections RD4, RD1, RD5, RD2.

## Red tests

None. A readings step produces evidence lines, not code. The gate is the log lines
named below; a missing line is a failed step, not a skipped one.

## The session

0. Prepare. Export the real serial as `3T_SERIAL`. Run the pre-flight from the plan
   folder: `bash scripts/preflight-131.sh` (it prints `PREFLIGHT OK`).
   ```
   mkdir -p $HOME/athan-gitree/sessions/131/logs
   ```

1. Scratch worktree and build, under `build.lock` (held only while building):
   ```
   git worktree add --detach $HOME/athan-gitree/worktrees/plan-131 ca73f5a9
   cd $HOME/athan-gitree/worktrees/plan-131
   cmp -s yarn.lock $HOME/repos/rn.athan.uk/yarn.lock \
     && ln -s $HOME/repos/rn.athan.uk/node_modules node_modules \
     || HUSKY=0 yarn install --frozen-lockfile
   ```
   Copy the probe shell in: the LAYOUT block of `scripts/probe-131.txt` verbatim over
   `app/_layout.tsx`, the PROBE block verbatim over `app/index.tsx`. Write `.env`:
   ```
   grep -vE '^EXPO_PUBLIC_(ENV|API_KEY|IOS_WIDGETS|ANDROID_WIDGETS)=' .env.example > .env
   printf 'EXPO_PUBLIC_ENV=local\nEXPO_PUBLIC_API_KEY=key\n' >> .env
   ```
   Build (zsh, one shell so the unsets hold):
   ```
   for v in $(printenv | grep -o '^EXPO_PUBLIC_[A-Z_]*'); do unset $v; done
   unset EXPO_ANDROID_SUFFIX EXPO_NAME_SUFFIX
   export EXPO_PUBLIC_ENV=local EXPO_PUBLIC_API_KEY=key CI=1 EXPO_NO_TELEMETRY=1
   export EXPO_ANDROID_SUFFIX=fleettest EXPO_NAME_SUFFIX=FleetTest
   npx expo prebuild -p android --no-install --clean > $HOME/athan-gitree/sessions/131/logs/3t-prebuild.log 2>&1
   grep "applicationId 'com.mugtaba.athan.fleettest'" android/app/build.gradle
   rm -rf $HOME/athan-gitree/worktrees/.tmp-plan-131
   mkdir -p $HOME/athan-gitree/worktrees/.tmp-plan-131
   cd android
   export JAVA_HOME=${JAVA_HOME:-$(/usr/libexec/java_home -v 17)}
   TMPDIR=$HOME/athan-gitree/worktrees/.tmp-plan-131 ./gradlew assembleRelease \
     --no-daemon -PreactNativeArchitectures=arm64-v8a \
     > $HOME/athan-gitree/sessions/131/logs/3t-gradle.log 2>&1
   cd ..
   ```
   Expected: `BUILD SUCCESSFUL` in the gradle log. The artefact is
   `android/app/build/outputs/apk/release/app-release.apk`. Gate it:
   `$HOME/Library/Android/sdk/build-tools/37.0.0/aapt2 dump badging android/app/build/outputs/apk/release/app-release.apk | grep "^package"`
   must print `package: name='com.mugtaba.athan.fleettest'`; on `com.mugtaba.athan`
   bare, stop (PLAN.md section 10). Release `build.lock`.

2. Under `device-$3T_SERIAL.lock` (one hold for the whole device session):

   a. Install:
      ```
      adb -s $3T_SERIAL install -r android/app/build/outputs/apk/release/app-release.apk
      adb -s $3T_SERIAL shell pm list packages | grep fleettest
      ```
      Expect `Success` then the package name.
   b. Grants:
      ```
      adb -s $3T_SERIAL shell pm grant com.mugtaba.athan.fleettest android.permission.ACCESS_COARSE_LOCATION
      adb -s $3T_SERIAL shell pm grant com.mugtaba.athan.fleettest android.permission.ACCESS_FINE_LOCATION
      ```
      Verify with `adb -s $3T_SERIAL shell dumpsys package com.mugtaba.athan.fleettest | grep "ACCESS_"`:
      both `granted=true`.
   c. Capture:
      ```
      adb -s $3T_SERIAL logcat -c
      adb -s $3T_SERIAL logcat -v time ReactNativeJS:V '*:S' | grep --line-buffered '\[RD' > $HOME/athan-gitree/sessions/131/3t-rd.log &
      ```
   d. Launch: `adb -s $3T_SERIAL shell am start -n com.mugtaba.athan.fleettest/.MainActivity`.
      Wait for `[RD4]` and `[RD1]` END lines in `3t-rd.log`, polling the file every
      15 s. Expected within 60 s (RD1 may take 35 s): the four RD4 lines and the
      three RD1 lines; `ageMs` over 35000 in the RD1 fresh line names the stale
      fallback form (getPosition falls back to last known when no fresh fix
      arrives indoors). If `[RD4] skipped permission not granted` appears, the pm
      grants failed: re-run them, then cold-restart the probe:
      `input keyevent KEYCODE_HOME`, `am kill com.mugtaba.athan.fleettest`, then
      the `am start` line again (a bare `am start` only resumes a live process).
   e. RD5: `adb -s $3T_SERIAL shell pm revoke com.mugtaba.athan.fleettest android.permission.ACCESS_FINE_LOCATION`.
      Wait for `[RD5] END` (within 60 s). The lines owed: one `perm-watch` with
      `"accuracy":"reduced"`, the `permission read`, and `getPosition resolved` or
      `getPosition THREW`. If no `[RD5] perm-watch` line with `"accuracy":"reduced"` and no
      `[RD5] END` appear in 60 s, capture the absent form: `dumpsys package com.mugtaba.athan.fleettest | grep ACCESS_` plus the
      tail of `3t-rd.log`.
   f. Restore the grant:
      `adb -s $3T_SERIAL shell pm grant com.mugtaba.athan.fleettest android.permission.ACCESS_FINE_LOCATION`.
      The probe's waiter loop keeps reading permissions while RD2 is pending, so a
      `[RD5] perm-watch` line with `"accuracy":"full"` lands within 5 s. That line is
      R5.2's evidence.
   g. RD2: `adb -s $3T_SERIAL shell settings put secure location_providers_allowed -gps,-network`.
      Within 5 s `[RD2] BEGIN` appears. Capture the evidence twice, once at once and
      once after the screenshot (the dialog can win the race with the first dump):
      ```
      adb -s $3T_SERIAL shell dumpsys window | grep -E "mCurrentFocus|mFocusedApp" > $HOME/athan-gitree/sessions/131/rd2-focus.txt
      adb -s $3T_SERIAL exec-out screencap -p > $HOME/athan-gitree/sessions/131/rd2-dialog.png
      sleep 2
      adb -s $3T_SERIAL shell dumpsys window | grep -E "mCurrentFocus|mFocusedApp" >> $HOME/athan-gitree/sessions/131/rd2-focus.txt
      ```
      Read the dialog from the screenshot (reach evidence only). If the dialog is the
      GMS in-app form, tap its affirmative button by the coordinates measured from
      that screenshot: `adb -s $3T_SERIAL shell input tap X Y`. If Settings opened
      instead, the focus dump already proves it: restore the providers with
      `adb -s $3T_SERIAL shell settings put secure location_providers_allowed +gps,+network`,
      tap nothing, and re-foreground the probe so the promise resolves:
      `adb -s $3T_SERIAL shell am start -n com.mugtaba.athan.fleettest/.MainActivity`.
      Wait for `[RD2] resolved` and `[RD2] services after`.
   h. Verify services on: `adb -s $3T_SERIAL shell settings get secure location_providers_allowed`
      prints `gps,network` (or the probe's `services after true` line already does).
      Restore if the dialog path left them off.
   i. Leave the phone as found: `adb -s $3T_SERIAL uninstall com.mugtaba.athan.fleettest`,
      expect `Success`; `pm list packages | grep fleettest` prints nothing. Kill the
      logcat background job. Release the device lock.

3. Transcribe into `READINGS.md`: for each of RD4, RD1, RD5, RD2, the call, the
   verbatim `[RD...]` lines (position-free by construction), the dump or screenshot
   reference for RD2, the verdict, and the absent form. Then the LOG.md step entry
   with its `session:` line, the docs commit, the merge into `uat` under
   `uat.lock` (fetch, `node scripts/check-version-uniqueness.js`, `--no-ff`), and
   the main tree's `android/app/build.gradle` `versionName` sync under
   `build.lock`.

## Break script

None owed (no code). The step's honesty check: every verdict line quoted in
READINGS.md must appear verbatim in `sessions/131/3t-rd.log`; a verdict with no log
line is deleted before the commit.

## Review checklist

- The aapt2 gate line is quoted in READINGS.md.
- No coordinate, address or place name appears in any transcribed line.
- Every host-side state change (grants, services) has its restore line quoted.
- The RD2 focus lines name the focused window at the moments between call and
  resolution.

## Done when

All four reading sections exist in READINGS.md with their evidence, the phone is as
found, the locks are released, and the docs commit is merged into `uat`.
