# Ticket 58a audit

Date 2026-10-12. Range `origin/uat..uat` through `ff088652` (2.0.94), 15 commits.
Diff at `$TMPDIR/audit-58.diff` (680 lines). Two reviewers: plan-conformance and blind,
dispatched in parallel. No third pass: the ticket touches layout styles only, no
notifications, data or schedule path.

## Verdicts

| # | Reviewer | Severity | Finding | Verdict |
| --- | --- | --- | --- | --- |
| 1 | conformance | nice | Steps 4 to 6 file expected versions 2.0.89/90/91, actuals 2.0.91/92/93 after the D69 repair | No action: inert text, LOG records the actuals, the folder dies at DONE |
| 2 | conformance + blind | nice | `applyAllowlist` first-match: any number of identical hits share one entry, so a duplicate of an allowlisted line passes the gate | Confirmed, fixed at 2.0.95: one-to-one consumption plus fixture tests |
| 3 | blind | should | `SegmentedControl.tsx:194` anchor is `start: 3` while the pill motion (`:141`, `:154`) stays physical-positive `translateX`, so under RTL the pill slides off the control; no allowlist entry records the motion | Rejected as an audit fix: the behaviour exists only after 58b's flip; queue row 68 names "the SegmentedControl pill index" as its own mirror site; an allowlist entry for a transform-only line is impossible because it produces no hit, so R1.2 would flag it stale |
| 4 | blind | should | The allowlist matcher has no fixture test; "deleting the snippet condition (file-only matching) passes both gate tests" | Headline disproven live: the file-only mutant fails the stale test (1 failed, 1 passed) because multi-entry files leave sibling entries unconsumed. Substance confirmed: the protection was the live allowlist's shape, not an assertion. Fixed with finding 2: the matcher contract is now pinned by fixtures |
| 5 | blind | nice | The gate test's rule comment claims more than enforcement (widgets outside SCOPE, corner radii un-banned) | Confirmed, fixed at 2.0.95: comment restated to the enforced scope (eight directories, border edges, corner radii direction-free, widgets 58b's) |

## The fix (2.0.95, one branch, one commit)

`scripts/check-directional-styles.js`: `applyAllowlist` skips consumed entries in its
`findIndex`, so each entry absorbs exactly one hit. A second copy of an allowlisted line
lands in the remainder and fails the gate.

`shared/__tests__/directionalStyleGate.test.ts`: a scanner fixture (temp root, banned
line found, test file skipped, absent SCOPE directories skipped) and a matcher contract
suite (file and snippet must both match; each entry absorbs exactly one hit). The rule
comment restated per finding 5.

Proof, run by the lead:

- Red first: the duplicate-line test failed against the pre-fix scanner (both twins
  consumed one entry), 1 failed 4 passed.
- Green after: `Tests: 5 passed, 5 total`.
- Mutation pass on the guarded logic: snippet condition dropped, 1 failed 4 passed;
  file condition dropped, 1 failed 4 passed.
- Live tree: `node scripts/check-directional-styles.js` prints `DIRECTIONAL STYLES OK`
  (21 entries, one-to-one holds).
- `npx tsc --noEmit` exit 0; `npx biome check` on both files exit 0.

## Carried forward

Nothing. Finding 3 is already row 68's named work; findings 1, 4, 5 are closed here.
