# Step 2: Reminder titles, channel labels, catalog lock

Requirements: R3.1, R3.2, R4.2
Weight: 2

## Anchor check

`en-notification`, `en-channel`, `ar-notification`, `ar-channel`, `notif-pin`,
`contract-pin`, `bridge-pin`. A count other than 1 is a STOP.

## Goal

`notification.reminder` and `channel.reminder` carry no unit token after `{n}`
in all six catalogs; the pinning suites assert the bare-number strings; the
catalog lock is re-taken against the new `en` values.

## Branch

`git checkout -b feat/63-reminder-copy uat`

## Files

- `shared/i18n/en.ts` (change)
- `shared/i18n/ar.ts` (change)
- `shared/i18n/ms.ts` (change)
- `shared/i18n/hi.ts` (change)
- `shared/i18n/so.ts` (change)
- `shared/i18n/th.ts` (change)
- `shared/__tests__/notifications.test.ts` (change)
- `shared/__tests__/prayerIdContract.test.ts` (change)
- `shared/__tests__/i18nBridge.test.ts` (change)
- `shared/i18n/catalog-lock.json` (regenerated)

## Red tests

Rewrite the pins first, against unchanged catalogs:

`shared/__tests__/notifications.test.ts`:

- `genReminderNotificationContent` block: `'Fajr in 15m'` → `'Fajr in 15'`
  (two sites: the catalog-templates `it` and the title-format `it`),
  `'Dhuhr in 5m'` → `'Dhuhr in 5'`, `'Asr in 30m'` → `'Asr in 30'`.
- `it('builds the reminder title with native digits under ar')`: the `ar`
  expectation `'العصر بعد ١٥ د'` → `'العصر بعد ١٥'`, and its trailing `en`
  assertion after locale restoration `'Asr in 15m'` → `'Asr in 15'`.
- Channel block: `name: 'Fajr in 15m Reminder'` → `'Fajr in 15 Reminder'`.
- `it('names the channel from the active catalog, not the English template')`:
  `name: 'تنبيه المغرب بعد ١٥ د'` → `'تنبيه المغرب بعد ١٥'`.

`shared/__tests__/prayerIdContract.test.ts`: the pinned literal
`"'channel.reminder': '{name} in {n}m Reminder'"` becomes
`"'channel.reminder': '{name} in {n} Reminder'"`.

`shared/__tests__/i18nBridge.test.ts`: `'Fajr in 15m'` → `'Fajr in 15'`,
`'Last Third in 30m'` → `'Last Third in 30'`, `'Fajr in 15m Reminder'` →
`'Fajr in 15 Reminder'`.

Run:

```
npx jest shared/__tests__/notifications.test.ts shared/__tests__/prayerIdContract.test.ts shared/__tests__/i18nBridge.test.ts --watchman=false --selectProjects=unit
```

Expected: the rewritten cases fail with the old letter strings in `Received`;
`shared/__tests__/catalogLock.test.ts` still passes at this point (the lock
matches the still-unchanged `en`). A failure elsewhere is a STOP.

## Change contracts

In each catalog, count each old value with `grep -F` before replacing; every
count is 1 at `Planned at`, and a count other than 1 is a STOP.

| Locale | `notification.reminder` | `channel.reminder` |
| --- | --- | --- |
| en | `'{name} in {n}m'` → `'{name} in {n}'` | `'{name} in {n}m Reminder'` → `'{name} in {n} Reminder'` |
| ar | `'{name} بعد {n} د'` → `'{name} بعد {n}'` | `'تنبيه {name} بعد {n} د'` → `'تنبيه {name} بعد {n}'` |
| ms | `'{name} dalam {n}m'` → `'{name} dalam {n}'` | `'Peringatan {name} dalam {n}m'` → `'Peringatan {name} dalam {n}'` |
| hi | `'{name} {n}मि. में'` → `'{name} {n} में'` | `'रिमाइंडर: {name} {n}मि. में'` → `'रिमाइंडर: {name} {n} में'` |
| so | `'{name} {n}d gudahood'` → `'{name} {n} gudahood'` | `'Xasuusiye {name} {n}d gudahood'` → `'Xasuusiye {name} {n} gudahood'` |
| th | `'{name} อีก {n} นาที'` → `'{name} อีก {n}'` | `'แจ้งเตือนล่วงหน้า {name} อีก {n} นาที'` → `'แจ้งเตือนล่วงหน้า {name} อีก {n}'` |

No other key changes. `notification.now`, `reminder.unitMinutes` and every
`duration.*` key keep their bytes (P3, P4, P5).

Then regenerate the derived state, in this order:

```
yarn i18n:lock
yarn i18n:export
grep '"notification.reminder"' shared/i18n/dist/en.json
```

Expected: `yarn i18n:lock` prints `catalog lock written for ar, ms, so, hi, th`;
`git diff shared/i18n/catalog-lock.json` shows five changed hashes and nothing
else. `yarn i18n:export` prints a jest trace naming
`Object.exit (shared/__tests__/i18nBridge.test.ts:38)`: expected, the bridge
writes the file then exits. The grep is the pass check and must print
`"{name} in {n}"`. `shared/i18n/dist/` is gitignored: the grep proves the
regeneration, nothing is committed from it.

## Green run

```
npx jest shared/__tests__/notifications.test.ts shared/__tests__/prayerIdContract.test.ts shared/__tests__/i18nBridge.test.ts shared/__tests__/catalogLock.test.ts shared/__tests__/i18n.test.ts --watchman=false --selectProjects=unit
npx tsc --noEmit
npx biome check . --error-on-warnings
```

All pass, both commands exit 0.

## Break script

`bash scripts/break-step2.sh`: restores the `m` token in `en.ts`'s
`notification.reminder`, runs the notifications suite, expects
`creates content with correct title format` to fail with `Expected: "Fajr in
15"`, `Received: "Fajr in 15m"`, restores the file, ends `ALL AS EXPECTED: 1`.

## Version and commit

Version command as step 1. Add the ten files by name (catalogs, three suites,
`catalog-lock.json`) plus the queue and plan files. Message:

```
<VERSION> - feat(i18n): reminder titles and channel labels drop the unit word

notification.reminder and channel.reminder carry the bare number in all six
catalogs; catalog lock re-taken against the new en values; dist regenerated.
R3.1, R3.2, R4.2.
```

## Review checklist

- Twelve value changes exactly, six files, two keys each; no other key moved.
- `catalog-lock.json` diff shows five hashes.
- The `ar` values lose the trailing ` د` without losing the preceding space
  structure the interpolation needs.
- No `duration.*` key changed.

## Merge

`git checkout uat && git merge --no-ff feat/63-reminder-copy -m "<VERSION> -
merge feat/63-reminder-copy: step 2, reminder copy"`. A conflict aborts and
STOPs.

## Done when

Checklist ticked, `LOG.md` appended with the heading, shas, hook lines, the
grep line from the export check, the break line, `session:` line.
