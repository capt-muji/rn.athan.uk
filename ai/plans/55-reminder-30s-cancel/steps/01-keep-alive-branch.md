# Step 01: the keep-alive branch

Requirements: R1.1, R1.2, R2.1, R3.1, R4.1
Weight: 2

Anchor check (all must count 1 in `stores/notifications.ts`):

```
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/55-reminder-30s-cancel/scripts/anchors/reminder-skip-docblock.txt stores/notifications.ts
```

Repeat for `reminder-time-calc`, `reminder-imminent-guard`, `reminder-identifier-try`. Any count
other than 1 is STOP.

## Goal

Inside the imminent guard, an armed and recorded reminder whose moment is still ahead returns
its identifier as kept instead of `SKIPPED_DAY`. The identifier computation moves above the
guard. Nothing else in the file changes.

## Branch

```
git checkout -b fix/reminder-imminent-keep-alive uat
```

## Files

- `stores/notifications.ts` (change)
- `stores/__tests__/reminderImminentKeepAlive.test.ts` (new)

## Red tests

Write `stores/__tests__/reminderImminentKeepAlive.test.ts` exactly:

```ts
/**
 * An armed reminder inside its final 30 seconds survives a reschedule (stores/notifications.ts)
 *
 * A reminder whose moment is inside the buffer is not armed again, and the skip used to return no
 * identifier, so the per-prayer stale sweep read the armed request's record as unattempted and
 * cancelled a reminder that was about to fire. The pass must instead count it as kept: no re-arm,
 * no cancel, record intact, so it fires with the content it was armed with.
 */

import * as Notifications from 'expo-notifications';
import { getDefaultStore } from 'jotai';

import { reminderNotificationIdentifier } from '@/device/notifications';
import logger from '@/shared/logger';
import { AlertType, type ISingleApiResponseTransformed, type ReminderInterval, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';
import {
  rescheduleAllNotifications,
  standardPrayerAlertAtoms,
  standardReminderAlertAtoms,
  standardReminderIntervalAtoms,
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

// Fajr sits at 12:00 BST, so a 5 minute reminder fires at 10:55:00Z; NOW is 15 seconds before it
const NOW = new Date('2026-08-29T10:54:45.000Z');
const PAST_NOW = new Date('2026-08-29T10:55:30.000Z');
const WINDOW = ['2026-08-29', '2026-08-30'];
const INTERVAL = 5 as ReminderInterval;

const scheduleMock = jest.mocked(Notifications.scheduleNotificationAsync);
const cancelMock = jest.mocked(Notifications.cancelScheduledNotificationAsync);
const getAllMock = jest.mocked(Notifications.getAllScheduledNotificationsAsync);

const osState = new Set<string>();

const imminentId = reminderNotificationIdentifier(ScheduleType.Standard, 'fajr', WINDOW[0], INTERVAL);
const tomorrowId = reminderNotificationIdentifier(ScheduleType.Standard, 'fajr', WINDOW[1], INTERVAL);

const record = (id: string, date: string) => ({
  id,
  date,
  time: '12:00',
  englishName: 'Fajr',
  alertType: AlertType.Silent,
});

const cancelsOf = (identifier: string) => cancelMock.mock.calls.filter(([id]) => id === identifier).length;
const schedulesOf = (identifier: string) =>
  scheduleMock.mock.calls.filter(([request]) => (request as { identifier?: string })?.identifier === identifier)
    .length;
const reminderRecords = () =>
  Database.getAllScheduledRemindersForPrayer(ScheduleType.Standard, 0).map((each) => each.id);

const seedDays = () => {
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
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  jest.clearAllMocks();
  osState.clear();
  Database.database.clearAll();
  seedDays();

  store.set(standardPrayerAlertAtoms[0], AlertType.Silent);
  store.set(standardReminderAlertAtoms[0][0], AlertType.Silent);
  store.set(standardReminderIntervalAtoms[0][0], INTERVAL);

  scheduleMock.mockImplementation(async (request) => {
    const identifier = (request as { identifier: string }).identifier;
    osState.add(identifier);
    return identifier;
  });
  cancelMock.mockImplementation(async (identifier: string) => {
    osState.delete(identifier);
  });
  getAllMock.mockImplementation(
    async () => [...osState].map((identifier) => ({ identifier })) as Notifications.NotificationRequest[]
  );
});

afterEach(() => {
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

describe('a reschedule inside the final 30 seconds before a reminder fires', () => {
  it('keeps the armed reminder: no cancel, no re-arm, record intact', async () => {
    Database.addOneScheduledReminderForPrayer(ScheduleType.Standard, 0, record(imminentId, WINDOW[0]));
    osState.add(imminentId);

    await expect(rescheduleAllNotifications()).resolves.toBeUndefined();

    expect(cancelsOf(imminentId)).toBe(0);
    expect(schedulesOf(imminentId)).toBe(0);
    expect(osState.has(imminentId)).toBe(true);
    expect(reminderRecords()).toContain(imminentId);
    expect(logger.info).toHaveBeenCalledWith('REMINDER: Keeping imminent reminder armed:', {
      date: WINDOW[0],
      prayerTime: '12:00',
      id: 'fajr',
      intervalMinutes: INTERVAL,
      secondsUntilReminder: 15,
    });
  });

  it('arms tomorrow normally while keeping the imminent one', async () => {
    Database.addOneScheduledReminderForPrayer(ScheduleType.Standard, 0, record(imminentId, WINDOW[0]));
    osState.add(imminentId);

    await expect(rescheduleAllNotifications()).resolves.toBeUndefined();

    expect(schedulesOf(tomorrowId)).toBe(1);
    expect(osState.has(tomorrowId)).toBe(true);
  });

  it('keeps the imminent reminder through a second pass still inside the window', async () => {
    Database.addOneScheduledReminderForPrayer(ScheduleType.Standard, 0, record(imminentId, WINDOW[0]));
    osState.add(imminentId);

    await rescheduleAllNotifications();
    await rescheduleAllNotifications();

    expect(cancelsOf(imminentId)).toBe(0);
    expect(osState.has(imminentId)).toBe(true);
    expect(reminderRecords()).toContain(imminentId);
  });

  it('does not arm an imminent reminder that was never armed', async () => {
    await expect(rescheduleAllNotifications()).resolves.toBeUndefined();

    expect(schedulesOf(imminentId)).toBe(0);
    expect(osState.has(imminentId)).toBe(false);
    expect(reminderRecords()).not.toContain(imminentId);
  });

  it('still cancels the reminder once its moment has passed', async () => {
    jest.setSystemTime(PAST_NOW);
    Database.addOneScheduledReminderForPrayer(ScheduleType.Standard, 0, record(imminentId, WINDOW[0]));
    osState.add(imminentId);

    await expect(rescheduleAllNotifications()).resolves.toBeUndefined();

    expect(cancelsOf(imminentId)).toBe(1);
    expect(osState.has(imminentId)).toBe(false);
    expect(reminderRecords()).not.toContain(imminentId);
  });
});
```

