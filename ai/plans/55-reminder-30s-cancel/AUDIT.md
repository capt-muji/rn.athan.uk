# AUDIT — Job 55

Range reviewed: `origin/uat..uat` at tip `8036ec17` — `b7644b42` (docs, 2.0.5), `6dc9125b`
(fix, 2.0.6), `09c13e46` (merge), `8036ec17` (docs, 2.0.7). Code diff (`ai/plans` excluded):
`stores/notifications.ts`, `stores/__tests__/reminderImminentKeepAlive.test.ts`, plus the
version files. The reviewers ran early on the final code diff (step 02 is docs-only by design,
so the diff cannot grow); the formal close (PASS, row DONE, folder deletion, push) waits for
the row's EXECUTED state behind the owner's proof-vehicle ruling.

## Reviewer: plan-conformance

Verified by the reviewer against the worktree at `8036ec17`:

- The audit diff is byte-identical to the excluded-plans range: exactly the two step-named
  files plus `app.json`/`package.json` (`android/` is untracked, so no `build.gradle` hunk).
- `stores/notifications.ts` carries exactly the four contract edits: docblock word for word
  (999-1001), identifier moved after `now` (1029) with one blank line before `try`, the branch
  in the section 10 hoisted-`records` form with the sanctioned condition order (1034-1046),
  try/catch untouched.
- R1.1 holds through `attemptedIds` (1128-1137): the kept record is never stale-swept or
  cancelled. R1.2's log line carries the five fields. R2.1 falls through to the unchanged skip
  without a record; R3.1 and R4.1 are proven by suite tests 5 and 3.
- The test file is byte-identical to the step's fenced block after the single owner-ruled
  `schedulesOf` join, verified mechanically; suite re-run green 5/5 on the committed code;
  fake timers precede seeds; harness matches the house pattern.
- Versions 2.0.5 to 2.0.7 run in sequence; the fix commit's message and 5-file set match plan
  and LOG; the row cell's shas, version and parked state match git; the amended break script
  reads the Jest summary line as LOG records; step 01's review verdict is recorded.

FINDINGS: none. Lead verdict: accepted, clean.

## Reviewer: blind

Verified the fix logic against the sweep and database design, ran all 47 store suites, tsc and
Biome on the same commit, and confirmed the headline assertion is structurally red against the
old code. FINDINGS: two, both adjudicated by the lead from the code:

1. [should] `stores/notifications.ts:1037` — the record-membership guard had no pinning test:
   deleting `.includes(identifier)` left all five tests green, because the never-armed day owns
   no record and no OS request, so a phantom kept return changed nothing the suite asserted.
   CONFIRMED by mutation, reproduced by the lead: the guard's second half is load-bearing
   guarded logic and the repo demands a mutation pass on exactly that. Fixed in
   `stores/__tests__/reminderImminentKeepAlive.test.ts` (test 4): the skip log must fire and
   the keep log must not, both scoped by `expect.objectContaining({ date: WINDOW[0] })`.
   Red-green proven by the lead: mutation on, one test failed at the new negative assertion;
   mutation reverted, five passed. Committed as the audit fix (2.0.8).
2. [nice] `stores/notifications.ts:1000` — the rewritten `@returns` parenthetical dropped
   "or imminent" from the null-return list, but an imminent reminder with no record still
   returns null there; the branch's own log line still says "past or imminent". CONFIRMED
   against the plan's contract edit 1 and the code path. Fixed by restoring "or imminent" to
   the parenthetical (comment-only, no behaviour). Committed as the audit fix (2.0.9).

## Reviewer: blind, threading and lifecycle focus

Verified all four axes against the code: the changed function has one caller, reachable only
inside `withSchedulingLock` acquisitions, the queue never rejects, and every sweep runs inside
the same lock; the kept identifier is excluded from `staleRecords` so no remove, cancel or
re-arm touches it, and the final sweep only cancels OS ids with no record. One `now` per
attempt serves both the buffer test and `reminderDateTime > now`, so the branch cannot
straddle itself. The keep branch is synchronous, adds no timer or subscription, and is
idempotent on repeat passes; the added MMKV read is synchronous and its only writers are the
same locked paths. One nuance judged not a defect, and the lead accepts the judgement: the
keep branch can bless a record whose OS twin does not exist (catch-path failure record, or an
Android force-stop ghost); the pre-change pass also produced no fire there, so no alarm that
would otherwise ring is lost, and the next pass cleans the ghost. FINDINGS: none.

## Adjudication summary

Three reviewers, two findings, both confirmed and fixed by the lead (mutation-proven test pin;
docblock word restored). No defect in the shipped behaviour. The audit's formal close (row
DONE, folder deletion, push) waits on the owner's proof-vehicle ruling and step 02's
completion.
