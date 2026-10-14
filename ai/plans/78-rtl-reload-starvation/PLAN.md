# Plan 78 — The D59 relaunch starves: the in-process reload silently skips direction-change crossings

| | |
| --- | --- |
| Brief | Row 78 of `ai/plans/README.md`: of six direction-change crossings in three processes (ticket 71's device step, 2026-10-13, 3T mock 2.0.190, production package id), three reloaded with the textbook cycle and three starved silently. Ask what the reload's real firing condition is, and fix it if a repo-side cause exists. |
| Planned at | `b1bf6f89` (`uat`, 2.0.255), 2026-10-14, in the worktree `$HOME/athan-gitree/run-78` on branch `ticket/78` |
| Planned by | The lead session. The owner is not interviewable this run; every owner decision below is delegated by the owner's run order, 2026-10-14, and is recorded as such in section 2. |
| Needs first | nothing |
| Parent | none |
| Group | The language relaunch path: `stores/language.ts` and its tests. Disjoint from row 73's ground (`components/sheets/**`); this plan edits no file row 73 owns. |
| Batch budget | 2 |
| Session budget | 3 |
| Steps count | 2 (one code step, one records step) |
| Device | None. Physical device work is waived by the owner's run order, 2026-10-14. The firing condition is proven unit-side (red-first suite) and source-side (the pinned expo-updates and repo sources). |
| Owner decisions still needed | none (all delegated; section 2 records each) |

## 1. Goal

What is wrong today: `commitLanguagePreference` (`stores/language.ts`) awaits `reconcileLanguageSurfaces()` before the direction branch, and that await blocks on the scheduling queue (`withSchedulingLock`, `stores/notifications.ts`) with no bound and no log line while it waits. When the queue is held by a pass that grinds slowly — every native call may legally burn its 15 s `NATIVE_CALL_TIMEOUT_MS` before being refused — the relaunch never fires: no dequeue line, no `LANGUAGE:` warn, no `Updates state change: Restart`, no exception. That is exactly the silent signature ticket 71 recorded on 3 of 6 crossings (its FINDINGS section 8, D91; the evidence died with 71's merge, the summary lives in row 71's queue record). The once-per-process launch init firing over four minutes late in the drive 3 post-mortem is the same queue crawl seen from the init chain: the init's own refresh enqueues behind the grinding holder and its dequeue line appears minutes late.

What is true when DONE: a direction-change pick relaunches within a bounded wait (10 s) whatever the scheduling queue holds; the capped path logs a warn a capture can see; the healthy path is byte-identical to today (converge, force, reload once, no warn); what converges is unchanged — the queued convergence pass is never cancelled and forward-only convergence heals it in the next context (R3.4, `stores/language.ts` header). The row's question is answered in `FINDINGS.md`: the convergence await is the cause; the direction branch is cleared (it computes true on both crossing directions); the launch-init latch is the aggravator, not the cause (it resets per JS context, so every reload re-runs an unconditionally reopened full notification refresh ahead of the next crossing's convergence); the native reload chain is cleared (the starved logs show no `Restart` state event, which proves `Updates.reloadAsync` was never reached — and the disabled-updates native path logs that event before any restart, `updates-recreate-procedure.txt`).

The owner notices: a future RTL-boundary capture can no longer show a crossing that neither relaunches nor logs. Row 68's record ("every crossing reloads") becomes true again.

Owner rules that apply:

- "do not change WHAT converges, only WHY the reload fires or not" — the owner's run order, 2026-10-14.
- "Physical device work is WAIVED … Prove the firing condition with unit tests and, where a whole-process behaviour is involved, with the existing test patterns for the relaunch path" — the owner's run order, 2026-10-14, naming `__tests__/app/index.test.tsx`, `stores/__tests__/rtlSwitch.test.ts`, `stores/__tests__/languageConvergence.test.ts`, `shared/__mocks__/expo-updates.ts`.
- Notification scheduling logic is ask-first (`ai/AGENTS.md`); this run's delegation covers decisions but the fix still touches no scheduling behaviour: the gate reopen, the init latch and every scheduling path stay untouched.
- Tests never read the real clock: `jest.useFakeTimers({ now })` (`ai/AGENTS.md`).
- Full unit coverage of every line the change touches, red before green, mutation pass on the guarded logic (`ai/AGENTS.md`).

## 2. Decisions

### 2.1 Taken