Run:

```
npx jest stores/__tests__/reminderImminentKeepAlive.test.ts --watchman=false --selectProjects=unit
```

Red, exactly: `keeps the armed reminder: no cancel, no re-arm, record intact` and `keeps the
imminent reminder through a second pass still inside the window` each fail at their
`expect(cancelsOf(imminentId)).toBe(0)` line with `Expected: 0, Received: 1`. The other three
tests pass before the change and must pass after it. Anything else failing is STOP.

## Change contracts

In `stores/notifications.ts`, `scheduleReminderNotificationForDate`, four edits and nothing else:

1. Replace the anchor `reminder-skip-docblock` (the three `@returns` lines) with:

```
 * @returns The attempted identifier — scheduled or, on failure, whatever OS reminder the identifier already had — the
 *   kept identifier of an imminent reminder that was already armed, or null when the day was skipped (no readable
 *   time, past reminder, non-Friday Istijaba), and whether the phone refused it
```

2. Delete the identifier line under anchor `reminder-identifier-try` together with one of the two
   blank lines around it, so exactly one blank line remains between the guard's closing `}` and
   `try {`, and move the identifier line to directly after the `const now = TimeUtils.createInstant();`
   line of anchor `reminder-time-calc`, so the order becomes: `reminderDateTime`, `now`,
   `identifier`.
