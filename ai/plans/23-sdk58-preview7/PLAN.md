# Plan: Session 23. SDK 58 preview.7 and RN 0.88.0-rc.2

| Field | Value |
| --- | --- |
| Brief | The owner's instruction of 2026-09-26: 🐋  "upgrade to 88 and an SDK 58 beta latest preview... regardless of if they are released candidates or not" |
| Planned at | `430fbfd6` (version 1.28.41), replanned 2026-09-26 |
| Planned by | Planning session on 2026-09-26 (replan of the 2026-09-26 original) |
| Needs first | nothing |
| Steps | 5. Steps 1 to 3 are DONE and merged; steps 4 and 5 are this replan's work |
| Device | OnePlus 3T (`8f7ada76`). The XS is NOT needed: the iOS defect is proven off-device by the same harness, and no iOS-visible behaviour changes |
| Owner decisions still needed | None. The owner's 2026-09-26 roll-back ruling decides it, and section 2.1 decision 9 records how the measurement narrowed the version it names |

## 1. Goal

Steps 1 to 3 moved `uat-2` to `expo@58.0.0-preview.7`, React 19.3.0, RN 0.88.0-rc.2 and Reanimated 4.7.0, and all
three are green and merged. Step 4's device proof then found the Android widgets on the 3T rendering
`undefined is not a function` in place of the card, from step 1 onward.

**This replan names the root cause, which the original plan did not have.** `@expo/ui@58.0.7` added
`build/recycling/useRecycledRows.js`, which calls `React.memo` at MODULE scope. `expo-widgets` evaluates widget
layouts in a cut-down JS runtime whose React is `bundle/react-stub.ts`, and that stub exports exactly five names:
`Fragment`, `Children`, `isValidElement`, `createContext` and `useContext`. It has no `memo`. The new module is
reachable from the platform entry point (`jetpack-compose/index.js` → `LazyColumn` → `LazyItems` →
`useRecycledRows`), so it is evaluated whenever the widget bundle loads, and the bundle throws
`(0, n.memo) is not a function` BEFORE any layout runs. That is the phone's `undefined is not a function`.

When this plan is DONE, `@expo/ui` and `expo-widgets` are pinned to `58.0.5`, every other package stays at
preview.7, both widget runtime bundles load, all eight Android kinds render, a test in the suite fails if either
package is bumped back into the broken range, and the 3T shows its widgets working again.

The owner's rules that apply, quoted:

🐋  "instead of upgrading to the absolute latest version, we can roll back one version at a time until we have a
completely working version, only for the packages that actually need it, specifically to the packages that need it,
not all packages... Because maybe the newest, latest version is broken and we just need to wait for another new
version to come out later." (owner, 2026-09-26)

🐋  "visuals are settled, so no pixel changes without the owner's approval" (standing rule). This plan changes no
layout code, so the widgets return to exactly the look the owner already approved.

## 2. Decisions

### 2.1 Taken

1. **The target is `expo@58.0.0-preview.7` and `react-native@0.88.0-rc.2`, RC status notwithstanding.** Owner,
   2026-09-26. Unchanged by this replan, and steps 1 to 3 already delivered it.
2. **The pin set comes from `expo@58.0.0-preview.7`'s own `bundledNativeModules.json`.** Planner. Unchanged, with
   the two exceptions decisions 1 and 9 name.
3. **The two mixed `frame()` calls are split into two stacked modifiers.** Owner, 2026-09-26. Delivered in step 1
   and untouched here: it is in the iOS branch and the bisect exonerated it.
4. **Reanimated 4.7's new layout-animations engine is taken as the default, and proven.** Owner, 2026-09-26.
   Delivered in step 3; step 4 proves it on the 3T.
5. **Both native patches are rebuilt for the installed versions.** Planner. Delivered in step 1. The
   `expo-widgets` patch is renamed again by this replan, because the pin moves the installed version to 58.0.5.
6. **`@expo/log-box` moves to 58.0.5.** Planner. Delivered in step 1. Unrelated to decision 9: this is the
   `@expo/log-box` package, whose own version happens to read the same.
7. **The four `@babel` packages stay at 7.** Planner. Row 18's job, unchanged.
8. **Roll the widget packages back rather than fixing forward.** Owner, 2026-09-26, quoted in section 1. This
   replaces "fix forward at all costs" for this defect only. The rest of the wave stays at preview.7.
