# Step 6 — the Help question's ar line box

Requirements: R6.1, R9.1
Weight: 2

## Anchor check

`python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' scripts/anchors/10-help-question.md components/modals/Help.tsx`
prints `1`. Any other count is `NEEDS_CONTEXT: NEEDS REPLAN`.

## Goal

Under ar each Help question takes the Arabic script line box (23 points at the 15
point question size) so its dots and descenders render and the text centres in its
row, closed and open rows alike. The answers, the chevron and every other value
stand.

## Branch

`git checkout -b code/100-help-box lane/100`

## Files

- `components/modals/Help.tsx` (changed, one style line)
- `components/__tests__/typographySweep.test.tsx` (changed, new assertions)

## Red tests

In `components/__tests__/typographySweep.test.tsx`, the existing
`helpQuestionStyleUnder` probe already reads the question's flattened style under a
locale. Extend the `the help question` describe:

```ts
it('takes the Arabic script line box under ar, so its dots and descenders render', async () => {
  const question = await helpQuestionStyleUnder('ar');
  expect(question.lineHeight).toBe(23);
});

it('keeps the 20 point line box under en', async () => {
  expect((await helpQuestionStyleUnder('en')).lineHeight).toBe(20);
});
```

The ar assertion fails against the planned sha (today `ty.lineHeight(20)` resolves
to 20 in both locales). Record the failing name and line in `LOG.md`.

## Change contracts

`components/modals/Help.tsx`:

- `styles.question.lineHeight` becomes
  `ty.scriptLineHeight?.(15) ?? ty.lineHeight(20)` with the same shape
  `components/prayer/Explanation.tsx:152` uses, and a one-line comment naming the
  clipping it ends (owner read 2026-10-15).
- Nothing else changes: the size, family, colour, letter spacing, the head row's
  paddings and the chevron stand.

## Green run

`npx jest components/__tests__/typographySweep.test.tsx components/modals/__tests__/Help.test.tsx --watchman=false`
exits 0, then `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0.

## Break script

`bash scripts/breaks/break-06.sh` from the lane root, created in this step as:

```bash
#!/usr/bin/env bash
set -u
cp components/modals/Help.tsx "$TMPDIR/break06-help.tsx"
python3 - <<'EOF'
from pathlib import Path
p = Path('components/modals/Help.tsx')
s = p.read_text()
old = "lineHeight: ty.scriptLineHeight?.(15) ?? ty.lineHeight(20),"
new = "lineHeight: ty.lineHeight(20),"
assert old in s, 'anchor for break missing'
p.write_text(s.replace(old, new))
EOF
npx jest components/__tests__/typographySweep.test.tsx --watchman=false -t 'script line box under ar' >"$TMPDIR/break06.log" 2>&1
status=$?
mv "$TMPDIR/break06-help.tsx" components/modals/Help.tsx
if [ $status -ne 0 ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "BREAK NOT APPLIED"
fi
```

The first failing line names the 23 point expectation. The script restores the file
and ends `ALL AS EXPECTED: 1`.

## Version and commit

Fetch under the version lock, bump `app.json` then `package.json` one patch above
`lane/100`'s tip. Commit message:
`<VERSION> - fix(help): the ar question takes the script line box and centres (D96)`

## Review checklist

- The diff is one style line plus the test.
- Under en `scriptLineHeight` is undefined so the fallback renders 20, byte-identical.
- The answers' line heights are untouched.

## Merge

`git checkout lane/100 && git merge --no-ff code/100-help-box -m "<VERSION> - merge code/100-help-box: the Help question's ar line box"`

## Restore list

`git checkout -- components/modals/Help.tsx components/__tests__/typographySweep.test.tsx` and delete `scripts/breaks/break-06.sh` if untracked.

## Done when

The checklist box is ticked, the merge landed on `lane/100`, and `LOG.md` carries the
step entry with the hook's `Tests:` line.
