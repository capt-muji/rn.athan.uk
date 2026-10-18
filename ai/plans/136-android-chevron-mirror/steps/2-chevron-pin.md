### Step 2 - the paragraph pin, sweep suite red-first with mutation pass

Requirements: R1.1, R1.2, R2.1
Weight: 2

Anchor check: rerun the pre-flight's anchor counts on the step branch.

Goal: every `chevronFor()` render site's Text carries `direction: 'ltr'`,
pinned by a sweep suite that is red today.

Branch: `fix/136-chevron-paragraph-pin` off `uat` in the lane worktree.

Files: `components/sheets/screens/Settings.tsx`,
`components/sheets/screens/ColorPicker.tsx`, `components/modals/Help.tsx`,
`components/__tests__/chevronDirection.test.tsx` (new).

Red tests, written first, verbatim shape:

`components/__tests__/chevronDirection.test.tsx`:

```tsx
/**
 * The chevron sweep: every chevronFor() glyph renders inside a Text whose
 * paragraph is pinned ltr, because Android resolves a lone neutral glyph
 * against the RTL layout direction and mirrors it (ticket 136)
 */

import type { LocaleId } from '@/shared/i18n/locale';

// The probes require the testing library inside isolateModules, mid-test,
// where its import-time cleanup-hook registration is a jest-circus error
process.env.RNTL_SKIP_AUTO_CLEANUP = 'true';

// The Help action row opens a settings screen, so opening it is observed
jest.mock('@/device/notifications', () => ({
  openDndAccessSettings: jest.fn(() => Promise.resolve(true)),
}));
// The chevron's platform leg renders Android's action row; the back handling
// exists for Android, so the hardware back press runs through Android's own
// implementation, as in Help.test.tsx
jest.mock('react-native/Libraries/Utilities/BackHandler.ios', () =>
  jest.requireActual('react-native/Libraries/Utilities/BackHandler.android')
);

// The What's New row's chevron site must be asserted, so the release is
// visible whatever the current stamp carries (Settings.test.tsx's pattern)
let mockVisibleWhatsNew: { version: string; items: never[] } | null = null;
jest.mock('@/shared/whatsNew', () => ({
  currentVisibleWhatsNew: () => mockVisibleWhatsNew,
}));

const settingsChevronStylesUnder = async (locale: LocaleId): Promise<unknown[]> => {
  mockVisibleWhatsNew = { version: '2.0.1013', items: [] };
  let styles: unknown[] = [];
  jest.resetModules();
  await jest.isolateModulesAsync(async () => {
    const { StyleSheet } = require('react-native');
    const { setActiveLocale } = require('@/shared/i18n/locale');
    setActiveLocale(locale);
    const rntl = require('@testing-library/react-native');
    const SettingsSheet = require('../sheets/screens/Settings').default;
    await rntl.render(<SettingsSheet />);
    const glyph = locale === 'ar' ? '\u2039' : '\u203A';
    styles = rntl.screen
      .getAllByText(glyph)
      .map((element: { props: { style: unknown } }) => StyleSheet.flatten(element.props.style));
  });
  return styles;
};

const helpChevronStylesUnder = async (locale: LocaleId): Promise<unknown[]> => {
  let styles: unknown[] = [];
  jest.resetModules();
  await jest.isolateModulesAsync(async () => {
    const { StyleSheet } = require('react-native');
    require('@/__tests__/harness').onPlatform('android');
    const { setActiveLocale } = require('@/shared/i18n/locale');
    setActiveLocale(locale);
    const rntl = require('@testing-library/react-native');
    const ModalHelp = require('../modals/Help').default;
    await rntl.render(<ModalHelp visible={true} onClose={jest.fn()} />);
    const { getHelpTopics } = require('@/shared/help');
    const question = getHelpTopics('android').find((topic: { action?: string }) => topic.action).question;
    await rntl.fireEvent.press(rntl.screen.getByRole('button', { name: question }));
    const glyph = locale === 'ar' ? '\u2039' : '\u203A';
    styles = rntl.screen
      .getAllByText(glyph)
      .map((element: { props: { style: unknown } }) => StyleSheet.flatten(element.props.style));
  });
  return styles;
};

it.each([
  ['en', '\u203A'],
  ['ar', '\u2039'],
] as const)('pins every settings-sheet chevron paragraph under %s', async (locale, glyph) => {
  const styles = await settingsChevronStylesUnder(locale);

  // The authored codepoint is the locale's own (the JS half lives in
  // locale.test.ts); six sites: five rows plus the colour-picker row
  expect(styles).toHaveLength(6);
  // A rule the app must keep (the __tests__ README's named exception):
  // Android mirrors this glyph inside an RTL paragraph, so the chevron's
  // own paragraph is pinned ltr and the codepoint carries the direction
  for (const style of styles) {
    expect((style as Record<string, unknown>).direction).toBe('ltr');
  }
});

it.each([
  ['en', '\u203A'],
  ['ar', '\u2039'],
] as const)('pins the help action chevron paragraph under %s', async (locale) => {
  const styles = await helpChevronStylesUnder(locale);

  expect(styles).toHaveLength(1);
  expect((styles[0] as Record<string, unknown>).direction).toBe('ltr');
});
```

