# Step 3: The scheduling lock waits for every piece of work before reporting a failure (finding 82)

This file is part of `ai/plans/06-alert-integrity/PLAN.md`. Run every command from `/Users/muji/repos/rn.athan.uk`.

0. **Anchor check.** Run `bash ai/plans/06-alert-integrity/scripts/check-anchors.sh 3`. Expected: one line per
   anchor ending ` 1`, then `ANCHORS OK`. Any count other than `1`: this is NEEDS REPLAN (`EXECUTOR-BRIEF.md` section
   1, item 4).

1. **Goal:** no scheduling operation releases the lock while a piece of work it started (a day, a prayer, a schedule group, a cancel) is still running, so the next operation in the queue never runs beside it.

2. **Branch:** `git checkout -b fix/audit-82-lock-waits-for-every-piece uat-2`.

3. **Files.** Only these change, apart from `app.json`, `package.json`, the local `android/app/build.gradle` and the three plan files:
   - `stores/notifications.ts`;
   - `device/notifications.ts`;
   - `stores/__tests__/notificationSchedulingLock.test.ts`;

4. **Tests first (red).**
   1. Create `stores/__tests__/notificationSchedulingLock.test.ts` from the saved file:
      `cp ai/plans/06-alert-integrity/scripts/tests/3-notificationSchedulingLock.test.ts.txt stores/__tests__/notificationSchedulingLock.test.ts`
      (the saved file ends `.txt` so that tsc, Biome and the coverage gate leave it alone).
      Its full contents:

