# Step 1: WhatsNew's release list scrolls inside a bounded share

Requirements: R1.1, R1.2
Weight: 2

## Anchor check

```bash
cd "$(git rev-parse --show-toplevel)"
for a in wn-list-open wn-list-close wn-styles-list; do
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
    "ai/plans/60-sheet-scroll-regions/scripts/anchors/$a.txt" components/modals/WhatsNew.tsx
done
```

Expected: three lines, each `1`. Any other count: `NEEDS_CONTEXT: NEEDS
REPLAN, <the anchor and its count>`.

## Goal

The item list renders inside a ScrollView bounded to 0.62 of the window
height, so the card can never grow past the screen, and the heading, version
line and Close button stay outside the bound.

## Branch

`git checkout -b code/60-1-whatsnew-bounded-list uat`

## Files

- `components/modals/WhatsNew.tsx` (changed)
- `components/modals/__tests__/WhatsNew.test.tsx` (changed)
- `ai/plans/README.md` (ticket line: `IN PROGRESS, step 1`)
- this plan folder's `PLAN.md` (checklist tick) and `LOG.md`

## Red tests

Add to the `react-native` import line of
`components/modals/__tests__/WhatsNew.test.tsx`:

```tsx
import { BackHandler, DeviceEventEmitter, StyleSheet } from 'react-native';
```

Add this test inside the existing describe, before the Close test:

```tsx
  // A style is read because it is a rule the app keeps: the release list grows with every stamped
  // release, and an unbounded list grows the compact card past the screen (owner, 2026-10-12)
  it('scrolls its items rather than growing past the screen', async () => {
    await render(<ModalWhatsNew visible={true} version='1.27.140' items={[TABLETS, SOUNDS]} onClose={jest.fn()} />);

    // The scroller carries no role, label or text, so it is reached by its host type
    const scroller = screen.root?.queryAll((node) => node.type === 'RCTScrollView')[0];

    expect(StyleSheet.flatten(scroller?.props.style).maxHeight).toBeGreaterThan(0);
    expect(scroller?.props.showsVerticalScrollIndicator).toBe(false);
  });
```

Run:

```bash
npx jest components/modals/__tests__/WhatsNew.test.tsx --watchman=false --selectProjects=components -t 'scrolls its items'
```

Expected red: `TypeError: Cannot read properties of undefined (reading
'maxHeight')` pointing at the flatten line, summary `1 failed, 10 skipped,
11 total`. Any other failure, or a pass: `STOP:`.

## Change contracts

In `components/modals/WhatsNew.tsx`, exactly these five edits:

1. The react-native import becomes:

```tsx
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
```

2. The hook import sits after the `@/components/ui` line (Biome's order,
verified in the planning proof):

```tsx
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
```

3. Below `FAINT_BLUE`:

```tsx
/** The Help modal's list share (owner, 2026-10-12): bounds the release list so the card's heading, version and Close always fit beside it */
const LIST_HEIGHT_SHARE = 0.62;
```

4. The component opens:

```tsx
export default function ModalWhatsNew({ visible, version, items, onClose }: Props) {
  const { height } = useWindowDimensions();

  return (
```

5. The list `View` (anchors `wn-list-open`, `wn-list-close`) becomes a
ScrollView; the `gap` moves to the content container; nothing inside the map
changes:

```tsx
      <ScrollView
        style={[styles.list, { maxHeight: height * LIST_HEIGHT_SHARE }]}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}>
        {items.map((item) => (
          ... the map body unchanged, verbatim ...
        ))}
      </ScrollView>
```

And the styles (anchor `wn-styles-list`) become:

```tsx
  list: {
    width: '100%',
    marginBottom: 36,
  },
  // The gap lives on the content container: a ScrollView's own style never spaces its children
  listContent: {
    gap: SPACING.lg,
  },
```

## Green run

```bash
npx jest components/modals/__tests__/WhatsNew.test.tsx --watchman=false --selectProjects=components
npx tsc --noEmit
npx biome check . --error-on-warnings
```

Expected: `2 passed` is wrong, one file only: `Tests: 11 passed, 11 total`;
tsc exit 0; Biome exit 0.

## Break script

`$TMPDIR/break-60-1.sh`, run with `bash` from the repository root:

```bash
#!/bin/bash
# Break: the release list loses its maxHeight bound; the scroller test must fail
cd "$(git rev-parse --show-toplevel)" || exit 1
perl -0pi -e 's/, \{ maxHeight: height \* LIST_HEIGHT_SHARE \}//' components/modals/WhatsNew.tsx
npx jest components/modals/__tests__/WhatsNew.test.tsx --watchman=false --selectProjects=components -t 'scrolls its items' > "$TMPDIR/break-60-1.log" 2>&1
if grep -q "1 failed" "$TMPDIR/break-60-1.log" && grep -qF "toBeGreaterThan" "$TMPDIR/break-60-1.log"; then
  echo 'ALL AS EXPECTED: 1'
else
  echo 'BREAK NOT APPLIED'
fi
perl -0pi -e 's/style=\{\[styles\.list\]\}/style={[styles.list, { maxHeight: height * LIST_HEIGHT_SHARE }]}/' components/modals/WhatsNew.tsx
```

Expected last line: `ALL AS EXPECTED: 1`, then `git status --porcelain` lists
only this step's files and the plan files.

## Version and commit

Fetch `origin` under the version lock. The version is the next patch after
uat's `package.json` (expected `2.0.99`; the command's answer wins). Set it in
`app.json`, `package.json` and `android/app/build.gradle` (`versionName`),
`app.json` first. Commit message:

```
<VERSION> - fix(modals): WhatsNew release list scrolls inside a bounded height, Close pinned (60 step 1)
```

## Review checklist

- The diff carries the five edits and nothing else; the map body is byte
  identical.
- No `components/sheets/` file, no `Modal.tsx`, no `Help.tsx` in the diff
  (D70).
- The wrapper adds no visible pixel at two items: no padding, margin or colour
  added to the frame beyond the moved `gap` and `marginBottom`.
- No dead style: `styles.list` keeps `width` and `marginBottom`, both read.

## Merge

```bash
git checkout uat && git merge --no-ff code/60-1-whatsnew-bounded-list -m "<VERSION> - merge code/60-1-whatsnew-bounded-list: WhatsNew list bounded (60 step 1)"
```

Delete the branch after the merge.

## Done when

Checklist box ticked in `PLAN.md`, `LOG.md` entry written under
`### Step 01 — done` ending with the `session:` line, merge sha recorded.
