**Requirements:** R2.1, R5.1
Weight: 2

## Anchor check

Each anchor counts exactly 1 in its file: `sheet-inset.txt` in
`components/sheets/parts/Sheet.tsx`, `sounditem-left.txt` and `sounditem-right.txt` in
`components/sheets/parts/SoundItem.tsx`, `stepper-margin.txt` in
`components/sheets/parts/Stepper.tsx`, `segmented-indicator.txt` and
`segmented-iconlayer.txt` in `components/sheets/parts/SegmentedControl.tsx`. A count
other than 1 is STOP.

## Goal

The sheet-part surfaces convert: 6 source lines change style keys. The pill slide's
two `translateX` sites (`SegmentedControl.tsx:141` worklet and `:154` static) have no
logical form, stay physical, and are 58b inventory, not allowlist entries: no banned
pattern matches a `translateX` line, so they need none.

## Branch

```
git checkout -b code/58a-4-sheet-parts uat
```

## Files

- `components/sheets/parts/Sheet.tsx` (anchor: sheet-inset)
- `components/sheets/parts/SoundItem.tsx` (anchors: sounditem-left, sounditem-right)
- `components/sheets/parts/Stepper.tsx` (anchor: stepper-margin)
- `components/sheets/parts/SegmentedControl.tsx` (anchors: segmented-indicator, segmented-iconlayer)
- `scripts/directional-styles-allowlist.json`
- `app.json`, `package.json`, `android/app/build.gradle` (version only)

## Red test

Delete the step-4 entries (the step-2 filter command with `pending: step 4`, followed
by `npx biome format --write scripts/directional-styles-allowlist.json`), run the gate
suite. It fails naming
exactly 6 lines: `components/sheets/parts/Sheet.tsx:225` (one line, two props),
`components/sheets/parts/SoundItem.tsx:149`, `:162`,
`components/sheets/parts/Stepper.tsx:142`,
`components/sheets/parts/SegmentedControl.tsx:194`, `:220`. A different count or file
list is STOP.

## Change contracts

- `Sheet.tsx:225`: `{ width: containerWidth, marginLeft: sideInset, marginRight:
  sideInset }` becomes `{ width: containerWidth, marginStart: sideInset, marginEnd:
  sideInset }` (the values are equal; only the keys change).
- `SoundItem.tsx`: `paddingLeft: SPACING.md,` becomes `paddingStart: SPACING.md,`;
  `marginRight: SPACING.xs,` becomes `marginEnd: SPACING.xs,`.
- `Stepper.tsx`: `marginLeft: 3,` becomes `marginStart: 3,`.
- `SegmentedControl.tsx`: the indicator's `left: 3,` becomes `start: 3,`; the icon
  layer's `left: 0,` becomes `start: 0,`. The `translateX` lines at 141 and 154 change
  by nothing.
- The allowlist keeps the same 40 remaining entries, no entry's content changed,
  formatted by the step's biome format command.

## Green run

```
npx jest shared/__tests__/directionalStyleGate.test.ts --watchman=false --selectProjects=unit
npx jest components/sheets/parts --watchman=false --selectProjects=components
npx jest components/sheets/parts --watchman=false --selectProjects=unit
node scripts/check-directional-styles.js
npx tsc --noEmit
npx biome check . --error-on-warnings
```

Expected: gate 2 passed; the parts suites (`Sheet.test.tsx`, `SoundItem.test.tsx`,
`Stepper.test.tsx`, `SegmentedControl.test.tsx`, `Toggle.test.tsx` included by the
path) pass with zero edits; CLI prints `DIRECTIONAL STYLES OK`.

## Break script

Run `bash ai/plans/58a-logical-edges/scripts/break-4.sh`. It turns `Stepper.tsx`'s
converted `marginStart: 3,` back into `marginLeft: 3,`, expects the gate to fail
naming `components/sheets/parts/Stepper.tsx:142`, reverses the sed, and expects both
tests to pass. It ends `ALL ASPECTED: 1`.

## Version and commit

Version command under the lock. Expected `2.0.89`. Commit the files above plus plan
files and queue (`IN PROGRESS, step 4`):

```
<VERSION> - refactor(rtl): sheet parts to logical edges (58a step 4)
```

## Review checklist

- The `translateX` lines at `SegmentedControl.tsx:141` and `:154` are byte-identical
  to their state on `uat`.
- No value changed; the allowlist holds 40 entries, none pending step 4.

## Merge

```
git checkout uat && git merge --no-ff code/58a-4-sheet-parts -m "<VERSION> - merge code/58a-4-sheet-parts: sheet parts logical"
```

## Done when

Box 4 ticked, `LOG.md` entry written, `uat` holds the merge.

## Restore list

The four source files, the allowlist, the version trio, plan files, queue.
