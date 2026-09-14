/**
 * The launch sync, started through `triggerSyncLoadable` and read through `syncLoadable` (stores/sync.ts)
 *
 * `app/_layout.tsx` calls the trigger once as the bundle loads, and `app/index.tsx` reads the same loadable to choose
 * between the spinner, the lists and the error screen, and to retry the notification refresh once data lands. So
 * the sync must start on that first call, run once however often the loadable is read, and settle without waiting
 * for the iOS widget push. That push starts only after a frame and then a macrotask, so it cannot land on the first
 * paint, and a failed push is logged rather than left unhandled. A development build downloads on every launch.
 *
 * Runs the real sync, database and notifications store over a fresh module graph per test, since the loadable holds
 * its one sync for the life of the store. The network, the sequences, the countdowns, the widgets and the upgrade
 * check are stubbed.
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

jest.mock('@/stores/countdown', () => ({ startCountdowns: jest.fn() }));

const mockRefreshPrayerWidgets = jest.fn();
jest.mock('@/stores/widget', () => ({ refreshPrayerWidgets: () => mockRefreshPrayerWidgets() }));

const mockHandleAppUpgrade = jest.fn();
jest.mock('@/stores/version', () => ({ handleAppUpgrade: () => mockHandleAppUpgrade() }));

// =============================================================================
// FIXTURES
// =============================================================================

// 09:00 BST on Monday 14 September 2026
const NOW = new Date('2026-09-14T08:00:00.000Z');
const TODAY = '2026-09-14';
const TOMORROW = '2026-09-15';

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
const launch = ({ stored }: { stored: string[] }) => {
  const sync = require('@/stores/sync') as typeof import('@/stores/sync');
  const Database = require('@/stores/database') as typeof import('@/stores/database');
  const { getDefaultStore } = require('jotai/vanilla') as typeof import('jotai/vanilla');
  Database.saveAllPrayers(stored.map(day));
  return { ...sync, store: getDefaultStore() };
};

/** Microtasks only, so the fake clock holds every timer */
const settle = async () => {
  for (let tick = 0; tick < 50; tick++) await Promise.resolve();
};

const logger = () => (require('@/shared/logger') as typeof import('@/shared/logger')).default;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  jest.useFakeTimers({ now: NOW });
  mockIsDev = false;
  mockRefreshPrayerWidgets.mockResolvedValue(undefined);
  mockFetchYear.mockImplementation(async () => [day(TODAY), day(TOMORROW)]);
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

// =============================================================================
// THE LAUNCH TRIGGER
// =============================================================================

describe('triggerSyncLoadable and syncLoadable', () => {
  it('starts the sync on the first call, and settles with both lists set for now', async () => {
    const { store, syncLoadable, triggerSyncLoadable } = launch({ stored: [TODAY, TOMORROW] });

    expect(triggerSyncLoadable()).toEqual({ state: 'loading' });
    expect(mockHandleAppUpgrade).toHaveBeenCalledTimes(1);

    await settle();

    expect(store.get(syncLoadable)).toEqual({ state: 'hasData', data: undefined });
    expect(mockSetSequence.mock.calls).toEqual([
      ['standard', NOW],
      ['extra', NOW],
    ]);
  });

  it('runs one sync however many times the launch triggers it and the screen reads it', async () => {
    const { store, syncLoadable, triggerSyncLoadable } = launch({ stored: [TODAY, TOMORROW] });

    triggerSyncLoadable();
    store.get(syncLoadable);
    await settle();
    triggerSyncLoadable();
    store.get(syncLoadable);
    await settle();

    expect(mockHandleAppUpgrade).toHaveBeenCalledTimes(1);
    expect(mockSetSequence).toHaveBeenCalledTimes(2);
  });

  it('reaches the error state the error screen reads when the sync fails with nothing stored', async () => {
    const offline = new TypeError('Network request failed');
    mockFetchYear.mockRejectedValue(offline);
    const { store, syncLoadable, triggerSyncLoadable } = launch({ stored: [] });

    triggerSyncLoadable();
    await settle();

    expect(store.get(syncLoadable)).toEqual({ state: 'hasError', error: offline });
    expect(mockSetSequence).not.toHaveBeenCalled();
  });
});

// =============================================================================
// THE DEFERRED WIDGET PUSH
// =============================================================================

describe('the widget push on the launch path', () => {
  it('settles the sync before the push, and starts the push only after a frame and then a macrotask', async () => {
    // A push that never finishes, so only a sync that does not wait for it can settle
    mockRefreshPrayerWidgets.mockReturnValue(new Promise(() => {}));
    const { store, syncLoadable, triggerSyncLoadable } = launch({ stored: [TODAY, TOMORROW] });

    triggerSyncLoadable();
    await settle();

    expect(store.get(syncLoadable)).toEqual({ state: 'hasData', data: undefined });
    expect(mockRefreshPrayerWidgets).not.toHaveBeenCalled();

    // The frame
    jest.runOnlyPendingTimers();
    expect(mockRefreshPrayerWidgets).not.toHaveBeenCalled();

    // The macrotask queued inside it
    jest.runOnlyPendingTimers();
    expect(mockRefreshPrayerWidgets).toHaveBeenCalledTimes(1);
  });

  it('logs a failed push, and the launch that already settled stays settled', async () => {
    const failure = new Error('widget IO failed');
    mockRefreshPrayerWidgets.mockRejectedValue(failure);
    const { store, syncLoadable, triggerSyncLoadable } = launch({ stored: [TODAY, TOMORROW] });

    triggerSyncLoadable();
    await settle();
    jest.runOnlyPendingTimers();
    jest.runOnlyPendingTimers();
    await settle();

    expect(mockRefreshPrayerWidgets).toHaveBeenCalledTimes(1);
    expect(logger().warn).toHaveBeenCalledWith('WIDGET: Deferred refresh failed', { error: failure });
    expect(store.get(syncLoadable)).toEqual({ state: 'hasData', data: undefined });
  });

  it('waits for the push when a caller does not defer it, as the background task does', async () => {
    let finishPush = () => {};
    mockRefreshPrayerWidgets.mockReturnValue(
      new Promise<void>((resolve) => {
        finishPush = resolve;
      })
    );
    const { sync } = launch({ stored: [TODAY, TOMORROW] });

    let settled = false;
    const syncing = sync().then(() => {
      settled = true;
    });
    await settle();

    expect(mockRefreshPrayerWidgets).toHaveBeenCalledTimes(1);
    expect(settled).toBe(false);

    finishPush();
    await syncing;
    expect(settled).toBe(true);
  });
});

// =============================================================================
// A DEVELOPMENT BUILD
// =============================================================================

describe('whether a launch with today stored downloads the year', () => {
  it.each([
    { build: 'a development build', isDev: true, downloads: [[2026]] },
    { build: 'a prod or preview build', isDev: false, downloads: [] },
  ])('$build: downloads $downloads', async ({ isDev, downloads }) => {
    mockIsDev = isDev;
    const { sync } = launch({ stored: [TODAY, TOMORROW] });

    await sync();

    expect(mockFetchYear.mock.calls).toEqual(downloads);
  });
});
