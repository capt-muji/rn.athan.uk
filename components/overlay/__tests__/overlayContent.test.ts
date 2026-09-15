/**
 * Unit tests for components/overlay/overlayContent.ts
 *
 * The overlay's selection is an index into its day's list as the sequence holds it, while List draws Extras rows
 * by name. Reading one as the other put another prayer's explanation in the box, and the box and the
 * tap-through row against another row. Rows come from real London 2026 days through the app's own builder
 * (hooks/__tests__/londonDays.ts). The builder already lists each day in the owner's order, where the index and
 * the drawn row agree, so every list is also tested gathered in other orders, where they part.
 *
 * A Standard list is drawn in the order the sequence holds it, so its row is the selected index whatever this
 * code does, and a Standard row case could not fail; Standard appears only where the explanation is decided.
 */

import { type Breakage, london, sequenceFrom, storeLondonDays } from '@/hooks/__tests__/londonDays';
import { EXTRAS_ENGLISH, PRAYERS_ENGLISH } from '@/shared/constants';
import { canonicalDisplayOrder } from '@/shared/prayer';
import { resolveDisplayDate } from '@/shared/sequence';
import { type Prayer, ScheduleType } from '@/shared/types';

import { getOverlayExplanation, getOverlayRow } from '../overlayContent';

jest.mock('@/stores/database', () => ({ getPrayerByDateString: jest.fn() }));

type ListOrder = [string, (rows: Prayer[]) => Prayer[]];

const LIST_ORDERS: ListOrder[] = [
  ['as built', (rows) => rows],
  ['reversed', (rows) => [...rows].reverse()],
  ['last row first', (rows) => [rows[rows.length - 1], ...rows.slice(0, -1)]],
];

/** The sequence with one list day's rows in another order, every other day as built */
const withListDayOrder = (prayers: Prayer[], date: string, order: ListOrder[1]): Prayer[] => {
  const start = prayers.findIndex((prayer) => prayer.belongsToDate === date);
  const rows = prayers.filter((prayer) => prayer.belongsToDate === date);
  return [...prayers.slice(0, start), ...order(rows), ...prayers.slice(start + rows.length)];
};

/** The names of an Extras list's rows top to bottom, from the owner's order in the constants, not from the code under test */
const drawnNames = (rows: Prayer[]): string[] =>
  EXTRAS_ENGLISH.filter((name) => rows.some((row) => row.english === name));

/** Text each Extras prayer's box must carry */
const EXPLAINED: [string, string, string][] = [
  ['Midnight', 'Halfway between Magrib and Fajr', 'نصف الليل بين المغرب والفجر'],
  ['Last Third', 'Start of the last third of the night', 'عند بداية الثلث الأخير من الليل'],
  ['Suhoor', '20 mins before Fajr', '20 دقيقة قبل الفجر'],
  ['Duha', '20 mins after Sunrise', '20 دقيقة بعد الشروق'],
  ['Istijaba', '1 hour before Magrib (Fridays only)', 'ساعة قبل المغرب (الجمعة فقط)'],
];

// [scenario, first sequence day, breakage, now (London date, time), list day on screen]
const SCENARIOS: [string, string, Breakage, [string, string], string][] = [
  ['a Friday', '2026-09-10', {}, ['2026-09-11', '12:00'], '2026-09-11'],
  [
    "a Friday whose night rows are unreadable from the day before's Magrib",
    '2026-09-10',
    { '2026-09-10': ['magrib'] },
    ['2026-09-10', '21:00'],
    '2026-09-11',
  ],
  ['a Saturday', '2026-09-10', {}, ['2026-09-11', '20:00'], '2026-09-12'],
  ['a day missing from the store', '2026-09-10', { '2026-09-11': 'not stored' }, ['2026-09-11', '09:00'], '2026-09-11'],
];

/** The Extras sequence and the list day on screen at a London moment */
const onScreen = (firstDay: string, breakage: Breakage, [date, time]: [string, string]) => {
  storeLondonDays(breakage);
  const prayers = sequenceFrom(ScheduleType.Extra, firstDay);
  return { prayers, displayDate: resolveDisplayDate(prayers, london(date, time)) };
};

// =============================================================================
// THE ROW
// =============================================================================

