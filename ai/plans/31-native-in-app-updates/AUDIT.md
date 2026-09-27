# Audit: Session 31. Android updates natively through Play, `releases.json` deleted

Audited on 2026-09-27 against `uat-2` at `6d5096ed`, in a scratch worktree at that sha with `node_modules` symlinked
from the main checkout.

## 1. What was checked

| Item | Command or file | Result |
| --- | --- | --- |
| The range holds only this session's commits | `git log --oneline origin/uat-2..uat-2` | 8 commits: 4 step commits and their 4 merges. Nothing else |
| Step 1 matches its contracts | `git show 31b5f511` | `startNativeUpdate` exists with the plan's final signature `Promise<boolean>`, never throws, and calls `InAppUpdates.startUpdate()` with NO argument, which is what selects the flexible flow; `checkForUpdates` keeps `Promise<boolean>`; the boolean the break targets is named `awaitedNative` as the plan required |
| Step 2 matches | `git show dd052bf2` | The comment is the plan's text verbatim; the `visible` expression is unchanged; `components/modals/Update.tsx` is not in the diff |
| Step 3 matches | `git show 139b7b98` | The suite reads the REAL package through `jest.requireActual`, so the shared mock cannot mask a drift |
| Step 4 matches | `git show 365b9e4c` | `releases.json` deleted with `git rm`, not emptied; the four brief/template files keep their prohibition, now naming "a hand-edited release file" |
| The package is pinned exactly | `package.json` | `"expo-in-app-updates": "0.12.0"`, no `^` or `~` |
| Forbidden files untouched | `git diff 6f660281..6d5096ed --name-only` | `stores/version.ts` and `components/modals/Update.tsx` absent. `shared/versionUtils.ts` appears, and the diff is **one comment line**; its code is byte-identical |
| The tests still guard | the three break scripts, run from the scratch worktree root | 8 breaks, every one `BREAK CAUGHT`, each script ending `ALL AS EXPECTED: 1`, worktree clean afterwards |
| The red check reruns | step 1's Android branch reverted in the scratch worktree | 3 failed, 26 passed: exactly the tests only Play can satisfy. Restoring returned `29 passed` |
| The whole suite | `yarn validate` in the scratch worktree | exit 0. `Test Suites: 174 passed`, `Tests: 2 skipped, 4772 passed, 4774 total`, 100% on all four measures: statements 4409/4409, branches 1962/1962, functions 917/917, lines 3970/3970 |
| Coverage of the changed file | `--collectCoverageFrom='device/updates.ts'` | **100% statements, branches, functions and lines**, which is the session's headline requirement for a module neither device can run |
| Versions in sequence and in lockstep | `git show <sha>:app.json` against `:package.json` | 1.29.26, 1.29.27, 1.29.28, 1.29.29, each with `app.json` equal to `package.json` |
| `releases.json` is gone and unreferenced | `test ! -f releases.json`; `grep -rn` over the nine source folders | `FILE GONE`, `NO CODE REFERENCES` |
| The native module reaches the APK | `unzip -p <apk> classes2.dex \| strings` | `ExpoInAppUpdates` present; `appUpdateManager` and `InstallState{installStatus=` present, so Play Core is compiled in |

## 2. Findings

### 2.1 Three the executor found and fixed itself, all recorded in `LOG.md`

Each meets all three conditions in `EXECUTOR-BRIEF.md` section 4, item 8, and each is judged sound here.

1. **The nested `@expo/ui` copy returned, exactly as the plan warned.** `yarn add` re-nested `58.0.7` under
   `expo-widgets/node_modules/` and `widgetRuntimeLoads.test.ts` failed with the production error verbatim. The plan
   had made that check mandatory after the install precisely because this session's own planning hit it, and the
   documented remedy fixed it. **This is the guard working, not a defect.**
2. **`__tests__/harness.test.tsx` tested behaviour this session deleted.** Its case used `openStore` on Android to
   demonstrate the fresh-load platform pattern, and the fresh load now throws `Cannot find native module
   'ExpoInAppUpdates'`. The test's PURPOSE is the harness pattern, so it keeps that purpose with a subject that still
   exists: `startNativeUpdate`, with the package mocked virtually inside the same `isolateModules` callback. Correct
   call: rewriting it to assert a `market://` URL that no longer exists would have been the wrong fix.
