/**
 * Unit tests for stores/countdown.ts
 *
 * Tests countdown state management including:
 * - Countdown atom default values
 * - Atom selection by schedule type
 */

import { createStore, atom as mockAtom } from 'jotai';

import { refreshSequence } from '@/stores/schedule';

// =============================================================================
// MOCK SETUP
// =============================================================================

jest.mock('@/shared/time', () => ({
  // All helpers are pure and Date.now-driven: delegate to the real module so a
  // faked system clock makes every path deterministic (incl. tz conversions,
  // which read the same faked clock)
  ...jest.requireActual('@/shared/time'),
}));

const mockStandardSequenceAtom = mockAtom(null);
const mockExtraSequenceAtom = mockAtom(null);

jest.mock('@/stores/schedule', () => ({
  refreshSequence: jest.fn(),
  getNextPrayer: jest.fn(() => ({
    english: 'Fajr',
    datetime: new Date('2026-01-20T06:15:00Z'),
  })),
  getSequenceAtom: jest.fn((type: string) => (type === 'standard' ? mockStandardSequenceAtom : mockExtraSequenceAtom)),
  standardDisplayDateAtom: mockAtom('2026-01-20'),
  extraDisplayDateAtom: mockAtom('2026-01-20'),
}));

const mockOverlayAtom = mockAtom({
  isOn: false,
  selectedPrayerIndex: 0,
  scheduleType: 'standard',
});

jest.mock('@/stores/atoms/overlay', () => ({
  overlayAtom: mockOverlayAtom,
}));

import { ScheduleType } from '@/shared/types';

// Require (not import) after mocks - babel hoists ESM imports above the mock declarations
const {
  extraCountdownAtom,
  getCountdownAtom,
  overlayCountdownAtom,
  standardCountdownAtom,
  startCountdowns,
}: typeof import('../countdown') = require('../countdown');

// =============================================================================
// SETUP
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();
});

// =============================================================================
// DEFAULT VALUES TESTS
// =============================================================================

describe('countdown atoms defaults', () => {
  it('standardCountdownAtom has default timeLeft of 10 and name Fajr', () => {
    const store = createStore();
    const value = store.get(standardCountdownAtom);
    expect(value).toEqual({ timeLeft: 10, name: 'Fajr' });
  });

  it('extraCountdownAtom has default timeLeft of 10 and name Fajr', () => {
    const store = createStore();
    const value = store.get(extraCountdownAtom);
    expect(value).toEqual({ timeLeft: 10, name: 'Fajr' });
  });

  it('overlayCountdownAtom has default timeLeft of 10', () => {
    const store = createStore();
    const value = store.get(overlayCountdownAtom);
    expect(value.timeLeft).toBe(10);
  });
});

// =============================================================================
// getCountdownAtom TESTS
// =============================================================================

describe('getCountdownAtom', () => {
  it('returns standardCountdownAtom for Standard schedule type', () => {
    const result = getCountdownAtom(ScheduleType.Standard);
    expect(result).toBe(standardCountdownAtom);
  });

  it('returns extraCountdownAtom for Extra schedule type', () => {
    const result = getCountdownAtom(ScheduleType.Extra);
    expect(result).toBe(extraCountdownAtom);
  });

  it('returns different atoms for different schedule types', () => {
    const standardAtom = getCountdownAtom(ScheduleType.Standard);
    const extraAtom = getCountdownAtom(ScheduleType.Extra);
    expect(standardAtom).not.toBe(extraAtom);
  });
});

// =============================================================================
// ATOM BEHAVIOR TESTS
// =============================================================================

describe('countdown atom behavior', () => {
  it('atoms can be updated', () => {
    const store = createStore();
    store.set(standardCountdownAtom, { timeLeft: 100, name: 'Dhuhr' });
    expect(store.get(standardCountdownAtom)).toEqual({ timeLeft: 100, name: 'Dhuhr' });
  });

  it('countdown atoms are independent', () => {
    const store = createStore();
    store.set(standardCountdownAtom, { timeLeft: 50, name: 'Asr' });
    store.set(extraCountdownAtom, { timeLeft: 75, name: 'Midnight' });

    expect(store.get(standardCountdownAtom).name).toBe('Asr');
    expect(store.get(extraCountdownAtom).name).toBe('Midnight');
  });

  it('different stores have independent state', () => {
    const store1 = createStore();
    const store2 = createStore();

    store1.set(standardCountdownAtom, { timeLeft: 100, name: 'Dhuhr' });
    store2.set(standardCountdownAtom, { timeLeft: 200, name: 'Asr' });

    expect(store1.get(standardCountdownAtom).timeLeft).toBe(100);
    expect(store2.get(standardCountdownAtom).timeLeft).toBe(200);
  });
});

