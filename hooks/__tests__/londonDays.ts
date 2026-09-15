/**
 * Real London days for the row hooks' tests, built into rows by the app's own builder
 *
 * Times from londonprayertimes.com for 2026, as in shared/__tests__/nightTimes.test.ts. 11 September 2026
 * is a Friday, so its Extras list has Istijaba. A suite using storeLondonDays must mock '@/stores/database' with
 * `getPrayerByDateString: jest.fn()`; a rendering suite uses saveLondonDays against the real database instead.
 */

import { createPrayerSequence, transformApiData } from '@/shared/prayer';
import { createPrayerDatetime } from '@/shared/time';
import type { ISingleApiResponseTransformed, Prayer, RequiredTimeName, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';

const LONDON_2026: Record<string, Record<RequiredTimeName, string>> = {
  '2026-09-10': { fajr: '04:52', sunrise: '06:24', dhuhr: '13:03', asr: '16:31', magrib: '19:30', isha: '20:43' },
  '2026-09-11': { fajr: '04:54', sunrise: '06:26', dhuhr: '13:02', asr: '16:29', magrib: '19:28', isha: '20:42' },
  '2026-09-12': { fajr: '04:56', sunrise: '06:28', dhuhr: '13:02', asr: '16:27', magrib: '19:25', isha: '20:39' },
};

/** Per day: the times the provider sent unreadably, or 'not stored' for a day missing altogether */
export type Breakage = Record<string, RequiredTimeName[] | 'not stored'>;

/**
 * The days as the app stores them, with the given breakage
 *
 * Unreadable times go through transformApiData as null, so Suhoor, Duha and Istijaba follow them exactly as
 * they do in the app.
 */
const buildLondonDays = (breakage: Breakage): ISingleApiResponseTransformed[] =>
  Object.entries(LONDON_2026).flatMap(([date, times]) => {
    const broken = breakage[date] ?? [];
    if (broken === 'not stored') return [];

    const validated: Record<RequiredTimeName, string | null> = { ...times };
    for (const name of broken) validated[name] = null;

    return transformApiData({ city: 'london', times: { [date]: validated } });
  });

/** Points the mocked `getPrayerByDateString` at the days, for suites that mock '@/stores/database' */
export const storeLondonDays = (breakage: Breakage = {}): void => {
  const stored = new Map(buildLondonDays(breakage).map((day) => [day.date, day]));

  (Database.getPrayerByDateString as jest.Mock).mockImplementation((date: string) => stored.get(date) ?? null);
};

/** Saves the days through the real database, for suites that render against real storage */
export const saveLondonDays = (breakage: Breakage = {}): void => {
  // Saving only adds, so a day an earlier call saved would otherwise still be there
  for (const [date, broken] of Object.entries(breakage)) {
    if (broken === 'not stored') Database.removeItem(`prayer_${date}`);
  }
  Database.saveAllPrayers(buildLondonDays(breakage));
};

/** A London clock reading as an instant, whatever timezone the tests run in */
export const london = (date: string, time: string): Date => createPrayerDatetime(date, time);

/** The app's own sequence, three list days unless told otherwise, starting on a list day */
export const sequenceFrom = (type: ScheduleType, firstDay: string, dayCount = 3): Prayer[] =>
  createPrayerSequence(type, london(firstDay, '12:00'), dayCount).prayers;

interface RowWithStatus {
  english: string;
  belongsToDate: string;
  isPassed: boolean;
  isNext: boolean;
}

/** A row's status in words; a row both passed and next reads as such rather than hiding behind one */
export const statusOf = (row: RowWithStatus): string =>
  [row.isPassed && 'passed', row.isNext && 'next'].filter(Boolean).join('+') || 'upcoming';

/** One list day's rows, in sequence order, as "Name: status" */
export const listStatuses = (rows: RowWithStatus[], date: string): string[] =>
  rows.filter((row) => row.belongsToDate === date).map((row) => `${row.english}: ${statusOf(row)}`);