3. **Every suite that RENDERS the home screen now loads the native module.**
   `__tests__/app/indexFreshInstall.test.tsx` could not run at all. Fixed with a shared mock at
   `shared/__mocks__/expo-in-app-updates.ts` wired into `jest.config.js`'s `appModuleMocks`, which is exactly how this
   repo already handles `expo-notifications`, `expo-background-task` and the rest. The flow's own suites keep their
   local `jest.mock`, and step 3's contract suite uses `requireActual`, so the shared mock cannot hide a drift.

### 2.2 What the audit found

No defect in the shipped code, the tests or the records. Four observations, recorded rather than fixed:

1. **`aapt2 dump strings` on the APK returned 0 for `inappupdates`, and that was a FALSE NEGATIVE.** The module is
   present in `classes2.dex`, which `dump strings` does not reach. `ai/AGENTS.md` already warns that a `grep -c`
   against a missing tool is indistinguishable from a real zero; this is the same class of trap with a tool that
   exists but reads the wrong section. The honest check is per-dex:
   `for d in classes.dex classes2.dex; do unzip -p <apk> $d | strings | grep -c ExpoInAppUpdates; done`.
2. **Play Core's class PATHS are absent from the dex while its CODE is present**, because R8 obfuscates them.
   Searching for `com/google/android/play/core/appupdate` returns 0 and reads like a missing dependency; searching for
   the surviving string literals `appUpdateManager` and `InstallState{installStatus=` finds it. A future session
   checking whether Play Core shipped must search literals, not package paths.
3. **The pre-commit hook failed twice while reporting every test passing**, on a watchman recrawl warning printed to
   stderr, which lint-staged treats as task failure. `watchman watch-del` then `watch-project` cleared it. A green
   `Tests:` line with a red hook is not always a test problem.
4. **The coverage gate refused a commit because an untracked file from the NEXT step was present.** That is the gate
   doing its documented job: coverage is measured on the working tree, so the tree must be exactly what is being
   committed. Moving the step-3 file aside until its own step was the right answer.

## 3. Device evidence, and its honest limit

**The device run proved far more than the plan dared predict, and it is worth stating precisely.** The plan expected
the 3T to be silent, because a side-loaded build cannot use Play In-App Updates. What logcat actually shows is the
whole wiring working end to end, and Play refusing for exactly the right reason:

```
PlayCore: AppUpdateService : Initiate binding to the service.
PlayCore: AppUpdateService : ServiceConnectionImpl.onServiceConnected(ComponentInfo{com.android.vending/...DevTriggeredUpdateService})
PlayCore: AppUpdateService : linkToDeath
PlayCore: OnRequestInstallCallback : onRequestInfo
ReactNativeJS: W ... Failed to start native update: Install Error(-10): The app is not owned by any user on this
  device. An app is "owned" if it has been acquired from Play. (ERROR_APP_NOT_OWNED)
```

So the app bound to Play's `DevTriggeredUpdateService`, sent the request, received a callback, and Play answered
`ERROR_APP_NOT_OWNED`, which is the documented answer for a build Play did not install. **That is the strongest proof
available short of a Play-installed build**: the native module is linked, the Play Core client works, the call
reaches Google's service, and the app's own error path caught the refusal, logged it once as a warning and showed the
user nothing. The screenshot confirms the app carried on normally with no modal.

What remains unproven is only the happy path, the consent dialog and the background download, because no phone here
can own the app from Play. `device/__tests__/inAppUpdatesContract.test.ts` exists for that gap.

What the device run DOES prove, which is the real risk of adding a native dependency:

| Claim | Evidence |
| --- | --- |
| The module autolinks and compiles | `build-mock.zsh` ran a fresh `expo prebuild` and `BUILD-MOCK OK` in 488s. A module that cannot autolink fails here |
| It reaches the shipped APK | `ExpoInAppUpdates` in `classes2.dex`, with `appUpdateManager` and `InstallState{installStatus=` alongside it |
| The app still launches with it linked | `dumpsys window` shows `com.mugtaba.athan/.MainActivity` focused after the doubled launch, at `versionName=1.29.29` |
| Nothing of ours prompts on Android | the screenshot, read by this session: full prayer list, live countdown, no error screen, no update modal |
| The Play Core client actually works | 6 `PlayCore` logcat lines, ending in `onRequestInfo` and a single `ERROR_APP_NOT_OWNED` warning |

## 4. Verdict

**PASS.**

Four steps, four commits, four merges, 1.29.26 to 1.29.29. The suite is at 4774 tests and 100% on all four measures,
all 8 breaks are caught, and the three findings the executor met were fixed to the plan's own standard. `releases.json`
is deleted, no code references it, and every live rule that protected it now forbids a hand-edited release file of any
kind, so the prohibition outlives the filename.