```ts
/**
 * The scheduling lock while one piece of an operation fails (stores/notifications.ts)
 *
 * Scheduling operations run one at a time, in the order they were asked for. When one piece of an operation fails,
 * the operation still waits for every other piece it started before the next operation runs. Ending early would leave
 * arming and cancelling still landing beside the next operation, which can leave a prayer switched Off with an alarm
 * armed, or switched on with an alarm cancelled.
 */

import * as Notifications from 'expo-notifications';
import { getDefaultStore } from 'jotai';

import { prayerNotificationIdentifier, reminderNotificationIdentifier } from '@/device/notifications';
import * as PrayerUtils from '@/shared/prayer';
import { AlertType, type ISingleApiResponseTransformed, type ReminderInterval, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';
import {
  lastNotificationScheduleAtom,
  refreshNotifications,
  setPrayerAlertType,
  setReminderAlertType,
  setReminderInterval,
  standardPrayerAlertAtoms,
  standardReminderAlertAtoms,
  updatePrayerNotifications,
} from '@/stores/notifications';

jest.mock('@/shared/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  isProd: () => false,
  isPreview: () => false,
  isTest: () => true,
}));

jest.mock('@/stores/widget', () => ({ refreshPrayerWidgets: jest.fn(async () => undefined) }));

jest.mock('@/stores/sync', () => ({ sync: jest.fn(async () => undefined), getArmedDayChanges: jest.fn(() => 0) }));

// =============================================================================
// FIXTURES
// =============================================================================

const store = getDefaultStore();

// 09:00 BST on Saturday 29 August 2026, with every time of today and tomorrow at 12:00 BST
const NOW = Date.parse('2026-08-29T08:00:00.000Z');
const TODAY = '2026-08-29';
const TOMORROW = '2026-08-30';
const WINDOW = [TODAY, TOMORROW];
const INTERVAL = 15 as ReminderInterval;
const FAJR = 0;
const DHUHR = 2;

const athanIds = (name: string) =>
  WINDOW.map((date) => prayerNotificationIdentifier(ScheduleType.Standard, name, date));
const reminderIds = (name: string) =>
  WINDOW.map((date) => reminderNotificationIdentifier(ScheduleType.Standard, name, date, INTERVAL));

const scheduleMock = jest.mocked(Notifications.scheduleNotificationAsync);
const cancelMock = jest.mocked(Notifications.cancelScheduledNotificationAsync);
const getAllMock = jest.mocked(Notifications.getAllScheduledNotificationsAsync);

/** What the OS holds, keyed by identifier, with the platforms' replace and cancel semantics */
const osState = new Set<string>();

/** Arming and cancelling the test keeps on its way, each with what lets it land */
const held = new Map<string, () => void>();

/** Identifiers whose cancel the OS refuses */
const refusedCancels = new Set<string>();

/** Which arming and which cancelling the test keeps on its way until releaseHeld */
let holdsSchedule: (identifier: string) => boolean;
let holdsCancel: (identifier: string) => boolean;

const refusal = new Error('Notification could not be cancelled');

const releaseHeld = () => {
  for (const land of held.values()) land();
  held.clear();
};

/** Microtasks only, so the fake clock does not hold them */
const flush = async () => {
  for (let tick = 0; tick < 100; tick++) await Promise.resolve();
};

/** What the OS holds for one prayer, athan and reminders */
const armedFor = (name: string) => [...osState].filter((id) => id.includes(`_${name.toLowerCase()}_`)).sort();

/** An earlier reschedule's alarms for a prayer, recorded and held by the OS */
const armedEarlier = (
  index: number,
  name: string,
  ids: string[],
  record: typeof Database.addOneScheduledNotificationForPrayer
) => {
  ids.forEach((id, position) => {
    record(ScheduleType.Standard, index, {
      id,
      date: WINDOW[position],
      time: '12:00',
      englishName: name,
      arabicName: '',
      alertType: AlertType.Silent,
    });
    osState.add(id);
  });
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  jest.clearAllMocks();
  osState.clear();
  held.clear();
  refusedCancels.clear();
  holdsSchedule = () => false;
  holdsCancel = () => false;
  Database.database.clearAll();

  for (const date of WINDOW) {
    const day: ISingleApiResponseTransformed = {
      date,
      fajr: '12:00',
      sunrise: '12:00',
      dhuhr: '12:00',
      asr: '12:00',
      magrib: '12:00',
      isha: '12:00',
      suhoor: '12:00',
      duha: '12:00',
      istijaba: '12:00',
    };
    Database.database.set(`prayer_${date}`, JSON.stringify(day));
  }

  for (const atom of [...standardPrayerAlertAtoms, ...standardReminderAlertAtoms]) store.set(atom, AlertType.Off);
  setReminderInterval(ScheduleType.Standard, FAJR, INTERVAL);
  setReminderInterval(ScheduleType.Standard, DHUHR, INTERVAL);
  store.set(lastNotificationScheduleAtom, 0);

  scheduleMock.mockImplementation((request) => {
    const identifier = (request as { identifier: string }).identifier;
    if (!holdsSchedule(identifier)) {
      osState.add(identifier);
      return Promise.resolve(identifier);
    }
    return new Promise((resolve) => {
      held.set(`schedule ${identifier}`, () => {
        osState.add(identifier);
        resolve(identifier);
      });
    });
  });
  cancelMock.mockImplementation((identifier: string) => {
    if (refusedCancels.has(identifier)) return Promise.reject(refusal);
    if (!holdsCancel(identifier)) {
      osState.delete(identifier);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      held.set(`cancel ${identifier}`, () => {
        osState.delete(identifier);
        resolve();
      });
    });
  });
  getAllMock.mockImplementation(
    async () => [...osState].map((identifier) => ({ identifier })) as Notifications.NotificationRequest[]
  );
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

afterAll(() => {
  scheduleMock.mockImplementation(
    async (request) => (request as { identifier?: string })?.identifier ?? 'mock-notification-id'
  );
  cancelMock.mockResolvedValue(undefined);
  getAllMock.mockResolvedValue([]);
});

// =============================================================================
// TESTS
// =============================================================================

describe('an operation queued behind one that fails part way', () => {
  it('runs only once every prayer the failing refresh is arming has landed', async () => {
    armedEarlier(FAJR, 'Fajr', athanIds('Fajr'), Database.addOneScheduledNotificationForPrayer);
    refusedCancels.add(athanIds('Fajr')[0]);
    store.set(standardPrayerAlertAtoms[DHUHR], AlertType.Silent);
    holdsSchedule = (id) => athanIds('Dhuhr').includes(id);
    const refresh = refreshNotifications();
    await flush();

    setPrayerAlertType(ScheduleType.Standard, DHUHR, AlertType.Off);
    const commit = updatePrayerNotifications(ScheduleType.Standard, DHUHR, 'Dhuhr', '', AlertType.Off, AlertType.Off);
    await flush();
    releaseHeld();
    const [refreshed, committed] = await Promise.allSettled([refresh, commit]);

    expect({ refreshed: refreshed.status, committed: committed.status, dhuhr: armedFor('Dhuhr') }).toEqual({
      refreshed: 'rejected',
      committed: 'fulfilled',
      dhuhr: [],
    });
  });

  it('runs only once the reminders the failing refresh is arming, in another part of it, have landed', async () => {
    armedEarlier(FAJR, 'Fajr', athanIds('Fajr'), Database.addOneScheduledNotificationForPrayer);
    refusedCancels.add(athanIds('Fajr')[0]);
    store.set(standardPrayerAlertAtoms[DHUHR], AlertType.Silent);
    store.set(standardReminderAlertAtoms[DHUHR], AlertType.Silent);
    holdsSchedule = (id) => reminderIds('Dhuhr').includes(id);
    const refresh = refreshNotifications();
    await flush();

    setPrayerAlertType(ScheduleType.Standard, DHUHR, AlertType.Off);
    const commit = updatePrayerNotifications(ScheduleType.Standard, DHUHR, 'Dhuhr', '', AlertType.Off, AlertType.Off);
    await flush();
    releaseHeld();
    const [refreshed, committed] = await Promise.allSettled([refresh, commit]);

    expect({ refreshed: refreshed.status, committed: committed.status, dhuhr: armedFor('Dhuhr') }).toEqual({
      refreshed: 'rejected',
      committed: 'fulfilled',
      dhuhr: [],
    });
  });

  it('runs only once every cancel the failing refresh sent for the same prayer has landed', async () => {
    armedEarlier(FAJR, 'Fajr', athanIds('Fajr'), Database.addOneScheduledNotificationForPrayer);
    refusedCancels.add(athanIds('Fajr')[0]);
    holdsCancel = (id) => id === athanIds('Fajr')[1];
    const refresh = refreshNotifications();
    await flush();

    setPrayerAlertType(ScheduleType.Standard, FAJR, AlertType.Silent);
    const commit = updatePrayerNotifications(ScheduleType.Standard, FAJR, 'Fajr', '', AlertType.Silent, AlertType.Off);
    await flush();
    releaseHeld();
    const [refreshed, committed] = await Promise.allSettled([refresh, commit]);

    expect({ refreshed: refreshed.status, committed: committed.status, fajr: armedFor('Fajr') }).toEqual({
      refreshed: 'rejected',
      committed: 'fulfilled',
      fajr: athanIds('Fajr'),
    });
  });

  it("runs only once the failing commit's reminder cancels have landed", async () => {
    armedEarlier(FAJR, 'Fajr', athanIds('Fajr'), Database.addOneScheduledNotificationForPrayer);
    armedEarlier(FAJR, 'Fajr', reminderIds('Fajr'), Database.addOneScheduledReminderForPrayer);
    refusedCancels.add(athanIds('Fajr')[0]);
    holdsCancel = (id) => id === reminderIds('Fajr')[1];
    setPrayerAlertType(ScheduleType.Standard, FAJR, AlertType.Off);
    const turnOff = updatePrayerNotifications(ScheduleType.Standard, FAJR, 'Fajr', '', AlertType.Off, AlertType.Off);
    await flush();

    setPrayerAlertType(ScheduleType.Standard, FAJR, AlertType.Silent);
    setReminderAlertType(ScheduleType.Standard, FAJR, AlertType.Silent);
    const turnOn = updatePrayerNotifications(
      ScheduleType.Standard,
      FAJR,
      'Fajr',
      '',
      AlertType.Silent,
      AlertType.Silent
    );
    await flush();
    releaseHeld();
    const [off, on] = await Promise.allSettled([turnOff, turnOn]);

    expect({ off: off.status, on: on.status, fajr: armedFor('Fajr') }).toEqual({
      off: 'rejected',
      on: 'fulfilled',
      fajr: [...athanIds('Fajr'), ...reminderIds('Fajr')].sort(),
    });
  });

  it("runs only once another prayer's reminders have armed, when one prayer's reminder day throws", async () => {
    for (const index of [FAJR, DHUHR]) {
      store.set(standardPrayerAlertAtoms[index], AlertType.Silent);
      store.set(standardReminderAlertAtoms[index], AlertType.Silent);
    }
    const readRow = PrayerUtils.getPrayerForDate;
    jest.spyOn(PrayerUtils, 'getPrayerForDate').mockImplementation((type, name, date) => {
      if (name === 'Fajr' && date === TOMORROW) throw new Error('Stored day could not be read');
      return readRow(type, name, date);
    });
    holdsSchedule = (id) => reminderIds('Dhuhr').includes(id);
    const refresh = refreshNotifications();
    await flush();

    setPrayerAlertType(ScheduleType.Standard, DHUHR, AlertType.Off);
    const commit = updatePrayerNotifications(ScheduleType.Standard, DHUHR, 'Dhuhr', '', AlertType.Off, AlertType.Off);
    await flush();
    releaseHeld();
    const [refreshed, committed] = await Promise.allSettled([refresh, commit]);

    expect({ refreshed: refreshed.status, committed: committed.status, dhuhr: armedFor('Dhuhr') }).toEqual({
      refreshed: 'rejected',
      committed: 'fulfilled',
      dhuhr: [],
    });
  });

  // the path whose day fails, the Fajr reminder alert that switches that path on, and the day the refresh is arming
  it.each([
    { path: 'athan', reminder: AlertType.Off, holding: athanIds('Fajr')[0] },
    { path: 'reminder', reminder: AlertType.Silent, holding: reminderIds('Fajr')[0] },
  ])(
    'runs only once the other day of a failing refresh has armed, when one $path day throws',
    async ({ reminder, holding }) => {
      store.set(standardPrayerAlertAtoms[FAJR], AlertType.Silent);
      store.set(standardReminderAlertAtoms[FAJR], reminder);
      const readRow = PrayerUtils.getPrayerForDate;
      jest.spyOn(PrayerUtils, 'getPrayerForDate').mockImplementation((type, name, date) => {
        if (name === 'Fajr' && date === TOMORROW) throw new Error('Stored day could not be read');
        return readRow(type, name, date);
      });
      holdsSchedule = (id) => id === holding;
      const refresh = refreshNotifications();
      await flush();

      setPrayerAlertType(ScheduleType.Standard, FAJR, AlertType.Off);
      const commit = updatePrayerNotifications(ScheduleType.Standard, FAJR, 'Fajr', '', AlertType.Off, AlertType.Off);
      await flush();
      releaseHeld();
      const [refreshed, committed] = await Promise.allSettled([refresh, commit]);

      expect({ refreshed: refreshed.status, committed: committed.status, fajr: armedFor('Fajr') }).toEqual({
        refreshed: 'rejected',
        committed: 'fulfilled',
        fajr: [],
      });
    }
  );
});
```

   2. Run `npx jest stores/__tests__/notificationSchedulingLock.test.ts --watchman=false --selectProjects=unit > $TMPDIR/red-3.log 2>&1`.
   3. Expected in `$TMPDIR/red-3.log`: `Tests:       7 failed, 7 total`, with these failing tests, each prefixed
      `an operation queued behind one that fails part way › `:
      - `runs only once every prayer the failing refresh is arming has landed`
      - `runs only once the reminders the failing refresh is arming, in another part of it, have landed`
      - `runs only once every cancel the failing refresh sent for the same prayer has landed`
      - `runs only once the failing commit's reminder cancels have landed`
      - `runs only once another prayer's reminders have armed, when one prayer's reminder day throws`
      - `runs only once the other day of a failing refresh has armed, when one athan day throws`
      - `runs only once the other day of a failing refresh has armed, when one reminder day throws`

      The first one's failure shows `"dhuhr": Array [` followed by `"athan_standard_dhuhr_2026-08-29",` and
      `"athan_standard_dhuhr_2026-08-30",`: Dhuhr left armed after the Off commit.
   4. Any other result: STOP and ask "the step 3 red run printed <Tests line>; the plan expects 7 failed; what do I do?".

