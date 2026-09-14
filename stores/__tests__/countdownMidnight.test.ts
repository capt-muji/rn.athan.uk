/**
 * The clock reaching 00:00 London while the app is open
 *
 * Runs the real schedule and countdown stores, the real list builder and the real sequence rules over the published
 * London days from 15 to 20 October 2026. The Extras lists of the 17th and the 18th open with a Midnight at exactly
 * 00:00:00, the 19th's at 23:59, and no Standard row falls near 00:00. Only storage is replaced, by a Map, and the
 * clock is driven by fake timers from absolute instants.
 *
 * Every instant and count expected here was worked out outside the app, from the published times with Python's
 * zoneinfo.
 */

// =============================================================================
// MOCK SETUP (must be before imports)
// =============================================================================

const mockStoredDays = new Map<string, unknown>();

jest.mock('@/stores/database', () => ({
  ...jest.requireActual('@/stores/database'),
  getPrayerByDateString: (date: string) => mockStoredDays.get(date) ?? null,
}));

import type { Atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import { transformApiData } from '@/shared/prayer';
import { type CountdownStore, type Prayer, ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/atoms/overlay';

import {
  checkOverlayBoundary,
  clearOverlayBoundary,
  getBarAvailableAtom,
  getCountdownAtom,
  resyncCountdowns,
  startCountdowns,
} from '../countdown';
import {
  extraDisplayDateAtom,
  extraSequenceAtom,
  getDisplayDate,
  getNextPrayer,
  getPrevPrayer,
  getSequenceAtom,
  setSequence,
  standardDisplayDateAtom,
  standardSequenceAtom,
} from '../schedule';

// =============================================================================
// TEST HELPERS
// =============================================================================

const STANDARD = ScheduleType.Standard;
const EXTRA = ScheduleType.Extra;

const store = getDefaultStore();

/** Published London times from the provider's 2026 download: Fajr, Sunrise, Dhuhr, Asr, Magrib, Isha */
const OCTOBER: Record<string, string[]> = {
  '2026-10-15': ['05:50', '07:22', '12:51', '15:33', '18:11', '19:34'],
  '2026-10-16': ['05:51', '07:23', '12:51', '15:31', '18:08', '19:31'],
  '2026-10-17': ['05:52', '07:25', '12:51', '15:30', '18:06', '19:29'],
  '2026-10-18': ['05:54', '07:27', '12:51', '15:28', '18:04', '19:27'],
  '2026-10-19': ['05:55', '07:28', '12:51', '15:26', '18:02', '19:25'],
  '2026-10-20': ['05:57', '07:30', '12:50', '15:25', '18:00', '19:23'],
};

/** Stores the days as a download leaves them, with Suhoor, Duha and Istijaba worked out */
const storeOctober = () => {
  mockStoredDays.clear();
  for (const [date, [fajr, sunrise, dhuhr, asr, magrib, isha]] of Object.entries(OCTOBER)) {
    const times = { [date]: { fajr, sunrise, dhuhr, asr, magrib, isha } };
    mockStoredDays.set(date, transformApiData({ city: 'london', times })[0]);
  }
};

const label = (prayer: Prayer | null): string | null =>
  prayer && `${prayer.english} of ${prayer.belongsToDate} at ${prayer.datetime?.toISOString() ?? '--:--'}`;

const listDaysHeld = (type: ScheduleType): string[] => [
  ...new Set((store.get(getSequenceAtom(type))?.prayers ?? []).map((prayer) => prayer.belongsToDate)),
];

/** Stopped in afterEach, so a failed assertion cannot leave atoms mounted for the next test */
const subscriptions: (() => void)[] = [];

/** Every value an atom takes from now on, as a mounted screen receives it */
function recordValues<T>(watched: Atom<T>): T[] {
  const values: T[] = [];
  subscriptions.push(store.sub(watched, () => values.push(store.get(watched))));
  return values;
}

/** The instant of every write to an atom from now on */
const recordWrites = (watched: Atom<unknown>): string[] => {
  const writes: string[] = [];
  subscriptions.push(store.sub(watched, () => writes.push(new Date().toISOString())));
  return writes;
};

/** The app opening at an instant, as sync() and the cache bootstrap do: both lists built from storage, then the tickers */
const openAt = (instant: string) => {
  jest.setSystemTime(new Date(instant));
  setSequence(STANDARD, new Date());
  setSequence(EXTRA, new Date());
  startCountdowns();
};

const shiftSeconds = (instant: string, seconds: number) => new Date(Date.parse(instant) + seconds * 1000).toISOString();

/**
 * What a countdown shows on each whole second from `from` to `to`: the seconds left to the first target strictly
 * ahead, under that target's name
 */
const everySecond = (from: string, to: string, targets: [string, string][]): CountdownStore[] => {
  const values: CountdownStore[] = [];
  for (let at = Date.parse(from); at <= Date.parse(to); at += 1000) {
    const ahead = targets.find(([, instant]) => Date.parse(instant) > at);
    if (!ahead) throw new Error(`No target is ahead of ${new Date(at).toISOString()}`);
    values.push({ timeLeft: (Date.parse(ahead[1]) - at) / 1000, name: ahead[0] });
  }
  return values;
};

beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2026-10-16T22:58:00.000Z') });
  storeOctober();
  store.set(standardSequenceAtom, null);
  store.set(extraSequenceAtom, null);
  store.set(overlayAtom, { isOn: false, selectedPrayerIndex: 0, scheduleType: STANDARD });
  clearOverlayBoundary();
});

