# Step 1: the seconds group never dims

Requirements: R1.1, R1.2
Weight: 2

## Anchor check

`bash ai/plans/81-greenbuild-refinements/scripts/preflight-81.sh 1` (or its
`$TMPDIR` copy) from the repository root. It must end `PREFLIGHT OK`.

## Goal

A three-group display's seconds group never carries the dim flag, whatever its
digits; hours and minutes keep the row-79 treatment exactly.

## Branch

```
git checkout -b feat/81-seconds-bright uat
```

## Files

- `shared/time.ts`
- `shared/__tests__/time.test.ts`
- Version files: `app.json`, `package.json`, `android/app/build.gradle`

## Red tests

In `shared/__tests__/time.test.ts`, directly after the test anchored by
`time-test-dim.txt`, add:

```ts
  it('keeps the seconds group bright at the minute instant, while hours and minutes still dim', () => {
    // Row 81: seconds tick on, so 00:01:00 renders its seconds 00 bright
    expect(splitColonSections('00:01:00')?.[4].dim).toBe(false);
    expect(splitColonSections('00:01:00')?.[0].dim).toBe(true);
    expect(splitColonSections('00:00:59')?.[2].dim).toBe(true);
    expect(splitColonSections('25:00')?.[2].dim).toBe(true);
  });
```

Run `npx jest shared/__tests__/time.test.ts --selectProjects=unit --watchman=false`.
Expected red: `Expected: false Received: true` on the first assertion (today
the seconds 00 dims); the other three pass before and after, they are the
invariant guards. No other test moves.

## Change contract

In `splitColonSections`, the `groups.forEach` body becomes exactly:

```ts
  groups.forEach((group, index) => {
    if (index > 0) sections.push({ text: ':', dim: true, colon: true });
    // Seconds tick on, so they are never a spent category and never dim (row 81)
    const isSeconds = groups.length === 3 && index === 2;
    sections.push({ text: group, dim: !isSeconds && ALL_ZEROS.test(group), colon: false });
  });
```

Nothing else in the file changes, except one doc line: the `dim` field's
comment in the `CountdownSection` interface becomes `/** True while the group
is the all-zero pair, except a three-group display's seconds, which never dim
(row 81) */`.

## Green run

The suite passes; `npx tsc --noEmit` exits 0; `npx biome check .
--error-on-warnings` exits 0.

## Break script

After the merge, on `uat`: `bash
ai/plans/81-greenbuild-refinements/scripts/break-step1.sh`. It must end
`ALL AS EXPECTED: 1` and leave `git status --porcelain` empty.

## Version and commit

The version command prints `2.0.241` (the READY merge), so the step version is
`2.0.242`. Set it in `app.json` (first), `package.json` and
`android/app/build.gradle`. Commit, adding by name: `shared/time.ts`,
`shared/__tests__/time.test.ts`, `app.json`, `package.json`,
`ai/plans/README.md` (ticket 81 to `IN PROGRESS, step 1`), and this plan
folder's `PLAN.md`, `LOG.md` and `steps/1-seconds-never-dim.md`. Message:

```
2.0.242 - feat(81): the seconds group never dims, hours and minutes unchanged
```

## Review checklist

- The diff touches only the listed files; the colons' own `dim: true` line is
  byte-identical.
- The comment is the one the contract gives, on its own line.
- The new test's four assertions are exactly the contract's.

## Merge

```
git checkout uat && git merge --no-ff feat/81-seconds-bright -m "2.0.242 - merge feat/81-seconds-bright: step 1, ticket 81"
```

## Done when

Step 1 ticked in `PLAN.md` section 6, the LOG entry written with the ledger
headings, the merge on uat, the tree clean.