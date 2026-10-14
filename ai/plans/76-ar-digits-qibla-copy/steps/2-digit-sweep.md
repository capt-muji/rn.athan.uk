# Step 2: the five-box digit sweep and the cardinal lock

Requirements: R2.1, R2.2 (R3.1 superseded by step 2b, the owner's 2026-10-14 ruling)
Weight: 1

Anchor check: `scripts/anchors/explanation-digits.txt` counts 1 in
`components/prayer/Explanation.tsx`; `scripts/anchors/explanation-ar-test.txt` counts
1 in `components/prayer/__tests__/Explanation.test.tsx`;
`scripts/anchors/locale-native-digits.txt` counts 1 in `shared/i18n/locale.ts`;
`scripts/anchors/ar-cardinals.txt` counts 1 in `shared/i18n/ar.ts`.

Goal: lock, in tests, that every Extras info box follows the locale digit law in all
six languages, and that the compass cardinal mapping cannot drift. No production line
changes in this step.

Branch: `ticket/76`.

Files: `components/prayer/__tests__/Explanation.test.tsx`,
`shared/__tests__/qiblaCompass.test.ts` (the cardinal lock, superseded by step 2b),
`app.json`, `package.json`. (`Explanation.tsx` is touched only by the break script and
reverted.)

Tests, added to `Explanation.test.tsx`:

1. A sweep describe over `EXTRAS_EXPLANATIONS` (all five keys) crossed with the six
   locale ids from `LOCALE_IDS` (`shared/i18n/locale.ts`): for each pair, set the
   locale, render `<PrayerExplanation prayerName={EXTRA_PRAYER_TITLES[i]} explanation={t(key)} />`,
   and assert the rendered sentence equals `localizeDigits(t(key))`. Under ar also
   assert the rendered string matches no `[0-9]`; under every other locale assert the
   rendered string equals `t(key)` byte-for-byte (the identity half of the law). Restore
   `en` in the finally block. The en row of istijaba proves the Latin 1 stays Latin.
2. A cardinal lock in `shared/__tests__/qiblaCompass.test.ts` (the suite that
   already imports `resolveCardinals`): under `en`, `resolveCardinals()` returns N at
   0, E at 90, S at 180, W at 270; under `ar` it returns ش, ق, ج, غ at the same
   angles, with the letters read from the live catalog through `t()`.

   **SUPERSEDED 2026-10-14 by the owner ruling (PLAN.md section 0): the ring's letters
   are replaced by the four Latin numbers. This lock was committed at 2.0.604 and is
   replaced by step 2b's number-and-degree-circle tests. The record is kept as written.**

Both tests pass against the shipped code; that is the point (D76.1, D76.4). Their
guard is the break script; their red-first evidence is the break run recorded in
LOG.md, not a pre-change failure.

Green run: the two touched suites plus
`components/__tests__/typographySweep.test.tsx` (it renders PrayerExplanation under
ar), then `yarn validate`.

Break script (run after green, revert immediately):

```bash
# Break the digit law in the renderer; the digit-carrying ar rows must fail
perl -0pi -e 's/\{localizeDigits\(explanation\)\}/\{explanation\}/' components/prayer/Explanation.tsx
npx jest components/prayer/__tests__/Explanation.test.tsx --watchman=false --selectProjects=components
# Expected: 3 failed, 33 passed — the existing ar Suhoor test, the ar suhoor sweep
# row and the ar duha sweep row (the only digit-carrying ar sentences: ar.ts:152-153;
# the other three ar rows carry no ASCII digit and stay green by design). Revert:
git checkout -- components/prayer/Explanation.tsx
npx jest components/prayer/__tests__/Explanation.test.tsx --watchman=false --selectProjects=components
# Expected: green again
```

Version and commit: 2.0.604 in both files (2.0.603 was consumed by the step-2 stop
record, commit `866c011b`). Commit message:
`2.0.604 - test(i18n): the five Extras boxes swept across the six locale digit laws; the ar compass cardinals locked to the dial convention`.

Review: the sweep must read the catalogs through `t()` at the active locale (never
hardcode the six strings in the test), and the cardinal test must read its letters
through `t()` too, so a future catalog change moves the test with the catalog.

Merge: none this run.

Done when: the break run's failing lines are in LOG.md, both suites and
`yarn validate` are green, and the commit is on `ticket/76` at 2.0.604.