9. **The pin is `58.0.5`, not the `58.0.6` the ladder would have stopped at.** Planner, 2026-09-26, from the
   measurement in section 5. The original replan strategy was to climb 58.0.4, then .5, then .6 on the phone, one
   production build each, and stop at the first Android failure. That would have pinned **58.0.6**, because Android
   is fine there. It would also have shipped a broken iOS widget bundle, because **iOS breaks one version earlier**
   at 58.0.6, through a different module (`swift-ui/List/DataListForEach.js`) calling the same `React.memo`. No
   session had tested iOS, and the phone ladder would never have caught it: the 3T is Android. 58.0.5 is the last
   version where BOTH platforms load.
10. **Both packages move together, and neither can move alone.** Planner, measured. `expo-widgets@58.0.7` declares
    `"@expo/ui": "~58.0.7"`, so pinning `@expo/ui` alone makes yarn install a NESTED
    `node_modules/expo-widgets/node_modules/@expo/ui` at 58.0.7, which is the copy the widget bundle resolves. The
    flat pin then reads 58.0.5 while the bundle still throws. This is why step 4 pins both and step 5's test asserts
    against the resolved copy rather than against `package.json`.
11. **No workaround is written for the library.** Planner, applying the standing rule the previous session recorded:
    an upstream regression is upstream's to fix, and a local shim for a beta-line bug becomes permanent debt. Adding
    `memo` to the react-stub would mean patching `expo-widgets`' own bundle entry, which is a third patch to carry
    and re-verify on every bump. The pin costs one line and is reversible the day a fixed version ships.
12. **The XS is not built in this session.** Planner. The iOS defect and its fix are proven by the same
    load-the-bundle harness that proved Android, no iOS-visible behaviour changes, and the pin restores the exact
    `@expo/ui` version the XS already ran when the owner approved the lock widgets. Building the XS would prove
    nothing the harness has not, and the owner is away.

### 2.2 The executor must not decide

1. Any anchor count other than 1. Ask: "Anchor `<file>` counted `<n>`, not 1. The plan is stale. Should I set the row
   to NEEDS REPLAN?"
2. A test failing that this plan does not expect. Ask: "`<test name>` failed and the plan does not predict it. The
   failure line is `<line>`. What should it be?"
3. A break printing `BREAK NOT APPLIED`. Ask: "Break `<label>` changed nothing, so the substitution no longer matches
   the code. Should I set the row to NEEDS REPLAN?"
4. **The resolved `@expo/ui` reading anything other than 58.0.5 after step 4's install**, including a nested copy
   surviving. Ask: "`@expo/ui` resolved to `<version>`, not 58.0.5, and the nested copy is `<present|absent>`. Should
   I stop?"
5. **A regenerated patch that does not apply to 58.0.5.** Ask: "The regenerated `<package>` patch does not apply to
   58.0.5. The reject is `<text>`. Should I stop?"
6. **Any visible difference in a widget on the 3T** once it renders again. Visuals are the owner's. Ask: "On the 3T
   the `<surface>` looks `<description>` rather than as it did at 1.28.24. Is that acceptable?"
7. **The widgets still failing to render after step 4's build.** Ask: "The widgets still show `<text>` at 58.0.5,
   which the harness says loads. What should I try next?"
8. Anything the step does not answer that the executor would otherwise have to decide, with the question "The plan
   does not say `<X>`. What should it be?"
9. Anything touching prayer times, `releases.json`, `uat` or EAS.

## 3. Pre-flight

Saved to `$TMPDIR/preflight-23.sh` and run as `bash $TMPDIR/preflight-23.sh <k>`. Given in full in
`scripts/preflight.sh`, rewritten by this replan for steps 4 and 5.

## 4. Background the executor needs

### Code map

| File | What it does | Which step changes it |
| --- | --- | --- |
| `package.json` | The pin set. `@expo/ui` and `expo-widgets` both read `~58.0.7` at "Planned at" | step 4 |
| `yarn.lock` | The resolved tree | step 4 |
| `patches/expo-widgets+58.0.7.patch` | Session 15c: adds `openApp` so an Android widget tap opens the app | step 4 (renamed to `+58.0.5`) |
| `patches/expo-background-task+58.0.7.patch` | ISSUES #37: the offline refresh | untouched; that package stays at 58.0.7 |
| `shared/__tests__/widgetOpenAppPatch.test.ts` | Guards that the patch names the INSTALLED version | unchanged: it derives the version at runtime, so the rename satisfies it automatically |
| `shared/__tests__/widgetRuntimeLoads.test.ts` | NEW in step 5: the guard that fails if either package re-enters the broken range | step 5 |
| `widgets/PrayerWidget.tsx` | The home widget layouts | NOT changed by this plan |
| `ai/AGENTS.md` | The widget architecture invariants | step 5 |

