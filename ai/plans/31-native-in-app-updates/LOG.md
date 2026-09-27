# Execution log: Session 31

## Planning session, 2026-09-27

The plan is complete and its pre-flight passes. Execution has not started.

### Two things the planning session found and fixed before handing over

The planning commit's first attempt failed its pre-commit hook with 7 failures, none in files this session touched.
Three causes, each measured rather than guessed:

1. **`shared/__tests__/widgetRuntimeLoads.test.ts` failed with `(0 , n.memo) is not a function`.** This session's own
   `yarn add expo-in-app-updates@0.12.0` re-resolved the tree and put a NESTED `@expo/ui@58.0.7` under
   `node_modules/expo-widgets/node_modules/` while the flat pin still read `58.0.5`. `ai/AGENTS.md` already documented
   the nested-copy trap, but said it came from pinning `@expo/ui` alone; **any `yarn add` can cause it**, and that
   wider trigger is now written into the same entry (1.29.24). Remedy applied:
   `rm -rf node_modules/expo-widgets/node_modules && yarn install --frozen-lockfile`. The guard worked exactly as
   designed: the suite that builds and loads the real bundle is what caught it. The same install also left three
   copies of `@react-native/codegen` at three versions, which `yarn check --verify-tree` shows.
2. **`shared/__tests__/versionLockstep.test.ts`** was a transient of that reinstall and passes.
3. **`stores/__tests__/notifications.test.ts`, 5 failures: a real latent bug, ISSUES #41, now FIXED** in 1.29.23 on
   `fix/41-clock-independent-notification-tests`, merged and pushed. It predated session 30, reproducing at
   `a265ec1d`, `182a3e32`, `475c532f` and `5c3f2f00`.

### ISSUES #41, and the owner's ruling that settled it

The suite's `rescheduleAllNotificationsFromBackground` `beforeEach` seeded today's prayers **all at `12:00`**, taking
the DAY off the real clock via `TimeUtils.getTodayDateString()`. After 12:00 London every seeded row is in the past,
session 28's time-ordered scheduler arms nothing, and five assertions about a completed reschedule fail. Every commit
that day ran between 10:29 and 10:33, so the hook was green all morning and red at 13:56.

The planning session first logged it as out of scope and handed it back. **The owner rejected that**, and was right:
🐋  "a test should not be based on what time of date being run. Our test should be mocking the time... everything
should be mocked so that we can properly test the scenarios. That's the whole point of a test." A test that depends on
the hour is a defect, not a scheduling problem, so it was fixed immediately rather than queued.

The fix pins the clock with `jest.useFakeTimers({ now: london(SEEDED_DAY, '09:00') })` BEFORE the seed is built, takes
the day from a fixed constant, spreads the nine prayers `12:00` to `12:08`, and restores real timers in an
`afterEach`. Proof it guards rather than merely passes: removing the pin fails exactly those five again, and restoring
it returns `160 passed`. `yarn validate` is green at 4774 tests and 100% on all four measures, run after noon. The
rule and the trap are written into `__tests__/README.md` and `ai/AGENTS.md`.

### One correction this makes to the plan

Step 1 installs a dependency, so it must run the nested-copy remedy afterwards. Section 10's symptom table carries it.

## Step 1: Android asks Play; the scrape and the Play store links are deleted

- Branch: `feat/31-native-android-updates`. Pre-flight `PREFLIGHT OK`, all three anchors counted 1.
- **The nested-copy trap fired exactly as the plan predicted.** `yarn add expo-in-app-updates@0.12.0` re-nested
  `@expo/ui@58.0.7` and `widgetRuntimeLoads.test.ts` failed with `(0 , n.memo) is not a function` on both platforms.
  `rm -rf node_modules/expo-widgets/node_modules && yarn install --frozen-lockfile` fixed it: `3 passed`. This is why
  the plan made that check mandatory rather than advisory.
