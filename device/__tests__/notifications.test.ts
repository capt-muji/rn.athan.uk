/**
 * Unit tests for device/notifications.ts deterministic identifiers
 *
 * Verifies the notification identifier format that gives scheduling idempotent
 * replace semantics (same identifier = replace on Android PendingIntent and iOS
 * UNUserNotificationCenter). See ai/ISSUES.md #12. Also verifies that every
 * notification fires at its list row's own instant (ISSUES #29).
 */

import { AndroidImportance, scheduleNotificationAsync, setNotificationChannelAsync } from 'expo-notifications';
import { Platform } from 'react-native';

import {
  addOneScheduledNotificationForPrayer,
  addOneScheduledReminderForPrayer,
  prayerNotificationIdentifier,
  reminderNotificationIdentifier,
} from '@/device/notifications';
import { createPrayerDatetime } from '@/shared/time';
import { AlertType, type Prayer, ScheduleType } from '@/shared/types';

/** A list row as PrayerUtils.getPrayerForDate returns it */
const row = (english: string, arabic: string, date: string, time: string, type = ScheduleType.Standard): Prayer => ({
  type,
  english,
  arabic,
  datetime: createPrayerDatetime(date, time),
  time,
  belongsToDate: date,
});

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
// IDENTIFIER ECHO TESTS
//
// The SDK resolves with the identifier it was given, and production stores that
// resolved value as the record id while the reconciliation sweep diffs stored ids
// against OS identifiers. If the two ever stop agreeing, every pending alert is
// classified as an orphan and cancelled immediately after being scheduled.
// =============================================================================

