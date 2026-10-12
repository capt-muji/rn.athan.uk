**Requirements:** R2.1, R3.1, R5.1
Weight: 2

## Anchor check

Each anchor counts exactly 1 in its file: `help-styles-a.txt` and `help-styles-b.txt`
in `components/modals/Help.tsx`, `modal-styles-a.txt` and `modal-styles-b.txt` in
`components/modals/Modal.tsx`, `day-padding.txt` in `components/day/Day.tsx`,
`navigation-styles.txt` in `app/Navigation.tsx`, `bar-gloss.txt` in
`components/countdown/Bar.tsx`. A count other than 1 is STOP.

## Goal

The last Class A surfaces convert: 14 source lines change style keys, the allowlist
loses its final 11 pending entries, and the sweep ends with the 21 permanent entries
and zero pending ones. The countdown tip's worklet `left` at `Bar.tsx:149` stays
physical (no logical key exists for a worklet transform position; 58b mirrors it
inside `tipGeometry.ts`).

## Branch

```
git checkout -b code/58a-6-modals-day-nav-bar uat
```

## Files

- `components/modals/Help.tsx` (anchors: help-styles-a, help-styles-b)
- `components/modals/Modal.tsx` (anchors: modal-styles-a, modal-styles-b)
- `components/day/Day.tsx` (anchor: day-padding)
- `app/Navigation.tsx` (anchor: navigation-styles)
- `components/countdown/Bar.tsx` (anchor: bar-gloss)
- `scripts/directional-styles-allowlist.json`
- `app.json`, `package.json`, `android/app/build.gradle` (version only)

## Red test

Delete the step-6 entries (the step-2 filter command with `pending: step 6`, followed
by `npx biome format --write scripts/directional-styles-allowlist.json`), run the gate
suite. It fails naming
exactly 14 lines: `components/modals/Help.tsx:204`, `:205`, `:225`, `:227`,
`components/modals/Modal.tsx:116`, `:117`, `:126`, `:127`,
`components/day/Day.tsx:65`, `:66`, `app/Navigation.tsx:124`, `:125`,
`components/countdown/Bar.tsx:214`, `:215`. A different count or file list is STOP.

## Change contracts

- `Help.tsx`: `paddingLeft: SPACING.header,` (204, 225) and
  `paddingRight: SPACING.header,` (205) become `paddingStart:` / `paddingEnd:` with
  the same values; `paddingRight: SPACING.header + CHEVRON_SIZE,` (227) becomes
  `paddingEnd: SPACING.header + CHEVRON_SIZE,`.
- `Modal.tsx`: the scrim pair (116-117) and the content pair (126-127) become
  `start: 0, end: 0,`.
- `Day.tsx`: `paddingRight: SCREEN.paddingHorizontal + 2,` becomes `paddingEnd: ...`;
  `paddingLeft: SCREEN.paddingHorizontal + 4,` becomes `paddingStart: ...` (the two
  values differ by design; they travel with their keys).
- `Navigation.tsx`: the full-bleed pair (124-125) becomes `start: 0, end: 0,`.
- `Bar.tsx`: the gloss strip pair (214-215) becomes `start: 0, end: 0,`. Line 149
  changes by nothing.
- The allowlist keeps the same 21 permanent entries, no entry's content changed,
  formatted by the step's biome format command, and no entry's reason starts with
  `pending`.

## Green run

```
npx jest shared/__tests__/directionalStyleGate.test.ts --watchman=false --selectProjects=unit
npx jest components/modals --watchman=false --selectProjects=components
npx jest components/day --watchman=false --selectProjects=unit
npx jest components/countdown --watchman=false --selectProjects=components
npx jest components/countdown --watchman=false --selectProjects=unit
npx jest __tests__/app --watchman=false --selectProjects=components
node scripts/check-directional-styles.js
npx tsc --noEmit
npx biome check . --error-on-warnings
```

Expected: gate 2 passed; the named suites (`Help.test.tsx`, `Modal.test.tsx`,
`Day.test.ts`, `Bar.test.tsx`, `Countdown.test.tsx`, `tipGeometry.test.ts`,
`__tests__/app/Navigation.test.tsx` among them) pass with zero edits; CLI prints
`DIRECTIONAL STYLES OK`.

## Break script

Run `bash ai/plans/58a-logical-edges/scripts/break-6.sh`. It turns `Day.tsx`'s
converted `paddingStart: SCREEN.paddingHorizontal + 4,` back into `paddingLeft:`,
expects the gate to fail naming `components/day/Day.tsx:66`, reverses the sed, and
expects both tests to pass. It ends `ALL ASPECTED: 1`.

## Version and commit

Version command under the lock. Expected `2.0.91`. Commit the files above plus plan
files and queue (`IN PROGRESS, step 6`):

```
<VERSION> - refactor(rtl): modals, day, navigation and countdown gloss to logical edges (58a step 6)
```

## Review checklist

- `Bar.tsx:149` is byte-identical to its state on `uat`.
- The allowlist holds 21 entries, every reason permanent (window-space, canvas math,
  worklet math, interface field, prose, log string).
- No value changed anywhere in the diff.

## Merge

```
git checkout uat && git merge --no-ff code/58a-6-modals-day-nav-bar -m "<VERSION> - merge code/58a-6-modals-day-nav-bar: sweep complete, allowlist permanent"
```

## Done when

Box 6 ticked, `LOG.md` entry written, `uat` holds the merge, and
`node scripts/check-directional-styles.js` prints `DIRECTIONAL STYLES OK` on `uat`
with the 21-entry allowlist.

## Restore list

The five source files, the allowlist, the version trio, plan files, queue.
