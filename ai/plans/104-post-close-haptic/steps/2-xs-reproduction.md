# Step 2: the XS reproduction with the owner, the capture and the verdict

Requirements: R2.1
Weight: 3

Anchor check: none (no code changes).

## Goal

The owner reproduces both close paths on demand on her XS while a syslog capture runs, and the
capture confirms the verdict on glass. This step dispatches alone.

## Branch

`git checkout -b build/haptic-xs-capture uat` (fetch `origin` first). Expected outcome: no
commit on this branch (the build and the capture stay outside git).

## Files

None. Build and capture recipes live in `e2e/device-atlas-iphone-xs.md`.

## Red tests

None. The owner's hands and the capture are the evidence.

## Change contracts

None. No code changes.

## Green run

1. Build the Release dev build from `uat`'s merged step-1 state with
   `EXPO_PUBLIC_PERF_MONITOR=1` carried by the build env, per the atlas recipe, and install it
   on the XS through devicectl.
2. Start the capture: `pymobiledevice3 syslog live` filtered to the app's tag, writing to
   `$HOME/athan-gitree/sessions/104/xs-capture.log`.
3. Tell the lead the capture is running. The lead batches the ask to the owner (D104.5, pass
   one): on the phone, open Settings, open the athan sound sheet, close it unchanged once, then
   pick a different sound and close it once, pausing at the buzz moment both times.
4. Stop the capture. Read it with the owner's sequence: locate the four marks from the changed
   close, the two marks from the unchanged close, any notification delivery lines, and their
   timestamps beside the moments she felt the buzz (ask her to note the felt delay for each
   close as it happens; the lead records her words).
5. Record the confirmed verdict in `LOG.md` under this step's heading, with the exact log lines
   that decided it:
   - the settle mark lands after `sound_commit_start`, inside or past the window (T), or lands
     before it while her noted buzz moment falls inside the `sound_commit` window (T2): the
     verdict stands, step 3 runs.
   - a delivery line at the buzz moment (N): STOP per PLAN 2.2, first row.
   - the settle mark lands before `sound_commit_start` and her noted buzz moment falls outside
     the window, with no delivery line (X): STOP per PLAN 2.2, second row.

## Break script

None (no code).

## Version and commit

None.

## Review checklist

- The capture file exists under `$HOME/athan-gitree/sessions/104/` and the verdict quotes its
  exact lines.
- Her felt-delay notes are recorded in her words beside the mark timestamps.

## Merge

Nothing to merge. Delete the branch if it stayed empty.

## Done when

The verdict is confirmed on glass and recorded in `LOG.md` with its evidence, and the step entry
ends with its `session:` line.
