# LOG — ticket 85

## Ticket 85

## Planning (2026-10-15)

Frontier closed live with the owner across the session: the lettered design in
every language, the old zero-drop behaviour git-verified (`fb42c372` era and
`194ed701`), letters at 55 percent and ink 0.4 tuned on the XS, inline baseline
spans, the 2 point gap span, no final device read, the colon-machinery sweep.
Full table in PLAN.md section 2.1.

Draft complete: PLAN.md, steps 1 and 2, handed component and suite, preflight,
anchors a1 to a8 all counted 1 at `f70eaf8e` (2.0.730).

The grill (2026-10-15) returned five blockers and five refinements; all ten
accepted and applied: the tree-restore step 0, the overlay test rewritten onto
`openOverlay`/`closeOverlay` (the derived atom is read-only), the handed suite
Biome-formatted, the `splitSingleColon` JSDoc reword joins the sweep, the dead
`COLORS` import leaves the constants test, R1.5 drops the size claim, the design
invariant names the enumerated instants, the ago helper renamed, the LOG
contract aligned, the queue cell reworded at READY.

Proofs (2026-10-15, planner, scratch worktree at `f70eaf8e` plus main tree):

- Red: the handed suite against uat's component fails 13 of 16, the first
  failure `Unable to find an element with text: 2 H`; the three carrier tests
  pass. Worktree removed after.
- Green: the handed component and suite in the main tree pass 16 of 16;
  `npx tsc --noEmit` clean; Biome clean.
- Coverage: the full components project aggregates `components/countdown/Countdown.tsx`
  to 100 percent on statements, branches, functions and lines (the module-level
  `ty.wordFace` ternary closes under the ar-loaded module of other suites, as on
  uat).
- The hook's four `100%` lines are the executor's authoritative gate at commit.

Resume from: planning finish (queue READY, docs commit, merge, push).


The planning commit's first hook run (2026-10-15) failed three gates and taught
the atomicity the plan now carries: the lettered tree alone makes the two colon
allowlist entries stale (directionalStyleGate), makes `splitColonSections`
test-only-reachable (unusedExports), and the local gradle file had drifted out
of lockstep (fixed to equal app.json, 2.0.731). The two steps merged into one
atomic step; the working tree restored to uat, the implementation and suite
living in the handed files.

Resume from: the planning docs commit, merge, push; then the executor dispatch.
