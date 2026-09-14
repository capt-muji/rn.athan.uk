/**
 * Extras lists whose Midnight falls exactly on 00:00, and the lists either side of them
 *
 * London's real October nights open the 17 and 18 October lists at 00:00:00 and the 19 October list a
 * minute earlier, at 23:59 on the 18th. A row exactly at 00:00 reads the same day whether it is filed by
 * the day its night leads into or by the calendar day it falls on, and each 23:59 Midnight comes from a
 * midpoint of 23:59:30 that reads 00:00 once rounded instead of floored. Either break moves only the 23:59
 * Midnights: the 19 and 20 October lists show both, and the 18 October list shows only the first, when the
 * 19th's Midnight joins it.
 *
 * Expected instants are literals worked out independently (Python's zoneinfo), never by the app's own
 * time helpers.
 */

import { formatInTimeZone } from 'date-fns-tz';

import { createPrayerSequence, getPrayerForDate, transformApiData } from '@/shared/prayer';
import { type ISingleApiResponseTransformed, type Prayer, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';

jest.mock('@/stores/database', () => ({ getPrayerByDateString: jest.fn() }));

const stored = new Map<string, ISingleApiResponseTransformed>();

const useRecords = (records: ISingleApiResponseTransformed[]) => {
  stored.clear();
  for (const record of records) stored.set(record.date, record);
};

beforeEach(() => {
  (Database.getPrayerByDateString as jest.Mock).mockImplementation((date: string) => stored.get(date) ?? null);
});

/** A stored day from API times, with Suhoor, Duha and Istijaba derived exactly as the app does */
const day = (date: string, fajr: string, sunrise: string, dhuhr: string, asr: string, magrib: string, isha: string) =>
  transformApiData({ city: 'london', times: { [date]: { fajr, sunrise, dhuhr, asr, magrib, isha } } })[0];

/** Several days' lists as one sequence, exactly as the app builds it */
const sequenceFor = (type: ScheduleType, firstDate: string, dayCount: number): Prayer[] =>
  createPrayerSequence(type, new Date(`${firstDate}T12:00:00Z`), dayCount).prayers;

/** A row as the screen and the alarms see it: its list day, name, instant and clock reading */
const shown = (row: Prayer) => [row.belongsToDate, row.english, row.datetime?.toISOString() ?? null, row.time];

// Real London times from londonprayertimes.com for 2026
const OCTOBER = [
  day('2026-10-16', '05:51', '07:23', '12:51', '15:31', '18:08', '19:31'),
  day('2026-10-17', '05:52', '07:25', '12:51', '15:30', '18:06', '19:29'),
  day('2026-10-18', '05:54', '07:27', '12:51', '15:28', '18:04', '19:27'),
  day('2026-10-19', '05:55', '07:28', '12:51', '15:26', '18:02', '19:25'),
  day('2026-10-20', '05:57', '07:30', '12:50', '15:25', '18:00', '19:23'),
];

describe('opens the 17 and 18 October lists at exactly 00:00:00 and the 19 October list at 23:59 on the 18th', () => {
  beforeEach(() => useRecords(OCTOBER));

  // [list day, Midnight instant, its clock reading, Last Third instant, its clock reading]
  it.each([
    ['2026-10-17', '2026-10-16T23:00:00.000Z', '00:00', '2026-10-17T00:57:00.000Z', '01:57'],
    ['2026-10-18', '2026-10-17T23:00:00.000Z', '00:00', '2026-10-18T00:58:00.000Z', '01:58'],
    ['2026-10-19', '2026-10-18T22:59:00.000Z', '23:59', '2026-10-19T00:58:00.000Z', '01:58'],
    ['2026-10-20', '2026-10-19T22:59:00.000Z', '23:59', '2026-10-20T00:58:00.000Z', '01:58'],
  ])(
    'list %s opens with Midnight at %s (%s), then Last Third at %s (%s)',
    (date, midnightAt, midnightTime, lastThirdAt, lastThirdTime) => {
      const list = sequenceFor(ScheduleType.Extra, '2026-10-17', 4).filter((row) => row.belongsToDate === date);

      expect(list.map((row) => row.english)).toEqual(['Midnight', 'Last Third', 'Suhoor', 'Duha']);
      expect(list.slice(0, 2).map(shown)).toEqual([
        [date, 'Midnight', midnightAt, midnightTime],
        [date, 'Last Third', lastThirdAt, lastThirdTime],
      ]);
      // The alarms read one row at a time, from the day's own records rather than the sequence
      expect(getPrayerForDate(ScheduleType.Extra, 'Midnight', date)).toEqual(list[0]);
      expect(getPrayerForDate(ScheduleType.Extra, 'Last Third', date)).toEqual(list[1]);
    }
  );

  it("files the five rows that fall on 18 October under their own lists: the 18th's four from Midnight at 00:00:00, and the 19th's Midnight at 23:59", () => {
    const onTheEighteenth = sequenceFor(ScheduleType.Extra, '2026-10-17', 4).filter(
      (row) => row.datetime !== null && formatInTimeZone(row.datetime, 'Europe/London', 'yyyy-MM-dd') === '2026-10-18'
    );

    expect(onTheEighteenth.map(shown)).toEqual([
      ['2026-10-18', 'Midnight', '2026-10-17T23:00:00.000Z', '00:00'],
      ['2026-10-18', 'Last Third', '2026-10-18T00:58:00.000Z', '01:58'],
      ['2026-10-18', 'Suhoor', '2026-10-18T04:34:00.000Z', '05:34'],
      ['2026-10-18', 'Duha', '2026-10-18T06:47:00.000Z', '07:47'],
      ['2026-10-19', 'Midnight', '2026-10-18T22:59:00.000Z', '23:59'],
    ]);
  });
});
