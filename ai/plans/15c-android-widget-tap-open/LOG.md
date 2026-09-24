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
