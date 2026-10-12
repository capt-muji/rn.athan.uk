# Step 2: Update's message scrolls inside a bounded share

Requirements: R2.1, R2.2
Weight: 2

## Anchor check

```bash
cd "$(git rev-parse --show-toplevel)"
for a in update-message update-styles-message; do
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
    "ai/plans/60-sheet-scroll-regions/scripts/anchors/$a.txt" components/modals/Update.tsx
done
```

Expected: two lines, each `1`. Any other count: `NEEDS_CONTEXT: NEEDS
REPLAN, <the anchor and its count>`. These anchors match pristine
`Update.tsx`; step 1 does not touch this file.

## Goal

The message renders inside a ScrollView bounded to 0.62 of the window height,
so the card can never grow past the screen, and the title and both choice
buttons stay outside the bound. At today's copy lengths the bound never
engages, so no pixel moves.

## Branch

`git checkout -b code/60-2-update-bounded-message uat`

## Files

- `components/modals/Update.tsx` (changed)
- `components/modals/__tests__/Update.test.tsx` (changed)
- `ai/plans/README.md` (ticket line: `IN PROGRESS, step 2`)
- this plan folder's `PLAN.md` (checklist tick) and `LOG.md`

## Red tests

Add to the `react-native` import line of
`components/modals/__tests__/Update.test.tsx`:

```tsx
import { BackHandler, DeviceEventEmitter, StyleSheet } from 'react-native';
```

Add this test inside the existing describe, before the
`reports Later as closing the prompt without updating` test:

```tsx
  // A style is read because it is a rule the app keeps: the message is bounded so the card can
  // never grow past the screen in a longer language (owner, 2026-10-12)
  it('bounds its message rather than growing past the screen', async () => {
    await render(<ModalUpdate visible={true} onClose={jest.fn()} onUpdate={jest.fn()} />);

    // The scroller carries no role, label or text, so it is reached by its host type
    const scroller = screen.root?.queryAll((node) => node.type === 'RCTScrollView')[0];

    expect(StyleSheet.flatten(scroller?.props.style).maxHeight).toBeGreaterThan(0);
    expect(scroller?.props.showsVerticalScrollIndicator).toBe(false);
  });
```

Run:

```bash
npx jest components/modals/__tests__/Update.test.tsx --watchman=false --selectProjects=components -t 'bounds its message'
```

Expected red: `TypeError: Cannot read properties of undefined (reading
'maxHeight')` pointing at the flatten line, summary `1 failed, 7 skipped,
8 total`. Any other failure, or a pass: `STOP:`.

## Change contracts

In `components/modals/Update.tsx`, exactly these five edits:

1. The react-native import becomes:

```tsx
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
```

2. The hook import sits before `@/shared/constants` (Biome's order, verified
in the planning proof):

```tsx
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { COLORS, RADIUS, SIZE, SPACING, TEXT } from '@/shared/constants';
```

3. Below `import Modal from './Modal';`:

```tsx
/** The Help modal's list share (owner, 2026-10-12): bounds the message so the card can never grow past the screen, never reached by today's copy */
const MESSAGE_HEIGHT_SHARE = 0.62;
```

4. The component opens:

```tsx
export default function ModalUpdate({ visible, onClose, onUpdate }: Props) {
  const { height } = useWindowDimensions();

  return (
```

5. The message `Text` (anchor `update-message`) is wrapped, and the bottom gap
moves to the frame so it never scrolls away with the text:

```tsx
      <ScrollView
        style={[styles.messageScroll, { maxHeight: height * MESSAGE_HEIGHT_SHARE }]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.message}>{t('update.message')}</Text>
      </ScrollView>
```

And the styles (anchor `update-styles-message`): `styles.message` loses
`marginBottom: 36` and keeps every other line unchanged; a new style follows
it:

```tsx
  // Stretched so the centred text keeps the card's full width: unstretched, the scroller hugs the text
  messageScroll: {
    alignSelf: 'stretch',
    marginBottom: 36,
  },
```

## Green run

```bash
npx jest components/modals/__tests__/Update.test.tsx --watchman=false --selectProjects=components
npx tsc --noEmit
npx biome check . --error-on-warnings
```

Expected: `Tests: 8 passed, 8 total`; tsc exit 0; Biome exit 0.

## Break script

`$TMPDIR/break-60-2.sh`, run with `bash` from the repository root:

```bash
#!/bin/bash
# Break: the message loses its maxHeight bound; the scroller test must fail
cd "$(git rev-parse --show-toplevel)" || exit 1
perl -0pi -e 's/, \{ maxHeight: height \* MESSAGE_HEIGHT_SHARE \}//' components/modals/Update.tsx
npx jest components/modals/__tests__/Update.test.tsx --watchman=false --selectProjects=components -t 'bounds its message' > "$TMPDIR/break-60-2.log" 2>&1
if grep -q "1 failed" "$TMPDIR/break-60-2.log" && grep -qF "toBeGreaterThan" "$TMPDIR/break-60-2.log"; then
  echo 'ALL AS EXPECTED: 1'
else
  echo 'BREAK NOT APPLIED'
fi
perl -0pi -e 's/style=\{\[styles\.messageScroll\]\}/style={[styles.messageScroll, { maxHeight: height * MESSAGE_HEIGHT_SHARE }]}/' components/modals/Update.tsx
```

Expected last line: `ALL AS EXPECTED: 1`, then `git status --porcelain` lists
only this step's files and the plan files.

## Version and commit

Fetch `origin` under the version lock. The version is the next patch after
uat's `package.json` (expected `2.0.100`; the command's answer wins). Set it
in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`),
`app.json` first. Commit message:

```
<VERSION> - fix(modals): update prompt message bounded by a scroll region (60 step 2)
```

## Review checklist

- The diff carries the five edits and nothing else.
- No `components/sheets/` file, no `Modal.tsx`, no `Help.tsx` in the diff
  (D70).
- The message's typography is untouched: only `marginBottom: 36` moved to the
  frame.
- No dead style and no leftover import.

## Merge

```bash
git checkout uat && git merge --no-ff code/60-2-update-bounded-message -m "<VERSION> - merge code/60-2-update-bounded-message: Update message bounded (60 step 2)"
```

Delete the branch after the merge. Then run Finishing: the records text into
`LOG.md`, the ticket set to EXECUTED, the executed docs commit, merge, no
push.

## Done when

Checklist box ticked in `PLAN.md`, `LOG.md` entry written under
`### Step 02 — done` ending with the `session:` line, merge sha recorded,
Finishing complete.
