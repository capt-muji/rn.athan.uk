/**
 * The TLS 1.3 status read as the app loads: the provider Android reports, or the warning when it cannot
 */

interface LoadedTls13 {
  requireNativeModule: jest.Mock;
  info: jest.Mock;
  warn: jest.Mock;
}

/**
 * Loads device/tls13.ts fresh on one platform
 *
 * The module reads the native module once, while it is imported, so each test needs its own copy with the platform
 * and the native module in place first. The logger is read from the same copy, since that is the one the module warns
 * through.
 */
const loadOn = (os: 'android' | 'ios', nativeModule: () => unknown): LoadedTls13 => {
  const requireNativeModule = jest.fn(nativeModule);
  let info!: jest.Mock;
  let warn!: jest.Mock;

  jest.isolateModules(() => {
    // The platform decides whether the native module is asked at all, and the native module is Kotlin that Jest cannot
    // load, so both are replaced before the import
    jest.doMock('react-native', () => ({ Platform: { OS: os } }));
    jest.doMock('expo-modules-core', () => ({ requireNativeModule }));
    require('@/device/tls13');
    const logger = (require('@/shared/logger') as { default: { info: jest.Mock; warn: jest.Mock } }).default;
    info = logger.info;
    warn = logger.warn;
  });

  return { requireNativeModule, info, warn };
};

// doMock registers its factory for the whole file, not only inside the isolated copy
afterEach(() => {
  jest.dontMock('react-native');
  jest.dontMock('expo-modules-core');
});

describe('the TLS 1.3 status, read once as the app loads', () => {
  it('reports the first security provider the Tls13 native module names on Android', () => {
    const loaded = loadOn('android', () => ({ status: () => 'GmsCore_OpenSSL' }));

    expect(loaded.requireNativeModule).toHaveBeenCalledWith('Tls13');
    expect(loaded.info).toHaveBeenCalledWith('TLS13: first security provider', { provider: 'GmsCore_OpenSSL' });
    expect(loaded.warn).not.toHaveBeenCalled();
  });

  // what fails, and the native module standing in for it
  it.each([
    [
      'the native module is missing',
      () => {
        throw new Error("Cannot find native module 'Tls13'");
      },
    ],
    [
      'the provider list cannot be read',
      () => ({
        status: () => {
          throw new Error('Index 0 out of bounds for length 0');
        },
      }),
    ],
  ])('reports unavailable, and warns, on Android when %s', (_failure, nativeModule) => {
    const loaded = loadOn('android', nativeModule);

    expect(loaded.info).not.toHaveBeenCalledWith('TLS13: first security provider', expect.anything());
    expect(loaded.warn).toHaveBeenCalledWith('TLS13: module unavailable', { error: expect.any(Error) });
  });

  it('reports unavailable on iOS without asking for the native module', () => {
    const loaded = loadOn('ios', () => ({ status: () => 'GmsCore_OpenSSL' }));

    expect(loaded.requireNativeModule).not.toHaveBeenCalled();
    expect(loaded.info).not.toHaveBeenCalled();
  });
});
