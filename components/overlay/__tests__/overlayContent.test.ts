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
import { EXTRA_PRAYER_IDS, type PrayerId, STANDARD_PRAYER_IDS } from '@/shared/constants';
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

/** The ids of an Extras list's rows top to bottom, from the owner's order in the constants, not from the code under test */
const drawnIds = (rows: Prayer[]): PrayerId[] => EXTRA_PRAYER_IDS.filter((id) => rows.some((row) => row.id === id));

/** Text each Extras prayer's box must carry: id, the label the box shows, the explanation */
const EXPLAINED: [PrayerId, string, string][] = [
  ['midnight', 'Midnight', 'Halfway between Magrib and Fajr'],
  ['last third', 'Last Third', 'Start of the last third of the night'],
  ['suhoor', 'Suhoor', '20 mins before Fajr'],
  ['duha', 'Duha', '20 mins after Sunrise'],
  ['istijaba', 'Istijaba', '1 hour before Magrib (Fridays only)'],
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
        const ids = drawnIds(rows);

        const sitsOn = rows.map((_, index) => getOverlayRow(prayers, displayDate, ScheduleType.Extra, index));

        expect([orderName, sitsOn]).toEqual([orderName, rows.map((row) => ids.indexOf(row.id))]);
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
  it.each(EXPLAINED)('%s: the box names it and explains it', (id, label, explanation) => {
    expect(getOverlayExplanation(ScheduleType.Extra, id)).toEqual({
      prayerName: label,
      explanation,
    });
  });

  it.each(STANDARD_PRAYER_IDS)('%s on Standard has no box', (id) => {
    expect(getOverlayExplanation(ScheduleType.Standard, id)).toEqual({
      prayerName: null,
      explanation: null,
    });
  });

  it('gives a row of another list, which is what a still-loading Extras row reports, no explanation text to borrow', () => {
    const { explanation } = getOverlayExplanation(ScheduleType.Extra, 'fajr');

    expect(Boolean(explanation)).toBe(false);
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
      const labelOf = new Map(EXPLAINED.map(([id, label]) => [id, label] as const));
      const explanationOf = new Map(EXPLAINED.map(([id, , explanation]) => [id, explanation] as const));

      for (const [, order] of LIST_ORDERS) {
        const prayers = withListDayOrder(built, listDay, order);
        const rows = prayers.filter((prayer) => prayer.belongsToDate === listDay);
        const ids = drawnIds(rows);

        // List hands each drawn row its index into the day's rows; a tap opens the overlay with that index
        canonicalDisplayOrder(rows, ScheduleType.Extra).forEach((index, drawnRow) => {
          const shown = getOverlayExplanation(ScheduleType.Extra, rows[index].id);

          expect(getOverlayRow(prayers, listDay, ScheduleType.Extra, index)).toBe(drawnRow);
          expect([shown.prayerName, shown.explanation]).toEqual([
            labelOf.get(ids[drawnRow]),
            explanationOf.get(ids[drawnRow]),
          ]);
        });
      }
    }
  );
});