### How the pieces interact

**The widget runtime is not React.** `expo-widgets` bundles widget layouts against stub modules under
`node_modules/expo-widgets/bundle/`: `react-stub.ts`, `react-native-stub.ts`, `jsx-runtime-stub.ts`. The react-stub
exports five names and nothing else. `bundle/index.ts` then assigns those stubs, plus every export of
`bundle/ui-globals.<platform>.ts`, onto `globalThis`, which is how a serialized layout body resolves `Column`,
`Text` and `padding` as free identifiers.

**`ui-globals` re-exports a platform entry WHOLESALE**, so every module that entry can reach is evaluated when the
bundle loads, whether the app's layout uses it or not:

```
bundle/ui-globals.android.ts
  → @expo/ui/jetpack-compose          (export * from)
     → LazyColumn/index.js            (58.0.7 added: import { LazyItems } from '../LazyItems')
        → LazyItems/index.js
           → recycling/useRecycledRows.js
              → import { memo, ... } from 'react'
              → const RecycledRow = memo(...)   ← module scope, so it runs at load
```

`memo` is `undefined` in the stub, so calling it throws `(0, n.memo) is not a function`. The app's layout never
references `LazyColumn`; reachability from the entry is enough.

**Why only `memo`, when other hooks are missing too.** The static walk in section 5 shows `useRef`, `useEffect`,
`useMemo`, `useCallback`, `useLayoutEffect`, `useState` and `createElement` are all imported from `react` by
modules reachable from both entries, in EVERY version from 58.0.3 to 58.0.7, including the versions that work.
They never throw because they are only called INSIDE component bodies, which the widget runtime never invokes.
`memo` is the only one called at module scope. **A guard that merely counts missing names would therefore flag
every version, including the good ones**, which is why step 5's test loads the bundle instead.

**The nested-copy trap.** `expo-widgets@58.0.7` depends on `@expo/ui ~58.0.7`. Pinning `@expo/ui` to 58.0.5 while
`expo-widgets` stays at 58.0.7 satisfies nobody: yarn installs 58.0.5 flat AND 58.0.7 nested under
`node_modules/expo-widgets/node_modules/`, and Metro resolves the nested one from inside `expo-widgets`. Measured:
the flat copy read 58.0.5 and the bundle still threw. Both packages must move together. **Yarn also does not prune
a nested copy left by an earlier install**, so the executor removes it explicitly in step 4, part 5.

### Existing tests that cover this code

| Suite | What it proves |
| --- | --- |
| `shared/__tests__/widgetOpenAppPatch.test.ts` | The expo-widgets patch names the installed version and is present in the converter |
| `shared/__tests__/widgetContract.test.ts` | The widget layouts' serialization rules and palette |
| `shared/__tests__/widgetRenderer.test.ts` | The layout's own render logic, against mocked globals |
| `shared/__tests__/versionLockstep.test.ts` | The three version files agree |

**None of them could have caught this**, and that is the gap step 5 closes. Every one of them runs against mocked
`@expo/ui` globals or against source text. Not one loads the real widget runtime bundle, which is the only artefact
where the defect exists. The suite was 170 suites and 4662 tests green on the exact commit whose build showed a
blank widget on the phone.

### Why the obvious simple fix is wrong

**Climbing the version ladder on the phone**, which is what the row and `LOG.md` currently instruct, is wrong for
two reasons the measurement exposed. It would stop at 58.0.6, because Android renders there, and 58.0.6 ships a
broken iOS bundle. And it costs five production builds at 6 to 7 minutes each to answer a question that a bundle
build plus `vm.runInThisContext` answers in about 40 seconds per version, on both platforms at once.

**Adding `memo` to the react-stub** is the other obvious fix and decision 11 rejects it: it is a third patch against
a beta-line package, it would need re-verifying on every bump, and it fixes a library bug in our tree.

## 5. Design

**The invariant, as one sentence a test can check:** the widget runtime bundle built from the installed
`expo-widgets` and `@expo/ui` evaluates without throwing, for both platforms.

**The chosen approach.** Pin `@expo/ui` and `expo-widgets` to an exact `58.0.5`, with no range prefix, so neither a
`yarn install` nor a future `expo install --check` can drift them back into the broken range. Everything else in the
tree stays at preview.7. Then add one test that builds both widget runtime bundles and loads each one, so the defect
class cannot return silently.

