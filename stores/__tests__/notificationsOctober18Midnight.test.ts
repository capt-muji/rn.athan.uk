/**
 * The two Midnight alarms on London's 18 October 2026: list 18's at exactly 00:00:00 BST and list 19's at 23:59
 *
 * Both fall on the same calendar day, so only the list day in the identifier tells them apart.
 */

jest.mock('@/stores/widget', () => ({
  refreshPrayerWidgets: jest.fn(async () => undefined),
}));

jest.mock('@/stores/sync', () => ({
  sync: jest.fn(async () => undefined),
  getArmedDayChanges: jest.fn(() => 0),
}));

import { ScheduleType } from '@/shared/types';
import { rescheduleAllNotifications } from '@/stores/notifications';

import { enable, londonDays, resetAlarms, storeDays, triggers } from './alarmHarness';

describe("18 October 2026's two Midnight alarms", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetAlarms();
    storeDays(londonDays('2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20'));
    enable(ScheduleType.Extra, 'Midnight', 5);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('arms both under their own list-day identifiers, with their reminders, from the evening before', async () => {
    jest.setSystemTime(new Date('2026-10-17T21:00:00.000Z'));

    await rescheduleAllNotifications();

    // List 17's Midnight was at 00:00:00 this morning, so nothing is armed for 17 October
    expect(triggers()).toEqual({
      'athan_extra_midnight_2026-10-18': '2026-10-17T23:00:00.000Z',
      'athan_extra_midnight_2026-10-19': '2026-10-18T22:59:00.000Z',
      'reminder_extra_midnight_2026-10-18_5': '2026-10-17T22:55:00.000Z',
      'reminder_extra_midnight_2026-10-19_5': '2026-10-18T22:54:00.000Z',
    });
  });

  it('arms nothing for list 18 once now is its 00:00:00 instant, and reaches list 20 instead', async () => {
    jest.setSystemTime(new Date('2026-10-17T23:00:00.000Z'));

    await rescheduleAllNotifications();

    expect(triggers()).toEqual({
      'athan_extra_midnight_2026-10-19': '2026-10-18T22:59:00.000Z',
      'athan_extra_midnight_2026-10-20': '2026-10-19T22:59:00.000Z',
      'reminder_extra_midnight_2026-10-19_5': '2026-10-18T22:54:00.000Z',
      'reminder_extra_midnight_2026-10-20_5': '2026-10-19T22:54:00.000Z',
    });
  });

  // List 18's reminder is due at 22:55:00Z, and a reminder less than 30 seconds ahead is not armed
  it.each([
    { now: '2026-10-17T22:54:29.000Z', offset: '31 s before', reminderArmed: true },
    { now: '2026-10-17T22:54:30.000Z', offset: '30 s before', reminderArmed: true },
    { now: '2026-10-17T22:54:31.000Z', offset: '29 s before', reminderArmed: false },
    { now: '2026-10-17T22:55:00.000Z', offset: 'exactly at', reminderArmed: false },
    { now: '2026-10-17T22:59:45.000Z', offset: '285 s after', reminderArmed: false },
  ])(
    'at $now, $offset list 18’s reminder, still arms both Midnights (that reminder armed: $reminderArmed)',
    async ({ now, reminderArmed }) => {
      jest.setSystemTime(new Date(now));

      await rescheduleAllNotifications();

      expect(triggers()).toEqual({
        'athan_extra_midnight_2026-10-18': '2026-10-17T23:00:00.000Z',
        'athan_extra_midnight_2026-10-19': '2026-10-18T22:59:00.000Z',
        ...(reminderArmed && { 'reminder_extra_midnight_2026-10-18_5': '2026-10-17T22:55:00.000Z' }),
        'reminder_extra_midnight_2026-10-19_5': '2026-10-18T22:54:00.000Z',
      });
    }
  );
});
