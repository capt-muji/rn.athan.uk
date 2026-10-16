# AUDIT 108

Range audited: `origin/uat..uat` at the EXECUTED head `70c14158` (2.0.826 to 2.0.830), the
three code merges and their docs commits. Diff written to the audit temp file, 246 lines. One
plan-conformance reviewer and one blind reviewer read it in parallel against a clean worktree
at `70c14158`; no third threading pass ran because no step touches notifications, data or the
schedule. Both re-ran the touched suites themselves (54/54 and 46/46 green, no cache) and the
plan-conformance reviewer reproduced `yarn validate` on uat HEAD exactly: 5682 tests, 100
percent on all four measures.

## Plan-conformance findings

1. NICE `Sound.tsx:226` - the plan-pinned D94 comment is orphaned now that the declaration it
   explained died; the behaviour it names lives in `VolumeNote.tsx:23`. VERDICT: confirmed -
   the plan, not the execution, was wrong (grill finding 6's pin). Fixed at 2.0.831 by
   deleting the line.

## Blind findings

1. SHOULD `Sound.tsx:226` - same orphaned comment, duplicating the live sentence in
   `VolumeNote.tsx:23`. VERDICT: confirmed, fixed at 2.0.831 (same line as above).
2. SHOULD `typographySweep.test.tsx:340` - the en branch of the touched `Header.tsx:74`
   ternary was asserted nowhere, so a mutation of it passed the suite, against the repo's
   mutation rule for touched lines. VERDICT: confirmed - R1.3 names the subtitle's 4 point
   margin and nothing pinned it. Fixed at 2.0.831: the header-boxes en case gains
   `expect(subtitle.marginTop).toBe(4);`, and the fix was proven red by mutating the en branch
   to 8 (exactly one failure, `Expected: 4, Received: 8`, file restored, suite green again).
3. NICE `VolumeNote.test.tsx:16` - `RNTL_SKIP_AUTO_CLEANUP` set process-wide and never
   restored. VERDICT: rejected - `typographySweep.test.tsx:17` has set it top-level by design
   since ticket 74 (its own comment carries the why), the reviewer itself calls the effect
   benign today, and the repo's pattern wins over divergent per-file hygiene machinery.
4. NICE `VolumeNote.tsx:39` - "Rubik's win ink" reads as a typo for the waw descender. VERDICT:
   confirmed as a clarity defect - the intent was the usWinDescent metric, but a cold reader
   parses "waw"; a comment that needs the font tables to parse fails its job. Fixed at
   2.0.831: "Rubik's usWinDescent ink descends past its own line box at this size".
5. NICE assertion-style drift - the sweep's `SPACING.xxs` token amid an otherwise literal
   file; DayLines' literal 8 beside its sibling's `SPACING.quart`. VERDICT: half confirmed -
   the sweep's token was drift this audit's own grill fix introduced (fixed at 2.0.831 to the
   literal 2, the import dying with it); DayLines' mixed shape predates the diff unchanged
   (ar literal, en token, exactly as 2.0.824 held it), so it stays.

## Outcome

Three confirmed findings fixed in one commit, one branch, one version (`c420f99f`, 2.0.831,
hook green: 5682 passed, 100 percent on all four measures), the fix diff read cold once. Two
findings rejected with their disproving lines. PASS: every acceptance criterion verified on
uat, en byte-identity verified across the range, the queue row's DONE record is this audit's.
