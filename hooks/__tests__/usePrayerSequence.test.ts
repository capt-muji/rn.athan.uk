/**
 * Unit tests for hooks/usePrayerSequence.ts
 *
 * These call the hook's own code. This file used to assert a local copy of the hook (gap map item 25,
 * AUDIT Lead 1), which would have passed with the hook deleted. The test tree has no renderer, so the
 * status rule is exported as computePrayerStatuses, and the hook itself, which only reads atoms, is called
 * directly with useAtomValue mocked.
 *
 * Rows come from real London 2026 times through the app's own builder (londonDays.ts).
 */

import { isReadable, isRowPassed, resolveDisplayDate } from '@/shared/sequence';
import { type Prayer, ScheduleType } from '@/shared/types';

import { computePrayerStatuses, usePrayerSequence } from '../usePrayerSequence';
import { type Breakage, listStatuses, london, sequenceFrom, storeLondonDays } from './londonDays';

// Babel hoists jest.mock above imports: factories may only close over `mock`-prefixed bindings
const mockClock = { now: new Date(0) };
const mockAtomValues = new Map<string, unknown>();

jest.mock('@/stores/database', () => ({ getPrayerByDateString: jest.fn() }));

jest.mock('@/shared/time', () => ({
  ...jest.requireActual<typeof import('@/shared/time')>('@/shared/time'),
  createInstant: (date?: Date | number | string) => (date ? new Date(date) : mockClock.now),
}));

jest.mock('jotai', () => ({ useAtomValue: (atom: string) => mockAtomValues.get(atom) }));

jest.mock('@/stores/schedule', () => ({
  standardSequenceAtom: 'standardSequenceAtom',
  extraSequenceAtom: 'extraSequenceAtom',
  standardDisplayDateAtom: 'standardDisplayDateAtom',
  extraDisplayDateAtom: 'extraDisplayDateAtom',
}));

// The real rules, with isRowPassed watched so a test can see which rows each row is judged against
jest.mock('@/shared/sequence', () => {
  const actual = jest.requireActual<typeof import('@/shared/sequence')>('@/shared/sequence');
  return { ...actual, isRowPassed: jest.fn(actual.isRowPassed) };
});

const { isRowPassed: referenceIsRowPassed } =
  jest.requireActual<typeof import('@/shared/sequence')>('@/shared/sequence');

beforeEach(() => mockAtomValues.clear());

const EVERY_TIME = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'] as const;

// =============================================================================
// ROW STATUS
// =============================================================================