**What the spike proved, in the scratch worktree `~/athan-device-sweep/worktrees/plan-23r` at `430fbfd6`,** with a
COPIED `node_modules`. Each version pair was installed, its nested copy removed, both bundles built with
`node_modules/expo-widgets/scripts/build-bundle.mjs`, and each bundle loaded with `vm.runInThisContext`:

| `@expo/ui` + `expo-widgets` | Android bundle | iOS bundle |
| --- | --- | --- |
| 58.0.3 | LOAD OK | LOAD OK |
| 58.0.4 | LOAD OK | LOAD OK |
| **58.0.5** | **LOAD OK** | **LOAD OK** |
| 58.0.6 | LOAD OK | LOAD THROW `(0 , o.memo) is not a function` |
| 58.0.7 | LOAD THROW `(0 , n.memo) is not a function` | LOAD THROW `(0 , n.memo) is not a function` |

The two platforms break at different versions through different modules, both landing on the same missing `memo`:

| Version | Platform | Module that first reaches `memo` at module scope |
| --- | --- | --- |
| 58.0.6 | iOS | `build/swift-ui/List/DataListForEach.js` |
| 58.0.7 | both | `build/recycling/useRecycledRows.js`, via `LazyItems` |

**The layout renders once the bundle loads.** With both packages at 58.0.5, the real serialized layout was driven
through `__expoWidgetRender`, the same entry point the Kotlin side calls, with a real snapshot (six prayer rows, a
347dp grant, one day, `horizonEpochMs` three days out). All fifteen combinations rendered: five kinds
(`PrayerWidget`, `PrayerWidgetMedium`, `ExtrasWidget`, `ExtrasWidgetDarkMedium`, `PrayerWidgetDark`) × three prop
shapes (medium, small, the props-less gallery placeholder). Every one returned a tree rooted at `Button`, which is
the `AOpenApp` wrapper session 15c added, with 49 nodes for a medium, 12 for a small and 8 for the placeholder. The
same five kinds at 58.0.7 threw on every one.

**The static walk, and why it is NOT the test.** A walker that collects every `import ... from 'react'` reachable
from each platform entry and subtracts the stub's five exports reports this:

| Version | Android entry | iOS entry |
| --- | --- | --- |
| 58.0.3 to 58.0.5 | `createElement, useCallback, useEffect, useLayoutEffect, useMemo, useRef` | the same plus `useState` |
| 58.0.6 | unchanged | the above plus **`memo`** |
| 58.0.7 | the above plus **`memo`** | the above plus **`memo`** |

Six names are missing from the stub in the versions that work perfectly. Only `memo` is called at module scope.
**So "is every React name the stub exports?" is the wrong question and would fail every version.** "Does the bundle
load?" is the right one, and it is exactly what the phone was answering the expensive way.

**Alternatives rejected.**

| Alternative | Why rejected |
| --- | --- |
| Climb the ladder on the 3T, stop at the first Android failure | Pins 58.0.6, which ships a broken iOS bundle. Five production builds to reach a worse answer than one script reached on both platforms |
| Pin only `@expo/ui` | Measured: `expo-widgets@58.0.7` pulls a nested 58.0.7, which is the copy that gets bundled. Flat pin reads 58.0.5, bundle still throws |
| Add `memo` to `react-stub.ts` via a patch | A third patch on a beta-line package, re-verified on every bump, fixing a library bug in our tree (decision 11) |
| Pin with `~58.0.5` | `~` allows 58.0.6 and 58.0.7, which are the broken versions. The whole point is that this range must not move |
| Guard with a static missing-name check | Would fail 58.0.3 to 58.0.5, which work. Six names are legitimately absent in every version |
| Drop `expo-widgets` to 58.0.3, the last known-good before the session | Gives up `cornerRadius` and two patch releases for nothing: 58.0.5 is measured working on both platforms |

**The design review.** Reviewed by this planning session on 2026-09-26, reading the design back cold against the
measurements. What the review changed, in three places:

1. The first draft pinned `@expo/ui` alone, because the changelog said the regression was `@expo/ui`'s. The nested
   copy made that a no-op and only an install-then-resolve check caught it. The plan now pins both and step 4
   verifies the RESOLVED version rather than `package.json`.
