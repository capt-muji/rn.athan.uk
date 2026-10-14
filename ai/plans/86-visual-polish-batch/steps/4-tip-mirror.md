# Step 4 - The countdown tip mirrors with the layout

Requirements: R4.1, R4.2, R4.3, R4.4, R4.5

Weight: 2

## Anchor check

```
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/86-visual-polish-batch/scripts/anchors/tip-geometry.txt components/countdown/tipGeometry.ts
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/86-visual-polish-batch/scripts/anchors/bar-tip-style.txt components/countdown/Bar.tsx
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/86-visual-polish-batch/scripts/anchors/bar-fill-style.txt components/countdown/Bar.tsx
```

Each prints `1`.

## Goal

Under Arabic the bar's tip renders apart from the filled run: the fill is anchored to the
track's right edge by the RTL layout while the tip's `left` is a physical value computed as
though the fill grew from the left. The owner ruled the bar mirrors with the layout. After
this step the fill's anchored edge and the tip's left come from one direction argument, and
the English values are byte-identical to today's.

## Branch

```
git checkout -b feat/86-tip-mirror uat
```

## Files

- `components/countdown/tipGeometry.ts`
- `components/countdown/Bar.tsx`
- `scripts/directional-styles-allowlist.json`
- `components/countdown/__tests__/tipGeometry.test.ts`
- `components/countdown/__tests__/Bar.test.tsx`

## Red tests

**`components/countdown/__tests__/tipGeometry.test.ts`**: every existing call gains `false`
as its second argument; not one assertion changes. Then add:

```ts
describe('the tip under a right-to-left layout', () => {
  it('mirrors every ordinary position about the track', () => {
    // 65 is the colour picker's preview; the mirror must not move it either
    for (const progress of [10, 25, 50, 65, 75, 90]) {
      expect(tipLeftForProgress(progress, true)).toBeCloseTo(COUNTDOWN_BAR.WIDTH - unclamped(progress), 10);
    }
  });

  it('keeps the oval inside the track at both ends', () => {
    expect(leftEdge(tipLeftForProgress(0, true))).toBeGreaterThanOrEqual(0);
    expect(rightEdge(tipLeftForProgress(100, true))).toBeLessThanOrEqual(COUNTDOWN_BAR.WIDTH);
  });

  it('keeps it inside across the whole range', () => {
    const outside: number[] = [];

    for (let progress = 0; progress <= 100; progress += 0.5) {
      const left = tipLeftForProgress(progress, true);
      if (leftEdge(left) < 0 || rightEdge(left) > COUNTDOWN_BAR.WIDTH) outside.push(progress);
    }

    expect(outside).toEqual([]);
  });

  it('never moves forwards as progress grows', () => {
    let previous = tipLeftForProgress(0, true);

    for (let progress = 0.5; progress <= 100; progress += 0.5) {
      const left = tipLeftForProgress(progress, true);
      expect(left).toBeLessThanOrEqual(previous);
      previous = left;
    }
  });
});

describe('fillAnchorFor', () => {
  it('anchors the fill to the track's leading edge in each direction', () => {
    expect(fillAnchorFor(false)).toEqual({ left: 0 });
    expect(fillAnchorFor(true)).toEqual({ right: 0 });
  });
});
```

Extend the import to `import { TIP_OVAL_WIDTH, fillAnchorFor, tipLeftForProgress } from '../tipGeometry';`.

**`components/countdown/__tests__/Bar.test.tsx`**: add:

