# The spike: the recommended approach was built and measured, then deleted

`ai/plans/PLANNER-BRIEF.md` section 3 item 8 requires the risky parts to be proven before they are
written into a plan, with the spike's code thrown away and only what it TAUGHT recorded. This is
that record.

The risk being retired: R1 recommends a hand-rolled `t()` with no library, against a repo that
enforces 100% coverage on statements, branches, functions and lines with no ignore comments. If
that bar cannot be met, or if compile-time key safety does not work, the recommendation
collapses and a library is needed after all.

## What was built

A minimal `t()` with the shape R1 and R5 jointly specify: structured keys, a TypeScript catalog
with `as const`, `keyof typeof` for key safety, English fallback, and named interpolation.

Roughly 20 lines of implementation, 5 tests.

## Result 1: 100% coverage on all four measures, with 5 tests

Run in the worktree against the repo's own `unit` Jest project, with `node_modules` symlinked from
the main checkout:

```
PASS unit shared/__spike__/__tests__/t.test.ts
  t
    ✓ returns the English string for a key
    ✓ interpolates named variables
    ✓ leaves an unknown placeholder untouched
    ✓ falls back to English when the active catalog lacks the key
    ✓ uses the active catalog when it has the key

Statements   : 100% ( 11/11 )
Branches     : 100% ( 6/6 )
Functions    : 100% ( 3/3 )
Lines        : 100% ( 10/10 )
```

Five tests reach every branch, including both sides of the fallback and both sides of the
unknown-placeholder guard. So the coverage mandate is not an obstacle to a hand-rolled `t()`. It is
an argument FOR one, because a library's uncovered branches would have to be excluded through
`UNMEASURED`, which the repo reserves for exactly that and prefers to keep empty.

## Result 2: compile-time key safety works, and the error is good

A deliberate typo was added and `tsc --noEmit` run against the repo's real config:

```
shared/__spike__/t.ts(30,36): error TS2345: Argument of type '"settings.titel"' is not
assignable to parameter of type '"notification.atTime" | "notification.reminder" |
"prayer.fajr" | "settings.sound.changeAthan" | "settings.title"'
```

Two things worth noting. The typo is rejected, which is the claim. And the error message
enumerates every valid key, so a developer who mistypes gets the list rather than a hunt. That is
better feedback than i18next's `CustomTypeOptions` augmentation gives, because the union is the
type rather than a generic lookup.

## What the spike taught that changes the plan

1. **The interpolation regex needs the unknown-placeholder branch to be deliberate.** Leaving
   `{name}` untouched when no value is supplied is the correct behaviour, because it renders
   visibly wrong rather than rendering "undefined", which is the failure this repo's "NO FALLBACKS"
   rule is about. It is also a branch, so it needs its own test to reach 100%.
2. **The English fallback is a branch per key lookup**, so the test that proves it must use a
   catalog that is missing the key, not an empty catalog, or the branch is only half covered.
3. **`as const` on the catalog is load-bearing.** Without it, `keyof typeof` widens to `string` and
   every typo compiles. The plan states this explicitly, because it is one word and its absence is
   silent.
4. **The spike needed `node_modules` symlinked** from the main checkout, which matches the
   planner brief's own instruction for scratch worktrees. Worth repeating in the plan so the
   execution session does not rediscover it.

## What the spike did NOT prove

- Nothing about Hermes. The suite ran on Node, which is exactly the trap `R1-FINDINGS.md` records:
  Node has full `Intl` and Hermes does not. This `t()` never calls `Intl`, so it is unaffected, but
  the spike is not evidence about the device.
- Nothing about bundle size, load cost on a Snapdragon 820, or the re-render cost of a language
  change.
- Nothing about the catalog at 20 locales. It used one catalog of five keys.

Those remain the plan's named experiments.

## Cleanup

The spike lived at `shared/__spike__/` and was deleted after measurement. The worktree is clean:
`git status --short` returns nothing. No spike code appears in the plan, per the brief.
