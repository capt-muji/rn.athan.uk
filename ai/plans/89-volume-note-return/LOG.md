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
