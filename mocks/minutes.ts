/**
 * The dev window's minutes: today seeded from the reading instant, so a mock
 * build opens on the owner's steady hour and the day rolls to tomorrow's real
 * schedule while you watch. Required lazily by stores/timetable.ts behind its
 * build-class gate, so this module leaves prod and preview bundles.
 */

import { addDays, subDays } from 'date-fns';

import { formatDateShort, readPrayerClock } from '@/shared/time';
import { type DayMinutes, toDayMinutes } from '@/shared/timetableDecode';

const MINUTE = 60_000;

/**
 * Today's six minutes, pinned in place of the launch-relative seed to watch a
 * transition without waiting for the sky. Set it, rebuild the mock build, and
 * the app opens on exactly these times; null (the default) seeds from the
 * clock.
 *
 *   minutes: { fajr: 5 * 60 + 30, sunrise: 7 * 60, dhuhr: 12 * 60 + 4, asr: 15 * 60 + 30, magrib: 18 * 60, isha: 19 * 60 + 30 }
 */
export const TODAY_OVERRIDE: { minutes: DayMinutes | null } = { minutes: null };

// Any hour outside the spent late evening seeds the same steady state the owner device-tests
// against: Asr one hour out, Dhuhr one hour spent (2026-10-27 ruling). The spent late evening
// (22:58-23:59) still serves the day's real static shape. Two costs accepted with the ruling:
// a window seeded in the day's first 62 minutes anchors the -62-minute Fajr against the previous
// midnight (the steady hour returns from 01:02), and a small-hours seeding writes today's
// Isha inside the midnight-crossing window (shared/prayer.ts), so that row moves and the
// Maghrib handoff skips straight to tomorrow's Fajr - one skipped row, an hour of steady
// countdown in exchange.

/** Minutes on the London clock of `from` shifted by whole minutes: data never crosses a DST seam uncounted */
const londonMinutes = (from: Date, minutesToAdd: number): number => {
  const clock = readPrayerClock(new Date(from.getTime() + minutesToAdd * MINUTE));
  return clock.hour * 60 + clock.minute;
};

/** Whole-minute anchors: the round-up countdown reads Asr as 1h away and Dhuhr as 1h ago at any second of the hour between them */
const anchoredDay = (floor: Date): DayMinutes => ({
  fajr: londonMinutes(floor, -62),
  sunrise: londonMinutes(floor, -61),
  dhuhr: londonMinutes(floor, -60),
  asr: londonMinutes(floor, 60),
  magrib: londonMinutes(floor, 61),
  isha: londonMinutes(floor, 62),
});

/** The spent late evening serves the day's real static shape, all six passed */
const SPENT_DAY = toDayMinutes({
  fajr: '04:07',
  sunrise: '05:42',
  dhuhr: '13:04',
  asr: '16:56',
  magrib: '20:16',
  isha: '21:29',
});
const SPENT_AFTER = 22 * 60 + 58;

/** The days around today: realistic London rows with the spring solar drift, copied verbatim from the captured payload */
const DAY_BEFORE = toDayMinutes({
  fajr: '04:10',
  sunrise: '05:44',
  dhuhr: '13:04',
  asr: '16:56',
  magrib: '20:14',
  isha: '21:27',
});
const DAYS_AHEAD = [
  toDayMinutes({ fajr: '04:03', sunrise: '05:38', dhuhr: '13:03', asr: '16:58', magrib: '20:19', isha: '21:31' }),
  toDayMinutes({ fajr: '04:00', sunrise: '05:36', dhuhr: '13:03', asr: '16:58', magrib: '20:21', isha: '21:33' }),
  toDayMinutes({ fajr: '04:40', sunrise: '06:12', dhuhr: '13:05', asr: '16:42', magrib: '19:47', isha: '20:58' }),
  toDayMinutes({ fajr: '04:42', sunrise: '06:14', dhuhr: '13:05', asr: '16:40', magrib: '19:45', isha: '20:56' }),
  toDayMinutes({ fajr: '04:44', sunrise: '06:16', dhuhr: '13:05', asr: '16:39', magrib: '19:42', isha: '20:54' }),
  toDayMinutes({ fajr: '04:45', sunrise: '06:17', dhuhr: '13:04', asr: '16:37', magrib: '19:40', isha: '20:52' }),
  toDayMinutes({ fajr: '04:47', sunrise: '06:19', dhuhr: '13:04', asr: '16:36', magrib: '19:38', isha: '20:50' }),
  toDayMinutes({ fajr: '04:48', sunrise: '06:20', dhuhr: '13:04', asr: '16:34', magrib: '19:36', isha: '20:49' }),
  toDayMinutes({ fajr: '04:50', sunrise: '06:22', dhuhr: '13:03', asr: '16:33', magrib: '19:33', isha: '20:46' }),
  toDayMinutes({ fajr: '04:52', sunrise: '06:24', dhuhr: '13:03', asr: '16:31', magrib: '19:31', isha: '20:44' }),
];

/**
 * The window at one reading instant: yesterday through ten days ahead, today
 * seeded from the instant itself. One snapshot per sync run, so the window the
 * app serves never shifts under an open reader.
 */
export const mockMinutesSnapshot = (at: Date): Map<string, DayMinutes> => {
  const clock = readPrayerClock(at);
  const minuteOfDay = clock.hour * 60 + clock.minute;
  const floor = new Date(Math.floor(at.getTime() / MINUTE) * MINUTE);

  const today = TODAY_OVERRIDE.minutes ?? (minuteOfDay >= SPENT_AFTER ? SPENT_DAY : anchoredDay(floor));

  const window = new Map<string, DayMinutes>([
    [formatDateShort(subDays(at, 1)), DAY_BEFORE],
    [formatDateShort(at), today],
  ]);
  for (let index = 0; index < DAYS_AHEAD.length; index += 1) {
    window.set(formatDateShort(addDays(at, index + 1)), DAYS_AHEAD[index]);
  }
  return window;
};
