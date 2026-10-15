# Step 5 — the sound sheet's ar spacing pair

Requirements: R5.1, R5.2, R9.1
Weight: 2

## Anchor check

`python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' scripts/anchors/08-sound-list.md components/sheets/screens/Sound.tsx`
prints `1`, and the same for `scripts/anchors/09-note-foot.md` against
`components/sheets/parts/VolumeNote.tsx`. Any other count is
`NEEDS_CONTEXT: NEEDS REPLAN`.

## Goal

Under ar the sound sheet's card hint tightens onto the list below it (12 to 6) and
the volume note clears the list above it (24 to 32). D94 names the mapping: the dim
card hint and the white playing row are the pair above the preview animation, the
note's Arabic copy is the text below it.

## Branch

`git checkout -b code/100-sound-spacing lane/100`

## Files

- `components/sheets/screens/Sound.tsx` (changed)
- `components/sheets/parts/VolumeNote.tsx` (changed)
- `components/__tests__/typographySweep.test.tsx` (changed, new probes)

## Red tests

In `components/__tests__/typographySweep.test.tsx`, add two probes following the
file's shape. The list container renders only when the sound list is warm, so the
probe drives the store first:

```ts
const soundListMarginUnder = async (locale: LocaleId): Promise<unknown> => {
  let marginTop: unknown;
  jest.resetModules();
  await jest.isolateModulesAsync(async () => {
    const { StyleSheet } = require('react-native');
    const { setActiveLocale } = require('@/shared/i18n/locale');
    setActiveLocale(locale);
    const { setSoundListReady } = require('@/stores/ui');
    setSoundListReady();
    const rntl = require('@testing-library/react-native');
    const BottomSheetSound = require('../sheets/screens/Sound').default;
    await rntl.render(<BottomSheetSound />);
    const list = rntl.screen.getByTestId('sound-list');
    marginTop = (StyleSheet.flatten(list.props.style) as Record<string, unknown>).marginTop;
  });
  return marginTop;
};
```

The note's foot margin resolves at module scope, so it takes the same isolated
probe (the styles cannot be reached through `VolumeNote.test.tsx`'s top-level
import):

```ts
const noteFootMarginUnder = async (locale: LocaleId): Promise<unknown> => {
  let marginTop: unknown;
  jest.resetModules();
  await jest.isolateModulesAsync(async () => {
    const { StyleSheet } = require('react-native');
    const { setActiveLocale } = require('@/shared/i18n/locale');
    setActiveLocale(locale);
    const rntl = require('@testing-library/react-native');
    const SheetVolumeNote = require('../sheets/parts/VolumeNote').default;
    await rntl.render(<SheetVolumeNote />);
    const copy = rntl.screen.getByText(locale === 'ar' ? /الرنين/ : /Ringer/);
    const foot = copy.parent;
    marginTop = (StyleSheet.flatten(foot?.props.style) as Record<string, unknown>).marginTop;
  });
  return marginTop;
};
```

Then the describe:

```ts
describe('the sound sheet spacing under ar', () => {
  it('tightens the card hint onto the list at 6 points', async () => {
    expect(await soundListMarginUnder('ar')).toBe(6);
  });

  it('keeps the hint gap at 12 under en', async () => {
    expect(await soundListMarginUnder('en')).toBe(12);
  });

  it('opens the note gap to 32 points under ar', async () => {
    expect(await noteFootMarginUnder('ar')).toBe(32);
  });

  it('keeps the note gap at 24 under en', async () => {
    expect(await noteFootMarginUnder('en')).toBe(24);
  });
});
```

The ar cases fail against the planned sha (both margins hold their en values in
every locale today). Record the failing names and lines in `LOG.md`.

## Change contracts

`components/sheets/screens/Sound.tsx`:

- Beside the module-scope `ty`, read
  `const compactArabic = currentLocaleId() === 'ar';` with the one-line comment
  naming D94's pair.
- `styles.listContainer.marginTop` becomes `compactArabic ? 6 : SPACING.md`.
- Add `testID={'sound-list'}` to the list container `View` so the probe reads the
  rendered style.

`components/sheets/parts/VolumeNote.tsx`:

- Beside the module-scope `ty`, read the same `compactArabic`.
- `styles.foot.marginTop` becomes `compactArabic ? 32 : SPACING.xxl`.

## Green run

`npx jest components/__tests__/typographySweep.test.tsx components/sheets/parts/__tests__/VolumeNote.test.tsx components/sheets/screens/__tests__/Sound.test.tsx --watchman=false`
exits 0, then `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0.

## Break script

`bash scripts/breaks/break-05.sh` from the lane root, created in this step as:

```bash
#!/usr/bin/env bash
set -u
cp components/sheets/parts/VolumeNote.tsx "$TMPDIR/break05-note.tsx"
python3 - <<'EOF'
from pathlib import Path
p = Path('components/sheets/parts/VolumeNote.tsx')
s = p.read_text()
old = "marginTop: compactArabic ? 32 : SPACING.xxl,"
new = "marginTop: SPACING.xxl,"
assert old in s, 'anchor for break missing'
p.write_text(s.replace(old, new))
EOF
npx jest components/__tests__/typographySweep.test.tsx --watchman=false -t 'note gap' >"$TMPDIR/break05.log" 2>&1
status=$?
mv "$TMPDIR/break05-note.tsx" components/sheets/parts/VolumeNote.tsx
if [ $status -ne 0 ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "BREAK NOT APPLIED"
fi
```

The first failing line names the 32 point expectation. The script restores the file
and ends `ALL AS EXPECTED: 1`.

## Version and commit

Fetch under the version lock, bump `app.json` then `package.json` one patch above
`lane/100`'s tip. Commit message:
`<VERSION> - fix(sound): the ar preview pair tightens to 6 and the note clears to 32 (D94)`

## Review checklist

- Both en values are byte-identical (`SPACING.md`, `SPACING.xxl`).
- The `testID` addition renders no pixel and the probe removes nothing.
- No other spacing on either file changed.

## Merge

`git checkout lane/100 && git merge --no-ff code/100-sound-spacing -m "<VERSION> - merge code/100-sound-spacing: the sound sheet's ar pair"`

## Restore list

`git checkout -- components/sheets/screens/Sound.tsx components/sheets/parts/VolumeNote.tsx components/__tests__/typographySweep.test.tsx` and delete `scripts/breaks/break-05.sh` if untracked.

## Done when

The checklist box is ticked, the merge landed on `lane/100`, and `LOG.md` carries the
step entry with the hook's `Tests:` line.
