# Step 2: the 3T measurement

Requirements: R2.1, R2.2
Weight: 3

Anchor check: as step 1. A count other than 1 is a STOP.

Goal: the rendered heights of the settings sheet's title, subtitle and one card title,
plus the Help modal's pinned question and answer, on the FleetTest mock build as found,
as node bounds from the layout engine, corroborated by one screenshot read per screen.

Branch: `step-137/oneplus3t` off `uat`, in the lane worktree. Files: this plan folder's
`LOG.md` and `FINDINGS-3T.md` (new, plan folder); evidence under
`$HOME/athan-gitree/sessions/137/` (dumps and transcriptions, never committed
screenshots).

Red tests: none. A device measurement step; the record is the deliverable.

The whole contact runs under `$HOME/athan-gitree/device-3T_SERIAL.lock`, taken before the
first adb command and removed the moment the last evidence file lands.

Change contracts:

1. Verify the vehicle: `adb -s 3T_SERIAL shell dumpsys package com.example.athan |
   grep -E "versionName" | head -1` prints a versionName; record it with the package id
   line from `adb -s 3T_SERIAL shell pm list packages | grep the owner`. Absent build or
   version below 2.0.811: D137.3's fresh-build branch, `$HOME/athan-gitree/bin/build-mock.zsh`
   under `build.lock`, the aapt2 gate stopping on any id other than `name='com.example.athan'`,
   install under the device lock. Package id other than `com.example.athan`: STOP per
   PLAN.md section 2.2.
2. Wake and reach the sheet: `input keyevent KEYCODE_WAKEUP`, swipe up if locked (no PIN
   is set on the build phone), home, tap the Athan dock icon at (540, 1747), wait 2
   seconds, tap the settings button at (540, 1830). One screenshot confirms the sheet:
   the title row and subtitle read as Arabic when the app language is ar.
3. Language branch: when the face is English, open the language row (`اللغة`, located
   per PLAN.md section 7 by one screenshot read, dump text being stale), pick the Arabic
   option (`العربية`), wait 3 seconds for the in-place remount, and note the switch in
   the LOG. The 3T is the build phone; in-app switches are normal contact.
4. Read the surfaces, sheet settled for one full second first:
   `adb -s 3T_SERIAL shell uiautomator dump /sdcard/137-sheet.xml`, pull it, then parse
   the bounds of: the title text node (the sheet header's large text), the subtitle text
   node directly under it, and the first card title node. Text attributes in the dump may
   be stale on Android 9; identify nodes by tree position and corroborate each with the
   screenshot: `adb -s 3T_SERIAL exec-out screencap -p >
   $HOME/athan-gitree/sessions/137/3t-sheet.png`. The image-capable reader reads the png
   and transcribes what it shows into the LOG; the png never leaves `sessions/`.
5. Read the controls: from the settings sheet, tap the Help row (`المساعدة` inside the
   `أخرى` card, located per PLAN.md section 7; the WhatsNew row may hide, so never a
   fixed position), tap the first question to open it, settle one second, dump `137-help.xml`, pull, parse the open question
   node and the answer text node, screenshot `3t-help.png` as corroboration.
6. Record into `FINDINGS-3T.md`, one line per surface: node label, bounds string verbatim,
   height in px, nominal size and face from the anchors, computed em at scale 2.625, and
   the nearest candidates from `EXPECTATIONS.md` with the px gaps. Any surface matching
   no candidate within 1 pixel goes to the symptom table's last row.
7. Restore: when the language was switched, switch it back and verify the face; leave the
   phone on home, screen on, build as found. `settings get global auto_time` must print
   `1`.

Green run: `FINDINGS-3T.md` holds five surface lines plus the build line; the LOG holds
the transcriptions; the device lock is removed.

Break script: none. The reviewer re-derivation recomputes em ratios from the recorded
bounds strings.

Version and commit: bump the patch version in `app.json` and `package.json` under
the version and commit locks; the gradle file never exists in this worktree. Message:
`<VERSION> - docs(plans): 137 step 2, the 3T line-box readings (unpinned surfaces, pinned controls)`.
Add by name: the plan folder's `FINDINGS-3T.md` and `LOG.md`, `ai/plans/README.md` (row
to `IN PROGRESS, step 2`), the two committed version files, `app.json` and
`package.json`.

Review: read the diff cold. Every number traces to a bounds string or a transcription in
the LOG; no number arrives from memory.

Merge: as step 1, under the `uat` lock; the gradle sync is the lead's main-tree
action under the build lock.

Done when: the readings and the restore note are committed, and the row reads
`IN PROGRESS, step 2`.
