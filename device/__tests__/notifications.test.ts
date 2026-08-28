/**
 * Unit tests for device/notifications.ts deterministic identifiers
 *
 * Verifies the notification identifier format that gives scheduling idempotent
 * replace semantics (same identifier = replace on Android PendingIntent and iOS
 * UNUserNotificationCenter). See ai/ISSUES.md #12.
 */

import { prayerNotificationIdentifier, reminderNotificationIdentifier } from '@/device/notifications';
import { ScheduleType } from '@/shared/types';

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
