import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { IconView } from '@/components/ui';
import { readPosition, watchHeading } from '@/device/qibla';
import { COLORS, SPACING, TEXT } from '@/shared/constants';
import { qiblaBearing, unwrapAngle } from '@/shared/qibla';
import { Icon } from '@/shared/types';
import { setQiblaSheetModal } from '@/stores/ui';

import { Sheet } from '../parts';

/**
 * The qibla compass
 *
 * The dial and the live needle land in the step after this one. The bearing itself is read here, so the maths is
 * reachable from production rather than sitting behind a test alone.
 */
export default function BottomSheetQibla() {
  const [bearing, setBearing] = useState<number | null>(null);
  /** Unbounded on purpose: an interpolation runs between the numbers it is given, so a wrapped angle spins the dial */
  const heading = useSharedValue(0);
  const stopHeading = useRef<(() => void) | null>(null);

  // Keyed on presentation, never on mount: every sheet is mounted from launch, so a mount-keyed subscription would
  // run on every device, forever, for a screen the user may never open.
  const handlePresent = useCallback(async () => {
    const position = await readPosition();
    setBearing(position ? qiblaBearing(position) : null);

    stopHeading.current = await watchHeading((sample) => {
      heading.value = unwrapAngle(heading.value, sample);
    });
  }, [heading]);

  const handleDismiss = useCallback(() => {
    stopHeading.current?.();
    stopHeading.current = null;
  }, []);

  return (
    <Sheet
      setRef={setQiblaSheetModal}
      title='Qibla'
      subtitle='The direction of prayer'
      icon={<IconView type={Icon.COMPASS} size={16} color='rgba(165, 180, 252, 0.8)' />}
      snapPoints={['85%']}
      perfName='sheet_qibla'
      onPresent={handlePresent}
      onDismiss={handleDismiss}
      stackBehavior='push'>
      <View style={styles.card}>
        <Text style={styles.hint}>
          {bearing === null ? 'Finding your position' : `${Math.round(bearing)}° from north`}
        </Text>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface.elevated,
    borderRadius: 16,
    padding: SPACING.xl,
  },
  hint: {
    color: COLORS.text.secondary,
    fontSize: TEXT.size,
    textAlign: 'center',
  },
});
