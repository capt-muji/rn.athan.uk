/**
 * Mock for expo-constants
 * Allows tests to control the expoConfig.version value
 */

// Mutable state that tests can modify
export const mockExpoConfig = {
  version: '1.0.34' as string | undefined | null,
};

// Reset function for tests
export const resetMockExpoConfig = () => {
  mockExpoConfig.version = '1.0.34';
};

export default {
  get expoConfig() {
    return { version: mockExpoConfig.version };
  },
};
