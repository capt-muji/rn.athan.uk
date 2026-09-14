/**
 * Alarms across London's 2026 clock changes, armed through the real notifications store
 *
 * On 25 October 01:00 to 01:59 happens twice, and that list's Last Third is at the second 01:00. On 29 March 01:00 to
 * 01:59 never happens.
 */

jest.mock('@/stores/widget', () => ({
  refreshPrayerWidgets: jest.fn(async () => undefined),
}));

jest.mock('@/stores/sync', () => ({
  sync: jest.fn(async () => undefined),
  getArmedDayChanges: jest.fn(() => 0),
}));

import type { ReminderInterval } from '@/shared/types';
import { ScheduleType } from '@/shared/types';
import { rescheduleAllNotifications } from '@/stores/notifications';

import { enable, londonDays, resetAlarms, storeDays, triggers } from './alarmHarness';

beforeEach(() => {
  jest.useFakeTimers();
  resetAlarms();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('the 25 October 2026 clock change', () => {
  beforeEach(() => {
    storeDays(londonDays('2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27'));
  });

  it('arms Fajr and the night rows at their real instants from the evening before', async () => {
    jest.setSystemTime(new Date('2026-10-24T21:00:00.000Z'));
    enable(ScheduleType.Standard, 'Fajr');
    enable(ScheduleType.Extra, 'Midnight');
    enable(ScheduleType.Extra, 'Last Third');

    await rescheduleAllNotifications();

    expect(triggers()).toEqual({
      'athan_extra_last third_2026-10-25': '2026-10-25T01:00:00.000Z',
      'athan_extra_last third_2026-10-26': '2026-10-26T01:00:00.000Z',
      'athan_extra_midnight_2026-10-25': '2026-10-24T22:58:00.000Z',
      'athan_extra_midnight_2026-10-26': '2026-10-25T22:57:00.000Z',
      'athan_standard_fajr_2026-10-25': '2026-10-25T05:04:00.000Z',
    });
  });

  // Every reminder for list 25 falls in the first pass of 01:xx, BST
  it.each<[ReminderInterval, string, string]>([
    [5, '2026-10-25T00:55:00.000Z', '2026-10-26T00:55:00.000Z'],
    [10, '2026-10-25T00:50:00.000Z', '2026-10-26T00:50:00.000Z'],
    [15, '2026-10-25T00:45:00.000Z', '2026-10-26T00:45:00.000Z'],
    [20, '2026-10-25T00:40:00.000Z', '2026-10-26T00:40:00.000Z'],
    [25, '2026-10-25T00:35:00.000Z', '2026-10-26T00:35:00.000Z'],
    [30, '2026-10-25T00:30:00.000Z', '2026-10-26T00:30:00.000Z'],
  ])(
    'arms the %i-minute Last Third reminder at %s, that much real time before the second 01:00',
    async (interval, list25, list26) => {
      jest.setSystemTime(new Date('2026-10-24T21:00:00.000Z'));
      enable(ScheduleType.Extra, 'Last Third', interval);

      await rescheduleAllNotifications();

      expect(triggers()).toEqual({
        'athan_extra_last third_2026-10-25': '2026-10-25T01:00:00.000Z',
        'athan_extra_last third_2026-10-26': '2026-10-26T01:00:00.000Z',
        [`reminder_extra_last third_2026-10-25_${interval}`]: list25,
        [`reminder_extra_last third_2026-10-26_${interval}`]: list26,
      });
    }
  );

  // The same clock reading twice: only the instant says whether list 25's Last Third is still to come
  it.each<{ now: string; clock: string; interval: ReminderInterval; list25: Record<string, string> }>([
    {
      now: '2026-10-25T00:30:00.000Z',
      clock: '01:30 BST, the first pass',
      interval: 15,
      list25: {
        'athan_extra_last third_2026-10-25': '2026-10-25T01:00:00.000Z',
        'reminder_extra_last third_2026-10-25_15': '2026-10-25T00:45:00.000Z',
      },
    },
    {
      now: '2026-10-25T00:50:00.000Z',
      clock: '01:50 BST, the first pass',
      interval: 15,
      list25: { 'athan_extra_last third_2026-10-25': '2026-10-25T01:00:00.000Z' },
    },
    {
      now: '2026-10-25T00:50:00.000Z',
      clock: '01:50 BST, the first pass',
      interval: 5,
      list25: {
        'athan_extra_last third_2026-10-25': '2026-10-25T01:00:00.000Z',
        'reminder_extra_last third_2026-10-25_5': '2026-10-25T00:55:00.000Z',
      },
    },
    { now: '2026-10-25T01:30:00.000Z', clock: '01:30 GMT, the second pass', interval: 5, list25: {} },
  ])(
    'at $clock, arms list 25’s Last Third and its $interval-minute reminder only while still ahead',
    async ({ now, interval, list25 }) => {
      jest.setSystemTime(new Date(now));
      enable(ScheduleType.Extra, 'Last Third', interval);

      await rescheduleAllNotifications();

      const minus = (instant: string) => new Date(Date.parse(instant) - interval * 60_000).toISOString();
      expect(triggers()).toEqual({
        ...list25,
        'athan_extra_last third_2026-10-26': '2026-10-26T01:00:00.000Z',
        'athan_extra_last third_2026-10-27': '2026-10-27T01:00:00.000Z',
        [`reminder_extra_last third_2026-10-26_${interval}`]: minus('2026-10-26T01:00:00.000Z'),
        [`reminder_extra_last third_2026-10-27_${interval}`]: minus('2026-10-27T01:00:00.000Z'),
      });
    }
  );
});

describe('the 29 March 2026 clock change', () => {
  it('arms Fajr, Suhoor and the night rows at their real instants from the evening before', async () => {
    jest.setSystemTime(new Date('2026-03-28T21:00:00.000Z'));
    storeDays(londonDays('2026-03-27', '2026-03-28', '2026-03-29', '2026-03-30'));
    enable(ScheduleType.Standard, 'Fajr');
    enable(ScheduleType.Extra, 'Suhoor');
    enable(ScheduleType.Extra, 'Midnight');
    enable(ScheduleType.Extra, 'Last Third');

    await rescheduleAllNotifications();

    expect(triggers()).toEqual({
      'athan_extra_last third_2026-03-29': '2026-03-29T00:54:00.000Z',
      'athan_extra_last third_2026-03-30': '2026-03-30T00:54:00.000Z',
      'athan_extra_midnight_2026-03-29': '2026-03-28T23:18:00.000Z',
      'athan_extra_midnight_2026-03-30': '2026-03-29T23:18:00.000Z',
      'athan_extra_suhoor_2026-03-29': '2026-03-29T03:47:00.000Z',
      'athan_standard_fajr_2026-03-29': '2026-03-29T04:07:00.000Z',
    });
  });
});
