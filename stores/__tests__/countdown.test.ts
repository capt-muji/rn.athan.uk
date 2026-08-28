/**
 * Unit tests for stores/countdown.ts
 *
 * Tests countdown state management including:
 * - Countdown atom default values
 * - Atom selection by schedule type
 */

import { createStore, atom as mockAtom } from 'jotai';

import * as TimeUtils from '@/shared/time';
import { refreshSequence } from '@/stores/schedule';

// =============================================================================
// MOCK SETUP
// =============================================================================

jest.mock('@/shared/time', () => ({
  createLondonDate: jest.fn(() => new Date('2026-01-20T10:00:00')),
  getSecondsBetween: jest.fn(() => 3600),
}));

const mockStandardSequenceAtom = mockAtom(null);
const mockExtraSequenceAtom = mockAtom(null);

jest.mock('@/stores/schedule', () => ({
  refreshSequence: jest.fn(),
  getNextPrayer: jest.fn(() => ({
    english: 'Fajr',
    datetime: new Date('2026-01-20T06:15:00'),
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
  it('refreshes the sequence when the clock reaches the prayer time, not on a decremented zero', () => {
    jest.useFakeTimers();

    // Prayer at 06:15:00; the clock starts 2s before it and advances one tick at a time.
    // Both Standard and Extra tickers read the clock (2 inits + 2 ticks per advance).
    const clockAt = (time: string) => (TimeUtils.createLondonDate as jest.Mock).mockReturnValueOnce(new Date(time));
    clockAt('2026-01-20T06:14:58'); // standard initial countdown state
    clockAt('2026-01-20T06:14:58'); // extra initial countdown state
    clockAt('2026-01-20T06:14:59'); // tick 1: standard
    clockAt('2026-01-20T06:14:59'); // tick 1: extra
    (TimeUtils.createLondonDate as jest.Mock).mockReturnValue(new Date('2026-01-20T06:15:00')); // tick 2 onward
    (TimeUtils.getSecondsBetween as jest.Mock).mockReturnValue(2);

    startCountdowns();

    jest.advanceTimersByTime(1000); // tick 1: one second left, no transition yet
    expect(refreshSequence).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000); // tick 2: the clock has reached the prayer time
    expect(refreshSequence).toHaveBeenCalledWith(ScheduleType.Standard);
    expect(refreshSequence).toHaveBeenCalledWith(ScheduleType.Extra);

    jest.clearAllTimers();
    jest.useRealTimers();
  });
});
