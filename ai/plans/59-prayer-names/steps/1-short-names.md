# Step 1: The three strings, the glossary supersession, the pins

Requirements: R1.1, R1.2, R1.3, R1.4, R2.1
Weight: 2

## Anchor check

`ms-lastthird`, `hi-midnight`, `th-lastthird`. A count other than 1 is a STOP.

## Goal

The three D81 strings land in the catalogs and the glossary, every other name
stays byte-identical, and one new test pins all three.

## Branch

`git checkout -b feat/59-short-names uat`

## Files

- `shared/i18n/ms.ts` (change)
- `shared/i18n/hi.ts` (change)
- `shared/i18n/th.ts` (change)
- `shared/i18n/sourced-names.json` (change)
- `shared/__tests__/catalogGates.test.ts` (change)

## Red tests

In `shared/__tests__/catalogGates.test.ts`, inside
`describe('the landed catalogs against the R2 gates')`, add:

```ts
  it('carries the owner-ruled re-shortened names (D81, 2026-10-12)', () => {
    expect(CATALOGS.ms['prayer.last third']).toBe('Sepertiga malam');
    expect(CATALOGS.hi['prayer.midnight']).toBe('आधी रात');
    expect(CATALOGS.th['prayer.last third']).toBe('ช่วงสุดท้าย');
  });
```

Run:

```
npx jest shared/__tests__/catalogGates.test.ts --watchman=false --selectProjects=unit
```

Expected: the new case fails three times (`Expected: "Sepertiga malam"`,
`"आधी रात"`, `"ช่วงสุดท้าย"` against the old phrases); every other case passes
(the glossary still matches the old catalogs). Any other failure is a STOP.

## Change contracts

1. In `shared/i18n/ms.ts`, `hi.ts` and `th.ts`, replace exactly these values
   (each counts 1 at `Planned at`; count with `grep -F` first):

| File | Old | New |
| --- | --- | --- |
| `ms.ts` | `'prayer.last third': 'Sepertiga akhir malam',` | `'prayer.last third': 'Sepertiga malam',` |
| `hi.ts` | `'prayer.midnight': 'इस्लामी आधी रात',` | `'prayer.midnight': 'आधी रात',` |
| `th.ts` | `'prayer.last third': 'ช่วงสุดท้ายของคืน',` | `'prayer.last third': 'ช่วงสุดท้าย',` |

2. In `shared/i18n/sourced-names.json`, set the `ms` `names` `Last Third`
   `text` to `Sepertiga malam` and the `hi` `names` `Midnight` `text` to
   `आधी रात`, byte-identical to the catalog values. The th entries stay `null`.

What the contract must never do: touch any other `prayer.*` value, `en.ts`,
`catalog-lock.json` or `dist/`.

## Green run

```
npx jest shared/__tests__/catalogGates.test.ts shared/__tests__/i18n.test.ts shared/__tests__/catalogLock.test.ts --watchman=false --selectProjects=unit
npx tsc --noEmit
npx biome check . --error-on-warnings
```

All pass; all three commands exit 0. The lock suite passing unchanged proves en
was not touched.

## Break script

`bash scripts/break-step1.sh` from the plan folder, copied to `$TMPDIR`: it
restores the old ms value, runs the gate suite, expects the D81 case to fail
with `Expected: "Sepertiga malam"` and `Received: "Sepertiga akhir malam"`,
restores the file, ends `ALL AS EXPECTED: 1`.

## Version and commit

Version command: the next patch after `uat`'s `package.json` under the version
lock. Set in `app.json`, `package.json` and `android/app/build.gradle`
(`versionName`). Add the five files, `app.json`, `package.json` and
`android/app/build.gradle`, by name plus `ai/plans/README.md` (`IN PROGRESS,
step 1`) and the plan's `PLAN.md` and `LOG.md`. Message:

```
<VERSION> - feat(i18n): three prayer names shortened per the header rule

ms Last Third reads Sepertiga malam (the owner's example), hi Midnight drops
the adjective, th Last Third drops the particle phrase; the glossary's two
sourced entries superseded by ruling; every other name byte-identical. R1.1-R2.1.
```

## Review checklist

- Exactly three catalog values and two glossary texts changed; `git diff` shows
  nothing else in the catalogs.
- The D81 test pins all three, th included.
- `catalog-lock.json` untouched.

## Merge

`git checkout uat && git merge --no-ff feat/59-short-names -m "<VERSION> -
merge feat/59-short-names: step 1, the three short names"`. A conflict aborts
and STOPs.

## Done when

Checklist ticked, `LOG.md` appended with the heading, shas, hook lines, break
line and `session:` line.
