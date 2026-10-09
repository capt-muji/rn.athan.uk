# Evidence: test and tooling infrastructure

Facts only, read from the tree at base commit `c3149dfc`. Every claim cites `path:line` relative to the
repo root. Section 9 lists what was read in full and what was read in part.

## 1. Gates

### 1.1 `yarn validate`

`package.json:22` runs three commands in order, each stopping the chain on failure:

1. `tsc --noEmit`. Config: `tsconfig.json:2` extends `expo/tsconfig.base`, `strict` is on
   (`tsconfig.json:5`), `@/*` maps to the root (`tsconfig.json:8-10`), JSON imports resolve
   (`tsconfig.json:11`), and every `.ts` and `.tsx` file is included, tests too (`tsconfig.json:13`).
2. `biome check . --error-on-warnings`. Biome honours `.gitignore` (`biome.json:3-7`) and skips
   `.agents`, `metro.config.js`, `jest.config.js` and two `ai/features` data folders
   (`biome.json:8-16`). Line width is 120, and 100 for JSON (`biome.json:18-31`). The linter uses the
   recommended preset with `noUnusedImports`, `useExhaustiveDependencies` and `noArrayIndexKey` at
   warn and `noConsole` at error (`biome.json:43-61`). The flag turns each warning into a failure,
   which `shared/__tests__/qualityGate.test.ts:96-102` pins. Import groups are fixed: packages, then
   `@/` aliases, then relative paths (`biome.json:63-74`).
3. `jest --silent --coverage`. Both projects run. Coverage is collected from `api`, `app`,
   `components`, `device`, `hooks`, `modules`, `stores`, `widgets` and `shared`, minus `.d.ts`,
   `__mocks__` and `__tests__` (`jest.config.js:110-124`). The global threshold is 100 for branches,
   functions, lines and statements (`jest.config.js:131-138`). The reporters are `json-summary` and
   `text-summary` (`jest.config.js:128`). The test timeout is 10 seconds and is read from the root
   only (`jest.config.js:125-126`).

A collected file counts whether or not a test imports it (`jest.config.js:11-12`,
`scripts/check-changed-coverage.js:4-5`). A new file under a collected folder with any uncovered line
therefore fails `yarn validate` through the global threshold.

### 1.2 Hooks

| Hook | Runs, in order | Source |
| --- | --- | --- |
| pre-commit | `node scripts/check-identifiers.js --staged`, then `npx lint-staged`, then `yarn validate`, then `node scripts/check-changed-coverage.js --staged` | `.husky/pre-commit:1` |
| commit-msg | `node scripts/check-identifiers.js --message "$1"` | `.husky/commit-msg:1` |
| pre-push | Per pushed ref: skip a deletion, `check-identifiers.js --push <sha>`, `yarn validate` once per push, `check-changed-coverage.js --push <sha>` | `.husky/pre-push:3-16` |

- `lint-staged` runs on staged `js, jsx, ts, tsx, mjs` files: `biome check --write
  --no-errors-on-unmatched`, then `jest --bail --findRelatedTests --passWithNoTests`
  (`package.json:26-31`).
- The hook files are tracked and `prepare` runs `husky` on install (`package.json:14`,
  `shared/__tests__/qualityGate.test.ts:45-90`). There is no CI (`shared/__tests__/qualityGate.test.ts:4`).
- Only the generated plumbing `.husky/_` is ignored (`.gitignore:3`). The local git config sets
  `core.hooksPath` to `.husky/_` (read with `git config` in this session). In this worktree that
  folder is absent, so git invokes no hook here until `yarn husky` (`package.json:15`) generates it.
  The gates must then be run by hand.

### 1.3 Changed-files coverage gate (`scripts/check-changed-coverage.js`)

- It reads `coverage/coverage-summary.json`, which `jest --coverage` writes, and fails when the file
  is missing (`scripts/check-changed-coverage.js:24`, `:133`).
- `--staged` first refuses to run while any code file is unstaged or untracked, because coverage is
  measured on the working tree (`:77-92`, `:96-99`). The changed set is the staged added, copied,
  modified and renamed files (`:100`).
- `--push <sha>` requires `HEAD` to equal the pushed commit (`:104-105`), requires no unrecorded code
  including staged code (`:107-108`), and takes every file of every commit that no remote has, merge
  resolutions included (`:110-120`). Deleted files drop out (`:121`).
- Only code files are gated: extensions `ts, tsx, js, jsx, mjs` (`:26`). Files under `__tests__/` or
  `__mocks__/` and `.d.ts` files are not source (`:27`, `:128-130`). A `.json`, `.md`, `.yaml`,
  `.py`, Kotlin or Swift file is never examined by this script.
- With no changed source file the script exits clean (`:131`).
- Per changed source file, in this order:
  1. a coverage ignore comment (`istanbul`, `c8` or `v8` followed by `ignore`) fails the file
     (`:28`, `:143-147`);
  2. a file absent from the summary fails unless its path starts with an `UNMEASURED` entry
     (`:149-154`);
  3. a file edited after the summary was written fails (`:156-160`);
  4. any of the four metrics below 100 percent fails (`:25`, `:162-165`).
- `UNMEASURED` holds: `widgets/`, `plugins/`, `app.config.ts`, `metro.config.js`,
  `jsx-runtime-shim.ts`, `assets/`, `mocks/`, `e2e/`, `ai/features/global-prayer-times/data/`,
  `scripts/`, `.agents/`, `jest.config.js`, `jest.setup.js`, `jest.components.setup.js` (`:31-52`).
- The summary is consulted before `UNMEASURED` (`:141`, `:149`). `widgets/` is listed as unmeasured
  (`:33-35`) and is also collected (`jest.config.js:106-109`, `:119`), so a changed widget layout is
  in the summary and must be at 100 percent. `assets/` is unmeasured (`:40`) and not collected
  (`jest.config.js:110-124`).
- A new top-level folder that is neither collected nor in `UNMEASURED` fails as "not measured"
  (`:149-153`).
- A commit that only weakens or deletes a test changes no source file and passes this script. The
  global thresholds are what refuse it (`:12-13`, `jest.config.js:129-130`).

### 1.4 Identifier gate (`scripts/check-identifiers.js`)

- Modes: `--staged`, `--message <file>`, `--push <sha>`, `--all`, `--history`, `--learn`
  (`scripts/check-identifiers.js:13-18`, `:373-395`). Any hit exits 1 (`:397-404`). No flag skips it
  (`:20-21`).
- Private list: exact strings held outside the repository, at `ATHAN_IDENTIFIER_DENYLIST` or
  `$HOME/.config/athan/identifier-denylist.txt` (`:30-31`). Matching is a case-insensitive substring
  test per line (`:189-195`). Without the list only shapes are checked (`:376-381`).
- Shapes (`:89-161`): a path under a home directory (`:90-97`), an iPhone identifier whole or
  shortened (`:98-102`), a UUID on a line that names a device tool (`:53-54`, `:103-107`), an adb
  serial (`:108-117`), a dumped location or a precise London position outside the fixture box
  (`:37`, `:61-81`, `:118-129`), a postcode unless the line names a public venue (`:58`, `:130-134`),
  a private network address (`:135-142`), a Wi-Fi name (`:143-147`), an Apple team id (`:148-155`),
  and a device named after a person (`:156-160`).
- Shapes are not applied to `.agents/skills` (except `athan-next`), two `ai/features` folders and
  `yarn.lock` (`:42-47`). They apply to every other tracked text file.
- An added image, recording or PDF outside `assets/` and two `ai/features` folders is rejected
  (`:50-51`, `:211-214`).
- `--staged` scans the lines a commit adds and the files it adds (`:242-247`). `--message` scans the
  message without comment lines (`:249-257`). `--push` scans author, message, added files and added
  lines of every commit no remote has (`:259-277`).
- A false positive is fixed by editing a shape in the same commit (`:20-21`). The shapes have their
  own suite, `shared/__tests__/identifierScan.test.ts`.

### 1.5 Other standing guards inside the suite

| Guard | What fails it | Source |
| --- | --- | --- |
| Unused exports | An exported symbol no production file reaches, outside a five-name allow list | `shared/__tests__/unusedExports.test.ts:16-22`, `:39-54`; `scripts/find-unused-exports.py:25-26`, `:163-168` |
| Quality gate | An untracked or non-executable pre-commit hook, a missing `prepare`, a `validate` without `--error-on-warnings` | `shared/__tests__/qualityGate.test.ts:45-110` |
| Version lockstep | See section 5 | `shared/__tests__/versionLockstep.test.ts:50-76` |
| Audio matrix | See section 5 | `shared/__tests__/audioMatrix.test.ts:97-143` |
| Widget contract and runtime load | See section 5 | `shared/__tests__/widgetContract.test.ts`, `shared/__tests__/widgetRuntimeLoads.test.ts` |
| Raw wipe call sites | `clearAllExcept` called outside `stores/sync.ts` and `stores/version.ts` | `stores/__tests__/database.test.ts:500-525` |

The unused-exports sweep scans `app, components, shared, stores, hooks, device, assets, modules, api,
widgets` (`scripts/find-unused-exports.py:25`). A symbol that only its own tests import is reported
as dead (`shared/__tests__/unusedExports.test.ts:4-6`).

## 2. Jest projects and environments

