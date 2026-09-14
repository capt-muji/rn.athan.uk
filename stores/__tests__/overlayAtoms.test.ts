/**
 * The derived overlay atoms in stores/atoms/overlay.ts
 *
 * They decide which row the open overlay highlights, which rows it veils, and which page's date and pill follow
 * it. The expected value of every atom is worked out here from the overlay's three fields by rule, never by
 * reading one atom to predict another, across both schedules, every row index each list can hold, open and
 * closed, and the overlay sitting on either schedule.
 */

import { createStore } from 'jotai';

import { type OverlayStore, ScheduleType } from '@/shared/types';
import {
  getOverlayActiveForTypeAtom,
  getOverlayHiddenAtom,
  getOverlaySelectedAtom,
  getOverlaySelectedIndexForTypeAtom,
  overlayAtom,
  overlayIsOnAtom,
} from '@/stores/atoms/overlay';

// =============================================================================
// FIXTURES
// =============================================================================

const SCHEDULES = [ScheduleType.Standard, ScheduleType.Extra] as const;

/** Six Standard rows, and five Extras rows on a Friday */
const ROWS: Record<ScheduleType, number[]> = {
  [ScheduleType.Standard]: [0, 1, 2, 3, 4, 5],
  [ScheduleType.Extra]: [0, 1, 2, 3, 4],
};

/** Every overlay state a user can reach: open or closed, on either page, on any row of that page */
const overlayStates: OverlayStore[] = SCHEDULES.flatMap((scheduleType) =>
  ROWS[scheduleType].flatMap((selectedPrayerIndex) =>
    [true, false].map((isOn) => ({ isOn, selectedPrayerIndex, scheduleType }))
  )
);

const describeState = ({ isOn, selectedPrayerIndex, scheduleType }: OverlayStore) =>
  `${isOn ? 'open' : 'closed'} on ${scheduleType} row ${selectedPrayerIndex}`;

const storeWith = (overlay: OverlayStore) => {
  const store = createStore();
  store.set(overlayAtom, overlay);
  return store;
};

// =============================================================================
// VALUES
// =============================================================================

const ownsPage = (overlay: OverlayStore, type: ScheduleType) => overlay.isOn && overlay.scheduleType === type;

/** The overlay states in which a read breaks the rule, so a failure names exactly those */
const statesWhere = (breaksRule: (overlay: OverlayStore) => boolean) =>
  overlayStates.filter(breaksRule).map(describeState);

const same = (a: number[], b: number[]) => a.length === b.length && a.every((value, position) => value === b[position]);

describe('in every overlay state', () => {
  it('covers open and closed on every row of both pages, and reports whether it is open', () => {
    expect(overlayStates).toHaveLength(2 * (ROWS[ScheduleType.Standard].length + ROWS[ScheduleType.Extra].length));
    expect(statesWhere((overlay) => storeWith(overlay).get(overlayIsOnAtom) !== overlay.isOn)).toEqual([]);
  });

  it.each(SCHEDULES)('marks the %s page active exactly while the overlay is open on it', (type) => {
    expect(
      statesWhere((overlay) => storeWith(overlay).get(getOverlayActiveForTypeAtom(type)) !== ownsPage(overlay, type))
    ).toEqual([]);
  });

  it.each(SCHEDULES)(
    'gives the %s page the selected row while the overlay is open on it, and row 0 otherwise',
    (type) => {
      expect(
        statesWhere(
          (overlay) =>
            storeWith(overlay).get(getOverlaySelectedIndexForTypeAtom(type)) !==
            (ownsPage(overlay, type) ? overlay.selectedPrayerIndex : 0)
        )
      ).toEqual([]);
    }
  );

  it.each(SCHEDULES)('highlights only the selected row on the %s page while the overlay is open on it', (type) => {
    expect(
      statesWhere((overlay) => {
        const store = storeWith(overlay);
        const highlighted = ROWS[type].filter((index) => store.get(getOverlaySelectedAtom(type, index)));
        return !same(highlighted, ownsPage(overlay, type) ? [overlay.selectedPrayerIndex] : []);
      })
    ).toEqual([]);
  });

  it.each(SCHEDULES)(
    'veils every other row on the %s page while the overlay is open on it, and none otherwise',
    (type) => {
      expect(
        statesWhere((overlay) => {
          const store = storeWith(overlay);
          const veiled = ROWS[type].filter((index) => store.get(getOverlayHiddenAtom(type, index)));
          const expected = ownsPage(overlay, type)
            ? ROWS[type].filter((index) => index !== overlay.selectedPrayerIndex)
            : [];
          return !same(veiled, expected);
        })
      ).toEqual([]);
    }
  );
});

