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
  // Delegate to real semantics so faked Date.now drives every calculation
  getSecondsRemaining: (target: Date) => Math.max(1, Math.ceil((target.getTime() - Date.now()) / 1000)),
  getWallSecondDelay: () => 1000 - (Date.now() % 1000),
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
