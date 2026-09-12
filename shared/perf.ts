/**
 * Performance instrumentation — performance campaign Phase 2
 * (ai/features/performance/)
 *
 * Build-time gated by EXPO_PUBLIC_PERF_MONITOR=1: every export is a no-op and
 * react-native-performance is never even required when the gate is off, so
 * local and production builds pay zero cost. Measurement builds opt in via the
 * env var (inlined statically by Metro/Babel).
 *
 * Architecture:
 * - react-native-performance provides the user-timing API (mark/measure) plus
 *   native launch marks (nativeLaunchStart/End, runJsBundleStart/End,
 *   contentAppeared) from its autolinked native module.
 * - A PerformanceObserver feeds every mark/measure into a bounded in-memory
 *   ring buffer, mirrored to the 'perf-monitor' MMKV instance (separate from
 *   the app schema) and streamed to pino ('PERF' lines) for syslog/logcat
 *   extraction on physical devices.
 * - MMKV flushes: every FLUSH_THRESHOLD entries, on app background, and via
 *   perfFlush(). The ring is a snapshot (bounded overwrite), never a log.
 * - Marks made BEFORE initPerfMonitor() (import-time work such as the
 *   synchronous cache bootstrap) are buffered and replayed at init, carrying
 *   their true epoch in detail.at — see pendingMarks.
 */

import { AppState } from 'react-native';
import { createMMKV } from 'react-native-mmkv';

import logger from '@/shared/logger';

const PERF_ENABLED = process.env.EXPO_PUBLIC_PERF_MONITOR === '1';
const RING_CAPACITY = 600;
const FLUSH_THRESHOLD = 50;
const MMKV_ID = 'perf-monitor';
const RING_KEY = 'perf_ring';

interface RingEntry {
  seq: number;
  /** Unix epoch ms of the entry (converted from the monotonic clock) */
  ts: number;
  name: string;
  type: string;
  duration?: number;
  detail?: unknown;
}

type PerfModule = typeof import('react-native-performance');
type PerfPerformance = PerfModule['default'];

let perfModule: PerfModule | null = null;
let perfStorage: ReturnType<typeof createMMKV> | null = null;
const ring: RingEntry[] = [];
let seq = 0;
let epochOffset = 0;

/**
 * Marks recorded before initPerfMonitor() runs — module-scope work that
 * happens at import time, ahead of app/_layout.tsx's init call (ISSUES #32).
 *
 * A replayed entry's ring `ts` is the REPLAY time, not the capture time: the
 * authoritative epoch ms travels in `detail.at`. Bounded, so a build whose
 * monitor never initializes cannot grow this without limit.
 */
const PENDING_CAPACITY = 50;
const pendingMarks: Array<{ name: string; at: number; detail?: Record<string, unknown> }> = [];

/** Converts a PerformanceEntry into the compact ring representation */
const toRingEntry = (entry: {
  name: string;
  entryType: string;
  startTime: number;
  duration?: number;
  detail?: unknown;
}): RingEntry => {
  seq += 1;
  return {
    seq,
    ts: Math.round(Date.now() - epochOffset + entry.startTime),
    name: entry.name,
    type: entry.entryType,
    ...(entry.duration !== undefined && { duration: Math.round(entry.duration) }),
    ...(entry.detail !== undefined && { detail: entry.detail }),
  };
};

/** Writes the ring snapshot to MMKV (bounded, overwrite-per-flush) */
const flushRing = (reason: string) => {
  if (!perfStorage) return;

  const payload = { v: 1, reason, flushedAt: Date.now(), count: ring.length, entries: ring };
  perfStorage.set(RING_KEY, JSON.stringify(payload));
};

/** Observer callback for mark/measure entries: ring + MMKV + pino stream */
const recordEntries = (list: {
  getEntries: () => Array<{ name: string; entryType: string; startTime: number; duration?: number; detail?: unknown }>;
}) => {
  for (const entry of list.getEntries()) {
    const ringEntry = toRingEntry(entry);
    ring.push(ringEntry);

    if (ring.length > RING_CAPACITY) {
      ring.splice(0, ring.length - RING_CAPACITY);
    }

    // Live pino stream: measures at info (the numbers that matter), marks at
    // debug. Single-line JSON payloads — syslog/logcat stay greppable.
    if (ringEntry.type === 'measure') {
      logger.info(`PERF_MEASURE ${JSON.stringify(ringEntry)}`);
    } else {
      logger.debug(`PERF_MARK ${JSON.stringify(ringEntry)}`);
    }
  }

  if (ring.length % FLUSH_THRESHOLD === 0 && ring.length > 0) {
    flushRing('threshold');
  }
};

