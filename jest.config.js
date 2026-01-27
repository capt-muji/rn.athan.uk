module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Mock React Native modules that don't work in Node environment
    '^expo-constants$': '<rootDir>/shared/__mocks__/expo-constants.ts',
    '^react-native-mmkv$': '<rootDir>/shared/__mocks__/react-native-mmkv.ts',
    '^expo-notifications$': '<rootDir>/shared/__mocks__/expo-notifications.ts',
    '^expo-background-task$': '<rootDir>/shared/__mocks__/expo-background-task.ts',
    '^expo-task-manager$': '<rootDir>/shared/__mocks__/expo-task-manager.ts',
    '^react-native$': '<rootDir>/shared/__mocks__/react-native.ts',
    '^@/shared/logger$': '<rootDir>/shared/__mocks__/logger.ts',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  // Coverage configuration
  collectCoverageFrom: [
    'hooks/**/*.ts',
    'stores/**/*.ts',
    'shared/**/*.ts',
    '!**/*.d.ts',
    '!**/__mocks__/**',
    '!**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 70,
      statements: 70,
    },
  },
  // Test timeout for async operations
  testTimeout: 10000,
};
