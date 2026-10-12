# Ticket 60 audit

Range audited: `origin/uat..uat` at open, commits `f6c7a0f4` (merged `42a5cc96`,
2.0.100, step 1), `ca67ca8b` (merged `bb72205f`, 2.0.101, step 2) and the
executed docs merge `c3a1b454` (2.0.102). The diff written for the reviewers
held 6 files, 207 lines: the two modal components, their two suites, and the
two version files.

Reviews run: plan-conformance and blind, in parallel, each green on the
suites at HEAD (19 tests across the two modal suites; the blind reviewer also
ran the app-index suites, 90 tests). No third pass: the change touches no
notification, data or schedule path.

The lead's own cold read of both commits: the five contract edits per step and
nothing else; the shipped-classes hunt (lifecycle, thread, residue, rule)
clean; scroll state cannot survive a close (Modal unmounts children when
invisible).

## Findings and verdicts

1. [nice, blind] Three private copies of the 0.62 scroll share
   (`ANSWERS_HEIGHT_SHARE` Help.tsx:22, `MESSAGE_HEIGHT_SHARE` Update.tsx,
   `LIST_HEIGHT_SHARE` WhatsNew.tsx); proposed one shared constant in
   `shared/constants`.
   Verdict: rejected. PLAN.md section 5 weighed and rejected the extraction:
   coupling all three modals through one constant would touch the settled
   Help surface, which the owner's D70 ruling bars. Two local constants
   carrying the owner-approved pattern is the deliberate cost.

2. [nice, blind, prose only] The two test files repeat a ten-line assertion
   block.
   Verdict: rejected. The block follows the sibling suites' local style and
   the house pattern (Help.test.tsx:154-162); extracting a helper inside one
   test folder is taste, not defect.

No confirmed findings. No fixes applied. No owner-owned decisions opened: the
one owner edge (D71, Update's bound) was reported at the planning close.

PASS. Queue row set DONE with the plan's records text; the plan folder is
removed in the closing docs commit, this record surviving in the audit
branch's history.
