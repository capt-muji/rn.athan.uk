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

import { createStore } from 'jotai';
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
  extraSequenceAtom,
  getDisplayDate,
  getNextBoundary,
  getNextPrayer,
  getPrevPrayer,
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
          previous: row('Asr', '2026-10-17', '2026-10-17T14:30:00.000Z'),
          countdown: { timeLeft: 14340, name: 'Isha' },
          barAvailable: true,
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
          previous: row('Duha', '2026-10-17', '2026-10-17T06:45:00.000Z'),
          countdown: { timeLeft: 78540, name: 'Suhoor' },
          barAvailable: true,
          held: {
            '2026-10-17': 'Duha',
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
          previous: row('Isha', '2026-10-17', '2026-10-17T18:29:00.000Z'),
          countdown: { timeLeft: 43080, name: 'Sunrise' },
          barAvailable: true,
          held: {
            '2026-10-17': 'Isha',
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
          previous: row('Magrib', '2026-10-17', '2026-10-17T17:06:00.000Z'),
          countdown: { timeLeft: 42480, name: 'Fajr' },
          barAvailable: true,
          held: {
            '2026-10-17': 'Magrib',
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

    it("comes on screen when the 17th's Isha passes, counting down to the next readable prayer with no bar", () => {
      expect(observe(STANDARD)).toEqual({
        next: row('Fajr', '2026-10-19', '2026-10-19T04:55:00.000Z'),
        displayDate: '2026-10-18',
        previous: null,
        countdown: { timeLeft: 123960, name: 'Fajr' },
        barAvailable: false,
        held: { '2026-10-18': STANDARD_DASHED, '2026-10-19': STANDARD_ROWS },
      });
      expect(observe(EXTRA)).toEqual({
        next: row('Suhoor', '2026-10-19', '2026-10-19T04:35:00.000Z'),
        displayDate: '2026-10-18',
        previous: null,
        countdown: { timeLeft: 122760, name: 'Suhoor' },
        barAvailable: false,
        held: {
          '2026-10-17': EXTRAS_ROWS,
          '2026-10-18': EXTRAS_DASHED,
          '2026-10-19': '[Midnight], [Last Third], Suhoor, Duha',
        },
      });
    });

    it('stays until 00:00 London, then moves to the 19th on exactly the 00:00:00.000 tick', () => {
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
      expect(standardCountdown.values.map(({ timeLeft }) => timeLeft)).toEqual([21301, 21300, 21299, 21298]);
      expect(extraCountdown.values.map(({ timeLeft }) => timeLeft)).toEqual([20101, 20100, 20099, 20098]);

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

    it('catches up a 00:00 crossed while suspended when the app returns', () => {
      expect(getDisplayDate(STANDARD)).toBe('2026-10-18');
      moveClockTo('2026-10-19T00:30:00.000Z');

      resyncCountdowns();

      expect(getDisplayDate(STANDARD)).toBe('2026-10-19');
      expect(getDisplayDate(EXTRA)).toBe('2026-10-19');
      expect(getDefaultStore().get(getCountdownAtom(STANDARD))).toEqual({ timeLeft: 15900, name: 'Fajr' });
      expect(getDefaultStore().get(getCountdownAtom(EXTRA))).toEqual({ timeLeft: 14700, name: 'Suhoor' });
    });

    it('closes an open overlay 2 seconds before 00:00 and refuses to open inside that window', () => {
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
      displayDate: '2026-10-18',
      countdown: { timeLeft: 210480, name: 'Fajr' },
      barAvailable: false,
    });

    for (const [clock, holdEnd, nextListDay, timeLeft] of [
      ['2026-10-18T22:59:58.000Z', '2026-10-18T23:00:00.000Z', '2026-10-19', 107818],
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
      expect(getDefaultStore().get(getCountdownAtom(STANDARD))).toEqual({ timeLeft, name: 'Fajr' });
      expect(getDefaultStore().get(getBarAvailableAtom(STANDARD))).toBe(false);
    }
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

    it("counts down across the whole week once tomorrow's Isha passes", () => {
      storeDays(dates);
      launchAt('2026-10-16T12:00:00.000Z');
      expect(getNextPrayer(STANDARD)?.english).toBe('Asr');

      moveClockTo('2026-10-17T18:28:58.000Z');
      resyncCountdowns();
      jest.advanceTimersByTime(2000);

      expect(observe(STANDARD)).toEqual({
        next: row('Fajr', '2026-10-25', '2026-10-25T05:04:00.000Z'),
        displayDate: '2026-10-18',
        previous: null,
        countdown: { timeLeft: 642900, name: 'Fajr' },
        barAvailable: false,
        held: { ...LOST_WEEK, '2026-10-25': STANDARD_ROWS },
      });
      expect(observe(EXTRA)).toMatchObject({
        next: row('Suhoor', '2026-10-25', '2026-10-25T04:44:00.000Z'),
        displayDate: '2026-10-18',
        countdown: { timeLeft: 641700, name: 'Suhoor' },
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
        countdown: { timeLeft: 407040, name: 'Fajr' },
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

    it('stops growing at 14 list days when nothing readable is stored at all, leaving the countdown as it was', () => {
      launchAt('2026-10-17T12:00:00.000Z');
      const before = getDefaultStore().get(getCountdownAtom(STANDARD));

      jest.advanceTimersByTime(1000);

      expect(Object.keys(rowsHeld(STANDARD))).toHaveLength(14);
      expect(Object.keys(rowsHeld(STANDARD))[13]).toBe('2026-10-30');
      expect(getNextPrayer(STANDARD)).toBeNull();
      expect(getDisplayDate(STANDARD)).toBe('2026-10-17');
      expect(getNextBoundary(STANDARD)?.toISOString()).toBe('2026-10-17T23:00:00.000Z');
      expect(getDefaultStore().get(getCountdownAtom(STANDARD))).toBe(before);
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
    expect(store.get(getCountdownAtom(STANDARD))).toEqual({ ...next, timeLeft: (next.timeLeft ?? 0) - 1 });
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

    it("keeps the list before's last passed row for the progress bar, and nothing else of that list", () => {
      storeDays(OCT_16_TO_20);
      moveClockTo('2026-10-17T18:00:00.000Z');
      setSequence(STANDARD, new Date());

      moveClockTo('2026-10-17T18:29:00.000Z');
      refreshSequence(STANDARD);

      expect(observe(STANDARD)).toMatchObject({
        next: row('Fajr', '2026-10-18', '2026-10-18T04:54:00.000Z'),
        displayDate: '2026-10-18',
        previous: row('Isha', '2026-10-17', '2026-10-17T18:29:00.000Z'),
        held: { '2026-10-17': 'Isha', '2026-10-18': STANDARD_ROWS, '2026-10-19': STANDARD_ROWS },
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

      expect(observe(STANDARD)).toMatchObject({
        next: row('Fajr', '2026-10-20', '2026-10-20T04:57:00.000Z'),
        displayDate: '2026-10-19',
        held: { '2026-10-19': STANDARD_DASHED, '2026-10-20': STANDARD_ROWS, '2026-10-21': STANDARD_DASHED },
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
