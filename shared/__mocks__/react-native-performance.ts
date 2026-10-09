// Mock for react-native-performance (lazy-required by shared/perf.ts only when
// EXPO_PUBLIC_PERF_MONITOR=1; tests that exercise the enabled path install a
// functional fake via jest.mock factories instead)
export const performance = {
  timeOrigin: 0,
  now: jest.fn(() => 0),
  mark: jest.fn(),
  measure: jest.fn(),
  metric: jest.fn(),
  getEntries: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
};

export class PerformanceObserver {
  observe(_options: unknown) {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

export const setResourceLoggingEnabled = jest.fn();