5. **Change.**
   Anchor `3-1` in `stores/notifications.ts` (saved as `ai/plans/06-alert-integrity/scripts/anchors/3-1.txt`), before:

```ts
  return result;
}

// =============================================================================
// HELPERS
// =============================================================================
```

   After (saved as `ai/plans/06-alert-integrity/scripts/changes/3-1.txt`):

```ts
  return result;
}

/**
 * Waits for every piece of scheduling work to end, then rejects with the first failure, if any
 *
 * Promise.all rejects at the first failure while the rest is still running, and the scheduling lock is released with
 * it: the next operation in the queue would then arm or cancel beside work that is still landing.
 *
 * @param work The pieces of work, already started
 * @returns Each piece's result, in order
 */
const settleAll = async <T>(work: Promise<T>[]): Promise<T[]> => {
  const results = await Promise.allSettled(work);
  const failure = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
  if (failure) throw failure.reason;

  return results.map((result) => (result as PromiseFulfilledResult<T>).value);
};

// =============================================================================
// HELPERS
// =============================================================================
```

   Apply it: `python3 ai/plans/06-alert-integrity/scripts/apply.py stores/notifications.ts ai/plans/06-alert-integrity/scripts/anchors/3-1.txt ai/plans/06-alert-integrity/scripts/changes/3-1.txt`.
   Expected: `APPLIED ai/plans/06-alert-integrity/scripts/anchors/3-1.txt to stores/notifications.ts`. Any other output: STOP and ask "apply.py printed <output> for anchor 3-1; what do I do?".

   Anchor `3-2` in `stores/notifications.ts` (saved as `ai/plans/06-alert-integrity/scripts/anchors/3-2.txt`), before:

