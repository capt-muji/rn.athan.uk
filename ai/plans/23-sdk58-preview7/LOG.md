# Execution log: Session 23

Planned, executed and audited in one session on 2026-09-26, no subagents, under the owner's ruling of that day.

## Pre-flight

`bash $TMPDIR/preflight-23.sh 1` printed `PREFLIGHT OK`: all three anchors counted 1, both 58.0.3 patches were
present as step 1 expects, and the registry check confirmed every target version was still what the plan named
(`expo` next preview.7, `react` latest 19.3.0, `react-native` next rc.2, Reanimated 4.7.0, worklets 0.13.0).

Both phones connected before starting: the 3T (`8f7ada76`) and the XS (`00008020-0015585C22D2002E`).

## Step 1: SDK 58 preview.7, both patches rebuilt, the `frame()` split

### The install, and the red it was supposed to produce

The 19 runtime packages and 3 dev packages installed clean. The predicted red appeared exactly:
`patch-package finished with 2 error(s)` and `npx tsc --noEmit 2>&1 | grep -c "error TS"` printing **3**, being the
lost `requiresNetworkConnectivity` option and the two `frame()` sites. No fourth error, so nothing beyond the plan.
`@expo/log-box@58.0.5` removed the two peer warnings the spike saw, as decision 6 predicted.

### Section A: the patches

**A finding the plan did not predict, and it is the good kind.** `grep requiresNetworkConnectivity node_modules/expo-background-task`
returned ONE hit at 58.0.7, where the spike expected none. It is `ios/BackgroundTaskScheduler.swift:93`,
`request.requiresNetworkConnectivity = true`, which is iOS hardcoding the constraint rather than upstream adopting
our option. The Android path, which is what ISSUES #37 is about, is untouched. So the conclusion stands and both
patches were still needed; the record simply now names where the string legitimately occurs, so the next session
does not read it as "upstream fixed it".

- **`expo-background-task`**: the 58.0.3 patch applied to 58.0.7 unchanged once its filename version was rewritten
  (`git apply --check` exit 0). Verified after applying: 6 `requiresNetworkConnectivity` hits in
  `BackgroundTaskScheduler.kt`, and `publication` count **0** in `expo-module.config.json`, which is the detail
  `ai/AGENTS.md` (2026-09-24) records as load-bearing: while that block is present, autolinking resolves the module
  to its prebuilt AAR and Gradle never compiles the patched Kotlin.
- **`expo-widgets`**: this one genuinely did not apply. ONE hunk rejected, and the cause is benign: upstream added
  `import androidx.glance.appwidget.cornerRadius` between the context lines the patch anchors on. Every other hunk
  applied, so `openApp`, `launchAppAction` and the `props.openApp` branch all landed; only the two imports were
  missing. Added by hand in the same positions, then both patches regenerated with `npx patch-package <name>`.

Both regenerated patches were then proven to survive a CLEAN install rather than assumed to: the two packages were
deleted, `yarn install --force` re-fetched them, and `patch-package` applied both with no errors. Re-verified after
that install: `val openApp: Boolean = false,` present, 6 `requiresNetworkConnectivity` hits, `publication` 0.

### Section B: the `frame()` split

The two sites became two chained modifiers each, fixed first, as the design table gives. Biome then reformatted the
first site's modifier list one-per-line, which is its own formatting and not a deviation.

### Section C: the guard

`shared/__tests__/widgetOpenAppPatch.test.ts` was NOT edited, as part 5 section C requires. It derives the expected
filename from the installed package at runtime, so it started passing again on its own once
`patches/expo-widgets+58.0.7.patch` existed.

### Green

`npx tsc --noEmit` exit 0, `npx biome check . --error-on-warnings` exit 0, and the suite
`Test Suites: 170 passed, 170 total`, `Tests: 4662 passed, 4662 total`, 100% on statements (4234/4234), branches
(1892/1892), functions (857/857) and lines (3825/3825).

### The break script was wrong twice, and the runs are what proved it

First run: `caught 1 of 3`, `ALL AS EXPECTED: 0`. Both failures were defects in the SCRIPT, not the code, and both
are worth recording because each is a trap the next break script can fall into:

1. **`patch-content` was NOT CAUGHT** because it edited `patches/expo-widgets+58.0.7.patch`, while the guard reads
   the APPLIED result under `node_modules`. Editing a patch file changes nothing until a reinstall, so the
   substitution was invisible to the test. Rewritten to break `node_modules` directly, which is also the truer
   break: `node_modules` is what ships to the phone, and a patch that stops applying leaves exactly that state.
2. **`frame-order` printed `BREAK NOT APPLIED`** because the substitution assumed the two `frame()` calls sit
   adjacent on one line, and Biome had just reformatted them one per line. Rewritten to span the newline and
   indentation.

Second run: `caught 3 of 3`, `ALL AS EXPECTED: 1`, and the tree was restored afterwards (the converter and
`PrayerWidget.tsx` both back to their committed state).

`frame-order` is recorded as **NOT CAUGHT (expected)**: no unit test can see modifier ORDER in a serialized widget
layout, which is precisely why the plan puts that risk on the device proof rather than pretending a test covers it.
