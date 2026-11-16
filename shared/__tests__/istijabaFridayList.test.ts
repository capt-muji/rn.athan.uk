/**
 * Istijaba on the Extras lists when Magrib falls after 00:00: Friday's list, and no other
 *
 * With Magrib at 01:20 Istijaba's instant is on Saturday, and with Magrib at 00:40 it is late on Friday. Which list it
 * belongs to is decided by the list day, never by the calendar day its instant falls on.
 */

import { createPrayerSequence, getPrayerForDate } from '@/shared/prayer';
import { minutesToRecord, toDayMinutes } from '@/shared/timetableDecode';
import { type DayRecord, ScheduleType } from '@/shared/types';
import * as Timetable from '@/stores/timetable';

jest.mock('@/stores/database', () => ({
  getItem: () => null,
  getRawItem: () => undefined,
}));

jest.mock('@/stores/timetable', () => ({ getTimetableDay: jest.fn() }));

const DAYS = ['2026-06-25', '2026-06-26', '2026-06-27', '2026-06-28'];

/** The same high-latitude times on every day, with Istijaba derived by the record's own producer */
const storeDays = (magrib: string, isha: string) => {
  const stored = new Map<string, DayRecord>();
  for (const date of DAYS) {
    const record = minutesToRecord(
      date,
      toDayMinutes({ fajr: '01:32', sunrise: '02:58', dhuhr: '13:31', asr: '17:31', magrib, isha })
    );
    stored.set(date, record);
  }
  (Timetable.getTimetableDay as jest.Mock).mockImplementation((date: string) => stored.get(date) ?? null);
};

describe("Istijaba on Friday's list when Magrib falls after 00:00", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Thursday evening, so a rule that read today's weekday instead of the list day's would find no Friday at all
    jest.setSystemTime(new Date('2026-06-25T20:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // 26 June 2026 is a Friday
  it.each([
    { magrib: '00:40', isha: '01:04', datetime: '2026-06-26T22:40:00.000Z', time: '23:40' },
    { magrib: '01:20', isha: '01:44', datetime: '2026-06-26T23:20:00.000Z', time: '00:20' },
  ])('with Magrib at $magrib, only the 26 June list has Istijaba, at $datetime', ({ magrib, isha, datetime, time }) => {
    storeDays(magrib, isha);

    expect(getPrayerForDate(ScheduleType.Extra, 'istijaba', '2026-06-25')).toBeNull();
    expect(getPrayerForDate(ScheduleType.Extra, 'istijaba', '2026-06-27')).toBeNull();
    expect(getPrayerForDate(ScheduleType.Extra, 'istijaba', '2026-06-26')).toEqual({
      type: ScheduleType.Extra,
      id: 'istijaba',
      datetime: new Date(datetime),
      time,
      belongsToDate: '2026-06-26',
    });

    const lists = createPrayerSequence(ScheduleType.Extra, new Date('2026-06-25T11:00:00.000Z'), 3).prayers;
    expect(lists.map((row) => `${row.belongsToDate} ${row.id}`)).toEqual([
      '2026-06-25 midnight',
      '2026-06-25 last third',
      '2026-06-25 suhoor',
      '2026-06-25 duha',
      '2026-06-26 midnight',
      '2026-06-26 last third',
      '2026-06-26 suhoor',
      '2026-06-26 duha',
      '2026-06-26 istijaba',
      '2026-06-27 midnight',
      '2026-06-27 last third',
      '2026-06-27 suhoor',
      '2026-06-27 duha',
    ]);
  });
});
