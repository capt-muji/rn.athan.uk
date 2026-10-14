### Step 3 — the wave's own direction and the picker's restated premise

Requirements: R3.1, R3.2
Weight: 2

**Anchor check.** `qibla-wave-read.txt` in `components/sheets/screens/QiblaWave.tsx`, `picker-direction-comment.txt` in `components/sheets/screens/ColorPicker.tsx`, `picker-test-comment.txt` in `components/sheets/screens/__tests__/ColorPicker.test.tsx`, each counting 1.

**Goal.** The Qibla calibration wave mirrors on the locale's own direction, the pattern rows 73 landed for the segmented pill and the switch thumb, folding in the sibling read 73's audit reported to this row. The picker keeps its snapshot keying; the two comments whose premise row 80 changed ("the layout direction follows the live locale") state the library-geometry premise instead.

**Branch.** None beyond `ticket/80`, per the run order.

**Files.**

- `components/sheets/screens/QiblaWave.tsx`
- `components/sheets/screens/ColorPicker.tsx` (one comment block only)
- `components/sheets/screens/__tests__/ColorPicker.test.tsx` (one comment block only)
- `components/sheets/screens/__tests__/QiblaWave.test.tsx` (new)

**Red tests.** A new suite, `components/sheets/screens/__tests__/QiblaWave.test.tsx`, verbatim:

```tsx
/**
 * The calibration wave's mirror: the figure keys on the locale's own direction (row 80),
 * the sibling read row 73 reported — a starved crossing leaves the bridge snapshot at the
 * launch direction while the app already renders the other language
 */
import { render, screen } from '@testing-library/react-native';
import { I18nManager } from 'react-native';

import { setActiveLocale } from '@/shared/i18n/locale';
import { WAVE, wavePath } from '@/shared/qiblaWave';

import QiblaWave from '../QiblaWave';

const SIZE = 300;
const figureWidth = SIZE * WAVE.width;
const figureHeight = SIZE * WAVE.height;

/** The guide path the figure is drawn from, reached through the step's own testID */
const guidePath = () => screen.getByTestId('qibla-wave-guide').props.d;

describe('the calibration wave mirror', () => {
  afterEach(() => {
    setActiveLocale('en');
  });

  it('draws the figure unmirrored under the app English locale', async () => {
    await render(<QiblaWave size={SIZE} />);

    expect(guidePath()).toBe(wavePath(figureWidth, figureHeight, false));
  });

  it('draws the figure mirrored under the app Arabic locale, the bridge snapshot notwithstanding', async () => {
    setActiveLocale('ar');

    await render(<QiblaWave size={SIZE} />);

    expect(I18nManager.getConstants().isRTL).toBe(false);
    expect(guidePath()).toBe(wavePath(figureWidth, figureHeight, true));
  });
});
```

(`@testing-library/react-native` is 14.0.1, which removed the `UNSAFE_*` queries, so the guide path is reached through a `testID` the change contract adds; `props.d` is the host prop react-native-svg carries.)

Red today: both cases fail with `Unable to find an element with testID: qibla-wave-guide` — the reach's testID is the change contract's. Once it lands, the en case is the no-regression guard (green, and it stays green); the ar case's failure mode against a bridge-read implementation is the path-string diff: the received `d` equals `wavePath(figureWidth, figureHeight, false)` (the bridge snapshot reads false in jest) where the mirrored path was expected.

**Change contracts.**

1. `components/sheets/screens/QiblaWave.tsx`:
   - Extend the react-native import to drop `I18nManager` (nothing else in the file reads it) and add the locale import `import { currentLocaleId, localeDirection } from '@/shared/i18n/locale';` in the import group's sorted place.
   - Replace the `qibla-wave-read.txt` anchor with:

```tsx
  // The figure mirrors under RTL; the worklets cannot read react-native, so the direction passes in.
  // The locale's own direction, not the bridge snapshot: a starved crossing (row 78) renders
  // Arabic while I18nManager still reports the launch direction, and row 80's layout keys the
  // same locale — the wave and the layout must not disagree
  const isRTL = localeDirection(currentLocaleId()) === 'rtl';
```

   - The static guide Path inside the Svg (the one whose `d` is `wavePath(figureWidth, figureHeight, isRTL)`) gains `testID={'qibla-wave-guide'}` beside its `d` prop; the red suite reaches it that way.

2. `components/sheets/screens/ColorPicker.tsx`: replace the `picker-direction-comment.txt` anchor's comment (the `pickerDirection` line beneath it is untouched) with:

```tsx
  // The picker library snapshots I18nManager.isRTL at module load and writes its geometry
  // for that snapshot, so the panel resolves the direction the same snapshot took: the
  // library's geometry and the layout it draws stay in step in every launch state (a
  // starved crossing snapshots false, a completed one true)
```

3. `components/sheets/screens/__tests__/ColorPicker.test.tsx`: replace the `picker-test-comment.txt` anchor's lines with:

```tsx
  // The library snapshots I18nManager.isRTL at module load and writes its geometry for that
  // value, so the picker's resolved direction keys on the same snapshot: the geometry and
  // its layout stay in step in every launch state (row 73)
```

**Green run.** `npx jest components/sheets/screens/__tests__/QiblaWave.test.tsx components/sheets/screens/__tests__/ColorPicker.test.tsx components/sheets/screens/__tests__/Qibla.test.tsx --watchman=false --selectProjects=components` — all green (the Qibla sheet's own suite proves the wave still mounts inside it). Then tsc and Biome at 0.

**Break script.** `$TMPDIR/t80-break-3.sh`:

```bash
#!/usr/bin/env bash
set -u
cd "$HOME/athan-gitree/run-80" || exit 1
cp components/sheets/screens/QiblaWave.tsx "$TMPDIR/t80-wave.bak"
sed -i '' 's/const isRTL = localeDirection(currentLocaleId()) === .rtl.;/const isRTL = I18nManager.getConstants().isRTL;/' components/sheets/screens/QiblaWave.tsx
sed -i '' "s|import { StyleSheet, View } from 'react-native';|import { I18nManager, StyleSheet, View } from 'react-native';|" components/sheets/screens/QiblaWave.tsx
failed=0
npx jest components/sheets/screens/__tests__/QiblaWave.test.tsx --watchman=false --selectProjects=components > "$TMPDIR/t80-break-3.log" 2>&1 || failed=1
grep -q 'mirrored under the app Arabic locale' "$TMPDIR/t80-break-3.log" || failed=$((failed + 10))
cp "$TMPDIR/t80-wave.bak" components/sheets/screens/QiblaWave.tsx
if [ "$failed" -eq 1 ]; then echo "ALL AS EXPECTED: 1"; else echo "BREAK NOT APPLIED ($failed)"; fi
```

Expected: `ALL AS EXPECTED: 1` — the reverted read leaves the ar case red. The second sed re-adds the `I18nManager` import the green tree dropped, so the reverted read resolves rather than ReferenceErroring; the backup restores the green file after.

**Mutation pass.** (a) `const isRTL = false;` — the ar case fails; (b) the guide path's `isRTL` argument swapped to its negation inside `wavePath`'s call in the component — both cases fail. Record both, then restore.

**Version and commit.** Version 2.0.407. Commit message:

```
2.0.407 - fix(qibla): the calibration wave mirrors on the locale's own direction; the picker's premise restated
```

**Review.** Read the diff cold against: no drawing constant moved (the wave arithmetic is untouched); the picker diff is two comment blocks and nothing else; the new suite asserts the starved-state premise explicitly.

**Done when.** Step 3's checklist box is ticked and LOG.md carries the entry.