- Red: 3 of the 6 new Android tests failed. The other 3 passed against the old code by coincidence, because the scrape
  path also returned `false` and also took the failure stamp; the 3 that failed are the ones only Play can satisfy.
- Green: `29 passed, 29 total`, `tsc` exit 0, Biome exit 0.
- **Coverage on `device/updates.ts`: 100% statements, branches, functions and lines**, which is the session's headline
  requirement for a module neither device can run.
- Breaks: `BREAK CAUGHT` for androidShowsOurModal, androidSkipsPlay, playErrorEscapes, immediateFlow and
  iosLosesItunes, then `ALL AS EXPECTED: 1`.
- Two test helpers became dead with the scrape and were removed: `playListingHtml`, and `storeResponse`'s `text`
  branch, which existed only for the Android HTML body.
- **The commit hook found one test the plan did not anticipate, and it was a real finding.**
  `__tests__/harness.test.tsx` had a case named "opens the Play Store from a module that reads the platform as it
  loads", which used `openStore` on Android as its subject. That behaviour no longer exists, and the fresh load now
  throws `Cannot find native module 'ExpoInAppUpdates'`, because `device/updates.ts` imports the native package at
  load and jest-expo has no such module off a device. The test's PURPOSE is the harness pattern, not the store URL, so
  it keeps that purpose with a subject that still exists: it loads the module fresh on Android, with the package
  mocked virtually inside the same `isolateModules` callback, and asserts `startNativeUpdate()` reaches Play. Applied
  under `EXECUTOR-BRIEF.md` section 4, item 8: it touches no name, signature, log line or behaviour the plan
  specified, and every acceptance criterion still holds. 19 passed.
- **A second hook finding, also real: every suite that RENDERS the home screen now loads the native module.**
  `__tests__/app/indexFreshInstall.test.tsx` failed to run at all with `Cannot find native module 'ExpoInAppUpdates'`,
  because it renders `Index`, which imports `device/updates`, which now imports `expo-in-app-updates` at load. It
  does not mock `@/device/updates` the way `index.test.tsx` does, so the real package was reached. Fixed the way this
  repo already handles every other native module: a shared mock at `shared/__mocks__/expo-in-app-updates.ts`, wired
  into `jest.config.js`'s `appModuleMocks`, which both projects spread. It answers "no update", so a suite that merely
  renders a screen never reaches Play, and the suites that test the flow keep their own `jest.mock`. Applied under
  `EXECUTOR-BRIEF.md` section 4, item 8.
- **A third: the pre-commit hook failed twice while reporting every test passing.** The cause was a watchman recrawl
  warning on stderr (`Recrawled this watch 583 times`), which lint-staged treats as task failure.
  `watchman watch-del` then `watch-project` cleared it. Worth knowing: a green `Tests:` line with a failing hook is
  not always a test problem.

## Step 2: the Update button is iOS-only

- Branch: `feat/31-ios-only-update-button`. Both anchors counted 1.
- Red: the new test `never offers the update prompt on Android, because Play owns that flow` PASSED before the change,
  which the plan predicted and explicitly ruled is not a stop: it pins a guarantee step 1 established rather than
  driving this step's change. The step's own change is the comment, and the breaks are what prove the guarantee holds.
- Green: `41 passed, 41 total`, `tsc` exit 0, Biome exit 0.
- Breaks: `BREAK CAUGHT` for modalStacks and updateDoesNothing, then `ALL AS EXPECTED: 1`.

## Step 3: the package's own contract is pinned by a test

- Branch: `test/31-in-app-updates-contract`. No anchor: the step adds a new file.
- No red phase, which the plan states by design: the suite describes what is installed, so it passes immediately. Its
  break is what proves it guards.
- Green: `3 passed, 3 total`, `tsc` exit 0, Biome exit 0.
- Break: `BREAK CAUGHT: versionDrift`, then `ALL AS EXPECTED: 1`. The package's own `package.json` was restored and
  reads `0.12.0` afterwards.

