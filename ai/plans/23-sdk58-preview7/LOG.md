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

### Done

Version 1.28.35. Hook: `Test Suites: 170 passed`, `Tests: 4662 passed, 4662 total`, four 100% coverage lines.
Review, one pass, no findings: the only source change is the two `frame()` sites, and git recorded both patches as
RENAMES at 99% and 87% similarity, which is independent evidence their content carried over rather than being
rewritten. Merged into `uat-2`.

## Step 2: React 19.3.0 and React Native 0.88.0-rc.2

- Branch: `chore/react-19-3-rn-088-rc2`.
- Installed clean, no patch errors. `node -p` confirms `react` 19.3.0, `react-dom` 19.3.0, `react-native`
  0.88.0-rc.2.
- RN is at **rc.2**, one ahead of the rc.1 that preview.7's `bundledNativeModules.json` names, on the owner's
  instruction to take the latest regardless of RC status. rc.2 over rc.1 is a Metro floor bump to 0.87.1 and a
  revert of an ObjC `RCTArrayBuffer` codegen change; this project ships no ObjC TurboModule, and `modules/tls13` is
  Android-only Kotlin, so neither reaches it.
- Green: `tsc` 0, Biome 0, `Test Suites: 170 passed, 170 total`, `Tests: 4662 passed, 4662 total`, 100% on all four
  measures. **This was the step most likely to fail**, because a React minor moves the renderer that the 40
  `components` suites drive through React Native Testing Library. Nothing failed.
- Breaks: none applies (no decision in this project's code changed).
- The diff is five version strings in `package.json` plus `yarn.lock` and `app.json`. No source file touched.

## Step 3: Reanimated 4.7.0, worklets 0.13.0, and a package step 1 missed

### A DEFECT IN THE PLAN: `react-native-screens` was left out of step 1

`yarn add` printed `expo-router@58.0.8 has incorrect peer dependency "react-native-screens@^4.28.0 || ^5.0.0-alpha.3"`.
Checking it against preview.7's `bundledNativeModules.json` showed `~4.28.0` where this project had `~4.27.0`: the
planning session MEASURED 26 differing packages and then wrote only 25 of them into step 1's install command. The
plan's own table was right and its command was one short, which is the kind of defect no test catches, because a
missing package changes nothing until something depends on it.

It surfaced here only because `expo-router` declares the peer range and yarn prints the warning on every install.
Two lessons, both recorded in the findings text:

1. **A measured list and a written command must be diffed against each other, not eyeballed.** The check is one line
   and it is now part of this step's Done-when: nothing in `package.json` may differ from
   `bundledNativeModules.json` except the packages a decision deliberately puts ahead.
2. **A peer warning is a finding, not noise.** This one named the exact package and the exact range.

The owner chose on 2026-09-26 to fix it inside this step rather than give it a commit of its own, since
`react-native-screens` is native navigation code that the device proof exercises anyway. `react-native-screens@~4.28.0`
installed clean; 4.28.0 is its current `latest` and declares `peer react-native: *`, so it has no constraint against
rc.2.

After it, exactly ONE package differs from preview.7's pin set: `react-native` at rc.2 where preview.7 names rc.1,
which is decision 1's deliberate step ahead. The `react-native-screens` peer warning is gone. The one warning that
remains is pre-existing and deliberate: `jest-expo > jest-watch-typeahead@2.2.1` wants Jest 29 while this project is
on Jest 30 on purpose (`ai/AGENTS.md`, "Deliberately ahead of Expo's pins").

### Reanimated

- Branch: `chore/reanimated-4-7`.
- `react-native-reanimated@4.7.0` and `react-native-worklets@0.13.0` installed together, as the matched pair they
  are. `node -p` confirms both.
- **4.7.0 makes the new layout-animations engine the default**, and `USE_LEGACY_LAYOUT_ANIMATIONS_PROXY` is
  deliberately NOT set: the owner chose to take the default and prove it (`PLAN.md` decision 4).
- `components/modals/Modal.tsx` was NOT edited, confirmed by `git status components/` printing nothing. That is the
  point: it is the app's only `entering`/`exiting` site, and an unchanged file is what makes the before/after
  comparison on device mean anything.