describe('getOverlayRow', () => {
  it.each(SCENARIOS)(
    'Extras, %s: each selection sits on the row drawn for its own prayer, in every order the list could be gathered in',
    (_scenario, firstDay, breakage, now, listDay) => {
      const { prayers: built, displayDate } = onScreen(firstDay, breakage, now);
      expect(displayDate).toBe(listDay);

      for (const [orderName, order] of LIST_ORDERS) {
        const prayers = withListDayOrder(built, listDay, order);
        const rows = prayers.filter((prayer) => prayer.belongsToDate === listDay);
        const names = drawnNames(rows);

        const sitsOn = rows.map((_, index) => getOverlayRow(prayers, displayDate, ScheduleType.Extra, index));

        expect([orderName, sitsOn]).toEqual([orderName, rows.map((row) => names.indexOf(row.english))]);
      }
    }
  );

  it('tells the selected index from the drawn row on a reordered list, so the table above can fail', () => {
    const { prayers: built } = onScreen('2026-09-10', {}, ['2026-09-11', '12:00']);
    const prayers = withListDayOrder(built, '2026-09-11', (rows) => [...rows].reverse());

    expect([0, 1, 2, 3, 4].map((index) => getOverlayRow(prayers, '2026-09-11', ScheduleType.Extra, index))).toEqual([
      4, 3, 2, 1, 0,
    ]);
  });

  it("takes the row from the list day on screen: Saturday's Duha, not the sequence's first Duha", () => {
    const { prayers, displayDate } = onScreen('2026-09-10', {}, ['2026-09-11', '20:00']);

    expect(displayDate).toBe('2026-09-12');
    expect(getOverlayRow(prayers, displayDate, ScheduleType.Extra, 3)).toBe(3);
  });

  it("keeps a Friday's Istijaba selection off -1 once the list has moved on to Saturday, which has no such row", () => {
    const { prayers, displayDate } = onScreen('2026-09-11', {}, ['2026-09-11', '20:00']);

    expect(displayDate).toBe('2026-09-12');
    expect(getOverlayRow(prayers, displayDate, ScheduleType.Extra, 4)).toBe(4);
  });

  it('keeps the selected index with no list on screen', () => {
    expect(getOverlayRow([], null, ScheduleType.Standard, 3)).toBe(3);
  });
});

// =============================================================================
// THE EXPLANATION
// =============================================================================

describe('getOverlayExplanation', () => {
  it.each(EXPLAINED)('%s: the box names it and explains it', (english, explanation, explanationArabic) => {
    expect(getOverlayExplanation(ScheduleType.Extra, english)).toEqual({
      prayerName: english,
      explanation,
      explanationArabic,
    });
  });

  it.each(PRAYERS_ENGLISH)('%s on Standard has no box', (english) => {
    expect(getOverlayExplanation(ScheduleType.Standard, english)).toEqual({
      prayerName: null,
      explanation: null,
      explanationArabic: null,
    });
  });

  it('gives a row still loading, whose name is empty, no explanation text to borrow', () => {
    const { explanation, explanationArabic } = getOverlayExplanation(ScheduleType.Extra, '');

    expect([Boolean(explanation), Boolean(explanationArabic)]).toEqual([false, false]);
  });
});

// =============================================================================
// A TAP, AS THE OVERLAY RECEIVES IT
// =============================================================================

describe('a tap on each Extras row', () => {
  it.each(SCENARIOS)(
    '%s, in every order the list could be gathered in: the box sits on the tapped row and explains the prayer drawn there',
    (_scenario, firstDay, breakage, now, listDay) => {
      const { prayers: built } = onScreen(firstDay, breakage, now);
      const explanationOf = new Map(EXPLAINED.map(([english, ...texts]) => [english, texts]));

      for (const [, order] of LIST_ORDERS) {
        const prayers = withListDayOrder(built, listDay, order);
        const rows = prayers.filter((prayer) => prayer.belongsToDate === listDay);
        const names = drawnNames(rows);

        // List hands each drawn row its index into the day's rows; a tap opens the overlay with that index
        canonicalDisplayOrder(rows, ScheduleType.Extra).forEach((index, drawnRow) => {
          const shown = getOverlayExplanation(ScheduleType.Extra, rows[index].english);

          expect(getOverlayRow(prayers, listDay, ScheduleType.Extra, index)).toBe(drawnRow);
          expect([shown.prayerName, shown.explanation, shown.explanationArabic]).toEqual([
            names[drawnRow],
            ...(explanationOf.get(names[drawnRow]) ?? []),
          ]);
        });
      }
    }
  );
});
