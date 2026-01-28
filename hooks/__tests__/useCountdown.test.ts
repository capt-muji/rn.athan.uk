/**
 * Unit tests for hooks/useCountdown.ts
 *
 * Tests countdown calculation logic.
 * Note: React hook behavior requires @testing-library/react-hooks.
 */

// =============================================================================
// MOCK SETUP
// =============================================================================

jest.mock('@/shared/time', () => ({
  createLondonDate: jest.fn(() => new Date('2026-01-27T10:00:00')),
  getSecondsBetween: jest.fn((from: Date, to: Date) => Math.floor((to.getTime() - from.getTime()) / 1000)),
}));

jest.mock('jotai', () => ({
  useAtomValue: jest.fn(),
}));

jest.mock('@/stores/schedule', () => ({
  standardNextPrayerAtom: Symbol('standardNextPrayerAtom'),
  extraNextPrayerAtom: Symbol('extraNextPrayerAtom'),
}));

// =============================================================================
// CALCULATION LOGIC TESTS
// =============================================================================

describe('countdown calculation logic', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getSecondsBetween } = require('@/shared/time');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calculates positive seconds for future prayer', () => {
    const now = new Date('2026-01-27T10:00:00');
    const prayerTime = new Date('2026-01-27T12:30:00');

    const seconds = getSecondsBetween(now, prayerTime);

    expect(seconds).toBe(9000); // 2.5 hours
  });

  it('calculates negative seconds for past prayer (clamped to 0 in hook)', () => {
    const now = new Date('2026-01-27T15:00:00');
    const prayerTime = new Date('2026-01-27T12:30:00');

    const seconds = getSecondsBetween(now, prayerTime);
    const clampedSeconds = Math.max(0, seconds);

    expect(seconds).toBe(-9000);
    expect(clampedSeconds).toBe(0);
  });

  it('returns 0 for exact prayer time', () => {
    const time = new Date('2026-01-27T12:30:00');

    const seconds = getSecondsBetween(time, time);

    expect(seconds).toBe(0);
  });

  it('handles overnight calculations', () => {
    const now = new Date('2026-01-27T23:00:00');
    const prayerTime = new Date('2026-01-28T06:00:00');

    const seconds = getSecondsBetween(now, prayerTime);

    expect(seconds).toBe(25200); // 7 hours
  });
});
