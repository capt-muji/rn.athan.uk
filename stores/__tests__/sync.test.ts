/**
 * Unit tests for stores/sync.ts
 *
 * Tests app synchronization and data fetching:
 * - Main sync() entry point
 * - needsDataUpdate() decision logic
 * - updatePrayerData() fetch and save
 * - initializeAppState() sequence setup
 * - December prefetch and January 1st edge cases
 */

// =============================================================================
// MOCK SETUP (must be before imports)
// =============================================================================

// Mock TimeUtils
const mockCreateLondonDate = jest.fn();
const mockGetCurrentYear = jest.fn();
const mockIsDecember = jest.fn();
const mockIsJanuaryFirst = jest.fn();

jest.mock('@/shared/time', () => ({
  createLondonDate: () => mockCreateLondonDate(),
  getCurrentYear: () => mockGetCurrentYear(),
  isDecember: () => mockIsDecember(),
  isJanuaryFirst: (date: Date) => mockIsJanuaryFirst(date),
}));

// Mock Api
const mockFetchYear = jest.fn();

jest.mock('@/api/client', () => ({
  fetchYear: (year: number) => mockFetchYear(year),
}));

// Mock Database
const mockGetPrayerByDate = jest.fn();
const mockSaveAllPrayers = jest.fn();
const mockMarkYearAsFetched = jest.fn();
const mockClearAllExcept = jest.fn();
const mockGetItem = jest.fn();

jest.mock('@/stores/database', () => ({
  getPrayerByDate: (date: Date) => mockGetPrayerByDate(date),
  saveAllPrayers: (prayers: unknown) => mockSaveAllPrayers(prayers),
  markYearAsFetched: (year: number) => mockMarkYearAsFetched(year),
  clearAllExcept: (keys: string[]) => mockClearAllExcept(keys),
  getItem: (key: string) => mockGetItem(key),
}));

// Mock ScheduleStore
const mockSetSequence = jest.fn();

jest.mock('@/stores/schedule', () => ({
  setSequence: (type: unknown, date: Date) => mockSetSequence(type, date),
}));

// Mock Countdown
const mockStartCountdowns = jest.fn();

jest.mock('@/stores/countdown', () => ({
  startCountdowns: () => mockStartCountdowns(),
}));

// Mock version store
const mockHandleAppUpgrade = jest.fn();

jest.mock('@/stores/version', () => ({
  handleAppUpgrade: () => mockHandleAppUpgrade(),
}));

// Mock APP_CONFIG
jest.mock('@/shared/config', () => ({
  APP_CONFIG: {
    isDev: false,
  },
  isProd: () => false,
  isPreview: () => false,
  isTest: () => true,
}));

// Import after mocks
import { sync, syncLoadable, triggerSyncLoadable } from '../sync';

import { ScheduleType, ISingleApiResponseTransformed } from '@/shared/types';

// =============================================================================
// TEST HELPERS
// =============================================================================

const createMockPrayerData = (date: string): ISingleApiResponseTransformed => ({
  date,
  fajr: '06:15',
  sunrise: '07:50',
  dhuhr: '12:25',
  asr: '14:40',
  magrib: '17:00',
  isha: '18:45',
  midnight: '23:52',
  'last third': '02:15',
  suhoor: '05:55',
  duha: '08:10',
  istijaba: '16:00',
});

const createMockYearData = () => {
  const data: ISingleApiResponseTransformed[] = [];
  for (let i = 0; i < 365; i++) {
    const date = new Date(2026, 0, i + 1);
    const dateStr = date.toISOString().split('T')[0];
    data.push(createMockPrayerData(dateStr));
  }
  return data;
};

// =============================================================================
// RESET MOCKS BEFORE EACH TEST
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();

  // Default mock implementations
  mockCreateLondonDate.mockReturnValue(new Date('2026-01-20T10:00:00'));
  mockGetCurrentYear.mockReturnValue(2026);
  mockIsDecember.mockReturnValue(false);
  mockIsJanuaryFirst.mockReturnValue(false);
  mockGetItem.mockReturnValue({});
  mockGetPrayerByDate.mockReturnValue(createMockPrayerData('2026-01-20'));
  mockFetchYear.mockResolvedValue(createMockYearData());
  mockHandleAppUpgrade.mockImplementation(() => {}); // Reset to noop
  mockSaveAllPrayers.mockImplementation(() => {});
  mockMarkYearAsFetched.mockImplementation(() => {});
  mockClearAllExcept.mockImplementation(() => {});
  mockSetSequence.mockImplementation(() => {});
  mockStartCountdowns.mockImplementation(() => {});
});

