# Ticket 91: the language-switch crash, BackgroundTasks queried off the main thread

| Field | Value |
| --- | --- |
| Brief | Queue row 91, `ai/plans/README.md` (two .ips reports 2026-10-15, evidence under `$HOME/athan-gitree/sessions/crash-20261015/`, never committed) |
| Planned at | `f9af66c2` (uat, 2.0.751), 2026-10-15, main checkout |
| Planned by | The lead, planning phase, owner interview waived (row 91 and the crash evidence are the record) |
| Needs first | nothing |
| Parent | none |
| Group | `device/backgroundTaskDebug.ts` and its suite alone; row 100's lane holds the visual set, disjoint files |
| Batch budget | 2 |
| Session budget | 2 |
| Steps | 1 (weight 2, code) |
| Device | none: the run order bans device work for this ticket; the reports and the pinned source prove the diagnosis, and the owner's own language-switch read on her phone may be offered to her at DONE through the orchestrator, never run by this ticket |
| Owner decisions still needed | none |

## 1. Goal

Two crashes on the owner's iPhone XS dev build (iOS 18.7.10, app 2.0.254) on
2026-10-15 carry one native signature: an Objective-C exception thrown by
BackgroundTasks inside the reply block of
`BGTaskScheduler getPendingTaskRequestsWithCompletionHandler:`, delivered on a
background queue (an XPC reply queue riding a `_dispatch_workloop_worker_thread`),
rethrown through `NSXPCConnection _decodeAndInvokeReplyBlockWithEvent:` and
terminated as EXC_CRASH Abort trap 6. The exception backtrace of both reports holds
one non-Apple frame chain that names the trigger:
`__56-[BGTaskScheduler _simulateLaunchForTaskWithIdentifier:]_block_invoke`, Apple's
private launch-simulation selector. The 09:53 crash landed 75 s after process
launch, her English-to-Arabic switch mid-read: the in-process reload built a fresh
JS context, the launch effect re-ran, and the debug sequence re-armed. The 05:27
crash landed 46 s after process launch overnight, no reload implicated.

The pinned caller chain, every link source-verified at `f9af66c2`:

