/**
 * The hidden texts that measure each list's longest name, and the list each measured width is stored for
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';

import { englishWidthExtraAtom, englishWidthStandardAtom } from '@/stores/ui';

import InitialWidthMeasurement from '../InitialWidthMeasurement';

// The prayer rows read the widths from these atoms; there is no getter for them
const store = getDefaultStore();

describe('the name measurement mounted at launch, on a fresh install', () => {
  // Columns: the name laid out, the list its width belongs to, and the other list, which stays unmeasured
  it.each([
    ['Sunrise', englishWidthStandardAtom, englishWidthExtraAtom],
    ['Last Third', englishWidthExtraAtom, englishWidthStandardAtom],
  ])('stores the laid-out width of %s for its own list only', async (name, ownList, otherList) => {
    await render(<InitialWidthMeasurement />);

    await fireEvent(screen.getByText(name), 'layout', { nativeEvent: { layout: { width: 88.5 } } });

    expect(store.get(ownList)).toBe(88.5);
    expect(store.get(otherList)).toBe(0);
  });
});
