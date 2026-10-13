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
