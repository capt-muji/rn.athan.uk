Requirements: R2.1, R2.2
Weight: 2

Anchor check: `sound-list-gap` counts 1 in `components/sheets/screens/Sound.tsx`; `day-dial`
counts 1 in `components/day/Day.tsx`; `sweep-sound-hint` counts 1 in
`components/__tests__/typographySweep.test.tsx`; `daylines-gap` counts 1 in
`components/day/__tests__/DayLines.test.tsx`.

Goal: the sound sheet's list sits clear of the notification-sound label under ar at one value
with en; the location-date gap opens one step under ar.

Branch: `git checkout -b feat/108-gap-dials uat`

Files: `components/sheets/screens/Sound.tsx`, `components/day/Day.tsx`,
`components/__tests__/typographySweep.test.tsx`, `components/day/__tests__/DayLines.test.tsx`.

Red tests, written and run first:

1. In `typographySweep.test.tsx`, the sound describe's first case: rename to "seats the list
   12 points under the label under ar, one value with en" and expect 12.
2. In `DayLines.test.tsx`, the ar gap case: rename to "dials the location-to-date gap to 8
   points under ar" and expect 8.
3. Run `npx jest components/__tests__/typographySweep.test.tsx
   components/day/__tests__/DayLines.test.tsx --watchman=false`. Expected red: the two
   rewritten cases fail with Received 6 against Expected 12 and 8. Record the exact failing
   lines in `LOG.md`. Any other case failing is a STOP.

Change contracts:

- `Sound.tsx` list container: `marginTop: SPACING.md`; the compactArabic ternary dies at the
  site and the `compactArabic` declaration (Sound.tsx line 227) dies with it, its one use gone.
  The D94 comment above it becomes, verbatim: `// D94: the ar note copy clears the list (the
  preview animation) above it`.
- `Day.tsx` location style: `marginBottom: compactArabic ? SPACING.sm : SPACING.quart`.
- No other line moves in either file but that declaration, that comment and the two style
  values; the en branches are byte-identical.

Green run: `npx jest components/__tests__/typographySweep.test.tsx
components/day/__tests__/DayLines.test.tsx --watchman=false` then `yarn validate`. Expected:
all green, coverage 100 on every measure, the hook's `Tests:` line recorded in `LOG.md`.

Break script: `bash ai/plans/108-rubik-cascade/scripts/break-108.sh sound` prints `BREAK OK`
(the ar value 6 returns as a literal, the sweep case goes red); `bash
ai/plans/108-rubik-cascade/scripts/break-108.sh day` prints `BREAK OK` (SPACING.py returns,
the DayLines case goes red).

Version and commit: the version from the version command; message `<VERSION> - feat(sheets,
day): the sound list joins en at 12 clear of its label and the ar location-date gap dials to 8
(her row 108 rulings)`.

Merge: `git checkout uat && git merge --no-ff feat/108-gap-dials -m "<VERSION> - merge
feat/108-gap-dials: the label gap and the date dial"`.

Review checklist: read the diff cold. Two style values, two test expectations, one dead branch,
one comment halved; nothing else moves.

Done when: both suites are green, both break modes prove their pins, `uat` holds the merge,
and `LOG.md` carries `### Step 02 — done` ending with the session line.
