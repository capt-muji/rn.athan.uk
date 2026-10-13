# Step 1: the verdict doc

Weight: 1
Requirements: R1.1, R1.2, R1.3

## Anchor check

```bash
D=ai/plans/71-appstate-teardown
for pair in \
  "language-reload-branch.txt:stores/language.ts" \
  "listeners-registration.txt:device/listeners.ts" \
  "listeners-call-site.txt:app/index.tsx" \
  "appstate-onhostpause.txt:node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/modules/appstate/AppStateModule.kt" \
  "appstate-sendevent-guard.txt:node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/modules/appstate/AppStateModule.kt" \
  "reactcontext-onhostpause.txt:node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/bridge/ReactContext.java" \
  "reacthostimpl-reload-pause.txt:node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/runtime/ReactHostImpl.kt" \
  "reacthostimpl-taskref-reset.txt:node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/runtime/ReactHostImpl.kt" \
  "reacthostimpl-decls.txt:node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/runtime/ReactHostImpl.kt" \
  "reacthostimpl-isinitialized.txt:node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/runtime/ReactHostImpl.kt" \
  "reacthostimpl-destroy-step.txt:node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/runtime/ReactHostImpl.kt" \
  "bridgeless-hasactive.txt:node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/runtime/BridgelessReactContext.kt" \
  "reacthostimpl-drop.txt:node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/runtime/ReactHostImpl.kt" \
  "softexception-logger.txt:node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/bridge/ReactSoftExceptionLogger.kt" \
  "expo-restart-extension.txt:node_modules/expo-updates/android/src/main/java/expo/modules/updates/procedures/RestartReactAppExtensions.kt" \
  "updates-module-reload.txt:node_modules/expo-updates/android/src/main/java/expo/modules/updates/UpdatesModule.kt" \
  "error-screen-reload.txt:components/ui/Error.tsx" \
  "perf-listener.txt:shared/perf.ts" \
  "usenotification-listener.txt:hooks/useNotification.ts"
do
  a="$D/scripts/anchors/${pair%%:*}"; f="${pair#*:}"
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$a" "$f"
done
```

Expected: nineteen lines, every line `1`. Any other count: NEEDS REPLAN.

## Goal

Write FINDINGS.md in the plan folder: the three AppState listeners mapped, the throw path
traced hop by hop, the verdict stated. This doc is the row's deliverable.

## Branch

```bash
git fetch origin
git checkout -b docs/71-1-verdict uat
```

Expected: `Switched to a new branch 'docs/71-1-verdict'`.

## Files

