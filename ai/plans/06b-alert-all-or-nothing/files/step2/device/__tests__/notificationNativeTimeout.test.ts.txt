/**
 * device/notifications.ts when a call into the notification system never answers
 *
 * Every call the scheduling queue can wait on is given fifteen seconds. Without that, one silent call would hold the
 * queue for the rest of the process: no alert sheet change, no refresh and no background run would arm or cancel
 * anything again, while the bell already shows what the user picked.
 */

import {
  cancelScheduledNotificationAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
} from 'expo-notifications';
import { Platform } from 'react-native';

import {
  addOneScheduledNotificationForPrayer,
  addOneScheduledReminderForPrayer,
  cancelScheduledNotificationById,
  clearAllScheduledNotificationForPrayer,
  clearAllScheduledRemindersForPrayer,
} from '@/device/notifications';
import logger from '@/shared/logger';
import { createPrayerDatetime } from '@/shared/time';
import { AlertType, type ReadablePrayer, type ReminderInterval, ScheduleType } from '@/shared/types';

jest.mock('@/shared/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  isProd: () => false,
  isPreview: () => false,
  isTest: () => true,
}));

const mockGetNotifications = jest.fn();
const mockGetReminders = jest.fn();

jest.mock('@/stores/database', () => ({
  getAllScheduledNotificationsForPrayer: (...args: unknown[]) => mockGetNotifications(...args),
  getAllScheduledRemindersForPrayer: (...args: unknown[]) => mockGetReminders(...args),
  addOneScheduledNotificationForPrayer: jest.fn(),
  addOneScheduledReminderForPrayer: jest.fn(),
}));

const ISHA_ID = 'athan_standard_isha_2026-09-17';
const ISHA_REMINDER_ID = 'reminder_standard_isha_2026-09-17_15';
const INTERVAL = 15 as ReminderInterval;

/** A readable list row as PrayerUtils.getPrayerForDate returns it */
const isha: ReadablePrayer = {
  type: ScheduleType.Standard,
  english: 'Isha',
  arabic: 'العشاء',
  datetime: createPrayerDatetime('2026-09-17', '20:31'),
  time: '20:31',
  belongsToDate: '2026-09-17',
};

const record = (id: string) => ({
  id,
  date: '2026-09-17',
  time: '20:31',
  englishName: 'Isha',
  arabicName: 'العشاء',
  alertType: AlertType.Silent,
});

const neverAnswers = () => new Promise<never>(() => undefined);

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  Platform.OS = 'ios';
  mockGetNotifications.mockReturnValue([record(ISHA_ID)]);
  mockGetReminders.mockReturnValue([record(ISHA_REMINDER_ID)]);
});

afterEach(() => {
  jest.useRealTimers();
  Platform.OS = 'ios';
  (scheduleNotificationAsync as jest.Mock).mockReset().mockResolvedValue('mock-notification-id');
  (cancelScheduledNotificationAsync as jest.Mock).mockReset().mockResolvedValue(undefined);
  (setNotificationChannelAsync as jest.Mock).mockReset().mockResolvedValue(undefined);
});

describe('a call into the notification system that never answers', () => {
  it('makes arming a prayer fail after fifteen seconds', async () => {
    (scheduleNotificationAsync as jest.Mock).mockImplementation(neverAnswers);
    const armed = addOneScheduledNotificationForPrayer(ScheduleType.Standard, '2026-09-17', isha, AlertType.Silent, 0);
    // The expectation is taken before the clock moves: it is what handles the rejection
    const failed = expect(armed).rejects.toThrow(`arming ${ISHA_ID} did not answer in 15000 ms`);

    await jest.advanceTimersByTimeAsync(15_000);

    await failed;
  });

  it('makes arming a reminder fail after fifteen seconds', async () => {
    (scheduleNotificationAsync as jest.Mock).mockImplementation(neverAnswers);
    const armed = addOneScheduledReminderForPrayer(
      ScheduleType.Standard,
      '2026-09-17',
      isha,
      INTERVAL,
      AlertType.Silent
    );
    const failed = expect(armed).rejects.toThrow(`arming ${ISHA_REMINDER_ID} did not answer in 15000 ms`);

    await jest.advanceTimersByTimeAsync(15_000);

    await failed;
  });

  it('makes cancelling one alarm fail after fifteen seconds', async () => {
    (cancelScheduledNotificationAsync as jest.Mock).mockImplementation(neverAnswers);
    const cancelled = cancelScheduledNotificationById(ISHA_ID);
    const failed = expect(cancelled).rejects.toThrow(`cancelling ${ISHA_ID} did not answer in 15000 ms`);

    await jest.advanceTimersByTimeAsync(15_000);

    await failed;
  });

  it("reports the alarm as refused when clearing a prayer's alarms is the call that hangs", async () => {
    (cancelScheduledNotificationAsync as jest.Mock).mockImplementation(neverAnswers);
    const cleared = clearAllScheduledNotificationForPrayer(ScheduleType.Standard, 5);

    await jest.advanceTimersByTimeAsync(15_000);

    await expect(cleared).resolves.toEqual([ISHA_ID]);
    expect(logger.warn).toHaveBeenCalledWith('NOTIFICATION SYSTEM: Failed to cancel notification:', {
      id: ISHA_ID,
      error: expect.objectContaining({
        message: expect.stringContaining(`cancelling ${ISHA_ID} did not answer in 15000 ms`),
      }),
    });
  });

  it("reports the reminder as refused when clearing a prayer's reminders is the call that hangs", async () => {
    (cancelScheduledNotificationAsync as jest.Mock).mockImplementation(neverAnswers);
    const cleared = clearAllScheduledRemindersForPrayer(ScheduleType.Standard, 5);

    await jest.advanceTimersByTimeAsync(15_000);

    await expect(cleared).resolves.toEqual([ISHA_REMINDER_ID]);
    expect(logger.warn).toHaveBeenCalledWith('REMINDER SYSTEM: Failed to cancel reminder:', {
      id: ISHA_REMINDER_ID,
      error: expect.objectContaining({
        message: expect.stringContaining(`cancelling ${ISHA_REMINDER_ID} did not answer in 15000 ms`),
      }),
    });
  });

  it('makes arming a Sound prayer fail when the Android channel is what hangs', async () => {
    Platform.OS = 'android';
    (setNotificationChannelAsync as jest.Mock).mockImplementation(neverAnswers);
    const armed = addOneScheduledNotificationForPrayer(ScheduleType.Standard, '2026-09-17', isha, AlertType.Sound, 0);
    const failed = expect(armed).rejects.toThrow('creating the athan_1_v2 channel did not answer in 15000 ms');

    await jest.advanceTimersByTimeAsync(15_000);

    await failed;
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('makes arming a Sound reminder fail when the Android channel is what hangs', async () => {
    Platform.OS = 'android';
    (setNotificationChannelAsync as jest.Mock).mockImplementation(neverAnswers);
    const armed = addOneScheduledReminderForPrayer(
      ScheduleType.Standard,
      '2026-09-17',
      isha,
      INTERVAL,
      AlertType.Sound
    );
    const failed = expect(armed).rejects.toThrow('creating the reminder_isha_15 channel did not answer in 15000 ms');

    await jest.advanceTimersByTimeAsync(15_000);

    await failed;
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
