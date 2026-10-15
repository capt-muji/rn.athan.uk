import { StyleSheet, Text, View, type ViewProps } from 'react-native';
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
}

/**
 * Tooltip component explaining extra prayer times
 *
 * Displays a floating info box with the prayer name and its explanation.
 * Includes a triangular arrow pointing to the associated prayer row.
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
}: PrayerExplanationProps) {
  const isArrowOnTop = arrowPosition === 'top';

  return (
    // Live region: this box is mounted, not navigated to — the overlay reveals
    // it behind a fade with no focus change, so without this a screen-reader
    // user gets no indication that anything appeared. Matches the countdown
    // Bar's treatment (components/countdown/Bar.tsx). Android-only in React
    // Native; VoiceOver has no equivalent declarative prop.
    <View style={[styles.container, style]} accessibilityLiveRegion={'polite'}>
      {/* Triangle arrow pointing up */}
      {isArrowOnTop && (
        <View style={styles.arrowContainerTop}>
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
        </View>
      )}

      {/* Info box */}
      <View style={styles.infoBox}>
        {/* Header with title and icon */}
        <View style={styles.infoHeader}>
          <Text style={styles.infoTitle}>{prayerName}</Text>
          <InfoBadge size={26} glyph={13} color={COLORS.icon.primary} />
        </View>

        {/* Separator */}
        <View style={styles.separator} />

        {/* English explanation */}
        <Text style={styles.infoExplanation}>{explanation}</Text>
      </View>

      {/* Triangle arrow pointing down */}
      {!isArrowOnTop && (
        <View style={styles.arrowContainerBottom}>
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
        </View>
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
    backgroundColor: COLORS.surface.elevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surface.elevatedBorder,
    minWidth: SIZE.tooltip.minWidth,
    padding: SPACING.lg2,
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
