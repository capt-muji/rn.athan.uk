# Step 2b: the 3T home and overlay measurement

Requirements: R2.1, R2.2 (both stand as recorded), R2.3
Weight: 3. A device step, dispatches alone.

Anchor check: as step 1, plus `day-styles.txt`, `prayer-rowname.txt`,
`countdown-word.txt` and `explanation-box.txt`, each counting 1. A count other
than 1 is a STOP.

Goal: the home page's and the Extras overlay's rendered line boxes on the 3T,
the same surfaces step 3b reads on the XS, so the verdict carries same-surface
pairs (D137.11). Step 2's sheet readings stand unchanged.

Branch: `step-137/3t-home` off `uat`, in the lane worktree. Files: this plan
folder's `LOG.md` and `FINDINGS-3T-HOME.md` (new); evidence under
`$HOME/athan-gitree/sessions/137/`.

Red tests: none. A device measurement step.

The whole contact runs under `$HOME/athan-gitree/device-3T_SERIAL.lock`, taken
before the first adb command and removed after the last evidence file lands.

Change contracts:

1. Preflight: copy `scripts/preflight-137.sh` to `$TMPDIR`, run from the
   worktree root on `lane/137`; it ends `PREFLIGHT OK` with the 3T attached.
2. Vehicle: as step 2, unchanged. `pm list packages | grep the owner` prints
   both ids; `dumpsys package com.example.athan` versionName at or past
   2.0.811; no fresh build, no install. Record the versionName and the wm size.
3. Route and face: WAKEUP, keyguard swipe, HOME, the dock icon at (540, 1747),
   2s. The home screen shows the Standard page (six prayer rows). Record the
   arrival language from the face (`الإعدادات` button label, `لندن، المملكة
   المتحدة` location label). When the language is not ar, STOP and yield to
   the lead: step 2 found ar and restored nothing, so a changed language is a
   state change this step does not own.
4. Home reads, the step-2 instrument (`maestro --udid <serial> hierarchy`, two
   independent captures agreeing byte for byte on every bound; `uiautomator
   dump` stays the refused rung it was on Android 9):
   - the day location label `لندن، المملكة المتحدة`, 16 Rubik-Regular,
     unpinned
   - the day date label (the Hijri or Gregorian form the screen shows), 18
     Regular, unpinned
   - one prayer row name, 18 Regular, unpinned
   - one row time, 18 Regular, unpinned, Latin digits
   - the countdown word beside the countdown digits, 17 Regular, unpinned
   Then `adb -s 3T_SERIAL exec-out screencap -p >
   $HOME/athan-gitree/sessions/137/3t-home.png` for the vision corroboration.
5. The overlay: swipe one page to the Extras schedule (under RTL the Extras
   page sits left; the tree confirms the page by the Extras row labels),
   settle, tap an extra row that is not a passed Istijaba, 1s, then two
   hierarchy captures of:
   - the explanation title, the extra prayer's Arabic name, 18 Rubik-Medium,
     unpinned
   - the explanation body, the Arabic explanation sentence, 16 Regular,
     pinned 24, multi-line: record the whole node's bounds; the lead's vision
     read fixes the line count later, and the findings divide by it
   Then `3t-overlay.png` the same way. Tap the SAME row again
   (`getRowPressAction` closes), verify from the tree that the overlay closed,
   swipe back to the Standard page, verify the six-row face.
6. Record into `FINDINGS-3T-HOME.md`: one line per surface, node bounds
   verbatim, height px, nominal size and face, computed em at 2.625, nearest
   candidate with px gap from the extended EXPECTATIONS.md table, the pin line
   for the body (bounds divided by the vision line count once the lead records
   it, marked pending until then), plus the versionName line, the arrival
   language line and the wm size line.
7. Restore: the overlay closed and verified, the Standard page shown and
   verified, HOME, screen on, build and language as found, `settings get
   global auto_time` prints 1. Device lock removed after the last evidence file
   lands.

Green run: `FINDINGS-3T-HOME.md` holds seven surface lines plus the vehicle and
language lines; the LOG holds the arrival and restore states.

Break script: none. The reviewer re-derives em ratios from the recorded bounds.

Version and commit: as step 2. Message: `<VERSION> - docs(plans): 137 step 2b,
the 3T home and overlay line boxes`.

Merge: as step 1, under the `uat` lock; the gradle sync is the lead's
main-tree action under the build lock.

Done when: the readings and the restore note are merged, and the row reads
`IN PROGRESS, step 3b`.
