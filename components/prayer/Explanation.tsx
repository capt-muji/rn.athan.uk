import { StyleSheet, View, type ViewProps } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
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
  /** How far the card has revealed: drives the face's fade and the words' opacity ramp. Unveiled by default, so the card stands alone fully drawn */
  reveal?: SharedValue<number>;
}

/**
 * How far the arrow's cover reaches past the card's border band into the face, in SVG
 * units: the band under the arrow's base stays covered through the pixel the arrow rides
 * high on Android glass, which is what sliced the T-515 outline's base open (owner order
 * 2026-10-30)
 */
const BASE_COVER = 3;

/**
 * Tooltip component explaining extra prayer times
 *
 * Displays a floating info box with the prayer name and its explanation.
 * Includes a triangular arrow pointing to the associated prayer row.
 *
 * T-294 restated (owner order 2026-10-29): no text renders through an opacity,
 * because translucent glyph ink compounds where strokes overlap - the law
 * stands everywhere except the one scope named here: the info box's title and
 * description ride a TRUE OPACITY on the reveal, 0 at the open's start, 1 at
 * settle, 1 to 0 across the close, their colour constant at every frame. The
 * colour tween the law first forced onto these two texts produced four
 * one-frame steps on glass (a 60fps recording measured +113 luma in a single
 * frame on the open, -115 on the close); presence fades smoothly on opacity
 * alone. No other text rides this exception.
 *
 * T-520 (owner order 2026-10-30): the outline returns as the card's own
 * background lifted a bounded step, one continuous trace around the face and
 * the arrow. The base seam that killed the T-515 outline closes by measure,
 * not by meeting: the SVG viewport grows BASE_COVER units into the card and a
 * full-width cover path spans the border band and reaches past it, so the
 * band under the arrow's base stays covered through the pixel the arrow rides
 * high on Android.
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
  // The scoped T-294 exception named in the component doc: both words ramp
  // their presence on the reveal itself, their colour never moving
  const wordsStyle = useAnimatedStyle(() => ({ opacity: shown.value }));

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
          <Svg width={36} height={15 + BASE_COVER} viewBox={`0 0 36 ${15 + BASE_COVER}`}>
            {/* Fill first */}
            <Path d={'M0 15 L14.4 4.4 Q18 1.3 21.6 4.4 L36 15 Z'} fill={COLORS.surface.elevated} />
            {/* The card's border band under the base, in the card's own colour: it spans the
                band and reaches BASE_COVER past it, so the outline reads through the arrow as
                one trace while the arrow rides as much as a pixel high */}
            <Path d={`M0 14 L36 14 L36 ${15 + BASE_COVER} L0 ${15 + BASE_COVER} Z`} fill={COLORS.surface.elevated} />
            {/* Border stroke - only the slants, ending on the band's centre row so the face
                border's ink and the slant read as one line and no stroke enters the face */}
            <Path
              d={'M0.68 14.5 L14.4 4.4 Q18 1.3 21.6 4.4 L35.32 14.5'}
              fill={'none'}
              stroke={COLORS.surface.elevatedOutline}
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
          <Animated.Text style={[styles.infoTitle, wordsStyle]}>{prayerName}</Animated.Text>
          <Animated.View style={faceStyle}>
            <InfoBadge size={20} glyph={10} color={COLORS.icon.primary} />
          </Animated.View>
        </View>

        {/* Separator */}
        <Animated.View style={faceStyle}>
          <View style={styles.separator} />
        </Animated.View>

        {/* English explanation */}
        <Animated.Text style={[styles.infoExplanation, wordsStyle]}>{explanation}</Animated.Text>
      </View>

      {/* Triangle arrow pointing down */}
      {!isArrowOnTop && (
        <Animated.View style={[styles.arrowContainerBottom, faceStyle]}>
          <Svg width={36} height={15 + BASE_COVER} viewBox={`0 0 36 ${15 + BASE_COVER}`}>
            {/* Fill first */}
            <Path d={'M0 3 L14.4 13.6 Q18 16.7 21.6 13.6 L36 3 Z'} fill={COLORS.surface.elevated} />
            {/* The band cover, mirrored: spans the card's bottom band and reaches past it */}
            <Path d={'M0 4 L36 4 L36 0 L0 0 Z'} fill={COLORS.surface.elevated} />
            {/* Border stroke - only the slants, ending on the band's centre row */}
            <Path
              d={'M0.68 3.5 L14.4 13.6 Q18 16.7 21.6 13.6 L35.32 3.5'}
              fill={'none'}
              stroke={COLORS.surface.elevatedOutline}
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
    // Deepened by the cover so the card's edge holds its exact place: the viewport grew into
    // the card, the arrow's silhouette did not move
    marginBottom: SPACING.overlap - BASE_COVER,
    zIndex: 1,
  },
  arrowContainerBottom: {
    alignItems: 'center',
    marginTop: SPACING.overlap - BASE_COVER,
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
    borderColor: COLORS.surface.elevatedOutline,
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
