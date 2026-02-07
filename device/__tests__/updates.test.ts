/**
 * Unit tests for device/updates.ts
 *
 * Tests app update checking and store opening including:
 * - checkForUpdates() - 24h throttle, version fetching, comparison
 * - openStore() - opening App Store / Play Store URLs
 */

// =============================================================================
// MOCK SETUP (must be before imports)
// =============================================================================

const mockIsProd = jest.fn().mockReturnValue(false);
const mockGetInstalledVersion = jest.fn().mockReturnValue('1.0.33');
const mockGetPopupUpdateLastCheck = jest.fn().mockReturnValue(0);
const mockSetPopupUpdateLastCheck = jest.fn();
const mockIsNewerVersion = jest.fn().mockReturnValue(false);
const mockOpenURL = jest.fn().mockResolvedValue(undefined);
const mockLoggerWarn = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('@/shared/config', () => ({
  APP_CONFIG: {
    iosAppId: '123456789',
    androidPackage: 'com.mugtaba.athan',
  },
  isProd: () => mockIsProd(),
  isPreview: () => false,
  isTest: () => true,
}));

jest.mock('@/shared/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
    error: (...args: unknown[]) => mockLoggerError(...args),
    debug: jest.fn(),
  },
}));

jest.mock('@/stores/version', () => ({
  getInstalledVersion: () => mockGetInstalledVersion(),
}));

jest.mock('@/stores/ui', () => ({
  getPopupUpdateLastCheck: () => mockGetPopupUpdateLastCheck(),
  setPopupUpdateLastCheck: (ts: number) => mockSetPopupUpdateLastCheck(ts),
}));

jest.mock('@/shared/versionUtils', () => ({
  isNewerVersion: (installed: string, remote: string) => mockIsNewerVersion(installed, remote),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Linking: { openURL: (...args: unknown[]) => mockOpenURL(...args) },
}));

// Global fetch mock
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { checkForUpdates, openStore } from '../updates';

// =============================================================================
// SETUP
// =============================================================================

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

beforeEach(() => {
  jest.clearAllMocks();
  mockIsProd.mockReturnValue(false);
  mockGetInstalledVersion.mockReturnValue('1.0.33');
  mockGetPopupUpdateLastCheck.mockReturnValue(0);
  mockSetPopupUpdateLastCheck.mockReset();
  mockIsNewerVersion.mockReturnValue(false);
  mockFetch.mockReset();
  mockOpenURL.mockResolvedValue(undefined);
});

// =============================================================================
// checkForUpdates TESTS
// =============================================================================