afterEach(() => {
  for (const stop of subscriptions.splice(0)) stop();
  jest.clearAllTimers();
  jest.useRealTimers();
});

// =============================================================================
// 00:00 LONDON WITH THE APP OPEN
// =============================================================================

interface Night {
  night: string;
  /** Two minutes before 00:00 London */
  launch: string;
  /** The list day on screen on both schedules, either side of 00:00 */
  listDay: string;
  fajr: string;
  /** The Extras targets in turn: the next list's Midnight, then its Last Third */
  extras: [string, string][];
  extraWrites: string[];
  heldBefore: string[];
  heldAfter: string[];
  /** The row the Extras bar measures from once Midnight has passed: that Midnight, still in the sequence */
  extrasPrevious: string;
  /** Countdown readings worked out by hand, as [instant, name, seconds] */
  standardReadings: [string, string, number][];
  extrasReadings: [string, string, number][];
}

const NIGHTS: Night[] = [
  {
    night: 'into 17 October, whose Midnight is 00:00:00',
    launch: '2026-10-16T22:58:00.000Z',
    listDay: '2026-10-17',
    fajr: '2026-10-17T04:52:00.000Z',
    extras: [
      ['Midnight', '2026-10-16T23:00:00.000Z'],
      ['Last Third', '2026-10-17T00:57:00.000Z'],
    ],
    extraWrites: ['2026-10-16T23:00:00.000Z'],
    heldBefore: ['2026-10-16', '2026-10-17', '2026-10-18'],
    heldAfter: ['2026-10-17', '2026-10-18'],
    extrasPrevious: 'Midnight of 2026-10-17 at 2026-10-16T23:00:00.000Z',
    standardReadings: [
      ['2026-10-16T22:58:00.000Z', 'Fajr', 21240],
      ['2026-10-16T23:00:02.000Z', 'Fajr', 21118],
    ],
    extrasReadings: [
      ['2026-10-16T22:58:00.000Z', 'Midnight', 120],
      ['2026-10-16T22:59:59.000Z', 'Midnight', 1],
      ['2026-10-16T23:00:00.000Z', 'Last Third', 7020],
      ['2026-10-16T23:00:02.000Z', 'Last Third', 7018],
    ],
  },
  {
    night: 'into 18 October, whose Midnight is 00:00:00',
    launch: '2026-10-17T22:58:00.000Z',
    listDay: '2026-10-18',
    fajr: '2026-10-18T04:54:00.000Z',
    extras: [
      ['Midnight', '2026-10-17T23:00:00.000Z'],
      ['Last Third', '2026-10-18T00:58:00.000Z'],
    ],
    extraWrites: ['2026-10-17T23:00:00.000Z'],
    heldBefore: ['2026-10-17', '2026-10-18', '2026-10-19'],
    heldAfter: ['2026-10-18', '2026-10-19'],
    extrasPrevious: 'Midnight of 2026-10-18 at 2026-10-17T23:00:00.000Z',
    standardReadings: [
      ['2026-10-17T22:58:00.000Z', 'Fajr', 21360],
      ['2026-10-17T23:00:02.000Z', 'Fajr', 21238],
    ],
    extrasReadings: [
      ['2026-10-17T22:58:00.000Z', 'Midnight', 120],
      ['2026-10-17T22:59:59.000Z', 'Midnight', 1],
      ['2026-10-17T23:00:00.000Z', 'Last Third', 7080],
      ['2026-10-17T23:00:02.000Z', 'Last Third', 7078],
    ],
  },
  {
    night: 'into 19 October, whose Midnight is 23:59 and which has no row at 00:00',
    launch: '2026-10-18T22:58:00.000Z',
    listDay: '2026-10-19',
    fajr: '2026-10-19T04:55:00.000Z',
    extras: [
      ['Midnight', '2026-10-18T22:59:00.000Z'],
      ['Last Third', '2026-10-19T00:58:00.000Z'],
    ],
    extraWrites: ['2026-10-18T22:59:00.000Z'],
    heldBefore: ['2026-10-18', '2026-10-19', '2026-10-20'],
    heldAfter: ['2026-10-19', '2026-10-20'],
    extrasPrevious: 'Midnight of 2026-10-19 at 2026-10-18T22:59:00.000Z',
    standardReadings: [
      ['2026-10-18T22:58:00.000Z', 'Fajr', 21420],
      ['2026-10-18T23:00:02.000Z', 'Fajr', 21298],
    ],
    extrasReadings: [
      ['2026-10-18T22:58:00.000Z', 'Midnight', 60],
      ['2026-10-18T22:58:59.000Z', 'Midnight', 1],
      ['2026-10-18T22:59:00.000Z', 'Last Third', 7140],
      ['2026-10-18T23:00:00.000Z', 'Last Third', 7080],
      ['2026-10-18T23:00:02.000Z', 'Last Third', 7078],
    ],
  },
];

