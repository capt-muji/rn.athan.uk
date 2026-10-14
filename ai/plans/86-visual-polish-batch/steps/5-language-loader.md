# Step 5 - The language-switch loader

Requirements: R5.1, R5.2, R5.3, R5.4, R5.5, R5.6, R5.7, R5.8

Weight: 2

## Anchor check

```
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/86-visual-polish-batch/scripts/anchors/language-applying-row.txt components/sheets/screens/Language.tsx
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/86-visual-polish-batch/scripts/anchors/pick-language.txt components/sheets/screens/languageSheet.ts
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/86-visual-polish-batch/scripts/anchors/layout-sheet-host.txt app/_layout.tsx
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/86-visual-polish-batch/scripts/anchors/language-busy-atom.txt stores/language.ts
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/86-visual-polish-batch/scripts/anchors/catalog-applying-key.txt shared/i18n/en.ts
```

Each prints `1`.

## Goal

Today a pick blocks the sheet behind an in-sheet "Applying" row while the screens behind
visibly refresh. The owner ruled an instant full-screen purple loader instead, naming the
target language, with nothing of the convergence showing. After this step the tap dismisses
the sheet and mounts the loader in the same tick, the loader stays until the convergence
settles, the in-sheet row and its catalog key are gone, and the loader's line is a new
catalog key in all six locales.

## Branch

```
git checkout -b feat/86-language-loader uat
```

## Files

- `components/ui/LanguageLoader.tsx` (new)
- `components/ui/index.ts`
- `app/_layout.tsx`
- `stores/language.ts`
- `shared/languageNames.ts`
- `shared/i18n/index.ts`
- `components/sheets/screens/Language.tsx`
- `components/sheets/screens/languageSheet.ts`
- `shared/i18n/en.ts`, `shared/i18n/ar.ts`, `shared/i18n/hi.ts`, `shared/i18n/ms.ts`, `shared/i18n/so.ts`, `shared/i18n/th.ts`
- `shared/i18n/catalog-lock.json`
- `components/ui/__tests__/LanguageLoader.test.tsx` (new)
- `components/sheets/__tests__/Language.test.tsx`
- `components/__tests__/typographySweep.test.tsx`
- `shared/__tests__/i18n.test.ts`
- `shared/__tests__/i18nBridge.test.ts`

## Red tests

**`components/ui/__tests__/LanguageLoader.test.tsx`** (new):

```tsx
/**
 * The language-switch loader: what it shows, in which language, and when it stands down
 */

import { render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';

import { setActiveLocale } from '@/shared/i18n/locale';
import { languageCommitBusyAtom, pendingLanguageAtom } from '@/stores/language';

import LanguageLoader from '../LanguageLoader';

const store = getDefaultStore();

const flattenStyle = (style: unknown): Record<string, unknown> =>
  Array.isArray(style)
    ? Object.assign({}, ...style.map((entry) => flattenStyle(entry)))
    : (style as Record<string, unknown>);

afterEach(() => {
  setActiveLocale('en');
  store.set(languageCommitBusyAtom, false);
  store.set(pendingLanguageAtom, null);
});

describe('the language-switch loader', () => {
  it('stands down while no pick is converging', async () => {
    await render(<LanguageLoader />);

    expect(screen.toJSON()).toBeNull();
  });

  it('fills the screen with the root purple and names the target in its own language', async () => {
    store.set(languageCommitBusyAtom, true);
    store.set(pendingLanguageAtom, 'ar');
    setActiveLocale('ar');

    await render(<LanguageLoader />);

    expect(screen.getByText('جارٍ ضبط اللغة العربية')).toBeOnTheScreen();
    // The rendered root is the loader's own panel
    const panel = screen.root as unknown as { props: { style: unknown } };
    expect(flattenStyle(panel.props.style).backgroundColor).toBe(COLORS.navigation.rootBackground);
  });

  it('caps the line's width so a long sentence breaks onto two centred lines', async () => {
    store.set(languageCommitBusyAtom, true);
    store.set(pendingLanguageAtom, 'hi');
    setActiveLocale('hi');

    await render(<LanguageLoader />);

    const line = screen.getByText('भाषा हिन्दी सेट की जा रही है');
    expect(flattenStyle(line.props.style).maxWidth).toBe(260);
    expect(flattenStyle(line.props.style).textAlign).toBe('center');
  });
});
```

Add `import { COLORS } from '@/shared/constants';` to the suite's imports.

