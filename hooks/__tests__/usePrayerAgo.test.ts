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

import { type Prayer, type ReadablePrayer, ScheduleType } from '@/shared/types';

// =============================================================================
// MOCK SETUP
// =============================================================================

// Babel hoists jest.mock above imports: factories may only close over
// `mock`-prefixed bindings (repo test rule, see ai/AGENTS.md testing notes)
const mockFormatTimeAgo = jest.fn();
const mockCreateInstant = jest.fn();
const mockGetPrevPrayer = jest.fn();
const mockSetState = jest.fn();
const mockSubscribe = jest.fn();
const mockEffects: (() => unknown)[] = [];

jest.mock('@/shared/time', () => ({
  createInstant: () => mockCreateInstant(),
  formatTimeAgo: (seconds: number) => mockFormatTimeAgo(seconds),
}));

jest.mock('@/stores/schedule', () => ({
  getPrevPrayer: (type: unknown) => mockGetPrevPrayer(type),
}));

jest.mock('@/stores/countdown', () => ({
  getCountdownAtom: (type: string) => `${type}CountdownAtom`,
}));

// No renderer exists in the test tree, so the hook runs against the three React hooks it uses: state from
// its lazy initializer, callbacks as written, and effects collected to run by hand
jest.mock('react', () => ({
  useState: (initial: () => unknown) => [initial(), mockSetState],
  useCallback: (callback: unknown) => callback,
  useEffect: (effect: () => unknown) => mockEffects.push(effect),
}));

jest.mock('jotai/vanilla', () => ({
  getDefaultStore: () => ({ sub: (atom: unknown, listener: unknown) => mockSubscribe(atom, listener) }),
}));

import { calculatePrayerAgo, usePrayerAgo } from '../usePrayerAgo';

// =============================================================================
// TEST HELPERS
// =============================================================================

const createMockPrayer = (overrides: Partial<ReadablePrayer> = {}): ReadablePrayer => ({
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
  mockEffects.length = 0;
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

// =============================================================================
// THE HOOK
// =============================================================================

describe('usePrayerAgo', () => {
  /** Runs the hook's effect and hands back the listener it subscribed */
  const subscribeListener = () => {
    for (const effect of mockEffects) effect();
    return mockSubscribe.mock.calls[0][1] as () => void;
  };

  it('calculates its first state synchronously, before any tick', () => {
    given(
      createMockPrayer({ english: 'Dhuhr', datetime: new Date('2026-01-27T12:00:00Z') }),
      new Date('2026-01-27T12:05:00Z')
    );
    mockFormatTimeAgo.mockReturnValue('5m');

    expect(usePrayerAgo(ScheduleType.Standard)).toEqual({
      prayerAgo: 'Dhuhr 5m ago',
      minutesElapsed: 5,
      isReady: true,
    });
  });

  it("rides its own schedule's countdown tick and unsubscribes on cleanup", () => {
    const unsubscribe = jest.fn();
    mockSubscribe.mockReturnValue(unsubscribe);
    given(createMockPrayer(), new Date('2026-01-27T07:00:00Z'));

    usePrayerAgo(ScheduleType.Extra);

    expect(mockEffects).toHaveLength(1);
    expect(mockEffects[0]()).toBe(unsubscribe);
    expect(mockSubscribe).toHaveBeenCalledWith('extraCountdownAtom', expect.any(Function));
  });

  it('keeps the previous state on a tick that changes nothing, so nothing re-renders', () => {
    given(createMockPrayer({ datetime: new Date('2026-01-27T10:00:00Z') }), new Date('2026-01-27T10:05:10Z'));
    const initial = usePrayerAgo(ScheduleType.Standard);

    mockCreateInstant.mockReturnValue(new Date('2026-01-27T10:05:40Z'));
    subscribeListener()();
    const update = mockSetState.mock.calls[0][0] as (previous: unknown) => unknown;

    expect(update(initial)).toBe(initial);
  });

  it('hands over a new state once the text moves on', () => {
    given(createMockPrayer({ datetime: new Date('2026-01-27T10:00:00Z') }), new Date('2026-01-27T10:05:10Z'));
    const initial = usePrayerAgo(ScheduleType.Standard);

    mockCreateInstant.mockReturnValue(new Date('2026-01-27T10:06:10Z'));
    mockFormatTimeAgo.mockReturnValue('6m');
    subscribeListener()();
    const update = mockSetState.mock.calls[0][0] as (previous: unknown) => unknown;

    expect(update(initial)).toEqual({ prayerAgo: 'Fajr 6m ago', minutesElapsed: 6, isReady: true });
  });
});
