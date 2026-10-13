# Ticket 71: AppState soft exception on the language relaunch teardown

| Field | Value |
| --- | --- |
| Brief | Every RTL boundary crossing logs one non-fatal `ReactNoCrashSoftException` from `AppStateModule.onHostPause` racing the ReactContext teardown (found by row 68's device proof, 2026-10-13). The relaunch is an in-process JS reload (`Updates.reloadAsync`), pid unchanged, the launch line re-appearing about 1.5 s later. The row asks whether the AppState listener should pause before the reload, and fixes it if so |
| Planned at | uat `053ffaab` (2.0.187, 2026-10-13) |
| Planned by | Planning (owner away; her rulings are the brief and the queue records) |
| Needs first | nothing |
| Parent | none |
| Group | none (no open ticket touches `stores/language.ts`, `device/listeners.ts` or the reload path) |
| Batch budget | 3 (step 1 is the whole docs batch; step 2 is device weight and dispatches alone) |
| Session budget | 4 (both steps fit one session; the device step runs alone inside it) |
| Steps count | 2 |
| Device | OnePlus 3T (`3T_SERIAL`), Android 9, mock build `com.mugtaba.athan` (the floor test device's mock install, the rows 39, 63 and 68 precedent) |
| Owner decisions still needed | none (D88 to D90 taken under the owner-away rule; section 8 names what she may reopen) |

## 1. Goal

Every crossing of the RTL language boundary runs the D59 relaunch (`stores/language.ts:77-89`:
force the new direction, then `await Updates.reloadAsync()` at `:83`). Each crossing logs one
non-fatal `ReactNoCrashSoftException` from `AppStateModule.onHostPause` racing the ReactContext
teardown. The row's question: should the AppState listener pause before the reload, and does the
answer produce a code fix?

The answer, settled from the pinned sources and re-proven on device: **no.** The throw path is
entirely native and runs inside React's own reload sequence; the app's JS AppState listeners sit
downstream of the emitting native module and cannot suppress the exception. The fix-if-so branch
stays untaken, and the row ends at that verdict with the exception line pinned verbatim into the
record. When DONE the queue carries the traced chain, the verdict and the pinned line; the app
ships no change.

The owner's rules that apply, quoted with their source:

- "Posture is aggressive: fix and report." (`ai/AGENTS.md` Hard rules). Weighed: the evidence
  closes every repo-side lever, so the honest fix is the record, not a patch.
- "Full unit coverage of every line a change touches" (`ai/AGENTS.md` Hard rules): vacuous
  here because no line changes; the verdict doc carries the proof burden instead.
- Version bump on every commit, the three files together (`ai/AGENTS.md` Hard rules): both
  steps bump.
- build-mock.zsh always produces the production package id carrying mock data; check
  `aapt2 dump badging` before any install to a phone the owner uses (`ai/AGENTS.md`
  Commands). The step installs to `3T_SERIAL` only, the floor test device, and stops for any
  other serial.

## 2. Decisions

### 2.1 Taken

| ID | Decision | Who | When | Recorded |
| --- | --- | --- | --- | --- |
| D88 | The row's question is answered from the pinned sources; the answer is no. The throw path is native-internal (`ReactHostImpl.reload` pauses the dying context; `AppStateModule.onHostPause` emits into the teardown race; the drop logs and never throws). The repo's three JS listeners sit downstream of the emit, so no pause-before-reload change ships. Source: the trace in section 4, every hop anchor-counted; row 66's option 1 (folded per D85) keeps the D59 relaunch. | Planning (owner away; the brief's "fixes it if so" makes the evidence the ruling) | 2026-10-13 | PLAN.md sections 4 and 5; `steps/1-verdict.md` |
| D89 | The device proof runs once (row 66's investigation-only pricing, folded in its queue cell, is not carried further): row 68's evidence died in its DONE merge, so the record's exception line is otherwise uncited. Step 2 pins the line verbatim into FINDINGS.md section 7 and `sessions/71/`. | Planning | 2026-10-13 | `steps/2-crossing-proof.md` |
| D90 | The device step observes and transcribes; it judges nothing. An observed line that contradicts the traced chain (wrong message, wrong stack frame, wrong count) is NEEDS REPLAN, never an executor repair. | Planning | 2026-10-13 | `steps/2-crossing-proof.md` STOP list |

### 2.2 The executor must not decide

Each situation below stops work. Return `STOP:` with the observation, or
`NEEDS_CONTEXT: NEEDS REPLAN, <reason>` where named.

1. The observed exception count per crossing is not exactly 1, or the stack does not name
   `AppStateModule.onHostPause`. Transcribe the block verbatim, return NEEDS REPLAN (D90).
2. The build's `aapt2 dump badging` line does not start
   `package: name='com.mugtaba.athan' versionCode=`. Do not install; return STOP with the
   line printed.
3. The connected device serial is not the value of `3T_SERIAL`. Do not install; return STOP.
   The fleettest-suffix build path is not in this plan.
4. `grep -F "APP: feature flags resolved"` on the capture returns 0. The marker does not reach
   logcat on this build; the span is unmeasurable. Return NEEDS REPLAN with the capture path.
5. A `FATAL EXCEPTION` line appears in the capture. Return STOP with the block.

## 3. Pre-flight

`scripts/preflight-71.sh` (committed in this folder). The executor saves a copy to `$TMPDIR`
and runs it from there: `bash "$TMPDIR/preflight-71.sh"`. It checks: the checkout is on `uat`,
the tree is clean, `origin/uat` is merged in, the version is at or above the Planned at 2.0.187,
the Needs first list is empty, and every anchor in `scripts/anchors/` counts exactly 1 against
its source file. It ends `PREFLIGHT OK` on success and exits non-zero with the failed check
named otherwise. A count other than 1 is NEEDS REPLAN, never an executor repair.

## 4. Background the executor needs

### The code map

| File | Role |
| --- | --- |
| `stores/language.ts` | `commitLanguagePreference` (:65-93): stores the preference, switches the locale, awaits convergence (:76), and on a direction change forces it and reloads (:77-89). Anchor `language-reload-branch.txt`. |
| `device/listeners.ts` | The launch AppState listener: one subscription, process-wide, registered at `:79`, never removed; `previousAppState` seeds from `AppState.currentState` at `:27`. Anchor `listeners-registration.txt`. |
| `app/index.tsx` | Mount effect calls `initializeListeners` (:107); the launch marker line `APP: feature flags resolved` logs at `:100` on every tree the reload starts. Anchor `listeners-call-site.txt`. |
| `shared/perf.ts` | Second AppState listener (:205), the perf flush on background; live only behind the perf monitor gate. Anchor `perf-listener.txt`. |
| `hooks/useNotification.ts` | Third AppState listener (:37), the permission-settings return watcher; removes itself. Anchor `usenotification-listener.txt`. |
| `components/ui/Error.tsx` | The second production `reloadAsync` site (:30, the error screen's recovery). The same teardown log rides every reload from any site. Anchor `error-screen-reload.txt`. |
| `node_modules/.../appstate/AppStateModule.kt` | The native module: `onHostPause` sets background and emits (:46-49); `sendEvent` guards on `hasActiveReactInstance()` and drops silently when the instance is gone (:63-72). Anchors `appstate-onhostpause.txt`, `appstate-sendevent-guard.txt`. |
| `node_modules/.../bridge/ReactContext.java` | `onHostPause` fans out to lifecycle listeners (:321-334). Anchor `reactcontext-onhostpause.txt`. |
| `node_modules/.../runtime/BridgelessReactContext.kt` | `hasActiveReactInstance` delegates to the host's instance flag (:109); `emitDeviceEvent` calls `callFunctionOnModule` (:159-164). Anchor `bridgeless-hasactive.txt`. |
| `node_modules/.../runtime/ReactHostImpl.kt` | The reload chain resets the task ref then pauses the dying context while RESUMED (:1316-1317, :1330-1336); the emit path drops and raises when the task result is null (:916-926); the raise logs a `ReactNoCrashSoftException` (:897-908); the task ref's initial null-result value and the `reactInstance` field (:129-130); the instance flag the guard reads (:346-348); the destroy step that clears the field, fourth in the chain (:1385-1392). Anchors `reacthostimpl-reload-pause.txt`, `reacthostimpl-taskref-reset.txt`, `reacthostimpl-decls.txt`, `reacthostimpl-drop.txt`, `reacthostimpl-isinitialized.txt`, `reacthostimpl-destroy-step.txt`. |
| `node_modules/.../bridge/ReactSoftExceptionLogger.kt` | The soft logger prints via `FLog.e` and never throws (:68-77). Anchor `softexception-logger.txt`. |
| `node_modules/.../procedures/RestartReactAppExtensions.kt` | The expo restart extension calls `reload(reason)` (:28-32). Anchor `expo-restart-extension.txt`. |
| `node_modules/.../updates/UpdatesModule.kt` | The native entry for `reloadAsync`, `AsyncFunction("reload")` (:65-68). Anchor `updates-module-reload.txt`. |
| RN 0.88.0-rc.3, expo-updates as pinned | The versions every node_modules citation reads. |

### How the pieces interact: the throw path, hop by hop

1. The pick crosses the RTL boundary; `commitLanguagePreference` reaches the D59 branch and
   calls `Updates.reloadAsync()` (`stores/language.ts:83`).
2. expo-updates' native `AsyncFunction("reload")` relaunches the React application
   (`UpdatesModule.kt:65-68`), resolving the React host and calling `reload(reason)`
   (`RestartReactAppExtensions.kt:28-32`).
3. `ReactHostImpl.reload` resets the instance task ref, then on the UI executor pauses the
   dying context while its lifecycle state is RESUMED
   (`ReactHostImpl.kt:1330-1336`).
4. `ReactContext.onHostPause` fans out synchronously to the lifecycle listeners
   (`ReactContext.java:321-334`), reaching `AppStateModule.onHostPause`, which sets the
   module state to background and emits `appStateDidChange`
   (`AppStateModule.kt:46-49`).
5. The drop is ordered, not a lost race. The reload first resets the instance task ref to its
   initial value, a completed task holding a null result (`ReactHostImpl.kt:1316-1317`, the
   initial value declared at `:129`), then pauses the dying context (`:1330-1336`). The
   module's guard reads a different field, the `reactInstance` member (`:130`, read by
   `isInstanceInitialized` at `:347-348` through `BridgelessReactContext.kt:109` from
   `AppStateModule.kt:68`), which stays live until the chain's destroy step (`:1387`, fourth
   in the continuation chain, after the pause). The guard passes, the emit dispatches onto the
   reset ref, the task result is null, and `callFunctionOnModule` lands on
   `callWithExistingReactInstance`, which raises (`ReactHostImpl.kt:916-926`).
6. The raise logs a `ReactNoCrashSoftException` through `ReactSoftExceptionLogger`
   (`ReactHostImpl.kt:897-908`), which prints via `FLog.e` and never throws
   (`ReactSoftExceptionLogger.kt:68-77`). The exception object is constructed at the raise
   site, so its captured stack carries the `AppStateModule.onHostPause` frames the row 68
   record read.

### Why the obvious fix is wrong

Pausing (unsubscribing) the app's AppState listener before `reloadAsync` cannot touch any hop
of the throw path: hops 2 to 6 are native, and the JS listeners only consume the event the
native module emits at hop 4. React's own reload sequence pauses the dying context
unconditionally while RESUMED, so the exception logs whatever the JS side holds. The change
would be dead code on a working path, which the repo's discipline rejects (aggressive fix, but
a fix must fix; `ai/AGENTS.md` Hard rules).

