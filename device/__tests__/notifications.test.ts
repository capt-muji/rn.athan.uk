/**
 * Unit tests for device/notifications.ts deterministic identifiers
 *
 * Verifies the notification identifier format that gives scheduling idempotent
 * replace semantics (same identifier = replace on Android PendingIntent and iOS
 * UNUserNotificationCenter). See ai/ISSUES.md #12.
 */

import { scheduleNotificationAsync, setNotificationChannelAsync } from 'expo-notifications';
import { Platform } from 'react-native';

import {
  addOneScheduledNotificationForPrayer,
  addOneScheduledReminderForPrayer,
  prayerNotificationIdentifier,
  reminderNotificationIdentifier,
} from '@/device/notifications';
import { AlertType, ScheduleType } from '@/shared/types';

describe('prayerNotificationIdentifier', () => {
  it('builds a deterministic at-time identifier from schedule type, prayer name and date', () => {
    expect(prayerNotificationIdentifier(ScheduleType.Standard, 'Fajr', '2026-08-28')).toBe(
      'athan_standard_fajr_2026-08-28'
    );
  });

  it('lowercases prayer names so casing never produces a second identity', () => {
    expect(prayerNotificationIdentifier(ScheduleType.Extra, 'Last Third', '2026-08-28')).toBe(
      'athan_extra_last third_2026-08-28'
    );
  });

  it('is stable across repeated calls (idempotent replace key)', () => {
    const first = prayerNotificationIdentifier(ScheduleType.Standard, 'Magrib', '2026-08-29');
    const second = prayerNotificationIdentifier(ScheduleType.Standard, 'magrib', '2026-08-29');
    expect(first).toBe(second);
  });

  it('differs per schedule type and date', () => {
    const base = prayerNotificationIdentifier(ScheduleType.Standard, 'Asr', '2026-08-28');
    expect(prayerNotificationIdentifier(ScheduleType.Extra, 'Asr', '2026-08-28')).not.toBe(base);
    expect(prayerNotificationIdentifier(ScheduleType.Standard, 'Asr', '2026-08-29')).not.toBe(base);
  });
});

describe('reminderNotificationIdentifier', () => {
  it('builds a deterministic reminder identifier including the interval', () => {
    expect(reminderNotificationIdentifier(ScheduleType.Extra, 'Duha', '2026-08-29', 20)).toBe(
      'reminder_extra_duha_2026-08-29_20'
    );
  });

  it('differs when the reminder interval changes (old identity cancelled separately)', () => {
    const twenty = reminderNotificationIdentifier(ScheduleType.Standard, 'Isha', '2026-08-28', 20);
    const ten = reminderNotificationIdentifier(ScheduleType.Standard, 'Isha', '2026-08-28', 10);
    expect(twenty).not.toBe(ten);
  });
});

// =============================================================================
// CHANNEL WIRING TESTS (which channel a scheduled notification carries)
// =============================================================================

describe('addOneScheduledNotificationForPrayer channel wiring', () => {
  beforeEach(() => {
    (scheduleNotificationAsync as jest.Mock).mockClear();
    (setNotificationChannelAsync as jest.Mock).mockClear();
  });

  it('attaches the athan_N_v2 channel for Sound alerts (channel follows the selected sound)', async () => {
    await addOneScheduledNotificationForPrayer(
      ScheduleType.Standard,
      'Fajr',
      'الفجر',
      '2026-09-01',
      '06:15',
      AlertType.Sound,
      4
    );

    const trigger = (scheduleNotificationAsync as jest.Mock).mock.calls[0][0].trigger;
    expect(trigger.channelId).toBe('athan_5_v2');
  });

  it('omits the channelId for Silent alerts', async () => {
    await addOneScheduledNotificationForPrayer(
      ScheduleType.Standard,
      'Fajr',
      'الفجر',
      '2026-09-01',
      '06:15',
      AlertType.Silent,
      4
    );

    const trigger = (scheduleNotificationAsync as jest.Mock).mock.calls[0][0].trigger;
    expect(trigger.channelId).toBeUndefined();
  });
});

describe('addOneScheduledReminderForPrayer channel wiring', () => {
  beforeEach(() => {
    (scheduleNotificationAsync as jest.Mock).mockClear();
    (setNotificationChannelAsync as jest.Mock).mockClear();
  });

  afterEach(() => {
    Platform.OS = 'ios';
  });

  it('creates the per-prayer × interval channel before scheduling and carries it (Android + Sound)', async () => {
    Platform.OS = 'android';

    await addOneScheduledReminderForPrayer(
      ScheduleType.Standard,
      'Last Third',
      'آخر ثلث',
      '2026-09-01',
      '01:30',
      15,
      AlertType.Sound
    );

    expect(setNotificationChannelAsync).toHaveBeenCalledWith('reminder_last_third_15', expect.anything());
    const trigger = (scheduleNotificationAsync as jest.Mock).mock.calls[0][0].trigger;
    expect(trigger.channelId).toBe('reminder_last_third_15');
  });

  it('creates no channel and omits channelId for Silent reminders (Android)', async () => {
    Platform.OS = 'android';

    await addOneScheduledReminderForPrayer(
      ScheduleType.Standard,
      'Fajr',
      'الفجر',
      '2026-09-01',
      '06:15',
      15,
      AlertType.Silent
    );

    expect(setNotificationChannelAsync).not.toHaveBeenCalled();
    const trigger = (scheduleNotificationAsync as jest.Mock).mock.calls[0][0].trigger;
    expect(trigger.channelId).toBeUndefined();
  });

  it('creates no channel on iOS (sound travels on the notification content, not a channel)', async () => {
    await addOneScheduledReminderForPrayer(
      ScheduleType.Standard,
      'Fajr',
      'الفجر',
      '2026-09-01',
      '06:15',
      15,
      AlertType.Sound
    );

    expect(setNotificationChannelAsync).not.toHaveBeenCalled();
    const trigger = (scheduleNotificationAsync as jest.Mock).mock.calls[0][0].trigger;
    expect(trigger.channelId).toBeUndefined();
  });
});
