/**
 * Unit tests for hooks/usePrayer.ts
 *
 * Which occurrence a row stands for, the time it shows, and whether its bell can be used. The test tree has
 * no renderer, so Time.tsx and Alert.tsx take those decisions from the pure functions exported here, and
 * the hook itself, which only reads atoms, is called directly with useAtomValue mocked. Rows come from real
 * London 2026 times through the app's own builder (londonDays.ts).
 */

import { resolveDisplayDate } from '@/shared/sequence';
import { AlertType, ScheduleType } from '@/shared/types';

import { getShownAlert, getShownTime, isShownOccurrenceUnavailable, resolveOccurrence, usePrayer } from '../usePrayer';
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

jest.mock('@/stores/ui', () => ({
  englishWidthStandardAtom: 'englishWidthStandardAtom',
  englishWidthExtraAtom: 'englishWidthExtraAtom',
}));

beforeEach(() => {
  mockAtomValues.clear();
  mockAtomValues.set('englishWidthStandardAtom', 88);
  mockAtomValues.set('englishWidthExtraAtom', 99);
});

/** Puts a sequence on screen at a London moment, as the store would */
const show = (type: ScheduleType, firstDay: string, breakage: Breakage, date: string, time: string) => {
  storeLondonDays(breakage);
  const prayers = sequenceFrom(type, firstDay);
  const prefix = type === ScheduleType.Standard ? 'standard' : 'extra';
  mockClock.now = london(date, time);
  mockAtomValues.set(`${prefix}SequenceAtom`, { type, prayers });
  mockAtomValues.set(`${prefix}DisplayDateAtom`, resolveDisplayDate(prayers, mockClock.now));
  return prayers;
};

const FAJR = 0;
const DHUHR = 2;
const ASR = 3;
const MAGRIB = 4;
const ISHA = 5;

// =============================================================================
// WHAT A ROW AND ITS OVERLAY SHOW
// =============================================================================

interface ShownCase {
  scenario: string;
  breakage: Breakage;
  /** London date and time */
  now: [string, string];
  index: number;
  /** The row's own time, and whether it has passed */
  row: [string | null, boolean];
  /** The list day and time of the occurrence the overlay variant gives */
  occurrence: [string, string | null];
  /** Time shown while the overlay has the row selected; null draws --:-- and disables the bell */
  selected: string | null;
  /** Time shown otherwise */
  unselected: string | null;
}