### What the dropped event costs

The dropped emit is the dying tree's background transition. No consumer needs it: the
relaunched tree re-seeds `previousAppState` from `AppState.currentState`
(`device/listeners.ts:27`) on its fresh registration (`app/index.tsx:108`), so no stale
background-to-active transition is expected or missed; the perf flush (`shared/perf.ts:205`)
loses one flush into a tree that dies about 1.5 s later, behind a dev gate; the permission
watcher (`hooks/useNotification.ts:37`) removes itself and is unrelated to reload timing. The
post-reload convergence stamp-bails (`stores/language.ts:38`), so no re-arm work is lost.

### The existing tests

- `stores/__tests__/rtlSwitch.test.ts` covers `commitLanguagePreference`'s D59 branch.
- `device/__tests__/listeners.test.ts` covers the listener registration and resume actions.
- Both stay untouched: this row changes no code and no test.

## 5. Design

**Approach.** Investigation row shaped like rows 65 and 66: the deliverable is FINDINGS.md in
the plan folder, folded into the queue cell at DONE, the folder dying with the merge. Step 1
writes the static verdict from the pinned sources. Step 2 pins the exception line on the 3T and
appends section 7.

**Invariant, one sentence a check can test:** every section 2 hop carries its anchor whose
count is exactly 1 at the Planned at sha, every other load-bearing claim carries a
`file:line` citation checked against source by step 1's read-against-source contract, and
the verdict sentence of section 6 appears verbatim in FINDINGS.md section 6.