describe('crossing 00:00:00 with the app running advances only the Extras sequence, once, and neither display date moves', () => {
  it.each(NIGHTS)(
    '$night',
    ({ launch, listDay, fajr, extras, extraWrites, heldBefore, heldAfter, extrasPrevious, ...readings }) => {
      jest.setSystemTime(new Date(launch));
      setSequence(STANDARD, new Date());
      setSequence(EXTRA, new Date());
      const standardSequence = store.get(standardSequenceAtom);
      expect(listDaysHeld(EXTRA)).toEqual(heldBefore);

      // A mounted atom is worked out again the moment its sequence is written, as the day header's is
      subscriptions.push(
        store.sub(standardDisplayDateAtom, () => {}),
        store.sub(extraDisplayDateAtom, () => {})
      );

      const standardSequenceWrites = recordWrites(standardSequenceAtom);
      const extraSequenceWrites = recordWrites(extraSequenceAtom);
      const standardCountdown = recordValues(getCountdownAtom(STANDARD));
      const extraCountdown = recordValues(getCountdownAtom(EXTRA));

      startCountdowns();
      expect([getDisplayDate(STANDARD), getDisplayDate(EXTRA)]).toEqual([listDay, listDay]);

      const end = shiftSeconds(launch, 122);
      jest.advanceTimersByTime(Date.parse(end) - Date.parse(launch));

      expect(standardSequenceWrites).toEqual([]);
      expect(store.get(standardSequenceAtom)).toBe(standardSequence);
      expect(extraSequenceWrites).toEqual(extraWrites);
      expect([getDisplayDate(STANDARD), getDisplayDate(EXTRA)]).toEqual([listDay, listDay]);

      expect(standardCountdown).toEqual(everySecond(launch, end, [['Fajr', fajr]]));
      expect(extraCountdown).toEqual(everySecond(launch, end, extras));
      const readingAt = (values: CountdownStore[], instant: string) =>
        values[(Date.parse(instant) - Date.parse(launch)) / 1000];
      for (const [instant, name, timeLeft] of readings.standardReadings) {
        expect(readingAt(standardCountdown, instant)).toEqual({ timeLeft, name });
      }
      for (const [instant, name, timeLeft] of readings.extrasReadings) {
        expect(readingAt(extraCountdown, instant)).toEqual({ timeLeft, name });
      }

      // Last Third's bar measures from the Midnight just passed, so the refresh must keep that row as it drops the
      // finished list before
      expect(listDaysHeld(EXTRA)).toEqual(heldAfter);
      expect(label(getPrevPrayer(EXTRA))).toBe(extrasPrevious);
    }
  );
});

