/**
 * Unit tests for hooks/usePrayerAgo.ts
 *
 * These call the hook's OWN calculatePrayerAgo. The previous version of this
 * file defined a local copy that "mirrors the prayer-ago calculation from the
 * hook" and asserted the copy, so it would have passed even if the hook were
 * deleted. There is no renderer in the dependency tree, so the pure function is
 * exported and tested directly instead.
 *
 * Covers the "now" vs "X ago" threshold (60 seconds), minutes elapsed, the
 * missing-prayer path, and the guard around a throwing store.
 */

import { type Prayer, ScheduleType } from '@/shared/types';

// =============================================================================
// MOCK SETUP
// =============================================================================

// Babel hoists jest.mock above imports: factories may only close over
// `mock`-prefixed bindings (repo test rule, see ai/AGENTS.md testing notes)
const mockFormatTimeAgo = jest.fn();
const mockCreateInstant = jest.fn();
const mockGetPrevPrayer = jest.fn();

jest.mock('@/shared/time', () => ({
  createInstant: () => mockCreateInstant(),
  formatTimeAgo: (seconds: number) => mockFormatTimeAgo(seconds),
}));

jest.mock('@/stores/schedule', () => ({
  getPrevPrayer: (type: unknown) => mockGetPrevPrayer(type),
}));

// The hook subscribes to the countdown atom; the pure function never touches it
jest.mock('@/stores/countdown', () => ({
  getCountdownAtom: jest.fn(),
}));

import { calculatePrayerAgo } from '../usePrayerAgo';

// =============================================================================
// TEST HELPERS
// =============================================================================

const createMockPrayer = (overrides: Partial<Prayer> = {}): Prayer => ({
  type: ScheduleType.Standard,
  english: 'Fajr',
  arabic: 'الفجر',
  datetime: new Date('2026-01-27T06:15:00Z'),
  time: '06:15',
  belongsToDate: '2026-01-27',
  ...overrides,
});

/** Points the mocked store and clock at one previous prayer and one "now" */
const given = (prevPrayer: Prayer | null, now: Date) => {
  mockGetPrevPrayer.mockReturnValue(prevPrayer);
  mockCreateInstant.mockReturnValue(now);
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFormatTimeAgo.mockReturnValue('1m');
});

// =============================================================================
// "NOW" DISPLAY (< 60 seconds)
// =============================================================================

describe('now display', () => {
  it('shows "now" when 0 seconds elapsed', () => {
    const prayer = createMockPrayer({ english: 'Fajr' });
    given(prayer, prayer.datetime);

    expect(calculatePrayerAgo(ScheduleType.Standard)).toEqual({
      prayerAgo: 'Fajr now',
      minutesElapsed: 0,
      isReady: true,
    });
  });

  it('still shows "now" at 59 seconds', () => {
    const prayer = createMockPrayer({ english: 'Asr', datetime: new Date('2026-01-27T15:00:00Z') });
    given(prayer, new Date('2026-01-27T15:00:59Z'));

    const result = calculatePrayerAgo(ScheduleType.Standard);

    expect(result.prayerAgo).toBe('Asr now');
    expect(result.minutesElapsed).toBe(0);
  });
});

// =============================================================================
// "AGO" DISPLAY (>= 60 seconds)
// =============================================================================

describe('ago display', () => {
  it('flips to "X ago" exactly at 60 seconds', () => {
    const prayer = createMockPrayer({ english: 'Magrib', datetime: new Date('2026-01-27T17:00:00Z') });
    given(prayer, new Date('2026-01-27T17:01:00Z'));

    const result = calculatePrayerAgo(ScheduleType.Standard);

    expect(result.prayerAgo).toBe('Magrib 1m ago');
    expect(result.minutesElapsed).toBe(1);
  });

  it('formats hours through formatTimeAgo', () => {
    const prayer = createMockPrayer({ english: 'Fajr', datetime: new Date('2026-01-27T06:00:00Z') });
    given(prayer, new Date('2026-01-27T08:30:00Z'));
    mockFormatTimeAgo.mockReturnValue('2h 30m');

    const result = calculatePrayerAgo(ScheduleType.Standard);

    expect(result.prayerAgo).toBe('Fajr 2h 30m ago');
    expect(result.minutesElapsed).toBe(150);
  });

  it('passes whole elapsed seconds to formatTimeAgo', () => {
    given(createMockPrayer({ datetime: new Date('2026-01-27T10:00:00Z') }), new Date('2026-01-27T10:05:30Z'));

    calculatePrayerAgo(ScheduleType.Standard);

    expect(mockFormatTimeAgo).toHaveBeenCalledWith(330);
  });

  it('handles a long overnight gap', () => {
    const prayer = createMockPrayer({ english: 'Isha', datetime: new Date('2026-01-26T20:00:00Z') });
    given(prayer, new Date('2026-01-27T08:00:00Z'));
    mockFormatTimeAgo.mockReturnValue('12h');

    const result = calculatePrayerAgo(ScheduleType.Standard);

    expect(result.prayerAgo).toBe('Isha 12h ago');
    expect(result.minutesElapsed).toBe(720);
  });
});

// =============================================================================
// MINUTES ELAPSED
// =============================================================================

describe('minutes elapsed', () => {
  it.each([
    ['2026-01-27T10:00:45Z', 0],
    ['2026-01-27T10:01:30Z', 1],
    ['2026-01-27T13:15:00Z', 195],
  ])('at %s reports %i minutes', (now, expected) => {
    given(createMockPrayer({ datetime: new Date('2026-01-27T10:00:00Z') }), new Date(now));

    expect(calculatePrayerAgo(ScheduleType.Standard).minutesElapsed).toBe(expected);
  });
});

// =============================================================================
// NOT READY
// =============================================================================

describe('not ready', () => {
  it('reports not ready when there is no previous prayer', () => {
    given(null, new Date('2026-01-27T10:00:00Z'));

    expect(calculatePrayerAgo(ScheduleType.Standard)).toEqual({
      prayerAgo: '',
      minutesElapsed: 0,
      isReady: false,
    });
  });

  it('swallows a throwing store rather than breaking the page', () => {
    mockGetPrevPrayer.mockImplementation(() => {
      throw new Error('sequence not initialised');
    });

    expect(calculatePrayerAgo(ScheduleType.Standard)).toEqual({
      prayerAgo: '',
      minutesElapsed: 0,
      isReady: false,
    });
  });
});