**Alternatives rejected:**

1. Unsubscribe the app's AppState listener(s) before `reloadAsync`. Rejected: downstream of the
   emit, no effect on the raise (section 4, "Why the obvious fix is wrong").
2. Patch React Native core to guard or silence the raise (patch-package shape). Rejected:
   `patches/` today carries only expo-background-task, expo-location and expo-widgets; an RN
   core patch is a new surface carried on every re-pin, for zero behaviour change. The row 51
   discipline is the repo's settled answer for RN and expo corrections: file them upstream; a
   local patch dies at the next re-pin. If the owner ever wants the line gone, the lever is an
   upstream report carrying the traced chain of section 4.
3. Suppress at the logger by wiring a `ReactSoftExceptionListener`. Rejected: a native listener
   needs a native module or a patch, the same rejection as alternative 2 with more machinery.
4. Stop reloading (drop the D59 relaunch). Rejected: D59 is the owner's landed ruling and row
   66's option 1 keeps it; the exception is a recorded cost of that ruling, not a new defect.

**Concurrency trace.** One reload, one ordered drop, one log line: the reload resets the
instance task ref (`ReactHostImpl.kt:1316-1317`) before it pauses the dying context
(`:1330-1336`), so the emit's dispatch deterministically finds the null-result task while the
module's guard still reads the live `reactInstance` field (`:130`, cleared only at the
destroy step, `:1387`). The record states the count as exactly one per crossing; step 2
re-measures it.

