// Parallel agent worktrees live under .claude/worktrees/ INSIDE the repo, so without these every worktree's copy of the
// suite is discovered and the gate runs the whole project once per worktree, and a half-finished branch in one of them
// fails the main tree's validate. node_modules is excluded by default; these are not.
//
// They MUST stay anchored to <rootDir>. The patterns are matched against the ABSOLUTE path, and an agent worktree's own
// rootDir is itself under .claude/worktrees/, so a bare '/.claude/' matches every file in that worktree: jest then
// reports "No tests found" there and the pre-commit hook can never pass. The same list keeps them out of the module map,
// where jest-haste-map would otherwise warn "duplicate manual mock found" for every shared/__mocks__ file per worktree.
const ignoredPaths = ['<rootDir>/.claude/', '<rootDir>/android/', '<rootDir>/ios/'];

// The JSX transform is needed by any test that imports a .tsx file, and by coverage even when none does: Jest parses the
// instrumented output of an untested file without JSX support, and drops it instead of 0%.
//
// Both projects compile the app's own files through this one transform. Coverage from the two projects is merged per
// file, and two transforms would give the same file two different statement maps, which merge into wrong counts.
const appTransform = [
  'babel-jest',
  {
    presets: ['@babel/preset-typescript'],
    plugins: ['@babel/plugin-transform-modules-commonjs', ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]],
  },
];

// Specific module mocks must precede the '^@/(.*)$' catch-all, which would otherwise win
const appModuleMocks = {
  // Widget layout modules register native widgets as an import side effect
  '^@/widgets/PrayerWidget$': '<rootDir>/shared/__mocks__/widgets/PrayerWidget.ts',
  '^@/widgets/LockPrayerWidget$': '<rootDir>/shared/__mocks__/widgets/LockPrayerWidget.ts',
  '^@/shared/logger$': '<rootDir>/shared/__mocks__/logger.ts',
  '^@/(.*)$': '<rootDir>/$1',
  '^expo-constants$': '<rootDir>/shared/__mocks__/expo-constants.ts',
  '^react-native-mmkv$': '<rootDir>/shared/__mocks__/react-native-mmkv.ts',
  '^expo-notifications$': '<rootDir>/shared/__mocks__/expo-notifications.ts',
  '^expo-background-task$': '<rootDir>/shared/__mocks__/expo-background-task.ts',
  '^expo-task-manager$': '<rootDir>/shared/__mocks__/expo-task-manager.ts',
  '^react-native-performance$': '<rootDir>/shared/__mocks__/react-native-performance.ts',
};

module.exports = {
  projects: [
    {
      displayName: 'unit',
      setupFiles: ['<rootDir>/jest.setup.js'],
      testEnvironment: 'node',
      moduleNameMapper: { ...appModuleMocks, '^react-native$': '<rootDir>/shared/__mocks__/react-native.ts' },
      // Logic suites are .ts and component suites are .tsx: each extension belongs to exactly one project, so a suite
      // can never be silently undiscovered by both
      testMatch: ['**/__tests__/**/*.test.ts'],
      testPathIgnorePatterns: ['/node_modules/', ...ignoredPaths],
      modulePathIgnorePatterns: ignoredPaths,
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      transform: { '^.+\\.tsx?$': appTransform },
    },
    {
      // Renders real React Native components with React Native Testing Library: React Native's own Jest setup and
      // resolver here, then Expo's and the other native libraries' published mocks in jest.components.setup.js
      displayName: 'components',
      haste: { defaultPlatform: 'ios', platforms: ['android', 'ios', 'native'] },
      resolver: require.resolve('@react-native/jest-preset/jest/resolver.js'),
      setupFiles: [require.resolve('@react-native/jest-preset/jest/setup.js'), '<rootDir>/jest.setup.js'],
      setupFilesAfterEnv: ['<rootDir>/jest.components.setup.js'],
      // Call counts start at zero in every test, so no suite can forget to clear them
      clearMocks: true,
      testEnvironment: 'node',
      testEnvironmentOptions: { customExportConditions: ['require', 'react-native'] },
      // jest 30 consults react-native's exports allow-list before any resolver packageFilter, and 0.88 stops
      // exporting ./src/private/*: RN's own virtualized-lists and the jest-preset mocks deep-import from there,
      // so each of those requires is mapped to its file by path. The @react-native/jest-preset resolver that
      // deletes the exports field worked up to jest 29 and is kept, but no longer suffices.
      moduleNameMapper: {
        '^react-native/src/private/featureflags/ReactNativeFeatureFlags$':
          '<rootDir>/node_modules/react-native/src/private/featureflags/ReactNativeFeatureFlags.js',
        '^react-native/src/private/types/(HostComponent|HostInstance)$':
          '<rootDir>/node_modules/react-native/src/private/types/$1.js',
        '^react-native/src/private/webapis/errors/DOMException.js$':
          '<rootDir>/node_modules/react-native/src/private/webapis/errors/DOMException.js',
        ...appModuleMocks,
      },
      testMatch: ['**/__tests__/**/*.test.tsx'],
      testPathIgnorePatterns: ['/node_modules/', ...ignoredPaths],
      // A __mocks__ file anywhere under the root registers as the manual mock of the package it is named after, so the
      // unit project's react-native stand-in would replace the real one here unless it is hidden
      modulePathIgnorePatterns: [...ignoredPaths, '<rootDir>/shared/__mocks__/react-native.ts'],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      transform: {
        '^(?!.*/node_modules/).+\\.tsx?$': appTransform,
        // React Native and the Expo libraries ship Flow and untranspiled ESM
        '^.+\\.(js|jsx|mjs|ts|tsx)$': ['babel-jest', { presets: ['babel-preset-expo'] }],
        // Metro compiles .svg files into components (react-native-svg-transformer); here each one names its file
        '^.+\\.svg$': '<rootDir>/__tests__/svgFileTransformer.js',
        // Images, audio and fonts become their file path, as in React Native's own preset
        '^.+\\.(bmp|gif|jpg|jpeg|png|psd|webp|mp3|mp4|wav|aac|m4a|ttf|otf)$': require.resolve(
          '@react-native/jest-preset/jest/assetFileTransformer.js'
        ),
      },
      // jest-expo's list of packages that ship untranspiled code, plus this app's other native libraries
      transformIgnorePatterns: [
        '/node_modules/(?!(react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|standard-navigation|@gorhom|reanimated-color-picker))',
      ],
    },
  ],
  // widgets/ is left out: its layouts are serialized into the iOS widget extension's own JS runtime,
  // and shared/__tests__/widgetContract.test.ts checks them by AST instead
  collectCoverageFrom: [
    'api/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'device/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'stores/**/*.{ts,tsx}',
    'shared/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/__mocks__/**',
    '!**/__tests__/**',
  ],
  // Read by jest-circus from here only: set inside a project it is silently ignored and the 5 second default applies
  testTimeout: 10000,
  // The summary is what scripts/check-changed-coverage.js reads; the per-file table is one --coverageReporters=text away
  coverageReporters: ['json-summary', 'text-summary'],
  // Every measured file is fully covered. The per-file gate sees only changed source, so these thresholds are what
  // refuse a commit that weakens or deletes a test without touching the code it covered
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
