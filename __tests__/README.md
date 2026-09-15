# How tests are written here

Every test in this repo is a template for the next one. Follow this page exactly, and copy the reference suite,
`components/prayer/__tests__/Alert.test.tsx`, when writing a component suite.

## Two kinds of suite

| Suite | File | Jest project | What it runs |
| --- | --- | --- | --- |
| Logic | `*.test.ts` | `unit` | Plain functions, stores and hooks, with `react-native` replaced by `shared/__mocks__/react-native.ts` |
| Component | `*.test.tsx` | `components` | Real React Native components, rendered by React Native Testing Library |

The extension decides the project. A `.test.ts` file never renders, and a `.test.tsx` file always does.

## Where a suite lives

- Beside the file it tests, in that folder's `__tests__/`: `components/prayer/Alert.tsx` is tested by
  `components/prayer/__tests__/Alert.test.tsx`.
- `app/` is the one exception. Expo Router loads every file under `app/` as a screen, a test included, so `app/`
  suites live in `__tests__/app/` at the repository root.
- Shared set-up lives in `__tests__/harness.ts`. Nothing else is shared between suites.

## What a component suite asserts

Test what a person using the app, or the phone, can observe:

- what is on screen for a given state: text, which controls exist, what a screen reader hears;
- what a press, a toggle or a scroll changes: the store the app writes, the sheet it opens;
- which platform call the app makes: a notification permission check, a haptic, a reload.

Never assert:

- **Snapshots.** `toMatchSnapshot` pins markup, not behaviour, and breaks on every harmless edit.
- **Style values.** A colour or a margin is a design choice, and restating it in a test proves nothing. The one
  exception is a rule the app must keep, such as an animated value that must start settled.
- **Internals.** How many times a hook ran, which child component was used, or a component's local state.
- **How an animation looks.** Smoothness and timing are checked on a device with frame evidence, not here.

## The shape of a suite

```tsx
/**
 * The bell on a prayer row: what a screen reader hears, and what pressing it does
 */

import { fireEvent, render, screen } from '@testing-library/react-native';

import { showLondonDay } from '@/__tests__/harness';
import { AlertType, ScheduleType } from '@/shared/types';
import { setPrayerAlertType } from '@/stores/notifications';
import { getAlertSheetState } from '@/stores/ui';

import Alert from '../Alert';

const FAJR = 0;

describe('the Fajr bell on the Standard list, Friday 11 September 2026 at 14:00', () => {
  it('opens the sheet of a prayer saved Sound without checking permission', async () => {
    showLondonDay('2026-09-11', '14:00');
    setPrayerAlertType(ScheduleType.Standard, FAJR, AlertType.Sound);
    await render(<Alert type={ScheduleType.Standard} index={FAJR} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Fajr notification: sound' }));

    expect(getAlertSheetState()).toMatchObject({ prayerEnglish: 'Fajr', isUnavailable: false });
  });
});
```

The rules the example follows:

1. **A doc comment** at the top says what the suite covers, in one line.
2. **Imports** in Biome's order: packages, then `@/` aliases, then the file under test.
3. **`describe`** names the component and the fixed situation, including the date and time when prayer data matters.
4. **`it`** states one behaviour as a plain sentence in the present tense. Never "should", never "works".
5. **Three blocks**, separated by blank lines: set the state and render, act, assert.
6. **One behaviour per test.** Variations of the same behaviour use `it.each` with a comment naming the columns.
7. **`await`** every `render`, `rerender`, `fireEvent` and `act`: React Native Testing Library 14 makes them all
   asynchronous.

The reference suites show the pattern, not complete coverage of their files. A suite you write covers every statement,
branch and function of the file it tests.

## Setting the app's state

- **Every test starts from a fresh install.** Before each test, storage is emptied and every atom is back to its
  initial value, and after each test pending timers are cleared and real timers restored (`jest.components.setup.js`).
- **Plain variables inside modules are not reset.** A module that sets itself up once, such as
  `initWidgetSettingsSync`, keeps its "already done" flag while the subscription it made is wiped with the atoms, so
  from the second test on it is silently inert. A suite that depends on such set-up tests it in its first test only,
  or loads the module fresh with `jest.isolateModules`.
- Prayer data: `showLondonDay(date, time, breakage)` saves real London days from 10 to 12 September 2026 through the
  real database, sets the clock and builds both lists. `breakage` marks times sent unreadably or days not stored.
- Preferences: call the store setter the app itself uses (`setPrayerAlertType`, `setSoundPreference`), never an atom or
  a storage key directly.
- `showLondonDay` turns fake timers on. Move time with `await act(() => jest.advanceTimersByTime(ms))`.

## Finding things on screen

Query the way a person finds things, in this order of preference:

1. `screen.getByRole('button', { name: '...' })` for anything pressable that has a role;
2. `screen.getByText('...')` for text, including a button that has no role;
3. `screen.getByLabelText('...')` for a labelled control.

A `testID` is a last resort, and adding one is a production change that needs review.

## Mocks

- **Already mocked for every suite** in `jest.components.setup.js`, and never mocked again in a suite: Expo's native
  modules (through jest-expo's setup), Reanimated and worklets, Gesture Handler, the bottom sheet, safe-area, and
  expo-audio (which ships no Jest mock of its own, so the setup defines the three calls the app makes).
- **To observe or control a call** into a module those do not cover, mock that module in the suite, beside the imports,
  with a comment saying why: `components/ui/__tests__/Error.test.tsx` mocks `expo-updates` and `@/stores/version`,
  because Refresh wipes the cache and restarts the app.
- **To change what a shared mock returns**, use `mockReturnValueOnce` or `mockImplementationOnce`. `clearMocks` is on
  for component suites, which resets call counts before each test but not return values, so a plain
  `mockReturnValue` would leak into every later test in the file.

## Before a test is trusted

1. **Red before green.** Break the line the test guards (delete the call, flip the condition) and watch the test fail.
   Put the file back. A test that still passes against the broken line guards nothing.
2. **Never edit a test to make it pass.** A failing test is a finding about the code or about the test's premise, and
   the difference is decided before anything changes.
3. **Coverage.** `yarn validate` measures coverage. The pre-commit and pre-push hooks run
   `scripts/check-changed-coverage.js`, which refuses any changed source file below 100% statements, branches,
   functions and lines, and refuses to run while source or test files have changes that are not being committed. A
   file that genuinely cannot be measured is listed in that script's `UNMEASURED`, with its reason.
4. **No coverage ignore comments.** `istanbul ignore`, `c8 ignore` and `v8 ignore` report untested code as covered, and
   the gate refuses any changed file that holds one.
