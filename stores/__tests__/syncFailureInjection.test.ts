/**
 * The exhaustive failure-injection rig (T-388): every step of the launch and foreground sync chain,
 * rejected one per test over a store holding stored days, must leave the home screen's own read hasData.
 *
 * `app/index.tsx` renders the error screen on `syncLoadable`'s hasError alone, and its Refresh wipes, so over
 * stored days that state is a blanked home screen no retry recovers. Each row below walks the chain as the code
 * runs it - the upgrade check, the update-needed storage reads, the network fetch, the download's storage writes,
 * the notification-gate reopen, the sequence rebuild, the countdowns, the January 1 ask, both widget pushes -
 * and rejects exactly one step. The launch rows drive `triggerSyncLoadable` (what `_layout` calls once); the
 * foreground rows drive a bare `sync()` after a settled launch (what `device/listeners.ts` calls on a return to
 * active, which awaits the widget push). A red row names a real thrower a production user could hit.
 *
 * Runs the real sync, database, storage, time and notifications modules over a fresh module graph per test; the
 * upgrade check, the sequences, the countdowns, the widgets and the network are stubbed at the same boundaries
 * the suites for those modules own.
 */

import type { ISingleApiResponseTransformed } from '@/shared/types';

// =============================================================================
// MOCK SETUP
// =============================================================================

let mockIsDev = false;

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
    get APP_CONFIG() {
      return { ...actual.APP_CONFIG, isDev: mockIsDev, apiKey: 'test-key' };
    },
  };
});

const mockFetchYear = jest.fn();
jest.mock('@/api/client', () => ({
  fetchYear: (year: number) => mockFetchYear(year),
  fetchDay: () => new Promise(() => {}),
}));

const mockSetSequence = jest.fn();
jest.mock('@/stores/schedule', () => ({
  setSequence: (type: string, date: Date) => mockSetSequence(type, date),
  refreshSequence: jest.fn(),
}));

const mockStartCountdowns = jest.fn();
jest.mock('@/stores/countdown', () => ({ startCountdowns: () => mockStartCountdowns() }));

const mockRefreshPrayerWidgets = jest.fn();
jest.mock('@/stores/widget', () => ({ refreshPrayerWidgets: () => mockRefreshPrayerWidgets() }));

const mockHandleAppUpgrade = jest.fn();
jest.mock('@/stores/version', () => ({ handleAppUpgrade: () => mockHandleAppUpgrade() }));

// =============================================================================
// FIXTURES
// =============================================================================

// 09:00 BST on Monday 14 September 2026
const SEPTEMBER_NOW = new Date('2026-09-14T08:00:00.000Z');
const TODAY = '2026-09-14';
const TOMORROW = '2026-09-15';

// Noon UTC on 15 December 2026, when the app asks for next year
const DECEMBER_NOW = new Date('2026-12-15T12:00:00.000Z');
const DECEMBER_TODAY = '2026-12-15';
const DECEMBER_TOMORROW = '2026-12-16';

// Noon UTC on 1 January 2027, when the app asks for last year's 31 December
const JANUARY_NOW = new Date('2027-01-01T12:00:00.000Z');
const JANUARY_TODAY = '2027-01-01';
const JANUARY_TOMORROW = '2027-01-02';

const day = (date: string): ISingleApiResponseTransformed => ({
  date,
  fajr: '05:00',
  sunrise: '06:30',
  dhuhr: '13:00',
  asr: '16:30',
  magrib: '19:15',
  isha: '20:30',
  suhoor: '04:40',
  duha: '06:50',
  istijaba: '18:15',
});

/** A fresh sync module, database and default store, as a cold launch has them */
const launch = ({
  stored,
  now = SEPTEMBER_NOW,
  fetchedYears = null,
}: {
  stored: string[];
  now?: Date;
  fetchedYears?: Record<number, boolean> | null;
}) => {
  jest.setSystemTime(now);
  const sync = require('@/stores/sync') as typeof import('@/stores/sync');
  const Database = require('@/stores/database') as typeof import('@/stores/database');
  const { getDefaultStore } = require('jotai/vanilla') as typeof import('jotai/vanilla');
  Database.saveAllPrayers(stored.map(day));
  if (fetchedYears) Database.setItem('fetched_years', fetchedYears);
  return { ...sync, store: getDefaultStore(), Database };
};

/** Microtasks only, so the fake clock holds every timer */
const settle = async () => {
  for (let tick = 0; tick < 50; tick++) await Promise.resolve();
};

const logger = () => (require('@/shared/logger') as typeof import('@/shared/logger')).default;

const failure = () => new Error('injected step failure');

