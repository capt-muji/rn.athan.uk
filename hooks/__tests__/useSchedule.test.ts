/**
 * Unit tests for hooks/useSchedule.ts
 *
 * The displayed list, the date-roll cascade condition and the active pill's opacity are exported as pure
 * functions, since the test tree has no renderer; the hook, which only reads atoms, is called directly with
 * useAtomValue mocked. Rows come from real London 2026 times through the app's own builder (londonDays.ts).
 */

import { canonicalDisplayOrder } from '@/shared/prayer';
import { resolveDisplayDate } from '@/shared/sequence';
import { ScheduleType } from '@/shared/types';

import { computePrayerStatuses } from '../usePrayerSequence';
import { computeScheduleView, getPillOpacity, getPillRow, isCascadeRow, useSchedule } from '../useSchedule';
import { type Breakage, london, sequenceFrom, storeLondonDays } from './londonDays';

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

/** The list on screen at a London moment, as the rows see it */
const viewAt = (type: ScheduleType, firstDay: string, breakage: Breakage, date: string, time: string) => {
  storeLondonDays(breakage);
  const prayers = sequenceFrom(type, firstDay);
  const now = london(date, time);

  return computeScheduleView(computePrayerStatuses(prayers, now).prayers, resolveDisplayDate(prayers, now));
};

/** The cascade condition before unreadable rows existed */
const oldCascadeCondition = (nextPrayerIndex: number, index: number) => nextPrayerIndex === 0 && index !== 0;

// =============================================================================
// THE DISPLAYED LIST
// =============================================================================

describe('computeScheduleView', () => {
  it('gives the list on screen with its next row and its first readable row', () => {
    const view = viewAt(ScheduleType.Standard, '2026-09-10', { '2026-09-11': ['fajr'] }, '2026-09-10', '21:00');

    expect(view.prayers.map((row) => `${row.english} ${row.belongsToDate}`)).toEqual([
      'Fajr 2026-09-11',
      'Sunrise 2026-09-11',
      'Dhuhr 2026-09-11',
      'Asr 2026-09-11',
      'Magrib 2026-09-11',
      'Isha 2026-09-11',
    ]);
    expect(view).toMatchObject({ nextPrayerIndex: 1, firstReadableIndex: 1, isLastPrayerPassed: false });
  });

  it('gives a readable list its first row as the first readable one', () => {
    const view = viewAt(ScheduleType.Standard, '2026-09-10', {}, '2026-09-11', '14:00');

    expect(view).toMatchObject({ nextPrayerIndex: 3, firstReadableIndex: 0, isLastPrayerPassed: false });
  });

  it('gives a list with no readable row no next row, no readable row, and every row passed', () => {
    const view = viewAt(ScheduleType.Standard, '2026-09-10', { '2026-09-11': 'not stored' }, '2026-09-11', '09:00');

    expect(view.prayers).toHaveLength(6);
    expect(view).toMatchObject({ nextPrayerIndex: -1, firstReadableIndex: -1, isLastPrayerPassed: true });
  });

  it('gives the list before such a day, after its Isha, no next row and every row passed', () => {
    const view = viewAt(ScheduleType.Standard, '2026-09-10', { '2026-09-11': 'not stored' }, '2026-09-10', '21:00');

    expect(view.prayers).toHaveLength(6);
    expect(view).toMatchObject({ nextPrayerIndex: -1, firstReadableIndex: 0, isLastPrayerPassed: true });
  });
});

// =============================================================================
// DATE-ROLL CASCADE
// =============================================================================

