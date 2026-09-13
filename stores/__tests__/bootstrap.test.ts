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

const mockGetPrayerByDateString = jest.fn();

jest.mock('@/stores/database', () => ({
  getPrayerByDateString: (date: string) => mockGetPrayerByDateString(date),
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
  // Cleared mocks keep their implementations, so a sequence build made to fail must not leak into later cases
  mockSetSequence.mockReset();
  mockGetPrayerByDateString.mockReturnValue(cachedDay);
});

afterEach(() => {
  jest.useRealTimers();
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
    // Every day is stored here, so only the guard can have refused
    expect(mockGetPrayerByDateString).not.toHaveBeenCalled();
  });

  it('skips hydration on a fresh install, where the marker is absent', () => {
    // cacheSchemaChanged() reports true for a missing marker, and a first
    // install has no stored version either - both halves of the guard hold
    mockWasAppUpgraded.mockReturnValue(true);
    mockCacheSchemaChanged.mockReturnValue(true);
    mockGetPrayerByDateString.mockReturnValue(null);

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
  it('skips hydration when none of the days the sequences are built from is cached', () => {
    mockWasAppUpgraded.mockReturnValue(false);
    mockCacheSchemaChanged.mockReturnValue(false);
    mockGetPrayerByDateString.mockReturnValue(null);

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

// =============================================================================
// DAYS IT HYDRATES FROM (R7)
// =============================================================================

describe('bootstrapFromCache days it hydrates from', () => {
  // 00:30 BST on 14 September in London, still 13 September in UTC
  const LATE_BST = new Date('2026-09-13T23:30:00Z');

  /** Stores only the given dates */
  const storing = (dates: string[]) =>
    mockGetPrayerByDateString.mockImplementation((date: string) => (dates.includes(date) ? cachedDay : null));

  const askedDates = () => mockGetPrayerByDateString.mock.calls.map(([date]) => date);

  beforeEach(() => {
    mockWasAppUpgraded.mockReturnValue(false);
    mockCacheSchemaChanged.mockReturnValue(false);
  });

  it("asks for London's today and the two days after it, whatever the machine's timezone", () => {
    jest.useFakeTimers({ now: LATE_BST });
    storing([]);

    requireFreshBootstrap();

    expect(askedDates()).toEqual(['2026-09-14', '2026-09-15', '2026-09-16']);
  });

  it.each([
    { stored: 'tomorrow', dates: ['2026-09-15'] },
    { stored: 'the day after tomorrow', dates: ['2026-09-16'] },
  ])('hydrates a launch with today missing when only $stored is cached', ({ dates }) => {
    jest.useFakeTimers({ now: LATE_BST });
    storing(dates);

    const mod = requireFreshBootstrap();

    expect(mod.didBootstrapFromCache).toBe(true);
    expect(mockSetSequence).toHaveBeenCalledWith(ScheduleType.Standard, LATE_BST);
    expect(mockSetSequence).toHaveBeenCalledWith(ScheduleType.Extra, LATE_BST);
    expect(mockStartCountdowns).toHaveBeenCalledTimes(1);
  });

  it.each([
    { stored: 'yesterday', dates: ['2026-09-13'] },
    { stored: 'the third day after today', dates: ['2026-09-17'] },
  ])('keeps the spinner when only $stored is cached', ({ dates }) => {
    jest.useFakeTimers({ now: LATE_BST });
    storing(dates);

    const mod = requireFreshBootstrap();

    expect(mod.didBootstrapFromCache).toBe(false);
    expect(mockSetSequence).not.toHaveBeenCalled();
    expect(mockStartCountdowns).not.toHaveBeenCalled();
  });

  it('runs the days on into next year from 31 December', () => {
    jest.useFakeTimers({ now: new Date('2026-12-31T12:00:00Z') });
    storing(['2027-01-02']);

    const mod = requireFreshBootstrap();

    expect(askedDates()).toEqual(['2026-12-31', '2027-01-01', '2027-01-02']);
    expect(mod.didBootstrapFromCache).toBe(true);
  });
});
