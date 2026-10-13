# Step 3: The en reminder copy revert and the catalog lock

Requirements: R6.1, R6.2, R6.3
Weight: 2

## Anchor check

Save `scripts/preflight-72.sh` to `$TMPDIR` and run
`bash $TMPDIR/preflight-72.sh en-reminder en-channel notif-pin contract-pin bridge-pin`
with the repository root as the working directory. These are this step's anchors; a count
other than 1 is a STOP.

## Goal

The two en catalog values return to the reference bytes, the en pins in the three copy
suites follow them, the lock is re-taken, and the five non-en catalogs are provably
untouched.

## Branch

`git checkout -b feat/72-reminder-copy uat`

## Files

- `shared/i18n/en.ts` (change)
- `shared/i18n/catalog-lock.json` (regenerated)
- `shared/__tests__/notifications.test.ts` (change)
- `shared/__tests__/prayerIdContract.test.ts` (change)
- `shared/__tests__/i18nBridge.test.ts` (change)

## Red tests

Rewrite the expectations first. Against unchanged catalogs every rewritten case must fail.

`shared/__tests__/notifications.test.ts`:

- `expect(genReminderNotificationContent('fajr', 15, AlertType.Silent).title).toBe('Fajr in 15')`
  → `.toBe('Fajr in 15m')`.
- `expect(genReminderNotificationContent('asr', 15, AlertType.Silent).title).toBe('Asr in 15')`
  → `.toBe('Asr in 15m')`.
- In `it('creates content with correct title format')`:
  `expect(content.title).toBe('Fajr in 15')` → `.toBe('Fajr in 15m')`.
- In `it('creates content with different intervals')`: `'Dhuhr in 5'` → `'Dhuhr in 5m'`
  and `'Asr in 30'` → `'Asr in 30m'`.
- The channel assertion `name: 'Fajr in 15 Reminder',` → `name: 'Fajr in 15m Reminder',`.
- The `ar` expectation `'العصر بعد ١٥'` is UNCHANGED (R6.2, D72.7). Do not touch it.

`shared/__tests__/prayerIdContract.test.ts`: the expectation
`expect(catalog).toContain("'channel.reminder': '{name} in {n} Reminder'")` →
`expect(catalog).toContain("'channel.reminder': '{name} in {n}m Reminder'")`.

`shared/__tests__/i18nBridge.test.ts`:

- `t('notification.reminder', { name: 'Fajr', n: 15 })` → `'Fajr in 15m'`.
- `t('notification.reminder', { name: 'Last Third', n: 30 })` → `'Last Third in 30m'`.
- `t('channel.reminder', { name: 'Fajr', n: 15 })` → `'Fajr in 15m Reminder'`.

Run, from the repository root:

```
npx jest shared/__tests__/notifications.test.ts shared/__tests__/prayerIdContract.test.ts shared/__tests__/i18nBridge.test.ts --watchman=false --selectProjects=unit
```

Expected: exactly the rewritten cases fail with `Expected: "Fajr in 15m"`-style diffs, and
no case outside them fails. If a test the plan did not name fails, STOP.

## Change contracts

1. In `shared/i18n/en.ts`, two exact replacements, each counted with `grep -F` before
   replacing (a count other than 1 is a STOP):
   - `'notification.reminder': '{name} in {n}',` → `'notification.reminder': '{name} in {n}m',`
   - `'channel.reminder': '{name} in {n} Reminder',` → `'channel.reminder': '{name} in {n}m Reminder',`
2. No other catalog file changes: `git status --porcelain` must list no file under
   `shared/i18n/` except `en.ts` and `catalog-lock.json` (R6.2).
3. Run `yarn i18n:lock`; confirm `git diff shared/i18n/catalog-lock.json` shows five changed
   hashes, then `npx jest shared/__tests__/catalogLock.test.ts --watchman=false
   --selectProjects=unit` passes (R6.3).
4. Run `yarn i18n:export`; the jest trace naming `Object.exit
   (shared/__tests__/i18nBridge.test.ts)` is expected. The pass check is
   `grep '"notification.reminder"' shared/i18n/dist/en.json` printing
   `"{name} in {n}m"`.

## Green run

The command from the red section, all passing, then `npx tsc --noEmit` and
`npx biome check . --error-on-warnings`, both exit 0.

## Break script

`bash scripts/break-step3.sh` from this folder, copied to `$TMPDIR` and run from the
repository root against the merged step. It removes the `m` from the en channel value,
runs the contract and lock suites, expects the named failures, restores the file, and ends
`ALL AS EXPECTED: 1`.

## Version and commit

Version command: the next patch after `uat`'s `package.json` under the version lock. Set it
in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Add the five
files by name plus `ai/plans/README.md` (status `IN PROGRESS, step 3`) and this folder's
`PLAN.md` and `LOG.md`. Message:

```
<VERSION> - feat(i18n): en reminder titles and channel labels revert to the reference unit word

The two en catalog values return to the 194ed701 bytes; the five non-en catalogs keep row
63's copy untouched. Lock re-taken, dist regenerated. R1.1, R6.1, R6.2, R6.3.
```

## Review checklist

- The diff touches only the five listed files plus plan and queue files; no non-en catalog
  appears in `git show <sha>`.
- Both en values equal the reference bytes (`git show 194ed701:shared/i18n/en.ts` carries
  them at its lines 90 and 193).
- The lock hashes are re-taken in the same commit.
- No ar, ms, so, hi or th value changed anywhere in the diff.

## Merge

`git checkout uat && git merge --no-ff feat/72-reminder-copy -m "<VERSION> - merge
feat/72-reminder-copy: step 3, en reminder copy"`. A conflict aborts and STOPs.

## Done when

Checklist ticked, `LOG.md` appended with the step heading, commit sha, hook lines, break
line and `session:` line.
