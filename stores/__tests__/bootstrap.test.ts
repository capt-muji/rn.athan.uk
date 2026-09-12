/**
 * Unit tests for stores/bootstrap.ts
 *
 * The module hydrates the sequences at IMPORT time, so every case has to
 * re-evaluate it inside jest.isolateModules with the mocks already primed —
 * the same pattern shared/__tests__/constants.test.ts uses.
 *
 * What is pinned here is the guard, not the hydration pipeline: since #34 an
 * upgrade only wipes the cache when the cache SHAPE marker moved, so an
 * ordinary version bump must still paint from cache (AUDIT #16).
 */

// =============================================================================
// MOCK SETUP (must be before imports)
// =============================================================================

const mockWasAppUpgraded = jest.fn();
const mockCacheSchemaChanged = jest.fn();

jest.mock('@/stores/version', () => ({
  wasAppUpgraded: () => mockWasAppUpgraded(),
  cacheSchemaChanged: () => mockCacheSchemaChanged(),
}));

const mockGetPrayerByDate = jest.fn();

jest.mock('@/stores/database', () => ({
  getPrayerByDate: (date: Date) => mockGetPrayerByDate(date),
}));

const mockSetSequence = jest.fn();

jest.mock('@/stores/schedule', () => ({
  setSequence: (type: unknown, date: Date) => mockSetSequence(type, date),
}));

const mockStartCountdowns = jest.fn();

jest.mock('@/stores/countdown', () => ({
  startCountdowns: () => mockStartCountdowns(),
}));

import { ScheduleType } from '@/shared/types';

// =============================================================================
// TEST HELPERS
// =============================================================================

/** Re-evaluates stores/bootstrap.ts so its import-time work runs against the current mocks */
const requireFreshBootstrap = () => {
  let mod: typeof import('../bootstrap');
  jest.isolateModules(() => {
    mod = require('../bootstrap');
  });
  return mod!;
};

/** Minimal cached day - bootstrap only checks it is non-null before hydrating */
const cachedDay = { date: '2026-09-12', fajr: '04:45', isha: '20:30' };

beforeEach(() => {
  jest.clearAllMocks();
  mockGetPrayerByDate.mockReturnValue(cachedDay);
});

// =============================================================================
// UPGRADE GUARD TESTS (AUDIT #16)
// =============================================================================

describe('bootstrapFromCache upgrade guard', () => {
  it('hydrates on an ordinary version bump, where the cache is deliberately kept', () => {
    mockWasAppUpgraded.mockReturnValue(true);
    mockCacheSchemaChanged.mockReturnValue(false);

    const mod = requireFreshBootstrap();

    expect(mod.didBootstrapFromCache).toBe(true);
    expect(mockSetSequence).toHaveBeenCalledTimes(2);
    expect(mockSetSequence).toHaveBeenCalledWith(ScheduleType.Standard, expect.any(Date));
    expect(mockSetSequence).toHaveBeenCalledWith(ScheduleType.Extra, expect.any(Date));
    expect(mockStartCountdowns).toHaveBeenCalledTimes(1);
  });

  it('skips hydration when the version bump also moved the cache schema marker', () => {
    mockWasAppUpgraded.mockReturnValue(true);
    mockCacheSchemaChanged.mockReturnValue(true);

    const mod = requireFreshBootstrap();

    expect(mod.didBootstrapFromCache).toBe(false);
    expect(mockSetSequence).not.toHaveBeenCalled();
    expect(mockStartCountdowns).not.toHaveBeenCalled();
  });

  it('skips hydration on a fresh install, where the marker is absent', () => {
    // cacheSchemaChanged() reports true for a missing marker, and a first
    // install has no stored version either - both halves of the guard hold
    mockWasAppUpgraded.mockReturnValue(true);
    mockCacheSchemaChanged.mockReturnValue(true);
    mockGetPrayerByDate.mockReturnValue(null);

    const mod = requireFreshBootstrap();

    expect(mod.didBootstrapFromCache).toBe(false);
    expect(mockSetSequence).not.toHaveBeenCalled();
  });

  it('hydrates on a plain relaunch, no upgrade at all', () => {
    mockWasAppUpgraded.mockReturnValue(false);
    mockCacheSchemaChanged.mockReturnValue(false);

    const mod = requireFreshBootstrap();

    expect(mod.didBootstrapFromCache).toBe(true);
    expect(mockStartCountdowns).toHaveBeenCalledTimes(1);
  });

  it('does not ask the schema question when no upgrade happened', () => {
    mockWasAppUpgraded.mockReturnValue(false);
    mockCacheSchemaChanged.mockReturnValue(true);

    const mod = requireFreshBootstrap();

    // A marker that never matched is irrelevant without a version bump: the
    // running build wrote this cache itself
    expect(mod.didBootstrapFromCache).toBe(true);
    expect(mockCacheSchemaChanged).not.toHaveBeenCalled();
  });
});

// =============================================================================
// CACHE MISS TESTS
// =============================================================================

describe('bootstrapFromCache cache miss', () => {
  it('skips hydration when today has no cached day', () => {
    mockWasAppUpgraded.mockReturnValue(false);
    mockCacheSchemaChanged.mockReturnValue(false);
    mockGetPrayerByDate.mockReturnValue(null);

    const mod = requireFreshBootstrap();

    expect(mod.didBootstrapFromCache).toBe(false);
    expect(mockSetSequence).not.toHaveBeenCalled();
    expect(mockStartCountdowns).not.toHaveBeenCalled();
  });

  it('reports false rather than throwing when the sequence build fails', () => {
    mockWasAppUpgraded.mockReturnValue(false);
    mockCacheSchemaChanged.mockReturnValue(false);
    mockSetSequence.mockImplementation(() => {
      throw new Error('malformed cached day');
    });

    const mod = requireFreshBootstrap();

    expect(mod.didBootstrapFromCache).toBe(false);
    expect(mockStartCountdowns).not.toHaveBeenCalled();
  });
});