const hasData = { state: 'hasData', data: undefined } as const;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  jest.useFakeTimers({ now: SEPTEMBER_NOW });
  mockIsDev = false;
  mockHandleAppUpgrade.mockImplementation(() => {});
  mockSetSequence.mockImplementation(() => {});
  mockStartCountdowns.mockImplementation(() => {});
  mockRefreshPrayerWidgets.mockResolvedValue(undefined);
  mockFetchYear.mockImplementation(async () => [day(TODAY), day(TOMORROW)]);
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

// =============================================================================
// THE LAUNCH CHAIN, ONE STEP REJECTED PER TEST OVER STORED DAYS
// =============================================================================

describe('the launch chain with one step rejected over stored days', () => {
  it('completes on its stored days when the upgrade check rejects', async () => {
    const error = failure();
    mockHandleAppUpgrade.mockImplementation(() => {
      throw error;
    });
    const { store, syncLoadable, triggerSyncLoadable } = launch({ stored: [TODAY, TOMORROW] });

    triggerSyncLoadable();
    await settle();

    expect(store.get(syncLoadable)).toEqual(hasData);
  });

  it('completes when the update-needed read of today rejects', async () => {
    const error = failure();
    const { store, syncLoadable, triggerSyncLoadable, Database } = launch({ stored: [TODAY, TOMORROW] });
    jest.spyOn(Database, 'getPrayerByDate').mockImplementation(() => {
      throw error;
    });

    triggerSyncLoadable();
    await settle();

    expect(store.get(syncLoadable)).toEqual(hasData);
  });

  it('completes when the December fetched-years read rejects', async () => {
    const error = failure();
    const { store, syncLoadable, triggerSyncLoadable, Database } = launch({
      stored: [DECEMBER_TODAY, DECEMBER_TOMORROW],
      now: DECEMBER_NOW,
      fetchedYears: { 2026: true },
    });
    jest.spyOn(Database, 'getItem').mockImplementation(() => {
      throw error;
    });

    triggerSyncLoadable();
    await settle();

    expect(store.get(syncLoadable)).toEqual(hasData);
  });

  it('completes when the year download rejects', async () => {
    mockIsDev = true;
    mockFetchYear.mockRejectedValue(new TypeError('Network request failed'));
    const { store, syncLoadable, triggerSyncLoadable } = launch({ stored: [TODAY, TOMORROW] });

    triggerSyncLoadable();
    await settle();

    expect(logger().warn).toHaveBeenCalledWith(
      expect.stringContaining('Refresh failed'),
      expect.objectContaining({ error: expect.any(TypeError) })
    );
    expect(store.get(syncLoadable)).toEqual(hasData);
  });

  it('completes when the next-year-only download rejects with the current year cached', async () => {
    mockFetchYear.mockImplementation(async (year: number) => {
      // The current year must not be asked for: this row is the next-year-only branch
      throw year === 2027 ? new Error('Incomplete data received') : new Error('unexpected current-year fetch');
    });
    const { store, syncLoadable, triggerSyncLoadable, Database } = launch({
      stored: [DECEMBER_TODAY, DECEMBER_TOMORROW],
      now: DECEMBER_NOW,
      fetchedYears: { 2026: true },
    });
    const wipe = jest.spyOn(Database, 'clearAllExcept').mockImplementation(() => {});

    triggerSyncLoadable();
    await settle();

    expect(wipe).not.toHaveBeenCalled();
    expect(store.get(syncLoadable)).toEqual(hasData);
  });

  it('completes when the download wipe rejects with the stored days left in place', async () => {
    mockIsDev = true;
    const error = failure();
    const { store, syncLoadable, triggerSyncLoadable, Database } = launch({ stored: [TODAY, TOMORROW] });
    jest.spyOn(Database, 'clearAllExcept').mockImplementation(() => {
      throw error;
    });

    triggerSyncLoadable();
    await settle();

    expect(store.get(syncLoadable)).toEqual(hasData);
  });

  it('completes when the downloaded-days write-back read rejects', async () => {
    mockIsDev = true;
    const error = failure();
    const { store, syncLoadable, triggerSyncLoadable, Database } = launch({ stored: [TODAY, TOMORROW] });
    jest.spyOn(Database, 'getPrayerByDateString').mockImplementation(() => {
      throw error;
    });

    triggerSyncLoadable();
    await settle();

    expect(store.get(syncLoadable)).toEqual(hasData);
  });

  it('completes when marking the year fetched rejects after its days are saved', async () => {
    mockIsDev = true;
    const error = failure();
    const { store, syncLoadable, triggerSyncLoadable, Database } = launch({ stored: [TODAY, TOMORROW] });
    jest.spyOn(Database, 'markYearAsFetched').mockImplementation(() => {
      throw error;
    });

    triggerSyncLoadable();
    await settle();

    expect(store.get(syncLoadable)).toEqual(hasData);
  });

  it('completes when reopening the notification refresh gate rejects', async () => {
    mockIsDev = true;
    // A download whose times differ from what is stored, so the gate reopen path runs
    const differing = (date: string) => ({ ...day(date), fajr: '05:30' });
    mockFetchYear.mockImplementation(async () => [differing(TODAY), differing(TOMORROW)]);
    const error = failure();
    const { store, syncLoadable, triggerSyncLoadable } = launch({ stored: [TODAY, TOMORROW] });
    const Storage = require('@/stores/storage') as typeof import('@/stores/storage');
    jest.spyOn(Storage, 'resetStoredAtom').mockImplementation(() => {
      throw error;
    });

    triggerSyncLoadable();
    await settle();

    expect(logger().warn).toHaveBeenCalledWith('SYNC: Failed to reopen the notification refresh gate', { error });
    expect(store.get(syncLoadable)).toEqual(hasData);
  });

  it.each([{ list: 'standard' }, { list: 'extra' }])(
    'completes when rebuilding the $list sequence rejects',
    async ({ list }) => {
      const error = failure();
      mockSetSequence.mockImplementation((type: string) => {
        if (type === list) throw error;
      });
      const { store, syncLoadable, triggerSyncLoadable } = launch({ stored: [TODAY, TOMORROW] });

      triggerSyncLoadable();
      await settle();

      expect(store.get(syncLoadable)).toEqual(hasData);
    }
  );

  it('completes when starting the countdowns rejects', async () => {
    const error = failure();
    mockStartCountdowns.mockImplementation(() => {
      throw error;
    });
    const { store, syncLoadable, triggerSyncLoadable } = launch({ stored: [TODAY, TOMORROW] });

    triggerSyncLoadable();
    await settle();

    expect(store.get(syncLoadable)).toEqual(hasData);
  });

  it('completes on 1 January when the read behind the 31 December ask rejects', async () => {
    const error = failure();
    const { store, syncLoadable, triggerSyncLoadable, Database } = launch({
      stored: [JANUARY_TODAY, JANUARY_TOMORROW],
      now: JANUARY_NOW,
    });
    jest.spyOn(Database, 'getPrayerByDateString').mockImplementation(() => {
      throw error;
    });

    triggerSyncLoadable();
    await settle();

    expect(store.get(syncLoadable)).toEqual(hasData);
  });

  it('completes when the deferred widget push rejects, and warns one line', async () => {
    const error = failure();
    mockRefreshPrayerWidgets.mockRejectedValue(error);
    const { store, syncLoadable, triggerSyncLoadable } = launch({ stored: [TODAY, TOMORROW] });

    triggerSyncLoadable();
    await settle();
    jest.runOnlyPendingTimers();
    jest.runOnlyPendingTimers();
    await settle();

    expect(mockRefreshPrayerWidgets).toHaveBeenCalledTimes(1);
    expect(logger().warn).toHaveBeenCalledWith('WIDGET: Deferred refresh failed', { error });
    expect(store.get(syncLoadable)).toEqual(hasData);
  });

  it('settles without waiting for the notification refresh the home screen schedules once data lands', async () => {
    const Notifications = require('@/stores/notifications') as typeof import('@/stores/notifications');
    jest.spyOn(Notifications, 'refreshNotifications').mockReturnValue(new Promise(() => {}));
    const { store, syncLoadable, triggerSyncLoadable } = launch({ stored: [TODAY, TOMORROW] });

    triggerSyncLoadable();
    await settle();

    expect(store.get(syncLoadable)).toEqual(hasData);
  });

  it('keeps the home screen on its data when the notification refresh rejects, as the screen wires it', async () => {
    const Notifications = require('@/stores/notifications') as typeof import('@/stores/notifications');
    const error = failure();
    jest.spyOn(Notifications, 'refreshNotifications').mockRejectedValue(error);
    const { store, syncLoadable, triggerSyncLoadable } = launch({ stored: [TODAY, TOMORROW] });

    triggerSyncLoadable();
    await settle();
    expect(store.get(syncLoadable)).toEqual(hasData);

    // app/index.tsx's own effect wiring: the refresh runs only once data has landed, and its failure is logged there
    await Notifications.refreshNotifications().catch((refreshError: unknown) =>
      logger().error('Failed to refresh notifications after sync:', refreshError)
    );

    expect(logger().error).toHaveBeenCalledWith('Failed to refresh notifications after sync:', error);
    expect(store.get(syncLoadable)).toEqual(hasData);
  });
});

