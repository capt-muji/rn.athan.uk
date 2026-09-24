# Execution log: Session 15c

## Pre-flight

`bash $TMPDIR/preflight-15c.sh 1` ended `PREFLIGHT OK`. Version 1.27.345, `expo-widgets` 58.0.3, all six anchors
counted 1, the 3T answered `device`, and `athan_test_avd` was listed.

## Step 1: The library's Button can open the app

Branch `feat/15c-widget-open-app-patch`.

The converter was pristine before the edit: `grep -c openApp` printed `0`.

Four edits, as the step's contract gives them: the two Glance imports, the action conditional testing `props.openApp`
before `props.target`, the `launchAppAction` helper, and the `openApp` field between `modifiers` and `target`.

Capture: `npx patch-package expo-widgets --include '^android/src/'`.

| Check | Expected | Measured |
| --- | --- | --- |
| `wc -l patches/expo-widgets+58.0.3.patch` | about 50 | 51 |
| `grep -c '^diff --git'` | 1 | 1 |
| `grep -n muji` | nothing | nothing, exit 1 |
| `grep -c openApp` on the converter after `rm -rf node_modules/expo-widgets && yarn install --check-files` | 2 | 2 |

`yarn install --check-files` ended with `expo-background-task@58.0.3 ✔` and `expo-widgets@58.0.3 ✔`, so the patch
applies to a clean tree.

Green: `:expo-widgets:compileReleaseKotlin` printed `BUILD SUCCESSFUL in 50s` with no line starting `e: `.
`npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exited 0.

No tests and no break script in this step, as the plan says: no Jest project compiles Kotlin, so a break here could
only report NOT CAUGHT regardless of correctness. Step 3 is what guards this patch.

Commit `0a7d72ab`, version 1.27.346. The hook reported `Tests:       4631 passed, 4631 total` and four 100% coverage
lines (statements 4195/4195, branches 1876/1876, functions 852/852, lines 3786/3786).

Review: the session reviewed the commit itself against the step's nine checks, one round, verdict merge. Every check
held: one file under `android/src/`; no absolute path (`grep -n '/Users/\|muji'` exits 1); exactly two imports added
and both used (`: Action?` once, `actionStartActivity(intent)` once); `openApp` Boolean, default false, between
`modifiers` and `target`; the conditional tests `props.openApp` first; the `else` branch differs from the original
only by reading the local `context`, which is `converterContext.applicationContext` bound once, so its behaviour is
unchanged; `launchAppAction` returns null on a null launch intent, names no activity class or scheme, and logs
nothing; exactly one comment added, and it says why. The patch is 14 added and 2 removed lines.

Merged as `6e5bb262`. NOTE for the audit: the merge landed commit `0a7d72ab`, which is this step's work without the
review paragraph above. The paragraph had been added by an amend (`b9885fa1`) that the `git checkout uat-2` before
the merge left behind, so the merge took the branch ref's older tip. Nothing of the code differs between the two
commits: `git diff 0a7d72ab b9885fa1` is `LOG.md`, 11 insertions, and nothing else. Rather than rewrite `uat-2`,
the text was restored in the working tree and rides step 2's commit.

## Step 2: Every Android card is an open-the-app tap target

Branch `feat/15c-android-card-tap`. Anchors `1-1`, `1-2` and `1-3` each counted 1.

Red: with the seven tests written and the layout untouched,
`npx jest shared/__tests__/widgetRenderer.test.ts --watchman=false --selectProjects=unit` reported
`Tests:       5 failed, 43 passed, 48 total`, the five the plan names, and the first failed with
`Expected: "Button"` / `Received: "Box"`. The two that pass before the change are the plan's two regression guards.

Change: `Button` joined the jetpack import, `ReactElement` joined the type import, and the `AButtonEl` cast and
`AOpenApp` helper went in above `ACard`. Both Android returns route through the helper, `ACard` and the medium
branch, and nothing else in the file changed.

Green: `Tests:       48 passed, 48 total`. `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both
exited 0, and `widgetContract.test.ts` passed unchanged at 10 tests, which is what proves the new `Button`
reference is legal inside the serialized body.

Breaks: `bash $TMPDIR/breaks-15c-2.sh` printed four `caught:` lines, `caught 4 of 4`, then `ALL AS EXPECTED: 1`. No
`.bak` file was left.

Review: the session reviewed the diff itself against the step's ten checks, one round, verdict merge. One helper
`AOpenApp` with one definition and exactly two call sites (lines 271 and 429); the wrapper carries only `openApp`
and one `fillMaxSize()`; `Button` comes from `@expo/ui/jetpack-compose`; no geometry constant, colour, font size,
font weight, padding or alignment value appears in the diff; the iOS branch is untouched; no existing test line was
removed, the only fixture change being the `Button` marker in `JETPACK`; and no comment was added to the layout.

Commit `92c09b4f`, version 1.27.347, merged as `8a26a8cb`. The hook reported
`Tests:       4638 passed, 4638 total` with four 100% coverage lines (4198/4198, 1876/1876, 853/853, 3789/3789).

