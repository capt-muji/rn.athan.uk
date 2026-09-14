/**
 * Unit tests for components/day/shownDate.ts
 *
 * The date on each page's header: the list day on screen, or, while the overlay highlights a prayer on that page,
 * the day of the occurrence the overlay shows, which for a passed row is the next day it falls on. The occurrence
 * comes from usePrayer with isOverlay, as Day takes it, called directly with useAtomValue mocked. Rows come from
 * real London 2026 days through the app's own builder (hooks/__tests__/londonDays.ts).
 */

import { type Breakage, london, sequenceFrom, storeLondonDays } from '@/hooks/__tests__/londonDays';
import { usePrayer } from '@/hooks/usePrayer';
import { resolveDisplayDate } from '@/shared/sequence';
import { ScheduleType } from '@/shared/types';

import { formatShownDate, getShownDateSource } from '../shownDate';

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

/**
 * The header text, wired as Day wires it
 *
 * @param overlayIndex The highlighted row's index on this page, or null while the overlay highlights nothing here,
 *   when Day's selected index atom reads 0
 */
const headerText = (
  type: ScheduleType,
  displayDate: string | null,
  overlayIndex: number | null,
  hijriEnabled: boolean
): string => {
  const OverlayPrayer = usePrayer(type, overlayIndex ?? 0, true);
  const dateSource = getShownDateSource(overlayIndex !== null, OverlayPrayer.date, displayDate);
  return formatShownDate(dateSource, hijriEnabled);
};

const FAJR = 0;
const ISHA = 5;
const MIDNIGHT = 0;
const DUHA = 3;
const ISTIJABA = 4;

describe('the date on the header (real London 2026 days)', () => {
  // [scenario, type, breakage, now (London date, time), highlighted row or null, Hijri, text]
  it.each<[string, ScheduleType, Breakage, [string, string], number | null, boolean, string]>([
    ['Standard, no overlay', ScheduleType.Standard, {}, ['2026-09-11', '14:00'], null, false, 'Fri, 11 Sep 2026'],
    [
      'Standard, overlay on a passed Fajr: the next day it falls on',
      ScheduleType.Standard,
      {},
      ['2026-09-11', '14:00'],
      FAJR,
      false,
      'Sat, 12 Sep 2026',
    ],
    [
      'Standard, overlay on an Isha still to come: its own day',
      ScheduleType.Standard,
      {},
      ['2026-09-11', '14:00'],
      ISHA,
      false,
      'Fri, 11 Sep 2026',
    ],
    ['Standard, no overlay, Hijri', ScheduleType.Standard, {}, ['2026-09-11', '14:00'], null, true, 'Rabiʻ I 29, 1448'],
    [
      'Standard, overlay on a passed Fajr, Hijri',
      ScheduleType.Standard,
      {},
      ['2026-09-11', '14:00'],
      FAJR,
      true,
      'Rabiʻ II 1, 1448',
    ],
    [
      'Standard, overlay on a passed unreadable Fajr whose next one is unreadable too: that next day still',
      ScheduleType.Standard,
      { '2026-09-11': ['fajr'], '2026-09-12': ['fajr'] },
      ['2026-09-11', '10:00'],
      FAJR,
      false,
      'Sat, 12 Sep 2026',
    ],
    [
      'Standard, a day missing from the store, no overlay: that day is still dated',
      ScheduleType.Standard,
      { '2026-09-11': 'not stored' },
      ['2026-09-11', '09:00'],
      null,
      false,
      'Fri, 11 Sep 2026',
    ],
    [
      'Standard, a day missing from the store, overlay on its Fajr: the next day',
      ScheduleType.Standard,
      { '2026-09-11': 'not stored' },
      ['2026-09-11', '09:00'],
      FAJR,
      false,
      'Sat, 12 Sep 2026',
    ],
    [
      'Extras, the evening before a Friday, overlay on Midnight: the Friday it belongs to, not the evening it falls on',
      ScheduleType.Extra,
      {},
      ['2026-09-10', '21:00'],
      MIDNIGHT,
      false,
      'Fri, 11 Sep 2026',
    ],
    [
      'Extras, overlay on a passed Duha: the next day it falls on',
      ScheduleType.Extra,
      {},
      ['2026-09-11', '12:00'],
      DUHA,
      false,
      'Sat, 12 Sep 2026',
    ],
    [
      'Extras, overlay on an Istijaba still to come: its own day',
      ScheduleType.Extra,
      {},
      ['2026-09-11', '12:00'],
      ISTIJABA,
      false,
      'Fri, 11 Sep 2026',
    ],
  ])('%s', (_scenario, type, breakage, now, overlayIndex, hijriEnabled, text) => {
    const displayDate = show(type, breakage, now);

    expect(headerText(type, displayDate, overlayIndex, hijriEnabled)).toBe(text);
  });
});

describe('no date to print', () => {
  it.each([false, true])('prints nothing, and throws nothing, before any list is on screen (Hijri %s)', (hijri) => {
    mockAtomValues.set('standardSequenceAtom', null);
    mockAtomValues.set('standardDisplayDateAtom', null);

    expect(headerText(ScheduleType.Standard, null, null, hijri)).toBe('');
  });

  it.each([false, true])(
    "throws nothing for an overlay left on a Friday's Istijaba once Saturday's list is on screen, a state the close at the boundary never lets happen (Hijri %s)",
    (hijri) => {
      const displayDate = show(ScheduleType.Extra, {}, ['2026-09-11', '20:00']);

      expect(displayDate).toBe('2026-09-12');
      expect(headerText(ScheduleType.Extra, displayDate, ISTIJABA, hijri)).toBe('');
    }
  );
});
