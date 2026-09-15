# How tests are written here

Every test in this repo is a template for the next one. Follow this page exactly, and copy the reference suite,
`components/prayer/__tests__/Alert.test.tsx`, when writing a component suite.

## Two kinds of suite

| Suite | File | Jest project | What it runs |
| --- | --- | --- | --- |
| Logic | `*.test.ts` | `unit` | Plain functions, stores and hooks, with `react-native` replaced by `shared/__mocks__/react-native.ts` |
| Component | `*.test.tsx` | `components` | Real React Native components, rendered by React Native Testing Library |

The extension decides the project. A `.test.ts` file never renders, and a `.test.tsx` file always does. Run one project
with `npx jest --selectProjects=components`, and one suite with its path first:
`npx jest components/prayer/__tests__/Alert.test.tsx --selectProjects=components`. A path written after
`--selectProjects` is not applied, with or without the `=`, and the whole project runs; `--listTests` shows what a
command will run.

## Where a suite lives

- Beside the file it tests, in that folder's `__tests__/`: `components/prayer/Alert.tsx` is tested by
  `components/prayer/__tests__/Alert.test.tsx`.
- `app/` is the one exception. Expo Router loads every file under `app/` as a screen, a test included, so `app/`
  suites live in `__tests__/app/` at the repository root.
- Shared set-up lives in `__tests__/harness.ts`. Import `showLondonDay`, `saveLondonDays`, `london`, `Breakage` and
  `onPlatform` from there, never from the files behind it.

## What a component suite asserts

Test what a person using the app, or the phone, can observe:

- what is on screen for a given state: text, which controls exist, what a screen reader hears;
- what a press, a toggle or a scroll changes: the store the app writes, the sheet it opens;
- which platform call the app makes: a notification permission check, a haptic, a reload.

Never assert:

- **Snapshots.** `toMatchSnapshot` pins markup, not behaviour, and breaks on every harmless edit.
- **Style values.** A colour or a margin is a design choice, and restating it in a test proves nothing. The one
  exception is a rule the app must keep, named in a comment beside the assertion: an animated value that must start
  settled, a layout that must fill the screen, a layer that must stay displayed until its fade ends.
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

## Choosing inputs that can fail

A test guards a line only if the input it uses would give a different result when that line is wrong.

- **Never test at a starting value.** The overlay starts on index 0 of the Standard list, so a row that wrongly reads
  index 0 passes every test that selects index 0. Select another row, on the other list too.
- **Pick values that differ where the code could confuse them.** Dhuhr is 13:02 on both 11 and 12 September, so it
  cannot show which day a row read; Sunrise (06:26, then 06:28) can.
- **Cross boundaries on the side the rule decides.** 59.6 seconds rounds up and to the nearest alike; 59.4 seconds
  tells ceil from round.

## Setting the app's state

- **Every test starts from a fresh install.** Before each test, storage is emptied and every atom is back to its
  initial value. After each test, pending timers are cleared, real timers restored, and every spy and replaced
  property undone (`jest.components.setup.js`).
- **Plain variables inside modules are not reset.** A module that sets itself up once, such as
  `initWidgetSettingsSync`, keeps its "already done" flag while the subscription it made is wiped with the atoms, so
  from the second test on it is silently inert. A suite that depends on such set-up tests it in its first test only,
  or loads the module fresh with `jest.isolateModules`.
- **Prayer data:** `showLondonDay(date, time, breakage)` saves real London days from 10 to 12 September 2026 through
  the real database, sets the clock and builds both lists. `breakage` marks times sent unreadably or days not stored.
  For another date (the Ramadan season, say), set the clock with `jest.useFakeTimers({ now: london(date, time) })`.
- **Preferences:** call the store setter the app itself uses (`setPrayerAlertType`, `setSoundPreference`). A preference
  the app writes only from a component (`decorationsEnabledAtom`, `countdownBarShownAtom`, `showTimePassedAtom` and
  `showArabicNamesAtom`, which Settings writes through `useAtom`) is written with `getDefaultStore().set(atom, value)`,
  with a comment naming that component. Never write a storage key directly.