/**
 * Idempotently derives launch-phase measures from native marks.
 *
 * Only native↔native pairs are measured: the iOS native module emits marks on
 * a skewed timeline (epoch-converted CACurrentMediaTime), so crossing a
 * native mark with a JS-clock `now` produces garbage durations. Cross-clock
 * launch spans (e.g. process start → home content) are reconstructed offline
 * from the ring's epoch `ts` fields instead.
 */
const measureLaunchPhases = (performance: PerfPerformance) => {
  const hasEntry = (name: string) => performance.getEntriesByName(name).length > 0;
  const hasMeasure = (name: string) =>
    performance.getEntriesByName(name).some((entry) => entry.entryType === 'measure');

  if (!hasMeasure('launch_native') && hasEntry('nativeLaunchStart') && hasEntry('nativeLaunchEnd')) {
    performance.measure('launch_native', 'nativeLaunchStart', 'nativeLaunchEnd');
  }
  if (!hasMeasure('launch_js_bundle') && hasEntry('runJsBundleStart') && hasEntry('runJsBundleEnd')) {
    performance.measure('launch_js_bundle', 'runJsBundleStart', 'runJsBundleEnd');
  }
};

const handleAppStateChange = (state: string) => {
  if (state === 'background') {
    flushRing('background');
  }
};

/**
 * Initializes the performance monitor. Call once, as early as possible in the
 * app entry (app/_layout.tsx) so launch marks land before any observer exists
 * (buffered observers replay them).
 *
 * No-op unless EXPO_PUBLIC_PERF_MONITOR=1 at build time.
 */
export const initPerfMonitor = (): void => {
  if (!PERF_ENABLED || perfModule) return;

  // Lazy require keeps the library (and its global touch) out of non-monitor
  // builds entirely — same pattern as device/tasks.ts's deferred store require.
  const lib = require('react-native-performance') as PerfModule;
  perfModule = lib;
  epochOffset = Date.now() - lib.default.timeOrigin;
  perfStorage = createMMKV({ id: MMKV_ID });

  new lib.PerformanceObserver(recordEntries).observe({ type: 'mark', buffered: true });
  new lib.PerformanceObserver(recordEntries).observe({ type: 'measure', buffered: true });
  new lib.PerformanceObserver(() => measureLaunchPhases(lib.default)).observe({
    type: 'react-native-mark',
    buffered: true,
  });

  AppState.addEventListener('change', handleAppStateChange);

  // Replay pre-init marks in capture order so the import-time window appears
  // in the timeline ahead of perf_monitor_init (true epoch in detail.at)
  for (const pending of pendingMarks.splice(0)) {
    lib.default.mark(pending.name, { detail: { ...pending.detail, at: pending.at } });
  }

  lib.default.mark('perf_monitor_init');
  flushRing('init');
};

/**
 * Records a user-timing mark (a point in time, e.g. the moment of a tap)
 * @param name Mark name (convention: snake_case action, e.g. 'sheet_settings_present')
 * @param detail Optional structured payload (JSON-safe)
 */
export const perfMark = (name: string, detail?: Record<string, unknown>): void => {
  if (!PERF_ENABLED) return;

  if (!perfModule) {
    // Pre-init: keep the real epoch; initPerfMonitor replays these
    if (pendingMarks.length < PENDING_CAPACITY) pendingMarks.push({ name, at: Date.now(), detail });
    return;
  }

  perfModule.default.mark(name, detail ? { detail } : undefined);
};

/**
 * Records a duration from an existing mark to now. Silently no-ops when the
 * start mark does not exist (guards first-render effects and dropped taps).
 * @param name Measure name (convention: snake_case outcome, e.g. 'sheet_settings_open')
 * @param startMark Name of the mark to measure from
 * @param detail Optional structured payload (JSON-safe)
 */
export const perfMeasure = (name: string, startMark: string, detail?: Record<string, unknown>): void => {
  if (!PERF_ENABLED || !perfModule) return;
  if (perfModule.default.getEntriesByName(startMark).length === 0) return;

  perfModule.default.measure(name, { start: startMark, ...(detail ? { detail } : {}) });
};

/** Flushes the ring buffer to MMKV immediately (e.g. before a measurement run ends) */
export const perfFlush = (reason = 'manual'): void => {
  if (!PERF_ENABLED || !perfModule) return;

  flushRing(reason);
};

/** Test/inspection access to the in-memory ring (empty when disabled) */
export const getPerfRing = (): RingEntry[] => ring;
