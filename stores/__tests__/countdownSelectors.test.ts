/**
 * The per-schedule countdown selectors in stores/countdown.ts
 *
 * Each page's hero name and countdown bar must read that page's own countdown and its own previous and next rows.
 * The two pages count to different prayers at the same moment, so a selector reaching the other schedule shows a
 * wrong name or a wrong fill. Every expected percentage below is worked out by hand from the fixture instants.
 */

import { createStore, atom as mockAtom } from 'jotai';

import { ScheduleType } from '@/shared/types';

// =============================================================================
// MOCK SETUP
// =============================================================================

jest.mock('@/stores/schedule', () => {
  // Built inside the factory: countdown.ts builds its bar atoms from these while it loads
  const { atom } = require('jotai');
  return {
    refreshSequence: jest.fn(),
    getNextPrayer: jest.fn(() => null),
    getNextBoundary: jest.fn(() => null),
    getSequenceAtom: jest.fn(() => atom(null)),
    standardDisplayDateAtom: atom(null),
    extraDisplayDateAtom: atom(null),
    standardNextPrayerAtom: atom(null),
    extraNextPrayerAtom: atom(null),
    standardPrevPrayerAtom: atom(null),
    extraPrevPrayerAtom: atom(null),
    getDisplayHeldAtom: jest.fn(() => atom(false)),
  };
});

jest.mock('@/stores/atoms/overlay', () => ({
  overlayAtom: mockAtom({ isOn: false, selectedPrayerIndex: 0, scheduleType: 'standard' }),
}));

// Require (not import) after mocks - babel hoists ESM imports above the mock declarations
const {
  extraCountdownAtom,
  extraCountdownNameAtom,
  getBarProgressAtom,
  getBarWarningAtom,
  getCountdownNameAtom,
  standardCountdownAtom,
  standardCountdownNameAtom,
}: typeof import('../countdown') = require('../countdown');

const schedule = jest.requireMock('@/stores/schedule');

// =============================================================================
// FIXTURES
// =============================================================================

const NOW = new Date('2026-01-20T10:00:00.000Z');

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

// =============================================================================
// NAME SELECTORS
// =============================================================================

describe('getCountdownNameAtom', () => {
  it.each([
    { type: ScheduleType.Standard, exported: () => standardCountdownNameAtom },
    { type: ScheduleType.Extra, exported: () => extraCountdownNameAtom },
  ])('returns the $type name selector, the same atom every call', ({ type, exported }) => {
    expect(getCountdownNameAtom(type)).toBe(exported());
    expect(getCountdownNameAtom(type)).toBe(getCountdownNameAtom(type));
  });

  it('names what each page counts to, while the two pages count to different prayers', () => {
    const store = createStore();
    store.set(standardCountdownAtom, { timeLeft: 7200, name: 'Dhuhr' });
    store.set(extraCountdownAtom, { timeLeft: 1800, name: 'Duha' });

    expect(store.get(getCountdownNameAtom(ScheduleType.Standard))).toBe('Dhuhr');
    expect(store.get(getCountdownNameAtom(ScheduleType.Extra))).toBe('Duha');
  });

  it.each([ScheduleType.Standard, ScheduleType.Extra])(
    'tells the %s hero only when the name changes, not on every second the countdown ticks',
    (type) => {
      const store = createStore();
      const source = type === ScheduleType.Standard ? standardCountdownAtom : extraCountdownAtom;
      const other = type === ScheduleType.Standard ? extraCountdownAtom : standardCountdownAtom;
      store.set(source, { timeLeft: 3, name: 'Asr' });
      const names: string[] = [];
      const unsubscribe = store.sub(getCountdownNameAtom(type), () =>
        names.push(store.get(getCountdownNameAtom(type)))
      );

      store.set(source, { timeLeft: 2, name: 'Asr' });
      store.set(source, { timeLeft: 1, name: 'Asr' });
      store.set(other, { timeLeft: 50, name: 'Isha' });
      store.set(source, { timeLeft: 5400, name: 'Magrib' });

      expect(names).toEqual(['Magrib']);
      unsubscribe();
    }
  );
});

// =============================================================================
// BAR SELECTORS
// =============================================================================

