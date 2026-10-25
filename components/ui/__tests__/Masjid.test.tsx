/**
 * The mosque icon: which art it draws in and out of the Ramadan season, and the splash gate its bitmap lifts
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';
import { StyleSheet } from 'react-native';

import { setActiveLocale } from '@/shared/i18n/locale';
import { createPrayerDatetime } from '@/shared/time';
import { decorationsEnabledAtom, masjidIconLoadedAtom } from '@/stores/ui';

import Masjid from '../Masjid';

const store = getDefaultStore();

// The icon has no role or label to be found by, so the image is read as the one child of what the component renders
const drawnImage = () => screen.root?.children[0] as NonNullable<typeof screen.root>;

describe('the mosque icon', () => {
  // Columns: the art drawn, the situation, the London date (read at noon), and whether decorations are on. Ramadan
  // 1448 falls in February 2027, and the settings sheet's toggle writes the preference through its atom: there is no
  // store setter for it
  it.each([
    ['the Ramadan mosque', 'in Ramadan with decorations on', '2027-02-20', true, /\/masjid-ramadan\.png$/],
    ['the plain mosque', 'in Ramadan with decorations turned off', '2027-02-20', false, /\/masjid\.png$/],
    ['the plain mosque', 'outside Ramadan', '2026-09-11', true, /\/masjid\.png$/],
  ])('draws %s %s', async (_art, _situation, date, decorationsOn, file) => {
    jest.useFakeTimers({ now: createPrayerDatetime(date, '12:00') });
    store.set(decorationsEnabledAtom, decorationsOn);

    await render(<Masjid />);

    expect(drawnImage()).toHaveProp('source', [{ testUri: expect.stringMatching(file) }]);
  });

  // The launch screen reads this atom to decide when to hide the splash; there is no getter for it
  it('keeps the splash held while its bitmap is still loading', async () => {
    await render(<Masjid />);

    expect(store.get(masjidIconLoadedAtom)).toBe(false);
  });

  // Columns: how the load goes, and the events the platform sends for it, in order
  it.each([
    ['succeeds', ['load', 'loadEnd']],
    ['fails', ['error', 'loadEnd']],
  ])('lifts the splash gate when its bitmap load %s', async (_outcome, events) => {
    await render(<Masjid />);

    for (const event of events) await fireEvent(drawnImage(), event);

    expect(store.get(masjidIconLoadedAtom)).toBe(true);
  });

  // The size is the caller's, as the error screen passes it, not a design value restated
  it('draws the image at the height and width its caller passes', async () => {
    await render(<Masjid height={65} width={60} />);

    expect(drawnImage()).toHaveStyle({ height: 65, width: 60 });
  });
});

// The mark faces inwards under RTL: the whole image flips on the locale's own direction, both art variants on one rule
describe('the mosque icon under the Arabic locale', () => {
  beforeEach(() => {
    setActiveLocale('ar');
  });

  afterEach(() => {
    setActiveLocale('en');
  });

  it('mirrors the mark under the Arabic locale', async () => {
    await render(<Masjid />);

    expect(drawnImage()).toHaveStyle({ transform: [{ scaleX: -1 }] });
  });

  it('mirrors the Ramadan variant under the Arabic locale on the same rule', async () => {
    jest.useFakeTimers({ now: createPrayerDatetime('2027-02-20', '12:00') });
    store.set(decorationsEnabledAtom, true);

    await render(<Masjid />);

    expect(drawnImage()).toHaveProp('source', [{ testUri: expect.stringMatching(/\/masjid-ramadan\.png$/) }]);
    expect(drawnImage()).toHaveStyle({ transform: [{ scaleX: -1 }] });
  });
});

describe('the mosque icon under the English locale', () => {
  it('draws the mark unmirrored under the English locale', async () => {
    setActiveLocale('en');

    await render(<Masjid />);

    expect(StyleSheet.flatten(drawnImage().props.style).transform).toBeUndefined();
  });
});