describe('checkForUpdates', () => {
  // ---------------------------------------------------------------------------
  // 24-hour throttle
  // ---------------------------------------------------------------------------

  it('returns false if checked within 24 hours', async () => {
    mockGetPopupUpdateLastCheck.mockReturnValue(Date.now() - ONE_DAY_MS + 60000);

    const result = await checkForUpdates();

    expect(result).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockSetPopupUpdateLastCheck).not.toHaveBeenCalled();
  });

  it('proceeds if last check was more than 24 hours ago', async () => {
    mockGetPopupUpdateLastCheck.mockReturnValue(Date.now() - ONE_DAY_MS - 1);
    mockFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          production: { updatePopup: { ios: { version: '1.0.33' }, android: { version: '1.0.33' } } },
          uat: { updatePopup: { ios: { version: '1.0.33' }, android: { version: '1.0.33' } } },
        }),
    });

    const result = await checkForUpdates();

    expect(mockFetch).toHaveBeenCalled();
    expect(mockIsNewerVersion).toHaveBeenCalledWith('1.0.33', '1.0.33');
    expect(result).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Production iOS: iTunes API
  // ---------------------------------------------------------------------------

  it('fetches from iTunes API when production iOS', async () => {
    mockIsProd.mockReturnValue(true);
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ results: [{ version: '1.0.34' }] }),
    });
    mockIsNewerVersion.mockReturnValue(true);

    const result = await checkForUpdates();

    expect(mockFetch).toHaveBeenCalledWith('https://itunes.apple.com/lookup?bundleId=com.mugtaba.athan&country=gb', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    expect(mockIsNewerVersion).toHaveBeenCalledWith('1.0.33', '1.0.34');
    expect(result).toBe(true);
  });

  it('returns false when iTunes API returns empty results', async () => {
    mockIsProd.mockReturnValue(true);
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ results: [] }),
    });

    const result = await checkForUpdates();

    expect(result).toBe(false);
    expect(mockIsNewerVersion).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // UAT iOS: releases.json
  // ---------------------------------------------------------------------------

  it('fetches from releases.json for UAT iOS', async () => {
    mockIsProd.mockReturnValue(false);
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          production: { updatePopup: { ios: { version: '1.0.30' }, android: { version: '1.0.30' } } },
          uat: { updatePopup: { ios: { version: '2.0.0' }, android: { version: '1.5.0' } } },
        }),
    });
    mockIsNewerVersion.mockReturnValue(true);

    const result = await checkForUpdates();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://raw.githubusercontent.com/capt-muji/rn.athan.uk/main/releases.json',
      { headers: { 'Cache-Control': 'no-cache' } }
    );
    expect(mockIsNewerVersion).toHaveBeenCalledWith('1.0.33', '2.0.0');
    expect(result).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Version comparison results
  // ---------------------------------------------------------------------------

  it('returns true when store version is newer than installed', async () => {
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          production: { updatePopup: { ios: { version: '1.0.34' }, android: { version: '1.0.34' } } },
          uat: { updatePopup: { ios: { version: '1.0.34' }, android: { version: '1.0.34' } } },
        }),
    });
    mockIsNewerVersion.mockReturnValue(true);

    const result = await checkForUpdates();

    expect(mockIsNewerVersion).toHaveBeenCalledWith('1.0.33', '1.0.34');
    expect(result).toBe(true);
  });

  it('returns false when installed version is current', async () => {
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          production: { updatePopup: { ios: { version: '1.0.33' }, android: { version: '1.0.33' } } },
          uat: { updatePopup: { ios: { version: '1.0.33' }, android: { version: '1.0.33' } } },
        }),
    });
    mockIsNewerVersion.mockReturnValue(false);

    const result = await checkForUpdates();

    expect(mockIsNewerVersion).toHaveBeenCalledWith('1.0.33', '1.0.33');
    expect(result).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Error handling
  // ---------------------------------------------------------------------------

  it('returns false on network failure (fetch throws)', async () => {
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await checkForUpdates();

    expect(result).toBe(false);
    expect(mockIsNewerVersion).not.toHaveBeenCalled();
  });

  it('returns false when version is null in releases.json', async () => {
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          production: { updatePopup: { ios: { version: null }, android: { version: null } } },
          uat: { updatePopup: { ios: { version: null }, android: { version: null } } },
        }),
    });

    const result = await checkForUpdates();

    expect(result).toBe(false);
    expect(mockIsNewerVersion).not.toHaveBeenCalled();
  });

  it('returns false when installedVersion is empty', async () => {
    mockGetInstalledVersion.mockReturnValue('');
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          production: { updatePopup: { ios: { version: '1.0.34' }, android: { version: '1.0.34' } } },
          uat: { updatePopup: { ios: { version: '1.0.34' }, android: { version: '1.0.34' } } },
        }),
    });

    const result = await checkForUpdates();

    expect(result).toBe(false);
    expect(mockIsNewerVersion).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // finally block
  // ---------------------------------------------------------------------------

  it('always calls setPopupUpdateLastCheck even on failure', async () => {
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockRejectedValue(new Error('Network error'));

    await checkForUpdates();

    expect(mockSetPopupUpdateLastCheck).toHaveBeenCalledWith(expect.any(Number));
  });

  it('calls setPopupUpdateLastCheck on success', async () => {
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          production: { updatePopup: { ios: { version: '1.0.33' }, android: { version: '1.0.33' } } },
          uat: { updatePopup: { ios: { version: '1.0.33' }, android: { version: '1.0.33' } } },
        }),
    });

    await checkForUpdates();

    expect(mockSetPopupUpdateLastCheck).toHaveBeenCalledWith(expect.any(Number));
  });

  // ---------------------------------------------------------------------------
  // Logging
  // ---------------------------------------------------------------------------

  it('logs warning when fetch fails (getStoreVersion inner catch)', async () => {
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    const error = new Error('Fetch failed');
    mockFetch.mockRejectedValue(error);

    await checkForUpdates();

    expect(mockLoggerWarn).toHaveBeenCalledWith('Failed to fetch store version:', error);
    expect(mockLoggerError).not.toHaveBeenCalled();
  });

  it('logs error when outer catch is triggered', async () => {
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockGetInstalledVersion.mockImplementation(() => {
      throw new Error('Version error');
    });

    const result = await checkForUpdates();

    expect(result).toBe(false);
    expect(mockLoggerError).toHaveBeenCalledWith('Failed to check for updates:', expect.any(Error));
    expect(mockSetPopupUpdateLastCheck).toHaveBeenCalledWith(expect.any(Number));
  });

  it('fetches exactly once for production iOS (iTunes API only)', async () => {
    mockIsProd.mockReturnValue(true);
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ results: [{ version: '1.0.34' }] }),
    });
    mockIsNewerVersion.mockReturnValue(true);

    await checkForUpdates();

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