3. Inside the guard of anchor `reminder-imminent-guard`, between the `if
   (secondsUntilReminder < REMINDER_BUFFER_SECONDS) {` line and the existing skip log, insert:

```ts
    // Returning an already-armed imminent reminder unattempted stales its record, and the
    // per-prayer sweep then cancels a request about to fire, so it counts as kept instead
    if (
      reminderDateTime > now &&
      Database.getAllScheduledRemindersForPrayer(scheduleType, prayerIndex).map((each) => each.id).includes(identifier)
    ) {
      logger.info('REMINDER: Keeping imminent reminder armed:', {
        date,
        prayerTime: prayer.time,
        id,
        intervalMinutes,
        secondsUntilReminder,
      });
      return { identifier, refused: false };
    }
```

4. No other change. The try block keeps using the same `identifier` binding, now declared above.

## Green run

```
npx jest stores/__tests__/reminderImminentKeepAlive.test.ts --watchman=false --selectProjects=unit
npx jest --watchman=false --selectProjects=unit --silent
npx tsc --noEmit
npx biome check . --error-on-warnings
yarn validate
yarn test:tz
```

Expected: 5 passed in the suite; the unit project passes with no new failures; tsc exit 0; Biome
exit 0; `yarn validate` green end to end with coverage on (the pre-commit hook runs the same
gate, so this must not discover anything new); `yarn test:tz` green. Proven in the planning
worktree at `95e5a12e`: 153 suites, 4701 passed, 2 skipped.

## Break script

```
bash ai/plans/55-reminder-30s-cancel/scripts/break-01.sh
```

Expected output ends `ALL AS EXPECTED: 1`. The script backs up
`stores/notifications.ts`, replaces the keep-alive `return { identifier, refused: false };` with
`return SKIPPED_DAY;`, runs the suite expecting exactly the two red failures, restores the file
from the backup, and re-runs the suite expecting 5 passed. `git status --porcelain` afterwards
lists only this step's files and the plan files.

## Version and commit

Fetch `origin` under the version lock (`mkdir $HOME/athan-gitree/version.lock`, retry while it
exists, `rmdir` after the merge). The version is the next patch after `uat`'s `package.json`
(expected 2.0.5 if nothing else lands). Set it in `app.json`, `package.json` and
`android/app/build.gradle` (`versionName`), `app.json` first. Add by name:
`stores/notifications.ts`, `stores/__tests__/reminderImminentKeepAlive.test.ts`,
`ai/plans/README.md`, `ai/plans/55-reminder-30s-cancel/PLAN.md`, `ai/plans/55-reminder-30s-cancel/LOG.md`,
`ai/plans/55-reminder-30s-cancel/steps/01-keep-alive-branch.md`. Set the row to
`IN PROGRESS, step 1`. Commit message:

```
<VERSION> - fix(reminders): a pass inside 30s of an armed reminder keeps it armed
```

## Review checklist

- The diff touches exactly the two files, and in `stores/notifications.ts` exactly the four
  edits: docblock, moved identifier line, inserted branch, nothing else.
- The keep-alive return is `{ identifier, refused: false }`; the skip return stays `SKIPPED_DAY`.
- The condition order is `reminderDateTime > now &&` then the record membership; both halves
  present.
- The log line reads `REMINDER: Keeping imminent reminder armed:` with the five fields.
- No comment explains what; the one inserted comment explains why.
- The suite asserts no internals beyond the mocked OS boundary, in the house pattern of
  `notificationStaleCancelFailure.test.ts`.

## Merge

```
git checkout uat && git merge --no-ff fix/reminder-imminent-keep-alive -m "Merge fix/reminder-imminent-keep-alive into uat: job 55 step 01"
```

## Done when

Checklist ticked, LOG.md appended with the branch, commit sha, version, the hook's `Tests:` and
coverage lines, the break's last line, the review verdict and the merge sha.
