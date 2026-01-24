import { StyleSheet, View, ViewStyle, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import ICON_PATHS from '@/assets/icons/icons';
import { TEXT } from '@/shared/constants';
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
            <Path d="M0 12 L12 3.5 Q15 1 18 3.5 L30 12 Z" fill="#251d45" />
            {/* Border stroke - only left and right edges, not bottom */}
            <Path
              d="M0 12 L12 3.5 Q15 1 18 3.5 L30 12"
              fill="none"
              stroke="rgba(139, 92, 246, 0.3)"
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
              <Path fill="#c4b5fd" d={ICON_PATHS[AlertIcon.INFO]} />
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
            <Path d="M0 0 L12 8.5 Q15 11 18 8.5 L30 0 Z" fill="#251d45" />
            {/* Border stroke - only left and right edges, not top */}
            <Path
              d="M0 0 L12 8.5 Q15 11 18 8.5 L30 0"
              fill="none"
              stroke="rgba(139, 92, 246, 0.3)"
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
    marginBottom: -1,
    zIndex: 1,
  },
  arrowContainerBottom: {
    alignItems: 'center',
    marginTop: -1,
    zIndex: 1,
  },
  infoBox: {
    backgroundColor: '#251d45',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    minWidth: 300,
    padding: 18,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  iconWrapper: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    color: '#ede9fe',
    fontSize: TEXT.size,
    fontFamily: TEXT.family.medium,
  },
  infoExplanation: {
    color: '#c4b5fd',
    fontSize: TEXT.sizeSmall,
    fontFamily: TEXT.family.regular,
    lineHeight: 22,
    marginBottom: 14,
  },
  infoExplanationArabic: {
    color: '#c4b5fd',
    fontSize: 15,
    fontFamily: TEXT.family.regular,
    textAlign: 'right',
    lineHeight: 24,
  },
});
