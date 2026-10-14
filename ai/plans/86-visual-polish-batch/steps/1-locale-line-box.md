# Step 1 - The locale line box for the sheet header and the day block

Requirements: R1.1, R1.2, R1.3, R1.4

Weight: 2

## Anchor check

Run the pre-flight's anchor check, or verify these three by hand before starting:

```
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/86-visual-polish-batch/scripts/anchors/header-type-styles.txt components/sheets/parts/Header.tsx
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/86-visual-polish-batch/scripts/anchors/day-type-styles.txt components/day/Day.tsx
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/86-visual-polish-batch/scripts/anchors/typography-script-line.txt shared/typography.ts
```

Each prints `1`. Any other number is `NEEDS_CONTEXT: NEEDS REPLAN` with the count.

## Goal

Under Arabic the sheet header's title-to-subtitle gap runs about 110 device pixels against
English's 65, and the date block above the prayer list sits about 24 device pixels lower than
English's. Both come from the font's own line box: the header sets no line height, and the
day block sets a 1.5x box through `scriptLineHeight`. After this step both surfaces take one
pinned box per locale, so the Arabic block measures what its English twin measures and the
English styles carry no line height at all.

## Branch

```
git checkout -b feat/86-locale-line-box uat
```

## Files

- `shared/typography.ts`
- `components/sheets/parts/Header.tsx`
- `components/day/Day.tsx`
- `components/__tests__/typographySweep.test.tsx`
- `components/day/__tests__/DayLines.test.tsx`

## Red tests

Write these first, run them, and record the exact failing lines in `LOG.md`.

**`components/__tests__/typographySweep.test.tsx`**: add a subtitle probe beside
`headerTitleStyleUnder`, in the same shape:

```tsx
const headerSubtitleStyleUnder = async (locale: LocaleId): Promise<Record<string, unknown>> => {
  let subtitle: Record<string, unknown> = {};
  jest.resetModules();
  await jest.isolateModulesAsync(async () => {
    const { StyleSheet } = require('react-native');
    const { setActiveLocale } = require('@/shared/i18n/locale');
    setActiveLocale(locale);
    const rntl = require('@testing-library/react-native');
    const BottomSheetHeader = require('../sheets/parts/Header').default;
    await rntl.render(<BottomSheetHeader title='Settings' subtitle='Set your preferences' icon={null} />);
    subtitle = StyleSheet.flatten(rntl.screen.getByText('Set your preferences').props.style) as Record<string, unknown>;
  });
  return subtitle;
};
```

and a new describe at the end of the file:

```tsx
describe('the sheet header line boxes', () => {
  it('gives the ar title and subtitle the Latin default box, so the gap matches English', async () => {
    const title = await headerTitleStyleUnder('ar');
    const subtitle = await headerSubtitleStyleUnder('ar');

    expect(title.lineHeight).toBe(26);
    expect(subtitle.lineHeight).toBe(16);
  });

  it('leaves the en title and subtitle to the font own box', async () => {
    const title = await headerTitleStyleUnder('en');
    const subtitle = await headerSubtitleStyleUnder('en');

    expect(title.lineHeight).toBeUndefined();
    expect(subtitle.lineHeight).toBeUndefined();
  });
});
```

**`components/day/__tests__/DayLines.test.tsx`**: the existing expectations become the Latin
default. Change `toBe(24)` to `toBe(19)` and `toBe(27)` to `toBe(21)`, and replace the
comment above them with:

```
      // The owner's ruling, 2026-10-14: the ar block measures what the English block measures
```

The en assertion (`toBeUndefined()`) does not change.

Red evidence: under today's code the first new sweep case prints `Expected: 26` and
`Received: undefined`, and the day suite prints `Expected: 19` and `Received: 24`.

Run:

```
npx jest components/__tests__/typographySweep.test.tsx --watchman=false --selectProjects=components
npx jest components/day/__tests__/DayLines.test.tsx --watchman=false --selectProjects=components
```

## Change contracts

**`shared/typography.ts`**

Add one field to `LocaleTypography`, directly after `scriptLineHeight`:

```ts
  /** The box the platform's Latin default gives at this size, so an Arabic surface measures what its English twin measures; undefined on the Latin records, where the font's own box is the target */
  blockLineHeight: (n: number) => number | undefined;
```

Add one constant above `ARABIC`:

```ts
/** Roboto's own ascent plus descent (2400/2048): the box the Latin records already render */
const LATIN_LINE_RATIO = 1.171875;
```

`ARABIC` gains one line after `scriptLineHeight`:

```ts
  blockLineHeight: (n) => Math.round(n * LATIN_LINE_RATIO),
```

`LATIN` gains one line too:

