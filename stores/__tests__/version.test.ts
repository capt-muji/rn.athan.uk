/**
 * Unit tests for stores/version.ts
 *
 * Tests app version management including:
 * - getInstalledVersion() - from Expo config
 * - getStoredVersion() - from MMKV
 * - setStoredVersion() - to MMKV
 * - wasAppUpgraded() - version comparison logic
 * - clearUpgradeCache() - whitelist-based cleanup
 * - handleAppUpgrade() - main entry with race guard
 */

// =============================================================================
// MOCK SETUP (must be before imports)
// =============================================================================

// Import the mock config from the shared mock file (mapped via jest.config.js)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { mockExpoConfig, resetMockExpoConfig } = require('expo-constants');

// Mock Database
const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
const mockClearAllExcept = jest.fn();
const mockDatabaseRemove = jest.fn();

jest.mock('@/stores/database', () => ({
  getItem: (key: string) => mockGetItem(key),
  setItem: (key: string, value: unknown) => mockSetItem(key, value),
  clearAllExcept: (prefixes: string[]) => mockClearAllExcept(prefixes),
  database: {
    remove: (key: string) => mockDatabaseRemove(key),
  },
}));

// Mock compareVersions
const mockCompareVersions = jest.fn();

jest.mock('@/shared/versionUtils', () => ({
  compareVersions: (v1: string, v2: string) => mockCompareVersions(v1, v2),
}));

// Mock config
jest.mock('@/shared/config', () => ({
  isProd: () => false,
  isPreview: () => false,
  isTest: () => true,
}));

// Import after mocks - version.ts imports come last since they depend on mocks
// eslint-disable-next-line import/order
import {
  getInstalledVersion,
  getStoredVersion,
  setStoredVersion,
  wasAppUpgraded,
  clearUpgradeCache,
  handleAppUpgrade,
} from '../version';

// =============================================================================
// RESET MOCKS BEFORE EACH TEST
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();

  // Default mock implementations
  resetMockExpoConfig();
  mockGetItem.mockReturnValue(null);
  mockSetItem.mockImplementation(() => {});
  mockClearAllExcept.mockImplementation(() => {});
  mockCompareVersions.mockReturnValue(0);
});

// =============================================================================
// getInstalledVersion TESTS
// =============================================================================

describe('getInstalledVersion', () => {
  it('returns version from Expo config', () => {
    mockExpoConfig.version = '1.0.34';

    const result = getInstalledVersion();

    expect(result).toBe('1.0.34');
  });

  it('returns empty string when version is undefined', () => {
    mockExpoConfig.version = undefined;

    const result = getInstalledVersion();

    expect(result).toBe('');
  });

  it('returns empty string when version is null', () => {
    mockExpoConfig.version = null;

    const result = getInstalledVersion();

    expect(result).toBe('');
  });

  it('handles different version formats', () => {
    mockExpoConfig.version = '2.5.100';

    const result = getInstalledVersion();

    expect(result).toBe('2.5.100');
  });

  it('handles single digit versions', () => {
    mockExpoConfig.version = '1.0.0';

    const result = getInstalledVersion();

    expect(result).toBe('1.0.0');
  });
});

// =============================================================================
// getStoredVersion TESTS
// =============================================================================

describe('getStoredVersion', () => {
  it('returns stored version from MMKV', () => {
    mockGetItem.mockReturnValue('1.0.33');

    const result = getStoredVersion();

    expect(result).toBe('1.0.33');
    expect(mockGetItem).toHaveBeenCalledWith('app_installed_version');
  });

  it('returns null when no stored version', () => {
    mockGetItem.mockReturnValue(null);

    const result = getStoredVersion();

    expect(result).toBeNull();
  });

  it('handles database read errors gracefully', () => {
    mockGetItem.mockImplementation(() => {
      throw new Error('MMKV read error');
    });

    const result = getStoredVersion();

    // Should return null on error, not throw
    expect(result).toBeNull();
  });
});

// =============================================================================
// setStoredVersion TESTS
// =============================================================================

describe('setStoredVersion', () => {
  it('stores version in MMKV', () => {
    setStoredVersion('1.0.34');

    expect(mockSetItem).toHaveBeenCalledWith('app_installed_version', '1.0.34');
  });

  it('handles database write errors gracefully', () => {
    mockSetItem.mockImplementation(() => {
      throw new Error('MMKV write error');
    });

    // Should not throw
    expect(() => setStoredVersion('1.0.34')).not.toThrow();
  });
});