| ID | Decision | Who | When | Source |
| --- | --- | --- | --- | --- |
| D78.1 | Device work waived; unit tests and pinned sources are the proof. No simulator session unless a dispute needs one. | owner (delegated) | 2026-10-14 | the owner's run order, 2026-10-14 |
| D78.2 | The fix bounds the commit's convergence wait at 10 s on boundary crossings only, then forces the direction and relaunches anyway; the queued pass is left uncancelled and heals next context (R3.4). Cap value 10 s: the measured healthy cycle is ~1.4 s (71's capture) and the sick queue is minutes, so 10 s sits an order of magnitude above the one and below the other. | owner (delegated) | 2026-10-14 | the owner's run order, 2026-10-14, plus the ticket's "fixes it if a repo-side cause exists" |
| D78.3 | The launch-init latch, the unconditional Android gate reopen and every scheduling path stay untouched. The latch is recorded as the aggravator in the verdict. Rationale: changing them changes notification scheduling (ask-first ground) and the ticket limits the fix to why the reload fires. | owner (delegated) | 2026-10-14 | the owner's run order, 2026-10-14 |
| D78.4 | The capped wait applies only when the pick crosses the direction boundary. A same-direction pick keeps today's unbounded await: its convergence exists for the surfaces, not for a relaunch, and the sheet's progress face covers it (D47). | owner (delegated) | 2026-10-14 | the owner's run order, 2026-10-14 |
| D78.5 | Versions 2.0.300 onward, one bump per commit, reserved range 2.0.300 to 2.0.399; `app.json` and `package.json` together (android/ is gitignored, no build this run). No merge into `uat`, no push, no DONE: this branch stops after the audit passes. | owner (delegated) | 2026-10-14 | the owner's run order, 2026-10-14 |
| D78.6 | The plan commits live on `ticket/78` in the worktree, not on `docs/…` branches off `uat`: the parallel ticket 73 runs in a sibling worktree and `uat` is read-only for this run. | owner (delegated) | 2026-10-14 | the owner's run order, 2026-10-14 |

### 2.2 The executor must not decide

- A change the plan's contracts do not name, in particular any edit outside `stores/language.ts` and `stores/__tests__/rtlReloadBound.test.ts` (plus the version files and this plan folder): return `STOP:` naming the file and the need. Row 73's ground (`components/sheets/**`) is untouchable.
- A coverage gap on the new branch that the listed tests cannot close: return `STOP:` with the uncovered line; do not widen behaviour to chase coverage.
- A test that needs the real clock or a real sleep: return `STOP:`; fake timers drive the cap.

## 3. Pre-flight

`scripts/preflight-78.sh` in this folder (the executor copies it to `$TMPDIR`, runs `bash $TMPDIR/preflight-78.sh`). It checks: the worktree path, branch `ticket/78`, a clean tree, head descending from the anchor `b1bf6f89`, `package.json` version at or above 2.0.255, the `node_modules` symlink, and each of the six anchors counting exactly 1 in its source. Expected last line: `PREFLIGHT OK`. Any other output is a `STOP:` return.

## 4. Background the executor needs

### The code map

| File | Anchor | What it holds |
| --- | --- | --- |
| `stores/language.ts` | `language-commit-await.txt` | The firing condition under investigation: the bare `await reconcileLanguageSurfaces()` at line 76, then the direction branch, `forceRTL`, `Updates.reloadAsync` and the refusal warn. |
| `stores/notifications.ts` | `scheduling-queue.txt` | `withSchedulingLock`: a promise-chain queue. The dequeue logs `NOTIFICATION: Starting <name>`; nothing logs while a pass waits. The chain tail swallows rejections, so a failed pass frees the queue, but a slow pass holds it for its whole run. |
| `shared/notifications.ts` | `native-call-timeout.txt` | `NATIVE_CALL_TIMEOUT_MS = 15_000` and `withNativeTimeout`: one silent native call burns 15 s then rejects. Every arming and cancelling call in `device/notifications.ts` is wrapped; the sweep's listing call is wrapped. So passes fail rather than hang, but a sick notification system turns one pass into minutes of queue time. |
| `app/index.tsx` | `launch-init-latch.txt` | `launchInitRan` is a JS module variable: it resets on every in-process reload, so each reload re-runs the launch init, which unconditionally reopens the refresh gate on Android and enqueues a full notification refresh — the pass most likely to sit ahead of the next crossing's convergence. Verdict: aggravator, untouched (D78.3). |
| `node_modules/expo-updates/build/Updates.js` | `updates-js-reload.txt` | JS `reloadAsync`: a dev-mode guard, then a bare `ExpoUpdates.reload(null)`. It rejects only in dev mode or when updates are disabled in development; on a production package id it forwards to native. |
| `node_modules/expo-updates/android/.../RecreateReactContextProcedure.kt` | `updates-recreate-procedure.txt` | The native leg on local mock builds (no updates URL, so `expo-updates` is disabled and `DisabledUpdatesController` routes here): `processStateEvent(UpdatesStateEvent.Restart())` fires before any restart, then `reactHost.restart`. A reload that reached native always leaves the `Restart` state line. |

