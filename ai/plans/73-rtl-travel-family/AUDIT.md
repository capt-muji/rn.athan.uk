# AUDIT — ticket 73

Range reviewed: `b1bf6f89..ticket/73` code commits 2.0.260 to 2.0.263 (`4c1ae0be`, `d7dec7c5`,
`ce1fd50d`, `78925c55`), diff at `$TMPDIR/audit-73.diff` (8 files, 307 lines). The plan
folder and queue row were reviewed for records accuracy; the two lead-side docs commits
2.0.264 (ledger repair) and 2.0.265 (this audit) complete the branch. Reviewers: one
plan-conformance, one blind, dispatched in parallel, each verifying its claims against the
code before reporting.

## Plan-conformance findings

1. [should] `LOG.md` Findings (executed) — "the library hardcodes isRtl false" contradicted
   the corrected diagnosis (the module-load snapshot at `lib/src/utils.tsx:6`) and the
   shipped keyed ternary; the plan's section 8 was stale and step 4 had copied it verbatim.
   VERDICT: confirmed; the records text in PLAN.md section 8 and the LOG copy are corrected
   in 2.0.265 to the snapshot wording.
2. [should] `LOG.md:141` — the step-4 entry cites an adjudication in AUDIT.md, which did not
   exist when the reviewer read the tree. VERDICT: confirmed; this file is that record (see
   the executor-concerns section below), so the citation now resolves.
3. [nice] Step 1's commit omits LOG.md from its file set (the plan names it), so the step-1
   ledger entry landed with step 2's commit. VERDICT: confirmed as a deviation; the cause
   (the stale-message collision and in-place amend) is recorded in the step-1 entry itself,
   and the end state conforms. No retroactive fix; recorded here.

## Blind findings

1. [must] `Toggle.tsx` / `SegmentedControl.tsx` — the locale-keyed travel regresses in the
   recorded system-Arabic + app-English launch state (row 80's ground: the layout follows
   the system locale there, the bridge constant reads RTL, the app locale is English), where
   the old bridge-keyed travel was self-consistent; no keying inside these two components is
   right in all four documented states. VERDICT: analysis confirmed and accepted, blocking
   rejected. That state is already broken app-wide today (English content under an RTL
   layout) and already owned: row 80 is her ruling that the layout must follow the selected
   app language, and her queue sequences row 80 behind rows 73 and 78 by name ("73 and 78
   share the ground; sequence behind them"). The window between this merge and row 80's
   repair is the owner's own queue ordering; the DONE cell text and the final report carry
   the dependency so the orchestrator keeps row 80 next. The bootstrap itself
   (`stores/bootstrap.ts`) is outside this run's editable surface.
2. [should] The ticket's original acceptance bar names a device proof of the pill on `صوت`;
   no repo-visible record carries one. VERDICT: rejected as an action item; the owner's run
   order of 2026-10-14 waives physical device work explicitly ("NEVER a physical phone") and
   sets her own device test as the acceptance bar; the plan's section 7 and the DONE cell
   record the waiver.
3. [should] The starved-state tests rest on the real jest bridge reporting `isRTL: false`
   without asserting it; a future preset change would silently demote both describes to
   completed-crossing tests. VERDICT: confirmed; both beforeEach blocks now assert the
   premise (`expect(I18nManager.getConstants().isRTL).toBe(false)`), landed in 2.0.265.
4. [nice] A test comment claimed the locale "forces the RTL layout", which jest never lays
   out. VERDICT: confirmed; the comment now states what the test proves (the mirrored
   target, not the device's RTL frame), landed in 2.0.265.
5. [nice] `QiblaWave.tsx:54` still keys its mirror on the bridge constant and disagrees with
   the locale-keyed siblings in a starved crossing. VERDICT: confirmed as out of scope; the
   plan's D5 records why (its SVG path and phone travel share one flag and cannot diverge
   from each other, and `shared/qiblaWave.ts` is outside this run's editable surface); the
   report carries it to the queue owner for row 80's plan.

## Executor concerns adjudicated

- Step 1's first commit carried ticket 81's message from a stale `$TMPDIR/msg-1.txt`
  (concurrent lanes share the machine temp dir). The executor verified content, amended in
  place (nothing had merged), and moved to ticket-unique message filenames. VERDICT: handled
  exactly as it should have been; the incident is recorded in the step-1 entry.
- Step 4's Checks line expected the pre-flight to pass post-execution; three anchors count 0
  by then because steps 1 to 3 replaced their own anchor text. VERDICT: a plan defect in a
  dead check (the pre-flight is an entry gate, not an exit one); no code impact; no
  amendment spent on scaffolding that dies at DONE.
- The executor's final report claimed LOG entries carried every step's session line; step
  4's entry was missing entirely. VERDICT: confirmed; the lead reconstructed the entry from
  the repository in 2.0.264, and the entry says so.

## Verdict

PASS. Both reviewers confirmed the shipped code against the plan and the library sources;
every confirmed records defect is fixed on the branch (2.0.264, 2.0.265), the one [must]
finding is an owner-sequenced window recorded in the DONE cell, and nothing in the diff
breaks a caller, a rule or a test. The branch holds 2.0.260 to 2.0.265, tree clean, nothing
merged, nothing pushed, the queue row at EXECUTED awaiting the orchestrator's DONE.