**`components/sheets/__tests__/Language.test.tsx`**: the file's doc comment becomes:

```
/**
 * The language sheet (D8, D26): six native names in codepoint order, and a pick that closes
 * the sheet at once and hands the wait to the full-screen loader (ticket 86, D86.8)
 */
```

Replace the case named 'blocks the sheet behind the progress row while the commit runs' with:

```tsx
  it('dismisses at once, with no applying row and no in-sheet spinner', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    // The driver hangs exactly while the assertions run; the afterEach releases it
    driverMock.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          release = () => resolve(true);
        })
    );
    const commitSpy = jest.spyOn(LanguageStore, 'commitLanguagePreference');
    const rendered: RenderResult = await render(<LanguageSheet />);
    const dismiss = jest.spyOn(renderedSheet(), 'dismiss');

    await fireEvent.press(screen.getByRole('radio', { name: 'العربية' }));

    expect(commitSpy).toHaveBeenCalledWith('ar');
    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Applying…')).not.toBeOnTheScreen();
    const tree = rendered.toJSON();
    expect(tree ? spinnerCount(tree) : 0).toBe(0);
  });
```

Delete the case named 'dismisses once the commit resolves': the sheet now dismisses before
the commit settles, which the case above asserts. Replace the case named 'dismisses when the
commit rejects too' with:

```tsx
  it('swallows a rejected commit: the loader owns the wait, so the sheet has no failure face', async () => {
    jest.useFakeTimers({ now: london('2026-09-11', '14:00') });
    jest.spyOn(LanguageStore, 'commitLanguagePreference').mockRejectedValueOnce(new Error('refused'));
    await render(<LanguageSheet />);
    const dismiss = jest.spyOn(renderedSheet(), 'dismiss');

    await fireEvent.press(screen.getByRole('radio', { name: 'ไทย' }));

    expect(dismiss).toHaveBeenCalledTimes(1);
    await act(async () => {});
  });
```

The 'renders the six native names' and 'closes without committing' cases do not change.
Delete that suite's now-unused `import { t } from '@/shared/i18n';`: its only use was the
`t('language.applying')` line inside the replaced case.

**`components/__tests__/typographySweep.test.tsx`**: add `'ui/LanguageLoader.tsx'` to
`INVENTORY`.

**`shared/__tests__/i18n.test.ts`**: append at the end of the file:

```ts
describe('the language loader line', () => {
  afterEach(() => setActiveLocale('en'));

  it.each(LOCALE_IDS)('carries the picked language name through the %s catalog', (id) => {
    setActiveLocale(id);

    expect(t('language.changing', { language: 'X' })).toContain('X');
  });

  it('has no applying key left in any catalog', () => {
    for (const catalog of [en, ar, hi, ms, so, th]) {
      expect(Object.keys(catalog)).not.toContain('language.applying');
    }
  });
});
```

The block goes last because the cases above it read the active catalog, and the `afterEach`
puts the locale back. Import whichever of `LOCALE_IDS`, `setActiveLocale` and the five
non-English catalogs the file does not already hold. `en` is already imported.

**`shared/__tests__/i18nBridge.test.ts`**: the tokened-key list gains the new key in sorted
position, and the per-key block gains its token assertion:

```ts
      'countdown.progressA11y',
      'language.changing',
      'notification.now',
```

```ts
    expect(tokensByKey.get('language.changing')).toEqual(['language']);
```

Red evidence: the loader suite fails to resolve `../LanguageLoader`; the language suite prints
`Expected: 1` and `Number of calls: 0` for the dismiss; and the i18n case fails on
`language.changing` being absent from the catalog union, with the bridge suite printing a
`toEqual` diff for the tokened-key list.

```
npx jest components/ui/__tests__/LanguageLoader.test.tsx --watchman=false --selectProjects=components
npx jest components/sheets/__tests__/Language.test.tsx --watchman=false --selectProjects=components
npx jest shared/__tests__/i18n.test.ts --watchman=false --selectProjects=unit
```

## Change contracts

**`stores/language.ts`**

Add beside `languageCommitBusyAtom`:

```ts
/** The locale a pick is converging to, while the busy face covers the wait; null when no pick runs */
export const pendingLanguageAtom = atom<LocaleId | null>(null);
```

In `commitLanguagePreference`, the busy write becomes a pair:

```ts
  store.set(languageCommitBusyAtom, true);
  store.set(pendingLanguageAtom, locale);
```

and the `finally` clears both:

