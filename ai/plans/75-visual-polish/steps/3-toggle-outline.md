# Step 3: the toggle outline takes the card edge colour

**Requirements:** R3.1, R3.2, R3.3
Weight: 2

## Anchor checks

Run from the worktree root. Three anchors, each counting exactly 1:

```bash
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
  ai/plans/75-visual-polish/scripts/anchors/constants-interactive.txt shared/constants.ts
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
  ai/plans/75-visual-polish/scripts/anchors/toggle-track.txt components/sheets/parts/Toggle.tsx
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
  ai/plans/75-visual-polish/scripts/anchors/settings-card.txt components/sheets/screens/Settings.tsx
```

Expected output: `1` three times. Anything else: stop.

## Goal

Every toggle's off-state track border reads `rgba(99, 102, 241, 0.15)`, the literal
the cards carry. The on-state border, the track fills, the thumb and ticket 73's
travel change nothing.

## Branch

`ticket/75`, the run's single branch. No step branch, no `uat` merge, no push.

## Files

- `shared/constants.ts` (changed, one value)
- `components/sheets/parts/__tests__/Toggle.test.tsx` (extended)

## Red tests

Add to `Toggle.test.tsx`, in the `the reminder switch` describe block:

1. `borders its off state with the cards' edge colour` - render
   `<Toggle value={false} onToggle={jest.fn()} />`, assert the switch
   (`screen.getByRole('switch')`) has style `{ borderColor: 'rgba(99, 102, 241, 0.15)', borderWidth: 1 }`.
2. `keeps its on state border unchanged` - render `value={true}`, assert style
   `{ borderColor: COLORS.interactive.activeBorder }` with the `COLORS` import from
   `@/shared/constants`.

Import `COLORS` from `@/shared/constants` (the suite already imports `ANIMATION, SIZE`
from there). Run before the change:

```bash
npx jest components/sheets/parts/__tests__/Toggle.test.tsx --watchman=false --selectProjects=components 2>&1 | tail -20
```

Test 1 must fail reading `#3b3977`; test 2 must pass. Every travel claim in the file
must pass untouched; they carry R3.3 and the ground note's warning. Any other outcome:
stop.

## Change contracts

In `shared/constants.ts`, inside `interactive` (the anchor block):

- `inactiveBorder: '#3b3977'` becomes `inactiveBorder: 'rgba(99, 102, 241, 0.15)'`.
- The doc comment `/** Inactive toggle border */` gains nothing: the key still names
  what it borders. Do not restate the card ruling in the palette; the test carries it.

`Toggle.tsx` is not edited. Its style keeps reading
`COLORS.interactive.inactiveBorder` (verified its only reader: a repo-wide grep for
`inactiveBorder` returns the palette line and `Toggle.tsx:83` alone).

## Green run

```bash
npx jest components/sheets/parts/__tests__/Toggle.test.tsx --watchman=false --selectProjects=components 2>&1 | tail -5
npx jest shared/__tests__/constants.test.ts --watchman=false --selectProjects=unit 2>&1 | tail -5
```

The whole toggle suite passes, travel claims included, and the constants suite passes.
If the constants suite pins the old value, update that pin to the card-edge literal
and record it in `LOG.md` (it is the same ruling restated, not a new decision). Then
`yarn validate`.

## Version and commit

Bump `app.json` then `package.json` to `2.0.454`. Commit:

```
2.0.454 - every toggle's off-state outline takes the cards' edge colour, the palette
key repointed, travel and on-state untouched
```

## Break script

Runs after the step's commit. The script points the palette key back at the old
value, the colour test goes red, then `git checkout --` restores the committed
change:

```bash
node -e '
const fs = require("fs");
const p = "shared/constants.ts";
fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace("inactiveBorder: \u0027rgba(99, 102, 241, 0.15)\u0027", "inactiveBorder: \u0027#3b3977\u0027"));
' && npx jest components/sheets/parts/__tests__/Toggle.test.tsx -t "cards" --watchman=false --selectProjects=components 2>&1 | tail -5
```

Expected: the off-state colour test fails on `#3b3977`. Then
`git checkout -- shared/constants.ts` and rerun the suite green. The replace targets
the `inactiveBorder` line only; if it hits zero lines the suite stays green and the
break is void: stop and report instead.

## Review checklist

- `Toggle.tsx` carries no diff.
- The travel suite's claims were not edited, only added beside.
- `LabeledToggle.test.tsx` and the settings sheet suites still pass (they render the
  toggle through the same track style).

## Merge

None this run. The commit stays on `ticket/75`.

## Done when

Both colour claims are green after the break proof, the travel claims never moved, the
hook lines are in `LOG.md`, and the commit carries 2.0.453.