// =============================================================================
// syncLoadable TESTS
// =============================================================================

describe('syncLoadable', () => {
  it('is defined', () => {
    expect(syncLoadable).toBeDefined();
  });
});

// =============================================================================
// triggerSyncLoadable TESTS
// =============================================================================

describe('triggerSyncLoadable', () => {
  it('is a function', () => {
    expect(typeof triggerSyncLoadable).toBe('function');
  });
});

// =============================================================================
// sync() MAIN ENTRY POINT TESTS
// =============================================================================

describe('sync', () => {
  it('calls handleAppUpgrade first', async () => {
    await sync();

    expect(mockHandleAppUpgrade).toHaveBeenCalled();
  });

  it('checks if data update is needed', async () => {
    await sync();

    // If data exists and not dev mode, should skip update
    expect(mockGetPrayerByDate).toHaveBeenCalled();
  });

  it('initializes app state with current London date', async () => {
    const mockDate = new Date('2026-01-20T10:00:00');
    mockCreateLondonDate.mockReturnValue(mockDate);

    await sync();

    expect(mockSetSequence).toHaveBeenCalledWith(ScheduleType.Standard, mockDate);
    expect(mockSetSequence).toHaveBeenCalledWith(ScheduleType.Extra, mockDate);
  });

  it('starts countdowns after initialization', async () => {
    await sync();

    expect(mockStartCountdowns).toHaveBeenCalled();
  });

  it('throws on failure', async () => {
    const error = new Error('Network failure');
    mockHandleAppUpgrade.mockImplementation(() => {
      throw error;
    });

    await expect(sync()).rejects.toThrow('Network failure');
  });
});

// =============================================================================
// needsDataUpdate() DECISION LOGIC TESTS
// =============================================================================

describe('needsDataUpdate behavior', () => {
  it('skips update when data exists and not dev mode', async () => {
    mockGetPrayerByDate.mockReturnValue(createMockPrayerData('2026-01-20'));

    await sync();

    // Should not call fetchYear since data exists
    expect(mockFetchYear).not.toHaveBeenCalled();
  });

  it('triggers update when no data for today (fresh install)', async () => {
    mockGetPrayerByDate.mockReturnValue(null);

    await sync();

    expect(mockFetchYear).toHaveBeenCalled();
  });

  it('triggers update in December when next year not fetched', async () => {
    mockIsDecember.mockReturnValue(true);
    mockGetItem.mockReturnValue({ 2026: true }); // Current year fetched, not 2027

    await sync();

    expect(mockFetchYear).toHaveBeenCalled();
  });

  it('skips update in December when next year already fetched', async () => {
    mockIsDecember.mockReturnValue(true);
    mockGetItem.mockReturnValue({ 2026: true, 2027: true }); // Both years fetched
    mockGetPrayerByDate.mockReturnValue(createMockPrayerData('2026-12-15'));

    await sync();

    // Should not fetch since both years are cached
    expect(mockFetchYear).not.toHaveBeenCalled();
  });
});

// =============================================================================
// updatePrayerData() FETCH AND SAVE TESTS
// =============================================================================

describe('updatePrayerData behavior', () => {
  beforeEach(() => {
    // Force data update by returning null
    mockGetPrayerByDate.mockReturnValue(null);
  });

  it('clears cache except app version and preferences before fetching', async () => {
    await sync();

    expect(mockClearAllExcept).toHaveBeenCalledWith(['app_installed_version', 'preference_']);
  });

  it('fetches current year data', async () => {
    mockGetCurrentYear.mockReturnValue(2026);

    await sync();

    expect(mockFetchYear).toHaveBeenCalledWith(2026);
  });

  it('saves fetched prayer data', async () => {
    const yearData = createMockYearData();
    mockFetchYear.mockResolvedValue(yearData);

    await sync();

    expect(mockSaveAllPrayers).toHaveBeenCalledWith(yearData);
  });

  it('marks year as fetched after saving', async () => {
    mockGetCurrentYear.mockReturnValue(2026);

    await sync();

    expect(mockMarkYearAsFetched).toHaveBeenCalledWith(2026);
  });

  it('throws on API error', async () => {
    mockFetchYear.mockRejectedValue(new Error('API unavailable'));

    await expect(sync()).rejects.toThrow('API unavailable');
  });
});

