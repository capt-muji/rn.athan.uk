# Step 2 — the countdown's capitals at 60 percent

Requirements: R2.1, R9.1
Weight: 2

## Anchor check

`python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' scripts/anchors/03-unit-letters.md components/countdown/Countdown.tsx`
prints `1`, and the same for `scripts/anchors/04-unit-letter-style.md` against
`components/countdown/Countdown.tsx`. Any other count is `NEEDS_CONTEXT: NEEDS REPLAN`.

## Goal

The timer's unit letters render as capitals H M S at 60 percent of the timer's digit
size. The ink, the baseline, the 2 point gap span and every other value from row 85
stand. The timer is one design across every locale, so no locale branches.

## Branch

`git checkout -b code/100-capitals lane/100`

## Files

- `components/countdown/Countdown.tsx` (changed)
- `components/countdown/__tests__/Countdown.test.tsx` (changed)

## Red tests

In `components/countdown/__tests__/Countdown.test.tsx`, write first:

- Line 21's `LETTER_SIZE` becomes `Math.round(TEXT.sizeLarge * 0.6)`.
- Every composed group assertion changes letter case: `'2 h'` becomes `'2 H'`,
  `'1 h'` becomes `'1 H'`, `'5 h'` becomes `'5 H'`, and every `queryByText('h')`,
  `queryByText('m')`, `queryByText('s')` becomes the capital form.
- Both `getByLabelText('2h 29m')` assertions (lines 45 and 59) become
  `getByLabelText('2H 29M')`, because the screen-reader label composes
  `UNIT_LETTERS`.
- The style case at line 155 reads the letter through `screen.getByText('H')`
  (or the capital the rendered group holds) and asserts `fontSize` equals the new
  `LETTER_SIZE` and `color` equals `'rgba(160, 200, 255, 0.4)'` unchanged.
- The test file's header docblock reads "capital unit letters" where it says
  lowercase today.

Record the failing names and lines in `LOG.md` before changing code.

## Change contracts

`components/countdown/Countdown.tsx`:

- `UNIT_LETTERS` becomes `['H', 'M', 'S']`.
- `unitLetter.fontSize` becomes `Math.round(ty.countdownSize * 0.6)`.
- Nothing else changes: `UNIT_LETTER_COLOR`, the `gap` span at `fontSize: 8`, the
  baseline ride, the `timerRow` direction pin and the dim logic all stand.
- The screen-reader `rowLabel` join composes the capitals with the digits
  (`2H 35M`), which the render now matches; no code change is needed for it beyond
  the letter constant.

## Green run

`npx jest components/countdown/__tests__/Countdown.test.tsx --watchman=false` exits
0, then `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0.

## Break script

`bash scripts/breaks/break-02.sh` from the lane root, created in this step as:

```bash
#!/usr/bin/env bash
set -u
cp components/countdown/Countdown.tsx "$TMPDIR/break02-countdown.tsx"
python3 - <<'EOF'
from pathlib import Path
p = Path('components/countdown/Countdown.tsx')
s = p.read_text()
old = "const UNIT_LETTERS = ['H', 'M', 'S'];"
new = "const UNIT_LETTERS = ['h', 'm', 's'];"
assert old in s, 'anchor for break missing'
p.write_text(s.replace(old, new))
EOF
npx jest components/countdown/__tests__/Countdown.test.tsx --watchman=false >"$TMPDIR/break02.log" 2>&1
status=$?
mv "$TMPDIR/break02-countdown.tsx" components/countdown/Countdown.tsx
if [ $status -ne 0 ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "BREAK NOT APPLIED"
fi
```

The first failing line names a capital-letter assertion. The script restores the
file and ends `ALL AS EXPECTED: 1`.

## Version and commit

Fetch under the version lock, bump `app.json` then `package.json` one patch above
`lane/100`'s tip. Commit message:
`<VERSION> - feat(countdown): the timer's letters are capitals at 60 percent (D93)`

## Review checklist

- The diff touches two lines of source plus the test file.
- The ink, gap span, baseline and direction pin are byte-identical.
- No locale branch appears.

## Merge

`git checkout lane/100 && git merge --no-ff code/100-capitals -m "<VERSION> - merge code/100-capitals: the timer's capitals"`

## Restore list

`git checkout -- components/countdown/Countdown.tsx components/countdown/__tests__/Countdown.test.tsx` and delete `scripts/breaks/break-02.sh` if untracked.

## Done when

The checklist box is ticked, the merge landed on `lane/100`, and `LOG.md` carries the
step entry with the hook's `Tests:` line.