```ts
  const attempts = await Promise.all(
    nextXDays.map((date) =>
      scheduleNotificationForDate(scheduleType, prayerIndex, date, englishName, arabicName, alertType, sound)
    )
  );
```

   After (saved as `ai/plans/06-alert-integrity/scripts/changes/3-2.txt`):

```ts
  const attempts = await settleAll(
    nextXDays.map((date) =>
      scheduleNotificationForDate(scheduleType, prayerIndex, date, englishName, arabicName, alertType, sound)
    )
  );
```

   Apply it: `python3 ai/plans/06-alert-integrity/scripts/apply.py stores/notifications.ts ai/plans/06-alert-integrity/scripts/anchors/3-2.txt ai/plans/06-alert-integrity/scripts/changes/3-2.txt`.
   Expected: `APPLIED ai/plans/06-alert-integrity/scripts/anchors/3-2.txt to stores/notifications.ts`. Any other output: STOP and ask "apply.py printed <output> for anchor 3-2; what do I do?".

   Anchor `3-3` in `stores/notifications.ts` (saved as `ai/plans/06-alert-integrity/scripts/anchors/3-3.txt`), before:

```ts
  const attempts = await Promise.all(
    nextXDays.map((date) =>
      scheduleReminderNotificationForDate(
```

   After (saved as `ai/plans/06-alert-integrity/scripts/changes/3-3.txt`):