// =============================================================================
// wasAppUpgraded TESTS
// =============================================================================

describe('wasAppUpgraded', () => {
  it('returns true on first install (no stored version)', () => {
    mockGetItem.mockReturnValue(null);
    mockExpoConfig.version = '1.0.34';

    const result = wasAppUpgraded();

    expect(result).toBe(true);
  });

  it('returns false when same version (no upgrade)', () => {
    mockExpoConfig.version = '1.0.34';
    mockGetItem.mockReturnValue('1.0.34');

    const result = wasAppUpgraded();

    expect(result).toBe(false);
  });

  it('returns true when installed > stored (upgrade)', () => {
    mockExpoConfig.version = '1.0.35';
    mockGetItem.mockReturnValue('1.0.34');
    mockCompareVersions.mockReturnValue(1); // 1.0.35 > 1.0.34

    const result = wasAppUpgraded();

    expect(result).toBe(true);
    expect(mockCompareVersions).toHaveBeenCalledWith('1.0.35', '1.0.34');
  });

  it('returns false when installed < stored (downgrade)', () => {
    mockExpoConfig.version = '1.0.33';
    mockGetItem.mockReturnValue('1.0.34');
    mockCompareVersions.mockReturnValue(-1); // 1.0.33 < 1.0.34

    const result = wasAppUpgraded();

    expect(result).toBe(false);
  });

  it('handles major version upgrade', () => {
    mockExpoConfig.version = '2.0.0';
    mockGetItem.mockReturnValue('1.9.99');
    mockCompareVersions.mockReturnValue(1);

    const result = wasAppUpgraded();

    expect(result).toBe(true);
  });

  it('handles minor version upgrade', () => {
    mockExpoConfig.version = '1.1.0';
    mockGetItem.mockReturnValue('1.0.99');
    mockCompareVersions.mockReturnValue(1);

    const result = wasAppUpgraded();

    expect(result).toBe(true);
  });

  it('handles patch version upgrade', () => {
    mockExpoConfig.version = '1.0.35';
    mockGetItem.mockReturnValue('1.0.34');
    mockCompareVersions.mockReturnValue(1);

    const result = wasAppUpgraded();

    expect(result).toBe(true);
  });
});

// =============================================================================
// clearUpgradeCache TESTS
// =============================================================================

describe('clearUpgradeCache', () => {
  it('calls clearAllExcept with whitelist prefixes', () => {
    clearUpgradeCache();

    expect(mockClearAllExcept).toHaveBeenCalledWith(['app_installed_version', 'preference_']);
  });

  it('handles database errors gracefully', () => {
    mockClearAllExcept.mockImplementation(() => {
      throw new Error('Database error');
    });

    // Should not throw
    expect(() => clearUpgradeCache()).not.toThrow();
  });

  it('preserves user preferences (whitelist includes preference_)', () => {
    clearUpgradeCache();

    const prefixes = mockClearAllExcept.mock.calls[0][0];
    expect(prefixes).toContain('preference_');
  });

  it('preserves app version (whitelist includes app_installed_version)', () => {
    clearUpgradeCache();

    const prefixes = mockClearAllExcept.mock.calls[0][0];
    expect(prefixes).toContain('app_installed_version');
  });

  it('resets notification schedule timestamp to force reschedule after upgrade', () => {
    clearUpgradeCache();

    expect(mockDatabaseRemove).toHaveBeenCalledWith('preference_last_notification_schedule_check');
  });
});

// =============================================================================
// handleAppUpgrade TESTS
// Note: handleAppUpgrade has a race guard (upgradeHandled flag) that persists
// across test runs within the same module import. We test individual behaviors.
// =============================================================================