### 2.1 Projects

| | `unit` | `components` |
| --- | --- | --- |
| Matches | `**/__tests__/**/*.test.ts` (`jest.config.js:49`) | `**/__tests__/**/*.test.tsx` (`jest.config.js:82`) |
| Environment | `node` (`jest.config.js:45`) | `node` with export conditions `require`, `react-native` (`jest.config.js:67-68`) |
| `react-native` | `shared/__mocks__/react-native.ts` (`jest.config.js:46`) | The real package through the React Native preset resolver, loaded as iOS (`jest.config.js:61-63`, `:86`) |
| Setup before the framework | `jest.setup.js` (`jest.config.js:44`) | React Native preset setup, then `jest.setup.js` (`jest.config.js:63`) |
| Setup after the framework | none | `jest.components.setup.js` (`jest.config.js:64`) |
| `clearMocks` | off | on (`jest.config.js:66`) |
| Transform | App transform for `js, jsx, ts, tsx` (`jest.config.js:54`) | App transform for app `ts, tsx`, `babel-preset-expo` for the rest, an SVG transformer, an asset transformer (`jest.config.js:88-98`) |
| Not ignored in `node_modules` | `jotai` (`jest.config.js:55`) | React Native, Expo, navigation, bottom sheet, colour picker, `jotai` (`jest.config.js:101-103`) |

- The extension decides the project. A `.test.ts` file never renders and a `.test.tsx` file always
  does (`jest.config.js:47-48`, `__tests__/README.md:8-13`).
- Both projects compile app files through one transform, so their coverage merges per file
  (`jest.config.js:14-22`): `babel-jest` with the TypeScript preset, CommonJS modules and the
  automatic JSX runtime.
- Suites sit beside the file they test in `__tests__/`. `app/` suites sit in `__tests__/app/`,
  because Expo Router loads every file under `app/` as a screen (`__tests__/README.md:21-24`).
- Worktree, `android/` and `ios/` paths are ignored with `<rootDir>` anchors
  (`jest.config.js:1-9`, `:50-51`, `:83-86`).
- One suite is run with its path before `--selectProjects`. A path after the flag is not applied
  (`__tests__/README.md:13-17`).
- `yarn test:tz` runs the whole suite under four other time zones (`package.json:20`).

### 2.2 Module mappers shared by both projects (`jest.config.js:25-38`)

`@/widgets/PrayerWidget`, `@/widgets/LockPrayerWidget`, `@/shared/logger`, the `@/` catch-all,
`expo-constants`, `react-native-mmkv`, `expo-notifications`, `expo-background-task`,
`expo-task-manager`, `react-native-performance`, `expo-in-app-updates`. Every target except the
catch-all, which maps to the real file, is a file under `shared/__mocks__/`. Some suites still
declare the logger with an explicit factory
(`stores/__tests__/notifications.test.ts:63-72`).

### 2.3 What Jest does not reproduce

- The JSX runtime shim is resolved only by Metro (`metro.config.js:39-57`,
  `jsx-runtime-shim.ts:17-18`). Under Jest a `Text` element does not receive the injected
  `allowFontScaling: false` and `maxFontSizeMultiplier: 1` (`jsx-runtime-shim.ts:28`).
- Metro defers each module's evaluation to first use. Jest evaluates eagerly, so a module that runs
  late on a phone runs early in a test (`metro.config.js:13-29`).
- Widget feature flags default to the shipped value, which is off. `jest.setup.js:10` deletes
  `EXPO_PUBLIC_IOS_WIDGETS` at the top of every file. Enabled-path suites mock `@/shared/flags`
  (`jest.setup.js:7-9`).

### 2.4 State between tests

- Component project: before each test every MMKV storage the app created is emptied and every atom
  returns to its initial value (`jest.components.setup.js:5-63`). After each test pending timers are
  cleared, real timers restored and every spy undone (`jest.components.setup.js:65-72`).
  `__tests__/harness.test.tsx:183-207` pins this.
- Unit project: there is no shared reset. Storage and atoms live for the whole file, and each suite
  resets what it uses (`stores/__tests__/alarmHarness.ts:83-109`,
  `stores/__tests__/notificationPreferenceSetters.test.ts:75-92`,
  `stores/__tests__/database.test.ts:39-42`).
- Plain module variables are not reset in either project. A module that sets itself up once is
  tested in a file's first test or loaded fresh with `jest.isolateModules`
  (`__tests__/README.md:106-109`). Thirty test files use `isolateModules` or `resetModules`.
- A persisted atom reads storage once, when it is created (`stores/__tests__/storage.test.ts:286-297`,
  `stores/__tests__/notifications.test.ts:364-365`).
- The upgrade check runs once per process, so a fresh install is modelled only by a file's first
  launch (`__tests__/app/indexFreshInstall.test.tsx:1-4`, `__tests__/app/index.test.tsx:144-151`).

### 2.5 The clock

- Rule: a test never depends on when it runs. The clock is pinned before any state that depends on
  it is built (`__tests__/README.md:206-229`, `ai/AGENTS.md:77-78`).
- Component suites pin it through `showLondonDay(date, time)`, which calls
  `jest.useFakeTimers({ now })` before it saves days and builds both lists
  (`__tests__/harness.ts:28-37`). Fifteen test files call it.
- Other suites call `jest.useFakeTimers({ now: london(date, time) })`
  (`shared/__tests__/notifications.test.ts:203-206`,
  `stores/__tests__/notifications.test.ts:958-960`) or `jest.useFakeTimers()` with
  `jest.setSystemTime(...)` (`stores/__tests__/notifications.test.ts:1212-1214`,
  `stores/__tests__/notificationsClockChange.test.ts:24-27`), and restore real timers in `afterEach`.
  Fifty-two of the 189 test files call `useFakeTimers`.
- `london(date, time)` returns a London clock reading as an instant in any test zone
  (`hooks/__tests__/londonDays.ts:56-57`).
- Time moves with `await act(() => jest.advanceTimersByTime(ms))` (`__tests__/README.md:117`).
- A relative offset from `Date.now()` needs no pin (`__tests__/README.md:229`,
  `stores/__tests__/notifications.test.ts:622-672`).
- Suites that still read the real clock: `shared/__tests__/notifications.test.ts:45`, `:51-93`
  compares against an independent `date-fns-tz` reading without a pin, and
  `api/__tests__/client.test.ts:285`, `:616`, `:744` runs a group once on the real clock and once at
  a pinned 00:30.

## 3. Mocks available

### 3.1 Manual mocks under `shared/__mocks__/`

| Mock | Simulates | Cannot simulate | Source |
| --- | --- | --- | --- |
| `react-native-mmkv` | One in-memory store per `createMMKV` call: `getString`, `getBuffer`, `getNumber`, `getBoolean`, `set`, `remove`, `contains`, `clearAll`, `getAllKeys`. Values keep their type. `set` rejects an empty key | The instance id and options are discarded. No persistence across a fresh module registry or a process death. No torn write, no listeners, no second process such as a widget extension | `shared/__mocks__/react-native-mmkv.ts:19-59`; id discarded: `stores/__tests__/database.test.ts:590-592` |
| `expo-notifications` | Enums. `scheduleNotificationAsync` echoes the request identifier. Cancel, channel set and channel delete resolve. `getAllScheduledNotificationsAsync` resolves an empty list. Permissions answer granted | Holds no OS state. No 64-request ceiling. No delivery. No read-back of a channel or of scheduled content. No response or received listeners | `shared/__mocks__/expo-notifications.ts:2-82`; ceiling: `shared/__tests__/constants.test.ts:289-303` |
| `expo-constants` | `expoConfig.version`, settable, and a switch that makes `expoConfig` null | Any other config field | `shared/__mocks__/expo-constants.ts:7-31` |
| `expo-background-task` | Status and result enums, register, unregister, status, test trigger | The system running the task | `shared/__mocks__/expo-background-task.ts:3-16` |
| `expo-task-manager` | `defineTask`, registration queries | Task execution | `shared/__mocks__/expo-task-manager.ts:3-7` |
| `expo-in-app-updates` | "No update" answers | The Play flow | `shared/__mocks__/expo-in-app-updates.ts:8-10` |
| `react-native-performance` | Inert marks, measures and observer | Timings | `shared/__mocks__/react-native-performance.ts:4-25` |
| `@/shared/logger` | `info`, `warn`, `error`, `debug` as jest functions. `isProd` false, `isPreview` false, `isTest` true | Real log output | `shared/__mocks__/logger.ts:6-18` |
| `react-native` (unit project only) | `Platform.OS` as a plain mutable field, `Platform.select` that always answers the iOS or default branch, `AppState`, `Alert.alert` with captured buttons and a `_pressButton` helper, `Linking.openSettings` and `sendIntent`, a global `requestAnimationFrame` | No `Text`, `NativeModules`, `I18nManager`, `Dimensions` or `PixelRatio`. `Platform.select` ignores a changed `OS` | `shared/__mocks__/react-native.ts:5-45` |
| `@/widgets/PrayerWidget` | Eight widget kinds, each with `reload`, `updateSnapshot`, `updateTimeline`, `getTimeline` | Layout evaluation | `shared/__mocks__/widgets/PrayerWidget.ts:9-23` |
| `@/widgets/LockPrayerWidget` | Six widget kinds with the same four calls | Layout evaluation | `shared/__mocks__/widgets/LockPrayerWidget.ts:6-18` |

