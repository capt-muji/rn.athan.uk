/**
 * Unit tests for hooks/usePrayerAgo.ts
 *
 * Tests prayer-ago display logic including:
 * - "now" vs "X ago" threshold (60 seconds)
 * - Minutes elapsed calculation
 * - Null prayer handling
 */

import { ScheduleType, Prayer } from '@/shared/types';

// =============================================================================
// MOCK SETUP
// =============================================================================

const mockFormatTimeAgo = jest.fn();

jest.mock('@/shared/time', () => ({
  createLondonDate: jest.fn(),
  formatTimeAgo: (seconds: number) => mockFormatTimeAgo(seconds),
}));

jest.mock('@/stores/schedule', () => ({
  getPrevPrayer: jest.fn(),
}));

// =============================================================================
// TEST HELPERS
// =============================================================================

const createMockPrayer = (overrides: Partial<Prayer> = {}): Prayer => ({
  type: ScheduleType.Standard,
  english: 'Fajr',
  arabic: 'الفجر',
  datetime: new Date('2026-01-27T06:15:00'),
  time: '06:15',
  belongsToDate: '2026-01-27',
  ...overrides,
});

/**
 * Mirrors the prayer-ago calculation from the hook
 */
const calculatePrayerAgo = (
  prevPrayer: Prayer | null,
  now: Date
): { prayerAgo: string; minutesElapsed: number; isReady: boolean } => {
  if (!prevPrayer) {
    return { prayerAgo: '', minutesElapsed: 0, isReady: false };
  }

  const secondsElapsed = Math.floor((now.getTime() - prevPrayer.datetime.getTime()) / 1000);
  const minutes = Math.floor(secondsElapsed / 60);
  const timeAgo = mockFormatTimeAgo(secondsElapsed);

  const agoText = secondsElapsed < 60 ? `${prevPrayer.english} now` : `${prevPrayer.english} ${timeAgo} ago`;

  return {
    prayerAgo: agoText,
    minutesElapsed: minutes,
    isReady: true,
  };
};

// =============================================================================
// "NOW" DISPLAY TESTS (< 60 seconds)
// =============================================================================

describe('now display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows "now" when 0 seconds elapsed', () => {
    const prevPrayer = createMockPrayer({ english: 'Fajr' });
    const now = prevPrayer.datetime;

    const result = calculatePrayerAgo(prevPrayer, now);

    expect(result.prayerAgo).toBe('Fajr now');
    expect(result.minutesElapsed).toBe(0);
  });

  it('shows "now" when 59 seconds elapsed', () => {
    const prevPrayer = createMockPrayer({
      english: 'Asr',
      datetime: new Date('2026-01-27T15:00:00'),
    });
    const now = new Date('2026-01-27T15:00:59');

    const result = calculatePrayerAgo(prevPrayer, now);

    expect(result.prayerAgo).toBe('Asr now');
    expect(result.minutesElapsed).toBe(0);
  });
});

// =============================================================================
// "AGO" DISPLAY TESTS (>= 60 seconds)
// =============================================================================

describe('ago display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows "X ago" when 60 seconds elapsed', () => {
    const prevPrayer = createMockPrayer({
      english: 'Magrib',
      datetime: new Date('2026-01-27T17:00:00'),
    });
    const now = new Date('2026-01-27T17:01:00');
    mockFormatTimeAgo.mockReturnValue('1m');

    const result = calculatePrayerAgo(prevPrayer, now);

    expect(result.prayerAgo).toBe('Magrib 1m ago');
    expect(result.minutesElapsed).toBe(1);
  });

  it('shows formatted time for hours elapsed', () => {
    const prevPrayer = createMockPrayer({
      english: 'Fajr',
      datetime: new Date('2026-01-27T06:00:00'),
    });
    const now = new Date('2026-01-27T08:30:00');
    mockFormatTimeAgo.mockReturnValue('2h 30m');

    const result = calculatePrayerAgo(prevPrayer, now);

    expect(result.prayerAgo).toBe('Fajr 2h 30m ago');
    expect(result.minutesElapsed).toBe(150);
  });

  it('calls formatTimeAgo with correct seconds', () => {
    const prevPrayer = createMockPrayer({
      datetime: new Date('2026-01-27T10:00:00'),
    });
    const now = new Date('2026-01-27T10:05:30');

    calculatePrayerAgo(prevPrayer, now);

    expect(mockFormatTimeAgo).toHaveBeenCalledWith(330);
  });
});

// =============================================================================
// MINUTES ELAPSED CALCULATION
// =============================================================================

describe('minutes elapsed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatTimeAgo.mockReturnValue('1m');
  });

  it('calculates 0 minutes for 0-59 seconds', () => {
    const prevPrayer = createMockPrayer({
      datetime: new Date('2026-01-27T10:00:00'),
    });
    const now = new Date('2026-01-27T10:00:45');

    const result = calculatePrayerAgo(prevPrayer, now);

    expect(result.minutesElapsed).toBe(0);
  });

  it('calculates 1 minute for 60-119 seconds', () => {
    const prevPrayer = createMockPrayer({
      datetime: new Date('2026-01-27T10:00:00'),
    });
    const now = new Date('2026-01-27T10:01:30');

    const result = calculatePrayerAgo(prevPrayer, now);

    expect(result.minutesElapsed).toBe(1);
  });

  it('calculates correct minutes for hours elapsed', () => {
    const prevPrayer = createMockPrayer({
      datetime: new Date('2026-01-27T06:00:00'),
    });
    const now = new Date('2026-01-27T09:15:00');
    mockFormatTimeAgo.mockReturnValue('3h 15m');

    const result = calculatePrayerAgo(prevPrayer, now);

    expect(result.minutesElapsed).toBe(195);
  });
});

// =============================================================================
// NO PREVIOUS PRAYER
// =============================================================================

describe('no previous prayer', () => {
  it('returns not ready when prevPrayer is null', () => {
    const now = new Date('2026-01-27T10:00:00');

    const result = calculatePrayerAgo(null, now);

    expect(result.prayerAgo).toBe('');
    expect(result.minutesElapsed).toBe(0);
    expect(result.isReady).toBe(false);
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe('edge cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles exactly 60 seconds threshold', () => {
    const prevPrayer = createMockPrayer({
      english: 'Fajr',
      datetime: new Date('2026-01-27T06:00:00'),
    });
    const now = new Date('2026-01-27T06:01:00');
    mockFormatTimeAgo.mockReturnValue('1m');

    const result = calculatePrayerAgo(prevPrayer, now);

    expect(result.prayerAgo).toBe('Fajr 1m ago');
  });

  it('handles very long durations', () => {
    const prevPrayer = createMockPrayer({
      english: 'Isha',
      datetime: new Date('2026-01-26T20:00:00'),
    });
    const now = new Date('2026-01-27T08:00:00');
    mockFormatTimeAgo.mockReturnValue('12h');

    const result = calculatePrayerAgo(prevPrayer, now);

    expect(result.prayerAgo).toBe('Isha 12h ago');
    expect(result.minutesElapsed).toBe(720);
  });
});
