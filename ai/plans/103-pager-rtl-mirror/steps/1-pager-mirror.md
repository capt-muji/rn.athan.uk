# Step 1: the mirror prop, red tests, suites, simulator probe

Requirements: R1.1, R1.2, R2.1, R3.1, R4.1
Weight: 3

Anchor check: all 5 anchors under `scripts/anchors/` count exactly 1 at the working tree
(preflight already proved it; if any code anchor moved since, STOP: the plan is stale).

## Goal

PagerView receives `layoutDirection` from the app locale in every render. Nothing else in
`app/Navigation.tsx` changes.

## Branch

`git checkout -b feat/pager-rtl-mirror uat` (fetch `origin` first).

## Files

- `app/Navigation.tsx`
- `__tests__/app/Navigation.test.tsx`

## Red tests

At the top of `__tests__/app/Navigation.test.tsx`, beside the existing `jest.mock('@/shared/perf')`,
mock the pager module so its props are reachable by testID (the testing library at its pinned
14.0.1 ships no type query, and the real module pins the host prop to its own deduced value):

```
jest.mock('react-native-pager-view', () => {
  const { View } = require('react-native');
  const MockPager = (props: { children?: React.ReactNode }) => <View {...props} testID="pager" />;
  return { __esModule: true, default: MockPager };
});
```

The mock forwards props and children, so the file's existing fireEvent cases (which bubble pager
events from the page text nodes) stay green. Then add two cases beside the existing page-selected
cases:

1. `passes layoutDirection rtl to the pager under an RTL locale` - seed the locale with
   `setActiveLocale('ar')` from `@/shared/i18n/locale` (the pattern at
   `shared/__tests__/i18nRuntime.test.ts:13-17`), render `<Navigation />`, and assert
   `expect(screen.getByTestId('pager')).toHaveProp('layoutDirection', 'rtl')`.
2. `passes layoutDirection ltr to the pager under an LTR locale` - same with `en` (seed with
   `setActiveLocale('en')`), assert `'ltr'`. Run the `rtl` case before the `ltr` case so module
   state ends at `en` for the file's remaining tests.

Run them. Record the exact failing names and the first failing line (expected shape: received
`undefined`). Any other test failing is a STOP.

## Change contracts

In `app/Navigation.tsx`:

- Add the import: `import { currentLocaleId, localeDirection } from '@/shared/i18n/locale';`
  (match the barrel's export order against the root's import; the root file carries the same
  pair).
- Inside `Navigation()`, one line above the handlers, after the chrome hooks: `const direction = localeDirection(currentLocaleId());`
  (one read per render, stored in a variable; no nested calls in props, per the repo rule).
- On the `PagerView` element: `layoutDirection={direction}` beside `initialPage`.
- Zero other diffs: no style, no child order, no handler, no comment above the prop.

## Green run

1. `npx jest __tests__/app/Navigation.test.tsx --watchman=false` - both new cases green, every
   existing case in the file green.
2. The neighbouring pinning suites, unchanged and green:
   `npx jest components/countdown/__tests__/tipGeometry.test.ts components/overlay/__tests__/overlayPlacement.test.ts components/overlay/__tests__/catcherGeometry.test.ts shared/__tests__/directionalStyleGate.test.ts --watchman=false`
   (expected: all pass, zero snapshot changes).
3. `yarn validate`.

## Break script

`bash <TMPDIR-copy>/scripts/break-103.sh` from the repository root. It renames only the
`layoutDirection` prop away (the file stays parseable), runs the two new cases, expects both to
fail with `undefined` received, then restores the file from its backup copy. Output ends
`BREAK OK` when both failed and the restore is clean.

## Simulator probe (R4.1, inside this step, after the green run, before the version bump)

1. Build the iOS simulator dev build fresh from the working tree carrying the change
   (xcodebuildmcp: workspace `ios/Athan.xcworkspace`, scheme `Athan`, the booted iOS simulator
   from `session_showDefaults`; reuse no build this step did not build).
2. Switch the in-app language to Arabic: Settings sheet, language row, Arabic (the D59 reload
   lands; wait for the home face).
3. Through agent-device, swipe the schedule pager in the reversed direction (start x left of end
   x, the swipe that today does nothing).
4. Expect: the Extras page settles (its info boxes and list visible). Snapshot.
5. Switch back to English, wait for the reload, snapshot the Standard page: the English face
   renders whole (byte-identity is R3.1's suite, not this read).
6. Save both snapshots and their transcriptions under `$HOME/athan-gitree/sessions/103/`.

If the pager does not flip: STOP per PLAN 2.2, first row.

## Version and commit

The version is the next patch after `uat`'s `package.json` when the step runs (bump `app.json`
first, then `package.json`, then `android/app/build.gradle`). Commit message:
`<VERSION> - feat(nav): the schedule pager mirrors under RTL - layoutDirection follows the app locale`.

## Review checklist

- The diff touches exactly the two named files.
- One new prop, one new variable, one new import; zero styles.
- The two reds recorded in `LOG.md` with their first failing lines.

## Merge

`git checkout uat && git merge --no-ff feat/pager-rtl-mirror -m "<VERSION> - merge feat/pager-rtl-mirror: the pager mirror"`.
Never push.

## Done when

Reds recorded, suites green, `yarn validate` green, probe evidence saved, merged into `uat`, the
`Tests:` and coverage lines from the hook pasted into `LOG.md`, and the step entry ends with its
`session:` line.