- The notification mock's identifier echo is load-bearing: production stores the resolved value as
  the record id (`shared/__mocks__/expo-notifications.ts:41-55`).
- Suites that need an OS add one in memory: a set of identifiers with replace and cancel by
  identifier (`stores/__tests__/alarmHarness.ts:76-109`,
  `stores/__tests__/notifications.test.ts:1134-1244`). What a notification carries is asserted from
  the request handed to `scheduleNotificationAsync` (`device/__tests__/notifications.test.ts:355-358`).
- In the component project the MMKV mock is wrapped so every storage can be emptied
  (`jest.components.setup.js:48-58`).

### 3.2 Component project setup (`jest.components.setup.js`)

| Module | Treatment | Source |
| --- | --- | --- |
| `jotai/vanilla` | One default store over state containers that are emptied before each test | `:8-46` |
| `expo/src/winter` | Left out | `:78-80` |
| Expo native modules | `jest-expo` generated mocks, from its setup file and not its preset | `:82-84` |
| `react-native-worklets`, Reanimated initialisers | Published mock, and an inert initialiser | `:86-89` |
| `react-native-reanimated` | Published mock with `useSharedValue` held for the component's life | `:91-113` |
| `@gorhom/bottom-sheet`, safe area, gesture handler | Published mocks | `:114-116` |
| `expo-haptics` | Real enums, calls as jest functions | `:118-129` |
| `expo-audio` | `setAudioModeAsync`, `useAudioPlayer`, `useAudioPlayerStatus` with one shared player | `:131-143` |
| Idle callbacks | `requestIdleCallback` and `cancelIdleCallback` on a flushable timer | `:145-165` |

- An `.svg` import becomes an empty drawing whose `testID` is `svg:<file name>`
  (`__tests__/svgFileTransformer.js:1-22`).
- Images, audio and fonts become their file path (`jest.config.js:94-97`).

### 3.3 Widget layouts

- The renderer suites load the real layout by relative path, capture `createWidget` from a mocked
  `expo-widgets`, and replace the `@expo/ui` component sources with marker components
  (`shared/__tests__/widgetRenderer.test.ts:118-138`, `shared/__tests__/widgetLockRenderer.test.ts:71-78`).
  Rendered strings are read from the `Text` markers (`shared/__tests__/widgetRenderer.test.ts:156-162`).
- The iOS countdown is a timer interval rendered by the system, so only its interval can be asserted
  (`shared/__tests__/widgetRenderer.test.ts:164-172`).
- `shared/__tests__/widgetRuntimeLoads.test.ts:26-45` builds the real runtime bundle for each
  platform and evaluates it. It renders nothing.
- Nothing under Jest measures text width, truncation, font fallback or glyph coverage.

### 3.4 Hook and alarm fakes

- `hooks/__tests__/hookHarness.ts:97-172`: a modelled React for hook tests, wired with
  `jest.mock('react', ...)` (`hooks/__tests__/hookHarness.ts:11`). Concurrent rendering and
  StrictMode are not modelled (`hooks/__tests__/hookHarness.ts:8-9`). Six test files use it.
- `hooks/__tests__/reanimatedFake.ts:26-63`: Reanimated builders that return a description of the
  call. Four test files use it.

### 3.5 Locale and internationalisation

- `expo-localization` is not a dependency (`package.json:32-76`). No tracked `ts`, `tsx`, `js` or
  `json` file outside `ai/` and `.agents/` mentions `expo-localization`, `getLocales` or
  `I18nManager`. No mock of the device locale exists.
- Jest's `Intl` supports the `islamic-umalqura` calendar. A failing `Intl` is simulated by spying on
  `Intl.DateTimeFormat` (`shared/__tests__/ramadanSeasonIntl.test.ts:5-6`, `:47-72`).
- Jest loads React Native as iOS (`jest.config.js:61`, `__tests__/README.md:118`).

### 3.6 Mocks declared per suite

| Module | Why | Example |
| --- | --- | --- |
| `@/api/client` | Sync downloads a year over the network | `__tests__/app/index.test.tsx:40-45` |
| `@/stores/sync`, `@/stores/widget` | A reschedule also syncs and pushes widgets | `stores/__tests__/notifications.test.ts:74-83` |
| `@/stores/database` | Hook suites feed days through `getPrayerByDateString` | `hooks/__tests__/usePrayer.test.ts:20` |
| `expo-router`, `expo-splash-screen` | The route tree and the native splash | `__tests__/app/_layout.test.tsx:12-23` |
| `@/shared/whatsNew` | Release notes change every release | `__tests__/app/index.test.tsx:73-82`, `components/sheets/screens/__tests__/Settings.test.tsx:41-48` |
| `@/device/qibla` | The qibla sheet reaches the platform on present | `components/sheets/screens/__tests__/Settings.test.tsx:30-37` |
| `@/shared/constants` | A changed prayer list for a migration guard | `stores/__tests__/notificationMigrationGuards.test.ts:24-35`, `:70-72` |

A shared mock's answer is changed with `mockReturnValueOnce` or `mockImplementationOnce`, because
`clearMocks` resets counts and not return values (`__tests__/README.md:201-204`).

## 4. Harness and style patterns

| Pattern | Best example to copy | Notes |
| --- | --- | --- |
| Component suite shape | `components/prayer/__tests__/Alert.test.tsx:1-36` | Named as the reference at `__tests__/README.md:3-4`. Doc comment, import order, `describe` with the date and time, one behaviour per `it`, three blocks |
| Rules for a suite | `__tests__/README.md:45-88` | Never "should". `await` every `render`, `fireEvent` and `act` |
| What not to assert | `__tests__/README.md:36-43` | No snapshots, style values, internals or animation looks |
| Inputs that can fail | `__tests__/README.md:90-99` | Never test at a starting value such as index 0 |
| London day seed for rendering | `__tests__/harness.ts:28-37` | 10 to 12 September 2026, real days through the real database. The 11th is a Friday |
| London day fixture and helpers | `hooks/__tests__/londonDays.ts:14-76` | `saveLondonDays`, `storeLondonDays`, `london`, `sequenceFrom`, `statusOf`, `listStatuses`, and `Breakage` for unreadable or missing days |
| Alarm harness with an in-memory OS | `stores/__tests__/alarmHarness.ts:52-156` | `londonDays`, `sameTimesOn`, `storeDays`, `resetAlarms`, `enable`, `triggers`, `cancelCalls`, `osIdentifiers`, `forgetCalls`, `minutesBefore` |
| Wiring the alarm harness | `stores/__tests__/notificationsClockChange.test.ts:8-30` | The file must mock `@/stores/sync` and `@/stores/widget` and run on fake timers (`stores/__tests__/alarmHarness.ts:5-6`) |
| Identifier to instant map | `stores/__tests__/notificationsClockChange.test.ts:45-55` | `expect(triggers()).toEqual({...})` with exact identifiers and ISO instants |
| Schedule before cancel ordering | `stores/__tests__/notifications.test.ts:1198-1210`, `:1303-1321` | `invocationCallOrder` helpers |
| Platform switch, component project | `__tests__/harness.ts:47-56` | `onPlatform('android', 29)` |
| Platform read at module load | `__tests__/README.md:118-163`, `__tests__/harness.test.tsx:98-135` | Switch inside `jest.isolateModules` |
| Platform switch, unit project | `shared/__tests__/notifications.test.ts:360-368` | Assign `Platform.OS` and restore it in `afterEach` |
| Fresh module per test | `shared/__tests__/notificationsInit.test.ts:20-35`, `__tests__/app/_layout.test.tsx:46-62` | For once-per-process flags and load-time set-up |
| Preferences in a component suite | `components/prayer/__tests__/Prayer.test.tsx:34-35` | Through the store setter, or `getDefaultStore().set(atom, value)` with a comment naming the component. Never a storage key (`__tests__/README.md:113-116`) |
| Storage keys in a unit suite | `stores/__tests__/notifications.test.ts:223-237` | Keys are written and read directly where the key is the contract |
| Install, update and relaunch | `__tests__/app/index.test.tsx:130-151` | `mockExpoConfig.version`, `setStoredVersion`, the cache schema stamp |
| Fresh install | `__tests__/app/indexFreshInstall.test.tsx:1-62` | In a file of its own |
| Positive control beside a negative assertion | `stores/__tests__/version.test.ts:611-639` | Same mocks, config present |
| Independent oracle | `shared/__tests__/notifications.test.ts:40-45` | `date-fns-tz`, not the app's own helper |
| Source text guard | `stores/__tests__/database.test.ts:500-579` | Reads source files and asserts on call sites and lists |
| Surface closure | `shared/__tests__/audioMatrix.test.ts:62-113` | Derives a set from code and compares it with files on disk and `app.json` |
| AST contract | `shared/__tests__/widgetContract.test.ts:94-144` | Babel parse and traverse over the layout files |
| Table tests | `components/prayer/__tests__/Alert.test.tsx:77-89` | `it.each` with a comment naming the columns |
| Queries | `__tests__/README.md:165-182` | Role, then text, then label, then `svg:` test id |
| Switch inside a settings row | `components/sheets/screens/__tests__/Settings.test.tsx:74-79` | Found inside the row that holds its label |
| Hook suite | `hooks/__tests__/hookHarness.ts:105-172` | `mountHook(hook, props)` |
| Logic suite skeleton | `shared/__tests__/_template.example.ts:1-65` | Older template with section comments |