describe('a row index the open page does not show', () => {
  // The index arrives from the tapped row, so a Thursday Extras list of four can still be asked about row 4
  it('is neither highlighted nor spared the veil when another row is selected', () => {
    const store = storeWith({ isOn: true, selectedPrayerIndex: 1, scheduleType: ScheduleType.Extra });

    expect(store.get(getOverlaySelectedAtom(ScheduleType.Extra, 4))).toBe(false);
    expect(store.get(getOverlayHiddenAtom(ScheduleType.Extra, 4))).toBe(true);
  });
});

// =============================================================================
// FOLLOWING THE OVERLAY AS IT CHANGES
// =============================================================================

describe('as the overlay opens, moves and closes', () => {
  it('follows one store through open, a new selection, a page change and close', () => {
    const store = createStore();
    const selectedAsr = getOverlaySelectedAtom(ScheduleType.Standard, 3);
    const hiddenAsr = getOverlayHiddenAtom(ScheduleType.Standard, 3);
    const standardActive = getOverlayActiveForTypeAtom(ScheduleType.Standard);
    const extraIndex = getOverlaySelectedIndexForTypeAtom(ScheduleType.Extra);

    const read = () => [store.get(selectedAsr), store.get(hiddenAsr), store.get(standardActive), store.get(extraIndex)];

    expect(read()).toEqual([false, false, false, 0]);

    store.set(overlayAtom, { isOn: true, selectedPrayerIndex: 3, scheduleType: ScheduleType.Standard });
    expect(read()).toEqual([true, false, true, 0]);

    store.set(overlayAtom, { isOn: true, selectedPrayerIndex: 4, scheduleType: ScheduleType.Standard });
    expect(read()).toEqual([false, true, true, 0]);

    store.set(overlayAtom, { isOn: true, selectedPrayerIndex: 2, scheduleType: ScheduleType.Extra });
    expect(read()).toEqual([false, false, false, 2]);

    store.set(overlayAtom, { isOn: false, selectedPrayerIndex: 2, scheduleType: ScheduleType.Extra });
    expect(read()).toEqual([false, false, false, 0]);
  });

  it('never notifies the selected row that it is veiled, since that value is false before and after opening', () => {
    const store = createStore();
    const notified = { selected: 0, hidden: 0, otherHidden: 0 };
    const unsubscribes = [
      store.sub(getOverlaySelectedAtom(ScheduleType.Standard, 2), () => (notified.selected += 1)),
      store.sub(getOverlayHiddenAtom(ScheduleType.Standard, 2), () => (notified.hidden += 1)),
      store.sub(getOverlayHiddenAtom(ScheduleType.Standard, 5), () => (notified.otherHidden += 1)),
    ];

    store.set(overlayAtom, { isOn: true, selectedPrayerIndex: 2, scheduleType: ScheduleType.Standard });

    expect(notified).toEqual({ selected: 1, hidden: 0, otherHidden: 1 });
    for (const unsubscribe of unsubscribes) unsubscribe();
  });
});

// =============================================================================
// MODULE-LEVEL CACHING
// =============================================================================

describe('the module-level atom cache', () => {
  const rowKeys = SCHEDULES.flatMap((type) => ROWS[type].map((index) => [type, index] as const));

  it.each([
    ['getOverlaySelectedAtom', getOverlaySelectedAtom],
    ['getOverlayHiddenAtom', getOverlayHiddenAtom],
  ] as const)(
    '%s returns the same atom for a key every time, and a different atom for every other key',
    (_name, get) => {
      const first = rowKeys.map(([type, index]) => get(type, index));
      const second = rowKeys.map(([type, index]) => get(type, index));

      for (const [position, atom] of first.entries()) expect(second[position]).toBe(atom);
      // Same index on the other schedule is a different key: row 2 on Extras must not share Standard row 2's atom
      expect(new Set(first).size).toBe(rowKeys.length);
    }
  );

  it.each([
    ['getOverlayActiveForTypeAtom', getOverlayActiveForTypeAtom],
    ['getOverlaySelectedIndexForTypeAtom', getOverlaySelectedIndexForTypeAtom],
  ] as const)('%s returns the same atom per schedule, and a different one for each schedule', (_name, get) => {
    expect(get(ScheduleType.Standard)).toBe(get(ScheduleType.Standard));
    expect(get(ScheduleType.Extra)).toBe(get(ScheduleType.Extra));
    expect(get(ScheduleType.Standard)).not.toBe(get(ScheduleType.Extra));
  });

  it('keeps the selected and the hidden atom of one row apart', () => {
    for (const [type, index] of rowKeys) {
      expect(getOverlaySelectedAtom(type, index)).not.toBe(getOverlayHiddenAtom(type, index));
    }
  });
});
