/**
 * Night times of the Extras list (ISSUES #29)
 *
 * The Islamic date begins at Magrib and a night belongs to the day that follows it,
 * so the Extras list for day D opens with the night from D−1's Magrib to D's Fajr.
 * Its Midnight and Last Third must be that night's, measured in real elapsed time
 * (the clock-change nights included), and the list, the countdown and every
 * notification read the same instant (getPrayerForDate).
 *
 * Expected instants come from an independent reference below (plain UTC arithmetic
 * and London's clock-change rule), not from the app's own time helpers.
 */

import { formatInTimeZone } from 'date-fns-tz';

import { MOCK_DATA_FULL } from '@/mocks/full';
import { TIME_ADJUSTMENTS } from '@/shared/constants';
import {
  canonicalDisplayOrder,
  createPrayerSequence,
  getNightTimesForDay,
  getPrayerForDate,
  transformApiData,
} from '@/shared/prayer';
import { type ISingleApiResponseTransformed, type Prayer, type ReadablePrayer, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';

jest.mock('@/stores/database', () => ({ getPrayerByDateString: jest.fn() }));

// =============================================================================
// INDEPENDENT REFERENCE: UTC arithmetic and London's clock-change rule
// =============================================================================

const MINUTE = 60_000;

/** Day of the month of the last Sunday (month is 0-11) */
const lastSunday = (year: number, month: number): number => {
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  return lastDay.getUTCDate() - lastDay.getUTCDay();
};

/** London is on summer time from 01:00 UTC on the last Sunday of March to 01:00 UTC on the last Sunday of October */
const isSummerTime = (instant: number): boolean => {
  const year = new Date(instant).getUTCFullYear();
  return instant >= Date.UTC(year, 2, lastSunday(year, 2), 1) && instant < Date.UTC(year, 9, lastSunday(year, 9), 1);
};

/** A stored time the reference is about to do arithmetic on; the fixtures it reads are all readable */
const clock = (time: string | null): string => {
  if (time === null) throw new Error('the reference was handed an unreadable time');
  return time;
};

/** The instant of a London clock reading (prayer times never fall in a clock-change hour) */
const londonInstant = (date: string, time: string): number => {
  const [year, month, dayOfMonth] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const readAsGmt = Date.UTC(year, month - 1, dayOfMonth, hours, minutes);
  const readAsBst = readAsGmt - 60 * MINUTE;
  return isSummerTime(readAsBst) ? readAsBst : readAsGmt;
};

/** London clock reading (HH:mm) of an instant */
const londonTime = (instant: number): string =>
  new Date(instant + (isSummerTime(instant) ? 60 * MINUTE : 0)).toISOString().slice(11, 16);

/** The night leading into a day: the previous day's Magrib to this day's Fajr, in real time */
const referenceNight = (previousDay: ISingleApiResponseTransformed, day: ISingleApiResponseTransformed) => {
  const start = londonInstant(previousDay.date, clock(previousDay.magrib));
  const end = londonInstant(day.date, clock(day.fajr));
  const floorToMinute = (ms: number) => Math.floor(ms / MINUTE) * MINUTE;

  return {
    start,
    end,
    midnight: floorToMinute(start + (end - start) / 2),
    lastThird: floorToMinute(start + ((end - start) * 2) / 3 + TIME_ADJUSTMENTS.lastThird * MINUTE),
  };
};

// =============================================================================
// STORAGE (mocked) AND HELPERS
// =============================================================================

const stored = new Map<string, ISingleApiResponseTransformed>();

const useRecords = (records: ISingleApiResponseTransformed[]) => {
  stored.clear();
  for (const record of records) stored.set(record.date, record);
};

beforeEach(() => {
  (Database.getPrayerByDateString as jest.Mock).mockImplementation((date: string) => stored.get(date) ?? null);
});

/** One day's list exactly as the app builds it */
const listFor = (type: ScheduleType, date: string): Prayer[] =>
  createPrayerSequence(type, new Date(`${date}T12:00:00Z`), 1).prayers;

/** Several days' lists as one sequence, exactly as the app builds it */
const sequenceFor = (type: ScheduleType, firstDate: string, dayCount: number): Prayer[] =>
  createPrayerSequence(type, new Date(`${firstDate}T12:00:00Z`), dayCount).prayers;

const rowOf = (list: Prayer[], english: string): Prayer => {
  const prayer = list.find((candidate) => candidate.english === english);
  if (!prayer) throw new Error(`${english} is not on the list`);
  return prayer;
};

/** A row the test needs a moment from; failing here names the row rather than a null dereference */
const readableRowOf = (list: Prayer[], english: string): ReadablePrayer => {
  const prayer = rowOf(list, english);
  if (prayer.datetime === null) throw new Error(`${english} has no readable time`);
  return prayer;
};

/** A row as the screen and the alarms see it: its instant, or null, and its clock reading, or null */
const shown = (row: Prayer) => [row.english, row.datetime?.toISOString() ?? null, row.time] as const;

/**
 * Readable rows that do not come strictly after the readable row before them in the sequence
 *
 * The sequence is built in list order, not sorted by time, so this is what proves the two agree
 */
const outOfTimeOrder = (prayers: Prayer[]): string[] => {
  const readable = prayers.filter((row): row is ReadablePrayer => row.datetime !== null);

  return readable.slice(1).flatMap((row, index) => {
    const before = readable[index];
    if (row.datetime > before.datetime) return [];
    return [`${row.belongsToDate} ${row.english} ${row.datetime.toISOString()} not after ${before.english}`];
  });
};

/**
 * A stored day from real API times — Suhoor, Duha and Istijaba derived exactly as the app does.
 * null is a time api/client.ts could not read
 */
const day = (
  date: string,
  fajr: string | null,
  sunrise: string | null,
  dhuhr: string | null,
  asr: string | null,
  magrib: string | null,
  isha: string | null
) => transformApiData({ city: 'london', times: { [date]: { fajr, sunrise, dhuhr, asr, magrib, isha } } })[0];

// Real London times from londonprayertimes.com for 2026
const LONDON_2026 = [
  day('2026-03-27', '04:11', '05:45', '12:11', '15:33', '18:28', '19:46'),
  day('2026-03-28', '04:09', '05:42', '12:11', '15:34', '18:30', '19:48'),
  day('2026-03-29', '05:07', '06:40', '13:10', '16:35', '19:32', '20:49'),
  day('2026-03-30', '05:05', '06:38', '13:10', '16:36', '19:34', '20:51'),
  day('2026-09-10', '04:52', '06:24', '13:03', '16:31', '19:30', '20:43'),
  day('2026-09-11', '04:54', '06:26', '13:02', '16:29', '19:28', '20:42'),
  day('2026-09-12', '04:56', '06:28', '13:02', '16:27', '19:25', '20:39'),
  day('2026-10-23', '06:00', '07:35', '12:50', '15:20', '17:54', '19:19'),
  day('2026-10-24', '06:02', '07:37', '12:50', '15:18', '17:52', '19:17'),
  day('2026-10-25', '05:04', '06:39', '11:50', '14:17', '16:50', '18:17'),
  day('2026-10-26', '05:05', '06:41', '11:50', '14:15', '16:48', '18:15'),
  day('2026-12-31', '06:26', '08:03', '12:09', '13:45', '16:04', '17:41'),
];

const on = (date: string): ISingleApiResponseTransformed => {
  const record = LONDON_2026.find((candidate) => candidate.date === date);
  if (!record) throw new Error(`${date} is not in the fixture`);
  return record;
};

// =============================================================================
// THE NIGHT EACH LIST OPENS WITH
// =============================================================================

describe('Extras night rows are the night leading into their day (real London 2026 times)', () => {
  beforeEach(() => useRecords(LONDON_2026));

  // [list day, Midnight instant, its clock reading, Last Third instant, its clock reading]
  it.each([
    ['2026-03-28', '2026-03-27T23:18:00.000Z', '23:18', '2026-03-28T00:55:00.000Z', '00:55'], // before the clocks go forward
    ['2026-03-29', '2026-03-28T23:18:00.000Z', '23:18', '2026-03-29T00:54:00.000Z', '00:54'], // clocks go forward tonight
    ['2026-03-30', '2026-03-29T23:18:00.000Z', '00:18', '2026-03-30T00:54:00.000Z', '01:54'],
    ['2026-09-11', '2026-09-10T23:12:00.000Z', '00:12', '2026-09-11T00:46:00.000Z', '01:46'], // the night of Friday
    ['2026-09-12', '2026-09-11T23:12:00.000Z', '00:12', '2026-09-12T00:46:00.000Z', '01:46'],
    ['2026-10-24', '2026-10-23T22:58:00.000Z', '23:58', '2026-10-24T00:59:00.000Z', '01:59'], // before the clocks go back
    ['2026-10-25', '2026-10-24T22:58:00.000Z', '23:58', '2026-10-25T01:00:00.000Z', '01:00'], // clocks go back tonight
    ['2026-10-26', '2026-10-25T22:57:00.000Z', '22:57', '2026-10-26T01:00:00.000Z', '01:00'],
  ])('list %s: Midnight %s (%s), Last Third %s (%s)', (date, midnightAt, midnightTime, lastThirdAt, lastThirdTime) => {
    const list = listFor(ScheduleType.Extra, date);
    const midnight = readableRowOf(list, 'Midnight');
    const lastThird = readableRowOf(list, 'Last Third');

    expect(midnight.datetime.toISOString()).toBe(midnightAt);
    expect(midnight.time).toBe(midnightTime);
    expect(lastThird.datetime.toISOString()).toBe(lastThirdAt);
    expect(lastThird.time).toBe(lastThirdTime);
    expect(midnight.belongsToDate).toBe(date);
    expect(lastThird.belongsToDate).toBe(date);
  });

  it("leaves Suhoor where it was: 20 minutes before the day's own Fajr", () => {
    expect(readableRowOf(listFor(ScheduleType.Extra, '2026-10-25'), 'Suhoor').datetime.toISOString()).toBe(
      '2026-10-25T04:44:00.000Z'
    );
    expect(readableRowOf(listFor(ScheduleType.Extra, '2026-03-29'), 'Suhoor').datetime.toISOString()).toBe(
      '2026-03-29T03:47:00.000Z'
    );
  });

  it("crosses the year boundary using the previous year's record (no correction step needed)", () => {
    useRecords([...LONDON_2026, day('2027-01-01', '06:26', '08:03', '12:09', '13:46', '16:05', '17:42')]);

    // Magrib Thu 31 Dec 2026 16:04, Fajr Fri 1 Jan 2027 06:26: a 14h 22m night
    const list = listFor(ScheduleType.Extra, '2027-01-01');
    expect(readableRowOf(list, 'Midnight').datetime.toISOString()).toBe('2026-12-31T23:15:00.000Z');
    expect(readableRowOf(list, 'Last Third').datetime.toISOString()).toBe('2027-01-01T01:38:00.000Z');
    expect(rowOf(list, 'Midnight').belongsToDate).toBe('2027-01-01');
  });
});

// =============================================================================
// A NIGHT WITHOUT A MAGRIB FROM THE PROVIDER (finding 72, gap map item 1)
//
// The first stored day's night once took that day's own Magrib a day early. On the
// 3T the 29 March Last Third built that way fired 21 minutes late. No prayer time may
// be substituted (finding 70), so those rows have no time, and the night after them,
// which has both of its ends, is untouched.
// =============================================================================

describe('never builds Midnight or Last Third from a Magrib the payload did not give', () => {
  // [case, records (no day before the first), first list, the next list, its Midnight, its clock, its Last Third, its clock]
  it.each([
    [
      '1 January with no 31 December',
      [
        day('2026-01-01', '06:26', '08:03', '12:09', '13:46', '16:05', '17:42'),
        day('2026-01-02', '06:26', '08:03', '12:10', '13:47', '16:06', '17:43'),
      ],
      '2026-01-01',
      '2026-01-02',
      '2026-01-01T23:15:00.000Z',
      '23:15',
      '2026-01-02T01:39:00.000Z',
      '01:39',
    ],
    [
      '29 March, the night the clocks go forward, with no 28 March',
      [
        day('2026-03-29', '05:07', '06:40', '13:10', '16:35', '19:32', '20:49'),
        day('2026-03-30', '05:05', '06:38', '13:10', '16:36', '19:34', '20:51'),
      ],
      '2026-03-29',
      '2026-03-30',
      '2026-03-29T23:18:00.000Z',
      '00:18',
      '2026-03-30T00:54:00.000Z',
      '01:54',
    ],
  ])('%s', (_, records, firstList, nextList, midnightAt, midnightTime, lastThirdAt, lastThirdTime) => {
    useRecords(records);

    // Built the way the screen builds it (a sequence starting on the first stored day) and the way
    // the alarms read it (one row at a time): the borrowed night is gone from both
    const sequence = sequenceFor(ScheduleType.Extra, firstList, 2);
    const firstNight = sequence.filter((row) => row.belongsToDate === firstList).slice(0, 2);
    expect(firstNight.map(shown)).toEqual([
      ['Midnight', null, null],
      ['Last Third', null, null],
    ]);
    expect(firstNight.map((row) => row.belongsToDate)).toEqual([firstList, firstList]);
    expect(listFor(ScheduleType.Extra, firstList).slice(0, 2)).toEqual(firstNight);
    for (const english of ['Midnight', 'Last Third']) {
      expect(getPrayerForDate(ScheduleType.Extra, english, firstList)).toEqual({
        type: ScheduleType.Extra,
        english,
        arabic: rowOf(firstNight, english).arabic,
        datetime: null,
        time: null,
        belongsToDate: firstList,
      });
    }

    // The night that has both ends from the provider keeps its exact instants
    const next = sequence.filter((row) => row.belongsToDate === nextList);
    expect(shown(rowOf(next, 'Midnight'))).toEqual(['Midnight', midnightAt, midnightTime]);
    expect(shown(rowOf(next, 'Last Third'))).toEqual(['Last Third', lastThirdAt, lastThirdTime]);
    expect(getPrayerForDate(ScheduleType.Extra, 'Midnight', nextList)).toEqual(rowOf(next, 'Midnight'));

    // Only the night has no time: Suhoor and Duha come from the day's own record
    expect(sequence.filter((row) => row.datetime === null)).toHaveLength(2);
  });

  it('keeps the night rows unreadable on a list that follows a day missing from storage', () => {
    // Gap map item 11: 14 September is not stored. A borrowed Magrib put these rows at
    // 2026-09-14T23:09Z and 2026-09-15T00:46Z
    useRecords([
      day('2026-09-13', '04:57', '06:29', '13:02', '16:26', '19:23', '20:37'),
      day('2026-09-15', '05:00', '06:32', '13:01', '16:23', '19:18', '20:33'),
    ]);

    expect(listFor(ScheduleType.Extra, '2026-09-15').map(shown)).toEqual([
      ['Midnight', null, null],
      ['Last Third', null, null],
      ['Suhoor', '2026-09-15T03:40:00.000Z', '04:40'],
      ['Duha', '2026-09-15T05:52:00.000Z', '06:52'],
    ]);
  });
});

describe('getNightTimesForDay', () => {
  it("pairs the previous day's Magrib with this day's Fajr", () => {
    expect(getNightTimesForDay(on('2026-09-11'), on('2026-09-10'))).toEqual({
      midnight: new Date('2026-09-10T23:12:00.000Z'),
      lastThird: new Date('2026-09-11T00:46:00.000Z'),
    });
  });

  // Each of these once came back as a night built from the day's own Magrib a day early,
  // or from arithmetic on a missing time. The records are built inside the test so that a
  // transform that cannot take a null fails this case alone, not the whole file at collection
  it.each([
    ['the day before is not stored', () => [on('2026-09-11'), null]],
    ['the record handed over is the day after', () => [on('2026-09-11'), on('2026-09-12')]],
    ['the record handed over is two days before', () => [on('2026-09-12'), on('2026-09-10')]],
    [
      "the day before's Magrib could not be read",
      () => [on('2026-09-11'), day('2026-09-10', '04:52', '06:24', '13:03', '16:31', null, '20:43')],
    ],
    [
      "the day's own Fajr could not be read",
      () => [day('2026-09-11', null, '06:26', '13:02', '16:29', '19:28', '20:42'), on('2026-09-10')],
    ],
  ] as [string, () => [ISingleApiResponseTransformed, ISingleApiResponseTransformed | null]][])(
    'has no night when %s',
    (_, records) => {
      const [dayRecord, previousDay] = records();
      expect(getNightTimesForDay(dayRecord, previousDay)).toBeNull();
    }
  );
});

// =============================================================================
// A BROKEN FRIDAY MAGRIB (gap map item 22, spec R3)
// =============================================================================

describe("a Friday Magrib the provider sent as '-----'", () => {
  // api/client.ts marks the value null before anything is stored
  const october = (fridayMagrib: string | null) => [
    day('2026-10-16', '05:51', '07:23', '12:51', '15:31', fridayMagrib, '19:31'),
    day('2026-10-17', '05:52', '07:25', '12:51', '15:30', '18:06', '19:29'),
    day('2026-10-18', '05:54', '07:27', '12:51', '15:28', '18:04', '19:27'),
  ];

  // [Friday Magrib, Friday's Magrib row, Friday's Istijaba, Saturday's Midnight, Saturday's Last Third]
  it.each([
    [null, [null, null], [null, null], [null, null], [null, null]],
    [
      '18:08',
      ['2026-10-16T17:08:00.000Z', '18:08'],
      ['2026-10-16T16:08:00.000Z', '17:08'],
      ['2026-10-16T23:00:00.000Z', '00:00'],
      ['2026-10-17T00:57:00.000Z', '01:57'],
    ],
  ])(
    "with Magrib %s, only Friday's Magrib and Istijaba and Saturday's night follow it",
    (fridayMagrib, magrib, istijaba, saturdayMidnight, saturdayLastThird) => {
      useRecords(october(fridayMagrib));

      expect(listFor(ScheduleType.Standard, '2026-10-16').map(shown)).toEqual([
        ['Fajr', '2026-10-16T04:51:00.000Z', '05:51'],
        ['Sunrise', '2026-10-16T06:23:00.000Z', '07:23'],
        ['Dhuhr', '2026-10-16T11:51:00.000Z', '12:51'],
        ['Asr', '2026-10-16T14:31:00.000Z', '15:31'],
        ['Magrib', ...magrib],
        ['Isha', '2026-10-16T18:31:00.000Z', '19:31'],
      ]);
      // Friday's own night has no time either way: 15 October is not stored
      expect(listFor(ScheduleType.Extra, '2026-10-16').map(shown)).toEqual([
        ['Midnight', null, null],
        ['Last Third', null, null],
        ['Suhoor', '2026-10-16T04:31:00.000Z', '05:31'],
        ['Duha', '2026-10-16T06:43:00.000Z', '07:43'],
        ['Istijaba', ...istijaba],
      ]);
      expect(listFor(ScheduleType.Extra, '2026-10-17').map(shown)).toEqual([
        ['Midnight', ...saturdayMidnight],
        ['Last Third', ...saturdayLastThird],
        ['Suhoor', '2026-10-17T04:32:00.000Z', '05:32'],
        ['Duha', '2026-10-17T06:45:00.000Z', '07:45'],
      ]);
      expect(listFor(ScheduleType.Standard, '2026-10-17').map(shown)).toEqual([
        ['Fajr', '2026-10-17T04:52:00.000Z', '05:52'],
        ['Sunrise', '2026-10-17T06:25:00.000Z', '07:25'],
        ['Dhuhr', '2026-10-17T11:51:00.000Z', '12:51'],
        ['Asr', '2026-10-17T14:30:00.000Z', '15:30'],
        ['Magrib', '2026-10-17T17:06:00.000Z', '18:06'],
        ['Isha', '2026-10-17T18:29:00.000Z', '19:29'],
      ]);
      // Sunday's night runs from Saturday's Magrib, which the provider gave
      expect(listFor(ScheduleType.Extra, '2026-10-18').slice(0, 2).map(shown)).toEqual([
        ['Midnight', '2026-10-17T23:00:00.000Z', '00:00'],
        ['Last Third', '2026-10-18T00:58:00.000Z', '01:58'],
      ]);
      expect(getPrayerForDate(ScheduleType.Extra, 'Istijaba', '2026-10-16')).toEqual(
        rowOf(listFor(ScheduleType.Extra, '2026-10-16'), 'Istijaba')
      );
      expect(getPrayerForDate(ScheduleType.Extra, 'Last Third', '2026-10-17')).toEqual(
        rowOf(listFor(ScheduleType.Extra, '2026-10-17'), 'Last Third')
      );
    }
  );
});

describe('getPrayerForDate', () => {
  beforeEach(() => useRecords(LONDON_2026));

  it('returns the row without a time, not null, when the day is not stored', () => {
    expect(getPrayerForDate(ScheduleType.Extra, 'Midnight', '2026-05-01')).toEqual({
      type: ScheduleType.Extra,
      english: 'Midnight',
      arabic: rowOf(listFor(ScheduleType.Extra, '2026-05-01'), 'Midnight').arabic,
      datetime: null,
      time: null,
      belongsToDate: '2026-05-01',
    });
    expect(getPrayerForDate(ScheduleType.Standard, 'Isha', '2026-05-01')).toMatchObject({ datetime: null, time: null });
  });

  it('keeps Istijaba on a Friday that is not stored, and off the Saturday after it', () => {
    // 1 May 2026 is a Friday
    expect(getPrayerForDate(ScheduleType.Extra, 'Istijaba', '2026-05-01')).toMatchObject({
      english: 'Istijaba',
      datetime: null,
      time: null,
      belongsToDate: '2026-05-01',
    });
    expect(getPrayerForDate(ScheduleType.Extra, 'Istijaba', '2026-05-02')).toBeNull();
  });

  it("returns null for Istijaba outside Fridays (not on that day's list)", () => {
    expect(getPrayerForDate(ScheduleType.Extra, 'Istijaba', '2026-09-12')).toBeNull();
  });

  it('returns Istijaba on Fridays, an hour before Magrib', () => {
    const istijaba = getPrayerForDate(ScheduleType.Extra, 'Istijaba', '2026-09-11');
    expect(istijaba?.time).toBe('18:28');
    expect(istijaba?.datetime?.toISOString()).toBe('2026-09-11T17:28:00.000Z');
  });

  it('gives a night row its night-before instant, still keyed to its own list day', () => {
    const midnight = getPrayerForDate(ScheduleType.Extra, 'Midnight', '2026-10-24');
    expect(midnight?.datetime?.toISOString()).toBe('2026-10-23T22:58:00.000Z');
    expect(midnight?.time).toBe('23:58');
    expect(midnight?.belongsToDate).toBe('2026-10-24');
  });
});

describe('an Isha after 00:00 (high latitudes in summer; the app goes global in v2.0)', () => {
  it("stays on its own day's list at the next calendar day's instant, and getPrayerForDate agrees", () => {
    useRecords([day('2026-06-20', '02:40', '04:43', '13:02', '17:20', '21:25', '00:30')]);

    const isha = readableRowOf(listFor(ScheduleType.Standard, '2026-06-20'), 'Isha');
    expect(isha.datetime.toISOString()).toBe('2026-06-20T23:30:00.000Z'); // 00:30 BST on 21 June
    expect(isha.belongsToDate).toBe('2026-06-20');
    expect(getPrayerForDate(ScheduleType.Standard, 'Isha', '2026-06-20')).toEqual(isha);
  });
});

// =============================================================================
// A WHOLE REAL YEAR (mocks/full.ts: London 2024, both clock changes)
// =============================================================================

describe('every day of a real London year (2024)', () => {
  const records = transformApiData(MOCK_DATA_FULL);
  const dates = records.map((record) => record.date).sort();
  const byDate = new Map(records.map((record) => [record.date, record]));
  const recordOn = (date: string): ISingleApiResponseTransformed => {
    const record = byDate.get(date);
    if (!record) throw new Error(`${date} missing from mocks/full.ts`);
    return record;
  };
  const isFriday = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay() === 5;

  beforeEach(() => useRecords(records));

  it('gives every Extras list the Midnight and Last Third of the night leading into it', () => {
    const mismatches: string[] = [];

    for (let index = 1; index < dates.length; index++) {
      const date = dates[index];
      const night = referenceNight(recordOn(dates[index - 1]), recordOn(date));
      const list = listFor(ScheduleType.Extra, date);

      for (const [english, instant] of [
        ['Midnight', night.midnight],
        ['Last Third', night.lastThird],
      ] as const) {
        const row = rowOf(list, english);
        if (row.datetime?.getTime() !== instant) {
          mismatches.push(
            `${date} ${english} at ${row.datetime?.toISOString()}, not ${new Date(instant).toISOString()}`
          );
        }
        if (row.time !== londonTime(instant)) mismatches.push(`${date} ${english} reads ${row.time}`);
        if (row.belongsToDate !== date) mismatches.push(`${date} ${english} belongs to ${row.belongsToDate}`);
      }

      const inOrder = night.start < night.midnight && night.midnight < night.lastThird && night.lastThird < night.end;
      if (!inOrder) mismatches.push(`${date} night out of order`);
    }

    expect(dates).toHaveLength(366);
    expect(mismatches).toEqual([]);
  });

  it('leaves every other row on its own stored time and day (Suhoor, Duha, Istijaba and all six prayers)', () => {
    const mismatches: string[] = [];

    for (const date of dates.slice(1)) {
      const record = recordOn(date);
      for (const type of [ScheduleType.Standard, ScheduleType.Extra]) {
        for (const row of listFor(type, date)) {
          if (row.english === 'Midnight' || row.english === 'Last Third') continue;
          const time = clock(record[row.english.toLowerCase() as keyof ISingleApiResponseTransformed]);
          const exact = row.time === time && row.datetime?.getTime() === londonInstant(date, time);
          if (!exact || row.belongsToDate !== date) mismatches.push(`${type} ${date} ${row.english}`);
        }
      }
    }

    expect(mismatches).toEqual([]);
  });

  it('keeps each Extras list in display order: Midnight, Last Third, Suhoor, Duha, then Istijaba on Fridays', () => {
    const mismatches: string[] = [];

    for (const date of dates.slice(1)) {
      const list = listFor(ScheduleType.Extra, date);
      const expected = ['Midnight', 'Last Third', 'Suhoor', 'Duha', ...(isFriday(date) ? ['Istijaba'] : [])];
      const names = list.map((row) => row.english);
      const order = canonicalDisplayOrder(list, ScheduleType.Extra);
      const identity = expected.map((_, index) => index);
      if (names.join() !== expected.join() || order.join() !== identity.join()) {
        mismatches.push(`${date}: ${names.join(', ')}`);
      }
    }

    expect(mismatches).toEqual([]);
  });

  // The sequence is no longer sorted by time: a row without one could not be placed. It is built
  // day by day in list order, which is only safe while that is also time order for every row
  // that has a time. The first day is included: its night has no Magrib from the provider.
  it.each([ScheduleType.Standard, ScheduleType.Extra])(
    'builds the %s year day by day in list order, and that order is time order for every readable row',
    (type) => {
      const prayers = sequenceFor(type, dates[0], dates.length);
      const namesOn = (date: string) =>
        type === ScheduleType.Standard
          ? ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Magrib', 'Isha']
          : ['Midnight', 'Last Third', 'Suhoor', 'Duha', ...(isFriday(date) ? ['Istijaba'] : [])];

      expect(dates[0]).toBe('2024-01-01');
      expect(prayers.map((row) => `${row.belongsToDate} ${row.english}`)).toEqual(
        dates.flatMap((date) => namesOn(date).map((english) => `${date} ${english}`))
      );
      expect(
        prayers.filter((row) => row.datetime === null).map((row) => `${row.belongsToDate} ${row.english}`)
      ).toEqual(type === ScheduleType.Extra ? ['2024-01-01 Midnight', '2024-01-01 Last Third'] : []);
      expect(outOfTimeOrder(prayers)).toEqual([]);
    }
  );

  it('getPrayerForDate returns exactly the row the list shows, for every prayer on every day', () => {
    const mismatches: string[] = [];

    for (const date of dates) {
      for (const type of [ScheduleType.Standard, ScheduleType.Extra]) {
        for (const row of listFor(type, date)) {
          const single = getPrayerForDate(type, row.english, date);
          const same =
            single !== null &&
            single.datetime?.getTime() === row.datetime?.getTime() &&
            single.time === row.time &&
            single.belongsToDate === row.belongsToDate;
          if (!same) mismatches.push(`${type} ${date} ${row.english}`);
        }
      }
    }

    expect(mismatches).toEqual([]);
  });
});

// =============================================================================
// MAGRIB PAST MIDNIGHT (finding 44)
//
// Above roughly 60N sunset itself falls after midnight — Reykjavik on 21 June is
// 00:04 — and a provider still files that under the previous date. Everything here
// is inert for London, whose Magrib never reaches the small hours, so these cases
// also serve as the proof that the rule changed nothing for the shipped city.
// =============================================================================

describe('a Magrib that falls after midnight', () => {
  // Sunset 00:04 filed under 21 June, a short polar night, Fajr 01:30 on 22 June
  // Isha must follow Magrib: at 64N in June there is no astronomical twilight, so Isha comes
  // from a high-latitude rule and lands after sunset, not 24 minutes before it. An Isha before
  // its own Magrib would also break the Standard chronological-equals-canonical invariant.
  const POLAR = [
    day('2026-06-21', '01:28', '02:55', '13:30', '17:30', '00:04', '00:28'),
    day('2026-06-22', '01:30', '02:56', '13:30', '17:30', '00:06', '00:30'),
  ];

  // The transition into the post-midnight season, where the date shift switches on
  const CROSSING_SEASON = [
    day('2026-06-09', '01:26', '02:54', '13:29', '17:29', '23:58', '23:59'),
    day('2026-06-10', '01:27', '02:54', '13:29', '17:29', '00:02', '00:28'),
    day('2026-06-11', '01:28', '02:55', '13:30', '17:30', '00:04', '00:30'),
  ];

  it('places the Magrib instant on the next calendar day, not 23h56m early', () => {
    useRecords(POLAR);

    const magrib = readableRowOf(listFor(ScheduleType.Standard, '2026-06-21'), 'Magrib');

    expect(formatInTimeZone(magrib.datetime, 'Europe/London', 'yyyy-MM-dd HH:mm')).toBe('2026-06-22 00:04');
  });

  it('keeps the night short instead of stretching it to about 26 hours', () => {
    useRecords(POLAR);

    const list = listFor(ScheduleType.Extra, '2026-06-22');
    const midnight = readableRowOf(list, 'Midnight').datetime;
    const lastThird = readableRowOf(list, 'Last Third').datetime;

    // Night runs 22 June 00:04 to 22 June 01:30: 86 minutes, midpoint 00:47
    expect(formatInTimeZone(midnight, 'Europe/London', 'yyyy-MM-dd HH:mm')).toBe('2026-06-22 00:47');
    expect(midnight.getTime()).toBeLessThan(lastThird.getTime());
  });

  it('keeps the row on its own list day, so 21 June still shows a Magrib', () => {
    useRecords(POLAR);

    const magrib = rowOf(listFor(ScheduleType.Standard, '2026-06-21'), 'Magrib');

    // datetime moves to the 22nd for the alarm; belongsToDate must not, or the row
    // leaves the 21st's list and appears on the 22nd's alongside that day's own Magrib
    expect(magrib.belongsToDate).toBe('2026-06-21');
  });

  it('keeps Islamic Midnight on the correct side of noon', () => {
    useRecords(POLAR);

    const midnight = readableRowOf(listFor(ScheduleType.Extra, '2026-06-22'), 'Midnight');

    expect(Number(formatInTimeZone(midnight.datetime, 'Europe/London', 'HH'))).toBeLessThan(12);
  });

  // List order stands in for time order everywhere a sequence is read, so the high-latitude
  // shapes where rows cross 00:00 must keep it too
  it.each([
    ['a polar night with Magrib after 00:00', POLAR, '2026-06-21'],
    ['the season the Magrib crossing begins', CROSSING_SEASON, '2026-06-09'],
  ])('keeps list order and time order the same through %s', (_, records, firstDate) => {
    useRecords(records);

    for (const type of [ScheduleType.Standard, ScheduleType.Extra]) {
      expect(outOfTimeOrder(sequenceFor(type, firstDate, records.length))).toEqual([]);
    }
  });

  // Istijaba hangs off Magrib, so it has to follow Magrib across the shift. Deriving it from
  // the clock string only worked below 01:00, where adjustTime's wrap past midnight happened
  // to cancel the date shift; at 01:47 (Nome, Alaska) it left Istijaba 25 hours early. The
  // table is the point — a single fixture at 00:08 passes while the defect is present.
  it.each(['00:04', '00:47', '01:47', '02:50', '19:25'])(
    'keeps Istijaba exactly an hour before a Magrib at %s',
    (magribTime) => {
      // 2026-06-26 is a Friday, the only day Istijaba is on the list
      useRecords([
        day('2026-06-26', '01:32', '02:58', '13:31', '17:31', magribTime, '00:32'),
        day('2026-06-27', '01:34', '02:59', '13:31', '17:31', magribTime, '00:34'),
      ]);

      const istijaba = readableRowOf(listFor(ScheduleType.Extra, '2026-06-26'), 'Istijaba');
      const magrib = readableRowOf(listFor(ScheduleType.Standard, '2026-06-26'), 'Magrib');

      expect(magrib.datetime.getTime() - istijaba.datetime.getTime()).toBe(60 * MINUTE);
      expect(istijaba.belongsToDate).toBe('2026-06-26');
    }
  );

  // The owner's own two cases, in their own numbers (2026-09-13). The gap assertion above
  // proves the rule without ever showing it, and "one hour before Magrib" is the part of this
  // finding that got misread — so state the answer rather than imply it. Crossing back over
  // midnight is not a special case in the code: subtracting from an instant carries the date,
  // which is the entire reason the clock-string version had to go.
  it.each([
    // [Magrib clock, Isha clock, where Magrib lands, where Istijaba lands]
    ['01:20', '01:44', '2026-06-27 01:20', '2026-06-27 00:20'], // same night, no crossing
    ['00:40', '01:04', '2026-06-27 00:40', '2026-06-26 23:40'], // Istijaba crosses back
  ])('puts Istijaba an hour before a Magrib at %s, date and all', (magribTime, ishaTime, magribAt, istijabaAt) => {
    // 2026-06-26 is a Friday, the only day Istijaba is on the list
    useRecords([
      day('2026-06-26', '01:32', '02:58', '13:31', '17:31', magribTime, ishaTime),
      day('2026-06-27', '01:34', '02:59', '13:31', '17:31', magribTime, ishaTime),
    ]);

    const istijaba = readableRowOf(listFor(ScheduleType.Extra, '2026-06-26'), 'Istijaba');
    const magrib = readableRowOf(listFor(ScheduleType.Standard, '2026-06-26'), 'Magrib');

    expect(formatInTimeZone(magrib.datetime, 'Europe/London', 'yyyy-MM-dd HH:mm')).toBe(magribAt);
    expect(formatInTimeZone(istijaba.datetime, 'Europe/London', 'yyyy-MM-dd HH:mm')).toBe(istijabaAt);
    // Wherever the instant lands, the row stays on Friday's list
    expect(istijaba.belongsToDate).toBe('2026-06-26');
  });

  // getPrayerForDate is what every notification reads, so agreement with the rendered list
  // is the assertion that actually covers the alarm this finding is about
  it('gives the notification path the same instant the list shows', () => {
    useRecords(POLAR);

    const fromList = readableRowOf(listFor(ScheduleType.Standard, '2026-06-21'), 'Magrib');
    const fromNotificationPath = getPrayerForDate(ScheduleType.Standard, 'Magrib', '2026-06-21');

    expect(fromNotificationPath?.datetime?.getTime()).toBe(fromList.datetime.getTime());
  });

  it('crosses into the post-midnight season without a discontinuity', () => {
    useRecords(CROSSING_SEASON);

    const before = readableRowOf(listFor(ScheduleType.Extra, '2026-06-10'), 'Midnight').datetime;
    const after = readableRowOf(listFor(ScheduleType.Extra, '2026-06-11'), 'Midnight').datetime;

    // One day apart to the minute, not a twelve-hour jump on the crossing day
    const dayApart = after.getTime() - before.getTime();
    expect(dayApart).toBeGreaterThan(23 * 60 * MINUTE);
    expect(dayApart).toBeLessThan(25 * 60 * MINUTE);
  });
});

// =============================================================================
// SUHOOR PAST MIDNIGHT
//
// Suhoor is a clock string — Fajr minus twenty minutes through adjustTime, which is
// modular — so any Fajr under 00:20 produces a Suhoor in the 23:xx of the evening
// before while still filed under Fajr's own date. Two functions correct that as a
// pair: adjustPrayerDateForMidnightCrossing walks the instant back a day, and
// calculateBelongsToDate walks the grouping forward again.
//
// A mutation sweep found the first half of that pair had no test at all — deleting
// its branch outright left all 1,213 tests green, the same shape as finding 44,
// where one half of a matched pair was pinned and the other was not. Reachable
// above roughly 60N in high summer; inert for London, whose earliest Fajr is 02:38.
// =============================================================================

describe('a Suhoor that wraps back past midnight', () => {
  /** Two short polar nights in which Fajr is the only thing that moves */
  const nightsWithFajr = (fajr: string) => [
    day('2026-06-20', '00:30', '02:55', '13:00', '17:30', '23:28', '23:52'),
    day('2026-06-21', fajr, '02:55', '13:00', '17:30', '23:30', '23:54'),
  ];

  // Either side of the wrap: under 00:20 Suhoor lands in the previous evening, at and
  // above it stays on its own morning. The span is the point — a fixture on one side
  // alone cannot tell a working pair from a half-applied one.
  it.each(['00:00', '00:10', '00:19', '00:20', '00:45', '02:38'])(
    'stays twenty minutes before a Fajr at %s, on Fajr’s own list',
    (fajr) => {
      useRecords(nightsWithFajr(fajr));

      const suhoor = readableRowOf(listFor(ScheduleType.Extra, '2026-06-21'), 'Suhoor');
      const fajrRow = readableRowOf(listFor(ScheduleType.Standard, '2026-06-21'), 'Fajr');

      // Without the instant shift this reads about minus 24 hours: Suhoor after its own Fajr
      expect(fajrRow.datetime.getTime() - suhoor.datetime.getTime()).toBe(-TIME_ADJUSTMENTS.suhoor * MINUTE);
      // Without the grouping shift the row leaves the 21st and appears on the 20th's list
      expect(suhoor.belongsToDate).toBe('2026-06-21');
    }
  );

  // Only the nights of an hour or more: in a shorter one Suhoor, twenty minutes before Fajr,
  // comes before Last Third, two thirds of the way from Magrib, so list order cannot be time order
  it.each(['00:45', '02:38'])('keeps list order and time order the same with Fajr at %s', (fajr) => {
    useRecords(nightsWithFajr(fajr));

    for (const type of [ScheduleType.Standard, ScheduleType.Extra]) {
      expect(outOfTimeOrder(sequenceFor(type, '2026-06-20', 2))).toEqual([]);
    }
  });

  // The alarm reads getPrayerForDate, not the rendered list, so agreement between them
  // is what actually proves the notification cannot fire a day out
  it('gives the notification path the same instant the list shows', () => {
    useRecords(nightsWithFajr('00:10'));

    const fromList = readableRowOf(listFor(ScheduleType.Extra, '2026-06-21'), 'Suhoor');
    const fromNotificationPath = getPrayerForDate(ScheduleType.Extra, 'Suhoor', '2026-06-21');

    expect(fromNotificationPath?.datetime?.getTime()).toBe(fromList.datetime.getTime());
    expect(formatInTimeZone(fromList.datetime, 'Europe/London', 'yyyy-MM-dd HH:mm')).toBe('2026-06-20 23:50');
  });
});

describe('London is untouched by the Magrib midnight rule', () => {
  it('keeps a normal evening Magrib on its own date', () => {
    useRecords([
      day('2026-09-12', '04:56', '06:28', '13:02', '16:27', '19:25', '20:39'),
      day('2026-09-13', '04:57', '06:29', '13:02', '16:26', '19:23', '20:37'),
    ]);

    const magrib = readableRowOf(listFor(ScheduleType.Standard, '2026-09-12'), 'Magrib');

    expect(formatInTimeZone(magrib.datetime, 'Europe/London', 'yyyy-MM-dd HH:mm')).toBe('2026-09-12 19:25');
  });
});
