/**
 * Unit tests for components/prayer/activePill.ts
 *
 * The pill belongs under the row List draws for the next prayer. The next prayer is an index into its day's rows
 * as the sequence holds them, and reading that index as the drawn row is the defect 1.24.4 found here and in the
 * overlay. Rows come from real London 2026 days through the app's own builder (hooks/__tests__/londonDays.ts).
 * The builder lists each day in the owner's order, where the index and the drawn row agree, so Extras lists are
 * also tested gathered in other orders, where they part.
 */

import { type Breakage, london, sequenceFrom, storeLondonDays } from '@/hooks/__tests__/londonDays';
import { computePrayerStatuses } from '@/hooks/usePrayerSequence';
import { EXTRAS_ENGLISH, PRAYERS_ENGLISH } from '@/shared/constants';
import { isReadable, resolveDisplayDate } from '@/shared/sequence';
import { type OverlayStore, type Prayer, ScheduleType } from '@/shared/types';

import { placeActivePill } from '../activePill';

jest.mock('@/stores/database', () => ({ getPrayerByDateString: jest.fn() }));

jest.mock('@/stores/schedule', () => ({
  standardSequenceAtom: 'standardSequenceAtom',
  extraSequenceAtom: 'extraSequenceAtom',
  standardDisplayDateAtom: 'standardDisplayDateAtom',
  extraDisplayDateAtom: 'extraDisplayDateAtom',
}));

const DAYS = ['2026-09-10', '2026-09-11', '2026-09-12'];
const HOUR = 3_600_000;
const CLOSED: OverlayStore = { isOn: false, selectedPrayerIndex: 0, scheduleType: ScheduleType.Standard };

type ListOrder = [string, (rows: Prayer[]) => Prayer[]];

const LIST_ORDERS: ListOrder[] = [
  ['as built', (rows) => rows],
  ['reversed', (rows) => [...rows].reverse()],
  ['last row first', (rows) => [rows[rows.length - 1], ...rows.slice(0, -1)]],
];

/** The sequence with every list day's rows in another order */
const gatheredIn = (prayers: Prayer[], order: ListOrder[1]): Prayer[] =>
  DAYS.flatMap((date) => order(prayers.filter((prayer) => prayer.belongsToDate === date)));

/** The names of a list's rows top to bottom, from the owner's order in the constants, not from the code under test */
const drawnNames = (type: ScheduleType, rows: Prayer[]): string[] => {
  const names = type === ScheduleType.Standard ? PRAYERS_ENGLISH : EXTRAS_ENGLISH;
  return names.filter((name) => rows.some((row) => row.english === name));
};

/** Each readable row's instant and a millisecond either side, and every three hours, in time order */
const momentsAcross = (prayers: Prayer[]): Date[] => {
  const moments = prayers
    .filter(isReadable)
    .flatMap((row) => [-1, 0, 1].map((offset) => row.datetime.getTime() + offset));
  for (
    let moment = london(DAYS[0], '00:00').getTime();
    moment <= london(DAYS[2], '23:00').getTime();
    moment += 3 * HOUR
  ) {
    moments.push(moment);
  }
  return moments.sort((a, b) => a - b).map((moment) => new Date(moment));
};

/** The page at a London moment, as ActiveBackground receives it */
const pageAt = (type: ScheduleType, breakage: Breakage, [date, time]: [string, string], order: ListOrder[1]) => {
  storeLondonDays(breakage);
  const prayers = gatheredIn(sequenceFrom(type, DAYS[0]), order);
  const now = london(date, time);
  return { prayers: computePrayerStatuses(prayers, now).prayers, displayDate: resolveDisplayDate(prayers, now) };
};

// =============================================================================
// THE ROW, THROUGH EVERY MOMENT
// =============================================================================

