/**
 * Two paths of shared/perf.ts that perf.test.ts does not take, with the monitor on
 *
 * - Going to the background flushes the ring to MMKV: a measurement run that ends with the app
 *   backgrounded or killed keeps what it recorded. No other app state flushes
 * - A measure's detail reaches the ring, where the offline analysis reads it
 */

type FakeEntry = { name: string; entryType: string; startTime: number; duration?: number; detail?: unknown };

// A minimal user-timing fake: entries, observers filtered by type, and a measure that honours detail
const createFakePerformance = () => {
  const entries: FakeEntry[] = [];
  const observers: Array<{ callback: (list: { getEntries: () => FakeEntry[] }) => void; type?: string }> = [];

  const addEntry = (entry: FakeEntry) => {
    entries.push(entry);
    for (const observer of observers) {
      if (observer.type && observer.type !== entry.entryType) continue;
      observer.callback({ getEntries: () => [entry] });
    }
  };

  const performance = {
    now: () => 5000,
    mark: (name: string, options?: { detail?: unknown }) =>
      addEntry({
        name,
        entryType: 'mark',
        startTime: 5000,
        ...(options?.detail !== undefined && { detail: options.detail }),
      }),
    measure: (name: string, options?: { start?: string; detail?: unknown }) =>
      addEntry({
        name,
        entryType: 'measure',
        startTime: 4750,
        duration: 250,
        ...(options?.detail !== undefined && { detail: options.detail }),
      }),
    getEntriesByName: (name: string) => entries.filter((entry) => entry.name === name),
  };

  class PerformanceObserver {
    callback: (list: { getEntries: () => FakeEntry[] }) => void;
    type?: string;

    constructor(callback: (list: { getEntries: () => FakeEntry[] }) => void) {
      this.callback = callback;
    }

    observe(options: { type?: string }) {
      this.type = options.type;
      observers.push(this);
    }
  }

  return { performance, PerformanceObserver };
};

// Babel hoists jest.mock above everything else, so a factory may only close over mock-prefixed names
const mockFakeLib = createFakePerformance();
jest.mock('react-native-performance', () => ({
  default: mockFakeLib.performance,
  PerformanceObserver: mockFakeLib.PerformanceObserver,
}));

const mockStores: Array<Record<string, string>> = [];
jest.mock('react-native-mmkv', () => ({
  __esModule: true,
  createMMKV: jest.fn(() => {
    const store: Record<string, string> = {};
    mockStores.push(store);
    return {
      set: (key: string, value: string) => {
        store[key] = value;
      },
    };
  }),
}));

type Flushed = { reason: string; entries: Array<{ name: string }> };

const readFlushed = (): Flushed => JSON.parse(mockStores[mockStores.length - 1].perf_ring) as Flushed;

/** Loads perf with the monitor on, and hands back the AppState listener its init registered */
const initMonitor = () => {
  jest.resetModules();
  process.env.EXPO_PUBLIC_PERF_MONITOR = '1';
  const perf = require('@/shared/perf') as typeof import('@/shared/perf');
  const appState = (require('react-native') as { AppState: { addEventListener: jest.Mock } }).AppState;

  perf.initPerfMonitor();

  const registration = appState.addEventListener.mock.calls.find(([event]) => event === 'change');
  return { perf, onAppStateChange: registration?.[1] as ((state: string) => void) | undefined };
};

afterEach(() => {
  delete process.env.EXPO_PUBLIC_PERF_MONITOR;
});

// =============================================================================
// BACKGROUND FLUSH
// =============================================================================

describe('perf ring flush on app state changes', () => {
  it('registers for app state changes when the monitor starts', () => {
    const { onAppStateChange } = initMonitor();

    expect(onAppStateChange).toBeInstanceOf(Function);
  });

  it('writes the ring, with the marks since the last flush, when the app goes to the background', () => {
    const { perf, onAppStateChange } = initMonitor();
    perf.perfMark('sheet_settings_present');
    expect(readFlushed().reason).toBe('init');

    onAppStateChange?.('background');

    const flushed = readFlushed();
    expect(flushed.reason).toBe('background');
    expect(flushed.entries.map((entry) => entry.name)).toEqual(['perf_monitor_init', 'sheet_settings_present']);
  });

  it.each(['active', 'inactive', 'unknown', 'extension'])('writes nothing when the app state becomes %s', (state) => {
    const { perf, onAppStateChange } = initMonitor();
    perf.perfMark('sheet_settings_present');

    onAppStateChange?.(state);

    const flushed = readFlushed();
    expect(flushed.reason).toBe('init');
    expect(flushed.entries.map((entry) => entry.name)).toEqual(['perf_monitor_init']);
  });
});

// =============================================================================
// MEASURE DETAIL
// =============================================================================

describe('perfMeasure detail', () => {
  it('carries the detail it was given into the ring entry', () => {
    const { perf } = initMonitor();
    perf.perfMark('overlay_open_start');

    perf.perfMeasure('overlay_open', 'overlay_open_start', { scheduleType: 'extra' });

    const measure = perf.getPerfRing().find((entry) => entry.name === 'overlay_open');
    expect(measure?.type).toBe('measure');
    expect(measure?.detail).toEqual({ scheduleType: 'extra' });
  });
});
