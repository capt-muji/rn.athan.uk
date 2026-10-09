/**
 * 31 December landing after 1 January is already on screen (R13)
 *
 * The day is asked for without being awaited, so it can land after sync() has resolved and both lists are
 * showing. Runs the real sync(), database, schedule store and prayer builder, so the previous-prayer atoms here
 * are what the countdown bars read. The network, the countdown tickers, the widgets, the logger, the build config
 * and the upgrade check are stubbed.
 */

// =============================================================================
// MOCK SETUP (must be before imports)
// =============================================================================

jest.mock('@/shared/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  isProd: () => true,
  isPreview: () => false,
}));

jest.mock('@/shared/config', () => {
  const actual = jest.requireActual('@/shared/config');
  return {
    ...actual,
    APP_CONFIG: { ...actual.APP_CONFIG, isDev: false, apiKey: 'test-key' },
    isProd: () => true,
    isPreview: () => false,
  };
});

const mockFetchDay = jest.fn();
jest.mock('@/api/client', () => ({
  ...jest.requireActual('@/api/client'),
  fetchDay: (date: string) => mockFetchDay(date),
}));

jest.mock('@/stores/countdown', () => ({ startCountdowns: jest.fn() }));
jest.mock('@/stores/widget', () => ({ refreshPrayerWidgets: jest.fn() }));
jest.mock('@/stores/version', () => ({ handleAppUpgrade: jest.fn() }));

import { getDefaultStore } from 'jotai/vanilla';

import { transformApiData } from '@/shared/prayer';
import type { ISingleApiResponseTransformed, Prayer } from '@/shared/types';
import * as Database from '@/stores/database';
import { lastNotificationScheduleAtom } from '@/stores/notifications';
import { extraPrevPrayerAtom, extraSequenceAtom, standardPrevPrayerAtom } from '@/stores/schedule';

import { sync } from '../sync';

// =============================================================================
// TEST HELPERS
// =============================================================================

/** Fixture times for the test, not the provider's: Fajr, Sunrise, Dhuhr, Asr, Magrib, Isha, GMT in London */
const TIMES: Record<string, string[]> = {
  '2026-12-31': ['06:23', '08:06', '12:04', '13:39', '15:58', '17:34'],
  '2027-01-01': ['06:23', '08:06', '12:05', '13:40', '15:59', '17:35'],
  '2027-01-02': ['06:23', '08:06', '12:05', '13:41', '16:00', '17:36'],
  '2027-01-03': ['06:23', '08:06', '12:06', '13:42', '16:01', '17:37'],
  '2027-01-04': ['06:22', '08:05', '12:06', '13:43', '16:02', '17:38'],
};

/** Days as a download stores them, with Suhoor, Duha and Istijaba worked out */
const records = (dates: string[]): ISingleApiResponseTransformed[] =>
  transformApiData({
    city: 'london',
    times: Object.fromEntries(
      dates.map((date) => {
        const [fajr, sunrise, dhuhr, asr, magrib, isha] = TIMES[date];
        return [date, { fajr, sunrise, dhuhr, asr, magrib, isha }];
      })
    ),
  });

const store = getDefaultStore();

const instantOf = (row: Prayer | null | undefined) => row?.datetime?.toISOString() ?? null;

/** Last night's Midnight and Last Third on the 1 January Extras list */
const lastNightRows = () =>
  (store.get(extraSequenceAtom)?.prayers ?? [])
    .filter((row) => row.belongsToDate === '2027-01-01' && (row.english === 'Midnight' || row.english === 'Last Third'))
    .map(instantOf);

/** Microtasks only, so the fake clock does not hold them */
const settle = async () => {
  for (let tick = 0; tick < 20; tick++) await Promise.resolve();
};

// =============================================================================
// TESTS
// =============================================================================

describe('31 December landing once 1 January is on screen', () => {
  let answer: ((day: ISingleApiResponseTransformed) => void) | undefined;

  beforeEach(() => {
    // 03:00 on 1 January: Fajr is next on Standard and Suhoor on Extras, and what came before each needs 31 December
    jest.useFakeTimers({ now: new Date('2027-01-01T03:00:00Z') });
    Database.database.clearAll();
    Database.saveAllPrayers(records(['2027-01-01', '2027-01-02', '2027-01-03', '2027-01-04']));
    Database.setItem('fetched_years', { 2027: true });
    mockFetchDay.mockReset();
    mockFetchDay.mockImplementation(
      () =>
        new Promise<ISingleApiResponseTransformed>((resolve) => {
          answer = resolve;
        })
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('works out both bars and last night rows, and reopens the gate, without another sync', async () => {
    await sync();

    expect(mockFetchDay).toHaveBeenCalledWith('2026-12-31');
    // Read before the day lands, as the bars would be, so a lookup that is never run again would keep these
    expect(store.get(standardPrevPrayerAtom)).toBeNull();
    expect(store.get(extraPrevPrayerAtom)).toBeNull();
    expect(lastNightRows()).toEqual([null, null]);

    store.set(lastNotificationScheduleAtom, Date.now());
    answer?.(records(['2026-12-31'])[0]);
    await settle();

    const standardPrevious = store.get(standardPrevPrayerAtom);
    expect(standardPrevious).toMatchObject({ english: 'Isha', belongsToDate: '2026-12-31', time: '17:34' });
    expect(instantOf(standardPrevious)).toBe('2026-12-31T17:34:00.000Z');

    const extrasPrevious = store.get(extraPrevPrayerAtom);
    expect(extrasPrevious).toMatchObject({ english: 'Last Third', belongsToDate: '2027-01-01' });
    expect(lastNightRows()).toEqual([expect.any(String), instantOf(extrasPrevious)]);

    expect(store.get(lastNotificationScheduleAtom)).toBe(0);
  });
});
