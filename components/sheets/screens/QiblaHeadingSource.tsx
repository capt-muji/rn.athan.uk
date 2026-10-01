import { useAnimatedReaction } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useOrientationSensor } from '@/device/qiblaSensor';
import { headingFromYaw } from '@/shared/qiblaHeading';

interface Props {
  /** The angle from magnetic to true north, which Android needs and iOS has already applied */
  declination: number;
  /** Runs on the JS thread: it fires the haptic and writes state, neither of which a worklet can do */
  onHeading: (heading: number) => void;
}

/**
 * Arms the fused orientation sensor and reports the heading, for as long as it is mounted.
 *
 * It is a component rather than a hook because the sensor registers on mount: every sheet in this app mounts at
 * launch, so a hook called from the screen would run the gyroscope for the life of the process.
 */
export default function QiblaHeadingSource({ declination, onHeading }: Props) {
  const { sensor } = useOrientationSensor();

  useAnimatedReaction(
    () => headingFromYaw(sensor.value.yaw, declination),
    (heading) => scheduleOnRN(onHeading, heading),
    [declination, onHeading]
  );

  return null;
}
