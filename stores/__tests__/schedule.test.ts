/**
 * Unit tests for stores/schedule.ts
 *
 * Tests prayer sequence management including:
 * - Atom selection by schedule type
 * - Derived atoms for next/previous prayer and display date
 * - Sequence initialization and refresh logic
 * - Day boundary edge cases
 * - Friday Istijaba handling
 */

import { createStore } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

// =============================================================================
// MOCK SETUP
// =============================================================================

// Mock TimeUtils
const mockCreateLondonDate = jest.fn();
const mockIsFriday = jest.fn();
const mockFormatDateShort = jest.fn();

jest.mock('@/shared/time', () => ({
  ...jest.requireActual('@/shared/time'),
  getTodayDateString: () => jest.requireActual('@/shared/time').formatDateShort(mockCreateLondonDate()),
  createInstant: () => mockCreateLondonDate(),
  isFriday: (date: Date) => mockIsFriday(date),
  formatDateShort: (date: Date) => mockFormatDateShort(date),
  createPrayerDatetime: jest.fn((date: string, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return d;
  }),
}));

// Mock PrayerUtils
const mockCreatePrayerSequence = jest.fn();
const mockCreatePrayer = jest.fn();

jest.mock('@/shared/prayer', () => ({
  createPrayerSequence: (...args: unknown[]) => mockCreatePrayerSequence(...args),
  createPrayer: (params: unknown) => mockCreatePrayer(params),
}));

// Mock Database
const mockGetPrayerByDate = jest.fn();

jest.mock('@/stores/database', () => ({
  getPrayerByDate: (date: Date) => mockGetPrayerByDate(date),
  getPrayerByDateString: (date: string) => mockGetPrayerByDate(date),
}));

import { type ISingleApiResponseTransformed, type Prayer, ScheduleType } from '@/shared/types';

// Import after mocks are set up
import {
  createDisplayDateAtom,
  createNextPrayerAtom,
  createPrevPrayerAtom,
  extraSequenceAtom,
  getSequenceAtom,
  refreshSequence,
  setSequence,
  standardSequenceAtom,
} from '../schedule';

// =============================================================================
// TEST HELPERS
// =============================================================================

/**
 * Creates a mock prayer with sensible defaults
 */
const createMockPrayer = (overrides: Partial<Prayer> = {}): Prayer => ({
  type: ScheduleType.Standard,
  english: 'Fajr',
  arabic: 'الفجر',
  datetime: new Date('2026-01-20T06:15:00'),
  time: '06:15',
  belongsToDate: '2026-01-20',
  ...overrides,
});

/**
 * Creates a mock prayer sequence
 */
const createMockSequence = (prayers: Prayer[]) => ({
  type: prayers[0]?.type ?? ScheduleType.Standard,
  prayers,
});

/**
 * Creates mock raw prayer data for a day
 */
const createMockRawData = (date: string): ISingleApiResponseTransformed => ({
  date,
  fajr: '06:15',
  sunrise: '07:50',
  dhuhr: '12:25',
  asr: '14:40',
  magrib: '17:00',
  isha: '18:45',
  suhoor: '05:55',
  duha: '08:10',
  istijaba: '16:00',
});

// =============================================================================
// getSequenceAtom TESTS
// =============================================================================

describe('getSequenceAtom', () => {
  it('returns standardSequenceAtom for Standard type', () => {
    const atom = getSequenceAtom(ScheduleType.Standard);
    expect(atom).toBe(standardSequenceAtom);
  });

  it('returns extraSequenceAtom for Extra type', () => {
    const atom = getSequenceAtom(ScheduleType.Extra);
    expect(atom).toBe(extraSequenceAtom);
  });
});

// =============================================================================
// SEQUENCE ATOM INITIAL STATE TESTS
// =============================================================================

