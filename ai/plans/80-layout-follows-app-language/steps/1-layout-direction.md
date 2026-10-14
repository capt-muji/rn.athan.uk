### Step 1 — the layout direction at the React roots

Requirements: R1.1, R1.2, R1.3, R1.4
Weight: 2

**Anchor check.** `layout-root.txt` in `app/_layout.tsx`, `picker-modal-root.txt` and `picker-direction-comment.txt` in `components/sheets/screens/ColorPicker.tsx`, `layout-test-onscreen.txt` in `__tests__/app/_layout.test.tsx`, `picker-test-snapshot-case.txt` in `components/sheets/screens/__tests__/ColorPicker.test.tsx`, each counting 1 (the pre-flight ran them).

**Goal.** The React tree's layout direction equals the app locale's own direction in every launch state: the tree root (`GestureHandlerRootView` in `app/_layout.tsx`) and the one native-host root outside it (the picker modal's overlay in `components/sheets/screens/ColorPicker.tsx`) carry `direction: localeDirection(currentLocaleId())`.

**Branch.** None beyond `ticket/80`. The step commits straight to the branch in the worktree `$HOME/athan-gitree/run-80`; nothing merges, nothing pushes, `uat` is never checked out.

**Files.**

- `app/_layout.tsx`
- `components/sheets/screens/ColorPicker.tsx`
- `__tests__/app/_layout.test.tsx`
- `components/sheets/screens/__tests__/ColorPicker.test.tsx`

**Red tests.** Write these first; they must fail with the failures named.

1. `__tests__/app/_layout.test.tsx`, a new describe `the root layout direction` after the `layout-test-onscreen.txt` anchor's describe, carrying `afterEach(() => { setActiveLocale('en'); })` so no case leaks the Arabic locale into the file's other describes:

```tsx
describe('the root layout direction', () => {
  afterEach(() => {
    setActiveLocale('en');
  });

  it("lays the tree out left-to-right under the app's English locale", async () => {
    const page = await render(<Layout />);

    const root = page.toJSON() as unknown as { props: { style?: { direction?: string } } };

    expect(root.props.style?.direction).toBe('ltr');
  });

  it("lays the tree out right-to-left under the app's Arabic locale, the bridge snapshot notwithstanding", async () => {
    setActiveLocale('ar');

    const page = await render(<Layout />);

    const root = page.toJSON() as unknown as { props: { style?: { direction?: string } } };

    // The starved-state premise (row 73's pattern): the bridge snapshot lags the live locale
    expect(I18nManager.getConstants().isRTL).toBe(false);
    expect(root.props.style?.direction).toBe('rtl');
  });

  it('flips the root direction in place when the locale switches while mounted', async () => {
    const page = await render(<Layout />);

    await act(() => {
      setActiveLocale('ar');
    });

    const root = page.toJSON() as unknown as { props: { style?: { direction?: string } } };

    expect(root.props.style?.direction).toBe('rtl');
  });
});
```

Imports to add at the top of the file: a new line `import { I18nManager } from 'react-native';` (the file has no top-level react-native import today, only `require()` calls inside its jest.mock and `loadLayout` helpers), and `setActiveLocale` from `@/shared/i18n/locale`. All cases fail today with `Expected: "ltr" / Received: undefined` and `Expected: "rtl" / Received: undefined` (verified against 2.0.402 in the planning scratch: the root renders as a host View whose style is the flattened object `{"flex":1,"backgroundColor":"#2c1c77"}`, no `direction` key).

2. `components/sheets/screens/__tests__/ColorPicker.test.tsx`, two edits inside the describe the `picker-test-snapshot-case.txt` anchor names:
   - In the LTR case (the anchor's own case), after the panel and slider assertions, add:

```tsx
    const overlay = screen.getByTestId('picker-modal-root');

    expect(StyleSheet.flatten(overlay.props.style).direction).toBe('ltr');
```

   - A new case after it. The ar case cannot reuse `openPicker()`: the row's label is the catalog's own, `لون شريط العد التنازلي` under ar (`shared/i18n/ar.ts`'s `colorPicker.label`), so the press targets that text:

```tsx
  // The modal hosts on the native side, outside the tree root the layout keys: its content
  // carries the app's own direction so the sheet reads the same way the app does
  it('hosts the picker modal content in the app locale direction, right-to-left under ar', async () => {
    setActiveLocale('ar');

    try {
      await render(<ColorPickerSettings />);
      fireEvent.press(screen.getByText('لون شريط العد التنازلي'));

      const overlay = screen.getByTestId('picker-modal-root');

      expect(I18nManager.getConstants().isRTL).toBe(false);
      expect(StyleSheet.flatten(overlay.props.style).direction).toBe('rtl');
    } finally {
      setActiveLocale('en');
    }
  });
```

The file already imports `StyleSheet` and `I18nManager`; add `setActiveLocale` to the `@/shared/i18n/locale` import (the file's existing import line names it or is added). Both fail today: `getByTestId('picker-modal-root')` finds nothing (`Unable to find an element with testID: picker-modal-root`).

**Change contracts.**

1. `app/_layout.tsx`:
   - Extend the existing `@/shared/i18n/locale` import (the one `localeVersionAtom` comes from) with `currentLocaleId` and `localeDirection`.
   - Inside `Layout`, directly above the `return`, add:

```tsx
  // The layout follows the app's selected language (her ruling): forceRTL cannot force
  // LTR on a system-RTL device (the bridge answers forced-or-system), so the root sets
  // the direction itself and the system locale resolves only the initial default
  const direction = localeDirection(currentLocaleId());
```

   - In the anchor's JSX, the root's style gains the key: `<GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.navigation.rootBackground, direction }}>`.
2. `components/sheets/screens/ColorPicker.tsx`:
   - Add `localeDirection` to the `@/shared/i18n/locale` import (line 25 already imports `chevronFor, currentLocaleId`).
   - Above the component's return, beside the existing `pickerDirection` computation, add `const modalDirection = localeDirection(currentLocaleId());` — the modal is the app's own surface, the picker panel inside it is the library's snapshot-keyed one; the two names keep the two halves apart.
   - The anchor's overlay View becomes `<View testID={'picker-modal-root'} style={[styles.modalOverlay, { direction: modalDirection }]}>`.
3. No other file changes. `pickerDirection` and its comment are step 3's ground, untouched here.

**Green run.** `npx jest __tests__/app/_layout.test.tsx components/sheets/screens/__tests__/ColorPicker.test.tsx --watchman=false --selectProjects=components` — every case passes. Then `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0.

**Break script.** `$TMPDIR/t80-break-1.sh`:

```bash
#!/usr/bin/env bash
set -u
cd "$HOME/athan-gitree/run-80" || exit 1
cp app/_layout.tsx "$TMPDIR/t80-layout.bak"
cp components/sheets/screens/ColorPicker.tsx "$TMPDIR/t80-picker.bak"
sed -i '' "s/const direction = localeDirection(currentLocaleId());/const direction = 'ltr' as const;/" app/_layout.tsx
sed -i '' "s/const modalDirection = localeDirection(currentLocaleId());/const modalDirection = 'ltr' as const;/" components/sheets/screens/ColorPicker.tsx
failed=0
npx jest __tests__/app/_layout.test.tsx --watchman=false --selectProjects=components -t 'root layout direction' > "$TMPDIR/t80-break-1a.log" 2>&1 || failed=$((failed + 1))
grep -q 'Received: "ltr"' "$TMPDIR/t80-break-1a.log" || failed=$((failed + 10))
npx jest components/sheets/screens/__tests__/ColorPicker.test.tsx --watchman=false --selectProjects=components -t 'hosts the picker modal content' > "$TMPDIR/t80-break-1b.log" 2>&1 || failed=$((failed + 1))
grep -q 'Received: "ltr"' "$TMPDIR/t80-break-1b.log" || failed=$((failed + 10))
cp "$TMPDIR/t80-layout.bak" app/_layout.tsx
cp "$TMPDIR/t80-picker.bak" components/sheets/screens/ColorPicker.tsx
if [ "$failed" -eq 2 ]; then echo "ALL AS EXPECTED: 2"; else echo "BREAK NOT APPLIED ($failed)"; fi
```

Expected: `ALL AS EXPECTED: 2` — both jest runs fail their ar cases (two counts of 1), both greps find `Received: "ltr"` (the root's and the modal's `Expected: "rtl"` meeting the mutated literal). Any grep miss adds 10 and fails the break. `git status --porcelain` afterwards lists only this step's four files plus the plan files.

**Mutation pass.** After green: (a) replace the layout root's `direction` value with the literal `'ltr'` — the `_layout` ar case fails; (b) replace the modal's with `'ltr'` — the modal ar case fails; (c) replace the modal's with `'rtl'` — the LTR case's overlay assertion fails. Record all three in LOG.md, then restore.

**Version and commit.** Version 2.0.405: `app.json` then `package.json`, both to 2.0.405. Commit message:

```
2.0.405 - fix(layout): the tree root and the picker modal host carry the app locale's own direction
```

Add by name: the four files above, `app.json`, `package.json`, this plan folder's `PLAN.md` and `LOG.md`. The pre-commit hook must print its `Tests:` line ending `passed, <n> total` and four `100%` coverage lines.

**Review.** Read `git show <sha>` cold against: no visual value changed (a direction key is layout, and every state that renders right today resolves the same direction it held at 2.0.402); the starved-state premise asserted in both suites; no new import beyond the two named; no comment explaining what.

**Done when.** The checklist box for step 1 in PLAN.md section 6 is ticked, LOG.md carries the entry with the hook's lines and `session:` line.
