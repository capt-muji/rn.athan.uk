/**
 * A Last Third before, on or just after 00:00, on the list of the day its night leads into
 *
 * London's Last Third always falls after 00:00, so its list day and the calendar day it falls on agree all
 * year and cannot show which of the two the row is filed by. A short night, the shape high latitudes bring
 * in summer, puts it in the evening before, where they part.
 *
 * Expected instants are literals worked out independently (Python's zoneinfo), never by the app's own
 * time helpers.
 */

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

describe('places a Last Third before and at 00:00 on its own list', () => {
  /** Only Magrib on 20 June and Fajr on 21 June move, and the night between them is always nine hours */
  const shortNight = (magrib: string, fajr: string) => [
    day('2026-06-20', '02:40', '04:43', '13:02', '15:00', magrib, '19:00'),
    day('2026-06-21', fajr, '04:43', '13:02', '15:00', '19:00', '20:00'),
  ];

  // [Magrib on 20 June, Fajr on 21 June, Midnight instant, its clock reading, Last Third instant, its clock reading]
  it.each([
    ['17:00', '02:00', '2026-06-20T20:30:00.000Z', '21:30', '2026-06-20T22:00:00.000Z', '23:00'],
    ['17:59', '02:59', '2026-06-20T21:29:00.000Z', '22:29', '2026-06-20T22:59:00.000Z', '23:59'],
    ['18:00', '03:00', '2026-06-20T21:30:00.000Z', '22:30', '2026-06-20T23:00:00.000Z', '00:00'],
    ['18:01', '03:01', '2026-06-20T21:31:00.000Z', '22:31', '2026-06-20T23:01:00.000Z', '00:01'],
  ])(
    'Magrib %s and Fajr %s put Midnight at %s (%s) and Last Third at %s (%s) on the 21 June list',
    (magrib, fajr, midnightAt, midnightTime, lastThirdAt, lastThirdTime) => {
      useRecords(shortNight(magrib, fajr));
      const sequence = sequenceFor(ScheduleType.Extra, '2026-06-20', 2);
      const nightRows = sequence.filter((row) => row.english === 'Midnight' || row.english === 'Last Third');

      // 19 June is not stored, so the 20 June list has no night of its own: a time there can only be the 21st's
      expect(nightRows.map(shown)).toEqual([
        ['2026-06-20', 'Midnight', null, null],
        ['2026-06-20', 'Last Third', null, null],
        ['2026-06-21', 'Midnight', midnightAt, midnightTime],
        ['2026-06-21', 'Last Third', lastThirdAt, lastThirdTime],
      ]);
      // The alarms read one row at a time, from the day's own records rather than the sequence
      expect(getPrayerForDate(ScheduleType.Extra, 'Midnight', '2026-06-21')).toEqual(nightRows[2]);
      expect(getPrayerForDate(ScheduleType.Extra, 'Last Third', '2026-06-21')).toEqual(nightRows[3]);
    }
  );
});