// A winter morning, 00:30 BST and 23:59:41 BST, so the arithmetic is shown not to lean on a calendar day
describe.each([
  { when: '10:00 GMT on 20 January', at: '2026-01-20T10:00:00.000Z' },
  { when: '00:30 BST on 15 September', at: '2026-09-14T23:30:00.000Z' },
  { when: '23:59:41 BST on 14 September', at: '2026-09-14T22:59:41.000Z' },
])('the countdown bar selectors at $when', ({ at }) => {
  const now = new Date(at);
  const minutesFromNow = (english: string, minutes: number) => ({
    english,
    datetime: new Date(now.getTime() + minutes * 60_000),
  });

  beforeEach(() => {
    jest.setSystemTime(now);
  });

  // Standard spans 60 minutes before now to 60 after: 1h of 2h gone, so 50% with 50% left.
  // Extras spans 120 minutes before now to 10 after: 2h of 2h 10m gone, 7200 / 7800 = 92.3077%, 7.69% left, under 10%
  const PAIRS = {
    [ScheduleType.Standard]: {
      prev: minutesFromNow('Fajr', -60),
      next: minutesFromNow('Dhuhr', 60),
      progress: 50,
      warning: false,
    },
    [ScheduleType.Extra]: {
      prev: minutesFromNow('Suhoor', -120),
      next: minutesFromNow('Duha', 10),
      progress: (7200 / 7800) * 100,
      warning: true,
    },
  };

  const storeWithBothPairs = () => {
    const store = createStore();
    store.set(schedule.standardPrevPrayerAtom, PAIRS[ScheduleType.Standard].prev);
    store.set(schedule.standardNextPrayerAtom, PAIRS[ScheduleType.Standard].next);
    store.set(schedule.extraPrevPrayerAtom, PAIRS[ScheduleType.Extra].prev);
    store.set(schedule.extraNextPrayerAtom, PAIRS[ScheduleType.Extra].next);
    return store;
  };

  it.each([ScheduleType.Standard, ScheduleType.Extra])(
    'fills the %s bar from its own previous and next rows, not the other page’s',
    (type) => {
      const store = storeWithBothPairs();

      expect(store.get(getBarProgressAtom(type))).toBeCloseTo(PAIRS[type].progress, 6);
      expect(store.get(getBarWarningAtom(type))).toBe(PAIRS[type].warning);
    }
  );

  it.each([ScheduleType.Standard, ScheduleType.Extra])(
    'moves the %s bar on its own countdown’s tick, and on no other',
    (type) => {
      const store = storeWithBothPairs();
      const own = type === ScheduleType.Standard ? standardCountdownAtom : extraCountdownAtom;
      const other = type === ScheduleType.Standard ? extraCountdownAtom : standardCountdownAtom;
      const before = store.get(getBarProgressAtom(type));

      // 60 seconds later: Standard 3660 / 7200 = 50.8333%, Extras 7260 / 7800 = 93.0769%
      jest.setSystemTime(new Date(now.getTime() + 60_000));
      store.set(other, { timeLeft: 1, name: 'Other' });
      expect(store.get(getBarProgressAtom(type))).toBe(before);

      store.set(own, { timeLeft: 1, name: 'Own' });
      const expected = type === ScheduleType.Standard ? (3660 / 7200) * 100 : (7260 / 7800) * 100;
      expect(store.get(getBarProgressAtom(type))).toBeCloseTo(expected, 6);
    }
  );

  // The next and previous atoms are each held from their own first read after the sequence changes, so read
  // either side of a prayer's instant they can name the same row. The bar must then draw nothing, not a width
  // divided by zero
  it.each([ScheduleType.Standard, ScheduleType.Extra])(
    'draws an empty bar with no warning on %s when the previous and next rows are the same instant',
    (type) => {
      const store = createStore();
      const same = minutesFromNow('Asr', -1);
      const prevAtom = type === ScheduleType.Standard ? schedule.standardPrevPrayerAtom : schedule.extraPrevPrayerAtom;
      const nextAtom = type === ScheduleType.Standard ? schedule.standardNextPrayerAtom : schedule.extraNextPrayerAtom;
      store.set(prevAtom, same);
      store.set(nextAtom, same);

      expect(store.get(getBarProgressAtom(type))).toBe(0);
      expect(store.get(getBarWarningAtom(type))).toBe(false);
    }
  );
});
