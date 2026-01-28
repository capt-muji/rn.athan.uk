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
