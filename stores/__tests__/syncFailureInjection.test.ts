/**
 * The exhaustive failure-injection rig (T-388, rebuilt for the baked timetable): every step of the
 * launch and foreground sync chain, rejected one per test over a timetable serving days, must leave
 * the home screen's own read hasData.
 *
 * `app/index.tsx` renders the error screen on `syncLoadable`'s hasError alone, and its Refresh wipes, so over
 * readable days that state is a blanked home screen no retry recovers. Each row below walks the chain as the code
 * runs it - the upgrade check, the wait for the timetable to be ready, the sequence rebuild, the countdowns, both
 * widget pushes - and rejects exactly one step. The launch rows drive `triggerSyncLoadable` (what `_layout` calls
 * once); the foreground rows drive a bare `sync()` after a settled launch. A red row names a real thrower a
 * production user could hit.
 *
 * Runs the real sync, storage, time and notifications modules over a fresh module graph per test; the
 * upgrade check, the sequences, the countdowns, the widgets and the timetable's readiness are
 * stubbed at the same boundaries the suites for those modules own.
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
      return { ...actual.APP_CONFIG, isDev: mockIsDev };
    },
  };
});

// The timetable's readiness is the chain's one wait; the reader itself stays real so installed
// days serve, except where a row injects a read failure
let mockReadyError: Error | null = null;
let mockReadError: Error | null = null;
jest.mock('@/stores/timetable', () => {
  const actual = jest.requireActual<typeof import('@/stores/timetable')>('@/stores/timetable');
  return {
    ...actual,
    ensureTimetableReady: () => (mockReadyError ? Promise.reject(mockReadyError) : Promise.resolve()),
    getTimetableDay: (date: string) => {
      if (mockReadError) throw mockReadError;
      return actual.getTimetableDay(date);
    },
  };
});

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

/** A fresh sync module and default store, as a cold launch has them, with the given days readable */
const launch = ({ stored, now = SEPTEMBER_NOW }: { stored: string[]; now?: Date }) => {
  jest.setSystemTime(now);
  const sync = require('@/stores/sync') as typeof import('@/stores/sync');
  const Timetable = require('@/stores/timetable') as typeof import('@/stores/timetable');
  const { getDefaultStore } = require('jotai/vanilla') as typeof import('jotai/vanilla');
  Timetable.__installTimetableDays(stored.map(day));
  return { ...sync, store: getDefaultStore() };
};

/** Microtasks only, so the fake clock holds every timer */
const settle = async () => {
  for (let tick = 0; tick < 50; tick += 1) await Promise.resolve();
};

const logger = () => (require('@/shared/logger') as typeof import('@/shared/logger')).default;

const failure = () => new Error('injected step failure');

const hasData = { state: 'hasData', data: undefined } as const;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  jest.useFakeTimers({ now: SEPTEMBER_NOW });
  mockIsDev = false;
  mockReadyError = null;
  mockReadError = null;
  mockHandleAppUpgrade.mockImplementation(() => {});
  mockSetSequence.mockImplementation(() => {});
  mockStartCountdowns.mockImplementation(() => {});
  mockRefreshPrayerWidgets.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

// =============================================================================
// THE LAUNCH CHAIN, ONE STEP REJECTED PER TEST OVER READABLE DAYS
// =============================================================================

