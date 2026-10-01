import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { IOSReferenceFrame, SensorType, useAnimatedSensor } from 'react-native-reanimated';

import { declinationBetween } from '@/shared/qiblaHeading';

/**
 * How often the fused sensor reports, in milliseconds.
 *
 * `expo-location` gates its own heading at 2 degrees and 50ms, which is what made a slow turn arrive
 * as visible steps. One frame's worth is asked for instead.
 */
const SENSOR_INTERVAL_MS = 16;

/**
 * The angle from magnetic to true north here, taken as the platform's OWN difference between the two
 * headings it reports rather than from a constant of ours.
 *
 * ANDROID ONLY, and 0 on iOS: `getOrientation` reports from MAGNETIC north so Android needs this to
 * reach true north, while `XTrueNorthZVertical` means CoreMotion has already applied it. Both
 * platforms therefore end up on their own native true-north reading, which is the whole point.
 *
 * Returns 0 when the platform cannot say, because an unknown declination must leave the reading
 * untouched: a guessed correction is what shipped a reading 90 degrees out.
 *
 * SLOW BY NATURE, so never await it before drawing: it resolves only once `expo-location`'s own
 * magnetometer watch emits, and that watch is gated at 2 degrees and 50ms
 * (`LocationModule.kt:656`), so a phone held still can keep it pending for seconds.
 */
export const readDeclination = async (): Promise<number> => {
  if (Platform.OS !== 'android') return 0;

  try {
    const { trueHeading, magHeading } = await Location.getHeadingAsync();
    if (trueHeading < 0) return 0;

    return declinationBetween(trueHeading, magHeading);
  } catch {
    return 0;
  }
};

/**
 * The phone's orientation from the gyroscope-fused sensor, as a shared value on the UI thread.
 *
 * `SensorType.ROTATION` is Android's `TYPE_ROTATION_VECTOR` and iOS's device motion: the gyroscope
 * carries fast movement while the magnetometer slowly corrects north, which is why it stays smooth
 * where a raw magnetometer wobbles.
 *
 * The reference frame is EXPLICIT because the default `Auto` resolves to an arbitrary yaw zero,
 * wherever the phone happened to wake up, which is a compass that points at nothing.
 *
 * This registers the sensor for as long as its caller is mounted, so the caller must be mounted only
 * while the compass is on screen.
 */
export const useOrientationSensor = () =>
  useAnimatedSensor(SensorType.ROTATION, {
    interval: SENSOR_INTERVAL_MS,
    adjustToInterfaceOrientation: true,
    iosReferenceFrame: IOSReferenceFrame.XTrueNorthZVertical,
  });
