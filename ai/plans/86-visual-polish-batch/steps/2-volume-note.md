# Step 2 - The volume note moves under each sheet's header

Requirements: R2.1, R2.2, R2.3, R2.4

Weight: 2

## Anchor check

```
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/86-visual-polish-batch/scripts/anchors/alert-note-foot.txt components/sheets/screens/Alert.tsx
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/86-visual-polish-batch/scripts/anchors/sound-note-in-card.txt components/sheets/screens/Sound.tsx
```

Each prints `1`.

## Goal

The platform volume note sits at the alert sheet's foot, under the second reminder, and inside
the sound sheet's card under the notification-sound line. Both read badly there. After this
step one shared footnote component sits directly under each sheet's header, above the first
card, drawn as a quiet rule-topped line. The wording does not change.

## Branch

```
git checkout -b feat/86-volume-note uat
```

## Files

- `components/sheets/parts/Note.tsx` (new)
- `components/sheets/parts/index.ts`
- `components/sheets/screens/Alert.tsx`
- `components/sheets/screens/Sound.tsx`
- `components/sheets/parts/__tests__/Note.test.tsx` (new)
- `components/sheets/screens/__tests__/Alert.test.tsx`
- `components/sheets/screens/__tests__/Sound.test.tsx`
- `components/__tests__/typographySweep.test.tsx`

## Red tests

**`components/sheets/parts/__tests__/Note.test.tsx`** (new):

```tsx
/**
 * The sheet footnote: one muted line under a hairline rule
 */

import { render, screen } from '@testing-library/react-native';

import { COLORS } from '@/shared/constants';

import SheetNote from '../Note';

const nodes = () => screen.root?.queryAll((node) => node.props.style !== undefined, { includeSelf: true }) ?? [];

const styleOf = (node: { props: { style: unknown } }): Record<string, unknown> =>
  Array.isArray(node.props.style) ? Object.assign({}, ...node.props.style) : (node.props.style as Record<string, unknown>);

describe('the sheet footnote', () => {
  it('draws its line above a hairline rule', async () => {
    await render(<SheetNote text='Plays at alarm volume, not ring volume.' />);

    expect(screen.getByText('Plays at alarm volume, not ring volume.')).toBeOnTheScreen();
    // The rule is the only node wearing the subtitle ink as a background; it carries no text to find it by
    const rule = nodes().find((node) => styleOf(node).backgroundColor === COLORS.text.sheetSubtitle);
    expect(rule).toBeDefined();
    expect(styleOf(rule as { props: { style: unknown } }).opacity).toBe(0.2);
  });
});
```

**`components/sheets/screens/__tests__/Alert.test.tsx`**: add, inside the top-level
describe, after its cases:

```tsx
  it('carries the volume note under the header, above the Athan card', async () => {
    showLondonDay('2026-09-11', '14:00');
    openSheetFor(FAJR);

    await render(<AlertSheet />);

    const drawn = JSON.stringify(screen.toJSON());
    // Depth-first serialization is the sheet's visual order: header, note, then the first card
    expect(drawn.indexOf(t('volume.note.ios'))).toBeGreaterThan(drawn.indexOf(t('sheet.closeToSave')));
    expect(drawn.indexOf(t('volume.note.ios'))).toBeLessThan(drawn.indexOf(t('alert.card.athan')));
    expect(screen.getAllByText(t('volume.note.ios'))).toHaveLength(1);
  });

  it('carries the alarm-volume wording on Android', async () => {
    onPlatform('android');
    showLondonDay('2026-09-11', '14:00');
    openSheetFor(FAJR);

    await render(<AlertSheet />);

    expect(screen.getAllByText(t('volume.note.android'))).toHaveLength(1);
  });
```

Add `import { t } from '@/shared/i18n';` to the suite's imports.

**`components/sheets/screens/__tests__/Sound.test.tsx`**: add, inside the top-level describe:

```tsx
  it('carries the volume note under the header, above the sound card', async () => {
    showLondonDay('2026-09-11', '14:00');
    setSoundListReady();

    await render(<SoundSheet />);

    const drawn = JSON.stringify(screen.toJSON());
    expect(drawn.indexOf(t('volume.note.ios'))).toBeGreaterThan(drawn.indexOf(t('sound.title')));
    expect(drawn.indexOf(t('volume.note.ios'))).toBeLessThan(drawn.indexOf(t('sound.notificationSound')));
    expect(screen.getAllByText(t('volume.note.ios'))).toHaveLength(1);
  });

  it('carries the alarm-volume wording on Android', async () => {
    onPlatform('android');
    showLondonDay('2026-09-11', '14:00');
    setSoundListReady();

    await render(<SoundSheet />);

    expect(screen.getAllByText(t('volume.note.android'))).toHaveLength(1);
  });
```

The sound sheet's existing setup (the audio mocks and `beforeEach` in the file) already
covers a render; `setSoundListReady()` is what mounts the card. Add
`import { t } from '@/shared/i18n';` to that suite's imports.

**`components/__tests__/typographySweep.test.tsx`**: add `'sheets/parts/Note.tsx'` to
`INVENTORY`. It resolves its styles through `typographyFor` and holds no raw `TEXT.family`,
so both inventory cases pass.

Red evidence: the two new sheet cases print `Expected: -1` and a `Received` of the note's
position, so the comparison fails; the Note suite fails to resolve `../Note`; and the
inventory case fails on the missing import.

