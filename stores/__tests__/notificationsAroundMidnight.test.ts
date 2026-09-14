/**
 * Alarms for rows near 00:00, each armed at its own instant under the list day it belongs to
 *
 * High-latitude shapes, which London never has: a Standard row read either side of 00:00 and of 06:00, a Last Third
 * before and at 00:00, and a Fajr just after it. Every expected trigger and identifier was worked out separately,
 * from zoneinfo and the scheduling rules, not by the app's time helpers.
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

import { enable, minutesBefore, resetAlarms, sameTimesOn, storeDays, type Times, triggers } from './alarmHarness';

beforeEach(() => {
  jest.useFakeTimers();
  resetAlarms();
});

afterEach(() => {
  jest.useRealTimers();
});

/** An occurrence's at-time trigger and its 5-minute reminder, or nothing when it is not expected to be armed */
const armedWithReminder = (scheduleType: ScheduleType, name: string, date: string, instant: string | null) =>
  instant === null
    ? {}
    : {
        [`athan_${scheduleType}_${name.toLowerCase()}_${date}`]: instant,
        [`reminder_${scheduleType}_${name.toLowerCase()}_${date}_5`]: minutesBefore(instant, 5),
      };

describe('a Standard row read either side of 00:00 and of 06:00', () => {
  // The Magrib shape puts sunset itself in the small hours, with Isha after it
  const SHAPES: Record<'Isha' | 'Magrib', (reading: string) => Times> = {
    Isha: (reading) => ['02:40', '04:43', '13:02', '17:20', '21:25', reading],
    Magrib: (reading) => ['01:30', '02:55', '13:30', '17:30', reading, '00:30'],
  };

  const READINGS: { reading: string; list20: string | null; list21: string }[] = [
    { reading: '23:59', list20: '2026-06-20T22:59:00.000Z', list21: '2026-06-21T22:59:00.000Z' },
    { reading: '00:00', list20: '2026-06-20T23:00:00.000Z', list21: '2026-06-21T23:00:00.000Z' },
    { reading: '00:01', list20: '2026-06-20T23:01:00.000Z', list21: '2026-06-21T23:01:00.000Z' },
    { reading: '05:59', list20: '2026-06-21T04:59:00.000Z', list21: '2026-06-22T04:59:00.000Z' },
    // 06:00 is its own date's morning, already past at 13:00 BST on 20 June
    { reading: '06:00', list20: null, list21: '2026-06-21T05:00:00.000Z' },
  ];

  it.each((['Isha', 'Magrib'] as const).flatMap((name) => READINGS.map((row) => ({ name, ...row }))))(
    'arms $name read as $reading under its own list day, at its real instant, with its reminder',
    async ({ name, reading, list20, list21 }) => {
      jest.setSystemTime(new Date('2026-06-20T12:00:00.000Z'));
      storeDays(sameTimesOn(['2026-06-19', '2026-06-20', '2026-06-21', '2026-06-22'], SHAPES[name](reading)));
      enable(ScheduleType.Standard, name, 5);

      await rescheduleAllNotifications();

      expect(triggers()).toEqual({
        ...armedWithReminder(ScheduleType.Standard, name, '2026-06-20', list20),
        ...armedWithReminder(ScheduleType.Standard, name, '2026-06-21', list21),
      });
    }
  );
});

describe('a Last Third before and at 00:00', () => {
  it.each([
    { when: 'at 23:00 BST, before 00:00', magrib: '17:00', fajr: '02:00', lastThird: '2026-06-20T22:00:00.000Z' },
    { when: 'at 00:00 BST', magrib: '18:00', fajr: '03:00', lastThird: '2026-06-20T23:00:00.000Z' },
  ])('arms the 21 June list Last Third $when under that list day', async ({ magrib, fajr, lastThird }) => {
    jest.setSystemTime(new Date('2026-06-20T19:00:00.000Z'));
    // 19 and 22 June are not stored, so only list 21 has a night to arm
    storeDays({
      '2026-06-20': ['02:40', '04:43', '13:02', '15:00', magrib, '19:00'],
      '2026-06-21': [fajr, '04:43', '13:02', '15:00', '19:00', '20:00'],
    });
    enable(ScheduleType.Extra, 'Last Third', 5);

    await rescheduleAllNotifications();

    expect(triggers()).toEqual(armedWithReminder(ScheduleType.Extra, 'Last Third', '2026-06-21', lastThird));
  });
});

describe('a Fajr just after 00:00', () => {
  it.each([
    ['00:00', '2026-06-20T23:00:00.000Z'],
    ['00:10', '2026-06-20T23:10:00.000Z'],
    ['00:19', '2026-06-20T23:19:00.000Z'],
    ['00:20', '2026-06-20T23:20:00.000Z'],
  ])('arms a Fajr at %s for the 21 June list at %s, never shifted a day', async (fajr, instant) => {
    jest.setSystemTime(new Date('2026-06-20T20:00:00.000Z'));
    // List 20's Fajr at 00:30 BST is already past
    storeDays({
      '2026-06-20': ['00:30', '02:55', '13:00', '17:30', '23:28', '23:52'],
      '2026-06-21': [fajr, '02:55', '13:00', '17:30', '23:30', '23:54'],
    });
    enable(ScheduleType.Standard, 'Fajr', 5);

    await rescheduleAllNotifications();

    expect(triggers()).toEqual(armedWithReminder(ScheduleType.Standard, 'Fajr', '2026-06-21', instant));
  });
});