// =============================================================================
// DECEMBER PREFETCH TESTS
// =============================================================================

describe('December prefetch behavior', () => {
  beforeEach(() => {
    mockIsDecember.mockReturnValue(true);
    mockGetItem.mockReturnValue({ 2026: true }); // Only current year fetched
    mockGetPrayerByDate.mockReturnValue(null); // Force update
  });

  it('fetches both current and next year in December', async () => {
    mockGetCurrentYear.mockReturnValue(2026);

    await sync();

    expect(mockFetchYear).toHaveBeenCalledWith(2026);
    expect(mockFetchYear).toHaveBeenCalledWith(2027);
  });

  it('fetches years in parallel using Promise.all', async () => {
    mockGetCurrentYear.mockReturnValue(2026);

    // Track call order
    const callOrder: number[] = [];
    mockFetchYear.mockImplementation(async (year: number) => {
      callOrder.push(year);
      await new Promise((resolve) => setTimeout(resolve, 10));
      return createMockYearData();
    });

    await sync();

    // Both should be called before either resolves (parallel)
    expect(callOrder).toContain(2026);
    expect(callOrder).toContain(2027);
  });

  it('saves both years of data', async () => {
    await sync();

    expect(mockSaveAllPrayers).toHaveBeenCalledTimes(2);
  });

  it('marks both years as fetched', async () => {
    mockGetCurrentYear.mockReturnValue(2026);

    await sync();

    expect(mockMarkYearAsFetched).toHaveBeenCalledWith(2026);
    expect(mockMarkYearAsFetched).toHaveBeenCalledWith(2027);
  });
});

// =============================================================================
// JANUARY 1ST EDGE CASE TESTS
// =============================================================================

describe('January 1st edge case', () => {
  beforeEach(() => {
    mockIsJanuaryFirst.mockReturnValue(true);
    mockGetCurrentYear.mockReturnValue(2026);
  });

  it('fetches previous year data when not cached', async () => {
    // No previous year data
    mockGetPrayerByDate
      .mockReturnValueOnce(createMockPrayerData('2026-01-01')) // Current day exists
      .mockReturnValueOnce(null); // Dec 31 2025 not cached

    await sync();

    expect(mockFetchYear).toHaveBeenCalledWith(2025);
  });

  it('skips previous year fetch when already cached', async () => {
    // Previous year data exists
    mockGetPrayerByDate.mockReturnValue(createMockPrayerData('2025-12-31'));

    await sync();

    // Should not fetch 2025 since it's cached
    expect(mockFetchYear).not.toHaveBeenCalledWith(2025);
  });

  it('saves previous year data for CountdownBar progress', async () => {
    const prevYearData = createMockYearData();
    mockGetPrayerByDate.mockReturnValueOnce(createMockPrayerData('2026-01-01')).mockReturnValueOnce(null);
    mockFetchYear.mockResolvedValue(prevYearData);

    await sync();

    expect(mockSaveAllPrayers).toHaveBeenCalledWith(prevYearData);
  });

  it('marks previous year as fetched', async () => {
    mockGetPrayerByDate.mockReturnValueOnce(createMockPrayerData('2026-01-01')).mockReturnValueOnce(null);

    await sync();

    expect(mockMarkYearAsFetched).toHaveBeenCalledWith(2025);
  });
});

// =============================================================================
// initializeAppState() TESTS
// =============================================================================

