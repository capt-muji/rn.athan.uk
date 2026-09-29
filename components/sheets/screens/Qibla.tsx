import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import Dial from '@/components/qibla/Dial';
import { IconView } from '@/components/ui';
import { readPosition, watchHeading } from '@/device/qibla';
import { COLORS, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { qiblaBearing, unwrapAngle } from '@/shared/qibla';
import { Icon } from '@/shared/types';
import { setQiblaSheetModal } from '@/stores/ui';

import { Sheet } from '../parts';

/** A bearing once the position is known, and which of the two blank states to show until then */
type Reading = { status: 'looking' | 'unavailable' } | { status: 'found'; bearing: number };

const readingText = (reading: Reading): string => {
  if (reading.status === 'found') return `${Math.round(reading.bearing)}° from north`;

  return reading.status === 'looking' ? 'Finding your position' : 'Your location is not available right now';
};

/** Names the condition and what to do about it, never apologising for the reading and never blaming the phone */
const hintText = (calibrated: boolean): string =>
  calibrated
    ? 'Hold the phone flat for an accurate reading'
    : 'Move the phone in a figure of eight a few times, away from metal and magnets';

/**
 * The qibla compass
 *
 * The bearing is arithmetic and exact; the needle is only as good as the phone's magnetometer, so the screen states
 * the number and never claims the needle.
 */
export default function BottomSheetQibla() {
  const [reading, setReading] = useState<Reading>({ status: 'looking' });
  const [calibrated, setCalibrated] = useState(true);
  /** Unbounded on purpose: an interpolation runs between the numbers it is given, so a wrapped angle spins the dial */
  const heading = useSharedValue(0);
  const stopHeading = useRef<(() => void) | null>(null);

  const releaseSensor = useCallback(() => {
    stopHeading.current?.();
    stopHeading.current = null;
  }, []);

  // Keyed on presentation, never on mount: every sheet is mounted from launch, so a mount-keyed subscription would
  // run on every device, forever, for a screen the user may never open.
  const handlePresent = useCallback(async () => {
    releaseSensor();
    setReading({ status: 'looking' });
    setCalibrated(true);

    const position = await readPosition();
    setReading(position ? { status: 'found', bearing: qiblaBearing(position) } : { status: 'unavailable' });

    stopHeading.current = await watchHeading((sample) => {
      heading.value = unwrapAngle(heading.value, sample.heading);
      setCalibrated(sample.calibrated);
    });
  }, [heading, releaseSensor]);

  return (
    <Sheet
      setRef={setQiblaSheetModal}
      title='Qibla'
      subtitle='The direction of prayer'
      icon={<IconView type={Icon.COMPASS} size={16} color='rgba(165, 180, 252, 0.8)' />}
      snapPoints={['85%']}
      perfName='sheet_qibla'
      onPresent={handlePresent}
      onDismiss={releaseSensor}
      stackBehavior='push'>
      {reading.status === 'found' && <Dial bearing={reading.bearing} heading={heading} />}
      <View style={styles.card}>
        <Text style={styles.reading}>{readingText(reading)}</Text>
        {reading.status === 'found' && <Text style={styles.hint}>{hintText(calibrated)}</Text>}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface.elevated,
    borderRadius: RADIUS.xxl,
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    padding: SPACING.xl,
  },
  reading: {
    color: COLORS.text.secondary,
    fontSize: TEXT.size,
    textAlign: 'center',
  },
  hint: {
    color: COLORS.text.muted,
    fontSize: TEXT.sizeDetail,
    textAlign: 'center',
  },
});
