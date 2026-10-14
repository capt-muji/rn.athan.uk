# Step 2 — The verdict record

Requirements: R3.1
Weight: 1

## Anchor check

`bash $TMPDIR/preflight-78.sh` ends `PREFLIGHT OK` after step 1's commit.

## Goal

Row 78's question ("what the reload's real firing condition is") is answered in the plan folder's `FINDINGS.md`, with the evidence chain and every suspect cleared or condemned, so the audit and the orchestrator's DONE record cite one file.

## Branch

`ticket/78` in `$HOME/athan-gitree/run-78`.

## Files

- `ai/plans/78-rtl-reload-starvation/FINDINGS.md` (new)
- `ai/plans/78-rtl-reload-starvation/LOG.md` (the step entry)
- `app.json`, `package.json` (the version bump, together, 2.0.303)

## Red tests

None: a records step. The criterion R3.1 is checked by the audit reading the file.

## Change contracts

`FINDINGS.md` opens with the heading `## The reload's real firing condition (row 78's question, answered)` and carries, in order:

1. The verdict in one sentence: the D59 relaunch fires only after `commitLanguagePreference`'s `await reconcileLanguageSurfaces()` settles, and that await blocked unbounded and unlogged on the scheduling queue — a repo-side cause, fixed at 2.0.302 by the 10 s bound.
2. The evidence chain, citing: ticket 71's FINDINGS section 8 (D91) drive table (six crossings, three starved, transcribed in this plan's `PLAN.md` section 4); the discriminator — no `NOTIFICATION: Starting reconcileLanguageSurfaces` dequeue line on the starved crossings, which places the death inside the queue wait, before the pass started; the missing `Updates state change: Restart` event, which proves `Updates.reloadAsync` was never reached and clears the native leg (`updates-js-reload.txt`: the JS wrapper only rejects in development; `updates-recreate-procedure.txt`: the disabled-updates procedure posts the Restart state event before any restart, and the log line is emitted by the state machine the procedure drives, `UpdatesStateMachine.kt`); the launch init firing over four minutes late in drive 3, the same queue crawl seen from the init chain.
3. The cleared suspects: the direction branch computes true on both crossing directions (each starved crossing flipped between `en` and `ar`; `directionBefore` reads the stored preference, which alternates with each pick); the native reload chain (previous point); `I18nManager.forceRTL` is synchronous and precedes the await's resolution path, so it never gates the reload.
4. The condemned suspect and the aggravator: the convergence await (fixed); the launch-init latch — a JS module variable reset by every in-process reload, so each reload re-runs the launch init and its unconditionally reopened Android refresh gate, enqueuing a full notification pass ahead of the next crossing's convergence. Left untouched with every scheduling path: notification scheduling is ask-first ground and the run order limits the fix to why the reload fires (D78.3).
5. The fix's contract, one paragraph: on a boundary crossing the convergence wait is bounded at 10 s; the capped path warns and relaunches anyway; the queued pass is never cancelled; forward-only convergence completes it in the next context (`app/index.tsx` init chain, `device/listeners.ts` foreground path, the healing contract in `stores/language.ts`'s header). What converges is unchanged.
6. The residual, stated plainly: the unit suite reproduces the starvation and proves the bound; the native silence that makes a real queue grind (finding 82's receiver mechanism) is documented in `shared/notifications.ts` and is not re-proven here — device work is waived by the owner's run order, 2026-10-14.

No sentence names a model, a serial, a place or a person. The queue cell text for DONE and the docs commit message live in `PLAN.md` section 8; this file does not repeat them.

## Green run

`bash scripts/check-plan.sh ai/plans/78-rtl-reload-starvation` still prints `PLAN OK` (the records step adds no criteria). The audit reads `FINDINGS.md` against this contract.

## Break script

None: a records step has no guarded logic. The audit's blind pass is the check.

## Version and commit

Bump `app.json` then `package.json` to `2.0.303`. Commit:

`2.0.303 - docs(plans): 78 verdict: the convergence await was the firing condition, bounded at 2.0.302`

## Review checklist

- Every claim in `FINDINGS.md` names its source (a file, an anchor, or 71's D91 table).
- The verdict matches what the code and tests prove, nothing wider.
- No banned identifiers, no model names, no device-specific values.

## Merge

None this run (D78.5, D78.6).

## Done when

The step 2 box is ticked in `PLAN.md` section 6, the commit is on `ticket/78`, and `LOG.md` carries the entry with its `session:` line.