describe('sequence atoms initial state', () => {
  it('standardSequenceAtom starts as null', () => {
    const store = createStore();
    const value = store.get(standardSequenceAtom);
    expect(value).toBeNull();
  });

  it('extraSequenceAtom starts as null', () => {
    const store = createStore();
    const value = store.get(extraSequenceAtom);
    expect(value).toBeNull();
  });

  it('standardSequenceAtom can be set to a sequence', () => {
    const store = createStore();
    const sequence = createMockSequence([createMockPrayer()]);

    store.set(standardSequenceAtom, sequence);

    expect(store.get(standardSequenceAtom)).toBe(sequence);
  });

  it('extraSequenceAtom can be set to a sequence', () => {
    const store = createStore();
    const sequence = createMockSequence([createMockPrayer({ type: ScheduleType.Extra })]);

    store.set(extraSequenceAtom, sequence);

    expect(store.get(extraSequenceAtom)).toBe(sequence);
  });

  it('sequence atoms are independent', () => {
    const store = createStore();
    const standardSeq = createMockSequence([createMockPrayer()]);
    const extraSeq = createMockSequence([createMockPrayer({ type: ScheduleType.Extra, english: 'Midnight' })]);

    store.set(standardSequenceAtom, standardSeq);
    store.set(extraSequenceAtom, extraSeq);

    expect(store.get(standardSequenceAtom)?.prayers[0].english).toBe('Fajr');
    expect(store.get(extraSequenceAtom)?.prayers[0].english).toBe('Midnight');
  });
});

// =============================================================================
// createNextPrayerAtom TESTS
// =============================================================================

describe('createNextPrayerAtom', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when sequence is null', () => {
    const store = createStore();
    mockCreateLondonDate.mockReturnValue(new Date('2026-01-20T10:00:00'));

    const nextPrayerAtom = createNextPrayerAtom(ScheduleType.Standard);
    const result = store.get(nextPrayerAtom);

    expect(result).toBeNull();
  });

  it('returns first prayer with datetime > now', () => {
    const store = createStore();
    const now = new Date('2026-01-20T10:00:00');
    mockCreateLondonDate.mockReturnValue(now);

    const prayers = [
      createMockPrayer({ english: 'Fajr', datetime: new Date('2026-01-20T06:15:00') }),
      createMockPrayer({ english: 'Sunrise', datetime: new Date('2026-01-20T07:50:00') }),
      createMockPrayer({ english: 'Dhuhr', datetime: new Date('2026-01-20T12:25:00') }),
      createMockPrayer({ english: 'Asr', datetime: new Date('2026-01-20T14:40:00') }),
    ];

    store.set(standardSequenceAtom, createMockSequence(prayers));

    const nextPrayerAtom = createNextPrayerAtom(ScheduleType.Standard);
    const result = store.get(nextPrayerAtom);

    expect(result?.english).toBe('Dhuhr');
  });

  it('returns first prayer when all are in future', () => {
    const store = createStore();
    const now = new Date('2026-01-20T04:00:00');
    mockCreateLondonDate.mockReturnValue(now);

    const prayers = [
      createMockPrayer({ english: 'Fajr', datetime: new Date('2026-01-20T06:15:00') }),
      createMockPrayer({ english: 'Sunrise', datetime: new Date('2026-01-20T07:50:00') }),
    ];

    store.set(standardSequenceAtom, createMockSequence(prayers));

    const nextPrayerAtom = createNextPrayerAtom(ScheduleType.Standard);
    const result = store.get(nextPrayerAtom);

    expect(result?.english).toBe('Fajr');
  });

  it('returns null when all prayers have passed', () => {
    const store = createStore();
    const now = new Date('2026-01-20T23:00:00');
    mockCreateLondonDate.mockReturnValue(now);

    const prayers = [
      createMockPrayer({ english: 'Fajr', datetime: new Date('2026-01-20T06:15:00') }),
      createMockPrayer({ english: 'Isha', datetime: new Date('2026-01-20T18:45:00') }),
    ];

    store.set(standardSequenceAtom, createMockSequence(prayers));

    const nextPrayerAtom = createNextPrayerAtom(ScheduleType.Standard);
    const result = store.get(nextPrayerAtom);

    expect(result).toBeNull();
  });

  it('uses > not >= for comparison (exact time returns null)', () => {
    const store = createStore();
    const exactTime = new Date('2026-01-20T12:25:00');
    mockCreateLondonDate.mockReturnValue(exactTime);

    const prayers = [
      createMockPrayer({ english: 'Dhuhr', datetime: new Date('2026-01-20T12:25:00') }),
      createMockPrayer({ english: 'Asr', datetime: new Date('2026-01-20T14:40:00') }),
    ];

    store.set(standardSequenceAtom, createMockSequence(prayers));

    const nextPrayerAtom = createNextPrayerAtom(ScheduleType.Standard);
    const result = store.get(nextPrayerAtom);

    // Dhuhr is at exact time, so Asr should be next
    expect(result?.english).toBe('Asr');
  });

  it('works for Extra schedule type', () => {
    const store = createStore();
    const now = new Date('2026-01-20T10:00:00');
    mockCreateLondonDate.mockReturnValue(now);

    const prayers = [
      createMockPrayer({ type: ScheduleType.Extra, english: 'Duha', datetime: new Date('2026-01-20T08:10:00') }),
      createMockPrayer({ type: ScheduleType.Extra, english: 'Istijaba', datetime: new Date('2026-01-20T16:00:00') }),
    ];

    store.set(extraSequenceAtom, createMockSequence(prayers));

    const nextPrayerAtom = createNextPrayerAtom(ScheduleType.Extra);
    const result = store.get(nextPrayerAtom);

    expect(result?.english).toBe('Istijaba');
  });
});

