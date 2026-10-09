/**
 * The box explaining an Extras prayer: its words, its Arabic digits, and which side of the box its arrow is drawn on
 */

import { render, screen, within } from '@testing-library/react-native';
import type { TestInstance } from 'test-renderer';

import { EXTRAS_ENGLISH, EXTRAS_EXPLANATIONS, EXTRAS_EXPLANATIONS_ARABIC } from '@/shared/constants';

import PrayerExplanation from '../Explanation';

const MIDNIGHT = 0;
const SUHOOR = 2;

/** The box's two parts top to bottom: the arrow and the info box, in the order they are drawn */
const drawnParts = (): TestInstance[] =>
  (screen.root?.children ?? []).filter((child): child is TestInstance => typeof child !== 'string');

describe('the explanation box of an Extras prayer', () => {
  it('names the prayer and explains it in English', async () => {
    await render(
      <PrayerExplanation
        prayerName={EXTRAS_ENGLISH[MIDNIGHT]}
        explanation={EXTRAS_EXPLANATIONS[MIDNIGHT]}
        explanationArabic={EXTRAS_EXPLANATIONS_ARABIC[MIDNIGHT]}
      />
    );

    expect(screen.getByText('Midnight')).toBeOnTheScreen();
    expect(screen.getByText('Halfway between Magrib and Fajr')).toBeOnTheScreen();
  });

  it('writes the numbers of the Arabic explanation in Arabic-Indic digits', async () => {
    await render(
      <PrayerExplanation
        prayerName={EXTRAS_ENGLISH[SUHOOR]}
        explanation={EXTRAS_EXPLANATIONS[SUHOOR]}
        explanationArabic={EXTRAS_EXPLANATIONS_ARABIC[SUHOOR]}
      />
    );

    expect(screen.getByText('٢٠ دقيقة قبل الفجر')).toBeOnTheScreen();
  });

  it('asks a screen reader to announce it politely, since it appears without taking focus', async () => {
    await render(
      <PrayerExplanation
        prayerName={EXTRAS_ENGLISH[MIDNIGHT]}
        explanation={EXTRAS_EXPLANATIONS[MIDNIGHT]}
        explanationArabic={EXTRAS_EXPLANATIONS_ARABIC[MIDNIGHT]}
      />
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
        prayerName={EXTRAS_ENGLISH[MIDNIGHT]}
        explanation={EXTRAS_EXPLANATIONS[MIDNIGHT]}
        explanationArabic={EXTRAS_EXPLANATIONS_ARABIC[MIDNIGHT]}
        arrowPosition={arrowPosition}
      />
    );

    const parts = drawnParts();
    expect(parts).toHaveLength(2);
    expect(within(parts[boxPart]).getByText('Midnight')).toBeOnTheScreen();
    expect(within(parts[1 - boxPart]).queryByText('Midnight')).not.toBeOnTheScreen();
  });
});
