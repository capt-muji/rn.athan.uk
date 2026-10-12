## Ticket 60

## Planning (2026-10-12)

- Surface inventory mapped: five sheets through Sheet.tsx, three modals through
  Modal.tsx, ColorPicker bounded, Error out of scope. Library facts verified at
  @gorhom/bottom-sheet 5.2.14 (dynamic detent math, the shared contentHeight
  writer, the pinned-header constraint under dynamic sizing).
- Interview taken 2026-10-12 (D70 to D73 in PLAN.md section 2.1): scope is the
  modal family only, no bottom sheet changes at all; every modal must be
  capped; Help stays untouched; WhatsNew gets the Help pattern; Update's
  message also gets a bound that never engages at today's copy.
- Catalog facts measured: update.message runs 37 to 60 characters across all
  six languages; help totals 1160 to 1498 characters; whatsNew keys total 559
  to 594.
- Scratch-worktree proof at uat c88f50f5: both scroller tests red on pristine
  code (TypeError at the flatten line), green after the exact step contracts
  (19 passed across both suites), tsc exit 0, Biome exit 0 after the
  import-order placement, break fails the named test (1 failed, 10 skipped).
  Worktree removed.
- Draft written: PLAN.md, two step files, pre-flight, seven anchors all
  counting 1. Gate and grill next.
- Gate: `bash scripts/check-plan.sh` printed `PLAN OK` on the first run.
- Grill (plan-griller, cold): zero must findings; five applied (WhatsNew test
  count ten not nine, the D71 strike line added to section 12, the Update test
  placement named exactly, "same six lines" corrected to "same fields", the
  731 dp figure marked planning-computed with its derivation). No second
  round: fewer than six problems.
- Ticket set READY, planned at uat c88f50f5.
