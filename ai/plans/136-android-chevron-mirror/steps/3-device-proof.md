### Step 3 - the fixed FleetTest build, 3T proof both directions

Requirements: R3.2, R3.3 (R1.1's device-side no-op)
Weight: 3 (device plus build; dispatches alone; lane-run per the build-bay
rule: the executor drives the phone, the lane owns the build)

Anchor check: none (no repo anchors change after step 2).

Goal: the merged fix proven on the 3T under both switches, and the build left
installed for the owner's read.

Build, lane-run in the main tree under `$HOME/athan-gitree/build.lock` (never
two builds at once; `build-mock.zsh` cannot produce a FleetTest id because it
hard-unsets `EXPO_ANDROID_SUFFIX`, measured in the qibla handoff): the
row-134 recipe.

1. Resolve the merged uat sha: `git -C $HOME/repos/rn.athan.uk rev-parse uat`.
2. Scratch worktree `git -C $HOME/repos/rn.athan.uk worktree add --detach
   $HOME/athan-gitree/worktrees/fleettest-136 <sha>`; symlink `node_modules`
   to the main checkout's after confirming the two `yarn.lock` hashes match.
3. Write the worktree's `.env` from the committed `.env.example` with the
   ENV and API_KEY lines removed and these appended:

   ```
   EXPO_PUBLIC_ENV=local
   EXPO_PUBLIC_API_KEY=key
   ```

   (the `.env.example` body already carries the package, app-id and widgets
   lines the standard mock build relies on; nothing else is added).
4. Prebuild with the suffix exported in this shell, never as an argument:

   ```bash
   cd $HOME/athan-gitree/worktrees/fleettest-136
   export EXPO_ANDROID_SUFFIX=fleettest EXPO_NAME_SUFFIX=FleetTest
   CI=1 npx expo prebuild -p android --no-install --clean \
     > $HOME/athan-gitree/sessions/136/logs/prebuild.log 2>&1
   ```

   Expected: the log ends without error and
   `grep "applicationId" android/app/build.gradle` prints
   `applicationId 'com.example.athan.fleettest'`.
5. Build, same exported suffix in the same shell:

   ```bash
   cd $HOME/athan-gitree/worktrees/fleettest-136/android
   TMPDIR=$HOME/athan-gitree/worktrees/.tmp-fleettest-136 \
     ./gradlew assembleRelease --no-daemon -PreactNativeArchitectures=arm64-v8a \
     > $HOME/athan-gitree/sessions/136/logs/gradle.log 2>&1
   ```

   Expected: the log's tail carries `BUILD SUCCESSFUL`.
6. Verify the artefact before it leaves the build tree:

   ```bash
   BT=$HOME/Library/Android/sdk/build-tools/37.0.0
   [ -x $BT/aapt2 ] || { echo "aapt2 missing"; exit 1; }
   $BT/aapt2 dump badging \
     $HOME/athan-gitree/worktrees/fleettest-136/android/app/build/outputs/apk/release/app-release.apk \
     | grep "^package"
   ```

   Expected, exact: `package: name='com.example.athan.fleettest'
   versionCode='1000000' versionName='<the merged version>'`. Anything else:
   STOP, install nothing.
7. Copy to `$HOME/athan-gitree/builds/fleettest-136/athan-fleettest-<version>.apk`,
   remove the scratch worktree and its TMPDIR, release `build.lock`.

Proof on the 3T, every contact under `$HOME/athan-gitree/device-3T_SERIAL.lock`:

8. Install with `adb -s 3T_SERIAL install -r <apk>`, read back
   `adb -s 3T_SERIAL shell dumpsys package com.example.athan.fleettest |
   grep versionName` and require the merged version. Throwaway launch, HOME,
   `am kill`, launch again (the What's New dismissal).
9. English read first (the app is left in English from step 1): open
   Settings, settle, capture `sessions/136/<version>-en-settings.png`. Read:
   every chevron points RIGHT, the layout reads identical to step 1's
   `2.0.996-en-settings.png` (same rows, same positions, same sizes; R3.3).
10. Switch to Arabic with step 1's `$TMPDIR/136-ar-hold.yaml` flow, open
    Settings, capture `<version>-ar-settings.png`, scroll once, capture
    `<version>-ar-settings-scrolled.png`. Read: every chevron on every
    visible row points LEFT (R3.2), the rest of the sheet mirrored as in
    step 1 (the mirror itself is unchanged; only the chevron turns).
11. Switch back to English with the flow's second half, open Settings,
    capture `<version>-en-return-settings.png`. Read: every chevron points
    RIGHT again.
12. Press HOME, `am kill`, leave the build installed, automatic time on,
    remove the device lock.

LOG.md, under `### Step 03 — done`: the build report (package, versionName,
BUILD SUCCESSFUL line), each read transcribed row by row, and the three
criteria met.

Version and commit: the docs commit bumps the version next after step 2's and
carries `LOG.md` and the queue row set to `IN PROGRESS, step 3`, message
`<VERSION> - docs(plans): ticket 136 step 3, the fix proven on the 3T both
directions`. Merge under `uat.lock`; sync the main tree's
`android/app/build.gradle` under `build.lock`.

Done when: the reads are transcribed, the phone holds the fixed build, the
commit is merged, and no lock is held.
