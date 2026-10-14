/**
 * The box explaining an Extras prayer: its words, its Arabic digits, and which side of the box its arrow is drawn on
 */

import { render, screen, within } from '@testing-library/react-native';
import type { TestInstance } from 'test-renderer';

import { EXTRA_PRAYER_TITLES, EXTRAS_EXPLANATIONS } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { setActiveLocale } from '@/shared/i18n/locale';

import PrayerExplanation from '../Explanation';

const MIDNIGHT = 0;

/** The box's two parts top to bottom: the arrow and the info box, in the order they are drawn */
const drawnParts = (): TestInstance[] =>
  (screen.root?.children ?? []).filter((child): child is TestInstance => typeof child !== 'string');

describe('the explanation box of an Extras prayer', () => {
  it('names the prayer and explains it in one language', async () => {
    await render(
      <PrayerExplanation prayerName={EXTRA_PRAYER_TITLES[MIDNIGHT]} explanation={t(EXTRAS_EXPLANATIONS[MIDNIGHT])} />
    );

    expect(screen.getByText('Midnight')).toBeOnTheScreen();
    expect(screen.getByText('Halfway between Magrib and Fajr')).toBeOnTheScreen();
    expect(screen.queryByText(/[\u0600-\u06FF]/)).not.toBeOnTheScreen();
  });

  it('asks a screen reader to announce it politely, since it appears without taking focus', async () => {
    await render(
      <PrayerExplanation prayerName={EXTRA_PRAYER_TITLES[MIDNIGHT]} explanation={t(EXTRAS_EXPLANATIONS[MIDNIGHT])} />
    );

    expect(screen.root).toHaveProp('accessibilityLiveRegion', 'polite');
  });

  // [arrowPosition, where the arrow is drawn, the part holding the prayer's name]
  it.each<['top' | 'bottom' | undefined, string, number]>([
    [undefined, 'above the box, pointing up at the row', 1],
    ['top', 'above the box, pointing up at the row', 1],
    ['bottom', 'below the box, pointing down at the row', 0],
  ])('with arrowPosition %s draws the arrow %s', async (arrowPosition, _side, boxPart) => {
    await render(
      <PrayerExplanation
        prayerName={EXTRA_PRAYER_TITLES[MIDNIGHT]}
        explanation={t(EXTRAS_EXPLANATIONS[MIDNIGHT])}
        arrowPosition={arrowPosition}
      />
    );

    const parts = drawnParts();
    expect(parts).toHaveLength(2);
    expect(within(parts[boxPart]).getByText('Midnight')).toBeOnTheScreen();
    expect(within(parts[1 - boxPart]).queryByText('Midnight')).not.toBeOnTheScreen();
  });
});

describe('the explanation box under ar', () => {
  it('renders its sentence with the locale\u2019s own digits', async () => {
    setActiveLocale('ar');
    try {
      await render(<PrayerExplanation prayerName={EXTRA_PRAYER_TITLES[2]} explanation={t(EXTRAS_EXPLANATIONS[2])} />);

      // The ar Suhoor sentence carries 20 minutes; the owner\u2019s numeral ruling keeps it Arabic-Indic
      expect(screen.getByText(/\u0662\u0660/)).toBeOnTheScreen();
      expect(screen.queryByText(/^[0-9]$/)).toBeNull();
    } finally {
      setActiveLocale('en');
    }
  });
});