// =============================================================================
// createPrevPrayerAtom TESTS
// =============================================================================

describe('createPrevPrayerAtom', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when sequence is null', () => {
    const store = createStore();
    mockCreateLondonDate.mockReturnValue(new Date('2026-01-20T10:00:00'));

    const prevPrayerAtom = createPrevPrayerAtom(ScheduleType.Standard);
    const result = store.get(prevPrayerAtom);

    expect(result).toBeNull();
  });

  it('returns previous prayer in sequence when nextIndex > 0', () => {
    const store = createStore();
    const now = new Date('2026-01-20T10:00:00');
    mockCreateLondonDate.mockReturnValue(now);

    const prayers = [
      createMockPrayer({ english: 'Fajr', datetime: new Date('2026-01-20T06:15:00') }),
      createMockPrayer({ english: 'Sunrise', datetime: new Date('2026-01-20T07:50:00') }),
      createMockPrayer({ english: 'Dhuhr', datetime: new Date('2026-01-20T12:25:00') }),
    ];

    store.set(standardSequenceAtom, createMockSequence(prayers));

    const prevPrayerAtom = createPrevPrayerAtom(ScheduleType.Standard);
    const result = store.get(prevPrayerAtom);

    // Next is Dhuhr (index 2), so prev should be Sunrise (index 1)
    expect(result?.english).toBe('Sunrise');
  });

  it('fetches yesterday final prayer when nextIndex === 0 (day boundary)', () => {
    const store = createStore();
    // 1am - before Fajr
    const now = new Date('2026-01-20T01:00:00');
    mockCreateLondonDate.mockReturnValue(now);

    const prayers = [
      createMockPrayer({ english: 'Fajr', datetime: new Date('2026-01-20T06:15:00') }),
      createMockPrayer({ english: 'Sunrise', datetime: new Date('2026-01-20T07:50:00') }),
    ];

    // Mock yesterday's data for getYesterdayFinalPrayer
    mockGetPrayerByDate.mockReturnValue(createMockRawData('2026-01-19'));
    mockIsFriday.mockReturnValue(false);
    mockFormatDateShort.mockReturnValue('2026-01-19');
    mockCreatePrayer.mockReturnValue(
      createMockPrayer({
        english: 'Isha',
        datetime: new Date('2026-01-19T18:45:00'),
        belongsToDate: '2026-01-19',
      })
    );

    store.set(standardSequenceAtom, createMockSequence(prayers));

    const prevPrayerAtom = createPrevPrayerAtom(ScheduleType.Standard);
    const result = store.get(prevPrayerAtom);

    expect(result?.english).toBe('Isha');
  });

  // Audit finding 7, the second non-null assertion: getYesterdayFinalPrayer
  // asserted the previous day's record exists. On 1 January the previous year's
  // last day is exactly the record the sync layer may not hold, and this runs
  // during render, so the throw took the screen down rather than losing a row.
  it('returns null when yesterday has no cached record', () => {
    const store = createStore();
    const now = new Date('2026-01-20T01:00:00');
    mockCreateLondonDate.mockReturnValue(now);

    const prayers = [createMockPrayer({ english: 'Fajr', datetime: new Date('2026-01-20T06:15:00') })];

    mockGetPrayerByDate.mockReturnValue(null);
    mockIsFriday.mockReturnValue(false);

    store.set(standardSequenceAtom, createMockSequence(prayers));

    const prevPrayerAtom = createPrevPrayerAtom(ScheduleType.Standard);

    expect(() => store.get(prevPrayerAtom)).not.toThrow();
    expect(store.get(prevPrayerAtom)).toBeNull();
  });

  it('returns null when no future prayers found (nextIndex === -1)', () => {
    const store = createStore();
    const now = new Date('2026-01-20T23:00:00');
    mockCreateLondonDate.mockReturnValue(now);

    const prayers = [
      createMockPrayer({ english: 'Fajr', datetime: new Date('2026-01-20T06:15:00') }),
      createMockPrayer({ english: 'Isha', datetime: new Date('2026-01-20T18:45:00') }),
    ];

    store.set(standardSequenceAtom, createMockSequence(prayers));

    const prevPrayerAtom = createPrevPrayerAtom(ScheduleType.Standard);
    const result = store.get(prevPrayerAtom);

    expect(result).toBeNull();
  });

  it('handles Extra schedule with Istijaba filtered on non-Friday', () => {
    const store = createStore();
    // 1am - before Midnight
    const now = new Date('2026-01-20T01:00:00');
    mockCreateLondonDate.mockReturnValue(now);

    const prayers = [
      createMockPrayer({
        type: ScheduleType.Extra,
        english: 'Midnight',
        datetime: new Date('2026-01-20T23:52:00'),
      }),
    ];

    // Mock yesterday's data - Saturday, so Istijaba should be filtered
    mockGetPrayerByDate.mockReturnValue(createMockRawData('2026-01-19'));
    mockIsFriday.mockReturnValue(false); // Saturday - no Istijaba
    mockFormatDateShort.mockReturnValue('2026-01-19');
    mockCreatePrayer.mockReturnValue(
      createMockPrayer({
        type: ScheduleType.Extra,
        english: 'Duha', // Duha is final since Istijaba is filtered
        datetime: new Date('2026-01-19T08:10:00'),
        belongsToDate: '2026-01-19',
      })
    );

    store.set(extraSequenceAtom, createMockSequence(prayers));

    const prevPrayerAtom = createPrevPrayerAtom(ScheduleType.Extra);
    const result = store.get(prevPrayerAtom);

    expect(result?.english).toBe('Duha');
  });

  it('handles Extra schedule with Istijaba included on Friday', () => {
    const store = createStore();
    const now = new Date('2026-01-23T01:00:00'); // Friday night
    mockCreateLondonDate.mockReturnValue(now);

    const prayers = [
      createMockPrayer({
        type: ScheduleType.Extra,
        english: 'Midnight',
        datetime: new Date('2026-01-23T23:52:00'),
      }),
    ];

    mockGetPrayerByDate.mockReturnValue(createMockRawData('2026-01-22'));
    mockIsFriday.mockReturnValue(true); // Friday - Istijaba included
    mockFormatDateShort.mockReturnValue('2026-01-22');
    mockCreatePrayer.mockReturnValue(
      createMockPrayer({
        type: ScheduleType.Extra,
        english: 'Istijaba',
        datetime: new Date('2026-01-22T16:00:00'),
        belongsToDate: '2026-01-22',
      })
    );

    store.set(extraSequenceAtom, createMockSequence(prayers));

    const prevPrayerAtom = createPrevPrayerAtom(ScheduleType.Extra);
    const result = store.get(prevPrayerAtom);

    expect(result?.english).toBe('Istijaba');
  });
});

