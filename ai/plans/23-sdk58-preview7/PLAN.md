# Plan: Session 23. SDK 58 preview.7 and RN 0.88.0-rc.2

| Field | Value |
| --- | --- |
| Brief | The owner's instruction of 2026-09-26: 🐋  "upgrade to 88 and an SDK 58 beta latest preview... regardless of if they are released candidates or not" |
| Planned at | `2a1dc302` (version 1.28.33), 2026-09-26 |
| Planned by | Planning session on 2026-09-26 |
| Needs first | nothing |
| Steps | 4, each one branch, one commit, one version |
| Device | Both: OnePlus 3T (`8f7ada76`) and iPhone XS (`00008020-0015585C22D2002E`). Step 1 rebuilds a native Android patch and changes widget geometry, step 3 changes the modal's animation engine, and none of those can be proven off-device |
| Owner decisions still needed | None (both were taken while planning; see section 2) |

## 1. Goal

`uat-2` rides the SDK 58 beta at `expo@58.0.0-preview.3` with `react-native@0.88.0-rc.0`. The beta has moved four
previews since (preview.4 on 2026-09-21 through preview.7 on 2026-09-25) and RN to `0.88.0-rc.2`, leaving **26
packages behind the SDK's own pin set**, React among them. When this plan is DONE, every SDK-pinned package sits at
what `expo@58.0.0-preview.7` pins, React is 19.3.0, RN is 0.88.0-rc.2, Reanimated is 4.7.0, both native patches
apply again, and both phones run a build from the upgraded tree. The owner would notice nothing: the widgets render
as they do today and the modal opens as it does today, which is what steps 4 and 5 exist to prove.

This is not the stable re-pin. Row 18 waits on `latest` moving to 58 stable and RN 0.88 leaving RC, and npm shows
neither (`expo@57.0.25`, `react-native@0.87.1` on 2026-09-26). This session rides the beta further, which is what
the owner ruled `uat-2` does.

The owner's rules that apply, quoted:

🐋  "upgrade to 88 and an SDK 58 beta latest preview. I know what you're talking about, like update, literally, this
session you are in now was supposed to be the purpose of upgrading to React 88 latest version and SDK 58 latest
version, regardless of if they are released candidates or not." (owner, 2026-09-26)

🐋  "visuals are settled, so no pixel changes without the owner's approval" (standing rule). Step 5 changes widget
geometry expression and the modal's animation engine, and both are proven to look unchanged rather than assumed to.

## 2. Decisions

### 2.1 Taken

1. **The target is `expo@58.0.0-preview.7` and `react-native@0.88.0-rc.2`, RC status notwithstanding.** Owner,
   2026-09-26, quoted above. RN is taken at rc.2 rather than the rc.1 that preview.7's `bundledNativeModules.json`
   names, because the owner asked for the latest and rc.2 is a two-line release: a Metro floor bump and a revert of
   an ObjC `ArrayBuffer` codegen change, neither of which this project touches.
2. **The pin set comes from `expo@58.0.0-preview.7`'s own `bundledNativeModules.json`, not from each package's
   `next` tag.** Planner. That file is what `npx expo install --check` measures against, so matching it is what makes
   the tree self-consistent. Measured: 26 of this project's pins differ from it.
3. **The two mixed `frame()` calls are split into two stacked modifiers.** Owner, 2026-09-26, choosing between three
   options. `@expo/ui` 58.0.7 splits `frame()` into a fixed overload (`width`/`height`) and a flexible one
   (`minWidth`/`maxWidth`/`minHeight`/`maxHeight`) that cannot be mixed, which is SwiftUI's own rule now expressed in
   the types. Chaining two modifiers is what SwiftUI does natively, so the render should be identical; the owner
   verifies on the XS before it ships.
4. **Reanimated 4.7's new layout-animations engine is taken as the default, and proven.** Owner, 2026-09-26. 4.7.0
   makes the new engine default. The escape hatch `USE_LEGACY_LAYOUT_ANIMATIONS_PROXY` is NOT set: step 5 measures
   the modal on the 3T against ADR-013's 30fps floor and the owner eyeballs it on the XS. If it regresses, setting
   the flag is the recorded fallback and becomes its own decision with the measurement in hand.