describe('computePrayerStatuses: each row on the list on screen (real London 2026 days)', () => {
  // [scenario, breakage, now (London date, time), list day on screen, rows from the first down]
  it.each<[string, ScheduleType, string, Breakage, [string, string], string, string[]]>([
    [
      'every time readable',
      ScheduleType.Standard,
      '2026-09-10',
      {},
      ['2026-09-11', '14:00'],
      '2026-09-11',
      ['Fajr: passed', 'Sunrise: passed', 'Dhuhr: passed', 'Asr: next', 'Magrib: upcoming', 'Isha: upcoming'],
    ],
    [
      'unreadable Asr before Dhuhr passes: dim',
      ScheduleType.Standard,
      '2026-09-10',
      { '2026-09-11': ['asr'] },
      ['2026-09-11', '12:00'],
      '2026-09-11',
      ['Fajr: passed', 'Sunrise: passed', 'Dhuhr: next', 'Asr: upcoming', 'Magrib: upcoming', 'Isha: upcoming'],
    ],
    [
      'unreadable Asr once Dhuhr passes: passed, and Magrib next',
      ScheduleType.Standard,
      '2026-09-10',
      { '2026-09-11': ['asr'] },
      ['2026-09-11', '14:00'],
      '2026-09-11',
      ['Fajr: passed', 'Sunrise: passed', 'Dhuhr: passed', 'Asr: passed', 'Magrib: next', 'Isha: upcoming'],
    ],
    [
      'unreadable Fajr as its list comes on screen: passed, and Sunrise next',
      ScheduleType.Standard,
      '2026-09-10',
      { '2026-09-11': ['fajr'] },
      ['2026-09-10', '21:00'],
      '2026-09-11',
      ['Fajr: passed', 'Sunrise: next', 'Dhuhr: upcoming', 'Asr: upcoming', 'Magrib: upcoming', 'Isha: upcoming'],
    ],
    [
      'unreadable Fajr before the time it would have had: still passed',
      ScheduleType.Standard,
      '2026-09-10',
      { '2026-09-11': ['fajr'] },
      ['2026-09-11', '04:00'],
      '2026-09-11',
      ['Fajr: passed', 'Sunrise: next', 'Dhuhr: upcoming', 'Asr: upcoming', 'Magrib: upcoming', 'Isha: upcoming'],
    ],
    [
      'unreadable Magrib while Asr is next: dim',
      ScheduleType.Standard,
      '2026-09-10',
      { '2026-09-11': ['magrib'] },
      ['2026-09-11', '15:00'],
      '2026-09-11',
      ['Fajr: passed', 'Sunrise: passed', 'Dhuhr: passed', 'Asr: next', 'Magrib: upcoming', 'Isha: upcoming'],
    ],
    [
      'unreadable Magrib once Asr passes, before its would-be time: passed, and Isha next',
      ScheduleType.Standard,
      '2026-09-10',
      { '2026-09-11': ['magrib'] },
      ['2026-09-11', '17:00'],
      '2026-09-11',
      ['Fajr: passed', 'Sunrise: passed', 'Dhuhr: passed', 'Asr: passed', 'Magrib: passed', 'Isha: next'],
    ],
    [
      'a day missing from the store: every row passed, none next',
      ScheduleType.Standard,
      '2026-09-10',
      { '2026-09-11': 'not stored' },
      ['2026-09-10', '21:00'],
      '2026-09-11',
      ['Fajr: passed', 'Sunrise: passed', 'Dhuhr: passed', 'Asr: passed', 'Magrib: passed', 'Isha: passed'],
    ],
    [
      'a day with every time unreadable: every row passed, none next',
      ScheduleType.Standard,
      '2026-09-10',
      { '2026-09-11': [...EVERY_TIME] },
      ['2026-09-11', '12:00'],
      '2026-09-11',
      ['Fajr: passed', 'Sunrise: passed', 'Dhuhr: passed', 'Asr: passed', 'Magrib: passed', 'Isha: passed'],
    ],
    [
      "Extras night rows unreadable from the day before's Magrib: passed, and Suhoor next",
      ScheduleType.Extra,
      '2026-09-11',
      { '2026-09-10': ['magrib'] },
      ['2026-09-10', '21:00'],
      '2026-09-11',
      ['Midnight: passed', 'Last Third: passed', 'Suhoor: next', 'Duha: upcoming', 'Istijaba: upcoming'],
    ],
    [
      'Extras unreadable Magrib while Duha is next: Istijaba dim',
      ScheduleType.Extra,
      '2026-09-11',
      { '2026-09-11': ['magrib'] },
      ['2026-09-11', '05:00'],
      '2026-09-11',
      ['Midnight: passed', 'Last Third: passed', 'Suhoor: passed', 'Duha: next', 'Istijaba: upcoming'],
    ],
    [
      "Extras after that Duha: the list moves on, and the next night's rows follow the unreadable Magrib",
      ScheduleType.Extra,
      '2026-09-11',
      { '2026-09-11': ['magrib'] },
      ['2026-09-11', '12:00'],
      '2026-09-12',
      ['Midnight: passed', 'Last Third: passed', 'Suhoor: next', 'Duha: upcoming'],
    ],
  ])('%s', (_scenario, type, firstDay, breakage, [date, time], listDay, expected) => {
    storeLondonDays(breakage);
    const prayers = sequenceFrom(type, firstDay);
    const now = london(date, time);

    expect(resolveDisplayDate(prayers, now)).toBe(listDay);
    expect(listStatuses(computePrayerStatuses(prayers, now).prayers, listDay)).toEqual(expected);
  });

  it('marks exactly one row next, and it is never an unreadable row', () => {
    storeLondonDays({ '2026-09-11': ['asr', 'magrib'] });
    const prayers = sequenceFrom(ScheduleType.Standard, '2026-09-10');

    for (const time of ['00:30', '05:00', '12:00', '14:00', '17:00', '20:00']) {
      const next = computePrayerStatuses(prayers, london('2026-09-11', time)).prayers.filter((row) => row.isNext);

      expect(next).toHaveLength(1);
      expect(next[0].time).not.toBeNull();
    }
  });

  it('keeps a readable row neither passed nor next at its exact moment', () => {
    storeLondonDays();
    const prayers = sequenceFrom(ScheduleType.Standard, '2026-09-10');

    expect(listStatuses(computePrayerStatuses(prayers, london('2026-09-11', '13:02')).prayers, '2026-09-11')).toEqual([
      'Fajr: passed',
      'Sunrise: passed',
      'Dhuhr: upcoming',
      'Asr: next',
      'Magrib: upcoming',
      'Isha: upcoming',
    ]);
  });
});

