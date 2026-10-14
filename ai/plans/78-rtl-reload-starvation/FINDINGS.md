# FINDINGS — ticket 78

## The reload's real firing condition (row 78's question, answered)

The verdict, one sentence: the D59 relaunch fires only after `commitLanguagePreference`'s
`await reconcileLanguageSurfaces()` settles (`stores/language.ts`), and that await blocked
unbounded and unlogged on the scheduling queue (`stores/notifications.ts`, `withSchedulingLock`)
— a repo-side cause, fixed at 2.0.302 by the 10 s bound.

The evidence chain:

- Ticket 71's FINDINGS section 8 (D91) drive table — six direction-change crossings in three
  processes, three reloaded, three starved silently — transcribed in this plan's `PLAN.md`
  section 4.
- The discriminator: the starved crossings log no `NOTIFICATION: Starting
  reconcileLanguageSurfaces` dequeue line (`stores/notifications.ts` logs it when a pass leaves
  the queue), which places the death inside the queue wait, before the pass started. The commit
  had already stored the preference and switched the locale (both observed on the starved
  crossings), so the pick died between the synchronous writes and the branch below the await.
- The missing `Updates state change: Restart` event in the starved logs proves
  `Updates.reloadAsync` was never reached and clears the native leg: `updates-js-reload.txt`
  (the JS wrapper only rejects in development mode); `updates-recreate-procedure.txt` (on a
  local mock build updates are disabled and the disabled-updates procedure posts the Restart
  state event before any restart); the log line is emitted by the state machine that procedure
  drives (`UpdatesStateMachine.kt`).
- The launch init firing over four minutes late in drive 3 is the same queue crawl seen from
  the init chain: the init's own refresh enqueued behind the grinding holder and its dequeue
  line appeared minutes late.

The cleared suspects:

- The direction branch computes true on both crossing directions: each starved crossing
  flipped between `en` and `ar`, and `directionBefore` reads the stored preference
  (`stores/language.ts`), which alternates with each pick — the branch was never the gate.
- The native reload chain (previous point): a reached reload always leaves the `Restart` state
  line on this build, and the starved logs have none.
- `I18nManager.forceRTL` is synchronous and precedes the await's resolution path
  (`stores/language.ts`), so it never gates the reload.

The condemned suspect and the aggravator:

- Condemned and fixed: the convergence await — unbounded, silent while queued, fixed at 2.0.302.
- The aggravator, left untouched: the launch-init latch (`app/index.tsx`, `launchInitRan`) is a
  JS module variable reset by every in-process reload, so each reload re-runs the launch init
  and its unconditionally reopened Android refresh gate, enqueuing a full notification pass
  ahead of the next crossing's convergence and widening the contention window. It stays
  untouched with every scheduling path: notification scheduling is ask-first ground and the
  owner's run order limits the fix to why the reload fires (D78.3).

The fix's contract: on a boundary crossing the convergence wait is bounded at 10 s
(`RELOAD_CONVERGENCE_CAP_MS`, `stores/language.ts`); the capped path logs one warn and
relaunches anyway; the queued convergence pass is never cancelled — the race only stops the
commit waiting on it — and forward-only convergence completes it in the next context (the
`app/index.tsx` init chain, the `device/listeners.ts` foreground path, the healing contract in
`stores/language.ts`'s header). What converges is unchanged.

The residual, stated plainly: the unit suite (`stores/__tests__/rtlReloadBound.test.ts`)
reproduces the starvation and proves the bound; the native silence that makes a real queue
grind (finding 82's receiver mechanism) is documented in `shared/notifications.ts` and is not
re-proven here — device work is waived by the owner's run order, 2026-10-14.