Before a test is trusted (`__tests__/README.md:231-245`): red before green, never edit a test to
make it pass, coverage through `yarn validate`, no coverage ignore comments, and an unreachable line
is deleted or tested with the input a future edit would bring.

## 5. Pinned-byte tests that a 2.0.0 change must not break

### 5.1 OS notification identifiers

| Test | Pinned |
| --- | --- |
| `device/__tests__/notifications.test.ts:40-44` | `athan_standard_fajr_2026-08-28` from schedule type, English name and date |
| `device/__tests__/notifications.test.ts:46-50` | `athan_extra_last third_2026-08-28`: lowercased, the space kept |
| `device/__tests__/notifications.test.ts:52-56` | `Magrib` and `magrib` give one identifier |
| `device/__tests__/notifications.test.ts:66-70` | `reminder_extra_duha_2026-08-29_20`, interval last |
| `device/__tests__/notifications.test.ts:88-115` | The stored record id equals the deterministic identifier |
| `device/__tests__/notifications.test.ts:346-359`, `:377-390` | `athan_extra_midnight_2026-10-24` and `reminder_extra_midnight_2026-10-24_15`, keyed by list day, with exact trigger instants |
| `__tests__/app/index.test.tsx:87`, `:414-417`, `:488-490` | `athan_standard_asr_2026-09-11` armed at launch |
| `stores/__tests__/notificationsClockChange.test.ts:45-55`, `:74-78`, `:91-94`, `:100`, `:106-109`, `:122-125`, `:143-152` | Identifier to instant maps across both 2026 clock changes, `last third` identifiers included |
| `stores/__tests__/notificationsAroundMidnight.test.ts:173-288` | Standard and Extras identifiers near 00:00 |
| `stores/__tests__/notificationsMidnightWindow.test.ts:53-75` | Midnight and Fajr identifiers on 18 October 2026 |
| `stores/__tests__/notificationsOctober18Midnight.test.ts:42-81` | Midnight at-time and reminder identifiers |
| `stores/__tests__/notificationsFridayIstijaba.test.ts:66-67` | `athan_extra_istijaba_2026-06-26` and its reminder |
| `device/__tests__/notificationNativeTimeout.test.ts:45-46`, `device/__tests__/reminderCancelFailure.test.ts:23-25`, `shared/__tests__/notificationNativeTimeout.test.ts:22-23` | Literal identifiers used as fixtures |
| `stores/__tests__/notifications.test.ts:2329` | Every armed identifier ends in the list date, with an optional interval suffix |
| `shared/__tests__/notifications.test.ts:124-125`, `:187-188` | Plan keys `standard_Fajr` and `extra_Fajr`: schedule type and English name |

Suites that build identifiers through `prayerNotificationIdentifier` and
`reminderNotificationIdentifier` with English names follow those two functions
(`stores/__tests__/notifications.test.ts:1143-1145`, `:1966-1969`).

### 5.2 Android channel ids, channel names and channel settings

| Test | Pinned |
| --- | --- |
| `shared/__tests__/notifications.test.ts:370-389` | Channel `athan_1_v4`, name `Athan 1`, sound `athan1.mp3`, importance HIGH, vibration pattern, `bypassDnd`, alarm audio attributes |
| `shared/__tests__/notifications.test.ts:397-402` | `athan_1_v4` and `athan_32_v4` |
| `shared/__tests__/notifications.test.ts:404-413` | `reminder_fajr_5_v3`, `reminder_istijaba_30_v3`, `reminder_last_third_15_v3` |
| `shared/__tests__/notifications.test.ts:415-429` | The five daily prayers route to the athan channel. Sunrise and all Extras route to the extras channel, selected by English name |
| `shared/__tests__/notifications.test.ts:489-506` | Extras channel name `Extra Times` and its settings |
| `shared/__tests__/notifications.test.ts:525-552` | `athan_5_v4` named `Athan 5`, created once per id |
| `shared/__tests__/notifications.test.ts:571-601` | The 231 legacy ids deleted, and that no current id is among them |
| `shared/__tests__/notifications.test.ts:706-741` | `reminder_fajr_15_v3` named `Fajr in 15m Reminder` with `reminder_fajr_15.mp3`, created once |
| `shared/__tests__/notificationsInit.test.ts:37-60`, `:104-134`, `:136-154` | The legacy id list by slug, and `athan_1_v4` plus `extras_at_time_v3` existing before the first refresh |
| `device/__tests__/androidChannelUpdate.test.ts:30-46` | The exact channel object for five sound indices, name included |
| `device/__tests__/androidChannelUpdate.test.ts:49-56` | The selection path and the schedule path ask for an identical channel |
| `device/__tests__/notifications.test.ts:151-268`, `:281-328` | Which channel id a trigger carries, and none for Silent or on iOS |
| `device/__tests__/notificationNativeTimeout.test.ts:158` | An error message that names `athan_1_v4` |
| `shared/__tests__/audioMatrix.test.ts:134-142` | Every reminder channel id is a legal Android resource name |

A channel's sound, attributes and importance are frozen at creation, so two creators of one id must
agree exactly (`device/__tests__/androidChannelUpdate.test.ts:4-6`). Channel creation is deduplicated
per process and per id (`shared/__tests__/notifications.test.ts:455`, `:547-552`).

### 5.3 Notification content

| Test | Pinned |
| --- | --- |
| `shared/__tests__/notifications.test.ts:294-298` | Title `Fajr now`, no body. The Arabic name is passed and unused |
| `shared/__tests__/notifications.test.ts:305-311` | Title `Sunrise now` with the extras sound |
| `shared/__tests__/notifications.test.ts:663-672` | Reminder titles `Fajr in 15m`, `Dhuhr in 5m`, `Asr in 30m`, no body |
| `shared/__tests__/notifications.test.ts:684-687` | Reminder `autoDismiss` true |
| `device/__tests__/notifications.test.ts:397-427` | Alarm-clock delivery class for at-time and reminder triggers |
| `shared/__tests__/nativeConfig.test.ts:40-47` | The iOS time-sensitive entitlement |

### 5.4 Audio file names

| Test | Pinned |
| --- | --- |
| `shared/__tests__/audioMatrix.test.ts:98-103` | 99 files: 32 athans, 11 prayers by 6 intervals, one extras sound |
| `shared/__tests__/audioMatrix.test.ts:62-72` | Names derived from `PRAYERS_ENGLISH`, `EXTRAS_ENGLISH`, `REMINDER_INTERVALS` and the app's own `prayerNameSlug` |
| `shared/__tests__/audioMatrix.test.ts:105-113` | `assets/audio` and `app.json` `sounds[]` hold exactly that set |
| `shared/__tests__/audioMatrix.test.ts:115-125` | Android `res/raw` and the iOS bundle hold exactly that set when a prebuild is present |
| `shared/__tests__/audioMatrix.test.ts:127-132` | Every file name is a legal Android resource name |
| `shared/__tests__/audioMatrix.test.ts:156-176` | Every reminder file decodes to at least one second and is at least 4096 bytes |
| `shared/__tests__/notifications.test.ts:266-286` | `athan1.mp3` to `athan32.mp3` by sound index, the fixed extras sound, case-insensitive name match |
| `shared/__tests__/notifications.test.ts:652-659` | `reminder_fajr_5.mp3`, `reminder_isha_30.mp3`, `reminder_last_third_15.mp3` |
| `shared/__tests__/athanDurations.test.ts` | Athan durations against the iOS sound limit (header read only) |

### 5.5 Storage keys and stored values