// =============================================================================
// NEXT PRAYER INDEX
// =============================================================================

describe('computePrayerStatuses: nextPrayerIndex', () => {
  it("is next's place in the whole sequence, passing over an unreadable row", () => {
    storeLondonDays({ '2026-09-11': ['asr'] });
    const prayers = sequenceFrom(ScheduleType.Standard, '2026-09-10');

    // 10 September is rows 0 to 5, so 11 September's Dhuhr, Asr and Magrib are 8, 9 and 10
    expect(computePrayerStatuses(prayers, london('2026-09-11', '12:00')).nextPrayerIndex).toBe(8);
    expect(computePrayerStatuses(prayers, london('2026-09-11', '14:00')).nextPrayerIndex).toBe(10);
  });

  it('is the next readable row after a list with none', () => {
    storeLondonDays({ '2026-09-11': 'not stored' });
    const prayers = sequenceFrom(ScheduleType.Standard, '2026-09-10');
    const { prayers: rows, nextPrayerIndex } = computePrayerStatuses(prayers, london('2026-09-10', '21:00'));

    expect(nextPrayerIndex).toBe(12);
    expect([rows[12].english, rows[12].belongsToDate]).toEqual(['Fajr', '2026-09-12']);
  });

  it('is -1 when no readable row is still to come', () => {
    storeLondonDays();
    const prayers = sequenceFrom(ScheduleType.Standard, '2026-09-10');
    const { prayers: rows, nextPrayerIndex } = computePrayerStatuses(prayers, london('2026-09-12', '22:00'));

    expect(nextPrayerIndex).toBe(-1);
    expect(rows.every((row) => row.isPassed && !row.isNext)).toBe(true);
  });

  it('is -1 for a sequence with no readable row at all, every row passed', () => {
    storeLondonDays({ '2026-09-10': 'not stored', '2026-09-11': 'not stored', '2026-09-12': 'not stored' });
    const { prayers: rows, nextPrayerIndex } = computePrayerStatuses(
      sequenceFrom(ScheduleType.Standard, '2026-09-10'),
      london('2026-09-10', '12:00')
    );

    expect(nextPrayerIndex).toBe(-1);
    expect(rows).toHaveLength(18);
    expect(rows.every((row) => row.isPassed && !row.isNext)).toBe(true);
  });

  it('is -1 with no rows', () => {
    expect(computePrayerStatuses([], london('2026-09-10', '12:00'))).toEqual({ prayers: [], nextPrayerIndex: -1 });
  });
});

// =============================================================================
// THE HOOK
// =============================================================================

