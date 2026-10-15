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