| Test | Pinned |
| --- | --- |
| `shared/__tests__/types.test.ts:16-30` | `AlertType` is stored as 0, 1, 2 for Off, Silent, Sound, and has three members |
| `shared/__tests__/types.test.ts:36-41` | `ScheduleType` strings `standard` and `extra`, which appear inside key names |
| `stores/__tests__/notifications.test.ts:194-200` | `preference_alert_standard_fajr` holds the string `2` |
| `stores/__tests__/notifications.test.ts:223-256` | Index keys such as `preference_alert_standard_0` move to name keys and are removed. A name key wins over an index key. A second run changes nothing |
| `stores/__tests__/notifications.test.ts:263-288` | A migrated value is visible through its atom at once, and a non-numeric value is copied verbatim |
| `stores/__tests__/notifications.test.ts:295-345` | Extras index keys written before 1.0.27 map against the older four-name list. The key `preference_alert_extra_last third` keeps its space |
| `stores/__tests__/notifications.test.ts:350-433` | One alert, reminder and interval key per English name on each list |
| `stores/__tests__/notifications.test.ts:1995-2001`, `:2087-2089` | Saved preference keys and values are unchanged by a reschedule |
| `stores/__tests__/notificationPreferenceSetters.test.ts:99-112`, `:133` | `preference_reminder_alert_<type>_<lowercased English name>` |
| `stores/__tests__/notificationPreferenceSetters.test.ts:142-150` | `preference_reminder_interval_<type>_<name>` holds `25` |
| `stores/__tests__/notificationPreferenceSetters.test.ts:166-176` | `preference_sound` holds the sound index as a string |
| `stores/__tests__/notificationMigrationGuards.test.ts:74-88` | A name missing from the list is dropped and every other setting lands |
| `stores/__tests__/storage.test.ts:136-140`, `:202-206`, `:268-272` | A number is stored as its string, a boolean as a boolean, a string as itself |
| `stores/__tests__/storage.test.ts:110-134` | A corrupt number reads as the default and a stored `0` reads as 0 |
| `stores/__tests__/database.test.ts:77-99` | `setItem` writes JSON text. A number round-trips as a number |
| `stores/__tests__/database.test.ts:230-247`, `:284-298` | `prayer_<date>` records and `fetched_years` |
| `stores/__tests__/database.test.ts:327-347`, `:411-431` | Record keys `scheduled_notifications_<type>_<index>_<id>` and `scheduled_reminders_<type>_<index>_<id>` |
| `stores/__tests__/database.test.ts:315-322`, `:399-406` | A stored record holds `id`, `date`, `time`, `englishName`, `arabicName`, `alertType` |
| `stores/__tests__/database.test.ts:533-549` | The upgrade keep-list holds `preference_`, `app_installed_version`, `prayer_max_english_width_`, and the error screen calls `clearUpgradeCache()` |
| `stores/__tests__/database.test.ts:558-578` | The upgrade keep-list has five entries. The refresh keep-list is those plus the two record prefixes |
| `stores/__tests__/database.test.ts:632-656` | MMKV id `athan-storage` in prod and preview, another id elsewhere |
| `stores/__tests__/version.test.ts:365-375` | The upgrade keep-list as an exact array |
| `stores/__tests__/version.test.ts:184-191`, `:218-222`, `:239-246`, `:269-273`, `:734-740` | Keys `app_installed_version`, `whats_new_shown_version`, `cache_schema_version` |
| `stores/__tests__/version.test.ts:400-418`, `:75` | Gate key `preference_last_notification_schedule_check`, reset through its atom |
| `stores/__tests__/version.test.ts:566-609` | An update with an unchanged cache schema clears nothing. A changed schema clears. The schema version is stamped |
| `stores/__tests__/versionFailures.test.ts:44`, `:107`, `:138-139` | The same keys on the failure paths |
| `stores/__tests__/sync.test.ts:444-450`, `:492`, `:1085` | The refresh keep-list and the gate key |
| `stores/__tests__/syncFetchBeforeWipe.test.ts:98-120` | A full record key, `scheduled_notifications_standard_0_athan_standard_fajr_2026-09-15`, and the keys a refresh keeps |
| `stores/__tests__/coldLaunchRearm.test.ts:20`, `stores/__tests__/notificationGateReopenFailure.test.ts:41` | The gate key |
| `__tests__/app/index.test.tsx:148-151` | `cache_schema_version` written before each launch |

The upgrade wipe drops the record prefixes, because an upgrade can change the identifier scheme
(`stores/__tests__/database.test.ts:575-577`). After that wipe the sweep must not cancel what the OS
holds: `stores/__tests__/notifications.test.ts:1432-1454`, `:1512-1534`, `:1584-1599`.

### 5.6 Prayer names and lists

| Test | Pinned |
| --- | --- |
| `shared/__tests__/constants.test.ts:79-85` | `PRAYERS_ENGLISH` and `EXTRAS_ENGLISH` as exact arrays in order |
| `shared/__tests__/constants.test.ts:31-56` | `NIGHT_PRAYER_NAMES` equals the first three Extras |
| `shared/__tests__/constants.test.ts:63-77` | The Arabic arrays and both explanation arrays match the English lengths |
| `stores/__tests__/notifications.test.ts:98-170` | `getPrayerArrays` returns the constants by identity, with exact Arabic strings at the first and last index |
| `stores/__tests__/notifications.test.ts:515-571` | `canonicalPrayerIndex` resolves a row by English name |
| `shared/__tests__/text.test.ts:20-55` | `toArabicNumbers` converts Latin digits to Arabic-Indic digits |

### 5.7 Widget props and layouts

| Test | Pinned |
| --- | --- |
| `shared/__tests__/widgetSnapshot.test.ts:169-174` | Android snapshot `v` is 1 and `schedule` is `standard` |
| `shared/__tests__/widgetSnapshot.test.ts:87-101` | Each row carries the English name, the time string and the epoch |
| `shared/__tests__/widgetSnapshot.test.ts:138-146` | `dateLabel` equals `formatDateLong` or `formatHijriDateLong` of the day |
| `shared/__tests__/widgetTimeline.test.ts:235-238`, `:1080` | Every timeline entry carries `WIDGET_PROPS_VERSION` |
| `shared/__tests__/widgetContract.test.ts:36-49`, `:94-144` | A widget function references only its own params and locals, `@expo/ui` imports, and eleven JS globals |
| `shared/__tests__/widgetContract.test.ts:175-296` | Every colour literal in both layouts is on an allow list |
| `shared/__tests__/widgetContract.test.ts:302-333` | No aliased `@expo/ui` import |
| `shared/__tests__/widgetContract.test.ts:335-372` | No dynamic `import()`. `stores/widget.ts` requires both layout modules and reaches all eight home kinds |
| `shared/__tests__/widgetContract.test.ts:378-398` | One `widget` directive function in the home module and three in the lock module |
| `shared/__tests__/widgetRuntimeLoads.test.ts:47-62` | The runtime bundle evaluates on both platforms |
| `shared/__tests__/widgetRuntimeLoads.test.ts:64-72` | `@expo/ui` and `expo-widgets` are pinned to exact versions |
| `shared/__tests__/nativeConfig.test.ts:49-60` | Every widget in the plugin config nests `supportedFamilies` under `ios` |

`Intl` is not among the allowed globals in a widget function (`shared/__tests__/widgetContract.test.ts:37-49`).

### 5.8 Version lockstep and task name

| Test | Pinned |
| --- | --- |
| `shared/__tests__/versionLockstep.test.ts:51-56` | `app.json` holds a `x.y.z` version string |
| `shared/__tests__/versionLockstep.test.ts:58-60` | `package.json` and `app.json` hold the same version |
| `shared/__tests__/versionLockstep.test.ts:62-75` | `android/app/build.gradle` `versionName` matches when the file exists. When it is absent the test asserts `/android` is ignored |
| `stores/__tests__/notifications.test.ts:1086-1088` | Background task name `NOTIFICATION_REFRESH_TASK` |

### 5.9 Tests bound to today's visible English and Arabic text

These pin copy, not bytes on a user's phone. They change with any change of displayed language.

- Forty-three test files query by text, role name or label, on 399 lines in total.
- Bilingual row: `components/prayer/__tests__/Prayer.test.tsx:23-41` expects the English and the
  Arabic name, and the Arabic name gone when `showArabicNamesAtom` is false.
- Settings toggle `Show arabic names`: `components/sheets/screens/__tests__/Settings.test.tsx:59-65`,
  `:256-267`. Default true: `stores/__tests__/ui.test.ts:114`.
- Alert sheet state carries `prayerEnglish` and `prayerArabic`:
  `components/prayer/__tests__/Alert.test.tsx:46-52`,
  `components/sheets/screens/__tests__/Alert.test.tsx:74`, `:348`.
- Screen reader labels built from the English name: `Fajr notification: sound`
  (`components/prayer/__tests__/Alert.test.tsx:35`), `Isha notification: off`
  (`__tests__/app/Navigation.test.tsx:37`).
- Date and elapsed-time copy: `Fri, 11 Sep 2026` and `Dhuhr 58m ago`
  (`__tests__/app/Screen.test.tsx:24-26`).
- Sheet and modal copy: `Set your preferences`, `Select Athan`, `Close to save`,
  `Something went wrong.` (`__tests__/app/_layout.test.tsx:147-156`), `What's New`
  (`__tests__/app/index.test.tsx:165`), `London, UK` (`__tests__/app/Navigation.test.tsx:28`).
- Thirty-eight test files hold the word "arabic" or an Arabic string. The heaviest are
  `shared/__tests__/widgetTimeline.test.ts`, `stores/__tests__/notificationAlertCommit.test.ts`,
  `device/__tests__/notifications.test.ts`, `stores/__tests__/notifications.test.ts` and
  `shared/__tests__/prayer.test.ts`.

## 6. End-to-end flows

All flows target `com.mugtaba.athan` with tag `baseline`. Tap points are OnePlus 3T pixels
(`e2e/README.md:11-12`). Maestro does not drive a physical iPhone (`e2e/README.md:156-159`).

| Flow | Drives | Selects or asserts by text |
| --- | --- | --- |
| `e2e/flows/smoke.yaml` | Launch | Waits for `London, UK` (`:7-9`) |
| `e2e/flows/overlay-x10.yaml` | Overlay open and close ten times by coordinates (`:9-19`) | Asserts `London, UK` (`:20`) |
| `e2e/flows/sheets-x10.yaml` | Settings sheet ten times, then the alert bell on the Dhuhr row ten times, each closed with BACK (`:9-28`) | Asserts `London, UK` (`:29`) |
| `e2e/flows/sounds-x5.yaml` | Settings, then the athan row, select and preview five times (`:11-36`) | Asserts `London, UK` (`:37`). A comment names the `Change athan` row (`:6`) |
| `e2e/flows/swipes-x15.yaml` | Pager swipes fifteen times (`:8-24`) | Waits for the prayer names `Midnight` (`:15-17`) and `Fajr` (`:22-24`) |
| `e2e/flows/toggles-x10.yaml` | The `Show seconds` toggle on and off ten times by coordinates (`:8-22`) | Asserts `London, UK` (`:24`) |

