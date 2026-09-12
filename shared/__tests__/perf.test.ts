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

/** Where the fake's monotonic clock starts — a non-zero origin, so an entry
 *  dated on the monotonic axis can never be mistaken for one dated on the
 *  epoch axis by coincidence. */
const FAKE_CLOCK_ORIGIN = 1000;

// Functional fake: a faithful mini user-timing implementation (entries list,
// observer fan-out on every entry) so perf.ts's ring/flush/derivation logic
// runs for real. Observers receive every entry regardless of observed type —
// the assertions below only rely on names/types, which stay accurate.
//
// The clock ADVANCES (see `advance`), and `timeOrigin` is snapshotted at
// creation while `now()` tracks the clock, exactly as the real library does:
// its timeOrigin is one now() reading taken when the module loaded. A frozen
// clock cannot tell the ring's epoch conversion from any other expression
// that happens to agree at a single instant.
const createFakePerformance = () => {
  const entries: FakeEntry[] = [];
  const observers: Array<{ callback: (list: { getEntries: () => FakeEntry[] }) => void; type?: string }> = [];
  let clock = FAKE_CLOCK_ORIGIN;
  // Non-null while delivery is held back, modelling the real observer's
  // requestAnimationFrame hop between an entry happening and being delivered
  let held: FakeEntry[] | null = null;

  const dispatch = (entry: FakeEntry) => {
    for (const observer of observers) {
      if (observer.type && observer.type !== entry.entryType) continue;
      observer.callback({ getEntries: () => [entry] });
    }
  };

  const addEntry = (entry: FakeEntry) => {
    entries.push(entry);
    if (held) {
      held.push(entry);
      return;
    }
    dispatch(entry);
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

  /** Moves the monotonic clock on; callers move the epoch clock in step. */
  const advance = (ms: number) => {
    clock += ms;
  };

  const resetClock = () => {
    clock = FAKE_CLOCK_ORIGIN;
    held = null;
  };

  const holdDelivery = () => {
    held = [];
  };

  const releaseDelivery = () => {
    const pending = held ?? [];
    held = null;
    for (const entry of pending) dispatch(entry);
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

  return { performance, PerformanceObserver, emit, advance, resetClock, holdDelivery, releaseDelivery };
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
  delete process.env.EXPO_PUBLIC_ENV;
});

afterEach(() => {
  delete process.env.EXPO_PUBLIC_PERF_MONITOR;
  delete process.env.EXPO_PUBLIC_ENV;
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

  it('buffers nothing from pre-init marks (import-time work stays free)', () => {
    const perf = requirePerf();

    perf.perfMark('bootstrap_start');
    perf.perfMark('bootstrap_done');
    perf.initPerfMonitor();

    expect(mockMmkvInstances).toHaveLength(0);
    expect(perf.getPerfRing()).toEqual([]);
  });

  // The variable can survive into a store build (a stale .env, an EAS profile
  // secret). Production must ignore it, or a release ships a 600-entry MMKV
  // ring and the library it is supposed to fold out entirely.
  it('stays off in a prod build even with EXPO_PUBLIC_PERF_MONITOR=1', () => {
    process.env.EXPO_PUBLIC_PERF_MONITOR = '1';
    process.env.EXPO_PUBLIC_ENV = 'prod';
    const perf = requirePerf();

    perf.initPerfMonitor();
    perf.perfMark('toggle_tap');
    perf.perfFlush('test');

    expect(mockMmkvInstances).toHaveLength(0);
    expect(perf.getPerfRing()).toEqual([]);
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

  it('replays marks made before init, in capture order, carrying their true epoch', () => {
    process.env.EXPO_PUBLIC_PERF_MONITOR = '1';
    const perf = requirePerf();

    // Import-time work (stores/bootstrap) marks before the monitor exists
    const before = Date.now();
    perf.perfMark('bootstrap_start');
    perf.perfMark('bootstrap_done', { didBootstrap: true });
    expect(perf.getPerfRing()).toEqual([]);

    perf.initPerfMonitor();

    const names = perf.getPerfRing().map((entry) => entry.name);
    expect(names.slice(0, 3)).toEqual(['bootstrap_start', 'bootstrap_done', 'perf_monitor_init']);

    // The ring ts is the REPLAY time, so the capture epoch rides in detail.at
    const done = perf.getPerfRing().find((entry) => entry.name === 'bootstrap_done');
    const detail = done?.detail as { didBootstrap: boolean; at: number };
    expect(detail.didBootstrap).toBe(true);
    expect(detail.at).toBeGreaterThanOrEqual(before);
    expect(detail.at).toBeLessThanOrEqual(Date.now());
  });

  it('bounds the pre-init buffer (a monitor that never starts cannot grow it)', () => {
    process.env.EXPO_PUBLIC_PERF_MONITOR = '1';
    const perf = requirePerf();

    for (let i = 0; i < 80; i += 1) {
      perf.perfMark(`early_${i}`);
    }
    perf.initPerfMonitor();

    const replayed = perf.getPerfRing().filter((entry) => entry.name.startsWith('early_'));
    expect(replayed).toHaveLength(50);
    expect(replayed[0].name).toBe('early_0');
    expect(perf.getPerfRing().some((entry) => entry.name === 'early_79')).toBe(false);
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

// =============================================================================
// RING TIMESTAMP AXIS
// =============================================================================

/**
 * `ts` is the only epoch the offline analysis has. Cross-clock launch spans
 * are reconstructed by subtracting two of them, so a `ts` that tracks the
 * reader instead of the event does not merely shift the numbers — it doubles
 * every span, and a doubled span still looks like a plausible measurement.
 *
 * The spans below are the real iOS baseline (perf_monitor_init ->
 * index_first_render 900ms -> home_content 676ms). Several instants, not one:
 * the defect is exactly zero at the origin and grows with elapsed time, so a
 * fixture that only ever looks at the first mark cannot see it, and the
 * assertion this replaces — `ts > 0` — holds under every version of the
 * expression.
 */
describe('perf ring timestamps', () => {
  const EPOCH_AT_INIT = Date.UTC(2026, 8, 12, 10, 30, 0);

  beforeEach(() => {
    mockFakeLib.resetClock();
    jest.useFakeTimers({ now: EPOCH_AT_INIT });
    process.env.EXPO_PUBLIC_PERF_MONITOR = '1';
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /** Moves the epoch clock and the monotonic clock together, as a device does */
  const advance = (ms: number) => {
    jest.setSystemTime(Date.now() + ms);
    mockFakeLib.advance(ms);
  };

  const tsByName = (perf: ReturnType<typeof requirePerf>, name: string): number | undefined =>
    perf.getPerfRing().find((entry) => entry.name === name)?.ts;

  it('dates entries on the epoch axis, so mark-to-mark deltas are the true wall spans', () => {
    const perf = requirePerf();
    perf.initPerfMonitor();

    advance(900);
    perf.perfMark('index_first_render');
    advance(676);
    perf.perfMark('home_content');

    expect(tsByName(perf, 'perf_monitor_init')).toBe(EPOCH_AT_INIT);
    expect(tsByName(perf, 'index_first_render')).toBe(EPOCH_AT_INIT + 900);
    expect(tsByName(perf, 'home_content')).toBe(EPOCH_AT_INIT + 1576);

    // Stated as spans too, because the span is what the analysis reads
    const init = tsByName(perf, 'perf_monitor_init') as number;
    const render = tsByName(perf, 'index_first_render') as number;
    const content = tsByName(perf, 'home_content') as number;
    expect(render - init).toBe(900);
    expect(content - render).toBe(676);
    expect(content - init).toBe(1576);
  });

  it('dates an entry by when it happened, not when the observer delivered it', () => {
    const perf = requirePerf();
    perf.initPerfMonitor();

    // Two marks at the SAME instant; only the delivery differs. The real
    // observer hops through requestAnimationFrame, and during a cold launch
    // that hop is long and varies per entry.
    perf.perfMark('delivered_now');
    mockFakeLib.holdDelivery();
    perf.perfMark('delivered_late');
    advance(400);
    mockFakeLib.releaseDelivery();

    expect(tsByName(perf, 'delivered_late')).toBe(tsByName(perf, 'delivered_now'));
    expect(tsByName(perf, 'delivered_late')).toBe(EPOCH_AT_INIT);
  });

  it('is unaffected by how long the library sat loaded before init ran', () => {
    const perf = requirePerf();

    // The module loads at import time; app/_layout.tsx calls init later. The
    // library's timeOrigin is pinned to the load, so an offset derived from it
    // carries this gap into every entry.
    advance(5000);
    perf.initPerfMonitor();
    advance(900);
    perf.perfMark('index_first_render');

    expect(tsByName(perf, 'perf_monitor_init')).toBe(EPOCH_AT_INIT + 5000);
    expect(tsByName(perf, 'index_first_render')).toBe(EPOCH_AT_INIT + 5900);
  });
});
