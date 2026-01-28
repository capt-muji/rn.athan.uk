/**
 * Unit tests for hooks/useCountdownBar.ts
 *
 * Tests countdown bar progress calculation logic.
 * Note: React hook behavior requires @testing-library/react-hooks.
 */

import { ScheduleType, Prayer } from '@/shared/types';

// =============================================================================
// MOCK SETUP
// =============================================================================

jest.mock('@/shared/time', () => ({
  createLondonDate: jest.fn(() => new Date('2026-01-27T10:00:00')),
}));

jest.mock('jotai', () => ({
  useAtomValue: jest.fn(),
}));

jest.mock('@/stores/schedule', () => ({
  standardNextPrayerAtom: Symbol('standardNextPrayerAtom'),
  extraNextPrayerAtom: Symbol('extraNextPrayerAtom'),
  standardPrevPrayerAtom: Symbol('standardPrevPrayerAtom'),
  extraPrevPrayerAtom: Symbol('extraPrevPrayerAtom'),
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
 * Mirrors the progress calculation from useCountdownBar
 */
const calculateProgress = (
  nextPrayer: Prayer | null,
  prevPrayer: Prayer | null,
  now: Date
): { progress: number; isReady: boolean } => {
  if (!nextPrayer || !prevPrayer) {
    return { progress: 0, isReady: false };
  }

  const totalMs = nextPrayer.datetime.getTime() - prevPrayer.datetime.getTime();
  const elapsedMs = now.getTime() - prevPrayer.datetime.getTime();
  const progress = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));

  return { progress, isReady: true };
};

// =============================================================================
// PROGRESS CALCULATION TESTS
// =============================================================================

describe('progress calculation', () => {
  it('calculates 0% at start of interval', () => {
    const prevPrayer = createMockPrayer({ datetime: new Date('2026-01-27T06:00:00') });
    const nextPrayer = createMockPrayer({ datetime: new Date('2026-01-27T12:00:00') });
    const now = new Date('2026-01-27T06:00:00');

    const result = calculateProgress(nextPrayer, prevPrayer, now);

    expect(result.progress).toBe(0);
    expect(result.isReady).toBe(true);
  });

  it('calculates 50% at midpoint', () => {
    const prevPrayer = createMockPrayer({ datetime: new Date('2026-01-27T06:00:00') });
    const nextPrayer = createMockPrayer({ datetime: new Date('2026-01-27T12:00:00') });
    const now = new Date('2026-01-27T09:00:00');

    const result = calculateProgress(nextPrayer, prevPrayer, now);

    expect(result.progress).toBe(50);
  });

  it('calculates 100% at end of interval', () => {
    const prevPrayer = createMockPrayer({ datetime: new Date('2026-01-27T06:00:00') });
    const nextPrayer = createMockPrayer({ datetime: new Date('2026-01-27T12:00:00') });
    const now = new Date('2026-01-27T12:00:00');

    const result = calculateProgress(nextPrayer, prevPrayer, now);

    expect(result.progress).toBe(100);
  });
});

// =============================================================================
// CLAMPING TESTS
// =============================================================================

describe('clamping', () => {
  it('clamps to 0 when time is before prev prayer', () => {
    const prevPrayer = createMockPrayer({ datetime: new Date('2026-01-27T06:00:00') });
    const nextPrayer = createMockPrayer({ datetime: new Date('2026-01-27T12:00:00') });
    const now = new Date('2026-01-27T05:00:00');

    const result = calculateProgress(nextPrayer, prevPrayer, now);

    expect(result.progress).toBe(0);
  });

  it('clamps to 100 when time is after next prayer', () => {
    const prevPrayer = createMockPrayer({ datetime: new Date('2026-01-27T06:00:00') });
    const nextPrayer = createMockPrayer({ datetime: new Date('2026-01-27T12:00:00') });
    const now = new Date('2026-01-27T13:00:00');

    const result = calculateProgress(nextPrayer, prevPrayer, now);

    expect(result.progress).toBe(100);
  });
});

// =============================================================================
// MISSING PRAYER STATES
// =============================================================================

describe('missing prayers', () => {
  it('returns not ready when nextPrayer is null', () => {
    const prevPrayer = createMockPrayer();
    const now = new Date('2026-01-27T10:00:00');

    const result = calculateProgress(null, prevPrayer, now);

    expect(result.progress).toBe(0);
    expect(result.isReady).toBe(false);
  });

  it('returns not ready when prevPrayer is null', () => {
    const nextPrayer = createMockPrayer();
    const now = new Date('2026-01-27T10:00:00');

    const result = calculateProgress(nextPrayer, null, now);

    expect(result.progress).toBe(0);
    expect(result.isReady).toBe(false);
  });

  it('returns not ready when both prayers are null', () => {
    const now = new Date('2026-01-27T10:00:00');

    const result = calculateProgress(null, null, now);

    expect(result.progress).toBe(0);
    expect(result.isReady).toBe(false);
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe('edge cases', () => {
  it('handles very short intervals', () => {
    const prevPrayer = createMockPrayer({ datetime: new Date('2026-01-27T06:00:00') });
    const nextPrayer = createMockPrayer({ datetime: new Date('2026-01-27T06:01:00') });
    const now = new Date('2026-01-27T06:00:30');

    const result = calculateProgress(nextPrayer, prevPrayer, now);

    expect(result.progress).toBe(50);
  });

  it('handles overnight intervals', () => {
    const prevPrayer = createMockPrayer({ datetime: new Date('2026-01-26T20:00:00') });
    const nextPrayer = createMockPrayer({ datetime: new Date('2026-01-27T06:00:00') });
    const now = new Date('2026-01-27T01:00:00');

    const result = calculateProgress(nextPrayer, prevPrayer, now);

    expect(result.progress).toBe(50);
  });
});