Scripts under `e2e/scripts/`:

| Script | One line |
| --- | --- |
| `device-checks.sh` (read in full) | Reports build identity, permissions, notification channels and armed alarms on a phone, and fails on a missing channel, nothing armed or a trigger that is not a prayer time (`:1-21`) |
| `device_checks.py` | Parses `dumpsys alarm` for one package (`:1-6`) |
| `baseline-compare.sh` | Runs a Maestro flow while streaming perf marks and diffs medians against a baseline (`:2-6`) |
| `frame-audit.sh` | Records one animation and extracts per-frame timestamps (`:2-6`) |
| `idle-cpu.sh` | Cold-launches the build and samples per-thread CPU for 60 seconds (`:2-6`) |
| `idle_cpu.py` | Computes per-thread CPU from the samples (`:1-5`) |

`device-checks.sh` selects nothing by visible text. It matches channel ids by pattern, for any
generation suffix: the extras channel and an athan channel (`e2e/scripts/device-checks.sh:154-164`),
and fails when a prayer channel has no sound (`:164-172`). It compares the installed version with
`app.json` (`:59-78`).

From `e2e/README.md`:

- Alarm times mean something only on a production build. A local build serves mock data whose
  prayers sit either side of launch (`:25-26`, `:88-104`).
- What's New appears on the first launch after any upgrade and marks itself shown at once
  (`:131-133`).
- Changing any `EXPO_PUBLIC_*` value needs the Metro cache cleared and the generated bundle deleted
  (`:74-87`).
- Maestro's `hierarchy` reads the live tree. An accessibility dump on Android 9 is stale
  (`:113-117`).

## 7. Mutation testing

No mutation tool is configured in tracked files. `package.json:77-102` lists no such dependency and
no config file for one is tracked. A mutation pass is a written process rule
(`ai/AGENTS.md:79-80`, `.agents/skills/athan-executor/SKILL.md:47`) and is done by hand as "red
before green": break the guarded line, watch the test fail, restore the file
(`__tests__/README.md:233-234`). Two test comments record earlier hand sweeps
(`shared/__tests__/nightTimes.test.ts:751`, `stores/__tests__/schedule.test.ts:2372`).

## 8. Test file census

189 test files: 147 in the `unit` project and 42 in the `components` project. The one-line statement
comes from each file's own header and first `describe` names, unless the file is listed as read in
full in section 9.

