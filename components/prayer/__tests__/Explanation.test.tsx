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

import PrayerExplanation, { INK_EXIT_REVEAL } from '../Explanation';

const MIDNIGHT = 0;

/** The colour forms the card's interpolations carry: 6-digit hex and rgba(), as channels */
const channelsOf = (colour: string): [number, number, number, number] => {
  if (colour.startsWith('#')) {
    const n = Number.parseInt(colour.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const [r, g, b, a] = (colour.match(/[\d.]+/g) ?? []).map(Number);
  return [r, g, b, a ?? 1];
};

/** interpolateColor's own arithmetic: clamp to the range, then mix per channel */
const mix = (value: number, inputRange: readonly number[], outputRange: readonly string[]): string => {
  const clamp = Math.min(Math.max(value, inputRange[0]), inputRange[inputRange.length - 1]);
  const last = inputRange.length - 1;
  for (let i = 0; i < last; i++) {
    if (clamp <= inputRange[i + 1]) {
      const t = (clamp - inputRange[i]) / (inputRange[i + 1] - inputRange[i]);
      const from = channelsOf(outputRange[i]);
      const to = channelsOf(outputRange[i + 1]);
      const mixed = from.map((channel, n) => Math.round(channel + (to[n] - channel) * t));
      return `rgba(${mixed[0]}, ${mixed[1]}, ${mixed[2]}, ${mixed[3]})`;
    }
  }
  const end = channelsOf(outputRange[last]);
  return `rgba(${end[0]}, ${end[1]}, ${end[2]}, ${end[3]})`;
};

/** The live composite under the words, mirrored here from the constants: the veil arriving over
 *  the resting page at the card's band, the face's wash over that - each on the reveal itself */
const bandComposite = (reveal: number): string =>
  mix(
    reveal,
    [0, 1],
    [
      mix(reveal, [0, 1], [COLORS.gradient.overlay.cardBandRest, COLORS.gradient.overlay.cardBand]),
      COLORS.surface.elevated,
    ]
  );

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

  // The coupling the step-7 proof demanded (T-490 revision 2): through the exit tail each ink's
  // colour IS the live composite under the words - the face's wash over the veil arriving over
  // the resting page at the card's band - computed on the same reveal the exit rides. A static
  // end colour cannot match the moving background: through the tail the measured composite runs
  // 22-33+ luma while a pinned constant sits still, and the words read as dark text under their
  // own surround, reaching their end early. The words are opaque paints end to end (T-294):
  // colour only, never opacity
  //
  // The spy carries a real per-channel mix (the published mock's interpolateColor is a no-op), so
  // the component's nested interpolations compute and the guards read values, not just shapes
  const spyInterpolate = () =>
    jest
      .spyOn(Reanimated, 'interpolateColor')
      .mockImplementation(((value: number, inputRange: number[], outputRange: string[]) =>
        mix(value, inputRange, outputRange)) as unknown as typeof Reanimated.interpolateColor);

  const inkOf = (text: string) => (StyleSheet.flatten(screen.getByText(text).props.style) as { color?: string }).color;

  const cardAt = (revealAt: number) => (
    <PrayerExplanation
      prayerName={EXTRA_PRAYER_TITLES[MIDNIGHT]}
      explanation={t(EXTRAS_EXPLANATIONS[MIDNIGHT])}
      reveal={{ value: revealAt } as unknown as SharedValue<number>}
    />
  );

  const placed = async (revealAt: number): Promise<{ title?: string; description?: string }> => {
    await render(cardAt(revealAt));
    return {
      title: inkOf('Midnight'),
      description: inkOf('Halfway between Magrib and Fajr'),
    };
  };

  it.each([0.25, 0.1])('rides the live band composite under the words at reveal %s', async (revealAt) => {
    spyInterpolate();

    const inks = await placed(revealAt);

    expect(inks.title).toBe(bandComposite(revealAt));
    expect(inks.description).toBe(bandComposite(revealAt));
    // Never pinned at either end of the pairing: the tail moves, the ink moves with it
    for (const ink of [inks.title, inks.description]) {
      expect(ink).not.toBe(mix(revealAt, [0, 1], [COLORS.gradient.overlay.cardBand, COLORS.gradient.overlay.cardBand]));
      expect(ink).not.toBe(
        mix(revealAt, [0, 1], [COLORS.gradient.overlay.cardBandRest, COLORS.gradient.overlay.cardBandRest])
      );
    }
  });

  it('keeps each ink moving through the tail, reaching its end only at the cut', async () => {
    spyInterpolate();

    const rendered = await render(cardAt(0.1));
    const deepTitle = inkOf('Midnight');
    const deepDescription = inkOf('Halfway between Magrib and Fajr');

    // The mock runs every updater on each render, so a re-render at another reveal re-reads it
    // without mounting a second tree
    await act(async () => {
      rendered.rerender(cardAt(0.25));
    });

    expect(inkOf('Midnight')).not.toBe(deepTitle);
    expect(inkOf('Halfway between Magrib and Fajr')).not.toBe(deepDescription);
  });

  it('builds the composite from the page/veil pairing and the face wash on the reveal itself', async () => {
    const spy = spyInterpolate();

    await placed(0.25);

    // One page-to-veil mix per ink, riding [0, 1]: the page at rest, the veiled band
    const fields = spy.mock.calls.filter(
      (call) => (call[2] as unknown as readonly string[])[0] === COLORS.gradient.overlay.cardBandRest
    );
    expect(fields).toHaveLength(2);
    for (const call of fields) {
      expect(call[1]).toEqual([0, 1]);
      expect((call[2] as unknown as readonly string[])[1]).toBe(COLORS.gradient.overlay.cardBand);
    }

    // The knee'd rise keeps its shape: below INK_EXIT_REVEAL the composite, the real ink at 1
    const inks = [COLORS.text.emphasis, COLORS.icon.primary];
    const rises = spy.mock.calls.filter((call) => inks.includes((call[2] as unknown as readonly string[])[2]));
    expect(rises.map((call) => (call[2] as unknown as readonly string[])[2])).toEqual(inks);
    for (const call of rises) {
      expect(call[1]).toEqual([0, INK_EXIT_REVEAL, 1]);
    }
  });

  // The design's constants, pinned: the veiled band measured in step 4, the resting band from
  // step 7 (the rows' ink over the screen gradient's start, luma on the recorded box mean L 33.6)
  it('pins the band constants and the knee', () => {
    expect(COLORS.gradient.overlay.cardBand).toBe('#04000d');
    expect(COLORS.gradient.overlay.cardBandRest).toBe('#111e5a');
    expect(INK_EXIT_REVEAL).toBe(0.5);
  });

  it('carries no opacity on either word', async () => {
    await render(
      <PrayerExplanation prayerName={EXTRA_PRAYER_TITLES[MIDNIGHT]} explanation={t(EXTRAS_EXPLANATIONS[MIDNIGHT])} />
    );

    expect(StyleSheet.flatten(screen.getByText('Midnight').props.style).opacity).toBeUndefined();
    expect(StyleSheet.flatten(screen.getByText('Halfway between Magrib and Fajr').props.style).opacity).toBeUndefined();
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
