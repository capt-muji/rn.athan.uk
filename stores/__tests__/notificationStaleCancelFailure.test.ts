/**
 * A stale alarm the OS refuses to cancel during a reschedule (stores/notifications.ts, issue #15)
 *
 * A reschedule arms the new window first and only then cancels the identifiers it no longer wants. One refused
 * cancel must not abort the rest of that batch or reject the reschedule, since everything already armed is correct.
 * The refusal is logged, and the post-reschedule sweep, which compares what the OS holds with the records, finds the
 * alarm still held and asks again. The at-time and the reminder paths share this, so both are run.
 */

import * as Notifications from 'expo-notifications';
import { getDefaultStore } from 'jotai';

import { prayerNotificationIdentifier, reminderNotificationIdentifier } from '@/device/notifications';
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

// 09:00 BST on Saturday 29 August 2026, with every time of today and tomorrow at 12:00 BST
const NOW = new Date('2026-08-29T08:00:00.000Z');
const DAYS_BEFORE = ['2026-08-27', '2026-08-28'];
const WINDOW = ['2026-08-29', '2026-08-30'];
const INTERVAL = 5 as ReminderInterval;

const scheduleMock = jest.mocked(Notifications.scheduleNotificationAsync);
const cancelMock = jest.mocked(Notifications.cancelScheduledNotificationAsync);
const getAllMock = jest.mocked(Notifications.getAllScheduledNotificationsAsync);

const osState = new Set<string>();

const record = (id: string, date: string) => ({
  id,
  date,
  time: '12:00',
  englishName: 'Fajr',
  arabicName: 'الفجر',
  alertType: AlertType.Silent,
});

const PATHS = [
  {
    path: 'at-time',
    id: (date: string) => prayerNotificationIdentifier(ScheduleType.Standard, 'Fajr', date),
    save: (id: string, date: string) =>
      Database.addOneScheduledNotificationForPrayer(ScheduleType.Standard, 0, record(id, date)),
  },
  {
    path: 'reminder',
    id: (date: string) => reminderNotificationIdentifier(ScheduleType.Standard, 'Fajr', date, INTERVAL),
    save: (id: string, date: string) =>
      Database.addOneScheduledReminderForPrayer(ScheduleType.Standard, 0, record(id, date)),
  },
];

/** Refuses to cancel the named identifier the given number of times, then cancels it like any other */
const refuseToCancel = (target: string, times: number) => {
  let refusals = 0;
  cancelMock.mockImplementation(async (identifier: string) => {
    if (identifier === target && refusals < times) {
      refusals += 1;
      throw new Error('Notification could not be cancelled');
    }
    osState.delete(identifier);
  });
};

const cancelsOf = (identifier: string) => cancelMock.mock.calls.filter(([id]) => id === identifier).length;

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  jest.clearAllMocks();
  osState.clear();
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

  store.set(standardPrayerAlertAtoms[0], AlertType.Silent);
  store.set(standardReminderAlertAtoms[0], AlertType.Silent);
  store.set(standardReminderIntervalAtoms[0], INTERVAL);

  scheduleMock.mockImplementation(async (request) => {
    const identifier = (request as { identifier: string }).identifier;
    osState.add(identifier);
    return identifier;
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

describe.each(PATHS)('on the $path path', ({ id, save }) => {
  /** The window armed for Fajr on both paths */
  const armedWindow = () => PATHS.flatMap((each) => WINDOW.map((date) => each.id(date))).sort();

  beforeEach(() => {
    // The two days before the window, armed by an earlier reschedule
    for (const date of DAYS_BEFORE) {
      save(id(date), date);
      osState.add(id(date));
    }
  });

  it('cancels the rest of the batch, logs the refusal, and has the sweep cancel the refused alarm on the retry', async () => {
    const refused = id(DAYS_BEFORE[1]);
    refuseToCancel(refused, 1);

    await expect(rescheduleAllNotifications()).resolves.toBeUndefined();

    expect(logger.warn).toHaveBeenCalledWith('NOTIFICATION: Failed to cancel stale notification:', {
      id: refused,
      error: expect.any(Error),
    });
    expect(logger.warn).toHaveBeenCalledWith('NOTIFICATION: Sweep found stale OS notifications:', {
      count: 1,
      staleIds: [refused],
    });
    expect(cancelsOf(id(DAYS_BEFORE[0]))).toBe(1);
    expect(cancelsOf(refused)).toBe(2);
    expect([...osState].sort()).toEqual(armedWindow());
  });

  it('keeps the window armed when the OS refuses the retry too, and the next reschedule asks again', async () => {
    const refused = id(DAYS_BEFORE[1]);
    refuseToCancel(refused, 2);

    await expect(rescheduleAllNotifications()).resolves.toBeUndefined();

    expect(cancelsOf(refused)).toBe(2);
    expect([...osState].sort()).toEqual([...armedWindow(), refused].sort());

    await expect(rescheduleAllNotifications()).resolves.toBeUndefined();

    expect(cancelsOf(refused)).toBe(3);
    expect([...osState].sort()).toEqual(armedWindow());
  });
});