- **Time:** `showLondonDay` turns fake timers on. Move time with `await act(() => jest.advanceTimersByTime(ms))`.
- **Platform:** Jest loads React Native as iOS. `onPlatform('android', 29)` runs the rest of the test as Android API 29:
  `Platform.OS`, `Platform.Version` and `Platform.select` all answer as Android. A value a module works out as it
  loads is not read again: `Platform.select` at the top of `components/modals/Modal.tsx` and
  `components/sheets/parts/Sheet.tsx`, and `IS_IOS` in `device/updates.ts`. A test of such a value loads the module
  fresh inside `jest.isolateModules` and switches the platform inside the same callback, through a harness required
  there: React Native loads again inside the callback, so a switch made outside it changes a copy the fresh module
  never reads (`__tests__/harness.test.tsx` pins this).

  ```tsx
  // Assigned inside the callback, which runs before the next line; a failed load throws there
  let updates!: typeof import('@/device/updates');
  jest.isolateModules(() => {
    require('@/__tests__/harness').onPlatform('android');
    updates = require('@/device/updates');
  });
  ```

  React loads again inside the callback too, and hooks fail on any React but the one rendering them: React's own, a
  mocked library's (Reanimated, safe-area) and React Native's, which load during render. So a component that calls
  hooks (`Sheet.tsx`) is loaded fresh with React pointed at the React the suite renders with, and rendered with the
  library imported at the top of the suite, as in any test. Take the three React modules before the callback: taken
  inside it they are the fresh copies, and every hook throws "Cannot read properties of null". Rendering with a fresh
  React and the library's `pure` entry instead works only for a component calling React's own hooks, so it is not used.
  `__tests__/harness.test.tsx` pins this, and the music glyph test in
  `components/sheets/screens/__tests__/Settings.test.tsx` uses it. `jest.doMock` lasts for the rest of the file, so a
  later fresh load in the same file gets this React rather than a fresh one: a test that needs a fresh React goes in a
  file of its own.

  ```tsx
  const sharedReact = {
    react: require('react'),
    jsx: require('react/jsx-runtime'),
    jsxDev: require('react/jsx-dev-runtime'),
  };
  // Assigned inside the callback, which runs before the render; a failed load throws there
  let FreshSheet!: typeof import('@/components/sheets/parts/Sheet').default;
  jest.isolateModules(() => {
    jest.doMock('react', () => sharedReact.react);
    jest.doMock('react/jsx-runtime', () => sharedReact.jsx);
    jest.doMock('react/jsx-dev-runtime', () => sharedReact.jsxDev);
    require('@/__tests__/harness').onPlatform('android');
    FreshSheet = require('@/components/sheets/parts/Sheet').default;
  });

  await render(<FreshSheet {...props} />);
  ```

## Finding things on screen

Query the way a person finds things, in this order of preference:

1. `screen.getByRole('button', { name: '...' })` for anything pressable that has a role;
2. `screen.getByText('...')` for text, including a button that has no role;
3. `screen.getByLabelText('...')` for a labelled control.

Then, only where the app offers nothing a person could find it by:

- **An icon** drawn from an `.svg` file carries its file name: `screen.getByTestId('svg:bell-ring')`.
- **An image** renders as `RCTImageView`, which the library does not treat as an image: find it by the `source` it
  draws.
- **Something with no role, label or text** is reached from `screen.root`, with a comment saying why.

A test that pins what is drawn, rather than what a screen reader reaches, queries with `{ includeHiddenElements: true }`,
so a later accessibility fix does not read as a regression. Adding a `testID` to the app is a production change that
needs review.

## Mocks

- **Already mocked for every suite** in `jest.components.setup.js`, and never mocked again in a suite:
  - Expo's native modules, through jest-expo's setup;
  - Reanimated and worklets. `useSharedValue` behaves as the real hook: one value for the component's life (a
    function initial value is called once, on mount) whose animation is cancelled on unmount, so an effect that
    depends on a shared value re-runs only when that value changes, and a first-evaluation snap ends after the first
    frame. The published mock still returns a new `useDerivedValue` result and a new `useAnimatedRef` ref on every
    render, so an effect that depends on either runs on every render;
  - Gesture Handler, the bottom sheet and safe-area;
  - `expo-haptics`, whose calls are jest functions: `expect(Haptics.impactAsync).toHaveBeenCalledWith(...)`;
  - `expo-audio`, which ships no Jest mock of its own, so the setup defines the three calls the app makes.
- **To watch a call into one of those** (`withTiming`, `withRepeat`, `cancelAnimation`, `useReducedMotion`), use
  `jest.spyOn` on the module, calling through unless the test sets an input. Every spy is undone after each test.
- **To observe or control a call** into a module those do not cover, mock that module in the suite, beside the imports,
  with a comment saying why: `components/ui/__tests__/Error.test.tsx` mocks `expo-updates` and `@/stores/version`,
  because Refresh wipes the cache and restarts the app.
- **To change what a shared mock returns**, use `mockReturnValueOnce` or `mockImplementationOnce`. `clearMocks` is on
  for component suites, which resets call counts before each test but not return values, so a plain
  `mockReturnValue` would leak into every later test in the file. A queued `Once` answer that a failing test did not
  use also survives, so reset it in `afterEach` where a test queues several.

## Before a test is trusted

1. **Red before green.** Break the line the test guards (delete the call, flip the condition) and watch the test fail.
   Put the file back. A test that still passes against the broken line guards nothing.
2. **Never edit a test to make it pass.** A failing test is a finding about the code or about the test's premise, and
   the difference is decided before anything changes.
3. **Coverage.** `yarn validate` measures coverage, and fails below 100% on any of the four measures across the app, which is what catches a commit that weakens or deletes a test. The pre-commit and pre-push hooks run
   `scripts/check-changed-coverage.js`, which refuses any changed source file below 100% statements, branches,
   functions and lines, and refuses to run while source or test files have changes that are not being committed. A
   file that genuinely cannot be measured is listed in that script's `UNMEASURED`, with its reason.
4. **No coverage ignore comments.** `istanbul ignore`, `c8 ignore` and `v8 ignore` report untested code as covered, and
   the gate refuses any changed file that holds one.
5. **A line no honest test can reach** is not left uncovered and not hidden. Prove it unreachable, then either delete it
   with no change in behaviour, or keep it where it protects the app from a future edit and test it with the input
   that edit would bring (a prayer list without a name, a start-up that rejects).
