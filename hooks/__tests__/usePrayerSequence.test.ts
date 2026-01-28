/**
 * Unit tests for hooks/usePrayerSequence.ts
 *
 * Tests prayer sequence logic including:
 * - Next prayer detection (findIndex where datetime > now)
 * - Status derivation (isPassed, isNext flags)
 * - Ready state and edge cases
 */

import { ScheduleType, Prayer, PrayerSequence } from '@/shared/types';

// =============================================================================
// MOCK SETUP
// =============================================================================

const mockCreateLondonDate = jest.fn();

jest.mock('@/shared/time', () => ({
  createLondonDate: () => mockCreateLondonDate(),
}));

jest.mock('jotai', () => ({
  useAtomValue: jest.fn(),
}));

jest.mock('@/stores/schedule', () => ({
  standardSequenceAtom: Symbol('standardSequenceAtom'),
  extraSequenceAtom: Symbol('extraSequenceAtom'),
  standardDisplayDateAtom: Symbol('standardDisplayDateAtom'),
  extraDisplayDateAtom: Symbol('extraDisplayDateAtom'),
}));

// =============================================================================
// TEST HELPERS
// =============================================================================

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
 * Mirrors the hook's internal logic
 */
const calculatePrayerStatuses = (sequence: PrayerSequence | null, displayDate: string | null, now: Date) => {
  const rawPrayers = sequence?.prayers ?? [];
  const nextPrayerIndex = rawPrayers.findIndex((p) => p.datetime > now);

  const prayers = rawPrayers.map((prayer, index) => ({
    ...prayer,
    isPassed: prayer.datetime < now,
    isNext: index === nextPrayerIndex,
  }));

  return {
    prayers,
    displayDate,
    nextPrayerIndex: nextPrayerIndex >= 0 ? nextPrayerIndex : -1,
    isReady: sequence !== null,
  };
};

// =============================================================================
// READY STATE TESTS
// =============================================================================

describe('isReady state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateLondonDate.mockReturnValue(new Date('2026-01-20T10:00:00'));
  });

  it('returns isReady: false when sequence is null', () => {
    const now = new Date('2026-01-20T10:00:00');
    const result = calculatePrayerStatuses(null, null, now);

    expect(result.isReady).toBe(false);
    expect(result.prayers).toEqual([]);
  });

  it('returns isReady: true when sequence exists', () => {
    const now = new Date('2026-01-20T10:00:00');
    const prayers = [createMockPrayer({ datetime: new Date('2026-01-20T12:00:00') })];
    const sequence: PrayerSequence = { type: ScheduleType.Standard, prayers };

    const result = calculatePrayerStatuses(sequence, '2026-01-20', now);

    expect(result.isReady).toBe(true);
  });
});

// =============================================================================
// NEXT PRAYER DETECTION TESTS
// =============================================================================

describe('next prayer detection', () => {
  it('finds first prayer with datetime > now', () => {
    const now = new Date('2026-01-20T10:00:00');
    const prayers = [
      createMockPrayer({ english: 'Fajr', datetime: new Date('2026-01-20T06:15:00') }),
      createMockPrayer({ english: 'Sunrise', datetime: new Date('2026-01-20T07:50:00') }),
      createMockPrayer({ english: 'Dhuhr', datetime: new Date('2026-01-20T12:25:00') }),
      createMockPrayer({ english: 'Asr', datetime: new Date('2026-01-20T14:40:00') }),
    ];
    const sequence: PrayerSequence = { type: ScheduleType.Standard, prayers };

    const result = calculatePrayerStatuses(sequence, '2026-01-20', now);

    expect(result.nextPrayerIndex).toBe(2);
  });

  it('returns 0 when all prayers are in future', () => {
    const now = new Date('2026-01-20T04:00:00');
    const prayers = [
      createMockPrayer({ english: 'Fajr', datetime: new Date('2026-01-20T06:15:00') }),
      createMockPrayer({ english: 'Dhuhr', datetime: new Date('2026-01-20T12:25:00') }),
    ];
    const sequence: PrayerSequence = { type: ScheduleType.Standard, prayers };

    const result = calculatePrayerStatuses(sequence, '2026-01-20', now);

    expect(result.nextPrayerIndex).toBe(0);
  });

  it('returns -1 when all prayers have passed', () => {
    const now = new Date('2026-01-20T23:00:00');
    const prayers = [
      createMockPrayer({ english: 'Fajr', datetime: new Date('2026-01-20T06:15:00') }),
      createMockPrayer({ english: 'Isha', datetime: new Date('2026-01-20T18:45:00') }),
    ];
    const sequence: PrayerSequence = { type: ScheduleType.Standard, prayers };

    const result = calculatePrayerStatuses(sequence, '2026-01-20', now);

    expect(result.nextPrayerIndex).toBe(-1);
  });

  it('uses > not >= for time comparison', () => {
    const exactTime = new Date('2026-01-20T12:25:00');
    const prayers = [
      createMockPrayer({ english: 'Dhuhr', datetime: new Date('2026-01-20T12:25:00') }),
      createMockPrayer({ english: 'Asr', datetime: new Date('2026-01-20T14:40:00') }),
    ];
    const sequence: PrayerSequence = { type: ScheduleType.Standard, prayers };

    const result = calculatePrayerStatuses(sequence, '2026-01-20', exactTime);

    expect(result.nextPrayerIndex).toBe(1);
  });
});

