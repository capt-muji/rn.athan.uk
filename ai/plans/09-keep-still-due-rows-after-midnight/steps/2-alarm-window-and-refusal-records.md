# Step 2: The alarm window starts from the still-due list day, and a refused cancel keeps its record

This file is part of `ai/plans/09-keep-still-due-rows-after-midnight/PLAN.md`. Run every command from
`/Users/muji/repos/rn.athan.uk`. This step is **specified**: you build it from the contracts below.

0. **Anchor check.** Run `bash ai/plans/09-keep-still-due-rows-after-midnight/scripts/check-anchors.sh 2`.
   Expected: one line per anchor `2-1` to `2-11`, each ending in `1`, then `ANCHORS OK`. Anchor `2-2`
   anchors the import line step 1 inserted, so it counts 1 only because step 1 is merged; any count
   other than `1` (including for `2-2`) means NEEDS REPLAN (`EXECUTOR-BRIEF.md` section 1, item 4).

1. **Goal:** a reschedule between 00:00 and a still-due post-midnight row re-attempts that row's
   alarm under its own identifier instead of cancelling it as stale, the window keeps its length and
   moves on the moment the row has passed, and a phone that refuses to cancel such an alarm leaves
   the record the repair needs.

2. **Branch:** `git checkout -b fix/still-due-rows-keep-their-alarms uat-2`.

3. **Files.** Only these change, apart from `app.json`, `package.json`, the local
   `android/app/build.gradle` and the three plan files:
   - `shared/prayer.ts`;
   - `shared/notifications.ts`;
   - `stores/notifications.ts`;
   - `stores/__tests__/notificationsAroundMidnight.test.ts`;
   - `shared/__tests__/prayer.test.ts`;
   - `shared/__tests__/notifications.test.ts`.

   Nothing under `app/`, `components/`, `hooks/`, `stores/schedule.ts`, `stores/countdown.ts`,
   `stores/sync.ts`, `stores/bootstrap.ts`, `device/`, `mocks/`, `e2e/` or `node_modules/` changes.

