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
  scheduleMock.mock.calls.filter(([request]) => (request as { identifier?: string })?.identifier === identifier).length;
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
