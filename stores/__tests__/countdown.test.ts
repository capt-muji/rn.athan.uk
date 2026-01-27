/**
 * Unit tests for stores/countdown.ts
 *
 * Tests countdown state management including:
 * - Countdown atom default values
 * - Atom selection by schedule type
 */

import { createStore, atom } from 'jotai';

// =============================================================================
// MOCK SETUP
// =============================================================================

jest.mock('@/shared/time', () => ({
  createLondonDate: jest.fn(() => new Date('2026-01-20T10:00:00')),
  getSecondsBetween: jest.fn(() => 3600),
}));

const mockStandardSequenceAtom = atom(null);
const mockExtraSequenceAtom = atom(null);

jest.mock('@/stores/schedule', () => ({
  refreshSequence: jest.fn(),
  getNextPrayer: jest.fn(() => ({
    english: 'Fajr',
    datetime: new Date('2026-01-20T06:15:00'),
  })),
  getSequenceAtom: jest.fn((type: string) =>
    type === 'standard' ? mockStandardSequenceAtom : mockExtraSequenceAtom
  ),
  standardDisplayDateAtom: atom('2026-01-20'),
  extraDisplayDateAtom: atom('2026-01-20'),
}));

const mockOverlayAtom = atom({
  isOn: false,
  selectedPrayerIndex: 0,
  scheduleType: 'standard',
});

jest.mock('@/stores/atoms/overlay', () => ({
  overlayAtom: mockOverlayAtom,
}));

import {
  standardCountdownAtom,
  extraCountdownAtom,
  overlayCountdownAtom,
  getCountdownAtom,
} from '../countdown';

import { ScheduleType } from '@/shared/types';

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