// =============================================================================
// SEQUENCE COUNTDOWN TRANSITION TESTS
// =============================================================================

describe('sequence countdown transition (clock-based)', () => {
  it('refreshes the sequence when the wall clock reaches the prayer time, never displaying 0s', () => {
    jest.useFakeTimers();

    // Prayer at 06:15:00Z; system clock starts exactly on 06:14:58Z (2s away).
    // Fake timers fake Date.now, so the tickers' wall-second scheduling is
    // deterministic: first tick at +1000ms, then one per second.
    jest.setSystemTime(new Date('2026-01-20T06:14:58.000Z'));

    // The store module writes to jotai's default store — read the same one
    const { getDefaultStore } = require('jotai/vanilla');
    const defaultStore = getDefaultStore();

    startCountdowns();

    // Initial state before any tick: ceil(2s) = 2, never 0
    expect(defaultStore.get(standardCountdownAtom).timeLeft).toBe(2);

    jest.advanceTimersByTime(1000); // tick at 06:14:59: 1s left, no transition
    expect(refreshSequence).not.toHaveBeenCalled();
    expect(defaultStore.get(standardCountdownAtom).timeLeft).toBe(1);

    jest.advanceTimersByTime(999); // still inside 06:14:59 (tick fired at :59.000)
    expect(refreshSequence).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1); // tick at 06:15:00: the clock reached the prayer
    expect(refreshSequence).toHaveBeenCalledWith(ScheduleType.Standard);
    expect(refreshSequence).toHaveBeenCalledWith(ScheduleType.Extra);

    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('holds the final digit at 1s across the boundary tick instead of 0s', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-20T06:14:59.500Z'));

    const { getDefaultStore } = require('jotai/vanilla');
    const defaultStore = getDefaultStore();

    startCountdowns();

    // 500ms remain: ceil rounds up to the digit being lived through -> 1
    expect(defaultStore.get(standardCountdownAtom).timeLeft).toBe(1);

    jest.clearAllTimers();
    jest.useRealTimers();
  });
});

// =============================================================================
// WALL-CLOCK TICKER INTEGRITY TESTS (F.6/F.7)
// =============================================================================

