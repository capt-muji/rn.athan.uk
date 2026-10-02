import { useCallback, useEffect, useRef, useState } from 'react';
import { runOnJS, SensorType, useAnimatedReaction, useAnimatedSensor } from 'react-native-reanimated';

import { isShaking, type ShakeSample, shakeMagnitude, shakeProgress, shakeWindow } from '@/shared/qiblaShake';

/** Longest gap credited between two readings, so a backgrounded sheet cannot bank time it never moved for */
const MAX_CREDIT_MS = 200;

export interface QiblaShake {
  /** How much of the asked-for wave is done, from 0 to 1, which the bar under the figure draws */
  progress: number;
  /** Whether the phone is being waved at this moment */
  isWaving: boolean;
  /** Whether the whole gesture has been performed. LATCHES: the compass must not close again mid-use */
  hasWaved: boolean;
  /**
   * Takes one accelerometer magnitude, as the sensor delivers it.
   *
   * Exposed because `useAnimatedReaction` reads the sensor on the UI runtime, which no test can drive: a suite
   * covering the gate pushes readings through this instead, which is the same path the sensor takes.
   */
  consumeSample: (magnitude: number) => void;
}

/**
 * Whether the user has actually waved the phone, and how far through the asked-for wave they are.
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
  const [state, setState] = useState({ progress: 0, isWaving: false, hasWaved: false });
  const samplesRef = useRef<ShakeSample[]>([]);
  const movingMsRef = useRef(0);
  const lastAtRef = useRef<number | null>(null);

  // 20ms: the figure's own turns happen in a few hundred milliseconds, and a slower read would miss the moments
  // the wrist reverses, which are what tell a wave from a phone being carried
  const accelerometer = useAnimatedSensor(SensorType.ACCELEROMETER, { interval: 20 });

  const consumeSample = useCallback(
    (magnitude: number) => {
      if (!active) return;

      const nowMs = Date.now();
      const window = shakeWindow([...samplesRef.current, { magnitude, atMs: nowMs }], nowMs);
      samplesRef.current = window;

      const waving = isShaking(window);
      // Time is credited only while the phone is actually moving, so a user who pauses keeps what they have done
      const since = lastAtRef.current;
      lastAtRef.current = nowMs;
      if (waving && since !== null) movingMsRef.current += Math.min(nowMs - since, MAX_CREDIT_MS);

      const progress = shakeProgress(movingMsRef.current);
      setState((previous) => {
        const hasWaved = previous.hasWaved || progress >= 1;
        if (previous.progress === progress && previous.isWaving === waving && previous.hasWaved === hasWaved) {
          return previous;
        }

        return { progress, isWaving: waving, hasWaved };
      });
    },
    [active]
  );

  useAnimatedReaction(
    () => {
      const { x, y, z } = accelerometer.sensor.value;

      return shakeMagnitude(x, y, z);
    },
    (magnitude, previous) => {
      if (magnitude === previous) return;
      // The reaction runs on the UI runtime, where `consumeSample` is a plain JS function: calling it directly
      // throws "Tried to synchronously call a Remote Function"
      runOnJS(consumeSample)(magnitude);
    },
    [consumeSample]
  );

  // A fresh wave is asked for every time the sheet opens, because the calibration it performs goes stale with
  // the room the phone is standing in
  useEffect(() => {
    if (active) return;

    samplesRef.current = [];
    movingMsRef.current = 0;
    lastAtRef.current = null;
    setState({ progress: 0, isWaving: false, hasWaved: false });
  }, [active]);

  return { ...state, consumeSample };
};
