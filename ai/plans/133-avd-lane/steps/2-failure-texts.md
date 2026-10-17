### Step 2 - the serial-miss and zero-device failure texts (E3)

Requirements: R2.1, R2.2
Weight: 3

Anchor check: the step-1 anchors still count exactly 1 (nothing this step
touches edits the repo).

Goal: an agent who runs the CLI install path with no matching device sees
actionable failure text, captured verbatim.

Branch: `lane/133`; the commit is the LOG entry and evidence pointers.

Files: `ai/plans/133-avd-lane/LOG.md`, the three version files, evidence under
`$HOME/athan-gitree/sessions/133/`.

Red tests: none on repo state; the captures are the artefacts. Before each
run, `adb devices` is recorded so the failure text is read against a known
device list.

Change contracts (host state):

1. From the main tree (`$HOME/repos/rn.athan.uk`, clean, on `uat`):
   `npx expo run:android --binary $HOME/athan-gitree/worktrees/prod-build/android/app/build/outputs/apk/release/app-release.apk --device bogus-serial-1234 --no-bundler > $HOME/athan-gitree/sessions/133/e3a-serial-miss.txt 2>&1; echo "exit: $?" >> ...e3a-serial-miss.txt`.
   The command must exit non-zero and the capture must contain the device
   list plus the advice line naming `adb devices` (R2.1).
2. Isolated server: `ANDROID_ADB_SERVER_PORT=5038 adb start-server`, record
   `ANDROID_ADB_SERVER_PORT=5038 adb devices` (the header only, zero
   devices), then the same CLI command with `ANDROID_ADB_SERVER_PORT=5038`
   exported, captured to `e3b-zero-devices.txt` with its exit code (R2.2).
   When the capture still names the attached phone, record the variant VOID
   with the observed output and no retry (D5).
3. Teardown: `ANDROID_ADB_SERVER_PORT=5038 adb kill-server`; confirm port
   5038 holds no listener. The main server on 5037 is never touched.
4. No emulator and no phone is contacted by this step beyond the reads the
   CLI itself does against the live server (device discovery).

Green run: both captures exist, non-empty, each ending with its exit line;
`e3a-serial-miss.txt` contains the advice text; the main `adb devices` list
is unchanged before and after (the 3T still `device`).

Break script: `grep -c "adb devices" sessions/133/e3a-serial-miss.txt` must
print at least 1; `grep -c "exit: 0"` on the same file must print 0; the
port-5038 listener check must print nothing. Any miss fails the step.

Version and commit: union max plus 1, message
`<VERSION> - docs(plans): ticket 133 step 2 (E3): the serial-miss and zero-device failure texts captured`.

Review checklist: the captures carry no secrets and no phone serials beyond
the placeholder rule's reach (a serial inside a captured adb listing stays in
the uncommitted evidence, and the LOG names it by placeholder only).

Merge: as step 1.

Done when: R2.1 and R2.2 hold with their evidence and the isolated server is
dead.
