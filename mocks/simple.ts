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

// Simulating during 00:00-05:59: the intended midnight-crossing rules apply.
// shared/prayer.ts moves a Standard Isha in that window to TOMORROW's datetime
// (adjustPrayerDateForMidnightCrossing) and assigns it to YESTERDAY's Islamic
// day (calculateBelongsToDate) - correct for a real post-midnight Isha, but a
// night-time mock triggers both: at the Magrib->Isha handoff the countdown
// skips to the following day's Fajr and the rollover cascade fires early.
// An Isha can fall after 00:00 (high latitudes in summer; the app goes global
// in v2.0) and is handled by the rules above. The seeding below therefore never
// writes a small-hours Standard row: the evening branch caps Isha before 23:55,
// the pre-dawn branch composes a realistic day with Fajr next, and the spent
// late-evening branch serves the day's real static shape (owner ruling,
// 2026-10-16: any hour, any day, no dashes).

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
 * The evening (06:00-23:54): Asr just passed, Maghrib next about one minute out, Isha a
 * minute behind it, so the day rolls to tomorrow's real schedule inside a couple of minutes
 * (the owner's device-test reseed). The pre-dawn small hours: a realistic day with Fajr
 * next about a minute out, because a relative seed there would write impossible times
 * (an Isha at 04:32) that trip the midnight-crossing rules and dash the countdown. The
 * spent evening (23:55-23:59): the day's real static shape, all six passed.
 */
const buildTimes = (downloadedAt: Date): IApiResponse['times'] => {
  const clock = readPrayerClock(downloadedAt);
  const minuteOfDay = clock.hour * 60 + clock.minute;
  const minuteFloor = new Date(Math.floor(downloadedAt.getTime() / MINUTE) * MINUTE);
  const ceilMinute = (from: Date, minutesToAdd: number) =>
    new Date(Math.ceil((from.getTime() + minutesToAdd * MINUTE) / MINUTE) * MINUTE);

  const dayBeforeYesterday = formatDateShort(subDays(downloadedAt, 2));
  const yesterday = formatDateShort(subDays(downloadedAt, 1));
  const today = formatDateShort(downloadedAt);
  const daysAhead = Array.from({ length: 10 }, (_, i) => i + 1);
  const [day1, day2, day3, day4, day5, day6, day7, day8, day9, day10] = daysAhead.map((d) =>
    formatDateShort(addDays(downloadedAt, d))
  );

  // [today]'s six rows by the download's London clock: the owner's evening reseed, a realistic
  // pre-dawn day, or the spent late evening's real static shape
  const eveningRow = {
    fajr: addMinutes(minuteFloor, -4),
    sunrise: addMinutes(minuteFloor, -3),
    dhuhr: addMinutes(minuteFloor, -2),
    asr: addMinutes(new Date(Math.floor((downloadedAt.getTime() - 60 * 1000) / MINUTE) * MINUTE), 0),
    magrib: addMinutes(ceilMinute(downloadedAt, 1), 0),
    isha: addMinutes(ceilMinute(downloadedAt, 2), 0),
  };
  const preDawnRow = {
    fajr: addMinutes(ceilMinute(downloadedAt, 1), 0),
    sunrise: addMinutes(ceilMinute(downloadedAt, 11), 0),
    dhuhr: '13:04',
    asr: '16:56',
    magrib: '20:14',
    isha: '21:27',
  };
  const spentRow = { fajr: '04:07', sunrise: '05:42', dhuhr: '13:04', asr: '16:56', magrib: '20:16', isha: '21:29' };
  const todayRow = minuteOfDay >= 23 * 60 + 53 ? spentRow : minuteOfDay >= 6 * 60 ? eveningRow : preDawnRow;
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