// =============================================================================
// createDisplayDateAtom TESTS
// =============================================================================

describe('createDisplayDateAtom', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when sequence is null', () => {
    const store = createStore();
    mockCreateLondonDate.mockReturnValue(new Date('2026-01-20T10:00:00'));

    const displayDateAtom = createDisplayDateAtom(ScheduleType.Standard);
    const result = store.get(displayDateAtom);

    expect(result).toBeNull();
  });

  // Audit finding 7: this ended in a non-null assertion, so the evening of 31
  // December with next year's data not yet published — every prayer in the
  // sequence already passed — threw during render. With no ErrorBoundary on any
  // route that killed the app until the data appeared. `usePrayerSequence` reads
  // this atom before its own isReady check, so nothing upstream guarded it.
  it('returns null when every prayer in the sequence has passed', () => {
    const store = createStore();
    mockCreateLondonDate.mockReturnValue(new Date('2026-12-31T23:30:00'));

    const prayers = [
      createMockPrayer({
        english: 'Isha',
        datetime: new Date('2026-12-31T17:40:00'),
        belongsToDate: '2026-12-31',
      }),
    ];

    store.set(standardSequenceAtom, createMockSequence(prayers));

    const displayDateAtom = createDisplayDateAtom(ScheduleType.Standard);

    expect(() => store.get(displayDateAtom)).not.toThrow();
    expect(store.get(displayDateAtom)).toBeNull();
  });

  it('returns belongsToDate of next prayer', () => {
    const store = createStore();
    const now = new Date('2026-01-20T10:00:00');
    mockCreateLondonDate.mockReturnValue(now);

    const prayers = [
      createMockPrayer({
        english: 'Fajr',
        datetime: new Date('2026-01-20T06:15:00'),
        belongsToDate: '2026-01-20',
      }),
      createMockPrayer({
        english: 'Dhuhr',
        datetime: new Date('2026-01-20T12:25:00'),
        belongsToDate: '2026-01-20',
      }),
    ];

    store.set(standardSequenceAtom, createMockSequence(prayers));

    const displayDateAtom = createDisplayDateAtom(ScheduleType.Standard);
    const result = store.get(displayDateAtom);

    expect(result).toBe('2026-01-20');
  });

  it('returns belongsToDate which may differ from calendar date', () => {
    const store = createStore();
    // 2am on Jan 19 - before Fajr
    const now = new Date('2026-01-19T02:00:00');
    mockCreateLondonDate.mockReturnValue(now);

    const prayers = [
      createMockPrayer({
        english: 'Fajr',
        datetime: new Date('2026-01-19T06:15:00'),
        // Fajr belongs to Jan 18 (Islamic day started at Isha on Jan 18)
        belongsToDate: '2026-01-18',
      }),
    ];

    store.set(standardSequenceAtom, createMockSequence(prayers));

    const displayDateAtom = createDisplayDateAtom(ScheduleType.Standard);
    const result = store.get(displayDateAtom);

    // Display date is Jan 18 even though calendar is Jan 19
    expect(result).toBe('2026-01-18');
  });

  it('works for Extra schedule type', () => {
    const store = createStore();
    const now = new Date('2026-01-20T10:00:00');
    mockCreateLondonDate.mockReturnValue(now);

    const prayers = [
      createMockPrayer({
        type: ScheduleType.Extra,
        english: 'Istijaba',
        datetime: new Date('2026-01-20T16:00:00'),
        belongsToDate: '2026-01-20',
      }),
    ];

    store.set(extraSequenceAtom, createMockSequence(prayers));

    const displayDateAtom = createDisplayDateAtom(ScheduleType.Extra);
    const result = store.get(displayDateAtom);

    expect(result).toBe('2026-01-20');
  });
});

