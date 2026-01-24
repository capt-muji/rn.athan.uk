import { StyleSheet, View, ViewStyle, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import InfoIcon from '@/assets/icons/svg/info.svg';
import { TEXT, COLORS, SIZE, RADIUS, SPACING } from '@/shared/constants';
import { toArabicNumbers } from '@/shared/text';

interface PrayerExplanationProps {
  prayerName: string;
  explanation: string;
  explanationArabic: string;
  arrowPosition?: 'top' | 'bottom';
  style?: ViewStyle;
}

/**
 * Tooltip component explaining extra prayer times
 *
 * Displays a floating info box with prayer name, English explanation,
 * and Arabic explanation. Includes a triangular arrow pointing to
 * the associated prayer row.
 *
 * @param prayerName - Name of the extra prayer (e.g., "Midnight")
 * @param explanation - English explanation text
 * @param explanationArabic - Arabic explanation text (numbers auto-converted to Arabic numerals)
 * @param arrowPosition - Position of the arrow: 'top' (box below row) or 'bottom' (box above row)
 * @param style - Additional ViewStyle for positioning
 */
export default function PrayerExplanation({
  prayerName,
  explanation,
  explanationArabic,
  arrowPosition = 'top',
  style,
}: PrayerExplanationProps) {
  const isArrowOnTop = arrowPosition === 'top';

  return (
    <View style={[styles.container, style]}>
      {/* Triangle arrow pointing up */}
      {isArrowOnTop && (
        <View style={styles.arrowContainerTop}>
          <Svg width={30} height={12} viewBox="0 0 30 12">
            {/* Fill first */}
            <Path d="M0 12 L12 3.5 Q15 1 18 3.5 L30 12 Z" fill={COLORS.surface.elevated} />
            {/* Border stroke - only left and right edges, not bottom */}
            <Path
              d="M0 12 L12 3.5 Q15 1 18 3.5 L30 12"
              fill="none"
              stroke={COLORS.surface.elevatedBorder}
              strokeWidth={1}
              strokeLinecap="round"
            />
          </Svg>
        </View>
      )}

      {/* Info box */}
      <View style={styles.infoBox}>
        {/* Header with icon and title */}
        <View style={styles.infoHeader}>
          <View style={styles.iconWrapper}>
            <InfoIcon width={13} height={13} style={{ color: COLORS.icon.primary }} />
          </View>
          <Text style={styles.infoTitle}>{prayerName}</Text>
        </View>

        {/* English explanation */}
        <Text style={styles.infoExplanation}>{explanation}</Text>

        {/* Arabic explanation */}
        <Text style={styles.infoExplanationArabic}>{toArabicNumbers(explanationArabic)}</Text>
      </View>

      {/* Triangle arrow pointing down */}
      {!isArrowOnTop && (
        <View style={styles.arrowContainerBottom}>
          <Svg width={30} height={12} viewBox="0 0 30 12">
            {/* Fill first */}
            <Path d="M0 0 L12 8.5 Q15 11 18 8.5 L30 0 Z" fill={COLORS.surface.elevated} />
            {/* Border stroke - only left and right edges, not top */}
            <Path
              d="M0 0 L12 8.5 Q15 11 18 8.5 L30 0"
              fill="none"
              stroke={COLORS.surface.elevatedBorder}
              strokeWidth={1}
              strokeLinecap="round"
            />
          </Svg>
        </View>
      )}
    </View>
  );
}

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
    marginBottom: SPACING.mid,
    gap: SPACING.gap,
  },
  iconWrapper: {
    width: SIZE.iconWrapper.md,
    height: SIZE.iconWrapper.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.icon.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    color: COLORS.text.emphasis,
    fontSize: TEXT.size,
    fontFamily: TEXT.family.medium,
  },
  infoExplanation: {
    color: COLORS.icon.primary,
    fontSize: TEXT.sizeSmall,
    fontFamily: TEXT.family.regular,
    lineHeight: TEXT.lineHeight.default,
    marginBottom: SPACING.mid,
  },
  infoExplanationArabic: {
    color: COLORS.icon.primary,
    fontSize: TEXT.sizeArabic,
    fontFamily: TEXT.family.regular,
    textAlign: 'right',
    lineHeight: TEXT.lineHeight.arabic,
  },
});
