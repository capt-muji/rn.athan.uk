/**
 * Unit tests for stores/schedule.ts
 *
 * Tests prayer sequence management including:
 * - Atom selection by schedule type
 * - Derived atoms for next/previous prayer and display date
 * - Sequence initialization and refresh logic
 * - Day boundary edge cases
 * - Friday Istijaba handling
 *
 * The describes from "on the real builder" down run the real schedule, countdown and overlay stores, the
 * real list builder (shared/prayer.ts) and the real sequence rules (shared/sequence.ts) over a Map-backed
 * store of real London 2026 days, with the clock driven by fake timers. The module mocks below delegate
 * to the real implementations there; the describes above them script every answer instead.
 */

import { type Atom, createStore } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

// =============================================================================
// MOCK SETUP
// =============================================================================

// Mock TimeUtils
const mockCreateLondonDate = jest.fn();

jest.mock('@/shared/time', () => ({
  ...jest.requireActual('@/shared/time'),
  getTodayDateString: () => jest.requireActual('@/shared/time').formatDateShort(mockCreateLondonDate()),
  createInstant: () => mockCreateLondonDate(),
}));

// Mock PrayerUtils
const mockCreatePrayerSequence = jest.fn();
const mockCreatePrayersForDate = jest.fn((_type: ScheduleType, _date: string): Prayer[] => []);

jest.mock('@/shared/prayer', () => ({
  createPrayerSequence: (...args: unknown[]) => mockCreatePrayerSequence(...args),
  createPrayersForDate: (type: ScheduleType, date: string) => mockCreatePrayersForDate(type, date),
}));

// Mock Database: the rest of the module is real, for the stores the countdown pulls in
const mockGetPrayerByDateString = jest.fn();

jest.mock('@/stores/database', () => ({
  ...jest.requireActual('@/stores/database'),
  getPrayerByDateString: (date: string) => mockGetPrayerByDateString(date),
}));

import { calculatePrayerAgo } from '@/hooks/usePrayerAgo';
import { isRowPassed } from '@/shared/sequence';
import {
  type CountdownStore,
  type ISingleApiResponseTransformed,
  type Prayer,
  type ReadablePrayer,
  type RequiredTimeName,
  ScheduleType,
  type UnreadablePrayer,
} from '@/shared/types';
import { showSecondsAtom } from '@/stores/ui';

import {
  checkOverlayBoundary,
  clearOverlayBoundary,
  getBarAvailableAtom,
  getBarProgressAtom,
  getBarWarningAtom,
  getCountdownAtom,
  getCountdownDisplayAtom,
  resyncCountdowns,
  startCountdowns,
} from '../countdown';
import { closeOverlay, openOverlay, overlayAtom } from '../overlay';
// Import after mocks are set up
import {
  createDisplayDateAtom,
  createNextPrayerAtom,
  createPrevPrayerAtom,
  extraDisplayDateAtom,
  extraNextPrayerAtom,
  extraSequenceAtom,
  getDisplayDate,
  getNextBoundary,
  getNextPrayer,
  getPrevPrayer,
  getSequenceAtom,
  refreshSequence,
  setSequence,
  standardDisplayDateAtom,
  standardNextPrayerAtom,
  standardSequenceAtom,
} from '../schedule';

// =============================================================================
// TEST HELPERS
// =============================================================================

/**
 * Creates a mock prayer with sensible defaults
 */
