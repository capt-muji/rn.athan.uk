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
const mockCheckForUpdate = jest.fn();
const mockStartUpdate = jest.fn();

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

// Virtual: the native module is Android-only, so the iOS-default suite must still resolve the import
jest.mock(
  'expo-in-app-updates',
  () => ({
    checkForUpdate: () => mockCheckForUpdate(),
    startUpdate: (isImmediate?: boolean) => mockStartUpdate(isImmediate),
  }),
  { virtual: true }
);

// Global fetch mock
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { checkForUpdates, openStore } from '../updates';

// =============================================================================
// SETUP
// =============================================================================

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const RETRY_MS = 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10 * 1000;
const PINNED_NOW = 1_700_000_000_000;

/** The iTunes lookup body, which is the only store body the app reads now */
const storeResponse = (body: { json: unknown }) => ({
  json: () => Promise.resolve(body.json),
});

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
    mockFetch.mockResolvedValue(storeResponse({ json: { results: [{ version: '1.0.33' }] } }));

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
    mockFetch.mockResolvedValue(storeResponse({ json: { results: [{ version: '1.0.34' }] } }));
    mockIsNewerVersion.mockReturnValue(true);

    const result = await checkForUpdates();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://itunes.apple.com/lookup?bundleId=com.mugtaba.athan&country=gb',
      expect.objectContaining({ headers: { 'Cache-Control': 'no-cache' } })
    );
    expect(mockIsNewerVersion).toHaveBeenCalledWith('1.0.33', '1.0.34');
    expect(result).toBe(true);
  });

  it('returns false when iTunes API returns empty results', async () => {
    mockIsProd.mockReturnValue(true);
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockResolvedValue(storeResponse({ json: { results: [] } }));

    const result = await checkForUpdates();

    expect(result).toBe(false);
    expect(mockIsNewerVersion).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // iOS: the App Store, whatever the environment
  // ---------------------------------------------------------------------------

  it('reads the App Store version whatever the environment', async () => {
    mockIsProd.mockReturnValue(false);
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockResolvedValue(storeResponse({ json: { results: [{ version: '1.0.34' }] } }));
    mockIsNewerVersion.mockReturnValue(true);

    const result = await checkForUpdates();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://itunes.apple.com/lookup?bundleId=com.mugtaba.athan&country=gb',
      expect.objectContaining({ headers: { 'Cache-Control': 'no-cache' } })
    );
    expect(mockIsNewerVersion).toHaveBeenCalledWith('1.0.33', '1.0.34');
    expect(result).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Version comparison results
  // ---------------------------------------------------------------------------

  it('returns true when store version is newer than installed', async () => {
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockResolvedValue(storeResponse({ json: { results: [{ version: '1.0.34' }] } }));
    mockIsNewerVersion.mockReturnValue(true);

    const result = await checkForUpdates();

    expect(mockIsNewerVersion).toHaveBeenCalledWith('1.0.33', '1.0.34');
    expect(result).toBe(true);
  });

  it('returns false when installed version is current', async () => {
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockResolvedValue(storeResponse({ json: { results: [{ version: '1.0.33' }] } }));
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

  it('returns false when installedVersion is empty', async () => {
    mockGetInstalledVersion.mockReturnValue('');
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockResolvedValue(storeResponse({ json: { results: [{ version: '1.0.34' }] } }));

    const result = await checkForUpdates();

    expect(result).toBe(false);
    expect(mockIsNewerVersion).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // finally block
  // ---------------------------------------------------------------------------

  it('stamps a failed check an hour back so the day is not lost', async () => {
    jest.useFakeTimers({ now: PINNED_NOW });
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockRejectedValue(new Error('Network error'));

    await checkForUpdates();

    expect(mockSetPopupUpdateLastCheck).toHaveBeenCalledWith(PINNED_NOW - ONE_DAY_MS + RETRY_MS);
    jest.useRealTimers();
  });

  it('stamps a successful check with now', async () => {
    jest.useFakeTimers({ now: PINNED_NOW });
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockResolvedValue(storeResponse({ json: { results: [{ version: '1.0.33' }] } }));

    await checkForUpdates();

    expect(mockSetPopupUpdateLastCheck).toHaveBeenCalledWith(PINNED_NOW);
    jest.useRealTimers();
  });

  it('retries an hour after a failure and not before', async () => {
    jest.useFakeTimers({ now: PINNED_NOW });
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockRejectedValue(new Error('Network error'));
    await checkForUpdates();
    const stamped = mockSetPopupUpdateLastCheck.mock.calls[0][0] as number;
    mockGetPopupUpdateLastCheck.mockReturnValue(stamped);

    jest.setSystemTime(PINNED_NOW + RETRY_MS - 1);
    await checkForUpdates();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    jest.setSystemTime(PINNED_NOW + RETRY_MS + 1);
    await checkForUpdates();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  it('stamps nothing when the throttle refuses the check', async () => {
    mockGetPopupUpdateLastCheck.mockReturnValue(Date.now());

    await checkForUpdates();

    expect(mockSetPopupUpdateLastCheck).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('abandons a fetch that has not answered in ten seconds', async () => {
    jest.useFakeTimers({ now: PINNED_NOW });
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new Error('Aborted')));
        })
    );

    const pending = checkForUpdates();
    jest.advanceTimersByTime(FETCH_TIMEOUT_MS);

    await expect(pending).resolves.toBe(false);
    expect(mockSetPopupUpdateLastCheck).toHaveBeenCalledWith(PINNED_NOW - ONE_DAY_MS + RETRY_MS);
    jest.useRealTimers();
  });

  it('leaves a fetch that answers inside ten seconds alone', async () => {
    jest.useFakeTimers({ now: PINNED_NOW });
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockIsNewerVersion.mockReturnValue(true);
    let capturedSignal: AbortSignal | null | undefined;
    mockFetch.mockImplementation((_url: string, init: RequestInit) => {
      capturedSignal = init.signal;
      return Promise.resolve(storeResponse({ json: { results: [{ version: '1.0.34' }] } }));
    });

    const result = await checkForUpdates();

    expect(result).toBe(true);
    expect(capturedSignal?.aborted).toBe(false);
    jest.useRealTimers();
  });

  it('calls setPopupUpdateLastCheck on success', async () => {
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockResolvedValue(storeResponse({ json: { results: [{ version: '1.0.33' }] } }));

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
    // The clock is pinned because the assertion reads it too: on the real clock the code's own Date.now()
    // and the expectation's can land milliseconds apart
    jest.useFakeTimers({ now: PINNED_NOW });
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockGetInstalledVersion.mockImplementation(() => {
      throw new Error('Version error');
    });

    const result = await checkForUpdates();

    expect(result).toBe(false);
    expect(mockLoggerError).toHaveBeenCalledWith('Failed to check for updates:', expect.any(Error));
    expect(mockSetPopupUpdateLastCheck).toHaveBeenCalledWith(PINNED_NOW - ONE_DAY_MS + RETRY_MS);
    jest.useRealTimers();
  });

  it('never asks Play on iOS', async () => {
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockResolvedValue(storeResponse({ json: { results: [{ version: '1.0.34' }] } }));

    await checkForUpdates();

    expect(mockCheckForUpdate).not.toHaveBeenCalled();
  });

  it('fetches exactly once for production iOS (iTunes API only)', async () => {
    mockIsProd.mockReturnValue(true);
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockResolvedValue(storeResponse({ json: { results: [{ version: '1.0.34' }] } }));
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

  it('asks Play and starts the update when one is available', async () => {
    mockCheckForUpdate.mockResolvedValue({ updateAvailable: true });
    mockStartUpdate.mockResolvedValue(true);

    await checkForUpdatesAndroid();

    expect(mockStartUpdate).toHaveBeenCalledTimes(1);
    expect(mockStartUpdate).toHaveBeenCalledWith(undefined);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('never shows our modal on Android, even when Play has an update', async () => {
    mockCheckForUpdate.mockResolvedValue({ updateAvailable: true });
    mockStartUpdate.mockResolvedValue(true);

    const result = await checkForUpdatesAndroid();

    expect(result).toBe(false);
  });

  it('does nothing when Play reports no update', async () => {
    mockCheckForUpdate.mockResolvedValue({ updateAvailable: false });

    const result = await checkForUpdatesAndroid();

    expect(result).toBe(false);
    expect(mockStartUpdate).not.toHaveBeenCalled();
  });

  it('shows nothing when Play rejects the check', async () => {
    const error = new Error('AppUpdateService : Binder has died');
    mockCheckForUpdate.mockRejectedValue(error);

    const result = await checkForUpdatesAndroid();

    expect(result).toBe(false);
    expect(mockLoggerWarn).toHaveBeenCalledWith('Failed to start native update:', error);
  });

  it('stamps a Play failure an hour back so the day is not lost', async () => {
    jest.useFakeTimers({ now: PINNED_NOW });
    mockCheckForUpdate.mockRejectedValue(new Error('Binder has died'));

    await checkForUpdatesAndroid();

    expect(mockSetPopupUpdateLastCheck).toHaveBeenCalledWith(PINNED_NOW - ONE_DAY_MS + RETRY_MS);
    jest.useRealTimers();
  });

  it('stamps a successful Play check with now', async () => {
    jest.useFakeTimers({ now: PINNED_NOW });
    mockCheckForUpdate.mockResolvedValue({ updateAvailable: false });

    await checkForUpdatesAndroid();

    expect(mockSetPopupUpdateLastCheck).toHaveBeenCalledWith(PINNED_NOW);
    jest.useRealTimers();
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

  it('does not fall back on iOS', async () => {
    mockOpenURL.mockRejectedValue(new Error('Cannot open URL'));

    await openStore();

    expect(mockOpenURL).toHaveBeenCalledTimes(1);
    expect(mockOpenURL).toHaveBeenCalledWith('https://apps.apple.com/gb/app/athan-london/id123456789');
  });
});
