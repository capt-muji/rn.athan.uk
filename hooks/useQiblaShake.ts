import { useCallback, useEffect, useRef, useState } from 'react';
import { runOnJS, SensorType, useAnimatedReaction, useAnimatedSensor } from 'react-native-reanimated';

import { isShaking, type ShakeSample, shakeMagnitude, shakeProgress, shakeWindow } from '@/shared/qiblaShake';

/** Longest gap credited between two readings, so a backgrounded sheet cannot bank seconds it never moved for */
const MAX_CREDIT_MS = 200;

/**
 * Whether the user has actually waved the phone, and how far through the asked-for wave they are.
 *
 * The calibration hint asked for a figure of eight and nothing checked that it happened, which made the first
 * reading WORSE for the people who followed it: measured over 300 runs per case, a waved phone opened the
 * settling gate at 3.7s and 11.88 degrees of error against a still phone's 9.7s and 2.98, because waving fills
 * the settling window with the user's own motion and its two halves average alike. Watching the accelerometer is
 * what separates a user who waved from a window that merely looks settled.
 *
 * The sensor arms only while `active`, which is only while the hint is on screen, so the accelerometer never runs
 * behind the compass (Performance Design Rule 7).
 */
export const useQiblaShake = (active: boolean): { progress: number; isWaving: boolean } => {
  const [state, setState] = useState({ progress: 0, isWaving: false });
  const samplesRef = useRef<ShakeSample[]>([]);
  const movingMsRef = useRef(0);
  const lastAtRef = useRef<number | null>(null);

  // 20ms: the figure's own turns happen in a few hundred milliseconds, and a slower read would miss the moments
  // the wrist reverses, which are what tell a wave from a phone being carried
  const accelerometer = useAnimatedSensor(SensorType.ACCELEROMETER, { interval: 20 });

  const consume = useCallback(
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
      setState((previous) =>
        previous.progress === progress && previous.isWaving === waving ? previous : { progress, isWaving: waving }
      );
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
      // The reaction runs on the UI runtime, where `consume` is a plain JS function: calling it directly throws
      runOnJS(consume)(magnitude);
    },
    [consume]
  );

  useEffect(() => {
    if (active) return;

    samplesRef.current = [];
    movingMsRef.current = 0;
    lastAtRef.current = null;
    setState({ progress: 0, isWaving: false });
  }, [active]);

  return state;
};