// =============================================================================
// checkForUpdates - Android platform tests (requires module re-import)
// =============================================================================

describe('checkForUpdates (Android)', () => {
  let checkForUpdatesAndroid: typeof checkForUpdates;

  beforeAll(() => {
    jest.resetModules();

    // Re-apply mocks with Android platform
    jest.mock('react-native', () => ({
      Platform: { OS: 'android' },
      Linking: { openURL: (...args: unknown[]) => mockOpenURL(...args) },
    }));

    jest.mock('@/shared/config', () => ({
      APP_CONFIG: {
        iosAppId: '123456789',
        androidPackage: 'com.mugtaba.athan',
      },
      isProd: () => mockIsProd(),
      isPreview: () => false,
      isTest: () => true,
    }));

    jest.mock('@/shared/logger', () => ({
      __esModule: true,
      default: {
        info: jest.fn(),
        warn: (...args: unknown[]) => mockLoggerWarn(...args),
        error: (...args: unknown[]) => mockLoggerError(...args),
        debug: jest.fn(),
      },
    }));

    jest.mock('@/stores/version', () => ({
      getInstalledVersion: () => mockGetInstalledVersion(),
    }));

    jest.mock('@/stores/ui', () => ({
      getPopupUpdateLastCheck: () => mockGetPopupUpdateLastCheck(),
      setPopupUpdateLastCheck: (ts: number) => mockSetPopupUpdateLastCheck(ts),
    }));

    jest.mock('@/shared/versionUtils', () => ({
      isNewerVersion: (installed: string, remote: string) => mockIsNewerVersion(installed, remote),
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    checkForUpdatesAndroid = require('../updates').checkForUpdates;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsProd.mockReturnValue(false);
    mockGetInstalledVersion.mockReturnValue('1.0.33');
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockReset();
    mockIsNewerVersion.mockReturnValue(false);
  });

  it('fetches from releases.json for production Android', async () => {
    mockIsProd.mockReturnValue(true);
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          production: { updatePopup: { ios: { version: '1.0.30' }, android: { version: '2.0.0' } } },
          uat: { updatePopup: { ios: { version: '1.5.0' }, android: { version: '1.5.0' } } },
        }),
    });
    mockIsNewerVersion.mockReturnValue(true);

    const result = await checkForUpdatesAndroid();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://raw.githubusercontent.com/capt-muji/rn.athan.uk/main/releases.json',
      { headers: { 'Cache-Control': 'no-cache' } }
    );
    expect(mockIsNewerVersion).toHaveBeenCalledWith('1.0.33', '2.0.0');
    expect(result).toBe(true);
  });

  it('fetches from releases.json for UAT Android', async () => {
    mockIsProd.mockReturnValue(false);
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          production: { updatePopup: { ios: { version: '1.0.30' }, android: { version: '1.0.30' } } },
          uat: { updatePopup: { ios: { version: '1.5.0' }, android: { version: '3.0.0' } } },
        }),
    });
    mockIsNewerVersion.mockReturnValue(true);

    const result = await checkForUpdatesAndroid();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://raw.githubusercontent.com/capt-muji/rn.athan.uk/main/releases.json',
      { headers: { 'Cache-Control': 'no-cache' } }
    );
    expect(mockIsNewerVersion).toHaveBeenCalledWith('1.0.33', '3.0.0');
    expect(result).toBe(true);
  });
});