- New: `ai/plans/71-appstate-teardown/FINDINGS.md`
- Edited: `ai/plans/README.md` (row 71 to `IN PROGRESS, step 1` in this step's commit),
  `app.json`, `package.json`, `android/app/build.gradle` (version bump)

## Red

FINDINGS.md does not exist before this step's change. Record the line
`Red: FINDINGS.md absent` in LOG.md under this step's entry; that absence is the red. There is
no test to run red: the step writes documentation, and the repo's red-green discipline binds
code changes.

## Change contracts

Create `ai/plans/71-appstate-teardown/FINDINGS.md` with exactly this skeleton and the content
given. Before writing, open every cited file at the cited lines and read the claim against it;
a claim the source does not carry is a STOP with the citation named.

```markdown
# Ticket 71 findings: the AppState soft exception on the relaunch teardown

Every load-bearing claim cites file:line, read on this run's tree (uat at or above the Planned
at 2.0.187; RN 0.88.0-rc.3 and expo-updates as pinned in node_modules).

## 1. The three AppState listeners and the reload site

<the listener table, below>

## 2. The throw path, hop by hop

<the six hops, below>

## 3. Why the JS listeners cannot suppress the exception

<the section text, below>

## 4. What the dropped event costs

<the section text, below>

## 5. The alternatives, rejected

<the four alternatives, below>

## 6. The verdict

<the verdict sentence, below>
```

Section 1, the listener table (one row per site, the file:line citations verbatim):

| Listener | Where | Behaviour when the reload tears the context down |
| --- | --- | --- |
| The launch listener | `device/listeners.ts:79`, registered once per process behind the `listenersInitialized` guard (:17, :24-25), seeded from `AppState.currentState` (:27) | Downstream of the emit. The dying tree never receives the dropped background event (the emit is dropped before dispatch, `ReactHostImpl.kt:916-926`); the relaunched tree re-registers fresh and re-seeds from the live state (`app/index.tsx:107`, `device/listeners.ts:27`) |
| The perf flush | `shared/perf.ts:205`, live only behind the perf monitor gate | Loses one background flush into a tree that dies about 1.5 s later; dev-gated, no production path |
| The permission watcher | `hooks/useNotification.ts:37`, removes itself on return (`:44`) | Unrelated to reload timing: it watches the settings round-trip, not language switches |

The reload site: `stores/language.ts:77-89`, the D59 branch, `await Updates.reloadAsync()` at
`:83`. The second production reload site is the error screen's recovery
(`components/ui/Error.tsx:30`); the same teardown log rides every reload from any site.

Section 2, the six hops (each with its citation, the chain verbatim from PLAN.md section 4):

1. The D59 branch calls `Updates.reloadAsync()` (`stores/language.ts:83`).
2. expo-updates' native `AsyncFunction("reload")` relaunches the React application
   (`node_modules/expo-updates/android/src/main/java/expo/modules/updates/UpdatesModule.kt:65-68`),
   resolving the React host and calling `reload(reason)`
   (`.../procedures/RestartReactAppExtensions.kt:28-32`).
3. `ReactHostImpl.reload` resets the instance task ref, then pauses the dying context on the
   UI executor while its lifecycle state is RESUMED
   (`node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/runtime/ReactHostImpl.kt:1330-1336`).
4. `ReactContext.onHostPause` fans out to the lifecycle listeners
   (`.../bridge/ReactContext.java:321-334`), reaching `AppStateModule.onHostPause`, which sets
   background and emits `appStateDidChange`
   (`.../modules/appstate/AppStateModule.kt:46-49`).
5. The drop is ordered, not a lost race. The reload first resets the instance task ref to its
   initial value, a completed task holding a null result
   (`node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/runtime/ReactHostImpl.kt:1316-1317`,
   the initial value declared at `:129`), then pauses the dying context (`:1330-1336`). The
   module's guard reads a different field, the `reactInstance` member (`:130`, read by
   `isInstanceInitialized` at `:347-348` through
   `.../runtime/BridgelessReactContext.kt:109` from `AppStateModule.kt:68`), which stays live
   until the chain's destroy step (`:1387`, fourth in the continuation chain, after the
   pause). The guard passes, the emit dispatches onto the reset ref, the task result is null,
   and `callFunctionOnModule` lands on `callWithExistingReactInstance`, which raises
   (`ReactHostImpl.kt:916-926`).
6. The raise logs a `ReactNoCrashSoftException` (`ReactHostImpl.kt:897-908`), printed via
   `FLog.e`, never thrown
   (`.../bridge/ReactSoftExceptionLogger.kt:68-77`). The exception object is constructed at
   the raise site, so its captured stack carries the `AppStateModule.onHostPause` frames the
   row 68 record read.

Section 3, verbatim:

> The throw path holds no repo code. Hop 1 is the repo's only hop, and it ends at the
> `reloadAsync` call; hops 2 to 6 are native, inside the reload implementation the call
> invokes. The three JS listeners of section 1 consume the event the native module emits at
> hop 4; subscribing or unsubscribing them changes nothing upstream of that emit, and React
> pauses the dying context unconditionally while RESUMED (hop 3). A pause-before-reload change
> is therefore dead code on a working path: it cannot suppress the exception.

Section 4, verbatim:

