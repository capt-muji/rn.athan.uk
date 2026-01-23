module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Mock React Native modules that don't work in Node environment
    '^react-native-mmkv$': '<rootDir>/shared/__mocks__/react-native-mmkv.ts',
    '^expo-notifications$': '<rootDir>/shared/__mocks__/expo-notifications.ts',
    '^react-native$': '<rootDir>/shared/__mocks__/react-native.ts',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
};
