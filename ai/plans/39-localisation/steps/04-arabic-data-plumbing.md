# Step 04: `PrayerRow.arabic` dies end to end

The row's Arabic field, its parallel arrays, the sheet state's `prayerArabic`, the commit
signatures' Arabic parameter, and the bookkeeping record's `arabicName` field all go. Stored
records that already carry `arabicName` keep parsing (the reader is `JSON.parse`, extra fields
ignored); the type narrows so no new write carries it.

Requirements: R2.1

- Branch: `feat/38-04-plumbing`
- Anchors: `prayerrow-type`, `createprayer`, `namesforDate`, `unreadable-row`, `constants-arrays`,
  `scheduled-record-type`, `survived-record`, `multi-schedule-sig`, `alert-sheet-write`, `reschedule-head`
- Files: `shared/types.ts`, `shared/prayer.ts`, `shared/constants.ts`,
  `shared/notifications.ts`, `stores/notifications.ts`, `stores/ui.ts`,
  `components/prayer/Alert.tsx`, `components/sheets/screens/Alert.tsx`, `hooks/useNotification.ts`,
  `hooks/usePrayer.ts`, and the suites R14's table names for this step:
  `stores/__tests__/notificationAlertCommit.test.ts`, `notificationSchedulingLock.test.ts`,
  `notificationSinglePrayerUpdate.test.ts`, `notificationRefreshGate.test.ts`,
  `notificationOffCancelFailure.test.ts`, `notificationStaleCancelFailure.test.ts`,
  `hooks/__tests__/useNotification.test.ts`, `notificationSettingsFallback.test.ts`,
  `device/__tests__/notifications.test.ts`, `notificationsClockChange.test.ts`,
  `notificationNativeTimeout.test.ts`, `reminderCancelFailure.test.ts`,
  `shared/__tests__/prayer.test.ts`, `sequence.test.ts`, `constants.test.ts`,
  `nightTimes.test.ts`, `istijabaFridayList.test.ts`, `widgetSimulation.test.ts`,
  `widgetTimeline.test.ts`, `widgetSnapshot.test.ts`, `widgetRenderer.test.ts`,
  `stores/__tests__/schedule.test.ts`, `countdown.test.ts` fixtures, `hooks/__tests__/usePrayer.test.ts`,
  `usePrayerAgo.test.ts`, `components/prayer/__tests__/Alert.test.tsx`,
  `components/sheets/screens/__tests__/Alert.test.tsx`, `stores/__tests__/ui.test.ts`,
  `components/overlay/__tests__/overlayContent.test.ts`

## Red

1. `shared/__tests__/prayer.test.ts`: add `it('builds rows with an english name and no arabic field')`
   - build a Standard list for a seeded day, assert every row's `english` equals its frozen
   name and `('arabic' in row)` is false. Fails today (the field exists).
2. `stores/__tests__/notifications.test.ts` (or `notificationAlertCommit.test.ts` where the
   commit lives): add `it('commits a prayer alert change without an arabic name')` - call the
   commit with the post-change signature (no arabic argument) and assert the armed record and
   preference key. Fails today (signature arity).

The 30-plus suites above change their fixtures with the surface (mock rows lose `arabic:`,
record mocks lose `arabicName`, commit calls lose the parameter): these edits are the change,
each suite keeps every behaviour assertion.

## Change

1. `shared/types.ts` (`prayerrow-type`): `PrayerRow` loses `arabic`; `english: string`
   stays (renamed in step 06).
2. `shared/prayer.ts`: `CreatePrayerParams` loses `arabic` (`createprayer` anchor);
   `getPrayerNamesForDate` returns English names only (`namesforDate`); the unreadable row and
   readable row builders stop writing `arabic` (`unreadable-row`).
3. `shared/constants.ts`: delete `PRAYERS_ARABIC`, `EXTRAS_ARABIC`, `EXTRAS_EXPLANATIONS_ARABIC`
   (`constants-arrays` and the `:1006` block). `PRAYERS_ENGLISH` and `EXTRAS_ENGLISH` stay
   until step 06.
4. `shared/notifications.ts` (`scheduled-record-type`): `ScheduledNotification` loses
   `arabicName`; `genNotificationContent` and `genReminderNotificationContent` lose their
   `_arabicName` parameters.
5. `stores/notifications.ts`: the survived-record write drops `arabicName`
   (`survived-record`); `_addMultipleScheduleNotificationsForPrayer` loses the parameter
   (`multi-schedule-sig`) and threads the same parameter loss through the call chain
   (scheduleNotificationForDate, the reminder twins, `commitPrayerAlertChange`,
   `commitAlertMenuChanges`); the
   preference snapshot keeps `prayer` (a display string in a log - it stays English).
6. `stores/ui.ts`: `AlertSheetState` loses `prayerArabic`.
7. `components/prayer/Alert.tsx` (`alert-sheet-write`): the sheet write drops `prayerArabic`
   and its dependency entry. `components/sheets/screens/Alert.tsx` drops every
   `prayerArabic`/`state.prayerArabic` read.
8. `hooks/useNotification.ts` drops the arabic parameter threading;
   `hooks/usePrayer.ts` loading row drops `arabic: ''` (the `english: ''` sentinel stays one
   more step).
9. `device/notifications.ts`: record writes drop `arabicName`; row parameters typed
   `PrayerRow` already, no change beyond the field.

## Green

Every named suite green. `npx tsc --noEmit` clean (this is the step's real safety net: every
missed site is a compile error, because the field leaves the type). Biome clean.

## Break script

1. Re-add `arabic: namesArabic[index]` to the unreadable-row builder in `shared/prayer.ts`
   (with a local `namesArabic` sourced from a hardcoded array). Named test 1 fails. Restore.
2. Re-add `arabicName` to the survived record write. Named test 2's record assertion fails
   (the record carries the field). Restore.
3. In `shared/notifications.ts` change `title: \`${englishName} now\`` to
   `title: \`${englishName} athan\``. `shared/__tests__/notifications.test.ts` title pins
   fail. Restore. End `ALL AS EXPECTED: 1`.

## Version and commit

`<VERSION> - feat(i18n): PrayerRow.arabic dies end to end: rows, commits, records, sheet state`

## Review checklist

The diff is wide and mechanical. Read it as a stranger: every hunk deletes; nothing reorders,
renames, or retypes beyond the arabic removal (the field rename is step 06, not here). Shipped
classes: Residue (search for surviving `arabic` identifiers in the diff's files), Thread (none
expected), Rule (the commit signature change must not alter any key, id or ordering byte).

## Done when

`grep -rn 'arabic' shared/ stores/ components/ hooks/ device/ --include='*.ts' --include='*.tsx' | grep -v '__tests__' | grep -v -i 'preference_show_arabic'`
returns only comments naming the removed key in migration code (step 12's) and zero code
identifiers. Break `ALL AS EXPECTED: 1`. Hook lines as step 01. Merged `--no-ff`.

## Restore

`git checkout --` each changed file by name from the step's file list.
