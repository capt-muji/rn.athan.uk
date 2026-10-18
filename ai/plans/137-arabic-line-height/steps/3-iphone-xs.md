# Step 3: the XS measurement, read-only

Requirements: R3.1, R3.2
Weight: 3

Anchor check: as step 1. A count other than 1 is a STOP.

Goal: the same surfaces' rendered frames on the owner's iPhone XS, the restored app as
found, read-only contact, the app left exactly as found.

Branch: `step-137/iphone-xs` off `uat`, in the lane worktree. Files: this plan folder's
`LOG.md` and `FINDINGS-XS.md` (new, plan folder); evidence under
`$HOME/athan-gitree/sessions/137/`.

Red tests: none. A device measurement step.

The whole contact runs under `$HOME/athan-gitree/device-IPHONE_UDID.lock`, taken before
the first devicectl or agent-device command and removed the moment the app is terminated.

Change contracts:

1. Resolve the device and the build: `xcrun devicectl list devices` prints a line with
   `IPHONE_UDID`; `xcrun devicectl device info apps --device IPHONE_UDID` yields the Athan app's installed version. A refused
   list route is a void per PLAN.md section 7's void protocol; the lead adjudicates
   before the step continues. Below 2.0.811: record the version, stop this step per D137.5, and say so in
   the LOG.
2. Launch the app: `xcrun devicectl device process launch --device IPHONE_UDID
   com.example.athan`. Rows inside the app are found by the ar labels of PLAN.md
   section 7 through label-matched snapshot refs. Read the face: the app language shows in the
   settings sheet's rows. Record which language was found; that state is what gets
   restored.
3. Language branch, D137.4: when the found language is not ar, open settings, open the
   language row, pick the Arabic row, wait out the in-process relaunch, measure, then
   switch back the same way and verify the face. Exactly one round trip. When it is
   already ar, no switch happens and the LOG says so.
4. Open the settings sheet, settle one second (the sheet's settle animation), then read
   frames: an agent-device snapshot of the static sheet returns refs with frames for the
   title, the subtitle and the first card title. When the snapshot wedges or returns no
   frames, fall back to `pymobiledevice3 developer dvt screenshot --udid IPHONE_UDID >
   $HOME/athan-gitree/sessions/137/xs-sheet.png` and read the pixels; the reader
   transcribes, and the LOG records the fallback per the symptom table.
5. Open the Help modal from the settings sheet, open the first question, settle, read the
   question's and the answer's frames (or pixels by the same fallback).
6. Record into `FINDINGS-XS.md`: one line per surface, frame verbatim, height in px,
   nominal size and face, computed em at scale 3, nearest candidates with px gaps, plus
   the installed version line.
7. Restore as found: the language matches the arrival state, verified from the face; the
   app is terminated through devicectl (the atlas's leave route); no system setting was
   touched; the lock is removed once the app is gone from the foreground.

Green run: `FINDINGS-XS.md` holds five surface lines plus the version line; the LOG holds
the arrival and restore states.

Break script: none. The reviewer re-derivation recomputes em ratios from the recorded
frames.

Version and commit: bump the patch version in `app.json` and `package.json` under
the version and commit locks; the gradle file never exists in this worktree. Message:
`<VERSION> - docs(plans): 137 step 3, the XS line-box readings, the app restored as found`.
Add by name: the plan folder's `FINDINGS-XS.md` and `LOG.md`, `ai/plans/README.md` (row
to `IN PROGRESS, step 3`), the two committed version files, `app.json` and
`package.json`.

Review: read the diff cold. The restore note must name the arrival language and the final
face; without both, the step is not done.

Merge: as step 1, under the `uat` lock; the gradle sync is the lead's main-tree
action under the build lock.

Done when: the readings and the restore note are committed, and the row reads
`IN PROGRESS, step 3`.
