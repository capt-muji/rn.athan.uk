# Ticket 89: the volume note returns to both sheets at the foot

## Planning (2026-10-15)

Lane regime: this ticket runs in the lane worktree `$HOME/athan-gitree/lanes/89`, branch
`lane/89`, anchored on `uat` at `5a3fba84` (2.0.733). `node_modules` is a symlink to the
main checkout; `yarn install` never runs here. Husky hooks run natively in the lane:
`core.hooksPath` is the relative `.husky/_`, `npx husky` generated `.husky/_/pre-commit`
in the lane, and every commit runs `node scripts/check-identifiers.js --staged`,
`npx lint-staged`, `yarn validate` and `node scripts/check-changed-coverage.js --staged`
through the hook. No hand-run gate regime is in force.

The owner interview is waived for this ticket: the queue row carries her full ruling
(2026-10-15). Styling freedom the row leaves is decided from repo conventions and the
64/86/87 lineage, recorded in PLAN.md section 2.

Lineage studied: row 64 shipped the copy (`7c01e5c6`, 2.0.726-era 2.0.719 move by row 86
`5389e92a`, row 87 rework `05eabe6a`, `507256c2`, removal `31fb09a4` at 2.0.729).

The grill ran as one athan-plan-griller dispatch against this folder and the lane
worktree (2026-10-15). Six findings, all adjudicated confirmed and applied: the B4
break restored en.ts with `git checkout --` and would have silently dropped the
restored keys (now a backup copy, like B1 to B3); the screens' predicted red symptom
named a return value where `t()` throws (reworded to the TypeError); the pins
insertion named the excerpt's second line where dndAccess is its first; LOG's heading
contradiction resolved to `## Ticket 89`; the lock diff prediction now names ten diff
lines (five `-`, five `+`); the design invariant names the en pins and the verbatim
translation lines as their own evidence. The skeleton commit is `ea827817` (2.0.734).
`scripts/check-plan.sh` prints PLAN OK.

## Ticket 89

### Step 01 — done

Branch `feat/89-volume-note` off `lane/89`, commit `45905aae`, version 2.0.737.
The pre-flight printed `PREFLIGHT OK`. Red: the VolumeNote suite failed
`Cannot find module '../VolumeNote'`, the two Alert note tests and the two Sound
note tests failed `TypeError: Cannot read properties of undefined (reading
'replace')`, the en pins failed on the missing key, the sweep failed ENOENT on
the missing part. Green: VolumeNote 4/4, Alert 31/31, Sound 22/22, i18n +
catalogLock 17/17, sweep 38/38, `tsc --noEmit` exit 0, `biome check .
--error-on-warnings` exit 0. `yarn i18n:lock` printed `catalog lock written for
ar, ms, so, hi, th` and the lock diff moved five hashes (five `-`, five `+`).
Break script last line: `ALL AS EXPECTED: 1` (all six mutations red, tree clean
after). Hook's final line: `Tests: 2 skipped, 5650 passed, 5652 total`.

Coverage:
Statements   : 100% ( 5325/5325 )
Branches     : 100% ( 2290/2290 )
Functions    : 100% ( 1108/1108 )
Lines        : 100% ( 4768/4768 )

Review verdict: clean on the cold read of `git show 45905aae`. The part matches
its contract byte-for-byte, both screens moved exactly one import line and one
`<VolumeNote />` insert, the six catalogs hold the two keys at the anchored
position with the 2.0.728 bytes, the note is the unconditional last child
(D89.1, under the unavailable message too), no divider, no colour outside
`COLORS.text.sheetSubtitle`, both version files at 2.0.737. No fix needed.
No lifecycle, thread, residue or prayer-time/qibla-rule exposure: pure render,
no state, no worklets, every declared key and export read, no time work.

Merged `--no-ff` into `lane/89` as `b540c514`. Executed docs commit
`docs/executed-89-2026-10-15` at 2.0.738.

session: ses_ec2053012ffe6238FSZyqhj2az