2. The first draft's guard was the static missing-name walk, which is cheap and needs no bundle build. Running it
   across all five versions showed it flags the working ones, so it would have had to hardcode an allowlist of six
   names and would still miss the next module-scope call of an allowlisted name. Replaced with the load test.
3. The first draft did not test iOS at all, following the row's Android-only framing. Testing it is what found
   58.0.6, and it changed the pin the plan ships.

## 6. Steps

- [x] Step 1: SDK 58 preview.7, both patches rebuilt, and the `frame()` split (specified) — DONE in `020d88fb`
- [x] Step 2: React 19.3.0 and React Native 0.88.0-rc.2 (specified) — DONE in `f51b6e54`
- [x] Step 3: Reanimated 4.7.0 and worklets 0.13.0 (specified) — DONE in `b6336e8c`
- [ ] Step 4: pin `@expo/ui` and `expo-widgets` to 58.0.5 (specified)
- [ ] Step 5: the guard that loads the widget runtime, and the records (specified)

Each step's detail is in `steps/<k>-<name>.md`. Steps 1 to 3 keep the files they already had; this replan rewrote
steps 4 and 5 only, as `PLANNER-BRIEF.md` section 9 requires.

**The device proof moved into step 4.** The original step 4 was a standalone device proof on both phones that
committed nothing. It is now the last part of step 4, on the 3T only, because the thing it proves is the pin.

## 7. Device proof

Given in full in `steps/4-pin-widget-packages.md`, part 11. The 3T only, from a production build of the pinned
tree. Decision 12 records why the XS is not built.

Coordinates for any tap come from `e2e/device-atlas-oneplus3t.md` and are written back if anything is measured.

## 8. Records

Given in `steps/5-runtime-guard-and-records.md`.

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes `uat-2` after
a PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| `@expo/ui` resolves to 58.0.7 after step 4's install | The nested copy under `node_modules/expo-widgets/node_modules/` survived | Step 4, part 5 removes it and reinstalls. If it returns, STOP (section 2.2, item 4) |
| `patch-package finished with 1 error` after the pin install | The expo-widgets patch still names 58.0.7 | EXPECTED until part 4 renames it. Carry on |
| `widgetOpenAppPatch.test.ts` fails on the patch filename | Same cause | EXPECTED until part 4. It is the guard working |
| The regenerated patch will not apply to 58.0.5 | Upstream restructured the converter between .5 and .7 | STOP (section 2.2, item 5). The measured expectation is that it applies: the converter differs only by the `cornerRadius` lines |
| `yarn install` warns `incorrect peer dependency "@expo/ui"` | Only `expo-widgets` moved | Both must move together (decision 10). Set both, delete the nested copy, reinstall |
| The new test fails with `BUILD FAILED` rather than a throw | Metro could not build the bundle | STOP and quote the log line. A build failure is not the same finding as a load throw |
| The widgets still show `undefined is not a function` on the 3T | The APK was built before the pin, or from the wrong ref | Check the APK's version, rebuild from `uat-2` after the merge, reinstall. If it persists, STOP (section 2.2, item 7) |
| The 3T widget picker shows no Athan entry | The `androidWidgets` flag was off in the build | `ai/AGENTS.md` (2026-09-25). Verify the build's `.env` carries `EXPO_PUBLIC_ANDROID_WIDGETS=1`, and do not install over a working build |
| `versionLockstep.test.ts` fails | The three version numbers differ | Set all three to the step's version and commit again |
| Anything else | | `EXECUTOR-BRIEF.md` section 7 |

**Anticipated review fixes.** None. Step 4 changes two version strings and a patch filename; step 5 adds one test
file and two records edits whose text this plan gives. A reviewer finding that meets all three conditions in
`EXECUTOR-BRIEF.md` section 4, item 8 is applied by the executor and recorded in `LOG.md`; those three conditions
are not restated here.

**Stopping part-way.**

- **Step 4:** `git checkout -- package.json yarn.lock app.json`, restore the patch filename with
  `git checkout -- patches/`, then `yarn install` to put `node_modules` back.
- **Step 5:** `git checkout -- ai/AGENTS.md ai/plans/README.md app.json package.json` and delete
  `shared/__tests__/widgetRuntimeLoads.test.ts`.

## 11. Subagents in this plan

**None.** The owner banned subagents on 2026-09-26, with `vision` the single exception for reading an image when the
session's model cannot see one. This session reads its own screenshots. Every review in this plan is the session's
own recorded diff review; the audit is the independent gate.

## 12. Report to the owner

Given in `steps/5-runtime-guard-and-records.md`.
