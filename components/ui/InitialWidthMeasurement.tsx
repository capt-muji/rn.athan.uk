import { useAtomValue } from 'jotai';
import { Text, StyleSheet } from 'react-native';

import { TEXT, PRAYERS_ENGLISH, EXTRAS_ENGLISH } from '@/shared/constants';
import { getLongestPrayerNameIndex } from '@/shared/prayer';
import { ScheduleType } from '@/shared/types';
import { setEnglishWidth, englishWidthStandardAtom, englishWidthExtraAtom } from '@/stores/ui';

/**
 * Measures the width of the longest prayer name for both standard and extra schedules
 * This component runs during app initialization while splash screen is visible
 * The measured widths are saved to persistent storage and used by all Prayer components
 * to maintain equal column widths across the app
 */
export default function InitialWidthMeasurement() {
  const standardWidth = useAtomValue(englishWidthStandardAtom);
  const extraWidth = useAtomValue(englishWidthExtraAtom);

  return (
    <>
      {/* Hidden text elements only render when we need to calculate the width */}
      {standardWidth === 0 && (
        <Text
          style={styles.hidden}
          onLayout={(e) => setEnglishWidth(ScheduleType.Standard, e.nativeEvent.layout.width)}>
          {PRAYERS_ENGLISH[getLongestPrayerNameIndex(ScheduleType.Standard)]}
        </Text>
      )}
      {extraWidth === 0 && (
        <Text style={styles.hidden} onLayout={(e) => setEnglishWidth(ScheduleType.Extra, e.nativeEvent.layout.width)}>
          {EXTRAS_ENGLISH[getLongestPrayerNameIndex(ScheduleType.Extra)]}
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    pointerEvents: 'none',
    opacity: 0,
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.size,
  },
});