describe('the occurrence a row shows, and its bell (real London 2026 days)', () => {
  it.each<ShownCase>([
    {
      scenario: 'passed unreadable Fajr, next occurrence readable',
      breakage: { '2026-09-11': ['fajr'] },
      now: ['2026-09-11', '10:00'],
      index: FAJR,
      row: [null, true],
      occurrence: ['2026-09-12', '04:56'],
      selected: '04:56',
      unselected: null,
    },
    {
      scenario: 'passed unreadable Fajr, next occurrence unreadable too',
      breakage: { '2026-09-11': ['fajr'], '2026-09-12': ['fajr'] },
      now: ['2026-09-11', '10:00'],
      index: FAJR,
      row: [null, true],
      occurrence: ['2026-09-12', null],
      selected: null,
      unselected: null,
    },
    {
      scenario: 'upcoming unreadable Magrib stands for itself',
      breakage: { '2026-09-11': ['magrib'] },
      now: ['2026-09-11', '15:00'],
      index: MAGRIB,
      row: [null, false],
      occurrence: ['2026-09-11', null],
      selected: null,
      unselected: null,
    },
    {
      scenario: 'passed readable Dhuhr, next occurrence unreadable',
      breakage: { '2026-09-12': ['dhuhr'] },
      now: ['2026-09-11', '14:00'],
      index: DHUHR,
      row: ['13:02', true],
      occurrence: ['2026-09-12', null],
      selected: null,
      unselected: '13:02',
    },
    {
      scenario: 'passed readable Dhuhr, next occurrence readable',
      breakage: {},
      now: ['2026-09-11', '14:00'],
      index: DHUHR,
      row: ['13:02', true],
      occurrence: ['2026-09-12', '13:02'],
      selected: '13:02',
      unselected: '13:02',
    },
    {
      scenario: 'upcoming readable Isha stands for itself',
      breakage: {},
      now: ['2026-09-11', '14:00'],
      index: ISHA,
      row: ['20:42', false],
      occurrence: ['2026-09-11', '20:42'],
      selected: '20:42',
      unselected: '20:42',
    },
    {
      scenario: 'passed Fajr on the last list day in the sequence stands for itself',
      breakage: {},
      now: ['2026-09-12', '14:00'],
      index: FAJR,
      row: ['04:56', true],
      occurrence: ['2026-09-12', '04:56'],
      selected: '04:56',
      unselected: '04:56',
    },
  ])('$scenario', ({ breakage, now, index, row: expectedRow, occurrence, selected, unselected }) => {
    show(ScheduleType.Standard, '2026-09-10', breakage, now[0], now[1]);

    const row = usePrayer(ScheduleType.Standard, index);
    const nextOccurrence = usePrayer(ScheduleType.Standard, index, true);

    expect([row.time, row.isPassed]).toEqual(expectedRow);
    expect([nextOccurrence.date, nextOccurrence.time]).toEqual(occurrence);
    // The overlay variant keeps the row's own status, not the occurrence's
    expect([nextOccurrence.isPassed, nextOccurrence.isNext]).toEqual([row.isPassed, row.isNext]);

    expect(getShownTime(true, row, nextOccurrence)).toBe(selected);
    expect(getShownTime(false, row, nextOccurrence)).toBe(unselected);
    expect(isShownOccurrenceUnavailable(true, row, nextOccurrence)).toBe(selected === null);
    expect(isShownOccurrenceUnavailable(false, row, nextOccurrence)).toBe(unselected === null);
  });

  it.each([
    ['Fajr', FAJR],
    ['Dhuhr', DHUHR],
    ['Isha', ISHA],
  ])('on a list with no readable row, %s opens its readable next occurrence when selected', (english, index) => {
    show(ScheduleType.Standard, '2026-09-10', { '2026-09-11': 'not stored' }, '2026-09-11', '09:00');

    const row = usePrayer(ScheduleType.Standard, index);
    const nextOccurrence = usePrayer(ScheduleType.Standard, index, true);

    expect([row.english, row.date, row.time, row.isPassed, row.isNext]).toEqual([
      english,
      '2026-09-11',
      null,
      true,
      false,
    ]);
    expect(nextOccurrence.date).toBe('2026-09-12');
    expect(isShownOccurrenceUnavailable(false, row, nextOccurrence)).toBe(true);
    expect(isShownOccurrenceUnavailable(true, row, nextOccurrence)).toBe(false);
  });
});

describe('getShownAlert', () => {
  it.each([
    ['Off', AlertType.Off],
    ['Silent', AlertType.Silent],
    ['Sound', AlertType.Sound],
  ])('draws a saved %s as Off only while the occurrence on screen has no readable time', (_, saved) => {
    expect(getShownAlert(true, saved)).toBe(AlertType.Off);
    expect(getShownAlert(false, saved)).toBe(saved);
  });
});

// =============================================================================
// RESOLVE OCCURRENCE
// =============================================================================