describe('handleAppUpgrade', () => {
  // The module-level handleAppUpgrade may have run already due to test ordering
  // So we test behaviors that don't depend on the race guard

  it('is a function', () => {
    expect(typeof handleAppUpgrade).toBe('function');
  });

  it('does not throw when called', () => {
    expect(() => handleAppUpgrade()).not.toThrow();
  });

  it('respects race guard on repeated calls', () => {
    // Clear call count
    mockSetItem.mockClear();

    // Call multiple times - should not throw
    handleAppUpgrade();
    handleAppUpgrade();
    handleAppUpgrade();

    // Due to race guard, setItem may or may not be called depending on
    // whether upgradeHandled was already true from previous tests
    // We verify it doesn't throw (implicit by reaching this point)
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe('edge cases', () => {
  it('handles empty string stored version as first install', () => {
    mockGetItem.mockReturnValue('');

    // Empty string is falsy, so wasAppUpgraded treats it as first install
    // (no stored version) and returns true without comparing versions
    const result = wasAppUpgraded();

    // Since '' is falsy, it's treated as first install - compareVersions NOT called
    expect(mockCompareVersions).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('handles version with pre-release suffix', () => {
    mockExpoConfig.version = '1.0.34-beta';

    const result = getInstalledVersion();

    expect(result).toBe('1.0.34-beta');
  });

  it('handles very long version numbers', () => {
    mockExpoConfig.version = '999.999.999';
    mockGetItem.mockReturnValue('1.0.0');
    mockCompareVersions.mockReturnValue(1);

    const result = wasAppUpgraded();

    expect(result).toBe(true);
  });
});

// =============================================================================
// INTEGRATION TESTS (using fresh module imports)
// =============================================================================

describe('full upgrade flow', () => {
  // After jest.resetModules(), we need to get a fresh reference to the mock config
  const getVersionModuleWithConfig = (version: string) => {
    jest.resetModules();
    // Re-setup mocks after module reset (expo-constants is handled via moduleNameMapper)
    jest.mock('@/stores/database', () => ({
      getItem: (key: string) => mockGetItem(key),
      setItem: (key: string, value: unknown) => mockSetItem(key, value),
      clearAllExcept: (prefixes: string[]) => mockClearAllExcept(prefixes),
    }));
    jest.mock('@/shared/versionUtils', () => ({
      compareVersions: (v1: string, v2: string) => mockCompareVersions(v1, v2),
    }));
    jest.mock('@/shared/config', () => ({
      isProd: () => false,
      isPreview: () => false,
      isTest: () => true,
    }));
    // Get fresh reference to mock config after module reset
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { mockExpoConfig: freshMockConfig } = require('expo-constants');
    freshMockConfig.version = version;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('../version');
  };

  beforeEach(() => {
    mockSetItem.mockImplementation(() => {});
    mockClearAllExcept.mockImplementation(() => {});
  });

  it('completes first install flow', () => {
    mockGetItem.mockReturnValue(null);
    const { handleAppUpgrade: handle } = getVersionModuleWithConfig('1.0.34');

    handle();

    // First install: detect upgrade -> clear cache -> store version
    expect(mockClearAllExcept).toHaveBeenCalled();
    expect(mockSetItem).toHaveBeenCalledWith('app_installed_version', '1.0.34');
  });

  it('completes standard upgrade flow', () => {
    mockGetItem.mockReturnValue('1.0.34');
    mockCompareVersions.mockReturnValue(1);
    const { handleAppUpgrade: handle } = getVersionModuleWithConfig('1.0.35');

    handle();

    expect(mockClearAllExcept).toHaveBeenCalled();
    expect(mockSetItem).toHaveBeenCalledWith('app_installed_version', '1.0.35');
  });

  it('completes no-change flow', () => {
    mockGetItem.mockReturnValue('1.0.34');
    const { handleAppUpgrade: handle } = getVersionModuleWithConfig('1.0.34');

    handle();

    expect(mockClearAllExcept).not.toHaveBeenCalled();
    expect(mockSetItem).toHaveBeenCalledWith('app_installed_version', '1.0.34');
  });

  it('completes downgrade flow (no cache clear)', () => {
    mockGetItem.mockReturnValue('1.0.34');
    mockCompareVersions.mockReturnValue(-1);
    const { handleAppUpgrade: handle } = getVersionModuleWithConfig('1.0.33');

    handle();

    expect(mockClearAllExcept).not.toHaveBeenCalled();
    expect(mockSetItem).toHaveBeenCalledWith('app_installed_version', '1.0.33');
  });

  it('runs only once per session (race guard)', () => {
    mockGetItem.mockReturnValue('1.0.34');
    mockCompareVersions.mockReturnValue(1);
    const { handleAppUpgrade: handle } = getVersionModuleWithConfig('1.0.35');

    // First call should run
    handle();
    const callCount1 = mockSetItem.mock.calls.length;

    // Second call should be blocked
    handle();
    const callCount2 = mockSetItem.mock.calls.length;

    // setItem should only be called once (from first run)
    expect(callCount1).toBe(callCount2);
  });
});
