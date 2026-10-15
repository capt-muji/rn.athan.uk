# Ticket 100 audit (2026-10-15)

Two reviewer passes over `f9af66c2..lane/100` (the plan-conformance pass initially
read an `origin/uat..lane/100` diff whose reversed uat-side hunks belong to ticket
91's ground; the range was regenerated on the merge-base and re-read). A
threading-lifecycle third pass did not run: the plan touches styling and
composition only.

## Plan-conformance findings

1. [nice] the audit diff's range included uat-side hunks — confirmed and corrected
   at dispatch (the corrected 1057-line diff was used by both passes). No code
   change.
2. [nice] the step-5 ruling section sits late in LOG.md — REJECTED: the ledger is
   append-only and every ruling carries its own version stamp (03811213, 2.0.760);
   reordering written history would falsify the record it exists to hold.
3. [nice] step 1's verdict line said en differs "only by zero-width marks" —
   CONFIRMED as a records inaccuracy (the gap-span space between digits and letter
   is also gone, which the plan's own test block rules); corrected in place. No
   code change.

## Blind findings

1. [should] `assets/icons/svg/info.svg:2` — the circle's stroke exceeds the
   viewBox on all four sides (outer radius 5.9 + 0.7 = 6.6 against the half-box
   6.2405) and react-native-svg clips at the view bounds, so the ruled circled i
   renders with flat cut spots. CONFIRMED from the geometry and the pinned
   react-native-svg drawing path. Fixed here: r 5.9 to 5.5 (outer 6.2 fits inside
   6.2405), with a red geometry test first.
2. [nice] `shared/__tests__/dateLocalized.test.ts` — the two added comma tests
   (weekday case, Hijri case) re-prove the branches the retargeted expectations on
   the neighbouring lines already encode. CONFIRMED: the plan over-specified; both
   additions dropped, the retargeted tests carry the coverage.

## The fix

One branch `code/audit-100-fixes`, one version, one commit: the geometry test in
`shared/__tests__/i18n.test.ts` (parses the asset's r and stroke-width and asserts
the outer radius fits the half-box, red at 6.6, green at 6.2), the asset's
`r="5.5"`, and the two duplicate dateLocalized cases deleted. The hook's four
gates green on the commit.