### The evidence being explained (ticket 71 FINDINGS section 8, D91, transcribed before the folder died with 71's merge)

| Drive | Crossing | Reload |
| --- | --- | --- |
| 1 (pid 21009) | recovery ar→en (discarded, pre-baseline) | yes |
| 1 | crossing 1 en→ar | yes |
| 1 | crossing 2 ar→en | no |
| 2 (pid 22599) | crossing 1 en→ar | no |
| 3 (pid 23273) | recovery ar→en (discarded, pre-baseline) | yes |
| 3 | crossing 1 en→ar | no |

Every starved crossing carries the same silent signature: the face flips (~0.9 s), the preference stores, then no convergence dequeue line, no `LANGUAGE:` warn, no `Updates state change: Restart`, no exception, no marker, no FATAL; the app keeps ticking on the old tree in the new locale past four minutes. The drive 3 post-mortem adds the launch init firing over four minutes late.

### How the pieces interact (the firing condition, traced)

The pick (`components/sheets/screens/languageSheet.ts`, read-only here) runs `commit(id).catch(() => undefined).then(dismiss)`. The commit stores the preference and switches the locale synchronously (both observed on the starved crossings), then awaits `reconcileLanguageSurfaces()`. That function returns early when the last-armed stamp already matches the locale (no dequeue line, but then the direction branch would still fire the reload — the starved crossings would have shown the reload). On a stamp mismatch it enqueues `rescheduleAllForLanguageChange` on the scheduling queue and waits. The await has no bound and emits nothing while queued. When a holder ahead grinds (15 s per silent native call, dozens of calls in a full pass — exactly what a reload-adjacent notification system in a bad state produces, and what finding 82's receiver mechanism documents), the wait outlives the observation window: the relaunch never fires and nothing logs. The missing dequeue line on every starved crossing is the discriminator: the commit died inside the queue wait, before the pass even started. The missing `Restart` state event proves the native leg was never reached, clearing `expo-updates` and RN's restart path: on this build any reached reload logs `Updates state change: Restart` before `reactHost.restart` runs. The direction branch is cleared by computation: `directionBefore` comes from the stored preference (or `launchDirection` when it is empty), and each starved crossing flipped between `en` and `ar`, so the branch condition is true on all six crossings. The launch-init latch is the aggravator: after every textbook reload the fresh JS context re-runs the launch init, which unconditionally reopens the Android refresh gate and enqueues a full pass ahead of the next crossing's convergence, widening the contention window the next pick lands in.

### The existing tests and what each proves

- `stores/__tests__/rtlSwitch.test.ts`: the direction branch fires both ways, a same-direction switch never reloads, a refused relaunch warns and leaves the direction forced. Its `withSchedulingLock` mock is a pass-through, which is why the queue-bound starvation was never covered.
- `stores/__tests__/languageConvergence.test.ts`: the stamp gates one pass, a bail or failure leaves it dirty, the warn text on failure. Same pass-through lock mock.
- `__tests__/app/index.test.tsx`: the launch init latch, once per context, reset per test through `__resetLaunchInitForTests`.
- `shared/__mocks__/expo-updates.ts`: `reloadAsync` as an observed `jest.fn`.

### Why the obvious fixes are wrong

- Reload before converging (reorder): changes the healthy path's observable order on every switch, not only the starved ones, and drops the progress-face contract (D51) for all picks. The bound keeps the healthy path identical.
- Fix the queue's latency or the gate reopen: notification scheduling, ask-first ground, and outside the ticket's "why the reload fires" limit (D78.3).
- Report upstream only: a repo-side cause exists — the unbounded, unlogged await is this repo's code.

### The planning proof (already run, throwaway deleted)

A scratch copy of the starvation test ran against today's code in this worktree and failed at the predicted line: `expect(Updates.reloadAsync).toHaveBeenCalledTimes(1)` → `Expected number of calls: 1 / Received number of calls: 0`. The gate-mocked lock (`withSchedulingLock: (operation) => mockQueueGate.then(() => operation())`) reproduces the held queue without importing the notifications module.

## 5. Design

The approach: bound the wait. On a boundary crossing, race `reconcileLanguageSurfaces()` against a 10 s timer; whichever settles first releases the commit to force the direction and relaunch. The losing timer is cleared when reconciliation wins. The capped path logs one warn. The queued pass is never cancelled: the race only stops the commit waiting on it.

The invariant, one sentence a test can check: a direction-change pick always reaches `Updates.reloadAsync` within 10 s of the pick, whatever the scheduling queue holds, and a same-direction pick or a fast convergence behaves exactly as before the change.

Alternatives rejected: reorder (above); a shorter cap (a single legally-refused native call already burns 15 s, and cutting inside one pass's legal lifetime would make the capped path the common case on a slow phone); a longer cap (the starvation window stays minutes wide).

The concurrency trace: today, pick → store+locale (sync) → queue wait (unbounded, silent) → pass → stamp → forceRTL → reloadAsync. After: pick → store+locale (sync) → race {pass via queue | 10 s timer} → forceRTL → reloadAsync. The queued pass keeps running when the cap wins; the reload tears down the JS context and the pass dies with it only when the teardown reaches it, which the schedule-first reschedule design already tolerates mid-batch (issue #15), and the unwritten stamp makes the next context's init chain re-run convergence (`app/index.tsx` init → `reconcileLanguageSurfaces`; `device/listeners.ts` foreground path). No new shared state, no new module, one constant and one race in `stores/language.ts`.

The design review: the race's timer must be cleared when reconciliation wins, or a late timer fires into a dead commit (harmless on device, a leak in tests); the race must not reject (`reconcileLanguageSurfaces` catches its own failures; the timer only resolves); the warn must fire once, inside the timer callback; the branch condition is computed once before the await and reused, so the capped path and the branch cannot disagree.

**Acceptance criteria:**

- [R1.1] WHEN a direction-change pick's surface convergence has not settled within 10000 ms THE SYSTEM SHALL call `I18nManager.forceRTL` with the new direction and then call `Updates.reloadAsync` exactly once
- [R1.2] WHEN the capped relaunch fires THE SYSTEM SHALL log the warn `LANGUAGE: surface convergence still unsettled after 10000 ms, relaunching for the direction flip`
- [R1.3] WHEN the convergence settles before the cap THE SYSTEM SHALL keep today's order (the rescheduling pass runs, then `allowRTL`, then `forceRTL`, then one `Updates.reloadAsync` call) and log no cap warn
- [R1.4] WHEN the capped relaunch has fired THE SYSTEM SHALL leave the queued convergence operation uncancelled, so it still runs when the scheduling queue frees
- [R2.1] WHEN the pick does not change the direction THE SYSTEM SHALL call `Updates.reloadAsync` zero times and `forceRTL` zero times and log no cap warn
- [R2.2] WHEN `Updates.reloadAsync` rejects THE SYSTEM SHALL log `LANGUAGE: relaunch failed after the RTL flip` and still resolve the commit
- [R3.1] WHEN step 1 has landed THE SYSTEM SHALL carry the firing-condition verdict, its evidence chain and the cleared suspects in the plan folder's `FINDINGS.md`

## 6. Steps

Checklist:

- [ ] Step 1 — bound the boundary-crossing wait (code, weight 2)
- [ ] Step 2 — the verdict record (docs, weight 1)

The steps live in `steps/1-bound-the-reload.md` and `steps/2-records.md`. Batch budget 2, session budget 3: one executor session may run both steps in one batch.

## 7. Device proof

None. Waived by the owner's run order, 2026-10-14. The proof that stands in: the red-first suite (the starvation reproduced unit-side, the planning proof already failed at the predicted line) and the source-pinned native chain (`updates-js-reload.txt`, `updates-recreate-procedure.txt`) that clears `expo-updates` and the RN restart path.

## 8. Records

### FINDINGS.md heading the executor writes

`## The reload's real firing condition (row 78's question, answered)` — the verdict text is prescribed in `steps/2-records.md` and cites: the three suspects (the convergence await condemned; the direction branch cleared; the latch the aggravator), the evidence chain (71's D91 table above, the missing dequeue line as the discriminator, the missing `Restart` state event clearing the native leg), and the fix's contract.

### LOG.md ledger contract

Every step entry opens `### Step <NN> — <state>` and ends `session: <ses_id>`. Planning sections use `## Planning (<date>)` and `## Ticket <N>`.

### The queue cell the lead applies on DONE (the orchestrator applies it; this run stops before DONE)

Append to row 78's status cell, replacing `NOT PLANNED`:

`DONE 2026-10-14, audited: the firing condition pinned and fixed - the commit's convergence await blocked unbounded and unlogged on the scheduling queue, so a pass grinding at 15 s per silent native call starved the relaunch silently (3 of 6 crossings, 71's D91 evidence; the missing dequeue line is the discriminator); the direction branch computes true on both crossing directions and the native chain is cleared (no Updates Restart event in the starved logs proves reloadAsync was never reached; on this build the disabled-updates procedure logs Restart before any restart); the launch-init latch is the aggravator (it resets per JS context, so every reload re-runs an unconditionally reopened full notification refresh ahead of the next crossing) and stays untouched with the scheduling paths (ask-first ground). The fix bounds the boundary-crossing wait at 10 s, warns, and relaunches anyway; forward-only convergence heals in the next context (R3.4). Red-first suite stores/__tests__/rtlReloadBound.test.ts with a mutation pass; device work waived by the owner's run order 2026-10-14, the starvation reproduced unit-side`

### The docs commit message (the orchestrator's DONE commit)

`<VERSION> - docs(plans): ticket 78 DONE: the firing condition pinned and bounded, folder and evidence die with the merge`

## 9. Push

None. The executor never pushes; this run stops on `ticket/78` after the audit passes (the owner's run order, 2026-10-14). The orchestrator merges and pushes.

## 10. When something goes wrong

| Symptom | Action |
| --- | --- |
| An anchor counts 0 or 2 | `STOP: NEEDS REPLAN, <anchor and count>`. Never repair an anchor. |
| `versionLockstep.test.ts` fails at commit | The bump touched one file of the pair; set the same version in `app.json` and `package.json` and recommit. |
| Coverage below 100 on `stores/language.ts` | The new branch has an uncovered line; add the test that reaches it (the race's two outcomes and the same-direction skip are the full set). `STOP:` if a line is unreachable by design. |
| The hook fails on a suite this change did not touch | `STOP:` with the suite name and the failing test; a parallel run shares the version range, so never bump past 2.0.399 and never edit another ticket's files to green it. |
| The red test passes before the code changes | The mock's gate is not holding the queue; the `withSchedulingLock` mock must enqueue behind a promise the test controls. `STOP:` if it holds for a reason the plan does not name. |
| A needed edit falls outside `stores/language.ts` and its test file | `STOP:` naming the file; the parallel invariant forbids it (the owner's run order, 2026-10-14). |

Anticipated review fixes, word for word: the timer is not cleared when reconciliation wins (fix: clear it in the race's settle path); the warn text drifts from R1.2's exact string (fix: restore the string, the test asserts it verbatim); the cap constant is named but unused (fix: the race references it, never a literal); a test advances timers without awaiting (fix: `await jest.advanceTimersByTimeAsync`, the repo's fake-timer pattern).

Per-step restore lists: step 1 touches `stores/language.ts` (restore from the step's parent commit) and adds `stores/__tests__/rtlReloadBound.test.ts` (delete to restore); step 2 adds only files inside this plan folder.

## 11. Subagents

Planning: `explore` workers answer fact questions; `athan-plan-griller` grills this draft. Delivery: the lead dispatches `athan-executor` for steps 1 to 2 (one batch, session budget 3), then `athan-reviewer` twice (plan-conformance and blind). Any worker may call `vision` for an image it cannot see. Nothing else, ever.

## 12. Report to the owner

Plain sentences: the firing condition was the unbounded convergence await; it is bounded at 10 s on boundary crossings with a warn on the capped path; what converges is unchanged and heals next context; the latch is the recorded aggravator; the direction branch and the native chain are cleared with evidence. Then the progress table and the four-line handoff the lead's skill prescribes.
