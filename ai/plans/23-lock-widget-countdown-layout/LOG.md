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

## The six commits after 1.28.1

Back-filled by the audit on 2026-09-25: this log had stopped at the first commit while six more shipped. The
session ran as a live loop with the owner reading each build on the XS, so the plan's four-step checklist was
overtaken by their rulings. What actually landed, in order:

| Version | What changed | Why |
| --- | --- | --- |
| `3c7c586e` 1.28.0 | Layout 3 added (name + countdown), sizes 17/14/11, `WHITE_SECONDARY` renamed `WHITE_MUTED` | The plan as written |
| `ee2ba209` 1.28.1 | This log, plus the `ai/AGENTS.md` record | The plan as written |
| `40f5cc34` 1.28.3 | Layout 3 countdown given `fixedSize`; Layout 1's absolute time to solid | First centring attempt, and an owner colour ruling |
| `f5fba7e3` 1.28.4 | Version bump only | The first real-data build: `.env` holds `EXPO_PUBLIC_ENV=local`, so `api/client.ts:124` had been returning `MOCK_DATA_SIMPLE` and the widget carried launch-relative times. Rebuilt with `eas env:exec preview` |
| `dee4c765` 1.28.7 | The midline split on Layouts 2 and 3; every live face to one size and medium weight; Layout 1 row spacing to 6pt | The owner's design, after three failed centring attempts |
| `293b2fd2` 1.28.8 | Gallery reordered (countdown pair first), Layout 3 unbolded, all six descriptions rewritten | Owner ruling on reading all three on device |
| `02dc1a81` 1.28.9 | Row set DONE | Premature: see `AUDIT.md` finding 1 |

Versions 1.28.2, 1.28.5 and 1.28.6 were bumped for builds that owner feedback superseded before they were
committed, so those numbers exist in no commit.

### What the session learned that the plan could not have known

**A `Text(timerInterval:)` reports a worst-case width as its intrinsic size.** This cost four attempts and is now
in `ai/AGENTS.md`. A shrink-wrapped `HStack` around one measures the reservation, not the glyphs, so centring the
row strands the name at the slot's edge. `multilineTextAlignment` only moves glyphs inside the reservation;
`fixedSize` pins it open and makes the row overflow, which took the digits off the slot entirely and was the
"countdown does not exist" symptom. The fix was to stop centring and anchor each half at the slot's midline.

**Three store suites resolve the lock module through a jest mock.** `jest.config.js` maps
`@/widgets/LockPrayerWidget` to `shared/__mocks__/widgets/LockPrayerWidget.ts`, so a kind that exists in the real
module but not the mock is `undefined` when `stores/widget.ts` calls `updateTimeline` on it. A new kind is five
edits, not four.

**Adding a modifier to a layout without adding it to the test's modifier mock makes the layout throw** and render
its placeholder, which is how the error path proved itself twice.

**A break that passes is a broken test.** One break initially passed because the substitution had matched an inline
fallback rather than the live element; it was retried against the right occurrence before being believed.

### Device state

The iPhone XS (`00008020-0015585C22D2002E`) is left on **1.28.8**, a Release build carrying the real API key, so
its widgets show live London times. The owner drove every acceptance read; no screenshot was taken by the session.
