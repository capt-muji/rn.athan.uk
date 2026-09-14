/**
 * Unit tests for components/prayer/rowPress.ts
 *
 * A tap on a row closes the overlay on the row it highlights and opens it on any other, and does nothing on a
 * Friday's Istijaba once it has passed, since the sequence holds no later Istijaba for the overlay to show. The
 * rows and whether they have passed come from usePrayer, as Prayer.tsx takes them, called directly with
 * useAtomValue mocked. Rows come from real London 2026 days through the app's own builder
 * (hooks/__tests__/londonDays.ts).
 */

import { type Breakage, london, sequenceFrom, storeLondonDays } from '@/hooks/__tests__/londonDays';
import { usePrayer } from '@/hooks/usePrayer';
import { resolveDisplayDate } from '@/shared/sequence';
import { ScheduleType } from '@/shared/types';

import { getRowPressAction } from '../rowPress';

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

beforeEach(() => mockAtomValues.clear());

/** Puts a sequence from 10 September on screen at a London moment, as the store would; returns the list day */
const show = (type: ScheduleType, breakage: Breakage, [date, time]: [string, string]): string | null => {
  storeLondonDays(breakage);
  const prayers = sequenceFrom(type, '2026-09-10');
  const prefix = type === ScheduleType.Standard ? 'standard' : 'extra';
  mockClock.now = london(date, time);
  const displayDate = resolveDisplayDate(prayers, mockClock.now);
  mockAtomValues.set(`${prefix}SequenceAtom`, { type, prayers });
  mockAtomValues.set(`${prefix}DisplayDateAtom`, displayDate);
  return displayDate;
};

/** What a tap on each row of the list on screen does, top to bottom, with the overlay highlighting that row or not */
const tapsOnList = (type: ScheduleType, rowCount: number, isSelectedForOverlay: boolean) =>
  Array.from({ length: rowCount }, (_, index) => {
    const row = usePrayer(type, index);
    const action = getRowPressAction({
      isStandard: type === ScheduleType.Standard,
      english: row.english,
      isPassed: row.isPassed,
      isSelectedForOverlay,
    });
    return `${row.english}: ${action}`;
  });

describe('a tap on each row (real London 2026 days)', () => {
  // [scenario, type, breakage, now (London date, time), list day on screen, a tap on each row]
  it.each<[string, ScheduleType, Breakage, [string, string], string, string[]]>([
    [
      'Standard on a Friday afternoon, passed rows included',
      ScheduleType.Standard,
      {},
      ['2026-09-11', '14:00'],
      '2026-09-11',
      ['Fajr: open', 'Sunrise: open', 'Dhuhr: open', 'Asr: open', 'Magrib: open', 'Isha: open'],
    ],
    [
      'Standard with an unreadable Fajr that has passed',
      ScheduleType.Standard,
      { '2026-09-11': ['fajr'] },
      ['2026-09-11', '10:00'],
      '2026-09-11',
      ['Fajr: open', 'Sunrise: open', 'Dhuhr: open', 'Asr: open', 'Magrib: open', 'Isha: open'],
    ],
    [
      'Extras on a Friday before its Istijaba',
      ScheduleType.Extra,
      {},
      ['2026-09-11', '12:00'],
      '2026-09-11',
      ['Midnight: open', 'Last Third: open', 'Suhoor: open', 'Duha: open', 'Istijaba: open'],
    ],
    [
      'Extras on a Friday after its Istijaba, held on screen because Saturday is missing from the store',
      ScheduleType.Extra,
      { '2026-09-12': 'not stored' },
      ['2026-09-11', '20:00'],
      '2026-09-11',
      ['Midnight: open', 'Last Third: open', 'Suhoor: open', 'Duha: open', 'Istijaba: none'],
    ],
  ])('%s', (_scenario, type, breakage, now, listDay, taps) => {
    expect(show(type, breakage, now)).toBe(listDay);

    expect(tapsOnList(type, taps.length, false)).toEqual(taps);
  });

  it('closes the overlay on the row it highlights, passed or not, on both pages', () => {
    show(ScheduleType.Standard, {}, ['2026-09-11', '14:00']);
    expect(tapsOnList(ScheduleType.Standard, 6, true)).toEqual([
      'Fajr: close',
      'Sunrise: close',
      'Dhuhr: close',
      'Asr: close',
      'Magrib: close',
      'Isha: close',
    ]);

    show(ScheduleType.Extra, {}, ['2026-09-11', '12:00']);
    expect(tapsOnList(ScheduleType.Extra, 5, true)).toEqual([
      'Midnight: close',
      'Last Third: close',
      'Suhoor: close',
      'Duha: close',
      'Istijaba: close',
    ]);
  });

  it('checks a passed Istijaba before the highlight, so a highlighted one that has passed still does nothing', () => {
    show(ScheduleType.Extra, { '2026-09-12': 'not stored' }, ['2026-09-11', '20:00']);
    const istijaba = usePrayer(ScheduleType.Extra, 4);

    expect(
      getRowPressAction({
        isStandard: false,
        english: istijaba.english,
        isPassed: istijaba.isPassed,
        isSelectedForOverlay: true,
      })
    ).toBe('none');
  });
});
