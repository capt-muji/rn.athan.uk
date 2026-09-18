# Step 1: The SDK 58 package wave and the RN 0.88 migrations

**Kind: specified.** The executor builds this step from the contracts below. `(specified)` in PLAN.md's
checklist repeats this.

## 0. Anchor check

Run the PLAN.md section 3 anchor check for this step's anchors (`1-*.txt`). Every count must print `1`.
Any other count means NEEDS REPLAN.

## 1. Goal

`uat-2` runs the Expo SDK 58 beta with the full package wave the beta prescribes, and every RN 0.88
API removal this repo meets is migrated, with the whole suite green.

## 2. Branch

```bash
git checkout -b upgrade/sdk-58-beta uat-2
```

## 3. Files

Exactly these, plus `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`:

- `package.json`
- `yarn.lock` (written by `yarn install`)
- `components/prayer/List.tsx`
- `components/prayer/__tests__/List.test.tsx`
- `components/ui/RamadanDecorations.tsx`
- `jest.config.js`
- `jest.components.setup.js`

Nothing else: no `app.json` change beyond the version field part 8 sets.

## 4. Tests first (red)

One suite changes: `components/prayer/__tests__/List.test.tsx` (existing, appended to). Append this
block at the end of the file, after the last `describe`, separated by one blank line:

```tsx
describe('the Standard list on Friday 11 September 2026 at 14:00', () => {
  it('asks for the re-measure through a cancellable idle callback', async () => {
    showLondonDay('2026-09-11', '14:00');
    const idle = jest.spyOn(globalThis, 'requestIdleCallback');
    const cancelIdle = jest.spyOn(globalThis, 'cancelIdleCallback');
    await render(<List type={ScheduleType.Standard} />);
    idle.mockClear();

    await act(() => getDefaultStore().set(countdownBarShownAtom, false));

    expect(idle).toHaveBeenCalledTimes(1);
    await screen.unmount();
    expect(cancelIdle).toHaveBeenCalledWith(idle.mock.results[0].value);
  });
});
```

The `describe` title repeats the file's existing situation line; a reader must not need to look up the
date's data. `render`, `screen`, `act`, `getDefaultStore`, `showLondonDay`, `List`, `ScheduleType` and
`countdownBarShownAtom` are already imported by the file.

| Test | Proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `asks for the re-measure through a cancellable idle callback` | The re-measure after the countdown-bar toggle is scheduled through the idle-callback pair RN 0.88 provides, and the pending callback is cancelled on cleanup | Friday 2026-09-11 at 14:00, bar toggled off after mount, then unmount | `requestIdleCallback` called exactly once for the toggle; `cancelIdleCallback` called with the handle the scheduling call returned |

Run it:

```bash
npx jest components/prayer/__tests__/List.test.tsx --watchman=false --selectProjects=components
```

Expected: the new test FAILS with

```text
Cannot spy the requestIdleCallback property because it is not a function; undefined given instead
```

(react-native's jest preset, jest-expo and the app's own setups define no idle pair on the SDK 57
tree; verified against `@react-native/jest-preset@0.86.3` and `jest-expo@57.0.5` while planning.) The
file's other 10 tests pass, so the summary line reads `1 failed, 10 passed, 11 total`. If any other
test fails, or this one passes, STOP.

## 5. Change

This step is `(specified)`: build everything below from its contract; nothing here is a file to copy.

### 5a. The package wave

In `package.json`, set these entries and no others (old → new; every other entry in both dependency
blocks stays byte-identical):

