import { addDays, subDays } from 'date-fns';

import { formatDateShort } from '@/shared/time';
import type { IApiResponse } from '@/shared/types';

/**
 * Mock data for testing prayer times
 *
 * MIDNIGHT PRAYER TESTING:
 * - Midnight is calculated as: (Magrib + Fajr) / 2
 * - Example: Magrib 16:14 → Fajr 05:35 (next day)
 *   Night duration: 13h 21m → Midnight ≈ 22:52
 * - The midnight field is automatically calculated during transformApiData()
 * - Check Page 2 (Extras) to see Midnight as first prayer
 */

// Simulating during 00:00-05:59: the intended midnight-crossing rules apply.
// shared/prayer.ts moves a Standard Isha in that window to TOMORROW's datetime
// (adjustPrayerDateForMidnightCrossing) and assigns it to YESTERDAY's Islamic
// day (calculateBelongsToDate) - correct for a real post-midnight Isha, but a
// night-time mock triggers both: at the Magrib->Isha handoff the countdown
// skips to the following day's Fajr and the rollover cascade fires early.
// Real London Isha never lands 00:00-06:00. To test the Magrib->Isha handoff
// and day rollover cleanly, simulate during 06:00-23:59.
const now = new Date();

// Launch-relative time seeder, kept for future mock cascades (e.g. rapid
// prayer-to-prayer transition testing) — today's resting data is realistic.
export const addMinutes = (minutesToAdd: number) => {
  const date = new Date(now.getTime() + minutesToAdd * 60000);
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const dayBeforeYesterday = formatDateShort(subDays(now, 2));
const yesterday = formatDateShort(subDays(now, 1));
const today = formatDateShort(now);
const daysAhead = Array.from({ length: 10 }, (_, i) => i + 1);
const [day1, day2, day3, day4, day5, day6, day7, day8, day9, day10] = daysAhead.map((d) =>
  formatDateShort(addDays(now, d))
);

// Realistic London times copied verbatim from mocks/full.ts, 13 contiguous
// days (2024-08-28 through 2024-09-09) carrying the API's real autumn solar
// drift. TODAY and DAY 1's Fajr/Sunrise are launch-relative instead.
// Jamat fields are unused placeholders.
export const MOCK_DATA_SIMPLE: IApiResponse = {
  city: 'london',
  times: {
    [dayBeforeYesterday]: {
      date: dayBeforeYesterday,
      fajr: '04:42',
      sunrise: '06:19',
      dhuhr: '13:08',
      asr: '17:20',
      magrib: '20:11',
      isha: '21:07',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [yesterday]: {
      date: yesterday,
      fajr: '04:34',
      sunrise: '06:06',
      dhuhr: '13:06',
      asr: '16:47',
      magrib: '19:56',
      isha: '21:06',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [today]: {
      date: today,
      fajr: addMinutes(-2),
      sunrise: addMinutes(0),
      dhuhr: addMinutes(157),
      asr: addMinutes(180),
      magrib: addMinutes(240),
      isha: addMinutes(300),
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [day1]: {
      date: day1,
      fajr: addMinutes(310),
      sunrise: addMinutes(312),
      dhuhr: '13:06',
      asr: '16:44',
      magrib: '19:51',
      isha: '21:01',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [day2]: {
      date: day2,
      fajr: '04:39',
      sunrise: '06:11',
      dhuhr: '13:06',
      asr: '16:43',
      magrib: '19:49',
      isha: '21:00',
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
  },
};