```ts
  const attempts = await settleAll(
    nextXDays.map((date) =>
      scheduleReminderNotificationForDate(
```

   Apply it: `python3 ai/plans/06-alert-integrity/scripts/apply.py stores/notifications.ts ai/plans/06-alert-integrity/scripts/anchors/3-3.txt ai/plans/06-alert-integrity/scripts/changes/3-3.txt`.
   Expected: `APPLIED ai/plans/06-alert-integrity/scripts/anchors/3-3.txt to stores/notifications.ts`. Any other output: STOP and ask "apply.py printed <output> for anchor 3-3; what do I do?".

   Anchor `3-4` in `stores/notifications.ts` (saved as `ai/plans/06-alert-integrity/scripts/anchors/3-4.txt`), before:

```ts
    await Promise.all(promises);
  }, 'updatePrayerNotifications');
```

   After (saved as `ai/plans/06-alert-integrity/scripts/changes/3-4.txt`):

```ts
    await settleAll(promises);
  }, 'updatePrayerNotifications');
```

   Apply it: `python3 ai/plans/06-alert-integrity/scripts/apply.py stores/notifications.ts ai/plans/06-alert-integrity/scripts/anchors/3-4.txt ai/plans/06-alert-integrity/scripts/changes/3-4.txt`.
   Expected: `APPLIED ai/plans/06-alert-integrity/scripts/anchors/3-4.txt to stores/notifications.ts`. Any other output: STOP and ask "apply.py printed <output> for anchor 3-4; what do I do?".

   Anchor `3-5` in `stores/notifications.ts` (saved as `ai/plans/06-alert-integrity/scripts/anchors/3-5.txt`), before:

```ts
  await Promise.all(promises);
  logger.info('NOTIFICATION: Rescheduled all notifications for schedule:', { scheduleType });
```

   After (saved as `ai/plans/06-alert-integrity/scripts/changes/3-5.txt`):

```ts
  await settleAll(promises);
  logger.info('NOTIFICATION: Rescheduled all notifications for schedule:', { scheduleType });
```

   Apply it: `python3 ai/plans/06-alert-integrity/scripts/apply.py stores/notifications.ts ai/plans/06-alert-integrity/scripts/anchors/3-5.txt ai/plans/06-alert-integrity/scripts/changes/3-5.txt`.
   Expected: `APPLIED ai/plans/06-alert-integrity/scripts/anchors/3-5.txt to stores/notifications.ts`. Any other output: STOP and ask "apply.py printed <output> for anchor 3-5; what do I do?".

   Anchor `3-6` in `stores/notifications.ts` (saved as `ai/plans/06-alert-integrity/scripts/anchors/3-6.txt`), before:

```ts
  await Promise.all(promises);
  logger.info('REMINDER: Rescheduled all reminders for schedule:', { scheduleType });
```

   After (saved as `ai/plans/06-alert-integrity/scripts/changes/3-6.txt`):

