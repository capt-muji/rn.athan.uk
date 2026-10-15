# Step 4 — the qibla sheet header's ar gap

Requirements: R4.1, R9.1
Weight: 2

## Anchor check

`python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' scripts/anchors/07-qibla-subtitle.md components/sheets/screens/Qibla.tsx`
prints `1`. Any other count is `NEEDS_CONTEXT: NEEDS REPLAN`.

## Goal

Under ar the qibla sheet's own subtitle pulls up 10 points, matching the shared
header's confirmed treatment. The qibla sheet renders its subtitle as a node, so
`Header` draws it raw and the shared subtitle style never reaches it; its own
`subtitle` style carries the gap today.

## Branch

`git checkout -b code/100-qibla-gap lane/100`

## Files

- `components/sheets/screens/Qibla.tsx` (changed)
- `components/__tests__/typographySweep.test.tsx` (changed, new probe)

## Red tests

In `components/__tests__/typographySweep.test.tsx`, add beside
`headerSubtitleStyleUnder` a probe that renders the qibla sheet's subtitle style
under one locale, following the file's `isolateModulesAsync` shape:

```ts
const qiblaSubtitleStyleUnder = async (locale: LocaleId): Promise<Record<string, unknown>> => {
  let subtitle: Record<string, unknown> = {};
  jest.resetModules();
  await jest.isolateModulesAsync(async () => {
    const { StyleSheet } = require('react-native');
    const { setActiveLocale } = require('@/shared/i18n/locale');
    setActiveLocale(locale);
    const rntl = require('@testing-library/react-native');
    const QiblaSubtitle = require('../sheets/screens/Qibla').QiblaSubtitle;
    await rntl.render(<QiblaSubtitle showsCompass={false} />);
    subtitle = StyleSheet.flatten(
      rntl.screen.getByTestId('qibla-subtitle-waiting').props.style
    ) as Record<string, unknown>;
  });
  return subtitle;
};
```

`QiblaSubtitle` is module-local today, so exporting it is part of the change (below).
Then a describe:

```ts
describe('the qibla sheet subtitle', () => {
  it('pulls up 10 points under ar, matching the shared header', async () => {
    expect((await qiblaSubtitleStyleUnder('ar')).marginTop).toBe(-10);
  });

  it('keeps its 4 point gap under en', async () => {
    expect((await qiblaSubtitleStyleUnder('en')).marginTop).toBe(4);
  });
});
```

Both cases fail pre-change because `QiblaSubtitle` is module-local until the export
lands; after the export, only the ar value assertion stays failing (today
`marginTop` is `SPACING.xs`, 4, in both locales). Record the failing names and
lines in `LOG.md`.

## Change contracts

`components/sheets/screens/Qibla.tsx`:

- Export `QiblaSubtitle` (`export const QiblaSubtitle = ...`) so the probe can render
  it; its behaviour is unchanged.
- Beside the module-scope `ty`, read
  `const compactArabic = currentLocaleId() === 'ar';` exactly as `Header.tsx` does,
  with the same one-line comment shape naming the confirmed sheets.
- `styles.subtitle.marginTop` becomes `compactArabic ? -10 : SPACING.xs`.

`components/sheets/screens/Qibla.test.tsx` stays green untouched: its 21
title/subtitle hits are content assertions.

## Green run

`npx jest components/__tests__/typographySweep.test.tsx components/sheets/screens/__tests__/Qibla.test.tsx --watchman=false`
exits 0, then `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0.

## Break script

`bash scripts/breaks/break-04.sh` from the lane root, created in this step as:

```bash
#!/usr/bin/env bash
set -u
cp components/sheets/screens/Qibla.tsx "$TMPDIR/break04-qibla.tsx"
python3 - <<'EOF'
from pathlib import Path
p = Path('components/sheets/screens/Qibla.tsx')
s = p.read_text()
old = "marginTop: compactArabic ? -10 : SPACING.xs,"
new = "marginTop: SPACING.xs,"
assert old in s, 'anchor for break missing'
p.write_text(s.replace(old, new))
EOF
npx jest components/__tests__/typographySweep.test.tsx --watchman=false -t 'qibla sheet subtitle' >"$TMPDIR/break04.log" 2>&1
status=$?
mv "$TMPDIR/break04-qibla.tsx" components/sheets/screens/Qibla.tsx
if [ $status -ne 0 ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "BREAK NOT APPLIED"
fi
```

The first failing line names the ar pull-up expectation. The script restores the
file and ends `ALL AS EXPECTED: 1`.

## Version and commit

Fetch under the version lock, bump `app.json` then `package.json` one patch above
`lane/100`'s tip. Commit message:
`<VERSION> - fix(qibla): the sheet's own subtitle takes the confirmed ar header gap`

## Review checklist

- The en style value is byte-identical (`SPACING.xs`).
- `QiblaSubtitle`'s rendering, fade and donor are untouched; only the export and the
  margin changed.
- The comment names why (the node subtitle bypasses the shared style).

## Merge

`git checkout lane/100 && git merge --no-ff code/100-qibla-gap -m "<VERSION> - merge code/100-qibla-gap: the compass header's ar gap"`

## Restore list

`git checkout -- components/sheets/screens/Qibla.tsx components/__tests__/typographySweep.test.tsx` and delete `scripts/breaks/break-04.sh` if untracked.

## Done when

The checklist box is ticked, the merge landed on `lane/100`, and `LOG.md` carries the
step entry with the hook's `Tests:` line.