describe('placeActivePill across three real London days', () => {
  // [scenario, type, breakage, orders]
  it.each<[string, ScheduleType, Breakage, ListOrder[]]>([
    ['Standard, every time readable', ScheduleType.Standard, {}, LIST_ORDERS.slice(0, 1)],
    ['Standard, unreadable Magrib', ScheduleType.Standard, { '2026-09-11': ['magrib'] }, LIST_ORDERS.slice(0, 1)],
    [
      'Standard, a day missing from the store',
      ScheduleType.Standard,
      { '2026-09-11': 'not stored' },
      LIST_ORDERS.slice(0, 1),
    ],
    ['Extras, every stored time readable', ScheduleType.Extra, {}, LIST_ORDERS],
    [
      "Extras, night rows unreadable from the day before's Magrib",
      ScheduleType.Extra,
      { '2026-09-10': ['magrib'] },
      LIST_ORDERS,
    ],
    ['Extras, unreadable Sunrise', ScheduleType.Extra, { '2026-09-11': ['sunrise'] }, LIST_ORDERS],
    ['Extras, a day missing from the store', ScheduleType.Extra, { '2026-09-11': 'not stored' }, LIST_ORDERS],
  ])(
    '%s: under the row drawn for the next prayer while there is one, otherwise faded on the row it was on',
    (_scenario, type, breakage, orders) => {
      storeLondonDays(breakage);
      const built = sequenceFrom(type, DAYS[0]);

      for (const [orderName, order] of orders) {
        const prayers = gatheredIn(built, order);
        let heldRow = 0;
        let expectedHeld = 0;
        let fadedMoments = 0;
        let partedMoments = 0;
        const moments = momentsAcross(prayers);

        for (const now of moments) {
          const statuses = computePrayerStatuses(prayers, now).prayers;
          const displayDate = resolveDisplayDate(prayers, now);
          const rows = statuses.filter((row) => row.belongsToDate === displayDate);
          const next = rows.find((row) => row.isNext);

          const pill = placeActivePill(statuses, displayDate, type, CLOSED, heldRow);

          const expected = next
            ? { row: drawnNames(type, rows).indexOf(next.english), opacity: 1 }
            : { row: expectedHeld, opacity: 0 };
          expect([orderName, now.toISOString(), pill]).toEqual([orderName, now.toISOString(), expected]);

          if (!next) fadedMoments++;
          if (next && expected.row !== rows.indexOf(next)) partedMoments++;
          heldRow = pill.row;
          expectedHeld = expected.row;
        }

        // The sweep must reach both states, and on a reordered list a next row whose index is not its drawn row
        expect(fadedMoments).toBeGreaterThan(0);
        expect(fadedMoments).toBeLessThan(moments.length);
        if (orderName !== 'as built') expect(partedMoments).toBeGreaterThan(0);
      }
    }
  );

  it('fades the pill with nothing next after the last row in the sequence, keeping its row', () => {
    const { prayers, displayDate } = pageAt(ScheduleType.Standard, {}, ['2026-09-12', '22:00'], (rows) => rows);

    expect(displayDate).toBeNull();
    expect(placeActivePill(prayers, displayDate, ScheduleType.Standard, CLOSED, 5)).toEqual({ row: 5, opacity: 0 });
  });

  it("takes the next row from the list day on screen: Friday's Isha, not the sequence's first Isha", () => {
    const { prayers, displayDate } = pageAt(ScheduleType.Standard, {}, ['2026-09-11', '20:00'], (rows) => rows);

    expect(displayDate).toBe('2026-09-11');
    expect(placeActivePill(prayers, displayDate, ScheduleType.Standard, CLOSED, 0)).toEqual({ row: 5, opacity: 1 });
  });
});

// =============================================================================
// THE PILL AND THE OVERLAY
// =============================================================================

describe('placeActivePill with the overlay', () => {
  const extras = (isOn: boolean, selectedPrayerIndex: number): OverlayStore => ({
    isOn,
    selectedPrayerIndex,
    scheduleType: ScheduleType.Extra,
  });
  const standard = (isOn: boolean, selectedPrayerIndex: number): OverlayStore => ({
    isOn,
    selectedPrayerIndex,
    scheduleType: ScheduleType.Standard,
  });

  // Friday 11 September 2026 at 12:00 on the Extras page: Istijaba is next and drawn last. As built it is index 4
  // of the day's rows; reversed it is index 0 and Midnight is index 4.
  // [scenario, opacity, list order, overlay]
  it.each<[string, number, ListOrder, OverlayStore]>([
    ['closed, holding the selection it last had', 1, LIST_ORDERS[0], extras(false, 2)],
    ['open on Istijaba, the next prayer', 1, LIST_ORDERS[0], extras(true, 4)],
    ['open on Suhoor', 0, LIST_ORDERS[0], extras(true, 2)],
    ['open on the Standard page', 1, LIST_ORDERS[0], standard(true, 2)],
    ['reversed list, open on Istijaba, index 0', 1, LIST_ORDERS[1], extras(true, 0)],
    ['reversed list, open on Midnight, index 4', 0, LIST_ORDERS[1], extras(true, 4)],
  ])('%s: the pill stays on Istijaba at opacity %i', (_scenario, opacity, [, order], overlay) => {
    const { prayers, displayDate } = pageAt(ScheduleType.Extra, {}, ['2026-09-11', '12:00'], order);

    expect(placeActivePill(prayers, displayDate, ScheduleType.Extra, overlay, 0)).toEqual({ row: 4, opacity });
  });

  it.each([
    ['closed', extras(false, 0)],
    ['open on its first row', extras(true, 0)],
  ])('a list with no next row stays faded on its held row with the overlay %s', (_scenario, overlay) => {
    const { prayers, displayDate } = pageAt(
      ScheduleType.Extra,
      { '2026-09-11': 'not stored' },
      ['2026-09-11', '09:00'],
      (rows) => rows
    );

    expect(displayDate).toBe('2026-09-11');
    expect(placeActivePill(prayers, displayDate, ScheduleType.Extra, overlay, 3)).toEqual({ row: 3, opacity: 0 });
  });
});