4. **Tests first (red).**

   **In `shared/__tests__/prayer.test.ts`** (existing suite): add `firstStillDueListDayForPrayer,` to
   the named import from `'../prayer'`, beside step 1's `firstStillDueListDay,`. Then append, at the
   very end of the file, this block verbatim:

   ```ts

   describe('firstStillDueListDayForPrayer', () => {
     const ISHA_AT_0001 = ['02:40', '04:43', '13:02', '17:20', '21:25', '00:01'];
     const days = Object.fromEntries(
       ['2026-06-19', '2026-06-20', '2026-06-21', '2026-06-22'].map((d) => [d, ISHA_AT_0001])
     );

     it("answers yesterday while yesterday's own row of the prayer is still to come", () => {
       storeTimes(days);
       expect(firstStillDueListDayForPrayer(ScheduleType.Standard, 'Isha', new Date('2026-06-20T23:00:30.000Z'))).toBe(
         '2026-06-20'
       );
     });

     it("answers today for a prayer whose yesterday row has passed, while another row is still to come", () => {
       storeTimes(days);
       expect(firstStillDueListDayForPrayer(ScheduleType.Standard, 'Fajr', new Date('2026-06-20T23:00:30.000Z'))).toBe(
         '2026-06-21'
       );
     });

     it('treats a row at exactly the asking instant as passed, as the scheduler does', () => {
       storeTimes(days);
       expect(firstStillDueListDayForPrayer(ScheduleType.Standard, 'Isha', new Date('2026-06-20T23:01:00.000Z'))).toBe(
         '2026-06-21'
       );
     });

     it('answers yesterday for a Magrib and an Isha that both fall after midnight', () => {
       const shape = ['01:30', '02:55', '13:30', '17:30', '00:01', '00:25'];
       storeTimes(Object.fromEntries(['2026-06-19', '2026-06-20', '2026-06-21', '2026-06-22'].map((d) => [d, shape])));
       expect(firstStillDueListDayForPrayer(ScheduleType.Standard, 'Magrib', new Date('2026-06-20T23:00:30.000Z'))).toBe(
         '2026-06-20'
       );
       expect(firstStillDueListDayForPrayer(ScheduleType.Standard, 'Isha', new Date('2026-06-20T23:00:30.000Z'))).toBe(
         '2026-06-20'
       );
     });

     it("answers today when yesterday's own row of the prayer is unreadable", () => {
       storeTimes({
         '2026-06-20': ['02:40', '04:43', '13:02', '17:20', '21:25', null],
         '2026-06-21': ISHA_AT_0001,
       });
       expect(firstStillDueListDayForPrayer(ScheduleType.Standard, 'Isha', new Date('2026-06-20T23:00:30.000Z'))).toBe(
         '2026-06-21'
       );
     });

     it("answers yesterday for a Friday Istijaba that falls after midnight, and today beside it", () => {
       const shape = ['01:32', '02:58', '13:31', '17:31', '01:20', '01:44'];
       storeTimes(Object.fromEntries(['2026-06-25', '2026-06-26', '2026-06-27', '2026-06-28'].map((d) => [d, shape])));
       expect(firstStillDueListDayForPrayer(ScheduleType.Extra, 'Istijaba', new Date('2026-06-26T23:05:00.000Z'))).toBe(
         '2026-06-26'
       );
       expect(firstStillDueListDayForPrayer(ScheduleType.Extra, 'Duha', new Date('2026-06-26T23:05:00.000Z'))).toBe(
         '2026-06-27'
       );
     });
   });
   ```

   The six `it`s:

   | # | `it` name | Proves | Inputs | Asserts |
   | --- | --- | --- | --- | --- |
   | 1 | `answers yesterday while yesterday's own row of the prayer is still to come` | The per-prayer look-back | The Isha-00:01 days; now `2026-06-20T23:00:30.000Z`; prayer Isha | `'2026-06-20'` |
   | 2 | `answers today for a prayer whose yesterday row has passed, while another row is still to come` | The answer is per prayer, not per list: yesterday's Isha being due does not move Fajr | Same; prayer Fajr | `'2026-06-21'` |
   | 3 | `treats a row at exactly the asking instant as passed, as the scheduler does` | The `>` boundary matches the scheduler's skip (`<=` past) | Same; now exactly `2026-06-20T23:01:00.000Z` | `'2026-06-21'` |
   | 4 | `answers yesterday for a Magrib and an Isha that both fall after midnight` | Both crossing prayers shift | The Magrib-00:01/Isha-00:25 days; now as in 1 | Both prayers `'2026-06-20'` |
   | 5 | `answers today when yesterday's own row of the prayer is unreadable` | No readable row, no shift | `2026-06-20` with isha null | `'2026-06-21'` |
   | 6 | `answers yesterday for a Friday Istijaba that falls after midnight, and today beside it` | The Extras crossing row shifts and its neighbour does not | The Istijaba-shape days (26 June 2026 a Friday); now `2026-06-26T23:05:00.000Z` | Istijaba `'2026-06-26'`, Duha `'2026-06-27'` |

   **In `stores/__tests__/notificationsAroundMidnight.test.ts`** (existing suite): replace the import
   block of anchor `2-8` with:

   ```ts
   import * as Notifications from 'expo-notifications';

   import { AlertType, ScheduleType } from '@/shared/types';
   import * as Database from '@/stores/database';
   import { rescheduleAllNotifications, setPrayerAlertType } from '@/stores/notifications';

   import {
     cancelCalls,
     enable,
     forgetCalls,
     minutesBefore,
     osIdentifiers,
     resetAlarms,
     sameTimesOn,
     storeDays,
     type Times,
     triggers,
   } from './alarmHarness';
   ```

   Then append, at the very end of the file (after anchor `2-9`'s last line), this block verbatim:

   ```ts

   describe("a reschedule between 00:00 and yesterday's still-due rows (finding 74, gap map item 6)", () => {
     // The alarm window starts from the earliest list day that still has a row due (owner, 2026-09-13),
     // so a reschedule after midnight re-attempts yesterday's post-midnight alarm instead of cancelling
     // it as stale. The window keeps its length: while yesterday is still due it is [yesterday, today]
     const ISHA_AT_0001: Times = ['02:40', '04:43', '13:02', '17:20', '21:25', '00:01'];
     const days = (shape: Times) => sameTimesOn(['2026-06-19', '2026-06-20', '2026-06-21', '2026-06-22'], shape);

     it("keeps yesterday's list Isha armed, re-attempted under its own identifier", async () => {
       jest.setSystemTime(new Date('2026-06-20T20:00:00.000Z'));
       storeDays(days(ISHA_AT_0001));
       enable(ScheduleType.Standard, 'Isha', 5);

       await rescheduleAllNotifications();
       expect(osIdentifiers()).toEqual(
         [
           'athan_standard_isha_2026-06-20',
           'athan_standard_isha_2026-06-21',
           'reminder_standard_isha_2026-06-20_5',
           'reminder_standard_isha_2026-06-21_5',
         ].sort()
       );

       // 00:00:30 BST on the 21st: the 20th's Isha is 30 seconds away, its reminder already past
       jest.setSystemTime(new Date('2026-06-20T23:00:30.000Z'));
       forgetCalls();

       await rescheduleAllNotifications();

       expect(triggers()['athan_standard_isha_2026-06-20']).toBe('2026-06-20T23:01:00.000Z');
       // Only the reminder whose moment has passed is stale; the at-time is never passed to cancel
       expect(cancelCalls()).toEqual(['reminder_standard_isha_2026-06-20_5']);
       expect(osIdentifiers()).toEqual(
         ['athan_standard_isha_2026-06-20', 'athan_standard_isha_2026-06-21', 'reminder_standard_isha_2026-06-21_5'].sort()
       );
     });

     it('keeps a Magrib after midnight armed the same way', async () => {
       jest.setSystemTime(new Date('2026-06-20T20:00:00.000Z'));
       storeDays(days(['01:30', '02:55', '13:30', '17:30', '00:01', '00:25']));
       enable(ScheduleType.Standard, 'Magrib', 5);

       await rescheduleAllNotifications();

       jest.setSystemTime(new Date('2026-06-20T23:00:30.000Z'));
       forgetCalls();

       await rescheduleAllNotifications();

       expect(triggers()['athan_standard_magrib_2026-06-20']).toBe('2026-06-20T23:01:00.000Z');
       expect(cancelCalls()).toEqual(['reminder_standard_magrib_2026-06-20_5']);
       expect(osIdentifiers()).toEqual(
         [
           'athan_standard_magrib_2026-06-20',
           'athan_standard_magrib_2026-06-21',
           'reminder_standard_magrib_2026-06-21_5',
         ].sort()
       );
     });

     it('keeps a Friday Istijaba that falls after midnight armed, while the Saturday list carries none', async () => {
       // 26 June 2026 is a Friday; its Istijaba falls at 00:20 BST on the Saturday
       const shape: Times = ['01:32', '02:58', '13:31', '17:31', '01:20', '01:44'];
       jest.setSystemTime(new Date('2026-06-26T20:00:00.000Z'));
       storeDays(sameTimesOn(['2026-06-25', '2026-06-26', '2026-06-27', '2026-06-28'], shape));
       enable(ScheduleType.Extra, 'Istijaba', 5);

       await rescheduleAllNotifications();

       // 00:05 BST on the Saturday: Friday's Istijaba is 15 minutes away
       jest.setSystemTime(new Date('2026-06-26T23:05:00.000Z'));
       forgetCalls();

       await rescheduleAllNotifications();

       expect(triggers()['athan_extra_istijaba_2026-06-26']).toBe('2026-06-26T23:20:00.000Z');
       expect(cancelCalls()).toEqual([]);
       expect(osIdentifiers()).toEqual(['athan_extra_istijaba_2026-06-26', 'reminder_extra_istijaba_2026-06-26_5'].sort());
     });

     it('lets the window move on the moment the still-due row has passed, as the scheduler skips past rows', async () => {
       jest.setSystemTime(new Date('2026-06-20T20:00:00.000Z'));
       storeDays(days(ISHA_AT_0001));
       enable(ScheduleType.Standard, 'Isha', 5);

       await rescheduleAllNotifications();

       jest.setSystemTime(new Date('2026-06-20T23:01:00.000Z'));
       forgetCalls();

       await rescheduleAllNotifications();

       expect(cancelCalls().sort()).toEqual(['athan_standard_isha_2026-06-20', 'reminder_standard_isha_2026-06-20_5']);
       expect(osIdentifiers()).toEqual(
         [
           'athan_standard_isha_2026-06-21',
           'athan_standard_isha_2026-06-22',
           'reminder_standard_isha_2026-06-21_5',
           'reminder_standard_isha_2026-06-22_5',
         ].sort()
       );
     });

     it('keeps the record of a refused cancel of a still-due yesterday alarm, so the repair can reach it', async () => {
       jest.setSystemTime(new Date('2026-06-20T20:00:00.000Z'));
       storeDays(days(ISHA_AT_0001));
       enable(ScheduleType.Standard, 'Isha', 5);

       await rescheduleAllNotifications();

       // The user turns Isha off at 00:00:30 and the phone refuses to cancel yesterday's at-time alarm
       jest.setSystemTime(new Date('2026-06-20T23:00:30.000Z'));
       const cancelBase = (Notifications.cancelScheduledNotificationAsync as jest.Mock).getMockImplementation();
       (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockImplementation(async (id: string) => {
         if (id === 'athan_standard_isha_2026-06-20') throw new Error('refused');
         return cancelBase?.(id);
       });
       setPrayerAlertType(ScheduleType.Standard, 5, AlertType.Off);

       await rescheduleAllNotifications();

       // The alarm is still to come, so its record survives the refused cancel: only that record can
       // reach the alarm the phone still holds on the next repair pass
       expect(osIdentifiers()).toContain('athan_standard_isha_2026-06-20');
       const records = Database.getAllScheduledNotificationsForPrayer(ScheduleType.Standard, 5).map(
         (record) => record.id
       );
       expect(records).toContain('athan_standard_isha_2026-06-20');
     });
   });
   ```

   The five `it`s:

   | # | `it` name | Proves | Inputs | Asserts |
   | --- | --- | --- | --- | --- |
   | 1 | `keeps yesterday's list Isha armed, re-attempted under its own identifier` | Gap map item 6's main case: the reschedule at 00:00:30 keeps and re-attempts the yesterday at-time | The Isha-00:01 days; Isha Silent with 5-min Silent reminder; first reschedule 21:00 BST on the 20th, second 00:00:30 BST on the 21st | First pass OS: the 20th's and 21st's at-time and reminder ids. Second pass: the 20th's at-time re-attempted at `2026-06-20T23:01:00.000Z`, never cancelled; only the 20th's now-past reminder cancelled; final OS exactly the 20th's at-time and the 21st's pair |
   | 2 | `keeps a Magrib after midnight armed the same way` | The other crossing prayer, gap map item 6's second row | The Magrib-00:01 days; Magrib Silent with reminder | The 20th's Magrib at-time re-attempted at `2026-06-20T23:01:00.000Z`, its past reminder alone cancelled |
   | 3 | `keeps a Friday Istijaba that falls after midnight armed, while the Saturday list carries none` | The Extras crossing row, gap map item 6's third row; Saturday's list has no Istijaba to arm | 25 to 28 June 2026, Magrib 01:20; Istijaba Silent with reminder; second reschedule 00:05 BST on the 27th | The 26th's Istijaba and its reminder alone, re-attempted at `2026-06-26T23:20:00.000Z`, nothing cancelled |
   | 4 | `lets the window move on the moment the still-due row has passed, as the scheduler skips past rows` | The window is not wider: at exactly the row's instant the yesterday ids are stale again | As 1; second reschedule at exactly `2026-06-20T23:01:00.000Z` | Both 20th ids cancelled; final OS the 21st's and 22nd's pairs |
   | 5 | `keeps the record of a refused cancel of a still-due yesterday alarm, so the repair can reach it` | `canStillFire` counts a still-due yesterday record (design review finding 1) | As 1; the OS refuses to cancel the 20th's at-time; the bell turned Off through the app's own setter | The OS still holds the alarm AND its record survives in `getAllScheduledNotificationsForPrayer` |

   **In `shared/__tests__/notifications.test.ts`** (existing suite): insert before anchor `2-10`'s
   `it('generates consecutive days', ...)` this test verbatim:

   ```ts
     it('starts from a given start date when one is given', () => {
       const days = genNextXDays(3, '2026-08-28');

       expect(days).toEqual(['2026-08-28', '2026-08-29', '2026-08-30']);
     });
   ```

   It proves `genNextXDays` honours an explicit start; inputs `3` and `'2026-08-28'`; asserts the three
   literal dates starting there.

   **Existing tests that must not change:** every other test in the three suites, including the
   `reschedule strategy` describe in `stores/__tests__/notifications.test.ts` (its windows are seeded
   with an unstored yesterday, so they never shift), the unreadable-times describes, and
   `notificationsClockChange`/`notificationsFridayIstijaba`.

   Run: `npx jest stores/__tests__/notificationsAroundMidnight.test.ts shared/__tests__/prayer.test.ts shared/__tests__/notifications.test.ts --watchman=false --selectProjects=unit > $TMPDIR/red-2.log 2>&1`.

   Expected in `$TMPDIR/red-2.log`: `Tests: 11 failed, 193 passed, 204 total`, failing exactly:
   - the six `firstStillDueListDayForPrayer ›` cases, each with
     `TypeError: (0 , _prayer.firstStillDueListDayForPrayer) is not a function`;
   - `keeps yesterday's list Isha armed, re-attempted under its own identifier`,
     `keeps a Magrib after midnight armed the same way`, `keeps a Friday Istijaba that falls after
     midnight armed, while the Saturday list carries none` and `keeps the record of a refused cancel of
     a still-due yesterday alarm, so the repair can reach it`;
   - `genNextXDays › starts from a given start date when one is given`.

   And passing, by design: `lets the window move on the moment the still-due row has passed, as the
   scheduler skips past rows` (today's window already cancels exactly those ids at that instant; the
   test pins the boundary against a future `>=` slip). Any other test failing, or any of the named
   eleven passing: STOP and ask "the step 2 red run printed `<Tests line>`; the plan expects exactly
   the eleven named failures; what do I do?".

5. **Change.** Build the contracts:

   - **`shared/prayer.ts`, new export `firstStillDueListDayForPrayer`** (inserted immediately after
     anchor `2-1`'s `getPrayerForDate` block, that is BETWEEN `getPrayerForDate` and step 1's
     `firstStillDueListDay`):

     ```ts
     /**
      * The earliest list day one prayer's alarm window must cover: yesterday while yesterday's own row of
      * that prayer is readable and still to come, today otherwise.
      *
      * The window counted from today alone made a reschedule between 00:00 and a post-midnight row treat
      * that row's alarm as stale and cancel it (finding 74), so both scheduling paths start from here. The
      * answer is per prayer, not per list: yesterday's Isha still to come does not move Fajr's window, whose
      * yesterday row has long passed.
      *
      * @param type Schedule type (Standard or Extra)
      * @param englishName English prayer name
      * @param now The instant the start day is worked out for
      * @returns The YYYY-MM-DD of the earliest list day whose row of this prayer can still fire
      */
     export const firstStillDueListDayForPrayer = (type: ScheduleType, englishName: string, now: Date): string => {
       const today = TimeUtils.formatDateShort(now);
       const yesterday = TimeUtils.getPreviousDateString(today);

       const row = getPrayerForDate(type, englishName, yesterday);
       return row !== null && isReadable(row) && row.datetime > now ? yesterday : today;
     };
     ```

     Contract: answers per prayer; reads only yesterday's row of that prayer through the real
     `getPrayerForDate` (so a non-Friday list answers no Istijaba row); never writes storage; never
     throws; `today` from `formatDateShort(now)`. `shared/prayer.ts` also changes the import of anchor
     `2-2` to `import { findNextReadable, isReadable } from '@/shared/sequence';`. It logs nothing.

   - **`shared/notifications.ts`**, three edits:
     1. The import pair of anchor `2-3` gains a line between its two lines:
        `import * as PrayerUtils from '@/shared/prayer';`.
     2. Anchor `2-4`'s `genNextXDays` becomes, verbatim:

        ```ts
        export const genNextXDays = (numberOfDays: number, startDate?: string): string[] => {
          const first = startDate ?? TimeUtils.getTodayDateString();

          return Array.from({ length: numberOfDays }, (_, i) => TimeUtils.addDaysToDateString(first, i));
        };
        ```

        Contract: same behaviour when `startDate` is omitted; consecutive dates from `startDate`
        otherwise; never reads the clock beyond the default. The empty-cache guard in
        `stores/notifications.ts` keeps calling it with one argument, so it stays anchored to today.
        Its doc comment's existing sentences stay.
     3. Anchor `2-5`'s `genScheduleDatesForPrayer` becomes, verbatim:

        ```ts
        export const genScheduleDatesForPrayer = (scheduleType: ScheduleType, englishName: string): string[] =>
          genNextXDays(
            rollingDaysForPrayer(scheduleType, englishName),
            PrayerUtils.firstStillDueListDayForPrayer(scheduleType, englishName, TimeUtils.createInstant())
          );
        ```

        Contract: the window's LENGTH stays `rollingDaysForPrayer` (the iOS 64-pending ceiling
        arithmetic in `shared/__tests__/constants.test.ts` is untouched and stays valid); its start is
        the earliest list day whose row of this prayer is still due, read at the call. It logs
        nothing.

   - **`stores/notifications.ts`**, three edits:
     1. The constants import of anchor `2-11` gains one line after its two anchored lines:
        `  ISLAMIC_DAY,` (the new `canStillFire` reads the cutoff hour from it; without this line the
        step's verbatim code does not compile).
     2. Anchor `2-6`'s `canStillFire` (signature unchanged) becomes, verbatim:

        ```ts
        const canStillFire = (record: NotificationUtils.ScheduledNotification): boolean => {
          const today = TimeUtils.getTodayDateString();
          if (record.date >= today) return true;
          if (record.date !== TimeUtils.getPreviousDateString(today)) return false;

          const cutoff = TimeUtils.createPrayerDatetime(
            today,
            `${String(ISLAMIC_DAY.EARLY_MORNING_CUTOFF_HOUR).padStart(2, '0')}:00`
          );
          return TimeUtils.createInstant() < cutoff;
        };
        ```

        with its doc comment replaced by, verbatim:

        ```text
        /**
         * Whether the alarm a record names can still fire.
         *
         * A record dated D normally fires no later than late on D, but a post-midnight row of yesterday's
         * list fires after 00:00 today (finding 74), and no row of any list falls later than the 06:00 cutoff
         * on the day after its own. Yesterday therefore counts until that cutoff, and anything earlier is
         * spent: a refusal to cancel an alarm whose moment has passed is not worth undoing a change for, and
         * keeping its record would make every later clear ask for it again for ever.
         *
         * @param record One of the prayer's stored alarm records
         */
        ```

        (The `06:00` is `ISLAMIC_DAY.EARLY_MORNING_CUTOFF_HOUR`; the doc names the number for the
        reader.) Contract: keeps its one-argument signature and its four call sites unchanged; the
        cutoff instant must be padded to two digits (`Date.parse` rejects `T6:00`, verified while
        planning); nothing else in the file's logic changes. It logs nothing.
     3. The guard comment of anchor `2-7` and its six following lines (the whole comment through
        `// next twelve hours.`) are replaced by, verbatim:

        ```text
          // The test is every list day that can arm a prayer from today on, not today
          // alone: while yesterday still has a row due the windows start there, but
          // reading yesterday too would treat an unstored yesterday as an empty cache
          // between 00:00 and that row, and bailing is the safe direction anyway, since
          // it arms nothing, cancels nothing and the download that lands reopens the
          // gate. An upgrade wipe still leaves all of these unstored, so it still bails;
          // but one day missing from the payload (R7) is a day of unreadable rows, and
          // treating it as an empty cache would stop the readable day beside it from
          // being armed. The night rows' extra list day does not count: its rows need
          // tomorrow's Magrib, so with only that day stored nothing can be armed, and
          // stamping the gate would silence the next twelve hours.
        ```

        A comment-only change: the guard's code and its `genNextXDays(NOTIFICATION_ROLLING_DAYS)` call
        stay exactly as they are.

6. **Green.**
   1. Run the red command again, writing to `$TMPDIR/green-2.log`. Expected: `Test Suites: 3 passed,
      3 total`, `Tests: 204 passed, 204 total`.
   2. Run `npx tsc --noEmit`. Expected: exit 0 and no output. (If Biome has not yet organized the
      edited files' imports, run `npx biome check --write shared/prayer.ts shared/notifications.ts
      stores/notifications.ts stores/__tests__/notificationsAroundMidnight.test.ts
      shared/__tests__/prayer.test.ts shared/__tests__/notifications.test.ts` once, then this and the
      next check again.)
   3. Run `npx biome check . --error-on-warnings`. Expected: exit 0, ending `No fixes applied.`.
   4. Any difference: STOP and ask "step 2 green printed `<line>`; what do I do?".

7. **Breaks.** Run `bash ai/plans/09-keep-still-due-rows-after-midnight/scripts/breaks-2.sh > $TMPDIR/breaks-2.log 2>&1`
   in the background. It takes about 50 seconds. Expected: four lines starting `BREAK 2`, each saying
   `AS EXPECTED` (2a `Tests: 3 failed, 201 passed, 204 total`; 2b `Tests: 2 failed, 202 passed, 204
   total`; 2c `Tests: 4 failed, 200 passed, 204 total`; 2d `Tests: 1 failed, 203 passed, 204 total`),
   and the last line `ALL AS EXPECTED: 1`. A line saying `NOT AS EXPECTED` or `the substitution did
   not change`: STOP and ask "break `<name>` did not behave as the plan says: `<that line>`; what do
   I do?". Afterwards, `git status --porcelain` must list only this step's files and the three plan
   files.

8. **Version and commit.**
   1. Run `bash ai/plans/09-keep-still-due-rows-after-midnight/scripts/set-version.sh`. Expected: two
      lines, `VERSION <x.y.z>` and `VERSIONS MATCH`. Any other output: STOP and ask
      "set-version.sh printed `<output>`; how do I set the version?".
   2. Add exactly these files by name: `shared/prayer.ts`, `shared/notifications.ts`,
      `stores/notifications.ts`, `stores/__tests__/notificationsAroundMidnight.test.ts`,
      `shared/__tests__/prayer.test.ts`, `shared/__tests__/notifications.test.ts`, `app.json`,
      `package.json`, and `ai/plans/README.md`, `ai/plans/09-keep-still-due-rows-after-midnight/PLAN.md`
      and `ai/plans/09-keep-still-due-rows-after-midnight/LOG.md` when this session changed them. Run
      `git status --porcelain` afterwards. Every changed file must be staged. Any other line: STOP and
      ask "git status shows `<line>` before the step 2 commit; what do I do?".
   3. Write the commit message below to `$TMPDIR/msg-2.txt`, with `<VERSION>` replaced by the version
      `set-version.sh` printed.
   4. Run `git commit -F $TMPDIR/msg-2.txt > $TMPDIR/commit-2.log 2>&1` in the background, with the
      hang check from `EXECUTOR-BRIEF.md` section 3.
   5. Expected in `$TMPDIR/commit-2.log`: the last `Tests:` line is
      `Tests: 2 skipped, 4527 passed, 4529 total` with no `failed`; the lines `Statements   : 100%`,
      `Branches     : 100%`, `Functions    : 100%` and `Lines        : 100%`; no line starting
      `Coverage gate:`. If only `shared/__tests__/audioMatrix.test.ts` timed out, follow
      `EXECUTOR-BRIEF.md` section 3. Any other failure: STOP and ask "the step 2 commit failed with
      `<first failing line>`; what do I do?".

   The commit message:

   ```text
   <VERSION> - fix(notifications): the alarm window starts from the still-due list day, and a refused cancel keeps the record

   Finding 74, alarm half. The rolling window counted from the calendar day, so a reschedule between
   00:00 and a post-midnight row treated that row's alarm as stale and cancelled it: nothing fired at
   the armed instant.

   - firstStillDueListDayForPrayer (shared/prayer.ts) answers the earliest list day whose own row of
     the prayer is still to come; genScheduleDatesForPrayer starts both scheduling paths there, so the
     window is [yesterday, today] while yesterday is still due and moves on the moment the row passes.
   - The window keeps its length (rollingDaysForPrayer unchanged), so the iOS 64-pending ceiling
     arithmetic holds; genNextXDays gains an optional start date and keeps today for every other
     caller, the empty-cache bail included.
   - canStillFire counts a record of yesterday's list until the 06:00 cutoff, so a refused cancel of a
     still-due yesterday alarm keeps its record and the repair can reach the alarm the phone holds
     (found by the design review; the old date test would have deleted it).
   - Gap map item 6's three shapes pinned (Isha, Magrib, Friday Istijaba) with the exact OS ids before
     and after the 00:00:30 reschedule, the boundary at the row's own instant, and the refused-cancel
     record. London windows are byte-identical (suite-pinned): no London row is ever still due after
     00:00.
   ```

9. **Review.** Spawn a `Code Reviewer` subagent (a `general` subagent prompted as the reviewer),
   isolation `worktree`, with no `model`, and this prompt, with `<sha>` replaced by the step 2
   commit's sha:

   ```text
   Run git checkout --detach <sha>. Your worktree starts at the wrong branch.

   You review one commit in the rn.athan.uk repository, a React Native prayer-times app. The commit is
   step 2 of the plan ai/plans/09-keep-still-due-rows-after-midnight/PLAN.md, executed by another
   model. Read these files in full, with no partial reads:
   ai/plans/09-keep-still-due-rows-after-midnight/steps/2-alarm-window-and-refusal-records.md,
   ai/plans/09-keep-still-due-rows-after-midnight/PLAN.md sections 4 and 5, __tests__/README.md,
   shared/prayer.ts, shared/notifications.ts, stores/notifications.ts,
   stores/__tests__/notificationsAroundMidnight.test.ts, shared/__tests__/prayer.test.ts and
   shared/__tests__/notifications.test.ts, and shared/__tests__/constants.test.ts' ceiling describe.

   Check each item and report every problem you find:
   1. git show <sha> changes exactly the files the step's "Files" part lists, plus app.json and
      package.json, and plan files under ai/plans/ only where they record status or the log.
   2. The contracts hold: firstStillDueListDayForPrayer answers per its doc comment and reads the
      clock not at all; genScheduleDatesForPrayer keeps rollingDaysForPrayer as the length and takes
      its start from the helper; genNextXDays' optional start changes no existing caller's behaviour;
      canStillFire keeps its signature and call sites, pads the cutoff hour to two digits, and answers
      today-or-later true, exactly-yesterday until the padded cutoff, anything older false; the guard
      comment change is comment-only.
   3. The window arithmetic still fits the iOS 64-pending ceiling: rollingDaysForPrayer and
      NOTIFICATION_ROLLING_DAYS are untouched and constants.test.ts still passes.
   4. The test edits match the step's verbatim blocks and table rows exactly: the six
      firstStillDueListDayForPrayer tests, the new alarm describe's five tests with their exact OS-id
      and trigger expectations, the import block replacement, and the genNextXDays start test.
   5. Every test follows __tests__/README.md, asserts what its row says, and would fail if the line it
      guards were broken; the red run's eleven named failures and the one by-design pass are exactly
      what the step predicts.
   6. Comments explain why, never what, and no comment restates the code.
   7. The version in app.json and package.json is the next patch after the parent commit's
      package.json, and both match; the commit message equals the step's message with <VERSION> filled
      in.
   8. Nothing else changed: no visual, no prayer-time value, no other file.

   Reply with numbered findings (file, line, problem, exact fix), then a final line that is exactly
   "merge" or "fix first".
   ```

   A "merge" verdict is a final line that is exactly `merge`. On "fix first", apply only a fix that
   `PLAN.md` section 10 gives word for word, or one that meets all three of `EXECUTOR-BRIEF.md`
   section 4, item 8's conditions (record it in `LOG.md`, rerun the breaks, amend, resend the same
   reviewer); anything else is a STOP.

10. **Merge.**
    `git checkout uat-2 && git merge --no-ff fix/still-due-rows-keep-their-alarms -m "Merge fix/still-due-rows-keep-their-alarms into uat-2: the alarm window starts from the still-due list day, reviewed"`.

11. **Done when.**
    1. `git branch --show-current` prints `uat-2`.
    2. `git log -1 --format=%s` prints `Merge fix/still-due-rows-keep-their-alarms into uat-2: the
       alarm window starts from the still-due list day, reviewed`.
    3. `git status --porcelain` lists nothing but the three plan files.
    4. In `PLAN.md` section 6, replace the whole line that starts `- [ ] Step 2:` with `- [x] Step 2:
       DONE in <merge sha>`, and append the step's record to `LOG.md`: the branch, the commit sha and
       version, the hook's last `Tests:` line and its coverage lines, the break script's last line,
       the review verdict with the reviewer's model (GLM 5.3) and how many rounds it took, and the
       merge sha.