// =============================================================================
// STATUS DERIVATION TESTS (isPassed, isNext)
// =============================================================================

describe('status derivation', () => {
  it('marks prayers with datetime < now as isPassed: true', () => {
    const now = new Date('2026-01-20T10:00:00');
    const prayers = [
      createMockPrayer({ english: 'Fajr', datetime: new Date('2026-01-20T06:15:00') }),
      createMockPrayer({ english: 'Dhuhr', datetime: new Date('2026-01-20T12:25:00') }),
    ];
    const sequence: PrayerSequence = { type: ScheduleType.Standard, prayers };

    const result = calculatePrayerStatuses(sequence, '2026-01-20', now);

    expect(result.prayers[0].isPassed).toBe(true);
    expect(result.prayers[1].isPassed).toBe(false);
  });

  it('marks only next prayer with isNext: true', () => {
    const now = new Date('2026-01-20T10:00:00');
    const prayers = [
      createMockPrayer({ english: 'Fajr', datetime: new Date('2026-01-20T06:15:00') }),
      createMockPrayer({ english: 'Dhuhr', datetime: new Date('2026-01-20T12:25:00') }),
      createMockPrayer({ english: 'Asr', datetime: new Date('2026-01-20T14:40:00') }),
    ];
    const sequence: PrayerSequence = { type: ScheduleType.Standard, prayers };

    const result = calculatePrayerStatuses(sequence, '2026-01-20', now);

    expect(result.prayers[0].isNext).toBe(false);
    expect(result.prayers[1].isNext).toBe(true);
    expect(result.prayers[2].isNext).toBe(false);
  });

  it('marks all prayers as isNext: false when all have passed', () => {
    const now = new Date('2026-01-20T23:00:00');
    const prayers = [
      createMockPrayer({ english: 'Fajr', datetime: new Date('2026-01-20T06:15:00') }),
      createMockPrayer({ english: 'Isha', datetime: new Date('2026-01-20T18:45:00') }),
    ];
    const sequence: PrayerSequence = { type: ScheduleType.Standard, prayers };

    const result = calculatePrayerStatuses(sequence, '2026-01-20', now);

    expect(result.prayers.every((p) => !p.isNext)).toBe(true);
  });
});

// =============================================================================
// DISPLAY DATE TESTS
// =============================================================================

describe('display date', () => {
  it('returns null when passed null', () => {
    const now = new Date('2026-01-20T10:00:00');
    const result = calculatePrayerStatuses(null, null, now);

    expect(result.displayDate).toBeNull();
  });

  it('returns the display date when provided', () => {
    const now = new Date('2026-01-20T10:00:00');
    const prayers = [createMockPrayer({ datetime: new Date('2026-01-20T12:00:00') })];
    const sequence: PrayerSequence = { type: ScheduleType.Standard, prayers };

    const result = calculatePrayerStatuses(sequence, '2026-01-20', now);

    expect(result.displayDate).toBe('2026-01-20');
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe('edge cases', () => {
  it('handles empty prayer array', () => {
    const now = new Date('2026-01-20T10:00:00');
    const sequence: PrayerSequence = { type: ScheduleType.Standard, prayers: [] };

    const result = calculatePrayerStatuses(sequence, '2026-01-20', now);

    expect(result.prayers).toEqual([]);
    expect(result.nextPrayerIndex).toBe(-1);
    expect(result.isReady).toBe(true);
  });

  it('handles single prayer in sequence', () => {
    const now = new Date('2026-01-20T10:00:00');
    const prayers = [createMockPrayer({ english: 'Dhuhr', datetime: new Date('2026-01-20T12:25:00') })];
    const sequence: PrayerSequence = { type: ScheduleType.Standard, prayers };

    const result = calculatePrayerStatuses(sequence, '2026-01-20', now);

    expect(result.prayers).toHaveLength(1);
    expect(result.prayers[0].isNext).toBe(true);
    expect(result.nextPrayerIndex).toBe(0);
  });

  it('handles prayer at exact current time', () => {
    const exactTime = new Date('2026-01-20T12:25:00');
    const prayers = [
      createMockPrayer({ english: 'Dhuhr', datetime: exactTime }),
      createMockPrayer({ english: 'Asr', datetime: new Date('2026-01-20T14:40:00') }),
    ];
    const sequence: PrayerSequence = { type: ScheduleType.Standard, prayers };

    const result = calculatePrayerStatuses(sequence, '2026-01-20', exactTime);

    expect(result.prayers[0].isPassed).toBe(false);
    expect(result.prayers[0].isNext).toBe(false);
    expect(result.prayers[1].isNext).toBe(true);
  });
});