describe('usePrayerSequence', () => {
  it("reads the Standard atoms and judges every row at the clock's now", () => {
    storeLondonDays({ '2026-09-11': ['asr'] });
    const prayers = sequenceFrom(ScheduleType.Standard, '2026-09-10');
    mockClock.now = london('2026-09-11', '12:00');
    mockAtomValues.set('standardSequenceAtom', { type: ScheduleType.Standard, prayers });
    mockAtomValues.set('standardDisplayDateAtom', '2026-09-11');
    mockAtomValues.set('extraSequenceAtom', null);
    mockAtomValues.set('extraDisplayDateAtom', null);

    const result = usePrayerSequence(ScheduleType.Standard);

    expect(result.isReady).toBe(true);
    expect(result.displayDate).toBe('2026-09-11');
    expect(result.nextPrayerIndex).toBe(8);
    expect(listStatuses(result.prayers, '2026-09-11')).toEqual([
      'Fajr: passed',
      'Sunrise: passed',
      'Dhuhr: next',
      'Asr: upcoming',
      'Magrib: upcoming',
      'Isha: upcoming',
    ]);
  });

  it('reads the Extras atoms', () => {
    storeLondonDays({ '2026-09-10': ['magrib'] });
    const prayers = sequenceFrom(ScheduleType.Extra, '2026-09-11');
    mockClock.now = london('2026-09-10', '21:00');
    mockAtomValues.set('standardSequenceAtom', null);
    mockAtomValues.set('standardDisplayDateAtom', null);
    mockAtomValues.set('extraSequenceAtom', { type: ScheduleType.Extra, prayers });
    mockAtomValues.set('extraDisplayDateAtom', '2026-09-11');

    const result = usePrayerSequence(ScheduleType.Extra);

    expect(result.isReady).toBe(true);
    expect(result.displayDate).toBe('2026-09-11');
    expect(result.nextPrayerIndex).toBe(2);
    expect(listStatuses(result.prayers, '2026-09-11')).toEqual([
      'Midnight: passed',
      'Last Third: passed',
      'Suhoor: next',
      'Duha: upcoming',
      'Istijaba: upcoming',
    ]);
  });

  it('is not ready, with no rows and no next, before the sequence exists', () => {
    mockAtomValues.set('standardSequenceAtom', null);
    mockAtomValues.set('standardDisplayDateAtom', null);

    expect(usePrayerSequence(ScheduleType.Standard)).toEqual({
      prayers: [],
      displayDate: null,
      nextPrayerIndex: -1,
      isReady: false,
    });
  });
});

// =============================================================================
// ONE LIST DAY AT A TIME
// =============================================================================

const HOUR = 3_600_000;

/**
 * Every moment a status can change at, and a spread between: each readable row's instant and a millisecond
 * either side, and every six hours from before the first list day to after the last
 */
const momentsAcross = (prayers: Prayer[]): Date[] => {
  const moments = prayers
    .filter(isReadable)
    .flatMap((row) => [-1, 0, 1].map((offset) => new Date(row.datetime.getTime() + offset)));
  const first = london(prayers[0].belongsToDate, '00:00').getTime() - HOUR;
  const last = london(prayers[prayers.length - 1].belongsToDate, '23:00').getTime() + 3 * HOUR;

  for (let moment = first; moment <= last; moment += 6 * HOUR) moments.push(new Date(moment));
  return moments;
};