| Entry | Old | New |
| --- | --- | --- |
| `@expo/ui` | `~57.0.18` | `~58.0.3` |
| `expo` | `~57.0.22` | `~58.0.0-preview.3` |
| `expo-asset` | `~57.0.17` | `~58.0.3` |
| `expo-audio` | `~57.0.5` | `~58.0.0` |
| `expo-background-task` | `~57.0.17` | `~58.0.3` |
| `expo-build-properties` | `~57.0.17` | `~58.0.3` |
| `expo-constants` | `~57.0.18` | `~58.0.3` |
| `expo-font` | `~57.0.4` | `~58.0.1` |
| `expo-haptics` | `~57.0.3` | `~58.0.1` |
| `expo-linear-gradient` | `~57.0.2` | `~58.0.0` |
| `expo-linking` | `~57.0.10` | `~58.0.3` |
| `expo-notifications` | `~57.0.18` | `~58.0.3` |
| `expo-router` | `~57.0.21` | `~58.0.4` |
| `expo-splash-screen` | `~57.0.9` | `~58.0.0` |
| `expo-system-ui` | `~57.0.4` | `~58.0.1` |
| `expo-task-manager` | `~57.0.17` | `~58.0.4` |
| `expo-updates` | `~57.0.22` | `~58.0.5` |
| `expo-widgets` | `~57.0.19` | `~58.0.3` |
| `react-native` | `0.86.3` | `0.88.0-rc.0` |
| `react-native-edge-to-edge` | `1.8.1` | `1.8.2` |
| `react-native-gesture-handler` | `~2.32.0` | `~3.2.1` |
| `react-native-pager-view` | `8.0.2` | `9.0.4` |
| `react-native-performance` | `6.0.0` | `7.0.0` |
| `react-native-safe-area-context` | `~5.7.0` | `~5.9.1` |
| `react-native-screens` | `~4.26.0` | `~4.27.0` |
| `react-native-svg` | `15.15.4` | `15.15.5` |
| `@react-native/jest-preset` (dev) | `0.86.3` | `0.88.0-rc.0` |
| `expo-dev-client` (dev) | `~57.0.19` | `~58.0.3` |
| `jest-expo` (dev) | `57.0.5` | `~58.0.2` |

Untouched on purpose (owner, 2026-09-18: strictly the SDK wave; the everything-to-latest sweep is its
own later session): `jotai 2.20.3`, `@biomejs/biome 2.5.13`, `test-renderer 1.2.0`, `husky 8.0.3`,
`lint-staged 15.5.2`, `jest ^30.4.2`, `@types/jest ^30.0.0`, `typescript ~7.0.2`, `@types/react
~19.2.4` (types match React 19.2.3, which the wave keeps), `react-native-reanimated 4.6.0` and
`react-native-worklets 0.12.2` (they ARE the SDK 58 pins), `react-native-mmkv 4.3.2`,
`react-native-nitro-modules 0.37.1`, `@gorhom/bottom-sheet 5.2.14`, `date-fns 4.4.0`,
`date-fns-tz 3.2.0`, `pino 10.3.1`, `reanimated-color-picker 5.1.3`, everything else.

Then run, in the repository root:

```bash
yarn install
```

This is the step's one dependency command. Never `npx expo install`, never `npx expo install --fix`.

### 5b. `components/prayer/List.tsx`: the InteractionManager removal

RN 0.88 removes `InteractionManager` from react-native core: the export's DEV getter throws
"InteractionManager has been removed from react-native core", and the strict types drop it. Its
replacement is the `requestIdleCallback` global pair RN now installs through
`Libraries/Core/setUpTimers.js`.

1. The import line (anchor 1-11) becomes:

```tsx
import { StyleSheet, View, type ViewInstance } from 'react-native';
```

2. The ref (anchor 1-12) becomes:

```tsx
  const listRef = useRef<ViewInstance>(null);
```

`ViewInstance` is react-native 0.88's exported ref type for View (the old `useRef<View>` held the
component type, which the strict types no longer accept, and `View`'s own `ref` prop now demands
`Ref<ViewInstance>`).

3. The deferred re-measure (anchor 1-13) becomes:

```tsx
    // Wait for layout to settle after countdown bar is added/removed; RN 0.88 removed
    // InteractionManager.runAfterInteractions, and the idle callback is its replacement
    const handle = requestIdleCallback(() => {
      measureList();
    });

    return () => cancelIdleCallback(handle);
```

