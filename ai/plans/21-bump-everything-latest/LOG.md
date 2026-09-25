# Execution log: Session 21

## Step 1: `@biomejs/biome` 2.5.13 to 2.5.14

- Branch `chore/bump-biome-2-5-14`, version 1.27.387.
- Red, as the plan predicted: Biome 2.5.14 exited 0 but printed
  `i The configuration schema version does not match the CLI version 2.5.14`, `Expected: 2.5.14`, `Found: 2.5.13`.
- Change: one line of `biome.json`, the `$schema` value. `git show --stat` confirms 1 insertion, 1 deletion for that
  file. No source file changed, as expected: 2.5.14's three new rules are all nursery and this project selects
  `recommended`.
- Green: `npx biome check . --error-on-warnings` exits 0 with no mismatch line, `npx tsc --noEmit` exits 0.
- Suite: `Test Suites: 170 passed, 170 total`, `Tests: 4649 passed, 4649 total`, 100% statements, branches, functions
  and lines.
- Breaks: `caught 2 of 2`, `ALL AS EXPECTED: 1`, and `biome.json` restored to the 2.5.14 schema afterwards.
- Hook on commit: `Tests: 4649 passed, 4649 total` and four `100%` coverage lines.
- Review (the session's own, no subagent per plan section 11): only the five intended files changed; `biome.json` is
  one line; the `lint-staged` and `linter.rules` blocks untouched. Verdict: merge, one round.
- Merged into `uat-2`.

## Step 2: `@types/node` 26.4.0 to 26.6.2

- Branch `chore/bump-types-node-26-6-2`, version 1.27.388.
- No red, as the plan says: a typings-only move with no API change reaching this project.
- Green: `tsc` 0, Biome 0, `Test Suites: 170 passed, 170 total`, `Tests: 4649 passed, 4649 total`, 100% on all four.
- Hook on commit: `Tests: 4649 passed, 4649 total` and four `100%` lines.
- Review (the session's own): only `package.json`, `yarn.lock`, `app.json` and plan bookkeeping changed; one version
  string. Verdict: merge, one round.
- Merged into `uat-2`.

## Step 3: `@jest/create-cache-key-function` 29.7.0 to 30.5.1

- Branch `chore/bump-jest-cache-key-30`, version 1.27.389.
- No red: a dev-tooling move with one call site, `__tests__/svgFileTransformer.js`'s `getCacheKey`.
- Extra check beyond the plan, because a cache key only runs on a cold cache: ran
  `components/ui/__tests__/Icon.test.tsx` with `--no-cache` to force the transformer to recompute. 3 passed, so the
  SVG testID contract still holds under the new version.
- Green: `tsc` 0, Biome 0, `Test Suites: 170 passed, 170 total`, `Tests: 4649 passed, 4649 total`, 100% on all four.
- Review (the session's own): three files plus plan bookkeeping, one version string. Verdict: merge, one round.
- Merged into `uat-2`.

## Step 4: `test-renderer` 1.2.0 to 1.3.0

- Branch `chore/bump-test-renderer-1-3`, version 1.27.390.
- The predicted warning appeared on install: `test-renderer > react-reconciler@0.34.0` has incorrect peer dependency
  `react@^19.3.0`. Expected, and step 5 settles it.
- Checked the two suites that import `TestInstance` on their own first: both pass, 18 tests.
- Green: `tsc` 0, Biome 0, `Test Suites: 170 passed, 170 total`, `Tests: 4649 passed, 4649 total`, 100% on all four.
- Review (the session's own): three files plus plan bookkeeping, one version string. Verdict: merge, one round.
- Merged into `uat-2`.

## Step 5: `@types/react` 19.2.18 to 19.3.0

- Branch `chore/bump-types-react-19-3`, version 1.27.391.
- Green: `tsc` 0, Biome 0, `Test Suites: 170 passed, 170 total`, `Tests: 4649 passed, 4649 total`, 100% on all four.
- **A plan claim was wrong and the plan was corrected, not worked around.** Decision 5 and step 4 both said this step
  would settle the `react-reconciler@0.34.0` peer warning. It does not: the warning names `react@^19.3.0`, the
  runtime package the SDK pins at 19.2.3, not `@types/react`. The warning is still printed and will stay until React
  moves in row 18. It is inert for the reason step 4 already gives, that both `test-renderer` call sites are
  type-only, and every suite passes. `PLAN.md` decision 5 and `steps/4-test-renderer.md` now say this.
- Review (the session's own): three files plus plan bookkeeping and the two corrections above. Verdict: merge, one
  round.

## Step 6: `lint-staged` 15.5.2 to 17.5.1

- Branch `chore/bump-lint-staged-17`, version 1.27.392.
- Preconditions re-verified before installing, all three from v17's `MIGRATION.md`: git 2.54.0 (floor 2.32.0), Node
  v24.14.1 (floor 22.22.1), and the config as JSON inside `package.json` rather than a YAML file, so the
  now-optional `yaml` package is not needed.
- Green: `tsc` 0, Biome 0, `Test Suites: 170 passed, 170 total`, `Tests: 4649 passed, 4649 total`, 100% on all four.
- **The first commit attempt was REJECTED by the hook, and it was not this bump.**
  `stores/__tests__/widgetAndroid.test.ts`, the test `arms the next flip a whole minute out when the target sits on
  an exact minute`, failed on `expect(PrayerWidget.reload).toHaveBeenCalled()`. Diagnosed rather than retried blindly:
  the same suite passed in the full run minutes earlier on the identical tree, then passed 3 more times alone, and
  passed again in the spike worktree under a forced load of 5.97. It is a fake-timer test that needs the full
  170-suite run to starve it, which is the same load-sensitive class `EXECUTOR-BRIEF.md` section 3 documents for
  `audioMatrix.test.ts`. No code of this step's touches it: this step changed only a version string. Waited for the
  load to fall and committed again, which passed with 4649 tests and 100% coverage.
- The hook ran lint-staged 17 on this very commit, which is the proof the plan asked for.
- Review (the session's own): three files, one version string, the `lint-staged` config block untouched. Verdict:
  merge, one round.
- Merged into `uat-2`.

## Step 7: `husky` 8.0.3 to 9.1.7

- Branch `chore/bump-husky-9`, version 1.27.393.
- Both anchors counted 1 before starting.
- Red, exactly as specified: `qualityGate.test.ts` failed ONE test,
  `declares a prepare script, so yarn install arms the hook`, with `Expected substring: "husky install"` and
  `Received string: "husky"`. The other 8 tests in that file passed untouched, which is what the plan required.
- Change: `prepare` and `husky` scripts to the bare `husky`; the two-line shim removed from BOTH `.husky/pre-commit`
  and `.husky/pre-push`, each keeping its body; the one guard assertion moved to `husky`.
- Structural checks after `yarn husky`: `core.hooksPath` prints `.husky/_`, both hooks still executable,
  `head -1 .husky/pre-commit` is no longer `#!/usr/bin/env sh`, and `.gitignore` is untouched.
- Green: guard suite `Tests: 9 passed, 9 total`, `tsc` 0, Biome 0, full suite `Test Suites: 170 passed, 170 total`,
  `Tests: 4649 passed, 4649 total`, 100% on all four.
- Breaks: `caught 3 of 3`, `ALL AS EXPECTED: 1`, `package.json` and `.husky/pre-commit` restored afterwards.
- **The hook ran on its own commit, which is the proof this step exists for.** The commit log shows
  `Backing up original state`, `Running tasks for staged files`, `✔ biome check --write --no-errors-on-unmatched`,
  `✔ jest --bail --findRelatedTests --passWithNoTests`, then the full validate with `Tests: 4649 passed` and four
  `100%` lines.
- **A plan check was wrong and was corrected.** Steps 6 and 7 both said to confirm the hook ran by finding the word
  `lint-staged` in the commit log. lint-staged 17 no longer prints its own name, so that grep returns 0 on a commit
  where it ran perfectly well, which would have read as a missing gate. Both steps now name the real evidence:
  `Running tasks for staged files` plus the two ticked task lines.
- Review (the session's own): both hooks keep their bodies and their executable bit, only the shim is gone;
  `.gitignore` untouched; exactly one assertion changed in the guard suite. Verdict: merge, one round.

## Step 8: `jotai` 2.20.3 to 3.0.0

- Branch `chore/bump-jotai-3`, version 1.27.394.
- All six anchors counted 1 before starting.
- Both reds reproduced exactly as the plan gave them:
  `stores/sync.ts(9,10): error TS2305: Module '"jotai/utils"' has no exported member 'loadable'.` from `tsc`, and
  `Must use import to load ES Module: .../node_modules/jotai/dist/index.js` from Jest.
- Three fixes, as specified: the local `loadable` wrapper over `unwrap` in `stores/sync.ts` with the sentinel compared
  by identity; the `.js` transform plus `transformIgnorePatterns` in the `unit` project and `jotai` appended to the
  `components` project's existing list; and `INTERNAL_buildStoreRev4` with its keyed building blocks in
  `jest.components.setup.js`, the keys read from the library rather than written as literals.
- Green: `tsc` 0, Biome 0, `Test Suites: 170 passed, 170 total`, `Tests: 4649 passed, 4649 total`, zero FAIL lines,
  100% on all four measures. Coverage totals moved from 4200 to 4209 statements, which is the new wrapper, fully
  covered by the existing `syncLoadable` suite.
- Breaks: `caught 5 of 5`, `ALL AS EXPECTED: 1`, and all three files restored afterwards.
- Review (the session's own): every name and signature as the contract gives them; the identity comparison present;
  the internals keys read from the library; no existing test edited; only the five intended files changed.
  Verdict: merge, one round.

## Device proof, part 1: the OnePlus 3T (baseline phone)

Production build of `uat-2` at 1.27.394 (`BUILD-PROD OK`, 375s, real API key, arm64-v8a, versionCode 1000000).
Widget providers verified in the APK BEFORE installing, per the durable lesson from 2026-09-25:
`aapt dump xmltree ... | grep -c PrayerWidgetProvider` printed 1, so the APK is not the picker-less kind.

- Installed with `adb install -r` (data kept). `dumpsys package` then read `versionName=1.27.394`.
- Cold launch `am start -W`: `TotalTime: 3136`ms, against the ~6.6s documented for this phone in ISSUES #32. No
  regression; comfortably faster.
- Fatal exceptions in logcat: **0**. Mentions of jotai, syncLoadable or loadable: **0**.
- One benign log, pre-existing and not from this session: `androidx.work` probes
  `ValueAnimator$DurationScaleChangeListener`, an Android 12+ class absent on Android 9, and logs the miss at level I
  (info) with no fatal. It names none of this session's packages.
- **Live view hierarchy read through Maestro `inspect_screen`** rather than a screenshot, because the vision subagent
  could not be reached in this harness and an image is never guessed at. It read: "London, UK", "Fri, 25 Sep 2026",
  countdown "Asr 2h 11m 19s", "Dhuhr 58m ago", and six prayers with Arabic names and real times: Fajr 05:20, Sunrise
  06:48, Dhuhr 12:57, Asr 16:07, Magrib 18:55, Isha 20:12. No dashes, no error screen, no spinner.
- **These are real API times, not mock.** A mock build seeds prayers either side of launch. Here Asr 16:07 less the
  13:56 wall clock is 2h 11m, exactly the countdown shown, and Dhuhr 12:57 was 58m earlier, exactly as labelled.
- Resume (HOME, then relaunch): countdown had ticked to "Asr 2h 10m 21s", every time unchanged, "Dhuhr 59m ago"
  advanced. Same pid, so no crash-restart.
- Widgets: all 8 providers registered, and the 2 placed ones live on `net.oneplus.launcher` (hostId:1024),
  `zombie=false`.
- Alarms before and after match: the widget refresh tick
  (`expo.modules.widgetrefresh.WidgetRefreshReceiver`) and the `ACTION_FORCE_STOP_RESCHEDULE` entry dated 2036 that
  every 3T dump shows. Saved as `alarms-before.txt` and `alarms-after.txt`.
- Evidence under `~/athan-device-sweep/session21/3t/`: `logcat-after-launch.txt`, `screen-readout.txt`, `home.png`.

## Device proof, part 2: the iPhone XS

Release build of 1.27.394, `npx expo prebuild -p ios --no-install` first (plist read
`CFBundleShortVersionString 1.27.394`), then `npx expo run:ios --configuration Release --device 00008020-...`.

- **The first two build attempts failed and NEITHER was this session's code.** Attempt 1 died in
  `ExpoModulesJSI » [CP-User] Build ExpoModulesJSI xcframework` with `error: the following command failed with exit
  code 0 but produced no further output`, a from-scratch pod-script flake; the log mentions none of the eight
  packages, and Metro had already logged `Done writing bundle output` with zero resolve or syntax errors, which is the
  part jotai 3 actually affects. Attempt 2 died on `unable to attach DB ... database is locked`, because attempt 1's
  `xcodebuild` was still holding the DerivedData lock. After killing both, attempt 3 printed `Build Succeeded` and
  installed.
- `devicectl device info apps` reads `Athan com.mugtaba.athan 1.27.394`.
- Launched with `devicectl device process launch --terminate-existing`: `Launched application`, pid 44310, still
  listed by `device info processes` two minutes later.
- **Crashes: zero from today.** `pymobiledevice3 crash ls` lists 6 Athan reports and every one is
  `Athan-2026-09-10-*`, none dated 2026-09-25.
- Touch automation is unavailable on a physical iPhone (`ai/AGENTS.md`), and Maestro confirms it:
  `Device 00008020-... (IOS/REAL) is not supported by the MCP server`. So the screen reading on iOS is the owner's,
  and the question to ask is in `steps/9-device-proof.md`.

### The six old crashes, investigated on the owner's instruction

The owner's rule: a crash is never waved past, however old. Investigated in full.

- All six are `SIGABRT` / `Abort trap: 6` on the main thread, an objc exception rethrown through
  `CFRunLoopRunSpecific` then `_objc_terminate`, with `abort() called` as the only annotation. No JavaScript frame and
  no symbol from this app beyond `main`, so the throw is native and the report carries no `exceptionReason`.
- **Every one names `app_version 1.24.0`,** and they fall inside a nine-minute window on 2026-09-10 (11:58:03 to
  12:07:01), which is a build being launched repeatedly while it was broken, not a user's phone failing over time.
- 1.24.0 is a KNOWN-BROKEN build that was already fixed. `d53d85db`, committed the next day, is
  `1.24.1 - fix: force expo-notifications source build (expo.autolinking.android.buildFromSource); 1.24.0 APKs linked
  the precompiled AAR so the alarmClock patch never compiled in`. 1.24.x was also the revalidation window recorded in
  `ai/AGENTS.md` for 2026-09-11, where the previous days' root-cause claims were found wrong and reverted.
- `uat-2` is now 170 patch versions past it. Today's build on the same phone, 1.27.394, has zero crash reports, is
  alive, and the 3T reports zero fatal exceptions on the same version.
- **Conclusion: nothing to fix here.** These are the fossils of a build that was diagnosed and superseded within a
  day. No crash exists on any version this session could ship. Recorded so no future session re-investigates them.

## Resume from: the owner's iOS screen check, then the records commit

Every one of the 8 steps is DONE and merged into `uat-2`. The 3T proof is complete and passed. The XS is built,
installed and running 1.27.394 with no crash. What is left, in order:

1. **The owner answers the iOS screen question** (`steps/9-device-proof.md`): "On the iPhone, do all the placed Athan
   widgets still show prayer times, and is any of them blank or black? And does the prayer list show today's London
   times?" Touch automation cannot reach a physical iPhone, so this reading is the owner's and nothing substitutes
   for it.
2. **The records are already written** into `ai/features/uat-2/AUDIT-FINDINGS.md` under
   `## Session 21: every non-SDK package at latest`, with the 3T numbers filled in. Only the iOS line needs the
   owner's answer folded in.
3. **Set the row to EXECUTED** in `ai/plans/README.md` (row 20) and make the `executed` docs commit
   (`EXECUTOR-BRIEF.md` section 4b). Do not push: the audit pushes.
4. **Then the audit** runs as its own phase over the 10 unpushed commits.

Phone state: the 3T holds the 1.27.394 PRODUCTION build, not the usual mock one, because this session's proof needed
real prayer times. The next session that needs mock data reinstalls it. Automatic time was never changed by this
session, so no clock restore is owed.
