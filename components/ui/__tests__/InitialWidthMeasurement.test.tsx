/**
 * The hidden texts that measure each list's longest name, and the list each measured width is stored for
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';

import { setActiveLocale } from '@/shared/i18n/locale';
import { ScheduleType } from '@/shared/types';
import { englishWidthAtomFor } from '@/stores/ui';

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

    expect(store.get(englishWidthAtomFor(ownList))).toBe(88.5);
    expect(store.get(englishWidthAtomFor(otherList))).toBe(0);
  });
});

describe('the name measurement under Thai, on a fresh install', () => {
  it('measures the widest Thai label of each list and stores it under the Thai width key', async () => {
    setActiveLocale('th');
    await render(<InitialWidthMeasurement />);

    await fireEvent(screen.getByText('ตะวันขึ้น'), 'layout', { nativeEvent: { layout: { width: 120 } } });
    await fireEvent(screen.getByText('ช่วงสุดท้ายของคืน'), 'layout', { nativeEvent: { layout: { width: 210 } } });

    expect(store.get(englishWidthAtomFor(ScheduleType.Standard))).toBe(120);
    expect(store.get(englishWidthAtomFor(ScheduleType.Extra))).toBe(210);

    setActiveLocale('en');
  });
});
