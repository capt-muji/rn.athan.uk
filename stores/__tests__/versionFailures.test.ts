/**
 * The upgrade check when reading the config or reopening the notification gate throws (stores/version.ts)
 *
 * `handleAppUpgrade` runs first in every launch sync, and a throw there rejects the sync: the error screen goes up,
 * and on a launch with nothing stored its only button wipes. Two of its steps may therefore fail quietly. A config
 * that cannot be read counts as no version at all, which skips the check without stamping anything. A gate that
 * cannot be reopened costs at most one twelve-hour wait for the forced reschedule, and never the version stamp, the
 * cache shape marker or the preference migration that must run before any alarm is armed.
 */

// =============================================================================
// MOCK SETUP
// =============================================================================

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
jest.mock('@/shared/logger', () => ({ __esModule: true, default: mockLogger }));

const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
const mockClearAllExcept = jest.fn();
jest.mock('@/stores/database', () => ({
  getItem: (key: string) => mockGetItem(key),
  setItem: (key: string, value: unknown) => mockSetItem(key, value),
  clearAllExcept: (prefixes: string[]) => mockClearAllExcept(prefixes),
}));

const mockMigrate = jest.fn();
jest.mock('@/stores/notifications', () => ({
  lastNotificationScheduleAtom: 'lastNotificationScheduleAtom',
  migrateIndexKeyedAlertPreferences: (storedVersion: string | null) => mockMigrate(storedVersion),
}));

const mockResetStoredAtom = jest.fn();
jest.mock('@/stores/storage', () => ({
  resetStoredAtom: (atom: unknown, key: string) => mockResetStoredAtom(atom, key),
}));

// =============================================================================
// FIXTURES
// =============================================================================

const INSTALLED = '1.27.16';
const PREVIOUS = '1.27.15';
const GATE_KEY = 'preference_last_notification_schedule_check';

/** A launch with its own module state, since the upgrade check runs once per launch */
const launch = ({ configThrows }: { configThrows?: Error } = {}) => {
  let version!: typeof import('@/stores/version');
  jest.isolateModules(() => {
    const constants = require('expo-constants');
    constants.mockExpoConfig.version = INSTALLED;
    constants.mockExpoConfig.present = true;
    if (configThrows) {
      jest.spyOn(constants.default, 'expoConfig', 'get').mockImplementation(() => {
        throw configThrows;
      });
    }
    version = require('@/stores/version');
  });
  return version;
};

/** What storage holds before the launch: the version last run, and the cache shape marker if one was written */
const storageHolding = (stored: Record<string, unknown>) => {
  mockGetItem.mockImplementation((key: string) => (key in stored ? stored[key] : null));
};

const stamps = () => mockSetItem.mock.calls.map(([key]) => key);

beforeEach(() => {
  jest.clearAllMocks();
  mockSetItem.mockImplementation(() => {});
  mockClearAllExcept.mockImplementation(() => {});
  mockResetStoredAtom.mockImplementation(() => {});
});

// =============================================================================
// A CONFIG THAT THROWS
// =============================================================================

describe('when reading the installed version throws', () => {
  const unreadable = new Error('manifest unreadable');

  it('reads the version as absent and says why', () => {
    const { getInstalledVersion } = launch({ configThrows: unreadable });

    expect(getInstalledVersion()).toBe('');
    expect(mockLogger.warn).toHaveBeenCalledWith('VERSION: Failed to read installed version', { error: unreadable });
  });

  it('skips the upgrade check without throwing, stamping, wiping or migrating, where a readable config does all but the wipe', () => {
    const stored = { app_installed_version: PREVIOUS, cache_schema_version: 1 };

    storageHolding(stored);
    expect(() => launch({ configThrows: unreadable }).handleAppUpgrade()).not.toThrow();

    expect(stamps()).toEqual([]);
    expect(mockClearAllExcept).not.toHaveBeenCalled();
    expect(mockResetStoredAtom).not.toHaveBeenCalled();
    expect(mockMigrate).not.toHaveBeenCalled();

    // The same launch with the config readable, so the assertions above cannot pass by the check never running
    jest.clearAllMocks();
    storageHolding(stored);
    launch().handleAppUpgrade();

    expect(stamps()).toEqual(['app_installed_version', 'cache_schema_version']);
    expect(mockResetStoredAtom).toHaveBeenCalledWith('lastNotificationScheduleAtom', GATE_KEY);
    expect(mockMigrate).toHaveBeenCalledWith(PREVIOUS);
  });
});

// =============================================================================
// A GATE RESET THAT THROWS
// =============================================================================

describe('when reopening the notification gate throws on an update', () => {
  const failure = new Error('MMKV remove failed');

  it.each([
    { update: 'that keeps the cache shape', marker: 1, wipes: false },
    { update: 'that changes the cache shape', marker: null, wipes: true },
  ])('an update $update still stamps, migrates and reports the gate alone', ({ marker, wipes }) => {
    storageHolding({ app_installed_version: PREVIOUS, cache_schema_version: marker });
    mockResetStoredAtom.mockImplementation(() => {
      throw failure;
    });

    expect(() => launch().handleAppUpgrade()).not.toThrow();

    expect(mockResetStoredAtom).toHaveBeenCalledWith('lastNotificationScheduleAtom', GATE_KEY);
    expect(mockLogger.warn).toHaveBeenCalledWith('VERSION: Failed to reset notification schedule timestamp', {
      error: failure,
    });
    expect(mockClearAllExcept).toHaveBeenCalledTimes(wipes ? 1 : 0);
    // A wipe that finished is not reported as a failed one
    expect(mockLogger.error).not.toHaveBeenCalled();
    expect(mockSetItem).toHaveBeenCalledWith('app_installed_version', INSTALLED);
    expect(mockSetItem).toHaveBeenCalledWith('cache_schema_version', 1);
    expect(mockMigrate).toHaveBeenCalledWith(PREVIOUS);
  });
});
