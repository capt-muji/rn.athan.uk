import { useCallback, useEffect, useRef, useState } from 'react';
import { SensorType, useAnimatedReaction, useAnimatedSensor, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { isShaking, type ShakeSample, shakeMagnitude, shakeProgress, shakeWindow } from '@/shared/qiblaShake';

/** Longest gap credited between two readings, so a backgrounded sheet cannot bank time it never moved for */
const MAX_CREDIT_MS = 200;

export interface QiblaShake {
  /** Whether the whole gesture has been performed. LATCHES: the compass must not close again mid-use */
  hasWaved: boolean;
}

/**
 * Whether the user has actually waved the phone.
 *
 * THE WAVE IS THE GATE ON THE COMPASS, which is the owner's requirement. It is not decoration: the figure of
 * eight is the standard hard-iron re-estimation, and the hint asked for it while nothing checked it happened.
 * Measured over 300 runs per case, a waved phone opened the old settling gate at 3.7s with 11.88 degrees of
 * error against a still phone's 9.7s and 2.98, because waving fills the settling window with the user's own
 * motion and its two halves average alike. So the instruction made the reading worse for those who followed it.
 * Reading the accelerometer is what separates a user who waved from a window that merely looks settled, and the
 * wait doubles as the time the heading needs to converge behind it.
 *
 * `hasWaved` LATCHES because the gesture is a one-time entry condition: re-testing it would take the compass
 * away the moment the user held the phone still to read it, which is exactly when they need it.
 */
export const useQiblaShake = (active: boolean): QiblaShake => {
  const [hasWaved, setHasWaved] = useState(false);
  // State is a render behind on the sampling path, which would let the gate publish itself twice
  const wavedRef = useRef(false);

  const onWaved = useCallback(() => {
    if (wavedRef.current) return;
    wavedRef.current = true;
    setHasWaved(true);
  }, []);

  // 20ms: the figure's own turns happen in a few hundred milliseconds, and a slower read would miss the moments
  // the wrist reverses, which are what tell a wave from a phone being carried
  const accelerometer = useAnimatedSensor(SensorType.ACCELEROMETER, { interval: 20 });

  /**
   * The whole gesture is judged ON THE UI THREAD, which crosses to JS exactly once: when it opens.
   *
   * MEASURED on the owner's phones: a `runOnJS` per reading made the gate take 3 seconds on an iPhone XS and
   * 8 on a OnePlus 3T for a gesture asking half a second. Every reading was a separate cross-thread dispatch
   * queued behind the figure-eight animation, so readings arrived far slower than the 50Hz the sensor was
   * registered at, and `windowMs / minReadings` needs 20 a second to call the window valid at all. Below that
   * `isShaking` is false on every sample however hard the phone is waved, and the gate opens only when the JS
   * thread happens to free up. Here the readings never leave the thread they arrive on.
   */
  const samples = useSharedValue<ShakeSample[]>([]);
  const movingMs = useSharedValue(0);
  const lastAt = useSharedValue(0);

  useAnimatedReaction(
    () => {
      const { x, y, z } = accelerometer.sensor.value;

      return shakeMagnitude(x, y, z);
    },
    (magnitude, previous) => {
      if (magnitude === previous || !active) return;

      const nowMs = Date.now();
      const window = shakeWindow([...samples.value, { magnitude, atMs: nowMs }], nowMs);
      samples.value = window;

      const since = lastAt.value;
      lastAt.value = nowMs;
      if (isShaking(window) && since !== 0) movingMs.value += Math.min(nowMs - since, MAX_CREDIT_MS);

      if (shakeProgress(movingMs.value) < 1) return;

      samples.value = [];
      movingMs.value = 0;
      lastAt.value = 0;
      scheduleOnRN(onWaved);
    },
    [active, onWaved]
  );

  // A fresh wave is asked for every time the sheet opens, because the calibration it performs goes stale with
  // the room the phone is standing in
  useEffect(() => {
    if (active) return;

    samples.value = [];
    movingMs.value = 0;
    lastAt.value = 0;
    wavedRef.current = false;
    setHasWaved(false);
  }, [active, samples, movingMs, lastAt]);

  return { hasWaved };
};
