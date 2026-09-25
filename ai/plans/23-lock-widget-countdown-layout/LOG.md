# Execution log: Session 23

## Step 1 to 4, one commit: `3c7c586e` (1.28.0)

All four steps landed together because they are one behavioural change to one file plus its
registration chain: splitting them would have left `uat-2` with a layout registered in `app.json`
that nothing pushed, or a muted tier half-renamed.

### What was built

| Step | Result |
| --- | --- |
| 1. Colour hierarchy and sizes | `WHITE_SECONDARY` renamed `WHITE_MUTED`, down from 5 uses to 2 (the absolute time in layouts 1 and 2). Sizes 17/14/11. Countdown dropped to medium weight |
| 2. Layout 3 | `AthanLockWidgetCountdown` plus `PrayerLockWidget3` and `ExtrasLockWidget3` |
| 3. Registration | 2 kinds in `app.json`, 2 `updateTimeline` calls in `stores/widget.ts` |
| 4. Tests | 26 lock/contract tests to 36; directive count 2 to 3 |

### Acceptance, as measured

- `npx tsc --noEmit`: exit 0.
- `npx biome check`: exit 0 on all 5 changed files. It first reported a format diff, because the
  shorter `foregroundStyle(WHITE)` let the `ATHAN` eyebrow fit one line; `--write` applied it.
- `yarn validate`: **170 suites, 4659 tests, 100%** statements, branches, functions and lines.
- Version: **1.27.400 to 1.28.0**, a minor. Two new kinds and a new composition is a feature, and the
  owner ruled on 2026-09-25 that a chunky change stops taking a patch. The gitignored
  `android/app/build.gradle` `versionName` was stale at 1.27.398 and was brought into step, which
  `versionLockstep.test.ts` caught.

### Breaks run, all caught

| Break | Expected to fail | Result |
| --- | --- | --- |
| Countdown weight to bold | the hierarchy test, layout 3 | failed 1 |
| A fallback card's refresh line muted | the fallback-solidity test | failed 1 |
| Layout 3 loses its `timerInterval` | the pairing test and the centring test | failed 2 |
| Layout 3's countdown loses `multilineTextAlignment` | the centring test | failed 1 |

### Two things the plan did not anticipate

1. **Three store suites broke on the mock, not on the code.** `widgetFlagOff`, `widgetIo` and
   `widgetSettingsSync` resolve `@/widgets/LockPrayerWidget` through
   `shared/__mocks__/widgets/LockPrayerWidget.ts` by a `jest.config.js` `moduleNameMapper` entry, so a
   kind that exists in the real module but not the mock is `undefined` when `stores/widget.ts` calls
   `updateTimeline` on it. The plan's step 3 named the two registration sites and missed the third.
   Recorded in `ai/AGENTS.md` as part of the four-edit rule.
2. **"Ten kinds" appeared in three test comments and one suite title** and is now twelve. Corrected,
   because a count in prose is a claim and this one had gone stale silently.

### Device state

Release build on the iPhone XS (`00008020-0015585C22D2002E`), 1.28.0, 0 errors. Verified from the
build products rather than the screen:

- `ios/ExpoWidgetsTarget/PrayerLockWidget3.swift` and `ExtrasLockWidget3.swift` were generated, each
  declaring `.supportedFamilies([.accessoryRectangular, .accessoryInline])` and its Layout 3 display
  name, and `index.swift` instantiates both.
- `ExpoWidgetsLayoutRegistry.json` in the shipped `.appex` is `{"widgets":{}}`. That is expected, not a
  fault: expo-widgets stores no initial props, which is why every layout guards `props == null`.

A grep of the app's `main.jsbundle` for the new font sizes returned nothing, which is a **false
negative and not evidence**: the bundle is Hermes bytecode (magic `c61fbc03`) and this repo's
2026-09-12 lesson records that Hermes packs string literals out of grep's reach. Runtime behaviour is
the only proof, and that is the owner's check.

### Left for the owner

The one claim no test here can settle: **whether layout 3's countdown ticks.** SwiftUI stops updating
a `Text(timerInterval:)` once it has been concatenated, which is why the inline faces carry no
countdown. An `HStack` sibling is not concatenation, so it should tick, but this file has never placed
a timer beside another element and the tests assert the modifier tree, not iOS's redraw behaviour.

Nothing is merged. The branch is `experiment/lock-widget-font-50pc`, per the owner's instruction to
hold it until they have tested it themselves.