// =============================================================================
// THE SAME STEPS OVER A STORE WITH NOTHING USABLE STORED
// The failure gates keep the error screen the honest landing there (session 3 dashes rules §9):
// its Refresh re-runs the sync, which is the recovery a first install needs.
// =============================================================================

describe('the same steps over a store with nothing usable stored', () => {
  it('still throws when the update-needed read rejects with nothing stored', async () => {
    const error = failure();
    const { store, syncLoadable, triggerSyncLoadable, Database } = launch({ stored: [] });
    jest.spyOn(Database, 'getPrayerByDate').mockImplementation(() => {
      throw error;
    });

    triggerSyncLoadable();
    await settle();

    expect(store.get(syncLoadable)).toEqual({ state: 'hasError', error });
  });

  // Today missing with a later day of the marked year stored is the one shape that reaches the sequence
  // rebuild without a download (isTodayGapInStoredYear answers that downloading again changes nothing)
  const gapLaunch = () => launch({ stored: ['2026-09-17'], fetchedYears: { 2026: true } });

  it('still throws when rebuilding a sequence rejects with today only a gap in the stored year', async () => {
    const error = failure();
    mockSetSequence.mockImplementation(() => {
      throw error;
    });
    const { store, syncLoadable, triggerSyncLoadable } = gapLaunch();

    triggerSyncLoadable();
    await settle();

    expect(store.get(syncLoadable)).toEqual({ state: 'hasError', error });
  });

  it('still throws when starting the countdowns rejects with today only a gap in the stored year', async () => {
    const error = failure();
    mockStartCountdowns.mockImplementation(() => {
      throw error;
    });
    const { store, syncLoadable, triggerSyncLoadable } = gapLaunch();

    triggerSyncLoadable();
    await settle();

    expect(store.get(syncLoadable)).toEqual({ state: 'hasError', error });
  });
});

