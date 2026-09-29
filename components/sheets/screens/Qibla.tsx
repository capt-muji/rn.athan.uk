import { useCallback, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import {
  IOSReferenceFrame,
  SensorType,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedSensor,
  useSharedValue,
} from 'react-native-reanimated';

import Dial from '@/components/qibla/Dial';
import { IconView } from '@/components/ui';
import { readDeclination, readPosition } from '@/device/qibla';
import { COLORS, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { dialAngleFromYaw, qiblaBearing } from '@/shared/qibla';
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
const HINT = 'Point the top of the phone at the marker. Move away from metal and magnets if it will not settle.';

/** The sensor streams faster than this; 100ms is six frames of the dial, which reads as continuous */
const SENSOR_INTERVAL_MS = 100;

/**
 * What iOS yaw needs before it is a bearing, beyond the sign
 *
 * Under `XTrueNorthZVertical` yaw turns about the vertical axis from a reference near half a turn from the bearing the
 * top edge points at. Read off the dial rather than derived, and the direction was confirmed by moving it the wrong
 * way first: 170 pushed the marker further clockwise, so the correction grows rather than shrinks.
 */
const IOS_AXIS_CORRECTION = 190;

/**
 * Feeds the dial from the OS-fused rotation vector
 *
 * It carries the gyroscope, which `expo-location`'s heading does not: measured 71 degrees out on a phone where this
 * reads 10. Mounted only while the sheet is open, because `useAnimatedSensor` subscribes for the life of its component
 * and every sheet is mounted from launch.
 */
const HeadingSensor = ({ heading, correction }: { heading: SharedValue<number>; correction: SharedValue<number> }) => {
  const rotation = useAnimatedSensor(SensorType.ROTATION, {
    interval: SENSOR_INTERVAL_MS,
    // Reanimated's default frame is ARBITRARY on iOS: yaw zero lands wherever the phone woke up, so a compass built on
    // it points at nothing. This is the only frame that references north.
    iosReferenceFrame: IOSReferenceFrame.XTrueNorthZVertical,
  });

  useAnimatedReaction(
    () => rotation.sensor.value.yaw,
    (yaw) => {
      heading.value = dialAngleFromYaw(heading.value, yaw, correction.value);
    }
  );

  return null;
};

/**
 * The qibla compass
 *
 * The bearing is arithmetic and exact; the needle comes from the OS-fused rotation sensor, so the screen states the
 * number and never claims the needle.
 */
export default function BottomSheetQibla() {
  const [isOpen, setIsOpen] = useState(false);
  const [reading, setReading] = useState<Reading>({ status: 'looking' });
  /** Unbounded on purpose: an interpolation runs between the numbers it is given, so a wrapped angle spins the dial */
  const heading = useSharedValue(0);
  /** iOS needs the axis quarter turn; Android is magnetic-referenced and needs the declination instead */
  const correction = useSharedValue(Platform.OS === 'ios' ? IOS_AXIS_CORRECTION : 0);

  // Keyed on presentation, never on mount: every sheet is mounted from launch, so a mount-keyed read would run on
  // every device, forever, for a screen the user may never open.
  const handlePresent = useCallback(async () => {
    setReading({ status: 'looking' });
    setIsOpen(true);

    const position = await readPosition();
    setReading(position ? { status: 'found', bearing: qiblaBearing(position) } : { status: 'unavailable' });

    // iOS reads from true north already, so correcting it again would bend the needle by twice the declination
    if (Platform.OS === 'android') correction.value = await readDeclination();
  }, [correction]);

  const handleDismiss = useCallback(() => setIsOpen(false), []);

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
      {isOpen && <HeadingSensor heading={heading} correction={correction} />}
      {reading.status === 'found' && <Dial bearing={reading.bearing} heading={heading} />}
      <View style={styles.card}>
        <Text style={styles.reading}>{readingText(reading)}</Text>
        {reading.status === 'found' && <Text style={styles.hint}>{HINT}</Text>}
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
