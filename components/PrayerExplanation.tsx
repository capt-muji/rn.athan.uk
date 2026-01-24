import { StyleSheet, View, ViewStyle, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import ICON_PATHS from '@/assets/icons/icons';
import { TEXT, COLORS, SIZE, RADIUS, SPACING } from '@/shared/constants';
import { AlertIcon } from '@/shared/types';

// Convert English numbers to Arabic numerals
const toArabicNumbers = (text: string): string => {
  const englishToArabic: Record<string, string> = {
    '0': '٠',
    '1': '١',
    '2': '٢',
    '3': '٣',
    '4': '٤',
    '5': '٥',
    '6': '٦',
    '7': '٧',
    '8': '٨',
    '9': '٩',
  };
  return text.replace(/[0-9]/g, (digit) => englishToArabic[digit] || digit);
};

interface PrayerExplanationProps {
  prayerName: string;
  explanation: string;
  explanationArabic: string;
  arrowPosition?: 'top' | 'bottom';
  style?: ViewStyle;
}

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
            <Svg width={13} height={13} viewBox="0 0 128 128">
              <Path fill={COLORS.icon.primary} d={ICON_PATHS[AlertIcon.INFO]} />
            </Svg>
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
