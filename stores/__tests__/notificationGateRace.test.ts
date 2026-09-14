/**
 * A download landing while a reschedule is running (data-path review, the gate race)
 *
 * The reschedule reads the days before it awaits the OS, and the download's reopen of the 12-hour gate lands while
 * it waits. Stamped afterwards, the gate would hide the days that landed for twelve hours: the resume path refreshes
 * before its sync, and nothing refreshes after it. Runs the real sync(), notifications store, database and prayer
 * builder; the network, the countdown tickers, the widgets, the logger, the build config and the upgrade check are
 * stubbed.
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

const mockFetchYear = jest.fn();
jest.mock('@/api/client', () => ({
  ...jest.requireActual('@/api/client'),
  fetchYear: (year: number) => mockFetchYear(year),
  fetchDay: jest.fn(() => new Promise(() => {})),
}));

jest.mock('@/stores/countdown', () => ({ startCountdowns: jest.fn() }));
jest.mock('@/stores/widget', () => ({ refreshPrayerWidgets: jest.fn() }));
jest.mock('@/stores/version', () => ({ handleAppUpgrade: jest.fn() }));

import * as Notifications from 'expo-notifications';
import { getDefaultStore } from 'jotai/vanilla';

import { transformApiData } from '@/shared/prayer';
import type { ISingleApiResponseTransformed } from '@/shared/types';
import * as Database from '@/stores/database';
import {
  lastNotificationScheduleAtom,
  refreshNotifications,
  rescheduleAllNotificationsFromBackground,
  shouldRescheduleNotifications,
} from '@/stores/notifications';

import { sync } from '../sync';

// =============================================================================
// TEST HELPERS
// =============================================================================

/** Fixture times for the test, not the provider's */
const TIMES = { fajr: '05:00', sunrise: '06:30', dhuhr: '12:00', asr: '15:30', magrib: '19:00', isha: '20:30' };

const records = (dates: string[]): ISingleApiResponseTransformed[] =>
  transformApiData({ city: 'london', times: Object.fromEntries(dates.map((date) => [date, TIMES])) });

const TODAY = '2026-09-14';
const store = getDefaultStore();

/** Holds the reschedule at its sweep of the OS, after it has read the days, until the test lets it go */
const holdTheSweep = () => {
  const sweep = { reached: false, release: () => {} };
  jest.mocked(Notifications.getAllScheduledNotificationsAsync).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        sweep.reached = true;
        sweep.release = () => resolve([]);
      })
  );
  return sweep;
};

/** Holds the next year download until the test answers it */
const holdTheDownload = () => {
  const download = { answer: (_days: ISingleApiResponseTransformed[]) => {} };
  mockFetchYear.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        download.answer = resolve;
      })
  );
  return download;
};

/** Microtasks only, so the fake clock does not hold them */
const until = async (condition: () => boolean) => {
  for (let tick = 0; tick < 1000 && !condition(); tick++) await Promise.resolve();
  expect(condition()).toBe(true);
};

// =============================================================================
// TESTS
// =============================================================================

describe('the notification refresh gate when a download lands during a reschedule', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(`${TODAY}T08:00:00Z`) });
    Database.database.clearAll();
    mockFetchYear.mockReset();
    // Today missing and this year unmarked, tomorrow stored: the reschedule runs, and a sync downloads
    Database.saveAllPrayers(records(['2026-09-15', '2026-09-16']));
    store.set(lastNotificationScheduleAtom, 0);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('stays open after a foreground refresh that read the days before today landed', async () => {
    const sweep = holdTheSweep();
    const download = holdTheDownload();

    const refresh = refreshNotifications();
    await until(() => sweep.reached);
    const syncing = sync();
    download.answer(records([TODAY, '2026-09-15', '2026-09-16']));
    await syncing;

    sweep.release();
    await refresh;

    expect(Database.getPrayerByDateString(TODAY)).not.toBeNull();
    expect(store.get(lastNotificationScheduleAtom)).toBe(0);
    expect(shouldRescheduleNotifications()).toBe(true);
  });

  it('is stamped by a refresh that reads the days after the download landed', async () => {
    mockFetchYear.mockResolvedValueOnce(records([TODAY, '2026-09-15', '2026-09-16']));

    await sync();
    await refreshNotifications();

    expect(store.get(lastNotificationScheduleAtom)).toBe(Date.now());
  });

  it('stays open after a background reschedule when a foreground download lands while it runs', async () => {
    // The task's own sync fails offline, and carries on because tomorrow is stored
    mockFetchYear.mockRejectedValueOnce(new TypeError('Network request failed'));
    const sweep = holdTheSweep();

    const background = rescheduleAllNotificationsFromBackground();
    await until(() => sweep.reached);

    const download = holdTheDownload();
    const syncing = sync();
    download.answer(records([TODAY, '2026-09-15', '2026-09-16']));
    await syncing;

    sweep.release();
    await background;

    expect(Database.getPrayerByDateString(TODAY)).not.toBeNull();
    expect(store.get(lastNotificationScheduleAtom)).toBe(0);
  });
});
