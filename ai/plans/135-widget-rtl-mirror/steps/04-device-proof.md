# Step 4 — builds and the device proof on the 3T and the XS

**Requirements:** R1.1, R1.2, R3.1, R4.1, R5.1, R5.2
Weight: 3 (device; dispatched alone)

## Anchor check

None (this step touches no anchored file). It runs only after steps 1 to 3 are
merged to `uat`.

## Goal

Prove on glass, on both phones, under an Arabic app locale: the medium widget
mirrors (time left, name right on the 3T; the flipped tree on the XS), the Android
countdown label reads fixed Latin letters beside Latin digits, the iOS countdown
ticks the platform's Latin face, and English renders the settled faces. The
builds are the owner's deliverable; her read is the acceptance.

## Android build (the fleettest ritual; `build.lock` around every build step)

`build-mock.zsh` cannot produce the fleettest id (it hard-unsets
`EXPO_ANDROID_SUFFIX` and builds `com.example.athan` at versionCode 1000000, per
its own header), so the fleettest APK is built the way ticket 134's lane built
its proof, from build-bay content only after steps 1 to 3 are merged:

1. `git fetch -q origin uat`; confirm `uat` holds steps 1 to 3 merged and clean.
2. Scratch worktree `git worktree add --detach
   $HOME/athan-gitree/worktrees/plan-135 <merged-uat-sha>` from the main tree;
   symlink its `node_modules` to the main checkout's after verifying the two
   `yarn.lock` hashes match (the ticket-134 recipe).
3. In the scratch worktree, with the widget flags ON (`.env` from
   `.env.example` keeps `EXPO_PUBLIC_IOS_WIDGETS=1` and
   `EXPO_PUBLIC_ANDROID_WIDGETS=1`), `EXPO_PUBLIC_ENV=local`, and
   `EXPO_ANDROID_SUFFIX=fleettest` exported inside the prebuild command itself
   (never passed through a later step's environment):
   `npx expo prebuild -p android --no-install --clean`, then
   `cd android && TMPDIR=$HOME/athan-gitree/tmp-135-build ./gradlew
   assembleRelease --no-daemon -PreactNativeArchitectures=arm64-v8a`. Never two
   builds at once: no other Gradle, `export:embed` or `react-native-xcode`
   process may be alive when a build starts.
4. Gate before any install: `command -v aapt2` first (a missing tool reads as a
   false zero), then `aapt2 dump badging <apk> | grep "^package"` must print
   `package: name='com.example.athan.fleettest'`. Stop on anything else.
5. Remove the scratch worktree and its TMPDIR after the build; keep the logs and
   the APK under `$HOME/athan-gitree/sessions/135/`.

## 3T proof (every contact under `$HOME/athan-gitree/device-3T_SERIAL.lock`)

1. Read `e2e/device-atlas-oneplus3t.md` first; follow its launcher, widget-picker
   and placement mechanics exactly. Never tap Uninstall in the removal popup.
2. Install the APK, open the app once (the mock feed seeds), confirm the language
   row in Settings, switch the app language to Arabic (العربية). The convergence
   re-push re-bakes the widget props (logcat `WIDGET:` lines prove the push).
3. Read the placed medium widget (screenshot, `vision` transcription; never commit
   the screenshot). Expected under Arabic: the prayer list on the LEFT half with
   the TIME column leftmost and the Arabic names rightmost inside each row, the
   countdown trio on the RIGHT half, the countdown label `Nh Nm` with lowercase
   Latin h m beside unpadded Latin digits (never `س` `د`), the active pill under
   the next prayer. The small widget stays the centered trio with the same label
   law.
4. Switch the app language back to English, wait for the convergence push, read
   the widget again. Expected: the exact English face (name left, time right,
   `4h 20m`), indistinguishable from the 2.0.1013 build's face.
5. If the fleettest app carries no placed widget, place the medium one per the
   atlas (picker cell fully visible, 900 ms long-press, drops onto the home
   screen), then read.
6. Transcribe every read into `LOG.md` under this step's heading; the raw
   screenshots stay under `$HOME/athan-gitree/sessions/135/` (never committed).

## XS proof (every contact under `$HOME/athan-gitree/device-IPHONE_UDID.lock`)

The XS is the owner's phone. Her app data is never opened (no MMKV browse, no
notification settings inside the app beyond the language row this proof needs).
Restore as found: the app language returns to what it was (English unless her app
already sat in Arabic), placed widgets stay placed, nothing uninstalled.

1. Build the Release device app with widgets on, following the atlas's device
   build recipe (`EXPO_PUBLIC_IOS_WIDGETS=1` prebuild, plist check,
   `DEVELOPMENT_TEAM=<paid team> run:ios --configuration Release --device
   $IPHONE_UDID`), under the build lock. The atlas's signing row proves the
   installed base is the dev-signed `com.example.athan`, so the install upgrades
   her app in place, keeps her data and keeps her placed widgets. If the install
   is refused as a signing mismatch, STOP and use the `EXPO_IOS_SUFFIX`
   beside-install fallback (app.config.ts's iOS suffix block) instead, naming
   the wedge in LOG.md.
2. Install, open once, switch the app language to Arabic, foreground once more so
   the timeline re-pushes.
3. Read her placed widgets (home medium if she has one, a lock-screen one) via
   `pymobiledevice3 developer dvt screenshot`, `vision` transcription. Expected
   under Arabic: the medium's list column on the LEFT with times leftmost in each
   row, the hero on the RIGHT; the lock layout 1/3 halves flipped (name right,
   countdown left); the countdown ticking the untouched platform face (Latin digits and
   colons expected, `1:48`-shaped; any other digit script is transcribed and
   named in the row, never patched).
4. Switch the app language back to English, foreground once, read again: the
   settled English faces.
5. If widget placement automation wedges on the XS (row 39 recorded exactly that
   wedge), do not force it: leave the installed build carrying the fix, prove the
   iOS mirror on the iOS 18.5 simulator instead (below), and name her glass read
   as the acceptance in the row.
6. The confirmatory simulator read, never her phone's system settings: boot an
   iOS 18.5 simulator, set its system language to Arabic
   (`xcrun simctl spawn <udid> defaults write .GlobalPreferences AppleLanguages
   -array "ar"` plus `AppleLocale ar_AE`, reboot the sim), run the probe app from
   `~/athan-gitree/tmp-135-probe/` (or rebuild it for 18.5), screenshot, read the
   default timer row's digits, and transcribe them. Whatever the digits show
   (Latin expected on the evidence), CHANGE NOTHING: her 2026-10-18 amendment
   keeps the iOS countdown exactly as it is, and a non-Latin reading is named in
   the row for her veto, never patched.

## Green run

Both phones transcribed; the LOG.md entry carries every expected reading met, or
the exact deviation and its cause.

## Break script

None (a device step proves; it breaks nothing). The gates are the `aapt2` package
check and the atlas's own warnings.

## Version and commit

The readings commit on the lane branch as a docs-only commit (the version still
bumps: `<VERSION> - docs(widgets): 3T and XS widget reads under Arabic and English
(135 step 4)`), merged as steps 1 to 3. Evidence files stay untracked
(`~/athan-gitree/sessions/135/`).

## Review

The lead re-reads the transcriptions against R1.1, R1.2, R3.1, R4.1 and checks the
restoration note for the XS.

## Merge

As step 1.

## Done when

Both phones' readings are transcribed and match the criteria (or the named
deviation is recorded), the XS is restored as found, and every lock taken in this
step is released.
