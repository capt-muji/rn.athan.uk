# Step 1 — the ago badge: plain letters, LTR isolates

Requirements: R1.1, R1.2, R1.3, R1.4, R9.1
Weight: 2

## Anchor check

`python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' scripts/anchors/01-ago-render.md components/prayer/Ago.tsx`
prints `1`, and the same command for `scripts/anchors/02-format-ago.md` against
`shared/time.ts` prints `1`. Any other count is `NEEDS_CONTEXT: NEEDS REPLAN`.

## Goal

The badge renders its whole sentence as one plain text run: the duration composed by
`formatTimeAgo` carries Unicode left-to-right isolates so `2h 35m` reads left to
right inside the Arabic line, and the letters inherit the badge's own font size,
colour and face with no gap span and no separate letter style. The splitter
`splitAgoDuration` and its `AgoLetterGroup` interface die.

## Branch

`git checkout -b code/100-ago-plain lane/100`

## Files

- `shared/time.ts` (changed)
- `components/prayer/Ago.tsx` (changed)
- `shared/__tests__/time.test.ts` (changed)
- `components/prayer/__tests__/Ago.test.tsx` (changed)

## Red tests

Write these first. They fail against the planned sha.

In `shared/__tests__/time.test.ts`, inside the `formatTimeAgo` describe: every
lettered expectation gains the isolate pair, so the case list reads
`'\u20661m\u2069'`, `'\u20662m\u2069'`, `'\u206659m\u2069'`, `'\u20661h\u2069'`,
`'\u20661h 30m\u2069'`, `'\u20662h\u2069'`, `'\u20662h 1m\u2069'`, and the `now`
cases stay `'now'` and `'الآن'`. The ar-locale cases at the describe's end assert
the same isolated shapes under `setActiveLocale('ar')`. A new case proves R1.4:
`expect(formatTimeAgo(7260)).toBe('\u20662h 1m\u2069')` already covers the
two-group run; add `expect(formatTimeAgo(120)).toBe('\u20662m\u2069')` for the
single group beside it. Delete the whole `splitAgoDuration` describe and its import.

In `components/prayer/__tests__/Ago.test.tsx`:

- The en sentence cases compose the isolated duration: `['13:05', 'Dhuhr \u20663 m\u2069 ago']`
  becomes the plain form `['13:05', 'Dhuhr \u20663m\u2069 ago']` and
  `['14:00', 'Dhuhr \u206658m\u2069 ago']` (the gap span's space is gone, the digits
  and letter touch, the isolates wrap the run).
- Replace the case at line 37 with: under ar at 14:00 the badge renders one text
  node whose content is `الظهر قبل \u206658m\u2069`, and no node anywhere holds a
  styled letter: `expect(screen.getByText('الظهر قبل \u206658m\u2069')).toBeOnTheScreen()`
  plus `expect(screen.queryByText('m')).toBeNull()`.
- The now-sentence case keeps its assertions (`الآن` present, no `m`, no `h`) and
  adds `expect(screen.getByText(/الآن/).props.children).not.toContain('\u2066')`.
- Delete the describe at line 99 (`draws its letters at 55 percent...`) and the case
  at line 120 (`separates the letter from its digits...`) together with the file's
  `LETTER_SIZE` constant and the `TEXT` import if nothing else uses it.
- The fade case at line 73 retargets its sentence to `'Dhuhr \u206658m\u2069 ago'`.

Record the failing names and lines in `LOG.md` before changing code.

## Change contracts

`shared/time.ts`:

- `formatTimeAgo` keeps its signature and its zero-drop behaviour. The three lettered
  returns compose the run inside the marks, written in the source as the literal
  escapes: `` return `\u2066${minutes}m\u2069`; `` and the same shape for `${hours}h`
  and `${hours}h ${remainingMinutes}m`. The `now` branch returns the catalog word
  untouched.
- Rewrite its docblock to say: the lettered duration composes inside Unicode
  left-to-right isolates so the run reads left to right inside an RTL sentence, the
  letters lowercase at the sentence's own face, fixed in every locale.
- Delete `AgoLetterGroup` and `splitAgoDuration` whole, with their docblocks.

`components/prayer/Ago.tsx`:

- Drop the `splitAgoDuration` import, the `Fragment` import, and the `parts` logic.
  `PrayerAgoBadge` renders `{prayerAgo}` as the `Animated.Text`'s single child.
- Delete the `gap` and `unitLetter` styles.

## Green run

`npx jest shared/__tests__/time.test.ts components/prayer/__tests__/Ago.test.tsx --watchman=false`
exits 0. `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0.

## Break script

`bash scripts/breaks/break-01.sh` from the lane root, created in this step as:

```bash
#!/usr/bin/env bash
set -u
cp shared/time.ts "$TMPDIR/break01-time.ts"
cp components/prayer/Ago.tsx "$TMPDIR/break01-ago.tsx"
python3 - <<'EOF'
from pathlib import Path
p = Path('shared/time.ts')
s = p.read_text()
old = "return `\\u2066${minutes}m\\u2069`;"
new = "return `${minutes}m`;"
assert old in s, 'anchor for break missing'
p.write_text(s.replace(old, new))
EOF
npx jest shared/__tests__/time.test.ts --watchman=false -t 'formatTimeAgo' >"$TMPDIR/break01.log" 2>&1
status=$?
mv "$TMPDIR/break01-time.ts" shared/time.ts
mv "$TMPDIR/break01-ago.tsx" components/prayer/Ago.tsx
if [ $status -ne 0 ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "BREAK NOT APPLIED"
fi
```

The first failing line names the isolated `2m` expectation. The script restores both
files and ends `ALL AS EXPECTED: 1`; `git status --porcelain` then lists only this
step's files and the plan files.

## Version and commit

Fetch under the version lock, bump `app.json` then `package.json` one patch above
`lane/100`'s tip. Commit message:
`<VERSION> - feat(ago): the badge's lettered run reads left to right inside the Arabic sentence, plain full-size letters`

## Review checklist

- No nested `Text` remains inside the badge.
- The isolates wrap the whole run including the inner space, not each group.
- `splitAgoDuration` has no surviving import anywhere (`grep -rn splitAgoDuration`
  outside `node_modules` prints nothing).
- The docblock names the isolates and the plain face, and says why.
- en content differs from the planned sha only by the zero-width marks.

## Merge

`git checkout lane/100 && git merge --no-ff code/100-ago-plain -m "<VERSION> - merge code/100-ago-plain: the ago badge's plain lettered run"`

## Restore list

`git checkout -- shared/time.ts components/prayer/Ago.tsx shared/__tests__/time.test.ts components/prayer/__tests__/Ago.test.tsx` and delete `scripts/breaks/break-01.sh` if untracked.

## Done when

Every checklist box in `PLAN.md` section 6 for this step is ticked, the merge landed
on `lane/100`, and `LOG.md` carries the step entry with the hook's `Tests:` line.
