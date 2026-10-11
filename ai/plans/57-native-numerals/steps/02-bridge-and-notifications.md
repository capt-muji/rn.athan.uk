# Step 02: the bridge substitution and the notification sites

**Requirements:** R2.1, R6.1
Weight: 2
**Anchors:** `bridge-substitution`.

## Goal

Numeric `t()` parameters localise at substitution, so notification titles, channel
names, reminder bodies and every catalog string with a count renders native digits in
ar. Stored keys and log lines stay Latin.

## Branch

`feat/57-02-bridge` off `uat`.

## Files

- `shared/i18n/index.ts` (the substitution site)
- tests: `shared/__tests__/i18nBridge.test.ts` extension, `shared/__tests__/notifications.test.ts` extension

## Red tests

1. Bridge suite extension: `t('channel.athan', { n: 3 })` under ar returns the catalog
   template with `'٣'` substituted; under en returns `'Athan 3'` byte-identical - fails
   today (the bridge substitutes raw).
2. Notifications suite extension: `genNotificationContent` under ar for a reminder
   builds `'العصر بعد ١٥ د'`-shaped output (the ar template is
   `'notification.reminder': '{name} بعد {n} د'`) - fails today.

## Change contracts

1. `shared/i18n/index.ts`: at the parameter substitution site, every parameter value
   passes through `localiseDigits` before interpolation. The exact call shape is a
   `const localized = localiseDigits(String(supplied));` line feeding the existing
   replace (the substitution's value variable is `supplied`), so the break script's
   bytes are pinned. Numbers localise exactly like strings (the red test passes
   `n: 3` and expects `'٣'`).
2. No notification, channel or log call site changes: they already pass numbers
   through `t()`. The scheduling identifiers (`athan_1_v4`, file names, log lines)
   never pass through `t()` and stay Latin by construction - the suites pin them.

## Green run

Extended suites pass; `yarn validate` passes; tsc and biome exit 0.

## Break script

Copy `shared/i18n/index.ts` to `$TMPDIR`; `sed -i '' "s/const localized = localiseDigits(String(supplied))/const localized = String(supplied)/" shared/i18n/index.ts`; run `npx jest shared/__tests__/i18nBridge.test.ts --watchman=false --selectProjects=unit`, expect the ar substitution test to fail with the Latin digit shown; restore; rerun, expect pass. Ends `ALL AS EXPECTED: 1`.

## Version and commit

Message: `<VERSION> - feat(i18n): numeric t() parameters localise at substitution, notifications follow`.

## Review checklist

- The identifier contract suite (frozen channel ids, file names) stays green untouched.
- No parameter localises beyond digits (names, words pass through).

## Merge

`git checkout uat && git merge --no-ff feat/57-02-bridge -m "Merge feat/57-02-bridge into uat: job 57 step 02"`.

## Done when

Checklist ticked; row reads `IN PROGRESS, step 2`.