```ts
  } finally {
    store.set(languageCommitBusyAtom, false);
    store.set(pendingLanguageAtom, null);
  }
```

**`shared/languageNames.ts`**

Add below `LANGUAGE_NAMES`:

```ts
const NAMES_BY_ID = Object.fromEntries(LANGUAGE_NAMES.map((entry) => [entry.id, entry.name])) as Record<LocaleId, string>;

/** The locale's own name, exactly as its picker row reads it */
export const nativeLanguageName = (id: LocaleId): string => NAMES_BY_ID[id];
```

**`shared/i18n/index.ts`**

`ParamsOf` gains one branch, directly before its final `: undefined;`:

```ts
                    : K extends 'language.changing'
                      ? { language: string }
                      : undefined;
```

**`components/ui/LanguageLoader.tsx`** (new):

```tsx
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { COLORS, OVERLAY, SIZE, SPACING, TEXT } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { currentLocaleId, localeVersionAtom } from '@/shared/i18n/locale';
import { nativeLanguageName } from '@/shared/languageNames';
import { typographyFor } from '@/shared/typography';
import { languageCommitBusyAtom, pendingLanguageAtom } from '@/stores/language';

/** The line's cap: a longer sentence breaks onto two centred lines rather than one screen-wide line */
const LINE_MAX_WIDTH = 260;

/**
 * The full-screen face a language pick runs behind: the launch face's purple, spinner
 * and line, with the line naming the language being set.
 *
 * Mounted by the root after the sheet layer. The pick's own sheet is closing from the
 * same tick, so the loader covers the screens while the surfaces converge and the app
 * relaunches where the pick crosses the layout direction.
 */
export default function LanguageLoader() {
  const busy = useAtomValue(languageCommitBusyAtom);
  const pending = useAtomValue(pendingLanguageAtom);
  // The commit switches the locale before the surfaces converge, so the line re-derives
  // on the version bump and reads in the language being set
  const localeVersion = useAtomValue(localeVersionAtom);
  const line = useMemo(
    () => (pending === null ? '' : t('language.changing', { language: nativeLanguageName(pending) })),
    [pending, localeVersion]
  );

  if (!busy || pending === null) return null;

  return (
    <View style={styles.container} accessibilityRole={'progressbar'} accessibilityLabel={t('app.loadingLabel')}>
      <ActivityIndicator size={SIZE.activityIndicator} color={COLORS.navigation.activityIndicator} />
      <Text style={styles.line}>{line}</Text>
    </View>
  );
}

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.navigation.rootBackground,
    zIndex: OVERLAY.zindexes.popup,
  },
  line: {
    maxWidth: LINE_MAX_WIDTH,
    textAlign: 'center',
    fontSize: ty.size(TEXT.size),
    fontFamily: ty.familyRegular,
    lineHeight: ty.blockLineHeight(ty.size(TEXT.size)),
    color: '#fff',
  },
});
```

**`components/ui/index.ts`**: add, in alphabetical position:

```ts
export { default as LanguageLoader } from './LanguageLoader';
```

**`app/_layout.tsx`**

Import `LanguageLoader` beside `ErrorScreen` from `'@/components/ui'`, and close the tree
with it:

```tsx
      <BottomSheetModalProvider>
        <Slot key={localeVersion} />
        <SheetHost deferred={chromeDeferred} />
      </BottomSheetModalProvider>
      <LanguageLoader />
```

**`components/sheets/screens/languageSheet.ts`**

Update the file's header comment: the no-failure-face reason stays, the dismissal moves to
the tap. The function becomes:

```ts
export const pickLanguage = (
  id: LocaleId,
  active: LocaleId,
  commit: (locale: LocaleId) => Promise<void>,
  dismiss: () => void
): void => {
  if (id === active) {
    dismiss();
    return;
  }

  // The loader is up from this tick: the sheet has nothing left to show, and the
  // commit's rejection is forward-only (D34)
  dismiss();
  commit(id).catch(() => undefined);
};
```

**`components/sheets/screens/Language.tsx`**

Delete the `languageCommitBusyAtom` read, the `disabled={busy}` prop, and the applying-row
branch, so the row's trailing child is:

```tsx
            {entry.id === active ? (
              <IconView type={Icon.CHECK} size={18} color={COLORS.text.primary} />
            ) : null}
```

Delete the `applying` and `applyingLabel` styles and the now-unused imports
(`ActivityIndicator`, `SIZE`, and `languageCommitBusyAtom`). Update the component's doc
comment: a pick commits immediately and closes the sheet, and the root's loader covers the
wait. The `SHEET_ICON_COLOR` and `SHEET_PERF_NAME` constants and every other line stay.