```tsx
const flattenStyle = (style: unknown): Record<string, unknown> =>
  Array.isArray(style)
    ? Object.assign({}, ...style.map((entry) => flattenStyle(entry)))
    : (style as Record<string, unknown>);

/**
 * The bar's fill. The wrapper is the accessible progressbar, its first child is
 * the track and the track's first child is the fill, which carries no role,
 * label or text of its own to find it by.
 */
const fillStyle = (): Record<string, unknown> => {
  const wrapper = screen.getByRole('progressbar', { includeHiddenElements: true });
  const track = wrapper.children[0] as unknown as { children: unknown[] };
  return flattenStyle((track.children[0] as { props: { style: unknown } }).props.style);
};

describe('the bar direction, Friday 11 September 2026 at 14:00', () => {
  it('anchors the fill to the track's left edge under English', async () => {
    showLondonDay('2026-09-11', '14:00');

    await render(<Bar type={ScheduleType.Standard} />);

    expect(fillStyle().left).toBe(0);
    expect(fillStyle().right).toBeUndefined();
  });

  it('anchors the fill to the track's right edge under Arabic', async () => {
    setActiveLocale('ar');
    try {
      showLondonDay('2026-09-11', '14:00');

      await render(<Bar type={ScheduleType.Standard} />);

      expect(fillStyle().right).toBe(0);
      expect(fillStyle().left).toBeUndefined();
    } finally {
      setActiveLocale('en');
    }
  });
});
```

Add `setActiveLocale` to the suite's imports from `@/shared/i18n/locale`.

Red evidence: the new tip suite prints `Expected: 90.9` and `Received: 9.1`, the anchor
suite prints `Expected: 0` and `Received: undefined`, and tsc fails on every one-argument
call.

```
npx jest components/countdown/__tests__/tipGeometry.test.ts --watchman=false --selectProjects=unit
npx jest components/countdown/__tests__/Bar.test.tsx --watchman=false --selectProjects=components
```

## Change contracts

**`components/countdown/tipGeometry.ts`**

Add to the file's header comment, after the paragraph about Yoga centring the oval:

```
 *
 * Under a right-to-left layout the fill is anchored to the track's right edge,
 * so the tip's own left is the mirror of its left-to-right value: the offset
 * that sits left of the fill's leading edge sits to its right instead. Both
 * come from the same direction argument, so the fill and the tip can never
 * disagree.
```

Replace `tipLeftForProgress` with:

```ts
export const tipLeftForProgress = (progressPercent: number, isRTL: boolean): number => {
  'worklet';
  const half = TIP_OVAL_WIDTH / 2;
  const span = (progressPercent / 100) * COUNTDOWN_BAR.WIDTH;
  const raw = isRTL ? COUNTDOWN_BAR.WIDTH - span + COUNTDOWN_TIP.OFFSET : span - COUNTDOWN_TIP.OFFSET;

  return Math.min(Math.max(raw, half), COUNTDOWN_BAR.WIDTH - half);
};
```

Add below it:

```ts
/**
 * The edge the fill grows from: the track's leading edge in each direction, so
 * the tip's own left is measured against the same edge the fill is anchored to.
 *
 * @param isRTL Whether the layout reads right to left
 * @returns The fill's anchor inset
 */
export const fillAnchorFor = (isRTL: boolean): ViewStyle => (isRTL ? { right: 0 } : { left: 0 });
```

One line on purpose: `scripts/check-directional-styles.js` bans physical `left:` and `right:`
style keys across `components/`, counting one hit per line, so a single-expression body takes
one allowlist entry. Add `import type { ViewStyle } from 'react-native';` above the
`@/shared/constants` import.

The existing doc comment above `tipLeftForProgress` keeps its clamp explanation and gains
the second parameter's line: `@param isRTL Whether the layout reads right to left`.

**`scripts/directional-styles-allowlist.json`**

Add one entry, at the end of the array:

```json
  {
    "file": "components/countdown/tipGeometry.ts",
    "snippet": "isRTL ? { right: 0 } : { left: 0 }",
    "reason": "the fill's anchor is the physical key the direction argument selects; no logical key can express a per-direction layout"
  },
```

Rewrite the existing `components/countdown/Bar.tsx` entry's `reason` (its snippet still
matches, so the entry stays):

```json
    "reason": "the tip's left is the physical value the direction-keyed geometry returns; a worklet offset has no logical key"
```

**`components/countdown/Bar.tsx`**

Import `fillAnchorFor` beside `tipLeftForProgress`, and add
`import { currentLocaleId, localeDirection } from '@/shared/i18n/locale';`.

Inside the component, beside the atom reads:

```ts
  // Read at render, the directionGlyph pattern: a crossing pick relaunches the context,
  // so no stale direction can outlive a switch
  const isRTL = localeDirection(currentLocaleId()) === 'rtl';
```