```ts
  await settleAll(promises);
  logger.info('REMINDER: Rescheduled all reminders for schedule:', { scheduleType });
```

   Apply it: `python3 ai/plans/06-alert-integrity/scripts/apply.py stores/notifications.ts ai/plans/06-alert-integrity/scripts/anchors/3-6.txt ai/plans/06-alert-integrity/scripts/changes/3-6.txt`.
   Expected: `APPLIED ai/plans/06-alert-integrity/scripts/anchors/3-6.txt to stores/notifications.ts`. Any other output: STOP and ask "apply.py printed <output> for anchor 3-6; what do I do?".

   Anchor `3-7` in `stores/notifications.ts` (saved as `ai/plans/06-alert-integrity/scripts/anchors/3-7.txt`), before:

```ts
  await Promise.all([
    _addAllScheduleNotificationsForSchedule(ScheduleType.Standard),
```

   After (saved as `ai/plans/06-alert-integrity/scripts/changes/3-7.txt`):

```ts
  await settleAll([
    _addAllScheduleNotificationsForSchedule(ScheduleType.Standard),
```

   Apply it: `python3 ai/plans/06-alert-integrity/scripts/apply.py stores/notifications.ts ai/plans/06-alert-integrity/scripts/anchors/3-7.txt ai/plans/06-alert-integrity/scripts/changes/3-7.txt`.
   Expected: `APPLIED ai/plans/06-alert-integrity/scripts/anchors/3-7.txt to stores/notifications.ts`. Any other output: STOP and ask "apply.py printed <output> for anchor 3-7; what do I do?".

   Anchor `3-8` in `device/notifications.ts` (saved as `ai/plans/06-alert-integrity/scripts/anchors/3-8.txt`), before:

```ts
  // Cancel all notifications
  const promises = notifications.map((notification) => Notifications.cancelScheduledNotificationAsync(notification.id));
  await Promise.all(promises);
```

   After (saved as `ai/plans/06-alert-integrity/scripts/changes/3-8.txt`):

```ts
  // Every cancel is let land before a refusal is reported: the scheduling lock is released on the rejection, and a
  // cancel still on its way could remove an alarm the next operation has just armed under the same identifier
  const promises = notifications.map((notification) => Notifications.cancelScheduledNotificationAsync(notification.id));
  const results = await Promise.allSettled(promises);
  const refusal = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
  if (refusal) throw refusal.reason;
```

   Apply it: `python3 ai/plans/06-alert-integrity/scripts/apply.py device/notifications.ts ai/plans/06-alert-integrity/scripts/anchors/3-8.txt ai/plans/06-alert-integrity/scripts/changes/3-8.txt`.
   Expected: `APPLIED ai/plans/06-alert-integrity/scripts/anchors/3-8.txt to device/notifications.ts`. Any other output: STOP and ask "apply.py printed <output> for anchor 3-8; what do I do?".


6. **Green.**
   1. Run the red command again, writing to `$TMPDIR/green-3.log`. Expected: `Tests:       7 passed, 7 total`.
   2. Run
      `npx jest stores/__tests__ device/__tests__ --watchman=false --selectProjects=unit --coverage --collectCoverageFrom=stores/notifications.ts --collectCoverageFrom=device/notifications.ts --coverageReporters=text > $TMPDIR/cov-3.log 2>&1`.
      Expected: `Test Suites: 47 passed, 47 total`, `Tests:       959 passed, 959 total`, and two rows reading
      `notifications.ts |     100 |      100 |     100 |     100 |`.
   3. Run `npx tsc --noEmit`. Expected: exit 0 and no output.
   4. Run `npx biome check . --error-on-warnings`. Expected: exit 0, ending `No fixes applied.`
   5. Any difference: STOP and ask "step 3 green printed <line>; what do I do?".

7. **Breaks.**
   1. Run `bash ai/plans/06-alert-integrity/scripts/breaks-3.sh > $TMPDIR/breaks-3.log 2>&1` in the background. It
      takes about 30 seconds.
   2. Expected in `$TMPDIR/breaks-3.log`: 8 lines starting `BREAK 3` that each say `AS EXPECTED`, and the last line
      `ALL AS EXPECTED: 1`. A line saying `NOT AS EXPECTED`: STOP and ask "break <name> did not fail as the plan says:
      <that line>; what do I do?".
   3. Run `git status --porcelain`. Expected: only this step's files and the three plan files. Anything else: STOP.

   The script, saved as `ai/plans/06-alert-integrity/scripts/breaks-3.sh`:

