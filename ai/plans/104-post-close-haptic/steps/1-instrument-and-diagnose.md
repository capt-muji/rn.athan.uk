# Step 1: the dispatch marks and the simulator diagnosis

Requirements: R2.1, R1.2
Weight: 2

Anchor check: all 6 anchors under `scripts/anchors/` count exactly 1 at the working tree
(the preflight proved it; if `sheet-close-haptic` or `sound-handleDismiss` moved, STOP: the plan
is stale).

## Goal

The close-haptic dispatch is bracketed by gated PERF marks, and the timing chain is read once on
the iOS simulator, producing a provisional verdict (T, T2, N or X) recorded in `LOG.md`.

## Branch

`git checkout -b diag/close-haptic-timing uat` (fetch `origin` first).

## Files

- `components/sheets/parts/Sheet.tsx`
- the Sheet suite that covers the close haptic (map it from the file's imports at red-test time;
  the Sound suite already exercises the dismiss path through the shared Sheet)

## Red tests

Add one case to the Sheet suite: `marks the close haptic dispatch and settle on dismiss` - mock
`Haptics.impactAsync` to resolve on a later microtask, fire the dismiss path, assert
`perfMark` was called with `sheet_close_haptic` before `onDismiss` runs and with
`sheet_close_haptic_settled` after the impact promise resolves. Run it; record the exact failing
name and its first failing line (expected shape: the marks were never called). Any other test
failing is a STOP.

## Change contracts

In `components/sheets/parts/Sheet.tsx`, inside `handleDismiss` only:

- `perfMark('sheet_close_haptic');` on the line above the `Haptics.impactAsync` call.
- The impact call becomes: store the promise in a variable, then attach the settle mark:
  `const impact = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);` then
  `void impact.then(() => perfMark('sheet_close_haptic_settled'));` then `onDismiss?.();` The
  call order (haptic first, `onDismiss` same tick) does not change: this step adds marks, moves
  nothing.
- The comment block above the handler stays as it is.
- The break run precedes any constant-naming review fix: if the mark names become constants in a
  later review, `break-104.sh` marks mode no longer matches and must not be re-run.

## Green run

1. The Sheet suite green, including the new case.
2. `yarn validate`.

## Break script

`bash <TMPDIR-copy>/scripts/break-104.sh marks` from the repository root.
It comments out the two `perfMark` lines only, runs the new case, expects it to fail with the
marks never called, then restores the file from its backup copy. Output ends `BREAK OK`.

## Simulator diagnosis (inside this step, before the commit)

1. Serve the dev bundle with `EXPO_PUBLIC_PERF_MONITOR=1` set on the Metro command (the flag
   inlines at serve time; restart Metro with the env, never edit `perf.ts`).
2. Through agent-device on the iOS simulator: open Settings, open the athan sound sheet, pick a
   different sound row, close the sheet.
3. Read the Metro log for the four marks' timestamps and pairwise deltas in whatever order
   they land: `sheet_close_haptic`, `sheet_close_haptic_settled`, `sound_commit_start`, the
   `sound_commit` measure. Record the timestamps and the deltas between them in `LOG.md`.
4. Repeat the drive once with an unchanged close (open the sheet, close it without picking):
   expect `sheet_close_haptic` and `sheet_close_haptic_settled` beside each other with no
   commit marks.
5. Record the provisional verdict in `LOG.md` under this step's heading:
   - `sheet_close_haptic_settled` lands after `sound_commit_start`, inside or past the
     `sound_commit` window: verdict T.
   - the settle lands before the commit marks but the owner's glass read (step 2 pending) is
     still expected late: verdict T2 provisional.
   - a delivery or banner line appears beside the settle mark: verdict N, and STOP per PLAN 2.2.
   - neither: verdict X provisional, step 2 decides.

## Version and commit

The version is the next patch after `uat`'s `package.json` when the step runs (bump `app.json`
first, then `package.json`, then `android/app/build.gradle`). Commit message:
`<VERSION> - feat(perf): PERF marks bracket the sheet close haptic dispatch and settle`.

## Review checklist

- The diff touches the shared Sheet and its test only.
- The call order in `handleDismiss` is unchanged beside the two marks and the promise variable.
- The red is recorded in `LOG.md` with its first failing line, and the provisional verdict with
  its timestamps.

## Merge

`git checkout uat && git merge --no-ff diag/close-haptic-timing -m "<VERSION> - merge diag/close-haptic-timing: the close haptic marks"`.
Never push.

## Done when

Reds recorded, suites green, the simulator drive recorded with its deltas and provisional
verdict in `LOG.md`, merged into `uat`, the hook's `Tests:` and coverage lines pasted, and the
step entry ends with its `session:` line.