describe('isCascadeRow', () => {
  // [type, first sequence day, moments putting each row of the list in turn next]
  it.each<[ScheduleType, string, [string, string][]]>([
    [
      ScheduleType.Standard,
      '2026-09-10',
      [
        ['2026-09-10', '21:00'],
        ['2026-09-11', '05:00'],
        ['2026-09-11', '07:00'],
        ['2026-09-11', '14:00'],
        ['2026-09-11', '17:00'],
        ['2026-09-11', '20:00'],
      ],
    ],
    [
      ScheduleType.Extra,
      '2026-09-11',
      [
        ['2026-09-10', '21:00'],
        ['2026-09-11', '01:00'],
        ['2026-09-11', '03:00'],
        ['2026-09-11', '05:00'],
        ['2026-09-11', '12:00'],
      ],
    ],
  ])('%s: on a fully readable list it is the old condition at every next index', (type, firstDay, moments) => {
    const nextIndices: number[] = [];

    for (const [date, time] of moments) {
      const view = viewAt(type, firstDay, {}, date, time);
      nextIndices.push(view.nextPrayerIndex);

      expect(view.firstReadableIndex).toBe(0);
      view.prayers.forEach((_, index) => {
        expect(isCascadeRow(view, index)).toBe(oldCascadeCondition(view.nextPrayerIndex, index));
      });
    }

    expect(nextIndices).toEqual(moments.map((_, index) => index));
  });

  // [scenario, type, first sequence day, breakage, now, whether each row cascades]
  it.each<[string, ScheduleType, string, Breakage, [string, string], boolean[]]>([
    [
      'unreadable Fajr with Sunrise next: every row but Sunrise',
      ScheduleType.Standard,
      '2026-09-10',
      { '2026-09-11': ['fajr'] },
      ['2026-09-10', '21:00'],
      [true, false, true, true, true, true],
    ],
    [
      'unreadable Fajr and Sunrise with Dhuhr next: every row but Dhuhr',
      ScheduleType.Standard,
      '2026-09-10',
      { '2026-09-11': ['fajr', 'sunrise'] },
      ['2026-09-10', '21:00'],
      [true, true, false, true, true, true],
    ],
    [
      'unreadable Fajr once Sunrise has passed: no row',
      ScheduleType.Standard,
      '2026-09-10',
      { '2026-09-11': ['fajr'] },
      ['2026-09-11', '07:00'],
      [false, false, false, false, false, false],
    ],
    [
      'Extras night rows unreadable with Suhoor next: every row but Suhoor',
      ScheduleType.Extra,
      '2026-09-11',
      { '2026-09-10': ['magrib'] },
      ['2026-09-10', '21:00'],
      [true, true, false, true, true],
    ],
    [
      'a list with no readable row: no row',
      ScheduleType.Standard,
      '2026-09-10',
      { '2026-09-11': 'not stored' },
      ['2026-09-10', '21:00'],
      [false, false, false, false, false, false],
    ],
  ])('%s', (_scenario, type, firstDay, breakage, [date, time], expected) => {
    const view = viewAt(type, firstDay, breakage, date, time);

    expect(view.prayers.map((_, index) => isCascadeRow(view, index))).toEqual(expected);
  });

  it('never cascades with no row next, even when the list has no readable row either', () => {
    expect(isCascadeRow({ nextPrayerIndex: -1, firstReadableIndex: -1 }, 0)).toBe(false);
    expect(isCascadeRow({ nextPrayerIndex: -1, firstReadableIndex: 0 }, 1)).toBe(false);
  });
});

// =============================================================================
// ACTIVE PILL
// =============================================================================

describe('getPillOpacity', () => {
  // [next index on the displayed list, hidden by the overlay, opacity]
  it.each([
    [0, false, 1],
    [5, false, 1],
    [-1, false, 0],
    [2, true, 0],
    [-1, true, 0],
  ])('next %i, hidden by the overlay %s: %i', (nextPrayerIndex, isHiddenByOverlay, opacity) => {
    expect(getPillOpacity(nextPrayerIndex, isHiddenByOverlay)).toBe(opacity);
  });

  // [scenario, breakage, now, opacity]
  it.each<[string, Breakage, [string, string], number]>([
    ['a readable list', {}, ['2026-09-11', '14:00'], 1],
    ['unreadable Magrib, with Isha next', { '2026-09-11': ['magrib'] }, ['2026-09-11', '17:00'], 1],
    [
      'unreadable Isha after Magrib: the list has moved on, Fajr next',
      { '2026-09-11': ['isha'] },
      ['2026-09-11', '20:00'],
      1,
    ],
    ['a list with no readable row', { '2026-09-11': 'not stored' }, ['2026-09-10', '21:00'], 0],
  ])('on %s it is %i', (_scenario, breakage, [date, time], opacity) => {
    const view = viewAt(ScheduleType.Standard, '2026-09-10', breakage, date, time);

    expect(getPillOpacity(view.nextPrayerIndex, false)).toBe(opacity);
  });
});

// =============================================================================
// THE HOOK
// =============================================================================