**Design review.** Self-reviewed cold against the griller's reading: the chain has no JS hop
the repo can cut; the device step proves the record rather than the verdict, because the
verdict is already proven by the anchors.

### Acceptance criteria

- [R1.1] WHEN the verdict doc lands FINDINGS.md THE SYSTEM SHALL list every AppState listener in the repository with its file:line and its behaviour when the reload tears the context down.
- [R1.2] WHEN the verdict doc lands FINDINGS.md THE SYSTEM SHALL trace the soft exception from `Updates.reloadAsync` to its log line with one file:line citation per hop and every cited hop anchor-counted 1.
- [R1.3] WHEN the verdict doc lands FINDINGS.md THE SYSTEM SHALL state the verdict sentence verbatim, list the four rejected alternatives, and give the reason each is rejected.
- [R2.1] WHEN the mock build crosses one RTL boundary on the 3T THE SYSTEM SHALL log exactly one `ReactNoCrashSoftException` whose stack names `AppStateModule.onHostPause`, transcribed verbatim into FINDINGS.md section 7.
- [R2.2] WHEN the relaunch completes THE SYSTEM SHALL keep the pid unchanged and re-log the marker line `APP: feature flags resolved`, with the measured exception-to-marker span transcribed.
- [R2.3] WHEN the second crossing completes THE SYSTEM SHALL show the English face (`Fajr` visible), log no `FATAL EXCEPTION` line in the capture, and save the capture and the alarm dumps under `sessions/71/`.

## 6. Steps

- [ ] Step 1: the verdict doc (`steps/1-verdict.md`, weight 1)
- [ ] Step 2: the crossing pinned on the 3T (`steps/2-crossing-proof.md`, weight 3)

The full contracts live in the two step files. Each step: one branch off `uat`, one commit,
one version, merged `--no-ff`, never pushed.

## 7. Device proof