```bash
#!/bin/bash
# Step 3 breaks: run from /Users/muji/repos/rn.athan.uk with bash ai/plans/06-alert-integrity/scripts/breaks-3.sh
# Shared by every breaks script: copy, one perl substitution, check it changed, run the named tests, expect each
# named test to fail, restore. Paths are relative to the repository root, where the script runs.
LOGS="$TMPDIR/plan6-breaks"
mkdir -p "$LOGS"
all=1
brk() { # name, file, perl substitution, jest project, expected failing test titles joined by "|", test paths...
  local name="$1" file="$2" sub="$3" project="$4" expected="$5"
  shift 5
  cp "$file" "$LOGS/$name.backup"
  perl -0pi -e "$sub" "$file"
  if cmp -s "$file" "$LOGS/$name.backup"; then
    echo "BREAK $name NOT AS EXPECTED: the substitution did not change $file"
    all=0
    return
  fi
  npx jest "$@" --watchman=false --selectProjects="$project" > "$LOGS/$name.log" 2>&1
  local code=$?
  cp "$LOGS/$name.backup" "$file"
  local missing=""
  local IFS='|'
  for title in $expected; do
    grep -qF -- "● " "$LOGS/$name.log" && grep -F -- "● " "$LOGS/$name.log" | grep -qF -- "$title" || missing="$missing [$title]"
  done
  unset IFS
  if [ "$code" != "0" ] && [ -z "$missing" ]; then
    echo "BREAK $name AS EXPECTED: $(grep -E '^Tests:' "$LOGS/$name.log")"
  else
    echo "BREAK $name NOT AS EXPECTED: jest exit $code, not failing:$missing (log $LOGS/$name.log)"
    all=0
  fi
}
T3="stores/__tests__/notificationSchedulingLock.test.ts"
brk 3a stores/notifications.ts "s/await settleAll\(promises\);\n  logger\.info\('NOTIFICATION: Rescheduled all notifications/await Promise.all(promises);\n  logger.info('NOTIFICATION: Rescheduled all notifications/" unit "runs only once every prayer the failing refresh is arming has landed" $T3
brk 3b stores/notifications.ts "s/await settleAll\(promises\);\n  logger\.info\('REMINDER: Rescheduled all reminders/await Promise.all(promises);\n  logger.info('REMINDER: Rescheduled all reminders/" unit "runs only once another prayer's reminders have armed, when one prayer's reminder day throws" $T3
brk 3c stores/notifications.ts "s/await settleAll\(\[\n    _addAllScheduleNotificationsForSchedule/await Promise.all([\n    _addAllScheduleNotificationsForSchedule/" unit "runs only once the reminders the failing refresh is arming, in another part of it, have landed" $T3
brk 3d stores/notifications.ts "s/await settleAll\(promises\);\n  \}, 'updatePrayerNotifications'\);/await Promise.all(promises);\n  }, 'updatePrayerNotifications');/" unit "runs only once the failing commit's reminder cancels have landed" $T3
brk 3e stores/notifications.ts "s/const attempts = await settleAll\(\n    nextXDays\.map\(\(date\) =>\n      scheduleNotificationForDate\(/const attempts = await Promise.all(\n    nextXDays.map((date) =>\n      scheduleNotificationForDate(/" unit "runs only once the other day of a failing refresh has armed, when one athan day throws" $T3
brk 3f stores/notifications.ts "s/const attempts = await settleAll\(\n    nextXDays\.map\(\(date\) =>\n      scheduleReminderNotificationForDate\(/const attempts = await Promise.all(\n    nextXDays.map((date) =>\n      scheduleReminderNotificationForDate(/" unit "runs only once the other day of a failing refresh has armed, when one reminder day throws" $T3
brk 3g device/notifications.ts "s/const results = await Promise\.allSettled\(promises\);\n  const refusal = results\.find\(\(result\): result is PromiseRejectedResult => result\.status === 'rejected'\);\n  if \(refusal\) throw refusal\.reason;/await Promise.all(promises);/" unit "runs only once every cancel the failing refresh sent for the same prayer has landed" $T3
brk 3h stores/notifications.ts "s/if \(failure\) throw failure\.reason;\n/\n/" unit "runs only once every prayer the failing refresh is arming has landed|runs only once the failing commit's reminder cancels have landed" $T3
echo "ALL AS EXPECTED: $all"
```

