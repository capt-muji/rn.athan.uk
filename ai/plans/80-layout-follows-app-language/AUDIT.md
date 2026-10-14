# AUDIT — ticket 80

Range reviewed: `1b0d5229..ticket/80` code commits 2.0.405 to 2.0.408 (`f4363882`, `36d7b61a`,
`88caba8d`, `de1ec1e1`), diff at 501 lines (12 files, 251 insertions); each reviewer
reconstructed it read-only after the lead-named temp path resolved per-shell, and each
reconstruction matched the stated size. The plan folder, queue row and LOG.md were reviewed
for records accuracy. Reviewers: one plan-conformance and two blind (one with a threading
and lifecycle focus over the notification paths), dispatched in parallel, each verifying
its claims against the code before reporting.

## Findings and verdicts

Plan-conformance:

1. [should] The adjudicated step-3 amendment landed half: the plan's step file carries the
   two-line JSDoc for `includeHiddenElements`, the shipped test kept the one-line pre-amendment
   JSDoc. VERDICT: confirmed; the amended two-line JSDoc lands in the records commit of this
   audit so the code and the record agree.
2. [should] `stores/language.ts` — a process death between the marker write and the consume
   strands the marker, and the next genuine cold launch skips the gate reopen its force-stop
   may need; R2.4 covers only the refused relaunch. VERDICT: confirmed, fixed in 2.0.410 with
   the freshness bound (see blind 1).

Blind:

1. [should] `app/index.tsx` — the consume sat inside the 1500 ms launch-init timeout, so a
   death between write and consume strands the marker; the proposed fix moved the consume to
   mount. VERDICT: confirmed on the window, fix superseded: the freshness bound (2.0.410)
   closes the class entire — a stranded marker is stale within 60 s however it stranded, so
   the consume keeps its place beside the branch it decides. All three reviewers found this
   window independently.

Blind, threading and lifecycle focus:

1. [should] Same stranded-marker window, with the ErrorBoundary unmount and the hung reload
   added as strands; proposed a 60 s freshness bound. VERDICT: confirmed; adopted as the fix,
   2.0.410 (timestamp-valued marker, `RELAUNCH_HANDOFF_FRESH_MS = 60_000`, consume clears and
   refuses a stale or non-numeric marker; the key never shipped to uat, so no migration).
2. [should] On the 10 s cap path the convergence pass is still in flight at the reload, so a
   native call dispatched before teardown can land after the relaunch context's one reconcile
   sweep; the unconditional reopen this change removed was what guaranteed that context a full
   pass with its sweep on Android. VERDICT: confirmed; fixed in 2.0.409 — the marker is
   written only when the pass settled before the reload (`passSettled`), so a capped crossing's
   relaunch keeps the cold-launch reopen and its sweep, and only the healthy crossing earns
   the skip. The iOS side never had the unconditional reopen (`reopenRefreshGateOnColdLaunch`
   is Android-only at the Platform gate), so no iOS behavior changed by this finding.

## Verified by the lead, beyond the reviewers

- The root direction change resolves the same direction the native side resolves in every
  state that rendered right at 2.0.402 (system-RTL + app-ar, system-LTR + app-en), so no
  pixel moves there; the ruling state (system-ar + app-en) flips to LTR, which is the fix.
- The capped-crossing case is red at 2.0.408 (`Expected: "" / Received: "ar"`) and green at
  2.0.409; the stale and non-numeric marker cases are red at 2.0.409 (`Received: true`, NaN
  on the write assertion) and green at 2.0.410. `stores/language.ts` coverage 100 percent on
  statements (58/58), branches (16/16), functions (7/7), lines (52/52).
- The executor's hook finding is recorded here because it touches the gate's honesty: the
  worktree initially had no `.husky/_` (husky's prepare never ran there), so the first
  commit attempt ran no gate; the executor materialized the shims with the repo's own husky
  CLI, soft-reset the unpushed commit and re-made it so the gate genuinely ran. Commits
  2.0.403 and 2.0.404 (docs-only) predate that repair and ran no hook; the identifier gate
  ran clean over the whole branch at the close of this audit.

## Verdict

PASS. All four reviewer findings confirmed and fixed on the branch (2.0.409, 2.0.410, and
the records commit carrying this file), both adjudicated executor STOPs resolved by plan
amendment before their steps committed, and nothing in the diff breaks a caller, a rule or
a test. The branch holds 2.0.403 to 2.0.411, tree clean, nothing merged, nothing pushed,
the queue row at EXECUTED awaiting the orchestrator's DONE. Device work waived by the
owner's run order; her device test is the acceptance bar.
