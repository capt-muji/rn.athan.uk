/**
 * Mock for expo-constants
 * Allows tests to control the expoConfig.version value
 */

// Mutable state that tests can modify
export const mockExpoConfig = {
  version: '1.0.34' as string | undefined | null,
  /**
   * Whether `Constants.expoConfig` resolves to an object at all.
   *
   * The real value is nullable — that is precisely why `stores/version.ts`
   * reaches through it with `?.` — and a mock that always hands back an object
   * makes the null branch unreachable from any test. That branch is not
   * cosmetic: it yields `''`, which makes `handleAppUpgrade` bail before it
   * stamps either the version or the cache schema marker.
   */
  present: true as boolean,
};

// Reset function for tests
export const resetMockExpoConfig = () => {
  mockExpoConfig.version = '1.0.34';
  mockExpoConfig.present = true;
};

export default {
  get expoConfig() {
    return mockExpoConfig.present ? { version: mockExpoConfig.version } : null;
  },
};
