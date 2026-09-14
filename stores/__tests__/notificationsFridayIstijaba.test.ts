/**
 * Friday Istijaba when Magrib falls after 00:00, armed only for Friday's list
 *
 * Istijaba is an hour before Magrib's instant, so with Magrib at 01:20 it falls at 00:20 on Saturday, and with Magrib
 * at 00:40 at 23:40 on Friday. Either way it belongs to Friday's list, and Thursday's and Saturday's lists carry none,
 * whatever calendar day an instant of theirs would fall on. Every expected trigger was worked out separately, from
 * zoneinfo and the scheduling rules, not by the app's time helpers.
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

import { enable, minutesBefore, resetAlarms, sameTimesOn, storeDays, triggers } from './alarmHarness';

describe('Friday Istijaba when Magrib falls after 00:00', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetAlarms();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // 26 June 2026 is a Friday
  it.each([
    {
      magrib: '00:40',
      isha: '01:04',
      from: 'Thursday',
      now: '2026-06-25T20:00:00.000Z',
      at: '2026-06-26T22:40:00.000Z',
    },
    { magrib: '00:40', isha: '01:04', from: 'Friday', now: '2026-06-26T20:00:00.000Z', at: '2026-06-26T22:40:00.000Z' },
    {
      magrib: '01:20',
      isha: '01:44',
      from: 'Thursday',
      now: '2026-06-25T20:00:00.000Z',
      at: '2026-06-26T23:20:00.000Z',
    },
    { magrib: '01:20', isha: '01:44', from: 'Friday', now: '2026-06-26T20:00:00.000Z', at: '2026-06-26T23:20:00.000Z' },
  ])(
    'with Magrib at $magrib, a reschedule at 21:00 BST on $from arms only the Friday list Istijaba, at $at',
    async ({ magrib, isha, now, at }) => {
      jest.setSystemTime(new Date(now));
      storeDays(
        sameTimesOn(
          ['2026-06-25', '2026-06-26', '2026-06-27', '2026-06-28'],
          ['01:32', '02:58', '13:31', '17:31', magrib, isha]
        )
      );
      enable(ScheduleType.Extra, 'Istijaba', 5);

      await rescheduleAllNotifications();

      expect(triggers()).toEqual({
        'athan_extra_istijaba_2026-06-26': at,
        'reminder_extra_istijaba_2026-06-26_5': minutesBefore(at, 5),
      });
    }
  );
});
