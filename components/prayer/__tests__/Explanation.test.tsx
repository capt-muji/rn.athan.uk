/**
 * The box explaining an Extras prayer: its words, its Latin digits, and which side of the box its arrow is drawn on
 */

import { act, render, screen, within } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import * as Reanimated from 'react-native-reanimated';
import type { TestInstance } from 'test-renderer';

import { TIP_OVERLAP } from '@/components/overlay/OverlayInfoBox';
import { COLORS, EXTRA_PRAYER_TITLES, EXTRAS_EXPLANATIONS, SPACING } from '@/shared/constants';
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

/** The arrow's paths whole, so a test can read each path's fill and stroke, not only its d */
const arrowPaths = (parts: TestInstance[], boxPart: number) =>
  parts[1 - boxPart].queryAll((node) => node.type === 'RNSVGPath');

// The native path receives a packed ARGB payload, so the assertions do too
const argbOf = (color: string): number => {
  if (color.startsWith('#')) return 0xff000000 + Number.parseInt(color.slice(1), 16);
  const [r, g, b, a = 1] = (color.match(/[\d.]+/g) ?? []).map(Number);
  return Math.round(a * 255) * 0x1000000 + (r << 16) + (g << 8) + b;
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

describe("the info card's returned outline (owner order 2026-10-30)", () => {
  /** Every coordinate pair in a path's d, in order - the geometry guards read these */
  const pointsOf = (d: unknown): Array<[number, number]> =>
    (String(d).match(/-?[\d.]+ -?[\d.]+/g) ?? []).map((pair) => pair.split(' ').map(Number) as [number, number]);

  const card = async (arrowPosition: 'top' | 'bottom') => {
    await render(
      <PrayerExplanation
        prayerName={EXTRA_PRAYER_TITLES[MIDNIGHT]}
        explanation={t(EXTRAS_EXPLANATIONS[MIDNIGHT])}
        arrowPosition={arrowPosition}
      />
    );
    return arrowOf(drawnParts(), arrowPosition === 'top' ? 1 : 0);
  };

  // The seam diagnosis: the arrow rides as much as a pixel high on Android, so the cover
  // must reach past the band, not just meet it - the skirt is that tolerance
  const SKIRT = 3;

  it('draws the up arrow over an 18-unit viewport, its cover spanning the border band and past it', async () => {
    const { svg, ds } = await card('top');

    expect(svg?.props.width).toBe(36);
    expect(svg?.props.height).toBe(15 + SKIRT);
    // The native view carries the viewBox extracted: user units map one to one on the viewport
    expect(svg?.props.vbWidth).toBe(36);
    expect(svg?.props.vbHeight).toBe(15 + SKIRT);

    // Fill, then the band's cover, then the stroke: the cover sits under the stroke's ink
    expect(ds).toEqual([
      'M0 15 L14.4 4.4 Q18 1.3 21.6 4.4 L36 15 Z',
      'M0 14 L36 14 L36 18 L0 18 Z',
      'M0.68 14.5 L14.4 4.4 Q18 1.3 21.6 4.4 L35.32 14.5',
    ]);
  });

  it('draws the down arrow mirrored, its cover spanning the border band and past it', async () => {
    const { svg, ds } = await card('bottom');

    expect(svg?.props.width).toBe(36);
    expect(svg?.props.height).toBe(15 + SKIRT);
    expect(svg?.props.vbWidth).toBe(36);
    expect(svg?.props.vbHeight).toBe(15 + SKIRT);

    expect(ds).toEqual([
      'M0 3 L14.4 13.6 Q18 16.7 21.6 13.6 L36 3 Z',
      'M0 4 L36 4 L36 0 L0 0 Z',
      'M0.68 3.5 L14.4 13.6 Q18 16.7 21.6 13.6 L35.32 3.5',
    ]);
  });

  it.each<['top' | 'bottom']>([['top'], ['bottom']])(
    'inks the %s arrow with the card colour and the lifted outline token, the slants alone stroked',
    async (position) => {
      await card(position);
      const parts = drawnParts();
      const boxPart = position === 'top' ? 1 : 0;
      const paths = arrowPaths(parts, boxPart);

      expect(paths).toHaveLength(3);
      expect(paths[0].props.fill.payload).toBe(argbOf(COLORS.surface.elevated));
      expect(paths[1].props.fill.payload).toBe(argbOf(COLORS.surface.elevated));
      // The native path receives 'none' extracted to null, as the packed payloads above
      expect(paths[2].props.fill).toBeNull();
      expect(paths[2].props.stroke.payload).toBe(argbOf(COLORS.surface.elevatedOutline));
      expect(paths[2].props.strokeWidth).toBe(1);
      // strokeLinecap's 'round' extracts to its enum value on the native path
      expect(paths[2].props.strokeLinecap).toBe(1);
    }
  );

  it.each<['top' | 'bottom']>([['top'], ['bottom']])(
    'sinks the %s arrow past the card edge by the cover, so the band reads covered while the arrow rides high',
    async (position) => {
      await card(position);
      const parts = drawnParts();
      const boxPart = position === 'top' ? 1 : 0;
      const { ds } = arrowOf(parts, boxPart);

      // The margin deepens by the skirt so the card edge and the tip hold their exact
      // pre-outline places: only the viewport grew
      const margin = StyleSheet.flatten(parts[1 - boxPart].props.style) as {
        marginBottom?: number;
        marginTop?: number;
      };
      const overlap = position === 'top' ? margin.marginBottom : margin.marginTop;
      expect(overlap).toBe(SPACING.overlap - SKIRT);

      // The card's edge sits one unit past the arrow's base row, on SPACING.overlap, unchanged
      const cardEdge = position === 'top' ? 15 + SKIRT + (overlap ?? 0) : -(overlap ?? 0);
      expect(cardEdge).toBe(position === 'top' ? 15 + SPACING.overlap : 3 - SPACING.overlap);

      const cover = pointsOf(ds[1]);
      const ys = cover.map(([, y]) => y);
      const xs = cover.map(([x]) => x);
      expect(Math.min(...xs)).toBe(0);
      expect(Math.max(...xs)).toBe(36);
      // The cover spans from the card's edge inward across the band and SKIRT past it
      expect(ys).toContain(cardEdge);
      expect(position === 'top' ? Math.max(...ys) : Math.min(...ys)).toBe(
        position === 'top' ? cardEdge + 1 + SKIRT : cardEdge - 1 - SKIRT
      );
    }
  );

  it.each<['top' | 'bottom']>([['top'], ['bottom']])(
    'ends the %s slants on the band, never inside the face, and never runs a stroke along the base',
    async (position) => {
      await card(position);
      const parts = drawnParts();
      const { ds } = arrowOf(parts, position === 'top' ? 1 : 0);

      const stroke = pointsOf(ds[2]);
      // The base row: 15 up, 3 down - the band runs between it and the card's edge, and the
      // face's interior starts on the band's far side
      const baseRow = position === 'top' ? 15 : 3;
      const bandCentre = position === 'top' ? baseRow - 0.5 : baseRow + 0.5;
      const depths = stroke.map(([, y]) => y);
      expect(position === 'top' ? Math.max(...depths) : Math.min(...depths)).toBe(bandCentre);

      // The slants end on the band's centre row, where the face border's ink runs
      expect(stroke[0]).toEqual([0.68, bandCentre]);
      expect(stroke[stroke.length - 1]).toEqual([35.32, bandCentre]);

      // No horizontal stroke anywhere: the base carries no line of its own
      for (let i = 1; i < stroke.length; i++) {
        expect(stroke[i][1]).not.toBe(stroke[i - 1][1]);
      }
    }
  );

  it('traces the face with the lifted outline one wide over the card colour', async () => {
    await render(
      <PrayerExplanation prayerName={EXTRA_PRAYER_TITLES[MIDNIGHT]} explanation={t(EXTRAS_EXPLANATIONS[MIDNIGHT])} />
    );

    const box = drawnParts().find((part) => within(part).queryByText('Midnight') !== null);
    const face = box?.children.find((child) => typeof child !== 'string');
    const style = face
      ? (StyleSheet.flatten(face.props.style) as {
          borderColor?: string;
          borderWidth?: number;
          backgroundColor?: string;
        })
      : null;

    expect(style?.borderColor).toBe(COLORS.surface.elevatedOutline);
    expect(style?.borderWidth).toBe(1);
    expect(style?.backgroundColor).toBe(COLORS.surface.elevated);
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
