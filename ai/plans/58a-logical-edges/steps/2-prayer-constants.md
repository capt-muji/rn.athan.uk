**Requirements:** R2.1, R5.1
Weight: 2

## Anchor check

Each anchor below counts exactly 1 in its file
(`python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' <anchor> <source>`):
`constants-prayer-padding.txt` in `shared/constants.ts`, `prayer-width-arithmetic.txt`
and `prayer-padding-style.txt` in `components/prayer/Prayer.tsx`, `alert-padding.txt`
in `components/prayer/Alert.tsx`, `time-margin.txt` in `components/prayer/Time.tsx`.
A count other than 1 is STOP.

## Goal

The prayer-row surfaces and their shared constants convert: 6 source lines change key
or field names, the two doc comments naming the side follow their keys, and the gate's
6 pending step-2 entries leave the allowlist.

## Branch

```
git checkout -b code/58a-2-prayer-constants uat
```

## Files

- `shared/constants.ts` (anchors: constants-prayer-padding)
- `components/prayer/Prayer.tsx` (anchors: prayer-width-arithmetic, prayer-padding-style)
- `components/prayer/Alert.tsx` (anchor: alert-padding)
- `components/prayer/Time.tsx` (anchor: time-margin)
- `scripts/directional-styles-allowlist.json`
- `app.json`, `package.json`, `android/app/build.gradle` (version only)

## Red test

Delete the step-2 entries first, then run the gate:

```
node -e "const fs=require('fs');const f='scripts/directional-styles-allowlist.json';const l=JSON.parse(fs.readFileSync(f));fs.writeFileSync(f,JSON.stringify(l.filter(e=>e.reason!=='pending: step 2'),null,2)+'\n')"
npx biome format --write scripts/directional-styles-allowlist.json
npx jest shared/__tests__/directionalStyleGate.test.ts --watchman=false --selectProjects=unit
```

The suite fails the remainder test naming exactly 6 lines:
`shared/constants.ts:994`, `shared/constants.ts:996`,
`components/prayer/Prayer.tsx:109`, `components/prayer/Alert.tsx:208`,
`components/prayer/Alert.tsx:209`, `components/prayer/Time.tsx:71`. Record the output
in `LOG.md`. A different count or file list is STOP.

## Change contracts

Apply PLAN.md section 6's conversion map:

- `shared/constants.ts`: inside `STYLES.prayer.padding`, `left: 20,` becomes
  `start: 20,` and `right: 20,` becomes `end: 20,`; the doc comments `Left padding for
  prayer row text` and `Right padding for prayer row text` become `Start padding...`
  and `End padding...`.
- `components/prayer/Prayer.tsx`: `width: Prayer.ui.maxEnglishWidth +
  STYLES.prayer.padding.left,` becomes `...padding.start,` (a gap sum; the value and
  the arithmetic change by nothing); `paddingLeft: STYLES.prayer.padding.left,`
  becomes `paddingStart: STYLES.prayer.padding.start,`.
- `components/prayer/Alert.tsx`: `paddingRight: STYLES.prayer.padding.right,` becomes
  `paddingEnd: STYLES.prayer.padding.end,`; `paddingLeft: SPACING.mid - 1,` becomes
  `paddingStart: SPACING.mid - 1,`.
- `components/prayer/Time.tsx`: `marginLeft: SPACING.lg - 1,` becomes
  `marginStart: SPACING.lg - 1,`.
- The allowlist keeps the same 53 remaining entries, no entry's content changed,
  formatted by `npx biome format --write scripts/directional-styles-allowlist.json`.

## Green run

```
npx jest shared/__tests__/directionalStyleGate.test.ts --watchman=false --selectProjects=unit
npx jest components/prayer --watchman=false --selectProjects=components
npx jest components/prayer --watchman=false --selectProjects=unit
node scripts/check-directional-styles.js
npx tsc --noEmit
npx biome check . --error-on-warnings
grep -rn "padding\.left\|padding\.right" app components shared stores device modules api | grep -v __tests__
```

Expected: gate suite `2 passed`; prayer suites pass with zero edits (the 2026-10-12
scratch-worktree record ran exactly this shape: 7 suites, 59 tests); the CLI prints
`DIRECTIONAL STYLES OK`; the grep prints nothing (no reader of the old field names
remains, test files excepted).

## Break script

Run `bash ai/plans/58a-logical-edges/scripts/break-2.sh`. It turns `Time.tsx`'s
`marginStart` back into `marginLeft`, expects the gate suite to fail naming
`components/prayer/Time.tsx:71`, reverses the sed, and expects both tests to pass
again. It ends `ALL ASPECTED: 1`.

## Version and commit

Under the version lock, run the version command (PLAN.md section 6's step-1 wording).
Expected `2.0.87` when nothing concurrent took a number. Commit the files above plus
the plan `PLAN.md` and `LOG.md` and `ai/plans/README.md` (ticket
`IN PROGRESS, step 2`):

```
<VERSION> - refactor(rtl): prayer rows and shared constants to logical edges (58a step 2)
```

## Review checklist

- The diff touches only the named lines, the two doc comments, the allowlist, the
  version trio and the plan files.
- No value changed: every converted line differs from its before only in the key or
  field name.
- The allowlist holds 53 entries, none with reason `pending: step 2`.

## Merge

```
git checkout uat && git merge --no-ff code/58a-2-prayer-constants -m "<VERSION> - merge code/58a-2-prayer-constants: prayer rows logical"
```

## Done when

Box 2 ticked, `LOG.md` entry written (red output, green lines, break last line,
review verdict), `uat` holds the merge.

## Restore list

The four source files, the allowlist, the version trio, plan `PLAN.md` and `LOG.md`,
`ai/plans/README.md`.