describe('ticker integrity (wall-second chain)', () => {
  const { getDefaultStore } = require('jotai/vanilla');

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('is immune to re-entrancy: repeated startCountdowns never stacks tickers', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-20T10:00:00.000Z'));

    // Baseline: 2026-08-29 baseline logs showed sync re-entrancy leaving up to SIX
    // concurrent std intervals; each start must fully replace the previous ticker
    startCountdowns();
    const baselineTimers = jest.getTimerCount();

    startCountdowns();
    startCountdowns();
    startCountdowns();
    startCountdowns();

    expect(jest.getTimerCount()).toBe(baselineTimers);

    // And exactly one atom write per wall second (a leaked chain would double-write)
    const defaultStore = getDefaultStore();
    const writes: number[] = [];
    const unsub = defaultStore.sub(standardCountdownAtom, () => {
      writes.push(defaultStore.get(standardCountdownAtom).timeLeft);
    });

    jest.advanceTimersByTime(5000);

    expect(writes.length).toBe(5);
    unsub();
  });

  it('aligns the first tick to the next wall-second boundary regardless of start phase', () => {
    jest.useFakeTimers();
    // Clock starts mid-second at :00.350 — first tick must land at :01.000, not :01.350
    jest.setSystemTime(new Date('2026-01-20T10:00:00.350Z'));

    const defaultStore = getDefaultStore();
    let firstTickAt: number | null = null;

    startCountdowns();

    // Subscribe after init: the first captured write is then the first TICK
    const unsub = defaultStore.sub(standardCountdownAtom, () => {
      if (firstTickAt === null) firstTickAt = Date.now();
    });

    jest.advanceTimersByTime(649);
    expect(firstTickAt).toBeNull(); // no tick before the boundary

    jest.advanceTimersByTime(1);
    expect(firstTickAt).toBe(new Date('2026-01-20T10:00:01.000Z').getTime());
    unsub();
  });

  it('self-corrects after a late tick: the next tick re-anchors to :000', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-20T10:00:00.000Z'));

    const defaultStore = getDefaultStore();
    const tickTimes: number[] = [];
    const unsub = defaultStore.sub(standardCountdownAtom, () => {
      tickTimes.push(Date.now());
    });

    startCountdowns();

    // A coarse advance delivers the +1000ms tick "late" (clock already at +1600
    // when the callback runs its scheduling) — the chain must absorb it: the
    // NEXT tick still lands exactly on the +2000ms wall-second boundary
    jest.advanceTimersByTime(1600);
    jest.advanceTimersByTime(400);

    expect(tickTimes.length).toBeGreaterThanOrEqual(2);
    for (const t of tickTimes) {
      expect(t % 1000).toBe(0);
    }
    unsub();
  });

  it('never displays 0s across a full countdown and swaps at the boundary', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-20T06:14:55.000Z'));

    // Target advances when refreshSequence runs — exactly like the real store:
    // the refresh updates the sequence synchronously BEFORE the restart reads it
    const asrTime = new Date('2026-01-20T06:15:00.000Z').getTime();
    const magribTime = new Date('2026-01-20T07:00:00.000Z').getTime();
    const { getNextPrayer } = require('@/stores/schedule');
    let sequenceRefreshed = false;
    (refreshSequence as jest.Mock).mockImplementation(() => {
      sequenceRefreshed = true;
    });
    (getNextPrayer as jest.Mock).mockImplementation(() =>
      sequenceRefreshed
        ? { english: 'Magrib', datetime: new Date(magribTime) }
        : { english: 'Asr', datetime: new Date(asrTime) }
    );

    const defaultStore = getDefaultStore();
    const values: number[] = [];
    const unsub = defaultStore.sub(standardCountdownAtom, () => {
      values.push(defaultStore.get(standardCountdownAtom).timeLeft);
    });

    startCountdowns();
    jest.advanceTimersByTime(7000); // 5..1, boundary at +5s, then next prayer

    // The display contract: counts down to 1, swaps to the next prayer at the
    // boundary instant, and 0 never appears
    expect(values).not.toContain(0);
    expect(values.slice(0, 5)).toEqual([5, 4, 3, 2, 1]);
    // After the boundary (06:15:00) the next prayer (07:00, 45m away) takes over
    expect(values).toContain(2700);
    expect(values.indexOf(2700)).toBe(5);
    unsub();
  });

  it('does not leak a dead chain across a transition restart', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-20T06:14:59.000Z'));

    const asrTime = new Date('2026-01-20T06:15:00.000Z').getTime();
    const magribTime = new Date('2026-01-20T07:00:00.000Z').getTime();
    const { getNextPrayer } = require('@/stores/schedule');
    let sequenceRefreshed = false;
    (refreshSequence as jest.Mock).mockImplementation(() => {
      sequenceRefreshed = true;
    });
    (getNextPrayer as jest.Mock).mockImplementation(() =>
      sequenceRefreshed
        ? { english: 'Magrib', datetime: new Date(magribTime) }
        : { english: 'Asr', datetime: new Date(asrTime) }
    );

    startCountdowns();
    const beforeTransition = jest.getTimerCount();

    jest.advanceTimersByTime(1500); // cross the 06:15:00 boundary

    expect(refreshSequence).toHaveBeenCalled();
    // The transition restart replaced the std/extra chains 1:1 — no strays
    expect(jest.getTimerCount()).toBe(beforeTransition);
  });
});

// =============================================================================
// OVERLAY COUNTDOWN TESTS
// =============================================================================

describe('overlay countdown end state', () => {
  const { getDefaultStore } = require('jotai/vanilla');

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('holds at 1s when its target passes — never displays 0s', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-20T10:00:00.000Z'));

    const defaultStore = getDefaultStore();
    defaultStore.set(mockStandardSequenceAtom, {
      type: 'standard',
      prayers: [{ english: 'Fajr', datetime: new Date('2026-01-20T10:00:02.000Z'), belongsToDate: '2026-01-20' }],
    });
    defaultStore.set(mockOverlayAtom, {
      isOn: true,
      selectedPrayerIndex: 0,
      scheduleType: 'standard',
    });

    const { startCountdownOverlay } = require('../countdown');
    startCountdownOverlay();

    jest.advanceTimersByTime(2500); // target passes at +2s

    const finalValue = defaultStore.get(overlayCountdownAtom);
    expect(finalValue.timeLeft).toBe(1);
    expect(finalValue.name).toBe('Fajr');
    expect(jest.getTimerCount()).toBe(0); // ticker stopped cleanly
  });
});