describe('the scheduled record id echoes the deterministic identifier', () => {
  beforeEach(() => {
    (scheduleNotificationAsync as jest.Mock).mockClear();
  });

  it('returns the at-time identifier as the record id', async () => {
    const notification = await addOneScheduledNotificationForPrayer(
      ScheduleType.Standard,
      '2026-09-01',
      row('Fajr', 'الفجر', '2026-09-01', '06:15'),
      AlertType.Sound,
      0
    );

    expect(notification.id).toBe(prayerNotificationIdentifier(ScheduleType.Standard, 'Fajr', '2026-09-01'));
  });

  it('returns the reminder identifier as the record id, interval included', async () => {
    const notification = await addOneScheduledReminderForPrayer(
      ScheduleType.Standard,
      '2026-09-01',
      row('Fajr', 'الفجر', '2026-09-01', '06:15'),
      15,
      AlertType.Silent
    );

    expect(notification.id).toBe(reminderNotificationIdentifier(ScheduleType.Standard, 'Fajr', '2026-09-01', 15));
  });

  it('gives two prayers on the same day two distinct ids, so their records cannot collapse', async () => {
    const fajr = await addOneScheduledNotificationForPrayer(
      ScheduleType.Standard,
      '2026-09-01',
      row('Fajr', 'الفجر', '2026-09-01', '06:15'),
      AlertType.Silent,
      0
    );
    const isha = await addOneScheduledNotificationForPrayer(
      ScheduleType.Standard,
      '2026-09-01',
      row('Isha', 'العشاء', '2026-09-01', '21:00'),
      AlertType.Silent,
      0
    );

    expect(fajr.id).not.toBe(isha.id);
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

  afterEach(() => {
    Platform.OS = 'ios';
  });

  it('attaches the athan_N_v2 channel for Sound alerts (channel follows the selected sound)', async () => {
    await addOneScheduledNotificationForPrayer(
      ScheduleType.Standard,
      '2026-09-01',
      row('Fajr', 'الفجر', '2026-09-01', '06:15'),
      AlertType.Sound,
      4
    );

    const trigger = (scheduleNotificationAsync as jest.Mock).mock.calls[0][0].trigger;
    expect(trigger.channelId).toBe('athan_5_v2');
  });

  it('attaches the fixed extras channel for Sunrise (standard page, extras audio — ISSUES #23)', async () => {
    await addOneScheduledNotificationForPrayer(
      ScheduleType.Standard,
      '2026-09-01',
      row('Sunrise', 'الشروق', '2026-09-01', '06:15'),
      AlertType.Sound,
      4
    );

    const trigger = (scheduleNotificationAsync as jest.Mock).mock.calls[0][0].trigger;
    expect(trigger.channelId).toBe('extras_at_time');
  });

  it('attaches the fixed extras channel for extras prayers (Last Third)', async () => {
    await addOneScheduledNotificationForPrayer(
      ScheduleType.Extra,
      '2026-09-01',
      row('Last Third', 'آخر ثلث', '2026-09-01', '01:30', ScheduleType.Extra),
      AlertType.Sound,
      4
    );

    const trigger = (scheduleNotificationAsync as jest.Mock).mock.calls[0][0].trigger;
    expect(trigger.channelId).toBe('extras_at_time');
  });

  it('creates the extras channel before scheduling an extras Sound notification (Android)', async () => {
    Platform.OS = 'android';

    await addOneScheduledNotificationForPrayer(
      ScheduleType.Extra,
      '2026-09-01',
      row('Midnight', 'نصف الليل', '2026-08-31', '23:59', ScheduleType.Extra),
      AlertType.Sound,
      0
    );

    expect(setNotificationChannelAsync).toHaveBeenCalledWith('extras_at_time', expect.anything());
  });

  it('creates the selected athan channel before scheduling a daily-prayer Sound notification (Android)', async () => {
    Platform.OS = 'android';

    await addOneScheduledNotificationForPrayer(
      ScheduleType.Standard,
      '2026-09-01',
      row('Isha', 'العشاء', '2026-09-01', '21:00'),
      AlertType.Sound,
      4
    );

    expect(setNotificationChannelAsync).toHaveBeenCalledWith(
      'athan_5_v2',
      expect.objectContaining({ sound: 'athan5.mp3', importance: AndroidImportance.MAX })
    );
  });

  it('creates the athan channel once per process across a full reschedule', async () => {
    Platform.OS = 'android';

    await addOneScheduledNotificationForPrayer(
      ScheduleType.Standard,
      '2026-09-02',
      row('Fajr', 'الفجر', '2026-09-02', '06:15'),
      AlertType.Sound,
      6
    );
    await addOneScheduledNotificationForPrayer(
      ScheduleType.Standard,
      '2026-09-02',
      row('Dhuhr', 'الظهر', '2026-09-02', '13:00'),
      AlertType.Sound,
      6
    );

    const athanCalls = (setNotificationChannelAsync as jest.Mock).mock.calls.filter(([id]) => id === 'athan_7_v2');
    expect(athanCalls).toHaveLength(1);
  });

  it('creates no channel for a daily-prayer Sound notification on iOS', async () => {
    await addOneScheduledNotificationForPrayer(
      ScheduleType.Standard,
      '2026-09-01',
      row('Isha', 'العشاء', '2026-09-01', '21:00'),
      AlertType.Sound,
      4
    );

    expect(setNotificationChannelAsync).not.toHaveBeenCalled();
  });

  it('omits the channelId for Silent alerts', async () => {
    await addOneScheduledNotificationForPrayer(
      ScheduleType.Standard,
      '2026-09-01',
      row('Fajr', 'الفجر', '2026-09-01', '06:15'),
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
      ScheduleType.Extra,
      '2026-09-01',
      row('Last Third', 'آخر ثلث', '2026-09-01', '01:30', ScheduleType.Extra),
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
      '2026-09-01',
      row('Fajr', 'الفجر', '2026-09-01', '06:15'),
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
      '2026-09-01',
      row('Fajr', 'الفجر', '2026-09-01', '06:15'),
      15,
      AlertType.Sound
    );

    expect(setNotificationChannelAsync).not.toHaveBeenCalled();
    const trigger = (scheduleNotificationAsync as jest.Mock).mock.calls[0][0].trigger;
    expect(trigger.channelId).toBeUndefined();
  });
});

// =============================================================================
// TRIGGER INSTANTS (ISSUES #29: the list row is the one source of truth)
// =============================================================================

describe('trigger instants', () => {
  beforeEach(() => {
    (scheduleNotificationAsync as jest.Mock).mockClear();
  });

  // Midnight of the list for Sat 24 Oct 2026 falls on the night before: Fri 23 Oct 23:58 BST
  const midnightOf24Oct: Prayer = {
    ...row('Midnight', 'نصف الليل', '2026-10-23', '23:58', ScheduleType.Extra),
    belongsToDate: '2026-10-24',
  };

  it('fires the at-time notification at the row datetime, keyed by its list day', async () => {
    const record = await addOneScheduledNotificationForPrayer(
      ScheduleType.Extra,
      '2026-10-24',
      midnightOf24Oct,
      AlertType.Silent,
      0
    );

    const request = (scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(request.trigger.date.toISOString()).toBe('2026-10-23T22:58:00.000Z');
    expect(request.identifier).toBe('athan_extra_midnight_2026-10-24');
    expect(record).toMatchObject({ date: '2026-10-24', time: '23:58', englishName: 'Midnight' });
  });

  it('fires in the repeated hour of the clock-change night at the exact instant (01:00 GMT, not 01:00 BST)', async () => {
    const lastThird: Prayer = {
      type: ScheduleType.Extra,
      english: 'Last Third',
      arabic: 'آخر ثلث',
      datetime: new Date('2026-10-25T01:00:00.000Z'),
      time: '01:00',
      belongsToDate: '2026-10-25',
    };

    await addOneScheduledNotificationForPrayer(ScheduleType.Extra, '2026-10-25', lastThird, AlertType.Silent, 0);

    const request = (scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(request.trigger.date.toISOString()).toBe('2026-10-25T01:00:00.000Z');
  });

  it('fires the reminder exactly its interval before the row datetime', async () => {
    const record = await addOneScheduledReminderForPrayer(
      ScheduleType.Extra,
      '2026-10-24',
      midnightOf24Oct,
      15,
      AlertType.Silent
    );

    const request = (scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(request.trigger.date.toISOString()).toBe('2026-10-23T22:43:00.000Z');
    expect(request.identifier).toBe('reminder_extra_midnight_2026-10-24_15');
    expect(record).toMatchObject({ date: '2026-10-24', time: '23:58', englishName: 'Midnight' });
  });
});
