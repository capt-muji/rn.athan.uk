# LOG — ticket 78

## Ticket 78

The D59 relaunch starves: the in-process reload silently skips most direction-change
crossings. Row 78 of `ai/plans/README.md`. This run: plan, grill, execute, audit on
branch `ticket/78` in `$HOME/athan-gitree/run-78`; no merge, no push, no DONE (the
owner's run order, 2026-10-14).

## Planning (2026-10-14)

Facts pinned before drafting:

- The commit path read end to end: `stores/language.ts` `commitLanguagePreference`
  (the convergence await, the direction branch, the reload catch),
  `stores/notifications.ts` `withSchedulingLock` (the promise-chain queue; the
  dequeue logs, the wait logs nothing), `shared/notifications.ts`
  `withNativeTimeout` (15 s per silent native call), `device/notifications.ts`
  (every arming and cancelling call wrapped), `app/index.tsx` (the launch-init
  latch and the unconditionally reopened Android refresh gate),
  `device/listeners.ts` (the foreground convergence retry).
- The pinned expo-updates sources: JS `reloadAsync` rejects only in development
  (`updates-js-reload.txt`); on a local mock build updates are disabled and the
  native leg is `RecreateReactContextProcedure`, which fires the
  `UpdatesStateEvent.Restart()` state line before any restart
  (`updates-recreate-procedure.txt`).
- Ticket 71's FINDINGS section 8 (D91) recovered from git (`git show
  af4588bc:ai/plans/71-appstate-teardown/FINDINGS.md`): the drive table and the
  silent signature, transcribed into `PLAN.md` section 4.
- The discriminator: the starved crossings log no convergence dequeue line, so the
  commit died inside the queue wait; they log no `Updates state change: Restart`,
  so the native leg was never reached. The direction branch computes true on both
  crossing directions. The latch is the aggravator.
- Planning proof (throwaway suite, deleted before any commit): with the lock mocked
  as a gate that never frees, today's code never calls `Updates.reloadAsync`;
  the proof failed at `expect(Updates.reloadAsync).toHaveBeenCalledTimes(1)` with
  `Expected number of calls: 1 / Received number of calls: 0`.

Owner decisions D78.1 to D78.6 recorded in `PLAN.md` section 2, each delegated by
the owner's run order, 2026-10-14.

session: ses-lead-78-planning

## Planning (2026-10-14) — the grill

The `athan-plan-griller` pass returned eleven findings. Adjudication: five musts,
five shoulds and one nice, every one accepted and applied:

1. must — the mock gate was a single module-scope `const` Promise; the first
   release freed the queue for the rest of the file. Fixed: `let` gate,
   recreated per test in `beforeEach`.
2. must — step 1's change replaces the lines the `language-commit-await.txt`
   anchor spans, so step 2's preflight would count 0 and die. Fixed: contract
   item 5 updates the anchor in the same commit.
3. must — the break script's `Tests: 1 failed` expectation was wrong for
   mutations a and b (test 5 times out with them). Fixed: per-mutation
   expectations.
4. must — test 5 had no reload call-count assertion, so its red today was a
   timeout, not the claimed line. Fixed: the assertion added before the
   `.resolves` await.
5. must — step 1's ledger edits dirtied the tree for step 2's preflight.
   Fixed: the preflight's clean check excludes the plan folder; the ceiling
   check (finding 11) added in the same edit.
6. should — 2.0.301 was skipped silently in D78.5. Fixed: the sequence spelled
   out.
7. should — the break script's perl patterns could miss a differently shaped
   implementation. Fixed: contract items 2 and 4 pin the race statement and
   the warn literal.
8. should — test 2 did not assert the reschedule's position in the order.
   Fixed: `invocationCallOrder` reschedule < allow < force < reload.
9. should — the Restart log line is emitted by `UpdatesStateMachine.kt`, not
   the procedure file. Fixed: the citation extended in PLAN.md section 4 and
   step 2.
10. should — the timer-clear contract had no observer. Fixed:
    `expect(jest.getTimerCount()).toBe(0)` in test 2.
11. nice — the version ceiling 2.0.399 is now enforced by the preflight.

The gate prints `PLAN OK` after the fixes; the preflight prints `PREFLIGHT OK`
with the plan folder dirty, as its exclusion intends.

session: ses-lead-78-planning
