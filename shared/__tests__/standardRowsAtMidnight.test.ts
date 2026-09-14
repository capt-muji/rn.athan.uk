/**
 * An Isha or Magrib either side of 00:00 and at the 06:00 cutoff stays on the list of its own record
 *
 * Below 06:00 these two rows are the next calendar day's moment, and one function moves the moment while
 * another keeps the list day. 23:59 and 06:00 are the nearest readings either side that must not move, and
 * 00:00 and 05:59 the first and last that must, so a cutoff an hour or a minute out, or either half of the
 * pair on its own, puts a row here at the wrong moment or on the wrong list.
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

type CrossingRow = 'Isha' | 'Magrib';

describe('keeps a Standard row on its own list at the midnight and 06:00 boundaries', () => {
  /** The same record on 20 and 21 June, so the 21st shows the rule once more a day later */
  const twoDays = (english: CrossingRow, time: string) =>
    ['2026-06-20', '2026-06-21'].map((date) =>
      english === 'Isha'
        ? day(date, '02:40', '04:43', '13:02', '17:20', '21:25', time)
        : day(date, '01:30', '02:55', '13:30', '17:30', time, '00:30')
    );

  // [clock reading, the 20 June row's instant, the London date that instant falls on, the 21 June row's instant]
  const READINGS: [string, string, string, string][] = [
    ['23:59', '2026-06-20T22:59:00.000Z', '2026-06-20', '2026-06-21T22:59:00.000Z'],
    ['00:00', '2026-06-20T23:00:00.000Z', '2026-06-21', '2026-06-21T23:00:00.000Z'],
    ['00:01', '2026-06-20T23:01:00.000Z', '2026-06-21', '2026-06-21T23:01:00.000Z'],
    ['05:59', '2026-06-21T04:59:00.000Z', '2026-06-21', '2026-06-22T04:59:00.000Z'],
    ['06:00', '2026-06-20T05:00:00.000Z', '2026-06-20', '2026-06-21T05:00:00.000Z'],
  ];

  const CASES = (['Isha', 'Magrib'] as CrossingRow[]).flatMap((english) =>
    READINGS.map((reading): [CrossingRow, string, string, string, string] => [english, ...reading])
  );

  it.each(CASES)(
    '%s at %s is at %s, on %s by the clock, and stays on the 20 June list',
    (english, time, at20, fallsOn, at21) => {
      useRecords(twoDays(english, time));
      const rows = sequenceFor(ScheduleType.Standard, '2026-06-20', 2).filter((row) => row.english === english);

      expect(rows.map(shown)).toEqual([
        ['2026-06-20', english, at20, time],
        ['2026-06-21', english, at21, time],
      ]);
      expect(rows[0].datetime && formatInTimeZone(rows[0].datetime, 'Europe/London', 'yyyy-MM-dd')).toBe(fallsOn);
      // The alarms read one row at a time, from the day's own record rather than the sequence
      expect(getPrayerForDate(ScheduleType.Standard, english, '2026-06-20')).toEqual(rows[0]);
      expect(getPrayerForDate(ScheduleType.Standard, english, '2026-06-21')).toEqual(rows[1]);
    }
  );
});
