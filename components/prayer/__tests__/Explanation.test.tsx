/**
 * The box explaining an Extras prayer: its words, its Latin digits, and which side of the box its arrow is drawn on
 */

import { render, screen, within } from '@testing-library/react-native';
import type { TestInstance } from 'test-renderer';

import { TIP_OVERLAP } from '@/components/overlay/OverlayInfoBox';
import { EXTRA_PRAYER_TITLES, EXTRAS_EXPLANATIONS } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { LOCALE_IDS, setActiveLocale } from '@/shared/i18n/locale';

import PrayerExplanation from '../Explanation';

const MIDNIGHT = 0;

/** The box's two parts top to bottom: the arrow and the info box, in the order they are drawn */
const drawnParts = (): TestInstance[] =>
  (screen.root?.children ?? []).filter((child): child is TestInstance => typeof child !== 'string');

/** The arrow's geometry from its own part: the badge inside the box is an SVG too, so root-wide queries would read it */
const arrowOf = (parts: TestInstance[], boxPart: number): { svg?: TestInstance; ds: unknown[] } => {
  const svg = parts[1 - boxPart].queryAll((node) => node.type === 'RNSVGSvgView')[0];
  const ds = parts[1 - boxPart].queryAll((node) => node.type === 'RNSVGPath').map((node) => node.props.d);
  return { svg, ds };
};

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

  // D106.2: the arrow draws 36 by 15, the same curve scaled - its tip sinks 6 into the row band
  // while the card body keeps its placement arithmetic
  it('draws the up arrow at 36 by 15', async () => {
    await render(
      <PrayerExplanation
        prayerName={EXTRA_PRAYER_TITLES[MIDNIGHT]}
        explanation={t(EXTRAS_EXPLANATIONS[MIDNIGHT])}
        arrowPosition={'top'}
      />
    );

    const { svg, ds } = arrowOf(drawnParts(), 1);
    expect(svg?.props.width).toBe(36);
    expect(svg?.props.height).toBe(15);

    // The fill closes on itself with Z; the border stroke rides the side edges only, unclosed
    expect(ds).toEqual(['M0 15 L14.4 4.4 Q18 1.3 21.6 4.4 L36 15 Z', 'M0 15 L14.4 4.4 Q18 1.3 21.6 4.4 L36 15']);
  });

  it('draws the down arrow at 36 by 15 mirrored', async () => {
    await render(
      <PrayerExplanation
        prayerName={EXTRA_PRAYER_TITLES[MIDNIGHT]}
        explanation={t(EXTRAS_EXPLANATIONS[MIDNIGHT])}
        arrowPosition={'bottom'}
      />
    );

    const { svg, ds } = arrowOf(drawnParts(), 0);
    expect(svg?.props.width).toBe(36);
    expect(svg?.props.height).toBe(15);

    expect(ds).toEqual(['M0 0 L14.4 10.6 Q18 13.7 21.6 10.6 L36 0 Z', 'M0 0 L14.4 10.6 Q18 13.7 21.6 10.6 L36 0']);
  });

  it('overlap-into-the-row constant is 6', () => {
    expect(TIP_OVERLAP).toBe(6);
  });
});

describe('the explanation box under ar', () => {
  it('renders its sentence with Latin digits under ar', async () => {
    setActiveLocale('ar');
    try {
      await render(<PrayerExplanation prayerName={EXTRA_PRAYER_TITLES[2]} explanation={t(EXTRAS_EXPLANATIONS[2])} />);

      // The ar Suhoor sentence carries 20 minutes; row 88 renders every digit Latin
      expect(screen.getByText(t(EXTRAS_EXPLANATIONS[2])).props.children).toBe(t(EXTRAS_EXPLANATIONS[2]));
      expect(screen.getByText(t(EXTRAS_EXPLANATIONS[2])).props.children).not.toMatch(/[\u0660-\u0669]/);
    } finally {
      setActiveLocale('en');
    }
  });
});

describe('the five Extras boxes across the six locales', () => {
  // Row 88: every sentence renders the catalog bytes untouched, digits Latin in every locale
  it.each(EXTRAS_EXPLANATIONS.flatMap((key, prayer) => LOCALE_IDS.map((locale) => ({ key, locale, prayer }))))(
    'renders $key under $locale with the catalog bytes and Latin digits',
    async ({ key, locale, prayer }) => {
      setActiveLocale(locale);
      try {
        await render(<PrayerExplanation prayerName={EXTRA_PRAYER_TITLES[prayer]} explanation={t(key)} />);

        const shown = screen.getByText(t(key));
        expect(shown.props.children).toBe(t(key));
        expect(shown.props.children).not.toMatch(/[\u0660-\u0669]/);
      } finally {
        setActiveLocale('en');
      }
    }
  );
});