1. `app/index.tsx:141` calls `runBackgroundTaskDebugSequence()` in the launch
   effect, once per JS context: cold launch and every in-process reload
   (row 80's relaunch keeps the process alive).
2. `device/backgroundTaskDebug.ts` arms, 8000 ms after the effect settles,
   `simulateBackgroundTaskTrigger()`.
3. That calls the JS `BackgroundTask.triggerTaskWorkerForTestingAsync()`, gated
   `__DEV__` (the dev build served by Metro is a Debug build).
4. `node_modules/expo-background-task/ios/BackgroundTaskModule.swift:28` bridges
   it to `BackgroundTaskDebugHelper.triggerBackgroundTaskTest()`
   (`BackgroundTaskDebugHelper.swift:5`), which invokes the private
   `_simulateLaunchForTaskWithIdentifier:` selector on `BGTaskScheduler.shared`.
5. The simulation queries pending task requests over XPC; the reply block runs on
   the reply queue; the framework throws its main-thread-only exception there;
   nothing on the JS or Swift side can catch an exception that crosses the reply
   boundary, and the process aborts.

The competing caller is eliminated: `BackgroundTaskScheduler.isWorkerRunning()` on
iOS (the module's only other wrapper of a pending-requests query) has no caller in
the module, and `expo-task-manager`'s iOS sources hold no BGTaskScheduler reference.

When DONE, the simulate step never arms on iOS, so the private selector is never
invoked on her phone and the crash class is gone: the owner switches languages on
the dev build without the app dying. What is true on DONE: the debug sequence on an
iOS dev context logs its armed line and its launch snapshot, arms no trigger, and
the Android validation flow on the 3T is byte-identical to today.

The rules that apply:

- `ai/AGENTS.md`, ask-first list: "Ask first: installing dependencies, deleting
  non-empty files, MMKV schema keys, notification scheduling logic, `app.json` and
  `eas.json`." Notification scheduling is ask-first ground: the fix is a
  threading or call-discipline change only, and anything that changes when or what
  gets scheduled is a STOP. The simulate is a debug affordance, not a scheduling
  path; the production register path
  (`stores/notifications.ts:registerBackgroundTask`) is untouched and pinned by a
  read-only anchor.
- The run order (the lead's dispatch, recording the owner's lane rulings for this
  ticket): no device step, the reports and the pinned source prove the diagnosis,
  and a dev-loop verification where the owner switches languages on her phone may
  be offered to her through the orchestrator at DONE, never run by this ticket.
- Row 91's own words for the decision space: "decides the fix repo-side (a
  main-queue hop, patch-package precedented by row 73's picker patch) or an
  upstream report under row 51's discipline, and lands it".
- `ai/AGENTS.md`: "no edits to `node_modules`", "No new dependencies" is not among
  this ticket's asks. The fix changes one app file and its test;
  `patches/expo-background-task+58.0.10.patch` is read for lineage and left alone.

## 2. Decisions

### 2.1 Taken

| ID | Decision | Who, when | Recorded |
| --- | --- | --- | --- |
| D91.1 | The crash's caller is the debug sequence's simulate step, not the register path: the exception backtrace of both reports names the private `_simulateLaunchForTaskWithIdentifier:` block, and the pinned module source shows exactly one in-process caller of that selector, the DEBUG-only helper reached only through `runBackgroundTaskDebugSequence`. | Lead, 2026-10-15, from the two .ips files and `node_modules/expo-background-task/ios/BackgroundTaskDebugHelper.swift` | Queue row 91, this section |
| D91.2 | The fix is repo-side and is the platform gate: `runBackgroundTaskDebugSequence` arms the simulate only when `__DEV__` and `Platform.OS === 'android'` both hold. The patch-package main-queue hop is rejected: both stacks show the throw raised on the XPC reply queue, not at the call site, so hopping the initial call onto the main queue moves neither the reply queue nor the assert, and the row bans the device work that alone could verify the hop. A reload-only gate is rejected too: the 05:27 crash fired 46 s after a cold launch with no reload implicated. | Lead, 2026-10-15, from the row's option list and the reports | This section |
| D91.3 | iOS dev contexts keep the snapshots and the armed log. The snapshot APIs touch no BGTaskScheduler entry point at the pinned versions: `TaskManager.isTaskRegisteredAsync` and `getRegisteredTasksAsync` read the task store, `BackgroundTask.getStatusAsync` answers a constant on a device, and `Notifications.getAllScheduledNotificationsAsync` reads UNUserNotificationCenter. The post-trigger snapshot is skipped on iOS with the trigger: a post-trigger line with no trigger lies. | Lead, 2026-10-15, from the module sources under `node_modules` | This section |
| D91.4 | Production scheduling is untouched: no line under `stores/`, no module file, no patch file changes. The register path stays pinned by the `register-path.txt` anchor, read-only. The step's diff touches exactly `device/backgroundTaskDebug.ts` and `device/__tests__/backgroundTaskDebug.test.ts` among source files. | Lead, 2026-10-15, from the ask-first rule | This section |
| D91.5 | The upstream report (Expo's debug helper aborts iOS 18 processes through a private selector) is offered to the owner at DONE through the orchestrator under row 51's discipline, and is not filed by this run: a public post is publishing, the owner is present but unreachable to workers, and the repo-side gate fixes her build with no dependence on Expo's cadence. | Lead, 2026-10-15, from the row's either-or and the stop rules | This section |
| D91.6 | No device step, no Metro interference: the Metro dev server serving the owner's phone from this checkout is never killed or restarted; branch checkouts hot-reload her phone, which the run order allows. | Lead, 2026-10-15, from the run order | This section |
| D91.7 | The no-device ruling and the scheduling freeze come from the run order (the lead's dispatch recording the owner's lane rulings), and the ask-first ground for notification scheduling is `ai/AGENTS.md`'s own list; row 91's cell carries the decision space, not those words. Section 1 cites each to its source. | Lead, 2026-10-15, from the grill's finding 6 | This section |

### 2.2 The executor must not decide

- Whether the simulate may run on iOS under any condition. It may not; a proposal to
  restore it anywhere is `STOP:`.
- Whether any scheduling path, store, module file or patch file changes. It does
  not; a finding that seems to need one is `STOP:` with the finding.
- Whether the snapshots also leave iOS. They stay; D91.3.
- Whether `simulateBackgroundTaskTrigger` itself gains a platform guard. It does
  not; D91.2 puts the gate at the arm point, the export's only production caller,
  and a second guard adds lines the plan's tests would not cover honestly.

## 3. Pre-flight

`scripts/preflight-91.sh` in this folder, run per its header. It checks the main
checkout on `uat`, a clean tree, `origin/uat` fetched and merged in, HEAD descending
from `f9af66c2`, a version at or above 2.0.751, row 91 READY in the queue, and every
anchor counting exactly 1. It prints `PREFLIGHT OK`.

## 4. Background the executor needs

The main checkout `$HOME/repos/rn.athan.uk` is the only working tree, on
`uat`. A Metro dev server serves the owner's phone from this checkout: never kill
or restart it, and branch checkouts hot-reload her phone, which this ticket's run
order allows. Every commit passes the hooks (`check-identifiers`, `lint-staged`,
`yarn validate`, `check-changed-coverage`), taking 3 to 4 minutes. The suite runs in
the `unit` Jest project, where `react-native` resolves to
`shared/__mocks__/react-native.ts`; its `Platform` object is mutable with
`OS: 'ios'` as the default, so a test flips `Platform.OS` and restores it in
`afterEach`, the pattern of `shared/__tests__/notifications.test.ts`.

Code map (anchors under `scripts/anchors/`, each verified to count 1 at `f9af66c2`):

| File | Role |
| --- | --- |
| `device/backgroundTaskDebug.ts` | The changed file. `runBackgroundTaskDebugSequence` arms per JS context: snapshots always when enabled, the simulate at 8000 ms when `__DEV__`. Anchors `bg-header.txt` (the file doc block), `simulate-doc.txt` (the export's doc block), `arm-doc.txt` (the arm's own doc block, which names the simulate's gate and reads false after the change until contract 4 fixes it), `sequence-arm.txt` (the arm body this step edits). |
| `device/__tests__/backgroundTaskDebug.test.ts` | The suite. The gating describe covers disabled, env-enabled non-dev, prod, and the full dev sequence. Anchors `test-header.txt` (the suite doc), `test-aftereach.txt` (the restore block that gains the Platform restore), `test-full-sequence.txt` (the dev-sequence test that becomes the Android case). |
| `app/index.tsx` | Read only. The launch-effect call site, anchor `index-call.txt`: every JS context, cold launch and reload alike, arms the sequence. This is why the 09:53 reload crash and the 05:27 cold-launch crash share one caller. |
| `stores/notifications.ts` | Read only. `registerBackgroundTask`, anchor `register-path.txt`: the production register path this ticket must not touch. |
| `node_modules/expo-background-task/ios/BackgroundTaskDebugHelper.swift` | Read only, never edited. Anchor `debug-helper.txt`: the private-selector invocation, `#if DEBUG`, the only in-process caller of the frame named in both crash stacks. |
| `node_modules/expo-background-task/ios/BackgroundTaskModule.swift` | Read only. `AsyncFunction("triggerTaskWorkerForTestingAsync")` at line 28 bridges the JS call to the helper. |
| `shared/__mocks__/expo-background-task.ts` | The unit mock: `triggerTaskWorkerForTestingAsync` is a `jest.fn()`, so the suite observes the native boundary without touching the module. |

Existing tests and what each proves: the three gating tests pin the disabled,
env-enabled and prod no-op paths; the full-sequence test pins the 8 s trigger and
the 13 s post-trigger snapshot on a dev context; the snapshot tests pin the log
fields; the direct-simulate tests pin the delegation and the swallowed rejection.
None of them platform-keys the arm today, which is the gap the 09:53 crash exposed:
the suite ran on the default iOS Platform and asserted the trigger fires, the
opposite of the fixed behaviour.

Why the obvious fix is wrong:

- The main-queue hop (patch-package on `BackgroundTaskDebugHelper`, precedented by
  row 73's picker patch): both exception backtraces raise inside the reply block on
  the XPC reply queue. Moving the initial selector call to the main queue does not
  move the queue the reply lands on, so the hop is a guess this ticket cannot
  verify: the row bans device work, and no unit test can see an XPC reply queue.
- A reload-only gate (skip the simulate in a reloaded context): the 05:27 report
  crashed 46 s after process launch with no second context implicated, so a
  reload gate leaves that crash standing.
- Guarding inside `simulateBackgroundTaskTrigger`: the arm point is the export's
  only production caller, the guard there skips the post-trigger snapshot with the
  trigger instead of leaving a lying snapshot line, and one gate keeps the diff to
  the lines the tests honestly cover.

## 5. Design

The arm computes one boolean, `__DEV__ && Platform.OS === 'android'`, logs it as
`canSimulate` in the armed line, and returns before arming the simulate timers when
it is false. The invariant a test checks: a dev context on iOS never calls
`triggerTaskWorkerForTestingAsync` and never logs the post-trigger snapshot, while a
dev context on Android calls it once at 8000 ms and logs the post-trigger snapshot
at 13000 ms, with the disabled, env-enabled and prod paths unchanged on both
platforms.

Alternatives rejected: section 4's three, and deleting the whole debug sequence
(which would take the 3T's validation flow with it, beyond this ticket's ask).

Concurrency: none. The change adds one synchronous platform read before any timer
arms; no threads, no worklets, no subscriptions, no state. The timers it gates were
already owned by the launch effect and die with their context.

Design review: the changed file is dev instrumentation with one production caller;
the coverage gate sees one changed source file fully covered by its existing suite
plus the two platform tests; the Android flow is byte-identical; the owner's phone
receives the fix through Metro's normal reload with no interference from this
ticket.

**Acceptance criteria:**

- [R1.1] WHEN `runBackgroundTaskDebugSequence` runs with `__DEV__` true and `Platform.OS` `ios` THE SYSTEM SHALL NOT call `triggerTaskWorkerForTestingAsync` and SHALL NOT log `BACKGROUND_TASK_DEBUG: post-trigger snapshot`.
- [R1.2] WHEN `runBackgroundTaskDebugSequence` runs with `__DEV__` true and `Platform.OS` `android` THE SYSTEM SHALL call `triggerTaskWorkerForTestingAsync` once after 8000 ms and log `BACKGROUND_TASK_DEBUG: post-trigger snapshot` after 13000 ms.
- [R2.1] WHEN the sequence arms with `__DEV__` true and `Platform.OS` `ios` THE SYSTEM SHALL log `BACKGROUND_TASK_DEBUG: Sequence armed` with `canSimulate: false` and still log `BACKGROUND_TASK_DEBUG: launch snapshot`.
- [R2.2] WHEN the sequence arms with `__DEV__` true and `Platform.OS` `android` THE SYSTEM SHALL log `BACKGROUND_TASK_DEBUG: Sequence armed` with `canSimulate: true`.
- [R3.1] WHILE `__DEV__` is false THE SYSTEM SHALL keep today's sequence behaviour: no simulate call, snapshots only when the env flag enables them outside prod.
- [R4.1] WHEN the step commits THE SYSTEM SHALL hold source changes in exactly `device/backgroundTaskDebug.ts` and `device/__tests__/backgroundTaskDebug.test.ts`, leaving every scheduling path byte-identical.

## 6. Steps

- [ ] Step 1 (weight 2, `steps/1-android-only-simulate.md`): the platform gate at
  the arm point, the suite's platform tests, one commit. Requirements R1.1, R1.2,
  R2.1, R2.2, R3.1, R4.1.

Batch and session budgets: one step of weight 2 fills one batch and one executor
session. No device step exists.

## 7. Device proof

None. The run order bans device work for this ticket: the two reports and the
pinned source prove the diagnosis and the fix's reach. The owner's own
language-switch read on the dev build may be offered to her at DONE through the
orchestrator, never run by this ticket.

## 8. Records

The executor appends to `LOG.md` under `## Ticket 91` (heading exactly that) the
step's measured values: branch, commit sha, version, the hook's `Tests:` line, the
four coverage lines, the break script's last line, the review verdict, the merge
sha.

The queue cell the lead applies on DONE:

> DONE 2026-10-15, audited: the crash's caller pinned (the debug sequence's
> simulate step invoking BGTaskScheduler's private launch-simulation selector; its
> pending-request XPC reply throws a main-thread-only exception on a background
> queue and aborts the process, two identical .ips stacks, the 09:53 one her
> English-to-Arabic reload) and the simulate gated to Android in `__DEV__`: iOS dev
> keeps the armed line and launch snapshot, Android's validation flow is
> byte-identical, production scheduling untouched. The patch-package main-queue hop
> rejected (the throw rides the reply queue the hop cannot reach); an upstream
> report under row 51's discipline offered to the owner with this DONE.

The executed docs commit message: `<VERSION> - docs(plans): ticket 91 executed: the
background-task simulate arms on Android only`.

**LOG.md ledger contract:** every step entry in `LOG.md` opens with the heading
`### Step <NN> — <state>` and ends with a line `session: <ses_id>`. Planning
sections use `## Planning (<date>)` and `## Ticket <N>`.

## 9. Push

None. The executor worker never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | Meaning | Action |
| --- | --- | --- |
| The new iOS test stays red after the change | The gate's platform clause did not land, or the test's `Platform.OS` restore leaked from an earlier test | Compare the gate line against the contract byte-for-byte; check the `afterEach` restore; anything else is `STOP:` |
| `tsc` or Biome fails on the `Platform` import | The import sits outside Biome's sorted order | Move it to the contract's line, directly under the `expo-task-manager` import; any other fix is `STOP:` |
| The hook's coverage gate names `backgroundTaskDebug.ts` under 100 | A branch of the gate or the log field lost its test | Restore the missing platform side of the two tests verbatim; never an ignore comment |
| A test outside `device/__tests__/backgroundTaskDebug.test.ts` fails | The change reached past the arm | `STOP:` with the failing test and its output quoted |
| `git merge` into `uat` conflicts | Another lane moved the same lines | `git merge --abort`, then `STOP:` |
| The version lock still exists after 15 minutes of retries | The lane lead of row 100 holds it or a session died holding it | `STOP:` with the lock path and the last observed holder |
| An anchor counts other than 1 | The anchored code changed under the ticket | `NEEDS CONTEXT: NEEDS REPLAN, <anchor and count>` |

Anticipated review fixes, word for word:

- If a reviewer proposes a platform guard inside `simulateBackgroundTaskTrigger`
  too: reject with D91.2; the arm point is the only production caller and one gate
  keeps the covered lines honest.
- If a reviewer proposes the patch-package main-queue hop instead: reject with
  D91.2; both stacks raise on the reply queue, and the hop is unverifiable without
  the device work the row bans.
- If a reviewer asks why the snapshots stay on iOS: D91.3; the snapshot APIs touch
  no BGTaskScheduler entry point at the pinned versions.

Per-step restore lists: step 1's is inside the step file.

## 11. Subagents

Planning used the repository, git history and the two crash reports; the grill runs
as one `athan-plan-griller` dispatch against this folder and the main checkout.
Delivery: the lead dispatches one `athan-executor` for step 1, then
`athan-reviewer` three times (plan-conformance with this folder, blind, and a third
blind pass focused on threading and lifecycle, this ticket touching the
notification periphery). No other workers.

## 12. Report to the owner

Plain sentences: the crash was the app's own debug instrumentation, a background
task simulator that talks to a private Apple API which iOS 18 kills the process
for; the simulator now runs on Android only, her language switches on the dev
build stop dying, the Android validation flow and all production scheduling are
unchanged. Then the progress table and the four-line handoff.