> The dropped emit is the dying tree's background transition. No consumer needs it: the
> relaunched tree re-seeds `previousAppState` from `AppState.currentState`
> (`device/listeners.ts:27`) on its fresh registration (`app/index.tsx:107`), so no stale
> background-to-active transition is expected or missed; the perf flush (`shared/perf.ts:205`)
> loses one flush into a tree that dies about 1.5 s later, behind a dev gate; the permission
> watcher (`hooks/useNotification.ts:37`) removes itself and is unrelated to reload timing.
> The post-reload convergence stamp-bails (`stores/language.ts:38`), so no re-arm work is
> lost.

Section 5, the four alternatives, each with its rejection reason (verbatim from PLAN.md
section 5, Alternatives rejected, items 1 to 4).

Section 6, the verdict sentence, verbatim:

> No. The AppState listener must not pause before the reload, and no code change ships: the
> exception is raised inside React's own reload sequence, every hop after the `reloadAsync`
> call is native, the repo's listeners sit downstream of the emitting module and cannot
> suppress it, and the dropped event has no consumer that needs it (sections 1 to 4). One
> non-fatal log line per RTL boundary crossing is the whole cost; silencing it from inside
> this repo means patching RN core, which section 5 rejects, so the fix-if-so branch stays
> untaken.

## Green run

```bash
test -f ai/plans/71-appstate-teardown/FINDINGS.md && echo GREEN
grep -c "file:line\|file:line citation" ai/plans/71-appstate-teardown/FINDINGS.md
```

Expected: `GREEN`, and a count of at least 1 (the citation discipline note). Then the anchor
check of this step file again: fourteen `1` lines.

## Break script

None. The step writes documentation; there is no guarded logic to mutate and no test to break.
The review checklist below is the step's verification surface.

## Version and commit

Run the version command under the lock:

```bash
while [ -d "$HOME/athan-gitree/version.lock" ]; do sleep 5; done
mkdir "$HOME/athan-gitree/version.lock"
git fetch origin
node -p "require('./package.json').version"
```

Take the next patch over the printed version and `origin/uat`'s `package.json` version,
whichever is higher. Set it in `app.json` first, then `package.json`, then
`android/app/build.gradle` `versionName` (gitignored, never added). Commit the step:

```bash
V=<the chosen version>
printf '%s\n' "$V - docs(plans): 71 step 1, the teardown verdict and the throw trace" > "$TMPDIR/msg-71-1.txt"
git add ai/plans/71-appstate-teardown/FINDINGS.md ai/plans/71-appstate-teardown/LOG.md ai/plans/README.md app.json package.json
git commit -F "$TMPDIR/msg-71-1.txt"
```

Expected: the pre-commit hook runs (3 to 4 minutes), the log's last `Tests:` line ends
`passed, <n> total` with four `100%` coverage lines, and the commit lands. The gradle file is
never added. Then:

```bash
git checkout uat && git merge --no-ff docs/71-1-verdict -m "$V - merge docs/71-1-verdict: ticket 71 step 1"
rmdir "$HOME/athan-gitree/version.lock"
```

Expected: the merge commit lands on `uat`, the lock directory is gone.

## Review checklist

1. `git show <sha>` cold: FINDINGS.md matches this step's contracts, section by section.
2. Every citation opened at its lines reads as the doc claims.
3. The verdict sentence of section 6 is character-identical to this file's.
4. The queue row reads `IN PROGRESS, step 1`; the version bumped in all three places.
5. No code file, no test file touched: `git show --stat <sha>` lists only the plan folder, the
   queue, `app.json` and `package.json`.

## Done when

- [ ] FINDINGS.md sections 1 to 6 land with the contracts' content.
- [ ] The anchor check prints fourteen `1` lines.
- [ ] The commit and merge land with the version bumped.
- [ ] LOG.md carries the step entry: branch, shas, version, the red line, the review verdict,
      ending `session: <ses_id>`.
