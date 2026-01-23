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
      {/* Triangle arrow pointing up - with border effect */}
      {isArrowOnTop && (
        <View style={styles.arrowContainerTop}>
          <View style={styles.arrowBorderUp} />
          <View style={styles.arrowFillUp} />
        </View>
      )}

      {/* Info box */}
      <View style={[styles.infoBox, isArrowOnTop ? styles.infoBoxTopArrow : styles.infoBoxBottomArrow]}>
        {/* Header with icon and title */}
        <View style={styles.infoHeader}>
          <Svg width={17} height={17} viewBox="0 0 128 128">
            <Path fill="#d0e0ff" d={ICON_PATHS[AlertIcon.INFO]} />
          </Svg>
          <Text style={styles.infoTitle}>{prayerName}</Text>
        </View>

        {/* English explanation */}
        <Text style={styles.infoExplanation}>{explanation}</Text>

        {/* Arabic explanation */}
        <Text style={styles.infoExplanationArabic}>{toArabicNumbers(explanationArabic)}</Text>
      </View>

      {/* Triangle arrow pointing down - with border effect */}
      {!isArrowOnTop && (
        <View style={styles.arrowContainerBottom}>
          <View style={styles.arrowBorderDown} />
          <View style={styles.arrowFillDown} />
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
  // Arrow at top (pointing up)
  arrowContainerTop: {
    alignItems: 'center',
    marginBottom: -1,
  },
  arrowBorderUp: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderBottomWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#3b3977',
  },
  arrowFillUp: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#1e1b4b',
    position: 'absolute',
    top: 1,
  },
  // Arrow at bottom (pointing down)
  arrowContainerBottom: {
    alignItems: 'center',
    marginTop: -1,
  },
  arrowBorderDown: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderTopWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#3b3977',
  },
  arrowFillDown: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1e1b4b',
    position: 'absolute',
    bottom: 1,
  },
  infoBox: {
    backgroundColor: '#1e1b4b',
    borderRadius: 12,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#3b3977',
    paddingVertical: 18,
    paddingHorizontal: 20,
    minWidth: 300,
  },
  infoBoxTopArrow: {
    borderBottomWidth: 1,
    borderTopWidth: 0,
  },
  infoBoxBottomArrow: {
    borderTopWidth: 1,
    borderBottomWidth: 0,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  infoTitle: {
    color: '#d0e0ff',
    fontSize: TEXT.size,
    fontFamily: TEXT.family.medium,
  },
  infoExplanation: {
    color: '#a6c4ff',
    fontSize: TEXT.sizeSmall,
    fontFamily: TEXT.family.regular,
    marginBottom: 12,
    lineHeight: 22,
  },
  infoExplanationArabic: {
    color: '#a6c4ff',
    fontSize: 16,
    fontFamily: TEXT.family.regular,
    textAlign: 'right',
    marginTop: 6,
  },
});
