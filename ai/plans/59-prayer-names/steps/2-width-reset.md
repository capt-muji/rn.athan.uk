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
- `stores/__tests__/ui.test.ts` (change: the `'@/stores/database'`
  mock gains a `clearPrefix` backed by `mockDatabaseValues` — deleting every
  map key starting with the prefix — because the removal test reads that map)
- `components/ui/__tests__/InitialWidthMeasurement.test.tsx` (change)
- `stores/__tests__/version.test.ts` (change: the `clearAllExcept` literal at
  ~376 renames with the family)
- `stores/__tests__/sync.test.ts` (change: the `clearAllExcept` literal at ~449
  and the fixture literal at ~373)
- `stores/__tests__/database.test.ts` (change: both occurrences, the source-scan literal at ~540 and the comment mention at ~543)
- `stores/__tests__/syncFetchBeforeWipe.test.ts` (change: the `KEPT_KEYS` seed
  renames)
- `stores/__tests__/upgrade2_0_0CrashWindows.test.ts` (change: the literals at
  ~91-99)
- The six `jest.mock('@/stores/ui')` factories that provide only
  `englishWidthAtomFor` and must provide `nameWidthAtomFor` after the rename:
  `components/prayer/__tests__/Prayer.test.ts`,
  `components/prayer/__tests__/rowPress.test.ts`,
  `components/day/__tests__/Day.test.ts`,
  `components/day/__tests__/shownDate.test.ts`,
  `components/overlay/__tests__/overlayPlacement.test.ts`,
  `hooks/__tests__/usePrayer.test.ts`. The six factories' sentinel strings
  `englishWidthStandardAtom` and `englishWidthExtraAtom` (once in five files,
  three times in `hooks/__tests__/usePrayer.test.ts`: the factory plus two
  `mockAtomValues` seeds) rename in lockstep to `nameWidthStandardAtom` and
  `nameWidthExtraAtom`

## Red tests

Rewrite the two suites' references first: every `setEnglishWidth` becomes
`setNameWidth`, every `englishWidthAtomFor` becomes `nameWidthAtomFor`, every
literal key `prayer_max_english_width_` in them becomes `prayer_max_name_width_`
including the literal keys in `stores/__tests__/ui.test.ts`'s isolated-module
tests (the th literal sits at ~441). In `stores/__tests__/ui.test.ts`'s
`the per-locale width keys` describe, replace the two seed-copy tests
(`'seeds the en width keys from the legacy keys…'` and `'resolves the
legacy-seeded en value through the family under en'`) with:

```ts
  it('removes every prayer_max_english_width_ key at module evaluation and measures fresh', () => {
    // P8: the 59 re-key removes the old family outright; no copy, no seed.
    // The old-family literals here are deliberate and survive the blanket
    // rename: they seed the keys the removal must clear.
    mockDatabaseValues.set('prayer_max_english_width_standard', '150');
    mockDatabaseValues.set('prayer_max_english_width_en_standard', '150');
    mockDatabaseValues.set('prayer_max_english_width_th_standard', '150');

    const { isolated, store } = loadUiModule();

    expect(mockDatabaseValues.get('prayer_max_english_width_standard')).toBeUndefined();
    expect(mockDatabaseValues.get('prayer_max_english_width_en_standard')).toBeUndefined();
    expect(mockDatabaseValues.get('prayer_max_english_width_th_standard')).toBeUndefined();
    expect(store.get(isolated.nameWidthAtomFor(ScheduleType.Standard))).toBe(0);
  });
```

(written in the describe's own idiom: `mockDatabaseValues` and
`loadUiModule()` are its existing bindings.)

(`'keeps widen-only per key…'` survives the mechanical rename.) Run:

```
npx tsc --noEmit
npx jest stores/__tests__/ui.test.ts components/ui/__tests__/InitialWidthMeasurement.test.tsx --watchman=false
```

Expected: `tsc` reports `TS2305: Module '"@/stores/ui"' has no exported member
'nameWidthAtomFor'` (and the `setNameWidth` twin, each possibly followed by a
`Did you mean 'englishWidthAtomFor'?` hint) in exactly the two suites; the
suites fail on those members. Any other failure is a STOP.

## Change contracts

1. `stores/ui.ts`: the key prefix `prayer_max_english_width_` becomes
   `prayer_max_name_width_` (the atom factory, line 134 area); the legacy seed
   loop (lines 108-122) becomes an unconditional removal of every
   `prayer_max_english_width_` prefixed key the database still holds, routed
   through `clearPrefix('prayer_max_english_width_')` imported from
   `@/stores/database` (the enumeration lives there), carrying
   this comment verbatim in the loop's place:

```ts
// The 59 re-key: every `prayer_max_english_width_` key is removed
// unconditionally at module evaluation, before the atoms below first read
// storage, so the reserve re-measures against the shortened names (P8).
```

   `englishWidthAtomFor` renames to `nameWidthAtomFor`, `setEnglishWidth`
   (line 259 area) to `setNameWidth`, and the setter's docblock reads "Sets
   the measured width of the widest active-locale prayer name". The
   grow-toward-truth guard (`if (width <= cached) return;`) is untouched
   (R3.2).
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
yarn validate
```

`yarn validate` (tsc, Biome, the full Jest suite with coverage) is the green
run: the rename touches nineteen files, and the full
suite is the only run that proves the six mock factories and the four
key-inventory suites went green with it. Exit 0.

## Break script

`bash scripts/break-step2.sh` from `$TMPDIR`: it deletes the grow-toward-truth
guard line in `setNameWidth`, runs the ui suite, expects `setNameWidth never
narrows the cache (grow-toward-truth, ISSUES #22)` to fail, restores the file,
ends `ALL AS EXPECTED: 1`.

## Version and commit

Version command as step 1 (`mkdir $HOME/athan-gitree/version.lock`, retry in a
short sleep loop while it exists, `rmdir` it after the merge). Add the nineteen
files by name plus the queue and plan files (the gitignored
`android/app/build.gradle` is never added; set its `versionName` when a prebuild
is present). Message:

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
