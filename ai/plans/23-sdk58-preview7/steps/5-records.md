# Records and the report

## Findings text

Add to `ai/features/uat-2/AUDIT-FINDINGS.md`, under the exact heading
`## Session 23: SDK 58 preview.7 and RN 0.88.0-rc.2`:

```markdown
## Session 23: SDK 58 preview.7 and RN 0.88.0-rc.2

`uat-2` rode `expo@58.0.0-preview.3` with `react-native@0.88.0-rc.0`. The beta had moved four previews since
(preview.4 on 2026-09-21 through preview.7 on 2026-09-25) and RN to rc.2, leaving **26 packages behind the SDK's own
pin set**, React among them. The owner's instruction was to take the latest regardless of RC status.

| Moved | From | To |
| --- | --- | --- |
| `expo` and 18 `expo-*` / `@expo/*` runtime packages | preview.3 / 58.0.0-58.0.5 | preview.7 / 58.0.1-58.0.9 |
| `react`, `react-dom` | 19.2.3 | 19.3.0 |
| `react-native` and its two tools | 0.88.0-rc.0 | 0.88.0-rc.2 |
| `react-native-reanimated` | 4.6.0 | 4.7.0 |
| `react-native-worklets` | 0.12.2 | 0.13.0 |
| `@expo/log-box`, `expo-dev-client`, `jest-expo` | 58.0.3 / 58.0.3 / 58.0.2 | 58.0.5 / 58.0.7 / 58.0.3 |

The pin set came from `expo@58.0.0-preview.7`'s own `bundledNativeModules.json`, which is what
`npx expo install --check` measures against. Two deliberate departures: **RN at rc.2** rather than the rc.1 that
file names, on the owner's instruction, rc.2 being a Metro floor bump plus a revert of an ObjC `ArrayBuffer` codegen
change this project cannot reach; and **`@expo/log-box` at 58.0.5**, absent from that file entirely, taken from the
peer range `@expo/metro-runtime@58.0.7` and `expo-router@58.0.8` both declare.

**Three things broke, and a version bump alone survives none of them.**

1. **Both native patches stopped applying.** `patch-package` skips a patch whose filename version does not match the
   installed one, printing an error rather than failing the install, so this is the exact shape of breakage that
   reaches a phone silently. `shared/__tests__/widgetOpenAppPatch.test.ts` is what caught it, failing 5 tests the
   moment the version moved, which is the job it was written for. Both patches were rebuilt against 58.0.7 rather
   than dropped: upstream has fixed neither behaviour, verified at 58.0.7 by grepping the installed sources.
   `expo-background-task` still has no `requiresNetworkConnectivity` (ISSUES #37, PR expo/expo#50581 still open) and
   `expo-widgets` still has no `openApp` in its converter (session 15c).
2. **`@expo/ui` split `frame()` into two overloads that cannot be mixed**: fixed (`width`/`height`) and flexible
   (`min`/`ideal`/`max`). That is SwiftUI's own rule, now expressed in the types. Two widget sites mixed them and
   stopped typechecking. Each became two chained modifiers, **fixed first**, because SwiftUI applies modifiers
   outward: the fixed frame sizes the view and the flexible one then positions it in the space offered. Reversed,
   the greedy frame claims the space before the fixed one constrains it. The owner chose this form on 2026-09-26 and
   verified the render on the XS.
3. **Reanimated 4.7 makes the new layout-animations engine the default.** The blast radius here is one file:
   `components/modals/Modal.tsx` is the only place in the app that uses `entering`/`exiting` animations. The owner
   chose to take the default and prove it rather than pin `USE_LEGACY_LAYOUT_ANIMATIONS_PROXY`, so that flag is
   deliberately not set. `Modal.tsx` was deliberately NOT edited, because an unchanged file is what makes the
   before/after comparison mean anything.

**DURABLE LESSON: an SDK pin set is consistent only as a set, so "one package per commit" is the wrong rule here.**
The standing blast-radius rule (owner, 2026-09-25) splits bumps by what they can break. For an SDK wave that guidance
inverts: moving `expo-router` without `@expo/metro-runtime` produces a tree that never existed upstream. This session
split by RISK instead, into the SDK layer, React and RN, and Reanimated. The SDK layer could not be split further
without `--no-verify`, which this programme bans: the bump itself breaks both patches and reveals the `frame()`
split, and the tree does not typecheck again until all three are fixed, so they are one commit and the step says why.

**Verified:** `<TESTS_AFTER>` with 100% on all four coverage measures, `tsc` and Biome exiting 0. On the 3T:
`yarn check:device` passed with the alarms armed, which is what proves the background-task patch actually compiled;
a widget tap resumed the app, which proves the expo-widgets patch did; and the modal met ADR-013's 30fps floor under
`frame-audit.sh` on the new Reanimated engine. On the XS: the owner confirmed the widgets and the modal look
unchanged.
```

## Table rows

The executor sets the `ai/plans/README.md` row to EXECUTED. The auditor applies this text to the row on PASS.

For `ai/prompts/README.md`, add to the closed-prompts index:

```markdown
- 23. `ai/plans/23-sdk58-preview7/PLAN.md` — DONE 2026-09-26 — the SDK 58 beta moved from preview.3 to preview.7 and
  RN from rc.0 to rc.2, 26 packages in all, React 19.3.0 and Reanimated 4.7.0 among them. Three breakages, none
  survivable by a version bump: both native patches stopped applying and were rebuilt for 58.0.7 (upstream has fixed
  neither), `@expo/ui` split `frame()` into two exclusive overloads, and Reanimated 4.7 made the new
  layout-animations engine the default. Proven on both phones. This is NOT the stable re-pin: row 18 still waits on
  `latest` moving to 58 stable and RN leaving RC.
```

## Docs commit

```
<VERSION> - docs(plans): session 23 executed: SDK 58 preview.7 and RN 0.88.0-rc.2
```

The docs commit also carries any coordinate measured during step 4, written back into
`e2e/device-atlas-oneplus3t.md` under the screen it belongs to.

## The report to the owner

Starts with `Execution session` and a `Time:` line from `date '+%H:%M:%S %d.%m.%Y'`. A few plain sentences on what
moved, what broke and what was proven on each phone, then the progress table in `EXECUTOR-BRIEF.md` section 6's
format, then any decision waiting on the owner, then the four-line handoff from the `athan-next` skill.
