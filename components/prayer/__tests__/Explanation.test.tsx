/**
 * The box explaining an Extras prayer: its words, its Latin digits, and which side of the box its arrow is drawn on
 */

import { act, render, screen, within } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import * as Reanimated from 'react-native-reanimated';
import type { TestInstance } from 'test-renderer';

import { TIP_OVERLAP } from '@/components/overlay/OverlayInfoBox';
import { COLORS, EXTRA_PRAYER_TITLES, EXTRAS_EXPLANATIONS } from '@/shared/constants';
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

  // The arrow draws 36 by 15, the same curve scaled - its tip sinks 7 into the row band
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
    expect(TIP_OVERLAP).toBe(7);
  });

  it('carries its face as a text-free sibling behind the words, so the reveal fades a view', async () => {
    await render(
      <PrayerExplanation prayerName={EXTRA_PRAYER_TITLES[MIDNIGHT]} explanation={t(EXTRAS_EXPLANATIONS[MIDNIGHT])} />
    );

    const box = drawnParts().find((part) => within(part).queryByText('Midnight') !== null);
    const face = box?.children.find((child) => typeof child !== 'string');
    const style = face ? (StyleSheet.flatten(face.props.style) as { position?: string }) : null;

    // The face holds the card's own background and border, absolutely placed behind the words
    expect(style?.position).toBe('absolute');
    expect(face?.queryAll((node) => node.type === 'Text')).toHaveLength(0);
  });

  // The owner-ordered opacity ramp (T-490 revision 3, comments 4875/4877): after two
  // colour-tween revisions measured as one-frame steps on glass (+113 luma at the
  // open's knee, -115 at the close's, a 60fps recording), the words fade on opacity
  // alone - 0 at the open's start, 1 at settle, 1 to 0 across the close - with their
  // colour the settled constant at every frame. T-294's one scoped exception,
  // restated in the component's doc and in the sweep: these two texts on this path only.
  type Words = { color?: string; opacity?: number };

  const wordsOf = (text: string): Words => StyleSheet.flatten(screen.getByText(text).props.style);

  const cardAt = (revealAt: number) => (
    <PrayerExplanation
      prayerName={EXTRA_PRAYER_TITLES[MIDNIGHT]}
      explanation={t(EXTRAS_EXPLANATIONS[MIDNIGHT])}
      reveal={{ value: revealAt } as unknown as SharedValue<number>}
    />
  );

  const placed = async (revealAt: number): Promise<{ title: Words; description: Words }> => {
    await render(cardAt(revealAt));
    return {
      title: wordsOf('Midnight'),
      description: wordsOf('Halfway between Magrib and Fajr'),
    };
  };

  it.each([0, 0.25, 0.5, 0.75, 1])(
    'rides the reveal %s as a true opacity, its colour the settled constant',
    async (revealAt) => {
      const words = await placed(revealAt);

      expect(words.title.opacity).toBe(revealAt);
      expect(words.description.opacity).toBe(revealAt);
      expect(words.title.color).toBe(COLORS.text.emphasis);
      expect(words.description.color).toBe(COLORS.icon.primary);
    }
  );

  it('moves only the opacity between phases - the colour is constant on the whole ramp', async () => {
    const rendered = await render(cardAt(0.3));
    const dim = { title: wordsOf('Midnight'), description: wordsOf('Halfway between Magrib and Fajr') };

    // The mock runs every updater on each render, so a re-render at another reveal re-reads it
    // without mounting a second tree
    await act(async () => {
      rendered.rerender(cardAt(0.8));
    });

    const bright = { title: wordsOf('Midnight'), description: wordsOf('Halfway between Magrib and Fajr') };
    expect(bright.title.color).toBe(dim.title.color);
    expect(bright.description.color).toBe(dim.description.color);
    expect(bright.title.opacity).not.toBe(dim.title.opacity);
  });

  it('interpolates no colour for either ink - the ramp is opacity alone', async () => {
    const interpolateColor = jest.spyOn(Reanimated, 'interpolateColor');

    await placed(0.5);

    expect(interpolateColor).not.toHaveBeenCalled();
  });

  it('stands fully drawn when carried with no reveal', async () => {
    await render(
      <PrayerExplanation prayerName={EXTRA_PRAYER_TITLES[MIDNIGHT]} explanation={t(EXTRAS_EXPLANATIONS[MIDNIGHT])} />
    );

    expect(wordsOf('Midnight').opacity).toBe(1);
    expect(wordsOf('Halfway between Magrib and Fajr').opacity).toBe(1);
  });

  // The colour revisions' measured pins leave the constants behind dead: no ink
  // interpolates toward any band, so the band itself is gone
  it('carries no band constants for the words', () => {
    expect(COLORS.gradient.overlay).not.toHaveProperty('cardBand');
    expect(COLORS.gradient.overlay).not.toHaveProperty('cardBandRest');
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