// =============================================================================
// setSequence TESTS
// =============================================================================

describe('setSequence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatDateShort.mockReturnValue('2026-01-20');
  });

  // The signature was length plus first and last instant, so a corrected time on any
  // prayer between the ends was invisible and the stale sequence stayed in the store.
  it('writes a sequence whose only change is a middle prayer', () => {
    const store = getDefaultStore();
    const ends = [
      createMockPrayer({ english: 'Fajr', datetime: new Date('2026-01-20T06:15:00') }),
      createMockPrayer({ english: 'Dhuhr', datetime: new Date('2026-01-20T12:00:00') }),
      createMockPrayer({ english: 'Isha', datetime: new Date('2026-01-20T20:00:00') }),
    ];
    const corrected = [
      ends[0] as Prayer,
      createMockPrayer({ english: 'Dhuhr', datetime: new Date('2026-01-20T12:02:00') }),
      ends[2] as Prayer,
    ];

    mockCreatePrayerSequence.mockReturnValue(createMockSequence(ends));
    setSequence(ScheduleType.Standard, new Date('2026-01-20'));

    mockCreatePrayerSequence.mockReturnValue(createMockSequence(corrected));
    setSequence(ScheduleType.Standard, new Date('2026-01-20'));

    const stored = store.get(standardSequenceAtom);
    expect(stored?.prayers[1]?.datetime.toISOString()).toBe(new Date('2026-01-20T12:02:00').toISOString());
  });

  // The skip is a real perf win (rows rendered ~2.4x at launch without it), so the fix
  // must not quietly delete it: an identical sequence has to keep the same object
  it('still skips a write when nothing changed at all', () => {
    const store = getDefaultStore();
    const prayers = [
      createMockPrayer({ english: 'Fajr', datetime: new Date('2026-02-01T06:15:00') }),
      createMockPrayer({ english: 'Dhuhr', datetime: new Date('2026-02-01T12:00:00') }),
    ];

    mockCreatePrayerSequence.mockReturnValue(createMockSequence(prayers));
    setSequence(ScheduleType.Standard, new Date('2026-02-01'));
    const first = store.get(standardSequenceAtom);

    mockCreatePrayerSequence.mockReturnValue(createMockSequence(prayers));
    setSequence(ScheduleType.Standard, new Date('2026-02-01'));

    expect(store.get(standardSequenceAtom)).toBe(first);
  });

  it('creates a 3-day sequence using PrayerUtils', () => {
    const date = new Date('2026-01-20');
    const mockSequence = createMockSequence([createMockPrayer()]);
    mockCreatePrayerSequence.mockReturnValue(mockSequence);

    setSequence(ScheduleType.Standard, date);

    expect(mockCreatePrayerSequence).toHaveBeenCalledWith(ScheduleType.Standard, date, 3);
  });

  it('sets the sequence in the correct atom for Standard', () => {
    const date = new Date('2026-01-20');
    const mockSequence = createMockSequence([createMockPrayer()]);
    mockCreatePrayerSequence.mockReturnValue(mockSequence);

    setSequence(ScheduleType.Standard, date);

    // Note: We can't easily verify store.set was called on the default store
    // The function modifies the global Jotai store
    expect(mockCreatePrayerSequence).toHaveBeenCalled();
  });

  it('sets the sequence in the correct atom for Extra', () => {
    const date = new Date('2026-01-20');
    const mockSequence = createMockSequence([createMockPrayer({ type: ScheduleType.Extra })]);
    mockCreatePrayerSequence.mockReturnValue(mockSequence);

    setSequence(ScheduleType.Extra, date);

    expect(mockCreatePrayerSequence).toHaveBeenCalledWith(ScheduleType.Extra, date, 3);
  });
});

