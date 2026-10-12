/**
 * The hidden texts that measure every name, and the list each measured width is stored for
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';

import { EXTRA_PRAYER_IDS, STANDARD_PRAYER_IDS } from '@/shared/constants';
import { prayerLabel } from '@/shared/i18n';
import { setActiveLocale } from '@/shared/i18n/locale';
import { ScheduleType } from '@/shared/types';
import { nameWidthAtomFor } from '@/stores/ui';

import InitialWidthMeasurement from '../InitialWidthMeasurement';

// The prayer rows read the widths from these atoms; there is no getter for them
const store = getDefaultStore();

describe('the name measurement mounted at launch, on a fresh install', () => {
  // Columns: the name laid out, the list its width belongs to, and the other list, which stays unmeasured
  it.each([
    ['Sunrise', ScheduleType.Standard, ScheduleType.Extra],
    ['Last Third', ScheduleType.Extra, ScheduleType.Standard],
  ])('stores the laid-out width of %s for its own list only', async (name, ownList, otherList) => {
    await render(<InitialWidthMeasurement />);

    await fireEvent(screen.getByText(name), 'layout', { nativeEvent: { layout: { width: 88.5 } } });

    expect(store.get(nameWidthAtomFor(ownList))).toBe(88.5);
    expect(store.get(nameWidthAtomFor(otherList))).toBe(0);
  });
});

describe('the name measurement under Thai, on a fresh install', () => {
  it('measures the widest Thai label of each list and stores it under the Thai width key', async () => {
    setActiveLocale('th');
    await render(<InitialWidthMeasurement />);

    await fireEvent(screen.getByText('ตะวันขึ้น'), 'layout', { nativeEvent: { layout: { width: 120 } } });
    await fireEvent(screen.getByText('ช่วงสุดท้าย'), 'layout', { nativeEvent: { layout: { width: 210 } } });

    expect(store.get(nameWidthAtomFor(ScheduleType.Standard))).toBe(120);
    expect(store.get(nameWidthAtomFor(ScheduleType.Extra))).toBe(210);

    setActiveLocale('en');
  });
});

describe('the name measurement under Arabic, on a fresh install', () => {
  // R7.1: the measure layer reads prayer names only, which carry no digits,
  // so the digit localisation leaves it and the per-locale width keys as they were
  it('measures the widest ar label of each list and stores it under the ar width key', async () => {
    setActiveLocale('ar');
    try {
      await render(<InitialWidthMeasurement />);

      await fireEvent(screen.getByText('الشروق'), 'layout', { nativeEvent: { layout: { width: 95 } } });
      await fireEvent(screen.getByText('نصف الليل'), 'layout', { nativeEvent: { layout: { width: 105 } } });

      expect(store.get(nameWidthAtomFor(ScheduleType.Standard))).toBe(95);
      expect(store.get(nameWidthAtomFor(ScheduleType.Extra))).toBe(105);
    } finally {
      setActiveLocale('en');
    }
  });
});

describe('the hidden measurers', () => {
  it('mounts one measurer per prayer name on both lists', async () => {
    await render(<InitialWidthMeasurement />);

    for (const id of [...STANDARD_PRAYER_IDS, ...EXTRA_PRAYER_IDS]) {
      expect(screen.getByText(prayerLabel(id))).toBeOnTheScreen();
    }
  });

  it('widens the reserve from any single name, not only the longest by characters', async () => {
    await render(<InitialWidthMeasurement />);
    const before = getDefaultStore().get(nameWidthAtomFor(ScheduleType.Standard));

    // A short name with wide glyphs is the Somali defect's shape: its measure must count
    const aShorterName = screen.getByText(prayerLabel('fajr'));
    await fireEvent(aShorterName, 'layout', { nativeEvent: { layout: { width: before + 40 } } });

    expect(getDefaultStore().get(nameWidthAtomFor(ScheduleType.Standard))).toBe(before + 40);
  });
});
