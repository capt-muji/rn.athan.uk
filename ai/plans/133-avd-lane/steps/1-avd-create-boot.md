### Step 1 - the image, the AVD, the boot, the panel read (E2)

Requirements: R1.1, R1.2, R1.3
Weight: 3

Anchor check: `readme-30fps-heading.md`, `agents-atlas-bullet.md`,
`smoke-flow.md` each count exactly 1 in their files at the pre-flight sha.

Goal: the adopted lane's asset exists and boots at the 3T's panel class.

Branch: none beyond `lane/133`; this step's commit is the LOG.md entry, the
evidence pointer and the queue row set to IN PROGRESS.

Files: `ai/plans/133-avd-lane/LOG.md`, `ai/plans/README.md` (row 133 status
cell), the three version files (bump), `$HOME/athan-gitree/sessions/133/`
(evidence, never committed).

Red tests: host-state greps that must fail before the step and pass after:
`emulator -list-avds | grep -c athan-smoke-28` prints 0 before, 1 after
(R1.1); `adb devices | grep -c emulator-5554` prints 0 before the boot, 1
after (R1.2's vehicle).

Change contracts (host state, not repo):

1. `yes | sdkmanager --licenses` only if the install reports a licence gap
   (the symptom table governs).
2. `sdkmanager --install "system-images;android-28;google_apis;arm64-v8a"`
   - lawful under her ruling recorded in the row; record the downloaded size
   (`du -sh` of the image dir) closing row 122's U2.
3. `echo no | avdmanager create avd -n athan-smoke-28 -k "system-images;android-28;google_apis;arm64-v8a" -d pixel --force`
   (the piped `no` answers the custom-hardware questionnaire; the config
   write below supplies the panel), then write into
   `$HOME/.android/avd/athan-smoke-28.avd/config.ini`:
   `hw.lcd.width=1080`, `hw.lcd.height=1920`, `hw.lcd.density=420`,
   `hw.ramSize=2048`, `hw.heapSize=256`, `disk.dataPartition.size=6G`,
   `hw.keyboard=yes`, `snapshot.present=true`. The `-d pixel` profile is a
   carrier for required fields only; the three `hw.lcd` and density lines
   override its panel to the 3T's measured class.
4. D11 sibling-build check, then boot headless:
   `emulator -avd athan-smoke-28 -no-window -no-audio -no-boot-anim -gpu swiftshader_indirect`
   in the background, recording the start epoch.
5. Poll in 15-second cycles: `adb -s emulator-5554 shell getprop
   sys.boot_completed` prints 1 (and `getprop init.svc.bootanim` prints
   `stopped`) within 180 seconds of the emulator process appearing in
   `adb devices`; record the elapsed seconds (R1.2).
6. `adb -s emulator-5554 shell wm size` prints `Physical size: 1080x1920` and
   `wm density` prints `Physical density: 420` (R1.3). A differing density
   read is fixed by the config line, a reboot, and a re-read; a second
   mismatch is a `STOP:` return.
7. Kill the emulator before the step ends: `adb -s emulator-5554 emu kill`,
   poll in 15-second cycles until `adb devices` no longer lists it; only if
   the graceful kill fails, `pkill -f "qemu-system.*athan-smoke-28"`.

Green run: `sessions/133/e2-boot.txt` holds, verbatim: the sdkmanager install
tail, the image size, the AVD creation output, the boot start and complete
epochs with elapsed seconds, the two `wm` reads, and the kill confirmation.

Break script: `emulator -list-avds | grep -c athan-smoke-28` must print 1;
`test ! -d $HOME/.android/avd/athan-smoke-28.avd` must fail; the evidence
file must contain `sys.boot_completed` reached inside 180 s (grep the elapsed
line). Any miss fails the step.

Version and commit: union max plus 1 (D10), message
`<VERSION> - docs(plans): ticket 133 step 1 (E2): the image, athan-smoke-28, boot and panel proven`.

Review checklist: the evidence file carries no identifier beyond the
placeholder rules (no phone serials); the LOG entry opens
`### Step 01 — done` and ends with the `session:` line.

Merge: into `uat` under `uat.lock` in the main tree, `--no-ff`, after the
uniqueness gate; sync the main tree's gitignored `android/app/build.gradle`
`versionName` under the build lock.

Done when: R1.1, R1.2 and R1.3 hold with their evidence, the emulator is
dead, and the commit is merged.