```
npx jest components/sheets/parts/__tests__/Note.test.tsx --watchman=false --selectProjects=components
npx jest components/sheets/screens/__tests__/Alert.test.tsx --watchman=false --selectProjects=components
npx jest components/sheets/screens/__tests__/Sound.test.tsx --watchman=false --selectProjects=components
```

## Change contracts

**`components/sheets/parts/Note.tsx`** (new):

```tsx
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, SPACING, TEXT } from '@/shared/constants';
import { currentLocaleId } from '@/shared/i18n/locale';
import { typographyFor } from '@/shared/typography';

interface Props {
  text: string;
}

/**
 * The quiet footnote a sheet draws under its header, above its first card.
 *
 * The line box is pinned from the locale record, so a taller Arabic box cannot
 * push the sheet's content down.
 */
export default function SheetNote({ text }: Props) {
  return (
    <View style={styles.note}>
      <View style={styles.rule} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  note: {
    marginBottom: SPACING.lg,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.text.sheetSubtitle,
    opacity: 0.2,
    marginBottom: SPACING.sm,
  },
  text: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
    lineHeight: ty.blockLineHeight(ty.size(TEXT.sizeDetail)),
  },
});
```

**`components/sheets/parts/index.ts`**: add, in alphabetical position:

```ts
export { default as Note } from './Note';
```

**`components/sheets/screens/Alert.tsx`**

Delete the trailing `Text` the anchor `alert-note-foot.txt` shows, so `AlertSheetBody`'s
fragment ends after the second `ReminderCard`.

Add `<Note text={t(Platform.OS === 'android' ? 'volume.note.android' : 'volume.note.ios')} />`
as the first child of `BottomSheetAlert`'s `Sheet`, before the `sheetState?.isUnavailable`
branch. Import `Note` from `'../parts'`.

**`components/sheets/screens/Sound.tsx`**

Inside the card, delete the second `Text` the anchor `sound-note-in-card.txt` shows, so the
card opens with `{t('sound.notificationSound')}` and then the list container.

Add `<Note text={t(Platform.OS === 'android' ? 'volume.note.android' : 'volume.note.ios')} />`
as the first child of the `Sheet`, before `{soundListReady && (`. Import `Note` from
`'../parts'`.

Neither sheet's `cardHint` style is deleted: both are still used by other lines.

## Green run

```
npx jest components/sheets/parts/__tests__/Note.test.tsx components/sheets/screens/__tests__/Alert.test.tsx components/sheets/screens/__tests__/Sound.test.tsx components/__tests__/typographySweep.test.tsx --watchman=false --selectProjects=components
npx tsc --noEmit
npx biome check . --error-on-warnings
```

## Break script

`scripts/break-step2.sh`, run from the repository root with `bash`, ending
`ALL AS EXPECTED: 1`:

```bash
#!/usr/bin/env bash
# Ticket 86 step 2 break. Run from the repository root with uat holding step 2.
set -u
cp components/sheets/screens/Alert.tsx "$TMPDIR/break86-alert.tsx.bak"

python3 - <<'EOF'
import pathlib
p = pathlib.Path('components/sheets/screens/Alert.tsx')
s = p.read_text()
old = "      <Note text={t(Platform.OS === 'android' ? 'volume.note.android' : 'volume.note.ios')} />\n"
new = ""
assert s.count(old) == 1, "break substitution not found once"
s = s.replace(old, new)
p.write_text(s)
print("break applied: the alert sheet's note removed from under the header")
EOF

npx jest components/sheets/screens/__tests__/Alert.test.tsx -t 'under the header, above the Athan card' --watchman=false --selectProjects=components > "$TMPDIR/break86-step2.log" 2>&1
if grep -q 'carries the volume note under the header' "$TMPDIR/break86-step2.log"; then
  echo "caught: the note is gone from the alert sheet"
  cp "$TMPDIR/break86-alert.tsx.bak" components/sheets/screens/Alert.tsx
  rm "$TMPDIR/break86-alert.tsx.bak"
  echo "ALL AS EXPECTED: 1"
  exit 0
fi
cp "$TMPDIR/break86-alert.tsx.bak" components/sheets/screens/Alert.tsx
rm "$TMPDIR/break86-alert.tsx.bak"
echo "BREAK NOT APPLIED (the note's removal did not fail the order case)"
exit 1
```

## Version and commit

2.0.718, set in the three version files, then:

```
2.0.718 - feat(sheets): the volume note moves under each sheet's header as a footnote
```

Add by name every file listed above, plus the plan files this run changed.

## Review checklist

- Does the note render exactly once per sheet, under the header and above the first card?
- Does the wording stay row 64's platform-keyed pair, with the catalog keys untouched?
- Is the note's box pinned from the locale record rather than left to the font?
- Is `components/sheets/parts/index.ts` the only barrel change, and is the import in both sheets?
- Hunt the shipped classes: Residue (an orphaned style key), Lifecycle (a note that must redraw per open).

## Merge

```
git checkout uat
git merge --no-ff feat/86-volume-note -m "2.0.718 - merge ticket 86 step 2: the volume note under the header"
```

## Done when

Every named test passes, tsc and Biome exit 0, the break script ends `ALL AS EXPECTED: 1`,
the branch is merged, the checklist box is ticked, and `LOG.md` carries the step entry with
its `session:` line.