## Step 4: `releases.json` is deleted, and every live rule that names it

- Branch: `chore/31-delete-releases-json`. The file was present, as the pre-flight requires.
- Before deleting, the plan's proof ran: `grep -rn "releases.json|githubusercontent"` across the nine source folders
  matched only two COMMENTS, in `shared/versionUtils.ts` and its suite. Both were reworded; neither file's code
  changed.
- Deleted with `git rm`. Verification gate: `FILE GONE`, then `NO CODE REFERENCES`.
- The four live rule files keep their prohibition with the filename removed, so it outlives the file:
  `EXECUTOR-BRIEF.md`, `PLANNER-BRIEF.md`, `AUDITOR-BRIEF.md` and `TEMPLATE.md` now forbid "a hand-edited release
  file". `ai/AGENTS.md`'s untouchable block became a "deleted, never recreate" block, and its PR checklist line lost
  the now-meaningless "releases.json untouched" item.
- **README.md needed more than a deletion.** Its whole "Update Popup" section described the old two-source design,
  including a version-source table naming `releases.json` three times and a release workflow whose step 4 was "update
  the appropriate version in releases.json". It is rewritten as "App Updates", describing what actually ships: the
  Android/iOS split, Play's flexible flow and its one consent tap, why `country=gb` is load-bearing, the hour-long
  retry after a failed check, and a release workflow whose step 3 is "that is all".
- Historical plan folders keep their text unchanged: they record what was true when they ran.
- No breaks: the step deletes a file and edits prose, so there is no decision in code to substitute. The two grep
  gates are the guard, and `yarn validate` at commit time is the check.

## Device proof

- `zsh build-mock.zsh uat-2 mocks/simple.ts` ended **`BUILD-MOCK OK` in 488s** from `6d5096ed`, at
  `versionName 1.29.29`. The fresh `expo prebuild` inside it is itself the proof that the new native module autolinks
  and compiles.
- **The module reaches the APK**, and finding that took two tries worth recording. `aapt2 dump strings` returned `0`
  for `inappupdates`, which reads like a missing module and is a FALSE NEGATIVE: it does not reach the dex sections.
  Per-dex search found it: `ExpoInAppUpdates` in `classes2.dex`. Play Core's class PATHS are absent because R8
  obfuscates them, but its surviving string literals `appUpdateManager` and `InstallState{installStatus=` are there.
- Installed with `adb install -r`: `Performing Streamed Install / Success`, and the phone reads
  `versionName=1.29.29`. Play Protect was pre-empted by setting `verifier_verify_adb_installs 0` before the install,
  **restored to `1` afterwards**; `auto_time` was never touched and reads `1`.
- **The run proved more than expected.** The plan predicted silence on a side-loaded build. Logcat shows the whole
  path working and Play refusing for the right reason: `AppUpdateService : Initiate binding to the service`, then
  `onServiceConnected(...DevTriggeredUpdateService)`, `linkToDeath`, `OnRequestInstallCallback : onRequestInfo`, and
  finally one warning, `Failed to start native update: Install Error(-10) ... ERROR_APP_NOT_OWNED`. The app bound to
  Play, sent the request, got a callback, and caught the refusal on its own error path, logging once and showing the
  user nothing.
- The app kept running: `dumpsys window` shows `com.mugtaba.athan/.MainActivity` focused, and the screenshot at
  `~/athan-store-update-shots/android-31-home.png`, read by this session, shows the full prayer list, a live
  countdown, no error screen and **no update modal**, which is the session's invariant.
- Evidence saved under `~/athan-device-sweep/session31/`: `alarms-before.txt` (91 lines, healthy),
  `android-update-log.txt` (the single expected warning), `playcore-log.txt` (6 lines).
- The phone is left on this session's mock build at 1.29.29.
