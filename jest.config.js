module.exports = {
  setupFiles: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  moduleNameMapper: {
    // Widget layout modules register native widgets as an import side effect —
    // stub them (and their JSX) out for tests. Must precede the '^@/(.*)$'
    // catch-all, which would otherwise win.
    '^@/widgets/PrayerWidget$': '<rootDir>/shared/__mocks__/widgets/PrayerWidget.ts',
    '^@/widgets/LockPrayerWidget$': '<rootDir>/shared/__mocks__/widgets/LockPrayerWidget.ts',
    // Same shadowing rule: specific module mocks must precede the catch-all
    '^@/shared/logger$': '<rootDir>/shared/__mocks__/logger.ts',
    '^@/(.*)$': '<rootDir>/$1',
    // Mock React Native modules that don't work in Node environment
    '^expo-constants$': '<rootDir>/shared/__mocks__/expo-constants.ts',
    '^react-native-mmkv$': '<rootDir>/shared/__mocks__/react-native-mmkv.ts',
    '^expo-notifications$': '<rootDir>/shared/__mocks__/expo-notifications.ts',
    '^expo-background-task$': '<rootDir>/shared/__mocks__/expo-background-task.ts',
    '^expo-task-manager$': '<rootDir>/shared/__mocks__/expo-task-manager.ts',
    '^react-native-performance$': '<rootDir>/shared/__mocks__/react-native-performance.ts',
    '^react-native$': '<rootDir>/shared/__mocks__/react-native.ts',
  },
  // Both extensions, deliberately: the transform below handles `tsx` and
  // moduleFileExtensions lists it, so a `.test.tsx` looks supported from every
  // other line of this file. With a `.ts`-only pattern it is simply never
  // discovered — it passes review, passes `yarn validate`, and asserts nothing.
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  // Parallel agent worktrees live under .claude/worktrees/ INSIDE the repo, so without this
  // every worktree's copy of the suite is discovered and the gate runs the whole project
  // once per worktree — and a half-finished branch in one of them fails the main tree's
  // validate. node_modules is excluded by default; these are not.
  //
  // <rootDir>-anchored, NOT a bare '/.claude/': these are regexes matched against absolute
  // paths, so the bare form also matches a worktree's OWN path (which contains /.claude/)
  // and leaves an agent working inside one unable to run the suite at all.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/.claude/', '<rootDir>/android/', '<rootDir>/ios/'],
  // And keep them out of the module map as well: testPathIgnorePatterns only hides tests,
  // while jest-haste-map still scans for manual mocks and warns "duplicate manual mock found"
  // for every shared/__mocks__ file once per worktree.
  modulePathIgnorePatterns: ['<rootDir>/.claude/', '<rootDir>/android/', '<rootDir>/ios/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': ['babel-jest', { presets: ['@babel/preset-typescript'], plugins: ['@babel/plugin-transform-modules-commonjs'] }],
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