const createMockPrayer = (overrides: Partial<ReadablePrayer> = {}): ReadablePrayer => ({
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

  it('builds the list before next from storage when the sequence holds no earlier readable row', () => {
    const store = createStore();
    // 1am - before Fajr
    const now = new Date('2026-01-20T01:00:00');
    mockCreateLondonDate.mockReturnValue(now);

    const prayers = [
      createMockPrayer({ english: 'Fajr', datetime: new Date('2026-01-20T06:15:00') }),
      createMockPrayer({ english: 'Sunrise', datetime: new Date('2026-01-20T07:50:00') }),
    ];

    mockCreatePrayersForDate.mockReturnValueOnce([
      createMockPrayer({ english: 'Isha', datetime: new Date('2026-01-19T18:45:00'), belongsToDate: '2026-01-19' }),
    ]);

    store.set(standardSequenceAtom, createMockSequence(prayers));

    const prevPrayerAtom = createPrevPrayerAtom(ScheduleType.Standard);
    const result = store.get(prevPrayerAtom);

    expect(mockCreatePrayersForDate).toHaveBeenCalledWith(ScheduleType.Standard, '2026-01-19');
    expect(result?.english).toBe('Isha');
  });

  // Audit finding 7, the second non-null assertion: the previous day's record was
  // asserted to exist. On 1 January the previous year's last day is exactly the
  // record the sync layer may not hold, and this runs during render, so the throw
  // took the screen down rather than losing a row. A day that is not stored comes
  // back from the builder with every row unreadable.
  it('returns null when the list before next has no readable row (not stored)', () => {
    const store = createStore();
    const now = new Date('2026-01-20T01:00:00');
    mockCreateLondonDate.mockReturnValue(now);

    const prayers = [createMockPrayer({ english: 'Fajr', datetime: new Date('2026-01-20T06:15:00') })];
    const notStored: UnreadablePrayer = {
      type: ScheduleType.Standard,
      english: 'Isha',
      arabic: 'العشاء',
      datetime: null,
      time: null,
      belongsToDate: '2026-01-19',
    };

    mockCreatePrayersForDate.mockReturnValueOnce([notStored]);

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
    expect(stored?.prayers[1]?.datetime?.toISOString()).toBe(new Date('2026-01-20T12:02:00').toISOString());
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
    // The default store still holds the sequence the setSequence tests left, which kept this
    // from ever reaching the uninitialized branch
    getDefaultStore().set(standardSequenceAtom, null);

    // refreshSequence should not throw when called on uninitialized sequence
    expect(() => refreshSequence(ScheduleType.Standard)).not.toThrow();
    expect(getDefaultStore().get(standardSequenceAtom)).toBeNull();
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

      const instants = rows.map((p) => p.datetime?.getTime() ?? Number.NaN);
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

// =============================================================================
// ON THE REAL BUILDER: real stores, list builder and sequence rules over real London days
// =============================================================================

const STANDARD = ScheduleType.Standard;
const EXTRA = ScheduleType.Extra;

/** Real London times from londonprayertimes.com for 2026: Fajr, Sunrise, Dhuhr, Asr, Magrib, Isha */
const LONDON_2026: Record<string, string[]> = {
  '2026-01-01': ['06:26', '08:03', '12:09', '13:46', '16:05', '17:42'],
  '2026-01-02': ['06:26', '08:03', '12:10', '13:47', '16:06', '17:43'],
  '2026-03-27': ['04:11', '05:45', '12:11', '15:33', '18:28', '19:46'],
  '2026-03-28': ['04:09', '05:42', '12:11', '15:34', '18:30', '19:48'],
  '2026-03-29': ['05:07', '06:40', '13:10', '16:35', '19:32', '20:49'],
  '2026-03-30': ['05:05', '06:38', '13:10', '16:36', '19:34', '20:51'],
  '2026-10-16': ['05:51', '07:23', '12:51', '15:31', '18:08', '19:31'],
  '2026-10-17': ['05:52', '07:25', '12:51', '15:30', '18:06', '19:29'],
  '2026-10-18': ['05:54', '07:27', '12:51', '15:28', '18:04', '19:27'],
  '2026-10-19': ['05:55', '07:28', '12:51', '15:26', '18:02', '19:25'],
  '2026-10-20': ['05:57', '07:30', '12:50', '15:25', '18:00', '19:23'],
  '2026-10-23': ['06:00', '07:35', '12:50', '15:20', '17:54', '19:19'],
  '2026-10-24': ['06:02', '07:37', '12:50', '15:18', '17:52', '19:17'],
  '2026-10-25': ['05:04', '06:39', '11:50', '14:17', '16:50', '18:17'],
  '2026-10-26': ['05:05', '06:41', '11:50', '14:15', '16:48', '18:15'],
};

const FIELDS: RequiredTimeName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];
const OCT_16_TO_20 = ['2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20'];

const STANDARD_ROWS = 'Fajr, Sunrise, Dhuhr, Asr, Magrib, Isha';
const STANDARD_DASHED = '[Fajr], [Sunrise], [Dhuhr], [Asr], [Magrib], [Isha]';
const EXTRAS_ROWS = 'Midnight, Last Third, Suhoor, Duha';
const EXTRAS_DASHED = '[Midnight], [Last Third], [Suhoor], [Duha]';

const storedDays = new Map<string, ISingleApiResponseTransformed>();

const actualPrayer = () => jest.requireActual<typeof import('@/shared/prayer')>('@/shared/prayer');

/**
 * Stores London days as the sync layer leaves them: the named fields unreadable, 'all' for a day the
 * provider sent nothing readable for. A date left out of `dates` is not stored at all.
 */
const storeDays = (dates: string[], unreadable: Record<string, RequiredTimeName[] | 'all'> = {}) => {
  storedDays.clear();

  for (const date of dates) {
    const broken = unreadable[date] ?? [];
    const times = Object.fromEntries(
      FIELDS.map((field, index) => [
        field,
        broken === 'all' || broken.includes(field) ? null : LONDON_2026[date][index],
      ])
    ) as Record<RequiredTimeName, string | null>;

    storedDays.set(date, actualPrayer().transformApiData({ city: 'london', times: { [date]: times } })[0]);
  }
};

/** How a row reads in an expectation: which prayer, of which list day, at which instant */
const row = (english: string, listDay: string, instant: string) => `${english} of ${listDay} at ${instant}`;

const label = (prayer: Prayer | null): string | null =>
  prayer && row(prayer.english, prayer.belongsToDate, prayer.datetime?.toISOString() ?? '--:--');

/** The rows the stored sequence holds, by list day, each row with no readable time in brackets */
const rowsHeld = (type: ScheduleType): Record<string, string> => {
  const byListDay: Record<string, string[]> = {};

  for (const prayer of getDefaultStore().get(getSequenceAtom(type))?.prayers ?? []) {
    byListDay[prayer.belongsToDate] ??= [];
    byListDay[prayer.belongsToDate].push(prayer.datetime ? prayer.english : `[${prayer.english}]`);
  }

  return Object.fromEntries(Object.entries(byListDay).map(([listDay, names]) => [listDay, names.join(', ')]));
};

interface Observation {
  next: string | null;
  displayDate: string | null;
  previous: string | null;
  countdown: CountdownStore;
  barAvailable: boolean;
  held: Record<string, string>;
}

/** Everything a schedule's page reads from the stores */
const observe = (type: ScheduleType): Observation => ({
  next: label(getNextPrayer(type)),
  displayDate: getDisplayDate(type),
  previous: label(getPrevPrayer(type)),
  countdown: getDefaultStore().get(getCountdownAtom(type)),
  barAvailable: getDefaultStore().get(getBarAvailableAtom(type)),
  held: rowsHeld(type),
});

/** The app opening at a moment, as sync() does it: both sequences built from storage, then the tickers */
const launchAt = (instant: string) => {
  jest.setSystemTime(new Date(instant));
  setSequence(STANDARD, new Date(instant));
  setSequence(EXTRA, new Date(instant));
  startCountdowns();
};

/**
 * Moves the clock without ticking through the time between. The pending tick moves with it, so this stands
 * for hours of the app running when nothing is due in them, or for a suspension when something is.
 */
const moveClockTo = (instant: string) => jest.setSystemTime(new Date(instant));

/**
 * Subscriptions a test leaves on the shared default store. Stopped in afterEach whether or not the test's
 * assertions passed, so a failure cannot leave atoms mounted for the tests after it.
 */
const testSubscriptions: (() => void)[] = [];

/** Keeps atoms subscribed for the rest of a test, as the mounted screen does */
const keepSubscribed = (...atoms: Atom<unknown>[]) => {
  for (const subscribed of atoms) testSubscriptions.push(getDefaultStore().sub(subscribed, () => {}));
};

/** Every write to a schedule's sequence from now on, as the instant it happened */
const recordSequenceWrites = (type: ScheduleType) => {
  const writes: string[] = [];
  const unsubscribe = getDefaultStore().sub(getSequenceAtom(type), () => writes.push(new Date().toISOString()));
  return { writes, unsubscribe };
};

/** Every countdown value written for a schedule from now on */
const recordCountdown = (type: ScheduleType) => {
  const values: CountdownStore[] = [];
  const unsubscribe = getDefaultStore().sub(getCountdownAtom(type), () =>
    values.push(getDefaultStore().get(getCountdownAtom(type)))
  );
  return { values, unsubscribe };
};

const rowOf = (type: ScheduleType, english: string, listDay: string): Prayer => {
  const prayers = getDefaultStore().get(getSequenceAtom(type))?.prayers ?? [];
  const found = prayers.find((prayer) => prayer.english === english && prayer.belongsToDate === listDay);
  if (!found) throw new Error(`${english} of ${listDay} is not in the sequence`);
  return found;
};

const isPassedNow = (type: ScheduleType, english: string, listDay: string): boolean =>
  isRowPassed(getDefaultStore().get(getSequenceAtom(type))?.prayers ?? [], rowOf(type, english, listDay), new Date());

describe('on the real builder', () => {
  beforeEach(() => {
    jest.useFakeTimers();

    const { createPrayerSequence, createPrayersForDate } = actualPrayer();
    mockCreateLondonDate.mockImplementation(() => new Date());
    mockCreatePrayerSequence.mockImplementation(createPrayerSequence);
    mockCreatePrayersForDate.mockImplementation(createPrayersForDate);
    mockGetPrayerByDateString.mockImplementation((date: string) => storedDays.get(date) ?? null);

    const store = getDefaultStore();
    store.set(standardSequenceAtom, null);
    store.set(extraSequenceAtom, null);
    store.set(overlayAtom, { isOn: false, selectedPrayerIndex: 0, scheduleType: STANDARD });
    store.set(showSecondsAtom, false);
    clearOverlayBoundary();
    storedDays.clear();
  });

  afterEach(() => {
    for (const stop of testSubscriptions.splice(0)) stop();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // Crossing one boundary: next, display date, previous, countdown, bar and the rows kept
  // ---------------------------------------------------------------------------

  describe('crossing a boundary next to a row with no readable time', () => {
    interface Crossing {
      title: string;
      dates: string[];
      unreadable: Record<string, RequiredTimeName[] | 'all'>;
      type: ScheduleType;
      /** Two seconds before the boundary */
      launch: string;
      before: Observation;
      after: Observation;
    }

    const crossings: Crossing[] = [
      {
        title: 'R9: Asr hands straight over to Isha past an unreadable Magrib, and the list stays',
        dates: OCT_16_TO_20,
        unreadable: { '2026-10-17': ['magrib'] },
        type: STANDARD,
        launch: '2026-10-17T14:29:58.000Z',
        before: {
          next: row('Asr', '2026-10-17', '2026-10-17T14:30:00.000Z'),
          displayDate: '2026-10-17',
          previous: row('Dhuhr', '2026-10-17', '2026-10-17T11:51:00.000Z'),
          countdown: { timeLeft: 2, name: 'Asr' },
          barAvailable: true,
          held: {
            '2026-10-17': 'Fajr, Sunrise, Dhuhr, Asr, [Magrib], Isha',
            '2026-10-18': STANDARD_ROWS,
            '2026-10-19': STANDARD_ROWS,
          },
        },
        after: {
          next: row('Isha', '2026-10-17', '2026-10-17T18:29:00.000Z'),
          displayDate: '2026-10-17',
          // The row above Isha is the unreadable Magrib, so there is nothing to measure the bar from
          previous: null,
          countdown: { timeLeft: 14340, name: 'Isha' },
          barAvailable: false,
          held: {
            '2026-10-17': 'Fajr, Sunrise, Dhuhr, Asr, [Magrib], Isha',
            '2026-10-18': STANDARD_ROWS,
            '2026-10-19': STANDARD_ROWS,
          },
        },
      },
      {
        title: 'R9 on Extras: Duha hands straight over to Suhoor past a night with no readable Magrib',
        dates: OCT_16_TO_20,
        unreadable: { '2026-10-17': ['magrib'] },
        type: EXTRA,
        launch: '2026-10-17T06:44:58.000Z',
        before: {
          next: row('Duha', '2026-10-17', '2026-10-17T06:45:00.000Z'),
          displayDate: '2026-10-17',
          previous: row('Suhoor', '2026-10-17', '2026-10-17T04:32:00.000Z'),
          countdown: { timeLeft: 2, name: 'Duha' },
          barAvailable: true,
          held: {
            '2026-10-17': EXTRAS_ROWS,
            '2026-10-18': '[Midnight], [Last Third], Suhoor, Duha',
            '2026-10-19': EXTRAS_ROWS,
          },
        },
        after: {
          next: row('Suhoor', '2026-10-18', '2026-10-18T04:34:00.000Z'),
          displayDate: '2026-10-18',
          // The row above Suhoor is the unreadable Last Third, so no bar, and nothing keeps the 17th
          previous: null,
          countdown: { timeLeft: 78540, name: 'Suhoor' },
          barAvailable: false,
          held: {
            '2026-10-18': '[Midnight], [Last Third], Suhoor, Duha',
            '2026-10-19': EXTRAS_ROWS,
          },
        },
      },
      {
        title: 'unreadable Fajr: Sunrise is next from the moment its list comes on screen',
        dates: OCT_16_TO_20,
        unreadable: { '2026-10-18': ['fajr'] },
        type: STANDARD,
        launch: '2026-10-17T18:28:58.000Z',
        before: {
          next: row('Isha', '2026-10-17', '2026-10-17T18:29:00.000Z'),
          displayDate: '2026-10-17',
          previous: row('Magrib', '2026-10-17', '2026-10-17T17:06:00.000Z'),
          countdown: { timeLeft: 2, name: 'Isha' },
          barAvailable: true,
          held: {
            '2026-10-17': STANDARD_ROWS,
            '2026-10-18': '[Fajr], Sunrise, Dhuhr, Asr, Magrib, Isha',
            '2026-10-19': STANDARD_ROWS,
          },
        },
        after: {
          next: row('Sunrise', '2026-10-18', '2026-10-18T06:27:00.000Z'),
          displayDate: '2026-10-18',
          // The row above Sunrise is the unreadable Fajr, so no bar, and nothing keeps the 17th
          previous: null,
          countdown: { timeLeft: 43080, name: 'Sunrise' },
          barAvailable: false,
          held: {
            '2026-10-18': '[Fajr], Sunrise, Dhuhr, Asr, Magrib, Isha',
            '2026-10-19': STANDARD_ROWS,
          },
        },
      },
      {
        title: 'unreadable last row: the list moves on after Magrib, keeping every row of the next day',
        dates: OCT_16_TO_20,
        unreadable: { '2026-10-17': ['isha'] },
        type: STANDARD,
        launch: '2026-10-17T17:05:58.000Z',
        before: {
          next: row('Magrib', '2026-10-17', '2026-10-17T17:06:00.000Z'),
          displayDate: '2026-10-17',
          previous: row('Asr', '2026-10-17', '2026-10-17T14:30:00.000Z'),
          countdown: { timeLeft: 2, name: 'Magrib' },
          barAvailable: true,
          held: {
            '2026-10-17': 'Fajr, Sunrise, Dhuhr, Asr, Magrib, [Isha]',
            '2026-10-18': STANDARD_ROWS,
            '2026-10-19': STANDARD_ROWS,
          },
        },
        after: {
          next: row('Fajr', '2026-10-18', '2026-10-18T04:54:00.000Z'),
          displayDate: '2026-10-18',
          // The row before Fajr is the list before's unreadable Isha, so no bar, and nothing keeps the 17th
          previous: null,
          countdown: { timeLeft: 42480, name: 'Fajr' },
          barAvailable: false,
          held: {
            '2026-10-18': STANDARD_ROWS,
            '2026-10-19': STANDARD_ROWS,
          },
        },
      },
      {
        title: 'R13/R14: 1 January with 31 December not stored has no bar until Fajr',
        dates: ['2026-01-01', '2026-01-02'],
        unreadable: {},
        type: STANDARD,
        launch: '2026-01-01T06:25:58.000Z',
        before: {
          next: row('Fajr', '2026-01-01', '2026-01-01T06:26:00.000Z'),
          displayDate: '2026-01-01',
          previous: null,
          countdown: { timeLeft: 2, name: 'Fajr' },
          barAvailable: false,
          held: { '2026-01-01': STANDARD_ROWS, '2026-01-02': STANDARD_ROWS, '2026-01-03': STANDARD_DASHED },
        },
        after: {
          next: row('Sunrise', '2026-01-01', '2026-01-01T08:03:00.000Z'),
          displayDate: '2026-01-01',
          previous: row('Fajr', '2026-01-01', '2026-01-01T06:26:00.000Z'),
          countdown: { timeLeft: 5820, name: 'Sunrise' },
          barAvailable: true,
          held: { '2026-01-01': STANDARD_ROWS, '2026-01-02': STANDARD_ROWS, '2026-01-03': STANDARD_DASHED },
        },
      },
      {
        title: 'R13/R14: 1 January with 31 December not stored has no Extras bar until Suhoor',
        dates: ['2026-01-01', '2026-01-02'],
        unreadable: {},
        type: EXTRA,
        launch: '2026-01-01T06:05:58.000Z',
        before: {
          next: row('Suhoor', '2026-01-01', '2026-01-01T06:06:00.000Z'),
          displayDate: '2026-01-01',
          previous: null,
          countdown: { timeLeft: 2, name: 'Suhoor' },
          barAvailable: false,
          held: {
            '2026-01-01': '[Midnight], [Last Third], Suhoor, Duha',
            '2026-01-02': `${EXTRAS_ROWS}, Istijaba`,
            '2026-01-03': EXTRAS_DASHED,
          },
        },
        after: {
          next: row('Duha', '2026-01-01', '2026-01-01T08:23:00.000Z'),
          displayDate: '2026-01-01',
          previous: row('Suhoor', '2026-01-01', '2026-01-01T06:06:00.000Z'),
          countdown: { timeLeft: 8220, name: 'Duha' },
          barAvailable: true,
          held: {
            '2026-01-01': '[Midnight], [Last Third], Suhoor, Duha',
            '2026-01-02': `${EXTRAS_ROWS}, Istijaba`,
            '2026-01-03': EXTRAS_DASHED,
          },
        },
      },
    ];

    it.each(crossings)('$title', ({ dates, unreadable, type, launch, before, after }) => {
      storeDays(dates, unreadable);
      launchAt(launch);
      const { writes, unsubscribe } = recordSequenceWrites(type);

      expect(observe(type)).toEqual(before);

      jest.advanceTimersByTime(2000);
      unsubscribe();

      expect(observe(type)).toEqual(after);
      expect(writes).toEqual([new Date(Date.parse(launch) + 2000).toISOString()]);
    });

    it('R9/R10: the unreadable Magrib passes the moment Asr does', () => {
      storeDays(OCT_16_TO_20, { '2026-10-17': ['magrib'] });
      launchAt('2026-10-17T14:29:58.000Z');

      jest.advanceTimersByTime(1999);
      expect(isPassedNow(STANDARD, 'Magrib', '2026-10-17')).toBe(false);

      // A readable row passes once the clock is beyond its instant, so a millisecond after Asr's
      jest.advanceTimersByTime(2);
      expect(isPassedNow(STANDARD, 'Magrib', '2026-10-17')).toBe(true);
    });

    it('R14: the bar reads 0 and no warning while it cannot be worked out', () => {
      storeDays(['2026-01-01', '2026-01-02']);
      launchAt('2026-01-01T06:25:58.000Z');

      expect(getDefaultStore().get(getBarProgressAtom(STANDARD))).toBe(0);
      expect(getDefaultStore().get(getBarWarningAtom(STANDARD))).toBe(false);
    });

    it('gap map L3: the bar measures from the list before when the sequence starts after it, at its real instant', () => {
      const postMidnightIsha = ['02:40', '04:43', '13:02', '17:20', '21:25', '00:01'];
      for (const date of ['2026-06-19', '2026-06-20', '2026-06-21', '2026-06-22']) LONDON_2026[date] = postMidnightIsha;
      storeDays(['2026-06-19', '2026-06-20', '2026-06-21', '2026-06-22']);

      launchAt('2026-06-21T01:00:00.000Z');

      expect(observe(STANDARD)).toMatchObject({
        next: row('Fajr', '2026-06-21', '2026-06-21T01:40:00.000Z'),
        displayDate: '2026-06-21',
        previous: row('Isha', '2026-06-20', '2026-06-20T23:01:00.000Z'),
        barAvailable: true,
      });
    });

    // The bar keeps the next-prayer atoms subscribed and the day list keeps the display dates subscribed, so they
    // are worked out the moment a sync writes new data, while the boundary is not worked out until something
    // first reads it. New data landing just before a boundary and a restart just after it held the countdown at
    // 1s on a passed Asr until 17:06, and left a day with no readable time on screen until the next day's Fajr.
    const races = [
      {
        boundary: 'Asr',
        type: STANDARD,
        launched: { '2026-10-19': ['magrib'] } as Record<string, RequiredTimeName[] | 'all'>,
        synced: {} as Record<string, RequiredTimeName[] | 'all'>,
        launch: '2026-10-17T14:00:00.000Z',
        at: '2026-10-17T14:30:00.000Z',
        displayDate: '2026-10-17',
        countdown: { timeLeft: 9350, name: 'Magrib' },
      },
      ...[
        { type: STANDARD, countdown: { timeLeft: 21290, name: 'Fajr' } },
        { type: EXTRA, countdown: { timeLeft: 20090, name: 'Suhoor' } },
      ].map(({ type, countdown }) => ({
        boundary: '00:00 ending the 18th, which has no readable time',
        type,
        launched: { '2026-10-18': 'all' } as Record<string, RequiredTimeName[] | 'all'>,
        synced: { '2026-10-18': 'all' } as Record<string, RequiredTimeName[] | 'all'>,
        launch: '2026-10-17T18:28:58.000Z',
        at: '2026-10-18T23:00:00.000Z',
        displayDate: '2026-10-19',
        countdown,
      })),
    ];
    const restarts = [
      { restartName: 'a sync restarting the countdowns', restart: startCountdowns, firstCheckMs: 1000 },
      { restartName: 'a return to the foreground', restart: resyncCountdowns, firstCheckMs: 10 },
    ];

    it.each(races.flatMap((race) => restarts.map((restart) => ({ ...race, ...restart }))))(
      'moves on at $boundary ($type) after $restartName lands just past it, with new data written just before it',
      ({ type, launched, synced, launch, at, displayDate, countdown, restart, firstCheckMs }) => {
        const store = getDefaultStore();
        keepSubscribed(standardNextPrayerAtom, extraNextPrayerAtom, standardDisplayDateAtom, extraDisplayDateAtom);
        const boundaryMs = Date.parse(at);

        storeDays(OCT_16_TO_20, launched);
        launchAt(launch);
        jest.advanceTimersByTime(2000);
        const beforeSync = store.get(getSequenceAtom(type));

        storeDays(OCT_16_TO_20, synced);
        moveClockTo(new Date(boundaryMs - 10).toISOString());
        setSequence(STANDARD, new Date());
        setSequence(EXTRA, new Date());
        expect(store.get(getSequenceAtom(type))).not.toBe(beforeSync);

        moveClockTo(new Date(boundaryMs + 10).toISOString());
        const { writes, unsubscribe } = recordSequenceWrites(type);
        testSubscriptions.push(unsubscribe);
        restart();

        jest.advanceTimersByTime(10_000);

        expect(writes).toEqual([new Date(boundaryMs + firstCheckMs).toISOString()]);
        expect(getDisplayDate(type)).toBe(displayDate);
        expect(store.get(getCountdownAtom(type))).toEqual(countdown);
      }
    );

    it('moves on at Isha when new data lands in the second before it while only the display date is subscribed', () => {
      const store = getDefaultStore();
      keepSubscribed(standardDisplayDateAtom);
      storeDays(OCT_16_TO_20, { '2026-10-19': ['magrib'] });
      launchAt('2026-10-17T18:00:00.000Z');
      jest.advanceTimersByTime(2000);

      storeDays(OCT_16_TO_20);
      moveClockTo('2026-10-17T18:28:59.990Z');
      setSequence(STANDARD, new Date());
      moveClockTo('2026-10-17T18:29:00.010Z');
      jest.advanceTimersByTime(1000);

      expect(getDisplayDate(STANDARD)).toBe('2026-10-18');
      expect(store.get(getCountdownAtom(STANDARD))).toEqual({ timeLeft: expect.any(Number), name: 'Fajr' });
    });

    // A sync rebuild runs setSequence then refreshSequence without restarting the countdown, and when the rebuild
    // is identical and skipped, the refresh's write is the only one
    it.each<[string, string[], boolean]>([
      ['only filters', OCT_16_TO_20, false],
      ['fetches more days', ['2026-10-16', '2026-10-17', '2026-10-18'], true],
    ])('moves on at Isha when a refresh that %s lands in the second before it', (_, dates, fetches) => {
      keepSubscribed(standardDisplayDateAtom);
      storeDays(dates);
      launchAt('2026-10-17T18:00:00.000Z');
      jest.advanceTimersByTime(2000);

      moveClockTo('2026-10-17T18:28:59.990Z');
      refreshSequence(STANDARD);
      // The launch built the 17th to the 19th; only a refresh that fetched adds the 20th, so each case really takes
      // the branch it is named for
      expect(Object.keys(rowsHeld(STANDARD)).includes('2026-10-20')).toBe(fetches);
      moveClockTo('2026-10-17T18:29:00.010Z');
      jest.advanceTimersByTime(1000);

      expect(getDisplayDate(STANDARD)).toBe('2026-10-18');
    });

    it('starts half a second before a prayer and still moves on at it', () => {
      storeDays(OCT_16_TO_20);
      launchAt('2026-10-17T14:29:59.500Z');
      const { writes, unsubscribe } = recordSequenceWrites(STANDARD);

      expect(getDefaultStore().get(getCountdownAtom(STANDARD))).toEqual({ timeLeft: 1, name: 'Asr' });

      jest.advanceTimersByTime(500);
      unsubscribe();

      expect(writes).toEqual(['2026-10-17T14:30:00.000Z']);
      expect(getDefaultStore().get(getCountdownAtom(STANDARD))).toEqual({ timeLeft: 9360, name: 'Magrib' });
    });

    // Nothing but the countdown's own start read touches the display date before 00:00, as when bootstrap starts
    // the countdowns before anything mounts, or the Extra page has not mounted its Day and List yet
    it('starts half a second before a day with no readable time ends at 00:00 and still moves on at it', () => {
      storeDays(OCT_16_TO_20, { '2026-10-18': 'all' });
      launchAt('2026-10-18T22:59:59.500Z');
      const standardWrites = recordSequenceWrites(STANDARD);
      const extraWrites = recordSequenceWrites(EXTRA);
      testSubscriptions.push(standardWrites.unsubscribe, extraWrites.unsubscribe);

      expect(getDefaultStore().get(getCountdownAtom(STANDARD))).toEqual({ timeLeft: null, name: '...' });

      jest.advanceTimersByTime(500);

      expect(standardWrites.writes).toEqual(['2026-10-18T23:00:00.000Z']);
      expect(extraWrites.writes).toEqual(['2026-10-18T23:00:00.000Z']);
      expect(Object.keys(rowsHeld(STANDARD))[0]).toBe('2026-10-19');
      expect(Object.keys(rowsHeld(EXTRA))[0]).toBe('2026-10-19');
      expect(getDisplayDate(STANDARD)).toBe('2026-10-19');
      expect(getDisplayDate(EXTRA)).toBe('2026-10-19');
      expect(getDefaultStore().get(getCountdownAtom(STANDARD))).toEqual({ timeLeft: 21300, name: 'Fajr' });
    });

    // Session 7's high-latitude shapes, where a list's last rows fall after 00:00. Launched just after 00:00 the
    // sequence starts at the new calendar day (session 7 has still to change that), so yesterday's Isha still to
    // come is only in storage, and a bar measured from it would run backwards. That Isha is the only true
    // previous row, so the bar stays hidden until the next boundary rewrites the sequence: the Isha passing is
    // not a boundary, a return to the foreground refreshes only after one, and a sync rebuilds the same rows and
    // skips the write.
    const postMidnightIsha = [
      {
        title: 'Isha at 00:01',
        days: Object.fromEntries(
          ['2026-06-19', '2026-06-20', '2026-06-21', '2026-06-22'].map((date) => [
            date,
            ['02:40', '04:43', '13:02', '17:20', '21:25', '00:01'],
          ])
        ),
        launch: '2026-06-20T23:00:30.000Z',
        isha: row('Isha', '2026-06-20', '2026-06-20T23:01:00.000Z'),
        ishaAt: '2026-06-20T23:01:00.000Z',
        listDay: '2026-06-21',
        fajrAt: '2026-06-21T01:40:00.000Z',
        sunriseAt: '2026-06-21T03:43:00.000Z',
      },
      {
        title: 'Magrib at 00:40 and Isha at 01:30',
        days: {
          '2026-09-24': ['03:00', '05:00', '13:00', '17:00', '22:30', '23:40'],
          '2026-09-25': ['02:30', '04:30', '13:00', '17:30', '00:40', '01:30'],
          '2026-09-26': ['02:00', '04:00', '13:00', '17:30', '22:00', '23:30'],
          '2026-09-27': ['00:10', '03:00', '13:00', '17:00', '21:00', '22:30'],
          '2026-09-28': ['03:00', '05:00', '13:00', '17:00', '20:58', '22:30'],
        },
        launch: '2026-09-25T23:00:30.000Z',
        isha: row('Isha', '2026-09-25', '2026-09-26T00:30:00.000Z'),
        ishaAt: '2026-09-26T00:30:00.000Z',
        listDay: '2026-09-26',
        fajrAt: '2026-09-26T01:00:00.000Z',
        sunriseAt: '2026-09-26T03:00:00.000Z',
      },
    ];

    it.each(postMidnightIsha)(
      "hides the bar from a launch after 00:00 until Fajr while yesterday's Isha is still due: $title",
      ({ days, launch, ishaAt, listDay, fajrAt, sunriseAt }) => {
        keepSubscribed(
          standardNextPrayerAtom,
          extraNextPrayerAtom,
          standardDisplayDateAtom,
          extraDisplayDateAtom,
          getBarAvailableAtom(STANDARD),
          getBarAvailableAtom(EXTRA)
        );
        const hidden = { next: row('Fajr', listDay, fajrAt), previous: null, barAvailable: false };

        Object.assign(LONDON_2026, days);
        storeDays(Object.keys(days));
        launchAt(launch);
        expect(observe(STANDARD)).toMatchObject(hidden);

        // The app stays open past Isha, then leaves and comes back, which resyncs and syncs unchanged data
        jest.advanceTimersByTime(Date.parse(ishaAt) + 5 * 60 * 1000 - Date.parse(launch));
        expect(observe(STANDARD)).toMatchObject(hidden);

        resyncCountdowns();
        setSequence(STANDARD, new Date());
        setSequence(EXTRA, new Date());
        startCountdowns();
        expect(observe(STANDARD)).toMatchObject(hidden);

        moveClockTo(new Date(Date.parse(fajrAt) - 2000).toISOString());
        jest.advanceTimersByTime(1999);
        expect(observe(STANDARD)).toMatchObject(hidden);

        jest.advanceTimersByTime(1);
        expect(observe(STANDARD)).toMatchObject({
          next: row('Sunrise', listDay, sunriseAt),
          previous: row('Fajr', listDay, fajrAt),
          barAvailable: true,
        });
      }
    );

    it.each(postMidnightIsha)(
      "takes yesterday's post-midnight Isha as the previous row only from its own instant: $title",
      ({ days, launch, isha, ishaAt, listDay, fajrAt }) => {
        const next = row('Fajr', listDay, fajrAt);
        Object.assign(LONDON_2026, days);
        storeDays(Object.keys(days));
        launchAt(launch);

        // Whenever the sequence is written, the previous row is looked up at that moment
        moveClockTo(new Date(Date.parse(ishaAt) - 1).toISOString());
        refreshSequence(STANDARD);
        expect(observe(STANDARD)).toMatchObject({ next, previous: null, barAvailable: false });

        moveClockTo(ishaAt);
        refreshSequence(STANDARD);
        expect(observe(STANDARD)).toMatchObject({ next, previous: isha, barAvailable: true });
      }
    );

    it.each([
      ['Friday: its Istijaba', '2026-10-16T22:59:58.000Z', row('Istijaba', '2026-10-16', '2026-10-16T16:08:00.000Z')],
      ['Saturday: its Duha', '2026-10-17T22:59:58.000Z', row('Duha', '2026-10-17', '2026-10-17T06:45:00.000Z')],
    ])('measures the Extras bar into the next night from the list before, on a %s', (_, launch, previous) => {
      storeDays(OCT_16_TO_20);
      launchAt(launch);

      expect(getNextPrayer(EXTRA)?.english).toBe('Midnight');
      expect(label(getPrevPrayer(EXTRA))).toBe(previous);
    });
  });

  // ---------------------------------------------------------------------------
  // R8/R11: a list day with no readable row stays on screen until 00:00 London at its end
  // ---------------------------------------------------------------------------

  describe.each([
    ['stored with every time unreadable', ['2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20']],
    ['missing from storage', ['2026-10-16', '2026-10-17', '2026-10-19', '2026-10-20']],
  ])('R8/R11: 18 October %s', (_, dates) => {
    beforeEach(() => {
      storeDays(dates, { '2026-10-18': 'all' });
      launchAt('2026-10-17T18:28:58.000Z');
      jest.advanceTimersByTime(2000);
    });

    /** Crosses 00:00 London ending the 17th, which brings the 18th on screen */
    const bringOnThe18th = () => {
      moveClockTo('2026-10-17T22:59:59.000Z');
      jest.advanceTimersByTime(1000);
    };

    it('keeps the 17th on screen after its Isha with --:-- and no bar, then brings the 18th on at 00:00', () => {
      expect(observe(STANDARD)).toEqual({
        next: row('Fajr', '2026-10-19', '2026-10-19T04:55:00.000Z'),
        displayDate: '2026-10-17',
        previous: null,
        countdown: { timeLeft: null, name: '...' },
        barAvailable: false,
        held: { '2026-10-17': STANDARD_ROWS, '2026-10-18': STANDARD_DASHED, '2026-10-19': STANDARD_ROWS },
      });
      expect(getDefaultStore().get(getCountdownDisplayAtom(STANDARD))).toBe('--:--');
      expect(observe(EXTRA)).toEqual({
        next: row('Suhoor', '2026-10-19', '2026-10-19T04:35:00.000Z'),
        displayDate: '2026-10-17',
        previous: null,
        countdown: { timeLeft: null, name: '...' },
        barAvailable: false,
        held: {
          '2026-10-17': EXTRAS_ROWS,
          '2026-10-18': EXTRAS_DASHED,
          '2026-10-19': '[Midnight], [Last Third], Suhoor, Duha',
        },
      });

      moveClockTo('2026-10-17T22:59:58.000Z');
      const standardWrites = recordSequenceWrites(STANDARD);
      const extraWrites = recordSequenceWrites(EXTRA);
      testSubscriptions.push(standardWrites.unsubscribe, extraWrites.unsubscribe);
      jest.advanceTimersByTime(4000);

      expect(standardWrites.writes).toEqual(['2026-10-17T23:00:00.000Z']);
      expect(extraWrites.writes).toEqual(['2026-10-17T23:00:00.000Z']);
      expect(observe(STANDARD)).toMatchObject({
        displayDate: '2026-10-18',
        countdown: { timeLeft: null, name: '...' },
        barAvailable: false,
        held: { '2026-10-18': STANDARD_DASHED, '2026-10-19': STANDARD_ROWS },
      });
      expect(observe(EXTRA)).toMatchObject({
        displayDate: '2026-10-18',
        countdown: { timeLeft: null, name: '...' },
      });
    });

    it('stays until 00:00 London at its end, then moves to the 19th on exactly the 00:00:00.000 tick', () => {
      bringOnThe18th();
      moveClockTo('2026-10-18T22:59:58.000Z');
      expect(getDisplayDate(STANDARD)).toBe('2026-10-18');
      expect(getDisplayDate(EXTRA)).toBe('2026-10-18');

      const standardWrites = recordSequenceWrites(STANDARD);
      const extraWrites = recordSequenceWrites(EXTRA);
      const standardCountdown = recordCountdown(STANDARD);
      const extraCountdown = recordCountdown(EXTRA);

      jest.advanceTimersByTime(4000);
      for (const recorder of [standardWrites, extraWrites, standardCountdown, extraCountdown]) recorder.unsubscribe();

      expect(standardWrites.writes).toEqual(['2026-10-18T23:00:00.000Z']);
      expect(extraWrites.writes).toEqual(['2026-10-18T23:00:00.000Z']);
      // --:-- until the 00:00 tick moves the list on, and the real countdown from that same tick
      expect(standardCountdown.values.map(({ timeLeft }) => timeLeft)).toEqual([null, 21300, 21299, 21298]);
      expect(extraCountdown.values.map(({ timeLeft }) => timeLeft)).toEqual([null, 20100, 20099, 20098]);

      expect(observe(STANDARD)).toEqual({
        next: row('Fajr', '2026-10-19', '2026-10-19T04:55:00.000Z'),
        displayDate: '2026-10-19',
        previous: null,
        countdown: { timeLeft: 21298, name: 'Fajr' },
        barAvailable: false,
        held: {
          '2026-10-19': STANDARD_ROWS,
          '2026-10-20': STANDARD_ROWS,
          '2026-10-21': STANDARD_DASHED,
          '2026-10-22': STANDARD_DASHED,
        },
      });
      expect(observe(EXTRA)).toEqual({
        next: row('Suhoor', '2026-10-19', '2026-10-19T04:35:00.000Z'),
        displayDate: '2026-10-19',
        previous: null,
        countdown: { timeLeft: 20098, name: 'Suhoor' },
        barAvailable: false,
        held: {
          '2026-10-19': '[Midnight], [Last Third], Suhoor, Duha',
          '2026-10-20': EXTRAS_ROWS,
          '2026-10-21': EXTRAS_DASHED,
          '2026-10-22': EXTRAS_DASHED,
        },
      });
    });

    it('catches up both 00:00s crossed while suspended when the app returns', () => {
      expect(getDisplayDate(STANDARD)).toBe('2026-10-17');
      moveClockTo('2026-10-19T00:30:00.000Z');

      resyncCountdowns();

      expect(getDisplayDate(STANDARD)).toBe('2026-10-19');
      expect(getDisplayDate(EXTRA)).toBe('2026-10-19');
      expect(getDefaultStore().get(getCountdownAtom(STANDARD))).toEqual({ timeLeft: 15900, name: 'Fajr' });
      expect(getDefaultStore().get(getCountdownAtom(EXTRA))).toEqual({ timeLeft: 14700, name: 'Suhoor' });
    });

    it('opens a passed row of the waiting 17th on the unreadable 18th, and a row of the 18th on the 19th', () => {
      const store = getDefaultStore();

      openOverlay(STANDARD, 0);
      expect(store.get(getCountdownAtom(STANDARD))).toEqual({ timeLeft: null, name: 'Fajr' });
      closeOverlay();

      bringOnThe18th();
      openOverlay(STANDARD, 0);
      expect(store.get(getCountdownAtom(STANDARD))).toEqual({ timeLeft: 107700, name: 'Fajr' });
      closeOverlay();
      expect(store.get(getCountdownAtom(STANDARD))).toEqual({ timeLeft: null, name: '...' });

      openOverlay(STANDARD, 6);
      expect(store.get(getCountdownAtom(STANDARD))).toEqual({ timeLeft: null, name: '...' });
    });

    it('closes an open overlay 2 seconds before 00:00 and refuses to open inside that window', () => {
      bringOnThe18th();
      moveClockTo('2026-10-18T22:59:56.000Z');
      const store = getDefaultStore();

      openOverlay(STANDARD, 0);
      jest.advanceTimersByTime(1999);
      expect(store.get(overlayAtom).isOn).toBe(true);

      jest.advanceTimersByTime(1);
      expect(store.get(overlayAtom).isOn).toBe(false);

      openOverlay(STANDARD, 0);
      expect(store.get(overlayAtom).isOn).toBe(false);

      jest.advanceTimersByTime(1500);
      openOverlay(STANDARD, 0);
      expect(store.get(overlayAtom).isOn).toBe(false);

      // 00:00 has passed and the list has moved on, so the next boundary is Fajr again
      jest.advanceTimersByTime(500);
      openOverlay(STANDARD, 0);
      expect(store.get(overlayAtom).isOn).toBe(true);
    });
  });

  it('R8: two list days with no readable row each hold for their own day', () => {
    storeDays(['2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20'], {
      '2026-10-18': 'all',
      '2026-10-19': 'all',
    });
    launchAt('2026-10-17T18:28:58.000Z');
    jest.advanceTimersByTime(2000);

    expect(observe(STANDARD)).toMatchObject({
      next: row('Fajr', '2026-10-20', '2026-10-20T04:57:00.000Z'),
      displayDate: '2026-10-17',
      countdown: { timeLeft: null, name: '...' },
      barAvailable: false,
    });

    // The 17th waits for its 00:00 and each unreadable day holds in its turn, so the real countdown starts
    // only at the 19th's own 00:00
    for (const [clock, holdEnd, nextListDay, timeLeft] of [
      ['2026-10-17T22:59:58.000Z', '2026-10-17T23:00:00.000Z', '2026-10-18', null],
      ['2026-10-18T22:59:58.000Z', '2026-10-18T23:00:00.000Z', '2026-10-19', null],
      ['2026-10-19T22:59:58.000Z', '2026-10-19T23:00:00.000Z', '2026-10-20', 21418],
    ] as const) {
      moveClockTo(clock);
      const standardWrites = recordSequenceWrites(STANDARD);
      const extraWrites = recordSequenceWrites(EXTRA);

      jest.advanceTimersByTime(4000);
      standardWrites.unsubscribe();
      extraWrites.unsubscribe();

      expect(standardWrites.writes).toEqual([holdEnd]);
      expect(extraWrites.writes).toEqual([holdEnd]);
      expect(getDisplayDate(STANDARD)).toBe(nextListDay);
      expect(getDisplayDate(EXTRA)).toBe(nextListDay);
      expect(getDefaultStore().get(getCountdownAtom(STANDARD))).toEqual({
        timeLeft,
        name: timeLeft === null ? '...' : 'Fajr',
      });
      expect(getDefaultStore().get(getBarAvailableAtom(STANDARD))).toBe(false);
    }
  });

  it('R8: opened during the evening wait, the list before stays until 00:00 through a return before it', () => {
    storeDays(OCT_16_TO_20, { '2026-10-18': 'all' });
    launchAt('2026-10-17T20:00:00.000Z');

    expect(observe(STANDARD)).toMatchObject({
      displayDate: '2026-10-17',
      countdown: { timeLeft: null, name: '...' },
      barAvailable: false,
    });
    expect(getNextBoundary(STANDARD)?.toISOString()).toBe('2026-10-17T23:00:00.000Z');

    moveClockTo('2026-10-17T22:30:00.000Z');
    resyncCountdowns();
    expect(getDisplayDate(STANDARD)).toBe('2026-10-17');

    moveClockTo('2026-10-17T23:30:00.000Z');
    resyncCountdowns();
    expect(getDisplayDate(STANDARD)).toBe('2026-10-18');
    expect(getDefaultStore().get(getCountdownAtom(STANDARD))).toEqual({ timeLeft: null, name: '...' });
  });

  it('R8: back from a suspension that began the day before, during the evening wait', () => {
    storeDays(OCT_16_TO_20, { '2026-10-18': 'all' });
    launchAt('2026-10-16T11:00:00.000Z');

    moveClockTo('2026-10-17T21:00:00.000Z');
    resyncCountdowns();

    expect(getDisplayDate(STANDARD)).toBe('2026-10-17');
    expect(getDisplayDate(EXTRA)).toBe('2026-10-17');
    expect(rowsHeld(STANDARD)['2026-10-17']).toBe(STANDARD_ROWS);
    expect(getNextBoundary(STANDARD)?.toISOString()).toBe('2026-10-17T23:00:00.000Z');
  });

  it('R8 on Extras: a Friday ending at Istijaba keeps its list until 00:00 before a Saturday with none', () => {
    storeDays(OCT_16_TO_20, { '2026-10-17': 'all' });
    launchAt('2026-10-16T16:07:58.000Z');
    const { writes, unsubscribe } = recordSequenceWrites(EXTRA);
    testSubscriptions.push(unsubscribe);

    jest.advanceTimersByTime(2000);
    expect(writes).toEqual(['2026-10-16T16:08:00.000Z']);
    expect(observe(EXTRA)).toMatchObject({
      displayDate: '2026-10-16',
      countdown: { timeLeft: null, name: '...' },
      barAvailable: false,
    });
    expect(getNextBoundary(EXTRA)?.toISOString()).toBe('2026-10-16T23:00:00.000Z');

    moveClockTo('2026-10-16T22:59:58.000Z');
    jest.advanceTimersByTime(2000);
    expect(writes).toEqual(['2026-10-16T16:08:00.000Z', '2026-10-16T23:00:00.000Z']);
    expect(getDisplayDate(EXTRA)).toBe('2026-10-17');
  });

  it('R8: a day unreadable only on Extras keeps that list until 00:00 while Standard moves on at Isha', () => {
    storeDays(OCT_16_TO_20, { '2026-10-18': ['fajr', 'sunrise'] });
    launchAt('2026-10-17T18:28:58.000Z');
    jest.advanceTimersByTime(2000);

    expect(getDisplayDate(STANDARD)).toBe('2026-10-18');
    expect(getNextPrayer(STANDARD)?.english).toBe('Dhuhr');
    expect(getDefaultStore().get(getCountdownAtom(STANDARD))).toEqual({ timeLeft: expect.any(Number), name: 'Dhuhr' });
    expect(observe(EXTRA)).toMatchObject({
      displayDate: '2026-10-17',
      countdown: { timeLeft: null, name: '...' },
      barAvailable: false,
    });

    moveClockTo('2026-10-17T22:59:58.000Z');
    jest.advanceTimersByTime(2000);
    expect(getDisplayDate(EXTRA)).toBe('2026-10-18');
    expect(getDisplayDate(STANDARD)).toBe('2026-10-18');
  });

  it.each([
    ['2026-03-28', '2026-03-28T12:00:00.000Z', '2026-03-29T00:00:00.000Z', '2026-03-29'],
    ['2026-03-29', '2026-03-29T11:00:00.000Z', '2026-03-29T23:00:00.000Z', '2026-03-30'],
    ['2026-03-30', '2026-03-30T11:00:00.000Z', '2026-03-30T23:00:00.000Z', '2026-03-31'],
    ['2026-10-24', '2026-10-24T11:00:00.000Z', '2026-10-24T23:00:00.000Z', '2026-10-25'],
    ['2026-10-25', '2026-10-25T12:00:00.000Z', '2026-10-26T00:00:00.000Z', '2026-10-26'],
    ['2026-10-26', '2026-10-26T12:00:00.000Z', '2026-10-27T00:00:00.000Z', '2026-10-27'],
  ])(
    'holds %s, opened at noon, until 00:00 London at its end (%s) across the clock changes',
    (listDay, noon, holdEnd, nextListDay) => {
      const around = listDay.startsWith('2026-03')
        ? ['2026-03-27', '2026-03-28', '2026-03-29', '2026-03-30']
        : ['2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26'];
      storeDays(around, { [listDay]: 'all' });

      launchAt(noon);
      for (const type of [STANDARD, EXTRA]) {
        expect(getDisplayDate(type)).toBe(listDay);
        expect(getNextBoundary(type)?.toISOString()).toBe(holdEnd);
      }

      moveClockTo(new Date(Date.parse(holdEnd) - 2000).toISOString());
      const standardWrites = recordSequenceWrites(STANDARD);
      const extraWrites = recordSequenceWrites(EXTRA);

      jest.advanceTimersByTime(4000);
      standardWrites.unsubscribe();
      extraWrites.unsubscribe();

      expect(standardWrites.writes).toEqual([holdEnd]);
      expect(extraWrites.writes).toEqual([holdEnd]);
      expect(getDisplayDate(STANDARD)).toBe(nextListDay);
      expect(getDisplayDate(EXTRA)).toBe(nextListDay);
    }
  );

  // Session 7's high-latitude Saturday with no readable time: the Sunday's Fajr at 00:10 puts its Suhoor at 23:50
  // on the Saturday, before the held Saturday's own 00:00, so the Extras list meets that Suhoor first
  it("moves on at a Suhoor that falls before a held day's 00:00, and at the 00:00 after it", () => {
    Object.assign(LONDON_2026, {
      '2026-09-24': ['03:00', '05:00', '13:00', '17:00', '22:30', '23:40'],
      '2026-09-25': ['02:30', '04:30', '13:00', '17:30', '00:40', '01:30'],
      '2026-09-26': ['02:00', '04:00', '13:00', '17:30', '22:00', '23:30'],
      '2026-09-27': ['00:10', '03:00', '13:00', '17:00', '21:00', '22:30'],
      '2026-09-28': ['03:00', '05:00', '13:00', '17:00', '20:58', '22:30'],
    });
    storeDays(['2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28'], { '2026-09-26': 'all' });
    launchAt('2026-09-26T12:00:00.000Z');

    expect(getDisplayDate(EXTRA)).toBe('2026-09-26');
    expect(getNextBoundary(EXTRA)?.toISOString()).toBe('2026-09-26T22:50:00.000Z');
    expect(observe(EXTRA)).toMatchObject({ countdown: { timeLeft: null, name: '...' }, barAvailable: false });

    moveClockTo('2026-09-26T22:49:58.000Z');
    const { writes, unsubscribe } = recordSequenceWrites(EXTRA);

    jest.advanceTimersByTime(2000);
    expect(writes).toEqual(['2026-09-26T22:50:00.000Z']);
    expect(getDisplayDate(EXTRA)).toBe('2026-09-26');
    expect(getNextBoundary(EXTRA)?.toISOString()).toBe('2026-09-26T23:00:00.000Z');
    // Sunday's passed Suhoor could measure a bar to its Duha, but Saturday is still on screen with nothing to count
    expect(observe(EXTRA)).toMatchObject({
      next: row('Duha', '2026-09-27', '2026-09-27T02:20:00.000Z'),
      previous: row('Suhoor', '2026-09-27', '2026-09-26T22:50:00.000Z'),
      countdown: { timeLeft: null, name: '...' },
      barAvailable: false,
    });
    expect(calculatePrayerAgo(EXTRA).isReady).toBe(false);

    jest.advanceTimersByTime(10 * 60 * 1000);
    unsubscribe();
    expect(writes).toEqual(['2026-09-26T22:50:00.000Z', '2026-09-26T23:00:00.000Z']);
    expect(getDisplayDate(EXTRA)).toBe('2026-09-27');
    expect(observe(EXTRA)).toMatchObject({ countdown: { timeLeft: 12000, name: 'Duha' }, barAvailable: true });
    expect(calculatePrayerAgo(EXTRA).isReady).toBe(true);
  });

  it("keeps the 25th's lists on the same shapes: Extras until its 00:00, Standard until its 01:30 Isha", () => {
    Object.assign(LONDON_2026, {
      '2026-09-24': ['03:00', '05:00', '13:00', '17:00', '22:30', '23:40'],
      '2026-09-25': ['02:30', '04:30', '13:00', '17:30', '00:40', '01:30'],
      '2026-09-26': ['02:00', '04:00', '13:00', '17:30', '22:00', '23:30'],
      '2026-09-27': ['00:10', '03:00', '13:00', '17:00', '21:00', '22:30'],
      '2026-09-28': ['03:00', '05:00', '13:00', '17:00', '20:58', '22:30'],
    });
    storeDays(['2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28'], { '2026-09-26': 'all' });
    launchAt('2026-09-25T12:00:00.000Z');

    // The 25th is a Friday, so its Extras list ends at Istijaba, at 23:40 an hour before the 00:40 Magrib
    expect(getDisplayDate(EXTRA)).toBe('2026-09-25');
    expect(getNextBoundary(EXTRA)?.toISOString()).toBe('2026-09-25T22:40:00.000Z');

    moveClockTo('2026-09-25T22:39:58.000Z');
    const { writes, unsubscribe } = recordSequenceWrites(EXTRA);
    testSubscriptions.push(unsubscribe);
    jest.advanceTimersByTime(2000);
    expect(getDisplayDate(EXTRA)).toBe('2026-09-25');
    expect(getNextBoundary(EXTRA)?.toISOString()).toBe('2026-09-25T23:00:00.000Z');

    moveClockTo('2026-09-25T22:59:58.000Z');
    jest.advanceTimersByTime(4000);

    expect(writes).toEqual(['2026-09-25T22:40:00.000Z', '2026-09-25T23:00:00.000Z']);
    expect(getDisplayDate(EXTRA)).toBe('2026-09-26');
    expect(getDisplayDate(STANDARD)).toBe('2026-09-25');

    moveClockTo('2026-09-26T00:29:58.000Z');
    jest.advanceTimersByTime(4000);
    expect(getDisplayDate(STANDARD)).toBe('2026-09-26');
  });

  it("names a --:-- countdown '...' with no overlay on both schedules, and the tapped prayer with one", () => {
    const store = getDefaultStore();
    storeDays(OCT_16_TO_20, { '2026-10-18': 'all' });
    launchAt('2026-10-18T11:00:00.000Z');

    expect(store.get(getCountdownAtom(STANDARD))).toEqual({ timeLeft: null, name: '...' });
    expect(store.get(getCountdownAtom(EXTRA))).toEqual({ timeLeft: null, name: '...' });
    expect(store.get(getCountdownDisplayAtom(STANDARD))).toBe('--:--');

    // The overlay has a prayer to show, so it is named: here the 18th's Fajr opens the 19th's, which has a time
    openOverlay(STANDARD, 0);
    expect(store.get(getCountdownAtom(STANDARD))).toEqual({ timeLeft: expect.any(Number), name: 'Fajr' });
    // The overlay belongs to the Standard page, so once a tick has rewritten both pages the Extras page still
    // shows its own waiting countdown
    jest.advanceTimersByTime(1000);
    expect(store.get(getCountdownAtom(STANDARD))).toEqual({ timeLeft: expect.any(Number), name: 'Fajr' });
    expect(store.get(getCountdownAtom(EXTRA))).toEqual({ timeLeft: null, name: '...' });
    closeOverlay();
    expect(store.get(getCountdownAtom(STANDARD))).toEqual({ timeLeft: null, name: '...' });

    jest.advanceTimersByTime(1000);
    expect(store.get(getCountdownAtom(EXTRA))).toEqual({ timeLeft: null, name: '...' });
  });

  // ---------------------------------------------------------------------------
  // A lost week: the countdown keeps a target on the far side of the gap
  // ---------------------------------------------------------------------------

  describe('a week missing from storage after tomorrow', () => {
    const dates = ['2026-10-16', '2026-10-17', '2026-10-25', '2026-10-26'];
    const LOST_WEEK = {
      '2026-10-18': STANDARD_DASHED,
      '2026-10-19': STANDARD_DASHED,
      '2026-10-20': STANDARD_DASHED,
      '2026-10-21': STANDARD_DASHED,
      '2026-10-22': STANDARD_DASHED,
      '2026-10-23': STANDARD_DASHED,
      '2026-10-24': STANDARD_DASHED,
    };

    it("keeps the far side of the week as next once tomorrow's Isha passes, with --:-- while a lost day shows", () => {
      storeDays(dates);
      launchAt('2026-10-16T12:00:00.000Z');
      expect(getNextPrayer(STANDARD)?.english).toBe('Asr');

      moveClockTo('2026-10-17T18:28:58.000Z');
      resyncCountdowns();
      jest.advanceTimersByTime(2000);

      expect(observe(STANDARD)).toEqual({
        next: row('Fajr', '2026-10-25', '2026-10-25T05:04:00.000Z'),
        displayDate: '2026-10-17',
        previous: null,
        countdown: { timeLeft: null, name: '...' },
        barAvailable: false,
        held: { '2026-10-17': STANDARD_ROWS, ...LOST_WEEK, '2026-10-25': STANDARD_ROWS },
      });
      expect(observe(EXTRA)).toMatchObject({
        next: row('Suhoor', '2026-10-25', '2026-10-25T04:44:00.000Z'),
        displayDate: '2026-10-17',
        countdown: { timeLeft: null, name: '...' },
        barAvailable: false,
      });
    });

    it('counts down to the far side when the app opens in the middle of the week', () => {
      storeDays(dates);
      launchAt('2026-10-20T12:00:00.000Z');

      expect(observe(STANDARD)).toEqual({
        next: row('Fajr', '2026-10-25', '2026-10-25T05:04:00.000Z'),
        displayDate: '2026-10-20',
        previous: null,
        countdown: { timeLeft: null, name: '...' },
        barAvailable: false,
        held: {
          '2026-10-20': STANDARD_DASHED,
          '2026-10-21': STANDARD_DASHED,
          '2026-10-22': STANDARD_DASHED,
          '2026-10-23': STANDARD_DASHED,
          '2026-10-24': STANDARD_DASHED,
          '2026-10-25': STANDARD_ROWS,
        },
      });
      expect(getNextBoundary(STANDARD)?.toISOString()).toBe('2026-10-20T23:00:00.000Z');
    });

    it("stops growing at 14 list days when nothing readable is stored at all, with '...' above --:--", () => {
      launchAt('2026-10-17T12:00:00.000Z');

      jest.advanceTimersByTime(1000);

      expect(Object.keys(rowsHeld(STANDARD))).toHaveLength(14);
      expect(Object.keys(rowsHeld(STANDARD))[13]).toBe('2026-10-30');
      expect(getNextPrayer(STANDARD)).toBeNull();
      expect(getDisplayDate(STANDARD)).toBe('2026-10-17');
      expect(getNextBoundary(STANDARD)?.toISOString()).toBe('2026-10-17T23:00:00.000Z');
      expect(getDefaultStore().get(getCountdownAtom(STANDARD))).toEqual({ timeLeft: null, name: '...' });
      expect(getDefaultStore().get(getCountdownAtom(EXTRA))).toEqual({ timeLeft: null, name: '...' });
    });

    it('shows --:-- after the last readable prayer in storage, rather than holding that prayer at 1s', () => {
      storeDays(OCT_16_TO_20);
      launchAt('2026-10-20T18:00:00.000Z');
      const isha = getNextPrayer(STANDARD);
      expect(isha?.english).toBe('Isha');

      moveClockTo(new Date((isha?.datetime.getTime() ?? 0) - 2000).toISOString());
      jest.advanceTimersByTime(3000);
      expect(getDefaultStore().get(getCountdownAtom(STANDARD))).toEqual({ timeLeft: null, name: '...' });

      jest.advanceTimersByTime(60_000);
      expect(getDefaultStore().get(getCountdownAtom(STANDARD))).toEqual({ timeLeft: null, name: '...' });
      expect(getDefaultStore().get(getCountdownDisplayAtom(STANDARD))).toBe('--:--');
      expect(getDisplayDate(STANDARD)).toBe('2026-10-20');
    });
  });

  // ---------------------------------------------------------------------------
  // R11/R12: what a tap on a row with no readable time opens
  // ---------------------------------------------------------------------------

  interface Tap {
    title: string;
    unreadable: Record<string, RequiredTimeName[] | 'all'>;
    launch: string;
    index: number;
    countdown: CountdownStore;
    display: string;
  }

  it.each<Tap>([
    {
      title: 'a passed unreadable Fajr opens tomorrow, which is readable, in seconds',
      unreadable: { '2026-10-17': ['fajr', 'magrib'] },
      launch: '2026-10-17T05:00:00.000Z',
      index: 0,
      countdown: { timeLeft: 86040, name: 'Fajr' },
      display: '23h 54m',
    },
    {
      title: 'a passed unreadable Fajr whose next occurrence is unreadable too shows --:--',
      unreadable: { '2026-10-17': ['fajr', 'magrib'], '2026-10-18': ['fajr'] },
      launch: '2026-10-17T05:00:00.000Z',
      index: 0,
      countdown: { timeLeft: null, name: 'Fajr' },
      display: '--:--',
    },
    {
      title: 'an upcoming unreadable Magrib opens itself and shows --:--',
      unreadable: { '2026-10-17': ['fajr', 'magrib'] },
      launch: '2026-10-17T05:00:00.000Z',
      index: 4,
      countdown: { timeLeft: null, name: 'Magrib' },
      display: '--:--',
    },
    {
      title: 'R11: a row of a day with no readable time opens its next occurrence',
      unreadable: { '2026-10-18': 'all' },
      launch: '2026-10-18T12:00:00.000Z',
      index: 0,
      countdown: { timeLeft: 60900, name: 'Fajr' },
      display: '16h 55m',
    },
    {
      title: 'R11: a row of a day with no readable time whose next occurrence has none either shows --:--',
      unreadable: { '2026-10-18': 'all', '2026-10-19': 'all' },
      launch: '2026-10-18T12:00:00.000Z',
      index: 0,
      countdown: { timeLeft: null, name: 'Fajr' },
      display: '--:--',
    },
  ])('R12: $title', ({ unreadable, launch, index, countdown, display }) => {
    const store = getDefaultStore();
    storeDays(OCT_16_TO_20, unreadable);
    launchAt(launch);
    const next = store.get(getCountdownAtom(STANDARD));

    openOverlay(STANDARD, index);
    expect(store.get(getCountdownAtom(STANDARD))).toEqual(countdown);
    expect(store.get(getCountdownDisplayAtom(STANDARD))).toBe(display);

    // Each tick writes the same target, a second nearer when it has an instant
    jest.advanceTimersByTime(1000);
    const { timeLeft } = countdown;
    expect(store.get(getCountdownAtom(STANDARD))).toEqual({
      ...countdown,
      timeLeft: timeLeft === null ? null : timeLeft - 1,
    });

    closeOverlay();
    expect(store.get(getCountdownAtom(STANDARD))).toEqual({
      ...next,
      timeLeft: next.timeLeft === null ? null : next.timeLeft - 1,
    });
  });

  it('R11: Istijaba tapped on a Friday with no readable time opens itself, since next Friday is not in the sequence', () => {
    storeDays(OCT_16_TO_20, { '2026-10-16': 'all' });
    launchAt('2026-10-16T12:00:00.000Z');

    openOverlay(EXTRA, 4);

    expect(getDefaultStore().get(getCountdownAtom(EXTRA))).toEqual({ timeLeft: null, name: 'Istijaba' });
    expect(getDefaultStore().get(getCountdownDisplayAtom(EXTRA))).toBe('--:--');
  });

  it('counts down to the next prayer when the overlay holds an index past the end of the list', () => {
    storeDays(OCT_16_TO_20);
    launchAt('2026-10-17T12:00:00.000Z');

    openOverlay(EXTRA, 5);

    expect(getDefaultStore().get(getCountdownAtom(EXTRA))).toEqual({ timeLeft: 39600, name: 'Midnight' });
  });

  it('opens an overlay before any sequence exists, with no deadline to close it', () => {
    openOverlay(STANDARD, 0);

    expect(getNextBoundary(STANDARD)).toBeNull();
    expect(checkOverlayBoundary()).toBe(false);
    expect(getDefaultStore().get(overlayAtom).isOn).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // refreshSequence and setSequence on real days (gap map item 25)
  // ---------------------------------------------------------------------------

  describe('refreshSequence', () => {
    it("drops an earlier list's passed rows and keeps the passed rows of the list on screen", () => {
      storeDays(OCT_16_TO_20);
      moveClockTo('2026-10-17T22:00:00.000Z');
      setSequence(EXTRA, new Date());

      moveClockTo('2026-10-17T23:00:00.000Z');
      refreshSequence(EXTRA);

      expect(observe(EXTRA)).toMatchObject({
        next: row('Last Third', '2026-10-18', '2026-10-18T00:58:00.000Z'),
        displayDate: '2026-10-18',
        previous: row('Midnight', '2026-10-18', '2026-10-17T23:00:00.000Z'),
        held: { '2026-10-18': EXTRAS_ROWS, '2026-10-19': EXTRAS_ROWS },
      });
    });

    it("keeps the list before whole while it holds the progress bar's last passed row", () => {
      storeDays(OCT_16_TO_20);
      moveClockTo('2026-10-17T18:00:00.000Z');
      setSequence(STANDARD, new Date());

      moveClockTo('2026-10-17T18:29:00.000Z');
      refreshSequence(STANDARD);

      expect(observe(STANDARD)).toMatchObject({
        next: row('Fajr', '2026-10-18', '2026-10-18T04:54:00.000Z'),
        displayDate: '2026-10-18',
        previous: row('Isha', '2026-10-17', '2026-10-17T18:29:00.000Z'),
        held: { '2026-10-17': STANDARD_ROWS, '2026-10-18': STANDARD_ROWS, '2026-10-19': STANDARD_ROWS },
      });
    });

    it('keeps a later day with no readable row when nothing new is fetched', () => {
      storeDays(['2026-10-16', '2026-10-17', '2026-10-19', '2026-10-20']);
      moveClockTo('2026-10-17T12:00:00.000Z');
      setSequence(STANDARD, new Date());

      moveClockTo('2026-10-17T14:30:00.000Z');
      refreshSequence(STANDARD);

      expect(rowsHeld(STANDARD)).toEqual({
        '2026-10-17': STANDARD_ROWS,
        '2026-10-18': STANDARD_DASHED,
        '2026-10-19': STANDARD_ROWS,
      });
    });

    it('keeps a later day with no readable row through a merge with the rebuilt days', () => {
      storeDays(['2026-10-16', '2026-10-17', '2026-10-18', '2026-10-20']);
      moveClockTo('2026-10-17T12:00:00.000Z');
      setSequence(STANDARD, new Date());

      moveClockTo('2026-10-18T18:27:00.000Z');
      refreshSequence(STANDARD);

      // The 18th's Isha has just passed and the 19th has no readable time, so the 18th waits for its 00:00
      expect(observe(STANDARD)).toMatchObject({
        next: row('Fajr', '2026-10-20', '2026-10-20T04:57:00.000Z'),
        displayDate: '2026-10-18',
        held: {
          '2026-10-18': STANDARD_ROWS,
          '2026-10-19': STANDARD_DASHED,
          '2026-10-20': STANDARD_ROWS,
          '2026-10-21': STANDARD_DASHED,
        },
      });
    });
  });

  describe('setSequence signature', () => {
    it('skips an identical write whose sequence holds unreadable rows', () => {
      storeDays(OCT_16_TO_20, { '2026-10-17': ['magrib'] });
      moveClockTo('2026-10-17T12:00:00.000Z');

      setSequence(STANDARD, new Date());
      const first = getDefaultStore().get(standardSequenceAtom);
      setSequence(STANDARD, new Date());

      expect(getDefaultStore().get(standardSequenceAtom)).toBe(first);
    });

    it('writes when a row loses its time, and again when it gets it back', () => {
      moveClockTo('2026-10-17T12:00:00.000Z');
      const magrib17 = () => label(rowOf(STANDARD, 'Magrib', '2026-10-17'));

      storeDays(OCT_16_TO_20);
      setSequence(STANDARD, new Date());
      const readable = getDefaultStore().get(standardSequenceAtom);

      storeDays(OCT_16_TO_20, { '2026-10-17': ['magrib'] });
      setSequence(STANDARD, new Date());
      const unreadable = getDefaultStore().get(standardSequenceAtom);

      expect(unreadable).not.toBe(readable);
      expect(magrib17()).toBe(row('Magrib', '2026-10-17', '--:--'));

      storeDays(OCT_16_TO_20);
      setSequence(STANDARD, new Date());

      expect(getDefaultStore().get(standardSequenceAtom)).not.toBe(unreadable);
      expect(magrib17()).toBe(row('Magrib', '2026-10-17', '2026-10-17T17:06:00.000Z'));
    });

    // With nothing stored every row reads '-', so only each row's identity tells a fortnight from the one
    // starting a day later
    it('writes a rebuild a day later when nothing is stored, though every row of both is unreadable', () => {
      moveClockTo('2026-10-17T12:00:00.000Z');
      setSequence(STANDARD, new Date());
      const onThe17th = getDefaultStore().get(standardSequenceAtom);

      moveClockTo('2026-10-18T12:00:00.000Z');
      setSequence(STANDARD, new Date());

      expect(getDefaultStore().get(standardSequenceAtom)).not.toBe(onThe17th);
      expect(Object.keys(rowsHeld(STANDARD))[0]).toBe('2026-10-18');
    });

    // Only 18 October is stored, so the build on the 17th and the build after midnight hold the same
    // readable rows, its six, and differ only in the days around it that have none. Those rows are part of
    // the sequence's content: the later build must be written, not skipped as identical, or the store
    // keeps a finished day and lacks the day after.
    it('writes a rebuild whose readable rows are the same but whose unreadable days moved', () => {
      storeDays(['2026-10-18']);

      moveClockTo('2026-10-17T12:00:00.000Z');
      setSequence(STANDARD, new Date());
      const onThe17th = getDefaultStore().get(standardSequenceAtom);

      expect(rowsHeld(STANDARD)).toEqual({
        '2026-10-17': STANDARD_DASHED,
        '2026-10-18': STANDARD_ROWS,
        '2026-10-19': STANDARD_DASHED,
      });

      // 00:30 BST on the 18th, before its Fajr: nothing readable has passed and nothing needs extending
      moveClockTo('2026-10-17T23:30:00.000Z');
      setSequence(STANDARD, new Date());

      expect(getDefaultStore().get(standardSequenceAtom)).not.toBe(onThe17th);
      expect(rowsHeld(STANDARD)).toEqual({
        '2026-10-18': STANDARD_ROWS,
        '2026-10-19': STANDARD_DASHED,
        '2026-10-20': STANDARD_DASHED,
      });
    });
  });
});
