# Ticket 72 LOG

Write-through ledger. Every step entry opens with `### Step <NN> — <state>` and ends with a
line `session: <ses_id>`. Planning sections use `## Planning (<date>)` and `## Ticket <N>`.

## Planning (2026-10-13)

- Ticket taken: queue row 72, the only plannable row (63 DONE, needs-first nothing).
- Reference sha for the English revert pinned: `194ed701` (uat at 2.0.128), the parent of
  row 63's first-step merge `49c58aea` (2.0.129). The reference test files' own values are
  the en byte table.
- Row 63's plan folder recovered from `970d797f` (2.0.132) and read in full; its step shape,
  pin lists and device recipe are the model for this folder.
- Facts verified with file:line citations: the display atoms (`stores/countdown.ts:90-96`),
  the single hero render component for both schedules and the overlay
  (`components/countdown/Countdown.tsx:42-54`, ADR-014), the ago badge
  (`components/prayer/Ago.tsx:52-57`, rendered once per page at `app/Screen.tsx:43`), the
  row-cascade colour pair (`components/prayer/Prayer.tsx:52-60`,
  `hooks/useAnimation.ts:128-134`), the locale core (`shared/i18n/locale.ts:41`), the digit
  map (`shared/i18n/digits.ts:26`), the reminder copy paths
  (`shared/notifications.ts:182`, `:513`), and the catalog deltas between `194ed701` and
  HEAD.
- Planner rulings D72.1 to D72.8 taken under the owner's standing instruction to plan READY
  without her; four carry an audit-veto note (gap width, fade duration, badge fixed width,
  held-display colour).
- Sections drafted and committed; griller dispatched on the complete draft.

## Ticket 72

Grill round one (eight findings: three must, three should, two nice), all applied:
step 2's and step 4's preflight anchor lists pruned against the edits earlier steps make
(both steps would have STOPped on anchors their predecessors destroyed), the dim/bright
colour contract's verification moved to step 4's on-device transcription with the
mock-cannot-read-an-animated-colour caveat written into the step, the four title-only
rewrites' red behaviour corrected, the two-group ruling given its audit-veto note, the
mock alarm pin turned into a rule, the batch-budget wording fixed, and the vacuous-pass
sentence restored. The third break mutation the colour finding wanted is not added: the
mapping flip is invisible to the jest mock by the same caveat.

Replan round one (2026-10-13): the preflight inherited row 68\x27s inverted upstream
check (`origin/uat..uat` counted local planning commits as unmerged); corrected to
`uat..origin/uat`, proven PREFLIGHT OK on the clean tree at 2.0.199.

Replan round two (2026-10-13): two of the step 1 pins contradicted the composer
contract they test. Ruled the composer wins: `formatTime(120, true)` under ar is
`٠٠:٠٢:٠٠` (rule 2 fixed three sections and rule 3 never-hide-hours; the two-group pin
also broke `599,true → ٠٠:٠٩:٥٩`), and `formatTime(60)` is `٠٠:٠١:٠٠` (60 s is one
minute; the pinned digits read transposed against the test title own whole-minute
branch). The executed diff survives at sessions/72/step1-unfinished.patch; execution
amends the two expectations and resumes from the green run.