describe('useSchedule', () => {
  it('gives the Standard list on screen, with what the cascade needs', () => {
    storeLondonDays({ '2026-09-11': ['fajr'] });
    const prayers = sequenceFrom(ScheduleType.Standard, '2026-09-10');
    mockClock.now = london('2026-09-10', '21:00');
    mockAtomValues.set('standardSequenceAtom', { type: ScheduleType.Standard, prayers });
    mockAtomValues.set('standardDisplayDateAtom', '2026-09-11');

    const schedule = useSchedule(ScheduleType.Standard);

    expect(schedule.prayers.map((row) => row.english)).toEqual(['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Magrib', 'Isha']);
    expect(schedule).toMatchObject({
      displayDate: '2026-09-11',
      nextPrayerIndex: 1,
      firstReadableIndex: 1,
      isStandard: true,
      isLastPrayerPassed: false,
      isReady: true,
    });
  });

  it('gives the Extras list on screen', () => {
    storeLondonDays({ '2026-09-10': ['magrib'] });
    const prayers = sequenceFrom(ScheduleType.Extra, '2026-09-11');
    mockClock.now = london('2026-09-10', '21:00');
    mockAtomValues.set('extraSequenceAtom', { type: ScheduleType.Extra, prayers });
    mockAtomValues.set('extraDisplayDateAtom', '2026-09-11');

    expect(useSchedule(ScheduleType.Extra)).toMatchObject({
      displayDate: '2026-09-11',
      nextPrayerIndex: 2,
      firstReadableIndex: 2,
      isStandard: false,
      isLastPrayerPassed: false,
      isReady: true,
    });
  });

  it('is not ready and has no rows before the sequence exists', () => {
    mockAtomValues.set('standardSequenceAtom', null);
    mockAtomValues.set('standardDisplayDateAtom', null);

    expect(useSchedule(ScheduleType.Standard)).toEqual({
      prayers: [],
      displayDate: null,
      nextPrayerIndex: -1,
      firstReadableIndex: -1,
      isStandard: true,
      isLastPrayerPassed: true,
      isReady: false,
    });
  });
});

// =============================================================================
// THE PILL'S ROW
// =============================================================================

describe('getPillRow', () => {
  // [next row as drawn, row held from the last commit, the pill's row]
  it.each([
    [4, 1, 4],
    [0, 5, 0],
    [3, 3, 3],
    [-1, 5, 5],
    [-1, 0, 0],
  ])('next row %i, held row %i: %i', (nextVisualRow, heldRow, row) => {
    expect(getPillRow(nextVisualRow, heldRow)).toBe(row);
  });

  // [scenario, type, first day, breakage, screens in turn, the pill's row and opacity on each]
  it.each<[string, ScheduleType, string, Breakage, [string, string][], [number, number][]]>([
    [
      'Standard: Isha next, then a day missing from the store until 00:00, then Fajr next',
      ScheduleType.Standard,
      '2026-09-10',
      { '2026-09-11': 'not stored' },
      [
        ['2026-09-10', '20:00'],
        ['2026-09-10', '21:00'],
        ['2026-09-11', '12:00'],
        ['2026-09-11', '23:59'],
        ['2026-09-12', '00:30'],
      ],
      [
        [5, 1],
        [5, 0],
        [5, 0],
        [5, 0],
        [0, 1],
      ],
    ],
    [
      'Extras: Duha next, then a day missing from the store until 00:00, then Suhoor next',
      ScheduleType.Extra,
      '2026-09-10',
      { '2026-09-11': 'not stored' },
      [
        ['2026-09-10', '05:00'],
        ['2026-09-10', '12:00'],
        ['2026-09-11', '23:59'],
        ['2026-09-12', '00:30'],
      ],
      [
        [3, 1],
        [3, 0],
        [3, 0],
        [2, 1],
      ],
    ],
    [
      'Standard: every day readable, the pill moves only with next',
      ScheduleType.Standard,
      '2026-09-10',
      {},
      [
        ['2026-09-11', '14:00'],
        ['2026-09-11', '17:00'],
        ['2026-09-11', '21:00'],
      ],
      [
        [3, 1],
        [4, 1],
        [0, 1],
      ],
    ],
  ])('%s', (_scenario, type, firstDay, breakage, moments, expected) => {
    // Folded the way ActiveBackground holds its row from one commit to the next
    let heldRow = 0;
    const screens = moments.map(([date, time]) => {
      const view = viewAt(type, firstDay, breakage, date, time);
      heldRow = getPillRow(canonicalDisplayOrder(view.prayers, type).indexOf(view.nextPrayerIndex), heldRow);
      return [heldRow, getPillOpacity(view.nextPrayerIndex, false)];
    });

    expect(screens).toEqual(expected);
  });
});
