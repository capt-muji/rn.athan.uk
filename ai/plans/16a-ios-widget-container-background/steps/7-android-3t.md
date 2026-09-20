# Step 7: Android compile and 3T install (device)

0. **Anchor check:** none for this step.
1. **Goal:** Everything since the 15b reset compiles for Android and installs clean on the OnePlus 3T; the owner confirms the widgets look right (day-only footers, the AFooter change, no regression from the iOS-side work).
2. **Branch:** none. A build off `uat-2`'s tip.
3. **Files:** none committed. The fleettest prebuild rewrites the gitignored `android/` tree.
4. **Tests first (red):** None.
5. **Change (the 3T ritual, per `ai/AGENTS.md` section 6, verbatim order):**
   1. Version: `uat-2`'s current version already matches `app.json` (steps 2/3 bumped it); if step 4 left an uncommitted bump in the tree, keep it.
   2. Prebuild with the fleettest env REQUIRED on prebuild too:
      ```
      EXPO_ANDROID_SUFFIX=fleettest EXPO_NAME_SUFFIX=FleetTest npx expo prebuild -p android --no-install
      grep -n versionName android/app/build.gradle   # must show the app.json version
      ```
   3. Build:
      ```
      EXPO_ANDROID_SUFFIX=fleettest EXPO_NAME_SUFFIX=FleetTest npx expo run:android --variant release
      ```
      Background it; kill the CLI at "Installing"; poll `adb -s 8f7ada76 shell dumpsys package com.mugtaba.athan.fleettest | grep lastUpdateTime` until settled; launch with a DOUBLED `am start` (first start after install lands on the launcher, the second sticks). The Gradle/AGP mismatch from session 13's findings blocks Debug builds from the main checkout; Release via this ritual is the proven path. If the build fails at Gradle: STOP and ask (section 10).
   4. The app launches on the mock data (the `.env` carries `EXPO_PUBLIC_ENV=local`); it pushes the Android widget snapshots; `armWidgetRefreshChain` arms.
   5. `adb -s 8f7ada76 logcat -d | grep -c "WIDGET:"` shows the two snapshot pushes logged (Standard + Extras) — actually pino logs are dev-only; the Release build prints none, so the logcat check instead greps for crashes: `adb -s 8f7ada76 logcat -d | grep -iE 'fatal|AndroidRuntime.*athan' | wc -l` expected `0`.
6. **Green (the owner's checkpoints):** the owner looks at the 3T:
   - "Do the widgets show live content with the day-only footer (like Sat or Raj 1), no city, no dots?" Expected: yes.
   - "Any widget stuck on its loading layout or blank?" Expected: none.
   Record both answers in `LOG.md`.
7. **Breaks:** None.
8. **Version and commit:** none in this step.
9. **Review:** none beyond the recorded answers.
10. **Merge:** none.
11. **Done when:** the build succeeded, the install settled, the doubled launch stuck, the crash grep is 0, the owner's two answers are recorded; the phone stays on this build with automatic time on, unlocked, Athan open, Stay awake on.