The build, install, drive and capture commands with their expected readings are specified in
`steps/2-crossing-proof.md`. Summary: build-mock via `$HOME/athan-gitree/bin/build-mock.zsh`
(the `BUILD-MOCK OK` tail), the `aapt2` package gate, install to `3T_SERIAL`, one discarded
launch, then two agent-device-driven boundary crossings (en to ar, ar to en) inside one logcat
capture. Expected: two `ReactNoCrashSoftException` blocks, each carrying the message
`reactInstance is null. Dropping work.` and a stack naming `AppStateModule.onHostPause`; the
pid identical before and after; two marker lines `APP: feature flags resolved` (one per
crossing's relaunched tree; the capture starts after `logcat -c` cleared the discarded
launch); no `FATAL EXCEPTION`; the alarm dumps saved before and after, evidence only (the mock
re-seeds prayer times per download, per row 55's record, so trigger-time movement across the
reload is the mock's own behaviour and not a finding). No clock change anywhere in this step,
so the pre-clock-change alarm-dump rule does not engage.

## 8. Records

### FINDINGS.md

Step 1 creates `FINDINGS.md` in the plan folder with sections 1 to 6; step 2 appends section 7.
The full content contracts are in the step files. The ledger: `LOG.md` opens with
`## Ticket 71` and `## Planning (2026-10-13)`; every step entry the executor appends opens with
`### Step <NN> — <state>` and ends with a line `session: <ses_id>`.

### The queue cell the lead applies on DONE

`| 71 | AppState soft exception on the language relaunch teardown | <brief unchanged> | DONE 2026-10-13, audited: the row's question answered from the pinned sources and pinned on the 3T: NO fix - the throw path is native-internal (ReactHostImpl.reload pauses the dying context, AppStateModule.onHostPause's emit drops on the teardown race, the soft logger prints and never throws), the repo's three JS AppState listeners sit downstream of the emit and cannot suppress it; the fix-if-so branch stays untaken, no code changed, D88 to D90 recorded; the exception block verbatim and the measured span live in the folded findings; the upstream-report lever (row 51 discipline) is the only route if she ever wants the line gone | nothing |`

### The docs commit message

Each step's commit message starts `<VERSION> - ` and is given in its step file. The executed
commit is the one `.opencode/agents/athan-executor.md` (Finishing) defines: branch
`docs/executed-71-<date>`, the ticket set EXECUTED, version bumped, the plan files and the
queue added by name, message `<VERSION> - docs(plans): ticket 71 executed: <one line>`,
merged `--no-ff`, never pushed.

### What the owner may reopen

- The verdict itself (D88): reopened only by her word, with the traced chain of section 4 as
  the object of review.
- The upstream report (alternative 2): a new row if she wants the line silenced at the source.

## 9. Push

None. The executor never pushes; the lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | Fix |
| --- | --- |
| An anchor counts other than 1 | NEEDS REPLAN. The anchored code moved; planning re-verifies at the new sha. |
| The build tail is not `BUILD-MOCK OK` | Stop; do not install. Rerun once after checking no second build runs (`ai/AGENTS.md`: never two at once). A second failure: STOP. |
| `aapt2` prints a package other than `com.mugtaba.athan` | STOP before install (section 2.2, item 2). |
| The capture holds extra `ReactNoCrashSoftException` lines from unrelated sites | Filter on the message string `reactInstance is null. Dropping work.`, not the class name; record the unrelated categories in FINDINGS.md section 7 as unrelated. The per-crossing count of the filtered pattern must stay exactly 1. |
| The transcription is truncated | Re-capture with `logcat -d -v threadtime` and copy the whole block through its blank line. |
| The step stops after crossing 1 (the app sits in Arabic) | Cross back to English if the app is functional; otherwise report the state and leave the phone as it stands. |

Anticipated review fixes, word for word:

1. "The findings fold into the queue cell" - the DONE cell in section 8 already names the
   folded findings; the lead applies it as written.
2. "The device step proves the record, not the verdict" - stated in section 5, Design review;
   a review note, not a change.

Per-step restore lists:

- Step 1 (docs only): `git checkout -- ai/plans/README.md ai/plans/71-appstate-teardown/` for
  edited files, delete the branch if unmerged, restore the three version files if bumped.
- Step 2: the step 1 list, plus leave the phone reachable and the app in English (the second
  crossing or the STOP rule of section 10), automatic time on, no clock change to undo.

## 11. Subagents

Planning: `explore` workers answer fact questions, `athan-plan-griller` grills the draft.
Delivery: the lead dispatches the `athan-executor` and `athan-reviewer` workers. Every worker
may call `vision` for an image it cannot see. Nothing else, ever.

## 12. Report to the owner

The executor reports: which steps landed, the commit shas and versions, the hook's `Tests:`
lines, the verdict sentence, the pinned exception block, the measured span and pid, and the
evidence paths under `sessions/71/`. The lead's DONE report folds FINDINGS.md into the queue
cell per section 8 and deletes the folder and the evidence in the merge. The progress table
and the four-line handoff close the report.