describe('computePrayerStatuses: each row judged against its own list day', () => {
  // [scenario, type, first day, list days, breakage, whether an unreadable row is ever still to come (null:
  //  the sequence has no unreadable row)]
  it.each<[string, ScheduleType, string, number, Breakage, boolean | null]>([
    ['Standard, every time readable', ScheduleType.Standard, '2026-09-10', 3, {}, null],
    ['Standard, unreadable Asr', ScheduleType.Standard, '2026-09-10', 3, { '2026-09-11': ['asr'] }, true],
    [
      'Standard, unreadable Fajr and Magrib',
      ScheduleType.Standard,
      '2026-09-10',
      3,
      { '2026-09-11': ['fajr', 'magrib'] },
      true,
    ],
    [
      'Standard, a day with every time unreadable',
      ScheduleType.Standard,
      '2026-09-10',
      3,
      { '2026-09-11': [...EVERY_TIME] },
      false,
    ],
    [
      'Standard, Fajr and Isha unreadable every day',
      ScheduleType.Standard,
      '2026-09-10',
      3,
      { '2026-09-10': ['fajr', 'isha'], '2026-09-11': ['fajr', 'isha'], '2026-09-12': ['fajr', 'isha'] },
      true,
    ],
    [
      'Standard, a day missing from the store',
      ScheduleType.Standard,
      '2026-09-10',
      3,
      { '2026-09-11': 'not stored' },
      false,
    ],
    [
      'Standard, a lost fortnight after the stored days',
      ScheduleType.Standard,
      '2026-09-10',
      17,
      { '2026-09-11': ['asr'] },
      true,
    ],
    ['Standard, a lost fortnight before the stored days', ScheduleType.Standard, '2026-08-27', 17, {}, false],
    ['Extras, every stored time readable', ScheduleType.Extra, '2026-09-11', 3, {}, false],
    [
      "Extras, night rows unreadable from the day before's Magrib",
      ScheduleType.Extra,
      '2026-09-11',
      3,
      { '2026-09-10': ['magrib'] },
      false,
    ],
    [
      'Extras, unreadable Sunrise and Magrib',
      ScheduleType.Extra,
      '2026-09-10',
      3,
      { '2026-09-11': ['sunrise', 'magrib'] },
      true,
    ],
    [
      'Extras, a day missing from the store',
      ScheduleType.Extra,
      '2026-09-10',
      3,
      { '2026-09-11': 'not stored' },
      false,
    ],
    ['Extras, a lost fortnight after the stored days', ScheduleType.Extra, '2026-09-10', 17, {}, false],
    [
      'Extras, a lost fortnight before the stored days',
      ScheduleType.Extra,
      '2026-08-27',
      17,
      { '2026-09-11': ['sunrise'] },
      true,
    ],
  ])(
    '%s: the same statuses as isRowPassed over the whole sequence, at every moment',
    (_scenario, type, firstDay, dayCount, breakage, hasUpcomingUnreadable) => {
      storeLondonDays(breakage);
      const prayers = sequenceFrom(type, firstDay, dayCount);
      const unreadableStates = new Set<boolean>();

      for (const now of momentsAcross(prayers)) {
        const statuses = computePrayerStatuses(prayers, now).prayers;

        expect(statuses.map((row) => row.isPassed)).toEqual(
          prayers.map((row) => referenceIsRowPassed(prayers, row, now))
        );
        for (const row of statuses) if (!isReadable(row)) unreadableStates.add(row.isPassed);
      }

      // The fixture must give the rule something to decide: unreadable rows seen passed, and where the
      // breakage allows it, still to come
      const expectedStates = hasUpcomingUnreadable === null ? [] : hasUpcomingUnreadable ? [false, true] : [true];
      expect(new Set(prayers.map((row) => row.belongsToDate)).size).toBe(dayCount);
      expect([...unreadableStates].sort()).toEqual(expectedStates);
    }
  );

  it("hands isRowPassed only the judged row's own list day, so a lost fortnight costs a day's rows per row", () => {
    storeLondonDays({ '2026-09-11': ['asr'] });
    const prayers = sequenceFrom(ScheduleType.Standard, '2026-09-10', 17);
    const watched = isRowPassed as jest.Mock;
    watched.mockClear();

    computePrayerStatuses(prayers, london('2026-09-11', '12:00'));

    expect(prayers).toHaveLength(102);
    expect(watched).toHaveBeenCalledTimes(102);
    for (const [rows, row] of watched.mock.calls as [Prayer[], Prayer, Date][]) {
      expect(rows).toHaveLength(6);
      expect(rows).toContain(row);
      expect(rows.every((candidate) => candidate.belongsToDate === row.belongsToDate)).toBe(true);
    }
  });
});