**The six catalogs**

In each of `shared/i18n/en.ts`, `ar.ts`, `hi.ts`, `ms.ts`, `so.ts`, `th.ts`, replace the
`language.applying` entry with `language.changing`, in the same position:

```ts
  'language.changing': 'Setting {language} language',
```

```ts
  'language.changing': 'جارٍ ضبط اللغة {language}',
```

```ts
  'language.changing': 'भाषा {language} सेट की जा रही है',
```

```ts
  'language.changing': 'Menetapkan bahasa {language}',
```

```ts
  'language.changing': 'Waxaa lagu dhigayaa luqadda {language}',
```

```ts
  'language.changing': 'กำลังตั้งค่าภาษา {language}',
```

The en line is the owner's own words. Then re-take the lock and regenerate the export:

```
yarn i18n:lock
yarn i18n:export
```

`shared/i18n/dist/` is gitignored, so no `dist` file is added; `shared/i18n/catalog-lock.json`
is committed.

## Green run

```
npx jest components/ui/__tests__/LanguageLoader.test.tsx --watchman=false --selectProjects=components
npx jest components/sheets/__tests__/Language.test.tsx --watchman=false --selectProjects=components
npx jest components/__tests__/typographySweep.test.tsx --watchman=false --selectProjects=components
npx jest shared/__tests__/i18n.test.ts shared/__tests__/i18nBridge.test.ts shared/__tests__/catalogLock.test.ts --watchman=false --selectProjects=unit
npx tsc --noEmit
npx biome check . --error-on-warnings
```

## Break script

`scripts/break-step5.sh`, run from the repository root with `bash`, ending
`ALL AS EXPECTED: 1`:

```bash
#!/usr/bin/env bash
# Ticket 86 step 5 break. Run from the repository root with uat holding step 5.
set -u
cp components/sheets/screens/languageSheet.ts "$TMPDIR/break86-sheet.ts.bak"

python3 - <<'EOF'
import pathlib
p = pathlib.Path('components/sheets/screens/languageSheet.ts')
s = p.read_text()
old = "  dismiss();\n  commit(id).catch(() => undefined);"
new = "  commit(id)\n    .catch(() => undefined)\n    .then(dismiss);"
assert s.count(old) == 1, "break substitution not found once"
s = s.replace(old, new)
p.write_text(s)
print("break applied: the dismissal waited for the commit again")
EOF

npx jest components/sheets/__tests__/Language.test.tsx -t 'dismisses at once' --watchman=false --selectProjects=components > "$TMPDIR/break86-step5.log" 2>&1
if grep -q 'dismisses at once, with no applying row' "$TMPDIR/break86-step5.log"; then
  echo "caught: the sheet stayed open until the commit settled"
  cp "$TMPDIR/break86-sheet.ts.bak" components/sheets/screens/languageSheet.ts
  rm "$TMPDIR/break86-sheet.ts.bak"
  echo "ALL AS EXPECTED: 1"
  exit 0
fi
cp "$TMPDIR/break86-sheet.ts.bak" components/sheets/screens/languageSheet.ts
rm "$TMPDIR/break86-sheet.ts.bak"
echo "BREAK NOT APPLIED (the deferred dismissal did not fail the at-once case)"
exit 1
```

## Version and commit

2.0.721, set in the three version files, then:

```
2.0.721 - feat(language): the pick shows a full-screen loader from the tap
```

Add by name every file listed under Files, plus the plan files this run changed.

## Review checklist

- Does the pick dismiss and set the busy pair in one tick, before any await?
- Does the loader read the direction-free locale record and the target locale, never a stale one?
- Are both atoms cleared on every path, the rejection included?
- Is `language.applying` gone from all six catalogs and from the language sheet?
- Does the root mount the loader after the sheet layer, and is `Slot`'s remount key untouched?
- Hunt the shipped classes: Lifecycle (a loader that must stand down per pick), Residue (an orphaned style, import or catalog key).

## Merge

```
git checkout uat
git merge --no-ff feat/86-language-loader -m "2.0.721 - merge ticket 86 step 5: the language-switch loader"
```

## Done when

Every named test passes, tsc and Biome exit 0, the break script ends `ALL AS EXPECTED: 1`,
the branch is merged, the checklist box is ticked, and `LOG.md` carries the step entry with
its `session:` line.