## Step 3: The patch and the seam it rides on are pinned by tests

Branch `test/15c-patch-guard`. No anchors in this step.

The suite `shared/__tests__/widgetOpenAppPatch.test.ts` was written to the plan's six rows and reported
`Tests:       6 passed, 6 total`.

**One plan defect found and fixed, and the plan itself corrected.** The first run of the break script reported
`NOT CAUGHT: the patch drops the Glance import it rides on`, 5 of 6. The cause was in the test, not the break:
`toContain('import androidx.glance.appwidget.action.actionStartActivity')` still matches after the break renames the
import to `...actionStartActivityGone`, because the original name is a prefix of the renamed one. The assertion now
carries the trailing newline, which terminates the line, and the break is caught. This is the same substring trap
the planning session had already found in the layout break, in a second place it had missed; the plan's step 3 test
row now records it.

After the fix: `caught 6 of 6`, then `ALL AS EXPECTED: 1`. `grep -c openApp` on the converter printed `2`
afterwards, so `node_modules` came back intact, and no `.bak` file was left.

Green: `Tests:       6 passed, 6 total`, `tsc` and Biome both 0.

Review: the session reviewed the suite itself against the step's eight checks, one round, verdict merge. Six tests,
each asserting what its name says; the patch filename is built from the installed version rather than written out,
so a dependency bump fails the test; nothing is mocked (`grep -c jest.mock` is 0); the machine-path check scans the
whole patch text rather than one line; the doc comment says why in one paragraph.

Commit `8ce7ffaf`, version 1.27.348, merged as `1144ab42`. The hook reported
`Tests:       4644 passed, 4644 total` with four 100% coverage lines.

## Step 4: Device proof on the 3T and an Android 15 emulator

Branch `proof/15c-device`, version 1.27.349, commit `432d87ca` made before the build so the build had a committed
sha to check out.

Safety: `auto_time` read `1` before and after, and no step in this session changed the clock. The alarm dump was read
first. It showed the app's alarms plus two far-future ones, `2105564951212` (2036-09-20) for `com.mugtaba.athan` and
`2105594232559` for `com.mugtaba.athan.fleettest`. The plan named a 2036 alarm at `2104803640505`; the id and the
exact instant differ because this is the same self-rearming class of alarm re-armed since the plan was written, and
the year is the same. Nothing unexpected was armed.

Build: `zsh ~/athan-device-sweep/session15/bin/build-prod-widgets.zsh 432d87ca ~/athan-device-sweep/session15c/athan-15c-prod.apk`
ended `BUILD-PROD OK`, 68,828,566 bytes, `com.mugtaba.athan` versionName 1.27.349, in 394s. The build worktree
carried both halves of the change: `grep -c openApp` on its converter printed 2, and its layout held the wrapper.
Installed with `adb install -r` on both devices, which kept the 3T's 8 placements.

| Device | Reading A (before) | Reading B (logcat) | Reading C (after) |
| --- | --- | --- | --- |
| OnePlus 3T, Android 9 | `pidof` empty | `I/ActivityManager: START ... dat=glance-action:/CALLBACK?appWidgetId=3&viewId=2131362200&viewSize=370.0.dp x 205.0.dp ... cmp=com.mugtaba.athan/.MainActivity` | pid 22537, `MainActivity` resumed |
| athan_test_avd, Android 15 | `pidof` empty | `I/ActivityTaskManager: START ... cmp=com.mugtaba.athan/.MainActivity} with LAUNCH_SINGLE_TASK from uid 10207 (realCallingUid=10176) (BAL_ALLOW_VISIBLE_WINDOW) result code=0` | pid 3944 |

Neither log holds `Background activity launch blocked`. Logs saved as `~/athan-device-sweep/session15c/3t-tap.log`
and `emulator-tap.log`.

**Two traps this step hit, both recorded in the findings.** First, `am kill` is `killBackgroundProcesses` and skips a
process that is not currently in the background: a WorkManager `SystemJobService` job held the app at `vis` on both
devices, so the kill silently did nothing while `pidof` kept printing the same pid. Waiting for
`dumpsys activity services com.mugtaba.athan` to report no `ServiceRecord` is what made the kill land. Second, the
widget render warms the process again within seconds, so a kill in one `adb` call and a tap in the next always found
the app alive; both readings were taken by killing and tapping inside ONE on-device shell.

The emulator had no widget placed, being a fresh image. The plan's sequence placed one: long-press the home screen
with `input swipe 540 1600 540 1600 900`, tap `Widgets`, tap the `Athan` group, then
`input draganddrop 781 2149 540 900 2000`. `dumpsys appwidget | grep -c host.callbacks` then printed 1.

The 3T's tap coordinates could not come from `uiautomator dump`, which returned
`ERROR: null root node returned by UiTestAutomationBridge`. They came from decoding the `screencap` PNG and scanning
it for the card's bright block, which put the medium card's centre at (540, 975).

Afterwards: the emulator was killed, `auto_time` reads `1`, the 3T holds 8 placements and runs the 1.27.349
production build.
