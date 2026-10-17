### Step 4 - the logcat stream, the CLI serial install, the unchanged phone (E1, E4)

Requirements: R3.1, R5.1, R5.2, R5.3
Weight: 3

Anchor check: the step-1 anchors still count exactly 1.

Goal: the documented install-and-launch path runs by serial on a real phone,
and a running logcat stream survives it.

Branch: `lane/133`; the commit is the LOG entry and evidence pointers.

Files: `ai/plans/133-avd-lane/LOG.md`, the three version files, evidence under
`$HOME/athan-gitree/sessions/133/`.

Red tests: the before-state is the proof's baseline: `adb devices -l` records
the 3T's `transport_id`; `dumpsys package` records `versionName=2.0.908`;
`dumpsys alarm | grep -c com.mugtaba.athan` records the armed count; the
logcat file does not exist yet.

Change contracts (host and phone state):

1. Take `$HOME/athan-gitree/device-<SERIAL>.lock` (the 3T's real serial,
   mkdir pattern) for the whole step; defer in 15-second cycles when held.
2. Record the baseline of R5.2 and the transport id; start the stream in the
   background:
   `adb -s 3T_SERIAL logcat -v threadtime > $HOME/athan-gitree/sessions/133/e4-logcat-3t.txt 2>&1 &`
   recording the pid and the file's first line count.
3. From the main tree (clean, on `uat`), run the documented path (R5.1):
   `npx expo run:android --binary <the 2.0.908 apk> --device 3T_SERIAL --no-bundler`,
   captured to `sessions/133/e1-install.txt` with its exit code. Expected:
   exit 0, an install line then a launch line, no prebuild or gradle line,
   and the app foregrounds on the phone.
4. Verify the stream survived (R3.1): the pid lives, the file appended lines
   timestamped after the install, and `adb devices -l` shows the same
   `transport_id` (no server restart). Then stop the stream politely
   (`kill <pid>`), never `adb kill-server`.
5. Verify the phone (R5.2): `versionName=2.0.908` and the same armed-alarm
   count as baseline; the app's data survives (the same-version `install -r
   -d` keeps it).
6. Verify the host (R5.3): the pre-command `pgrep -fl "node.*metro"` record
   gains no new line.
7. Leave the app foregrounded or HOME-pressed (never force-stopped on the
   phone; the executor rule), release the device lock, and confirm the main
   tree's `git status` is clean.

Green run: `e1-install.txt` ends `exit: 0` with no gradle line;
`e4-logcat-3t.txt` holds post-install lines; the two `dumpsys` reads match
their baselines.

Break script: `grep -ci "gradle" sessions/133/e1-install.txt` must print 0;
`grep -c "exit: 0"` on it must print 1; the version reads before and after
must both print 2.0.908 into the LOG; the alarm counts must be equal. Any
miss fails the step.

Version and commit: union max plus 1, message
`<VERSION> - docs(plans): ticket 133 step 4 (E1, E4): the serial install path proven on the 3T, the logcat stream survived`.

Review checklist: the LOG and commits name the phone by `3T_SERIAL` only; the
capture files stay uncommitted; the phone's alarm times are never written into
any committed file (the count alone is the claim).

Merge: as step 1.

Done when: R3.1 and R5.1 to R5.3 hold with their evidence and the device lock
is released.