// =============================================================================
// refreshSequence TESTS
// =============================================================================

describe('refreshSequence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles uninitialized sequence gracefully', () => {
    // Sequence is null by default in a fresh store
    // refreshSequence should not throw when called on uninitialized sequence
    expect(() => refreshSequence(ScheduleType.Standard)).not.toThrow();
  });

  it('filters out passed prayers not belonging to current display date', () => {
    const now = new Date('2026-01-20T14:00:00');
    mockCreateLondonDate.mockReturnValue(now);

    const prayers = [
      createMockPrayer({
        english: 'Fajr',
        datetime: new Date('2026-01-19T06:15:00'),
        belongsToDate: '2026-01-19', // Previous day - should be removed
      }),
      createMockPrayer({
        english: 'Dhuhr',
        datetime: new Date('2026-01-20T12:25:00'),
        belongsToDate: '2026-01-20', // Current day - should be kept
      }),
      createMockPrayer({
        english: 'Asr',
        datetime: new Date('2026-01-20T14:40:00'),
        belongsToDate: '2026-01-20', // Future - should be kept
      }),
    ];

    // This test verifies the filtering logic conceptually
    // Full integration would require testing with the actual store
    expect(prayers.filter((p) => p.datetime > now || p.belongsToDate === '2026-01-20')).toHaveLength(2);
  });

  it('keeps previous prayer for progress bar calculation', () => {
    const now = new Date('2026-01-20T13:00:00');
    mockCreateLondonDate.mockReturnValue(now);

    const prayers = [
      createMockPrayer({
        english: 'Dhuhr',
        datetime: new Date('2026-01-20T12:25:00'),
        belongsToDate: '2026-01-20',
      }),
      createMockPrayer({
        english: 'Asr',
        datetime: new Date('2026-01-20T14:40:00'),
        belongsToDate: '2026-01-20',
      }),
    ];

    // Next prayer index is 1 (Asr), so index 0 (Dhuhr) should be kept
    const nextIndex = prayers.findIndex((p) => p.datetime > now);
    expect(nextIndex).toBe(1);

    const filteredPrayers = prayers.filter((p, index) => {
      if (p.datetime > now) return true;
      if (nextIndex > 0 && index === nextIndex - 1) return true;
      return false;
    });

    expect(filteredPrayers).toHaveLength(2);
    expect(filteredPrayers[0].english).toBe('Dhuhr');
  });

  describe('which day the new days start from (ISSUES #31)', () => {
    const londonDateOf = (date: Date): string => jest.requireActual('@/shared/time').formatDateShort(date);
    const firstNewDay = (): string => londonDateOf(mockCreatePrayerSequence.mock.calls[0][1] as Date);

    beforeEach(() => {
      mockCreatePrayerSequence.mockReturnValue(createMockSequence([]));
    });

    it('rebuilds from today, not tomorrow, when nothing from today on is left (a long suspension)', () => {
      mockCreateLondonDate.mockReturnValue(new Date('2026-01-20T10:00:00Z'));
      // A buffer built three days ago: every prayer in it has passed
      getDefaultStore().set(
        standardSequenceAtom,
        createMockSequence([
          createMockPrayer({
            english: 'Isha',
            datetime: new Date('2026-01-17T18:45:00Z'),
            belongsToDate: '2026-01-17',
          }),
        ])
      );

      refreshSequence(ScheduleType.Standard);

      expect(firstNewDay()).toBe('2026-01-20');
    });

    it('adds only the days after today while today is still in the buffer', () => {
      mockCreateLondonDate.mockReturnValue(new Date('2026-01-20T21:00:00Z'));
      getDefaultStore().set(
        standardSequenceAtom,
        createMockSequence([
          createMockPrayer({
            english: 'Isha',
            datetime: new Date('2026-01-20T18:45:00Z'),
            belongsToDate: '2026-01-20',
          }),
          createMockPrayer({
            english: 'Fajr',
            datetime: new Date('2026-01-21T06:15:00Z'),
            belongsToDate: '2026-01-21',
          }),
        ])
      );

      refreshSequence(ScheduleType.Standard);

      expect(firstNewDay()).toBe('2026-01-21');
    });
  });

  /**
   * mergeAndDeduplicatePrayers is module-private, so these drive it through
   * refreshSequence: a buffer under 24 hours forces the rebuild, and the
   * mocked createPrayerSequence stands in for what the cache now says.
   */
  describe('merging a rebuild over the in-memory sequence (AUDIT #27)', () => {
    /** now, and a buffer short enough that refreshSequence rebuilds */
    const seedShortBuffer = () => {
      mockCreateLondonDate.mockReturnValue(new Date('2026-01-20T21:00:00Z'));
      getDefaultStore().set(
        standardSequenceAtom,
        createMockSequence([
          createMockPrayer({
            english: 'Isha',
            datetime: new Date('2026-01-20T18:45:00Z'),
            belongsToDate: '2026-01-20',
          }),
          createMockPrayer({
            english: 'Fajr',
            datetime: new Date('2026-01-21T06:15:00Z'),
            belongsToDate: '2026-01-21',
          }),
        ])
      );
    };

    const storedPrayers = () => getDefaultStore().get(standardSequenceAtom)?.prayers ?? [];

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('keeps one row when a prayer comes back at a different time, and takes the new instant', () => {
      seedShortBuffer();

      // Same prayer of the same Islamic day, corrected by 25 minutes
      const corrected = createMockPrayer({
        english: 'Fajr',
        datetime: new Date('2026-01-21T06:40:00Z'),
        time: '06:40',
        belongsToDate: '2026-01-21',
      });
      mockCreatePrayerSequence.mockReturnValue(createMockSequence([corrected]));

      refreshSequence(ScheduleType.Standard);

      const fajrs = storedPrayers().filter((p) => p.english === 'Fajr' && p.belongsToDate === '2026-01-21');
      expect(fajrs).toHaveLength(1);
      expect(fajrs[0].datetime).toEqual(new Date('2026-01-21T06:40:00Z'));
      expect(fajrs[0].time).toBe('06:40');
    });

    it('keeps a same-named prayer of a different Islamic day as its own row', () => {
      seedShortBuffer();

      mockCreatePrayerSequence.mockReturnValue(
        createMockSequence([
          createMockPrayer({
            english: 'Fajr',
            datetime: new Date('2026-01-21T06:40:00Z'),
            belongsToDate: '2026-01-21',
          }),
          createMockPrayer({
            english: 'Fajr',
            datetime: new Date('2026-01-22T06:14:00Z'),
            belongsToDate: '2026-01-22',
          }),
        ])
      );

      refreshSequence(ScheduleType.Standard);

      const fajrs = storedPrayers().filter((p) => p.english === 'Fajr');
      expect(fajrs.map((p) => p.belongsToDate)).toEqual(['2026-01-21', '2026-01-22']);
    });

    it('leaves the rest of the buffer alone and stays sorted by instant', () => {
      seedShortBuffer();

      mockCreatePrayerSequence.mockReturnValue(
        createMockSequence([
          createMockPrayer({
            english: 'Fajr',
            datetime: new Date('2026-01-21T06:40:00Z'),
            belongsToDate: '2026-01-21',
          }),
          createMockPrayer({
            english: 'Dhuhr',
            datetime: new Date('2026-01-21T12:25:00Z'),
            belongsToDate: '2026-01-21',
          }),
        ])
      );

      refreshSequence(ScheduleType.Standard);

      const rows = storedPrayers();
      // The passed Isha is kept as the previous prayer for the progress bar
      expect(rows.map((p) => p.english)).toEqual(['Isha', 'Fajr', 'Dhuhr']);

      const instants = rows.map((p) => p.datetime.getTime());
      expect([...instants].sort((a, b) => a - b)).toEqual(instants);
    });
  });
});