8. **Version and commit.**
   1. Run `bash ai/plans/06-alert-integrity/scripts/set-version.sh`. Expected: two lines, `VERSION <x.y.z>` and
      `VERSIONS MATCH`. Any other output: STOP and ask "set-version.sh printed <output>; how do I set the version?".
   2. Add exactly these files by name: `stores/notifications.ts`, `device/notifications.ts`, `stores/__tests__/notificationSchedulingLock.test.ts`, `app.json`, `package.json`, and `ai/plans/README.md`,
      `ai/plans/06-alert-integrity/PLAN.md` and `ai/plans/06-alert-integrity/LOG.md` when this session changed them.
      Run `git status --porcelain` afterwards. Every changed file must be staged (first column `M` or `A`, second
      column a space). Any other line: STOP and ask "git status shows <line> before the step 3 commit; what do I do?".
   3. Write the commit message below to `$TMPDIR/msg-3.txt`, with `<VERSION>` replaced by the version
      `set-version.sh` printed.
   4. Run `git commit -F $TMPDIR/msg-3.txt > $TMPDIR/commit-3.log 2>&1` in the background, with the hang check from
      `EXECUTOR-BRIEF.md` section 3.
   5. Expected in `$TMPDIR/commit-3.log`: the last `Tests:` line ends `passed, <n> total` with no `failed`; the
      lines `Statements   : 100%`, `Branches     : 100%`, `Functions    : 100%` and `Lines        : 100%`; no line
      starting `Coverage gate:`. If only `shared/__tests__/audioMatrix.test.ts` timed out, follow `EXECUTOR-BRIEF.md`
      section 3. Any other failure: STOP and ask "the step 3 commit failed with <first failing line>; what do I do?".

   The commit message:

```text
<VERSION> - fix(notifications): the scheduling lock waits for every piece of work before reporting a failure

Finding 82. Scheduling operations used Promise.all, which rejects at the first failure while the rest still runs. The
lock was released with that rejection, so the next operation in the queue (an alert sheet commit, the refresh after a
sync, a return to the app) could arm or cancel beside work still landing, leaving an Off prayer armed or a prayer that
is on missing an alarm.

- A private settleAll waits for every piece, then rejects with the first failure. It replaces Promise.all for the
  days of a prayer, the prayers of a schedule, the four schedule groups and a single prayer's update.
- Clearing a prayer's recorded alarms lets every cancel land before a refusal is reported.
- notificationSchedulingLock.test.ts holds work on its way in each of those places and shows the next operation
  waiting for it.
```

9. **Review.**
   Spawn a `Code Reviewer` subagent, isolation `worktree`, with no `model`, and this prompt, with `<sha>` replaced by the
   step 3 commit's sha:

```text
Run git checkout --detach <sha>. Your worktree starts at the wrong branch.

You review one commit in the rn.athan.uk repository, a React Native prayer-times app. The commit is step 3 of the plan
ai/plans/06-alert-integrity/PLAN.md, executed by another model. Read these files in full, with no partial reads:
ai/plans/06-alert-integrity/steps/3-lock-waits-for-every-piece.md, __tests__/README.md, stores/notifications.ts, device/notifications.ts, stores/__tests__/notificationSchedulingLock.test.ts.

Check each item and report every problem you find:
1. `git show <sha>` changes exactly the files the step's "Files" part lists, plus app.json and package.json, and
   plan files under ai/plans/ only where they record status or the log.
2. The source and test changes equal the step's "Change" and "Tests first" parts character for character. Compare the
   anchors in ai/plans/06-alert-integrity/scripts/anchors/ and the changes in scripts/changes/ and scripts/tests/ with
   the committed files.
3. The version in app.json and package.json is the next patch after the parent commit's package.json, and both match.
4. The commit message equals the step's message with <VERSION> filled in.
5. No operation inside withSchedulingLock can settle while a piece of work it started is still running. The Promise.all calls left in stores/notifications.ts (_cancelStaleNotificationIds) and device/notifications.ts (clearAllScheduledRemindersForPrayer) wrap only promises that catch their own failures, so they cannot reject early.
6. Every new test follows __tests__/README.md, and would fail if the line it guards were broken.

Reply with numbered findings (file, line, problem, exact fix), then a final line that is exactly "merge" or
"fix first".
```

   A "merge" verdict is a final line that is exactly `merge`. On "fix first", apply only a fix that `PLAN.md` section 10
   gives word for word; any other finding is a STOP (`EXECUTOR-BRIEF.md` section 4, item 8).

10. **Merge.**
   `git checkout uat-2 && git merge --no-ff fix/audit-82-lock-waits-for-every-piece -m "Merge fix/audit-82-lock-waits-for-every-piece into uat-2: the scheduling lock waits for every piece of work, reviewed"`

11. **Done when.**
   1. `git branch --show-current` prints `uat-2`.
   2. `git log -1 --format=%s` prints `Merge fix/audit-82-lock-waits-for-every-piece into uat-2: the scheduling lock waits for every piece of work, reviewed`.
   3. `git status --porcelain` lists nothing but the three plan files.
   4. In `PLAN.md` section 6, replace the whole line that starts `- [ ] Step 3:` with `- [x] Step 3: DONE in <merge sha>`, and append the step's record to `LOG.md`.