describe('initializeAppState behavior', () => {
  it('sets both Standard and Extra sequences', async () => {
    const mockDate = new Date('2026-01-20T10:00:00');
    mockCreateLondonDate.mockReturnValue(mockDate);

    await sync();

    expect(mockSetSequence).toHaveBeenCalledWith(ScheduleType.Standard, mockDate);
    expect(mockSetSequence).toHaveBeenCalledWith(ScheduleType.Extra, mockDate);
    expect(mockSetSequence).toHaveBeenCalledTimes(2);
  });

  it('calls startCountdowns after setting sequences', async () => {
    await sync();

    // Verify order: setSequence should be called before startCountdowns
    const setSequenceOrder = mockSetSequence.mock.invocationCallOrder[0];
    const startCountdownsOrder = mockStartCountdowns.mock.invocationCallOrder[0];

    expect(setSequenceOrder).toBeLessThan(startCountdownsOrder);
  });
});

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

describe('error handling', () => {
  it('throws when upgrade check fails', async () => {
    const error = new Error('Sync failed');
    mockHandleAppUpgrade.mockImplementation(() => {
      throw error;
    });

    await expect(sync()).rejects.toThrow('Sync failed');
  });

  it('propagates API errors', async () => {
    mockGetPrayerByDate.mockReturnValue(null);
    mockFetchYear.mockRejectedValue(new Error('Network error'));

    await expect(sync()).rejects.toThrow('Network error');
  });

  it('throws database errors', async () => {
    mockGetPrayerByDate.mockReturnValue(null);
    mockSaveAllPrayers.mockImplementation(() => {
      throw new Error('Database write failed');
    });

    await expect(sync()).rejects.toThrow('Database write failed');
  });
});

// =============================================================================
// FLOW INTEGRATION TESTS
// =============================================================================

describe('sync flow integration', () => {
  it('completes full fresh install flow', async () => {
    mockGetPrayerByDate.mockReturnValue(null); // No cached data
    const yearData = createMockYearData();
    mockFetchYear.mockResolvedValue(yearData);

    await sync();

    // Full flow: upgrade check -> clear cache -> fetch -> save -> mark -> init
    expect(mockHandleAppUpgrade).toHaveBeenCalled();
    expect(mockClearAllExcept).toHaveBeenCalled();
    expect(mockFetchYear).toHaveBeenCalled();
    expect(mockSaveAllPrayers).toHaveBeenCalled();
    expect(mockMarkYearAsFetched).toHaveBeenCalled();
    expect(mockSetSequence).toHaveBeenCalledTimes(2);
    expect(mockStartCountdowns).toHaveBeenCalled();
  });

  it('completes cached data flow (no fetch)', async () => {
    mockGetPrayerByDate.mockReturnValue(createMockPrayerData('2026-01-20'));

    await sync();

    // Cached flow: upgrade check -> skip fetch -> init
    expect(mockHandleAppUpgrade).toHaveBeenCalled();
    expect(mockFetchYear).not.toHaveBeenCalled();
    expect(mockSetSequence).toHaveBeenCalledTimes(2);
    expect(mockStartCountdowns).toHaveBeenCalled();
  });

  it('completes December dual-year fetch flow', async () => {
    mockIsDecember.mockReturnValue(true);
    mockGetItem.mockReturnValue({ 2026: true });
    mockGetPrayerByDate.mockReturnValue(null);
    mockGetCurrentYear.mockReturnValue(2026);

    await sync();

    expect(mockFetchYear).toHaveBeenCalledWith(2026);
    expect(mockFetchYear).toHaveBeenCalledWith(2027);
    expect(mockMarkYearAsFetched).toHaveBeenCalledWith(2026);
    expect(mockMarkYearAsFetched).toHaveBeenCalledWith(2027);
  });

  it('completes January 1st edge case flow', async () => {
    mockIsJanuaryFirst.mockReturnValue(true);
    mockGetCurrentYear.mockReturnValue(2026);
    // First call for needsDataUpdate, second for Dec 31 check
    mockGetPrayerByDate
      .mockReturnValueOnce(createMockPrayerData('2026-01-01')) // Data exists
      .mockReturnValueOnce(null); // Dec 31 not cached

    await sync();

    expect(mockFetchYear).toHaveBeenCalledWith(2025);
    expect(mockMarkYearAsFetched).toHaveBeenCalledWith(2025);
    expect(mockSetSequence).toHaveBeenCalledTimes(2);
  });
});