// =============================================================================
// openStore TESTS (iOS - default platform)
// =============================================================================

describe('openStore', () => {
  it('opens App Store URL on iOS', async () => {
    await openStore();

    expect(mockOpenURL).toHaveBeenCalledWith('https://apps.apple.com/gb/app/athan-london/id123456789');
  });

  it('logs error when Linking.openURL throws on iOS', async () => {
    const error = new Error('Cannot open URL');
    mockOpenURL.mockRejectedValue(error);

    await openStore();

    expect(mockLoggerError).toHaveBeenCalledWith('Failed to open store URL:', error);
  });
});

// =============================================================================
// openStore TESTS (Android - requires module re-import)
// =============================================================================

describe('openStore (Android)', () => {
  let openStoreAndroid: typeof openStore;

  beforeAll(() => {
    jest.resetModules();

    jest.mock('react-native', () => ({
      Platform: { OS: 'android' },
      Linking: { openURL: (...args: unknown[]) => mockOpenURL(...args) },
    }));

    jest.mock('@/shared/config', () => ({
      APP_CONFIG: {
        iosAppId: '123456789',
        androidPackage: 'com.mugtaba.athan',
      },
      isProd: () => mockIsProd(),
      isPreview: () => false,
      isTest: () => true,
    }));

    jest.mock('@/shared/logger', () => ({
      __esModule: true,
      default: {
        info: jest.fn(),
        warn: (...args: unknown[]) => mockLoggerWarn(...args),
        error: (...args: unknown[]) => mockLoggerError(...args),
        debug: jest.fn(),
      },
    }));

    jest.mock('@/stores/version', () => ({
      getInstalledVersion: () => mockGetInstalledVersion(),
    }));

    jest.mock('@/stores/ui', () => ({
      getPopupUpdateLastCheck: () => mockGetPopupUpdateLastCheck(),
      setPopupUpdateLastCheck: (ts: number) => mockSetPopupUpdateLastCheck(ts),
    }));

    jest.mock('@/shared/versionUtils', () => ({
      isNewerVersion: (installed: string, remote: string) => mockIsNewerVersion(installed, remote),
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    openStoreAndroid = require('../updates').openStore;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenURL.mockResolvedValue(undefined);
  });

  it('opens Play Store URL on Android', async () => {
    await openStoreAndroid();

    expect(mockOpenURL).toHaveBeenCalledWith('market://details?id=com.mugtaba.athan');
  });

  it('logs error when Linking.openURL throws on Android', async () => {
    const error = new Error('Cannot open URL');
    mockOpenURL.mockRejectedValue(error);

    await openStoreAndroid();

    expect(mockLoggerError).toHaveBeenCalledWith('Failed to open store URL:', error);
  });
});
