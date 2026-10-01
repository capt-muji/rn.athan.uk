import { StyleSheet, Text, View } from 'react-native';

import { IconView } from '@/components/ui';
import { useQibla } from '@/hooks/useQibla';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { COLORS, SIZE, SPACING, TEXT } from '@/shared/constants';
import { Icon } from '@/shared/types';
import { setQiblaSheetModal } from '@/stores/ui';

import { Sheet } from '../parts';
import QiblaCompass from './QiblaCompass';
import QiblaHeadingSource from './QiblaHeadingSource';

const SPACE_ABOVE_DIAL = SPACING.xxl;
const SPACE_BELOW_DIAL = SPACING.xxxl;

/**
 * The most of the screen's height the dial may take.
 *
 * Sizing it on width alone overflowed the sheet's own 85% cap on a short screen, and the sheet clamps rather
 * than scrolls, so the overflow was taken off the BOTTOM: the place name ended up against the screen edge
 * with its padding cut away. Bounding by height too keeps the whole column inside the cap.
 */
const DIAL_HEIGHT_SHARE = 0.45;

export default function BottomSheetQibla() {
  const { width, height } = useWindowDimensions();
  const {
    active,
    bearing,
    hasHeading,
    permissionDenied,
    place,
    declination,
    heading,
    aligned,
    start,
    stop,
    onHeading,
  } = useQibla();

  const size = Math.min(Math.min(width, SIZE.contentMaxWidth) - SPACING.xl * 2, height * DIAL_HEIGHT_SHARE);
  const showsCompass = bearing !== null && hasHeading;

  return (
    <Sheet
      setRef={setQiblaSheetModal}
      title='Qibla'
      subtitle='Turn until it vibrates'
      icon={<IconView type={Icon.COMPASS} size={16} color='rgba(165, 180, 252, 0.8)' />}
      onPresent={start}
      onDismiss={stop}
      perfName='sheet_qibla'
      scrollable={false}
      enableDynamicSizing
      contentCap={0.85}>
      {/* The stage holds the dial's square from the first frame: a dynamically-sized sheet measures its content, so
          reserving nothing would open it at a sliver and then resize under the user once the fix arrives */}
      <View
        testID='qibla-stage'
        style={[styles.stage, { height: size, marginTop: SPACE_ABOVE_DIAL, marginBottom: SPACE_BELOW_DIAL }]}>
        {/* A dial drawn without a live heading would hold its last angle and quietly point the wrong way, which is
            the one thing this feature must never do */}
        {/* Mounted only while the sheet is open, so the gyroscope is idle every other moment of the process's life */}
        {active && <QiblaHeadingSource declination={declination} onHeading={onHeading} />}
        {showsCompass && <QiblaCompass size={size} bearing={bearing} heading={heading} aligned={aligned} />}
        {permissionDenied && <Text style={styles.message}>The qibla needs your location.</Text>}
      </View>
      {/* Never conditional: the sheet sizes itself from its content, so a line that comes and goes resizes it */}
      <Text style={styles.place} numberOfLines={1}>
        {place ?? ' '}
      </Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  message: {
    color: COLORS.text.secondary,
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.sizeDetail,
    textAlign: 'center',
  },
  place: {
    color: COLORS.text.muted,
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.sizeDetail,
    lineHeight: TEXT.lineHeight.default,
    textAlign: 'center',
  },
  stage: {
    justifyContent: 'center',
  },
});
