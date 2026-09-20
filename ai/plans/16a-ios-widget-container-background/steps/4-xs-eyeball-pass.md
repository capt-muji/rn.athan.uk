# Step 4: XS build and the owner's eyeball pass (device)

0. **Anchor check:** none for this step (no code changes). The pre-flight for `<k>=4` covers the shared checks.
1. **Goal:** One Release build on the XS carrying steps 1 to 3, and the owner's eyes confirming: all 12 kinds render, the four lock kinds centre, the dark kinds wear the verdict, and a freshly placed widget with the app closed shows content, not the placeholder.
2. **Branch:** none. A build off `uat-2` at the current tip. The working tree stays clean.
3. **Files:** none (the version bump for the build follows the ritual below but is NOT committed as its own step; it rides step 8's docs commit if still uncommitted, or is already the tip's version. Bump in `app.json` + `package.json` + `android/app/build.gradle` per the ritual, leave the change in the tree, and include it in step 8's commit).

   Exception: if `uat-2`'s tip version already equals what the build stamps (no new bump needed because steps 2/3 bumped), skip the bump. The Info.plist version of a dev-signed side load is cosmetic; the ritual is kept anyway for consistency.
4. **Tests first (red):** None. No code changes.
5. **Change (the ritual, from PLAN section 7 and LOG §9):**
   1. `date +%H:%M` first: no build starts after 23:45 (the midnight job clears DerivedData and node_modules).
   2. Version bump in `app.json` FIRST if bumping, then the build:
      ```
      cd /Users/muji/repos/rn.athan.uk && \
      export EXPO_PUBLIC_WIDGETS=1 EXPO_PUBLIC_ENV=local EXPO_PUBLIC_API_KEY=key && \
      xcodebuild -workspace ios/Athan.xcworkspace -scheme Athan -configuration Release \
        -destination 'id=00008020-0015585C22D2002E' DEVELOPMENT_TEAM=9V3WAU9Z54 \
        -allowProvisioningUpdates build > "$TMPDIR/16a-xs-build.log" 2>&1
      ```
      Run in the background; success ends `** BUILD SUCCEEDED **`. `app.json` changed only in version, so NO prebuild/pod install cycle is needed; if it were, `npx expo prebuild -p ios --no-install` then `(cd ios && pod install)`.
   3. Install, launch, reboot:
      ```
      xcrun devicectl device install app --device 00008020-0015585C22D2002E \
        ~/Library/Developer/Xcode/DerivedData/Athan-eiktisvjxxpitlewblhekjwkglra/Build/Products/Release-iphoneos/Athan.app
      xcrun devicectl device process launch --terminate-existing --device 00008020-0015585C22D2002E com.mugtaba.athan
      sleep 8
      xcrun devicectl device reboot --device 00008020-0015585C22D2002E
      ```
      The reboot is REQUIRED (repeated installs over the same bundle id drop the widget extension from the gallery until restart; LOG §10.6).
   4. After the reboot, relaunch the app once (it pushes the timelines), press HOME.
6. **Green (the owner's checkpoints, in order).** Ask the owner to look and answer each; record the answers in `LOG.md`:
   - **All kinds render:** "On the home screen and lock screen, do all 12 widgets show live content (prayer name, ticking countdown, day footer)? Any black widget or placeholder?" Expected: all 12 live, ticking.
   - **Lock centring:** "On the lock screen, do all four Athan widgets sit horizontally centred in their slots?" Expected: yes, both layouts. If NO: section 2.2's centring question, STOP.
   - **Nebula verdict on glass:** "Do the dark kinds look as you chose in the iteration round?" Expected: yes.
   - **First placement:** "With Athan closed (swipe it away first), add ONE more widget from the gallery, any kind you fancy keeping. What shows within a few seconds: live content or the 'Open to load times' placeholder?" Expected: live content within seconds (the provider reads the stored timeline on placement). If the placeholder shows and persists past 30 seconds: section 2.2's placement question, STOP. The owner may remove the extra widget afterwards; their choice.
   - **Crash counter:** `pymobiledevice3 crash ls --udid 00008020-0015585C22D2002E | grep ExpoWidgets | wc -l` recorded (checkpoint baseline: 9). A new `cpu_resource` report during this passive pass is recorded in `LOG.md`; two or more means the steady-state kill question goes to the owner (if the verdict was keep-as-runtime-blur, branch B of step 3 becomes the recommended follow-up).
7. **Breaks:** None.
8. **Version and commit:** none in this step.
9. **Review:** none beyond recording the owner's answers.
10. **Merge:** none.
11. **Done when:** every checkpoint's answer is recorded in `LOG.md`; the phone is on this build, rebooted, automatic time on, unlocked, Athan open, Stay awake on.
