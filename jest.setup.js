// Feature flags default to the SHIPPED value for tests, which for widgets is
// off: every suite must exercise the configuration real users have unless it
// says otherwise. An explicit delete rather than '0' — setupFiles runs per test
// file but the worker's process.env is shared, so a suite that sets the
// variable and does not clear it would otherwise leak into the next file in
// that worker; deleting restores the shipped state at the top of every file.
// Enabled-path suites opt in with a hoisted jest.mock of @/shared/flags
// (stores/__tests__/widgetIo.test.ts, stores/__tests__/widgetSettingsSync.test.ts);
// a bare env assignment cannot work, because ESM imports are hoisted past it.
delete process.env.EXPO_PUBLIC_WIDGETS;