| File | Lines | Covers |
| --- | --- | --- |
| `__tests__/app/Navigation.test.tsx` | 97 | The two prayer pages in one pager and what a settled swipe does to an open overlay |
| `__tests__/app/Screen.test.tsx` | 60 | What a prayer page shows on the first frame and what the Extras page holds back |
| `__tests__/app/_layout.test.tsx` | 166 | What the root layout sets up as it loads, the sheets it mounts and the error screen |
| `__tests__/app/index.test.tsx` | 619 | The launch screen: splash, loading and failure, What's New, update prompt, alert arming after sync |
| `__tests__/app/indexFreshInstall.test.tsx` | 62 | The launch screen on a fresh install |
| `__tests__/harness.test.tsx` | 207 | The component harness itself |
| `api/__tests__/client.test.ts` | 927 | `fetchYear` and `fetchDay`, validation and day shapes |
| `api/__tests__/clientProductionBuild.test.ts` | 111 | Which builds ask the real endpoint |
| `components/countdown/__tests__/Bar.test.tsx` | 145 | What a screen reader hears of the countdown bar and when it hides |
| `components/countdown/__tests__/Countdown.test.tsx` | 113 | The prayer the countdown names and the time it shows |
| `components/countdown/__tests__/tipGeometry.test.ts` | 57 | The bar tip stays inside its track |
| `components/day/__tests__/Day.test.ts` | 137 | The Day header |
| `components/day/__tests__/shownDate.test.ts` | 189 | The date printed on the header |
| `components/modals/__tests__/Help.test.tsx` | 227 | The Help questions per platform and the settings screens its buttons open |
| `components/modals/__tests__/Modal.test.tsx` | 124 | The modal card and Android's back button |
| `components/modals/__tests__/Update.test.tsx` | 78 | The update prompt and its buttons |
| `components/modals/__tests__/WhatsNew.test.tsx` | 111 | The What's New modal items and platform notes |
| `components/overlay/__tests__/Overlay.test.tsx` | 215 | The overlay input layer, the Extras explanation and the close fade |
| `components/overlay/__tests__/VeilBackdrop.test.tsx` | 34 | The veil behind the overlay |
| `components/overlay/__tests__/catcherGeometry.test.ts` | 79 | `buildCatcherRegions` |
| `components/overlay/__tests__/overlayContent.test.ts` | 181 | `getOverlayRow` and `getOverlayExplanation` |
| `components/overlay/__tests__/overlayPlacement.test.ts` | 228 | Where the Extras card sits |
| `components/prayer/__tests__/ActiveBackground.test.ts` | 147 | The pill geometry |
| `components/prayer/__tests__/ActiveBackground.test.tsx` | 69 | When the pill shows and its Android shadow |
| `components/prayer/__tests__/Ago.test.tsx` | 52 | The "ago" badge words and fade |
| `components/prayer/__tests__/Alert.test.tsx` | 149 | The bell on a row: its label and what a press does |
| `components/prayer/__tests__/Explanation.test.tsx` | 77 | The Extras explanation box: words, Arabic digits, arrow side |
| `components/prayer/__tests__/List.test.tsx` | 163 | Which rows a list draws, in what order |
| `components/prayer/__tests__/Prayer.test.ts` | 156 | A tap on the row |
| `components/prayer/__tests__/Prayer.test.tsx` | 128 | A row's English and Arabic names, taps and hiding under the overlay |
| `components/prayer/__tests__/Time.test.tsx` | 92 | The time on a row, and dashes when unreadable |
| `components/prayer/__tests__/activePill.test.ts` | 211 | The active pill across three days and with the overlay |
| `components/prayer/__tests__/rowPress.test.ts` | 148 | What a tap on each row does |
| `components/sheets/parts/__tests__/Header.test.tsx` | 19 | A sheet header |
| `components/sheets/parts/__tests__/LabeledToggle.test.tsx` | 62 | A settings row with a switch |
| `components/sheets/parts/__tests__/SegmentedControl.test.tsx` | 136 | The segmented controls on the alert sheet |
| `components/sheets/parts/__tests__/Shared.test.tsx` | 37 | The surface and backdrop of a sheet |
| `components/sheets/parts/__tests__/Sheet.test.tsx` | 297 | The bottom sheet every sheet is built on |
| `components/sheets/parts/__tests__/SoundItem.test.tsx` | 170 | One row of the athan list |
| `components/sheets/parts/__tests__/Stepper.test.tsx` | 138 | The reminder interval stepper |
| `components/sheets/parts/__tests__/Toggle.test.tsx` | 95 | The reminder switch |
| `components/sheets/parts/__tests__/reminderStep.test.ts` | 122 | `stepReminderInterval` |
| `components/sheets/screens/__tests__/Alert.test.tsx` | 497 | The alert sheet draft and what closing saves |
| `components/sheets/screens/__tests__/ColorPicker.test.tsx` | 132 | The countdown bar colour row |
| `components/sheets/screens/__tests__/Qibla.test.tsx` | 2228 | The qibla sheet |
| `components/sheets/screens/__tests__/Settings.test.tsx` | 300 | The settings sheet buttons and display toggles |
| `components/sheets/screens/__tests__/Sound.test.tsx` | 337 | The athan sheet rows, preview and highlight |
| `components/sheets/screens/__tests__/alertDraft.test.ts` | 90 | The alert sheet draft rules |
| `components/sheets/screens/__tests__/soundSheet.test.ts` | 183 | The athan sheet selection rules |
| `components/ui/__tests__/BackgroundGradients.test.tsx` | 19 | The background gradient |
| `components/ui/__tests__/Error.test.tsx` | 39 | The error screen and Refresh |
| `components/ui/__tests__/Glow.test.tsx` | 45 | The radial glow size |
| `components/ui/__tests__/Icon.test.tsx` | 56 | The icon size, colour and animation |
| `components/ui/__tests__/InitialWidthMeasurement.test.tsx` | 28 | The hidden texts that measure each list's longest name |
| `components/ui/__tests__/Masjid.test.tsx` | 60 | The mosque icon in and out of season |
| `components/ui/__tests__/RamadanDecorations.test.tsx` | 183 | The Ramadan decorations |
| `components/ui/__tests__/SettingsButton.test.tsx` | 73 | The settings button |
| `device/__tests__/androidChannelUpdate.test.ts` | 91 | `updateAndroidChannel` and the DND settings intent |
| `device/__tests__/backgroundTaskDebug.test.ts` | 179 | Background task diagnostics |
| `device/__tests__/inAppUpdatesContract.test.ts` | 34 | The shape of `expo-in-app-updates` |
| `device/__tests__/listeners.test.ts` | 300 | `initializeListeners` |
| `device/__tests__/notificationNativeTimeout.test.ts` | 183 | A notification call that never answers |
| `device/__tests__/notifications.test.ts` | 427 | Deterministic identifiers, channel wiring, trigger instants, delivery class |
| `device/__tests__/notificationsClockChange.test.ts` | 60 | Reminder triggers across a clock change |
| `device/__tests__/qibla.test.ts` | 233 | The one file that touches `expo-location` |
| `device/__tests__/reminderCancelFailure.test.ts` | 78 | A reminder cancel that fails |
| `device/__tests__/tasks.test.ts` | 83 | The background task body |
| `device/__tests__/tls13.test.ts` | 81 | The TLS 1.3 status read at load |
| `device/__tests__/updates.test.ts` | 536 | `checkForUpdates` on both platforms |
| `hooks/__tests__/imperativeAnimations.test.ts` | 97 | The imperative animation hooks |
| `hooks/__tests__/notificationForegroundHandler.test.ts` | 33 | Foreground notification presentation |
| `hooks/__tests__/notificationSettingsFallback.test.ts` | 249 | The permission fallbacks |
| `hooks/__tests__/useAlertAnimations.test.ts` | 23 | `useAlertAnimations` |
| `hooks/__tests__/useAlertSwapBounce.test.ts` | 99 | `useAlertSwapBounce` |
| `hooks/__tests__/useChromeDeferred.test.ts` | 83 | `useChromeDeferred` |
| `hooks/__tests__/useCountdown.test.ts` | 78 | `useCountdown` |
| `hooks/__tests__/useCountdownBar.test.ts` | 110 | `useCountdownBar` |
| `hooks/__tests__/useDerivedProgress.test.ts` | 212 | The derived transitions |
| `hooks/__tests__/useNotification.test.ts` | 521 | `useNotification`: settings dialog, permissions, commits |
| `hooks/__tests__/usePrayer.test.ts` | 305 | The occurrence a row shows and its bell |
| `hooks/__tests__/usePrayerAgo.test.ts` | 268 | The "now" and "ago" display |
| `hooks/__tests__/usePrayerSequence.test.ts` | 467 | Row statuses and the next prayer index |
| `hooks/__tests__/usePrevious.test.ts` | 39 | `usePrevious` |
| `hooks/__tests__/useSchedule.test.ts` | 366 | `computeScheduleView` and cascade rows |
| `hooks/__tests__/useWindowDimensions.test.ts` | 24 | `useWindowDimensions` |
| `mocks/__tests__/simple.test.ts` | 60 | The mock feed a local build serves |
| `modules/qiblaheading/__tests__/index.test.ts` | 313 | The JS binding of the heading module |
| `modules/widgetrefresh/__tests__/index.test.ts` | 32 | The JS binding of the refresh chain |
| `plugins/__tests__/replacePreviousNotification.test.ts` | 192 | The prebuild plugin that posts Android notifications under one tag |
| `shared/__tests__/androidWidgetGrid.test.ts` | 64 | The widget grid plugin |
| `shared/__tests__/athanDurations.test.ts` | 180 | Athan durations against the iOS sound limit |
| `shared/__tests__/audioMatrix.test.ts` | 177 | The audio file set across every surface |
| `shared/__tests__/candidateHorizon.test.ts` | 66 | The candidate walk horizon |
| `shared/__tests__/clockChangeReadings.test.ts` | 68 | Clock readings that a clock change skips or repeats |
| `shared/__tests__/config.test.ts` | 160 | `shared/config.ts` |
| `shared/__tests__/configBuildSwitches.test.ts` | 66 | The remaining config switches |
| `shared/__tests__/constants.test.ts` | 385 | Prayer name arrays, reminder constants, the request budget |
| `shared/__tests__/expoLocationPatch.test.ts` | 159 | The guard on the `expo-location` package state |
| `shared/__tests__/extrasListsAtMidnight.test.ts` | 92 | Extras lists whose Midnight falls on 00:00 |
| `shared/__tests__/fajrNearMidnight.test.ts` | 64 | A Fajr just after 00:00 |
| `shared/__tests__/flagDefaults.test.ts` | 99 | The flag state every suite inherits |
| `shared/__tests__/flags.test.ts` | 264 | `shared/flags.ts` and its config mirror |
| `shared/__tests__/help.test.ts` | 170 | Which Help questions each platform answers |
| `shared/__tests__/identifierScan.test.ts` | 332 | The identifier gate's shapes |
| `shared/__tests__/istijabaFridayList.test.ts` | 75 | Istijaba when Magrib falls after 00:00 |
| `shared/__tests__/lastThirdAroundMidnight.test.ts` | 72 | A Last Third around 00:00 |
| `shared/__tests__/launchGate.test.ts` | 96 | The two launch splash paths |
| `shared/__tests__/logger.test.ts` | 209 | `shared/logger.ts` |
| `shared/__tests__/loggerDependency.test.ts` | 100 | The logger's packages in `package.json` |
| `shared/__tests__/loggerTestGate.test.ts` | 59 | The logging gate in a test run |
| `shared/__tests__/nativeConfig.test.ts` | 60 | The iOS entitlement and the widget plugin config |
| `shared/__tests__/nightTimes.test.ts` | 816 | The Extras night times |
| `shared/__tests__/notificationNativeTimeout.test.ts` | 121 | `withNativeTimeout` and start-up when a channel never answers |
| `shared/__tests__/notifications.test.ts` | 811 | Schedule plan, sounds, content, channels, stale identifiers |
| `shared/__tests__/notificationsInit.test.ts` | 155 | `initializeNotifications` past the permission branch |
| `shared/__tests__/perf.test.ts` | 465 | `shared/perf.ts` |
| `shared/__tests__/perfBackgroundFlush.test.ts` | 157 | Two more paths of `shared/perf.ts` |
| `shared/__tests__/prayer.test.ts` | 1467 | `shared/prayer.ts`: rows, list days, sequences |
| `shared/__tests__/qiblaAlignment.test.ts` | 154 | When the phone is on the qibla line |
| `shared/__tests__/qiblaCompass.test.ts` | 204 | The compass face geometry |
| `shared/__tests__/qiblaGeometry.test.ts` | 62 | The bearing to the Kaaba |
| `shared/__tests__/qiblaPlace.test.ts` | 78 | The place name under the compass |
| `shared/__tests__/qiblaSettle.test.ts` | 95 | When the compass may be drawn |
| `shared/__tests__/qiblaWave.test.ts` | 295 | The calibration figure of eight |
| `shared/__tests__/qiblaWaveGate.test.ts` | 205 | What counts as a wave |
| `shared/__tests__/qualityGate.test.ts` | 110 | The hook, `prepare` and `validate` |
| `shared/__tests__/ramadanSeasonIntl.test.ts` | 72 | `isRamadan` when `Intl` fails |
| `shared/__tests__/sequence.test.ts` | 2158 | `shared/sequence.ts` |
| `shared/__tests__/standardRowsAtMidnight.test.ts` | 83 | A Standard row either side of 00:00 |
| `shared/__tests__/text.test.ts` | 57 | `toArabicNumbers` |
| `shared/__tests__/time.test.ts` | 946 | `shared/time.ts` formatting and date helpers |
| `shared/__tests__/types.test.ts` | 41 | The persisted enum values |
| `shared/__tests__/unusedExports.test.ts` | 54 | No unreachable export |
| `shared/__tests__/versionLockstep.test.ts` | 76 | The three version strings |
| `shared/__tests__/versionUtils.test.ts` | 114 | `compareVersions` and `isNewerVersion` |
| `shared/__tests__/whatsNew.test.ts` | 310 | `shared/whatsNew.ts` |
| `shared/__tests__/widgetAssets.test.ts` | 116 | The Android widget drawables |
| `shared/__tests__/widgetContract.test.ts` | 399 | The widget layout contract by AST |
| `shared/__tests__/widgetLockRenderer.test.ts` | 430 | The Lock Screen layout, rendered |
| `shared/__tests__/widgetOpenAppPatch.test.ts` | 64 | The patch that lets an Android widget tap open the app |
| `shared/__tests__/widgetRenderer.test.ts` | 944 | The home widget layout, rendered on both platforms |
| `shared/__tests__/widgetRuntimeLoads.test.ts` | 73 | The widget runtime bundle evaluates |
| `shared/__tests__/widgetSimulation.test.ts` | 1169 | A model week over the widget timeline |
| `shared/__tests__/widgetSnapshot.test.ts` | 175 | The Android snapshot builder |
| `shared/__tests__/widgetTimeline.test.ts` | 1100 | The iOS timeline builder |
| `stores/__tests__/bootstrap.test.ts` | 226 | `bootstrapFromCache` |
| `stores/__tests__/coldLaunchRearm.test.ts` | 76 | The Android cold-launch re-arm gate |
| `stores/__tests__/countdown.test.ts` | 715 | `stores/countdown.ts` |
| `stores/__tests__/countdownMidnight.test.ts` | 487 | The clock reaching 00:00 while the app is open |
| `stores/__tests__/countdownSelectors.test.ts` | 203 | The per-schedule countdown selectors |
| `stores/__tests__/database.test.ts` | 657 | The MMKV wrapper, records, keep-lists, instance id |
| `stores/__tests__/notificationAlertCommit.test.ts` | 818 | An alert sheet change is all or nothing |
| `stores/__tests__/notificationGateRace.test.ts` | 166 | A download landing during a reschedule |
| `stores/__tests__/notificationGateReopenFailure.test.ts` | 95 | Reopening the gate when the write fails |
| `stores/__tests__/notificationMigrationGuards.test.ts` | 89 | The index-key migration against a changed Extras list |
| `stores/__tests__/notificationOffCancelFailure.test.ts` | 174 | An off prayer whose alarm the OS refuses to cancel |
| `stores/__tests__/notificationPreferenceSetters.test.ts` | 186 | The preference setters and their keys |
| `stores/__tests__/notificationRefreshGate.test.ts` | 282 | The refresh gate and a reschedule that fails part way |
| `stores/__tests__/notificationSchedulingLock.test.ts` | 388 | The scheduling lock under failure |
| `stores/__tests__/notificationSinglePrayerUpdate.test.ts` | 216 | `commitPrayerAlertChange` for every prayer |
| `stores/__tests__/notificationSoundCommit.test.ts` | 159 | `commitSoundSelection` |
| `stores/__tests__/notificationStaleCancelFailure.test.ts` | 200 | A stale alarm the OS refuses to cancel |
| `stores/__tests__/notifications.test.ts` | 2399 | The notifications store: atoms, migration, reschedule strategy, unreadable times |
| `stores/__tests__/notificationsAroundMidnight.test.ts` | 292 | Alarms for rows near 00:00 |
| `stores/__tests__/notificationsClockChange.test.ts` | 154 | Alarms across the 2026 clock changes |
| `stores/__tests__/notificationsFridayIstijaba.test.ts` | 71 | Friday Istijaba alarms |
| `stores/__tests__/notificationsMidnightWindow.test.ts` | 107 | The alarm window on 18 October 2026 |
| `stores/__tests__/notificationsOctober18Midnight.test.ts` | 85 | The two Midnight alarms on 18 October 2026 |
| `stores/__tests__/overlay.test.ts` | 192 | `stores/overlay.ts` |
| `stores/__tests__/overlayAtoms.test.ts` | 205 | The derived overlay atoms |
| `stores/__tests__/schedule.test.ts` | 2406 | `stores/schedule.ts` |
| `stores/__tests__/storage.test.ts` | 298 | The persisted atom factories |
| `stores/__tests__/sync.test.ts` | 1503 | `stores/sync.ts` |
| `stores/__tests__/syncFetchBeforeWipe.test.ts` | 1322 | A refresh fetches first and swaps the cache after |
| `stores/__tests__/syncLateDecember31.test.ts` | 140 | A day landing after sync has resolved |
| `stores/__tests__/syncLoadable.test.ts` | 240 | The launch sync |
| `stores/__tests__/syncUnreadableDay.test.ts` | 329 | A day the provider could not give |
| `stores/__tests__/ui.test.ts` | 347 | `stores/ui.ts` atoms and defaults |
| `stores/__tests__/uiGates.test.ts` | 94 | The splash gates and the What's New flag |
| `stores/__tests__/version.test.ts` | 741 | `stores/version.ts`: versions, keep-list, upgrade flow, cache schema |
| `stores/__tests__/versionFailures.test.ts` | 142 | The upgrade check when a read or a gate reopen throws |
| `stores/__tests__/widgetAndroid.test.ts` | 290 | Android snapshot pushes |
| `stores/__tests__/widgetAndroidFlagOff.test.ts` | 81 | The Android widget flag gate |
| `stores/__tests__/widgetFlagOff.test.ts` | 102 | Widget pushes with the flag off |
| `stores/__tests__/widgetIo.test.ts` | 238 | `refreshPrayerWidgets` errors and the label-flip re-push |
| `stores/__tests__/widgetPlatform.test.ts` | 64 | The widget platform gate |
| `stores/__tests__/widgetPushPastTarget.test.ts` | 44 | A push that runs past its prayer |
| `stores/__tests__/widgetRefreshChain.test.ts` | 99 | The native refresh chain arm call |
| `stores/__tests__/widgetSettingsSync.test.ts` | 387 | The widget settings subscription and date label |

