### Step 3 - the install, the throwaway launch, the flow replay, the disposability proof (E5)

Requirements: R4.1, R4.2
Weight: 3

Anchor check: `smoke-flow.md` counts exactly 1 (the flow file is this step's
input and must be untouched).

Goal: a real Maestro flow from `e2e/flows/` replays on the AVD, and the AVD
proves itself disposable by wiping the app and replaying.

Branch: `lane/133`; the commit is the LOG entry and evidence pointers.

Files: `ai/plans/133-avd-lane/LOG.md`, the three version files, evidence under
`$HOME/athan-gitree/sessions/133/`.

Red tests: host-state greps: before the step, `adb devices` lists no emulator
(it stays dead between steps); after the boot, the install must first fail
with `adb -s emulator-5554 shell pm list packages | grep -c com.mugtaba.athan`
printing 0 (nothing installed), then print 1 after the install.

Change contracts (host state):

1. D11 sibling-build check, then boot as step 1 (headless) and wait to
   `sys.boot_completed=1`.
2. Install the 2.0.908 APK onto the emulator:
   `adb -s emulator-5554 install -r -d $HOME/athan-gitree/worktrees/prod-build/android/app/build/outputs/apk/release/app-release.apk`
   printing `Success`.
3. Throwaway launch (the What's-New gotcha): `adb -s emulator-5554 shell am
   start -n com.mugtaba.athan/.MainActivity`, wait 15 seconds, read one
   screenshot; when the location permission dialog overlays, tap its measured
   DENY button once (the atlas's Android 9 dialog class; measure the button
   from the screenshot, record the coordinate in the LOG as the AVD's one
   measured point), force-stop the app
   (`adb -s emulator-5554 shell am force-stop com.mugtaba.athan`; on the
   disposable emulator force-stop is safe).
4. Replay: `export PATH="$HOME/.maestro/bin:$PATH"; maestro --device
   emulator-5554 test e2e/flows/smoke.yaml` from the main tree, captured to
   `sessions/133/e5-smoke.txt` ending in Maestro's pass summary (R4.1). When
   Maestro's flag differs, read `maestro --help` once, use the device-select
   flag it names, and record the exact invocation in the capture.
5. Disposability: `adb -s emulator-5554 uninstall com.mugtaba.athan`
   printing `Success`, reinstall the same APK, throwaway launch once more
   (dialog already granted or re-measured), force-stop, replay `smoke.yaml`
   again captured to `sessions/133/e5-disposable.txt` (R4.2).
6. Kill the emulator as step 1 before the step ends.

Green run: both captures end in Maestro's flow-passed summary with the flow
count 1 and 0 failures.

Break script: `grep -c "smoke" sessions/133/e5-smoke.txt` at least 1 and the
capture's final summary line names 0 failures (grep the failure count as
captured); the same for `e5-disposable.txt`; `pgrep -f qemu-system must print
nothing after the step (the emulator is dead). Any miss fails the step.

Version and commit: union max plus 1, message
`<VERSION> - docs(plans): ticket 133 step 3 (E5): smoke.yaml replays on the AVD and the AVD proves disposable`.

Review checklist: no screenshot is committed (the evidence rule); the LOG
records the dialog coordinate by emulator panel, not by any phone.

Merge: as step 1.

Done when: R4.1 and R4.2 hold with their evidence and the emulator is dead.
