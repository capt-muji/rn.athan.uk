/**
 * Tests for shared/perf.ts
 *
 * Two paths:
 * - Gate OFF (default builds): every export is a no-op, MMKV is never created,
 *   react-native-performance is never required.
 * - Gate ON (EXPO_PUBLIC_PERF_MONITOR=1): marks/measures flow into the ring
 *   buffer, MMKV flushes land in the 'perf-monitor' instance, launch measures
 *   derive from native marks, and measures guard against missing start marks.
 *
 * The enabled path runs against a functional fake of react-native-performance
 * installed via jest.mock (the moduleNameMapper stub is inert — no behavior).
 */

type FakeEntry = { name: string; entryType: string; startTime: number; duration?: number; detail?: unknown };

// Functional fake: a faithful mini user-timing implementation (entries list,
// observer fan-out on every entry) so perf.ts's ring/flush/derivation logic
// runs for real. Observers receive every entry regardless of observed type —
// the assertions below only rely on names/types, which stay accurate.
const createFakePerformance = () => {
  const entries: FakeEntry[] = [];
  const observers: Array<{ callback: (list: { getEntries: () => FakeEntry[] }) => void; type?: string }> = [];
  const clock = 1000;

  const addEntry = (entry: FakeEntry) => {
    entries.push(entry);
    for (const observer of observers) {
      if (observer.type && observer.type !== entry.entryType) continue;
      observer.callback({ getEntries: () => [entry] });
    }
  };

  const performance = {
    timeOrigin: clock,
    now: () => clock,
    mark: (name: string, options?: { detail?: unknown }) => {
      addEntry({
        name,
        entryType: 'mark',
        startTime: clock,
        ...(options?.detail !== undefined && { detail: options.detail }),
      });
    },
    measure: (name: string, options?: { start?: string | number; detail?: unknown }) => {
      const start = typeof options?.start === 'string' ? clock - 250 : (options?.start ?? clock);
      addEntry({
        name,
        entryType: 'measure',
        startTime: start,
        duration: clock - start,
        ...(options?.detail !== undefined && { detail: options.detail }),
      });
    },
    getEntriesByName: (name: string) => entries.filter((entry) => entry.name === name),
  };

  class PerformanceObserver {
    callback: (list: { getEntries: () => FakeEntry[] }) => void;
    type?: string;

    constructor(callback: (list: { getEntries: () => FakeEntry[] }) => void) {
      this.callback = callback;
    }

    // Mirrors the real dispatch-by-type contract: an observer only receives
    // entries of the type it registered for
    observe(options: { type?: string }) {
      this.type = options.type;
      observers.push(this);
    }

    disconnect() {}
  }

  const emit = (name: string, entryType: string) => addEntry({ name, entryType, startTime: clock });

  return { performance, PerformanceObserver, emit };
};

// Babel hoists jest.mock above imports: factories may only close over
// `mock`-prefixed bindings (repo test rule, see ai/AGENTS.md testing notes)
const mockFakeLib = createFakePerformance();
jest.mock('react-native-performance', () => ({
  default: mockFakeLib.performance,
  PerformanceObserver: mockFakeLib.PerformanceObserver,
  setResourceLoggingEnabled: jest.fn(),
}));

// In-file MMKV factory: records created instances and call args (a jest.spyOn
// the requireMock object does NOT intercept the module copy that perf.ts's
// transformed import receives — separate registry entries)
const mockMmkvInstances: Array<{
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
}> = [];
const mockMmkvCalls: Array<Array<{ id?: string }>> = [];
jest.mock('react-native-mmkv', () => ({
  __esModule: true,
  createMMKV: jest.fn((...args: Array<{ id?: string }>) => {
    mockMmkvCalls.push(args);
    const store: Record<string, string> = {};
    const instance = {
      set: (key: string, value: string) => {
        store[key] = value;
      },
      getString: (key: string) => store[key],
    };
    mockMmkvInstances.push(instance);
    return instance;
  }),
}));

const requirePerf = () => require('@/shared/perf') as typeof import('@/shared/perf');

const lastMmkvInstance = () => mockMmkvInstances[mockMmkvInstances.length - 1];

beforeEach(() => {
  jest.resetModules();
  delete process.env.EXPO_PUBLIC_PERF_MONITOR;
});

afterEach(() => {
  delete process.env.EXPO_PUBLIC_PERF_MONITOR;
});

// =============================================================================
// GATE OFF TESTS
// =============================================================================