5. **Both native patches are rebuilt for the installed versions, not dropped.** Planner, from the spike: upstream has
   fixed neither. `expo-background-task@58.0.7` still has no `requiresNetworkConnectivity` (ISSUES #37, PR
   expo/expo#50581 still open) and `expo-widgets@58.0.7` still has no `openApp` in its converter (session 15c). The
   patches carry behaviour the app depends on, so they are regenerated against 58.0.7.
6. **`@expo/log-box` moves to 58.0.5.** Planner, from the spike: `@expo/metro-runtime@58.0.7` and
   `expo-router@58.0.8` both declare `peer @expo/log-box@^58.0.5`, and the installed 58.0.3 makes `yarn install`
   print two peer warnings. It is absent from `bundledNativeModules.json`, so the peer range is the only authority.
7. **The four `@babel` packages stay at 7.** Planner, re-verified at `2a1dc302`: `babel-preset-expo@58.0.3` carries
   36 Babel 7 dependencies. Row 18's job, unchanged by this session.
8. **Device proof on both phones.** Planner, applying the owner's 2026-09-25 ruling that both phones are proven. The
   3T is the floor device and the only place the Android patches and the frame audit run; the XS is the only place
   the widget geometry and the iOS modal spring can be judged.

### 2.2 The executor must not decide

1. Any anchor count other than 1. Ask: "Anchor `<file>` counted `<n>`, not 1. The plan is stale. Should I set the row
   to NEEDS REPLAN?"
2. A test failing that this plan does not expect. Ask: "`<test name>` failed and the plan does not predict it. The
   failure line is `<line>`. What should it be?"
3. A break printing `BREAK NOT APPLIED`. Ask: "Break `<label>` changed nothing, so the substitution no longer matches
   the code. Should I set the row to NEEDS REPLAN?"
4. **A preview later than preview.7, or an RN later than rc.2, published before the run.** Ask: "`<package>` is now
   at `<new>`, not the `<planned>` this plan names. Should I take the newer one?" Do not take it silently: a newer
   preview may move the pin set again, which is section 6's whole input.
5. **A patch that still fails to apply after being regenerated.** Ask: "The regenerated `<package>` patch does not
   apply to `<version>`. The reject is `<text>`. Should I stop?"
6. **Any visible difference in a widget or the modal on either phone.** Visuals are the owner's. Ask: "On `<phone>`
   the `<surface>` looks `<description>` rather than unchanged. Is that acceptable, or should I set the legacy
   layout-animations flag / revert the frame change?"
7. **The frame audit falling below the 30fps floor on the 3T.** Ask: "The modal measured `<n>` fps against the 30fps
   floor. Should I set `USE_LEGACY_LAYOUT_ANIMATIONS_PROXY`?"
8. Anything the step does not answer that the executor would otherwise have to decide, with the question "The plan
   does not say `<X>`. What should it be?"
9. Anything touching prayer times, `releases.json`, `uat` or EAS.

## 3. Pre-flight

Saved to `$TMPDIR/preflight-23.sh` and run as `bash $TMPDIR/preflight-23.sh <k>`. Given in full in
`scripts/preflight.sh`.

## 4. Background the executor needs

### Code map

| File | What it does | Which step changes it |
| --- | --- | --- |
| `package.json` | The pin set; 26 entries differ from preview.7's `bundledNativeModules.json` | steps 1, 2, 3 |
| `yarn.lock` | The resolved tree | steps 1, 2, 3 |
| `patches/expo-background-task+58.0.3.patch` | ISSUES #37: adds `requiresNetworkConnectivity` so the refresh runs offline | step 4 (renamed to `+58.0.7`) |
| `patches/expo-widgets+58.0.3.patch` | Session 15c: adds `openApp` so an Android widget tap opens the app | step 4 (renamed to `+58.0.7`) |
| `shared/__tests__/widgetOpenAppPatch.test.ts` | Guards that the patch names the INSTALLED version and still applies | step 4 |
| `widgets/PrayerWidget.tsx` | The home widget layouts; two `frame()` calls mix fixed and flexible params | step 5 |
| `components/modals/Modal.tsx` | The only layout-animation site in the app | step 5, read only |

### How the pieces interact

**The patches are load-bearing and fail silently.** `patch-package` skips a patch whose filename version does not
match the installed one, and prints an error rather than failing the install. `shared/__tests__/widgetOpenAppPatch.test.ts`
exists precisely because of that: it asserts the patch file is named for the installed version and that its content
is present in the converter. In the spike it failed 5 tests the moment the version moved, which is the guard working.

**`@expo/ui`'s `frame()` is widget-only.** `ai/AGENTS.md` bans `@expo/ui` outside `widgets/*.tsx`, so the API change
cannot reach app UI. The two mixed calls are in `PrayerWidget.tsx` at lines 656 and 725 at "Planned at".

**Layout animations exist in one file.** `grep` across `components/`, `app/` and `hooks/` finds `FadeIn`, `FadeOut`,
`SlideInDown` and `SlideOutDown` only in `components/modals/Modal.tsx`. So Reanimated 4.7's engine change has a blast
radius of one surface, which is what makes taking the default cheap to prove.

### Existing tests that cover this code

| Suite | What it proves |
| --- | --- |
| `shared/__tests__/widgetOpenAppPatch.test.ts` | The expo-widgets patch names the installed version and is present in the converter |
| `shared/__tests__/widgetContract.test.ts` | The widget layouts' serialization rules and palette |
| `shared/__tests__/versionLockstep.test.ts` | The three version files agree |
| The other 167 suites | Passed unchanged in the spike at preview.7 |

### Why the obvious simple fix is wrong

The obvious approach is one commit that moves all 26 pins together. It is wrong here for the reason
`ai/plans/README.md` already gives: `yarn.lock` is one resolved graph, so a single commit cannot be reverted apart,
and this upgrade carries four independent risks (React, RN, Reanimated's engine, the patches). Splitting by risk is
what makes a failure diagnosable. It is equally wrong to split to one-package-per-commit here: the SDK's pin set is
internally consistent by construction, and moving `expo-router` without `@expo/metro-runtime` produces a tree that
never existed upstream. Section 6 splits by RISK, not by package count, which is the owner's blast-radius rule from
2026-09-25 applied to an SDK wave.

## 5. Design

**None in the behavioural sense for steps 1 to 4:** they move version strings and regenerate two patches to say the
same thing against new sources. Step 5's design is below.

**The invariant, as one sentence a test can check:** every `frame()` call in `widgets/PrayerWidget.tsx` uses either
the fixed overload or the flexible one and never both, and the medium layout still reserves `MEDIUM_LIST_WIDTH` for
its day list and `ROW_HEIGHT` for each row.

**The chosen approach for `frame()`.** Each mixed call becomes two chained modifiers, in this order:

| Site | Today | After |
| --- | --- | --- |
| `PrayerWidget.tsx:656` | `frame({ maxWidth: Infinity, height: ROW_HEIGHT })` | `frame({ height: ROW_HEIGHT }), frame({ maxWidth: Infinity })` |
| `PrayerWidget.tsx:725` | `frame({ width: MEDIUM_LIST_WIDTH, maxHeight: Infinity })` | `frame({ width: MEDIUM_LIST_WIDTH }), frame({ maxHeight: Infinity })` |

Order matters and is not arbitrary: SwiftUI applies modifiers outward, so the fixed frame sizes the view and the
flexible frame then positions it in the space offered. Reversing them would let the greedy frame claim the space
before the fixed one constrains it.

**Alternatives rejected.**

| Alternative | Why rejected |
| --- | --- |
| `minHeight` and `maxHeight` both set to `ROW_HEIGHT` | One modifier, but a greedy parent can still stretch it; the owner chose the stacked form |
| Pin `@expo/ui` at 58.0.3 | Leaves one package off the SDK's pin set, which the stable re-pin would have to undo |
| Set `USE_LEGACY_LAYOUT_ANIMATIONS_PROXY` | The owner chose to take the new engine and prove it (decision 4) |
| One commit for all 26 pins | `yarn.lock` cannot be reverted apart, and four risks would share one commit |
| One commit per package | Produces trees that never existed upstream; the SDK pin set is consistent only as a set |

**What the spike proved, in the scratch worktree `~/athan-device-sweep/worktrees/plan-23` at `2a1dc302`,** with a
COPIED `node_modules` (not a symlink, because this spike rewrites it):

1. `yarn install` at the full preview.7 pin set plus RN rc.2 exits 0.
2. **`patch-package` finishes with 2 errors**, both version mismatches: `expo-background-task+58.0.3.patch` and
   `expo-widgets+58.0.3.patch` against installed 58.0.7.
3. `npx tsc --noEmit` exits 1 with exactly three errors: `stores/notifications.ts(1795,7)` for the lost
   `requiresNetworkConnectivity` option, and `widgets/PrayerWidget.tsx(656,53)` and `(725,53)` for the `frame()`
   overload split. The first disappears when step 4 restores the patch; the other two are step 5's work.
4. The suite: `Test Suites: 1 failed, 169 passed, 170 total`, `Tests: 5 failed, 2 skipped, 4655 passed, 4662 total`.
   The single failing suite is `shared/__tests__/widgetOpenAppPatch.test.ts`, failing on
   `expect(existsSync(... 'expo-widgets+58.0.7.patch')).toBe(true)` and on the converter no longer containing
   `val openApp: Boolean = false,`. That is the guard doing its job, not a regression.
5. Upstream has fixed neither patched behaviour: `grep requiresNetworkConnectivity` in `expo-background-task@58.0.7`
   returns nothing, and `grep openApp` in `expo-widgets@58.0.7`'s converter returns nothing.
6. Two peer warnings, both naming `@expo/log-box@^58.0.5` against the installed 58.0.3 (decision 6).

**The design review.** Reviewed by this planning session against the spike's measurements, on 2026-09-26, under the
owner's standing ruling that the session does its own reviewing and the audit is the independent gate. What the
review changed: the first draft ordered the steps by package count and put the patches last, which would have left
`tsc` red across three commits; the review reordered so the patches are restored (step 4) immediately after the
packages that break them, and moved the two visual changes into a single final step so the device proof runs once
against everything.

## 6. Steps

- [ ] Step 1: SDK 58 preview.7, both patches rebuilt, and the `frame()` split (specified)
- [ ] Step 2: React 19.3.0 and React Native 0.88.0-rc.2 (specified)
- [ ] Step 3: Reanimated 4.7.0 and worklets 0.13.0 (specified)
- [ ] Step 4: the device proof on both phones (specified)

Each step's detail is in `steps/<k>-<name>.md`.

**Every step leaves `uat-2` green, and that is what sizes step 1.** The first draft of this plan split the SDK
packages, the patch rebuild and the `frame()` fix into three commits. That is not buildable here: the pre-commit
hook runs the full suite, `--no-verify` is banned (`EXECUTOR-BRIEF.md` section 2), and the tree does not typecheck
between those three changes. The SDK bump BREAKS both patches by moving the version their filenames name, and
reveals the `frame()` overload split in the same install. So they are one commit, and step 1 says why in its own
header. Steps 2 and 3 are genuinely separable and stay separate.

**The order is by risk.** The SDK layer first, because it is the bulk and its failures are known from the spike;
React and RN next, because a failure there is unmistakable once the SDK layer is green; Reanimated third, because
its engine change is the one behavioural risk in the JS layer and it is the one thing the device proof is really
looking at; the device proof last, against the finished tree, so both phones are built once.

## 7. Device proof

Given in full in `steps/5-frame-split-and-proof.md`. Both phones, from a production build of the finished tree:

- **3T:** the Android patches are native, so only a device shows them working. Prove the widget tap opens the app
  (session 15c's behaviour, carried by the rebuilt patch) and the offline refresh still arms alarms (ISSUES #37,
  carried by the other). Then `e2e/scripts/frame-audit.sh` on the modal against ADR-013's 30fps floor.
- **XS:** the owner judges the widgets and the modal by eye. No screenshot goes to the owner; the executor describes
  what it sees.

Coordinates for any tap come from `e2e/device-atlas-oneplus3t.md` and are written back if anything is measured.

## 8. Records

Given in `steps/6-records.md`.

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes `uat-2` after
a PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| `patch-package finished with 2 error(s)` after step 1 | The patches name 58.0.3 and 58.0.7 is installed | EXPECTED from step 1 until step 4 restores them. Carry on |
| `tsc` reports `requiresNetworkConnectivity does not exist in type BackgroundTaskOptions` | The background-task patch is not applied | EXPECTED until step 4. Carry on |
| `tsc` reports `'height' does not exist in type` at `PrayerWidget.tsx` | The `frame()` overload split | EXPECTED until step 5. Carry on |
| `widgetOpenAppPatch.test.ts` fails 5 tests | The patch no longer names the installed version | EXPECTED from step 1 until step 4. It is the guard working |
| A regenerated patch still will not apply | Upstream restructured the file the patch edits | STOP (section 2.2, item 5) |
| `yarn install` warns `incorrect peer dependency "@expo/log-box@^58.0.5"` | `@expo/log-box` is still 58.0.3 | Step 1 moves it to 58.0.5 in the same commit. If it persists after step 1, STOP |
| The modal stutters, or the frame audit is below 30fps | Reanimated 4.7's new engine | STOP and ask (section 2.2, item 7). The fallback is `USE_LEGACY_LAYOUT_ANIMATIONS_PROXY`, and the owner decides with the number in hand |
| A widget looks different on either phone | The `frame()` split changed the layout | STOP and ask (section 2.2, item 6). Never tune the geometry to taste |
| `versionLockstep.test.ts` fails | The three version numbers differ | Set all three to the step's version and commit again |
| Anything else | | `EXECUTOR-BRIEF.md` section 7 |

**Anticipated review fixes.** None. Steps 1 to 3 are version strings; step 4 regenerates two patches whose content
the plan names; step 5's change is the two-line substitution the design table gives verbatim. A reviewer finding that
meets all three conditions in `EXECUTOR-BRIEF.md` section 4, item 8 is applied by the executor and recorded in
`LOG.md`; those three conditions are not restated here.

**Stopping part-way.** For every step: `git checkout -- package.json yarn.lock app.json` and any file the step
lists, then `yarn install` to put `node_modules` back. Step 4 also restores `patches/` and
`shared/__tests__/widgetOpenAppPatch.test.ts`; step 5 also restores `widgets/PrayerWidget.tsx`.

## 11. Subagents in this plan

**None.** The owner banned subagents on 2026-09-26, with `vision` the single exception for reading an image when the
session's model cannot see one. This session reads its own screenshots. Every review in this plan is the session's
own recorded diff review; the audit is the independent gate.

## 12. Report to the owner

Given in `steps/6-records.md`.