Run
`npx jest components/__tests__/chevronDirection.test.tsx --watchman=false --selectProjects=components`.
Red expectation, exact: four tests, every one failing with
`expect(received).toBe("ltr") // Object.is equality` naming
`Received: undefined` (the count assertions pass today: six and one). Record
the four failing lines in LOG.md. If a count assertion fails instead, STOP
(D136.4's premise broke: a chevron site is missing or a query is wrong).

Change contracts:

1. `Settings.tsx`, inside `styles.chevron` (anchor
   `settings-chevron-style.txt`), append after the `lineHeight` line, keeping
   the entry last:

   ```
       // The codepoint carries the direction (chevronFor); Android mirrors a lone neutral
       // glyph inside an RTL paragraph, so the paragraph itself stays LTR
       direction: 'ltr',
   ```

2. `ColorPicker.tsx`, the same two comment lines plus `direction: 'ltr',`
   appended inside `styles.chevron` (anchor `colorpicker-chevron-style.txt`).
3. `Help.tsx`: the action chevron Text becomes
   `<Text style={[styles.actionText, styles.actionChevron]}>{chevronFor()}</Text>`
   (anchor `help-action-chevron.txt`), and a new entry joins the StyleSheet
   after `actionText`:

   ```
     actionChevron: {
       // The codepoint carries the direction (chevronFor); Android mirrors a lone neutral
       // glyph inside an RTL paragraph, so the paragraph itself stays LTR
       direction: 'ltr',
     },
   ```

4. `chevronFor`, `directionGlyph`, the root, the labels and every other style
   entry: unchanged. No other file changes.

Green run: the four tests pass; `npx tsc --noEmit` exits 0;
`npx biome check . --error-on-warnings` exits 0; `yarn validate` passes with
the four coverage lines at 100%.

Break script: `bash scripts/break-136.sh` from the lane worktree root
(committed in this folder). It rewrites each of the three pins to
`direction: 'inherit'` one at a time and expects the sweep to fail each time,
ending `ALL AS EXPECTED: 3`. A surviving mutant or a `BREAK NOT APPLIED` line
is a STOP.

Version and commit: hold `$HOME/athan-gitree/version.lock` (mkdir, retried in
`sleep 15` cycles), `git fetch -q origin uat`, require
`node scripts/check-version-uniqueness.js` clean, set the next patch version
in `app.json` then `package.json` (the lane syncs the main tree's gitignored
`android/app/build.gradle` after merge under `build.lock`). Commit message:

```
<VERSION> - fix(i18n): the chevron paragraph pinned ltr so Android draws the authored glyph under ar
```

Files added by name: the four files plus this plan folder's `PLAN.md` and
`LOG.md`. The queue row moves to `IN PROGRESS, step 2`.

Review checklist: the diff touches only the four files; the three style
entries are the only production change; the pin's comment lines are identical
across the three files; no snapshot, no visual value, no glyph change; the
suite's counts are six and one; the four mutants die.

Merge: the executor commits the branch in the lane worktree; the lane merges
under `$HOME/athan-gitree/uat.lock` in the main tree (`git fetch -q origin
uat`, uniqueness check clean, `git merge --no-ff`), then syncs the main
tree's `android/app/build.gradle` `versionName` under `build.lock`. Lane
weather on the queue or version files per PLAN.md section 10.

Done when: merged, checklist ticked, LOG.md carries the sha, the hook's
`Tests:` line and the four coverage lines, and the break script's last line.
