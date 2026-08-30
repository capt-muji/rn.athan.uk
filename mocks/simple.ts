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

const addMinutes = (minutesToAdd: number) => {
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

// Realistic late-August / early-September London times with the autumn solar
// drift: Fajr and Sunrise creep later, Dhuhr holds, Asr, Magrib and Isha
// creep earlier by about a minute a day. Jamat fields are unused placeholders.
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
      isha: addMinutes(20),
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [yesterday]: {
      date: yesterday,
      fajr: '04:44',
      sunrise: '06:21',
      dhuhr: '13:07',
      asr: '17:18',
      magrib: '20:09',
      isha: '21:39',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [today]: {
      date: today,
      // ROLLOVER DEMO (minutes from app launch): every prayer is 2 minutes
      // after the previous one and ISHA is next, 2 minutes out — at launch
      // the active background sits on Isha (row 6, all earlier rows passed);
      // 2 minutes later Isha passes and the app/widget roll to the next
      // day's Fajr (list resets, pill to row 1, footer day flips Sun → Mon).
      // day1's Fajr (below) is +4 to close the chain. Before 06:00 the
      // midnight rule moves the night Isha to tomorrow's date, which keeps
      // the same real-time gaps. Relaunch the app to rerun the simulation.
      fajr: addMinutes(-8),
      sunrise: addMinutes(-6),
      dhuhr: addMinutes(-4),
      asr: addMinutes(-2),
      magrib: addMinutes(0),
      isha: addMinutes(2),
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [day1]: {
      date: day1,
      // Fajr (+4m) and Sunrise (+6m) are launch-relative to close the
      // rollover chain: after the mock Isha (+2m) passes, the next prayer is
      // this Fajr and the widget/app roll to the next day (footer day flips
      // Sun → Mon, list resets with the pill back on row 1) — then Sunrise
      // follows 2 minutes later. Sunrise MUST stay launch-relative: a fixed
      // clock time can land before the re-seeded Fajr and put Sunrise first
      // in the day's list. The rest of the day keeps realistic times.
      fajr: addMinutes(4),
      sunrise: addMinutes(6),
      dhuhr: '13:06',
      asr: '17:15',
      magrib: '20:04',
      isha: '21:34',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [day2]: {
      date: day2,
      fajr: '04:49',
      sunrise: '06:26',
      dhuhr: '13:05',
      asr: '17:12',
      magrib: '20:01',
      isha: '21:30',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [day3]: {
      date: day3,
      fajr: '04:51',
      sunrise: '06:28',
      dhuhr: '13:04',
      asr: '17:09',
      magrib: '19:58',
      isha: '21:26',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [day4]: {
      date: day4,
      fajr: '04:53',
      sunrise: '06:30',
      dhuhr: '13:03',
      asr: '17:06',
      magrib: '19:55',
      isha: '21:22',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [day5]: {
      date: day5,
      fajr: '04:55',
      sunrise: '06:32',
      dhuhr: '13:02',
      asr: '17:03',
      magrib: '19:52',
      isha: '21:18',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [day6]: {
      date: day6,
      fajr: '04:57',
      sunrise: '06:34',
      dhuhr: '13:01',
      asr: '17:01',
      magrib: '19:49',
      isha: '21:14',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [day7]: {
      date: day7,
      fajr: '04:59',
      sunrise: '06:36',
      dhuhr: '13:00',
      asr: '16:58',
      magrib: '19:46',
      isha: '21:11',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [day8]: {
      date: day8,
      fajr: '05:01',
      sunrise: '06:38',
      dhuhr: '12:59',
      asr: '16:56',
      magrib: '19:43',
      isha: '21:07',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [day9]: {
      date: day9,
      fajr: '05:03',
      sunrise: '06:40',
      dhuhr: '12:58',
      asr: '16:54',
      magrib: '19:40',
      isha: '21:04',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
    [day10]: {
      date: day10,
      fajr: '05:05',
      sunrise: '06:42',
      dhuhr: '12:57',
      asr: '16:52',
      magrib: '19:37',
      isha: '21:00',
      fajr_jamat: '00:00',
      dhuhr_jamat: '00:00',
      asr_2: '00:00',
      asr_jamat: '00:00',
      magrib_jamat: '00:00',
      isha_jamat: '00:00',
    },
  },
};