// =============================================================================
// THE FOREGROUND CHAIN: A SETTLED LAUNCH, THEN THE LISTENERS' BARE sync()
// =============================================================================

describe('the foreground chain with one step rejected over stored days', () => {
  /** A launch that has already settled on its days, then the foreground return's own sync */
  const foregrounded = async (options: Parameters<typeof launch>[0]) => {
    const started = launch(options);
    started.triggerSyncLoadable();
    await settle();
    expect(started.store.get(started.syncLoadable)).toEqual(hasData);
    return started;
  };

  it('completes when the upgrade check rejects', async () => {
    const error = failure();
    mockHandleAppUpgrade.mockImplementation(() => {
      throw error;
    });
    const { sync, store, syncLoadable } = await foregrounded({ stored: [TODAY, TOMORROW] });

    await expect(sync()).resolves.toBeUndefined();

    expect(store.get(syncLoadable)).toEqual(hasData);
  });

  it('completes when the update-needed read of today rejects', async () => {
    const error = failure();
    const { sync, store, syncLoadable, Database } = await foregrounded({ stored: [TODAY, TOMORROW] });
    jest.spyOn(Database, 'getPrayerByDate').mockImplementation(() => {
      throw error;
    });

    await expect(sync()).resolves.toBeUndefined();

    expect(store.get(syncLoadable)).toEqual(hasData);
  });

  it('completes when the download rejects with tomorrow still stored', async () => {
    mockFetchYear.mockRejectedValue(new TypeError('Network request failed'));
    const { sync, store, syncLoadable } = await foregrounded({ stored: [TOMORROW] });

    await expect(sync()).resolves.toBeUndefined();

    expect(store.get(syncLoadable)).toEqual(hasData);
  });

  it('completes when rebuilding a sequence rejects', async () => {
    const error = failure();
    mockSetSequence.mockImplementation(() => {
      throw error;
    });
    const { sync, store, syncLoadable } = await foregrounded({ stored: [TODAY, TOMORROW] });

    await expect(sync()).resolves.toBeUndefined();

    expect(store.get(syncLoadable)).toEqual(hasData);
  });

  it('completes when starting the countdowns rejects', async () => {
    const error = failure();
    mockStartCountdowns.mockImplementation(() => {
      throw error;
    });
    const { sync, store, syncLoadable } = await foregrounded({ stored: [TODAY, TOMORROW] });

    await expect(sync()).resolves.toBeUndefined();

    expect(store.get(syncLoadable)).toEqual(hasData);
  });

  it('completes when the awaited widget push rejects, and warns one line', async () => {
    const error = failure();
    mockRefreshPrayerWidgets.mockRejectedValue(error);
    const { sync, store, syncLoadable } = await foregrounded({ stored: [TODAY, TOMORROW] });

    await expect(sync()).resolves.toBeUndefined();

    expect(logger().warn).toHaveBeenCalledTimes(1);
    expect(logger().warn).toHaveBeenCalledWith('WIDGET: Awaited refresh failed', { error });
    expect(store.get(syncLoadable)).toEqual(hasData);
  });
});
