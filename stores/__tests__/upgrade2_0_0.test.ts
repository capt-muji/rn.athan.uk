/**
 * The 2.0.0 upgrade migration, `migrateToLocaleDefaults` (stores/version.ts)
 *
 * The version-guarded language stamp and the dead arabic-names toggle's removal
 * (R6.1/R6.2): upgrading installs are pinned to `en` exactly once, fresh installs
 * keep the key absent so row 39's device-locale following still has a choice, and
 * the no-wipe law holds - no schema bump, every stored family intact.
 */

// =============================================================================
// MOCK SETUP
// =============================================================================

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
jest.mock('@/shared/logger', () => ({ __esModule: true, default: mockLogger }));

// A Map standing in for MMKV with the real module's semantics: JSON-encoded
// values, null on absence, prefix-keeping wipes. The map lives outside the
// isolated launches so a test can seed a population and then read what the
// launch left behind.
const mockStorage = new Map<string, string>();
jest.mock('@/stores/database', () => ({
  getItem: (key: string) => (mockStorage.has(key) ? JSON.parse(mockStorage.get(key) as string) : null),
  setItem: (key: string, value: unknown) => void mockStorage.set(key, JSON.stringify(value)),
  removeItem: (key: string) => void mockStorage.delete(key),
  clearAllExcept: (prefixes: string[]) => {
    for (const key of [...mockStorage.keys()]) {
      if (!prefixes.some((prefix) => key.startsWith(prefix))) mockStorage.delete(key);
    }
  },
}));

const mockMigrate = jest.fn();
jest.mock('@/stores/notifications', () => ({
  lastNotificationScheduleAtom: 'lastNotificationScheduleAtom',
  migrateIndexKeyedAlertPreferences: (storedVersion: string | null) => mockMigrate(storedVersion),
}));

jest.mock('@/stores/storage', () => ({
  resetStoredAtom: () => {},
}));

// =============================================================================
// FIXTURES
// =============================================================================

const INSTALLED = '2.0.0';
const DEAD_KEY = 'preference_show_arabic_names';
const LANGUAGE_KEY = 'preference_language';
const BOOKKEEPING_KEY = 'scheduled_notifications_standard_0_athan_standard_fajr_2026-01-19';

/** A launch with its own module state, since the upgrade check runs once per launch */
const launch = () => {
  let version!: typeof import('../version');
  jest.isolateModules(() => {
    const constants = require('expo-constants');
    constants.mockExpoConfig.version = INSTALLED;
    constants.mockExpoConfig.present = true;
    version = require('../version');
  });
  return version;
};

/** What storage holds before the launch */
const seed = (entries: Record<string, unknown>) => {
  mockStorage.clear();
  for (const [key, value] of Object.entries(entries)) mockStorage.set(key, JSON.stringify(value));
};

const read = (key: string) => (mockStorage.has(key) ? JSON.parse(mockStorage.get(key) as string) : null);
const holds = (key: string) => mockStorage.has(key);

beforeEach(() => {
  jest.clearAllMocks();
});

// =============================================================================
// THE STAMP
// =============================================================================

describe('the 2.0.0 upgrade', () => {
  it('stamps en for an upgrading 1.29.x install and not for a fresh install', () => {
    seed({ app_installed_version: '1.29.305', cache_schema_version: 1, preference_athan_sound: 7 });
    launch().handleAppUpgrade();
    expect(read(LANGUAGE_KEY)).toBe('en');
    expect(mockLogger.info).toHaveBeenCalledWith('VERSION: Stamped upgrade language to en');

    // A fresh install holds the same key absence, so only the captured version
    // can tell the two apart - the key must stay absent (R6.2)
    mockLogger.info.mockClear();
    seed({});
    launch().handleAppUpgrade();
    expect(holds(LANGUAGE_KEY)).toBe(false);
    expect(mockLogger.info).not.toHaveBeenCalledWith('VERSION: Stamped upgrade language to en');
  });

  it('keeps days, records and preferences through the upgrade with no schema bump', () => {
    seed({
      app_installed_version: '1.29.305',
      cache_schema_version: 1,
      'prayer_2026-01-19': { fajr: '06:12' },
      [BOOKKEEPING_KEY]: { id: 'athan_standard_fajr_2026-01-19' },
      preference_athan_sound: 7,
      [DEAD_KEY]: false,
    });
    launch().handleAppUpgrade();

    expect(read('prayer_2026-01-19')).toEqual({ fajr: '06:12' });
    expect(read(BOOKKEEPING_KEY)).toEqual({ id: 'athan_standard_fajr_2026-01-19' });
    expect(read('preference_athan_sound')).toBe(7);
    expect(read(LANGUAGE_KEY)).toBe('en');
    expect(read('cache_schema_version')).toBe(1);
    expect(holds(DEAD_KEY)).toBe(false);
    expect(mockLogger.info).toHaveBeenCalledWith('VERSION: Removed the dead arabic-names toggle key');
  });

  it('carries a pre-marker population through the existing wipe', () => {
    seed({
      app_installed_version: '1.5.1',
      preference_athan_sound: 7,
      'prayer_2026-01-19': { fajr: '06:12' },
      [DEAD_KEY]: true,
    });
    launch().handleAppUpgrade();

    // The missing marker reads as unknown shape, so the wipe runs (UPG-1's fixture)
    expect(holds('prayer_2026-01-19')).toBe(false);
    expect(read('preference_athan_sound')).toBe(7);
    expect(read(LANGUAGE_KEY)).toBe('en');
    expect(holds(DEAD_KEY)).toBe(false);
    expect(mockMigrate).toHaveBeenCalledWith('1.5.1');
  });

  it('is idempotent across relaunches of the same upgraded install', () => {
    seed({ app_installed_version: '1.29.305', cache_schema_version: 1, [DEAD_KEY]: false });
    launch().handleAppUpgrade();

    // The second launch sees the overwritten version key, so the stamp never
    // re-runs and the dead key is already gone
    mockLogger.info.mockClear();
    launch().handleAppUpgrade();
    expect(read(LANGUAGE_KEY)).toBe('en');
    expect(holds(DEAD_KEY)).toBe(false);
    expect(mockLogger.info).not.toHaveBeenCalledWith('VERSION: Removed the dead arabic-names toggle key');
  });
});