The globals are typed by the DOM lib `expo/tsconfig.base` already includes (`"lib": ["DOM",
"ESNext"]`); no declaration file is added.

Semantic note the review found (finding 10): an idle callback fires when the JS thread is idle, which
can be later than "interactions settled". The first-layout measurement path is untouched, so nothing
first-frame depends on this.

### 5c. `components/ui/RamadanDecorations.tsx`: the transform-origin arity

RN 0.88 requires exactly three `transformOrigin` values: the type is
`string | [string | number, string | number, string | number]` and `_validateTransformOrigin` invariants
`transformOrigin.length === 3` in DEV. The wire style (anchor 1-14) becomes:

```tsx
  // scaleY must pivot at the wire's attachment point (top), not the center
  wireOrigin: {
    transformOrigin: ['50%', '0%', 0],
  } as const,
```

`z` is unused by a scaleY pivot and `0` is the CSS default, so the rendered pivot is unchanged. This
one line is load-bearing for tsc: a 2-tuple fails `StyleSheet.create`'s constraint, which collapses
the whole styles object's inference to the imprecise supertype and cascades 12 errors onto every
`styles.sprite` use (found in the spike; one fix, twelve errors gone).

### 5d. `jest.config.js`: the src/private resolution map

Jest 30 consults react-native's package `exports` allow-list, which 0.88 narrows: `./src/private/*`
stops being exported, while RN's own `@react-native/virtualized-lists` and the jest-preset's mocks
deep-import from there. The exports-deleting resolver in `@react-native/jest-preset` no longer takes
effect on jest 30. Map each such require to its file by path. In the `components` project's config,
replace the `moduleNameMapper: appModuleMocks,` line (anchor 1-15) with:

```js
      // jest 30 consults react-native's exports allow-list before any resolver packageFilter, and 0.88 stops
      // exporting ./src/private/*: RN's own virtualized-lists and the jest-preset mocks deep-import from there,
      // so each of those requires is mapped to its file by path. The @react-native/jest-preset resolver that
      // deletes the exports field worked up to jest 29 and is kept, but no longer suffices.
      moduleNameMapper: {
        '^react-native/src/private/featureflags/ReactNativeFeatureFlags$':
          '<rootDir>/node_modules/react-native/src/private/featureflags/ReactNativeFeatureFlags.js',
        '^react-native/src/private/types/(HostComponent|HostInstance)$':
          '<rootDir>/node_modules/react-native/src/private/types/$1.js',
        '^react-native/src/private/webapis/errors/DOMException.js$':
          '<rootDir>/node_modules/react-native/src/private/webapis/errors/DOMException.js',
        ...appModuleMocks,
      },
```

The targets are file paths, not bare specifiers: a bare `react-native/src/private/$1` target re-enters
exports-respecting resolution and fixes nothing (design review finding 8).

### 5e. `jest.components.setup.js`: the idle pair

RN's jest preset replaces the timer globals without providing `requestIdleCallback` /
`cancelIdleCallback`. Append at the end of the file (anchor 1-16):

```js

// React Native installs requestIdleCallback and cancelIdleCallback as timer globals (Libraries/Core/setUpTimers),
// but its Jest preset replaces the timer globals without providing the idle pair. The prayer list schedules its
// re-measure through one, so the suite defines the same shape on a timer the tests can flush with
// jest.runOnlyPendingTimers(); the handle map makes a cancel stop its callback, as on a phone
const idleTimers = new Map();
let nextIdleHandle = 0;
globalThis.requestIdleCallback = (callback) => {
  const handle = ++nextIdleHandle;
  const timer = setTimeout(() => {
    idleTimers.delete(handle);
    callback({ didTimeout: false, timeRemaining: () => 50 });
  }, 0);
  idleTimers.set(handle, timer);
  return handle;
};
globalThis.cancelIdleCallback = (handle) => {
  const timer = idleTimers.get(handle);
  if (timer === undefined) return;
  clearTimeout(timer);
  idleTimers.delete(handle);
};
```

