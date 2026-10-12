# Step 2: The width key-family reset and renames

Requirements: R3.1, R3.2
Weight: 2

## Anchor check

`ui-widthatom`, `ui-seedloop`, `ui-setwidth`, `version-inventory`,
`sync-inventory`, `useprayer-reader`. A count other than 1 is a STOP.

## Goal

The name-width cache re-measures from zero under `prayer_max_name_width_` keys;
the old keys are removed on launch; the measuring functions carry honest names;
the two suites rename with them.

## Branch

`git checkout -b feat/59-width-reset uat`

## Files

- `stores/ui.ts` (change)
- `stores/version.ts` (change)
- `stores/sync.ts` (change)
- `hooks/usePrayer.ts` (change)
- `components/ui/InitialWidthMeasurement.tsx` (change)
- `components/ui/Error.tsx` (docblock mention only)
- `stores/__tests__/ui.test.ts` (change)
- `components/ui/__tests__/InitialWidthMeasurement.test.tsx` (change)

## Red tests

Rewrite the two suites' references first: every `setEnglishWidth` becomes
`setNameWidth`, every `englishWidthAtomFor` becomes `nameWidthAtomFor`, every
literal key `prayer_max_english_width_` in them becomes `prayer_max_name_width_`
including the per-locale keys the ar and th measurement cases assert. Run:

```
npx tsc --noEmit
npx jest stores/__tests__/ui.test.ts components/ui/__tests__/InitialWidthMeasurement.test.tsx --watchman=false
```

Expected: `tsc` reports `TS2305: Module '"@/stores/ui"' has no exported member
'englishWidthAtomFor'` (and the setter twin) in exactly the two suites; the
suites fail on those members. The rest of the repo stays clean. Any other
failure is a STOP.

## Change contracts

1. `stores/ui.ts`: the key prefix `prayer_max_english_width_` becomes
   `prayer_max_name_width_` (the atom factory, line 130 area); the legacy seed
   loop (line 108 area) drops its seed-and-copy shape and becomes an
   unconditional removal of every `prayer_max_english_width_` prefixed key the
   database still holds (the P8 reset: no copy, no seed), keeping its
   module-evaluation position; `englishWidthAtomFor` renames to
   `nameWidthAtomFor`, `setEnglishWidth` to `setNameWidth`, and the setter's
   docblock reads "Sets the measured width of the widest active-locale prayer
   name". The grow-toward-truth guard (`if (width <= cached) return;`) is
   untouched (R3.2).
2. `stores/version.ts:155` and `stores/sync.ts:365`: the inventory prefix
   renames with the family.
3. `hooks/usePrayer.ts`: the import and the `useAtomValue` call rename with the
   functions.
4. `components/ui/InitialWidthMeasurement.tsx`: the import and both
   `setEnglishWidth` calls rename; nothing else.
5. `components/ui/Error.tsx`: the docblock's `prayer_max_english_width_`
   mention becomes `prayer_max_name_width_` (docblock only, no code change).

What the contract must never do: weaken the widen-only guard; seed the new keys
from the old values; touch any measurement style or mounting.

## Green run

```
npx jest stores/__tests__/ui.test.ts components/ui/__tests__/InitialWidthMeasurement.test.tsx shared/__tests__/versionLockstep.test.ts --watchman=false
npx tsc --noEmit
npx biome check . --error-on-warnings
```

All pass; all three commands exit 0.

## Break script

`bash scripts/break-step2.sh` from `$TMPDIR`: it deletes the grow-toward-truth
guard line in `setNameWidth`, runs the ui suite, expects `setNameWidth never
narrows the cache (grow-toward-truth, ISSUES #22)` to fail, restores the file,
ends `ALL AS EXPECTED: 1`.

## Version and commit

Version command as step 1. Add the eight files, `app.json`, `package.json` and
`android/app/build.gradle`, by name plus the queue and plan files. Message:

```
<VERSION> - feat(ui): name-width cache resets by key rename

prayer_max_english_width_ becomes prayer_max_name_width_ with the old keys
removed on launch, so the reserve re-measures against the shortened names
instead of holding the old widest-name slack; the measuring functions rename
with the keys. R3.1, R3.2.
```

## Review checklist

- The guard line `if (width <= cached) return;` is present and unchanged.
- No `englishWidth` or `prayer_max_english_width_` string survives anywhere in
  `stores/`, `hooks/`, `components/` or their tests.
- The seed loop removes without copying.
- `Error.tsx` differs by its docblock line only.

## Merge

`git checkout uat && git merge --no-ff feat/59-width-reset -m "<VERSION> -
merge feat/59-width-reset: step 2, the width reset"`. A conflict aborts and
STOPs.

## Done when

Checklist ticked, `LOG.md` appended, ticket set EXECUTED per Finishing.
