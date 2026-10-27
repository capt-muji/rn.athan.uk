import { addDays, subDays } from 'date-fns';

import { formatDateShort, readPrayerClock } from '@/shared/time';
import type { IApiResponse } from '@/shared/types';

/**
 * Mock data for testing prayer times
 *
 * MIDNIGHT PRAYER TESTING:
 * - Midnight is the midpoint of the night leading into a day: the previous
 *   day's Magrib to this day's Fajr
 * - Example: Magrib 16:14 → Fajr 05:35 (next day)
 *   Night duration: 13h 21m → Midnight ≈ 22:54
 * - Worked out when the lists are built (shared/prayer.ts getNightTimesForDay),
 *   from two consecutive days below
 * - Check Page 2 (Extras) to see Midnight as first prayer
 */

// Any hour outside the spent late evening seeds the same steady state the owner device-tests
// against: Asr one hour out, Dhuhr one hour spent (2026-10-27 ruling). The spent late evening
// (22:58-23:59) still serves the day's real static shape. Two costs accepted with the ruling:
// a download in the day's first 62 minutes anchors the -62-minute Fajr against the previous
// midnight (the steady hour returns from 01:02), and a small-hours download writes today's
// Isha inside the midnight-crossing window (shared/prayer.ts), so that row moves and the
// Maghrib handoff skips straight to tomorrow's Fajr - one skipped row, an hour of steady
// countdown in exchange.

const MINUTE = 60_000;

/** Two digits, the API's own clock format: data paths never localise digits */
const pad2 = (value: number): string => String(value).padStart(2, '0');

/** HH:mm in London, as the API sends it and the app reads it, a whole number of minutes from an instant */
export const addMinutes = (from: Date, minutesToAdd: number) => {
  const clock = readPrayerClock(new Date(from.getTime() + minutesToAdd * MINUTE));
  return `${pad2(clock.hour)}:${pad2(clock.minute)}`;
};

/**
 * Every day around the download, with TODAY's six rows seeded from it
 *
 * The whole day outside the spent late evening (22:58-23:59): Asr one hour out and Dhuhr one
 * hour spent, the owner's device-test seed (2026-10-26: a steady hour on the countdown and an
 * hour-ago prayer above it), with Maghrib and Isha a minute each behind Asr so the day still
 * rolls while you watch. The spent late evening serves the day's real static shape, all six
 * passed.
 */
const buildTimes = (downloadedAt: Date): IApiResponse['times'] => {
  const clock = readPrayerClock(downloadedAt);
  const minuteOfDay = clock.hour * 60 + clock.minute;
  const minuteFloor = new Date(Math.floor(downloadedAt.getTime() / MINUTE) * MINUTE);

  const dayBeforeYesterday = formatDateShort(subDays(downloadedAt, 2));
  const yesterday = formatDateShort(subDays(downloadedAt, 1));
  const today = formatDateShort(downloadedAt);
  const daysAhead = Array.from({ length: 10 }, (_, i) => i + 1);
  const [day1, day2, day3, day4, day5, day6, day7, day8, day9, day10] = daysAhead.map((d) =>
    formatDateShort(addDays(downloadedAt, d))
  );

  // [today]'s six rows by the download's London clock: the owner's steady-hour reseed,
  // or the spent late evening's real static shape
  const eveningRow = {
    fajr: addMinutes(minuteFloor, -62),
    sunrise: addMinutes(minuteFloor, -61),
    dhuhr: addMinutes(minuteFloor, -60),
    // Whole-minute anchors: the round-up countdown reads Asr as 1h away and Dhuhr as 1h ago
    // at any second of the hour between them
    asr: addMinutes(minuteFloor, 60),
    magrib: addMinutes(minuteFloor, 61),
    isha: addMinutes(minuteFloor, 62),
  };
  const spentRow = { fajr: '04:07', sunrise: '05:42', dhuhr: '13:04', asr: '16:56', magrib: '20:16', isha: '21:29' };
  const todayRow = minuteOfDay >= 22 * 60 + 58 ? spentRow : eveningRow;
  // The days around today carry realistic London times copied verbatim from mocks/full.ts, with
  // the API's real spring solar drift; Jamat fields are unused placeholders.
  return {
    [dayBeforeYesterday]: {
      date: dayBeforeYesterday,
      fajr: '04:10',
      sunrise: '05:44',
      dhuhr: '13:04',
      asr: '16:56',
      magrib: '20:14',
      isha: '21:27',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [yesterday]: {
      date: yesterday,
      fajr: '04:07',
      sunrise: '05:42',
      dhuhr: '13:04',
      asr: '16:56',
      magrib: '20:16',
      isha: '21:29',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [today]: {
      date: today,
      ...todayRow,
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [day1]: {
      date: day1,
      fajr: '04:03',
      sunrise: '05:38',
      dhuhr: '13:03',
      asr: '16:58',
      magrib: '20:19',
      isha: '21:31',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [day2]: {
      date: day2,
      fajr: '04:00',
      sunrise: '05:36',
      dhuhr: '13:03',
      asr: '16:58',
      magrib: '20:21',
      isha: '21:33',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [day3]: {
      date: day3,
      fajr: '04:40',
      sunrise: '06:12',
      dhuhr: '13:05',
      asr: '16:42',
      magrib: '19:47',
      isha: '20:58',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [day4]: {
      date: day4,
      fajr: '04:42',
      sunrise: '06:14',
      dhuhr: '13:05',
      asr: '16:40',
      magrib: '19:45',
      isha: '20:56',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [day5]: {
      date: day5,
      fajr: '04:44',
      sunrise: '06:16',
      dhuhr: '13:05',
      asr: '16:39',
      magrib: '19:42',
      isha: '20:54',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [day6]: {
      date: day6,
      fajr: '04:45',
      sunrise: '06:17',
      dhuhr: '13:04',
      asr: '16:37',
      magrib: '19:40',
      isha: '20:52',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [day7]: {
      date: day7,
      fajr: '04:47',
      sunrise: '06:19',
      dhuhr: '13:04',
      asr: '16:36',
      magrib: '19:38',
      isha: '20:50',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [day8]: {
      date: day8,
      fajr: '04:48',
      sunrise: '06:20',
      dhuhr: '13:04',
      asr: '16:34',
      magrib: '19:36',
      isha: '20:49',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [day9]: {
      date: day9,
      fajr: '04:50',
      sunrise: '06:22',
      dhuhr: '13:03',
      asr: '16:33',
      magrib: '19:33',
      isha: '20:46',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [day10]: {
      date: day10,
      fajr: '04:52',
      sunrise: '06:24',
      dhuhr: '13:03',
      asr: '16:31',
      magrib: '19:31',
      isha: '20:44',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
  };
};

export const MOCK_DATA_SIMPLE: IApiResponse = {
  city: 'london',
  // A getter, so every download (launch, return from the background, the background task) seeds today afresh, while
  // nothing re-seeds it as the app stays open and Asr can pass
  get times() {
    return buildTimes(new Date());
  },
};
