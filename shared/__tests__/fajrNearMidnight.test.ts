/**
 * A Fajr just after 00:00 keeps its own moment and its own list day
 *
 * Fajr is often before 06:00, the cutoff below which Isha and Magrib are read as the next calendar day's
 * moment, and Fajr never is. The first minutes after 00:00 are also where Suhoor wraps into the evening
 * before, so a rule meant for another row is most likely to reach Fajr here.
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

describe("states Fajr's own instant and list day when Fajr is near 00:00", () => {
  /** Two short nights in which only the 21 June Fajr moves */
  const nightsWithFajr = (fajr: string) => [
    day('2026-06-20', '00:30', '02:55', '13:00', '17:30', '23:28', '23:52'),
    day('2026-06-21', fajr, '02:55', '13:00', '17:30', '23:30', '23:54'),
  ];

  // [Fajr on 21 June, its instant]
  it.each([
    ['00:00', '2026-06-20T23:00:00.000Z'],
    ['00:10', '2026-06-20T23:10:00.000Z'],
    ['00:19', '2026-06-20T23:19:00.000Z'],
    ['00:20', '2026-06-20T23:20:00.000Z'],
  ])('puts a Fajr at %s on the 21 June list at %s', (fajr, at) => {
    useRecords(nightsWithFajr(fajr));
    const fajrRows = sequenceFor(ScheduleType.Standard, '2026-06-20', 2).filter((row) => row.english === 'Fajr');

    expect(fajrRows.map(shown)).toEqual([
      ['2026-06-20', 'Fajr', '2026-06-19T23:30:00.000Z', '00:30'],
      ['2026-06-21', 'Fajr', at, fajr],
    ]);
    // The alarms read one row at a time, from the day's own record rather than the sequence
    expect(getPrayerForDate(ScheduleType.Standard, 'Fajr', '2026-06-21')).toEqual(fajrRows[1]);
  });
});