The tip's style becomes:

```ts
  const tipPositionStyle = useAnimatedStyle(() => ({
    left: tipLeftForProgress(widthValue.value, isRTL),
  }));
```

Add beside it:

```ts
  const fillAnchorStyle = fillAnchorFor(isRTL);
```

The fill node's style becomes `[styles.bar, fillAnchorStyle, barWidthStyle, barColorStyle]`.
No other node changes, and the numerals, the colours, the widths and the timings stay as they
are.

## Green run

```
npx jest components/countdown/__tests__/tipGeometry.test.ts --watchman=false --selectProjects=unit
npx jest components/countdown/__tests__/Bar.test.tsx --watchman=false --selectProjects=components
node scripts/check-directional-styles.js
npx tsc --noEmit
npx biome check . --error-on-warnings
```

The direction gate must print `DIRECTIONAL STYLES OK`.

## Break script

`scripts/break-step4.sh`, run from the repository root with `bash`, ending
`ALL AS EXPECTED: 1`:

```bash
#!/usr/bin/env bash
# Ticket 86 step 4 break. Run from the repository root with uat holding step 4.
set -u
cp components/countdown/tipGeometry.ts "$TMPDIR/break86-tip.ts.bak"

python3 - <<'EOF'
import pathlib
p = pathlib.Path('components/countdown/tipGeometry.ts')
s = p.read_text()
old = "  const raw = isRTL ? COUNTDOWN_BAR.WIDTH - span + COUNTDOWN_TIP.OFFSET : span - COUNTDOWN_TIP.OFFSET;"
new = "  const raw = span - COUNTDOWN_TIP.OFFSET;"
assert s.count(old) == 1, "break substitution not found once"
s = s.replace(old, new)
p.write_text(s)
print("break applied: the tip ignores the layout direction again")
EOF

npx jest components/countdown/__tests__/tipGeometry.test.ts -t 'mirrors every ordinary position' --watchman=false --selectProjects=unit > "$TMPDIR/break86-step4.log" 2>&1
if grep -q 'mirrors every ordinary position' "$TMPDIR/break86-step4.log"; then
  echo "caught: the RTL tip is back at its LTR left"
  cp "$TMPDIR/break86-tip.ts.bak" components/countdown/tipGeometry.ts
  rm "$TMPDIR/break86-tip.ts.bak"
  echo "ALL AS EXPECTED: 1"
  exit 0
fi
cp "$TMPDIR/break86-tip.ts.bak" components/countdown/tipGeometry.ts
rm "$TMPDIR/break86-tip.ts.bak"
echo "BREAK NOT APPLIED (the unmirrored tip did not fail the mirror case)"
exit 1
```

Then run the direction gate, which must print `DIRECTIONAL STYLES OK`:

```
node scripts/check-directional-styles.js
```

A hit whose line is not the allowlisted one: replace the entry's `snippet` with the exact
printed line and rerun. An allowlist entry the gate reports stale: remove it.

## Version and commit

2.0.720, set in the three version files, then:

```
2.0.720 - fix(countdown): the bar tip mirrors with the layout direction
```

Add by name: the four files above and the plan files this run changed.

## Review checklist

- Does `tipLeftForProgress` return the pre-change value for every progress when `isRTL` is false?
- Is the direction read at render from the app locale, never from a module-load snapshot?
- Does the fill carry exactly one anchor inset, and is `styles.bar` otherwise unchanged?
- Does `node scripts/check-directional-styles.js` print `DIRECTIONAL STYLES OK`, with the new entry's snippet matching the line it names?
- Are the numerals, colours, widths and timings untouched?
- Hunt the shipped classes: Thread (a worklet calling a non-worklet import — the direction is a plain argument here), Rule (a substituted value).

## Merge

```
git checkout uat
git merge --no-ff feat/86-tip-mirror -m "2.0.720 - merge ticket 86 step 4: the countdown tip mirror"
```

## Done when

Every named test passes, tsc and Biome exit 0, the break script ends `ALL AS EXPECTED: 1`,
the branch is merged, the checklist box is ticked, and `LOG.md` carries the step entry with
its `session:` line.
