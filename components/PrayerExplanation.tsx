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
  style?: ViewStyle;
}

export default function PrayerExplanation({
  prayerName,
  explanation,
  explanationArabic,
  style,
}: PrayerExplanationProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Triangle arrow pointing up - with border effect */}
      <View style={styles.arrowContainer}>
        <View style={styles.arrowBorder} />
        <View style={styles.arrowFill} />
      </View>

      {/* Info box */}
      <View style={styles.infoBox}>
        {/* Header with icon and title */}
        <View style={styles.infoHeader}>
          <Svg width={20} height={20} viewBox="0 0 128 128">
            <Path fill="#a5b4fc" d={ICON_PATHS[AlertIcon.INFO]} />
          </Svg>
          <Text style={styles.infoTitle}>{prayerName}</Text>
        </View>

        {/* English explanation */}
        <Text style={styles.infoExplanation}>{explanation}</Text>

        {/* Arabic explanation */}
        <Text style={styles.infoExplanationArabic}>{toArabicNumbers(explanationArabic)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
  },
  arrowContainer: {
    alignItems: 'center',
    marginBottom: -1,
  },
  arrowBorder: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderBottomWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#312e81',
  },
  arrowFill: {
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
  infoBox: {
    backgroundColor: '#1e1b4b',
    borderRadius: 12,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopWidth: 0,
    borderColor: '#312e81',
    paddingVertical: 18,
    paddingHorizontal: 20,
    minWidth: 300,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  infoTitle: {
    color: '#e0e7ff',
    fontSize: TEXT.size,
    fontFamily: TEXT.family.medium,
  },
  infoExplanation: {
    color: '#c7d2fe',
    fontSize: TEXT.sizeSmall,
    fontFamily: TEXT.family.regular,
    marginBottom: 12,
    lineHeight: 22,
  },
  infoExplanationArabic: {
    color: '#a5b4fc',
    fontSize: 16,
    fontFamily: TEXT.family.regular,
    textAlign: 'right',
    marginTop: 6,
  },
});