This is plain JavaScript: the file is loaded by Node directly, and TypeScript annotations do not
parse here (the spike found this the loud way). The handle map matters: fake timers hand back timer
objects, not numbers, so a numeric `clearTimeout(handle)` cancels nothing and a superseded re-measure
still fires.

## 6. Green

```bash
npx jest --silent --coverage
```

Expected last lines:

```text
Test Suites: 159 passed, 159 total
Tests:       4531 passed, 4531 total
```

(4530 on `uat-2` plus the one new test. The two audioMatrix prebuilt-dir assertions run, not skip,
because the main checkout holds `android/` and `ios/`.) Then:

```bash
npx tsc --noEmit
npx biome check . --error-on-warnings
```

Both exit 0. Then the timezone gate (programme rule 5):

```bash
yarn test:tz
```

Expected: four `Tests: 4531 passed, 4531 total` lines, one per zone, each zone exiting 0.

## 7. Breaks

Save as `$TMPDIR/breaks-12-1.sh`, run with `bash $TMPDIR/breaks-12-1.sh` from the repository root:

```bash
#!/bin/bash
set -u
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
caught=0
missed=0

break_one() {
  label="$1"; file="$2"; sub="$3"; testfile="$4"; project="$5"; expect="$6"
  cp "$file" "$file.break-bak"
  perl -0pi -e "$sub" "$file"
  if cmp -s "$file" "$file.break-bak"; then
    echo "BREAK NOT APPLIED: $label"
    missed=$((missed + 1))
  else
    out=$(npx jest "$testfile" --watchman=false --selectProjects="$project" 2>&1)
    if echo "$out" | grep -qE "$expect"; then
      echo "caught: $label"
      caught=$((caught + 1))
    else
      echo "NOT CAUGHT: $label"
      echo "$out" | grep -E "Tests:|✕|failed" | head -5
      missed=$((missed + 1))
    fi
  fi
  cp "$file.break-bak" "$file"; rm "$file.break-bak"
}

# 1. The idle scheduling decision: name the idle pair as the scheduler
break_one "idle scheduler" components/prayer/List.tsx \
  "s/const handle = requestIdleCallback\(\(\) => \{/const handle = setTimeout(() => {/" \
  components/prayer/__tests__/List.test.tsx components \
  "asks for the re-measure through a cancellable idle callback|measures once when the countdown bar is switched off and on again"

# 2. The cancel decision: a cancel that stops nothing
break_one "cancel stops nothing" jest.components.setup.js \
  "s/  clearTimeout\(timer\);\n  idleTimers\.delete\(handle\);//" \
  components/prayer/__tests__/List.test.tsx components \
  "measures once when the countdown bar is switched off and on again before the list settles"

# 3. The resolution map: a mapper that maps nowhere
break_one "mapper to nowhere" jest.config.js \
  "s|'<rootDir>/node_modules/react-native/src/private/featureflags/ReactNativeFeatureFlags\\.js',|'<rootDir>/node_modules/react-native/src/private/featureflags/NOWHERE.js',|" \
  components/sheets/screens/__tests__/ColorPicker.test.tsx components \
  "Test suite failed to run|Cannot find module"

echo "caught=$caught missed=$missed"
[ "$missed" -eq 0 ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
```

Expected: `caught=3 missed=0` then `ALL AS EXPECTED: 1`. The two tsc-guarded migrations
(`ViewInstance`, the 3-tuple) have no jest break: no honest test asserts a style value or a ref type,
and reverting either surfaces as a tsc error in part 6; that is their guard, stated plainly.

## 8. Version and commit

```bash
v=$(node -p "const s=require('./package.json').version.split('.');s[2]=String(Number(s[2])+1);s.join('.')") && echo "$v"
```