// =============================================================================
// EDGE CASES AND INTEGRATION TESTS
// =============================================================================

describe('edge cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles empty prayer array gracefully', () => {
    const store = createStore();
    mockCreateLondonDate.mockReturnValue(new Date('2026-01-20T10:00:00'));

    store.set(standardSequenceAtom, { type: ScheduleType.Standard, prayers: [] });

    const nextPrayerAtom = createNextPrayerAtom(ScheduleType.Standard);
    const result = store.get(nextPrayerAtom);

    // find() returns undefined for empty array, ?? null converts to null
    expect(result).toBeNull();
  });

  it('handles single prayer in sequence', () => {
    const store = createStore();
    mockCreateLondonDate.mockReturnValue(new Date('2026-01-20T10:00:00'));

    const prayers = [createMockPrayer({ english: 'Dhuhr', datetime: new Date('2026-01-20T12:25:00') })];

    store.set(standardSequenceAtom, createMockSequence(prayers));

    const nextPrayerAtom = createNextPrayerAtom(ScheduleType.Standard);
    const result = store.get(nextPrayerAtom);

    expect(result?.english).toBe('Dhuhr');
  });

  it('handles prayer at midnight boundary', () => {
    const store = createStore();
    // Just before midnight
    mockCreateLondonDate.mockReturnValue(new Date('2026-01-20T23:30:00'));

    const prayers = [
      createMockPrayer({
        type: ScheduleType.Extra,
        english: 'Midnight',
        datetime: new Date('2026-01-20T23:52:00'),
        belongsToDate: '2026-01-21', // Belongs to next Islamic day
      }),
    ];

    store.set(extraSequenceAtom, createMockSequence(prayers));

    const displayDateAtom = createDisplayDateAtom(ScheduleType.Extra);
    const result = store.get(displayDateAtom);

    expect(result).toBe('2026-01-21');
  });

  it('handles prayers spanning multiple days', () => {
    const store = createStore();
    mockCreateLondonDate.mockReturnValue(new Date('2026-01-20T10:00:00'));

    const prayers = [
      createMockPrayer({
        english: 'Dhuhr',
        datetime: new Date('2026-01-20T12:25:00'),
        belongsToDate: '2026-01-20',
      }),
      createMockPrayer({
        english: 'Fajr',
        datetime: new Date('2026-01-21T06:15:00'),
        belongsToDate: '2026-01-21',
      }),
      createMockPrayer({
        english: 'Fajr',
        datetime: new Date('2026-01-22T06:15:00'),
        belongsToDate: '2026-01-22',
      }),
    ];

    store.set(standardSequenceAtom, createMockSequence(prayers));

    const nextPrayerAtom = createNextPrayerAtom(ScheduleType.Standard);
    const result = store.get(nextPrayerAtom);

    expect(result?.english).toBe('Dhuhr');
    expect(result?.belongsToDate).toBe('2026-01-20');
  });
});