```ts
  blockLineHeight: () => undefined,
```

The field is not optional, so a new locale record must state its answer, and the consumers
call it directly rather than through `?.`: the English answer is `undefined`, which leaves
RN's `lineHeight` unset exactly as it is today.

`scriptLineHeight` stays optional: `components/prayer/Explanation.tsx` still consumes it,
and its long-form Arabic strings carry the diacritics that need the taller box.

**`components/sheets/parts/Header.tsx`**

The `title` style gains, directly after `fontSize`:

```ts
    lineHeight: ty.blockLineHeight(ty.size(22)),
```

The `subtitle` style gains, directly after `fontSize`:

```ts
    lineHeight: ty.blockLineHeight(ty.size(TEXT.sizeDetail)),
```

No other key changes: the families, sizes, colours, letter spacing and margins stay.

**`components/day/Day.tsx`**

The `location` style's line becomes:

```ts
    lineHeight: ty.blockLineHeight(ty.size(TEXT.sizeSmall)),
```

The `date` style's line becomes:

```ts
    lineHeight: ty.blockLineHeight(ty.size(TEXT.size)),
```

No other key changes.

## Green run

```
npx jest components/__tests__/typographySweep.test.tsx components/day/__tests__/DayLines.test.tsx --watchman=false --selectProjects=components
npx tsc --noEmit
npx biome check . --error-on-warnings
```

Every test passes, and both commands exit 0.

## Break script

`scripts/break-step1.sh`, run from the repository root with `bash`. It ends
`ALL AS EXPECTED: 1`.

```bash
#!/usr/bin/env bash
# Ticket 86 step 1 break. Run from the repository root with uat holding step 1.
set -u
cp shared/typography.ts "$TMPDIR/break86-typography.ts.bak"

python3 - <<'EOF'
import pathlib
p = pathlib.Path('shared/typography.ts')
s = p.read_text()
old = "  blockLineHeight: (n) => Math.round(n * LATIN_LINE_RATIO),"
new = "  blockLineHeight: (n) => Math.round(n * 1.5),"
assert s.count(old) == 1, "break substitution not found once"
s = s.replace(old, new)
p.write_text(s)
print("break applied: the ar box back to the 1.5x script box")
EOF

npx jest components/__tests__/typographySweep.test.tsx -t 'Latin default box' --watchman=false --selectProjects=components > "$TMPDIR/break86-step1.log" 2>&1
if grep -q 'the ar title and subtitle the Latin default box' "$TMPDIR/break86-step1.log"; then
  echo "caught: the ar title box is 33 again, so the gap returns"
  cp "$TMPDIR/break86-typography.ts.bak" shared/typography.ts
  rm "$TMPDIR/break86-typography.ts.bak"
  echo "ALL AS EXPECTED: 1"
  exit 0
fi
cp "$TMPDIR/break86-typography.ts.bak" shared/typography.ts
rm "$TMPDIR/break86-typography.ts.bak"
echo "BREAK NOT APPLIED (the ar title box did not move to 33)"
exit 1
```

After the break script, `git status --porcelain` lists only this step's files and the plan
files.

## Version and commit

Take the version under the lock (see `PLAN.md` section 6; step 1 expects 2.0.717). Set it in
`app.json`, `package.json` and `android/app/build.gradle`, then commit with:

```
2.0.717 - feat(typography): the sheet header and the day block pin the Latin line box under ar
```

Add by name: `shared/typography.ts`, `components/sheets/parts/Header.tsx`,
`components/day/Day.tsx`, `components/__tests__/typographySweep.test.tsx`,
`components/day/__tests__/DayLines.test.tsx`, and the plan files this run changed.

The commit's `Tests:` line ends `passed, <n> total` and the four coverage lines read `100%`.

## Review checklist

Read `git show <sha>` cold and answer each:

- Does `blockLineHeight` answer the pinned ratio on the Arabic record and `undefined` on the Latin one, and is the ratio the documented constant?
- Is the English answer `undefined`, so no English line box is written?
- Do the header's and the day block's families, sizes, colours and margins stay exactly as the anchors show them?
- Does `scriptLineHeight` still exist and still serve `Explanation.tsx`?
- Hunt the shipped classes: Residue (a key declared and unread), Rule (a value standing in for a live one).

## Merge

```
git checkout uat
git merge --no-ff feat/86-locale-line-box -m "2.0.717 - merge ticket 86 step 1: the locale line box"
```

## Done when

Every named test passes, tsc and Biome exit 0, the break script ends `ALL AS EXPECTED: 1`,
the branch is merged into `uat`, the checklist box is ticked, and `LOG.md` carries the step
entry with its `session:` line.
