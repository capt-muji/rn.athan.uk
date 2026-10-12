**Requirements:** R2.1, R5.1
Weight: 2

## Anchor check

Each anchor counts exactly 1 in its file: `qibla-styles.txt` in
`components/sheets/screens/Qibla.tsx`, `sound-styles.txt` in
`components/sheets/screens/Sound.tsx`, `language-padding.txt` in
`components/sheets/screens/Language.tsx`, `settings-upper.txt`,
`settings-lower-a.txt` and `settings-lower-b.txt` in
`components/sheets/screens/Settings.tsx`. A count other than 1 is STOP.

## Goal

The sheet-screen surfaces convert: 10 source lines change style keys.

## Branch

```
git checkout -b code/58a-5-sheet-screens uat
```

## Files

- `components/sheets/screens/Qibla.tsx` (anchor: qibla-styles)
- `components/sheets/screens/Sound.tsx` (anchor: sound-styles)
- `components/sheets/screens/Language.tsx` (anchor: language-padding)
- `components/sheets/screens/Settings.tsx` (anchors: settings-upper, settings-lower-a, settings-lower-b)
- `scripts/directional-styles-allowlist.json`
- `app.json`, `package.json`, `android/app/build.gradle` (version only)

## Red test

Delete the step-5 entries (the step-2 filter command with `pending: step 5`, followed
by `npx biome format --write scripts/directional-styles-allowlist.json`), run the gate
suite. It fails naming
exactly 10 lines: `components/sheets/screens/Qibla.tsx:197`, `:199`,
`components/sheets/screens/Sound.tsx:233`, `:234`,
`components/sheets/screens/Language.tsx:84`, `:85`,
`components/sheets/screens/Settings.tsx:241`, `:250`, `:264`, `:281`. A different
count or file list is STOP.

## Change contracts

- `Qibla.tsx` and `Sound.tsx`: the full-bleed pairs `left: 0, right: 0,` become
  `start: 0, end: 0,`.
- `Language.tsx`: `paddingLeft: SPACING.md,` becomes `paddingStart: SPACING.md,`;
  `paddingRight: SPACING.sm,` becomes `paddingEnd: SPACING.sm,`.
- `Settings.tsx`: both `paddingRight: SPACING.md,` lines (241, 250) become
  `paddingEnd: SPACING.md,`; both `marginLeft: SPACING.sm,` lines (264, 281) become
  `marginStart: SPACING.sm,`.
- The allowlist keeps the same 32 remaining entries, no entry's content changed,
  formatted by the step's biome format command.

## Green run

```
npx jest shared/__tests__/directionalStyleGate.test.ts --watchman=false --selectProjects=unit
npx jest components/sheets/screens --watchman=false --selectProjects=components
npx jest components/sheets/screens --watchman=false --selectProjects=unit
node scripts/check-directional-styles.js
npx tsc --noEmit
npx biome check . --error-on-warnings
```

Expected: gate 2 passed; the screens suites (`Qibla.test.tsx`, `Settings.test.tsx`,
`Sound.test.tsx`, `soundSheet.test.ts` among them; `Language.tsx` has no suite of its
own, its behaviour is covered by the Settings suite's language-switch tests and the
commit hook's full validate) pass with zero edits; CLI prints
`DIRECTIONAL STYLES OK`.

## Break script

Run `bash ai/plans/58a-logical-edges/scripts/break-5.sh`. It turns one
`Settings.tsx` `paddingEnd: SPACING.md,` back into `paddingRight: SPACING.md,`,
expects the gate to fail naming `components/sheets/screens/Settings.tsx:241` (both
241 and 250 match the sed; the failure lists both, which the script accepts by
counting 2), reverses the sed, and expects both tests to pass. It ends
`ALL ASPECTED: 1`.

## Version and commit

Version command under the lock. Expected `2.0.90`. Commit the files above plus plan
files and queue (`IN PROGRESS, step 5`):

```
<VERSION> - refactor(rtl): sheet screens to logical edges (58a step 5)
```

## Review checklist

- No value changed; the diff holds key-name changes only.
- The allowlist holds 32 entries, none pending step 5.

## Merge

```
git checkout uat && git merge --no-ff code/58a-5-sheet-screens -m "<VERSION> - merge code/58a-5-sheet-screens: sheet screens logical"
```

## Done when

Box 5 ticked, `LOG.md` entry written, `uat` holds the merge.

## Restore list

The four source files, the allowlist, the version trio, plan files, queue.