describe('perf with EXPO_PUBLIC_PERF_MONITOR unset (default builds)', () => {
  it('never creates the MMKV perf instance, never records anything, never throws', () => {
    const perf = requirePerf();

    perf.initPerfMonitor();
    perf.perfMark('anything');
    perf.perfMeasure('anything', 'start');
    perf.perfFlush();

    expect(mockMmkvInstances).toHaveLength(0);
    expect(perf.getPerfRing()).toEqual([]);
  });

  it('is safe to call from every call site shape used in the app', () => {
    const perf = requirePerf();

    expect(() => {
      perf.initPerfMonitor();
      perf.perfMark('toggle_tap', { label: 'Show hijri date' });
      perf.perfMeasure('overlay_open', 'overlay_open_start', { scheduleType: 'standard' });
      perf.perfFlush('test');
    }).not.toThrow();
  });
});

// =============================================================================
// GATE ON TESTS
// =============================================================================

describe('perf with EXPO_PUBLIC_PERF_MONITOR=1', () => {
  it('initializes the MMKV ring and records marks with detail and epoch timestamps', () => {
    process.env.EXPO_PUBLIC_PERF_MONITOR = '1';
    const perf = requirePerf();
    perf.initPerfMonitor();
    expect(mockMmkvCalls).toEqual([[{ id: 'perf-monitor' }]]);

    perf.perfMark('toggle_tap', { label: 'Show hijri date' });

    const ring = perf.getPerfRing();
    const names = ring.map((entry) => entry.name);
    expect(names).toContain('perf_monitor_init');
    expect(names).toContain('toggle_tap');
    const tap = ring.find((entry) => entry.name === 'toggle_tap');
    expect(tap?.detail).toEqual({ label: 'Show hijri date' });
    expect(tap?.ts).toBeGreaterThan(0);
  });

  it('records a measure only when the start mark exists', () => {
    process.env.EXPO_PUBLIC_PERF_MONITOR = '1';
    const perf = requirePerf();
    perf.initPerfMonitor();

    // Missing start mark: silent no-op (first-render effects, dropped taps)
    perf.perfMeasure('overlay_close', 'overlay_close_start');
    expect(perf.getPerfRing().some((entry) => entry.name === 'overlay_close')).toBe(false);

    perf.perfMark('overlay_open_start');
    perf.perfMeasure('overlay_open', 'overlay_open_start');

    const opened = perf.getPerfRing().find((entry) => entry.name === 'overlay_open');
    expect(opened?.type).toBe('measure');
    expect(opened?.duration).toBeGreaterThan(0);
  });

  it('flushes the ring snapshot into the perf-monitor MMKV instance', () => {
    process.env.EXPO_PUBLIC_PERF_MONITOR = '1';
    const perf = requirePerf();
    perf.initPerfMonitor();

    perf.perfMark('sheet_settings_present');
    perf.perfMark('sheet_settings_animate');
    perf.perfMeasure('sheet_settings_open', 'sheet_settings_present');
    perf.perfFlush('test');

    const raw = lastMmkvInstance()?.getString('perf_ring');
    expect(raw).toBeDefined();

    const parsed = JSON.parse(raw as string) as { reason: string; count: number; entries: Array<{ name: string }> };
    expect(parsed.reason).toBe('test');
    expect(parsed.count).toBeGreaterThan(0);
    expect(parsed.entries.map((entry) => entry.name)).toContain('sheet_settings_open');
  });

  it('bounds the ring at capacity (ring semantics, not a log)', () => {
    process.env.EXPO_PUBLIC_PERF_MONITOR = '1';
    const perf = requirePerf();
    perf.initPerfMonitor();

    for (let i = 0; i < 700; i += 1) {
      perf.perfMark(`spam_${i}`);
    }

    expect(perf.getPerfRing().length).toBeLessThanOrEqual(600);
    expect(perf.getPerfRing().some((entry) => entry.name === 'spam_0')).toBe(false);
    expect(perf.getPerfRing().some((entry) => entry.name === 'spam_699')).toBe(true);
  });

  it('derives launch measures from native marks idempotently', () => {
    process.env.EXPO_PUBLIC_PERF_MONITOR = '1';
    const perf = requirePerf();
    perf.initPerfMonitor();

    // Simulate native launch marks flowing in after init (buffered replay)
    mockFakeLib.emit('nativeLaunchStart', 'react-native-mark');
    mockFakeLib.emit('nativeLaunchEnd', 'react-native-mark');
    mockFakeLib.emit('runJsBundleStart', 'react-native-mark');
    mockFakeLib.emit('runJsBundleEnd', 'react-native-mark');
    mockFakeLib.emit('contentAppeared', 'react-native-mark');

    const launchMeasures = (name: string) =>
      perf.getPerfRing().filter((entry) => entry.name === name && entry.type === 'measure');
    expect(launchMeasures('launch_native')).toHaveLength(1);
    expect(launchMeasures('launch_js_bundle')).toHaveLength(1);

    // A second native-mark batch must not duplicate the derived measures
    mockFakeLib.emit('nativeLaunchEnd', 'react-native-mark');
    expect(launchMeasures('launch_native')).toHaveLength(1);
  });
});
