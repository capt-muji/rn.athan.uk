/**
 * Unit tests for shared/config.ts
 *
 * Tests environment configuration including:
 * - APP_CONFIG object values
 * - isProd() helper
 * - isPreview() helper
 * - isTest() helper
 */

/* eslint-disable @typescript-eslint/no-require-imports */

// =============================================================================
// TESTS FOR ENVIRONMENT HELPERS
// =============================================================================

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // ---------------------------------------------------------------------------
  // APP_CONFIG.isDev
  // ---------------------------------------------------------------------------

  describe('APP_CONFIG.isDev', () => {
    it('is false when EXPO_PUBLIC_ENV is "prod"', () => {
      process.env.EXPO_PUBLIC_ENV = 'prod';
      const { APP_CONFIG } = require('../config');
      expect(APP_CONFIG.isDev).toBe(false);
    });

    it('is false when EXPO_PUBLIC_ENV is "preview"', () => {
      process.env.EXPO_PUBLIC_ENV = 'preview';
      const { APP_CONFIG } = require('../config');
      expect(APP_CONFIG.isDev).toBe(false);
    });

    it('is true when EXPO_PUBLIC_ENV is "local"', () => {
      process.env.EXPO_PUBLIC_ENV = 'local';
      const { APP_CONFIG } = require('../config');
      expect(APP_CONFIG.isDev).toBe(true);
    });

    it('is true when EXPO_PUBLIC_ENV is "dev"', () => {
      process.env.EXPO_PUBLIC_ENV = 'dev';
      const { APP_CONFIG } = require('../config');
      expect(APP_CONFIG.isDev).toBe(true);
    });

    it('is true when EXPO_PUBLIC_ENV is undefined', () => {
      delete process.env.EXPO_PUBLIC_ENV;
      const { APP_CONFIG } = require('../config');
      expect(APP_CONFIG.isDev).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // APP_CONFIG.env
  // ---------------------------------------------------------------------------

  describe('APP_CONFIG.env', () => {
    it('equals EXPO_PUBLIC_ENV when set', () => {
      process.env.EXPO_PUBLIC_ENV = 'prod';
      const { APP_CONFIG } = require('../config');
      expect(APP_CONFIG.env).toBe('prod');
    });

    it('defaults to "local" when EXPO_PUBLIC_ENV is undefined', () => {
      delete process.env.EXPO_PUBLIC_ENV;
      const { APP_CONFIG } = require('../config');
      expect(APP_CONFIG.env).toBe('local');
    });
  });

  // ---------------------------------------------------------------------------
  // isProd()
  // ---------------------------------------------------------------------------

  describe('isProd', () => {
    it('returns true when env is "prod"', () => {
      process.env.EXPO_PUBLIC_ENV = 'prod';
      const { isProd } = require('../config');
      expect(isProd()).toBe(true);
    });

    it('returns false when env is "preview"', () => {
      process.env.EXPO_PUBLIC_ENV = 'preview';
      const { isProd } = require('../config');
      expect(isProd()).toBe(false);
    });

    it('returns false when env is "local"', () => {
      process.env.EXPO_PUBLIC_ENV = 'local';
      const { isProd } = require('../config');
      expect(isProd()).toBe(false);
    });

    it('returns false when env is undefined', () => {
      delete process.env.EXPO_PUBLIC_ENV;
      const { isProd } = require('../config');
      expect(isProd()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // isPreview()
  // ---------------------------------------------------------------------------

  describe('isPreview', () => {
    it('returns true when env is "preview"', () => {
      process.env.EXPO_PUBLIC_ENV = 'preview';
      const { isPreview } = require('../config');
      expect(isPreview()).toBe(true);
    });

    it('returns false when env is "prod"', () => {
      process.env.EXPO_PUBLIC_ENV = 'prod';
      const { isPreview } = require('../config');
      expect(isPreview()).toBe(false);
    });

    it('returns false when env is "local"', () => {
      process.env.EXPO_PUBLIC_ENV = 'local';
      const { isPreview } = require('../config');
      expect(isPreview()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // APP_CONFIG additional properties
  // ---------------------------------------------------------------------------

  describe('APP_CONFIG additional properties', () => {
    it('reads apiKey from EXPO_PUBLIC_API_KEY', () => {
      process.env.EXPO_PUBLIC_API_KEY = 'test-api-key';
      const { APP_CONFIG } = require('../config');
      expect(APP_CONFIG.apiKey).toBe('test-api-key');
    });

    it('reads iosAppId from EXPO_PUBLIC_IOS_APP_ID', () => {
      process.env.EXPO_PUBLIC_IOS_APP_ID = 'com.test.ios';
      const { APP_CONFIG } = require('../config');
      expect(APP_CONFIG.iosAppId).toBe('com.test.ios');
    });

    it('reads androidPackage from EXPO_PUBLIC_ANDROID_PACKAGE', () => {
      process.env.EXPO_PUBLIC_ANDROID_PACKAGE = 'com.test.android';
      const { APP_CONFIG } = require('../config');
      expect(APP_CONFIG.androidPackage).toBe('com.test.android');
    });
  });
});

describe('app.config android resolution', () => {
  const resolveAndroid = (widgetsEnv: string | undefined): { plugins?: unknown[] } => {
    const previous = process.env.EXPO_PUBLIC_ANDROID_WIDGETS;
    if (widgetsEnv === undefined) delete process.env.EXPO_PUBLIC_ANDROID_WIDGETS;
    else process.env.EXPO_PUBLIC_ANDROID_WIDGETS = widgetsEnv;
    let resolved: { plugins?: unknown[] } | undefined;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('../../app.config');
      resolved = mod.default({ platform: 'android' });
    });
    if (previous === undefined) delete process.env.EXPO_PUBLIC_ANDROID_WIDGETS;
    else process.env.EXPO_PUBLIC_ANDROID_WIDGETS = previous;
    return resolved as unknown as { plugins?: unknown[] };
  };

  const resolveAndroidRoute = (
    widgetsEnv: string | undefined,
    argvTokens: readonly string[],
    platform: string | undefined
  ): { plugins?: unknown[]; ios?: unknown } => {
    const previousWidgets = process.env.EXPO_PUBLIC_ANDROID_WIDGETS;
    if (widgetsEnv === undefined) delete process.env.EXPO_PUBLIC_ANDROID_WIDGETS;
    else process.env.EXPO_PUBLIC_ANDROID_WIDGETS = widgetsEnv;
    const previousArgv = process.argv;
    process.argv = ['/usr/local/bin/node', 'prebuild', ...argvTokens];
    let resolved: { plugins?: unknown[]; ios?: unknown } | undefined;
    try {
      jest.isolateModules(() => {
        const mod = require('../../app.config');
        resolved = mod.default({ platform });
      });
    } finally {
      process.argv = previousArgv;
      if (previousWidgets === undefined) delete process.env.EXPO_PUBLIC_ANDROID_WIDGETS;
      else process.env.EXPO_PUBLIC_ANDROID_WIDGETS = previousWidgets;
    }
    return resolved as unknown as { plugins?: unknown[]; ios?: unknown };
  };

  it('registers the locale config with widgets enabled', () => {
    expect(resolveAndroid('1').plugins).toContain('./plugins/androidLocaleConfig');
  });

  it('registers the locale config on a widgets-off build too', () => {
    expect(resolveAndroid(undefined).plugins).toContain('./plugins/androidLocaleConfig');
  });

  it('registers the locale config on the real CLI route: platform undefined, android argv, widgets off', () => {
    const resolved = resolveAndroidRoute(undefined, ['android'], undefined);
    expect(resolved.plugins).toContain('./plugins/androidLocaleConfig');
    expect(resolved.plugins?.some((p) => Array.isArray(p) && p[0] === 'expo-widgets')).toBe(false);
  });

  it('keeps the widgets-on argv resolution unchanged', () => {
    const resolved = resolveAndroidRoute('1', ['android'], undefined);
    expect(resolved.ios).toBeUndefined();
    expect(resolved.plugins).toContain('./plugins/androidLocaleConfig');
    expect(resolved.plugins?.some((p) => Array.isArray(p) && p[0] === 'expo-widgets')).toBe(true);
  });

  it('stays out of the android branch when argv carries ios', () => {
    const resolved = resolveAndroidRoute(undefined, ['android', 'ios'], undefined);
    expect(resolved.plugins).not.toContain('./plugins/androidLocaleConfig');
  });

  it('stays out of the android branch when a platform is passed', () => {
    const resolved = resolveAndroidRoute(undefined, ['android'], 'ios');
    expect(resolved.plugins).not.toContain('./plugins/androidLocaleConfig');
  });
});