interface MidSecond {
  night: string;
  /** 1.6 seconds before the Extras Midnight, so the first tick is 0.6 seconds away and the second is the boundary */
  launch: string;
  standard: number[];
  extras: [string, number][];
}

const MID_SECOND: MidSecond[] = [
  {
    night: '17 October',
    launch: '2026-10-16T22:59:58.400Z',
    standard: [21122, 21121, 21120],
    extras: [
      ['Midnight', 2],
      ['Midnight', 1],
      ['Last Third', 7020],
    ],
  },
  {
    night: '18 October',
    launch: '2026-10-17T22:59:58.400Z',
    standard: [21242, 21241, 21240],
    extras: [
      ['Midnight', 2],
      ['Midnight', 1],
      ['Last Third', 7080],
    ],
  },
  {
    night: '19 October',
    launch: '2026-10-18T22:58:58.400Z',
    standard: [21362, 21361, 21360],
    extras: [
      ['Midnight', 2],
      ['Midnight', 1],
      ['Last Third', 7140],
    ],
  },
];

describe('opened part way through a second just before the Extras Midnight', () => {
  it.each(MID_SECOND)(
    '$night: each countdown first reads the second being lived through, and swaps on the boundary tick',
    ({ launch, standard, extras }) => {
      jest.setSystemTime(new Date(launch));
      setSequence(STANDARD, new Date());
      setSequence(EXTRA, new Date());
      const standardCountdown = recordValues(getCountdownAtom(STANDARD));
      const extraCountdown = recordValues(getCountdownAtom(EXTRA));

      startCountdowns();
      jest.advanceTimersByTime(1600);

      expect(standardCountdown).toEqual(standard.map((timeLeft) => ({ timeLeft, name: 'Fajr' })));
      expect(extraCountdown).toEqual(extras.map(([name, timeLeft]) => ({ timeLeft, name })));
    }
  );
});

// =============================================================================
// JUST AFTER 00:00 LONDON, HOWEVER THE APP GOT THERE
// =============================================================================

interface Observation {
  listDay: string | null;
  next: string | null;
  previous: string | null;
  countdown: CountdownStore;
  barAvailable: boolean;
}

const observe = (type: ScheduleType): Observation => ({
  listDay: getDisplayDate(type),
  next: label(getNextPrayer(type)),
  previous: label(getPrevPrayer(type)),
  countdown: store.get(getCountdownAtom(type)),
  barAvailable: store.get(getBarAvailableAtom(type)),
});

interface AfterMidnight {
  night: string;
  /** Two minutes before 00:00 London */
  launch: string;
  /** 00:00:30 London */
  at: string;
  standard: Observation;
  extras: Observation;
}

