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

import { checkForUpdates, openStore, readPlayListingVersion } from '../updates';

// =============================================================================
// SETUP
// =============================================================================

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const RETRY_MS = 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10 * 1000;
const PINNED_NOW = 1_700_000_000_000;

/** A Play listing page reduced to what the parse must survive: the version key, and SVG path data a shape-only regex would match */
const playListingHtml = (version: string | null): string =>
  [
    '<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12"/>',
    '<path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11"/>',
    '"139":[[["Tools"]]],',
    version === null ? '"140":[[["no version here"]]],' : `"141":[[["${version}"]],[[[36]],[[[24,"7.0"]]]]],`,
    '"145":[null,[null,"- Changed daily reset from midnight to last prayer"]]',
  ].join('');

/** iOS reads the body as json, Android as text: a fixture answers whichever the platform under test asks for */
const storeResponse = (body: { json?: unknown; text?: string }) => ({
  json: () => Promise.resolve(body.json),
  text: () => Promise.resolve(body.text ?? ''),
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

  it('reads the version from the Play listing on Android', async () => {
    mockIsProd.mockReturnValue(true);
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockResolvedValue(storeResponse({ text: playListingHtml('2.0.0') }));
    mockIsNewerVersion.mockReturnValue(true);

    const result = await checkForUpdatesAndroid();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://play.google.com/store/apps/details?id=com.mugtaba.athan&hl=en&gl=GB',
      expect.objectContaining({ headers: { 'Cache-Control': 'no-cache' } })
    );
    expect(mockIsNewerVersion).toHaveBeenCalledWith('1.0.33', '2.0.0');
    expect(result).toBe(true);
  });

  it('reads the Play listing on Android whatever the environment', async () => {
    mockIsProd.mockReturnValue(false);
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockResolvedValue(storeResponse({ text: playListingHtml('3.0.0') }));
    mockIsNewerVersion.mockReturnValue(true);

    const result = await checkForUpdatesAndroid();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://play.google.com/store/apps/details?id=com.mugtaba.athan&hl=en&gl=GB',
      expect.objectContaining({ headers: { 'Cache-Control': 'no-cache' } })
    );
    expect(mockIsNewerVersion).toHaveBeenCalledWith('1.0.33', '3.0.0');
    expect(result).toBe(true);
  });

  it('returns false when the Play listing carries no version', async () => {
    mockIsProd.mockReturnValue(true);
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockResolvedValue(storeResponse({ text: playListingHtml(null) }));

    const result = await checkForUpdatesAndroid();

    expect(result).toBe(false);
    expect(mockIsNewerVersion).not.toHaveBeenCalled();
  });

  it('returns false when the Play listing version is not a dotted number', async () => {
    mockIsProd.mockReturnValue(true);
    mockGetPopupUpdateLastCheck.mockReturnValue(0);
    mockFetch.mockResolvedValue(storeResponse({ text: playListingHtml('varies with device') }));

    const result = await checkForUpdatesAndroid();

    expect(result).toBe(false);
    expect(mockIsNewerVersion).not.toHaveBeenCalled();
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

// =============================================================================
// readPlayListingVersion TESTS
// =============================================================================

describe('readPlayListingVersion', () => {
  it('reads the version out of a real Play listing payload', () => {
    expect(readPlayListingVersion(playListingHtml('1.5.2'))).toBe('1.5.2');
  });

  it('answers null when the version key is absent', () => {
    expect(readPlayListingVersion(playListingHtml(null))).toBeNull();
  });

  it('answers null for a version that is not dotted numbers', () => {
    expect(readPlayListingVersion(playListingHtml('varies with device'))).toBeNull();
  });

  it('answers null for an empty document', () => {
    expect(readPlayListingVersion('')).toBeNull();
  });
});