describe('the launch chain with one step rejected over readable days', () => {
  it('completes on its readable days when the upgrade check rejects', async () => {
    const error = failure();
    mockHandleAppUpgrade.mockImplementation(() => {
      throw error;
    });
    const { store, syncLoadable, triggerSyncLoadable } = launch({ stored: [TODAY, TOMORROW] });

    triggerSyncLoadable();
    await settle();

    expect(store.get(syncLoadable)).toEqual(hasData);
  });

  it('completes on its readable days when the timetable never becomes ready', async () => {
    mockReadyError = failure();
    const { store, syncLoadable, triggerSyncLoadable } = launch({ stored: [TODAY, TOMORROW] });

    triggerSyncLoadable();
    await settle();

    expect(store.get(syncLoadable)).toEqual(hasData);
    expect(logger().warn).toHaveBeenCalledWith(
      'SYNC: The baked timetable is not readable, showing the days already readable',
      { error: mockReadyError }
    );
  });

  it('completes when rebuilding a sequence rejects', async () => {
    mockSetSequence.mockImplementation(() => {
      throw failure();
    });
    const { store, syncLoadable, triggerSyncLoadable } = launch({ stored: [TODAY, TOMORROW] });

    triggerSyncLoadable();
    await settle();

    expect(store.get(syncLoadable)).toEqual(hasData);
  });

  it('completes when starting the countdowns rejects', async () => {
    mockStartCountdowns.mockImplementation(() => {
      throw failure();
    });
    const { store, syncLoadable, triggerSyncLoadable } = launch({ stored: [TODAY, TOMORROW] });

    triggerSyncLoadable();
    await settle();

    expect(store.get(syncLoadable)).toEqual(hasData);
  });

  it('still throws when the upgrade check rejects with nothing readable', async () => {
    const error = failure();
    mockHandleAppUpgrade.mockImplementation(() => {
      throw error;
    });
    const { store, syncLoadable, triggerSyncLoadable } = launch({ stored: [] });

    triggerSyncLoadable();
    await settle();

    expect(store.get(syncLoadable)).toEqual({ state: 'hasError', error });
  });

  it('completes over installed days when the usable-days read itself rejects, the failed read answering usable', async () => {
    // The stage fails too, so the failure gate behind it asks which days are readable, and that read throws
    mockReadyError = failure();
    mockReadError = failure();
    const { store, syncLoadable, triggerSyncLoadable } = launch({ stored: [TODAY, TOMORROW] });

    triggerSyncLoadable();
    await settle();

    expect(store.get(syncLoadable)).toEqual(hasData);
    mockReadError = null;
  });

  it('completes when the deferred widget push rejects, and warns one line', async () => {
    mockRefreshPrayerWidgets.mockRejectedValue(failure());
    const { store, syncLoadable, triggerSyncLoadable } = launch({ stored: [TODAY, TOMORROW] });

    triggerSyncLoadable();
    await settle();
    jest.runAllTimers();
    await settle();

    expect(store.get(syncLoadable)).toEqual(hasData);
    expect(logger().warn).toHaveBeenCalledWith('WIDGET: Deferred refresh failed', { error: expect.any(Error) });
  });

  it('settles without waiting for the notification refresh the home screen schedules once data lands', async () => {
    const { syncLoadable, triggerSyncLoadable, store } = launch({ stored: [TODAY, TOMORROW] });

    triggerSyncLoadable();
    await settle();

    expect(mockRefreshPrayerWidgets).not.toHaveBeenCalled();
    expect(store.get(syncLoadable)).toEqual(hasData);
  });
});

// =============================================================================
// THE SAME STEPS OVER A TIMETABLE SERVING NOTHING
// =============================================================================

describe('the same steps over a timetable serving nothing', () => {
  it('still throws when the timetable never becomes ready and nothing is readable', async () => {
    mockReadyError = failure();
    const { store, syncLoadable, triggerSyncLoadable } = launch({ stored: [] });

    triggerSyncLoadable();
    await settle();

    expect(store.get(syncLoadable)).toEqual({ state: 'hasError', error: mockReadyError });
  });

  it('still throws when rebuilding a sequence rejects with nothing readable', async () => {
    mockSetSequence.mockImplementation(() => {
      throw failure();
    });
    const { store, syncLoadable, triggerSyncLoadable } = launch({ stored: [] });

    triggerSyncLoadable();
    await settle();

    expect(store.get(syncLoadable)).toEqual({ state: 'hasError', error: expect.any(Error) });
  });

  it('still throws when starting the countdowns rejects with nothing readable', async () => {
    mockStartCountdowns.mockImplementation(() => {
      throw failure();
    });
    const { store, syncLoadable, triggerSyncLoadable } = launch({ stored: [] });

    triggerSyncLoadable();
    await settle();

    expect(store.get(syncLoadable)).toEqual({ state: 'hasError', error: expect.any(Error) });
  });
});

// =============================================================================
// THE FOREGROUND CHAIN
// =============================================================================

describe('the foreground chain with one step rejected over readable days', () => {
  it('completes when the upgrade check rejects', async () => {
    mockHandleAppUpgrade.mockImplementation(() => {
      throw failure();
    });
    const { sync } = launch({ stored: [TODAY, TOMORROW] });

    await expect(sync()).resolves.toBeUndefined();
  });

  it('completes when the timetable never becomes ready', async () => {
    mockReadyError = failure();
    const { sync } = launch({ stored: [TODAY, TOMORROW] });

    await expect(sync({ deferWidgetRefresh: false })).resolves.toBeUndefined();
    expect(logger().warn).toHaveBeenCalledWith(
      'SYNC: The baked timetable is not readable, showing the days already readable',
      { error: mockReadyError }
    );
  });

  it('completes when the awaited widget push rejects, warns one line, and leaves the home screen on its data', async () => {
    const error = failure();
    mockRefreshPrayerWidgets.mockRejectedValue(error);
    const { sync } = launch({ stored: [TODAY, TOMORROW] });

    await expect(sync({ deferWidgetRefresh: false })).resolves.toBeUndefined();

    expect(logger().warn).toHaveBeenCalledTimes(1);
    expect(logger().warn).toHaveBeenCalledWith('WIDGET: Awaited refresh failed', { error });
    expect(logger().error).not.toHaveBeenCalled();
  });
});
