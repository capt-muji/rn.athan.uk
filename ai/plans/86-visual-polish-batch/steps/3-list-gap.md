# Step 3 - The Standard list-to-ago gap

Requirements: R3.1, R3.2

Weight: 2

## Anchor check

```
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/86-visual-polish-batch/scripts/anchors/list-container.txt components/prayer/List.tsx
```

Prints `1`.

## Goal

On the Standard schedule the time-ago badge sits too tight under the prayer list. The owner
ruled 25 percent more room on the Standard list only, so its container's bottom margin goes
from 22.5 to 28. The Extras schedule already carries 34 and does not move.

## Branch

```
git checkout -b feat/86-list-gap uat
```

## Files

- `components/prayer/List.tsx`
- `components/prayer/__tests__/List.test.tsx`

## Red tests

**`components/prayer/__tests__/List.test.tsx`**: in the `the gap below the list` describe,
the first case becomes:

```tsx
  it('renders a quarter more than the pre-change 22.5', async () => {
    showLondonDay('2026-09-11', '14:00');

    await render(<List type={ScheduleType.Standard} />);

    // The owner's ruling, 2026-10-14: 25 percent more room between the Standard list and its ago badge
    expect(listContainerStyle().marginBottom).toBe(28);
  });
```

The second case and its `toBe(34)` do not change.

Red evidence: the changed case prints `Expected: 28` and `Received: 22.5`.

```
npx jest components/prayer/__tests__/List.test.tsx --watchman=false --selectProjects=components
```

## Change contract

**`components/prayer/List.tsx`**: the `container` style's bottom margin becomes the plain
literal form the Extras variant already uses:

```ts
  container: {
    marginHorizontal: SCREEN.paddingHorizontal,
    marginBottom: 28,
  },
```

Nothing else changes in the styles, and one import does: line 9 becomes
`import { SCREEN } from '@/shared/constants';`, because the old margin expression was
`SPACING`'s only use in the file. The `containerExtrasGap` variant keeps `marginBottom: 34`,
and `components/prayer/Ago.tsx` is not touched.

## Green run

```
npx jest components/prayer/__tests__/List.test.tsx --watchman=false --selectProjects=components
npx tsc --noEmit
npx biome check . --error-on-warnings
```

## Break script

`scripts/break-step3.sh`, run from the repository root with `bash`, ending
`ALL AS EXPECTED: 1`:

```bash
#!/usr/bin/env bash
# Ticket 86 step 3 break. Run from the repository root with uat holding step 3.
set -u
cp components/prayer/List.tsx "$TMPDIR/break86-list.tsx.bak"

python3 - <<'EOF'
import pathlib
p = pathlib.Path('components/prayer/List.tsx')
s = p.read_text()
old = "  container: {\n    marginHorizontal: SCREEN.paddingHorizontal,\n    marginBottom: 28,\n  },"
new = "  container: {\n    marginHorizontal: SCREEN.paddingHorizontal,\n    marginBottom: SPACING.xxxl * 0.75,\n  },"
assert s.count(old) == 1, "break substitution not found once"
s = s.replace(old, new)
s = s.replace("import { SCREEN } from '@/shared/constants';", "import { SCREEN, SPACING } from '@/shared/constants';")
p.write_text(s)
print("break applied: the Standard gap back to 22.5")
EOF

npx jest components/prayer/__tests__/List.test.tsx -t 'quarter more' --watchman=false --selectProjects=components > "$TMPDIR/break86-step3.log" 2>&1
if grep -q 'renders a quarter more' "$TMPDIR/break86-step3.log"; then
  echo "caught: the Standard gap is 22.5 again"
  cp "$TMPDIR/break86-list.tsx.bak" components/prayer/List.tsx
  rm "$TMPDIR/break86-list.tsx.bak"
  echo "ALL AS EXPECTED: 1"
  exit 0
fi
cp "$TMPDIR/break86-list.tsx.bak" components/prayer/List.tsx
rm "$TMPDIR/break86-list.tsx.bak"
echo "BREAK NOT APPLIED (the 22.5 gap did not fail the case)"
exit 1
```

## Version and commit

2.0.719, set in the three version files, then:

```
2.0.719 - feat(prayer): the Standard list's ago gap up a quarter to 28
```

Add by name: `components/prayer/List.tsx`,
`components/prayer/__tests__/List.test.tsx`, and the plan files this run changed.

## Review checklist

- Does the Standard container carry 28 and the Extras variant still 34?
- Is the ago badge itself untouched?
- Is `SPACING` still imported and used elsewhere in the file, so removing one use leaves no unused import?
- Hunt the shipped classes: Residue (an unused import), Rule (a substituted value).

## Merge

```
git checkout uat
git merge --no-ff feat/86-list-gap -m "2.0.719 - merge ticket 86 step 3: the Standard list-to-ago gap"
```

## Done when

Every named test passes, tsc and Biome exit 0, the break script ends `ALL AS EXPECTED: 1`,
the branch is merged, the checklist box is ticked, and `LOG.md` carries the step entry with
its `session:` line.
