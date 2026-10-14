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
