import { StyleSheet, View, type ViewProps } from 'react-native';
import Animated, {
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { InfoBadge } from '@/components/ui';
import { COLORS, RADIUS, SIZE, SPACING, TEXT } from '@/shared/constants';
import { currentLocaleId } from '@/shared/i18n/locale';
import { typographyFor } from '@/shared/typography';

interface PrayerExplanationProps {
  prayerName: string;
  explanation: string;
  arrowPosition?: 'top' | 'bottom';
  style?: ViewProps['style'];
  /** How far the card has revealed: drives the face's fade and the inks' rise from the page. Unveiled by default, so the card stands alone fully drawn */
  reveal?: SharedValue<number>;
}

/**
 * The reveal level at which each ink has completed its fall to the page colour: the words'
 * settled contrast (about 230 luma above the page) dwarfs the face's (about 9), so a linear
 * fall would leave them legible long after the face is imperceptible - the measured ghost.
 * Completing the fall by half the reveal puts their last legible frame where the face still
 * holds half its settled strength (T-490 step 4).
 */
export const INK_EXIT_REVEAL = 0.5;

/**
 * Tooltip component explaining extra prayer times
 *
 * Displays a floating info box with the prayer name and its explanation.
 * Includes a triangular arrow pointing to the associated prayer row.
 *
 * The reveal is carried so no text ever renders through an opacity (T-294): the card's own
 * face - background, border, radius - fades as a text-free view behind the words, and each
 * ink is an opaque paint end to end that falls to the PAGE at the card's band - not to the
 * card's surface, which sits levels above the page and would leave the words themselves a
 * ghost once the face has faded. The fall completes by INK_EXIT_REVEAL, so the words' last
 * legible frame never outlives the face's own perceptibility; the same interpolation read
 * backwards carries the open path, where the words gain colour only over a face already
 * present and settle fully drawn.
 *
 * @param prayerName - Name of the extra prayer (e.g., "Midnight")
 * @param explanation - the explanation text
 * @param arrowPosition - Position of the arrow: 'top' (box below row) or 'bottom' (box above row)
 * @param style - Additional style for positioning
 */
export default function PrayerExplanation({
  prayerName,
  explanation,
  arrowPosition = 'top',
  style,
  reveal,
}: PrayerExplanationProps) {
  const isArrowOnTop = arrowPosition === 'top';
  const unveiled = useSharedValue(1);
  const shown = reveal ?? unveiled;

  const faceStyle = useAnimatedStyle(() => ({ opacity: shown.value }));
  // Each ink's knee'd fall (T-294: colour only, never opacity - the words stay opaque paints):
  // page-coloured below INK_EXIT_REVEAL however long the face lingers, the real ink at 1
  const titleStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      shown.value,
      [0, INK_EXIT_REVEAL, 1],
      [COLORS.gradient.overlay.cardBand, COLORS.gradient.overlay.cardBand, COLORS.text.emphasis]
    ),
  }));
  const explanationStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      shown.value,
      [0, INK_EXIT_REVEAL, 1],
      [COLORS.gradient.overlay.cardBand, COLORS.gradient.overlay.cardBand, COLORS.icon.primary]
    ),
  }));

  return (
    // Live region: this box is mounted, not navigated to — the overlay reveals
    // it behind a fade with no focus change, so without this a screen-reader
    // user gets no indication that anything appeared. Matches the countdown
    // Bar's treatment (components/countdown/Bar.tsx). Android-only in React
    // Native; VoiceOver has no equivalent declarative prop.
    <View style={[styles.container, style]} accessibilityLiveRegion={'polite'}>
      {/* Triangle arrow pointing up */}
      {isArrowOnTop && (
        <Animated.View style={[styles.arrowContainerTop, faceStyle]}>
          <Svg width={36} height={15} viewBox={'0 0 36 15'}>
            {/* Fill first */}
            <Path d={'M0 15 L14.4 4.4 Q18 1.3 21.6 4.4 L36 15 Z'} fill={COLORS.surface.elevated} />
            {/* Border stroke - only left and right edges, not bottom */}
            <Path
              d={'M0 15 L14.4 4.4 Q18 1.3 21.6 4.4 L36 15'}
              fill={'none'}
              stroke={COLORS.surface.elevatedBorder}
              strokeWidth={1}
              strokeLinecap={'round'}
            />
          </Svg>
        </Animated.View>
      )}

      {/* Info box */}
      <View style={styles.infoBox}>
        {/* The card's own face: absolute so it sits behind the words it carries, and text-free
            so its fade is view compositing alone */}
        <Animated.View style={[styles.face, faceStyle]} />
        {/* Header with title and icon */}
        <View style={styles.infoHeader}>
          <Animated.Text style={[styles.infoTitle, titleStyle]}>{prayerName}</Animated.Text>
          <Animated.View style={faceStyle}>
            <InfoBadge size={20} glyph={10} color={COLORS.icon.primary} />
          </Animated.View>
        </View>

        {/* Separator */}
        <Animated.View style={faceStyle}>
          <View style={styles.separator} />
        </Animated.View>

        {/* English explanation */}
        <Animated.Text style={[styles.infoExplanation, explanationStyle]}>{explanation}</Animated.Text>
      </View>

      {/* Triangle arrow pointing down */}
      {!isArrowOnTop && (
        <Animated.View style={[styles.arrowContainerBottom, faceStyle]}>
          <Svg width={36} height={15} viewBox={'0 0 36 15'}>
            {/* Fill first */}
            <Path d={'M0 0 L14.4 10.6 Q18 13.7 21.6 10.6 L36 0 Z'} fill={COLORS.surface.elevated} />
            {/* Border stroke - only left and right edges, not top */}
            <Path
              d={'M0 0 L14.4 10.6 Q18 13.7 21.6 10.6 L36 0'}
              fill={'none'}
              stroke={COLORS.surface.elevatedBorder}
              strokeWidth={1}
              strokeLinecap={'round'}
            />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
  },
  arrowContainerTop: {
    alignItems: 'center',
    marginBottom: SPACING.overlap,
    zIndex: 1,
  },
  arrowContainerBottom: {
    alignItems: 'center',
    marginTop: SPACING.overlap,
    zIndex: 1,
  },
  infoBox: {
    borderRadius: RADIUS.md,
    minWidth: SIZE.tooltip.minWidth,
    padding: SPACING.lg2,
  },
  face: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    bottom: 0,
    backgroundColor: COLORS.surface.elevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surface.elevatedBorder,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.lg,
  },
  separator: {
    height: 0.5,
    backgroundColor: COLORS.surface.elevatedBorder,
    opacity: 0.5,
    marginBottom: SPACING.lg,
  },
  infoTitle: {
    color: COLORS.text.emphasis,
    fontSize: ty.size(TEXT.size),
    fontFamily: ty.familyMedium,
  },
  infoExplanation: {
    color: COLORS.icon.primary,
    fontSize: ty.size(TEXT.sizeSmall),
    fontFamily: ty.familyRegular,
    lineHeight: ty.scriptLineHeight?.(TEXT.sizeSmall) ?? ty.lineHeight(TEXT.lineHeight.default),
  },
});
