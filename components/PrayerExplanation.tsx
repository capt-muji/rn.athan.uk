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
    <>
      {/* Arrow pointing up */}
      <View style={[styles.arrow, style]}>
        <Svg width={15} height={15} viewBox="0 0 330.002 330.002">
          <Path fill="#a5b4fc" d={ICON_PATHS[AlertIcon.ARROW_UP]} />
        </Svg>
      </View>

      {/* Info box */}
      <View style={[styles.infoBox, style]}>
        {/* Header with icon and title */}
        <View style={styles.infoHeader}>
          <Svg width={22} height={22} viewBox="0 0 128 128">
            <Path fill="#a5b4fc" d={ICON_PATHS[AlertIcon.INFO]} />
          </Svg>
          <Text style={styles.infoTitle}>{prayerName}</Text>
        </View>

        {/* English explanation */}
        <Text style={styles.infoExplanation}>{explanation}</Text>

        {/* Arabic explanation */}
        <Text style={styles.infoExplanationArabic}>{toArabicNumbers(explanationArabic)}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  arrow: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 1,
  },
  infoBox: {
    position: 'absolute',
    backgroundColor: '#1e1b4b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#312e81',
    padding: 18,
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
