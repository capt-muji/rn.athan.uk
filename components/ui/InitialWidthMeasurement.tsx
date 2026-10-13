import { StyleSheet, Text } from 'react-native';

import { EXTRA_PRAYER_IDS, STANDARD_PRAYER_IDS, TEXT } from '@/shared/constants';
import { prayerLabel } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import { ScheduleType } from '@/shared/types';
import { typographyFor } from '@/shared/typography';
import { setNameWidth } from '@/stores/ui';

/**
 * Continuously measures the width of every prayer name for both schedules:
 * the widest label in rendered points is the reserve, and character count
 * only approximates it (the Somali report had a shorter wide-glyph name
 * wrapping inside the character-longest's reserve). The hidden texts stay
 * mounted for the app's lifetime and the store accepts only measurements
 * that WIDEN the cached value, so a bad first-launch measure (pre-custom-
 * font fallback metrics are narrower - ISSUES #22) self-heals on the next
 * launch. Transparent absolutely-positioned Texts cost nothing while
 * mounted.
 */
export default function InitialWidthMeasurement() {
  return (
    <>
      {STANDARD_PRAYER_IDS.map((id) => (
        <Text
          key={id}
          style={styles.hidden}
          onLayout={(e) => setNameWidth(ScheduleType.Standard, e.nativeEvent.layout.width)}>
          {prayerLabel(id)}
        </Text>
      ))}
      {EXTRA_PRAYER_IDS.map((id) => (
        <Text
          key={id}
          style={styles.hidden}
          onLayout={(e) => setNameWidth(ScheduleType.Extra, e.nativeEvent.layout.width)}>
          {prayerLabel(id)}
        </Text>
      ))}
    </>
  );
}

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    pointerEvents: 'none',
    opacity: 0,
    fontFamily: ty.familyRegular,
    fontSize: ty.size(TEXT.size),
  },
});
