import { StyleSheet, Text } from 'react-native';

import { EXTRA_PRAYER_IDS, STANDARD_PRAYER_IDS, TEXT } from '@/shared/constants';
import { prayerLabel } from '@/shared/i18n';
import { getLongestPrayerNameIndex } from '@/shared/prayer';
import { ScheduleType } from '@/shared/types';
import { setEnglishWidth } from '@/stores/ui';

/**
 * Continuously measures the width of the longest prayer name for both
 * schedules. The hidden texts stay mounted for the app's lifetime and the
 * store accepts only measurements that WIDEN the cached value, so a bad
 * first-launch measure (pre-custom-font fallback metrics are narrower -
 * ISSUES #22) self-heals on the next launch instead of persisting until
 * the user clears data. Two transparent absolutely-positioned Texts cost
 * nothing while mounted.
 */
export default function InitialWidthMeasurement() {
  return (
    <>
      <Text style={styles.hidden} onLayout={(e) => setEnglishWidth(ScheduleType.Standard, e.nativeEvent.layout.width)}>
        {prayerLabel(STANDARD_PRAYER_IDS[getLongestPrayerNameIndex(ScheduleType.Standard)])}
      </Text>
      <Text style={styles.hidden} onLayout={(e) => setEnglishWidth(ScheduleType.Extra, e.nativeEvent.layout.width)}>
        {prayerLabel(EXTRA_PRAYER_IDS[getLongestPrayerNameIndex(ScheduleType.Extra)])}
      </Text>
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