describe('resolveOccurrence', () => {
  it('leaves a row that has not passed, or is not for the overlay, as itself', () => {
    const prayers = show(ScheduleType.Standard, '2026-09-10', {}, '2026-09-11', '14:00');
    const dhuhr = prayers[6 + DHUHR];

    expect(resolveOccurrence(prayers, dhuhr, false, true)).toBe(dhuhr);
    expect(resolveOccurrence(prayers, dhuhr, true, false)).toBe(dhuhr);
    expect(resolveOccurrence(prayers, dhuhr, false, false)).toBe(dhuhr);
  });

  it('takes a passed row for the overlay to the same prayer on the next list day, readable or not', () => {
    const prayers = show(ScheduleType.Standard, '2026-09-10', { '2026-09-12': ['dhuhr'] }, '2026-09-11', '14:00');

    expect(resolveOccurrence(prayers, prayers[6 + DHUHR], true, true)).toBe(prayers[12 + DHUHR]);
    expect(prayers[12 + DHUHR]).toMatchObject({ english: 'Dhuhr', belongsToDate: '2026-09-12', time: null });
  });
});

// =============================================================================
// THE HOOK'S OTHER STATES
// =============================================================================

describe('usePrayer', () => {
  it('goes from dim to bright as an unreadable row passes', () => {
    show(ScheduleType.Standard, '2026-09-10', { '2026-09-11': ['asr'] }, '2026-09-11', '12:00');
    expect(usePrayer(ScheduleType.Standard, ASR).ui.initialColorPos).toBe(0);

    show(ScheduleType.Standard, '2026-09-10', { '2026-09-11': ['asr'] }, '2026-09-11', '14:00');
    expect(usePrayer(ScheduleType.Standard, ASR).ui.initialColorPos).toBe(1);
  });

  it('is bright when passed or next and dim when upcoming', () => {
    show(ScheduleType.Standard, '2026-09-10', {}, '2026-09-11', '14:00');

    expect([DHUHR, ASR, MAGRIB].map((index) => usePrayer(ScheduleType.Standard, index).ui)).toEqual([
      { initialColorPos: 1, maxEnglishWidth: 88 },
      { initialColorPos: 1, maxEnglishWidth: 88 },
      { initialColorPos: 0, maxEnglishWidth: 88 },
    ]);
  });

  it('returns an empty row while loading, which draws no dashes and leaves the bell usable', () => {
    mockAtomValues.set('standardSequenceAtom', null);
    mockAtomValues.set('standardDisplayDateAtom', null);

    const row = usePrayer(ScheduleType.Standard, FAJR);
    const nextOccurrence = usePrayer(ScheduleType.Standard, FAJR, true);

    expect(row).toEqual({
      english: '',
      arabic: '',
      time: '',
      date: '',
      index: 0,
      type: ScheduleType.Standard,
      isStandard: true,
      isPassed: false,
      isNext: false,
      isOverlay: false,
      ui: { initialColorPos: 0, maxEnglishWidth: 88 },
    });
    expect(getShownTime(true, row, nextOccurrence)).toBe('');
    expect(isShownOccurrenceUnavailable(true, row, nextOccurrence)).toBe(false);
  });

  it('defaults to the first row on the list, not for the overlay', () => {
    show(ScheduleType.Standard, '2026-09-10', { '2026-09-11': ['fajr'] }, '2026-09-11', '10:00');

    expect(usePrayer(ScheduleType.Standard)).toMatchObject({
      english: 'Fajr',
      date: '2026-09-11',
      time: null,
      isOverlay: false,
    });
  });

  it('returns the empty row for an index beyond the list on screen', () => {
    show(ScheduleType.Standard, '2026-09-10', {}, '2026-09-11', '14:00');

    expect(usePrayer(ScheduleType.Standard, 6, true)).toMatchObject({ english: '', time: '', isOverlay: true });
  });

  it('reads the Extras width and marks the row as not Standard', () => {
    show(ScheduleType.Extra, '2026-09-11', {}, '2026-09-11', '12:00');

    expect(usePrayer(ScheduleType.Extra, 4)).toMatchObject({
      english: 'Istijaba',
      time: '18:28',
      date: '2026-09-11',
      isStandard: false,
      isNext: true,
      ui: { initialColorPos: 1, maxEnglishWidth: 99 },
    });
  });
});
