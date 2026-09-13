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

import { resolveDisplayDate } from '@/shared/sequence';
import { ScheduleType } from '@/shared/types';

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