Set that version in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Add, by
name: `package.json`, `yarn.lock`, `components/prayer/List.tsx`,
`components/prayer/__tests__/List.test.tsx`, `components/ui/RamadanDecorations.tsx`,
`jest.config.js`, `jest.components.setup.js`, `app.json`, plus `ai/plans/README.md`
and this folder's `PLAN.md` and `LOG.md` when this session changed them. Commit message
(`$TMPDIR/msg-1.txt`, `<VERSION>` replaced):

```text
<VERSION> - upgrade(sdk-58): Expo 58 beta wave, RN 0.88.0-rc.0, InteractionManager and transformOrigin migrations, jest src/private resolution

package.json/yarn.lock: the beta's bundledNativeModules pins (expo ~58.0.0-preview.3 and the
expo-* 58 set), RN 0.88.0-rc.0, gesture-handler ~3.2.1, pager-view 9.0.4, safe-area ~5.9.1,
screens ~4.27.0, svg 15.15.5, react-native-performance 7.0.0 (the RN 0.86+ clock line; 6.0.0 is
for older RN), edge-to-edge 1.8.2 (kept; the built-in switch is a later session, owner
2026-09-18), jest-preset 0.88.0-rc.0, dev-client ~58.0.3, jest-expo ~58.0.2. Nothing else moved.

List.tsx: InteractionManager.runAfterInteractions is removed in RN 0.88 (DEV getter throws);
the re-measure moves to the requestIdleCallback pair, the ref to ViewInstance.
RamadanDecorations.tsx: transformOrigin must be a 3-tuple in 0.88 (type and DEV invariant);
z=0 is the CSS default, render unchanged.
jest.config.js: jest 30 honors RN 0.88's narrowed exports; the src/private deep imports RN's
own virtualized-lists still makes are mapped to files by path.
jest.components.setup.js: the idle pair the preset does not install, with a cancel that
actually cancels under fake timers.

Tests: 4531 passed, 4531 total; coverage 100% statements/branches/functions/lines.
```

The hook runs the full suite; its last `Tests:` line must end `passed, 4531 total`, with four `100%`
coverage lines.

## 9. Review

Spawn `Code Reviewer` (a `general` subagent), isolation `worktree`, no `model`, prompt:

```text
Run git checkout --detach <sha>. Review this SDK 58 upgrade commit against
/Users/muji/repos/rn.athan.uk/ai/plans/12-sdk58-beta-upgrade/steps/1-sdk58-package-wave.md (read it
first, in full). The plan's package table is the complete diff of package.json: every changed entry
is listed there and nothing else may differ. Check: the three migrations match their contracts
(idle-callback pair with cancel cleanup, ViewInstance ref, 3-tuple transformOrigin with z=0); the
jest.config mapper targets are file paths; the setup-file idle pair is plain JavaScript with a
working cancel; the new List test proves what its row says; no other file changed beyond the plan's
list and the three plan files. Reply "merge" or "fix first: <findings>".
```

A "fix first" verdict is handled as `EXECUTOR-BRIEF.md` section 4, item 8 says: a fix this plan's
section 10 gives word for word, or a fix meeting all three of that item's conditions, is applied;
anything else is a STOP.

## 10. Merge

```bash
git checkout uat-2 && git merge --no-ff upgrade/sdk-58-beta -m "Merge upgrade/sdk-58-beta into uat-2: SDK 58 beta wave and RN 0.88 migrations, step 1 of session 12"
```

## 11. Done when

```bash
npx tsc --noEmit
```
exits 0;
```bash
npx biome check . --error-on-warnings
```
exits 0;
```bash
npx jest --silent --coverage
```
ends `Tests: 4531 passed, 4531 total`; `bash $TMPDIR/breaks-12-1.sh` ends `ALL AS EXPECTED: 1`;
`yarn test:tz` passes all four zones; `git status --porcelain` lists only this step's files and the
three plan files; the row is still IN PROGRESS and the step is ticked in PLAN.md's checklist.
