# Step 4: the verdict, FINDINGS.md, the row

Requirements: R4.1, R5.1
Weight: 1

Anchor check: as step 1. A count other than 1 is a STOP.

Goal: one findings document that answers her question with the measured numbers, the
options for her ruling, and the queue row moved to EXECUTED with the verdict folded in at
the audit close.

Branch: `step-137/verdict` off `uat`, in the lane worktree. Files: this plan folder's
`FINDINGS.md` (new), `LOG.md`, and `ai/plans/README.md`.

Red tests: none. A docs step.

Change contracts:

- Write `FINDINGS.md` with: the expectation table's em candidates restated in one line
  each; every measured surface from `FINDINGS-3T.md`, `FINDINGS-XS.md`,
  `FINDINGS-3T-HOME.md` and `FINDINGS-XS-HOME.md` with its em and matched set, the
  same-surface pairs of D137.11 side by side; the controls' pin ratios; the yes or no on
  "the same line box"; the
  judgement on "as it should be", grounded in the citations of PLAN.md section 4 and the
  row 87 law, naming any claim the measurements do not prove as unverified; the options
  of D137.7 verbatim; and a voids section when a reading is missing, per the row 120
  form.
- The yes or no rule, exact: the boxes are THE SAME when both platforms' unpinned
  surfaces match the same candidate set within tolerance on every surface; otherwise they
  DIFFER, and the findings name each platform's set and the em distance between them.
- Set the row to `EXECUTED` with a one-line pointer to the plan folder. The verdict cell
  text of R5.1, the OWNER-LED close, is written verbatim inside `FINDINGS.md` for the
  lead to apply at the audit close; this step never writes the OWNER-LED state itself.

Green run: `FINDINGS.md` answers both halves of her question in its first ten lines; the
numbers below them trace to the two findings files.

Break script: none. The reviewers re-derive every number.

Version and commit: bump the patch version in `app.json` and `package.json` under
the version and commit locks; the gradle file never exists in this worktree. Message:
`<VERSION> - docs(plans): 137 step 4, the parity verdict and options`.
Add by name: the plan folder's `FINDINGS.md` and `LOG.md`, `ai/plans/README.md`, the
two committed version files, `app.json` and `package.json`; the gradle sync is the
lead's main-tree action under the build lock.

Review: read the diff cold. A verdict sentence carrying a number that appears in no
findings file is a defect; fix it before merge.

Merge: as step 1, under the `uat` lock; the gradle sync is the lead's main-tree
action under the build lock.

Done when: `FINDINGS.md` and the row's `EXECUTED` state are merged, and the LOG holds
`### Step 04 — verdict`.