const AFTER_MIDNIGHT: AfterMidnight[] = [
  {
    night: '17 October',
    launch: '2026-10-16T22:58:00.000Z',
    at: '2026-10-16T23:00:30.000Z',
    standard: {
      listDay: '2026-10-17',
      next: 'Fajr of 2026-10-17 at 2026-10-17T04:52:00.000Z',
      previous: 'Isha of 2026-10-16 at 2026-10-16T18:31:00.000Z',
      countdown: { timeLeft: 21090, name: 'Fajr' },
      barAvailable: true,
    },
    extras: {
      listDay: '2026-10-17',
      next: 'Last Third of 2026-10-17 at 2026-10-17T00:57:00.000Z',
      previous: 'Midnight of 2026-10-17 at 2026-10-16T23:00:00.000Z',
      countdown: { timeLeft: 6990, name: 'Last Third' },
      barAvailable: true,
    },
  },
  {
    night: '18 October',
    launch: '2026-10-17T22:58:00.000Z',
    at: '2026-10-17T23:00:30.000Z',
    standard: {
      listDay: '2026-10-18',
      next: 'Fajr of 2026-10-18 at 2026-10-18T04:54:00.000Z',
      previous: 'Isha of 2026-10-17 at 2026-10-17T18:29:00.000Z',
      countdown: { timeLeft: 21210, name: 'Fajr' },
      barAvailable: true,
    },
    extras: {
      listDay: '2026-10-18',
      next: 'Last Third of 2026-10-18 at 2026-10-18T00:58:00.000Z',
      previous: 'Midnight of 2026-10-18 at 2026-10-17T23:00:00.000Z',
      countdown: { timeLeft: 7050, name: 'Last Third' },
      barAvailable: true,
    },
  },
  {
    night: '19 October',
    launch: '2026-10-18T22:58:00.000Z',
    at: '2026-10-18T23:00:30.000Z',
    standard: {
      listDay: '2026-10-19',
      next: 'Fajr of 2026-10-19 at 2026-10-19T04:55:00.000Z',
      previous: 'Isha of 2026-10-18 at 2026-10-18T18:27:00.000Z',
      countdown: { timeLeft: 21270, name: 'Fajr' },
      barAvailable: true,
    },
    extras: {
      listDay: '2026-10-19',
      next: 'Last Third of 2026-10-19 at 2026-10-19T00:58:00.000Z',
      previous: 'Midnight of 2026-10-19 at 2026-10-18T22:59:00.000Z',
      countdown: { timeLeft: 7050, name: 'Last Third' },
      barAvailable: true,
    },
  },
];

/** How the app reached 00:00:30 London, each ending with what the screen reads first */
const ARRIVALS: { arrival: string; arrive: (night: AfterMidnight) => void }[] = [
  {
    arrival: 'left open across 00:00',
    arrive: ({ launch, at }) => {
      openAt(launch);
      jest.advanceTimersByTime(Date.parse(at) - Date.parse(launch));
    },
  },
  {
    arrival: 'launched cold',
    arrive: ({ at }) => openAt(at),
  },
  {
    // Suspended since two hours before, so the Extras Midnight passed while nothing ran
    arrival: 'brought back to the foreground',
    arrive: ({ launch, at }) => {
      openAt(shiftSeconds(launch, -2 * 60 * 60));
      jest.setSystemTime(new Date(at));
      checkOverlayBoundary();
      resyncCountdowns();
    },
  },
];

describe('30 seconds after 00:00 London, each way of arriving shows the same lists, countdowns and bars', () => {
  it.each(AFTER_MIDNIGHT.flatMap((night) => ARRIVALS.map((arrival) => ({ ...night, ...arrival }))))(
    '$night, $arrival',
    (scenario) => {
      scenario.arrive(scenario);

      expect(observe(STANDARD)).toEqual(scenario.standard);
      expect(observe(EXTRA)).toEqual(scenario.extras);

      // The sync that follows every launch and foreground return rebuilds both lists from storage at that moment
      setSequence(STANDARD, new Date());
      setSequence(EXTRA, new Date());
      startCountdowns();

      expect(observe(STANDARD)).toEqual(scenario.standard);
      expect(observe(EXTRA)).toEqual(scenario.extras);
    }
  );
});