Support files beside the suites: `__tests__/harness.ts` (56), `__tests__/PlatformAtLoad.tsx` (18),
`__tests__/svgFileTransformer.js` (22), `__tests__/README.md` (245),
`hooks/__tests__/hookHarness.ts` (172), `hooks/__tests__/londonDays.ts` (76),
`hooks/__tests__/reanimatedFake.ts` (63), `stores/__tests__/alarmHarness.ts` (156),
`shared/__tests__/_template.example.ts` (65).

## 9. Files read

Read in full:

| File | Lines |
| --- | --- |
| `jest.config.js` | 139 |
| `jest.setup.js` | 10 |
| `jest.components.setup.js` | 165 |
| `jsx-runtime-shim.ts` | 57 |
| `biome.json` | 75 |
| `tsconfig.json` | 14 |
| `metro.config.js` | 60 |
| `global.d.ts` | 20 |
| `package.json` | 103 |
| `.husky/pre-commit`, `.husky/commit-msg`, `.husky/pre-push` | 1, 1, 16 |
| `scripts/check-changed-coverage.js` | 171 |
| `scripts/check-identifiers.js` | 409 |
| `scripts/find-unused-exports.py` | 168 |
| `ai/AGENTS.md` | 168 |
| `__tests__/README.md` | 245 |
| `__tests__/harness.ts` | 56 |
| `__tests__/harness.test.tsx` | 207 |
| `__tests__/PlatformAtLoad.tsx` | 18 |
| `__tests__/svgFileTransformer.js` | 22 |
| `__tests__/app/Navigation.test.tsx` | 97 |
| `__tests__/app/Screen.test.tsx` | 60 |
| `__tests__/app/_layout.test.tsx` | 166 |
| `__tests__/app/index.test.tsx` | 619 |
| `__tests__/app/indexFreshInstall.test.tsx` | 62 |
| All eleven files under `shared/__mocks__/` | 334 in total |
| `shared/__tests__/_template.example.ts` | 65 |
| `hooks/__tests__/hookHarness.ts` | 172 |
| `hooks/__tests__/londonDays.ts` | 76 |
| `hooks/__tests__/reanimatedFake.ts` | 63 |
| `stores/__tests__/alarmHarness.ts` | 156 |
| `shared/__tests__/versionLockstep.test.ts` | 76 |
| `shared/__tests__/audioMatrix.test.ts` | 177 |
| `shared/__tests__/widgetRuntimeLoads.test.ts` | 73 |
| `shared/__tests__/widgetContract.test.ts` | 399 |
| `shared/__tests__/widgetSnapshot.test.ts` | 175 |
| `shared/__tests__/notifications.test.ts` | 811 |
| `shared/__tests__/notificationsInit.test.ts` | 155 |
| `shared/__tests__/constants.test.ts` | 385 |
| `shared/__tests__/types.test.ts` | 41 |
| `shared/__tests__/text.test.ts` | 57 |
| `shared/__tests__/nativeConfig.test.ts` | 60 |
| `shared/__tests__/qualityGate.test.ts` | 110 |
| `shared/__tests__/unusedExports.test.ts` | 54 |
| `shared/__tests__/ramadanSeasonIntl.test.ts` | 72 |
| `stores/__tests__/storage.test.ts` | 298 |
| `stores/__tests__/database.test.ts` | 657 |
| `stores/__tests__/version.test.ts` | 741 |
| `stores/__tests__/notifications.test.ts` | 2399 |
| `stores/__tests__/notificationPreferenceSetters.test.ts` | 186 |
| `stores/__tests__/notificationMigrationGuards.test.ts` | 89 |
| `device/__tests__/notifications.test.ts` | 427 |
| `device/__tests__/androidChannelUpdate.test.ts` | 91 |
| `components/prayer/__tests__/Alert.test.tsx` | 149 |
| `components/prayer/__tests__/Prayer.test.tsx` | 128 |
| `components/sheets/screens/__tests__/Settings.test.tsx` | 300 |
| `e2e/README.md` | 159 |
| The six files under `e2e/flows/` | 143 in total |
| `e2e/scripts/device-checks.sh` | 191 |

Read in part, and how:

- `shared/__tests__/widgetRenderer.test.ts`: lines 1 to 190 of 944.
- `stores/__tests__/notificationsClockChange.test.ts`: lines 1 to 45 of 154, plus a pattern search
  for identifier literals.
- The other five scripts under `e2e/scripts/`: the first six lines of each.
- Every other test file in section 8: the first header line and the first two `describe` names,
  taken by script. Literal identifiers, channel ids and storage keys in them were located by pattern
  search, which is where the line numbers in sections 5.1, 5.5 and 5.9 for those files come from.
- Counts in sections 2, 3.4 and 5.9 come from pattern searches over the 189 test files.

Not read: `e2e/device-atlas-oneplus3t.md` (118), `e2e/device-atlas-oppo-findx8.md` (43),
`e2e/baselines/android-3t.json` (45), `shared/__tests__/identifierScan.test.ts` beyond its header.
Nothing under `ai/plans/` or `ai/features/` was opened.
