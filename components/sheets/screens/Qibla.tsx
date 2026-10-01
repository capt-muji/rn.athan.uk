import { StyleSheet, Text, View } from 'react-native';

import { IconView } from '@/components/ui';
import { useQibla } from '@/hooks/useQibla';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { COLORS, SIZE, SPACING, TEXT } from '@/shared/constants';
import { Icon } from '@/shared/types';
import { setQiblaSheetModal } from '@/stores/ui';

import { Sheet } from '../parts';
import QiblaCompass from './QiblaCompass';

export default function BottomSheetQibla() {
  const { width } = useWindowDimensions();
  const { bearing, hasHeading, permissionDenied, heading, aligned, start, stop } = useQibla();

  const size = Math.min(width, SIZE.contentMaxWidth) - SPACING.xl * 2;

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
      <View style={[styles.stage, { height: size }]}>
        {/* A dial drawn without a live heading would hold its last angle and quietly point the wrong way, which is
            the one thing this feature must never do */}
        {bearing !== null && hasHeading && (
          <QiblaCompass size={size} bearing={bearing} heading={heading} aligned={aligned} />
        )}
        {permissionDenied && <Text style={styles.message}>The qibla needs your location.</Text>}
      </View>
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
  stage: {
    justifyContent: 'center',
  },
});
