# Step 2: the timer's doubled colon gaps and the ar countdown size

Requirements: R2.1, R2.2
Weight: 2

## Anchor check

`bash ai/plans/81-greenbuild-refinements/scripts/preflight-81.sh 2`. It must
end `PREFLIGHT OK`.

## Goal

The timer's colon gap doubles to two thin spaces per side, and the timer's
digits under ar render two points smaller. Nothing else on the timer moves:
row 79's dim colours, the tabular pin, the container, the name line.

## Branch

```
git checkout -b feat/81-timer-gaps-ar-size uat
```

## Files

- `components/countdown/Countdown.tsx`
- `shared/typography.ts`
- `components/countdown/__tests__/Countdown.test.tsx`
- `shared/__tests__/typography.test.ts`
- Version files

## Red tests

1. In `Countdown.test.tsx`, the constant anchored by `countdown-test-gap.txt`
   becomes `const GAP_COLON = '\u2009\u2009:\u2009\u2009';`. Every test using
   it now fails: the component still renders one thin space per side.
2. In `typography.test.ts`, inside `expectArabicRecord` (anchored by
   `typography-test-ar.txt`), add after the `arabic` assertion:

```ts
  // Row 81: the ar countdown timer runs two points under the shared token
  expect(ty.countdownSize).toBe(24);
```

   Inside `expectLatinRecord` (anchored by `typography-test-lat.txt`), add
   after the `arabic` assertion:

```ts
  expect(ty.countdownSize).toBe(26);
```

Run `npx jest components/countdown/__tests__/Countdown.test.tsx
--selectProjects=components --watchman=false` and `npx jest
shared/__tests__/typography.test.ts --selectProjects=unit --watchman=false`.
Expected red: the countdown suite fails its gap queries with `Unable to find
an element`, and the typography suite fails `Expected: 24` and
`Expected: 26` (the field does not exist). No other test moves.

## Change contracts

1. `Countdown.tsx`, the gap literal anchored by `countdown-gap.txt`, becomes
   `{'\u2009\u2009:\u2009\u2009'}`.
2. `Countdown.tsx`, inside the style anchored by `countdown-fontsize.txt`, the
   line `fontSize: ty.size(TEXT.sizeLarge),` becomes
   `fontSize: ty.countdownSize,`. The `TEXT` import stays (`styles.text` still
   reads it).
3. `typography.ts`, the interface anchored by `typography-iface.txt`, gains
   after the `familyDigits` line:

```ts
  /** The timer's digit size: ar runs two points under the shared token (row 81a) */
  countdownSize: number;
```

4. In `typography-arabic.txt`'s object, after the `familyDigits` line, add
   `countdownSize: TEXT.sizeLarge - 2,`. In `typography-latin.txt`'s object,
   after the `familyDigits` line, add `countdownSize: TEXT.sizeLarge,`.

## Green run

Both suites pass; `npx tsc --noEmit` exits 0; `npx biome check .
--error-on-warnings` exits 0.

## Break script

After the merge: `bash
ai/plans/81-greenbuild-refinements/scripts/break-step2.sh`. It must end
`ALL AS EXPECTED: 1` with both catches fired and leave the tree clean.

## Version and commit

The version command prints `2.0.242` (step 1), so the step version is
`2.0.243`. Set it in the three files. Commit, adding by name: the four files
above, `app.json`, `package.json`, `ai/plans/README.md` (ticket 81 to
`IN PROGRESS, step 2`), and this plan folder's `PLAN.md`, `LOG.md` and
`steps/2-timer-gaps-ar-size.md`. Message:

```
2.0.243 - feat(81): the timer's colon gaps doubled, the ar timer two points smaller
```

## Review checklist

- Row 79's colour constants, the tabular pin and the colon style are
  byte-identical.
- The gap literal appears exactly once in the component.
- Every other typography consumer still compiles and renders its own sizes.

## Merge

```
git checkout uat && git merge --no-ff feat/81-timer-gaps-ar-size -m "2.0.243 - merge feat/81-timer-gaps-ar-size: step 2, ticket 81"
```

## Done when

Step 2 ticked, the LOG entry written, the merge on uat, the tree clean.